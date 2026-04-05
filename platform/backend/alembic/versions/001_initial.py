"""Initial schema - all tables

Revision ID: 001_initial
Revises: 
Create Date: 2026-04-05
"""
from alembic import op
import sqlalchemy as sa


revision = '001_initial'
down_revision = None
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.create_table('users',
        sa.Column('id', sa.Integer(), primary_key=True, index=True),
        sa.Column('did', sa.String(255), unique=True, nullable=False, index=True),
        sa.Column('identity_commitment', sa.String(255), unique=True, nullable=False),
        sa.Column('email', sa.String(255), unique=True, nullable=True, index=True),
        sa.Column('hashed_password', sa.String(255), nullable=True),
        sa.Column('username', sa.String(50), unique=True, nullable=True, index=True),
        sa.Column('full_name', sa.String(100), nullable=True),
        sa.Column('municipality_code', sa.Integer(), nullable=False, index=True),
        sa.Column('state_code', sa.Integer(), nullable=False, index=True),
        sa.Column('country_code', sa.String(3), server_default='MX', nullable=False),
        sa.Column('face_hash', sa.String(255), nullable=True),
        sa.Column('voice_hash', sa.String(255), nullable=True),
        sa.Column('fingerprint_hash', sa.String(255), nullable=True),
        sa.Column('is_active', sa.Boolean(), server_default='1'),
        sa.Column('is_verified', sa.Boolean(), server_default='0'),
        sa.Column('is_official', sa.Boolean(), server_default='0'),
        sa.Column('verification_date', sa.DateTime(), nullable=True),
        sa.Column('reputation_score', sa.Float(), server_default='0.0'),
        sa.Column('created_at', sa.DateTime(), server_default=sa.func.now()),
        sa.Column('updated_at', sa.DateTime(), server_default=sa.func.now()),
        sa.Column('last_login', sa.DateTime(), nullable=True),
    )

    op.create_table('proposals',
        sa.Column('id', sa.Integer(), primary_key=True, index=True),
        sa.Column('title', sa.String(255), nullable=False),
        sa.Column('summary', sa.Text(), nullable=False),
        sa.Column('content', sa.Text(), nullable=False),
        sa.Column('category', sa.String(50), nullable=False, index=True),
        sa.Column('scope', sa.String(20), nullable=False, index=True),
        sa.Column('status', sa.String(20), server_default='active', index=True),
        sa.Column('author_id', sa.Integer(), nullable=False, index=True),
        sa.Column('ipfs_hash', sa.String(255), nullable=True),
        sa.Column('vote_count', sa.Integer(), server_default='0'),
        sa.Column('support_count', sa.Integer(), server_default='0'),
        sa.Column('rejection_count', sa.Integer(), server_default='0'),
        sa.Column('comment_count', sa.Integer(), server_default='0'),
        sa.Column('deadline', sa.DateTime(), nullable=True),
        sa.Column('ai_analysis', sa.JSON(), nullable=True),
        sa.Column('is_active', sa.Boolean(), server_default='1'),
        sa.Column('days_remaining', sa.Integer(), nullable=True),
        sa.Column('created_at', sa.DateTime(), server_default=sa.func.now()),
        sa.Column('updated_at', sa.DateTime(), server_default=sa.func.now()),
        sa.ForeignKeyConstraint(['author_id'], ['users.id']),
    )

    op.create_table('officials',
        sa.Column('id', sa.Integer(), primary_key=True, index=True),
        sa.Column('name', sa.String(100), nullable=False),
        sa.Column('position', sa.String(100), nullable=False),
        sa.Column('municipality_code', sa.Integer(), nullable=False, index=True),
        sa.Column('state_code', sa.Integer(), nullable=False, index=True),
        sa.Column('bio', sa.Text(), nullable=True),
        sa.Column('avatar_url', sa.String(255), nullable=True),
        sa.Column('created_at', sa.DateTime(), server_default=sa.func.now()),
    )

    op.create_table('tags',
        sa.Column('id', sa.Integer(), primary_key=True, index=True),
        sa.Column('name', sa.String(50), unique=True, nullable=False, index=True),
        sa.Column('category', sa.String(50), nullable=False),
        sa.Column('description', sa.Text(), nullable=True),
        sa.Column('sentiment', sa.String(10), server_default='neutral'),
        sa.Column('created_at', sa.DateTime(), server_default=sa.func.now()),
    )

    op.create_table('votes',
        sa.Column('id', sa.Integer(), primary_key=True, index=True),
        sa.Column('user_id', sa.Integer(), nullable=False, index=True),
        sa.Column('proposal_id', sa.Integer(), nullable=False, index=True),
        sa.Column('vote_value', sa.Integer(), nullable=False),
        sa.Column('weight', sa.Float(), server_default='1.0'),
        sa.Column('created_at', sa.DateTime(), server_default=sa.func.now()),
        sa.ForeignKeyConstraint(['user_id'], ['users.id']),
        sa.ForeignKeyConstraint(['proposal_id'], ['proposals.id']),
    )

    op.create_table('comments',
        sa.Column('id', sa.Integer(), primary_key=True, index=True),
        sa.Column('content', sa.Text(), nullable=False),
        sa.Column('author_id', sa.Integer(), nullable=False, index=True),
        sa.Column('proposal_id', sa.Integer(), nullable=False, index=True),
        sa.Column('upvotes', sa.Integer(), server_default='0'),
        sa.Column('downvotes', sa.Integer(), server_default='0'),
        sa.Column('is_hidden', sa.Boolean(), server_default='0'),
        sa.Column('created_at', sa.DateTime(), server_default=sa.func.now()),
        sa.ForeignKeyConstraint(['author_id'], ['users.id']),
        sa.ForeignKeyConstraint(['proposal_id'], ['proposals.id']),
    )

    op.create_table('ratings',
        sa.Column('id', sa.Integer(), primary_key=True, index=True),
        sa.Column('user_id', sa.Integer(), nullable=False, index=True),
        sa.Column('official_id', sa.Integer(), nullable=False, index=True),
        sa.Column('rating_value', sa.Integer(), nullable=False),
        sa.Column('comment', sa.Text(), nullable=True),
        sa.Column('created_at', sa.DateTime(), server_default=sa.func.now()),
        sa.ForeignKeyConstraint(['user_id'], ['users.id']),
        sa.ForeignKeyConstraint(['official_id'], ['officials.id']),
    )

    op.create_table('notifications',
        sa.Column('id', sa.Integer(), primary_key=True, index=True),
        sa.Column('user_id', sa.Integer(), nullable=False, index=True),
        sa.Column('type', sa.String(50), nullable=False),
        sa.Column('title', sa.String(255), nullable=False),
        sa.Column('message', sa.Text(), nullable=False),
        sa.Column('data', sa.JSON(), nullable=True),
        sa.Column('is_read', sa.Boolean(), server_default='0'),
        sa.Column('created_at', sa.DateTime(), server_default=sa.func.now()),
    )

    op.create_table('content_reports',
        sa.Column('id', sa.Integer(), primary_key=True, index=True),
        sa.Column('reporter_id', sa.Integer(), nullable=False, index=True),
        sa.Column('content_type', sa.String(50), nullable=False, index=True),
        sa.Column('content_id', sa.String(255), nullable=False, index=True),
        sa.Column('reason', sa.String(100), nullable=False),
        sa.Column('description', sa.Text(), nullable=True),
        sa.Column('status', sa.String(20), server_default='pending', index=True),
        sa.Column('moderator_id', sa.Integer(), nullable=True),
        sa.Column('resolution', sa.Text(), nullable=True),
        sa.Column('resolution_data', sa.JSON(), nullable=True),
        sa.Column('created_at', sa.DateTime(), server_default=sa.func.now(), index=True),
        sa.Column('resolved_at', sa.DateTime(), nullable=True),
        sa.ForeignKeyConstraint(['reporter_id'], ['users.id']),
        sa.ForeignKeyConstraint(['moderator_id'], ['users.id']),
    )

    op.create_table('moderation_actions',
        sa.Column('id', sa.Integer(), primary_key=True, index=True),
        sa.Column('moderator_id', sa.Integer(), nullable=False, index=True),
        sa.Column('content_type', sa.String(50), nullable=False, index=True),
        sa.Column('content_id', sa.String(255), nullable=False, index=True),
        sa.Column('action_type', sa.String(50), nullable=False, index=True),
        sa.Column('reason', sa.Text(), nullable=True),
        sa.Column('metadata', sa.JSON(), nullable=True),
        sa.Column('created_at', sa.DateTime(), server_default=sa.func.now(), index=True),
        sa.ForeignKeyConstraint(['moderator_id'], ['users.id']),
    )

    op.create_table('ai_analyses',
        sa.Column('id', sa.Integer(), primary_key=True, index=True),
        sa.Column('proposal_id', sa.Integer(), nullable=False, index=True),
        sa.Column('legal_viability', sa.Float(), nullable=True),
        sa.Column('impact_score', sa.Float(), nullable=True),
        sa.Column('recommendation', sa.Text(), nullable=True),
        sa.Column('tags', sa.JSON(), nullable=True),
        sa.Column('summary', sa.Text(), nullable=True),
        sa.Column('created_at', sa.DateTime(), server_default=sa.func.now()),
    )

    op.create_table('audit_logs',
        sa.Column('id', sa.Integer(), primary_key=True, index=True),
        sa.Column('user_id', sa.Integer(), nullable=True, index=True),
        sa.Column('action', sa.String(100), nullable=False),
        sa.Column('entity_type', sa.String(50), nullable=False),
        sa.Column('entity_id', sa.Integer(), nullable=False),
        sa.Column('details', sa.JSON(), nullable=True),
        sa.Column('ip_address', sa.String(45), nullable=True),
        sa.Column('created_at', sa.DateTime(), server_default=sa.func.now()),
    )

    op.create_table('scraped_documents',
        sa.Column('id', sa.Integer(), primary_key=True, index=True),
        sa.Column('title', sa.String(255), nullable=False),
        sa.Column('url', sa.String(500), nullable=False, unique=True),
        sa.Column('source', sa.String(100), nullable=False),
        sa.Column('content', sa.Text(), nullable=True),
        sa.Column('metadata', sa.JSON(), nullable=True),
        sa.Column('created_at', sa.DateTime(), server_default=sa.func.now()),
    )


def downgrade() -> None:
    op.drop_table('scraped_documents')
    op.drop_table('audit_logs')
    op.drop_table('ai_analyses')
    op.drop_table('moderation_actions')
    op.drop_table('content_reports')
    op.drop_table('notifications')
    op.drop_table('ratings')
    op.drop_table('comments')
    op.drop_table('votes')
    op.drop_table('tags')
    op.drop_table('officials')
    op.drop_table('proposals')
    op.drop_table('users')
