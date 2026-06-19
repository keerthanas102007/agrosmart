const mongoose = require("mongoose");

// Idea 2: Motor on/off log with weather-based auto control
const irrigationSchema = new mongoose.Schema({
  user:        { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  action:      { type: String, enum: ["ON", "OFF"], required: true },
  triggeredBy: { type: String, enum: ["manual", "weather_auto", "schedule"], default: "manual" },
  weather:     {
    condition:    { type: String, default: "" },
    rainfall:     { type: Number, default: 0 },   // mm
    humidity:     { type: Number, default: 0 },
    temperature:  { type: Number, default: 0 },
  },
  soilMoisture:    { type: Number, default: 0 },
  waterUsed:       { type: Number, default: 0 },  // litres
  durationMinutes: { type: Number, default: 0 },
  fieldName:       { type: String, default: "Main Field" },
  notes:           { type: String, default: "" },
}, { timestamps: true });

module.exports = mongoose.model("IrrigationLog", irrigationSchema);
