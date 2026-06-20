import { useState, useEffect, useCallback } from "react";
import {
  FaSeedling, FaMapMarkerAlt, FaRulerCombined, FaCalendarAlt,
  FaWater, FaTractor, FaLeaf, FaEdit, FaSave, FaTimes, FaPlus, FaTrash
} from "react-icons/fa";
import MainLayout from "../layouts/MainLayout";
import { useApp } from "../context/AppContext";
import {
  getFarmDetails, saveFarmDetails,
  getFields, saveField, deleteField,
  getCalendar, saveCalendarItem, deleteCalendarItem,
} from "../api/api";
import NextStepCard from "../components/NextStepCard";
import "../styles/global.css";
import "../styles/Farm.css";
import "../styles/NextStepCard.css";

function healthColor(v) {
  if (v >= 80) return "#2e7d32";
  if (v >= 60) return "#f57c00";
  return "#c62828";
}

const SOIL_TYPES = [
  // Common Indian soil types
  "Red Loam",          // செம்மண்
  "Black Cotton",      // கருப்பு மண்
  "Sandy Loam",        // மணல் கலந்த மண்
  "Clay Loam",         // களிமண்
  "Silt Loam",         // வண்டல் மண்
  // Additional types
  "Alluvial Soil",     // வண்டல் மண் (நதிக்கரை)
  "Laterite Soil",     // லேட்டரைட் மண்
  "Desert Soil",       // பாலைவன மண்
  "Mountain Soil",     // மலை மண்
  "Peaty Soil",        // கரிம மண்
  "Saline Soil",       // உப்பு மண்
  "Loamy Sand",        // மணல் கலந்த வண்டல்
  "Sandy Clay",        // மணல் களிமண்
  "Chalky Soil",       // சுண்ணாம்பு மண்
  "Peat Soil",         // தொண்டு மண்
];
const WATER_SOURCES = ["Borewell","Canal","River","Rainwater","Drip","Sprinkler","Borewell + Canal"];
const IRRIGATION_TYPES = ["Drip","Sprinkler","Furrow","Flood","None"];
const SEASONS = ["Kharif","Rabi","Annual","Zaid"];
const MONTHS = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];

const MONTHS_TA = ["ஜன","பிப்","மார்","ஏப்","மே","ஜூன்","ஜூல்","ஆக்","செப்","அக்","நவ","டிச"];
const MONTHS_HI = ["जन","फर","मार्च","अप्र","मई","जून","जुल","अग","सित","अक्त","नव","दिस"];

