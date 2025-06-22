/* src/pages/Planner.jsx */
import React, { useState } from "react";
import { useCities } from "../contexts/CitiesContext";
import styles from "./Planner.module.css";

export default function Planner() {
  const { createCity } = useCities();
  const tomorrow = new Date(Date.now() + 86400000).toISOString().split("T")[0];

  // form state
  const [country, setCountry] = useState("");
  const [startDate, setStartDate] = useState(tomorrow);
  const [interest, setInterest] = useState("");
  const [days, setDays] = useState(3);

  // plan state
  const [planDays, setPlanDays] = useState(null); // { Day 1: { city, desc }, ... }
  const [locations, setLocations] = useState([]); // raw locations array from API
  const [currentDayIndex, setCurrentDayIndex] = useState(0);
  const [approvedCities, setApprovedCities] = useState([]);
  const [allDone, setAllDone] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [feedback, setFeedback] = useState("");

  const dayKeys = planDays ? Object.keys(planDays) : [];

  // compute date for a given day index
  const getDateForDay = (index) => {
    const d = new Date(startDate);
    d.setDate(d.getDate() + index);
    return d.toISOString().split("T")[0];
  };

  // fetch plan from backend
  async function fetchPlan(isRegeneration = false) {
    setLoading(true);
    setError("");
    try {
      const payload = {
        country,
        interest,
        days,
        startDate,
        regenerate: isRegeneration ? currentDayIndex + 1 : 0,
        feedback,
        approvedCities,
      };
      const res = await fetch("http://127.0.0.1:8000/app/travel-plan", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      if (!res.ok) throw new Error(await res.text());

      const { days: daysData, locations: locs } = await res.json();

      // build structured planDays
      const structured = {};
      Object.entries(daysData).forEach(([day, acts]) => {
        const name = locs.find((l) => l.day === day)?.name || "";
        structured[day] = { city: name, desc: acts.join(", ") };
      });

      if (isRegeneration && planDays) {
        // partial update: only update current day
        const dayName = dayKeys[currentDayIndex];
        setPlanDays((prev) => ({ ...prev, [dayName]: structured[dayName] }));
        setLocations((prev) => {
          const filtered = prev.filter((l) => l.day !== dayName);
          return [...filtered, locs.find((l) => l.day === dayName)];
        });
      } else {
        // full generation
        setPlanDays(structured);
        setLocations(locs);
        setCurrentDayIndex(0);
        setApprovedCities([]);
        setAllDone(false);
      }
    } catch (e) {
      setError("生成计划失败: " + e.message);
    } finally {
      setLoading(false);
    }
  }

  // handle generate full plan
  const handleStart = (e) => {
    e.preventDefault();
    fetchPlan(false);
  };

  // handle confirm current day
  const handleConfirm = () => {
    const dayName = dayKeys[currentDayIndex];
    const cityName = planDays[dayName].city;
    const newApproved = [...approvedCities, cityName];
    setApprovedCities(newApproved);

    if (currentDayIndex === dayKeys.length - 1) {
      // last day confirmed
      setAllDone(true);
      // create all pins at once
      newApproved.forEach((name, i) => {
        const loc = locations.find((l) => l.name === name);
        createCity({
          cityName: name,
          country,
          emoji: loc?.emoji || "🏙️",
          position: loc ? { lat: loc.lat, lng: loc.lng } : { lat: 0, lng: 0 },
          date: getDateForDay(i),
          notes: `${name} on ${getDateForDay(i)}`,
          id: Date.now() + i,
        });
      });
    } else {
      // move to next day
      setCurrentDayIndex((i) => i + 1);
      setFeedback("");
    }
  };

  // handle regenerate only current day
  const handleRegenerate = () => {
    fetchPlan(true);
  };

  if (allDone) {
    return (
      <div className={styles.planner}>
        <h2>🎉 All days confirmed! You’re ready to go.</h2>
      </div>
    );
  }

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
              onChange={(e) => setCountry(e.target.value)}
              placeholder="e.g. Spain"
              required
            />
          </div>
          <div className={styles.inputGroup}>
            <label>Start Date</label>
            <input
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
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
              onChange={(e) => setInterest(e.target.value)}
              placeholder="e.g. Art, Food"
            />
          </div>
          <div className={styles.inputGroup}>
            <label>Days</label>
            <input
              type="number"
              value={days}
              onChange={(e) => setDays(+e.target.value)}
              min={1}
            />
          </div>
        </div>

        <button
          type="submit"
          className={`${styles.btn} cta`}
          disabled={loading}
        >
          {loading ? "Loading..." : "Generate Full Plan"}
        </button>
        {error && <p className={styles.error}>{error}</p>}
      </form>

      <div className={styles.planArea}>
        {!planDays ? (
          <div className={styles.placeholder}>
            Your travel plan will appear here once generated.
          </div>
        ) : (
          <div className={styles.planContainer}>
            <div className={styles.planDay}>
              <h3>{`${dayKeys[currentDayIndex]} - ${getDateForDay(
                currentDayIndex
              )}`}</h3>
              <ul className={styles.planList}>
                <li>
                  <span className={styles.planLabel}>City:</span>{" "}
                  {planDays[dayKeys[currentDayIndex]].city}
                </li>
                <li>
                  <span className={styles.planLabel}>Details:</span>{" "}
                  {planDays[dayKeys[currentDayIndex]].desc}
                </li>
              </ul>

              <textarea
                className={styles.feedback}
                placeholder="Tell AI adjustments, I'll regenerate..."
                value={feedback}
                onChange={(e) => setFeedback(e.target.value)}
              />

              <div className={styles.actions}>
                <button
                  onClick={handleRegenerate}
                  className={`${styles.btn} cta`}
                  disabled={loading}
                >
                  {loading ? "Regenerating..." : "Regenerate Day"}
                </button>
                <button onClick={handleConfirm} className={`cta ${styles.btn}`}>
                  Confirm Day
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
