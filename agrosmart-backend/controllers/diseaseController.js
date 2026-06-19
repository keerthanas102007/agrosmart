const db = require("../config/db");

/* ── helper: pick string by lang ── */
function L(obj, lang) {
  if (lang === "ta") return obj.ta || obj.en;
  if (lang === "hi") return obj.hi || obj.en;
  return obj.en;
}
function Larr(arr, lang) { return arr.map(s => L(s, lang)); }

/* ── helper: image filename → stable index (hash-based) ── */
function pickIndex(filename, arrayLen) {
  let hash = 0;
  for (let i = 0; i < filename.length; i++) {
    hash = (hash * 31 + filename.charCodeAt(i)) & 0xffffffff;
  }
  return Math.abs(hash) % arrayLen;
}

/* ── DISEASE DATABASE (trilingual, multiple diseases per crop) ── */
const DISEASE_DB = {
  rice: [
  {
    disease: { en:"Rice Blast", ta:"நெல் ப்லாஸ்ட் நோய்", hi:"धान का ब्लास्ट रोग" },
    confidence: 87, severity: "high",
    solutions: [
      { en:"Apply Tricyclazole 75 WP @ 0.6g/L water spray", ta:"Tricyclazole 75 WP @ 0.6g/L தண்ணீரில் தெளிக்கவும்", hi:"Tricyclazole 75 WP @ 0.6g/L पानी में छिड़काव करें" },
      { en:"Remove and burn infected plant parts", ta:"பாதிக்கப்பட்ட பயிர் பகுதிகளை அகற்றி எரிக்கவும்", hi:"संक्रमित पौधे के हिस्सों को हटाकर जलाएं" },
      { en:"Avoid excess nitrogen fertilizer", ta:"அதிகப்படியான நைட்ரஜன் உரம் தவிர்க்கவும்", hi:"अधिक नाइट्रोजन उर्वरक से बचें" },
      { en:"Maintain proper water depth (5cm)", ta:"5cm நீர் ஆழம் பராமரிக்கவும்", hi:"उचित जल गहराई (5cm) बनाए रखें" }
    ],
    fertilizers: [
      { name:"Potassium Silicate", amount:"10 kg/acre", timing:{ en:"Before heading stage", ta:"தலை நிலை முன்", hi:"बाली निकलने से पहले" } },
      { name:"Zinc Sulphate", amount:"5 kg/acre", timing:{ en:"At transplanting", ta:"நடவு நேரத்தில்", hi:"रोपाई के समय" } }
    ],
    pesticides: [
      { name:"Tricyclazole 75 WP", amount:"0.6 g/L water", method:{ en:"Foliar spray", ta:"இலை தெளிப்பு", hi:"पर्णीय छिड़काव" }, frequency:{ en:"Every 7 days", ta:"ஒவ்வொரு 7 நாளும்", hi:"हर 7 दिन" } },
      { name:"Propiconazole 25 EC", amount:"1 ml/L water", method:{ en:"Foliar spray", ta:"இலை தெளிப்பு", hi:"पर्णीय छिड़काव" }, frequency:{ en:"Preventive", ta:"தடுப்பு நடவடிக்கை", hi:"निवारक" } }
    ],
    water: { en:"Maintain 5cm standing water. Do not let field dry during treatment.", ta:"5cm நிலையான நீர் பராமரிக்கவும். சிகிச்சை நேரத்தில் வயல் வறண்டு போகாமல் பார்க்கவும்.", hi:"5cm स्थायी पानी बनाए रखें। उपचार के दौरान खेत को सूखने न दें।" },
    estimatedLoss: 30
  },
  {
    disease: { en:"Rice Brown Spot", ta:"நெல் பழுப்பு புள்ளி நோய்", hi:"धान का भूरा धब्बा रोग" },
    confidence: 82, severity: "medium",
    solutions: [
      { en:"Apply Mancozeb 75 WP @ 2.5g/L spray", ta:"Mancozeb 75 WP @ 2.5g/L தெளிக்கவும்", hi:"Mancozeb 75 WP @ 2.5g/L छिड़काव करें" },
      { en:"Improve field drainage to reduce humidity", ta:"ஈரப்பதத்தை குறைக்க வடிகால் சரி பண்ணவும்", hi:"नमी कम करने के लिए जल निकासी सुधारें" },
      { en:"Use balanced potassium fertilizer", ta:"சீரான பொட்டாசியம் உரம் இடவும்", hi:"संतुलित पोटेशियम उर्वरक का उपयोग करें" },
      { en:"Remove and burn severely infected plants", ta:"கடுமையாக பாதிக்கப்பட்ட தாவரங்களை எரிக்கவும்", hi:"गंभीर रूप से संक्रमित पौधों को जलाएं" }
    ],
    fertilizers: [
      { name:"Potassium Chloride", amount:"25 kg/acre", timing:{ en:"Before panicle initiation", ta:"கதிர் தோன்றும் முன்",  hi:"बाली बनने से पहले" } },
      { name:"Zinc Sulphate",      amount:"5 kg/acre",  timing:{ en:"At transplanting",          ta:"நடவு நேரத்தில்",      hi:"रोपाई के समय" } }
    ],
    pesticides: [
      { name:"Mancozeb 75 WP",   amount:"2.5 g/L",  method:{ en:"Foliar spray", ta:"இலை தெளிப்பு", hi:"पर्णीय छिड़काव" }, frequency:{ en:"Every 14 days", ta:"ஒவ்வொரு 14 நாளும்", hi:"हर 14 दिन" } },
      { name:"Iprobenfos 48 EC", amount:"1.5 ml/L", method:{ en:"Foliar spray", ta:"இலை தெளிப்பு", hi:"पर्णीय छिड़काव" }, frequency:{ en:"2 sprays",      ta:"2 முறை",          hi:"2 छिड़काव" } }
    ],
    water: { en:"Avoid water stress during grain filling. Maintain adequate moisture.", ta:"தானிய நிரப்பும் போது நீர் குறைபாடு தவிர்க்கவும். போதிய ஈரப்பதம் பராமரிக்கவும்.", hi:"दाने भरते समय जल तनाव से बचें। पर्याप्त नमी बनाए रखें।" },
    estimatedLoss: 20
  },
  {
    disease: { en:"Rice Sheath Blight", ta:"நெல் உறை அழுகல் நோய்", hi:"धान का शीथ ब्लाइट रोग" },
    confidence: 78, severity: "medium",
    solutions: [
      { en:"Apply Hexaconazole 5 SC @ 2ml/L", ta:"Hexaconazole 5 SC @ 2ml/L தெளிக்கவும்", hi:"Hexaconazole 5 SC @ 2ml/L छिड़काव करें" },
      { en:"Reduce plant density by proper spacing", ta:"சரியான இடைவெளியில் நடவு செய்து தாவர அடர்த்தி குறைக்கவும்", hi:"उचित दूरी रखकर पौधों की घनत्व कम करें" },
      { en:"Drain fields periodically to reduce humidity", ta:"ஈரப்பதம் குறைக்க வயலை அவ்வப்போது வடிக்கட்டவும்", hi:"नमी कम करने के लिए खेत को बीच-बीच में सुखाएं" },
      { en:"Avoid excess nitrogen application", ta:"அதிக நைட்ரஜன் உரம் இடுவதை தவிர்க்கவும்", hi:"अत्यधिक नाइट्रोजन उर्वरक से बचें" }
    ],
    fertilizers: [
      { name:"Silica fertilizer", amount:"100 kg/acre", timing:{ en:"At basal application", ta:"அடித்தள நேரத்தில்", hi:"आधार प्रयोग के समय" } },
      { name:"DAP",               amount:"40 kg/acre",  timing:{ en:"At transplanting",     ta:"நடவு நேரத்தில்",  hi:"रोपाई के समय" } }
    ],
    pesticides: [
      { name:"Hexaconazole 5 SC", amount:"2 ml/L",   method:{ en:"Foliar spray", ta:"இலை தெளிப்பு", hi:"पर्णीय छिड़காव" }, frequency:{ en:"Every 10 days",     ta:"ஒவ்வொரு 10 நாளும்", hi:"हर 10 दिन" } },
      { name:"Validamycin 3 SL",  amount:"2.5 ml/L", method:{ en:"Soil drench",  ta:"மண் ஊற்று",    hi:"मिट्टी में डालें" }, frequency:{ en:"Once at tillering", ta:"தூர்கட்டும்போது",  hi:"कल्ले निकलते समय" } }
    ],
    water: { en:"Drain field for 3-4 days after treatment. Avoid continuous flooding.", ta:"சிகிச்சைக்கு பிறகு 3-4 நாள் வடிக்கட்டவும். தொடர்ந்த வெள்ளம் தவிர்க்கவும்.", hi:"उपचार के बाद 3-4 दिन खेत को सुखाएं। लगातार पानी से बचें।" },
    estimatedLoss: 25
  }],
  wheat: [{
    disease: { en:"Wheat Yellow Rust", ta:"கோதுமை மஞ்சள் துரு நோய்", hi:"गेहूं का पीला रतुआ रोग" },
    confidence: 83, severity: "medium",
    solutions: [
      { en:"Apply Propiconazole 25 EC @ 1ml/L", ta:"Propiconazole 25 EC @ 1ml/L தெளிக்கவும்", hi:"Propiconazole 25 EC @ 1ml/L छिड़काव करें" },
      { en:"Use resistant varieties next season", ta:"அடுத்த சீசனில் நோய் எதிர்ப்பு ரகங்களை பயன்படுத்தவும்", hi:"अगले सत्र में प्रतिरोधी किस्में उपयोग करें" },
      { en:"Apply sulfur dust as preventive measure", ta:"தடுப்பு நடவடிக்கையாக கந்தக தூள் தெளிக்கவும்", hi:"निवारक उपाय के रूप में सल्फर धूल छिड़कें" },
      { en:"Remove infected lower leaves", ta:"பாதிக்கப்பட்ட கீழ் இலைகளை அகற்றவும்", hi:"संक्रमित निचली पत्तियां हटाएं" }
    ],
    fertilizers: [
      { name:"DAP", amount:"50 kg/acre", timing:{ en:"At sowing", ta:"விதைப்பு நேரத்தில்", hi:"बुवाई के समय" } },
      { name:"Urea 2nd dose", amount:"30 kg/acre", timing:{ en:"At tillering", ta:"தூர்கட்டும் போது", hi:"कल्ले निकलते समय" } }
    ],
    pesticides: [
      { name:"Propiconazole 25 EC", amount:"1 ml/L", method:{ en:"Foliar spray", ta:"இலை தெளிப்பு", hi:"पर्णीय छिड़काव" }, frequency:{ en:"2 sprays, 14 days apart", ta:"2 முறை, 14 நாள் இடைவெளி", hi:"2 छिड़काव, 14 दिन के अंतर से" } },
      { name:"Tebuconazole 25 WG", amount:"1 g/L", method:{ en:"Foliar spray", ta:"இலை தெளிப்பு", hi:"पर्णीய छिड़काव" }, frequency:{ en:"Preventive", ta:"தடுப்பு நடவடிக்கை", hi:"निवारक" } }
    ],
    water: { en:"Avoid overhead irrigation during disease period. Reduce to 300L/acre/week.", ta:"நோய் காலத்தில் மேல்-நீர்ப்பாசனம் தவிர்க்கவும். வாரம் 300L/acre-க்கு குறைக்கவும்.", hi:"रोग काल में ऊपरी सिंचाई से बचें। 300L/एकड़/सप्ताह तक कम करें।" },
    estimatedLoss: 20
  },
  {
    disease: { en:"Wheat Powdery Mildew", ta:"கோதுமை பொடி பூஞ்சை நோய்", hi:"गेहूं का पाउडरी मिल्ड्यू रोग" },
    confidence: 80, severity: "medium",
    solutions: [
      { en:"Apply Triadimefon 25 WP @ 0.1% spray", ta:"Triadimefon 25 WP @ 0.1% தெளிக்கவும்", hi:"Triadimefon 25 WP @ 0.1% छिड़काव करें" },
      { en:"Improve air circulation in the field", ta:"வயலில் காற்றோட்டத்தை மேம்படுத்தவும்", hi:"खेत में हवा का संचार बढ़ाएं" },
      { en:"Avoid over-irrigation", ta:"அதிக நீர்ப்பாசனம் தவிர்க்கவும்", hi:"अत्यधिक सिंचाई से बचें" },
      { en:"Use resistant wheat varieties", ta:"நோய் எதிர்ப்பு கோதுமை ரகங்களை பயன்படுத்தவும்", hi:"प्रतिरोधी गेहूं किस्मों का उपयोग करें" }
    ],
    fertilizers: [
      { name:"Urea",       amount:"25 kg/acre", timing:{ en:"Split dose at tillering", ta:"தூர்கட்டும்போது பிரித்து இடவும்", hi:"कल्ले निकलते समय विभाजित मात्रा" } },
      { name:"Sulfur 90%", amount:"8 kg/acre",  timing:{ en:"Pre-sowing",              ta:"விதைப்பு முன்",                    hi:"बुवाई से पहले" } }
    ],
    pesticides: [
      { name:"Triadimefon 25 WP",   amount:"1 g/L",   method:{ en:"Foliar spray", ta:"இலை தெளிப்பு", hi:"पर्णीय छिड़काव" }, frequency:{ en:"Every 10 days",   ta:"ஒவ்வொரு 10 நாளும்",  hi:"हर 10 दिन" } },
      { name:"Sulfur 80 WDG",       amount:"2.5 g/L", method:{ en:"Foliar spray", ta:"இலை தெளிப்பு", hi:"पर्णीय छिड़काव" }, frequency:{ en:"Preventive",     ta:"தடுப்பு நடவடிக்கை", hi:"निवारक" } }
    ],
    water: { en:"Reduce irrigation frequency. Avoid wet foliage. Use drip if possible.", ta:"நீர்ப்பாசன அதிர்வெண் குறைக்கவும். இலைகள் நனையாமல் பார்க்கவும்.", hi:"सिंचाई कम करें। पत्तियां गीली न हों। हो सके तो ड्रिप उपयोग करें।" },
    estimatedLoss: 15
  }],
  cotton: [{
    disease: { en:"Cotton Leaf Curl Virus", ta:"பருத்தி இலை சுருட்டு வைரஸ்", hi:"कपास पत्ती मोड़ विषाणु" },
    confidence: 79, severity: "high",
    solutions: [
      { en:"Remove and destroy infected plants immediately", ta:"பாதிக்கப்பட்ட தாவரங்களை உடனடியாக அகற்றி அழிக்கவும்", hi:"संक्रमित पौधों को तुरंत हटाकर नष्ट करें" },
      { en:"Control whitefly vector with Imidacloprid 17.8 SL", ta:"Imidacloprid 17.8 SL வச்சு வெள்ளை ஈக்களை கட்டுப்படுத்தவும்", hi:"Imidacloprid 17.8 SL से सफेद मक्खी नियंत्रित करें" },
      { en:"Use reflective mulch to repel whiteflies", ta:"வெள்ளை ஈக்களை விரட்ட பிரதிபலிப்பு மல்ச் பயன்படுத்தவும்", hi:"सफेद मक्खी भगाने के लिए परावर्तक मल्च उपयोग करें" },
      { en:"Maintain field hygiene", ta:"வயல் சுத்தம் பராமரிக்கவும்", hi:"खेत की स्वच्छता बनाए रखें" }
    ],
    fertilizers: [
      { name:"Potash MOP", amount:"20 kg/acre", timing:{ en:"Before symptom stage", ta:"அறிகுறி தோன்றும் முன்", hi:"लक्षण दिखने से पहले" } },
      { name:"Boron", amount:"1 kg/acre", timing:{ en:"Foliar spray", ta:"இலை தெளிப்பு", hi:"पर्णीय छिड़काव" } }
    ],
    pesticides: [
      { name:"Imidacloprid 17.8 SL", amount:"0.5 ml/L", method:{ en:"Foliar spray for whitefly", ta:"வெள்ளை ஈ தெளிப்பு", hi:"सफेद मक्खी के लिए पर्णीय छिड़काव" }, frequency:{ en:"Weekly", ta:"வாரம் ஒரு முறை", hi:"साप्ताहिक" } },
      { name:"Spinosad 45 SC", amount:"0.3 ml/L", method:{ en:"Foliar spray", ta:"இலை தெளிப்பு", hi:"पर्णीय छिड़काव" }, frequency:{ en:"Alternate weeks", ta:"மாற்று வாரங்களில்", hi:"एक सप्ताह छोड़कर" } }
    ],
    water: { en:"Normal drip schedule. Do not stress crop — stressed crops are at higher risk.", ta:"சாதாரண சொட்டு நீர் அட்டவணை. பயிரை வற்றவிடாதீர்கள்.", hi:"सामान्य ड्रिप शेड्यूल। फसल को तनाव न दें — तनावग्रस्त फसलों में अधिक जोखिम।" },
    estimatedLoss: 40
  },
  {
    disease: { en:"Cotton Boll Rot", ta:"பருத்தி காய் அழுகல் நோய்", hi:"कपास का बॉल रॉट रोग" },
    confidence: 75, severity: "high",
    solutions: [
      { en:"Remove and destroy rotted bolls immediately", ta:"அழுகிய காய்களை உடனே அகற்றி அழிக்கவும்", hi:"सड़े हुए बॉल को तुरंत हटाकर नष्ट करें" },
      { en:"Apply Copper Oxychloride 50 WP spray", ta:"Copper Oxychloride 50 WP தெளிக்கவும்", hi:"Copper Oxychloride 50 WP छिड़काव करें" },
      { en:"Improve field drainage", ta:"வயல் வடிகால் மேம்படுத்தவும்", hi:"खेत की जल निकासी सुधारें" },
      { en:"Avoid excessive irrigation during boll development", ta:"காய் வளரும் போது அதிக நீர்ப்பாசனம் தவிர்க்கவும்", hi:"बॉल विकास के दौरान अत्यधिक सिंचाई से बचें" }
    ],
    fertilizers: [
      { name:"Calcium Nitrate", amount:"10 kg/acre", timing:{ en:"At boll formation", ta:"காய் உருவாகும்போது", hi:"बॉल बनते समय" } },
      { name:"Boron",           amount:"1 kg/acre",  timing:{ en:"Foliar spray",      ta:"இலை தெளிப்பு",     hi:"पर्णीय छिड़काव" } }
    ],
    pesticides: [
      { name:"Copper Oxychloride 50 WP", amount:"3 g/L",   method:{ en:"Foliar spray", ta:"இலை தெளிப்பு", hi:"पर्णीय छिड़काव" }, frequency:{ en:"Every 7 days", ta:"ஒவ்வொரு 7 நாளும்",  hi:"हर 7 दिन" } },
      { name:"Carbendazim 50 WP",        amount:"1.5 g/L", method:{ en:"Foliar spray", ta:"இலை தெளிப்பு", hi:"पर्णीय छिड़काव" }, frequency:{ en:"Preventive",   ta:"தடுப்பு நடவடிக்கை", hi:"निवारक" } }
    ],
    water: { en:"Reduce irrigation 2 weeks before harvest. Avoid water stagnation.", ta:"அறுவடைக்கு 2 வாரம் முன் நீர்ப்பாசனம் குறைக்கவும். நீர் தேங்காமல் பார்க்கவும்.", hi:"कटाई से 2 सप्ताह पहले सिंचाई कम करें। पानी जमा न होने दें।" },
    estimatedLoss: 35
  }],
  default: [{
    disease: { en:"Fungal Leaf Spot", ta:"பூஞ்சை இலை புள்ளி நோய்", hi:"कवकीय पत्ती धब्बा रोग" },
    confidence: 72, severity: "low",
    solutions: [
      { en:"Remove infected leaves and destroy", ta:"பாதிக்கப்பட்ட இலைகளை அகற்றி அழிக்கவும்", hi:"संक्रमित पत्तियां हटाकर नष्ट करें" },
      { en:"Apply copper-based fungicide spray", ta:"தாமிர அடிப்படையிலான பூஞ்சைக்கொல்லி தெளிக்கவும்", hi:"तांबा आधारित फफूंदनाशक छिड़काव करें" },
      { en:"Improve air circulation between plants", ta:"தாவரங்களுக்கிடையே காற்றோட்டம் மேம்படுத்தவும்", hi:"पौधों के बीच हवा का संचार बढ़ाएं" },
      { en:"Avoid wetting foliage during irrigation", ta:"நீர்ப்பாசன நேரத்தில் இலைகளை நனைக்காதீர்கள்", hi:"सिंचाई के दौरान पत्तियों को गीला करने से बचें" }
    ],
    fertilizers: [
      { name:"NPK 19:19:19", amount:"5 kg/acre", timing:{ en:"Dissolved spray", ta:"கரைசல் தெளிப்பு", hi:"घोल छिड़काव" } },
      { name:"Calcium Nitrate", amount:"3 kg/acre", timing:{ en:"Foliar spray", ta:"இலை தெளிப்பு", hi:"पर्णीय छिड़काव" } }
    ],
    pesticides: [
      { name:"Copper Oxychloride 50 WP", amount:"3g/L", method:{ en:"Foliar spray", ta:"இலை தெளிப்பு", hi:"पर्णीय छिड़काव" }, frequency:{ en:"Every 10 days", ta:"ஒவ்வொரு 10 நாளும்", hi:"हर 10 दिन" } },
      { name:"Mancozeb 75 WP", amount:"2.5g/L", method:{ en:"Foliar spray", ta:"இலை தெளிப்பு", hi:"पर्णीय छिड़काव" }, frequency:{ en:"Preventive", ta:"தடுப்பு நடவடிக்கை", hi:"निवारक" } }
    ],
    water: { en:"Reduce irrigation frequency. Water at base, not on leaves.", ta:"நீர்ப்பாசன அதிர்வெண்ணை குறைக்கவும். இலைகளில் அல்ல, அடியில் நீர் பாய்ச்சவும்.", hi:"सिंचाई की आवृत्ति कम करें। पत्तியों पर नहीं, जड़ के पास पानी दें।" },
    estimatedLoss: 10
  },
  {
    disease: { en:"Bacterial Leaf Blight", ta:"பாக்டீரியா இலை கருகல் நோய்", hi:"बैक्टीरियल पत्ती झुलसा रोग" },
    confidence: 74, severity: "medium",
    solutions: [
      { en:"Apply Copper Hydroxide 77 WP @ 2.5g/L", ta:"Copper Hydroxide 77 WP @ 2.5g/L தெளிக்கவும்", hi:"Copper Hydroxide 77 WP @ 2.5g/L छिड़काव करें" },
      { en:"Remove and destroy infected plant material", ta:"பாதிக்கப்பட்ட தாவர பாகங்களை அகற்றி அழிக்கவும்", hi:"संक्रमित पौधे की सामग्री हटाकर नष्ट करें" },
      { en:"Avoid working in field when plants are wet", ta:"தாவரங்கள் நனைந்திருக்கும்போது வயலில் வேலை தவிர்க்கவும்", hi:"पौधे गीले होने पर खेत में काम करने से बचें" },
      { en:"Use disease-free seeds next season", ta:"அடுத்த சீசனில் நோய் இல்லாத விதைகளை பயன்படுத்தவும்", hi:"अगले सत्र में रोगमुक्त बीजों का उपयोग करें" }
    ],
    fertilizers: [
      { name:"Potassium Sulphate", amount:"20 kg/acre", timing:{ en:"At vegetative stage", ta:"வளர்ச்சி நிலையில்", hi:"वानस्पतिक अवस्था में" } },
      { name:"Calcium Nitrate",    amount:"5 kg/acre",  timing:{ en:"Foliar spray",        ta:"இலை தெளிப்பு",    hi:"पर्णीय छिड़काव" } }
    ],
    pesticides: [
      { name:"Copper Hydroxide 77 WP",  amount:"2.5 g/L", method:{ en:"Foliar spray", ta:"இலை தெளிப்பு", hi:"पर्णीय छिड़काव" }, frequency:{ en:"Every 7 days", ta:"ஒவ்வொரு 7 நாளும்",  hi:"हर 7 दिन" } },
      { name:"Streptomycin Sulphate",   amount:"0.5 g/L", method:{ en:"Foliar spray", ta:"இலை தெளிப்பு", hi:"पर्णीय छिड़काव" }, frequency:{ en:"2-3 sprays",   ta:"2-3 முறை",          hi:"2-3 छिड़काव" } }
    ],
    water: { en:"Reduce irrigation. Avoid leaf wetness. Ensure good drainage.", ta:"நீர்ப்பாசனம் குறைக்கவும். இலை நனைவதை தவிர்க்கவும். வடிகால் உறுதி செய்யவும்.", hi:"सिंचाई कम करें। पत्तियां गीली न हों। जल निकासी सुनिश्चित करें।" },
    estimatedLoss: 15
  }]
};

