"use client";
import { createContext, useContext, useState, useMemo } from 'react';
import { ImageModal } from '@/components/ImageModal/ImageModal';

type ImageModalContextType = {
  openModal: (imageUrl: string, altText?: string) => void;
  closeModal: () => void;
}

const ImageModalContext = createContext<ImageModalContextType | undefined>(undefined);

export const useImageModal = () => {
  const context = useContext(ImageModalContext);
  if (!context) {
    throw new Error('useImageModal must be used within an ImageModalProvider');
  }
  return context;
};

export const ImageModalProvider = ({ children }: { children: React.ReactNode }) => {
  const [modalState, setModalState] = useState({
    isOpen: false,
    imageUrl: '',
    altText: '',
  });

  const openModal = (imageUrl: string, altText?: string) => {
    setModalState({ isOpen: true, imageUrl, altText: altText || '' });
  };

  const closeModal = () => {
    setModalState(prev => ({ ...prev, isOpen: false }));
  };

  const contextValue = useMemo(
    () => ({
      openModal,
      closeModal,
    }),
    []
  );

  return (
    <ImageModalContext.Provider value={contextValue}>
      {children}
      <ImageModal
        isOpen={modalState.isOpen}
        onClose={closeModal}
        imageUrl={modalState.imageUrl}
        altText={modalState.altText}
      />
    </ImageModalContext.Provider>
  );
};