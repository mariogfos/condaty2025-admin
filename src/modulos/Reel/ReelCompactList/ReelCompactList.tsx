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

  return (
    <div className={styles.compactListContainer}>
      {items.map((item: ContentItem) => (
        <article key={`compact-content-${item.id}`} className={styles.contentCardCompact}>
          <header className={styles.contentHeader}>
            <div className={styles.userInfo}>
              <Avatar
                hasImage={1}
                name={getFullName(item.user)}
                src={getUrlImages(`/ADM-${item.user?.id}.webp?d=${item.user?.updated_at}`)}
                w={32}
                h={32}
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

            <div className={styles.contentDivider}></div>

            <div className={styles.contentActions}>
              <button
                className={`${styles.actionButton} ${item.liked ? styles.liked : ''}`}
                onClick={() => onLike?.(item.id)}
                aria-pressed={!!item.liked}
                aria-label={`Me gusta esta publicación`}
              >
                <IconLike color={item.liked ? 'var(--cAccent)' : 'var(--cWhiteV1)'} size={16} />
                <span>Apoyar</span>
              </button>
              <button
                className={styles.actionButton}
                onClick={() => onOpenComments?.(item.id)}
                aria-label={`Comentar esta publicación`}
              >
                <IconComment color={'var(--cWhiteV1)'} size={16} />
                <span>Comentar</span>
              </button>
            </div>
          </footer>
        </article>
      ))}
    </div>
  );
};

export default ReelCompactList;
