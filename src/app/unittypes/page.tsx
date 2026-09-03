import React from "react";

// 🔴 Antes esto importaba `{ UnitsType }` de `@/mk/utils/utils`, que es un
// OBJETO literal con los nombres de los tipos de unidad —no un componente—, así
// que `<UnitsType />` tiraba «Element type is invalid: expected a
// string or a class/function but got: object» y la ruta entera no cargaba.
//
// El componente es el default export de `@/modulos/UnitTypes/UnitsTypes`, que
// es el que ya usaban `app/ev/page.tsx` y `Config.tsx`.
//
// ⚠️ Lo dejó pasar el `: any` de esa constante: sin esa anotación, TypeScript
// habría rechazado usar un objeto como componente.
import UnitsType from "@/modulos/UnitTypes/UnitsTypes";

const UnitsTypePage = () => {
  return <UnitsType />;
};

export default UnitsTypePage;
