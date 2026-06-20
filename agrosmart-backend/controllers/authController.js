const db = require("../config/db");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const nodemailer = require("nodemailer");
const axios = require("axios");

/* ──────────────────────────────────
   SAFE LOGIN LOG — won't crash if table missing
────────────────────────────────── */
function safeLogLogin(userId, email, req) {
    const ip = req?.ip || req?.connection?.remoteAddress || null;
    const ua = req?.headers?.["user-agent"] || null;
    db.query(
        "INSERT INTO login_logs (user_id, email, ip_address, user_agent) VALUES (?,?,?,?)",
        [userId, email, ip, ua],
        (err) => { if (err) { /* table might not exist — non-blocking */ } }
    );
}

/* ──────────────────────────────────
   EMAIL TRANSPORTER — robust, any email domain
────────────────────────────────── */
const getTransporter = () => {
    if (!process.env.EMAIL_USER || !process.env.EMAIL_PASS ||
        process.env.EMAIL_USER === "your_gmail@gmail.com") return null;

    return nodemailer.createTransport({
        host: process.env.EMAIL_HOST || "smtp-relay.brevo.com",
        port: parseInt(process.env.EMAIL_PORT || "587"),
        secure: false,
        auth: {
            user: process.env.EMAIL_SMTP_LOGIN || process.env.EMAIL_USER,
            pass: process.env.EMAIL_PASS,
        },
        tls: { rejectUnauthorized: false },
        connectionTimeout: 10000,
        greetingTimeout:   10000,
        socketTimeout:     15000,
    });
};

/* ──────────────────────────────────
   SAFE EMAIL SENDER
   Never throws — always logs result
   Works for Gmail, Yahoo, college, any domain
────────────────────────────────── */
const safeEmail = async (toEmail, subject, html) => {
    try {
        const transporter = getTransporter();
        if (!transporter) {
            console.log("⚠️  Email skipped — EMAIL_USER/EMAIL_PASS not set in .env");
            return;
        }
        const info = await transporter.sendMail({
            from: `"AgroSmart 🌾" <${process.env.EMAIL_USER}>`,
            to:   toEmail,
            subject,
            html,
        });
        console.log(`✅ Email sent to ${toEmail} — ${info.messageId}`);
    } catch (err) {
        // Never block login/register because of email failure
        console.error(`❌ Email failed to ${toEmail}:`, err.message);
    }
};

/* ──────────────────────────────────
   SEND LOGIN NOTIFICATION — uses safeEmail, works for any domain
────────────────────────────────── */
const sendLoginEmail = async (toEmail, userName) => {
    const now = new Date().toLocaleString("en-IN", {
        timeZone: "Asia/Kolkata", dateStyle: "medium", timeStyle: "short",
    });
    await safeEmail(toEmail, "AgroSmart - Login Notification ✅", `<!DOCTYPE html><html><head><meta charset="UTF-8"></head>
<body style="margin:0;padding:0;background:#f0f4f0;font-family:'Segoe UI',Arial,sans-serif;">
<table width="100%" cellpadding="0" cellspacing="0" style="background:#f0f4f0;padding:30px 0;"><tr><td align="center">
<table width="500" cellpadding="0" cellspacing="0" style="background:#fff;border-radius:16px;overflow:hidden;box-shadow:0 4px 20px rgba(0,0,0,0.08);">
  <tr><td style="background:linear-gradient(135deg,#1b5e20,#2e7d32,#43a047);padding:28px 40px;text-align:center;">
    <div style="font-size:32px;">🌾</div>
    <h1 style="color:#fff;margin:6px 0 0;font-size:22px;font-weight:800;">AgroSmart</h1>
    <p style="color:rgba(255,255,255,0.8);margin:4px 0 0;font-size:12px;">Smart Agriculture Monitoring Platform</p>
  </td></tr>
  <tr><td style="padding:32px 40px;">
    <div style="text-align:center;font-size:44px;margin-bottom:12px;">✅</div>
    <h2 style="color:#1a2332;text-align:center;margin:0 0 8px;font-size:20px;">Login Successful!</h2>
    <p style="color:#546e7a;text-align:center;font-size:14px;margin:0 0 22px;">Welcome back, <strong style="color:#2e7d32;">${userName}</strong>! Your farm dashboard is ready.</p>
    <div style="background:#f8fdf8;border:1px solid #c8e6c9;border-radius:10px;padding:16px 20px;margin-bottom:22px;">
      <p style="margin:4px 0;color:#546e7a;font-size:13px;">👤 Account: <strong style="color:#1a2332;">${toEmail}</strong></p>
      <p style="margin:4px 0;color:#546e7a;font-size:13px;">🕐 Login Time: <strong style="color:#1a2332;">${now} IST</strong></p>
      <p style="margin:4px 0;color:#546e7a;font-size:13px;">🌐 Platform: <strong style="color:#1a2332;">AgroSmart Web App</strong></p>
    </div>
    <div style="text-align:center;margin:20px 0;">
      <a href="http://localhost:3000/dashboard" style="background:linear-gradient(135deg,#2e7d32,#43a047);color:#fff;padding:12px 28px;border-radius:10px;text-decoration:none;font-weight:700;font-size:14px;">🚀 Go to Dashboard</a>
    </div>
    <p style="color:#90a4ae;font-size:11px;text-align:center;margin:0;">If this wasn't you, please contact support immediately.</p>
  </td></tr>
  <tr><td style="background:#f8fdf8;border-top:1px solid #e8f5e9;padding:14px 40px;text-align:center;">
    <p style="color:#90a4ae;font-size:11px;margin:0;">© 2026 AgroSmart — Smart Agriculture Monitoring System</p>
  </td></tr>
</table></td></tr></table></body></html>`);
};

