import React from "react";
import Icon from "@mdi/react";
import { mdiAsteriskCircleOutline } from "@mdi/js";

interface UnsavedAsteriskProps {
  size?: number;
  className?: string;
  style?: React.CSSProperties;
  title?: string;
  color?: string;
}

const UnsavedAsterisk: React.FC<UnsavedAsteriskProps> = ({
  size = 0.6,
  className,
  style,
  title,
  color = "#F59E0B",
}) => {
  return (
    <span
      className={`asterisk-icon pointer-events-none select-none ${className ?? ""}`}
      style={style}
      aria-label={title || "Unsaved changes"}
      title={title}
    >
      <Icon path={mdiAsteriskCircleOutline} size={size} color={color} />
    </span>
  );
};

export default UnsavedAsterisk;
