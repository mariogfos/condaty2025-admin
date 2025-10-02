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
    A: { name: "Guardias y residentes" },
  };

  const handleDownload = async (e: React.MouseEvent<HTMLAnchorElement>) => {
    e.preventDefault();

    const url = getUrlImages(
      "/DOC-" +
        props?.item?.id +
        "." +
        (props?.item?.doc?.ext || props?.item?.ext) +
        "?d=" +
        props?.item?.updated_at
    );

    const fileName = `documento-${props?.item?.id}.${
      props?.item?.doc?.ext || props?.item?.ext
    }`;

    try {
      const response = await fetch(url);
      const blob = await response.blob();

      const blobUrl = window.URL.createObjectURL(blob);

      const link = document.createElement("a");
      link.href = blobUrl;
      link.download = fileName;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

      window.URL.revokeObjectURL(blobUrl);
    } catch (error) {
      console.error("Error al descargar el archivo:", error);
      window.location.href = url;
    }
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
          <div
            style={{
              backgroundColor: "var(--cWhiteV1)",
              padding: 12,
              borderRadius: "50%",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <IconPDF size={60} color={"var(--cBlack)"} viewBox="0 0 18 24" />
          </div>

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
          <a href="#" onClick={handleDownload} className={styles.viewButton}>
            <p>Ver documento</p>
          </a>
        </section>
      </Card>
    </DataModal>
  );
};

export default RenderView;