/* ──────────────────────────────────
   SEND REGISTER WELCOME EMAIL — uses safeEmail, works for any domain
────────────────────────────────── */
const sendRegisterEmail = async (toEmail, userName) => {
    const now = new Date().toLocaleString("en-IN", {
        timeZone: "Asia/Kolkata", dateStyle: "medium", timeStyle: "short",
    });
    await safeEmail(toEmail, "AgroSmart - Welcome! Registration Successful 🎉", `<!DOCTYPE html><html><head><meta charset="UTF-8"></head>
<body style="margin:0;padding:0;background:#f0f4f0;font-family:'Segoe UI',Arial,sans-serif;">
<table width="100%" cellpadding="0" cellspacing="0" style="background:#f0f4f0;padding:30px 0;"><tr><td align="center">
<table width="500" cellpadding="0" cellspacing="0" style="background:#fff;border-radius:16px;overflow:hidden;box-shadow:0 4px 20px rgba(0,0,0,0.08);">
  <tr><td style="background:linear-gradient(135deg,#1b5e20,#2e7d32,#43a047);padding:28px 40px;text-align:center;">
    <div style="font-size:32px;">🌾</div>
    <h1 style="color:#fff;margin:6px 0 0;font-size:22px;font-weight:800;">AgroSmart</h1>
    <p style="color:rgba(255,255,255,0.8);margin:4px 0 0;font-size:12px;">Smart Agriculture Monitoring Platform</p>
  </td></tr>
  <tr><td style="padding:32px 40px;">
    <div style="text-align:center;font-size:44px;margin-bottom:12px;">🎉</div>
    <h2 style="color:#1a2332;text-align:center;margin:0 0 8px;font-size:20px;">Registration Successful!</h2>
    <p style="color:#546e7a;text-align:center;font-size:14px;margin:0 0 20px;">வணக்கம் <strong style="color:#2e7d32;">${userName}</strong>! AgroSmart-ல உங்களை வரவேற்கிறோம் 🙏</p>
    <div style="background:#f8fdf8;border:1px solid #c8e6c9;border-radius:10px;padding:16px 20px;margin-bottom:18px;">
      <p style="margin:4px 0;color:#546e7a;font-size:13px;">👤 Name: <strong style="color:#1a2332;">${userName}</strong></p>
      <p style="margin:4px 0;color:#546e7a;font-size:13px;">📧 Email: <strong style="color:#1a2332;">${toEmail}</strong></p>
      <p style="margin:4px 0;color:#546e7a;font-size:13px;">🕐 Registered: <strong style="color:#1a2332;">${now} IST</strong></p>
    </div>
    <p style="color:#2e7d32;font-size:13px;font-weight:700;margin:0 0 8px;">உங்களுக்கு கிடைக்கும் features:</p>
    <p style="color:#546e7a;font-size:13px;margin:3px 0;">✅ Real-time Soil Monitoring</p>
    <p style="color:#546e7a;font-size:13px;margin:3px 0;">✅ Smart Irrigation Control</p>
    <p style="color:#546e7a;font-size:13px;margin:3px 0;">✅ Weather-based Alerts</p>
    <p style="color:#546e7a;font-size:13px;margin:3px 0;">✅ Disease Detection</p>
    <p style="color:#546e7a;font-size:13px;margin:3px 0;">✅ Farmer Community</p>
    <div style="text-align:center;margin:22px 0;">
      <a href="http://localhost:3000" style="background:linear-gradient(135deg,#2e7d32,#43a047);color:#fff;padding:12px 28px;border-radius:10px;text-decoration:none;font-weight:700;font-size:14px;">🚀 Login to Dashboard</a>
    </div>
  </td></tr>
  <tr><td style="background:#f8fdf8;border-top:1px solid #e8f5e9;padding:14px 40px;text-align:center;">
    <p style="color:#90a4ae;font-size:11px;margin:0;">© 2026 AgroSmart — Smart Agriculture Monitoring System</p>
  </td></tr>
</table></td></tr></table></body></html>`);
};

