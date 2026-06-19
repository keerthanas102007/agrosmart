import { useState, useEffect, useRef } from "react";
import { FaMapMarkerAlt, FaSync, FaTint, FaHistory } from "react-icons/fa";
import MainLayout from "../layouts/MainLayout";
import { useApp } from "../context/AppContext";
import {
  setLandLocation, getWeatherForLand, getIrrigationLogs, getWaterUsage, getFarmDetails
} from "../api/api";
import NextStepCard from "../components/NextStepCard";
import "../styles/global.css";
import "../styles/Irrigation.css";
import "../styles/NextStepCard.css";

/* ─── Popular India farming places ─────────────────────────
   Each entry has names in EN / TA / HI + lat/lon.
   Click → show all. Type → filter by any language name.
────────────────────────────────────────────────────────── */
const INDIA_PLACES = [
  // Tamil Nadu
  { en:"Coimbatore",    ta:"கோயம்புத்தூர்",  hi:"कोयम्बटूर",    lat:11.0168, lon:76.9558 },
  { en:"Chennai",       ta:"சென்னை",          hi:"चेन्नई",        lat:13.0827, lon:80.2707 },
  { en:"Madurai",       ta:"மதுரை",           hi:"मदुरई",         lat:9.9252,  lon:78.1198 },
  { en:"Salem",         ta:"சேலம்",           hi:"सेलम",          lat:11.6643, lon:78.1460 },
  { en:"Tiruchirappalli",ta:"திருச்சிராப்பள்ளி",hi:"तिरुचिरापल्ली",lat:10.7905, lon:78.7047 },
  { en:"Erode",         ta:"ஈரோடு",           hi:"ईरोड",          lat:11.3410, lon:77.7172 },
  { en:"Tirunelveli",   ta:"திருநெல்வேலி",    hi:"तिरुनेलवेली",   lat:8.7139,  lon:77.7567 },
  { en:"Vellore",       ta:"வேலூர்",          hi:"वेल्लोर",       lat:12.9165, lon:79.1325 },
  { en:"Thanjavur",     ta:"தஞ்சாவூர்",       hi:"तंजावुर",       lat:10.7870, lon:79.1378 },
  { en:"Pollachi",      ta:"பொள்ளாச்சி",      hi:"पोल्लाची",      lat:10.5909, lon:77.0077 },
  { en:"Dindigul",      ta:"திண்டுக்கல்",     hi:"डिंडीगुल",      lat:10.3624, lon:77.9695 },
  { en:"Tiruppur",      ta:"திருப்பூர்",      hi:"तिरुपुर",       lat:11.1085, lon:77.3411 },
  { en:"Karur",         ta:"கரூர்",           hi:"करूर",          lat:10.9601, lon:78.0766 },
  { en:"Namakkal",      ta:"நாமக்கல்",        hi:"नामक्कल",       lat:11.2191, lon:78.1683 },
  { en:"Villupuram",    ta:"விழுப்புரம்",      hi:"विल्लुपुरम",    lat:11.9392, lon:79.4930 },
  { en:"Cuddalore",     ta:"கடலூர்",          hi:"कड्डलोर",       lat:11.7447, lon:79.7689 },
  { en:"Sivaganga",     ta:"சிவகங்கை",        hi:"शिवगंगा",       lat:9.8479,  lon:78.4801 },
  { en:"Virudhunagar",  ta:"விருதுநகர்",      hi:"विरुधुनगर",     lat:9.5810,  lon:77.9624 },
  { en:"Ramanathapuram",ta:"ராமநாதபுரம்",     hi:"रामनाथपुरम",    lat:9.3762,  lon:78.8309 },
  { en:"Pudukkottai",   ta:"புதுக்கோட்டை",    hi:"पुदुक्कोट्टाई", lat:10.3797, lon:78.8268 },
  // Other states
  { en:"Bangalore",     ta:"பெங்களூரு",       hi:"बेंगलुरू",      lat:12.9716, lon:77.5946 },
  { en:"Mysore",        ta:"மைசூர்",          hi:"मैसूर",         lat:12.2958, lon:76.6394 },
  { en:"Hyderabad",     ta:"ஹைதராபாத்",       hi:"हैदराबाद",      lat:17.3850, lon:78.4867 },
  { en:"Pune",          ta:"புனே",            hi:"पुणे",          lat:18.5204, lon:73.8567 },
  { en:"Nashik",        ta:"நாசிக்",          hi:"नासिक",         lat:19.9975, lon:73.7898 },
  { en:"Nagpur",        ta:"நாக்பூர்",        hi:"नागपुर",        lat:21.1458, lon:79.0882 },
  { en:"Indore",        ta:"இந்தூர்",         hi:"इंदौर",         lat:22.7196, lon:75.8577 },
  { en:"Bhopal",        ta:"போபால்",          hi:"भोपाल",         lat:23.2599, lon:77.4126 },
  { en:"Jaipur",        ta:"ஜெய்ப்பூர்",      hi:"जयपुर",         lat:26.9124, lon:75.7873 },
  { en:"Lucknow",       ta:"லக்னோ",           hi:"लखनऊ",          lat:26.8467, lon:80.9462 },
  { en:"Patna",         ta:"பாட்னா",          hi:"पटना",          lat:25.5941, lon:85.1376 },
  { en:"Bhubaneswar",   ta:"புவனேஸ்வர்",      hi:"भुवनेश्वर",     lat:20.2961, lon:85.8245 },
  { en:"Guwahati",      ta:"குவாஹாட்டி",      hi:"गुवाहाटी",      lat:26.1445, lon:91.7362 },
  { en:"Amritsar",      ta:"அமிர்தசரஸ்",      hi:"अमृतसर",        lat:31.6340, lon:74.8723 },
  { en:"Ludhiana",      ta:"லூதியானா",        hi:"लुधियाना",      lat:30.9010, lon:75.8573 },
  { en:"Ahmedabad",     ta:"அகமதாபாத்",       hi:"अहमदाबाद",      lat:23.0225, lon:72.5714 },
  { en:"Surat",         ta:"சூரத்",           hi:"सूरत",          lat:21.1702, lon:72.8311 },
  { en:"Delhi",         ta:"டெல்லி",          hi:"दिल्ली",        lat:28.7041, lon:77.1025 },
  { en:"Mumbai",        ta:"மும்பை",          hi:"मुंबई",         lat:19.0760, lon:72.8777 },
  { en:"Kolkata",       ta:"கொல்கத்தா",       hi:"कोलकाता",       lat:22.5726, lon:88.3639 },
  { en:"Visakhapatnam", ta:"விசாகப்பட்டணம்",  hi:"विशाखापट्टनम",  lat:17.6868, lon:83.2185 },
  { en:"Kochi",         ta:"கொச்சி",          hi:"कोच्चि",        lat:9.9312,  lon:76.2673 },
  { en:"Thiruvananthapuram",ta:"திருவனந்தபுரம்",hi:"तिरुवनंतपुरम",lat:8.5241,  lon:76.9366 },
];

