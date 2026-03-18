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


CREATE TABLE IF NOT EXISTS spec_categories (
  id BIGINT PRIMARY KEY AUTO_INCREMENT,
  `key` VARCHAR(64) NOT NULL UNIQUE,
  name VARCHAR(64) NOT NULL,
  sort INT NOT NULL DEFAULT 0,
  is_active TINYINT NOT NULL DEFAULT 1,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);
CREATE TABLE IF NOT EXISTS spec_templates (
  id VARCHAR(64) PRIMARY KEY,
  category_key VARCHAR(64) NOT NULL,
  name VARCHAR(64) NOT NULL,
  scene VARCHAR(128) NOT NULL,
  pixel_width INT NOT NULL,
  pixel_height INT NOT NULL,
  pixel_text VARCHAR(32) NOT NULL,
  width_mm DECIMAL(8,2) NOT NULL,
  height_mm DECIMAL(8,2) NOT NULL,
  background_options JSON NOT NULL,
  tags JSON NOT NULL,
  is_hot TINYINT NOT NULL DEFAULT 0,
  sort INT NOT NULL DEFAULT 0,
  action_path VARCHAR(255) NOT NULL,
  is_active TINYINT NOT NULL DEFAULT 1,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  KEY idx_spec_templates_category_sort (category_key, is_active, is_hot, sort)
);

INSERT INTO spec_categories (`key`, name, sort, is_active) VALUES
('hot', '热门尺寸', 1, 1),
('common', '通用寸照', 2, 1),
('medical', '医药卫生', 3, 1),
('language', '语言考试', 4, 1),
('civil', '公务考试', 5, 1),
('education', '学历考试', 6, 1),
('job', '职业资格', 7, 1),
('passport', '签证护照', 8, 1),
('police', '公安证件', 9, 1),
('social', '社保民政', 10, 1)
ON DUPLICATE KEY UPDATE name=VALUES(name), sort=VALUES(sort), is_active=VALUES(is_active), updated_at=CURRENT_TIMESTAMP;

