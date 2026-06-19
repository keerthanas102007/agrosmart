// Mock data for Smart Agriculture Monitoring System
// NOTE: All translatable strings use neutral keys.
// Pages resolve them via t[key] from AppContext.

export const sensorData = {
  temperature: 32,
  humidity: 68,
  soilMoisture: 74,
  phLevel: 6.8,
  nitrogen: 42,
  phosphorus: 35,
  potassium: 58,
  rainfall: 12,
  windSpeed: 14,
  uvIndex: 6,
};

// Labels are resolved per-language in each page via DAY_LABELS map
export const weeklyChartData = {
  temperature: [30, 32, 29, 34, 33, 31, 32],
  humidity: [65, 70, 68, 62, 66, 72, 68],
  soilMoisture: [72, 68, 75, 70, 74, 76, 74],
  phLevel: [6.5, 6.7, 6.8, 6.6, 6.9, 6.8, 6.8],
};

// Labels are resolved per-language in each page via MONTH_LABELS map
export const monthlyChartData = {
  rainfall: [45, 30, 55, 80, 120, 160, 180, 150, 110, 70, 40, 30],
  avgTemp: [22, 24, 27, 31, 34, 35, 33, 32, 31, 29, 25, 22],
  cropYield: [60, 55, 70, 80, 85, 78, 82, 88, 75, 72, 65, 58],
};

// nameKey / lastUpdateKey → resolved via t[key] in Sensors page
export const sensorList = [
  { id: "SN-001", nameKey: "sensorFieldA", type: "Soil Moisture", value: "74%",    status: "active",   battery: 92, lastUpdateKey: "su2min" },
  { id: "SN-002", nameKey: "sensorFieldB", type: "Temperature",   value: "32°C",   status: "active",   battery: 78, lastUpdateKey: "su1min" },
  { id: "SN-003", nameKey: "sensorFieldC", type: "pH Level",      value: "6.8",    status: "active",   battery: 65, lastUpdateKey: "su5min" },
  { id: "SN-004", nameKey: "sensorFieldD", type: "Humidity",      value: "68%",    status: "warning",  battery: 23, lastUpdateKey: "su3min" },
  { id: "SN-005", nameKey: "sensorGreenhouse", type: "CO₂ Level", value: "412ppm", status: "active",   battery: 88, lastUpdateKey: "su4min" },
  { id: "SN-006", nameKey: "sensorFieldE", type: "Wind Speed",    value: "14 km/h",status: "inactive", battery: 0,  lastUpdateKey: "su2hrs" },
];

export const farmDetails = {
  name: "Green Valley Farm",
  owner: "Rajesh Kumar",
  location: "Coimbatore, Tamil Nadu",
  totalArea: "45 Acres",
  activeCrops: 4,
  established: "2018",
  soilType: "Red Loam",
  waterSource: "Borewell + Canal",
};

// fieldKey, cropKey, stageKey resolved via t[key] in pages
export const farmFields = [
  { id: 1, fieldKey: "fieldA", cropKey: "cropRice",      area: 12,  stageKey: "stageFlowering",    health: 88, irrigated: true  },
  { id: 2, fieldKey: "fieldB", cropKey: "cropWheat",     area: 10,  stageKey: "stageGermination",   health: 72, irrigated: false },
  { id: 3, fieldKey: "fieldC", cropKey: "cropSugarcane", area: 15,  stageKey: "stageMaturation",    health: 95, irrigated: true  },
  { id: 4, fieldKey: "fieldD", cropKey: "cropCotton",    area: 8,   stageKey: "stageBollFormation", health: 65, irrigated: false },
];

// name, season, duration, waterNeed, reason, expectedYield resolved via t[key]
export const cropRecommendations = [
  {
    id: 1,
    nameKey: "cropRice",
    confidence: 94,
    seasonKey: "seasonKharif",
    durationKey: "dur120_150",
    waterNeedKey: "waterHigh",
    reasonKey: "reasonRice",
    nutrients: { N: 90, P: 60, K: 40 },
    expectedYieldKey: "yield45",
    icon: "🌾",
    color: "#2e7d32",
  },
  {
    id: 2,
    nameKey: "cropSugarcane",
    confidence: 87,
    seasonKey: "seasonAnnual",
    durationKey: "dur10_12m",
    waterNeedKey: "waterHigh",
    reasonKey: "reasonSugarcane",
    nutrients: { N: 120, P: 60, K: 120 },
    expectedYieldKey: "yield35",
    icon: "🎋",
    color: "#1565c0",
  },
  {
    id: 3,
    nameKey: "cropCotton",
    confidence: 78,
    seasonKey: "seasonKharif",
    durationKey: "dur180_200",
    waterNeedKey: "waterMedium",
    reasonKey: "reasonCotton",
    nutrients: { N: 60, P: 30, K: 60 },
    expectedYieldKey: "yield18",
    icon: "🌿",
    color: "#6a1b9a",
  },
];

// fieldKey, durationKey, waterFlowKey resolved via t[key] in Irrigation page
export const irrigationData = {
  currentStatus: "Active",
  method: "Drip Irrigation",
  waterUsedToday: 1240,
  waterUsedWeek: 7800,
  efficiency: 87,
  soilMoistureTarget: 75,
  fields: [
    { fieldKey: "fieldA", status: "irrigating", durationKey: "irrDur1", waterFlowKey: "irrFlow" },
    { fieldKey: "fieldB", status: "scheduled",  durationKey: "irrDur2", waterFlowKey: null },
    { fieldKey: "fieldC", status: "completed",  durationKey: "irrDur3", waterFlowKey: null },
    { fieldKey: "fieldD", status: "off",        durationKey: null,      waterFlowKey: null },
  ],
  // alertKey resolved via t[key]
  alerts: [
    { type: "warning", msgKey: "irrAlert1" },
    { type: "info",    msgKey: "irrAlert2" },
    { type: "success", msgKey: "irrAlert3" },
  ],
};

// stat card labels/values resolved via t[key]
export const reportsData = {
  statsCards: [
    { labelKey: "rptTotalWater",   valueKey: "rptWaterVal",  change: "+5%",  trend: "up",   icon: "💧", isAlert: false },
    { labelKey: "rptAvgSoil",      valueKey: "rptSoilVal",   change: "+12%", trend: "up",   icon: "🌱", isAlert: false },
    { labelKey: "rptCropYield",    valueKey: "rptYieldVal",  change: "+8%",  trend: "up",   icon: "🌾", isAlert: false },
    { labelKey: "rptActiveAlerts", valueKey: null,            change: "-40%", trend: "down", icon: "⚠️", isAlert: true  },
  ],
  monthlySummary: [
    { monthKey: "mApr", waterUsed: 6200, avgTemp: 31, yield: 3.8, soilHealth: 75 },
    { monthKey: "mMay", waterUsed: 7100, avgTemp: 34, yield: 4.0, soilHealth: 78 },
    { monthKey: "mJun", waterUsed: 5800, avgTemp: 35, yield: 4.2, soilHealth: 80 },
  ],
};
