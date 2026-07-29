/**
 * S141-fe-3 (HALLAZGO-NEW-51, binding cross-project) — front pin
 *
 * Fixes 2 issues del backlog Mario 2026-07-28 (PRIORIDAD 2):
 *
 * **Issue #11 — Asistentes modal atrapado + layout** (HALLAZGO-NEW-51):
 * el modal de Exportar/Historial (ExportProgressModal + DownloadHistoryModal)
 * se rendereaba DENTRO del card PARTICIPANTES del detalle de Asamblea.
 * Bug clásico: un padre con `transform`, `filter`, `perspective`,
 * `will-change`, `contain: paint` o `backdrop-filter` rompe
 * `position: fixed` (el `position: fixed` del NewModal quedaba atrapado
 * en el stacking context del card). Resultado: el modal se abría chico,
 * atrapado dentro del card, sin cubrir el viewport.
 *
 * **Issue #11b — Botones con texto en card PARTICIPANTES** (solicitado
 * por Mario 2026-07-29): el card mostraba "Exportar PDF" + "Historial"
 * con texto. Mario pidió solo íconos para que el header del card no se
 * vea sobrecargado. El label sigue accesible vía `title` + `aria-label`.
 *
 * Fix de raíz (matamos la clase entera del bug):
 * 1. **NewModal pinea `createPortal(..., document.body)`** cuando
 *    `open=true` → el modal SIEMPRE se renderea al body, fuera de
 *    cualquier stacking context. Esto afecta a TODOS los modales del
 *    sistema (Asambleas, Pagos, Deudas, Outlays, etc.) — no solo
 *    Asambleas. Es el fix GLOBAL que mata la clase entera.
 * 2. **AsyncExportButton pinea `iconOnly?: boolean` prop** que esconde
 *    el label de texto y deja solo el ícono. Aplicado en
 *    `AssemblyAttendanceList.tsx` (card PARTICIPANTES).
 *
 * Patrón source-parsing: HALLAZGO-NEW-03 (binding, cross-project).
 * Diff in scope: 0 BC break (interface nueva con default false,
 * S140-fe-2 dedup KNOWN_TYPES MERGED, S140-bk #12 MERGED).
 */
import { describe, it, expect } from "vitest";
import * as fs from "node:fs";
import * as path from "node:path";

const FRONT_ROOT = path.resolve(__dirname, "../../..");

const readFile = (relPath: string): string => {
  const abs = path.join(FRONT_ROOT, relPath);
  return fs.readFileSync(abs, "utf8");
};

