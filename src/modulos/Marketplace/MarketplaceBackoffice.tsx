"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  Check, Ellipsis, Eye, EyeOff, ImageIcon, Pencil, Plus,
  RefreshCw, ShieldBan, Star, Tags, Trash2, Users, X,
} from "lucide-react";
import NotAccess from "@/components/auth/NotAccess/NotAccess";
import EmptyData from "@/components/NoData/EmptyData";
import { StatusBadge } from "@/components/StatusBadge/StatusBadge";
import Button from "@/mk/components/forms/Button/Button";
import DataSearch from "@/mk/components/forms/DataSearch/DataSearch";
import Input from "@/mk/components/forms/Input/Input";
import Select from "@/mk/components/forms/Select/Select";
import TextArea from "@/mk/components/forms/TextArea/TextArea";
import DataModal from "@/mk/components/ui/DataModal/DataModal";
import Pagination from "@/mk/components/ui/Pagination/Pagination";
import Table from "@/mk/components/ui/Table/Table";
import TabsButtons from "@/mk/components/ui/TabsButton/TabsButtons";
import { useAuth } from "@/mk/contexts/AuthProvider";
import useAxios from "@/mk/hooks/useAxios";
import useSubmissionGuard from "@/mk/hooks/useSubmissionGuard";
import crudStyles from "@/mk/hooks/useCrud/useCrudStyle.module.css";
import { formatBs } from "@/mk/utils/numbers";
import styles from "./MarketplaceBackoffice.module.css";

const API_ROOT = "/backoffice/marketplace";
const PAGE_SIZE = 25;

const tabs = [
  { value: "listings", text: "Publicaciones" },
  { value: "categories", text: "Categorías" },
  { value: "residents", text: "Residentes" },
];
const statusOptions = [
  { id: "", name: "Todos los estados" },
  { id: "pending", name: "Pendiente" },
  { id: "approved", name: "Aprobado" },
  { id: "rejected", name: "Rechazado" },
  { id: "cancelled", name: "Anulado" },
  { id: "sold", name: "Vendido" },
];
const featuredOptions = [
  { id: "", name: "Todas" },
  { id: "1", name: "Destacadas" },
  { id: "0", name: "No destacadas" },
];
const categoryStatusOptions = [
  { id: "all", name: "Todas" },
  { id: "active", name: "Activas" },
  { id: "inactive", name: "Inactivas" },
];
const statusLabels: Record<string, string> = {
  pending: "Pendiente",
  approved: "Aprobado",
  rejected: "Rechazado",
  cancelled: "Anulado",
  sold: "Vendido",
};

type MarketplaceTab = "listings" | "categories" | "residents";
type ModerationAction = "reject" | "cancel" | "block";
type Category = { id: number; name: string; slug: string; is_active: boolean };
type Client = { id: string; name: string };
type Listing = {
  id: string;
  title: string;
  status: string;
  client_id: string;
  price: number;
  currency: string;
  category?: { id: number; name: string } | null;
  owner?: { id: string; name: string; phone?: string | null };
  visibility: string;
  is_featured: boolean;
  description?: string | null;
  images?: string[] | null;
  moderation_reason?: string | null;
};
type BlockedOwner = {
  owner_id: string;
  name?: string;
  middle_name?: string;
  last_name?: string;
  mother_last_name?: string;
  reason?: string | null;
  blocked_at?: string;
};
type ListingFilters = {
  client_id: string;
  status: string;
  category_id: string;
  featured: string;
  query: string;
};
type ListingPagination = {
  current_page: number;
  last_page: number;
  total: number;
};

const messageOf = (result: any, fallback: string) =>
  result?.error?.data?.message || result?.data?.message || fallback;
const statusLabel = (status: string) => statusLabels[status] || status;
const residentName = (owner: BlockedOwner) =>
  [owner.name, owner.middle_name, owner.last_name, owner.mother_last_name]
    .filter(Boolean)
    .join(" ") || owner.owner_id;
