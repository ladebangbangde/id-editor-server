ALTER TABLE photo_tasks
  ADD COLUMN IF NOT EXISTS deleted_at DATETIME NULL,
  ADD COLUMN IF NOT EXISTS delete_requested_at DATETIME NULL,
  ADD COLUMN IF NOT EXISTS physical_delete_after DATETIME NULL,
  ADD COLUMN IF NOT EXISTS source_deleted_at DATETIME NULL,
  ADD COLUMN IF NOT EXISTS preview_deleted_at DATETIME NULL,
  ADD COLUMN IF NOT EXISTS result_deleted_at DATETIME NULL;

CREATE INDEX idx_photo_tasks_soft_delete ON photo_tasks (deleted_at, physical_delete_after);
CREATE INDEX idx_photo_tasks_retention ON photo_tasks (created_at, source_deleted_at, preview_deleted_at, result_deleted_at);
