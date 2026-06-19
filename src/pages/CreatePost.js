import { useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import MainLayout from "../layouts/MainLayout";
import { useApp } from "../context/AppContext";
import { createPost } from "../api/api";
import "../styles/CreatePost.css";

export default function CreatePost() {
  const navigate = useNavigate();
  const location = useLocation();
  const { t, user, lang } = useApp();

  const [title, setTitle]         = useState("");
  const [description, setDesc]    = useState("");
  const [image, setImage]         = useState(null);
  const [preview, setPreview]     = useState(null);
  const [loading, setLoading]     = useState(false);
  const [error, setError]         = useState("");

  // ✅ Auto pre-fill if navigated from Disease Detection flow
  useEffect(() => {
    const state = location.state;
    if (state?.fromDisease) {
      if (state.prefillTitle) setTitle(state.prefillTitle);
      if (state.prefillDesc)  setDesc(state.prefillDesc);
    }
  }, [location.state]);

  const handleImage = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setImage(file);
    setPreview(URL.createObjectURL(file));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!title.trim() || !description.trim()) {
      return setError(t.titleDescRequired);
    }
    if (!user) return setError(t.pleaseLoginFirst);

    try {
      setLoading(true);
      setError("");
      const form = new FormData();
      form.append("title", title);
      form.append("description", description);
      if (image) form.append("image", image);

      await createPost(form);
      navigate("/community");
    } catch (err) {
      setError(err.response?.data?.message || t.postFailed);
    } finally {
      setLoading(false);
    }
  };

  return (
    <MainLayout>
      <div className="create-post-page">
        <div className="create-post-card">
          <div className="create-post-header">
            <h2>✏️ {t.createPost || "Create Post"}</h2>
            <p>{t.createPostSub || "Share your farming experience with the community"}</p>
          </div>

          {error && <div className="form-error">⚠️ {error}</div>}

          {/* ✅ Pre-fill notice from Disease Detection */}
          {location.state?.fromDisease && (
            <div style={{
              background: "#e8f5e9", border: "1px solid #a5d6a7",
              borderRadius: 10, padding: "10px 14px", marginBottom: 16,
              fontSize: 13, color: "#2e7d32", fontWeight: 600
            }}>
              🔬 {lang === "ta"
                ? "நோய் கண்டறிதல் முடிவிலிருந்து தகவல் நிரப்பப்பட்டது. திருத்தி பதிவிடலாம்!"
                : lang === "hi"
                ? "रोग पहचान परिणाम से डेटा भरा गया है। संपादित करके पोस्ट करें!"
                : "Pre-filled from your disease detection result. Edit and post!"}
            </div>
          )}

          <form onSubmit={handleSubmit} className="create-post-form">
            <div className="form-group">
              <label>📌 {t.postTitle || "Post Title"}</label>
              <input
                type="text"
                className="form-input"
                placeholder={t.postTitlePlaceholder || "e.g. My best Rice harvest this year!"}
                value={title}
                onChange={e => setTitle(e.target.value)}
                maxLength={200}
              />
              <span className="char-count">{title.length}/200</span>
            </div>

            <div className="form-group">
              <label>📝 {t.description || "Description"}</label>
              <textarea
                className="form-input"
                rows={5}
                placeholder={t.postDescPlaceholder || "Describe your crop, techniques used, what worked well..."}
                value={description}
                onChange={e => setDesc(e.target.value)}
                maxLength={1000}
              />
              <span className="char-count">{description.length}/1000</span>
            </div>

            <div className="form-group">
              <label>🖼️ {t.addPhoto || "Add Photo (optional)"}</label>
              <div className="image-upload-area" onClick={() => document.getElementById("post-img").click()}>
                {preview ? (
                  <img src={preview} alt="preview" className="image-preview" />
                ) : (
                  <div className="upload-placeholder">
                    <span>📷</span>
                    <p>{t.clickToUpload || "Click to upload farm photo"}</p>
                    <small>{t.maxFileSize}</small>
                  </div>
                )}
              </div>
              <input
                id="post-img"
                type="file"
                accept="image/*"
                style={{ display: "none" }}
                onChange={handleImage}
              />
              {preview && (
                <button type="button" className="btn-remove-image" onClick={() => { setImage(null); setPreview(null); }}>
                  {t.removePhoto}
                </button>
              )}
            </div>

            <div className="form-actions">
              <button type="button" className="btn-outline-ag" onClick={() => navigate("/community")}>
                ← {t.cancel}
              </button>
              <button type="submit" className="btn-primary-ag" disabled={loading}>
                {loading ? t.posting : `🌾 ${t.publishPost}`}
              </button>
            </div>
          </form>
        </div>
      </div>
    </MainLayout>
  );
}
