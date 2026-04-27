"use client";

import React, { useEffect, useState } from "react";
import { useAuth } from "@/mk/contexts/AuthProvider";
import CashFlowReportModal from "@/modulos/Balance/CashFlowReportModal/CashFlowReportModal";

export default function CashFlowReportPage() {
  const { setStore } = useAuth();
  const [showModal, setShowModal] = useState(false);

  useEffect(() => {
    setStore({ title: "REPORTE CASHFLOW" });
    // Open modal immediately on mount
    setShowModal(true);
  }, [setStore]);

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
