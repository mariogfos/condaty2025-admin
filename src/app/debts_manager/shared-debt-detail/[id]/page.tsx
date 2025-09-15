'use client';
import DetailSharedDebts from '@/modulos/DebtsManager/TabComponents/SharedDebts/DetalleDeudaCompartida/DetailSharedDebts';
import { useParams } from 'next/navigation';


export default function SharedDebtDetailPage() {
  const params = useParams();
  const debtId = params.id as string;

  return (
    <DetailSharedDebts
      debtId={debtId}
      debtTitle="Factura de agua - Septiembre"
    />
  );
}
