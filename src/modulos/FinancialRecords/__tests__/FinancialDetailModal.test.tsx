import { fireEvent, render, screen, waitFor, within } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { FinancialDetailModal } from "../FinancialDetailModal";
import type {
  FinancialCapabilities,
  FinancialMenuAction,
  FinancialRecordReference,
  FinancialWorkspace,
} from "../types";

const execute = vi.fn();
const showToast = vi.fn();

// `execute` es estable en useAxios; el mock lo respeta para no refetchear en
// cada render.
vi.mock("@/mk/hooks/useAxios", () => ({
  default: () => ({ execute }),
}));

vi.mock("@/mk/contexts/AuthProvider", () => ({
  useAuth: () => ({ showToast }),
}));

const NO_CAPABILITIES: FinancialCapabilities = {
  can_edit_amount: false,
  can_edit_penalty: false,
  can_verify_payment: false,
  can_edit_paid_at: false,
};

const workspace: FinancialWorkspace = {
  record: { type: "debt", id: "42" },
  capabilities: NO_CAPABILITIES,
  history: [
    {
      id: "event-1",
      source: "audit",
      action: "PENALTY_UPDATED",
      actor: { name: "Ana Rojas" },
      occurred_at: "2026-09-02T10:00:00-04:00",
    },
  ],
};

const WORKSPACE_URL = "/v3/financial-records/debt/42/workspace";
const PENALTY_URL = "/v3/financial-records/debt/42/penalty";

/**
 * El GET del workspace devuelve `served`; los PUT de corrección devuelven
 * `correction`, que cada test pisa para simular el 422.
 */
const serveApi = (
  served: FinancialWorkspace,
  correction: unknown = {
    data: {
      success: true,
      message: "Corrección registrada.",
      data: { changed: true, record: {} },
    },
    error: null,
  },
) =>
  execute.mockImplementation(async (_url: string, method: string) =>
    method === "GET"
      ? { data: { success: true, data: served }, error: null }
      : correction,
  );

const withCapabilities = (
  capabilities: Partial<FinancialCapabilities>,
  record: Partial<FinancialWorkspace["record"]> = {},
): FinancialWorkspace => ({
  ...workspace,
  record: { ...workspace.record, ...record },
  capabilities: { ...NO_CAPABILITIES, ...capabilities },
});

const renderModal = ({
  record = { type: "debt", id: 42 },
  customActions,
  onRecordChanged,
  onClose = vi.fn(),
}: {
  record?: FinancialRecordReference;
  customActions?: FinancialMenuAction[];
  onRecordChanged?: () => void;
  onClose?: () => void;
} = {}) =>
  render(
    <FinancialDetailModal
      open
      onClose={onClose}
      title="Detalle de deuda"
      record={record}
      customActions={customActions}
      onRecordChanged={onRecordChanged}
    >
      <p>Contenido financiero</p>
    </FinancialDetailModal>,
  );

const openMenu = async () =>
  fireEvent.click(await screen.findByRole("button", { name: "Más acciones" }));

const openPenaltyEditor = async () => {
  await openMenu();
  fireEvent.click(screen.getByRole("menuitem", { name: "Editar multa" }));
  return screen.getByRole("dialog", { name: "Editar multa" });
};

const fillPenalty = (dialog: HTMLElement, amount: string, reason: string) => {
  fireEvent.change(within(dialog).getByLabelText("Monto en bolivianos"), {
    target: { value: amount },
  });
  fireEvent.change(within(dialog).getByLabelText("Motivo de la corrección"), {
    target: { value: reason },
  });
  fireEvent.click(within(dialog).getByRole("button", { name: "Guardar corrección" }));
};

const correctionCalls = () =>
  execute.mock.calls.filter(([, method]) => method === "PUT");

