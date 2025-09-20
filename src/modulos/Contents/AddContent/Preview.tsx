import { Avatar } from "@/mk/components/ui/Avatar/Avatar";
import styles from "./AddContent.module.css";
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

type PropsType = {
  formState: any;
  extraData: any;
  action: any;
};

const STATIC_BACKGROUND_IMAGE = "/assets/images/portadaLogin.webp";

const STATIC_TOP_POST = {
  userName: 'María González',
  userRole: 'Administradora',
  time: 'Hace 2 horas',
  title: 'Reunión de consorcio',
  description: 'Recordamos a todos los propietarios que mañana tenemos reunión de consorcio a las 19:00 hs en el salón de usos múltiples...',
  hasImage: true,
  imageUrl: STATIC_BACKGROUND_IMAGE,
  imageCount: 3,
  likes: 24,
  comments: 8,
  shares: 3,
  isPost: false
};

const STATIC_BOTTOM_POST = {
  userName: 'Carlos Rodríguez',
  userRole: 'Propietario',
  time: 'Hace 1 día',
  title: 'Problema con ascensor',
  description: 'Buenos días vecinos, quería informar que el ascensor del edificio B está fuera de servicio desde ayer. Ya se contactó con el técnico...',
  hasImage: true,
  imageUrl: STATIC_BACKGROUND_IMAGE,
  imageCount: 1,
  likes: 18,
  comments: 15,
  shares: 2,
  isPost: false
};

// Función para truncar texto
const truncateText = (text: string, maxLength: number): string => {
  if (!text) return '';
  if (text.length <= maxLength) return text;
  return text.substring(0, maxLength) + '...';
};

const PostCard = ({ isBackground = false, opacity = 1, postData, user, dataFake }: {
  isBackground?: boolean;
  opacity?: number;
  postData: {
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
  };
  user?: any;
  dataFake?: any;
}) => (
  <div
    className={`${previewStyles.postCard} ${isBackground ? previewStyles.postCardBackground : ''}`}
    style={{ opacity }}
  >
    <div className={previewStyles.userHeader}>
      <Avatar
        hasImage={1}
        src={user ? getUrlImages("/ADM-" + user?.id + ".webp?d=" + user?.updated_at) : ""}
        name={postData.userName || (user ? getFullName(user) : "") || (dataFake?.name || "Usuario")}
        w={40}
        h={40}
      />
      <div className={previewStyles.userInfo}>
        <div className={previewStyles.userName}>
          {postData.userName || (user ? getFullName(user) : "") || (dataFake?.name || "Usuario")}
        </div>
        <div className={previewStyles.userRole}>
          {postData.userRole || 'Encargado de comunicación'}
        </div>
      </div>
      <div className={previewStyles.postTime}>
        {postData.time || 'Hace un momento'}
      </div>
    </div>

    {postData.isPost ? (
      <div className={previewStyles.postContent}>
        <div className={previewStyles.textContentFull}>
          {postData.title && (
            <h3 className={previewStyles.postTitle}>
              {truncateText(postData.title, 50)}
            </h3>
          )}
          <p className={previewStyles.postDescription}>
            {truncateText(postData.description, 289)}
          </p>
        </div>

        {postData.hasImage && (
          <div className={previewStyles.imageContainerFull}>
            <Image
              src={postData.imageUrl || '/images/default-post.jpg'}
              alt="Preview de la publicación"
              width={400}
              height={250}
              className={previewStyles.postImageFull}
              unoptimized
            />
            {postData.imageCount && postData.imageCount > 1 && (
              <div className={previewStyles.imageCounter}>
                +{postData.imageCount - 1}
              </div>
            )}
          </div>
        )}
      </div>
    ) : (
      <div className={previewStyles.mainContent}>
        <div className={previewStyles.textContent}>
          {postData.title && (
            <h3 className={previewStyles.postTitle}>
              {truncateText(postData.title, 50)}
            </h3>
          )}
          <p className={previewStyles.postDescription}>
            {truncateText(postData.description, 239)}
          </p>
        </div>

        <div className={previewStyles.imageContainer}>
          {postData.hasImage ? (
            <>
              <Image
                src={postData.imageUrl || '/images/default-post.jpg'}
                alt="Preview de la publicación"
                width={140}
                height={140}
                className={previewStyles.postImage}
                unoptimized
              />
              {postData.imageCount && postData.imageCount > 1 && (
                <div className={previewStyles.imageCounter}>
                  +{postData.imageCount - 1}
                </div>
              )}
            </>
          ) : (
            <div className={previewStyles.imagePlaceholder}>
              <IconGallery size={32} />
              <p className={previewStyles.imagePlaceholderText}>Imagen</p>
            </div>
          )}
        </div>
      </div>
    )}

    <div className={previewStyles.stats}>
      <div className={previewStyles.statItem}>
        <IconLike color={'var(--cAccent)'} size={20} />
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

    <div className={previewStyles.actionButtons}>
      <button className={`${previewStyles.actionButton} ${previewStyles.actionButtonPrimary}`}>
        <IconLike size={18} />
        Apoyar
      </button>
      <button className={previewStyles.actionButton}>
        <IconComment size={18} />
        Comentar
      </button>
      <button className={previewStyles.actionButton}>
        <IconShare size={18} />
        Compartir
      </button>
    </div>
  </div>
);

