import { Avatar } from "@/mk/components/ui/Avatar/Avatar";
import DataModal from "@/mk/components/ui/DataModal/DataModal";
import ItemList from "@/mk/components/ui/ItemList/ItemList";
import { getFullName, getUrlImages } from "@/mk/utils/string";
import styles from "../Contents.module.css";
import {
  IconArrowLeft,
  IconArrowRight,
  IconComment,
  IconDocs,
  IconLike,
  IconPDF,
} from "@/components/layout/icons/IconsBiblioteca";
import { getDateStrMes } from "@/mk/utils/date";
import List from "@/mk/components/ui/List/List";
import ReactPlayer from "react-player";
import { useState } from "react";

import { useAuth } from "@/mk/contexts/AuthProvider";

const RenderView = (props: {
  open: boolean;
  onClose: any;
  item: Record<string, any>;
  onConfirm?: Function;
  extraData?: any;
}) => {
  const { data } = props?.item;
  const extraData = props?.extraData;
  const [idOpenAff, setIdOpenAff]: any = useState({ open: false, id: "" });
  const entidad = [
    "",
    "",
    "Organizacion",
    "Departamento",
    "Municipio",
    "Barrio",
  ];
  const { user } = useAuth();
  const [isExpanded, setIsExpanded] = useState(false);
  console.log(data, "data 41 renderviewcontents");
  const toggleExpanded = () => setIsExpanded(!isExpanded);

  const commentList = (item: any) => {
    if (item?.affiliate == null) {
      return;
    }
    return (
      <ItemList
        title={getFullName(item.affiliate)}
        subtitle={item?.comment}
        left={
          <Avatar
            hasImage={item?.affiliate?.has_image}
            onClick={() => setIdOpenAff({ open: true, id: item.affiliate.id })}
            name={getFullName(item.affiliate)}
            src={getUrlImages(
              "/AFF-" +
                item?.affiliate?.id +
                ".webp?d=" +
                item?.affiliate?.updated_at
            )}
          />
        }
      />
    );
  };

  const [indexVisible, setIndexVisible] = useState(0);
  const nextIndex = () => {
    setIndexVisible((prevIndex) => (prevIndex + 1) % data?.images?.length);
  };
  const prevIndex = () => {
    setIndexVisible((prevIndex) =>
      prevIndex === 0 ? data?.images?.length - 1 : prevIndex - 1
    );
  };
  // const getDestinys = () => {
  //   let lEntidad: any = [];
  //   data.cdestinies.map((item: any, index: number) => {
  //     if (data.destiny == 2) {
  //       lEntidad.push({
  //         id: item.lista_id,
  //         name: extraData.listas.find((lista: any) => lista.id == item.lista_id)
  //           ?.name,
  //       });
  //     }
  //     if (data.destiny == 3) {
  //       lEntidad.push({
  //         id: item.dpto_id,
  //         name: extraData.dptos.find((dpto: any) => dpto.id == item.dpto_id)
  //           ?.name,
  //       });
  //     }
  //     if (data.destiny == 4) {
  //       lEntidad.push({
  //         id: item.mun_id,
  //         name: extraData.muns.find((mun: any) => mun.id == item.mun_id)?.name,
  //       });
  //     }
  //     if (data.destiny == 5) {
  //       lEntidad.push({
  //         id: item.barrio_id,
  //         name: extraData.barrios?.find(
  //           (barrio: any) => barrio.id == item.barrio_id
  //         )?.name,
  //       });
  //     }
  //   });
  //   return lEntidad;
  // };

  const getIconTypeFile = (item: any) => {
    if (item === "pdf") {
      return (
        <div
          style={{
            cursor: "pointer",
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.backgroundColor = "var(--cBlackV2)";
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.backgroundColor = "transparent";
          }}
        >
          <div
            style={{
              display: "flex",
              flexDirection: "column",
              justifyContent: "center",
              alignItems: "center",
            }}
          >
            <IconPDF size={64} />
            <div
              style={{ color: "var(--cInfo)", textDecorationLine: "underline" }}
            >
              Abrir
            </div>
          </div>
        </div>
      );
    }
    return (
      <div
        style={{
          cursor: "pointer",
        }}
        onMouseEnter={(e) => {
          e.currentTarget.style.backgroundColor = "var(--cBlackV2)";
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.backgroundColor = "transparent";
        }}
      >
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            justifyContent: "center",
            alignItems: "center",
          }}
        >
          <IconDocs size={64} />
          <div
            style={{ color: "var(--cInfo)", textDecorationLine: "underline" }}
          >
            Abrir
          </div>
        </div>
      </div>
    );
  };

  // console.log(user?.role.level, data?.destiny);
  return (
    <>
      <DataModal
        open={props.open}
        onClose={props?.onClose}
        title={"Detalle de la noticia"}
        buttonText=""
        buttonCancel=""
      >
        <div className={styles.container}>
          <div className={styles.content}>
            {/* {data?.destiny != 0 && user?.role.level != data?.destiny && (
              <p style={{ marginBottom: 12, color: "var(--cInfo)" }}>
                Destino:{" "}
                {entidad[data.destiny] +
                  `${
                    getDestinys().length > 1
                      ? data.destiny == 2
                        ? "es"
                        : "s"
                      : ""
                  }`}{" "}
                {getDestinys()
                  .map((e: any) => e.name)
                  .join(", ")}
              </p>
            )} */}
            <ItemList
              title={getFullName(user)}
              subtitle={
                <>
                  {/* <div>{data?.user?.role1[0]?.name}</div>
                  <div>{getDateStrMes(props?.item?.data?.created_at)}</div> */}
                </>
              }
              left={
                <Avatar
                  hasImage={user?.has_image}
                  name={getFullName(user)}
                  src={getUrlImages(
                    "/ADM-" + user?.id + ".webp?d=" + user?.updated_at
                  )}
                />
              }
            />
            <p className={isExpanded ? undefined : styles.truncatedText}>
              {props?.item?.data?.description}
            </p>
            <p
              style={{
                color: "var(--cAccent)",
                cursor: "pointer",
                width: 100,
                fontWeight: 600,
              }}
              onClick={toggleExpanded}
            >
              {isExpanded ? "Ver menos" : "Ver más"}
            </p>
            <section className={styles["renderViewImage"]}>
              {props?.item?.data?.type == "I" && (
                <>
                  {data?.images?.length > 1 && (
                    <div
                      style={{
                        display: "flex",
                        position: "absolute",
                        justifyContent: "space-between",
                        padding: "0px 16px",
                        alignItems: "center",
                        width: "100%",
                        gap: 24,
                      }}
                    >
                      <div
                        style={{
                          backgroundColor: "#11111166",
                          padding: "6px",
                          borderRadius: "100%",
                          display: "flex",
                          justifyContent: "center",
                          alignItems: "center",
                        }}
                        onClick={prevIndex}
                      >
                        <IconArrowLeft />
                      </div>
                      <div
                        style={{
                          backgroundColor: "#11111166",
                          padding: "6px",
                          borderRadius: "100%",
                          display: "flex",
                          justifyContent: "center",
                          alignItems: "center",
                        }}
                        onClick={nextIndex}
                      >
                        <IconArrowRight />
                      </div>
                    </div>
                  )}

                  {data.images[indexVisible]?.id ? (
                    <img
                      alt=""
                      style={{
                        resize: "inherit",
                        objectFit: "contain",
                        display: "block",
                        width: "100%",
                        height: "100%",
                      }}
                      src={getUrlImages(
                        "/CONT-" +
                          data.id +
                          "-" +
                          data.images[indexVisible]?.id +
                          ".webp" +
                          "?" +
                          data?.updated_at
                      )}
                    />
                  ) : (
                    "Noticia sin imagen"
                  )}
                </>
              )}

              {props?.item?.data?.type == "D" && (
                <>
                  <a
                    style={{ color: "white" }}
                    target="_blank"
                    href={getUrlImages(
                      "/CONT-" +
                        data?.id +
                        "." +
                        data?.url +
                        "?d=" +
                        data?.updated_at
                    )}
                  >
                    {getIconTypeFile(data?.url)}
                  </a>
                </>
              )}
              {props?.item?.data?.type == "V" && (
                <ReactPlayer
                  url={data?.url}
                  width="100%"
                  height={480}
                  controls
                />
              )}
            </section>
          </div>
          <section className={styles["reactionsSection"]}>
            <div>
              <div>
                <div>Apoyos</div>
                <div>
                  <IconLike color="var(--cAccent)" />
                  {props?.item?.data?.likes}
                </div>
              </div>
              <div>
                <div>Comentarios</div>
                <div>
                  <IconComment />
                  {props?.item?.data?.comments?.length}
                </div>
              </div>
            </div>
            {props?.item?.data?.comments?.length > 0 && (
              <>
                <h2>Comentarios:</h2>
                <List
                  data={props?.item?.data?.comments}
                  renderItem={commentList}
                />
              </>
            )}
          </section>
        </div>
      </DataModal>
      {/* {idOpenAff.open && (
        <DetailAffiliate
          open={idOpenAff.open}
          close={() => setIdOpenAff({ open: false, id: 0 })}
          id={idOpenAff.id}
        />
      )} */}
    </>
  );
};

export default RenderView;
