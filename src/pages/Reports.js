import { useEffect, useState } from "react";
import {
  Chart as ChartJS, CategoryScale, LinearScale, PointElement,
  LineElement, BarElement, ArcElement, Filler, Tooltip, Legend
} from "chart.js";
import { Line, Bar, Doughnut } from "react-chartjs-2";
import { FaFilePdf, FaFileDownload, FaTint, FaSeedling, FaBug, FaThermometerHalf, FaChartLine } from "react-icons/fa";
import MainLayout from "../layouts/MainLayout";
import { useApp } from "../context/AppContext";
import { getReports } from "../api/api";
import "../styles/global.css";
import "../styles/Reports.css";

ChartJS.register(
  CategoryScale, LinearScale, PointElement,
  LineElement, BarElement, ArcElement, Filler, Tooltip, Legend
);

/* ── Month label formatter ─────────────────────────────── */
const monthShort = (ym, lang) => {
  const [year, mon] = ym.split("-");
  const d = new Date(+year, +mon - 1, 1);
  const locale = lang === "ta" ? "ta-IN" : lang === "hi" ? "hi-IN" : "en-IN";
  return d.toLocaleDateString(locale, { month: "short" });
};

/* ── CSV export helper ─────────────────────────────────── */
const exportCSV = (rows, filename) => {
  if (!rows || rows.length === 0) return;
  const headers = Object.keys(rows[0]).join(",");
  const body    = rows.map(r => Object.values(r).join(",")).join("\n");
  const blob    = new Blob([headers + "\n" + body], { type: "text/csv" });
  const a = document.createElement("a");
  a.href = URL.createObjectURL(blob);
  a.download = filename;
  a.click();
};

/* ── PDF (text) export ─────────────────────────────────── */
const exportPDF = (data, lang) => {
  const lines = [
    "AgroSmart — Farm Activity Report",
    `Generated: ${new Date().toLocaleString("en-IN")}`,
    "=".repeat(50),
    "",
    `Total Water Used    : ${data.summary.totalWaterKL} kL`,
    `Avg Soil Health     : ${data.summary.avgSoilHealth ?? "—"}%`,
    `Disease Detections  : ${data.summary.totalDiseaseDetections}`,
    `Irrigation Sessions : ${data.summary.totalIrrigationSessions}`,
    `Active Alerts       : ${data.summary.activeAlerts}`,
    `Total Profit        : ₹${Number(data.summary.totalProfit).toLocaleString("en-IN")}`,
    "",
    "─── Soil Analyses ───────────────────────────────────",
    ...(data.soilHistory || []).map(s =>
      `  ${s.soil_type} | Confidence: ${s.confidence}% | pH: ${s.ph_typical}`
    ),
    "",
    "─── Profit Breakdown ────────────────────────────────",
    ...(data.profitBreakdown || []).map(p =>
      `  ${p.crop_name}: Investment ₹${Number(p.total_investment).toLocaleString()} | Profit ₹${Number(p.total_profit).toLocaleString()}`
    ),
    "",
    "─── Farm Activities ─────────────────────────────────",
    ...(data.farmActivities || []).map(a =>
      `  ${a.type_key}: ${a.count} entries (${a.total_qty} total qty)`
    ),
    "",
    "=".repeat(50),
    "AgroSmart Smart Agriculture Monitoring System",
  ];
  const blob = new Blob([lines.join("\n")], { type: "text/plain" });
  const a = document.createElement("a");
  a.href = URL.createObjectURL(blob);
  a.download = "agrosmart-report.txt";
  a.click();
};

/* ── Small stat card ───────────────────────────────────── */
function StatCard({ icon, label, value, unit, color, sub }) {
  return (
    <div className="rpt-stat-card" style={{ borderTop: `4px solid ${color}` }}>
      <div className="rpt-stat-icon" style={{ color }}>{icon}</div>
      <div className="rpt-stat-body">
        <div className="rpt-stat-label">{label}</div>
        <div className="rpt-stat-value" style={{ color }}>
          {value ?? "—"}{value != null && unit ? <span className="rpt-unit"> {unit}</span> : ""}
        </div>
        {sub && <div className="rpt-stat-sub">{sub}</div>}
      </div>
    </div>
  );
}

