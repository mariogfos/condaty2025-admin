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

export let hours = [
  { id: "00:00", name: "00:00" },
  { id: "01:00", name: "01:00" },
  { id: "02:00", name: "02:00" },
  { id: "03:00", name: "03:00" },
  { id: "04:00", name: "04:00" },
  { id: "05:00", name: "05:00" },
  { id: "06:00", name: "06:00" },
  { id: "07:00", name: "07:00" },
  { id: "08:00", name: "08:00" },
  { id: "09:00", name: "09:00" },
  { id: "10:00", name: "10:00" },
  { id: "11:00", name: "11:00" },
  { id: "12:00", name: "12:00" },
  { id: "13:00", name: "13:00" },
  { id: "14:00", name: "14:00" },
  { id: "15:00", name: "15:00" },
  { id: "16:00", name: "16:00" },
  { id: "17:00", name: "17:00" },
  { id: "18:00", name: "18:00" },
  { id: "19:00", name: "19:00" },
  { id: "20:00", name: "20:00" },
  { id: "21:00", name: "21:00" },
  { id: "22:00", name: "22:00" },
  { id: "23:00", name: "23:00" },
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
export const lStatusActive: any = {
  A: { name: "Activo" },
  X: { name: "Inactivo" },
  W: { name: "Por activar" },
  P: { name: "Debe cambiar contraseña" },
  // en un futuro el estado inactivo se manejara de acuerdo al campo delete_at
};
export const lComDestinies: any = [
  { id: "T", name: "Todos" },
  { id: "D", name: "Departamentos" },
  { id: "G", name: "Guardias" },
  { id: "R", name: "Residentes" },
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
export const UnitsType: any = {
  D: "Departamento",
  C: "Casa",
  L: "Lote",
  O: "Oficina",
  _D: "Piso",
  _C: "Calle",
  _L: "Calle/Mz",
  _O: "Piso",
};

export const StatusDetailExpColor: any = {
  A: "var(--cWhiteV1)", // por cobrar
  E: "var(--cWhiteV1)", // espera
  P: "var(--cSuccess)", //pagado
  S: "var(--cWarning)",
  M: "var(--cError)", //
  R: "var(--cError)", // rechazado
};

//Expensas

interface Assigned {
  id: number;
  debt_id: string;
  amount: number;
  penalty_amount: number;
  status: string;
}

type AssignedList = Assigned[];
interface Debt {
  id: string;
  clientId: string;
  amount: number;
  asignados: AssignedList;
  begin_at: string | null;
  categoryId: number;
  created_at: string;
  deleted_at: string | null;
  description: string;
  due_at: string;
  month: number;
  status: string;
  updated_at: string;
  year: number;
}

const today = new Date();
export const units = (unidades: AssignedList) => {
  return unidades.length;
};
export const sumExpenses = (unidades: AssignedList) => {
  let sum = 0;
  unidades.map((uni) => {
    sum = sum + Number(uni.amount);
  });
  return sum;
};
export const paidUnits = (unidades: AssignedList) => {
  let cont = 0;
  unidades.map((uni) => {
    // && uni.status != "X"
    if (uni.status == "P") {
      cont = cont + 1;
    }
  });

  return cont;
};
export const sumPaidUnits = (unidades: AssignedList) => {
  let sum = 0;
  unidades.map((uni) => {
    if (uni.status == "P") {
      sum += Number(uni.amount) + Number(uni.penalty_amount);
    }
  });
  return sum;
};

export const unitsPayable = (unidades: AssignedList) => {
  let cont = 0;
  // let c = "";
  unidades.map((uni) => {
    if (uni.status != "P" && uni.status != "X") {
      cont = cont + 1;
    }
  });
  // return c;
  return cont;
};
export const isUnitInDefault = (props: Debt) => {
  return unitsPayable(props?.asignados) > 0 && new Date(props?.due_at) < today;
};
export const sumPenalty = (unidades: AssignedList) => {
  let sum: number = 0;
  unidades.map((uni) => {
    sum = sum + Number(uni.penalty_amount);
  });
  return sum;
};
