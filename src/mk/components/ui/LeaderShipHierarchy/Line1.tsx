/* eslint-disable react-hooks/exhaustive-deps */
"use client";
import React, { useEffect, useState } from "react";
import { Card } from "../Card/Card";
import { getFullName, getUrlImages } from "@/mk/utils/string";
import { Avatar } from "../Avatar/Avatar";
import styles from "./LLeaderShipHierarchy.module.css";
import {
  IconAdd,
  IconStarProfile,
} from "@/components/layout/icons/IconsBiblioteca";
import { useRouter } from "next/navigation";
import DetailUsers from "@/modulos/PartyStructure/DetailUsers";

interface Props {
  line1: any;
  level: number;
  user: any;
  addClick: any;
  params: any;
  userCan?: any;
}
const Line1 = ({
  line1,
  level,
  user,
  addClick,
  params,
  userCan = () => true,
}: Props) => {
  const [mainLeader, setMainLeader]: any = useState(
    line1?.find((leader: any) => leader.main === "M")
  );
  const router = useRouter();
  const [userId, setUserId]: any = useState(null);
  const [otherLeaders, setOtherLeaders] = useState([]);
  useEffect(() => {
    if (line1 && line1.length > 0) {
      // Encontrar el primer líder con main === "M"
      const main = line1.find((leader: any) => leader.main === "M");

      if (main) {
        setMainLeader(main);
        // Filtrar al resto de líderes excluyendo el mainLeader encontrado
        setOtherLeaders(line1.filter((leader: any) => leader.ci !== main.ci));
      } else {
        // Si no hay mainLeader, todos los líderes se consideran otros líderes
        setMainLeader(null);
        setOtherLeaders(line1);
      }
    } else {
      // Si line1 no tiene datos, resetea los estados
      setMainLeader(null);
      setOtherLeaders([]);
    }
  }, [line1]);
  return (
    <Card
      style={{
        width: "100%",
        display: "flex",
        alignItems: "center",
        paddingLeft: 16,
        paddingRight: 16,
        paddingTop: 24,
        paddingBottom: 24,
      }}
    >
      <div style={{ width: "100%", display: "flex" }}>
        {mainLeader ? (
          <div
            style={{
              display: "flex",
              alignItems: "center",
              width: 370,
              cursor: "pointer",
            }}
            onClick={() => {
              setUserId(mainLeader.user_id);
            }}
          >
            <div className={styles["mainCard"]}>
              <div style={{ marginBottom: -25 }}>
                <Avatar
                  name={getFullName(mainLeader)}
                  src={getUrlImages(
                    "/ADM-" +
                      mainLeader?.user_id +
                      ".webp?d=" +
                      mainLeader?.user_updated_at
                  )}
                  style={{ cursor: "pointer" }}
                />
                <div style={{ position: "relative", top: -50, left: 30 }}>
                  <IconStarProfile />
                </div>
              </div>
              <div
                className="tTitle"
                style={{ fontSize: 16, marginTop: 8, textAlign: "center" }}
              >
                {getFullName(mainLeader)}
              </div>
              <div style={{ color: "var(--cBlackV2)", textAlign: "center" }}>
                {mainLeader?.role} <br />
                CI: {mainLeader.ci}
              </div>
            </div>
            {/* {user?.role?.level === level &&
              user?.ci == mainLeader.ci &&
              userCan("users", "C") && (
                <div
                  style={{
                    border: "1px dashed var(--cWhiteV2)",
                    padding: "var(--sM)",
                  }}
                >
                  <div className={styles["addButton"]}>
                    <IconAdd
                      size={16}
                      onClick={() => addClick({ id: params.searchBy }, 1)}
                    />
                  </div>
                </div>
              )} */}
          </div>
        ) : (
          <>
            <div
              style={{
                // color: "var(--cError)",
                textAlign: "center",
                fontSize: "var(--spM)",
                maxWidth: 120,
                height: 60,
                display: "flex",
                alignItems: "center",
              }}
            >
              Sin miembro registrado
            </div>
            {/* {user?.role?.level === level && user?.ci == mainLeader?.ci && (
              <div
                style={{
                  border: "1px dashed var(--cWhiteV2)",
                  padding: "var(--sM)",
                }}
              >
                <div className={styles["addButton"]}>
                  <IconAdd
                    size={16}
                    onClick={() => addClick({ id: params.searchBy }, 1)}
                  />
                </div>
              </div>
            )} */}
          </>
        )}

        <div
          className={styles["carouselCards"]}
          style={{
            borderLeft: "2px solid var(--cWhiteV2)",
            marginLeft: 8,
            display: "flex",
            alignItems: "center",
          }}
        >
          {user?.role?.level === level &&
            user?.ci == mainLeader?.ci &&
            userCan("users", "C") && (
              <div
                style={{
                  border: "1px dashed var(--cWhiteV2)",
                  padding: "var(--sM)",
                  height: 80,
                  width: 80,
                  display: "flex",
                  justifyContent: "center",
                  marginLeft: 8,
                }}
              >
                <div
                  className={styles["addButton"]}
                  onClick={() => addClick({ id: params.searchBy }, 1)}
                >
                  <IconAdd size={16} />
                </div>
              </div>
            )}
          {otherLeaders?.map((leader: any, index: number) => (
            <div
              key={index}
              className={styles["mainCardContainer"]}
              style={{ cursor: "pointer" }}
              onClick={(e) => {
                e.preventDefault();
                setUserId(leader.user_id);
              }}
            >
              <div className={styles["mainCard"]}>
                <Avatar
                  name={getFullName(leader)}
                  src={getUrlImages(
                    "/ADM-" + leader.user_id + ".webp?d=" + leader.updated_at
                  )}
                  onClick={(e) => {
                    e.preventDefault();
                    setUserId(leader.user_id);
                  }}
                />
                <div className="tTitle" style={{ fontSize: 16, marginTop: 8 }}>
                  {getFullName(leader)}
                </div>
                <p style={{ color: "var(--cBlackV2)" }}>
                  {leader?.role} <br /> CI: {leader?.ci}
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>
      {userId && (
        <DetailUsers open={true} close={() => setUserId(null)} id={userId} />
      )}
    </Card>
    // <div></div>
  );
};

export default Line1;
