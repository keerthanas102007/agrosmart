const express    = require("express");
const mongoose   = require("mongoose");
const cors       = require("cors");
const http       = require("http");
const { Server } = require("socket.io");
require("dotenv").config();

const app    = express();
const server = http.createServer(app);

// ── Socket.io setup (realtime: likes, comments, motor status) ──
const io = new Server(server, {
  cors: { origin: process.env.FRONTEND_URL || "http://localhost:3000", methods: ["GET","POST"] }
});

// Make io accessible in routes
app.set("io", io);

// ── Middleware ──
app.use(cors({ origin: process.env.FRONTEND_URL || "http://localhost:3000" }));
app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ extended: true, limit: "10mb" }));

// ── Routes ──
app.use("/api/auth",       require("./routes/auth"));
app.use("/api/posts",      require("./routes/posts"));
app.use("/api/sensors",    require("./routes/sensors"));
app.use("/api/irrigation", require("./routes/irrigation"));
app.use("/api/ai",         require("./routes/ai"));
app.use("/api/weather",    require("./routes/weather"));

// ── Health check ──
app.get("/", (req, res) => res.json({ status: "AgroSmart API running ✅" }));

// ── Socket.io events ──
io.on("connection", (socket) => {
  console.log("Client connected:", socket.id);

  // Join farmer's personal room
  socket.on("join", (userId) => socket.join(userId));

  // Motor control realtime
  socket.on("motor_toggle", (data) => {
    io.to(data.userId).emit("motor_status", data);
  });

  socket.on("disconnect", () => {
    console.log("Client disconnected:", socket.id);
  });
});

// ── Database + Server start ──
mongoose
  .connect(process.env.MONGO_URI)
  .then(() => {
    console.log("✅ MongoDB connected");
    const PORT = process.env.PORT || 5000;
    server.listen(PORT, () => console.log(`🚀 Server running on port ${PORT}`));
  })
  .catch((err) => console.error("❌ MongoDB error:", err));
