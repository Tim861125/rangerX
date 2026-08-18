-- Migration: 0003_three_tables_architecture.sql
-- Create rangers_raw (flattened raw JSON fields)
CREATE TABLE IF NOT EXISTS rangers_raw (
  ranger_id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT,
  released_at_raw TEXT,
  star_rank_raw TEXT,
  ranger_type_raw TEXT,
  attribute_raw TEXT,
  respawn_time_raw TEXT,
  mineral_cost_raw INTEGER,
  attack_range_raw INTEGER,
  splash_range_raw INTEGER,
  physical_attack_raw INTEGER,
  magic_attack_raw INTEGER,
  physical_defense_raw INTEGER,
  magic_defense_raw INTEGER,
  health_raw INTEGER,
  crit_rate_raw TEXT,
  crit_damage_raw TEXT,
  hit_rate_raw TEXT,
  evasion_rate_raw TEXT,
  skill_hit_rate_raw TEXT,
  skill_evasion_rate_raw TEXT,
  skill_resist_raw TEXT,
  attack_speed_raw TEXT,
  move_speed_raw TEXT,
  hp_increase_raw INTEGER,
  attack_increase_raw INTEGER,
  special_attack_delta_raw INTEGER,
  general_defense_delta_raw INTEGER,
  special_defense_delta_raw INTEGER,
  hp_increase_max_raw INTEGER,
  attack_increase_max_raw INTEGER,
  special_attack_delta_max_raw INTEGER,
  general_defense_delta_max_raw INTEGER,
  special_defense_delta_max_raw INTEGER,
  skill1_raw TEXT,
  skill2_raw TEXT,
  ability1_raw TEXT,
  ability1_code TEXT,
  ability2_raw TEXT,
  ability2_code TEXT,
  awakened_abilities_raw TEXT,
  is_nft_raw TEXT,
  is_advent_raw TEXT,
  talent_raw TEXT,
  created_at INTEGER NOT NULL DEFAULT (unixepoch()),
  updated_at INTEGER NOT NULL DEFAULT (unixepoch())
);

-- Create rangers_formatted (standardized and typed data)
CREATE TABLE IF NOT EXISTS rangers_formatted (
  ranger_id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT,
  released_at TEXT,
  star_count INTEGER NOT NULL,
  star_rank TEXT NOT NULL,
  is_ultimate INTEGER NOT NULL DEFAULT 0,
  is_hyper INTEGER NOT NULL DEFAULT 0,
  ranger_type TEXT NOT NULL,
  attribute TEXT NOT NULL,
  respawn_time REAL,
  mineral_cost INTEGER,
  attack_range INTEGER,
  splash_range INTEGER,
  physical_attack INTEGER,
  magic_attack INTEGER,
  physical_defense INTEGER,
  magic_defense INTEGER,
  health INTEGER,
  crit_rate REAL DEFAULT 0.0,
  crit_damage REAL DEFAULT 100.0,
  hit_rate REAL DEFAULT 0.0,
  evasion_rate REAL DEFAULT 0.0,
  skill_hit_rate REAL DEFAULT 0.0,
  skill_evasion_rate REAL DEFAULT 0.0,
  skill_resist REAL DEFAULT 0.0,
  attack_speed TEXT,
  move_speed TEXT,
  is_nft INTEGER NOT NULL DEFAULT 0,
  is_advent INTEGER NOT NULL DEFAULT 0,
  primary_stats_json TEXT,
  rate_stats_json TEXT,
  growth_stats_json TEXT,
  skill1_json TEXT,
  skill2_json TEXT,
  abilities_json TEXT,
  talent_json TEXT,
  updated_at INTEGER NOT NULL DEFAULT (unixepoch()),
  FOREIGN KEY (ranger_id) REFERENCES rangers_raw (ranger_id) ON DELETE CASCADE
);

-- Create Indexes for rangers_formatted
CREATE INDEX IF NOT EXISTS idx_rangers_formatted_filters
  ON rangers_formatted (star_count, ranger_type, attribute);
CREATE INDEX IF NOT EXISTS idx_rangers_formatted_star_rank
  ON rangers_formatted (star_rank);
CREATE INDEX IF NOT EXISTS idx_rangers_formatted_released_at
  ON rangers_formatted (released_at DESC);
CREATE INDEX IF NOT EXISTS idx_rangers_formatted_health
  ON rangers_formatted (health DESC);
CREATE INDEX IF NOT EXISTS idx_rangers_formatted_physical_attack
  ON rangers_formatted (physical_attack DESC);
CREATE INDEX IF NOT EXISTS idx_rangers_formatted_magic_attack
  ON rangers_formatted (magic_attack DESC);
CREATE INDEX IF NOT EXISTS idx_rangers_formatted_mineral_cost
  ON rangers_formatted (mineral_cost ASC);