const stripComments = (source: string): string => {
  return source
    .replace(/\/\*[\s\S]*?\*\//g, "")
    .replace(/^\s*\/\/.*$/gm, "");
};

const loadSourceWithoutComments = (relPath: string): string => {
  return stripComments(readFile(relPath));
};

const NEWMODAL_PATH =
  "mk/components/ui/NewModal/NewModal.tsx";
const ASYNC_EXPORT_BUTTON_PATH =
  "mk/components/ui/AsyncExportButton/AsyncExportButton.tsx";
const ASYNC_EXPORT_BUTTON_CSS_PATH =
  "mk/components/ui/AsyncExportButton/AsyncExportButton.module.css";
const ASSEMBLY_ATTENDANCE_LIST_PATH =
  "modulos/Assemblies/components/AssemblyAttendanceList/AssemblyAttendanceList.tsx";

describe("S141-fe-3 — HALLAZGO-NEW-51 (modal portal + iconOnly)", () => {
  describe("Fix 1: NewModal pinea createPortal al body", () => {
    it("NewModal.tsx importa createPortal de react-dom", () => {
      const src = readFile(NEWMODAL_PATH);
      // El portal es la solución al bug clásico de stacking context.
      expect(src).toMatch(
        /import\s+\{\s*createPortal\s*\}\s+from\s+["']react-dom["']/,
      );
    });

    it("NewModal.tsx pinea createPortal(..., document.body) en el return", () => {
      const src = loadSourceWithoutComments(NEWMODAL_PATH);
      // El portal al body es lo que escapa el stacking context del card.
      expect(src).toMatch(
        /createPortal\s*\(\s*modalContent\s*,\s*document\.body\s*\)/,
      );
    });

    it("NewModal.tsx pinea guard SSR (mounted state + early return null)", () => {
      const src = loadSourceWithoutComments(NEWMODAL_PATH);
      // SSR safety: en el server `document` no existe → no pineamos portal.
      expect(src).toMatch(/const\s+\[mounted\s*,\s*setMounted\]\s*=\s*useState/);
      expect(src).toMatch(/if\s*\(\s*!mounted\s*\)\s+return\s+null/);
    });

    it("NewModal.tsx pinea pointerEvents: 'none' cuando open=false (no intercepta clicks)", () => {
      const src = loadSourceWithoutComments(NEWMODAL_PATH);
      // El wrapper invisible NO debe interceptar clicks cuando el modal
      // está "cerrado" (preservamos la animación de cierre con el
      // wrapper en el DOM, pero matamos los eventos).
      expect(src).toMatch(
        /pointerEvents:\s*open\s*\?\s*["']auto["']\s*:\s*["']none["']/,
      );
    });

    it("NewModal.tsx sigue pineando {open && children} (HALLAZGO-NEW-37 vigente)", () => {
      const src = loadSourceWithoutComments(NEWMODAL_PATH);
      // S127 (NEW-37): desmontar children cuando open=false mata
      // useEffect zombie (polling de DownloadHistory, useAsyncExport).
      // El fix de S141 NO debe revertir S127.
      expect(src).toMatch(/\{open\s*&&\s*children\}/);
    });
  });

  describe("Fix 2: AsyncExportButton pinea prop iconOnly", () => {
    it("AsyncExportButton.tsx declara prop iconOnly?: boolean", () => {
      const src = loadSourceWithoutComments(ASYNC_EXPORT_BUTTON_PATH);
      // Interface con default false → no rompe consumers existentes.
      expect(src).toMatch(/iconOnly\?\s*:\s*boolean/);
    });

    it("AsyncExportButton.tsx pinea default iconOnly = false", () => {
      const src = loadSourceWithoutComments(ASYNC_EXPORT_BUTTON_PATH);
      expect(src).toMatch(/iconOnly\s*=\s*false/);
    });

    it("AsyncExportButton.tsx pinea className iconOnly cuando iconOnly=true", () => {
      const src = loadSourceWithoutComments(ASYNC_EXPORT_BUTTON_PATH);
      // El CSS `.iconOnly` pinea width/height/padding compactos para
      // que el botón sea un "icon button" cuadrado (no stretched).
      expect(src).toMatch(/iconOnly\s*\?\s*styles\.iconOnly/);
    });

    it("AsyncExportButton.tsx pinea title + aria-label cuando iconOnly=true (a11y)", () => {
      const src = loadSourceWithoutComments(ASYNC_EXPORT_BUTTON_PATH);
      // A11y: el label sigue accesible vía title (tooltip) + aria-label
      // (screen reader) cuando el texto se esconde.
      expect(src).toMatch(/title=\{iconOnly\s*\?\s*label\s*:\s*undefined\}/);
      expect(src).toMatch(
        /aria-label=\{iconOnly\s*\?\s*label\s*:\s*undefined\}/,
      );
    });

    it("AsyncExportButton.tsx esconde label del botón principal cuando iconOnly=true", () => {
      const src = loadSourceWithoutComments(ASYNC_EXPORT_BUTTON_PATH);
      // Cuando iconOnly=true, NO rendereamos el texto del label.
      expect(src).toMatch(/\{!iconOnly\s*&&\s*label\}/);
    });

    it("AsyncExportButton.tsx esconde label 'Historial' cuando iconOnly=true", () => {
      const src = loadSourceWithoutComments(ASYNC_EXPORT_BUTTON_PATH);
      expect(src).toMatch(/\{!iconOnly\s*&&\s*["']Historial["']\}/);
    });

    it("AsyncExportButton.tsx CSS pinea .iconOnly cuadrado (36x36, padding 0)", () => {
      const css = readFile(ASYNC_EXPORT_BUTTON_CSS_PATH);
      // El icon button debe ser cuadrado y compacto, no stretched.
      expect(css).toMatch(/\.iconOnly\s*\{/);
      expect(css).toMatch(/width:\s*36px/);
      expect(css).toMatch(/height:\s*36px/);
      expect(css).toMatch(/padding:\s*0/);
      // flex: none evita que el botón estire a width: 100% en flex container.
      expect(css).toMatch(/flex:\s*none/);
    });
  });

  describe("Aplicación: AssemblyAttendanceList pinea iconOnly en card PARTICIPANTES", () => {
    it("AssemblyAttendanceList.tsx pasa iconOnly al AsyncExportButton", () => {
      const src = loadSourceWithoutComments(ASSEMBLY_ATTENDANCE_LIST_PATH);
      // El card PARTICIPANTES del detalle de Asamblea es el primer
      // consumer del iconOnly. Si alguien lo borra, el card vuelve
      // a mostrar "Exportar PDF" + "Historial" con texto y Mario se
      // enoja (PRIORIDAD 2 del backlog 2026-07-28).
      const asyncExportBlock = src.match(
        /<AsyncExportButton[\s\S]*?\/>/,
      );
      expect(asyncExportBlock).toBeTruthy();
      expect(asyncExportBlock![0]).toMatch(/iconOnly\b/);
      // No debe pinear `label="..."` con texto largo si es iconOnly
      // (defense in depth: el label visible ya no se renderea, pero
      // igual lo pineamos para `title` + `aria-label`).
      expect(asyncExportBlock![0]).toMatch(/label=/);
    });
  });

  describe("Pin genérico (matar la clase entera — cross-project)", () => {
    it(
      "Cualquier componente que pinea NewModal está dentro de un árbol " +
        "que rinde via portal (NewModal pinea createPortal). " +
        "Si alguien borra createPortal de NewModal, falla.",
      () => {
        // Verificamos que NewModal pinea createPortal. El test más
        // fuerte sería recorrer todos los consumers de NewModal y
        // verificar que cada uno pinea su modal con `createPortal`,
        // pero como NewModal es el ÚNICO punto donde pineamos todos
        // los modales del sistema, pineár `createPortal` ahí arregla
        // TODOS los consumers automáticamente.
        const src = loadSourceWithoutComments(NEWMODAL_PATH);
        expect(src).toMatch(/createPortal/);
      },
    );

    it(
      "Pin: ningún archivo fuera de NewModal.tsx pinea <NewModal ... /> " +
        "Y pinea su propio createPortal. El patrón canónico es: " +
        "NewModal pinea portal INTERNAMENTE, los consumers solo " +
        "pasan children. Si alguien pinea un createPortal duplicado " +
        "fuera de NewModal, hay doble portal → bug.",
      () => {
        // Sweep: el único archivo que puede pinear createPortal es NewModal.
        // Si otro componente pinea createPortal, hay doble portal.
        // (Este test es intencionalmente laxo: solo verifica que
        // AsyncExportButton y DownloadHistoryModal NO pinean
        // createPortal, porque ya está pineado en NewModal.)
        const aebSrc = loadSourceWithoutComments(ASYNC_EXPORT_BUTTON_PATH);
        const dhmPath =
          "mk/components/ui/DownloadHistory/DownloadHistoryModal.tsx";
        const dhmSrc = loadSourceWithoutComments(dhmPath);
        expect(aebSrc).not.toMatch(/createPortal/);
        expect(dhmSrc).not.toMatch(/createPortal/);
      },
    );
  });
});
