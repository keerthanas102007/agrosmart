const db = require("../config/db");

/* ──────────────────────────────────
   CREATE POST
────────────────────────────────── */
exports.createPost = (req, res) => {
    const userId = req.user.id;
    const { title, description } = req.body;
    const image = req.file ? req.file.filename : null;

    const sql = `
      INSERT INTO farmer_posts (user_id, title, description, image)
      VALUES (?, ?, ?, ?)
    `;
    db.query(sql, [userId, title, description, image], (err) => {
        if (err) return res.status(500).json({ success: false, message: err.message });
        res.status(201).json({ success: true, message: "Post Created Successfully" });
    });
};

/* ──────────────────────────────────
   GET ALL POSTS (with like count, comment count, user liked?)
────────────────────────────────── */
exports.getAllPosts = (req, res) => {
    // Optional: user id from token to know if they liked a post
    const authHeader = req.headers.authorization;
    let userId = null;
    if (authHeader) {
        const jwt = require("jsonwebtoken");
        try {
            const token = authHeader.startsWith("Bearer ") ? authHeader.slice(7) : authHeader;
            const decoded = jwt.verify(token, process.env.JWT_SECRET);
            userId = decoded.id;
        } catch (_) {}
    }

    const sql = `
      SELECT
        fp.*,
        u.name AS author_name,
        u.location AS author_location,
        (SELECT COUNT(*) FROM likes l WHERE l.post_id = fp.id) AS like_count,
        (SELECT COUNT(*) FROM comments c WHERE c.post_id = fp.id) AS comment_count,
        ${userId ? `(SELECT COUNT(*) FROM likes l2 WHERE l2.post_id = fp.id AND l2.user_id = ?) AS user_liked` : "0 AS user_liked"}
      FROM farmer_posts fp
      JOIN users u ON fp.user_id = u.id
      ORDER BY fp.created_at DESC
    `;

    const params = userId ? [userId] : [];

    db.query(sql, params, (err, result) => {
        if (err) return res.status(500).json({ success: false, message: err.message });
        res.status(200).json(result);
    });
};

/* ──────────────────────────────────
   LIKE POST (toggle) — real-time emit
────────────────────────────────── */
exports.likePost = (req, res) => {
    const userId = req.user.id;
    const { postId } = req.body;

    // Check if already liked
    const checkSql = "SELECT id FROM likes WHERE user_id=? AND post_id=?";
    db.query(checkSql, [userId, postId], (err, rows) => {
        if (err) return res.status(500).json({ success: false, message: err.message });

        if (rows.length > 0) {
            // Unlike
            db.query("DELETE FROM likes WHERE user_id=? AND post_id=?", [userId, postId], (err2) => {
                if (err2) return res.status(500).json({ success: false, message: err2.message });
                // Get new like count
                db.query("SELECT COUNT(*) AS cnt FROM likes WHERE post_id=?", [postId], (err3, cntRows) => {
                    const likeCount = cntRows?.[0]?.cnt || 0;
                    // Emit real-time to all community users
                    const io = req.app.get("io");
                    if (io) io.to("community").emit("like_update", { postId: Number(postId), likeCount });
                    res.json({ success: true, action: "unliked", likeCount });
                });
            });
        } else {
            // Like
            db.query("INSERT INTO likes(user_id, post_id) VALUES(?,?)", [userId, postId], (err2) => {
                if (err2) return res.status(500).json({ success: false, message: err2.message });
                db.query("SELECT COUNT(*) AS cnt FROM likes WHERE post_id=?", [postId], (err3, cntRows) => {
                    const likeCount = cntRows?.[0]?.cnt || 0;
                    const io = req.app.get("io");
                    if (io) io.to("community").emit("like_update", { postId: Number(postId), likeCount });
                    res.status(201).json({ success: true, action: "liked", likeCount });
                });
            });
        }
    });
};

