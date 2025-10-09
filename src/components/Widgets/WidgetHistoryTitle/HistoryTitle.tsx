import { useState } from "react";
import styles from "./HistoryTitle.module.css";
import { useAuth } from "@/mk/contexts/AuthProvider";

const HistoryTitle = ({ histTitulos, onBack, param }: any) => {
  const [params, setParams] = useState(param);
  const { user } = useAuth();
  return (
    <div className={styles["container"]}>
      <nav>
        <ol>
          {histTitulos?.map((title: any, index: number) => (
            <div
              key={index}
              onClick={() => {
                if (index === histTitulos.length - 1) return;
                onBack(index);
              }}
            >
              <li className={styles.breadcrumbItem}>
                {/* {index > 0 && ( */}
                {params[0]?.level > user?.role?.level && index > 0 && (
                  <span className={styles.breadcrumbSeparator}>&lt;</span>
                )}

                {/* )} */}
                <span className={styles.breadcrumbCurrent}>{title}</span>
              </li>
            </div>
          ))}
        </ol>
      </nav>
    </div>
  );
};

export default HistoryTitle;
