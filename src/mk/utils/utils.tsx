export const throttle = (func: Function, delay: number) => {
  let lastCall: number = 0;
  return function (...args: any) {
    const now: number = new Date().getTime();
    if (delay > now - lastCall) {
      return;
    }
    lastCall = now;
    func(...args);
  };
};

export const debounce = (func: Function, delay: number) => {
  let timeoutId: any;
  return function (...args: any) {
    clearTimeout(timeoutId);
    timeoutId = setTimeout(() => {
      func(...args);
    }, delay);
  };
};

export const isProbablyReactComponent = (prop: any) => {
  return (
    typeof prop === "function" &&
    prop.name &&
    prop.name[0] === prop.name[0].toUpperCase()
  );
};

export const isFunction = (prop: any) => {
  return typeof prop === "function" && !isProbablyReactComponent(prop);
};

export const RandomsColors = [
  "var(--cRandom1)",
  "var(--cRandom2)",
  "var(--cRandom3)",
  "var(--cRandom4)",
  "var(--cRandom5)",
  "var(--cRandom6)",
  "var(--cRandom7)",
  "var(--cRandom8)",
  "var(--cRandom9)",
  "var(--cRandom10)",
  "var(--cRandom11)",
  "var(--cRandom12)",
  "var(--cRandom13)",
  "var(--cRandom14)",
  "var(--cRandom15)",
  "var(--cRandom16)",
  "var(--cRandom17)",
  "var(--cRandom18)",
  "var(--cRandom19)",
];

export let lGreader = [
  { id: "M", name: "Hombres" },
  { id: "F", name: "Mujeres" },
  { id: "X", name: "Prefiero no decirlo" },
];
export let lAges = [
  { id: "18-20", name: "18-20" },
  { id: "21-30", name: "21-30" },
  { id: "31-40", name: "31-40" },
  { id: "41-50", name: "41-50" },
  { id: "51-60", name: "51-60" },
  { id: "61-70", name: "61-70" },
  { id: "71-80", name: "71-80" },
  { id: "81+", name: "81+" },
];

export let lIdeologies = [
  { id: "-1", name: "" },
  { id: "0", name: "Izquierda" },
  { id: "1", name: "Centro-Izquierda" },
  { id: "2", name: "Centro" },
  { id: "3", name: "Centro-Derecha" },
  { id: "4", name: "Derecha" },
  { id: "5", name: "Extrema Izquierda" },
  { id: "6", name: "Extrema Derecha" },
  { id: "7", name: "Liberalismo" },
  { id: "8", name: "Conservadurismo" },
  { id: "9", name: "Socialismo" },
  { id: "10", name: "Comunismo" },
  { id: "11", name: "Anarquismo" },
  { id: "12", name: "Fascismo" },
  { id: "13", name: "Nacionalismo" },
  { id: "14", name: "Ecologismo" },
  { id: "15", name: "Libertarismo" },
  { id: "16", name: "Populismo" },
  { id: "17", name: "Progresismo" },
  { id: "18", name: "Neoliberalismo" },
  { id: "19", name: "Socialdemocracia" },
  { id: "20", name: "Democracia Cristiana" },
  { id: "21", name: "Marxismo" },
  { id: "22", name: "Feminismo" },
  { id: "23", name: "Monarquismo" },
  { id: "24", name: "Republicanismo" },
  { id: "25", name: "Herrerismo" },
];
export const statusTask: any = {
  P: "Pendiente",
  E: "En curso",
  F: "Finalizada",
  V: "Vencida",
  S: "Sin completar",
};
export const cStatusTask: any = {
  P: "var(--cBlackV2)",
  E: "var(--cAccent)",
  F: "var(--cSuccess)",
  V: "var(--cError)",
  S: "var(--cWarning)",
};
export const statusAc: any = {
  P: "Pendiente",
  E: "En curso",
  F: "Finalizada",
};
export const cStatusAc: any = {
  P: "var(--cBlackV2)",
  E: "var(--cAccent)",
  F: "var(--cSuccess)",
};
