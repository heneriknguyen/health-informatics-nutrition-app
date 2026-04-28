const BASE = import.meta.env.VITE_API_URL || "/api";

export function getToken() {
  return localStorage.getItem("nt_token");
}

export function getUser() {
  try {
    return JSON.parse(localStorage.getItem("nt_user") || "null");
  } catch {
    return null;
  }
}

export function saveSession(token, user) {
  localStorage.setItem("nt_token", token);
  localStorage.setItem("nt_user", JSON.stringify(user));
}

export function clearSession() {
  localStorage.removeItem("nt_token");
  localStorage.removeItem("nt_user");
}

export async function api(path, { method = "GET", body, auth = true } = {}) {
  const headers = { "Content-Type": "application/json" };
  if (auth) {
    const token = getToken();
    if (token) headers["Authorization"] = `Bearer ${token}`;
  }
  const res = await fetch(BASE + path, {
    method,
    headers,
    body: body ? JSON.stringify(body) : undefined,
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || "Request failed");
  return data;
}

export const MACRO_META = {
  protein:  { label: "Protein",  unit: "g",    color: "var(--protein-fg)", bg: "var(--protein-bg)", border: "var(--green-mid)"   },
  carbs:    { label: "Carbs",    unit: "g",    color: "var(--carbs-fg)",   bg: "var(--carbs-bg)",   border: "var(--blue-mid)"    },
  fat:      { label: "Fat",      unit: "g",    color: "var(--fat-fg)",     bg: "var(--fat-bg)",     border: "var(--amber-mid)"   },
  calories: { label: "Calories", unit: "kcal", color: "var(--cal-fg)",     bg: "var(--cal-bg)",     border: "var(--coral-mid)"   },
};