const db = require("../config/db");

/* ══════════════════════════════════════════════
   FARM DETAILS
══════════════════════════════════════════════ */

exports.getFarmDetails = (req, res) => {
    const userId = req.user.id;
    db.query("SELECT * FROM farm_details WHERE user_id=?", [userId], (err, rows) => {
        if (err) return res.status(500).json({ success:false, message:err.message });
        res.json({ success:true, data: rows[0] || null });
    });
};

exports.saveFarmDetails = (req, res) => {
    const userId = req.user.id;
    const { farm_name, owner, location, total_area, established, soil_type, water_source, active_crops } = req.body;

    const sql = `
        INSERT INTO farm_details (user_id, farm_name, owner, location, total_area, established, soil_type, water_source, active_crops)
        VALUES (?,?,?,?,?,?,?,?,?)
        ON DUPLICATE KEY UPDATE
            farm_name=VALUES(farm_name), owner=VALUES(owner), location=VALUES(location),
            total_area=VALUES(total_area), established=VALUES(established), soil_type=VALUES(soil_type),
            water_source=VALUES(water_source), active_crops=VALUES(active_crops), updated_at=NOW()
    `;
    db.query(sql, [userId, farm_name, owner, location, total_area, established, soil_type, water_source, active_crops], (err) => {
        if (err) return res.status(500).json({ success:false, message:err.message });
        res.json({ success:true, message:"Farm details saved" });
    });
};

/* ══════════════════════════════════════════════
   FARM FIELDS
══════════════════════════════════════════════ */

exports.getFields = (req, res) => {
    const userId = req.user.id;
    db.query("SELECT * FROM farm_fields WHERE user_id=? ORDER BY sort_order ASC, id ASC", [userId], (err, rows) => {
        if (err) return res.status(500).json({ success:false, message:err.message });
        res.json({ success:true, data: rows });
    });
};

exports.saveField = (req, res) => {
    const userId = req.user.id;
    const { id, field_name, crop, area, health, irrigation, season, sort_order } = req.body;

    if (id) {
        // Update existing
        const sql = `UPDATE farm_fields SET field_name=?,crop=?,area=?,health=?,irrigation=?,season=?,sort_order=?,updated_at=NOW()
                     WHERE id=? AND user_id=?`;
        db.query(sql, [field_name, crop, area, health, irrigation, season, sort_order||0, id, userId], (err) => {
            if (err) return res.status(500).json({ success:false, message:err.message });
            res.json({ success:true, message:"Field updated" });
        });
    } else {
        // Insert new
        const sql = `INSERT INTO farm_fields (user_id,field_name,crop,area,health,irrigation,season,sort_order)
                     VALUES (?,?,?,?,?,?,?,?)`;
        db.query(sql, [userId, field_name, crop, area||1, health||80, irrigation||null, season||null, sort_order||0], (err, result) => {
            if (err) return res.status(500).json({ success:false, message:err.message });
            res.json({ success:true, message:"Field added", id: result.insertId });
        });
    }
};

exports.deleteField = (req, res) => {
    const userId = req.user.id;
    const { id } = req.params;
    db.query("DELETE FROM farm_fields WHERE id=? AND user_id=?", [id, userId], (err, result) => {
        if (err) return res.status(500).json({ success:false, message:err.message });
        if (result.affectedRows === 0) return res.status(403).json({ success:false, message:"Not allowed" });
        res.json({ success:true, message:"Field deleted" });
    });
};

/* ══════════════════════════════════════════════
   CROP CALENDAR
══════════════════════════════════════════════ */

exports.getCalendar = (req, res) => {
    const userId = req.user.id;
    db.query("SELECT * FROM crop_calendar WHERE user_id=? ORDER BY sort_order ASC, id ASC", [userId], (err, rows) => {
        if (err) return res.status(500).json({ success:false, message:err.message });
        res.json({ success:true, data: rows });
    });
};

exports.saveCalendarItem = (req, res) => {
    const userId = req.user.id;
    const { id, month, task, done, sort_order } = req.body;

    if (id) {
        const sql = `UPDATE crop_calendar SET month=?,task=?,done=?,sort_order=?,updated_at=NOW()
                     WHERE id=? AND user_id=?`;
        db.query(sql, [month, task, done?1:0, sort_order||0, id, userId], (err) => {
            if (err) return res.status(500).json({ success:false, message:err.message });
            res.json({ success:true, message:"Calendar item updated" });
        });
    } else {
        const sql = `INSERT INTO crop_calendar (user_id,month,task,done,sort_order) VALUES (?,?,?,?,?)`;
        db.query(sql, [userId, month, task, done?1:0, sort_order||0], (err, result) => {
            if (err) return res.status(500).json({ success:false, message:err.message });
            res.json({ success:true, message:"Calendar item added", id: result.insertId });
        });
    }
};

exports.deleteCalendarItem = (req, res) => {
    const userId = req.user.id;
    const { id } = req.params;
    db.query("DELETE FROM crop_calendar WHERE id=? AND user_id=?", [id, userId], (err, result) => {
        if (err) return res.status(500).json({ success:false, message:err.message });
        if (result.affectedRows === 0) return res.status(403).json({ success:false, message:"Not allowed" });
        res.json({ success:true, message:"Calendar item deleted" });
    });
};
