"use client";
import React, { useEffect, useState } from 'react';
import styles from './Reel.module.css';
import { Avatar } from '@/mk/components/ui/Avatar/Avatar';
import { getFullName, getUrlImages } from '@/mk/utils/string';
import { getDateTimeAgo } from '@/mk/utils/date';
import { IconComment, IconLike } from '@/components/layout/icons/IconsBiblioteca';
import useAxios from '@/mk/hooks/useAxios';
import { useAuth } from '@/mk/contexts/AuthProvider';

const Reel = () => {
  const { user } = useAuth();
  const [contents, setContents] = useState<any[]>([]);
  const [loading, setLoading] = useState(true); // Estado de carga inicial del componente

  const {
    data,
    loaded, // Estado 'loaded' del hook useAxios
    error,  // Es crucial manejar el estado de error del hook
    reLoad, 
  } = useAxios("/contents", "GET", {
    perPage: 20,
    page: 1, // Aún no hay paginación aquí, carga solo la página 1
    fullType: "L",
    searchBy: ""
  });

  const { execute: executeLike } = useAxios();

  const handleLike = async (contentId: number) => {
    try {
      const response = await executeLike('/content-like', 'POST', { id: contentId });
      if (response?.data) {
        setContents(prevContents => 
          prevContents.map(content => {
            if (content.id === contentId) {
              return {
                ...content,
                liked: content.liked ? 0 : 1,
                likes: content.liked ? (content.likes > 0 ? content.likes - 1 : 0) : (content.likes || 0) + 1
              };
            }
            return content;
          })
        );
      }
    } catch (err) {
      console.error('Error al dar like:', err);
    }
  };

  useEffect(() => {
    // Este efecto se ejecuta cuando 'data', 'loaded', o 'error' del hook useAxios cambian.
    
    // Es importante verificar 'loaded' del hook useAxios.
    // Si 'loaded' es true, significa que la petición de useAxios (para la carga inicial) ha terminado.
    if (loaded) {
      if (error) {
        console.error("Error al cargar publicaciones:", error);
        setContents([]); // Limpia el contenido si hay un error
        // Aquí podrías añadir un estado para mostrar un mensaje de error al usuario
      } else if (data?.data && Array.isArray(data.data)) {
        // Si hay datos y data.data es un array (incluso vacío)
        setContents(data.data.map((item: any) => ({ 
          ...item, 
          likes: item.likes || 0, 
          comments_count: item.comments_count || 0 
        })));
      } else {
        // Si 'loaded' es true, no hay error, pero no hay data.data o no es un array
        setContents([]); 
      }
      // Una vez que la data (o error) ha sido procesada después de que 'loaded' es true,
      // podemos estar seguros de desactivar el estado de carga del componente.
      setLoading(false);
    }
  }, [data, loaded, error]); // Asegúrate de incluir 'error' en las dependencias

  if (loading) {
    return <div className={styles.loadingState}>Cargando publicaciones...</div>;
  }

  return (
    <div className={styles.reelContainer}>
      {contents?.length > 0 ? (
        contents.map((item: any) => (
          <article key={item.id} className={styles.contentCard}>
            <header className={styles.contentHeader}>
              <div className={styles.userInfo}>
                <Avatar
                  name={getFullName(item?.user)}
                  src={getUrlImages(
                    "/ADM-" +
                    item?.user?.id +
                    ".webp?d=" +
                    item?.user?.updated_at
                  )}
                  w={44}
                  h={44}
                />
                <div className={styles.userDetails}>
                  <span className={styles.userName}>{getFullName(item?.user) || 'Usuario Desconocido'}</span>
                  <span className={styles.userRole}>Administrador</span>
                </div>
              </div>
              <time dateTime={item?.created_at} className={styles.postDate}>
                {getDateTimeAgo(item?.created_at)}
              </time>
            </header>

            <section className={styles.contentBody}>
              {item?.title && <h2 className={styles.contentTitle}>{item?.title}</h2>}
              {item?.description && <p className={styles.contentDescription}>{item?.description}</p>}
              
              {item?.images && item?.images[0] && (
                <div className={styles.contentImageContainer}>
                  <img
                    src={getUrlImages(
                      "/CONT-" +
                      item?.id +
                      "-" +
                      item?.images[0]?.id +
                      ".webp" +
                      "?" +
                      item?.updated_at
                    )}
                    alt={item?.title || 'Imagen de la publicación'}
                    className={styles.image}
                    loading="lazy"
                  />
                </div>
              )}
            </section>
            
            <footer className={styles.contentFooter}>
              <div className={styles.contentStats}>
                <button 
                  className={`${styles.statItem} ${item?.liked ? styles.liked : ''}`} 
                  onClick={() => handleLike(item.id)}
                  aria-pressed={!!item?.liked}
                  aria-label={`Me gusta esta publicación, actualmente tiene ${item.likes} me gusta`}
                >
                 <IconLike color={item?.liked ? 'var(--cInfo)' : 'var(--cWhiteV1)'} />
                  <span>{item.likes}</span>
                </button>
                <button 
                  className={styles.statItem}
                  aria-label={`Comentar esta publicación, actualmente tiene ${item.comments_count} comentarios`}
                >
                  <IconComment color={'var(--cWhiteV1)'} />
                  <span>{item.comments_count}</span>
                </button>
              </div>
            </footer>
          </article>
        ))
      ) : (
        // Este mensaje se mostrará si loading es false y contents está vacío
        <div className={styles.noContentState}>
          Aún no hay publicaciones para mostrar.
        </div>
      )}
    </div>
  );
};

export default Reel;