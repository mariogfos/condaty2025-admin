import DataModal from "@/mk/components/ui/DataModal/DataModal";
import NewModal from "@/mk/components/ui/NewModal/NewModal";
import { useAuth } from "@/mk/contexts/AuthProvider";
import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import {
  IconAdmin,
  IconArrowRight,
  IconEdit,
  IconEmail,
  IconGuardShield,
  IconHousing,
  IconLockEmail,
  IconLook,
  IconPhone,
  IconTrash,
  IconUser,
} from "../layout/icons/IconsBiblioteca";
import styles from "./ProfileModal.module.css";
import WidgetBase from "../Widgets/WidgetBase/WidgetBase";
import { Avatar } from "@/mk/components/ui/Avatar/Avatar";
import { getFullName, getUrlImages } from "@/mk/utils/string";
import Authentication from "@/modulos/Profile/Authentication";
import useAxios from "@/mk/hooks/useAxios";
import EditProfile from "./EditProfile/EditProfile";
import GuardEditForm from "./GuardEditForm/GuardEditForm";
import Button from "@/mk/components/forms/Button/Button";
import Image from "next/image";
import { generateWhatsAppLink } from "@/mk/utils/phone";

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
    if (type === "admin") return `/users`;
    if (type === "owner") return `/owners`;
    if (type === "homeOwner") return `/homeowners`;
    return `/guards`;
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

  // useEffect(() => {
  //   if (dataID) {
  //     reLoadDet({ searchBy: dataID });
  //   }
  // }, [dataID]);
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

    if (data?.data[0]?.type === "FOS") {
      return `/FOS-${userId}.webp?d=${timestamp}`;
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
      });
    }
  }, [openEdit, data]);

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
      return getUrlImages(
        "/CLIENT-" + client?.id + ".webp?d=" + client?.updated_at,
      );
    }
    return "/assets/images/PortadaEmpty.png";
  };

  const clientUsers = data?.data[0]?.clients?.filter(
    (item: ClientItem) => item?.id === user?.client_id,
  );
  const deletePerm = userCan("users", "D");
  const editPerm = userCan("users", "U");

  const canEditThisProfile = () => {
    if (user?.type === "FOS") return true;
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

  return (
    open && (
      <DataModal
        title={titleBack}
        open={open}
        onClose={onClose}
        fullScreen
        variant="V2"
        buttonText=""
        buttonCancel=""
        zIndex={zIndex}
        style={{ backgroundColor: "#191919" }}
      >
        <div className={styles.ProfileModal}>
          <section>
            <div className={styles.headerTitle}>
              <h1>{title}</h1>
              <span className={styles.headerSubtitle}>
                Gestiona tu información personal, rol y seguridad
              </span>
            </div>
            <div>
              {edit && canEditThisProfile() && (
                <button
                  type="button"
                  onClick={() => setOpenEdit(true)}
                  style={{
                    backgroundColor: "var(--cWhiteV2)",
                    padding: 8,
                    borderRadius: "var(--bRadiusS)",
                    cursor: "pointer",
                    border: "none",
                    color: "inherit",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                  }}
                >
                  <IconEdit className="" size={24} color={"var(--cWhite)"} />
                </button>
              )}
              {del && canDeleteThisProfile() && type === "guard" && (
                <button
                  type="button"
                  style={{
                    backgroundColor: "var(--cWhiteV2)",
                    padding: 8,
                    borderRadius: "var(--bRadiusS)",
                    cursor: "pointer",
                    border: "none",
                    color: "inherit",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                  }}
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
              style={{
                width: "100%",
                height: 300,
                borderTopLeftRadius: "var(--bRadiusS)",
                borderTopRightRadius: "var(--bRadiusS)",
                borderBottomLeftRadius: 0,
                borderBottomRightRadius: 0,
                borderBottom: "1px solid var(--cWhiteV2)",
                objectFit: "cover",
                background: "var(--cWhiteV2)",
              }}
              unoptimized
            />
            <div>
              <div>
                <div>
                  <Avatar
                    expandable={true}
                    expandableZIndex={10002}
                    expandableIcon={false}
                    hasImage={1}
                    src={getUrlImages(urlImages)}
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
                  <div
                    style={{
                      whiteSpace: "nowrap",
                      overflow: "hidden",
                      textOverflow: "ellipsis",
                      display: "flex",
                      alignItems: "center",
                      gap: "8px",
                    }}
                  >
                    {IconType}
                    <div style={{ color: "var(--cPrimary)" }}>
                      <strong>Propietario de : </strong>
                      {data?.data[0]?.dptos
                        ?.map((dpto: any) => (
                          <span
                            key={dpto.id}
                            onClick={() => navigateToUnitDetail(dpto.id)}
                            style={{
                              cursor: "pointer",
                              textDecoration: "underline",
                              marginRight: "4px",
                            }}
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
                    const hasDescription = data?.data[0]?.dpto[0]?.description;
                    const hasNro = data?.data[0]?.dpto[0]?.nro;
                    if (hasDescription || hasNro) {
                      address =
                        (data?.data[0]?.dpto[0]?.type?.name || "") +
                        " " +
                        (data?.data[0]?.dpto[0]?.nro || "") +
                        (hasDescription
                          ? " - " + data?.data[0]?.dpto[0]?.description
                          : "");
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
                      <div style={{ display: "flex", flexDirection: "column" }}>
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
                      <div style={{ display: "flex", flexDirection: "column" }}>
                        <span className={styles.fieldLabel}>Contraseña</span>
                        <div
                          style={{
                            display: "flex",
                            alignItems: "center",
                            gap: 8,
                          }}
                        >
                          <span className={styles.fieldValue}>*********</span>
                          <IconLook size={16} color="var(--cWhiteV1)" />
                        </div>
                      </div>
                      <button
                        type="button"
                        className={styles.securityButton}
                        onClick={onChangePassword}
                      >
                        Restablecer contraseña
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </section>
          {user?.id === data?.data[0]?.id && setOnLogout && (
            <div style={{ display: "flex", justifyContent: "flex-start" }}>
              <Button
                onClick={() => {
                  onClose();
                  setOnLogout(true);
                }}
                style={{
                  backgroundColor: "transparent",
                  color: "var(--cError)",
                  border: "none",
                  padding: "0px 0px",
                  width: "auto",
                  minWidth: "auto",
                  textDecorationLine: "underline",
                }}
              >
                Cerrar Sesión
              </Button>
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
              <GuardEditForm
                open={openEdit}
                onClose={() => setOpenEdit(false)}
                formState={formState}
                setFormState={setFormState}
                errors={errors}
                setErrors={setErrors}
                reLoad={() => reLoadDet()}
                reLoadList={reLoad}
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
