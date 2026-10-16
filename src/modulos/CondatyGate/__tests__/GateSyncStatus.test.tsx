import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import GateSyncStatus from "../GateSyncStatus";
import type { GateConnection } from "../useGateStatus";

const connection: GateConnection = {
  id: "connection-a", entity_id: "condominium-a", entity_name: "Prueba", entity_handle: "prueba", status: "active",
  desired_version: 1, sent_version: 1, last_error: null, last_sync_at: null,
  history_status: "copying", history_sequence: 0, history_revision: 0,
};

describe("Gate synchronization status", () => {
  it("does not announce a finished history just because installation is active", () => {
    render(<GateSyncStatus connection={connection} />);
    expect(screen.getByText("Directorio sincronizado")).toBeInTheDocument();
    expect(screen.getByText("Copiando el historial en segundo plano")).toBeInTheDocument();
    expect(screen.getByText("Esperando la primera sincronización")).toBeInTheDocument();
    expect(screen.queryByText("Actualizado")).not.toBeInTheDocument();
  });

  it("keeps late changes pending after the initial copy reaches ready", () => {
    render(<GateSyncStatus connection={{ ...connection, history_status: "ready", history_revision: 4, history_sequence: 3 }} />);
    expect(screen.getByText("Sincronizando los últimos cambios")).toBeInTheDocument();
    expect(screen.queryByText("Actualizado")).not.toBeInTheDocument();
  });

  it("shows failures from each independent synchronization process", () => {
    render(<GateSyncStatus connection={{ ...connection, last_error: "Directorio pendiente", history_error: "Historial pendiente", access_error: "Movimientos pendientes" }} />);
    for (const message of ["Directorio pendiente", "Historial pendiente", "Movimientos pendientes"]) {
      expect(screen.getByText(message)).toBeInTheDocument();
    }
  });
});
