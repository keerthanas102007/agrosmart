import { useState, useEffect, useCallback } from "react";
import { FaPlus, FaTrash, FaSearch, FaFilter } from "react-icons/fa";
import MainLayout from "../layouts/MainLayout";
import { useApp } from "../context/AppContext";
import {
  getFarmHistory,
  addFarmHistory,
  deleteFarmHistory,
  clearFarmHistory,
} from "../api/api";
import "../styles/global.css";
import "../styles/FarmHistory.css";

// Neutral keys — translated at render time via t[key]
const ACT_KEYS = [
  "act_urea","act_pesticide","act_npk","act_dap","act_potash","act_organic",
  "act_irrigation","act_soilTest","act_harvest","act_sowing","act_weeding",
  "act_fungicide","act_other"
];

const ICON_MAP = {
  act_urea:"🧪", act_pesticide:"🌿", act_npk:"🌱", act_dap:"🧪",
  act_potash:"⚗️", act_organic:"🌾", act_irrigation:"💧", act_soilTest:"🔬",
  act_harvest:"🌾", act_sowing:"🌱", act_weeding:"🌿", act_fungicide:"🍄", act_other:"📝"
};

const COLOR_MAP = {
  act_urea:"#7b1fa2", act_pesticide:"#c62828", act_npk:"#2e7d32", act_dap:"#6a1b9a",
  act_potash:"#1565c0", act_organic:"#558b2f", act_irrigation:"#0277bd",
  act_soilTest:"#e65100", act_harvest:"#f57f17", act_sowing:"#43a047",
  act_weeding:"#00838f", act_fungicide:"#ad1457", act_other:"#546e7a"
};

const FIELD_KEYS = ["fieldA","fieldB","fieldC","fieldD","allFields"];
const UNIT_KEYS  = ["unitKg","unitLitres","unitBags","unitGrams","unitMl"];

