const db = require("../config/db");

/* ═══════════════════════════════════════════════════════
   SOFTWARE SIMULATION ENGINE
   Generates realistic, slowly-drifting sensor values
   when no real IoT sensor is connected.
   Values drift naturally within safe ranges each call.
═══════════════════════════════════════════════════════ */

// Per-user simulation state (in-memory, resets on server restart)
const simState = {};

function getSimState(userId) {
  if (!simState[userId]) {
    simState[userId] = {
      temperature:   28 + Math.random() * 6,      // 28–34 °C
      humidity:      60 + Math.random() * 20,      // 60–80 %
      soil_moisture: 55 + Math.random() * 25,      // 55–80 %
      ph_level:      6.2 + Math.random() * 0.8,    // 6.2–7.0
      nitrogen:      35 + Math.random() * 20,      // 35–55
      phosphorus:    20 + Math.random() * 15,      // 20–35
      potassium:     30 + Math.random() * 20,      // 30–50
    };
  }
  return simState[userId];
}

/** Drift a value by ±delta but clamp to [min, max] */
function drift(val, delta, min, max) {
  const change = (Math.random() - 0.5) * 2 * delta;
  return Math.min(max, Math.max(min, +(val + change).toFixed(2)));
}

function simulateNext(userId) {
  const s = getSimState(userId);
  s.temperature   = drift(s.temperature,   0.4, 22, 40);
  s.humidity      = drift(s.humidity,      1.0, 40, 95);
  s.soil_moisture = drift(s.soil_moisture, 1.5, 30, 95);
  s.ph_level      = drift(s.ph_level,      0.05, 5.5, 8.0);
  s.nitrogen      = drift(s.nitrogen,      0.8, 15, 80);
  s.phosphorus    = drift(s.phosphorus,    0.5, 10, 60);
  s.potassium     = drift(s.potassium,     0.6, 15, 70);
  return { ...s };
}

/** Derive a sensor status from its values */
function deriveStatus(val) {
  if (val.soil_moisture < 35 || val.ph_level < 5.8 || val.ph_level > 7.5) return "warning";
  return "active";
}

/* ──────────────────────────────────
   GET SENSOR DATA (latest per sensor)
────────────────────────────────── */
exports.getSensorData = (req, res) => {
    const userId = req.user.id;

    const sql = `
      SELECT sd.*, s.sensor_name, s.sensor_type, s.field_name
      FROM sensor_data sd
      JOIN sensors s ON sd.sensor_id = s.id
      WHERE s.user_id = ?
      ORDER BY sd.recorded_at DESC
      LIMIT 50
    `;
    db.query(sql, [userId], (err, rows) => {
        if (err) return res.status(500).json({ success: false, message: err.message });
        res.json(rows);
    });
};

