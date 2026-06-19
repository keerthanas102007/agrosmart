const db = require("../config/db");
const axios = require("axios");

/* ──────────────────────────────────
   GET MOTOR STATUS
────────────────────────────────── */
exports.getMotorStatus = (req, res) => {
    const userId = req.user.id;
    const sql = "SELECT * FROM motor_status WHERE user_id=? LIMIT 1";
    db.query(sql, [userId], (err, rows) => {
        if (err) return res.status(500).json({ success: false, message: err.message });
        if (rows.length === 0) {
            return res.json({ status: "off", auto_mode: false, land_location: null });
        }
        res.json(rows[0]);
    });
};

/* ──────────────────────────────────
   TOGGLE MOTOR (manual)
────────────────────────────────── */
exports.toggleMotor = (req, res) => {
    const userId = req.user.id;
    const { status } = req.body; // "on" or "off"

    const checkSql = "SELECT id FROM motor_status WHERE user_id=?";
    db.query(checkSql, [userId], (err, rows) => {
        if (err) return res.status(500).json({ success: false, message: err.message });

        const action = status === "on" ? "on" : "off";
        const logSql = "INSERT INTO irrigation_logs(user_id, action, triggered_by) VALUES(?,?,?)";

        if (rows.length === 0) {
            const insertSql = "INSERT INTO motor_status(user_id, status) VALUES(?,?)";
            db.query(insertSql, [userId, action], (err2) => {
                if (err2) return res.status(500).json({ success: false, message: err2.message });
                db.query(logSql, [userId, action, "manual"]);
                res.json({ success: true, status: action });
            });
        } else {
            const updateSql = "UPDATE motor_status SET status=?, updated_at=NOW() WHERE user_id=?";
            db.query(updateSql, [action, userId], (err2) => {
                if (err2) return res.status(500).json({ success: false, message: err2.message });
                db.query(logSql, [userId, action, "manual"]);
                res.json({ success: true, status: action });
            });
        }
    });
};

/* ──────────────────────────────────
   SET LAND LOCATION + AUTO MODE
────────────────────────────────── */
exports.setLandLocation = (req, res) => {
    const userId = req.user.id;
    const { land_location, lat, lon, auto_mode } = req.body;

    const checkSql = "SELECT id FROM motor_status WHERE user_id=?";
    db.query(checkSql, [userId], (err, rows) => {
        if (err) return res.status(500).json({ success: false, message: err.message });

        if (rows.length === 0) {
            const sql = `INSERT INTO motor_status(user_id, land_location, lat, lon, auto_mode) VALUES(?,?,?,?,?)`;
            db.query(sql, [userId, land_location, lat || null, lon || null, auto_mode ? 1 : 0], (err2) => {
                if (err2) return res.status(500).json({ success: false, message: err2.message });
                res.json({ success: true, message: "Land location saved" });
            });
        } else {
            const sql = `UPDATE motor_status SET land_location=?, lat=?, lon=?, auto_mode=?, updated_at=NOW() WHERE user_id=?`;
            db.query(sql, [land_location, lat || null, lon || null, auto_mode ? 1 : 0, userId], (err2) => {
                if (err2) return res.status(500).json({ success: false, message: err2.message });
                res.json({ success: true, message: "Land location updated" });
            });
        }
    });
};

/* ──────────────────────────────────
   GET WEATHER FOR LAND LOCATION
   Uses Open-Meteo (free, no API key needed)
────────────────────────────────── */
exports.getWeatherForLand = async (req, res) => {
    const userId = req.user.id;

    const sql = "SELECT lat, lon, land_location FROM motor_status WHERE user_id=?";
    db.query(sql, [userId], async (err, rows) => {
        if (err) return res.status(500).json({ success: false, message: err.message });
        if (rows.length === 0 || !rows[0].lat) {
            return res.status(404).json({ success: false, message: "Land location not set" });
        }

        const { lat, lon, land_location } = rows[0];

        try {
            // Open-Meteo free weather API — no key required
            const url = `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&current=temperature_2m,precipitation,weathercode,wind_speed_10m,relative_humidity_2m&daily=precipitation_sum&forecast_days=3&timezone=Asia%2FKolkata`;

            const response = await axios.get(url);
            const current = response.data.current;
            const daily = response.data.daily;

            // Rain expected if precipitation > 5mm in next 3 days
            const totalRain = (daily.precipitation_sum || []).reduce((a, b) => a + b, 0);
            const rainExpected = totalRain > 5;

            // Auto motor suggestion
            const motorSuggestion = rainExpected ? "off" : "on";

            res.json({
                success: true,
                location: land_location,
                lat, lon,
                current: {
                    temperature: current.temperature_2m,
                    precipitation: current.precipitation,
                    humidity: current.relative_humidity_2m,
                    windSpeed: current.wind_speed_10m,
                    weatherCode: current.weathercode
                },
                daily: {
                    dates: daily.time,
                    precipitation: daily.precipitation_sum
                },
                rainExpected,
                totalRainMm: Math.round(totalRain * 10) / 10,
                motorSuggestion,
                recommendation: rainExpected
                    ? `மழை எதிர்பார்க்கப்படுகிறது (${totalRain.toFixed(1)}mm). Motor OFF பண்ணுவது சிறந்தது.`
                    : `மழை இல்ல. நீர்ப்பாசனம் தேவை — Motor ON பண்ணலாம்.`
            });
        } catch (error) {
            res.status(500).json({ success: false, message: "Weather API error: " + error.message });
        }
    });
};

