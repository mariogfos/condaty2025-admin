"use client";

import React, { useMemo } from "react";
import { useRouter } from "next/navigation";
import styles from "./Assemblies.module.css";
import NotAccess from "@/components/auth/NotAccess/NotAccess";
import useCrud, { ModCrudType } from "@/mk/hooks/useCrud/useCrud";
import { WidgetDashCard } from "@/components/Widgets/WidgetsDashboard/WidgetDashCard/WidgetDashCard";
import { StatusBadge } from "@/components/StatusBadge/StatusBadge";
import { IconCalendar } from "@/components/layout/icons/IconsBiblioteca";
import { getAssemblyConfig } from "./config/assemblies.config";
import { Assembly } from "./types/assemblies.types";

const paramsInitial = {
  fullType: "L",
  perPage: 20,
  page: 1,
  searchBy: "",
};

const Assemblies = () => {
  const router = useRouter();

  // Use refs to break circular dependency between config and useCrud
  const triggerReloadRef = React.useRef<any>(() => {});
  const onEditRef = React.useRef<any>(() => {});
  const onCloseViewRef = React.useRef<any>(() => {});

  const { mod, fields } = React.useMemo(
    () =>
      getAssemblyConfig(
        (...args: any[]) => triggerReloadRef.current(...args),
        (item: any) => onEditRef.current(item),
        () => onCloseViewRef.current(),
      ),
    [],
  );

  const { userCan, List, data, reLoad, onEdit, onCloseView } = useCrud({
    paramsInitial,
    mod,
    fields,
  });

  // Assign the real functions to the refs
  triggerReloadRef.current = reLoad;
  onEditRef.current = onEdit;
  onCloseViewRef.current = onCloseView;

  const handleRowClick = (item: Assembly) => {
    console.log("click en fila", item);
    router.push(`/assemblies/${item.id}`);
  };

  const metrics = data?.message || {};
  const total = metrics?.total ?? 0;
  const pending = metrics?.S ?? 0;
  const inProgress = metrics?.P ?? 0;
  const completed = metrics?.C ?? 0;
  const canceled = metrics?.X ?? 0;

  if (!userCan(mod.permiso, "R")) return <NotAccess />;

  return (
    <div className={styles.assemblies}>
      <h1 className={styles.title}>Asambleas</h1>

      <div className={styles.statsRow}>
        <WidgetDashCard
          title="Total"
          data={total}
          style={{ minWidth: "160px", maxWidth: "260px" }}
          icon={<IconCalendar color="var(--cInfo)" circle size={18} />}
        />
        <WidgetDashCard
          title="Programadas"
          data={pending}
          color="#A78BFA"
          style={{ minWidth: "160px", maxWidth: "260px" }}
        />
        <WidgetDashCard
          title="En progreso"
          data={inProgress}
          color="#FFCF4A"
          style={{ minWidth: "160px", maxWidth: "260px" }}
        />
        <WidgetDashCard
          title="Finalizadas"
          data={completed}
          color="var(--cSuccess)"
          style={{ minWidth: "160px", maxWidth: "260px" }}
        />
        <WidgetDashCard
          title="Canceladas"
          data={canceled}
          color="var(--cError)"
          style={{ minWidth: "160px", maxWidth: "260px" }}
        />
      </div>

      <div className={styles.listContainer}>
        <List
          height={"calc(100vh - 420px)"}
          emptyMsg="Lista vacía. Cuando registres asambleas"
          emptyLine2="las verás aquí."
          emptyIcon={<IconCalendar size={80} color="var(--cWhiteV1)" />}
          onRowClick={handleRowClick}
        />
      </div>
    </div>
  );
};

export default Assemblies;
