import { useEffect, useState } from "react";
import styles from "./sidemenu.module.css";
import {
  IconArrowLeft,
  IconArrowRight,
} from "@/components/layout/icons/IconsBiblioteca";

interface PropsType {
  children: any;
  collapsed: boolean;
  setCollapsed: (collapsed: boolean) => void;
}

const SideMenu = ({ children, collapsed, setCollapsed }: PropsType) => {
  const [showIcon, setShowIcon] = useState(true);

  const toggleSidebar = () => {
    setCollapsed(!collapsed);
  };

  useEffect(() => {
    setShowIcon(collapsed);
  }, [collapsed]);

  return (
    <div
      className={styles.sidebarContainer}
      onMouseEnter={() => setShowIcon(true)}
      onMouseLeave={() => setShowIcon(collapsed)}
    >
      <div className={collapsed ? styles.collapsed : styles.expanded}>
        {showIcon &&
          (collapsed ? (
            <IconArrowRight
              onClick={toggleSidebar}
              className={styles.toggleIcon}
            />
          ) : (
            <IconArrowLeft
              onClick={toggleSidebar}
              className={styles.toggleIcon}
            />
          ))}
        <section>{children}</section>
      </div>
    </div>
  );
};

export default SideMenu;
