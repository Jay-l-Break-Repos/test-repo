from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker, Session
from sqlalchemy.ext.declarative import declarative_base

# Use SQLite for in-memory database
DATABASE_URL = "sqlite:///./test.db"

engine = create_engine(
    DATABASE_URL, 
    connect_args={"check_same_thread": False}  # Only for SQLite
)
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

def get_session() -> Session:
    session = SessionLocal()
    try:
        yield session
    finally:
        session.close()

def init_db():
    from .models import Base
    Base.metadata.create_all(bind=engine)