/* ──────────────────────────────────
   GET LATEST SENSOR READING PER SENSOR
   • Real sensors  → DB data
   • No sensors    → software simulation (auto-insert into DB)
────────────────────────────────── */
exports.getLatestSensors = (req, res) => {
    const userId = req.user.id;

    // First check if user has any sensors registered
    const checkSql = "SELECT COUNT(*) AS cnt FROM sensors WHERE user_id = ?";
    db.query(checkSql, [userId], (err, countRows) => {
        if (err) return res.status(500).json({ success: false, message: err.message });

        const hasSensors = countRows[0].cnt > 0;

        if (!hasSensors) {
            // ── NO SENSOR: auto-create a virtual sensor and save data to DB ──
            const sim = simulateNext(userId);
            const status = deriveStatus(sim);

            // Create virtual sensor for this user (once)
            const createSensorSql = `
              INSERT INTO sensors (user_id, sensor_name, sensor_type, field_name, status, last_seen)
              VALUES (?, 'Virtual Farm Sensor', 'multi', 'Main Field', 'active', NOW())
              ON DUPLICATE KEY UPDATE last_seen=NOW()
            `;
            // Use INSERT IGNORE style — check if virtual sensor exists first
            const checkVirtualSql = "SELECT id FROM sensors WHERE user_id=? AND sensor_name='Virtual Farm Sensor' LIMIT 1";
            db.query(checkVirtualSql, [userId], (err2, sRows) => {
                if (err2 || sRows.length === 0) {
                    // Create virtual sensor
                    db.query(
                        "INSERT INTO sensors (user_id, sensor_name, sensor_type, field_name, status, last_seen) VALUES (?,?,?,?,?,NOW())",
                        [userId, "Virtual Farm Sensor", "multi", "Main Field", "active"],
                        (err3, sResult) => {
                            const sensorId = sResult?.insertId;
                            if (sensorId) {
                                db.query(
                                    "INSERT INTO sensor_data (sensor_id, temperature, humidity, soil_moisture, ph_level, nitrogen, phosphorus, potassium) VALUES (?,?,?,?,?,?,?,?)",
                                    [sensorId, sim.temperature, sim.humidity, sim.soil_moisture, sim.ph_level, sim.nitrogen, sim.phosphorus, sim.potassium]
                                );
                            }
                        }
                    );
                } else {
                    // Sensor exists — just save data
                    const sensorId = sRows[0].id;
                    db.query(
                        "INSERT INTO sensor_data (sensor_id, temperature, humidity, soil_moisture, ph_level, nitrogen, phosphorus, potassium) VALUES (?,?,?,?,?,?,?,?)",
                        [sensorId, sim.temperature, sim.humidity, sim.soil_moisture, sim.ph_level, sim.nitrogen, sim.phosphorus, sim.potassium]
                    );
                    db.query("UPDATE sensors SET status='active', last_seen=NOW() WHERE id=?", [sensorId]);
                }
            });

            return res.json([{
                sensor_id:    null,
                sensor_name:  "Virtual Farm Sensor",
                sensor_type:  "multi",
                field_name:   "Main Field",
                status,
                temperature:   sim.temperature,
                humidity:      sim.humidity,
                soil_moisture: sim.soil_moisture,
                ph_level:      sim.ph_level,
                nitrogen:      sim.nitrogen,
                phosphorus:    sim.phosphorus,
                potassium:     sim.potassium,
                recorded_at:   new Date(),
                simulated:     true,
            }]);
        }

        // ── HAS SENSORS: return real DB data (plus simulate for inactive ones) ──
        const sql = `
          SELECT s.id AS sensor_id, s.sensor_name, s.sensor_type, s.field_name, s.status,
                 sd.temperature, sd.humidity, sd.soil_moisture, sd.ph_level, sd.nitrogen,
                 sd.phosphorus, sd.potassium, sd.recorded_at
          FROM sensors s
          LEFT JOIN sensor_data sd ON sd.sensor_id = s.id
            AND sd.recorded_at = (
              SELECT MAX(recorded_at) FROM sensor_data WHERE sensor_id = s.id
            )
          WHERE s.user_id = ?
        `;
        db.query(sql, [userId], (err2, rows) => {
            if (err2) return res.status(500).json({ success: false, message: err2.message });

            // For sensors with no real data yet → simulate and auto-insert
            const tasks = rows.map(row => new Promise((resolve) => {
                if (row.temperature !== null) {
                    resolve(row); // real data exists
                    return;
                }
                // Simulate for this sensor
                const sim = simulateNext(userId);
                const insertSql = `
                  INSERT INTO sensor_data
                    (sensor_id, temperature, humidity, soil_moisture, ph_level, nitrogen, phosphorus, potassium)
                  VALUES (?, ?, ?, ?, ?, ?, ?, ?)
                `;
                db.query(insertSql,
                  [row.sensor_id, sim.temperature, sim.humidity, sim.soil_moisture,
                   sim.ph_level, sim.nitrogen, sim.phosphorus, sim.potassium],
                  () => {
                    // Mark sensor active
                    db.query("UPDATE sensors SET status='active', last_seen=NOW() WHERE id=?", [row.sensor_id]);
                    resolve({
                        ...row,
                        temperature:   sim.temperature,
                        humidity:      sim.humidity,
                        soil_moisture: sim.soil_moisture,
                        ph_level:      sim.ph_level,
                        nitrogen:      sim.nitrogen,
                        phosphorus:    sim.phosphorus,
                        potassium:     sim.potassium,
                        recorded_at:   new Date(),
                        status:        deriveStatus(sim),
                        simulated:     true,
                    });
                  }
                );
            }));

            Promise.all(tasks).then(results => res.json(results));
        });
    });
};

