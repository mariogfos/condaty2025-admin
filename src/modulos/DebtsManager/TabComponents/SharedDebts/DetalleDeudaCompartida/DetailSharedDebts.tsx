'use client';
import React, { useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import useCrud, { ModCrudType } from '@/mk/hooks/useCrud/useCrud';
import { IconCategories, IconArrowLeft, IconEdit, IconTrash } from '@/components/layout/icons/IconsBiblioteca';
import FormatBsAlign from '@/mk/utils/FormatBsAlign';
import { StatusBadge } from '@/components/StatusBadge/StatusBadge';
import Button from '@/mk/components/forms/Button/Button';
import RenderForm from '../RenderForm/RenderForm';
import RenderView from '../../AllDebts/RenderView/RenderView';
import { useAuth } from '@/mk/contexts/AuthProvider';
import DataModal from '@/mk/components/ui/DataModal/DataModal';
import { capitalize } from '@/mk/utils/string';
import styles from './DetailSharedDebts.module.css';
import { getDateStrMes } from '@/mk/utils/date';
import UnifiedCard from '../../../UnifiedCard/UnifiedCard';


interface DetailSharedDebtsProps {
  debtId: string;
  debtTitle?: string;
}
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
  debtTitle = "Deuda Compartida",
}) => {
  const router = useRouter();
  const { user, showToast } = useAuth();

  const [showEditForm, setShowEditForm] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [debtData, setDebtData] = useState<DebtData | undefined>(undefined);

  const getAmountTypeText = (amountType: string) => {
    const amountTypeMap: { [key: string]: string } = {
      'F': 'Fijo',
      'M': 'Por m²',
      'A': 'Promedio',
    };
    return amountTypeMap[amountType] || amountType;
  };

  const getSegmentationText = (segmentation: string) => {
    const segmentationMap: { [key: string]: string } = {
      'T': 'Todas las unidades',
      'O': 'Unidades ocupadas',
      'L': 'Unidades libres',
      'S': 'Seleccionar Unidades',
    };
    return segmentationMap[segmentation] || segmentation;
  };

  // Función para ir a categorías
  const goToCategories = (type = '') => {
    if (type) {
      router.push(`/categories?type=${type}`);
    } else {
      router.push('/categories');
    }
  };

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

    let finalStatus = item?.status;
    const today = new Date();
    const dueDate = item?.due_date ? new Date(item.due_date) : null;

    if (dueDate && dueDate < today && item?.status === 'A') {
      finalStatus = 'M';
    }

    const statusText = getStatusText(finalStatus);
    const { color, bgColor } = statusConfig[finalStatus] || statusConfig.A;

    return (
      <StatusBadge
        color={color}
        backgroundColor={bgColor}
      >
        {statusText}
      </StatusBadge>
    );
  };

  const renderDueDateCell = ({ item }: { item: any }) => {
    if (!item?.due_at) return <div>-</div>;
    return (
      getDateStrMes(item?.due_at) || '-/-'
    );
  };

  const renderDebtAmountCell = ({ item }: { item: any }) => (
    <FormatBsAlign value={parseFloat(item?.amount) || 0} alignRight />
  );

  const renderPenaltyAmountCell = ({ item }: { item: any }) => (
    <FormatBsAlign value={parseFloat(item?.penalty_amount) || 0} alignRight />
  );

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
        label: <span style={{ display: 'block', textAlign: 'center', width: '100%' }}>Estado</span>,
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
    sumarize: false,
    hideActions: {
      add: true,
      view: false,
      edit: true,
      del: true,
    },
    renderView: (props: any) => (
      <RenderView
        open={props.open}
        onClose={props.onClose}
        item={props.item}
        extraData={props.extraData}
        user={props.user}
        onEdit={props.onEdit}
        onDel={props.onDel}
        hideSharedDebtButton={true}
        hideEditAndDeleteButtons={true}
      />
    ),
  };

  // Botones extra para incluir el botón de categorías
  const extraButtons = [
    <Button
      key="categories-button"
      variant="secondary"
      onClick={() => goToCategories('D')}
      style={{
        padding: '8px 16px',
        width: 'auto',
        height: 48,
        display: 'flex',
        alignItems: 'center',
      }}
    >
      Categorías
    </Button>,
  ];

  const { List, extraData, execute, reLoad, onSave } = useCrud({
    paramsInitial,
    mod,
    fields,
    extraButtons,
  });

  const summaryData = useMemo(() => {
    if (!extraData) {
      return {
        cobradas: { amount: 0, count: 0, total: 0 },
        porCobrar: { amount: 0, count: 0, total: 0 },
        enMora: { amount: 0, count: 0, total: 0 }
      };
    }

    return {
      cobradas: {
        amount: parseFloat(extraData.collected || '0'),
        count: extraData.totalCollected || 0,
        total: extraData.totalReceivable || 0
      },
      porCobrar: {
        amount: parseFloat(extraData.receivable || '0'),
        count: extraData.totalReceivable || 0,
        total: extraData.totalReceivable || 0
      },
      enMora: {
        amount: parseFloat(extraData.arrears || '0'),
        count: extraData.totalArrears || 0,
        total: extraData.totalReceivable || 0
      }
    };
  }, [extraData]);

  const handleVolver = () => {
    router.back();
  };

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
    const fullDebtData = await fetchDebtData();
    if (fullDebtData) {
      setDebtData(fullDebtData);
    } else {
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
        router.back();
      } else {
        showToast('Error al eliminar la deuda', 'error');
      }
    } catch (error) {
      showToast('Error al eliminar la deuda', 'error');
    }
    setShowDeleteConfirm(false);
  };

  const handleFormSave = async (data: any) => {
    try {
      console.log('Datos a enviar:', data);
      const response = await execute(`/debts/${debtId}`, 'PUT', data);

      if (response?.data?.success) {
        setShowEditForm(false);
        reLoad();
        showToast('Deuda actualizada exitosamente', 'success');
      } else {
        showToast(response?.data?.message || 'Error al actualizar la deuda', 'error');
      }
    } catch (error) {
      console.error('Error updating debt:', error);
      showToast('Error al actualizar la deuda', 'error');
    }
  };

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
          <p>
            ¿Estás seguro de eliminar esta información?
            <br />
            Recuerda que, al momento de eliminar, ya no podrás
            recuperarla.
          </p>
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
          <h1 className={styles.title}>
            {extraData?.debt ?
              (extraData.debt.subcategory?.name + " - " + extraData.debt.description) || debtTitle
              : debtTitle
            }
          </h1>
        </div>

        {/* Cards de resumen con botones de acción */}
        <div className={styles.summarySection}>
          <div className={styles.summaryCards}>
            <UnifiedCard
              variant="detail"
              label="DISTRIBUCIÓN & ASIGNACIÓN"
              mainContent={getAmountTypeText(extraData?.debt?.amount_type || 'F')}
              subtitle={getSegmentationText(extraData?.debt?.segmentation || 'T')}
            />

            <UnifiedCard
              variant="detail"
              label="COBRADAS"
              mainContent={<FormatBsAlign value={summaryData.cobradas.amount} />}
              subtitle={`${summaryData.cobradas.count}`}
              total={extraData?.totalReceivable || 0}
              current={summaryData.cobradas.count}

            />

            <UnifiedCard
              variant="detail"
              label="POR COBRAR"
              mainContent={<FormatBsAlign value={summaryData.porCobrar.amount} />}
              subtitle={`${parseFloat(extraData?.receivable || '0') > 0 ? Math.ceil(parseFloat(extraData?.receivable || '0') / parseFloat(extraData?.totalAmountDebt || '1')) : 0}`}
              total={extraData?.totalReceivable || 0}
              current={parseFloat(extraData?.receivable || '0') > 0 ? Math.ceil(parseFloat(extraData?.receivable || '0') / parseFloat(extraData?.totalAmountDebt || '1')) : 0}

            />

            <UnifiedCard
              variant="detail"
              label="EN MORA"
              mainContent={<FormatBsAlign value={summaryData.enMora.amount} />}
              subtitle={`${extraData?.totalArrears || 0}`}
              total={extraData?.totalReceivable || 0}
              current={extraData?.totalArrears || 0}

            />
          </div>

          {/* Botones de acción - Validar hasAction del extraData */}
          <div className={styles.actionButtons}>
           {/*  {extraData?.hasAction && ( */}
              <>
                <Button
                  onClick={handleEdit}
                  variant="primary"
                  className={styles.actionButton}
                >
                  <IconEdit size={16} />
                  Editar
                </Button>
                <Button
                  onClick={handleDelete}
                  variant="secondary"
                  className={styles.actionButton}
                >
                  <IconTrash size={16} />
                  Eliminar
                </Button>
              </>
          {/*   )} */}
          </div>
        </div>

        {/* Lista con useCrud - aquí aparecerá el botón de categorías automáticamente */}
        <div className={styles.listContainer}>
          <List
            height={'calc(100vh - 560px)'}
            emptyMsg="No hay detalles de deuda compartida disponibles"
            emptyLine2="Los detalles aparecerán aquí cuando estén disponibles."
            emptyIcon={<IconCategories size={80} color="var(--cWhiteV1)" />}
            filterBreakPoint={2500}
            sumarize={false}
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
