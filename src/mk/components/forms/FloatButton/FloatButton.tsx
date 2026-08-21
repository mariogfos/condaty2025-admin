import { IconAdd } from "@/components/layout/icons/IconsBiblioteca";
import styles from "./FloatButton.module.css";

type PropsType = {
  onClick?: Function;
};
const FloatButton = ({ onClick }: PropsType) => {
  return (
    <div className={styles.addButton}>
      <IconAdd onClick={onClick} size={40} />
    </div>
  );
};

export default FloatButton;
