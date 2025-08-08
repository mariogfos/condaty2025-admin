export const MONTHS = [
  "",
  "Enero",
  "Febrero",
  "Marzo",
  "Abril",
  "Mayo",
  "Junio",
  "Julio",
  "Agosto",
  "Septiembre",
  "Octubre",
  "Noviembre",
  "Diciembre",
];
export const MONTHS_ES = [
  "Enero",
  "Febrero",
  "Marzo",
  "Abril",
  "Mayo",
  "Junio",
  "Julio",
  "Agosto",
  "Septiembre",
  "Octubre",
  "Noviembre",
  "Diciembre",
];
export const MONTHS_S = [
  "",
  "Ene",
  "Feb",
  "Mar",
  "Abr",
  "May",
  "Jun",
  "Jul",
  "Ago",
  "Sep",
  "Oct",
  "Nov",
  "Dic",
];
export const MONTHS_GRAPH = [
  "Enero",
  "Febrero",
  "Marzo",
  "Abril",
  "Mayo",
  "Junio",
  "Julio",
  "Agosto",
  "Septiembre",
  "Octubre",
  "Noviembre",
  "Diciembre",
];
export const MONTHS_S_GRAPH = [
  "Ene",
  "Feb",
  "Mar",
  "Abr",
  "May",
  "Jun",
  "Jul",
  "Ago",
  "Sep",
  "Oct",
  "Nov",
  "Dic",
];

export const DAYS = [
  "Domingo",
  "Lunes",
  "Martes",
  "Miércoles",
  "Jueves",
  "Viernes",
  "Sábado",
];
export const DAYS_SHORT = ["Dom", "Lun", "Mar", "Mié", "Jue", "Vie", "Sáb"];

export const GMT = -4;

export function getFormattedDate() {
  const date = new Date();
  const dayName = DAYS[date.getDay()];
  const day = date.getDate();
  const month = MONTHS[date.getMonth() + 1];
  const year = date.getFullYear();

  return `${dayName}, ${day} de ${month} del ${year}`;
}

export const getDateStr = (dateStr: string | null): string =>
  (dateStr + "T ").split("T")[0].split(" ")[0];

export const getUTCNow = (dias = 0) => {
  let d = new Date();
  if (dias != 0) d.setDate(d.getDate() + dias);
  // return d.toISOString();
  return d.toISOString().slice(0, 19).replace(/-/g, "-").replace("T", " ");
};

export const esFormatoISO8601 = (cadena: string | null) => {
  if (!cadena || cadena == "") return false;
  const regexISO8601 =
    /^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2}):(\d{2})(\.\d+)?Z?$/;
  return regexISO8601.test(cadena);
};

export const convertirFechaUTCaLocal = (fechaUTCString: string | null) => {
  if (!fechaUTCString || fechaUTCString == "") return null;
  const fechaUTC = new Date(fechaUTCString);

  const offsetUTC = fechaUTC.getTimezoneOffset();
  const fechaLocal = new Date(fechaUTC.getTime() - offsetUTC * 60000);
  // console.log("fechaLocal", fechaLocal);
  // if (process.env.NODE_ENV == "development")
  if (offsetUTC == 0) fechaLocal.setHours(fechaLocal.getHours() + GMT);
  return fechaLocal;
};

const _getDateTimeStrMes = (
  dateStr: string | null = "",
  dateStrBase: string | null = "",
  utc: boolean = false,
  utcBase: boolean = false
): string => {
  // console.log(dateStr);
  // console.log(esFormatoISO8601(dateStr), utc);
  if (esFormatoISO8601(dateStr) || utc) {
    console.log("Entro");
    const fechaLocal: any = convertirFechaUTCaLocal(dateStr);
    dateStr = fechaLocal
      .toISOString()
      .slice(0, 19)
      .replace(/-/g, "-")
      .replace("T", " ");
  }

  const datetime: any = dateStr?.split(" ");
  const date = datetime[0].split("-");

  const [hours, minutes] = (datetime[1] + "").substr(0, 5).split(":");
  // const timeDate = new Date();
  const timeDate = new Date(
    `${date[0]}-${date[1]}-${date[2]}T${hours}:${minutes}:00`
  );

  // if (esFormatoISO8601(dateStr)) {
  //   timeDate.setHours(parseInt(hours) + GMT);
  //   timeDate.setMinutes(parseInt(minutes));
  // }

  // Formatear el nuevo tiempo
  const adjustedTime = `${String(timeDate.getHours()).padStart(
    2,
    "0"
  )}:${String(timeDate.getMinutes()).padStart(2, "0")}`;

  date.push(adjustedTime);
  return date;
};

