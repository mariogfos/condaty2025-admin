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
import { getFullName, getUrlImages } from "@/mk/utils/string";
import { useAuth } from "@/mk/contexts/AuthProvider";
// import useScreenSize from "@/mk/hooks/useScreenSize";
import Dropdown from "../Dropdown/Dropdown";

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
                  hasImage={user.has_image}
                  name={getFullName(user)}
                  src={getUrlImages(
                    "/ADM-" + user?.id + ".png?d=" + user?.updated_at
                  )}
                  onClick={() => {
                    router.push("/profile");
                  }}
                  h={48}
                  w={48}
                />
                <p>{getFullName(user)}</p>
                <p>{client?.name}</p>
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
            hasImage={user.has_image}
            name={getFullName(user)}
            src={getUrlImages(
              "/ADM-" + user?.id + ".png?d=" + user?.updated_at
            )}
            onClick={() => {
              setOpenModal("profile");
            }}
            h={40}
            w={40}
          />
          <div>
            <p>{getFullName(user)}</p>
            <p>Administración</p>
          </div>
        </section>
        <a>
          {/* <Dropdown trigger={<IconArrowDown />}>
            <p onClick={() => setOpenModal("profile")}>Mi perfil</p>
            <p onClick={handleLogout}>Cerrar sesión</p>
          </Dropdown> */}
        </a>
      </header>
    </>
  );
};

export default Navbar;