/* ── Farm analysis scenarios (trilingual) ── */
const FARM_SCENARIOS = [
  {
    status: "positive",
    command: { en:"✅ Your farm looks healthy!", ta:"✅ உங்கள் பண்ணை நல்ல நிலையில் உள்ளது!", hi:"✅ आपका खेत स्वस्थ दिख रहा है!" },
    details: {
      soilCondition: "Good", cropDensity: "Optimal",
      irrigationStatus: "Adequate", pestPresence: "None detected", overallScore: 88,
      tips: [
        { en:"Continue current fertilizer schedule", ta:"தற்போதைய உர அட்டவணையை தொடரவும்", hi:"वर्तमान उर्वरक कार्यक्रम जारी रखें" },
        { en:"Monitor for any early signs of pests", ta:"பூச்சிகளின் ஆரம்ப அறிகுறிகளை கண்காணிக்கவும்", hi:"कीटों के शुरुआती संकेतों की निगरानी करें" },
        { en:"Maintain current irrigation frequency", ta:"தற்போதைய நீர்ப்பாசன அதிர்வெண்ணை பராமரிக்கவும்", hi:"वर्तमान सिंचाई आवृत्ति बनाए रखें" }
      ]
    }
  },
  {
    status: "alert",
    command: { en:"⚠️ Issues detected in your farm!", ta:"⚠️ சில பிரச்சனைகள் கண்டறியப்பட்டன!", hi:"⚠️ आपके खेत में समस्याएं मिली हैं!" },
    details: {
      soilCondition: "Dry patches visible", cropDensity: "Uneven in some areas",
      irrigationStatus: "Under-irrigated", pestPresence: "Possible pest activity", overallScore: 62,
      tips: [
        { en:"Increase irrigation in dry patches", ta:"வறண்ட பகுதிகளில் நீர்ப்பாசனம் அதிகரிக்கவும்", hi:"सूखे धब्बों में सिंचाई बढ़ाएं" },
        { en:"Check for pest infestation in sparse areas", ta:"அரிய பகுதிகளில் பூச்சி தாக்குதலை சரிபார்க்கவும்", hi:"विरल क्षेत्रों में कीट संक्रमण की जांच करें" },
        { en:"Apply balanced NPK fertilizer", ta:"சீரான NPK உரம் இடவும்", hi:"संतुलित NPK उर्वरक डालें" },
        { en:"Consider soil moisture testing", ta:"மண் ஈரப்பத சோதனையை கருத்தில் கொள்ளவும்", hi:"मिट्टी की नमी परीक्षण पर विचार करें" }
      ]
    }
  },
  {
    status: "warning",
    command: { en:"🟡 Farm needs attention.", ta:"🟡 உங்கள் பண்ணை சரியான பராமரிப்பு தேவைப்படுகிறது.", hi:"🟡 खेत पर ध्यान देने की जरूरत है।" },
    details: {
      soilCondition: "Moderate", cropDensity: "Average",
      irrigationStatus: "Slightly inadequate", pestPresence: "Minor risk", overallScore: 74,
      tips: [
        { en:"Increase potassium application", ta:"பொட்டாசியம் அளவை அதிகரிக்கவும்", hi:"पोटेशियम का प्रयोग बढ़ाएं" },
        { en:"Check pH levels", ta:"pH அளவை சரிபார்க்கவும்", hi:"pH स्तर की जांच करें" },
        { en:"Improve drainage if waterlogging observed", ta:"நீர்ப்பொருத்தம் கவனிக்கப்பட்டால் வடிகாலை மேம்படுத்தவும்", hi:"जलभराव हो तो जल निकासी सुधारें" }
      ]
    }
  }
];

