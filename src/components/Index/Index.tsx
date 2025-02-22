import { useEffect, useState } from "react";
import useAxios from "@/mk/hooks/useAxios";
import { useAuth } from "@/mk/contexts/AuthProvider";
import NotAccess from "../auth/NotAccess/NotAccess";

import styles from "./index.module.css";

import { WidgetSkeleton } from "@/mk/components/ui/Skeleton/Skeleton";

const paramsInitial = {
  fullType: "L",
  searchBy: "",
};
const HomePage = () => {
  const { setStore, userCan } = useAuth();
  const { user } = useAuth();
  const [histParams, setHistParams] = useState<any[]>([]);
  const [params, setParams] = useState<any>(paramsInitial);

  useEffect(() => {
    setStore({
      title: "Inicio",
    });
  }, []);

  // const {
  //   data: dashboard,
  //   reLoad,
  //   loaded,
  // } = useAxios("/dashboard", "GET", {
  //   ...params,
  // });

  // useEffect(() => {
  //   reLoad(params);
  // }, [params]);

  // const onClick = (row: any) => {
  //   if (params?.level === 3) {
  //     return;
  //   }

  //   const item: any = dashboard?.data?.entidad.find(
  //     (d: any) => d.name == row?.name
  //   );

  //   setHistParams((prev) => [...prev, params]);
  //   setHistTitulos((prev) => [...prev, item?.name]);

  //   setItemSelected(item);
  //   setParams({
  //     ...params,
  //     searchBy: item?.id,
  //     level: (params?.level || 0) + 1,
  //     code: item?.name,
  //   });
  // };

  // const onBack = (index: number) => {
  //   // Recorta los parámetros e historial hasta el índice especificado
  //   const newHistParams = histParams.slice(0, index + 1);
  //   const newHistTitulos = histTitulos.slice(0, index + 1);

  //   // Actualiza los estados de historial
  //   setHistParams(newHistParams);
  //   setHistTitulos(newHistTitulos);

  //   if (index === 0) {
  //     // Si es el nivel inicial, establece los parámetros iniciales
  //     setParams(paramInitial);
  //     setHistParams([]);
  //     setHistTitulos(["Mapa de " + (user?.entidad?.name || "Uruguay")]);
  //   } else {
  //     // Obtiene el nivel anterior
  //     const item = newHistParams[index];

  //     console.log("item anterior: ", item);

  //     if (item) {
  //       setParams({
  //         ...item,
  //         // level: item?.level,
  //       });
  //       console.log("params: ", params);
  //     } else {
  //       // Si no hay datos en el historial, usa los parámetros iniciales
  //       console.log("entro aqui:");
  //       setParams(paramInitial);
  //     }
  //   }
  // };

  // useEffect(() => {
  //   if (!loaded) {
  //     window.scrollTo({ top: 0, behavior: "smooth" });
  //   }
  // }, [loaded]);

  if (!userCan("home", "R")) return <NotAccess />;
  // if (!loaded) return <WidgetSkeleton />;
  return <div className={styles.container}></div>;
};

export default HomePage;
