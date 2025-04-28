import Input from "@/mk/components/forms/Input/Input";
import Select from "@/mk/components/forms/Select/Select";
import DataModal from "@/mk/components/ui/DataModal/DataModal";
import useAxios from "@/mk/hooks/useAxios";
import React, { useEffect, useState } from "react";
import TitleSubtitle from "./TitleSubtitle";
import { getFullName } from "@/mk/utils/string";
import TextArea from "@/mk/components/forms/TextArea/TextArea";
import { checkRules, hasErrors } from "@/mk/utils/validate/Rules";

interface Props {
  open: boolean;
  onClose: () => void;
  areas: any;
}

const MaintenanceModal = ({ open, onClose, areas }: Props) => {
  const [formState, setFormState]: any = useState({});
  const { execute } = useAxios();
  const [errors, setErrors] = useState({});
  const [reservas, setReservas] = useState([]);
  const handleChange = (e: any) => {
    const { name, value } = e.target;
    setFormState({
      ...formState,
      [name]: value,
    });
  };

  const getReservas = async () => {
    const { data } = await execute("/reservations", "GET", {
      fullType: "L",
      date_at: formState.date_at,
      date_end: formState.date_end,
      area_id: formState.area_id,
    });
    if (data?.success == true) {
      setReservas(data?.data);
    }
  };
  useEffect(() => {
    if (formState.date_at && formState.date_end) {
      getReservas();
    }
  }, [formState.date_at, formState.date_end]);

  const _onClose = () => {
    setFormState({});
    onClose();
    setReservas([]);
  };

  const validate = () => {
    let errors: any = {};
    errors = checkRules({
      value: formState?.area_id,
      rules: ["required"],
      key: "area_id",
      errors,
    });
    errors = checkRules({
      value: formState?.date_at,
      rules: ["required"],
      key: "date_at",
      errors,
    });
    errors = checkRules({
      value: formState?.date_end,
      rules: ["required"],
      key: "date_end",
      errors,
    });
    errors = checkRules({
      value: formState?.reason,
      rules: ["required"],
      key: "reason",
      errors,
    });

    setErrors(errors);
    return errors;
  };

  const onSave = async () => {
    if (hasErrors(validate())) return;
    const { data } = await execute(
      "/reservations-areablocked",
      "POST",
      formState
    );
    if (data?.success == true) {
      _onClose();
    }
  };

  return (
    <DataModal
      title="Mantenimiento"
      open={open}
      onClose={_onClose}
      onSave={onSave}
    >
      <TitleSubtitle title="Seleccione el área social que requiere mantenimiento" />
      <Select
        label="Area"
        name="area_id"
        value={formState?.area_id}
        error={errors}
        onChange={handleChange}
        options={areas || []}
        optionLabel="title"
        optionValue="id"
      />
      {formState?.area_id && (
        <>
          <TitleSubtitle
            title="Defina el período de mantenimiento"
            subtitle="Importante: Todas las reservas existentes dentro del rango de fechas seleccionado serán canceladas automáticamente."
          />
          <div style={{ display: "flex", gap: 12 }}>
            <Input
              label="Fecha de inicio"
              type="datetime-local"
              name="date_at"
              error={errors}
              value={formState?.date_at}
              onChange={handleChange}
            />
            <Input
              label="Fecha de fin"
              type="datetime-local"
              name="date_end"
              error={errors}
              value={formState?.date_end}
              disabled={!formState?.date_at}
              onChange={handleChange}
            />
          </div>
        </>
      )}

      {reservas.length > 0 && (
        <div style={{ marginTop: "20px" }}>
          <TitleSubtitle
            title={`Se cancelarán ${reservas.length} reserva(s)`}
            subtitle="Las siguientes reservas serán canceladas:"
          />
          <div
            style={{
              overflowX: "auto",
              gap: "8px",
              marginTop: "8px",
              display: "flex",
            }}
          >
            {reservas.map((reserva: any) => (
              <div
                key={reserva.id}
                style={{
                  padding: "12px",
                  fontSize: "14px",
                  borderRadius: "8px",
                  minWidth: "300px",
                  backgroundColor: "var(--cBlackV1)",
                }}
              >
                <div style={{ fontWeight: "bold", color: "var(--cWhite)" }}>
                  {getFullName(reserva?.owner)}
                </div>
                {/* <div style={{ color: "var(--cWhiteV1)" }}>
                  Unidad: {reserva?.dpto?.nro}
                </div> */}
                <div style={{ color: "var(--cWhiteV1)" }}>
                  Fecha: {reserva.date_at}
                  {reserva.start_time && ` - Hora: ${reserva.start_time}`}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
      <TitleSubtitle
        title="Motivo del mantenimiento"
        subtitle="Describa el motivo por el cual se realizará el mantenimiento."
      />
      <TextArea
        label="Motivo"
        name="reason"
        value={formState?.reason}
        onChange={handleChange}
        error={errors}
      />
    </DataModal>
  );
};

export default MaintenanceModal;
