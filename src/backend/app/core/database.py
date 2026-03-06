import os
import time
from sqlmodel import SQLModel, create_engine, Session
# Import models here to ensure they are registered with SQLModel.metadata
from app.models.user import User
from app.models.document import Document

# Database connection URL from environment.
# A fallback SQLite URL is used when DATABASE_URL is not set so that the
# module can be imported in test environments (where the engine is replaced
# via dependency injection / monkey-patching before any real DB call is made).
DATABASE_URL = os.getenv("DATABASE_URL", "sqlite:///./test_fallback.db")

engine = create_engine(
    DATABASE_URL,
    echo=True,
    # SQLite requires this flag when the same connection is used across threads
    connect_args={"check_same_thread": False} if DATABASE_URL.startswith("sqlite") else {},
)

def get_session():
    with Session(engine) as session:
        yield session

def init_db():
    max_retries = 5
    retry_delay = 2
    
    for attempt in range(max_retries):
        try:
            print(f"Attempting to connect to database (attempt {attempt + 1}/{max_retries})...")
            SQLModel.metadata.create_all(engine)
            print("Database tables created successfully!")
            return
        except Exception as e:
            print(f"Failed to connect to database: {e}")
            if attempt < max_retries - 1:
                print(f"Retrying in {retry_delay} seconds...")
                time.sleep(retry_delay)
                retry_delay *= 2  # Exponential backoff
            else:
                print("Max retries reached. Database initialization failed.")
                raise

