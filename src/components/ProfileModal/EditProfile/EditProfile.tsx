import Input from "@/mk/components/forms/Input/Input";
import DataModal from "@/mk/components/ui/DataModal/DataModal";
import React from "react";
import styles from "./EditProfile.module.css";
import { UploadFile } from "@/mk/components/forms/UploadFile/UploadFile";
import { getUrlImages, getFullName } from "@/mk/utils/string";
import Button from "@/mk/components/forms/Button/Button";
import { useAuth } from "@/mk/contexts/AuthProvider";
import { checkRules, hasErrors } from "@/mk/utils/validate/Rules";
import useAxios from "@/mk/hooks/useAxios";

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
    if (user?.type === "FOS") {
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
      ...(user?.type === "FOS" ? { email: formState.email } : {}),
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
    <DataModal
      title={"Editar"}
      open={open}
      onClose={onClose}
      buttonText=""
      buttonCancel=""
      minWidth={480}
      maxWidth={960}
    >
      <div className={styles.EditProfile}>
        <section>
          <div
            style={{
              width: "260px",
              height: "260px",
              margin: "0 auto 20px auto",
            }}
          >
            <UploadFile
              name="avatar"
              value={
                formState.has_image === 1 ||
                formState.has_image === "1" ||
                formState.avatar
                  ? formState.avatar || getUrlImages(urlImages)
                  : ""
              }
              onChange={(e: any) => {
                setFormState({ ...formState, avatar: e.target.value });
              }}
              ext={["jpg", "png", "jpeg", "webp"]}
              img
              error={errors}
              setError={setErrors}
              sizePreview={{ width: "100%", height: "100%" }}
              avatar={true}
              userName={getFullName(formState)}
            />
          </div>
        </section>
        <section>
          <div>
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
            {user?.type === "FOS" && (
              <Input
                label="Correo electrónico"
                name="email"
                type="email"
                value={formState.email}
                onChange={onChange}
                error={errors}
              />
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
          <div>
            <div>
              <Button
                onClick={onClose}
                style={{ width: 100 }}
                variant="secondary"
              >
                Cancelar
              </Button>
              <Button
                onClick={() => {
                  onSave();
                }}
                variant="primary"
              >
                Guardar Cambios
              </Button>
            </div>
          </div>
        </section>
      </div>
    </DataModal>
  );
};

export default EditProfile;
