import React, { useEffect, useState } from "react";
import WeatherWeek from "./WeatherWeek";

export default function WeatherWeekWithToggle(props) {
  const [unit, setUnit] = useState("metric");
  useEffect(() => {
    const h = (e) => setUnit(e.detail);
    window.addEventListener("setUnit", h);
    return () => window.removeEventListener("setUnit", h);
  }, []);
  return <WeatherWeek {...props} unit={unit} />;
}