/* ──────────────────────────────────
   SEND REGISTER WELCOME SMS
────────────────────────────────── */
const sendRegisterSMS = async (phone, userName) => {
    try {
        if (!phone || !process.env.FAST2SMS_KEY ||
            process.env.FAST2SMS_KEY === "your_fast2sms_api_key_here") {
            console.log("⚠️  Register SMS skipped — set FAST2SMS_KEY in .env");
            return;
        }
        const cleanPhone = phone.replace(/\D/g, "").replace(/^91/, "").slice(-10);
        if (cleanPhone.length !== 10) return;

        const message = `வணக்கம் ${userName}! AgroSmart-ல வரவேற்கிறோம் 🌾 உங்கள் account வெற்றிகரமாக உருவாக்கப்பட்டது. Dashboard-ல உங்கள் பண்ணை monitor பண்ணுங்கள். - AgroSmart`;

        const response = await axios.post(
            "https://www.fast2sms.com/dev/bulkV2",
            { route: "q", message, flash: 0, numbers: cleanPhone },
            {
                headers: { authorization: process.env.FAST2SMS_KEY, "Content-Type": "application/json" },
                timeout: 8000,
            }
        );
        if (response.data?.return === true) {
            console.log(`✅ Welcome SMS sent to ${cleanPhone}`);
        } else {
            console.log("⚠️  Fast2SMS register response:", response.data);
        }
    } catch (smsErr) {
        console.error("Register SMS failed:", smsErr.response?.data || smsErr.message);
    }
};

/* ──────────────────────────────────
   SEND LOGIN SMS (Fast2SMS — India)
   Fast2SMS free account: https://www.fast2sms.com
   .env-ல: FAST2SMS_KEY=your_api_key_here
────────────────────────────────── */
const sendLoginSMS = async (phone, userName) => {
    try {
        if (!phone || !process.env.FAST2SMS_KEY ||
            process.env.FAST2SMS_KEY === "your_fast2sms_api_key_here") {
            console.log("⚠️  SMS skipped — set FAST2SMS_KEY in .env (free at fast2sms.com)");
            return;
        }

        // Clean phone: keep only 10 digits (remove +91 / 91 prefix)
        const cleanPhone = phone.replace(/\D/g, "").replace(/^91/, "").slice(-10);
        if (cleanPhone.length !== 10) {
            console.log("⚠️  SMS skipped — invalid phone number:", phone);
            return;
        }

        const message = `வணக்கம் ${userName}! AgroSmart-ல வெற்றிகரமாக login ஆனீர்கள். உங்கள் பண்ணை dashboard ready. - AgroSmart`;

        const response = await axios.post(
            "https://www.fast2sms.com/dev/bulkV2",
            {
                route:     "q",
                message:   message,
                flash:     0,
                numbers:   cleanPhone,
            },
            {
                headers: {
                    authorization: process.env.FAST2SMS_KEY,
                    "Content-Type": "application/json",
                },
                timeout: 8000,
            }
        );

        if (response.data?.return === true) {
            console.log(`✅ SMS sent to ${cleanPhone} — ${userName}`);
        } else {
            console.log("⚠️  Fast2SMS response:", response.data);
        }
    } catch (smsErr) {
        // Never fail login because of SMS error
        console.error("SMS send failed (non-blocking):", smsErr.response?.data || smsErr.message);
    }
};

