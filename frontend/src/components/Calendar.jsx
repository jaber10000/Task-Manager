import { useMemo, useState } from "react";
import Icon from "../Icon";
import { MONTHS, WEEKDAYS, formatDate, toKey } from "../utils";

export default function Calendar({
  viewMonth,
  onShiftMonth,
  onToday,
  selectedDate,
  onPick,
  dayStats,
  todayKey,
  onMoveTask,
}) {
  const [dropKey, setDropKey] = useState(null);

  const cells = useMemo(() => {
    const y = viewMonth.getFullYear();
    const m = viewMonth.getMonth();
    const offset = new Date(y, m, 1).getDay();
    const days = new Date(y, m + 1, 0).getDate();
    const list = [];
    for (let i = 0; i < offset; i++) list.push(null);
    for (let d = 1; d <= days; d++) list.push(toKey(new Date(y, m, d)));
    return list;
  }, [viewMonth]);

  function handleDrop(e, key) {
    e.preventDefault();
    setDropKey(null);
    const id = Number(e.dataTransfer.getData("text/plain"));
    if (id) onMoveTask(id, key);
  }

  return (
    <section className="calendar-card">
      <div className="cal-head">
        <div>
          <h3>
            {MONTHS[viewMonth.getMonth()]} {viewMonth.getFullYear()}
          </h3>
          <p>Date click korun ba task tene felun</p>
        </div>
        <div className="cal-nav">
          <button onClick={() => onShiftMonth(-1)} aria-label="Previous month">
            <Icon name="left" size={16} />
          </button>
          <button onClick={() => onShiftMonth(1)} aria-label="Next month">
            <Icon name="right" size={16} />
          </button>
        </div>
      </div>

      <div className="cal-grid cal-weekdays">
        {WEEKDAYS.map((d) => (
          <span key={d}>{d}</span>
        ))}
      </div>

      <div className="cal-grid">
        {cells.map((key, i) => {
          if (!key) return <span key={`e${i}`} className="cal-empty" />;

          const stat = dayStats[key];
          const cls = ["cal-day"];
          if (key === todayKey) cls.push("is-today");
          if (key === selectedDate) cls.push("is-selected");
          if (key === dropKey) cls.push("is-drop");

          const dotClass = stat
            ? stat.overdue
              ? "dot has-overdue"
              : stat.pending
              ? "dot has-pending"
              : "dot all-done"
            : "";

          return (
            <button
              key={key}
              className={cls.join(" ")}
              onClick={() => onPick(key)}
              onDragOver={(e) => {
                e.preventDefault();
                if (dropKey !== key) setDropKey(key);
              }}
              onDragLeave={() => setDropKey((cur) => (cur === key ? null : cur))}
              onDrop={(e) => handleDrop(e, key)}
              aria-label={`${formatDate(key)}${stat ? `, ${stat.total} tasks` : ""}`}
            >
              {Number(key.slice(8))}
              {stat && <i className={dotClass} />}
            </button>
          );
        })}
      </div>

      <div className="cal-legend">
        <span>
          <i className="dot has-pending" /> Pending
        </span>
        <span>
          <i className="dot has-overdue" /> Overdue
        </span>
        <span>
          <i className="dot all-done" /> Done
        </span>
        <button onClick={onToday}>Today</button>
      </div>
    </section>
  );
}
