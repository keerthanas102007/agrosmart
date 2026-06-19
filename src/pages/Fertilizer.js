import { useState, useEffect } from "react";
import { FaSeedling, FaInfoCircle, FaExclamationTriangle, FaCheckCircle, FaHistory } from "react-icons/fa";
import MainLayout from "../layouts/MainLayout";
import { useApp } from "../context/AppContext";
import { CROP_GROUPS, FERTILIZER_DATA, DEFAULT_FERT, getCropName } from "../data/cropFertilizers";
import { getFertilizerData } from "../api/api";
import "../styles/global.css";

/* ── Nutrient bar helpers ─────────────────────────────────── */
function nutrientStatus(val, opt) {
  const r = val / opt;
  if (r < 0.6)  return { label:"Low",         color:"#d32f2f", icon:"🔴", pct: Math.round(r*100) };
  if (r < 0.85) return { label:"Slightly Low", color:"#f57c00", icon:"🟡", pct: Math.round(r*100) };
  if (r <= 1.2) return { label:"Optimal",      color:"#2e7d32", icon:"🟢", pct: Math.min(100, Math.round(r*100)) };
  return               { label:"High",         color:"#1565c0", icon:"🔵", pct: 100 };
}

function NutrientCard({ label, value, unit, optimal, icon }) {
  const s = nutrientStatus(value, optimal);
  return (
    <div style={{
      background:"var(--card-bg,#fff)", border:"1px solid var(--border)",
      borderRadius:12, padding:"14px 12px", borderTop:`3px solid ${s.color}`
    }}>
      <div style={{ fontSize:20, marginBottom:4 }}>{icon}</div>
      <div style={{ fontSize:11, color:"var(--text-muted)", marginBottom:2 }}>{label}</div>
      <div style={{ fontSize:20, fontWeight:800, color:"var(--text-primary)" }}>{value}{unit}</div>
      <div style={{ background:"#eee", borderRadius:4, height:5, margin:"8px 0 6px" }}>
        <div style={{ width:`${s.pct}%`, background:s.color, height:5, borderRadius:4, transition:"width 0.6s" }} />
      </div>
      <div style={{ fontSize:11, color:s.color, fontWeight:700 }}>{s.icon} {s.label}</div>
    </div>
  );
}

