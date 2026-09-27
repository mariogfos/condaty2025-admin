/**
 * Un admin sin `home:R` entra a la primera pantalla del menú que puede ver
 * (producción e5c1e06e), no a «sin acceso».
 */
import React from "react";
import { render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { getFirstAccessibleMenuRoute } from "../mainMenuConfig";

const replace = vi.fn();
let allowed = new Set<string>();

vi.mock("next/navigation", () => ({ useRouter: () => ({ replace }) }));
vi.mock("@/mk/contexts/AuthProvider", () => ({
  useAuth: () => ({ userCan: (perm: string) => allowed.has(perm) }),
}));
vi.mock("@/components/Index/Index", () => ({ default: () => <div>inicio</div> }));
vi.mock("@/components/auth/NotAccess/NotAccess", () => ({ default: () => <div>sin acceso</div> }));
vi.mock("@/components/req/Splash", () => ({ default: () => <div>cargando</div> }));

import Home from "@/app/page";

const can = (...perms: string[]) => (perm: string) => new Set(perms).has(perm);

describe("getFirstAccessibleMenuRoute", () => {
  it("sigue el orden del menú", () => {
    expect(getFirstAccessibleMenuRoute(can("guards", "alerts"))).toBe("/guards");
    expect(getFirstAccessibleMenuRoute(can("owners", "guards"))).toBe("/owners");
  });

  it("nunca devuelve Inicio, y null si no ve nada", () => {
    expect(getFirstAccessibleMenuRoute(can("home", "payments"))).toBe("/payments");
    expect(getFirstAccessibleMenuRoute(() => false)).toBeNull();
  });
});

describe("Inicio", () => {
  beforeEach(() => replace.mockReset());

  it("con home:R muestra Inicio", () => {
    allowed = new Set(["home", "guards"]);
    render(<Home />);
    expect(screen.getByText("inicio")).toBeInTheDocument();
    expect(replace).not.toHaveBeenCalled();
  });

  it("sin home:R lleva a la primera pantalla permitida", () => {
    allowed = new Set(["reservations"]);
    render(<Home />);
    expect(replace).toHaveBeenCalledWith("/reservas");
    expect(screen.queryByText("sin acceso")).toBeNull();
  });

  it("sin ninguna pantalla, «sin acceso»", () => {
    allowed = new Set();
    render(<Home />);
    expect(screen.getByText("sin acceso")).toBeInTheDocument();
    expect(replace).not.toHaveBeenCalled();
  });
});
