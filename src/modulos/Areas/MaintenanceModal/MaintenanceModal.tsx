import Input from "@/mk/components/forms/Input/Input";
import Select from "@/mk/components/forms/Select/Select";
import DataModal from "@/mk/components/ui/DataModal/DataModal";
import useAxios from "@/mk/hooks/useAxios";
import React, { useEffect, useState } from "react";
import TitleSubtitle from "./TitleSubtitle";
import { getFullName, getUrlImages } from "@/mk/utils/string";
import TextArea from "@/mk/components/forms/TextArea/TextArea";
import { checkRules, hasErrors } from "@/mk/utils/validate/Rules";
import TabsButtons from "@/mk/components/ui/TabsButton/TabsButtons";
import { getDateStrMes } from "../../../mk/utils/date1";
import { Avatar } from "@/mk/components/ui/Avatar/Avatar";
import { IconX } from "@/components/layout/icons/IconsBiblioteca";
import { useAuth } from "@/mk/contexts/AuthProvider";

interface Props {
  open: boolean;
  onClose: () => void;
  areas: any;
}

const MaintenanceModal = ({ open, onClose, areas }: Props) => {
  const [tab, setTab] = useState("P");
  const [formState, setFormState]: any = useState({});
  const [dataM, setDataM] = useState([]);
  const { execute } = useAxios();
  const [errors, setErrors] = useState({});
  const [reservas, setReservas] = useState([]);
  const [openConfirm, setOpenConfirm] = useState({ open: false, id: null });
  const { showToast } = useAuth();

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
    if (
      formState.date_at &&
      formState.date_end &&
      formState.date_at <= formState.date_end
    ) {
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
      rules: ["required", "greaterDate"],
      key: "date_at",
      errors,
    });
    errors = checkRules({
      value: formState?.date_end,
      rules: ["required", "greaterDateTime:date_at,1"],
      key: "date_end",
      errors,
      data: formState,
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
      showToast("Mantenimiento creado con éxito", "success");
    }
  };

  const getAreasM = async () => {
    const { data } = await execute("/reservations", "GET", {
      fullType: "L",
      filterBy: "status:M",
      perPage: -1,
      page: 1,
    });
    if (data?.success == true) {
      setDataM(data?.data);
    }
  };
  useEffect(() => {
    setDataM([]);
    if (tab == "A") {
      getAreasM();
    }
  }, [tab]);

  const handleCancelMaintenance = async (id: any) => {
    const { data } = await execute("/reservations/" + id, "DELETE", {
      is_canceled: "Y",
    });
    if (data?.success == true) {
      getAreasM();
      showToast("Mantenimiento cancelado con éxito", "success");
      setOpenConfirm({ open: false, id: null });
    }
  };

  return (
    <DataModal
      title="Mantenimiento"
      open={open}
      onClose={_onClose}
      onSave={onSave}
    >
      <TabsButtons
        tabs={[
          {
            value: "P",
            text: "Poner en mantenimiento",
          },
          {
            value: "A",
            text: "Areas en mantenimiento",
          },
        ]}
        sel={tab}
        setSel={setTab}
      />
      {tab == "P" && (
        <>
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

          {reservas?.length > 0 && (
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
        </>
      )}
      {tab == "A" && (
        <>
          <TitleSubtitle
            title="Áreas en mantenimiento"
            subtitle="Las siguientes áreas están en mantenimiento."
          />
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fill, minmax(300px, 1fr))",
              gap: "16px",
              marginTop: "16px",
              maxHeight: "calc(100vh - 300px)",
              overflowY: "auto",
              padding: "4px",
            }}
          >
            {dataM.map((reserva: any) => (
              <div
                key={reserva.id}
                style={{
                  padding: "20px",
                  borderRadius: "12px",
                  backgroundColor: "var(--cBlackV1)",
                  display: "flex",
                  flexDirection: "column",
                  gap: "12px",
                  minWidth: "400px",
                  position: "relative",
                }}
              >
                <IconX
                  onClick={() => setOpenConfirm({ open: true, id: reserva.id })}
                  style={{
                    position: "absolute",
                    top: "12px",
                    right: "12px",
                    cursor: "pointer",
                  }}
                />

                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: "12px",
                  }}
                >
                  <Avatar
                    src={getUrlImages(
                      "/AREA-" +
                        reserva?.area?.id +
                        "-" +
                        reserva?.area?.images?.[0]?.id +
                        ".webp" +
                        "?" +
                        reserva?.area?.updated_at
                    )}
                  />

                  <div
                    style={{
                      fontWeight: "bold",
                      color: "var(--cWhite)",
                      fontSize: "16px",
                      marginBottom: "4px",
                    }}
                  >
                    {reserva.area?.title || "Área sin nombre"}
                  </div>
                </div>

                <div
                  style={{
                    display: "flex",
                    flexDirection: "column",
                    gap: "8px",
                    backgroundColor: "var(--cBlackV2)",
                    padding: "12px",
                    borderRadius: "8px",
                  }}
                >
                  <div style={{ color: "var(--cWhiteV1)" }}>
                    <span style={{ color: "var(--cWhite)" }}>
                      Fecha de inicio:
                    </span>{" "}
                    {getDateStrMes(reserva.date_at) + " "}
                    {reserva.start_time}
                  </div>
                  {reserva.date_end && (
                    <div style={{ color: "var(--cWhiteV1)" }}>
                      <span style={{ color: "var(--cWhite)" }}>
                        Fecha de fin:
                      </span>{" "}
                      {getDateStrMes(reserva.date_end) + " "}
                      {reserva.end_time}
                    </div>
                  )}
                  <div style={{ color: "var(--cWhiteV1)" }}>
                    <span style={{ color: "var(--cWhite)" }}>Motivo:</span>{" "}
                    {reserva.reason || "No especificado"}
                  </div>
                </div>
              </div>
            ))}
            {dataM.length === 0 && (
              <div
                style={{
                  textAlign: "center",
                  padding: "40px",
                  color: "var(--cWhiteV1)",
                  gridColumn: "1/-1",
                }}
              >
                No hay áreas en mantenimiento actualmente
              </div>
            )}
          </div>
        </>
      )}
      {openConfirm.open && (
        <DataModal
          title="Cancelar mantenimiento"
          open={openConfirm.open}
          onClose={() => setOpenConfirm({ open: false, id: null })}
          onSave={() => handleCancelMaintenance(openConfirm.id)}
        >
          <div
            style={{
              padding: "20px",
              color: "var(--cWhite)",
              textAlign: "center",
            }}
          >
            <p>
              ¿Está seguro que desea cancelar el mantenimiento de esta área?
            </p>
            <p
              style={{
                marginTop: "10px",
                color: "var(--cWhiteV1)",
                fontSize: "14px",
              }}
            >
              Esta acción no se puede deshacer.
            </p>
          </div>
        </DataModal>
      )}
    </DataModal>
  );
};

export default MaintenanceModal;
