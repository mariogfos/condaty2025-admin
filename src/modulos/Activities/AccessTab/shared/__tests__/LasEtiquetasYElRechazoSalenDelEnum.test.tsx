import { describe, expect, it } from "vitest";
import { render, screen } from "@testing-library/react";

import {
  ACCESS_TYPE_LABEL,
  AccessConfirmation,
  AccessType,
} from "../accessEnums";
import {
  fueRechazado,
  getAccessStatusInfo,
  getAccessTypeLabel,
} from "../accessDetailUtils";
import AccessTable from "@/modulos/DashDptos/AccessTable/AccessTable";
import { ImageModalProvider } from "@/contexts/ImageModalContext";

/**
 * Lo que este archivo cuida NO es "que los números sean números".
 *
 * Cuida las dos formas en que el char sobrevivió al flip del 2026-08-09:
 *
 *  1. **Tablas de etiquetas escritas a mano.** Había cinco copias del mapa
 *     `type → texto`, y ninguna las tenía todas. La de `HistoryAccess` listaba
 *     P/I/G/C y mandaba el resto al `else`, que renderizaba un "No hay
 *     registros de visitas" DENTRO de la columna de tipo. Un acceso con QR
 *     frecuente decía que no había visitas, con la fila entera al lado.
 *
 *  2. **La condición de rechazo copiada.** Vivía cuatro veces entre el detalle
 *     y el modal, comparando contra `'N'`. Son DOS rechazos distintos —el del
 *     residente en `confirm` y el del guardia en `rejected_guard_id`— y la
 *     pantalla los muestra igual.
 */

describe("las etiquetas de tipo de acceso", () => {
  it("cubren TODOS los casos del enum, no los que alguien se acordó de escribir", () => {
    const tipos = Object.values(AccessType).filter(
      (v): v is AccessType => typeof v === "number",
    );

    expect(tipos.length).toBeGreaterThan(0);

    for (const tipo of tipos) {
      expect(
        ACCESS_TYPE_LABEL[tipo],
        `AccessType ${AccessType[tipo]} (${tipo}) no tiene etiqueta`,
      ).toBeTruthy();
    }
  });

  /**
   * ⚠️ Acá se mide `AccessTable` y no `HistoryAccess`, aunque el bug feo esté
   * en el segundo: `HistoryAccess` no lo monta NADIE y encima importa un
   * `HistoryAccess.module.css` que no existe en el repo. Medir el archivo
   * muerto sería medir el camino que ningún usuario aprieta.
   *
   * `AccessTable` sí está vivo: lo monta `DashDptos`.
   */
  it("la tabla del dashboard etiqueta un QR frecuente, no un guión", () => {
    render(
      <ImageModalProvider>
        <AccessTable
        access={[
          {
            id: 1,
            type: AccessType.QR_FREQUENT,
            visit: { name: "Ana", last_name: "Vera", ci: "123" },
            owner: { name: "Luis", last_name: "Paz", ci: "456" },
            in_at: "2026-08-09 10:00:00",
            out_at: null,
          },
          ]}
        />
      </ImageModalProvider>,
    );

    // 🔴 Con la tabla escrita a mano, `QR_FREQUENT` no estaba y la celda de
    // tipo salía vacía. Reinyectar el mapa viejo deja este `getByText` en rojo.
    expect(screen.getByText("QR frecuente")).toBeTruthy();
  });
});

/**
 * Los dos que sobrevivieron al flip DENTRO de `accessDetailUtils`, que es el
 * módulo que ya estaba convertido. Las dos veces la letra estaba del lado
 * izquierdo de un lookup —una clave de objeto y un `Set`— y no de una
 * comparación, así que el barrido por `=== 'X'` no las veía.
 */
describe("el detalle de acceso, después del flip", () => {
  const tipos = Object.values(AccessType).filter(
    (v): v is AccessType => typeof v === "number",
  );

  it("etiqueta el tipo de CUALQUIER acceso, no sólo el pedido", () => {
    for (const tipo of tipos) {
      const label = getAccessTypeLabel(tipo, {});
      expect(label, `AccessType ${AccessType[tipo]} salió "${label}"`).not.toBe(
        "-/-",
      );
    }
  });

  /**
   * ⚠️ Acá hay que elegir bien el caso, porque la mitad del bug daba el valor
   * correcto por casualidad: con un `confirm = SÍ` la pantalla decía "Por
   * entrar" igual, y `getRequestActorInfo` cae a "Residente" por defecto, que
   * es JUSTO lo que devolvía cuando andaba. Un test con esos datos queda verde
   * con el bug puesto — lo probé.
   *
   * Lo que de verdad se movía es un acceso con QR y SIN `confirm`: la
   * invitación ya viene autorizada, nadie la confirma. Ahí la fuente de
   * aprobación es lo ÚNICO que sostiene el estado.
   */
  it.each([
    ["un QR individual", AccessType.QR_INDIVIDUAL],
    ["un QR grupal", AccessType.QR_GROUP],
    ["un QR frecuente", AccessType.QR_FREQUENT],
    ["una llave QR", AccessType.QR_KEY],
    ["un pedido", AccessType.ORDER],
  ])("%s sin confirmar está 'Por entrar', no 'Por confirmar'", (_, tipo) => {
    const info = getAccessStatusInfo({
      type: tipo,
      confirm: null,
      confirm_at: null,
      in_at: null,
      out_at: null,
    });

    expect(info.label).toBe("Por entrar");
  });
});

describe("fueRechazado", () => {
  it("es true cuando lo rechazó el residente", () => {
    expect(fueRechazado({ confirm: AccessConfirmation.NO })).toBe(true);
  });

  it("es true cuando lo rechazó el guardia, aunque el residente haya dicho que sí", () => {
    expect(
      fueRechazado({
        confirm: AccessConfirmation.YES,
        rejected_guard_id: "g-1",
      }),
    ).toBe(true);
  });

  it("es false cuando el residente aceptó y ningún guardia rechazó", () => {
    expect(
      fueRechazado({ confirm: AccessConfirmation.YES, rejected_guard_id: null }),
    ).toBe(false);
  });

  it("es false con un acceso vacío", () => {
    expect(fueRechazado(null)).toBe(false);
    expect(fueRechazado({})).toBe(false);
  });
});
