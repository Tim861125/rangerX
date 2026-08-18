-- Migration: 0005_create_ranger_collection.sql
CREATE TABLE IF NOT EXISTS ranger_collection (
  ranger_id TEXT PRIMARY KEY,
  status INTEGER NOT NULL DEFAULT 0, -- 0: 未擁有, 1: 已擁有, 2: 已打勾
  updated_at INTEGER NOT NULL DEFAULT (unixepoch()),
  FOREIGN KEY (ranger_id) REFERENCES rangers_formatted (ranger_id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_ranger_collection_status ON ranger_collection (status);
