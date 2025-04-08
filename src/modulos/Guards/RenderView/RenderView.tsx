import DataModal from "@/mk/components/ui/DataModal/DataModal";
import styles from "../Guards.module.css";
import { getUrlImages } from "@/mk/utils/string";
import { Avatar } from "@/mk/components/ui/Avatar/Avatar";
import { getFullName } from "../../../mk/utils/string";

const RenderView = (props: {
  open: boolean;
  onClose: any;
  item: Record<string, any>;
  onConfirm?: Function;
  extraData?: any;
}) => {




  return (
    <DataModal
      open={props.open}
      onClose={props?.onClose}
      title={"Detalle del Guardia"}
      buttonText=""
      buttonCancel=""
      style={{width:'max-content'}}
      className={styles.renderView}
    >
      <div >
        <div>
          <Avatar
            src={getUrlImages(
              "/GUARD-" + props.item.id + ".webp?d=" + props.item.updated_at
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
            <p>Email</p>
            <p>
              {props.item.email}
            </p>
          </div>
          <div>
            <p>Domicilio</p>
            <p>
              {props.item.address}
            </p>
          </div>
        </section>
      </div>
    </DataModal>
  );
};

export default RenderView;
