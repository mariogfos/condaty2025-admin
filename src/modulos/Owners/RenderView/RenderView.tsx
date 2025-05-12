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
  const { open, onClose, item, reLoad, onConfirm, extraData } = props;
  const { user } = useAuth();
  const client = item?.clients?.find(
    (item: any) => item?.id === user?.client_id
  );
  const [openActive, setOpenActive] = useState(false);
  const [typeActive, setTypeActive] = useState("");

  const openModal = (t: any) => {
    setOpenActive(true);
    setTypeActive(t);
  };

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
      <DataModal
        open={open}
        onClose={onClose}
        title={"Detalle del residente"}
        buttonText=""
        buttonCancel=""
        style={{ width: "max-content" }}
        className={styles.renderView}
      >
        <div>
          <div>
            <Avatar
              src={getUrlImages(
                "/OWNER-" + item.id + ".webp?d=" + item.updated_at
              )}
              h={170}
              w={170}
              style={{ borderRadius: 16 }}
              name={getFullName(item)}
            />
            <div>
              <p className={styles.title}>{getFullName(item)}</p>
            </div>
          </div>
          <section>
            <div>
              <p>Cédula de identidad</p>
              <p>{item?.ci || "No disponible"}</p>
            </div>
            <div>
              <p>Correo electrónico</p>
              <p>{item?.email || "No disponible"}</p>
            </div>
            <div>
              <p>Número de Whatsapp</p>
              <p>
                {(item.prefix_phone ? "+" + item.prefix_phone : "") +
                  " " +
                  (item?.phone || "No disponible")}
              </p>
            </div>
            <div>
              <p>Estado</p>
              <p>
                {lStatusActive[client?.pivot?.status]?.name ||
                  item.status ||
                  "No disponible"}
              </p>
            </div>
            {item?.dpto?.[0]?.type.name && (
              <div>
                <p>Tipo de unidad</p>
                <p>{item?.dpto[0]?.type.name}</p>
              </div>
            )}
            <div>
              <p>Número de casa</p>
              <p>
                {item?.dpto?.length > 0
                  ? item?.dpto[0]?.nro
                  : item?.client_owner?.preunidad || "Sin número de casa"}
              </p>
            </div>
          </section>
        </div>
        {client?.pivot?.status === "W" && (
          <div>
            <Button onClick={() => openModal("X")} variant="secondary">
              Rechazar
            </Button>
            <Button onClick={() => openModal("A")}>Activar</Button>
          </div>
        )}
      </DataModal>

      {openActive && (
        <ActiveOwner
          open={openActive}
          onClose={() => setOpenActive(false)}
          typeActive={typeActive}
          data={item}
          onCloseOwner={() => onClose()}
          reLoad={() => reLoad && reLoad()}
        />
      )}
    </>
  );
};

export default RenderView;
