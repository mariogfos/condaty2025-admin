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
  bage?: number | any;
}

const MainmenuItem: React.FC<MainmenuItemProps> = ({
  href,
  label,
  labelColor,
  bage,
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
        {bage > 0 && (
          <p
            style={{
              height: 8,
              width: 8,
              backgroundColor: "var(--cError)",
              borderRadius: "50%",
            }}
          />
        )}
      </Link>
    </div>
  );
};

export default MainmenuItem;
