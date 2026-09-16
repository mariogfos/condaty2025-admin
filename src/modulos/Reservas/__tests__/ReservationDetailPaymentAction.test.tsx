import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import ReservationDetailModal from "../RenderView/RenderView";

const executeMock = vi.fn().mockResolvedValue({ data: { success: false } });

vi.mock("@/mk/contexts/AuthProvider", () => ({
  useAuth: () => ({ showToast: vi.fn() }),
}));

vi.mock("@/mk/hooks/useAxios", () => ({
  default: () => ({
    data: { data: { reservation: null } },
    execute: executeMock,
    reLoad: vi.fn(),
  }),
}));

vi.mock("@/mk/components/ui/DataModal/DataModal", () => ({
  default: ({ open, children }: any) => (open ? <div>{children}</div> : null),
}));

vi.mock("@/mk/components/ui/LoadingScreen/LoadingScreen", () => ({
  default: ({ children }: any) => <>{children}</>,
}));

vi.mock("@/mk/components/forms/Button/Button", () => ({
  default: ({ children, ...props }: any) => <button {...props}>{children}</button>,
}));

vi.mock("@/mk/components/ui/Avatar/Avatar", () => ({
  Avatar: () => <div aria-label="Avatar" />,
}));

vi.mock("@/mk/components/forms/Input/Input", () => ({
  default: (props: any) => <input {...props} />,
}));

vi.mock("@/modulos/Payments/RenderView/RenderView", () => ({
  default: () => null,
}));

vi.mock("@/modulos/Payments/RenderForm/RenderForm", () => ({
  default: ({ debtId }: any) => (
    <div data-testid="payment-form">Deuda seleccionada: {debtId}</div>
  ),
}));

const pendingReservation = {
  id: 7,
  status: "A",
  date_at: "2026-09-18",
  start_time: "20:00:00",
  end_time: "23:00:00",
  people_count: 30,
  amount: 450,
  dpto: { nro: "M22-24" },
  owner: { id: 4, name: "Maria", last_name: "Jimenez" },
  area: { title: "Churrasquera 3 Nocturno" },
  debt_dpto: { id: 42, amount: 450, status: "A" },
};

describe("ReservationDetailModal — registro de pago", () => {
  it("muestra y abre Registrar pago cuando la reserva tiene pago pendiente", () => {
    render(
      <ReservationDetailModal
        open
        onClose={vi.fn()}
        item={pendingReservation}
        extraData={{ dptos: [], categories: [] }}
      />,
    );

    fireEvent.click(screen.getByRole("button", { name: "Registrar pago" }));

    expect(screen.getByTestId("payment-form")).toHaveTextContent(
      "Deuda seleccionada: 42",
    );
  });

  it("no muestra Registrar pago cuando la reserva no está pendiente", () => {
    render(
      <ReservationDetailModal
        open
        onClose={vi.fn()}
        item={{ ...pendingReservation, status: "Q", debt_dpto: { id: 42, status: "S" } }}
        extraData={{ dptos: [], categories: [] }}
      />,
    );

    expect(
      screen.queryByRole("button", { name: "Registrar pago" }),
    ).not.toBeInTheDocument();
  });
});
