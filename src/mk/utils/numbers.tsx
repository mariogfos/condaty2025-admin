export const formatNumber = (num: any, dec = 2, sepDec = ".", sepMil = ",") => {
  if (isNaN(Number(num))) return Number(0).toFixed(dec);
  let numFormat = Number(num).toFixed(dec).split(".");
  numFormat[0] = numFormat[0].replace(/\B(?=(\d{3})+(?!\d))/g, sepMil);
  return numFormat.join(sepDec);
};

export function formatNumberWithComma(value: string | number, decimals = 2) {
  let formattedValue = Number(value).toFixed(decimals);
  formattedValue = formattedValue.replace(".", ","); // Reemplaza punto por coma
  return formattedValue.replace(/\B(?=(\d{3})+(?!\d))/g, "."); // Agrega puntos para los miles
}
export const formatBs = (value: number | string): string => {
  if (value === null || value === undefined || value === "") return "Bs 0.00";
  const num = typeof value === "string" ? parseFloat(value.replace(/,/g, '')) : value;
  if (isNaN(num)) return "Bs 0.00";
  return (
    "Bs " + num.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })
  );
};

