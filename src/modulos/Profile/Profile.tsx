/* eslint-disable @next/next/no-img-element */
"use client";

import { useEffect, useState } from "react";
import { useAuth } from "@/mk/contexts/AuthProvider";
import useAxios from "@/mk/hooks/useAxios";
import { Avatar } from "@/mk/components/ui/Avatar/Avatar";
import { getFullName, getUrlImages } from "@/mk/utils/string";
import DataModal from "@/mk/components/ui/DataModal/DataModal";
import InputFullName from "@/mk/components/forms/InputFullName/InputFullName";
import { checkRules, hasErrors } from "@/mk/utils/validate/Rules";
import {
  IconCamera,
  IconEmail,
  IconLook,
} from "@/components/layout/icons/IconsBiblioteca";
import Button from "@/mk/components/forms/Button/Button";
import Authentication from "./Authentication";
import styles from "./profile.module.css";

interface FormState {
  ci?: string;
  name?: string;
  middle_name?: string;
  last_name?: string;
  mother_last_name?: string;
  phone?: string;
  avatar?: string;
  address?: string;
  email?: string;
  password?: string;
  pinned?: number;
  code?: string;
}

const Profile = () => {
  const { user, getUser, showToast, userCan, logout } = useAuth();
  const [formState, setFormState] = useState<FormState>({});
  const [errors, setErrors] = useState<any>({});
  const [preview, setPreview] = useState<string | null>(null);
  const { execute } = useAxios();
  const [editProfile, setEditProfile] = useState(false);
  const [openAuthModal, setOpenAuthModal] = useState(false);
  const [openProfileModal, setOpenProfileModal] = useState(false);
  const [onLogout, setOnLogout] = useState(false);
  const [type, setType] = useState("");

  
  const { setStore } = useAuth();
  useEffect(() => {
    setStore({ title: "PERFIL" });
  }, []);
  
  // Obtenemos la URL del avatar
  const getAvatarUrl = () => {
    // Si hay una vista previa (al subir nueva imagen), usamos esa
    if (preview) {
      return preview;
    }
    // Si no, generamos la URL con la función getUrlImages
    return getUrlImages(`/ADM-${user?.id}.webp?d=${user?.updated_at}`);
  };

  useEffect(() => {
    setFormState((prevState: any) => ({ ...prevState, ...user }));
  }, [user]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setFormState({ ...formState, [e.target.name]: value });
  };

  const validate = () => {
    let errors: any = {};

    errors = checkRules({
      value: formState.ci,
      rules: ["required", "max:11"],
      key: "ci",
      errors,
    });

    errors = checkRules({
      value: formState.name,
      rules: ["required", "alpha"],
      key: "name",
      errors,
    });

    errors = checkRules({
      value: formState.last_name,
      rules: ["required", "alpha"],
      key: "last_name",
      errors,
    });

    setErrors(errors);
    return errors;
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
      address: formState.address,
    };

    const { data, error: err } = await execute(
      "/users/" + user.id,
      "PUT",
      newUser
    );

    if (data?.success) {
      getUser();
      showToast("Perfil actualizado exitosamente", "success");
      setEditProfile(false);
      setOpenProfileModal(false);
    } else {
      console.error("error:", err);
      setErrors(err.data?.errors);
    }
  };

  const onCancel = () => {
    setEditProfile(false);
    setFormState(user);
    setErrors({});
    setOpenProfileModal(false);
    setPreview(null);
  };

  const onChangeFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    try {
      const file = e.target.files?.[0];
      if (!file) return;
      
      if (!["png", "jpg", "jpeg"].includes(file.name.split('.').pop()?.toLowerCase() || '')) {
        showToast("Solo se permiten imágenes png, jpg, jpeg", "error");
        return;
      }

      const reader = new FileReader();
      reader.onload = (e) => {
        const result = e.target?.result as string;
        let base64String = result.replace("data:", "").replace(/^.+,/, "");
        base64String = encodeURIComponent(base64String);
        setPreview(result);
        setFormState({ ...formState, avatar: base64String });
      };
      reader.readAsDataURL(file);
    } catch (error) {
      console.error(error);
      setPreview(null);
      setFormState({ ...formState, avatar: "" });
    }
  };

  const onEditProfile = () => {
    setOpenProfileModal(true);
  };

  const onChangeEmail = () => {
    setType("M");
    setOpenAuthModal(true);
  };

  const onChangePassword = () => {
    setType("P");
    setOpenAuthModal(true);
  };

  return (
    <div className={styles.profileContainer}>
      <div className={styles.mainContent}>
        <div className={styles.profileGrid}>
          <div className={styles.imageSection}>
            <div className={styles.imageContainer}>
              {/* Avatar para móvil */}
              <div className={styles.mobileAvatarWrapper}>
                <Avatar
                  src={getAvatarUrl()}
                  name={getFullName(user)}
                  w={112}
                  h={112}
                  className={styles.avatar}
                >
                  {editProfile && (
                    <label
                      htmlFor="imagePerfil"
                      className={styles.cameraButton}
                    >
                      <IconCamera className={styles.cameraIcon} size={16} />
                    </label>
                  )}
                </Avatar>
              </div>

              {/* Avatar para desktop */}
              <div className={styles.desktopImageContainer}>
                <Avatar
                  src={getAvatarUrl()}
                  name={getFullName(user)}
                  w={350}
                  h={350}
                  className={styles.avatar}
                >
                  {editProfile && (
                    <label
                      htmlFor="imagePerfil"
                      className={styles.cameraButton}
                    >
                      <IconCamera className={styles.cameraIcon} size={16} />
                    </label>
                  )}
                </Avatar>
              </div>
            </div>

            {!editProfile && (
              <div className={styles.editButton}>
                <Button
                  className={styles.editProfileButton}
                  onClick={onEditProfile}
                >
                  Editar Perfil
                </Button>
              </div>
            )}
          </div>

          <input
            type="file"
            id="imagePerfil"
            className={styles.hiddenInput}
            onChange={onChangeFile}
            accept="image/*"
          />

          <div className={styles.formSection}>
            {!editProfile ? (
              <>
                <div className={styles.sectionTitle}>
                  Datos Personales
                </div>

                <div className={styles.infoCard}>
                  <div className={styles.infoLabel}>Nombre completo</div>
                  <div className={styles.infoValue}>
                    {getFullName(formState) || "Sin datos"}
                  </div>
                  <div className={styles.divider} />

                  <div className={styles.infoLabel}>Carnet de identidad</div>
                  <div className={styles.infoValue}>
                    {formState.ci || "Sin datos"}
                  </div>
                  <div className={styles.divider} />

                  <div className={styles.infoLabel}>Teléfono</div>
                  <div className={styles.infoValue}>
                    {formState.phone || "Sin datos"}
                  </div>
                  <div className={styles.divider} />

                  <div className={styles.infoLabel}>Correo electrónico</div>
                  <div className={styles.infoValue}>
                    {formState.email || "Sin datos"}
                  </div>
                </div>
              </>
            ) : (
              <>
                <div className={styles.sectionTitle}>
                  Editar Perfil
                </div>
                <InputFullName
                  value={formState}
                  errors={errors}
                  onChange={handleChange}
                  disabled={false}
                  onBlur={validate}
                  name={""}
                />
                <Button 
                  onClick={onSave}
                  className={styles.saveButton}
                >
                  Guardar Cambios
                </Button>
              </>
            )}
          </div>
        </div>

        <div className={styles.accessSection}>
          <div className={styles.sectionTitle}>
            Datos de Acceso
          </div>
          
          <div className={styles.buttonsContainer}>
            <Button
              onClick={onChangeEmail}
              className={styles.accessButton}
            >
              <IconEmail className={styles.buttonIcon} />
              Cambiar correo electrónico
            </Button>

            <Button
              onClick={onChangePassword}
              className={styles.accessButton}
            >
              <IconLook className={styles.buttonIcon} />
              Cambiar contraseña
            </Button>
          </div>
        </div>
      </div>

      {/* Modal para editar perfil */}
      <DataModal
        open={openProfileModal}
        onClose={onCancel}
        title="Editar información personal"
        onSave={onSave}
        buttonText="Guardar cambios"
        buttonCancel="Cancelar"
      >
        <div className={styles.profileModal}>
          <Avatar
            name={getFullName(user)}
            src={getAvatarUrl()}
            w={100}
            h={100}
            className={styles.modalAvatar}
          >
            <label
              htmlFor="imagePerfil"
              className={styles.cameraButton}
            >
              <IconCamera className={styles.cameraIcon} size={16} />
            </label>
          </Avatar>

          <input
            type="file"
            id="imagePerfil"
            className={styles.hiddenInput}
            onChange={onChangeFile}
            accept="image/*"
          />

          <div className={styles.formInput}>
            <InputFullName
              value={formState}
              name={"full_name"}
              errors={errors}
              onChange={handleChange}
              disabled={false}
              onBlur={validate}
            />
          </div>
        </div>
      </DataModal>

      {/* Modal para cerrar sesión */}
      <DataModal
        open={onLogout}
        title="Cerrar sesión"
        onClose={() => setOnLogout(false)}
        buttonText="Cerrar sesión"
        buttonCancel="Cancelar"
        onSave={() => logout()}
      >
        <p className={styles.modalLogout}>
          ¿Estás seguro de que deseas cerrar sesión?
        </p>
      </DataModal>

      {/* Modal para autenticación */}
      {openAuthModal && (
        <Authentication
          open={openAuthModal}
          onClose={() => setOpenAuthModal(false)}
          type={type}
          formState={formState}
          setFormState={setFormState}
          errors={errors}
          setErrors={setErrors}
          execute={execute}
          getUser={getUser}
          user={user}
          showToast={showToast}
        />
      )}
    </div>
  );
};

export default Profile;