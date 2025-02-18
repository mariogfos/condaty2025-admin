import { useEffect, useState } from "react";
import { IconArrowLeft } from "../../../../components/layout/icons/IconsBiblioteca";
import styles from "./sidebar.module.css";

interface PropsType {
  open: boolean;
  onClose: any;
  children: any;
  iconClose?: boolean;
}

const Sidebar = ({ open, onClose, children, iconClose = true }: PropsType) => {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  const handleSidebarClose = () => {
    setIsSidebarOpen(false);
    setTimeout(() => {
      onClose(false);
    }, 300);
  };

  useEffect(() => {
    setIsSidebarOpen(open);
  }, [open]);

  return (
    open && (
      <div className={styles.sidebar} onClick={handleSidebarClose}>
        <nav
          className={isSidebarOpen ? styles["open"] : ""}
          onClick={(e) => e.stopPropagation()} 
        >
          {iconClose && (
            <header>
              <IconArrowLeft onClick={handleSidebarClose} />
            </header>
          )}
          <section>{children}</section>
        </nav>
      </div>
    )
  );
};

export default Sidebar;
