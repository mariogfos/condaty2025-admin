"use client";
import DataModal from "@/mk/components/ui/DataModal/DataModal";
import { useAuth } from "@/mk/contexts/AuthProvider";
import { useRouter } from "next/navigation";
import React, { useState } from "react";
import {
  IconArrowRight,
  IconLogo,
  IconSearch,
} from "../layout/icons/IconsBiblioteca";
import styles from "./ChooseClient.module.css";
import List from "@/mk/components/ui/List/List";
import { Avatar } from "@/mk/components/ui/Avatar/Avatar";
import { getUrlImages } from "@/mk/utils/string";
import Input from "@/mk/components/forms/Input/Input";
import Button from "@/mk/components/forms/Button/Button";

interface Props {
  open: boolean;
  onClose: () => void;
}
const ChooseClient = ({ open, onClose }: Props) => {
  const { user, getUser } = useAuth();
  const [searchTerm, setSearchTerm] = useState("");
  const router = useRouter();

  const onClick = async (id: any) => {
    await getUser(id);
    router.push("/");
  };

  const renderClient = (c: any) => {
    return (
      <div
        key={c.id}
        className={styles.clientItem}
        onClick={() => onClick(c.id)}
      >
        <div className={styles.clientInfo}>
          <Avatar
            src={c.url_banner?.[0]}
            name={c.name}
            hasImage={c.has_image}
            style={{ width: 40, height: 40, borderRadius: "50%" }}
          />
          <div className={styles.clientText}>
            <span className={styles.clientType}>
              {c.type == "C"
                ? "Condominio"
                : c.type == "U"
                  ? "Urbanización"
                  : "Edificio"}
            </span>
            <span className={styles.clientName}>{c.name}</span>
          </div>
        </div>
        <div className={styles.arrowIcon}>
          <IconArrowRight size={16} color="var(--cWhiteV1)" />
        </div>
      </div>
    );
  };

  // Filter clients as per user requirement
  const allClients = user?.clients || [];

  const filteredClients = allClients.filter((client: any) =>
    client.name.toLowerCase().includes(searchTerm.toLowerCase()),
  );

  const showSearch = allClients.length > 6;

  // No renderizar si no hay usuario, si el modal no está abierto, o si está en proceso de logout
  if (!user || !open || user?.id === "0") return null;

  return (
    <DataModal
      title=""
      open={open}
      onClose={onClose}
      buttonText=""
      buttonCancel=""
      iconClose={user?.client_id ? undefined : false}
      fullScreen={user?.client_id ? false : true}
      className={styles.modalFullScreen}
      style={{ backgroundColor: "#1a1a1a" }}
    >
      <div className={styles.container}>
        <div className={styles.leftPanel}>
          <div className={styles.logoContainer}>
            <IconLogo size={98} />
          </div>
          <h1 className={styles.title}>¡Bienvenido a Condaty!</h1>
          <p className={styles.subtitle}>
            ¿Qué condominio quieres administrar hoy?
          </p>
        </div>
        <div className={styles.rightPanel}>
          <div className={styles.listContainer}>
            {showSearch && (
              <div className={styles.searchContainer}>
                <Input
                  name="search"
                  value={searchTerm}
                  onChange={(e: any) => setSearchTerm(e.target.value)}
                  placeholder="Buscar por nombre..."
                  className={styles.searchInput}
                  iconRight={<IconSearch size={20} color="var(--cWhiteV1)" />}
                />
              </div>
            )}
            <List
              data={filteredClients}
              renderItem={renderClient}
              className={`${styles.clientList} ${
                filteredClients.length > 6 ? styles.clientListMasked : ""
              }`}
            />
            {user?.client_id && (
              <div
                style={{
                  marginTop: 16,
                  display: "flex",
                  justifyContent: "center",
                }}
              >
                <Button
                  onClick={onClose}
                  style={{
                    backgroundColor: "rgba(255,255,255,0.1)",
                    color: "white",
                    width: "100%",
                  }}
                >
                  Volver
                </Button>
              </div>
            )}
          </div>
        </div>
      </div>
    </DataModal>
  );
};

export default ChooseClient;
