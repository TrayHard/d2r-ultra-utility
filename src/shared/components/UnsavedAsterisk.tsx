import React from "react";
import Icon from "@mdi/react";
import { mdiAsteriskCircleOutline } from "@mdi/js";
import { useSettings } from "../../app/providers/SettingsContext";

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
  color,
}) => {
  const { appConfig } = useSettings();
  const resolvedColor = color || appConfig?.asteriskColor || "#F59E0B";
  return (
    <span
      className={`asterisk-icon pointer-events-none select-none ${className ?? ""}`}
      style={style}
      aria-label={title || "Unsaved changes"}
      title={title}
    >
      <Icon path={mdiAsteriskCircleOutline} size={size} color={resolvedColor} />
    </span>
  );
};

export default UnsavedAsterisk;
