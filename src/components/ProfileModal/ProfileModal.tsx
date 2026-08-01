import DataModal from "@/mk/components/ui/DataModal/DataModal";
import { useAuth } from "@/mk/contexts/AuthProvider";
import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import {
  IconAdmin,
  IconEdit,
  IconEmail,
  IconGuardShield,
  IconLook,
  IconPhone,
  IconTrash,
  IconUser,
} from "../layout/icons/IconsBiblioteca";
import styles from "./ProfileModal.module.css";
import { Avatar } from "@/mk/components/ui/Avatar/Avatar";
import { getFullName } from "@/mk/utils/string";
import Authentication from "@/modulos/Profile/Authentication";
import useAxios from "@/mk/hooks/useAxios";
import EditProfile from "./EditProfile/EditProfile";
import GuardEditForm from "./GuardEditForm/GuardEditForm";
import Image from "next/image";
import { generateWhatsAppLink } from "@/mk/utils/phone";
import RenderForm from "@/modulos/Guards/RenderForm/RenderForm";

interface ProfileModalProps {
  open: boolean;
  onClose: () => void;
  reLoad?: Function;
  dataID?: string | number;
  titleBack?: string;
  title?: string;
  edit?: boolean;
  del?: boolean;
  type?: string;
  zIndex?: number;
  setOnLogout?: (value: boolean) => void;
}
interface FormState {
  id?: string | number;
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
  has_image?: number;
}
interface ErrorState {
  [key: string]: string;
}

interface ClientItem {
  id: string | number;
  name: string;
  updated_at: string;
}

