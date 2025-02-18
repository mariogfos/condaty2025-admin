import {
  validBetweenDate,
  validPassword,
  validCi,
  validOptionsSurvey,
  validDateGreater,
  validDateLess,
  validDateFuture,
} from "./rulesApp";

export const validators = {
  betweenDate: validBetweenDate,
  password: validPassword,
  ci: validCi,
  optionSurvey: validOptionsSurvey,
  greaterDate: validDateGreater,
  lessDate: validDateLess,
  futureDate: validDateFuture,
  // Añadir otros validadores aquí
};
