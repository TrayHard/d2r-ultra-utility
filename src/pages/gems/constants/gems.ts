// Enum для драгоценных камней
export enum EGem {
  "amethyst1" = "amethyst1",
  "amethyst2" = "amethyst2",
  "amethyst3" = "amethyst3",
  "amethyst4" = "amethyst4",
  "amethyst5" = "amethyst5",
  "topaz1" = "topaz1",
  "topaz2" = "topaz2",
  "topaz3" = "topaz3",
  "topaz4" = "topaz4",
  "topaz5" = "topaz5",
  "sapphire1" = "sapphire1",
  "sapphire2" = "sapphire2",
  "sapphire3" = "sapphire3",
  "sapphire4" = "sapphire4",
  "sapphire5" = "sapphire5",
  "emerald1" = "emerald1",
  "emerald2" = "emerald2",
  "emerald3" = "emerald3",
  "emerald4" = "emerald4",
  "emerald5" = "emerald5",
  "ruby1" = "ruby1",
  "ruby2" = "ruby2",
  "ruby3" = "ruby3",
  "ruby4" = "ruby4",
  "ruby5" = "ruby5",
  "diamond1" = "diamond1",
  "diamond2" = "diamond2",
  "diamond3" = "diamond3",
  "diamond4" = "diamond4",
  "diamond5" = "diamond5",
  "skull1" = "skull1",
  "skull2" = "skull2",
  "skull3" = "skull3",
  "skull4" = "skull4",
  "skull5" = "skull5",
}

// Определяем какие ID находятся в каком файле
export interface GemIdInfo {
  id: number;
  file: "item-names" | "item-nameaffixes";
}

// Маппинг ID к драгоценным камням с указанием файла
export const idToGemMapper: Record<
  number,
  { gem: EGem; file: "item-names" | "item-nameaffixes" }
> = {
  // Аметисты (item-names.json)
  2236: { gem: EGem.amethyst1, file: "item-names" },
  2237: { gem: EGem.amethyst2, file: "item-names" },
  2238: { gem: EGem.amethyst3, file: "item-names" },
  2239: { gem: EGem.amethyst4, file: "item-names" },
  2240: { gem: EGem.amethyst5, file: "item-names" },

  // Топазы (item-names.json)
  2241: { gem: EGem.topaz1, file: "item-names" },
  2242: { gem: EGem.topaz2, file: "item-names" },
  2243: { gem: EGem.topaz3, file: "item-names" },
  2244: { gem: EGem.topaz4, file: "item-names" },
  2245: { gem: EGem.topaz5, file: "item-names" },

  // Сапфиры
  2246: { gem: EGem.sapphire1, file: "item-names" }, // item-names.json
  2247: { gem: EGem.sapphire2, file: "item-names" }, // item-names.json
  2248: { gem: EGem.sapphire3, file: "item-nameaffixes" }, // item-nameaffixes.json
  2249: { gem: EGem.sapphire4, file: "item-names" }, // item-names.json
  2250: { gem: EGem.sapphire5, file: "item-names" }, // item-names.json

  // Изумруды
  2251: { gem: EGem.emerald1, file: "item-names" }, // item-names.json
  2252: { gem: EGem.emerald2, file: "item-names" }, // item-names.json
  2253: { gem: EGem.emerald3, file: "item-nameaffixes" }, // item-nameaffixes.json
  2254: { gem: EGem.emerald4, file: "item-names" }, // item-names.json
  2255: { gem: EGem.emerald5, file: "item-names" }, // item-names.json

  // Рубины
  2256: { gem: EGem.ruby1, file: "item-names" }, // item-names.json
  2257: { gem: EGem.ruby2, file: "item-names" }, // item-names.json
  2258: { gem: EGem.ruby3, file: "item-nameaffixes" }, // item-nameaffixes.json
  2259: { gem: EGem.ruby4, file: "item-names" }, // item-names.json
  2260: { gem: EGem.ruby5, file: "item-names" }, // item-names.json

  // Алмазы
  2261: { gem: EGem.diamond1, file: "item-names" }, // item-names.json
  2262: { gem: EGem.diamond2, file: "item-names" }, // item-names.json
  2263: { gem: EGem.diamond3, file: "item-nameaffixes" }, // item-nameaffixes.json
  2264: { gem: EGem.diamond4, file: "item-names" }, // item-names.json
  2265: { gem: EGem.diamond5, file: "item-names" }, // item-names.json

  // Черепа (item-names.json)
  2277: { gem: EGem.skull1, file: "item-names" },
  2278: { gem: EGem.skull2, file: "item-names" },
  2279: { gem: EGem.skull3, file: "item-names" },
  2280: { gem: EGem.skull4, file: "item-names" },
  2281: { gem: EGem.skull5, file: "item-names" },
};

