import { useParams, useNavigate } from "react-router-dom";
import { FaArrowLeft, FaExternalLinkAlt } from "react-icons/fa";
import MainLayout from "../layouts/MainLayout";
import { useApp } from "../context/AppContext";
import "../styles/global.css";
import "../styles/News.css";

// Article definitions — all text comes from t[key]
const getNewsContent = (t) => ({
  alert: {
    titleKey:    "newsAlertTitle",
    categoryKey: "newsAlertCategory",
    readTimeKey: "newsReadTime3",
    bodyKeys:    ["newsAlertB1","newsAlertB2","newsAlertB3","newsAlertB4","newsAlertB5","newsAlertB6","newsAlertB7","newsAlertB8"],
  },
  weather: {
    titleKey:    "newsWeatherTitle",
    categoryKey: "newsWeatherCategory",
    readTimeKey: "newsReadTime4",
    bodyKeys:    ["newsWeatherB1","newsWeatherB2","newsWeatherB3","newsWeatherB4","newsWeatherB5","newsWeatherB6","newsWeatherB7","newsWeatherB8","newsWeatherB9","newsWeatherB10","newsWeatherB11","newsWeatherB12","newsWeatherB13","newsWeatherB14","newsWeatherB15"],
  },
  crop: {
    titleKey:    "newsCropTitle",
    categoryKey: "newsCropCategory",
    readTimeKey: "newsReadTime5",
    bodyKeys:    ["newsCropB1","newsCropB2","newsCropB3","newsCropB4","newsCropB5","newsCropB6","newsCropB7","newsCropB8","newsCropB9","newsCropB10","newsCropB11","newsCropB12","newsCropB13","newsCropB14"],
  },
  soil: {
    titleKey:    "newsSoilTitle",
    categoryKey: "newsSoilCategory",
    readTimeKey: "newsReadTime4",
    bodyKeys:    ["newsSoilB1","newsSoilB2","newsSoilB3","newsSoilB4","newsSoilB5","newsSoilB6","newsSoilB7","newsSoilB8","newsSoilB9","newsSoilB10","newsSoilB11","newsSoilB12","newsSoilB13","newsSoilB14"],
  },
  irrig: {
    titleKey:    "newsIrrigTitle",
    categoryKey: "newsIrrigCategory",
    readTimeKey: "newsReadTime3",
    bodyKeys:    ["newsIrrigB1","newsIrrigB2","newsIrrigB3","newsIrrigB4","newsIrrigB5","newsIrrigB6","newsIrrigB7","newsIrrigB8","newsIrrigB9","newsIrrigB10","newsIrrigB11","newsIrrigB12","newsIrrigB13","newsIrrigB14"],
  },
});

const getDailyNews = (t) => [
  {
    id:"n1",
    date: new Date().toLocaleDateString(),
    categoryKey: "dailyNews1Category",
    icon: "🌦️",
    titleKey: "dailyNews1Title",
    bodyKeys: ["dailyNews1B1","dailyNews1B2","dailyNews1B3"],
  },
  {
    id:"n2",
    date: new Date().toLocaleDateString(),
    categoryKey: "dailyNews2Category",
    icon: "🌾",
    titleKey: "dailyNews2Title",
    bodyKeys: ["dailyNews2B1","dailyNews2B2","dailyNews2B3","dailyNews2B4"],
  },
  {
    id:"n3",
    date: new Date().toLocaleDateString(),
    categoryKey: "dailyNews3Category",
    icon: "📈",
    titleKey: "dailyNews3Title",
    bodyKeys: ["dailyNews3B1","dailyNews3B2","dailyNews3B3","dailyNews3B4"],
  },
];

export default function NotificationNews() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { t, notifications } = useApp();

  const newsContent = getNewsContent(t);
  const dailyFarmNews = getDailyNews(t);

  const notif = notifications.find(n => String(n.id) === id);
  const articleDef = notif ? newsContent[notif.type] : null;
  const dailyDef   = dailyFarmNews.find(n => n.id === id);

  const def = articleDef || dailyDef;

  if (!def) {
    return (
      <MainLayout>
        <div style={{ textAlign:"center", padding:60 }}>
          <div style={{ fontSize:48 }}>📰</div>
          <h2 style={{ marginTop:16, color:"var(--text-primary)" }}>{t.newsNotFound}</h2>
          <button className="btn-primary-ag" style={{ marginTop:16 }} onClick={() => navigate(-1)}>
            <FaArrowLeft /> {t.newsGoBack}
          </button>
        </div>
      </MainLayout>
    );
  }

  const title    = t[def.titleKey]    || def.titleKey;
  const category = t[def.categoryKey] || def.categoryKey;
  const readTime = def.readTimeKey ? t[def.readTimeKey] : null;
  const body     = def.bodyKeys.map(k => t[k] || k);
  const date     = def.date || notif?.time;

  return (
    <MainLayout>
      <button className="btn-outline-ag" style={{ marginBottom:20 }} onClick={() => navigate(-1)}>
        <FaArrowLeft /> {t.newsBack}
      </button>

      <div className="card-box" style={{ maxWidth:760, margin:"0 auto" }}>
        <div className="news-category">{category}</div>
        <h1 className="news-title">{title}</h1>
        <div className="news-meta">
          <span>📅 {date}</span>
          {readTime && <span>⏱ {readTime}</span>}
        </div>
        <div className="news-divider" />
        <div className="news-body">
          {body.map((line, i) => (
            <p key={i} className={line.startsWith("•") ? "news-bullet" : "news-para"}>{line}</p>
          ))}
        </div>

        {/* Daily farm news section */}
        <div className="news-divider" style={{ marginTop:32 }} />
        <h3 className="section-title" style={{ marginBottom:16 }}>
          <span>📰</span> {t.newsTodayFarmNews}
        </h3>
        {dailyFarmNews.map(n => (
          <div key={n.id} className="news-card" onClick={() => navigate(`/news/${n.id}`)}>
            <span style={{ fontSize:22 }}>{n.icon}</span>
            <div>
              <div className="news-card__category">{t[n.categoryKey] || n.categoryKey}</div>
              <div className="news-card__title">{t[n.titleKey] || n.titleKey}</div>
            </div>
            <FaExternalLinkAlt style={{ color:"var(--text-muted)", fontSize:12, marginLeft:"auto" }} />
          </div>
        ))}
      </div>
    </MainLayout>
  );
}
