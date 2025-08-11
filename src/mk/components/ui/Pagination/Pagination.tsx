import {
  IconArrowBack,
  IconArrowNext,
} from "@/components/layout/icons/IconsBiblioteca";
import { useEffect, useMemo, useState } from "react";
import styles from "./pagination.module.css";
import Select from "../../forms/Select/Select";

type PropsType = {
  className?: string;
  currentPage: number;
  nextLabel?: string;
  onPageChange: (page: number) => void;
  previousLabel?: string;
  setParams: any;
  totalPages: number;
  total?: number | null;
  params: any;
};

const Pagination = ({
  className = "",
  currentPage = 1,
  nextLabel = "Siguiente",
  onPageChange = (page: number) => {},
  previousLabel = "Anterior",
  totalPages,
  setParams,
  params,
  total = null,
}: PropsType) => {
  const [pageInput, setPageInput] = useState<string>(currentPage.toString());

  // Asegurar que totalPages sea siempre al menos 1
  const safeTotal = useMemo(() => Math.max(1, totalPages || 1), [totalPages]);

  // Actualizar el input cuando cambia la página actual
  useEffect(() => {
    setPageInput(currentPage.toString());
  }, [currentPage]);

  const {
    firstPage,
    lastPage,
    goToNextPage,
    goToPreviousPage,
    range,
    goToPage,
  } = useMemo(() => {
    const firstPage = safeTotal > 1 ? Math.max(1, currentPage - 3) : 1;
    const lastPage = safeTotal > 1 ? Math.min(currentPage + 3, safeTotal) : 1;

    const goToNextPage = (): void => {
      onPageChange(Math.min(currentPage + 1, safeTotal));
    };

    const goToPreviousPage = (): void => {
      onPageChange(Math.max(currentPage - 1, 1));
    };

    const goToPage = (page: number): void => {
      if (page >= 1 && page <= safeTotal) {
        onPageChange(page);
      }
    };

    const range = (start: number, end: number): number[] => {
      if (start >= end) {
        return [];
      }
      return Array.from({ length: end - start + 1 }, (_, i) => start + i);
    };
    return {
      firstPage,
      lastPage,
      goToNextPage,
      goToPreviousPage,
      range,
      goToPage,
    };
  }, [currentPage, safeTotal, onPageChange]);

  // Manejar la entrada de la página
  const handlePageInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setPageInput(e.target.value);
  };

  // Manejar envío del formulario
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const pageNumber = parseInt(pageInput);
    if (!isNaN(pageNumber)) {
      goToPage(pageNumber);
    }
  };

  // Manejar pulsación de tecla en el input
  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      e.preventDefault();
      const pageNumber = parseInt(pageInput);
      if (!isNaN(pageNumber)) {
        goToPage(pageNumber);
      }
    }
  };

  // if (safeTotal <= 1) {
  //   return null;
  // }
  // if (total == 0) {
  //   return null;
  // }
  return (
    <div className={`${styles.pagination} ${className}`}>
      {/* {totalPages > 1 ? ( */}
      <>
        {/* Texto informativo a la izquierda */}
        <div className={styles.paginationInfo}>
          <span className={styles.currentPageInfo}>
            <button
              className={styles.goToPageButton}
              onClick={() => goToPage(1)}
              disabled={totalPages <= 1}
            >
              Ir a la página 1
            </button>
          </span>
        </div>

        {/* Botones de navegación en el centro */}
        <div className={styles.navigationButtons}>
          <button
            className={styles.navButton}
            onClick={goToPreviousPage}
            disabled={currentPage <= 1}
          >
            <IconArrowBack size={16} color="var(--cWhite)" />
          </button>
          <button
            className={styles.nextButton}
            onClick={goToNextPage}
            disabled={currentPage >= safeTotal}
          >
            Pág. siguiente <IconArrowNext size={18} color="var(--cWhiteV1)" />
          </button>
          <span className={styles.totalPages}>
            {currentPage}/{safeTotal}
          </span>
        </div>
      </>
      {/* ) : (
        <div style={{ flexGrow: 1 }}></div>
      )} */}
      {/* Selector de página a la derecha */}
      <div className={styles.pageSelector}>
        <form onSubmit={handleSubmit} className={styles.pageForm}>
          <span className={styles.pageInfo}>
            <span className={styles.currentPageLabel}>Ir a la página</span>
            {/* <span className={styles.totalPages}>
              {currentPage}/{safeTotal}
            </span> */}
          </span>
          {/* {totalPages > 1 && ( */}
          <div style={{ position: "relative" }}>
            <input
              type="text"
              value={pageInput}
              onChange={handlePageInputChange}
              onKeyDown={handleKeyDown}
              className={styles.pageInput}
              aria-label="Ir a página"
              disabled={totalPages <= 1}
            />

            <button
              type="submit"
              className={styles.goButton}
              disabled={totalPages <= 1}
            >
              Ir
            </button>
          </div>
          {/* )} */}
        </form>
      </div>

      {/* Select para elementos por página - oculto pero funcional */}
      {/* <div className={styles.hiddenPerPage}>
        <Select
          inputStyle={{ display: "none" }}
          name="perPage"
          label=""
          options={[
            { id: 10, name: "10" },
            { id: 20, name: "20" },
            { id: 30, name: "30" },
            { id: 40, name: "40" },
          ]}
          value={params?.perPage}
          onChange={(e) => {
            setParams({ ...params, perPage: e.target.value, page: 1 });
          }}
        />
      </div> */}
    </div>
  );
};

export default Pagination;
