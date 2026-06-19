import { useContext } from "react";
import { LanguageContext } from "../context/LanguageContext";

import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement
} from "chart.js";

import { Line } from "react-chartjs-2";

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement
);

function SensorChart() {
    const { language, text } =
useContext(LanguageContext);

  const data = {
    labels: [
      "Mon",
      "Tue",
      "Wed",
      "Thu",
      "Fri"
    ],

    datasets: [
      {
        label: "Soil Moisture",
        data: [60, 65, 70, 68, 75]
      }
    ]
  };

  return <Line data={data} />;
}

export default SensorChart;