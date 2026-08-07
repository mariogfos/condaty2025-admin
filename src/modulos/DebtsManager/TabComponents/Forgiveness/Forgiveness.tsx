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
    modulo: 'v3/debt-dptos',
    singular: 'condonación',
    plural: '',
    permiso: 'defaulters',
    sumarize: true,
    extraData: true,
    loadView: { fullType: 'DET', type: 5 },
    // S47.5: kill legacy IconExport (D-38-5 pattern) + slot async pineado.
    // - export: false → kill legacy GET /api/v3/debt-dptos?_export=pdf.
    // - exportAsync: {...} → slot async que useCrud auto-renderea via
    //   AsyncExportButton (S36.5 pattern, idéntico a S41 BankAccounts,
    //   S43 Outlays, S45 Areas).
    // - type: "debt-dptos" → matchea el DebtDptoReportType pineado en
    //   S47 backend (ReportTypeRegistry.auto-discovery, 11 tipos).
    // - extraParams.type: 5 (FORGIVENESS) → branch FORGIVENESS del
    //   ReportType (8 cols: dpto_nro, titular, due_at_date1, status_texto,
    //   categoria_padre_nombre, forgiveness_cobrar_cur, forgiveness_amount_cur,
    // Motor declarativo: `endpoint` + `supportedFormats` juntos, si no `useCrud`
    // renderea el par de botones legacy.
    //
    // ⚠️ Condonaciones NO comparte la clave de la lista plana: son otras ocho
    // columnas (Titular, Categoría, Deuda total, Condonado, Total a cobrar).
    // El `extraParams.type: 5` es el que hace que el back resuelva esa clave, y
    // es el mismo `type` con el que se filtró la lista.
    export: false,
    exportAsync: {
      type: 'debt-dptos-condonaciones',
      format: 'pdf',
      supportedFormats: ['pdf', 'xlsx', 'csv'],
      endpoint: '/v3/debt-dptos',
      label: 'Exportar',
      extraParams: { type: 5 },
    },
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
