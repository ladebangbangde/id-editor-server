ALTER TABLE photo_tasks
  ADD COLUMN  print_url VARCHAR(255) NULL AFTER result_url,
  ADD COLUMN original_path VARCHAR(512) NULL AFTER print_url,
  ADD COLUMN  preview_path VARCHAR(512) NULL AFTER original_path,
  ADD COLUMN  hd_path VARCHAR(512) NULL AFTER preview_path,
  ADD COLUMN  print_path VARCHAR(512) NULL AFTER hd_path,
  ADD COLUMN  openid_hash VARCHAR(64) NULL AFTER print_path,
  ADD COLUMN  retain_until DATETIME NULL AFTER openid_hash,
  ADD COLUMN  deleted_at DATETIME NULL AFTER retain_until,
  ADD COLUMN  physical_deleted_at DATETIME NULL AFTER deleted_at;

CREATE INDEX  idx_photo_tasks_user_deleted_created ON photo_tasks(user_id, deleted_at, created_at);
CREATE INDEX  idx_photo_tasks_deleted_physical ON photo_tasks(deleted_at, physical_deleted_at);
CREATE INDEX  idx_photo_tasks_retain_until ON photo_tasks(retain_until);
