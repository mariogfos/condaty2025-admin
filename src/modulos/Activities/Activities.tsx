// Activities.tsx - Componente principal // esto?
"use client";
import styles from "./Activities.module.css";
import AccessesTab from "./AccessTab/AccessTab";

const paramsInitialAccess = {
  fullType: "L",
  perPage: 20,
  page: 1,
  extraData: true,
};

const Activities = () => {
  return (
    <div className={styles.container1}>
      {/* Contenedor principal // esto? */}
      <AccessesTab paramsInitial={paramsInitialAccess} />
    </div>
  );
};

export default Activities;
