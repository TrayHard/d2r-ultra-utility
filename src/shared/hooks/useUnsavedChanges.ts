import { useMemo } from "react";
import { useSettings } from "../../app/providers/SettingsContext";

// Глубокое сравнение простых JSON-подобных структур
const isEqual = (a: unknown, b: unknown): boolean => {
  if (a === b) return true;
  if (typeof a !== typeof b) return false;
  if (a === null || b === null) return a === b;
  if (typeof a !== "object") return false;

  if (Array.isArray(a)) {
    if (!Array.isArray(b)) return false;
    if (a.length !== (b as unknown[]).length) return false;
    for (let i = 0; i < a.length; i++) {
      if (!isEqual(a[i], (b as unknown[])[i])) return false;
    }
    return true;
  }

  const aObj = a as Record<string, unknown>;
  const bObj = b as Record<string, unknown>;
  const aKeys = Object.keys(aObj);
  const bKeys = Object.keys(bObj);
  if (aKeys.length !== bKeys.length) return false;
  for (const key of aKeys) {
    if (!Object.prototype.hasOwnProperty.call(bObj, key)) return false;
    if (!isEqual(aObj[key], bObj[key])) return false;
  }
  return true;
};

// Возвращает helper для сравнения любого фрагмента текущих настроек с baseline активного профиля
export const useUnsavedChanges = () => {
  const { profiles, immutableProfiles, activeProfileId, settings } =
    useSettings();

  const baseline = useMemo(() => {
    if (!activeProfileId) return null;
    const profile =
      profiles.find((p) => p.id === activeProfileId) ||
      immutableProfiles.find((p) => p.id === activeProfileId) ||
      null;
    return profile ? profile.settings : null;
  }, [profiles, immutableProfiles, activeProfileId]);

  // Получить произвольные «текущие» и «базовые» значения по селекторам
  const hasChanged = <T>(
    select: (root: typeof settings) => T,
    selectBaseline?: (root: typeof settings) => T
  ): boolean => {
    const currentPart = select(settings);
    const baselinePart = baseline
      ? selectBaseline
        ? selectBaseline(baseline)
        : (select as (root: typeof settings) => T)(baseline as typeof settings)
      : null;
    if (baselinePart === null) return false; // если нет baseline (нет активного профиля) — считаем без изменений
    return !isEqual(currentPart as unknown, baselinePart as unknown);
  };

  return { hasChanged, baseline, settings };
};
