/**
 * CDT-95 — los cuatro modales dejaban un temporizador vivo al desmontarse.
 *
 * Los cuatro tienen el mismo efecto: al abrirse programan `setOpenModal(true)`
 * a los 80–100 ms, y ninguno lo cancelaba. Si el modal se desmonta antes
 * —cerrar, navegar, o el `cleanup` de un test—, ese `setState` corre igual
 * sobre algo que ya no existe.
 *
 * 🔴 POR QUÉ SE MIDE ACÁ Y NO CORRIENDO LA SUITE. En la suite el síntoma es un
 * `ReferenceError: window is not defined` que vitest cuenta como error no
 * manejado: la suite sale con código 1 CON TODOS LOS TESTS EN VERDE, y se lo
 * cuelga al archivo que esté corriendo cuando el temporizador vence, no al
 * culpable. Pero aparece sólo si el temporizador vence justo después de que
 * jsdom se desarmó: lo vi UNA vez, y con el bug puesto no volvió a salir en
 * ocho corridas seguidas. Un defecto que se reproduce una de cada diez
 * corridas no se pinea corriendo la suite — se pinea acá, contando el
 * temporizador pendiente después del desmontaje.
 *
 * ⚠️ `DataModal` renderiza `DetailModal` adentro, así que su caso cubre a los
 * dos. Los otros dos van por separado porque nadie los monta desde acá.
 */
import React from "react";
import { render, cleanup } from "@testing-library/react";
import { describe, it, expect, vi, afterEach } from "vitest";
import DataModal from "../DataModal/DataModal";
import DetailModal from "../DetailModal/DetailModal";
import NewModal from "../NewModal/NewModal";
import DataModalV2 from "../DataModalV2/DataModalV2";

vi.mock("@/mk/hooks/useScreenSize", () => ({
  useScreenSize: () => ({ isMobile: false, width: 1280 }),
}));

const LOS_CUATRO = [
  ["DataModal", DataModal],
  ["DetailModal", DetailModal],
  ["NewModal", NewModal],
  ["DataModalV2", DataModalV2],
] as const;

afterEach(() => {
  cleanup();
  vi.useRealTimers();
});

describe("CDT-95 — los modales no dejan temporizadores vivos al desmontarse", () => {
  it.each(LOS_CUATRO)(
    "%s: desmontarse antes de la apertura cancela su temporizador",
    (_nombre, Modal: any) => {
      vi.useFakeTimers();

      const { unmount } = render(
        <Modal open onClose={() => {}} title="Cualquiera">
          <p>contenido</p>
        </Modal>,
      );

      // El efecto ya programó la apertura: hay un temporizador pendiente.
      expect(vi.getTimerCount()).toBeGreaterThan(0);

      unmount();

      // 🔴 Acá vivía el defecto: sin el `clearTimeout` del efecto, el
      // temporizador sigue pendiente después del desmontaje y su `setState`
      // corre igual, sobre un componente que ya no está.
      expect(vi.getTimerCount()).toBe(0);
    },
  );
});
