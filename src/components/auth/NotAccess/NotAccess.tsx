import { IconAlert } from "@/components/layout/icons/IconsBiblioteca";
import styles from "./notAccess.module.css";
import { useScopedI18n } from "@/i18n/useScopedI18n";

const NotAccess = () => {
  const { translate } = useScopedI18n("auth");

  return (
    <div className={styles.notAccess} data-i18n-ignore="true">
      {translate("noModuleAccess")}
      <div>
        <IconAlert size={80} color="orange" />
      </div>
    </div>
  );
};

export default NotAccess;
