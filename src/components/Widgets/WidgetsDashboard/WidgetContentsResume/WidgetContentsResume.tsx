import React, { useEffect, useState } from "react";
import WidgetBase from "../../WidgetBase/WidgetBase";
import styles from "./WidgetContentsResume.module.css";
import useAxios from "@/mk/hooks/useAxios";
import { ReelCompactList } from "@/modulos/Reel/Reel";

import EmptyData from "@/components/NoData/EmptyData";
import { IconPublicacion } from "@/components/layout/icons/IconsBiblioteca";
import { useRouter } from "next/navigation";
import { ContentItem } from "@/modulos/Reel/types";
import { useAuth } from "@/mk/contexts/AuthProvider";
import { useScopedI18n } from "@/i18n/useScopedI18n";

const WidgetContentsResume = ({
  onOpenRenderView,
}: {
  onOpenRenderView?: (id: number, data?: ContentItem) => void;
}) => {
  const [contents, setContents] = useState<ContentItem[]>([]);
  const [loading, setLoading] = useState(true);
  const { store, setStore } = useAuth();
  const { t } = useScopedI18n("content");
  const { data, loaded, error, reLoad } = useAxios(
    "/contents",
    "GET",
    {
      perPage: 3,
      page: 1,
      fullType: "L",
      searchBy: "",
    },
    false,
  );
  const router = useRouter();

  useEffect(() => {
    if (!store?.reLoadDashboard) return;
    reLoad();
    setStore({
      ...store,
      reLoadDashboard: false,
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [store?.reLoadDashboard]);

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
    router.push("/reels");
  };

  return (
    <WidgetBase
      variant={"V1"}
      title={t("community")}
      subtitle={t("communitySubtitle")}
      className={styles.widgetContentsResume}
      ignoreTranslation
    >
      {/* <div className={styles.widgetContentsResumeContent}> */}
      {loading ? (
        <div
          style={{
            padding: "32px 0",
            color: "var(--cWhiteV1)",
            textAlign: "center",
            fontSize: "16px",
          }}
        >
          {t("loadingPosts")}
        </div>
      ) : contents.length > 0 ? (
        <div>
          <ReelCompactList
            items={contents}
            onLike={handleRedirectToReel}
            onOpenComments={handleRedirectToReel}
            onImageClick={handleRedirectToReel}
            onOpenRenderView={onOpenRenderView}
          />
        </div>
      ) : (
        <EmptyData
          message={t("emptyMessage")}
          line2={t("emptyLine2")}
          h={200}
          icon={<IconPublicacion size={40} color="var(--cWhiteV1)" />}
        />
      )}
      {/* </div> */}
    </WidgetBase>
  );
};

export default WidgetContentsResume;
