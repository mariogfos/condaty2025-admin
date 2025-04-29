"use client";
import React, { useState, useEffect } from "react";
import TabsButtons from "@/mk/components/ui/TabsButton/TabsButtons"; 
import styles from "./BudgetsTab.module.css"; 
import { useAuth } from "@/mk/contexts/AuthProvider"; 
import Budget from "./Budget";
import BudgetDir from "./BudgetDir/BudgetDir";


const ReservationsTabs = () => {
  const { setStore } = useAuth();
  // Estado para controlar la pestaña activa, 'ALL' o 'PENDING'
  const [activeTab, setActiveTab] = useState<'ALL' | 'DIR'>('DIR');


  return (
    <div className={styles.container || 'budgets-tabs-container'}>

      {/* Componente de Tabs */}
      <TabsButtons
        tabs={[
          { value: 'ALL', text: 'Presupuestos' }, // Pestaña para todas o no pendientes
          { value: 'DIR', text: 'Presupuestos Directorio' } // Pestaña para pendientes
        ]}
        sel={activeTab}
        setSel={setActiveTab} // Actualiza el estado al cambiar de pestaña
      />

      <div className={styles.tabContent || 'tab-content'} style={{marginTop: '20px'}}>
        {activeTab === 'ALL' && <Budget />}
        {activeTab === 'DIR' && <BudgetDir />}
      </div>
    </div>
  );
};

export default ReservationsTabs;