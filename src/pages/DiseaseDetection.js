import { useState, useEffect, useMemo, useRef } from "react";
import { useNavigate } from "react-router-dom";
import MainLayout from "../layouts/MainLayout";
import { useApp } from "../context/AppContext";
import { analyzeDisease, analyzeFarmPhoto, getDiseaseHistory, deleteDiseaseEntry, addFarmHistory } from "../api/api";
import { CROP_GROUPS, getCropName } from "../data/cropFertilizers";
import NextStepCard from "../components/NextStepCard";
import "../styles/DiseaseDetection.css";
import "../styles/NextStepCard.css";

/* ══════════════════════════════════════════════════════
   CLIENT-SIDE TRILINGUAL DISEASE DATABASE
   Matches backend DISEASE_DB exactly — used to re-translate
   results on language switch without re-fetching.
══════════════════════════════════════════════════════ */
const DISEASE_DB_CLIENT = {
  rice: {
    disease:   { en:"Rice Blast", ta:"நெல் ப்லாஸ்ட் நோய்", hi:"धान का ब्लास्ट रोग" },
    solutions: [
      { en:"Apply Tricyclazole 75 WP @ 0.6g/L water spray", ta:"Tricyclazole 75 WP @ 0.6g/L தண்ணீரில் தெளிக்கவும்", hi:"Tricyclazole 75 WP @ 0.6g/L पानी में छिड़काव करें" },
      { en:"Remove and burn infected plant parts", ta:"பாதிக்கப்பட்ட பயிர் பகுதிகளை அகற்றி எரிக்கவும்", hi:"संक्रमित पौधे के हिस्सों को हटाकर जलाएं" },
      { en:"Avoid excess nitrogen fertilizer", ta:"அதிகப்படியான நைட்ரஜன் உரம் தவிர்க்கவும்", hi:"अधिक नाइट्रोजन उर्वरक से बचें" },
      { en:"Maintain proper water depth (5cm)", ta:"5cm நீர் ஆழம் பராமரிக்கவும்", hi:"उचित जल गहराई (5cm) बनाए रखें" },
    ],
    fertilizers: [
      { name:"Potassium Silicate", amount:{ en:"10 kg/acre", ta:"10 கிலோ/ஏக்கர்", hi:"10 कि.ग्रा./एकड़" }, timing:{ en:"Before heading stage", ta:"தலை நிலை முன்", hi:"बाली निकलने से पहले" } },
      { name:"Zinc Sulphate",      amount:{ en:"5 kg/acre",  ta:"5 கிலோ/ஏக்கர்",  hi:"5 कि.ग्रा./एकड़" },  timing:{ en:"At transplanting",     ta:"நடவு நேரத்தில்",  hi:"रोपाई के समय" } },
    ],
    pesticides: [
      { name:"Tricyclazole 75 WP",  amount:{ en:"0.6 g/L", ta:"0.6 கி/லி", hi:"0.6 ग्रा./लि." }, method:{ en:"Foliar spray", ta:"இலை தெளிப்பு", hi:"पर्णीय छिड़काव" }, frequency:{ en:"Every 7 days",  ta:"ஒவ்வொரு 7 நாளும்",   hi:"हर 7 दिन" } },
      { name:"Propiconazole 25 EC", amount:{ en:"1 ml/L",   ta:"1 மிலி/லி",  hi:"1 मि.ली./लि." },  method:{ en:"Foliar spray", ta:"இலை தெளிப்பு", hi:"पर्णीय छिड़काव" }, frequency:{ en:"Preventive",    ta:"தடுப்பு நடவடிக்கை", hi:"निवारक" } },
    ],
    water: { en:"Maintain 5cm standing water. Do not let field dry during treatment.", ta:"5cm நிலையான நீர் பராமரிக்கவும். சிகிச்சை நேரத்தில் வயல் வறண்டு போகாமல் பார்க்கவும்.", hi:"5cm स्थायी पानी बनाए रखें। उपचार के दौरान खेत को सूखने न दें।" },
  },
  wheat: {
    disease:   { en:"Wheat Yellow Rust", ta:"கோதுமை மஞ்சள் துரு நோய்", hi:"गेहूं का पीला रतुआ रोग" },
    solutions: [
      { en:"Apply Propiconazole 25 EC @ 1ml/L",             ta:"Propiconazole 25 EC @ 1ml/L தெளிக்கவும்",                          hi:"Propiconazole 25 EC @ 1ml/L छिड़काव करें" },
      { en:"Use resistant varieties next season",            ta:"அடுத்த சீசனில் நோய் எதிர்ப்பு ரகங்களை பயன்படுத்தவும்",           hi:"अगले सत्र में प्रतिरोधी किस्में उपयोग करें" },
      { en:"Apply sulfur dust as preventive measure",        ta:"தடுப்பு நடவடிக்கையாக கந்தக தூள் தெளிக்கவும்",                    hi:"निवारक उपाय के रूप में सल्फर धूल छिड़कें" },
      { en:"Remove infected lower leaves",                   ta:"பாதிக்கப்பட்ட கீழ் இலைகளை அகற்றவும்",                           hi:"संक्रमित निचली पत्तियां हटाएं" },
    ],
    fertilizers: [
      { name:"DAP",          amount:{ en:"50 kg/acre", ta:"50 கிலோ/ஏக்கர்", hi:"50 कि.ग्रा./एकड़" }, timing:{ en:"At sowing",    ta:"விதைப்பு நேரத்தில்", hi:"बुवाई के समय" } },
      { name:"Urea 2nd dose",amount:{ en:"30 kg/acre", ta:"30 கிலோ/ஏக்கர்", hi:"30 कि.ग्रा./एकड़" }, timing:{ en:"At tillering", ta:"தூர்கட்டும் போது",   hi:"कल्ले निकलते समय" } },
    ],
    pesticides: [
      { name:"Propiconazole 25 EC", amount:{ en:"1 ml/L", ta:"1 மிலி/லி", hi:"1 मि.ली./लि." }, method:{ en:"Foliar spray", ta:"இலை தெளிப்பு", hi:"पर्णीय छिड़काव" }, frequency:{ en:"2 sprays, 14 days apart", ta:"2 முறை, 14 நாள் இடைவெளி",   hi:"2 छिड़काव, 14 दिन के अंतर से" } },
      { name:"Tebuconazole 25 WG",  amount:{ en:"1 g/L",  ta:"1 கி/லி",    hi:"1 ग्रा./लि." },  method:{ en:"Foliar spray", ta:"இலை தெளிப்பு", hi:"पर्णीय छिड़काव" }, frequency:{ en:"Preventive",             ta:"தடுப்பு நடவடிக்கை",          hi:"निवारक" } },
    ],
    water: { en:"Avoid overhead irrigation during disease period. Reduce to 300L/acre/week.", ta:"நோய் காலத்தில் மேல்-நீர்ப்பாசனம் தவிர்க்கவும். வாரம் 300L/ஏக்கர்-க்கு குறைக்கவும்.", hi:"रोग काल में ऊपरी सिंचाई से बचें। 300 लि./एकड़/सप्ताह तक कम करें।" },
  },
  cotton: {
    disease:   { en:"Cotton Leaf Curl Virus", ta:"பருத்தி இலை சுருட்டு வைரஸ்", hi:"कपास पत्ती मोड़ विषाणु" },
    solutions: [
      { en:"Remove and destroy infected plants immediately",          ta:"பாதிக்கப்பட்ட தாவரங்களை உடனடியாக அகற்றி அழிக்கவும்",      hi:"संक्रमित पौधों को तुरंत हटाकर नष्ट करें" },
      { en:"Control whitefly vector with Imidacloprid 17.8 SL",      ta:"Imidacloprid 17.8 SL வச்சு வெள்ளை ஈக்களை கட்டுப்படுத்தவும்", hi:"Imidacloprid 17.8 SL से सफेद मक्खी नियंत्रित करें" },
      { en:"Use reflective mulch to repel whiteflies",                ta:"வெள்ளை ஈக்களை விரட்ட பிரதிபலிப்பு மல்ச் பயன்படுத்தவும்", hi:"सफेद मक्खी भगाने के लिए परावर्तक मल्च उपयोग करें" },
      { en:"Maintain field hygiene",                                  ta:"வயல் சுத்தம் பராமரிக்கவும்",                                hi:"खेत की स्वच्छता बनाए रखें" },
    ],
    fertilizers: [
      { name:"Potash MOP", amount:{ en:"20 kg/acre", ta:"20 கிலோ/ஏக்கர்", hi:"20 कि.ग्रा./एकड़" }, timing:{ en:"Before symptom stage", ta:"அறிகுறி தோன்றும் முன்", hi:"लक्षण दिखने से पहले" } },
      { name:"Boron",      amount:{ en:"1 kg/acre",  ta:"1 கிலோ/ஏக்கர்",  hi:"1 कि.ग्रा./एकड़" },  timing:{ en:"Foliar spray",         ta:"இலை தெளிப்பு",        hi:"पर्णीय छिड़काव" } },
    ],
    pesticides: [
      { name:"Imidacloprid 17.8 SL", amount:{ en:"0.5 ml/L", ta:"0.5 மிலி/லி", hi:"0.5 मि.ली./लि." }, method:{ en:"Foliar spray for whitefly", ta:"வெள்ளை ஈ தெளிப்பு",   hi:"सफेद मक्खी के लिए पर्णीय छिड़काव" }, frequency:{ en:"Weekly",         ta:"வாரம் ஒரு முறை",    hi:"साप्ताहिक" } },
      { name:"Spinosad 45 SC",        amount:{ en:"0.3 ml/L", ta:"0.3 மிலி/லி", hi:"0.3 मि.ली./लि." }, method:{ en:"Foliar spray",              ta:"இலை தெளிப்பு",        hi:"पर्णीय छिड़काव" },                    frequency:{ en:"Alternate weeks", ta:"மாற்று வாரங்களில்", hi:"एक सप्ताह छोड़कर" } },
    ],
    water: { en:"Normal drip schedule. Do not stress crop — stressed crops are at higher risk.", ta:"சாதாரண சொட்டு நீர் அட்டவணை. பயிரை வற்றவிடாதீர்கள்.", hi:"सामान्य ड्रिप शेड्यूल। फसल को तनाव न दें — तनावग्रस्त फसलों में अधिक जोखिम।" },
  },
  default: {
    disease:   { en:"Fungal Leaf Spot", ta:"பூஞ்சை இலை புள்ளி நோய்", hi:"कवकीय पत्ती धब्बा रोग" },
    solutions: [
      { en:"Remove infected leaves and destroy",         ta:"பாதிக்கப்பட்ட இலைகளை அகற்றி அழிக்கவும்",                hi:"संक्रमित पत्तियां हटाकर नष्ट करें" },
      { en:"Apply copper-based fungicide spray",         ta:"தாமிர அடிப்படையிலான பூஞ்சைக்கொல்லி தெளிக்கவும்",       hi:"तांबा आधारित फफूंदनाशक छिड़काव करें" },
      { en:"Improve air circulation between plants",    ta:"தாவரங்களுக்கிடையே காற்றோட்டம் மேம்படுத்தவும்",           hi:"पौधों के बीच हवा का संचार बढ़ाएं" },
      { en:"Avoid wetting foliage during irrigation",   ta:"நீர்ப்பாசன நேரத்தில் இலைகளை நனைக்காதீர்கள்",           hi:"सिंचाई के दौरान पत்तियों को गीला करने से बचें" },
    ],
    fertilizers: [
      { name:"NPK 19:19:19",    amount:"5 kg/acre", timing:{ en:"Dissolved spray", ta:"கரைசல் தெளிப்பு", hi:"घोल छिड़काव" } },
      { name:"Calcium Nitrate", amount:"3 kg/acre", timing:{ en:"Foliar spray",    ta:"இலை தெளிப்பு",   hi:"पर्णीय छिड़काव" } },
    ],
    pesticides: [
      { name:"Copper Oxychloride 50 WP", amount:"3g/L",   method:{ en:"Foliar spray", ta:"இலை தெளிப்பு", hi:"पर्णीय छिड़काव" }, frequency:{ en:"Every 10 days", ta:"ஒவ்வொரு 10 நாளும்",  hi:"हर 10 दिन" } },
      { name:"Mancozeb 75 WP",           amount:"2.5g/L", method:{ en:"Foliar spray", ta:"இலை தெளிப்பு", hi:"पर्णीय छिड़काव" }, frequency:{ en:"Preventive",    ta:"தடுப்பு நடவடிக்கை", hi:"निवारக" } },
    ],
    water: { en:"Reduce irrigation frequency. Water at base, not on leaves.", ta:"நீர்ப்பாசன அதிர்வெண்ணை குறைக்கவும். இலைகளில் அல்ல, அடியில் நீர் பாய்ச்சவும்.", hi:"सिंचाई की आवृत्ति कम करें। पत्तियों पर नहीं, जड़ के पास पानी दें।" },
  },
};

