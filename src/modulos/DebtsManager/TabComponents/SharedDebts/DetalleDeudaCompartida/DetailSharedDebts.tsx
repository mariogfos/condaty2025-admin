"use client";
import React, { useMemo } from "react";
import { useRouter } from "next/navigation";
import useCrud, { ModCrudType } from "@/mk/hooks/useCrud/useCrud";
import {
  IconCategories,
  IconArrowLeft,
} from "@/components/layout/icons/IconsBiblioteca";
import FormatBsAlign from "@/mk/utils/FormatBsAlign";
import { StatusBadge } from "@/components/StatusBadge/StatusBadge";
import Button from "@/mk/components/forms/Button/Button";
import RenderView from "../../AllDebts/RenderView/RenderView";
import { useAuth } from "@/mk/contexts/AuthProvider";
import styles from "./DetailSharedDebts.module.css";
import { getDateStrMes } from "@/mk/utils/date";
import UnifiedCard from "../../../UnifiedCard/UnifiedCard";
import { hasMaintenanceValue, maintenanceAmountFor } from "@/mk/utils/utils";
import { DebtStatus, AmountType, DebtSegmentation } from "@/types/PaymentType";
import { DebtType } from "@/types/PaymentType";
import {
  getStatusText as getStatusTextConst,
  getStatusConfig as getStatusConfigConst,
  getAmountTypeText,
} from "../../constants";
import { lasTresTarjetasDelGrupo } from "./lasTresTarjetasDelGrupo";

interface DetailSharedDebtsProps {
  debtId: string;
  debtTitle?: string;
}

