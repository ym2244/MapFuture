/* src/pages/Planner.jsx */
import React, { useState } from "react";
import { useCities } from "../contexts/CitiesContext";
import styles from "./Planner.module.css";

export default function Planner() {
  const { createCity } = useCities();
  const [country, setCountry] = useState("");
  const [interest, setInterest] = useState("");
  const [days, setDays] = useState(3);
  const [startDate, setStartDate] = useState("");

  const [planDays, setPlanDays] = useState(null);
  const [currentDayIndex, setCurrentDayIndex] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [feedback, setFeedback] = useState("");

  const dayKeys = planDays ? Object.keys(planDays) : [];

  // Helper: generate country flag emoji from country name
  const countryFlagEmoji = (name) => {
    if (!name) return "🏙️";
    // Use first two letters of country to form ISO-like code
    const code = name.trim().slice(0, 2).toUpperCase().replace(/[^A-Z]/g, '');
    if (code.length < 2) return "🏙️";
    return code
      .split('')
      .map(c => String.fromCodePoint(0x1F1E6 + c.charCodeAt(0) - 65))
      .join('');
  };

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
      const daysRes = await fetch("http://localhost:9001/days");
      const locRes = await fetch("http://localhost:9001/locations");
      const daysData = await daysRes.json();
      const locs = await locRes.json();

      const structured = {};
      Object.entries(daysData).forEach(([day, acts]) => {
        const cityName = locs.find(l => l.day === day)?.name || "";
        structured[day] = { city: cityName, desc: acts.join(", ") };
      });
      setPlanDays(structured);
      setCurrentDayIndex(0);

      Object.entries(structured).forEach(([day, d], i) => {
        const loc = locs.find(l => l.name === d.city);
        createCity({
          cityName: d.city,
          country: country || "",
          emoji: countryFlagEmoji(country),
          position: loc ? { lat: loc.lat, lng: loc.lng } : { lat: 0, lng: 0 },
          notes: `${day} - ${country}`,
          date: getDateForDay(i)
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
        {/* First row: Interest + Days */}
        <div className={styles.rowInline}>
          <div className={styles.inputGroup}>
            <label>Interest</label>
            <input
              value={interest}
              onChange={e => setInterest(e.target.value)}
              placeholder="e.g. Art"
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
        {/* Second row: Country + Start Date */}
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
        <button type="submit" className={`${styles.btn} cta`} disabled={loading}>
          {loading ? "Loading..." : "Generate Full Plan"}
        </button>
        {error && <p className={styles.error}>{error}</p>}
      </form>

      <div className={styles.planArea}>
        {!planDays && <div className={styles.placeholder}>Your plan will show here.</div>}
        {planDays && (
          <div className={styles.planContainer}>
            <div className={styles.planDay}>
              <h3>{`${dayKeys[currentDayIndex]} - ${getDateForDay(currentDayIndex)}`}</h3>
              <ul className={styles.planList}>
                <li><span className={styles.planLabel}>Country:</span> {country}</li>
                <li><span className={styles.planLabel}>City:</span> {planDays[dayKeys[currentDayIndex]].city}</li>
                <li><span className={styles.planLabel}>Details:</span> {planDays[dayKeys[currentDayIndex]].desc}</li>
              </ul>
              <textarea
                className={styles.feedback}
                placeholder="Adjust plan..."
                value={feedback}
                onChange={e => setFeedback(e.target.value)}
              />
              <div className={styles.actions}>
                {currentDayIndex < dayKeys.length - 1 ? (
                  <>
                    <button onClick={handleRegenerate} className={styles.secondary} disabled={loading}>
                      {loading ? "Regenerate..." : "Regenerate"}
                    </button>
                    <button onClick={handleConfirm} className={`cta ${styles.btn}`}>Confirm</button>
                  </>
                ) : <p className={styles.complete}>🎉 Done!</p>}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
