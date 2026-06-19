/**
 * fertilizerController.js
 * Aggregates ALL farmer-entered data to produce smart fertilizer recommendations.
 * Sources:
 *   - users            → primary_crop, farm_size, state
 *   - farm_details     → soil_type, active_crops, water_source, total_area
 *   - farm_fields      → per-field crop, area, health
 *   - farm_history     → recent fertilizer/irrigation/sowing activities
 *   - soil_analysis    → latest soil photo analysis (N, P, K, pH)
 */

const db = require("../config/db");

/* ── Rule-based NPK deficit calculator ───────────────────── */
function calcDeficit(soilN, soilP, soilK, cropBase) {
  const match = (cropBase || "").match(/(\d+)-(\d+)-(\d+)/);
  if (!match) return null;
  const [, bN, bP, bK] = match.map(Number);
  const optN = 50, optP = 35, optK = 55; // mg/kg optimal
  return {
    N: Math.max(0, Math.round(bN * (1 - Math.min(soilN || 0, optN) / optN * 0.5))),
    P: Math.max(0, Math.round(bP * (1 - Math.min(soilP || 0, optP) / optP * 0.5))),
    K: Math.max(0, Math.round(bK * (1 - Math.min(soilK || 0, optK) / optK * 0.5))),
  };
}

/* ── Activity label map (type_key → human label) ─────────── */
const ACTIVITY_LABELS = {
  act_urea:"Urea", act_npk:"NPK Fertilizer", act_dap:"DAP",
  act_potash:"Potash", act_organic:"Organic Manure",
  act_pesticide:"Pesticide", act_irrigation:"Irrigation",
  act_harvest:"Harvest", act_sowing:"Sowing",
  act_weeding:"Weeding", act_fungicide:"Fungicide", act_other:"Other",
};

/* ── NPK base doses per crop (kg/ha) ─────────────────────── */
const CROP_NPK = {
  rice:"90-60-40", wheat:"60-30-30", maize:"80-50-30", cotton:"60-30-60",
  sugarcane:"120-60-120", sorghum:"80-40-20", groundnut:"20-60-30",
  soybean:"25-60-40", chickpea:"20-60-20", sunflower:"90-60-60",
  tomato:"100-50-50", onion:"80-50-50", potato:"120-60-100",
  default:"60-30-30",
};

function getNPKForCrop(cropName) {
  if (!cropName) return CROP_NPK.default;
  const key = cropName.toLowerCase().trim();
  return CROP_NPK[key] || CROP_NPK.default;
}

/* ── pH status helper ─────────────────────────────────────── */
function phStatus(ph) {
  if (!ph) return null;
  if (ph < 5.5)  return { label:"Very Acidic — add lime",  action:"Add agricultural lime 1–2 T/acre", color:"danger" };
  if (ph < 6.0)  return { label:"Slightly Acidic",          action:"Add lime 200–400 kg/acre",          color:"warning" };
  if (ph <= 7.5) return { label:"Optimal (6.0–7.5)",        action:"Maintain current practice",         color:"success" };
  if (ph <= 8.0) return { label:"Slightly Alkaline",        action:"Add sulfur 100–200 kg/acre",        color:"warning" };
  return               { label:"Very Alkaline — add sulfur",action:"Apply gypsum + sulfur 400 kg/acre", color:"danger"  };
}

/* ── Soil-type specific fertilizer tips ──────────────────── */
const SOIL_TIPS = {
  "Sandy Loam":    "Sandy soil leaches nutrients fast. Use split doses every 20 days. Add compost 3 T/acre.",
  "Clay Loam":     "Clay holds nutrients well. Avoid over-application. Ensure good drainage before fertilizing.",
  "Red Loam":      "Iron-rich but low N. Add compost regularly. Split N into 3 doses.",
  "Black Cotton":  "High water retention. Reduce irrigation before applying fertilizer. Add gypsum if alkaline.",
  "Silt Loam":     "Balanced soil. Standard 2-split dosing works well. Keep organic matter > 3%.",
};

