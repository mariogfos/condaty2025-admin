/**
 * Las consultas que corren al salir del CI y del correo en el alta y la
 * edición de un guardia.
 *
 * ────────────────────────────────────────────────────────────────────────
 * 🔴 EL `formState` DE ADENTRO ES LA FOTO DEL FORMULARIO AL MOMENTO DEL BLUR
 * ────────────────────────────────────────────────────────────────────────
 *
 * Entre el blur y la respuesta pasa un request entero, y en ese rato el
 * administrador sigue completando: escribe el teléfono, la dirección. Un
 * `setFormState({ ...formState, … })` escribe de vuelta esa foto vieja y
 * **borra lo que se tipeó mientras esperaba**, sin ningún aviso.
 *
 * Con el updater, React entrega el estado ACTUAL y lo escrito sobrevive.
 *
 * ⚠️ Lo mismo con los errores: pasarle un objeto **reemplaza el mapa entero** y
 * se lleva puestos los de los otros campos. `setErrors({ ci: "…" })` borraba el
 * error del correo que el propio formulario acababa de poner.
 *
 * ⚠️ Y la respuesta vieja: si el valor del input ya no es el que se consultó,
 * esa respuesta habla de OTRA persona. Aplicarla rellena el formulario con los
 * datos del guardia anterior. Dos blur seguidos y gana el que conteste último,
 * que no es necesariamente el último que se pidió.
 *
 * Es exactamente la misma familia que cerró `buscarAdministradorExistente.ts`
 * para el alta de administradores. Los dos formularios de guardia —el alta
 * (`Guards/RenderForm`) y la edición desde el perfil (`GuardEditForm`)— tenían
 * las tres, así que la regla vive una sola vez y los dos la consultan.
 *
 * Están afuera del componente para poder medirlas: adentro cierran sobre
 * `execute` y `showToast` y no hay forma de llamarlas sin renderizar la
 * pantalla entera.
 */

/** Las claves presentes en el sobre; nunca escribe `undefined` encima. */
const soloLoQueVino = (
  origen: Record<string, any>,
  claves: string[],
): Record<string, any> =>
  Object.fromEntries(
    claves
      .filter((clave) => origen[clave] !== undefined)
      .map((clave) => [clave, origen[clave]]),
  );

type Dependencias = {
  execute: Function;
  showToast: Function;
};

type Escrituras = {
  /** Recibe un updater: nunca un objeto, o se pisa lo que se escribió. */
  setFormState: (actualizar: (actual: Record<string, any>) => Record<string, any>) => void;
  setErrors: (actualizar: (actual: Record<string, string>) => Record<string, string>) => void;
  /** Al vaciar el formulario tras un CI repetido. */
  vaciarFormulario: () => void;
};

/**
 * ⚠️ `value` va sólo en la edición: le dice al API cuál es el guardia que se
 * está editando, para que no se encuentre a sí mismo.
 */
export const buscarGuardiaPorCi = async (
  e: any,
  { execute, showToast }: Dependencias,
  escrituras: Escrituras,
  guardiaEditado?: string | number | null,
) => {
  const ci = String(e.target.value ?? "").trim();
  if (ci === "") return;

  const { data } = await execute(
    "/v3/guards",
    "GET",
    {
      fullType: "EXIST",
      type: "ci",
      searchBy: ci,
      ...(guardiaEditado ? { value: guardiaEditado } : {}),
    },
    false,
    true,
  );

  // La respuesta llegó tarde: el CI que se ve ya es otro.
  if (String(e.target.value ?? "").trim() !== ci) return;

  if (data?.success && data.data?.data?.id) {
    const encontrado = data.data.data;

    if (encontrado.existCondo) {
      showToast("El guardia ya existe en este condominio", "warning");
      escrituras.vaciarFormulario();
      escrituras.setErrors((actual) => ({
        ...actual,
        ci: "Ese CI ya esta en uso en este condominio.",
      }));
      return;
    }

    escrituras.setErrors((actual) => ({ ...actual, ci: "" }));
    escrituras.setFormState((actual) => ({
      ...actual,
      // ⚠️ Sólo las claves que la respuesta TRAE. Copiarlas todas escribe
      // `undefined` en las que el API no mandó y borra lo que el usuario ya
      // había tipeado en esos campos. Lo agarró el test del blur: el sobre de
      // `fullType=EXIST` no siempre lleva `address`.
      ...soloLoQueVino(encontrado, [
        "ci",
        "name",
        "middle_name",
        "last_name",
        "mother_last_name",
        "phone",
        "address",
      ]),
      email: encontrado.email ?? "",
      url_avatar: encontrado.url_avatar
        ? [encontrado.url_avatar]
        : actual.url_avatar,
      _disabled: true,
      _emailDisabled: true,
    }));
    showToast(
      "El guardia ya existe en Condaty, se va a vincular al condominio",
      "warning",
    );
    return;
  }

  escrituras.setErrors((actual) => ({ ...actual, ci: "" }));
  escrituras.setFormState((actual) => ({
    ...actual,
    _disabled: false,
    _emailDisabled: false,
  }));
};

/**
 * Al cambiar el CI, los campos se DESBLOQUEAN.
 *
 * 🔴 Sin esto, una vez que un CI matcheaba a un guardia existente los campos
 * quedaban en `disabled` y corregir el CI no los devolvía: había que salir del
 * campo otra vez para que un segundo request los soltara. Y si ese segundo CI
 * también matcheaba, seguían con los datos del primero hasta que llegara la
 * respuesta.
 */
export const alCambiarElCi = (
  valor: string,
  escrituras: Pick<Escrituras, "setFormState" | "setErrors">,
) => {
  escrituras.setFormState((actual) => ({
    ...actual,
    ci: valor,
    _disabled: false,
    _emailDisabled: false,
  }));
  escrituras.setErrors((actual) => ({ ...actual, ci: "" }));
};
