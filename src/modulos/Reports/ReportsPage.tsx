"use client";

import {
  type CSSProperties,
  type ReactNode,
  useCallback,
  useEffect,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { useSearchParams } from "next/navigation";
import {
  ChevronDown,
  Download,
  FileText,
  GripVertical,
  LoaderCircle,
  RefreshCw,
} from "lucide-react";
import Input from "@/mk/components/forms/Input/Input";
import useAxios from "@/mk/hooks/useAxios";
import {
  IconCheckOff,
  IconCheckSquare,
} from "@/components/layout/icons/IconsBiblioteca";
import {
  decodeReportViewerState,
  type ReportViewerState,
} from "./reportViewerState";
import { formatToDayDDMMYYYY } from "@/mk/utils/date";
import styles from "./ReportsPage.module.css";

type ReportFormat = "pdf" | "excel";

type RangePresetId = "year-to-date" | "this-month" | "last-30-days" | "custom";

type ReportColumn = {
  id: string;
  label: string;
  align?: "left" | "center" | "right";
  default?: boolean;
  minWidth?: number;
  defaultWeight?: number;
};

type ReportPageMode = {
  id: string;
  name: string;
  printSize: string;
  widthMm: number;
  heightMm: number;
  previewWidth: number;
  rowsPerPage: number;
};

type ReportSummary = {
  reportKey: string;
  title: string;
  reference: string;
  startDate: string;
  endDate: string;
  subtitle: string;
  client: {
    id?: number | null;
    name: string;
    logoUrl: string;
  };
  criteria: {
    startDate: string;
    endDate: string;
    searchBy: string;
    filterBy: string;
  };
  pageMode: ReportPageMode;
  pageModes: ReportPageMode[];
  availableColumns: ReportColumn[];
  selectedColumnIds: string[];
  selectedColumns: ReportColumn[];
  totalRows: number;
  totalPages: number;
  rowsPerPage: number;
  previewPageBatch: number;
  pdf: {
    available: boolean;
    enforceLimit: boolean;
    pageLimit: number;
    reason: string;
  };
  previewMarginMm: number;
  fileBaseName: string;
};

type PreviewPageRow = {
  id: string;
  values: Record<string, string>;
};

type PreviewPage = {
  pageNumber: number;
  rows: PreviewPageRow[];
};

type PagesPayload = {
  pages: PreviewPage[];
  nextPage: number | null;
  loadedRows: number;
  hasMorePages: boolean;
};

const APPEND_SKELETON_ROWS = 3;
const INITIAL_SKELETON_PAGES = 2;

const getTodayIsoDate = () => new Date().toISOString().slice(0, 10);

const getYearStartIsoDate = () => `${new Date().getFullYear()}-01-01`;

const getMonthStartIsoDate = () => {
  const today = new Date();
  const month = `${today.getMonth() + 1}`.padStart(2, "0");
  return `${today.getFullYear()}-${month}-01`;
};

const getPastIsoDate = (daysBack: number) => {
  const date = new Date();
  date.setDate(date.getDate() - daysBack);
  return date.toISOString().slice(0, 10);
};

const getDateRangePresets = () => {
  const today = getTodayIsoDate();

  return [
    {
      id: "year-to-date" as const,
      name: "Desde enero hasta hoy",
      startDate: getYearStartIsoDate(),
      endDate: today,
    },
    {
      id: "this-month" as const,
      name: "Este mes",
      startDate: getMonthStartIsoDate(),
      endDate: today,
    },
    {
      id: "last-30-days" as const,
      name: "Ultimos 30 dias",
      startDate: getPastIsoDate(29),
      endDate: today,
    },
  ];
};

const resolveRangePresetId = (
  startDate: string,
  endDate: string,
): RangePresetId => {
  const match = getDateRangePresets().find(
    (preset) => preset.startDate === startDate && preset.endDate === endDate,
  );

  return match?.id || "custom";
};

const clamp = (value: number, min: number, max: number) =>
  Math.min(Math.max(value, min), max);

const arraysEqual = (left: string[], right: string[]) =>
  left.length === right.length &&
  left.every((value, index) => value === right[index]);

const sanitizeBaseParams = (baseParams?: Record<string, any>) => {
  if (!baseParams) return {};

  const next = { ...baseParams };
  delete next.page;
  delete next.perPage;
  delete next._export;
  delete next.exportCols;
  delete next.exportTitulo;
  delete next.exportTitulos;
  delete next.exportAnchos;
  delete next.cols;

  return next;
};

const parseInitialDateRange = (state: ReportViewerState) => {
  const filterBy = String(state?.params?.filterBy || "");
  const tokens = filterBy
    .split("|")
    .map((token) => token.trim())
    .filter(Boolean);

  const rangeToken = tokens.find((token) =>
    /\d{4}-\d{2}-\d{2},\d{4}-\d{2}-\d{2}/.test(token),
  );

  if (!rangeToken) {
    return {
      startDate: getYearStartIsoDate(),
      endDate: getTodayIsoDate(),
    };
  }

  const rawValue = rangeToken.slice(rangeToken.indexOf(":") + 1);
  const [startDate = "", endDate = ""] = rawValue.split(",");

  return {
    startDate: startDate || getYearStartIsoDate(),
    endDate: endDate || getTodayIsoDate(),
  };
};

const buildTriggerLabel = (startDate: string, endDate: string) => {
  if (!startDate || !endDate) return "Seleccionar";
  return `${formatToDayDDMMYYYY(startDate)} - ${formatToDayDDMMYYYY(endDate)}`;
};

const buildColumnsTriggerLabel = (
  selectedColumnIds: string[],
  totalColumns: number,
) => {
  if (selectedColumnIds.length === 0) return "Seleccionar";
  if (selectedColumnIds.length === totalColumns) return "Todas las columnas";
  return `${selectedColumnIds.length} columnas activas`;
};

const getDefaultColumnWeight = (
  column: Pick<ReportColumn, "defaultWeight" | "align">,
  columnCount: number,
) => {
  if (typeof column.defaultWeight === "number") {
    return column.defaultWeight;
  }

  if (column.align === "right") return 1;
  if (column.align === "center") return 1.1;
  return columnCount <= 3 ? 1.6 : 1.25;
};

const getFlexibleColumnId = (columns: ReportColumn[]) => {
  if (columns.length === 0) return "";

  const preferredColumn = columns.find(
    (column) => column.id === "period_or_concept",
  );
  if (preferredColumn) return preferredColumn.id;

  const candidate = [...columns]
    .filter((column) => column.align !== "right")
    .sort(
      (a, b) =>
        getDefaultColumnWeight(b, columns.length) -
        getDefaultColumnWeight(a, columns.length),
    )[0];

  return candidate?.id || columns[0]?.id || "";
};

const buildGridTemplateColumns = (columns: ReportColumn[]) => {
  const flexibleColumnId = getFlexibleColumnId(columns);

  return columns
    .map((column) => {
      const baseWeight = clamp(
        getDefaultColumnWeight(column, columns.length),
        0.8,
        4.8,
      );
      const isFlexible = column.id === flexibleColumnId;
      const adjustedWeight =
        column.align === "right"
          ? Math.max(0.92, baseWeight * 0.92)
          : isFlexible
            ? Math.max(1.85, baseWeight * 1.28)
            : baseWeight;

      return `minmax(0, ${adjustedWeight.toFixed(2)}fr)`;
    })
    .join(" ");
};

const buildApiPath = (path: string, params?: Record<string, any>) => {
  const baseUrl = (process.env.NEXT_PUBLIC_API_URL || "").trim();
  const normalizedBase = baseUrl.endsWith("/") ? baseUrl.slice(0, -1) : baseUrl;
  const normalizedPath = path.startsWith("/") ? path : `/${path}`;
  const url = normalizedBase
    ? `${normalizedBase}${normalizedPath}`
    : normalizedPath;

  if (!params || Object.keys(params).length === 0) {
    return url;
  }

  const searchParams = new URLSearchParams();

  Object.entries(params).forEach(([key, value]) => {
    if (value === undefined || value === null || value === "") return;
    searchParams.set(key, String(value));
  });

  return `${url}?${searchParams.toString()}`;
};

const resolveApiErrorMessage = (response: any, fallback: string) => {
  const status = Number(response?.error?.status || 0);
  const message =
    response?.data?.message ||
    response?.error?.data?.message ||
    response?.error?.message ||
    "";

  if (status === 404) {
    return "El API configurado todavia no tiene desplegado el modulo Reports.";
  }

  if (
    typeof message === "string" &&
    /reporte no soportado|route .* not defined|not found/i.test(message)
  ) {
    return "El API configurado todavia no tiene desplegado el modulo Reports.";
  }

  return message || fallback;
};

const ToolbarPopover = ({
  label,
  value,
  open,
  onToggle,
  onClose,
  children,
  align = "left",
  trigger,
  panelClassName,
}: {
  label?: string;
  value?: string;
  open: boolean;
  onToggle: () => void;
  onClose: () => void;
  children: ReactNode;
  align?: "left" | "right";
  trigger?: ReactNode;
  panelClassName?: string;
}) => {
  const triggerRef = useRef<HTMLDivElement>(null);
  const panelRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;

    const handlePointerDown = (event: MouseEvent | TouchEvent) => {
      const target = event.target as Node | null;

      if (
        !target ||
        triggerRef.current?.contains(target) ||
        panelRef.current?.contains(target)
      ) {
        return;
      }

      onClose();
    };

    document.addEventListener("mousedown", handlePointerDown);
    document.addEventListener("touchstart", handlePointerDown);

    return () => {
      document.removeEventListener("mousedown", handlePointerDown);
      document.removeEventListener("touchstart", handlePointerDown);
    };
  }, [onClose, open]);

  return (
    <div ref={triggerRef} className={styles.toolbarField}>
      {trigger || (
        <button
          type="button"
          className={styles.toolbarPillButton}
          onClick={onToggle}
          aria-expanded={open}
        >
          <span className={styles.toolbarPillText}>
            <span className={styles.toolbarPillLabel}>{label}</span>
            <span className={styles.toolbarPillValue} title={value}>
              {value}
            </span>
          </span>
          <ChevronDown
            size={18}
            strokeWidth={1.8}
            className={`${styles.toolbarPillChevron} ${
              open ? styles.toolbarPillChevronOpen : ""
            }`}
          />
        </button>
      )}

      {open ? (
        <div
          ref={panelRef}
          className={`${styles.toolbarPanel} ${
            align === "right" ? styles.toolbarPanelRight : ""
          } ${panelClassName || ""}`}
        >
          {children}
        </div>
      ) : null}
    </div>
  );
};

