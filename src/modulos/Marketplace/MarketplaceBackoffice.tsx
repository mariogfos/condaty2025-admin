"use client";

import { useCallback, useEffect, useState } from "react";
import NotAccess from "@/components/auth/NotAccess/NotAccess";
import Button from "@/mk/components/forms/Button/Button";
import DataModal from "@/mk/components/ui/DataModal/DataModal";
import { useAuth } from "@/mk/contexts/AuthProvider";
import useAxios from "@/mk/hooks/useAxios";
import styles from "./MarketplaceBackoffice.module.css";

const API_ROOT = "/backoffice/marketplace";
const statuses = ["pending", "approved", "rejected", "cancelled", "sold"];

type Category = { id: number; name: string; slug: string; is_active: boolean };
type Client = { id: string; name: string };
type Listing = {
  id: string; title: string; status: string; client_id: string; price: number; currency: string;
  category?: { id: number; name: string } | null; owner?: { id: string; name: string; phone?: string | null };
  visibility: string; created_at?: string; moderation_reason?: string | null; description?: string | null; images?: string[] | null;
};
type BlockedOwner = { owner_id: string; name?: string; middle_name?: string; last_name?: string; reason?: string | null; blocked_at?: string };

const messageOf = (result: any, fallback: string) => result?.error?.data?.message || result?.data?.message || fallback;

