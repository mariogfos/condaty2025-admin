/**
 * S_front (front) - Source-parsing pin para HALLAZGO-NEW-39 (front variant).
 *
 * Problema: el front pineaba `item?.status === '<char>'` (char legacy 'A'/'I'/'X'/'W')
 * contra Models del back con enum cast TINYINT (S17-T3/S6.5). Pre-S17 (cuando
 * la columna era CHAR(1)), el char matcheaba. Post-S17, el back serializa el
 * int (e.g. `AreaStatus::ACTIVE` = 1) y el char nunca matchea en `===`.
 *
 * HALLAZGO-NEW-39 variant front: pines `status === '<char>'` o `status == '<char>'`
 * con Models del back que tienen enum cast TINYINT int-backed NUNCA matchean.
 * El label/UI muestra siempre el fallback (e.g. "Inactivo" en vez de "Activo").
 *
 * Patrón pineado: el back devuelve int 1/2/3 (no char 'A'/'W'/'X'/'I'). El
 * front debe comparar con el enum numérico (`AreaStatus.ACTIVE` = 1, no `'A'`).
 *
 * HALLAZGO-NEW-29: vitest con S118 S118b no los detecta. Usar SprintSFront*.
 *
 * HALLAZGO-NEW-03: source-parsing pinea INTENCIÓN. Los e2e con RTL pinean
 * EFECTIVIDAD. Este test es source-parsing puro.
 */
import { describe, it, expect } from "vitest";
import fs from "fs";
import path from "path";

const SRC_ROOT = path.resolve(__dirname, "../../..");

function readFile(relPath: string): string {
  return fs.readFileSync(path.join(SRC_ROOT, relPath), "utf-8");
}

describe("S_front — Status enum pinning (HALLAZGO-NEW-39 front variant)", () => {
  it("Areas.tsx: usa AreaStatus.ACTIVE/MAINTENANCE enum, NO char 'A'/'X'", () => {
    const src = readFile("modulos/Areas/Areas.tsx");
    // Debe pinear enum
    expect(src).toMatch(/AreaStatus\.ACTIVE/);
    expect(src).toMatch(/AreaStatus\.MAINTENANCE/);
    // NO debe pinear char 'A'/'X' en status comparison
    expect(src).not.toMatch(/status\s*===?\s*['"]A['"]/);
    expect(src).not.toMatch(/status\s*===?\s*['"]X['"]/);
  });

  it("Areas/FourPart.tsx: usa AreaStatus.ACTIVE enum, NO char 'A'", () => {
    const src = readFile("modulos/Areas/RenderForm/Partes/FourPart.tsx");
    expect(src).toMatch(/AreaStatus\.ACTIVE/);
    expect(src).not.toMatch(/status\s*==\s*['"]A['"]/);
  });

  it("CreateReserva.tsx: usa AreaStatus.ACTIVE enum, NO char 'A'", () => {
    const src = readFile("modulos/CreateReserva/CreateReserva.tsx");
    expect(src).toMatch(/AreaStatus\.ACTIVE/);
    expect(src).not.toMatch(/status\s*===\s*['"]A['"]/);
  });

  it("Outlays/RenderView.tsx: usa ExpenseStatus enum, NO char 'A'/'X'", () => {
    const src = readFile("modulos/Outlays/RenderView/RenderView.tsx");
    expect(src).toMatch(/ExpenseStatus\.ACTIVE/);
    expect(src).toMatch(/ExpenseStatus\.CANCELLED/);
    expect(src).not.toMatch(/status\s*===\s*['"]A['"]/);
    expect(src).not.toMatch(/status\s*===\s*['"]X['"]/);
  });

  it("HomeOwners.tsx: usa DptoStatus.ACTIVE enum, NO char 'A'", () => {
    const src = readFile("modulos/HomeOwners/HomeOwners.tsx");
    expect(src).toMatch(/DptoStatus\.ACTIVE/);
    expect(src).not.toMatch(/status\s*===\s*['"]A['"]/);
  });

  it("Owners.tsx: usa DptoStatus.ACTIVE + OwnerStatus.WAITING enum, NO char 'A'/'W'", () => {
    const src = readFile("modulos/Owners/Owners.tsx");
    expect(src).toMatch(/DptoStatus\.ACTIVE/);
    expect(src).toMatch(/OwnerStatus\.WAITING/);
    expect(src).not.toMatch(/status\s*===\s*['"]A['"]/);
    expect(src).not.toMatch(/status\s*===\s*['"]W['"]/);
  });

  it("OwnerManagers.tsx: usa ClientOwnerStatus.WAITING enum, NO char 'W'", () => {
    const src = readFile("modulos/OwnersManager/OwnerManagers.tsx");
    expect(src).toMatch(/ClientOwnerStatus\.WAITING/);
    expect(src).not.toMatch(/status\s*===\s*['"]W['"]/);
  });

  it("Owners/RenderView/RenderView.tsx: usa ClientOwnerStatus.WAITING enum, NO char 'W'", () => {
    const src = readFile("modulos/Owners/RenderView/RenderView.tsx");
    expect(src).toMatch(/ClientOwnerStatus\.WAITING/);
    expect(src).not.toMatch(/pivot\?\.status\s*===\s*['"]W['"]/);
  });

  it("Condominios.tsx: usa ClientStatus.INACTIVE enum (S135), NO char 'I'", () => {
    const src = readFile("modulos/Condominios/Condominios.tsx");
    expect(src).toMatch(/ClientStatus\.INACTIVE/);
    expect(src).not.toMatch(/status\s*==\s*['"]I['"]/);
  });

  it("PaymentType.tsx: enums extendidos con cases del back (S132, S135)", () => {
    const src = readFile("modulos/Payments/Type/PaymentType.tsx");
    // OwnerStatus: 4 cases (S132 pineó WAITING, PASSWORD_CHANGE_REQUIRED, DISABLED)
    expect(src).toMatch(/WAITING\s*=\s*2/);
    expect(src).toMatch(/PASSWORD_CHANGE_REQUIRED\s*=\s*3/);
    expect(src).toMatch(/DISABLED\s*=\s*4/);
    // DptoStatus: INACTIVE = 0 (S135 pineó)
    expect(src).toMatch(/INACTIVE\s*=\s*0/);
    // ClientStatus: creado en S_front (NUEVO, no existía en front)
    expect(src).toMatch(/export\s+enum\s+ClientStatus/);
  });
});
