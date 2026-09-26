"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { RefreshCw, UsersRound } from "lucide-react";
import DataModal from "@/mk/components/ui/DataModal/DataModal";
import { Avatar } from "@/mk/components/ui/Avatar/Avatar";
import useAxios from "@/mk/hooks/useAxios";
import { getDateTimeAgo } from "@/mk/utils/date";
import { getFullName } from "@/mk/utils/string";
import styles from "./PublicationLikesModal.module.css";

type LikePerson = {
  id: string;
  name: string;
  middle_name?: string;
  last_name?: string;
  mother_last_name?: string;
  url_avatar?: string | null;
};

type LikeEntry = {
  id: number;
  liked_at: string;
  person: LikePerson | null;
};

type Pagination = {
  current_page: number;
  last_page: number;
  per_page: number;
  total: number;
  has_more: boolean;
};

type Props = {
  isOpen: boolean;
  onClose: () => void;
  contentId: number | null;
  totalLikes?: number;
};

const PAGE_SIZE = 30;

export default function PublicationLikesModal({
  isOpen,
  onClose,
  contentId,
  totalLikes = 0,
}: Props) {
  const { execute } = useAxios();
  const executeRef = useRef(execute);
  const requestSequenceRef = useRef(0);
  const [likes, setLikes] = useState<LikeEntry[]>([]);
  const [pagination, setPagination] = useState<Pagination | null>(null);
  const [loading, setLoading] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    executeRef.current = execute;
  }, [execute]);

  const loadLikes = useCallback(
    async (page: number, append: boolean) => {
      if (!contentId) return;

      const requestSequence = ++requestSequenceRef.current;
      append ? setLoadingMore(true) : setLoading(true);
      setError("");

      try {
        const response = await executeRef.current(
          `/v3/contents/${contentId}/likes`,
          "GET",
          { page, perPage: PAGE_SIZE },
          false,
          true,
        );
        const payload = response?.data;

        if (response?.error || !payload?.success) {
          throw new Error(payload?.message || "No se pudieron cargar los apoyos");
        }

        if (requestSequence !== requestSequenceRef.current) return;

        const incoming = Array.isArray(payload?.data?.items)
          ? payload.data.items
          : [];
        setLikes((current) => {
          if (!append) return incoming;

          const ids = new Set(current.map((entry) => entry.id));
          return [
            ...current,
            ...incoming.filter((entry: LikeEntry) => !ids.has(entry.id)),
          ];
        });
        setPagination(payload?.data?.pagination || null);
      } catch (loadError) {
        if (requestSequence !== requestSequenceRef.current) return;
        setError(
          loadError instanceof Error
            ? loadError.message
            : "No se pudieron cargar los apoyos",
        );
      } finally {
        if (requestSequence === requestSequenceRef.current) {
          setLoading(false);
          setLoadingMore(false);
        }
      }
    },
    [contentId],
  );

  useEffect(() => {
    if (!isOpen || !contentId) {
      requestSequenceRef.current += 1;
      setLikes([]);
      setPagination(null);
      setError("");
      setLoading(false);
      setLoadingMore(false);
      return;
    }

    void loadLikes(1, false);
  }, [contentId, isOpen, loadLikes]);

  const displayedTotal = pagination?.total ?? totalLikes;

  return (
    <DataModal
      open={isOpen}
      onClose={onClose}
      title="Personas que apoyaron"
      buttonText=""
      buttonCancel=""
      className={styles.modalBody}
      maxWidth={540}
      style={{
        width: "min(540px, calc(100vw - 24px))",
        height: "min(650px, calc(100vh - 32px))",
      }}
      zIndex={1160}
      ignoreTranslation
    >
      <div className={styles.summary}>
        <span className={styles.summaryIcon} aria-hidden="true">
          <UsersRound size={15} />
        </span>
        <strong>
          {displayedTotal} {displayedTotal === 1 ? "apoyo" : "apoyos"}
        </strong>
      </div>

      <div className={styles.listViewport} aria-live="polite">
        {loading ? (
          <div className={styles.state}>
            <span className={styles.spinner} aria-hidden="true" />
            <strong>Cargando apoyos</strong>
            <span>Estamos reuniendo la lista.</span>
          </div>
        ) : error ? (
          <div className={styles.state}>
            <span className={styles.stateIcon} aria-hidden="true">
              <RefreshCw size={20} />
            </span>
            <strong>No pudimos cargar los apoyos</strong>
            <span>{error}</span>
            <button type="button" onClick={() => void loadLikes(1, false)}>
              Reintentar
            </button>
          </div>
        ) : likes.length === 0 ? (
          <div className={styles.state}>
            <span className={styles.stateIcon} aria-hidden="true">
              <UsersRound size={20} />
            </span>
            <strong>Aún no hay apoyos</strong>
            <span>Las personas que apoyen aparecerán aquí.</span>
          </div>
        ) : (
          <ul className={styles.likesList}>
            {likes.map((entry) => {
              const name = entry.person
                ? getFullName(entry.person) || "Usuario"
                : "Usuario no disponible";

              return (
                <li key={entry.id} className={styles.likeItem}>
                  <Avatar
                    name={name}
                    src={entry.person?.url_avatar || undefined}
                    w={42}
                    h={42}
                    className={styles.avatar}
                  />
                  <div className={styles.personInfo}>
                    <strong data-i18n-ignore="true">{name}</strong>
                    <span>Apoyó {getDateTimeAgo(entry.liked_at)}</span>
                  </div>
                </li>
              );
            })}
          </ul>
        )}
      </div>

      {pagination?.has_more ? (
        <button
          type="button"
          className={styles.loadMore}
          disabled={loadingMore}
          onClick={() => void loadLikes(pagination.current_page + 1, true)}
        >
          {loadingMore ? "Cargando…" : "Ver más personas"}
        </button>
      ) : null}
    </DataModal>
  );
}
