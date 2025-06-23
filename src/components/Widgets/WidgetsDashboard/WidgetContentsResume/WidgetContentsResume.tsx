import React, { useEffect, useState } from "react";
import WidgetBase from "../../WidgetBase/WidgetBase";
import styles from "./WidgetContentsResume.module.css";
import useAxios from '@/mk/hooks/useAxios';
import { ReelCompactList } from '@/modulos/Reel/Reel';
import type { ContentItem } from '@/modulos/Reel/Reel';
import EmptyData from "@/components/NoData/EmptyData";
import { IconPublicacion } from "@/components/layout/icons/IconsBiblioteca";
import { useRouter } from 'next/navigation';

const WidgetContentsResume = () => {
  const [contents, setContents] = useState<ContentItem[]>([]);
  const [loading, setLoading] = useState(true);
  const { data, loaded, error, reLoad } = useAxios("/contents", "GET", {
    perPage: 3,
    page: 1,
    fullType: "L",
    searchBy: ""
  }, false);
  const router = useRouter();

  useEffect(() => {
    reLoad();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (!loaded && loading) return;
    setLoading(false);
    if (error) {
      setContents([]);
    } else if (data?.data) {
      const items = data.data.map((item: any) => ({
        ...item,
        likes: item.likes || 0,
        comments_count: item.comments_count || 0,
        currentImageIndex: 0,
        isDescriptionExpanded: false,
      }));
      setContents(items);
    } else {
      setContents([]);
    }
  }, [data, loaded, error, loading]);

  // Al hacer click en like o comentario, redirigir al módulo Reel
  const handleRedirectToReel = () => {
    router.push('/reels');
  };

  return (
    <WidgetBase
      variant={"V1"}
      title={"Contenidos"}
      subtitle={"Publicaciones y anuncios del condominio"}
      className={styles.widgetContentsResume}
    >
      <div className={styles.widgetContentsResumeContent}>
        {loading ? (
          <div style={{ padding: '32px 0', color: 'var(--cWhiteV1)', textAlign: 'center', fontSize: '16px' }}>Cargando publicaciones...</div>
        ) : contents.length > 0 ? (
          <ReelCompactList items={contents} modoCompacto={true} onLike={handleRedirectToReel} onOpenComments={handleRedirectToReel} />
        ) : (
          <EmptyData
            message="Sin publicaciones. Las noticias de administración aparecerán"
            line2="aquí, una vez comiences a crear y publicar contenido."
            h={200}
            icon={<IconPublicacion size={40} color="var(--cWhiteV1)" />} 
          />
        )}
      </div>
    </WidgetBase>
  );
};

export default WidgetContentsResume;
