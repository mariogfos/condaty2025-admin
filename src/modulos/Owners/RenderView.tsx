'use client'
import DataModal from "@/mk/components/ui/DataModal/DataModal";
import styles from "./Owners.module.css";
import { getUrlImages } from "@/mk/utils/string";
import { Avatar } from "@/mk/components/ui/Avatar/Avatar";
import { getFullName } from "../../mk/utils/string";
import { lStatusActive } from "@/mk/utils/utils";
import Button from "@/mk/components/forms/Button/Button";
import ActiveOwner from "@/components/ActiveOwner/ActiveOwner";
import { useEffect, useState } from "react";

const RenderView = (props: {
  open: boolean;
  onClose: any;
  item: any;
  onConfirm?: Function;
  extraData?: any;

}) => {
const [openActive,setOpenActive] = useState(false);
const [typeActive,setTypeActive] = useState('');


// console.log(props.item.status,lStatusActive[props.item.status]?.name,'status owner rendervw')
useEffect(()=>{
  console.log(props?.item,'openactive a')
  
},[openActive])

const openModal = (t:string) => {
  setOpenActive(true);
  setTypeActive(t)
}
  return (
    <>    
    <DataModal
      open={props.open}
      onClose={props?.onClose}
      title={"Detalle del residente"}
      buttonText=""
      buttonCancel=""
      style={{width:'max-content'}}
      className={styles.renderView}
    >
      <div >
        <div>
          <Avatar
            src={getUrlImages(
              "/OWNER-" + props.item.id + ".webp?d=" + props.item.updated_at
            )}
            h={170}
            w={170}
            style={{borderRadius:16}}
            name={getFullName(props.item)}
          />
          <div>
            <p className={styles.title}>{getFullName(props.item)}</p>
          </div>
        </div>
        <section>

          <div>
            <p>Cédula de identidad</p>
            <p>{props.item?.ci}</p>
          </div>
          <div>
            <p>Correo electrónico</p>
            <p>{props.item?.email}</p>
          </div>
          {/* <div>
            <p>Rol</p>
            <p>{ props.item?.role_id}</p>
          </div> */}
          <div>
            <p>Número de Whatsapp</p>
            <p>
              {(props.item.prefix_phone ? "+" + props.item.prefix_phone : "") +
                " " +
                props.item?.phone}
            </p>
          </div>
          <div>
            <p>Estado</p>
            <p>
              {lStatusActive[props.item.status]?.name}
            </p>
          </div>
          <div>
            <p>Número de casa</p>
            <p>
              {props?.item?.dpto?.length > 0 ?
              props?.item?.dpto[0]?.nro  : 
              props?.item?.client_owner?.preunidad||  'Sin número de casa'}
            </p>
          </div>
        </section>
      </div>
     {props?.item?.status === 'R' && <div>
        <Button onClick={()=>openModal('R')} variant='secondary'>Rechazar</Button>
        <Button onClick={()=>openModal('S')}>Activar</Button>

      </div>}
    </DataModal>
     

     {openActive && 
     <ActiveOwner 
     open={openActive}
     onClose={()=>setOpenActive(false)}
     typeActive={typeActive}
     data={props.item }
     onCloseOwner={()=>props.onClose()}
    
     />
     }
    </>

  );
};

export default RenderView;
