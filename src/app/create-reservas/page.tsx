"use client";

import { useCallback, useContext, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import CreateReserva from "@/modulos/CreateReserva/CreateReserva";
import { AxiosContext } from "@/mk/contexts/AxiosInstanceProvider";
import { useAuth } from "@/mk/contexts/AuthProvider";
import type { ReservationExtraData } from "@/modulos/Reservas/types";

const CreateReservaPage = () => {
  const router = useRouter();
  const { contextInstance } = useContext(AxiosContext);
  const { showToast } = useAuth();
  const [extraData, setExtraData] = useState<ReservationExtraData | null>(null);
  const [loading, setLoading] = useState(true);

  const loadExtraData = useCallback(async () => {
    if (!contextInstance) return;

    setLoading(true);
    try {
      const response = await contextInstance.request({
        method: "GET",
        url: "/v3/reservations",
        params: {
          perPage: -1,
          page: 1,
          fullType: "EXTRA",
        },
      });

      setExtraData((response?.data?.data || {}) as ReservationExtraData);
    } catch (_error) {
      setExtraData(null);
      showToast("No pudimos cargar los datos para crear la reserva", "error");
    } finally {
      setLoading(false);
    }
  }, [contextInstance, showToast]);

  useEffect(() => {
    void loadExtraData();
  }, [loadExtraData]);

  if (loading) {
    return <div style={{ color: "var(--cWhiteV1)" }}>Cargando flujo de reserva...</div>;
  }

  if (!extraData) {
    return (
      <div style={{ color: "var(--cWhiteV1)" }}>
        No pudimos abrir el flujo de reserva en este momento.
      </div>
    );
  }

  return (
    <CreateReserva
      extraData={extraData}
      setOpenList={() => {}}
      onClose={() => router.push("/calendar")}
      reLoad={() => {}}
    />
  );
};

export default CreateReservaPage;