/* ──────────────────────────────────
   POST SENSOR DATA (IoT device posts here)
   This endpoint is open (no auth) — IoT sends device_key
────────────────────────────────── */
exports.postSensorData = (req, res) => {
    const { device_key, temperature, humidity, soil_moisture, ph_level, nitrogen, phosphorus, potassium } = req.body;

    if (!device_key) {
        return res.status(400).json({ success: false, message: "device_key required" });
    }

    // Find sensor by device_key
    const sql = "SELECT s.id, s.user_id, s.sensor_name, s.sensor_type, s.field_name FROM sensors s WHERE device_key=?";
    db.query(sql, [device_key], (err, rows) => {
        if (err) return res.status(500).json({ success: false, message: err.message });
        if (rows.length === 0) {
            return res.status(404).json({ success: false, message: "Sensor not found" });
        }

        const sensor = rows[0];
        const insertSql = `
          INSERT INTO sensor_data (sensor_id, temperature, humidity, soil_moisture, ph_level, nitrogen, phosphorus, potassium)
          VALUES (?, ?, ?, ?, ?, ?, ?, ?)
        `;
        db.query(insertSql, [sensor.id, temperature, humidity, soil_moisture, ph_level, nitrogen, phosphorus, potassium], (err2) => {
            if (err2) return res.status(500).json({ success: false, message: err2.message });

            // Update sensor status to active
            db.query("UPDATE sensors SET status='active', last_seen=NOW() WHERE id=?", [sensor.id]);

            // Emit real-time update via WebSocket (real IoT data)
            const io = req.app?.get("io");
            if (io) {
                io.to(`sensors_${sensor.user_id}`).emit("sensor_update", [{
                    sensor_id:    sensor.id,
                    sensor_name:  sensor.sensor_name,
                    sensor_type:  sensor.sensor_type,
                    field_name:   sensor.field_name,
                    status:       "active",
                    temperature:  temperature ?? null,
                    humidity:     humidity ?? null,
                    soil_moisture: soil_moisture ?? null,
                    ph_level:     ph_level ?? null,
                    nitrogen:     nitrogen ?? null,
                    phosphorus:   phosphorus ?? null,
                    potassium:    potassium ?? null,
                    recorded_at:  new Date(),
                    simulated:    false,
                }]);
            }

            res.status(201).json({ success: true, message: "Sensor data saved" });
        });
    });
};

/* ──────────────────────────────────
   ADD SENSOR (farmer adds IoT device)
────────────────────────────────── */
exports.addSensor = (req, res) => {
    const userId = req.user.id;
    const { sensor_name, sensor_type, field_name } = req.body;

    // Generate unique device key
    const deviceKey = "AGRO_" + userId + "_" + Date.now();

    const sql = "INSERT INTO sensors(user_id, sensor_name, sensor_type, field_name, device_key) VALUES(?,?,?,?,?)";
    db.query(sql, [userId, sensor_name, sensor_type, field_name, deviceKey], (err, result) => {
        if (err) return res.status(500).json({ success: false, message: err.message });
        res.status(201).json({ success: true, sensorId: result.insertId, deviceKey });
    });
};

/* ──────────────────────────────────
   GET CROP RECOMMENDATION BASED ON SENSOR DATA
   Falls back to simulation if no real sensor data
────────────────────────────────── */
exports.getCropRecommendation = (req, res) => {
    const userId = req.user.id;

    // Get latest sensor data for this user
    const sql = `
      SELECT AVG(sd.temperature) AS avg_temp,
             AVG(sd.humidity) AS avg_humidity,
             AVG(sd.soil_moisture) AS avg_moisture,
             AVG(sd.ph_level) AS avg_ph,
             AVG(sd.nitrogen) AS avg_n,
             AVG(sd.phosphorus) AS avg_p,
             AVG(sd.potassium) AS avg_k
      FROM sensor_data sd
      JOIN sensors s ON sd.sensor_id = s.id
      WHERE s.user_id = ?
        AND sd.recorded_at >= NOW() - INTERVAL 24 HOUR
    `;
    db.query(sql, [userId], (err, rows) => {
        if (err) return res.status(500).json({ success: false, message: err.message });

        const data = rows[0];
        if (!data || !data.avg_temp) {
            // Use simulation data for recommendation
            const sim = getSimState(userId);
            const simData = {
                avg_temp:     sim.temperature,
                avg_humidity: sim.humidity,
                avg_moisture: sim.soil_moisture,
                avg_ph:       sim.ph_level,
                avg_n:        sim.nitrogen,
                avg_p:        sim.phosphorus,
                avg_k:        sim.potassium,
            };
            const recommendations = analyzeSensorData(simData);
            return res.json({
                success: true,
                simulated: true,
                sensorSummary: simData,
                recommendations
            });
        }

        const recommendations = analyzeSensorData(data);
        res.json({ success: true, simulated: false, sensorSummary: data, recommendations });
    });
};

/* ─── Helper: Simple rule-based crop recommendation ─── */
function analyzeSensorData({ avg_temp, avg_ph, avg_moisture, avg_n, avg_p, avg_k }) {
    const recs = [];

    if (avg_ph >= 6 && avg_ph <= 7 && avg_temp >= 25 && avg_temp <= 35 && avg_moisture >= 60) {
        recs.push({ crop: "Rice", confidence: 92, reason: "High moisture, optimal pH and temperature" });
    }
    if (avg_ph >= 6 && avg_ph <= 7.5 && avg_temp >= 15 && avg_temp <= 25) {
        recs.push({ crop: "Wheat", confidence: 88, reason: "Cool temperature, neutral pH — ideal for wheat" });
    }
    if (avg_ph >= 5.5 && avg_ph <= 6.5 && avg_temp >= 28 && avg_k > 40) {
        recs.push({ crop: "Cotton", confidence: 85, reason: "Good potassium, warm temperature — cotton-friendly" });
    }
    if (avg_temp >= 28 && avg_moisture >= 50 && avg_n > 30) {
        recs.push({ crop: "Maize", confidence: 80, reason: "Good nitrogen and warm temperature for maize" });
    }
    if (recs.length === 0) {
        recs.push({ crop: "Vegetables", confidence: 70, reason: "General conditions suitable for vegetable crops" });
    }

    return recs;
}

