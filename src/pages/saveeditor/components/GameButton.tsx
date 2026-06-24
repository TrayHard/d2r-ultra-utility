import React from "react";

interface GameButtonProps {
  children: React.ReactNode;
  onClick?: () => void;
  disabled?: boolean;
  danger?: boolean;
  active?: boolean;
  title?: string;
  size?: "sm" | "md";
  className?: string;
}

/** A Diablo-styled button: stone face, beveled gold border, Exocet-like font. */
const GameButton: React.FC<GameButtonProps> = ({
  children,
  onClick,
  disabled = false,
  danger = false,
  active = false,
  title,
  size = "md",
  className = "",
}) => {
  return (
    <button
      type="button"
      title={title}
      disabled={disabled}
      onClick={onClick}
      className={`relative uppercase tracking-wider whitespace-nowrap transition-[filter,transform] enabled:hover:brightness-125 enabled:active:translate-y-px ${
        size === "sm" ? "px-2.5 py-1 text-[10px]" : "px-4 py-1.5 text-xs"
      } ${className}`}
      style={{
        fontFamily: '"Diablo", serif',
        color: disabled ? "#6b6356" : danger ? "#e7a896" : "#e8d39a",
        background: active
          ? "linear-gradient(180deg,#41391f,#1c1810)"
          : "linear-gradient(180deg,#2b2620,#14110b)",
        border: `1px solid ${danger ? "rgba(150,70,50,0.75)" : "rgba(150,120,60,0.7)"}`,
        boxShadow:
          "inset 0 1px 0 rgba(205,175,95,0.18), inset 0 -2px 5px rgba(0,0,0,0.6), 0 1px 2px rgba(0,0,0,0.5)",
        borderRadius: 3,
        opacity: disabled ? 0.5 : 1,
        cursor: disabled ? "not-allowed" : "pointer",
        textShadow: "0 1px 2px #000",
      }}
    >
      {children}
    </button>
  );
};

export default GameButton;