const Preview = ({ formState, extraData, action }: PropsType) => {
  const { user } = useAuth();
  const dataFake = {
    name: "Nombre candidato",
    title: "Lorem ipsum dolor sit amet consectetur.",
    subtitle: "Presidente de la República Oriental del Uruguay",
    description:
      " Lorem ipsum dolor sit amet consectetur. Placerat augue id nulla risus ut ultrices. Vestibulum tristique commodo non proin dis.",
  };

  const getFirstAvailableImage = () => {
    if (formState?.avatar) {
      const avatarKeys = Object.keys(formState.avatar);

      for (const key of avatarKeys) {
        const avatarItem = formState.avatar[key];

        if (avatarItem?.file &&
            avatarItem.file !== "delete" &&
            avatarItem.file !== "" &&
            avatarItem.file.length > 10) {
          return "data:image/webp;base64," + decodeURIComponent(avatarItem.file);
        }
      }
    }

    if (formState?.images?.[0]?.id && formState?.id) {
      return getUrlImages(
        "/CONT-" +
        formState?.id +
        "-" +
        formState?.images[0]?.id +
        ".webp?d=" +
        formState?.updated_at
      );
    }

    return null;
  };

  const imageUrl = getFirstAvailableImage();
  const isPost = formState?.isType === 'P';

  const mainPost = {
    userName: getFullName(user) || dataFake.name,
    userRole: 'Encargado de comunicación',
    time: 'Hace un momento',
    title: formState?.title || null,
    description: formState?.description || dataFake.description,
    hasImage: formState?.type === 'I' && !!imageUrl,
    imageUrl: imageUrl,
    imageCount: (() => {
      let count = 0;

      if (formState?.avatar) {
        Object.values(formState.avatar).forEach((item: any) => {
          if (item?.file && item.file !== "delete" && item.file !== "" && item.file.length > 10) {
            count++;
          }
        });
      }

      if (count === 0 && formState?.images?.length) {
        count = formState.images.length;
      }

      return count;
    })(),
    likes: 36,
    comments: 12,
    shares: 6,
    isPost: isPost
  };

  return (
    <div className={previewStyles.previewContainer}>
      <div className={previewStyles.postTop}>
        <PostCard
          isBackground={true}
          opacity={0.6}
          postData={STATIC_TOP_POST}
        />
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
        <PostCard
          isBackground={true}
          opacity={0.6}
          postData={STATIC_BOTTOM_POST}
        />
      </div>
    </div>
  );
};

export default Preview;
