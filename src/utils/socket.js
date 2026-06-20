/* ──────────────────────────────────────────────────
   Socket.IO client utility
   Gracefully handles the case where socket.io-client
   is not yet installed.
────────────────────────────────────────────────── */

let socket = null;

export function getSocket() {
    if (socket) return socket;

    try {
        const { io } = require("socket.io-client");
        socket = io("http://43.205.135.176:5000", {
            transports: ["websocket","polling"],
            autoConnect: true,
            reconnection: true,
            reconnectionAttempts: 5,
            reconnectionDelay: 2000,
        });

        socket.on("connect", () => {
            console.log("🔌 Real-time connected:", socket.id);
        });
        socket.on("connect_error", (err) => {
            console.warn("⚠️ Socket connect error:", err.message);
        });

        return socket;
    } catch (e) {
        console.warn("⚠️ socket.io-client not installed. Run: npm install socket.io-client");
        return null;
    }
}

export function joinCommunity() {
    const s = getSocket();
    if (s) s.emit("join_community");
}

export function disconnectSocket() {
    if (socket) {
        socket.disconnect();
        socket = null;
    }
}
