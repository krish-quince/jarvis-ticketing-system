-- Migration: Create ticket_time_entries table for time tracking
-- Run this migration against your PostgreSQL database

CREATE TABLE IF NOT EXISTS ticket_time_entries (
    entry_id BIGSERIAL PRIMARY KEY,
    ticket_id BIGINT NOT NULL REFERENCES tickets(ticket_id) ON DELETE CASCADE,
    user_code VARCHAR(50) NOT NULL,
    status_name VARCHAR(100),
    time_spent_seconds INTEGER NOT NULL DEFAULT 0,
    started_at TIMESTAMP NOT NULL DEFAULT NOW(),
    ended_at TIMESTAMP,
    created_at TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_time_entries_ticket ON ticket_time_entries(ticket_id);
CREATE INDEX IF NOT EXISTS idx_time_entries_user ON ticket_time_entries(user_code);