// Обратный маппинг для записи
export const gemToIdMapper: Record<EGem, GemIdInfo> = {
  [EGem.amethyst1]: { id: 2236, file: "item-names" },
  [EGem.amethyst2]: { id: 2237, file: "item-names" },
  [EGem.amethyst3]: { id: 2238, file: "item-names" },
  [EGem.amethyst4]: { id: 2239, file: "item-names" },
  [EGem.amethyst5]: { id: 2240, file: "item-names" },
  [EGem.topaz1]: { id: 2241, file: "item-names" },
  [EGem.topaz2]: { id: 2242, file: "item-names" },
  [EGem.topaz3]: { id: 2243, file: "item-names" },
  [EGem.topaz4]: { id: 2244, file: "item-names" },
  [EGem.topaz5]: { id: 2245, file: "item-names" },
  [EGem.sapphire1]: { id: 2246, file: "item-names" },
  [EGem.sapphire2]: { id: 2247, file: "item-names" },
  [EGem.sapphire3]: { id: 2248, file: "item-nameaffixes" },
  [EGem.sapphire4]: { id: 2249, file: "item-names" },
  [EGem.sapphire5]: { id: 2250, file: "item-names" },
  [EGem.emerald1]: { id: 2251, file: "item-names" },
  [EGem.emerald2]: { id: 2252, file: "item-names" },
  [EGem.emerald3]: { id: 2253, file: "item-nameaffixes" },
  [EGem.emerald4]: { id: 2254, file: "item-names" },
  [EGem.emerald5]: { id: 2255, file: "item-names" },
  [EGem.ruby1]: { id: 2256, file: "item-names" },
  [EGem.ruby2]: { id: 2257, file: "item-names" },
  [EGem.ruby3]: { id: 2258, file: "item-nameaffixes" },
  [EGem.ruby4]: { id: 2259, file: "item-names" },
  [EGem.ruby5]: { id: 2260, file: "item-names" },
  [EGem.diamond1]: { id: 2261, file: "item-names" },
  [EGem.diamond2]: { id: 2262, file: "item-names" },
  [EGem.diamond3]: { id: 2263, file: "item-nameaffixes" },
  [EGem.diamond4]: { id: 2264, file: "item-names" },
  [EGem.diamond5]: { id: 2265, file: "item-names" },
  [EGem.skull1]: { id: 2277, file: "item-names" },
  [EGem.skull2]: { id: 2278, file: "item-names" },
  [EGem.skull3]: { id: 2279, file: "item-names" },
  [EGem.skull4]: { id: 2280, file: "item-names" },
  [EGem.skull5]: { id: 2281, file: "item-names" },
};

// Группировка драгоценных камней по типам
export const gemGroups = {
  skulls: [EGem.skull1, EGem.skull2, EGem.skull3, EGem.skull4, EGem.skull5],
  amethysts: [
    EGem.amethyst1,
    EGem.amethyst2,
    EGem.amethyst3,
    EGem.amethyst4,
    EGem.amethyst5,
  ],
  topazes: [EGem.topaz1, EGem.topaz2, EGem.topaz3, EGem.topaz4, EGem.topaz5],
  sapphires: [
    EGem.sapphire1,
    EGem.sapphire2,
    EGem.sapphire3,
    EGem.sapphire4,
    EGem.sapphire5,
  ],
  emeralds: [
    EGem.emerald1,
    EGem.emerald2,
    EGem.emerald3,
    EGem.emerald4,
    EGem.emerald5,
  ],
  rubies: [EGem.ruby1, EGem.ruby2, EGem.ruby3, EGem.ruby4, EGem.ruby5],
  diamonds: [
    EGem.diamond1,
    EGem.diamond2,
    EGem.diamond3,
    EGem.diamond4,
    EGem.diamond5,
  ],
};

// Маппинг для получения группы драгоценных камней из настроек
export const settingsKeyToGemMapper = {
  skulls: gemGroups.skulls,
  amethysts: gemGroups.amethysts,
  topazes: gemGroups.topazes,
  sapphires: gemGroups.sapphires,
  emeralds: gemGroups.emeralds,
  rubies: gemGroups.rubies,
  diamonds: gemGroups.diamonds,
};
