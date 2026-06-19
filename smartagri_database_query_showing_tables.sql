USE smart_agri;

-- ─── Farmers registered ──────────────────────────────────
SELECT id, name, email, location, primary_crop, created_at 
FROM users;

-- ─── total u\farmers delete ──────────────────────────────────

DELETE FROM users;

ALTER TABLE users AUTO_INCREMENT = 1;

-- ─── specific farmer delete ──────────────────────────────────

DELETE FROM users WHERE email = 'farmer@example.com';
-- அல்லது
DELETE FROM users WHERE id = 2;


-- ─── Community posts ─────────────────────────────────────
SELECT fp.id, u.name AS farmer, fp.title, fp.created_at 
FROM farmer_posts fp 
JOIN users u ON fp.user_id = u.id;

-- ─── Likes ───────────────────────────────────────────────
SELECT u.name AS farmer, fp.title AS post 
FROM likes l 
JOIN users u ON l.user_id = u.id 
JOIN farmer_posts fp ON l.post_id = fp.id;

-- ─── Comments ────────────────────────────────────────────
SELECT u.name AS farmer, c.comment, c.created_at 
FROM comments c 
JOIN users u ON c.user_id = u.id;

-- ─── Profit history ──────────────────────────────────────
SELECT u.name AS farmer, p.crop_name, p.investment, p.profit, p.created_at 
FROM profit_history p 
JOIN users u ON p.user_id = u.id;

-- ─── Motor / Irrigation status ───────────────────────────
SELECT u.name AS farmer, m.status, m.auto_mode, m.land_location, m.updated_at 
FROM motor_status m 
JOIN users u ON m.user_id = u.id;

-- ─── Irrigation logs ─────────────────────────────────────
SELECT u.name AS farmer, l.action, l.triggered_by, l.created_at 
FROM irrigation_logs l 
JOIN users u ON l.user_id = u.id;

-- ─── Soil analysis ───────────────────────────────────────
SELECT u.name AS farmer, s.soil_type, s.confidence, s.created_at 
FROM soil_analysis s 
JOIN users u ON s.user_id = u.id;

-- ─── Disease detections ──────────────────────────────────
SELECT u.name AS farmer, d.crop_type, d.disease_name, d.severity, d.created_at 
FROM disease_detections d 
JOIN users u ON d.user_id = u.id;

-- ─── Farm history ────────────────────────────────────────
SELECT u.name AS farmer, fh.type_key, fh.field_key, fh.quantity, fh.unit_key, fh.activity_date 
FROM farm_history fh 
JOIN users u ON fh.user_id = u.id;


SELECT * FROM users;               -- யாரு register பண்ணாங்க
SELECT * FROM farm_history;        -- farm history entries
SELECT * FROM farmer_posts;        -- community posts
SELECT * FROM disease_detections;  -- disease scans