/* Farm tips trilingual */
const FARM_TIPS_CLIENT = {
  positive: {
    command: { en:"✅ Your farm looks healthy!", ta:"✅ உங்கள் பண்ணை நல்ல நிலையில் உள்ளது!", hi:"✅ आपका खेत स्वस्थ दिख रहा है!" },
    tips: [
      { en:"Continue current fertilizer schedule",        ta:"தற்போதைய உர அட்டவணையை தொடரவும்",             hi:"वर्तमान उर्वरक कार्यक्रम जारी रखें" },
      { en:"Monitor for any early signs of pests",        ta:"பூச்சிகளின் ஆரம்ப அறிகுறிகளை கண்காணிக்கவும்", hi:"कीटों के शुरुआती संकेतों की निगरानी करें" },
      { en:"Maintain current irrigation frequency",       ta:"தற்போதைய நீர்ப்பாசன அதிர்வெண்ணை பராமரிக்கவும்", hi:"वर्तमान सिंचाई आवृत्ति बनाए रखें" },
    ],
  },
  alert: {
    command: { en:"⚠️ Issues detected in your farm!", ta:"⚠️ சில பிரச்சனைகள் கண்டறியப்பட்டன!", hi:"⚠️ आपके खेत में समस्याएं मिली हैं!" },
    tips: [
      { en:"Increase irrigation in dry patches",            ta:"வறண்ட பகுதிகளில் நீர்ப்பாசனம் அதிகரிக்கவும்",      hi:"सूखे धब्बों में सिंचाई बढ़ाएं" },
      { en:"Check for pest infestation in sparse areas",    ta:"அரிய பகுதிகளில் பூச்சி தாக்குதலை சரிபார்க்கவும்",  hi:"विरल क्षेत्रों में कीट संक्रमण की जांच करें" },
      { en:"Apply balanced NPK fertilizer",                 ta:"சீரான NPK உரம் இடவும்",                              hi:"संतुलित NPK उर्वरक डालें" },
      { en:"Consider soil moisture testing",                ta:"மண் ஈரப்பத சோதனையை கருத்தில் கொள்ளவும்",            hi:"मिट्टी की नमी परीक्षण पर विचार करें" },
    ],
  },
  warning: {
    command: { en:"🟡 Farm needs attention.", ta:"🟡 உங்கள் பண்ணை சரியான பராமரிப்பு தேவைப்படுகிறது.", hi:"🟡 खेत पर ध्यान देने की जरूरत है।" },
    tips: [
      { en:"Increase potassium application",                     ta:"பொட்டாசியம் அளவை அதிகரிக்கவும்",                       hi:"पोटेशियम का प्रयोग बढ़ाएं" },
      { en:"Check pH levels",                                    ta:"pH அளவை சரிபார்க்கவும்",                               hi:"pH स्तर की जांच करें" },
      { en:"Improve drainage if waterlogging observed",          ta:"நீர்ப்பொருத்தம் கவனிக்கப்பட்டால் வடிகாலை மேம்படுத்தவும்", hi:"जलभराव हो तो जल निकासी सुधारें" },
    ],
  },
};

