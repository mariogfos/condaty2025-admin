"use client";
import DataModal from "@/mk/components/ui/DataModal/DataModal";
import { useAuth } from "@/mk/contexts/AuthProvider";
import React, { useState } from "react";
import {
  IconArrowRight,
  IconLogo,
  IconSearch,
} from "../layout/icons/IconsBiblioteca";
import styles from "./ChooseClient.module.css";
import List from "@/mk/components/ui/List/List";
import { Avatar } from "@/mk/components/ui/Avatar/Avatar";
import Input from "@/mk/components/forms/Input/Input";
import Button from "@/mk/components/forms/Button/Button";
import { useScopedI18n } from "@/i18n/useScopedI18n";

import { StatusBadge } from "../StatusBadge/StatusBadge";

interface Props {
  open: boolean;
  onClose: () => void;
}
const ChooseClient = ({ open, onClose }: Props) => {
  const { user, getUser } = useAuth();
  const [searchTerm, setSearchTerm] = useState("");
  const { translate } = useScopedI18n("chooseClient");

  /**
   * Cambiar de condominio RECARGA LA PÁGINA ENTERA.
   *
   * 🔴 Antes hacía `router.push("/")` —navegación del lado del cliente— y avisaba
   * al dashboard con `reLoadDashboard`. Eso refresca lo que se acuerda de
   * escuchar ese flag, y **deja pegado todo lo demás**: componentes que piden sus
   * datos una vez al montarse siguen mostrando los del condominio anterior hasta
   * que el usuario aprieta F5.
   *
   * Medido por Mario el 2026-08-13: entró a otro condominio y el aviso de
   * configuración seguía mostrando los faltantes del anterior. El aviso era el
   * síntoma visible; el problema es general — cualquier pantalla que no escuche
   * el flag queda con datos de otro condominio, que en un sistema multi-tenant
   * es de las cosas peores que pueden pasar.
   *
   * Con `window.location.href` el documento se carga de nuevo: se rearma el
   * estado, se rehacen TODAS las peticiones y no hay nada que pueda quedar
   * viejo. Es más lento que una navegación cliente, y esa lentitud es el precio
   * correcto por no mostrar datos del condominio equivocado.
   *
   * ⚠️ El `getUser(id)` va ANTES y con `await`: es el que deja las credenciales
   * del condominio nuevo. Recargar antes de que termine volvería con las viejas.
   */
  const onClick = async (id: any) => {
    await getUser(id);
    onClose();

    // Sin `router.push` ni `reLoadDashboard`: la recarga completa los hace
    // innecesarios —el store se rearma solo— y dejarlos sería prometer un
    // refresco parcial que ya no ocurre.
    window.location.href = "/";
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
            style={{ width: 40, height: 40, borderRadius: "50%" }}
          />
          <div className={styles.clientText}>
            <span className={styles.clientType}>
              {c.type == "C"
                ? translate("condominium")
                : c.type == "U"
                  ? translate("urbanization")
                  : translate("building")}
            </span>
            <span className={styles.clientName}>{c.name}</span>
          </div>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
          {c.privacy === "P" && (
            <StatusBadge
              backgroundColor="rgba(0, 227, 140, 0.1)"
              color="#00E38C"
              containerStyle={{ width: "auto" }}
            >
              Público
            </StatusBadge>
          )}
          {c.privacy === "T" && (
            <StatusBadge
              backgroundColor="rgba(228, 96, 85, 0.1)"
              color="#E46055"
              containerStyle={{ width: "auto" }}
            >
              Prueba
            </StatusBadge>
          )}
          <div className={styles.arrowIcon}>
            <IconArrowRight size={16} color="var(--cWhiteV1)" />
          </div>
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
      style={{ backgroundColor: "#121519" }}
    >
      <div className={styles.container} data-i18n-ignore="true">
        <div className={styles.leftPanel}>
          <div className={styles.logoContainer}>
            <IconLogo size={98} />
          </div>
          <h1 className={styles.title}>{translate("welcomeTitle")}</h1>
          <p className={styles.subtitle}>{translate("subtitle")}</p>
        </div>
        <div className={styles.rightPanel}>
          <div className={styles.listContainer}>
            {showSearch && (
              <div className={styles.searchContainer}>
                <Input
                  name="search"
                  value={searchTerm}
                  onChange={(e: any) => setSearchTerm(e.target.value)}
                  placeholder={translate("searchPlaceholder")}
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
              <div className={styles.backButtonContainer}>
                <Button onClick={onClose} className={styles.backButton}>
                  {translate("back")}
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
