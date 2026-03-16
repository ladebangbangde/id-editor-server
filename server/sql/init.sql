CREATE DATABASE IF NOT EXISTS ai_id_photo DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE ai_id_photo;

CREATE TABLE IF NOT EXISTS users (
  id BIGINT PRIMARY KEY AUTO_INCREMENT,
  openid VARCHAR(64) NOT NULL UNIQUE,
  unionid VARCHAR(64) NULL,
  nickname VARCHAR(128) NOT NULL,
  avatar VARCHAR(255) NULL,
  status TINYINT NOT NULL DEFAULT 1,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);
CREATE TABLE IF NOT EXISTS scene_templates (
  id BIGINT PRIMARY KEY AUTO_INCREMENT,
  scene_key VARCHAR(64) NOT NULL UNIQUE,
  scene_name VARCHAR(64) NOT NULL,
  width_mm DECIMAL(8,2) NOT NULL,
  height_mm DECIMAL(8,2) NOT NULL,
  pixel_width INT NOT NULL,
  pixel_height INT NOT NULL,
  description VARCHAR(255) NULL,
  allow_beauty TINYINT NOT NULL DEFAULT 1,
  allow_print TINYINT NOT NULL DEFAULT 1,
  is_active TINYINT NOT NULL DEFAULT 1,
  sort_order INT NOT NULL DEFAULT 0,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);
CREATE TABLE IF NOT EXISTS images (
  id BIGINT PRIMARY KEY AUTO_INCREMENT,
  user_id BIGINT NOT NULL,
  source_type ENUM('scene','custom') NOT NULL,
  scene_key VARCHAR(64) NULL,
  custom_width_mm DECIMAL(8,2) NULL,
  custom_height_mm DECIMAL(8,2) NULL,
  original_url VARCHAR(255) NOT NULL,
  file_name VARCHAR(255) NOT NULL,
  mime_type VARCHAR(64) NOT NULL,
  file_size BIGINT NOT NULL,
  width_px INT NOT NULL,
  height_px INT NOT NULL,
  status VARCHAR(32) NOT NULL DEFAULT 'uploaded',
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);
CREATE TABLE IF NOT EXISTS image_tasks (
  id BIGINT PRIMARY KEY AUTO_INCREMENT,
  image_id BIGINT NOT NULL,
  user_id BIGINT NOT NULL,
  task_type VARCHAR(64) NOT NULL,
  status ENUM('pending','processing','success','failed') NOT NULL DEFAULT 'pending',
  progress INT NOT NULL DEFAULT 0,
  error_message VARCHAR(255) NULL,
  started_at DATETIME NULL,
  finished_at DATETIME NULL,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);
CREATE TABLE IF NOT EXISTS image_results (
  id BIGINT PRIMARY KEY AUTO_INCREMENT,
  image_id BIGINT NOT NULL,
  task_id BIGINT NOT NULL,
  preview_url VARCHAR(255) NOT NULL,
  hd_url VARCHAR(255) NOT NULL,
  print_url VARCHAR(255) NULL,
  background_color VARCHAR(32) NOT NULL DEFAULT 'white',
  width_mm DECIMAL(8,2) NOT NULL,
  height_mm DECIMAL(8,2) NOT NULL,
  pixel_width INT NOT NULL,
  pixel_height INT NOT NULL,
  quality_status VARCHAR(32) NOT NULL DEFAULT 'pending',
  is_paid_hd TINYINT NOT NULL DEFAULT 0,
  is_paid_print TINYINT NOT NULL DEFAULT 0,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);
CREATE TABLE IF NOT EXISTS orders (
  id BIGINT PRIMARY KEY AUTO_INCREMENT,
  order_no VARCHAR(64) NOT NULL UNIQUE,
  user_id BIGINT NOT NULL,
  image_id BIGINT NOT NULL,
  result_id BIGINT NOT NULL,
  order_type ENUM('hd','print','package') NOT NULL,
  amount DECIMAL(10,2) NOT NULL,
  currency VARCHAR(8) NOT NULL DEFAULT 'CNY',
  status ENUM('pending','paid','cancelled','refunded') NOT NULL DEFAULT 'pending',
  paid_at DATETIME NULL,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);
CREATE TABLE IF NOT EXISTS payment_records (
  id BIGINT PRIMARY KEY AUTO_INCREMENT,
  order_id BIGINT NOT NULL,
  payment_channel VARCHAR(32) NOT NULL,
  transaction_no VARCHAR(64) NOT NULL,
  amount DECIMAL(10,2) NOT NULL,
  status VARCHAR(32) NOT NULL,
  raw_callback JSON NULL,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);
CREATE TABLE IF NOT EXISTS download_records (
  id BIGINT PRIMARY KEY AUTO_INCREMENT,
  user_id BIGINT NOT NULL,
  order_id BIGINT NULL,
  result_id BIGINT NOT NULL,
  download_type ENUM('preview','hd','print') NOT NULL,
  download_ip VARCHAR(64) NULL,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);
CREATE TABLE IF NOT EXISTS admin_users (
  id BIGINT PRIMARY KEY AUTO_INCREMENT,
  username VARCHAR(64) NOT NULL UNIQUE,
  password_hash VARCHAR(255) NOT NULL,
  role VARCHAR(32) NOT NULL DEFAULT 'admin',
  status TINYINT NOT NULL DEFAULT 1,
  last_login_at DATETIME NULL,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);
INSERT INTO scene_templates (scene_key, scene_name, width_mm, height_mm, pixel_width, pixel_height, description, allow_beauty, allow_print, is_active, sort_order) VALUES
('one_inch','一寸证件照',25.00,35.00,295,413,'一寸标准证件照',1,1,1,1),
('two_inch','二寸证件照',35.00,49.00,413,579,'二寸标准证件照',1,1,1,2),
('passport','护照照片',33.00,48.00,390,567,'中国护照照片规格',1,1,1,3),
('visa','签证照片',35.00,45.00,413,531,'常见签证照片规格',1,1,1,4),
('driver_license','驾驶证照片',22.00,32.00,260,378,'驾驶证报名照',0,1,1,5),
('resume','简历照片',35.00,45.00,413,531,'简历头像照',1,1,1,6),
('exam_registration','考试报名照',30.00,40.00,354,472,'考试报名通用尺寸',0,1,1,7)
ON DUPLICATE KEY UPDATE scene_name=VALUES(scene_name), updated_at=CURRENT_TIMESTAMP;
