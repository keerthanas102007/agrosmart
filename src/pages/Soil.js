import { useState, useEffect, useCallback } from "react";
import { Chart as ChartJS, RadialLinearScale, PointElement, LineElement, Filler, Tooltip, Legend } from "chart.js";
import { Radar } from "react-chartjs-2";
import { FaFlask, FaLeaf, FaThermometerHalf, FaTint, FaExclamationTriangle, FaCamera } from "react-icons/fa";
import MainLayout from "../layouts/MainLayout";
import { useApp } from "../context/AppContext";
import { analyzeSoil } from "../api/api";
import { translateText, translateTexts } from "../utils/translateText";
import TimePicker from "../components/TimePicker";
import NextStepCard from "../components/NextStepCard";
import SmartFlowPanel from "../components/SmartFlowPanel";
import "../styles/global.css";
import "../styles/Soil.css";
import "../styles/SmartFlowPanel.css";
import "../styles/NextStepCard.css";

ChartJS.register(RadialLinearScale, PointElement, LineElement, Filler, Tooltip, Legend);

// Soil profile static data — text values resolved via t keys at render time
const SOIL_PROFILE_DEFS = {
  "Sandy Loam":    { N:38, P:28, K:55, pH:6.4, organic:2.1, moisture:58, temp:29, reqAmt:"45", drainKey:"drainFast",     cropsKey:"scSandyLoam",   noteKey:"spSandyLoam"   },
  "Clay Loam":     { N:52, P:40, K:65, pH:7.1, organic:4.2, moisture:80, temp:27, reqAmt:"28", drainKey:"drainSlow",     cropsKey:"scClayLoam",    noteKey:"spClayLoam"    },
  "Silt Loam":     { N:45, P:35, K:60, pH:6.8, organic:3.5, moisture:74, temp:28, reqAmt:"35", drainKey:"drainModerate", cropsKey:"scSiltLoam",    noteKey:"spSiltLoam"    },
  "Red Loam":      { N:42, P:35, K:58, pH:6.8, organic:3.2, moisture:74, temp:28, reqAmt:"40", drainKey:"drainModerate", cropsKey:"scRedLoam",     noteKey:"spRedLoam"     },
  "Black Cotton":  { N:60, P:45, K:70, pH:7.8, organic:4.8, moisture:85, temp:26, reqAmt:"22", drainKey:"drainVerySlow", cropsKey:"scBlackCotton", noteKey:"spBlackCotton" },
  // Additional soil types — mapped to closest profile
  "Alluvial Soil": { N:55, P:42, K:65, pH:7.0, organic:4.0, moisture:78, temp:27, reqAmt:"32", drainKey:"drainModerate", cropsKey:"scSiltLoam",    noteKey:"spSiltLoam"    },
  "Laterite Soil": { N:30, P:20, K:45, pH:5.8, organic:1.8, moisture:55, temp:30, reqAmt:"48", drainKey:"drainFast",     cropsKey:"scRedLoam",     noteKey:"spRedLoam"     },
  "Desert Soil":   { N:22, P:15, K:35, pH:8.0, organic:0.8, moisture:25, temp:35, reqAmt:"60", drainKey:"drainFast",     cropsKey:"scSandyLoam",   noteKey:"spSandyLoam"   },
  "Mountain Soil": { N:40, P:30, K:50, pH:6.2, organic:5.0, moisture:70, temp:22, reqAmt:"30", drainKey:"drainFast",     cropsKey:"scSiltLoam",    noteKey:"spSiltLoam"    },
  "Loamy Sand":    { N:35, P:25, K:50, pH:6.5, organic:1.5, moisture:50, temp:29, reqAmt:"50", drainKey:"drainFast",     cropsKey:"scSandyLoam",   noteKey:"spSandyLoam"   },
  "Sandy Clay":    { N:48, P:38, K:60, pH:6.9, organic:3.0, moisture:72, temp:28, reqAmt:"30", drainKey:"drainSlow",     cropsKey:"scClayLoam",    noteKey:"spClayLoam"    },
  "Saline Soil":   { N:25, P:18, K:40, pH:8.5, organic:1.0, moisture:60, temp:30, reqAmt:"25", drainKey:"drainSlow",     cropsKey:"scBlackCotton", noteKey:"spBlackCotton" },
  "Chalky Soil":   { N:32, P:28, K:48, pH:7.8, organic:2.0, moisture:55, temp:28, reqAmt:"38", drainKey:"drainFast",     cropsKey:"scRedLoam",     noteKey:"spRedLoam"     },
  "Peat Soil":     { N:65, P:48, K:55, pH:5.5, organic:8.0, moisture:88, temp:24, reqAmt:"20", drainKey:"drainVerySlow", cropsKey:"scBlackCotton", noteKey:"spBlackCotton" },
};

