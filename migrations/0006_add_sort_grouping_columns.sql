-- Migration: 0006_add_sort_grouping_columns.sql
-- Add sorting and grouping columns to rangers_formatted

ALTER TABLE rangers_formatted ADD COLUMN unit_no INTEGER;
ALTER TABLE rangers_formatted ADD COLUMN group_no INTEGER;
ALTER TABLE rangers_formatted ADD COLUMN form_rank INTEGER;

-- Backfill unit_no and initial group_no
UPDATE rangers_formatted
SET
  unit_no = CAST(SUBSTR(ranger_id, 2) AS INTEGER),
  group_no = CAST(SUBSTR(ranger_id, 2) AS INTEGER),
  form_rank = CASE
    WHEN star_count = 9 THEN 90
    WHEN star_count = 8 AND (evolution_type = 0 OR ranger_id LIKE '%h-%') THEN 81
    WHEN star_count = 8 AND (evolution_type = 1 OR ranger_id LIKE '%u-%') THEN 82
    WHEN star_count = 8 THEN 80
    ELSE star_count * 10
  END;

-- Backfill group_no across continuous evolution chains (e.g. 6★->7★->8★ or 8★->9★)
WITH RECURSIVE
  edges AS (
    SELECT DISTINCT
      curr.unit_no AS child_unit_no,
      SUBSTR(curr.ranger_id, INSTR(curr.ranger_id, '-') + 1) AS slug,
      prev.unit_no AS parent_unit_no
    FROM rangers_formatted curr
    JOIN rangers_formatted prev
      ON prev.unit_no = curr.unit_no - 1
     AND SUBSTR(prev.ranger_id, INSTR(prev.ranger_id, '-') + 1) = SUBSTR(curr.ranger_id, INSTR(curr.ranger_id, '-') + 1)
    WHERE (curr.star_count = 9 AND prev.star_count = 8)
       OR (curr.released_at = prev.released_at AND curr.star_count = prev.star_count + 1)
  ),
  chain AS (
    SELECT child_unit_no, slug, parent_unit_no
    FROM edges
    UNION ALL
    SELECT c.child_unit_no, c.slug, e.parent_unit_no
    FROM chain c
    JOIN edges e ON c.parent_unit_no = e.child_unit_no AND c.slug = e.slug
  ),
  roots AS (
    SELECT
      child_unit_no,
      slug,
      MIN(parent_unit_no) AS root_group_no
    FROM chain
    GROUP BY child_unit_no, slug
  )
UPDATE rangers_formatted
SET group_no = (
  SELECT r.root_group_no
  FROM roots r
  WHERE r.child_unit_no = rangers_formatted.unit_no
    AND r.slug = SUBSTR(rangers_formatted.ranger_id, INSTR(rangers_formatted.ranger_id, '-') + 1)
)
WHERE EXISTS (
  SELECT 1 FROM roots r
  WHERE r.child_unit_no = rangers_formatted.unit_no
    AND r.slug = SUBSTR(rangers_formatted.ranger_id, INSTR(rangers_formatted.ranger_id, '-') + 1)
);

-- Create indexes for sorting performance
CREATE INDEX IF NOT EXISTS idx_rangers_formatted_sort_newest
  ON rangers_formatted (released_at DESC, group_no DESC, form_rank ASC, ranger_id ASC);

CREATE INDEX IF NOT EXISTS idx_rangers_formatted_sort_oldest
  ON rangers_formatted (released_at ASC, group_no ASC, form_rank ASC, ranger_id ASC);
