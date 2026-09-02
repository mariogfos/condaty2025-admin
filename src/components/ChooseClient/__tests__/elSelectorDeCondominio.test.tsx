/**
 * El selector de condominio: el TIPO que muestra, y la carrera al cambiar.
 *
 * ────────────────────────────────────────────────────────────────────────
 * 🔴 LOS 37 CONDOMINIOS DECIAN "EDIFICIO"
 * ────────────────────────────────────────────────────────────────────────
 *
 * `c.type == "C"` y `== "U"` comparaban contra los valores viejos. `type` es un
 * enum numerico —`Client.php:67` lo castea con `'type' => ClientType::class`,
 * que Laravel serializa como `1` / `2`—, asi que las DOS ramas eran siempre
 * falsas y todo caia al `else`: los 23 condominios y los 14 edificios decian
 * lo mismo.
 *
 * Es EXACTAMENTE el defecto que el docblock de `ChooseClient` ya documentaba
 * para los dos badges de `privacy` (CDT-115)... y quedo vivo en la linea
 * siguiente. **Arreglar una comparacion no arregla a sus vecinas.**
 *
 * ⚠️ Y la rama "Urbanizacion" no existe: el enum tiene DOS casos, CONDOMINIO y
 * EDIFICIO. Comparaba contra una `"U"` que el API no manda ni mando nunca.
 *
 * ────────────────────────────────────────────────────────────────────────
 * 🔴 Y CAMBIAR DE CONDOMINIO DOS VECES ES UNA CARRERA
 * ────────────────────────────────────────────────────────────────────────
 *
 * El modal queda abierto y clickeable durante el `await getUser(id)`, que es un
 * request entero. Dos clicks despachan dos `getUser`, cada uno escribe el token
 * y el `condaty_client_id`, y **gana el que CONTESTA ultimo**. El usuario
 * apreto un condominio y puede terminar en el otro — que en multi-tenant es de
 * las cosas peores que pueden pasar.
 */
import React from "react";
import { render, screen, fireEvent, cleanup, waitFor } from "@testing-library/react";
import { describe, it, expect, vi, afterEach, beforeEach } from "vitest";
import { ClientPrivacy, ClientType } from "@/modulos/Payments/Type/PaymentType";

const getUser = vi.fn();

const condominios = [
  { id: "c1", name: "Torres del Sur", type: ClientType.CONDOMINIO, privacy: ClientPrivacy.PUBLICO },
  { id: "c2", name: "Edificio Central", type: ClientType.EDIFICIO, privacy: ClientPrivacy.PUBLICO },
];

vi.mock("@/mk/contexts/AuthProvider", () => ({
  useAuth: () => ({ user: { clients: condominios }, getUser }),
}));

vi.mock("@/mk/components/ui/Avatar/Avatar", () => ({ Avatar: () => <div /> }));

vi.mock("@/i18n/useScopedI18n", () => ({
  useScopedI18n: () => ({
    locale: "es",
    localeTag: "es-BO",
    translate: (k: string) => k,
  }),
}));

import ChooseClient from "../ChooseClient";

afterEach(() => cleanup());
beforeEach(() => {
  getUser.mockReset();
  getUser.mockResolvedValue(undefined);
});

describe("el tipo que muestra cada fila", () => {
  it("un condominio dice condominium y un edificio dice building", () => {
    render(<ChooseClient open onClose={() => {}} />);

    // Canario: si el listado no se pinto, las aserciones de abajo pasarian por
    // ausencia y el test no mediria nada.
    expect(screen.getByText("Torres del Sur")).toBeTruthy();

    expect(screen.getByText("condominium")).toBeTruthy();
    expect(screen.getByText("building")).toBeTruthy();
  });

  it("no ofrece la rama urbanization, que el enum no tiene", () => {
    render(<ChooseClient open onClose={() => {}} />);

    expect(screen.queryByText("urbanization")).toBeNull();
  });
});

describe("cambiar de condominio", () => {
  it("un segundo click mientras el primero viaja NO despacha otro getUser", async () => {
    let resolver: any;
    getUser.mockReturnValue(new Promise((r) => { resolver = r; }));

    render(<ChooseClient open onClose={() => {}} />);

    fireEvent.click(screen.getByText("Torres del Sur"));
    fireEvent.click(screen.getByText("Edificio Central"));

    // Sin la guarda habria DOS: gana el que conteste ultimo y el usuario puede
    // terminar en el condominio que NO apreto.
    expect(getUser).toHaveBeenCalledTimes(1);
    expect(getUser).toHaveBeenCalledWith("c1");

    resolver(undefined);
    await waitFor(() => expect(getUser).toHaveBeenCalledTimes(1));
  });
});
