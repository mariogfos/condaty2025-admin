/**
 * The system campaign (`default`). The API falls back to it for every
 * condominium without a campaign and every new condominium is born pointing to
 * it (`Campaign::DEFAULT_ID` in condaty-api), so it is never deletable — the
 * API refuses it since 2026-10-08.
 */
export const DEFAULT_CAMPAIGN_ID = 1;

/**
 * Whether the screen offers «Eliminar». A campaign in use is not deletable
 * (the API refuses it too), and neither is the system one: before 2026-10-08
 * the button showed as soon as no condominium used it.
 */
export const isCampaignDeletable = (item: {
  id?: number | string;
  clients_count?: number;
}): boolean =>
  Number(item?.id) !== DEFAULT_CAMPAIGN_ID && !(Number(item?.clients_count) > 0);