interface ChangeEvent {
  target: {
    name: string;
    value: string;
  };
}
interface FormState {
  id?: string | number;
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
  url_avatar?: string;
}
const ProfileModal = ({
  open,
  onClose,
  dataID,
  titleBack = "Volver",
  title = "Mi Perfil",
  reLoad,
  edit = true,
  del = true,
  type,
  zIndex,
  setOnLogout,
}: ProfileModalProps) => {
  const { user, getUser, showToast, userCan, logout } = useAuth();
  const router = useRouter();
  const { execute } = useAxios();
  const [formState, setFormState] = useState<FormState>({});
  const [errors, setErrors] = useState<ErrorState>({});
  const [openAuthModal, setOpenAuthModal] = useState(false);
  const [authType, setAuthType] = useState("");
  const [openEdit, setOpenEdit] = useState(false);
  const [openDel, setOpenDel] = useState(false);
  const client = user?.clients?.filter(
    (item: ClientItem) => item?.id === user?.client_id,
  )?.[0];
  const getIconType = () => {
    if (type === "admin") {
      return <IconAdmin color={"var(--cPrimary)"} size={16} />;
    }
    if (type === "owner" || type === "homeOwner") {
      return <IconUser color={"var(--cPrimary)"} size={18} />;
    }
    return <IconGuardShield color={"var(--cPrimary)"} size={20} />;
  };

  const IconType = getIconType();

  const getUrl = () => {
    if (type === "admin") return `/v3/users`;
    if (type === "owner") return `/v3/owners`;
    if (type === "homeOwner") return `/v3/homeowners`;
    return `/v3/guards`;
  };

  const url = getUrl();

  const { data, reLoad: reLoadDet } = useAxios(
    url,
    "GET",
    {
      searchBy: dataID,
      fullType: "DET",
    },
    true,
  );

  // B1: el useEffect de useAxios solo corre en mount. Sin este reLoad
  // cuando cambia dataID, el modal mostraba los datos del primer user
  // cada vez que se re-abría para otro. Pineá el código comentado que
  // quedó como TODO muerto.
  useEffect(() => {
    if (dataID) {
      reLoadDet({ searchBy: dataID });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [dataID]);
  const getProfileRole = () => {
    if (type === "admin") return data?.data[0]?.role?.[0]?.name;
    if (type === "owner") return data?.data[0]?.type_owner;
    if (type === "homeOwner") return data?.data[0]?.type_owner;
    return "Guardia";
  };

  const profileRole = getProfileRole();
  const imageUrl = () => {
    const userId = data?.data[0]?.id;
    const timestamp = data?.data[0]?.updated_at;

    if (data?.data[0]?.fosrole_id) {
      return `/ADM-${userId}.webp?d=${timestamp}`;
    }

    switch (type) {
      case "admin":
        return `/ADM-${userId}.webp?d=${timestamp}`;
      case "owner":
        return `/OWNER-${userId}.webp?d=${timestamp}`;
      case "homeOwner":
        return `/HOMEOWNER-${userId}.webp?d=${timestamp}`;
      default:
        return `/GUARD-${userId}.webp?d=${timestamp}`;
    }
  };

  const urlImages = imageUrl();
  useEffect(() => {
    if (data?.data[0]) {
      setFormState({
        id: data?.data[0]?.id,
        ci: data?.data[0]?.ci,
        name: data?.data[0]?.name,
        middle_name: data?.data[0]?.middle_name,
        last_name: data?.data[0]?.last_name,
        mother_last_name: data?.data[0]?.mother_last_name,
        phone: data?.data[0]?.phone,
        address: data?.data[0]?.address,
        email: data?.data[0]?.email,
        has_image: parseInt(data?.data[0]?.has_image) || 0,
        url_avatar: data?.data[0]?.url_avatar,
      });
    }
  }, [openEdit, data?.data?.[0]?.id, data]);

  const onChange = (e: ChangeEvent) => {
    setFormState({
      ...formState,
      [e.target.name]: e.target.value,
    });
  };

  const onChangeEmail = () => {
    setAuthType("M");
    setOpenAuthModal(true);
  };

  const onChangePassword = () => {
    setAuthType("P");
    setOpenAuthModal(true);
  };
  const onDel = async () => {
    const { data } = await execute(url + "/" + formState.id, "DELETE", {
      is_canceled: "Y",
    });
    if (data?.success == true) {
      showToast(profileRole + " eliminado con éxito", "success");
      onClose();
      if (reLoad) reLoad();
      reLoadDet();
    } else if (data?.success == false) {
      showToast(data?.message || "Error al eliminar " + profileRole, "error");
    }
  };

  const [portadaError, setPortadaError] = useState(false);
  const getPortadaCliente = () => {
    if (!portadaError) {
      return client?.url_banner?.[0];
    }
    return "/assets/images/PortadaEmpty.png";
  };

  const clientUsers = data?.data[0]?.clients?.filter(
    (item: ClientItem) => item?.id === user?.client_id,
  );
  const deletePerm = userCan("users", "D");
  const editPerm = userCan("users", "U");

  const canEditThisProfile = () => {
    if (user?.fosrole_id) return true;
    if (type === "admin") {
      return editPerm && user?.id === data?.data[0]?.id;
    }

    return editPerm;
  };

  const canDeleteThisProfile = () => {
    if (type === "admin") {
      return deletePerm && user?.id === data?.data[0]?.id;
    }

    return deletePerm;
  };

  const navigateToUnitDetail = (unitId: string | number) => {
    router.push(`/units/${unitId}?returnTo=owners&userType=${type}`);
    onClose();
  };
  const _onClose = () => {
    onClose();
    getUser();
  };

  return (
    open && (
      <DataModal
        title={titleBack}
        open={open}
        onClose={_onClose}
        fullScreen
        variant="V2"
        buttonText=""
        buttonCancel=""
        zIndex={zIndex}
      >
        <div className={styles.ProfileModal}>
          <section>
            <div className={styles.headerTitle}>
              <h1>{title}</h1>
              <span className={styles.headerSubtitle}>
                Gestiona tu información personal, rol y seguridad
              </span>
            </div>
            <div className={styles.headerActions}>
              {edit && canEditThisProfile() && (
                <button
                  type="button"
                  onClick={() => setOpenEdit(true)}
                  className={styles.iconActionButton}
                >
                  <IconEdit className="" size={24} color={"var(--cWhite)"} />
                </button>
              )}
              {del && canDeleteThisProfile() && type === "guard" && (
                <button
                  type="button"
                  className={styles.iconActionButton}
                  onClick={() => setOpenDel(true)}
                >
                  <IconTrash size={24} color={"var(--cWhite)"} />
                </button>
              )}
            </div>
          </section>

          <section>
            <Image
              alt="Foto de portada"
              src={getPortadaCliente()}
              width={800}
              height={300}
              onError={() => setPortadaError(true)}
              className={styles.coverImage}
              unoptimized
            />
            <div>
              <div>
                <div>
                  <Avatar
                    expandable={true}
                    expandableZIndex={10002}
                    expandableIcon={false}
                    src={data?.data[0]?.url_avatar}
                    name={getFullName(data?.data[0], "NSLM")}
                    w={191}
                    h={191}
                  />
                  <div>
                    <span> {getFullName(data?.data[0], "NSLM")}</span>
                    <span>{profileRole}</span>
                  </div>
                </div>
              </div>

              <div>
                {(type === "admin" || type === "guard") && (
                  <div>
                    {IconType}
                    {profileRole}
                  </div>
                )}

                {data?.data[0]?.dptos && data?.data[0]?.dptos?.length > 0 && (
                  <div className={styles.unitOwnership}>
                    {IconType}
                    <div className={styles.contactAccent}>
                      <strong>Propietario de : </strong>
                      {data?.data[0]?.dptos
                        ?.map((dpto: any) => (
                          <span
                            key={dpto.id}
                            onClick={() => navigateToUnitDetail(dpto.id)}
                            className={styles.unitLink}
                          >
                            {`${dpto?.type?.name || "Unidad"} ${dpto?.nro}`}
                          </span>
                        ))
                        .reduce((prev: any, curr: any) => [prev, ",", curr])}
                    </div>
                  </div>
                )}

                <div>
                  <IconPhone size={20} color={"var(--cWhiteV1)"} />
                  {(() => {
                    const link = generateWhatsAppLink(
                      data?.data[0]?.phone || "",
                    );
                    if (link) {
                      return (
                        <a
                          href={link}
                          target="_blank"
                          rel="noopener noreferrer"
                          className={styles.phoneLink}
                        >
                          {data?.data[0]?.phone}
                        </a>
                      );
                    }
                    return data?.data[0]?.phone || "-/-";
                  })()}
                </div>
                <div>
                  <IconEmail size={20} color={"var(--cWhiteV1)"} />
                  {data?.data[0]?.email || "-/-"}
                </div>
              </div>
            </div>
          </section>
          <section>
            {/* Column 1: Información personal */}
            <div className={styles.infoColumn}>
              <h3 className={styles.infoTitle}>Información personal</h3>
              <div className={styles.infoCard}>
                {data?.data[0]?.ci && (
                  <div className={styles.fieldGroup}>
                    <span className={styles.fieldLabel}>
                      Carnet de identidad
                    </span>
                    <span className={styles.fieldValue}>
                      {data?.data[0]?.ci}
                    </span>
                  </div>
                )}
                {data?.data[0]?.phone && (
                  <div className={styles.fieldGroup}>
                    <span className={styles.fieldLabel}>Número de celular</span>
                    <span className={styles.fieldValue}>
                      {data?.data[0]?.phone}
                    </span>
                  </div>
                )}
                {(() => {
                  let address = "";
                  if (type === "owner") {
                    // B2: optional chaining en [0] — antes era `dpto[0]?.x`
                    // que crasheaba si dpto era null/undefined. También
                    // pinea fallback a string vacío para que la concatenación
                    // no produzca "undefined".
                    const dpto = data?.data[0]?.dpto?.[0];
                    const hasDescription = dpto?.description;
                    const hasNro = dpto?.nro;
                    if (hasDescription || hasNro) {
                      address =
                        (dpto?.type?.name || "") +
                        " " +
                        (dpto?.nro || "") +
                        (hasDescription ? " - " + dpto.description : "");
                    }
                  } else {
                    address = data?.data[0]?.address;
                  }

                  if (address) {
                    return (
                      <div className={styles.fieldGroup}>
                        <span className={styles.fieldLabel}>Domicilio</span>
                        <span className={styles.fieldValue}>{address}</span>
                      </div>
                    );
                  }
                  return null;
                })()}
              </div>
            </div>

            {/* Column 2: Rol y acceso */}
            <div className={styles.infoColumn}>
              <h3 className={styles.infoTitle}>Rol y acceso</h3>
              <div className={styles.infoCard}>
                <div className={styles.fieldGroup}>
                  <span className={styles.fieldLabel}>Rol</span>
                  <span className={styles.fieldValue}>{profileRole}</span>
                </div>
                {data?.data[0]?.email && (
                  <div className={styles.fieldGroup}>
                    <span className={styles.fieldLabel}>Email</span>
                    <span className={styles.fieldValue}>
                      {data?.data[0]?.email}
                    </span>
                  </div>
                )}
                {type !== "homeOwner" &&
                  clientUsers &&
                  clientUsers.length > 0 && (
                    <div className={styles.fieldGroup}>
                      <span className={styles.fieldLabel}>Condominio</span>
                      <div className={styles.fieldValue}>
                        {clientUsers.map((item: ClientItem) => (
                          <div key={item.id}>{item.name}</div>
                        ))}
                      </div>
                    </div>
                  )}
              </div>
            </div>

            {/* Column 3: Seguridad de la cuenta (Only if it's the user's own profile) */}
            {user?.id === data?.data[0]?.id && (
              <div className={styles.infoColumn}>
                <h3 className={styles.infoTitle}>Seguridad de la cuenta</h3>
                <div className={styles.infoCard}>
                  <div className={styles.securityItem}>
                    <div className={styles.securityHeader}>
                      <div className={styles.securityValueGroup}>
                        <span className={styles.fieldLabel}>Email</span>
                        <span className={styles.fieldValue}>
                          {data?.data[0]?.email || "-"}
                        </span>
                      </div>
                      <button
                        type="button"
                        className={styles.securityButton}
                        onClick={onChangeEmail}
                      >
                        Cambiar correo
                      </button>
                    </div>
                  </div>
                  <div className={styles.securityItem}>
                    <div className={styles.securityHeader}>
                      <div className={styles.securityValueGroup}>
                        <span className={styles.fieldLabel}>Contraseña</span>
                        <div className={styles.passwordValue}>
                          <span className={styles.fieldValue}>*********</span>
                          <IconLook size={16} color="var(--cWhiteV1)" />
                        </div>
                      </div>
                      <button
                        type="button"
                        className={styles.securityButton}
                        onClick={onChangePassword}
                      >
                        Restablecer
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </section>
          {user?.id === data?.data[0]?.id && setOnLogout && (
            <div className={styles.logoutRow}>
              <button
                type="button"
                onClick={() => {
                  onClose();
                  setOnLogout(true);
                }}
                className={styles.logoutButton}
              >
                Cerrar Sesión
              </button>
            </div>
          )}
        </div>
        {openAuthModal && (
          <Authentication
            open={openAuthModal}
            onClose={() => setOpenAuthModal(false)}
            type={authType}
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

        {openEdit && (
          <>
            {type === "guard" ? (
              <RenderForm
                open={openEdit}
                onClose={() => setOpenEdit(false)}
                item={formState}
                execute={execute}
                reLoad={() => {
                  reLoadDet();
                  if (reLoad) reLoad();
                }}
              />
            ) : (
              <EditProfile
                open={openEdit}
                onClose={() => setOpenEdit(false)}
                formState={formState}
                onChange={onChange}
                errors={errors}
                urlImages={urlImages}
                setErrors={setErrors}
                setFormState={setFormState}
                url={url}
                reLoad={() => reLoadDet()}
                reLoadList={reLoad}
                type={type}
              />
            )}
          </>
        )}
        {openDel && type === "guard" && (
          <DataModal
            title={`Eliminar ${profileRole.toLocaleLowerCase()}`}
            open={openDel}
            onClose={() => setOpenDel(false)}
            buttonText="Eliminar"
            buttonCancel="Cancelar"
            onSave={onDel}
            variant={"mini"}
          >
            <div>
              <p style={{ fontSize: "var(--sL)" }}>
                ¿Estás seguro de que quieres eliminar este registro?
              </p>
              <p style={{ fontSize: "var(--sL)" }}>
                Esta acción no se puede deshacer.
              </p>
            </div>
          </DataModal>
        )}
      </DataModal>
    )
  );
};

export default ProfileModal;
