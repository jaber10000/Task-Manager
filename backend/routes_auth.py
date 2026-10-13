from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy import func, select, update
from sqlalchemy.orm import Session

from auth import create_token, hash_password, verify_password
from deps import get_current_user, get_db
from models import Task, User
from schemas import TokenOut, UserCreate, UserLogin, UserOut

router = APIRouter(prefix="/auth", tags=["auth"])


def _token_response(user: User) -> TokenOut:
    return TokenOut(
        access_token=create_token(user.id),
        user=UserOut.model_validate(user),
    )


@router.post("/register", response_model=TokenOut, status_code=201)
def register(data: UserCreate, db: Session = Depends(get_db)):
    username = data.username.strip()

    taken = db.scalar(
        select(User).where(func.lower(User.username) == username.lower())
    )
    if taken:
        raise HTTPException(409, "Username already taken")

    is_first_user = db.scalar(select(func.count()).select_from(User)) == 0

    user = User(username=username, password_hash=hash_password(data.password))
    db.add(user)
    db.flush()

    # Login system aashar age toiri hoya purono task gulo prothom user pabe
    if is_first_user:
        db.execute(
            update(Task).where(Task.user_id.is_(None)).values(user_id=user.id)
        )

    db.commit()
    db.refresh(user)
    return _token_response(user)


@router.post("/login", response_model=TokenOut)
def login(data: UserLogin, db: Session = Depends(get_db)):
    user = db.scalar(
        select(User).where(func.lower(User.username) == data.username.strip().lower())
    )

    if user is None or not verify_password(data.password, user.password_hash):
        raise HTTPException(401, "Invalid username or password")

    return _token_response(user)


@router.get("/me", response_model=UserOut)
def me(user: User = Depends(get_current_user)):
    return user