/* ════════════════════════════════════════════════════════════
   GET FARMER FERTILIZER DATA
   GET /api/farm/fertilizer-data
════════════════════════════════════════════════════════════ */
exports.getFertilizerData = (req, res) => {
  const userId = req.user.id;

  // Run all queries in parallel
  const q = (sql, params) => new Promise((resolve, reject) => {
    db.query(sql, params, (err, rows) => err ? reject(err) : resolve(rows));
  });

  Promise.all([
    // 1. User profile
    q("SELECT name, primary_crop, farm_size, state, location FROM users WHERE id=?", [userId]),
    // 2. Farm details
    q("SELECT * FROM farm_details WHERE user_id=?", [userId]),
    // 3. Farm fields
    q("SELECT field_name, crop, area, health, irrigation, season FROM farm_fields WHERE user_id=? ORDER BY id ASC", [userId]),
    // 4. Recent farm history (last 90 days)
    q(`SELECT type_key, field_key, quantity, unit_key, notes, activity_date
       FROM farm_history WHERE user_id=? AND activity_date >= DATE_SUB(NOW(), INTERVAL 90 DAY)
       ORDER BY activity_date DESC LIMIT 30`, [userId]),
    // 5. Latest soil analysis
    q(`SELECT soil_type, ph_typical, nitrogen, phosphorus, potassium, organic_matter,
              drainage, best_crops, fertilizer_rec, irrigation_tip, created_at
       FROM soil_analysis WHERE user_id=? ORDER BY created_at DESC LIMIT 1`, [userId]),
  ])
  .then(([userRows, farmRows, fields, history, soilRows]) => {
    const user      = userRows[0] || {};
    const farm      = farmRows[0] || {};
    const soilAna   = soilRows[0] || null;

    // ── Determine active crops ────────────────────────────
    const fieldCrops = fields.map(f => f.crop).filter(Boolean);
    const activeCropsStr = farm.active_crops || user.primary_crop || "";
    const allCrops = [...new Set([
      ...fieldCrops,
      ...activeCropsStr.split(/[,،、]+/).map(c => c.trim()).filter(Boolean)
    ])];

    // ── Soil data from soil_analysis (best source) ────────
    const soilN  = soilAna?.nitrogen    || null;
    const soilP  = soilAna?.phosphorus  || null;
    const soilK  = soilAna?.potassium   || null;
    const soilPh = soilAna?.ph_typical  || null;
    const soilType = soilAna?.soil_type || farm.soil_type || null;

    // ── Recent fertilizer activities ─────────────────────
    const fertHistory = history.filter(h =>
      ["act_urea","act_npk","act_dap","act_potash","act_organic"].includes(h.type_key)
    );
    const lastFertDate = fertHistory[0]?.activity_date || null;
    const daysSinceLastFert = lastFertDate
      ? Math.floor((Date.now() - new Date(lastFertDate)) / 86400000)
      : null;

    // ── Per-crop recommendations ──────────────────────────
    const cropRecs = (allCrops.length > 0 ? allCrops : ["Rice"]).map(crop => {
      const baseNPK = getNPKForCrop(crop);
      const adjusted = (soilN !== null && soilP !== null && soilK !== null)
        ? calcDeficit(soilN, soilP, soilK, baseNPK) : null;
      return {
        crop,
        baseNPK,
        adjustedNPK: adjusted,
        field: fields.find(f => f.crop?.toLowerCase() === crop.toLowerCase()) || null,
      };
    });

    // ── Alerts ───────────────────────────────────────────
    const alerts = [];
    if (daysSinceLastFert !== null && daysSinceLastFert > 30) {
      alerts.push({ type:"warning", msg:`Last fertilizer applied ${daysSinceLastFert} days ago. Consider next dose soon.` });
    }
    if (soilPh !== null) {
      const ps = phStatus(soilPh);
      if (ps?.color !== "success") alerts.push({ type: ps.color, msg: `Soil pH ${soilPh} — ${ps.action}` });
    }
    if (soilN !== null && soilN < 30) {
      alerts.push({ type:"warning", msg:`Nitrogen level low (${soilN} mg/kg). Increase N application.` });
    }

    // ── Response ─────────────────────────────────────────
    res.json({
      success: true,
      farmer: {
        name:       user.name,
        state:      user.state || farm.location,
        farm_name:  farm.farm_name,
        farm_size:  farm.total_area || (user.farm_size ? `${user.farm_size} acres` : null),
        water_source: farm.water_source,
      },
      soilData: soilN !== null ? {
        nitrogen:     soilN,
        phosphorus:   soilP,
        potassium:    soilK,
        ph:           soilPh,
        organic:      soilAna.organic_matter,
        soil_type:    soilType,
        drainage:     soilAna.drainage,
        analyzed_on:  soilAna.created_at,
        source:       "soil_analysis",
      } : soilType ? {
        soil_type:    soilType,
        source:       "farm_details",
      } : null,
      soilTip: SOIL_TIPS[soilType] || null,
      phStatus: phStatus(soilPh),
      fields,
      allCrops,
      cropRecommendations: cropRecs,
      recentHistory: history.slice(0, 10).map(h => ({
        ...h,
        label: ACTIVITY_LABELS[h.type_key] || h.type_key,
        date:  h.activity_date,
      })),
      fertHistory: fertHistory.slice(0, 5).map(h => ({
        ...h,
        label: ACTIVITY_LABELS[h.type_key] || h.type_key,
      })),
      daysSinceLastFert,
      alerts,
      hasSoilAnalysis: soilN !== null,
    });
  })
  .catch(err => res.status(500).json({ success:false, message:err.message }));
};
