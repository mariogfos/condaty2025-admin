import {
  IconArrowLeft,
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
  // const [perPage, setPerPage] = useState(params?.perPage);
  const { firstPage, lastPage, goToNextPage, goToPreviousPage, range } =
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
      const range = (start: number, end: number): number[] => {
        if (start >= end) {
          return [];
        }
        return Array.from({ length: end - start + 1 }, (_, i) => start + i);
      };
      return { firstPage, lastPage, goToNextPage, goToPreviousPage, range };
    }, [currentPage, totalPages]);

  // useEffect(() => {
  //   if (perPage) {
  //     setParams({ ...params, perPage: perPage });
  //   }
  // }, [perPage]);

  return (
    <div className={styles.pagination + " " + className}>
      <div>
        {totalPages > 1 && (
          <>
            <span>
              <IconArrowLeft
                onClick={goToPreviousPage}
                size={20}
                color="var(--cBlackV2)"
              />
            </span>
            <span>
              <IconArrowRight
                onClick={goToNextPage}
                size={20}
                color="var(--cBlackV2)"
              />
            </span>
          </>
        )}
      </div>
      <div>
        {range(firstPage, lastPage).map((page: number) => (
          <div
            key={page}
            onClick={() => onPageChange(page)}
            className={page == currentPage ? styles["active"] : ""}
          >
            {page}
          </div>
        ))}
        {totalPages <= 1 && <div className={styles["active"]}>1</div>}
      </div>
      {/* <span>
        <IconArrowRight onClick={goToNextPage} />
      </span> */}
      <div>
        <p>Total {total} items </p>
        <Select
          inputStyle={{ marginBottom: 0 }}
          name="perPage"
          label=""
          style={{ width: 120 }}
          options={[
            { id: 10, name: "10" },
            { id: 20, name: "20" },
            { id: 30, name: "30" },
            { id: 40, name: "40" },
          ]}
          value={params?.perPage}
          onChange={(e) => {
            setParams({ ...params, perPage: e.target.value, page: 1 });
            // range(1, 3);
          }}
        />
      </div>

      {/* {total && <p> Total items: {total}</p>} */}
    </div>
  );
};

export default Pagination;
