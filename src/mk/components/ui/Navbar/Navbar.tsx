import { useRouter } from "next/router";
import styles from "./styles.module.css";
import {
  IconArrowDown,
  IconArrowLeft,
  IconMenu,
  IconNotification,
  IconSetting,
} from "@/components/layout/icons/IconsBiblioteca";
import { Avatar } from "../Avatar/Avatar";
import { getFullName } from "@/mk/utils/string";
import { useAuth } from "@/mk/contexts/AuthProvider";

const Navbar = ({
  client,
  user,
  setOpenModal,
  sideBarOpen,
  setSideBarOpen,
}: any) => {
  const router = useRouter();
  const isHome = router.pathname === "/";
  const { logout } = useAuth();
  const { store } = useAuth();
  // const { isDesktop } = useScreenSize();
  const isDesktop = true;
  const handleLogout = () => {
    logout();
  };

  const handleBack = () => {
    router.back();
  };

  return (
    <>
      <header className={styles.navbar}>
        <div>
          {isHome ? (
            <>
              <IconMenu
                onClick={() => setSideBarOpen(!sideBarOpen)}
                size={24}
              />
            </>
          ) : (
            <IconArrowLeft onClick={handleBack} size={24} />
          )}
        </div>
        {isHome ? (
          <>
            {isDesktop ? (
              <head>{store?.title}</head>
            ) : (
              <head>
                <Avatar
                  name={getFullName(user)}
                  src={user?.url_avatar}
                  onClick={() => {
                    router.push("/profile");
                  }}
                  h={48}
                  w={48}
                />
                <p data-i18n-ignore="true">{getFullName(user)}</p>
                <p data-i18n-ignore="true">{client?.name}</p>
              </head>
            )}
          </>
        ) : (
          <head>{store?.title}</head>
        )}
        {isHome && (
          <div>
            <IconNotification onClick={() => router.push("/notifications")} />
          </div>
        )}
        <span>
          <IconSetting onClick={() => router.push("/setting")} />
        </span>
        <span>
          <IconNotification onClick={() => router.push("/notifications")} />
        </span>
        <section>
          <Avatar
            name={getFullName(user)}
            src={user?.url_avatar}
            onClick={() => {
              setOpenModal("profile");
            }}
            h={40}
            w={40}
          />
          <div>
            <p data-i18n-ignore="true">{getFullName(user)}</p>
            <p>Administración</p>
          </div>
        </section>
        <a></a>
      </header>
    </>
  );
};

export default Navbar;
