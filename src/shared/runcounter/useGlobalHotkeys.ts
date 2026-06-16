import { useEffect, useRef, useState } from "react";
import {
  register,
  unregisterAll,
  type ShortcutEvent,
} from "@tauri-apps/plugin-global-shortcut";
import { HotkeyAction, HotkeyConfig } from "./types";
import { HOTKEY_ACTIONS } from "./constants";
import { isTauri } from "./hotkeys";

export interface HotkeyFailure {
  action: HotkeyAction;
  accelerator: string;
  error: string;
}

interface UseGlobalHotkeysArgs {
  hotkeys: HotkeyConfig;
  enabled: boolean;
  handlers: Record<HotkeyAction, () => void>;
}

// Global shortcuts live in a single process-wide table, and register/unregister
// are async. Serialize every (re)sync through one promise chain so out-of-order
// completions (StrictMode double-invoke, rapid rebinds) can never clobber the
// live set — the LAST enqueued operation always wins.
let opChain: Promise<void> = Promise.resolve();
const enqueue = (fn: () => Promise<void>): Promise<void> => {
  opChain = opChain.then(fn, fn).catch(() => {});
  return opChain;
};

/**
 * Registers the Run Counter global hotkeys while mounted, re-registering when the
 * bindings change and clearing them on unmount. The plugin callback fires on both
 * key-down and key-up, so we act only on state === "Pressed".
 */
export const useGlobalHotkeys = ({
  hotkeys,
  enabled,
  handlers,
}: UseGlobalHotkeysArgs): HotkeyFailure[] => {
  const [failures, setFailures] = useState<HotkeyFailure[]>([]);

  // Latest handlers, so the registered closures never go stale.
  const handlersRef = useRef(handlers);
  handlersRef.current = handlers;

  // Serialize the accelerators so the effect re-runs only on a real change.
  const signature = HOTKEY_ACTIONS.map((a) => `${a}:${hotkeys[a]}`).join("|");

  useEffect(() => {
    if (!isTauri()) return;
    let cancelled = false;

    enqueue(async () => {
      try {
        await unregisterAll();
      } catch (err) {
        console.warn("unregisterAll failed", err);
      }
      if (cancelled || !enabled) {
        if (!cancelled) setFailures([]);
        return;
      }

      const found: HotkeyFailure[] = [];
      const seen = new Set<string>();

      for (const action of HOTKEY_ACTIONS) {
        if (cancelled) return;
        const accelerator = hotkeys[action];
        if (!accelerator) continue;
        if (seen.has(accelerator)) {
          found.push({ action, accelerator, error: "duplicate" });
          continue;
        }
        seen.add(accelerator);
        try {
          await register(accelerator, (event: ShortcutEvent) => {
            if (event.state !== "Pressed") return;
            handlersRef.current[action]?.();
          });
        } catch (err) {
          found.push({
            action,
            accelerator,
            error: err instanceof Error ? err.message : String(err),
          });
        }
      }

      if (!cancelled) setFailures(found);
    });

    return () => {
      cancelled = true;
      // Enqueue (not fire-and-forget) so teardown is ordered relative to the next
      // mount's re-sync; whichever is enqueued last reflects the final state.
      enqueue(() => unregisterAll());
    };
  }, [signature, enabled]);

  return failures;
};
