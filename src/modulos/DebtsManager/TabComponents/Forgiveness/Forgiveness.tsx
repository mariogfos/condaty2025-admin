import NotAccess from '@/components/auth/NotAccess/NotAccess';
import { useAuth } from '@/mk/contexts/AuthProvider';
import useCrud from '@/mk/hooks/useCrud/useCrud';
import { getFullName } from '@/mk/utils/string';
import React, { useEffect, useMemo } from 'react';
import styles from './Forgiveness.module.css';
import { IconCategories } from '@/components/layout/icons/IconsBiblioteca';
import { getDateStrMesShort } from '@/mk/utils/date';
import RenderForm from './RenderForm/RenderForm';
import { formatBs } from '@/mk/utils/numbers';
import { DebtStatus } from '@/types/PaymentType';
import { getStatusText, getStatusConfig, STATUS_FILTER_OPTIONS } from '../constants';
import RenderView from './RenderView/RenderView';
import { StatusBadge } from '@/components/StatusBadge/StatusBadge';

const paramsInitial = {
  fullType: 'FG',
  page: 1,
  perPage: -1,
  type: 5,
};
const Forgiveness = ({
  openView,
  setOpenView,
  viewItem,
  setViewItem,
  onExtraDataChange,
}: any) => {

  const mod = {
    modulo: 'debt-dptos',
    singular: 'condonación',
    plural: '',
    permiso: 'defaulters',
    sumarize: true,
    extraData: true,
    loadView: { fullType: 'DET', type: 5 },
    export: true,
    titleDel: "Anular",

    hideActions: { add: false, edit: true, del: true },
    titleAdd: 'Crear',
    renderForm: RenderForm,
    renderView: RenderView,
    filter: true,
    saveMsg: {
      add: 'Condonación creada con éxito',
      edit: 'Condonación actualizada con éxito',
      del: 'Condonación eliminada con éxito',
    },
  };
  const { setStore, store } = useAuth();

  useEffect(() => {
    setStore({ ...store, title: "" });
  }, []);
  const fields = useMemo(
    () => ({
      nro: {
        label: 'Unidad',

        form: { type: 'text' },
        list: {
          onRender: ({ item }: any) => {
            return item?.dpto?.nro;
          },
        },
      },
      titular: {
        label: 'Titular',
        form: { type: 'text' },
        list: {
          onRender: ({ item }: any) => {
            let titular = item?.dpto?.holder == 'H' ? item?.dpto?.homeowner : item?.dpto?.tenant;
            return getFullName(titular);
          },
        },
      },
      due_at: {
        label: 'Vencimiento',

        form: { type: 'date' },
        list: {
          onRender: ({ item }: any) => {
            return getDateStrMesShort(item?.due_at);
          },
        },
      },
      status: {
        label: <span style={{ display: 'block', width: '100%', textAlign: 'center' }}>Estado</span>,
        form: { type: 'text' },
        list: {
          onRender: ({ item }: any) => {
            const numericStatus = Number(item?.status);
            const isOverdue =
              item?.due_at < new Date().toISOString().split('T')[0] &&
              numericStatus === DebtStatus.PENDING;
            const displayStatus = isOverdue ? DebtStatus.OVERDUE : numericStatus;
            // getStatusConfig aplica la regla de mora (PENDING + vencido → OVERDUE)
            const { color, bgColor } = getStatusConfig(numericStatus, item?.due_at);
            return (
              <StatusBadge color={color} backgroundColor={bgColor}>
                {getStatusText(displayStatus)}
              </StatusBadge>
            );
          },
        },
        filter: {
          label: 'Estado',
          options: () => [{ id: 'ALL', name: 'Todos los estados' }, ...STATUS_FILTER_OPTIONS],
        },
      },
      category: {
        label: 'Categoría',
        form: { type: 'text' },
        list: {
          onRender: ({ item }: any) => {
            return item?.subcategory?.padre?.name;
          },
        },
      },
      total_amount: {
        label: 'Deuda total',
        form: { type: 'text' },
        list: {
          onRender: ({ item }: any) => {
            return formatBs(Number(item?.forgiveness_amount) + Number(item?.amount));
          },
        },
      },

      forgiveness_amount: {
        sumarize: true,
        label: 'Condonado',
        form: { type: 'text' },
        list: {
          onRender: ({ item }: any) => {
            return formatBs(item?.forgiveness_amount);
          },
        },
      },
      amount: {
        label: 'Total a cobrar',
        form: { type: 'text' },
        sumarize: true,
        list: {
          onRender: ({ item }: any) => {
            return formatBs(item?.amount);
          },
        },
      },
    }),
    []
  );
  const { userCan, List, data, extraData } = useCrud({
    paramsInitial,
    mod,
    fields,
  });
  useEffect(() => {
    if (extraData && onExtraDataChange) {
      onExtraDataChange(extraData);
    }
  }, [extraData, onExtraDataChange]);
  if (!userCan(mod.permiso, 'R')) return <NotAccess />;
  return (
    <div className={`${styles.Forgiveness}`}>
      <div className={styles.listContainer}>
        <List
          height={"100%"}
          emptyMsg="Lista de morosos vacía. Una vez las cuotas corran, los"
          emptyLine2="residentes con pagos atrasados los verás aquí."
          emptyIcon={<IconCategories size={80} color="var(--cWhiteV1)" />}
          emptyFullScreen={true}
          paginationHide={true}
        />
      </div>
    </div>
  );
};

export default Forgiveness;
