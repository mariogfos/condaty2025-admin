"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import styles from "./DebtsManager.module.css";
import { useAuth } from "@/mk/contexts/AuthProvider";
import DebtSummaryCard from "./DebtSummaryCard/DebtSummaryCard";
import TabsButtons from "@/mk/components/ui/TabsButton/TabsButtons";
import Button from "@/mk/components/forms/Button/Button";
import RenderView from "./RenderView/RenderView";
import NotAccess from "@/components/auth/NotAccess/NotAccess";
import { formatNumber } from "@/mk/utils/numbers";

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
  const { setStore, store } = useAuth();

  useEffect(() => {
    setStore({ ...store, title: "" });
  }, []);

  const handleExtraDataChange = (extraData: any) => {
    setCurrentExtraData(extraData);
  };

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
    { value: "payment_plans", text: "Planes de pago" },
  ];

  const goToCategories = () => {
    router.push("/categories?type=D");
  };

  const extraButtons = [
    <Button
      key="categories-button"
      onClick={goToCategories}
      className={styles.categoriesButton}
    >
      Categorías
    </Button>,
  ];

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
        return <Forgiveness />;
      default:
        return <AllDebts {...commonProps} />;
    }
  };

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
            onClick={() => setActiveSummaryCard("por_cobrar")}
          />
          <DebtSummaryCard
            title="DEUDAS COBRADAS"
            amount={summaryData.cobradas.amount}
            count={summaryData.cobradas.count}
            isActive={activeSummaryCard === "cobradas"}
            onClick={() => setActiveSummaryCard("cobradas")}
          />
          <DebtSummaryCard
            title="DEUDAS EN MORA"
            amount={summaryData.en_mora.amount}
            count={summaryData.en_mora.count}
            isActive={activeSummaryCard === "en_mora"}
            onClick={() => setActiveSummaryCard("en_mora")}
          />
        </div>
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

        {renderTabContent()}
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
    </div>
  );
};

export default DebtsManager;
