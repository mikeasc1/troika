"""Add airtime reward and distribution columns

Revision ID: c8f2a1b3d4e5
Revises: 2b3c4a43c24d
Create Date: 2026-02-09 19:48:00.000000

"""
from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision = 'c8f2a1b3d4e5'
down_revision = '2b3c4a43c24d'
branch_labels = None
depends_on = None


def upgrade() -> None:
    # Add new columns for airtime rewards and distribution
    with op.batch_alter_table('campaigns', schema=None) as batch_op:
        # Airtime Reward Configuration
        batch_op.add_column(sa.Column('reward_amount', sa.Float(), nullable=True))
        batch_op.add_column(sa.Column('currency', sa.String(length=10), nullable=False, server_default='NGN'))
        
        # Prize Pool (for Spinner campaigns)
        batch_op.add_column(sa.Column('prize_pool_amount', sa.Float(), nullable=False, server_default='0.0'))
        
        # Distribution Strategy
        batch_op.add_column(sa.Column('distribution_strategy', sa.String(length=20), nullable=False, server_default='INSTANT'))
        batch_op.add_column(sa.Column('distribution_split_immediate_percentage', sa.Integer(), nullable=False, server_default='100'))
        batch_op.add_column(sa.Column('distribution_delay_min_minutes', sa.Integer(), nullable=True))
        batch_op.add_column(sa.Column('distribution_delay_max_minutes', sa.Integer(), nullable=True))
        batch_op.add_column(sa.Column('distribution_winners_count', sa.Integer(), nullable=False, server_default='1'))
        
        # Campaign Type
        batch_op.add_column(sa.Column('type', sa.String(length=20), nullable=False, server_default='STANDARD'))


def downgrade() -> None:
    with op.batch_alter_table('campaigns', schema=None) as batch_op:
        batch_op.drop_column('type')
        batch_op.drop_column('distribution_winners_count')
        batch_op.drop_column('distribution_delay_max_minutes')
        batch_op.drop_column('distribution_delay_min_minutes')
        batch_op.drop_column('distribution_split_immediate_percentage')
        batch_op.drop_column('distribution_strategy')
        batch_op.drop_column('prize_pool_amount')
        batch_op.drop_column('currency')
        batch_op.drop_column('reward_amount')
