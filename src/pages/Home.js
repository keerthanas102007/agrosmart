import { useNavigate } from "react-router-dom";
import { FaLeaf, FaTint, FaCloudSun, FaMicrochip, FaSeedling, FaChartBar, FaArrowRight, FaCheckCircle, FaMoon, FaSun } from "react-icons/fa";
import { useApp } from "../context/AppContext";
import "../styles/Home.css";

export default function Home() {
  const navigate = useNavigate();
  const { t, lang, setLang, darkMode, setDarkMode } = useApp();

  const features = [
    { icon:<FaMicrochip />, title:t.featureRtSensors,    desc:t.featureRtSensorsDesc,    color:"#1b5e20" },
    { icon:<FaCloudSun />,  title:t.featureWeather,      desc:t.featureWeatherDesc,      color:"#0277bd" },
    { icon:<FaTint />,      title:t.featureIrrigation,   desc:t.featureIrrigationDesc,   color:"#00838f" },
    { icon:<FaSeedling />,  title:t.featureCrops,        desc:t.featureCropsDesc,        color:"#558b2f" },
    { icon:<FaLeaf />,      title:t.featureSoil,         desc:t.featureSoilDesc,         color:"#4a148c" },
    { icon:<FaChartBar />,  title:t.featureAnalytics,    desc:t.featureAnalyticsDesc,    color:"#e65100" },
  ];

  const benefits = [
    t.benefitNoTech,
    t.benefitMobile,
    t.benefitLang,
    t.benefitAlerts,
    t.benefitFree,
    t.benefitResearch,
  ];

  const heroStats = [
    { v:"10,000+", l: t.farmersLabel    },
    { v:"98%",     l: t.uptimeLabel     },
    { v:"40%",     l: t.waterSavedLabel },
    { v:"3x",      l: t.yieldBoostLabel },
  ];

  // Live dashboard preview labels
  const previewMetrics = [
    { l: t.soilMoisture, v:"74%",  c:"#2e7d32", bg:"#e8f5e9" },
    { l: t.temperature,  v:"32°C", c:"#e65100", bg:"#fff3e0" },
    { l: t.humidity,     v:"68%",  c:"#0277bd", bg:"#e1f5fe" },
    { l: t.phLevel,      v:"6.8",  c:"#558b2f", bg:"#f1f8e9" },
  ];

  return (
    <div className="landing" data-theme={darkMode?"dark":"light"}>

      {/* ── Navbar ── */}
      <nav className="landing-nav">
        <div className="landing-nav__brand"><span>🌾</span> AgroSmart</div>
        <div className="landing-nav__center">
          <a href="#features">{t.featuresLink}</a>
          <a href="#about">{t.aboutLink}</a>
        </div>
        <div className="landing-nav__right">
          <div className="landing-lang">
            {[["en","EN"],["ta","த"],["hi","हि"]].map(([l,lbl]) => (
              <button key={l} className={`landing-lang-btn ${lang===l?"landing-lang-btn--active":""}`} onClick={() => setLang(l)}>{lbl}</button>
            ))}
          </div>
          <button className="landing-icon-btn" onClick={() => setDarkMode(!darkMode)}>
            {darkMode ? <FaSun /> : <FaMoon />}
          </button>
          <button className="btn-landing-outline" onClick={() => navigate("/")}>{t.signInBtn}</button>
          <button className="btn-landing" onClick={() => navigate("/register")}>{t.registerFree}</button>
        </div>
      </nav>

      {/* ── Hero ── */}
      <section className="hero-section">
        <div className="hero-bg" />
        <div className="hero-section__content">
          <div className="hero-tag">{t.heroTag}</div>
          <h1 className="hero-title">
            {t.heroTitle}<br />
            <span className="hero-accent">{t.heroAccent}</span>
          </h1>
          <p className="hero-sub">{t.heroSub}</p>
          <div className="hero-btns">
            <button className="btn-hero-primary" onClick={() => navigate("/dashboard")}>
              {t.goToDash} <FaArrowRight />
            </button>
            <button className="btn-hero-outline" onClick={() => navigate("/register")}>
              {t.registerFree}
            </button>
          </div>
          <div className="hero-stats">
            {heroStats.map((s,i) => (
              <div className="hero-stat" key={i}>
                <span className="hero-stat__val">{s.v}</span>
                <span className="hero-stat__lbl">{s.l}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Features ── */}
      <section className="features-section" id="features">
        <div className="section-header">
          <span className="section-badge">{t.featuresLink}</span>
          <h2>{t.featuresTitle}</h2>
          <p>{t.featuresSub}</p>
        </div>
        <div className="features-grid">
          {features.map((f,i) => (
            <div className="feature-card" key={i}>
              <div className="feature-card__icon" style={{ background:f.color+"18", color:f.color }}>{f.icon}</div>
              <h3>{f.title}</h3>
              <p>{f.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ── About ── */}
      <section className="about-section" id="about">
        <div className="about-text">
          <span className="section-badge">{t.aboutBadge}</span>
          <h2>{t.aboutTitle}</h2>
          <p>{t.aboutDesc}</p>
          <ul className="about-benefits">
            {benefits.map((b,i) => <li key={i}><FaCheckCircle className="check-icon" /> {b}</li>)}
          </ul>
          <button className="btn-landing" onClick={() => navigate("/register")}>
            {t.getStarted} <FaArrowRight />
          </button>
        </div>
        <div className="about-visual">
          <div className="about-card">
            <div className="about-card__dots">
              <span style={{background:"#ff5f57"}} /><span style={{background:"#febc2e"}} /><span style={{background:"#28c840"}} />
              <span style={{marginLeft:6,fontSize:12,color:"#999"}}>{t.liveDashboard}</span>
            </div>
            <div className="about-metrics">
              {previewMetrics.map((m,i) => (
                <div key={i} className="about-metric" style={{ background:m.bg }}>
                  <span style={{ fontSize:11, color:"#78909c" }}>{m.l}</span>
                  <span style={{ fontSize:20, fontWeight:800, color:m.c }}>{m.v}</span>
                </div>
              ))}
            </div>
            <div className="about-chart-mock">
              {[65,72,68,78,74,80,74].map((h,i) => <div key={i} className="about-bar" style={{ height:h+"%" }} />)}
            </div>
          </div>
        </div>
      </section>

      {/* ── CTA ── */}
      <section className="cta-section">
        <h2>{t.ctaTitle}</h2>
        <p>{t.ctaSub}</p>
        <div className="cta-btns">
          <button className="btn-hero-primary" onClick={() => navigate("/register")}>{t.getStarted} <FaArrowRight /></button>
          <button className="btn-hero-outline-white" onClick={() => navigate("/")}>{t.signInBtn}</button>
        </div>
      </section>

      {/* ── Footer ── */}
      <footer className="landing-footer">
        <span>🌾 AgroSmart — {t.footerTagline}</span>
        <span>{t.footerCopyright}</span>
      </footer>

    </div>
  );
}
