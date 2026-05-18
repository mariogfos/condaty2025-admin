// import { redirect } from "next/navigation";
"use client";
import { useRouter } from "next/navigation";
import { CSSProperties } from "react";
import styles from "./headTitle.module.css";
import { IconArrowLeft } from "../layout/icons/LucideIcons";

type PropsType = {
  title?: string | null;
  backUrl?: string;
  className?: string;
  style?: CSSProperties;
  onBack?: any;
  left?: any;
  right?: any;
  customTitle?: any;
  leftAriaLabel?: string;
  colorBack?: string;
  colorTitle?: string;
};

const HeadTitle = ({
  title = null,
  backUrl = "/",
  className = "",
  onBack = null,
  style = {},
  left = null,
  right = null,
  customTitle = null,
  leftAriaLabel = "Volver",
  colorBack = "var(--cWhite)",
  colorTitle = "var(--cWhite)",
}: PropsType) => {
  const router = useRouter();
  const goBack = () => {
    if (onBack) {
      onBack();
      return;
    }
    if (backUrl != "") {
      router.push(backUrl);
      return;
    }
    router.back();
  };
  return (
    <div style={style} className={styles.headTitle + " " + className}>
      <div className={styles.sideSlot}>
        {left !== false && (
          <span className={styles.actionSlot} role="button" aria-label={leftAriaLabel}>
            {left !== null ? left : <IconArrowLeft onClick={goBack} color={colorBack} size={24} />}
          </span>
        )}
      </div>
      <div
        className={styles.titleSlot}
        style={{
          color: colorTitle,
        }}
      >
        {customTitle ? (
          customTitle
        ) : (
          <p
            style={{ color: 'inherit', cursor: 'pointer' }}
            onClick={goBack}
            role="button"
            aria-label="Volver"
          >
            {title}
          </p>
        )}
      </div>
      <div className={styles.sideSlot}>
        {right ? <span className={styles.actionSlot}>{right}</span> : null}
      </div>
    </div>
  );
};

export default HeadTitle;
