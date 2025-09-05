import { Avatar } from "@/mk/components/ui/Avatar/Avatar";
import ItemList from "@/mk/components/ui/ItemList/ItemList";
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

const Preview = ({ formState, extraData, action }: PropsType) => {
  const { user } = useAuth();
  const dataFake = {
    name: "Nombre candidato",
    title: "Lorem ipsum dolor sit amet consectetur.",
    subtitle: "Presidente de la República Oriental del Uruguay",
    description:
      " Lorem ipsum dolor sit amet consectetur. Placerat augue id nulla risus ut ultrices. Vestibulum tristique commodo non proin dis.",
  };

  // Función para obtener la primera imagen disponible
  const getFirstAvailableImage = () => {
    console.log('formState en preview:', formState); // Para debug

    // Primero buscar en el objeto avatar cualquier imagen nueva subida
    if (formState?.avatar) {
      const avatarKeys = Object.keys(formState.avatar);
      console.log('Avatar keys:', avatarKeys, formState.avatar); // Para debug

      for (const key of avatarKeys) {
        const avatarItem = formState.avatar[key];
        console.log('Checking avatar item:', key, avatarItem); // Para debug

        // Si tiene un archivo base64 (imagen nueva) y no está marcada para eliminar
        if (avatarItem?.file &&
            avatarItem.file !== "delete" &&
            avatarItem.file !== "" &&
            avatarItem.file.length > 10) { // Verificar que no sea solo un string vacío
          console.log('Found new image in avatar:', key); // Para debug
          return "data:image/webp;base64," + decodeURIComponent(avatarItem.file);
        }
      }
    }

    // Si no hay imágenes nuevas, buscar imágenes existentes (modo edición)
    if (formState?.images?.[0]?.id && formState?.id) {
      console.log('Using existing image'); // Para debug
      return getUrlImages(
        "/CONT-" +
        formState?.id +
        "-" +
        formState?.images[0]?.id +
        ".webp?d=" +
        formState?.updated_at
      );
    }

    console.log('No image found'); // Para debug
    return null;
  };

  const imageUrl = getFirstAvailableImage();
  console.log('Final imageUrl:', imageUrl); // Para debug

  // Componente de publicación reutilizable
  const PostCard = ({ isBackground = false, opacity = 1, postData }: {
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
    }
  }) => (
    <div
      className={`${previewStyles.postCard} ${isBackground ? previewStyles.postCardBackground : ''}`}
      style={{ opacity }}
    >
      {/* Header del usuario */}
      <div className={previewStyles.userHeader}>
        <Avatar
          hasImage={1}
          src={getUrlImages(
            "/ADM-" + user?.id + ".webp?d=" + user?.updated_at
          )}
          name={getFullName(user) || dataFake.name}
          w={40}
          h={40}
        />
        <div className={previewStyles.userInfo}>
          <div className={previewStyles.userName}>
            {postData.userName || getFullName(user) || dataFake.name}
          </div>
          <div className={previewStyles.userRole}>
            {postData.userRole || 'Encargado de comunicación'}
          </div>
        </div>
        <div className={previewStyles.postTime}>
          {postData.time || 'Hace un momento'}
        </div>
      </div>

      {/* Contenido principal: Texto a la izquierda, imagen a la derecha */}
      <div className={previewStyles.mainContent}>
        {/* Contenido de texto - Izquierda */}
        <div className={previewStyles.textContent}>
          {/* Título */}
          {postData.title && (
            <h3 className={previewStyles.postTitle}>
              {postData.title}
            </h3>
          )}

          {/* Descripción */}
          <p className={previewStyles.postDescription}>
            {postData.description}
          </p>
        </div>

        {/* Imagen - Derecha - Posición fija */}
        <div className={previewStyles.imageContainer}>
          {postData.hasImage ? (
            <>
              <Image
                src={postData.imageUrl || imageUrl || '/images/default-post.jpg'}
                alt="Preview de la publicación"
                width={140}
                height={140}
                className={previewStyles.postImage}
                unoptimized
              />
              {/* Indicador de múltiples imágenes */}
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

      {/* Estadísticas */}
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

      {/* Separador */}
      <div className={previewStyles.separator} />

      {/* Botones de acción */}
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

  // Datos para las diferentes publicaciones
  const posts = {
    top: {
      userName: 'María González',
      userRole: 'Administradora',
      time: 'Hace 2 horas',
      title: 'Reunión de consorcio',
      description: 'Recordamos a todos los propietarios que mañana tenemos reunión de consorcio a las 19:00 hs en el salón de usos múltiples...',
      hasImage: true,
      imageUrl: null,
      imageCount: 3,
      likes: 24,
      comments: 8,
      shares: 3
    },
    main: {
      userName: getFullName(user) || dataFake.name,
      userRole: 'Encargado de comunicación',
      time: 'Hace un momento',
      title: formState?.title || null,
      description: formState?.description || dataFake.description,
      hasImage: formState?.type === 'I' && !!imageUrl,
      imageUrl: imageUrl,
 
      imageCount: (() => {
        let count = 0;

        // Contar imágenes nuevas en avatar
        if (formState?.avatar) {
          Object.values(formState.avatar).forEach((item: any) => {
            if (item?.file && item.file !== "delete" && item.file !== "" && item.file.length > 10) {
              count++;
            }
          });
        }

        // Si no hay imágenes nuevas, contar las existentes
        if (count === 0 && formState?.images?.length) {
          count = formState.images.length;
        }

        return count;
      })(),
      likes: 36,
      comments: 12,
      shares: 6
    },
    bottom: {
      userName: 'Carlos Rodríguez',
      userRole: 'Propietario',
      time: 'Hace 1 día',
      title: 'Problema con ascensor',
      description: 'Buenos días vecinos, quería informar que el ascensor del edificio B está fuera de servicio desde ayer. Ya se contactó con el técnico...',
      hasImage: true,
      imageUrl: null,
      imageCount: 1,
      likes: 18,
      comments: 15,
      shares: 2
    }
  };

  return (
    <div className={previewStyles.previewContainer}>
      {/* Publicación superior difuminada - Posicionada arriba */}
      <div className={previewStyles.postTop}>
        <PostCard
          isBackground={true}
          opacity={0.6}
          postData={posts.top}
        />
      </div>

      {/* Publicación principal - Centrada */}
      <div className={previewStyles.postMain}>
        <PostCard
          isBackground={false}
          opacity={1}
          postData={posts.main}
        />
      </div>

      {/* Publicación inferior difuminada - Posicionada abajo */}
      <div className={previewStyles.postBottom}>
        <PostCard
          isBackground={true}
          opacity={0.6}
          postData={posts.bottom}
        />
      </div>
    </div>
  );
};

export default Preview;