const DetailSharedDebts: React.FC<DetailSharedDebtsProps> = ({
  debtId,
  debtTitle = "Deuda Compartida",
}) => {
  const router = useRouter();
  const { user } = useAuth();

  /**
   * ⚠️ Las claves son el número de {@link DebtSegmentation} desde el
   * 2026-08-22: la columna era `char(255)` para guardar UNA letra.
   */
  const getSegmentationText = (segmentation: number | string | null | undefined) => {
    const segmentationMap: { [key in DebtSegmentation]: string } = {
      [DebtSegmentation.TODOS]: "Todas las unidades",
      [DebtSegmentation.OCUPADAS]: "Unidades ocupadas",
      [DebtSegmentation.DISPONIBLES]: "Unidades libres",
      [DebtSegmentation.LISTA]: "Seleccionar Unidades",
    };
    return (
      segmentationMap[Number(segmentation) as DebtSegmentation] ??
      String(segmentation ?? "-/-")
    );
  };

  const goToCategories = (type = "") => {
    if (type) {
      router.push(`/categories?type=${type}`);
    } else {
      router.push("/categories");
    }
  };

  const renderStatusCell = ({ item }: { item: any }) => {
    const rawStatus = Number(item?.status);
    const numericStatus = Number.isFinite(rawStatus) && rawStatus > 0 ? rawStatus : DebtStatus.PENDING;
    const dueAtString = item?.due_at;
    // getStatusConfig applies the overdue rule internally
    const statusText = getStatusTextConst(numericStatus);
    const { color, bgColor } = getStatusConfigConst(numericStatus, dueAtString);
    return (
      <StatusBadge color={color} backgroundColor={bgColor}>
        {statusText}
      </StatusBadge>
    );
  };

  const renderDueDateCell = ({ item }: { item: any }) => {
    if (!item?.due_at) return <div>-</div>;
    return getDateStrMes(item?.due_at) || "-/-";
  };

  const renderDebtAmountCell = ({ item }: { item: any }) => (
    <FormatBsAlign value={parseFloat(item?.amount) || 0} alignRight />
  );

  const renderPenaltyAmountCell = ({ item }: { item: any }) => (
    <FormatBsAlign value={parseFloat(item?.penalty_amount) || 0} alignRight />
  );

  const renderMaintenanceAmountCell = ({ item }: { item: any }) => (
    <FormatBsAlign
      value={parseFloat(item?.maintenance_amount) || 0}
      alignRight
    />
  );

  const renderBalanceDueCell = ({ item }: { item: any }) => {
    const debtAmount = parseFloat(item?.amount) || 0;
    const penaltyAmount = parseFloat(item?.penalty_amount) || 0;
    // Si el condominio tiene mantenimiento de valor, se muestra Y se suma.
    const totalBalance =
      debtAmount + penaltyAmount + maintenanceAmountFor(user, item);
    return <FormatBsAlign value={totalBalance} alignRight />;
  };

  const paramsInitial = {
    fullType: "L",
    page: 1,
    perPage: 20,
    debt_id: debtId,
    type: DebtType.SHARED,
  };

  const fields = useMemo(() => {
    return {
      id: { rules: [], api: "e" },
      /**
       * 🔴 Va en el `PUT` aunque no se vea ni se edite.
       *
       * `DebtDptoController::beforeUpdate` rutea por `type`: sin él,
       * `(int) null` es 0 —NORMAL— y entonces exige `begin_at`, `due_at`,
       * `subcategory_id`, `amount` y `dpto_id`, que esta pantalla no tiene.
       * El valor sale de la fila (`debt_dptos.type`); todas son SHARED porque
       * la lista se pide con `type: DebtType.SHARED`.
       *
       * Sin `form` a propósito: `useCrud` sólo dibuja los campos que lo
       * declaran, así que no ocupa una celda del grid del formulario.
       */
      type: { rules: [], api: "e" },
      obs: {
        rules: ["required"],
        api: "e",
        label: "Motivo del cambio",
        form: {
          type: "text",
          label: "Motivo del cambio",
        },
      },
      unit: {
        rules: [""],
        api: "",
        label: "Unidad",
        list: {
          onRender: ({ item }: { item: any }) => (
            <div>{item?.unit_number || item?.dpto?.nro}</div>
          ),
          order: 1,
        },
      },
      status: {
        rules: [""],
        api: "",
        label: (
          <span
            style={{ display: "block", textAlign: "center", width: "100%" }}
          >
            Estado
          </span>
        ),
        list: {
          onRender: renderStatusCell,
          order: 2,
        },
      },
      due_date: {
        rules: [""],
        api: "",
        label: "Vencimiento",
        list: {
          onRender: renderDueDateCell,
          order: 3,
        },
      },
      /**
       * El monto de ESTA unidad. El back congela `dpto_id`, `debt_id`,
       * `shared_id`, `year` y `month`, así que editar corrige la plata y nunca
       * muda la deuda de unidad ni de grupo.
       *
       * La multa NO se edita acá: `beforeUpdate` no la pide para SHARED (sí
       * para EXPENSE) y la aplica el proceso de mora.
       */
      amount: {
        rules: ["required", "number", "positive"],
        api: "e",
        label: (
          <label
            style={{ display: "block", textAlign: "right", width: "100%" }}
          >
            Deuda
          </label>
        ),
        list: {
          onRender: renderDebtAmountCell,
          order: 4,
          sumarize: true,
        },
        form: {
          type: "number",
          label: "Monto",
        },
      },
      penalty_amount: {
        rules: [""],
        api: "",
        label: (
          <label
            style={{ display: "block", textAlign: "right", width: "100%" }}
          >
            Multa
          </label>
        ),
        list: {
          onRender: renderPenaltyAmountCell,
          order: 5,
          sumarize: true,
        },
      },
      maintenance_amount: {
        rules: [""],
        api: "",
        label: (
          <label
            style={{ display: "block", textAlign: "right", width: "100%" }}
          >
            Mant. Valor
          </label>
        ),
        list: hasMaintenanceValue(user)
          ? {
              onRender: renderMaintenanceAmountCell,
              order: 6,
              sumarize: true,
            }
          : false,
      },
      balance_due: {
        rules: [""],
        api: "",
        label: (
          <label
            style={{ display: "block", textAlign: "right", width: "100%" }}
          >
            Saldo a cobrar
          </label>
        ),
        list: {
          onRender: renderBalanceDueCell,
          order: 6,
          sumarize: true,
        },
      },
    };
  }, []);

  const mod: ModCrudType = {
    // 🔴 2026-08-07: esta pantalla también estaba cruzada con la pestaña.
    //
    // El detalle muestra UNA FILA POR UNIDAD —`dpto.nro`, su estado, su multa—
    // y eso lo devuelve `v3/debt-dptos` filtrando por `shared_id`. Pedido a
    // `v3/debt-groups` volvían las filas AGRUPADAS: medido, **1 fila sin
    // `dpto`**, con lo cual la columna "Unidad" salía vacía. Peor: ese
    // endpoint ni siquiera mira el `debt_id`, así que con dos compartidas el
    // detalle de una mostraba las dos.
    //
    // Y el encabezado ("Categoría - Concepto") y la tarjeta de DISTRIBUCIÓN
    // leen `extraData.debt`, que arma `DebtDptoController` buscando por
    // `shared_id` — justo el que no se estaba llamando.
    modulo: "v3/debt-dptos",
    // Titula los modales de editar y eliminar ("Editar deuda de la unidad").
    singular: "deuda de la unidad",
    plural: "Detalles",
    // Motor nuevo (Fase 6): lo atiende `DetalleDeCompartidaExportConfig`.
    //
    // 🔴 Acá el `extraParams` mandaba la EXPENSA mientras la lista
    // pedía la COMPARTIDA: el PDF de esta pantalla era el resumen de expensas por
    // periodo. Otro reporte, no un reporte mal formateado.
    export: false,
    exportAsync: {
      type: "debt-dptos-compartida-detalle",
      format: "pdf",
      label: "Exportar",
      supportedFormats: ["pdf", "xlsx", "csv"],
      endpoint: "/v3/debt-dptos",
      extraParams: { type: DebtType.SHARED, debt_id: debtId },
    },
    filter: false,
    permiso: "expense",
    extraData: true,
    sumarize: false,
    // 🔴 CDT-50: esta pantalla tenía los botones "Editar" y "Eliminar" del
    // GRUPO —`PUT`/`DELETE /v3/debt-groups/{id}` con `DebtType.SHARED`—, que borraban
    // duro las N deudas de todas las unidades. El grupo ya no se edita ni se
    // borra (esos endpoints devuelven 404). Lo que se edita y se elimina es la
    // deuda de UNA unidad, con el lápiz y el tacho de su fila, que `useCrud`
    // manda a `PUT`/`DELETE /v3/debt-dptos/{id}`.
    //
    // Como en el detalle de expensas, no hay `onHideActions` que adivine si la
    // deuda tiene pagos: esa regla vive en `beforeUpdate`/`beforeDelete` y su
    // rechazo llega con el texto del back.
    hideActions: {
      add: true,
      view: false,
    },
    renderView: (props: any) => (
      <RenderView
        open={props.open}
        onClose={props.onClose}
        item={props.item}
        extraData={props.extraData}
        user={user}
        onEdit={props.onEdit}
        onDel={props.onDel}
        hideSharedDebtButton={true}
        hideEditAndDeleteButtons={true}
      />
    ),
  };

  const extraButtons = [
    <Button
      key="categories-button"
      variant="secondary"
      onClick={() => goToCategories("D")}
      style={{
        padding: "8px 16px",
        width: "auto",
        height: 48,
        display: "flex",
        alignItems: "center",
      }}
    >
      Categorías
    </Button>,
  ];

  const { List, extraData } = useCrud({
    paramsInitial,
    mod,
    fields,
    extraButtons,
  });

  // 🔴 La cuenta vive en `lasTresTarjetasDelGrupo`, con su test: acá adentro
  // hacía `totalReceivable - collected - arrears`, y `totalReceivable` nunca fue
  // el total del grupo. Con la mayoría ya pagada el conteo salía NEGATIVO.
  const summaryData = useMemo(() => lasTresTarjetasDelGrupo(extraData), [extraData]);

  const handleVolver = () => {
    router.back();
  };

  return (
    <>
      <div className={styles.container}>
        <div className={styles.header}>
          <button onClick={handleVolver} className={styles.backButton}>
            <IconArrowLeft size={20} />
            Volver
          </button>
          <h1 className={styles.title}>
            {extraData?.debt
              ? extraData.debt.subcategory?.name +
                  " - " +
                  extraData.debt.description || debtTitle
              : debtTitle}
          </h1>
        </div>

        <div className={styles.summarySection}>
          <div className={styles.summaryCards}>
            <UnifiedCard
              variant="detail"
              label="DISTRIBUCIÓN & ASIGNACIÓN"
              mainContent={getAmountTypeText(
                extraData?.debt?.amount_type ?? AmountType.FIJO,
              )}
              subtitle={getSegmentationText(
                extraData?.debt?.segmentation ?? DebtSegmentation.TODOS,
              )}
            />

            <UnifiedCard
              variant="detail"
              label="COBRADAS"
              mainContent={
                <FormatBsAlign value={summaryData.cobradas.amount} />
              }
              subtitle={`${summaryData.cobradas.count} En total`}
              total={summaryData.cobradas.total}
              current={summaryData.cobradas.count}
            />

            <UnifiedCard
              variant="detail"
              label="POR COBRAR"
              mainContent={
                <FormatBsAlign value={summaryData.porCobrar.amount} />
              }
              subtitle={`${summaryData.porCobrar.count} En total`}
              total={summaryData.porCobrar.total}
              current={summaryData.porCobrar.count}
            />

            <UnifiedCard
              variant="detail"
              label="EN MORA"
              mainContent={<FormatBsAlign value={summaryData.enMora.amount} />}
              subtitle={`${summaryData.enMora.count} En total`}
              total={summaryData.enMora.total}
              current={summaryData.enMora.count}
            />
          </div>
        </div>

        <div className={styles.listContainer}>
          <List
            height={"100%"}
            emptyMsg="No hay detalles de deuda compartida disponibles"
            emptyLine2="Los detalles aparecerán aquí cuando estén disponibles."
            emptyIcon={<IconCategories size={80} color="var(--cWhiteV1)" />}
            filterBreakPoint={2500}
            sumarize={false}
          />
        </div>
      </div>
    </>
  );
};

export default DetailSharedDebts;
