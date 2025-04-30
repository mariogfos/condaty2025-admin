import DataModal from "@/mk/components/ui/DataModal/DataModal";
import React from "react";
import styles from "./WidgetCandidates.module.css";
import { Avatar } from "@/mk/components/ui/Avatar/Avatar";
import { getFullName, getUrlImages } from "@/mk/utils/string";
import useAxios from "@/mk/hooks/useAxios";
import LoadingScreen from "@/mk/components/ui/LoadingScreen/LoadingScreen";
import {
  IconBorn,
  IconCandidates,
  IconFacebook,
  IconInstagram,
  IconLinkedin,
  IconPDF,
  IconProfession,
  IconTwitter,
  IconX,
} from "@/components/layout/icons/IconsBiblioteca";
import { lIdeologies } from "@/mk/utils/utils";

type PropsDetailCandidate = {
  open: boolean;
  close: () => void;
  id: string;
};

const DetailCandidate = ({ open, close, id }: PropsDetailCandidate) => {
  const { data: candidate, loaded } = useAxios("/candidates", "GET", {
    searchBy: id,
    fullType: "DET",
  });
  const { data: extraData } = useAxios("/candidates", "GET", {
    fullType: "EXTRA",
    searchBy: "",
  });

  return (
    <DataModal
      open={open}
      onClose={() => close()}
      title={!loaded ? "Cargando..." : "Detalle del candidato"}
      buttonText=""
      buttonCancel=""
    >
      <LoadingScreen loaded={loaded} onlyLoading={true}>
        <div className={styles.container}>
          <div style={{ position: "relative" }}>
            <div
              style={{
                width: "100%",
                overflow: "hidden",
                height: "300px",
                borderRadius: 8,
              }}
            >
              <img
                src={getUrlImages(
                  "/PCAND-" +
                    candidate?.data[0]?.id +
                    ".webp?d=" +
                    candidate?.data[0]?.updated_at
                )}
                alt={candidate?.data[0]?.name}
                style={{
                  width: "100%",
                  height: "auto",
                  overflow: "visible",
                  borderRadius: 8,
                }}
              />
            </div>
            <Avatar
              className={styles.avatar}
              name={candidate?.data[0]?.name}
              src={getUrlImages(
                "/CAND-" +
                  candidate?.data[0]?.id +
                  ".webp?d=" +
                  candidate?.data[0]?.updated_at
              )}
              h={140}
              w={140}
              style={{
                position: "absolute",
                bottom: -60,
                left: 24,
              }}
            />
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
            <div>
              <div
                style={{
                  marginTop: 60,
                  color: "var(--cWhite)",
                  fontSize: 20,
                  fontWeight: 600,
                }}
              >
                {getFullName(candidate?.data[0])}
              </div>
              <div className={styles.description}>
                {candidate?.data[0].title}
              </div>
            </div>
            <div>
              <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                <IconCandidates color="var(--cBlackV2)" />
                <div className={styles.subtitle}>
                  {
                    extraData?.data?.typeCands?.find(
                      (e: any) => e.id == candidate?.data[0]?.typecand_id
                    )?.name
                  }
                </div>
              </div>
              <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                <IconProfession color="var(--cBlackV2)" />
                <div className={styles.subtitle}>
                  {candidate?.data[0].profession}
                </div>
              </div>
              <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                <IconBorn color="var(--cBlackV2)" />
                <div className={styles.subtitle}>
                  {"Nació en " + candidate?.data[0].born}
                </div>
              </div>
            </div>
            {candidate?.data[0].facebook?.length > 0 ||
            candidate?.data[0].instagram?.length > 0 ||
            candidate?.data[0].linkedin?.length > 0 ||
            candidate?.data[0].twitter?.length > 0 ? (
              <>
                <div
                  style={{
                    fontSize: "var(--sL)",
                    marginBottom: 0,
                    color: "var(--cWhite)",
                    fontWeight: 600,
                  }}
                >
                  Redes sociales
                </div>
                <div
                  style={{
                    display: "flex",
                    flexDirection: "row",
                    gap: 12,
                    alignItems: "center",
                  }}
                >
                  {candidate?.data[0].twitter?.length > 0 && (
                    <div
                      style={{
                        backgroundColor: "var(--cBlackV1)",
                        padding: 4,
                        borderRadius: 8,
                        cursor: "pointer",
                      }}
                      onClick={() => {
                        const url = candidate?.data[0].twitter; // Obtiene la URL de la red social
                        if (url) {
                          window.open(url, "_blank"); // Abre el enlace en una nueva pestaña
                        } else {
                          console.error(
                            "No se encontró la URL de la red social."
                          );
                        }
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.backgroundColor =
                          "var(--cBlackV3)";
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.backgroundColor =
                          "var(--cBlackV1)";
                      }}
                    >
                      <IconTwitter />
                    </div>
                  )}
                  {candidate?.data[0].linkedin?.length > 0 && (
                    <div
                      style={{
                        backgroundColor: "var(--cBlackV1)",
                        padding: 4,
                        borderRadius: 8,
                        cursor: "pointer",
                      }}
                      onClick={() => {
                        const url = candidate?.data[0].linkedin; // Obtiene la URL de la red social
                        if (url) {
                          window.open(url, "_blank"); // Abre el enlace en una nueva pestaña
                        } else {
                          console.error(
                            "No se encontró la URL de la red social."
                          );
                        }
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.backgroundColor =
                          "var(--cBlackV3)";
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.backgroundColor =
                          "var(--cBlackV1)";
                      }}
                    >
                      <IconLinkedin />
                    </div>
                  )}
                  {candidate?.data[0].facebook?.length > 0 && (
                    <div
                      style={{
                        backgroundColor: "var(--cBlackV1)",
                        padding: 4,
                        borderRadius: 8,
                        cursor: "pointer",
                      }}
                      onClick={() => {
                        const url = candidate?.data[0].facebook; // Obtiene la URL de la red social
                        if (url) {
                          window.open(url, "_blank"); // Abre el enlace en una nueva pestaña
                        } else {
                          console.error(
                            "No se encontró la URL de la red social."
                          );
                        }
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.backgroundColor =
                          "var(--cBlackV3)";
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.backgroundColor =
                          "var(--cBlackV1)";
                      }}
                    >
                      <IconFacebook />
                    </div>
                  )}
                  {candidate?.data[0].instagram?.length > 0 && (
                    <div
                      style={{
                        backgroundColor: "var(--cBlackV1)",
                        padding: 4,
                        borderRadius: 8,
                        cursor: "pointer",
                      }}
                      onClick={() => {
                        const url = candidate?.data[0].instagram; // Obtiene la URL de la red social
                        if (url) {
                          window.open(url, "_blank"); // Abre el enlace en una nueva pestaña
                        } else {
                          console.error(
                            "No se encontró la URL de la red social."
                          );
                        }
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.backgroundColor =
                          "var(--cBlackV3)";
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.backgroundColor =
                          "var(--cBlackV1)";
                      }}
                    >
                      <IconInstagram />
                    </div>
                  )}
                </div>
              </>
            ) : null}
            <div>
              {candidate?.data[0].profession && (
                <div>
                  <div className={styles.titleDetail}>Profesión:</div>
                  <div
                    className={styles.subtitleDetail}
                    style={{ marginBottom: 12 }}
                  >
                    {candidate?.data[0].profession}
                  </div>
                </div>
              )}
              <div>
                <div className={styles.titleDetail}>Ideología política</div>
                <div
                  className={styles.subtitleDetail}
                  style={{ marginBottom: 12 }}
                >
                  {lIdeologies[candidate?.data[0].ideology]?.name}
                </div>
              </div>
              {candidate?.data[0].biography && (
                <div>
                  <div className={styles.titleDetail}>Biografía</div>
                  <div
                    style={{ marginBottom: 12 }}
                    className={styles.subtitleDetail}
                  >
                    {candidate?.data[0].biography}
                  </div>
                </div>
              )}

              {candidate?.data[0].experience && (
                <div>
                  <div className={styles.titleDetail}>Experiencia política</div>
                  <div
                    className={styles.subtitleDetail}
                    style={{ marginBottom: 12 }}
                  >
                    {candidate?.data[0].experience}
                  </div>
                </div>
              )}
              <div>
                <div className={styles.titleDetail}>Plan de gobierno</div>
                <div
                  className={styles.subtitleDetail}
                  style={{ marginTop: 12 }}
                >
                  <a
                    href={getUrlImages(
                      "/PLAN-" +
                        candidate?.data[0].id +
                        ".pdf?d=" +
                        candidate?.data[0].updated_at
                    )}
                    target="_blank"
                    rel="noopener noreferrer"
                    download
                    style={{
                      display: "inline-flex",
                      alignItems: "center",
                      textDecoration: "none",
                      color: "var(--cInfo)",
                    }}
                  >
                    <div
                      style={{
                        display: "flex",
                        gap: 8,
                        flexDirection: "row",
                        alignItems: "center",
                        backgroundColor: "var(--cBlackV1)",
                        padding: 8,
                        borderRadius: 12,
                        cursor: "pointer",
                        transition: "background-color 0.2s ease",
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.backgroundColor =
                          "var(--cBlackV3)";
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.backgroundColor =
                          "var(--cBlackV1)";
                      }}
                    >
                      <IconPDF />
                      <span style={{ textDecorationLine: "underline" }}>
                        Descargar PDF
                      </span>
                    </div>
                  </a>
                </div>
              </div>
            </div>
          </div>
        </div>
      </LoadingScreen>
    </DataModal>
  );
};

export default DetailCandidate;
