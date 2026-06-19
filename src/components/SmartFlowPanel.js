/**
 * SmartFlowPanel.js
 * ─────────────────────────────────────────────────────────────
 * The "Connect" layer — shows real-time status of the full flow:
 * Farm Details → Weather → Soil → Crops → Irrigation+Fertilizer
 *               → Disease Detection → Community
 *
 * Displays:
 *  • Step-by-step progress bar with ✅ / 🔄 status
 *  • Smart next-action card: what to do now based on current data
 *  • Cross-feature data summary (soil NPK → crop rec → motor status)
 *  • Sensor-triggered alerts (low moisture → irrigate)
 *
 * Usage: <SmartFlowPanel /> on Dashboard or any page
 * ─────────────────────────────────────────────────────────────
 */

import { useNavigate } from "react-router-dom";
import { useApp } from "../context/AppContext";
import "../styles/SmartFlowPanel.css";

/* ── Flow steps definition ─────────────────────────────── */
const FLOW_STEPS = [
  {
    key:   "farmDetails",
    icon:  "🏡",
    path:  "/farm",
    label: { en:"Farm Details",       ta:"பண்ணை விவரங்கள்",    hi:"खेत विवरण" },
    desc:  { en:"Set farm name, soil type, crops",
             ta:"பண்ணை பெயர், மண் வகை, பயிர் அமைக்கவும்",
             hi:"खेत का नाम, मिट्टी का प्रकार सेट करें" },
  },
  {
    key:   "weatherSet",
    icon:  "🌦️",
    path:  "/irrigation",
    label: { en:"Weather & Location",  ta:"வானிலை & இடம்",       hi:"मौसम और स्थान" },
    desc:  { en:"Set your farm's GPS location for live weather",
             ta:"நேரடி வானிலைக்கு GPS இடம் அமைக்கவும்",
             hi:"लाइव मौसम के लिए GPS लोकेशन सेट करें" },
  },
  {
    key:   "soilDone",
    icon:  "🧪",
    path:  "/soil",
    label: { en:"Soil Analysis",       ta:"மண் பகுப்பாய்வு",     hi:"मिट्टी विश्लेषण" },
    desc:  { en:"Upload soil photo to get NPK, pH analysis",
             ta:"NPK, pH பெற மண் படம் பதிவேற்றவும்",
             hi:"NPK, pH के लिए मिट्टी फोटो अपलोड करें" },
  },
  {
    key:   "cropsDone",
    icon:  "🌱",
    path:  "/crops",
    label: { en:"Crop Recommendation", ta:"பயிர் பரிந்துரை",     hi:"फसल सिफारिश" },
    desc:  { en:"Get AI crop suggestions from your soil + sensor data",
             ta:"மண் + சென்சார் தரவிலிருந்து AI பயிர் பரிந்துரை",
             hi:"मिट्टी + सेंसर से AI फसल सुझाव पाएं" },
  },
  {
    key:   "irrigationDone",
    icon:  "💧",
    path:  "/irrigation",
    label: { en:"Irrigation + Fertilizer", ta:"நீர்ப்பாசனம் + உரம்", hi:"सिंचाई + उर्वरक" },
    desc:  { en:"Weather-based motor control and fertilizer plan",
             ta:"வானிலை அடிப்படையில் மோட்டார் & உர திட்டம்",
             hi:"मौसम आधारित मोटर नियंत्रण और उर्वरक योजना" },
  },
  {
    key:   "diseaseDone",
    icon:  "🔬",
    path:  "/disease",
    label: { en:"Disease Detection",   ta:"நோய் கண்டறிதல்",     hi:"रोग पहचान" },
    desc:  { en:"Upload crop photo to detect disease and get treatment",
             ta:"நோய் கண்டறிய பயிர் படம் பதிவேற்றவும்",
             hi:"रोग पहचान के लिए फसल फोटो अपलोड करें" },
  },
  {
    key:   "communityDone",
    icon:  "👥",
    path:  "/community",
    label: { en:"Farmer Community",    ta:"விவசாயி சமூகம்",      hi:"किसान समुदाय" },
    desc:  { en:"Share your results with the farming community",
             ta:"உங்கள் முடிவுகளை சமூகத்துடன் பகிரவும்",
             hi:"अपने परिणाम किसान समुदाय से साझा करें" },
  },
];

/* ── Helper to pick language ────────────────────────────── */
function L(obj, lang) {
  return obj[lang] || obj.en;
}

