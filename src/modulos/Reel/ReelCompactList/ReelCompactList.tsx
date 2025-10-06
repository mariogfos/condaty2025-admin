import React from "react";
import { Avatar } from "@/mk/components/ui/Avatar/Avatar";
import { getFullName, getUrlImages } from "@/mk/utils/string";
import { getDateTimeAgo } from "@/mk/utils/date";
import {
  IconComment,
  IconLike,
} from "@/components/layout/icons/IconsBiblioteca";
import { ContentItem } from "../types";
import MediaRenderer from "../MediaRenderer/MediaRenderer";
import styles from "./ReelCompactList.module.css";

interface ReelCompactListProps {
  items: ContentItem[];
  onLike?: (id: number) => void;
  onOpenComments?: (id: number) => void;
  modoCompacto?: boolean;
  onImageClick?: (id: number) => void;
}

const ReelCompactList: React.FC<ReelCompactListProps> = ({
  items,
  onLike,
  onOpenComments,
  modoCompacto = false,
  onImageClick
}) => {
  const handleToggleDescription = (contentId: number, items: ContentItem[], setItems: React.Dispatch<React.SetStateAction<ContentItem[]>>) => {
    setItems((prevContents) =>
      prevContents.map((content) =>
        content.id === contentId
          ? {
              ...content,
              isDescriptionExpanded: !content.isDescriptionExpanded,
            }
          : content
      )
    );
  };

  // Función para determinar si es una noticia y su posición
  const getNewsIndex = (items: ContentItem[], currentIndex: number) => {
    const newsItems = items.filter(item => item.title && item.title.trim() !== '');
    const currentItem = items[currentIndex];
    if (!currentItem.title || currentItem.title.trim() === '') return -1;
    return newsItems.findIndex(newsItem => newsItem.id === currentItem.id);
  };

  return (
    <div className={styles.compactListContainer}>
      {items.map((item: ContentItem, index: number) => {
        const isNews = item.title && item.title.trim() !== '';
        const newsIndex = getNewsIndex(items, index);
        const isImageRight = newsIndex % 2 === 0; 

        return (
          <article
            key={`compact-content-${item.id}`}
            className={`${styles.contentCardCompact} ${isNews ? styles.newsCard : ''} ${isNews && isImageRight ? styles.newsImageRight : ''} ${isNews && !isImageRight ? styles.newsImageLeft : ''}`}
          >
            <header className={styles.contentHeader}>
              <div className={styles.userInfo}>
                <Avatar
                  hasImage={1}
                  name={getFullName(item.user)}
                  src={getUrlImages(`/ADM-${item.user?.id}.webp?d=${item.user?.updated_at}`)}
                  w={40}
                  h={40}
                />
                <div className={styles.userDetails}>
                  <span className={styles.userName}>
                    {getFullName(item.user) || 'Usuario Desconocido'}
                  </span>
                  <span className={styles.userRole}>{item.user?.role1?.[0].name}</span>
                </div>
              </div>
              <time dateTime={item.created_at} className={styles.postDate}>
                {getDateTimeAgo(item.created_at)}
              </time>
            </header>

            {isNews ? (
              // Layout para noticias (texto e imagen lado a lado)
              <section className={styles.newsContentBody}>
                <div className={styles.newsTextContent}>
                  <h3 className={styles.newsTitle}>{item.title}</h3>
                  <div>
                    <p className={styles.newsDescription}>
                      {item.isDescriptionExpanded || item.description.length <= 100
                        ? item.description
                        : `${item.description.substring(0, 100)}...`}
                    </p>
                    {item.description.length > 100 && (
                      <button
                        onClick={() => handleToggleDescription(item.id, items, () => {})}
                        className={styles.seeMoreButton}
                      >
                        {item.isDescriptionExpanded ? 'Ver menos' : 'Ver más'}
                      </button>
                    )}
                  </div>
                </div>
                <div className={styles.newsMediaContent}>
                  {item.images && item.images.length > 0 && (
                    <div className={styles.newsImageContainer}>
                      {/* Contador de imágenes - solo si hay más de una */}
                      {item.images.length > 1 && (
                        <div className={styles.newsImageCounter}>
                          +{item.images.length}
                        </div>
                      )}

                      {/* Imagen principal - siempre la primera */}
                      <div
                        className={styles.newsImageWrapper}
                        onClick={() => onImageClick?.(item.id)}
                        role="button"
                        tabIndex={0}
                        aria-label={`Ver imagen completa de ${item.title || 'noticia'}`}
                      >
                        <img
                          src={getUrlImages(`/CONT-${item.id}-${item.images[0].id}.webp?d=${item.updated_at}`)}
                          alt={item.title || 'Imagen de noticia'}
                          className={styles.newsImage}
                        />
                      </div>
                    </div>
                  )}
                </div>
              </section>
            ) : (
              // Layout normal para posts
              <section className={styles.contentBody}>
                {item.title && <h3 className={styles.contentTitle}>{item.title}</h3>}
                {item.description && (
                  <div>
                    <p className={styles.contentDescription}>
                      {item.isDescriptionExpanded || item.description.length <= 100
                        ? item.description
                        : `${item.description.substring(0, 100)}...`}
                    </p>
                    {item.description.length > 100 && (
                      <button
                        onClick={() => handleToggleDescription(item.id, items, () => {})}
                        className={styles.seeMoreButton}
                      >
                        {item.isDescriptionExpanded ? 'Ver menos' : 'Ver más'}
                      </button>
                    )}
                  </div>
                )}
                <MediaRenderer
                  item={item}
                  modoCompacto={true}
                  onImageClick={() => onImageClick?.(item.id)}
                />
              </section>
            )}

            <footer className={styles.contentFooter}>
              <div className={styles.contentStats}>
                <div className={`${styles.statDisplay} ${item.liked ? styles.liked : ''}`}>
                  <IconLike color={item.liked ? 'var(--cAccent)' : 'var(--cWhiteV1)'} size={16} />
                  <span>{item.likes}</span>
                </div>
                <div className={styles.statDisplay}>
                  <IconComment color={'var(--cWhiteV1)'} size={16} />
                  <span>{item.comments_count}</span>
                </div>
              </div>
            </footer>
          </article>
        );
      })}
    </div>
  );
};

export default ReelCompactList;