const SOIL_TYPE_KEYS = {
  "Sandy Loam":"soilSandyLoam", "Clay Loam":"soilClayLoam", "Silt Loam":"soilSiltLoam",
  "Red Loam":"soilRedLoam", "Black Cotton":"soilBlackCotton",
  // Additional types use same key — fallback to English name
  "Alluvial Soil":"soilAlluvial", "Laterite Soil":"soilLaterite",
  "Desert Soil":"soilDesert", "Mountain Soil":"soilMountain",
  "Loamy Sand":"soilLoamySand", "Sandy Clay":"soilSandyClay",
  "Saline Soil":"soilSaline", "Chalky Soil":"soilChalky", "Peat Soil":"soilPeat",
};

export default function Soil() {
  const { t, user, lang, setSharedSoilResult, markFlowStep } = useApp();
  const [ph, setPh] = useState(6.8);
  const [soilType, setSoilType] = useState("Red Loam");

  // Soil Photo Analysis state
  const [photoMode,      setPhotoMode]      = useState(false);
  const [soilImage,      setSoilImage]      = useState(null);
  const [soilPreview,    setSoilPreview]    = useState(null);
  const [colorHint,      setColorHint]      = useState("red");
  const [analysisResult, setAnalysisResult] = useState(null);   // raw English from API
  const [translatedResult, setTranslatedResult] = useState(null); // translated for display
  const [analyzing,      setAnalyzing]      = useState(false);
  const [translating,    setTranslating]    = useState(false);
  const [analysisError,  setAnalysisError]  = useState("");

  /* ── Translate analysis result whenever lang changes ── */
  const translateResult = useCallback(async (raw, targetLang) => {
    if (!raw) return;
    if (targetLang === "en") { setTranslatedResult(raw); return; }
    setTranslating(true);
    try {
      // Translate best crops (crop name + reason)
      const cropReasons = (raw.bestCrops || []).map(c => c.reason);
      const translatedReasons = await translateTexts(cropReasons, targetLang);
      const translatedCrops = (raw.bestCrops || []).map((c, i) => ({
        ...c,
        reason: translatedReasons[i] || c.reason,
      }));

      // Translate fertilizer fields
      const fertTiming = await translateText(raw.fertilizer?.timing || "", targetLang);
      const fertExtra  = await translateText(raw.fertilizer?.extra  || "", targetLang);

      // Translate tips
      const irrigationAdvice = await translateText(raw.irrigationAdvice || "", targetLang);
      const tip              = await translateText(raw.tip || "", targetLang);

      // Translate stat labels (Drainage value is English text)
      const drainageVal = await translateText(raw.profile?.drainage || "", targetLang);

      setTranslatedResult({
        ...raw,
        bestCrops: translatedCrops,
        fertilizer: raw.fertilizer ? { ...raw.fertilizer, timing: fertTiming, extra: fertExtra } : null,
        irrigationAdvice,
        tip,
        profile: raw.profile ? { ...raw.profile, drainage: drainageVal } : raw.profile,
      });
    } catch {
      setTranslatedResult(raw); // fallback to English
    } finally {
      setTranslating(false);
    }
  }, []);

  // Re-translate when lang changes and there is a result
  useEffect(() => {
    if (analysisResult) translateResult(analysisResult, lang);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [lang, analysisResult]);

  // Resolve profile with translated strings
  const def = SOIL_PROFILE_DEFS[soilType] || SOIL_PROFILE_DEFS["Red Loam"];
  const profile = {
    ...def,
    water: `${def.reqAmt} ${t.swrUnit}`,
    drain: t[def.drainKey] || def.drainKey,
    crops: t[def.cropsKey] || def.cropsKey,
    note:  t[def.noteKey]  || def.noteKey,
  };

  const soilParams = [
    { label:t.nitrogen,      value:profile.N,       unit:t.unitMgKg, ideal:`40-60 ${t.unitMgKg}`,   color:"#2e7d32", icon:<FaLeaf /> },
    { label:t.phosphorus,    value:profile.P,       unit:t.unitMgKg, ideal:`25-50 ${t.unitMgKg}`,   color:"#0277bd", icon:<FaFlask /> },
    { label:t.potassium,     value:profile.K,       unit:t.unitMgKg, ideal:`50-80 ${t.unitMgKg}`,   color:"#e65100", icon:<FaLeaf /> },
    { label:t.phLevelLabel,  value:profile.pH,      unit:"",         ideal:"6.0–7.5",               color:"#6a1b9a", icon:<FaFlask /> },
    { label:t.organicMatter, value:profile.organic, unit:"%",        ideal:"2–5%",                  color:"#558b2f", icon:<FaLeaf /> },
    { label:t.soilTemp,      value:profile.temp,    unit:t.unitC,    ideal:`20–35${t.unitC}`,        color:"#f57f17", icon:<FaThermometerHalf /> },
    { label:t.moisture,      value:profile.moisture,unit:"%",        ideal:"50–80%",                color:"#0097a7", icon:<FaTint /> },
  ];

  const phStatus = () => {
    if (ph < 5.5) return { label: t.veryAcidic    || "Very Acidic",       color:"#c62828", tip: t.addLimeTip    || "Add lime to raise pH" };
    if (ph < 6.5) return { label: t.slightlyAcidic || "Slightly Acidic",  color:"#f57f17", tip: t.teaBerryTip   || "Suitable for tea, berries" };
    if (ph <= 7.5) return { label: t.neutralIdealPh || "Neutral — Ideal", color:"#2e7d32", tip: t.optimalCropTip || "Optimal for most crops" };
    if (ph <= 8.5) return { label: t.slightlyAlkaline || "Slightly Alkaline", color:"#f57f17", tip: t.addSulfurTip || "Add sulfur to lower pH" };
    return { label: t.veryAlkaline || "Very Alkaline", color:"#c62828", tip: t.poorNutrientTip || "Poor nutrient availability" };
  };
  const st = phStatus();

  // Color hint options
  const COLOR_HINTS = [
    { value:"red",    label:"🔴 Red / Reddish-brown",   soilType:"Red Loam"     },
    { value:"dark",   label:"⚫ Dark / Black",            soilType:"Black Cotton" },
    { value:"light",  label:"🟡 Light / Sandy / Tan",    soilType:"Sandy Loam"   },
    { value:"gray",   label:"🟤 Gray / Grayish-brown",   soilType:"Clay Loam"    },
    { value:"brown",  label:"🟫 Medium Brown",            soilType:"Silt Loam"    },
  ];

  const radarData = {
    labels: [t.nitrogen, t.phosphorus, t.potassium, `${t.phLevelLabel} (norm)`, t.organicMatter, t.moisture],
    datasets: [
      { label: t.currentSoilLabel || "Current Soil", data:[
          Math.round((profile.N/80)*100), Math.round((profile.P/60)*100),
          Math.round((profile.K/90)*100), Math.round((profile.pH/10)*100),
          Math.round((profile.organic/6)*100), profile.moisture,
        ], backgroundColor:"rgba(46,125,50,0.14)", borderColor:"#2e7d32", pointBackgroundColor:"#2e7d32", borderWidth:2 },
      { label: t.idealLabel || "Ideal", data:[80,80,80,80,80,80], backgroundColor:"rgba(2,119,189,0.05)", borderColor:"#0277bd", borderWidth:1.5, borderDash:[5,5], pointRadius:0 },
    ],
  };
  const radarOpts = {
    responsive:true, maintainAspectRatio:false,
    scales:{ r:{ min:0,max:100, grid:{color:"rgba(128,128,128,0.1)"}, pointLabels:{font:{size:11},color:"var(--text-secondary)"}, ticks:{display:false} } },
    plugins:{ legend:{ position:"top", labels:{ usePointStyle:true, font:{size:12} } } },
  };

  return (
    <MainLayout>
      <div className="page-header">
        <h1>🌱 {t.soilAnalysis}</h1>
        <p>{t.soilSub}</p>
      </div>

      {/* Soil type selector — at top, drives all data */}
      <div className="card-box" style={{ marginBottom:22 }}>
        <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", flexWrap:"wrap", gap:12 }}>
          <div>
            <div style={{ fontSize:15, fontWeight:700, marginBottom:4 }}>{t.soilType}: <span style={{ color:"var(--primary-light)" }}>{t[SOIL_TYPE_KEYS[soilType]] || soilType}</span></div>
            <div style={{ fontSize:12, color:"var(--text-muted)" }}>{t.bestCrops || "Best Crops"}: {profile.crops}</div>          </div>
          <div className="soil-type-btns">
            {Object.keys(SOIL_PROFILE_DEFS).map(s => (
              <button key={s} className={`soil-type-btn ${soilType===s?"soil-type-btn--active":""}`} onClick={() => setSoilType(s)}>
                {t[SOIL_TYPE_KEYS[s]] || s}
              </button>
            ))}
          </div>
        </div>
        <div className="soil-profile-note">💡 {profile.note}</div>
        <div className="soil-water-req">
          <span>💧 {t.waterNeeded}: <strong>{profile.water}</strong></span>
          <span>⬇️ {t.soilDrainage || "Drainage"}: <strong>{profile.drain}</strong></span>
        </div>
      </div>

      {/* Param cards */}
      <div className="stats-grid">
        {soilParams.map((p,i) => (
          <div key={i} className="metric-card" style={{ borderTop:`4px solid ${p.color}` }}>
            <div className="metric-card__icon" style={{ background:p.color+"18", color:p.color }}>{p.icon}</div>
            <div className="metric-card__body">
              <div className="metric-card__label">{p.label}</div>
              <div className="metric-card__value" style={{ color:p.color }}>{p.value}{p.unit}</div>
              <div className="metric-card__sub">{t.ideal}: {p.ideal}</div>
            </div>
          </div>
        ))}
      </div>

      <div className="two-col" style={{ marginBottom:22 }}>
        {/* pH Simulator */}
        <div className="card-box">
          <h3 className="section-title"><span>🧪</span> {t.phSimulator}</h3>
          <div className="ph-display" style={{ borderColor:st.color }}>
            <div className="ph-display__value" style={{ color:st.color }}>{ph}</div>
            <div className="ph-display__label" style={{ color:st.color }}>{st.label}</div>
            <div className="ph-display__tip">{st.tip}</div>
          </div>
          <div className="ph-slider-wrap">
            <span>0</span>
            <input type="range" min={0} max={14} step={0.1} value={ph} onChange={e => setPh(parseFloat(e.target.value))} className="ph-slider" />
            <span>14</span>
          </div>
          <div className="ph-scale">
            {[
              t.veryAcidic || "Very Acidic",
              t.slightlyAcidic || "Acidic",
              t.neutralIdealPh || "Neutral",
              t.slightlyAlkaline || "Alkaline",
              t.veryAlkaline || "Very Alkaline"
            ].map((l,i) => (
              <div key={i} style={{ fontSize:10, color:"var(--text-muted)" }}>{l}</div>
            ))}
          </div>
          <div className="ph-gradient" />

          {/* Soil-based irrigation schedule */}
          <div style={{ borderTop:"1px solid var(--border)", paddingTop:16, marginTop:8 }}>
            <div style={{ fontSize:13, fontWeight:700, color:"var(--text-primary)", marginBottom:8 }}>💧 {t.waterSchedule}</div>
            <div className="soil-schedule-row">
              <div>
                <label>{t.startTime}</label>
                <TimePicker value="06:00" t={t} />
              </div>
              <span style={{ color:"var(--text-muted)", fontSize:18, paddingTop:14 }}>→</span>
              <div>
                <label>{t.endTime}</label>
                <TimePicker value="08:00" t={t} />
              </div>
            </div>
            <div style={{ fontSize:12, color:"#0277bd", marginTop:8, background:"var(--info-light)", borderRadius:6, padding:"7px 10px" }}>
              💧 {t.requiredLabel || "Required"}: <strong>{profile.water}</strong> {t.basedOnLabel || "based on"} {t[SOIL_TYPE_KEYS[soilType]] || soilType}
            </div>
          </div>
        </div>

        {/* Radar chart */}
        <div className="chart-container" style={{ marginBottom:0 }}>
          <h3>🕸 {t.soilNutrient}</h3>
          <div style={{ height:290 }}><Radar data={radarData} options={radarOpts} /></div>
        </div>
      </div>

      <div className="alert-box alert-box--warning">
        <div className="alert-box__icon"><FaExclamationTriangle /></div>
        <div>
          <div className="alert-box__title">{t.lowOrganicTitle || "Low Organic Matter in Field D"}</div>
          <div className="alert-box__msg">{t.lowOrganicMsg || "Organic matter at 1.8% — below ideal range. Consider adding compost or green manure before next season."}</div>
        </div>
      </div>

      {/* ═══════════════════════════════════════════════
          SOIL PHOTO ANALYSIS SECTION
      ═══════════════════════════════════════════════ */}
      <div className="card-box" style={{ marginTop: 28 }}>
        <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", flexWrap:"wrap", gap:12, marginBottom:16 }}>
          <div>
            <h3 className="section-title" style={{ margin:0 }}>
              <span><FaCamera /></span>{" "}
              {lang==="ta" ? "📸 மண் புகைப்பட பகுப்பாய்வு" : lang==="hi" ? "📸 मिट्टी फोटो विश्लेषण" : "📸 Soil Photo Analysis"}
            </h3>
            <p style={{ fontSize:13, color:"var(--text-secondary)", marginTop:4, marginBottom:0 }}>
              {lang==="ta"
                ? "உங்கள் நிலத்தின் மண் புகைப்படம் எடுத்து upload பண்ணுங்கள் — மண் வகை, NPK, சிறந்த பயிர்கள் தெரியும்."
                : lang==="hi"
                ? "अपनी मिट्टी की फोटो अपलोड करें — मिट्टी का प्रकार, NPK और सर्वोत्तम फसलें जानें।"
                : "Upload a photo of your farm soil — get soil type, NPK values, and best crop recommendations."}
            </p>
          </div>
          <button
            className={`btn-outline-ag ${photoMode ? "btn-outline-ag--active" : ""}`}
            onClick={() => { setPhotoMode(m => !m); setAnalysisResult(null); setAnalysisError(""); }}
          >
            {photoMode
              ? (lang==="ta" ? "✖ மூடு" : lang==="hi" ? "✖ बंद करें" : "✖ Close")
              : (lang==="ta" ? "📷 பகுப்பாய்வு தொடங்கு" : lang==="hi" ? "📷 विश्लेषण शुरू करें" : "📷 Start Analysis")}
          </button>
        </div>

        {photoMode && !analysisResult && (
          <div>
            {/* Image upload area */}
            <div
              style={{
                border: "2px dashed var(--primary-light, #388e3c)", borderRadius:12, padding:"24px 16px",
                textAlign:"center", cursor:"pointer", background:"var(--bg-secondary)",
                marginBottom:16, transition:"background 0.2s",
              }}
              onClick={() => document.getElementById("soilImgInput").click()}
            >
              {soilPreview ? (
                <img src={soilPreview} alt="soil preview" style={{ maxHeight:180, maxWidth:"100%", borderRadius:8, objectFit:"cover" }} />
              ) : (
                <div>
                  <div style={{ fontSize:40, marginBottom:8 }}>🌱</div>
                  <div style={{ fontWeight:700, color:"var(--primary-light)" }}>
                    {lang==="ta" ? "மண் புகைப்படம் தேர்ந்தெடுக்கவும்" : lang==="hi" ? "मिट्टी की फोटो चुनें" : "Click to select soil photo"}
                  </div>
                  <div style={{ fontSize:12, color:"var(--text-muted)", marginTop:4 }}>JPG, PNG, WEBP — max 10MB</div>
                </div>
              )}
              <input
                id="soilImgInput" type="file" accept="image/*" style={{ display:"none" }}
                onChange={e => {
                  const file = e.target.files[0];
                  if (file) {
                    setSoilImage(file);
                    setSoilPreview(URL.createObjectURL(file));
                  }
                }}
              />
            </div>

            {/* Color hint selector */}
            <div style={{ marginBottom:16 }}>
              <label style={{ display:"block", fontSize:12, fontWeight:700, color:"var(--text-muted)", textTransform:"uppercase", letterSpacing:"0.5px", marginBottom:8 }}>
                {lang==="ta" ? "மண் நிறம் எது?" : lang==="hi" ? "मिट्टी का रंग क्या है?" : "What color is your soil?"}
              </label>
              <div style={{ display:"flex", gap:8, flexWrap:"wrap" }}>
                {COLOR_HINTS.map(c => (
                  <button
                    key={c.value}
                    className={`soil-type-btn ${colorHint===c.value ? "soil-type-btn--active" : ""}`}
                    onClick={() => setColorHint(c.value)}
                    type="button"
                  >
                    {c.label}
                  </button>
                ))}
              </div>
              <div style={{ fontSize:11, color:"var(--text-muted)", marginTop:6 }}>
                {lang==="ta" ? "💡 தேர்ந்தெடுத்த நிறம்:" : "💡 Selected will detect:"}{" "}
                <strong style={{ color:"var(--primary-light)" }}>
                  {COLOR_HINTS.find(c => c.value===colorHint)?.soilType}
                </strong>
              </div>
            </div>

            {analysisError && (
              <div className="form-error" style={{ marginBottom:12 }}>⚠️ {analysisError}</div>
            )}

            <button
              className="btn-primary-ag"
              style={{ width:"100%", justifyContent:"center" }}
              disabled={!soilImage || analyzing}
              onClick={async () => {
                if (!soilImage) return setAnalysisError(lang==="ta" ? "புகைப்படம் தேர்ந்தெடுக்கவும்" : "Please select a soil image first.");
                try {
                  setAnalyzing(true);
                  setAnalysisError("");
                  const fd = new FormData();
                  fd.append("image", soilImage);
                  fd.append("soil_color_hint", colorHint);
                  const res = await analyzeSoil(fd);
                  setAnalysisResult(res.data);
                  // Save to shared context — Crops & Fertilizer pages will use this
                  setSharedSoilResult(res.data);
                  markFlowStep("soilDone");
                  // Translate immediately after receiving result
                  await translateResult(res.data, lang);
                } catch (err) {
                  setAnalysisError(err.response?.data?.message || (lang==="ta" ? "பகுப்பாய்வு தோல்வி. மீண்டும் முயற்சிக்கவும்." : "Analysis failed. Please try again."));
                } finally {
                  setAnalyzing(false);
                }
              }}
            >
              {analyzing
                ? (lang==="ta" ? "⏳ பகுப்பாய்வு நடக்கிறது..." : lang==="hi" ? "⏳ विश्लेषण हो रहा है..." : "⏳ Analyzing...")
                : (lang==="ta" ? "🔬 மண் பகுப்பாய்வு பண்ணு" : lang==="hi" ? "🔬 मिट्टी विश्लेषण करें" : "🔬 Analyze Soil")}
            </button>
          </div>
        )}

        {/* ── ANALYSIS RESULT ── */}
        {translatedResult && (
          <div>
            {/* Translating indicator */}
            {translating && (
              <div style={{
                background:"#e8f5e9", border:"1px solid #a5d6a7", borderRadius:8,
                padding:"8px 14px", fontSize:13, color:"#2e7d32", fontWeight:600,
                marginBottom:12, display:"flex", alignItems:"center", gap:8
              }}>
                <div className="spinner" style={{ width:14, height:14 }} />
                {lang==="ta" ? "மொழிபெயர்க்கிறது..." : lang==="hi" ? "अनुवाद हो रहा है..." : "Translating..."}
              </div>
            )}

            {/* Header */}
            <div style={{
              background:"linear-gradient(135deg, #e8f5e9, #f1f8e9)", borderRadius:12, padding:"18px 20px",
              marginBottom:18, display:"flex", alignItems:"center", gap:16, flexWrap:"wrap"
            }}>
              <img src={soilPreview} alt="soil" style={{ width:72, height:72, borderRadius:10, objectFit:"cover", border:"2px solid #a5d6a7" }} />
              <div style={{ flex:1 }}>
                <div style={{ display:"flex", alignItems:"center", gap:8, flexWrap:"wrap" }}>
                  <span style={{ fontSize:28 }}>{translatedResult.icon}</span>
                  <div>
                    <div style={{ fontSize:18, fontWeight:800, color:"var(--text-primary)" }}>{translatedResult.soilType}</div>
                    <div style={{ fontSize:12, color:"var(--text-secondary)" }}>{translatedResult.colorDesc}</div>
                  </div>
                  <div style={{
                    marginLeft:"auto", background:"#2e7d32", color:"#fff",
                    borderRadius:20, padding:"4px 14px", fontSize:13, fontWeight:700
                  }}>
                    {translatedResult.confidence}% {lang==="ta" ? "நம்பகத்தன்மை" : lang==="hi" ? "विश्वसनीयता" : "Confidence"}
                  </div>
                </div>
              </div>
            </div>

            {/* Soil stats */}
            <div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fill, minmax(130px, 1fr))", gap:10, marginBottom:18 }}>
              {[
                { label: lang==="ta"?"நைட்ரஜன் (N)":lang==="hi"?"नाइट्रोजन (N)":"Nitrogen (N)",
                  value:`${translatedResult.profile?.N} mg/kg`, color:"#2e7d32" },
                { label: lang==="ta"?"பாஸ்பரஸ் (P)":lang==="hi"?"फास्फोरस (P)":"Phosphorus (P)",
                  value:`${translatedResult.profile?.P} mg/kg`, color:"#0277bd" },
                { label: lang==="ta"?"பொட்டாசியம் (K)":lang==="hi"?"पोटेशियम (K)":"Potassium (K)",
                  value:`${translatedResult.profile?.K} mg/kg`, color:"#e65100" },
                { label:"pH", value:translatedResult.profile?.ph?.typical, color:"#6a1b9a" },
                { label: lang==="ta"?"கரிம பொருள்":lang==="hi"?"जैविक पदार्थ":"Organic Matter",
                  value:`${translatedResult.profile?.organic}%`, color:"#558b2f" },
                { label: lang==="ta"?"ஈரப்பதம்":lang==="hi"?"नमी":"Moisture",
                  value:`${translatedResult.profile?.moisture}%`, color:"#0097a7" },
                { label: lang==="ta"?"நீர் தேவை":lang==="hi"?"पानी की जरूरत":"Water Req.",
                  value:translatedResult.profile?.waterReq, color:"#1565c0" },
                { label: lang==="ta"?"வடிகால்":lang==="hi"?"जल निकासी":"Drainage",
                  value:translatedResult.profile?.drainage, color:"#4a148c" },
              ].map((s,i) => (
                <div key={i} style={{
                  background:"var(--bg-secondary)", border:"1px solid var(--border)",
                  borderLeft:`4px solid ${s.color}`, borderRadius:10, padding:"10px 12px"
                }}>
                  <div style={{ fontSize:10, color:"var(--text-muted)", marginBottom:3, textTransform:"uppercase" }}>{s.label}</div>
                  <div style={{ fontSize:17, fontWeight:800, color:s.color }}>{s.value}</div>
                </div>
              ))}
            </div>

            {/* Best Crops */}
            <div style={{ marginBottom:16 }}>
              <div style={{ fontWeight:700, fontSize:14, marginBottom:10, color:"var(--text-primary)" }}>
                🌾 {lang==="ta" ? "சிறந்த பயிர்கள்" : lang==="hi" ? "सर्वोत्तम फसलें" : "Best Crops for This Soil"}
              </div>
              <div style={{ display:"flex", flexDirection:"column", gap:8 }}>
                {(translatedResult.bestCrops || []).map((crop, i) => (
                  <div key={i} style={{
                    background:"var(--bg-secondary)", borderRadius:10, padding:"12px 14px",
                    border:"1px solid var(--border)", display:"flex", alignItems:"center", gap:12
                  }}>
                    <div style={{
                      background:i===0?"#2e7d32":i===1?"#0277bd":i===2?"#e65100":"#6a1b9a",
                      color:"#fff", borderRadius:20, padding:"3px 12px", fontSize:12, fontWeight:700, minWidth:50, textAlign:"center"
                    }}>
                      #{i+1}
                    </div>
                    <div style={{ flex:1 }}>
                      <div style={{ fontWeight:700, fontSize:14 }}>{crop.crop}</div>
                      <div style={{ fontSize:12, color:"var(--text-secondary)", marginTop:2 }}>{crop.reason}</div>
                    </div>
                    <div style={{ textAlign:"right", minWidth:90 }}>
                      <div style={{ fontWeight:800, color:"#2e7d32", fontSize:15 }}>{crop.confidence}%</div>
                      <div style={{ fontSize:11, color:"var(--text-muted)" }}>
                        {lang==="ta"?"மகசூல்":lang==="hi"?"उपज":"yield"}: {crop.yield}
                      </div>
                      <div style={{ fontSize:11, color:"#0277bd" }}>{crop.season}</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Fertilizer Recommendation */}
            {translatedResult.fertilizer && (
              <div style={{
                background:"#e3f2fd", border:"1px solid #90caf9", borderRadius:10, padding:"14px 16px", marginBottom:14
              }}>
                <div style={{ fontWeight:700, marginBottom:8, color:"#1565c0" }}>
                  🧪 {lang==="ta" ? "உர பரிந்துரை" : lang==="hi" ? "उर्वरक अनुशंसा" : "Fertilizer Recommendation"}
                </div>
                <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:6, fontSize:13 }}>
                  <div><strong>NPK:</strong> {translatedResult.fertilizer.NPK}</div>
                  <div><strong>Urea:</strong> {translatedResult.fertilizer.urea}</div>
                </div>
                <div style={{ fontSize:12, color:"var(--text-secondary)", marginTop:6 }}>
                  ⏱️ {translatedResult.fertilizer.timing}
                </div>
                <div style={{ fontSize:12, color:"#2e7d32", marginTop:4 }}>
                  ➕ {translatedResult.fertilizer.extra}
                </div>
              </div>
            )}

            {/* Tips */}
            <div style={{ display:"flex", flexDirection:"column", gap:8 }}>
              {translatedResult.irrigationAdvice && (
                <div style={{ background:"#e8f5e9", borderRadius:8, padding:"10px 14px", fontSize:13, color:"#1b5e20", border:"1px solid #a5d6a7" }}>
                  💧 <strong>{lang==="ta" ? "நீர்ப்பாசன ஆலோசனை:" : lang==="hi" ? "सिंचाई सलाह:" : "Irrigation:"}</strong> {translatedResult.irrigationAdvice}
                </div>
              )}
              {translatedResult.tip && (
                <div style={{ background:"#fff8e1", borderRadius:8, padding:"10px 14px", fontSize:13, color:"#e65100", border:"1px solid #ffe082" }}>
                  💡 <strong>{lang==="ta" ? "குறிப்பு:" : lang==="hi" ? "सुझाव:" : "Tip:"}</strong> {translatedResult.tip}
                </div>
              )}
            </div>

            {/* Redo button */}
            <button
              className="btn-outline-ag"
              style={{ marginTop:16, width:"100%", justifyContent:"center" }}
              onClick={() => {
                setAnalysisResult(null);
                setTranslatedResult(null);
                setSoilImage(null);
                setSoilPreview(null);
                setColorHint("red");
              }}
            >
              🔄 {lang==="ta" ? "மீண்டும் பகுப்பாய்வு" : lang==="hi" ? "फिर से विश्लेषण" : "Analyze Another Photo"}
            </button>
          </div>
        )}

        {/* Smart Flow: Next Step card — go to Crop Recommendations */}
        <NextStepCard currentStep="soilDone" />
      </div>
    </MainLayout>
  );
}
