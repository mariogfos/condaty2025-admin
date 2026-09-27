/**
 * «Registrar pago» desde el detalle de una reserva con el pago pendiente.
 *
 * Producción lo trajo en 17f7bf97: antes, desde el detalle sólo se podía
 * cancelar o ver un pago ya hecho, y para cobrar había que ir a buscar la
 * deuda a Deudas. Se mide lo que ve el administrador: el botón aparece sólo
 * con el pago pendiente y la deuda, y abre el formulario de cobro con ESA
 * deuda, la unidad, el tipo Reservas y categoría y monto bloqueados.
 */
import React from "react";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { AxiosContext } from "@/mk/contexts/AxiosInstanceProvider";
import { ImageModalProvider } from "@/contexts/ImageModalContext";
import { FormPaymentType } from "@/modulos/Payments/Type/PaymentType";
import ReservationDetailModal from "../RenderView/RenderView";
import { ReservationStatus, type ReservationDetailItem } from "../Type/ReservaType";
import { canRegisterReservationPayment } from "../utils/reservationStatus";

const formProps = vi.fn();

vi.mock("@/modulos/Payments/RenderView/RenderView", () => ({
  default: () => null,
}));

vi.mock("@/modulos/Payments/RenderForm/RenderForm", () => ({
  default: (props: any) => {
    formProps(props);
    return <div data-testid="payment-form">Deuda {props.debtId}</div>;
  },
}));

vi.mock("@/mk/contexts/AuthProvider", () => ({
  useAuth: () => ({
    user: { id: 1 },
    userCan: () => true,
    store: {},
    setStore: vi.fn(),
    showToast: vi.fn(),
  }),
}));

const PENDIENTE: ReservationDetailItem = {
  id: 7,
  status: ReservationStatus.PENDING_PAYMENT,
  date_at: "2026-09-18",
  start_time: "20:00:00",
  end_time: "23:00:00",
  people_count: 30,
  amount: 450,
  dpto: { id: 5, nro: "M22-24" },
  owner: { id: 4, name: "Maria", last_name: "Jimenez" },
  area: { id: 3, title: "Churrasquera 3" },
  debt_dpto: { id: 42, amount: 450 },
};

const METADATA = { dptos: [{ id: 5, nro: "M22-24" }], bankAccounts: [] };

const renderDetalle = (reserva: ReservationDetailItem) => {
  const request = vi.fn(async (config: any) => {
    if (String(config.url).includes("form-metadata")) {
      return { data: { success: true, data: METADATA } };
    }
    if (String(config.url).includes("resolved-payment")) {
      return { data: { success: false } };
    }
    return { data: { data: { reservation: reserva } } };
  });

  render(
    <AxiosContext.Provider
      value={{ contextInstance: { request }, waiting: 0, setWaiting: vi.fn() }}
    >
      <ImageModalProvider>
        <ReservationDetailModal open onClose={vi.fn()} item={reserva} />
      </ImageModalProvider>
    </AxiosContext.Provider>,
  );

  return { request };
};

describe("canRegisterReservationPayment", () => {
  it("sólo con el pago pendiente y la deuda", () => {
    expect(canRegisterReservationPayment(ReservationStatus.PENDING_PAYMENT, 42)).toBe(true);
    expect(canRegisterReservationPayment(ReservationStatus.PAYMENT_SUBMITTED, 42)).toBe(false);
    expect(canRegisterReservationPayment(ReservationStatus.RESERVED_PAID, 42)).toBe(false);
    expect(canRegisterReservationPayment(ReservationStatus.PENDING_PAYMENT, null)).toBe(false);
  });
});

describe("Detalle de reserva — Registrar pago", () => {
  it("abre el cobro con la deuda de la reserva, tipo Reservas y monto bloqueado", async () => {
    const { request } = renderDetalle(PENDIENTE);

    fireEvent.click(await screen.findByRole("button", { name: "Registrar pago" }));

    expect(await screen.findByTestId("payment-form")).toHaveTextContent("Deuda 42");
    expect(
      request.mock.calls.some(([config]) =>
        String(config.url).includes("/v3/payments/form-metadata"),
      ),
    ).toBe(true);

    const props = formProps.mock.calls.at(-1)?.[0];
    expect(props.extraData).toEqual(METADATA);
    expect(props.item).toMatchObject({
      dpto_id: "M22-24",
      type: FormPaymentType.RESERVATION,
      isCategoryLocked: true,
      isSubcategoryLocked: true,
      isAmountLocked: true,
      owner_id: 4,
    });
  });

  it("no aparece si el pago ya se envió", async () => {
    renderDetalle({ ...PENDIENTE, status: ReservationStatus.PAYMENT_SUBMITTED });

    await waitFor(() =>
      expect(screen.getByText("Churrasquera 3", { selector: "h4" })).toBeInTheDocument(),
    );
    expect(screen.queryByRole("button", { name: "Registrar pago" })).toBeNull();
  });
});
