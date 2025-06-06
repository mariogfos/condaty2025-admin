import DataModal from "@/mk/components/ui/DataModal/DataModal";
import Table from "@/mk/components/ui/Table/Table";
import useAxios from "@/mk/hooks/useAxios";
import React, { useEffect, useState } from "react";
import { formatNumber } from "../../../mk/utils/numbers";
import Check from "@/mk/components/forms/Check/Check";
import Input from "@/mk/components/forms/Input/Input";
import Select from "@/mk/components/forms/Select/Select";
import { UploadFile } from "@/mk/components/forms/UploadFile/UploadFile";
import { getUrlImages } from "@/mk/utils/string";
import TextArea from "@/mk/components/forms/TextArea/TextArea";
import RenderForm from "./RenderForm/RenderForm";
import { useAuth } from "@/mk/contexts/AuthProvider";
import { IconEdit } from "@/components/layout/icons/IconsBiblioteca";

interface Props {
  open: boolean;
  onClose: () => void;
  reLoad: any;
}
const PerformBudget = ({ open, onClose, reLoad }: Props) => {
  const [formState, setFormState]: any = useState([]);
  const [openModal, setOpenModal] = useState(false);
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
  }, [formState]);

  const onSave = async () => {
    const { data } = await execute("/execute-budget", "POST", formState);
    if (data?.data?.failed_count == 0 && data?.data?.success_count > 0) {
      onClose();
      showToast(
        `Se completaron ${data?.data?.success_count} registros con éxito`,
        "success",
        10000
      );
      reLoad();
    } else if (data?.data?.failed_count > 0 && data?.data?.success_count == 0) {
      showToast(
        `Hay ${data?.data?.failed_count} registros con errores`,
        "error",
        10000
      );
    } else if (
      data?.data?.failed_count >= 0 &&
      data?.data?.success_count >= 0
    ) {
      onClose();
      showToast(
        `Se completaron ${data?.data?.success_count} registros con éxito y ${data?.data?.failed_count} registros con errores`,
        "error",
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
              gap: 4,
            }}
          >
            <p>{"Bs " + formatNumber(item?.amount, 0)}</p>
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
      width: "100px",
      onRender: ({ item }: any) => {
        return (
          <Check
            name={"selected" + item?.id || ""}
            value={item?.id}
            onChange={() => handleToggle(item)}
            checked={!!formState?.find((f: any) => f?.budget_id === item?.id)}
          />
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
  const calculateTotal = () => {
    return approvedBudgets?.reduce(
      (acc: number, curr: any) => acc + (Number(curr?.amount) || 0),
      0
    );
  };

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
