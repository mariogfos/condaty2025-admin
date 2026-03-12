"use client";
import React, { useState, useRef, useEffect } from "react";
import styles from "./Dropdown.module.css";
import { useRouter, usePathname } from "next/navigation";

type DropdownProps = {
  trigger: React.ReactNode;
  items: { name: string; route: string }[] | string[]; // Cambiado para recibir un array de objetos
  onClick?: Function;
};

const Dropdown = ({ trigger, items, onClick }: DropdownProps) => {
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const router: any = useRouter();
  const path = usePathname();

  const handleDropdownToggle = () => {
    setDropdownOpen(!dropdownOpen);
  };

  const handleClickOutside = (event: MouseEvent) => {
    if (
      dropdownRef.current &&
      !dropdownRef.current.contains(event.target as Node)
    ) {
      setDropdownOpen(false);
    }
  };

  useEffect(() => {
    document.addEventListener("mousedown", handleClickOutside);

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  const handleLinkClick = (route: string) => {
    setDropdownOpen(false); // Cierra el dropdown

    if (onClick) {
      onClick(route);
    } else {
      router.push(route);
    } // Navega a la nueva página
  };

  return (
    <div className={styles.dropdown} ref={dropdownRef}>
      <div onClick={handleDropdownToggle}>{trigger}</div>
      {dropdownOpen && (
        <div className={styles.dropdownMenu}>
          {items.map((item) => {
            const isActive =
              path === (typeof item == "string" ? item : item.route); // Verifica si está activo
            return (
              <p
                key={typeof item == "string" ? item : item.route}
                className={isActive ? styles.active : ""}
                onClick={() =>
                  handleLinkClick(typeof item == "string" ? item : item.route)
                }
                style={{
                  backgroundColor: isActive ? "rgba(6, 7, 8, 0.5)" : "", // Cambia el fondo si está activo
                  borderRadius: 8,
                }}
              >
                {typeof item == "string" ? item : item.name}
              </p>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default Dropdown;