/* ──────────────────────────────────
   AUTO MOTOR DECISION (based on weather)
────────────────────────────────── */
exports.autoMotorDecision = async (req, res) => {
    const userId = req.user.id;

    const sql = "SELECT * FROM motor_status WHERE user_id=?";
    db.query(sql, [userId], async (err, rows) => {
        if (err) return res.status(500).json({ success: false, message: err.message });
        if (rows.length === 0 || !rows[0].lat) {
            return res.status(404).json({ success: false, message: "Land location not configured" });
        }

        const { lat, lon, auto_mode } = rows[0];
        if (!auto_mode) {
            return res.json({ success: false, message: "Auto mode is disabled" });
        }

        try {
            const url = `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&daily=precipitation_sum&forecast_days=2&timezone=Asia%2FKolkata`;
            const response = await axios.get(url);
            const dailyRain = response.data.daily.precipitation_sum || [];
            const totalRain = dailyRain.reduce((a, b) => a + b, 0);
            const rainExpected = totalRain > 5;

            const newStatus = rainExpected ? "off" : "on";
            const updateSql = "UPDATE motor_status SET status=?, updated_at=NOW() WHERE user_id=?";
            db.query(updateSql, [newStatus, userId], (err2) => {
                if (err2) return res.status(500).json({ success: false, message: err2.message });

                db.query(
                    "INSERT INTO irrigation_logs(user_id, action, triggered_by) VALUES(?,?,?)",
                    [userId, newStatus, "auto_weather"]
                );

                res.json({
                    success: true,
                    status: newStatus,
                    rainExpected,
                    totalRainMm: Math.round(totalRain * 10) / 10
                });
            });
        } catch (error) {
            res.status(500).json({ success: false, message: "Weather API error: " + error.message });
        }
    });
};

/* ──────────────────────────────────
   GET IRRIGATION LOGS
────────────────────────────────── */
exports.getIrrigationLogs = (req, res) => {
    const userId = req.user.id;
    const sql = "SELECT * FROM irrigation_logs WHERE user_id=? ORDER BY created_at DESC LIMIT 20";
    db.query(sql, [userId], (err, rows) => {
        if (err) return res.status(500).json({ success: false, message: err.message });
        res.json(rows);
    });
};

/* ──────────────────────────────────
   WATER USAGE CALCULATOR
   Weather + Soil type → irrigation hours + litres needed
────────────────────────────────── */
exports.getWaterUsage = async (req, res) => {
    const userId = req.user.id;
    const { soil_type, farm_size_acres } = req.query;

    // Soil water requirement (L/acre/hr)
    const SOIL_WATER = {
        "Sandy Loam":   45,
        "Clay Loam":    28,
        "Silt Loam":    35,
        "Red Loam":     40,
        "Black Cotton": 22,
    };

    const baseRate = SOIL_WATER[soil_type] || 35; // default Silt Loam
    const acres = parseFloat(farm_size_acres) || 1;

    // Get location to fetch weather
    const sql = "SELECT lat, lon, land_location FROM motor_status WHERE user_id=?";
    db.query(sql, [userId], async (err, rows) => {
        if (err) return res.status(500).json({ success: false, message: err.message });

        let rainMm = 0;
        let weatherAvailable = false;
        let temperature = 30;
        let humidity = 65;
        let locationName = null;

        // If location set, get real weather
        if (rows.length > 0 && rows[0].lat) {
            try {
                const { lat, lon } = rows[0];
                locationName = rows[0].land_location;
                const url = `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&current=temperature_2m,relative_humidity_2m&daily=precipitation_sum&forecast_days=1&timezone=Asia%2FKolkata`;
                const resp = await axios.get(url);
                rainMm = resp.data.daily?.precipitation_sum?.[0] || 0;
                temperature = resp.data.current?.temperature_2m || 30;
                humidity = resp.data.current?.relative_humidity_2m || 65;
                weatherAvailable = true;
            } catch (_) {}
        }

        // Evapotranspiration factor (higher temp + low humidity = more water needed)
        const etFactor = 1 + (Math.max(0, temperature - 25) * 0.02) - (humidity > 70 ? 0.1 : 0);

        // Rain reduces irrigation need (1mm rain = ~0.6L/m² = ~2400L/acre)
        const rainLitresPerAcre = rainMm * 2400;

        // Base water need per acre per day
        const baseNeedPerAcre = baseRate * etFactor;
        const totalNeedLitres = Math.max(0, (baseNeedPerAcre * acres) - rainLitresPerAcre);

        // Flow rate assumption: 45 L/min for standard pump
        const pumpFlowLPM = 45;
        const irrigationMinutes = Math.round(totalNeedLitres / pumpFlowLPM);
        const irrigationHours = (irrigationMinutes / 60).toFixed(1);

        // Status
        let status, recommendation;
        if (rainMm > 20) {
            status = "skip";
            recommendation = `மழை அதிகமாக உள்ளது (${rainMm.toFixed(1)}mm). இன்று நீர்ப்பாசனம் தேவையில்லை.`;
        } else if (rainMm > 8) {
            status = "reduce";
            recommendation = `சிறிய மழை உள்ளது (${rainMm.toFixed(1)}mm). ${irrigationHours} மணி நேரம் பாசனம் போதும்.`;
        } else {
            status = "irrigate";
            recommendation = `மழை இல்ல. ${irrigationHours} மணி நேரம் (${Math.round(totalNeedLitres).toLocaleString()} லிட்டர்) பாசனம் தேவை.`;
        }

        res.json({
            success: true,
            soilType: soil_type || "Silt Loam",
            farmSizeAcres: acres,
            weatherAvailable,
            locationName,
            weather: { temperature, humidity, rainMm: +rainMm.toFixed(1) },
            waterNeed: {
                totalLitres: Math.round(totalNeedLitres),
                irrigationHours: +irrigationHours,
                irrigationMinutes,
                pumpFlowLPM,
                baseRateLPerAcreHr: baseRate,
            },
            status,
            recommendation,
        });
    });
};
