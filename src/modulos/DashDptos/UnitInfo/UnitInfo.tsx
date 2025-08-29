"use client";
import { useState, useEffect } from "react";
import { getFullName, getUrlImages } from "@/mk/utils/string";
import { Avatar } from "@/mk/components/ui/Avatar/Avatar";
import EmptyData from "@/components/NoData/EmptyData";
import Button from "@/mk/components/forms/Button/Button";
import Tooltip from "@/mk/components/ui/Tooltip/Tooltip";
import {
  IconArrowDown,
  IconEdit,
  IconTrash,
  IconHomePerson2,
} from "@/components/layout/icons/IconsBiblioteca";
import styles from "../DashDptos.module.css";
import Br from "@/components/Detail/Br";
import useAxios from "@/mk/hooks/useAxios";

interface UnitInfoProps {
  datas: any;
  onEdit: () => void;
  onDelete: () => void;
  onTitular: (type: "H" | "T", action?: 'new' | 'change') => void;
  onRemoveTitular: (type: "H" | "T") => void;
  onOpenDependentProfile: (ownerId: string) => void;
  onOpenTitularHist: () => void;
}

const UnitInfo = ({
  datas,
  onEdit,
  onDelete,
  onTitular,
  onRemoveTitular,
  onOpenDependentProfile,
  onOpenTitularHist,
}: UnitInfoProps) => {
  const [openOwnerMenu, setOpenOwnerMenu] = useState(false);
  const [openTenantMenu, setOpenTenantMenu] = useState(false);
  const [openTitularSelector, setOpenTitularSelector] = useState(false);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as HTMLElement;
      if (
        !target.closest(`.${styles.menuDots}`) &&
        !target.closest(`.${styles.dropdownMenu}`) &&
        !target.closest(`.${styles.tenantDropdown}`)
      ) {
        setOpenOwnerMenu(false);
        setOpenTenantMenu(false);
        setOpenTitularSelector(false);
      }
    };

    if (openOwnerMenu || openTenantMenu || openTitularSelector) {
      document.addEventListener("mousedown", handleClickOutside);
    }

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [openOwnerMenu, openTenantMenu, openTitularSelector]);

  const owner = datas?.homeowner;
  const ownerUpdatedAtQuery = owner?.updated_at ? `?d=${owner.updated_at}` : "";
  const ownerAvatarSrc = owner?.id
    ? getUrlImages(`/OWNER-${owner.id}.webp${ownerUpdatedAtQuery}`)
    : "";
  const tenant = datas?.tenant;
  const tenantUpdatedAtQuery = tenant?.updated_at
    ? `?d=${tenant.updated_at}`
    : "";
  const tenantAvatarSrc = tenant?.id
    ? getUrlImages(`/OWNER-${tenant.id}.webp${tenantUpdatedAtQuery}`)
    : "";

  const currentHolder = datas?.data?.holder;
  const HandleTitular = () => {
    if (currentHolder === "H") return "Propietario";
    if (currentHolder === "T") return "Residente";
    if (datas?.tenant) return "Residente";
    if (datas?.data?.homeowner) return "Propietario";
    return "Sin asignar";
  };

  const { execute } = useAxios();

  const changeTitular = async (holder: "H" | "T") => {
    setOpenTitularSelector(false);
    const dptoId = datas?.data?.id || datas?.data?.dpto_id || null;
    if (!dptoId) {
      console.error("Falta dpto_id para cambiar titular", { dptoId });
      return;
    }

    try {
      const { data } = await execute("/dptos-change-titular", "POST", {
        dpto_id: dptoId,
        holder,
      });
      if (data?.success) {
        window.location.reload();
      } else {
        console.error("Error al cambiar titular", data?.message || data);
      }
    } catch (error) {
      console.error("Error al llamar a /dptos-change-titular", error);
    }
  };
  return (
    <div className={styles.infoCard}>
      <div className={styles.cardHeader}>
        <div>
          <p className={styles.title}>
            {datas?.data?.type.name} {datas?.data?.nro}
          </p>
          <p className={styles.subtitle}>{datas?.data?.description}</p>
        </div>
        <div style={{ display: 'flex', gap: 12 }}>
          <div className={styles.iconActions}>
            <IconEdit size={30} onClick={onEdit} />
          </div>
          {!datas?.tenant && !datas?.homeowner && (
            <div className={styles.iconActions}>
              <IconTrash size={30} onClick={onDelete} />
            </div>
          )}
        </div>
      </div>

      <Br style={{ marginTop: 16, marginBottom: 16 }} />

      {/* Sección de información de la unidad */}
      <div className={styles.unitInfoSection}>
        <div className={styles.unitInfoGrid}>
          <div className={styles.infoItem}>
            <span className={styles.infoLabel}>Estado</span>
            <span className={styles.infoValue}>{datas?.tenant ? 'Habitada' : 'Disponible'}</span>
          </div>
          <div className={styles.infoItem}>
            <span className={styles.infoLabel}>Monto expensa</span>
            <span className={styles.infoValue}>Bs {datas?.data?.expense_amount || '0'}</span>
          </div>
          <div className={styles.infoItem}>
            <span className={styles.infoLabel}>Titular</span>
            <button
              type="button"
              className={styles.titularDropdown}
              onClick={e => {
                e.stopPropagation();
                setOpenTitularSelector(!openTitularSelector);
              }}
            >
              <span className={styles.infoValue}>{HandleTitular()}</span>
              <IconArrowDown
                size={16}
                className={openTitularSelector ? styles.arrowUp : styles.arrowDown}
              />
              {openTitularSelector && (
                <div className={styles.dropdownMenu}>
                  <button
                    type="button"
                    className={styles.menuItem}
                    onClick={e => {
                      e.stopPropagation();
                      changeTitular('H');
                      setOpenOwnerMenu(false);
                      setOpenTenantMenu(false);
                    }}
                  >
                    Propietario{currentHolder === 'H' ? ' (actual)' : ''}
                  </button>
                  <button
                    type="button"
                    className={styles.menuItem}
                    onClick={e => {
                      e.stopPropagation();
                      changeTitular('T');
                    }}
                  >
                    Residente{currentHolder === 'T' ? ' (actual)' : ''}
                  </button>
                </div>
              )}
            </button>
          </div>
        </div>

        <Br style={{ marginTop: 16, marginBottom: 16 }} />

        {/* Sección Propietario */}
        <div className={styles.ownerSection}>
          <div className={styles.sectionHeader}>
            <h3 className={styles.sectionTitle}>Propietario</h3>
            <div className={styles.sectionActions}>
              <button
                type="button"
                className={styles.menuDots}
                onClick={e => {
                  e.stopPropagation();
                  setOpenOwnerMenu(!openOwnerMenu);
                  setOpenTenantMenu(false);
                  setOpenTitularSelector(false);
                }}
              >
                <div className={styles.dot}></div>
                <div className={styles.dot}></div>
                <div className={styles.dot}></div>
              </button>
              {openOwnerMenu && (
                <div className={styles.dropdownMenu}>
                  {!datas?.homeowner && (
                    <button
                      type="button"
                      className={styles.menuItem}
                      onClick={e => {
                        e.stopPropagation();
                        setOpenOwnerMenu(false);
                        onTitular('H', 'new');
                      }}
                    >
                      Nuevo
                    </button>
                  )}
                  <button
                    type="button"
                    className={styles.menuItem}
                    onClick={e => {
                      e.stopPropagation();
                      setOpenOwnerMenu(false);
                      onTitular('H', 'change');
                    }}
                  >
                    Cambiar
                  </button>
                  {datas?.homeowner && owner?.is_resident && (
                    <button
                      type="button"
                      className={styles.menuItem}
                      onClick={e => {
                        e.stopPropagation();
                        setOpenOwnerMenu(false);
                        onRemoveTitular('H');
                      }}
                    >
                      Liberar residencia
                    </button>
                  )}
                </div>
              )}
            </div>
          </div>

          {datas?.homeowner ? (
            <>
              <div className={styles.personCard}>
                <Avatar
                  hasImage={owner?.has_image}
                  src={ownerAvatarSrc}
                  name={getFullName(owner)}
                  w={48}
                  h={48}
                />
                <div className={styles.personInfo}>
                  <h4 className={styles.personName}>{getFullName(owner)}</h4>
                  <p className={styles.personId}>C.I. {owner?.ci || 'Sin registro'}</p>
                </div>
              </div>

              <div className={styles.contactGrid}>
                <div className={styles.contactItem}>
                  <span className={styles.contactLabel}>E-mail</span>
                  <span className={styles.contactValue}>{owner?.email || 'Sin email'}</span>
                </div>
                <div className={styles.contactItem}>
                  <span className={styles.contactLabel}>Celular</span>
                  <span className={styles.contactValue}>{owner?.phone || 'Sin teléfono'}</span>
                </div>
              </div>
            </>
          ) : (
            <div className={styles.emptyState}>
              <EmptyData
                message="Sin propietario asignado. Para asignar"
                line2="un propietario a esta unidad."
                icon={<IconHomePerson2 size={32} color="var(--cWhiteV1)" />}
                centered={true}
                fontSize={14}
              />
            </div>
          )}
        </div>
        <Br style={{ marginTop: 16, marginBottom: 16 }} />
        {/* Sección Residente/Titular */}
        <div className={styles.residentSection}>
          <div className={styles.sectionHeader}>
            <h3 className={styles.sectionTitle}>Residente</h3>
            <div className={styles.sectionActions}>
              <button
                type="button"
                className={styles.menuDots}
                onClick={e => {
                  e.stopPropagation();
                  setOpenTenantMenu(!openTenantMenu);
                  setOpenOwnerMenu(false);
                  setOpenTitularSelector(false);
                }}
              >
                <div className={styles.dot}></div>
                <div className={styles.dot}></div>
                <div className={styles.dot}></div>
              </button>
              {openTenantMenu && (
                <div className={styles.dropdownMenu}>
                  {!datas?.tenant && (
                    <button
                      type="button"
                      className={styles.menuItem}
                      onClick={e => {
                        e.stopPropagation();
                        setOpenTenantMenu(false);
                        onTitular('T',"new");
                      }}
                    >
                      Nuevo
                    </button>
                  )}

                  <button
                    type="button"
                    className={styles.menuItem}
                    onClick={e => {
                      e.stopPropagation();
                      setOpenTenantMenu(false);
                      onTitular('T',"change");
                    }}
                  >
                    Cambiar
                  </button>
                  {datas?.tenant && (
                    <button
                      type="button"
                      className={styles.menuItem}
                      onClick={e => {
                        e.stopPropagation();
                        setOpenTenantMenu(false);
                        onRemoveTitular('T');
                      }}
                    >
                      Desvincular
                    </button>
                  )}
                </div>
              )}
            </div>
          </div>

          {datas?.tenant ? (
            <>
              <div className={styles.personCard}>
                <Avatar
                  hasImage={tenant?.has_image}
                  src={tenantAvatarSrc}
                  name={getFullName(tenant)}
                  w={48}
                  h={48}
                />
                <div className={styles.personInfo}>
                  <h4 className={styles.personName}>{getFullName(tenant)}</h4>
                  <p className={styles.personId}>C.I. {tenant?.ci || 'Sin registro'}</p>
                </div>
              </div>

              <div className={styles.contactGrid}>
                <div className={styles.contactItem}>
                  <span className={styles.contactLabel}>E-mail</span>
                  <span className={styles.infoValue}>{tenant?.email || 'Sin email'}</span>
                </div>
                <div className={styles.contactItem}>
                  <span className={styles.contactLabel}>Celular</span>
                  <span className={styles.infoValue}>{tenant?.phone || 'Sin teléfono'}</span>
                </div>
              </div>

              {/* Dependientes */}
              {datas?.tenant?.dependientes && datas.tenant.dependientes.length > 0 && (
                <div className={styles.dependentsSection}>
                  <div className={styles.dependentsHeader}>
                    <h4 className={styles.dependentsTitle}>Dependientes</h4>
                  </div>
                  <div className={styles.dependentsGrid}>
                    {datas.tenant.dependientes.slice(0, 3).map((dependiente: any) => {
                      const dependentOwner = dependiente.owner;
                      const dependentUpdatedAtQuery = dependentOwner?.updated_at
                        ? `?d=${dependentOwner.updated_at}`
                        : '';
                      const dependentAvatarSrc = dependentOwner?.id
                        ? getUrlImages(`/OWNER-${dependentOwner.id}.webp${dependentUpdatedAtQuery}`)
                        : '';
                      return (
                        <Tooltip
                          key={dependiente.owner_id || dependiente.id}
                          title={getFullName(dependentOwner)}
                          position="top-left"
                        >
                          <Avatar
                            hasImage={dependentOwner?.has_image}
                            className={styles.dependentAvatar}
                            src={dependentAvatarSrc}
                            name={getFullName(dependentOwner)}
                            w={40}
                            h={40}
                            onClick={() => onOpenDependentProfile(dependiente.owner_id)}
                          />
                        </Tooltip>
                      );
                    })}
                  </div>
                </div>
              )}
            </>
          ) : (
            <div className={styles.emptyState}>
              <EmptyData
                message="Sin residente asignado. Para asignar"
                line2="un residente a esta unidad."
                icon={<IconHomePerson2 size={32} color="var(--cWhiteV1)" />}
                centered={true}
                fontSize={14}
              />
            </div>
          )}
        </div>
      </div>

      <Button
        variant="terciary"
        small
        style={{
          padding: 0,
          display: 'flex',
          justifyContent: 'flex-start',
          width: 'fit-content',
        }}
        onClick={onOpenTitularHist}
      >
        Ver historial de titulares
      </Button>
    </div>
  );
};

export default UnitInfo;
