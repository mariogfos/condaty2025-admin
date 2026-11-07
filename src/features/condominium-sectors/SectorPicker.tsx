"use client";

import { useRef, useState } from "react";
import { X } from "lucide-react";
import SearchCreatePicker from "@/mk/components/forms/SearchCreatePicker/SearchCreatePicker";
import { useAuth } from "@/mk/contexts/AuthProvider";
import useAxios from "@/mk/hooks/useAxios";
import styles from "./SectorPicker.module.css";

type Sector = { id: number; name: string };
type Scope = "areas" | "units";
const endpoint = "/condominium-sectors";

export function useSectorCatalog(scope: Scope) {
  const { data, execute } = useAxios(endpoint, "GET", { scope }, true);
  const { showToast } = useAuth();
  const [created, setCreated] = useState<Sector[]>([]);
  const [creating, setCreating] = useState(false);
  const inFlight = useRef(false);

  const create = async (name: string): Promise<Sector | null> => {
    if (inFlight.current) return null;
    inFlight.current = true;
    setCreating(true);
    try {
      const result = await execute(endpoint, "POST", { name, scope }, false, true);
      const sector = result.data?.data as Sector | undefined;
      if (result.data?.success && sector) {
        setCreated((items) => [...items.filter(({ id }) => id !== sector.id), sector]);
        return sector;
      }
      showToast(result.error?.data?.message || "No se pudo crear el sector.", "error");
      return null;
    } finally {
      inFlight.current = false;
      setCreating(false);
    }
  };

  const fetched = (data?.data?.sectors ?? []) as Sector[];
  const sectors = [...fetched, ...created.filter(({ id }) => !fetched.some((sector) => sector.id === id))];

  return { enabled: data?.data?.enabled === true, sectors, create, creating };
}

export default function SectorPicker({ catalog, selected, onChange, multiple = false }: {
  catalog: ReturnType<typeof useSectorCatalog>;
  selected: number[];
  onChange: (ids: number[]) => void;
  multiple?: boolean;
}) {
  const [query, setQuery] = useState("");
  const select = (id: number) => {
    onChange(multiple ? [...new Set([...selected, id])] : [id]);
    setQuery("");
  };

  return (
    <div className={styles.picker}>
      <SearchCreatePicker
        fieldName={multiple ? "area_sector_search" : "unit_sector_search"}
        label={multiple ? "Sectores" : "Sector"}
        placeholder="Busca o crea un sector"
        optionsLabel="Sectores disponibles"
        emptyLabel="Escribe para crear un sector."
        value={query}
        options={catalog.sectors.map(({ id, name }) => ({ id: String(id), name }))}
        creating={catalog.creating}
        onChange={setQuery}
        onSelect={({ id }) => select(Number(id))}
        onCreate={async (name) => {
          const sector = await catalog.create(name);
          if (!sector) return false;
          select(sector.id);
          return true;
        }}
      />
      <div className={styles.selection}>
        {selected.length === 0 && <span>Sin sector</span>}
        {catalog.sectors.filter(({ id }) => selected.includes(id)).map(({ id, name }) => (
          <button className={styles.chip} key={id} type="button" disabled={catalog.creating}
            aria-label={`Quitar sector ${name}`} onClick={() => onChange(selected.filter((sector) => sector !== id))}>
            {name} <X size={14} aria-hidden="true" />
          </button>
        ))}
      </div>
    </div>
  );
}
