import React from "react";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

import BudgetApprovalView from "@/modulos/Budget/BudgetDir/RenderView/BudgetDirApprovalModal";
import SurveyStatusActions from "@/modulos/Surveys/components/RenderView/SurveyStatusActions";
import VotersListModal from "@/modulos/Surveys/components/VotersListModal/VotersListModal";
import { SurveyStatus } from "@/modulos/Surveys/types/surveys.types";

/**
 * 🔴 Estas llamadas iban SIN `v3/`, y en el API esas rutas no existen.
 *
 * Medido con `php artisan route:list` de condaty-api (`dev`, 2026-09-29): las
 * encuestas, el cambio de estado del presupuesto, las demos, la config del QR
 * por cuenta y el probador del banco viven SÓLO bajo `api/v3/…`. No hay alias
 * legacy ni `Route::fallback`: `/api/surveys/5/status` o `/api/change-budget`
 * contestan 404.
 *
 * ⚠️ Y no se veía: el modal del presupuesto muestra «aprobado correctamente»
 * aunque la respuesta venga vacía, y los de encuestas simplemente no hacen nada
 * cuando `success` no llega.
 *
 * Se mide la URL con la que se llama a `execute`, no el texto del archivo,
 * donde se puede renderizar barato. Los componentes grandes (el detalle de la
 * asamblea, el tablero de encuestas, demos, QR, probador) se pinean por texto
 * al final.
 */

const mockExecute = vi.fn();

vi.mock("@/mk/hooks/useAxios", () => ({
  default: () => ({ execute: mockExecute }),
}));

vi.mock("@/mk/contexts/AuthProvider", () => ({
  useAuth: () => ({ showToast: vi.fn() }),
}));

vi.mock("@/mk/hooks/useInstantMsg", () => ({
  default: () => ({ notifySegmented: vi.fn(), notifyAll: vi.fn() }),
}));

// El avatar pide el contexto del visor de imágenes; acá no aporta nada.
vi.mock("@/mk/components/ui/Avatar/Avatar", () => ({ Avatar: () => null }));

beforeEach(() => {
  mockExecute.mockReset();
  mockExecute.mockResolvedValue({ data: { success: true, data: {} }, error: null });
});

describe("las llamadas van por la ruta v3 que el API sí tiene", () => {
  it("aprobar un presupuesto pega a /v3/budgets/change-budget", async () => {
    const execute = vi.fn().mockResolvedValue({ data: { success: true } });

    render(
      <BudgetApprovalView
        open
        onClose={vi.fn()}
        item={{ id: 7, status: "P" }}
        execute={execute}
        reLoad={vi.fn()}
        showToast={vi.fn()}
      />,
    );
    fireEvent.click(screen.getByText("Aprobar"));

    await waitFor(() => expect(execute).toHaveBeenCalled());
    expect(execute).toHaveBeenCalledWith(
      "/v3/budgets/change-budget",
      "POST",
      { status: "A", id: 7, comment: "" },
      false,
      true,
    );
  });

  it("cambiar el estado de una encuesta pega a /v3/surveys/{id}/status", async () => {
    render(
      <SurveyStatusActions
        surveyId={5}
        currentStatus={SurveyStatus.Active}
        onStatusChanged={vi.fn()}
      />,
    );
    fireEvent.click(screen.getByText("Pausar"));

    await waitFor(() => expect(mockExecute).toHaveBeenCalled());
    expect(mockExecute.mock.calls[0][0]).toBe("/v3/surveys/5/status");
    expect(mockExecute.mock.calls[0][1]).toBe("PUT");
  });

  it("duplicar una encuesta pega a /v3/surveys/{id}/duplicate", async () => {
    render(
      <SurveyStatusActions
        surveyId={5}
        currentStatus={SurveyStatus.Closed}
        onStatusChanged={vi.fn()}
      />,
    );
    fireEvent.click(screen.getByText("Duplicar"));

    await waitFor(() => expect(mockExecute).toHaveBeenCalled());
    expect(mockExecute.mock.calls[0][0]).toBe("/v3/surveys/5/duplicate");
    expect(mockExecute.mock.calls[0][1]).toBe("POST");
  });

  it("los votantes de una opción se piden a /v3/surveys/soptions/{id}/voters", async () => {
    render(
      <VotersListModal
        open
        onClose={vi.fn()}
        soptionId={9}
        soptionText="Sí"
        totalVoters={0}
      />,
    );

    await waitFor(() => expect(mockExecute).toHaveBeenCalled());
    expect(mockExecute).toHaveBeenCalledWith("/v3/surveys/soptions/9/voters", "GET");
  });
});

/**
 * Los que no se renderizan acá: se pinea que no vuelva el path sin `v3`, y
 * que el `v3` siga estando —si no, el test pasaría también borrando la
 * llamada—.
 */
const PINES: Array<[archivo: string, sinV3: RegExp, conV3: string]> = [
  [
    "src/modulos/Assemblies/components/AssemblyDetail/AssemblyDetail.tsx",
    /["'`]\/surveys\//,
    "`/v3/surveys/",
  ],
  [
    "src/modulos/Surveys/components/SurveyDashboard/SurveyDashboard.tsx",
    /["'`]\/surveys\//,
    "`/v3/surveys/ai-reports`",
  ],
  ["src/modulos/Demos/Demos.tsx", /["'`]\/demos\b/, '"/v3/demos"'],
  [
    "src/modulos/QrDinamico/QrAccountConfig/QrAccountConfig.tsx",
    /["'`]\/qr-dynamic\//,
    "`/v3/qr-dynamic/accounts/",
  ],
  [
    "src/modulos/BankProviderTester/BankProviderTester.tsx",
    /["'`]\/bank-qr\//,
    '"/v3/bank-qr/authenticate"',
  ],
];

describe("los componentes grandes tampoco vuelven a la ruta sin v3", () => {
  it.each(PINES)("%s", (archivo, sinV3, conV3) => {
    const texto = readFileSync(join(process.cwd(), archivo), "utf8");

    expect(texto).not.toMatch(sinV3);
    expect(texto).toContain(conV3);
  });
});
