"use client";
import useCrud, { ModCrudType } from "@/mk/hooks/useCrud/useCrud";
import useAxios from "@/mk/hooks/useAxios";
import NotAccess from "@/components/auth/NotAccess/NotAccess";
import styles from "./ExpensesDetailsView.module.css";
import ItemList from "@/mk/components/ui/ItemList/ItemList";

import { useMemo, useState, useEffect } from "react";

import { getDateStrMes, MONTHS, MONTHS_S } from "@/mk/utils/date";
import { formatNumber } from "@/mk/utils/numbers";
import Check from "@/mk/components/forms/Check/Check";
import RenderItem from "@/modulos/shared/RenderItem";
import useCrudUtils from "@/modulos/shared/useCrudUtils";
import WidgetBase from "@/components/Widgets/WidgetBase/WidgetBase";
import {
  IconArrowLeft,
  IconBilletera,
  IconHandcoin,
  IconHome,
  IconMonedas,
  IconMultas,
  IconUnidades,
} from "@/components/layout/icons/IconsBiblioteca";
import {
  StatusDetailExpColor,
  sumExpenses,
  sumPenalty,
} from "@/mk/utils/utils";
import RenderView from "./RenderView/RenderView";
import LoadingScreen from "@/mk/components/ui/LoadingScreen/LoadingScreen";
import { WidgetDashCard } from "@/components/Widgets/WidgetsDashboard/WidgetDashCard/WidgetDashCard";

const getStatus = (status: string) => {
  let _status;
  if (status == "A") _status = "Por cobrar";
  //if (status == "E") _status = "En espera";
  if (status == "P") _status = "Cobrado";
  if (status == "S") _status = "Revisar pago";
  if (status == "M") _status = "En mora";
  //if (status == "R") _status = "Rechazado";
  return _status;
};

