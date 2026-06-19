import { useEffect, useState, useRef, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import MainLayout from "../layouts/MainLayout";
import { useApp } from "../context/AppContext";
import {
  getAllPosts, likePost, addComment,
  getComments, deletePost
} from "../api/api";
import { getSocket, joinCommunity } from "../utils/socket";
import { translateText } from "../utils/translateText";
import NextStepCard from "../components/NextStepCard";
import "../styles/Community.css";
import "../styles/NextStepCard.css";

export default function Community() {
  const { t, user, lang, sharedDiseaseResult, markFlowStep } = useApp();
  const navigate = useNavigate();
  const [posts, setPosts]           = useState([]);
  // translatedPosts: same array but title/description replaced with translated strings
  const [translatedPosts, setTranslatedPosts] = useState([]);
  const [loading, setLoading]       = useState(true);
  const [translating, setTranslating] = useState(false);
  const [commentMap, setCommentMap] = useState({});   // postId → comment text
  const [expanded, setExpanded]     = useState({});   // postId → bool (show comments)
  const [postComments, setPostComments] = useState({}); // postId → comments[]
  const [likeLoading, setLikeLoading]   = useState({});
  const [error, setError]           = useState("");
  // Track which (posts, lang) combination we last translated to avoid duplicate work
  const lastTranslated = useRef({ lang: null, postIds: "" });

  // ── Translate posts whenever `posts` or `lang` changes ──────────────────
  const translatePosts = useCallback(async (rawPosts, targetLang) => {
    if (!rawPosts.length) { setTranslatedPosts([]); return; }
    const postIds = rawPosts.map(p => p.id).join(",");
    // Skip if same lang & same posts already translated
    if (lastTranslated.current.lang === targetLang &&
        lastTranslated.current.postIds === postIds) return;

    if (targetLang === "en") {
      // No translation needed — use originals
      setTranslatedPosts(rawPosts);
      lastTranslated.current = { lang: targetLang, postIds };
      return;
    }

    setTranslating(true);
    try {
      const translated = await Promise.all(
        rawPosts.map(async (post) => {
          const [title, description] = await Promise.all([
            translateText(post.title, targetLang),
            translateText(post.description, targetLang),
          ]);
          return { ...post, title, description };
        })
      );
      setTranslatedPosts(translated);
      lastTranslated.current = { lang: targetLang, postIds };
    } catch {
      // Fallback: show originals
      setTranslatedPosts(rawPosts);
    } finally {
      setTranslating(false);
    }
  }, []);

  // Re-translate when lang changes
  useEffect(() => {
    if (posts.length > 0) {
      translatePosts(posts, lang);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [lang, posts]);

  useEffect(() => {
    const fetchPosts = async () => {
      try {
        setLoading(true);
        const res = await getAllPosts();
        setPosts(res.data);
        // translatePosts will be triggered by the posts useEffect above
      } catch (err) {
        setError(
          lang === "ta" ? "பதிவுகள் ஏற்றப்படவில்லை. Backend இயங்குகிறதா சரிபார்க்கவும்." :
          lang === "hi" ? "पोस्ट लोड नहीं हुई। Backend चल रहा है?" :
          "Posts could not load. Check if Backend is running."
        );
      } finally {
        setLoading(false);
      }
    };

    fetchPosts();

    // Real-time socket setup
    const socket = getSocket();
    if (socket) {
      joinCommunity();

      // Real-time like count update
      socket.on("like_update", ({ postId, likeCount }) => {
        setPosts(prev => prev.map(p =>
          p.id === postId ? { ...p, like_count: likeCount } : p
        ));
      });

      // Real-time new comment
      socket.on("new_comment", (newComment) => {
        // Add to expanded comment section if open
        setPostComments(prev => {
          if (!prev[newComment.post_id]) return prev;
          const existing = prev[newComment.post_id] || [];
          // Don't duplicate if it's from current user (already added optimistically)
          if (existing.find(c => c.id === newComment.id)) return prev;
          return { ...prev, [newComment.post_id]: [...existing, newComment] };
        });
        // Increment comment count
        setPosts(prev => prev.map(p =>
          p.id === newComment.post_id ? { ...p, comment_count: (p.comment_count || 0) + 1 } : p
        ));
      });
    }

    return () => {
      if (socket) {
        socket.off("like_update");
        socket.off("new_comment");
      }
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const fetchPosts = async () => {
    try {
      setLoading(true);
      const res = await getAllPosts();
      setPosts(res.data);
    } catch (err) {
      setError(
        lang === "ta" ? "பதிவுகள் ஏற்றப்படவில்லை. Backend இயங்குகிறதா சரிபார்க்கவும்." :
        lang === "hi" ? "पोस्ट लोड नहीं हुई। Backend चल रहा है?" :
        "Posts could not load. Check if Backend is running."
      );
    } finally {
      setLoading(false);
    }
  };

  const handleLike = async (postId) => {
    if (!user) return alert(
      lang === "ta" ? "Like பண்ண உள்நுழையவும்" :
      lang === "hi" ? "Like करने के लिए लॉगिन करें" :
      "Please login to like posts"
    );
    setLikeLoading(prev => ({ ...prev, [postId]: true }));
    try {
      const res = await likePost({ postId });
      // Server returns exact likeCount after toggle
      setPosts(prev => prev.map(p =>
        p.id === postId
          ? {
              ...p,
              like_count: res.data.likeCount ?? (res.data.action === "liked" ? p.like_count + 1 : p.like_count - 1),
              user_liked: res.data.action === "liked" ? 1 : 0
            }
          : p
      ));
    } catch (err) {
      console.error(err);
    } finally {
      setLikeLoading(prev => ({ ...prev, [postId]: false }));
    }
  };

  const handleComment = async (postId) => {
    const text = commentMap[postId] || "";
    if (!text.trim()) return;
    if (!user) return alert(
      lang === "ta" ? "கருத்து சேர்க்க உள்நுழையவும்" :
      lang === "hi" ? "टिप्पणी करने के लिए लॉगिन करें" :
      "Please login to comment"
    );
    try {
      await addComment({ postId, comment: text });
      setCommentMap(prev => ({ ...prev, [postId]: "" }));
      // Refresh comments for this post if expanded
      if (expanded[postId]) loadComments(postId);
      setPosts(prev => prev.map(p =>
        p.id === postId ? { ...p, comment_count: p.comment_count + 1 } : p
      ));
    } catch (err) {
      console.error(err);
    }
  };

  const loadComments = async (postId) => {
    try {
      const res = await getComments(postId);
      setPostComments(prev => ({ ...prev, [postId]: res.data }));
    } catch (err) {
      console.error(err);
    }
  };

  const toggleComments = (postId) => {
    const nowExpanded = !expanded[postId];
    setExpanded(prev => ({ ...prev, [postId]: nowExpanded }));
    if (nowExpanded && !postComments[postId]) loadComments(postId);
  };

  const handleDelete = async (postId) => {
    if (!window.confirm(
      lang === "ta" ? "இந்த பதிவை நீக்க விரும்புகிறீர்களா?" :
      lang === "hi" ? "क्या आप यह पोस्ट हटाना चाहते हैं?" :
      "Delete this post?"
    )) return;
    try {
      await deletePost(postId);
      setPosts(prev => prev.filter(p => p.id !== postId));
    } catch (err) {
      alert(
        lang === "ta" ? "நீக்க முடியவில்லை." :
        lang === "hi" ? "हटाना विफल।" :
        "Could not delete post."
      );
    }
  };

  const timeAgo = (ts) => {
    const diff = (Date.now() - new Date(ts)) / 1000;
    if (diff < 60)   return lang === "ta" ? "இப்போதே" : lang === "hi" ? "अभी" : "Just now";
    if (diff < 3600) return `${Math.floor(diff/60)} ${t.minAgo || "min ago"}`;
    if (diff < 86400)return `${Math.floor(diff/3600)} ${t.hrAgo || "hr ago"}`;
    const days = Math.floor(diff/86400);
    return lang === "ta" ? `${days} நாள் முன்` : lang === "hi" ? `${days} दिन पहले` : `${days} day(s) ago`;
  };

  // ✅ Flow Step 7 — user visited community page → mark communityDone
  useEffect(() => {
    markFlowStep("communityDone");
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <MainLayout>
      <div className="community-page">
        {/* ✅ Disease result pre-fill banner — from Disease Detection flow */}
        {sharedDiseaseResult && (
          <div style={{
            background: sharedDiseaseResult.severity === "high" ? "#ffebee" :
                        sharedDiseaseResult.severity === "medium" ? "#fff8e1" : "#e8f5e9",
            border: `2px solid ${sharedDiseaseResult.severity === "high" ? "#ef9a9a" :
                                  sharedDiseaseResult.severity === "medium" ? "#ffe082" : "#a5d6a7"}`,
            borderRadius: 14, padding: "14px 18px", marginBottom: 20,
            display: "flex", alignItems: "center", justifyContent: "space-between",
            flexWrap: "wrap", gap: 12,
          }}>
            <div>
              <div style={{ fontWeight: 800, fontSize: 15, color: "var(--text-primary)", marginBottom: 4 }}>
                🔬 {lang === "ta" ? "கடைசி நோய் கண்டறிதல்:" : lang === "hi" ? "अंतिम रोग पहचान:" : "Last Disease Detection:"}
                {" "}<span style={{ color: sharedDiseaseResult.severity === "high" ? "#d32f2f" : sharedDiseaseResult.severity === "medium" ? "#f57c00" : "#2e7d32" }}>
                  {sharedDiseaseResult.disease}
                </span>
              </div>
              <div style={{ fontSize: 13, color: "var(--text-secondary)" }}>
                🌾 {sharedDiseaseResult.cropType} &nbsp;·&nbsp;
                {lang === "ta" ? "நம்பகத்தன்மை" : lang === "hi" ? "विश्वसनीयता" : "Confidence"}: {sharedDiseaseResult.confidence}%
              </div>
            </div>
            <button
              className="btn-primary-ag"
              style={{ fontSize: 13, padding: "8px 18px" }}
              onClick={() => navigate("/create-post", {
                state: {
                  fromDisease: true,
                  prefillTitle: `${sharedDiseaseResult.cropType} - ${sharedDiseaseResult.disease}`,
                  prefillDesc:  lang === "ta"
                    ? `என் ${sharedDiseaseResult.cropType} பயிரில் ${sharedDiseaseResult.disease} கண்டறியப்பட்டது. தீவிரம்: ${sharedDiseaseResult.severity}. உங்கள் அனுபவம் என்ன?`
                    : lang === "hi"
                    ? `मेरी ${sharedDiseaseResult.cropType} फसल में ${sharedDiseaseResult.disease} पाई गई। गंभीरता: ${sharedDiseaseResult.severity}। आपका अनुभव क्या है?`
                    : `${sharedDiseaseResult.disease} detected in my ${sharedDiseaseResult.cropType} crop. Severity: ${sharedDiseaseResult.severity}. Anyone faced this?`,
                }
              })}
            >
              ✏️ {lang === "ta" ? "இதை பகிர்" : lang === "hi" ? "यह साझा करें" : "Share This"}
            </button>
          </div>
        )}

        {/* Header */}
        <div className="community-header">
          <h1>🌾 {t.community || "Farmer Community"}</h1>
          <p>{t.communitySub || "Share your farming success and learn from others"}</p>
          {user && (
            <a href="/create-post" className="btn-create-post">
              ✏️ {t.createPost || "Create Post"}
            </a>
          )}
        </div>

        {error && <div className="error-msg">⚠️ {error}</div>}

        {loading ? (
          <div className="loading-spinner">
            <div className="spinner" /> {lang === "ta" ? "ஏற்றுகிறது..." : lang === "hi" ? "लोड हो रहा है..." : "Loading posts..."}
          </div>
        ) : posts.length === 0 ? (
          <div className="no-posts">
            <span>📭</span>
            <p>{t.noPosts || "No posts yet. Be the first to share!"}</p>
          </div>
        ) : (
          <div className="post-grid">
            {translating && (
              <div className="translating-bar">
                🌐 {lang === "ta" ? "மொழிபெயர்க்கிறது..." : lang === "hi" ? "अनुवाद हो रहा है..." : "Translating..."}
              </div>
            )}
            {(translatedPosts.length > 0 ? translatedPosts : posts).map(post => (
              <div className="post-card" key={post.id}>
                {/* Post Header */}
                <div className="post-card__header">
                  <div className="post-author">
                    <div className="post-author__avatar">
                      {post.author_name?.[0]?.toUpperCase() || "F"}
                    </div>
                    <div>
                      <div className="post-author__name">👨‍🌾 {post.author_name}</div>
                      <div className="post-author__location">
                        📍 {post.author_location || "India"} · {timeAgo(post.created_at)}
                      </div>
                    </div>
                  </div>
                  {/* Delete button (only own posts) */}
                  {user && user.id === post.user_id && (
                    <button className="post-delete-btn" onClick={() => handleDelete(post.id)} title="Delete post">
                      🗑️
                    </button>
                  )}
                </div>

                {/* Post Image */}
                {post.image && (
                  <img
                    className="post-image"
                    src={`http://localhost:5000/uploads/posts/${post.image}`}
                    alt={post.title}
                    onError={e => e.target.style.display = "none"}
                  />
                )}

                {/* Post Content */}
                <div className="post-content">
                  <h2 className="post-title">{post.title}</h2>
                  <p className="post-desc">{post.description}</p>
                </div>

                {/* Actions */}
                <div className="post-actions">
                  <button
                    className={`action-btn like-btn ${post.user_liked ? "liked" : ""}`}
                    onClick={() => handleLike(post.id)}
                    disabled={likeLoading[post.id]}
                  >
                    {post.user_liked ? "❤️" : "🤍"} {post.like_count || 0}
                  </button>

                  <button
                    className="action-btn comment-toggle-btn"
                    onClick={() => toggleComments(post.id)}
                  >
                    💬 {post.comment_count || 0} {t.comments || "Comments"}
                    {expanded[post.id] ? " ▲" : " ▼"}
                  </button>
                </div>

                {/* Comment Section */}
                {expanded[post.id] && (
                  <div className="comment-section">
                    {/* Existing comments */}
                    <div className="comments-list">
                      {(postComments[post.id] || []).map(c => (
                        <div className="comment-item" key={c.id}>
                          <span className="comment-author">{c.author_name}:</span>
                          <span className="comment-text">{c.comment}</span>
                          <span className="comment-time">{timeAgo(c.created_at)}</span>
                        </div>
                      ))}
                      {postComments[post.id]?.length === 0 && (
                        <p className="no-comments">{t.noComments || "No comments yet."}</p>
                      )}
                    </div>

                    {/* Add comment */}
                    {user && (
                      <div className="add-comment">
                        <input
                          type="text"
                          placeholder={t.writeComment || "Write a comment..."}
                          value={commentMap[post.id] || ""}
                          onChange={e => setCommentMap(prev => ({ ...prev, [post.id]: e.target.value }))}
                          onKeyDown={e => e.key === "Enter" && handleComment(post.id)}
                        />
                        <button onClick={() => handleComment(post.id)}>
                          ➤
                        </button>
                      </div>
                    )}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* ✅ Smart Flow — Step 7 done → go to Reports */}
      <NextStepCard currentStep="communityDone" />
    </MainLayout>
  );
}