describe("FinancialDetailModal", () => {
  beforeEach(() => {
    execute.mockReset();
    showToast.mockReset();
    serveApi(workspace);
  });

  it("loads the workspace from the v3 route without blocking the screen", () => {
    renderModal();

    expect(execute).toHaveBeenCalledWith(WORKSPACE_URL, "GET", {}, false, true);
  });

  it("switches from the record detail to its immutable history", async () => {
    renderModal();

    fireEvent.click(await screen.findByRole("tab", { name: /Historial\s*1/ }));

    expect(screen.getByText("Multa editada")).toBeInTheDocument();
    expect(screen.getByText("Ana Rojas")).toBeInTheDocument();
    expect(screen.queryByText("Contenido financiero")).not.toBeInTheDocument();
  });

  it("shows the API message when the workspace is rejected", async () => {
    execute.mockResolvedValue({
      data: null,
      error: {
        message: "Request failed with status code 403",
        status: 403,
        data: { success: false, message: "No tienes permisos para consultar este historial." },
      },
    });
    renderModal();

    fireEvent.click(screen.getByRole("tab", { name: /Historial/ }));

    expect(await screen.findByRole("alert")).toHaveTextContent(
      "No tienes permisos para consultar este historial.",
    );
  });

  it("hides the menu when there are no capabilities and no custom actions", async () => {
    renderModal();

    // El workspace ya llegó: el contador del historial lo prueba.
    await screen.findByRole("tab", { name: /Historial\s*1/ });

    expect(screen.queryByRole("button", { name: "Más acciones" })).not.toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Cerrar detalle" })).toBeInTheDocument();
  });

  it("runs the screen's custom actions and keeps the destructive ones last", async () => {
    const onCancel = vi.fn();
    renderModal({
      customActions: [
        { id: "cancel", label: "Anular", destructive: true, onSelect: onCancel },
        { id: "copy-reference", label: "Copiar referencia", onSelect: vi.fn() },
      ],
    });

    await openMenu();

    expect(screen.getAllByRole("menuitem").map((item) => item.textContent)).toEqual([
      "Copiar referencia",
      "Anular",
    ]);
    expect(screen.queryByRole("menuitem", { name: "Editar monto" })).not.toBeInTheDocument();

    fireEvent.click(screen.getByRole("menuitem", { name: "Anular" }));
    expect(onCancel).toHaveBeenCalledOnce();
    expect(screen.queryByRole("menu")).not.toBeInTheDocument();
  });

  it("never offers the payment verification, discarded in dev", async () => {
    serveApi(withCapabilities({ can_verify_payment: true, can_edit_penalty: true }));
    renderModal();

    await openMenu();

    expect(screen.getAllByRole("menuitem").map((item) => item.textContent)).toEqual([
      "Editar multa",
    ]);
    expect(screen.queryByText(/verificar/i)).not.toBeInTheDocument();
  });

  it("opens an audited correction form from the built-in menu", async () => {
    serveApi(withCapabilities({ can_edit_penalty: true }));
    renderModal({ record: { type: "debt", id: 42, penaltyAmount: 35 } });

    const dialog = await openPenaltyEditor();

    expect(within(dialog).getByRole("heading", { name: "Editar multa" })).toBeInTheDocument();
    expect(within(dialog).getByLabelText("Monto en bolivianos")).toHaveValue(35);
    expect(within(dialog).getByLabelText("Motivo de la corrección")).toBeRequired();
  });

  it("opens the debt amount correction with the authoritative amount", async () => {
    serveApi(withCapabilities({ can_edit_amount: true }, { amount: 420 }));
    renderModal({ record: { type: "debt", id: 42, amount: 999 } });

    await openMenu();
    fireEvent.click(screen.getByRole("menuitem", { name: "Editar monto" }));

    expect(
      screen.getByRole("heading", { name: "Editar monto de la deuda" }),
    ).toBeInTheDocument();
    expect(screen.getByLabelText("Monto de la deuda")).toHaveValue(420);
    expect(screen.getByText(/Los ingresos relacionados se conservan/)).toBeInTheDocument();
  });

  it("explains proportional synchronization when editing an income amount", async () => {
    serveApi({
      ...withCapabilities({ can_edit_amount: true }),
      record: { type: "payment", id: "payment-1", amount: 250 },
    });
    renderModal({ record: { type: "payment", id: "payment-1" } });

    await openMenu();
    fireEvent.click(screen.getByRole("menuitem", { name: "Editar monto" }));

    expect(screen.getByRole("heading", { name: "Editar monto pagado" })).toBeInTheDocument();
    expect(screen.getByLabelText("Monto pagado")).toHaveValue(250);
    expect(screen.getByText(/se ajustarán proporcionalmente/)).toBeInTheDocument();
  });

  it("sends the penalty to the v3 route rounded to two decimals", async () => {
    serveApi(withCapabilities({ can_edit_penalty: true }));
    renderModal();

    fillPenalty(await openPenaltyEditor(), "12.3456", "  Multa mal cargada  ");

    await waitFor(() => expect(correctionCalls()).toHaveLength(1));
    expect(correctionCalls()[0]).toEqual([
      PENALTY_URL,
      "PUT",
      { amount: 12.35, reason: "Multa mal cargada" },
      false,
      true,
    ]);
  });

  it("shows the business reason of a 422 inside the dialog", async () => {
    serveApi(withCapabilities({ can_edit_penalty: true }), {
      data: null,
      error: {
        message: "Request failed with status code 422",
        status: 422,
        data: { success: false, message: "La deuda ya fue cobrada: su multa no se edita." },
      },
    });
    renderModal();

    const dialog = await openPenaltyEditor();
    fillPenalty(dialog, "10", "Multa mal cargada");

    expect(await within(dialog).findByRole("alert")).toHaveTextContent(
      "La deuda ya fue cobrada: su multa no se edita.",
    );
    expect(showToast).not.toHaveBeenCalled();
  });

  it("refetches the workspace and notifies the screen after a saved correction", async () => {
    serveApi(withCapabilities({ can_edit_penalty: true }));
    const onRecordChanged = vi.fn();
    renderModal({ onRecordChanged });

    fillPenalty(await openPenaltyEditor(), "10", "Multa mal cargada");

    await waitFor(() => expect(onRecordChanged).toHaveBeenCalledOnce());
    const workspaceLoads = execute.mock.calls.filter(([url]) => url === WORKSPACE_URL);
    expect(workspaceLoads).toHaveLength(2);
    // El aviso de la pantalla corre DESPUÉS de recargar el historial.
    expect(execute.mock.invocationCallOrder.at(-1)).toBeLessThan(
      onRecordChanged.mock.invocationCallOrder[0],
    );
    expect(showToast).toHaveBeenCalledWith("Corrección registrada.", "success");
    expect(screen.queryByRole("dialog", { name: "Editar multa" })).not.toBeInTheDocument();
  });

  it("blocks the request when the reason is shorter than three characters", async () => {
    serveApi(withCapabilities({ can_edit_penalty: true }));
    renderModal();

    const dialog = await openPenaltyEditor();
    fillPenalty(dialog, "10", " ab ");

    expect(within(dialog).getByRole("alert")).toHaveTextContent(
      "Indica el motivo de esta corrección.",
    );
    expect(correctionCalls()).toHaveLength(0);
  });

  it("closes only the correction dialog on Escape, not the whole detail", async () => {
    serveApi(withCapabilities({ can_edit_penalty: true }));
    const onClose = vi.fn();
    renderModal({ onClose });

    const dialog = await openPenaltyEditor();
    fireEvent.keyDown(dialog, { key: "Escape" });

    expect(screen.queryByRole("dialog", { name: "Editar multa" })).not.toBeInTheDocument();
    expect(onClose).not.toHaveBeenCalled();
  });
});
