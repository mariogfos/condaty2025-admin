'use client';
import React, { useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import useCrud, { ModCrudType } from '@/mk/hooks/useCrud/useCrud';
import { IconCategories, IconArrowLeft, IconEdit, IconTrash } from '@/components/layout/icons/IconsBiblioteca';
import FormatBsAlign from '@/mk/utils/FormatBsAlign';
import { StatusBadge } from '@/components/StatusBadge/StatusBadge';
import Button from '@/mk/components/forms/Button/Button';
import RenderForm from '../RenderForm/RenderForm';
import { useAuth } from '@/mk/contexts/AuthProvider';
import DataModal from '@/mk/components/ui/DataModal/DataModal';
import { capitalize } from '@/mk/utils/string';
import styles from './DetailSharedDebts.module.css';

interface DetailSharedDebtsProps {
  debtId: string;
  debtTitle?: string;
}

// Interfaz para los datos de la deuda
interface DebtData {
  id?: string | number;
  begin_at?: string;
  due_at?: string;
  type?: number;
  description?: string;
  category_id?: string | number;
  subcategory_id?: string | number;
  asignar?: string;
  dpto_id?: any[];
  amount_type?: string;
  amount?: string | number;
  is_advance?: string;
  interest?: number;
  show_advanced?: boolean;
  has_mv?: boolean;
  is_forgivable?: boolean;
  has_pp?: boolean;
  is_blocking?: boolean;
}

const DetailSharedDebts: React.FC<DetailSharedDebtsProps> = ({
  debtId,
  debtTitle = "Factura de agua - Septiembre"
}) => {
  const router = useRouter();
  const { user, showToast } = useAuth();

  // Estados para controlar los modales - corregir tipos
  const [showEditForm, setShowEditForm] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [debtData, setDebtData] = useState<DebtData | undefined>(undefined);

  // Renderizar columna Estado
  const renderStatusCell = ({ item }: { item: any }) => {
    const statusConfig: { [key: string]: { color: string; bgColor: string } } = {
      A: { color: 'var(--cWarning)', bgColor: 'var(--cHoverCompl8)' },
      P: { color: 'var(--cSuccess)', bgColor: 'var(--cHoverCompl2)' },
      S: { color: 'var(--cWarning)', bgColor: 'var(--cHoverCompl4)' },
      M: { color: 'var(--cError)', bgColor: 'var(--cHoverError)' },
      C: { color: 'var(--cInfo)', bgColor: 'var(--cHoverCompl3)' },
      X: { color: 'var(--cError)', bgColor: 'var(--cHoverError)' },
    };

    const getStatusText = (status: string) => {
      const statusMap: { [key: string]: string } = {
        'A': 'Por cobrar',
        'P': 'Cobrado',
        'S': 'Por confirmar',
        'M': 'En mora',
        'C': 'Cancelada',
        'X': 'Anulada'
      };
      return statusMap[status] || status;
    };

    const statusText = getStatusText(item?.status);
    const { color, bgColor } = statusConfig[item?.status] || statusConfig.A;

    return (
      <StatusBadge
        color={color}
        backgroundColor={bgColor}
      >
        {statusText}
      </StatusBadge>
    );
  };

  // Renderizar columna Vencimiento
  const renderDueDateCell = ({ item }: { item: any }) => {
    if (!item?.due_date) return <div>-</div>;
    const date = new Date(item.due_date);
    return (
      <div>
        {date.toLocaleDateString('es-ES', {
          day: '2-digit',
          month: 'short',
          year: 'numeric'
        })}
      </div>
    );
  };

  // Renderizar columna Deuda
  const renderDebtAmountCell = ({ item }: { item: any }) => (
    <FormatBsAlign value={parseFloat(item?.amount) || 0} alignRight />
  );

  // Renderizar columna Multa
  const renderPenaltyAmountCell = ({ item }: { item: any }) => (
    <FormatBsAlign value={parseFloat(item?.penalty_amount) || 0} alignRight />
  );

  // Renderizar columna Saldo a cobrar
  const renderBalanceDueCell = ({ item }: { item: any }) => {
    const debtAmount = parseFloat(item?.amount) || 0;
    const penaltyAmount = parseFloat(item?.penalty_amount) || 0;
    const totalBalance = debtAmount + penaltyAmount;
    return <FormatBsAlign value={totalBalance} alignRight />;
  };

  const paramsInitial = {
    fullType: 'L',
    page: 1,
    perPage: 20,
    debt_id: debtId,
    type: 4
  };

  const fields = useMemo(() => {
    return {
      id: { rules: [], api: 'e' },
      unit: {
        rules: [''],
        api: '',
        label: 'Unidad',
        list: {
          onRender: ({ item }: { item: any }) => (
            <div>{item?.unit_number || item?.dpto?.nro}</div>
          ),
          order: 1,
        },
      },
      status: {
        rules: [''],
        api: '',
        label: 'Estado',
        list: {
          onRender: renderStatusCell,
          order: 2,
        },
      },
      due_date: {
        rules: [''],
        api: '',
        label: 'Vencimiento',
        list: {
          onRender: renderDueDateCell,
          order: 3,
        },
      },
      amount: {
        rules: [''],
        api: '',
        label: (
          <label style={{ display: 'block', textAlign: 'right', width: '100%' }}>Deuda</label>
        ),
        list: {
          onRender: renderDebtAmountCell,
          order: 4,
          sumarize: true,
        },
      },
      penalty_amount: {
        rules: [''],
        api: '',
        label: (
          <label style={{ display: 'block', textAlign: 'right', width: '100%' }}>Multa</label>
        ),
        list: {
          onRender: renderPenaltyAmountCell,
          order: 5,
          sumarize: true,
        },
      },
      balance_due: {
        rules: [''],
        api: '',
        label: (
          <label style={{ display: 'block', textAlign: 'right', width: '100%' }}>Saldo a cobrar</label>
        ),
        list: {
          onRender: renderBalanceDueCell,
          order: 6,
          sumarize: true,
        },
      },
    };
  }, []);

  const mod: ModCrudType = {
    modulo: 'debt-dptos',
    singular: 'Detalle',
    plural: 'Detalles',
    export: true,
    filter: false,
    permiso: 'expense',
    extraData: true,
    sumarize: true,
    hideActions: {
      add: true,
      view: true,
      edit: true,
      del: true,
    },
  };

  // Extraer todas las funciones necesarias del useCrud con tipos específicos
  const { List, extraData, execute, reLoad } = useCrud({
    paramsInitial,
    mod,
    fields,
  });

  // Crear funciones tipadas específicamente para RenderForm
  const typedExecute = async (url: string, method: string, params: any): Promise<any> => {
    return await execute(url, method, params);
  };

  const typedShowToast = (msg: string, type?: 'info' | 'success' | 'error' | 'warning') => {
    showToast(msg, type);
  };

  const typedReLoad = (): void => {
    reLoad();
  };

  const summaryData = {
    cobradas: { amount: 20184.00, count: 120, total: 250 },
    porCobrar: { amount: 17539.00, count: 80, total: 250 },
    enMora: { amount: 13832.00, count: 84, total: 250 }
  };

  const handleVolver = () => {
    router.back();
  };

  // Función para obtener los datos completos de la deuda
  const fetchDebtData = async () => {
    try {
      const response = await execute(`/debts/${debtId}`, 'GET', { id: debtId });
      if (response?.data?.success) {
        return response.data.data;
      }
    } catch (error) {
      console.error('Error fetching debt data:', error);
    }
    return null;
  };

  const handleEdit = async () => {
    // Obtener los datos completos de la deuda para editar
    const fullDebtData = await fetchDebtData();
    if (fullDebtData) {
      setDebtData(fullDebtData);
    } else {
      // Si no se pueden obtener los datos, usar datos básicos
      setDebtData({ id: debtId });
    }
    setShowEditForm(true);
  };

  const handleDelete = () => {
    setShowDeleteConfirm(true);
  };

  const confirmDelete = async () => {
    try {
      const response = await execute(`/debts/${debtId}`, 'DELETE', { id: debtId });
      if (response?.data?.success) {
        showToast('Deuda eliminada exitosamente', 'success');
        router.back(); // Volver a la lista después de eliminar
      } else {
        showToast('Error al eliminar la deuda', 'error');
      }
    } catch (error) {
      showToast('Error al eliminar la deuda', 'error');
    }
    setShowDeleteConfirm(false);
  };

  // Agregar esta función después de confirmDelete y antes del componente FormDelete

  const handleFormSave = (data: any) => {
  // Recargar la lista después de guardar
  reLoad();
  setShowEditForm(false);
  showToast('Deuda actualizada exitosamente', 'success');
  };

  // Componente FormDelete igual al de useCrud
  const FormDelete = ({ open, onClose, item, onConfirm, message = "" }: any) => {
  return (
    <DataModal
      id="Eliminar"
      title={capitalize('eliminar') + " deuda compartida"}
      buttonText={capitalize('eliminar')}
      buttonCancel="Cancelar"
      onSave={(e) => onConfirm ? onConfirm(item) : confirmDelete()}
      onClose={onClose}
      open={open}
      variant="mini"
    >
      {message ? (
        message
      ) : (
        <>
          ¿Estás seguro de eliminar esta información?
          <br />
          Recuerda que, al momento de eliminar, ya no podrás
          recuperarla.
        </>
      )}
    </DataModal>
  );
  };

  return (
    <>
      <div className={styles.container}>
        {/* Header con botón volver y título */}
        <div className={styles.header}>
          <button onClick={handleVolver} className={styles.backButton}>
            <IconArrowLeft size={20} />
            Volver
          </button>
          <h1 className={styles.title}>{debtTitle}</h1>
        </div>

        {/* Cards de resumen con botones de acción */}
        <div className={styles.summarySection}>
          <div className={styles.summaryCards}>
            <div className={styles.card}>
              <div className={styles.cardHeader}>
                <span className={styles.cardLabel}>DISTRIBUCIÓN & ASIGNACIÓN</span>
              </div>
              <div className={styles.cardTitle}>Proporcional por m2</div>
              <div className={styles.cardSubtitle}>Todas las unidades</div>
            </div>

            <div className={styles.card}>
              <div className={styles.cardHeader}>
                <span className={styles.cardLabel}>COBRADAS</span>
              </div>
              <div className={styles.cardAmount}>Bs {summaryData.cobradas.amount.toLocaleString()}</div>
              <div className={styles.cardSubtitle}>
                {summaryData.cobradas.count} de {summaryData.cobradas.total} deudas
              </div>
            </div>

            <div className={styles.card}>
              <div className={styles.cardHeader}>
                <span className={styles.cardLabel}>POR COBRAR</span>
              </div>
              <div className={styles.cardAmount}>Bs {summaryData.porCobrar.amount.toLocaleString()}</div>
              <div className={styles.cardSubtitle}>
                {summaryData.porCobrar.count} de {summaryData.porCobrar.total} deudas
              </div>
            </div>

            <div className={styles.card}>
              <div className={styles.cardHeader}>
                <span className={styles.cardLabel}>EN MORA</span>
              </div>
              <div className={styles.cardAmount}>Bs {summaryData.enMora.amount.toLocaleString()}</div>
              <div className={styles.cardSubtitle}>
                {summaryData.enMora.count} de {summaryData.enMora.total} deudas
              </div>
            </div>
          </div>

          {/* Botones de acción */}
          <div className={styles.actionButtons}>
            <Button
              onClick={handleEdit}
              variant="secondary"
              className={styles.actionButton}
            >
              <IconEdit size={16} />
              Editar
            </Button>
            <Button
              onClick={handleDelete}
              variant="cancel"
              className={styles.actionButton}
            >
              <IconTrash size={16} />
              Eliminar
            </Button>
          </div>
        </div>

        {/* Lista con useCrud */}
        <div className={styles.listContainer}>
          <List
            height={'calc(100vh - 570px)'}
            emptyMsg="No hay detalles de deuda compartida disponibles"
            emptyLine2="Los detalles aparecerán aquí cuando estén disponibles."
            emptyIcon={<IconCategories size={80} color="var(--cWhiteV1)" />}
            filterBreakPoint={2500}
            sumarize={true}
          />
        </div>
      </div>

      {/* Modal de edición */}
      {showEditForm && debtData && (
        <RenderForm
          open={showEditForm}
          onClose={() => setShowEditForm(false)}
          item={debtData}
          onSave={handleFormSave}
          extraData={extraData}
          execute={execute as (url: string, method: string, params: any) => Promise<any>}
          showToast={showToast as (msg: string, type?: 'info' | 'success' | 'error' | 'warning') => void}
          reLoad={reLoad as () => void}
          user={user}
        />
      )}

      {/* Modal de confirmación de eliminación - usando el mismo estilo que useCrud */}
      {showDeleteConfirm && (
        <FormDelete
          open={showDeleteConfirm}
          onClose={() => setShowDeleteConfirm(false)}
          item={{ id: debtId }}
          onConfirm={confirmDelete}
          message=""
        />
      )}
    </>
  );
};

export default DetailSharedDebts;