function filterPlaces(query, lang) {
  if (!query) return INDIA_PLACES;
  const q = query.toLowerCase();
  return INDIA_PLACES.filter(p =>
    p.en.toLowerCase().includes(q) ||
    p.ta.includes(query) ||
    p.hi.includes(query)
  );
}

function getPlaceName(place, lang) {
  return lang === "ta" ? place.ta : lang === "hi" ? place.hi : place.en;
}

const SOIL_TYPES = ["Red Loam","Black Cotton","Sandy Loam","Clay Loam","Silt Loam"];

export default function Irrigation() {
  const { t, user, lang, setSharedWeather, markFlowStep } = useApp();

  const [weather,       setWeather]      = useState(null);
  const [logs,          setLogs]         = useState([]);
  const [weatherLoad,   setWeatherLoad]  = useState(false);
  const [error,         setError]        = useState("");

  // Location form
  const [locSaved,    setLocSaved]    = useState(null); // { land_location, lat, lon }
  const [showLocForm, setShowLocForm] = useState(false);
  const [locForm,     setLocForm]     = useState({ land_location:"", lat:"", lon:"" });
  const [locLoading,  setLocLoading]  = useState(false);
  const [geoLoading,  setGeoLoading]  = useState(false);

  // Autocomplete
  const [suggestions,   setSuggestions]   = useState([]);
  const [showSug,       setShowSug]       = useState(false);
  const wrapRef = useRef(null);

  // Smart water advisor inputs
  const [soilType,     setSoilType]     = useState("Red Loam");
  const [farmAcres,    setFarmAcres]    = useState("1");
  const [waterUsage,   setWaterUsage]   = useState(null);
  const [waterLoading, setWaterLoading] = useState(false);
  const [autoFetched,  setAutoFetched]  = useState(false);
  const [farmAutoFilled, setFarmAutoFilled] = useState(false); // track if filled from farm

  useEffect(() => {
    if (user) { fetchLogs(); loadSavedLocation(); loadFarmDefaults(); }
  }, [user]);

  // Auto-fill soil type + farm size from Farm Details
  const loadFarmDefaults = async () => {
    try {
      const res = await getFarmDetails();
      const farm = res.data?.data;
      if (farm) {
        if (farm.soil_type && SOIL_TYPES.includes(farm.soil_type)) {
          setSoilType(farm.soil_type);
          setFarmAutoFilled(true);
        }
        if (farm.total_area) {
          // Extract numeric part (e.g. "5.5 acres" → "5.5")
          const acres = parseFloat(farm.total_area);
          if (!isNaN(acres) && acres > 0) { setFarmAcres(String(acres)); setFarmAutoFilled(true); }
        }
      }
    } catch (_) {}
  };

  // Auto-calculate when location + soil set
  useEffect(() => {
    if (locSaved?.lat && !autoFetched) {
      handleFetchWeather();
      handleCalculate();
      setAutoFetched(true);
    }
  }, [locSaved]);

  const loadSavedLocation = async () => {
    try {
      const res = await getWeatherForLand();
      if (res.data?.location) {
        setLocSaved({ land_location: res.data.location, lat: res.data.lat, lon: res.data.lon });
        setWeather(res.data);
      }
    } catch (_) {}
  };

  const fetchLogs = async () => {
    try {
      const res = await getIrrigationLogs();
      setLogs(res.data);
    } catch (_) {}
  };

  const handleFetchWeather = async () => {
    try {
      setWeatherLoad(true);
      setError("");
      const res = await getWeatherForLand();
      setWeather(res.data);
      // ✅ Flow Step 2 — Weather fetched, save to shared context
      setSharedWeather(res.data);
      markFlowStep("weatherSet");
    } catch (err) {
      setError(err.response?.data?.message || (lang==="ta"?"வானிலை பெற முடியவில்லை":"Weather fetch failed."));
    } finally {
      setWeatherLoad(false);
    }
  };

  const handleCalculate = async () => {
    try {
      setWaterLoading(true);
      setError("");
      const res = await getWaterUsage({ soil_type: soilType, farm_size_acres: farmAcres });
      setWaterUsage(res.data);
      // ✅ Flow Step 5 — Irrigation + Water plan done
      markFlowStep("irrigationDone");
    } catch (err) {
      setError(err.response?.data?.message || (lang==="ta"?"கணக்கீடு தோல்வி":"Calculation failed."));
    } finally {
      setWaterLoading(false);
    }
  };

  const detectGPS = () => {
    if (!navigator.geolocation) return alert("Geolocation not supported.");
    setGeoLoading(true);
    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        const lat = pos.coords.latitude.toFixed(6);
        const lon = pos.coords.longitude.toFixed(6);

        // Reverse geocode to get place name (Nominatim, free)
        let placeName = `${lat}°N, ${lon}°E`;
        try {
          const res = await fetch(
            `https://nominatim.openstreetmap.org/reverse?lat=${lat}&lon=${lon}&format=json&accept-language=${lang}`,
            { headers: { "Accept-Language": lang } }
          );
          const data = await res.json();
          const a = data.address || {};
          placeName = a.village || a.town || a.city_district || a.city || a.county || a.state_district || placeName;
        } catch (_) {}

        // Fill form + auto-save + auto-fetch weather & water
        const newLoc = { land_location: placeName, lat, lon };
        setLocForm(newLoc);
        setGeoLoading(false);

        try {
          setLocLoading(true);
          await setLandLocation({ land_location: placeName, lat, lon, auto_mode: false });
          setLocSaved(newLoc);
          setShowLocForm(false);
          setAutoFetched(false); // triggers auto weather + water calc via useEffect
        } catch (_) {
          setError(lang==="ta"?"இடம் சேமிக்கப்படவில்லை":"Location save failed.");
        } finally {
          setLocLoading(false);
        }
      },
      () => {
        setGeoLoading(false);
        setError(lang==="ta"?"Location அனுமதி மறுக்கப்பட்டது. Manual-ஆ இடம் தேர்ந்தெடு."
                :lang==="hi"?"लोकेशन अनुमति अस्वीकार। मैन्युअल रूप से स्थान चुनें।"
                :"Location access denied. Please select manually.");
      },
      { timeout: 10000, maximumAge: 60000 }
    );
  };

  // Autocomplete: instant filter on type, show all on click
  const handleLocNameChange = (e) => {
    const val = e.target.value;
    setLocForm(f => ({ ...f, land_location: val }));
    setSuggestions(filterPlaces(val, lang));
    setShowSug(true);
  };

  const handleLocFocus = () => {
    setSuggestions(filterPlaces(locForm.land_location, lang));
    setShowSug(true);
  };

  const handleSelectSuggestion = (place) => {
    setLocForm(f => ({
      ...f,
      land_location: getPlaceName(place, lang),
      lat: place.lat.toFixed(6),
      lon: place.lon.toFixed(6),
    }));
    setSuggestions([]);
    setShowSug(false);
  };

  // Close dropdown on outside click
  useEffect(() => {
    const handler = (e) => { if (wrapRef.current && !wrapRef.current.contains(e.target)) setShowSug(false); };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const handleSaveLocation = async (e) => {
    e.preventDefault();
    if (!locForm.land_location) return setError(lang==="ta"?"இடம் பெயர் தேவை":"Location name required.");
    try {
      setLocLoading(true);
      await setLandLocation({ land_location: locForm.land_location, lat: locForm.lat, lon: locForm.lon, auto_mode: false });
      setLocSaved({ ...locForm });
      setShowLocForm(false);
      setAutoFetched(false);
    } catch (_) {
      setError(lang==="ta"?"இடம் சேமிக்கப்படவில்லை":"Location save failed.");
    } finally {
      setLocLoading(false);
    }
  };

  const getWeatherIcon = (code) => {
    if (!code && code !== 0) return "🌤️";
    if (code === 0)  return "☀️";
    if (code <= 2)   return "🌤️";
    if (code <= 49)  return "🌫️";
    if (code <= 67)  return "🌧️";
    if (code <= 77)  return "❄️";
    return "⛈️";
  };

  // Texts
  const tx = {
    title:        lang==="ta"?"💧 நீர்ப்பாசன ஆலோசகர்":lang==="hi"?"💧 सिंचाई सलाहकार":"💧 Smart Irrigation Advisor",
    sub:          lang==="ta"?"வானிலை + மண் + இடம் வச்சு — இன்று எவ்வளவு நீர் தேவை என்று தெரிந்துகொள்ளுங்கள்"
                             :lang==="hi"?"मौसम + मिट्टी + स्थान के आधार पर — आज कितना पानी चाहिए जानें"
                             :"Based on weather + soil + location — find out exactly how much water your farm needs today",
    setLoc:       lang==="ta"?"📍 நிலம் இடம் அமை":lang==="hi"?"📍 भूमि स्थान सेट करें":"📍 Set Land Location",
    locName:      lang==="ta"?"நிலம் / கிராம பெயர்":lang==="hi"?"जमीन / गांव का नाम":"Land / Village Name",
    locPh:        lang==="ta"?"எ.கா. கோயம்புத்தூர் பண்ணை":lang==="hi"?"जैसे कोयम्बटूर फार्म":"e.g. Coimbatore Farm",
    lat:          lang==="ta"?"அட்சரேகை (Latitude)":lang==="hi"?"अक्षांश":"Latitude",
    lon:          lang==="ta"?"தீர்க்கரேகை (Longitude)":lang==="hi"?"देशांतर":"Longitude",
    gps:          lang==="ta"?"📱 GPS இடம் பெறு":lang==="hi"?"📱 GPS स्थान लें":"📱 Use GPS Location",
    gpsLoad:      lang==="ta"?"கண்டறிகிறது...":lang==="hi"?"पता लगा रहा है...":"Detecting...",
    save:         lang==="ta"?"💾 சேமி":lang==="hi"?"💾 सहेजें":"💾 Save",
    saving:       lang==="ta"?"சேமிக்கிறது...":lang==="hi"?"सहेज रहे हैं...":"Saving...",
    cancel:       lang==="ta"?"ரத்து":lang==="hi"?"रद्द करें":"Cancel",
    soilType:     lang==="ta"?"🌱 மண் வகை":lang==="hi"?"🌱 मिट्टी का प्रकार":"🌱 Soil Type",
    farmSize:     lang==="ta"?"📐 பண்ணை அளவு (ஏக்கர்)":lang==="hi"?"📐 खेत का आकार (एकड़)":"📐 Farm Size (Acres)",
    calculate:    lang==="ta"?"🔢 நீர் தேவை கணக்கிடு":lang==="hi"?"🔢 पानी की जरूरत गणना करें":"🔢 Calculate Water Need",
    calculating:  lang==="ta"?"⏳ கணக்கிடுகிறது...":lang==="hi"?"⏳ गणना हो रही है...":"⏳ Calculating...",
    noLocMsg:     lang==="ta"?"நிலம் இடம் அமைத்தால் — நேரடி வானிலை + துல்லியமான நீர் தேவை கணக்கீடு கிடைக்கும்."
                             :lang==="hi"?"भूमि स्थान सेट करने पर — लाइव मौसम + सटीक जल गणना मिलेगी।"
                             :"Set your land location to get live weather + accurate water calculations.",
    weatherFor:   lang==="ta"?"🌦️ நிலத்தின் வானிலை":lang==="hi"?"🌦️ जमीन का मौसम":"🌦️ Weather for Your Land",
    refresh:      lang==="ta"?"புதுப்பி":lang==="hi"?"रिफ्रेश":"Refresh",
    rain3day:     lang==="ta"?"3-நாள் மழை முன்னறிவிப்பு":lang==="hi"?"3-दिन वर्षा पूर्वानुमान":"3-Day Rain Forecast",
    totalWater:   lang==="ta"?"மொத்த நீர்":lang==="hi"?"कुल पानी":"Total Water",
    irrigHours:   lang==="ta"?"பாசன நேரம்":lang==="hi"?"सिंचाई समय":"Irrigate For",
    rainToday:    lang==="ta"?"மழை இன்று":lang==="hi"?"आज वर्षा":"Rain Today",
    temp:         lang==="ta"?"வெப்பநிலை":lang==="hi"?"तापमान":"Temperature",
    noIrrigNeeded:lang==="ta"?"நீர்ப்பாசனம் தேவையில்லை":lang==="hi"?"सिंचाई जरूरी नहीं":"No Irrigation Needed Today",
    reducedIrrig: lang==="ta"?"குறைந்த நீர்ப்பாசனம்":lang==="hi"?"कम सिंचाई":"Reduced Irrigation",
    irrigNeeded:  lang==="ta"?"நீர்ப்பாசனம் தேவை":lang==="hi"?"सिंचाई जरूरी":"Irrigation Needed",
    logTitle:     lang==="ta"?"பாசன செயல்பாடு பதிவு":lang==="hi"?"सिंचाई गतिविधि लॉग":"Irrigation Activity Log",
    manual:       lang==="ta"?"👆 கைமுறை":lang==="hi"?"👆 मैन्युअल":"👆 Manual",
    autoW:        lang==="ta"?"🤖 தானியங்கி (வானிலை)":lang==="hi"?"🤖 स्वचालित (मौसम)":"🤖 Auto (Weather)",
    liveWeather:  lang==="ta"?"நேரடி வானிலை தரவு":lang==="hi"?"लाइव मौसम डेटा":"Live weather data",
    baseRate:     lang==="ta"?"அடிப்படை விகிதம்":lang==="hi"?"मूल दर":"Base rate",
  };

  return (
    <MainLayout>
      <div className="page-header">
        <h1>{tx.title}</h1>
        <p>{tx.sub}</p>
      </div>

      {error && <div className="form-error" style={{ marginBottom:16 }}>⚠️ {error}</div>}

      {/* ═══ LOCATION + WEATHER CARD ═══ */}
      <div className="card-box" style={{ marginBottom:24 }}>
        <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", flexWrap:"wrap", gap:10, marginBottom:16 }}>
          <h3 className="section-title" style={{ margin:0 }}>
            <span><FaMapMarkerAlt /></span> {locSaved ? `📍 ${locSaved.land_location}` : tx.setLoc}
          </h3>
          <div style={{ display:"flex", gap:8 }}>
            {/* Show refresh only when location is saved */}
            {locSaved && (
              <button className="btn-outline-ag btn-sm" onClick={handleFetchWeather} disabled={weatherLoad}>
                <FaSync /> {weatherLoad ? "..." : tx.refresh}
              </button>
            )}
            {/* Show Set Location button only when no location saved */}
            {!locSaved && (
              <button className="btn-outline-ag btn-sm" onClick={() => setShowLocForm(!showLocForm)}>
                <FaMapMarkerAlt /> {tx.setLoc}
              </button>
            )}
          </div>
        </div>

        {/* Location Form */}
        {showLocForm && (
          <form onSubmit={handleSaveLocation} className="location-form" style={{ marginBottom:16 }}>
            <div className="form-group" ref={wrapRef} style={{ position:"relative" }}>
              <label>{tx.locName}</label>
              <input
                className="form-input"
                placeholder={tx.locPh}
                value={locForm.land_location}
                onChange={handleLocNameChange}
                onFocus={handleLocFocus}
                autoComplete="off"
              />
              {/* Autocomplete dropdown */}
              {showSug && suggestions.length > 0 && (
                <div style={{
                  position:"absolute", top:"100%", left:0, right:0, zIndex:999,
                  background:"var(--bg-primary,#fff)", border:"1px solid var(--border,#d0e0d0)",
                  borderRadius:10, boxShadow:"0 8px 24px rgba(0,0,0,0.12)", marginTop:4,
                  maxHeight:260, overflowY:"auto"
                }}>
                  {suggestions.map((place, i) => (
                    <div key={i}
                      onMouseDown={() => handleSelectSuggestion(place)}
                      style={{
                        padding:"10px 14px", cursor:"pointer",
                        borderBottom:"1px solid var(--border,#e8f0e8)",
                        transition:"background 0.15s"
                      }}
                      onMouseEnter={e => e.currentTarget.style.background="var(--bg-secondary,#f0f7f0)"}
                      onMouseLeave={e => e.currentTarget.style.background="transparent"}
                    >
                      <div style={{ fontWeight:600, fontSize:14, color:"var(--text-primary)" }}>
                        📍 {getPlaceName(place, lang)}
                      </div>
                      <div style={{ fontSize:11, color:"var(--text-muted)", marginTop:2 }}>
                        {place.en !== getPlaceName(place, lang) ? place.en + " — " : ""}
                        {place.lat.toFixed(4)}°N, {place.lon.toFixed(4)}°E
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
            <div className="form-row">
              <div className="form-group">
                <label>{tx.lat}</label>
                <input className="form-input" placeholder="e.g. 11.0168" value={locForm.lat}
                  onChange={e => setLocForm(f => ({...f, lat: e.target.value}))} />
              </div>
              <div className="form-group">
                <label>{tx.lon}</label>
                <input className="form-input" placeholder="e.g. 76.9558" value={locForm.lon}
                  onChange={e => setLocForm(f => ({...f, lon: e.target.value}))} />
              </div>
            </div>
            <button type="button" className="btn-outline-ag btn-sm" onClick={detectGPS} disabled={geoLoading}>
              {geoLoading ? tx.gpsLoad : tx.gps}
            </button>
            <div className="form-actions" style={{ marginTop:10 }}>
              <button type="button" className="btn-outline-ag" onClick={() => setShowLocForm(false)}>{tx.cancel}</button>
              <button type="submit" className="btn-primary-ag" disabled={locLoading}>
                {locLoading ? tx.saving : tx.save}
              </button>
            </div>
          </form>
        )}

        {/* No location set */}
        {!locSaved && !showLocForm && (
          <div className="no-location-msg">
            <span style={{ fontSize:48 }}>📍</span>
            <p>{tx.noLocMsg}</p>
            {/* Primary: GPS auto detect */}
            <button
              className="btn-primary-ag"
              style={{ marginBottom:10, width:"100%", maxWidth:320, justifyContent:"center" }}
              onClick={detectGPS}
              disabled={geoLoading}
            >
              {geoLoading
                ? (lang==="ta"?"📡 இடம் கண்டறிகிறது...":lang==="hi"?"📡 स्थान पता कर रहे हैं...":"📡 Detecting your location...")
                : (lang==="ta"?"📱 GPS மூலம் என் இடம் கண்டறி":lang==="hi"?"📱 GPS से मेरा स्थान पता करें":"📱 Detect My Location (GPS)")}
            </button>
            {/* Secondary: manual select */}
            <button
              className="btn-outline-ag"
              style={{ fontSize:13 }}
              onClick={() => setShowLocForm(true)}
            >
              ✏️ {lang==="ta"?"கைமுறையாக இடம் தேர்ந்தெடு":lang==="hi"?"मैन्युअल स्थान चुनें":"Select Location Manually"}
            </button>
          </div>
        )}

        {/* Weather display */}
        {weather && (
          <div className="weather-panel">
            <div className="weather-current">
              <span className="weather-icon">{getWeatherIcon(weather.current?.weatherCode)}</span>
              <div>
                <div className="weather-temp">{weather.current?.temperature}°C</div>
                <div className="weather-location">📍 {weather.location}</div>
              </div>
              <div className="weather-details">
                <span>💧 {weather.current?.humidity}%</span>
                <span>💨 {weather.current?.windSpeed} km/h</span>
                <span>🌧️ {weather.current?.precipitation}mm</span>
              </div>
            </div>

            {/* 3-day forecast */}
            <div className="rain-forecast">
              <h4>{tx.rain3day}</h4>
              <div className="forecast-row">
                {(weather.daily?.dates || []).map((date, i) => (
                  <div className="forecast-day" key={i}>
                    <div className="forecast-date">
                      {new Date(date).toLocaleDateString("en-IN", { weekday:"short" })}
                    </div>
                    <div className="forecast-rain">
                      {getWeatherIcon(null)} {(weather.daily.precipitation[i] || 0).toFixed(1)} mm
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Rain recommendation */}
            <div className={`motor-recommendation ${weather.rainExpected ? "recommendation--off" : "recommendation--on"}`}>
              <div className="rec-icon">{weather.rainExpected ? "🌧️" : "☀️"}</div>
              <div>
                <div className="rec-title">
                  {lang==="ta"?"மோட்டார் பரிந்துரை":lang==="hi"?"मोटर सिफारिश":"Water Recommendation"}:{" "}
                  <strong>{weather.motorSuggestion?.toUpperCase()}</strong>
                </div>
                <div className="rec-desc">{weather.recommendation}</div>
                {weather.rainExpected && (
                  <div className="rec-rain">
                    {lang==="ta"?"மொத்த மழை எதிர்பார்க்கப்படுகிறது":lang==="hi"?"कुल अपेक्षित वर्षा":"Total rain expected"}: {weather.totalRainMm}mm
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* ═══ SMART WATER CALCULATOR ═══ */}
      <div className="card-box" style={{ marginBottom:24 }}>
        <h3 className="section-title" style={{ marginBottom:16 }}>
          <span><FaTint /></span> {lang==="ta"?"💧 இன்று எவ்வளவு நீர் தேவை?":lang==="hi"?"💧 आज कितना पानी चाहिए?":"💧 How Much Water Today?"}
        </h3>

        <div style={{ display:"flex", gap:14, flexWrap:"wrap", alignItems:"flex-end", marginBottom:16 }}>
          {/* Soil type */}
          <div style={{ flex:"1 1 180px" }}>
            <label style={{ display:"block", fontSize:11, fontWeight:700, color:"var(--text-muted)", textTransform:"uppercase", letterSpacing:"0.5px", marginBottom:5 }}>
              {tx.soilType}
              {farmAutoFilled && (
                <span style={{ marginLeft:6, fontSize:10, color:"#2e7d32", fontWeight:400, textTransform:"none" }}>
                  ✅ {lang==="ta"?"பண்ணை விவரத்திலிருந்து":lang==="hi"?"खेत विवरण से":"from Farm Details"}
                </span>
              )}
            </label>
            <select className="form-input" value={soilType} onChange={e => setSoilType(e.target.value)}>
              {SOIL_TYPES.map(s => <option key={s} value={s}>{s}</option>)}
            </select>
          </div>

          {/* Farm size */}
          <div style={{ flex:"1 1 140px" }}>
            <label style={{ display:"block", fontSize:11, fontWeight:700, color:"var(--text-muted)", textTransform:"uppercase", letterSpacing:"0.5px", marginBottom:5 }}>
              {tx.farmSize}
            </label>
            <input type="number" min="0.1" step="0.5" className="form-input"
              value={farmAcres} onChange={e => setFarmAcres(e.target.value)} placeholder="e.g. 2.5" />
          </div>

          <button className="btn-primary-ag" onClick={handleCalculate} disabled={waterLoading} style={{ flex:"0 0 auto", height:42 }}>
            {waterLoading ? tx.calculating : tx.calculate}
          </button>
        </div>

        {/* Result */}
        {waterUsage && (
          <div>
            {/* Status banner */}
            <div style={{
              borderRadius:12, padding:"16px 20px", marginBottom:16,
              background: waterUsage.status==="skip" ? "#e3f2fd" : waterUsage.status==="reduce" ? "#fff8e1" : "#e8f5e9",
              border:`2px solid ${waterUsage.status==="skip" ? "#90caf9" : waterUsage.status==="reduce" ? "#ffe082" : "#a5d6a7"}`,
              display:"flex", alignItems:"flex-start", gap:14
            }}>
              <span style={{ fontSize:36 }}>
                {waterUsage.status==="skip" ? "🌧️" : waterUsage.status==="reduce" ? "🌦️" : "☀️"}
              </span>
              <div>
                <div style={{ fontWeight:800, fontSize:16, color:"var(--text-primary)" }}>
                  {waterUsage.status==="skip"   ? tx.noIrrigNeeded :
                   waterUsage.status==="reduce" ? tx.reducedIrrig  : tx.irrigNeeded}
                </div>
                <div style={{ fontSize:13, color:"var(--text-secondary)", marginTop:6, lineHeight:1.6 }}>
                  {waterUsage.recommendation}
                </div>
              </div>
            </div>

            {/* 4 stat cards */}
            <div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fill, minmax(155px,1fr))", gap:12 }}>
              {[
                { label:tx.totalWater,  value:`${(waterUsage.waterNeed?.totalLitres||0).toLocaleString()} L`, icon:"💧", color:"#1565c0" },
                { label:tx.irrigHours,  value:`${waterUsage.waterNeed?.irrigationHours||0} hrs`,              icon:"⏱️", color:"#2e7d32" },
                { label:tx.rainToday,   value:`${waterUsage.weather?.rainMm??0} mm`,                          icon:"🌧️", color:"#0097a7" },
                { label:tx.temp,        value:`${waterUsage.weather?.temperature??"—"}°C`,                    icon:"🌡️", color:"#e65100" },
              ].map((s, i) => (
                <div key={i} style={{
                  background:"var(--bg-secondary,#f8fbf8)", border:"1px solid var(--border,#e0e7ef)",
                  borderRadius:12, padding:"14px 16px", borderLeft:`4px solid ${s.color}`
                }}>
                  <div style={{ fontSize:11, color:"var(--text-muted)", marginBottom:5 }}>{s.icon} {s.label}</div>
                  <div style={{ fontSize:22, fontWeight:800, color:s.color }}>{s.value}</div>
                </div>
              ))}
            </div>

            {waterUsage.weatherAvailable ? (
              <div style={{ fontSize:12, color:"var(--text-muted)", marginTop:12, padding:"8px 12px", background:"var(--bg-secondary)", borderRadius:8 }}>
                📍 {tx.liveWeather}: <strong>{waterUsage.locationName}</strong> &nbsp;|&nbsp;
                💧 {tx.baseRate}: {waterUsage.waterNeed?.baseRateLPerAcreHr} L/acre/hr ({soilType})
              </div>
            ) : (
              <div style={{ fontSize:12, color:"#f57f17", marginTop:12, padding:"8px 12px", background:"#fff8e1", borderRadius:8 }}>
                ⚠️ {lang==="ta"?"நிலம் இடம் அமைக்கவில்லை — மழை இல்லாமல் கணக்கிடப்பட்டது. துல்லியமான முடிவுக்கு இடம் அமைக்கவும்."
                   :lang==="hi"?"भूमि स्थान सेट नहीं — बिना वर्षा डेटा के गणना। सटीक परिणाम के लिए स्थान सेट करें।"
                   :"Land location not set — calculated without rain data. Set location for accurate results."}
              </div>
            )}
          </div>
        )}

        {!waterUsage && !waterLoading && (
          <div style={{ textAlign:"center", padding:"24px", color:"var(--text-muted)", fontSize:13 }}>
            {lang==="ta"?"மண் வகை + பண்ணை அளவு தேர்ந்தெடுத்து Calculate பண்ணுங்கள்."
            :lang==="hi"?"मिट्टी का प्रकार + खेत का आकार चुनें और गणना करें।"
            :"Select soil type and farm size, then click Calculate."}
          </div>
        )}
      </div>

      {/* ═══ IRRIGATION ACTIVITY LOG ═══ */}
      {logs.length > 0 && (
        <div className="card-box">
          <h3 className="section-title" style={{ marginBottom:14 }}>
            <span><FaHistory /></span> {tx.logTitle}
          </h3>
          <div className="logs-list">
            {logs.map((log, i) => (
              <div className="log-item" key={i}>
                <span className={`log-action log-action--${log.action}`}>
                  {log.action === "on" ? "▶ ON" : "■ OFF"}
                </span>
                <span className="log-trigger">
                  {log.triggered_by === "auto_weather" ? tx.autoW : tx.manual}
                </span>
                <span className="log-time">
                  {new Date(log.created_at).toLocaleString("en-IN")}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ✅ Smart Flow — Step 2: Weather done → go Soil | Step 5: Irrigation done → go Disease */}
      <NextStepCard currentStep={waterUsage ? "irrigationDone" : "weatherSet"} />
    </MainLayout>
  );
}
