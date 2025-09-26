export const statusForgiveness: any = {
  A: "Por cobrar",
  P: "Cobrado",
  X: "Cancelado",
  M: "En mora",
  E: "Por subir comprobante",
  S: "Por confirmar",
  W: "Por confirmar Dir.",
};
export const statusForgivenessFilter: any = [
  { id: "ALL", name: "Todos" },
  { id: "A", name: "Por cobrar" },
  { id: "P", name: "Cobrado" },
  { id: "X", name: "Cancelado" },
  { id: "M", name: "En mora" },
  // { id: "E", name: "Por subir comprobante" },
  { id: "S", name: "Por confirmar" },
  { id: "W", name: "Por confirmar Dir." },
];
export const colorStatusForgiveness: any = {
  //   A: { color: "#1E8AE9", bg: "#517FE133" },
  A: { color: "var(--cWarning)", bg: "var(--cHoverWarning)" },
  P: { color: "var(--cSuccess)", bg: "var(--cHoverSuccess)" },
  X: { color: "var(--cError)", bg: "var(--cHoverError)" },
  M: { color: "var(--cError)", bg: "var(--cHoverError)" },
  E: { color: "var(--cInfo)", bg: "var(--cHoverInfo)" },
  S: { color: "var(--cInfo)", bg: "#39ACEC33" },
  W: { color: "#1E8AE9", bg: "#517FE133" },
};