const ReportCircleButton = ({
  title,
  onClick,
  disabled = false,
  children,
}: {
  title: string;
  onClick: () => void;
  disabled?: boolean;
  children: ReactNode;
}) => (
  <button
    type="button"
    className={styles.circleButton}
    onClick={onClick}
    disabled={disabled}
    title={title}
    aria-label={title}
  >
    {children}
  </button>
);

const buildSummaryParams = (input: {
  baseParams: Record<string, any>;
  startDate: string;
  endDate: string;
}) => ({
  ...input.baseParams,
  startDate: input.startDate,
  endDate: input.endDate,
});

const buildDataParams = (input: {
  baseParams: Record<string, any>;
  startDate: string;
  endDate: string;
  pageMode: string;
  selectedColumnIds: string[];
}) => ({
  ...input.baseParams,
  startDate: input.startDate,
  endDate: input.endDate,
  pageMode: input.pageMode,
  columns: input.selectedColumnIds.join(","),
});

const ReportsPage = () => {
  const isDevEnvironment = process.env.NODE_ENV !== "production";
  const searchParams = useSearchParams();
  const { execute } = useAxios();
  const sentinelRef = useRef<HTMLDivElement>(null);
  const previewViewportRef = useRef<HTMLDivElement>(null);
  const requestIdRef = useRef(0);
  const executeRef = useRef(execute);
  const columnItemRefs = useRef(new Map<string, HTMLDivElement>());
  const previousColumnRectsRef = useRef<Map<string, DOMRect>>(new Map());
  const draggingColumnIdRef = useRef<string | null>(null);

  const viewerState = useMemo<ReportViewerState>(
    () => decodeReportViewerState(searchParams?.get("state") || ""),
    [searchParams],
  );
  const reportKey = searchParams?.get("preset") || "";
  const baseParams = useMemo(
    () => sanitizeBaseParams(viewerState.params),
    [viewerState.params],
  );
  const initialRange = useMemo(
    () => parseInitialDateRange(viewerState),
    [viewerState],
  );

  const [pageMode, setPageMode] = useState("legal-landscape");
  const [startDate, setStartDate] = useState(initialRange.startDate);
  const [endDate, setEndDate] = useState(initialRange.endDate);
  const [openPopover, setOpenPopover] = useState<
    null | "page" | "range" | "columns" | "download"
  >(null);
  const [summary, setSummary] = useState<ReportSummary | null>(null);
  const [summaryError, setSummaryError] = useState("");
  const [loadingSummary, setLoadingSummary] = useState(true);
  const [pages, setPages] = useState<PreviewPage[]>([]);
  const [nextPage, setNextPage] = useState<number | null>(null);
  const [loadingPages, setLoadingPages] = useState(false);
  const [loadingMorePages, setLoadingMorePages] = useState(false);
  const [pagesError, setPagesError] = useState("");
  const [actionError, setActionError] = useState("");
  const [actionLoading, setActionLoading] = useState<null | "pdf" | "excel">(
    null,
  );
  const [refreshNonce, setRefreshNonce] = useState(0);
  const [selectedColumnIds, setSelectedColumnIds] = useState<string[]>([]);
  const [loadedColumnIds, setLoadedColumnIds] = useState<string[]>([]);
  const [columnOrder, setColumnOrder] = useState<string[]>([]);
  const [draggingColumnId, setDraggingColumnId] = useState<string | null>(null);

  useEffect(() => {
    executeRef.current = execute;
  }, [execute]);

  const hasValidDateRange =
    Boolean(startDate) && Boolean(endDate) && startDate <= endDate;

  const selectedColumnIdsKey = useMemo(
    () => selectedColumnIds.join("|"),
    [selectedColumnIds],
  );
  const columnOrderKey = useMemo(() => columnOrder.join("|"), [columnOrder]);

  const summaryParamsFingerprint = useMemo(
    () =>
      JSON.stringify(
        buildSummaryParams({
          baseParams,
          startDate,
          endDate,
        }),
      ),
    [baseParams, endDate, startDate],
  );

  const summaryRequestParams = useMemo(
    () => JSON.parse(summaryParamsFingerprint),
    [summaryParamsFingerprint],
  );

  const summaryRequestKey = useMemo(
    () =>
      JSON.stringify({
        reportKey,
        summaryParamsFingerprint,
        refreshNonce,
      }),
    [refreshNonce, reportKey, summaryParamsFingerprint],
  );

  const previewPageBatch = summary?.previewPageBatch || 1;

  const activeSummaryColumnIds = useMemo(
    () =>
      columnOrder.filter((columnId) => selectedColumnIds.includes(columnId)),
    [columnOrder, selectedColumnIds],
  );

  const requestColumnIds = useMemo(() => {
    if (loadedColumnIds.length === 0) {
      return activeSummaryColumnIds;
    }

    const hasNewColumn = activeSummaryColumnIds.some(
      (columnId) => !loadedColumnIds.includes(columnId),
    );

    if (!hasNewColumn) {
      return loadedColumnIds;
    }

    return columnOrder.filter(
      (columnId) =>
        activeSummaryColumnIds.includes(columnId) ||
        loadedColumnIds.includes(columnId),
    );
  }, [activeSummaryColumnIds, columnOrder, loadedColumnIds]);

  const requestColumnIdsKey = useMemo(
    () => requestColumnIds.join("|"),
    [requestColumnIds],
  );

  const buildDataRequestParams = useCallback(
    () =>
      buildDataParams({
        baseParams,
        startDate,
        endDate,
        pageMode,
        selectedColumnIds: requestColumnIds,
      }),
    [baseParams, endDate, pageMode, requestColumnIdsKey, startDate],
  );

  const dataRequestParams = useMemo(
    () => buildDataRequestParams(),
    [buildDataRequestParams],
  );

  const pagesRequestKey = useMemo(
    () =>
      JSON.stringify({
        summaryRequestKey,
        pageMode,
        requestColumnIdsKey,
      }),
    [pageMode, requestColumnIdsKey, summaryRequestKey],
  );

  useEffect(() => {
    setStartDate(initialRange.startDate);
    setEndDate(initialRange.endDate);
  }, [initialRange.endDate, initialRange.startDate, reportKey]);

  useEffect(() => {
    if (!hasValidDateRange || !reportKey) return;
    previewViewportRef.current?.scrollTo({ top: 0 });
  }, [hasValidDateRange, reportKey, pagesRequestKey]);

  useEffect(() => {
    setLoadedColumnIds([]);
  }, [summaryRequestKey]);

  const syncColumnsFromSummary = useCallback((payload: ReportSummary) => {
    const availableIds = payload.availableColumns.map((column) => column.id);

    setColumnOrder((current) => {
      const filteredCurrent = current.filter((columnId) =>
        availableIds.includes(columnId),
      );
      const missingIds = availableIds.filter(
        (columnId) => !filteredCurrent.includes(columnId),
      );
      const next = [...filteredCurrent, ...missingIds];

      return arraysEqual(current, next) ? current : next;
    });

    setSelectedColumnIds((current) => {
      const safeCurrent = current.filter((columnId) =>
        availableIds.includes(columnId),
      );

      if (safeCurrent.length > 0) {
        return arraysEqual(current, safeCurrent) ? current : safeCurrent;
      }

      const fallback =
        payload.selectedColumnIds.length > 0
          ? payload.selectedColumnIds
          : payload.availableColumns
              .filter((column) => column.default)
              .map((column) => column.id);

      return arraysEqual(current, fallback) ? current : fallback;
    });
  }, []);

  useEffect(() => {
    if (!reportKey) {
      setLoadingSummary(false);
      setSummary(null);
      setSummaryError("No se encontro un reporte configurado.");
      return;
    }

    if (!hasValidDateRange) {
      setLoadingSummary(false);
      setSummary(null);
      setSummaryError(
        !startDate || !endDate
          ? "Selecciona un rango de fechas para preparar el reporte."
          : "La fecha inicial no puede ser mayor a la fecha final.",
      );
      return;
    }

    let cancelled = false;
    const requestId = requestIdRef.current + 1;
    requestIdRef.current = requestId;

    const loadSummary = async () => {
      setLoadingSummary(true);
      setSummaryError("");
      setPagesError("");
      setActionError("");

      const response = await executeRef.current(
        `/reports/${reportKey}/summary`,
        "GET",
        summaryRequestParams,
        false,
        true,
      );

      if (cancelled || requestIdRef.current !== requestId) {
        return;
      }

      const payload = response?.data?.data;
      const failed =
        response?.error || response?.data?.success === false || !payload;

      if (failed) {
        setSummary(null);
        setLoadingSummary(false);
        setSummaryError(
          resolveApiErrorMessage(response, "No se pudo preparar el reporte."),
        );
        return;
      }

      setSummary(payload);
      setPageMode(payload.pageMode?.id || pageMode);
      syncColumnsFromSummary(payload);

      setLoadingSummary(false);
    };

    loadSummary();

    return () => {
      cancelled = true;
    };
  }, [
    hasValidDateRange,
    reportKey,
    startDate,
    endDate,
    summaryRequestKey,
    syncColumnsFromSummary,
    summaryRequestParams,
  ]);

  const availableColumnsById = useMemo(
    () =>
      new Map(
        (summary?.availableColumns || []).map((column) => [column.id, column]),
      ),
    [summary?.availableColumns],
  );

  const orderedColumns = useMemo(
    () =>
      columnOrder
        .map((columnId) => availableColumnsById.get(columnId))
        .filter(Boolean) as ReportColumn[],
    [availableColumnsById, columnOrder],
  );

  const activeColumns = useMemo(
    () =>
      orderedColumns.filter((column) => selectedColumnIds.includes(column.id)),
    [orderedColumns, selectedColumnIds],
  );

  const pageSpec = useMemo(
    () =>
      summary?.pageModes?.find((mode) => mode.id === pageMode) ||
      summary?.pageMode ||
      null,
    [pageMode, summary?.pageMode, summary?.pageModes],
  );

  const effectiveTotalPages = useMemo(() => {
    if (!summary || !pageSpec || summary.totalRows === 0) {
      return 0;
    }

    return Math.max(1, Math.ceil(summary.totalRows / pageSpec.rowsPerPage));
  }, [pageSpec, summary]);

  const effectivePdf = useMemo(() => {
    if (!summary) {
      return {
        available: false,
        pageLimit: 0,
        reason: "",
      };
    }

    const enforceLimit = summary.pdf.enforceLimit !== false;
    const available =
      !enforceLimit || effectiveTotalPages <= summary.pdf.pageLimit;

    return {
      available,
      pageLimit: summary.pdf.pageLimit,
      reason: available
        ? ""
        : `PDF deshabilitado a partir de ${summary.pdf.pageLimit} paginas. Usa Excel para volumenes grandes.`,
    };
  }, [effectiveTotalPages, summary]);

  const loadPageBatch = useCallback(
    async (startPage: number, replace = false) => {
      if (!reportKey || !summary || !hasValidDateRange) return;

      if (replace) {
        setLoadingPages(true);
        setPagesError("");
      } else {
        setLoadingMorePages(true);
      }

      const response = await executeRef.current(
        `/reports/${reportKey}/pages`,
        "GET",
        {
          ...dataRequestParams,
          startPage,
          pageCount: previewPageBatch,
        },
        false,
        true,
      );

      const payload = response?.data?.data as PagesPayload | undefined;
      const failed =
        response?.error || response?.data?.success === false || !payload;

      if (failed) {
        setPagesError(
          resolveApiErrorMessage(
            response,
            "No se pudo cargar la vista previa del reporte.",
          ),
        );
        setLoadingPages(false);
        setLoadingMorePages(false);
        return;
      }

      setPages((current) => {
        if (replace) {
          return payload.pages;
        }

        const seen = new Set(current.map((page) => page.pageNumber));
        const nextPages = payload.pages.filter(
          (page) => !seen.has(page.pageNumber),
        );

        return [...current, ...nextPages];
      });
      setLoadedColumnIds((current) => {
        if (arraysEqual(current, requestColumnIds)) {
          return current;
        }

        return requestColumnIds;
      });
      setNextPage(payload.nextPage);
      setLoadingPages(false);
      setLoadingMorePages(false);
    },
    [
      dataRequestParams,
      hasValidDateRange,
      previewPageBatch,
      reportKey,
      requestColumnIds,
      summary,
    ],
  );

  useEffect(() => {
    if (!summary || !reportKey || !hasValidDateRange) {
      setPages([]);
      setNextPage(null);
      setLoadingPages(false);
      setLoadingMorePages(false);
      return;
    }

    if (summary.totalRows === 0) {
      setPages([]);
      setNextPage(null);
      setLoadingPages(false);
      setLoadingMorePages(false);
      return;
    }

    setPages([]);
    setNextPage(null);
    setPagesError("");
    loadPageBatch(1, true);
  }, [hasValidDateRange, loadPageBatch, pagesRequestKey, reportKey, summary]);

  useEffect(() => {
    const sentinel = sentinelRef.current;
    if (!sentinel || !nextPage || loadingPages || loadingMorePages) return;

    const observer = new IntersectionObserver(
      (entries) => {
        if (!entries[0]?.isIntersecting) return;
        if (!nextPage || loadingMorePages) return;
        loadPageBatch(nextPage, false);
      },
      {
        root: previewViewportRef.current,
        rootMargin: "320px 0px",
      },
    );

    observer.observe(sentinel);

    return () => {
      observer.disconnect();
    };
  }, [loadPageBatch, loadingMorePages, loadingPages, nextPage]);

  useLayoutEffect(() => {
    const currentRects = new Map<string, DOMRect>();

    orderedColumns.forEach((column) => {
      const element = columnItemRefs.current.get(column.id);
      if (element) {
        currentRects.set(column.id, element.getBoundingClientRect());
      }
    });

    currentRects.forEach((currentRect, columnId) => {
      const previousRect = previousColumnRectsRef.current.get(columnId);
      if (!previousRect) return;

      const deltaY = previousRect.top - currentRect.top;
      if (Math.abs(deltaY) < 1) return;

      const element = columnItemRefs.current.get(columnId);
      if (!element) return;

      element.animate(
        [
          { transform: `translateY(${deltaY}px)` },
          { transform: "translateY(0)" },
        ],
        {
          duration: 80,
          easing: "ease-out",
        },
      );
    });

    previousColumnRectsRef.current = currentRects;
  }, [orderedColumns]);

  const handleToggleColumn = useCallback((columnId: string) => {
    setSelectedColumnIds((current) => {
      if (current.includes(columnId)) {
        const next = current.filter((value) => value !== columnId);
        return next.length > 0 ? next : current;
      }

      return [...current, columnId];
    });
  }, []);

  const handleColumnDragStart = useCallback((columnId: string) => {
    draggingColumnIdRef.current = columnId;
    setDraggingColumnId(columnId);
  }, []);

  const handleColumnDragEnter = useCallback((targetColumnId: string) => {
    const draggingId = draggingColumnIdRef.current;
    if (!draggingId || draggingId === targetColumnId) return;

    setColumnOrder((current) => {
      const fromIndex = current.indexOf(draggingId);
      const toIndex = current.indexOf(targetColumnId);

      if (fromIndex === -1 || toIndex === -1) return current;

      const next = [...current];
      next.splice(fromIndex, 1);
      next.splice(toIndex, 0, draggingId);
      return next;
    });
  }, []);

  const handleColumnDragEnd = useCallback(() => {
    draggingColumnIdRef.current = null;
    setDraggingColumnId(null);
  }, []);

  const reportTableStyle = useMemo<CSSProperties>(
    () => ({
      gridTemplateColumns: buildGridTemplateColumns(activeColumns),
    }),
    [activeColumns],
  );

  const pageStyle = useMemo<CSSProperties>(
    () =>
      pageSpec
        ? ({
            "--page-preview-width": `${pageSpec.previewWidth}px`,
            "--page-aspect-ratio": `${pageSpec.widthMm} / ${pageSpec.heightMm}`,
          } as CSSProperties)
        : {},
    [pageSpec],
  );

  const renderedPages = useMemo(() => {
    if (summary?.totalRows === 0) {
      return [];
    }

    return pages;
  }, [pages, summary?.totalRows]);

  const loadedRowsCount = useMemo(
    () => renderedPages.reduce((total, page) => total + page.rows.length, 0),
    [renderedPages],
  );

  const rangePresetId = useMemo(
    () => resolveRangePresetId(startDate, endDate),
    [endDate, startDate],
  );

  const publicStatusTitle = useMemo(() => {
    if (summaryError || pagesError || actionError) {
      return "No se pudo cargar el reporte";
    }

    if (
      loadingSummary ||
      (loadingPages && renderedPages.length === 0) ||
      loadingMorePages
    ) {
      return "Cargando reporte...";
    }

    if (!summary) return "Preparando reporte";
    if (summary.totalRows === 0) return "Reporte sin resultados";

    return `Reporte cargado (${effectiveTotalPages} paginas)`;
  }, [
    actionError,
    effectiveTotalPages,
    loadingMorePages,
    loadingPages,
    loadingSummary,
    pagesError,
    renderedPages.length,
    summary,
    summaryError,
  ]);

  const publicStatusHint = useMemo(() => {
    if (summaryError) return "Intenta recargar el reporte.";
    if (pagesError) return "La vista previa no termino de cargar.";
    if (actionError) return "Hubo un problema al descargar el archivo.";
    if (!summary) return "Estamos preparando la informacion.";
    if (summary.totalRows === 0)
      return "No encontramos registros para este rango.";

    return `${summary.totalRows} registros en total`;
  }, [actionError, pagesError, summary, summaryError]);

  const debugStatusTitle = useMemo(() => {
    if (loadingSummary) return "Preparando reporte";
    if (summaryError) return "No se pudo preparar el reporte";
    if (pagesError) return "No se pudo completar la vista previa";
    if (!summary) return "Sin reporte";
    if (summary.totalRows === 0) return "Sin resultados";
    if (loadingPages && renderedPages.length === 0) {
      return "Cargando las primeras hojas";
    }
    if (loadingMorePages) {
      return `Cargando vista previa ${renderedPages.length}/${effectiveTotalPages}`;
    }
    return `Vista previa ${renderedPages.length}/${effectiveTotalPages}`;
  }, [
    effectiveTotalPages,
    loadingMorePages,
    loadingPages,
    loadingSummary,
    pagesError,
    renderedPages.length,
    summary,
    summaryError,
  ]);

  const debugStatusHint = useMemo(() => {
    if (summaryError) return summaryError;
    if (pagesError) return pagesError;
    if (actionError) return actionError;
    if (!summary) return "El viewer espera un reporte configurado.";
    if (summary.totalRows === 0)
      return "No hay filas para este rango y filtros.";

    const previewHint = `${loadedRowsCount} de ${summary.totalRows} filas cargadas`;
    if (!effectivePdf.available) {
      return `${previewHint}. ${effectivePdf.reason}`;
    }

    return `${previewHint}. PDF y Excel listos desde backend.`;
  }, [
    actionError,
    effectivePdf.available,
    effectivePdf.reason,
    loadedRowsCount,
    pagesError,
    summary,
    summaryError,
  ]);

  useEffect(() => {
    if (!summary?.fileBaseName) return;
    document.title = summary.fileBaseName;
  }, [summary?.fileBaseName]);

  const isDownloadDisabled =
    !summary ||
    loadingSummary ||
    Boolean(summaryError) ||
    summary.totalRows === 0 ||
    actionLoading !== null;

  const handleRefresh = useCallback(() => {
    setRefreshNonce((current) => current + 1);
  }, []);

  const handleDownload = useCallback(
    async (format: ReportFormat) => {
      if (!summary || !reportKey) return;

      setActionError("");
      setOpenPopover(null);

      if (format === "pdf") {
        if (!effectivePdf.available) {
          setActionError(effectivePdf.reason || "PDF no disponible.");
          return;
        }

        const popup = window.open("", "_blank");
        if (!popup) {
          setActionError("No se pudo abrir la ventana del PDF.");
          return;
        }

        popup.document.write(
          "<!doctype html><html><body style='font-family:sans-serif;padding:24px'>Generando PDF...</body></html>",
        );

        setActionLoading("pdf");

        try {
          const response = await fetch(
            buildApiPath(`/reports/${reportKey}/document`, {
              ...dataRequestParams,
              autoprint: true,
            }),
            {
              credentials: "include",
            },
          );

          const html = await response.text();

          if (!response.ok) {
            popup.close();
            setActionError(html || "No se pudo preparar el PDF.");
            return;
          }

          popup.document.open();
          popup.document.write(html);
          popup.document.close();
        } catch (_error) {
          popup.close();
          setActionError("No se pudo preparar el PDF.");
        } finally {
          setActionLoading(null);
        }

        return;
      }

      setActionLoading("excel");

      try {
        const response = await fetch(
          buildApiPath(`/reports/${reportKey}/xlsx`, dataRequestParams),
          {
            credentials: "include",
          },
        );

        if (!response.ok) {
          const message = await response.text();
          setActionError(message || "No se pudo descargar el Excel.");
          setActionLoading(null);
          return;
        }

        const blob = await response.blob();
        const downloadUrl = window.URL.createObjectURL(blob);
        const link = document.createElement("a");
        link.href = downloadUrl;
        link.download = `${summary.fileBaseName}.xlsx`;
        document.body.appendChild(link);
        link.click();
        link.remove();
        window.URL.revokeObjectURL(downloadUrl);
      } catch (_error) {
        setActionError("No se pudo descargar el Excel.");
      } finally {
        setActionLoading(null);
      }
    },
    [
      dataRequestParams,
      effectivePdf.available,
      effectivePdf.reason,
      reportKey,
      summary,
    ],
  );

  if (!reportKey) {
    return (
      <section className={styles.reportRoot}>
        <div className={styles.emptyState}>
          <h1 className={styles.emptyTitle}>No hay reporte configurado</h1>
          <p className={styles.emptyDescription}>
            Esta pantalla necesita un identificador de reporte para poder
            abrirse.
          </p>
        </div>
      </section>
    );
  }

  return (
    <section className={styles.reportRoot}>
      <div className={styles.topLeftActions}>
        <div
          className={`${styles.statusPill} ${
            loadingSummary || loadingPages || loadingMorePages
              ? styles.statusPillLoading
              : ""
          }`}
        >
          <span className={styles.statusPillIcon}>
            {loadingSummary || loadingPages || loadingMorePages ? (
              <LoaderCircle
                size={18}
                strokeWidth={1.7}
                className={styles.spin}
              />
            ) : (
              <FileText size={18} strokeWidth={1.7} />
            )}
          </span>
          <span className={styles.statusPillText}>
            <span className={styles.statusPillTitle}>{publicStatusTitle}</span>
            <span className={styles.statusPillHint}>{publicStatusHint}</span>
          </span>
        </div>

        {isDevEnvironment ? (
          <div className={`${styles.statusPill} ${styles.debugStatusPill}`}>
            <span className={styles.statusPillIcon}>
              <FileText size={16} strokeWidth={1.6} />
            </span>
            <span className={styles.statusPillText}>
              <span className={styles.statusPillTitle}>{debugStatusTitle}</span>
              <span className={styles.statusPillHint}>{debugStatusHint}</span>
            </span>
          </div>
        ) : null}
      </div>

      <div className={styles.topCenterControls}>
        <div className={styles.toolbarPills}>
          <ToolbarPopover
            label="Pagina"
            value={pageSpec?.name || "Seleccionar"}
            open={openPopover === "page"}
            onToggle={() =>
              setOpenPopover((current) => (current === "page" ? null : "page"))
            }
            onClose={() => setOpenPopover(null)}
          >
            <div className={styles.panelHeader}>
              <h3 className={styles.panelTitle}>Tamaño de hoja</h3>
              <p className={styles.panelText}>
                El backend usa este mismo formato para preview, PDF e impresión.
              </p>
            </div>
            <div className={styles.rangePresetList}>
              {(summary?.pageModes || []).map((mode) => (
                <button
                  key={mode.id}
                  type="button"
                  className={`${styles.rangePresetButton} ${
                    pageMode === mode.id ? styles.rangePresetButtonActive : ""
                  }`}
                  onClick={() => {
                    setPageMode(mode.id);
                    setOpenPopover(null);
                  }}
                >
                  {mode.name}
                </button>
              ))}
            </div>
          </ToolbarPopover>

          <ToolbarPopover
            label="Rango"
            value={buildTriggerLabel(startDate, endDate)}
            open={openPopover === "range"}
            onToggle={() =>
              setOpenPopover((current) =>
                current === "range" ? null : "range",
              )
            }
            onClose={() => setOpenPopover(null)}
          >
            <div className={styles.panelHeader}>
              <h3 className={styles.panelTitle}>Rango de fechas</h3>
              <p className={styles.panelText}>
                El backend convierte las fechas al horario de Bolivia antes de
                armar el reporte.
              </p>
            </div>
            <div className={styles.rangePresetList}>
              {getDateRangePresets().map((preset) => (
                <button
                  key={preset.id}
                  type="button"
                  className={`${styles.rangePresetButton} ${
                    rangePresetId === preset.id
                      ? styles.rangePresetButtonActive
                      : ""
                  }`}
                  onClick={() => {
                    setStartDate(preset.startDate);
                    setEndDate(preset.endDate);
                    setOpenPopover(null);
                  }}
                >
                  {preset.name}
                </button>
              ))}
            </div>
            <div className={styles.dateGrid}>
              <div>
                <p className={styles.caption}>Desde</p>
                <Input
                  name="report-start-date"
                  type="date"
                  value={startDate}
                  onChange={(event: any) => setStartDate(event.target.value)}
                  error={false}
                />
              </div>
              <div>
                <p className={styles.caption}>Hasta</p>
                <Input
                  name="report-end-date"
                  type="date"
                  value={endDate}
                  onChange={(event: any) => setEndDate(event.target.value)}
                  error={false}
                />
              </div>
            </div>
          </ToolbarPopover>

          <ToolbarPopover
            label="Columnas"
            value={buildColumnsTriggerLabel(
              selectedColumnIds,
              summary?.availableColumns.length || 0,
            )}
            open={openPopover === "columns"}
            onToggle={() =>
              setOpenPopover((current) =>
                current === "columns" ? null : "columns",
              )
            }
            onClose={() => setOpenPopover(null)}
            align="right"
          >
            <div className={styles.panelHeader}>
              <h3 className={styles.panelTitle}>Columnas del reporte</h3>
              <p className={styles.panelText}>
                Activa, desactiva y arrastra para ordenar las columnas.
              </p>
            </div>
            <div className={styles.columnList}>
              {orderedColumns.map((column) => {
                const isActive = selectedColumnIds.includes(column.id);
                const isDragging = draggingColumnId === column.id;

                return (
                  <div
                    key={column.id}
                    ref={(node) => {
                      if (node) {
                        columnItemRefs.current.set(column.id, node);
                      } else {
                        columnItemRefs.current.delete(column.id);
                      }
                    }}
                    className={`${styles.columnOption} ${
                      isActive ? styles.columnOptionActive : ""
                    } ${isDragging ? styles.columnOptionDragging : ""}`}
                    onDragOver={(event) => event.preventDefault()}
                    onDragEnter={() => handleColumnDragEnter(column.id)}
                  >
                    <span
                      className={styles.columnDragHandle}
                      draggable
                      onDragStart={() => handleColumnDragStart(column.id)}
                      onDragEnd={handleColumnDragEnd}
                    >
                      <GripVertical size={16} strokeWidth={1.8} />
                    </span>

                    <button
                      type="button"
                      className={styles.columnOptionButton}
                      onClick={() => handleToggleColumn(column.id)}
                    >
                      <span className={styles.columnOptionIcon}>
                        {isActive ? (
                          <IconCheckSquare size={18} />
                        ) : (
                          <IconCheckOff size={18} />
                        )}
                      </span>
                      <span className={styles.columnOptionLabel}>
                        {column.label}
                      </span>
                    </button>
                  </div>
                );
              })}
            </div>
          </ToolbarPopover>
        </div>
      </div>

      <div className={styles.topRightActions}>
        <div className={styles.actionRow}>
          <ReportCircleButton title="Recargar reporte" onClick={handleRefresh}>
            <RefreshCw size={18} strokeWidth={1.8} />
          </ReportCircleButton>
          <ToolbarPopover
            open={openPopover === "download"}
            onToggle={() =>
              setOpenPopover((current) =>
                current === "download" ? null : "download",
              )
            }
            onClose={() => setOpenPopover(null)}
            align="right"
            panelClassName={styles.compactToolbarPanel}
            trigger={
              <ReportCircleButton
                title="Descargar reporte"
                onClick={() =>
                  setOpenPopover((current) =>
                    current === "download" ? null : "download",
                  )
                }
                disabled={isDownloadDisabled}
              >
                {actionLoading ? (
                  <LoaderCircle
                    size={18}
                    strokeWidth={1.8}
                    className={styles.spin}
                  />
                ) : (
                  <Download size={18} strokeWidth={1.8} />
                )}
              </ReportCircleButton>
            }
          >
            <div className={styles.downloadMenu}>
              <button
                type="button"
                className={`${styles.downloadMenuOption} ${
                  effectivePdf.available === false
                    ? styles.downloadMenuOptionDisabled
                    : ""
                }`}
                title={
                  effectivePdf.available === false
                    ? effectivePdf.reason
                    : "Descargar PDF"
                }
                onClick={() => handleDownload("pdf")}
              >
                PDF
              </button>
              <button
                type="button"
                className={styles.downloadMenuOption}
                onClick={() => handleDownload("excel")}
              >
                Excel
              </button>
            </div>
          </ToolbarPopover>
        </div>
      </div>

      <main ref={previewViewportRef} className={styles.previewViewport}>
        {summaryError ? (
          <div className={styles.emptyPreview}>
            <h1 className={styles.emptyTitle}>
              No se pudo preparar el reporte
            </h1>
            <p className={styles.emptyDescription}>{summaryError}</p>
          </div>
        ) : !summary || !pageSpec ? (
          <div className={styles.emptyPreview}>
            <h1 className={styles.emptyTitle}>Preparando reporte</h1>
            <p className={styles.emptyDescription}>
              Estamos consultando al backend para traer columnas, conteo y
              páginas.
            </p>
          </div>
        ) : summary.totalRows === 0 ? (
          <div className={styles.emptyPreview}>
            <h1 className={styles.emptyTitle}>Sin resultados</h1>
            <p className={styles.emptyDescription}>
              No hay filas para este rango y filtros.
            </p>
          </div>
        ) : (
          <div className={styles.previewScroller}>
            {(loadingPages && renderedPages.length === 0
              ? Array.from({
                  length: INITIAL_SKELETON_PAGES,
                }).map((_, pageIndex) => ({
                  pageNumber: pageIndex + 1,
                  rows: Array.from({ length: pageSpec.rowsPerPage }).map(
                    (_row, rowIndex) => ({
                      id: `skeleton-${pageIndex}-${rowIndex}`,
                      values: Object.fromEntries(
                        activeColumns.map((column) => [column.id, ""]),
                      ),
                    }),
                  ),
                  __skeleton: true,
                }))
              : renderedPages
            ).map((page: any) => (
              <article
                key={`page-${page.pageNumber}`}
                className={styles.paperShell}
                style={pageStyle}
              >
                <section className={styles.paperPage}>
                  <header className={styles.paperHeader}>
                    <div className={styles.paperHeading}>
                      <h1 className={styles.paperTitle}>{summary.title}</h1>
                      <p className={styles.paperSubtitle}>{summary.subtitle}</p>
                    </div>

                    <div className={styles.paperBrand}>
                      {summary.client.logoUrl ? (
                        <img
                          src={summary.client.logoUrl}
                          alt={summary.client.name}
                          className={styles.paperBrandImage}
                        />
                      ) : (
                        <span className={styles.paperBrandFallback}>
                          {summary.client.name}
                        </span>
                      )}
                    </div>
                  </header>

                  <div className={styles.paperMeta}>
                    <span className={styles.paperReference}>
                      REPORTE #{summary.reference}
                    </span>
                    <span>
                      Pagina {page.pageNumber} de {effectiveTotalPages}
                    </span>
                  </div>

                  <div className={styles.paperDivider} />

                  <section className={styles.tableBlock}>
                    <div
                      className={styles.reportTable}
                      style={reportTableStyle}
                    >
                      <div className={styles.headerRow}>
                        {activeColumns.map((column, columnIndex) => (
                          <div
                            key={`header-${column.id}`}
                            className={`${styles.headerCell} ${
                              columnIndex > 0 ? styles.cellDivider : ""
                            } ${
                              column.align === "right"
                                ? styles.alignRight
                                : column.align === "center"
                                  ? styles.alignCenter
                                  : ""
                            }`}
                          >
                            <span className={styles.headerCellContent}>
                              <span className={styles.headerCellTitle}>
                                {column.label}
                              </span>
                            </span>
                          </div>
                        ))}
                      </div>

                      {page.rows.map((row: PreviewPageRow, rowIndex: number) =>
                        activeColumns.map((column, columnIndex) => (
                          <div
                            key={`${page.pageNumber}-${row.id}-${column.id}`}
                            className={`${styles.bodyCell} ${
                              rowIndex % 2 === 0
                                ? styles.rowEven
                                : styles.rowOdd
                            } ${columnIndex > 0 ? styles.cellDivider : ""} ${
                              column.align === "right"
                                ? styles.alignRight
                                : column.align === "center"
                                  ? styles.alignCenter
                                  : ""
                            } ${page.__skeleton ? styles.skeletonCell : ""}`}
                          >
                            {page.__skeleton ? (
                              <span
                                className={styles.skeletonLine}
                                style={{
                                  width: `${68 - ((rowIndex + columnIndex) % 5) * 7}%`,
                                }}
                              />
                            ) : (
                              <span className={styles.cellValue}>
                                {row.values[column.id] || "-/-"}
                              </span>
                            )}
                          </div>
                        )),
                      )}
                    </div>
                  </section>
                </section>
              </article>
            ))}

            {loadingMorePages && renderedPages.length > 0 ? (
              <article className={styles.paperShell} style={pageStyle}>
                <section className={styles.paperPage}>
                  <header className={styles.paperHeader}>
                    <div className={styles.paperHeading}>
                      <h1 className={styles.paperTitle}>{summary.title}</h1>
                      <p className={styles.paperSubtitle}>{summary.subtitle}</p>
                    </div>

                    <div className={styles.paperBrand}>
                      {summary.client.logoUrl ? (
                        <img
                          src={summary.client.logoUrl}
                          alt={summary.client.name}
                          className={styles.paperBrandImage}
                        />
                      ) : (
                        <span className={styles.paperBrandFallback}>
                          {summary.client.name}
                        </span>
                      )}
                    </div>
                  </header>

                  <div className={styles.paperMeta}>
                    <span className={styles.paperReference}>
                      REPORTE #{summary.reference}
                    </span>
                    <span>Cargando siguientes hojas</span>
                  </div>

                  <div className={styles.paperDivider} />

                  <section className={styles.tableBlock}>
                    <div
                      className={styles.reportTable}
                      style={reportTableStyle}
                    >
                      <div className={styles.headerRow}>
                        {activeColumns.map((column, columnIndex) => (
                          <div
                            key={`loading-header-${column.id}`}
                            className={`${styles.headerCell} ${
                              columnIndex > 0 ? styles.cellDivider : ""
                            } ${
                              column.align === "right"
                                ? styles.alignRight
                                : column.align === "center"
                                  ? styles.alignCenter
                                  : ""
                            }`}
                          >
                            <span className={styles.headerCellContent}>
                              <span className={styles.headerCellTitle}>
                                {column.label}
                              </span>
                            </span>
                          </div>
                        ))}
                      </div>

                      {Array.from({ length: APPEND_SKELETON_ROWS }).map(
                        (_, rowIndex) =>
                          activeColumns.map((column, columnIndex) => (
                            <div
                              key={`loading-row-${rowIndex}-${column.id}`}
                              className={`${styles.bodyCell} ${
                                rowIndex % 2 === 0
                                  ? styles.rowEven
                                  : styles.rowOdd
                              } ${styles.skeletonCell} ${
                                columnIndex > 0 ? styles.cellDivider : ""
                              } ${
                                column.align === "right"
                                  ? styles.alignRight
                                  : column.align === "center"
                                    ? styles.alignCenter
                                    : ""
                              }`}
                            >
                              <span
                                className={styles.skeletonLine}
                                style={{
                                  width: `${70 - ((rowIndex + columnIndex) % 4) * 8}%`,
                                }}
                              />
                            </div>
                          )),
                      )}
                    </div>
                  </section>
                </section>
              </article>
            ) : null}

            {pagesError ? (
              <div className={styles.noRows}>{pagesError}</div>
            ) : null}

            {nextPage ? <div ref={sentinelRef} aria-hidden="true" /> : null}
          </div>
        )}
      </main>
    </section>
  );
};

export default ReportsPage;
