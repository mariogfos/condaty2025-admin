"use client";

import { useCallback, useContext, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import CreateReserva from "@/modulos/CreateReserva/CreateReserva";
import { AxiosContext } from "@/mk/contexts/AxiosInstanceProvider";
import { useAuth } from "@/mk/contexts/AuthProvider";
import type { ReservationExtraData } from "@/modulos/Reservas/Type/ReservaType";
import NotAccess from "@/components/auth/NotAccess/NotAccess";

const CreateReservaPage = () => {
  const router = useRouter();
  const { contextInstance } = useContext(AxiosContext);
  const { showToast, userCan } = useAuth();
  // 🔴 El alta de reserva pide `reservations:C`, la letra del `POST
  // v3/reservations` en el API. El botón del Calendario ya la pedía; la URL
  // escrita a mano no, y cargaba el `EXTRA` de reservas —áreas y unidades—
  // para cualquiera.
  const canCreate = userCan("reservations", "C");
  const [extraData, setExtraData] = useState<ReservationExtraData | null>(null);
  const [loading, setLoading] = useState(true);

  const loadExtraData = useCallback(async () => {
    if (!contextInstance || !canCreate) return;

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
  }, [contextInstance, showToast, canCreate]);

  useEffect(() => {
    void loadExtraData();
  }, [loadExtraData]);

  if (!canCreate) return <NotAccess />;

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
