import React from "react";
import Link from "next/link";
import styles from "./mainmenu.module.css";
import { usePathname } from "next/navigation";

interface MainmenuItemProps {
  href: string;
  label: string;
  labelColor?: string;
  icon: React.ReactNode;
  onclick?: () => void;
  collapsed?: boolean;
}

const MainmenuItem: React.FC<MainmenuItemProps> = ({
  href,
  label,
  labelColor,
  icon,
  onclick,
  collapsed,
}) => {
  const pathname = usePathname();
  return (
    <div className={styles.menuItem}>
      <Link
        className={`${pathname === href ? `${styles.active}` : ""} ${
          collapsed ? `${styles.collapsed}` : ""
        }`}
        onClick={onclick}
        href={href}
      >
        <p>{icon}</p>
        {!collapsed && <p style={{ color: labelColor }}>{label}</p>}
      </Link>
    </div>
  );
};

export default MainmenuItem;