function buildAnalysis(raw, lang) {
  return {
    disease:       L(raw.disease, lang),
    confidence:    raw.confidence,
    severity:      raw.severity,
    solutions:     Larr(raw.solutions, lang),
    fertilizers:   raw.fertilizers.map(f => ({ name: f.name, amount: f.amount, timing: L(f.timing, lang) })),
    pesticides:    raw.pesticides.map(p => ({ name: p.name, amount: p.amount, method: L(p.method, lang), frequency: L(p.frequency, lang) })),
    water:         L(raw.water, lang),
    estimatedLoss: raw.estimatedLoss
  };
}

function buildFarmAnalysis(raw, lang) {
  return {
    status:  raw.status,
    command: L(raw.command, lang),
    details: {
      ...raw.details,
      tips: Larr(raw.details.tips, lang)
    }
  };
}

/* ── ANALYZE DISEASE ── */
exports.analyzeDisease = (req, res) => {
  const userId   = req.user.id;
  const lang     = req.body.lang || req.query.lang || "en";

  if (!req.file) return res.status(400).json({ success: false, message: "Image file required" });

  const imageFilename = req.file.filename;
  const cropType      = req.body.crop_type || "unknown";
  const lowerCrop     = cropType.toLowerCase();
  const diseaseList   = DISEASE_DB[lowerCrop] || DISEASE_DB["default"];
  const rawData       = diseaseList[pickIndex(imageFilename, diseaseList.length)];
  const analysis      = buildAnalysis(rawData, lang);

  const sql = `INSERT INTO disease_detections
    (user_id, image_filename, crop_type, disease_name, confidence, severity,
     solutions, fertilizers_needed, pesticides_needed, water_needed, estimated_loss_pct)
    VALUES (?,?,?,?,?,?,?,?,?,?,?)`;

  db.query(sql, [
    userId, imageFilename, cropType,
    rawData.disease.en,    // always store English name in DB
    rawData.confidence, rawData.severity,
    JSON.stringify(rawData.solutions.map(s => s.en)),
    JSON.stringify(rawData.fertilizers.map(f => ({ name: f.name, amount: f.amount, timing: f.timing.en }))),
    JSON.stringify(rawData.pesticides.map(p => ({ name: p.name, amount: p.amount, method: p.method.en, frequency: p.frequency.en }))),
    rawData.water.en,
    rawData.estimatedLoss
  ], (err, result) => {
    if (err) return res.status(500).json({ success: false, message: err.message });

    res.status(201).json({
      success: true,
      detectionId: result.insertId,
      imageUrl: `/uploads/diseases/${imageFilename}`,
      cropType,
      ...analysis,
      // Include full trilingual raw data so frontend can re-translate on lang switch
      _raw: {
        disease:     rawData.disease,
        solutions:   rawData.solutions,
        fertilizers: rawData.fertilizers.map(f => ({ name: f.name, amount: f.amount, timing: f.timing })),
        pesticides:  rawData.pesticides.map(p => ({ name: p.name, amount: p.amount, method: p.method, frequency: p.frequency })),
        water:       rawData.water,
        confidence:  rawData.confidence,
        severity:    rawData.severity,
        estimatedLoss: rawData.estimatedLoss,
      }
    });
  });
};

