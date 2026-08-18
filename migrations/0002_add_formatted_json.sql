ALTER TABLE rangers ADD COLUMN formatted_json TEXT CHECK (formatted_json IS NULL OR json_valid(formatted_json));
