import Input from "@/mk/components/forms/Input/Input";
import DataModal from "@/mk/components/ui/DataModal/DataModal";
import { useAuth } from "@/mk/contexts/AuthProvider";
import { checkRules, hasErrors } from "@/mk/utils/validate/Rules";
import React, { useCallback, useRef, useState } from "react";
import TextArea from "@/mk/components/forms/TextArea/TextArea";
import InputFullName from "@/mk/components/forms/InputFullName/InputFullName";
import UploadFileSingle from "@/mk/components/forms/UploadFileSingle/UploadFileSingle";
import { mensajeDelError } from "@/mk/utils/errorDeRed";
import { alCambiarElCi, buscarGuardiaPorCi } from "../buscarGuardiaExistente";

const RenderForm = ({ open, onClose, item, execute, reLoad }: any) => {
  const [formState, setFormState] = useState({ ...item });
  const [errors, setErrors] = useState({});
  // 🔴 Guarda de en-vuelo. Este formulario NO pasa por `useCrud`: llama a
  // `execute` de frente, así que el `onSaveInFlightRef` del kernel no lo cubre.
  // El botón Guardar no se deshabilita durante el await, y `guards.ci` tiene
  // índice único: el doble click creaba el guardia con el primer POST y el
  // segundo volvía con error, así que el usuario leía "Error al guardar" sobre
  // un guardia que SÍ se había creado. Un ref y no un estado: el ref se lee ya
  // actualizado en el mismo tick, un `useState` no.
  const guardadoEnVuelo = useRef(false);
  const { showToast } = useAuth();

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>,
  ) => {
    const { name, value } = e.target;

    // 🔴 Cambiar el CI DESBLOQUEA los campos. Sin esto, una vez que un CI
    // matcheaba a un guardia existente quedaban en `disabled` y corregirlo no
    // los devolvía hasta que otro blur despachara un segundo request.
    if (name === "ci") {
      alCambiarElCi(value, { setFormState, setErrors });
      return;
    }

    setFormState((prev: any) => ({
      ...prev,
      [name]: value,
    }));
  };
  const validate = () => {
    let errors: any = {};
    errors = checkRules({
      value: formState?.ci,
      rules: ["required"],
      key: "ci",
      errors,
      data: formState,
    });
    errors = checkRules({
      value: formState?.url_avatar,
      rules: [""],
      key: "url_avatar",
      errors,
      data: formState,
    });
    errors = checkRules({
      value: formState?.name,
      rules: ["required"],
      key: "name",
      errors,
      data: formState,
    });
    errors = checkRules({
      value: formState?.middle_name,
      rules: ["alpha"],
      key: "middle_name",
      errors,
      data: formState,
    });
    errors = checkRules({
      value: formState?.last_name,
      rules: ["required"],
      key: "last_name",
      errors,
      data: formState,
    });
    errors = checkRules({
      value: formState?.mother_last_name,
      rules: ["alpha"],
      key: "mother_last_name",
      errors,
      data: formState,
    });

    errors = checkRules({
      value: formState?.phone,
      rules: ["phone"],
      key: "phone",
      errors,
      data: formState,
    });
    errors = checkRules({
      value: formState?.address,
      rules: [""],
      key: "address",
      errors,
      data: formState,
    });
    errors = checkRules({
      value: formState?.email,
      rules: ["required", "email"],
      key: "email",
      errors,
      data: formState,
    });
    setErrors(errors);
    return errors;
  };
  const _onSave = async () => {
    if (hasErrors(validate())) return;
    if (guardadoEnVuelo.current) return;
    guardadoEnVuelo.current = true;
    try {
      let method = formState.id ? "PUT" : "POST";
      const { data, error } = await execute(
        "/v3/guards" + (formState.id ? "/" + formState.id : ""),
        method,
        {
          ci: formState.ci,
          url_avatar: formState.url_avatar,
          name: formState.name,
          middle_name: formState.middle_name,
          last_name: formState.last_name,
          mother_last_name: formState.mother_last_name,
          email: formState.email,
          phone: formState.phone,
          address: formState.address,
        },
      );

      if (data?.success) {
        onClose();
        reLoad();
        showToast(data?.message || "Guardia guardado con éxito", "success");
      } else {
        // ⚠️ Decía «documento», copiado del formulario de Documentos. Y sólo
        // miraba `data`: cuando el pedido no llega —servidor caído, sin red—
        // `data` viene en `null` y el usuario leía «Error al guardar el
        // documento», que no nombra lo que estaba guardando ni dice que el
        // problema fue de conexión.
        showToast(
          mensajeDelError(
            error ?? data,
            "No se pudo guardar el guardia. Intentá nuevamente.",
          ),
          "error",
        );
      }
    } finally {
      guardadoEnVuelo.current = false;
    }
  };
  const onBlurCi = (e: any) =>
    buscarGuardiaPorCi(
      e,
      { execute, showToast },
      { setFormState, setErrors, vaciarFormulario: () => setFormState({}) },
    );

  const onBlurEmail = useCallback(async () => {
    const { data } = await execute(
      "/v3/guards",
      "GET",
      {
        fullType: "EXIST",
        type: "email",
        searchBy: formState.email,
      },
      false,
      true,
    );

    if (data?.success && data.data?.data?.id) {
      showToast("El email ya esta en uso", "warning");
      setErrors({ email: "El email ya esta en uso" });
      setFormState({ ...formState, email: "" });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [formState?.email]);

  return (
    <DataModal
      open={open}
      onClose={onClose}
      maxWidth={760}
      title={formState.id ? "Editar guardia" : "Nuevo guardia"}
      onSave={_onSave}
      variant={"mini"}
    >
      <UploadFileSingle
        formState={formState}
        name="url_avatar"
        setFormState={setFormState}
        error={errors}
      />
      <Input
        name="ci"
        value={formState.ci || ""}
        disabled={formState._disabled}
        onChange={handleChange}
        label="Carnet de identidad"
        onBlur={onBlurCi}
        error={errors}
        required
      />

      <InputFullName
        name="name"
        value={formState}
        onChange={handleChange}
        errors={errors}
        disabled={formState._disabled}
      />
      <Input
        name="phone"
        value={formState.phone || ""}
        disabled={formState._disabled}
        onChange={handleChange}
        label="Celular"
        error={errors}
        required={false}
      />
      <TextArea
        label="Dirección"
        name="address"
        value={formState.address || ""}
        onChange={handleChange}
        error={errors}
      />
      <p style={{ margin: "8px 0px" }}>
        La contraseña será enviada al correo que indiques en este campo
      </p>
      <Input
        name="email"
        value={formState.email || ""}
        disabled={formState._disabled}
        onBlur={onBlurEmail}
        onChange={handleChange}
        label="Correo electrónico"
        error={errors}
      />
    </DataModal>
  );
};

export default RenderForm;
