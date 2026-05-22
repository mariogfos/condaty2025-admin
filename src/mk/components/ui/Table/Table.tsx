"use client";
import {
  useCallback,
  CSSProperties,
  Fragment,
  MouseEvent as ReactMouseEvent,
  memo,
  ReactNode,
  useEffect,
  isValidElement,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { ArrowDown, ArrowUp, ArrowUpDown } from "lucide-react";
import styles from "./styles.module.css";
import { shouldIgnoreValueTranslationContext } from "@/i18n/translationGuards";
import { formatNumber } from "@/mk/utils/numbers";
import useScrollbarWidth from "@/mk/hooks/useScrollbarWidth";
import { useAuth } from "@/mk/contexts/AuthProvider";
import ContextMenu, {
  ContextMenuActionParams,
  ContextMenuItem,
} from "../ContextMenu/ContextMenu";

export type RenderColType = {
  value: any;
  key?: number;
  row?: Record<string, any>;
  i?: number;
  extraData?: any;
};

export type TableContextMenuItem<RowType = Record<string, any>> =
  ContextMenuItem<RowType>;
export type TableContextMenuActionParams<RowType = Record<string, any>> =
  ContextMenuActionParams<RowType>;
export type TableRowContextMenuConfig<RowType = Record<string, any>> = {
  items:
    | TableContextMenuItem<RowType>[]
    | ((row: RowType, rowIndex: number) => TableContextMenuItem<RowType>[]);
  disabled?: boolean | ((row: RowType, rowIndex: number) => boolean);
  onOpen?: (params: {
    row: RowType;
    rowIndex: number;
    event: ReactMouseEvent<HTMLDivElement>;
  }) => void;
};

type PropsType = {
  header?: {
    key: string;
    responsive: string;
    label: string;
    width?: string;
    className?: string;
    onRender?: Function;
    style?: any;
    sumarize?: number | boolean;
    sumDec?: number;
    sortabled?: boolean;
    onHide?: () => boolean;
  }[];
  id?: string;
  data: any;
  footer?: any;
  sumarize?: boolean;
  onRenderBody?: null | ((row: any, i: number, onClick: Function) => any);
  onRenderHead?: null | ((item: any, row: any) => any);
  onRenderFoot?: null | ((item: any, row: any) => any);
  onRowClick?: null | ((e: any, scrollTo?: number) => void);
  onTabletRow?: (
    item: Record<string, any>,
    i: number,
    onClick: Function,
  ) => any;
  onButtonActions?: Function;
  actionsWidth?: string;
  style?: CSSProperties;
  className?: string;
  height?: string;
  showHeader?: boolean;
  extraData?: any;
  sortCol?: { col: string; asc: boolean };
  onSort?: (col: string, asc: boolean) => void;
  onRenderCard?: (
    item: Record<string, any>,
    i: number,
    onClick: Function,
  ) => any;
  useInfiniteScroll?: boolean;
  hasMore?: boolean;
  isLoadingMore?: boolean;
  onLoadMore?: () => void;
  infiniteBatchSize?: number;
  prefetchRows?: number;
  showSkeletonRows?: boolean;
  skeletonRowCount?: number;
  rowContextMenu?: TableRowContextMenuConfig;
};

type ResizeState = {
  index: number;
  minWidth: number;
  startWidth: number;
  startX: number;
};

const APPEND_PLACEHOLDER_ROWS = 3;
const END_OF_RESULTS_TEXT = "No hay más resultados";

const getCssSize = (value?: string) => {
  if (!value) return undefined;
  return /^\d+$/.test(value) ? `${value}px` : value;
};

const getNodeText = (node: ReactNode): string => {
  if (typeof node === "string" || typeof node === "number") return String(node);
  if (Array.isArray(node)) return node.map((child) => getNodeText(child)).join(" ");
  if (isValidElement(node))
    return getNodeText((node.props as { children?: ReactNode }).children);
  return "";
};

const getTextLabel = (label: any) =>
  getNodeText(label)
    .replace(/\s+/g, " ")
    .trim();

const parseWidthValue = (width: any) => {
  if (width === undefined || width === null || width === "" || width === "auto")
    return undefined;
  if (width === "100%") return 0;

  const normalized = String(width).replace("px", "").trim();
  const parsed = Number(normalized);
  return Number.isFinite(parsed) ? parsed : undefined;
};

const parseMeasuredWidth = (width?: string) => {
  if (!width) return undefined;
  const parsed = Number(width.replace("px", "").trim());
  return Number.isFinite(parsed) ? parsed : undefined;
};

const isFillColumn = (item: NonNullable<PropsType["header"]>[number]) =>
  item.width === "100%";

const isCompactColumn = (item: NonNullable<PropsType["header"]>[number]) => {
  const haystack = `${String(item.key || "").toLowerCase()} ${getTextLabel(
    item.label,
  ).toLowerCase()}`;

  return /(status|estado)/.test(haystack) || isAmountColumn(item);
};

const isAmountColumn = (item: NonNullable<PropsType["header"]>[number]) => {
  const haystack = `${String(item.key || "").toLowerCase()} ${getTextLabel(
    item.label,
  ).toLowerCase()}`;

  return /(amount|monto|importe|saldo|total)/.test(haystack);
};

const getPreferredFillRank = (
  item: NonNullable<PropsType["header"]>[number],
) => {
  const haystack = `${String(item.key || "").toLowerCase()} ${getTextLabel(
    item.label,
  ).toLowerCase()}`.replace(/\s+/g, "");

  if (
    /description|descripcion|concept|concepto|detail|detalle|observation|observacion|comment|comentario/.test(
      haystack,
    )
  ) {
    return 3;
  }

  if (/category|categoria|subcategory|subcategoria/.test(haystack)) {
    return 2;
  }

  if (/title|titulo|name|nombre/.test(haystack)) {
    return 1;
  }

  return 0;
};

const getHeaderFitWidth = (item: NonNullable<PropsType["header"]>[number]) => {
  const labelText = getTextLabel(item.label);
  if (!labelText) return 0;

  const perCharWidth = isAmountColumn(item) ? 8.4 : 7.8;
  const iconAllowance = item.sortabled ? 24 : 0;
  const sidePadding = 32;

  return Math.ceil(labelText.length * perCharWidth + iconAllowance + sidePadding);
};

const isNarrowFixedColumn = (item: NonNullable<PropsType["header"]>[number]) => {
  const explicitWidth = parseWidthValue(item.width);
  return Boolean(explicitWidth && explicitWidth > 0 && explicitWidth <= 120);
};

const getColumnSizing = (
  item: NonNullable<PropsType["header"]>[number],
  measuredWidth?: string,
  preferFill = false,
) => {
  const explicitWidth = parseWidthValue(item.width);
  const measured = parseMeasuredWidth(measuredWidth);
  const compact = isCompactColumn(item) || isNarrowFixedColumn(item);
  const headerFitWidth = getHeaderFitWidth(item);

  if (compact) {
    const isAmount = isAmountColumn(item);
    const compactFloor = isAmount ? 124 : 108;
    const compactCeiling = isAmount ? 220 : 180;
    const fixedWidth = Math.max(
      compactFloor,
      headerFitWidth,
      explicitWidth ?? 0,
      Math.min(measured ?? 0, compactCeiling),
    );

    return {
      mode: "fixed" as const,
      minWidth: fixedWidth,
      basis: fixedWidth,
    };
  }

  if (isFillColumn(item) || preferFill) {
    const fillMinWidth = Math.min(Math.max(headerFitWidth, 120), 176);
    const preferredWidth =
      explicitWidth ?? measured ?? Math.max(headerFitWidth, 168);
    return {
      mode: "fill" as const,
      minWidth: fillMinWidth,
      basis: Math.min(Math.max(preferredWidth, fillMinWidth + 24), 240),
    };
  }

  const preferredWidth = explicitWidth ?? measured ?? 160;
  const flexMinWidth = Math.min(Math.max(headerFitWidth, 104), 156);

  return {
    mode: "flex" as const,
    minWidth: flexMinWidth,
    basis: Math.min(Math.max(preferredWidth, flexMinWidth + 20), 184),
  };
};

const getColumnWidthStyle = ({
  item,
  manualWidth,
  measuredWidth,
  preferFill = false,
}: {
  item: NonNullable<PropsType["header"]>[number];
  manualWidth?: number;
  measuredWidth?: string;
  preferFill?: boolean;
}) => {
  const sizing = getColumnSizing(item, measuredWidth, preferFill);

  if (manualWidth) {
    return {
      flex: `0 0 ${manualWidth}px`,
      width: `${manualWidth}px`,
      minWidth: `${manualWidth}px`,
    };
  }

  if (sizing.mode === "fixed") {
    return {
      flex: `0 0 ${sizing.basis}px`,
      width: `${sizing.basis}px`,
      minWidth: `${sizing.minWidth}px`,
    };
  }

  if (sizing.mode === "fill") {
    return {
      flex: `1.35 1 ${sizing.basis}px`,
      flexBasis: `${sizing.basis}px`,
      minWidth: `${sizing.minWidth}px`,
    };
  }

  return {
    flex: `1 1 ${sizing.basis}px`,
    flexBasis: `${sizing.basis}px`,
    minWidth: `${sizing.minWidth}px`,
  };
};

const getActionsWidthStyle = (width: any) => {
  const parsedWidth = parseWidthValue(width);
  const resolvedWidth = parsedWidth && parsedWidth > 0 ? parsedWidth : 120;

  return {
    flex: `0 0 ${resolvedWidth}px`,
    width: `${resolvedWidth}px`,
    minWidth: `${resolvedWidth}px`,
  };
};

const getResolvedFillIndex = (header: NonNullable<PropsType["header"]>) => {
  const visibleColumns = header
    .map((item, index) => ({ item, index }))
    .filter(({ item }) => !item.onHide?.());

  const explicitFill = visibleColumns.find(({ item }) => isFillColumn(item));
  if (explicitFill) return explicitFill.index;

  const preferredFill = visibleColumns.reduce<{
    index: number;
    rank: number;
  } | null>((bestMatch, { item, index }) => {
    if (isCompactColumn(item) || isNarrowFixedColumn(item)) {
      return bestMatch;
    }

    const rank = getPreferredFillRank(item);
    if (rank <= 0) {
      return bestMatch;
    }

    if (!bestMatch || rank > bestMatch.rank) {
      return { index, rank };
    }

    return bestMatch;
  }, null);
  if (preferredFill) return preferredFill.index;

  const firstFlexible = visibleColumns.find(
    ({ item }) => !isCompactColumn(item) && !isNarrowFixedColumn(item),
  );
  return firstFlexible?.index ?? -1;
};

const Table = ({
  header = [],
  id = "0",
  data,
  footer,
  sumarize = false,
  onRenderBody = null,
  onRenderHead = null,
  onRenderFoot = null,
  onRowClick,
  onTabletRow,
  onButtonActions,
  onRenderCard,
  actionsWidth,
  style = {},
  className = "",
  height,
  showHeader = true,
  extraData = null,
  sortCol,
  onSort,
  useInfiniteScroll = false,
  hasMore = false,
  isLoadingMore = false,
  onLoadMore,
  infiniteBatchSize = 0,
  prefetchRows = 10,
  showSkeletonRows = false,
  skeletonRowCount = 20,
  rowContextMenu,
}: PropsType) => {
  const isMobile = false;
  const [scrollbarWidth, setScrollbarWidth] = useState(0);
  const [manualWidths, setManualWidths] = useState<Record<number, number>>({});
  const [measuredWidths, setMeasuredWidths] = useState<Record<number, string>>(
    {},
  );
  const [resizeState, setResizeState] = useState<ResizeState | null>(null);
  const resolvedHeight = getCssSize(height);
  const useFillHeight = resolvedHeight === "100%";
  const bodyViewportHeight = resolvedHeight && !useFillHeight ? resolvedHeight : undefined;
  const bodyScrollMode = resolvedHeight ? (useFillHeight ? "__fill__" : resolvedHeight) : undefined;
  const tableRef = useRef<HTMLDivElement>(null);
  const fillColumnIndex = useMemo(() => getResolvedFillIndex(header), [header]);

  useEffect(() => {
    if (!resizeState) return;

    const handleMouseMove = (event: MouseEvent) => {
      const nextWidth = Math.min(
        720,
        Math.max(
          resizeState.minWidth,
          resizeState.startWidth + (event.clientX - resizeState.startX),
        ),
      );

      setManualWidths((old) => ({
        ...old,
        [resizeState.index]: nextWidth,
      }));
    };

    const handleMouseUp = () => {
      setResizeState(null);
      document.body.style.removeProperty("cursor");
      document.body.style.removeProperty("user-select");
    };

    document.body.style.cursor = "col-resize";
    document.body.style.userSelect = "none";
    window.addEventListener("mousemove", handleMouseMove);
    window.addEventListener("mouseup", handleMouseUp);

    return () => {
      window.removeEventListener("mousemove", handleMouseMove);
      window.removeEventListener("mouseup", handleMouseUp);
      document.body.style.removeProperty("cursor");
      document.body.style.removeProperty("user-select");
    };
  }, [resizeState]);

  useLayoutEffect(() => {
    if (!tableRef.current || onRenderCard) return;

    const root = tableRef.current;
    let frame = 0;

    const measureColumns = () => {
      const nextWidths: Record<number, string> = {};

      header.forEach((item, index) => {
        if (item.onHide?.()) return;
        if (item.width && item.width !== "auto") return;

        const cells = Array.from(
          root.querySelectorAll(
            `[data-col-index="${index}"]:not([data-col-skeleton="true"])`,
          ),
        ) as HTMLElement[];

        let maxWidth = 0;

        cells.forEach((cell) => {
          const computed = window.getComputedStyle(cell);
          if (computed.display === "none") return;
          maxWidth = Math.max(maxWidth, Math.ceil(cell.scrollWidth));
        });

        if (maxWidth > 0) {
          nextWidths[index] = `${Math.min(360, Math.max(96, maxWidth + 1))}px`;
        }
      });

      setMeasuredWidths((prev) => {
        const prevKeys = Object.keys(prev);
        const nextKeys = Object.keys(nextWidths);
        const same =
          prevKeys.length === nextKeys.length &&
          nextKeys.every((key) => prev[Number(key)] === nextWidths[Number(key)]);

        return same ? prev : nextWidths;
      });
    };

    frame = requestAnimationFrame(measureColumns);
    const resizeObserver = new ResizeObserver(() => {
      cancelAnimationFrame(frame);
      frame = requestAnimationFrame(measureColumns);
    });

    resizeObserver.observe(root);

    return () => {
      cancelAnimationFrame(frame);
      resizeObserver.disconnect();
    };
  }, [data, header, onButtonActions, onRenderCard, resolvedHeight, showHeader]);

  const onStartResize = (
    index: number,
    item: NonNullable<PropsType["header"]>[number],
    currentWidth: number,
    startX: number,
  ) => {
    setResizeState({
      index,
      minWidth: getColumnSizing(item, measuredWidths[index]).minWidth,
      startWidth: currentWidth,
      startX,
    });
  };

  return (
    <div
      ref={tableRef}
      className={[
        styles.table,
        useFillHeight ? styles.fillHeight : "",
        styles[className],
        className,
      ]
        .filter(Boolean)
        .join(" ")}
      style={style}
    >
      <div className={styles.scrollArea}>
        <div className={styles.canvas}>
          {(!isMobile || !onTabletRow) && showHeader && !onRenderCard && (
            <Head
              header={header}
              actionsWidth={actionsWidth}
              onRenderHead={onRenderHead}
              onButtonActions={onButtonActions}
              scrollbarWidth={scrollbarWidth}
              extraData={extraData}
              sortCol={sortCol}
              onSort={onSort}
              manualWidths={manualWidths}
              measuredWidths={measuredWidths}
              onStartResize={onStartResize}
              resizingIndex={resizeState?.index}
              fillColumnIndex={fillColumnIndex}
            />
          )}
          <div
            className={
              styles.bodyViewport +
              (resolvedHeight ? " " + styles.withHeight : "")
            }
            style={bodyViewportHeight ? { height: bodyViewportHeight } : undefined}
          >
            <Body
              onTabletRow={onTabletRow}
              onRenderCard={onRenderCard}
              onRowClick={onRowClick}
              data={data}
              header={header}
              actionsWidth={actionsWidth}
              renderBody={onRenderBody}
              onButtonActions={onButtonActions}
              height={bodyScrollMode}
              setScrollbarWidth={setScrollbarWidth}
              onRenderBody={onRenderBody}
              extraData={extraData}
              id={id}
              manualWidths={manualWidths}
              measuredWidths={measuredWidths}
              fillColumnIndex={fillColumnIndex}
              useInfiniteScroll={useInfiniteScroll}
              hasMore={hasMore}
              isLoadingMore={isLoadingMore}
              onLoadMore={onLoadMore}
              infiniteBatchSize={infiniteBatchSize}
              prefetchRows={prefetchRows}
              showSkeletonRows={showSkeletonRows}
              skeletonRowCount={skeletonRowCount}
              rowContextMenu={rowContextMenu}
            />
          </div>
          {sumarize && (
            <Sumarize
              header={header}
              data={data}
              actionsWidth={actionsWidth}
              onRenderFoot={onRenderFoot}
              onButtonActions={onButtonActions}
              scrollbarWidth={scrollbarWidth}
              extraData={extraData}
              manualWidths={manualWidths}
              measuredWidths={measuredWidths}
              fillColumnIndex={fillColumnIndex}
            />
          )}
        </div>
      </div>
      {footer && <footer>{footer}</footer>}
    </div>
  );
};

const Head = memo(function Head({
  header,
  actionsWidth,
  onRenderHead,
  onButtonActions,
  scrollbarWidth,
  extraData,
  onSort,
  sortCol,
  manualWidths,
  measuredWidths,
  onStartResize,
  resizingIndex,
  fillColumnIndex,
}: {
  header: any;
  actionsWidth: any;
  onRenderHead?: any;
  onButtonActions: any;
  scrollbarWidth?: number;
  extraData?: any;
  onSort?: (col: string, asc: boolean) => void;
  sortCol?: { col: string; asc: boolean };
  manualWidths: Record<number, number>;
  measuredWidths?: Record<number, string>;
  onStartResize: (
    index: number,
    item: NonNullable<PropsType["header"]>[number],
    currentWidth: number,
    startX: number,
  ) => void;
  resizingIndex?: number;
  fillColumnIndex: number;
}) {
  if (onRenderHead === false) return null;
  const renderLabelTitle = (
    item: any,
    index: number,
    onSort: any,
    sortCol: any,
  ) => {
    if (!item.sortabled || !onSort) return item.label;

    const isActive = sortCol?.col === item.key;
    const SortIcon = isActive ? (sortCol.asc ? ArrowUp : ArrowDown) : ArrowUpDown;
    const nextAsc = isActive ? !sortCol.asc : true;

    return (
      <button
        type="button"
        className={styles.sortButton}
        aria-pressed={isActive}
        onClick={() => {
          if (item.sortabled) {
            onSort?.(item.key, nextAsc);
          }
        }}
      >
        <span className={styles.sortButtonLabel}>{item.label}</span>
        <SortIcon
          size={13}
          strokeWidth={1.45}
          className={[
            styles.sortIcon,
            isActive ? styles.sortIconActive : "",
          ]
            .filter(Boolean)
            .join(" ")}
        />
      </button>
    );
  };
  return (
    <header style={{ paddingRight: (scrollbarWidth || 0) + "px" }}>
      {header.map(
        (item: any, index: number) =>
          !item.onHide?.() && (
            <div
              key={"th" + index}
              data-col-index={index}
              className={[
                styles[item.responsive],
                item.className,
                resizingIndex === index ? styles.isResizing : "",
              ]
                .filter(Boolean)
                .join(" ")}
              style={{
                ...item.style,
                overflow: "hidden",
                ...getColumnWidthStyle({
                  item,
                  manualWidth: manualWidths[index],
                  measuredWidth: measuredWidths?.[index],
                  preferFill: index === fillColumnIndex,
                }),
              }}
              title={
                onRenderHead
                  ? onRenderHead(item, index, onSort, sortCol, true)
                  : typeof item.label === "string"
                    ? item.label
                    : undefined
              }
            >
              {onRenderHead
                ? onRenderHead(item, index, onSort, sortCol)
                : renderLabelTitle(item, index, onSort, sortCol)}
              <span
                className={styles.resizeHandle}
                onMouseDown={(event: ReactMouseEvent<HTMLSpanElement>) => {
                  event.preventDefault();
                  event.stopPropagation();
                  onStartResize(
                    index,
                    item,
                    (
                      event.currentTarget.parentElement as HTMLElement
                    ).getBoundingClientRect().width,
                    event.clientX,
                  );
                }}
              />
            </div>
          ),
      )}

      {onButtonActions && (
        <div
          className={styles.onlyDesktop}
          style={{ ...getActionsWidthStyle(actionsWidth) }}
        >
          Acciones
        </div>
      )}
    </header>
  );
});

const Sumarize = memo(function Sumarize({
  header,
  data,
  actionsWidth = "100%",
  onRenderFoot = null,
  onButtonActions = false,
  scrollbarWidth,
  extraData,
  manualWidths,
  measuredWidths,
  fillColumnIndex,
}: {
  header: any;
  data: any;
  actionsWidth?: any;
  onRenderFoot?: Function | null;
  onButtonActions?: any;
  scrollbarWidth?: number;
  extraData?: any;
  manualWidths: Record<number, number>;
  measuredWidths?: Record<number, string>;
  fillColumnIndex: number;
}) {
  const sumas = useMemo(() => {
    if (!data || !header) return {};

    const totals: Record<string, number> = {};
    data.forEach((row: any) => {
      header.forEach((item: any) => {
        if (!item.sumarize) return;
        totals[item.key] = (totals[item.key] || 0) + Number(row[item.key] || 0);
      });
    });

    return totals;
  }, [data, header]);

  return (
    <summary
      style={
        scrollbarWidth
          ? { paddingRight: `${scrollbarWidth}px` }
          : undefined
      }
    >
      {header.map((item: any, index: number) => (
        <div
          key={"foot" + index}
          data-col-index={index}
          className={[
            styles[item.responsive],
            item.className,
            isAmountColumn(item) ? styles.amountCell : "",
          ]
            .filter(Boolean)
            .join(" ")}
          style={{
            ...item.style,
            ...getColumnWidthStyle({
              item,
              manualWidth: manualWidths[index],
              measuredWidth: measuredWidths?.[index],
              preferFill: index === fillColumnIndex,
            }),
          }}
        >
          {item.onRenderFoot ? (
            <span>{item.onRenderFoot(item, index, sumas)}</span>
          ) : item.sumarize ? (
            <div>{formatNumber(sumas[item.key], item.sumDec || 0)}</div>
          ) : (
            ""
          )}
        </div>
      ))}

      {onButtonActions && (
        <div
          className={styles.onlyDesktop}
          style={{ ...getActionsWidthStyle(actionsWidth) }}
        >
          {" "}
        </div>
      )}
    </summary>
  );
});

const Body = ({
  onTabletRow,
  onRowClick,
  data,
  header,
  actionsWidth,
  renderBody,
  onButtonActions,
  height,
  setScrollbarWidth,
  onRenderBody,
  extraData,
  onRenderCard,
  id,
  manualWidths,
  measuredWidths,
  fillColumnIndex,
  useInfiniteScroll,
  hasMore,
  isLoadingMore,
  onLoadMore,
  infiniteBatchSize,
  prefetchRows,
  showSkeletonRows,
  skeletonRowCount,
  rowContextMenu,
}: {
  onTabletRow: any;
  onRowClick: any;
  data: any;
  header: any;
  actionsWidth: any;
  renderBody: any;
  onButtonActions: any;
  height?: any;
  setScrollbarWidth?: Function;
  onRenderBody?: null | ((row: any, i: number, onClick: Function) => any);
  extraData?: any;
  onRenderCard?: any;
  id?: string;
  manualWidths: Record<number, number>;
  measuredWidths?: Record<number, string>;
  fillColumnIndex: number;
  useInfiniteScroll?: boolean;
  hasMore?: boolean;
  isLoadingMore?: boolean;
  onLoadMore?: (() => void) | undefined;
  infiniteBatchSize?: number;
  prefetchRows?: number;
  showSkeletonRows?: boolean;
  skeletonRowCount?: number;
  rowContextMenu?: TableRowContextMenuConfig;
}) => {
  const { store, setStore } = useAuth();
  const isMobile = false;
  const divRef: any = useRef(null);
  const sentinelRef = useRef<HTMLDivElement | null>(null);
  const canTriggerNextLoadRef = useRef(true);
  const [contextMenuState, setContextMenuState] = useState<{
    row: Record<string, any>;
    rowIndex: number;
    items: TableContextMenuItem[];
    position: { x: number; y: number };
  } | null>(null);
  const scrollWidth = useScrollbarWidth(divRef);

  const closeContextMenu = useCallback(() => {
    setContextMenuState(null);
  }, []);

  const resolveRowContextMenuItems = useCallback(
    (row: Record<string, any>, rowIndex: number) => {
      if (!rowContextMenu) return [];

      return typeof rowContextMenu.items === "function"
        ? rowContextMenu.items(row, rowIndex)
        : rowContextMenu.items || [];
    },
    [rowContextMenu],
  );

  const isRowContextMenuDisabled = useCallback(
    (row: Record<string, any>, rowIndex: number) => {
      if (!rowContextMenu?.disabled) return false;

      return typeof rowContextMenu.disabled === "function"
        ? rowContextMenu.disabled(row, rowIndex)
        : Boolean(rowContextMenu.disabled);
    },
    [rowContextMenu],
  );

  const handleRowContextMenu = useCallback(
    (
      event: ReactMouseEvent<HTMLDivElement>,
      row: Record<string, any>,
      rowIndex: number,
    ) => {
      if (!rowContextMenu || isRowContextMenuDisabled(row, rowIndex)) {
        return;
      }

      const items = resolveRowContextMenuItems(row, rowIndex);

      if (!items.some((item) => !item.hidden)) {
        return;
      }

      event.preventDefault();
      event.stopPropagation();

      rowContextMenu.onOpen?.({
        row,
        rowIndex,
        event,
      });

      setContextMenuState({
        row,
        rowIndex,
        items,
        position: {
          x: event.clientX,
          y: event.clientY,
        },
      });
    },
    [isRowContextMenuDisabled, resolveRowContextMenuItems, rowContextMenu],
  );

  useEffect(() => {
    if (setScrollbarWidth) setScrollbarWidth(scrollWidth);
  }, [scrollWidth]);
  useLayoutEffect(() => {
    if (store && id) {
      const scrollTop = store["scrollTop" + id];

      if (scrollTop && divRef.current) divRef.current.scrollTop = scrollTop;
    }
  }, []);

  const _onRowClick = (e: any) => {
    closeContextMenu();
    if (onRowClick) {
      // const scrollTop = divRef?.current?.scrollTop;
      // if (scrollTop !== undefined && store && id) {
      //   setStore({ ["scrollTop" + id]: scrollTop });
      // }
      onRowClick(e);
    }
  };

  const resolveScrollContainer = useCallback(() => {
    if (height) return divRef.current as HTMLElement;

    let parent = divRef.current?.parentElement as HTMLElement | null;
    while (parent && parent !== document.body) {
      const computed = window.getComputedStyle(parent);
      if (/(auto|scroll)/.test(computed.overflowY || "")) {
        return parent;
      }
      parent = parent.parentElement;
    }

    return window;
  }, [height]);

  const getRemainingDistance = useCallback(
    (scrollContainer: Window | HTMLElement) => {
      if (scrollContainer === window) {
        const doc = document.documentElement;
        return Math.max(
          0,
          doc.scrollHeight - (window.scrollY + window.innerHeight),
        );
      }

      const element = scrollContainer as HTMLElement;
      return Math.max(
        0,
        element.scrollHeight - (element.scrollTop + element.clientHeight),
      );
    },
    [],
  );

  useEffect(() => {
    if (!useInfiniteScroll || !hasMore || !onLoadMore || !divRef.current) return;

    const rowHeightEstimate = 52;
    const preloadCount = APPEND_PLACEHOLDER_ROWS;
    const loadThreshold = Math.max(156, preloadCount * rowHeightEstimate);
    const resetThreshold = Math.round(loadThreshold * 1.35);

    const scrollContainer = resolveScrollContainer();

    let frame = 0;

    const evaluateLoadWindow = () => {
      const remainingDistance = getRemainingDistance(scrollContainer);

      if (remainingDistance > resetThreshold) {
        canTriggerNextLoadRef.current = true;
      }

      if (
        remainingDistance <= loadThreshold &&
        !isLoadingMore &&
        canTriggerNextLoadRef.current
      ) {
        canTriggerNextLoadRef.current = false;
        onLoadMore();
      }
    };

    const scheduleEvaluation = () => {
      cancelAnimationFrame(frame);
      frame = requestAnimationFrame(evaluateLoadWindow);
    };

    const scrollTarget =
      scrollContainer === window ? window : (scrollContainer as HTMLElement);

    scheduleEvaluation();
    scrollTarget.addEventListener("scroll", scheduleEvaluation, {
      passive: true,
    });
    window.addEventListener("resize", scheduleEvaluation);

    return () => {
      cancelAnimationFrame(frame);
      scrollTarget.removeEventListener("scroll", scheduleEvaluation);
      window.removeEventListener("resize", scheduleEvaluation);
    };
  }, [
    data?.length,
    hasMore,
    height,
    infiniteBatchSize,
    isLoadingMore,
    onLoadMore,
    prefetchRows,
    getRemainingDistance,
    resolveScrollContainer,
    useInfiniteScroll,
  ]);

  const renderSkeletonRows = (rowsCount: number) => {
    const totalRows = Math.max(1, rowsCount || 1);

    if (onRenderBody || onRenderCard) {
      return Array.from({ length: totalRows }, (_, index) => (
        <div
          key={`row-skeleton-${index}`}
          className={`${styles.loadingRow} ${styles.customLoadingRow}`}
        >
          <div className={styles.customLoadingRowContent} />
        </div>
      ));
    }

    return Array.from({ length: totalRows }, (_, rowIndex) => (
      <div
        key={`row-skeleton-${rowIndex}`}
        className={`${styles.loadingRow} ${styles.isSkeletonRow}`}
      >
        {header.map((item: any, i: number) => {
          if (item.onHide?.()) {
            return null;
          }

          return (
            <span
              key={`skeleton-${item.key}-${rowIndex}-${i}`}
              data-col-index={i}
              data-col-skeleton="true"
              className={[
                styles[item.responsive],
                item.className,
                isAmountColumn(item) ? styles.amountCell : "",
              ]
                .filter(Boolean)
                .join(" ")}
              style={{
                ...item.style,
                ...getColumnWidthStyle({
                  item,
                  manualWidth: manualWidths[i],
                  measuredWidth: measuredWidths?.[i],
                  preferFill: i === fillColumnIndex,
                }),
              }}
            >
              <span className={styles.cellSkeleton} />
            </span>
          );
        })}
        {onButtonActions && (
          <span
            className={styles.onlyDesktop}
            data-col-skeleton="true"
            style={{ ...getActionsWidthStyle(actionsWidth) }}
          >
            <span className={styles.actionSkeleton} />
          </span>
        )}
      </div>
    ));
  };

  const renderReplaceSkeletonRows = () => {
    if (!showSkeletonRows) return null;

    return renderSkeletonRows(
      Math.max(1, Number(skeletonRowCount || 0) || 1),
    );
  };

  const renderAppendPlaceholderRows = () => {
    if (!useInfiniteScroll || !hasMore || showSkeletonRows) return null;

    return renderSkeletonRows(APPEND_PLACEHOLDER_ROWS);
  };

  const renderEndOfResults = () => {
    if (
      !useInfiniteScroll ||
      hasMore ||
      showSkeletonRows ||
      !Array.isArray(data) ||
      data.length === 0
    ) {
      return null;
    }

    return (
      <div className={styles.endOfResultsRow}>
        <div className={styles.endOfResultsContent}>{END_OF_RESULTS_TEXT}</div>
      </div>
    );
  };

  return (
    <main
      ref={divRef}
      style={
        height
          ? {
              flex: 1,
              minHeight: 0,
              overflowY: "auto",
              overscrollBehavior: "contain",
            }
          : {
              display: onRenderCard ? "grid" : "flex",
              flexDirection: onRenderCard ? "row" : "column",
              gridTemplateColumns: onRenderCard ? "1fr 1fr 1fr 1fr 1fr" : "",
              gap: onRenderCard ? "16px" : "0px",
            }
      }
    >
      {!showSkeletonRows &&
        data?.map((row: Record<string, any>, index: number) => (
          <Fragment key={"r_" + index}>
            {isMobile && onTabletRow ? (
              onTabletRow(row, index, onRowClick)
            ) : onRenderBody ? (
              <div
                key={"row" + index}
                className={
                  contextMenuState?.rowIndex === index
                    ? styles.contextMenuActiveRow
                    : ""
                }
                onContextMenu={(event) =>
                  handleRowContextMenu(event, row, index)
                }
              >
                {onRenderBody(row, index + 1, onRowClick)}
              </div>
            ) : onRenderCard ? (
              onRenderCard(row, index, onRowClick)
            ) : (
              <div
                key={"row" + index}
                className={
                  contextMenuState?.rowIndex === index
                    ? styles.contextMenuActiveRow
                    : ""
                }
                onClick={() => _onRowClick(row)}
                onContextMenu={(event) =>
                  handleRowContextMenu(event, row, index)
                }
              >
                {header.map((item: any, i: number) => {
                  if (item.onHide?.()) {
                    return null;
                  }

                  const ignoreTranslation = shouldIgnoreValueTranslationContext({
                    label: item.label,
                    key: item.key,
                  });

                  return (
                    <span
                      key={item.key + i}
                      data-col-index={i}
                      className={[
                        styles[item.responsive],
                        item.className,
                        isAmountColumn(item) ? styles.amountCell : "",
                      ]
                        .filter(Boolean)
                        .join(" ")}
                      style={{
                        ...item.style,
                        ...getColumnWidthStyle({
                          item,
                          manualWidth: manualWidths[i],
                          measuredWidth: measuredWidths?.[i],
                          preferFill: i === fillColumnIndex,
                        }),
                      }}
                      data-i18n-ignore={ignoreTranslation ? "true" : undefined}
                    >
                      {item.onRender &&
                        item.onRender?.({
                          value: row[item.key],
                          key: item.key,
                          item: row,
                          i: index + 1,
                          extraData,
                        })}
                      {!item.onRender && row[item.key]}
                    </span>
                  );
                })}
                {onButtonActions && (
                  <span
                    className={styles.onlyDesktop}
                    style={{ ...getActionsWidthStyle(actionsWidth) }}
                  >
                    {onButtonActions(row)}
                  </span>
                )}
              </div>
            )}
          </Fragment>
      ))}
      {renderReplaceSkeletonRows()}
      {renderAppendPlaceholderRows()}
      {renderEndOfResults()}
      {useInfiniteScroll && hasMore ? (
        <div ref={sentinelRef} className={styles.loadMoreSentinel} />
      ) : null}
      {contextMenuState ? (
        <ContextMenu
          open={Boolean(contextMenuState)}
          items={contextMenuState.items}
          position={contextMenuState.position}
          row={contextMenuState.row}
          rowIndex={contextMenuState.rowIndex}
          onClose={closeContextMenu}
        />
      ) : null}
    </main>
  );
};

export default Table;
