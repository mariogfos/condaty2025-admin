import React from "react";
import { Avatar } from "@/mk/components/ui/Avatar/Avatar";
import { getFullName } from "@/mk/utils/string";
import { getDateTimeAgo } from "@/mk/utils/date";
import {
  IconComment,
  IconLike,
} from "@/components/layout/icons/IconsBiblioteca";
import { ContentItem } from "../types";
import MediaRenderer from "../MediaRenderer/MediaRenderer";
import styles from "./ReelCompactList.module.css";
import LinkifyDescription from "@/mk/components/ui/LinkifyDescription/LinkifyDescription";
import { useScopedI18n } from "@/i18n/useScopedI18n";

interface ReelCompactListProps {
  items: ContentItem[];
  onLike?: (id: number) => void;
  onOpenComments?: (id: number) => void;
  modoCompacto?: boolean;
  onImageClick?: (id: number) => void;
  onOpenRenderView?: (id: number, data?: ContentItem) => void;
}

const ReelCompactList: React.FC<ReelCompactListProps> = ({
  items,
  onLike,
  onOpenComments,
  modoCompacto = false,
  onImageClick,
  onOpenRenderView,
}) => {
  const { translate } = useScopedI18n("content");
  const handleToggleDescription = (
    contentId: number,
    items: ContentItem[],
    setItems: React.Dispatch<React.SetStateAction<ContentItem[]>>,
  ) => {
    setItems((prevContents) =>
      prevContents.map((content) =>
        content.id === contentId
          ? {
              ...content,
              isDescriptionExpanded: !content.isDescriptionExpanded,
            }
          : content,
      ),
    );
  };

  // Función para determinar si es una noticia y su posición
  const getNewsIndex = (items: ContentItem[], currentIndex: number) => {
    const newsItems = items.filter(
      (item) => item.title && item.title.trim() !== "",
    );
    const currentItem = items[currentIndex];
    if (!currentItem.title || currentItem.title.trim() === "") return -1;
    return newsItems.findIndex((newsItem) => newsItem.id === currentItem.id);
  };
  const urlAvatar = (item: any) => {
    return item.user ? item?.user?.url_avatar : item?.owner?.url_avatar;
  };
  return (
    <div className={styles.compactListContainer} data-i18n-ignore="true">
      {items.map((item: ContentItem, index: number) => {
        const isNews = item.title && item.title.trim() !== "";
        const newsIndex = getNewsIndex(items, index);
        const isImageRight = newsIndex % 2 === 0;

        return (
          <article
            key={`compact-content-${item.id}`}
            className={`${styles.contentCardCompact} ${isNews ? styles.newsCard : ""} ${isNews && isImageRight ? styles.newsImageRight : ""} ${isNews && !isImageRight ? styles.newsImageLeft : ""}`}
            onClick={() => onOpenRenderView?.(item.id, item)}
            role="button"
            tabIndex={0}
            aria-label={translate("openPostDetail", {
              suffix: item.title ? `: ${item.title}` : "",
            })}
            onKeyDown={(e) => {
              if (e.key === "Enter" || e.key === " ") {
                e.preventDefault();
                onOpenRenderView?.(item.id, item);
              }
            }}
          >
            <header className={styles.contentHeader}>
              <div className={styles.userInfo}>
                <Avatar
                  name={getFullName(item.user ? item.user : item.owner)}
                  src={urlAvatar(item)}
                  w={40}
                  h={40}
                />
                <div className={styles.userDetails}>
                  <span className={styles.userName}>
                    {getFullName(item.user || item.owner) ||
                      translate("unknownUser")}
                  </span>
                  <span className={styles.userRole}>
                    {item.user?.role1?.[0]?.name}
                  </span>
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
                  {item.description ? (
                    <div>
                      <p className={styles.newsDescription}>
                      {item.isDescriptionExpanded ||
                        item.description?.length <= 100 ? (
                          <LinkifyDescription text={item.description} />
                        ) : (
                          <LinkifyDescription
                            text={`${item.description.substring(0, 100)}...`}
                          />
                        )}
                      </p>
                      {item.description?.length > 100 && (
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleToggleDescription(item.id, items, () => {});
                          }}
                          className={styles.seeMoreButton}
                        >
                          {item.isDescriptionExpanded ? translate("seeLess") : translate("seeMore")}
                        </button>
                      )}
                    </div>
                  ) : (
                    <p className={styles.newsDescription}>{translate("noDescription")}</p>
                  )}
                </div>
                <div className={styles.newsMediaContent}>
                  {item?.files?.length > 0 && (
                    <div className={styles.newsImageContainer}>
                      {item.files.length > 1 && (
                        <div className={styles.newsImageCounter}>
                          +{item.files.length}
                        </div>
                      )}

                      <div
                        className={styles.newsImageWrapper}
                        onClick={(e) => {
                          e.stopPropagation();
                          onOpenRenderView?.(item.id, item);
                        }}
                        role="button"
                        tabIndex={0}
                        aria-label={translate("viewFullImage", {
                          title: item.title || translate("newsImageAlt"),
                        })}
                        onKeyDown={(e) => {
                          if (e.key === "Enter" || e.key === " ") {
                            e.preventDefault();
                            e.stopPropagation();
                            onOpenRenderView?.(item.id, item);
                          }
                        }}
                      >
                        <img
                          src={item.files[0]}
                          alt={item.title || translate("newsImageAlt")}
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
                {item.title && (
                  <h3 className={styles.contentTitle}>{item.title}</h3>
                )}
                {item.description && (
                  <div>
                    <p className={styles.contentDescription}>
                      {item.isDescriptionExpanded ||
                      item.description.length <= 100 ? (
                        <LinkifyDescription text={item.description} />
                      ) : (
                        <LinkifyDescription
                          text={`${item.description.substring(0, 100)}...`}
                        />
                      )}
                    </p>
                    {item.description.length > 100 && (
                        <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleToggleDescription(item.id, items, () => {});
                        }}
                          className={styles.seeMoreButton}
                        >
                          {item.isDescriptionExpanded ? translate("seeLess") : translate("seeMore")}
                        </button>
                      )}
                  </div>
                )}
                <MediaRenderer
                  item={item}
                  modoCompacto={true}
                  onImageClick={() => onOpenRenderView?.(item.id, item)}
                />
              </section>
            )}

            <footer className={styles.contentFooter}>
              <div className={styles.contentStats}>
                <div
                  className={`${styles.statDisplay} ${item.liked ? styles.liked : ""}`}
                  onClick={(e) => {
                    e.stopPropagation();
                    onLike?.(item.id);
                  }}
                >
                  <IconLike
                    color={item.liked ? "var(--cAccent)" : "var(--cWhiteV1)"}
                    size={16}
                  />
                  <span>{item.likes}</span>
                </div>
                <div
                  className={styles.statDisplay}
                  onClick={(e) => {
                    e.stopPropagation();
                    onOpenComments?.(item.id);
                  }}
                >
                  <IconComment color={"var(--cWhiteV1)"} size={16} />
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
