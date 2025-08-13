import React, { useEffect, useMemo, useState } from "react";
import { Line } from "react-chartjs-2";
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Tooltip,
  Filler,
} from "chart.js";
import {
  WiDaySunny,
  WiDayCloudy,
  WiCloud,
  WiCloudyGusts,
  WiRain,
  WiShowers,
  WiThunderstorm,
  WiSnow,
  WiFog,
  WiStrongWind,
  WiNightAltCloudyHigh,
} from "react-icons/wi";

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, Tooltip, Filler);

// --- Open-Meteo weathercode → icon + label ---
function weatherIconFor(code, isDay = true) {
  if ([0].includes(code)) return { Icon: WiDaySunny, label: "Clear" };
  if ([1, 2].includes(code)) return { Icon: isDay ? WiDayCloudy : WiNightAltCloudyHigh, label: "Partly cloudy" };
  if ([3].includes(code)) return { Icon: WiCloud, label: "Cloudy" };
  if ([45, 48].includes(code)) return { Icon: WiFog, label: "Fog" };
  if ([51, 53, 55].includes(code)) return { Icon: WiShowers, label: "Drizzle" };
  if ([61, 63, 65, 80, 81, 82].includes(code)) return { Icon: WiRain, label: "Rain" };
  if ([66, 67, 71, 73, 75, 77, 85, 86].includes(code)) return { Icon: WiSnow, label: "Snow" };
  if ([95, 96, 99].includes(code)) return { Icon: WiThunderstorm, label: "Thunder" };
  if ([56, 57].includes(code)) return { Icon: WiCloudyGusts, label: "Freezing drizzle" };
  return { Icon: WiStrongWind, label: "Windy" };
}

const dayShort = (iso) =>
  new Date(iso + "T00:00:00").toLocaleDateString(undefined, { weekday: "short" });

