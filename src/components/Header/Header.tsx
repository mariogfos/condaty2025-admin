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
import { useCallback, useEffect, useState } from "react";

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
  const [count, setCount] = useState(0);

  const menuItems = [
    { name: "Roles", route: "/roles" },
    { name: "Categorias de roles", route: "/rolescategories" },
    { name: "Permisos", route: "/rolesabilities" },
  ];
  const onNotif = useCallback((data: any) => {
    // console.log("nueva counter", data);
    setCount((old) => old + 1);
  }, []);
  const onResetNotif = useCallback((data: any) => {
    // console.log("nueva counter", data);
    setCount(0);
  }, []);
  useEvent("onReset", onResetNotif);
  useEvent("onNotif", onNotif);

  // const onOpenChat = useCallback((e: any) => {
  //   setCountChat(0);
  // }, []);

  // useEvent("onOpenChat", onOpenChat);

  const { dispatch: openChat } = useEvent("onOpenChat");
  const [countChat, setCountChat] = useState(0);
  const onChat = useCallback(
    (e: any) => {
      setCountChat((old) => old + 1);
    },
    [user?.id]
  );

  useEvent("onChatNewMsg", onChat);

  const checkNotif = async () => {
    let notifId = 0;
    try {
      notifId = parseInt(localStorage.getItem("notifId") || "0");
    } catch (error) {
      notifId = 0;
    }
    if (notifId < user?.notifId) {
      setCount((old) => old + 1);
    }
  };
  useEffect(() => {
    if (count == 0) checkNotif();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

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

  const Round = ({ icon, href, onClick, bage }: any) => {
    if (href)
      return (
        <div className={styles.notificationContainer}>
          <Link onClick={onClick} href={href || "#"}>
            <div className={styles.notificationIcon}>
              {icon}
              {bage > 0 && (
                <div className={styles.notificationBadge}>{bage || 0}</div>
              )}
            </div>
          </Link>
        </div>
      );
    return (
      <div className={styles.notificationContainer}>
        <div onClick={onClick}>
          <div className={styles.notificationIcon}>
            {icon}
            {bage > 0 && (
              <div className={styles.notificationBadge}>{bage || 0}</div>
            )}
          </div>
        </div>
      </div>
    );
  };

  const ProfileIcon = () => {
    return (
      <div>
        <div style={{ cursor: "pointer" }}>
          <Avatar
            hasImage={1}
            name={getFullName(user)}
            h={40}
            w={40}
            src={getUrlImages(
              "/ADM-" + user?.id + ".webp?d=" + user?.updated_at
            )}
            onClick={() => {
              setStore({ ...store, openProfileModal: true });
            }}

            // square={true}
          />
        </div>
      </div>
    );
  };

  if (isTablet)
    return (
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
          bage={count}
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
          onClick={(e: any) => {
            openChat(e);
            setCountChat(0);
          }}
          bage={countChat}
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
