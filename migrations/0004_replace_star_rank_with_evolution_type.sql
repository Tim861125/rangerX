-- Migration: 0004_replace_star_rank_with_evolution_type.sql
DROP INDEX IF EXISTS idx_rangers_formatted_star_rank;

ALTER TABLE rangers_formatted DROP COLUMN star_rank;
ALTER TABLE rangers_formatted ADD COLUMN evolution_type INTEGER CHECK (evolution_type IS NULL OR evolution_type IN (0, 1));
