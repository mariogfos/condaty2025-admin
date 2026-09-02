/**
 * Las dos consultas que corren al salir del CI y del correo del alta de
 * administradores.
 *
 * ────────────────────────────────────────────────────────────────────────
 * 🔴 `props.item` ES LA FOTO DEL FORMULARIO AL MOMENTO DEL BLUR
 * ────────────────────────────────────────────────────────────────────────
 *
 * Entre el blur y la respuesta pasa un request entero, y en ese rato el
 * administrador sigue completando: elige el rol, escribe el teléfono. Un
 * `setItem({ ...props.item, … })` escribe de vuelta esa foto vieja y **borra lo
 * que el usuario eligió mientras esperaba**, sin ningún aviso: el rol
 * simplemente vuelve a estar vacío.
 *
 * Con el updater, React entrega el estado ACTUAL y lo elegido sobrevive.
 *
 * ⚠️ Lo mismo con `setError`: pasarle un objeto **reemplaza el mapa entero** y
 * se lleva puestos los errores de los otros campos.
 *
 * ⚠️ Y la respuesta vieja: si el valor del input ya no es el que se consultó,
 * esa respuesta habla de otra persona. Aplicarla rellena el formulario con los
 * datos del anterior.
 *
 * Están acá afuera del componente para poder medirlas: adentro cierran sobre
 * `execute` y `showToast` y no hay forma de llamarlas sin renderizar la
 * pantalla entera.
 */
type Dependencias = {
  execute: Function;
  showToast: Function;
};

export const buscarPorCorreo = async (
  e: any,
  props: any,
  { execute, showToast }: Dependencias
) => {
  const email = e.target.value.trim();

  if (email == "" || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return;

  const { data } = await execute(
    "/v3/users",
    "GET",
    { fullType: "EXIST", type: "email", searchBy: email },
    false,
    true
  );

  if (e.target.value.trim() !== email) return;

  if (data?.success && data.data?.data?.id) {
    showToast("El email ya esta en uso", "warning");
    props.setError((actual: Record<string, string>) => ({
      ...actual,
      email: "El email ya esta en uso",
    }));
    props.setItem((actual: Record<string, any>) => ({ ...actual, email: "" }));
  }
};

export const buscarPorCi = async (
  e: any,
  props: any,
  { execute, showToast }: Dependencias
) => {
  const ci = e.target.value.trim();
  if (ci == "") return;

  const { data } = await execute(
    "/v3/users",
    "GET",
    { fullType: "EXIST", type: "ci", searchBy: ci },
    false,
    true
  );

  if (e.target.value.trim() !== ci) return;

  if (data?.success && data.data?.data?.id) {
    const encontrado = data.data.data;

    if (encontrado.existCondo) {
      showToast("El administrador ya existe en este Condominio", "warning");
      props.setItem({});
      props.setError((actual: Record<string, string>) => ({
        ...actual,
        ci: "Ese CI ya esta en uso en este condominio",
      }));
      return;
    }

    props.setError((actual: Record<string, string>) => ({ ...actual, ci: "" }));
    props.setItem((actual: Record<string, any>) => ({
      ...actual,
      ci: encontrado.ci,
      name: encontrado.name,
      middle_name: encontrado.middle_name,
      last_name: encontrado.last_name,
      mother_last_name: encontrado.mother_last_name,
      email: encontrado.email ?? "",
      phone: encontrado.phone,
      _disabled: true,
      _emailDisabled: true,
    }));
    showToast(
      "El administrador ya existe en Condaty, se va a vincular al Condominio",
      "warning"
    );
    return;
  }

  props.setError((actual: Record<string, string>) => ({ ...actual, ci: "" }));
  props.setItem((actual: Record<string, any>) => ({
    ...actual,
    _disabled: false,
    _emailDisabled: false,
  }));
};