/* ──────────────────────────────────
   REGISTER
────────────────────────────────── */
exports.registerUser = async (req, res) => {
    try {
        const { name, email, password, location, phone, farmSize, primaryCrop, state } = req.body;

        if (!name || !email || !password) {
            return res.status(400).json({ success: false, message: "Name, email and password required" });
        }

        // Validate email format
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(email.trim())) {
            return res.status(400).json({
                success: false,
                message: "Please enter a valid email address (e.g. name@gmail.com or college@ac.in)"
            });
        }

        // Check duplicate email
        db.query("SELECT id FROM users WHERE email=?", [email], async (err, rows) => {
            if (err) return res.status(500).json({ success: false, message: err.message });

            if (rows.length > 0) {
                // Email already exists — update the record (re-register = update password & info)
                const hashedPassword = await bcrypt.hash(password, 10);
                const updateSql = `
                  UPDATE users SET name=?, password=?, location=?, phone=?, farm_size=?, primary_crop=?, state=?
                  WHERE email=?
                `;
                db.query(updateSql, [
                    name, hashedPassword, location || null, phone || null,
                    farmSize || null, primaryCrop || null, state || null, email
                ], (err3, upResult) => {
                    if (err3) return res.status(500).json({ success: false, message: err3.message });

                    // Fetch updated user
                    db.query("SELECT * FROM users WHERE email=?", [email], (err4, updatedRows) => {
                        if (err4 || !updatedRows.length) {
                            return res.status(500).json({ success: false, message: "Fetch failed after update" });
                        }
                        const updatedUser = updatedRows[0];
                        const token = jwt.sign({ id: updatedUser.id }, process.env.JWT_SECRET, { expiresIn: "7d" });
                        const { password: _pw, ...safeUser } = updatedUser;
                        return res.status(200).json({
                            success: true,
                            message: "Account updated and logged in",
                            token,
                            user: safeUser
                        });
                    });
                });
                return; // wait for callback
            }

            const hashedPassword = await bcrypt.hash(password, 10);

            const sql = `
              INSERT INTO users (name, email, password, location, phone, farm_size, primary_crop, state)
              VALUES (?, ?, ?, ?, ?, ?, ?, ?)
            `;
            db.query(sql, [name, email, hashedPassword, location || null, phone || null,
                farmSize || null, primaryCrop || null, state || null], (err2, result) => {
                if (err2) return res.status(500).json({ success: false, message: err2.message });

                const token = jwt.sign({ id: result.insertId }, process.env.JWT_SECRET, { expiresIn: "7d" });

                // Send welcome email + SMS on registration
                sendRegisterEmail(email, name);
                sendRegisterSMS(phone || null, name);

                res.status(201).json({
                    success: true,
                    message: "User Registered Successfully",
                    token,
                    user: { id: result.insertId, name, email, location, phone, farmSize, primaryCrop, state }
                });
            });
        });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

/* ──────────────────────────────────
   LOGIN
   • Any email + any password → login ஆகும்
   • New user → auto-create
   • Phone number போட்டா → SMS notification
   • Email போட்டா → email notification
   • Both send பண்ணும்
────────────────────────────────── */
exports.loginUser = (req, res) => {
    const { email, password, phone: loginPhone } = req.body;

    if (!email || !password) {
        return res.status(400).json({ success: false, message: "Email and password required" });
    }

    // Basic email format validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email.trim())) {
        return res.status(400).json({
            success: false,
            message: "Please enter a valid email address (e.g. name@gmail.com)"
        });
    }

    const sql = "SELECT * FROM users WHERE email=?";
    db.query(sql, [email], async (err, result) => {        if (err) return res.status(500).json({ success: false, message: err.message });

        // ── NEW USER: auto-create and login ──
        if (result.length === 0) {
            const hashedPassword = await bcrypt.hash(password, 10);
            const name = email.split("@")[0].replace(/[^a-zA-Z]/g, " ").trim() || "Farmer";
            const insertSql = `
              INSERT INTO users (name, email, password, location, phone, farm_size, primary_crop, state)
              VALUES (?, ?, ?, NULL, ?, NULL, NULL, NULL)
            `;
            db.query(insertSql, [name, email, hashedPassword, loginPhone || null], (err2, insertResult) => {
                if (err2) return res.status(500).json({ success: false, message: err2.message });

                const newUser = {
                    id: insertResult.insertId, name, email,
                    location: null, phone: loginPhone || null,
                    farm_size: null, primary_crop: null, state: null, profile_pic: null,
                };
                const token = jwt.sign({ id: newUser.id }, process.env.JWT_SECRET, { expiresIn: "7d" });
                safeLogLogin(newUser.id, email, req);
                sendLoginEmail(email, newUser.name);
                sendLoginSMS(loginPhone || null, newUser.name);
                return res.status(200).json({ success: true, token, user: newUser });
            });
            return;
        }

        // ── EXISTING USER — any password accepted ──
        const user = result[0];
        const isMatch = await bcrypt.compare(password, user.password);

        // Use phone from login form if provided, else use saved phone in DB
        const smsPhone = loginPhone || user.phone;

        // If login phone provided, update DB phone too
        if (loginPhone && loginPhone !== user.phone) {
            db.query("UPDATE users SET phone=? WHERE id=?", [loginPhone, user.id]);
        }

        const doLogin = () => {
            const token = jwt.sign({ id: user.id }, process.env.JWT_SECRET, { expiresIn: "7d" });
            console.log(`📧 Sending login email to: ${email}`);
            safeLogLogin(user.id, email, req);   // log login (safe — won't crash)
            sendLoginEmail(email, user.name);     // email notification
            sendLoginSMS(smsPhone, user.name);    // SMS notification
            const { password: _pw, ...safeUser } = user;
            res.status(200).json({ success: true, token, user: { ...safeUser, phone: smsPhone } });
        };

        if (isMatch) {
            doLogin();
        } else {
            bcrypt.hash(password, 10).then(newHash => {
                db.query("UPDATE users SET password=? WHERE id=?", [newHash, user.id], (err3) => {
                    if (err3) return res.status(500).json({ success: false, message: err3.message });
                    doLogin();
                });
            });
        }
    });
};

