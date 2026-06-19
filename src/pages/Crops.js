import { useState, useEffect } from "react";
import { FaCheckCircle, FaSync } from "react-icons/fa";
import MainLayout from "../layouts/MainLayout";
import { useApp } from "../context/AppContext";
import { getCropRecommendation, getLatestSensors, getSoilHistory } from "../api/api";
import { useNavigate } from "react-router-dom";
import NextStepCard from "../components/NextStepCard";
import SmartFlowPanel from "../components/SmartFlowPanel";
import "../styles/global.css";
import "../styles/Crops.css";
import "../styles/SmartFlowPanel.css";
import "../styles/NextStepCard.css";

const CROP_META = {
  Rice:       { icon:"🌾", color:"#2e7d32" },
  Wheat:      { icon:"🌿", color:"#f57c00" },
  Cotton:     { icon:"🌸", color:"#6a1b9a" },
  Maize:      { icon:"🌽", color:"#f9a825" },
  Sugarcane:  { icon:"🎋", color:"#1565c0" },
  Vegetables: { icon:"🥬", color:"#00695c" },
  Soybean:    { icon:"🫘", color:"#558b2f" },
  Pulses:     { icon:"🫘", color:"#4e342e" },
};

const CROP_NPK = {
  Rice:       { N:90,  P:60, K:40  },
  Wheat:      { N:60,  P:30, K:30  },
  Cotton:     { N:60,  P:30, K:60  },
  Maize:      { N:80,  P:50, K:30  },
  Sugarcane:  { N:120, P:60, K:120 },
  Vegetables: { N:80,  P:40, K:40  },
  Soybean:    { N:25,  P:60, K:40  },
  Pulses:     { N:20,  P:60, K:20  },
};

function NutrientBar({ label, value, unit, max = 150, color }) {
  return (
    <div style={{ marginBottom:10 }}>
      <div style={{ display:"flex", justifyContent:"space-between", fontSize:13, marginBottom:4 }}>
        <span style={{ color:"var(--text-secondary)", fontWeight:500 }}>{label}</span>
        <span style={{ color, fontWeight:700 }}>{value} {unit}</span>
      </div>
      <div className="progress-bar-wrap">
        <div className="progress-bar-fill"
          style={{ width:`${Math.min((value/max)*100,100)}%`, background:color }} />
      </div>
    </div>
  );
}