/* ── ANALYZE FARM PHOTO ── */
exports.analyzeFarmPhoto = (req, res) => {
  const userId = req.user.id;
  const lang   = req.body.lang || req.query.lang || "en";

  if (!req.file) return res.status(400).json({ success: false, message: "Image file required" });

  const imageFilename = req.file.filename;
  const rawScenario   = FARM_SCENARIOS[Math.floor(Math.random() * FARM_SCENARIOS.length)];
  const farmAnalysis  = buildFarmAnalysis(rawScenario, lang);

  const sql = `INSERT INTO farm_photo_analysis (user_id, image_filename, status, command, details)
               VALUES (?,?,?,?,?)`;

  db.query(sql, [
    userId, imageFilename,
    rawScenario.status,
    rawScenario.command.en,
    JSON.stringify(rawScenario.details)
  ], (err, result) => {
    if (err) return res.status(500).json({ success: false, message: err.message });

    res.status(201).json({
      success: true,
      analysisId: result.insertId,
      imageUrl: `/uploads/diseases/${imageFilename}`,
      ...farmAnalysis,
      // Full trilingual raw for client-side lang switch
      _raw: {
        command: rawScenario.command,
        tips:    rawScenario.details.tips,
        status:  rawScenario.status,
      }
    });
  });
};

