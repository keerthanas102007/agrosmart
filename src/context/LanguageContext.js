import { createContext, useState, useEffect } from "react";

export const LanguageContext = createContext();

export const LanguageProvider = ({ children }) => {

  const [language, setLanguage] = useState(
    localStorage.getItem("language") || "en"
  );

  useEffect(() => {
    localStorage.setItem("language", language);
  }, [language]);

  const text = {

    en: {
      home: "Home",
      dashboard: "Dashboard",
      soil: "Soil",
      irrigation: "Irrigation",
      weather: "Weather",
      fertilizer: "Fertilizer",
      reports: "Reports",
      login: "Login",
      logout: "Logout",

      title: "Smart Agriculture Monitoring System",
      subtitle: "Real-time monitoring of crops, irrigation, weather and fertilizer.",

      soilHealth: "Soil Health",
      waterLevel: "Water Level",
      temperature: "Temperature",
      humidity: "Humidity",

      motorOn: "Motor ON",
      motorOff: "Motor OFF",
      waterUsed: "Water Used",

      fertilizerTitle: "Fertilizer Recommendation",
      selectCrop: "Select Crop",
      recommendation: "Recommendation",
      pleaseSelectCrop: "Please Select Crop",

      register: "Register",
      farmerRegistration: "Farmer Registration",
      farmerName: "Farmer Name",
      mobileNumber: "Mobile Number",
      village: "Village",
      password: "Password",

      adminDashboard: "Admin Dashboard",
      farmerDashboard: "Farmer Dashboard",

      totalFarmers: "Total Farmers",
      activeSensors: "Active Sensors",
      waterUsage: "Water Usage",

      myCrop: "My Crop",
      soilStatus: "Soil Status",
      waterAvailable: "Water Available",

      reportsTitle: "Reports",
      soilReport: "Soil Health Report",
      irrigationReport: "Irrigation Usage Report",
      weatherReport: "Weather History Report",
      fertilizerReport: "Fertilizer Usage Report"
    },

    ta: {
      home: "முகப்பு",
      dashboard: "டாஷ்போர்டு",
      soil: "மண்",
      irrigation: "நீர்ப்பாசனம்",
      weather: "வானிலை",
      fertilizer: "உரம்",
      reports: "அறிக்கைகள்",
      login: "உள்நுழை",
      logout: "வெளியேறு",

      title: "ஸ்மார்ட் விவசாய கண்காணிப்பு அமைப்பு",
      subtitle: "பயிர்கள், நீர்ப்பாசனம், வானிலை மற்றும் உரங்களை நேரடியாக கண்காணிக்கவும்.",

      soilHealth: "மண் ஆரோக்கியம்",
      waterLevel: "நீர் அளவு",
      temperature: "வெப்பநிலை",
      humidity: "ஈரப்பதம்",

      motorOn: "மோட்டார் இயங்குகிறது",
      motorOff: "மோட்டார் நிறுத்தப்பட்டுள்ளது",
      waterUsed: "பயன்படுத்திய நீர்",

      fertilizerTitle: "உர பரிந்துரை",
      selectCrop: "பயிரை தேர்வு செய்க",
      recommendation: "பரிந்துரை",
      pleaseSelectCrop: "பயிரை தேர்வு செய்க",

      register: "பதிவு",
      farmerRegistration: "விவசாயி பதிவு",
      farmerName: "விவசாயி பெயர்",
      mobileNumber: "மொபைல் எண்",
      village: "கிராமம்",
      password: "கடவுச்சொல்",

      adminDashboard: "நிர்வாகி டாஷ்போர்டு",
      farmerDashboard: "விவசாயி டாஷ்போர்டு",

      totalFarmers: "மொத்த விவசாயிகள்",
      activeSensors: "செயலில் உள்ள சென்சார்கள்",
      waterUsage: "நீர் பயன்பாடு",

      myCrop: "என் பயிர்",
      soilStatus: "மண் நிலை",
      waterAvailable: "கிடைக்கும் நீர்",

      reportsTitle: "அறிக்கைகள்",
      soilReport: "மண் ஆரோக்கிய அறிக்கை",
      irrigationReport: "நீர்ப்பாசன பயன்பாட்டு அறிக்கை",
      weatherReport: "வானிலை வரலாறு அறிக்கை",
      fertilizerReport: "உர பயன்பாட்டு அறிக்கை"
    },

    hi: {
      home: "होम",
      dashboard: "डैशबोर्ड",
      soil: "मिट्टी",
      irrigation: "सिंचाई",
      weather: "मौसम",
      fertilizer: "उर्वरक",
      reports: "रिपोर्ट",
      login: "लॉगिन",
      logout: "लॉगआउट",

      title: "स्मार्ट कृषि निगरानी प्रणाली",
      subtitle: "फसल, सिंचाई, मौसम और उर्वरक की निगरानी करें।",

      soilHealth: "मिट्टी स्वास्थ्य",
      waterLevel: "जल स्तर",
      temperature: "तापमान",
      humidity: "आर्द्रता",

      motorOn: "मोटर चालू",
      motorOff: "मोटर बंद",
      waterUsed: "पानी उपयोग",

      fertilizerTitle: "उर्वरक सुझाव",
      selectCrop: "फसल चुनें",
      recommendation: "सिफारिश",
      pleaseSelectCrop: "फसल चुनें",

      register: "पंजीकरण",
      farmerRegistration: "किसान पंजीकरण",
      farmerName: "किसान नाम",
      mobileNumber: "मोबाइल नंबर",
      village: "गांव",
      password: "पासवर्ड",

      adminDashboard: "एडमिन डैशबोर्ड",
      farmerDashboard: "किसान डैशबोर्ड",

      totalFarmers: "कुल किसान",
      activeSensors: "सक्रिय सेंसर",
      waterUsage: "पानी उपयोग",

      myCrop: "मेरी फसल",
      soilStatus: "मिट्टी स्थिति",
      waterAvailable: "उपलब्ध पानी",

      reportsTitle: "रिपोर्ट",
      soilReport: "मिट्टी स्वास्थ्य रिपोर्ट",
      irrigationReport: "सिंचाई उपयोग रिपोर्ट",
      weatherReport: "मौसम इतिहास रिपोर्ट",
      fertilizerReport: "उर्वरक उपयोग रिपोर्ट"
    }
  };

  return (
    <LanguageContext.Provider
      value={{
        language,
        setLanguage,
        text
      }}
    >
      {children}
    </LanguageContext.Provider>
  );
};