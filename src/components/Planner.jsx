/* src/pages/Planner.jsx */
import React, { useReducer, useEffect } from "react";
import { useCities } from "../contexts/CitiesContext";
import styles from "./Planner.module.css";

const initialState = {
  country: "",
  startDate: new Date(Date.now() + 86400000).toISOString().split("T")[0],
  interest: "",
  days: 3,
  planDays: null,
  locations: [],
  currentDayIndex: 0,
  approvedCities: [],
  allDone: false,
  loading: false,
  error: "",
  feedback: "",
};

function reducer(state, action) {
  switch (action.type) {
    case "SET_FIELD":
      return { ...state, [action.field]: action.value };
    case "FETCH_START":
      return { ...state, loading: true, error: "" };
    case "FETCH_ERROR":
      return { ...state, loading: false, error: action.error };
    case "FULL_PLAN":
      return {
        ...state,
        planDays: action.planDays,
        locations: action.locations,
        currentDayIndex: 0,
        approvedCities: [],
        allDone: false,
        loading: false,
      };
    case "PARTIAL_PLAN":
      return {
        ...state,
        planDays: {
          ...state.planDays,
          [action.day]: action.planDays[action.day],
        },
        locations: [
          ...state.locations.filter((l) => l.day !== action.day),
          action.location,
        ],
        loading: false,
      };
    case "CONFIRM_DAY": {
      const newApproved = [...state.approvedCities, action.city];
      const isLast =
        state.currentDayIndex === Object.keys(state.planDays).length - 1;
      return {
        ...state,
        approvedCities: newApproved,
        currentDayIndex: isLast
          ? state.currentDayIndex
          : state.currentDayIndex + 1,
        allDone: isLast,
        feedback: isLast ? state.feedback : "",
      };
    }
    default:
      return state;
  }
}

export default function Planner() {
  const { createCity, cities } = useCities();
  const [state, dispatch] = useReducer(reducer, initialState);
  const {
    country,
    startDate,
    interest,
    days,
    planDays,
    locations,
    currentDayIndex,
    approvedCities,
    allDone,
    loading,
    error,
    feedback,
  } = state;

  const dayKeys = planDays ? Object.keys(planDays) : [];

  const getDateForDay = (index) => {
    const d = new Date(startDate);
    d.setDate(d.getDate() + index);
    return d.toISOString().split("T")[0];
  };

  const fetchPlan = async (isRegeneration = false) => {
    dispatch({ type: "FETCH_START" });
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
      const structured = {};
      Object.entries(daysData).forEach(([day, acts]) => {
        structured[day] = {
          city: locs.find((l) => l.day === day)?.name || "",
          desc: acts.join(", "),
        };
      });

      if (isRegeneration && planDays) {
        const dayName = dayKeys[currentDayIndex];
        const location = locs.find((l) => l.day === dayName);
        dispatch({
          type: "PARTIAL_PLAN",
          day: dayName,
          planDays: structured,
          location,
        });
      } else {
        dispatch({ type: "FULL_PLAN", planDays: structured, locations: locs });
      }
    } catch (e) {
      dispatch({ type: "FETCH_ERROR", error: "生成计划失败: " + e.message });
    }
  };

  const handleStart = (e) => {
    e.preventDefault();
    fetchPlan(false);
  };
  const handleRegenerate = () => fetchPlan(true);
  const handleConfirm = () => {
    const dayName = dayKeys[currentDayIndex];
    const cityName = planDays[dayName].city;
    dispatch({ type: "CONFIRM_DAY", city: cityName });
  };

  useEffect(() => {
    if (allDone) {
      approvedCities.forEach((name, i) => {
        const loc = locations.find((l) => l.name === name);
        if (!cities.some((c) => c.cityName === name)) {
          createCity({
            cityName: name,
            country,
            emoji: loc?.emoji || "🏙️",
            position: loc ? { lat: loc.lat, lng: loc.lng } : { lat: 0, lng: 0 },
            date: getDateForDay(i),
            notes: `${name} on ${getDateForDay(i)}`,
            id: Date.now() + i,
          });
        }
      });
    }
  }, [allDone]);

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
        <div className={styles.rowInline}>
          <div className={styles.inputGroup}>
            <label>Country</label>
            <input
              value={country}
              onChange={(e) =>
                dispatch({
                  type: "SET_FIELD",
                  field: "country",
                  value: e.target.value,
                })
              }
              placeholder="e.g. Spain"
              required
            />
          </div>
          <div className={styles.inputGroup}>
            <label>Start Date</label>
            <input
              type="date"
              value={startDate}
              onChange={(e) =>
                dispatch({
                  type: "SET_FIELD",
                  field: "startDate",
                  value: e.target.value,
                })
              }
              required
            />
          </div>
        </div>
        <div className={styles.rowInline}>
          <div className={styles.inputGroup}>
            <label>Interest</label>
            <input
              value={interest}
              onChange={(e) =>
                dispatch({
                  type: "SET_FIELD",
                  field: "interest",
                  value: e.target.value,
                })
              }
              placeholder="e.g. Art, Food"
            />
          </div>
          <div className={styles.inputGroup}>
            <label>Days</label>
            <input
              type="number"
              value={days}
              onChange={(e) =>
                dispatch({
                  type: "SET_FIELD",
                  field: "days",
                  value: +e.target.value,
                })
              }
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

      {planDays && (
        <div className={styles.planArea}>
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
                onChange={(e) =>
                  dispatch({
                    type: "SET_FIELD",
                    field: "feedback",
                    value: e.target.value,
                  })
                }
              />
              <div className={styles.actions}>
                <button
                  onClick={handleRegenerate}
                  className={`${styles.btn} cta`}
                  disabled={loading}
                >
                  {loading ? "Regenerating..." : "Regenerate Day"}
                </button>
                <button onClick={handleConfirm} className={`${styles.btn} cta`}>
                  Confirm Day
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
