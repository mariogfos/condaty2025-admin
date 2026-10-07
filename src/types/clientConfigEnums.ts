/**
 * The enums of a condominium's configuration (`client_configs`), synced with
 * the API (`App\Modules\Clients\Enums`) through the cross-app SSoT.
 *
 * 🔴🔴 The seven switches were `tinyint(1)` 0/1 until 2026-10-07: the `1` that
 * meant ON is OFF now. That move does not blow up anywhere — every
 * `Number(x) === 1`, `!!x` or `x === true` keeps answering, the opposite — so a
 * switch is ALWAYS asked through `isSwitchOn()`.
 */
export enum ClientConfigSwitch {
  DISABLED = 1,
  ENABLED = 2,
}

/** The one question about a switch. What is not `ENABLED` —an old `1`, a `true`, nothing— is off. */
export const isSwitchOn = (value: unknown): boolean =>
  Number(value) === ClientConfigSwitch.ENABLED;

/** What the screen saves for a checkbox. */
export const toSwitch = (on: boolean): ClientConfigSwitch =>
  on ? ClientConfigSwitch.ENABLED : ClientConfigSwitch.DISABLED;

/**
 * What the debt breakdown of a unit adds in the resident's summary
 * (`client_configs.financial_mode`). Until 2026-10-07 the third mode was also
 * written `0`, and the select showed empty for those 10 condominiums.
 */
export enum FinancialMode {
  DEBT_ONLY = 1,
  DEBT_AND_PENALTY = 2,
  DEBT_PENALTY_AND_MAINTENANCE = 3,
}
