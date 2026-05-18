"use client";
import { getFullName } from "@/mk/utils/string";
import { Avatar } from "@/mk/components/ui/Avatar/Avatar";
import styles from "./header.module.css";
import {
  IconMenu,
  IconSetting,
  IconNotification,
  IconMessage,
  IconWorld,
} from "../layout/icons/LucideIcons";

import HeadTitle from "../HeadTitle/HeadTitle";
import Link from "next/link";
import { useAuth } from "@/mk/contexts/AuthProvider";
import Dropdown from "@/mk/components/ui/Dropdown/Dropdown";
import { useEvent } from "@/mk/hooks/useEvents";
import { useCallback, useEffect, useState } from "react";
import { useLanguage } from "@/i18n/LanguageProvider";
import { AppLocale } from "@/i18n/runtime";
import { useScopedI18n } from "@/i18n/useScopedI18n";
import { useScreenSize } from "@/mk/hooks/useScreenSize";

type PropsType = {
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
  user,
  path,
  router,
  client,
  setOpenSlider,
  openSlider,
  title,
  right = () => null,
  customTitle = () => null,
}: PropsType) => {
  const { isMobile, isTablet } = useScreenSize();
  const { store, setStore } = useAuth();
  const { locale, setPreference } = useLanguage();
  const { translate } = useScopedI18n("header");
  const isHome = path === "/";
  const [count, setCount] = useState(0);
  const [countChat, setCountChat] = useState(0);

  const { dispatch: openChat } = useEvent("onOpenChat");
  const notificationCount = Math.max(Number(count || 0), Number(store?.notif || 0));

  const languageMenuItems = [
    { name: "Español", route: "es" },
    { name: "Português", route: "pt" },
    { name: "English", route: "en" },
  ];

  const onNotif = useCallback(() => {
    setCount((old) => old + 1);
  }, []);

  const onResetNotif = useCallback(() => {
    setCount(0);
  }, []);

  const onChat = useCallback(() => {
    setCountChat((old) => old + 1);
  }, []);

  useEvent("onReset", onResetNotif);
  useEvent("onNotif", onNotif);
  useEvent("onChatNewMsg", onChat);

  useEffect(() => {
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
    if (count === 0) checkNotif();
  }, [user?.notifId, count]);

  const Title = () => (
    <div className={styles["header-mobile-title"]}>
      <Avatar
        name={getFullName(user)}
        src={user?.url_avatar}
        onClick={() => setStore({ ...store, openProfileModal: true })}
      />
      <div className={styles.mobileGreeting}>
        <p className={styles.mobileGreetingMain}>
          {translate("greetingStart")} {getFullName(user)}
        </p>
        {!isMobile && <p className={styles.mobileGreetingSub}>{client?.name}</p>}
      </div>
    </div>
  );

  const NotificationIcon = () => (
    <div className={styles.iconOuterContainer}>
      <div className={styles.notificationContainer}>
        <Link href="/notifications" className={styles.notificationAction}>
          <div className={styles.notificationIcon}>
            <IconNotification size={22} strokeWidth={1.4} />
            {notificationCount > 0 && (
              <div className={styles.notificationBadge}>{notificationCount}</div>
            )}
          </div>
        </Link>
      </div>
    </div>
  );

  const Round = ({ icon, href, onClick, bage }: any) => {
    const content = (
      <div className={styles.notificationIcon}>
        {icon}
        {bage > 0 && <div className={styles.notificationBadge}>{bage}</div>}
      </div>
    );

    return (
      <div className={styles.notificationContainer}>
        {href ? (
          <Link onClick={onClick} href={href} className={styles.notificationAction}>
            {content}
          </Link>
        ) : (
          <div
            onClick={onClick}
            className={styles.notificationAction}
            style={{ cursor: "pointer" }}
          >
            {content}
          </div>
        )}
      </div>
    );
  };

  const ProfileIcon = () => (
    <div style={{ cursor: "pointer" }}>
      <Avatar
        name={getFullName(user)}
        h={40}
        w={40}
        src={user?.url_avatar}
        onClick={() => setStore({ ...store, openProfileModal: true })}
      />
    </div>
  );

  if (isTablet || isMobile) {
    return (
      <HeadTitle
        title={title}
        customTitle={isHome ? <Title /> : customTitle()}
        leftAriaLabel={isHome ? "Abrir menú" : "Volver"}
        left={
          isHome ? (
            <IconMenu onClick={() => setOpenSlider(!openSlider)} circle size={38} />
          ) : null
        }
        right={
          isHome ? (
            <div className={styles.headerRightContainer}>
              <NotificationIcon />
              {!isMobile && !isTablet && <ProfileIcon />}
            </div>
          ) : (
            right()
          )
        }
      />
    );
  }

  return (
    <div className={styles["header-desktop"]}>
      <div className={styles.headerLead}>
        <ProfileIcon />
        <div className={styles["header-greeting"]} data-i18n-ignore="true">
          <h1>
            {translate("greetingStart")}{" "}
            <span data-i18n-ignore="true">{getFullName(user)}</span>
            {translate("greetingEnd")}
          </h1>
          <p>{translate("greetingSubtitle")}</p>
        </div>
      </div>

      <div className={styles["header-controls"]}>
        <Round
          icon={<IconNotification color="var(--cWhiteV1)" size={22} strokeWidth={1.4} />}
          href="/notifications"
          bage={notificationCount}
        />
        <Round
          icon={<IconSetting color="var(--cWhiteV1)" size={22} strokeWidth={1.4} />}
          href="/configs"
        />
        <Round
          icon={<IconMessage color="var(--cSuccess)" size={22} strokeWidth={1.4} />}
          onClick={(e: any) => {
            openChat(e);
            setCountChat(0);
          }}
          bage={countChat}
        />
        <Dropdown
          trigger={
            <div className={styles.notificationContainer} title={translate("changeLanguage")}>
              <div className={styles.notificationIcon}>
                <IconWorld color="var(--cWhiteV1)" size={22} strokeWidth={1.4} />
              </div>
            </div>
          }
          items={languageMenuItems}
          activeValue={locale}
          onClick={(value: string) => {
            setPreference(value as AppLocale);
            if (typeof window !== "undefined") window.location.reload();
          }}
          ignoreTranslation
        />
      </div>
    </div>
  );
};

export default Header;
