/**
 * useSensorSocket — WebSocket hook for real-time sensor updates
 *
 * Usage:
 *   const { sensorData, connected } = useSensorSocket(userId);
 *
 * • Connects to Socket.IO server when userId is available
 * • Joins `sensors_<userId>` room
 * • Listens for `sensor_update` events
 * • Auto-reconnects on disconnect
 * • Cleans up on component unmount
 */

import { useEffect, useRef, useState, useCallback } from "react";
import { io } from "socket.io-client";

const SOCKET_URL = "http://43.205.135.176:5000";

export default function useSensorSocket(userId) {
  const [sensorData, setSensorData]   = useState([]);
  const [connected,  setConnected]    = useState(false);
  const [lastUpdate, setLastUpdate]   = useState(null);
  const socketRef                     = useRef(null);

  const connect = useCallback(() => {
    if (!userId) return;
    if (socketRef.current?.connected) return;

    const socket = io(SOCKET_URL, {
      transports: ["websocket", "polling"],
      reconnection: true,
      reconnectionAttempts: Infinity,
      reconnectionDelay: 2000,
    });

    socket.on("connect", () => {
      setConnected(true);
      // Join user-specific sensor room
      socket.emit("join_sensors", userId);
    });

    socket.on("disconnect", () => {
      setConnected(false);
    });

    // Real-time sensor data from server
    socket.on("sensor_update", (data) => {
      if (Array.isArray(data) && data.length > 0) {
        setSensorData(data);
        setLastUpdate(new Date());
      }
    });

    socketRef.current = socket;
  }, [userId]);

  useEffect(() => {
    connect();
    return () => {
      socketRef.current?.disconnect();
      socketRef.current = null;
    };
  }, [connect]);

  return { sensorData, connected, lastUpdate };
}
