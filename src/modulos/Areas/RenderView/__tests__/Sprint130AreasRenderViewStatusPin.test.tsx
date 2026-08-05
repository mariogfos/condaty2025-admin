/**
 * S130 (front) - Source-parsing pin + e2e test para HALLAZGO-NEW-39 (front).
 *
 * Problema: `Areas/RenderView/RenderView.tsx` pineaba `item?.status == "A"`
 * (char legacy) para decidir el label del botón toggle ("Activar" vs
 * "Desactivar área") y el flujo de onSaveStatus. Post-S17-T3 (back),
 * `areas.status` es TINYINT enum (`AreaStatus::ACTIVE=1`, `MAINTENANCE=2`).
 * El char `'A'` no matcheaba nada → el label siempre decía "Activar área"
 * + el botón siempre llamaba `onSaveStatus("A")` (activar) + el modal
 * de confirmación pineaba `onSaveStatus("X")` (que el back no entiende
 * — `$statusMap` solo acepta 'A'/'M'/'1'/'2').
 *
 * Mario reportó: "en el detalle de las areas sociales, me aparece un
 * boton que dice, activar area, aunque la area ya esta activa, y al
 * dar click quiere desactivar, me parece que el label del boton esta mal".
 *
 * Es la **versión front** de HALLAZGO-NEW-31 (S122) + HALLAZGO-NEW-39 (S129).
 * S130 pinea el consumer que renderiza el label.
 *
 * HALLAZGO-NEW-29: vitest con S118 S118b no los detecta. Usar Sprint130*.
 *
 * HALLAZGO-NEW-03: source-parsing pinea INTENCIÓN. Los e2e con RTL
 * pinean EFECTIVIDAD. Ambos deben correr juntos.
 */
import { describe, it, expect, beforeAll } from "vitest";
import { render, screen, cleanup, fireEvent, waitFor } from "@testing-library/react";
import fs from "fs";
import path from "path";

const RENDER_VIEW_PATH = path.resolve(__dirname, "../RenderView.tsx");
const RENDER_VIEW_SRC = fs.readFileSync(RENDER_VIEW_PATH, "utf-8");

/**
 * Mock useAxios para no pinear axios en tests. El mock retorna
 * `{ data: { status: true, msg: "ok" } }` para que el código del
 * componente no pinee unhandled errors al destructurar.
 */
const mockExecute = vi.fn().mockResolvedValue({
  data: { status: true, msg: "ok" },
});
vi.mock("@/mk/hooks/useAxios", () => ({
  default: () => ({ execute: mockExecute }),
}));

vi.mock("@/mk/contexts/AuthProvider", () => ({
  useAuth: () => ({
    showToast: vi.fn(),
  }),
}));

import RenderView from "../RenderView";

