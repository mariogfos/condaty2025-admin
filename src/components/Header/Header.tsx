"use client";
import { getFullName, getUrlImages } from "@/mk/utils/string";
import { Avatar } from "@/mk/components/ui/Avatar/Avatar";
import styles from "./header.module.css";
import { IconMenu, IconSetting } from "../layout/icons/IconsBiblioteca";
import Dropdown from "@/mk/components/ui/Dropdown/Dropdown";
import HeadTitle from "../HeadTitle/HeadTitle";

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
  const menuItems = [
    { name: "Territorio", route: "/territory" },
    // { name: "Afiliados", route: "/educations" },
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
              <Dropdown
                trigger={<IconSetting circle size={32} />}
                items={menuItems}
              />
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

      <div style={{ cursor: "pointer" }}>
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

export default Header;
