import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import ConfigurationHistory from "../ConfigurationHistory";
import { changesFor, historyDay, type AuditEntry } from "../configurationHistoryPresentation";

const mocks = vi.hoisted(() => ({ execute: vi.fn(), data: null as unknown, loaded: true }));
vi.mock("@/mk/hooks/useAxios", () => ({ default: () => ({ ...mocks, error: null }) }));
vi.mock("@/mk/components/ui/Avatar/Avatar", () => ({ Avatar: () => <span aria-hidden="true" /> }));
const entry = (id: number, changes: AuditEntry["changes"]): AuditEntry => ({
  id, actor_name: "Ana Rojas", actor_type: "User", subject_type: "ClientConfig", subject_id: "1",
  subject_label: "Configuración del condominio", event: "updated", created_at: "2026-11-04 02:00:00", changes,
});

describe("Historial de configuración", () => {
  beforeEach(() => {
    mocks.execute.mockReset();
    mocks.loaded = true;
    mocks.data = { success: true, data: { items: [entry(1, {
      has_tasks_visible: { from: 0, to: false }, soft_limit: { from: "3", to: 3 },
      name: { from: "Nombre anterior", to: "Nombre nuevo" },
    })], current_page: 1, last_page: 2 } };
  });
  it("muestra solo cambios reales con sus valores y agrupa por fecha de Bolivia", () => {
    render(<ConfigurationHistory />);
    expect(screen.getByText("Nombre anterior")).toBeInTheDocument();
    expect(screen.getByText("Nombre nuevo")).toBeInTheDocument();
    expect(screen.queryByText("Tareas para residentes")).not.toBeInTheDocument();
    expect(screen.queryByText("Límite preventivo")).not.toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "3 de noviembre de 2026" })).toBeInTheDocument();
    expect(screen.getByText("Ana Rojas")).toBeInTheDocument();
  });
  it("conserva eventos protegidos sin presentar una falsa igualdad entre valores ocultos", () => {
    mocks.data = { success: true, data: { items: [entry(1, { qr_dynamic_password: { from: "[oculto]", to: "[oculto]" } })], current_page: 1, last_page: 1 } };
    render(<ConfigurationHistory />);
    expect(screen.getByText("Valor protegido actualizado")).toBeInTheDocument();
    expect(screen.queryByText("[oculto]")).not.toBeInTheDocument();
  });
  it("desglosa permisos y muestra únicamente la opción anidada que cambió", () => {
    const changes = changesFor(entry(1, { operational_permissions_config: {
      from: { tenant: { invitation: 1, reservation: 0 } },
      to: { tenant: { reservation: true, invitation: true } },
    } }));
    expect(changes).toEqual([{ field: "operational_permissions_config.tenant.reservation", label: "Permisos operativos · Inquilino · Reservar áreas", before: "No", after: "Sí", protected: false }]);
  });
  it("mantiene la actividad al fallar y reintenta la misma página sin duplicados", async () => {
    mocks.execute.mockResolvedValueOnce({ error: { message: "offline" } });
    render(<ConfigurationHistory />);
    fireEvent.click(screen.getByRole("button", { name: "Ver más" }));
    expect(await screen.findByRole("alert")).toHaveTextContent("No pudimos cargar más actividad");
    expect(screen.getByText("Nombre nuevo")).toBeInTheDocument();
    mocks.execute.mockResolvedValueOnce({ data: { success: true, data: { items: [entry(1, { name: { from: "Nombre anterior", to: "Nombre nuevo" } }), entry(2, { financial_mode: { from: 1, to: 3 } })], current_page: 2, last_page: 2 } } });
    fireEvent.click(screen.getByRole("button", { name: "Reintentar" }));
    expect(await screen.findByText("Expensas y multas juntos")).toBeInTheDocument();
    expect(screen.getAllByText("Nombre nuevo")).toHaveLength(1);
    expect(mocks.execute.mock.calls.map(call => call[2].page)).toEqual([2, 2]);
    await waitFor(() => expect(screen.queryByRole("button", { name: "Ver más" })).not.toBeInTheDocument());
  });
  it("no elimina ceros iniciales ni cambios de orden en opciones de campos", () => {
    const rows = changesFor(entry(1, { default_value: { from: "0012", to: "12" }, options: { from: ["A", "B"], to: ["B", "A"] } }));
    expect(rows).toHaveLength(2);
    expect(historyDay("fecha incorrecta")).toBe("Fecha no disponible");
  });
});
