'use client';
import { getDateStrMes } from '@/mk/utils/date';
import Table from '@/mk/components/ui/Table/Table';
import { StatusBadge } from '@/components/StatusBadge/StatusBadge';
import EmptyData from '@/components/NoData/EmptyData';
import { IconPagos } from '@/components/layout/icons/IconsBiblioteca';
import FormatBsAlign from '@/mk/utils/FormatBsAlign';
import { PaymentStatus, getPaymentStatusConfig } from '@/types/payment';

const statusCell = ({ item }: { item: any }) => {
  const status = item?.status as PaymentStatus;
  const statusInfo = getPaymentStatusConfig(status);
  return (
    <StatusBadge backgroundColor={statusInfo.backgroundColor} color={statusInfo.color}>
      {statusInfo.label}
    </StatusBadge>
  );
};

const amountCell = ({ item }: { item: any }) => {
  return item?.amount || item?.penalty_amount ? (
    <FormatBsAlign value={item.amount + item.penalty_amount} alignRight={true} />
  ) : (
    '-/-'
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
        return getDateStrMes(item?.paid_at) || '-/-';
      },
    },
    {
      key: 'category',
      label: 'Categoría',
      responsive: 'desktop',
      onRender: ({ item }: any) => {
        return item?.category?.padre?.name || '-/-';
      },
    },
    {
      key: 'subcategory',
      label: 'Subcategoría',
      responsive: 'desktop',
      onRender: ({ item }: any) => {
        return item?.category?.name || '-/-';
      },
    },
    {
      key: 'amount',
      label: 'Monto',
      style: { textAlign: 'right', justifyContent: 'flex-end' },
      responsive: 'desktop',
      onRender: amountCell,
    },
    {
      key: 'status',
      label: 'Estado',
      style: { textAlign: 'center', justifyContent: 'center' },
      responsive: 'desktop',
      onRender: statusCell,
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
