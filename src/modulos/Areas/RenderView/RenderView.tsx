import { Card } from "@/mk/components/ui/Card/Card";
import KeyValue from "@/mk/components/ui/KeyValue/KeyValue";
import { getUrlImages } from "@/mk/utils/string";
import React, { useEffect, useRef, useState } from "react";
import { formatNumber } from "../../../mk/utils/numbers";
import {
  IconArrowDown,
  IconArrowLeft,
  IconArrowRight,
  IconArrowUp,
  IconExpand,
} from "@/components/layout/icons/IconsBiblioteca";
import DataModal from "@/mk/components/ui/DataModal/DataModal";
import styles from "./RenderView.module.css";
import Button from "@/mk/components/forms/Button/Button";
import useAxios from "@/mk/hooks/useAxios";
import { useAuth } from "@/mk/contexts/AuthProvider";

const status: any = {
  A: "Activa",
  X: "Inactiva",
};

const RenderView = ({ open, item, onClose, reLoad }: any) => {
  const [indexVisible, setIndexVisible] = useState(0);
  const [openDays, setOpenDays] = useState(false);
  const [openPolicy, setOpenPolicy] = useState(false);
  const [isExpanded, setIsExpanded] = useState(false);
  const [openConfirm, setOpenConfirm] = useState(false);
  const { execute } = useAxios();
  const { showToast } = useAuth();
  const descriptionRef = useRef(null);
  const [isTruncated, setIsTruncated] = useState(false);

  useEffect(() => {
    const el: any = descriptionRef.current;
    if (el) {
      const isOverflowing = el.scrollHeight > el.offsetHeight;
      setIsTruncated(isOverflowing);
    }
  }, [item?.description]);

  const toggleExpanded = () => setIsExpanded(!isExpanded);

  const nextIndex = () => {
    setIndexVisible((prevIndex) => (prevIndex + 1) % item?.images?.length);
  };
  const prevIndex = () => {
    setIndexVisible((prevIndex) =>
      prevIndex === 0 ? item?.images?.length - 1 : prevIndex - 1
    );
  };
  const Br = () => {
    return (
      <div
        style={{
          height: 0.5,
          backgroundColor: "var(--cWhiteV1)",
          margin: "16px 0px",
        }}
      />
    );
  };
  const sortedDays = () => {
    const dayOrder: any = {
      Lunes: 0,
      Martes: 1,
      Miércoles: 2,
      Jueves: 3,
      Viernes: 4,
      Sábado: 5,
      Domingo: 6,
    };

    return Object.keys(item?.available_hours || {}).sort(
      (a, b) => dayOrder[a] - dayOrder[b]
    );
  };
  const onSaveStatus = async (status: string) => {
    const { data } = await execute("/status-area", "POST", {
      status: status,
      area_id: item?.id,
    });
    if (data?.status == true) {
      onClose();
      reLoad();
      showToast(data.msg, "success");
      setOpenConfirm(false);
    } else {
      showToast(data.msg, "error");
    }
  };

  return (
    <>
      <DataModal
        title="Detalle del área social"
        open={open}
        onClose={onClose}
        buttonText=""
        buttonCancel=""
        className={styles.renderView}
      >
        <Card>
          <div className={styles.containerFirstSection}>
            <div className={styles.containerImage}>
              <div className={styles.image}>
                {item?.images?.[indexVisible]?.id && (
                  <img
                    alt=""
                    width={"100%"}
                    height={"auto"}
                    src={getUrlImages(
                      "/AREA-" +
                        item?.id +
                        "-" +
                        item?.images?.[indexVisible]?.id +
                        ".webp" +
                        "?" +
                        item?.updated_at
                    )}
                  />
                )}
              </div>
              {item?.images?.length > 1 && (
                <div className={styles.containerButton}>
                  <div className={styles.button} onClick={prevIndex}>
                    <IconArrowLeft size={18} color="var(--cWhite)" />
                  </div>
                  <p style={{ color: "var(--cWhite)", fontSize: 10 }}>
                    {indexVisible + 1} / {item?.images?.length}
                  </p>
                  <div className={styles.button} onClick={nextIndex}>
                    <IconArrowRight size={18} color="var(--cWhite)" />
                  </div>
                </div>
              )}
            </div>
            <div className={styles.containerInfo}>
              <p className={styles.title}>{item?.title}</p>
              <p
                ref={descriptionRef}
                className={isExpanded ? undefined : styles.truncatedText}
              >
                {item?.description}
              </p>
              {isTruncated && (
                <p
                  style={{
                    color: "var(--cAccent)",
                    cursor: "pointer",
                    width: 100,
                    fontWeight: 600,
                  }}
                  onClick={toggleExpanded}
                >
                  {isExpanded ? "Ver menos" : "Ver más"}
                </p>
              )}
              <Br />
              <p className={styles.title}>Datos generales</p>
              <KeyValue
                title={"Estado"}
                value={status[item?.status]}
                colorValue={
                  item?.status == "A" ? "var(--cSuccess)" : "var(--cError)"
                }
              />
              <KeyValue
                title={"Tipo de reserva"}
                value={item?.booking_mode === "hour" ? "Por hora" : "Por día"}
              />

              <KeyValue
                title={"Costo"}
                value={"Bs. " + formatNumber(item?.price)}
              />
              <KeyValue
                title={"Cantidad máx. de personas"}
                value={item?.max_capacity}
              />
              <KeyValue
                title={"Restricción por mora"}
                value={item?.penalty_or_debt_restriction == "A" ? "Sí" : "No"}
              />
              <KeyValue
                title={"Aprobación de administración"}
                value={item?.requires_approval == "A" ? "Sí" : "No"}
              />
              {item?.booking_mode === "hour" && (
                <KeyValue
                  title={"Reservación por día"}
                  value={item?.max_reservations_per_day}
                />
              )}
              <KeyValue
                title={"Reservación por semana"}
                value={item?.max_reservations_per_week}
              />
              {item?.price > 0 && (
                <KeyValue
                  title={"Cancelación sin multa"}
                  value={item?.min_cancel_hours + "h"}
                />
              )}
              <KeyValue
                title={"Porcentaje por cancelación"}
                value={formatNumber(item?.penalty_fee, 1) + "%"}
              />
            </div>
          </div>
          <Br />
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              color: "var(--cWhite)",
              alignItems: "center",
            }}
          >
            <p className={styles.title}>Políticas</p>
            <IconExpand onClick={() => setOpenPolicy(!openPolicy)} />
          </div>
          <Br />
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              color: "var(--cWhite)",
            }}
          >
            <p className={styles.title}>Días y periodos disponibles</p>
            {!openDays ? (
              <IconArrowDown onClick={() => setOpenDays(!openDays)} />
            ) : (
              <IconArrowUp onClick={() => setOpenDays(!openDays)} />
            )}
          </div>
          {openDays && (
            <div
              style={{
                display: "flex",
                flexDirection: "row",
                overflowX: "scroll",
                scrollbarColor: "var(--cWhiteV2) var(--cBlackV2)",
                gap: 12,
                marginTop: 12,
              }}
            >
              {sortedDays().map((day) => (
                <div
                  key={day}
                  style={{
                    backgroundColor: "var(--cWhiteV2)",
                    padding: 12,
                    borderRadius: 8,
                    border: "0.5px solid var(--cWhiteV1)",
                    maxWidth: 210,
                    minWidth: 210,
                  }}
                >
                  <p
                    style={{
                      color: "var(--cWhite)",
                      fontSize: 14,
                      fontWeight: 500,
                    }}
                  >
                    {day}
                  </p>
                  <p style={{ fontSize: 12, marginBottom: 8 }}>
                    Horario disponible
                  </p>
                  <div
                    style={{
                      display: "flex",
                      gap: 8,
                      overflowX: "auto",
                      width: "100%",
                      scrollbarWidth: "thin",
                      scrollbarColor: "var(--cBlackV2) var(--cWhiteV2) ",
                    }}
                  >
                    {item?.available_hours?.[day]?.map((hour: any) => (
                      <div
                        key={hour}
                        style={{
                          padding: 8,
                          borderRadius: 8,
                          border: "0.5px solid var(--cWhiteV1)",
                          flex: "0 0 auto",
                        }}
                      >
                        <p style={{ fontSize: 12 }}>{hour}</p>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}
        </Card>
        <Button
          variant="secondary"
          onClick={() =>
            item?.status == "A" ? setOpenConfirm(true) : onSaveStatus("A")
          }
          style={{
            width: 150,
            margin: "0 0 0 auto",
            marginTop: 12,
            gap: 10,
            color: "var(--cWhite)",
          }}
        >
          {item?.status == "A" ? "Desactivar área" : "Activar área"}
        </Button>

        {openConfirm && (
          <DataModal
            title="Desactivar área social"
            open={openConfirm}
            onClose={() => setOpenConfirm(false)}
            buttonText="Desactivar"
            buttonCancel="Cancelar"
            onSave={async () => {
              onSaveStatus("X");
            }}
          >
            <p>
              ¿Seguro que quieres desactivarla? Recuerda que, si realizas esta
              acción, los residentes no podrán reservar esta área social.
            </p>
          </DataModal>
        )}
      </DataModal>
      {openPolicy && (
        <DataModal
          title="Políticas"
          open={openPolicy}
          onClose={() => setOpenPolicy(false)}
          buttonText=""
          buttonCancel=""
          className={styles.policyContainer}
        >
          <p className={styles.title}>Políticas de uso</p>
          <p className={styles.subtitle}>{item?.usage_rules}</p>
          <Br />
          <p className={styles.title}>Políticas de reembolso</p>
          <p className={styles.subtitle}>{item?.cancellation_policy}</p>
        </DataModal>
      )}
    </>
  );
};

export default RenderView;
