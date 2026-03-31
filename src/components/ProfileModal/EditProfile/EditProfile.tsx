import Input from "@/mk/components/forms/Input/Input";
import DetailModal from "@/mk/components/ui/DetailModal/DetailModal";
import React from "react";
import styles from "./EditProfile.module.css";
import { useAuth } from "@/mk/contexts/AuthProvider";
import { checkRules, hasErrors } from "@/mk/utils/validate/Rules";
import useAxios from "@/mk/hooks/useAxios";
import UploadFileProfile from "@/mk/components/forms/UploadFileProfile/UploadFileProfile";

const EditProfile = ({
  open,
  onClose,
  formState,
  setFormState,
  onChange,
  urlImages,
  errors,
  setErrors,
  url,
  reLoad,
  reLoadList,
  type,
}: any) => {
  const { showToast, user } = useAuth();
  const { execute } = useAxios();

  const validate = () => {
    let errs: any = {};
    errs = checkRules({
      value: formState.name,
      rules: ["required", "alpha"],
      key: "name",
      errors: errs,
    });
    errs = checkRules({
      value: formState.middle_name,
      rules: ["alpha"],
      key: "middle_name",
      errors: errs,
    });
    errs = checkRules({
      value: formState.last_name,
      rules: ["required", "alpha"],
      key: "last_name",
      errors: errs,
    });
    errs = checkRules({
      value: formState.mother_last_name,
      rules: ["alpha"],
      key: "mother_last_name",
      errors: errs,
    });
    errs = checkRules({
      value: formState.phone,
      rules: ["numeric", "min:8"],
      key: "phone",
      errors: errs,
    });
    if (user?.fosrole_id) {
      errs = checkRules({
        value: formState.email,
        rules: ["required", "email"],
        key: "email",
        errors: errs,
      });
    }
    setErrors(errs);
    return errs;
  };

  const onSave = async () => {
    if (hasErrors(validate())) return;
    const newUser = {
      ci: formState.ci,
      name: formState.name,
      middle_name: formState.middle_name,
      last_name: formState.last_name,
      mother_last_name: formState.mother_last_name,
      phone: formState.phone,
      avatar: formState.avatar,
      ...(type !== "homeOwner" && type !== "owner"
        ? { address: formState.address }
        : {}),
      ...(user?.fosrole_id ? { email: formState.email } : {}),
      url_avatar: formState.url_avatar,
    };
    const { data, error: err } = await execute(
      url + "/" + formState.id,
      "PUT",
      newUser,
    );

    if (data?.success) {
      showToast("Perfil actualizado exitosamente", "success");
      reLoad?.();
      reLoadList?.();
      onClose();
    } else {
      console.error("error:", err);
      setErrors(err.data?.errors);
    }
  };
  return (
    <DetailModal
      title="Información personal"
      open={open}
      onClose={onClose}
      buttonText="Guardar cambios"
      buttonCancel="Cancelar"
      onSave={onSave}
      minWidth={480}
      maxWidth={960}
      zIndex={10010}
    >
      <div className={styles.EditProfile}>
        <p className={styles.subtitle}>Ingresa los datos personales del usuario.</p>
        <section>
          <UploadFileProfile
            name={"url_avatar"}
            formState={formState}
            setFormState={setFormState}
            user={user}
          />
        </section>
        <section>
          <div>
            <Input
              label="Carnet de identidad"
              name="ci"
              type="text"
              value={formState.ci}
              disabled
              onChange={onChange}
              error={errors}
            />
            <Input
              label="Teléfono"
              name="phone"
              type="number"
              required={false}
              value={formState.phone}
              onChange={onChange}
              error={errors}
            />
            <Input
              label="Nombre"
              name="name"
              type="text"
              value={formState.name}
              onChange={onChange}
              error={errors}
            />
            <Input
              label="Segundo nombre"
              name="middle_name"
              type="text"
              value={formState.middle_name}
              required={false}
              onChange={onChange}
              error={errors}
            />
            <Input
              label="Apellido paterno"
              name="last_name"
              type="text"
              value={formState.last_name}
              onChange={onChange}
              error={errors}
            />
            <Input
              label="Apellido materno"
              name="mother_last_name"
              type="text"
              value={formState.mother_last_name}
              required={false}
              onChange={onChange}
              error={errors}
            />
            {user?.fosrole_id && (
              <div className={styles.fullWidth}>
                <Input
                  label="Correo electrónico"
                  name="email"
                  type="email"
                  value={formState.email}
                  onChange={onChange}
                  error={errors}
                />
              </div>
            )}
          </div>
          {type !== "homeOwner" && type !== "owner" && (
            <Input
              label="Dirección"
              name="address"
              required={false}
              type="text"
              value={formState.address}
              onChange={onChange}
              error={errors}
            />
          )}
        </section>
      </div>
    </DetailModal>
  );
};

export default EditProfile;