/* ── Translate helper ── */
function L(obj, lang) {
  if (!obj) return "";
  if (lang === "ta") return obj.ta || obj.en || "";
  if (lang === "hi") return obj.hi || obj.en || "";
  return obj.en || "";
}

/* ── Main translator — works with both _raw (new) and cropType lookup (old) ── */
function translateResult(result, lang) {
  if (!result) return null;

  if (result.type === "disease") {
    // Prefer _raw from backend, fall back to client DB lookup by crop type
    const raw = result.data._raw || (() => {
      const key = (result.data.cropType || "").toLowerCase();
      return DISEASE_DB_CLIENT[key] || DISEASE_DB_CLIENT["default"];
    })();

    return {
      ...result,
      data: {
        ...result.data,
        disease:     L(raw.disease, lang),
        solutions:   (raw.solutions || []).map(s => L(s, lang)),
        fertilizers: (raw.fertilizers || []).map(f => ({
          name: f.name, amount: f.amount, timing: L(f.timing, lang)
        })),
        pesticides: (raw.pesticides || []).map(p => ({
          name: p.name, amount: p.amount,
          method: L(p.method, lang), frequency: L(p.frequency, lang)
        })),
        water: L(raw.water, lang),
      }
    };
  }

  if (result.type === "farm") {
    // Prefer _raw from backend, fall back to client farm tips lookup by status
    const rawFarm = result.data._raw;
    const farmDB  = FARM_TIPS_CLIENT[result.data.status] || FARM_TIPS_CLIENT["positive"];

    const command = rawFarm ? L(rawFarm.command, lang) : L(farmDB.command, lang);
    const tips    = rawFarm
      ? (rawFarm.tips || []).map(tip => L(tip, lang))
      : (farmDB.tips  || []).map(tip => L(tip, lang));

    return {
      ...result,
      data: {
        ...result.data,
        command,
        details: {
          ...result.data.details,
          tips,
        }
      }
    };
  }

  return result;
}

