import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import MainLayout from "../layouts/MainLayout";
import { useApp } from "../context/AppContext";
import { addProfitHistory, getMyProfitHistory } from "../api/api";
import "../styles/ProfitHistory.css";

export default function ProfitHistory() {
  const { t, user, lang } = useApp();
  const navigate = useNavigate();

  const [history, setHistory]   = useState([]);
  const [loading, setLoading]   = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [submitting, setSubmit] = useState(false);
  const [error, setError]       = useState("");

  const [form, setForm] = useState({
    crop_name: "", investment: "", profit: "", description: ""
  });
  const [image, setImage]   = useState(null);
  const [preview, setPreview] = useState(null);

  useEffect(() => {
    fetchHistory();
  }, []);

  const fetchHistory = async () => {
    try {
      setLoading(true);
      const res = await getMyProfitHistory();
      setHistory(res.data);
    } catch (err) {
      setError(
        lang === "ta" ? "வரலாறு ஏற்றப்படவில்லை." :
        lang === "hi" ? "इतिहास लोड नहीं हुआ।" :
        "History could not load."
      );
    } finally {
      setLoading(false);
    }
  };

  const handleImage = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setImage(file);
    setPreview(URL.createObjectURL(file));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.crop_name || !form.investment || !form.profit) {
      return setError(
        lang === "ta" ? "பயிர் பெயர், முதலீடு மற்றும் வருவாய் தேவை." :
        lang === "hi" ? "फसल का नाम, निवेश और आय आवश्यक है।" :
        "Crop name, investment and profit required."
      );
    }
    try {
      setSubmit(true);
      const fd = new FormData();
      fd.append("crop_name", form.crop_name);
      fd.append("investment", form.investment);
      fd.append("profit", form.profit);
      fd.append("description", form.description);
      if (image) fd.append("image", image);

      await addProfitHistory(fd);
      setForm({ crop_name: "", investment: "", profit: "", description: "" });
      setImage(null); setPreview(null);
      setShowForm(false);
      fetchHistory();
    } catch (err) {
      setError(err.response?.data?.message || (
        lang === "ta" ? "சேமிக்கப்படவில்லை." :
        lang === "hi" ? "सहेजा नहीं गया।" :
        "Could not save record."
      ));
    } finally {
      setSubmit(false);
    }
  };

  const totalProfit = history.reduce((sum, h) => sum + Number(h.profit), 0);
  const totalInvest = history.reduce((sum, h) => sum + Number(h.investment), 0);
  const netGain     = totalProfit - totalInvest;

  const fmt = (n) => Number(n).toLocaleString("en-IN", { style: "currency", currency: "INR", maximumFractionDigits: 0 });

  return (
    <MainLayout>
      <div className="profit-page">
        <div className="page-header">
          <h1>💰 {t.profitHistory || "Profit History"}</h1>
          <p>{t.profitSub || "Track your farm earnings and share your success"}</p>
          {user && (
            <button className="btn-primary-ag" onClick={() => setShowForm(!showForm)}>
              {showForm
                ? (lang === "ta" ? "✕ மூடு" : lang === "hi" ? "✕ बंद करें" : "✕ Close")
                : (lang === "ta" ? "+ பதிவு சேர்" : lang === "hi" ? "+ रिकॉर्ड जोड़ें" : "+ Add Record")
              }
            </button>
          )}
        </div>

        {/* Summary Cards */}
        {history.length > 0 && (
          <div className="profit-summary">
            <div className="profit-card profit-card--invest">
              <span>💸</span>
              <div>
                <div className="label">{t.totalInvestment || "Total Investment"}</div>
                <div className="value">{fmt(totalInvest)}</div>
              </div>
            </div>
            <div className="profit-card profit-card--profit">
              <span>📈</span>
              <div>
                <div className="label">{t.totalRevenue || "Total Revenue"}</div>
                <div className="value">{fmt(totalProfit)}</div>
              </div>
            </div>
            <div className={`profit-card ${netGain >= 0 ? "profit-card--gain" : "profit-card--loss"}`}>
              <span>{netGain >= 0 ? "🟢" : "🔴"}</span>
              <div>
                <div className="label">{t.netGain || "Net Gain"}</div>
                <div className="value">{fmt(netGain)}</div>
              </div>
            </div>
          </div>
        )}

        {error && <div className="form-error">⚠️ {error}</div>}

        {/* Add Form */}
        {showForm && (
          <div className="profit-form-card">
            <h3>📋 {lang === "ta" ? "லாப பதிவை சேர்க்கவும்" : lang === "hi" ? "लाभ रिकॉर्ड जोड़ें" : "Add Profit Record"}</h3>
            <form onSubmit={handleSubmit} className="profit-form">
              <div className="form-row">
                <div className="form-group">
                  <label>🌾 {t.cropName || "Crop Name"}</label>
                  <input className="form-input" placeholder={
                    lang === "ta" ? "எ.கா. நெல்" : lang === "hi" ? "जैसे चावल" : "e.g. Rice"
                  } value={form.crop_name}
                    onChange={e => setForm({...form, crop_name: e.target.value})} />
                </div>
                <div className="form-group">
                  <label>💸 {t.investment || "Investment (₹)"}</label>
                  <input className="form-input" type="number" placeholder="e.g. 25000" value={form.investment}
                    onChange={e => setForm({...form, investment: e.target.value})} />
                </div>
                <div className="form-group">
                  <label>📈 {t.revenue || "Revenue (₹)"}</label>
                  <input className="form-input" type="number" placeholder="e.g. 45000" value={form.profit}
                    onChange={e => setForm({...form, profit: e.target.value})} />
                </div>
              </div>
              <div className="form-group">
                <label>📝 {t.notes || "Description / Instructions"}</label>
                <textarea className="form-input" rows={3} placeholder={
                    lang === "ta" ? "எந்த நுட்பங்கள் பயன்பட்டன? மண் தயாரிப்பு, உரம்..."
                  : lang === "hi" ? "कौन-सी तकनीक काम आई? मिट्टी तैयारी, उर्वरक..."
                  : "What techniques worked? Soil prep, fertilizer used..."
                  }
                  value={form.description} onChange={e => setForm({...form, description: e.target.value})} />
              </div>
              <div className="form-group">
                <label>🖼️ {t.addPhoto || "Farm Photo"}</label>
                <div className="image-upload-area" onClick={() => document.getElementById("profit-img").click()}>
                  {preview ? <img src={preview} alt="preview" className="image-preview" /> : (
                    <div className="upload-placeholder">
                      <span>📷</span>
                      <p>{lang === "ta" ? "படம் சேர்க்க கிளிக் பண்ணுங்க" : lang === "hi" ? "फोटो जोड़ने के लिए क्लिक करें" : "Click to add photo"}</p>
                    </div>
                  )}
                </div>
                <input id="profit-img" type="file" accept="image/*" style={{display:"none"}} onChange={handleImage} />
              </div>
              <div className="form-actions">
                <button type="button" className="btn-outline-ag" onClick={() => setShowForm(false)}>
                  {lang === "ta" ? "ரத்து" : lang === "hi" ? "रद्द करें" : "Cancel"}
                </button>
                <button type="submit" className="btn-primary-ag" disabled={submitting}>
                  {submitting
                    ? (lang === "ta" ? "சேமிக்கிறது..." : lang === "hi" ? "सहेज रहे हैं..." : "Saving...")
                    : (lang === "ta" ? "💾 பதிவை சேமி" : lang === "hi" ? "💾 रिकॉर्ड सहेजें" : "💾 Save Record")
                  }
                </button>
              </div>
            </form>
          </div>
        )}

        {/* History List */}
        {loading ? (
          <div className="loading-spinner"><div className="spinner" /> {lang === "ta" ? "ஏற்றுகிறது..." : lang === "hi" ? "लोड हो रहा है..." : "Loading..."}</div>
        ) : history.length === 0 ? (
          <div className="no-posts">
            <span>📊</span>
            <p>{t.noProfitHistory || "No profit records yet. Add your first harvest record!"}</p>
          </div>
        ) : (
          <div className="profit-list">
            {history.map(h => {
              const gain = Number(h.profit) - Number(h.investment);
              return (
                <div className="profit-record" key={h.id}>
                  {h.image && (
                    <img
                      src={`http://localhost:5000/uploads/posts/${h.image}`}
                      alt={h.crop_name}
                      className="profit-record__img"
                      onError={e => e.target.style.display = "none"}
                    />
                  )}
                  <div className="profit-record__body">
                    <div className="profit-record__crop">🌾 {h.crop_name}</div>
                    <div className="profit-record__date">{new Date(h.created_at).toLocaleDateString("en-IN")}</div>
                    {h.description && <p className="profit-record__desc">{h.description}</p>}
                    <div className="profit-record__numbers">
                      <span className="invest">💸 {fmt(h.investment)}</span>
                      <span className="revenue">📈 {fmt(h.profit)}</span>
                      <span className={gain >= 0 ? "gain" : "loss"}>
                        {gain >= 0 ? "🟢" : "🔴"} {fmt(Math.abs(gain))}{" "}
                        {gain >= 0
                          ? (lang === "ta" ? "லாபம்" : lang === "hi" ? "लाभ" : "Profit")
                          : (lang === "ta" ? "நஷ்டம்" : lang === "hi" ? "हानि" : "Loss")
                        }
                      </span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </MainLayout>
  );
}
