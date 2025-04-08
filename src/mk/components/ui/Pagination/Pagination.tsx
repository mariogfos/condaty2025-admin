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
  const [perPageInput, setPerPageInput] = useState<string>(
    (params?.perPage || 10).toString()
  );

  // Asegurar que totalPages sea siempre al menos 1
  const safeTotal = useMemo(() => Math.max(1, totalPages || 1), [totalPages]);

  // Actualizar el input cuando cambia la página actual
  useEffect(() => {
    setPageInput(currentPage.toString());
    setPerPageInput((params?.perPage || 10).toString());
  }, [currentPage, params?.perPage]);

  const { goToNextPage, goToPreviousPage, goToPage } = useMemo(() => {
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

    return { goToNextPage, goToPreviousPage, goToPage };
  }, [currentPage, safeTotal, onPageChange]);

  // Manejar el cambio en el input de elementos por página
  const handlePerPageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setPerPageInput(e.target.value);
  };

  // Aplicar el cambio de elementos por página
  const handlePerPageSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const perPage = parseInt(perPageInput);
    if (!isNaN(perPage) && perPage > 0) {
      setParams({ ...params, perPage, page: 1 });
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
          disabled={currentPage >= safeTotal}
        >
          Siguiente <IconArrowNext size={18} color="var(--cWhiteV1)" />
        </button>
      </div>

      {/* Selector de página a la derecha */}
      <div className={styles.pageSelector}>
        <form onSubmit={handlePerPageSubmit} className={styles.pageForm}>
          <span>ir a una página, 1/{safeTotal}</span>
          <input
            type="number"
            min="1"
            value={perPageInput}
            onChange={handlePerPageChange}
            className={styles.pageInput}
            aria-label="Elementos por página"
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