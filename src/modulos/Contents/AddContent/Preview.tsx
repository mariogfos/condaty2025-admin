import { Avatar } from "@/mk/components/ui/Avatar/Avatar";
import ItemList from "@/mk/components/ui/ItemList/ItemList";
import styles from "./AddContent.module.css";
import React from "react";
import {
  IconComment,
  IconGallery,
  IconLike,
  IconShare,
} from "@/components/layout/icons/IconsBiblioteca";

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
    // avatar:
    //   "https://revistaverde.com.uy/wp-content/uploads/2020/03/lacalle-pou-presidente-3-20.jpg",
    name: "Nombre candidato",
    title: "Lorem ipsum dolor sit amet consectetur.",
    subtitle: "Presidente de la República Oriental del Uruguay",
    description:
      " Lorem ipsum dolor sit amet consectetur. Placerat augue id nulla risus ut ultrices. Vestibulum tristique commodo non proin dis.",
  };

  const candidate = extraData?.candidates?.find(
    (can: any) => formState?.candidate_id == can.id
  );
  // console.log(Object.keys(formState.avatar).length > 0);
  // console.log(formState.images[0].id);
  const nroImages = formState.id
    ? formState?.images?.length + Object.keys(formState?.avatar || {}).length
    : Object.keys(formState?.avatar || {}).length;
  const avatar =
    action == "edit" && formState?.images.length > 0
      ? getUrlImages(
          "/CONT-" +
            formState?.id +
            "-" +
            formState?.images[0]?.id +
            ".webp?d=" +
            formState?.updated_at
        )
      : "data:image/webp;base64," + formState?.avatar?.avatar0?.file;
  return (
    <div className={styles.Preview}>
      <div>
        <ItemList
          left={
            <Avatar
              hasImage={user?.has_image}
              src={getUrlImages(
                "/ADM-" + user?.id + ".webp?d=" + user?.updated_at
              )}
              name={getFullName(user) || dataFake.name}
            />
          }
          title={getFullName(user) || dataFake.name}
        />
        <section
          style={{ flexDirection: formState?.isType == "N" ? "row" : "column" }}
        >
          <div>
            {formState?.isType == "N" && (
              <p>{formState?.title || dataFake.title}</p>
            )}
            <span>{formState?.description || dataFake.description}</span>
          </div>
          {(formState?.isType == "N" ||
            (formState?.isType == "P" &&
              (formState.avatar || formState?.images?.length > 0))) && (
            <div>
              <div
                style={{
                  height: "184px",
                  width: formState?.isType == "N" ? " 180px" : "100%",
                  overflow: "hidden",
                  position: "relative",
                }}
              >
                {Object?.keys(formState?.avatar || {}).length > 0 ||
                formState?.images?.length > 0 ? (
                  <>
                    {(Object?.keys(formState?.avatar || {}).length > 1 ||
                      formState?.images?.length > 1) && (
                      <p
                        style={{
                          position: "absolute",
                          right: 8,
                          top: 12,
                          backgroundColor: "var(--cWhite)",
                          color: "var(--cBlack)",
                          borderRadius: 8,
                          padding: "2px 6px",
                        }}
                      >
                        +{nroImages - 1}
                      </p>
                    )}
                    <img src={avatar} alt="avatar" width="auto" height="100%" />
                  </>
                ) : (
                  <IconGallery />
                )}
              </div>
            </div>
          )}
        </section>
      </div>
      <div>
        <div>
          <IconLike color="var(--cWhiteV1)" />
          <p>Apoyar</p>
        </div>
        <div>
          <IconComment color="var(--cWhiteV1)" />
          <p>Comentar</p>
        </div>
        <div>
          <IconShare color="var(--cWhiteV1)" />
          <p>Compartir</p>
        </div>
      </div>
    </div>
  );
};

export default Preview;
