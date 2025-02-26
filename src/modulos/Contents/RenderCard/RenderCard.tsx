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
import React, { useState } from "react";
import styles from "./RenderCard.module.css";

type PropsType = {
  extraData: any;
  item: any;
  onClick: any;
  onEdit: any;
  onDel: any;
};

const RenderCard = ({ extraData, item, onClick, onEdit, onDel }: PropsType) => {
  const [openDrop, setOpenDrop]: any = useState({ open: false, item: null });
  const candidate = extraData?.candidates.find(
    (c: any) => c.id == item?.candidate_id
  );
  const typeCand = extraData?.typeCands.find(
    (t: any) => t.id == candidate?.typecand_id
  );

  const getDestinys = () => {
    const names: any = [];
    if (item?.destiny == 0) {
      names.push("Todos");
    }
    if (item?.destiny == 2) {
      extraData?.listas.map((li: any) => {
        let d = item?.cdestinies.find((e: any) => e.lista_id == li.id);
        if (d) {
          names.push(li.name);
        }
      });
    }
    if (item?.destiny == 3) {
      extraData?.dptos.map((dpto: any) => {
        let d = item?.cdestinies.find((e: any) => e.dpto_id == dpto.id);
        if (d) {
          names.push(dpto.name);
        }
      });
    }
    if (item?.destiny == 4) {
      extraData?.muns.map((mun: any) => {
        let d = item?.cdestinies.find((e: any) => e.mun_id == mun.id);
        if (d) {
          names.push(mun.name);
        }
      });
    }
    if (item?.destiny == 5) {
      names.push("Barrio");
    }
    return names;
  };

  return (
    <div onClick={() => onClick(item)} className={styles.renderCard}>
      <div>
        <div>
          <div>
            <Avatar
              name={getFullName(candidate)}
              src={getUrlImages(
                "/CAND-" + candidate?.id + ".webp?d=" + candidate?.updated_at
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
                {getFullName(candidate)}
              </p>
              <p style={{ fontSize: 12 }}>{typeCand?.name}</p>
            </div>
            <div
              style={{ position: "relative" }}
              onClick={(e) => {
                e.stopPropagation();
                setOpenDrop({ open: !openDrop.open, item: item });
              }}
            >
              <IconOptions />
              {openDrop.open && item.id == openDrop?.item.id && (
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
                    }}
                  >
                    <IconTrash />
                    <p>Eliminar</p>
                  </div>
                </div>
              )}
            </div>
          </div>
          {((item.type == "I" && item.images.length > 0) ||
            item.type == "D" ||
            item.type == "V") && (
            <div
              style={{
                overflow: "hidden",
                width: "100%",
                height: "144px",
                borderRadius: 8,
                backgroundColor: "var(--cBlackV3)",
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                justifyContent: "center",
                position: "relative",
              }}
            >
              {item.type == "I" && (
                <>
                  {item.images.length > 1 && (
                    <p
                      style={{
                        position: "absolute",
                        backgroundColor: "var(--cWhite)",
                        padding: "2px 6px",
                        borderRadius: 8,
                        fontSize: 12,
                        color: "var(--cBlack)",
                        top: 8,
                        right: 8,
                      }}
                    >
                      +{item.images.length - 1}
                    </p>
                  )}
                  <img
                    style={{ width: "100%", height: "auto" }}
                    src={getUrlImages(
                      "/CONT-" +
                        item.id +
                        "-" +
                        item.images[0]?.id +
                        ".webp" +
                        "?" +
                        item?.updated_at
                    )}
                  />
                </>
              )}
              {item.type == "D" && <IconPDF size={48} color="var(--cError)" />}
              {item.type == "V" && (
                <IconVideo size={48} color="var(--cError)" />
              )}
            </div>
          )}
          <div
            style={{
              display: "flex",
              alignItems: "center",
              color: "var(--cSuccess)",
              gap: 4,
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
              }}
            >
              {item?.title}
            </p>
          )}
          {item?.description && !item?.title && (
            <p
              style={{
                color: "var(--cWhiteV1)",
                fontWeight: 400,
                fontSize: 14,
                wordBreak: "break-all",
                overflowWrap: "break-word",
                display: "-webkit-box",
                WebkitLineClamp: item.images.length > 0 ? 2 : 8,
                WebkitBoxOrient: "vertical",
                width: "90%",
                overflow: "hidden",
                textOverflow: "ellipsis",
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
            marginTop: 8,
            gap: 16,
          }}
        >
          <div
            style={{
              display: "flex",
              alignItems: "center",
            }}
          >
            <IconLike />
            <p style={{ fontSize: 12 }}>{item.likes}</p>
          </div>
          <div
            style={{
              display: "flex",
              alignItems: "center",
            }}
          >
            <IconComment />
            <p style={{ fontSize: 12 }}>{item?.comments_count}</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default RenderCard;
