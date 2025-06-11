import {
  IconComment,
  IconEdit,
  IconLike,
  IconOptions,
  IconPDF,
  IconTrash,
  IconVideo,
  IconWorld,
} from "@/components/layout/icons/IconsBiblioteca";
import { Avatar } from "@/mk/components/ui/Avatar/Avatar";
import { getFullName, getUrlImages } from "@/mk/utils/string";
import React, { useState, useEffect } from "react";
import styles from "./RenderCard.module.css";

type PropsType = {
  extraData: any;
  item: any;
  onClick: any;
  onEdit: any;
  onDel: any;
};

const RenderCard = ({ extraData, item, onClick, onEdit, onDel }: PropsType) => {
  const [openDrop, setOpenDrop] = useState<{ open: boolean; item: any | null }>({ open: false, item: null });
  const [currentImageIndex, setCurrentImageIndex] = useState(0);

  useEffect(() => {
    setCurrentImageIndex(0);
  }, [item.id]);

  const handlePrevImage = (e: React.MouseEvent) => {
    e.stopPropagation();
    setCurrentImageIndex((prevIndex) =>
      prevIndex === 0 ? item.images.length - 1 : prevIndex - 1
    );
  };

  const handleNextImage = (e: React.MouseEvent) => {
    e.stopPropagation();
    setCurrentImageIndex((prevIndex) =>
      prevIndex === item.images.length - 1 ? 0 : prevIndex + 1
    );
  };

  const getDestinys = () => {
    const names: string[] = [];
    if (item?.destiny === "T" || item?.destiny === 0) {
      names.push("Todos");
    }
    if (item?.destiny === "D" || item?.destiny === 2) {
      names.push("Dptos");
    }
    if (item?.destiny === "G" || item?.destiny === 5) {
      names.push("Guardia");
    }
    if (item?.destiny === "R" || item?.destiny === 3) {
      names.push("Residente");
    }
    return names.length > 0 ? names : ["Desconocido"];
  };

  return (
    <div onClick={() => onClick(item)} className={styles.renderCard}>
      <div>
        <div>
          <div>
            <Avatar
              name={getFullName(item?.user)}
              src={getUrlImages(
                "/ADM-" + item?.user?.id + ".webp?d=" + item?.user?.updated_at
              )}
            />
            <div style={{ flexGrow: 1 }}>
              <p
                style={{
                  fontSize: 14,
                  color: "var(--cWhite)",
                  fontWeight: 600,
                }}
              >
                {getFullName(item.user)}
              </p>
            </div>
            <div
              style={{ position: "relative" }}
              onClick={(e) => {
                e.stopPropagation();
                setOpenDrop({ open: !openDrop.open, item: item });
              }}
            >
              <IconOptions />
              {openDrop.open && item.id === openDrop?.item?.id && (
                <div
                  style={{
                    position: "absolute",
                    backgroundColor: "var(--cBlackV1)",
                    border: "1px solid var(--cBlackV3)",
                    padding: 12,
                    borderRadius: 8,
                    right: 2,
                    display: "flex",
                    flexDirection: "column",
                    gap: 4,
                    zIndex: 99,
                  }}
                >
                  <div
                    onClick={() => onEdit(item)}
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: 8,
                      cursor: "pointer",
                    }}
                  >
                    <IconEdit />
                    <p>Editar</p>
                  </div>
                  <div
                    onClick={() => onDel(item)}
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: 8,
                      color: "var(--cError)",
                      cursor: "pointer",
                    }}
                  >
                    <IconTrash />
                    <p>Eliminar</p>
                  </div>
                </div>
              )}
            </div>
          </div>

          {item.type === "I" && item.images && item.images.length > 0 && (
            <div
              style={{
                overflow: "hidden",
                width: "100%",
                height: "144px",
                borderRadius: 8,
                backgroundColor: "var(--cBlackV3)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                position: "relative",
              }}
            >
              <img
                style={{
                  width: "100%",
                  height: "100%",
                  objectFit: "cover",
                }}
                src={getUrlImages(
                  "/CONT-" +
                    item.id +
                    "-" +
                    item.images[currentImageIndex]?.id +
                    ".webp" +
                    "?" +
                    item?.updated_at
                )}
                alt={`Imagen ${currentImageIndex + 1}`}
              />
              {item.images.length > 1 && (
                <>
                  <button
                    onClick={handlePrevImage}
                    style={{
                      position: "absolute",
                      left: "8px",
                      top: "50%",
                      transform: "translateY(-50%)",
                      zIndex: 1,
                      background: "rgba(0,0,0,0.4)",
                      color: "white",
                      border: "none",
                      borderRadius: "50%",
                      width: "28px",
                      height: "28px",
                      cursor: "pointer",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      fontSize: "16px",
                      lineHeight: "1",
                    }}
                    aria-label="Anterior"
                  >
                    {"<"}
                  </button>
                  <button
                    onClick={handleNextImage}
                    style={{
                      position: "absolute",
                      right: "8px",
                      top: "50%",
                      transform: "translateY(-50%)",
                      zIndex: 1,
                      background: "rgba(0,0,0,0.4)",
                      color: "white",
                      border: "none",
                      borderRadius: "50%",
                      width: "28px",
                      height: "28px",
                      cursor: "pointer",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      fontSize: "16px",
                      lineHeight: "1",
                    }}
                    aria-label="Siguiente"
                  >
                    {">"}
                  </button>
                  <p
                    style={{
                      position: "absolute",
                      backgroundColor: "rgba(0,0,0,0.6)",
                      padding: "2px 8px",
                      borderRadius: "10px",
                      fontSize: 10,
                      color: "var(--cWhite)",
                      bottom: 8,
                      right: 8,
                      zIndex: 1,
                    }}
                  >
                    {currentImageIndex + 1} / {item.images.length}
                  </p>
                </>
              )}
            </div>
          )}

          {item.type === "D" && (
            <div
              style={{
                width: "100%",
                height: "144px",
                borderRadius: 8,
                backgroundColor: "var(--cBlackV3)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <IconPDF size={48} color="var(--cError)" />
            </div>
          )}

          {item.type === "V" && (
            <div
              style={{
                width: "100%",
                height: "144px",
                borderRadius: 8,
                backgroundColor: "var(--cBlackV3)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <IconVideo size={48} color="var(--cError)" />
            </div>
          )}

          <div
            style={{
              display: "flex",
              alignItems: "center",
              color: "var(--cSuccess)",
              gap: 4,
              marginTop: "8px",
            }}
          >
            <IconWorld size={20} />
            <p
              style={{
                width: "90%",
                overflow: "hidden",
                display: "-webkit-box",
                WebkitLineClamp: 1,
                WebkitBoxOrient: "vertical",
                textOverflow: "ellipsis",
                fontSize: "12px"
              }}
            >
              {getDestinys()?.join(", ")}
            </p>
          </div>

          {item?.title && (
            <p
              style={{
                color: "var(--cWhite)",
                fontWeight: 600,
                fontSize: 16,
                marginTop: "8px",
                 overflow: "hidden",
                display: "-webkit-box",
                WebkitLineClamp: 2,
                WebkitBoxOrient: "vertical",
                textOverflow: "ellipsis",
              }}
            >
              {item?.title}
            </p>
          )}

          {item?.description && (
            <p
              style={{
                color: "var(--cWhiteV1)",
                fontWeight: 400,
                fontSize: 14,
                wordBreak: "break-word",
                overflowWrap: "break-word",
                display: "-webkit-box",
                WebkitLineClamp: item.images && item.images.length > 0 ? 2 : (item?.title ? 2 : 8),
                WebkitBoxOrient: "vertical",
                overflow: "hidden",
                textOverflow: "ellipsis",
                marginTop: item?.title ? "4px" : "8px",
              }}
            >
              {item?.description}
            </p>
          )}
        </div>
        <div
          style={{
            display: "flex",
            alignItems: "center",
            marginTop: "auto",
            paddingTop: "8px",
            gap: 16,
            borderTop: "1px solid var(--cBlackV3)",
          }}
        >
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: "4px",
            }}
          >
            <IconLike />
            <p style={{ fontSize: 12, color: "var(--cWhiteV1)" }}>{item.likes}</p>
          </div>
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: "4px",
            }}
          >
            <IconComment />
            <p style={{ fontSize: 12, color: "var(--cWhiteV1)" }}>{item?.comments_count}</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default RenderCard;