export default function WeatherWeek({
  unit = "metric", // "metric" | "imperial"
  timezone = "auto",
}) {
  const [lat, setLat] = useState(null);
  const [lon, setLon] = useState(null);
  const [locationName, setLocationName] = useState("");
  const [daily, setDaily] = useState(null);
  const [err, setErr] = useState("");

  // Fallback if geo fails/denied
  const FALLBACK = { lat: 24.8607, lon: 67.0011, name: "Karachi" };

  const tempParam =
    unit === "imperial" ? "&temperature_unit=fahrenheit" : "&temperature_unit=celsius";

  // 1) Get user's location (works on https or http://localhost)
  useEffect(() => {
    if (!navigator.geolocation) {
      setErr("Geolocation not supported");
      setLat(FALLBACK.lat);
      setLon(FALLBACK.lon);
      setLocationName(FALLBACK.name);
      return;
    }
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setLat(pos.coords.latitude);
        setLon(pos.coords.longitude);
      },
      () => {
        // Denied or error → fallback
        setLat(FALLBACK.lat);
        setLon(FALLBACK.lon);
        setLocationName(FALLBACK.name);
      },
      { enableHighAccuracy: true, timeout: 10000 }
    );
  }, []);

  // 2) Reverse geocode to get location name (CORS-friendly)
  useEffect(() => {
    if (!lat || !lon) return;

    // Skip reverse if already set by fallback
    if (locationName && locationName === FALLBACK.name) return;

    const url = `https://api.bigdatacloud.net/data/reverse-geocode-client?latitude=${lat}&longitude=${lon}&localityLanguage=en`;
    fetch(url)
      .then((res) => res.json())
      .then((d) => {
        const name =
          d.city || d.locality || d.principalSubdivision || d.countryName || "Your Location";
        setLocationName(name);
      })
      .catch(() => {
        // If reverse fails, still show something
        setLocationName("Your Location");
      });
  }, [lat, lon]);

  // 3) Fetch weather once lat/lon ready
  useEffect(() => {
    if (!lat || !lon) return;
    const controller = new AbortController();
    (async () => {
      try {
        const url =
          `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}` +
          `&daily=weathercode,temperature_2m_max,temperature_2m_min` +
          `&timezone=${timezone}${tempParam}`;
        const res = await fetch(url, { signal: controller.signal });
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const json = await res.json();
        const out = json?.daily;
        if (!out?.time) throw new Error("No daily data");
        setDaily({
          time: out.time,
          code: out.weathercode,
          tmax: out.temperature_2m_max,
          tmin: out.temperature_2m_min,
        });
      } catch (e) {
        if (e.name !== "AbortError") setErr(e.message || "Failed to load");
      }
    })();
    return () => controller.abort();
  }, [lat, lon, timezone, unit, tempParam]);

  const tiles = useMemo(() => {
    if (!daily) return [];
    return daily.time.map((t, i) => ({
      date: t,
      day: i === 0 ? "Today" : dayShort(t),
      code: daily.code[i],
      tmax: Math.round(daily.tmax[i]),
      tmin: Math.round(daily.tmin[i]),
    }));
  }, [daily]);

  const chartData = useMemo(() => {
    if (!daily) return null;
    return {
      labels: daily.time.map(dayShort),
      datasets: [
        { label: "High", data: daily.tmax, borderWidth: 2, fill: true, tension: 0.4 },
        { label: "Low", data: daily.tmin, borderWidth: 2, borderDash: [4, 3], fill: false, tension: 0.4 },
      ],
    };
  }, [daily]);

  const chartOptions = useMemo(
    () => ({
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: { display: false },
        tooltip: {
          mode: "index",
          intersect: false,
          callbacks: { label: (ctx) => `${ctx.dataset.label}: ${Math.round(ctx.parsed.y)}°` },
        },
      },
      interaction: { mode: "index", intersect: false },
      scales: {
        x: { grid: { display: false } },
        y: { grid: { drawTicks: false }, ticks: { callback: (v) => `${v}°` } },
      },
      elements: { point: { radius: 0 } },
    }),
    []
  );

  const deg = unit === "imperial" ? "°F" : "°C";

  if (err) return <div className="p-3">Error: {err}</div>;
  if (!lat || !lon) return <div className="p-3">Detecting location…</div>;
  if (!daily) return <div className="p-3">Loading forecast…</div>;

  return (
    <div className="p-3 rounded-4" style={cardBg}>
      {/* Header */}
      <div className="d-flex align-items-center justify-content-between mb-2">
        <div>
          <div className="fw-semibold" style={{ fontSize: 18 }}>
            {locationName || "Your Location"}
          </div>
          <div className="text-secondary" style={{ fontSize: 12 }}>
            7-day forecast
          </div>
        </div>
        {/* Optional: unit toggle example (lift state up if you want real toggling) */}
        {/* <div className="btn-group" role="group" aria-label="Units">
          <button className={`btn btn-sm ${unit === "metric" ? "btn-dark" : "btn-outline-secondary"}`}>°C</button>
          <button className={`btn btn-sm ${unit === "imperial" ? "btn-dark" : "btn-outline-secondary"}`}>°F</button>
        </div> */}
      </div>

      {/* Mobile tiles */}
      <div className="d-md-none overflow-auto pb-2" style={{ WebkitOverflowScrolling: "touch" }}>
        <div className="d-flex gap-2">
          {tiles.map((d, i) => {
            const { Icon, label } = weatherIconFor(d.code);
            return (
              <div
                key={d.date}
                className="flex-shrink-0 p-2 rounded-3 border"
                style={{
                  width: 120,
                  background: i === 0 ? "#111827" : "#fff",
                  color: i === 0 ? "#fff" : "#111827",
                  borderColor: i === 0 ? "transparent" : "#eee",
                  boxShadow: i === 0 ? "0 8px 20px rgba(0,0,0,.15)" : "0 1px 2px rgba(0,0,0,.06)",
                }}
              >
                <div className="text-center" style={{ fontSize: 12, opacity: 0.85 }}>{d.day}</div>
                <div className="d-grid place-items-center my-2" title={label}>
                  <Icon size={36} />
                </div>
                <div className="d-flex justify-content-center gap-2 align-items-baseline">
                  <span className="fw-semibold">{d.tmax}{deg}</span>
                  <span className="text-secondary">{d.tmin}{deg}</span>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Desktop grid */}
      <div className="d-none d-md-block">
        <div className="row row-cols-7 g-2">
          {tiles.map((d, i) => {
            const { Icon, label } = weatherIconFor(d.code);
            return (
              <div key={d.date} className="col">
                <div
                  className={`p-2 rounded-3 border text-center d-flex flex-column justify-content-center align-items-center h-100 ${i === 0 ? "text-white" : ""}`}
                  style={{
                    background: i === 0 ? "#111827" : "#fff",
                    color: i === 0 ? "#fff" : "#111827",
                    borderColor: i === 0 ? "transparent" : "#eee",
                    boxShadow: i === 0 ? "0 8px 20px rgba(0,0,0,.15)" : "0 1px 2px rgba(0,0,0,.06)",
                  }}
                >
                  <div style={{ fontSize: 12, opacity: 0.85 }}>{d.day}</div>
                  <div className="d-grid place-items-center my-2" title={label}>
                    <Icon size={40} />
                  </div>
                  <div className="d-flex justify-content-center gap-2 align-items-baseline">
                    <span className="fw-semibold">{d.tmax}{deg}</span>
                    <span className={i === 0 ? "opacity-75" : "text-secondary"}>{d.tmin}{deg}</span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Chart */}
      <div className="mt-3 p-2 rounded-3 border" style={{ background: "#fff", borderColor: "#eee" }}>
        <div className="text-secondary mb-2" style={{ fontSize: 12 }}>Highs & Lows</div>
        <div className="w-100" style={{ height: 180 }}>
          <Line data={chartData} options={chartOptions} />
        </div>
      </div>
    </div>
  );
}

const cardBg = {
  background: "linear-gradient(180deg, #ffffff 0%, #fafafa 100%)",
  boxShadow: "0 1px 3px rgba(0,0,0,.07), 0 10px 30px rgba(0,0,0,.06)",
};
