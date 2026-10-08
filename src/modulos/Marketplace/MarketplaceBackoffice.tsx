"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import NotAccess from "@/components/auth/NotAccess/NotAccess";
import { StatusBadge } from "@/components/StatusBadge/StatusBadge";
import Button from "@/mk/components/forms/Button/Button";
import DataSearch from "@/mk/components/forms/DataSearch/DataSearch";
import Input from "@/mk/components/forms/Input/Input";
import Select from "@/mk/components/forms/Select/Select";
import DataModal from "@/mk/components/ui/DataModal/DataModal";
import Table from "@/mk/components/ui/Table/Table";
import { useAuth } from "@/mk/contexts/AuthProvider";
import useAxios from "@/mk/hooks/useAxios";
import crudStyles from "@/mk/hooks/useCrud/useCrudStyle.module.css";
import styles from "./MarketplaceBackoffice.module.css";

const API_ROOT = "/backoffice/marketplace";
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
const statusLabels: Record<string, string> = {
  pending: "Pendiente",
  approved: "Aprobado",
  rejected: "Rechazado",
  cancelled: "Anulado",
  sold: "Vendido",
};

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
};
type BlockedOwner = {
  owner_id: string;
  name?: string;
  middle_name?: string;
  last_name?: string;
  reason?: string | null;
  blocked_at?: string;
};

const messageOf = (result: any, fallback: string) =>
  result?.error?.data?.message || result?.data?.message || fallback;
const statusLabel = (status: string) => statusLabels[status] || status;
const formatDate = (value?: string) =>
  value
    ? new Intl.DateTimeFormat("es-BO", {
        dateStyle: "medium",
        timeStyle: "short",
      }).format(new Date(value))
    : "—";

