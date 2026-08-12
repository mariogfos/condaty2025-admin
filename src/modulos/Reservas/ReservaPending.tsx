"use client";
import NotAccess from "@/components/auth/NotAccess/NotAccess";
import useReservasPending from "./hooks/useReservasPending";

/**
 * La pestaña "Reservas pendientes". **Presentacional**.
 *
 * ⚠️ Hoy esta pantalla no tiene entrada: la única que la renderea es
 * `ReserbationsTab`, y la página `/reservas` importa ese componente pero
 * monta `<Reserva />` directo. Queda funcionando para el día que se vuelva a
 * enganchar la pestaña.
 */
const ReservaPending = () => {
  const { List, userCan, modPermission, onLongPress, selItem } =
    useReservasPending();

  if (!userCan(modPermission, "R")) return <NotAccess />;

  return (
    <div>
      <List onLongPress={onLongPress} selItem={selItem} />
    </div>
  );
};

export default ReservaPending;
