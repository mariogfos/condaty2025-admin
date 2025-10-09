import { Avatar } from "@/mk/components/ui/Avatar/Avatar";
import { Image } from "@/mk/components/ui/Image/Image";
import DataModal from "@/mk/components/ui/DataModal/DataModal";
import { getFullName, getUrlImages } from "@/mk/utils/string";
import { getDateTimeStrMesShort } from "@/mk/utils/date";
import ReactPlayer from "react-player";
import { useState, useCallback, useMemo, useEffect } from "react";
import { useAuth } from "@/mk/contexts/AuthProvider";
import styles from "./RenderView.module.css";
import {
  IconLike,
  IconComment,
  IconEdit,
  IconTrash,
  IconArrowLeft,
  IconArrowRight,
  IconPDF,
  IconImage
} from "@/components/layout/icons/IconsBiblioteca";
import Br from "@/components/Detail/Br";
import useAxios from "@/mk/hooks/useAxios";

const RenderView = (props: {
  open: boolean;
  onClose: any;
  item: Record<string, any>;
  onEdit?: (item: any) => void;
  onDelete?: (item: any) => void;
  reLoad?: () => void;

  onOpenComments?: (contentId: number, contentData: any) => void;
  selectedContentData?: any;
  contentId?: number;
  showActions?: boolean;
}) => {
  const { data } = props?.item || {};
  const { showToast } = useAuth();
  const [isExpanded, setIsExpanded] = useState(false);
  const [indexVisible, setIndexVisible] = useState(0);
  const [contentData, setContentData] = useState(null);
  const [loading, setLoading] = useState(false);
  const { execute } = useAxios();

  const currentData = props.selectedContentData || contentData || data;

  useEffect(() => {
    const fetchContentDetails = async () => {
      if (props.open && props.contentId && !props.selectedContentData && !data) {
        setLoading(true);
        try {
          const response = await execute(
            '/contents',
            'GET',
            {
              fullType: 'DET',
              searchBy: props.contentId,
              page: 1,
              perPage: 1,
            },
            false,
            true
          );

          if (response?.data?.data) {
            setContentData(response.data.data);
          }
        } catch (error) {
          console.error('Error fetching content details:', error);
          if (showToast) {
            showToast('Error al cargar los detalles del contenido', 'error');
          }
        } finally {
          setLoading(false);
        }
      }
    };

    fetchContentDetails();
  }, [props.open, props.contentId, props.selectedContentData, data, execute, showToast]);

  useEffect(() => {
    if (!props.open) {
      setContentData(null);
      setIndexVisible(0);
      setIsExpanded(false);
    }
  }, [props.open]);

  const commentsCount = useMemo(() => {
    return currentData?.comments?.length || currentData?.comments_count || 0;
  }, [currentData?.comments, currentData?.comments_count]);

  const toggleExpanded = useCallback(() => setIsExpanded(!isExpanded), [isExpanded]);

  const nextIndex = useCallback(() => {
    setIndexVisible((prevIndex) => (prevIndex + 1) % currentData?.images?.length);
  }, [currentData?.images?.length]);

  const prevIndex = useCallback(() => {
    setIndexVisible((prevIndex) =>
      prevIndex === 0 ? currentData?.images?.length - 1 : prevIndex - 1
    );
  }, [currentData?.images?.length]);

  const handleEdit = useCallback(() => {
    const itemForEdit = {
      ...currentData,
      id: currentData.id,
      title: currentData.title || '',
      description: currentData.description || '',
      type: currentData.type,
      url: currentData.url || '',
      images: currentData.images || [],
      user_id: currentData.user_id,
      destiny: currentData.destiny || 0,
      client_id: currentData.client_id,
      status: currentData.status,
      created_at: currentData.created_at,
      updated_at: currentData.updated_at,
      cdestinies: currentData.cdestinies || [],
      lDestiny: currentData.lDestiny || [],
    };

    props.onClose();
    if (props.onEdit) {
      props.onEdit(itemForEdit);
    }
  }, [currentData, props]);

  const handleDelete = useCallback(() => {
    if (props.onDelete) {
      props.onDelete(currentData);
    }
  }, [currentData, props]);

  const handleOpenComments = useCallback(() => {
    if (props.onOpenComments) {
      props.onOpenComments(currentData?.id, currentData);
    }
  }, [props.onOpenComments, currentData]);

  const getDocumentUrl = () => {
    if (currentData?.type === 'D' && currentData?.id && currentData?.url) {
      return getUrlImages(`/CONT-${currentData.id}.pdf?d=${currentData.updated_at}`);
    }
    return null;
  };

  const hasDocument = () => {
    return currentData?.type === 'D' && currentData?.url && currentData?.url !== 'null';
  };

  const hasImages = () => {
    return currentData?.type === 'I' && currentData?.images && currentData?.images.length > 0 && currentData?.images[indexVisible]?.id;
  };

  return (

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
              {(props.showActions ?? true) && (
                <>
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
                </>
              )}
            </div>
          </div>
          <Br />
          <div className={styles.content}>
            <div className={styles.imageContainer}>
              {currentData?.type === 'I' ? (
                hasImages() ? (
                  <div>
                    <div className={styles.imageWrapper}>
                      <Image
                        alt="Imagen de la publicación"
                        src={getUrlImages(
                          '/CONT-' + currentData.id + '-' + currentData.images[indexVisible]?.id + '.webp' + '?' + currentData?.updated_at
                        )}
                        square={true}
                        expandable={true}
                        objectFit="contain"
                        borderRadius="var(--bRadiusM)"
                        style={{ width: '100%', height: '100%' }}
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
                  </div>
                ) : (
                  /* Mostrar mensaje de imagen no disponible */
                  <div className={styles.imageWrapper} style={{
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '16px',
                    padding: '40px'
                  }}>
                    <IconImage size={120} color="var(--cWhiteV1)" />
                    <div style={{ textAlign: 'center' }}>
                      <p style={{ color: 'var(--cWhite)', fontSize: '16px', margin: '0 0 8px 0' }}>
                        Imagen no disponible
                      </p>
                      <p style={{ color: 'var(--cWhiteV1)', fontSize: '14px', margin: '0' }}>
                        La imagen fue eliminada y no se pudo cargar.
                      </p>
                    </div>
                  </div>
                )
              ) : currentData?.type === 'V' ? (
                <ReactPlayer url={currentData?.url} width="100%" height="100%" controls />
              ) : currentData?.type === 'D' ? (
                /* Mostrar documento o mensaje de no disponible */
                <div className={styles.imageWrapper} style={{
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '16px',
                  padding: '40px'
                }}>
                  <IconPDF size={120} color={hasDocument() ? "var(--cWhite)" : "var(--cWhiteV1)"} />
                  <div style={{ textAlign: 'center' }}>
                    <p style={{ color: 'var(--cWhite)', fontSize: '16px', margin: '0 0 8px 0' }}>
                      {hasDocument() ? (currentData?.title || 'Documento') : 'Documento no disponible'}
                    </p>
                    <p style={{ color: 'var(--cWhiteV1)', fontSize: '14px', margin: '0 0 16px 0' }}>
                      {hasDocument()
                        ? (currentData?.description?.substring(0, 100) + (currentData?.description?.length > 100 ? '...' : ''))
                        : 'El documento fue eliminado y no se pudo cargar.'
                      }
                    </p>
                    {/* Solo mostrar el botón si el documento existe */}
                    {hasDocument() && getDocumentUrl() && (
                      <a
                        href={getDocumentUrl() || undefined}
                        target="_blank"
                        rel="noopener noreferrer"
                        style={{
                          color: 'var(--cAccent)',
                          textDecoration: 'none',
                          fontSize: '14px',
                          fontWeight: '600',
                          padding: '8px 16px',
                          border: '1px solid var(--cAccent)',
                          borderRadius: '6px',
                          display: 'inline-block',
                          transition: 'all 0.2s ease'
                        }}
                        onMouseOver={(e) => {
                          e.currentTarget.style.backgroundColor = 'var(--cAccent)';
                          e.currentTarget.style.color = 'var(--cWhite)';
                        }}
                        onMouseOut={(e) => {
                          e.currentTarget.style.backgroundColor = 'transparent';
                          e.currentTarget.style.color = 'var(--cAccent)';
                        }}
                      >
                        Abrir documento
                      </a>
                    )}
                  </div>
                </div>
              ) : (
                <div className={styles.noImageText}>Sin contenido disponible</div>
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

  );
};

export default RenderView;
