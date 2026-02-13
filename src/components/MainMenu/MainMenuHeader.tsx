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
  const client = user?.clients?.find((c: any) => c.id == user?.client_id);
  return (
    <div className={styles.menuHeader}>
      <div>
        <Avatar
          src={client?.url_banner?.[0]}
          name={getFullName(user)}
          w={collapsed ? 48 : 210}
          h={collapsed ? 48 : 128}
          style={{ borderRadius: 8 }}
        />
      </div>
      {!collapsed && (
        <div>
          <p style={{ color: "var(--cWhite)" }}>{client?.name}</p>
        </div>
      )}
    </div>
  );
};

export default MainMenuHeader;