export default function MarketplaceBackoffice() {
  const { user, setStore } = useAuth();
  const { execute } = useAxios();
  const [listings, setListings] = useState<Listing[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [clients, setClients] = useState<Client[]>([]);
  const [blocks, setBlocks] = useState<BlockedOwner[]>([]);
  const [filters, setFilters] = useState({ client_id: "", status: "", category_id: "", query: "" });
  const [selected, setSelected] = useState<Listing | null>(null);
  const [reason, setReason] = useState("");
  const [categoryName, setCategoryName] = useState("");
  const [loading, setLoading] = useState(true);
  const [notice, setNotice] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const isFos = Boolean(user?.fosrole_id);

  const load = useCallback(async () => {
    if (!isFos) return;
    setLoading(true); setError(null);
    const payload = Object.fromEntries(Object.entries(filters).filter(([, value]) => value));
    const [listResult, categoryResult, clientResult, blockResult] = await Promise.all([
      execute(`${API_ROOT}/listings`, "GET", payload, false, true),
      execute(`${API_ROOT}/categories`, "GET", {}, false, true),
      execute(`${API_ROOT}/clients`, "GET", {}, false, true),
      execute(`${API_ROOT}/blocked-owners`, "GET", {}, false, true),
    ]);
    if (listResult?.data?.success) setListings(listResult.data.data?.items || []); else setError(messageOf(listResult, "No se pudieron cargar las publicaciones."));
    if (categoryResult?.data?.success) setCategories(categoryResult.data.data || []);
    if (clientResult?.data?.success) setClients(clientResult.data.data || []);
    if (blockResult?.data?.success) setBlocks(blockResult.data.data || []);
    setLoading(false);
  // execute changes per render in the legacy hook.
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filters, isFos]);

  useEffect(() => { setStore({ title: "Marketplace", right: null }); }, [setStore]);
  useEffect(() => { void load(); }, [load]);

  const openDetail = async (listing: Listing) => {
    setError(null); setReason(""); setSelected(listing);
    const result = await execute(`${API_ROOT}/listings/${listing.id}`, "GET", {}, false, true);
    if (result?.data?.success) setSelected(result.data.data);
    else setError(messageOf(result, "No se pudo cargar el detalle."));
  };

  const action = async (path: string, payload: Record<string, unknown> = {}) => {
    if (!selected) return;
    const result = await execute(`${API_ROOT}/listings/${selected.id}/${path}`, "POST", payload);
    if (!result?.data?.success) { setError(messageOf(result, "No se pudo actualizar la publicación.")); return; }
    setNotice(result.data.message || "Actualización guardada."); setSelected(result.data.data); setReason(""); void load();
  };

  const blockSelectedOwner = async () => {
    if (!selected?.owner?.id) return;
    const result = await execute(`${API_ROOT}/owners/${selected.owner.id}/block`, "POST", { reason: reason || null });
    if (!result?.data?.success) { setError(messageOf(result, "No se pudo bloquear al residente.")); return; }
    setNotice(result.data.message || "Residente bloqueado."); setSelected(null); void load();
  };

  const createCategory = async () => {
    const name = categoryName.trim(); if (!name) return;
    const result = await execute(`${API_ROOT}/categories`, "POST", { name });
    if (!result?.data?.success) { setError(messageOf(result, "No se pudo crear la categoría.")); return; }
    setCategoryName(""); setNotice("Categoría creada."); void load();
  };

  const editCategory = async (category: Category) => {
    const name = window.prompt("Nombre de la categoría", category.name); if (!name?.trim()) return;
    const result = await execute(`${API_ROOT}/categories/${category.id}`, "PUT", { name: name.trim(), is_active: category.is_active });
    if (!result?.data?.success) setError(messageOf(result, "No se pudo editar la categoría.")); else { setNotice("Categoría actualizada."); void load(); }
  };

  const toggleCategory = async (category: Category) => {
    const result = await execute(`${API_ROOT}/categories/${category.id}`, "PUT", { name: category.name, is_active: !category.is_active });
    if (!result?.data?.success) setError(messageOf(result, "No se pudo actualizar la categoría.")); else { setNotice("Categoría actualizada."); void load(); }
  };

  const deleteCategory = async (category: Category) => {
    if (!window.confirm(`¿Eliminar la categoría “${category.name}”?`)) return;
    const result = await execute(`${API_ROOT}/categories/${category.id}`, "DELETE", {});
    if (!result?.data?.success) setError(messageOf(result, "No se pudo eliminar la categoría.")); else { setNotice("Categoría eliminada."); void load(); }
  };

  const unblock = async (block: BlockedOwner) => {
    const result = await execute(`${API_ROOT}/owners/${block.owner_id}/block`, "DELETE", {});
    if (!result?.data?.success) setError(messageOf(result, "No se pudo desbloquear al residente.")); else { setNotice("Residente desbloqueado."); void load(); }
  };

  if (!isFos) return <NotAccess />;

  return <div className={styles.container}>
    <header className={styles.header}><div><h1 className={styles.title}>Marketplace</h1><p className={styles.subtitle}>Moderá publicaciones de todos los condominios y administrá las categorías.</p></div><Button onClick={load}>Actualizar</Button></header>
    {error && <p className={styles.error}>{error}</p>}{notice && <p className={styles.success}>{notice}</p>}
    <section className={styles.filters}>
      <label className={styles.field}>Condominio<select value={filters.client_id} onChange={(e) => setFilters((v) => ({ ...v, client_id: e.target.value }))}><option value="">Todos</option>{clients.map((client) => <option key={client.id} value={client.id}>{client.name}</option>)}</select></label>
      <label className={styles.field}>Estado<select value={filters.status} onChange={(e) => setFilters((v) => ({ ...v, status: e.target.value }))}><option value="">Todos</option>{statuses.map((status) => <option key={status} value={status}>{status}</option>)}</select></label>
      <label className={styles.field}>Categoría<select value={filters.category_id} onChange={(e) => setFilters((v) => ({ ...v, category_id: e.target.value }))}><option value="">Todas</option>{categories.map((category) => <option key={category.id} value={category.id}>{category.name}</option>)}</select></label>
      <label className={`${styles.field} ${styles.search}`}>Buscar<input value={filters.query} onChange={(e) => setFilters((v) => ({ ...v, query: e.target.value }))} placeholder="Título o residente" /></label>
    </section>
    <section className={styles.card}><table className={styles.table}><thead><tr><th>Publicación</th><th>Residente</th><th>Condominio</th><th>Categoría</th><th>Precio</th><th>Alcance</th><th>Estado</th></tr></thead><tbody>{listings.map((listing) => <tr key={listing.id}><td><button className={styles.rowButton} onClick={() => void openDetail(listing)}>{listing.title}</button></td><td>{listing.owner?.name || "—"}</td><td>{clients.find((client) => client.id === listing.client_id)?.name || "—"}</td><td>{listing.category?.name || "—"}</td><td>{listing.currency} {listing.price}</td><td>{listing.visibility === "all_condominiums" ? "Todos" : "Su condominio"}</td><td><span className={`${styles.badge} ${styles[listing.status] || ""}`}>{listing.status}</span></td></tr>)}</tbody></table>{!loading && listings.length === 0 && <p className={styles.muted}>No hay publicaciones con estos filtros.</p>}</section>
    <section><h2 className={styles.sectionTitle}>Categorías</h2><div className={styles.categoryForm}><label className={styles.field}>Nueva categoría<input value={categoryName} onChange={(e) => setCategoryName(e.target.value)} maxLength={80} /></label><Button onClick={createCategory}>Crear categoría</Button></div><div className={styles.categories}>{categories.map((category) => <article className={styles.category} key={category.id}><span>{category.name}{!category.is_active ? " · Inactiva" : ""}</span><span className={styles.categoryActions}><button className={styles.plainButton} onClick={() => void editCategory(category)}>Editar</button><button className={styles.plainButton} onClick={() => void toggleCategory(category)}>{category.is_active ? "Desactivar" : "Activar"}</button><button className={styles.plainButton} onClick={() => void deleteCategory(category)}>Eliminar</button></span></article>)}</div></section>
    <section><h2 className={styles.sectionTitle}>Residentes bloqueados</h2><div className={styles.categories}>{blocks.map((block) => <article className={styles.category} key={block.owner_id}><span>{[block.name, block.middle_name, block.last_name].filter(Boolean).join(" ") || block.owner_id}{block.reason ? ` · ${block.reason}` : ""}</span><button className={styles.plainButton} onClick={() => void unblock(block)}>Desbloquear</button></article>)}{blocks.length === 0 && <p className={styles.muted}>No hay residentes bloqueados.</p>}</div></section>
    <DataModal open={Boolean(selected)} onClose={() => setSelected(null)} title="Detalle de publicación" buttonText="" buttonCancel="Cerrar" minWidth={560} ignoreTranslation>
      {selected && <div className={styles.modalBody}><dl className={styles.detailGrid}><div><dt>Residente</dt><dd>{selected.owner?.name || "—"}</dd></div><div><dt>Teléfono</dt><dd>{selected.owner?.phone || "—"}</dd></div><div><dt>Estado</dt><dd>{selected.status}</dd></div><div><dt>Alcance</dt><dd>{selected.visibility === "all_condominiums" ? "Todos los condominios" : "Su condominio"}</dd></div></dl><p className={styles.description}>{selected.description || ""}</p>{selected.images?.length ? <div className={styles.images}>{selected.images.map((image) => <img alt="Publicación" key={image} src={image} />)}</div> : null}<textarea className={styles.reason} value={reason} onChange={(e) => setReason(e.target.value)} placeholder="Motivo para rechazar, anular o bloquear" /><div className={styles.modalActions}><Button onClick={() => void action("approve")}>Aprobar</Button><Button variant="secondary" onClick={() => void action("reject", { reason })} disabled={!reason.trim()}>Rechazar</Button><Button variant="secondary" onClick={() => void action("cancel", { reason: reason || null })}>Anular</Button><Button variant="secondary" onClick={() => void blockSelectedOwner()}>Bloquear residente</Button></div></div>}
    </DataModal>
  </div>;
}