export default function Farm() {
  const { t, lang, user, markFlowStep } = useApp();

  /* ── Farm Details state ──────────────────────────────── */
  const [farm,        setFarm]        = useState(null);
  const [farmDraft,   setFarmDraft]   = useState({});
  const [editingFarm, setEditingFarm] = useState(false);
  const [farmSaving,  setFarmSaving]  = useState(false);
  const [farmMsg,     setFarmMsg]     = useState("");

  /* ── Fields state ────────────────────────────────────── */
  const [fields,       setFields]       = useState([]);
  const [editingField, setEditingField] = useState(null); // id or "new"
  const [fieldDraft,   setFieldDraft]   = useState({});
  const [fieldSaving,  setFieldSaving]  = useState(false);

  /* ── Calendar state ──────────────────────────────────── */
  const [calendar,     setCalendar]     = useState([]);
  const [editingCal,   setEditingCal]   = useState(null);
  const [calDraft,     setCalDraft]     = useState({});
  const [calSaving,    setCalSaving]    = useState(false);

  const [loading, setLoading] = useState(true);

  /* ── i18n ────────────────────────────────────────────── */
  const tx = {
    title:         lang==="ta"?"பண்ணை நிர்வாகம்"           :lang==="hi"?"खेत प्रबंधन"              :"Farm Management",
    sub:           lang==="ta"?"உங்கள் பண்ணை விவரங்களை நிர்வகிக்கவும்"
                              :lang==="hi"?"अपने खेत की जानकारी प्रबंधित करें"
                              :"Manage your farm details and monitor all fields",
    farmDetails:   lang==="ta"?"பண்ணை விவரங்கள்"            :lang==="hi"?"खेत विवरण"                :"Farm Details",
    farmName:      lang==="ta"?"பண்ணை பெயர்"                :lang==="hi"?"खेत का नाम"               :"Farm Name",
    owner:         lang==="ta"?"உரிமையாளர்"                  :lang==="hi"?"मालिक"                    :"Owner",
    location:      lang==="ta"?"இடம்"                        :lang==="hi"?"स्थान"                    :"Location",
    totalArea:     lang==="ta"?"மொத்த பரப்பு"               :lang==="hi"?"कुल क्षेत्र"               :"Total Area",
    established:   lang==="ta"?"நிறுவப்பட்ட ஆண்டு"          :lang==="hi"?"स्थापना वर्ष"             :"Established",
    soilType:      lang==="ta"?"மண் வகை"                    :lang==="hi"?"मिट्टी का प्रकार"         :"Soil Type",
    waterSource:   lang==="ta"?"நீர் ஆதாரம்"                :lang==="hi"?"पानी का स्रोत"            :"Water Source",
    activeCrops:   lang==="ta"?"செயலில் உள்ள பயிர்கள்"       :lang==="hi"?"सक्रिय फसलें"             :"Active Crops",
    fieldOverview: lang==="ta"?"வயல் கண்ணோட்டம்"            :lang==="hi"?"खेत अवलोकन"               :"Field Overview",
    cropCalendar:  lang==="ta"?"பயிர் அட்டவணை"              :lang==="hi"?"फसल कैलेंडर"              :"Crop Calendar",
    totalFields:   lang==="ta"?"மொத்த வயல்கள்"              :lang==="hi"?"कुल खेत"                  :"Total Fields",
    irrigated:     lang==="ta"?"நீர்ப்பாசனம்"               :lang==="hi"?"सिंचित"                   :"Irrigated",
    healthyFields: lang==="ta"?"ஆரோக்கியமான வயல்கள்"        :lang==="hi"?"स्वस्थ खेत"               :"Healthy Fields",
    needAttention: lang==="ta"?"கவனம் தேவை"                 :lang==="hi"?"ध्यान चाहिए"              :"Need Attention",
    health:        lang==="ta"?"ஆரோக்கியம்"                 :lang==="hi"?"स्वास्थ्य"                 :"Health",
    noIrrigation:  lang==="ta"?"நீர்ப்பாசனம் இல்லை"         :lang==="hi"?"सिंचाई नहीं"              :"No Irrigation",
    edit:          lang==="ta"?"திருத்து"                    :lang==="hi"?"संपादित करें"              :"Edit",
    save:          lang==="ta"?"சேமி"                        :lang==="hi"?"सहेजें"                   :"Save",
    cancel:        lang==="ta"?"ரத்து"                       :lang==="hi"?"रद्द करें"                :"Cancel",
    add:           lang==="ta"?"சேர்"                        :lang==="hi"?"जोड़ें"                    :"Add",
    delete:        lang==="ta"?"நீக்கு"                      :lang==="hi"?"हटाएं"                    :"Delete",
    addField:      lang==="ta"?"+ வயல் சேர்"                 :lang==="hi"?"+ खेत जोड़ें"              :"+ Add Field",
    addTask:       lang==="ta"?"+ பணி சேர்"                  :lang==="hi"?"+ कार्य जोड़ें"            :"+ Add Task",
    fieldName:     lang==="ta"?"வயல் பெயர்"                  :lang==="hi"?"खेत का नाम"               :"Field Name",
    crop:          lang==="ta"?"பயிர்"                        :lang==="hi"?"फसल"                      :"Crop",
    area:          lang==="ta"?"பரப்பு (ஏக்கர்)"             :lang==="hi"?"क्षेत्र (एकड़)"            :"Area (Acres)",
    irrigation:    lang==="ta"?"நீர்ப்பாசன முறை"             :lang==="hi"?"सिंचाई विधि"              :"Irrigation",
    season:        lang==="ta"?"பருவம்"                      :lang==="hi"?"मौसम"                      :"Season",
    month:         lang==="ta"?"மாதம்"                       :lang==="hi"?"महीना"                     :"Month",
    task:          lang==="ta"?"பணி"                         :lang==="hi"?"कार्य"                     :"Task",
    done:          lang==="ta"?"முடிந்தது"                   :lang==="hi"?"पूरा हुआ"                  :"Done",
    pending:       lang==="ta"?"நிலுவை"                      :lang==="hi"?"लंबित"                     :"Pending",
    saved:         lang==="ta"?"✅ சேமிக்கப்பட்டது!"          :lang==="hi"?"✅ सहेजा गया!"              :"✅ Saved!",
    loading:       lang==="ta"?"ஏற்றுகிறது..."               :lang==="hi"?"लोड हो रहा है..."          :"Loading...",
    loginRequired: lang==="ta"?"உள்நுழைந்து பண்ணை தரவு பார்க்கவும்"
                              :lang==="hi"?"खेत डेटा देखने के लिए लॉगिन करें"
                              :"Login to manage your farm data",
    placeholder:   {
      farmName:  lang==="ta"?"எ.கா. என் பண்ணை"      :lang==="hi"?"जैसे: मेरा खेत"     :"e.g. My Farm",
      owner:     lang==="ta"?"உங்கள் பெயர்"           :lang==="hi"?"आपका नाम"           :"Your name",
      location:  lang==="ta"?"கிராமம், மாவட்டம்"      :lang==="hi"?"गांव, जिला"         :"Village, District",
      area:      lang==="ta"?"எ.கா. 5.5 ஏக்கர்"       :lang==="hi"?"जैसे: 5.5 एकड़"    :"e.g. 5.5 acres",
      year:      lang==="ta"?"எ.கா. 2018"              :lang==="hi"?"जैसे: 2018"         :"e.g. 2018",
      crops:     lang==="ta"?"நெல், கோதுமை, பருத்தி"  :lang==="hi"?"धान, गेहूं, कपास"  :"Rice, Wheat, Cotton",
      fieldName: lang==="ta"?"எ.கா. வடக்கு வயல்"      :lang==="hi"?"जैसे: उत्तर खेत"   :"e.g. North Field",
      cropName:  lang==="ta"?"பயிர் பெயர்"             :lang==="hi"?"फसल का नाम"        :"Crop name",
      task:      lang==="ta"?"பணி விளக்கம்"            :lang==="hi"?"कार्य विवरण"       :"Task description",
    },
  };

  /* ── Load all data ───────────────────────────────────── */
  const loadAll = useCallback(async () => {
    if (!user) return;
    setLoading(true);
    try {
      const [farmRes, fieldsRes, calRes] = await Promise.all([
        getFarmDetails(), getFields(), getCalendar(),
      ]);
      setFarm(farmRes.data?.data || null);
      setFields(fieldsRes.data?.data || []);
      setCalendar(calRes.data?.data || []);
    } catch (e) {
      console.error("Farm load error:", e);
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => { loadAll(); }, [loadAll]);

  /* ── Farm Details save ───────────────────────────────── */
  const handleFarmSave = async () => {
    setFarmSaving(true);
    try {
      await saveFarmDetails({
        farm_name:    farmDraft.farm_name    || "",
        owner:        farmDraft.owner        || "",
        location:     farmDraft.location     || "",
        total_area:   farmDraft.total_area   || "",
        established:  farmDraft.established  || "",
        soil_type:    farmDraft.soil_type    || "",
        water_source: farmDraft.water_source || "",
        active_crops: farmDraft.active_crops || "",
      });
      setFarm(farmDraft);
      setEditingFarm(false);
      setFarmMsg(tx.saved);
      // ✅ Flow Step 1 — Farm Details saved
      markFlowStep("farmDetails");
      setTimeout(() => setFarmMsg(""), 3000);
    } catch (e) {
      setFarmMsg("❌ " + (e.response?.data?.message || "Save failed"));
    } finally {
      setFarmSaving(false);
    }
  };

  /* ── Field save (add or update) ──────────────────────── */
  const handleFieldSave = async () => {
    setFieldSaving(true);
    try {
      await saveField({
        id:         fieldDraft.id   || undefined,
        field_name: fieldDraft.field_name || "",
        crop:       fieldDraft.crop       || "",
        area:       parseFloat(fieldDraft.area) || 1,
        health:     parseInt(fieldDraft.health) || 80,
        irrigation: fieldDraft.irrigation || "",
        season:     fieldDraft.season     || "",
      });
      setEditingField(null);
      setFieldDraft({});
      await loadAll();
    } catch (e) { console.error(e); }
    finally { setFieldSaving(false); }
  };

  const handleFieldDelete = async (id) => {
    if (!window.confirm(
      lang==="ta"?"இந்த வயலை நீக்க விரும்புகிறீர்களா?":lang==="hi"?"क्या आप यह खेत हटाना चाहते हैं?":"Delete this field?"
    )) return;
    try { await deleteField(id); await loadAll(); } catch (e) { console.error(e); }
  };

  /* ── Calendar save ───────────────────────────────────── */
  const handleCalSave = async () => {
    setCalSaving(true);
    try {
      await saveCalendarItem({
        id:    calDraft.id     || undefined,
        month: calDraft.month  || "",
        task:  calDraft.task   || "",
        done:  calDraft.done   ? 1 : 0,
      });
      setEditingCal(null);
      setCalDraft({});
      await loadAll();
    } catch (e) { console.error(e); }
    finally { setCalSaving(false); }
  };

  const handleCalDelete = async (id) => {
    try { await deleteCalendarItem(id); await loadAll(); } catch (e) { console.error(e); }
  };

  const handleCalToggle = async (item) => {
    try {
      await saveCalendarItem({ id: item.id, month: item.month, task: item.task, done: item.done ? 0 : 1 });
      await loadAll();
    } catch (e) { console.error(e); }
  };

  /* ── Stats ───────────────────────────────────────────── */
  const stats = [
    { label:tx.totalFields,   value:fields.length,                               icon:<FaTractor />, color:"#0277bd" },
    { label:tx.irrigated,     value:fields.filter(f=>f.irrigation&&f.irrigation!=="None").length, icon:<FaWater />, color:"#2e7d32" },
    { label:tx.healthyFields, value:fields.filter(f=>f.health>=80).length,        icon:<FaLeaf />,    color:"#558b2f" },
    { label:tx.needAttention, value:fields.filter(f=>f.health<70).length,         icon:<FaSeedling/>, color:"#e65100" },
  ];

  if (!user) return (
    <MainLayout>
      <div className="page-header"><h1>{tx.title}</h1></div>
      <div className="alert-box alert-box--info">
        <div className="alert-box__icon">🔒</div>
        <div className="alert-box__msg">{tx.loginRequired}</div>
      </div>
    </MainLayout>
  );

  if (loading) return (
    <MainLayout>
      <div className="page-header"><h1>{tx.title}</h1></div>
      <div style={{ color:"var(--text-muted)", padding:20, display:"flex", gap:10, alignItems:"center" }}>
        <div className="spinner" style={{ width:20, height:20 }} /> {tx.loading}
      </div>
    </MainLayout>
  );

  return (
    <MainLayout>
      <div className="page-container">
        {/* Header */}
        <div className="page-header">
          <div>
            <h1 className="page-title">{tx.title}</h1>
            <p className="page-subtitle">{tx.sub}</p>
          </div>
        </div>

        {/* Stats */}
        <div className="stats-grid" style={{ gridTemplateColumns:"repeat(4,1fr)", marginBottom:28 }}>
          {stats.map(s => (
            <div key={s.label} className="metric-card" style={{ borderTop:`4px solid ${s.color}` }}>
              <div className="metric-card__icon" style={{ background:`${s.color}18`, color:s.color }}>{s.icon}</div>
              <div className="metric-card__body">
                <div className="metric-card__label">{s.label}</div>
                <div className="metric-card__value" style={{ color:s.color }}>{s.value}</div>
              </div>
            </div>
          ))}
        </div>

        <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:24, marginBottom:28 }}>

          {/* ── FARM DETAILS ───────────────────────────── */}
          <div className="card">
            <div className="card-header" style={{ display:"flex", justifyContent:"space-between", alignItems:"center" }}>
              <h2 className="card-title">{tx.farmDetails}</h2>
              {!editingFarm ? (
                <button className="btn btn-primary" style={{ padding:"6px 14px", fontSize:13 }}
                  onClick={() => { setFarmDraft(farm || {}); setEditingFarm(true); }}>
                  <FaEdit style={{ marginRight:4 }} />{tx.edit}
                </button>
              ) : (
                <div style={{ display:"flex", gap:8 }}>
                  <button className="btn btn-primary" style={{ padding:"6px 14px", fontSize:13 }}
                    onClick={handleFarmSave} disabled={farmSaving}>
                    <FaSave style={{ marginRight:4 }} />{farmSaving ? "..." : tx.save}
                  </button>
                  <button className="btn btn-outline" style={{ padding:"6px 14px", fontSize:13 }}
                    onClick={() => { setEditingFarm(false); setFarmDraft({}); }}>
                    <FaTimes style={{ marginRight:4 }} />{tx.cancel}
                  </button>
                </div>
              )}
            </div>
            {farmMsg && (
              <div style={{ padding:"8px 16px", fontSize:13, color:farmMsg.startsWith("✅")?"#2e7d32":"#d32f2f",
                background:farmMsg.startsWith("✅")?"#e8f5e9":"#ffebee", borderRadius:6, margin:"0 16px 8px" }}>
                {farmMsg}
              </div>
            )}
            <div className="card-body">
              {editingFarm ? (
                <div style={{ display:"flex", flexDirection:"column", gap:12 }}>
                  {[
                    { label:tx.farmName,    key:"farm_name",    ph:tx.placeholder.farmName,  type:"text"   },
                    { label:tx.owner,       key:"owner",        ph:tx.placeholder.owner,     type:"text"   },
                    { label:tx.location,    key:"location",     ph:tx.placeholder.location,  type:"text"   },
                    { label:tx.totalArea,   key:"total_area",   ph:tx.placeholder.area,       type:"text"   },
                    { label:tx.established, key:"established",  ph:tx.placeholder.year,       type:"text"   },
                    { label:tx.activeCrops, key:"active_crops", ph:tx.placeholder.crops,      type:"text"   },
                  ].map(f => (
                    <div key={f.key}>
                      <label style={{ fontSize:12, fontWeight:700, color:"var(--text-muted)", display:"block", marginBottom:4 }}>{f.label}</label>
                      <input className="form-input" style={{ fontSize:14 }} type={f.type}
                        placeholder={f.ph} value={farmDraft[f.key] || ""}
                        onChange={e => setFarmDraft(p => ({ ...p, [f.key]: e.target.value }))} />
                    </div>
                  ))}
                  <div>
                    <label style={{ fontSize:12, fontWeight:700, color:"var(--text-muted)", display:"block", marginBottom:4 }}>{tx.soilType}</label>
                    <select className="form-input" value={farmDraft.soil_type || ""}
                      onChange={e => setFarmDraft(p => ({ ...p, soil_type: e.target.value }))}>
                      <option value="">— Select —</option>
                      {SOIL_TYPES.map(s => <option key={s} value={s}>{s}</option>)}
                    </select>
                  </div>
                  <div>
                    <label style={{ fontSize:12, fontWeight:700, color:"var(--text-muted)", display:"block", marginBottom:4 }}>{tx.waterSource}</label>
                    <select className="form-input" value={farmDraft.water_source || ""}
                      onChange={e => setFarmDraft(p => ({ ...p, water_source: e.target.value }))}>
                      <option value="">— Select —</option>
                      {WATER_SOURCES.map(s => <option key={s} value={s}>{s}</option>)}
                    </select>
                  </div>
                </div>
              ) : farm ? (
                <div className="farm-detail-grid">
                  {[
                    { label:tx.farmName,    value:farm.farm_name,    icon:<FaSeedling /> },
                    { label:tx.owner,       value:farm.owner,        icon:<FaTractor /> },
                    { label:tx.location,    value:farm.location,     icon:<FaMapMarkerAlt /> },
                    { label:tx.totalArea,   value:farm.total_area,   icon:<FaRulerCombined /> },
                    { label:tx.established, value:farm.established,  icon:<FaCalendarAlt /> },
                    { label:tx.soilType,    value:farm.soil_type,    icon:<FaLeaf /> },
                    { label:tx.waterSource, value:farm.water_source, icon:<FaWater /> },
                    { label:tx.activeCrops, value:farm.active_crops, icon:<FaSeedling /> },
                  ].map(d => (
                    <div key={d.label} className="farm-detail-item">
                      <div className="farm-detail-item__label">{d.icon} {d.label}</div>
                      <div className="farm-detail-item__value">{d.value || "—"}</div>
                    </div>
                  ))}
                </div>
              ) : (
                <div style={{ color:"var(--text-muted)", fontSize:14, padding:"12px 0" }}>
                  {lang==="ta"?"பண்ணை விவரங்கள் இல்லை. Edit பண்ணி சேமிக்கவும்."
                              :lang==="hi"?"खेत विवरण नहीं है। Edit करके सहेजें।"
                              :"No farm details yet. Click Edit to add yours."}
                </div>
              )}
            </div>
          </div>

          {/* ── CROP CALENDAR ──────────────────────────── */}
          <div className="card">
            <div className="card-header" style={{ display:"flex", justifyContent:"space-between", alignItems:"center" }}>
              <h2 className="card-title">{tx.cropCalendar}</h2>
              <button className="btn btn-primary" style={{ padding:"6px 14px", fontSize:13 }}
                onClick={() => { setEditingCal("new"); setCalDraft({ done:false }); }}>
                <FaPlus style={{ marginRight:4 }} />{tx.addTask}
              </button>
            </div>
            <div className="card-body">
              {/* Add/edit task form */}
              {editingCal && (
                <div style={{ background:"var(--bg-secondary)", borderRadius:10, padding:12, marginBottom:14, display:"flex", flexDirection:"column", gap:8 }}>
                  <div style={{ display:"grid", gridTemplateColumns:"1fr 2fr", gap:8 }}>
                    <select className="form-input" style={{ fontSize:13 }} value={calDraft.month || ""}
                      onChange={e => setCalDraft(p => ({ ...p, month: e.target.value }))}>
                      <option value="">{tx.month}</option>
                      {MONTHS.map((m, i) => (
                        <option key={m} value={m}>
                          {lang==="ta" ? MONTHS_TA[i] : lang==="hi" ? MONTHS_HI[i] : m}
                        </option>
                      ))}
                    </select>
                    <input className="form-input" style={{ fontSize:13 }} type="text"
                      placeholder={tx.placeholder.task} value={calDraft.task || ""}
                      onChange={e => setCalDraft(p => ({ ...p, task: e.target.value }))} />
                  </div>
                  <label style={{ display:"flex", alignItems:"center", gap:8, fontSize:13 }}>
                    <input type="checkbox" checked={!!calDraft.done}
                      onChange={e => setCalDraft(p => ({ ...p, done: e.target.checked }))} />
                    {tx.done}
                  </label>
                  <div style={{ display:"flex", gap:8 }}>
                    <button className="btn btn-primary" style={{ flex:1, fontSize:13 }}
                      onClick={handleCalSave} disabled={calSaving || !calDraft.task || !calDraft.month}>
                      <FaSave style={{ marginRight:4 }} />{calSaving ? "..." : tx.save}
                    </button>
                    <button className="btn btn-outline" style={{ flex:1, fontSize:13 }}
                      onClick={() => { setEditingCal(null); setCalDraft({}); }}>
                      {tx.cancel}
                    </button>
                  </div>
                </div>
              )}

              {calendar.length === 0 && !editingCal && (
                <div style={{ color:"var(--text-muted)", fontSize:13 }}>
                  {lang==="ta"?"பணிகள் இல்லை. + பணி சேர் பயன்படுத்தி சேமிக்கவும்."
                              :lang==="hi"?"कोई कार्य नहीं। + कार्य जोड़ें से जोड़ें।"
                              :"No tasks yet. Use + Add Task to create one."}
                </div>
              )}
              {calendar.map((c, i) => (
                <div key={c.id} style={{
                  display:"flex", alignItems:"center", gap:10,
                  padding:"10px 0", borderBottom: i < calendar.length-1 ? "1px solid var(--border)" : "none"
                }}>
                  <button onClick={() => handleCalToggle(c)} style={{
                    minWidth:38, padding:"3px 6px", borderRadius:8, border:"none", cursor:"pointer",
                    background: c.done ? "#e8f5e9" : "#fff8e1",
                    color: c.done ? "#2e7d32" : "#f57c00", fontSize:11, fontWeight:700
                  }}>
                    {lang==="ta" ? MONTHS_TA[MONTHS.indexOf(c.month)] ?? c.month
                     : lang==="hi" ? MONTHS_HI[MONTHS.indexOf(c.month)] ?? c.month
                     : c.month}
                  </button>
                  <span style={{ flex:1, fontSize:13, color:"var(--text-secondary)" }}>{c.task}</span>
                  <span style={{
                    fontSize:11, fontWeight:700, padding:"2px 8px", borderRadius:12,
                    color: c.done ? "#2e7d32" : "#f57c00",
                    background: c.done ? "#e8f5e9" : "#fff8e1"
                  }}>
                    {c.done ? `✓ ${tx.done}` : tx.pending}
                  </span>
                  <button onClick={() => handleCalDelete(c.id)} title="Delete"
                    style={{ background:"none", border:"none", cursor:"pointer", color:"#d32f2f", fontSize:14, padding:4 }}>
                    <FaTrash />
                  </button>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* ── FIELD OVERVIEW ───────────────────────────── */}
        <div className="card">          <div className="card-header" style={{ display:"flex", justifyContent:"space-between", alignItems:"center" }}>
            <h2 className="card-title">{tx.fieldOverview}</h2>
            <button className="btn btn-primary" style={{ padding:"6px 14px", fontSize:13 }}
              onClick={() => { setEditingField("new"); setFieldDraft({ health:80 }); }}>
              <FaPlus style={{ marginRight:4 }} />{tx.addField}
            </button>
          </div>
          <div className="card-body">
            {/* Add/edit field form */}
            {editingField && (
              <div style={{ background:"var(--bg-secondary)", borderRadius:12, padding:16, marginBottom:18, display:"flex", flexDirection:"column", gap:10 }}>
                <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:10 }}>
                  <div>
                    <label style={{ fontSize:12, fontWeight:700, color:"var(--text-muted)", display:"block", marginBottom:3 }}>{tx.fieldName}</label>
                    <input className="form-input" style={{ fontSize:13 }} placeholder={tx.placeholder.fieldName}
                      value={fieldDraft.field_name || ""}
                      onChange={e => setFieldDraft(p => ({ ...p, field_name: e.target.value }))} />
                  </div>
                  <div>
                    <label style={{ fontSize:12, fontWeight:700, color:"var(--text-muted)", display:"block", marginBottom:3 }}>{tx.crop}</label>
                    <input className="form-input" style={{ fontSize:13 }} placeholder={tx.placeholder.cropName}
                      value={fieldDraft.crop || ""}
                      onChange={e => setFieldDraft(p => ({ ...p, crop: e.target.value }))} />
                  </div>
                  <div>
                    <label style={{ fontSize:12, fontWeight:700, color:"var(--text-muted)", display:"block", marginBottom:3 }}>{tx.area}</label>
                    <input className="form-input" style={{ fontSize:13 }} type="number" min="0.1" step="0.1" placeholder="e.g. 2.5"
                      value={fieldDraft.area || ""}
                      onChange={e => setFieldDraft(p => ({ ...p, area: e.target.value }))} />
                  </div>
                  <div>
                    <label style={{ fontSize:12, fontWeight:700, color:"var(--text-muted)", display:"block", marginBottom:3 }}>{tx.health} (%)</label>
                    <input className="form-input" style={{ fontSize:13 }} type="number" min="0" max="100"
                      value={fieldDraft.health || 80}
                      onChange={e => setFieldDraft(p => ({ ...p, health: e.target.value }))} />
                  </div>
                  <div>
                    <label style={{ fontSize:12, fontWeight:700, color:"var(--text-muted)", display:"block", marginBottom:3 }}>{tx.irrigation}</label>
                    <select className="form-input" style={{ fontSize:13 }} value={fieldDraft.irrigation || ""}
                      onChange={e => setFieldDraft(p => ({ ...p, irrigation: e.target.value }))}>
                      <option value="">— Select —</option>
                      {IRRIGATION_TYPES.map(s => <option key={s} value={s}>{s}</option>)}
                    </select>
                  </div>
                  <div>
                    <label style={{ fontSize:12, fontWeight:700, color:"var(--text-muted)", display:"block", marginBottom:3 }}>{tx.season}</label>
                    <select className="form-input" style={{ fontSize:13 }} value={fieldDraft.season || ""}
                      onChange={e => setFieldDraft(p => ({ ...p, season: e.target.value }))}>
                      <option value="">— Select —</option>
                      {SEASONS.map(s => <option key={s} value={s}>{s}</option>)}
                    </select>
                  </div>
                </div>
                <div style={{ display:"flex", gap:10 }}>
                  <button className="btn btn-primary" style={{ flex:1 }}
                    onClick={handleFieldSave} disabled={fieldSaving || !fieldDraft.field_name}>
                    <FaSave style={{ marginRight:6 }} />{fieldSaving ? "..." : tx.save}
                  </button>
                  <button className="btn btn-outline" style={{ flex:1 }}
                    onClick={() => { setEditingField(null); setFieldDraft({}); }}>
                    {tx.cancel}
                  </button>
                </div>
              </div>
            )}

            {fields.length === 0 && !editingField && (
              <div style={{ color:"var(--text-muted)", fontSize:13 }}>
                {lang==="ta"?"வயல்கள் இல்லை. + வயல் சேர் பயன்படுத்தவும்."
                            :lang==="hi"?"कोई खेत नहीं। + खेत जोड़ें का उपयोग करें।"
                            :"No fields yet. Use + Add Field to create one."}
              </div>
            )}
            <div className="field-cards-grid">
              {fields.map(f => (
                <div key={f.id} className="field-info-card">
                  <div className="field-info-card__top">
                    <div>
                      <div className="field-info-card__name">{f.field_name}</div>
                      <div className="field-info-card__crop">{f.crop || "—"}</div>
                    </div>
                    <div style={{ display:"flex", flexDirection:"column", alignItems:"flex-end", gap:4 }}>
                      <span style={{
                        fontSize:22, width:40, height:40, borderRadius:"50%",
                        background:`${healthColor(f.health)}18`, display:"flex",
                        alignItems:"center", justifyContent:"center",
                        color:healthColor(f.health), fontWeight:800
                      }}>{f.health}</span>
                      <div style={{ display:"flex", gap:4 }}>
                        <button onClick={() => { setEditingField(f.id); setFieldDraft({ ...f }); }}
                          style={{ background:"none", border:"none", cursor:"pointer", color:"#0277bd", fontSize:13 }}>
                          <FaEdit />
                        </button>
                        <button onClick={() => handleFieldDelete(f.id)}
                          style={{ background:"none", border:"none", cursor:"pointer", color:"#d32f2f", fontSize:13 }}>
                          <FaTrash />
                        </button>
                      </div>
                    </div>
                  </div>
                  <div className="field-info-card__meta">
                    <span><FaRulerCombined /> {f.area} {lang==="ta"?"ஏக்கர்":lang==="hi"?"एकड़":"acres"}</span>
                    <span><FaCalendarAlt /> {f.season || "—"}</span>
                    <span><FaWater /> {f.irrigation || tx.noIrrigation}</span>
                  </div>
                  <div style={{ background:"var(--border)", borderRadius:99, height:6, overflow:"hidden" }}>
                    <div style={{ width:`${f.health}%`, background:healthColor(f.health), height:"100%", borderRadius:99, transition:"width 0.6s" }} />
                  </div>
                  <div style={{ display:"flex", justifyContent:"space-between", marginTop:4, fontSize:11, color:"var(--text-muted)" }}>
                    <span>{tx.health}</span>
                    <span style={{ color:healthColor(f.health), fontWeight:700 }}>{f.health}%</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* ✅ Smart Flow — Next Step: Weather & Location */}
      <NextStepCard currentStep="farmDetails" />
    </MainLayout>
  );
}
