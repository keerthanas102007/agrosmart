import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { FaUser, FaPhone, FaMapMarkerAlt, FaSeedling, FaEdit, FaSave, FaTimes, FaMoon, FaSun, FaGlobe, FaCamera } from "react-icons/fa";
import MainLayout from "../layouts/MainLayout";
import { useApp } from "../context/AppContext";
import { getProfile, updateProfile, getMyProfitHistory, getMyPosts, getDiseaseHistory, deleteAccount } from "../api/api";
import "../styles/global.css";
import "../styles/Profile.css";

export default function Profile() {
  const navigate = useNavigate();
  const { t, lang, setLang, darkMode, setDarkMode, user, setUser, logout } = useApp();

  const isGuest = !user;
  const [profileData, setProfileData] = useState(null);
  const [editing, setEditing]         = useState(false);
  const [form, setForm]               = useState({});
  const [profilePic, setProfilePic]   = useState(null);
  const [picPreview, setPicPreview]   = useState(null);
  const [saving, setSaving]           = useState(false);
  const [saved, setSaved]             = useState(false);
  const [showDelete, setShowDelete]   = useState(false);
  const [deleteError, setDeleteError] = useState("");
  const [error, setError]             = useState("");

  // Tab state
  const [activeTab,     setActiveTab]     = useState(null);      // null | 'profit' | 'posts' | 'disease'
  const [tabData,       setTabData]       = useState([]);
  const [tabLoading,    setTabLoading]    = useState(false);
  const [tabError,      setTabError]      = useState("");

  useEffect(() => {
    if (user) fetchProfile();
  }, [user]);

  const fetchProfile = async () => {
    try {
      const res = await getProfile();
      setProfileData(res.data);
      setForm({
        name:        res.data.name        || "",
        location:    res.data.location    || "",
        phone:       res.data.phone       || "",
        farmSize:    res.data.farm_size   || "",
        primaryCrop: res.data.primary_crop|| "",
        state:       res.data.state       || "",
      });
    } catch (err) {
      console.error(err);
    }
  };

  const handlePicChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setProfilePic(file);
    setPicPreview(URL.createObjectURL(file));
  };

  const handleSave = async () => {
    try {
      setSaving(true);
      setError("");
      const fd = new FormData();
      fd.append("name",        form.name);
      fd.append("location",    form.location);
      fd.append("phone",       form.phone);
      fd.append("farmSize",    form.farmSize);
      fd.append("primaryCrop", form.primaryCrop);
      fd.append("state",       form.state);
      if (profilePic) fd.append("profile_pic", profilePic);

      await updateProfile(fd);
      setEditing(false);
      setSaved(true);
      fetchProfile();
      setTimeout(() => setSaved(false), 2500);
    } catch (err) {
      setError(err.response?.data?.message || t.saveError || "Could not save.");
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteAccount = async () => {
    try {
      setDeleteError("");
      await deleteAccount();   // DELETE /api/auth/delete-account → removes from DB
      logout();                // clear localStorage + context
      navigate("/");
    } catch (err) {
      setDeleteError(err.response?.data?.message || "Could not delete account. Try again.");
    }
  };

  const openTab = async (tab) => {
    if (activeTab === tab) { setActiveTab(null); return; }
    setActiveTab(tab);
    setTabData([]);
    setTabError("");
    setTabLoading(true);
    try {
      let res;
      if (tab === "profit")  res = await getMyProfitHistory();
      if (tab === "posts")   res = await getMyPosts();
      if (tab === "disease") res = await getDiseaseHistory();
      // Axios returns array directly in res.data (not wrapped in {data:[]})
      const raw = res?.data;
      setTabData(Array.isArray(raw) ? raw : (raw?.data || []));
    } catch (e) {
      console.error(`Tab [${tab}] error:`, e.response?.data || e.message);
      setTabError(
        e.response?.data?.message
        || e.response?.data?.error
        || e.message
        || "Failed to load data"
      );
    } finally {
      setTabLoading(false);
    }
  };

  const avatarSrc = picPreview
    || (profileData?.profile_pic ? `http://localhost:5000/uploads/profiles/${profileData.profile_pic}` : null);

  const fields = [
    { key: "name",        label: t.fullName,    icon: <FaUser />,         type: "text" },
    { key: "phone",       label: t.mobile,      icon: <FaPhone />,        type: "tel" },
    { key: "location",    label: t.village,     icon: <FaMapMarkerAlt />, type: "text" },
    { key: "state",       label: t.state,       icon: <FaMapMarkerAlt />, type: "text" },
    { key: "farmSize",    label: t.farmSize,    icon: <FaSeedling />,     type: "number" },
    { key: "primaryCrop", label: t.primaryCrop, icon: <FaSeedling />,     type: "text" },
  ];

  return (
    <MainLayout>
      <div className="page-header">
        <h1>👤 {t.myProfile}</h1>
        <p>{isGuest ? t.guestMode : t.farmer}</p>
      </div>

      {saved && (
        <div className="alert-box alert-box--success" style={{ marginBottom: 16 }}>
          <div className="alert-box__icon">✅</div>
          <div className="alert-box__msg">{t.profileUpdated}</div>
        </div>
      )}

      {error && (
        <div className="alert-box alert-box--warning" style={{ marginBottom: 16 }}>
          <div className="alert-box__msg">⚠️ {error}</div>
        </div>
      )}

      <div className="two-col" style={{ alignItems: "start" }}>
        {/* Profile Card */}
        <div className="card-box">
          {/* Avatar */}
          <div className="profile-avatar-wrap">
            <div className="profile-avatar-container">
              {avatarSrc ? (
                <img src={avatarSrc} alt="Profile" className="profile-avatar-img" />
              ) : (
                <div className="profile-avatar">
                  {(form.name || user?.name || "F").charAt(0).toUpperCase()}
                </div>
              )}
              {editing && (
                <label className="profile-pic-overlay" title="Change photo">
                  <FaCamera />
                  <input type="file" accept="image/*" style={{ display: "none" }} onChange={handlePicChange} />
                </label>
              )}
            </div>
            <div>
              <div className="profile-name">{form.name || profileData?.name || t.farmer}</div>
              <div className="profile-role">🌾 {t.farmer}</div>
              {profileData?.created_at && (
                <div className="profile-since">
                  {t.memberSince || "Member since"} {new Date(profileData.created_at).toLocaleDateString("en-IN")}
                </div>
              )}
            </div>
            {!isGuest && (
              <button
                className={editing ? "btn-outline-ag" : "btn-primary-ag"}
                style={{ marginLeft: "auto" }}
                onClick={() => editing ? setEditing(false) : setEditing(true)}
              >
                {editing ? <><FaTimes /> {t.cancel}</> : <><FaEdit /> {t.editProfile}</>}
              </button>
            )}
          </div>

          {isGuest ? (
            <div className="alert-box alert-box--info" style={{ marginTop: 16 }}>
              <div className="alert-box__icon">👁</div>
              <div>
                <div className="alert-box__title">{t.guestMode}</div>
                <div className="alert-box__msg">{t.guestBrowsingMsg}</div>
              </div>
            </div>
          ) : (
            <div className="profile-fields">
              {fields.map(f => (
                <div key={f.key} className="profile-field">
                  <label>{f.label}</label>
                  {editing ? (
                    <div className="auth-input-wrap" style={{ maxWidth: "100%" }}>
                      <span className="auth-input-icon">{f.icon}</span>
                      <input
                        type={f.type}
                        className="form-input"
                        style={{ paddingLeft: 38 }}
                        value={form[f.key] || ""}
                        onChange={e => setForm(prev => ({ ...prev, [f.key]: e.target.value }))}
                      />
                    </div>
                  ) : (
                    <div className="profile-field__val">
                      {form[f.key] || <span style={{ color: "var(--text-muted)" }}>—</span>}
                    </div>
                  )}
                </div>
              ))}
              {editing && (
                <button
                  className="btn-primary-ag"
                  style={{ width: "100%", justifyContent: "center", marginTop: 8 }}
                  onClick={handleSave}
                  disabled={saving}
                >
                  <FaSave /> {saving ? (t.savingBtn || "Saving...") : t.saveProfile}
                </button>
              )}
            </div>
          )}

          {/* Tab buttons */}
          {!isGuest && (
            <div className="profile-quick-links">
              <button
                className={`quick-link${activeTab === "profit" ? " quick-link--active" : ""}`}
                onClick={() => openTab("profit")}
              >💰 {t.profitHistoryLink || "Profit History"}</button>
              <button
                className={`quick-link${activeTab === "posts" ? " quick-link--active" : ""}`}
                onClick={() => openTab("posts")}
              >🌾 {t.myPostsLink || "My Posts"}</button>
              <button
                className={`quick-link${activeTab === "disease" ? " quick-link--active" : ""}`}
                onClick={() => openTab("disease")}
              >🔬 {t.diseaseHistLink || "Disease History"}</button>
            </div>
          )}

          {/* Tab content */}
          {activeTab && !isGuest && (
            <div style={{ marginTop: 16 }}>
              {tabLoading && (
                <div style={{ textAlign:"center", padding:24, color:"var(--text-muted)" }}>
                  <span style={{ fontSize:24 }}>⏳</span>
                  <div style={{ marginTop:8, fontSize:13 }}>Loading...</div>
                </div>
              )}
              {tabError && (
                <div className="alert-box alert-box--warning">
                  <div className="alert-box__msg">⚠️ {tabError}</div>
                  <div style={{ fontSize: 11, marginTop: 6, color: "var(--text-muted)" }}>
                    Tip: Backend server running-ல இருக்கா? DB table exist ஆச்சா check பண்ணவும்.
                  </div>
                </div>
              )}
              {!tabLoading && !tabError && tabData.length === 0 && (
                <div style={{ textAlign:"center", padding:24, color:"var(--text-muted)", fontSize:13 }}>
                  {activeTab === "profit"  && "📭 No profit history yet."}
                  {activeTab === "posts"   && "📭 You haven't posted yet."}
                  {activeTab === "disease" && "📭 No disease detections yet."}
                </div>
              )}

              {/* ── PROFIT HISTORY ── */}
              {activeTab === "profit" && !tabLoading && tabData.map((p, i) => (
                <div key={i} style={{
                  background:"var(--bg-secondary,#f8fbf8)", border:"1px solid var(--border,#e0e7ef)",
                  borderRadius:10, padding:"12px 16px", marginBottom:10,
                  borderLeft:"4px solid #2e7d32"
                }}>
                  <div style={{ fontWeight:700, color:"#2e7d32", fontSize:15 }}>🌱 {p.crop_name}</div>
                  <div style={{ display:"flex", gap:20, marginTop:6, flexWrap:"wrap" }}>
                    <span style={{ fontSize:13 }}>💰 Investment: <strong>₹{Number(p.investment).toLocaleString()}</strong></span>
                    <span style={{ fontSize:13, color: p.profit >= 0 ? "#2e7d32" : "#c62828" }}>
                      📈 Profit: <strong>₹{Number(p.profit).toLocaleString()}</strong>
                    </span>
                  </div>
                  {p.description && <div style={{ fontSize:12, color:"var(--text-muted)", marginTop:4 }}>{p.description}</div>}
                  <div style={{ fontSize:11, color:"var(--text-muted)", marginTop:4 }}>
                    🕐 {new Date(p.created_at).toLocaleDateString("en-IN")}
                  </div>
                </div>
              ))}

              {/* ── MY POSTS ── */}
              {activeTab === "posts" && !tabLoading && tabData.map((p, i) => (
                <div key={i} style={{
                  background:"var(--bg-secondary,#f8fbf8)", border:"1px solid var(--border,#e0e7ef)",
                  borderRadius:10, padding:"12px 16px", marginBottom:10
                }}>
                  <div style={{ fontWeight:700, fontSize:14, color:"var(--text-primary)" }}>📝 {p.title}</div>
                  {p.description && <div style={{ fontSize:12, color:"var(--text-muted)", marginTop:4 }}>{p.description}</div>}
                  {p.image && (
                    <img
                      src={`http://localhost:5000/uploads/posts/${p.image}`}
                      alt={p.title}
                      style={{ width:"100%", maxHeight:180, objectFit:"cover", borderRadius:8, marginTop:8 }}
                    />
                  )}
                  <div style={{ display:"flex", gap:16, marginTop:8, fontSize:12, color:"var(--text-muted)" }}>
                    <span>❤️ {p.like_count || 0} likes</span>
                    <span>💬 {p.comment_count || 0} comments</span>
                    <span>🕐 {new Date(p.created_at).toLocaleDateString("en-IN")}</span>
                  </div>
                </div>
              ))}

              {/* ── DISEASE HISTORY ── */}
              {activeTab === "disease" && !tabLoading && tabData.map((d, i) => (
                <div key={i} style={{
                  background:"var(--bg-secondary,#f8fbf8)", border:"1px solid var(--border,#e0e7ef)",
                  borderRadius:10, padding:"12px 16px", marginBottom:10,
                  borderLeft:`4px solid ${d.severity === "high" ? "#c62828" : d.severity === "medium" ? "#f57f17" : "#2e7d32"}`
                }}>
                  <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center" }}>
                    <div style={{ fontWeight:700, fontSize:14 }}>🦠 {d.disease_name || "Unknown"}</div>
                    <span style={{
                      fontSize:11, fontWeight:700, padding:"2px 10px", borderRadius:20,
                      background: d.severity === "high" ? "#ffebee" : d.severity === "medium" ? "#fff3e0" : "#e8f5e9",
                      color:      d.severity === "high" ? "#c62828" : d.severity === "medium" ? "#f57f17" : "#2e7d32"
                    }}>{d.severity?.toUpperCase()}</span>
                  </div>
                  <div style={{ fontSize:12, color:"var(--text-muted)", marginTop:4 }}>
                    🌿 Crop: {d.crop_type || "—"} &nbsp;|&nbsp; Confidence: {d.confidence || 0}%
                  </div>
                  {d.image_filename && (
                    <img
                      src={`http://localhost:5000/uploads/diseases/${d.image_filename}`}
                      alt="disease"
                      style={{ width:"100%", maxHeight:140, objectFit:"cover", borderRadius:8, marginTop:8 }}
                    />
                  )}
                  <div style={{ fontSize:11, color:"var(--text-muted)", marginTop:6 }}>
                    🕐 {new Date(d.created_at).toLocaleDateString("en-IN")}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Settings */}
        <div>
          <div className="card-box" style={{ marginBottom: 18 }}>
            <h3 className="section-title"><span>⚙️</span> {t.settingsTitle || "Settings"}</h3>

            <div className="setting-row">
              <div>
                <div className="setting-row__label">{darkMode ? (t.darkMode || "Dark Mode") : (t.lightMode || "Light Mode")}</div>
                <div className="setting-row__sub">{t.toggleTheme}</div>
              </div>
              <button className="toggle-btn" onClick={() => setDarkMode(!darkMode)}>
                {darkMode ? <FaSun /> : <FaMoon />}
                <div className={`toggle-track ${darkMode ? "toggle-track--on" : ""}`}>
                  <div className="toggle-thumb" />
                </div>
              </button>
            </div>

            <div className="setting-row">
              <div>
                <div className="setting-row__label"><FaGlobe style={{ marginRight: 6 }} />{t.languageLabel}</div>
                <div className="setting-row__sub">{t.languageSub}</div>
              </div>
              <div style={{ display: "flex", gap: 6 }}>
                {[["en", "EN"], ["ta", "த"], ["hi", "हि"]].map(([l, lb]) => (
                  <button key={l}
                    className={`lang-pill ${lang === l ? "lang-pill--active" : ""}`}
                    onClick={() => setLang(l)}
                  >{lb}</button>
                ))}
              </div>
            </div>
          </div>

          {/* Danger zone */}
          {!isGuest && (
            <div className="card-box" style={{ border: "1.5px solid var(--danger-light)" }}>
              <h3 className="section-title" style={{ color: "var(--danger)" }}>
                <span>⚠️</span> {t.dangerZone}
              </h3>
              <p style={{ fontSize: 13, color: "var(--text-secondary)", marginBottom: 14 }}>
                {t.dangerNote}
              </p>
              <button className="btn-danger-ag" onClick={() => setShowDelete(true)}>
                🗑️ {t.deleteAccount}
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Delete confirm modal */}
      {showDelete && (
        <div className="modal-overlay">
          <div className="modal-box">
            <div style={{ fontSize: 40, marginBottom: 12 }}>⚠️</div>
            <h3>{t.deleteAccount}</h3>
            <p>{t.confirmDelete}</p>
            {deleteError && (
              <div style={{ color:"#c62828", fontSize:13, marginTop:8, background:"#ffebee", padding:"8px 12px", borderRadius:8 }}>
                ⚠️ {deleteError}
              </div>
            )}
            <div style={{ display: "flex", gap: 12, marginTop: 20 }}>
              <button className="btn-danger-ag" style={{ flex: 1, justifyContent: "center" }} onClick={handleDeleteAccount}>
                {t.yesDelete}
              </button>
              <button className="btn-outline-ag" style={{ flex: 1, justifyContent: "center" }} onClick={() => { setShowDelete(false); setDeleteError(""); }}>
                {t.cancel}
              </button>
            </div>
          </div>
        </div>
      )}
    </MainLayout>
  );
}
