import { validators as loadedValidators } from "@/components/validators";
import { formatNumber } from "../numbers";

export type ActionType = "add" | "edit" | "del" | "view" | "export";
export type ValidFunctionType = (
  value: any,
  param: string[],
  field?: Record<string, any> | null
) => string;

export type RulesColumnsType = {
  label: string;
  required?: boolean;
  rules?: string[];
  actions?: ActionType[];
};

export type RulesFieldsType = {
  [key: string]: {
    label?: string;
    required?: boolean;
    rules?: string[];
    api?: string;
  };
};

export const validRule = (
  value: any = "",
  _rule: string = "",
  formState: Record<string, any> = {},
  key?: string,
  execute?: Function
): string => {
  if (!_rule) return "";

  const [rule, params] = (_rule + ":").split(":");
  const param = params ? params.split(",") : [];
  console.log(Number(value), Number(formState[param[0]]));
  const validations: Record<string, Function> = {
    validateIf: () =>
      param[1] !== formState[param[0]] ? "validar hasta aqui" : "",
    requiredIf: () =>
      param[1] !== formState[param[0]] || value === 0 || value === "0"
        ? ""
        : !value
        ? "Este campo es requerido"
        : "",
    
    required: () => {
      // Si el valor es 0 o "0", se considera válido (mantiene tu lógica actual para estos casos)
      if (value === 0 || value === "0") {
        return ""; // Sin error
      }
      // NUEVA VERIFICACIÓN: Si es un array y está vacío, es requerido
      if (Array.isArray(value) && value.length === 0) {
        return "Este campo es requerido"; // Error, campo vacío
      }
      // Verificación original para otros valores "falsy" (null, undefined, "")
      if (!value) {
        return "Este campo es requerido"; // Error, campo vacío
      }
      // Si ninguna de las condiciones anteriores se cumple, el campo es válido
      return ""; // Sin error
    },
    requiredFile: () => (!value?.file ? "Este campo es requerido" : ""),
    onExist: async () => {
      if (!execute) return "no existe execute";
      const { data: response } = await execute(param[0], "GET", {
        searchBy: value,
        type: param[1],
        cols: param[2] || "id",
      });
      return response?.data != null ? "el valor ya existe" : "";
    },
    requiredFileIf: () =>
      param[1] !== formState[param[0]] || value === 0 || value === "0"
        ? ""
        : !value?.file
        ? "Este campo es requerido"
        : "",
    same: () =>
      value !== formState[param[0]] ? "Los campos deben ser iguales" : "",
    minMax: () =>
      Number(value) == Number(formState[param[0]])
        ? "El campo debe ser menor"
        : "",
    min: () => (value?.length < param[0] ? `min ${param[0]} caracteres` : ""),
    max: () => (value?.length > param[0] ? `max ${param[0]} caracteres` : ""),
    email: () => (!/\S+@\S+\.\S+/.test(value) ? "No es un correo válido" : ""),
    textDash: () =>
      //permmitir acentos, guiones, guiones bajos, y espacios
      !/^[a-zA-Z0-9áéíóúÁÉÍÓÚñÑüÜ\s-]+$/.test(value)
        ? "No es un texto válido"
        : "",
    alpha: () =>
      !/^[a-zA-ZáéíóúÁÉÍÓÚñÑüÜ]+$/.test(value) ? "No es un texto válido" : "",
    noSpaces: () => (!/^\S+$/.test(value) ? "No debe tener espacios" : ""),
    date: () => {
      const [year, month, day] = value.split("-").map(Number);
      const date = new Date(year, month - 1, day);
      const now = new Date();
      date.setHours(0, 0, 0, 0);
      now.setHours(0, 0, 0, 0);
      return date < now ? "Debe ser una fecha mayor a la actual" : "";
    },
    number: () =>
      value === "" || value === null
        ? ""
        : !/^[0-9.,-]+$/.test(value)
        ? "No es un número valido"
        : "",
    integer: () =>
      !/^[0-9]+$/.test(value) ? "No es un número entero valido" : "",
    positive: () => (value < 0 ? "Debe ser número positivo " : ""),
    greater: () => (value <= param[0] ? `Debe ser mayor` : ""),
    less: () =>
      Number(value) > Number(formState[param[0]])
        ? `Debe ser menor o igual a ${formatNumber(formState[param[0]], 0)}`
        : "",
    googleMapsLink: () =>
      !/^https:\/\/(www\.)?(google\.(com|es|com\.mx|.*)\/maps\/(place|search|dir)\/|maps\.app\.goo\.gl\/)/.test(
        value
      )
        ? "Debe ser un enlace válido de Google Maps"
        : "",
    facebook: () =>
      !value
        ? ""
        : !/^https:\/\/(www\.)?(facebook\.com\/)/.test(value)
        ? "Debe ser un enlace válido de Facebook"
        : "",
    instagram: () =>
      !value
        ? ""
        : !/^https:\/\/(www\.)?(instagram\.com\/)/.test(value)
        ? "Debe ser un enlace válido de Instagram"
        : "",
    twitter: () =>
      !value
        ? ""
        : !/^https:\/\/(www\.)?(x\.com\/)/.test(value)
        ? "Debe ser un enlace válido de Twitter"
        : "",
    linkedin: () =>
      !value
        ? ""
        : !/^https:\/\/(www\.)?(linkedin\.com\/)/.test(value)
        ? "Debe ser un enlace válido de LinkedIn"
        : "",
    between: () =>
      Number(value) < Number(param[0]) || Number(value) > Number(param[1])
        ? `Debe estar entre ${param[0]} y ${param[1]}`
        : "",
    ...Object.keys(loadedValidators).reduce((acc, key) => {
      acc[key] = () =>
        loadedValidators[key as keyof typeof loadedValidators](
          value,
          param,
          formState
        );
      return acc;
    }, {} as Record<string, ValidFunctionType>),
  };

  return validations[rule]?.() || "";
};