/* ──────────────────────────────────
   ADD COMMENT — real-time emit
────────────────────────────────── */
exports.addComment = (req, res) => {
    const userId = req.user.id;
    const { postId, comment } = req.body;

    const sql = "INSERT INTO comments(user_id, post_id, comment) VALUES(?,?,?)";
    db.query(sql, [userId, postId, comment], (err, result) => {
        if (err) return res.status(500).json({ success: false, message: err.message });

        // Fetch the author name to emit with comment
        db.query("SELECT name FROM users WHERE id=?", [userId], (err2, uRows) => {
            const newComment = {
                id:          result.insertId,
                post_id:     Number(postId),
                user_id:     userId,
                comment,
                author_name: uRows?.[0]?.name || "Farmer",
                created_at:  new Date().toISOString(),
            };
            // Emit real-time
            const io = req.app.get("io");
            if (io) io.to("community").emit("new_comment", newComment);

            res.status(201).json({ success: true, message: "Comment Added", comment: newComment });
        });
    });
};

/* ──────────────────────────────────
   GET COMMENTS FOR A POST
────────────────────────────────── */
exports.getComments = (req, res) => {
    const { postId } = req.params;

    const sql = `
      SELECT c.*, u.name AS author_name
      FROM comments c
      JOIN users u ON c.user_id = u.id
      WHERE c.post_id = ?
      ORDER BY c.created_at ASC
    `;
    db.query(sql, [postId], (err, result) => {
        if (err) return res.status(500).json({ success: false, message: err.message });
        res.json(result);
    });
};

/* ──────────────────────────────────
   ADD PROFIT HISTORY
────────────────────────────────── */
exports.addProfitHistory = (req, res) => {
    const userId = req.user.id;
    const { crop_name, investment, profit, description } = req.body;
    const image = req.file ? req.file.filename : null;

    const sql = `
      INSERT INTO profit_history (user_id, crop_name, investment, profit, description, image)
      VALUES (?, ?, ?, ?, ?, ?)
    `;
    db.query(sql, [userId, crop_name, investment, profit, description, image], (err) => {
        if (err) return res.status(500).json({ success: false, message: err.message });
        res.status(201).json({ success: true, message: "Profit History Added" });
    });
};

/* ──────────────────────────────────
   GET MY PROFIT HISTORY
────────────────────────────────── */
exports.getMyProfitHistory = (req, res) => {
    const userId = req.user.id;
    const sql = `SELECT * FROM profit_history WHERE user_id=? ORDER BY created_at DESC`;
    db.query(sql, [userId], (err, result) => {
        if (err) return res.status(500).json({ success: false, message: err.message });
        res.json(result);
    });
};

/* ──────────────────────────────────
   DELETE MY POST
────────────────────────────────── */
exports.deletePost = (req, res) => {
    const userId = req.user.id;
    const { postId } = req.params;

    const sql = "DELETE FROM farmer_posts WHERE id=? AND user_id=?";
    db.query(sql, [postId, userId], (err, result) => {
        if (err) return res.status(500).json({ success: false, message: err.message });
        if (result.affectedRows === 0) {
            return res.status(403).json({ success: false, message: "Not allowed" });
        }
        res.json({ success: true, message: "Post deleted" });
    });
};

/* ──────────────────────────────────
   GET MY POSTS (logged-in user's own posts)
────────────────────────────────── */
exports.getMyPosts = (req, res) => {
    const userId = req.user.id;
    const sql = `
      SELECT fp.*, u.name AS author,
             (SELECT COUNT(*) FROM likes WHERE post_id = fp.id) AS like_count,
             (SELECT COUNT(*) FROM comments WHERE post_id = fp.id) AS comment_count
      FROM farmer_posts fp
      JOIN users u ON fp.user_id = u.id
      WHERE fp.user_id = ?
      ORDER BY fp.created_at DESC
    `;
    db.query(sql, [userId], (err, rows) => {
        if (err) return res.status(500).json({ success: false, message: err.message });
        res.json(rows);
    });
};
