import { useState, useEffect } from "react";
import { FaSync, FaThermometerHalf, FaTint, FaSeedling, FaFlask } from "react-icons/fa";
import {
  Chart as ChartJS, CategoryScale, LinearScale, PointElement,
  LineElement, BarElement, Filler, Tooltip, Legend
} from "chart.js";
import { Line } from "react-chartjs-2";
import MainLayout from "../layouts/MainLayout";
import { useApp } from "../context/AppContext";
import { getLatestSensors, getCropRecommendation } from "../api/api";
import useSensorSocket from "../hooks/useSensorSocket";
import "../styles/global.css";
import "../styles/Sensors.css";

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, BarElement, Filler, Tooltip, Legend);

export default function Sensors() {
  const { t, lang, user } = useApp();

  const [liveData,    setLiveData]    = useState([]);
  const [refreshing,  setRefreshing]  = useState(false);
  const [lastRefresh, setLastRefresh] = useState(new Date());
  const [cropRec,     setCropRec]     = useState(null);
  const [history,     setHistory]     = useState([]);

  /* ── WebSocket: real-time updates ── */
  const { sensorData: wsSensorData, connected: wsConnected } = useSensorSocket(user?.id);

  useEffect(() => {
    if (wsSensorData && wsSensorData.length > 0) {
      setLiveData(wsSensorData);
      setHistory(prev => {
        const now = new Date().toLocaleTimeString();
        const s = wsSensorData[0];
        const newPt = {
          time: now,
          temperature:   s.temperature,
          humidity:      s.humidity,
          soil_moisture: s.soil_moisture,
          ph_level:      s.ph_level,
        };
        const updated = [...prev, newPt].slice(-10);
        return updated;
      });
      setLastRefresh(new Date());
    }
  }, [wsSensorData]);

  useEffect(() => {
    if (user) { fetchSensors(); fetchCropRec(); }
  }, [user]);

  const fetchSensors = async () => {
    try {
      const res = await getLatestSensors();
      if (res.data?.length > 0) {
        setLiveData(res.data);
        const s = res.data[0];
        setHistory(prev => {
          const newPt = {
            time: new Date().toLocaleTimeString(),
            temperature:   s.temperature,
            humidity:      s.humidity,
            soil_moisture: s.soil_moisture,
            ph_level:      s.ph_level,
          };
          return [...prev, newPt].slice(-10);
        });
      }
    } catch (_) {}
    setLastRefresh(new Date());
  };

  const fetchCropRec = async () => {
    try {
      const res = await getCropRecommendation();
      if (res.data.success) setCropRec(res.data);
    } catch (_) {}
  };

  const handleRefresh = () => {
    setRefreshing(true);
    fetchSensors().finally(() => { setRefreshing(false); fetchCropRec(); });
  };

  const sensor = liveData[0] || null;
  const v = (val, unit="") => val != null ? `${(+val).toFixed(1)}${unit}` : "—";

  /* ── Main sensor metric cards ── */
  const metrics = sensor ? [
    { icon:<FaThermometerHalf />, label: lang==="ta"?"வெப்பநிலை":lang==="hi"?"तापमान":"Temperature",    value:v(sensor.temperature,"°C"),   color:"#e65100", status: +sensor.temperature>38?"high":+sensor.temperature<15?"low":"normal" },
    { icon:<FaTint />,            label: lang==="ta"?"ஈரப்பதம்":lang==="hi"?"नमी":"Humidity",           value:v(sensor.humidity,"%"),        color:"#0277bd", status: +sensor.humidity>85?"high":+sensor.humidity<30?"low":"normal" },
    { icon:<FaSeedling />,        label: lang==="ta"?"மண் ஈரம்":lang==="hi"?"मिट्टी नमी":"Soil Moisture",value:v(sensor.soil_moisture,"%"),  color:"#2e7d32", status: +sensor.soil_moisture<30?"low":+sensor.soil_moisture>90?"high":"normal" },
    { icon:<FaFlask />,           label: lang==="ta"?"pH அளவு":lang==="hi"?"pH स्तर":"pH Level",         value:v(sensor.ph_level,""),        color:"#6a1b9a", status: +sensor.ph_level<5.5||+sensor.ph_level>8?"high":"normal" },
    { icon:<span>N</span>,        label: lang==="ta"?"நைட்ரஜன்":lang==="hi"?"नाइट्रोजन":"Nitrogen",      value:v(sensor.nitrogen," mg/kg"),  color:"#1565c0", status:"normal" },
    { icon:<span>P</span>,        label: lang==="ta"?"பாஸ்பரஸ்":lang==="hi"?"फॉस्फोरस":"Phosphorus",    value:v(sensor.phosphorus," mg/kg"),color:"#0097a7", status:"normal" },
    { icon:<span>K</span>,        label: lang==="ta"?"பொட்டாசியம்":lang==="hi"?"पोटेशियम":"Potassium",  value:v(sensor.potassium," mg/kg"), color:"#558b2f", status:"normal" },
  ] : [];

  const statusColor = { normal:"#2e7d32", high:"#c62828", low:"#f57f17" };
  const statusLabel = {
    normal: lang==="ta"?"சரியான அளவு":lang==="hi"?"सामान्य":"Normal",
    high:   lang==="ta"?"அதிகம்":lang==="hi"?"अधिक":"High",
    low:    lang==="ta"?"குறைவு":lang==="hi"?"कम":"Low",
  };

  /* ── Line chart for last 10 readings ── */
  const labels = history.map(h => h.time);
  const lineData = {
    labels,
    datasets: [
      { label: lang==="ta"?"வெப்பநிலை °C":"Temperature °C", data: history.map(h=>h.temperature), borderColor:"#e65100", backgroundColor:"rgba(230,81,0,0.07)", tension:0.4, fill:true, pointRadius:3 },
      { label: lang==="ta"?"மண் ஈரம் %":"Soil Moisture %",  data: history.map(h=>h.soil_moisture), borderColor:"#2e7d32", backgroundColor:"rgba(46,125,50,0.07)", tension:0.4, fill:true, pointRadius:3 },
      { label: lang==="ta"?"ஈரப்பதம் %":"Humidity %",        data: history.map(h=>h.humidity), borderColor:"#0277bd", backgroundColor:"rgba(2,119,189,0.07)", tension:0.4, fill:true, pointRadius:3 },
    ],
  };
  const chartOpts = {
    responsive:true, maintainAspectRatio:false,
    plugins:{ legend:{position:"top",labels:{usePointStyle:true,font:{size:11}}}, tooltip:{mode:"index",intersect:false} },
    scales:{ y:{grid:{color:"rgba(128,128,128,0.08)"}}, x:{grid:{display:false}, ticks:{font:{size:10}}} },
  };

  return (
    <MainLayout>
      <div className="page-header">
        <div>
          <h1>📡 {t.sensorMonitor}</h1>
          <p>{lang==="ta"?"உங்கள் பண்ணையின் நேரடி மண் மற்றும் சூழல் தரவு":lang==="hi"?"आपके खेत का लाइव मिट्टी और पर्यावरण डेटा":"Live soil and environment data for your farm"}</p>
        </div>
        <div style={{ display:"flex", alignItems:"center", gap:10, flexWrap:"wrap" }}>
          {/* Live/Simulated badge */}
          <span style={{
            display:"inline-flex", alignItems:"center", gap:6,
            background: sensor?.simulated ? "#e3f2fd" : "#e8f5e9",
            color: sensor?.simulated ? "#0277bd" : "#2e7d32",
            padding:"5px 14px", borderRadius:20, fontSize:12, fontWeight:700,
            border:`1px solid ${sensor?.simulated ? "#90caf9" : "#a5d6a7"}`
          }}>
            <span style={{ width:8, height:8, borderRadius:"50%", background:sensor?.simulated?"#0277bd":"#2e7d32", animation:"pulse 2s infinite" }} />
            {sensor?.simulated
              ? (lang==="ta"?"🖥️ மென்பொருள் உருவகப்படுத்தல்":lang==="hi"?"🖥️ सॉफ्टवेयर सिमुलेशन":"🖥️ Software Simulation")
              : (lang==="ta"?"📡 நேரடி தரவு":lang==="hi"?"📡 लाइव डेटा":"📡 Live Data")}
          </span>
          {/* WebSocket indicator */}
          <span style={{
            display:"inline-flex", alignItems:"center", gap:5,
            background: wsConnected ? "#f1f8e9" : "#fafafa",
            color: wsConnected ? "#558b2f" : "#90a4ae",
            padding:"4px 12px", borderRadius:20, fontSize:11, fontWeight:600,
            border:`1px solid ${wsConnected ? "#aed581" : "#e0e0e0"}`
          }}>
            {wsConnected
              ? (lang==="ta"?"🔴 நேரலை இணைப்பு":lang==="hi"?"🔴 लाइव कनेक्शन":"🔴 Live Connected")
              : (lang==="ta"?"⚪ இணைக்கிறது...":lang==="hi"?"⚪ कनेक्ट हो रहा है...":"⚪ Connecting...")}
          </span>
          <button className="btn-primary-ag" onClick={handleRefresh} disabled={refreshing}>
            <FaSync className={refreshing ? "spin" : ""} />
            {refreshing ? (lang==="ta"?"புதுப்பிக்கிறது...":"Refreshing...") : (lang==="ta"?"புதுப்பி":"Refresh")}
          </button>
        </div>
      </div>

      {/* ── Last refresh time ── */}
      <div style={{ fontSize:11, color:"var(--text-muted)", marginBottom:16, marginTop:-8 }}>
        🕐 {lang==="ta"?"கடைசி புதுப்பிப்பு:":lang==="hi"?"अंतिम अपडेट:":"Last updated:"} {lastRefresh.toLocaleTimeString()} &nbsp;|&nbsp;
        {lang==="ta"?"ஒவ்வொரு 10 விநாடியும் தானாக புதுப்பிக்கிறது":"Auto-refreshes every 10 seconds"}
      </div>

      {!sensor && (
        <div style={{ textAlign:"center", padding:"50px 20px", color:"var(--text-muted)" }}>
          <div style={{ fontSize:48, marginBottom:12 }}>📡</div>
          <div style={{ fontSize:16, fontWeight:700 }}>
            {lang==="ta"?"தரவு ஏற்றுகிறது...":lang==="hi"?"डेटा लोड हो रहा है...":"Loading sensor data..."}
          </div>
          <p style={{ fontSize:13, marginTop:8 }}>
            {lang==="ta"?"Software simulation தானாக data generate பண்ணும்":"Sensor data will appear automatically"}
          </p>
        </div>
      )}

      {sensor && (
        <>
          {/* ── 7 Metric Cards ── */}
          <div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fill, minmax(160px,1fr))", gap:12, marginBottom:24 }}>
            {metrics.map((m, i) => (
              <div key={i} style={{
                background:"var(--bg-card, #fff)", border:"1px solid var(--border, #e0e7ef)",
                borderRadius:14, padding:"16px 14px", borderTop:`4px solid ${m.color}`,
                boxShadow:"0 2px 8px rgba(0,0,0,0.04)"
              }}>
                <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", marginBottom:10 }}>
                  <div style={{ background:m.color+"18", color:m.color, borderRadius:8, width:34, height:34, display:"flex", alignItems:"center", justifyContent:"center", fontSize:16, fontWeight:800 }}>
                    {m.icon}
                  </div>
                  <span style={{ fontSize:10, fontWeight:700, color:statusColor[m.status], background:statusColor[m.status]+"18", padding:"2px 8px", borderRadius:12 }}>
                    {statusLabel[m.status]}
                  </span>
                </div>
                <div style={{ fontSize:11, color:"var(--text-muted)", marginBottom:3 }}>{m.label}</div>
                <div style={{ fontSize:22, fontWeight:800, color:m.color }}>{m.value}</div>
              </div>
            ))}
          </div>

          {/* ── Live Trend Chart ── */}
          {history.length > 1 && (
            <div className="card-box" style={{ marginBottom:24 }}>
              <h3 className="section-title" style={{ marginBottom:16 }}>
                <span>📈</span> {lang==="ta"?"நேரடி வாசிப்பு பதிவு":lang==="hi"?"लाइव रीडिंग ट्रेंड":"Live Reading Trend"}
                <span style={{ fontSize:11, color:"var(--text-muted)", marginLeft:10, fontWeight:400 }}>
                  {lang==="ta"?"கடைசி 10 வாசிப்புகள்":"Last 10 readings"}
                </span>
              </h3>
              <div style={{ height:220 }}>
                <Line data={lineData} options={chartOpts} />
              </div>
            </div>
          )}

          {/* ── Crop Recommendation ── */}
          {cropRec && cropRec.recommendations?.length > 0 && (
            <div className="card-box" style={{ marginBottom:24, border:"2px solid #a5d6a7" }}>
              <h3 className="section-title">
                <span>🌾</span> {lang==="ta"?"மண் தரவு அடிப்படையில் பயிர் பரிந்துரை":lang==="hi"?"मिट्टी डेटा के आधार पर फसल सिफारिश":"Crop Recommendation Based on Soil Data"}
              </h3>
              <div style={{ display:"flex", gap:12, flexWrap:"wrap", marginTop:8 }}>
                {cropRec.recommendations.map((r, i) => (
                  <div key={i} style={{
                    background:"var(--bg-secondary,#f8fbf8)", border:"1px solid var(--border,#e0e7ef)",
                    borderRadius:12, padding:"14px 18px", minWidth:160, flex:"1 1 160px",
                    borderLeft:`4px solid ${i===0?"#2e7d32":i===1?"#0277bd":"#e65100"}`
                  }}>
                    <div style={{ fontSize:16, fontWeight:800, color:i===0?"#2e7d32":i===1?"#0277bd":"#e65100" }}>🌱 {r.crop}</div>
                    <div style={{ fontSize:22, fontWeight:800, color:"var(--text-primary)", marginTop:4 }}>{r.confidence}%</div>
                    <div style={{ fontSize:11, color:"var(--text-muted)", marginTop:4 }}>{r.reason}</div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* ── NPK Status ── */}
          <div className="card-box">
            <h3 className="section-title" style={{ marginBottom:16 }}>
              <span>🧪</span> {lang==="ta"?"NPK மண் ஊட்டச்சத்து நிலை":lang==="hi"?"NPK मिट्टी पोषक स्थिति":"NPK Soil Nutrient Status"}
            </h3>
            <div style={{ display:"flex", flexDirection:"column", gap:12 }}>
              {[
                { label: lang==="ta"?"நைட்ரஜன் (N)":"Nitrogen (N)",   value:+sensor.nitrogen||0,   max:100, color:"#1565c0", ideal:"40-60", unit:"mg/kg" },
                { label: lang==="ta"?"பாஸ்பரஸ் (P)":"Phosphorus (P)", value:+sensor.phosphorus||0, max:80,  color:"#0097a7", ideal:"25-50", unit:"mg/kg" },
                { label: lang==="ta"?"பொட்டாசியம் (K)":"Potassium (K)",value:+sensor.potassium||0,  max:100, color:"#558b2f", ideal:"40-70", unit:"mg/kg" },
              ].map((n, i) => (
                <div key={i}>
                  <div style={{ display:"flex", justifyContent:"space-between", fontSize:13, marginBottom:5 }}>
                    <span style={{ fontWeight:600, color:"var(--text-primary)" }}>{n.label}</span>
                    <span style={{ color:n.color, fontWeight:700 }}>{n.value.toFixed(1)} {n.unit} <span style={{ color:"var(--text-muted)", fontWeight:400 }}>/ ideal: {n.ideal}</span></span>
                  </div>
                  <div style={{ background:"var(--bg-secondary,#f0f4f8)", borderRadius:8, height:10, overflow:"hidden" }}>
                    <div style={{ width:`${Math.min(100,(n.value/n.max)*100)}%`, height:"100%", background:n.color, borderRadius:8, transition:"width 0.5s" }} />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </>
      )}
    </MainLayout>
  );
}
