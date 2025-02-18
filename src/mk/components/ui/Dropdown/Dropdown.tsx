"use client";
import React, { useState, useRef, useEffect } from "react";
import styles from "./styles.module.css";
import { useRouter, usePathname } from "next/navigation";

type DropdownProps = {
  trigger: React.ReactNode;
  items: { name: string; route: string }[]; // Cambiado para recibir un array de objetos
};

const Dropdown = ({ trigger, items }: DropdownProps) => {
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
    router.push(route); // Navega a la nueva página
  };

  return (
    <div className={styles.dropdown} ref={dropdownRef}>
      <div onClick={handleDropdownToggle}>{trigger}</div>
      {dropdownOpen && (
        <div className={styles.dropdownMenu}>
          {items.map((item) => {
            const isActive = path === item.route; // Verifica si está activo
            return (
              <p
                key={item.route}
                className={isActive ? styles.active : ""}
                onClick={() => handleLinkClick(item.route)}
                style={{
                  backgroundColor: isActive ? "rgba(33, 37, 41, 0.5)" : "", // Cambia el fondo si está activo
                  borderRadius: 8,
                }}
              >
                {item.name}
              </p>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default Dropdown;
