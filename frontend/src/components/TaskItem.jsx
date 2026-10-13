import { useEffect, useRef, useState } from "react";
import Icon from "../Icon";
import {
  CATEGORIES,
  PRIORITIES,
  RECURRENCES,
  formatShort,
  formatTime,
  uid,
} from "../utils";

const label = (list, id) => list.find((x) => x.id === id)?.label || id;

export default function TaskItem({ task, overdue, onToggle, onUpdate, onDelete }) {
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState(false);
  const [text, setText] = useState(task.title);
  const [desc, setDesc] = useState(task.description || "");
  const [subText, setSubText] = useState("");
  const cancelled = useRef(false);

  useEffect(() => setDesc(task.description || ""), [task.description]);

  const subs = task.subtasks || [];
  const subsDone = subs.filter((s) => s.done).length;
  const recurring = task.recurrence && task.recurrence !== "none";

  function saveTitle() {
    if (cancelled.current) {
      cancelled.current = false;
      return;
    }
    const clean = text.trim();
    setEditing(false);
    if (clean && clean !== task.title) onUpdate(task.id, { title: clean });
    else setText(task.title);
  }

  function saveDesc() {
    const clean = desc.trim();
    if (clean !== (task.description || "")) onUpdate(task.id, { description: clean || null });
  }

  function addSub(e) {
    e.preventDefault();
    const clean = subText.trim();
    if (!clean) return;
    onUpdate(task.id, { subtasks: [...subs, { id: uid(), title: clean, done: false }] });
    setSubText("");
  }

  const toggleSub = (id) =>
    onUpdate(task.id, { subtasks: subs.map((s) => (s.id === id ? { ...s, done: !s.done } : s)) });

  const removeSub = (id) => onUpdate(task.id, { subtasks: subs.filter((s) => s.id !== id) });

  const rowClass = ["task-row"];
  if (task.completed) rowClass.push("is-completed");
  if (overdue) rowClass.push("is-overdue");

  const statusClass = task.completed ? "is-done" : overdue ? "is-overdue" : "is-pending";
  const statusText = task.completed ? "Completed" : overdue ? "Overdue" : "Pending";

  return (
    <article className={rowClass.join(" ")}>
      <div
        className="task-main"
        draggable={!editing}
        onDragStart={(e) => {
          e.dataTransfer.setData("text/plain", String(task.id));
          e.dataTransfer.effectAllowed = "move";
        }}
      >
        <label className="check-wrap">
          <input
            type="checkbox"
            checked={!!task.completed}
            onChange={() => onToggle(task)}
            aria-label={`Toggle ${task.title}`}
          />
          <span className="custom-check">
            <Icon name="check" size={13} />
          </span>
        </label>

        <div className="task-content">
          {editing ? (
            <input
              className="edit-input"
              autoFocus
              value={text}
              maxLength={200}
              onChange={(e) => setText(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") saveTitle();
                if (e.key === "Escape") {
                  cancelled.current = true;
                  setText(task.title);
                  setEditing(false);
                }
              }}
              onBlur={saveTitle}
            />
          ) : (
            <span className="task-name">{task.title}</span>
          )}

          <div className="task-meta">
            <span className={`badge p-${task.priority}`}>
              <Icon name="flag" size={11} /> {label(PRIORITIES, task.priority)}
            </span>
            <span className="badge cat">
              <Icon name="tag" size={11} /> {label(CATEGORIES, task.category)}
            </span>
            {recurring && (
              <span className="badge cat">
                <Icon name="repeat" size={11} /> {label(RECURRENCES, task.recurrence)}
              </span>
            )}
            {subs.length > 0 && (
              <span className="badge cat">
                <Icon name="list" size={11} /> {subsDone}/{subs.length}
              </span>
            )}
            {task.description && (
              <span className="badge cat" title="Has a note">
                <Icon name="note" size={11} />
              </span>
            )}
          </div>
        </div>

        <span className="task-date">
          <Icon name="calendar" size={14} />
          {task.due_date ? formatShort(task.due_date) : "No date"}
          {task.due_time && <> · {formatTime(task.due_time)}</>}
        </span>

        <span className={`status-pill ${statusClass}`}>
          <span className="status-dot" />
          {statusText}
        </span>

        <div className="row-actions">
          <button
            className={open ? "icon-button active" : "icon-button"}
            onClick={() => setOpen((v) => !v)}
            aria-label={open ? "Hide details" : "Show details"}
            aria-expanded={open}
            title="Details"
          >
            <span className={open ? "chev open" : "chev"}>
              <Icon name="chevronDown" size={16} />
            </span>
          </button>
          <button
            className="icon-button"
            onMouseDown={(e) => e.preventDefault()}
            onClick={() => {
              setText(task.title);
              setEditing(true);
            }}
            aria-label={`Edit ${task.title}`}
            title="Edit title"
          >
            <Icon name="edit" size={16} />
          </button>
          <button
            className="icon-button danger"
            onClick={() => onDelete(task)}
            aria-label={`Delete ${task.title}`}
            title="Delete task"
          >
            <Icon name="trash" size={16} />
          </button>
        </div>
      </div>

      {open && (
        <div className="task-detail">
          <div className="detail-grid">
            <label className="field">
              <span>Priority</span>
              <select value={task.priority} onChange={(e) => onUpdate(task.id, { priority: e.target.value })}>
                {PRIORITIES.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.label}
                  </option>
                ))}
              </select>
            </label>

            <label className="field">
              <span>Category</span>
              <select value={task.category} onChange={(e) => onUpdate(task.id, { category: e.target.value })}>
                {CATEGORIES.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.label}
                  </option>
                ))}
              </select>
            </label>

            <label className="field">
              <span>Repeat</span>
              <select value={task.recurrence} onChange={(e) => onUpdate(task.id, { recurrence: e.target.value })}>
                {RECURRENCES.map((r) => (
                  <option key={r.id} value={r.id}>
                    {r.label}
                  </option>
                ))}
              </select>
            </label>

            <label className="field">
              <span>Due date</span>
              <input
                type="date"
                value={task.due_date || ""}
                onChange={(e) => e.target.value && onUpdate(task.id, { due_date: e.target.value })}
              />
            </label>

            <label className="field">
              <span>Due time</span>
              <input
                type="time"
                value={task.due_time || ""}
                onChange={(e) => onUpdate(task.id, { due_time: e.target.value || null })}
              />
            </label>
          </div>

          <label className="field">
            <span>Note</span>
            <textarea
              rows={3}
              maxLength={2000}
              value={desc}
              placeholder="Ei task niye kichu likhe rakhun..."
              onChange={(e) => setDesc(e.target.value)}
              onBlur={saveDesc}
            />
          </label>

          <div className="subtasks">
            <span className="field-title">Subtasks</span>

            {subs.map((s) => (
              <div className={s.done ? "subtask-row done" : "subtask-row"} key={s.id}>
                <label className="check-wrap small">
                  <input type="checkbox" checked={s.done} onChange={() => toggleSub(s.id)} aria-label={s.title} />
                  <span className="custom-check">
                    <Icon name="check" size={11} />
                  </span>
                </label>
                <span>{s.title}</span>
                <button type="button" className="sub-remove" onClick={() => removeSub(s.id)} aria-label="Remove subtask">
                  <Icon name="x" size={13} />
                </button>
              </div>
            ))}

            <form className="subtask-add" onSubmit={addSub}>
              <input
                value={subText}
                onChange={(e) => setSubText(e.target.value)}
                placeholder="Notun step add korun..."
                maxLength={200}
              />
              <button type="submit">
                <Icon name="plus" size={14} /> Add
              </button>
            </form>
          </div>
        </div>
      )}
    </article>
  );
}
