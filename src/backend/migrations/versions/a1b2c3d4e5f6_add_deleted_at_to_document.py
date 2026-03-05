"""add deleted_at column to document for soft deletion

Revision ID: a1b2c3d4e5f6
Revises: 
Create Date: 2025-03-05 00:00:00.000000

Adds a nullable ``deleted_at`` TIMESTAMP WITH TIME ZONE column to the
``document`` table.  When this column is NULL the document is considered
active; when it holds a timestamp the document has been soft-deleted and
should be excluded from normal queries.

To roll back this migration (downgrade), the column is simply dropped.
"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = "a1b2c3d4e5f6"
down_revision: Union[str, None] = None
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """Add the deleted_at column to the document table."""
    op.add_column(
        "document",
        sa.Column(
            "deleted_at",
            sa.DateTime(timezone=True),
            nullable=True,
            comment=(
                "Soft-deletion timestamp. NULL = active document; "
                "non-NULL = document has been soft-deleted."
            ),
        ),
    )


def downgrade() -> None:
    """Remove the deleted_at column from the document table."""
    op.drop_column("document", "deleted_at")
