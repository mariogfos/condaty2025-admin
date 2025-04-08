"use client";
import { getFullName, getUrlImages } from "@/mk/utils/string";
import { Avatar } from "@/mk/components/ui/Avatar/Avatar";
import styles from "./header.module.css";
import { IconMenu, IconSetting, IconNotification } from "../layout/icons/IconsBiblioteca";

import HeadTitle from "../HeadTitle/HeadTitle";
import { useRouter } from "next/router";
import Link from "next/link";
import { useAuth } from "@/mk/contexts/AuthProvider";
import Dropdown from "@/mk/components/ui/Dropdown/Dropdown";

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
    { name: "Permisos", route: "/rolesabilities" },
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
            square={true} 
            
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
        <div className={styles["header-greeting"]}>
          <h1>¡Hola {getFullName(user)}!</h1>
          <p>Es un gusto tenerte de nuevo con nosotros, te deseamos una excelente jornada laboral</p>
        </div>

        <div className={styles["header-controls"]}>
          <NotificationIcon />
          <div className={styles.tooltip}>
            <div className={styles.iconOuterContainer}>
              <div className={styles.settingContainer}>
                <div 
                  onClick={() => router.push('/roles')} 
                  style={{ cursor: "pointer" }}
                >
                  <IconSetting />
                </div>
              </div>
            </div>
          </div>
          

          <ProfileIcon />
        </div>
      </div>
    );
};

export default Header;