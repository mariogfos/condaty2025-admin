import styles from "./RenderView.module.css";
import { getUrlImages } from "@/mk/utils/string";
import { getFullName } from "../../../mk/utils/string";
import DataModal from "@/mk/components/ui/DataModal/DataModal";
import { IconPDF } from "@/components/layout/icons/IconsBiblioteca";
import { Card } from "@/mk/components/ui/Card/Card";
import ContainerDetail from "@/components/Detail/ContainerDetail";
import LabelValueDetail from "@/components/Detail/LabelValueDetail";
import Br from "@/components/Detail/Br";

const RenderView = (props: {
  open: boolean;
  onClose: any;
  item: Record<string, any>;
  onConfirm?: Function;
  extraData?: any;
}) => {
  const DocDestiny: any = {
    O: { name: "Residentes" },
    G: { name: "Guardias" },
    A: { name: "Todos" },
  };

  return (
    <DataModal
      open={props.open}
      onClose={props?.onClose}
      title={"Detalle del documento"}
      buttonText=""
      buttonCancel=""
      className={styles.renderView}
    >
      <Card>
        <section>
          <IconPDF
            size={50}
            color={"var(--cBlack)"}
            style={{
              backgroundColor: "var(--cWhiteV1)",
              justifyContent: "center",
            }}
            viewBox="0 0 18 24"
            circle
          />
          <div>{props?.item?.name}</div>
        </section>
        <Br />

        <ContainerDetail>

          <LabelValueDetail
            value={getFullName(props?.item?.user)}
            label="Subido por"
          />
          <LabelValueDetail
            value={DocDestiny[props?.item?.for_to]?.name}
            label="Segmentación"
          />

          <LabelValueDetail value={props?.item?.descrip} label="Descripción" />
        </ContainerDetail>
        <Br />

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
      </Card>
    </DataModal>
  );
};

export default RenderView;
