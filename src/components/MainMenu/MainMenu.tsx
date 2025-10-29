import { useCallback, useEffect, useMemo, useState } from "react";
import styles from "./mainmenu.module.css";
import { useAuth } from "@/mk/contexts/AuthProvider";
import { useEvent } from "@/mk/hooks/useEvents";
import { usePathname } from "next/navigation";
import MainMenuHeader from "./MainMenuHeader";
import MainmenuItem from "./MainMenuItem";
import MainmenuDropdown from "./MainmenuDropdown";
import { menuConfig } from "./mainMenuConfig";
import { IconDepartments, IconLogout } from "../layout/icons/IconsBiblioteca";
type PropsType = {
  user: any;
  collapsed: boolean;
  setLogout: (open: boolean) => void;
  setSideBarOpen?: (open: boolean) => void;
  setOpenClient: (open: boolean) => void;
};

const MainMenu = ({
  user,
  collapsed,
  setLogout,
  setSideBarOpen,
  setOpenClient,
}: PropsType) => {
  const { store, setStore } = useAuth();
  const pathname = usePathname();
  const [openMenu, setOpenMenu] = useState<string | null>(null);

  const handleToggle = useCallback((label: string) => {
    setOpenMenu((prev) => (prev === label ? null : label));
  }, []);

  useEffect(() => {
    const pathMap: Record<string, string> = {
      "/payments": "paymentsBage",
      "/reservas": "reservasBage",
      "/alerts": "alertsBage",
      "/reels": "reelsBage",
    };

    const key = pathMap[pathname];
    if (key && store?.[key] > 0) {
      setStore((prev: any) => ({ ...prev, [key]: 0 }));
    }
  }, [pathname, store, setStore]);

  useEvent(
    "onNotif",
    useCallback(
      (data: any) => {
        const actMap: Record<string, string> = {
          newVoucher: "paymentsBage",
          newReservationAdm: "reservasBage",
          alerts: "alertsBage",
          newContent: "reelsBage",
        };
        const key = actMap?.[data?.payload?.act];
        if (key) {
          setStore((prev: any) => ({ ...prev, [key]: (prev?.[key] || 0) + 1 }));
        }
      },
      [setStore]
    )
  );
  const renderedMenu = useMemo(
    () =>
      menuConfig.map((item: any) => {
        if (item.type === "item") {
          return (
            <MainmenuItem
              key={item.label}
              href={item.href}
              label={item.label}
              icon={<item.icon />}
              bage={store?.[item.badgeKey]}
              collapsed={collapsed}
            />
          );
        }
        if (item.type === "dropdown") {
          return (
            <MainmenuDropdown
              key={item.key}
              label={item.label}
              icon={<item.icon />}
              items={item.items.map((sub: any) => ({
                ...sub,
                bage: store?.[sub.badgeKey],
              }))}
              collapsed={collapsed}
              setSideBarOpen={setSideBarOpen}
              isOpen={openMenu === item.label}
              onToggle={() => handleToggle(item.label)}
            />
          );
        }
      }),
    [collapsed, openMenu, store, handleToggle, setSideBarOpen]
  );

  return (
    <section className={styles.menu}>
      <MainMenuHeader user={user} collapsed={collapsed} />
      <div>{renderedMenu}</div>
      {user?.clients?.length > 1 && (
        <MainmenuItem
          href="#"
          onclick={() => setOpenClient(true)}
          label="Cambiar de condominio"
          icon={<IconDepartments />}
          collapsed={collapsed}
        />
      )}
      <MainmenuItem
        href="#"
        onclick={() => setLogout(true)}
        label="Cerrar sesión"
        labelColor="var(--cError)"
        icon={<IconLogout color={"var(--cError)"} />}
        collapsed={collapsed}
      />
    </section>
  );
};

export default MainMenu;
