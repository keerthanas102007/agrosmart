-- ============================================================
--  FIX: Create missing login_logs table
--  Run this in phpMyAdmin → smart_agri database → SQL tab
-- ============================================================

USE smart_agri;

-- Create login_logs table
CREATE TABLE IF NOT EXISTS login_logs (
    id         INT AUTO_INCREMENT PRIMARY KEY,
    user_id    INT NOT NULL,
    email      VARCHAR(150),
    login_at   TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    ip_address VARCHAR(50),
    user_agent TEXT,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- Verify
SELECT 'login_logs table created successfully' AS status;
SHOW TABLES LIKE 'login_logs';