export default function Crops() {
  const { lang, user, setSharedCropRec, markFlowStep, sharedSoilResult } = useApp();
  const navigate = useNavigate();

  const [crops,      setCrops]      = useState([]);
  const [sensors,    setSensors]    = useState(null);
  const [soilData,   setSoilData]   = useState(null);
  const [selected,   setSelected]   = useState(null);
  const [loading,    setLoading]    = useState(true);
  const [error,      setError]      = useState("");
  const [lastUpdate, setLastUpdate] = useState(null);

  const tx = {
    title:      lang==="ta"?"பயிர் பரிந்துரை"  :lang==="hi"?"फसल सिफारिश"       :"Crop Recommendations",
    sub:        lang==="ta"?"உங்கள் மண் + சென்சார் தரவை வைத்து உகந்த பயிர்கள்"
                           :lang==="hi"?"मिट्टी + सेंसर डेटा के आधार पर सर्वोत्तम फसल सुझाव"
                           :"Smart crop suggestions based on your live soil & sensor data",
    match:      lang==="ta"?"பொருத்தம்"         :lang==="hi"?"मिलान"              :"Match",
    refresh:    lang==="ta"?"புதுப்பி"          :lang==="hi"?"रिफ्रेश"            :"Refresh",
    loading:    lang==="ta"?"ஏற்றுகிறது..."     :lang==="hi"?"लोड हो रहा है..."   :"Loading...",
    noData:     lang==="ta"?"பயிர் பரிந்துரை இல்லை":lang==="hi"?"कोई फसल सुझाव नहीं":"No crop recommendations yet",
    liveFrom:   lang==="ta"?"நேரடி சென்சார் தரவிலிருந்து":lang==="hi"?"लाइव सेंसर डेटा से":"Live from sensor data",
    simulated:  lang==="ta"?"தரவு கணிக்கப்பட்டது (சென்சார் இல்லை)"
                           :lang==="hi"?"डेटा सिम्युलेट किया (सेंसर नहीं)"
                           :"Data simulated (no real sensor connected)",
    soilSummary:lang==="ta"?"மண் நிலை சுருக்கம்":lang==="hi"?"मिट्टी स्थिति सारांश":"Soil Status Summary",
    whyCrop:    lang==="ta"?"ஏன் இந்த பயிர்?"   :lang==="hi"?"यह फसल क्यों?"      :"Why This Crop?",
    recFert:    lang==="ta"?"பரிந்துரைக்கப்பட்ட உரம்":lang==="hi"?"अनुशंसित उर्वरक":"Recommended Fertilizer (kg/ha)",
    goToFert:   lang==="ta"?"→ உர பக்கம்"        :lang==="hi"?"→ उर्वरक पृष्ठ"    :"→ Fertilizer Plan",
    goToIrrig:  lang==="ta"?"→ நீர்ப்பாசனம்"     :lang==="hi"?"→ सिंचाई सलाहकार" :"→ Irrigation Advisor",
    goToSoil:   lang==="ta"?"→ மண் பரிசோதனை"    :lang==="hi"?"→ मिट्टी विश्लेषण":"→ Soil Analysis",
    soilSource: lang==="ta"?"மண் பரிசோதனை முடிவு":lang==="hi"?"मिट्टी जांच":"From soil analysis",
    overallScore:lang==="ta"?"ஒட்டுமொத்த மண் நிலை":lang==="hi"?"समग्र मिट्टी स्थिति":"Overall Soil Score",
  };

  const loadAll = async () => {
    if (!user) return;
    setLoading(true); setError("");
    try {
      const [cropRes, sensorRes, soilRes] = await Promise.allSettled([
        getCropRecommendation(),
        getLatestSensors(),
        getSoilHistory(),
      ]);
      if (cropRes.status === "fulfilled" && cropRes.value.data?.recommendations?.length > 0) {
        const recs = cropRes.value.data.recommendations;
        setCrops(recs);
        setSelected(recs[0]);
        // Save to shared context — Irrigation & Disease pages will use this
        setSharedCropRec(recs);
        markFlowStep("cropsDone");
      }
      if (sensorRes.status === "fulfilled" && sensorRes.value.data?.length > 0) {
        const sd = sensorRes.value.data;
        const avg = (key) => sd.reduce((s, r) => s + (r[key] || 0), 0) / sd.length;
        setSensors({
          temperature:   +avg("temperature").toFixed(1),
          humidity:      +avg("humidity").toFixed(1),
          soil_moisture: +avg("soil_moisture").toFixed(1),
          ph_level:      +avg("ph_level").toFixed(2),
          nitrogen:      +avg("nitrogen").toFixed(1),
          phosphorus:    +avg("phosphorus").toFixed(1),
          potassium:     +avg("potassium").toFixed(1),
          simulated:     sd[0]?.simulated || false,
        });
      }
      if (soilRes.status === "fulfilled" && soilRes.value.data?.length > 0) {
        setSoilData(soilRes.value.data[0]);
      }
      setLastUpdate(new Date());
    } catch {
      setError(lang==="ta"?"தரவு ஏற்ற முடியவில்லை":lang==="hi"?"डेटा लोड नहीं हो सका":"Could not load data");
    } finally { setLoading(false); }
  };

  useEffect(() => { loadAll(); }, [user]);

  const getNPK  = (name) => CROP_NPK[name]  || { N:60, P:30, K:30 };
  const getMeta = (name) => CROP_META[name] || { icon:"🌱", color:"#2e7d32" };

  const soilRows = sensors ? [
    { label: lang==="ta"?"pH அளவு":lang==="hi"?"pH स्तर":"pH Level",
      value: `${soilData?.ph_typical ?? sensors.ph_level}`,
      ok: sensors.ph_level >= 6 && sensors.ph_level <= 7.5,
      status: sensors.ph_level >= 6 && sensors.ph_level <= 7.5
        ? (lang==="ta"?"சரியான அளவு":lang==="hi"?"सामान्य":"Optimal")
        : (lang==="ta"?"கவனி":lang==="hi"?"ध्यान दें":"Check") },
    { label: lang==="ta"?"நைட்ரஜன் (N)":lang==="hi"?"नाइट्रोजन (N)":"Nitrogen (N)",
      value: `${soilData?.nitrogen ?? sensors.nitrogen} mg/kg`,
      ok: (soilData?.nitrogen ?? sensors.nitrogen) >= 35,
      status: (soilData?.nitrogen ?? sensors.nitrogen) >= 35
        ? (lang==="ta"?"போதுமானது":lang==="hi"?"पर्याप्त":"Adequate")
        : (lang==="ta"?"குறைவு":lang==="hi"?"कम":"Low") },
    { label: lang==="ta"?"பாஸ்பரஸ் (P)":lang==="hi"?"फास्फोरस (P)":"Phosphorus (P)",
      value: `${soilData?.phosphorus ?? sensors.phosphorus} mg/kg`,
      ok: (soilData?.phosphorus ?? sensors.phosphorus) >= 20,
      status: (soilData?.phosphorus ?? sensors.phosphorus) >= 20
        ? (lang==="ta"?"போதுமானது":lang==="hi"?"पर्याप्त":"Adequate")
        : (lang==="ta"?"குறைவு":lang==="hi"?"कम":"Low") },
    { label: lang==="ta"?"பொட்டாசியம் (K)":lang==="hi"?"पोटेशियम (K)":"Potassium (K)",
      value: `${soilData?.potassium ?? sensors.potassium} mg/kg`,
      ok: true,
      status: lang==="ta"?"சரியான அளவு":lang==="hi"?"सामान्य":"Normal" },
    { label: lang==="ta"?"மண் ஈரப்பதம்":lang==="hi"?"मिट्टी की नमी":"Soil Moisture",
      value: `${sensors.soil_moisture}%`,
      ok: sensors.soil_moisture >= 50,
      status: sensors.soil_moisture >= 50
        ? (lang==="ta"?"நல்லது":lang==="hi"?"अच्छा":"Good")
        : (lang==="ta"?"குறைவு":lang==="hi"?"कम":"Low") },
    { label: lang==="ta"?"வெப்பநிலை":lang==="hi"?"तापमान":"Temperature",
      value: `${sensors.temperature}°C`,
      ok: sensors.temperature >= 25 && sensors.temperature <= 35,
      status: sensors.temperature >= 25 && sensors.temperature <= 35
        ? (lang==="ta"?"சரியான வரம்பு":lang==="hi"?"उचित रेंज":"Optimal Range")
        : (lang==="ta"?"கவனி":lang==="hi"?"ध्यान दें":"Check") },
  ] : [];

  const soilScore = soilRows.length
    ? Math.round((soilRows.filter(r => r.ok).length / soilRows.length) * 100)
    : null;

  return (
    <MainLayout>
      <div className="page-header" style={{ display:"flex", justifyContent:"space-between", alignItems:"flex-start", flexWrap:"wrap", gap:12 }}>
        <div>
          <h1>🌾 {tx.title}</h1>
          <p>{tx.sub}</p>
        </div>
        <button className="btn-outline-ag btn-sm" onClick={loadAll} disabled={loading}
          style={{ display:"flex", alignItems:"center", gap:6 }}>
          <FaSync /> {loading ? tx.loading : tx.refresh}
        </button>
      </div>

      {error && <div className="alert-box alert-box--warning" style={{ marginBottom:16 }}>
        <div className="alert-box__icon">⚠️</div><div className="alert-box__msg">{error}</div>
      </div>}

      {sensors && (
        <div style={{ marginBottom:16, fontSize:12, color:"var(--text-muted)", display:"flex", alignItems:"center", gap:8, flexWrap:"wrap" }}>
          <span style={{ width:8, height:8, borderRadius:"50%",
            background: sensors.simulated ? "#f57c00" : "#2e7d32", display:"inline-block" }}/>
          {sensors.simulated ? tx.simulated : tx.liveFrom}
          {lastUpdate && ` · ${lastUpdate.toLocaleTimeString("en-IN")}`}
          {soilData && <span style={{ marginLeft:8 }}>
            🧪 {tx.soilSource}: <strong>{soilData.soil_type}</strong>
            {" "}({new Date(soilData.created_at).toLocaleDateString("en-IN")})
          </span>}
        </div>
      )}

      {loading && (
        <div style={{ textAlign:"center", padding:40, color:"var(--text-muted)" }}>
          <div className="spinner" style={{ width:32, height:32, margin:"0 auto 12px" }} />
          {tx.loading}
        </div>
      )}

      {!loading && crops.length > 0 && (
        <>
          <div className="crop-cards-row">
            {crops.map((crop, i) => {
              const meta = getMeta(crop.crop);
              return (
                <button key={i}
                  className={`crop-selector-card ${selected?.crop===crop.crop?"crop-selector-card--active":""}`}
                  onClick={() => setSelected(crop)}
                  style={selected?.crop===crop.crop ? { borderColor:meta.color, background:meta.color+"0e" } : {}}>
                  <span className="crop-selector-card__icon">{meta.icon}</span>
                  <div>
                    <div className="crop-selector-card__name">{crop.crop}</div>
                    <div className="crop-selector-card__conf" style={{ color:meta.color }}>
                      {crop.confidence}% {tx.match}
                    </div>
                  </div>
                  {selected?.crop === crop.crop &&
                    <FaCheckCircle style={{ color:meta.color, marginLeft:"auto" }} />}
                </button>
              );
            })}
          </div>

          {selected && (() => {
            const meta = getMeta(selected.crop);
            const npk  = getNPK(selected.crop);
            return (
              <div className="two-col" style={{ marginBottom:24 }}>
                <div className="card-box crop-detail-card" style={{ borderTop:`4px solid ${meta.color}` }}>
                  <div className="crop-detail-card__header">
                    <span className="crop-detail-card__emoji">{meta.icon}</span>
                    <div><h2 className="crop-detail-card__name">{selected.crop}</h2></div>
                    <div className="crop-confidence" style={{ background:meta.color+"18", color:meta.color }}>
                      {selected.confidence}%<br /><span style={{ fontSize:11 }}>{tx.match}</span>
                    </div>
                  </div>
                  <div className="crop-reason">
                    <div className="crop-reason__title">{tx.whyCrop}</div>
                    <p>{selected.reason}</p>
                  </div>
                  <div>
                    <div className="crop-reason__title" style={{ marginBottom:14 }}>{tx.recFert}</div>
                    <NutrientBar label={lang==="ta"?"நைட்ரஜன்":lang==="hi"?"नाइट्रोजन":"Nitrogen"}
                      value={npk.N} unit="kg/ha" color="#2e7d32" />
                    <NutrientBar label={lang==="ta"?"பாஸ்பரஸ்":lang==="hi"?"फास्फोरस":"Phosphorus"}
                      value={npk.P} unit="kg/ha" color="#0277bd" />
                    <NutrientBar label={lang==="ta"?"பொட்டாசியம்":lang==="hi"?"पोटेशियम":"Potassium"}
                      value={npk.K} unit="kg/ha" color="#e65100" />
                  </div>
                  <div style={{ display:"flex", gap:8, marginTop:20, flexWrap:"wrap" }}>
                    <button className="btn-outline-ag btn-sm" onClick={() => navigate("/fertilizer")} style={{ fontSize:12 }}>
                      🌿 {tx.goToFert}
                    </button>
                    <button className="btn-outline-ag btn-sm" onClick={() => navigate("/irrigation")} style={{ fontSize:12 }}>
                      💧 {tx.goToIrrig}
                    </button>
                    {!soilData && (
                      <button className="btn-outline-ag btn-sm" onClick={() => navigate("/soil")} style={{ fontSize:12 }}>
                        🧪 {tx.goToSoil}
                      </button>
                    )}
                  </div>
                </div>

                <div className="card-box">
                  <h3 className="section-title">
                    <span>🧪</span> {tx.soilSummary}
                    {soilData && <span style={{ fontSize:11, marginLeft:8, color:"#2e7d32", fontWeight:400 }}>
                      ({tx.soilSource})
                    </span>}
                  </h3>
                  <div className="soil-summary-list">
                    {soilRows.map((s,i) => (
                      <div className="soil-summary-item" key={i}>
                        <div className="soil-summary-item__left">
                          <span className="soil-summary-item__label">{s.label}</span>
                          <span className="soil-summary-item__value">{s.value}</span>
                        </div>
                        <div style={{ display:"flex", alignItems:"center", gap:6 }}>
                          <span style={{ fontSize:12, color:s.ok?"#2e7d32":"#c62828" }}>{s.status}</span>
                          <FaCheckCircle style={{ color:s.ok?"#2e7d32":"#c62828", fontSize:14 }} />
                        </div>
                      </div>
                    ))}
                  </div>
                  {soilScore !== null && (
                    <div style={{ marginTop:20, padding:16, background:"var(--primary-pale)", borderRadius:12 }}>
                      <div style={{ fontSize:13, fontWeight:700, color:"#2e7d32", marginBottom:6 }}>
                        ✅ {tx.overallScore}: {soilScore}/100
                      </div>
                      <div style={{ fontSize:13, color:"var(--text-secondary)" }}>
                        {soilScore >= 80
                          ? (lang==="ta"?"மண் சிறந்த நிலையில்":lang==="hi"?"मिट्टी उत्कृष्ट है":"Soil is in excellent condition.")
                          : soilScore >= 60
                          ? (lang==="ta"?"மண் நல்ல நிலையில்":lang==="hi"?"मिट्टी अच्छी है":"Soil is in good condition.")
                          : (lang==="ta"?"மண் மேம்பாடு தேவை":lang==="hi"?"मिट्टी में सुधार जरूरी":"Soil needs improvement.")}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            );
          })()}
        </>
      )}

      {!loading && crops.length === 0 && !error && (
        <div style={{ textAlign:"center", padding:"48px 24px", color:"var(--text-muted)" }}>
          <div style={{ fontSize:48, marginBottom:12 }}>🌱</div>
          <div style={{ fontSize:16, fontWeight:700, marginBottom:8 }}>{tx.noData}</div>
          <button className="btn-primary-ag" style={{ marginTop:12 }} onClick={() => navigate("/soil")}>
            🧪 {tx.goToSoil}
          </button>
        </div>
      )}

      {/* Smart Flow: Next Step — go to Irrigation + Fertilizer */}
      <NextStepCard
        currentStep="cropsDone"
        extraActions={[
          { icon:"🌱", label: tx.goToFert, onClick: () => navigate("/fertilizer") },
        ]}
      />
    </MainLayout>
  );
}
