const db = require("../config/db");

/* ──────────────────────────────────
   GET ALL FARM HISTORY (for logged-in farmer)
────────────────────────────────── */
exports.getFarmHistory = (req, res) => {
    const userId = req.user.id;
    const sql = `
        SELECT id, type_key, field_key, quantity, unit_key, notes,
               DATE_FORMAT(activity_date, '%Y-%m-%d') AS date,
               created_at
        FROM farm_history
        WHERE user_id = ?
        ORDER BY activity_date DESC, created_at DESC
    `;
    db.query(sql, [userId], (err, rows) => {
        if (err) return res.status(500).json({ success: false, message: err.message });
        res.json({ success: true, data: rows });
    });
};

/* ──────────────────────────────────
   ADD FARM HISTORY ENTRY
────────────────────────────────── */
exports.addFarmHistory = (req, res) => {
    const userId = req.user.id;
    const { type_key, field_key, quantity, unit_key, notes, date } = req.body;

    if (!type_key || !field_key || !quantity || !unit_key || !date) {
        return res.status(400).json({ success: false, message: "type_key, field_key, quantity, unit_key, date are required" });
    }

    const sql = `
        INSERT INTO farm_history (user_id, type_key, field_key, quantity, unit_key, notes, activity_date)
        VALUES (?, ?, ?, ?, ?, ?, ?)
    `;
    db.query(sql, [userId, type_key, field_key, parseFloat(quantity), unit_key, notes || null, date], (err, result) => {
        if (err) return res.status(500).json({ success: false, message: err.message });
        res.status(201).json({
            success: true,
            message: "Activity saved",
            id: result.insertId,
        });
    });
};

/* ──────────────────────────────────
   DELETE FARM HISTORY ENTRY
────────────────────────────────── */
exports.deleteFarmHistory = (req, res) => {
    const userId = req.user.id;
    const { id } = req.params;

    const sql = "DELETE FROM farm_history WHERE id = ? AND user_id = ?";
    db.query(sql, [id, userId], (err, result) => {
        if (err) return res.status(500).json({ success: false, message: err.message });
        if (result.affectedRows === 0) {
            return res.status(403).json({ success: false, message: "Not found or not allowed" });
        }
        res.json({ success: true, message: "Activity deleted" });
    });
};

/* ──────────────────────────────────
   CLEAR ALL FARM HISTORY (for logged-in farmer)
────────────────────────────────── */
exports.clearFarmHistory = (req, res) => {
    const userId = req.user.id;
    const sql = "DELETE FROM farm_history WHERE user_id = ?";
    db.query(sql, [userId], (err) => {
        if (err) return res.status(500).json({ success: false, message: err.message });
        res.json({ success: true, message: "All history cleared" });
    });
};
