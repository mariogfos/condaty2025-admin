import { describe, it, expect } from "vitest";

import { accionDelDispositivo } from "../GuardDevices";

/**
 * El teléfono revocado ofrece una vuelta.
 *
 * 🔴 La fila de un dispositivo revocado mostraba un botón «Revocar»
 * **deshabilitado**: ninguna salida. Para devolver el teléfono al turno había
 * que generar otro código y volver a autorizarlo — que funciona, pero deja el
 * aparato como si fuera nuevo y pierde su historia.
 *
 * ⚠️ Los dos casos van juntos a propósito: un helper que devolviera siempre
 * `"reactivar"` pasaría el primero y le sacaría al administrador la única
 * forma de dar de baja un teléfono perdido.
 */
describe("la acción que ofrece la fila de un dispositivo", () => {
  it("uno revocado se puede reactivar", () => {
    expect(accionDelDispositivo({ revoked_at: "2026-09-01 10:00:00" })).toBe(
      "reactivar",
    );
  });

  it("uno vigente se puede revocar", () => {
    expect(accionDelDispositivo({ revoked_at: null })).toBe("revocar");
    expect(accionDelDispositivo({})).toBe("revocar");
  });

  // ⚠️ La fila puede llegar vacía mientras la tabla carga.
  it("sin fila no rompe", () => {
    expect(accionDelDispositivo(undefined)).toBe("revocar");
    expect(accionDelDispositivo(null)).toBe("revocar");
  });
});
