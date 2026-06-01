from sqlalchemy import create_engine, event
from sqlalchemy.orm import declarative_base, sessionmaker
from sqlalchemy.exc import OperationalError
import sys
from .config import settings

db_url = settings.database_url
engine = None

# Attempt to connect to PostgreSQL if configured, fallback to SQLite on failure
if not db_url.startswith("sqlite"):
    try:
        # Check if engine connects
        engine = create_engine(db_url, pool_pre_ping=True)
        with engine.connect() as conn:
            pass
    except (OperationalError, Exception) as e:
        print(f"WARNING: Could not connect to database at {db_url}. Error: {e}", file=sys.stderr)
        print("WARNING: Falling back to SQLite local database (sqlite:///./inventory.db)...", file=sys.stderr)
        db_url = "sqlite:///./inventory.db"
        engine = None

if engine is None:
    engine = create_engine(db_url, connect_args={"check_same_thread": False})
    
    # Enable foreign keys for SQLite
    @event.listens_for(engine, "connect")
    def set_sqlite_pragma(dbapi_connection, connection_record):
        cursor = dbapi_connection.cursor()
        cursor.execute("PRAGMA foreign_keys=ON")
        cursor.close()

SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

Base = declarative_base()

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
