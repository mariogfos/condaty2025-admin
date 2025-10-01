"use client";
import { useEffect, useState } from 'react';
import styles from './imageModal.module.css';

type ImageModalProps = {
  isOpen: boolean;
  onClose: () => void;
  imageUrl?: string;
  altText?: string;
}

export const ImageModal = ({ isOpen, onClose, imageUrl, altText }: ImageModalProps) => {
  const [show, setShow] = useState(false);

  useEffect(() => {
    setShow(isOpen);
  }, [isOpen]);

  if (!show || !imageUrl) return null;

  const handleClose = () => {
    setShow(false);
    onClose();
  };

  return (
    <div 
      className={styles.modalOverlay}
      onClick={handleClose}
      role="presentation"
    >
      <div 
        className={styles.modalContent}
        onClick={e => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
      >
        <button 
          className={styles.closeButton}
          onClick={handleClose}
          aria-label="Close modal"
        >
          ×
        </button>
        <img 
          src={imageUrl} 
          alt={altText || 'Expanded image'} 
          className={styles.modalImage}
        />
      </div>
    </div>
  );
};