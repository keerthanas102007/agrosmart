import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import {
  Chart as ChartJS, CategoryScale, LinearScale,
  PointElement, LineElement, Filler, Tooltip, Legend
} from "chart.js";
import { Line } from "react-chartjs-2";
import {
  FaThermometerHalf, FaTint, FaLeaf, FaFlask,
  FaCloudRain, FaArrowRight, FaExclamationTriangle,
  FaCheckCircle, FaInfoCircle
} from "react-icons/fa";
import MainLayout from "../layouts/MainLayout";
import { useApp } from "../context/AppContext";
import { getLatestSensors, getMotorStatus } from "../api/api";
import { sensorData, weeklyChartData } from "../data/mockData";
import useSensorSocket from "../hooks/useSensorSocket";
import SmartFlowPanel from "../components/SmartFlowPanel";
import "../styles/global.css";
import "../styles/Dashboard.css";
import "../styles/SmartFlowPanel.css";

ChartJS.register(
  CategoryScale, LinearScale, PointElement,
  LineElement, Filler, Tooltip, Legend
);

/* Live sensor card — smoothly updates when real data arrives, with subtle drift animation */
function LiveCard({ label, value, unit, icon, color, bg, good }) {
  const [live, setLive]   = useState(parseFloat(value) || 0);
  const [flash, setFlash] = useState(false);

  // Sync card when real data arrives from WebSocket
  useEffect(() => {
    const next = parseFloat(value);
    if (!isNaN(next) && next !== live) {
      setLive(next);
      setFlash(true);
      setTimeout(() => setFlash(false), 350);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [value]);

  // Subtle local drift every 6s so UI feels alive between updates
  useEffect(() => {
    const timer = setInterval(() => {
      setLive(prev => parseFloat((prev + (Math.random() - 0.5) * 0.6).toFixed(1)));
    }, 6000);
    return () => clearInterval(timer);
  }, []);

  return (
    <div className="metric-card" style={{ borderTop: `4px solid ${color}` }}>
      <div className="metric-card__icon" style={{ background: bg, color }}>{icon}</div>
      <div className="metric-card__body">
        <div className="metric-card__label">{label}</div>
        <div className={`metric-card__value ${flash ? "metric-flash" : ""}`} style={{ color }}>
          {live}{unit}
        </div>
        <div style={{ fontSize: 11, color: "#2e7d32", display: "flex", alignItems: "center", gap: 4, marginTop: 2 }}>
          <FaCheckCircle /> {good}
        </div>
      </div>
    </div>
  );
}

export default function Dashboard() {
  const navigate  = useNavigate();
  const { t, lang, user, setSharedSensorData, markFlowStep } = useApp();

  const username = user?.name || localStorage.getItem("username") || t.farmer;

  /* ── Real sensor data — WebSocket (instant) + HTTP fallback ── */
  const [sensorLive, setSensorLive] = useState(null);
  const [motorOn,    setMotorOn]    = useState(false);

  // WebSocket: receives pushed updates from server every 10s automatically
  const { sensorData: wsSensorData, connected: wsConnected } = useSensorSocket(user?.id);

  useEffect(() => {
    if (wsSensorData && wsSensorData.length > 0) {
      setSensorLive(wsSensorData[0]); // use first sensor for dashboard cards
      setSharedSensorData(wsSensorData[0]); // share with all pages via context
    }
  }, [wsSensorData, setSharedSensorData]);

  // Initial HTTP fetch on mount (motor status + first sensor reading)
  useEffect(() => {
    const fetchInit = async () => {
      try {
        const [sRes, mRes] = await Promise.all([
          getLatestSensors().catch(() => null),
          getMotorStatus().catch(() => null),
        ]);
        if (sRes?.data?.length > 0) {
          setSensorLive(sRes.data[0]);
          setSharedSensorData(sRes.data[0]); // share initial sensor data
        }
        if (mRes?.data) setMotorOn(mRes.data.status === "on");
      } catch (_) {}
    };
    fetchInit();
    // Motor status still needs occasional polling (no WebSocket room for it)
    const motorPoll = setInterval(async () => {
      try {
        const mRes = await getMotorStatus().catch(() => null);
        if (mRes?.data) setMotorOn(mRes.data.status === "on");
      } catch (_) {}
    }, 30000);
    return () => clearInterval(motorPoll);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  /* Use real sensor data if available, else fall back to mock */
  const temp     = sensorLive?.temperature  ?? sensorData.temperature;
  const humidity = sensorLive?.humidity     ?? sensorData.humidity;
  const moisture = sensorLive?.soil_moisture?? sensorData.soilMoisture;
  const ph       = sensorLive?.ph_level     ?? sensorData.phLevel;

  const cards = [
    { label: t.temperature,  value: temp,     unit: t.unitC || "°C", icon: <FaThermometerHalf />, color: "#e65100", bg: "#fff3e0", good: t.optimalRange },
    { label: t.humidity,     value: humidity, unit: "%",              icon: <FaTint />,            color: "#0277bd", bg: "#e1f5fe", good: t.goodMoisture },
    { label: t.soilMoisture, value: moisture, unit: "%",              icon: <FaLeaf />,            color: "#2e7d32", bg: "#e8f5e9", good: t.wellIrrigated },
    { label: t.phLevel,      value: ph,       unit: "",               icon: <FaFlask />,           color: "#6a1b9a", bg: "#f3e5f5", good: t.neutralIdeal },
  ];

  const quickLinks = [
    { label: t.sensors,                          path: "/sensors",    icon: "📡", color: "#1b5e20" },
    { label: t.irrigation,                        path: "/irrigation", icon: "💧", color: "#0277bd" },
    { label: t.crops,                             path: "/crops",      icon: "🌾", color: "#558b2f" },
    { label: t.community || "Community",          path: "/community",  icon: "👨‍🌾", color: "#2e7d32" },
    { label: t.diseaseDetection?.split("&")[0]?.trim() || "Disease", path: "/disease", icon: "🔬", color: "#6a1b9a" },
    { label: t.profitHistory || "Profit History", path: "/history",   icon: "💰", color: "#e65100" },
  ];

  const DAY_LABELS = {
    en: ["Mon","Tue","Wed","Thu","Fri","Sat","Sun"],
    ta: ["திங்","செவ்","புத","வியா","வெள்","சனி","ஞாயி"],
    hi: ["सोम","मंगल","बुध","गुरु","शुक्र","शनि","रवि"],
  };
  const dayLabels = DAY_LABELS[lang] || DAY_LABELS.en;

  const activities = [
    { id:1, icon:"💧", msg: t.actIrrigation,  time:`10 ${t.minAgo}` },
    { id:2, icon:"⚠️", msg: t.actLowBattery,  time:`25 ${t.minAgo}` },
    { id:3, icon:"🌾", msg: t.actHarvest,      time:`1 ${t.hrAgo}`   },
    { id:4, icon:"🧪", msg: t.actPhReading,    time:`2 ${t.hrsAgo}`  },
    { id:5, icon:"☁️", msg: t.actRainForecast, time:`3 ${t.hrsAgo}`  },
    { id:6, icon:"🌱", msg: t.actFertilizer,   time:`5 ${t.hrsAgo}`  },
  ];

  const chartData = {
    labels: dayLabels,
    datasets: [
      { label: t.soilMoisture+" (%)", data: weeklyChartData.soilMoisture, borderColor:"#2e7d32", backgroundColor:"rgba(46,125,50,0.08)", tension:0.4, fill:true, pointBackgroundColor:"#2e7d32", pointRadius:4 },
      { label: t.humidity+" (%)",     data: weeklyChartData.humidity,     borderColor:"#0277bd", backgroundColor:"rgba(2,119,189,0.06)", tension:0.4, fill:true, pointBackgroundColor:"#0277bd", pointRadius:4 },
    ],
  };
  const chartOpts = {
    responsive: true, maintainAspectRatio: false,
    plugins: { legend: { position:"top", labels:{ usePointStyle:true, padding:18, font:{size:12} } }, tooltip:{ mode:"index", intersect:false } },
    scales: { y:{ min:40, max:100, grid:{color:"rgba(128,128,128,0.1)"} }, x:{ grid:{display:false} } },
  };

  const hour     = new Date().getHours();
  const greeting = hour < 12 ? t.goodMorning : hour < 18 ? t.goodAfternoon : t.goodEvening;

  return (
    <MainLayout>
      {/* Smart Farm Flow Panel — shows progress across all features */}
      <SmartFlowPanel />

      {/* Welcome banner */}
      <div className="dash-welcome">
        <div>
          <h1>{greeting}, {username} 👋</h1>
          <p>{t.allSensorsActive}</p>
        </div>
        <div className="dash-welcome__weather">
          <FaCloudRain style={{ fontSize:26, color:"#0277bd" }} />
          <div>
            <div style={{ fontSize:22, fontWeight:700 }}>{temp}{t.unitC || "°C"}</div>
            <div style={{ fontSize:12, color:"rgba(255,255,255,0.75)" }}>{t.partlyCloudy}</div>
          </div>
          <div style={{ borderLeft:"1px solid rgba(255,255,255,0.25)", paddingLeft:14 }}>
            <div style={{ fontSize:12, color:"rgba(255,255,255,0.75)" }}>
              💧 {t.irrigation}: <strong style={{color: motorOn ? "#a5d6a7" : "#ef9a9a"}}>{motorOn ? "ON" : "OFF"}</strong>
            </div>
            <div style={{ fontSize:12, color:"rgba(255,255,255,0.75)" }}>
              {wsConnected
                ? (sensorLive && !sensorLive.simulated ? "🔴 Live IoT" : "🔵 Live Sim")
                : "📊 Connecting..."}
            </div>
          </div>
        </div>
      </div>

      {/* Live sensor cards */}
      <div className="stats-grid">
        {cards.map((c,i) => <LiveCard key={i} {...c} />)}
      </div>

      {/* Dashboard Summary Row */}
      <div className="dash-summary-row">
        <div className="dash-summary-card dash-summary-card--motor">
          <div className="summary-icon">⚙️</div>
          <div className="summary-body">
            <div className="summary-label">{t.motorControl}</div>
            <div className={`summary-value ${motorOn ? "summary-value--on" : "summary-value--off"}`}>
              {motorOn ? `● ${t.running}` : `○ ${t.stopped}`}
            </div>
          </div>
          <button className="summary-btn" onClick={() => navigate("/irrigation")}>→</button>
        </div>
        <div className="dash-summary-card dash-summary-card--soil">
          <div className="summary-icon">🌱</div>
          <div className="summary-body">
            <div className="summary-label">{t.soilAnalysis}</div>
            <div className="summary-value summary-value--ok">pH {ph}</div>
          </div>
          <button className="summary-btn" onClick={() => navigate("/soil")}>→</button>
        </div>
        <div className="dash-summary-card dash-summary-card--crop">
          <div className="summary-icon">🌾</div>
          <div className="summary-body">
            <div className="summary-label">{t.crops}</div>
            <div className="summary-value summary-value--ok">{t.stageFlowering}</div>
          </div>
          <button className="summary-btn" onClick={() => navigate("/crops")}>→</button>
        </div>
        <div className="dash-summary-card dash-summary-card--community">
          <div className="summary-icon">👨‍🌾</div>
          <div className="summary-body">
            <div className="summary-label">{t.community || "Community"}</div>
            <div className="summary-value summary-value--ok">Share & Learn</div>
          </div>
          <button className="summary-btn" onClick={() => navigate("/community")}>→</button>
        </div>
      </div>

      {/* Chart + Activity */}
      <div className="two-col" style={{ marginBottom:24 }}>
        <div className="chart-container">
          <h3>📈 {t.weeklyTrends}</h3>
          <div style={{ height:250 }}>
            <Line data={chartData} options={chartOpts} />
          </div>
        </div>
        <div className="card-box">
          <h3 className="section-title"><span>⚡</span> {t.recentActivity}</h3>
          {activities.map(a => (
            <div className="activity-item" key={a.id}>
              <span className="activity-item__icon">{a.icon}</span>
              <div className="activity-item__body">
                <div className="activity-item__msg">{a.msg}</div>
                <div className="activity-item__time">{a.time}</div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Quick Links */}
      <h3 className="section-title"><span>🔗</span> {t.quickAccess}</h3>
      <div className="quick-links-grid">
        {quickLinks.map(q => (
          <button key={q.path} className="quick-link-card" style={{ borderColor: q.color }} onClick={() => navigate(q.path)}>
            <span style={{ fontSize:24 }}>{q.icon}</span>
            <span style={{ flex:1, fontSize:13, fontWeight:600, color:"var(--text-primary)" }}>{q.label}</span>
            <FaArrowRight style={{ color:q.color, fontSize:12 }} />
          </button>
        ))}
      </div>

      {/* Alerts */}
      <div style={{ marginTop:22 }}>
        <div className="alert-box alert-box--warning">
          <div className="alert-box__icon"><FaExclamationTriangle /></div>
          <div>
            <div className="alert-box__title">{t.alertLowBatteryTitle}</div>
            <div className="alert-box__msg">{t.alertLowBatteryMsg}</div>
          </div>
        </div>
        <div className="alert-box alert-box--info">
          <div className="alert-box__icon"><FaInfoCircle /></div>
          <div>
            <div className="alert-box__title">{t.alertRainTitle}</div>
            <div className="alert-box__msg">{t.alertRainMsg}</div>
          </div>
        </div>
      </div>
    </MainLayout>
  );
}
