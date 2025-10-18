import DataModal from "@/mk/components/ui/DataModal/DataModal";
import { useAuth } from "@/mk/contexts/AuthProvider";
import React, { useEffect, useState } from "react";
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
import Image from 'next/image';

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
  has_image?: number; // Agregar has_image
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
  const { execute } = useAxios();
  const [formState, setFormState] = useState<FormState>({});
  const [errors, setErrors] = useState<ErrorState>({});
  const [openAuthModal, setOpenAuthModal] = useState(false);
  const [authType, setAuthType] = useState("");
  const [openEdit, setOpenEdit] = useState(false);
  const [openDel, setOpenDel] = useState(false);
  const client = user?.clients?.filter(
    (item: ClientItem) => item?.id === user?.client_id
  )?.[0];
  const getIconType = () => {
    if (type === "admin") {
      return <IconAdmin color={"var(--cSuccess)"} size={16} />;
    }
    if (type === "owner" || type === "homeOwner") {
      return <IconUser color={"var(--cSuccess)"} size={18} />;
    }
    return <IconGuardShield color={"var(--cSuccess)"} size={20} />;
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
    true
  );
  const getProfileRole = () => {
    if (type === "admin") return data?.data[0]?.role[0]?.name;
    if (type === "owner") return data?.data[0].type_owner;
    if (type === "homeOwner") return data?.data[0].type_owner;
    return "Guardia";
  };

  const profileRole = getProfileRole();
  const imageUrl = () => {
    const userId = data?.data[0]?.id;
    const timestamp = data?.data[0]?.updated_at;

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
        "/CLIENT-" + client?.id + ".webp?d=" + client?.updated_at
      );
    }
    return "/assets/images/PortadaEmpty.png";
  };

  const clientUsers = data?.data[0]?.clients?.filter(
    (item: ClientItem) => item?.id === user?.client_id
  );
  const deletePerm = userCan("users", "D");
  const editPerm = userCan("users", "U");

  // Verificar si el usuario puede editar este perfil específico
  const canEditThisProfile = () => {
    if (type === "admin") {
      // Para administradores, solo pueden editar su propio perfil
      return editPerm && user?.id === data?.data[0]?.id;
    }
    // Para otros tipos de usuarios, usar el permiso general
    return editPerm;
  };

  // Verificar si el usuario puede eliminar este perfil específico
  const canDeleteThisProfile = () => {
    if (type === "admin") {
      // Para administradores, solo pueden eliminar su propio perfil
      return deletePerm && user?.id === data?.data[0]?.id;
    }
    // Para otros tipos de usuarios, usar el permiso general
    return deletePerm;
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
      >
        <div className={styles.ProfileModal}>
          <section>
            <h1>{title}</h1>
            <div>
              {edit && canEditThisProfile() && (
                <button
                  type="button"
                  onClick={() => setOpenEdit(true)}
                  style={{
                    backgroundColor: 'var(--cWhiteV2)',
                    padding: 8,
                    borderRadius: 'var(--bRadiusS)',
                    cursor: 'pointer',
                    border: 'none',
                    color: 'inherit',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                >
                  <IconEdit className="" size={24} color={'var(--cWhite)'} />
                </button>
              )}
              {del && canDeleteThisProfile() && (
                <button
                  type="button"
                  style={{
                    backgroundColor: 'var(--cWhiteV2)',
                    padding: 8,
                    borderRadius: 'var(--bRadiusS)',
                    cursor: 'pointer',
                    border: 'none',
                    color: 'inherit',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                  onClick={() => setOpenDel(true)}
                >
                  <IconTrash size={24} color={'var(--cWhite)'} />
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
                width: '100%',
                height: 300,
                borderTopLeftRadius: 'var(--bRadiusS)',
                borderTopRightRadius: 'var(--bRadiusS)',
                borderBottomLeftRadius: 0,
                borderBottomRightRadius: 0,
                borderBottom: '1px solid var(--cWhiteV2)',
                objectFit: 'cover',
                background: 'var(--cWhiteV2)',
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
                    name={getFullName(data?.data[0], 'NSLM')}
                    w={191}
                    h={191}
                  />
                  <div>
                    <span> {getFullName(data?.data[0], 'NSLM')}</span>
                    <span>{profileRole}</span>
                  </div>
                </div>
              </div>

              <div>
                {/* Mostrar solo el rol para admin y guardia */}
                {(type === 'admin' || type === 'guard') && (
                  <div>
                    {IconType}
                    {profileRole}
                  </div>
                )}

                {/* Para owner y homeOwner mostrar departamento donde vive */}
                {data?.data[0]?.dpto?.[0]?.nro && (
                  <div>
                    {IconType}
                    {`${data?.data[0]?.dpto?.[0]?.type?.name || 'Unidad'} ${data?.data[0]?.dpto?.[0]?.nro}`} 
                  </div>
                )}

                {/* Para owner y homeOwner mostrar lista de departamentos que posee en UNA sola línea */}
                {data?.data[0]?.dptos && data?.data[0]?.dptos?.length > 0 && (
                  <div style={{ whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                   {/* <IconHousing size={20} color={'var(--cWhiteV1)'} /> */}
                    {IconType}
                    {data?.data[0]?.dptos?.map((dpto: any) => `${dpto?.type?.name || 'Unidad'} ${dpto?.nro}`).join(', ')}
                  </div>
                )}

                <div>
                  <IconPhone size={20} color={'var(--cWhiteV1)'} />
                  {data?.data[0]?.phone || '-/-'}
                </div>
                <div>
                  <IconEmail size={20} color={'var(--cWhiteV1)'} />
                  {data?.data[0]?.email || '-/-'}
                </div>
              </div>
            </div>
          </section>
          <section>
            <WidgetBase title={'Datos Personales'} variant={'V1'} titleStyle={{ fontSize: 16 }}>
              <div className="bottomLine" />
              <div>
                <div>Carnet de identidad</div>
                <div>{data?.data[0]?.ci}</div>
              </div>
              {type !== 'homeOwner' && (
                <>
                  <div className="bottomLine" />
                  <div>
                    <div>Condominio</div>
                    {clientUsers?.map((item: ClientItem) => (
                      <div key={item.id}>{item.name}</div>
                    ))}
                  </div>
                </>
              )}

              <div className="bottomLine" />

              <div>
                <div>Dirección</div>
                <div>
                  {(() => {
                    if (type === 'owner') {
                      const hasDescription = data?.data[0]?.dpto[0]?.description;
                      const hasNro = data?.data[0]?.dpto[0]?.nro;
                      if (!hasDescription || !hasNro) {
                        return '-/-';
                      }
                      return data.data[0].dpto[0].description;
                    }
                    return data?.data[0]?.address || '-/-';
                  })()}
                </div>
              </div>

              <div className="bottomLine" />
            </WidgetBase>
            <WidgetBase
              title={'Documentos Personales'}
              variant={'V1'}
              titleStyle={{ fontSize: 16 }}
            >
              <div style={{ marginTop: 10 }} className="bottomLine" />
              <div style={{ marginTop: 16 }}>Sin datos para mostrar</div>
            </WidgetBase>

            {user?.id === data?.data[0]?.id && (
              <WidgetBase title={'Datos de acceso'} variant={'V1'} titleStyle={{ fontSize: 16 }}>
                <div style={{ marginTop: 10 }} className="bottomLine" />

                <button
                  type="button"
                  className={styles.buttonChange}
                  onClick={onChangeEmail}
                  style={{
                    background: 'none',
                    border: 'none',
                    padding: 0,
                    width: '100%',
                    textAlign: 'left',
                    cursor: 'pointer',
                    color: 'inherit',
                    display: 'flex',
                    alignItems: 'center',
                  }}
                >
                  <IconLockEmail reverse />
                  <div className={styles.accessChange}>
                    <p>Cambiar correo electrónico</p>
                    <IconArrowRight className={styles.iconArrow} />
                  </div>
                </button>
                <div className="bottomLine" />
                <button
                  type="button"
                  className={styles.buttonChange}
                  onClick={onChangePassword}
                  style={{
                    background: 'none',
                    border: 'none',
                    padding: 0,
                    width: '100%',
                    textAlign: 'left',
                    cursor: 'pointer',
                    color: 'inherit',
                    display: 'flex',
                    alignItems: 'center',
                  }}
                >
                  <IconLook reverse />
                  <div className={styles.accessChange}>
                    <p>Cambiar contraseña</p>
                    <IconArrowRight className={styles.iconArrow} />
                  </div>
                </button>
                <div className="bottomLine" />
              </WidgetBase>
            )}
          </section>
          {user?.id === data?.data[0]?.id && setOnLogout && (
            <div style={{ display: 'flex', justifyContent: 'flex-start' }}>
              <Button
                onClick={() => {
                  onClose();
                  setOnLogout(true);
                }}
                style={{
                  backgroundColor: 'transparent',
                  color: 'var(--cError)',
                  border: 'none',
                  padding: '0px 0px',
                  width: 'auto',
                  minWidth: 'auto',
                  textDecorationLine: 'underline',
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
            {type === 'guard' ? (
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
        {openDel && (
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
              <p style={{ fontSize: 'var(--sL)' }}>
                ¿Estás seguro de que quieres eliminar este registro?
              </p>
              <p style={{ fontSize: 'var(--sL)' }}>Esta acción no se puede deshacer.</p>
            </div>
          </DataModal>
        )}
      </DataModal>
    )
  );
};

export default ProfileModal;
