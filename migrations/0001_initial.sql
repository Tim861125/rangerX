CREATE TABLE IF NOT EXISTS rangers (
  ranger_id TEXT PRIMARY KEY,
  data_json TEXT NOT NULL CHECK (json_valid(data_json)),
  name TEXT GENERATED ALWAYS AS (json_extract(data_json, '$.Ranger名稱')) VIRTUAL,
  description TEXT GENERATED ALWAYS AS (json_extract(data_json, '$.角色敘述')) VIRTUAL,
  released_at TEXT GENERATED ALWAYS AS (replace(json_extract(data_json, '$.登場時間'), '/', '-')) VIRTUAL,
  star_rank TEXT GENERATED ALWAYS AS (json_extract(data_json, '$.Ranger星數')) VIRTUAL,
  ranger_type TEXT GENERATED ALWAYS AS (json_extract(data_json, '$.類型')) VIRTUAL,
  attribute TEXT GENERATED ALWAYS AS (json_extract(data_json, '$.屬性')) VIRTUAL,
  respawn_time TEXT GENERATED ALWAYS AS (json_extract(data_json, '$.Ranger再生產時間')) VIRTUAL,
  mineral_cost INTEGER GENERATED ALWAYS AS (json_extract(data_json, '$.生產礦物費用')) VIRTUAL,
  attack_range INTEGER GENERATED ALWAYS AS (json_extract(data_json, '$.攻擊範圍')) VIRTUAL,
  physical_attack INTEGER GENERATED ALWAYS AS (json_extract(data_json, '$.物理攻擊力')) VIRTUAL,
  magic_attack INTEGER GENERATED ALWAYS AS (json_extract(data_json, '$.魔法攻擊力')) VIRTUAL,
  physical_defense INTEGER GENERATED ALWAYS AS (json_extract(data_json, '$.物理防禦力')) VIRTUAL,
  magic_defense INTEGER GENERATED ALWAYS AS (json_extract(data_json, '$.魔法防禦力')) VIRTUAL,
  health INTEGER GENERATED ALWAYS AS (json_extract(data_json, '$.體力')) VIRTUAL,
  nft TEXT GENERATED ALWAYS AS (json_extract(data_json, '$.nft角色')) VIRTUAL,
  advent TEXT GENERATED ALWAYS AS (json_extract(data_json, '$.降臨關卡角色')) VIRTUAL,
  updated_at INTEGER NOT NULL DEFAULT (unixepoch())
);

CREATE INDEX IF NOT EXISTS idx_rangers_filters
  ON rangers (star_rank, ranger_type, attribute);
CREATE INDEX IF NOT EXISTS idx_rangers_released_at
  ON rangers (released_at DESC);
CREATE INDEX IF NOT EXISTS idx_rangers_health
  ON rangers (health DESC);
CREATE INDEX IF NOT EXISTS idx_rangers_physical_attack
  ON rangers (physical_attack DESC);
CREATE INDEX IF NOT EXISTS idx_rangers_magic_attack
  ON rangers (magic_attack DESC);

CREATE TABLE IF NOT EXISTS sync_status (
  id INTEGER PRIMARY KEY CHECK (id = 1),
  source_url TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'never' CHECK (status IN ('never', 'running', 'success', 'error')),
  started_at TEXT,
  completed_at TEXT,
  fetched_count INTEGER NOT NULL DEFAULT 0,
  inserted_count INTEGER NOT NULL DEFAULT 0,
  updated_count INTEGER NOT NULL DEFAULT 0,
  deleted_count INTEGER NOT NULL DEFAULT 0,
  error_message TEXT
);

INSERT OR IGNORE INTO sync_status (id, source_url)
VALUES (1, 'https://rangerbook.warmycat.com/res/Rangers_data.json');
