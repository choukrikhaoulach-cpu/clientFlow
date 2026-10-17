import os
from datetime import timedelta
from dotenv import load_dotenv

load_dotenv()

basedir = os.path.abspath(os.path.dirname(__file__))


def _normalize_db_url(url):
    # Some hosting providers (Render/Heroku) issue postgres:// URLs, but
    # SQLAlchemy 1.4+/2.x requires the postgresql:// scheme.
    if url and url.startswith("postgres://"):
        return url.replace("postgres://", "postgresql://", 1)
    return url


class BaseConfig:
    SECRET_KEY = os.environ.get("JWT_SECRET_KEY", "dev-secret-change-me")

    SQLALCHEMY_DATABASE_URI = _normalize_db_url(
        os.environ.get("DATABASE_URL", f"sqlite:///{os.path.join(basedir, 'clientflow.db')}")
    )
    SQLALCHEMY_TRACK_MODIFICATIONS = False

    JWT_SECRET_KEY = os.environ.get("JWT_SECRET_KEY", "dev-secret-change-me")
    JWT_ACCESS_TOKEN_EXPIRES = timedelta(
        hours=int(os.environ.get("JWT_ACCESS_TOKEN_EXPIRES_HOURS", 24))
    )
    JWT_ERROR_MESSAGE_KEY = "error"

    FRONTEND_ORIGIN = os.environ.get("FRONTEND_ORIGIN", "http://localhost:5173")

    DEBUG = False
    TESTING = False


class DevelopmentConfig(BaseConfig):
    DEBUG = True


class ProductionConfig(BaseConfig):
    DEBUG = False


class TestingConfig(BaseConfig):
    TESTING = True
    SQLALCHEMY_DATABASE_URI = "sqlite:///:memory:"


config_by_name = {
    "development": DevelopmentConfig,
    "production": ProductionConfig,
    "testing": TestingConfig,
}
