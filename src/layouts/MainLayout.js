import { useState, useEffect, useRef } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import {
  FaHome, FaTachometerAlt, FaLeaf, FaTint, FaCloudSun, FaSeedling,
  FaChartBar, FaMapMarkedAlt, FaBars, FaTimes,
  FaBell, FaUser, FaSignOutAlt, FaChevronRight, FaMoon, FaSun,
  FaList, FaGlobe, FaUsers, FaBug, FaMoneyBillWave, FaFlask
} from "react-icons/fa";
import { useApp } from "../context/AppContext";
import "../styles/MainLayout.css";

export default function MainLayout({ children }) {
  const { t, lang, setLang, darkMode, setDarkMode, notifications, markNotifRead, markAllRead, unreadCount, user, logout: ctxLogout } = useApp();
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [mobileOpen, setMobileOpen]   = useState(false);
  const [notifOpen,  setNotifOpen]    = useState(false);
  const notifRef = useRef(null);
  const location = useLocation();
  const navigate = useNavigate();
  const username = user?.name || localStorage.getItem("username") || t.farmer;
  const isGuest  = !user && !localStorage.getItem("loggedIn");

  const navItems = [
    { path:"/home",       label: t.home,                          icon:<FaHome /> },
    { path:"/dashboard",  label: t.dashboard,                     icon:<FaTachometerAlt /> },
    { path:"/farm",       label: t.farmMgmt,                      icon:<FaMapMarkedAlt /> },
    { path:"/crops",      label: t.crops,                         icon:<FaSeedling /> },
    { path:"/irrigation", label: t.irrigation,                    icon:<FaTint /> },
    { path:"/soil",       label: t.soil,                          icon:<FaLeaf /> },
    { path:"/weather",    label: t.weather,                       icon:<FaCloudSun /> },
    { path:"/fertilizer", label: t.fertilizerRec || "Fertilizer", icon:<FaFlask /> },
    { path:"/community",  label: t.community || "Community",      icon:<FaUsers /> },
    { path:"/disease",    label: t.diseaseDetection ? t.diseaseDetection.split("&")[0].trim() : "Disease", icon:<FaBug /> },
    { path:"/history",    label: t.profitHistory || "Profit",     icon:<FaMoneyBillWave /> },
    { path:"/reports",    label: t.reports,                       icon:<FaChartBar /> },
    { path:"/profile",    label: t.profile,                       icon:<FaUser /> },
  ];

  // close mobile sidebar on route change
  useEffect(() => { setMobileOpen(false); setNotifOpen(false); }, [location]);

  // responsive sidebar
  useEffect(() => {
    const handle = () => {
      if (window.innerWidth < 992) setSidebarOpen(false);
      else setSidebarOpen(true);
    };
    handle();
    window.addEventListener("resize", handle);
    return () => window.removeEventListener("resize", handle);
  }, []);

  // close notif panel on outside click
  useEffect(() => {
    const handle = (e) => {
      if (notifRef.current && !notifRef.current.contains(e.target)) setNotifOpen(false);
    };
    document.addEventListener("mousedown", handle);
    return () => document.removeEventListener("mousedown", handle);
  }, []);

  const logout = () => {
    ctxLogout();
    navigate("/");
  };

  const notifIcon = { alert:"⚠️", weather:"🌦️", crop:"🌾", soil:"🌱", irrig:"💧" };

  return (
    <div className={`layout ${darkMode ? "dark" : ""}`}>
      {/* Mobile overlay */}
      {mobileOpen && <div className="layout__overlay" onClick={() => setMobileOpen(false)} />}

      {/* ──── Sidebar ──── */}
      <aside className={`sidebar ${sidebarOpen ? "" : "sidebar--collapsed"} ${mobileOpen ? "sidebar--mobile-open" : ""}`}>
        <div className="sidebar__brand">
          <span className="sidebar__brand-icon">🌾</span>
          {sidebarOpen && <span className="sidebar__brand-text">AgroSmart</span>}
        </div>

        {isGuest && sidebarOpen && (
          <div className="sidebar__guest-badge">👁 {t.guestMode}</div>
        )}

        <nav className="sidebar__nav">
          {navItems.map((item) => {
            const active = location.pathname === item.path;
            return (
              <Link key={item.path} to={item.path}
                className={`sidebar__nav-item ${active ? "sidebar__nav-item--active" : ""}`}
                title={!sidebarOpen ? item.label : ""}
              >
                <span className="sidebar__nav-icon">{item.icon}</span>
                {sidebarOpen && (
                  <>
                    <span className="sidebar__nav-label">{item.label}</span>
                    {active && <FaChevronRight className="sidebar__nav-arrow" />}
                  </>
                )}
              </Link>
            );
          })}
        </nav>

        <div className="sidebar__footer">
          <button className="sidebar__logout" onClick={logout} title={t.logout}>
            <FaSignOutAlt />
            {sidebarOpen && <span>{t.logout}</span>}
          </button>
        </div>
      </aside>

      {/* ──── Main ──── */}
      <div className={`layout__main ${sidebarOpen ? "" : "layout__main--collapsed"}`}>

        {/* ──── Topbar ──── */}
        <header className="topbar">
          <div className="topbar__left">
            <button className="topbar__toggle"
              onClick={() => {
                if (window.innerWidth < 992) setMobileOpen(!mobileOpen);
                else setSidebarOpen(!sidebarOpen);
              }}
            >
              {mobileOpen ? <FaTimes /> : <FaBars />}
            </button>
            <div className="topbar__breadcrumb">
              {navItems.find(n => n.path === location.pathname)?.label || t.dashboard}
            </div>
          </div>

          <div className="topbar__right">
            {/* Live indicator */}
            <div className="topbar__live">
              <span className="live-dot" />
              <span>{t.liveMode}</span>
            </div>

            {/* Language switcher */}
            <div className="lang-switcher">
              <FaGlobe />
              {["en","ta","hi"].map(l => (
                <button key={l}
                  className={`lang-btn ${lang === l ? "lang-btn--active" : ""}`}
                  onClick={() => setLang(l)}
                >
                  {l === "en" ? "EN" : l === "ta" ? "த" : "हि"}
                </button>
              ))}
            </div>

            {/* Dark mode */}
            <button className="topbar__icon-btn" onClick={() => setDarkMode(!darkMode)} title="Toggle theme">
              {darkMode ? <FaSun /> : <FaMoon />}
            </button>

            {/* Notifications */}
            <div className="notif-wrap" ref={notifRef}>
              <button className="topbar__icon-btn" onClick={() => setNotifOpen(!notifOpen)}>
                <FaBell />
                {unreadCount > 0 && <span className="topbar__badge">{unreadCount}</span>}
              </button>

              {notifOpen && (
                <div className="notif-panel">
                  <div className="notif-panel__header">
                    <span>{t.notifications}</span>
                    <button className="notif-mark-all" onClick={markAllRead}>{t.markAllRead}</button>
                  </div>
                  <div className="notif-panel__list">
                    {notifications.length === 0 ? (
                      <div className="notif-empty">{t.noNotifications}</div>
                    ) : notifications.map(n => (
                      <div key={n.id}
                        className={`notif-item ${n.read ? "notif-item--read" : ""}`}
                        onClick={() => { markNotifRead(n.id); navigate(`/news/${n.id}`); }}
                      >
                        <span className="notif-item__icon">{notifIcon[n.type] || "🔔"}</span>
                        <div className="notif-item__body">
                          <div className="notif-item__title">{n.title}</div>
                          <div className="notif-item__body-text">{n.body}</div>
                          <div className="notif-item__time">{n.time}</div>
                        </div>
                        {!n.read && <span className="notif-dot" />}
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* User */}
            <div className="topbar__user" onClick={() => navigate("/profile")}>
              <div className="topbar__avatar">
                {user?.profile_pic
                  ? <img src={`http://localhost:5000/uploads/profiles/${user.profile_pic}`} alt="avatar" style={{width:"100%",height:"100%",borderRadius:"50%",objectFit:"cover"}} />
                  : username.charAt(0).toUpperCase()
                }
              </div>
              <div className="topbar__user-info">
                <span className="topbar__user-name">{username}</span>
                <span className="topbar__user-role">{isGuest ? t.guestMode : t.farmer}</span>
              </div>
            </div>
          </div>
        </header>

        <main className="layout__content">{children}</main>
      </div>
    </div>
  );
}
