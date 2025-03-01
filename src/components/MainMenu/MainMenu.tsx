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
} from "../layout/icons/IconsBiblioteca";
import styles from "./mainmenu.module.css";
import MainmenuDropdown from "./MainmenuDropdown";
import MainMenuHeader from "./MainMenuHeader";
import MainmenuItem from "./MainMenuItem";

type PropsType = {
  user?: any;
  client?: any;
  setLogout: any;
  collapsed: boolean;
  setSideBarOpen?: any;
};
// const sound = new Audio("/sound/waiting-146636.mp3"); // Crear una instancia de Audio
const MainMenu = ({
  user,
  collapsed,
  setLogout,
  setSideBarOpen,
}: PropsType) => {
  const { isMobile } = useScreenSize();

  // const play = () => {
  //   sound
  //     .play()
  //     .catch((err) => console.error("Error al reproducir el audio:", err));
  // };

  return (
    <section className={styles.menu}>
      <div>
        <MainMenuHeader user={user} collapsed={collapsed} />
      </div>
      {!isMobile ? (
        <div>
          <MainmenuItem href="/" label="Inicio" icon={<IconHome />} collapsed={collapsed}/>
          <MainmenuDropdown
            label="Finanzas"
            icon={<IconPayments/>}
            items={[
              { href: "/finanzas", label: "Balance general" },
              {
                href: "/payments",
                label: "Ingresos",
              },
              { href: "/directAffiliates", label: "Egresos" },
              { href: "/affiliates", label: "Morosos" },
              { href: "/expenses", label: "Expensas" },
            ]}
            collapsed={collapsed}
            setSideBarOpen={setSideBarOpen}
          />
          <MainmenuDropdown
            label="Administración"
            icon={<IconMonitorLine />}
            items={[
              { href: "/dptos", label: "Casas" },
              { href: "/activities", label: "Actividades" },
              { href: "/documents", label: "Documentos" },
              { href: "/configs", label: "Configuración" },
            ]}
            collapsed={collapsed}
            setSideBarOpen={setSideBarOpen}
          />
            <MainmenuDropdown
              label="Usuarios"
              icon={<IconGroup/>}
              items={[
                { href: "/guards", label: "Guardias" },
                { href: "/owners", label: "Residentes" },
                { href: "/homeowners", label: "Propietarios" },
                { href: "/users", label: "Personal Administrativo" },
              ]}
              collapsed={collapsed}
              setSideBarOpen={setSideBarOpen}
            /> 
          <MainmenuDropdown
            label="Comunicación"
            icon={<IconComunicationDialog />}
            items={[
              { href: "/contents", label: "Publicaciones" },
              { href: "/events", label: "Eventos" },
              { href: "/surveys", label: "Encuestas" },
              { href: "/alerts", label: "Alertas" },
            ]}
            collapsed={collapsed}
            setSideBarOpen={setSideBarOpen}
          />
        <MainmenuItem href="/binnacle" label="Bitácora" icon={<IconBitacora/>} collapsed={collapsed}/>

        <MainmenuItem href="/ev" label="Soporte y ATC" icon={<IconInterrogation />} collapsed={collapsed} />
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
