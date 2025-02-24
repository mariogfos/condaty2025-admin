"use client";
import { getFullName, getUrlImages } from "@/mk/utils/string";
import { Avatar } from "@/mk/components/ui/Avatar/Avatar";
import styles from "./header.module.css";
import { IconMenu, IconSetting, IconNotification } from "../layout/icons/IconsBiblioteca";
import Dropdown from "@/mk/components/ui/Dropdown/Dropdown";
import HeadTitle from "../HeadTitle/HeadTitle";
import { useRouter } from "next/router";
import Link from "next/link";
import { useAuth } from "@/mk/contexts/AuthProvider";

type PropsType = {
  isTablet: boolean;
  user: any;
  path: string;
  router: any;
  client: any;
  setOpenSlider: Function;
  openSlider: boolean;
  title: string;
  right?: Function;
  customTitle?: Function;
};

const Header = ({
  isTablet,
  user,
  path,
  router,
  client,
  setOpenSlider,
  openSlider,
  title,
  right = () => {
    return null;
  },
  customTitle = () => {
    return null;
  },
}: PropsType) => {
  const isActive = (path: string) => router.pathname === path;
  const { store } = useAuth();
  
  const menuItems = [
    { name: "Roles", route: "/roles" },
    { name: "Categorias de roles", route: "/rolescategories" },
    { name: "permisos", route: "/rolesabilities" },
    // { name: "Metas", route: "/goals" },
    // { name: "Gamificación", route: "/gamification" },
  ];

  const Title = () => {
    return (
      <div className={styles["header-title"]}>
        <Avatar
          name={getFullName(user)}
          src={getUrlImages("/ADM-" + user?.id + ".webp?d=" + user?.updated_at)}
          onClick={() => {
            router.push("/profile");
          }}
        />
        <p>{getFullName(user)}</p>
        <p>{client?.name}</p>
      </div>
    );
  };

  const NotificationIcon = () => {
    return (
      <div className={styles.iconOuterContainer}>
        <div className={styles.notificationContainer}>
          <Link href="/notifications">
            <div className={styles.notificationIcon}>
              <IconNotification />
              {store?.notif > 0 && (
                <div className={styles.notificationBadge}>
                  {store?.notif || 0}
                </div>
              )}
            </div>
          </Link>
        </div>
      </div>
    );
  };

  const ProfileIcon = () => {
    return (
      <div className={styles.iconOuterContainer}>
        <div className={styles.profileContainer}>
          <Avatar
            name={getFullName(user)}
            src={getUrlImages("/ADM-" + user?.id + ".webp?d=" + user?.updated_at)}
            onClick={() => {
              router.push("/profile");
            }}
            
          />
        </div>
      </div>
    );
  };

  if (isTablet)
    return (
      <>
        <HeadTitle
          title={title}
          customTitle={path == "/" ? <Title /> : customTitle()}
          left={
            path == "/" ? (
              <IconMenu
                onClick={() => setOpenSlider(!openSlider)}
                circle
                size={32}
              />
            ) : null
          }
          right={
            path == "/" ? (
              <div className={styles.headerRightContainer}>
                <NotificationIcon />
                <Dropdown
                  trigger={<IconSetting circle size={32} />}
                  items={menuItems}
                />
              </div>
            ) : (
              right()
            )
          }
        />
      </>
    );

  return (
    <div className={styles["header-desktop"]}>
      <div>
        <div>{title}</div>
      </div>
      <div
        style={{
          marginTop: "var(--spL)",
        }}
      >
        {/* <DataSearch
          placeholder="Buscar"
          value=""
          onChange={() => {}}
          setSearch={() => {}}
          name="search"
        /> */}
      </div>
      <div className={styles.tooltip}>
        <Dropdown
          trigger={<IconSetting style={{ cursor: "pointer" }} />}
          items={menuItems}
        />
      </div>
      
      <NotificationIcon />
      <ProfileIcon />
    </div>
  );
};

export default Header;