'use client';
import styles from './Outlays.module.css';
import useCrudUtils from '../shared/useCrudUtils';
import { useMemo, useState } from 'react';
import NotAccess from '@/components/layout/NotAccess/NotAccess';
import useCrud, { ModCrudType } from '@/mk/hooks/useCrud/useCrud';
import { formatNumber } from '@/mk/utils/numbers';
import Button from '@/mk/components/forms/Button/Button';
import { useRouter } from 'next/navigation';
import { getDateStrMes } from '@/mk/utils/date';
import RenderForm from './RenderForm/RenderForm';
import RenderView from './RenderView/RenderView';
import RenderDel from './RenderDel/RenderDel';

import { IconIngresos } from '@/components/layout/icons/IconsBiblioteca';
import { getFullName } from '@/mk/utils/string';
import DateRangeFilterModal from '@/components/DateRangeFilterModal/DateRangeFilterModal';
import { StatusBadge } from '@/components/Widgets/StatusBadge/StatusBadge';

const Outlays = () => {
  const router = useRouter();
  const [openCustomFilter, setOpenCustomFilter] = useState(false);
  const [customDateRange, setCustomDateRange] = useState<{
    startDate?: string;
    endDate?: string;
  }>({});
  const [customDateErrors, setCustomDateErrors] = useState<{
    startDate?: string;
    endDate?: string;
  }>({});
  const handleGetFilter = (opt: string, value: string, oldFilterState: any) => {
    const currentFilters = { ...(oldFilterState?.filterBy || {}) };
    if (opt === 'date_at' && value === 'custom') {
      setCustomDateRange({});
      setCustomDateErrors({});
      setOpenCustomFilter(true);
      delete currentFilters[opt];
      return { filterBy: currentFilters };
    }
    if (value === '' || value === null || value === undefined) {
      delete currentFilters[opt];
    } else {
      currentFilters[opt] = value;
    }
    return { filterBy: currentFilters };
  };

  const mod: ModCrudType = {
    modulo: 'expenses',
    singular: 'Egreso',
    plural: 'Egresos',
    filter: true,
    export: true,
    permiso: '',
    extraData: true,
    renderForm: RenderForm,
    titleAdd: 'Nuevo',
    titleDel: 'Anular',
    renderView: (props: any) => (
      <RenderView {...props} outlay_id={props?.item?.id} extraData={extraData} />
    ),
    renderDel: (props: any) => <RenderDel {...props} />,
    hideActions: {
      edit: true,
      del: true,
    },
    loadView: { fullType: 'DET' },
    saveMsg: {
      add: 'Egreso creado con éxito',
      edit: 'Egreso actualizado con éxito',
      del: 'Egreso anulado con éxito',
    },
  };
  const paramsInitial = {
    perPage: 20,
    page: 1,
    fullType: 'L',
    searchBy: '',
  };
  const goToCategories = (type = '') => {
    if (type) {
      router.push(`/categories?type=${type}`);
    } else {
      router.push('/categories');
    }
  };
  const getPeriodOptions = () => [
    { id: 'ALL', name: 'Todos' },
    { id: 'd', name: 'Hoy' },
    { id: 'ld', name: 'Ayer' },
    { id: 'w', name: 'Esta semana' },
    { id: 'lw', name: 'Semana anterior' },
    { id: 'm', name: 'Este mes' },
    { id: 'lm', name: 'Mes anterior' },
    { id: 'y', name: 'Este año' },
    { id: 'ly', name: 'Año anterior' },
    { id: 'custom', name: 'Personalizado' },
  ];

  const getStatusOptions = () => [
    { id: 'ALL', name: 'Todos' },
    { id: 'A', name: 'Pagado' },
    { id: 'X', name: 'Anulado' },
  ];

  const fields = useMemo(() => {
    return {
      id: { rules: [], api: 'e' },
      date_at: {
        rules: ['required'],
        api: 'ae',
        label: 'Fecha de pago',
        form: { type: 'date' },
        list: {
          onRender: (props: any) => {
            return getDateStrMes(props.item.date_at);
          },
        },
        filter: {
          label: 'Periodo',
          options: getPeriodOptions,
        },
      },
      user: {
        api: '',
        label: 'Responsable',
        list: {
          onRender: (props: any) => {
            return getFullName(props.item.user);
          },
        },
      },
      category_id: {
        rules: ['required'],
        api: 'ae',
        label: 'Categoría',
        form: {
          type: 'select',
          options: (items: any) => {
            let data: any = [];
            items?.extraData?.categories
              ?.filter((c: { padre: any; category_id: any }) => !c.padre && !c.category_id)
              ?.map((c: any) => {
                data.push({
                  id: c.id,
                  name: c.name,
                });
              });
            return data;
          },
        },
        filter: {
          label: 'Categoría',
          width: '150px',
          options: (extraData: any) => {
            const categories = extraData?.categories || [];
            const categoryOptions = categories.map((category: any) => ({
              id: category.id,
              name: category.name,
            }));
            return [{ id: 'ALL', name: 'Todos' }, ...categoryOptions];
          },
        },
        list: {
          onRender: (props: any) => {
            const category = props.item.category;
            if (!category) {
              return `sin datos`;
            }
            if (category.padre && typeof category.padre === 'object') {
              return category.padre.name || `(Padre sin nombre)`;
            } else {
              return category.name || `(Sin nombre)`;
            }
          },
        },
      },

      subcategory_id: {
        rules: ['required'],
        api: 'ae',
        label: 'Subcategoría',
        form: {
          type: 'select',
          disabled: (formState: { category_id: any }) => !formState.category_id,
          options: () => [],
        },
        list: {
          onRender: (props: any) => {
            const category = props.item.category;
            if (!category) {
              return `sin datos`;
            }
            if (category.padre && typeof category.padre === 'object') {
              return category.name || `(Sin nombre)`;
            } else {
              return '-/-';
            }
          },
        },
      },
      description: {
        rules: ['required'],
        api: 'ae',
        label: 'Concepto',
        form: { type: 'text' },
      },
      type: {
        rules: ['required'],
        api: 'ae',
        label: 'Tipo de pago',
      },
      status: {
        rules: [''],
        api: 'ae',
        label: (<span style={{ display: 'block', textAlign: 'center', width: '100%' }} title="Estado">Estado</span>),
        list: {
          onRender: (props: any) => {
            interface StatusConfig {
              [key: string]: {
                label: string;
                color: string;
                bgColor: string;
              };
            }
            
            const statusConfig: StatusConfig = {
              A: { label: 'Pagado', color: 'var(--cSuccess)', bgColor: 'var(--cHoverCompl2)' },
              X: { label: 'Anulado', color: 'var(--cWhite)', bgColor: 'var(--cHoverCompl1)' },
            };
            
            const defaultConfig = { 
              label: 'Desconocido',
              color: 'var(--cWhite)', 
              bgColor: 'var(--cHoverCompl1)' 
            };
            
            const status = props.item.status as keyof typeof statusConfig;
            const { label, color, bgColor } = statusConfig[status] || defaultConfig;
            
            return (
              <div style={{
                display: 'flex',
                justifyContent: 'center',
                alignItems: 'center',
                width: '100%',
                height: '100%',
              }}>
                <StatusBadge color={color} backgroundColor={bgColor}>
                  {label}
                </StatusBadge>
              </div>
            );
          },
          align: 'center',
        },
        filter: {
          label: 'Estado',
          width: '180px',
          options: getStatusOptions,
        },
      },

      amount: {
        rules: ['required'],
        api: 'ae',
        label: (<span style={{ display: 'block', textAlign: 'right', width: '100%' }} title="Monto total">Monto total</span>),
        form: { type: 'number' },
        list: {
          onRender: (props: any) => (
            <div style={{ width: '100%', textAlign: 'right' }}>
              {'Bs ' + formatNumber(props.item.amount)}
            </div>
          ),
          align: 'right',
        },
      },
      client_id: {
        rules: [''],
        api: 'ae',
        label: 'Cliente',
      },
      user_id: {
        rules: [''],
        api: 'ae',
        label: 'Usuario',
      },
      file: {
        rules: ['required'],
        api: 'ae*',
        label: 'Archivo',
        form: {
          type: 'fileUpload',
          ext: ['pdf', 'doc', 'docx', 'xls', 'xlsx', 'jpg', 'jpeg', 'png'],
          style: { width: '100%' },
        },
      },
      ext: {
        rules: [''],
        api: 'ae',
        label: 'Ext',
      },
    };
  }, []);
  const extraButtons = [
    <Button
      key="categories-button"
      onClick={() => goToCategories('E')}
      className={styles.categoriesButton}
    >
      Categorías
    </Button>,
  ];
  const { userCan, List, setStore, onEdit, onDel, onSearch, searchs, onFilter, extraData } =
    useCrud({
      paramsInitial,
      mod,
      fields,
      extraButtons,
      getFilter: handleGetFilter,
    });
  useCrudUtils({
    onSearch,
    searchs,
    setStore,
    mod,
    onEdit,
    onDel,
  });

  if (!userCan(mod.permiso, 'R')) return <NotAccess />;

  return (
    <div className={styles.outlays}>
      <List
        height={'calc(100vh - 350px)'}
        emptyMsg="Lista de egresos vacía. Cuando ingreses los gastos del condominio, "
        emptyLine2="aparecerán en esta sección."
        emptyIcon={<IconIngresos size={80} color="var(--cWhiteV1)" />}
        filterBreakPoint={1435}
      />

      {/* Modal para ejecutar presupuesto omentado para cuando se implmente la funcionalidad*/}
      {/*       {openModal && (
        <PerformBudget
          reLoad={reLoad}
          open={openModal}
          onClose={() => {
            setOpenModal(false);
          }}
        />
      )} */}

      <DateRangeFilterModal
        open={openCustomFilter}
        onClose={() => {
          setCustomDateRange({});
          setOpenCustomFilter(false);
          setCustomDateErrors({});
        }}
        onSave={({ startDate, endDate }) => {
          let err: { startDate?: string; endDate?: string } = {};
          if (!startDate) err.startDate = 'La fecha de inicio es obligatoria';
          if (!endDate) err.endDate = 'La fecha de fin es obligatoria';
          if (startDate && endDate && startDate > endDate) {
            err.startDate = 'La fecha de inicio no puede ser mayor a la fecha fin';
          }
          if (Object.keys(err).length > 0) {
            setCustomDateErrors(err);
            return;
          }
          const customDateFilterString = `${startDate},${endDate}`;
          onFilter('date_at', customDateFilterString);
          setOpenCustomFilter(false);
          setCustomDateErrors({});
        }}
        initialStartDate={customDateRange.startDate || ''}
        initialEndDate={customDateRange.endDate || ''}
        errorStart={customDateErrors.startDate}
        errorEnd={customDateErrors.endDate}
      />
    </div>
  );
};

export default Outlays;
