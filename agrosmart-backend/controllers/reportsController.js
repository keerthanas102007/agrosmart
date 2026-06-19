const db = require("../config/db");

/* ═══════════════════════════════════════════════════════════
   REPORTS CONTROLLER
   Single endpoint that aggregates all real farmer data
   for the Reports page dashboard.
═══════════════════════════════════════════════════════════ */

exports.getReports = (req, res) => {
  const userId = req.user.id;

  // Run all queries in parallel
  Promise.all([

    /* 1. Sensor averages — last 30 days (monthly trend, 6 months) */
    new Promise((resolve) => {
      const sql = `
        SELECT
          DATE_FORMAT(sd.recorded_at, '%Y-%m') AS month,
          ROUND(AVG(sd.temperature),   1) AS avg_temp,
          ROUND(AVG(sd.humidity),      1) AS avg_humidity,
          ROUND(AVG(sd.soil_moisture), 1) AS avg_soil,
          ROUND(AVG(sd.ph_level),      2) AS avg_ph,
          ROUND(AVG(sd.nitrogen),      1) AS avg_n,
          ROUND(AVG(sd.phosphorus),    1) AS avg_p,
          ROUND(AVG(sd.potassium),     1) AS avg_k,
          COUNT(*)                        AS reading_count
        FROM sensor_data sd
        JOIN sensors s ON s.id = sd.sensor_id
        WHERE s.user_id = ?
          AND sd.recorded_at >= DATE_SUB(NOW(), INTERVAL 6 MONTH)
        GROUP BY DATE_FORMAT(sd.recorded_at, '%Y-%m')
        ORDER BY month ASC
      `;
      db.query(sql, [userId], (err, rows) => resolve(err ? [] : rows));
    }),

    /* 2. Latest single sensor reading */
    new Promise((resolve) => {
      const sql = `
        SELECT sd.temperature, sd.humidity, sd.soil_moisture,
               sd.ph_level, sd.nitrogen, sd.phosphorus, sd.potassium
        FROM sensor_data sd
        JOIN sensors s ON s.id = sd.sensor_id
        WHERE s.user_id = ?
        ORDER BY sd.recorded_at DESC
        LIMIT 1
      `;
      db.query(sql, [userId], (err, rows) => resolve(err || rows.length === 0 ? null : rows[0]));
    }),

    /* 3. Irrigation logs count + ON hours per month (last 6 months) */
    new Promise((resolve) => {
      const sql = `
        SELECT
          DATE_FORMAT(created_at, '%Y-%m') AS month,
          SUM(action = 'on')  AS on_count,
          SUM(action = 'off') AS off_count
        FROM irrigation_logs
        WHERE user_id = ?
          AND created_at >= DATE_SUB(NOW(), INTERVAL 6 MONTH)
        GROUP BY DATE_FORMAT(created_at, '%Y-%m')
        ORDER BY month ASC
      `;
      db.query(sql, [userId], (err, rows) => resolve(err ? [] : rows));
    }),

    /* 4. Total irrigation ON events (all time) */
    new Promise((resolve) => {
      const sql = `SELECT COUNT(*) AS total FROM irrigation_logs WHERE user_id=? AND action='on'`;
      db.query(sql, [userId], (err, rows) => resolve(err ? 0 : rows[0].total));
    }),

    /* 5. Disease detections — count + by month */
    new Promise((resolve) => {
      const sql = `
        SELECT
          DATE_FORMAT(created_at, '%Y-%m') AS month,
          COUNT(*) AS count,
          SUM(severity = 'high')   AS high,
          SUM(severity = 'medium') AS medium,
          SUM(severity = 'low')    AS low
        FROM disease_detections
        WHERE user_id = ?
          AND created_at >= DATE_SUB(NOW(), INTERVAL 6 MONTH)
        GROUP BY DATE_FORMAT(created_at, '%Y-%m')
        ORDER BY month ASC
      `;
      db.query(sql, [userId], (err, rows) => resolve(err ? [] : rows));
    }),

    /* 6. Disease total count + latest disease name */
    new Promise((resolve) => {
      const sql = `
        SELECT COUNT(*) AS total, 
               (SELECT disease_name FROM disease_detections WHERE user_id=? ORDER BY created_at DESC LIMIT 1) AS latest
        FROM disease_detections WHERE user_id=?
      `;
      db.query(sql, [userId, userId], (err, rows) => resolve(err ? { total: 0, latest: null } : rows[0]));
    }),

    /* 7. Soil analyses — latest + avg soil health score */
    new Promise((resolve) => {
      const sql = `
        SELECT soil_type, confidence, organic_matter, moisture,
               nitrogen, phosphorus, potassium, ph_typical, created_at
        FROM soil_analysis
        WHERE user_id = ?
        ORDER BY created_at DESC
        LIMIT 6
      `;
      db.query(sql, [userId], (err, rows) => resolve(err ? [] : rows));
    }),

    /* 8. Profit history — total investment vs profit */
    new Promise((resolve) => {
      const sql = `
        SELECT
          crop_name,
          SUM(investment) AS total_investment,
          SUM(profit)     AS total_profit,
          COUNT(*)        AS entries,
          DATE_FORMAT(MIN(created_at), '%Y-%m') AS month
        FROM profit_history
        WHERE user_id = ?
        GROUP BY crop_name
        ORDER BY total_profit DESC
        LIMIT 5
      `;
      db.query(sql, [userId], (err, rows) => resolve(err ? [] : rows));
    }),

    /* 9. Farm history activity count per type */
    new Promise((resolve) => {
      const sql = `
        SELECT type_key, COUNT(*) AS count, SUM(quantity) AS total_qty
        FROM farm_history
        WHERE user_id = ?
        GROUP BY type_key
        ORDER BY count DESC
      `;
      db.query(sql, [userId], (err, rows) => resolve(err ? [] : rows));
    }),

    /* 10. User profile (farm size, primary crop) */
    new Promise((resolve) => {
      const sql = `SELECT name, farm_size, primary_crop, location, state, created_at FROM users WHERE id=?`;
      db.query(sql, [userId], (err, rows) => resolve(err || rows.length === 0 ? null : rows[0]));
    }),

    /* 11. Water usage estimate — total motor ON events × estimated litres */
    new Promise((resolve) => {
      const sql = `
        SELECT
          DATE_FORMAT(created_at, '%Y-%m') AS month,
          SUM(action = 'on') AS sessions
        FROM irrigation_logs
        WHERE user_id = ?
          AND created_at >= DATE_SUB(NOW(), INTERVAL 6 MONTH)
        GROUP BY DATE_FORMAT(created_at, '%Y-%m')
        ORDER BY month ASC
      `;
      db.query(sql, [userId], (err, rows) => resolve(err ? [] : rows));
    }),

  ]).then(([
    sensorMonthly, latestSensor, irrigMonthly, totalIrrigOn,
    diseaseMonthly, diseaseSummary, soilHistory, profitData,
    farmActivities, userProfile, waterMonthly
  ]) => {

    // ── Build 6-month labels ──────────────────────────────
    const monthLabels = [];
    for (let i = 5; i >= 0; i--) {
      const d = new Date();
      d.setMonth(d.getMonth() - i);
      monthLabels.push(d.toISOString().slice(0, 7)); // "YYYY-MM"
    }

    // Helper: fill gaps in monthly data with 0
    const fillMonths = (rows, key, defaultVal = 0) =>
      monthLabels.map(m => {
        const row = rows.find(r => r.month === m);
        return row ? (parseFloat(row[key]) || defaultVal) : defaultVal;
      });

    // ── Sensor monthly trend ──────────────────────────────
    const tempTrend     = fillMonths(sensorMonthly, "avg_temp",     null);
    const humidityTrend = fillMonths(sensorMonthly, "avg_humidity", null);
    const soilTrend     = fillMonths(sensorMonthly, "avg_soil",     null);

    // ── Irrigation monthly ────────────────────────────────
    const irrigOnCounts  = fillMonths(irrigMonthly, "on_count",  0);
    // Estimate: avg session = 2 hrs × 45 L/min × 60 = 5400 L per ON event
    const waterEstimates = fillMonths(waterMonthly, "sessions",  0).map(s => +(s * 5400 / 1000).toFixed(1)); // kL

    // ── Disease monthly ───────────────────────────────────
    const diseaseCounts = fillMonths(diseaseMonthly, "count", 0);
    const diseaseHigh   = fillMonths(diseaseMonthly, "high",  0);

    // ── Soil avg health score (from confidence) ───────────
    const avgSoilHealth = soilHistory.length > 0
      ? Math.round(soilHistory.reduce((a, b) => a + b.confidence, 0) / soilHistory.length)
      : null;

    // ── Profit totals ─────────────────────────────────────
    const totalInvestment = profitData.reduce((a, b) => a + parseFloat(b.total_investment || 0), 0);
    const totalProfit     = profitData.reduce((a, b) => a + parseFloat(b.total_profit     || 0), 0);

    // ── Active alerts (disease high severity in last 30 days) ──
    const activeAlerts = diseaseMonthly
      .filter(d => d.month === monthLabels[5]) // current month
      .reduce((a, b) => a + parseInt(b.high || 0), 0);

    res.json({
      success: true,

      // ── Summary cards ──────────────────────────────────
      summary: {
        totalIrrigationSessions: totalIrrigOn,
        totalWaterKL:            waterEstimates.reduce((a, b) => a + b, 0).toFixed(1),
        avgSoilHealth:           avgSoilHealth,
        totalDiseaseDetections:  parseInt(diseaseSummary.total || 0),
        latestDisease:           diseaseSummary.latest,
        activeAlerts:            activeAlerts,
        totalProfit:             totalProfit.toFixed(0),
        totalInvestment:         totalInvestment.toFixed(0),
        soilAnalysesCount:       soilHistory.length,
        farmActivitiesCount:     farmActivities.reduce((a, b) => a + b.count, 0),
      },

      // ── User/farm info ──────────────────────────────────
      farm: userProfile,

      // ── Latest sensor reading ────────────────────────────
      latestSensor,

      // ── 6-month chart data ───────────────────────────────
      monthLabels,
      charts: {
        temperature:    tempTrend,
        humidity:       humidityTrend,
        soilMoisture:   soilTrend,
        irrigationOn:   irrigOnCounts,
        waterUsageKL:   waterEstimates,
        diseaseCounts,
        diseaseHigh,
      },

      // ── Breakdown lists ──────────────────────────────────
      soilHistory:     soilHistory.slice(0, 3),
      profitBreakdown: profitData,
      farmActivities,
      diseaseMonthly,
    });
  }).catch(err => {
    res.status(500).json({ success: false, message: err.message });
  });
};
