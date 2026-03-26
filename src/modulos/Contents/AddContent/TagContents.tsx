import React from "react";
import style from "./AddContent.module.css";
type PropsType = {
  icon: any;
  text: string;
  onClick: any;
  isActive: boolean;
  disabled?: boolean;
};
const TagContents = ({
  icon,
  text,
  onClick,
  isActive,
  disabled = false,
}: PropsType) => {
  const _onClick = () => {
    if (disabled) {
      return;
    }
    onClick();
  };
  return (
    <div
      className={style.TagContents}
      style={{ backgroundColor: isActive ? "var(--cBlackV3)" : undefined }}
      onClick={_onClick}
    >
      {icon}
      <p>{text}</p>
    </div>
  );
};

export default TagContents;