export default function MarketplaceBackoffice() {
  const { user, setStore } = useAuth();
  const { execute } = useAxios();
  const [listings, setListings] = useState<Listing[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [clients, setClients] = useState<Client[]>([]);
  const [blocks, setBlocks] = useState<BlockedOwner[]>([]);
  const [filters, setFilters] = useState({
    client_id: "",
    status: "",
    category_id: "",
    featured: "",
    query: "",
  });
  const [selected, setSelected] = useState<Listing | null>(null);
  const [reason, setReason] = useState("");
  const [categoryName, setCategoryName] = useState("");
  const [loading, setLoading] = useState(true);
  const [notice, setNotice] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const isFos = Boolean(user?.fosrole_id);

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

  const load = useCallback(async () => {
    if (!isFos) return;
    setLoading(true);
    setError(null);
    const payload = Object.fromEntries(
      Object.entries(filters).filter(([, value]) => value),
    );
    const [listResult, categoryResult, clientResult, blockResult] =
      await Promise.all([
        execute(`${API_ROOT}/listings`, "GET", payload, false, true),
        execute(`${API_ROOT}/categories`, "GET", {}, false, true),
        execute(`${API_ROOT}/clients`, "GET", {}, false, true),
        execute(`${API_ROOT}/blocked-owners`, "GET", {}, false, true),
      ]);
    if (listResult?.data?.success) setListings(listResult.data.data?.items || []);
    else setError(messageOf(listResult, "No se pudieron cargar las publicaciones."));
    if (categoryResult?.data?.success) setCategories(categoryResult.data.data || []);
    if (clientResult?.data?.success) setClients(clientResult.data.data || []);
    if (blockResult?.data?.success) setBlocks(blockResult.data.data || []);
    setLoading(false);
    // execute changes per render in the legacy hook.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filters, isFos]);

  useEffect(() => {
    setStore({ title: "Marketplace", right: null });
  }, [setStore]);
  useEffect(() => {
    void load();
  }, [load]);

  const openDetail = async (listing: Listing) => {
    setError(null);
    setReason("");
    setSelected(listing);
    const result = await execute(
      `${API_ROOT}/listings/${listing.id}`,
      "GET",
      {},
      false,
      true,
    );
    if (result?.data?.success) setSelected(result.data.data);
    else setError(messageOf(result, "No se pudo cargar el detalle."));
  };

  const action = async (path: string, payload: Record<string, unknown> = {}) => {
    if (!selected) return;
    const result = await execute(
      `${API_ROOT}/listings/${selected.id}/${path}`,
      "POST",
      payload,
    );
    if (!result?.data?.success) {
      setError(messageOf(result, "No se pudo actualizar la publicación."));
      return;
    }
    setNotice(result.data.message || "Actualización guardada.");
    setSelected(result.data.data);
    setReason("");
    void load();
  };

  const blockSelectedOwner = async () => {
    if (!selected?.owner?.id) return;
    const result = await execute(
      `${API_ROOT}/owners/${selected.owner.id}/block`,
      "POST",
      { reason: reason || null },
    );
    if (!result?.data?.success) {
      setError(messageOf(result, "No se pudo bloquear al residente."));
      return;
    }
    setNotice(result.data.message || "Residente bloqueado.");
    setSelected(null);
    void load();
  };

  const createCategory = async () => {
    const name = categoryName.trim();
    if (!name) return;
    const result = await execute(`${API_ROOT}/categories`, "POST", { name });
    if (!result?.data?.success) {
      setError(messageOf(result, "No se pudo crear la categoría."));
      return;
    }
    setCategoryName("");
    setNotice("Categoría creada.");
    void load();
  };

  const updateCategory = async (category: Category, data: Record<string, unknown>) => {
    const result = await execute(`${API_ROOT}/categories/${category.id}`, "PUT", data);
    if (!result?.data?.success) setError(messageOf(result, "No se pudo actualizar la categoría."));
    else {
      setNotice("Categoría actualizada.");
      void load();
    }
  };
  const editCategory = async (category: Category) => {
    const name = window.prompt("Nombre de la categoría", category.name);
    if (name?.trim()) void updateCategory(category, { name: name.trim(), is_active: category.is_active });
  };
  const toggleCategory = async (category: Category) =>
    updateCategory(category, { name: category.name, is_active: !category.is_active });
  const deleteCategory = async (category: Category) => {
    if (!window.confirm(`¿Eliminar la categoría “${category.name}”?`)) return;
    const result = await execute(`${API_ROOT}/categories/${category.id}`, "DELETE", {});
    if (!result?.data?.success) setError(messageOf(result, "No se pudo eliminar la categoría."));
    else {
      setNotice("Categoría eliminada.");
      void load();
    }
  };
  const unblock = async (block: BlockedOwner) => {
    const result = await execute(`${API_ROOT}/owners/${block.owner_id}/block`, "DELETE", {});
    if (!result?.data?.success) setError(messageOf(result, "No se pudo desbloquear al residente."));
    else {
      setNotice("Residente desbloqueado.");
      void load();
    }
  };

  const listingHeader = useMemo(
    () => [
      { key: "title", responsive: "Publicación", label: "Publicación", width: "240px" },
      { key: "owner", responsive: "Residente", label: "Residente", width: "180px", onRender: ({ item }: { item: Listing }) => item.owner?.name || "—" },
      { key: "client_id", responsive: "Condominio", label: "Condominio", width: "180px", onRender: ({ item }: { item: Listing }) => clients.find((client) => client.id === item.client_id)?.name || "—" },
      { key: "category", responsive: "Categoría", label: "Categoría", width: "160px", onRender: ({ item }: { item: Listing }) => item.category?.name || "—" },
      { key: "price", responsive: "Precio", label: "Precio", width: "130px", onRender: ({ item }: { item: Listing }) => `${item.currency || ""} ${item.price ?? "—"}`.trim() },
      { key: "visibility", responsive: "Alcance", label: "Alcance", width: "160px", onRender: ({ item }: { item: Listing }) => item.visibility === "all_condominiums" ? "Todos los condominios" : "Su condominio" },
      { key: "is_featured", responsive: "Destacada", label: "Destacada", width: "130px", onRender: ({ item }: { item: Listing }) => <StatusBadge>{item.is_featured ? "Sí" : "No"}</StatusBadge> },
      { key: "status", responsive: "Estado", label: "Estado", width: "140px", onRender: ({ item }: { item: Listing }) => <StatusBadge>{statusLabel(item.status)}</StatusBadge> },
    ],
    [clients],
  );
  const categoryHeader = [
      { key: "name", responsive: "Categoría", label: "Categoría", width: "100%" },
      { key: "is_active", responsive: "Estado", label: "Estado", width: "150px", onRender: ({ item }: { item: Category }) => <StatusBadge>{item.is_active ? "Activa" : "Inactiva"}</StatusBadge> },
      { key: "actions", responsive: "Acciones", label: "Acciones", width: "310px", onRender: ({ item }: { item: Category }) => <div className={styles.tableActions}><Button small variant="secondary" onClick={() => void editCategory(item)}>Editar</Button><Button small variant="secondary" onClick={() => void toggleCategory(item)}>{item.is_active ? "Desactivar" : "Activar"}</Button><Button small variant="danger" onClick={() => void deleteCategory(item)}>Eliminar</Button></div> },
  ];
  const blockedHeader = [
      { key: "name", responsive: "Residente", label: "Residente", width: "260px", onRender: ({ item }: { item: BlockedOwner }) => [item.name, item.middle_name, item.last_name].filter(Boolean).join(" ") || item.owner_id },
      { key: "reason", responsive: "Motivo", label: "Motivo", width: "100%", onRender: ({ item }: { item: BlockedOwner }) => item.reason || "—" },
      { key: "blocked_at", responsive: "Fecha", label: "Fecha de bloqueo", width: "190px", onRender: ({ item }: { item: BlockedOwner }) => formatDate(item.blocked_at) },
      { key: "actions", responsive: "Acciones", label: "Acciones", width: "150px", onRender: ({ item }: { item: BlockedOwner }) => <Button small variant="secondary" onClick={() => void unblock(item)}>Desbloquear</Button> },
  ];

  if (!isFos) return <NotAccess />;

  return (
    <div className={styles.container}>
      <section className={`${crudStyles.useCrud} ${styles.listCrud}`}>
        <header className={crudStyles.titleRow}>
          <div>
            <p className={crudStyles.titleText}>Marketplace</p>
            <p className={styles.subtitle}>Moderá publicaciones de todos los condominios y administrá las categorías.</p>
          </div>
        </header>
        {error && <p className={styles.error}>{error}</p>}
        {notice && <p className={styles.success}>{notice}</p>}
        <nav className={crudStyles.toolbarRow} aria-label="Filtros de Marketplace">
          <div className={crudStyles.toolbarSearch}>
            <DataSearch name="marketplaceSearch" value={filters.query} placeholder="Buscar publicación o residente" setSearch={(query: string) => setFilters((current) => ({ ...current, query }))} />
          </div>
          <div className={crudStyles.toolbarControls}>
            <div className={crudStyles.toolbarFilters}>
              <Select label="Condominio" name="client_id" value={filters.client_id} options={clientOptions} filter onChange={(event: any) => setFilters((current) => ({ ...current, client_id: event.target.value }))} />
              <Select label="Estado" name="status" value={filters.status} options={statusOptions} onChange={(event: any) => setFilters((current) => ({ ...current, status: event.target.value }))} />
              <Select label="Categoría" name="category_id" value={filters.category_id} options={categoryOptions} filter onChange={(event: any) => setFilters((current) => ({ ...current, category_id: event.target.value }))} />
              <Select label="Destacada" name="featured" value={filters.featured} options={featuredOptions} onChange={(event: any) => setFilters((current) => ({ ...current, featured: event.target.value }))} />
            </div>
            <div className={crudStyles.toolbarActions}><Button variant="secondary" onClick={() => void load()}>Actualizar</Button></div>
          </div>
        </nav>
        <div className={crudStyles.contentRow}>
          <section className={crudStyles.contentMain}>
            {loading ? <p className={styles.muted}>Cargando publicaciones…</p> : listings.length ? <Table id="marketplace-listings" className="striped" data={listings} header={listingHeader} height="100%" onRowClick={(listing: Listing) => void openDetail(listing)} /> : <p className={styles.emptyState}>No hay publicaciones con estos filtros.</p>}
          </section>
        </div>
      </section>

      <section className={styles.secondarySection}>
        <header className={styles.sectionHeader}>
          <h2 className={styles.sectionTitle}>Categorías</h2>
          <div className={styles.categoryForm}><Input label="Nueva categoría" name="marketplace-category" value={categoryName} onChange={(event: any) => setCategoryName(event.target.value)} maxLength={80} /><Button onClick={() => void createCategory()}>Crear categoría</Button></div>
        </header>
        {categories.length ? <Table id="marketplace-categories" className="striped" data={categories} header={categoryHeader} /> : <p className={styles.emptyState}>No hay categorías creadas.</p>}
      </section>

      <section className={styles.secondarySection}>
        <h2 className={styles.sectionTitle}>Residentes bloqueados</h2>
        {blocks.length ? <Table id="marketplace-blocked-owners" className="striped" data={blocks} header={blockedHeader} /> : <p className={styles.emptyState}>No hay residentes bloqueados.</p>}
      </section>

      <DataModal open={Boolean(selected)} onClose={() => setSelected(null)} title="Detalle de publicación" buttonText="" buttonCancel="Cerrar" minWidth={560} ignoreTranslation>
        {selected && <div className={styles.modalBody}>
          <dl className={styles.detailGrid}>
            <div><dt>Residente</dt><dd>{selected.owner?.name || "—"}</dd></div>
            <div><dt>Teléfono</dt><dd>{selected.owner?.phone || "—"}</dd></div>
            <div><dt>Estado</dt><dd>{statusLabel(selected.status)}</dd></div>
            <div><dt>Destacada</dt><dd>{selected.is_featured ? "Sí" : "No"}</dd></div>
            <div><dt>Alcance</dt><dd>{selected.visibility === "all_condominiums" ? "Todos los condominios" : "Su condominio"}</dd></div>
          </dl>
          <p className={styles.description}>{selected.description || ""}</p>
          {selected.images?.length ? <div className={styles.images}>{selected.images.map((image) => <img alt="Publicación" key={image} src={image} />)}</div> : null}
          <textarea className={styles.reason} value={reason} onChange={(event) => setReason(event.target.value)} placeholder="Motivo para rechazar, anular o bloquear" />
          <div className={styles.modalActions}>
            {selected.status === "approved" ? <Button variant={selected.is_featured ? "secondary" : "primary"} onClick={() => void action("feature", { is_featured: !selected.is_featured })}>{selected.is_featured ? "Quitar destacado" : "Destacar"}</Button> : null}
            <Button onClick={() => void action("approve")}>Aprobar</Button>
            <Button variant="secondary" onClick={() => void action("reject", { reason })} disabled={!reason.trim()}>Rechazar</Button>
            <Button variant="secondary" onClick={() => void action("cancel", { reason: reason || null })}>Anular</Button>
            <Button variant="secondary" onClick={() => void blockSelectedOwner()}>Bloquear residente</Button>
          </div>
        </div>}
      </DataModal>
    </div>
  );
}
