import { describe, it, expect } from "vitest";
import { getOutlaysMod } from "../outlaysMod";

/**
 * outlaysMod test (S43 + S118b)
 *
 * Verifica que el factory `getOutlaysMod()` retorna el `mod` literal
 * con los slots async pineados correctamente. Patrón idéntico al
 * `bankAccountsMod.test.ts` de S41 + `defaultersMod.test.ts` de S38.5
 * + `payments.config.test.ts` de S37.5.
 *
 * S41 discovery (binding, cross-project): `Outlays.tsx` pinea
 * `modulo: "v3/expenses"` + `permiso: "outlays"`. Es un alias del
 * módulo Expenses canónico.
 *
 * S118b: el `type` cambia de "expenses" a "outlays" para matchear el
 * nuevo `OutlaysReportType` del back (que pineá gastos del condominio,
 * tabla `expenses`).
 *
 * Fase 6 (2026-08-04): Egresos migró al motor declarativo. El `endpoint`
 * pineado manda el export por la lista, y el título ya no viaja desde acá:
 * lo declara `OutlaysExportConfig::title()` en el back.
 *
 * @see HALLAZGO-NEW-57 (binding, cross-project) — OutlaysReportType canónico
 * @see D-37.5-3 (S37.5) — factory pattern para configs `mod`
 */
describe("Outlays mod config (S43 + S118b)", () => {
  it("mod.export = false (kill legacy IconExport, S43 D-38-5 pattern)", () => {
    // Pre-S43 pineaba `export: true` (BC) sin `mod.exportAsync`.
    // Post-S43: `export: false` (kill legacy) + `exportAsync: {...}` (async).
    const mod = getOutlaysMod();
    expect(mod.export).toBe(false);
  });

  it("mod.exportAsync.type = 'outlays' (matchea OutlaysReportType S118b)", () => {
    // S118b: type cambió de 'expenses' a 'outlays' para matchear el
    // nuevo `OutlaysReportType` del back (que pineá gastos, NO deudas).
    // El módulo 'Expenses' (deudas) usa type='expenses' (otro ReportType).
    const mod = getOutlaysMod();
    expect(mod.exportAsync?.type).toBe("outlays");
  });

  it("mod.exportAsync.format = 'pdf' (ReportGenerator S32, S43 backend)", () => {
    // PDF → ReportGenerator chunked (S32 D-32). XLSX también soportado
    // (S43 pineá excelRowProvider) pero default es PDF.
    const mod = getOutlaysMod();
    expect(mod.exportAsync?.format).toBe("pdf");
  });

  /**
   * Fase 6: el botón dejó de prometer un formato único porque pasó a ser
   * un menú (pdf / xlsx / csv, más los customs que el back declare).
   */
  it("el label no promete un formato unico", () => {
    const mod = getOutlaysMod();
    expect(mod.exportAsync?.label).toBe("Exportar");
    expect(mod.exportAsync?.supportedFormats?.length).toBeGreaterThan(1);
  });

  /**
   * 🔴 Éste es el pin de la migración de Fase 6.
   *
   * Con `endpoint` el export sale por la LISTA (`GET /v3/expenses?_export=`)
   * y lo atiende el motor declarativo. Sin `endpoint`, `useAsyncExport` cae
   * al flow por type (`POST /v3/reports/outlays/export`), que resuelve
   * contra el registry legacy — donde el OutlaysReportType ya no existe.
   * O sea: borrarlo rompe la exportación de Egresos entera, y nada más en
   * el front lo notaría.
   */
  it("pinea el endpoint de la lista para salir por el motor nuevo", () => {
    const mod = getOutlaysMod();
    expect(mod.exportAsync?.endpoint).toBe("/v3/expenses");
  });

  /**
   * Fase 6: el título del reporte lo declara el back en
   * `OutlaysExportConfig::title()`. Antes el front lo mandaba por
   * `extraParams` y el back lo leía de `params['title']` — dos lugares
   * donde cambiar lo mismo, y ganaba el de afuera.
   *
   * El módulo del back es la única fuente de verdad del export: columnas,
   * relaciones y título. La query sale del `beforeList` del controller.
   */
  it("no manda el titulo: lo declara el back", () => {
    const mod = getOutlaysMod();
    expect(mod.exportAsync?.extraParams?.title).toBeUndefined();
  });

  /**
   * 🔴 CDT-37 + CDT-39 — el pin que impide que esto vuelva a pasar.
   *
   * Cuando el `mod` se mudó de `Outlays.tsx` a esta factory (ed9beaf6), la
   * mudanza perdió CINCO claves y nada avisó: no hay tipo que las exija, el
   * módulo siguió compilando y la lista siguió andando. El agujero vivió 23
   * días con el registro de egresos bloqueado (sin `renderForm`, la
   * Subcategoría no ofrecía nada) y el detalle en pantalla negra (sin
   * `renderView`, el Detail genérico explotaba con el `user` objeto).
   *
   * Las pantallas propias del módulo se prueban en `__tests__/` del módulo, que
   * es donde se mide el comportamiento. Esto de acá es más chico y más bruto: la
   * próxima mudanza de este objeto se pone ROJA en vez de borrar una clave en
   * silencio.
   */
  it("declara sus pantallas propias y los titulos de sus acciones", () => {
    const mod = getOutlaysMod();

    // Lo que exige `CrudRendererHost`: o una función, o un componente envuelto
    // en `memo` (un objeto con `.type` función). RenderView y RenderDel son
    // `memo`, RenderForm no — por eso no alcanza con `toBeTypeOf("function")`.
    const esRenderizable = (renderer: any) =>
      typeof renderer === "function" || typeof renderer?.type === "function";

    expect(esRenderizable(mod.renderForm)).toBe(true);
    expect(esRenderizable(mod.renderView)).toBe(true);
    expect(esRenderizable(mod.renderDel)).toBe(true);
    expect(mod.titleAdd).toBe("Nuevo");
    expect(mod.titleDel).toBe("Anular");
  });
});
