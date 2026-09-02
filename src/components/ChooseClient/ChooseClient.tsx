"use client";
import DataModal from "@/mk/components/ui/DataModal/DataModal";
import { useAuth } from "@/mk/contexts/AuthProvider";
import React, { useRef, useState } from "react";
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
/**
 * 🔴 CDT-115 — los dos badges de abajo NO SE PINTABAN NUNCA.
 *
 * Comparaban `c.privacy === "P"` y `=== "T"`, los valores viejos. `privacy`
 * pasó a enum numérico en el corte de #725 (`ClientPrivacy.PUBLICO = 1`,
 * `PRUEBA = 2`), así que las dos condiciones eran SIEMPRE falsas.
 *
 * ⚠️ Lo que se perdía no era decorativo: el badge «Prueba» marca los 3
 * condominios de prueba sobre 37, justamente para que nadie los confunda con
 * uno real. En el selector se veían iguales a los otros 34.
 *
 * Por qué no lo agarró nada: una comparación contra un valor que ya no llega
 * NO da error — simplemente no entra nunca. El SSoT pinea las DEFINICIONES;
 * las comparaciones no las mira nadie. Y esta pantalla lee de `user.clients`,
 * así que no aparece en ningún barrido del módulo Condominios.
 *
 * Comparación estricta contra el enum, igual que `Condominios.tsx:29`. Se
 * midió que llega como NÚMERO y no como texto: el modelo del API tiene
 * `'privacy' => ClientPrivacy::class` (`Client.php:68`), un cast de enum
 * entero, que Laravel serializa como `1` / `2`. Por eso no lleva un
 * `Number(...)` defensivo — un cast «por las dudas» acá taparía justo el
 * desacuerdo que uno querría ver.
 */
import { ClientPrivacy, ClientType } from "@/modulos/Payments/Type/PaymentType";

interface Props {
  open: boolean;
  onClose: () => void;
}
const ChooseClient = ({ open, onClose }: Props) => {
  const { user, getUser } = useAuth();
  const [searchTerm, setSearchTerm] = useState("");
  /**
   * 🔴 Guarda de en-vuelo: el modal queda ABIERTO y clickeable durante el
   * `await getUser(id)`, que es un request entero. Dos clicks seguidos
   * despachan dos `getUser`, cada uno escribe `condaty_client_id` y el token, y
   * **gana el que CONTESTA último, que no es el que se pidió último**. El
   * usuario apretó un condominio y puede terminar en el otro.
   *
   * En un sistema multi-tenant es de las cosas peores que pueden pasar, y es
   * justo lo que el comentario de `onClick` explica que se quiso cerrar con la
   * recarga completa. La recarga tapa el estado viejo; no tapa esta carrera.
   *
   * Un ref y no un estado: se lee ya actualizado en el mismo tick, un
   * `useState` no.
   */
  const cambioEnVuelo = useRef(false);
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
    if (cambioEnVuelo.current) return;
    cambioEnVuelo.current = true;

    try {
      await getUser(id);
      onClose();

      // Sin `router.push` ni `reLoadDashboard`: la recarga completa los hace
      // innecesarios —el store se rearma solo— y dejarlos sería prometer un
      // refresco parcial que ya no ocurre.
      window.location.href = "/";
    } catch (e) {
      // ⚠️ Sólo se suelta si falló. En el camino bueno la página se recarga y
      // el ref se va con ella: soltarlo antes reabriría la carrera durante el
      // rato que tarda la navegación.
      cambioEnVuelo.current = false;
      throw e;
    }
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
            {/*
              🔴 Acá pasaba EXACTAMENTE lo mismo que con los dos badges de más
              abajo, y quedó vivo en la línea siguiente: `c.type == "C"` y
              `== "U"` comparan contra los valores viejos. `type` es un enum
              numérico —`Client.php:67` lo castea con `'type' => ClientType::class`,
              que Laravel serializa como `1` / `2`—, así que las DOS ramas eran
              siempre falsas y **los 37 condominios caían al `else`: todos
              decían «Edificio»**, incluidos los 23 que son condominios.

              ⚠️ Y la rama «Urbanización» no existe: el enum tiene dos casos,
              CONDOMINIO y EDIFICIO. Comparaba contra una `"U"` que el API no
              manda ni mandó nunca.
            */}
            <span className={styles.clientType}>
              {c.type === ClientType.CONDOMINIO
                ? translate("condominium")
                : translate("building")}
            </span>
            <span className={styles.clientName}>{c.name}</span>
          </div>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
          {c.privacy === ClientPrivacy.PUBLICO && (
            <StatusBadge
              backgroundColor="rgba(0, 227, 140, 0.1)"
              color="#00E38C"
              containerStyle={{ width: "auto" }}
            >
              Público
            </StatusBadge>
          )}
          {c.privacy === ClientPrivacy.PRUEBA && (
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
