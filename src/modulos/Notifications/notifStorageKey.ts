/**
 * 🔴 What the bell remembers («last seen», «already read») belongs to ONE
 * administrator in ONE condominium.
 *
 * The keys were global to the browser. `notifId` is an id of the whole table
 * (it grows across the 38 condominiums), so seeing the bell of condominium A
 * —where the newest id is higher— made the badge of condominium B say there
 * was nothing new: 10 administrators work in more than one condominium.
 *
 * ⚠️ Without a condominium in the session (a superadmin before choosing one)
 * it falls back to the old global key.
 */
export const notifStorageKey = (base: string, user: any): string =>
  user?.id && user?.client_id ? `${base}:${user.client_id}:${user.id}` : base;
