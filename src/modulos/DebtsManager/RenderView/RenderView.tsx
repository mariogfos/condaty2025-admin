'use client';
import React, { memo } from 'react';
import DataModal from '@/mk/components/ui/DataModal/DataModal';
import Button from '@/mk/components/forms/Button/Button';
import { formatToDayDDMMYYYYHHMM } from '@/mk/utils/date';
import { formatBs } from '@/mk/utils/numbers';
import { getFullName } from '@/mk/utils/string';
import { UnitsType } from '@/mk/utils/utils';
import styles from './RenderView.module.css';

interface DebtItem {
  id?: number | string;
  begin_at?: string;
  due_at?: string;
  type?: number;
  description?: string;
  subcategory_id?: number;
  asignar?: string;
  dpto_id?: number;
  amount_type?: string;
  amount?: number;
  is_advance?: string;
  interest?: number;
  has_mv?: string | boolean;
  is_forgivable?: string | boolean;
  has_pp?: string | boolean;
  is_blocking?: string | boolean;
  status?: string;
  created_at?: string;
  updated_at?: string;
  user?: any;
  // Campos adicionales del mock data
  month?: number;
  year?: number;
  totalDebt?: number;
  totalCollected?: number;
  totalPenalty?: number;
  totalToPay?: number;
  unitsUpToDate?: number;
  unitsToPay?: number;
}

interface ExtraData {
  dptos?: any[];
}

interface RenderViewProps {
  open: boolean;
  onClose: () => void;
  item?: DebtItem | null;
  extraData?: ExtraData;
  user?: any;
  onEdit?: (item: DebtItem) => void;
  onDel?: (item: DebtItem) => void;
}

