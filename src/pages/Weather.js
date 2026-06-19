import { useState, useEffect, useCallback } from "react";
import { FaCloudRain, FaWind, FaTint, FaSun, FaCloudSun, FaMapMarkerAlt, FaSync } from "react-icons/fa";
import MainLayout from "../layouts/MainLayout";
import { useApp } from "../context/AppContext";
import "../styles/global.css";
import "../styles/Weather.css";

/* ── Open-Meteo weather code → icon + description ── */
const WX_CODE = (code) => {
  if (code === 0)              return { icon:"☀️",  desc:"Clear Sky" };
  if (code <= 2)               return { icon:"🌤️",  desc:"Partly Cloudy" };
  if (code === 3)              return { icon:"☁️",  desc:"Overcast" };
  if (code <= 49)              return { icon:"🌫️",  desc:"Foggy" };
  if (code <= 59)              return { icon:"🌦️",  desc:"Drizzle" };
  if (code <= 67)              return { icon:"🌧️",  desc:"Rain" };
  if (code <= 77)              return { icon:"❄️",  desc:"Snow" };
  if (code <= 82)              return { icon:"🌧️",  desc:"Rain Showers" };
  if (code <= 86)              return { icon:"🌨️",  desc:"Snow Showers" };
  return                              { icon:"⛈️",  desc:"Thunderstorm" };
};

const DAY_NAMES = {
  en: ["Sun","Mon","Tue","Wed","Thu","Fri","Sat"],
  ta: ["ஞாயி","திங்","செவ்","புத","வியா","வெள்","சனி"],
  hi: ["रवि","सोम","मंगल","बुध","गुरु","शुक्र","शनि"],
};

