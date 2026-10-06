import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import fs from "node:fs";
import path from "node:path";
import { qrStateColumn } from "../QrStateColumn";
import { BankAccountStatus } from "../Type/BankType";

/**
 * The list column, taken from the SAME function the screen spreads into its
 * `fields` — not a copy built here.
 *
 * 🔴 The previous version of this file drew its own column with the helpers,
 * and passed while the screen had no QR column at all (admin#822 never added
 * it to `fields`; admin#934 left it out). A test that builds the thing it
 * measures measures nothing.
 */
const EQUIPO_CONDATY = { fosrole_id: 3 };
const ADM_DEL_CONDOMINIO = { fosrole_id: null };

const LaColumna = ({ cuenta }: { cuenta: any }) => {
  const column = (qrStateColumn(EQUIPO_CONDATY) as any).qr_dynamic_status;
  return column.list.onRender({ item: cuenta });
};

const unaCuenta = (extra: Record<string, unknown> = {}) => ({
  qr_dynamic_status: BankAccountStatus.ACTIVE,
  qr_dynamic_bank_id: 3,
  qr_dynamic_account_reference: "CTA-001",
  qr_dynamic_has_credentials: true,
  ...extra,
});

describe("La columna de QR dinámico del listado de cuentas", () => {
  it("una cuenta lista se ve activa", () => {
    render(<LaColumna cuenta={unaCuenta()} />);
    expect(screen.getByText("Activo")).toBeInTheDocument();
  });

  /**
   * 🔴🔴 Lo que esta columna existe para mostrar.
   *
   * Una cuenta encendida a la que le faltan las credenciales NO puede cobrar.
   * Sin distinguirla, se ve igual que una lista y el operador se entera el día
   * que un residente aprieta «pagar».
   */
  it("una cuenta encendida sin credenciales se ve incompleta, no activa", () => {
    render(<LaColumna cuenta={unaCuenta({ qr_dynamic_has_credentials: false })} />);

    expect(screen.getByText("Incompleto")).toBeInTheDocument();
    expect(screen.queryByText("Activo")).toBeNull();
  });

  it("una cuenta apagada se ve deshabilitada", () => {
    render(
      <LaColumna
        cuenta={unaCuenta({ qr_dynamic_status: BankAccountStatus.INACTIVE })}
      />,
    );
    expect(screen.getByText("Deshabilitado")).toBeInTheDocument();
  });

  /** Una cuenta que nunca se configuró tampoco rompe la tabla. */
  it("una cuenta sin nada de QR se ve deshabilitada", () => {
    render(<LaColumna cuenta={{ alias_holder: "Cuenta vieja" }} />);
    expect(screen.getByText("Deshabilitado")).toBeInTheDocument();
  });
});

describe("Quién ve la columna de QR", () => {
  it("el equipo de Condaty la ve", () => {
    expect(qrStateColumn(EQUIPO_CONDATY)).toHaveProperty("qr_dynamic_status");
  });

  /** 🔴 Un ADM de condominio nunca ve la configuración del QR: la API se la niega igual. */
  it("un ADM de condominio no la ve, ni con fosrole_id en 0", () => {
    expect(qrStateColumn(ADM_DEL_CONDOMINIO)).toEqual({});
    expect(qrStateColumn({ fosrole_id: 0 })).toEqual({});
    expect(qrStateColumn(null)).toEqual({});
  });

  /**
   * And the screen actually spreads it into its fields. A source pin, read
   * without comments (skill rule 173): the docblock above talks about it.
   */
  it("la pantalla la agrega a sus fields", () => {
    const source = fs
      .readFileSync(path.join(__dirname, "../BankAccounts.tsx"), "utf-8")
      .replace(/\/\*[\s\S]*?\*\//g, "")
      .replace(/^\s*\/\/.*$/gm, "");
    expect(source).toMatch(/\.\.\.qrStateColumn\(user\)/);
  });
});