INSERT INTO spec_templates (id, category_key, name, scene, pixel_width, pixel_height, pixel_text, width_mm, height_mm, background_options, tags, is_hot, sort, action_path, is_active) VALUES
('size_001', 'hot', '一寸', '常规证件照', 295, 413, '295×413PX', 25.00, 35.00, JSON_ARRAY('白底', '蓝底', '红底'), JSON_ARRAY('常用'), 1, 1, '/pages/spec-detail/index?id=size_001', 1),
('size_002', 'hot', '二寸', '常规证件照', 413, 579, '413×579PX', 35.00, 49.00, JSON_ARRAY('白底', '蓝底', '红底'), JSON_ARRAY('常用'), 1, 2, '/pages/spec-detail/index?id=size_002', 1),
('size_003', 'hot', '小一寸', '常规证件照', 260, 378, '260×378PX', 22.00, 32.00, JSON_ARRAY('白底', '蓝底', '红底'), JSON_ARRAY('热门'), 1, 3, '/pages/spec-detail/index?id=size_003', 1),
('size_004', 'hot', '小二寸', '常规证件照', 413, 531, '413×531PX', 35.00, 45.00, JSON_ARRAY('白底', '蓝底', '红底'), JSON_ARRAY('热门'), 1, 4, '/pages/spec-detail/index?id=size_004', 1),
('size_005', 'hot', '大二寸', '常规证件照', 413, 626, '413×626PX', 35.00, 53.00, JSON_ARRAY('白底', '蓝底', '红底'), JSON_ARRAY('推荐'), 1, 5, '/pages/spec-detail/index?id=size_005', 1),
('size_006', 'common', '一寸', '通用报名照', 295, 413, '295×413PX', 25.00, 35.00, JSON_ARRAY('红底', '蓝底', '白底'), JSON_ARRAY('通用'), 0, 1, '/pages/spec-detail/index?id=size_006', 1),
('size_007', 'common', '二寸', '通用报名照', 413, 579, '413×579PX', 35.00, 49.00, JSON_ARRAY('红底', '蓝底', '白底'), JSON_ARRAY('通用'), 0, 2, '/pages/spec-detail/index?id=size_007', 1),
('size_008', 'common', '小一寸', '通用报名照', 260, 378, '260×378PX', 22.00, 32.00, JSON_ARRAY('红底', '蓝底', '白底'), JSON_ARRAY('通用'), 0, 3, '/pages/spec-detail/index?id=size_008', 1),
('size_009', 'common', '小二寸', '通用报名照', 413, 531, '413×531PX', 35.00, 45.00, JSON_ARRAY('红底', '蓝底', '白底'), JSON_ARRAY('通用'), 0, 4, '/pages/spec-detail/index?id=size_009', 1),
('size_010', 'common', '大一寸', '通用报名照', 390, 567, '390×567PX', 33.00, 48.00, JSON_ARRAY('红底', '蓝底', '白底'), JSON_ARRAY('通用'), 0, 5, '/pages/spec-detail/index?id=size_010', 1),
('size_011', 'common', '大二寸', '通用报名照', 413, 626, '413×626PX', 35.00, 53.00, JSON_ARRAY('红底', '蓝底', '白底'), JSON_ARRAY('通用'), 0, 6, '/pages/spec-detail/index?id=size_011', 1),
('size_012', 'medical', '健康证', '健康证办理照', 358, 441, '358×441PX', 30.00, 37.00, JSON_ARRAY('白底', '蓝底'), JSON_ARRAY('医药卫生'), 0, 1, '/pages/spec-detail/index?id=size_012', 1),
('size_013', 'medical', '执业药师报名照', '执业药师考试报名', 295, 413, '295×413PX', 25.00, 35.00, JSON_ARRAY('白底', '蓝底'), JSON_ARRAY('报名'), 0, 2, '/pages/spec-detail/index?id=size_013', 1),
('size_014', 'medical', '护士/医护类报名照', '护士执业或医护报名', 413, 531, '413×531PX', 35.00, 45.00, JSON_ARRAY('白底', '蓝底'), JSON_ARRAY('医护'), 0, 3, '/pages/spec-detail/index?id=size_014', 1),
('size_015', 'language', '雅思', 'IELTS 报名照片', 389, 567, '389×567PX', 33.00, 48.00, JSON_ARRAY('白底'), JSON_ARRAY('考试'), 0, 1, '/pages/spec-detail/index?id=size_015', 1),
('size_016', 'language', '托福', 'TOEFL 报名照片', 390, 567, '390×567PX', 33.00, 48.00, JSON_ARRAY('白底'), JSON_ARRAY('考试'), 0, 2, '/pages/spec-detail/index?id=size_016', 1),
('size_017', 'language', '普通话考试', '普通话水平测试', 390, 567, '390×567PX', 33.00, 48.00, JSON_ARRAY('白底', '蓝底'), JSON_ARRAY('考试'), 0, 3, '/pages/spec-detail/index?id=size_017', 1),
('size_018', 'language', '英语等级考试', '英语等级报名照', 295, 413, '295×413PX', 25.00, 35.00, JSON_ARRAY('白底', '蓝底'), JSON_ARRAY('考试'), 0, 4, '/pages/spec-detail/index?id=size_018', 1),
('size_019', 'civil', '国考', '国家公务员考试', 295, 413, '295×413PX', 25.00, 35.00, JSON_ARRAY('蓝底', '白底'), JSON_ARRAY('公务考试'), 0, 1, '/pages/spec-detail/index?id=size_019', 1),
('size_020', 'civil', '省考', '省级公务员考试', 295, 413, '295×413PX', 25.00, 35.00, JSON_ARRAY('蓝底', '白底'), JSON_ARRAY('公务考试'), 0, 2, '/pages/spec-detail/index?id=size_020', 1),
('size_021', 'civil', '事业单位报名', '事业单位公开招聘', 413, 531, '413×531PX', 35.00, 45.00, JSON_ARRAY('蓝底', '白底'), JSON_ARRAY('报名'), 0, 3, '/pages/spec-detail/index?id=size_021', 1),
('size_022', 'civil', '三支一扶', '三支一扶计划报名', 295, 413, '295×413PX', 25.00, 35.00, JSON_ARRAY('蓝底', '白底'), JSON_ARRAY('报名'), 0, 4, '/pages/spec-detail/index?id=size_022', 1),
('size_023', 'education', '研究生考试', '全国硕士研究生招生考试', 413, 531, '413×531PX', 35.00, 45.00, JSON_ARRAY('蓝底', '白底'), JSON_ARRAY('学历考试'), 0, 1, '/pages/spec-detail/index?id=size_023', 1),
('size_024', 'education', '成人高考', '成人高考报名', 295, 413, '295×413PX', 25.00, 35.00, JSON_ARRAY('蓝底', '白底'), JSON_ARRAY('学历考试'), 0, 2, '/pages/spec-detail/index?id=size_024', 1),
('size_025', 'education', '自考', '自学考试报名', 295, 413, '295×413PX', 25.00, 35.00, JSON_ARRAY('蓝底', '白底'), JSON_ARRAY('学历考试'), 0, 3, '/pages/spec-detail/index?id=size_025', 1),
('size_026', 'education', '专升本', '专升本报名', 295, 413, '295×413PX', 25.00, 35.00, JSON_ARRAY('蓝底', '白底'), JSON_ARRAY('学历考试'), 0, 4, '/pages/spec-detail/index?id=size_026', 1),
('size_027', 'job', '教资报名（请选白底）', '教师资格证报名', 295, 413, '295×413PX', 25.00, 35.00, JSON_ARRAY('白底'), JSON_ARRAY('白底优先', '职业资格'), 0, 1, '/pages/spec-detail/index?id=size_027', 1),
('size_028', 'job', '一建报名', '一级建造师考试报名', 295, 413, '295×413PX', 25.00, 35.00, JSON_ARRAY('白底', '蓝底'), JSON_ARRAY('职业资格'), 0, 2, '/pages/spec-detail/index?id=size_028', 1),
('size_029', 'job', '二建报名', '二级建造师考试报名', 295, 413, '295×413PX', 25.00, 35.00, JSON_ARRAY('白底', '蓝底'), JSON_ARRAY('职业资格'), 0, 3, '/pages/spec-detail/index?id=size_029', 1),
('size_030', 'job', '会计考试', '会计类资格考试报名', 295, 413, '295×413PX', 25.00, 35.00, JSON_ARRAY('白底', '蓝底'), JSON_ARRAY('职业资格'), 0, 4, '/pages/spec-detail/index?id=size_030', 1),
('size_031', 'job', '计算机考试', '计算机等级考试报名', 295, 413, '295×413PX', 25.00, 35.00, JSON_ARRAY('白底', '蓝底'), JSON_ARRAY('职业资格'), 0, 5, '/pages/spec-detail/index?id=size_031', 1),
('size_032', 'passport', '护照', '中国护照照片', 390, 567, '390×567PX', 33.00, 48.00, JSON_ARRAY('白底'), JSON_ARRAY('出入境'), 0, 1, '/pages/spec-detail/index?id=size_032', 1),
('size_033', 'passport', '港澳通行证', '港澳居民来往内地通行证', 390, 567, '390×567PX', 33.00, 48.00, JSON_ARRAY('白底', '蓝底'), JSON_ARRAY('出入境'), 0, 2, '/pages/spec-detail/index?id=size_033', 1),
('size_034', 'passport', '台湾通行证', '大陆居民往来台湾通行证', 390, 567, '390×567PX', 33.00, 48.00, JSON_ARRAY('白底', '蓝底'), JSON_ARRAY('出入境'), 0, 3, '/pages/spec-detail/index?id=size_034', 1),
('size_035', 'passport', '签证照', '常见签证办理照片', 413, 531, '413×531PX', 35.00, 45.00, JSON_ARRAY('白底', '蓝底'), JSON_ARRAY('签证'), 0, 4, '/pages/spec-detail/index?id=size_035', 1),
('size_036', 'police', '身份证', '身份证办理照', 358, 441, '358×441PX', 30.00, 37.00, JSON_ARRAY('白底'), JSON_ARRAY('公安证件'), 0, 1, '/pages/spec-detail/index?id=size_036', 1),
('size_037', 'police', '驾驶证', '驾驶证证件照', 260, 378, '260×378PX', 22.00, 32.00, JSON_ARRAY('白底'), JSON_ARRAY('公安证件'), 0, 2, '/pages/spec-detail/index?id=size_037', 1),
('size_038', 'police', '居住证', '居住证办理照', 358, 441, '358×441PX', 30.00, 37.00, JSON_ARRAY('白底'), JSON_ARRAY('公安证件'), 0, 3, '/pages/spec-detail/index?id=size_038', 1),
('size_039', 'social', '社保卡', '社保卡办理照', 358, 441, '358×441PX', 30.00, 37.00, JSON_ARRAY('白底', '蓝底'), JSON_ARRAY('社保民政'), 0, 1, '/pages/spec-detail/index?id=size_039', 1),
('size_040', 'social', '结婚登记照', '结婚登记证件照', 413, 579, '413×579PX', 35.00, 49.00, JSON_ARRAY('红底'), JSON_ARRAY('红底优先', '双人照'), 0, 2, '/pages/spec-detail/index?id=size_040', 1),
('size_041', 'social', '离婚登记照', '离婚登记证件照', 413, 579, '413×579PX', 35.00, 49.00, JSON_ARRAY('白底', '蓝底'), JSON_ARRAY('民政'), 0, 3, '/pages/spec-detail/index?id=size_041', 1),
('size_042', 'social', '大学生图像采集', '高校毕业生图像采集', 480, 640, '480×640PX', 40.00, 53.00, JSON_ARRAY('蓝底', '白底'), JSON_ARRAY('学籍'), 0, 4, '/pages/spec-detail/index?id=size_042', 1)
ON DUPLICATE KEY UPDATE
  category_key=VALUES(category_key),
  name=VALUES(name),
  scene=VALUES(scene),
  pixel_width=VALUES(pixel_width),
  pixel_height=VALUES(pixel_height),
  pixel_text=VALUES(pixel_text),
  width_mm=VALUES(width_mm),
  height_mm=VALUES(height_mm),
  background_options=VALUES(background_options),
  tags=VALUES(tags),
  is_hot=VALUES(is_hot),
  sort=VALUES(sort),
  action_path=VALUES(action_path),
  is_active=VALUES(is_active),
  updated_at=CURRENT_TIMESTAMP;
