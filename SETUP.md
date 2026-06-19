# AgroSmart — Complete Setup Guide

## 📁 Project Structure
```
smart-agriculture/
├── src/                        ← React Frontend
│   ├── pages/
│   │   ├── Login.js            ✅ Real backend auth
│   │   ├── Register.js         ✅ Real backend auth
│   │   ├── Dashboard.js        ✅ Live sensor data + motor status
│   │   ├── Community.js        ✅ Real-time likes & comments (Socket.IO)
│   │   ├── CreatePost.js       ✅ Photo upload + post create
│   │   ├── ProfitHistory.js    ✅ Farm profit tracker with photos
│   │   ├── DiseaseDetection.js ✅ Photo → disease analysis + farm analysis
│   │   ├── Irrigation.js       ✅ Motor ON/OFF + weather-based auto control
│   │   ├── Sensors.js          ✅ IoT-ready, real + mock data
│   │   └── Profile.js          ✅ Real profile with photo upload
│   ├── utils/socket.js         ✅ Socket.IO real-time client
│   └── api/api.js              ✅ All API endpoints
│
└── agrosmart-backend/          ← Node.js + Express Backend
    ├── controllers/
    │   ├── authController.js   ✅ Login, Register, Profile update
    │   ├── postController.js   ✅ Posts, likes (realtime), comments (realtime)
    │   ├── irrigationController.js ✅ Motor ON/OFF + weather API
    │   ├── sensorController.js ✅ IoT sensor data + crop recommendation
    │   └── diseaseController.js ✅ Disease detection + farm analysis
    ├── database.sql            ✅ Run this first in MySQL!
    └── server.js               ✅ Express + Socket.IO
```

---

## 🚀 STEP 1 — MySQL Setup

1. Open **MySQL Workbench** or **phpMyAdmin**
2. Run the file: `agrosmart-backend/database.sql`
3. This creates the `smart_agri` database with all tables

---

## 🚀 STEP 2 — Backend Setup

```bash
cd agrosmart-backend
npm install
npm run dev
```

Backend runs on: **http://localhost:5000**

---

## 🚀 STEP 3 — Frontend Setup

```bash
cd smart-agriculture  (root folder)
npm install
npm start
```

Frontend runs on: **http://localhost:3000**

---

## 🚀 STEP 4 — Install Socket.IO (for real-time)

```bash
# Backend
cd agrosmart-backend
npm install socket.io

# Frontend
cd ..  (root)
npm install socket.io-client
```

---

## ✅ Features Summary

| Feature | Status | How it works |
|---------|--------|-------------|
| Farmer Login/Register | ✅ | JWT auth, saves to MySQL |
| Community Posts | ✅ | Photo upload, like, comment |
| Real-time Likes | ✅ | Socket.IO — updates instantly for all users |
| Real-time Comments | ✅ | Socket.IO — appears instantly |
| Profit History | ✅ | Photos + investment/revenue tracking |
| Motor ON/OFF | ✅ | Manual + weather-based auto mode |
| Weather for Land | ✅ | Open-Meteo API (free, no key needed) |
| Disease Detection | ✅ | Photo → disease name + solutions + fertilizers |
| Farm Photo Analysis | ✅ | Photo → positive/warning/alert command |
| IoT Sensor (future) | ✅ Ready | POST to /api/sensors/push with device_key |
| Crop Recommendation | ✅ | From real sensor data |
| Tamil/Hindi/English | ✅ | Full translation throughout |
| Dark Mode | ✅ | Toggle anywhere |
| Profile Photo | ✅ | Upload and update |

---

## 🔌 IoT Sensor Integration (Future)

When you add physical sensors, they POST to:

```
POST http://localhost:5000/api/sensors/push
Content-Type: application/json

{
  "device_key": "AGRO_1_...",   ← From Add Sensor in Sensors page
  "temperature": 32.5,
  "humidity": 68,
  "soil_moisture": 74,
  "ph_level": 6.8,
  "nitrogen": 45,
  "phosphorus": 30,
  "potassium": 40
}
```

Sensors page auto-detects real data and switches from mock to live.

---

## 🌍 Language Support

- Switch language from **Profile page** or **Login page top bar**
- Tamil (தமிழ்) — Full translation
- Hindi (हिन्दी) — Full translation
- English — Default
