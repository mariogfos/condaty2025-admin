import Image from "next/image";
import { FileText, ImageIcon, PlayCircle } from "lucide-react";
import {
  IconComment,
  IconLike,
} from "@/components/layout/icons/IconsBiblioteca";
import { Avatar } from "@/mk/components/ui/Avatar/Avatar";
import { useAuth } from "@/mk/contexts/AuthProvider";
import { getFullName } from "@/mk/utils/string";
import styles from "./Preview.module.css";

type Props = {
  formState: any;
  extraData: any;
  action: any;
};

const previewDescription =
  "La descripción de tu publicación aparecerá aquí mientras la escribes.";

const getImageCount = (formState: any) => {
  if (Array.isArray(formState?.files)) return formState.files.length;
  if (Array.isArray(formState?.images)) return formState.images.length;
  return 0;
};

const getFirstFile = (formState: any) => {
  if (!Array.isArray(formState?.files)) return "";
  return formState.files.find(
    (file: unknown): file is string =>
      typeof file === "string" && file.trim().length > 0,
  ) || "";
};

const getFileName = (url: string) => {
  const fallback = url.split("/").pop() || "Documento";
  try {
    return decodeURIComponent(fallback);
  } catch {
    return fallback;
  }
};

export default function Preview({ formState }: Props) {
  const { user } = useAuth();
  const isNews = formState?.isType === "N";
  const displayName = getFullName(user) || "Administración";
  const displayRole =
    user?.role?.name || user?.role1?.[0]?.name || "Administración";
  const description = formState?.description?.trim() || previewDescription;
  const imageCount = getImageCount(formState);
  const firstFile = getFirstFile(formState);

  return (
    <div className={styles.previewContainer}>
      <article
        className={`${styles.previewCard} ${
          isNews ? styles.newsCard : styles.postCard
        }`}
        aria-label="Vista previa de la publicación en el muro"
      >
        <header className={styles.cardHeader}>
          <div className={styles.author}>
            <Avatar
              src={user?.url_avatar}
              name={displayName}
              w={42}
              h={42}
            />
            <div>
              <strong data-i18n-ignore="true">{displayName}</strong>
              <span>
                {displayRole} <i aria-hidden="true" /> Hace un momento
              </span>
            </div>
          </div>
          <span
            className={`${styles.typeBadge} ${
              isNews ? styles.newsBadge : styles.postBadge
            }`}
          >
            {isNews ? "Noticia" : "Post"}
          </span>
        </header>

        <div className={styles.cardContent}>
          <div className={styles.cardCopy}>
            {isNews ? (
              <h3>{formState?.title?.trim() || "Título de la noticia"}</h3>
            ) : null}
            <p
              className={
                !formState?.description?.trim() ? styles.placeholderText : ""
              }
            >
              {description}
            </p>
          </div>

          {formState?.type === "I" ? (
            firstFile ? (
              <div className={styles.imageContainer}>
                <Image
                  src={firstFile}
                  alt="Vista previa de la publicación"
                  width={600}
                  height={380}
                  className={styles.previewImage}
                  unoptimized
                />
                {imageCount > 1 ? (
                  <span className={styles.mediaCount}>+{imageCount - 1}</span>
                ) : null}
              </div>
            ) : (
              <div className={styles.mediaPlaceholder}>
                <ImageIcon size={24} aria-hidden="true" />
                <div>
                  <strong>Imagen de la publicación</strong>
                  <span>Aparecerá aquí cuando termines de subirla.</span>
                </div>
              </div>
            )
          ) : formState?.type === "V" ? (
            <div className={styles.mediaPlaceholder}>
              <PlayCircle size={24} aria-hidden="true" />
              <div>
                <strong>Video enlazado</strong>
                <span>{formState?.url?.trim() || "Agrega el enlace del video."}</span>
              </div>
            </div>
          ) : (
            <div className={styles.mediaPlaceholder}>
              <FileText size={24} aria-hidden="true" />
              <div>
                <strong>Documento adjunto</strong>
                <span>
                  {firstFile
                    ? getFileName(firstFile)
                    : "El documento aparecerá aquí cuando lo subas."}
                </span>
              </div>
            </div>
          )}
        </div>

        <footer className={styles.cardFooter}>
          <div className={styles.stats}>
            <span>
              <IconLike size={17} /> <strong>0</strong> apoyos
            </span>
            <span>
              <IconComment size={17} /> <strong>0</strong> comentarios
            </span>
          </div>
          <div className={styles.actions} aria-hidden="true">
            <button type="button" disabled>
              <IconLike size={18} /> Apoyar
            </button>
            <button type="button" disabled>
              <IconComment size={18} /> Comentar
            </button>
          </div>
        </footer>
      </article>
    </div>
  );
}
