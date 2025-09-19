export const statusForgiveness: any = {
  A: "Por cobrar",
  P: "Cobrado",
  X: "Cancelado",
  M: "En mora",
  E: "Por subir comprobante",
  S: "Por confirmar",
};
export const colorStatusForgiveness: any = {
  //   A: { color: "#1E8AE9", bg: "#517FE133" },
  A: { color: "var(--cWarning)", bg: "var(--cHoverWarning)" },
  P: { color: "var(--cSuccess)", bg: "var(--cHoverSuccess)" },
  X: { color: "var(--cError)", bg: "var(--cHoverError)" },
  M: { color: "var(--cWarning)", bg: "var(--cHoverWarning)" },
  E: { color: "var(--cInfo)", bg: "var(--cHoverInfo)" },
  S: { color: "var(--cInfo)", bg: "var(--cHoverInfo)" },
};
