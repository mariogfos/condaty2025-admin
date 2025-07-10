import React, { useState } from "react";
import styles from "../../RenderView/RenderView.module.css";
import {
  IconArrowDown,
  IconArrowLeft,
  IconArrowRight,
  IconArrowUp,
  IconExpand,
} from "@/components/layout/icons/IconsBiblioteca";
import KeyValue from "@/mk/components/ui/KeyValue/KeyValue";
import { formatNumber } from "@/mk/utils/numbers";
import { getUrlImages } from "@/mk/utils/string";
import DataModal from "@/mk/components/ui/DataModal/DataModal";
const status: any = {
  A: "Activa",
  X: "Inactiva",
};

const FourPart = ({ item }: { item: any }) => {
  const [indexVisible, setIndexVisible] = useState(0);
  const [openDays, setOpenDays] = useState(false);
  const [openPolicy, setOpenPolicy] = useState(false);
  const [isExpanded, setIsExpanded] = useState(false);
  const toggleExpanded = () => setIsExpanded(!isExpanded);
  const allImages = React.useMemo(() => {
    let backendImages =
      item?.images?.map((img: any) => ({
        id: img?.id,
        type: "backend",
        src: getUrlImages(
          `/AREA-${item?.id}-${img?.id}.webp?${item?.updated_at}`
        ),
      })) || [];

    const localAvatars = Object.keys(item?.avatar || {})
      .filter((key) => {
        if (item?.avatar?.[key]?.file && item.avatar[key].file == "delete") {
          backendImages = backendImages.filter(
            (img: any) => img.id != item?.avatar?.[key]?.id
          );
        }
        return item?.avatar?.[key]?.file && item.avatar[key].file != "delete";
      })
      .map((key) => ({
        id: Number(item?.avatar?.[key]?.id),
        type: "local",
        src: `data:image/webp;base64,${item?.avatar?.[key]?.file}`,
      }));

    // const backendImages = _backendImages.filter((img) => img.id != item?.avatar?.[key]?.id)

    const data = [...backendImages, ...localAvatars];
    const r = Array.from(new Map(data.map((item) => [item.id, item])).values());

    // console.log(
    //   "backend",
    //   backendImages,
    //   "local",
    //   localAvatars,
    //   "item.images",
    //   item.images,
    //   "item.avatar",
    //   item.avatar,
    //   "data",
    //   data,
    //   "r",
    //   r
    // );

    // const data = [...localAvatars];

    return r;
  }, [item]);

  const totalImages = allImages.length;

  const nextIndex = () => {
    setIndexVisible((prevIndex) => (prevIndex + 1) % totalImages);
  };

  const prevIndex = () => {
    setIndexVisible((prevIndex) =>
      prevIndex === 0 ? totalImages - 1 : prevIndex - 1
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
  return (
    <>
      <div className={styles.renderView}>
        <div className={styles.containerFirstSection}>
          <div className={styles.containerImage}>
            <div className={styles.image}>
              {/* {item?.images?.[indexVisible]?.id && item.id && ( */}
              <img
                alt=""
                width="100%"
                height="auto"
                src={allImages?.[indexVisible]?.src}
              />
              {/* )} */}
            </div>
            {(item?.images?.length > 1 ||
              Object?.keys(item?.avatar || {}).length > 0) && (
              <div className={styles.containerButton}>
                <div className={styles.button} onClick={prevIndex}>
                  <IconArrowLeft size={18} color="var(--cWhite)" />
                </div>
                <p style={{ color: "var(--cWhite)", fontSize: 10 }}>
                  {indexVisible + 1} / {totalImages}
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
              className={isExpanded ? undefined : styles.truncatedText}
              style={{ color: "var(--cWhiteV1)" }}
            >
              {item?.description}
            </p>
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
      </div>
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

export default FourPart;
