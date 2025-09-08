"use client";
import useCrud, { ModCrudType } from "@/mk/hooks/useCrud/useCrud";
import NotAccess from "@/components/auth/NotAccess/NotAccess";
import styles from "./Contents.module.css";
import useCrudUtils from "../shared/useCrudUtils";
import { useEffect, useMemo, useState } from "react";
import { getFullName, getUrlImages } from "@/mk/utils/string";
import {
  IconComment,
  IconDocs,
  IconDownload,
  IconLike,
  IconPublicacion,
} from "@/components/layout/icons/IconsBiblioteca";
import DataModal from "@/mk/components/ui/DataModal/DataModal";
import Check from "@/mk/components/forms/Check/Check";
import RenderView from "./RenderView/RenderView";
import { getDateTimeStrMesShort } from "@/mk/utils/date";
import { formatNumber } from "@/mk/utils/numbers";
import DataSearch from "@/mk/components/forms/DataSearch/DataSearch";
import { useAuth } from "@/mk/contexts/AuthProvider";
import AddContent from "./AddContent/AddContent";
import { Avatar } from "@/mk/components/ui/Avatar/Avatar";
import { WidgetDashCard } from "@/components/Widgets/WidgetsDashboard/WidgetDashCard/WidgetDashCard";
import DateRangeFilterModal from "@/components/DateRangeFilterModal/DateRangeFilterModal";
import CommentsModal from "@/components/CommentsModal/CommentsModal";

const paramsInitial = {
  perPage: 20,
  page: 1,
  fullType: "L",
  searchBy: "",
};

const isType = (data: {
  key: string;
  user?: Record<string, any>;
  item: Record<string, any>;
}) => {
  if (data.key == "url" && data.item.type == "V") return false;
  if (data.key == "avatar" && data.item.type == "I") return false;
  if (data.key == "file" && data.item.type == "D") return false;
  return true;
};

const lType = [
  { id: "I", name: "Imagen", ext: "png,jpg,jpeg,svg" },
  { id: "V", name: "Video", ext: "mp4" },
  { id: "D", name: "Documento", ext: "pdf,doc,docx" },
];

const rigthFile = (data: {
  key: string;
  user?: Record<string, any>;
  item: Record<string, any>;
}) => {
  if (!data.item.url) return null;
  return (
    <IconDownload
      size={40}
      color={"white"}
      onClick={() => {
        window.open(
          getUrlImages(
            "/CONT-" +
              data.item.id +
              "." +
              data.item.url +
              "?" +
              data.item.updated_at
          ),
          "_blank"
        );
      }}
    />
  );
};

const getTypefilter = () => [
  { id: 'ALL', name: 'Todos' },
  { id: 'D', name: 'Documento' },
  { id: 'V', name: 'Video' },
  { id: 'I', name: 'Imagen' },
];

const getTypeContentsfilter = () => [
  { id: 'ALL', name: 'Todos' },
  { id: 'P', name: 'Publicación' },
  { id: 'N', name: 'Noticia' },
];

const getPeriodOptions = () => [
  { id: 'ALL', name: 'Todos' },
  { id: 'd', name: 'Hoy' },
  { id: 'ld', name: 'Ayer' },
  { id: 'w', name: 'Esta semana' },
  { id: 'lw', name: 'Semana anterior' },
  { id: 'm', name: 'Este mes' },
  { id: 'lm', name: 'Mes anterior' },
  { id: 'y', name: 'Este año' },
  { id: 'ly', name: 'Año anterior' },
  { id: 'custom', name: 'Personalizado' },
];

