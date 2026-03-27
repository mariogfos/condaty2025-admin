import {
  validBetweenDate,
  validPassword,
  validCi,
  validPhone,
  validOptionsSurvey,
  validDateGreater,
  validDateLess,
  validDateFuture,
  validDateTimeGreater,
} from "./rulesApp";

export const validators = {
  betweenDate: validBetweenDate,
  password: validPassword,
  ci: validCi,
  phone: validPhone,
  optionSurvey: validOptionsSurvey,
  greaterDate: validDateGreater,
  lessDate: validDateLess,
  futureDate: validDateFuture,
  greaterDateTime: validDateTimeGreater,
  // Añadir otros validadores aquí
};
