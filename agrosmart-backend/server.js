require("dotenv").config();

const express    = require("express");
const cors       = require("cors");
const path       = require("path");
const http       = require("http");

const db = require("./config/db");

const app    = express();
const server = http.createServer(app);

/* ── Socket.IO real-time ─────────────────────────── */
let io;
try {
    const { Server } = require("socket.io");
    io = new Server(server, {
        cors: { origin: "*", methods: ["GET","POST"] }
    });

    io.on("connection", (socket) => {
        console.log("🔌 Client connected:", socket.id);

        // Join user-specific room for sensor updates
        socket.on("join_sensors", (userId) => {
            socket.join(`sensors_${userId}`);
            console.log(`📡 User ${userId} joined sensor room`);
        });

        // Join a room when user opens community
        socket.on("join_community", () => {
            socket.join("community");
        });

        socket.on("disconnect", () => {
            console.log("🔌 Client disconnected:", socket.id);
        });
    });

    // Export io so controllers can emit events
    app.set("io", io);
    console.log("✅ Socket.IO initialized");
} catch (e) {
    console.log("⚠️  Socket.IO not installed yet — run: npm install socket.io");
}

/* ── Server-side Auto Simulation Timer ─────────────
   Runs every 10 seconds. For every user who has sensors
   but no real data in the last 30s, auto-simulate and
   broadcast via WebSocket. This removes the need for
   frontend polling to trigger simulation.
────────────────────────────────────────────────── */
setTimeout(() => {
    const sensorCtrl = require("./controllers/sensorController");
    setInterval(() => {
        sensorCtrl.serverAutoSimulate(io);
    }, 10000);
    console.log("⏱️  Server-side sensor simulation timer started (every 10s)");
}, 3000); // Small delay to let DB connection settle

/* ── Middleware ──────────────────────────────────── */
app.use(cors({
    origin: [
        "http://localhost:3000",
        "http://localhost:3001",
        /\.vercel\.app$/,      // any Vercel deployment
        /\.netlify\.app$/,     // any Netlify deployment
        /\.render\.com$/,      // Render frontend
    ],
    methods: ["GET","POST","PUT","DELETE"],
    allowedHeaders: ["Content-Type","Authorization"],
    credentials: true,
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

/* ── Static files ─────────────────────────────────── */
app.use("/uploads", express.static(path.join(__dirname, "uploads")));

/* ── Routes ─────────────────────────────────────── */
const authRoutes          = require("./routes/authRoutes");
const postRoutes          = require("./routes/postRoutes");
const irrigationRoutes    = require("./routes/irrigationRoutes");
const sensorRoutes        = require("./routes/sensorRoutes");
const diseaseRoutes       = require("./routes/diseaseRoutes");
const soilRoutes          = require("./routes/soilRoutes");
const farmHistoryRoutes   = require("./routes/farmHistoryRoutes");
const farmRoutes          = require("./routes/farmRoutes");
const reportsRoutes       = require("./routes/reportsRoutes");

app.use("/api/auth",          authRoutes);
app.use("/api/posts",         postRoutes);
app.use("/api/irrigation",    irrigationRoutes);
app.use("/api/sensors",       sensorRoutes);
app.use("/api/disease",       diseaseRoutes);
app.use("/api/soil",          soilRoutes);
app.use("/api/farm-history",  farmHistoryRoutes);
app.use("/api/farm",          farmRoutes);
app.use("/api/reports",      reportsRoutes);
app.use("/uploads/soils",  require("express").static(require("path").join(__dirname, "uploads/soils")));

/* ── Health check ─────────────────────────────────── */
app.get("/", (req, res) => {
    res.json({ message: "AgroSmart Backend Running ✅", version: "2.0", realtime: !!io });
});

/* ── Start ─────────────────────────────────────────── */
const PORT = process.env.PORT || 5000;
server.listen(PORT, () => {
    console.log(`✅ AgroSmart Server on Port ${PORT}`);
    console.log(`📡 Database: ${process.env.DB_NAME}`);
});
