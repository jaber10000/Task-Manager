from sqlalchemy import inspect, text

# Purono "tasks" table-e je column gulo nei, sheigulo auto add hobe.
# SQLite ar PostgreSQL duto-tei kaj kore.
TASK_COLUMNS = {
    "user_id": "INTEGER",
    "description": "TEXT",
    "due_date": "DATE",
    "due_time": "VARCHAR(5)",
    "priority": "VARCHAR(10) NOT NULL DEFAULT 'medium'",
    "category": "VARCHAR(20) NOT NULL DEFAULT 'personal'",
    "recurrence": "VARCHAR(10) NOT NULL DEFAULT 'none'",
    "subtasks": "JSON",
    "completed_on": "DATE",
}


def run_migrations(engine) -> None:
    inspector = inspect(engine)

    if "tasks" not in inspector.get_table_names():
        return

    existing = {col["name"] for col in inspector.get_columns("tasks")}

    with engine.begin() as conn:
        for name, ddl in TASK_COLUMNS.items():
            if name in existing:
                continue

            conn.execute(text(f"ALTER TABLE tasks ADD COLUMN {name} {ddl}"))

            if name == "due_date":
                conn.execute(
                    text("UPDATE tasks SET due_date = CURRENT_DATE WHERE due_date IS NULL")
                )
