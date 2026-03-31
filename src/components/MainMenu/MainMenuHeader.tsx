"use client";
import React from "react";
import { Avatar } from "../../mk/components/ui/Avatar/Avatar";
import { getFullName } from "@/mk/utils/string";
import styles from "./mainmenu.module.css";

interface MainMenuHeaderProps {
  user: any;
  collapsed: boolean;
}

const MainMenuHeader: React.FC<MainMenuHeaderProps> = ({ user, collapsed }) => {
  const client = user?.clients?.find((c: any) => c.id == user?.client_id);
  return (
    <div className={styles.menuHeader}>
      {!collapsed && (
        <>
          <div
            className={styles.headerImage}
            style={{
              backgroundImage: client?.url_banner?.[0]
                ? `url(${client.url_banner[0]})`
                : undefined,
            }}
          />
          <div className={styles.titleContainer}>
            <div className={styles.headerTitle}>Condominio</div>
            <div className={styles.headerSubtitle} data-i18n-ignore="true">
              {client?.name}
            </div>
          </div>
        </>
      )}
      {collapsed && (
        <div>
          <Avatar
            src={client?.url_banner?.[0]}
            name={getFullName(user)}
            w={48}
            h={48}
            style={{ borderRadius: 8 }}
          />
        </div>
      )}
    </div>
  );
};

export default MainMenuHeader;
