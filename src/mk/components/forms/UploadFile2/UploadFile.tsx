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

      setUploading(true);
      setError(null);
      onUploadStateChange?.(true);

      const newValues = [...currentValues];

      for (const file of Array.from(files)) {
        const fileExt = file.name.split('.').pop()?.toLowerCase();

        // Validar extensión
        if (!allowedExts.includes('*') && (!fileExt || !allowedExts.includes(fileExt))) {
          setError(`Formato no permitido: .${fileExt}`);
          continue;
        }

        const path = getPath(file.name);

        try {
          // Si es modo single y ya hay un archivo, eliminar el anterior
          if (isSingle && currentValues.length > 0 && currentValues[0]) {
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

          const uploaded: StorageFile = await storage.upload(file, path);
          newValues.push(uploaded.url);
        } catch (e) {
          console.error(e);
          setError('No se pudo subir el archivo');
        }
      }

      setFormState((prev: any) => ({
        ...prev,
        [name]: isSingle ? [newValues[newValues.length - 1] || ''] : newValues,
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
    async (url: string) => {
      if (!url || typeof url !== 'string') return;

      // Extraer path de la URL
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
      }

      const filtered = currentValues.filter((u: string) => u !== url);
      setFormState((prev: any) => ({
        ...prev,
        [name]: isSingle ? [] : filtered,
      }));
    },
    [currentValues, isSingle, setFormState]
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
              accept={type === 'I' ? 'image/*' : type === 'D' ? '.pdf,.doc,.docx,.xls,.xlsx,.csv,.txt' : '*'}
              onChange={handleFileSelect}
              style={{ display: 'none' }}
              multiple={false}
            />

            {!hasContent() ? (
              <div onClick={openFileInput}>
                {type === 'I' ? (
                  <div className={styles.placeholderIcon}><IconImage size={40} color={"var(--cWhite)"} /></div>
                ) : (
                  <div className={styles.placeholderIcon}><IconDocs size={40} color={"var(--cWhite)"} /></div>
                )}
                <span>{label}</span>
                <span>{allowedExts.join(', ')}</span>
              </div>
            ) : (
              <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
                {type === 'I' ? (
                  <img
                    src={singleValue}
                    alt="Uploaded"
                    className={styles.image}
                  />
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
                  style={{
                    backgroundColor: 'var(--cPrimary)',
                    borderRadius: '50%',
                    width: '30px',
                    height: '30px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    cursor: 'pointer',
                    border: 'none',
                  }}
                >
                  <IconEdit size={16} color="white" />
                </button>
                <button
                  onClick={() => removeFile(currentValues[0])}
                  style={{
                    backgroundColor: 'var(--cError)',
                    borderRadius: '50%',
                    width: '30px',
                    height: '30px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    cursor: 'pointer',
                    border: 'none',
                  }}
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

  // Modo múltiple - simplificado
  return (
    <div>
      <input
        ref={fileInputRef}
        type="file"
        accept={type === 'I' ? 'image/*' : type === 'D' ? '.pdf,.doc,.docx,.xls,.xlsx,.csv,.txt' : '*'}
        onChange={handleFileSelect}
        style={{ display: 'none' }}
        multiple={cant > 1}
      />
      <div className={styles.multipleContainer}>
        {currentValues.map((url: string, i: number) => (
          <div key={i} className={styles.fileItem}>
            <button
              className={styles.removeButton}
              onClick={() => removeFile(url)}
            >
              ✕
            </button>
            <img src={url} alt={`File ${i}`} className={styles.fileImage} />
          </div>
        ))}
        {currentValues.length < cant && (
          <div className={styles.addButton} onClick={openFileInput}>
            {uploading ? 'Subiendo...' : '➕'}
          </div>
        )}
      </div>
      {error && <div className={styles.error}>{error}</div>}
      {required && currentValues.length === 0 && <div className={styles.required}>Campo obligatorio</div>}
    </div>
  );
};

export default UploadFile;