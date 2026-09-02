/**
 * Cuando el API contesta "Acceso incorrecto", la sesion tiene que quedar
 * LIMPIA. Hoy revienta antes de limpiarla, y el token viejo se queda.
 *
 * ────────────────────────────────────────────────────────────────────────
 * 🔴 UN 200 CON `success: false` HACE QUE `error` SEA `null`
 * ────────────────────────────────────────────────────────────────────────
 *
 * `LoginBaseController::iam()` termina asi cuando el usuario no tiene acceso
 * al condominio (`isUserClientInvalid`):
 *
 *     return $this->sendError(INCORRECT_ACCESS, $error, 200);
 *
 * **HTTP 200** con `success: false`. Y `useAxios.execute()` solo llena `error`
 * cuando axios TIRA — o sea, cuando la respuesta no es 2xx:
 *
 *     } catch (err) { error = { message, data, status }; }
 *     return { data, error };
 *
 * Asi que en esa rama `data.success` es `false` y `error` es `null`.
 *
 * `AuthProvider.getUser()` entra al `else` y hace `error.status == 500`:
 * **TypeError**. Lo traga el `try/catch` de afuera (`currentUser = false`) y
 * la limpieza que venia despues —`localStorage.removeItem(CLAVE_DEL_TOKEN)` y
 * `removeItem("condaty_client_id")`— NO CORRE NUNCA.
 *
 * El usuario cae al login con el token viejo guardado. Al recargar pasa lo
 * mismo: mismo token, mismo 200, mismo TypeError. **No se destraba solo.**
 */
import React from "react";
import { render, waitFor } from "@testing-library/react";
import { describe, it, expect, vi, beforeEach } from "vitest";

// 🔴 `src/test/setup.ts` mockea `@/mk/contexts/AuthProvider` GLOBAL y sólo
// exporta `useAuth`: sin este `unmock`, `AuthProvider` no tiene default export
// y NINGÚN test del repo puede renderizarlo.
vi.unmock("@/mk/contexts/AuthProvider");

const execute = vi.fn();
const setWaiting = vi.fn();

vi.mock("../../hooks/useAxios", () => ({
  default: () => ({ error: "", loaded: true, execute, waiting: 0, setWaiting }),
}));
vi.mock("../../components/auth/Login", () => ({ default: () => <div>login</div> }));
vi.mock("../../../components/req/Splash", () => ({ default: () => <div>splash</div> }));
vi.mock("../../components/ui/Toast/ToastViewport", () => ({ default: () => null }));
vi.mock("next/navigation", () => ({ useRouter: () => ({ push: vi.fn() }) }));

import AuthProvider from "../AuthProvider";
import { CLAVE_DEL_TOKEN } from "@/mk/utils/claveDelToken";

const dejarUnaSesionGuardada = () => {
  localStorage.setItem(
    CLAVE_DEL_TOKEN,
    JSON.stringify({ token: "un-token-viejo", user: { id: "u1", client_id: "c1" } }),
  );
  localStorage.setItem("condaty_client_id", "c1");
};

describe("getUser cuando el API contesta Acceso incorrecto", () => {
  beforeEach(() => {
    localStorage.clear();
    execute.mockReset();
    setWaiting.mockReset();
  });

  it("borra el token y el condominio guardados", async () => {
    dejarUnaSesionGuardada();

    // El sobre REAL de `sendError(INCORRECT_ACCESS, $error, 200)`: 200, asi que
    // axios no tira y `error` queda en null.
    execute.mockResolvedValue({
      data: {
        success: false,
        message: "Acceso incorrecto",
        errors: { email: "No Tiene Accesos" },
      },
      error: null,
    });

    render(<AuthProvider>{null}</AuthProvider>);

    await waitFor(() => {
      expect(localStorage.getItem(CLAVE_DEL_TOKEN)).toBeNull();
    });
    expect(localStorage.getItem("condaty_client_id")).toBeNull();
  });

  /**
   * La otra mitad, y es OTRA rama: cuando el API si tira un 500, `error` viene
   * lleno y `error.status == 500` no revienta — pero ese camino hace
   * `setTimeout(...)` y `return` SIN bajar el contador.
   *
   * `waiting` es un acumulador global (`state + newWaiting`, en
   * `AxiosInstanceProvider`): un `+1` sin su `-1` se queda para siempre, y el
   * loader global no lo baja nadie.
   */
  it("con un 500 no deja colgado el contador global de espera", async () => {
    dejarUnaSesionGuardada();

    execute.mockResolvedValue({
      data: null,
      error: { message: "Server Error", data: {}, status: 500 },
    });

    render(<AuthProvider>{null}</AuthProvider>);

    // El camino del 500 arranca un `setTimeout` de 1s; el contador tiene que
    // quedar saldado sin esperarlo.
    await waitFor(() => {
      expect(setWaiting).toHaveBeenCalledWith(1, "getUser");
    });

    await waitFor(() => {
      const saldo = setWaiting.mock.calls.reduce(
        (total: number, [delta]: any[]) => total + Number(delta ?? 0),
        0,
      );
      expect(saldo).toBe(0);
    });
  });
});
