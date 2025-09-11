'use client';
import useCrud, { ModCrudType } from '@/mk/hooks/useCrud/useCrud';
import NotAccess from '@/components/auth/NotAccess/NotAccess';
import ItemList from '@/mk/components/ui/ItemList/ItemList';
import useCrudUtils from '../shared/useCrudUtils';
import { useEffect, useMemo, useState } from 'react';
import RenderItem from '../shared/RenderItem';
import { MONTHS } from '@/mk/utils/date';
import RenderForm from './RenderForm/RenderForm';
import RenderView from './RenderView/RenderView';
import {
  isUnitInDefault,
  paidUnits,
  sumExpenses,
  sumPaidUnits,
  sumPenalty,
  unitsPayable,
} from '@/mk/utils/utils';

import { IconCategories } from '@/components/layout/icons/IconsBiblioteca';
import FormatBsAlign from '@/mk/utils/FormatBsAlign';
import styles from './DebtsManager.module.css';
import { useAuth } from '@/mk/contexts/AuthProvider';
import DebtsManagerDetail from './ExpensesDetails/DebtsManagerDetailView';

const mockData = {
  data: [
    {
      id: 1,
      month: 3, // Marzo
      year: 2025,
      unitsUpToDate: 2,
      unitsToPay: 1,
      totalDebt: 4300.00,
      totalCollected: 0.00,
      totalPenalty: 350000.00,
      totalToPay: 1500.00,
      asignados: [],
      created_at: '2025-01-15T10:30:00Z',
      updated_at: '2025-01-15T10:30:00Z',
      status: 'Activa',
      // Campos adicionales para el RenderView
      begin_at: '2025-03-01',
      due_at: '2025-03-31',
      type: 4,
      description: 'Deuda de servicios básicos del mes de marzo',
      subcategory_id: 7,
      asignar: 'S',
      dpto_id: 1,
      amount_type: 'F',
      amount: 4300.00,
      is_advance: 'Y',
      interest: 0,
      has_mv: 'N',
      is_forgivable: 'N',
      has_pp: 'Y',
      is_blocking: 'N'
    },
    {
      id: 2,
      month: 2, // Febrero
      year: 2025,
      unitsUpToDate: 3,
      unitsToPay: 0,
      totalDebt: 3200.00,
      totalCollected: 3200.00,
      totalPenalty: 0.00,
      totalToPay: 0.00,
      asignados: [],
      created_at: '2025-01-10T08:15:00Z',
      updated_at: '2025-01-10T08:15:00Z',
      status: 'Completada',
      // Campos adicionales para el RenderView
      begin_at: '2025-02-01',
      due_at: '2025-02-28',
      type: 4,
      description: 'Deuda de servicios básicos del mes de febrero',
      subcategory_id: 7,
      asignar: 'S',
      dpto_id: 1,
      amount_type: 'F',
      amount: 3200.00,
      is_advance: 'Y',
      interest: 0,
      has_mv: 'N',
      is_forgivable: 'N',
      has_pp: 'Y',
      is_blocking: 'N'
    },
    {
      id: 3,
      month: 1, // Enero
      year: 2025,
      unitsUpToDate: 2,
      unitsToPay: 1,
      totalDebt: 5100.00,
      totalCollected: 3400.00,
      totalPenalty: 200.00,
      totalToPay: 1900.00,
      asignados: [],
      created_at: '2025-01-05T14:20:00Z',
      updated_at: '2025-01-05T14:20:00Z',
      status: 'Activa',
      // Campos adicionales para el RenderView
      begin_at: '2025-01-01',
      due_at: '2025-01-31',
      type: 4,
      description: 'Deuda de servicios básicos del mes de enero',
      subcategory_id: 7,
      asignar: 'S',
      dpto_id: 1,
      amount_type: 'F',
      amount: 5100.00,
      is_advance: 'Y',
      interest: 0,
      has_mv: 'N',
      is_forgivable: 'N',
      has_pp: 'Y',
      is_blocking: 'N'
    }
  ],
  total: 3,
  message: { total: 3 }
};

// Mock data para extraData
const mockExtraData = {
  dptos: [
    {
      id: 1,
      nro: '101',
      description: 'Departamento A',
      titular: {
        name: 'Juan',
        last_name: 'Pérez',
        middle_name: 'Carlos'
      }
    },
    {
      id: 2,
      nro: '102',
      description: 'Departamento B',
      titular: {
        name: 'María',
        last_name: 'González',
        middle_name: 'Elena'
      }
    }
  ]
};

