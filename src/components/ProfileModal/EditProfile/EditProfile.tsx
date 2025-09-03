import Input from "@/mk/components/forms/Input/Input";
import DataModal from "@/mk/components/ui/DataModal/DataModal";
import React, { useState } from "react";
import styles from "./EditProfile.module.css";
import { Avatar } from "@/mk/components/ui/Avatar/Avatar";
import {
  IconImage,
} from "@/components/layout/icons/IconsBiblioteca";
import { getFullName, getUrlImages } from "@/mk/utils/string";
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
  const [preview, setPreview] = useState<string | null>(null);
  const { showToast } = useAuth();
  const { execute } = useAxios();

  const getAvatarUrl = () => {
    if (preview) {
      return preview;
    }
    return getUrlImages(urlImages);
  };
  const onChangeFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    try {
      const file = e.target.files?.[0];
      if (!file) return;

      if (
        !["png", "jpg", "jpeg"].includes(
          file.name.split(".").pop()?.toLowerCase() || ""
        )
      ) {
        showToast("Solo se permiten imágenes png, jpg, jpeg", "error");
        return;
      }

      const reader = new FileReader();
      reader.onload = (e) => {
        const result = e.target?.result as string;
        let base64String = result.replace("data:", "").replace(/^.+,/, "");
        base64String = encodeURIComponent(base64String);
        setPreview(result);
        setFormState({
          ...formState,
          avatar: { file: base64String, ext: "webp" },
        });
      };
      reader.readAsDataURL(file);
    } catch (error) {
      console.error(error);
      setPreview(null);
      setFormState({
        ...formState,
        avatar: { file: "", ext: "" },
      });
    }
  };

  const validate = () => {
    let errs: any = {};
    errs = checkRules({
      value: formState.name,
      rules: ["required", "alpha", "noSpaces"],
      key: "name",
      errors: errs,
    });
    errs = checkRules({
      value: formState.middle_name,
      rules: ["alpha", "noSpaces"],
      key: "middle_name",
      errors: errs,
    });
    errs = checkRules({
      value: formState.last_name,
      rules: ["required", "alpha", "noSpaces"],
      key: "last_name",
      errors: errs,
    });
    errs = checkRules({
      value: formState.mother_last_name,
      rules: ["alpha", "noSpaces"],
      key: "mother_last_name",
      errors: errs,
    });
    errs = checkRules({
      value: formState.phone,
      rules: ["numeric", "min:8"],
      key: "phone",
      errors: errs,
    });
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
    };
    const { data, error: err } = await execute(
      url + "/" + formState.id,
      "PUT",
      newUser
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
    >
      <div className={styles.EditProfile}>
        <section>
          <Avatar
            // hasImage={formState.has_image}
            name={getFullName(formState)}
            src={getAvatarUrl()}
            w={320}
            h={320}
            className={styles.modalAvatar}
          >
            <label htmlFor="imagePerfil" className={styles.imageButton}>
              <IconImage
                className={styles.imageIcon}
                color={"var(--cWhite)"}
                size={72}
              />
              <p
                style={{
                  overflow: "visible",
                  color: "var(--cAccent)",
                  borderBottom: "1px solid var(--cAccent)",
                  fontWeight: "Bold",
                }}
              >
                Cambiar foto
              </p>
            </label>
          </Avatar>
          <input
            type="file"
            id="imagePerfil"
            className={styles.hiddenInput}
            onChange={onChangeFile}
            accept="image/*"
          />
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
