// import useScreenSize from "@/mk/hooks/useScreenSize";
import {
  IconLogout,
  IconCandidates,
  IconHome,
  IconPayments,
  IconMonitorLine,
  IconGroup,
  IconComunicationDialog,
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
import { useCallback, useEffect, useState } from "react";
import { useAuth } from "@/mk/contexts/AuthProvider";
import { useEvent } from "@/mk/hooks/useEvents";
import { usePathname } from "next/navigation";

type PropsType = {
  user?: any;
  client?: any;
  setLogout: any;
  collapsed: boolean;
  setSideBarOpen?: any;
  setOpenClient?: any;
};
const MainMenu = ({
  user,
  collapsed,
  setLogout,
  setSideBarOpen,
  setOpenClient,
}: PropsType) => {
  // const { isMobile } = useScreenSize();
  const isMobile = false;
  const { setStore, store } = useAuth();
  const client = user?.clients?.filter(
    (item: any) => item?.id === user?.client_id
  )[0];
  // const [bage, setBage]: any = useState({});

  const pathname = usePathname();

  useEffect(() => {
    if (pathname === "/payments" && store?.paymentsBage > 0) {
      setStore({
        ...store,
        paymentsBage: 0,
      });
    }
    if (pathname === "/reservas" && store?.reservasBage > 0) {
      setStore({
        ...store,
        reservasBage: 0,
      });
    }
    if (pathname == "/alerts" && store?.alertsBage > 0) {
      setStore({
        ...store,
        alertsBage: 0,
      });
    }
    if (pathname == "/reels" && store?.reelsBage > 0) {
      setStore({
        ...store,
        reelsBage: 0,
      });
    }
  }, [pathname]);

  const onNotif = useCallback((data: any) => {
    if (data?.payload?.act == "newVoucher") {
      setStore({ ...store, paymentsBage: (store?.paymentsBage || 0) + 1 });
    }
    if (data?.payload?.act == "newReservationAdm") {
      setStore({ ...store, reservasBage: (store?.reservasBage || 0) + 1 });
    }
    if (data?.payload?.act == "alerts") {
      setStore({ ...store, alertsBage: (store?.alertsBage || 0) + 1 });
    }
    if (data?.payload?.act == "newContent") {
      setStore({ ...store, reelsBage: (store?.reelsBage || 0) + 1 });
    }
  }, []);

  useEvent("onNotif", onNotif);

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
                bage: store?.paymentsBage,
              },
              { href: "/outlays", label: "Egresos" },
            { href: "/expenses", label: "Expensas" },
              { href: "/defaulters", label: "Morosos" },
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
              { href: "/areas" , label: "Áreas sociales"},
              { href: "/activities", label: "Accesos" },
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
              { href: "/users", label: "Personal Administrativo" },
              { href: "/roles", label: "Roles y permisos" },
              // { href: "/rolescategories", label: "Permisos" },
              // { href: "/rolescategories", label: "Categorías de rol" },
              //{ href: "/homeowners", label: "Propietarios" },
            ]}
            collapsed={collapsed}
            setSideBarOpen={setSideBarOpen}
          />

          <MainmenuDropdown
            label="Comunicación"
            icon={<IconComunicationDialog />}
            items={[
              { href: "/contents", label: "Publicaciones" },
              { href: "/reels", label: "Muro publicaciones" },
              // { href: "/events", label: "Eventos" },
              // { href: "/surveys", label: "Encuestas" },
            ]}
            collapsed={collapsed}
            setSideBarOpen={setSideBarOpen}
          />

          {/* <MainmenuItem
            href="/areas"
            label="Areas sociales"
            icon={<IconBitacora />}
            collapsed={collapsed}
          /> */}
          <MainmenuItem
            href="/reservas"
            label="Reservas"
            bage={store?.reservasBage}
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
              { href: "/alerts", label: "Alertas", bage: store?.alertsBage },
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
