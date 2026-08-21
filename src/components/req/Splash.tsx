"use client";

import { IconLogo } from "../layout/icons/IconsBiblioteca";
import { useScopedI18n } from "@/i18n/useScopedI18n";
import styles from "./splash.module.css";

const Splash = () => {
  const { translate } = useScopedI18n("splash");

  return (
    <div className={styles.absPage} data-i18n-ignore="true">
      <div className={styles.flexCenter}>
        <IconLogo className={styles.logo} size={156} />
        <div className={styles.spinDot}>.</div>
        <div className={styles.text}>
          <span className={styles.bold}>{translate("lead")}</span> {translate("middle")}{" "}
          <span className={styles.bold}>{translate("tail")}</span>
        </div>
      </div>
    </div>
  );
};

export default Splash;
