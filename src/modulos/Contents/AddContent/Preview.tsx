import { Avatar } from "@/mk/components/ui/Avatar/Avatar";
import previewStyles from "./Preview.module.css";
import React from "react";
import {
  IconComment,
  IconGallery,
  IconLike,
  IconShare,
} from "@/components/layout/icons/IconsBiblioteca";
import Image from "next/image";
import { getFullName, getUrlImages } from "@/mk/utils/string";
import { useAuth } from "@/mk/contexts/AuthProvider";

type PostData = {
  userName: string;
  userRole: string;
  time: string;
  title?: string | null;
  description: string;
  hasImage: boolean;
  imageUrl: string | null;
  imageCount?: number;
  likes: number;
  comments: number;
  shares: number;
  isPost?: boolean;
  files?: any[];
};

type Props = {
  formState: any;
  extraData: any;
  action: any;
};

const STATIC_BACKGROUND = "/assets/images/portadaLogin.webp";

const STATIC_TOP_POST: PostData = {
  userName: "María González",
  userRole: "Administradora",
  time: "Hace 2 horas",
  title: "Reunión de consorcio",
  description:
    "Recordamos a todos los propietarios que mañana tenemos reunión de consorcio a las 19:00 hs en el salón de usos múltiples...",
  hasImage: true,
  imageUrl: STATIC_BACKGROUND,
  imageCount: 3,
  likes: 24,
  comments: 8,
  shares: 3,
  isPost: false,
};

const STATIC_BOTTOM_POST: PostData = {
  userName: "Carlos Rodríguez",
  userRole: "Propietario",
  time: "Hace 1 día",
  title: "Problema con ascensor",
  description:
    "Buenos días vecinos, quería informar que el ascensor del edificio B está fuera de servicio desde ayer...",
  hasImage: true,
  imageUrl: STATIC_BACKGROUND,
  imageCount: 1,
  likes: 18,
  comments: 15,
  shares: 2,
  isPost: false,
};

// Helpers
const truncate = (text: string = "", max: number) =>
  text.length > max ? text.slice(0, max) + "..." : text;

const getDisplayName = (user: any, dataFake: any, postData: PostData) =>
  postData.userName ||
  (user ? getFullName(user) : "") ||
  dataFake?.name ||
  "Usuario";

const getPostImageSrc = (postData: PostData) =>
  postData.files?.[0] || postData.imageUrl || "/images/default-post.jpg";

const PostCard = ({
  isBackground = false,
  opacity = 1,
  postData,
  user,
  dataFake,
}: {
  isBackground?: boolean;
  opacity?: number;
  postData: PostData;
  user?: any;
  dataFake?: any;
}) => {
  const displayName = getDisplayName(user, dataFake, postData);
  const displayRole = postData.userRole || "Encargado de comunicación";
  const displayTime = postData.time || "Hace un momento";

  const imageSrc = getPostImageSrc(postData);
  const showImageCounter = !!postData.imageCount && postData.imageCount > 1;

  return (
    <div
      className={`${previewStyles.postCard} ${isBackground ? previewStyles.postCardBackground : ""}`}
      style={{ opacity }}
    >
      {/* Header */}
      <div className={previewStyles.userHeader}>
        <Avatar
          hasImage={1}
          src={
            user
              ? getUrlImages(
                  `/ADM-${user?.id}.webp?d=${user?.updated_at}`,
                  user?.url_avatar,
                )
              : ""
          }
          name={displayName}
          w={40}
          h={40}
        />
        <div className={previewStyles.userInfo}>
          <div className={previewStyles.userName}>{displayName}</div>
          <div className={previewStyles.userRole}>{displayRole}</div>
        </div>
        <div className={previewStyles.postTime}>{displayTime}</div>
      </div>

      {/* Contenido principal */}
      <div
        className={
          postData.isPost
            ? previewStyles.postContent
            : previewStyles.mainContent
        }
      >
        <div
          className={
            postData.isPost
              ? previewStyles.textContentFull
              : previewStyles.textContent
          }
        >
          {postData.title && (
            <h3 className={previewStyles.postTitle}>
              {truncate(postData.title, 50)}
            </h3>
          )}
          <p className={previewStyles.postDescription}>
            {truncate(postData.description, postData.isPost ? 289 : 239)}
          </p>
        </div>

        {postData.hasImage ? (
          <div
            className={
              postData.isPost
                ? previewStyles.imageContainerFull
                : previewStyles.imageContainer
            }
          >
            <Image
              src={imageSrc}
              alt="Preview de la publicación"
              width={postData.isPost ? 400 : 140}
              height={postData.isPost ? 250 : 140}
              className={
                postData.isPost
                  ? previewStyles.postImageFull
                  : previewStyles.postImage
              }
              unoptimized
            />
            {showImageCounter && (
              <div className={previewStyles.imageCounter}>
                +{postData.imageCount! - 1}
              </div>
            )}
          </div>
        ) : (
          !postData.isPost && (
            <div className={previewStyles.imagePlaceholder}>
              <IconGallery size={32} />
              <p className={previewStyles.imagePlaceholderText}>Imagen</p>
            </div>
          )
        )}
      </div>

      {/* Estadísticas */}
      <div className={previewStyles.stats}>
        <div className={previewStyles.statItem}>
          <IconLike color="var(--cAccent)" size={20} />
          <span>{postData.likes || 36}</span>
        </div>
        <div className={previewStyles.statItem}>
          <IconComment size={20} />
          <span>{postData.comments || 12}</span>
        </div>
        <div className={previewStyles.statItemRight}>
          <IconShare size={20} />
          <span>{postData.shares || 6}</span>
        </div>
      </div>

      <div className={previewStyles.separator} />

      {/* Acciones */}
      <div className={previewStyles.actionButtons}>
        <button
          className={`${previewStyles.actionButton} ${previewStyles.actionButtonPrimary}`}
        >
          <IconLike size={18} /> Apoyar
        </button>
        <button className={previewStyles.actionButton}>
          <IconComment size={18} /> Comentar
        </button>
        <button className={previewStyles.actionButton}>
          <IconShare size={18} /> Compartir
        </button>
      </div>
    </div>
  );
};

