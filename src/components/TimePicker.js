import { useApp } from "../context/AppContext";

/**
 * TimePicker — 12-hour format with translated AM/PM
 * Props: value ("HH:MM" 24h string), onChange(newVal)
 */
export default function TimePicker({ value, onChange }) {
  const { t } = useApp();
  const [hh, mm] = (value || "06:00").split(":").map(Number);
  const isPM     = hh >= 12;
  const display12 = hh % 12 === 0 ? 12 : hh % 12;
  const hours12  = Array.from({ length: 12 }, (_, i) => i + 1);
  const minutes  = ["00", "15", "30", "45"];

  const handleHour = (h12) => {
    const h24 = isPM ? (parseInt(h12) % 12) + 12 : parseInt(h12) % 12;
    onChange && onChange(`${String(h24).padStart(2,"0")}:${String(mm).padStart(2,"0")}`);
  };
  const handleMinute = (min) => {
    onChange && onChange(`${String(hh).padStart(2,"0")}:${min}`);
  };
  const handleAmPm = (ampm) => {
    const newIsPM = ampm === "PM";
    const h24 = newIsPM ? (hh % 12) + 12 : hh % 12;
    onChange && onChange(`${String(h24).padStart(2,"0")}:${String(mm).padStart(2,"0")}`);
  };

  return (
    <div style={{ display:"flex", gap:3, alignItems:"center", flexWrap:"wrap" }}>
      <select
        className="form-input"
        style={{ width:54, padding:"6px 2px", fontSize:13, textAlign:"center" }}
        value={display12}
        onChange={e => handleHour(e.target.value)}
      >
        {hours12.map(h => (
          <option key={h} value={h}>{String(h).padStart(2,"0")}</option>
        ))}
      </select>
      <span style={{ fontWeight:700, color:"var(--text-muted)", fontSize:15 }}>:</span>
      <select
        className="form-input"
        style={{ width:54, padding:"6px 2px", fontSize:13, textAlign:"center" }}
        value={String(mm).padStart(2,"0")}
        onChange={e => handleMinute(e.target.value)}
      >
        {minutes.map(mn => <option key={mn} value={mn}>{mn}</option>)}
      </select>
      <select
        className="form-input"
        style={{ width:70, padding:"6px 4px", fontSize:12, fontWeight:600 }}
        value={isPM ? "PM" : "AM"}
        onChange={e => handleAmPm(e.target.value)}
      >
        <option value="AM">{t.timeAM || "AM"}</option>
        <option value="PM">{t.timePM || "PM"}</option>
      </select>
    </div>
  );
}
