import { Link } from "react-router-dom";
import { useCities } from "../contexts/CitiesContext";
import styles from "./CityItem.module.css";

const formatDate = (date) => {
  const d = new Date(date);
  if (!date || isNaN(d.getTime())) {
    return "";
  }
  return new Intl.DateTimeFormat("en", {
    day: "numeric",
    month: "long",
    year: "numeric",
  }).format(d);
};

function CityItem({ city }) {
  const { currentCity, deleteCity } = useCities();
  const { cityName, emoji, date, id, position } = city;
  const formattedDate = formatDate(date);

  function handleClick(e) {
    e.preventDefault();
    deleteCity(id);
  }

  return (
    <li>
      <Link
        className={`${styles.cityItem} ${
          currentCity && id === currentCity.id ? styles["cityItem--active"] : ""
        }`}
        to={`${id}?lat=${position.lat}&lng=${position.lng}`}
      >
        <span className={styles.emoji}>{emoji}</span>
        <h3 className={styles.name}>{cityName}</h3>
        {formattedDate && (
          <time className={styles.date} dateTime={date}>
            {`(${formattedDate})`}
          </time>
        )}
        <button
          className={styles.deleteBtn}
          onClick={handleClick}
          aria-label={`Delete ${cityName}`}
        >
          &times;
        </button>
      </Link>
    </li>
  );
}

export default CityItem;
