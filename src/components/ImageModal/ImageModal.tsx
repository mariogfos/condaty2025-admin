"use client";
import { useEffect, useState } from 'react';
import styles from './imageModal.module.css';
import { IconX } from '@/components/layout/icons/IconsBiblioteca';

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
        <IconX
          className={styles.closeButton}
          size={40}
          onClick={handleClose}
          circle
          style={{ backgroundColor: "transparent", padding: "0px" }}
        />
        <img 
          src={imageUrl} 
          alt={altText || 'Expanded image'} 
          className={styles.modalImage}
        />
      </div>
    </div>
  );
};