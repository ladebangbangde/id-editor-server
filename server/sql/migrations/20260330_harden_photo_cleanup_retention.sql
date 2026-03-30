ALTER TABLE photo_tasks
  MODIFY COLUMN source_url VARCHAR(255) NULL;

ALTER TABLE photo_tasks
  ADD COLUMN IF NOT EXISTS purged_at DATETIME NULL AFTER physical_deleted_at,
  ADD COLUMN IF NOT EXISTS cleanup_status VARCHAR(32) NOT NULL DEFAULT 'pending' AFTER purged_at,
  ADD COLUMN IF NOT EXISTS cleanup_error VARCHAR(1000) NULL AFTER cleanup_status,
  ADD COLUMN IF NOT EXISTS file_expire_at DATETIME NULL AFTER cleanup_error;

UPDATE photo_tasks
SET cleanup_status = 'pending'
WHERE cleanup_status IS NULL OR cleanup_status = '';

UPDATE photo_tasks
SET file_expire_at = DATE_ADD(deleted_at, INTERVAL 7 DAY)
WHERE deleted_at IS NOT NULL
  AND file_expire_at IS NULL;

CREATE INDEX idx_photo_tasks_cleanup_status ON photo_tasks(cleanup_status);
CREATE INDEX idx_photo_tasks_file_expire_at ON photo_tasks(file_expire_at);
CREATE INDEX idx_photo_tasks_purged_at ON photo_tasks(purged_at);
