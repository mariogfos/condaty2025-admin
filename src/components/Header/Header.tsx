"use client";
import { getFullName, getUrlImages } from "@/mk/utils/string";
import { Avatar } from "@/mk/components/ui/Avatar/Avatar";
import styles from "./header.module.css";
import {
  IconMenu,
  IconSetting,
  IconNotification,
  IconMessage,
} from "../layout/icons/IconsBiblioteca";

import HeadTitle from "../HeadTitle/HeadTitle";
import { useRouter } from "next/router";
import Link from "next/link";
import { useAuth } from "@/mk/contexts/AuthProvider";
import Dropdown from "@/mk/components/ui/Dropdown/Dropdown";
import { useEvent } from "@/mk/hooks/useEvents";

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
  const { store, setStore } = useAuth();

  const menuItems = [
    { name: "Roles", route: "/roles" },
    { name: "Categorias de roles", route: "/rolescategories" },
    { name: "Permisos", route: "/rolesabilities" },
  ];

  const Title = () => {
    return (
      <div className={styles["header-title"]}>
        <Avatar
          name={getFullName(user)}
          src={getUrlImages("/ADM-" + user?.id + ".webp?d=" + user?.updated_at)}
          hasImage={user.has_image}
          onClick={() => {
            // router.push("/profile");
            setStore({ openProfileModal: true });
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

  const Round = ({ icon, href, onClick }: any) => {
    return (
      <div className={styles.notificationContainer}>
        <Link onClick={onClick} href={href || "#"}>
          <div className={styles.notificationIcon}>
            {icon}
            {store?.notif > 0 && href == "/notifications" && (
              <div className={styles.notificationBadge}>
                {store?.notif || 0}
              </div>
            )}
          </div>
        </Link>
      </div>
    );
  };

  const ProfileIcon = () => {
    return (
      <div>
        <div style={{ cursor: "pointer" }}>
          <Avatar
            hasImage={user.has_image}
            name={getFullName(user)}
            h={40}
            w={40}
            src={getUrlImages(
              "/ADM-" + user?.id + ".webp?d=" + user?.updated_at
            )}
            onClick={() => {
              console.log("click");
              setStore({ ...store, openProfileModal: true });
            }}

            // square={true}
          />
        </div>
      </div>
    );
  };

  const { dispatch: openChat } = useEvent("onOpenChat");

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
                {/* <Dropdown
                  trigger={<IconSetting circle size={32} />}
                  items={menuItems}
                /> */}
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
        <p>
          Es un gusto tenerte de nuevo con nosotros, te deseamos una excelente
          jornada laboral
        </p>
      </div>

      <div className={styles["header-controls"]}>
        {/* <NotificationIcon /> */}
        <Round
          icon={<IconNotification color="var(--cWhiteV1)" />}
          href="/notifications"
        />
        {/* <div
          style={{
            border: "1px solid var(--cWhiteV1)",
            padding: "4px",
            borderRadius: "50%",
          }}
        >
          <IconMessage color="var(--cSuccess)" onClick={openChat} />
        </div> */}
        <Round icon={<IconSetting color="var(--cWhiteV1)" />} href="/configs" />
        <Round
          icon={<IconMessage color="var(--cSuccess)" />}
          onClick={openChat}
        />
        {/* <Dropdown
          trigger={
            <div className={styles.iconOuterContainer}>
              <div className={styles.settingContainer}>
                <IconSetting />
              </div>
            </div>
          }
          items={menuItems}
        /> */}
        <ProfileIcon />
      </div>
    </div>
  );
};

export default Header;
