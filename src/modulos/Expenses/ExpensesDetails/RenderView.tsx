import DataModal from "@/mk/components/ui/DataModal/DataModal";
import styles from "./ExpensesDetailsView.module.css";
import { getFullName, getUrlImages } from "@/mk/utils/string";
import { Avatar } from "@/mk/components/ui/Avatar/Avatar";
import { lStatusActive } from "@/mk/utils/utils";
import { getDateStrMes, MONTHS_S } from "@/mk/utils/date";
import Button from "@/mk/components/forms/Button/Button";
import { useState } from "react";

const RenderView = (props: {
  open: boolean;
  onClose: any;
  item: Record<string, any>;
  onConfirm?: Function;
  extraData?: any;
}) => {
const [payDetails, setPayDetails] = useState(false);

// console.log(props?.item,'item desde renderperiodo')
const getStatus = (status:any) => {
    let _status;
    if (status == "A") _status = "Por cobrar";
    if (status == "E") _status = "En espera";
    if (status == "P") _status = "Cobrado";
    if (status == "S") _status = "Por confirmar";
    if (status == "M") _status = "Moroso";
    if (status == "R") _status = "Rechazado";
    return _status;
  };

  return (
    <DataModal
      open={props.open}
      onClose={props?.onClose}
      title={"Detalle del periodo"}
      buttonText=""
      buttonCancel=""
      style={{width:'max-content'}}
      className={styles.renderView}
    >
      <div >
    
        <section>

          <div>
            <p>Periodo</p>
            <p>{MONTHS_S[props?.item?.debt?.month] + "/" + props?.item?.debt?.year}</p>
          </div>
          <div>
            <p>Fecha de plazo</p>
            <p>{getDateStrMes(props?.item?.debt?.due_at)}</p>
          </div>
          <div>
            <p>Unidad</p>
            <p>{ props?.item?.dpto?.nro}</p>
          </div> 
          <div>
            <p>Ubicación</p>
            <p>
              {props?.item?.dpto?.description}
            </p>
          </div>
          <div>
            <p>Estado</p>
            <p>
              {getFullName(props?.item?.dpto?.owners[0])}
            </p>
          </div>
          <div>
            <p>Estado</p>
            <p>
            {getStatus(props?.item?.status)}
            </p>
          </div>
          <div>
            <p>Monto de pago</p>
            <p>
            Bs {props?.item?.amount}
            </p>
          </div>
          <div>
            <p>Fecha de pago</p>
            <p>
            {getDateStrMes(props?.item?.paid_at) || 'Sin fecha'}
            </p>
          </div>
          {/* {props?.item?.status == "P" && (
            <Button
              className="btn btn-primary"
              onClick={() => {
                setPayDetails(true);
                onClose();
              }}
            >
              Ver detalles de pago
            </Button>
          )} */}
        </section>
      </div>
    </DataModal>
  );
};

export default RenderView;
