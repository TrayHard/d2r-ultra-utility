// Lazy loader for the d2r-saver game data → a memoized D2RSaver instance.
//
// data.json (~3.6 MB) + strings.json (~0.5 MB) are dynamically imported so they
// land in a separate lazy chunk instead of the app's startup bundle, and are
// only fetched the first time the Save Editor actually needs them.
import { D2RSaver } from "d2r-saver";

let saverPromise: Promise<D2RSaver> | null = null;

/**
 * Get the shared D2RSaver instance, loading game data on first call.
 * Subsequent calls reuse the same promise (data is parsed once).
 */
export function getSaver(): Promise<D2RSaver> {
  if (!saverPromise) {
    saverPromise = (async () => {
      const [dataMod, stringsMod] = await Promise.all([
        import("d2r-saver/data/data.json"),
        import("d2r-saver/data/strings.json"),
      ]);
      // fromData(rawData, locale): data.json is the raw game data, strings.json
      // IS the LocaleArray. Cast through the function's own parameter types so we
      // don't depend on the lib re-exporting RawGameData / LocaleArray.
      type Args = Parameters<typeof D2RSaver.fromData>;
      return D2RSaver.fromData(
        dataMod.default as Args[0],
        stringsMod.default as Args[1]
      );
    })();
  }
  return saverPromise;
}
