
import styles from "./RenderView.module.css";
import { getUrlImages } from "@/mk/utils/string";
import { Avatar } from "@/mk/components/ui/Avatar/Avatar";
import { getFullName } from "../../../mk/utils/string";
import DataModal from "@/mk/components/ui/DataModal/DataModal";
import { IconPDF } from "@/components/layout/icons/IconsBiblioteca";

const RenderView = (props: {
  open: boolean;
  onClose: any;
  item: Record<string, any>;
  onConfirm?: Function;
  extraData?: any;
}) => {
  console.log(props,'propsassasas')
  const DocDestiny: any = {
    O:{  name: "Residentes" },
    G:{  name: "Guardias" },
    A:{  name: "Todos" },
  };


  return (
    <DataModal
      open={props.open}
      onClose={props?.onClose}
      title={"Detalle del documento"}
      buttonText=""
      buttonCancel=""
    //   style={{width:'max-content'}}
      className={styles.renderView}
    >
      <div  >
       <section>
        <IconPDF size={50} color={'var(--cBlack)'} style={{backgroundColor:'var(--cWhiteV1)',justifyContent:'center'}} viewBox="0 0 18 24" circle/>
        <div>{props?.item?.name}</div>
       </section>
       <div className="bottomLine"></div>

       <section>
        <div>
                <div className={styles.textsDiv}>
                    <div>Creado por</div>
                    <div>{}a</div>
                </div>
                <div className={styles.textsDiv}>
                    <div>Segmentación</div>
                    <div className='truncatedText' >{DocDestiny[props?.item?.for_to]?.name}</div> 
                </div>
         </div>
         <div>
                {/* <div className={styles.textsDiv}>
                    <div>aa</div>
                    <div>ee</div>
                </div> */}

                <div className={styles.textsDiv}>
                    <div>Descripción</div>
                    <div>{props?.item?.descrip}</div>
                </div>
         </div>  
       </section>
       <div className="bottomLine"></div>

       <section>
       <a
              target="_blank"
              href={getUrlImages(
                "/DOC-" +
                  props?.item?.id +
                  "." +
                  (props?.item?.doc?.ext || props?.item?.ext) +
                  "?d=" +
                  props?.item?.updated_at
              )}
              rel="noopener noreferrer"
              className={styles.viewButton}
            >
              <p>Ver documento</p>
            </a>
       </section>
      </div>
    </DataModal>
  );
};

export default RenderView;
