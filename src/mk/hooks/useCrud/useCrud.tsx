/* eslint-disable react-hooks/exhaustive-deps */
"use client";
import {
  useState,
  useEffect,
  Fragment,
  memo,
  useCallback,
  useRef,
  useMemo,
} from "react";
import useAxios from "../useAxios";
import { capitalize, getUrlImages } from "../../utils/string";
import { useAuth } from "../../contexts/AuthProvider";
import {
  ActionType,
  checkRulesFields,
  getParamFields,
  hasErrors,
} from "../../utils/validate/Rules";
import { logError } from "../../utils/logs";
import {
  detectLargeFilesAndStrip,
  uploadLargeFiles,
} from "../../utils/fileUpload";
import Table, { RenderColType } from "../../components/ui/Table/Table";
import DataModal from "../../components/ui/DataModal/DataModal";
import DetailModal from "../../components/ui/DetailModal/DetailModal";
import Button from "../../components/forms/Button/Button";
import Select from "../../components/forms/Select/Select";
// import useScreenSize from "../useScreenSize";
import styles from "./useCrudStyle.module.css";
import FloatButton from "@/mk/components/forms/FloatButton/FloatButton";
import KeyValue from "@/mk/components/ui/KeyValue/KeyValue";
import {
  IconAdmin,
  IconEdit,
  IconGrilla,
  IconImport,
  IconMenu,
  IconTableEmpty,
  IconTrash,
  IconExport,
  IconFilter,
} from "@/components/layout/icons/IconsBiblioteca";
import DataSearch from "@/mk/components/forms/DataSearch/DataSearch";
import FormElement from "./FormElement";
import Pagination from "@/mk/components/ui/Pagination/Pagination";
import ImportDataModal from "@/mk/components/data/ImportDataModal/ImportDataModal";
import EmptyData from "@/components/NoData/EmptyData";
import { IconEmptySearch } from "@/components/layout/icons/IconsBiblioteca";
import useMediaQuery from "../useMediaQuery";
import Dropdown from "@/mk/components/ui/Dropdown/Dropdown";
import { encodeReportViewerState } from "@/modulos/Reports/reportViewerState";
import { shouldUseNewReportsViewer } from "@/modulos/Reports/reportFeatureFlags";
import AsyncExportButton from "@/mk/components/ui/AsyncExportButton/AsyncExportButton";
import DownloadButton from "@/mk/components/ui/DownloadButton/DownloadButton";

export type ModCrudType = {
  modulo: string;
  singular: string;
  plural: string;
  permiso: string;
  extraData?: boolean | Record<string, any>;
  renderView?: Function;
  renderForm?: Function;
  renderDel?: Function;
  export?: boolean;
  pagination?: boolean;
  loadView?: Record<string, any>;
  import?: boolean;
  filter?: boolean;
  sumarize?: boolean;
  messageDel?: any;
  hideActions?: {
    add?: boolean;
    edit?: boolean;
    del?: boolean;
    view?: boolean;
  };
  onHideActions?: Function;
  saveMsg?: { add?: string; edit?: string; del?: string };
  listAndCard?: boolean;
  noWaiting?: boolean;
  search?: boolean | object;
  titleAdd?: string;
  titleEdit?: string;
  titleDel?: string;
  textSaveButtom?: string;
  formModal?: {
    minWidth?: string | number;
    maxWidth?: string | number;
    className?: string;
    style?: React.CSSProperties;
  };
  getListRows?: (response: any, params?: Record<string, any>) => any[];
  reportPreset?: string;
  /**
   * exportAsync (S36.5 — NEW-NEW-43 frontend migration)
   *
   * Si está pineado, el botón "Exportar reporte" usa el flow async
   * (POST /api/v3/reports/{type}/export + polling) en lugar del
   * legacy onExport (que cae a GET /api/v3/{modulo}?fullType=L&_export=pdf).
   *
   * - type:     nombre del ReportType registrado en el backend
   *             (S32: ReportTypeRegistry). Ej: "accesses", "balance", "payments".
   * - format:   "pdf" (default) o "excel" (cuando el ReportType pinea Excel,
   *             ver S37 para Payments XLSX).
   * - label:    texto del botón. Default: "Exportar".
   * - exportCols: subset opcional de cols (S36). Si no se pineá, el
   *               ReportType usa su default completo.
   * - extraParams: map opcional para pinear params adicionales al POST
   *                (ej: filterBy custom, dpto_id, type_access).
   *                Si no se pineá, useCrud pasa filterBy + searchBy
   *                del store actual.
   */
  exportAsync?: {
    type: string;
    format?: "pdf" | "excel";
    label?: string;
    exportCols?: string[];
    extraParams?: Record<string, any>;
  };
};

export type TypeRenderForm = {
  field: string;
  item: any;
  onChange?: (e: any) => void;
  error?: any;
  setItem?: Function;
  extraData?: any;
};
type PropsType = {
  paramsInitial: any;
  mod: any;
  fields: any;
  getSearch?: Function;
  getFilter?: Function;
  _onChange?: Function;
  _onImport?: Function;
  menuFilter?: any;
  extraButtons?: React.ReactNode[];
};

type PropsDetail = {
  open: boolean;
  onClose: () => void;
  item: any;
  i?: number;
  onConfirm?: Function;
  message?: any;
};

type UseCrudType = {
  user: any;
  showToast: Function;
  onAdd: Function;
  onDel: Function;
  onEdit: Function;
  onView: Function;
  onImport: Function;
  onExist: Function;
  onExportItem: Function;
  onExport: Function;
  onCloseCrud: Function;
  onCloseView: Function;
  onCloseDel: Function;
  onSave: Function;
  onSearch: Function;
  onFilter: Function;
  onChangePage: Function;
  onChangePerPage: Function;
  getTotalPages: Function;
  onChange: Function;
  openList: boolean;
  setOpenList: Function;
  openImport: boolean;
  setOpenImport: Function;
  open: boolean;
  setOpen: Function;
  openView: boolean;
  setOpenView: Function;
  openDel: boolean;
  setOpenDel: Function;
  formState: any;
  setFormState: Function;
  errors: any;
  setErrors: Function;
  params: any;
  setParams: Function;
  searchs: any;
  setSearchs: Function;
  data: any;
  loaded: boolean;
  setAction: Function;
  reLoad: Function;
  execute: Function;
  userCan: Function;
  store: any;
  setStore: Function;
  List: React.FC<any>;
  extraData: any;
  findOptions: Function;
  getExtraData: Function;
  openCard: boolean;
  listTotal?: number;
  listHasMore?: boolean;
  isAppendingList?: boolean;
  isResetListLoading?: boolean;
  infiniteBatchSize?: number;
  infinitePrefetchRows?: number;
  onLoadMore?: Function;
  sortCol?: { col: string; asc: boolean };
  onSort?: Function;
};

type CrudRendererHostProps = {
  renderer?: Function;
  rendererProps: Record<string, any>;
};

const INFINITE_BATCH_SIZE = 40;
const INFINITE_PREFETCH_ROWS = 20;
const MIN_TABLE_SKELETON_MS = 300;
const PAGINATION_GUTTER_RECOVERY = 72;

const getNormalizedPerPage = (perPage: any, enableInfinite = false) => {
  const parsed = Number(perPage);

  if (!enableInfinite || !Number.isFinite(parsed) || parsed <= 0) {
    return perPage;
  }

  return Math.max(parsed, INFINITE_BATCH_SIZE);
};

const getParamsQuerySignature = (source: Record<string, any> = {}) => {
  const { page, ...rest } = source || {};
  const ordered = Object.keys(rest)
    .sort()
    .reduce<Record<string, any>>((acc, key) => {
      acc[key] = rest[key];
      return acc;
    }, {});

  return JSON.stringify(ordered);
};

const getResponseTotal = (response: any, fallback = 0) => {
  const total = Number(response?.message?.total ?? response?.total ?? fallback);
  return Number.isFinite(total) ? total : fallback;
};

const hasExplicitResponseTotal = (response: any) => {
  const total = response?.message?.total ?? response?.total;
  if (total === undefined || total === null || total === "") return false;

  return Number.isFinite(Number(total));
};

