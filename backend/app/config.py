from pydantic_settings import BaseSettings
from pydantic import Field

class Settings(BaseSettings):
    database_url: str = Field(default="sqlite:///./inventory.db", alias="DATABASE_URL")
    cors_origins: str = Field(default="*", alias="CORS_ORIGINS")
    
    class Config:
        env_file = ".env"
        env_file_encoding = "utf-8"
        populate_by_name = True

settings = Settings()
