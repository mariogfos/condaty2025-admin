"use client";
import { useCallback, useEffect, useState } from "react";
import styles from "./layout.module.css";
import { useAuth } from "@/mk/contexts/AuthProvider";
import DataModal from "@/mk/components/ui/DataModal/DataModal";
import Sidebar from "@/mk/components/ui/Sidebar/Sidebar";
import MainMenu from "../MainMenu/MainMenu";
import Header from "../Header/Header";
import { usePathname } from "next/navigation";
import { useRouter } from "next/navigation";
import {
  getDateTimeAgo,
  getFormattedDate,
} from "@/mk/utils/date";
import SideMenu from "@/mk/components/ui/SideMenu/SideMenu";
import { useEvent } from "@/mk/hooks/useEvents";
import ItemList from "@/mk/components/ui/ItemList/ItemList";
import { Avatar } from "@/mk/components/ui/Avatar/Avatar";
import { getUrlImages } from "@/mk/utils/string";
import {
  IconAlert,
  IconAmbulance,
  IconFlame,
  IconTheft,
} from "./icons/IconsBiblioteca";
import ChooseClient from "../ChooseClient/ChooseClient";
import ProfileModal from "../ProfileModal/ProfileModal";
const typeAlerts: any = {
  E: {
    name: "Emergencia Medica",
    icon: <IconAmbulance size={36} color="var(--cWhite)" />,
    color: { background: "var(--cHoverError)", border: "var(--cError)" },
  },
  F: {
    name: "Incendio",
    icon: <IconFlame size={36} color="var(--cWhite)" />,
    color: { background: "var(--cHoverWarning)", border: "var(--cWarning)" },
  },
  T: {
    name: "Robo",
    icon: <IconTheft size={36} color="var(--cWhite)" />,
    color: { background: "var(--cHoverInfo)", border: "var(--cInfo)" },
  },
  O: {
    name: "Otro",
    icon: <IconAlert size={36} color="var(--cWhite)" />,
    color: { background: "var(--cHoverInfo)", border: "var(--cInfo)" },
  },
};

