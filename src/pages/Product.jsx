import PageNav from "../components/PageNav";
import styles from "./Product.module.css";

export default function Product() {
  return (
    <main className={styles.product}>
      <PageNav />

      <section>
        <img
          src="img-1.jpg"
          alt="person with dog overlooking mountain with sunset"
        />
        <div>
          <h2>About MapFuture.</h2>
          <p>
            Travel should be about the experience, not the logistics. We built
            our platform on a lightning-fast mapping engine and a curated global
            database of points of interest.
          </p>
          <p>
            So, spend less time plotting and more time exploring. Mapfuture will
            help you discover the best routes and hidden gems along the way.
          </p>
        </div>
      </section>
    </main>
  );
}
