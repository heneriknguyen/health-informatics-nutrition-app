const express = require("express");
const cors = require("cors");
const { Pool } = require("pg");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");

const app = express();
app.use(cors());
app.use(express.json());

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false },
});

const JWT_SECRET = process.env.JWT_SECRET || "change_me_in_production";
const SALT_ROUNDS = 10;

// ─── Auth Middleware ──────────────────────────────────────────────────────────
function requireAuth(req, res, next) {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return res.status(401).json({ error: "Missing or invalid token" });
  }
  const token = authHeader.slice(7);
  try {
    const payload = jwt.verify(token, JWT_SECRET);
    req.userId = payload.userId;
    next();
  } catch {
    return res.status(401).json({ error: "Token expired or invalid" });
  }
}

// ─── Auth Routes ──────────────────────────────────────────────────────────────
app.post("/api/auth/register", async (req, res) => {
  const { name, email, password } = req.body;
  if (!name || !email || !password)
    return res.status(400).json({ error: "Name, email, and password are required" });
  if (password.length < 6)
    return res.status(400).json({ error: "Password must be at least 6 characters" });

  try {
    const existing = await pool.query("SELECT id FROM users WHERE email = $1", [email.toLowerCase()]);
    if (existing.rows.length)
      return res.status(409).json({ error: "An account with that email already exists" });

    const password_hash = await bcrypt.hash(password, SALT_ROUNDS);
    const result = await pool.query(
      "INSERT INTO users (name, email, password_hash) VALUES ($1, $2, $3) RETURNING id, name, email",
      [name.trim(), email.toLowerCase(), password_hash]
    );
    const user = result.rows[0];
    const token = jwt.sign({ userId: user.id }, JWT_SECRET, { expiresIn: "30d" });
    res.status(201).json({ token, user: { id: user.id, name: user.name, email: user.email } });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Server error" });
  }
});

app.post("/api/auth/login", async (req, res) => {
  const { email, password } = req.body;
  if (!email || !password)
    return res.status(400).json({ error: "Email and password are required" });

  try {
    const result = await pool.query("SELECT * FROM users WHERE email = $1", [email.toLowerCase()]);
    const user = result.rows[0];
    if (!user) return res.status(401).json({ error: "Invalid email or password" });

    const match = await bcrypt.compare(password, user.password_hash);
    if (!match) return res.status(401).json({ error: "Invalid email or password" });

    const token = jwt.sign({ userId: user.id }, JWT_SECRET, { expiresIn: "30d" });
    res.json({ token, user: { id: user.id, name: user.name, email: user.email } });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Server error" });
  }
});

// ─── Protected Routes (all use req.userId from JWT) ──────────────────────────
app.get("/api/goals", requireAuth, async (req, res) => {
  const result = await pool.query(
    "SELECT * FROM user_goals WHERE user_id = $1",
    [req.userId]
  );
  res.json(result.rows[0] || null);
});

app.put("/api/goals", requireAuth, async (req, res) => {
  const { daily_protein_goal, daily_carbs_goal, daily_fat_goal, daily_calorie_goal } = req.body;
  try {
    const result = await pool.query(
      `INSERT INTO user_goals (user_id, daily_protein_goal, daily_carbs_goal, daily_fat_goal, daily_calorie_goal)
       VALUES ($1, $2, $3, $4, $5)
       ON CONFLICT (user_id) DO UPDATE
         SET daily_protein_goal = $2,
             daily_carbs_goal   = $3,
             daily_fat_goal     = $4,
             daily_calorie_goal = $5
       RETURNING *`,
      [req.userId, daily_protein_goal, daily_carbs_goal, daily_fat_goal, daily_calorie_goal]
    );
    res.json(result.rows[0]);
  } catch {
    res.status(500).json({ error: "Server error" });
  }
});

app.post("/api/meals", requireAuth, async (req, res) => {
  const { name, protein = 0, carbs = 0, fat = 0, calories = 0, date } = req.body;
  if (!name) return res.status(400).json({ error: "Meal name required" });
  try {
    const createdAt = date ? new Date(date) : new Date();
    const result = await pool.query(
      `INSERT INTO meals (user_id, name, protein, carbs, fat, calories, created_at)
       VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING *`,
      [req.userId, name, protein, carbs, fat, calories, createdAt]
    );
    res.status(201).json(result.rows[0]);
  } catch {
    res.status(500).json({ error: "Server error" });
  }
});

app.get("/api/meals", requireAuth, async (req, res) => {
  const date = req.query.date || new Date().toISOString().split("T")[0];
  try {
    const result = await pool.query(
      `SELECT * FROM meals
       WHERE user_id = $1
         AND DATE(created_at AT TIME ZONE 'UTC') = $2
       ORDER BY created_at ASC`,
      [req.userId, date]
    );
    res.json(result.rows);
  } catch {
    res.status(500).json({ error: "Server error" });
  }
});

