import DataModal from "@/mk/components/ui/DataModal/DataModal";
import styles from "./RenderView.module.css";
import { getFullName, getUrlImages } from "@/mk/utils/string";
import { Avatar } from "@/mk/components/ui/Avatar/Avatar";
import { lStatusActive } from "@/mk/utils/utils";
import {
  getDateStrMes,
  getDateTimeStrMesShort,
  MONTHS_S,
} from "@/mk/utils/date";
import Button from "@/mk/components/forms/Button/Button";
import { useState } from "react";
import useAxios from "@/mk/hooks/useAxios";
import { getAlertLevelText } from "../Alerts";

const RenderView = (props: {
  open: boolean;
  onClose: any;
  item: Record<string, any>;
  onConfirm?: Function;
  extraData?: any;
  reLoad?: Function;
}) => {
  const { execute } = useAxios();
  const onSaveAttend = async () => {
    const { data } = await execute(
      "/attend",
      "POST",
      {
        id: props?.item?.id,
      },
      false,
      true
    );
    if (data?.success == true) {
      props?.onClose();
      props?.reLoad && props?.reLoad();
    }
  };

  const user =
    props?.item?.level == 4 ? props?.item?.owner : props?.item?.guardia;
  const prefix = props?.item?.level == 4 ? "/OWNER-" : "/GUARD-";
  return (
    <DataModal
      open={props.open}
      onClose={props?.onClose}
      title="Detalle de alerta"
      buttonText=""
      buttonCancel=""
      style={{ width: "883px" }}
    >
      <div className={styles.container}>
        <div className={styles.divider}></div>
        {/* Imagen de seguridad/guardia */}
        <div className={styles.avatarSection}>
          <Avatar
            src={getUrlImages(prefix + user?.id + ".webp?d=" + user.updated_at)}
            name={getFullName(user) || "Guardia"}
            w={100}
            h={100}
          />
        </div>

        {/* Descripción de la alerta */}
        <div className={styles.alertDescription}>
          {props?.item?.descrip ||
            "Se encontró un gatito perdido en medio del incendio."}
        </div>

        {/* Separador horizontal */}
        <div className={styles.divider}></div>

        {/* Contenedor para la información detallada */}
        <div className={styles.detailsContainer}>
          <div className={styles.detailRow}>
            <div className={styles.label}>Nivel de alerta</div>
            <div className={styles.valueHighlight}>
              {getAlertLevelText(props?.item?.level) || "Nivel medio"}
            </div>
          </div>

          <div className={styles.detailRow}>
            <div className={styles.label}>Fecha y hora de creación</div>
            <div className={styles.value}>
              {getDateTimeStrMesShort(props?.item?.created_at) ||
                "22 de marzo, 2025 - 09:12"}
            </div>
          </div>

          <div className={styles.detailRow}>
            <div className={styles.label}>Informador</div>
            <div className={styles.value}>
              {getFullName(user) || "Roberto Cossio LaMadrid"}
            </div>
          </div>
          {props?.item?.date_at && (
            <>
              <div className={styles.detailRow}>
                <div className={styles.label}>Fue atendido por</div>
                <div className={styles.value}>
                  {getFullName(
                    props?.item.gua_attend
                      ? props?.item.gua_attend
                      : props?.item.adm_attend
                  ) || "Roberto Cossio LaMadrid"}
                </div>
              </div>
              <div className={styles.detailRow}>
                <div className={styles.label}>Fecha de atención</div>
                <div className={styles.value}>
                  {getDateStrMes(props?.item?.date_at)}
                </div>
              </div>
            </>
          )}

          <div className={styles.detailRow}>
            <div className={styles.label}>C.I.</div>
            <div className={styles.value}>
              {props?.item?.guardia?.ci || "6473845"}
            </div>
          </div>
        </div>

        {/* Si hay acciones relacionadas con la alerta, se pueden agregar aquí */}
        {!props?.item?.date_at && props?.item?.level == 4 && (
          <Button
            onClick={() => {
              onSaveAttend();
            }}
          >
            Marcar como atendida
          </Button>
        )}
      </div>
    </DataModal>
  );
};

export default RenderView;
