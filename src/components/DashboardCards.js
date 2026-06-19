import { useEffect, useState } from "react";
import { useContext } from "react";
import { LanguageContext } from "../context/LanguageContext";

function DashboardCards() {
    const { language, text } =
useContext(LanguageContext);

  const [data,setData] = useState({
    moisture:65,
    temp:30,
    humidity:70,
    water:80
  });

  useEffect(()=>{

    const interval=setInterval(()=>{

      setData({
        moisture:Math.floor(Math.random()*20)+60,
        temp:Math.floor(Math.random()*10)+28,
        humidity:Math.floor(Math.random()*20)+60,
        water:Math.floor(Math.random()*20)+75
      });

    },3000);

    return ()=>clearInterval(interval);

  },[]);

  return(

    <div className="cards">

      <div className="card">
        <h2>🌱 {text[language]?.soilHealth || "Soil Moisture"}</h2>
        <h1
  style={{
    color:
      data.moisture > 70
        ? "green"
        : "red"
  }}
>
  {data.moisture}%
</h1>
      </div>

      <div className="card">
        <h2>🌡 {text[language]?.temperature || "Temperature"}</h2>
        <h1>{data.temp}°C</h1>
      </div>

      <div className="card">
        <h2>💨 {text[language]?.humidity || "Humidity"}</h2>
        <h1>{data.humidity}%</h1>
      </div>

      <div className="card">
        <h2>💧 {text[language]?.waterLevel || "Water Tank"}</h2>
        <h1>{data.water}%</h1>
      </div>

    </div>
  );
}

export default DashboardCards;