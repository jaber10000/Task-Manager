from datetime import date
from typing import Annotated, Literal

from pydantic import BaseModel, ConfigDict, Field, field_validator

Priority = Literal["high", "medium", "low"]
Category = Literal["work", "study", "personal"]
Recurrence = Literal["none", "daily", "weekly", "monthly"]
TimeStr = Annotated[str, Field(pattern=r"^([01]\d|2[0-3]):[0-5]\d$")]


def _clean_title(value: str | None) -> str | None:
    if value is None:
        return value
    value = value.strip()
    if not value:
        raise ValueError("Title cannot be empty")
    return value


# ---------------- subtasks ----------------
class Subtask(BaseModel):
    id: str = Field(min_length=1, max_length=40)
    title: str = Field(min_length=1, max_length=200)
    done: bool = False


# ---------------- tasks ----------------
class TaskCreate(BaseModel):
    title: str = Field(min_length=1, max_length=200)
    description: str | None = Field(default=None, max_length=2000)
    due_date: date | None = None
    due_time: TimeStr | None = None
    priority: Priority = "medium"
    category: Category = "personal"
    recurrence: Recurrence = "none"
    subtasks: list[Subtask] = Field(default_factory=list, max_length=50)

    @field_validator("title")
    @classmethod
    def strip_title(cls, value: str) -> str:
        return _clean_title(value)


class TaskUpdate(BaseModel):
    # Sob field optional: toggle, edit, date change, subtask change
    # protyek-ta alada alada PATCH hishebe ashe.
    title: str | None = Field(default=None, min_length=1, max_length=200)
    description: str | None = Field(default=None, max_length=2000)
    completed: bool | None = None
    completed_on: date | None = None
    due_date: date | None = None
    due_time: TimeStr | None = None
    priority: Priority | None = None
    category: Category | None = None
    recurrence: Recurrence | None = None
    subtasks: list[Subtask] | None = Field(default=None, max_length=50)

    @field_validator("title")
    @classmethod
    def strip_title(cls, value: str | None) -> str | None:
        return _clean_title(value)


class TaskResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    title: str
    description: str | None = None
    completed: bool
    completed_on: date | None = None
    due_date: date | None = None
    due_time: str | None = None
    priority: str = "medium"
    category: str = "personal"
    recurrence: str = "none"
    subtasks: list[Subtask] = Field(default_factory=list)

    @field_validator("subtasks", mode="before")
    @classmethod
    def none_to_list(cls, value):
        return value or []


# ---------------- auth ----------------
class UserCreate(BaseModel):
    username: str = Field(min_length=3, max_length=30, pattern=r"^[A-Za-z0-9_.-]+$")
    password: str = Field(min_length=6, max_length=72)


class UserLogin(BaseModel):
    username: str = Field(min_length=1, max_length=50)
    password: str = Field(min_length=1, max_length=72)


class UserOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    username: str


class TokenOut(BaseModel):
    access_token: str
    token_type: str = "bearer"
    user: UserOut
