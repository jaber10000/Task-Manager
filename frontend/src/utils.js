export const WEEKDAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
export const MONTHS = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December",
];

export const PRIORITIES = [
  { id: "high", label: "High" },
  { id: "medium", label: "Medium" },
  { id: "low", label: "Low" },
];
export const PRIORITY_RANK = { high: 0, medium: 1, low: 2 };

export const CATEGORIES = [
  { id: "work", label: "Work" },
  { id: "study", label: "Study" },
  { id: "personal", label: "Personal" },
];

export const RECURRENCES = [
  { id: "none", label: "No repeat" },
  { id: "daily", label: "Daily" },
  { id: "weekly", label: "Weekly" },
  { id: "monthly", label: "Monthly" },
];

export const ACCENTS = [
  { id: "blue", label: "Blue", a: "#3b6cf6", b: "#6a55f4" },
  { id: "purple", label: "Purple", a: "#7c4dff", b: "#b04ff0" },
  { id: "green", label: "Green", a: "#12a36a", b: "#2bc4a0" },
  { id: "orange", label: "Orange", a: "#ee7d1f", b: "#f2a33a" },
  { id: "pink", label: "Pink", a: "#e5487f", b: "#f0707a" },
];

export const pad = (n) => String(n).padStart(2, "0");

export const toKey = (d) =>
  `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;

export const fromKey = (k) => {
  const [y, m, d] = k.split("-").map(Number);
  return new Date(y, m - 1, d);
};

export const addDaysKey = (key, n) => {
  const d = fromKey(key);
  return toKey(new Date(d.getFullYear(), d.getMonth(), d.getDate() + n));
};

export const formatDate = (key) =>
  fromKey(key).toLocaleDateString("en-US", {
    weekday: "short",
    month: "short",
    day: "numeric",
    year: "numeric",
  });

export const formatShort = (key) =>
  fromKey(key).toLocaleDateString("en-US", { month: "short", day: "numeric" });

export const nowHHMM = (d = new Date()) => `${pad(d.getHours())}:${pad(d.getMinutes())}`;

export const toMinutes = (hhmm) => {
  const [h, m] = hhmm.split(":").map(Number);
  return h * 60 + m;
};

export function formatTime(t) {
  if (!t) return "";
  const [h, m] = t.split(":").map(Number);
  return `${h % 12 || 12}:${pad(m)} ${h >= 12 ? "PM" : "AM"}`;
}

export function isOverdue(task, now = new Date()) {
  if (task.completed || !task.due_date) return false;
  const today = toKey(now);
  if (task.due_date < today) return true;
  return task.due_date === today && !!task.due_time && task.due_time < nowHHMM(now);
}

export const uid = () =>
  Math.random().toString(36).slice(2, 10) + Date.now().toString(36).slice(-4);

export function readStore(key, fallback = null) {
  try {
    const raw = localStorage.getItem(key);
    return raw === null ? fallback : JSON.parse(raw);
  } catch {
    return fallback;
  }
}

export function writeStore(key, value) {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch {
    /* ignore */
  }
}

// Ekdhara koyta din (aaj ba gotokal theke pichone) kono task complete hoyeche
export function computeStreak(tasks, todayKey) {
  const days = new Set(tasks.filter((t) => t.completed && t.completed_on).map((t) => t.completed_on));
  let cursor = days.has(todayKey) ? todayKey : addDaysKey(todayKey, -1);
  let streak = 0;
  while (days.has(cursor)) {
    streak += 1;
    cursor = addDaysKey(cursor, -1);
  }
  return { streak, doneToday: days.has(todayKey) };
}
