-- ============================================================
--  AgroSmart — MySQL 8.0 Compatible ALTER Script (SAFE)
--  பழைய DB-ல run பண்ணாலும் error வராது (IF NOT EXISTS)
--  New Tab-ல paste பண்ணி Execute பண்ணு
-- ============================================================

USE smart_agri;

-- ─── USERS — missing columns (safe add) ──────────────────

ALTER TABLE users ADD COLUMN IF NOT EXISTS phone VARCHAR(15) DEFAULT NULL;
ALTER TABLE users ADD COLUMN IF NOT EXISTS farm_size DECIMAL(10,2) DEFAULT NULL;
ALTER TABLE users ADD COLUMN IF NOT EXISTS primary_crop VARCHAR(100) DEFAULT NULL;
ALTER TABLE users ADD COLUMN IF NOT EXISTS state VARCHAR(100) DEFAULT NULL;
ALTER TABLE users ADD COLUMN IF NOT EXISTS profile_pic VARCHAR(255) DEFAULT NULL;

-- ─── PROFIT_HISTORY — image & created_at (safe add) ──────

ALTER TABLE profit_history ADD COLUMN IF NOT EXISTS image VARCHAR(255) DEFAULT NULL;
ALTER TABLE profit_history ADD COLUMN IF NOT EXISTS created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP;

-- ─── LIKES — unique constraint (safe) ────────────────────

ALTER TABLE likes DROP INDEX IF EXISTS unique_like;
ALTER TABLE likes ADD UNIQUE KEY unique_like (user_id, post_id);

-- ─── MOTOR STATUS — new table ────────────────────────────

