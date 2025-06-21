/* src/pages/Planner.jsx */
import React, { useState } from "react";
import { useCities } from "../contexts/CitiesContext";
import styles from "./Planner.module.css";

export default function Planner() {
  const { createCity } = useCities();
  const tomorrow = new Date(Date.now() + 86400000).toISOString().split('T')[0];
  const [country, setCountry] = useState("");
  const [startDate, setStartDate] = useState(tomorrow);
  const [interest, setInterest] = useState("");
  const [days, setDays] = useState(3);

  const [planDays, setPlanDays] = useState(null);
  const [currentDayIndex, setCurrentDayIndex] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [feedback, setFeedback] = useState("");

  const dayKeys = planDays ? Object.keys(planDays) : [];

  const getDateForDay = index => {
    if (!startDate) return "";
    const d = new Date(startDate);
    d.setDate(d.getDate() + index);
    return d.toISOString().split('T')[0];
  };

  async function fetchPlan() {
    setLoading(true);
    setError("");
    try {
      // Use GET to fetch from fake API
      const daysRes = await fetch("http://localhost:9001/days");
      const locRes = await fetch("http://localhost:9001/locations");
      if (!daysRes.ok) throw new Error("Failed to fetch days: " + daysRes.statusText);
      if (!locRes.ok) throw new Error("Failed to fetch locations: " + locRes.statusText);

      const daysData = await daysRes.json();
      const locs = await locRes.json();

      // Build planDays with city and combined details
      const structured = {};
      Object.entries(daysData).forEach(([day, acts]) => {
        const cityName = locs.find(l => l.day === day)?.name || "";
        structured[day] = {
          city: cityName,
          desc: acts.join(", ")
        };
      });
      setPlanDays(structured);
      setCurrentDayIndex(0);

      // Create city entries with date, notes, id
      Object.entries(structured).forEach(([day, d], i) => {
        const loc = locs.find(l => l.name === d.city);
        createCity({
          cityName: d.city,
          country,
          emoji: loc?.emoji || "🏙️",
          position: loc ? { lat: loc.lat, lng: loc.lng } : { lat: 0, lng: 0 },
          date: getDateForDay(i),
          notes: `${d.city} on ${getDateForDay(i)}`,
          id: Date.now() + i
        });
      });
    } catch (e) {
      setError("生成计划失败: " + e.message);
    } finally {
      setLoading(false);
    }
  }

  const handleStart = e => { e.preventDefault(); fetchPlan(); };
  const handleConfirm = () => { if (currentDayIndex < dayKeys.length - 1) setCurrentDayIndex(i => i + 1); };
  const handleRegenerate = () => fetchPlan();

  return (
    <div className={styles.planner}>
      <h2>🧭 Travel Planner</h2>
      <form className={styles.form} onSubmit={handleStart}>
        {/* First row: Country + Start Date */}
        <div className={styles.rowInline}>
          <div className={styles.inputGroup}>
            <label>Country</label>
            <input
              value={country}
              onChange={e => setCountry(e.target.value)}
              placeholder="e.g. Spain"
              required
            />
          </div>
          <div className={styles.inputGroup}>
            <label>Start Date</label>
            <input
              type="date"
              value={startDate}
              onChange={e => setStartDate(e.target.value)}
              required
            />
          </div>
        </div>
        {/* Second row: Interest + Days */}
        <div className={styles.rowInline}>
          <div className={styles.inputGroup}>
            <label>Interest</label>
            <input
              value={interest}
              onChange={e => setInterest(e.target.value)}
              placeholder="e.g. Art, Food"
            />
          </div>
          <div className={styles.inputGroup}>
            <label>Days</label>
            <input
              type="number"
              value={days}
              onChange={e => setDays(+e.target.value)}
              min={1}
            />
          </div>
        </div>
        <button type="submit" className={`${styles.btn} cta`} disabled={loading}>
          {loading ? "Loading..." : "Generate Full Plan"}
        </button>
        {error && <p className={styles.error}>{error}</p>}
      </form>

      <div className={styles.planArea}>
        {!planDays && (
          <div className={styles.placeholder}>Your travel plan will appear here once generated.</div>
        )}

        {planDays && (
          <div className={styles.planContainer}>
            <div className={styles.planDay}>
              <h3>{`${dayKeys[currentDayIndex]} - ${getDateForDay(currentDayIndex)}`}</h3>
              <ul className={styles.planList}>
                <li><span className={styles.planLabel}>City:</span> {planDays[dayKeys[currentDayIndex]].city}</li>
                <li><span className={styles.planLabel}>Details:</span> {planDays[dayKeys[currentDayIndex]].desc}</li>
              </ul>

              <textarea
                className={styles.feedback}
                placeholder="Tell AI adjustments, I'll regenerate..."
                value={feedback}
                onChange={e => setFeedback(e.target.value)}
              />

              <div className={styles.actions}>
                {currentDayIndex < dayKeys.length - 1 ? (
                  <>
                    <button onClick={handleRegenerate} className={styles.secondary} disabled={loading}>
                      {loading ? "Regenerating..." : "Regenerate Day"}
                    </button>
                    <button onClick={handleConfirm} className={`cta ${styles.btn}`}>Confirm Day</button>
                  </>
                ) : (
                  <p className={styles.complete}>🎉 All days confirmed!</p>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
