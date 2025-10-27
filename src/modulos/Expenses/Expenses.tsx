'use client';
import useCrud, { ModCrudType } from '@/mk/hooks/useCrud/useCrud';
import NotAccess from '@/components/auth/NotAccess/NotAccess';
import ItemList from '@/mk/components/ui/ItemList/ItemList';
import useCrudUtils from '../shared/useCrudUtils';
import { useEffect, useMemo, useState } from 'react';
import RenderItem from '../shared/RenderItem';
import { MONTHS } from '@/mk/utils/date';
import RenderForm from './RenderForm/RenderForm';
import {
  isUnitInDefault,
  paidUnits,
  sumExpenses,
  sumPaidUnits,
  sumPenalty,
  unitsPayable,
} from '@/mk/utils/utils';
import ExpensesDetails from './ExpensesDetails/ExpensesDetailsView';
import { IconCategories } from '@/components/layout/icons/IconsBiblioteca';
import FormatBsAlign from '@/mk/utils/FormatBsAlign';
import styles from './Expenses.module.css';
import { useAuth } from '@/mk/contexts/AuthProvider';

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

const renderTotalExpensesCell = ({ item }: { item: any }) => (
  <FormatBsAlign value={sumExpenses(item?.asignados)} alignRight />
);

const renderPaidUnitsCell = ({ item }: { item: any }) => (
  <div className={styles.PaidUnitsCell}>{paidUnits(item?.asignados)}</div>
);

const renderUnitsPayableCell = ({ item }: { item: any }) => (
  <div
    className={styles.UnitsPayableCell}
    style={{
      color: isUnitInDefault(item) ? 'var(--cError)' : 'var(--cWhiteV1)',
    }}
  >
    {unitsPayable(item?.asignados)}
  </div>
);

const renderAmountsCollectedCell = ({ item }: { item: any }) => (
  <FormatBsAlign value={sumPaidUnits(item?.asignados)} alignRight />
);

const renderSumPenaltyCell = ({ item }: { item: any }) => (
  <FormatBsAlign value={sumPenalty(item?.asignados)} alignRight />
);

const renderTotalAmountCollectedCell = ({ item }: { item: any }) => (
  <FormatBsAlign
    value={
      sumExpenses(item?.asignados) + sumPenalty(item?.asignados) - sumPaidUnits(item?.asignados)
    }
    alignRight
  />
);

const mod: ModCrudType = {
  modulo: 'debts',
  singular: 'Expensa',
  plural: 'Expensas',
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
      hideEdit: paidUnits(item?.asignados) > 0,
      hideDel: paidUnits(item?.asignados) > 0,
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

const Expenses = () => {
  const [openDetail, setOpenDetail]: any = useState(false);
  const [detailItem, setDetailItem]: any = useState({});
  const { setStore: setAuthStore, store } = useAuth();
  useEffect(() => {
    setStore({ ...store, title: 'Expensas' });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

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
    type: 1,
    page: 1,
    perPage: 20,
  };

  const fields = useMemo(() => {
    return {
      id: { rules: [], api: 'e' },
      period: {
        rules: [''],
        api: '',
        label: 'Periodo',
        list: {
          width: '150px',
          onRender: renderPeriodCell,
          order: 1,
        },
      },
      paidUnits: {
        rules: [''],
        api: '',
        label: <span className={styles.SpanLabel}>Unidades al día</span>,
        list: {
          onRender: renderPaidUnitsCell,
          order: 2,
        },
      },
      unitsPayable: {
        rules: [''],
        api: '',
        label: <span className={styles.SpanLabel}>Unidades por pagar</span>,
        list: {
          onRender: renderUnitsPayableCell,
          order: 3,
        },
      },
      totalExpensesSum: {
        rules: [''],
        api: '',
        label: (
          <label style={{ display: 'block', textAlign: 'right', width: '100%' }}>
            Total de expensas
          </label>
        ),
        list: {
          onRender: renderTotalExpensesCell,
          order: 4,
        },
      },
      sumPenalty: {
        rules: [''],
        api: '',
        label: <label className={styles.SpanLabel}>Total de multa</label>,
        list: {
          onRender: renderSumPenaltyCell,
          order: 5,
        },
      },
      ammountsCollected: {
        rules: [''],
        api: '',
        label: <label className={styles.SpanLabel}>Total cobrado</label>,
        list: {
          onRender: renderAmountsCollectedCell,
          order: 6,
        },
      },
      totalAmmountCollected: {
        rules: [''],
        api: '',
        label: <label className={styles.SpanLabel}>Saldo a cobrar</label>,
        list: {
          onRender: renderTotalAmountCollectedCell,
          order: 7,
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
          options: [{ id: 1, name: 'Expensas' }],
        },
      },
    };
  }, []);

  const { userCan, List, setStore, onEdit, onDel } = useCrud({
    paramsInitial,
    mod,
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
          title={item?.name}
          subtitle={item?.description}
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
      <ExpensesDetails
        data={detailItem}
        setOpenDetail={(e: any) => {
          setStore({ title: mod?.plural });
          setOpenDetail();
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
          emptyMsg="Lista de expensas vacía. Una vez generes las cuotas"
          emptyLine2="de los residentes las verás aquí."
          emptyIcon={<IconCategories size={80} color="var(--cWhiteV1)" />}
          filterBreakPoint={800}
        />
      </div>
    );
};

export default Expenses;
