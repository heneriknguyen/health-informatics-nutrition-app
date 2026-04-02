const express = require("express");
const cors = require("cors");
const { Pool } = require("pg");

const app = express();
app.use(cors());
app.use(express.json());

const pool = new Pool({
  host: process.env.DB_HOST || "localhost",
  port: process.env.DB_PORT || 5432,
  user: process.env.DB_USER || "postgres",
  password: process.env.DB_PASSWORD || "password",
  database: process.env.DB_NAME || "nutrition_app",
});

const USER_ID = 1;

app.get("/api/goals", async (req, res) => {
  const result = await pool.query(
    "SELECT * FROM user_goals WHERE user_id = $1",
    [USER_ID]
  );
  res.json(result.rows[0] || null);
});

app.put("/api/goals", async (req, res) => {
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
      [USER_ID, daily_protein_goal, daily_carbs_goal, daily_fat_goal, daily_calorie_goal]
    );
    res.json(result.rows[0]);
  } catch {
    res.status(500).json({ error: "Server error" });
  }
});

app.post("/api/meals", async (req, res) => {
  const { name, protein = 0, carbs = 0, fat = 0, calories = 0, date } = req.body;
  if (!name) return res.status(400).json({ error: "Meal name required" });
  try {
    const createdAt = date ? new Date(date) : new Date();
    const result = await pool.query(
      `INSERT INTO meals (user_id, name, protein, carbs, fat, calories, created_at)
       VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING *`,
      [USER_ID, name, protein, carbs, fat, calories, createdAt]
    );
    res.status(201).json(result.rows[0]);
  } catch {
    res.status(500).json({ error: "Server error" });
  }
});

app.get("/api/meals", async (req, res) => {
  const date = req.query.date || new Date().toISOString().split("T")[0];
  try {
    const result = await pool.query(
      `SELECT * FROM meals
       WHERE user_id = $1
         AND DATE(created_at AT TIME ZONE 'UTC') = $2
       ORDER BY created_at ASC`,
      [USER_ID, date]
    );
    res.json(result.rows);
  } catch {
    res.status(500).json({ error: "Server error" });
  }
});

app.delete("/api/meals/:id", async (req, res) => {
  try {
    const result = await pool.query(
      "DELETE FROM meals WHERE id = $1 AND user_id = $2 RETURNING id",
      [req.params.id, USER_ID]
    );
    if (!result.rows.length)
      return res.status(404).json({ error: "Meal not found" });
    res.json({ deleted: result.rows[0].id });
  } catch {
    res.status(500).json({ error: "Server error" });
  }
});

app.get("/api/analytics/daily-totals", async (req, res) => {
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
      [USER_ID, days]
    );
    res.json(result.rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Server error" });
  }
});

app.get("/api/analytics/feedback", async (req, res) => {
  const numDays = parseInt(req.query.days) || 7;
  try {
    const [goalsRes, totalsRes] = await Promise.all([
      pool.query("SELECT * FROM user_goals WHERE user_id = $1", [USER_ID]),
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
        [USER_ID, numDays]
      ),
    ]);

    const goals = goalsRes.rows[0];
    const rows  = totalsRes.rows;
    const feedback = [];

    if (!goals || rows.length === 0) {
      return res.json({
        feedback: ["Log at least a week of meals and set your goals to receive personalized feedback."],
      });
    }

    const lowProteinDays = rows.filter(
      (d) => Number(d.protein) < goals.daily_protein_goal * 0.8
    ).length;
    if (lowProteinDays >= 3) {
      feedback.push(
        `You missed your protein goal on ${lowProteinDays} of the last ${rows.length} days. Try adding eggs, Greek yogurt, or lean meat to your meals.`
      );
    }

    const highCarbDays = rows.filter(
      (d) => Number(d.carbs) > goals.daily_carbs_goal * 1.2
    ).length;
    if (highCarbDays >= 3) {
      feedback.push(
        `Your carbohydrate intake exceeded your goal on ${highCarbDays} days recently. Consider swapping refined carbs for vegetables or legumes.`
      );
    }

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

    const highFatDays = rows.filter(
      (d) => Number(d.fat) > goals.daily_fat_goal * 1.3
    ).length;
    if (highFatDays >= 3) {
      feedback.push(
        `Fat intake exceeded 130% of your goal on ${highFatDays} days. Consider reducing fried foods or high-fat dairy.`
      );
    }

    if (feedback.length === 0) {
      feedback.push("Great work! Your macros are well-balanced over the past two weeks. Keep it up!");
    }

    res.json({ feedback });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Server error" });
  }
});

app.get("/api/health", (_, res) => res.json({ status: "ok" }));

const PORT = process.env.PORT || 4000;
app.listen(PORT, () => console.log(`API running on port ${PORT}`));