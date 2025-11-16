from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from app.database.models import Base
from config import get_settings

settings = get_settings()

# Detect whether DB is SQLite
is_sqlite = settings.DATABASE_URL.startswith("sqlite")

# Configure engine
engine = create_engine(
    settings.DATABASE_URL,
    connect_args={"check_same_thread": False} if is_sqlite else {},  # Only for SQLite
    pool_pre_ping=True,
    echo=settings.DEBUG
)

SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

def init_db():
    Base.metadata.create_all(bind=engine)

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