/* ──────────────────────────────────
   GET PROFILE
────────────────────────────────── */
exports.getProfile = (req, res) => {
    const userId = req.user.id;

    const sql = `
      SELECT id, name, email, location, phone, farm_size, primary_crop, state,
             profile_pic, preferred_lang, created_at
      FROM users WHERE id=?
    `;
    db.query(sql, [userId], (err, result) => {
        if (err) return res.status(500).json({ success: false, message: err.message });
        if (result.length === 0) return res.status(404).json({ success: false, message: "User not found" });
        res.json(result[0]);
    });
};

/* ──────────────────────────────────
   DELETE ACCOUNT
   Deletes logged-in farmer's own account + all their data
   (CASCADE handles: posts, likes, comments, profit_history,
    motor_status, irrigation_logs, soil_analysis,
    disease_detections, farm_photo_analysis, farm_history)
────────────────────────────────── */
exports.deleteAccount = (req, res) => {
    const userId = req.user.id;
    db.query("DELETE FROM users WHERE id = ?", [userId], (err, result) => {
        if (err) return res.status(500).json({ success: false, message: err.message });
        if (result.affectedRows === 0) {
            return res.status(404).json({ success: false, message: "User not found" });
        }
        res.json({ success: true, message: "Account deleted successfully" });
    });
};

/* ──────────────────────────────────
   SET PREFERRED LANGUAGE
   POST /api/auth/set-lang
   Body: { lang: "ta" | "hi" | "en" }
────────────────────────────────── */
exports.setLang = (req, res) => {
    const userId = req.user.id;
    const { lang } = req.body;
    if (!["en", "ta", "hi"].includes(lang)) {
        return res.status(400).json({ success: false, message: "Invalid lang" });
    }
    db.query("UPDATE users SET preferred_lang=? WHERE id=?", [lang, userId], (err) => {
        if (err) return res.status(500).json({ success: false, message: err.message });
        res.json({ success: true, lang });
    });
};
exports.updateProfile = (req, res) => {
    const userId = req.user.id;
    const { name, location, phone, farmSize, primaryCrop, state } = req.body;
    const profilePic = req.file ? req.file.filename : null;

    let sql, params;
    if (profilePic) {
        sql = `UPDATE users SET name=?, location=?, phone=?, farm_size=?, primary_crop=?, state=?, profile_pic=? WHERE id=?`;
        params = [name, location, phone, farmSize, primaryCrop, state, profilePic, userId];
    } else {
        sql = `UPDATE users SET name=?, location=?, phone=?, farm_size=?, primary_crop=?, state=? WHERE id=?`;
        params = [name, location, phone, farmSize, primaryCrop, state, userId];
    }

    db.query(sql, params, (err) => {
        if (err) return res.status(500).json({ success: false, message: err.message });
        res.json({ success: true, message: "Profile Updated" });
    });
};
