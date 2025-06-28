import React, { useReducer, useEffect } from "react";
import { useCities } from "../contexts/CitiesContext";
import styles from "./Planner.module.css";
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";
import Button from "./Button";

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
    case "planner/loading":
      return { ...state, loading: true, error: "" };

    case "planner/fieldSet":
      return { ...state, [action.field]: action.payload };

    case "planner/planLoaded":
      return {
        ...state,
        planDays: action.payload.planDays,
        locations: action.payload.locations,
        currentDayIndex: 0,
        approvedCities: [],
        allDone: false,
        loading: false,
      };

    case "planner/planPartial":
      return {
        ...state,
        planDays: {
          ...state.planDays,
          [action.payload.day]: action.payload.planDays[action.payload.day],
        },
        locations: [
          ...state.locations.filter((l) => l.day !== action.payload.day),
          action.payload.location,
        ],
        loading: false,
      };

    case "planner/dayConfirmed": {
      const newApproved = [...state.approvedCities, action.payload.city];
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

    case "planner/error":
      return { ...state, loading: false, error: action.payload };

    default:
      throw new Error("Unknown action type");
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
    dispatch({ type: "planner/loading" });
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
          type: "planner/planPartial",
          payload: { day: dayName, planDays: structured, location },
        });
      } else {
        dispatch({
          type: "planner/planLoaded",
          payload: { planDays: structured, locations: locs },
        });
      }
    } catch (e) {
      dispatch({
        type: "planner/error",
        payload: "Fail to generate plan: " + e.message,
      });
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
    dispatch({ type: "planner/dayConfirmed", payload: { city: cityName } });
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
            notes: `Day ${i + 1} on ${country}, planned by Planner AI`,
            id: Date.now() + i,
          });
        }
      });
    }
  }, [allDone]);

  if (allDone) {
    return (
      <div className={styles.planner}>
        <h2>🎉 All days confirmed! You're ready to go.</h2>
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
                  type: "planner/fieldSet",
                  field: "country",
                  payload: e.target.value,
                })
              }
              placeholder="e.g. Canada"
              required
            />
          </div>
          <div className={styles.inputGroup}>
            <label>Start Date</label>
            <DatePicker
              className={styles.input}
              selected={new Date(startDate)}
              onChange={(date) =>
                dispatch({
                  type: "planner/fieldSet",
                  field: "startDate",
                  payload: date.toISOString().split("T")[0],
                })
              }
              dateFormat="dd/MM/yyyy"
              minDate={new Date()}
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
                  type: "planner/fieldSet",
                  field: "interest",
                  payload: e.target.value,
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
                  type: "planner/fieldSet",
                  field: "days",
                  payload: +e.target.value,
                })
              }
              min={1}
            />
          </div>
        </div>
        <Button type="primary">{loading ? "Loading..." : "Generate"}</Button>

        {error && <p className={styles.error}>{error}</p>}
      </form>

      {planDays && (
        <div className={styles.planArea}>
          <div
            className={`${styles.planContainer} ${
              loading ? styles.loading : ""
            }`}
          >
            <div className={styles.planDay}>
              <h3>{`${dayKeys[currentDayIndex]} : ${getDateForDay(
                currentDayIndex - 1
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
                placeholder="Tell AI adjustments, It will regenerate accordingly."
                value={feedback}
                onChange={(e) =>
                  dispatch({
                    type: "planner/fieldSet",
                    field: "feedback",
                    payload: e.target.value,
                  })
                }
              />
              <div className={styles.actions}>
                <Button
                  type="back"
                  onClick={handleRegenerate}
                  disabled={loading}
                >
                  {loading ? "Regenerating..." : "Regenerate"}
                </Button>
                <Button
                  type="primary"
                  onClick={handleConfirm}
                  disabled={loading}
                >
                  Confirm
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
