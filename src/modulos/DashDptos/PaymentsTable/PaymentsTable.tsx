'use client';
import { getDateStrMes } from '@/mk/utils/date';
import Table from '@/mk/components/ui/Table/Table';
import { StatusBadge } from '@/components/StatusBadge/StatusBadge';
import EmptyData from '@/components/NoData/EmptyData';
import { IconPagos } from '@/components/layout/icons/IconsBiblioteca';

const PAYMENT_STATUS_MAP = {
  A: { label: 'Por Pagar', backgroundColor: 'var(--cHoverWarning)', color: 'var(--cWarning)' },
  P: { label: 'Pagado', backgroundColor: 'var(--cHoverSuccess)', color: 'var(--cSuccess)' },
  S: { label: 'Por confirmar', backgroundColor: 'var(--cHoverWarning)', color: 'var(--cWarning)' },
  M: { label: 'Moroso', backgroundColor: 'var(--cHoverError)', color: 'var(--cError)' },
  R: { label: 'Rechazado', backgroundColor: 'var(--cHoverError)', color: 'var(--cError)' },
  X: { label: 'Anulado', backgroundColor: 'var(--cHoverCompl5)', color: 'var(--cMediumAlert)' },
} as const;

type PaymentStatus = keyof typeof PAYMENT_STATUS_MAP;

const getPaymentStatus = (status: PaymentStatus) => {
  return (
    PAYMENT_STATUS_MAP[status] || {
      label: status,
      backgroundColor: 'var(--cHoverLight)',
      color: 'var(--cLightDark)',
    }
  );
};

interface PaymentsTableProps {
  payments: any[];
}

const PaymentsTable = ({ payments }: PaymentsTableProps) => {
  const header = [
    {
      key: 'paid_at',
      label: 'Fecha de pago',
      responsive: 'desktop',
      onRender: ({ item }: any) => {
        return getDateStrMes(item?.paid_at) || '-';
      },
    },
    {
      key: 'categorie',
      label: 'Categoría',
      responsive: 'desktop',
      onRender: ({ item }: any) => {
        return item?.payment?.categoryP?.name || '-';
      },
    },
    {
      key: 'sub_categorie',
      label: 'Sub Categoría',
      responsive: 'desktop',
      onRender: ({ item }: any) => {
        return item?.payment?.category?.name || '-';
      },
    },
    {
      key: 'amount',
      label: 'Monto',
      responsive: 'desktop',
      onRender: ({ item }: any) => {
        return item?.amount && item?.penalty_amount
          ? `Bs ${parseFloat(item?.amount) + parseFloat(item?.penalty_amount)}`
          : '-';
      },
    },
    {
      key: 'status',
      label: 'Estado',
      style: { textAlign: 'center', justifyContent: 'center' },
      responsive: 'desktop',
      onRender: ({ item }: any) => {
        const status = item?.status as PaymentStatus;
        const statusInfo = getPaymentStatus(status);
        return (
          <StatusBadge backgroundColor={statusInfo.backgroundColor} color={statusInfo.color}>
            {statusInfo.label}
          </StatusBadge>
        );
      },
    },
  ];

  if (!payments || payments.length === 0) {
    return (
      <EmptyData
        message="Sin pagos registrados. Cuando esta unidad comience a pagar"
        line2="expensas y otros conceptos, los verás aquí."
        centered={true}
        icon={<IconPagos size={80} color="var(--cWhiteV1)" />}
      />
    );
  }

  return <Table header={header} data={payments} className="striped" />;
};

export default PaymentsTable;