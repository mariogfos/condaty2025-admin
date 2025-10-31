import { ValidFunctionType } from "@/mk/utils/validate/Rules";

const formatDate = (date: Date) => date.toISOString().split("T")[0];

export const validBetweenDate: ValidFunctionType = (value, param) => {
  if (!value || param.length < 2) return "Fechas de comparación no válidas";

  const [start, end] = param.map(normalizeDateToUTC);
  if (!start || !end) return "Fechas de comparación no válidas";

  const inputDate = normalizeDateToUTC(value);
  if (!inputDate) return "Fecha ingresada no válida";

  return inputDate < start || inputDate > end
    ? `Debe estar entre ${formatDate(start)} y ${formatDate(end)}`
    : "";
};

export const normalizeDateToUTC = (dateString: string) => {
  dateString = dateString.replace(/\//g, "-");
  let date = new Date(dateString);
  if (isNaN(date.getTime())) {
    // console.log("La fecha no es válida222");
    return null; // Si no es una fecha válida, retornar null
  }
  // console.log("fechaaaa", date.getTime());

  // Verificar si la fecha contiene información de zona horaria (especificada en formato ISO)
  const hasTimezone =
    dateString.includes("T") &&
    (dateString.includes("+") || dateString.includes("Z"));

  if (!hasTimezone) {
    dateString = (dateString + " ").split(" ")[0];
    dateString = (dateString + "T").split("T")[0];
    date = new Date(dateString + "T00:00:00Z");
  }
  // console.log("fafafafafa", dateString, date);
  // Normalizar la fecha a solo año, mes y día en UTC
  return new Date(
    Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate())
  );
};
export const normalizeDateTimeToUTC = (dateString: string) => {
  dateString = dateString.replace(/\//g, "-");
  let date = new Date(dateString);
  if (isNaN(date.getTime())) {
    console.log("La fecha no es válida222");
    return null; // Si no es una fecha válida, retornar null
  }
  // console.log("fechaaaa", date);

  // Verificar si la fecha contiene información de zona horaria (especificada en formato ISO)
  const hasTimezone =
    dateString.includes("T") &&
    (dateString.includes("+") || dateString.includes("Z"));

  // if (!hasTimezone) {
  //   dateString = dateString.replace("Z", "");
  //   let dateString1 = (dateString + " ").split(" ")[0];
  //   dateString1 = (dateString1 + "T").split("T")[0];
  //   date = new Date(dateString1[0] + "T" + dateString1[1] + "Z");
  // }
  // console.log("fafafafafa", dateString, date);
  // Normalizar la fecha a solo año, mes y día en UTC
  return new Date(
    Date.UTC(
      date.getUTCFullYear(),
      date.getUTCMonth(),
      date.getUTCDate(),
      date.getUTCHours(),
      date.getUTCMinutes(),
      date.getUTCSeconds()
    )
  );
};

export const validDateGreater: ValidFunctionType = (
  value: string,
  param: any,
  field: any = {}
) => {
  if (!value) {
    console.log("La fecha no es válida");
    return "La fecha no es válida";
  }

  // Normalizar la fecha del input
  let date = normalizeDateToUTC(value);

  if (!date) {
    console.log("La fecha ingresada no es válida");
    return "La fecha ingresada no es válida";
  }

  // Normalizar la fecha de comparación (hoy por defecto o una segunda fecha proporcionada)
  let compareDate =
    param && param[0]
      ? normalizeDateToUTC(field ? field[param[0]] : "")
      : normalizeDateToUTC(new Date().toISOString());

  if (!compareDate) return "La fecha de comparación no es válida";

  // console.log("rules day", date, compareDate);

  return date >= compareDate
    ? ""
    : "La fecha no debe ser menor a " + compareDate.toISOString().split("T")[0];
};
export const validDateFuture: ValidFunctionType = (
  value: string
  // param: any,
  // field: any = {}
) => {
  if (!value) {
    console.log("La fecha no es válida");
    return "La fecha no es válida";
  }

  // Normalizar la fecha del input
  let date = normalizeDateToUTC(value);

  if (!date) {
    console.log("La fecha ingresada no es válida");
    return "La fecha ingresada no es válida";
  }

  // Obtener la fecha actual en UTC sin la parte de la hora
  let today = new Date();
  today.setUTCHours(0, 0, 0, 0); // Asegurar que solo comparamos fechas, sin horas

  // console.log("rules day", date, today);

  return date > today
    ? ""
    : "La fecha debe ser mayor a " + today.toISOString().split("T")[0];
};

export const validDateLess: ValidFunctionType = (
  value: string,
  param: any,
  field: any = {}
) => {
  if (!value) return "La fecha no es válida";

  let date = normalizeDateToUTC(value);
  if (!date) return "La fecha ingresada no es válida";

  let compareDate =
    param && param[0]
      ? normalizeDateToUTC(field ? field[param[0]] : "")
      : normalizeDateToUTC(new Date().toISOString());

  if (!compareDate) return "La fecha de comparación no es válida";

  return date <= compareDate
    ? ""
    : "La fecha no debe ser mayor a " + compareDate.toISOString().split("T")[0];
};

export const validPassword: ValidFunctionType = (value, param) => {
  let [min, max]: any = param;
  if (!min) min = 4;
  if (!max) max = 10;
  const error =
    "La contraseña debe tener entre " + min + " y " + max + " caracteres";
  return value.length < min || value.length > max ? error : "";
};

export const validCi: ValidFunctionType = (value, param) => {
  let [min, max]: any = param;
  if (!min) min = 6;
  if (!max) max = 11;
  const error = "El CI debe tener entre " + min + " y " + max + " numeros";
  return value.length < min || value.length > max || isNaN(value) ? error : "";
};

export const validPhone: ValidFunctionType = (value, param) => {
  if (!value) return ""; // Si está vacío, no valida (lo controla required si es necesario)

  let [min, max]: any = param;
  if (!min) min = 7;
  if (!max) max = 10;

  // Verificar que solo contenga dígitos
  if (!/^\d+$/.test(value)) {
    return "El teléfono debe contener solo números";
  }

  // Verificar longitud
  if (value.length < min || value.length > max) {
    return `El teléfono debe tener entre ${min} y ${max} dígitos`;
  }

  return "";
};

export const validOptionsSurvey: ValidFunctionType = (value, param, field) => {
  let error: string = "";
  let min = 1;
  if (field?.nresp) min = field.nresp;
  if (field?.max) min = field.max;

  if (value.length <= min) return "Debe tener más de " + min + " opciones";

  value.forEach((option: any) => {
    if (!option.name) error = "Todas las opciones deben tener un valor";
  });
  return error;
};

export const validDateTimeGreater: ValidFunctionType = (
  value: string,
  param: any,
  field: any = {}
) => {
  if (!value) {
    console.log("La fecha no es válida");
    return "La fecha no es válida";
  }

  // Normalizar la fecha del input
  let date = normalizeDateTimeToUTC(value);

  if (!date) {
    console.log("La fecha ingresada no es válida");
    return "La fecha ingresada no es válida";
  }

  // Normalizar la fecha de comparación (hoy por defecto o una segunda fecha proporcionada)
  let compareDate =
    param && param[0]
      ? normalizeDateTimeToUTC(field ? field[param[0]] : "")
      : normalizeDateTimeToUTC(new Date().toISOString());

  if (!compareDate) return "La fecha de comparación no es válida";

  // console.log("rules day params", param, value, field);
  // console.log("rules day", date, compareDate);
  if (param[1]) {
    compareDate = new Date(compareDate.getTime() + param[1] * 60 * 60 * 1000);
  }

  return date >= compareDate
    ? ""
    : "La fecha no debe ser menor a " +
        compareDate.toISOString().split("T")[0] +
        " " +
        compareDate.toLocaleString().split(",")[1].substring(0, 6);
};