export const getDateTimeStrMes = (
  dateStr: string | null = "",
  dateStrBase: string | null = "",
  utc: boolean = false,
  utcBase: boolean = false
): string => {
  if (!dateStr || dateStr == "") return "";
  const date = _getDateTimeStrMes(dateStr, dateStrBase, utc, utcBase);
  return `${date[2]} de ${MONTHS[parseInt(date[1])]} del ${date[0]}, ${
    date[3]
  }`;
};

export const getDateTimeStrMesShort = (
  dateStr: string | null = "",
  dateStrBase: string | null = "",
  utc: boolean = false,
  utcBase: boolean = false
): string => {
  if (!dateStr || dateStr == "") return "";
  const date = _getDateTimeStrMes(dateStr, dateStrBase, utc, utcBase);
  // obtener el dia, lunes martes, etc
  let _date = new Date(dateStr);
  let day = DAYS_SHORT[_date.getDay()];
  return `${day}, ${date[2]}/${date[1]}/${date[0]} - ${date[3]}`;
};

const _getDateStrMes = (
  dateStr: string | null = "",
  utc: boolean = false
): Array<string> => {
  if (esFormatoISO8601(dateStr) || utc) {
    const fechaLocal: any = convertirFechaUTCaLocal(dateStr);
    dateStr = fechaLocal
      .toISOString()
      .slice(0, 19)
      .replace(/-/g, "-")
      .replace("T", " ");
  }
  // if (
  //   getDateStr(dateStr).substring(0, 10) ==
  //   getDateStr(getUTCNow().substring(0, 10))
  // )
  //   return "Hoy";
  // if (
  //   getDateStr(dateStr).substring(0, 10) ==
  //   getDateStr(getUTCNow(-1)).substring(0, 10)
  // )
  //   return "Ayer";

  dateStr = (dateStr + "").replace("T", " ");
  dateStr = dateStr.replace("/", "-");
  const datetime = dateStr.split(" ");
  const date = datetime[0].split("-");
  return date;
};

export const getDateStrMes = (
  dateStr: string | null = "",
  utc: boolean = false
): string => {
  if (!dateStr || dateStr == "") return "";
  const date = _getDateStrMes(dateStr, utc);
  let year = ` del ${date[0]}`;
  return `${date[2]} de ${MONTHS[parseInt(date[1])]}${year}`;
};

export const getDateStrMesShort = (
  dateStr: string | null = "",
  utc: boolean = false
): string => {
  if (!dateStr || dateStr == "") return "";
  const date = _getDateStrMes(dateStr, utc);
  return `${date[0]}/${date[1]}/${date[2]}`;
};

// export const getDateTimeStrMesShort = (
//   dateStr: string | null = "",
//   utc: boolean = false
// ): string => {
//   if (!dateStr || dateStr == "") return "";
//   if (esFormatoISO8601(dateStr) || utc) {
//     const fechaLocal: any = convertirFechaUTCaLocal(dateStr);
//     dateStr = fechaLocal
//       .toISOString()
//       .slice(0, 19)
//       .replace(/-/g, "-")
//       .replace("T", " ");
//   }

//   const datetime: any = dateStr?.split(" ");
//   const date = datetime[0].split("-");
//   const time = (datetime[1] + "").substr(0, 5);

//   return `${date[2]} ${MONTHS_S[parseInt(date[1])]} ${date[0]}, ${time}`;
// };

export const getNow = (): string => {
  const fec: any = convertirFechaUTCaLocal(new Date().toISOString());
  return fec.toISOString().substring(0, 10);
  // return new Date().toISOString().substring(0, 10);
};

