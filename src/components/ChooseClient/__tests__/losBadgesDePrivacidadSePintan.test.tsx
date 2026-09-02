/**
 * CDT-115 — los dos badges del selector de condominios no se pintaban nunca.
 *
 * Comparaban contra los chars viejos (`"P"` y `"T"`) y `privacy` pasó a enum
 * numérico en #725. Una comparación contra un valor que ya no llega NO da
 * error: simplemente no entra nunca, así que en pantalla no se ve rota — se ve
 * sin badge, que es indistinguible de «este condominio no tiene marca».
 *
 * 🔴 Lo que se perdía no era decorativo: «Prueba» marca los 3 condominios de
 * prueba sobre 37, para que nadie los confunda con uno real.
 *
 * ⚠️ Esta pantalla lee de `user.clients`, no de un pedido propio, así que no
 * aparece en ningún barrido del módulo Condominios. Por eso el corte a enums
 * la dejó atrás y los tres tests de sincronía del SSoT siguieron en verde: el
 * SSoT pinea las DEFINICIONES, y esto era una COMPARACIÓN.
 */
import React from "react";
import { render, screen, cleanup } from "@testing-library/react";
import { describe, it, expect, vi, afterEach } from "vitest";
import { ClientPrivacy, ClientType } from "@/modulos/Payments/Type/PaymentType";

// ⚠️ El `type` iba como `"U"` y `"C"` —los chars viejos— en el fixture del test
// que se escribió justamente para cerrar las comparaciones contra chars. Un
// fixture que manda lo que el API ya no manda no puede destapar nada: `type`
// también es enum numérico (`Client.php:67`, `'type' => ClientType::class`), y
// con el char puesto la comparación rota de al lado seguía invisible.
const condominios = [
  { id: 1, name: "Urubó Village", type: ClientType.CONDOMINIO, privacy: ClientPrivacy.PUBLICO },
  { id: 2, name: "Condominio de prueba", type: ClientType.EDIFICIO, privacy: ClientPrivacy.PRUEBA },
];

vi.mock("@/mk/contexts/AuthProvider", () => ({
  useAuth: () => ({
    user: { clients: condominios },
    setStore: vi.fn(),
    store: {},
    showToast: vi.fn(),
  }),
}));

// El Avatar arrastra el Image compartido, que exige `ImageModalProvider`. No
// es lo que este test mide, así que se dobla — igual que en los otros tests
// que montan pantallas con listado.
vi.mock("@/mk/components/ui/Avatar/Avatar", () => ({
  Avatar: () => <div />,
}));

vi.mock("@/i18n/useScopedI18n", () => ({
  useScopedI18n: () => ({
    locale: "es",
    localeTag: "es-BO",
    translate: (k: string) => k,
  }),
}));

import ChooseClient from "../ChooseClient";

afterEach(() => cleanup());

describe("CDT-115 — el selector marca cuál condominio es público y cuál de prueba", () => {
  it("pinta «Público» para el enum 1 y «Prueba» para el 2", () => {
    render(<ChooseClient open onClose={() => {}} />);

    // Canario: si el listado no se pintó, las dos aserciones de abajo pasarían
    // por ausencia y el test no mediría nada.
    expect(screen.getByText("Urubó Village")).toBeInTheDocument();
    expect(screen.getByText("Condominio de prueba")).toBeInTheDocument();

    expect(screen.getByText("Público")).toBeInTheDocument();
    expect(screen.getByText("Prueba")).toBeInTheDocument();
  });

  /**
   * El pin que importa: los valores del enum son NÚMEROS. Si alguien vuelve a
   * comparar contra un char, este caso no cambia —seguiría sin badge— pero el
   * de arriba se pone rojo. Éste fija la otra punta: que los chars viejos ya
   * NO produzcan badge, para que una migración a medias no quede muda.
   */
  it("los valores viejos en char ya no pintan nada", () => {
    condominios[0].privacy = "P" as unknown as ClientPrivacy;
    condominios[1].privacy = "T" as unknown as ClientPrivacy;
    render(<ChooseClient open onClose={() => {}} />);

    expect(screen.getByText("Urubó Village")).toBeInTheDocument();
    expect(screen.queryByText("Público")).not.toBeInTheDocument();
    expect(screen.queryByText("Prueba")).not.toBeInTheDocument();

    condominios[0].privacy = ClientPrivacy.PUBLICO;
    condominios[1].privacy = ClientPrivacy.PRUEBA;
  });
});
