const mongoose = require("mongoose");

// Idea 3: IoT sensor data storage
const sensorSchema = new mongoose.Schema({
  user:         { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  deviceId:     { type: String, default: "manual" },  // IoT device ID
  temperature:  { type: Number, default: 0 },
  humidity:     { type: Number, default: 0 },
  soilMoisture: { type: Number, default: 0 },
  phLevel:      { type: Number, default: 7 },
  nitrogen:     { type: Number, default: 0 },
  phosphorus:   { type: Number, default: 0 },
  potassium:    { type: Number, default: 0 },
  rainfall:     { type: Number, default: 0 },
  windSpeed:    { type: Number, default: 0 },
  uvIndex:      { type: Number, default: 0 },
  // Auto soil type detection based on sensor values
  detectedSoilType: { type: String, default: "" },
  // AI recommendations based on sensor data
  aiRecommendations: {
    crops:       [{ type: String }],
    fertilizers: [{ type: String }],
    pesticides:  [{ type: String }],
    waterNeeded: { type: Number, default: 0 }
  },
  source: { type: String, enum: ["iot", "manual"], default: "manual" },
}, { timestamps: true });

module.exports = mongoose.model("SensorData", sensorSchema);