const formatDate = (value?: string) => {
  if (!value) return "—";
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return "—";
  return new Intl.DateTimeFormat("es-BO", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(parsed);
};

export default function MarketplaceBackoffice() {
  const { user, setStore } = useAuth();
  const { execute } = useAxios();
  const {
    begin: beginCategoryMutation,
    finish: finishCategoryMutation,
    submitting: categorySubmitting,
  } = useSubmissionGuard();
  const {
    begin: beginModeration,
    finish: finishModeration,
    submitting: moderationSubmitting,
  } = useSubmissionGuard();
  const isFos = Boolean(user?.fosrole_id);
  const latestListingRequest = useRef(0);
  const latestDetailRequest = useRef(0);
  const moreActionsRef = useRef<HTMLDivElement>(null);
  const moreActionsTriggerRef = useRef<HTMLButtonElement>(null);

  const [activeTab, setActiveTab] = useState<MarketplaceTab>("listings");
  const [listings, setListings] = useState<Listing[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [clients, setClients] = useState<Client[]>([]);
  const [blocks, setBlocks] = useState<BlockedOwner[]>([]);
  const [filters, setFilters] = useState<ListingFilters>({
    client_id: "",
    status: "",
    category_id: "",
    featured: "",
    query: "",
  });
  const [page, setPage] = useState(1);
  const [pagination, setPagination] = useState<ListingPagination>({
    current_page: 1,
    last_page: 1,
    total: 0,
  });
  const [categoryQuery, setCategoryQuery] = useState("");
  const [categoryStatus, setCategoryStatus] = useState("all");
  const [residentQuery, setResidentQuery] = useState("");
  const [selected, setSelected] = useState<Listing | null>(null);
  const [reason, setReason] = useState("");
  const [moderationAction, setModerationAction] = useState<ModerationAction | null>(null);
  const [detailLoading, setDetailLoading] = useState(false);
  const [detailReady, setDetailReady] = useState(false);
  const [detailError, setDetailError] = useState<string | null>(null);
  const [moreActionsOpen, setMoreActionsOpen] = useState(false);
  const [categoryEditor, setCategoryEditor] = useState<Category | "new" | null>(null);
  const [categoryName, setCategoryName] = useState("");
  const [categoryError, setCategoryError] = useState<string | null>(null);
  const [categoryToDelete, setCategoryToDelete] = useState<Category | null>(null);
  const [deleteError, setDeleteError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [referenceLoading, setReferenceLoading] = useState(true);
  const [notice, setNotice] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const clientOptions = useMemo(
    () => [{ id: "", name: "Todos los condominios" }, ...clients],
    [clients],
  );
  const categoryOptions = useMemo(
    () => [
      { id: "", name: "Todas las categorías" },
      ...categories.map(({ id, name }) => ({ id: String(id), name })),
    ],
    [categories],
  );
  const visibleCategories = useMemo(() => {
    const needle = categoryQuery.trim().toLocaleLowerCase("es");
    return categories.filter((category) => {
      if (categoryStatus === "active" && !category.is_active) return false;
      if (categoryStatus === "inactive" && category.is_active) return false;
      return !needle || category.name.toLocaleLowerCase("es").includes(needle);
    });
  }, [categories, categoryQuery, categoryStatus]);
  const visibleBlocks = useMemo(() => {
    const needle = residentQuery.trim().toLocaleLowerCase("es");
    return blocks.filter((block) =>
      !needle ||
      residentName(block).toLocaleLowerCase("es").includes(needle) ||
      String(block.reason || "").toLocaleLowerCase("es").includes(needle),
    );
  }, [blocks, residentQuery]);

  const loadListings = useCallback(async () => {
    if (!isFos) return;
    const requestId = ++latestListingRequest.current;
    setLoading(true);
    setError(null);
    const payload = {
      ...Object.fromEntries(
        Object.entries(filters).filter(([, value]) => value !== ""),
      ),
      page,
      per_page: PAGE_SIZE,
    };
    try {
      const result = await execute(API_ROOT + "/listings", "GET", payload, false, true);
      if (requestId !== latestListingRequest.current) return;
      if (result?.data?.success) {
        const data = result.data.data;
        setListings(data?.items || []);
        setPagination({
          current_page: Number(data?.pagination?.current_page) || page,
          last_page: Number(data?.pagination?.last_page) || 1,
          total: Number(data?.pagination?.total) || 0,
        });
      } else {
        setListings([]);
        setError(messageOf(result, "No se pudieron cargar las publicaciones."));
      }
    } catch {
      if (requestId === latestListingRequest.current) {
        setError("No se pudieron cargar las publicaciones.");
      }
    } finally {
      if (requestId === latestListingRequest.current) setLoading(false);
    }
    // execute changes per render in the legacy hook.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filters, isFos, page]);

  const loadReferences = useCallback(async () => {
    if (!isFos) return;
    setReferenceLoading(true);
    try {
      const [categoryResult, clientResult, blockResult] = await Promise.all([
        execute(API_ROOT + "/categories", "GET", {}, false, true),
        execute(API_ROOT + "/clients", "GET", {}, false, true),
        execute(API_ROOT + "/blocked-owners", "GET", {}, false, true),
      ]);
      if (categoryResult?.data?.success) setCategories(categoryResult.data.data || []);
      else setError(messageOf(categoryResult, "No se pudieron cargar las categorías."));
      if (clientResult?.data?.success) setClients(clientResult.data.data || []);
      else setError(messageOf(clientResult, "No se pudieron cargar los condominios."));
      if (blockResult?.data?.success) setBlocks(blockResult.data.data || []);
      else setError(messageOf(blockResult, "No se pudieron cargar los residentes bloqueados."));
    } catch {
      setError("No se pudieron actualizar los datos de Marketplace.");
    } finally {
      setReferenceLoading(false);
    }
    // execute changes per render in the legacy hook.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isFos]);

  useEffect(() => {
    setStore({ title: "Marketplace", right: null });
  }, [setStore]);
  useEffect(() => {
    void loadListings();
  }, [loadListings]);
  useEffect(() => {
    void loadReferences();
  }, [loadReferences]);
  useEffect(() => {
    if (!moreActionsOpen) return;
    const closeOnOutsideClick = (event: PointerEvent) => {
      if (!moreActionsRef.current?.contains(event.target as Node)) {
        setMoreActionsOpen(false);
      }
    };
    const closeOnEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setMoreActionsOpen(false);
        moreActionsTriggerRef.current?.focus();
      }
    };
    document.addEventListener("pointerdown", closeOnOutsideClick);
    document.addEventListener("keydown", closeOnEscape);
    return () => {
      document.removeEventListener("pointerdown", closeOnOutsideClick);
      document.removeEventListener("keydown", closeOnEscape);
    };
  }, [moreActionsOpen]);

  const changeListingFilter = (key: keyof ListingFilters, value: string) => {
    setPage(1);
    setFilters((current) => ({ ...current, [key]: value }));
  };
  const changeTab = (value: string) => {
    setActiveTab(value as MarketplaceTab);
    setError(null);
    setNotice(null);
  };
  const refresh = () => {
    setError(null);
    if (activeTab === "listings") void loadListings();
    else void loadReferences();
  };

  const openDetail = async (listing: Listing) => {
    const requestId = ++latestDetailRequest.current;
    setError(null);
    setReason("");
    setDetailError(null);
    setDetailReady(false);
    setDetailLoading(true);
    setModerationAction(null);
    setMoreActionsOpen(false);
    setSelected(listing);
    try {
      const result = await execute(
        API_ROOT + "/listings/" + listing.id, "GET", {}, false, true,
      );
      if (requestId !== latestDetailRequest.current) return;
      if (result?.data?.success) {
        setSelected(result.data.data);
        setDetailReady(true);
      } else {
        setDetailError(messageOf(result, "No se pudo cargar el detalle."));
      }
    } catch {
      if (requestId === latestDetailRequest.current) {
        setDetailError("No se pudo cargar el detalle.");
      }
    } finally {
      if (requestId === latestDetailRequest.current) setDetailLoading(false);
    }
  };
  const closeDetail = () => {
    if (moderationSubmitting) return;
    latestDetailRequest.current += 1;
    setSelected(null);
    setModerationAction(null);
    setMoreActionsOpen(false);
    setDetailError(null);
  };
  const openModeration = (next: ModerationAction) => {
    setReason("");
    setDetailError(null);
    setMoreActionsOpen(false);
    setModerationAction(next);
  };
  const performAction = async (kind: "approve" | "feature" | ModerationAction) => {
    if (!selected || !detailReady || !beginModeration()) return;
    setDetailError(null);
    const trimmedReason = reason.trim();
    try {
      const isBlock = kind === "block";
      if (isBlock && !selected.owner?.id) return;
      const path = isBlock
        ? API_ROOT + "/owners/" + selected.owner?.id + "/block"
        : API_ROOT + "/listings/" + selected.id + "/" + kind;
      const payload = kind === "feature"
        ? { is_featured: !selected.is_featured }
        : kind === "reject" ? { reason: trimmedReason }
          : kind === "cancel" || kind === "block" ? { reason: trimmedReason || null } : {};
      const result = await execute(path, "POST", payload);
      if (!result?.data?.success) {
        setDetailError(messageOf(result, "No se pudo completar la acción."));
        return;
      }
      setNotice(result.data.message || "Actualización guardada.");
      setModerationAction(null);
      setReason("");
      if (isBlock) {
        setSelected(null);
        setActiveTab("residents");
        void loadReferences();
      } else {
        setSelected(result.data.data);
        void loadListings();
      }
    } catch {
      setDetailError("No se pudo completar la acción. Inténtalo nuevamente.");
    } finally {
      finishModeration();
    }
  };

  const openCategoryEditor = (category: Category | "new") => {
    setCategoryName(category === "new" ? "" : category.name);
    setCategoryEditor(category);
    setCategoryError(null);
    setError(null);
  };
  const saveCategory = async () => {
    const name = categoryName.trim();
    if (name.length < 2) {
      setCategoryError("La categoría debe tener al menos 2 caracteres.");
      return;
    }
    if (!categoryEditor) return;
    if (!beginCategoryMutation()) return;
    const isNew = categoryEditor === "new";
    try {
      const result = await execute(
        isNew ? API_ROOT + "/categories" : API_ROOT + "/categories/" + categoryEditor.id,
        isNew ? "POST" : "PUT",
        isNew ? { name } : { name, is_active: categoryEditor.is_active },
      );
      if (!result?.data?.success) {
        setCategoryError(messageOf(result, "No se pudo guardar la categoría."));
        return;
      }
      setCategoryEditor(null);
      setCategoryName("");
      setCategoryError(null);
      setNotice(isNew ? "Categoría creada." : "Categoría actualizada.");
      void loadReferences();
    } catch {
      setCategoryError("No se pudo guardar la categoría.");
    } finally {
      finishCategoryMutation();
    }
  };
  const toggleCategory = async (category: Category) => {
    if (!beginCategoryMutation()) return;
    try {
      const result = await execute(
        API_ROOT + "/categories/" + category.id,
        "PUT",
        { name: category.name, is_active: !category.is_active },
      );
      if (!result?.data?.success) {
        setError(messageOf(result, "No se pudo actualizar la categoría."));
        return;
      }
      setNotice(category.is_active ? "Categoría desactivada." : "Categoría activada.");
      void loadReferences();
    } catch {
      setError("No se pudo actualizar la categoría.");
    } finally {
      finishCategoryMutation();
    }
  };
  const deleteCategory = async () => {
    if (!categoryToDelete) return;
    if (!beginCategoryMutation()) return;
    try {
      const result = await execute(
        API_ROOT + "/categories/" + categoryToDelete.id, "DELETE", {},
      );
      if (!result?.data?.success) {
        setDeleteError(messageOf(result, "No se pudo eliminar la categoría."));
        return;
      }
      setCategoryToDelete(null);
      setDeleteError(null);
      setNotice("Categoría eliminada.");
      void loadReferences();
    } catch {
      setDeleteError("No se pudo eliminar la categoría.");
    } finally {
      finishCategoryMutation();
    }
  };
  const unblock = async (block: BlockedOwner) => {
    const result = await execute(
      API_ROOT + "/owners/" + block.owner_id + "/block", "DELETE", {},
    );
    if (!result?.data?.success) {
      setError(messageOf(result, "No se pudo desbloquear al residente."));
      return;
    }
    setNotice("Residente desbloqueado.");
    void loadReferences();
  };

  const listingHeader = [
    { key: "title", responsive: "Publicación", label: "Publicación", width: "240px" },
    { key: "owner", responsive: "Residente", label: "Residente", width: "180px", onRender: ({ item }: { item: Listing }) => item.owner?.name || "—" },
    { key: "client_id", responsive: "Condominio", label: "Condominio", width: "180px", onRender: ({ item }: { item: Listing }) => clients.find((client) => client.id === item.client_id)?.name || "—" },
    { key: "category", responsive: "Categoría", label: "Categoría", width: "160px", onRender: ({ item }: { item: Listing }) => item.category?.name || "—" },
    { key: "price", responsive: "Precio", label: "Precio", width: "130px", onRender: ({ item }: { item: Listing }) => (item.currency || "") + " " + (item.price ?? "—") },
    { key: "visibility", responsive: "Alcance", label: "Alcance", width: "160px", onRender: ({ item }: { item: Listing }) => item.visibility === "all_condominiums" ? "Todos los condominios" : "Su condominio" },
    { key: "is_featured", responsive: "Destacada", label: "Destacada", width: "130px", onRender: ({ item }: { item: Listing }) => <StatusBadge>{item.is_featured ? "Sí" : "No"}</StatusBadge> },
    { key: "status", responsive: "Estado", label: "Estado", width: "140px", onRender: ({ item }: { item: Listing }) => <StatusBadge>{statusLabel(item.status)}</StatusBadge> },
    { key: "actions", responsive: "Acciones", label: "Acciones", width: "90px", onRender: ({ item }: { item: Listing }) => (
      <button type="button" className={styles.iconAction} aria-label={"Ver publicación " + item.title} title="Ver detalle"
        onClick={(event) => { event.stopPropagation(); void openDetail(item); }}>
        <Eye size={18} />
      </button>
    ) },
  ];
  const categoryHeader = [
    { key: "name", responsive: "Categoría", label: "Categoría", width: "100%" },
    { key: "is_active", responsive: "Estado", label: "Estado", width: "150px", onRender: ({ item }: { item: Category }) => <StatusBadge>{item.is_active ? "Activa" : "Inactiva"}</StatusBadge> },
    { key: "actions", responsive: "Acciones", label: "Acciones", width: "150px", onRender: ({ item }: { item: Category }) => (
      <div className={styles.tableActions}>
        <button type="button" className={styles.iconAction} aria-label={"Editar categoría " + item.name} title="Editar"
          onClick={() => openCategoryEditor(item)}><Pencil size={18} /></button>
        <button type="button" className={styles.iconAction}
          aria-label={(item.is_active ? "Desactivar categoría " : "Activar categoría ") + item.name}
          title={item.is_active ? "Desactivar" : "Activar"}
          onClick={() => void toggleCategory(item)}>
          {item.is_active ? <EyeOff size={18} /> : <Eye size={18} />}
        </button>
        <button type="button" className={styles.iconActionDanger} aria-label={"Eliminar categoría " + item.name} title="Eliminar"
          onClick={() => { setDeleteError(null); setCategoryToDelete(item); }}><Trash2 size={18} /></button>
      </div>
    ) },
  ];
  const blockedHeader = [
    { key: "name", responsive: "Residente", label: "Residente", width: "260px", onRender: ({ item }: { item: BlockedOwner }) => residentName(item) },
    { key: "reason", responsive: "Motivo", label: "Motivo", width: "100%", onRender: ({ item }: { item: BlockedOwner }) => item.reason || "—" },
    { key: "blocked_at", responsive: "Fecha", label: "Fecha de bloqueo", width: "190px", onRender: ({ item }: { item: BlockedOwner }) => formatDate(item.blocked_at) },
    { key: "actions", responsive: "Acciones", label: "Acciones", width: "150px", onRender: ({ item }: { item: BlockedOwner }) => <Button small variant="secondary" onClick={() => void unblock(item)}>Desbloquear</Button> },
  ];

  if (!isFos) return <NotAccess />;

  const searchValue = activeTab === "listings" ? filters.query
    : activeTab === "categories" ? categoryQuery : residentQuery;
  const searchPlaceholder = activeTab === "listings" ? "Buscar publicación o residente"
    : activeTab === "categories" ? "Buscar categoría" : "Buscar residente o motivo";
  const updateSearch = (value: string) => {
    if (activeTab === "listings") changeListingFilter("query", value);
    else if (activeTab === "categories") setCategoryQuery(value);
    else setResidentQuery(value);
  };
  const canApprove = selected && !["approved", "cancelled", "sold"].includes(selected.status);
  const canReject = selected && !["rejected", "cancelled", "sold"].includes(selected.status);
  const canCancel = selected && !["cancelled", "sold"].includes(selected.status);
  const moderationTitle = moderationAction === "reject" ? "Rechazar publicación"
    : moderationAction === "cancel" ? "Anular publicación" : "Bloquear residente";
  const moderationDescription = moderationAction === "reject"
    ? "La publicación dejará de estar visible. Explica al residente el motivo del rechazo."
    : moderationAction === "cancel"
      ? "Esta publicación dejará de estar disponible en Marketplace."
      : "El residente no podrá ver ni publicar anuncios en Marketplace hasta que lo desbloquees.";

  return (
    <div className={styles.container}>
      <section className={crudStyles.useCrud}>
        <header className={crudStyles.titleRow}>
          <h1 className={crudStyles.titleText}>Marketplace</h1>
        </header>
        <nav className={styles.tabBar} aria-label="Secciones de Marketplace">
          <TabsButtons tabs={tabs} sel={activeTab} setSel={changeTab} variant="pill" />
        </nav>

        <div className={crudStyles.toolbarRow + " " + styles.toolbar}>
          <div className={styles.toolbarLeft}>
            <div className={crudStyles.toolbarSearch}>
              <DataSearch key={activeTab} name={"marketplace-search-" + activeTab}
                value={searchValue} placeholder={searchPlaceholder} setSearch={updateSearch} />
            </div>
            {activeTab === "listings" ? (
              <div className={styles.filterGroup}>
                <div className={styles.filterControl}>
                  <Select label="Condominio" name="client_id" value={filters.client_id}
                    options={clientOptions} filter required={false}
                    onChange={(event: any) => changeListingFilter("client_id", event.target.value)} />
                </div>
                <div className={styles.filterControl}>
                  <Select label="Estado" name="status" value={filters.status}
                    options={statusOptions} required={false}
                    onChange={(event: any) => changeListingFilter("status", event.target.value)} />
                </div>
                <div className={styles.filterControl}>
                  <Select label="Categoría" name="category_id" value={filters.category_id}
                    options={categoryOptions} filter required={false}
                    onChange={(event: any) => changeListingFilter("category_id", event.target.value)} />
                </div>
                <div className={styles.filterControl}>
                  <Select label="Destacada" name="featured" value={filters.featured}
                    options={featuredOptions} required={false}
                    onChange={(event: any) => changeListingFilter("featured", event.target.value)} />
                </div>
              </div>
            ) : null}
            {activeTab === "categories" ? (
              <div className={styles.filterControl}>
                <Select label="Estado" name="category_status" value={categoryStatus}
                  options={categoryStatusOptions} required={false}
                  onChange={(event: any) => setCategoryStatus(event.target.value)} />
              </div>
            ) : null}
          </div>
          <div className={crudStyles.toolbarActions + " " + styles.toolbarActions}>
            <Button variant="secondary" onClick={refresh}>
              <RefreshCw size={16} /> Actualizar
            </Button>
            {activeTab === "categories" ? (
              <Button onClick={() => openCategoryEditor("new")}>
                <Plus size={17} /> Nueva categoría
              </Button>
            ) : null}
          </div>
        </div>

        {error ? <p className={styles.error} role="alert">{error}</p> : null}
        {notice ? <p className={styles.success} role="status">{notice}</p> : null}

        <div className={crudStyles.contentRow}>
          <section className={crudStyles.contentMain} aria-label={tabs.find((tab) => tab.value === activeTab)?.text}>
            {activeTab === "listings" && (
              loading ? <p className={styles.muted}>Cargando publicaciones…</p>
                : listings.length ? (
                  <Table id="marketplace-listings" className="striped" data={listings}
                    header={listingHeader} height="100%"
                    onRowClick={(listing: Listing) => void openDetail(listing)} />
                ) : (
                  <EmptyData message="No hay publicaciones con estos filtros."
                    line2="Prueba con otra búsqueda o cambia los filtros." />
                )
            )}
            {activeTab === "categories" && (
              referenceLoading ? <p className={styles.muted}>Cargando categorías…</p>
                : visibleCategories.length ? (
                  <Table id="marketplace-categories" className="striped"
                    data={visibleCategories} header={categoryHeader} height="100%" />
                ) : (
                  <EmptyData icon={<Tags size={64} />} message="No hay categorías con estos filtros."
                    line2="Ajusta la búsqueda o crea una nueva categoría." />
                )
            )}
            {activeTab === "residents" && (
              referenceLoading ? <p className={styles.muted}>Cargando residentes…</p>
                : visibleBlocks.length ? (
                  <Table id="marketplace-blocked-owners" className="striped"
                    data={visibleBlocks} header={blockedHeader} height="100%" />
                ) : (
                  <EmptyData icon={<Users size={64} />} message="No hay residentes bloqueados."
                    line2="Puedes bloquear a un residente desde el detalle de su publicación." />
                )
            )}
          </section>
        </div>
        {activeTab === "listings" && !loading && pagination.last_page > 1 ? (
          <Pagination currentPage={pagination.current_page} totalPages={pagination.last_page}
            total={pagination.total} onPageChange={setPage} params={{ page }}
            setParams={setPage} />
        ) : null}
      </section>

      <DataModal open={Boolean(categoryEditor)} onClose={() => setCategoryEditor(null)}
        title={categoryEditor === "new" ? "Nueva categoría" : "Editar categoría"}
        buttonText={categoryEditor === "new" ? "Crear categoría" : "Guardar cambios"}
        buttonCancel="Cancelar" onSave={() => void saveCategory()}
        disabled={categorySubmitting} minWidth={440} ignoreTranslation>
        <div className={styles.formBody}>
          <Input label="Nombre de la categoría" name="marketplace-category"
            value={categoryName} maxLength={80}
            onChange={(event: any) => setCategoryName(event.target.value)} />
          {categoryError ? <p className={styles.error} role="alert">{categoryError}</p> : null}
        </div>
      </DataModal>
      <DataModal open={Boolean(categoryToDelete)} onClose={() => setCategoryToDelete(null)}
        title="Eliminar categoría" buttonText="" buttonCancel="Cancelar"
        buttonExtra={<Button variant="danger" disabled={categorySubmitting}
          onClick={() => void deleteCategory()}>Eliminar</Button>}
        minWidth={440} ignoreTranslation>
        <div>
          <p className={styles.confirmText}>
            ¿Eliminar la categoría <strong>{categoryToDelete?.name}</strong>? Esta acción no se puede deshacer.
          </p>
          {deleteError ? <p className={styles.error} role="alert">{deleteError}</p> : null}
        </div>
      </DataModal>
      <DataModal open={Boolean(selected)} onClose={closeDetail}
        title="Detalle de publicación" buttonText="" buttonCancel=""
        maxWidth={760} minWidth={680} ignoreTranslation
        buttonExtra={selected && detailReady ? (
          <div className={styles.moderationFooter}>
            <div className={styles.footerSecondary}>
              {selected.status === "approved" ? (
                <Button variant="secondary" disabled={moderationSubmitting}
                  onClick={() => void performAction("feature")}>
                  <Star size={17} /> {selected.is_featured ? "Quitar destacado" : "Destacar"}
                </Button>
              ) : null}
              {canReject ? (
                <Button variant="secondary" disabled={moderationSubmitting}
                  onClick={() => openModeration("reject")}>
                  <X size={17} /> Rechazar
                </Button>
              ) : null}
            </div>
            <div className={styles.footerPrimary}>
              {(canCancel || selected.owner?.id) ? (
                <div className={styles.moreActions} ref={moreActionsRef}>
                  <button type="button" className={styles.moreButton} ref={moreActionsTriggerRef}
                    aria-expanded={moreActionsOpen} aria-controls="marketplace-more-actions"
                    disabled={moderationSubmitting}
                    onClick={() => setMoreActionsOpen((open) => !open)}>
                    <Ellipsis size={18} /> Más acciones
                  </button>
                  {moreActionsOpen ? (
                    <div className={styles.moreMenu} id="marketplace-more-actions"
                      role="group" aria-label="Más acciones de publicación">
                      {canCancel ? (
                        <button type="button" onClick={() => openModeration("cancel")}>
                          <X size={17} /> Anular publicación
                        </button>
                      ) : null}
                      {selected.owner?.id ? (
                        <button type="button" className={styles.menuDanger}
                          onClick={() => openModeration("block")}>
                          <ShieldBan size={17} /> Bloquear residente
                        </button>
                      ) : null}
                    </div>
                  ) : null}
                </div>
              ) : null}
              {canApprove ? (
                <Button disabled={moderationSubmitting} onClick={() => void performAction("approve")}>
                  <Check size={18} /> Aprobar
                </Button>
              ) : null}
            </div>
          </div>
        ) : null}>
        {selected && (
          <div className={styles.modalBody}>
            {detailError && !moderationAction ? <p className={styles.error} role="alert">{detailError}</p> : null}
            {detailLoading ? <p className={styles.muted}>Cargando detalle…</p> : (
              <>
                <div className={styles.listingOverview}>
                  {selected.images?.[0] ? (
                    <img className={styles.coverImage} src={selected.images[0]}
                      alt={"Foto principal de " + selected.title} />
                  ) : (
                    <div className={styles.coverPlaceholder}><ImageIcon size={30} /> Sin foto</div>
                  )}
                  <div className={styles.listingSummary}>
                    <div className={styles.summaryBadges}>
                      <StatusBadge>{statusLabel(selected.status)}</StatusBadge>
                      {selected.is_featured ? <span className={styles.featuredBadge}><Star size={13} /> Destacada</span> : null}
                    </div>
                    <span className={styles.eyebrow}>{selected.category?.name || "Sin categoría"}</span>
                    <h2 className={styles.listingTitle}>{selected.title}</h2>
                    <p className={styles.listingPrice}>
                      {selected.currency === "BOB" ? formatBs(selected.price) : `${selected.currency || ""} ${selected.price ?? "—"}`.trim()}
                    </p>
                  </div>
                </div>
                <dl className={styles.detailGrid}>
                  <div><dt>Residente</dt><dd>{selected.owner?.name || "—"}</dd></div>
                  <div><dt>Condominio</dt><dd>{clients.find((client) => client.id === selected.client_id)?.name || "—"}</dd></div>
                  <div><dt>Teléfono</dt><dd>{selected.owner?.phone || "—"}</dd></div>
                  <div><dt>Visibilidad</dt><dd>{selected.visibility === "all_condominiums" ? "Todos los condominios" : "Su condominio"}</dd></div>
                </dl>
                {selected.description ? (
                  <div className={styles.descriptionBlock}>
                    <h3>Descripción</h3>
                    <p className={styles.description}>{selected.description}</p>
                  </div>
                ) : null}
                {selected.moderation_reason ? (
                  <div className={styles.previousReason}>
                    <strong>Motivo de moderación</strong>
                    <p>{selected.moderation_reason}</p>
                  </div>
                ) : null}
                {selected.images && selected.images.length > 1 ? (
                  <div className={styles.gallery} aria-label="Fotos adicionales">
                    {selected.images.slice(1).map((image, index) => (
                      <img alt={"Foto adicional " + (index + 2) + " de " + selected.title}
                        key={image} src={image} />
                    ))}
                  </div>
                ) : null}
              </>
            )}
          </div>
        )}
      </DataModal>
      <DataModal open={Boolean(moderationAction)}
        onClose={() => { if (!moderationSubmitting) { setModerationAction(null); setDetailError(null); } }}
        title={moderationTitle} buttonText="" buttonCancel="Volver"
        buttonExtra={moderationAction ? (
          <Button variant="danger" disabled={moderationSubmitting || (moderationAction === "reject" && reason.trim().length < 3)}
            onClick={() => void performAction(moderationAction)}>
            {moderationSubmitting ? "Procesando…" : moderationTitle}
          </Button>
        ) : null}
        maxWidth={520} minWidth={440} zIndex={240} ignoreTranslation>
        {moderationAction ? (
          <div className={styles.confirmationBody}>
            <p>{moderationDescription}</p>
            <TextArea key={moderationAction} name="marketplace-moderation-reason"
              label={moderationAction === "reject" ? "Motivo del rechazo" : "Motivo (opcional)"}
              value={reason} lines={3} maxLength={1000}
              required={moderationAction === "reject"}
              placeholder={moderationAction === "reject" ? "Ej. El anuncio no cumple las normas del Marketplace" : "Añade un motivo si corresponde"}
              onChange={(event) => setReason(event.target.value)} />
            <span className={styles.reasonHelp}>
              {moderationAction === "reject" ? "Mínimo 3 caracteres · " : ""}{reason.length}/1000
            </span>
            {detailError ? <p className={styles.error} role="alert">{detailError}</p> : null}
          </div>
        ) : null}
      </DataModal>
    </div>
  );
}
