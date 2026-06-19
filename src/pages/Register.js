import API from "../api/api";
import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { FaUser, FaPhone, FaMapMarkerAlt, FaLock, FaEye, FaEyeSlash, FaSeedling, FaLeaf, FaEnvelope } from "react-icons/fa";
import { useApp } from "../context/AppContext";
import "../styles/Auth.css";

/* ── Trick: render as readOnly first, flip to editable on focus ── */
function NoFillInput({ type = "text", placeholder, value, onChange, name, ...rest }) {
  const [active, setActive] = useState(false);
  return (
    <input
      {...rest}
      name={name}
      type={active ? type : "text"}
      placeholder={placeholder}
      value={value}
      readOnly={!active}
      autoComplete="off"
      autoCorrect="off"
      autoCapitalize="off"
      spellCheck="false"
      data-form-type="other"
      data-lpignore="true"
      onFocus={() => setActive(true)}
      onChange={active ? onChange : undefined}
      style={{ caretColor: active ? "auto" : "transparent", ...(rest.style || {}) }}
    />
  );
}

export default function Register() {
  const navigate = useNavigate();
  const { t, lang, setUser } = useApp();

  const [form, setForm] = useState({
    name:"", email:"", mobile:"", village:"",
    state:"", farmSize:"", crop:"", password:"", confirm:""
  });
  const [showPass, setShowPass] = useState(false);
  const [loading, setLoading]   = useState(false);
  const [error, setError]       = useState("");

  const set = (f) => (e) => setForm(prev => ({ ...prev, [f]: e.target.value }));

  const register = async () => {
    // Validation — email is now required
    if (!form.name || !form.mobile || !form.password) {
      setError(t.fillAll);
      return;
    }

    if (!form.email.trim()) {
      setError(
        lang === "ta" ? "Email முகவரி அவசியம் — notifications அனுப்ப."
        : lang === "hi" ? "Email आवश्यक है — सूचनाएं भेजने के लिए।"
        : "Email is required — needed to send you login & registration notifications."
      );
      return;
    }

    // Basic email format check
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(form.email.trim())) {
      setError(
        lang === "ta" ? "சரியான email முகவரி உள்ளிடுங்கள் (எ.கா. name@gmail.com)"
        : lang === "hi" ? "सही email दर्ज करें (जैसे: name@gmail.com)"
        : "Enter a valid email address (e.g. name@gmail.com)"
      );
      return;
    }

    if (form.password !== form.confirm) {
      setError(t.passwordsMustMatch);
      return;
    }

    // Use the actual email farmer provided
    const emailToUse = form.email.trim();

    try {
      setLoading(true);
      setError("");

      const response = await API.post("/auth/register", {
        name:        form.name,
        email:       emailToUse,
        password:    form.password,
        location:    form.village,
        phone:       form.mobile,
        state:       form.state,
        farmSize:    form.farmSize,
        primaryCrop: form.crop,
      });

      if (response.data.success) {
        if (response.data.token) {
          localStorage.setItem("token", response.data.token);
          localStorage.setItem("loggedIn", "true");
          setUser(response.data.user);
          navigate("/dashboard");
        } else {
          navigate("/");
        }
      }
    } catch (err) {
      const msg = err.response?.data?.message || "";
      if (!err.response) {
        setError(
          lang === "ta" ? "Server-ஐ connect பண்ண முடியவில்லை. XAMPP-ல MySQL & Node server running-ஆ check பண்ணுங்கள்."
          : lang === "hi" ? "Server से connect नहीं हो पाया। XAMPP में MySQL और Node server चेक करें।"
          : "Cannot connect to server. Please ensure XAMPP MySQL and Node server are running."
        );
      } else {
        setError(msg || (
          lang === "ta" ? "பதிவு தோல்வி. மீண்டும் முயற்சிக்கவும்."
          : lang === "hi" ? "रजिस्ट्रेशन विफल। पुनः प्रयास करें।"
          : "Registration failed. Please try again."
        ));
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-page">
      {/* ── Left panel ── */}
      <div className="auth-left">
        <div className="auth-left__orbs" />
        <div className="auth-left__content">
          <div className="auth-brand">
            <span className="auth-brand__icon">🌾</span>
            <span className="auth-brand__name">AgroSmart</span>
          </div>
          <div className="auth-left__text">
            <h2>{t.createAccount}</h2>
            <h2 className="auth-accent">AgroSmart</h2>
            <p>{t.registerSub}</p>
          </div>
          <div className="auth-stats">
            {[
              { v: t.authStatFree,  l: t.authStatForever   },
              { v: t.authStatSetup, l: t.authStatSetupLabel },
              { v: t.authStat247,   l: t.authStatMonitoring },
            ].map((s, i) => (
              <div className="auth-stat" key={i}>
                <span className="auth-stat__val">{s.v}</span>
                <span className="auth-stat__lbl">{s.l}</span>
              </div>
            ))}
          </div>
        </div>
        <div className="auth-illustration">
          <div className="auth-illustration__card">
            {[
              { label: t.crops || "Crops Ready",              val:"✅", bg:"rgba(67,160,71,0.15)"  },
              { label: `${t.soilMoisture || "Water"}: 74%`,   val:"💧", bg:"rgba(2,136,209,0.15)"  },
              { label: `${t.phLevelLabel || "pH"}: 6.8`,      val:"🌱", bg:"rgba(123,31,162,0.15)" },
            ].map((m, i) => (
              <div key={i} className="auth-metric-chip" style={{ background: m.bg }}>
                <span style={{ fontSize:22 }}>{m.val}</span>
                <span style={{ fontSize:10, color:"rgba(255,255,255,0.7)", marginTop:1 }}>{m.label}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ── Right panel ── */}
      <div className="auth-right">
        <div className="auth-form-box" style={{ maxWidth:500 }}>

          {/* Honeypot — stops browser password manager */}
          <input type="text"     style={{display:"none"}} aria-hidden="true" tabIndex="-1" />
          <input type="password" style={{display:"none"}} aria-hidden="true" tabIndex="-1" />

          <div className="auth-form-box__header">
            <div className="auth-form-box__logo"><FaLeaf /></div>
            <h2>{t.createAccount}</h2>
            <p>{t.registerSub}</p>
          </div>

          {error && <div className="auth-error">⚠️ {error}</div>}

          <div className="auth-form-grid">

            {/* Full Name */}
            <div className="auth-field">
              <label>{t.fullName}</label>
              <div className="auth-input-wrap">
                <FaUser className="auth-input-icon" />
                <NoFillInput
                  name="agro_name" placeholder={t.fullName}
                  value={form.name} onChange={set("name")}
                />
              </div>
            </div>

            {/* Mobile */}
            <div className="auth-field">
              <label>{t.mobile}</label>
              <div className="auth-input-wrap">
                <FaPhone className="auth-input-icon" />
                <NoFillInput
                  name="agro_mobile" placeholder="+91 XXXXX XXXXX"
                  value={form.mobile} onChange={set("mobile")}
                />
              </div>
            </div>

            {/* Email — required for notifications */}
            <div className="auth-field" style={{ gridColumn:"1 / -1" }}>
              <label>
                📧 Email{" "}
                <span style={{ fontSize:"11px", color:"#e65100", fontWeight:600 }}>
                  {lang==="ta" ? "* அவசியம் — login & notifications-க்கு"
                   : lang==="hi" ? "* जरूरी — login और सूचनाओं के लिए"
                   : "* Required — for login & notifications"}
                </span>
              </label>
              <div className="auth-input-wrap">
                <FaEnvelope className="auth-input-icon" />
                <NoFillInput
                  name="agro_email" placeholder="your@gmail.com / college@ac.in"
                  value={form.email} onChange={set("email")}
                />
              </div>
              <div style={{ fontSize:11, color:"#546e7a", marginTop:4 }}>
                {lang==="ta"
                  ? "📩 இந்த email-க்கு welcome notification வரும்"
                  : lang==="hi"
                  ? "📩 इस email पर welcome notification आएगा"
                  : "📩 A welcome notification will be sent to this email"}
              </div>
            </div>

            {/* Village */}
            <div className="auth-field">
              <label>{t.village}</label>
              <div className="auth-input-wrap">
                <FaMapMarkerAlt className="auth-input-icon" />
                <NoFillInput
                  name="agro_village" placeholder={t.village}
                  value={form.village} onChange={set("village")}
                />
              </div>
            </div>

            {/* State */}
            <div className="auth-field">
              <label>{t.state}</label>
              <div className="auth-input-wrap">
                <FaMapMarkerAlt className="auth-input-icon" />
                <select className="auth-select" value={form.state} onChange={set("state")}>
                  <option value="">{t.selectState}</option>
                  {["Tamil Nadu","Maharashtra","Punjab","Uttar Pradesh","Karnataka",
                    "Gujarat","Rajasthan","Andhra Pradesh","Telangana","Kerala"].map(s => (
                    <option key={s} value={s}>{s}</option>
                  ))}
                </select>
              </div>
            </div>

            {/* Farm Size */}
            <div className="auth-field">
              <label>{t.farmSize}</label>
              <div className="auth-input-wrap">
                <FaSeedling className="auth-input-icon" />
                <NoFillInput
                  type="number" name="agro_farmsize"
                  placeholder={t.farmSizePlaceholder}
                  value={form.farmSize} onChange={set("farmSize")}
                />
              </div>
            </div>

            {/* Primary Crop */}
            <div className="auth-field">
              <label>{t.primaryCrop}</label>
              <div className="auth-input-wrap">
                <FaSeedling className="auth-input-icon" />
                <select className="auth-select" value={form.crop} onChange={set("crop")}>
                  <option value="">{t.selectCrop}</option>
                  {[
                    { k:"Rice",       l:"cropRice"       },
                    { k:"Wheat",      l:"cropWheat"      },
                    { k:"Cotton",     l:"cropCotton"     },
                    { k:"Sugarcane",  l:"cropSugarcane"  },
                    { k:"Maize",      l:"cropMaize"      },
                    { k:"Soybean",    l:"cropSoybean"    },
                    { k:"Pulses",     l:"cropPulses"     },
                    { k:"Vegetables", l:"cropVegetables" },
                  ].map(c => (
                    <option key={c.k} value={c.k}>{t[c.l] || c.k}</option>
                  ))}
                </select>
              </div>
            </div>

            {/* Password */}
            <div className="auth-field">
              <label>{t.password}</label>
              <div className="auth-input-wrap">
                <FaLock className="auth-input-icon" />
                <NoFillInput
                  type={showPass ? "text" : "password"}
                  name="agro_pwd"
                  placeholder={t.minChars}
                  value={form.password} onChange={set("password")}
                />
                <button className="auth-eye" onClick={() => setShowPass(!showPass)}>
                  {showPass ? <FaEyeSlash /> : <FaEye />}
                </button>
              </div>
            </div>

            {/* Confirm Password */}
            <div className="auth-field">
              <label>{t.confirmPwd}</label>
              <div className="auth-input-wrap">
                <FaLock className="auth-input-icon" />
                <NoFillInput
                  type="password" name="agro_cpwd"
                  placeholder={t.confirmPwd}
                  value={form.confirm} onChange={set("confirm")}
                />
              </div>
            </div>

          </div>{/* end auth-form-grid */}

          <button className="auth-submit" onClick={register} disabled={loading}>
            {loading ? <span className="spinner" /> : t.createAccount}
          </button>

          <p className="auth-switch">
            {t.alreadyHave} <Link to="/">{t.signInBtn}</Link>
          </p>

        </div>
      </div>
    </div>
  );
}
