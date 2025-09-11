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

const DebtsManager = () => {
  const [openDetail, setOpenDetail]: any = useState(false);
  const [detailItem, setDetailItem]: any = useState({});
  const [openView, setOpenView] = useState(false);
  const [viewItem, setViewItem] = useState({});
  const { setStore: setAuthStore, store } = useAuth();

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

  const renderAmountCell = ({ item }: { item: any }) => (
    <FormatBsAlign value={parseFloat(item?.amount) || 0} alignRight />
  );

  const renderDueDateCell = ({ item }: { item: any }) => {
    if (!item?.due_at) return <div>-</div>;
    const date = new Date(item.due_at);
    return (
      <div>
        {date.toLocaleDateString('es-ES', {
          day: '2-digit',
          month: '2-digit',
          year: 'numeric'
        })}
      </div>
    );
  };

  const renderStatusCell = ({ item }: { item: any }) => {
    const getStatusText = (status: string) => {
      const statusMap: { [key: string]: string } = {
        'A': 'Activa',
        'P': 'Pagada',
        'C': 'Cancelada',
        'X': 'Anulada'
      };
      return statusMap[status] || status;
    };

    const getStatusColor = (status: string) => {
      const colorMap: { [key: string]: string } = {
        'A': 'var(--cWarning)',
        'P': 'var(--cSuccess)',
        'C': 'var(--cInfo)',
        'X': 'var(--cError)'
      };
      return colorMap[status] || 'var(--cWhiteV1)';
    };

    return (
      <div style={{ color: getStatusColor(item?.status) }}>
        {getStatusText(item?.status)}
      </div>
    );
  };

  const renderTypeCell = ({ item }: { item: any }) => {
    const getTypeName = (type: number) => {
      const types: { [key: number]: string } = {
        1: 'Cuota ordinaria',
        2: 'Cuota extraordinaria',
        3: 'Multa',
        4: 'Otros'
      };
      return types[type] || `Tipo ${type}`;
    };

    return (
      <div>
        {getTypeName(item?.type)}
      </div>
    );
  };

  const renderInterestCell = ({ item }: { item: any }) => (
    <div>
      {parseFloat(item?.interest) || 0}%
    </div>
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
        label: 'Período',
        list: {

          onRender: renderPeriodCell,
          order: 1,
        },
      },
      type: {
        rules: [''],
        api: '',
        label: 'Tipo',
        list: {

          onRender: renderTypeCell,
          order: 2,
        },
      },
      amount: {
        rules: [''],
        api: '',
        label: (
          <label style={{ display: 'block', textAlign: 'right', width: '100%' }}>
            Monto (Bs)
          </label>
        ),
        list: {

          onRender: renderAmountCell,
          order: 3,
        },
      },
      due_at: {
        rules: [''],
        api: '',
        label: 'Fecha vencimiento',
        list: {

          onRender: renderDueDateCell,
          order: 4,
        },
      },
      interest: {
        rules: [''],
        api: '',
        label: 'Interés',
        list: {

          onRender: renderInterestCell,
          order: 5,
        },
      },
      status: {
        rules: [''],
        api: '',
        label: 'Estado',
        list: {

          onRender: renderStatusCell,
          order: 6,
        },
      },
      show: {
        rules: [''],
        api: '',
        label: 'Detalle',
        form: false,
        list: {
          onRender: renderShowCell,
          order: 7,

        },
      },
      // Campos para filtros - NO aparecen en la lista
      year: {
        rules: ['required'],
        api: 'ae',
        label: 'Año',
        form: { type: 'text' },
        list: false,
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
        list: false,
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
      // Campos del formulario - NO aparecen en la lista
      begin_at: {
        rules: ['required'],
        api: 'ae',
        label: 'Fecha de inicio',
        form: { type: 'date' },
        list: false,
      },
      subcategory_id: {
        rules: ['required'],
        api: 'ae',
        label: 'Subcategoría',
        form: {
          type: 'select',
          options: [
            { id: 1, name: 'Agua' },
            { id: 2, name: 'Electricidad' },
            { id: 3, name: 'Gas' },
            { id: 4, name: 'Internet' },
            { id: 5, name: 'Teléfono' },
            { id: 6, name: 'Limpieza' },
            { id: 7, name: 'Jardinería' },
          ],
        },
        list: false,
      },
      amount_type: {
        rules: ['required'],
        api: 'ae',
        label: 'Tipo de monto',
        form: {
          type: 'select',
          options: [
            { id: 'F', name: 'Fijo' },
            { id: 'V', name: 'Variable' },
            { id: 'P', name: 'Porcentual' },
          ],
        },
        list: false,
      },
      description: {
        rules: [],
        api: 'ae',
        label: 'Descripción',
        form: { type: 'textarea' },
        list: false,
      },
      // Campos adicionales del formulario que no aparecen en la lista
      asignar: {
        rules: ['required'],
        api: 'ae',
        label: 'Asignar',
        form: {
          type: 'select',
          options: [
            { id: 'S', name: 'Sí' },
            { id: 'N', name: 'No' },
          ],
        },
        list: false,
      },
      dpto_id: {
        rules: ['required'],
        api: 'ae',
        label: 'Departamento',
        form: { type: 'select' },
        list: false,
      },
      is_advance: {
        rules: ['required'],
        api: 'ae',
        label: 'Es anticipo',
        form: {
          type: 'select',
          options: [
            { id: 'Y', name: 'Sí' },
            { id: 'N', name: 'No' },
          ],
        },
        list: false,
      },
      has_mv: {
        rules: [],
        api: 'ae',
        label: 'Tiene MV',
        form: { type: 'checkbox' },
        list: false,
      },
      is_forgivable: {
        rules: [],
        api: 'ae',
        label: 'Es perdonable',
        form: { type: 'checkbox' },
        list: false,
      },
      has_pp: {
        rules: [],
        api: 'ae',
        label: 'Tiene PP',
        form: { type: 'checkbox' },
        list: false,
      },
      is_blocking: {
        rules: [],
        api: 'ae',
        label: 'Es bloqueante',
        form: { type: 'checkbox' },
        list: false,
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
        hideEdit: item?.status === 'P' || item?.status === 'X', // No editar si está pagada o anulada
        hideDel: item?.status === 'P' || item?.status === 'X',  // No eliminar si está pagada o anulada
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

  // Usamos useCrud normal sin datos mockeados
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
    const getStatusText = (status: string) => {
      const statusMap: { [key: string]: string } = {
        'A': 'Activa',
        'P': 'Pagada',
        'C': 'Cancelada',
        'X': 'Anulada'
      };
      return statusMap[status] || status;
    };

    return (
      <RenderItem item={item} onClick={onClickDetail} onLongPress={onLongPress}>
        <ItemList
          title={`${MONTHS[item?.month]} ${item?.year} - ${getStatusText(item?.status)}`}
          subtitle={`Monto: Bs ${parseFloat(item?.amount || 0).toFixed(2)} - Vence: ${item?.due_at ? new Date(item.due_at).toLocaleDateString('es-ES') : 'Sin fecha'}`}
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
        />

        {/* Modal de vista de detalle */}
        <RenderView
          open={openView}
          onClose={() => setOpenView(false)}
          item={viewItem}
          extraData={{}}
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
