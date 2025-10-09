import { IconAlert } from "@/components/layout/icons/IconsBiblioteca";
import styles from "./notAccess.module.css";

const NotAccess = () => {
  return (
    <div className={styles.notAccess}>
      No tiene Permisos para este Modulo
      <div>
        <IconAlert size={80} color="orange" />
      </div>
    </div>
  );
};

export default NotAccess;