export default function Reports() {
  const { t, lang, user } = useApp();
  const [data,    setData]    = useState(null);
  const [loading, setLoading] = useState(true);
  const [error,   setError]   = useState("");

  useEffect(() => {
    if (!user) { setLoading(false); return; }
    getReports()
      .then(res => setData(res.data))
      .catch(err => setError(err.response?.data?.message || "Failed to load reports"))
      .finally(() => setLoading(false));
  }, [user]);

  if (!user) return (
    <MainLayout>
      <div className="page-header"><h1>📊 {t.reportsAnalytics}</h1></div>
      <div className="rpt-empty">
        🔒 {lang === "ta" ? "Reports பார்க்க login பண்ணுங்கள்" : lang === "hi" ? "रिपोर्ट देखने के लिए लॉगिन करें" : "Please login to view your reports"}
      </div>
    </MainLayout>
  );

  if (loading) return (
    <MainLayout>
      <div className="page-header"><h1>📊 {t.reportsAnalytics}</h1></div>
      <div className="rpt-loading"><div className="spinner" /> {lang === "ta" ? "தரவு ஏற்றுகிறது..." : lang === "hi" ? "डेटा लोड हो रहा है..." : "Loading your farm data..."}</div>
    </MainLayout>
  );

  if (error) return (
    <MainLayout>
      <div className="page-header"><h1>📊 {t.reportsAnalytics}</h1></div>
      <div className="rpt-empty">⚠️ {error}</div>
    </MainLayout>
  );

  const s  = data.summary;
  const ml = (data.monthLabels || []).map(m => monthShort(m, lang));

  // ── Chart: Sensor trends (Temp + Soil Moisture) ──────────
  const sensorLineData = {
    labels: ml,
    datasets: [
      {
        label: lang === "ta" ? "வெப்பநிலை °C" : lang === "hi" ? "तापमान °C" : "Temperature °C",
        data: data.charts.temperature,
        borderColor: "#e65100",
        backgroundColor: "rgba(230,81,0,0.06)",
        tension: 0.4, fill: true, yAxisID: "y",
        spanGaps: true,
      },
      {
        label: lang === "ta" ? "மண் ஈரம் %" : lang === "hi" ? "मिट्टी नमी %" : "Soil Moisture %",
        data: data.charts.soilMoisture,
        borderColor: "#0277bd",
        backgroundColor: "rgba(2,119,189,0.06)",
        tension: 0.4, fill: true, yAxisID: "y1",
        spanGaps: true,
      },
    ],
  };
  const sensorLineOpts = {
    responsive: true, maintainAspectRatio: false,
    plugins: { legend: { position: "top", labels: { usePointStyle: true, font: { size: 11 } } } },
    scales: {
      x:  { grid: { display: false } },
      y:  { position: "left",  title: { display: true, text: "°C" }, grid: { color: "rgba(0,0,0,0.05)" } },
      y1: { position: "right", title: { display: true, text: "%" }, grid: { drawOnChartArea: false } },
    },
  };

  // ── Chart: Irrigation (ON sessions per month) ────────────
  const irrigBarData = {
    labels: ml,
    datasets: [{
      label: lang === "ta" ? "பாசன சேஷன்கள்" : lang === "hi" ? "सिंचाई सत्र" : "Irrigation Sessions",
      data: data.charts.irrigationOn,
      backgroundColor: data.charts.irrigationOn.map(v =>
        v === 0 ? "rgba(200,200,200,0.5)" : "rgba(2,119,189,0.75)"
      ),
      borderRadius: 6,
    }],
  };
  const irrigBarOpts = {
    responsive: true, maintainAspectRatio: false,
    plugins: { legend: { display: false } },
    scales: {
      x: { grid: { display: false } },
      y: { beginAtZero: true, ticks: { stepSize: 1 }, grid: { color: "rgba(0,0,0,0.05)" } },
    },
  };

  // ── Chart: Disease detections per month ──────────────────
  const diseaseBarData = {
    labels: ml,
    datasets: [
      {
        label: lang === "ta" ? "மொத்த நோய்கள்" : lang === "hi" ? "कुल रोग" : "Total Detections",
        data: data.charts.diseaseCounts,
        backgroundColor: "rgba(198,40,40,0.7)",
        borderRadius: 6,
      },
      {
        label: lang === "ta" ? "அதிக தீவிரம்" : lang === "hi" ? "उच्च गंभीरता" : "High Severity",
        data: data.charts.diseaseHigh,
        backgroundColor: "rgba(230,81,0,0.65)",
        borderRadius: 6,
      },
    ],
  };
  const diseaseBarOpts = {
    responsive: true, maintainAspectRatio: false,
    plugins: { legend: { position: "top", labels: { usePointStyle: true, font: { size: 11 } } } },
    scales: {
      x: { grid: { display: false } },
      y: { beginAtZero: true, ticks: { stepSize: 1 }, grid: { color: "rgba(0,0,0,0.05)" } },
    },
  };

  // ── Chart: Profit (if data exists) ───────────────────────
  const hasProfitData = data.profitBreakdown && data.profitBreakdown.length > 0;
  const profitDoughnutData = hasProfitData ? {
    labels: data.profitBreakdown.map(p => p.crop_name),
    datasets: [{
      data: data.profitBreakdown.map(p => parseFloat(p.total_profit)),
      backgroundColor: ["#2e7d32","#0277bd","#e65100","#6a1b9a","#00838f"],
      borderWidth: 0, hoverOffset: 8,
    }],
  } : null;

  const hasAnySensor  = data.latestSensor != null;
  const hasAnyIrrig   = s.totalIrrigationSessions > 0;
  const hasAnyDisease = s.totalDiseaseDetections > 0;
  const hasAnySoil    = data.soilHistory && data.soilHistory.length > 0;

  return (
    <MainLayout>
      <div className="page-header">
        <h1>📊 {t.reportsAnalytics}</h1>
        <p>
          {data.farm?.name && (
            <span>
              {data.farm.name}
              {data.farm.primary_crop ? ` · ${data.farm.primary_crop}` : ""}
              {data.farm.farm_size    ? ` · ${data.farm.farm_size} acres` : ""}
              {data.farm.location     ? ` · 📍 ${data.farm.location}` : ""}
            </span>
          )}
        </p>
      </div>

      {/* ═══ STAT CARDS ═══ */}
      <div className="rpt-stats-grid">
        <StatCard
          icon={<FaTint />}
          label={lang === "ta" ? "மொத்த நீர் பயன்பாடு" : lang === "hi" ? "कुल जल उपयोग" : "Total Water Used"}
          value={s.totalWaterKL}
          unit="kL"
          color="#0277bd"
          sub={`${s.totalIrrigationSessions} ${lang === "ta" ? "பாசன சேஷன்கள்" : lang === "hi" ? "सिंचाई सत्र" : "irrigation sessions"}`}
        />
        <StatCard
          icon={<FaSeedling />}
          label={lang === "ta" ? "சராசரி மண் ஆரோக்கியம்" : lang === "hi" ? "औसत मिट्टी स्वास्थ्य" : "Avg Soil Health"}
          value={s.avgSoilHealth}
          unit="%"
          color="#2e7d32"
          sub={`${s.soilAnalysesCount} ${lang === "ta" ? "பகுப்பாய்வுகள்" : lang === "hi" ? "विश्लेषण" : "analyses"}`}
        />
        <StatCard
          icon={<FaBug />}
          label={lang === "ta" ? "நோய் கண்டறிதல்கள்" : lang === "hi" ? "रोग पहचान" : "Disease Detections"}
          value={s.totalDiseaseDetections}
          color="#c62828"
          sub={s.activeAlerts > 0
            ? `⚠️ ${s.activeAlerts} ${lang === "ta" ? "இந்த மாதம் அதிக தீவிரம்" : lang === "hi" ? "इस महीने उच्च" : "high severity this month"}`
            : lang === "ta" ? "இந்த மாதம் alert இல்லை" : lang === "hi" ? "इस महीने कोई अलर्ट नहीं" : "No alerts this month"
          }
        />
        <StatCard
          icon={<FaChartLine />}
          label={lang === "ta" ? "மொத்த லாபம்" : lang === "hi" ? "कुल लाभ" : "Total Profit"}
          value={s.totalProfit > 0 ? `₹${Number(s.totalProfit).toLocaleString("en-IN")}` : null}
          color="#388e3c"
          sub={s.totalInvestment > 0
            ? `${lang === "ta" ? "முதலீடு" : lang === "hi" ? "निवेश" : "Investment"}: ₹${Number(s.totalInvestment).toLocaleString("en-IN")}`
            : lang === "ta" ? "லாப வரலாறு இல்லை" : lang === "hi" ? "कोई लाभ इतिहास नहीं" : "No profit history yet"
          }
        />
      </div>

      {/* ═══ LATEST SENSOR READING ═══ */}
      {hasAnySensor && (
        <div className="card-box rpt-sensor-box" style={{ marginBottom: 24 }}>
          <h3 className="section-title">
            🌡️ {lang === "ta" ? "தற்போதைய சென்சார் வாசிப்பு" : lang === "hi" ? "वर्तमान सेंसर रीडिंग" : "Latest Sensor Reading"}
          </h3>
          <div className="rpt-sensor-grid">
            {[
              { label: lang === "ta" ? "வெப்பநிலை" : lang === "hi" ? "तापमान" : "Temperature",   val: data.latestSensor.temperature,   unit: "°C", color: "#e65100" },
              { label: lang === "ta" ? "ஈரப்பதம்" : lang === "hi" ? "आर्द्रता"   : "Humidity",       val: data.latestSensor.humidity,       unit: "%",  color: "#0277bd" },
              { label: lang === "ta" ? "மண் ஈரம்"  : lang === "hi" ? "मिट्टी नमी"  : "Soil Moisture",  val: data.latestSensor.soil_moisture,  unit: "%",  color: "#2e7d32" },
              { label: lang === "ta" ? "pH அளவு"   : lang === "hi" ? "पीएच स्तर"  : "pH Level",       val: data.latestSensor.ph_level,       unit: "",   color: "#6a1b9a" },
              { label: "Nitrogen",    val: data.latestSensor.nitrogen,    unit: "mg/kg", color: "#558b2f" },
              { label: "Phosphorus",  val: data.latestSensor.phosphorus,  unit: "mg/kg", color: "#00838f" },
              { label: "Potassium",   val: data.latestSensor.potassium,   unit: "mg/kg", color: "#f57f17" },
            ].map((item, i) => (
              <div key={i} className="rpt-sensor-chip" style={{ borderLeft: `3px solid ${item.color}` }}>
                <div className="rpt-sensor-val" style={{ color: item.color }}>
                  {item.val != null ? parseFloat(item.val).toFixed(1) : "—"}{item.unit}
                </div>
                <div className="rpt-sensor-lbl">{item.label}</div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ═══ CHARTS ROW 1: Sensor Trend + Irrigation ═══ */}
      <div className="two-col" style={{ marginBottom: 24 }}>
        <div className="chart-container" style={{ marginBottom: 0 }}>
          <h3>
            <FaThermometerHalf style={{ marginRight: 6, color: "#e65100" }} />
            {lang === "ta" ? "6 மாத சென்சார் போக்கு" : lang === "hi" ? "6 माह सेंसर ट्रेंड" : "6-Month Sensor Trend"}
          </h3>
          {hasAnySensor ? (
            <div style={{ height: 240 }}>
              <Line data={sensorLineData} options={sensorLineOpts} />
            </div>
          ) : (
            <div className="rpt-no-data">
              {lang === "ta" ? "சென்சார் தரவு இல்லை — Dashboard-ல் சென்சார் activate பண்ணுங்கள்"
               : lang === "hi" ? "कोई सेंसर डेटा नहीं — Dashboard पर सेंसर सक्रिय करें"
               : "No sensor data yet — activate sensor on Dashboard"}
            </div>
          )}
        </div>

        <div className="chart-container" style={{ marginBottom: 0 }}>
          <h3>
            <FaTint style={{ marginRight: 6, color: "#0277bd" }} />
            {lang === "ta" ? "6 மாத நீர்ப்பாசனம்" : lang === "hi" ? "6 माह सिंचाई" : "6-Month Irrigation"}
          </h3>
          {hasAnyIrrig ? (
            <div style={{ height: 240 }}>
              <Bar data={irrigBarData} options={irrigBarOpts} />
            </div>
          ) : (
            <div className="rpt-no-data">
              {lang === "ta" ? "நீர்ப்பாசன பதிவு இல்லை — Irrigation page-ல் Motor ON பண்ணுங்கள்"
               : lang === "hi" ? "सिंचाई लॉग नहीं — Irrigation page पर Motor ON करें"
               : "No irrigation logs — turn on Motor on Irrigation page"}
            </div>
          )}
        </div>
      </div>

      {/* ═══ CHARTS ROW 2: Disease + Profit ═══ */}
      <div className="two-col" style={{ marginBottom: 24 }}>
        <div className="chart-container" style={{ marginBottom: 0 }}>
          <h3>
            <FaBug style={{ marginRight: 6, color: "#c62828" }} />
            {lang === "ta" ? "6 மாத நோய் கண்டறிதல்கள்" : lang === "hi" ? "6 माह रोग पहचान" : "6-Month Disease Detections"}
          </h3>
          {hasAnyDisease ? (
            <div style={{ height: 240 }}>
              <Bar data={diseaseBarData} options={diseaseBarOpts} />
            </div>
          ) : (
            <div className="rpt-no-data">
              {lang === "ta" ? "நோய் கண்டறிதல் இல்லை — Disease Detection page use பண்ணுங்கள்"
               : lang === "hi" ? "कोई रोग पहचान नहीं — Disease Detection page उपयोग करें"
               : "No disease detections yet — use Disease Detection page"}
            </div>
          )}
        </div>

        <div className="chart-container" style={{ marginBottom: 0 }}>
          <h3>
            <FaChartLine style={{ marginRight: 6, color: "#2e7d32" }} />
            {lang === "ta" ? "பயிர் வாரியாக லாபம்" : lang === "hi" ? "फसल-वार लाभ" : "Profit by Crop"}
          </h3>
          {hasProfitData ? (
            <div style={{ height: 240 }}>
              <Doughnut
                data={profitDoughnutData}
                options={{
                  responsive: true, maintainAspectRatio: false,
                  cutout: "62%",
                  plugins: { legend: { position: "right", labels: { usePointStyle: true, font: { size: 11 } } } },
                }}
              />
            </div>
          ) : (
            <div className="rpt-no-data">
              {lang === "ta" ? "லாப வரலாறு இல்லை — Profit History page-ல் சேர்க்கவும்"
               : lang === "hi" ? "कोई लाभ इतिहास नहीं — Profit History में जोड़ें"
               : "No profit history — add entries in Profit History page"}
            </div>
          )}
        </div>
      </div>

      {/* ═══ BOTTOM ROW: Soil Table + Farm Activities ═══ */}
      <div className="two-col" style={{ marginBottom: 24 }}>

        {/* Soil History Table */}
        <div className="card-box">
          <h3 className="section-title">
            <span>🌱</span>
            {lang === "ta" ? "மண் பகுப்பாய்வு வரலாறு" : lang === "hi" ? "मिट्टी विश्लेषण इतिहास" : "Soil Analysis History"}
          </h3>
          {hasAnySoil ? (
            <table className="data-table">
              <thead>
                <tr>
                  <th>{lang === "ta" ? "மண் வகை" : lang === "hi" ? "मिट्टी प्रकार" : "Soil Type"}</th>
                  <th>{lang === "ta" ? "நம்பகத்தன்மை" : lang === "hi" ? "विश्वसनीयता" : "Confidence"}</th>
                  <th>pH</th>
                  <th>{lang === "ta" ? "கரிம பொருள்" : lang === "hi" ? "कार्बनिक पदार्थ" : "Organic"}</th>
                </tr>
              </thead>
              <tbody>
                {data.soilHistory.map((s, i) => (
                  <tr key={i}>
                    <td><strong>{s.soil_type}</strong></td>
                    <td>
                      <div className="progress-bar-wrap" style={{ marginTop: 0 }}>
                        <div className="progress-bar-fill" style={{ width: s.confidence + "%" }} />
                      </div>
                      <span style={{ fontSize: 10 }}>{s.confidence}%</span>
                    </td>
                    <td>{s.ph_typical}</td>
                    <td>{s.organic_matter}%</td>
                  </tr>
                ))}
              </tbody>
            </table>
          ) : (
            <div className="rpt-no-data">
              {lang === "ta" ? "மண் பகுப்பாய்வு இல்லை — Soil Analysis page use பண்ணுங்கள்"
               : lang === "hi" ? "कोई मिट्टी विश्लेषण नहीं — Soil Analysis page उपयोग करें"
               : "No soil analyses yet — use Soil Analysis page"}
            </div>
          )}
        </div>

        {/* Farm Activities */}
        <div className="card-box">
          <h3 className="section-title">
            <span>🚜</span>
            {lang === "ta" ? "பண்ணை செயல்பாடு சுருக்கம்" : lang === "hi" ? "खेत गतिविधि सारांश" : "Farm Activity Summary"}
          </h3>
          {data.farmActivities && data.farmActivities.length > 0 ? (
            <div className="rpt-activity-list">
              {data.farmActivities.map((a, i) => (
                <div key={i} className="rpt-activity-row">
                  <div className="rpt-activity-key">{a.type_key}</div>
                  <div className="rpt-activity-right">
                    <span className="rpt-activity-count">{a.count}×</span>
                    <span className="rpt-activity-qty">{parseFloat(a.total_qty).toFixed(1)} total</span>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="rpt-no-data">
              {lang === "ta" ? "செயல்பாடு பதிவு இல்லை — Farm History page use பண்ணுங்கள்"
               : lang === "hi" ? "कोई गतिविधि लॉग नहीं — Farm History page उपयोग करें"
               : "No farm activities logged — use Farm History page"}
            </div>
          )}

          {/* Export buttons */}
          <div style={{ display: "flex", gap: 10, marginTop: 20 }}>
            <button
              className="btn-primary-ag"
              style={{ flex: 1, justifyContent: "center" }}
              onClick={() => exportPDF(data, lang)}
            >
              <FaFilePdf /> {t.exportPDF || "Export PDF"}
            </button>
            <button
              className="btn-outline-ag"
              style={{ flex: 1, justifyContent: "center" }}
              onClick={() => exportCSV(
                (data.profitBreakdown || []).map(p => ({
                  crop: p.crop_name,
                  investment: p.total_investment,
                  profit: p.total_profit,
                  entries: p.entries,
                })),
                "agrosmart-profit.csv"
              )}
            >
              <FaFileDownload /> {t.downloadCSV || "Download CSV"}
            </button>
          </div>
        </div>

      </div>
    </MainLayout>
  );
}