export const getDateDesdeHasta = (date: any) => {
  const fechaActual = new Date();
  //convertir fechaActual a hora local
  fechaActual.setHours(
    fechaActual.getHours() + fechaActual.getTimezoneOffset() / 60
  );

  // obtener fecha de inicio del mes actual y fecha de fin del mes actual
  let primerDia = new Date(
    fechaActual.getFullYear(),
    fechaActual.getMonth(),
    1
  );
  let ultimoDia = new Date(
    fechaActual.getFullYear(),
    fechaActual.getMonth() + 1,
    0
  );
  // Manejar fechas personalizadas
  if (typeof date === "string" && date.startsWith("c:")) {
    const [fechaInicio, fechaFin] = date.substring(2).split(",");
    primerDia = new Date(fechaInicio);
    ultimoDia = new Date(fechaFin);
    //convertir a primerDia y ultimo dia a hora local
    primerDia.setHours(
      primerDia.getHours() + primerDia.getTimezoneOffset() / 60
    );
    ultimoDia.setHours(
      ultimoDia.getHours() + ultimoDia.getTimezoneOffset() / 60
    );
    return `${primerDia.getDate()}/${
      primerDia.getMonth() + 1
    }/${primerDia.getFullYear()} al ${ultimoDia.getDate()}/${
      ultimoDia.getMonth() + 1
    }/${ultimoDia.getFullYear()}`;
  }

  if (date === "m") {
    // return `${primerDia.getDate()}/${
    //   primerDia.getMonth() + 1
    // }/${primerDia.getFullYear()} al ${ultimoDia.getDate()}/${
    //   ultimoDia.getMonth() + 1
    // }/${ultimoDia.getFullYear()}`;
  }

  if (date === "lm") {
    const mesActual = fechaActual.getMonth();
    primerDia = new Date(fechaActual.getFullYear(), mesActual - 1, 1);
    ultimoDia = new Date(fechaActual.getFullYear(), mesActual, 0);

    // return `${primerDia.getDate()}/${
    //   primerDia.getMonth() + 1
    // }/${primerDia.getFullYear()} al ${ultimoDia.getDate()}/${
    //   ultimoDia.getMonth() + 1
    // }/${ultimoDia.getFullYear()}`;
  }

  if (date === "y") {
    primerDia = new Date(fechaActual.getFullYear(), 0, 1);
    ultimoDia = new Date(fechaActual.getFullYear(), 11, 31);
    // return `${primerDia.getDate()}/${
    //   primerDia.getMonth() + 1
    // }/${primerDia.getFullYear()} al ${ultimoDia.getDate()}/${
    //   ultimoDia.getMonth() + 1
    // }/${ultimoDia.getFullYear()}`;
  }

  if (date === "ly") {
    const añoAnterior = fechaActual.getFullYear() - 1;
    primerDia = new Date(añoAnterior, 0, 1);
    ultimoDia = new Date(añoAnterior, 11, 31);
    // return `${primerDia.getDate()}/${
    //   primerDia.getMonth() + 1
    // }/${primerDia.getFullYear()} al ${ultimoDia.getDate()}/${
    //   ultimoDia.getMonth() + 1
    // }/${ultimoDia.getFullYear()}`;
  }
  return (
    getDateStrMes(
      primerDia.getFullYear() +
        "-" +
        (primerDia.getMonth() + 1) +
        "-" +
        primerDia.getDate()
    ) +
    " al " +
    getDateStrMes(
      ultimoDia.getFullYear() +
        "-" +
        (ultimoDia.getMonth() + 1) +
        "-" +
        ultimoDia.getDate()
    )
  );
  // return "Fecha no válida";
};

export const formatNumberCustom = (number: any) => {
  if (number == null) {
    return "";
  }
  if (number < 1000) {
    return number.toString();
  }
  return number.toLocaleString("de-DE");
};

