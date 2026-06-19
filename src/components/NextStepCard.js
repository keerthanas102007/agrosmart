/**
 * NextStepCard.js
 * ─────────────────────────────────────────────────────────────
 * Shows a context-aware "What to do next" action card at the
 * bottom of each feature page. Connects features together.
 *
 * Props:
 *   currentStep  — string key matching flow step: "farmDetails", "soilDone", etc.
 *   extraActions — optional additional buttons to show
 *
 * The card reads shared state (soilResult, cropRec, etc.) and
 * pre-fills relevant data in the next step's page via navigation state.
 * ─────────────────────────────────────────────────────────────
 */

import { useNavigate } from "react-router-dom";
import { useApp } from "../context/AppContext";

const NEXT_MAP = {
  farmDetails:    { next: "weatherSet",    path: "/irrigation" },
  weatherSet:     { next: "soilDone",      path: "/soil"       },
  soilDone:       { next: "cropsDone",     path: "/crops"      },
  cropsDone:      { next: "irrigationDone",path: "/irrigation" },
  irrigationDone: { next: "diseaseDone",   path: "/disease"    },
  diseaseDone:    { next: "communityDone", path: "/community"  },
  communityDone:  { next: null,            path: "/reports"    },
};

const STEP_META = {
  farmDetails:    { icon:"🌦️", label:{ en:"Set Farm Location for Weather", ta:"வானிலைக்கு இடம் அமைக்கவும்", hi:"मौसम के लिए स्थान सेट करें" } },
  weatherSet:     { icon:"🧪", label:{ en:"Analyze Your Soil",             ta:"உங்கள் மண்ணை பகுப்பாய்வு செய்யவும்", hi:"अपनी मिट्टी का विश्लेषण करें" } },
  soilDone:       { icon:"🌱", label:{ en:"See Crop Recommendations",      ta:"பயிர் பரிந்துரைகளைப் பார்க்கவும்", hi:"फसल सिफारिश देखें" },
    hint: { en:"Based on your soil analysis results", ta:"உங்கள் மண் பகுப்பாய்வு முடிவுகளின் அடிப்படையில்", hi:"आपके मिट्टी विश्लेषण के आधार पर" } },
  cropsDone:      { icon:"💧", label:{ en:"Plan Irrigation & Fertilizer",  ta:"நீர்ப்பாசனம் & உரம் திட்டமிடவும்", hi:"सिंचाई और उर्वरक योजना बनाएं" },
    hint: { en:"Use recommended crop to set optimal water schedule", ta:"சிறந்த நீர் அட்டவணைக்கு பரிந்துரைக்கப்பட்ட பயிர் பயன்படுத்தவும்", hi:"अनुशंसित फसल के लिए जल शेड्यूल सेट करें" } },
  irrigationDone: { icon:"🔬", label:{ en:"Check for Crop Diseases",       ta:"பயிர் நோய்களை சரிபார்க்கவும்", hi:"फसल रोग की जांच करें" },
    hint: { en:"Upload a photo of your crop for disease analysis", ta:"நோய் பகுப்பாய்வுக்கு பயிர் புகைப்படம் பதிவேற்றவும்", hi:"रोग विश्लेषण के लिए फसल की फोटो अपलोड करें" } },
  diseaseDone:    { icon:"👥", label:{ en:"Share with Farmer Community",   ta:"விவசாயி சமூகத்துடன் பகிரவும்", hi:"किसान समुदाय से साझा करें" },
    hint: { en:"Share your experience to help other farmers",       ta:"மற்ற விவசாயிகளுக்கு உதவ உங்கள் அனுபவத்தை பகிரவும்", hi:"अन्य किसानों की मदद के लिए अनुभव साझा करें" } },
  communityDone:  { icon:"📊", label:{ en:"View Reports & Analytics",      ta:"அறிக்கைகள் & பகுப்பாய்வு பார்க்கவும்", hi:"रिपोर्ट और विश्लेषण देखें" } },
};

function L(obj, lang) { return obj?.[lang] || obj?.en || ""; }

export default function NextStepCard({ currentStep, extraActions = [] }) {
  const navigate = useNavigate();
  const { lang, flowStatus, markFlowStep, sharedSoilResult, sharedCropRec, sharedDiseaseResult } = useApp();

  const nextInfo   = NEXT_MAP[currentStep];
  const stepMeta   = STEP_META[nextInfo?.next] || STEP_META[currentStep];
  const alreadyDone = nextInfo?.next && flowStatus[nextInfo.next];

  if (!nextInfo) return null;

  // Build nav state — pre-fill data for next page
  const buildNavState = () => {
    const state = { fromFlow: true };
    if (nextInfo.next === "cropsDone" && sharedSoilResult) {
      state.soilData = sharedSoilResult;
    }
    if (nextInfo.next === "irrigationDone" && sharedCropRec?.[0]) {
      state.recommendedCrop = sharedCropRec[0].crop;
    }
    if (nextInfo.next === "communityDone" && sharedDiseaseResult) {
      state.diseaseShare = sharedDiseaseResult;
    }
    return state;
  };

  const handleNext = () => {
    markFlowStep(currentStep);
    navigate(nextInfo.path, { state: buildNavState() });
  };

  const labels = {
    nextStepLabel: lang === "ta" ? "அடுத்த படி:" : lang === "hi" ? "अगला कदम:" : "Next Step:",
    goBtn:  lang === "ta" ? "தொடரவும்" : lang === "hi" ? "जारी रखें" : "Continue",
    orGo:   lang === "ta" ? "அல்லது செல்லவும்" : lang === "hi" ? "या जाएं" : "or go to",
    alreadyDoneLabel: lang === "ta" ? "✅ ஏற்கனவே முடிந்தது — மீண்டும் பார்க்கவும்" : lang === "hi" ? "✅ पहले से पूरा — फिर देखें" : "✅ Already done — review again",
  };

  return (
    <div className="nsc">
      <div className="nsc__inner">
        <div className="nsc__left">
          <div className="nsc__eyebrow">{labels.nextStepLabel}</div>
          <div className="nsc__title">
            <span className="nsc__icon">{stepMeta?.icon}</span>
            {L(stepMeta?.label, lang)}
          </div>
          {stepMeta?.hint && (
            <div className="nsc__hint">{L(stepMeta.hint, lang)}</div>
          )}
        </div>
        <div className="nsc__actions">
          <button
            className={`nsc__btn ${alreadyDone ? "nsc__btn--review" : "nsc__btn--primary"}`}
            onClick={handleNext}
          >
            {alreadyDone ? labels.alreadyDoneLabel : `${labels.goBtn} →`}
          </button>
          {extraActions.map((a, i) => (
            <button key={i} className="nsc__btn nsc__btn--secondary" onClick={a.onClick}>
              {a.icon} {a.label}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