const getFirstAvailableImage = (formState: any): string | null => {
  // Avatar en base64
  if (formState?.avatar) {
    for (const item of Object.values(formState.avatar) as any[]) {
      if (
        item?.file &&
        item.file !== "delete" &&
        item.file !== "" &&
        item.file.length > 10
      ) {
        return "data:image/webp;base64," + decodeURIComponent(item.file);
      }
    }
  }

  // Imagen existente en servidor
  if (formState?.images?.[0]?.id && formState?.id) {
    return getUrlImages(
      `/CONT-${formState.id}-${formState.images[0].id}.webp?d=${formState.updated_at}`,
    );
  }

  return null;
};

const getImageCount = (formState: any): number => {
  if (formState?.files?.length) return formState.files.length;

  let count = 0;
  if (formState?.avatar) {
    Object.values(formState.avatar).forEach((item: any) => {
      if (
        item?.file &&
        item.file !== "delete" &&
        item.file !== "" &&
        item.file.length > 10
      ) {
        count++;
      }
    });
  }

  return count || formState?.images?.length || 0;
};

const Preview = ({ formState }: Props) => {
  const { user } = useAuth();

  const dataFake = {
    name: "Nombre candidato",
    description:
      "Lorem ipsum dolor sit amet consectetur. Placerat augue id nulla risus ut ultrices...",
  };

  const imageUrl = getFirstAvailableImage(formState);
  const isPost = formState?.isType === "P";

  const mainPost: PostData = {
    userName: getFullName(user) || dataFake.name,
    userRole: user?.role?.name || "",
    time: "Hace un momento",
    title: formState?.title || null,
    description: formState?.description || dataFake.description,
    hasImage:
      formState?.type === "I" && (!!imageUrl || formState?.files?.length > 0),
    imageUrl,
    files: formState?.files,
    imageCount: getImageCount(formState),
    likes: 36,
    comments: 12,
    shares: 6,
    isPost,
  };

  return (
    <div className={previewStyles.previewContainer}>
      <div className={previewStyles.postTop}>
        <PostCard isBackground opacity={0.6} postData={STATIC_TOP_POST} />
      </div>

      <div className={previewStyles.postMain}>
        <PostCard
          isBackground={false}
          opacity={1}
          postData={mainPost}
          user={user}
          dataFake={dataFake}
        />
      </div>

      <div className={previewStyles.postBottom}>
        <PostCard isBackground opacity={0.6} postData={STATIC_BOTTOM_POST} />
      </div>
    </div>
  );
};

export default Preview;
