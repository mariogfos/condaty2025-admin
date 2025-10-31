"use client";
import DataModal from "@/mk/components/ui/DataModal/DataModal";
import styles from "../Owners.module.css";
import { getUrlImages } from "@/mk/utils/string";
import { Avatar } from "@/mk/components/ui/Avatar/Avatar";
import { getFullName } from "../../../mk/utils/string";
import { lStatusActive } from "@/mk/utils/utils";
import Button from "@/mk/components/forms/Button/Button";
import ActiveOwner from "@/components/ActiveOwner/ActiveOwner";
import { useEffect, useState } from "react";
import { useAuth } from "@/mk/contexts/AuthProvider";

const RenderView = (props: any) => {
  const {
    open,
    onClose,
    item: data,
    reLoad,
    onConfirm,
    extraData,
    execute,
    showToast,
  } = props;
  const { user } = useAuth();
  const [item, setItem]: any = useState({});
  const client = item?.clients?.find(
    (item: any) => item?.id === user?.client_id
  );
  const [openActive, setOpenActive] = useState(false);
  const [typeActive, setTypeActive] = useState("");
  const [loading, setLoading] = useState(false);

  const openModal = (t: any) => {
    setOpenActive(true);
    setTypeActive(t);
  };
  const getDataDetail = async () => {
    setLoading(true);
    const { data: dataDetail, error } = await execute(
      "/owners",
      "GET",
      {
        fullType: "DET",
        searchBy: data?.id,
      },
      false,
      true
    );
    if (dataDetail?.success === true) {
      setItem(dataDetail?.data[0]);
    } else {
      showToast(error?.data?.message || error?.message, "error");
    }
    setLoading(false);
  };
  useEffect(() => {
    if (open) {
      getDataDetail();
    }
  }, []);
  if (!item) {
    return (
      <DataModal
        open={open}
        onClose={onClose}
        title={"Detalle del residente"}
        buttonText=""
        buttonCancel=""
        style={{ width: "max-content" }}
        className={styles.renderView}
      >
        <div className="flex justify-center items-center h-40">
          <span>No se encontró información del residente</span>
        </div>
      </DataModal>
    );
  }

  return (
    <>
      {open && (
        <DataModal
          open={open}
          onClose={onClose}
          title={"Detalle de la solicitud"}
          buttonText=""
          buttonCancel=""
          style={{ width: "max-content" }}
          className={styles.renderView}
        >
          {loading ? (
            <p>Cargando...</p>
          ) : (
            <div className={styles.boxContent}>
              <div className={styles.avatarOwner}>
                <Avatar
                  hasImage={item?.has_image}
                  src={getUrlImages(
                    "/OWNER-" + item.id + ".webp?d=" + item.updated_at
                  )}
                  h={191}
                  w={191}
                  style={{ borderRadius: "50%" }}
                  name={getFullName(item)}
                />
                <p className={styles.ownerName}>{getFullName(item, "NSLM")}</p>
              </div>
              <section className={styles.infoSection}>
                <div className={styles.infoSection_details}>
                  <p>Carnet de identidad</p>
                  <p>{item?.ci || "No disponible"}</p>
                </div>
                {/*  <div className={styles.infoSection_details}>
                <p>Tipo de residente</p>
                <p>{item?.ci || "No disponible"}</p>
              </div> */}
                <div className={styles.infoSection_details}>
                  <p>Correo electrónico</p>
                  <p>{item?.email || "No disponible"}</p>
                </div>
                <div className={styles.infoSection_details}>
                  <p>Celular</p>
                  <p>
                    {(item.prefix_phone ? "+" + item.prefix_phone : "") +
                      " " +
                      (item?.phone || "No disponible")}
                  </p>
                </div>
                <div className={styles.infoSection_details}>
                  <p>Estado</p>
                  <p className={styles.statusActive}>
                    {lStatusActive[client?.pivot?.status]?.name ||
                      item.status ||
                      "No disponible"}
                  </p>
                </div>
                {item?.dpto?.[0]?.type.name && (
                  <div className={styles.infoSection_details}>
                    <p>Tipo de unidad</p>
                    <p>{item?.dpto[0]?.type.name}</p>
                  </div>
                )}
                <>
                  {item?.dpto?.length > 0 ? (
                    // CASO 1: Si ya tiene una unidad asignada
                    <div className={styles.infoSection_details}>
                      <p>Número de Unidad</p>
                      <p>{item.dpto[0].nro}</p>
                    </div>
                  ) : (
                    // CASO 2: Si solo tiene una unidad solicitada (preunidad)
                    <div className={styles.infoSection_details}>
                      <p>
                        Unidad solicitada como:{" "}
                        {client?.pivot?.type == "H"
                          ? "Propietario"
                          : "Residente"}
                      </p>
                      <p>U: {client?.pivot?.preunidad || "No especificada"}</p>
                    </div>
                  )}
                </>
              </section>
            </div>
          )}

          {client?.pivot?.status === "W" && (
            <div className={styles.boxButtons}>
              <Button
                onClick={() => openModal("X")}
                className={styles.btnSecondary}
                variant="secondary"
              >
                Rechazar Solicitud
              </Button>
              <Button onClick={() => openModal("A")}>Aprobar Solicitud</Button>
            </div>
          )}
        </DataModal>
      )}
      {openActive && (
        <ActiveOwner
          open={openActive}
          onClose={() => setOpenActive(false)}
          typeActive={typeActive}
          data={{ ...item, type_owner: data?.type_owner }}
          onCloseOwner={() => onClose()}
          reLoad={() => reLoad && reLoad()}
        />
      )}
    </>
  );
};

export default RenderView;
