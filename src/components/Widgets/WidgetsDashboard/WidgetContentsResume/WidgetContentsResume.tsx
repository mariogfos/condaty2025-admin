import React from "react";
import WidgetBase from "../../WidgetBase/WidgetBase";
import styles from "./WidgetContentsResume.module.css";
import { Avatar } from "@/mk/components/ui/Avatar/Avatar";
import { getFullName, getUrlImages } from "@/mk/utils/string";
import { getDateTimeAgo } from "@/mk/utils/date";
import EmptyData from "@/components/NoData/EmptyData";

import {
  IconComment,
  IconLike,
  IconPublicacion,
} from "@/components/layout/icons/IconsBiblioteca";

const WidgetContentsResume = ({ data }: any) => {
  console.log(data, "data desde widget contents resume");
  return (
    <WidgetBase
      variant={"V1"}
      title={"Contenidos"}
      subtitle={"Publicaciones y anuncios del condominio"}
      className={styles.widgetContentsResume}
    >
      <div className={styles.widgetContentsResumeContent}>
        {data && data.length > 0 ? (
          data.map((item: any, index: number) => (
            <div key={index} className={styles.widgetContentsResumeItem}>
              <div className={styles.widgetContentsResumeItemHeader}>
                <span className={styles.widgetContentsResumeItemTitle}>
                  {item.title}
                </span>
                <span className={styles.widgetContentsResumeItemDate}>
                  {item.created_at}
                </span>
              </div>
              <div className={styles.widgetContentsResumeItemContent}>
                {item.content}
              </div>
            </div>
          ))
        ) : (
          <EmptyData
            message="Sin publicaciones. Las noticias de administración aparecerán"
            line2="aquí, una vez comiences a crear y publicar contenido."
            h={200}
            icon={<IconPublicacion size={40} />} 
          />
        )}
      </div>
    </WidgetBase>
  );
};

export default WidgetContentsResume;
