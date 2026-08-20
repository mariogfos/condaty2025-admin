"use client";
import DataModal from "@/mk/components/ui/DataModal/DataModal";
import styles from "../Owners.module.css";
import { Avatar } from "@/mk/components/ui/Avatar/Avatar";
import { getFullName } from "../../../mk/utils/string";
import Button from "@/mk/components/forms/Button/Button";
import ActiveOwner from "@/components/ActiveOwner/ActiveOwner";
import { useEffect, useState } from "react";
import { useAuth } from "@/mk/contexts/AuthProvider";
import {
  ClientOwnerStatus,
  ClientOwnerType,
} from "@/modulos/Payments/Type/PaymentType";

const RenderView = (props: any) => {
  const { open, onClose, item: data, reLoad, execute, showToast } = props;
  const { user } = useAuth();
  const [item, setItem]: any = useState({});
  const [openActive, setOpenActive] = useState(false);
  const [typeActive, setTypeActive] = useState("");
  const [loading, setLoading] = useState(false);
  const [notFound, setNotFound] = useState(false);

  // B6: client calculado DENTRO del render — antes se calculaba antes del
  // setItem, por lo que en el primer frame `item = {}` → client undefined
  // y el botón Aprobar/Rechazar no aparecía.
  const client = item?.clients?.find(
    (c: any) => c?.id === user?.client_id,
  );

  const openModal = (t: any) => {
    setOpenActive(true);
    setTypeActive(t);
  };
  const getDataDetail = async () => {
    setLoading(true);
    setNotFound(false);
    const { data: dataDetail, error } = await execute(
      "/v3/owners",
      "GET",
      {
        fullType: "DET",
        searchBy: data?.id,
      },
      false,
      true,
    );
    if (dataDetail?.success) {
      const found = dataDetail?.data?.[0];
      if (found) {
        setItem(found);
      } else {
        setNotFound(true);
      }
    } else {
      showToast(error?.data?.message || error?.message, "error");
      setNotFound(true);
    }
    setLoading(false);
  };
  // B4: useEffect con [open, data?.id] en vez de [] — antes solo se
  // ejecutaba al mount del componente, no cuando se re-abría el modal
  // para otro owner en waiting.
  useEffect(() => {
    if (open && data?.id) {
      getDataDetail();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, data?.id]);

  // B5: la guarda original `if (!item)` con useState({}) era código
  // muerto ({} es truthy). Ahora discrimina entre "no encontrado" y
  // "cargando" (loading + !item?.id) abajo.
  if (notFound) {
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
          {loading || !item?.id ? (
            <p>Cargando...</p>
          ) : (
            <div className={styles.boxContent}>
              <div className={styles.avatarOwner}>
                <Avatar
                  src={item.url_avatar}
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

                {/*
                  🔴 2026-08-06: estos dos bloques leían `dpto`, la relación
                  del pivot `dpto_owners`. Andaba para los dependientes y
                  fallaba para los titulares sin fila en el pivot — 161
                  personas en la base local caían acá en el "CASO 2" y se
                  mostraban como si sólo tuvieran una unidad SOLICITADA,
                  teniendo una asignada. `unidades` trae los dos casos con la
                  misma regla que el reporte y el perfil.
                */}
                {item?.unidades?.[0]?.type?.name && (
                  <div className={styles.infoSection_details}>
                    <p>Tipo de unidad</p>
                    <p>{item?.unidades[0]?.type?.name}</p>
                  </div>
                )}

                {item?.unidades?.length > 0 ? (
                  // CASO 1: Si ya tiene una unidad asignada
                  <div className={styles.infoSection_details}>
                    <p>Número de Unidad</p>
                    <p>{item.unidades[0].nro}</p>
                  </div>
                ) : (
                  // CASO 2: Si solo tiene una unidad solicitada (preunidad)
                  <div className={styles.infoSection_details}>
                    <p>Unidad solicitada:</p>
                    <p>U: {client?.pivot?.preunidad || "No especificada"}</p>
                  </div>
                )}

                <div className={styles.infoSection_details}>
                  <p>Rol</p>
                  <p className={styles.statusActive}>
                    {client?.pivot?.type === ClientOwnerType.HOMEOWNER
                      ? "Propietario"
                      : "Inquilino"}
                  </p>
                </div>
              </section>
            </div>
          )}

          {client?.pivot?.status === ClientOwnerStatus.WAITING && (
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