// export const differenceInDays = (begin_at: string, end_at: string): number => {
//   const localBeginDate: Date | null = convertirFechaUTCaLocal(begin_at);
//   const localEndDate: Date | null = convertirFechaUTCaLocal(end_at);
//   if (!localBeginDate || !localEndDate) {
//     throw new Error("Formato de fecha inválido");
//   }
//   // Asegurarse de que las fechas están en el formato adecuado
//   const beginDate: Date = new Date(localBeginDate.setHours(23, 59,59 , 59));
//   const endDate: Date = new Date(localEndDate.setHours(23, 59,59 , 59));
//   // Calcular la diferencia en milisegundos y luego convertir a días
//   const differenceInTime: number = endDate.getTime() - beginDate.getTime();
//   const differenceInDays: number = differenceInTime / (1000 * 3600 * 24);
//   console.log(getUTCNow(),Math.round(differenceInDays),differenceInTime,beginDate,'--',endDate,localEndDate,',differenceInDays')

//   return Math.round(differenceInDays); // Redondear la diferencia a días completos
// };

export const differenceInDays = (begin_at: string, end_at: string): number => {
  const localBeginDate: Date | null = convertirFechaUTCaLocal(begin_at);
  const localEndDate: Date | null = convertirFechaUTCaLocal(end_at);

  if (!localBeginDate || !localEndDate) {
    // throw new Error("Formato de fecha inválido");

    return -1;
  }

  // Ajustar la fecha de inicio a las 00:00:00 y la fecha de fin a las 23:59:59
  const beginDate: Date = new Date(localBeginDate.setHours(0, 0, 0, 0));
  const endDate: Date = new Date(localEndDate.setHours(0, 0, 0, 0));

  // Calcular la diferencia en milisegundos y luego convertir a días
  const differenceInTime: number = endDate.getTime() - beginDate.getTime();
  const differenceInDays: number = differenceInTime / (1000 * 3600 * 24);

  //  console.log(
  //   // getUTCNow(),
  // Math.round(differenceInDays),
  //   // 'differenceInTime',
  //   differenceInTime,
  //   'beginDate',
  //  beginDate,
  //   'endDate',
  //  endDate,
  //   'localEndDate',
  //   localEndDate,
  // differenceInDays > 0 && differenceInDays < 1,
  //    ',differenceInDays'
  // );
  if (differenceInDays > 0 && differenceInDays < 1) {
    return 1; // Si la diferencia es menor a un día pero mayor que 0, devolver 1 día
  }
  return Math.floor(differenceInDays); // Usar Math.floor para asegurarse de que no se cuente el día de inicio
};

export const getDateRemaining = (begin_at: string, end_at: string): string => {
  if (!begin_at || !end_at) return "No hay fecha de inicio o fin";
  const days = differenceInDays(begin_at, end_at);
  if (days == null) return "Fecha inválida";
  if (days < 0) return "Finalizada";
  if (days == 0) return "Finaliza hoy";
  if (days == 1) return "Finaliza mañana";
  return `Finaliza en ${days} días`;
};

export const compareDate = (
  date1: any = null,
  date2: any = null,
  oper: "=" | "<" | "<=" | ">" | ">=" = "="
) => {
  let d1: any = new Date(date1);
  let d2: any = new Date(date2);

  // if (typeof date1 == "string") {
  //   let d: any = date1.split(" ")[0].split("-");
  //   console.log("d", d, typeof d);
  //   d1 = new Date(d[0], d[1] - 1, d[2]);
  //   console.log("d1", d1);
  // }

  if (typeof date1 != "string") d1 = date1;
  if (typeof date2 != "string") d2 = date2;

  if (typeof date1 == null) d1 = new Date();
  if (typeof date2 == null) d2 = new Date();

  // d1.setHours(d1.getHours() - GMT);
  // d2.setHours(d2.getHours() - GMT);
  // console.log("date1:", date1);

  d1 = new Date(d1.getFullYear(), d1.getMonth(), d1.getDate());
  d2 = new Date(d2.getFullYear(), d2.getMonth(), d2.getDate());
  if (oper == "=") return d1 == d2;
  if (oper == ">") return d1 > d2;
  if (oper == "<") return d1 < d2;
  if (oper == ">=") return d1 >= d2;
  if (oper == "<=") return d1 <= d2;
};

