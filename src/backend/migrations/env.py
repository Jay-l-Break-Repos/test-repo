"""Alembic environment configuration.

This file is loaded by Alembic when running migration commands.  It wires
the SQLModel metadata (which includes all table definitions) to the Alembic
migration context so that auto-generated migrations reflect the current
model state.
"""

import os
from logging.config import fileConfig

from sqlalchemy import engine_from_config, pool
from alembic import context

# ---------------------------------------------------------------------------
# Alembic Config object — gives access to values in alembic.ini
# ---------------------------------------------------------------------------
config = context.config

# Interpret the config file for Python logging if present.
if config.config_file_name is not None:
    fileConfig(config.config_file_name)

# ---------------------------------------------------------------------------
# Import SQLModel metadata so Alembic can detect model changes
# ---------------------------------------------------------------------------
# Import all models to ensure they are registered with SQLModel.metadata
from app.models.document import Document  # noqa: F401
from app.models.user import User          # noqa: F401
from sqlmodel import SQLModel

target_metadata = SQLModel.metadata

# ---------------------------------------------------------------------------
# Database URL — prefer the environment variable; fall back to alembic.ini
# ---------------------------------------------------------------------------
DATABASE_URL = os.getenv("DATABASE_URL") or config.get_main_option("sqlalchemy.url")


def run_migrations_offline() -> None:
    """Run migrations in 'offline' mode.

    This configures the context with just a URL and not an Engine.  Calls to
    context.execute() emit the given string to the script output.
    """
    context.configure(
        url=DATABASE_URL,
        target_metadata=target_metadata,
        literal_binds=True,
        dialect_opts={"paramstyle": "named"},
    )

    with context.begin_transaction():
        context.run_migrations()


def run_migrations_online() -> None:
    """Run migrations in 'online' mode.

    Creates an Engine and associates a connection with the migration context.
    """
    configuration = config.get_section(config.config_ini_section, {})
    configuration["sqlalchemy.url"] = DATABASE_URL

    connectable = engine_from_config(
        configuration,
        prefix="sqlalchemy.",
        poolclass=pool.NullPool,
    )

    with connectable.connect() as connection:
        context.configure(
            connection=connection,
            target_metadata=target_metadata,
        )

        with context.begin_transaction():
            context.run_migrations()


if context.is_offline_mode():
    run_migrations_offline()
else:
    run_migrations_online()