export default function FarmHistory() {
  const { t, user } = useApp();

  // DB-backed state
  const [history, setHistory]   = useState([]);
  const [loading, setLoading]   = useState(false);
  const [saving,  setSaving]    = useState(false);
  const [error,   setError]     = useState(null);

  // UI state
  const [showForm,   setShowForm]   = useState(false);
  const [search,     setSearch]     = useState("");
  const [filterKey,  setFilterKey]  = useState("all");
  const [form, setForm] = useState({
    typeKey:  "act_urea",
    fieldIdx: 0,
    quantity: "",
    unitIdx:  0,
    notes:    "",
    date:     new Date().toISOString().split("T")[0],
  });

  // Resolved label lists for dropdowns
  const activityLabels = ACT_KEYS.map(k => t[k] || k);
  const fieldLabels    = FIELD_KEYS.map(k => t[k] || k);
  const unitLabels     = UNIT_KEYS.map(k => t[k] || k);

  // ── Load history from DB ──────────────────────────────────
  const loadHistory = useCallback(async () => {
    if (!user) return;
    setLoading(true);
    setError(null);
    try {
      const res = await getFarmHistory();
      setHistory(res.data.data || []);
    } catch (err) {
      setError("Could not load history. " + (err.response?.data?.message || err.message));
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => { loadHistory(); }, [loadHistory]);

  // ── Add entry ─────────────────────────────────────────────
  const addEntry = async () => {
    if (!form.quantity) return;
    if (!user) { setError(t.pleaseLoginFirst || "Please login first."); return; }

    const fieldIdx = parseInt(form.fieldIdx);
    const unitIdx  = parseInt(form.unitIdx);

    setSaving(true);
    setError(null);
    try {
      const res = await addFarmHistory({
        type_key:  form.typeKey,
        field_key: FIELD_KEYS[fieldIdx],
        quantity:  form.quantity,
        unit_key:  UNIT_KEYS[unitIdx],
        notes:     form.notes,
        date:      form.date,
      });

      // Optimistically prepend new entry
      const newEntry = {
        id:         res.data.id,
        type_key:   form.typeKey,
        field_key:  FIELD_KEYS[fieldIdx],
        quantity:   parseFloat(form.quantity),
        unit_key:   UNIT_KEYS[unitIdx],
        notes:      form.notes,
        date:       form.date,
      };
      setHistory(prev => [newEntry, ...prev]);
      setForm({ typeKey:"act_urea", fieldIdx:0, quantity:"", unitIdx:0, notes:"", date: new Date().toISOString().split("T")[0] });
      setShowForm(false);
    } catch (err) {
      setError("Could not save activity. " + (err.response?.data?.message || err.message));
    } finally {
      setSaving(false);
    }
  };

  // ── Delete entry ──────────────────────────────────────────
  const handleDelete = async (id) => {
    try {
      await deleteFarmHistory(id);
      setHistory(prev => prev.filter(e => e.id !== id));
    } catch (err) {
      setError("Could not delete. " + (err.response?.data?.message || err.message));
    }
  };

  // ── Clear all ─────────────────────────────────────────────
  const handleClear = async () => {
    if (!window.confirm("Delete ALL farm history? This cannot be undone.")) return;
    try {
      await clearFarmHistory();
      setHistory([]);
    } catch (err) {
      setError("Could not clear history.");
    }
  };

  const set = (f) => (e) => setForm(prev => ({ ...prev, [f]: e.target.value }));

  // ── Filter ────────────────────────────────────────────────
  const filtered = history.filter(h => {
    const label = t[h.type_key] || h.type_key;
    const field = t[h.field_key] || h.field_key;
    const matchSearch = label.toLowerCase().includes(search.toLowerCase())
      || field.toLowerCase().includes(search.toLowerCase())
      || (h.notes || "").toLowerCase().includes(search.toLowerCase());
    const matchFilter = filterKey === "all" || h.type_key === filterKey;
    return matchSearch && matchFilter;
  });

  // ── Group by week ─────────────────────────────────────────
  const grouped = {};
  filtered.forEach(h => {
    const d = new Date(h.date);
    const weekStart = new Date(d);
    weekStart.setDate(d.getDate() - d.getDay());
    const key = weekStart.toLocaleDateString("en-IN", { day:"numeric", month:"short", year:"numeric" });
    if (!grouped[key]) grouped[key] = [];
    grouped[key].push(h);
  });

  // ── AI Recommendation (last use of same type) ─────────────
  const recommendation = (() => {
    const matching = history.filter(h => h.type_key === form.typeKey);
    if (!matching.length) return null;
    const last = matching[0];
    return `${t.lastUsedMsg}: ${last.quantity} ${t[last.unit_key] || last.unit_key} (${last.date}). ${t.considerSimilar}`;
  })();

  const filterChips = ["all", ...ACT_KEYS.slice(0, 6)];

  return (
    <MainLayout>
      <div className="page-header">
        <h1>📋 {t.farmHistory}</h1>
        <p>{t.historySub}</p>
      </div>

      {/* Error banner */}
      {error && (
        <div className="alert-box alert-box--error" style={{ marginBottom:12 }}>
          <div className="alert-box__icon">⚠️</div>
          <div className="alert-box__msg">{error}</div>
          <button style={{ marginLeft:"auto", background:"none", border:"none", cursor:"pointer" }}
            onClick={() => setError(null)}>✕</button>
        </div>
      )}

      {/* Controls */}
      <div className="history-controls">
        <div className="history-search">
          <FaSearch className="search-icon" />
          <input className="form-input" style={{ paddingLeft:34 }} placeholder={t.search + "..."}
            value={search} onChange={e => setSearch(e.target.value)} />
        </div>
        <div style={{ display:"flex", gap:8, flexWrap:"wrap" }}>
          <FaFilter style={{ color:"var(--text-muted)", marginTop:8 }} />
          {filterChips.map(k => (
            <button key={k}
              className={`filter-chip ${filterKey===k?"filter-chip--active":""}`}
              onClick={() => setFilterKey(k)}
            >
              {k === "all" ? t.all : (t[k] || k)}
            </button>
          ))}
        </div>
        <div style={{ display:"flex", gap:8 }}>
          <button className="btn-primary-ag" onClick={() => setShowForm(!showForm)}>
            <FaPlus /> {t.addActivity}
          </button>
          {history.length > 0 && (
            <button className="btn-outline-ag" style={{ color:"#c62828" }} onClick={handleClear}>
              <FaTrash /> Clear All
            </button>
          )}
        </div>
      </div>

      {/* Add activity form */}
      {showForm && (
        <div className="card-box history-form-box">
          <h3 className="section-title"><span>➕</span> {t.addActivity}</h3>
          <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr 1fr", gap:"0 16px", flexWrap:"wrap" }}>

            <div style={{ marginBottom:14 }}>
              <label className="form-label">{t.activityType}</label>
              <select className="form-input" value={form.typeKey} onChange={set("typeKey")}>
                {ACT_KEYS.map(k => <option key={k} value={k}>{t[k] || k}</option>)}
              </select>
            </div>

            <div style={{ marginBottom:14 }}>
              <label className="form-label">{t.fieldLabel}</label>
              <select className="form-input" value={form.fieldIdx} onChange={set("fieldIdx")}>
                {fieldLabels.map((lbl, i) => <option key={i} value={i}>{lbl}</option>)}
              </select>
            </div>

            <div style={{ marginBottom:14 }}>
              <label className="form-label">{t.date}</label>
              <input type="date" className="form-input" value={form.date} onChange={set("date")} />
            </div>

            <div style={{ marginBottom:14 }}>
              <label className="form-label">{t.quantity}</label>
              <input type="number" className="form-input" placeholder={t.histPlaceholder || "25"}
                value={form.quantity} onChange={set("quantity")} />
            </div>

            <div style={{ marginBottom:14 }}>
              <label className="form-label">{t.unit}</label>
              <select className="form-input" value={form.unitIdx} onChange={set("unitIdx")}>
                {unitLabels.map((lbl, i) => <option key={i} value={i}>{lbl}</option>)}
              </select>
            </div>

            <div style={{ marginBottom:14 }}>
              <label className="form-label">{t.notes}</label>
              <input type="text" className="form-input" placeholder={t.optionalNotes}
                value={form.notes} onChange={set("notes")} />
            </div>
          </div>

          {recommendation && (
            <div className="alert-box alert-box--info" style={{ marginBottom:12 }}>
              <div className="alert-box__icon">💡</div>
              <div className="alert-box__msg">{t.aiSuggestionPrefix} {recommendation}</div>
            </div>
          )}

          <div style={{ display:"flex", gap:10 }}>
            <button className="btn-primary-ag" onClick={addEntry} disabled={saving}>
              <FaPlus /> {saving ? "Saving..." : t.addActivity}
            </button>
            <button className="btn-outline-ag" onClick={() => setShowForm(false)}>{t.cancel}</button>
          </div>
        </div>
      )}

      {/* Loading state */}
      {loading && (
        <div style={{ textAlign:"center", padding:"40px", color:"var(--text-muted)" }}>
          ⏳ Loading farm history...
        </div>
      )}

      {/* History grouped by week */}
      {!loading && Object.keys(grouped).length === 0 ? (
        <div className="history-empty">
          <span style={{ fontSize:48 }}>📋</span>
          <p>{t.noHistory}</p>
          <button className="btn-primary-ag" onClick={() => setShowForm(true)}><FaPlus /> {t.addActivity}</button>
        </div>
      ) : (
        !loading && Object.entries(grouped).map(([week, entries]) => (
          <div key={week} className="history-week">
            <div className="history-week__label">📅 {t.weekOf} {week}</div>
            <div className="history-items">
              {entries.map(e => {
                const ak    = e.type_key;
                const color = COLOR_MAP[ak] || "#546e7a";
                const icon  = ICON_MAP[ak]  || "📝";
                const label = t[ak] || ak;
                return (
                  <div key={e.id} className="history-item">
                    <div className="history-item__icon" style={{ background:color+"18", color }}>{icon}</div>
                    <div className="history-item__body">
                      <div className="history-item__type">{label}</div>
                      <div className="history-item__meta">
                        <span>🗺️ {t[e.field_key] || e.field_key}</span>
                        <span>⚖️ {e.quantity} {t[e.unit_key] || e.unit_key}</span>
                        <span>📅 {e.date}</span>
                        {e.notes && <span>📝 {e.notes}</span>}
                      </div>
                    </div>
                    <div className="history-item__badge" style={{ background:color+"18", color }}>
                      {label.split(" ")[0]}
                    </div>
                    <button className="history-item__delete" onClick={() => handleDelete(e.id)} title={t.delete}>
                      <FaTrash />
                    </button>
                  </div>
                );
              })}
            </div>
          </div>
        ))
      )}
    </MainLayout>
  );
}
