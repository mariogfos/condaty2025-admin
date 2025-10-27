import React, { useEffect, useRef, useState, useMemo, useCallback } from "react";
import Link from "next/link";
import { usePathname, useSearchParams } from "next/navigation";
import styles from "./mainmenu.module.css";
import { IconArrowDown, IconArrowUp } from "../layout/icons/IconsBiblioteca";

interface MenuItem {
  href: string;
  label: string;
  bage?: number;
}

interface MainmenuDropdownProps {
  label: string;
  icon: React.ReactNode;
  items: MenuItem[];
  collapsed?: boolean;
  isOpen?: boolean;
  onToggle?: () => void;
  setSideBarOpen?: (open: boolean) => void;
}

const Badge: React.FC = () => (
  <span
    style={{
      height: 8,
      width: 8,
      backgroundColor: "var(--cError)",
      borderRadius: "50%",
      display: "inline-block",
    }}
  />
);

const MainmenuDropdown = ({
  label, icon, items,
  collapsed = false,
  isOpen = false, onToggle,
  setSideBarOpen }: MainmenuDropdownProps) => {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const dropdownRef = useRef<HTMLDivElement>(null);

  const type = searchParams?.get("type");

  const hasItemWithBadge = useMemo(
    () => items.some((item) => Number(item.bage) > 0),
    [items]
  );

  // Función para validar si la ruta actual coincide con el href del item
  const validatePathname = useCallback(
    (item: MenuItem) => {
      if (pathname === item.href) return true;

      if (pathname === "/categories") {
        if (item.href === "/payments" && type === "I") return true;
        if (item.href === "/outlays" && type === "E") return true;
      }

      if (item.href === "/units" && pathname?.startsWith("/dashDpto/")) {
        return true;
      }

      return false;
    },
    [pathname, type]
  );

  // Verificar si alguna ruta del dropdown está activa
  const isRouteActive = useMemo(
    () => items.some((item) => validatePathname(item)),
    [items, validatePathname]
  );

  const handleLinkClick = useCallback(() => {
    setSideBarOpen?.(false);
  }, [setSideBarOpen]);

  // Cerrar el dropdown al hacer clic afuera
  useEffect(() => {
    if (!collapsed) return;

    const handleClickOutside = (event: MouseEvent) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node) &&
        isOpen
      ) {
        onToggle?.();
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [collapsed, isOpen, onToggle]);

  return (
    <div
      ref={dropdownRef}
      className={[
        styles.menuDropdown,
        isOpen && styles.isOpen,
        collapsed && styles.collapsed,
        isRouteActive && styles.isRouteActive,
      ]
        .filter(Boolean)
        .join(" ")}
    >
      <div onClick={onToggle} className={styles.dropdownHeader}>
        <div className={styles.dropdownLabel}>
          {icon}
          {!collapsed && <p>{label}</p>}
          {hasItemWithBadge && <Badge />}
        </div>
        {!collapsed && (isOpen ? <IconArrowUp /> : <IconArrowDown />)}
      </div>

      {isOpen && (
        <div className={styles.dropdownContent}>
          {items.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              onClick={handleLinkClick}
              className={[
                validatePathname(item) && styles.active,
                styles.dropdownItem,
              ]
                .filter(Boolean)
                .join(" ")}
            >
              <div className={styles.contentWithBadge}>
              {item.label}
              {Number(item.bage) > 0 && <Badge />}
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
};

export default MainmenuDropdown;