export default function DiseaseDetection() {
  const { t, user, lang, setSharedDiseaseResult, markFlowStep } = useApp();
  const fileInputRef = useRef(null);
  const navigate = useNavigate();

  const [mode, setMode]             = useState("disease"); // "disease" | "farm"
  const [image, setImage]           = useState(null);
  const [preview, setPreview]       = useState(null);
  const [cropType, setCropType]     = useState("Rice");
  const [loading, setLoading]       = useState(false);
  const [result, setResult]         = useState(null);
  const [error, setError]           = useState("");
  const [logMsg,  setLogMsg]        = useState(""); // feedback after logging to history
  const [logging, setLogging]       = useState(false);
  const [history, setHistory]       = useState([]);
  const [histLoading, setHistLoad]  = useState(true);

  // Auto re-translate result whenever lang changes
  const translatedResult = useMemo(() => translateResult(result, lang), [result, lang]);

  useEffect(() => {
    if (user) fetchHistory();
  }, [user]);

  const fetchHistory = async () => {
    try {
      const res = await getDiseaseHistory();
      setHistory(res.data);
    } catch (_) {}
    finally { setHistLoad(false); }
  };

  const handleDeleteHistory = async (id) => {
    if (!window.confirm(
      lang==="ta" ? "இந்த பதிவை நீக்க விரும்புகிறீர்களா?" :
      lang==="hi" ? "क्या आप इस रिकॉर्ड को हटाना चाहते हैं?" :
      "Delete this detection record?"
    )) return;
    try {
      await deleteDiseaseEntry(id);
      setHistory(prev => prev.filter(h => h.id !== id));
    } catch (_) {}
  };

  const handleImage = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setImage(file);
    setPreview(URL.createObjectURL(file));
    setResult(null);
    setError("");
  };

  const handleAnalyze = async () => {
    if (!image) return setError(
      lang==="ta" ? "முதலில் படம் பதிவேற்றவும்." :
      lang==="hi" ? "पहले फोटो अपलोड करें।" :
      "Please upload an image first."
    );
    if (!user)  return setError(
      lang==="ta" ? "இந்த அம்சத்தை பயன்படுத்த உள்நுழையவும்." :
      lang==="hi" ? "इस सुविधा का उपयोग करने के लिए लॉगिन करें।" :
      "Please login to use this feature."
    );
    try {
      setLoading(true);
      setError("");
      const fd = new FormData();
      fd.append("image", image);
      fd.append("lang", lang);
      if (mode === "disease") {
        fd.append("crop_type", cropType);
        const res = await analyzeDisease(fd);
        setResult({ type: "disease", data: res.data });
        // ✅ Flow Step 6 — Disease detected, save to shared context
        setSharedDiseaseResult({
          disease:   res.data.disease,
          severity:  res.data.severity,
          cropType:  cropType,
          confidence:res.data.confidence,
          _raw:      res.data._raw,
        });
        markFlowStep("diseaseDone");
      } else {
        const res = await analyzeFarmPhoto(fd);
        setResult({ type: "farm", data: res.data });
      }
      fetchHistory();
    } catch (err) {
      setError(err.response?.data?.message || (
        lang==="ta" ? "பகுப்பாய்வு தோல்வியுற்றது. மீண்டும் முயலவும்." :
        lang==="hi" ? "विश्लेषण विफल। पुनः प्रयास करें।" :
        "Analysis failed. Try again."
      ));
    } finally {
      setLoading(false);
    }
  };

  const getSeverityColor = (severity) => {
    if (severity === "high")   return "#d32f2f";
    if (severity === "medium") return "#f57c00";
    return "#388e3c";
  };

  const getStatusColor = (status) => {
    if (status === "alert")    return "#d32f2f";
    if (status === "warning")  return "#f57c00";
    return "#388e3c";
  };

  const dis = {
    uploadCrop:    lang==="ta" ? "📸 பயிர் புகைப்படம் பதிவேற்றவும்"    : lang==="hi" ? "📸 फसल फोटो अपलोड करें"    : "📸 Upload Crop Photo",
    uploadFarm:    lang==="ta" ? "📷 பண்ணை புகைப்படம் பதிவேற்றவும்"   : lang==="hi" ? "📷 खेत फोटो अपलोड करें"    : "📷 Upload Farm Photo",
    cropHint:      lang==="ta" ? "நோய்வாய்ப்பட்ட இலை அல்லது பயிர் பகுதியின் தெளிவான புகைப்படம் பதிவேற்றவும்"
                               : lang==="hi" ? "संक्रमित पत्ती या फसल क्षेत्र की स्पष्ट फोटो अपलोड करें"
                               : "Upload a clear photo of the infected leaf or crop area",
    farmHint:      lang==="ta" ? "ஒட்டுமொத்த ஆரோக்கிய பகுப்பாய்விற்கு பண்ணையின் விரிவான பார்வையை பதிவேற்றவும்"
                               : lang==="hi" ? "समग्र स्वास्थ्य विश्लेषण के लिए खेत का विस्तृत दृश्य अपलोड करें"
                               : "Upload a wide view of your farm for overall health analysis",
    selectCropType:lang==="ta" ? "🌾 பயிர் வகையை தேர்ந்தெடுக்கவும்" : lang==="hi" ? "🌾 फसल का प्रकार चुनें" : "🌾 Select Crop Type",
    clickUpload:   lang==="ta" ? "கிளிக் செய்து பதிவேற்றவும் அல்லது இழுத்து விடவும்"
                               : lang==="hi" ? "क्लिक करें या खींचें और छोड़ें"
                               : "Click to upload or drag & drop",
    supported:     lang==="ta" ? "JPG, PNG, WEBP ஆதரவு" : lang==="hi" ? "JPG, PNG, WEBP समर्थित" : "JPG, PNG, WEBP supported",
    analyzing:     lang==="ta" ? "பகுப்பாய்வு..." : lang==="hi" ? "विश्लेषण हो रहा है..." : "Analyzing...",
    detectDisease: lang==="ta" ? "நோய் கண்டறி" : lang==="hi" ? "रोग पहचानें" : "Detect Disease",
    analyzeFarm:   lang==="ta" ? "பண்ணை பகுப்பாய்வு" : lang==="hi" ? "खेत विश्लेषण" : "Analyze Farm",
    cropMode:      lang==="ta" ? "பயிர் நோய் கண்டறிதல்" : lang==="hi" ? "फसल रोग पहचान" : "Crop Disease Detection",
    farmMode:      lang==="ta" ? "பண்ணை நிலை பகுப்பாய்வு" : lang==="hi" ? "खेत स्थिति विश्लेषण" : "Farm Condition Analysis",
    diseaseResult: lang==="ta" ? "🔬 நோய் பகுப்பாய்வு முடிவு" : lang==="hi" ? "🔬 रोग विश्लेषण परिणाम" : "🔬 Disease Analysis Result",
    severity:      lang==="ta" ? "தீவிரம்" : lang==="hi" ? "गंभीरता" : "Severity",
    confidence:    lang==="ta" ? "நம்பகத்தன்மை" : lang==="hi" ? "विश्वसनीयता" : "Confidence",
    solutions:     lang==="ta" ? "✅ தீர்வுகள்" : lang==="hi" ? "✅ समाधान" : "✅ Solutions",
    pesticides:    lang==="ta" ? "🧪 தேவையான பூச்சிக்கொல்லிகள்" : lang==="hi" ? "🧪 आवश्यक कीटनाशक" : "🧪 Pesticides Needed",
    fertilizers:   lang==="ta" ? "🌱 தேவையான உரங்கள்" : lang==="hi" ? "🌱 आवश्यक उर्वरक" : "🌱 Fertilizers Needed",
    amount:        lang==="ta" ? "அளவு" : lang==="hi" ? "मात्रा" : "Amount",
    method:        lang==="ta" ? "முறை" : lang==="hi" ? "विधि" : "Method",
    frequency:     lang==="ta" ? "அதிர்வெண்" : lang==="hi" ? "आवृत्ति" : "Frequency",
    timing:        lang==="ta" ? "நேரம்" : lang==="hi" ? "समय" : "Timing",
    waterReq:      lang==="ta" ? "💧 நீர் தேவை" : lang==="hi" ? "💧 पानी की जरूरत" : "💧 Water Requirement",
    cropLoss:      lang==="ta" ? "சிகிச்சை இல்லாமல் பயிர் இழப்பு" : lang==="hi" ? "उपचार के बिना फसल हानि" : "Estimated crop loss if untreated",
    farmResult:    lang==="ta" ? "🏡 பண்ணை பகுப்பாய்வு முடிவு" : lang==="hi" ? "🏡 खेत विश्लेषण परिणाम" : "🏡 Farm Analysis Result",
    farmOverview:  lang==="ta" ? "📊 பண்ணை அவலோகனம்" : lang==="hi" ? "📊 खेत अवलोकन" : "📊 Farm Overview",
    overallScore:  lang==="ta" ? "ஒட்டுமொத்த மதிப்பெண்" : lang==="hi" ? "कुल स्कोर" : "Overall Farm Score",
    noHistory:     lang==="ta" ? "இன்னும் கண்டறிதல் வரலாறு இல்லை." : lang==="hi" ? "अभी कोई पहचान इतिहास नहीं।" : "No analysis history yet.",
    pleaseUpload:  lang==="ta" ? "முதலில் படம் பதிவேற்றவும்." : lang==="hi" ? "पहले फோटो அपलोड करें।" : "Please upload an image first.",
    pleaseLogin:   lang==="ta" ? "இந்த அம்சத்தை பயன்படுத்த உள்நுழையவும்." : lang==="hi" ? "इस सुविधा का उपयोग करने के लिए लॉगिन करें।" : "Please login to use this feature.",
    analysisFailed:lang==="ta" ? "பகுப்பாய்வு தோல்வியுற்றது. மீண்டும் முயலவும்." : lang==="hi" ? "विश्लेषण विफल। पुनः प्रयास करें।" : "Analysis failed. Try again.",
    // Severity translations
    sevHigh:   lang==="ta" ? "அதிக தீவிரம்"  : lang==="hi" ? "उच्च"   : "HIGH",
    sevMedium: lang==="ta" ? "நடுத்தர தீவிரம்" : lang==="hi" ? "मध्यम" : "MEDIUM",
    sevLow:    lang==="ta" ? "குறைந்த தீவிரம்" : lang==="hi" ? "कम"    : "LOW",
    // Crop name translations
    cropNames: {
      Rice:       lang==="ta" ? "நெல்"        : lang==="hi" ? "चावल"      : "Rice",
      Wheat:      lang==="ta" ? "கோதுமை"      : lang==="hi" ? "गेहूं"     : "Wheat",
      Cotton:     lang==="ta" ? "பருத்தி"     : lang==="hi" ? "कपास"      : "Cotton",
      Maize:      lang==="ta" ? "மக்காச்சோளம்": lang==="hi" ? "मक्का"     : "Maize",
      Sugarcane:  lang==="ta" ? "கரும்பு"     : lang==="hi" ? "गन्ना"     : "Sugarcane",
      Soybean:    lang==="ta" ? "சோயாபீன்"   : lang==="hi" ? "सोयाबीन"   : "Soybean",
      Pulses:     lang==="ta" ? "பருப்பு வகைகள்": lang==="hi" ? "दालें"   : "Pulses",
      Vegetables: lang==="ta" ? "காய்கறிகள்"  : lang==="hi" ? "सब्जियां" : "Vegetables",
      Sorghum:    lang==="ta" ? "சோளம்"       : lang==="hi" ? "ज्वार"     : "Sorghum",
      Groundnut:  lang==="ta" ? "கடலை"        : lang==="hi" ? "मूंगफली"   : "Groundnut",
      Sunflower:  lang==="ta" ? "சூரியகாந்தி" : lang==="hi" ? "सूरजमुखी" : "Sunflower",
      Chickpea:   lang==="ta" ? "கொண்டைக்கடலை": lang==="hi" ? "चना"      : "Chickpea",
    },
  };

  return (
    <MainLayout>
      <div className="disease-page">
        {/* Header */}
        <div className="page-header">
          <h1>🔬 {t.diseaseDetection}</h1>
          <p>{t.diseaseDetectionSub}</p>
        </div>

        {/* Mode Toggle */}
        <div className="mode-toggle">
          <button
            className={`mode-btn ${mode === "disease" ? "active" : ""}`}
            onClick={() => { setMode("disease"); setResult(null); setImage(null); setPreview(null); }}
          >
            🌿 {dis.cropMode}
          </button>
          <button
            className={`mode-btn ${mode === "farm" ? "active" : ""}`}
            onClick={() => { setMode("farm"); setResult(null); setImage(null); setPreview(null); }}
          >
            🏡 {dis.farmMode}
          </button>
        </div>

        <div className="disease-main">
          {/* Upload Section */}
          <div className="upload-section">
            <div className="upload-card">
              <h3>
                {mode === "disease" ? dis.uploadCrop : dis.uploadFarm}
              </h3>
              <p className="upload-hint">
                {mode === "disease" ? dis.cropHint : dis.farmHint}
              </p>

              {/* Crop selector (only for disease mode) */}
              {mode === "disease" && (
                <div className="form-group">
                  <label>{dis.selectCropType}</label>
                  <select
                    className="form-input"
                    value={cropType}
                    onChange={e => setCropType(e.target.value)}
                  >
                    {CROP_GROUPS.map(g => (
                      <optgroup
                        key={g.group}
                        label={lang==="ta" ? g.groupTa : lang==="hi" ? g.groupHi : g.group}
                      >
                        {g.crops.map(c => (
                          <option key={c.en} value={c.en}>
                            {getCropName(c, lang)}
                          </option>
                        ))}
                      </optgroup>
                    ))}
                  </select>
                </div>
              )}

              <div
                className="image-upload-area"
                onClick={() => fileInputRef.current && fileInputRef.current.click()}
              >
                {preview ? (
                  <img src={preview} alt="preview" className="image-preview" />
                ) : (
                  <div className="upload-placeholder">
                    <span>🖼️</span>
                    <p>{dis.clickUpload}</p>
                    <small>{dis.supported}</small>
                  </div>
                )}
              </div>
              <input
                id="disease-img"
                ref={fileInputRef}
                type="file"
                accept="image/*"
                style={{ display: "none" }}
                onChange={handleImage}
              />

              {image && (
                <div className="file-info">
                  📎 {image.name} — {(image.size/1024).toFixed(1)} KB
                </div>
              )}

              {error && <div className="form-error">⚠️ {error}</div>}

              <button
                className="btn-analyze"
                onClick={handleAnalyze}
                disabled={loading || !image}
              >
                {loading ? (
                  <><div className="spinner-sm" /> {dis.analyzing}</>
                ) : (
                  `🔍 ${mode === "disease" ? dis.detectDisease : dis.analyzeFarm}`
                )}
              </button>
            </div>

            {/* Results */}
            {translatedResult && (
              <div className="result-card">
                {translatedResult.type === "disease" && (
                  <>
                    <div className="result-header" style={{ background: getSeverityColor(translatedResult.data.severity) }}>
                      <h3>{dis.diseaseResult}</h3>
                      <div className="result-badges">
                        <span className="badge">🌿 {dis.cropNames[translatedResult.data.cropType] || translatedResult.data.cropType}</span>
                        <span className="badge severity-badge">
                          {dis.severity}: {
                            translatedResult.data.severity === "high"   ? dis.sevHigh   :
                            translatedResult.data.severity === "medium" ? dis.sevMedium :
                            dis.sevLow
                          }
                        </span>
                        <span className="badge confidence-badge">
                          {translatedResult.data.confidence}% {dis.confidence}
                        </span>
                      </div>
                    </div>

                    <div className="result-body">
                      <div className="disease-name">
                        <span>⚠️</span>
                        <h3>{translatedResult.data.disease}</h3>
                      </div>

                      <div className="result-section">
                        <h4>{dis.solutions}</h4>
                        <ul className="solution-list">
                          {(translatedResult.data.solutions || []).map((s, i) => (
                            <li key={i}>{s}</li>
                          ))}
                        </ul>
                      </div>

                      <div className="result-section">
                        <h4>{dis.pesticides}</h4>
                        <div className="product-grid">
                          {(translatedResult.data.pesticides || []).map((p, i) => (
                            <div className="product-card" key={i}>
                              <div className="product-name">🧴 {p.name}</div>
                              <div className="product-detail">📏 {dis.amount}: <strong>{p.amount}</strong></div>
                              <div className="product-detail">🔄 {dis.method}: {p.method}</div>
                              <div className="product-detail">📅 {dis.frequency}: {p.frequency}</div>
                            </div>
                          ))}
                        </div>
                      </div>

                      <div className="result-section">
                        <h4>{dis.fertilizers}</h4>
                        <div className="product-grid">
                          {(translatedResult.data.fertilizers || []).map((f, i) => (
                            <div className="product-card product-card--fertilizer" key={i}>
                              <div className="product-name">🌿 {f.name}</div>
                              <div className="product-detail">📏 {dis.amount}: <strong>{f.amount}</strong></div>
                              <div className="product-detail">⏰ {dis.timing}: {f.timing}</div>
                            </div>
                          ))}
                        </div>
                      </div>

                      <div className="result-section">
                        <h4>{dis.waterReq}</h4>
                        <div className="water-info">{translatedResult.data.water}</div>
                      </div>

                      {translatedResult.data.estimatedLoss > 0 && (
                        <div className="loss-warning">
                          ⚠️ {dis.cropLoss}: <strong>{translatedResult.data.estimatedLoss}%</strong>
                        </div>
                      )}
                    </div>
                  </>
                )}

                {translatedResult.type === "farm" && (
                  <>
                    <div className="result-header" style={{ background: getStatusColor(translatedResult.data.status) }}>
                      <h3>{dis.farmResult}</h3>
                    </div>
                    <div className="result-body">
                      <div className={`farm-command farm-command--${translatedResult.data.status}`}>
                        {translatedResult.data.command}
                      </div>
                      <div className="result-section">
                        <h4>{dis.farmOverview}</h4>
                        <div className="farm-overview-grid">
                          {Object.entries(translatedResult.data.details || {}).filter(([k]) => k !== "tips" && k !== "overallScore").map(([k, v]) => {
                            const keyLabels = {
                              soilCondition:    lang==="ta" ? "மண் நிலை"        : lang==="hi" ? "मिट्टी की स्थिति"    : "Soil Condition",
                              cropDensity:      lang==="ta" ? "பயிர் அடர்த்தி"  : lang==="hi" ? "फसल घनत्व"           : "Crop Density",
                              irrigationStatus: lang==="ta" ? "நீர்ப்பாசன நிலை" : lang==="hi" ? "सिंचाई स्थिति"       : "Irrigation Status",
                              pestPresence:     lang==="ta" ? "பூச்சி இருப்பு"   : lang==="hi" ? "कीट उपस्थिति"        : "Pest Presence",
                            };
                            const valLabels = {
                              "Good":                lang==="ta" ? "நல்லது"                   : lang==="hi" ? "अच्छा"                      : "Good",
                              "Optimal":             lang==="ta" ? "உகந்தது"                  : lang==="hi" ? "इष्टतम"                     : "Optimal",
                              "Adequate":            lang==="ta" ? "போதுமானது"                : lang==="hi" ? "पर्याप्त"                   : "Adequate",
                              "None detected":       lang==="ta" ? "எதுவும் இல்லை"            : lang==="hi" ? "कोई नहीं"                   : "None detected",
                              "Dry patches visible": lang==="ta" ? "வறண்ட பகுதிகள்"           : lang==="hi" ? "सूखे धब्बे दिखते हैं"       : "Dry patches visible",
                              "Uneven in some areas":lang==="ta" ? "சில இடங்களில் சீரற்றது"   : lang==="hi" ? "कुछ क्षेत्रों में असमान"    : "Uneven in some areas",
                              "Under-irrigated":     lang==="ta" ? "குறைவான நீர்ப்பாசனம்"     : lang==="hi" ? "कम सिंचाई"                  : "Under-irrigated",
                              "Possible pest activity": lang==="ta" ? "பூச்சி அபாயம்"         : lang==="hi" ? "कीट गतिविधि संभव"           : "Possible pest activity",
                              "Moderate":            lang==="ta" ? "மிதமானது"                 : lang==="hi" ? "मध्यम"                      : "Moderate",
                              "Average":             lang==="ta" ? "சராசரி"                   : lang==="hi" ? "औसत"                        : "Average",
                              "Slightly inadequate": lang==="ta" ? "சிறிது குறைவு"            : lang==="hi" ? "थोड़ा अपर्याप्त"            : "Slightly inadequate",
                              "Minor risk":          lang==="ta" ? "சிறிய அபாயம்"             : lang==="hi" ? "मामूली जोखिम"               : "Minor risk",
                            };
                            return (
                              <div className="farm-overview-item" key={k}>
                                <div className="label">{keyLabels[k] || k.replace(/([A-Z])/g, " $1").replace(/^./, s => s.toUpperCase())}</div>
                                <div className="value">{valLabels[v] || v}</div>
                              </div>
                            );
                          })}
                          {translatedResult.data.details?.overallScore && (
                            <div className="farm-score">
                              <div className="score-value">{translatedResult.data.details.overallScore}/100</div>
                              <div className="score-label">{dis.overallScore}</div>
                            </div>
                          )}
                        </div>
                      </div>
                      {translatedResult.data.details?.tips && (
                        <div className="result-section">
                          <h4>💡 {t.recommendations}</h4>
                          <ul className="solution-list">
                            {translatedResult.data.details.tips.map((tip, i) => <li key={i}>{tip}</li>)}
                          </ul>
                        </div>
                      )}
                    </div>
                  </>
                )}
              </div>
            )}
          </div>

          {/* History */}
          <div className="history-section">
            <h3>📋 {t.analysisHistory}</h3>
            {histLoading ? (
              <div className="loading-spinner"><div className="spinner" /></div>
            ) : history.length === 0 ? (
              <div className="no-history">{dis.noHistory}</div>
            ) : (
              <div className="history-list">
                {history.map(h => (
                  <div className="history-item" key={h.id}>
                    <img
                      src={`http://localhost:5000/uploads/diseases/${h.image_filename}`}
                      alt={h.disease_name}
                      className="history-thumbnail"
                      onError={e => e.target.style.display = "none"}
                    />
                    <div className="history-info">
                      <div className="history-disease">
                        {/* Translate disease name from English DB value */}
                        {lang === "ta"
                          ? ({ "Rice Blast":"நெல் ப்லாஸ்ட் நோய்", "Wheat Yellow Rust":"கோதுமை மஞ்சள் துரு நோய்", "Cotton Leaf Curl Virus":"பருத்தி இலை சுருட்டு வைரஸ்", "Fungal Leaf Spot":"பூஞ்சை இலை புள்ளி நோய்" }[h.disease_name] || h.disease_name)
                          : lang === "hi"
                          ? ({ "Rice Blast":"धान का ब्लास्ट रोग", "Wheat Yellow Rust":"गेहूं का पीला रतुआ रोग", "Cotton Leaf Curl Virus":"कपास पत्ती मोड़ विषाणु", "Fungal Leaf Spot":"कवकीय पत्ती धब्बा रोग" }[h.disease_name] || h.disease_name)
                          : h.disease_name}
                      </div>
                      <div className="history-crop">🌾 {dis.cropNames[h.crop_type] || h.crop_type}</div>
                      <div className="history-date">{new Date(h.created_at).toLocaleDateString("en-IN")}</div>
                      <span
                        className="severity-tag"
                        style={{ background: getSeverityColor(h.severity) }}
                      >
                        {h.severity === "high" ? dis.sevHigh : h.severity === "medium" ? dis.sevMedium : dis.sevLow}
                      </span>
                    </div>
                    <button
                      className="history-delete-btn"
                      onClick={() => handleDeleteHistory(h.id)}
                      title={
                        lang==="ta" ? "இந்த பதிவை நீக்கு" :
                        lang==="hi" ? "इसे हटाएं" :
                        "Delete this record"
                      }
                      aria-label="Delete detection record"
                    >
                      🗑️
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* ✅ Smart Flow — Step 6: Disease done → go Community */}
      <NextStepCard currentStep="diseaseDone" />
    </MainLayout>
  );
}
