"use client";
import { useCallback, useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { FileText, Tags } from "lucide-react";
import styles from "./DebtsManager.module.css";
import { useAuth } from "@/mk/contexts/AuthProvider";
import DebtSummaryCard from "./DebtSummaryCard/DebtSummaryCard";
import TabsButtons from "@/mk/components/ui/TabsButton/TabsButtons";
import RenderView from "./RenderView/RenderView";
import NotAccess from "@/components/auth/NotAccess/NotAccess";
import { formatNumber } from "@/mk/utils/numbers";
import { getFullName } from "@/mk/utils/string";
import DataModal from "@/mk/components/ui/DataModal/DataModal";
import Select from "@/mk/components/forms/Select/Select";
import { encodeReportViewerState } from "@/modulos/Reports/reportViewerState";

import AllDebts from "./TabComponents/AllDebts/AllDebts";
import IndividualDebts from "./TabComponents/IndividualDebts/IndividualDebts";
import SharedDebts from "./TabComponents/SharedDebts/SharedDebts";
import Forgiveness from "./TabComponents/Forgiveness/Forgiveness";

const DebtsManager = () => {
  const router = useRouter();
  const [openView, setOpenView] = useState(false);
  const [viewItem, setViewItem] = useState({});
  const [activeTab, setActiveTab] = useState("all");
  const [activeSummaryCard, setActiveSummaryCard] = useState("por_cobrar");
  const [currentExtraData, setCurrentExtraData] = useState<any>(null);
  const [openAccountStatement, setOpenAccountStatement] = useState(false);
  const [selectedUnitId, setSelectedUnitId] = useState<string | number>("");
  const [accountStatementError, setAccountStatementError] = useState("");
  const { setStore, store, userCan, showToast } = useAuth();

  useEffect(() => {
    setStore({ ...store, title: "" });
  }, []);

  const handleExtraDataChange = useCallback((extraData: any) => {
    setCurrentExtraData((current: any) => ({
      ...(current || {}),
      ...(extraData || {}),
    }));
  }, []);

  const getSummaryData = () => {
    if (!currentExtraData) {
      return {
        por_cobrar: { amount: "Bs 0.00", count: "0 en total" },
        cobradas: { amount: "Bs 0.00", count: "0 en total" },
        en_mora: { amount: "Bs 0.00", count: "0 en total" },
      };
    }

    return {
      por_cobrar: {
        amount: `Bs ${formatNumber(currentExtraData.receivable || 0)}`,
        count: `${currentExtraData.totalReceivable || 0} en total`,
      },
      cobradas: {
        amount: `Bs ${formatNumber(currentExtraData.collected || 0)}`,
        count: `${currentExtraData.totalCollected || 0} en total`,
      },
      en_mora: {
        amount: `Bs ${formatNumber(currentExtraData.arrears || 0)}`,
        count: `${currentExtraData.totalArrears || 0} en total`,
      },
    };
  };

  const summaryData = getSummaryData();

  const tabs = [
    { value: "all", text: "Deudas" },
    { value: "individual", text: "Individuales" },
    { value: "shared", text: "Compartidas" },
    { value: "forgiveness", text: "Condonaciones" },
    // { value: "payment_plans", text: "Planes de pago" },
  ];

  const goToCategories = () => {
    router.push("/categories?type=D");
  };

  const unitOptions = useMemo(() => {
    const units = Array.isArray(currentExtraData?.dptos)
      ? currentExtraData.dptos
      : [];

    return units
      .map((unit: any) => {
        const holderName = getFullName(unit?.titular || {}).trim();
        const description = String(unit?.description || "").trim();
        const context = [description, holderName].filter(Boolean).join(" · ");

        return {
          id: unit?.id,
          name: `Unidad ${unit?.nro || unit?.id}${context ? ` — ${context}` : ""}`,
        };
      })
      .filter((unit: any) => unit.id !== null && unit.id !== undefined)
      .sort((left: any, right: any) =>
        String(left.name).localeCompare(String(right.name), "es", {
          numeric: true,
          sensitivity: "base",
        }),
      );
  }, [currentExtraData?.dptos]);

  const closeAccountStatement = useCallback(() => {
    setOpenAccountStatement(false);
    setSelectedUnitId("");
    setAccountStatementError("");
  }, []);

  const generateAccountStatement = useCallback(() => {
    if (!selectedUnitId) {
      setAccountStatementError("Selecciona una unidad.");
      return;
    }

    const today = new Date().toISOString().slice(0, 10);
    const yearStart = `${today.slice(0, 4)}-01-01`;
    const state = encodeReportViewerState({
      params: {
        dptoId: selectedUnitId,
        filterBy: `due_at:${yearStart},${today}`,
      },
    });
    const reportUrl = `/reports?preset=unit-account-statement&state=${state}`;
    const reportWindow = window.open(reportUrl, "_blank");

    if (!reportWindow) {
      showToast("El navegador bloqueó la apertura del reporte.", "error");
      return;
    }

    reportWindow.opener = null;
    closeAccountStatement();
  }, [closeAccountStatement, selectedUnitId, showToast]);

  const renderTabContent = () => {
    const commonProps = {
      openView,
      setOpenView,
      viewItem,
      setViewItem,
      onExtraDataChange: handleExtraDataChange,
    };

    switch (activeTab) {
      case "all":
        return <AllDebts {...commonProps} />;
      case "individual":
        return <IndividualDebts {...commonProps} />;
      case "shared":
        return <SharedDebts {...commonProps} />;
      case "payment_plans":
        return <div>Componente de Planes de Pago (por implementar)</div>;
      case "forgiveness":
        return <Forgiveness {...commonProps} />;
      default:
        return <AllDebts {...commonProps} />;
    }
  };
  if (!userCan("debts", "R")) {
    return <NotAccess />;
  }

  return (
    <div className={styles.container}>
      <div className={styles.summarySection}>
        <div className={styles.summaryHeader}>
          <h2 className={styles.summaryTitle}>Deudas</h2>
        </div>
        <div className={styles.summaryCards}>
          <DebtSummaryCard
            title="DEUDAS POR COBRAR"
            amount={summaryData.por_cobrar.amount}
            count={summaryData.por_cobrar.count}
            isActive={activeSummaryCard === "por_cobrar"}
          />
          <DebtSummaryCard
            title="DEUDAS COBRADAS"
            amount={summaryData.cobradas.amount}
            count={summaryData.cobradas.count}
            isActive={activeSummaryCard === "cobradas"}
          />
          <DebtSummaryCard
            title="DEUDAS EN MORA"
            amount={summaryData.en_mora.amount}
            count={summaryData.en_mora.count}
            isActive={activeSummaryCard === "en_mora"}
          />
        </div>

        <section className={styles.actionsCard} aria-label="Acciones de deudas">
          <h3 className={styles.actionsTitle}>Acciones</h3>
          <div className={styles.actionsList}>
            <button
              type="button"
              className={styles.actionItem}
              onClick={() => {
                setAccountStatementError("");
                setOpenAccountStatement(true);
              }}
              disabled={unitOptions.length === 0}
              title={
                unitOptions.length === 0
                  ? "Cargando unidades"
                  : "Generar estado de cuenta"
              }
            >
              <span className={styles.actionCircle}>
                <FileText size={22} strokeWidth={1.8} />
              </span>
              <span className={styles.actionLabel}>Estado de cuenta</span>
            </button>

            <button
              type="button"
              className={styles.actionItem}
              onClick={goToCategories}
            >
              <span className={styles.actionCircle}>
                <Tags size={22} strokeWidth={1.8} />
              </span>
              <span className={styles.actionLabel}>Categorías</span>
            </button>
          </div>
        </section>
      </div>

      <div className={styles.listSection}>
        <div className={styles.tabsSection}>
          <TabsButtons
            sel={activeTab}
            tabs={tabs}
            setSel={setActiveTab}
            variant="rounded"
          />
        </div>
        <div className={styles.tabContent}>{renderTabContent()}</div>
      </div>

      <RenderView
        open={openView}
        onClose={() => setOpenView(false)}
        item={viewItem}
        extraData={currentExtraData || {}}
        user={store?.user}
        onEdit={(item) => {
          setViewItem(item);
          setOpenView(false);
        }}
        onDel={(item) => {
          setViewItem(item);
          setOpenView(false);
        }}
      />

      <DataModal
        title="Estado de cuenta"
        open={openAccountStatement}
        onClose={closeAccountStatement}
        onSave={generateAccountStatement}
        buttonText="Generar reporte"
        buttonCancel="Cancelar"
        variant="mini"
        minWidth={520}
      >
        <div className={styles.accountStatementForm}>
          <Select
            name="account-statement-unit"
            label="Unidad"
            value={selectedUnitId}
            options={unitOptions}
            optionLabel="name"
            optionValue="id"
            filter
            required
            placeholder="Seleccionar unidad"
            error={
              accountStatementError
                ? { "account-statement-unit": accountStatementError }
                : false
            }
            onChange={(event: any) => {
              setSelectedUnitId(event.target.value);
              setAccountStatementError("");
            }}
          />
        </div>
      </DataModal>
    </div>
  );
};

export default DebtsManager;
