import React from "react";
import { formatBs } from "@/mk/utils/numbers";

interface FormatBsAlignProps {
  value: number | string;
  left?: boolean;
  className?: string;
}

const FormatBsAlign: React.FC<FormatBsAlignProps> = ({
  value,
  left = false,
  className,
}) => {
  return (
    <div
      style={{
        width: "100%",
        display: "flex",
        justifyContent: left ? "flex-start" : "flex-end",
        alignItems: "center",
      }}
      className={className}
    >
      {formatBs(value)}
    </div>
  );
};

export default FormatBsAlign;
