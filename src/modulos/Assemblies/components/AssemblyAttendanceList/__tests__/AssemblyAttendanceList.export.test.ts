import { describe, it, expect } from "vitest";
import { readFileSync } from "fs";
import { join } from "path";

/**
 * AssemblyAttendanceList.export migration test (S38.5)
 *
 * Verifica que el componente `AssemblyAttendanceList.tsx` pineá los slots
 * correctos para el flow async de export de attendees (S32 + S38 backend
 * `AssemblyAttendancesReportType`).
 *
 * Test de imports (grep) en lugar de RTL porque el componente es complejo
 * (carga attendees, renderiza lista, etc.) y el comportamiento del
 * `AsyncExportButton` ya está testeado en S33. Solo necesitamos verificar
 * que AssemblyAttendanceList pineá los slots correctos.
 *
 * @see D-38-8 — refactor handleExportPdf → useAsyncExport
 * @see HALLAZGO-NEW-58 — pattern slot async reusable
 */
describe("AssemblyAttendanceList export migration (S38.5)", () => {
  const filePath = join(__dirname, "../AssemblyAttendanceList.tsx");
  const source = readFileSync(filePath, "utf-8");

  it("NO usa useAxios para exportAttendances (legacy flow eliminado, D-38-8)", () => {
    // Pre-S38.5 pineá `const { execute: exportAttendances } = useAxios()`
    // y llamaba a `GET /assemblies/{id}/export-attendances` (Dompdf sync).
    // Post-S38.5: el export va por el flow async canónico
    // (POST /api/v3/reports/assemblies-attendances/export + polling).
    expect(source).not.toMatch(/exportAttendances/);
  });

  it("NO tiene handleExportPdf legacy (D-38-8 cleanup)", () => {
    // Pre-S38.5: handleExportPdf async function que llamaba a exportAttendances
    // y renderizaba un link <a> manual. Post-S38.5: AsyncExportButton encapsula
    // el flow completo (POST + polling + download modal).
    expect(source).not.toMatch(/handleExportPdf/);
  });

  it("NO usa IconDownload legacy (reemplazado por AsyncExportButton)", () => {
    // Pre-S38.5: `<IconDownload size={...} />` en el JSX.
    // Post-S38.5: `<AsyncExportButton>` con icono `Download` interno.
    // Regex específico para evitar matchear el comentario que lo nombra.
    expect(source).not.toMatch(/<IconDownload\s+size/);
  });

  it("USA AsyncExportButton para el flow async (S33 + S38.5)", () => {
    // Post-S38.5: import de AsyncExportButton + render condicional.
    expect(source).toMatch(/import AsyncExportButton/);
    expect(source).toMatch(/<AsyncExportButton/);
  });

  it("PASA assembly_id como param (D-38-4 fail loud match)", () => {
    // S38 backend AssemblyAttendancesReportType requiere `assembly_id` en
    // params (D-38-4). Si no se pineá, el job tira InvalidArgumentException.
    // El frontend pineá via `params={{ assembly_id: assemblyId }}`.
    expect(source).toMatch(/type="assemblies-attendances"/);
    expect(source).toMatch(/assembly_id: assemblyId/);
  });
});
