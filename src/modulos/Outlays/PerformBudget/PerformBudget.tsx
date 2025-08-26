import DataModal from "@/mk/components/ui/DataModal/DataModal";
import Table from "@/mk/components/ui/Table/Table";
import useAxios from "@/mk/hooks/useAxios";
import React, { useEffect, useState } from "react";
import { formatBs } from "../../../mk/utils/numbers";
import Check from "@/mk/components/forms/Check/Check";
import RenderForm from "./RenderForm/RenderForm";
import { useAuth } from "@/mk/contexts/AuthProvider";
import { IconEdit } from "@/components/layout/icons/IconsBiblioteca";
import { formatNumber } from '../../../mk/utils/numbers';

interface Props {
  open: boolean;
  onClose: () => void;
  reLoad: any;
}

const PerformBudget = ({ open, onClose, reLoad }: Props) => {
  const [formState, setFormState]: any = useState([]);
  const [openModal, setOpenModal] = useState(false);
  const [errorModal, setErrorModal] = useState(false); // <- Agregar estado para modal de errores
  const [failedRecords, setFailedRecords] = useState([]); // <- Estado para registros fallidos
  const { showToast } = useAuth();
  const [item, setItem]: any = useState(null);
  const [approvedBudgets, setApprovedBudgets]: any = useState([]);

  const { execute } = useAxios();
  const getApprovedBudgets = async () => {
    const { data } = await execute("/approved-budgets", "GET", {
      page: 1,
      perPage: -1,
    });
    if (data?.success == true) {
      setApprovedBudgets(data?.data);
    }
  };
  useEffect(() => {
    getApprovedBudgets();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    const newData = approvedBudgets.map((budget: any) => {
      const relatedPayment = formState.find(
        (f: any) => f.budget_id === budget.id
      );
      return {
        ...budget,
        paid: relatedPayment ? relatedPayment.amount : "-/-",
      };
    });
    setApprovedBudgets(newData);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [formState]);

  const onSave = async () => {
    const { data } = await execute("/execute-budget", "POST", formState);

    // Debug: Ver toda la respuesta
    console.log('🔍 Respuesta completa del API:', data);

    // Acceder correctamente a los datos anidados
    const responseData = data?.data;

    // Debug: Ver los datos específicos
    console.log('📊 Response Data:', responseData);
    console.log('✅ Success Count:', responseData?.success_count);
    console.log('❌ Failed Count:', responseData?.failed_count);
    console.log('📋 Failed Records:', responseData?.failed_records);

    if (responseData?.failed_count == 0 && responseData?.success_count > 0) {
      console.log('✅ Caso: Solo éxitos');
      onClose();
      showToast(
        `Se completaron ${responseData?.success_count} registros con éxito`,
        "success",
        10000
      );
      reLoad();
    } else if (responseData?.failed_count > 0 && responseData?.success_count == 0) {
      console.log('❌ Caso: Solo errores');
      console.log('🔧 Setting failed records:', responseData?.failed_records);

      // Solo errores - mostrar modal con detalles
      setFailedRecords(responseData?.failed_records || []);
      setErrorModal(true);
      showToast(
        `Hay ${responseData?.failed_count} registros con errores. Revisa los detalles.`,
        "error",
        10000
      );
    } else if (
      responseData?.failed_count >= 0 &&
      responseData?.success_count >= 0
    ) {
      console.log('⚠️ Caso: Éxitos y errores mixtos');
      console.log('🔧 Setting failed records:', responseData?.failed_records);

      // Éxitos y errores - mostrar modal con detalles de errores
      setFailedRecords(responseData?.failed_records || []);
      setErrorModal(true);
      showToast(
        `Se completaron ${responseData?.success_count} registros con éxito y ${responseData?.failed_count} registros con errores`,
        "warning",
        10000
      );
      reLoad();
    }
  };

  const handleToggle = (item: any) => {
    setItem(item);
    if (formState?.find((f: any) => f?.budget_id === item?.id)) {
      setFormState(formState.filter((f: any) => f?.budget_id !== item?.id));
      return;
    }
    setOpenModal(true);
  };

  const onEdit = (item: any) => {
    setItem({ ...item, action: "edit" });
    setOpenModal(true);
  };

  const header: any = [
    {
      key: "name",
      label: "Nombre",
    },
    {
      key: "category",
      label: "Categoría",
      onRender: ({ item }: any) => item?.category?.name,
    },
    {
      key: "amount",
      label: "Total",
      width: "180px",
      onRender: ({ item }: any) => {
        return (
          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "flex-end", // <- Agregar para alinear a la derecha
              gap: 4,
              width: "100%", // <- Asegurar que ocupe todo el ancho
            }}
          >
            <p style={{ textAlign: "right" }}>{formatBs(item?.amount || 0)}</p> {/* <- Alinear texto a la derecha */}
            {formState?.find((f: any) => f?.budget_id === item?.id) && (
              <IconEdit onClick={() => onEdit(item)} />
            )}
          </div>
        );
      },
    },
    {
      key: "selected",
      label: "Seleccionar",
      width: "150px",
      onRender: ({ item }: any) => {
        return (
          <div style={{ display: 'flex', justifyContent: 'center', width: '100%' }}>
            <Check
              name={"selected" + item?.id || ""}
              value={item?.id}
              onChange={() => handleToggle(item)}
              checked={!!formState?.find((f: any) => f?.budget_id === item?.id)}
            />
          </div>
        );
      },
    },
    {
      key: "paid",
      label: "Pagado",
      width: "180px",
      style: {
        display: "flex",
        borderLeft: "1px solid var(--cWhiteV1",
        justifyContent: "center",
      },
      onHide: () => formState?.length === 0,
      onRender: ({ item }: any) => {
        return <p>{"Bs " + item?.paid}</p>;
      },
    },
  ];

  const calculateTotalPagado = () => {
    return formState.reduce(
      (acc: number, curr: any) => acc + (Number(curr?.amount) || 0),
      0
    );
  };

  // Header para la tabla de errores
  const errorHeader = [
    {
      key: "item",
      label: "Presupuesto",
    },
    {
      key: "error",
      label: "Error",
      style: { color: "var(--cError)" },
    },
  ];

  return (
    <>
      <DataModal
        title="Ejecutar presupuesto"
        open={open}
        buttonText="Ejecutar"
        disabled={formState.length === 0}
        onClose={onClose}
        onSave={onSave}
      >
        <Table data={approvedBudgets} header={header} />

        <div
          style={{
            padding: 8,
            borderBottom: "1px solid #ccc",
            marginBottom: 8,
            display: "flex",
            justifyContent: "space-between",
          }}
        >
          <p>Por pagar: {formatNumber(calculateTotalPagado(), 0)}</p>
        </div>
      </DataModal>

      {/* Modal para mostrar errores detallados */}
      {errorModal && (
        <DataModal
          title="Errores en la ejecución del presupuesto"
          open={errorModal}
          buttonText=""
          buttonCancel=""
          onClose={() => {
            console.log('🚪 Cerrando modal de errores');
            setErrorModal(false);
          }}
        >
          <div style={{ marginBottom: "16px", color: "var(--cError)" }}>
            <p>Los siguientes presupuestos no pudieron ser ejecutados:</p>
            {/* Debug info */}

          </div>
          <Table
            data={failedRecords}
            header={[
              {
                key: "item",
                label: "Presupuesto",
                responsive: "all"
              },
              {
                key: "error",
                label: "Error",
                responsive: "all",
                style: { color: "var(--cError)" }
              }
            ]}
          />
        </DataModal>
      )}

      {openModal && (
        <RenderForm
          item={formState}
          setItem={setFormState}
          data={item}
          open={openModal}
          onClose={() => setOpenModal(false)}
        />
      )}
    </>
  );
};

export default PerformBudget;
