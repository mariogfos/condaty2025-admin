/**
 * Las tres tarjetas del detalle de una compartida: cobradas, por cobrar y en
 * mora, con su importe, su conteo y el denominador de la barra.
 *
 * ## 🔴🔴 Por qué existe: el conteo salía NEGATIVO
 *
 * El cálculo vivía adentro del componente y hacía esto:
 *
 * ```ts
 * const total   = extraData.totalReceivable || 0;
 * const pending = total - collected - arrears;
 * ```
 *
 * `totalReceivable` **nunca fue el total del grupo**: es el conteo de lo que
 * está por cobrarse. Restarle las cobradas y las vencidas da un número que no
 * significa nada — y con la mayoría del grupo ya pagada, da **negativo**. Un
 * grupo de 10 deudas con 5 cobradas, 2 vencidas y 3 por vencer mostraba
 * «POR COBRAR: -4 En total».
 *
 * ## La regla
 *
 * 🔴 **Mario, 2026-08-22**: *«la deuda debe ser la deuda más la mora, y si
 * corresponde el mantenimiento de valor»*. El API la aplica en las tres
 * tarjetas, y **«Por cobrar» incluye lo vencido**: su importe y su conteo
 * cuentan las mismas deudas.
 *
 * Así que «En mora» es un **subconjunto** de «Por cobrar», no una tercera
 * columna aparte — igual que en la pantalla principal de Deudas, que muestra
 * `receivable`/`totalReceivable` como par.
 *
 * El denominador de las barras es el grupo entero: lo que falta cobrar más lo
 * ya cobrado.
 *
 * 🔴 Reinyectando la cuenta vieja: **3 rojos**. Los otros tres no pueden
 * distinguirla —miden los importes y el sobre vacío— y por eso valen: dicen que
 * el arreglo no emparejó mal los importes con los conteos.
 */

export interface TarjetaDelGrupo {
  amount: number;
  count: number;
  total: number;
}

export interface LasTresTarjetas {
  cobradas: TarjetaDelGrupo;
  porCobrar: TarjetaDelGrupo;
  enMora: TarjetaDelGrupo;
}

const numero = (valor: unknown): number => {
  const n = typeof valor === "number" ? valor : parseFloat(String(valor ?? "0"));

  return Number.isFinite(n) ? n : 0;
};

export const lasTresTarjetasDelGrupo = (extraData: any): LasTresTarjetas => {
  const porCobrarCount = Math.trunc(numero(extraData?.totalReceivable));
  const cobradasCount = Math.trunc(numero(extraData?.totalCollected));
  const enMoraCount = Math.trunc(numero(extraData?.totalArrears));

  // ⚠️ El grupo entero: lo que falta cobrar (vencido incluido) más lo cobrado.
  // Las vencidas NO se suman aparte — ya están dentro de `totalReceivable`.
  const total = porCobrarCount + cobradasCount;

  return {
    cobradas: {
      amount: numero(extraData?.collected),
      count: cobradasCount,
      total,
    },
    porCobrar: {
      amount: numero(extraData?.receivable),
      count: porCobrarCount,
      total,
    },
    enMora: {
      amount: numero(extraData?.arrears),
      count: enMoraCount,
      total,
    },
  };
};