describe("S130 (front) - Areas RenderView status enum pin (HALLAZGO-NEW-39)", () => {
  // --- SOURCE-PARSING PINE ESPECÍFICO ---

  describe("source-parsing pines (intención)", () => {
    beforeAll(() => {
      // sanity check
      expect(RENDER_VIEW_SRC.length).toBeGreaterThan(0);
    });

    it("RenderView.tsx pinea comparación con AreaStatus.ACTIVE (no char 'A')", () => {
      // El fix de raíz: pinear `item?.status === AreaStatus.ACTIVE` en
      // vez de `item?.status == "A"`. El test busca el patrón correcto
      // Y rechaza el patrón incorrecto en el archivo.
      expect(RENDER_VIEW_SRC).toMatch(/item\?\.status\s*===\s*AreaStatus\.ACTIVE/);
      // No debe haber `== "A"` (char legacy) en comparaciones de status
      // (en ninguna parte del archivo).
      const matches = RENDER_VIEW_SRC.match(/status\s*==\s*["']A["']/g) ?? [];
      expect(matches).toEqual([]);
    });

    it("RenderView.tsx pinea AREA_STATUS_LABEL map (no legacy const status)", () => {
      // El label map debe pinear el enum canónico. Si alguien vuelve a
      // pinear `const status = { A: ..., X: ... }`, falla.
      expect(RENDER_VIEW_SRC).toMatch(/AREA_STATUS_LABEL\s*:/);
      expect(RENDER_VIEW_SRC).toMatch(/\[AreaStatus\.ACTIVE\]\s*:/);
      expect(RENDER_VIEW_SRC).toMatch(/\[AreaStatus\.MAINTENANCE\]\s*:/);
      // El mapa legacy con chars 'A'/'X' no debe existir
      expect(RENDER_VIEW_SRC).not.toMatch(/=\s*\{\s*['"]A['"]\s*:/);
      expect(RENDER_VIEW_SRC).not.toMatch(/=\s*\{\s*['"]X['"]\s*:/);
    });

    it("RenderView.tsx pinea onSaveStatus con AreaStatus enum (no char 'A'/'X'/'M')", () => {
      // onSaveStatus debe pinear AreaStatus enum values, no chars.
      // El back `AreaController::statusArea` pineá $statusMap que acepta
      // tanto chars legacy ('A'/'M') como enum values (1/2). Pineamos
      // enum value por consistencia.
      expect(RENDER_VIEW_SRC).toMatch(/onSaveStatus\(AreaStatus\.ACTIVE\)/);
      expect(RENDER_VIEW_SRC).toMatch(/onSaveStatus\(AreaStatus\.MAINTENANCE\)/);
      // onSaveStatus NO debe pinear chars legacy 'A'/'X'/'M'
      expect(RENDER_VIEW_SRC).not.toMatch(/onSaveStatus\(["']A["']\)/);
      expect(RENDER_VIEW_SRC).not.toMatch(/onSaveStatus\(["']X["']\)/);
      expect(RENDER_VIEW_SRC).not.toMatch(/onSaveStatus\(["']M["']\)/);
    });

    it("RenderView.tsx pinea docblock S130 explicando el fix", () => {
      // Si alguien borra el comentario S130, no se pierde el contexto.
      expect(RENDER_VIEW_SRC).toContain("S130");
      expect(RENDER_VIEW_SRC).toContain("HALLAZGO-NEW-39");
    });
  });

  // --- E2E PINE (efectividad) ---

  describe("e2e pines (efectividad)", () => {
    beforeEach(() => {
      // Reset pineando el return value por defecto (necesario porque
      // el componente pineá `const { data } = await execute(...)` y si
      // mockExecute retorna undefined, falla el destructuring).
      mockExecute.mockReset();
      mockExecute.mockResolvedValue({
        data: { status: true, msg: "ok" },
      });
    });

    afterEach(() => {
      cleanup();
    });

    it("e2e: area ACTIVA muestra label 'Desactivar área' y abre modal de confirmación al click", async () => {
      const item = { id: 1, status: 1, title: "Salon Test" }; // 1 = AreaStatus.ACTIVE
      render(
        <RenderView
          open={true}
          item={item}
          onClose={() => {}}
          reLoad={() => {}}
        />,
      );

      // El label debe decir "Desactivar área" (NO "Activar área")
      const button = screen.getByRole("button", { name: /Desactivar área/i });
      expect(button).toBeInTheDocument();

      // Click en el botón → debe abrir el modal de confirmación
      // (NO llamar onSaveStatus directo)
      fireEvent.click(button);

      // El modal de confirmación debe aparecer
      await waitFor(() => {
        expect(screen.getByText(/Desactivar área social/i)).toBeInTheDocument();
      });

      // onSaveStatus NO debe haberse llamado todavía
      expect(mockExecute).not.toHaveBeenCalled();
    });

    it("e2e: area INACTIVA (MAINTENANCE) muestra label 'Activar área' y llama onSaveStatus directo al click", async () => {
      const item = { id: 2, status: 2, title: "Salon Inactivo" }; // 2 = AreaStatus.MAINTENANCE
      render(
        <RenderView
          open={true}
          item={item}
          onClose={() => {}}
          reLoad={() => {}}
        />,
      );

      // El label debe decir "Activar área"
      const button = screen.getByRole("button", { name: /Activar área/i });
      expect(button).toBeInTheDocument();

      // Click en el botón → debe llamar onSaveStatus(ACTIVE) directo
      // (NO abrir modal de confirmación)
      fireEvent.click(button);

      await waitFor(() => {
        expect(mockExecute).toHaveBeenCalledWith(
          // La ruta se movió al módulo v3 (`Route::post('areas/status')` en
          // Areas/Routes/api.php). `/status-area` ya no existe en el back:
          // este test venía en rojo pidiendo una ruta muerta.
          "/v3/areas/status",
          "POST",
          expect.objectContaining({
            status: 1, // AreaStatus.ACTIVE
            area_id: 2,
          }),
        );
      });

      // El modal de confirmación NO debe aparecer
      expect(screen.queryByText(/Desactivar área social/i)).not.toBeInTheDocument();
    });

    it("e2e: el KeyValue 'Estado' muestra el label correcto del enum", () => {
      const item = { id: 3, status: 1, title: "Salon Activo" };
      render(
        <RenderView
          open={true}
          item={item}
          onClose={() => {}}
          reLoad={() => {}}
        />,
      );

      // El label debe ser "Activa" (no "Inactiva")
      expect(screen.getByText("Activa")).toBeInTheDocument();
      expect(screen.queryByText("Inactiva")).not.toBeInTheDocument();
    });
  });
});
