
import os
from pathlib import Path

from dotenv import load_dotenv
from sqlalchemy import create_engine
from sqlalchemy.orm import DeclarativeBase, sessionmaker

BASE_DIR = Path(__file__).resolve().parent
load_dotenv(BASE_DIR / ".env")

DATABASE_URL = os.getenv("DATABASE_URL")

if not DATABASE_URL:
    raise RuntimeError(
        f"DATABASE_URL is missing. Check: {BASE_DIR / '.env'}"
    )

# Use the installed psycopg2 driver
DATABASE_URL = DATABASE_URL.replace(
    "postgresql+psycopg://",
    "postgresql+psycopg2://",
    1,
)

# Also handle Render URLs using the default PostgreSQL scheme
if DATABASE_URL.startswith("postgresql://"):
    DATABASE_URL = DATABASE_URL.replace(
        "postgresql://",
        "postgresql+psycopg2://",
        1,
    )

engine = create_engine(DATABASE_URL)