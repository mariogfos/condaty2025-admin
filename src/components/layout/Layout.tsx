"use client";
import { useCallback, useEffect, useState } from "react";
import styles from "./layout.module.css";
import { useAuth } from "@/mk/contexts/AuthProvider";
import DataModal from "@/mk/components/ui/DataModal/DataModal";
import Sidebar from "@/mk/components/ui/Sidebar/Sidebar";
import MainMenu from "../MainMenu/MainMenu";
import Header from "../Header/Header";
import useScreenSize from "@/mk/hooks/useScreenSize";
import { usePathname } from "next/navigation";
import { useRouter } from "next/navigation";
import { getFormattedDate } from "@/mk/utils/date";
import SideMenu from "@/mk/components/ui/SideMenu/SideMenu";
import { useEvent } from "@/mk/hooks/useEvents";
import ItemList from "@/mk/components/ui/ItemList/ItemList";
import { Avatar } from "@/mk/components/ui/Avatar/Avatar";
import { getUrlImages } from "@/mk/utils/string";
import { IconAmbulance, IconFlame, IconTheft } from "./icons/IconsBiblioteca";

// const soundBell = new Audio("/sounds/bellding.mp3");
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
};

const Layout = ({ children }: any) => {
  const { user, logout, store, showToast } = useAuth();
  const { isTablet, isDesktop } = useScreenSize();
  const [sideBarOpen, setSideBarOpen] = useState(false);
  const [sideMenuOpen, setSideMenuOpen] = useState(false);
  const [client, setClient]: any = useState(null);
  const [onLogout, setOnLogout] = useState(false);
  const [openAlert, setOpenAlert]: any = useState({ open: false, item: null });
  const path: any = usePathname();
  const router = useRouter();
  const [audioEnabled, setAudioEnabled] = useState(false);
  const [soundBell] = useState(
    typeof window !== "undefined" ? new Audio("/sounds/Alerta.mp3") : null
  );

  useEffect(() => {
    if (user) {
      const client = user.clients?.find((c: any) => c.id === user.client_id);
      setClient(client);
    }
  }, [user]);

  useEffect(() => {
    // Habilitar el audio después de la primera interacción del usuario
    const enableAudio = () => {
      soundBell
        ?.play()
        .then(() => {
          soundBell?.pause();
          soundBell?.load();
          setAudioEnabled(true);
          // Remover el evento después de la primera interacción
          document.removeEventListener("click", enableAudio);
        })
        .catch((error) => console.log("Error al habilitar el audio:", error));
    };

    document.addEventListener("click", enableAudio);
    return () => {
      document.removeEventListener("click", enableAudio);
    };
  }, [soundBell]);

  const onNotif = useCallback(
    (e: any) => {
      // console.log("*******11111*****", e);
      if (e.event == "ping") {
        showToast("Llegó un PING", "info");
      }
      if (e.event == "newPreregister" || e.payload == "newVoucher") {
        showToast(e.payload.title, "info");
      }
      if (e.event == "alerts" && e.payload?.level == 4) {
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
    [soundBell, showToast, audioEnabled]
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
          isTablet={isTablet}
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
              client={client}
              setLogout={setOnLogout}
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
              client={client}
              user={user}
              collapsed={false}
              setLogout={setOnLogout}
            />
          </Sidebar>
        )}
      </section>
      <section>{children}</section>
      <section>{/* Fotter Here!! */}</section>
      <DataModal
        open={onLogout}
        title="Cerrar sesión"
        onClose={() => {
          setOnLogout(false);
        }}
        buttonText="Cerrar sesión"
        buttonCancel="Cancelar"
        onSave={() => logout()}
      >
        <p className={styles.modalLogout}>
          ¿Estás seguro de que deseas cerrar sesión?
        </p>
      </DataModal>

      <DataModal
        style={{ border: "1px solid var(--cError)" }}
        title="Nueva emergencia"
        iconClose={false}
        open={openAlert.open}
        buttonCancel=""
        buttonText="Atender"
        onClose={onCloseAlert}
        onSave={onCloseAlert}
      >
        <p style={{ color: "var(--cWhiteV1)", marginBottom: 8 }}>Residente</p>
        <ItemList
          variant="V1"
          title={openAlert?.item?.owner_name}
          subtitle={"Unidad: " + openAlert?.item?.unit}
          left={
            <Avatar
              src={getUrlImages(
                "/OWNER-" + openAlert?.item?.owner_id + ".webp?d="
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
          <p>{openAlert?.item?.name}</p>
        </div>
      </DataModal>
    </main>
  );
};

export default Layout;