export const getHourStr = (
  dateStr: string | null = "",
  utc: boolean = false
): string => {
  if (!dateStr || dateStr == "") return "";
  if (esFormatoISO8601(dateStr) || utc) {
    const fechaLocal: any = convertirFechaUTCaLocal(dateStr);
    dateStr = fechaLocal
      .toISOString()
      .slice(0, 19)
      .replace(/-/g, "-")
      .replace("T", " ");
  }
  const datetime: any = dateStr?.split(" ");
  return (datetime[1] + "").substr(0, 5);
};

export const getCurrentYearWeek = () => {
  const now = new Date();

  // Copia de la fecha actual
  const target = new Date(now.valueOf());

  // Ajustar el día al jueves de la semana actual
  const dayNr = (now.getDay() + 6) % 7; // Convertir Sunday=0 a Sunday=6
  target.setDate(target.getDate() - dayNr + 3);

  // Obtener el año ISO de la fecha ajustada
  const firstThursday = target.getTime();

  // Configurar el primer día del año
  target.setMonth(0, 1);

  // Ajustar al primer jueves del año
  if (target.getDay() !== 4) {
    target.setMonth(0, 1 + ((4 - target.getDay() + 7) % 7));
  }

  // Calcular la semana número
  const weekNumber =
    1 +
    Math.round((firstThursday - target.getTime()) / (7 * 24 * 60 * 60 * 1000));

  // Obtener el año ISO
  const isoYear = target.getFullYear();

  // Formatear el resultado como 'YYYYWW'
  return `${isoYear}${weekNumber.toString().padStart(2, "0")}`;
};

export const getDateTimeAgo = (
  dateStr: string | null = "",
  utc: boolean = false
): string => {
  if (!dateStr || dateStr === "") return "";

  let date: any;

  if (esFormatoISO8601(dateStr) || utc) {
    date = convertirFechaUTCaLocal(dateStr);
    if (!date) return "Fecha inválida"; // Manejo de error en caso de que la conversión falle
  } else {
    date = new Date(dateStr);
  }

  if (isNaN(date.getTime())) {
    return "Fecha inválida";
  }

  const now: any = convertirFechaUTCaLocal(new Date().toISOString());
  const diffMs = now.getTime() - date.getTime(); // Diferencia en milisegundos
  const diffSeconds = Math.floor(diffMs / 1000);
  const diffMinutes = Math.floor(diffSeconds / 60);
  const diffHours = Math.floor(diffMinutes / 60);
  const diffDays = Math.floor(diffHours / 24);

  if (diffMinutes < 1) {
    return "Hace un momento";
  } else if (diffHours < 1) {
    return `Hace ${diffMinutes} ${diffMinutes === 1 ? "minuto" : "minutos"}`;
  } else if (diffMinutes < 5) {
    return `Hace ${diffMinutes} ${diffMinutes === 1 ? "minuto" : "minutos"}`;
  } else if (diffHours < 24) {
    return `Hace ${diffHours} ${diffHours === 1 ? "hora" : "horas"}`;
  } else if (diffDays > 0) {
    return `Hace ${diffDays} ${diffDays === 1 ? "día" : "días"}`;
  } else {
    return getDateTimeStrMes(dateStr);
  }
};

