'use client';
import { useState, useEffect } from 'react';
import { getFullName, getUrlImages } from '@/mk/utils/string';
import { Avatar } from '@/mk/components/ui/Avatar/Avatar';
import EmptyData from '@/components/NoData/EmptyData';
import Button from '@/mk/components/forms/Button/Button';
import Tooltip from '@/mk/components/ui/Tooltip/Tooltip';
import {
  IconArrowDown,
  IconEdit,
  IconTrash,
  IconHomePerson2,
} from '@/components/layout/icons/IconsBiblioteca';
import styles from '../DashDptos.module.css';

interface UnitInfoProps {
  datas: any;
  onEdit: () => void;
  onDelete: () => void;
  onTitular: () => void;
  onRemoveTitular: () => void;
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

  // Cerrar menús cuando se hace clic fuera
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as HTMLElement;
      if (
        !target.closest(`.${styles.menuDots}`) &&
        !target.closest(`.${styles.dropdownMenu}`) &&
        !target.closest(`.${styles.titularDropdown}`)
      ) {
        setOpenOwnerMenu(false);
        setOpenTenantMenu(false);
        setOpenTitularSelector(false);
      }
    };

    if (openOwnerMenu || openTenantMenu || openTitularSelector) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [openOwnerMenu, openTenantMenu, openTitularSelector]);

  const Br = () => <div className={styles.br} />;

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
          {!datas?.titular && !datas?.data?.homeowner && (
            <div className={styles.iconActions}>
              <IconTrash size={30} onClick={onDelete} />
            </div>
          )}
        </div>
      </div>

      <Br />

      {/* Sección de información de la unidad */}
      <div className={styles.unitInfoSection}>
        <div className={styles.unitInfoGrid}>
          <div className={styles.infoItem}>
            <span className={styles.infoLabel}>Estado</span>
            <span className={styles.infoValue}>{datas?.titular ? 'Habitada' : 'Disponible'}</span>
          </div>
          <div className={styles.infoItem}>
            <span className={styles.infoLabel}>Monto expensa</span>
            <span className={styles.infoValue}>Bs {datas?.data?.expense_amount || '0'}</span>
          </div>
          <div className={styles.infoItem}>
            <span className={styles.infoLabel}>Titular</span>
            <div
              className={styles.titularDropdown}
              onClick={e => {
                e.stopPropagation();
                setOpenTitularSelector(!openTitularSelector);
              }}
            >
              <span className={styles.infoValue}>
                {datas?.titular
                  ? 'Residente'
                  : datas?.data?.homeowner
                  ? 'Propietario'
                  : 'Sin asignar'}
              </span>
              <IconArrowDown
                size={16}
                className={openTitularSelector ? styles.arrowUp : styles.arrowDown}
              />
              {openTitularSelector && (
                <div className={styles.dropdownMenu}>
                  <div
                    className={styles.menuItem}
                    onClick={e => {
                      e.stopPropagation();
                      setOpenTitularSelector(false);
                    }}
                  >
                    Propietario
                  </div>
                  <div
                    className={styles.menuItem}
                    onClick={e => {
                      e.stopPropagation();
                      setOpenTitularSelector(false);
                    }}
                  >
                    Residente
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        <Br />

        {/* Sección Propietario */}
        {datas?.data?.homeowner && (
          <div className={styles.ownerSection}>
            <div className={styles.sectionHeader}>
              <h3 className={styles.sectionTitle}>Propietario</h3>
              <div className={styles.sectionActions}>
                <div
                  className={styles.menuDots}
                  onClick={e => {
                    e.stopPropagation();
                    setOpenOwnerMenu(!openOwnerMenu);
                  }}
                >
                  <div className={styles.dot}></div>
                  <div className={styles.dot}></div>
                  <div className={styles.dot}></div>
                </div>
                {openOwnerMenu && (
                  <div className={styles.dropdownMenu}>
                    <div
                      className={styles.menuItem}
                      onClick={e => {
                        e.stopPropagation();
                        setOpenOwnerMenu(false);
                      }}
                    >
                      Cambiar/Nuevo
                    </div>
                    <div
                      className={styles.menuItem}
                      onClick={e => {
                        e.stopPropagation();
                        setOpenOwnerMenu(false);
                      }}
                    >
                      Desvincular
                    </div>
                  </div>
                )}
              </div>
            </div>

            <div className={styles.personCard}>
              <Avatar
                hasImage={datas?.data?.homeowner?.has_image}
                src={
                  datas?.data?.homeowner?.id
                    ? getUrlImages(
                        '/OWNER-' +
                          datas?.data?.homeowner?.id +
                          '.webp' +
                          (datas?.data?.homeowner?.updated_at
                            ? '?d=' + datas?.data?.homeowner?.updated_at
                            : '')
                      )
                    : ''
                }
                name={getFullName(datas?.data?.homeowner)}
                w={48}
                h={48}
              />
              <div className={styles.personInfo}>
                <h4 className={styles.personName}>{getFullName(datas?.data?.homeowner)}</h4>
                <p className={styles.personId}>
                  C.I. {datas?.data?.homeowner?.ci || 'Sin registro'}
                </p>
              </div>
            </div>

            <div className={styles.contactGrid}>
              <div className={styles.contactItem}>
                <span className={styles.contactLabel}>E-mail</span>
                <span className={styles.contactValue}>
                  {datas?.data?.homeowner?.email || 'Sin email'}
                </span>
              </div>
              <div className={styles.contactItem}>
                <span className={styles.contactLabel}>Celular</span>
                <span className={styles.contactValue}>
                  {datas?.data?.homeowner?.phone || 'Sin teléfono'}
                </span>
              </div>
            </div>
          </div>
        )}

        <Br />

        {/* Sección Residente/Titular */}
        {datas?.titular && (
          <div className={styles.residentSection}>
            <div className={styles.sectionHeader}>
              <h3 className={styles.sectionTitle}>Residente</h3>
              <div className={styles.sectionActions}>
                <div
                  className={styles.menuDots}
                  onClick={e => {
                    e.stopPropagation();
                    setOpenTenantMenu(!openTenantMenu);
                  }}
                >
                  <div className={styles.dot}></div>
                  <div className={styles.dot}></div>
                  <div className={styles.dot}></div>
                </div>
                {openTenantMenu && (
                  <div className={styles.dropdownMenu}>
                    <div
                      className={styles.menuItem}
                      onClick={e => {
                        e.stopPropagation();
                        setOpenTenantMenu(false);
                        onTitular();
                      }}
                    >
                      Cambiar/Nuevo
                    </div>
                    <div
                      className={styles.menuItem}
                      onClick={e => {
                        e.stopPropagation();
                        setOpenTenantMenu(false);
                        onRemoveTitular();
                      }}
                    >
                      Desvincular
                    </div>
                  </div>
                )}
              </div>
            </div>

            <div className={styles.personCard}>
              <Avatar
                hasImage={datas?.titular?.has_image}
                src={
                  datas?.titular?.id
                    ? getUrlImages(
                        '/OWNER-' +
                          datas?.titular?.id +
                          '.webp' +
                          (datas?.titular?.updated_at ? '?d=' + datas?.titular?.updated_at : '')
                      )
                    : ''
                }
                name={getFullName(datas?.titular)}
                w={48}
                h={48}
              />
              <div className={styles.personInfo}>
                <h4 className={styles.personName}>{getFullName(datas?.titular)}</h4>
                <p className={styles.personId}>C.I. {datas?.titular?.ci || 'Sin registro'}</p>
              </div>
            </div>

            <div className={styles.contactGrid}>
              <div className={styles.contactItem}>
                <span className={styles.contactLabel}>E-mail</span>
                <span className={styles.contactValue}>{datas?.titular?.email || 'Sin email'}</span>
              </div>
              <div className={styles.contactItem}>
                <span className={styles.contactLabel}>Celular</span>
                <span className={styles.contactValue}>
                  {datas?.titular?.phone || 'Sin teléfono'}
                </span>
              </div>
            </div>

            {/* Dependientes */}
            {datas?.titular?.dependientes && datas.titular.dependientes.length > 0 && (
              <div className={styles.dependentsSection}>
                <div className={styles.dependentsHeader}>
                  <h4 className={styles.dependentsTitle}>Dependientes</h4>
                </div>
                <div className={styles.dependentsGrid}>
                  {datas.titular.dependientes.slice(0, 3).map((dependiente: any, index: number) => (
                    <Tooltip
                      key={index}
                      title={getFullName(dependiente.owner)}
                      position="top-left">
                    
                      <Avatar
                        hasImage={dependiente.owner?.has_image}
                        src={
                          dependiente.owner?.id
                            ? getUrlImages(
                                '/OWNER-' +
                                  dependiente.owner?.id +
                                  '.webp' +
                                  (dependiente.owner?.updated_at
                                    ? '?d=' + dependiente.owner?.updated_at
                                    : '')
                              )
                            : ''
                        }
                        name={getFullName(dependiente.owner)}
                        w={40}
                        h={40}
                        onClick={() => onOpenDependentProfile(dependiente.owner_id)}
                      />
                    </Tooltip>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* Estado sin titular */}
        {!datas?.titular && (
          <div className={styles.emptyState}>
            <EmptyData
              message="Sin inquilino asignado. Para asignar"
              line2="un inquilino a esta unidad."
              icon={<IconHomePerson2 size={32} color="var(--cWhiteV1)" />}
              centered={true}
              fontSize={14}
            />
          </div>
        )}
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
