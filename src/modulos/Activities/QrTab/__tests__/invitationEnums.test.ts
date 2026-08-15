import { describe, expect, it } from "vitest";

import {
  INVITATION_TYPE_LABELS,
  InvitationStatus,
  InvitationType,
  esAnulada,
  esEstado,
  esFrecuente,
  esGrupal,
  esIndividual,
  esTipo,
} from "../invitationEnums";

/**
 * 🔴 Los números son un CONTRATO con el API, y este archivo era el único de los
 * cuatro espejos que no tenía **ningún** test.
 *
 * Los valores tienen que coincidir con `app/Modules/Invitation/Enums/*.php`.
 * Nada lo verifica al compilar: los repos no se compilan juntos y el payload
 * entra al front como `any`.
 */
describe("los valores, contra el API", () => {
  it("InvitationType", () => {
    expect(InvitationType.INDIVIDUAL).toBe(1);
    expect(InvitationType.GROUP).toBe(2);
    expect(InvitationType.FREQUENT).toBe(3);
  });

  it("InvitationStatus", () => {
    expect(InvitationStatus.ACTIVE).toBe(1);
    expect(InvitationStatus.INACTIVE).toBe(2);
    expect(InvitationStatus.USED).toBe(3);
    expect(InvitationStatus.CANCELLED).toBe(4);
  });

  /**
   * ⚠️ Ningún case vale 0, y no es casualidad: `0 == ""` es `true` en
   * JavaScript y el `Select` compartido del admin auto-elige la opción con id 0
   * como si el usuario la hubiera tocado. Ya mordió una vez (CDT-30).
   */
  it("ningún case vale 0", () => {
    const todos = [
      ...Object.values(InvitationType),
      ...Object.values(InvitationStatus),
    ];
    expect(todos).not.toContain(0);
  });

  /** Las mismas palabras que imprime `InvitacionesExportConfig` en el back. */
  it("las etiquetas cubren los tres tipos", () => {
    expect(INVITATION_TYPE_LABELS[InvitationType.INDIVIDUAL]).toBe("Individual");
    expect(INVITATION_TYPE_LABELS[InvitationType.GROUP]).toBe("Grupal");
    expect(INVITATION_TYPE_LABELS[InvitationType.FREQUENT]).toBe("Frecuente");
  });
});

/**
 * 🔴 El caso que motivó los helpers: el mismo campo llega como número o como
 * string según por dónde pasó. Un `===` pelado falla en el segundo caso sin
 * ningún error y ninguna fila resulta grupal.
 */
describe("los helpers toleran número y string", () => {
  it.each([
    ["número", 2],
    ["string", "2"],
  ])("reconoce una grupal que llegó como %s", (_etiqueta, valor) => {
    expect(esTipo(valor, InvitationType.GROUP)).toBe(true);
    expect(esTipo(valor, InvitationType.INDIVIDUAL)).toBe(false);
  });

  /**
   * 🔴 Sin la guarda de null, `Number(null)` es **0** y una invitación sin
   * `type` matchearía cualquier comparación contra 0.
   */
  it("un campo ausente no matchea nada", () => {
    for (const vacio of [null, undefined]) {
      expect(esTipo(vacio, InvitationType.GROUP)).toBe(false);
      expect(esEstado(vacio, InvitationStatus.ACTIVE)).toBe(false);
    }
  });

  it("la letra vieja ya no matchea", () => {
    expect(esTipo("G", InvitationType.GROUP)).toBe(false);
    expect(esEstado("X", InvitationStatus.CANCELLED)).toBe(false);
  });
});

/**
 * 🔴 **Este bloque es el que mide de verdad.**
 *
 * Que la traducción funcione no dice nada sobre si cada pantalla pide el case
 * correcto. Y acá el agujero era el más grande de los cuatro repos: `esTipo` y
 * `esEstado` reciben un `number` pelado, así que `esEstado(x,
 * InvitationType.GROUP)` compila —compara un estado contra un tipo— y `tsc` no
 * dice nada. En rnOwner y rnGuard eso al menos es un error de tipo.
 *
 * Cada predicado se afirma contra **todos** los cases, no sólo contra el suyo:
 * afirmar únicamente `esGrupal(2) === true` sigue pasando si alguien lo
 * reescribe como `>= 2`.
 */
describe("los predicados con nombre — que cada pantalla pida el case correcto", () => {
  const TIPOS = [
    ["individual", InvitationType.INDIVIDUAL],
    ["grupal", InvitationType.GROUP],
    ["frecuente", InvitationType.FREQUENT],
  ] as const;

  it.each(TIPOS)("esGrupal sólo con una %s", (etiqueta, tipo) => {
    expect(esGrupal(tipo)).toBe(etiqueta === "grupal");
  });

  it.each(TIPOS)("esIndividual sólo con una %s", (etiqueta, tipo) => {
    expect(esIndividual(tipo)).toBe(etiqueta === "individual");
  });

  it.each(TIPOS)("esFrecuente sólo con una %s", (etiqueta, tipo) => {
    expect(esFrecuente(tipo)).toBe(etiqueta === "frecuente");
  });

  it.each([
    ["activa", InvitationStatus.ACTIVE],
    ["inactiva", InvitationStatus.INACTIVE],
    ["usada", InvitationStatus.USED],
    ["anulada", InvitationStatus.CANCELLED],
  ] as const)("esAnulada sólo con una %s", (etiqueta, estado) => {
    expect(esAnulada(estado)).toBe(etiqueta === "anulada");
  });

  it("toleran el string y descartan el vacío", () => {
    expect(esGrupal("2")).toBe(true);
    expect(esAnulada("4")).toBe(true);
    expect(esGrupal(null)).toBe(false);
    expect(esAnulada(undefined)).toBe(false);
  });
});
