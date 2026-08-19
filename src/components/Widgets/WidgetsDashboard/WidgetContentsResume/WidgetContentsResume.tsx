import React, { useEffect, useState } from "react";
import WidgetBase from "../../WidgetBase/WidgetBase";
import styles from "./WidgetContentsResume.module.css";
import useAxios from "@/mk/hooks/useAxios";
import { ReelCompactList } from "@/modulos/Reel/Reel";

import EmptyData from "@/components/NoData/EmptyData";
import {
  IconPublicacion,
  IconAlertCircle,
} from "@/components/layout/icons/IconsBiblioteca";
// ⚠️ Esta pantalla RENDERIZA texto escrito por el servidor. Antes de CDT-47 no
// lo hacía: el mensaje de un sobre no-5xx llega tal cual a la vista. El riesgo
// residual de eso —para los 4xx el único guardián es la lista de patrones
// técnicos— está medido y explicado en el docblock del helper.
import { leerElErrorDelApi } from "@/mk/hooks/useCrud/leerElErrorDelApi";
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
  /**
   * La carga no dejó un widget utilizable (CDT-47). 🔴 No es `!!error`: la
   * tercera rama del efecto —el `else`— también vacía la lista sin error de
   * transporte, y ahí cae el HTTP 200 rechazado en el cuerpo (`success:false`).
   * Mirando sólo `error`, esa forma seguía pintando el `EmptyData` que afirma
   * que no hay publicaciones.
   */
  const [loadFailed, setLoadFailed] = useState(false);
  const { store, setStore } = useAuth();
  const { translate } = useScopedI18n("content");
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
      setLoadFailed(true);
      setContents([]);
    } else if (data?.data) {
      const items = data.data.map((item: any) => ({
        ...item,
        likes: item.likes || 0,
        comments_count: item.comments_count || 0,
        currentImageIndex: 0,
        isDescriptionExpanded: false,
      }));
      setLoadFailed(false);
      setContents(items);
    } else {
      // Sin error de transporte pero sin sobre utilizable: el 200 rechazado en
      // el cuerpo. Vaciar sin marcarlo dejaba al `EmptyData` mintiendo.
      setLoadFailed(true);
      setContents([]);
    }
  }, [data, loaded, error, loading]);

  // Al hacer click en like o comentario, redirigir al módulo Reel
  const handleRedirectToReel = () => {
    router.push("/reels");
  };

  /**
   * 🔴 CDT-47, TERCERA puerta al mismo vacío mentiroso.
   *
   * Este widget es hermano del muro: mismo endpoint (`/contents`), mismo
   * `if (error) setContents([])`, y el mismo `EmptyData` afirmando que el
   * condominio no publicó nada cuando lo que falló fue la red. Arreglar sólo
   * `Reel.tsx` dejaba el dashboard mintiendo igual.
   *
   * El `setLoading(true)` es necesario: `useAxios` limpia su `error` al arrancar
   * la petición, así que sin volver al estado de carga el reintento repinta el
   * vacío mentiroso mientras el request está en vuelo.
   */
  const handleRetry = () => {
    setLoading(true);
    reLoad();
  };

  // Manda el código HTTP (CDT-94): 5xx y red caída caen al genérico; un 4xx
  // —un 403 de permisos— trae su propio texto, que es el que hay que leer.
  // ⚠️ El sobre del 200 rechazado viaja en `data`, no en `error`: axios no
  // rechaza un 200. `leerElErrorDelApi` mira los dos justamente por eso.
  const { mensaje: mensajeDeCargaFallida } = leerElErrorDelApi(
    data,
    error,
    translate("loadErrorLine2"),
  );

  return (
    <WidgetBase
      variant={"V1"}
      title={translate("community")}
      subtitle={translate("communitySubtitle")}
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
          {translate("loadingPosts")}
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
      ) : loadFailed ? (
        <div className={styles.loadErrorState} role="alert">
          <IconAlertCircle size={40} color="var(--cWarning)" />
          <p>{translate("loadErrorTitle")}</p>
          <span>{mensajeDeCargaFallida}</span>
          <button
            type="button"
            className={styles.retryButton}
            onClick={handleRetry}
          >
            {translate("retry")}
          </button>
        </div>
      ) : (
        <EmptyData
          message={translate("emptyMessage")}
          line2={translate("emptyLine2")}
          h={200}
          icon={<IconPublicacion size={40} color="var(--cWhiteV1)" />}
        />
      )}
      {/* </div> */}
    </WidgetBase>
  );
};

export default WidgetContentsResume;
