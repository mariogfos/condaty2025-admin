import { IconLogo } from "../layout/icons/IconsBiblioteca";
import styles from "./splash.module.css";

const Splash = () => {
  return (
    <div className={styles.absPage}>
      <div className={styles.flexCenter}>
        <IconLogo className={styles.logo} size={156} />
        <div className={styles.spinDot}>.</div>
        <div className={styles.text}>
          Ahorra <span className={styles.bold}>tiempo,</span> Vive{" "}
          <span className={styles.bold}>tranquilo</span>
        </div>
      </div>
    </div>
  );
};

export default Splash;