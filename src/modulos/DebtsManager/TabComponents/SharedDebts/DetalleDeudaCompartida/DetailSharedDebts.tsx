'use client';
import React, { useMemo } from 'react';
import { useRouter } from 'next/navigation';
import useCrud, { ModCrudType } from '@/mk/hooks/useCrud/useCrud';
import { IconCategories, IconArrowLeft } from '@/components/layout/icons/IconsBiblioteca';
import FormatBsAlign from '@/mk/utils/FormatBsAlign';
import { StatusBadge } from '@/components/StatusBadge/StatusBadge';
import styles from './DetailSharedDebts.module.css';
import { span } from 'motion/react-client';

interface DetailSharedDebtsProps {
  debtId: string;
  debtTitle?: string;
}

const DetailSharedDebts: React.FC<DetailSharedDebtsProps> = ({
  debtId,
  debtTitle = "Factura de agua - Septiembre"
}) => {
  const router = useRouter();

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
    debt_id: debtId, // Filtrar por el ID de la deuda
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
    modulo: 'shared-debt-details', // Endpoint para detalles de deuda compartida
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

  const { List, extraData } = useCrud({
    paramsInitial,
    mod,
    fields,
  });

  // Datos simulados para las cards (estos vendrían del extraData en producción)
  const summaryData = {
    cobradas: { amount: 20184.00, count: 120, total: 250 },
    porCobrar: { amount: 17539.00, count: 80, total: 250 },
    enMora: { amount: 13832.00, count: 84, total: 250 }
  };

  const handleVolver = () => {
    router.back();
  };

  return (
    <div className={styles.container}>
      {/* Header con botón volver y título */}
      <div className={styles.header}>
        <button onClick={handleVolver} className={styles.backButton}>
          <IconArrowLeft size={20} />
          Volver
        </button>
        <h1 className={styles.title}>{debtTitle}</h1>
      </div>

      {/* Cards de resumen */}
      <div className={styles.summaryCards}>
        <div className={styles.card}>
          <div className={styles.cardHeader}>
            <span className={styles.cardLabel}>DISTRIBUCIÓN & ASIGNACIÓN</span>
          </div>
          <div className={styles.cardTitle}>Proporcional por m<sup>2</sup></div>
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

      {/* Lista con useCrud */}
      <div className={styles.listContainer}>
        <List
          height={'calc(100vh - 400px)'}
          emptyMsg="No hay detalles de deuda compartida disponibles"
          emptyLine2="Los detalles aparecerán aquí cuando estén disponibles."
          emptyIcon={<IconCategories size={80} color="var(--cWhiteV1)" />}
          filterBreakPoint={2500}
          sumarize={true}
        />
      </div>
    </div>
  );
};

export default DetailSharedDebts;
