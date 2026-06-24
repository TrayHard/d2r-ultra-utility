import React from "react";
import { useTranslation } from "react-i18next";
import type { D2SCharacterProfile } from "d2r-saver";
import { CLASS_NAMES } from "../../../shared/saveeditor/constants";

const NATIVE_W = 1162;
const NATIVE_H = 1507;
const BG = "/saveeditor-assets/panel/character_bg.png";

interface CharacterStatsPanelProps {
  profile: D2SCharacterProfile;
  width?: number;
}

/** Read a stored stat; life/mana/stamina are 8.8 fixed-point. */
const fp = (v: number | undefined) => Math.round((v ?? 0) / 256);

const CharacterStatsPanel: React.FC<CharacterStatsPanelProps> = ({
  profile,
  width = 440,
}) => {
  const { t } = useTranslation();
  const a = profile.attributes ?? {};
  const W = width;
  const H = (width * NATIVE_H) / NATIVE_W;

  // value box (right cell of each labelled box): centered text at a fraction
  const valBox = (
    x: number,
    y: number,
    w: number,
    value: React.ReactNode,
    size = 0.024
  ) => (
    <div
      className="absolute flex items-center justify-center"
      style={{
        left: x * W,
        top: y * H,
        width: w * W,
        height: 0.03 * H,
        fontFamily: '"Diablo", serif',
        color: "#c9d2ff",
        fontSize: Math.max(11, size * H),
        textShadow: "0 1px 2px #000",
      }}
    >
      {value}
    </div>
  );

  const label = (
    x: number,
    y: number,
    w: number,
    text: string,
    color = "#cdba88"
  ) => (
    <div
      className="absolute flex items-center justify-center text-center"
      style={{
        left: x * W,
        top: y * H,
        width: w * W,
        height: 0.028 * H,
        fontFamily: '"Diablo", serif',
        color,
        fontSize: Math.max(9, 0.018 * H),
        letterSpacing: 0.5,
        textShadow: "0 1px 2px #000",
      }}
    >
      {text}
    </div>
  );

  return (
    <div
      className="relative select-none"
      style={{ width: W, height: H, backgroundImage: `url(${BG})`, backgroundSize: "100% 100%" }}
    >
      {/* Name / class / level + experience */}
      {label(0.06, 0.078, 0.5, profile.name || "—", "#e8d39a")}
      {label(
        0.06,
        0.108,
        0.6,
        `${t("saveEditor.character.level")} ${profile.level} ${
          CLASS_NAMES[profile.class] ?? profile.class
        }`,
        "#9a8a66"
      )}
      {valBox(0.55, 0.055, 0.4, (a.experience ?? 0).toLocaleString(), 0.018)}

      {/* Left column attributes (label + value) */}
      {label(0.06, 0.283, 0.18, t("saveEditor.character.strength"))}
      {valBox(0.255, 0.283, 0.13, a.strength ?? 0)}
      {label(0.06, 0.452, 0.18, t("saveEditor.character.dexterity"))}
      {valBox(0.255, 0.452, 0.13, a.dexterity ?? 0)}
      {label(0.06, 0.621, 0.18, t("saveEditor.character.vitality"))}
      {valBox(0.255, 0.621, 0.13, a.vitality ?? 0)}
      {label(0.06, 0.731, 0.18, t("saveEditor.character.energy"))}
      {valBox(0.255, 0.731, 0.13, a.energy ?? 0)}

      {/* Right column pools (current values; computed combat stats omitted) */}
      {label(0.55, 0.49, 0.18, t("saveEditor.stats.stamina"))}
      {valBox(0.78, 0.49, 0.16, fp(a.stamina))}
      {label(0.55, 0.585, 0.18, t("saveEditor.stats.life"))}
      {valBox(0.78, 0.585, 0.16, fp(a.hitpoints))}
      {label(0.55, 0.68, 0.18, t("saveEditor.stats.mana"))}
      {valBox(0.78, 0.68, 0.16, fp(a.mana))}

      {/* Points remaining + gold (bottom) */}
      {label(
        0.06,
        0.83,
        0.42,
        `${t("saveEditor.stats.statPoints")}: ${a.statpts ?? 0}`,
        "#9a8a66"
      )}
      {label(
        0.06,
        0.862,
        0.42,
        `${t("saveEditor.stats.skillPoints")}: ${a.newskills ?? 0}`,
        "#9a8a66"
      )}
      {label(0.52, 0.83, 0.42, `${t("saveEditor.character.gold")}: ${(a.gold ?? 0).toLocaleString()}`, "#9a8a66")}
      {label(
        0.52,
        0.862,
        0.42,
        `${t("saveEditor.character.goldStash")}: ${(a.goldbank ?? 0).toLocaleString()}`,
        "#9a8a66"
      )}
    </div>
  );
};

export default CharacterStatsPanel;
