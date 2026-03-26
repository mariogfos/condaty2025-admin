import React from 'react';
import styles from './IconoModal.module.css';

interface IconoModalProps {
  icon: React.ReactNode;
}

const IconoModal = ({ icon }: IconoModalProps) => {
  return (
    <div className={styles.container}>
      <div className={styles.wrapper}>
        <div className={styles.iconContainer}>{icon}</div>
      </div>
    </div>
  );
};

export default IconoModal;