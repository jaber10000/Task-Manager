import { useMemo } from "react";
import Icon from "../Icon";
import { WEEKDAYS, addDaysKey, computeStreak, fromKey } from "../utils";

export default function Insights({ tasks, todayKey }) {
  const { streak, doneToday } = useMemo(() => computeStreak(tasks, todayKey), [tasks, todayKey]);

  const week = useMemo(() => {
    const counts = {};
    tasks.forEach((t) => {
      if (t.completed && t.completed_on) counts[t.completed_on] = (counts[t.completed_on] || 0) + 1;
    });

    return Array.from({ length: 7 }, (_, i) => {
      const key = addDaysKey(todayKey, i - 6);
      return {
        key,
        label: WEEKDAYS[fromKey(key).getDay()],
        count: counts[key] || 0,
        isToday: key === todayKey,
      };
    });
  }, [tasks, todayKey]);

  const max = Math.max(1, ...week.map((d) => d.count));
  const total = week.reduce((sum, d) => sum + d.count, 0);

  return (
    <section className="insights-card">
      <div className="streak">
        <span className={streak > 0 ? "streak-icon lit" : "streak-icon"}>
          <Icon name="flame" size={22} />
        </span>
        <div>
          <strong>
            {streak} day{streak === 1 ? "" : "s"} streak
          </strong>
          <small>
            {streak === 0
              ? "Ekta task complete kore streak shuru korun"
              : doneToday
              ? "Darun! Aajker streak safe"
              : "Aaj ekta task complete korle streak thakbe"}
          </small>
        </div>
      </div>

      <div className="week-head">
        <h4>This week</h4>
        <span>{total} completed</span>
      </div>

      <div className="week-chart" role="img" aria-label={`${total} tasks completed in the last 7 days`}>
        {week.map((d) => (
          <div className={d.isToday ? "bar-col today" : "bar-col"} key={d.key} title={`${d.key}: ${d.count}`}>
            <span className="bar-value">{d.count || ""}</span>
            <div className="bar-track">
              <div className="bar" style={{ height: `${(d.count / max) * 100}%` }} />
            </div>
            <span className="bar-label">{d.label}</span>
          </div>
        ))}
      </div>
    </section>
  );
}
