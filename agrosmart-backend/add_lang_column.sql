-- ═══════════════════════════════════════════════════════
--  AgroSmart — Add preferred_lang column (MySQL safe)
--  MySQL Workbench-ல் இதை run பண்ணுங்கள்
-- ═══════════════════════════════════════════════════════
USE smart_agri;

-- Column already இருந்தாலும் error வராது — safe procedure
DROP PROCEDURE IF EXISTS add_preferred_lang;

DELIMITER $$
CREATE PROCEDURE add_preferred_lang()
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM INFORMATION_SCHEMA.COLUMNS
    WHERE TABLE_SCHEMA = 'smart_agri'
      AND TABLE_NAME   = 'users'
      AND COLUMN_NAME  = 'preferred_lang'
  ) THEN
    ALTER TABLE users ADD COLUMN preferred_lang VARCHAR(5) DEFAULT 'en';
  END IF;
END$$
DELIMITER ;

CALL add_preferred_lang();
DROP PROCEDURE IF EXISTS add_preferred_lang;

-- Verify
SELECT COLUMN_NAME, DATA_TYPE, COLUMN_DEFAULT
FROM INFORMATION_SCHEMA.COLUMNS
WHERE TABLE_SCHEMA = 'smart_agri'
  AND TABLE_NAME   = 'users'
  AND COLUMN_NAME  = 'preferred_lang';
