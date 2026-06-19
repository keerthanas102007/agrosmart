import { useEffect, useState } from "react";
import { useContext } from "react";
import { LanguageContext } from "../context/LanguageContext";

function SoilSensor() {
    const { language, text } =
useContext(LanguageContext);

  const [moisture, setMoisture] = useState(60);

  useEffect(() => {
    const interval = setInterval(() => {
      setMoisture(
        Math.floor(Math.random() * 40) + 50
      );
    }, 3000);

    return () => clearInterval(interval);
  }, []);

  return (
    <div className="card">
      <h3>🌱 Soil Moisture</h3>
      <h1>{moisture}%</h1>
    </div>
  );
}

export default SoilSensor;