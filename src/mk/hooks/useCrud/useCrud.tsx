/* eslint-disable react-hooks/exhaustive-deps */
"use client";
import { useState, useEffect, Fragment, memo, useCallback } from "react";
import useAxios from "../useAxios";
import { getUrlImages } from "../../utils/string";
import { useAuth } from "../../contexts/AuthProvider";
import {
  ActionType,
  checkRulesFields,
  getParamFields,
  hasErrors,
} from "../../utils/validate/Rules";
import { logError } from "../../utils/logs";
import LoadingScreen from "../../components/ui/LoadingScreen/LoadingScreen";
import Table, { RenderColType } from "../../components/ui/Table/Table";
import DataModal from "../../components/ui/DataModal/DataModal";
import Button from "../../components/forms/Button/Button";
import Select from "../../components/forms/Select/Select";
import useScreenSize from "../useScreenSize";
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
} from "@/components/layout/icons/IconsBiblioteca";
import DataSearch from "@/mk/components/forms/DataSearch/DataSearch";
import FormElement from "./FormElement";
import Pagination from "@/mk/components/ui/Pagination/Pagination";
import ImportDataModal from "@/mk/components/data/ImportDataModal/ImportDataModal";

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
};

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
  const [openList, setOpenList] = useState(true);
  const [open, setOpen] = useState(false);
  const [openView, setOpenView] = useState(false);
  const [openDel, setOpenDel] = useState(false);

  const [params, setParams] = useState(paramsInitial);
  const [searchs, setSearchs]: any = useState({});
  const [action, setAction] = useState<ActionType>("add");
  const [openCard, setOpenCard] = useState(false);

  const { data, reLoad, execute, loaded } = useAxios(
    "/" + mod.modulo,
    "GET",
    params,
    mod?.noWaiting
  );

  const { isMobile } = useScreenSize();

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
    action: ActionType = "add"
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
      return showToast("No tiene permisos para crear", "error");
    initOpen(setOpen);
  }, []);

  const onDel = useCallback((item: Record<string, any>) => {
    if (!userCan(mod.permiso, "D"))
      return showToast("No tiene permisos para eliminar", "error");
    initOpen(setOpenDel, item, "del");
  }, []);

  const onEdit = useCallback((item: Record<string, any>) => {
    if (!userCan(mod.permiso, "U"))
      return showToast("No tiene permisos para editar", "error");
    initOpen(setOpen, item, "edit");
  }, []);

  const onView = useCallback(async (item: Record<string, any>) => {
    if (!userCan(mod.permiso, "R"))
      return showToast("No tiene permisos para visualizar", "error");
    if (mod.loadView) {
      let searchBy = item.id;
      if (mod.loadView.key_id) {
        searchBy = item[mod.loadView.key_id];
        // delete mod.loadView.key_id;
      }

      const { data: view } = await execute(
        "/" + mod.modulo,
        "GET",
        {
          page: 1,
          perPage: 1,
          fullType: "DET",
          searchBy: searchBy,
          ...mod.loadView,
        },
        false,
        mod?.noWaiting
      );
      // const { data: d, ...rest } = view?.data ?? {};
      // initOpen(setOpenView, { ...d, ...rest }, "view");
      initOpen(setOpenView, view?.data, "view");
      return;
    }
    initOpen(setOpenView, item, "view");
  }, []);

  const onImport = useCallback((e: any) => {
    // e.stopPropagation();
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
        mod?.noWaiting
      );
      return row?.success ? row.data : false;
    },
    []
  );

  const onCloseCrud = () => {
    if (!openList) setOpenList(true);
    setOpen(false);
  };
  const onCloseView = () => {
    if (!openList) setOpenList(true);
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

    const param = getParamFields(data, fields, action);

    const { data: response, error: err } = await execute(
      url,
      method,
      action == "del" ? { id: data.id } : param,
      false,
      mod?.noWaiting
    );
    if (response?.success) {
      onCloseCrud();
      setOpenDel(false);
      reLoad(null, mod?.noWaiting);
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
    setParams({ ...params, ...searchBy });
    setOldSearch(searchBy);
  };
  const [oldFilter, setOldFilter]: any = useState({});
  const onFilter = (opt: string, value: string) => {
    let filterBy = { filterBy: { ...oldFilter.filterBy, [opt]: value } };
    if (getFilter) filterBy = getFilter(opt, value, oldFilter);
    //iterar filterBy para quitar los vacios
    let fil: any = [];
    for (const key in filterBy.filterBy) {
      if (filterBy.filterBy[key]) fil.push(key + ":" + filterBy.filterBy[key]);
    }
    fil = fil.join("|");
    //setParams({ ...params, ...(fil ? { filterBy: fil } : {}) });
    setParams({ ...params, ...(fil ? { filterBy: fil, page: 1 } : {}) });
    setOldFilter(filterBy);
  };

  const onChangePage = (page: number) => {
    setParams({ ...params, page });
  };

  const onChangePerPage = (e: any) => {
    let perPage = e.target.value;
    if (params.perPage == perPage) return;
    if (!perPage) perPage = -1;
    setParams({ ...params, perPage });
  };

  const getTotalPages = () => {
    let total = 0;
    total = Math.ceil((data?.total || 1) / (params?.perPage || 1));
    return total;
  };

  const onCloseDel = () => {
    if (!openList) setOpenList(true);
    setOpenDel(false);
  };

  type ExportType = "pdf" | "xls" | "csv";

  const onExport = async (
    type?: string, // Cambiar el tipo a string opcional
    callBack: (url: string) => void = (url: string) => {}
  ) => {
    if (!userCan(mod.permiso, "R"))
      return showToast("No tiene permisos para visualizar", "error");
    const { data: file } = await execute(
      "/" + mod.modulo,
      "GET",
      {
        ...params,
        fullType: "L", // Agregar fullType: "L"
        _export: type ?? "pdf", // Usar ?? para valor por defecto
        exportCols: mod?.exportCols || params.cols || "",
        exportTitulo: mod?.exportTitulo || "Listado de " + mod.plural,
        exportTitulos: mod?.exportTitulos || "",
        exportAnchos: mod?.exportAnchos || "",
      },
      false,
      mod?.noWaiting
    );
    if (file?.success) {
      window.open(getUrlImages("/" + file.data.path)); // Abrir directamente en lugar de usar callback
      callBack(getUrlImages("/" + file.data.path)); // Mantener callback por compatibilidad
    } else {
      showToast("Hubo un error al exportar el archivo", "error");
      showToast("Hubo un error al exportar el archivo", "error");
      logError("Error onExport:", file);
    }
  };
  const onExportItem = (
    item: Record<string, any>,
    type: ExportType = "pdf"
  ) => {
    if (!userCan(mod.permiso, "R"))
      return showToast("No tiene permisos para visualizar", "error");
    initOpen(setOpenView, item, "export");
  };

  useEffect(() => {
    reLoad(params, mod?.noWaiting, true);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [params]);

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
      mod?.noWaiting
    );
    setExtraData(extraData?.data);
  };
  useEffect(() => {
    if (mod.extraData) {
      getExtraData();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

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
      <DataModal
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
      </DataModal>
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
                setFormStateForm
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
    }, [item]);

    const onChangeForm = useCallback(
      (e: any) => {
        if (!e.target) {
          setFormStateForm((old: any) => ({ ...old, ...e }));
          return;
        }
        let value = e.target.value;

        if (_onChange) {
          if (
            _onChange(
              e,
              formStateForm,
              setFormStateForm,
              setShowExtraModal,
              action
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
        setFormStateForm((old: any) => ({ ...old, [e.target.name]: value }));
      },
      [formStateForm]
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
      [formStateForm]
    );

    return (
      <DataModal
        open={open}
        onClose={() => onClose()}
        title={(action == "add" ? "Crear " : "Editar ") + mod.singular}
        buttonText={action == "add" ? "Crear " + mod.singular : "Actualizar"}
        buttonCancel=""
        onSave={(e) =>
          onConfirm
            ? onConfirm(formStateForm, setErrorForm)
            : onSave(formStateForm, setErrorForm)
        }
      >
        <div
          style={{
            display: "flex",
            width: "100%",
            flexWrap: "wrap",
            gap: 8,
            justifyContent: "space-between",
          }}
        >
          {header.map((field: any, index: number) => (
            <Fragment key={field.key + index}>
              {field.items && (
                <div
                  className={field.openTag?.className}
                  style={{
                    display: "block",
                    justifyContent: "space-around",
                    flexWrap: "wrap",
                    gap: "var(--spS)",
                    width: "100%",
                    ...(field.openTag?.border
                      ? {
                          border: "1px solid var(--cWhiteV1)",
                          borderRadius: "var(--bRadiusS)",
                          padding: "var(--spM)",
                        }
                      : {}),
                    ...field.openTag?.style,
                  }}
                >
                  {/* {JSON.stringify(field.openTag)} */}
                  {field.openTag?.onTop && (
                    <div
                      style={{
                        width: "100%",
                        flex: "100%",
                        marginBottom: "var(--spS)",
                      }}
                    >
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
                          style: { ...field.style, flex: "1" },
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
              )}
            </Fragment>
          ))}
        </div>
        {showExtraModal}
      </DataModal>
    );
  });
  Form.displayName = "Form";
  const [filterSel, setFilterSel]: any = useState({});
  const AddMenu = memo(
    ({
      filters,
      onClick,
      extraButtons,
    }: {
      filters?: any;
      onClick?: (e?: any) => void;
      extraButtons?: React.ReactNode[];
    }) => {
      if (isMobile) return <FloatButton onClick={onClick || onAdd} />;

      const onChange = (e: any) => {
        setFilterSel({ ...filterSel, [e.target.name]: e.target.value });
        onFilter(e.target.name, e.target.value);
      };

      return (
        <nav>
          {mod.search && mod.search.hide ? null : (
            <div>
              {
                <DataSearch
                  value={searchs.searchBy || ""}
                  name={mod.modulo + "Search"}
                  setSearch={onSearch || setSearchs}
                />
              }
            </div>
          )}
          {menuFilter || null}
          {mod.filter && (
            <>
              {filters.map((f: any, i: number) => (
                <Select
                  key={f.key + i}
                  label={f.label}
                  name={f.key}
                  onChange={onChange}
                  options={f.options || []}
                  value={filterSel[f.key] || ""}
                  style={{ width: f.width }}
                />
              ))}
            </>
          )}
          {mod.import && (
            <div
              style={{ marginTop: "12px", cursor: "pointer" }}
              onClick={onImport}
            >
              <IconImport />
            </div>
          )}
          {mod.export && (
            <div style={{ marginTop: "12px", cursor: "pointer" }}>
              <IconExport onClick={() => onExport("pdf")} />
            </div>
          )}
          {mod.listAndCard && (
            <div className={styles.listAndCard}>
              <div
                className={!openCard ? styles.active : ""}
                onClick={() => setOpenCard(false)}
              >
                <IconMenu />
              </div>
              <div
                className={openCard ? styles.active : ""}
                onClick={() => setOpenCard(true)}
              >
                <IconGrilla />
              </div>
            </div>
          )}

          {/* Renderizar los botones extras */}
          {extraButtons && extraButtons.length > 0 && (
            <div className={styles.extraButtons}>
              {extraButtons.map((button, index) => (
                <div key={`extra-button-${index}`}>{button}</div>
              ))}
            </div>
          )}

          {mod.hideActions?.add ? null : (
            <div>
              <Button
                className={styles.addButton}
                onClick={onClick || onAdd}
                style={{ height: 48 }} // Asegurar la altura con estilo inline
                variant="primary" // Asegurar que estamos usando el estilo correcto
              >
                {"Crear " + mod.singular}
              </Button>
            </div>
          )}
        </nav>
      );
    }
  );
  AddMenu.displayName = "AddMenu";

  const FormDelete = memo(
    ({ open, onClose, item, onConfirm, message = "" }: PropsDetail) => {
      return (
        <DataModal
          id="Eliminar"
          title={"Eliminar " + mod.singular}
          buttonText="Eliminar"
          buttonCancel=""
          onSave={(e) => (onConfirm ? onConfirm(item) : onSave(item))}
          onClose={onClose}
          open={open}
        >
          {message ? (
            message
          ) : (
            <>
              ¿Estás seguro de eliminar esta información?
              <br />
              {/* <br />
              {item.name || item.description}
              <br /> */}
              Recuerda que al momento de eliminar ya no podrás recuperarla.
            </>
          )}
        </DataModal>
      );
    }
  );
  FormDelete.displayName = "FormDelete";

  const onButtonActions = (item: Record<string, any>) => {
    let hideEdit = mod.hideActions?.edit;
    let hideDel = mod.hideActions?.del;
    if (mod?.onHideActions) {
      const h = mod.onHideActions(item);
      hideEdit = h?.hideEdit;
      hideDel = h?.hideDel;
    }
    return (
      <nav className={styles.actions}>
        {hideEdit ? null : (
          <div>
            <IconEdit
              onClick={(e: MouseEvent) => {
                e.stopPropagation();
                onEdit(item);
              }}
              size={24}
            />
          </div>
        )}
        {hideDel ? null : (
          <div>
            <IconTrash
              onClick={(e: MouseEvent) => {
                e.stopPropagation();
                onDel(item);
              }}
              size={24}
            />
          </div>
        )}
      </nav>
    );
  };

  const findOptions = (
    value: any,
    options: Record<string, any>[],
    key: string = "id",
    label: string = "name"
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
            opt.optionLabel
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
            opt.optionLabel
          );
        };
    }
    return render;
  };

  const [sortCol, setSortCol] = useState({ col: "", asc: true });
  const onSort = (col: string, asc: boolean) => {
    const nAsc: boolean = sortCol.col === col ? !sortCol.asc : asc;
    setSortCol({ col, asc: nAsc });
    setParams({ ...params, sortBy: col, orderBy: nAsc ? "asc" : "desc" });
  };
  const List = memo((props: any) => {
    const getHeader = () => {
      const head: Object[] = [];
      const lFilter: Object[] = [];

      for (const key in fields) {
        const field = fields[key];
        if (field.filter) {
          const colF: any = {
            key,
            label: field.filter?.label || field.list?.label || field.label,
            width: field.filter?.width || field.list.width || "300px",
            order:
              field.filter?.order || field?.list?.order || field?.order || 1000,
            options: field.filter?.extraData
              ? extraData[field.filter?.extraData]
              : field.filter?.options(extraData) || field.form.options || [],
          };
          lFilter.push(colF);
          lFilter.sort((a: any, b: any) => a.order - b.order);
        }
        if (!field.list) continue;
        const col: any = {
          key,
          responsive: "",
          label: field.list.label || field.label,
          className: field.list.className || "",
          width: field.list.width,
          onRender: _onRender(field, true),
          order: field.list.order || field.order || 1000,
          style: field.list.style || field.style || {},
          sumarize: field.list.sumarize || field.sumarize || false,
          sortabled: field.list.sortabled || field.sortabled || false,
        };
        head.push(col);
      }
      head.sort((a: any, b: any) => a.order - b.order);
      setLfilter(lFilter);
      return head;
    };

    const [header, setHeader]: any = useState([]);
    const [lFilter, setLfilter]: any = useState([]);
    useEffect(() => {
      setHeader(getHeader());
      // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [fields]);
    return (
      <div className={styles.useCrud}>
        {openList && <AddMenu filters={lFilter} extraButtons={extraButtons} />}
        <LoadingScreen type="TableSkeleton">
          {openList && (
            <div
              style={{
                display: "flex",
                flexDirection: "row",
                gap: "var(--spM)",
              }}
            >
              <section
                style={{
                  display: "flex",
                  flexDirection: "column",
                  flexGrow: 1,
                }}
              >
                {data?.data?.length > 0 ? (
                  <Table
                    data={data?.data}
                    onRowClick={
                      mod.hideActions?.view ? props.onRowClick : onView
                    }
                    header={header}
                    onTabletRow={props.onTabletRow}
                    onRenderBody={props.onRenderBody}
                    onRenderFoot={props.onRenderFoot}
                    onRenderHead={props.onRenderHead}
                    onRenderCard={props.onRenderCard}
                    onButtonActions={
                      mod.hideActions?.edit && mod.hideActions?.del
                        ? undefined
                        : onButtonActions
                    }
                    className="striped"
                    actionsWidth={"170px"}
                    sumarize={props.sumarize}
                    extraData={extraData}
                    onSort={onSort}
                    sortCol={sortCol}
                  />
                ) : (
                  <section>
                    <IconTableEmpty size={180} color="var(--cBlackV2)" />
                    <p>No existen datos en este momento.</p>
                  </section>
                )}
                <div>
                  <Pagination
                    currentPage={params.page}
                    onPageChange={onChangePage}
                    setParams={setParams}
                    params={params}
                    totalPages={Math.ceil(
                      (data?.message?.total || 1) / (params.perPage || 1)
                    )}
                    previousLabel=""
                    nextLabel=""
                    total={data?.message?.total || 0}
                  />
                </div>
              </section>
              {props.renderRight ? props.renderRight() : null}
            </div>
          )}
          {openView && (
            <>
              {mod.renderView ? (
                mod.renderView({
                  open: openView,
                  onClose: onCloseView,
                  item: formState,
                  onConfirm: onSave,
                  extraData,
                  execute,
                  onEdit,
                  onDel,
                  onAdd,
                  openList,
                  setOpenList,
                })
              ) : (
                <Detail
                  open={openView}
                  onClose={onCloseView}
                  item={formState}
                  onConfirm={onSave}
                />
              )}
            </>
          )}
          {open && (
            <>
              {mod.renderForm ? (
                mod.renderForm({
                  open: open,
                  onClose: onCloseCrud,
                  item: formState,
                  setItem: setFormState,
                  onSave: onSave,
                  extraData,
                  execute,
                  errors,
                  setErrors,
                  reLoad,
                  user,
                  onEdit,
                  onDel,
                  onAdd,
                  action,
                  openList,
                  setOpenList,
                })
              ) : (
                <Form
                  open={open}
                  onClose={onCloseCrud}
                  item={formState}
                  onConfirm={onSave}
                />
              )}
            </>
          )}
          {openImport && (
            <ImportDataModal
              open={openImport}
              onClose={() => {
                if (mod.onCloseImport) mod.onCloseImport();
                setOpenImport(false);
              }}
              mod={mod}
              showToast={showToast}
              reLoad={reLoad}
              execute={execute}
              //getExtraData={getExtraData}
              extraData={extraData}
              requiredCols={mod.importRequiredCols || null}
              client_id={store?.client?.id}
            />
          )}
          {openDel && (
            <>
              {mod.renderDel ? (
                mod.renderDel({
                  open: openDel,
                  onClose: onCloseDel,
                  item: formState,
                  setItem: setFormState,
                  onSave: onSave,
                  extraData,
                  execute,
                  errors,
                  setErrors,
                  reLoad,
                  user,
                  onEdit,
                  onDel,
                  onAdd,
                  openList,
                  setOpenList,
                })
              ) : (
                <FormDelete
                  open={openDel}
                  onClose={onCloseDel}
                  item={formState}
                  onConfirm={onSave}
                  message={mod.messageDel}
                />
              )}
            </>
          )}
        </LoadingScreen>
      </div>
    );
  });
  List.displayName = "List";
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
    data,
    loaded,
    setAction,
    reLoad,
    execute,
    userCan,
    store,
    setStore,
    List,
    extraData,
    findOptions,
    getExtraData,
    openCard,
  };
};

export default useCrud;
