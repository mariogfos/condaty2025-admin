import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import {
  QR_ACCOUNT_STATE_COLOR,
  QR_ACCOUNT_STATE_LABEL,
  qrAccountState,
} from "@/modulos/QrDinamico/shared";
import { StatusBadge } from "@/components/StatusBadge/StatusBadge";
import { BankAccountStatus } from "../Type/BankType";

/**
 * La columna del listado, dibujada con las mismas piezas que la pantalla.
 *
 * ⚠️ Se arma acá en vez de montar `BankAccounts` entero: esa pantalla necesita
 * el CRUD, la sesión y media docena de contextos, y este test mide UNA
 * decisión — qué badge le toca a cada cuenta.
 */
const LaColumna = ({ cuenta }: { cuenta: any }) => {
  const estado = qrAccountState(cuenta);
  const color = QR_ACCOUNT_STATE_COLOR[estado];
  return (
    <StatusBadge color={color.color} backgroundColor={color.bg}>
      {QR_ACCOUNT_STATE_LABEL[estado]}
    </StatusBadge>
  );
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