const getExpandedListHeight = (
  height: string | number | undefined,
  expandViewport = false,
) => {
  if (!height && height !== 0) return undefined;

  const normalized =
    typeof height === "number" ? `${height}px` : String(height).trim();

  if (!expandViewport) return normalized;

  if (
    normalized === "100%" ||
    normalized.endsWith("%") ||
    /^calc\(\s*100%\s*[+-]/i.test(normalized)
  ) {
    return normalized;
  }

  return `calc(${normalized} + ${PAGINATION_GUTTER_RECOVERY}px)`;
};

const mergeRowsById = (currentRows: any[] = [], incomingRows: any[] = []) => {
  if (!currentRows.length) return incomingRows;
  if (!incomingRows.length) return currentRows;

  const merged = [...currentRows];
  const indexById = new Map<string, number>();

  merged.forEach((row, index) => {
    if (row?.id !== undefined && row?.id !== null) {
      indexById.set(String(row.id), index);
    }
  });

  incomingRows.forEach((row) => {
    if (row?.id === undefined || row?.id === null) {
      merged.push(row);
      return;
    }

    const existingIndex = indexById.get(String(row.id));
    if (existingIndex === undefined) {
      indexById.set(String(row.id), merged.length);
      merged.push(row);
      return;
    }

    merged[existingIndex] = row;
  });

  return merged;
};

const CrudRendererHost = memo(
  ({ renderer, rendererProps }: CrudRendererHostProps) => {
    if (!renderer) return null;

    // Keep a stable host so inline renderers from callers don't remount modal state.
    if (typeof renderer === "function") {
      return renderer(rendererProps);
    }

    if (
      typeof renderer === "object" &&
      renderer !== null &&
      "type" in renderer &&
      typeof (renderer as { type?: unknown }).type === "function"
    ) {
      return (renderer as { type: Function }).type(rendererProps);
    }

    const RendererComponent = renderer as any;
    return <RendererComponent {...rendererProps} />;
  },
);
CrudRendererHost.displayName = "CrudRendererHost";

const useCrud = ({
  paramsInitial,
  mod,
  fields,
  getSearch,
  getFilter,
  _onChange,
  _onImport,
  menuFilter = null,
  extraButtons = [],
}: PropsType): UseCrudType => {
  const { user, showToast, userCan, store, setStore } = useAuth();
  const [formState, setFormState]: any = useState({});
  const [errors, setErrors]: any = useState({});

  const [openImport, setOpenImport] = useState(false);
  const [isExporting, setIsExporting] = useState(false);
  const [openList, setOpenList] = useState(true);
  const [open, setOpen] = useState(false);
  const [openView, setOpenView] = useState(false);
  const [openDel, setOpenDel] = useState(false);
  const useInfiniteList =
    Number(paramsInitial?.perPage ?? -1) > 0 && mod?.pagination !== false;
  let extraParams: any = localStorage.getItem(mod.modulo + "Params");
  if (extraParams) extraParams = JSON.parse(extraParams);
  localStorage.removeItem(mod.modulo + "Params");
  // console.log("Etradata00", mod.extraData);
  const [params, setParams] = useState({
    ...{
      ...paramsInitial,
      ...(extraParams || {}),
      ...(useInfiniteList
        ? {
            page: 1,
            perPage: getNormalizedPerPage(
              extraParams?.perPage ?? paramsInitial?.perPage,
              true,
            ),
          }
        : {}),
    },
    ...(mod?.extraData ? { extraData: JSON.stringify(mod?.extraData) } : {}),
  });
  const [searchs, setSearchs]: any = useState(extraParams || {});
  const [action, setAction] = useState<ActionType>("add");
  const [openCard, setOpenCard] = useState(false);
  // console.log("paramsInitialCrud", extraParams);
  if (mod) {
    mod.titleAdd = mod.titleAdd ?? "Agregar";
    mod.titleEdit = mod.titleEdit ?? "Editar";
    mod.titleDel = mod.titleDel ?? "Eliminar";
    // mod.title = mod.title ?? store?.title ?? mod.plural;
  }

  // const [data, setData]: any = useState(null);
  // const [loaded, setLoaded] = useState(false);
  // const { reLoad, execute } = useAxios();
  const {
    data: axiosData,
    reLoad: axiosReload,
    execute,
    loaded: axiosLoaded,
    error: axiosError,
  } = useAxios(
    useInfiniteList ? null : "/" + mod.modulo,
    "GET",
    useInfiniteList ? {} : params,
    mod?.noWaiting,
  );
  const [manualData, setManualData] = useState<any>(null);
  const [manualLoaded, setManualLoaded] = useState(!useInfiniteList);
  const [manualError, setManualError]: any = useState("");
  const latestRequestIdRef = useRef(0);
  const lastResolvedParamsRef = useRef<Record<string, any>>(params);
  const data = useInfiniteList ? manualData : axiosData;
  const loaded = useInfiniteList ? manualLoaded : axiosLoaded;
  const error = useInfiniteList ? manualError : axiosError;
  const [listRows, setListRows] = useState<any[]>([]);
  const [listTotal, setListTotal] = useState(0);
  const [listHasMore, setListHasMore] = useState(false);
  const [isAppendingList, setIsAppendingList] = useState(false);
  const [isResetListLoading, setIsResetListLoading] = useState(false);
  const loadedQueryRef = useRef("");
  const pendingReloadResolveRef = useRef<((value?: any) => void) | null>(null);
  const loadMoreLockRef = useRef(false);
  const infiniteBatchSize = useInfiniteList
    ? getNormalizedPerPage(params.perPage ?? paramsInitial?.perPage, true)
    : Number(params.perPage ?? paramsInitial?.perPage ?? 0);
  const infinitePrefetchRows = Math.max(
    INFINITE_PREFETCH_ROWS,
    Math.round(Number(infiniteBatchSize || INFINITE_BATCH_SIZE) * 0.5),
  );
  const getListRowsFromResponse = useCallback(
    (response: any, sourceParams: Record<string, any> = params) => {
      if (mod.getListRows) {
        const customRows = mod.getListRows(response, sourceParams);
        return Array.isArray(customRows) ? customRows : [];
      }

      return Array.isArray(response?.data) ? response.data : [];
    },
    [mod, params],
  );

  const beginListReset = useCallback(() => {
    if (!useInfiniteList) return;

    loadedQueryRef.current = "";
    setListRows([]);
    setListTotal(0);
    setListHasMore(false);
    loadMoreLockRef.current = false;
    setIsAppendingList(false);
    setIsResetListLoading(true);
  }, [useInfiniteList]);

  const fetchInfiniteCrudData = useCallback(
    async (requestParams: Record<string, any>, noWaiting = mod?.noWaiting) => {
      const nextRequestParams = { ...(requestParams || {}) };
      const requestId = latestRequestIdRef.current + 1;
      latestRequestIdRef.current = requestId;
      setManualError("");
      setManualLoaded(false);

      const result = await execute(
        "/" + mod.modulo,
        "GET",
        nextRequestParams,
        false,
        noWaiting,
      );

      if (requestId !== latestRequestIdRef.current) {
        return result;
      }

      lastResolvedParamsRef.current = nextRequestParams;
      setManualData(result.data);
      setManualError(result.error);
      setManualLoaded(true);
      return result;
    },
    [execute, mod?.modulo, mod?.noWaiting],
  );

  const resolvedData = useMemo(() => {
    if (!data) return data;

    if (!useInfiniteList) {
      const normalizedRows = getListRowsFromResponse(data);

      if (!Array.isArray(data?.data) && normalizedRows.length > 0) {
        const message =
          typeof data.message === "object" && data.message !== null
            ? data.message
            : {};

        return {
          ...data,
          data: normalizedRows,
          message: {
            ...message,
            total: getResponseTotal(data, normalizedRows.length),
          },
        };
      }

      return data;
    }

    const message =
      typeof data.message === "object" && data.message !== null
        ? data.message
        : {};

    return {
      ...data,
      data: listRows,
      message: {
        ...message,
        total: listTotal || getResponseTotal(data, listRows.length),
      },
    };
  }, [data, getListRowsFromResponse, listRows, listTotal, useInfiniteList]);

  const reloadCrudList = useCallback(
    (_payload: any = null, noWaiting = false, prevent = false) => {
      if (!useInfiniteList) {
        return axiosReload(_payload, noWaiting, prevent);
      }

      beginListReset();

      const nextParams = {
        ...params,
        ...(_payload || {}),
        page: 1,
        perPage: getNormalizedPerPage(
          (_payload || {}).perPage ?? params.perPage ?? paramsInitial?.perPage,
          true,
        ),
      };

      return new Promise((resolve) => {
        pendingReloadResolveRef.current = resolve;
        setParams(nextParams);
      });
    },
    [
      axiosReload,
      beginListReset,
      params,
      paramsInitial?.perPage,
      useInfiniteList,
    ],
  );

  const loadMoreRows = useCallback(() => {
    if (
      !useInfiniteList ||
      !listHasMore ||
      isAppendingList ||
      isResetListLoading ||
      loadMoreLockRef.current
    ) {
      return;
    }

    const currentTotal = listTotal || getResponseTotal(data, listRows.length);
    if (currentTotal > 0 && listRows.length >= currentTotal) return;

    loadMoreLockRef.current = true;
    setIsAppendingList(true);
    setParams((old: any) => ({
      ...old,
      page: Number(old?.page || 1) + 1,
      perPage: getNormalizedPerPage(
        old?.perPage ?? paramsInitial?.perPage,
        true,
      ),
    }));
  }, [
    data,
    isAppendingList,
    isResetListLoading,
    listHasMore,
    listRows.length,
    listTotal,
    paramsInitial?.perPage,
    useInfiniteList,
  ]);

  useEffect(() => {
    if (!useInfiniteList || !data) return;

    const responseParams = lastResolvedParamsRef.current || params;
    const incomingRows = getListRowsFromResponse(data, responseParams);
    const responsePage = Number(responseParams?.page || 1);
    const querySignature = getParamsQuerySignature(responseParams);
    const currentQuerySignature = getParamsQuerySignature(params);
    if (querySignature !== currentQuerySignature) return;

    const shouldReset =
      responsePage <= 1 || loadedQueryRef.current !== querySignature;
    const total = getResponseTotal(data, incomingRows.length);
    const responsePerPage = Number(
      getNormalizedPerPage(
        responseParams?.perPage ?? paramsInitial?.perPage,
        true,
      ) || INFINITE_BATCH_SIZE,
    );
    const hasKnownTotal = hasExplicitResponseTotal(data) && total >= 0;
    const isDetailQuery =
      String(responseParams?.fullType || "").toUpperCase() === "DET";

    setListTotal(hasKnownTotal ? total : 0);
    setListRows((old) => {
      const mergedRows = shouldReset
        ? incomingRows
        : mergeRowsById(old, incomingRows);
      const nextHasMore = isDetailQuery
        ? false
        : hasKnownTotal
          ? mergedRows.length < total
          : incomingRows.length >= Math.max(1, responsePerPage);

      setListHasMore(nextHasMore);
      return mergedRows;
    });
    loadedQueryRef.current = querySignature;
    loadMoreLockRef.current = false;
    setIsAppendingList(false);
    setIsResetListLoading(false);

    if (pendingReloadResolveRef.current) {
      pendingReloadResolveRef.current(data);
      pendingReloadResolveRef.current = null;
    }
  }, [
    data,
    getListRowsFromResponse,
    params,
    paramsInitial?.perPage,
    useInfiniteList,
  ]);

  useEffect(() => {
    if (!error || !useInfiniteList) return;

    loadMoreLockRef.current = false;
    setIsAppendingList(false);
    setIsResetListLoading(false);

    if (pendingReloadResolveRef.current) {
      pendingReloadResolveRef.current();
      pendingReloadResolveRef.current = null;
    }
  }, [error, useInfiniteList]);

  const onChange = useCallback((e: any) => {
    let value = e.target.value;
    if (_onChange) {
      if (_onChange(e, formState, setFormState)) return;
    }
    setFormState((old: any) => ({ ...old, [e.target.name]: value }));
  }, []);

  const initOpen = (
    setOpen: Function,
    data: Record<string, any> = {},
    action: ActionType = "add",
  ) => {
    setAction(action);
    let dataNew: any = {};
    if (action == "add") {
      for (const key in fields) {
        if (fields[key].form?.precarga) {
          dataNew[key] =
            typeof fields[key].form?.precarga == "function"
              ? fields[key].form?.precarga({ key, data })
              : fields[key].form?.precarga;
        }
      }
      setFormState(dataNew);
    } else {
      dataNew = data;
      for (const key in fields) {
        if (fields[key].form?.edit?.precarga) {
          dataNew[key] =
            typeof fields[key].form?.edit?.precarga == "function"
              ? fields[key].form?.edit.precarga({ key, data })
              : fields[key].form?.edit.precarga;
        }
      }
      setFormState({ ...dataNew, _initItem: dataNew });
    }
    setErrors({});
    setOpen(true);
  };

  const onAdd = useCallback(() => {
    if (!userCan(mod.permiso, "C"))
      return showToast("No tiene permisos para " + mod.titleAdd, "error");
    initOpen(setOpen);
  }, []);

  const onDel = useCallback((item: Record<string, any>) => {
    if (!userCan(mod.permiso, "D"))
      return showToast("No tiene permisos para " + mod.titleDel, "error");
    initOpen(setOpenDel, item, "del");
  }, []);

  const onEdit = useCallback((item: Record<string, any>) => {
    if (!userCan(mod.permiso, "U"))
      return showToast("No tiene permisos para " + mod.titleEdit, "error");
    initOpen(setOpen, item, "edit");
  }, []);

  const getItemApi = useCallback(async (item: Record<string, any>) => {
    let searchBy = item.id;
    if (mod.loadView.key_id) {
      searchBy = item[mod.loadView.key_id];
    }

    const { data } = await execute(
      "/" + mod.modulo,
      "GET",
      {
        page: 1,
        perPage: 1,
        fullType: "DET",
        searchBy: searchBy,
        ...(mod.loadView !== true ? mod.loadView : {}),
      },
      false,
      true,
    );
    if (data?.success) {
      return data?.data;
    }
    return item;
  }, []);

  const onView = useCallback(
    async (item: Record<string, any>) => {
      if (!userCan(mod.permiso, "R"))
        return showToast("No tiene permisos para visualizar", "error");

      if (mod.loadView) {
        item = await getItemApi(item);
      }
      initOpen(setOpenView, item, "view");
    },
    [mod, userCan, showToast, getItemApi, initOpen],
  );

  const onImport = useCallback((e: any) => {
    if (!userCan(mod.permiso, "C"))
      return showToast("No tiene permisos para importar", "error");
    if (_onImport) {
      _onImport();
    }
  }, []);

  const onExist = useCallback(
    async ({ type = "", cols = "id", modulo = "", searchBy = "" }: any) => {
      if (modulo == "") modulo = mod.modulo;
      const { data: row } = await execute(
        "/" + modulo,
        "GET",
        {
          type,
          searchBy,
          cols,
          perPage: -1,
          page: 1,
          _exist: 1,
        },
        false,
        mod?.noWaiting,
      );
      return row?.success ? row.data : false;
    },
    [],
  );

  const onCloseCrud = (options: Record<string, any> | null = null) => {
    if (!openList) setOpenList(true);
    if (options) {
      if (options.beforeClose) options.beforeClose();
    }
    setOpen(false);
  };

  const onCloseView = () => {
    if (!openList) setOpenList(true);

    // if (scrollTo>-1)
    setOpenView(false);
  };

  const onSave = async (data: Record<string, any>, _setErrors?: Function) => {
    if (!userCan(mod.permiso, action == "del" ? "D" : action))
      return showToast("No tiene permisos para esta acción", "error");

    if (action != "del") {
      const errors = checkRulesFields(fields, data, action, execute);
      if (_setErrors) {
        _setErrors(errors);
      } else {
        setErrors(errors);
      }
      if (hasErrors(errors)) return;
    }

    const url = "/" + mod.modulo + (data.id ? "/" + data.id : "");
    let method = "POST";
    if (data.id) {
      method = "PUT";
      if (action == "del") {
        method = "DELETE";
      }
    }

    // Build params and detect large file fields (to be uploaded separately)
    const param = getParamFields(data, fields, action);
    const uploadLimitMB = mod?.fileUploadLimitMB ?? 0.5;
    const { param: paramWithoutFiles, filesToUpload } =
      detectLargeFilesAndStrip(data, fields, { ...param }, uploadLimitMB);

    // Use the same detection result as creation: filesToUpload contains only
    // files that exceeded the upload limit and were stripped from the params.
    // We won't force additional behavior for edits here; rely on detectLargeFilesAndStrip.

    // Ensure root ext is present when a file field exists.
    // If we detected filesToUpload (i.e. files stripped because they're large),
    // prefer the extension from the file to override any previous value —
    // otherwise fall back to ext found in the form data.
    if (filesToUpload.length > 0 && filesToUpload[0].ext) {
      paramWithoutFiles.ext = filesToUpload[0].ext;
    } else {
      for (const key in fields) {
        const f = fields[key];
        if (f?.form?.type === "fileUpload") {
          const val = data[key] || param[key];
          if (val && typeof val === "object" && val.ext) {
            paramWithoutFiles.ext = val.ext;
            break;
          }
        }
      }
    }

    const { data: response, error: err } = await execute(
      url,
      method,
      action == "del" ? { id: data.id } : paramWithoutFiles,
      false,
      mod?.noWaiting,
    );

    if (response?.success) {
      try {
        const uploadId =
          response?.data?.id ??
          response?.data?.data?.id ??
          data?.id ??
          response?.id ??
          null;
        if (filesToUpload.length > 0 && uploadId) {
          await uploadLargeFiles(
            filesToUpload,
            uploadId,
            execute,
            mod?.noWaiting,
            showToast,
          );
        }
      } catch (e) {
        logError("Error post-upload handling", e);
      }

      onCloseCrud();
      setOpenDel(false);
      if (useInfiniteList) {
        await reloadCrudList(null, mod?.noWaiting);
      } else {
        axiosReload(params, mod?.noWaiting);
      }
      showToast(mod.saveMsg?.[action] || response?.message, "success");
    } else {
      showToast(response?.message, "error");
      logError("Error onSave:", err);
    }
  };

  const [oldSearch, setOldSearch] = useState({});
  const onSearch = (_search: string) => {
    let searchBy = { searchBy: _search };
    if (getSearch) searchBy = getSearch(_search, oldSearch);
    setSearchs(searchBy);
    // console.log("apappaa", searchBy, mod?.searchLocal);
    if (!mod.onSearch) {
      beginListReset();
      setParams((old: any) => ({
        ...old,
        ...searchBy,
        page: 1,
        ...(useInfiniteList
          ? {
              perPage: getNormalizedPerPage(
                old?.perPage ?? paramsInitial?.perPage,
                true,
              ),
            }
          : {}),
      }));
    }
    setOldSearch(searchBy);
  };
  const [oldFilter, setOldFilter]: any = useState({});
  const onFilter = (_opt: string, value: string) => {
    let opt = _opt.replace("_filter", "");
    // console.log("onFilter", opt, value);
    let filterBy = { filterBy: { ...oldFilter.filterBy, [opt]: value } };
    if (getFilter) filterBy = getFilter(opt, value, oldFilter);
    //iterar filterBy para quitar los vacios
    let fil: any = [];
    for (const key in filterBy.filterBy) {
      if (filterBy.filterBy[key]) fil.push(key + ":" + filterBy.filterBy[key]);
    }
    fil = fil.join("|");
    // Always update filterBy: set to new value OR explicitly to undefined to clear old filters from params
    const newParams = { ...params, page: 1 };
    if (fil) {
      newParams.filterBy = fil;
    } else {
      delete newParams.filterBy;
    }
    beginListReset();
    setParams(
      useInfiniteList
        ? {
            ...newParams,
            perPage: getNormalizedPerPage(
              newParams.perPage ?? paramsInitial?.perPage,
              true,
            ),
          }
        : newParams,
    );
    setOldFilter(filterBy);
  };

  const onChangePage = (page: number) => {
    if (useInfiniteList && page <= 1) {
      beginListReset();
    }
    setParams((old: any) => ({ ...old, page }));
  };

  const onChangePerPage = (e: any) => {
    let perPage = e.target.value;
    if (params.perPage == perPage) return;
    if (!perPage) perPage = -1;
    beginListReset();
    setParams((old: any) => ({
      ...old,
      page: 1,
      perPage: useInfiniteList ? getNormalizedPerPage(perPage, true) : perPage,
    }));
  };

  const getTotalPages = () => {
    let total = 0;
    total = Math.ceil(
      (getResponseTotal(resolvedData, resolvedData?.data?.length ?? 1) || 1) /
        (params?.perPage || 1),
    );
    return total;
  };

  const onCloseDel = () => {
    if (!openList) setOpenList(true);
    setOpenDel(false);
  };

  type ExportType = "pdf" | "xls" | "csv";
  const useNewReportsViewer = shouldUseNewReportsViewer(mod?.reportPreset);

  const openReportViewer = () => {
    if (!useNewReportsViewer || typeof window === "undefined") return;

    const nextState = encodeReportViewerState({
      params: {
        ...params,
        fullType: params?.fullType || "L",
      },
    });
    const nextUrl = `/reports?preset=${encodeURIComponent(
      mod.reportPreset,
    )}&state=${nextState}`;

    window.open(nextUrl, "_blank", "noopener,noreferrer");
  };

  const onExport = async (
    type?: string, // Cambiar el tipo a string opcional
    callBack: (url: string) => void = (url: string) => {},
  ) => {
    if (!userCan(mod.permiso, "R"))
      return showToast("No tiene permisos para visualizar", "error");

    if (isExporting) return; // Evitar múltiples clics
    setIsExporting(true);

    const { data: file } = await execute(
      "/" + mod.modulo,
      "GET",
      {
        ...params,
        ...(Number(params?.perPage ?? -1) > 0 ? { page: 1, perPage: -1 } : {}),
        fullType: "L", // Agregar fullType: "L"
        _export: type ?? "pdf", // Usar ?? para valor por defecto
        exportCols: mod?.exportCols || params.cols || "",
        exportTitulo: mod?.exportTitulo || "Listado de " + mod.plural,
        exportTitulos: mod?.exportTitulos || "",
        exportAnchos: mod?.exportAnchos || "",
      },
      false,
      mod?.noWaiting,
    );

    if (file?.success) {
      // Si viene secureUrl (Cloudinary), usar directo; sino, usar el método anterior con path
      console.log("filesucces", file);
      const url = file.data?.secureUrl
        ? file.data.secureUrl
        : getUrlImages("/" + (file.data?.path || ""));

      // Intentar derivar un nombre de archivo desde el path o secureUrl; si no, usar por defecto
      const suggestedName = (() => {
        if (file.data?.secureUrl) {
          const urlPath = file.data.secureUrl.split("/").pop();
          if (urlPath && urlPath.trim().length > 0) return urlPath;
        }
        const path = String(file.data?.path || "");
        const base = path.split("/").pop();
        if (base && base.trim().length > 0) return base;
        const ext = (type ?? "pdf").toLowerCase();
        return `listado-${mod.modulo}.${ext}`;
      })();

      try {
        console.log("url", url);
        const response = await fetch(url);
        console.log("paso 2");
        const blob = await response.blob();
        console.log("paso 3");
        const blobUrl = window.URL.createObjectURL(blob);
        console.log("paso 4");

        const link = document.createElement("a");
        console.log("paso 5");
        link.href = blobUrl;
        link.download = suggestedName;
        document.body.appendChild(link);
        console.log("paso 6");
        link.click();
        console.log("paso 7");
        document.body.removeChild(link);
        console.log("paso 8");

        window.URL.revokeObjectURL(blobUrl);
        console.log("paso 9");
        callBack(url); // Mantener callback por compatibilidad
        console.log("paso 10");
      } catch (error) {
        // Fallback: si falla la descarga, abrir directamente la URL
        console.log("error de descarga directa");
        window.location.href = url;
      } finally {
        setIsExporting(false);
      }
    } else {
      showToast("Hubo un error al exportar el archivo", "error");
      logError("Error onExport:", file);
      setIsExporting(false);
    }
  };
  const onExportItem = (
    item: Record<string, any>,
    type: ExportType = "pdf",
  ) => {
    if (!userCan(mod.permiso, "R"))
      return showToast("No tiene permisos para visualizar", "error");
    initOpen(setOpenView, item, "export");
  };

  const didInitFetchRef = useRef(false);
  useEffect(() => {
    if (useInfiniteList) {
      fetchInfiniteCrudData(params, mod?.noWaiting);
      return;
    }

    if (!didInitFetchRef.current) {
      didInitFetchRef.current = true;
      return;
    }
    axiosReload(params, mod?.noWaiting);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [params, useInfiniteList, mod?.noWaiting]);

  const [extraData, setExtraData]: any = useState({});
  const getExtraData = async () => {
    const { data: extraData } = await execute(
      "/" + mod.modulo,
      "GET",
      {
        perPage: -1,
        page: 1,
        fullType: "EXTRA",
        ...(mod.extraData?.params || {}),
      },
      false,
      mod?.noWaiting,
    );
    // console.log('extradata get Estradata', extraData);
    setExtraData(extraData?.data);
  };
  // useEffect(() => {
  //   if (mod.extraData) {
  //     getExtraData();
  //   }
  //   // eslint-disable-next-line react-hooks/exhaustive-deps
  // }, []);

  useEffect(() => {
    if (data?.extraData) {
      setExtraData(data?.extraData);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [data?.extraData]);

  const Detail = memo(({ open, onClose, item, i }: PropsDetail) => {
    const getHeader = () => {
      const head: Object[] = [];
      for (const key in fields) {
        const field = fields[key];
        if (!field.label) continue;
        const col: any = {
          key,
          responsive: "onlyDesktop",
          label: field.label,
          onRenderView: field.onRenderView || null,
          onRender: _onRender(field),
          onRenderLabel: field.onRenderLabel || null,
          emptyHide: field.emptyHide || false,
          order: field.order || 1000,
          hide: field.hide || null,
          ...(field.view ? field.view : {}),
        };
        head.push(col);
      }
      head.sort((a: any, b: any) => a.order - b.order);
      return head;
    };
    const [header, setHeader]: any = useState([]);
    useEffect(() => {
      setHeader(getHeader());
    }, [fields]);

    return (
      <DetailModal
        open={open}
        onClose={() => onClose()}
        title={"Detalle de " + mod.singular}
        buttonText=""
        buttonCancel=""
      >
        <div className={""}>
          {header.map((col: any, index: number) => (
            <Fragment key={col.key + index}>
              {col.onRenderView ? (
                col.onRenderView({
                  item,
                  key: col.key,
                  user,
                  field: col,
                  extraData: extraData,
                })
              ) : (
                <>
                  {!col.hide && (!col.emptyHide || item[col.key]) && (
                    <div>
                      {col.onTop && (
                        <div>
                          {col.onTop({
                            value: item[col.key],
                            key: col.key,
                            item,
                            i,
                          })}
                        </div>
                      )}
                      <KeyValue
                        title={
                          col.onRenderLabel
                            ? col.onRenderLabel({
                                value: item[col.key],
                                key: col.key,
                                item,
                                i,
                              })
                            : col.label
                        }
                        value={
                          col.onRender
                            ? col.onRender({
                                value: item[col.key],
                                key: col.key,
                                item,
                                i,
                              })
                            : item[col.key]
                        }
                      />
                      {col.onBottom && (
                        <div>
                          {col.onBottom({
                            value: item[col.key],
                            key: col.key,
                            item,
                            i,
                          })}
                        </div>
                      )}
                    </div>
                  )}
                </>
              )}
            </Fragment>
          ))}
        </div>
      </DetailModal>
    );
  });
  Detail.displayName = "Detail";

  const RenderField = ({
    field,
    i,
    formStateForm,
    setFormStateForm,
    onChangeForm,
    onBlurForm,
    errorForm,
    setErrorForm,
  }: any) => {
    if (field.onRender) {
      return field.onRender({
        field,
        item: field.prepareData
          ? field.prepareData(formStateForm, field, field.key, setFormStateForm)
          : formStateForm,
        onChange: onChangeForm,
        onBlur: onBlurForm,
        error: errorForm,
        setError: setErrorForm,
        setItem: setFormStateForm,
        extraData: extraData,
      });
    }
    return (
      <FormElement
        field={field}
        item={
          field.prepareData
            ? field.prepareData(
                formStateForm,
                field,
                field.key,
                setFormStateForm,
              )
            : formStateForm
        }
        i={i}
        onChange={onChangeForm}
        onBlur={onBlurForm}
        error={errorForm}
        setError={setErrorForm}
        data={{ user, action, mod, extraData }}
      />
    );
  };

  const Form = memo(({ open, onClose, item, i, onConfirm }: PropsDetail) => {
    const getHeader = () => {
      const head: Object[] = [];
      for (const key in fields) {
        const field = fields[key];
        if (!field.form) continue;
        // if (field.hide && field.hide({ item, user, key })) continue;
        const col: any = {
          ...field.form,
          key,
          onRender: field.form.onRender,
          label: field.form.label || field.label,
          order: field.form.order || field.order || 1000,
          prepareData: field.form.prepareData || field.prepareData || null,
          onHide: field.form.onHide || field.onHide || null,
          action: action,
          openTag: field.openTag || null,
          closeTag: field.closeTag || null,
          style: { ...field.form.style },
          containerClassName: field.form.containerClassName || "",
          containerStyle: field.form.containerStyle || undefined,
          rules: field.form.rules || field.rules || null,
          // style: {
          //   ...field.form.style,
          //   ...(field.openTag ? { flex: "1" } : {}),
          // },
          // tagStyle: field.tagStyle || null,
        };
        // console.log("getHeader", typeof col.disabled == "function");
        // if (typeof col.disabled == "function") {
        //   col.disabled = col.disabled(item);
        // }
        if (
          field.form.type == "select" &&
          field.form.options &&
          typeof field.form.options == "function"
        )
          col.options = field.form.options({ item, user, key, extraData });
        head.push(col);
      }
      head.sort((a: any, b: any) => a.order - b.order);

      let renderItems: any[] = [];
      const headF: any[] = [];
      let openTag = -1;
      head.forEach((col: any, i: number) => {
        // console.log("col", col, i);
        if (col.openTag && openTag == -1) {
          headF.push({
            key: "openTag" + i,
            openTag: col.openTag,
            // style: col.tagStyle,
            // className: col.tagClass,
            items: [],
          });
          renderItems = [col];
          openTag = headF.length - 1;
          return;
        }
        if (openTag > -1) {
          renderItems.push(col);
          if (col.closeTag) {
            headF[openTag].items = renderItems;
            openTag = -1;
          }
        } else {
          headF.push(col);
        }
      });
      // if (openTag > -1) {
      //   headF[openTag].items = renderItems;
      //   openTag = -1;
      // }

      return headF;
    };

    const [formStateForm, setFormStateForm]: any = useState({});
    const [errorForm, setErrorForm] = useState({});
    const [header, setHeader]: any = useState([]);
    const [showExtraModal, setShowExtraModal] = useState(null);
    useEffect(() => {
      setHeader(getHeader());
    }, [fields, item._disabled]);

    useEffect(() => {
      let it = { ...item };
      setFormStateForm(it);
      setErrorForm({});
    }, [item]);

    const onChangeForm = useCallback(
      (e: any) => {
        if (!e.target) {
          setFormStateForm((old: any) => ({ ...old, ...e }));
          return;
        }
        let value = e.target.value;
        const fieldName = e.target.name;

        if (_onChange) {
          if (
            _onChange(
              e,
              formStateForm,
              setFormStateForm,
              setShowExtraModal,
              action,
            )
          )
            return;
        }
        if (item.onChange) {
          if (
            item.onChange(e, formStateForm, setFormStateForm, setShowExtraModal)
          )
            return;
        }
        setFormStateForm((old: any) => ({ ...old, [fieldName]: value }));
        setErrorForm((old: any) => {
          if (!old?.[fieldName]) return old;
          const next = { ...old };
          delete next[fieldName];
          return next;
        });
      },
      [formStateForm],
    );

    const onBlurForm = useCallback(
      (e: any) => {
        if (fields[e.target?.name]?.form?.onBlur) {
          fields[e.target?.name].form?.onBlur(e, {
            item: formStateForm,
            setItem: setFormStateForm,
            error: errorForm,
            setError: setErrorForm,
          });
        }
      },
      [formStateForm],
    );

    return (
      <DetailModal
        open={open}
        onClose={() => onClose()}
        title={
          (action == "add" ? mod.titleAdd : mod.titleEdit) + " " + mod.singular
        }
        // textSaveButtom por defecto "Guardar" o "Actualizar" segun action en mod.textSaveButtom
        buttonText={
          action == "add"
            ? mod?.textSaveButtom
              ? mod?.textSaveButtom
              : "Guardar"
            : "Actualizar"
        }
        onSave={(e) =>
          onConfirm
            ? onConfirm(formStateForm, setErrorForm)
            : onSave(formStateForm, setErrorForm)
        }
        className={mod.formModal?.className || ""}
        style={mod.formModal?.style}
        minWidth={mod.formModal?.minWidth}
        maxWidth={mod.formModal?.maxWidth ?? 560}
      >
        <div className={styles.formLayout}>
          {header.map((field: any, index: number) => (
            <Fragment key={field.key + index}>
              {field.items && (
                <div
                  className={[
                    styles.formGroup,
                    field.openTag?.border ? styles.formGroupBorder : "",
                    field.openTag?.className || "",
                  ]
                    .filter(Boolean)
                    .join(" ")}
                  style={field.openTag?.style}
                >
                  {/* {JSON.stringify(field.openTag)} */}
                  {field.openTag?.onTop && (
                    <div className={styles.formGroupTop}>
                      {field.openTag.onTop({
                        item: formStateForm,
                        key: field.key,
                        extraData: extraData,
                      })}
                    </div>
                  )}
                  {field.items.map((field: any, index: number) => (
                    <Fragment key={field.key + index}>
                      <RenderField
                        field={{
                          ...field,
                          style: { ...field.style, minWidth: 0 },
                        }}
                        i={index}
                        formStateForm={formStateForm}
                        setFormStateForm={setFormStateForm}
                        onChangeForm={onChangeForm}
                        onBlurForm={onBlurForm}
                        errorForm={errorForm}
                        setErrorForm={setErrorForm}
                      />
                    </Fragment>
                  ))}
                </div>
              )}
              {!field.items && (
                <div
                  className={[styles.formField, field.containerClassName]
                    .filter(Boolean)
                    .join(" ")}
                  style={field.containerStyle}
                >
                  <RenderField
                    field={field}
                    i={index}
                    formStateForm={formStateForm}
                    setFormStateForm={setFormStateForm}
                    onChangeForm={onChangeForm}
                    onBlurForm={onBlurForm}
                    errorForm={errorForm}
                    setErrorForm={setErrorForm}
                  />
                </div>
              )}
            </Fragment>
          ))}
        </div>
        {showExtraModal}
      </DetailModal>
    );
  });
  Form.displayName = "Form";
  const [filterSel, setFilterSel]: any = useState({});

  const FilterResponsive = ({ filters, onChange, breakPoint }: any) => {
    const isBreak = useMediaQuery("(max-width: " + breakPoint + "px)");

    const getFilterInputStyle = (filterKey: string) => ({
      backgroundColor: "var(--controlSecondaryBg)",
      borderColor:
        filterSel[filterKey] &&
        filterSel[filterKey] != "" &&
        filterSel[filterKey] != "T" &&
        filterSel[filterKey] != "ALL"
          ? "var(--cPrimary)"
          : "var(--controlSecondaryBorder)",
      color: "var(--controlSecondaryText)",
    });

    const BreakFilter = () => {
      const [open, setOpen] = useState(false);
      return (
        <>
          <IconFilter
            title="Filtros"
            style={{
              ...(Object.values(filterSel).filter(
                (e) => e !== "ALL" && e !== "" && e !== "T",
              )?.length > 0 && { color: "var(--cPrimary)" }),
            }}
            className={
              styles.icons + " " + (data?.length == 0 ? styles.disabled : "")
            }
            onClick={() => setOpen(true)}
          />
          <DataModal
            open={open}
            onClose={() => setOpen(false)}
            title="Filtros"
            buttonText=""
            buttonCancel=""
            variant="mini"
          >
            <div
              style={{ display: "flex", flexDirection: "column", gap: "8px" }}
            >
              {filters.map((f: any, i: number) => (
                <Select
                  key={f.key + i}
                  label={f.label}
                  name={f.key + "_filter"}
                  onChange={onChange}
                  options={f.options || []}
                  value={filterSel[f.key] || ""}
                  optionLabel={f?.optionLabel}
                  optionValue={f?.optionValue}
                  error={false}
                  inputStyle={getFilterInputStyle(f.key)}
                  style={{
                    width: "100%",
                  }}
                />
              ))}
            </div>
          </DataModal>
        </>
      );
    };
    return (
      <>
        {isBreak ? (
          <BreakFilter />
        ) : (
          <>
            {filters.map((f: any, i: number) => (
              <Select
                key={f.key + i}
                label={f.label}
                name={f.key + "_filter"}
                onChange={onChange}
                options={f.options || []}
                value={filterSel[f.key] || ""}
                optionLabel={f?.optionLabel}
                optionValue={f?.optionValue}
                inputStyle={getFilterInputStyle(f.key)}
                style={{
                  width: "fit-content",
                  minWidth: "var(--controlMinWidth)",
                  maxWidth: "100%",
                }}
              />
            ))}
          </>
        )}
      </>
    );
  };

  const AddMenu = memo(
    ({
      filters,
      onClick,
      extraButtons,
      data,
      breakPoint = 1,
    }: {
      filters?: any;
      onClick?: (e?: any) => void;
      extraButtons?: React.ReactNode[];
      data: any[];
      breakPoint?: number;
    }) => {
      // if (isMobile) return <FloatButton onClick={onClick || onAdd} />;

      const onChange = (e: any) => {
        const name = e.target.name.replace("_filter", "");
        setFilterSel({ ...filterSel, [name]: e.target.value });
        onFilter(name, e.target.value);
      };
      const resolvedBreakPoint = useMemo(() => {
        if (typeof breakPoint === "number" && breakPoint > 1) {
          return breakPoint;
        }

        const fieldFilterCount = Array.isArray(filters) ? filters.length : 0;
        const totalFilterCount = fieldFilterCount + (menuFilter ? 1 : 0);

        if (totalFilterCount === 0) {
          return 1;
        }

        const actionCount =
          (mod.import ? 1 : 0) +
          (mod.export === true ||
          (Array.isArray(mod.export) && mod.export.length > 0)
            ? 1
            : 0) +
          (mod.listAndCard ? 1 : 0) +
          (Array.isArray(extraButtons) ? extraButtons.length : 0) +
          (mod.hideActions?.add ? 0 : 1);

        if (totalFilterCount >= 3 || actionCount >= 4) {
          return 1680;
        }

        if (totalFilterCount >= 2 || actionCount >= 3) {
          return 1480;
        }

        return 1260;
      }, [breakPoint, extraButtons, filters, menuFilter, mod]);
      // console.log('export:',mod.export);

      return (
        <nav className={styles.toolbarRow}>
          {mod.search && mod.search.hide === true ? null : (
            <div className={styles.toolbarSearch}>
              <DataSearch
                value={searchs.searchBy || ""}
                name={mod.modulo + "Search"}
                setSearch={onSearch || setSearchs}
                searchMsg={extraData?.searchMsg}
              />
            </div>
          )}
          <div className={styles.toolbarControls}>
            {(menuFilter || mod.filter) && (
              <div className={styles.toolbarFilters}>
                {menuFilter || null}
                {mod.filter && (
                  <FilterResponsive
                    filters={filters}
                    breakPoint={resolvedBreakPoint}
                    onChange={onChange}
                  />
                )}
              </div>
            )}

            <div className={styles.toolbarActions}>
              {mod.import && (
                <IconImport
                  title="Importar"
                  className={
                    styles.icons +
                    " " +
                    (data?.length == 0 ? styles.disabled : "")
                  }
                  onClick={data?.length > 0 ? onImport : () => {}}
                />
              )}
              {mod.export === true && !mod.exportAsync && (
                <IconExport
                  title="Exportar reporte"
                  className={
                    styles.icons +
                    " " +
                    (data?.length == 0 ? styles.disabled : "")
                  }
                  onClick={
                    data?.length > 0
                      ? () =>
                          useNewReportsViewer
                            ? openReportViewer()
                            : onExport("pdf")
                      : () => {}
                  }
                />
              )}
              {mod.exportAsync && (
                <>
                  {/* S143e (HALLAZGO-NEW-54, binding, cross-project): si
                      `mod.exportAsync.supportedFormats` está pineado (array con
                      1+ formats), pinear el `DownloadButton` con ícono + menú.
                      Si NO, mantener el `AsyncExportButton` legacy (BC layer
                      para módulos no migrados). */}
                  {Array.isArray(mod.exportAsync.supportedFormats) &&
                  mod.exportAsync.supportedFormats.length > 0 ? (
                    <DownloadButton
                      type={mod.exportAsync.type}
                      supportedFormats={mod.exportAsync.supportedFormats}
                      endpoint={mod.exportAsync.endpoint ?? null}
                      useExtraData={Boolean(mod.exportAsync.useExtraData)}
                      requiredRelations={mod.exportAsync.requiredRelations ?? []}
                      title={mod.exportAsync.label || "Exportar"}
                      params={(() => {
                        // S118b: merge extraParams con filterBy/searchBy.
                        const out: Record<string, any> = {
                          ...(mod.exportAsync?.extraParams ?? {}),
                        };
                        if (params?.filterBy) out.filterBy = params.filterBy;
                        if (params?.searchBy) out.searchBy = params.searchBy;
                        if (
                          mod.exportAsync?.exportCols &&
                          mod.exportAsync.exportCols.length > 0
                        ) {
                          out.exportCols = mod.exportAsync.exportCols;
                        }
                        return out;
                      })()}
                    />
                  ) : (
                    <AsyncExportButton
                      type={mod.exportAsync.type}
                      format={mod.exportAsync.format || "pdf"}
                      label={mod.exportAsync.label || "Exportar"}
                      params={(() => {
                        // S118b: merge extraParams con filterBy/searchBy.
                        const out: Record<string, any> = {
                          ...(mod.exportAsync?.extraParams ?? {}),
                        };
                        if (params?.filterBy) out.filterBy = params.filterBy;
                        if (params?.searchBy) out.searchBy = params.searchBy;
                        if (
                          mod.exportAsync?.exportCols &&
                          mod.exportAsync.exportCols.length > 0
                        ) {
                          out.exportCols = mod.exportAsync.exportCols;
                        }
                        return out;
                      })()}
                      variant="terciary"
                    />
                  )}
                </>
              )}
              {mod.export?.length > 0 && (
                <Dropdown
                  trigger={
                    <IconExport
                      title="Exportar reporte"
                      className={
                        styles.icons +
                        " " +
                        (data?.length == 0 ? styles.disabled : "")
                      }
                    />
                  }
                  items={mod.export}
                  onClick={
                    data?.length > 0 ? (e: string) => onExport(e) : () => {}
                  }
                />
              )}
              {mod.listAndCard && (
                <div className={styles.listAndCard}>
                  <div
                    className={!openCard ? styles.active : ""}
                    onClick={() => setOpenCard(false)}
                  >
                    <IconMenu
                      className={
                        styles.icons +
                        " " +
                        (data?.length == 0 ? styles.disabled : "")
                      }
                    />
                  </div>
                  <div
                    className={openCard ? styles.active : ""}
                    onClick={() => setOpenCard(true)}
                  >
                    <IconGrilla
                      className={
                        styles.icons +
                        " " +
                        (data?.length == 0 ? styles.disabled : "")
                      }
                    />
                  </div>
                </div>
              )}

              {extraButtons && extraButtons.length > 0 && (
                <div className={styles.extraButtons}>
                  {extraButtons.map((button, index) => (
                    <div key={`extra-button-${index}`}>{button}</div>
                  ))}
                </div>
              )}

              {mod.hideActions?.add ? null : (
                <div className={styles.addButtonWrap}>
                  <Button
                    className={styles.addButton}
                    onClick={onClick || onAdd}
                    variant="primary"
                  >
                    {mod.titleAdd + " " + mod.singular}
                  </Button>
                </div>
              )}
            </div>
          </div>
        </nav>
      );
    },
  );
  AddMenu.displayName = "AddMenu";

  const FormDelete = memo(
    ({ open, onClose, item, onConfirm, message = "" }: PropsDetail) => {
      return (
        <DataModal
          id="Eliminar"
          title={capitalize(mod.titleDel) + " " + mod.singular}
          buttonText={capitalize(mod.titleDel)}
          buttonCancel="Cancelar"
          onSave={(e) => (onConfirm ? onConfirm(item) : onSave(item))}
          onClose={onClose}
          open={open}
          variant="mini"
        >
          {message ? (
            message
          ) : (
            <>
              ¿Estás seguro de {mod.titleDel} esta información?
              <br />
              {/* <br />
              {item.name || item.description}
              <br /> */}
              Recuerda que, al momento de {mod.titleDel}, ya no podrás
              recuperarla.
            </>
          )}
        </DataModal>
      );
    },
  );
  FormDelete.displayName = "FormDelete";

  const onButtonActions = (item: Record<string, any>) => {
    let hideEdit = mod.hideActions?.edit;
    let hideDel = mod.hideActions?.del;
    if (mod?.onHideActions) {
      const h = mod?.onHideActions(item);
      hideEdit = h?.hideEdit;
      hideDel = h?.hideDel;
    }
    return (
      <nav className={styles.actions}>
        {/* {hideEdit ? null : ( */}
        <div style={{ opacity: hideEdit ? 0.3 : 1 }}>
          <IconEdit
            onClick={(e: MouseEvent) => {
              if (hideEdit) return;
              e.stopPropagation();
              onEdit(item);
            }}
            size={32}
            circle
          />
        </div>
        {/* )} */}
        {/* {hideDel ? null : ( */}
        <div style={{ opacity: hideDel ? 0.3 : 1 }}>
          <IconTrash
            onClick={(e: MouseEvent) => {
              if (hideDel) return;
              e.stopPropagation();
              onDel(item);
            }}
            size={32}
            circle
          />
        </div>
        {/* )} */}
      </nav>
    );
  };

  const findOptions = (
    value: any,
    options: Record<string, any>[],
    key: string = "id",
    label: string = "name",
  ) => {
    if (!Array.isArray(options) || options.length == 0) return "";
    const r = options?.find((s: any) => s[key] == value);
    if (r) return r[label];
    return "";
  };
  const _onRender = (field: any, lista = false) => {
    const render = lista
      ? field.list?.onRender || field.onRender || null
      : field.view?.onRender || field.onRender || null;

    if (!render) {
      const opt = {
        type: field.list?.type ?? field.form?.type,
        optionsExtra: field.list?.optionsExtra ?? field.form?.optionsExtra,
        options: field.list?.options ?? field.form?.options,
        optionValue: field.list?.optionValue ?? field.form?.optionValue,
        optionLabel: field.list?.optionLabel ?? field.form?.optionLabel,
      };
      if (opt.type === "select" && opt.optionsExtra)
        return (item: RenderColType) => {
          return findOptions(
            item.value,
            extraData[opt.optionsExtra],
            opt.optionValue,
            opt.optionLabel,
          );
        };
      if (opt.type === "select" && !opt.optionsExtra)
        return (item: RenderColType) => {
          return findOptions(
            item.value,
            typeof opt.options == "function"
              ? opt.options({ key: opt.optionValue, item, user, extraData })
              : opt.options,
            opt.optionValue,
            opt.optionLabel,
          );
        };
    }
    return render;
  };

  const [sortCol, setSortCol] = useState({ col: "", asc: true });
  const onSort = (col: string, asc: boolean) => {
    setSortCol({ col, asc });
    beginListReset();
    setParams((old: any) => ({
      ...old,
      page: 1,
      sortBy: col,
      orderBy: asc ? "asc" : "desc",
      ...(useInfiniteList
        ? {
            perPage: getNormalizedPerPage(
              old?.perPage ?? paramsInitial?.perPage,
              true,
            ),
          }
        : {}),
    }));
  };
  const listRuntimeRef = useRef<any>(null);
  listRuntimeRef.current = {
    data: resolvedData,
    loaded,
    error,
    searchs,
    params,
    mod,
    fields,
    extraData,
    store,
    openList,
    openView,
    open,
    openImport,
    openDel,
    formState,
    errors,
    user,
    action,
    sortCol,
    extraButtons,
    execute,
    showToast,
    reLoad: reloadCrudList,
    setFormState,
    setErrors,
    setOpenImport,
    setOpenList,
    setParams,
    onView,
    onEdit,
    onDel,
    onAdd,
    onSave,
    onCloseView,
    onCloseCrud,
    onCloseDel,
    onChangePage,
    onSort,
    onLoadMore: loadMoreRows,
    onButtonActions,
    renderField: _onRender,
    getItemApi,
    AddMenu,
    Detail,
    Form,
    FormDelete,
    useInfiniteList,
    infiniteBatchSize,
    infinitePrefetchRows,
    isAppendingList,
    isResetListLoading,
    listTotal,
    listHasMore,
  };

  const listComponentRef = useRef<any>(null);
  if (!listComponentRef.current) {
    listComponentRef.current = function UseCrudList(props: any) {
      const runtime = listRuntimeRef.current;
      const CurrentAddMenu = runtime.AddMenu;
      const CurrentDetail = runtime.Detail;
      const CurrentForm = runtime.Form;
      const CurrentFormDelete = runtime.FormDelete;

      const { header, filters }: { header: any[]; filters: any[] } =
        useMemo(() => {
          const head: any[] = [];
          const lFilter: any[] = [];

          for (const key in runtime.fields) {
            const field = runtime.fields[key];
            if (field.filter) {
              const colF: any = {
                key,
                label: field.filter?.label ?? field.list?.label ?? field.label,
                width: field.filter?.width ?? field.list?.width ?? "auto",
                order:
                  field.filter?.order ??
                  field?.list?.order ??
                  field?.order ??
                  1000,
                options: field.filter?.extraData
                  ? runtime.extraData[field.filter?.extraData]
                  : (field.filter?.options(runtime.extraData) ??
                    field.form.options ??
                    []),
                optionLabel: field?.filter?.optionLabel,
                optionValue: field?.filter?.optionValue,
              };
              lFilter.push(colF);
            }
            if (!field.list) continue;
            const hasExplicitListSortable =
              Object.prototype.hasOwnProperty.call(field.list, "sortabled");
            const hasExplicitFieldSortable =
              Object.prototype.hasOwnProperty.call(field, "sortabled");
            const explicitSortable = hasExplicitListSortable
              ? field.list.sortabled
              : hasExplicitFieldSortable
                ? field.sortabled
                : undefined;
            const col: any = {
              key,
              responsive: "",
              label: field.list.label ?? field.label,
              className: field.list.className ?? "",
              width: field.list?.width,
              onRender: runtime.renderField(field, true),
              order: field.list.order ?? field.order ?? 1000,
              style: field.list.style ?? field.style ?? {},
              sumarize: field.list.sumarize ?? field.sumarize ?? false,
              sortabled: explicitSortable ?? !runtime.useInfiniteList,
            };
            head.push(col);
          }

          head.sort((a: any, b: any) => a.order - b.order);
          lFilter.sort((a: any, b: any) => a.order - b.order);

          return { header: head, filters: lFilter };
        }, [runtime.fields, runtime.extraData, runtime.renderField]);

      const filteredData = useMemo(() => {
        if (
          runtime.data?.data &&
          runtime.mod.onSearch &&
          runtime.searchs.searchBy
        ) {
          return runtime.mod.onSearch(runtime.data.data, runtime.searchs);
        }
        return runtime.data?.data;
      }, [runtime.data, runtime.mod, runtime.searchs]);

      const sortedData = useMemo(() => {
        if (!Array.isArray(filteredData)) return filteredData;
        if (runtime.useInfiniteList) return filteredData;
        if (!runtime.sortCol?.col) return filteredData;

        const resolveComparableValue = (value: any): any => {
          if (value === undefined || value === null) return "";
          if (typeof value === "number") return value;
          if (typeof value === "boolean") return value ? 1 : 0;

          if (value instanceof Date) return value.getTime();

          if (Array.isArray(value)) {
            return value.map(resolveComparableValue).join(" ");
          }

          if (typeof value === "object") {
            const candidate =
              value.name ??
              value.label ??
              value.title ??
              value.text ??
              value.description ??
              value.code ??
              value.id;

            return resolveComparableValue(candidate);
          }

          const normalized = String(value).trim();
          const numeric = Number(
            normalized
              .replace(/\s+/g, "")
              .replace(/[^0-9,.-]/g, "")
              .replace(/,(?=\d{3}\b)/g, ""),
          );

          if (
            normalized !== "" &&
            !Number.isNaN(numeric) &&
            /^[-+]?[\d\s.,]+$/.test(normalized)
          ) {
            return numeric;
          }

          const dateValue = Date.parse(normalized);
          if (!Number.isNaN(dateValue) && /[-/:\d]/.test(normalized)) {
            return dateValue;
          }

          return normalized.toLocaleLowerCase();
        };

        return [...filteredData].sort((left, right) => {
          const leftValue = resolveComparableValue(left?.[runtime.sortCol.col]);
          const rightValue = resolveComparableValue(
            right?.[runtime.sortCol.col],
          );

          if (leftValue === rightValue) return 0;
          if (leftValue === "") return 1;
          if (rightValue === "") return -1;

          const comparison = leftValue > rightValue ? 1 : -1;
          return runtime.sortCol.asc ? comparison : comparison * -1;
        });
      }, [filteredData, runtime.sortCol, runtime.useInfiniteList]);
      const hasSortableColumns = useMemo(
        () => header.some((item) => item.sortabled),
        [header],
      );

      const shouldRecoverViewport =
        props?.paginationHide ||
        runtime.useInfiniteList ||
        runtime.params?.perPage === -1;
      const resolvedListHeight = getExpandedListHeight(
        props?.height,
        shouldRecoverViewport,
      );
      const shouldRequestTableSkeleton =
        runtime.isResetListLoading ||
        (!runtime.loaded && runtime.data === null);
      const [showTableSkeleton, setShowTableSkeleton] = useState(
        shouldRequestTableSkeleton,
      );
      const skeletonStartedAtRef = useRef(
        shouldRequestTableSkeleton ? Date.now() : 0,
      );
      const skeletonRowCount = 20;

      useEffect(() => {
        if (shouldRequestTableSkeleton) {
          skeletonStartedAtRef.current = Date.now();
          setShowTableSkeleton(true);
          return;
        }

        if (!showTableSkeleton) return;

        const elapsed = Date.now() - skeletonStartedAtRef.current;
        const timeout = window.setTimeout(
          () => setShowTableSkeleton(false),
          Math.max(0, MIN_TABLE_SKELETON_MS - elapsed),
        );

        return () => window.clearTimeout(timeout);
      }, [shouldRequestTableSkeleton, showTableSkeleton]);

      let emptyContent;
      if (props.onRenderEmpty) {
        emptyContent = props.onRenderEmpty();
      } else if (
        (runtime.params?.filterBy && runtime.params?.filterBy.length > 0) ||
        (runtime.searchs && runtime.searchs.searchBy)
      ) {
        emptyContent = (
          <EmptyData
            h={props?.height ?? undefined}
            icon={<IconEmptySearch size={60} />}
            message="No se encontraron coincidencias. Ajusta tus filtros o"
            line2="prueba con una búsqueda diferente"
          />
        );
      } else {
        emptyContent = (
          <EmptyData
            h={props?.height ?? undefined}
            message={props.emptyMsg ?? undefined}
            line2={props.emptyLine2 ?? undefined}
            icon={props.emptyIcon ?? undefined}
            size={props.emptyIconSize ?? undefined}
          />
        );
      }

      return (
        <div className={styles.useCrud}>
          {(props.title || runtime.store?.title) &&
            runtime.openList &&
            !props.hideTitle && (
              <header className={styles.titleRow}>
                <p className={styles.titleText}>
                  {props.title ?? runtime.store?.title}
                </p>
              </header>
            )}
          {runtime.openList && (
            <CurrentAddMenu
              filters={filters}
              extraButtons={runtime.extraButtons}
              data={sortedData}
              breakPoint={props.filterBreakPoint}
            />
          )}
          {runtime.openList && (
            <div className={styles.contentRow}>
              <section className={styles.contentMain}>
                {showTableSkeleton || filteredData?.length > 0 ? (
                  <Table
                    data={showTableSkeleton ? [] : sortedData}
                    onRowClick={
                      props.onRowClick
                        ? props.onRowClick
                        : runtime.mod.hideActions?.view
                          ? () => {}
                          : runtime.onView
                    }
                    header={header}
                    onTabletRow={props.onTabletRow}
                    onRenderBody={props.onRenderBody}
                    onRenderFoot={props.onRenderFoot}
                    onRenderHead={props.onRenderHead}
                    onRenderCard={props.onRenderCard}
                    onButtonActions={
                      runtime.mod.hideActions?.edit &&
                      runtime.mod.hideActions?.del
                        ? undefined
                        : runtime.onButtonActions
                    }
                    height={resolvedListHeight}
                    className="striped"
                    actionsWidth={props.actionsWidth ?? "120px"}
                    sumarize={props.sumarize}
                    extraData={runtime.extraData}
                    onSort={hasSortableColumns ? runtime.onSort : undefined}
                    sortCol={runtime.sortCol}
                    id={runtime.mod?.modulo}
                    useInfiniteScroll={runtime.useInfiniteList}
                    hasMore={runtime.useInfiniteList && runtime.listHasMore}
                    isLoadingMore={runtime.isAppendingList}
                    onLoadMore={runtime.onLoadMore}
                    infiniteBatchSize={runtime.infiniteBatchSize}
                    prefetchRows={runtime.infinitePrefetchRows}
                    showSkeletonRows={showTableSkeleton}
                    skeletonRowCount={skeletonRowCount}
                    rowContextMenu={props.rowContextMenu}
                  />
                ) : runtime.data === null ? null : (
                  <section
                    className={styles.emptyState}
                    style={{
                      minHeight: resolvedListHeight || "280px",
                    }}
                  >
                    {emptyContent}
                  </section>
                )}
                {showTableSkeleton ||
                props?.paginationHide ||
                runtime.useInfiniteList ||
                runtime.params?.perPage === -1 ? null : (
                  <div className={styles.paginationRow}>
                    <Pagination
                      currentPage={runtime.params.page}
                      onPageChange={runtime.onChangePage}
                      setParams={runtime.setParams}
                      params={runtime.params}
                      totalPages={Math.ceil(
                        (runtime.mod.onSearch
                          ? (filteredData?.length ?? 0)
                          : (runtime.data?.message?.total ?? 1)) /
                          (runtime.params.perPage ?? 1),
                      )}
                      previousLabel=""
                      nextLabel=""
                      total={
                        runtime.mod.onSearch
                          ? (filteredData?.length ?? 0)
                          : (runtime.data?.message?.total ?? 0)
                      }
                    />
                  </div>
                )}
              </section>
              {props.renderRight ? (
                <aside className={styles.contentSide}>
                  {props.renderRight()}
                </aside>
              ) : null}
            </div>
          )}
          {runtime.openView && (
            <>
              {runtime.mod.renderView ? (
                <CrudRendererHost
                  renderer={runtime.mod.renderView}
                  rendererProps={{
                    open: runtime.openView,
                    onClose: runtime.onCloseView,
                    item: runtime.formState,
                    onConfirm: runtime.onSave,
                    extraData: runtime.extraData,
                    execute: runtime.execute,
                    onEdit: runtime.onEdit,
                    onAdd: runtime.onAdd,
                    openList: runtime.openList,
                    setOpenList: runtime.setOpenList,
                    reLoad: runtime.reLoad,
                    showToast: runtime.showToast,
                    setItem: runtime.setFormState,
                    onDel: (itemToDelete: any) => {
                      runtime.onCloseView();
                      runtime.onDel(itemToDelete || runtime.formState);
                    },
                  }}
                />
              ) : (
                <CurrentDetail
                  open={runtime.openView}
                  onClose={runtime.onCloseView}
                  item={runtime.formState}
                  onConfirm={runtime.onSave}
                />
              )}
            </>
          )}
          {runtime.open && (
            <>
              {runtime.mod.renderForm ? (
                <CrudRendererHost
                  renderer={runtime.mod.renderForm}
                  rendererProps={{
                    open: runtime.open,
                    openView: runtime.openView,
                    onClose: runtime.onCloseCrud,
                    item: runtime.formState,
                    setItem: runtime.setFormState,
                    onSave: runtime.onSave,
                    extraData: runtime.extraData,
                    execute: runtime.execute,
                    errors: runtime.errors,
                    setErrors: runtime.setErrors,
                    reLoad: runtime.reLoad,
                    user: runtime.user,
                    onEdit: runtime.onEdit,
                    onDel: runtime.onDel,
                    onAdd: runtime.onAdd,
                    onView: runtime.onView,
                    action: runtime.action,
                    openList: runtime.openList,
                    setOpenList: runtime.setOpenList,
                    showToast: runtime.showToast,
                    getItemApi: runtime.getItemApi,
                  }}
                />
              ) : (
                <CurrentForm
                  open={runtime.open}
                  onClose={runtime.onCloseCrud}
                  item={runtime.formState}
                  onConfirm={runtime.onSave}
                />
              )}
            </>
          )}
          {runtime.openImport && (
            <ImportDataModal
              open={runtime.openImport}
              onClose={() => {
                if (runtime.mod.onCloseImport) runtime.mod.onCloseImport();
                runtime.setOpenImport(false);
              }}
              mod={runtime.mod}
              showToast={runtime.showToast}
              reLoad={runtime.reLoad}
              execute={runtime.execute}
              extraData={runtime.extraData}
              requiredCols={runtime.mod.importRequiredCols || null}
              client_id={runtime.store?.client?.id}
            />
          )}
          {runtime.openDel && (
            <>
              {runtime.mod.renderDel ? (
                <CrudRendererHost
                  renderer={runtime.mod.renderDel}
                  rendererProps={{
                    open: runtime.openDel,
                    onClose: runtime.onCloseDel,
                    item: runtime.formState,
                    setItem: runtime.setFormState,
                    onSave: runtime.onSave,
                    extraData: runtime.extraData,
                    execute: runtime.execute,
                    errors: runtime.errors,
                    setErrors: runtime.setErrors,
                    reLoad: runtime.reLoad,
                    user: runtime.user,
                    onEdit: runtime.onEdit,
                    onDel: runtime.onDel,
                    onAdd: runtime.onAdd,
                    openList: runtime.openList,
                    setOpenList: runtime.setOpenList,
                  }}
                />
              ) : (
                <CurrentFormDelete
                  open={runtime.openDel}
                  onClose={runtime.onCloseDel}
                  item={runtime.formState}
                  onConfirm={runtime.onSave}
                  message={runtime.mod.messageDel}
                />
              )}
            </>
          )}
        </div>
      );
    };
    listComponentRef.current.displayName = "List";
  }
  const List = listComponentRef.current;
  return {
    user,
    showToast,
    onAdd,
    onDel,
    onEdit,
    onView,
    onImport,
    onExist,
    onExportItem,
    onExport,
    onCloseCrud,
    onCloseView,
    onCloseDel,
    onSave,
    onSearch,
    onFilter,
    onChangePage,
    onChangePerPage,
    getTotalPages,
    onChange,
    openList,
    setOpenList,
    openImport,
    setOpenImport,
    open,
    setOpen,
    openView,
    setOpenView,
    openDel,
    setOpenDel,
    formState,
    setFormState,
    errors,
    setErrors,
    params,
    setParams,
    searchs,
    setSearchs,
    data: resolvedData,
    loaded,
    setAction,
    reLoad: reloadCrudList,
    execute,
    userCan,
    store,
    setStore,
    List,
    extraData,
    findOptions,
    getExtraData,
    openCard,
    listTotal,
    listHasMore,
    isAppendingList,
    isResetListLoading,
    infiniteBatchSize,
    infinitePrefetchRows,
    onLoadMore: loadMoreRows,
    sortCol,
    onSort,
  };
};

export default useCrud;
