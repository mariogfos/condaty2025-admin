import { leerElErrorDelApi } from "@/mk/hooks/useCrud/leerElErrorDelApi";

export const SEND_TO_APPROVAL_FALLBACK =
  "No se pudieron enviar los presupuestos a aprobación.";

/**
 * Manda los borradores a aprobación y avisa lo que respondió el API.
 *
 * 🔴 `execute` de `useAxios` NO lanza: un no-2xx vuelve en
 * `{ data: null, error }`. Desde el 2026-09-30 el API contesta **422** cuando
 * no hay borradores (antes, 200 con `success: false`), y la pantalla leía
 * `error.message` —el de axios, «Request failed with status code 422»— en vez
 * del motivo. Se lee igual que el modal de la Directiva (admin#932): sin
 * `success: true` no hay éxito, y el texto sale de `leerElErrorDelApi`.
 *
 * Vive fuera de `Budget.tsx` para poder medirla sin montar `useCrud`.
 *
 * @returns `true` si el API confirmó el envío.
 */
// ⚠️ `Function` y no una firma: es como `useCrud` tipa `execute` y
// `showToast`, y cualquier firma más estrecha no acepta lo que devuelve.
export const sendToApproval = async (
  execute: Function,
  showToast: Function,
): Promise<boolean> => {
  const { data: response, error } = await execute(
    "/v3/budgets/send-budget-approval",
    "POST",
    {},
    false,
    false,
  );

  if (error || response?.success !== true) {
    showToast(
      leerElErrorDelApi(response, error, SEND_TO_APPROVAL_FALLBACK).mensaje,
      "error",
    );
    return false;
  }

  showToast(
    response?.message || "Presupuestos enviados a aprobación exitosamente.",
    "success",
  );
  return true;
};
