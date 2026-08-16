import { describe, expect, it } from "vitest";
import {
  buildDefaultOperationalPermissionsConfig,
  isPermisoOtorgado,
  normalizeOperationalPermissionsConfig,
} from "../operationalPermissions";

describe("isPermisoOtorgado", () => {
  // 🔴 Las cuatro columnas `owner_can_*_without_residence` son enums numéricos
  // desde 1: 1 = DENIED, 2 = GRANTED. La versión de producción de esta pantalla
  // las lee con `Number(value) === 1`, que con esta numeración es el caso
  // DENEGADO — mostraría habilitado justo lo que el condominio niega.
  it("lee 2 como otorgado y 1 como denegado", () => {
    expect(isPermisoOtorgado(2)).toBe(true);
    expect(isPermisoOtorgado("2")).toBe(true);
    expect(isPermisoOtorgado(1)).toBe(false);
    expect(isPermisoOtorgado("1")).toBe(false);
  });

  it("sigue aceptando las formas viejas que puede traer una respuesta anterior", () => {
    expect(isPermisoOtorgado(true)).toBe(true);
    expect(isPermisoOtorgado("Y")).toBe(true);
  });

  it("un dato ausente o basura no otorga", () => {
    expect(isPermisoOtorgado(undefined)).toBe(false);
    expect(isPermisoOtorgado(null)).toBe(false);
    expect(isPermisoOtorgado(0)).toBe(false);
    expect(isPermisoOtorgado("cualquier cosa")).toBe(false);
  });
});

describe("buildDefaultOperationalPermissionsConfig", () => {
  it("quien reside puede todo", () => {
    const config = buildDefaultOperationalPermissionsConfig({});

    expect(config.homeowner_resident.invitation).toBe(true);
    expect(config.tenant.alert).toBe(true);
    expect(config.tenant_dependent.reservation).toBe(true);
  });

  // Un permiso falla cerrado, igual que en el API: un condominio sin
  // configuración le niega al propietario no residente.
  it("sin configuración, el no residente no puede nada", () => {
    const config = buildDefaultOperationalPermissionsConfig({});

    expect(config.homeowner_non_resident.invitation).toBe(false);
    expect(config.homeowner_non_resident_dependent.alert).toBe(false);
  });

  it("y con las columnas cargadas toma su valor", () => {
    const config = buildDefaultOperationalPermissionsConfig({
      owner_can_invite_without_residence: 2, // GRANTED
      owner_can_alert_without_residence: 1, // DENIED
    });

    expect(config.homeowner_non_resident.invitation).toBe(true);
    expect(config.homeowner_non_resident.alert).toBe(false);
  });
});

describe("normalizeOperationalPermissionsConfig", () => {
  // ⚠️ Si la ausencia contara como false, un condominio con la matriz guardada
  // a medias apagaría permisos que nadie tocó.
  it("el JSON pisa sólo las claves que nombra", () => {
    const config = normalizeOperationalPermissionsConfig({
      tenant: { alert: false },
    });

    expect(config.tenant.alert).toBe(false);
    expect(config.tenant.invitation).toBe(true);
    expect(config.tenant.reservation).toBe(true);
  });

  it("acepta el JSON como string, que es como puede venir del API", () => {
    const config = normalizeOperationalPermissionsConfig(
      JSON.stringify({ tenant: { alert: false } }),
    );

    expect(config.tenant.alert).toBe(false);
  });

  it("un JSON roto no rompe la pantalla: cae a los defaults", () => {
    const config = normalizeOperationalPermissionsConfig("{no es json");

    expect(config.tenant.alert).toBe(true);
    expect(config.homeowner_non_resident.alert).toBe(false);
  });

  it("una clave que no es de la matriz se ignora", () => {
    const config = normalizeOperationalPermissionsConfig({
      rol_inventado: { invitation: true },
      tenant: { visitApproval: false },
    } as any);

    expect(config).not.toHaveProperty("rol_inventado");
    expect(config.tenant.visit_approval).toBe(true);
  });
});