export const checkRulesFields = (
  fields: RulesFieldsType = {},
  data: Record<string, any> = {},
  action: ActionType = "add",
  execute?: Function
): Record<string, string> => {
  const errors: Record<string, string> = {};

  for (const key in fields) {
    if (!fields[key].rules) continue;

    let detener = false;
    for (const rule of fields[key].rules || []) {
      if (detener) break;

      const [ruleName, ruleActions] = rule.split("*");
      if (!ruleName || (ruleActions && !ruleActions.includes(action[0])))
        continue;
      const rName = (ruleName + ":").split(":")[0];
      //console.log(rName, "rName", data);
      if (rName == "_disabled_" && data["_disabled"] === true) {
        detener = true;
        // errors[key] = "";
        continue;
      }

      const error = validRule(data[key], ruleName, data, key, execute);

      if (rName === "validateIf" && error) {
        detener = true;
        continue;
      }

      if (error) {
        errors[key] = error;
        break;
      }
    }
  }

  return errors;
};

type CheckRulesType = {
  value: any;
  rules: string[];
  errors?: Record<string, string> | null;
  key?: string | null;
  data?: Record<string, any>;
  execute?: Function;
};

export const checkRules = ({
  value = "",
  rules = [],
  errors = null,
  key = null,
  data = {},
  execute,
}: CheckRulesType): string | Record<string, string> | null => {
  if (!rules || rules.length === 0) return errors || "";

  for (const rule of rules) {
    if (!rule || (rule !== "required" && !value)) continue;

    const error = validRule(value, rule, data, undefined, execute);
    if (error) {
      return errors ? { ...errors, [key || "error"]: error } : error;
    }
  }

  return errors || "";
};

export const getParamFields = (
  data: Record<string, any> = {},
  fields: RulesFieldsType = {},
  action: ActionType = "add"
): Record<string, any> => {
  return Object.entries(fields).reduce((param, [key, el]) => {
    const apiIndex: number = (el.api + "").indexOf(action.charAt(0));
    if (apiIndex === -1) return param;

    const hasAsterisk = (el.api + "").charAt(apiIndex + 1) === "*";
    const isEmptyValue = !data[key] || (data[key] + "").trim() === "";
    if (hasAsterisk && isEmptyValue) return param;

    param[key] = data[key];
    return param;
  }, {} as Record<string, any>);
};