const Layout = ({ children }: any) => {
  const { user, logout, store, setStore, showToast, userCan } = useAuth();

  const [sideBarOpen, setSideBarOpen] = useState(false);
  const [sideMenuOpen, setSideMenuOpen] = useState(false);
  const [client, setClient]: any = useState(null);
  const [onLogout, setOnLogout] = useState(false);
  const [openAlert, setOpenAlert]: any = useState({ open: false, item: null });
  const [audioEnabled, setAudioEnabled] = useState(false);
  const [soundBell] = useState(
    typeof window !== "undefined" ? new Audio("/sounds/Alerta.mp3") : null
  );
  const [openClient, setOpenClient] = useState(false);
  const [isLayoutAlertDescExpanded, setIsLayoutAlertDescExpanded] =
    useState(false);

  const path: any = usePathname();
  const router = useRouter();
  const isTablet = false;
  const isDesktop = true;

  // Helper para truncar texto a 150 chars con "…"
  const truncateText = (text: string, max: number) =>
    (text ?? "").length > max
      ? (text ?? "").slice(0, max).trimEnd() + "…"
      : text ?? "";

  // Precalcular valores del nombre/descripcion de la emergencia
  const emergencyName = openAlert?.item?.name ?? "";
  const nameTooLong = emergencyName.length > 150;
  const visibleName = isLayoutAlertDescExpanded
    ? emergencyName
    : truncateText(emergencyName, 150);

  // Reiniciar al abrir/cambiar la alerta
  useEffect(() => {
    setIsLayoutAlertDescExpanded(false);
  }, [openAlert?.item?.name, openAlert?.item?.created_at, openAlert?.open]);

  // Verificar cliente al montar
  useEffect(() => {
    if (user && user?.id !== "0" && !user?.client_id) {
      setOpenClient(true);
    } else if (!user || user?.id === "0") {
      setOpenClient(false);
    }
  }, [user?.client_id, user]);

  // Habilitar audio después de la primera interacción del usuario
  useEffect(() => {
    const enableAudio = () => {
      if (soundBell) {
        // Configurar el volumen a 0 temporalmente para no hacer ruido
        const originalVolume = soundBell.volume;
        soundBell.volume = 0;
        
        soundBell
          .play()
          .then(() => {
            soundBell.pause();
            soundBell.currentTime = 0;
            soundBell.volume = originalVolume; // Restaurar el volumen
            setAudioEnabled(true);
            document.removeEventListener("click", enableAudio);
          })
          .catch((error) => {
            soundBell.volume = originalVolume; // Restaurar incluso si falla
            console.log("Error al habilitar el audio:", error);
          });
      }
    };

    document.addEventListener("click", enableAudio);
    return () => {
      document.removeEventListener("click", enableAudio);
    };
  }, [soundBell]);

  // Manejar redimensionamiento de ventana
  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth < 1201) {
        setSideMenuOpen(true); // Colapsado
      } else {
        setSideMenuOpen(false); // Expandido
      }
    };
    handleResize(); // Ejecutar al montar
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  const onNotif = useCallback(
    (e: any) => {
      if (!user?.id) return;
      console.log(user, "user");
      if (e.event == "ping") {
        showToast("Llegó un PING", "info");
      }
      if (e.event == "newPreregister" || e.payload == "newVoucher") {
        showToast(e.payload.title, "info");
      }
      if (e.event == "budget-approval" || e.event == "change-budget") {
        showToast(e.payload.title, "info");
      }

      if (e.event == "alerts" && e.payload?.level >= 2) {
        showToast("¡Se registró una nueva alerta!", "warning");
      }
      if (e.event == "newContent") {
        showToast("¡Revisa tu muro, tienes un nuevo comunicado!", "info");
      }

      if (e.event == "admins" && e.payload.act == "newVoucher") {
        showToast(
          "¡Revisa tus ingresos, tienes un nuevo comprobante de pago!",
          "info"
        );
      }

      if (
        e.event == "alerts" &&
        e.payload?.level == 4 &&
        !userCan("aprovebudgets", "U")
      ) {
        setOpenAlert({ open: true, item: e.payload });
        if (audioEnabled) {
          soundBell
            ?.play()
            .catch((error) =>
              console.log("Error al reproducir el sonido:", error)
            );
        }
      }
    },
    [soundBell, showToast, audioEnabled, user, userCan]
  );

  useEvent("onNotif", onNotif);

  const layoutClassName = `${styles.layout} ${
    isDesktop && !sideMenuOpen ? styles.layoutExpanded : ""
  } ${isDesktop && sideMenuOpen ? styles.layoutCollapsed : ""}`;

  const onCloseAlert = () => {
    setOpenAlert({ open: false, item: null });
    soundBell?.pause();
    soundBell?.load();
  };

  return (
    <main className={layoutClassName}>
      <section>
        <Header
          isTablet={false}
          user={user}
          path={path}
          router={router}
          client={client}
          title={store?.title + " / " + getFormattedDate()}
          right={store?.right}
          customTitle={store?.customTitle}
          openSlider={sideBarOpen}
          setOpenSlider={setSideBarOpen}
        />
      </section>
      <section>
        {isDesktop && (
          <SideMenu collapsed={sideMenuOpen} setCollapsed={setSideMenuOpen}>
            <MainMenu
              collapsed={sideMenuOpen}
              user={user}
              setLogout={setOnLogout}
              setOpenClient={setOpenClient}
            />
          </SideMenu>
        )}
        {isTablet && (
          <Sidebar
            open={sideBarOpen}
            onClose={setSideBarOpen}
            iconClose={false}
          >
            <MainMenu
              setSideBarOpen={setSideBarOpen}
              user={user}
              collapsed={false}
              setLogout={setOnLogout}
              setOpenClient={setOpenClient}
            />
          </Sidebar>
        )}
      </section>
      <section>{children}</section>
      <section>{/* Footer Here!! */}</section>
      {store?.openProfileModal && (
        <ProfileModal
          open={store?.openProfileModal}
          onClose={() => {
            setStore({ openProfileModal: false });
          }}
          dataID={user?.id}
          titleBack="Volver atrás"
          type="admin"
          del={false}
          setOnLogout={setOnLogout}
        />
      )}

      {onLogout && (
        <DataModal
          open={onLogout}
          title="Cerrar sesión"
          onClose={() => {
            setOnLogout(false);
          }}
          buttonText="Cerrar sesión"
          buttonCancel="Cancelar"
          minWidth={360}
          maxWidth={680}
          onSave={() => logout()}
        >
          <p className={styles.modalLogout}>
            ¿Estás seguro de que deseas cerrar sesión?
          </p>
        </DataModal>
      )}
      {openAlert?.open && (
        <DataModal
          style={{ border: "2px solid #F23D2D", width: "450px" }}
          title="Nueva emergencia"
          colorTitle="var(--cError)"
          iconClose={false}
          open={openAlert?.open}
          buttonCancel=""
          buttonText="Cerrar"
          onClose={onCloseAlert}
          onSave={onCloseAlert}
        >
          <p
            style={{
              color: "var(--cWhiteV1)",
              marginBottom: 8,
              fontSize: "14px",
            }}
          >
            Residente
          </p>
          <ItemList
            variant="V1"
            title={openAlert?.item?.owner_name}
            subtitle={"Unidad: " + openAlert?.item?.unit}
            right={
              <p style={{ width: 110, textAlign: "right" }}>
                {getDateTimeAgo(openAlert?.item?.created_at)}
              </p>
            }
            left={
              <Avatar
                hasImage={openAlert?.item?.owner_has_image}
                src={getUrlImages(
                  "/OWNER-" +
                    openAlert?.item?.owner_id +
                    ".webp?d=" +
                    openAlert?.item?.owner_updated_at
                )}
                name={openAlert?.item?.owner_name}
              />
            }
          />
          <p style={{ color: "var(--cWhiteV1)", marginBottom: 8 }}>
            Tipo de emergencia
          </p>
          <div
            style={{
              backgroundColor:
                typeAlerts[openAlert?.item?.type]?.color?.background,
              borderRadius: 8,
              border: `1px solid ${
                typeAlerts[openAlert?.item?.type]?.color?.border
              }`,
              width: "184px",
              padding: 8,
              margin: "0 auto",
              color: "var(--cWhite)",
            }}
          >
            {typeAlerts[openAlert?.item?.type]?.icon}
            <p className={styles.alertDesc}>{visibleName}</p>
            {nameTooLong && (
              <button
                className={styles.viewMoreBtn}
                onClick={() => setIsLayoutAlertDescExpanded((v: boolean) => !v)}
              >
                {isLayoutAlertDescExpanded ? "Ver menos" : "Ver más"}
              </button>
            )}
          </div>
        </DataModal>
      )}

      {openClient && (
        <ChooseClient
          open={openClient}
          onClose={() => {
            setOpenClient(false);
          }}
        />
      )}
    </main>
  );
};

export default Layout;