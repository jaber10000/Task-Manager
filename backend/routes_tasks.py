import calendar
from datetime import date, timedelta

from fastapi import APIRouter, Depends, HTTPException, Response
from sqlalchemy import select
from sqlalchemy.orm import Session

from deps import get_current_user, get_db
from models import Task, User
from schemas import TaskCreate, TaskResponse, TaskUpdate

router = APIRouter(prefix="/tasks", tags=["tasks"])

# Ei field gulo database-e NOT NULL, tai PATCH-e null pathano jabe na
NOT_NULLABLE = {"title", "completed", "priority", "category", "recurrence", "subtasks"}


def add_months(d: date, months: int) -> date:
    index = d.month - 1 + months
    year = d.year + index // 12
    month = index % 12 + 1
    day = min(d.day, calendar.monthrange(year, month)[1])
    return date(year, month, day)


def next_due_date(task: Task) -> date:
    base = task.due_date or date.today()

    if task.recurrence == "daily":
        return base + timedelta(days=1)
    if task.recurrence == "weekly":
        return base + timedelta(days=7)
    return add_months(base, 1)


def get_own_task(db: Session, user: User, task_id: int) -> Task:
    task = db.scalar(
        select(Task).where(Task.id == task_id, Task.user_id == user.id)
    )
    if task is None:
        raise HTTPException(404, "Task not found")
    return task


@router.get("", response_model=list[TaskResponse])
def get_tasks(
    due_date: date | None = None,
    db: Session = Depends(get_db),
    user: User = Depends(get_current_user),
):
    """Nijer shob task. ?due_date=2026-10-12 dile shudhu sei date-er task."""
    query = select(Task).where(Task.user_id == user.id).order_by(Task.id.desc())

    if due_date is not None:
        query = query.where(Task.due_date == due_date)

    return db.scalars(query).all()


@router.post("", response_model=TaskResponse, status_code=201)
def create_task(
    data: TaskCreate,
    db: Session = Depends(get_db),
    user: User = Depends(get_current_user),
):
    task = Task(
        user_id=user.id,
        title=data.title,
        description=data.description,
        due_date=data.due_date or date.today(),
        due_time=data.due_time,
        priority=data.priority,
        category=data.category,
        recurrence=data.recurrence,
        subtasks=[s.model_dump() for s in data.subtasks],
    )
    db.add(task)
    db.commit()
    db.refresh(task)
    return task


@router.patch("/{task_id}", response_model=TaskResponse)
def update_task(
    task_id: int,
    data: TaskUpdate,
    db: Session = Depends(get_db),
    user: User = Depends(get_current_user),
):
    task = get_own_task(db, user, task_id)
    changes = data.model_dump(exclude_unset=True)

    for field in NOT_NULLABLE:
        if field in changes and changes[field] is None:
            raise HTTPException(422, f"{field} cannot be null")

    was_completed = task.completed

    for field, value in changes.items():
        setattr(task, field, value)

    if "completed" in changes:
        if task.completed:
            # Frontend user-er local date pathay, na dile server-er aajker date
            if task.completed_on is None:
                task.completed_on = date.today()
        else:
            task.completed_on = None

        # Recurring task complete hole porer tarikher notun task toiri hoy
        just_completed = task.completed and not was_completed
        if just_completed and task.recurrence != "none":
            db.add(
                Task(
                    user_id=task.user_id,
                    title=task.title,
                    description=task.description,
                    due_date=next_due_date(task),
                    due_time=task.due_time,
                    priority=task.priority,
                    category=task.category,
                    recurrence=task.recurrence,
                    subtasks=[
                        {**s, "done": False} for s in (task.subtasks or [])
                    ],
                )
            )

    db.commit()
    db.refresh(task)
    return task


@router.delete("/{task_id}", status_code=204)
def delete_task(
    task_id: int,
    db: Session = Depends(get_db),
    user: User = Depends(get_current_user),
):
    task = get_own_task(db, user, task_id)
    db.delete(task)
    db.commit()
    return Response(status_code=204)