export const formatToDayDDMMYYYYHHMM = (
  dateStr: string | null = "",
  utc: boolean = true
): string => {
  if (!dateStr || dateStr === "") return "";

  let dateForFormatting: Date;

  // 1. Obtener un objeto Date base
  if (esFormatoISO8601(dateStr) || utc) {
    // Para cadenas ISO o marcadas como UTC, usamos convertirFechaUTCaLocal
    // para intentar obtener un objeto Date que represente el tiempo local (GMT-4)
    const convertedDate = convertirFechaUTCaLocal(dateStr);
    if (!convertedDate) return "Fecha inválida";
    dateForFormatting = convertedDate;
  } else {
    // Para otras cadenas, intentamos parsearlas. new Date() las toma como locales del navegador.
    // Si estas cadenas ya representan tiempo en GMT-4, esto es correcto.
    // Si son locales del navegador y el navegador no está en GMT-4, esto podría no ser GMT-4.
    // Por consistencia con tus otras funciones, asumimos que las no-ISO/no-UTC ya están en la zona deseada
    // o que el comportamiento de new Date() es aceptable para ellas.
    let tempDate = new Date(dateStr.replace(" ", "T"));
    if (isNaN(tempDate.getTime())) {
      const parts = dateStr.split(/[- :\/]/);
      if (parts.length >= 6) {
        // YYYY, MM, DD, HH, MM, SS
        tempDate = new Date(
          Number(parts[0]),
          Number(parts[1]) - 1,
          Number(parts[2]),
          Number(parts[3]),
          Number(parts[4]),
          Number(parts[5])
        );
      } else if (parts.length >= 3) {
        // YYYY, MM, DD
        tempDate = new Date(
          Number(parts[0]),
          Number(parts[1]) - 1,
          Number(parts[2])
        );
      }
      if (isNaN(tempDate.getTime())) return "Fecha inválida";
    }
    dateForFormatting = tempDate;
  }

  // 2. Extraer componentes de fecha del objeto Date
  const diaSemana = DAYS_SHORT[dateForFormatting.getDay()];
  const dia = String(dateForFormatting.getDate()).padStart(2, "0");
  const mesNum = String(dateForFormatting.getMonth() + 1).padStart(2, "0");
  const año = dateForFormatting.getFullYear();

  // 3. Extraer y ajustar componentes de hora, replicando la lógica de getDateTimeStrMes para la hora
  let hora = dateForFormatting.getHours();
  let minutos = dateForFormatting.getMinutes();

  // El ajuste de hora "- GMT" en tu getDateTimeStrMes se aplica si la CADENA ORIGINAL era ISO.
  // Esto es un poco específico, pero lo replicamos para consistencia.
  if (esFormatoISO8601(dateStr)) {
    hora = dateForFormatting.getHours() - GMT; // Si GMT es -4, esto suma 4.
    // Esto implica que `convertirFechaUTCaLocal` para ISO
    // podría devolver un Date cuyas horas son UTC,
    // y este es el ajuste final para mostrar en GMT-4.
    if (hora < 0) {
      hora += 24;
      // Aquí podría ser necesario ajustar el día, pero tus otras funciones no lo hacen explícitamente en este punto.
    }
    if (hora >= 24) {
      // Por si acaso GMT es positivo y la suma da >= 24
      hora -= 24;
    }
  }
  // Si la hora es exactamente 24:00, se ajusta a 23:59 (lógica de getDateTimeStrMes)
  if (hora === 24 && minutos === 0) {
    hora = 23;
    minutos = 59;
  }

  const horaStr = String(hora).padStart(2, "0");
  const minutosStr = String(minutos).padStart(2, "0");

  return `${diaSemana}, ${dia}/${mesNum}/${año} - ${horaStr}:${minutosStr}`;
};
export const formatDateRange = (
  startDateStr: string | null,
  endDateStr: string | null
): string => {
  // Función auxiliar interna para no repetir código.
  // Formatea una sola fecha en el formato "Día, dd/MM/yyyy".
  const formatSingleDate = (dateStr: string | null): string => {
    if (!dateStr) return "";

    // Reutilizamos tu función para manejar fechas UTC y locales de forma consistente.
    const date = convertirFechaUTCaLocal(dateStr);

    if (!date) return ""; // Si la fecha no es válida, retorna vacío.

    const diaSemana = DAYS_SHORT[date.getDay()]; // Ej: 'Lun'
    const dia = String(date.getDate()).padStart(2, "0"); // Ej: '12'
    const mes = String(date.getMonth() + 1).padStart(2, "0"); // Ej: '04'
    const anio = date.getFullYear(); // Ej: '2025'

    return `${diaSemana}, ${dia}/${mes}/${anio}`;
  };

  const formattedStart = formatSingleDate(startDateStr);
  const formattedEnd = formatSingleDate(endDateStr);

  // Si alguna de las fechas es inválida, mejor no mostrar nada o un error.
  if (!formattedStart || !formattedEnd) {
    return "Rango de fechas inválido";
  }

  return `${formattedStart} a ${formattedEnd}`;
};