CREATE TABLE IF NOT EXISTS motor_status (
    id            INT AUTO_INCREMENT PRIMARY KEY,
    user_id       INT NOT NULL UNIQUE,
    status        ENUM('on','off') DEFAULT 'off',
    auto_mode     TINYINT(1) DEFAULT 0,
    land_location VARCHAR(255),
    lat           DECIMAL(10,7),
    lon           DECIMAL(10,7),
    updated_at    TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- ─── IRRIGATION LOGS — new columns (safe) ────────────────
-- NOTE: database.sql-ல already user_id, action, triggered_by இருக்கு.
-- இந்த ALTER பழைய minimal schema-க்கு மட்டும் applicable.

ALTER TABLE irrigation_logs ADD COLUMN IF NOT EXISTS user_id INT DEFAULT NULL;
ALTER TABLE irrigation_logs ADD COLUMN IF NOT EXISTS action VARCHAR(20) DEFAULT 'off';
ALTER TABLE irrigation_logs ADD COLUMN IF NOT EXISTS triggered_by VARCHAR(50) DEFAULT 'manual';

-- ─── SENSORS — new table (IoT ready) ─────────────────────

CREATE TABLE IF NOT EXISTS sensors (
    id          INT AUTO_INCREMENT PRIMARY KEY,
    user_id     INT NOT NULL,
    sensor_name VARCHAR(100) NOT NULL,
    sensor_type ENUM('soil','temperature','humidity','ph','npk','multi') DEFAULT 'multi',
    field_name  VARCHAR(100),
    device_key  VARCHAR(100) UNIQUE,
    status      ENUM('active','inactive','warning') DEFAULT 'inactive',
    last_seen   TIMESTAMP NULL,
    created_at  TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- ─── SENSOR DATA — new table ──────────────────────────────

CREATE TABLE IF NOT EXISTS sensor_data (
    id            INT AUTO_INCREMENT PRIMARY KEY,
    sensor_id     INT NOT NULL,
    temperature   DECIMAL(6,2),
    humidity      DECIMAL(6,2),
    soil_moisture DECIMAL(6,2),
    ph_level      DECIMAL(5,2),
    nitrogen      DECIMAL(8,2),
    phosphorus    DECIMAL(8,2),
    potassium     DECIMAL(8,2),
    recorded_at   TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (sensor_id) REFERENCES sensors(id) ON DELETE CASCADE
);

-- ─── DISEASE DETECTIONS — new table ──────────────────────

CREATE TABLE IF NOT EXISTS disease_detections (
    id                 INT AUTO_INCREMENT PRIMARY KEY,
    user_id            INT NOT NULL,
    image_filename     VARCHAR(255) NOT NULL,
    crop_type          VARCHAR(100),
    disease_name       VARCHAR(200),
    confidence         INT,
    severity           ENUM('low','medium','high') DEFAULT 'low',
    solutions          JSON,
    fertilizers_needed JSON,
    pesticides_needed  JSON,
    water_needed       TEXT,
    estimated_loss_pct INT DEFAULT 0,
    created_at         TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- ─── FARM PHOTO ANALYSIS — new table ─────────────────────

CREATE TABLE IF NOT EXISTS farm_photo_analysis (
    id             INT AUTO_INCREMENT PRIMARY KEY,
    user_id        INT NOT NULL,
    image_filename VARCHAR(255) NOT NULL,
    status         ENUM('positive','warning','alert') DEFAULT 'positive',
    command        TEXT,
    details        JSON,
    created_at     TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- ─── Verify ───────────────────────────────────────────────
SHOW TABLES;

-- ─── SOIL ANALYSIS — new table ───────────────────────────

CREATE TABLE IF NOT EXISTS soil_analysis (
    id              INT AUTO_INCREMENT PRIMARY KEY,
    user_id         INT NOT NULL,
    image_filename  VARCHAR(255),
    soil_type       VARCHAR(100),
    confidence      INT DEFAULT 0,
    ph_typical      DECIMAL(4,2),
    nitrogen        DECIMAL(8,2),
    phosphorus      DECIMAL(8,2),
    potassium       DECIMAL(8,2),
    organic_matter  DECIMAL(5,2),
    water_req       VARCHAR(100),
    drainage        VARCHAR(100),
    best_crops      JSON,
    fertilizer_rec  JSON,
    irrigation_tip  TEXT,
    soil_tip        TEXT,
    created_at      TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);


-- ─── FARM HISTORY — new table ─────────────────────────────
-- Farmer-logged activities: fertilizer, irrigation, sowing, harvest, etc.

CREATE TABLE IF NOT EXISTS farm_history (
    id          INT AUTO_INCREMENT PRIMARY KEY,
    user_id     INT NOT NULL,
    type_key    VARCHAR(50)  NOT NULL,            -- neutral key e.g. "act_urea"
    field_key   VARCHAR(50)  NOT NULL,            -- e.g. "fieldA"
    quantity    DECIMAL(10,2) NOT NULL,
    unit_key    VARCHAR(50)  NOT NULL,            -- e.g. "unitKg"
    notes       TEXT,
    activity_date DATE NOT NULL,
    created_at  TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);


-- ─── FARM DETAILS ────────────────────────────────────────
CREATE TABLE IF NOT EXISTS farm_details (
    id           INT AUTO_INCREMENT PRIMARY KEY,
    user_id      INT NOT NULL UNIQUE,
    farm_name    VARCHAR(150) DEFAULT 'My Farm',
    owner        VARCHAR(100),
    location     VARCHAR(200),
    total_area   VARCHAR(50),
    established  VARCHAR(20),
    soil_type    VARCHAR(100),
    water_source VARCHAR(150),
    active_crops VARCHAR(255),
    updated_at   TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- ─── FARM FIELDS ─────────────────────────────────────────
CREATE TABLE IF NOT EXISTS farm_fields (
    id         INT AUTO_INCREMENT PRIMARY KEY,
    user_id    INT NOT NULL,
    field_name VARCHAR(50)  NOT NULL,
    crop       VARCHAR(100),
    area       DECIMAL(6,2) DEFAULT 1,
    health     INT          DEFAULT 80,
    irrigation VARCHAR(50),
    season     VARCHAR(50),
    sort_order INT          DEFAULT 0,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- ─── CROP CALENDAR ───────────────────────────────────────
CREATE TABLE IF NOT EXISTS crop_calendar (
    id         INT AUTO_INCREMENT PRIMARY KEY,
    user_id    INT NOT NULL,
    month      VARCHAR(20)  NOT NULL,
    task       VARCHAR(255) NOT NULL,
    done       TINYINT(1)   DEFAULT 0,
    sort_order INT          DEFAULT 0,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- ─── LOGIN LOGS — new table (safe create) ────────────────
CREATE TABLE IF NOT EXISTS login_logs (
    id         INT AUTO_INCREMENT PRIMARY KEY,
    user_id    INT NOT NULL,
    email      VARCHAR(150),
    login_at   TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    ip_address VARCHAR(50),
    user_agent TEXT,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);
