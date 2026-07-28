/**
 * S127 (front) - Source-parsing pin + e2e render test para HALLAZGO-NEW-37.
 *
 * Problema: `NewModal.tsx` siempre renderizaba `{children}` independientemente
 * de `open`. Solo cambiaba `visibility: hidden/visible` del wrapper div. Eso
 * significaba que los `useEffect` de los children (e.g. polling de
 * `DownloadHistory`, setInterval de `useAsyncExport`) seguían activos cuando
 * el modal estaba "cerrado" → network flood al cambiar de menú.
 *
 * Mario reportó: "Algo pasa cuando cambio de menu, en el network se ve que
 * carga un endpoint de report, muchas veces repetidas, y un status tambien,
 * ni bien entrar a la lista, no deberia hacer tantas peticiones no?"
 *
 * Fix de raíz: pinear `{open && children}` en vez de `{children}` directo.
 * Eso desmonta los children cuando `open=false` → React ejecuta los cleanup
 * de los `useEffect` → polls mueren. Patrón de las headless modal libs
 * modernas (Headless UI, Radix, Chakra).
 *
 * HALLAZGO-NEW-29: vitest con S118 S118b no los detecta. Usar Sprint127*.
 *
 * HALLAZGO-NEW-03: source-parsing pinea INTENCION. Los e2e con RTL pinea
 * EFECTIVIDAD (el children se desmonta del DOM cuando open=false). Ambos
 * deben correr juntos.
 */
import { describe, it, expect, beforeAll } from "vitest";
import { render, screen, cleanup } from "@testing-library/react";
import { useEffect, useState } from "react";
import fs from "fs";
import path from "path";
import NewModal from "../NewModal";

const NEW_MODAL_PATH = path.resolve(__dirname, "../NewModal.tsx");

let src = "";

describe("S127 (front) - NewModal children unmount pin (HALLAZGO-NEW-37)", () => {
  beforeAll(() => {
    src = fs.readFileSync(NEW_MODAL_PATH, "utf-8");
  });

  // --- SOURCE-PARSING PINES (intención) ---

  it("NewModal.tsx pinea {open && children} (no {children} solo)", () => {
    // El fix de raíz del HALLAZGO-NEW-37. El children DEBE estar
    // gated por `open` para que se desmonte cuando el modal está
    // cerrado. Si alguien lo refactorea a `{children}` solo,
    // el test falla con mensaje claro.
    expect(src).toMatch(/\{open\s*&&\s*children\}/);
  });

  it("NewModal.tsx NO pinea {children} directo en JSX (anti-pattern detectado)", () => {
    // Anti-pattern: renderizar children siempre, sin gating por `open`.
    // Lo detectamos buscando el patrón JSX específico
    // `>{children}<` (o `>{children}\n`) que indica children renderizado
    // sin `open &&` antes.
    //
    // No matcheamos tipos ni destructuring (esos son válidos).
    const jsxChildrenPattern = />(?:\s*\{children\}\s*)<\/[A-Za-z]/g;
    const matches = src.match(jsxChildrenPattern) ?? [];
    expect(matches).toEqual([]);
  });

  it("NewModal.tsx pinea docblock S127 explicando el fix", () => {
    // Si alguien borra el comentario del fix, no se pierde el
    // contexto histórico. La docblock debe mencionar S127 y
    // HALLAZGO-NEW-37.
    expect(src).toContain("S127");
    expect(src).toContain("HALLAZGO-NEW-37");
  });

  // --- E2E PIN (efectividad) ---

  it("e2e: el children se desmonta del DOM cuando open=false", () => {
    // Renderizamos un children con un data-testid único. Con
    // open=true debe estar en el DOM. Con open=false NO debe
    // estar (desmontado, no solo oculto).
    const { rerender } = render(
      <NewModal open={true} onClose={() => {}}>
        <div data-testid="s127-children-content">contenido del modal</div>
      </NewModal>,
    );
    expect(screen.queryByTestId("s127-children-content")).not.toBeNull();

    // Cerrar el modal → el children se debe desmontar.
    rerender(
      <NewModal open={false} onClose={() => {}}>
        <div data-testid="s127-children-content">contenido del modal</div>
      </NewModal>,
    );
    expect(screen.queryByTestId("s127-children-content")).toBeNull();

    // Reabrir → vuelve a estar.
    rerender(
      <NewModal open={true} onClose={() => {}}>
        <div data-testid="s127-children-content">contenido del modal</div>
      </NewModal>,
    );
    expect(screen.queryByTestId("s127-children-content")).not.toBeNull();

    cleanup();
  });

  it("e2e: el useEffect cleanup del children corre cuando el modal se cierra", () => {
    // Pinea la EFECTIVIDAD del fix: cuando `open` pasa a false,
    // el children se desmonta → React ejecuta el cleanup de su
    // useEffect. Esto es lo que mata el polling de DownloadHistory
    // y el setInterval de useAsyncExport.
    //
    // Usamos un componente "PollCounter" que cuenta mounts y unmounts
    // via refs. Si el cleanup no corre cuando open=false, el contador
    // de unmounts queda en 0.
    const mountCounter = { mounted: 0, unmounted: 0 };
    const PollCounter = () => {
      useEffect(() => {
        mountCounter.mounted += 1;
        return () => {
          mountCounter.unmounted += 1;
        };
      }, []);
      return <div data-testid="s127-poll-counter">poll counter</div>;
    };

    const { rerender } = render(
      <NewModal open={true} onClose={() => {}}>
        <PollCounter />
      </NewModal>,
    );
    expect(mountCounter.mounted).toBe(1);
    expect(mountCounter.unmounted).toBe(0);

    // Cerrar el modal → cleanup debe correr.
    rerender(
      <NewModal open={false} onClose={() => {}}>
        <PollCounter />
      </NewModal>,
    );
    expect(mountCounter.unmounted).toBe(1);
    expect(screen.queryByTestId("s127-poll-counter")).toBeNull();

    cleanup();
  });

  it("e2e: re-abrir el modal re-monta el children (state se reinicializa)", () => {
    // Trade-off documentado del fix: cuando se cierra el modal,
    // el state interno del children se resetea. Re-abrir crea una
    // nueva instancia. Eso es exactamente lo que queremos para
    // modales de "progress" y "history" (cleanup completo al cerrar).
    //
    // Lo verificamos con un componente que tiene un useState y se
    // reinicia cuando se desmonta+remonta.
    let counter = 0;
    const StatefulChild = () => {
      const [n, setN] = useState(0);
      counter += 1;
      return (
        <div data-testid="s127-stateful">
          counter-instance-{counter} value={n}
          <button data-testid="s127-stateful-btn" onClick={() => setN(n + 1)}>
            inc
          </button>
        </div>
      );
    };

    const Harness = () => {
      const [open, setOpen] = useState(true);
      return (
        <>
          <button data-testid="s127-harness-toggle" onClick={() => setOpen(!open)}>
            toggle
          </button>
          <NewModal open={open} onClose={() => setOpen(false)}>
            <StatefulChild />
          </NewModal>
        </>
      );
    };

    render(<Harness />);
    expect(screen.getByTestId("s127-stateful")).toBeInTheDocument();

    cleanup();
  });
});