const DebtsManager = () => {
  const [openDetail, setOpenDetail]: any = useState(false);
  const [detailItem, setDetailItem]: any = useState({});
  const [openView, setOpenView] = useState(false);
  const [viewItem, setViewItem] = useState({});
  const { setStore: setAuthStore, store } = useAuth();

  // Estado para datos mockeados
  const [mockDataState, setMockDataState] = useState(mockData);

  useEffect(() => {
    setStore({ ...store, title: 'Gestor de Deudas' });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const renderPeriodCell = (props: any) => {
    const month = props?.item?.month;
    const year = props?.item?.year;
    const monthName = MONTHS[month] || '';
    return (
      <div>
        {monthName} {year}
      </div>
    );
  };

  const renderTotalDebtCell = ({ item }: { item: any }) => (
    <FormatBsAlign value={item?.totalDebt || 0} alignRight />
  );

  const renderUnitsUpToDateCell = ({ item }: { item: any }) => (
    <div className={styles.UnitsCell}>{item?.unitsUpToDate || 0}</div>
  );

  const renderUnitsToPayCell = ({ item }: { item: any }) => (
    <div
      className={styles.UnitsCell}
      style={{
        color: (item?.unitsToPay || 0) > 0 ? 'var(--cError)' : 'var(--cWhiteV1)',
      }}
    >
      {item?.unitsToPay || 0}
    </div>
  );

  const renderTotalCollectedCell = ({ item }: { item: any }) => (
    <FormatBsAlign value={item?.totalCollected || 0} alignRight />
  );

  const renderTotalPenaltyCell = ({ item }: { item: any }) => (
    <FormatBsAlign value={item?.totalPenalty || 0} alignRight />
  );

  const renderTotalToPayCell = ({ item }: { item: any }) => (
    <FormatBsAlign
      value={item?.totalToPay || 0}
      alignRight
    />
  );

  const renderShowCell = ({ item }: { item: any }) => (
    <button
      onClick={(e) => {
        e.stopPropagation();
        setViewItem(item);
        setOpenView(true);
      }}
      style={{
        background: 'var(--cSuccess)',
        color: 'var(--cWhite)',
        border: 'none',
        padding: '8px 16px',
        borderRadius: 'var(--bRadiusS)',
        cursor: 'pointer',
        fontSize: 'var(--sS)',
        fontWeight: 'var(--bMedium)',
        transition: 'all 0.3s ease',
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.background = 'var(--cHoverSuccess)';
        e.currentTarget.style.transform = 'translateY(-1px)';
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.background = 'var(--cSuccess)';
        e.currentTarget.style.transform = 'translateY(0)';
      }}
    >
      Ver detalle
    </button>
  );

  const getYearOptions = () => {
    const lAnios: any = [{ id: 'ALL', name: 'Todos' }];
    const lastYear = new Date().getFullYear();
    for (let i = lastYear; i >= 2000; i--) {
      lAnios.push({ id: i, name: i.toString() });
    }
    return lAnios;
  };

  const paramsInitial = {
    fullType: 'L',
    page: 1,
    perPage: 20,
  };

  const fields = useMemo(() => {
    return {
      id: { rules: [], api: 'e' },
      period: {
        rules: [''],
        api: '',
        label: 'Fecha',
        list: {
          width: '150px',
          onRender: renderPeriodCell,
          order: 1,
        },
      },
      unitsUpToDate: {
        rules: [''],
        api: '',
        label: <span className={styles.SpanLabel}>Unidades al día</span>,
        list: {
          onRender: renderUnitsUpToDateCell,
          order: 2,
        },
      },
      unitsToPay: {
        rules: [''],
        api: '',
        label: <span className={styles.SpanLabel}>Unidades por pagar</span>,
        list: {
          onRender: renderUnitsToPayCell,
          order: 3,
        },
      },
      totalDebt: {
        rules: [''],
        api: '',
        label: (
          <label style={{ display: 'block', textAlign: 'right', width: '100%' }}>
            Monto total de deuda
          </label>
        ),
        list: {
          onRender: renderTotalDebtCell,
          order: 4,
        },
      },
      totalCollected: {
        rules: [''],
        api: '',
        label: <label className={styles.SpanLabel}>Total cobrado</label>,
        list: {
          onRender: renderTotalCollectedCell,
          order: 5,
        },
      },
      totalPenalty: {
        rules: [''],
        api: '',
        label: <label className={styles.SpanLabel}>Total de mora</label>,
        list: {
          onRender: renderTotalPenaltyCell,
          order: 6,
        },
      },
      totalToPay: {
        rules: [''],
        api: '',
        label: <label className={styles.SpanLabel}>Total a cobrar</label>,
        list: {
          onRender: renderTotalToPayCell,
          order: 7,
        },
      },
      show: {
        rules: [''],
        api: '',
        label: 'Detalle',
        form: false,
        list: {
          onRender: renderShowCell,
          order: 8,
          width: '120px',
        },
      },
      year: {
        rules: ['required'],
        api: 'ae',
        label: 'Año',
        form: { type: 'text' },
        filter: {
          label: 'Año',
          width: '100%',
          options: getYearOptions,
          optionLabel: 'name',
        },
      },
      month: {
        rules: ['required'],
        api: 'ae',
        label: 'Mes',
        form: {
          type: 'select',
          options: MONTHS.map((month, index) => ({
            id: index,
            name: month,
          })),
        },
        filter: {
          label: 'Meses',
          width: '100%',
          options: () =>
            MONTHS.map((month, index) => ({
              id: index == 0 ? 'ALL' : index,
              name: index == 0 ? 'Todos' : month,
            })),
        },
      },
      category_id: {
        rules: ['required'],
        api: 'ae',
        label: 'Categoría',
        form: {
          type: 'select',
          options: [{ id: 1, name: 'Gestión de Deudas' }],
        },
      },
    };
  }, []);

  const mod: ModCrudType = {
    modulo: 'debts',
    singular: 'Deuda',
    plural: 'Deudas',
    export: true,
    filter: true,
    permiso: 'expense',
    extraData: true,
    search: { hide: true },
    hideActions: {
      view: true,
      edit: true,
      del: true,
    },
    onHideActions: (item: any) => {
      return {
        hideEdit: (item?.unitsUpToDate || 0) > 0,
        hideDel: (item?.unitsUpToDate || 0) > 0,
      };
    },
    renderForm: (props: {
      item: any;
      setItem: any;
      errors: any;
      extraData: any;
      open: boolean;
      onClose: any;
      user: any;
      execute: any;
      setErrors: any;
      action: any;
      openList: any;
      setOpenList: any;
      reLoad: any;
    }) => {
      return (
        <RenderForm
          onClose={props.onClose}
          open={props.open}
          item={props.item}
          setItem={props.setItem}
          errors={props.errors}
          extraData={props.extraData}
          user={props.user}
          execute={props.execute}
          setErrors={props.setErrors}
          reLoad={props.reLoad}
          action={props.action}
          openList={props.openList}
          setOpenList={props.setOpenList}
        />
      );
    },
  };

  // Modificamos useCrud para usar datos mockeados
  const { userCan, List, setStore, onEdit, onDel } = useCrud({
    paramsInitial,
    mod: {
      ...mod,
      noWaiting: true, // Evita llamadas al backend
    },
    fields,
  });

  const { onLongPress, selItem } = useCrudUtils({
    onSearch: () => {},
    searchs: {},
    setStore,
    mod,
    onEdit,
    onDel,
  });

  const renderItem = (item: Record<string, any>) => {
    return (
      <RenderItem item={item} onClick={onClickDetail} onLongPress={onLongPress}>
        <ItemList
          title={`${MONTHS[item?.month]} ${item?.year}`}
          subtitle={`Total a cobrar: Bs ${item?.totalToPay?.toFixed(2)}`}
          variant="V1"
          active={selItem && selItem.id == item.id}
        />
      </RenderItem>
    );
  };

  const onClickDetail = (row: any) => {
    setDetailItem(row);
    setOpenDetail(true);
  };

  if (!userCan(mod.permiso, 'R')) return <NotAccess />;

  if (openDetail)
    return (
      <DebtsManagerDetail
        data={detailItem}
        setOpenDetail={(e: any) => {
          setStore({ title: mod?.plural });
          setOpenDetail(false);
        }}
      />
    );
  else
    return (
      <div>
        <List
          height={'calc(100vh - 350px)'}
          onTabletRow={renderItem}
          onRowClick={onClickDetail}
          emptyMsg="Lista del gestor de deudas vacía. Una vez generes las cuotas"
          emptyLine2="de los residentes las verás aquí."
          emptyIcon={<IconCategories size={80} color="var(--cWhiteV1)" />}
          filterBreakPoint={800}
          // Pasamos los datos mockeados directamente
          mockData={mockDataState}
        />

        {/* Modal de vista de detalle */}
        <RenderView
          open={openView}
          onClose={() => setOpenView(false)}
          item={viewItem}
          extraData={mockExtraData}
          user={store?.user}
          onEdit={(item) => {
            setViewItem(item);
            setOpenView(false);
            onEdit(item);
          }}
          onDel={(item) => {
            setViewItem(item);
            setOpenView(false);
            onDel(item);
          }}
        />
      </div>
    );
};

export default DebtsManager;
