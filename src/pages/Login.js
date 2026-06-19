import API from "../api/api";
import { useState, useRef } from "react";
import { useNavigate, Link } from "react-router-dom";
import { FaUser, FaLock, FaEye, FaEyeSlash, FaArrowRight, FaLeaf, FaCheckCircle } from "react-icons/fa";
import { useApp } from "../context/AppContext";

/* ── Blocks browser autofill/saved-password popup completely ── */
function NoFillInput({ type = "text", placeholder, value, onChange, inputRef, className, style, onKeyDown }) {
  return (
    <input
      ref={inputRef}
      className={className}
      style={style}
      type={type}
      placeholder={placeholder}
      value={value}
      autoComplete="new-password"
      autoCorrect="off"
      autoCapitalize="off"
      spellCheck="false"
      data-form-type="other"
      data-lpignore="true"
      data-1p-ignore="true"
      onChange={onChange}
      onKeyDown={onKeyDown}
    />
  );
}

export default function Login() {
  const navigate = useNavigate();
  const { t, lang, setLang, setUser } = useApp();
  const [email,    setEmail]    = useState("");
  const [phone,    setPhone]    = useState("");   // phone for SMS notification
  const [password, setPassword] = useState("");
  const [showPass, setShowPass] = useState(false);
  const [loading,  setLoading]  = useState(false);
  const [error,    setError]    = useState("");
  const emailRef    = useRef(null);
  const passwordRef = useRef(null);

  const doLogin = async () => {
    if (!email || !password) {
      setError(t.fillAll);
      return;
    }
    try {
      setLoading(true);
      setError("");

      const response = await API.post("/auth/login", {
        email:    email,
        password: password,
        phone:    phone.trim() || null,   // send phone for SMS
      });

      localStorage.setItem("token", response.data.token);
      localStorage.setItem("user",  JSON.stringify(response.data.user));
      setUser(response.data.user);
      localStorage.setItem("loggedIn", "true");
      navigate("/dashboard");

    } catch (error) {
      const msg = error.response?.data?.message || "";
      if (!error.response) {
        setError(
          lang === "ta" ? "Server connect ஆகவில்லை. XAMPP-ல MySQL Start பண்ணி Node server run பண்ணவும்."
          : lang === "hi" ? "Server से connect नहीं हुआ। XAMPP में MySQL start करें।"
          : "Cannot connect to server. Start XAMPP MySQL and run the Node server."
        );
      } else {
        setError(msg || (
          lang === "ta" ? "Login தோல்வி. மீண்டும் முயற்சிக்கவும்."
          : lang === "hi" ? "Login विफल। पुनः प्रयास करें।"
          : "Login failed. Please try again."
        ));
      }
    } finally {
      setLoading(false);
    }
  };

  const guestMode = () => {
    localStorage.removeItem("loggedIn");
    localStorage.removeItem("username");
    navigate("/dashboard");
  };

  const handleKey = (e) => { if (e.key === "Enter") doLogin(); };

  const stats = [
    { v:"10K+", l: t.farmersLabel    },
    { v:"99%",  l: t.uptimeLabel     },
    { v:"40%",  l: t.waterSavedLabel },
  ];

  const features = [
    t.featureSoil         || "Soil Health Monitoring",
    t.featureWeather      || "Live Weather Data",
    t.featureIrrigation   || "Smart Irrigation Control",
    t.featureCrops        || "AI Crop Recommendations",
  ];

  // ── Styles ────────────────────────────────────────────────────────────────
  const S = {
    page: {
      display:"flex", minHeight:"100vh", fontFamily:"'Segoe UI',system-ui,sans-serif",
      background:"#f0f4f8",
    },
    left: {
      width:"46%", minHeight:"100vh", position:"relative", overflow:"hidden",
      background:"linear-gradient(145deg, #0a1f0a 0%, #1b5e20 40%, #2e7d32 70%, #43a047 100%)",
      display:"flex", flexDirection:"column", justifyContent:"center",
      padding:"56px 52px", color:"#fff",
    },
    orb1: {
      position:"absolute", top:"-100px", right:"-80px", width:"320px", height:"320px",
      borderRadius:"50%", background:"rgba(255,255,255,0.04)", pointerEvents:"none",
    },
    orb2: {
      position:"absolute", bottom:"-80px", left:"-60px", width:"260px", height:"260px",
      borderRadius:"50%", background:"rgba(255,255,255,0.05)", pointerEvents:"none",
    },
    brand: {
      display:"flex", alignItems:"center", gap:"10px", marginBottom:"52px",
    },
    brandIcon: { fontSize:"32px" },
    brandName: { fontSize:"26px", fontWeight:800, letterSpacing:"0.3px" },
    tagline: { fontSize:"11px", fontWeight:700, letterSpacing:"2px", textTransform:"uppercase", color:"rgba(255,255,255,0.5)", marginBottom:"12px" },
    heroTitle: { fontSize:"clamp(28px,3.5vw,42px)", fontWeight:800, lineHeight:1.15, margin:"0 0 6px" },
    heroAccent: { fontSize:"clamp(28px,3.5vw,42px)", fontWeight:800, lineHeight:1.15, color:"#a5d6a7", margin:"0 0 16px" },
    heroSub: { fontSize:"15px", color:"rgba(255,255,255,0.72)", lineHeight:1.7, maxWidth:"340px", marginBottom:"40px" },
    statsRow: { display:"flex", gap:"28px", marginBottom:"40px", flexWrap:"wrap" },
    stat: { display:"flex", flexDirection:"column", gap:"3px" },
    statVal: { fontSize:"26px", fontWeight:800, color:"#a5d6a7", lineHeight:1 },
    statLbl: { fontSize:"12px", color:"rgba(255,255,255,0.6)" },
    featuresList: { display:"flex", flexDirection:"column", gap:"10px", marginBottom:"44px" },
    featureItem: { display:"flex", alignItems:"center", gap:"10px", fontSize:"13.5px", color:"rgba(255,255,255,0.8)" },
    featureDot: { width:"6px", height:"6px", borderRadius:"50%", background:"#a5d6a7", flexShrink:0 },
    langRow: { display:"flex", gap:"8px" },
    langBtn: (active) => ({
      background: active ? "rgba(255,255,255,0.22)" : "rgba(255,255,255,0.08)",
      border: active ? "1.5px solid rgba(255,255,255,0.6)" : "1.5px solid rgba(255,255,255,0.2)",
      color: active ? "#fff" : "rgba(255,255,255,0.7)",
      padding:"6px 16px", borderRadius:"20px", fontSize:"13px", fontWeight:600,
      cursor:"pointer", transition:"all 0.2s",
    }),
    // Floating card
    floatCard: {
      position:"absolute", bottom:"44px", right:"40px",
      background:"rgba(255,255,255,0.1)", backdropFilter:"blur(16px)",
      border:"1px solid rgba(255,255,255,0.18)", borderRadius:"18px",
      padding:"16px 20px", display:"flex", gap:"12px",
      animation:"floatUpDown 3s ease-in-out infinite alternate",
    },
    metricChip: (bg) => ({
      background:bg, borderRadius:"12px", padding:"11px 14px",
      display:"flex", flexDirection:"column", alignItems:"center", gap:"3px", minWidth:"74px",
    }),
    // Right panel
    right: {
      flex:1, display:"flex", alignItems:"center", justifyContent:"center",
      padding:"40px 24px", background:"#f8fbf8",
    },
    formBox: {
      width:"100%", maxWidth:"420px", background:"#fff",
      borderRadius:"22px", padding:"42px 40px",
      boxShadow:"0 8px 40px rgba(0,0,0,0.09)",
      border:"1px solid #e0e7ef",
    },
    formHeader: { marginBottom:"28px", textAlign:"center" },
    logoIcon: {
      width:"52px", height:"52px",
      background:"linear-gradient(135deg,#2e7d32,#43a047)",
      borderRadius:"16px", display:"flex", alignItems:"center", justifyContent:"center",
      fontSize:"22px", color:"#fff", margin:"0 auto 14px",
    },
    formTitle: { fontSize:"26px", fontWeight:800, color:"#1a2332", marginBottom:"5px" },
    formSub: { fontSize:"13px", color:"#546e7a" },
    errorBox: {
      background:"#fff3e0", border:"1px solid #ffcc80", color:"#e65100",
      padding:"10px 14px", borderRadius:"8px", fontSize:"13px", marginBottom:"18px",
    },
    fieldWrap: { marginBottom:"18px" },
    fieldLabel: {
      display:"block", fontSize:"11px", fontWeight:700, color:"#546e7a",
      marginBottom:"7px", textTransform:"uppercase", letterSpacing:"0.5px",
    },
    inputWrap: { position:"relative", display:"flex", alignItems:"center" },
    inputIcon: {
      position:"absolute", left:"13px", color:"#90a4ae", fontSize:"14px", pointerEvents:"none",
    },
    input: {
      width:"100%", padding:"12px 13px 12px 40px",
      border:"1.5px solid #e0e7ef", borderRadius:"10px",
      fontSize:"14px", color:"#1a2332", background:"#fff",
      outline:"none", transition:"border-color 0.2s", boxSizing:"border-box",
    },
    eyeBtn: {
      position:"absolute", right:"12px", background:"none", border:"none",
      color:"#90a4ae", cursor:"pointer", fontSize:"15px",
      padding:"3px", display:"flex", alignItems:"center",
    },
    submitBtn: {
      width:"100%", padding:"13px",
      background:"linear-gradient(135deg,#2e7d32,#43a047)",
      color:"#fff", border:"none", borderRadius:"10px",
      fontSize:"15px", fontWeight:700, cursor:"pointer",
      display:"flex", alignItems:"center", justifyContent:"center", gap:"9px",
      marginTop:"4px", boxShadow:"0 4px 14px rgba(46,125,50,0.3)",
      transition:"all 0.22s", minHeight:"48px",
    },
    divider: {
      display:"flex", alignItems:"center", gap:"10px",
      margin:"16px 0", color:"#b0bec5", fontSize:"12px",
    },
    dividerLine: { flex:1, height:"1px", background:"#e0e7ef" },
    guestBtn: {
      width:"100%", padding:"11px",
      background:"#f8fbf8", color:"#546e7a",
      border:"1.5px solid #e0e7ef", borderRadius:"10px",
      fontSize:"14px", fontWeight:600, cursor:"pointer",
      transition:"all 0.2s", marginBottom:"6px",
    },
    switchText: { textAlign:"center", marginTop:"18px", color:"#546e7a", fontSize:"13px" },
    switchLink: { color:"#2e7d32", fontWeight:600, textDecoration:"none" },
  };

  return (
    <>
      <style>{`
        @keyframes floatUpDown {
          from { transform: translateY(0px); }
          to   { transform: translateY(-10px); }
        }
        .login-input:focus { border-color: #2e7d32 !important; box-shadow: 0 0 0 3px rgba(46,125,50,0.1) !important; }
        .login-submit:hover:not(:disabled) { transform: translateY(-1px); box-shadow: 0 6px 20px rgba(46,125,50,0.4) !important; }
        .login-guest:hover { border-color: #2e7d32 !important; color: #2e7d32 !important; background: #e8f5e9 !important; }
        @media (max-width: 860px) {
          .auth-left-panel { display: none !important; }
          .auth-right-panel { width: 100% !important; }
        }
      `}</style>

      <div style={S.page}>
        {/* ── Left ── */}
        <div style={S.left} className="auth-left-panel">
          <div style={S.orb1} />
          <div style={S.orb2} />

          <div style={S.brand}>
            <span style={S.brandIcon}>🌾</span>
            <span style={S.brandName}>AgroSmart</span>
          </div>

          <div>
            <div style={S.tagline}>{t.smartAgriPlatform}</div>
            <h2 style={S.heroTitle}>{t.heroTitle}</h2>
            <h2 style={S.heroAccent}>{t.heroAccent}</h2>
            <p style={S.heroSub}>{t.heroSub}</p>
          </div>

          <div style={S.statsRow}>
            {stats.map((s,i) => (
              <div key={i} style={S.stat}>
                <span style={S.statVal}>{s.v}</span>
                <span style={S.statLbl}>{s.l}</span>
              </div>
            ))}
          </div>

          <div style={S.featuresList}>
            {features.map((f,i) => (
              <div key={i} style={S.featureItem}>
                <FaCheckCircle style={{ color:"#a5d6a7", fontSize:14, flexShrink:0 }} />
                {f}
              </div>
            ))}
          </div>

          <div style={S.langRow}>
            {[["en","English"],["ta","தமிழ்"],["hi","हिन्दी"]].map(([l,n]) => (
              <button key={l} style={S.langBtn(lang===l)} onClick={() => setLang(l)}>{n}</button>
            ))}
          </div>

          {/* Floating metrics card */}
          <div style={S.floatCard}>
            {[
              { label: t.soilMoisture, val:"74%",  color:"#43a047", bg:"rgba(67,160,71,0.18)" },
              { label: t.temperature,  val:"32°C",  color:"#ef6c00", bg:"rgba(239,108,0,0.18)" },
              { label: t.phLevel,      val:"6.8",   color:"#ab47bc", bg:"rgba(171,71,188,0.18)" },
            ].map((m,i) => (
              <div key={i} style={S.metricChip(m.bg)}>
                <span style={{ color:m.color, fontWeight:800, fontSize:17 }}>{m.val}</span>
                <span style={{ fontSize:10, color:"rgba(255,255,255,0.65)" }}>{m.label}</span>
              </div>
            ))}
          </div>
        </div>

        {/* ── Right ── */}
        <div style={S.right} className="auth-right-panel">
          {/* Hidden dummy inputs to fool browser password manager */}
          <input type="text"     style={{display:"none"}} aria-hidden="true" />
          <input type="password" style={{display:"none"}} aria-hidden="true" />
          <div style={S.formBox}>
            <div style={S.formHeader}>
              <div style={S.logoIcon}><FaLeaf /></div>
              <h2 style={S.formTitle}>{t.welcomeBack}</h2>
              <p style={S.formSub}>{t.signIn}</p>
            </div>

            {error && <div style={S.errorBox}>⚠️ {error}</div>}

            {/* Email / Username */}
            <div style={S.fieldWrap}>
              <label style={S.fieldLabel}>
                📧 {lang==="ta" ? "Email முகவரி" : lang==="hi" ? "Email पता" : "Email Address"}
              </label>
              <div style={S.inputWrap}>
                <FaUser style={S.inputIcon} />
                <NoFillInput
                  inputRef={emailRef}
                  className="login-input"
                  style={S.input}
                  placeholder={lang==="ta" ? "உங்கள் email உள்ளிடுங்கள்" : lang==="hi" ? "अपना email दर्ज करें" : "Enter your email address"}
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  onKeyDown={handleKey}
                />
              </div>
              <div style={{ fontSize:11, color:"#90a4ae", marginTop:4 }}>
                {lang==="ta" ? "📩 login notification இந்த email-க்கு வரும்"
                 : lang==="hi" ? "📩 login notification इस email पर आएगा"
                 : "📩 Login notification will be sent to this email"}
              </div>
            </div>

            {/* Password */}
            <div style={S.fieldWrap}>
              <label style={S.fieldLabel}>{t.password}</label>
              <div style={S.inputWrap}>
                <FaLock style={S.inputIcon} />
                <NoFillInput
                  inputRef={passwordRef}
                  className="login-input"
                  style={S.input}
                  type={showPass ? "text" : "password"}
                  placeholder={t.password}
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  onKeyDown={handleKey}
                />
                <button style={S.eyeBtn} onClick={() => setShowPass(!showPass)}>
                  {showPass ? <FaEyeSlash /> : <FaEye />}
                </button>
              </div>
            </div>

            {/* Phone — for SMS notification */}
            <div style={S.fieldWrap}>
              <label style={S.fieldLabel}>
                📱 {lang==="ta" ? "மொபைல் எண் (SMS அறிவிப்புக்கு)" : lang==="hi" ? "मोबाइल नंबर (SMS सूचना के लिए)" : "Mobile Number (for SMS alert)"}
              </label>
              <div style={S.inputWrap}>
                <span style={{ ...S.inputIcon, fontSize:14 }}>📞</span>
                <NoFillInput
                  className="login-input"
                  style={S.input}
                  placeholder="+91 XXXXX XXXXX"
                  value={phone}
                  onChange={e => setPhone(e.target.value)}
                  onKeyDown={handleKey}
                />
              </div>
              <div style={{ fontSize:11, color:"#90a4ae", marginTop:4 }}>
                {lang==="ta"
                  ? "login ஆனதும் உங்க phone-க்கு SMS வரும் 📲"
                  : lang==="hi"
                  ? "login होने पर SMS आएगा 📲"
                  : "You'll get an SMS when you log in 📲"}
              </div>
            </div>
            <button
              className="login-submit"
              style={{ ...S.submitBtn, opacity: loading ? 0.7 : 1, cursor: loading ? "not-allowed" : "pointer" }}
              onClick={doLogin}
              disabled={loading}
            >
              {loading
                ? <span style={{ width:22, height:22, border:"3px solid rgba(255,255,255,0.3)", borderTopColor:"#fff", borderRadius:"50%", animation:"spin 0.7s linear infinite", display:"inline-block" }} />
                : <>{t.signInBtn} <FaArrowRight /></>
              }
            </button>

            {/* Divider */}
            <div style={S.divider}>
              <div style={S.dividerLine} />
              <span>{t.orGuest}</span>
              <div style={S.dividerLine} />
            </div>

            {/* Guest */}
            <button className="login-guest" style={S.guestBtn} onClick={guestMode}>
              👁 {t.guestMode}
            </button>

            <p style={S.switchText}>
              {t.newFarmer}{" "}
              <Link to="/register" style={S.switchLink}>{t.createAcc}</Link>
            </p>
          </div>
        </div>
      </div>
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </>
  );
}
