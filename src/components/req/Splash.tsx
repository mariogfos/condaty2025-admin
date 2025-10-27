import { IconLogo } from "../layout/icons/IconsBiblioteca";
import styles from "./splash.module.css";

const Splash = () => {
  return (
    <div className={styles.absPage}>
      <div className={styles.flexCenter}>
        <IconLogo className={styles.logo} size={156} />
        <div className={styles.spinDot}>.</div>
        <div className={styles.text}>
         <span className={styles.bold}>Tecnología,</span> que une{" "}
          <span className={styles.bold}>vecinos</span>
        </div>
      </div>
    </div>
  );
};

export default Splash;