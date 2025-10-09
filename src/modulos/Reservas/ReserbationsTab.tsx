"use client";
import React, { useState, useEffect } from "react";
import TabsButtons from "@/mk/components/ui/TabsButton/TabsButtons"; // Importa tu componente de Tabs
import Reserva from "./Reserva"; // Importa tu componente existente (ajusta la ruta)
 // Importa el NUEVO componente (ajusta la ruta)
import styles from "./ReservationsTab.module.css"; // Crea un archivo CSS simple si es necesario
import { useAuth } from "@/mk/contexts/AuthProvider"; // Para el título si lo necesitas
import ReservaPending from "./ReservaPending";

const ReservationsTabs = () => {
  const { setStore } = useAuth();
  // Estado para controlar la pestaña activa, 'ALL' o 'PENDING'
  const [activeTab, setActiveTab] = useState<'ALL' | 'PENDING'>('ALL');


  return (
    <div className={styles.container || 'reservations-tabs-container'}>
      {/* Puedes mantener un título general si quieres */}
      {/* <h1 className={styles.title || 'main-title'}>Reservas</h1> */}
      {/* <p className={styles.subtitle || 'main-subtitle'}>Gestiona las reservas del condominio</p> */}

      {/* Componente de Tabs */}
      <TabsButtons
        tabs={[
          { value: 'ALL', text: 'Reservas' }, // Pestaña para todas o no pendientes
          { value: 'PENDING', text: 'Reservas Pendientes' } // Pestaña para pendientes
        ]}
        sel={activeTab}
        setSel={setActiveTab} // Actualiza el estado al cambiar de pestaña
      />

      {/* Contenedor para el contenido de la pestaña */}
      <div className={styles.tabContent || 'tab-content'} style={{marginTop: '20px'}}>
        {/* Renderizado Condicional del Componente Hijo */}
        {activeTab === 'ALL' && <Reserva />}
        {activeTab === 'PENDING' && <ReservaPending />}
      </div>
    </div>
  );
};

export default ReservationsTabs;