"use client";

import {
  CSSProperties,
  ComponentType,
  ReactNode,
  isValidElement,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { ChevronRight } from "lucide-react";
import { createPortal } from "react-dom";
import styles from "./contextMenu.module.css";

export type ContextMenuIconProps = {
  className?: string;
  size?: number | string;
  strokeWidth?: number;
  color?: string;
  style?: CSSProperties;
};

export type ContextMenuIconComponent = ComponentType<ContextMenuIconProps>;

export type ContextMenuItem<RowType = Record<string, any>> = {
  id?: string | number;
  label?: ReactNode;
  icon?: ContextMenuIconComponent | ReactNode;
  items?: ContextMenuItem<RowType>[];
  onClick?: (params: ContextMenuActionParams<RowType>) => void;
  disabled?: boolean;
  hidden?: boolean;
  danger?: boolean;
  separator?: boolean;
  shortcut?: ReactNode;
  keepOpen?: boolean;
  title?: string;
  className?: string;
};

export type ContextMenuActionParams<RowType = Record<string, any>> = {
  row: RowType;
  rowIndex: number;
  item: ContextMenuItem<RowType>;
  closeMenu: () => void;
};

export type ContextMenuPosition = {
  x: number;
  y: number;
};

type ContextMenuProps<RowType> = {
  open: boolean;
  items?: ContextMenuItem<RowType>[];
  position: ContextMenuPosition;
  row: RowType;
  rowIndex: number;
  onClose: () => void;
  portalId?: string;
};

const MENU_WIDTH = 248;
const EDGE_OFFSET = 12;
const PANEL_PADDING = 0;
const PANEL_GAP = 8;
const ROW_HEIGHT = 34;
const SEPARATOR_HEIGHT = 1;

const getVisibleItems = <RowType,>(items: ContextMenuItem<RowType>[] = []) =>
  items.filter((item) => !item.hidden);

const estimatePanelHeight = <RowType,>(items: ContextMenuItem<RowType>[] = []) =>
  items.reduce(
    (total, item) =>
      total + (item.separator ? SEPARATOR_HEIGHT : ROW_HEIGHT),
    PANEL_PADDING * 2,
  );

const clampPanelPosition = <RowType,>(
  position: ContextMenuPosition,
  items: ContextMenuItem<RowType>[],
) => {
  if (typeof window === "undefined") return position;

  const estimatedHeight = estimatePanelHeight(items);

  return {
    x: Math.max(
      EDGE_OFFSET,
      Math.min(position.x, window.innerWidth - MENU_WIDTH - EDGE_OFFSET),
    ),
    y: Math.max(
      EDGE_OFFSET,
      Math.min(position.y, window.innerHeight - estimatedHeight - EDGE_OFFSET),
    ),
  };
};

const resolvePanelTitle = (item: ContextMenuItem<any>) => {
  if (item.title) return item.title;
  if (typeof item.label === "string") return item.label;
  return undefined;
};

const renderMenuIcon = <RowType,>(icon?: ContextMenuItem<RowType>["icon"]) => {
  if (icon === undefined || icon === null || icon === false) {
    return <span className={styles.iconSlot} aria-hidden="true" />;
  }

  if (
    isValidElement(icon) ||
    typeof icon === "string" ||
    typeof icon === "number"
  ) {
    return <span className={styles.iconSlot}>{icon}</span>;
  }

  const Icon = icon as ContextMenuIconComponent;

  return (
    <span className={styles.iconSlot}>
      <Icon size={14} strokeWidth={1.7} className={styles.icon} />
    </span>
  );
};

function ContextMenu<RowType extends Record<string, any>>({
  open,
  items = [],
  position,
  row,
  rowIndex,
  onClose,
  portalId = "portal-root",
}: ContextMenuProps<RowType>) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const [openPath, setOpenPath] = useState<number[]>([]);
  const [submenuPositions, setSubmenuPositions] = useState<
    Record<string, ContextMenuPosition>
  >({});

  const visibleItems = useMemo(() => getVisibleItems(items), [items]);
  const portalTarget =
    typeof document === "undefined"
      ? null
      : document.getElementById(portalId) || document.body;
  const rootPosition = useMemo(
    () => clampPanelPosition(position, visibleItems),
    [position, visibleItems],
  );

  useEffect(() => {
    if (!open) return;

    setOpenPath([]);
    setSubmenuPositions({});
  }, [open, position, rowIndex, items]);

  useEffect(() => {
    if (!open) return;

    const handleMouseDown = (event: MouseEvent) => {
      if (!containerRef.current?.contains(event.target as Node)) {
        onClose();
      }
    };

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        onClose();
      }
    };

    const handleViewportChange = () => {
      onClose();
    };

    window.addEventListener("mousedown", handleMouseDown);
    window.addEventListener("keydown", handleKeyDown);
    window.addEventListener("resize", handleViewportChange);
    window.addEventListener("scroll", handleViewportChange, true);

    return () => {
      window.removeEventListener("mousedown", handleMouseDown);
      window.removeEventListener("keydown", handleKeyDown);
      window.removeEventListener("resize", handleViewportChange);
      window.removeEventListener("scroll", handleViewportChange, true);
    };
  }, [open, onClose]);

  if (!open || !visibleItems.length || !portalTarget) {
    return null;
  }

  const isItemPathOpen = (itemPath: number[]) =>
    itemPath.every((segment, index) => openPath[index] === segment);

  const handleItemEnter = (
    item: ContextMenuItem<RowType>,
    itemPath: number[],
    event: React.MouseEvent<HTMLButtonElement>,
  ) => {
    const childItems = getVisibleItems(item.items);

    if (!childItems.length || item.disabled) {
      setOpenPath(itemPath.slice(0, -1));
      return;
    }

    const itemRect = event.currentTarget.getBoundingClientRect();
    const estimatedHeight = estimatePanelHeight(childItems);
    let nextX = itemRect.right + PANEL_GAP;
    let nextY = itemRect.top - PANEL_PADDING;

    if (typeof window !== "undefined") {
      if (nextX + MENU_WIDTH > window.innerWidth - EDGE_OFFSET) {
        nextX = itemRect.left - MENU_WIDTH - PANEL_GAP;
      }

      nextY = Math.max(
        EDGE_OFFSET,
        Math.min(
          nextY,
          window.innerHeight - estimatedHeight - EDGE_OFFSET,
        ),
      );
    }

    setOpenPath(itemPath);
    setSubmenuPositions((current) => ({
      ...current,
      [itemPath.join(".")]: {
        x: nextX,
        y: nextY,
      },
    }));
  };

  const renderPanel = (
    panelItems: ContextMenuItem<RowType>[],
    panelPosition: ContextMenuPosition,
    parentPath: number[] = [],
  ) => (
    <div
      role="menu"
      className={styles.panel}
      style={{
        left: `${panelPosition.x}px`,
        top: `${panelPosition.y}px`,
      }}
      onContextMenu={(event) => event.preventDefault()}
    >
      {panelItems.map((item, index) => {
        if (item.hidden) return null;

        const itemPath = [...parentPath, index];
        const pathKey = itemPath.join(".");
        const childItems = getVisibleItems(item.items);
        const hasChildren = childItems.length > 0;
        const isExpanded = hasChildren && isItemPathOpen(itemPath);

        if (item.separator) {
          return (
            <div
              key={item.id ?? `separator-${pathKey}`}
              role="separator"
              className={styles.separator}
            />
          );
        }

        return (
          <div
            key={item.id ?? pathKey}
            className={styles.itemWrap}
          >
            <button
              type="button"
              role="menuitem"
              title={resolvePanelTitle(item)}
              aria-disabled={item.disabled}
              aria-haspopup={hasChildren ? "menu" : undefined}
              aria-expanded={hasChildren ? isExpanded : undefined}
              className={[
                styles.item,
                item.disabled ? styles.itemDisabled : "",
                item.danger ? styles.itemDanger : "",
                isExpanded ? styles.itemExpanded : "",
                item.className || "",
              ]
                .filter(Boolean)
                .join(" ")}
              onMouseEnter={(event) => handleItemEnter(item, itemPath, event)}
              onClick={() => {
                if (item.disabled || hasChildren) return;
                item.onClick?.({
                  row,
                  rowIndex,
                  item,
                  closeMenu: onClose,
                });
                if (!item.keepOpen) {
                  onClose();
                }
              }}
            >
              {renderMenuIcon(item.icon)}
              <span className={styles.label}>{item.label}</span>
              {item.shortcut ? (
                <span className={styles.shortcut}>{item.shortcut}</span>
              ) : null}
              {hasChildren ? (
                <ChevronRight
                  size={13}
                  strokeWidth={1.9}
                  className={styles.chevron}
                />
              ) : null}
            </button>

            {hasChildren && isExpanded && submenuPositions[pathKey]
              ? renderPanel(childItems, submenuPositions[pathKey], itemPath)
              : null}
          </div>
        );
      })}
    </div>
  );

  return createPortal(
    <div
      ref={containerRef}
      className={styles.root}
      onContextMenu={(event) => event.preventDefault()}
    >
      {renderPanel(visibleItems, rootPosition)}
    </div>,
    portalTarget,
  );
}

export default ContextMenu;
