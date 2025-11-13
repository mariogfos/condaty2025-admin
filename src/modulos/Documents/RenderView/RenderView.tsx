import styles from "./RenderView.module.css";
import { useState } from "react";
import { getUrlImages } from "@/mk/utils/string";
import { getFullName } from "../../../mk/utils/string";
import DataModal from "@/mk/components/ui/DataModal/DataModal";
import { IconPDF, IconJPG, IconDOC } from "@/components/layout/icons/IconsBiblioteca";
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

  const [downloading, setDownloading] = useState(false);

  const handleDownload = async (e: React.MouseEvent<HTMLButtonElement>) => {
    e.preventDefault();
    if (downloading) return;
    setDownloading(true);

    const url = getUrlImages(
      "/DOC-" +
      props?.item?.id +
      "." +
      (props?.item?.doc?.ext || props?.item?.ext) +
      "?d=" +
      props?.item?.updated_at
    );

    const fileName = `documento-${props?.item?.id}.${props?.item?.doc?.ext || props?.item?.ext
      }`;

    try {
      const response = await fetch(url);
      const blob = await response.blob();

      const blobUrl = globalThis.URL.createObjectURL(blob);

      const link = document.createElement("a");
      link.href = blobUrl;
      link.download = fileName;
      document.body.appendChild(link);
      link.click();
      link.remove();

      globalThis.URL.revokeObjectURL(blobUrl);
    } catch (error) {
      console.error("Error al descargar el archivo:", error);
      globalThis.location.href = url;
    } finally {
      setDownloading(false);
    }
  };

  const iconNameExtension = props?.item?.ext;

  return (
    <DataModal
      open={props.open}
      onClose={props?.onClose}
      title={"Detalle del documento"}
      buttonText=""
      buttonCancel=""
      className={styles.renderView}
      variant={'mini'}
    >
      <Card>
        <section>
          <div className={styles.iconCircle}>

            {(() => {
              switch (iconNameExtension?.toLowerCase()) {
                case "pdf":
                  return <IconPDF color={"var(--cBlack)"} viewBox="0 0 18 24" />;
                case "doc":
                case "docx":
                case "xls":
                case "xlsx":
                  return <IconDOC color={"var(--cBlack)"} />;
                case "webp":
                  return <IconJPG color={"var(--cBlack)"} viewBox="0 0 18 24" />;
                default:
                  return <IconDOC color={"var(--cBlack)"} />;
              }
            })()}

          </div>

          <div>{props?.item?.name}</div>
        </section>
        <Br />

        <ContainerDetail>

          <LabelValueDetail value={getFullName(props?.item?.user)} label="Subido por" />

          <LabelValueDetail value={DocDestiny[props?.item?.for_to]?.name} label="Segmentación" />

          <LabelValueDetail value={props?.item?.descrip} label="Descripción" />

        </ContainerDetail>
        <Br />

        <section>
          <button
            type="button"
            onClick={handleDownload}
            className={styles.viewButton}
            aria-disabled={downloading}
            disabled={downloading}
          >
            <p>{downloading ? "Descargando..." : "Ver documento"}</p>
          </button>
        </section>
      </Card>
    </DataModal>
  );
};

export default RenderView;
