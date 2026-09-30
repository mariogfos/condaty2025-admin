"use client";

import React, { useEffect, useState } from "react";
import { useAuth } from "@/mk/contexts/AuthProvider";
import CashFlowReportModal from "@/modulos/Balance/CashFlowReportModal/CashFlowReportModal";
import NotAccess from "@/components/auth/NotAccess/NotAccess";

/**
 * 🔴 La página pide `balance:R`, la misma letra que el API exige en
 * `GET v3/payments/export-cash-flow`. Antes sólo la pedía el menú: escribiendo
 * la URL, quien no tenía `balance` abría el reporte y chocaba con el 403.
 */
export default function CashFlowReportPage() {
  const { setStore, userCan } = useAuth();
  const [showModal, setShowModal] = useState(false);
  const canView = userCan("balance", "R");

  useEffect(() => {
    setStore({ title: "REPORTE CASHFLOW" });
    // Open modal immediately on mount
    setShowModal(true);
  }, [setStore]);

  if (!canView) return <NotAccess />;

  return (
    <CashFlowReportModal
      open={showModal}
      onClose={() => {
        // Close modal and go back
        window.history.back();
      }}
    />
  );
}
