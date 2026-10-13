import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import Icon from "./Icon";
import { api } from "./api";
import Calendar from "./components/Calendar";
import Confetti from "./components/Confetti";
import Insights from "./components/Insights";
import TaskItem from "./components/TaskItem";
import Toast from "./components/Toast";
import {
  ACCENTS,
  CATEGORIES,
  PRIORITIES,
  PRIORITY_RANK,
  RECURRENCES,
  formatDate,
  formatShort,
  isOverdue,
  nowHHMM,
  readStore,
  toKey,
  toMinutes,
  writeStore,
} from "./utils";

const THEME_KEY = "tm_theme";
const ACCENT_KEY = "tm_accent";
const NOTIFY_KEY = "tm_notify";
const NOTIFIED_KEY = "tm_notified";
const UNDO_MS = 5000;

export default function Dashboard({ user, onLogout }) {
  const [now, setNow] = useState(() => new Date());
  const todayKey = toKey(now);

  const [tasks, setTasks] = useState([]);
  const [pendingIds, setPendingIds] = useState(() => new Set());
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  // new task form
  const [title, setTitle] = useState("");
  const [formDate, setFormDate] = useState("");
  const [formTime, setFormTime] = useState("");
  const [formPriority, setFormPriority] = useState("medium");
  const [formCategory, setFormCategory] = useState("personal");
  const [formRecurrence, setFormRecurrence] = useState("none");

  // view
  const [filter, setFilter] = useState("all");
  const [catFilter, setCatFilter] = useState("all");
  const [search, setSearch] = useState("");
  const [sort, setSort] = useState("newest");
  const [selectedDate, setSelectedDate] = useState(() => toKey(new Date()));
  const [viewMonth, setViewMonth] = useState(() => {
    const n = new Date();
    return new Date(n.getFullYear(), n.getMonth(), 1);
  });

  // look and feel
  const [themePref, setThemePref] = useState(() => readStore(THEME_KEY, null));
  const [systemDark, setSystemDark] = useState(
    () => window.matchMedia?.("(prefers-color-scheme: dark)").matches ?? false
  );
  const [accentId, setAccentId] = useState(() => readStore(ACCENT_KEY, "blue"));
  const [paletteOpen, setPaletteOpen] = useState(false);
  const [toast, setToast] = useState(null);
  const [confetti, setConfetti] = useState(0);
  const [notifyOn, setNotifyOn] = useState(() => readStore(NOTIFY_KEY, false));

  const titleRef = useRef(null);
  const searchRef = useRef(null);
  const toastTimer = useRef(null);
  const deleteTimers = useRef({});
  const prevProgress = useRef(null);

  const dark = themePref ? themePref === "dark" : systemDark;
  const accent = ACCENTS.find((a) => a.id === accentId) || ACCENTS[0];

  // ---------- clock (overdue ar midnight-er jonno) ----------
  useEffect(() => {
    const id = setInterval(() => setNow(new Date()), 30000);
    return () => clearInterval(id);
  }, []);

  // ---------- system theme follow ----------
  useEffect(() => {
    const mq = window.matchMedia?.("(prefers-color-scheme: dark)");
    if (!mq) return;
    const onChange = (e) => setSystemDark(e.matches);
    mq.addEventListener("change", onChange);
    return () => mq.removeEventListener("change", onChange);
  }, []);

  function toggleTheme() {
    const next = dark ? "light" : "dark";
    setThemePref(next);
    writeStore(THEME_KEY, next);
  }

  function pickAccent(id) {
    setAccentId(id);
    writeStore(ACCENT_KEY, id);
    setPaletteOpen(false);
  }

  // ---------- toast ----------
  const showToast = useCallback((message, action = null) => {
    clearTimeout(toastTimer.current);
    setToast({ id: Date.now(), message, action });
    toastTimer.current = setTimeout(() => setToast(null), UNDO_MS);
  }, []);

  const closeToast = useCallback(() => {
    clearTimeout(toastTimer.current);
    setToast(null);
  }, []);

  // ---------- load ----------
  const loadTasks = useCallback(async () => {
    try {
      setTasks(await api("/tasks"));
      setError("");
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadTasks();
  }, [loadTasks]);

  // Pending delete gulo server-e commit kore dey (page chhere gele ba logout-e)
  const flushDeletes = useCallback(() => {
    const timers = deleteTimers.current;
    const jobs = Object.keys(timers).map((id) => {
      clearTimeout(timers[id]);
      delete timers[id];
      return api(`/tasks/${id}`, { method: "DELETE", keepalive: true }).catch(() => {});
    });
    return Promise.all(jobs);
  }, []);

  useEffect(() => {
    window.addEventListener("pagehide", flushDeletes);
    return () => {
      window.removeEventListener("pagehide", flushDeletes);
      flushDeletes();
    };
  }, [flushDeletes]);

  // Logout-er age delete gulo pathai, token muchar por pathale 401 hoy
  async function handleLogout() {
    await flushDeletes();
    onLogout();
  }

  // ---------- task actions ----------
  const updateTask = useCallback(async (id, patch) => {
    try {
      const updated = await api(`/tasks/${id}`, { method: "PATCH", body: patch });
      setTasks((old) => old.map((t) => (t.id === updated.id ? updated : t)));
      setError("");
      return updated;
    } catch (err) {
      setError(err.message || "Task update kora jayni.");
      return null;
    }
  }, []);

  async function addTask(e) {
    e.preventDefault();
    const clean = title.trim();
    if (!clean) return;

    const date = formDate || selectedDate || todayKey;

    try {
      const task = await api("/tasks", {
        method: "POST",
        body: {
          title: clean,
          due_date: date,
          due_time: formTime || null,
          priority: formPriority,
          category: formCategory,
          recurrence: formRecurrence,
        },
      });

      setTasks((old) => [task, ...old]);
      setTitle("");
      setFormDate("");
      setFormTime("");
      setFormPriority("medium");
      setFormRecurrence("none");
      setError("");

      // Onno date-e add korle sei date-e niye jai, jate task dekha jay
      if (selectedDate && selectedDate !== date) {
        setSelectedDate(date);
        const d = new Date(date + "T00:00:00");
        setViewMonth(new Date(d.getFullYear(), d.getMonth(), 1));
        showToast(`Task added for ${formatShort(date)}`);
      }
    } catch (err) {
      setError(err.message || "Task add kora jayni.");
    }
  }

  async function toggleTask(task) {
    const completing = !task.completed;
    const updated = await updateTask(task.id, {
      completed: completing,
      completed_on: completing ? todayKey : null,
    });

    if (!updated || !completing) return;

    if (task.recurrence && task.recurrence !== "none") {
      // Server porer tarikher notun task toiri kore, tai list reload
      await loadTasks();
      showToast("Task completed — next one scheduled");
    } else {
      showToast("Task completed", {
        label: "Undo",
        run: () => updateTask(task.id, { completed: false, completed_on: null }),
      });
    }
  }

  function removePending(id) {
    setPendingIds((old) => {
      const next = new Set(old);
      next.delete(id);
      return next;
    });
  }

  function deleteTask(task) {
    setPendingIds((old) => new Set(old).add(task.id));

    deleteTimers.current[task.id] = setTimeout(async () => {
      delete deleteTimers.current[task.id];
      try {
        await api(`/tasks/${task.id}`, { method: "DELETE" });
        setTasks((old) => old.filter((t) => t.id !== task.id));
      } catch {
        setError("Task delete kora jayni.");
      } finally {
        removePending(task.id);
      }
    }, UNDO_MS);

    showToast("Task deleted", {
      label: "Undo",
      run: () => {
        clearTimeout(deleteTimers.current[task.id]);
        delete deleteTimers.current[task.id];
        removePending(task.id);
      },
    });
  }

  async function moveTask(id, key) {
    const task = tasks.find((t) => t.id === id);
    if (!task || task.due_date === key) return;
    const updated = await updateTask(id, { due_date: key });
    if (updated) showToast(`Moved to ${formatShort(key)}`);
  }

  // ---------- derived ----------
  const live = useMemo(() => tasks.filter((t) => !pendingIds.has(t.id)), [tasks, pendingIds]);

  const completed = live.filter((t) => t.completed).length;
  const pending = live.length - completed;
  const overdueCount = live.filter((t) => isOverdue(t, now)).length;
  const progress = live.length ? Math.round((completed / live.length) * 100) : 0;

  const scoped = useMemo(() => {
    let list = selectedDate ? live.filter((t) => t.due_date === selectedDate) : live;
    if (catFilter !== "all") list = list.filter((t) => t.category === catFilter);
    return list;
  }, [live, selectedDate, catFilter]);

  const scopedCounts = {
    all: scoped.length,
    pending: scoped.filter((t) => !t.completed).length,
    completed: scoped.filter((t) => t.completed).length,
    overdue: scoped.filter((t) => isOverdue(t, now)).length,
  };

  const visible = useMemo(() => {
    const q = search.trim().toLowerCase();

    const list = scoped.filter((t) => {
      if (filter === "pending" && t.completed) return false;
      if (filter === "completed" && !t.completed) return false;
      if (filter === "overdue" && !isOverdue(t, now)) return false;
      if (q && !t.title.toLowerCase().includes(q)) return false;
      return true;
    });

    const dueStamp = (t) => `${t.due_date || "9999-99-99"} ${t.due_time || "99:99"}`;
    const sorted = [...list];

    if (sort === "newest") sorted.sort((a, b) => b.id - a.id);
    if (sort === "oldest") sorted.sort((a, b) => a.id - b.id);
    if (sort === "az") sorted.sort((a, b) => a.title.localeCompare(b.title));
    if (sort === "pending") sorted.sort((a, b) => Number(a.completed) - Number(b.completed) || b.id - a.id);
    if (sort === "priority")
      sorted.sort((a, b) => PRIORITY_RANK[a.priority] - PRIORITY_RANK[b.priority] || b.id - a.id);
    if (sort === "due") sorted.sort((a, b) => dueStamp(a).localeCompare(dueStamp(b)));

    return sorted;
  }, [scoped, filter, search, sort, now]);

  const dayStats = useMemo(() => {
    const stats = {};
    live.forEach((t) => {
      if (!t.due_date) return;
      const s = (stats[t.due_date] ||= { total: 0, pending: 0, overdue: 0 });
      s.total += 1;
      if (!t.completed) s.pending += 1;
      if (isOverdue(t, now)) s.overdue += 1;
    });
    return stats;
  }, [live, now]);

  // ---------- confetti jokhon 100% hoy ----------
  useEffect(() => {
    if (loading) return;
    if (prevProgress.current === null) {
      prevProgress.current = progress;
      return;
    }
    if (progress === 100 && live.length > 0 && prevProgress.current < 100) {
      setConfetti((k) => k + 1);
      const id = setTimeout(() => setConfetti(0), 4200);
      prevProgress.current = progress;
      return () => clearTimeout(id);
    }
    prevProgress.current = progress;
  }, [progress, loading, live.length]);

  // ---------- browser notification ----------
  async function toggleNotify() {
    if (typeof Notification === "undefined") {
      showToast("Ei browser-e notification support kore na");
      return;
    }

    if (notifyOn) {
      setNotifyOn(false);
      writeStore(NOTIFY_KEY, false);
      showToast("Reminder bondho kora hoyeche");
      return;
    }

    const permission =
      Notification.permission === "granted" ? "granted" : await Notification.requestPermission();

    if (permission === "granted") {
      setNotifyOn(true);
      writeStore(NOTIFY_KEY, true);
      showToast("Reminder chalu hoyeche (tab khola thakle kaj korbe)");
    } else {
      showToast("Browser settings theke notification allow korun");
    }
  }

  useEffect(() => {
    if (!notifyOn || typeof Notification === "undefined" || Notification.permission !== "granted") return;

    const check = () => {
      const n = new Date();
      const today = toKey(n);
      const nowMin = toMinutes(nowHHMM(n));
      const seen = readStore(NOTIFIED_KEY, {});
      let changed = false;

      tasks.forEach((t) => {
        if (t.completed || !t.due_time || t.due_date !== today) return;
        const diff = nowMin - toMinutes(t.due_time);
        if (diff < 0 || diff > 60) return; // somoy hoyni ba onek age chole geche

        const key = `${t.id}|${t.due_date}|${t.due_time}`;
        if (seen[key]) return;

        seen[key] = today;
        changed = true;
        new Notification("Task due now", { body: t.title, icon: "/icon.svg", tag: key });
      });

      if (changed) {
        Object.keys(seen).forEach((k) => seen[k] !== today && delete seen[k]);
        writeStore(NOTIFIED_KEY, seen);
      }
    };

    check();
    const id = setInterval(check, 30000);
    return () => clearInterval(id);
  }, [tasks, notifyOn]);

  // ---------- calendar helpers ----------
  const shiftMonth = (delta) =>
    setViewMonth((v) => new Date(v.getFullYear(), v.getMonth() + delta, 1));

  const goToday = useCallback(() => {
    const n = new Date();
    setViewMonth(new Date(n.getFullYear(), n.getMonth(), 1));
    setSelectedDate(toKey(n));
  }, []);

  const pickDate = (key) => setSelectedDate((cur) => (cur === key ? null : key));

  // ---------- keyboard shortcuts ----------
  useEffect(() => {
    const onKey = (e) => {
      if (e.metaKey || e.ctrlKey || e.altKey) return;
      const target = e.target;
      if (["INPUT", "TEXTAREA", "SELECT"].includes(target.tagName) || target.isContentEditable) return;

      if (e.key.toLowerCase() === "n") {
        e.preventDefault();
        titleRef.current?.focus();
      } else if (e.key === "/") {
        e.preventDefault();
        searchRef.current?.focus();
      } else if (e.key.toLowerCase() === "t") {
        goToday();
      }
    };

    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [goToday]);

  // ---------- text ----------
  const hour = now.getHours();
  const greeting = hour < 12 ? "Good Morning" : hour < 18 ? "Good Afternoon" : "Good Evening";

  const heading = selectedDate
    ? selectedDate === todayKey
      ? "Today's tasks"
      : formatDate(selectedDate)
    : "All your tasks";

  const navItems = [
    { id: "all", label: "All Tasks", icon: "list", count: live.length },
    { id: "pending", label: "Pending", icon: "clock", count: pending },
    { id: "completed", label: "Completed", icon: "checkCircle", count: completed },
  ];

  const filterChips = [
    ["all", "All", scopedCounts.all],
    ["pending", "Pending", scopedCounts.pending],
    ["completed", "Completed", scopedCounts.completed],
  ];
  if (scopedCounts.overdue > 0) filterChips.push(["overdue", "Overdue", scopedCounts.overdue]);

  return (
    <div
      className={dark ? "layout dark" : "layout"}
      style={{ "--primary": accent.a, "--primary-2": accent.b }}
    >
      <aside className="sidebar">
        <div className="sidebar-brand">
          <div className="brand-mark">
            <Icon name="check" size={22} />
          </div>
          <div className="brand-text">
            <strong>Task Manager</strong>
            <small>Organize • Focus • Achieve</small>
          </div>
        </div>

        <nav className="side-nav">
          <button
            className={filter === "all" && !selectedDate ? "nav-item selected" : "nav-item"}
            onClick={() => {
              setFilter("all");
              setSelectedDate(null);
            }}
          >
            <Icon name="home" /> <em>Dashboard</em>
            <small>{live.length}</small>
          </button>

          {navItems.map((item) => (
            <button
              key={item.id}
              className={filter === item.id && item.id !== "all" ? "nav-item selected" : "nav-item"}
              onClick={() => setFilter(item.id)}
            >
              <Icon name={item.icon} /> <em>{item.label}</em>
              <small>{item.count}</small>
            </button>
          ))}
        </nav>

        <p className="nav-caption">QUICK ACTIONS</p>
        <nav className="side-nav">
          <button className="nav-item" onClick={() => titleRef.current?.focus()}>
            <Icon name="plus" /> <em>Add Task</em>
            <kbd>N</kbd>
          </button>
          <button className="nav-item" onClick={goToday}>
            <Icon name="calendar" /> <em>Go to Today</em>
            <kbd>T</kbd>
          </button>
          <button className="nav-item" onClick={() => setSelectedDate(null)}>
            <Icon name="list" /> <em>Show all dates</em>
          </button>
        </nav>

        <div className="sidebar-bottom">
          <div className="rocket">
            <Icon name="rocket" size={26} />
          </div>
          <h3>
            Small steps,
            <br />
            make big progress.
          </h3>
          <p>Stay focused, keep going!</p>
          <div className="mini-progress">
            <div>
              <span style={{ width: `${progress}%` }} />
            </div>
            <b>{progress}%</b>
          </div>
        </div>
      </aside>

      <main className="main">
        <header className="topbar">
          <label className="search-box">
            <Icon name="search" size={17} />
            <input
              ref={searchRef}
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search tasks..."
              aria-label="Search tasks"
            />
            {search ? (
              <button type="button" className="clear-search" onClick={() => setSearch("")} aria-label="Clear search">
                <Icon name="x" size={14} />
              </button>
            ) : (
              <kbd>/</kbd>
            )}
          </label>

          <div className="top-actions">
            <button
              className={notifyOn ? "round-btn active" : "round-btn"}
              onClick={toggleNotify}
              aria-label="Toggle reminders"
              title={notifyOn ? "Reminders on" : "Turn on reminders"}
            >
              <Icon name="bell" size={18} />
            </button>

            <div className="icon-wrap">
              <button
                className="round-btn"
                onClick={() => setPaletteOpen((o) => !o)}
                aria-label="Accent color"
                title="Accent color"
              >
                <Icon name="palette" size={18} />
              </button>

              {paletteOpen && (
                <>
                  <div className="backdrop" onClick={() => setPaletteOpen(false)} />
                  <div className="popover">
                    <p>Accent color</p>
                    <div className="swatches">
                      {ACCENTS.map((a) => (
                        <button
                          key={a.id}
                          className={a.id === accentId ? "swatch on" : "swatch"}
                          style={{ background: `linear-gradient(135deg, ${a.a}, ${a.b})` }}
                          onClick={() => pickAccent(a.id)}
                          aria-label={a.label}
                          title={a.label}
                        />
                      ))}
                    </div>
                  </div>
                </>
              )}
            </div>

            <button className="theme-toggle" onClick={toggleTheme} aria-label="Toggle theme" title="Light / dark">
              <span className={!dark ? "on" : ""}>
                <Icon name="sun" size={16} />
              </span>
              <span className={dark ? "on" : ""}>
                <Icon name="moon" size={16} />
              </span>
            </button>

            <div className="user-chip">
              <span className="avatar">{user.username[0].toUpperCase()}</span>
              <b>{user.username}</b>
              <button onClick={handleLogout} aria-label="Logout" title="Logout">
                <Icon name="logout" size={16} />
              </button>
            </div>
          </div>
        </header>

        <section className="hero">
          <div className="hero-text">
            <span className="eyebrow">
              {greeting}, {user.username}!
            </span>
            <h1>Make today count.</h1>
            <p>Organize your tasks, stay focused, and get things done.</p>
          </div>
          <div className="hero-art" aria-hidden="true">
            <svg viewBox="0 0 400 140" preserveAspectRatio="none">
              <circle cx="250" cy="70" r="26" className="sun" />
              <path d="M0 140V105l45-30 38 22 52-52 56 46 40-28 60 60 44-34 65 44v47z" className="mt1" />
              <path d="M120 140l60-48 40 28 52-40 70 60 58-30v30z" className="mt2" />
            </svg>
          </div>
          <div className="today-card">
            <span className="today-icon">
              <Icon name="calendar" size={22} />
            </span>
            <div>
              <strong>{now.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}</strong>
              <small>{now.toLocaleDateString("en-US", { weekday: "long" })}</small>
            </div>
          </div>
        </section>

        <section className="stats-grid">
          <article className="stat-card blue-card">
            <span className="stat-icon">
              <Icon name="list" size={24} />
            </span>
            <div>
              <span className="stat-label">Total Tasks</span>
              <strong>{live.length}</strong>
              <small>All tasks in your list</small>
            </div>
          </article>
          <article className="stat-card green-card">
            <span className="stat-icon">
              <Icon name="checkCircle" size={24} />
            </span>
            <div>
              <span className="stat-label">Completed</span>
              <strong>{completed}</strong>
              <small>Tasks finished</small>
            </div>
          </article>
          <article className="stat-card orange-card">
            <span className="stat-icon">
              <Icon name="clock" size={24} />
            </span>
            <div>
              <span className="stat-label">Pending</span>
              <strong>{pending}</strong>
              <small>{overdueCount > 0 ? `${overdueCount} overdue` : "Tasks remaining"}</small>
            </div>
          </article>
        </section>

        <div className="content-grid">
          <div className="left-col">
            <section className="composer">
              <form onSubmit={addTask}>
                <div className="composer-row">
                  <span className="input-icon">
                    <Icon name="plus" size={18} />
                  </span>
                  <input
                    ref={titleRef}
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    placeholder={
                      selectedDate
                        ? `Add a task for ${selectedDate === todayKey ? "today" : formatShort(selectedDate)}...`
                        : "What needs to get done?"
                    }
                    maxLength={200}
                    aria-label="New task title"
                  />
                  <kbd className="hint">N</kbd>
                  <button className="add-button" type="submit">
                    <Icon name="plus" size={16} /> Add Task
                  </button>
                </div>

                <div className="composer-options">
                  <label className="opt" title="Due date">
                    <Icon name="calendar" size={14} />
                    <input
                      type="date"
                      value={formDate || selectedDate || todayKey}
                      onChange={(e) => setFormDate(e.target.value)}
                      aria-label="Due date"
                    />
                  </label>
                  <label className="opt" title="Due time">
                    <Icon name="clock" size={14} />
                    <input type="time" value={formTime} onChange={(e) => setFormTime(e.target.value)} aria-label="Due time" />
                  </label>
                  <label className="opt" title="Priority">
                    <Icon name="flag" size={14} />
                    <select value={formPriority} onChange={(e) => setFormPriority(e.target.value)} aria-label="Priority">
                      {PRIORITIES.map((p) => (
                        <option key={p.id} value={p.id}>
                          {p.label}
                        </option>
                      ))}
                    </select>
                  </label>
                  <label className="opt" title="Category">
                    <Icon name="tag" size={14} />
                    <select value={formCategory} onChange={(e) => setFormCategory(e.target.value)} aria-label="Category">
                      {CATEGORIES.map((c) => (
                        <option key={c.id} value={c.id}>
                          {c.label}
                        </option>
                      ))}
                    </select>
                  </label>
                  <label className="opt" title="Repeat">
                    <Icon name="repeat" size={14} />
                    <select value={formRecurrence} onChange={(e) => setFormRecurrence(e.target.value)} aria-label="Repeat">
                      {RECURRENCES.map((r) => (
                        <option key={r.id} value={r.id}>
                          {r.label}
                        </option>
                      ))}
                    </select>
                  </label>
                </div>
              </form>
            </section>

            <section className="tasks-section">
              <div className="section-heading">
                <div>
                  <h2>{heading}</h2>
                  <p>
                    {selectedDate ? "Showing tasks for the selected date." : "Showing tasks from every date."}
                  </p>
                </div>
                {selectedDate && (
                  <button className="date-chip" onClick={() => setSelectedDate(null)} title="Show all dates">
                    <Icon name="calendar" size={14} /> {selectedDate === todayKey ? "Today" : formatShort(selectedDate)}
                    <Icon name="x" size={13} />
                  </button>
                )}
              </div>

              <div className="filter-bar">
                {filterChips.map(([id, label, count]) => (
                  <button
                    type="button"
                    key={id}
                    className={
                      (filter === id ? "filter-chip active" : "filter-chip") + (id === "overdue" ? " danger" : "")
                    }
                    onClick={() => setFilter(id)}
                  >
                    {label}
                    <span>{count}</span>
                  </button>
                ))}

                <div className="filter-tools">
                  <label className="sort-box">
                    <Icon name="tag" size={13} />
                    <select value={catFilter} onChange={(e) => setCatFilter(e.target.value)} aria-label="Category filter">
                      <option value="all">All categories</option>
                      {CATEGORIES.map((c) => (
                        <option key={c.id} value={c.id}>
                          {c.label}
                        </option>
                      ))}
                    </select>
                  </label>

                  <label className="sort-box">
                    Sort:
                    <select value={sort} onChange={(e) => setSort(e.target.value)}>
                      <option value="newest">Newest</option>
                      <option value="oldest">Oldest</option>
                      <option value="priority">Priority</option>
                      <option value="due">Due date</option>
                      <option value="az">A → Z</option>
                      <option value="pending">Pending first</option>
                    </select>
                  </label>
                </div>
              </div>

              {error && <div className="error-banner">{error}</div>}

              {loading ? (
                <div className="task-list" aria-busy="true" aria-label="Loading tasks">
                  {[0, 1, 2, 3].map((i) => (
                    <div className="skeleton-row" key={i}>
                      <span className="sk sk-check" />
                      <div className="sk-lines">
                        <span className="sk sk-line" />
                        <span className="sk sk-line short" />
                      </div>
                      <span className="sk sk-pill" />
                    </div>
                  ))}
                </div>
              ) : visible.length === 0 ? (
                <div className="empty-state">
                  <div className="empty-symbol">
                    <Icon name="calendar" size={22} />
                  </div>
                  <h3>{scoped.length ? "Nothing to see here" : "A fresh start!"}</h3>
                  <p>
                    {scoped.length
                      ? "Try another filter or search term."
                      : selectedDate
                      ? "No tasks on this date. Add one above!"
                      : "Add your first task above and build some momentum."}
                  </p>
                </div>
              ) : (
                <div className="task-list">
                  {visible.map((task) => (
                    <TaskItem
                      key={task.id}
                      task={task}
                      overdue={isOverdue(task, now)}
                      onToggle={toggleTask}
                      onUpdate={updateTask}
                      onDelete={deleteTask}
                    />
                  ))}
                </div>
              )}
            </section>
          </div>

          <aside className="right-col">
            <Calendar
              viewMonth={viewMonth}
              onShiftMonth={shiftMonth}
              onToday={goToday}
              selectedDate={selectedDate}
              onPick={pickDate}
              dayStats={dayStats}
              todayKey={todayKey}
              onMoveTask={moveTask}
            />

            <Insights tasks={live} todayKey={todayKey} />

            <section className="progress-card">
              <div className="progress-ring" style={{ "--progress": `${progress}%` }}>
                <div>{progress}%</div>
              </div>
              <div className="progress-info">
                <h3>Overall Progress</h3>
                <p>
                  {completed} of {live.length} tasks completed
                </p>
              </div>
              <div className="progress-track">
                <span style={{ width: `${progress}%` }} />
              </div>
              <small>
                {pending === 0 && live.length
                  ? "Everything completed. Amazing!"
                  : "Progress, not perfection. Keep going!"}
              </small>
            </section>
          </aside>
        </div>

        <footer className="footer">Made for focus ♥ One task at a time.</footer>
      </main>

      <Toast toast={toast} onClose={closeToast} />
      {confetti > 0 && <Confetti burstKey={confetti} />}
    </div>
  );
}