const Contents = () => {
  const [openCustomFilter, setOpenCustomFilter] = useState(false);
  const [customDateErrors, setCustomDateErrors] = useState<{
    startDate?: string;
    endDate?: string;
  }>({});
  const [isCommentModalOpen, setIsCommentModalOpen] = useState(false);
  const [selectedContentIdForComments, setSelectedContentIdForComments] = useState<number | null>(null);
  const [selectedContentData, setSelectedContentData] = useState<any>(null);

  const { user, showToast } = useAuth();

  const handleGetFilter = (opt: string, value: string, oldFilterState: any) => {
    const currentFilters = { ...(oldFilterState?.filterBy || {}) };

    if (opt === "created_at" && value === "custom") {
      setCustomDateErrors({});
      setOpenCustomFilter(true);
      delete currentFilters[opt];
      return { filterBy: currentFilters };
    }

    if (value === "" || value === null || value === undefined) {
      delete currentFilters[opt];
    } else {
      currentFilters[opt] = value;
    }
    return { filterBy: currentFilters };
  };

  const handleOpenComments = (contentId: number, contentData: any) => {
    setSelectedContentIdForComments(contentId);
    setSelectedContentData(contentData);
    setIsCommentModalOpen(true);
  };

  const handleCloseComments = () => {
    setIsCommentModalOpen(false);
    setSelectedContentIdForComments(null);
    setSelectedContentData(null);
    handleCommentAdded();
  };

  const handleCommentAdded = () => {
    if (selectedContentData) {
      const updatedData = {
        ...selectedContentData,
        comments: [...(selectedContentData.comments || []), {}],
      };
      setSelectedContentData(updatedData);
    }
    reLoad();
  };

  const mod: ModCrudType = {
    modulo: "contents",
    singular: "publicación",
    plural: "",
    permiso: "contents",
    titleAdd: "Nueva",
    export: false,
    extraData: true,
    filter: true,
    saveMsg: {
      add: "Publicación creada con éxito",
      edit: "Publicación actualizada con éxito",
      del: "Publicación eliminada con éxito",
    },
    hideActions: {
      add: false,
      edit: true,
      del: true,
    },
    renderView: (props: {
      open: boolean;
      onClose: any;
      item: Record<string, any>;
      onConfirm?: Function;
      extraData: any;
      onDel?: (item: any) => void;
    }) => (
      <RenderView
        {...props}
        onEdit={(item: any) => onEdit(item)}
        onDelete={props.onDel}
        onOpenComments={handleOpenComments}
        selectedContentData={selectedContentData}
      />
    ),
    loadView: { fullType: "DET" },
    renderForm: (props: {
      item: any;
      setItem: any;
      errors: any;
      extraData: any;
      open: boolean;
      onClose: any;
      user: any;
      execute: any;
      setErrors: any;
      action: any;
      openList: any;
      setOpenList: any;
    }) => (
      <AddContent
        onClose={props.onClose}
        open={props.open}
        item={props.item}
        setItem={props.setItem}
        errors={props.errors}
        extraData={props.extraData}
        user={props.user}
        execute={props.execute}
        setErrors={props.setErrors}
        reLoad={reLoad}
        action={props.action}
        openList={props.openList}
        setOpenList={props.setOpenList}
      />
    ),
  };

  const { setStore, store } = useAuth();
  useEffect(() => {
    setStore({ ...store, title: '' });
  }, []);

  const fields = useMemo(
    () => ({
      id: { rules: [], api: 'e' },
      created_at: {
        rules: [],
        api: 'e',
        label: 'Fecha',
        list: {
          width: '220px',
          onRender: (props: any) => getDateTimeStrMesShort(props?.item?.created_at),
          form: false,
        },
        filter: {
          key: 'created_at',
          label: 'Periodo',
          options: getPeriodOptions,
        },
      },
      user: {
        rules: [],
        api: 'ae',
        label: 'Creador',
        list: {
          width: '200px',
          onRender: (item: any) => {
            const user = item?.item.user;
            const nombreCompleto = getFullName(user);
            const cedulaIdentidad = user?.ci;

            return (
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <Avatar
                  hasImage={1}
                  src={getUrlImages('/ADM-' + user?.id + '.webp?d=' + user?.updated_at)}
                  name={nombreCompleto}
                />
                <div>
                  <p style={{ marginBottom: '2px', fontWeight: 500, color: 'var(--cWhite)' }}>
                    {nombreCompleto}
                  </p>
                  {cedulaIdentidad && (
                    <span
                      style={{
                        fontSize: '11px',
                        color: 'var(--cWhiteV1)',
                        display: 'block',
                        marginBottom: '4px',
                      }}
                    >
                      CI: {cedulaIdentidad}
                    </span>
                  )}
                </div>
              </div>
            );
          },
        },
      },
      type: {
        rules: ['required'],
        api: 'ae',
        label: 'Tipo',
        list: {
          width: '180px',
        },
        form: {
          type: 'select',
          options: lType,
        },
        filter: {
          label: 'Tipo de contenido',
          width: '180px',
          options: getTypefilter,
        },
      },
      title: {
        rules: [''],
        api: 'ae',
        label: 'Titulo',
        list: false,
        form: { type: 'text' },
      },
      description: {
        rules: ['required'],
        api: 'ae',
        label: 'Contenido',
        list: {
          onRender: (item: any) => {
            const title = item?.item?.title;
            const description = item?.item?.description;

            return (
              <div className={styles.contentContainer}>
                {title && <div className={styles.contentTitle}>{title}</div>}
                {description && <div className={styles.contentDescription}>{description}</div>}
              </div>
            );
          },
        },
        form: { type: 'textArea', lines: 6, isLimit: true, maxLength: 5000 },
      },
      reaction: {
        api: 'ae',
        label: 'Interacciones',
        list: { width: '150px' },
        onHide: isType,
        form: {},
        onRender: (item: any) => (
          <div style={{ display: 'flex', alignItems: 'center', fontSize: 14 }}>
            <IconLike color={'var(--cAccent)'} size={24} />
            {formatNumber(item?.item?.likes, 0)} <IconComment size={24} />
            {formatNumber(item?.item?.comments_count, 0)}
          </div>
        ),
      },
      url: {
        rules: ['requiredIf:type,V'],
        api: 'a*e*',
        label: 'Link del video',
        list: false,
        onHide: isType,
        form: { type: 'text' },
      },
      avatar: {
        api: 'a*e*',
        label: 'Suba una imagen',
        list: false,
        onHide: isType,
        form: {
          type: 'imageUploadMultiple',
          prefix: 'CONT',
          maxFiles: 10,
          images: 'images',
          style: { width: '100%' },
        },
      },
      file: {
        rules: ['requiredFileIf:type,D'],
        api: 'a*e*',
        label: 'Suba un Documento',
        list: false,
        onHide: isType,
        form: {
          type: 'fileUpload',
          onRigth: rigthFile,
          style: { width: '100%' },
        },
      },
      content: {
        api: 'ae',
        label: 'Contenido',
        list: false,
        form: false,
        filter: {
          key: 'content',
          label: 'Tipo de publicación',
          options: getTypeContentsfilter,
        },
      },
    }),
    []
  );

  const _onChange = (
    e: any,
    item: any,
    setItem: Function,
    setShowExtraModal: Function,
    action: any
  ) => {
    const { name, value } = e.target;
    let selDestinies: any = [];
    if (name.indexOf("destiny_") == 0) {
      const id = parseInt(name.replace("destiny_", ""));
      if (value) {
        setItem({ ...item, lDestiny: [...item.lDestiny, id] });
      } else {
        setItem({ ...item, lDestiny: item.lDestiny.filter((d: number) => d != id) });
      }
      return true;
    }
    let lDestiny = item.lDestiny || [];
    if (action == "edit") {
      item?.cdestinies?.map((d: any) => {
        if (item?.destiny == 2) lDestiny.push(d.lista_id);
        if (item?.destiny == 3) lDestiny.push(d.dpto_id);
        if (item?.destiny == 4) lDestiny.push(d.mun_id);
        if (item?.destiny == 5) lDestiny.push(d.barrio_id);
      });
    }
    if (name == "destiny") {
      selDestinies = null;
      if (value == 2) selDestinies = extraData.listas;
      if (value == 3) selDestinies = extraData.dptos;
      if (value == 4) selDestinies = extraData.muns;

      if (value != item.destiny) {
        setItem({ ...item, lDestiny: [] });
        lDestiny = [];
      }

      if (selDestinies)
        setShowExtraModal(
          <ModalDestiny
            item={{ ...item, destiny: value, lDestiny: lDestiny }}
            setItem={setItem}
            selDestinies={selDestinies}
            setShowExtraModal={setShowExtraModal}
          />
        );
      else setShowExtraModal(null);
    }
    return false;
  };

  const ModalDestiny = ({ item, setItem, selDestinies, setShowExtraModal }: {
    item: any;
    setItem: Function;
    selDestinies: any;
    setShowExtraModal: Function;
  }) => {
    const [openDestiny, setOpenDestiny] = useState(true);
    const [sel, setSel]: any = useState([]);
    const [destiniesFiltered, setDestiniesFiltered]: any = useState([]);
    const [search, setSearch] = useState("");

    useEffect(() => {
      setSel(item?.lDestiny || []);
    }, [item]);

    const setOnSearch = (e: any) => setSearch(e);

    const normalizeText = (text: string) =>
      text.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toUpperCase();

    useEffect(() => {
      if (search == "") {
        setDestiniesFiltered(selDestinies);
        return;
      }
      const filtered = selDestinies.filter((d: any) =>
        normalizeText(d.name).includes(normalizeText(search))
      );
      setDestiniesFiltered(filtered);
    }, [search, selDestinies]);

    const _onSave = () => {
      if (sel <= 0) {
        showToast("Debe seleccionar al menos un destino", "error");
        return;
      }
      setItem((old: any) => ({ ...old, lDestiny: sel }));
      setShowExtraModal(null);
      setOpenDestiny(false);
    };

    const _onClose = () => {
      if (item?.destiny && item?.lDestiny?.length <= 0) {
        setItem((old: any) => ({ ...old, destiny: null }));
      }
      setOpenDestiny(false);
      setShowExtraModal(null);
    };

    return (
      <DataModal title="Destino" open={openDestiny} onClose={_onClose} onSave={_onSave}>
        <DataSearch name="searchDestiny" setSearch={setOnSearch} value={search} />
        {destiniesFiltered.map((d: any, i: number) => (
          <Check
            key={"check" + i}
            name={"destiny_" + d.id}
            label={d.name}
            checked={sel.includes(d.id)}
            reverse
            onChange={(e: any) => {
              const { name, checked } = e.target;
              const id: any = parseInt(name.replace("destiny_", ""));
              const il: any = sel?.filter((d: number) => d != id) || [];
              if (checked) il.push(d.id);
              setSel(il);
            }}
            value={d.id}
            optionValue={[d.id, "N"]}
          />
        ))}
      </DataModal>
    );
  };

  const {
    userCan,
    List,
    setStore: crudSetStore,
    onSearch,
    searchs,
    onEdit,
    onDel,
    extraData,
    reLoad,
    data,
    onFilter,
    openList,
  } = useCrud({
    paramsInitial,
    mod,
    fields,
    _onChange,
    getFilter: handleGetFilter,
  });

  const { onLongPress, selItem, searchState, setSearchState } = useCrudUtils({
    onSearch,
    searchs,
    setStore: crudSetStore,
    mod,
    onEdit,
    onDel,
    title: '',
  });

  if (!userCan(mod.permiso, "R")) return <NotAccess />;

  return (
    <div className={styles.roles}>
      {openList && <h1 className={styles.title}>Publicaciones</h1>}
      {openList && (
        <WidgetDashCard
          title="Publicaciones"
          data={data?.message?.total || 0}
          icon={
            <IconDocs
              color={'var(--cWhite)'}
              style={{ backgroundColor: 'rgba(255, 255, 255, 0.1)' }}
              circle
              size={18}
            />
          }
          style={{ minWidth: '160px', maxWidth: '268px', marginBottom: "16px" }}
        />
      )}
      <List
        actionsWidth="140px"
        height={'calc(100vh - 440px)'}
        emptyMsg="Lista de publicaciones vacía. Una vez empieces a publicar"
        emptyLine2="noticias las verás aquí."
        emptyIcon={<IconPublicacion size={80} color="var(--cWhiteV1)" />}
        filterBreakPoint={1530}
      />
      <DateRangeFilterModal
        open={openCustomFilter}
        onClose={() => {
          setOpenCustomFilter(false);
          setCustomDateErrors({});
        }}
        onSave={({ startDate, endDate }) => {
          let err: { startDate?: string; endDate?: string } = {};
          if (!startDate) err.startDate = "La fecha de inicio es obligatoria";
          if (!endDate) err.endDate = "La fecha de fin es obligatoria";
          if (startDate && endDate && startDate > endDate)
            err.startDate = "La fecha de inicio no puede ser mayor a la de fin";
          if (startDate && endDate && startDate.slice(0, 4) !== endDate.slice(0, 4)) {
            err.startDate = "El periodo personalizado debe estar dentro del mismo año";
            err.endDate = "El periodo personalizado debe estar dentro del mismo año";
          }
          if (Object.keys(err).length > 0) {
            setCustomDateErrors(err);
            return;
          }
          const customDateFilterString = `${startDate},${endDate}`;
          onFilter("created_at", customDateFilterString);
          setOpenCustomFilter(false);
          setCustomDateErrors({});
        }}
        errorStart={customDateErrors.startDate}
        errorEnd={customDateErrors.endDate}
      />
      <CommentsModal
        isOpen={isCommentModalOpen}
        onClose={handleCloseComments}
        contentId={selectedContentIdForComments}
        onCommentAdded={() => reLoad()}
      />
    </div>
  );
};

export default Contents;
