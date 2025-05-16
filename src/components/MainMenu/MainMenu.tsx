import useScreenSize from "@/mk/hooks/useScreenSize";
import {
  IconComunication,
  IconRedffiliates,
  IconLogout,
  IconNetwork,
  IconCandidates,
  IconHome,
  IconPayments,
  IconMonitorLine,
  IconGroup,
  IconComunicationDialog,
  IconInterrogation,
  IconGuard,
  IconBitacora,
  IconCalendar,
  IconDepartments,
  IconSecurity,
} from "../layout/icons/IconsBiblioteca";
import styles from "./mainmenu.module.css";
import MainmenuDropdown from "./MainmenuDropdown";
import MainMenuHeader from "./MainMenuHeader";
import MainmenuItem from "./MainMenuItem";
import { UnitsType } from "@/mk/utils/utils";
import { useEffect } from "react";
import { useAuth } from "@/mk/contexts/AuthProvider";

type PropsType = {
  user?: any;
  client?: any;
  setLogout: any;
  collapsed: boolean;
  setSideBarOpen?: any;
  setOpenClient?: any;
};
// const sound = new Audio("/sound/waiting-146636.mp3"); // Crear una instancia de Audio
const MainMenu = ({
  user,
  collapsed,
  setLogout,
  setSideBarOpen,
  setOpenClient,
}: PropsType) => {
  const { isMobile } = useScreenSize();
  const { setStore } = useAuth();
  const client = user?.clients?.filter(
    (item: any) => item?.id === user?.client_id
  )[0];
  // const play = () => {
  //   sound
  //     .play()
  //     .catch((err) => console.error("Error al reproducir el audio:", err));
  // };

  useEffect(() => {
    setStore({ UnitsType: UnitsType[client?.type_dpto] });
  }, []);

  return (
    <section className={styles.menu}>
      <div>
        <MainMenuHeader user={user} collapsed={collapsed} />
      </div>
      {!isMobile ? (
        <div>
          <MainmenuItem
            href="/"
            label="Inicio"
            icon={<IconHome />}
            collapsed={collapsed}
          />
          <MainmenuDropdown
            label="Finanzas"
            icon={<IconPayments />}
            items={[
              { href: "/balance", label: "Flujo de efectivo " },
              {
                href: "/payments",
                label: "Ingresos",
              },
              { href: "/outlays", label: "Egresos" },
              { href: "/defaultersview", label: "Morosos" },
              { href: "/expenses", label: "Expensas" },
              // { href: "/budget", label: "Presupuestos" },
            ]}
            collapsed={collapsed}
            setSideBarOpen={setSideBarOpen}
          />
          <MainmenuDropdown
            label="Administración"
            icon={<IconMonitorLine />}
            items={[
              // { href: "/dptos", label: UnitsType[client?.type_dpto] + "s" },
              { href: "/units", label: "Unidades" },
              { href: "/activities", label: "Historial" },
              { href: "/documents", label: "Documentos" },
              { href: "/configs", label: "Configuración" },
            ]}
            collapsed={collapsed}
            setSideBarOpen={setSideBarOpen}
          />
          <MainmenuDropdown
            label="Usuarios"
            icon={<IconGroup />}
            items={[
              { href: "/owners", label: "Residentes" },
              { href: "/homeowners", label: "Propietarios" },
              { href: "/users", label: "Administradores" },
            ]}
            collapsed={collapsed}
            setSideBarOpen={setSideBarOpen}
          />

          <MainmenuDropdown
            label="Comunicación"
            icon={<IconComunicationDialog />}
            items={[
              { href: "/contents", label: "Publicaciones" },
              // { href: "/events", label: "Eventos" },
              // { href: "/surveys", label: "Encuestas" },
            ]}
            collapsed={collapsed}
            setSideBarOpen={setSideBarOpen}
          />

          <MainmenuItem
            href="/areas"
            label="Areas sociales"
            icon={<IconBitacora />}
            collapsed={collapsed}
          />
          <MainmenuItem
            href="/reservas"
            label="Reservas"
            icon={<IconCalendar />}
            collapsed={collapsed}
          />
          {user?.clients?.length > 1 && (
            <MainmenuItem
              href="#"
              onclick={() => setOpenClient(true)}
              label="Cambiar de condominio"
              icon={<IconDepartments />}
              collapsed={collapsed}
            />
          )}
          <MainmenuDropdown
            label="Vigilancia y seguridad"
            icon={<IconSecurity />}
            items={[
              { href: "/guards", label: "Guardias" },
              { href: "/alerts", label: "Alertas" },
              { href: "/binnacle", label: "Bitácora" },
              // { href: "/ev", label: "Soporte y ATC" },
            ]}
            collapsed={collapsed}
            setSideBarOpen={setSideBarOpen}
          />

          {/* <MainmenuItem
            href="/ev"
            label="Soporte y ATC"
            icon={<IconInterrogation />}
            collapsed={collapsed}
          /> */}
        </div>
      ) : (
        <div>
          <MainmenuItem href="/" label="Eventos" icon={<IconCandidates />} />
        </div>
      )}
      {/* <div>
        <MainmenuItem
          href="#"
          onclick={() => play()}
          label="Reproducir sonido"
          labelColor={"var(--cSuccess)"}
          icon={<></>}
          collapsed={collapsed}
        />
      </div> */}
      <div>
        <MainmenuItem
          href="#"
          onclick={() => setLogout(true)}
          label="Cerrar sesión"
          labelColor={"var(--cError)"}
          icon={<IconLogout color={"var(--cError)"} />}
          collapsed={collapsed}
        />
      </div>
    </section>
  );
};

export default MainMenu;
