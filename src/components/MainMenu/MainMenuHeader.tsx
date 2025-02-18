"use client";
import React from "react";
import { useRouter } from "next/navigation";
import { Avatar } from "../../mk/components/ui/Avatar/Avatar";
import { IconLogoElekta } from "../layout/icons/IconsBiblioteca";
import { getFullName, getUrlImages } from "@/mk/utils/string";
import styles from "./mainmenu.module.css";

interface MainMenuHeaderProps {
  user: any;
  collapsed: boolean;
}

const MainMenuHeader: React.FC<MainMenuHeaderProps> = ({ user, collapsed }) => {
  const router = useRouter();

  return (
    <div className={styles.menuHeader}>
      <div>
      <Avatar
            src={getUrlImages(
              "/ADM-" + user?.id + ".png?d=" + user?.updated_at
            )}
            name={getFullName(user)}
            w={collapsed ? 48 : 128}
            h={collapsed ? 48 : 128}
           style={{borderRadius:8}}
          />
      </div>
      {/* <div>
        <Avatar
          w={collapsed ? 64 : 128}
          h={collapsed ? 64 : 128}
          name={getFullName(user)}
          src={getUrlImages(`/ADM-${user?.id}.webp?d=${user?.updated_at}`)}
          onClick={() => router.push("/profile")}
        />
      </div> */}
      {!collapsed && (
        <div>
          <p>{getFullName(user)}</p>
          <p style={{color: "var(--cBlackV2)"}}>{user?.role?.name}</p>
          <p style={{color: "var(--cBlackV2)"}}>{user?.entidad?.name}</p>
        </div>
      )}
    </div>
  );
};

export default MainMenuHeader;