export default function SmartFlowPanel({ compact = false }) {
  const navigate = useNavigate();
  const {
    lang, flowStatus, markFlowStep,
    sharedSoilResult, sharedCropRec,
    sharedSensorData, sharedWeather,
    sharedDiseaseResult, irrigationAlert,
    resetFlow,
  } = useApp();

  const completedCount = Object.values(flowStatus).filter(Boolean).length;
  const totalSteps     = FLOW_STEPS.length;
  const progressPct    = Math.round((completedCount / totalSteps) * 100);

  // Find the next incomplete step
  const nextStep = FLOW_STEPS.find(s => !flowStatus[s.key]);

  // Smart alert based on live sensor data
  const smartAlerts = [];
  if (irrigationAlert) {
    smartAlerts.push({
      type:  "warning",
      icon:  "💧",
      msg: lang === "ta"
        ? `மண் ஈரப்பதம் ${irrigationAlert.value.toFixed(0)}% — நீர்ப்பாசனம் தேவை!`
        : lang === "hi"
        ? `मिट्टी की नमी ${irrigationAlert.value.toFixed(0)}% — सिंचाई करें!`
        : `Soil moisture at ${irrigationAlert.value.toFixed(0)}% — Irrigation needed!`,
      action: () => navigate("/irrigation"),
      actionLabel: lang === "ta" ? "நீர்ப்பாசனம்" : lang === "hi" ? "सिंचाई करें" : "Irrigate Now",
    });
  }
  if (sharedSensorData && parseFloat(sharedSensorData.ph_level) < 5.8) {
    smartAlerts.push({
      type:  "danger",
      icon:  "⚗️",
      msg: lang === "ta"
        ? `மண் pH ${sharedSensorData.ph_level} — அமிலமாக உள்ளது. சுண்ணாம்பு சேர்க்கவும்!`
        : lang === "hi"
        ? `मिट्टी pH ${sharedSensorData.ph_level} — बहुत अम्लीय। चूना डालें!`
        : `Soil pH ${sharedSensorData.ph_level} — Very acidic! Add lime.`,
      action: () => navigate("/soil"),
      actionLabel: lang === "ta" ? "மண் பரிசோதனை" : lang === "hi" ? "मिट्टी जांचें" : "Check Soil",
    });
  }
  if (sharedWeather?.rainExpected) {
    smartAlerts.push({
      type:  "info",
      icon:  "🌧️",
      msg: lang === "ta"
        ? `மழை எதிர்பார்க்கப்படுகிறது (${sharedWeather.totalRainMm}mm). மோட்டார் OFF பண்ணவும்.`
        : lang === "hi"
        ? `बारिश की संभावना (${sharedWeather.totalRainMm}mm). मोटर बंद करें।`
        : `Rain expected (${sharedWeather.totalRainMm}mm). Consider turning motor OFF.`,
      action: () => navigate("/irrigation"),
      actionLabel: lang === "ta" ? "மோட்டார் நிர்வாகம்" : lang === "hi" ? "मोटर प्रबंधन" : "Motor Control",
    });
  }
  if (sharedDiseaseResult && sharedDiseaseResult.severity === "high") {
    smartAlerts.push({
      type:  "danger",
      icon:  "⚠️",
      msg: lang === "ta"
        ? `கடுமையான நோய் கண்டறியப்பட்டது: ${sharedDiseaseResult.disease}. சமூகத்தில் பகிரவும்.`
        : lang === "hi"
        ? `गंभीर रोग मिला: ${sharedDiseaseResult.disease}. समुदाय में साझा करें।`
        : `High severity disease detected: ${sharedDiseaseResult.disease}. Share with community.`,
      action: () => navigate("/community"),
      actionLabel: lang === "ta" ? "பகிர்" : lang === "hi" ? "साझा करें" : "Share",
    });
  }

  const labels = {
    title:     lang === "ta" ? "🌾 ஸ்மார்ட் பண்ணை வழிகாட்டி"     : lang === "hi" ? "🌾 स्मार्ट फार्म गाइड"     : "🌾 Smart Farm Flow",
    progress:  lang === "ta" ? "முன்னேற்றம்"                          : lang === "hi" ? "प्रगति"                   : "Progress",
    nextStep:  lang === "ta" ? "அடுத்த படி"                           : lang === "hi" ? "अगला कदम"                 : "Next Step",
    complete:  lang === "ta" ? "✅ அனைத்து படிகளும் முடிந்தன!"       : lang === "hi" ? "✅ सभी चरण पूरे हो गए!"   : "✅ All steps complete!",
    newSeason: lang === "ta" ? "புதிய சீசன் தொடங்கு"                 : lang === "hi" ? "नया सत्र शुरू करें"       : "Start New Season",
    start:     lang === "ta" ? "தொடங்கவும்"                           : lang === "hi" ? "शुरू करें"                : "Start",
    alerts:    lang === "ta" ? "நேரடி எச்சரிக்கைகள்"                 : lang === "hi" ? "लाइव अलर्ट"              : "Live Alerts",
    steps:     lang === "ta" ? "படிகள்"                               : lang === "hi" ? "चरण"                      : "Steps",
    done:      lang === "ta" ? "முடிந்தது"                            : lang === "hi" ? "पूरा"                     : "done",
    of:        lang === "ta" ? "இல்"                                  : lang === "hi" ? "में से"                   : "of",
    soilInfo:  lang === "ta" ? "மண் தரவு"                             : lang === "hi" ? "मिट्टी डेटा"             : "Soil Data",
    cropInfo:  lang === "ta" ? "பயிர் பரிந்துரை"                      : lang === "hi" ? "फसल सिफारिश"             : "Crop Rec",
  };

  if (compact) {
    // Compact version for sidebar / top banner
    return (
      <div className="sfp-compact">
        <div className="sfp-compact__progress">
          <div className="sfp-compact__bar">
            <div className="sfp-compact__fill" style={{ width: `${progressPct}%` }} />
          </div>
          <span className="sfp-compact__text">
            {completedCount} {labels.of} {totalSteps} {labels.done}
          </span>
        </div>
        {nextStep && (
          <button className="sfp-compact__next" onClick={() => navigate(nextStep.path)}>
            {nextStep.icon} {L(nextStep.label, lang)} →
          </button>
        )}
        {smartAlerts.length > 0 && (
          <div className={`sfp-compact__alert sfp-alert--${smartAlerts[0].type}`}
               onClick={smartAlerts[0].action}>
            {smartAlerts[0].icon} {smartAlerts[0].msg}
          </div>
        )}
      </div>
    );
  }

  // Full panel version
  return (
    <div className="sfp">
      {/* Header */}
      <div className="sfp__header">
        <h3 className="sfp__title">{labels.title}</h3>
        <div className="sfp__summary">
          <span className="sfp__badge">{completedCount}/{totalSteps} {labels.done}</span>
          {completedCount === totalSteps && (
            <button className="sfp__reset-btn" onClick={resetFlow}>{labels.newSeason}</button>
          )}
        </div>
      </div>

      {/* Progress bar */}
      <div className="sfp__progress-wrap">
        <div className="sfp__progress-bar">
          <div className="sfp__progress-fill" style={{ width: `${progressPct}%` }} />
        </div>
        <span className="sfp__pct">{progressPct}%</span>
      </div>

      {/* Smart Alerts */}
      {smartAlerts.length > 0 && (
        <div className="sfp__alerts">
          <div className="sfp__alerts-title">{labels.alerts}</div>
          {smartAlerts.map((a, i) => (
            <div key={i} className={`sfp__alert sfp-alert--${a.type}`}>
              <span>{a.icon} {a.msg}</span>
              <button className="sfp__alert-btn" onClick={a.action}>{a.actionLabel} →</button>
            </div>
          ))}
        </div>
      )}

      {/* Cross-feature data summary strip */}
      {(sharedSoilResult || sharedCropRec || sharedSensorData) && (
        <div className="sfp__data-strip">
          {sharedSoilResult && (
            <div className="sfp__data-chip sfp-chip--soil" onClick={() => navigate("/soil")}>
              🧪 <strong>{sharedSoilResult.soilType}</strong>
              {sharedSoilResult.profile && (
                <span> · pH {sharedSoilResult.profile.ph?.typical} · N{sharedSoilResult.profile.N}</span>
              )}
            </div>
          )}
          {sharedCropRec && sharedCropRec[0] && (
            <div className="sfp__data-chip sfp-chip--crop" onClick={() => navigate("/crops")}>
              🌱 <strong>{sharedCropRec[0].crop}</strong>
              <span> · {sharedCropRec[0].confidence}% match</span>
            </div>
          )}
          {sharedSensorData && (
            <div className="sfp__data-chip sfp-chip--sensor" onClick={() => navigate("/dashboard")}>
              📡 <strong>{parseFloat(sharedSensorData.soil_moisture || 0).toFixed(0)}%</strong>
              <span> moisture · {parseFloat(sharedSensorData.temperature || 0).toFixed(1)}°C</span>
            </div>
          )}
        </div>
      )}

      {/* Steps grid */}
      <div className="sfp__steps">
        {FLOW_STEPS.map((step, idx) => {
          const done    = flowStatus[step.key];
          const isCurrent = !done && FLOW_STEPS.slice(0, idx).every(s => flowStatus[s.key]);
          return (
            <div
              key={step.key}
              className={`sfp__step ${done ? "sfp__step--done" : isCurrent ? "sfp__step--current" : "sfp__step--pending"}`}
              onClick={() => navigate(step.path)}
            >
              <div className="sfp__step-icon">
                {done ? "✅" : step.icon}
              </div>
              <div className="sfp__step-body">
                <div className="sfp__step-label">{L(step.label, lang)}</div>
                <div className="sfp__step-desc">{L(step.desc, lang)}</div>
              </div>
              {isCurrent && (
                <div className="sfp__step-cta">
                  {labels.start} →
                </div>
              )}
            </div>
          );
        })}
      </div>

      {completedCount === totalSteps && (
        <div className="sfp__complete-banner">{labels.complete}</div>
      )}
    </div>
  );
}