function getDefaultRecommendations() {
    return [
        { crop: "Rice",  confidence: 75, reason: "Default recommendation — simulated sensor data" },
        { crop: "Maize", confidence: 70, reason: "Suitable for most Indian soil types" }
    ];
}

/* ──────────────────────────────────
   AUTO-SIMULATE: HTTP endpoint (kept for backward compat)
   Delegates to shared helper
────────────────────────────────── */
exports.autoSimulate = (req, res) => {
    const userId = req.user.id;
    const io = req.app.get("io");

    _simulateForUser(userId, io, (action, sim) => {
        if (action === "skipped")    return res.json({ success: true, action: "skipped_real_data" });
        if (action === "no_sensors") return res.json({ success: true, action: "no_sensors" });
        if (action === "error")      return res.status(500).json({ success: false });
        res.json({ success: true, action: "simulated", data: sim });
    });
};

/* ──────────────────────────────────
   SERVER-SIDE AUTO SIMULATE (called by timer in server.js every 10s)
   Runs for ALL users who have sensors — no HTTP request needed
────────────────────────────────── */
exports.serverAutoSimulate = (io) => {
    db.query("SELECT DISTINCT user_id FROM sensors", (err, users) => {
        if (err || !users) return;
        users.forEach(({ user_id }) => {
            _simulateForUser(user_id, io, () => {});
        });
    });
};

/* ──────────────────────────────────
   SHARED SIMULATION HELPER
   Used by both autoSimulate (HTTP) and serverAutoSimulate (timer)
   Also handles no-sensor users (virtual sensor, not saved to DB)
────────────────────────────────── */
function _simulateForUser(userId, io, callback) {
    // Only simulate if no real data in last 30s
    const checkSql = `
      SELECT sd.sensor_id FROM sensor_data sd
      JOIN sensors s ON s.id = sd.sensor_id
      WHERE s.user_id = ? AND sd.recorded_at >= NOW() - INTERVAL 30 SECOND
      LIMIT 1
    `;
    db.query(checkSql, [userId], (err, recent) => {
        if (err) return callback("error");
        if (recent.length > 0) return callback("skipped");

        db.query(
            "SELECT id, sensor_name, sensor_type, field_name FROM sensors WHERE user_id = ?",
            [userId],
            (err2, sensors) => {
                if (err2) return callback("error");

                const sim = simulateNext(userId);
                const status = deriveStatus(sim);

                if (sensors.length === 0) {
                    // No registered sensors — emit virtual sensor update directly (no DB save)
                    if (io) {
                        io.to(`sensors_${userId}`).emit("sensor_update", [{
                            sensor_id:    null,
                            sensor_name:  "Virtual Farm Sensor",
                            sensor_type:  "multi",
                            field_name:   "Main Field",
                            status,
                            ...sim,
                            recorded_at:  new Date(),
                            simulated:    true,
                        }]);
                    }
                    return callback("no_sensors", sim);
                }

                // Insert simulated data for all registered sensors
                const values = sensors.map(s => [
                    s.id, sim.temperature, sim.humidity, sim.soil_moisture,
                    sim.ph_level, sim.nitrogen, sim.phosphorus, sim.potassium
                ]);
                const insertSql = `
                  INSERT INTO sensor_data
                    (sensor_id, temperature, humidity, soil_moisture, ph_level, nitrogen, phosphorus, potassium)
                  VALUES ?
                `;
                db.query(insertSql, [values], () => {
                    db.query(
                        "UPDATE sensors SET status=?, last_seen=NOW() WHERE user_id=?",
                        [status, userId]
                    );

                    // Emit real-time update to user's WebSocket room
                    if (io) {
                        const updates = sensors.map(s => ({
                            sensor_id:    s.id,
                            sensor_name:  s.sensor_name,
                            sensor_type:  s.sensor_type,
                            field_name:   s.field_name,
                            status,
                            ...sim,
                            recorded_at:  new Date(),
                            simulated:    true,
                        }));
                        io.to(`sensors_${userId}`).emit("sensor_update", updates);
                    }

                    callback("simulated", sim);
                });
            }
        );
    });
}
