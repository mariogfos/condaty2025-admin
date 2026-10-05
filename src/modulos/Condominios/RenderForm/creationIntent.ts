// `type` and `privacy` are numeric enums in the API. The Select hands them over
// as strings; any other source (an intent stored before this shape, a Select
// that keeps numbers) can carry numbers. Both are the same intent.
export type CreationPayload = { name: string; type: string | number; privacy: string | number };
export type CreationIntent = { request_id: string; payload: CreationPayload };

const key = (actor: string) => `condaty:pending-condominium:v1:${actor}`;
// Preserve the intent across modal remounts even if browser storage is blocked.
const memoryFallback = new Map<string, CreationIntent>();

const isEnumValue = (value: unknown) => typeof value === "string" || typeof value === "number";

export function loadCreationIntent(actor: string): CreationIntent | null {
  try {
    const value = JSON.parse(sessionStorage.getItem(key(actor)) || "null");
    if (
      typeof value?.request_id === "string" &&
      /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(value.request_id) &&
      typeof value?.payload?.name === "string" &&
      isEnumValue(value?.payload?.type) &&
      isEnumValue(value?.payload?.privacy)
    ) return value;
  } catch { /* Fall back to this tab's memory; never invent another intent on retry. */ }
  return memoryFallback.get(actor) ?? null;
}

export function saveCreationIntent(actor: string, intent: CreationIntent): void {
  try {
    sessionStorage.setItem(key(actor), JSON.stringify(intent));
    memoryFallback.delete(actor);
  } catch { memoryFallback.set(actor, intent); }
}

export function clearCreationIntent(actor: string, requestId: string): void {
  if (loadCreationIntent(actor)?.request_id !== requestId) return;
  memoryFallback.delete(actor);
  try { sessionStorage.removeItem(key(actor)); } catch { /* Storage is blocked. */ }
}
