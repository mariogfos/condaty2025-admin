import { Avatar } from "@/mk/components/ui/Avatar/Avatar";
import DataModal from "@/mk/components/ui/DataModal/DataModal";
import { getFullName, getUrlImages } from "@/mk/utils/string";
import { getDateStrMes, getDateStrMesShort, getDateTimeStrMesShort } from "@/mk/utils/date";
import ReactPlayer from "react-player";
import { useState, useCallback, useMemo } from "react";
import { useAuth } from "@/mk/contexts/AuthProvider";
import styles from "./RenderView.module.css";
import {
  IconLike,
  IconComment,
  IconEdit,
  IconTrash,
  IconArrowLeft,
  IconArrowRight
} from "@/components/layout/icons/IconsBiblioteca";
import Br from "@/components/Detail/Br";
import Button from "@/mk/components/forms/Button/Button";
import useAxios from "@/mk/hooks/useAxios";
import CommentsModal from "@/components/CommentsModal/CommentsModal";

const RenderView = (props: {
  open: boolean;
  onClose: any;
  item: Record<string, any>;
  onConfirm?: Function;
  extraData?: any;
  onEdit?: (item: any) => void;
  onDelete?: (item: any) => void;
  reLoad?: () => void;
  onOpenComments?: (contentId: number, contentData: any) => void;
  selectedContentData?: any; // Datos actualizados desde el padre
}) => {
  const { data } = props?.item;
  const { user, showToast } = useAuth();
  const [isExpanded, setIsExpanded] = useState(false);
  const [openDeleteModal, setOpenDeleteModal] = useState(false);
  const [indexVisible, setIndexVisible] = useState(0);
  const { execute } = useAxios();

  // Usar datos actualizados si están disponibles, sino usar los originales
  const currentData = props.selectedContentData || data;

  // Memoizar el contador de comentarios para evitar re-renders innecesarios
  const commentsCount = useMemo(() => {
    return currentData?.comments?.length || 0;
  }, [currentData?.comments]);

  const toggleExpanded = useCallback(() => setIsExpanded(!isExpanded), [isExpanded]);

  // Funciones para el carrusel
  const nextIndex = useCallback(() => {
    setIndexVisible((prevIndex) => (prevIndex + 1) % currentData?.images?.length);
  }, [currentData?.images?.length]);

  const prevIndex = useCallback(() => {
    setIndexVisible((prevIndex) =>
      prevIndex === 0 ? currentData?.images?.length - 1 : prevIndex - 1
    );
  }, [currentData?.images?.length]);

  const handleEdit = useCallback(() => {
    props.onClose();
    const itemForEdit = {
      ...currentData,
      id: currentData.id,
      title: currentData.title || '',
      description: currentData.description || '',
      type: currentData.type,
      url: currentData.url || '',
      images: currentData.images || [],
      user_id: currentData.user_id,
      destiny: currentData.destiny,
      client_id: currentData.client_id,
      status: currentData.status,
      created_at: currentData.created_at,
      updated_at: currentData.updated_at,
    };

    if (props.onEdit) {
      props.onEdit(itemForEdit);
    }
  }, [currentData, props]);

  const handleDelete = useCallback(() => {
    setOpenDeleteModal(true);
  }, []);

  const confirmDelete = useCallback(async () => {
    try {
      const response = await execute(`/contents/${currentData.id}`, 'DELETE');

      if (response.data?.success) {
        if (showToast) {
          showToast('Publicación eliminada con éxito', 'success');
        }
        setOpenDeleteModal(false);
        props.onClose();
        if (props.reLoad) {
          props.reLoad();
        }
      } else {
        if (showToast) {
          showToast(response.data?.message || 'Error al eliminar la publicación', 'error');
        }
      }
    } catch (error) {
      if (showToast) {
        showToast('Error al eliminar la publicación', 'error');
      }
      console.error('Error deleting content:', error);
    }
  }, [currentData.id, execute, showToast, props]);

  const handleOpenComments = useCallback(() => {
    if (props.onOpenComments) {
      props.onOpenComments(currentData?.id, currentData);
    }
  }, [props.onOpenComments, currentData]);

  return (
    <>
      <DataModal
        open={props.open}
        onClose={props?.onClose}
        title={'Detalle de la publicación'}
        buttonText=""
        buttonCancel=""
      >
        <div className={styles.container}>
          <div className={styles.header}>
            <div className={styles.headerLeft}>
              <p className={styles.text}>Publicado: {getDateTimeStrMesShort(currentData?.created_at)}</p>
              <p className={styles.text}>Para: Todos</p>
            </div>
            <div className={styles.headerRight}>
              <button
                className={styles.actionButton}
                onClick={handleEdit}
              >
                <IconEdit size={24} />
              </button>
              <button
                className={styles.actionButton}
                onClick={handleDelete}
              >
                <IconTrash size={24} />
              </button>
            </div>
          </div>
          <Br />
          <div className={styles.content}>
            <div className={styles.imageContainer}>
              {currentData?.type === 'I' && currentData?.images?.[indexVisible]?.id ? (
                <>
                  <div className={styles.imageWrapper}>
                    <img
                      alt="Imagen de la publicación"
                      className={styles.image}
                      src={getUrlImages(
                        '/CONT-' + currentData.id + '-' + currentData.images[indexVisible]?.id + '.webp' + '?' + currentData?.updated_at
                      )}
                    />
                  </div>
                  {currentData?.images?.length > 1 && (
                    <div className={styles.containerButton}>
                      <div className={styles.button} onClick={prevIndex}>
                        <IconArrowLeft size={18} color="var(--cWhite)" />
                      </div>
                      <p style={{ color: "var(--cWhite)", fontSize: 10 }}>
                        {indexVisible + 1} / {currentData?.images?.length}
                      </p>
                      <div className={styles.button} onClick={nextIndex}>
                        <IconArrowRight size={18} color="var(--cWhite)" />
                      </div>
                    </div>
                  )}
                </>
              ) : currentData?.type === 'V' ? (
                <ReactPlayer url={currentData?.url} width="100%" height="100%" controls />
              ) : (
                <div className={styles.noImageText}>Sin imagen disponible</div>
              )}
            </div>

            <div className={styles.contentContainer}>
              <div className={styles.userSection}>
                <Avatar
                  hasImage={1}
                  name={getFullName(currentData?.user)}
                  src={getUrlImages('/ADM-' + currentData?.user?.id + '.webp?d=' + currentData?.user?.updated_at)}
                  w={48}
                  h={48}
                />
                <div className={styles.userInfo}>
                  <div className={styles.userName}>{getFullName(currentData?.user)}</div>
                  <div className={styles.userRole}>Administrador</div>
                </div>
              </div>

              {currentData?.title && <h2 className={styles.title}>{currentData.title}</h2>}

              <div className={styles.descriptionContainer}>
                <p
                  className={`${styles.description} ${
                    !isExpanded ? styles.descriptionTruncated : ''
                  }`}
                >
                  {currentData?.description}
                </p>

                {currentData?.description && currentData.description.length > 200 && (
                  <button type="button" onClick={toggleExpanded} className={styles.expandButton}>
                    {isExpanded ? 'Ver menos' : 'Ver más'}
                  </button>
                )}
              </div>
              <Br />

              <div className={styles.statsContainer}>
                <div className={styles.statItem}>
                  <IconLike color={'var(--cAccent)'} size={24} />
                  <span>{currentData?.likes || 0} Apoyos</span>
                </div>
                <div
                  className={styles.statItem}
                  onClick={handleOpenComments}
                  style={{ cursor: 'pointer' }}
                >
                  <IconComment color={'var(--cAccent)'} size={24} />
                  <span>{commentsCount} Comentarios</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </DataModal>

      <DataModal
        open={openDeleteModal}
        onClose={() => setOpenDeleteModal(false)}
        onSave={confirmDelete}
        title="Eliminar publicación"
        buttonText="Eliminar"
        buttonCancel="Cancelar"
        variant="mini"
      >
        <div style={{ padding: '20px', textAlign: 'center' }}>
          <p style={{ margin: '0 0 16px 0', fontSize: '16px' }}>
            ¿Estás seguro de que quieres eliminar esta publicación?
          </p>
          <p style={{ margin: 0, fontSize: '14px', color: 'var(--cWhiteV1)' }}>
            Esta acción no se puede deshacer.
          </p>
        </div>
      </DataModal>
    </>
  );
};

export default RenderView;
