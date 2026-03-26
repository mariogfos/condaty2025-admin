import React from "react";
import { shouldIgnoreValueTranslationContext } from "@/i18n/translationGuards";
import styles from "./Detail.module.css";
interface Props {
  value: string;
  label: string;
  colorValue?: string;
}
const LabelValueDetail = ({ value, label, colorValue }: Props) => {
  const ignoreValueTranslation = shouldIgnoreValueTranslationContext({ label });

  return (
    <div className={styles.LabelValueDetail}>
      <p>{label}</p>
      <p
        data-i18n-ignore={ignoreValueTranslation ? "true" : undefined}
        style={{
          color: colorValue ? colorValue : "var(--cWhite)",
        }}
      >
        {value}
      </p>
    </div>
  );
};
export default LabelValueDetail;
