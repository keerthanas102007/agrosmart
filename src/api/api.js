import axios from "axios";

const API = axios.create({
  baseURL: "http://localhost:5000/api",
});

// Attach JWT token to every request
API.interceptors.request.use((req) => {
  const token = localStorage.getItem("token");
  if (token) {
    req.headers.Authorization = `Bearer ${token}`;
  }
  return req;
});

// Centralized error handling — only redirect if token exists and expired
API.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      const token = localStorage.getItem("token");
      // Only force logout if a token existed (meaning it expired)
      // If no token — just return the error, don't redirect
      if (token) {
        localStorage.removeItem("token");
        localStorage.removeItem("user");
        localStorage.removeItem("loggedIn");
        window.location.href = "/";
      }
    }
    return Promise.reject(error);
  }
);

export default API;

// ─── Auth ────────────────────────────────────────────────────
export const loginUser     = (data)  => API.post("/auth/login", data);
export const registerUser  = (data)  => API.post("/auth/register", data);
export const getProfile    = ()      => API.get("/auth/profile");
export const updateProfile = (data)  => API.put("/auth/profile", data);
export const deleteAccount = ()      => API.delete("/auth/delete-account");

// ─── Community Posts ─────────────────────────────────────────
export const getAllPosts       = ()     => API.get("/posts/all");
export const createPost        = (data) => API.post("/posts/create", data);
export const likePost          = (data) => API.post("/posts/like", data);
export const addComment        = (data) => API.post("/posts/comment", data);
export const getComments       = (id)   => API.get(`/posts/comments/${id}`);
export const deletePost        = (id)   => API.delete(`/posts/${id}`);
export const addProfitHistory  = (data) => API.post("/posts/profit", data);
export const getMyProfitHistory= ()     => API.get("/posts/my-profit");
export const getMyPosts        = ()     => API.get("/posts/my-posts");

// ─── Irrigation / Motor ──────────────────────────────────────
export const getMotorStatus    = ()       => API.get("/irrigation/motor");
export const toggleMotor       = (data)   => API.post("/irrigation/motor/toggle", data);
export const setLandLocation   = (data)   => API.post("/irrigation/location", data);
export const getWeatherForLand = ()       => API.get("/irrigation/weather");
export const autoMotorDecision = ()       => API.post("/irrigation/auto-decision");
export const getIrrigationLogs = ()       => API.get("/irrigation/logs");
export const getWaterUsage     = (params) => API.get("/irrigation/water-usage", { params });

// ─── Soil Analysis ───────────────────────────────────────────
export const analyzeSoil    = (data) => API.post("/soil/analyze", data);
export const getSoilHistory = ()     => API.get("/soil/history");

// ─── Sensors (IoT) ───────────────────────────────────────────
export const getLatestSensors      = ()     => API.get("/sensors/latest");
export const getSensorHistory      = ()     => API.get("/sensors/data");
export const addSensor             = (data) => API.post("/sensors/add", data);
export const getCropRecommendation = ()     => API.get("/sensors/crop-recommendation");
export const triggerSimulate       = ()     => API.post("/sensors/simulate");

// ─── Disease Detection ───────────────────────────────────────
export const analyzeDisease      = (data) => API.post("/disease/analyze", data);
export const analyzeFarmPhoto    = (data) => API.post("/disease/farm-analyze", data);
export const getDiseaseHistory   = ()     => API.get("/disease/history");
export const getFarmPhotoHistory = ()     => API.get("/disease/farm-history");
export const deleteDiseaseEntry  = (id)   => API.delete(`/disease/history/${id}`);

// ─── Farm History ─────────────────────────────────────────────
export const getFarmHistory    = ()     => API.get("/farm-history");
export const addFarmHistory    = (data) => API.post("/farm-history", data);
export const deleteFarmHistory = (id)   => API.delete(`/farm-history/${id}`);
export const clearFarmHistory  = ()     => API.delete("/farm-history/clear/all");

// ─── Reports ──────────────────────────────────────────────
export const getReports = () => API.get("/reports");

// ─── Farm Management ──────────────────────────────────────────
export const getFarmDetails       = ()     => API.get("/farm/details");
export const saveFarmDetails      = (data) => API.post("/farm/details", data);
export const getFields            = ()     => API.get("/farm/fields");
export const saveField            = (data) => API.post("/farm/fields", data);
export const deleteField          = (id)   => API.delete(`/farm/fields/${id}`);
export const getCalendar          = ()     => API.get("/farm/calendar");
export const saveCalendarItem     = (data) => API.post("/farm/calendar", data);
export const deleteCalendarItem   = (id)   => API.delete(`/farm/calendar/${id}`);
export const getFertilizerData    = ()     => API.get("/farm/fertilizer-data");