export default function Weather() {
  const { t, lang } = useApp();
  const [time, setTime]           = useState(new Date());
  const [weather, setWeather]     = useState(null);
  const [loading, setLoading]     = useState(false);
  const [error, setError]         = useState("");
  const [locationName, setLocationName] = useState("");
  const [coords, setCoords]       = useState(null);

  // Clock
  useEffect(() => {
    const timer = setInterval(() => setTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  // Auto-fetch on mount using browser GPS
  useEffect(() => {
    fetchByGPS();
  }, []);

  const fetchByGPS = () => {
    if (!navigator.geolocation) {
      setError("Geolocation not supported by your browser.");
      return;
    }
    setLoading(true);
    setError("");
    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        const lat = pos.coords.latitude.toFixed(4);
        const lon = pos.coords.longitude.toFixed(4);
        setCoords({ lat, lon });
        await fetchWeather(lat, lon);
      },
      (err) => {
        setLoading(false);
        setError(
          lang === "ta"
            ? "📍 Location access denied. Browser-ல location allow பண்ணுங்க."
            : "📍 Location access denied. Please allow location in your browser."
        );
      },
      { timeout: 10000 }
    );
  };

  const fetchWeather = async (lat, lon) => {
    try {
      setLoading(true);
      setError("");

      // Reverse geocode using Open-Meteo's free geocoding
      let city = `${lat}, ${lon}`;
      try {
        const geoRes = await fetch(
          `https://nominatim.openstreetmap.org/reverse?lat=${lat}&lon=${lon}&format=json`
        );
        const geoData = await geoRes.json();
        city = geoData.address?.city ||
               geoData.address?.town ||
               geoData.address?.village ||
               geoData.address?.county ||
               city;
      } catch (_) {}
      setLocationName(city);

      // Fetch weather from Open-Meteo (free, no API key)
      const url = `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}` +
        `&current=temperature_2m,relative_humidity_2m,apparent_temperature,precipitation,` +
        `weathercode,wind_speed_10m,wind_direction_10m,pressure_msl,visibility,uv_index` +
        `&daily=weathercode,temperature_2m_max,temperature_2m_min,precipitation_sum,` +
        `wind_speed_10m_max,precipitation_probability_max` +
        `&forecast_days=7&timezone=Asia%2FKolkata`;

      const res  = await fetch(url);
      const data = await res.json();
      setWeather(data);
    } catch (err) {
      setError("Weather fetch failed. Check your internet connection.");
    } finally {
      setLoading(false);
    }
  };

  const current  = weather?.current;
  const daily    = weather?.daily;

  // Farm impact logic based on real weather
  const getFarmImpacts = () => {
    if (!current) return [];
    const rain = current.precipitation || 0;
    const temp = current.temperature_2m || 30;
    const humid = current.relative_humidity_2m || 60;

    return [
      {
        crop: lang==="ta" ? "🌾 நெல் (Rice)" : lang==="hi" ? "🌾 चावल" : "🌾 Rice",
        impact: rain > 10 ? (lang==="ta" ? "மழை நல்லது — பாசனம் தேவையில்லை" : "Good rain — no irrigation needed")
                          : (lang==="ta" ? "நீர்ப்பாசனம் தேவை" : "Irrigation needed"),
        ok: rain > 5
      },
      {
        crop: lang==="ta" ? "🌿 கோதுமை (Wheat)" : lang==="hi" ? "🌿 गेहूं" : "🌿 Wheat",
        impact: temp > 35 ? (lang==="ta" ? "⚠️ வெப்பம் அதிகம் — கவலைப்படுங்கள்" : "⚠️ High temp stress")
                          : (lang==="ta" ? "வெப்பநிலை சரியாக உள்ளது" : "Temperature suitable"),
        ok: temp <= 35
      },
      {
        crop: lang==="ta" ? "🎋 கரும்பு (Sugarcane)" : lang==="hi" ? "🎋 गन्ना" : "🎋 Sugarcane",
        impact: humid > 70 ? (lang==="ta" ? "ஈரப்பதம் நல்லது" : "Good humidity for growth")
                           : (lang==="ta" ? "ஈரப்பதம் குறைவு" : "Low humidity — monitor"),
        ok: humid > 70
      },
      {
        crop: lang==="ta" ? "🌸 பருத்தி (Cotton)" : lang==="hi" ? "🌸 कपास" : "🌸 Cotton",
        impact: rain > 20 ? (lang==="ta" ? "⚠️ அதிக மழை — நோய் வராமல் கவனி" : "⚠️ Heavy rain — watch for disease")
                          : (lang==="ta" ? "வானிலை சாதகமாக உள்ளது" : "Favourable conditions"),
        ok: rain <= 20
      },
    ];
  };

  // Smart farming tips based on real data
  const getSmartTips = () => {
    if (!current) return [t.tip1, t.tip2, t.tip3, t.tip4];
    const rain = current.precipitation || 0;
    const temp = current.temperature_2m || 30;
    const uv   = current.uv_index || 0;
    const tips = [];

    if (rain > 10) tips.push(lang==="ta" ? "💧 இன்று பாசனம் தேவையில்லை — மழை போதும்." : "💧 Skip irrigation today — rain is sufficient.");
    else           tips.push(lang==="ta" ? "💧 இன்று பாசனம் செய்யுங்கள் — மழை இல்லை." : "💧 Irrigate today — no rainfall expected.");

    if (temp > 35) tips.push(lang==="ta" ? "🌡️ வெப்பம் அதிகம் — காலை / மாலை பாசனம் பண்ணுங்கள்." : "🌡️ High heat — irrigate early morning or evening.");
    else           tips.push(lang==="ta" ? "🌡️ வெப்பநிலை சரியாக உள்ளது." : "🌡️ Temperature is ideal for field work.");

    if (uv > 7)    tips.push(lang==="ta" ? "☀️ UV அதிகம் — மதியம் வெளியில் வேலை செய்வதை தவிர்க்கவும்." : "☀️ High UV — avoid working outdoors midday.");
    else           tips.push(lang==="ta" ? "☀️ UV சாதாரணம் — நாள் முழுவதும் வேலை செய்யலாம்." : "☀️ UV normal — safe to work throughout the day.");

    tips.push(lang==="ta" ? "🌱 வானிலை மாற்றங்களை தினமும் கண்காணியுங்கள்." : "🌱 Check weather daily for best farm decisions.");
    return tips;
  };

  const wxNow = current ? WX_CODE(current.weathercode) : { icon:"🌤️", desc:"Loading..." };

  return (
    <MainLayout>
      <div className="page-header">
        <div style={{ display:"flex", justifyContent:"space-between", alignItems:"flex-start", flexWrap:"wrap", gap:12 }}>
          <div>
            <h1>☁️ {t.weatherOverview}</h1>
            <p>{t.weatherSub}</p>
          </div>
          <button
            className="btn-outline-ag"
            onClick={fetchByGPS}
            disabled={loading}
            style={{ display:"flex", alignItems:"center", gap:8, marginTop:8 }}
          >
            <FaMapMarkerAlt />
            {loading
              ? (lang==="ta" ? "⏳ வானிலை பெறுகிறது..." : "⏳ Fetching weather...")
              : (lang==="ta" ? "📍 என் இடம் வானிலை" : lang==="hi" ? "📍 मेरे स्थान का मौसम" : "📍 My Location Weather")}
          </button>
        </div>
      </div>

      {error && (
        <div className="alert-box alert-box--warning" style={{ marginBottom:16 }}>
          <div className="alert-box__icon">⚠️</div>
          <div className="alert-box__msg">{error}</div>
        </div>
      )}

      {loading && (
        <div style={{ textAlign:"center", padding:"40px", color:"var(--text-secondary)" }}>
          <div style={{ fontSize:40, marginBottom:12 }}>🌤️</div>
          <div>{lang==="ta" ? "உங்கள் இடத்தின் வானிலை பெறுகிறது..." : "Fetching live weather for your location..."}</div>
        </div>
      )}

      {!loading && weather && current && (
        <>
          {/* ── HERO ── */}
          <div className="weather-hero">
            <div className="weather-hero__left">
              <div className="weather-hero__location">📍 {locationName}</div>
              <div className="weather-hero__time">
                {time.toLocaleTimeString()} · {time.toLocaleDateString()}
              </div>
              <div className="weather-hero__temp">{Math.round(current.temperature_2m)}°C</div>
              <div className="weather-hero__desc">
                {wxNow.icon} {wxNow.desc}
                <span style={{ fontSize:13, color:"rgba(255,255,255,0.7)", marginLeft:8 }}>
                  {lang==="ta" ? "உணரும் வெப்பம்:" : "Feels like:"} {Math.round(current.apparent_temperature)}°C
                </span>
              </div>
            </div>
            <div className="weather-hero__right">
              {[
                { icon:<FaTint />,     label:t.humidity_lbl,  value:`${current.relative_humidity_2m}%` },
                { icon:<FaWind />,     label:t.wind,          value:`${Math.round(current.wind_speed_10m)} km/h` },
                { icon:<FaCloudRain />,label:t.rainfall,      value:`${current.precipitation} mm` },
                { icon:<FaSun />,      label:t.uvIndex,       value:`${current.uv_index ?? "—"} ${current.uv_index > 7 ? "🔴 High" : current.uv_index > 3 ? "🟡 Mod" : "🟢 Low"}` },
                { icon:<FaCloudSun />, label:t.visibility,    value:current.visibility ? `${(current.visibility/1000).toFixed(1)} km` : "—" },
                { icon:<FaSun />,      label:t.pressure,      value:`${Math.round(current.pressure_msl)} hPa` },
              ].map((d,i) => (
                <div className="weather-detail" key={i}>
                  {d.icon}
                  <span className="weather-detail__label">{d.label}</span>
                  <span className="weather-detail__value">{d.value}</span>
                </div>
              ))}
            </div>
          </div>

          {/* ── 7-DAY FORECAST ── */}
          <h3 className="section-title" style={{ marginBottom:16 }}>
            <span>📅</span> {t.dayForecast}
          </h3>
          <div className="forecast-row">
            {(daily?.time || []).map((date, i) => {
              const wx = WX_CODE(daily.weathercode[i]);
              const dayDate = new Date(date);
              const dayName = i === 0
                ? (lang==="ta" ? "இன்று" : lang==="hi" ? "आज" : "Today")
                : i === 1
                ? (lang==="ta" ? "நாளை" : lang==="hi" ? "कल" : "Tomorrow")
                : DAY_NAMES[lang]?.[dayDate.getDay()] || dayDate.toLocaleDateString("en-IN", { weekday:"short" });

              return (
                <div className={`forecast-card ${i===0?"forecast-card--today":""}`} key={i}>
                  <div className="forecast-card__day">{dayName}</div>
                  <div className="forecast-card__icon">{wx.icon}</div>
                  <div className="forecast-card__desc" style={{ fontSize:11 }}>{wx.desc}</div>
                  <div className="forecast-card__temp">
                    <span className="forecast-card__high">{Math.round(daily.temperature_2m_max[i])}°</span>
                    <span className="forecast-card__low">{Math.round(daily.temperature_2m_min[i])}°</span>
                  </div>
                  <div className="forecast-card__rain">
                    🌧 {daily.precipitation_probability_max[i] ?? 0}%
                  </div>
                  <div className="forecast-card__wind">
                    💨 {Math.round(daily.wind_speed_10m_max[i])} km/h
                  </div>
                </div>
              );
            })}
          </div>

          {/* ── FARM IMPACT + TIPS ── */}
          <div className="two-col" style={{ marginTop:24 }}>
            <div className="card-box">
              <h3 className="section-title"><span>🌾</span> {t.farmImpact}</h3>
              {getFarmImpacts().map((r,i) => (
                <div key={i} style={{ display:"flex", gap:12, padding:"12px 0", borderBottom:"1px solid var(--border)" }}>
                  <span style={{ fontSize:20 }}>{r.ok ? "✅" : "⚠️"}</span>
                  <div>
                    <div style={{ fontWeight:600, fontSize:14, color:"var(--text-primary)" }}>{r.crop}</div>
                    <div style={{ fontSize:13, color:"var(--text-secondary)", marginTop:2 }}>{r.impact}</div>
                  </div>
                </div>
              ))}
            </div>
            <div className="card-box">
              <h3 className="section-title"><span>💡</span> {t.recommendations}</h3>
              {getSmartTips().map((tip,i) => (
                <div key={i} style={{ display:"flex", gap:10, padding:"10px 0", borderBottom:"1px solid var(--border)" }}>
                  <span style={{ color:"var(--primary-light)", flexShrink:0, marginTop:2 }}>→</span>
                  <span style={{ fontSize:14, color:"var(--text-secondary)", lineHeight:1.5 }}>{tip}</span>
                </div>
              ))}
            </div>
          </div>
        </>
      )}

      {!loading && !weather && !error && (
        <div style={{ textAlign:"center", padding:"60px 20px", color:"var(--text-secondary)" }}>
          <div style={{ fontSize:60, marginBottom:16 }}>🌍</div>
          <div style={{ fontSize:18, fontWeight:700, marginBottom:8 }}>
            {lang==="ta" ? "உங்கள் இடத்தின் நேரடி வானிலை" : "Live Weather for Your Location"}
          </div>
          <p style={{ marginBottom:20, color:"var(--text-muted)" }}>
            {lang==="ta"
              ? "Browser-ல location permission கொடுங்கள் — நேரடி வானிலை காட்டும்."
              : "Allow location access to see real-time weather for your farm."}
          </p>
          <button className="btn-primary-ag" onClick={fetchByGPS} style={{ margin:"0 auto" }}>
            <FaMapMarkerAlt /> {lang==="ta" ? "📍 என் இடம் வானிலை பெறு" : "📍 Get My Location Weather"}
          </button>
        </div>
      )}
    </MainLayout>
  );
}
