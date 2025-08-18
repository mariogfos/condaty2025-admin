'use client';
import styles from '../DashDptos.module.css';

interface TitleRenderProps {
  title: string;
  onClick?: () => void;
}

const TitleRender = ({ title, onClick }: TitleRenderProps) => {
  return (
    <div className={styles.titleContainer}>
      <h3 className={styles.accountTitle}>{title}</h3>
      {onClick && (
        <button
          className={styles.viewMore}
          onClick={onClick}
          type="button"
        >
          Ver más
        </button>
      )}
    </div>
  );
};

export default TitleRender;
