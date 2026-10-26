import styles from "./landing.module.css";
import TypingText from "./typing-text";

export default function Home() {
  return (
    <main className={styles.page}>
      <TypingText text="Transforming Transformatrix" />
      <footer className={styles.poweredBy}>Powered By Mendly</footer>
    </main>
  );
}