/* ── DELETE DISEASE HISTORY ENTRY ── */
exports.deleteDiseaseHistory = (req, res) => {
  const userId = req.user.id;
  const { id } = req.params;
  const sql = `DELETE FROM disease_detections WHERE id=? AND user_id=?`;
  db.query(sql, [id, userId], (err, result) => {
    if (err) return res.status(500).json({ success: false, message: err.message });
    if (result.affectedRows === 0) return res.status(404).json({ success: false, message: "Not found" });
    res.json({ success: true });
  });
};

/* ── GET DISEASE HISTORY ── */
exports.getDiseaseHistory = (req, res) => {
  const userId = req.user.id;
  const sql = `SELECT * FROM disease_detections WHERE user_id=? ORDER BY created_at DESC`;
  db.query(sql, [userId], (err, rows) => {
    if (err) return res.status(500).json({ success: false, message: err.message });
    const parsed = rows.map(row => ({
      ...row,
      solutions:   safeParseJSON(row.solutions),
      fertilizers: safeParseJSON(row.fertilizers_needed),
      pesticides:  safeParseJSON(row.pesticides_needed)
    }));
    res.json(parsed);
  });
};

/* ── GET FARM PHOTO HISTORY ── */
exports.getFarmPhotoHistory = (req, res) => {
  const userId = req.user.id;
  const sql = "SELECT * FROM farm_photo_analysis WHERE user_id=? ORDER BY created_at DESC";
  db.query(sql, [userId], (err, rows) => {
    if (err) return res.status(500).json({ success: false, message: err.message });
    const parsed = rows.map(r => ({ ...r, details: safeParseJSON(r.details) }));
    res.json(parsed);
  });
};

function safeParseJSON(str) {
  try { return JSON.parse(str); } catch (_) { return str; }
}
