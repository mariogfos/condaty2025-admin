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
console.log(user,'usrrr')
  return (
    <div className={styles.menuHeader}>
      <div>
      <Avatar
            src={getUrlImages(
              "/CLIENT-" + user?.clients[0]?.id + ".webp?d=" + user?.clients[0]?.updated_at
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
          {/* <p>{getFullName(user)}</p> */}
          <p style={{color: "var(--cWhite)"}}>{user?.clients[0]?.name}</p>
          {/* <p style={{color: "var(--cBlackV2)"}}>{user?.entidad?.name}</p> */}
        </div>
      )}
    </div>
  );
};

export default MainMenuHeader;