const RenderView: React.FC<RenderViewProps> = memo(props => {
  const { open, onClose, item, extraData, user, onEdit, onDel } = props;

  const client = user?.clients?.filter((clientItem: any) => clientItem.id === user.client_id)[0];

  const getSubcategoryName = (subcategoryId?: number) => {
    if (!subcategoryId) return 'No especificada';
    const subcategories: { [key: number]: string } = {
      1: 'Agua',
      2: 'Electricidad',
      3: 'Gas',
      4: 'Internet',
      5: 'Teléfono',
      6: 'Limpieza',
      7: 'Jardinería',
      8: 'Reparaciones menores',
      9: 'Pintura',
      10: 'Reparación de equipos',
    };
    return subcategories[subcategoryId] || 'No especificada';
  };

  const getTypeName = (type?: number) => {
    if (!type) return 'No especificado';
    const types: { [key: number]: string } = {
      1: 'Tipo 1',
      2: 'Tipo 2',
      3: 'Tipo 3',
      4: 'Tipo 4',
    };
    return types[type] || 'No especificado';
  };

  const getAsignarName = (asignar?: string) => {
    if (!asignar) return 'No especificado';
    return asignar === 'S' ? 'Sí' : 'No';
  };

  const getAmountTypeName = (amountType?: string) => {
    if (!amountType) return 'No especificado';
    const types: { [key: string]: string } = {
      'F': 'Fijo',
      'V': 'Variable',
      'P': 'Porcentual',
    };
    return types[amountType] || 'No especificado';
  };

  const getIsAdvanceName = (isAdvance?: string) => {
    if (!isAdvance) return 'No especificado';
    return isAdvance === 'Y' ? 'Sí' : 'No';
  };

  const getDepartmentName = () => {
    if (!item?.dpto_id || !extraData?.dptos) return 'No especificado';

    const dpto = extraData.dptos.find((d: any) => d.id === item.dpto_id);
    if (!dpto) return 'No especificado';

    return `${getFullName(dpto?.titular) || 'Sin titular'} - ${dpto.nro} ${UnitsType['_' + client?.type_dpto]} ${dpto.description}`;
  };

  const formatDate = (dateString?: string) => {
    if (!dateString) return 'No especificada';
    const date = new Date(dateString);
    return date.toLocaleDateString('es-ES', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const getBooleanText = (value?: string | boolean) => {
    if (value === undefined || value === null) return 'No especificado';
    if (typeof value === 'boolean') return value ? 'Sí' : 'No';
    return value === 'Y' ? 'Sí' : 'No';
  };

  const getStatusStyle = (status?: string) => {
    if (status === 'Activa') return styles.statusActive;
    if (status === 'Completada') return styles.statusCompleted;
    if (status === 'Anulada') return styles.statusCancelled;
    return '';
  };

  const handleEditClick = () => {
    if (item && onEdit) {
      onEdit(item);
    }
  };

  const handleDeleteClick = () => {
    if (item && onDel) {
      onDel(item);
    }
  };

  if (!item) {
    return (
      <DataModal
        open={open}
        onClose={onClose}
        title="Información de la Deuda"
        buttonText=""
        buttonCancel=""
      >
        <div className={styles.container}>
          <div className={styles.messageContainer}>
            <p className={styles.messageText}>
              No se encontró información de la deuda.
            </p>
            <p className={styles.messageSuggestion}>
              Por favor, verifica los detalles o intenta de nuevo más tarde.
            </p>
          </div>
        </div>
      </DataModal>
    );
  }

  return (
    <DataModal
      open={open}
      onClose={onClose}
      title="Detalle de la Deuda"
      buttonText=""
      buttonCancel=""
    >
      {/* Botones de acción */}
      <div className={styles.headerActionContainer}>
        {onEdit && (
          <button
            type="button"
            onClick={handleEditClick}
            className={styles.textButtonEdit}
          >
            Editar deuda
          </button>
        )}
        {onDel && item.status !== 'Anulada' && (
          <button
            type="button"
            onClick={handleDeleteClick}
            className={styles.textButtonDanger}
          >
            Eliminar deuda
          </button>
        )}
      </div>

      <div className={styles.container}>
        {/* Header con monto y fechas principales */}
        <div className={styles.headerSection}>
          <div className={styles.amountDisplay}>{formatBs(item.amount || 0)}</div>
          <div className={styles.dateDisplay}>
            Vence: {formatDate(item.due_at)}
          </div>
        </div>

        <hr className={styles.sectionDivider} />

        {/* Sección de detalles principales */}
        <section className={styles.detailsSection}>
          {/* Columna Izquierda */}
          <div className={styles.detailsColumn}>
            <div className={styles.infoBlock}>
              <span className={styles.infoLabel}>Fecha de inicio</span>
              <span className={styles.infoValue}>{formatDate(item.begin_at)}</span>
            </div>
            <div className={styles.infoBlock}>
              <span className={styles.infoLabel}>Fecha de vencimiento</span>
              <span className={styles.infoValue}>{formatDate(item.due_at)}</span>
            </div>
            <div className={styles.infoBlock}>
              <span className={styles.infoLabel}>Tipo</span>
              <span className={styles.infoValue}>{getTypeName(item.type)}</span>
            </div>
            <div className={styles.infoBlock}>
              <span className={styles.infoLabel}>Subcategoría</span>
              <span className={styles.infoValue}>{getSubcategoryName(item.subcategory_id)}</span>
            </div>
            <div className={styles.infoBlock}>
              <span className={styles.infoLabel}>Asignar</span>
              <span className={styles.infoValue}>{getAsignarName(item.asignar)}</span>
            </div>
            <div className={styles.infoBlock}>
              <span className={styles.infoLabel}>Departamento</span>
              <span className={styles.infoValue}>{getDepartmentName()}</span>
            </div>
          </div>

          {/* Columna Derecha */}
          <div className={styles.detailsColumn}>
            <div className={styles.infoBlock}>
              <span className={styles.infoLabel}>Tipo de monto</span>
              <span className={styles.infoValue}>{getAmountTypeName(item.amount_type)}</span>
            </div>
            <div className={styles.infoBlock}>
              <span className={styles.infoLabel}>Monto</span>
              <span className={styles.infoValue}>{formatBs(item.amount || 0)}</span>
            </div>
            <div className={styles.infoBlock}>
              <span className={styles.infoLabel}>Es anticipo</span>
              <span className={styles.infoValue}>{getIsAdvanceName(item.is_advance)}</span>
            </div>
            <div className={styles.infoBlock}>
              <span className={styles.infoLabel}>Interés (%)</span>
              <span className={styles.infoValue}>{item.interest || 0}%</span>
            </div>
            <div className={styles.infoBlock}>
              <span className={styles.infoLabel}>Estado</span>
              <span className={`${styles.infoValue} ${getStatusStyle(item.status || 'Activa')}`}>
                {item.status || 'Activa'}
              </span>
            </div>
          </div>
        </section>

        <hr className={styles.sectionDivider} />

        {/* Sección de configuración avanzada */}
        <section className={styles.detailsSection}>
          <div className={styles.sectionTitle}>Configuración Avanzada</div>
          <div className={styles.advancedOptionsGrid}>
            <div className={styles.infoBlock}>
              <span className={styles.infoLabel}>Tiene MV</span>
              <span className={styles.infoValue}>{getBooleanText(item.has_mv)}</span>
            </div>
            <div className={styles.infoBlock}>
              <span className={styles.infoLabel}>Es perdonable</span>
              <span className={styles.infoValue}>{getBooleanText(item.is_forgivable)}</span>
            </div>
            <div className={styles.infoBlock}>
              <span className={styles.infoLabel}>Tiene PP</span>
              <span className={styles.infoValue}>{getBooleanText(item.has_pp)}</span>
            </div>
            <div className={styles.infoBlock}>
              <span className={styles.infoLabel}>Es bloqueante</span>
              <span className={styles.infoValue}>{getBooleanText(item.is_blocking)}</span>
            </div>
          </div>
        </section>

        {/* Descripción si existe */}
        {item.description && (
          <>
            <hr className={styles.sectionDivider} />
            <section className={styles.descriptionSection}>
              <div className={styles.infoBlock}>
                <span className={styles.infoLabel}>Descripción</span>
                <span className={styles.infoValue}>
                  {item.description.split('\n').map((line, idx) => (
                    <span key={idx}>{line}</span>
                  ))}
                </span>
              </div>
            </section>
          </>
        )}

        <hr className={styles.sectionDivider} />

        {/* Información de fechas del sistema */}
        <section className={styles.detailsSection}>
          <div className={styles.detailsColumn}>
            <div className={styles.infoBlock}>
              <span className={styles.infoLabel}>Fecha de creación</span>
              <span className={styles.infoValue}>
                {item.created_at ? formatToDayDDMMYYYYHHMM(item.created_at) : 'No disponible'}
              </span>
            </div>
          </div>
          <div className={styles.detailsColumn}>
            <div className={styles.infoBlock}>
              <span className={styles.infoLabel}>Última actualización</span>
              <span className={styles.infoValue}>
                {item.updated_at ? formatToDayDDMMYYYYHHMM(item.updated_at) : 'No disponible'}
              </span>
            </div>
          </div>
        </section>
      </div>
    </DataModal>
  );
});

RenderView.displayName = 'RenderViewDebtsManager';

export default RenderView;