export const hasErrors = (errors: Record<string, string>): boolean => {
  return Object.keys(errors).length > 0;
};

// import { validators as loadedValidators } from "@/components/validators";
// export type ActionType = "add" | "edit" | "del" | "view" | "export";
// export type ValidFunctionType = (
//   value: any,
//   param: string[],
//   field?: Record<string, any> | null
// ) => string;
// export type RulesColumnsType = {
//   label: string;
//   required?: boolean;
//   rules?: string[];
//   actions?: ActionType[];
// };
// export type RulesFieldsType = {
//   [key: string]: {
//     label?: string;
//     required?: boolean;
//     rules?: string[];
//     api?: string;
//   };
// };
// export const validRule = (
//   value: any = "",
//   _rule: string = "",
//   formState: Record<string, any> = {},
//   key?: string,
//   execute?: Function
// ) => {
//   if (!_rule) return "";
//   const [rule, params] = (_rule + ":").split(":");
//   const param = params ? params.split(",") : [];
//   const validations: Record<string, Function> = {
//     validateIf: () => {
//       return param[1] !== formState[param[0]] ? "validar hasta aqui" : "";
//     },
//     requiredIf: () => {
//       if (param[1] !== formState[param[0]]) return "";
//       if (value === 0 || value === "0") return "";
//       return !value ? "Este campo es requerido" : "";
//     },
//     required: () => {
//       if (value === 0 || value === "0") return "";
//       return !value ? "Este campo es requerido" : "";
//     },
//     requiredFile: () => {
//       return !value?.file ? "Este campo es requerido" : "";
//     },
//     onExist: async () => {
//       // onExist:adm-exists,email,id"
//       if (!execute) return "no existe execute";
//       const { data: response } = await execute(param[0], "GET", {
//         searchBy: value,
//         type: param[1],
//         cols: param[2] || "id",
//       });
//       let r = "";
//       if (response?.data != null) {
//         r = "el valor ya existe";
//       }
//       return r;
//     },
//     requiredFileIf: () => {
//       if (param[1] !== formState[param[0]]) return "";
//       if (value === 0 || value === "0") return "";
//       return !value?.file ? "Este campo es requerido" : "";
//     },
//     same: () =>
//       value !== formState[param[0]] ? "Los campos deben ser iguales" : "",
//     minMax: () =>
//       Number(value) == Number(formState[param[0]])
//         ? "El campo debe ser menor"
//         : "",
//     min: () => (value?.length < param[0] ? `min ${param[0]} caracteres` : ""),
//     max: () => (value?.length > param[0] ? `max ${param[0]} caracteres` : ""),
//     email: () => (!/\S+@\S+\.\S+/.test(value) ? "No es un correo válido" : ""),
//     alpha: () =>
//       !/^[a-zA-ZáéíóúÁÉÍÓÚñÑüÜ]+$/.test(value) ? "No es un texto válido" : "",
//     noSpaces: () => (!/^\S+$/.test(value) ? "No debe tener espacios" : ""),
//     date: () => {
//       const [year, month, day] = value.split("-").map(Number);
//       const date = new Date(year, month - 1, day);
//       const now = new Date();
//       date.setHours(0, 0, 0, 0);
//       now.setHours(0, 0, 0, 0);
//       return date < now ? "Debe ser una fecha mayor a la actual" : "";
//     },
//     number: () => {
//       // console.error("number", value, /^[0-9.,-]+$/.test(value));
//       if (value === "" || value === null) return "";
//       return !/^[0-9.,-]+$/.test(value) ? "No es un número valido" : "";
//     },
//     integer: () =>
//       !/^[0-9]+$/.test(value) ? "No es un número entero valido" : "",
//     positive: () => (value < 0 ? "Debe ser número positivo " : ""),
//     greater: () => (value <= param[0] ? `Debe ser mayor` : ""),
//     less: () => (value >= param[0] ? `Debe ser menor que ${param[0]}` : ""),
//     googleMapsLink: () => {
//       const regex =
//         /^https:\/\/(www\.)?(google\.(com|es|com\.mx|.*)\/maps\/(place|search|dir)\/|maps\.app\.goo\.gl\/)/;
//       return !regex.test(value)
//         ? "Debe ser un enlace válido de Google Maps"
//         : "";
//     },
//     facebook: () => {
//       const regex = /^https:\/\/(www\.)?(facebook\.com\/)/;
//       if (!value) return ""; // No valida si el campo está vacío
//       return !regex.test(value) ? "Debe ser un enlace válido de Facebook" : "";
//     },
//     instagram: () => {
//       const regex = /^https:\/\/(www\.)?(instagram\.com\/)/;
//       if (!value) return ""; // No valida si el campo está vacío
//       return !regex.test(value) ? "Debe ser un enlace válido de Instagram" : "";
//     },
//     twitter: () => {
//       const regex = /^https:\/\/(www\.)?(x\.com\/)/;
//       if (!value) return ""; // No valida si el campo está vacío
//       return !regex.test(value) ? "Debe ser un enlace válido de Twitter" : "";
//     },
//     linkedin: () => {
//       const regex = /^https:\/\/(www\.)?(linkedin\.com\/)/;
//       if (!value) return ""; // No valida si el campo está vacío
//       return !regex.test(value) ? "Debe ser un enlace válido de LinkedIn" : "";
//     },
//     between: () =>
//       Number(value) < Number(param[0]) || Number(value) > Number(param[1])
//         ? `Debe estar entre ${param[0]} y ${param[1]}`
//         : "",
//     ...Object.keys(loadedValidators).reduce((acc, key) => {
//       acc[key] = () =>
//         loadedValidators[key as keyof typeof loadedValidators](
//           value,
//           param,
//           formState
//         );
//       return acc;
//     }, {} as Record<string, ValidFunctionType>),
//   };
//   return validations[rule]?.() || "";
// };
// export const checkRulesFields = (
//   fields: RulesFieldsType = {},
//   data: Record<string, any> = {},
//   action: ActionType = "add",
//   execute?: Function
// ) => {
//   let errors: Record<string, string> = {};
//   let detener = false;
//   for (const key in fields) {
//     if (!fields[key].rules) continue;
//     // const value = data[key] || "";
//     detener = false;
//     (fields[key].rules || []).forEach((rule) => {
//       if (detener) return;
//       const [ruleName, ruleActions] = rule.split("*");
//       if (!ruleName || (ruleActions && !ruleActions.includes(action[0])))
//         return;
//       const error = validRule(data[key], ruleName, data, key, execute);
//       const rName = (ruleName + ":").split(":")[0];
//       if (rName == "validateIf" && error) {
//         detener = true;
//         return;
//       }
//       if (error) errors[key] = error;
//     });
//   }
//   return errors;
// };
// type CheckRulesType = {
//   value: any;
//   rules: string[];
//   errors?: Record<string, string> | null;
//   key?: string | null;
//   data?: Record<string, any>;
//   execute?: Function;
// };
// export const checkRules = ({
//   value = "",
//   rules = [],
//   errors = null,
//   key = null,
//   data = {},
//   execute,
// }: CheckRulesType): string | Record<string, string> | null => {
//   let error: string = "";
//   if (!rules || rules.length == 0) return errors || error;
//   rules.forEach((rule) => {
//     if (!rule || error != "" || (rule !== "required" && !value)) return;
//     error = validRule(value, rule, data, undefined, execute);
//   });
//   return errors
//     ? error
//       ? { ...errors, [key || "error"]: error }
//       : errors
//     : error;
// };
// export const getParamFields = (
//   data: Record<string, any> = {},
//   fields: RulesFieldsType = {},
//   action: ActionType = "add"
// ) => {
//   return Object.entries(fields).reduce((param: any, [key, el]) => {
//     const apiIndex: number = (el.api + "").indexOf(action.charAt(0));
//     if (apiIndex === -1) {
//       return param;
//     }
//     const hasAsterisk = (el.api + "").charAt(apiIndex + 1) === "*";
//     const isEmptyValue = !data[key] || (data[key] + "").trim() === "";
//     if (hasAsterisk && isEmptyValue) {
//       return param;
//     }
//     param[key] = data[key];
//     return param;
//   }, {});
// };
// export const hasErrors = (errors: Record<string, string>) => {
//   return Object.keys(errors).length > 0;
// };