app.delete("/api/meals/:id", requireAuth, async (req, res) => {
  try {
    const result = await pool.query(
      "DELETE FROM meals WHERE id = $1 AND user_id = $2 RETURNING id",
      [req.params.id, req.userId]
    );
    if (!result.rows.length)
      return res.status(404).json({ error: "Meal not found" });
    res.json({ deleted: result.rows[0].id });
  } catch {
    res.status(500).json({ error: "Server error" });
  }
});

app.get("/api/analytics/daily-totals", requireAuth, async (req, res) => {
  const days = parseInt(req.query.days) || 7;
  try {
    const result = await pool.query(
      `SELECT
         DATE(created_at AT TIME ZONE 'UTC')::text AS day,
         SUM(protein)  AS protein,
         SUM(carbs)    AS carbs,
         SUM(fat)      AS fat,
         SUM(calories) AS calories
       FROM meals
       WHERE user_id = $1
         AND DATE(created_at AT TIME ZONE 'UTC')
             BETWEEN CURRENT_DATE - ($2::int - 1) AND CURRENT_DATE
       GROUP BY DATE(created_at AT TIME ZONE 'UTC')
       ORDER BY day ASC`,
      [req.userId, days]
    );
    res.json(result.rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Server error" });
  }
});

app.get("/api/analytics/feedback", requireAuth, async (req, res) => {
  const numDays = parseInt(req.query.days) || 7;
  try {
    const [goalsRes, totalsRes] = await Promise.all([
      pool.query("SELECT * FROM user_goals WHERE user_id = $1", [req.userId]),
      pool.query(
        `SELECT
           DATE(created_at AT TIME ZONE 'UTC')::text AS day,
           SUM(protein)  AS protein,
           SUM(carbs)    AS carbs,
           SUM(fat)      AS fat,
           SUM(calories) AS calories
         FROM meals
         WHERE user_id = $1
           AND DATE(created_at AT TIME ZONE 'UTC')
               BETWEEN CURRENT_DATE - ($2::int - 1) AND CURRENT_DATE
         GROUP BY DATE(created_at AT TIME ZONE 'UTC')`,
        [req.userId, numDays]
      ),
    ]);

    const goals = goalsRes.rows[0];
    const rows  = totalsRes.rows;
    const feedback = [];

    const hasAnyGoal = goals && (
      goals.daily_protein_goal != null ||
      goals.daily_carbs_goal   != null ||
      goals.daily_fat_goal     != null ||
      goals.daily_calorie_goal != null
    );

    if (!hasAnyGoal || rows.length === 0) {
      return res.json({
        feedback: ["Log at least a week of meals and set your goals to receive personalized feedback."],
      });
    }

    if (goals.daily_protein_goal != null) {
      const lowProteinDays = rows.filter(
        (d) => Number(d.protein) < goals.daily_protein_goal * 0.8
      ).length;
      if (lowProteinDays >= 3) {
        feedback.push(
          `You missed your protein goal on ${lowProteinDays} of the last ${rows.length} days. Try adding eggs, Greek yogurt, or lean meat to your meals.`
        );
      }
    }

    if (goals.daily_carbs_goal != null) {
      const highCarbDays = rows.filter(
        (d) => Number(d.carbs) > goals.daily_carbs_goal * 1.2
      ).length;
      if (highCarbDays >= 3) {
        feedback.push(
          `Your carbohydrate intake exceeded your goal on ${highCarbDays} days recently. Consider swapping refined carbs for vegetables or legumes.`
        );
      }
    }

    if (goals.daily_calorie_goal != null) {
      const avgCalories =
        rows.reduce((sum, d) => sum + Number(d.calories), 0) / rows.length;
      if (avgCalories > goals.daily_calorie_goal * 1.1) {
        feedback.push(
          `Your average daily calorie intake (${Math.round(avgCalories)} kcal) is above your goal. Try reducing portion sizes or high-calorie snacks.`
        );
      } else if (avgCalories < goals.daily_calorie_goal * 0.8) {
        feedback.push(
          `You're averaging ${Math.round(avgCalories)} kcal/day, which is well below your goal. Ensure you're eating enough to fuel your body.`
        );
      }
    }

    if (goals.daily_fat_goal != null) {
      const highFatDays = rows.filter(
        (d) => Number(d.fat) > goals.daily_fat_goal * 1.3
      ).length;
      if (highFatDays >= 3) {
        feedback.push(
          `Fat intake exceeded 130% of your goal on ${highFatDays} days. Consider reducing fried foods or high-fat dairy.`
        );
      }
    }

    if (feedback.length === 0) {
      feedback.push("Great work! Your macros are well-balanced. Keep it up!");
    }

    res.json({ feedback });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Server error" });
  }
});

app.get("/api/health", (_, res) => res.json({ status: "ok" }));

const PORT = process.env.PORT || 4000;
app.listen(PORT, () => console.log(`Server running on ${PORT}`));