import React, { useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import type { D2SCharacterProfile, BinaryParsedItem } from "d2r-saver";
import { useSaveEditor } from "../../../shared/saveeditor/SaveEditorContext";
import ItemTile, { type ItemAction } from "./ItemTile";
import {
  sumStatMaps,
  computeResists,
  computeMercStats,
  type Difficulty,
  type StatMap,
  type HirelingRow,
} from "../../../shared/saveeditor/stats";

type AnyItems = Record<number | string, BinaryParsedItem>;

const NATIVE_W = 456;
const NATIVE_H = 596;
const BG = "/saveeditor-assets/panel/merc_bg.png";

type Rect = { x: number; y: number; w: number; h: number };

// Paperdoll slots overlaid on hirelingpanel.png.
const SLOTS: Array<{ key: string; rect: Rect; weapon?: boolean }> = [
  { key: "rarm", rect: { x: 0.07, y: 0.21, w: 0.2, h: 0.31 }, weapon: true }, // left weapon
  { key: "head", rect: { x: 0.4, y: 0.1, w: 0.2, h: 0.16 } }, // helm
  { key: "tors", rect: { x: 0.4, y: 0.28, w: 0.2, h: 0.24 } }, // armor
  { key: "larm", rect: { x: 0.73, y: 0.21, w: 0.2, h: 0.31 }, weapon: true }, // right weapon
];

const RESIST_META = [
  { key: "fire", icon: "elementicon_f", labelKey: "saveEditor.resist.fire" },
  { key: "cold", icon: "elementicon_i", labelKey: "saveEditor.resist.cold" },
  { key: "lightning", icon: "elementicon_l", labelKey: "saveEditor.resist.lightning" },
  { key: "poison", icon: "elementicon_p", labelKey: "saveEditor.resist.poison" },
] as const;

/** Merc type by hireling act. */
const TYPE_BY_ACT: Record<number, string> = {
  1: "rogue",
  2: "desert",
  3: "eastern",
  5: "barbarian",
};

interface MercPanelProps {
  profile: D2SCharacterProfile;
  items: AnyItems;
  isDarkTheme: boolean;
  actionsFor: (item: BinaryParsedItem) => ItemAction[];
  width?: number;
}

const MercPanel: React.FC<MercPanelProps> = ({
  profile,
  items,
  isDarkTheme,
  actionsFor,
  width = 360,
}) => {
  const { t } = useTranslation();
  const { describeItem, busy, gd } = useSaveEditor();
  const [difficulty, setDifficulty] = useState<Difficulty>(2);

  const W = width;
  const H = (width * NATIVE_H) / NATIVE_W;

  const mercItems = profile.mercItems ?? {};
  const hasMerc = profile.merc != null && profile.mercLevel != null;

  const rows: HirelingRow[] | undefined = useMemo(() => {
    if (!gd || profile.merc == null) return undefined;
    const table = (gd as unknown as { hireling?: Record<string, HirelingRow[]> }).hireling;
    return table?.[profile.merc];
  }, [gd, profile.merc]);

  // Sum equipped mercenary item stats (for bonuses on top of base growth).
  const mercEquip = useMemo<StatMap>(() => {
    const maps: StatMap[] = [];
    for (const key of Object.keys(mercItems)) {
      const id = mercItems[key];
      if (id == null) continue;
      const item = items[id as number];
      if (!item) continue;
      const dto = describeItem(item, items);
      if (dto?.stats) maps.push(dto.stats);
    }
    return sumStatMaps(maps);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [mercItems, items]);

  if (!hasMerc) {
    return (
      <div
        className="flex items-center justify-center text-sm opacity-60"
        style={{ width: W, height: 200, fontFamily: '"Diablo", serif' }}
      >
        {t("saveEditor.merc.none")}
      </div>
    );
  }

  const level = profile.mercLevel ?? 1;
  const base = rows?.length
    ? computeMercStats(rows, level)
    : {
        life: 0,
        strength: 0,
        dexterity: 0,
        defense: 0,
        attackRating: 0,
        dmgMin: 0,
        dmgMax: 0,
        resist: 0,
      };

  const life = base.life + (mercEquip.maxhp ?? 0);
  const strength = base.strength + (mercEquip.strength ?? 0);
  const dexterity = base.dexterity + (mercEquip.dexterity ?? 0);
  const defense = base.defense + (mercEquip.armorclass ?? 0);
  // Physical damage scales with strength (≈ +1% per point).
  const strMul = 1 + strength / 100;
  const dmgMin = Math.floor((base.dmgMin + (mercEquip.mindamage ?? 0)) * strMul);
  const dmgMax = Math.floor((base.dmgMax + (mercEquip.maxdamage ?? 0)) * strMul);

  const resists = computeResists(
    {
      fireresist: base.resist + (mercEquip.fireresist ?? 0),
      coldresist: base.resist + (mercEquip.coldresist ?? 0),
      lightresist: base.resist + (mercEquip.lightresist ?? 0),
      poisonresist: base.resist + (mercEquip.poisonresist ?? 0),
      maxfireresist: mercEquip.maxfireresist ?? 0,
      maxcoldresist: mercEquip.maxcoldresist ?? 0,
      maxlightresist: mercEquip.maxlightresist ?? 0,
      maxpoisonresist: mercEquip.maxpoisonresist ?? 0,
    },
    difficulty
  );

  const act = rows?.[0]?.act;
  const typeKey = act != null ? TYPE_BY_ACT[act] ?? "unknown" : "unknown";
  const typeName = t(`saveEditor.merc.types.${typeKey}`);

  const statRow = (
    x: number,
    y: number,
    w: number,
    lbl: string,
    value: React.ReactNode,
    valueColor = "#e8e0c8"
  ) => (
    <div
      className="absolute flex items-center justify-between"
      style={{ left: x * W, top: y * H, width: w * W, height: 0.04 * H, paddingInline: 4 }}
    >
      <span
        style={{
          fontFamily: '"Diablo", serif',
          fontSize: Math.max(8, 0.022 * W),
          color: "#cdba88",
          textShadow: "0 1px 1px #000",
        }}
      >
        {lbl}
      </span>
      <span
        style={{
          fontFamily: '"Diablo", serif',
          fontSize: Math.max(9, 0.024 * W),
          color: valueColor,
          textShadow: "0 1px 1px #000",
        }}
      >
        {value}
      </span>
    </div>
  );

  return (
    <div
      className="relative select-none"
      style={{ width: W, height: H, backgroundImage: `url(${BG})`, backgroundSize: "100% 100%" }}
    >
      {/* Title */}
      <div
        className="absolute flex items-center justify-center"
        style={{
          left: 0,
          top: 0.018 * H,
          width: W,
          height: 0.05 * H,
          fontFamily: '"Diablo", serif',
          color: "#cdba88",
          fontSize: Math.max(12, 0.03 * W),
          letterSpacing: 2,
          textShadow: "0 1px 2px #000",
        }}
      >
        {t("saveEditor.merc.title").toUpperCase()}
      </div>

      {/* Paperdoll slots */}
      {SLOTS.map(({ key, rect, weapon }) => {
        const id = mercItems[key];
        const item = id != null ? items[id as number] : undefined;
        return (
          <div
            key={key}
            className="absolute"
            style={{ left: rect.x * W, top: rect.y * H, width: rect.w * W, height: rect.h * H, padding: 2 }}
          >
            {item ? (
              <ItemTile
                item={item}
                dto={describeItem(item, items)}
                actions={actionsFor(item)}
                busy={busy}
                isDarkTheme={isDarkTheme}
                fill
              />
            ) : weapon ? (
              // Empty weapon slot — the game's crossed "X".
              <svg viewBox="0 0 100 100" className="w-full h-full" style={{ opacity: 0.35 }}>
                <line x1="14" y1="10" x2="86" y2="90" stroke="#6b5a33" strokeWidth="4" />
                <line x1="86" y1="10" x2="14" y2="90" stroke="#6b5a33" strokeWidth="4" />
              </svg>
            ) : null}
          </div>
        );
      })}

      {/* Name + level/type */}
      <div
        className="absolute flex flex-col items-start justify-center"
        style={{ left: 0.08 * W, top: 0.545 * H, width: 0.84 * W, height: 0.07 * H }}
      >
        <span
          style={{
            fontFamily: '"Diablo", serif',
            color: "#e8d39a",
            fontSize: Math.max(13, 0.035 * W),
            textShadow: "0 1px 2px #000",
          }}
        >
          {typeName}
        </span>
        <span
          style={{
            fontFamily: '"Diablo", serif',
            color: "#9a8a66",
            fontSize: Math.max(9, 0.022 * W),
            textShadow: "0 1px 2px #000",
          }}
        >
          {t("saveEditor.character.level")} {level}
        </span>
      </div>

      {/* Difficulty selector */}
      <div className="absolute flex gap-0.5" style={{ left: 0.62 * W, top: 0.55 * H }}>
        {([0, 1, 2] as Difficulty[]).map((d) => {
          const on = d === difficulty;
          const key = d === 0 ? "normal" : d === 1 ? "nightmare" : "hell";
          return (
            <button
              key={d}
              type="button"
              onClick={() => setDifficulty(d)}
              className="px-1 transition-[filter] hover:brightness-125"
              style={{
                fontFamily: '"Diablo", serif',
                fontSize: Math.max(7, 0.018 * W),
                color: on ? "#f5d77a" : "#7a6c4e",
                background: on ? "rgba(60,50,28,0.9)" : "rgba(18,16,12,0.8)",
                border: "1px solid rgba(150,120,60,0.45)",
              }}
            >
              {t(`saveEditor.difficulty.${key}`)[0]}
            </button>
          );
        })}
      </div>

      {/* Life (full width) */}
      {statRow(0.07, 0.64, 0.86, t("saveEditor.stats.life"), `${life} / ${life}`)}

      {/* Left column combat stats */}
      {statRow(0.07, 0.7, 0.42, t("saveEditor.character.strength"), strength)}
      {statRow(0.07, 0.745, 0.42, t("saveEditor.character.dexterity"), dexterity)}
      {statRow(0.07, 0.79, 0.42, t("saveEditor.character.damage"), `${dmgMin}-${dmgMax}`)}
      {statRow(0.07, 0.835, 0.42, t("saveEditor.character.defense"), defense.toLocaleString())}

      {/* Right column resistances */}
      {RESIST_META.map((r, i) => {
        const value = resists[r.key as keyof typeof resists];
        return (
          <div
            key={r.key}
            className="absolute flex items-center gap-1"
            style={{ left: 0.52 * W, top: (0.7 + i * 0.045) * H, width: 0.44 * W, height: 0.04 * H }}
          >
            <img
              src={`/saveeditor-assets/panel/${r.icon}.png`}
              alt=""
              draggable={false}
              style={{ width: 0.04 * W, height: 0.04 * W, objectFit: "contain" }}
            />
            <span
              className="flex-1 truncate"
              style={{
                fontFamily: '"Diablo", serif',
                fontSize: Math.max(7, 0.018 * W),
                color: "#cdba88",
                textShadow: "0 1px 1px #000",
              }}
            >
              {t(r.labelKey)}
            </span>
            <span
              style={{
                fontFamily: '"Diablo", serif',
                fontSize: Math.max(8, 0.022 * W),
                color: value < 0 ? "#e06666" : "#e8e0c8",
                textShadow: "0 1px 1px #000",
              }}
            >
              {value}%
            </span>
          </div>
        );
      })}
    </div>
  );
};

export default MercPanel;
