import React, { useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import type { D2SCharacterProfile } from "d2r-saver";
import { CLASS_NAMES, BODY_SLOTS } from "../../../shared/saveeditor/constants";
import { useSaveEditor } from "../../../shared/saveeditor/SaveEditorContext";
import {
  XP_TABLE,
  sumStatMaps,
  computeResists,
  type Difficulty,
  type StatMap,
} from "../../../shared/saveeditor/stats";

const NATIVE_W = 1162;
const NATIVE_H = 1507;
const BG = "/saveeditor-assets/panel/character_bg.png";
const EXPFILL = "/saveeditor-assets/panel/expbarfill.png";

/** elementicon letters: f=fire, i=cold(ice), l=lightning, p=poison. */
const RESIST_META = [
  { key: "fire", icon: "elementicon_f", labelKey: "saveEditor.resist.fire" },
  { key: "cold", icon: "elementicon_i", labelKey: "saveEditor.resist.cold" },
  { key: "lightning", icon: "elementicon_l", labelKey: "saveEditor.resist.lightning" },
  { key: "poison", icon: "elementicon_p", labelKey: "saveEditor.resist.poison" },
] as const;

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
  const { describeItem, activeChar } = useSaveEditor();
  const [difficulty, setDifficulty] = useState<Difficulty>(2);

  const a = profile.attributes ?? {};
  const W = width;
  const H = (width * NATIVE_H) / NATIVE_W;

  const items = activeChar?.result.items ?? {};

  // Merge stat maps of every equipped item (base weapon set) for resists, and sum
  // each item's rolled `defense` (the final, ED%-applied value) for total defense.
  const { equipped, itemDefense } = useMemo(() => {
    const maps: StatMap[] = [];
    let def = 0;
    for (const slot of BODY_SLOTS) {
      if (slot.key === "rarm2" || slot.key === "larm2") continue; // skip swap set
      const id = profile.items?.[slot.key];
      if (id == null) continue;
      const item = items[id as number];
      if (!item) continue;
      def += (item as { defense?: number }).defense ?? 0;
      const dto = describeItem(item, items);
      if (dto?.stats) maps.push(dto.stats);
    }
    return { equipped: sumStatMaps(maps), itemDefense: def };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [profile, items]);

  const resists = computeResists(equipped, difficulty);
  const defense = itemDefense + Math.floor((a.dexterity ?? 0) / 4);

  const level = profile.level || 1;
  const exp = a.experience ?? 0;
  const curThreshold = XP_TABLE[level - 1] ?? 0;
  const nextThreshold = XP_TABLE[level] ?? curThreshold;
  const expFill =
    nextThreshold > curThreshold
      ? Math.max(0, Math.min(1, (exp - curThreshold) / (nextThreshold - curThreshold)))
      : 1;

  const valBox = (
    x: number,
    y: number,
    w: number,
    value: React.ReactNode,
    size = 0.024,
    color = "#c9d2ff"
  ) => (
    <div
      className="absolute flex items-center justify-center"
      style={{
        left: x * W,
        top: y * H,
        width: w * W,
        height: 0.03 * H,
        fontFamily: '"Diablo", serif',
        color,
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
    color = "#cdba88",
    align: "center" | "left" = "center"
  ) => (
    <div
      className="absolute flex items-center"
      style={{
        left: x * W,
        top: y * H,
        width: w * W,
        height: 0.028 * H,
        justifyContent: align === "center" ? "center" : "flex-start",
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
      {label(0.06, 0.072, 0.5, profile.name || "—", "#e8d39a", "left")}
      {label(
        0.06,
        0.103,
        0.6,
        `${t("saveEditor.character.level")} ${level} ${CLASS_NAMES[profile.class] ?? profile.class}`,
        "#9a8a66",
        "left"
      )}
      {valBox(0.5, 0.05, 0.45, `${exp.toLocaleString()} / ${nextThreshold.toLocaleString()}`, 0.016, "#cdba88")}

      {/* Experience bar fill */}
      <div
        className="absolute overflow-hidden"
        style={{ left: 0.065 * W, top: 0.137 * H, width: 0.87 * W, height: 0.014 * H }}
      >
        <div
          style={{
            width: `${expFill * 100}%`,
            height: "100%",
            backgroundImage: `url(${EXPFILL})`,
            backgroundSize: "auto 100%",
            backgroundRepeat: "repeat-x",
            opacity: 0.9,
          }}
        />
      </div>

      {/* Left column attributes */}
      {label(0.06, 0.283, 0.18, t("saveEditor.character.strength"))}
      {valBox(0.255, 0.283, 0.13, a.strength ?? 0)}
      {label(0.06, 0.452, 0.18, t("saveEditor.character.dexterity"))}
      {valBox(0.255, 0.452, 0.13, a.dexterity ?? 0)}
      {label(0.06, 0.621, 0.18, t("saveEditor.character.vitality"))}
      {valBox(0.255, 0.621, 0.13, a.vitality ?? 0)}
      {label(0.06, 0.731, 0.18, t("saveEditor.character.energy"))}
      {valBox(0.255, 0.731, 0.13, a.energy ?? 0)}

      {/* Right column: defense + pools */}
      {label(0.55, 0.4, 0.18, t("saveEditor.character.defense"))}
      {valBox(0.78, 0.4, 0.16, defense.toLocaleString())}
      {label(0.55, 0.49, 0.18, t("saveEditor.stats.stamina"))}
      {valBox(0.78, 0.49, 0.16, fp(a.stamina))}
      {label(0.55, 0.585, 0.18, t("saveEditor.stats.life"))}
      {valBox(0.78, 0.585, 0.16, fp(a.hitpoints))}
      {label(0.55, 0.68, 0.18, t("saveEditor.stats.mana"))}
      {valBox(0.78, 0.68, 0.16, fp(a.mana))}

      {/* Difficulty selector (drives the resistance penalty) */}
      <div
        className="absolute flex gap-0.5"
        style={{ left: 0.06 * W, top: 0.79 * H }}
      >
        {([0, 1, 2] as Difficulty[]).map((d) => {
          const on = d === difficulty;
          const key = d === 0 ? "normal" : d === 1 ? "nightmare" : "hell";
          return (
            <button
              key={d}
              type="button"
              onClick={() => setDifficulty(d)}
              className="px-1.5 transition-[filter] hover:brightness-125"
              style={{
                fontFamily: '"Diablo", serif',
                fontSize: Math.max(8, 0.013 * H),
                color: on ? "#f5d77a" : "#7a6c4e",
                background: on ? "rgba(60,50,28,0.9)" : "rgba(18,16,12,0.8)",
                border: "1px solid rgba(150,120,60,0.45)",
              }}
            >
              {t(`saveEditor.difficulty.${key}`)}
            </button>
          );
        })}
      </div>

      {/* Resistances 2×2 with element icons + computed (penalty-adjusted) values */}
      {RESIST_META.map((r, i) => {
        const col = i % 2;
        const row = Math.floor(i / 2);
        const x = 0.06 + col * 0.47;
        const y = 0.84 + row * 0.045;
        const value = resists[r.key as keyof typeof resists];
        return (
          <div
            key={r.key}
            className="absolute flex items-center gap-1"
            style={{ left: x * W, top: y * H, width: 0.45 * W, height: 0.04 * H }}
          >
            <img
              src={`/saveeditor-assets/panel/${r.icon}.png`}
              alt=""
              draggable={false}
              style={{ width: 0.03 * H, height: 0.03 * H, objectFit: "contain" }}
            />
            <span
              className="flex-1 truncate"
              style={{
                fontFamily: '"Diablo", serif',
                fontSize: Math.max(8, 0.0145 * H),
                color: "#cdba88",
                textShadow: "0 1px 1px #000",
              }}
            >
              {t(r.labelKey)}
            </span>
            <span
              style={{
                fontFamily: '"Diablo", serif',
                fontSize: Math.max(9, 0.016 * H),
                color: value < 0 ? "#e06666" : "#e8e0c8",
                textShadow: "0 1px 1px #000",
                paddingRight: 4,
              }}
            >
              {value}%
            </span>
          </div>
        );
      })}

      {/* Stat / skill points remaining */}
      {label(
        0.06,
        0.935,
        0.88,
        `${a.statpts ?? 0} ${t("saveEditor.character.statPointsRemaining")}` +
          (a.newskills ? `   ·   ${a.newskills} ${t("saveEditor.stats.skillPoints")}` : ""),
        "#9a8a66"
      )}
    </div>
  );
};

export default CharacterStatsPanel;