const ExpensesDetails = ({ data, setOpenDetail }: any) => {
  // Estado para estadísticas
  const [statsData, setStatsData] = useState({
    totalUnits: 0,
    paidUnits: 0,
    overdueUnits: 0,
    totalAmount: 0,
    paidAmount: 0,
    penaltyAmount: 0,
    pendingAmount: 0,
  });
  // Helper function to determine the display status of an item
  const getDisplayStatus = (item: any) => {
    const today = new Date();
    today.setHours(0, 0, 0, 0); // Normaliza la fecha de hoy a medianoche para una comparación precisa de solo fecha

    // Si el estado es 'A' (Por cobrar) y tiene una fecha de vencimiento en 'debt'
    if (item.status === "A" && item.debt?.due_at) {
      const dueDate = new Date(item.debt.due_at); // Parsea 'YYYY-MM-DD' como fecha local a medianoche
      // No es necesario normalizar dueDate con setHours si ya es YYYY-MM-DD,
      // ya que new Date('YYYY-MM-DD') lo interpreta como medianoche.

      if (today > dueDate) {
        return { text: "En mora", code: "M" }; // Efectivamente está en mora por fecha
      }
    }

    // Lógica original para otros estados o si no está en mora por fecha
    switch (item.status) {
      case "A":
        return { text: "Por cobrar", code: "A" };
      case "E":
        return { text: "En espera", code: "E" };
      case "P":
        return { text: "Cobrado", code: "P" };
      case "S":
        return { text: "Revisar pago", code: "S" };
      case "M":
        return { text: "En mora", code: "M" }; // explícitamente en mora
      default:
        return { text: item.status || "Desconocido", code: item.status || "" };
    }
  };

  // Obtener datos de detalles de expensas directamente con useAxios
  const { data: expenseDetails } = useAxios("/debt-dptos", "GET", {
    perPage: -1,
    page: 1,
    fullType: "L",
    debt_id: data?.id,
  });

  // Actualizar estadísticas cuando se cargan los datos
  useEffect(() => {
    if (expenseDetails?.data && expenseDetails.data.length > 0) {
      const expensesData = expenseDetails.data;
      const today = new Date();
      today.setHours(0, 0, 0, 0); // Normaliza la fecha de hoy para la comparación

      let calculatedOverdueUnits = 0;
      expensesData.forEach((item: any) => {
        let isOverdue = false;
        if (item.status === "M") {
          // Ya está marcado como 'M'
          isOverdue = true;
        } else if (item.status === "A" && item.debt?.due_at) {
          const dueDate = new Date(item.debt.due_at);
          // dueDate se parsea como YYYY-MM-DD 00:00:00 en la zona horaria local
          if (today > dueDate) {
            isOverdue = true;
          }
        }
        if (isOverdue) {
          calculatedOverdueUnits++;
        }
      });

      // Calcular estadísticas
      const totalUnits = expensesData.length;
      const paidUnits = expensesData.filter(
        (item: any) => item.status === "P"
      ).length;

      const totalAmount = expensesData.reduce(
        (sum: number, item: any) => sum + parseFloat(item.amount || 0),
        0
      );
      const paidAmount = expensesData
        .filter((item: any) => item.status === "P")
        .reduce(
          (sum: number, item: any) => sum + parseFloat(item.amount || 0),
          0
        );
      const penaltyAmount = expensesData.reduce(
        (sum: number, item: any) => sum + parseFloat(item.penalty_amount || 0),
        0
      );
      const pendingAmount = totalAmount - paidAmount;

      setStatsData({
        totalUnits,
        paidUnits,
        overdueUnits: calculatedOverdueUnits,
        totalAmount,
        paidAmount,
        penaltyAmount,
        pendingAmount,
      });
    }
  }, [expenseDetails]);

  const mod: ModCrudType = {
    modulo: "debt-dptos",
    singular: "Expensa",
    plural: "Expensas",
    filter: true,
    export: true,
    hideActions: {
      add: true,
      // edit: data?.status !== "A",
      // del: data?.status !== "A",
      edit: true,
      del: true,
    },
    renderView: (props: {
      open: boolean;
      onClose: any;
      item: Record<string, any>;
      onConfirm?: Function;
    }) => <RenderView {...props} />,
    permiso: "",
    // extraData: true,
  };

  const paramsInitial = {
    perPage: -1,
    page: 1,
    fullType: "L",
    debt_id: data.id,
  };

  const fields = useMemo(() => {
    return {
      id: { rules: [], api: "e" },
      unit: {
        rules: [""],
        api: "",
        label: "Unidad",
        list: {
          onRender: (props: any) => {
            return <div>{props?.item?.dpto?.nro}</div>;
          },
        },
      },
      address: {
        rules: [""],
        api: "",
        label: "Dirección",
        list: {
          onRender: (props: any) => {
            return <div>{props?.item?.dpto?.description}</div>;
          },
        },
      },
      paid_at: {
        rules: [""],
        api: "",
        label: "Fecha de pago",
        list: {
          onRender: (props: any) => {
            return (
              <div>{getDateStrMes(props?.item?.paid_at) || "En espera"}</div>
            );
          },
        },
      },
      due_at: {
        rules: [""],
        api: "",
        label: "Fecha de plazo",
        list: {
          onRender: (props: any) => {
            return <div>{getDateStrMes(props?.item?.debt?.due_at)}</div>;
          },
        },
      },
      amount: {
        rules: ["required"],
        api: "e",
        label: "Monto de expensa",
        list: {
          onRender: (props: any) => {
            return <div>Bs {formatNumber(props?.item?.amount)}</div>;
          },
        },
        form: {
          type: "text",
          label: "Monto",
        },
      },
      obs: {
        rules: ["required"],
        api: "e",
        label: "Motivo del cambio",
        form: {
          type: "text",
          label: "Motivo del cambio",
        },
      },
      penalty_amount: {
        rules: [""],
        api: "",
        label: "Multa",
        list: {
          onRender: (props: any) => {
            return <div>Bs {formatNumber(props.item?.penalty_amount)}</div>;
          },
        },
      },
      status: {
        rules: [""],
        api: "",
        label: "Estado",
        list: {
          onRender: (props: any) => {
            // Utiliza la función getDisplayStatus que definimos antes
            const displayStatus = getDisplayStatus(props?.item);

            const statusClass = `${styles.statusBadge} ${
              styles[`status${displayStatus.code}`] // Usa el código de estado efectivo para el estilo
            }`;
            return (
              <div className={statusClass}>
                {displayStatus.text}{" "}
                {/* Muestra el texto del estado efectivo */}
              </div>
            );
          },
        },
        filter: {
          label: "Estado",
          width: "200px",
          options: () => {
            return [
              { id: "ALL", name: "Todos" },
              { id: "A", name: "Por cobrar" },
              { id: "E", name: "En espera" },
              { id: "P", name: "Cobrado" },
              { id: "S", name: "Revisar pago" },
              { id: "M", name: "En mora" },
              //{ id: "R", name: "Rechazado" },
            ];
          },
          optionLabel: "name",
        },
      },
    };
  }, []);

  const { userCan, List, setStore, onSearch, searchs, onEdit, onDel } = useCrud(
    {
      paramsInitial,
      mod,
      fields,
    }
  );

  const { onLongPress, selItem } = useCrudUtils({
    onSearch,
    searchs,
    setStore,
    mod,
    onEdit,
    onDel,
  });

  const renderItem = (
    item: Record<string, any>,
    i: number,
    onClick: Function
  ) => {
    return (
      <RenderItem item={item} onClick={onClick} onLongPress={onLongPress}>
        <ItemList
          title={item?.name}
          subtitle={item?.description}
          variant="V1"
          active={selItem && selItem.id == item.id}
        />
      </RenderItem>
    );
  };

  if (!userCan(mod.permiso, "R")) return <NotAccess />;

  return (
    <div className={styles.ExpensesDetailsView}>
      <div className={styles.backButton} onClick={() => setOpenDetail(false)}>
        <IconArrowLeft />
        <p>Volver a sección expensas</p>
      </div>

      <LoadingScreen>
        <div className={styles.dashboardContainer}>
          <h1 className={styles.dashboardTitle}>
            Expensas de {MONTHS[data?.month]} {data?.year}
          </h1>
          {/* CONTENEDOR ÚNICO PARA TODAS LAS TARJETAS */}
          <div className={styles.allStatsRow}>
            {/* Tarjeta 1 (antes en grupo izquierdo) */}
            <WidgetDashCard
              data={statsData.totalUnits}
              title="Unidades asignadas"
              icon={
                <div className={styles.statIconContainer}>
                  <IconUnidades color="var(--cWhite)" />
                </div>
              }
            />
            {/* Tarjeta 2 (antes en grupo izquierdo) */}
            <WidgetDashCard
              data={statsData.paidUnits}
              title="Unidades al día"
              icon={
                <div
                  className={`${styles.statIconContainer} ${styles.iconPaid}`}
                >
                  <IconUnidades color="var(--cSuccess)" />
                </div>
              }
            />
            {/* Tarjeta 3 (antes en grupo izquierdo) */}
            <WidgetDashCard
              data={statsData.overdueUnits}
              title="Unidades morosas"
              icon={
                <div
                  className={`${styles.statIconContainer} ${styles.iconOverdue}`}
                >
                  <IconUnidades color="var(--cError)" />
                </div>
              }
            />
            {/* Tarjeta 4 (antes en grupo derecho) */}

            <WidgetDashCard
              data={"Bs " + formatNumber(statsData.totalAmount)}
              title="Monto total de expensa"
              icon={
                <div className={styles.statIconContainer}>
                  <IconMonedas color="var(--cInfo)" />
                </div>
              }
            />
            {/* Tarjeta 5 (antes en grupo derecho) */}

            <WidgetDashCard
              data={"Bs " + formatNumber(statsData.paidAmount)}
              title="Monto cobrado"
              icon={
                <div
                  className={`${styles.statIconContainer} ${styles.iconPaid}`}
                >
                  <IconBilletera color="var(--cSuccess)" />
                </div>
              }
            />
            {/* Tarjeta 6 (antes en grupo derecho) */}

            <WidgetDashCard
              data={"Bs " + formatNumber(statsData.penaltyAmount)}
              title="Monto por multas"
              icon={
                <div
                  className={`${styles.statIconContainer} ${styles.iconPenalty}`}
                >
                  <IconMultas color="var(--cError)" />
                </div>
              }
            />
            {/* Tarjeta 7 (antes en grupo derecho) */}

            <WidgetDashCard
              data={"Bs " + formatNumber(statsData.pendingAmount)}
              title="Monto por cobrar"
              icon={
                <div
                  className={`${styles.statIconContainer} ${styles.iconOverdue}`}
                >
                  <IconHandcoin color="var(--cError)" />
                </div>
              }
            />
            {/* Fin de las tarjetas */}
          </div>{" "}
          {/* Fin .allStatsRow */}
        </div>{" "}
        {/* Fin .dashboardContainer */}
        <List onTabletRow={renderItem} />
      </LoadingScreen>
    </div>
  );
};

export default ExpensesDetails;
