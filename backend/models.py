from datetime import date, datetime

from sqlalchemy import JSON, Boolean, Date, DateTime, ForeignKey, String, Text
from sqlalchemy.orm import Mapped, mapped_column

from database import Base


class User(Base):
    __tablename__ = "users"

    id: Mapped[int] = mapped_column(primary_key=True, index=True)

    username: Mapped[str] = mapped_column(
        String(50),
        unique=True,
        index=True,
        nullable=False,
    )

    password_hash: Mapped[str] = mapped_column(String(255), nullable=False)

    created_at: Mapped[datetime] = mapped_column(
        DateTime,
        default=datetime.utcnow,
        nullable=False,
    )


class Task(Base):
    __tablename__ = "tasks"

    id: Mapped[int] = mapped_column(primary_key=True, index=True)

    user_id: Mapped[int | None] = mapped_column(
        ForeignKey("users.id", ondelete="CASCADE"),
        index=True,
        nullable=True,
    )

    title: Mapped[str] = mapped_column(String(200), nullable=False)

    description: Mapped[str | None] = mapped_column(Text, nullable=True)

    completed: Mapped[bool] = mapped_column(
        Boolean,
        default=False,
        nullable=False,
    )

    due_date: Mapped[date | None] = mapped_column(Date, nullable=True, index=True)

    # "HH:MM" (24 hour). Simple string, timezone problem nei.
    due_time: Mapped[str | None] = mapped_column(String(5), nullable=True)

    priority: Mapped[str] = mapped_column(
        String(10),
        default="medium",
        nullable=False,
    )

    category: Mapped[str] = mapped_column(
        String(20),
        default="personal",
        nullable=False,
    )

    # none | daily | weekly | monthly
    recurrence: Mapped[str] = mapped_column(
        String(10),
        default="none",
        nullable=False,
    )

    # [{"id": "...", "title": "...", "done": false}, ...]
    subtasks: Mapped[list | None] = mapped_column(JSON, default=list, nullable=True)

    # Streak ar weekly chart-er jonno
    completed_on: Mapped[date | None] = mapped_column(Date, nullable=True)
