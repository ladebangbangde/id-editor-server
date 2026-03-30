ALTER TABLE photo_tasks
  ADD COLUMN IF NOT EXISTS print_url VARCHAR(255) NULL AFTER result_url,
  ADD COLUMN IF NOT EXISTS original_path VARCHAR(512) NULL AFTER print_url,
  ADD COLUMN IF NOT EXISTS preview_path VARCHAR(512) NULL AFTER original_path,
  ADD COLUMN IF NOT EXISTS hd_path VARCHAR(512) NULL AFTER preview_path,
  ADD COLUMN IF NOT EXISTS print_path VARCHAR(512) NULL AFTER hd_path,
  ADD COLUMN IF NOT EXISTS openid_hash VARCHAR(64) NULL AFTER print_path,
  ADD COLUMN IF NOT EXISTS retain_until DATETIME NULL AFTER openid_hash,
  ADD COLUMN IF NOT EXISTS deleted_at DATETIME NULL AFTER retain_until,
  ADD COLUMN IF NOT EXISTS physical_deleted_at DATETIME NULL AFTER deleted_at;

CREATE INDEX IF NOT EXISTS idx_photo_tasks_user_deleted_created ON photo_tasks(user_id, deleted_at, created_at);
CREATE INDEX IF NOT EXISTS idx_photo_tasks_deleted_physical ON photo_tasks(deleted_at, physical_deleted_at);
CREATE INDEX IF NOT EXISTS idx_photo_tasks_retain_until ON photo_tasks(retain_until);
