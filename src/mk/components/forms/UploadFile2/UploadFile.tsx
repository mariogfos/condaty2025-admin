// src/mk/components/forms/UploadFile2/UploadFile.tsx
'use client';

import React, { useState, useRef, useCallback } from 'react';
import { storage } from '../../../services/storage/storage.service';
import type { StorageFile } from '../../../services/storage/types';
import styles from './UploadFile.module.css';
import { IconDocs, IconEdit, IconImage, IconTrash } from '@/components/layout/icons/IconsBiblioteca';

interface UploadFileProps {
  setFormState: (updater: (prev: any) => any) => void;
  formState: any;
  name: string;
  label?: string;
  type?: 'I' | 'D' | 'A'; // I: Images, D: Documents, A: All
  cant?: number; // Max number of files
  required?: boolean;
  ext?: string; // Allowed extensions, comma separated
  prefix?: string;
  global?: boolean;
  clientId?: string;
  style?: React.CSSProperties;
  variant?: 'V1' | 'V2';
  onUploadStateChange?: (isUploading: boolean) => void;
}

const UploadFile: React.FC<UploadFileProps> = ({
  setFormState,
  formState,
  name,
  label = 'Cargar un archivo o arrastrar y soltar',
  type = 'I',
  cant = 1,
  required = false,
  ext,
  prefix = '',
  global = false,
  clientId,
  style,
  variant = 'V1',
  onUploadStateChange,
}) => {
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isDraggingFile, setIsDraggingFile] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const currentValues: string[] = formState[name] || [];
  const isSingle = cant === 1;

  // Determinar extensiones permitidas según el tipo
  let defaultExts = '';
  if (type === 'I') {
    defaultExts = 'jpg,jpeg,png,webp';
  } else if (type === 'D') {
    defaultExts = 'pdf,doc,docx,xls,xlsx,csv,txt';
  } else if (type === 'A') {
    defaultExts = '*';
  }

  const allowedExts = ext
    ? ext.toLowerCase().split(',').map(e => e.trim().replace('.', ''))
    : defaultExts === '*'
    ? ['*']
    : defaultExts.split(',').map(e => e.trim().replace('.', ''));

  // Determinar si hay extensiones de imagen y/o documento
  const imageExts = ['jpg', 'jpeg', 'png', 'webp', 'gif', 'bmp'];
  const docExts = ['pdf', 'doc', 'docx', 'xls', 'xlsx', 'csv', 'txt'];
  const hasImageExt = allowedExts.some(e => imageExts.includes(e) || e === '*');
  const hasDocExt = allowedExts.some(e => docExts.includes(e) || e === '*');

  // Construir el accept dinámicamente
  let accept = '';
  if (allowedExts.includes('*')) {
    accept = '*';
  } else {
    const acceptArr: string[] = [];
    if (hasImageExt) acceptArr.push('image/*');
    if (hasDocExt) acceptArr.push('.pdf,.doc,.docx,.xls,.xlsx,.csv,.txt');
    // Agregar otras extensiones personalizadas
    const otherExts = allowedExts.filter(e => !imageExts.includes(e) && !docExts.includes(e) && e !== '*');
    if (otherExts.length > 0) acceptArr.push(...otherExts.map(e => '.' + e));
    accept = acceptArr.join(',');
  }

  const folder = global ? 'global' : clientId || 'unknown';
  const pref = prefix ? `${prefix}/` : '';

  const getPath = useCallback(
    (filename: string) => {
      const clean = filename.replace(/[^a-zA-Z0-9._-]/g, '_');
      return `${folder}/${pref}${Date.now()}_${clean}`;
    },
    [folder, pref]
  );

  const handleFileSelect = useCallback(
    async (event: React.ChangeEvent<HTMLInputElement>) => {
      const files = event.target.files;
      if (!files || files.length === 0) return;

      // En modo single, permitir reemplazar el archivo existente
      const effectiveCurrentLength = isSingle ? 0 : currentValues.length;
      if (effectiveCurrentLength + files.length > cant) {
        setError(`Máximo ${cant} archivo(s)`);
        return;
      }

      const validFiles: { file: File; path: string }[] = [];
      let validationErrors: string[] = [];

      for (const file of Array.from(files)) {
        const fileExt = file.name.split('.').pop()?.toLowerCase();

        // Validar extensión
        if (!allowedExts.includes('*') && (!fileExt || !allowedExts.includes(fileExt))) {
          validationErrors.push(`Formato no permitido: .${fileExt} para ${file.name}`);
          continue;
        }

        const path = getPath(file.name);
        validFiles.push({ file, path });
      }

      if (validationErrors.length > 0) {
        setError(validationErrors.join('; '));
        return;
      }

      setUploading(true);
      setError(null);
      onUploadStateChange?.(true);

      const uploadPromises = validFiles.map(async ({ file, path }) => {
        try {
          const uploaded: StorageFile = await storage.upload(file, path);
          return { success: true, url: uploaded.url };
        } catch (e) {
          return { success: false, error: e, fileName: file.name };
        }
      });

      const results = await Promise.allSettled(uploadPromises);

      const successfulUrls: string[] = [];
      const uploadErrors: string[] = [];

      results.forEach((result) => {
        if (result.status === 'fulfilled' && result.value.success && result.value.url) {
          successfulUrls.push(result.value.url);
        } else {
          const errorMsg = result.status === 'rejected' ? String(result.reason) : String(result.value?.error || 'Unknown error');
          const fileName = result.status === 'rejected' ? 'unknown' : result.value?.fileName || 'unknown';
          uploadErrors.push(`Error subiendo ${fileName}: ${errorMsg}`);
        }
      });

      if (uploadErrors.length > 0) {
        setError(uploadErrors.join('; '));
      }

      // For single mode, delete old file if new upload succeeded
      if (isSingle && successfulUrls.length > 0 && currentValues.length > 0 && currentValues[0]) {
        const oldUrl = currentValues[0];
        let path = oldUrl;
        if (oldUrl.includes('cloudinary.com')) {
          const match = oldUrl.match(/\/upload\/(?:v\d+\/)?(.+?)(?:\.[^.]+)?$/);
          if (match && match[1]) {
            path = match[1];
          }
        }
        try {
          await storage.delete({ path, url: oldUrl, name: '' });
        } catch (e) {
          console.error('Error deleting old file:', e);
        }
      }

      setFormState((prev: any) => ({
        ...prev,
        [name]: isSingle ? [successfulUrls[0] || ''] : [...currentValues, ...successfulUrls],
      }));

      setUploading(false);
      onUploadStateChange?.(false);

      // Limpiar input
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    },
    [currentValues, cant, allowedExts, getPath, isSingle, setFormState, onUploadStateChange]
  );

  const removeFile = useCallback(
    (url: string) => {
      if (!url || typeof url !== 'string') return;

      // Optimistically remove from UI
      setFormState((prev: any) => {
        const current = prev[name] || [];
        const filtered = current.filter((u: string) => u !== url);
        return {
          ...prev,
          [name]: isSingle ? [] : filtered,
        };
      });

      // Delete in background
      (async () => {
        let path = url;
        if (url.includes('cloudinary.com')) {
          const match = url.match(/\/upload\/(?:v\d+\/)?(.+?)(?:\.[^.]+)?$/);
          if (match && match[1]) {
            path = match[1];
          }
        }
        try {
          await storage.delete({ path, url, name: '' });
        } catch (e) {
          console.error('Error deleting file:', e);
          // Re-add the file to UI if delete failed
          setFormState((prev: any) => ({
            ...prev,
            [name]: isSingle ? [url] : [...(prev[name] || []), url],
          }));
          setError('Error al eliminar el archivo');
        }
      })();
    },
    [isSingle, setFormState, name]
  );

  const openFileInput = () => {
    fileInputRef.current?.click();
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDraggingFile(false);
    // Simular evento de input
    const files = e.dataTransfer.files;
    if (files.length > 0) {
      const fakeEvent = {
        target: { files },
      } as React.ChangeEvent<HTMLInputElement>;
      handleFileSelect(fakeEvent);
    }
  };

  const hasContent = () => {
    return currentValues.length > 0 && currentValues[0] !== '';
  };

  if (isSingle) {
    const singleValue = currentValues[0] || '';

    // Detectar si es imagen o documento
    const getFileType = (url: string) => {
      if (!url) return 'none';
      const ext = url.split('.').pop()?.toLowerCase() || '';
      if (imageExts.includes(ext)) return 'image';
      if (docExts.includes(ext)) return 'doc';
      return 'other';
    };
    const fileType = getFileType(singleValue);

    return (
      <div className={styles.uploadFile} style={{ height: '100%' }}>
        <div style={{ height: '100%' }}>
          <section
            style={{
              borderColor: error
                ? 'var(--cError)'
                : hasContent() || isDraggingFile
                ? 'var(--cPrimary)'
                : 'var(--cWhiteV3)',
              position: 'relative',
            }}
            onDragOver={handleDragOver}
            onDrop={handleDrop}
            onDragEnter={() => setIsDraggingFile(true)}
            onDragLeave={() => setIsDraggingFile(false)}
          >
            <input
              ref={fileInputRef}
              type="file"
              accept={accept}
              onChange={handleFileSelect}
              style={{ display: 'none' }}
              multiple={false}
            />

            {!hasContent() ? (
              <div onClick={openFileInput}>
                {hasImageExt ? (
                  <div className={styles.placeholderIcon}><IconImage size={40} color={"var(--cWhite)"} /></div>
                ) : (
                  <div className={styles.placeholderIcon}><IconDocs size={40} color={"var(--cWhite)"} /></div>
                )}
                <span>{label}</span>
                <span>{allowedExts.join(', ')}</span>
              </div>
            ) : (
              <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', flexDirection: 'column' }}>
                {fileType === 'image' ? (
                  <img
                    src={singleValue}
                    alt="Uploaded"
                    className={styles.image}
                  />
                ) : fileType === 'doc' ? (
                  <>
                    <div className={styles.placeholderIcon}><IconDocs size={40} color={"var(--cWhite)"} /></div>
                    <span style={{ marginTop: 8 }}>{singleValue.split('/').pop()}</span>
                    <a href={singleValue} target="_blank" rel="noopener noreferrer" style={{ color: '#fff', marginTop: 4, textDecoration: 'underline', fontSize: 13 }}>Ver documento</a>
                  </>
                ) : (
                  <>
                    <div className={styles.placeholderIcon}><IconDocs size={40} color={"var(--cWhite)"} /></div>
                    <span>Archivo subido</span>
                  </>
                )}
              </div>
            )}

            {hasContent() && (
              <div className={styles.actionButtons}>
                <button
                  onClick={openFileInput}
                  className={styles.editButton}
                >
                  <IconEdit size={16} color="white" />
                </button>
                <button
                  onClick={() => removeFile(currentValues[0])}
                  className={styles.deleteButton}
                >
                  <IconTrash size={16} color="white" />
                </button>
              </div>
            )}

            {uploading && <div className={styles.uploading}>Subiendo...</div>}
          </section>
        </div>
        {error && <p className={styles.error}>{error}</p>}
      </div>
    );
  }

  // Modo múltiple
  const getFileType = (url: string) => {
    if (!url) return 'none';
    const ext = url.split('.').pop()?.toLowerCase() || '';
    if (imageExts.includes(ext)) return 'image';
    if (docExts.includes(ext)) return 'doc';
    return 'other';
  };

  return (
    <div>
      <input
        ref={fileInputRef}
        type="file"
        accept={accept}
        onChange={handleFileSelect}
        style={{ display: 'none' }}
        multiple={cant > 1}
      />
      <div
        className={`${styles.dropZone} ${isDraggingFile ? styles.dragging : ''}`}
        onDragOver={handleDragOver}
        onDrop={handleDrop}
        onDragEnter={() => setIsDraggingFile(true)}
        onDragLeave={() => setIsDraggingFile(false)}
      >
        <div className={styles.multipleContainer}>
          {currentValues.length < cant && (
            <div className={styles.addButton} onClick={openFileInput}>
              {uploading ? (
                <span className={styles.uploadingText}>Subiendo...</span>
              ) : (
                <>
                  {hasImageExt ? <IconImage size={40} color={"var(--cWhite)"} /> : <IconDocs size={40} color={"var(--cWhite)"} />}
                  <span>{label}</span>
                </>
              )}
            </div>
          )}
          {currentValues.map((url: string, i: number) => {
            const fileType = getFileType(url);
            return (
              <div key={i} className={styles.fileItem}>
                <button
                  className={styles.removeButton}
                  onClick={() => removeFile(url)}
                >
                  ✕
                </button>
                {fileType === 'image' ? (
                  <img src={url} alt={`File ${i}`} className={styles.fileImage} />
                ) : fileType === 'doc' ? (
                  <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                    <IconDocs size={32} color={"var(--cWhite)"} />
                    <span style={{ fontSize: 12, marginTop: 4 }}>{url.split('/').pop()}</span>
                    <a href={url} target="_blank" rel="noopener noreferrer" style={{ color: '#fff', marginTop: 2, textDecoration: 'underline', fontSize: 11 }}>Ver documento</a>
                  </div>
                ) : (
                  <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                    <IconDocs size={32} color={"var(--cWhite)"} />
                    <span style={{ fontSize: 12, marginTop: 4 }}>Archivo</span>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
      {error && <div className={styles.error}>{error}</div>}
      {required && currentValues.length === 0 && <div className={styles.required}>Campo obligatorio</div>}
    </div>
  );
};

export default UploadFile;