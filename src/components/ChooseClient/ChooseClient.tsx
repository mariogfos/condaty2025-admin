"use client";
import DataModal from "@/mk/components/ui/DataModal/DataModal";
import { useAuth } from "@/mk/contexts/AuthProvider";
import { useRouter } from "next/navigation";
import React, { useState } from "react";
import { IconCheckSquare, IconLogo } from "../layout/icons/IconsBiblioteca";
import styles from "./ChooseClient.module.css";
import List from "@/mk/components/ui/List/List";
import ItemList from "@/mk/components/ui/ItemList/ItemList";
import { Avatar } from "@/mk/components/ui/Avatar/Avatar";
import { getUrlImages } from "@/mk/utils/string";

interface Props {
  open: boolean;
  onClose: () => void;
}
const ChooseClient = ({ open, onClose }: Props) => {
  const { user, getUser } = useAuth();

  const [sel, setSel] = useState(null);
  const router = useRouter();
  const onSave = () => {
    if (!sel) return;
    getUser(sel);
    router.push("/");
  };
  const onClick = (id: any) => {
    if (sel == id) {
      setSel(null);
      return;
    }
    setSel(id);
  };
  const renderClient = (c: any) => {
    let isClient = user?.client_id == c.id;
    return (
      <ItemList
        key={c.id}
        onClick={() => (isClient ? {} : onClick(c.id))}
        variant="V1"
        title={c.name}
        subtitle={
          c.type == "C"
            ? "Condominio"
            : c.type == "U"
            ? "Urbanización"
            : "Edificio"
        }
        left={
          <Avatar
            src={getUrlImages("/CLIENT-" + c.id + ".webp?d=")}
            name={c.name}
          />
        }
        right={
          isClient ? (
            <p
              style={{
                backgroundColor: "var(--cHoverSuccess)",
                fontSize: 12,
                border: "1px solid var(--cSuccess)",
                borderRadius: 4,
                color: "var(--cSuccess)",
                width: "100%",
                padding: "4px 8px",
                whiteSpace: "nowrap",
              }}
            >
              Sesión activa
            </p>
          ) : (
            sel == c.id && <IconCheckSquare color="var(--cSuccess)" />
          )
        }
      />
    );
  };

  const activeClients = user.clients
    .filter(
      (client: any) =>
        client?.pivot?.status === "P" || client?.pivot?.status === "A"
    )
    .sort((a: any, b: any) => {
      const isActiveA: any = a.id === user.client_id;
      const isActiveB: any = b.id === user.client_id;
      return isActiveB - isActiveA;
    });

  const pendingClients = user.clients.filter(
    (client: any) =>
      client?.pivot?.status !== "P" && client?.pivot?.status !== "A"
  );
  return (
    <DataModal
      title="Seleccionar condominio"
      open={open}
      onClose={onClose}
      onSave={onSave}
      buttonText="Continuar"
      buttonCancel=""
      iconClose={false}
      fullScreen={true}
    >
      <div className={styles.container}>
        <div className={styles.logoContainer}>
          <IconLogo size={98} />
        </div>
        <h1 className={styles.title}>Bienvenido a Condaty</h1>
        <p className={styles.subtitle}>
          Para acceder a la información y las funciones de tu comunidad,
          selecciona en el condominio que trabajarás hoy
        </p>
        <p className={styles.selectText}>Selecciona el condominio</p>
        <div className={styles.clientList}>
          <List data={user?.clients} renderItem={renderClient} />
        </div>
      </div>
    </DataModal>
  );
};

export default ChooseClient;
