-- ============================================================
--  AgroSmart Database Schema  — smart_agri
--  Run this in MySQL Workbench or phpMyAdmin
-- ============================================================

CREATE DATABASE IF NOT EXISTS smart_agri;
USE smart_agri;

-- ─── USERS ────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS users (
    id           INT AUTO_INCREMENT PRIMARY KEY,
    name         VARCHAR(100) NOT NULL,
    email        VARCHAR(150) UNIQUE NOT NULL,
    password     VARCHAR(255) NOT NULL,
    location     VARCHAR(200),
    phone        VARCHAR(15),
    farm_size    DECIMAL(10,2),
    primary_crop VARCHAR(100),
    state        VARCHAR(100),
    profile_pic  VARCHAR(255),
    created_at   TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ─── FARMER POSTS (Community) ─────────────────────────────
CREATE TABLE IF NOT EXISTS farmer_posts (
    id          INT AUTO_INCREMENT PRIMARY KEY,
    user_id     INT NOT NULL,
    title       VARCHAR(255) NOT NULL,
    description TEXT,
    image       VARCHAR(255),
    created_at  TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- ─── LIKES ────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS likes (
    id         INT AUTO_INCREMENT PRIMARY KEY,
    user_id    INT NOT NULL,
    post_id    INT NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE KEY unique_like (user_id, post_id),
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (post_id) REFERENCES farmer_posts(id) ON DELETE CASCADE
);

-- ─── COMMENTS ─────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS comments (
    id         INT AUTO_INCREMENT PRIMARY KEY,
    user_id    INT NOT NULL,
    post_id    INT NOT NULL,
    comment    TEXT NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (post_id) REFERENCES farmer_posts(id) ON DELETE CASCADE
);

-- ─── PROFIT HISTORY ───────────────────────────────────────
CREATE TABLE IF NOT EXISTS profit_history (
    id          INT AUTO_INCREMENT PRIMARY KEY,
    user_id     INT NOT NULL,
    crop_name   VARCHAR(100) NOT NULL,
    investment  DECIMAL(12,2) NOT NULL,
    profit      DECIMAL(12,2) NOT NULL,
    description TEXT,
    image       VARCHAR(255),
    created_at  TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- ─── MOTOR STATUS (Irrigation) ────────────────────────────
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

-- ─── IRRIGATION LOGS ──────────────────────────────────────
CREATE TABLE IF NOT EXISTS irrigation_logs (
    id           INT AUTO_INCREMENT PRIMARY KEY,
    user_id      INT NOT NULL,
    action       ENUM('on','off') NOT NULL,
    triggered_by ENUM('manual','auto_weather','schedule') DEFAULT 'manual',
    created_at   TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- ─── SENSORS (IoT Devices) ────────────────────────────────
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

-- ─── SENSOR DATA ──────────────────────────────────────────
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

-- ─── DISEASE DETECTIONS ───────────────────────────────────
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

-- ─── FARM PHOTO ANALYSIS ──────────────────────────────────
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

-- ─── Uploads folder reminder ──────────────────────────────
-- Make sure these folders exist in agrosmart-backend/uploads/:
--   uploads/posts/
--   uploads/diseases/
--   uploads/profiles/
