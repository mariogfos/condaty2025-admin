import { useState } from "react";
import { IconArrowDown } from "../../../../components/layout/icons/IconsBiblioteca";
import styles from "./box.module.css";
import { Card } from "../Card/Card";

type PropsType = {
  children: any;
  title?: string;
  icon?: any;
  className?: string;
};
const Box = ({
  children,
  title = "",
  icon = null,
  className = "",
}: PropsType) => {
  const [close, setClose] = useState(false);
  return (
    <Card className={styles.box + " " + className}>
      <header>
        <h2>{title}</h2>
        <span>
          {icon || (
            <IconArrowDown
              onClick={() => setClose(!close)}
              className={close ? "rotate" : ""}
            />
          )}
        </span>
      </header>
      <section className={close ? styles.close : ""}>{children}</section>
    </Card>
  );
};

export default Box;
