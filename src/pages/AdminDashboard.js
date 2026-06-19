import { useNavigate } from "react-router-dom";
import { useApp } from "../context/AppContext";
import "../styles/global.css";
import "../styles/Dashboard.css";

export default function AdminDashboard() {
  const navigate = useNavigate();
  const { t } = useApp();
  const username = localStorage.getItem("username") || "Admin";

  const stats = [
    { label: t.registeredFarmers || "Registered Farmers", value: 150, icon: "👨‍🌾", color: "#1b5e20", bg: "#e8f5e9" },
    { label: t.active            || "Active Sensors",     value: 75,  icon: "📡", color: "#0277bd", bg: "#e1f5fe" },
    { label: t.totalFields       || "Total Farms",         value: 42,  icon: "🗺️", color: "#558b2f", bg: "#f1f8e9" },
    { label: t.waterToday        || "Water Usage (L)",     value: "2,500", icon: "💧", color: "#0097a7", bg: "#e0f7fa" },
    { label: t.activeAlerts      || "Alerts Today",        value: 7,   icon: "⚠️", color: "#e65100", bg: "#fff3e0" },
    { label: t.uptimeLabel       || "System Uptime",       value: "99.2%", icon: "✅", color: "#2e7d32", bg: "#e8f5e9" },
  ];

  const farmers = (t) => [
    { name: t.adminFarmer1Name, village: t.adminFarmer1Village, crop: t.cropRice,      area: `12 ${t.areaAcre}`, status: "active"   },
    { name: t.adminFarmer2Name, village: t.adminFarmer2Village, crop: t.cropSugarcane, area: `20 ${t.areaAcre}`, status: "active"   },
    { name: t.adminFarmer3Name, village: t.adminFarmer3Village, crop: t.cropWheat,     area: `8 ${t.areaAcre}`,  status: "inactive" },
    { name: t.adminFarmer4Name, village: t.adminFarmer4Village, crop: t.cropCotton,    area: `15 ${t.areaAcre}`, status: "active"   },
  ];

  const farmerList = farmers(t);

  return (
    <div style={{ padding: 32, background: "var(--bg-main)", minHeight: "100vh" }}>
      <div className="dashboard-welcome" style={{ marginBottom: 28 }}>
        <div>
          <h1>{t.adminPanel || "Admin Panel"} 👨‍💼</h1>
          <p>{t.systemOpsMsg || `Welcome back, ${username}. System status: All systems operational.`}</p>
        </div>
        <div className="dashboard-welcome__weather">
          <span style={{ fontSize: 28 }}>⚙️</span>
          <div>
            <div style={{ fontSize: 16, fontWeight: 700, color: "#fff" }}>{t.systemHealthy || "System Healthy"}</div>
            <div style={{ fontSize: 12, color: "rgba(255,255,255,0.7)" }}>99.2% {t.uptimeMonth || "uptime this month"}</div>
          </div>
        </div>
      </div>

      <div className="stats-grid" style={{ marginBottom: 28 }}>
        {stats.map((s, i) => (
          <div className="metric-card" key={i} style={{ borderTop: `4px solid ${s.color}` }}>
            <div className="metric-card__icon" style={{ background: s.bg, fontSize: 22, color: s.color }}>{s.icon}</div>
            <div className="metric-card__body">
              <div className="metric-card__label">{s.label}</div>
              <div className="metric-card__value" style={{ color: s.color }}>{s.value}</div>
            </div>
          </div>
        ))}
      </div>

      <div style={{ background: "var(--bg-card)", borderRadius: 16, padding: 24, boxShadow: "var(--shadow-sm)", border: "1px solid var(--border)" }}>
        <div className="section-title" style={{ marginBottom: 16 }}>
          <span>👨‍🌾</span> {t.registeredFarmers || "Registered Farmers"}
        </div>
        <table className="data-table">
          <thead>
            <tr>
              <th>{t.nameCol    || "Name"}</th>
              <th>{t.villageCol || "Village"}</th>
              <th>{t.cropCol    || "Crop"}</th>
              <th>{t.areaCol    || "Area"}</th>
              <th>{t.statusCol  || "Status"}</th>
            </tr>
          </thead>
          <tbody>
            {farmerList.map((f, i) => (
              <tr key={i}>
                <td><strong>{f.name}</strong></td>
                <td>{f.village}</td>
                <td>{f.crop}</td>
                <td>{f.area}</td>
                <td>
                  <span className={`status-badge status-badge--${f.status === "active" ? "active" : "inactive"}`}>
                    {f.status === "active" ? t.farmerActive : t.farmerInactive}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div style={{ marginTop: 20 }}>
        <button className="btn-primary-ag" onClick={() => navigate("/dashboard")}>
          ← {t.goToFarmerDash || "Go to Farmer Dashboard"}
        </button>
      </div>
    </div>
  );
}
