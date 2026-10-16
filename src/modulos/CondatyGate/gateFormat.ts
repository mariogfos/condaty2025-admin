export const date = (value?: string | null) => value ? new Date(value).toLocaleString("es-BO", { timeZone: "America/La_Paz" }) : "Sin sincronización";