export default function Fertilizer() {
  const { lang, user } = useApp();
  const [cropKey, setCropKey]   = useState("");
  const [otherCrop, setOtherCrop] = useState("");
  const [farmData, setFarmData] = useState(null);
  const [loading, setLoading]   = useState(false);
  const [error, setError]       = useState("");

  /* ── i18n labels ──────────────────────────────────────── */
  const tx = {
    title:       lang==="ta"?"🧪 உர பரிந்துரை"            :lang==="hi"?"🧪 उर्वरक अनुशंसा"               :"🧪 Fertilizer Recommendation",
    sub:         lang==="ta"?"உங்கள் பண்ணை தரவின் படி உண்மையான AI பரிந்துரை"
                            :lang==="hi"?"आपके खेत के डेटा पर आधारित वास्तविक AI सुझाव"
                            :"Real-time AI recommendation based on your farm data",
    selectCrop:  lang==="ta"?"🌾 பயிர் தேர்ந்தெடுக்கவும்"  :lang==="hi"?"🌾 फसल चुनें"                   :"🌾 Select Crop",
    placeholder: lang==="ta"?"பயிர் தேர்ந்தெடு"            :lang==="hi"?"फसल चुनें"                       :"Select a crop",
    recFor:      lang==="ta"?"பரிந்துரை"                    :lang==="hi"?"अनुशंसा"                          :"Recommendation",
    baseDose:    lang==="ta"?"அடிப்படை அளவு"                :lang==="hi"?"आधार खुराक"                       :"Base Dose",
    adjDose:     lang==="ta"?"சரிசெய்யப்பட்ட அளவு"          :lang==="hi"?"समायोजित खुराक"                   :"Adjusted Dose (Your Soil)",
    whyAdj:      lang==="ta"?"உங்கள் மண் NPK அளவு கழிக்கப்பட்டது"
                            :lang==="hi"?"आपकी मिट्टी का NPK घटाया गया है"
                            :"Deducted based on your soil NPK levels",
    soilStatus:  lang==="ta"?"🌱 உங்கள் மண் நிலை (Soil Analysis இலிருந்து)"
                            :lang==="hi"?"🌱 आपकी मिट्टी की स्थिति (Soil Analysis से)"
                            :"🌱 Your Soil Status (from Soil Analysis)",
    noSoilData:  lang==="ta"?"Soil Analysis செய்யவில்லை — பண்ணை தரவு மட்டும் காட்டப்படுகிறது"
                            :lang==="hi"?"Soil Analysis नहीं हुआ — सिर्फ खेत डेटा दिखाया जा रहा है"
                            :"No Soil Analysis done — showing farm data only",
    fields:      lang==="ta"?"📍 உங்கள் வயல்கள்"            :lang==="hi"?"📍 आपके खेत"                     :"📍 Your Fields",
    recentAct:   lang==="ta"?"📋 சமீபத்திய செயல்கள்"        :lang==="hi"?"📋 हाल की गतिविधियाँ"            :"📋 Recent Farm Activities",
    noFields:    lang==="ta"?"வயல் தரவு இல்லை"               :lang==="hi"?"खेत डेटा नहीं"                   :"No fields added yet",
    noHistory:   lang==="ta"?"வரலாறு இல்லை"                  :lang==="hi"?"कोई इतिहास नहीं"                 :"No recent activities",
    login:       lang==="ta"?"உள்நுழைந்து உங்கள் தரவு பார்க்கவும்"
                            :lang==="hi"?"अपना डेटा देखने के लिए लॉगिन करें"
                            :"Login to see your farm data",
    loading:     lang==="ta"?"தரவு ஏற்றுகிறது..."             :lang==="hi"?"डेटा लोड हो रहा है..."           :"Loading your farm data...",
    npk:         lang==="ta"?"NPK உரம்"                      :lang==="hi"?"NPK उर्वरक"                      :"NPK Fertilizer",
    rate:        lang==="ta"?"பயன்பாட்டு அளவு"               :lang==="hi"?"उपयोग दर"                        :"Application Rate",
    time:        lang==="ta"?"பயன்பாட்டு நேரம்"              :lang==="hi"?"उपयोग का समय"                    :"Application Time",
    mix:         lang==="ta"?"கலக்கும் முறை"                  :lang==="hi"?"मिश्रण विधि"                     :"Mixing Instructions",
    benefit:     lang==="ta"?"நன்மைகள்"                      :lang==="hi"?"लाभ"                              :"Benefits",
    precaution:  lang==="ta"?"முன்னெச்சரிக்கை"                :lang==="hi"?"सावधानियां"                       :"Precautions",
    enterCrop:   lang==="ta"?"பயிர் பெயர் உள்ளிடு"            :lang==="hi"?"फसल नाम दर्ज करें"               :"Enter crop name",
    infoMsg:     lang==="ta"?"பரிந்துரை பெற பயிர் தேர்ந்தெடுங்கள்"
                            :lang==="hi"?"सुझाव के लिए फसल चुनें"
                            :"Select a crop to see recommendations",
    alerts:      lang==="ta"?"⚠️ எச்சரிக்கைகள்"               :lang==="hi"?"⚠️ अलर्ट"                        :"⚠️ Alerts",
    soilTip:     lang==="ta"?"💡 மண் வகை குறிப்பு"            :lang==="hi"?"💡 मिट्टी प्रकार सुझाव"           :"💡 Soil Type Tip",
    daysAgo:     lang==="ta"?"நாள் முன்"                      :lang==="hi"?"दिन पहले"                         :"days ago",
    activeCrops: lang==="ta"?"செயலில் உள்ள பயிர்கள்"          :lang==="hi"?"सक्रिय फसलें"                    :"Active Crops",
    nitrogen:    lang==="ta"?"நைட்ரஜன் (N)"    :lang==="hi"?"नाइट्रोजन (N)"   :"Nitrogen (N)",
    phosphorus:  lang==="ta"?"பாஸ்பரஸ் (P)"    :lang==="hi"?"फास्फोरस (P)"    :"Phosphorus (P)",
    potassium:   lang==="ta"?"பொட்டாசியம் (K)"  :lang==="hi"?"पोटेशियम (K)"   :"Potassium (K)",
    ph:          lang==="ta"?"pH அளவு"           :lang==="hi"?"pH स्तर"         :"pH Level",
    organic:     lang==="ta"?"கரிம பொருள்"       :lang==="hi"?"जैविक पदार्थ"    :"Organic Matter",
    noFertData:  lang==="ta"?"இன்னும் உர வரலாறு இல்லை":lang==="hi"?"उर्वरक इतिहास नहीं":"No fertilizer history yet",
  };

  /* ── Fetch farmer data on mount ──────────────────────── */
  useEffect(() => {
    if (!user) return;
    setLoading(true);
    getFertilizerData()
      .then(res => setFarmData(res.data))
      .catch(() => setError(lang==="ta"?"தரவு ஏற்ற முடியவில்லை":lang==="hi"?"डेटा लोड नहीं हुआ":"Could not load farm data"))
      .finally(() => setLoading(false));
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user]);

  const isOther = cropKey === "Other";
  const fert = cropKey && (!isOther || otherCrop.trim())
    ? (FERTILIZER_DATA[cropKey] || DEFAULT_FERT) : null;

  /* Adjusted dose from soil analysis */
  const activeCropRec = fert && farmData?.cropRecommendations?.find(
    r => r.crop?.toLowerCase() === cropKey.toLowerCase()
  );
  const adjDose = activeCropRec?.adjustedNPK || null;

  /* Display name */
  const cropDisplayName = (() => {
    if (isOther) return otherCrop.trim() || "Other";
    for (const g of CROP_GROUPS) {
      const f = g.crops.find(c => c.en === cropKey);
      if (f) return getCropName(f, lang);
    }
    return cropKey;
  })();

  return (
    <MainLayout>
      <div className="page-header">
        <h1>{tx.title}</h1>
        <p>{tx.sub}</p>
      </div>

      {/* ── NOT LOGGED IN ───────────────────────────────── */}
      {!user && (
        <div className="alert-box alert-box--info">
          <div className="alert-box__icon"><FaInfoCircle /></div>
          <div className="alert-box__msg">{tx.login}</div>
        </div>
      )}

      {/* ── LOADING ─────────────────────────────────────── */}
      {user && loading && (
        <div style={{ display:"flex", alignItems:"center", gap:10, color:"var(--text-muted)", padding:"20px 0" }}>
          <div className="spinner" style={{ width:20, height:20 }} /> {tx.loading}
        </div>
      )}

      {/* ── ERROR ───────────────────────────────────────── */}
      {error && (
        <div className="alert-box alert-box--warn">
          <div className="alert-box__icon"><FaExclamationTriangle /></div>
          <div className="alert-box__msg">{error}</div>
        </div>
      )}

      {/* ══════════════════════════════════════════════════
          FARM DATA PANELS (only when loaded)
      ══════════════════════════════════════════════════ */}
      {farmData && (
        <>
          {/* ── ALERTS ──────────────────────────────────── */}
          {farmData.alerts?.length > 0 && (
            <div style={{ marginBottom:20, display:"flex", flexDirection:"column", gap:8 }}>
              <div style={{ fontWeight:700, fontSize:14, marginBottom:4 }}>{tx.alerts}</div>
              {farmData.alerts.map((a, i) => (
                <div key={i} className={`alert-box alert-box--${a.type==="danger"?"error":a.type==="success"?"info":"warn"}`}>
                  <div className="alert-box__icon">
                    {a.type==="success" ? <FaCheckCircle /> : <FaExclamationTriangle />}
                  </div>
                  <div className="alert-box__msg">{a.msg}</div>
                </div>
              ))}
            </div>
          )}

          {/* ── SOIL STATUS from Soil Analysis ──────────── */}
          {farmData.hasSoilAnalysis ? (
            <div className="card-box" style={{ marginBottom:24, borderTop:"4px solid #2e7d32" }}>
              <h3 className="section-title" style={{ marginBottom:4 }}>{tx.soilStatus}</h3>
              {farmData.soilData?.soil_type && (
                <div style={{ fontSize:13, color:"var(--text-muted)", marginBottom:14 }}>
                  🪨 {farmData.soilData.soil_type}
                  {farmData.soilData.analyzed_on && (
                    <span style={{ marginLeft:10, opacity:0.7 }}>
                      · {new Date(farmData.soilData.analyzed_on).toLocaleDateString()}
                    </span>
                  )}
                </div>
              )}
              <div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fill, minmax(130px,1fr))", gap:12 }}>
                <NutrientCard label={tx.nitrogen}   value={farmData.soilData.nitrogen}   unit=" mg/kg" optimal={50}  icon="🌿" />
                <NutrientCard label={tx.phosphorus} value={farmData.soilData.phosphorus} unit=" mg/kg" optimal={35}  icon="⚡" />
                <NutrientCard label={tx.potassium}  value={farmData.soilData.potassium}  unit=" mg/kg" optimal={55}  icon="💪" />
                {farmData.soilData.ph && (
                  <NutrientCard label={tx.ph}       value={farmData.soilData.ph}         unit=""       optimal={6.8} icon="🧪" />
                )}
                {farmData.soilData.organic && (
                  <NutrientCard label={tx.organic}  value={farmData.soilData.organic}    unit="%"      optimal={3.5} icon="🌱" />
                )}
              </div>
              {farmData.phStatus && farmData.phStatus.color !== "success" && (
                <div style={{
                  marginTop:14, padding:"10px 14px", borderRadius:10,
                  background:"#fff3e0", border:"1px solid #ffb74d", fontSize:13, color:"#e65100"
                }}>
                  ⚗️ <strong>pH {farmData.soilData.ph}</strong> — {farmData.phStatus.action}
                </div>
              )}
              {farmData.soilTip && (
                <div style={{
                  marginTop:12, padding:"10px 14px", borderRadius:10,
                  background:"#e8f5e9", border:"1px solid #a5d6a7", fontSize:13, color:"#1b5e20"
                }}>
                  💡 {farmData.soilTip}
                </div>
              )}
            </div>
          ) : farmData.soilData ? (
            <div className="alert-box alert-box--info" style={{ marginBottom:20 }}>
              <div className="alert-box__icon"><FaInfoCircle /></div>
              <div className="alert-box__msg">
                {tx.noSoilData} — {farmData.soilData.soil_type && `Soil type: ${farmData.soilData.soil_type}`}
              </div>
            </div>
          ) : null}

          {/* ── YOUR FIELDS ─────────────────────────────── */}
          {farmData.fields?.length > 0 && (
            <div className="card-box" style={{ marginBottom:24 }}>
              <h3 className="section-title" style={{ marginBottom:12 }}>{tx.fields}</h3>
              <div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fill, minmax(160px,1fr))", gap:10 }}>
                {farmData.fields.map((f, i) => (
                  <div key={i} style={{
                    border:"1px solid var(--border)", borderRadius:10, padding:"10px 12px",
                    borderLeft:`4px solid ${f.health>=80?"#2e7d32":f.health>=60?"#f57c00":"#c62828"}`
                  }}>
                    <div style={{ fontWeight:700, fontSize:13 }}>{f.field_name}</div>
                    <div style={{ fontSize:12, color:"#2e7d32", margin:"2px 0" }}>🌾 {f.crop || "—"}</div>
                    <div style={{ fontSize:11, color:"var(--text-muted)" }}>
                      📐 {f.area} acres &nbsp;·&nbsp; ❤️ {f.health}%
                    </div>
                    {f.irrigation && <div style={{ fontSize:11, color:"var(--text-muted)" }}>💧 {f.irrigation}</div>}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* ── RECENT ACTIVITIES ───────────────────────── */}
          {farmData.recentHistory?.length > 0 && (
            <div className="card-box" style={{ marginBottom:24 }}>
              <h3 className="section-title" style={{ marginBottom:12 }}>
                <FaHistory style={{ marginRight:6, color:"#2e7d32" }} />{tx.recentAct}
              </h3>
              <div style={{ display:"flex", flexDirection:"column", gap:6 }}>
                {farmData.recentHistory.map((h, i) => (
                  <div key={i} style={{
                    display:"flex", justifyContent:"space-between", alignItems:"center",
                    padding:"8px 12px", background:"var(--bg-secondary,#f5f5f5)", borderRadius:8,
                    fontSize:13
                  }}>
                    <span>🌿 <strong>{h.label}</strong> — {h.field_key} &nbsp;
                      <span style={{ color:"var(--text-muted)" }}>{h.quantity} {h.unit_key?.replace("unit","")}</span>
                    </span>
                    <span style={{ fontSize:11, color:"var(--text-muted)" }}>{h.date?.slice(0,10)}</span>
                  </div>
                ))}
              </div>
              {farmData.daysSinceLastFert !== null && (
                <div style={{ fontSize:12, color:"var(--text-muted)", marginTop:10 }}>
                  🕐 Last fertilizer: {farmData.daysSinceLastFert} {tx.daysAgo}
                </div>
              )}
            </div>
          )}
        </>
      )}

      {/* ══════════════════════════════════════════════════
          CROP SELECTOR + RECOMMENDATION
      ══════════════════════════════════════════════════ */}
      <div className="card-box" style={{ maxWidth:600, marginBottom:24 }}>
        <label className="form-label" style={{ fontSize:14, fontWeight:700, display:"block", marginBottom:8 }}>
          <FaSeedling style={{ marginRight:6, color:"#2e7d32" }} />{tx.selectCrop}
        </label>
        <select className="form-input" value={cropKey}
          onChange={e => { setCropKey(e.target.value); setOtherCrop(""); }} style={{ fontSize:15 }}>
          <option value="">{tx.placeholder}</option>
          {CROP_GROUPS.map(g => (
            <optgroup key={g.group} label={lang==="ta"?g.groupTa:lang==="hi"?g.groupHi:g.group}>
              {g.crops.map(c => <option key={c.en} value={c.en}>{getCropName(c, lang)}</option>)}
            </optgroup>
          ))}
        </select>
        {isOther && (
          <input className="form-input" style={{ marginTop:12 }} type="text"
            placeholder={tx.enterCrop} value={otherCrop} onChange={e => setOtherCrop(e.target.value)} autoFocus />
        )}
      </div>

      {!cropKey && (
        <div className="alert-box alert-box--info">
          <div className="alert-box__icon"><FaInfoCircle /></div>
          <div className="alert-box__msg">{tx.infoMsg}</div>
        </div>
      )}

      {fert && (
        <div className="two-col" style={{ alignItems:"start" }}>
          {/* Left: NPK */}
          <div className="card-box" style={{ borderTop:"4px solid #2e7d32" }}>
            <h3 className="section-title"><span>🌱</span> {tx.recFor}: {cropDisplayName}</h3>

            {/* Base dose */}
            <div style={{ marginBottom:18 }}>
              <div className="form-label" style={{ marginBottom:4 }}>{tx.npk} — {tx.baseDose}</div>
              <div style={{ fontSize:22, fontWeight:800, color:"#2e7d32" }}>{fert.npk}</div>
            </div>

            {/* Adjusted dose (only if soil analysis available) */}
            {adjDose && (
              <div style={{
                background:"linear-gradient(135deg,#e8f5e9,#f1f8e9)",
                border:"1px solid #a5d6a7", borderRadius:12, padding:"14px 16px", marginBottom:18
              }}>
                <div style={{ fontSize:13, fontWeight:700, color:"#1b5e20", marginBottom:10 }}>
                  📊 {tx.adjDose}
                </div>
                <div style={{ display:"flex", gap:20, flexWrap:"wrap" }}>
                  {[["N", adjDose.N,"#2e7d32"],["P", adjDose.P,"#0277bd"],["K", adjDose.K,"#6a1b9a"]].map(([l,v,c]) => (
                    <div key={l} style={{ textAlign:"center" }}>
                      <div style={{ fontSize:11, color:"var(--text-muted)" }}>{l}</div>
                      <div style={{ fontSize:24, fontWeight:800, color:c }}>{v}</div>
                      <div style={{ fontSize:10, color:"var(--text-muted)" }}>kg/ha</div>
                    </div>
                  ))}
                </div>
                <div style={{ fontSize:11, color:"#558b2f", marginTop:8 }}>ℹ️ {tx.whyAdj}</div>
              </div>
            )}

            {/* Details rows */}
            {[
              { label:tx.rate, val:fert.rate[lang]||fert.rate.en },
              { label:tx.time, val:fert.time[lang]||fert.time.en },
              { label:tx.mix,  val:fert.mix[lang] ||fert.mix.en  },
            ].map((row, i) => (
              <div key={i} style={{ padding:"10px 0", borderBottom:"1px solid var(--border)" }}>
                <div style={{ fontSize:12, color:"var(--text-muted)", textTransform:"uppercase", letterSpacing:"0.5px", marginBottom:3 }}>{row.label}</div>
                <div style={{ fontSize:14, fontWeight:600, color:"var(--text-primary)" }}>{row.val}</div>
              </div>
            ))}
          </div>

          {/* Right: Benefits + Precautions */}
          <div style={{ display:"flex", flexDirection:"column", gap:16 }}>
            <div className="card-box" style={{ borderTop:"4px solid #0277bd" }}>
              <h3 className="section-title"><span>✅</span> {tx.benefit}</h3>
              <p style={{ fontSize:14, color:"var(--text-secondary)", lineHeight:1.7 }}>{fert.benefit[lang]||fert.benefit.en}</p>
            </div>
            <div className="card-box" style={{ borderTop:"4px solid #e65100" }}>
              <h3 className="section-title"><span>⚠️</span> {tx.precaution}</h3>
              <p style={{ fontSize:14, color:"var(--text-secondary)", lineHeight:1.7 }}>{fert.precaution[lang]||fert.precaution.en}</p>
            </div>
          </div>
        </div>
      )}
    </MainLayout>
  );
}
