import {
  IconArrowBack,
  IconArrowLeft,
  IconArrowNext,
  IconArrowRight,

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

  // Actualizar el input cuando cambia la página actual
  useEffect(() => {
    setPageInput(currentPage.toString());
  }, [currentPage]);

  const { firstPage, lastPage, goToNextPage, goToPreviousPage, range, goToPage } =
    useMemo(() => {
      const firstPage = totalPages > 1 ? Math.max(1, currentPage - 3) : 1;
      const lastPage =
        totalPages > 1 ? Math.min(currentPage + 3, totalPages) : 1;

      const goToNextPage = (): void => {
        onPageChange(Math.min(currentPage + 1, totalPages));
      };

      const goToPreviousPage = (): void => {
        onPageChange(Math.max(currentPage - 1, 1));
      };

      const goToPage = (page: number): void => {
        if (page >= 1 && page <= totalPages) {
          onPageChange(page);
        }
      };

      const range = (start: number, end: number): number[] => {
        if (start >= end) {
          return [];
        }
        return Array.from({ length: end - start + 1 }, (_, i) => start + i);
      };
      return { firstPage, lastPage, goToNextPage, goToPreviousPage, range, goToPage };
    }, [currentPage, totalPages, onPageChange]);

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

  return (
    <div className={`${styles.pagination} ${className}`}>
      {/* Texto informativo a la izquierda */}
      <div className={styles.paginationInfo}>
        <span>ir a la página {currentPage}</span>
      </div>

      {/* Botones de navegación en el centro */}
      <div className={styles.navigationButtons}>
        <button
          className={styles.navButton}
          onClick={goToPreviousPage}
          disabled={currentPage <= 1}
        >
          <IconArrowBack size={18} color="var(--cWhite)" />
        </button>
        <button
          className={styles.nextButton}
          onClick={goToNextPage}
          disabled={currentPage >= totalPages}
        >
          Siguiente <IconArrowNext size={18} color="var(--cWhiteV1)" />
        </button>
      </div>

      {/* Selector de página a la derecha */}
      <div className={styles.pageSelector}>
        <form onSubmit={handleSubmit} className={styles.pageForm}>
          <span>ir a una página, 1/{totalPages}</span>
          <input
            type="text"
            value={pageInput}
            onChange={handlePageInputChange}
            className={styles.pageInput}
            aria-label="Ir a página"
          />
          <button type="submit" className={styles.goButton}>
            Ir <IconArrowNext size={16} color="var(--accent)" />
          </button>
        </form>
      </div>

      {/* Select para elementos por página - oculto pero funcional */}
      <div className={styles.hiddenPerPage}>
        <Select
          inputStyle={{ display: 'none' }}
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
      </div>
    </div>
  );
};

export default Pagination;