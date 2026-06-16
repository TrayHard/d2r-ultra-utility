// Helpers for capturing and displaying global-hotkey accelerators.
//
// Accelerator strings follow the Tauri/Electron format: modifier tokens joined to
// exactly one key with "+", modifiers first. Tokens are case-insensitive and Tauri
// accepts both friendly names (L, 1, F9) and physical `Code` names (KeyL, Digit1,
// ArrowUp, Numpad1, Backquote, ...). We normalise letters/digits/function keys to the
// friendly form and leave the rest as their code name.

const MODIFIER_CODES = new Set([
  "ControlLeft",
  "ControlRight",
  "AltLeft",
  "AltRight",
  "ShiftLeft",
  "ShiftRight",
  "MetaLeft",
  "MetaRight",
]);

/** True when running inside the Tauri shell (vs. a plain browser dev server). */
export const isTauri = (): boolean =>
  typeof window !== "undefined" &&
  "__TAURI_INTERNALS__" in (window as unknown as Record<string, unknown>);

/** Map a KeyboardEvent.code to the single accelerator key token, or null if it is a bare modifier. */
const codeToKeyToken = (code: string): string | null => {
  if (MODIFIER_CODES.has(code)) return null;

  let m: RegExpMatchArray | null;
  if ((m = code.match(/^Key([A-Z])$/))) return m[1]; // KeyL -> L
  if ((m = code.match(/^Digit(\d)$/))) return m[1]; // Digit1 -> 1
  if ((m = code.match(/^F(\d{1,2})$/))) return `F${m[1]}`; // F9 -> F9
  // Numpad, Arrow*, Space, Enter, Tab, Home, End, PageUp/Down, Insert, Delete,
  // Backquote, Minus, Equal, BracketLeft/Right, Semicolon, Quote, Comma, Period,
  // Slash, Backslash — Tauri accepts these code names verbatim.
  return code;
};

/**
 * Convert a keydown event into a Tauri accelerator string, e.g. "Ctrl+Alt+F9".
 * Returns null while only modifier keys are held (so capture waits for a real key).
 */
export const eventToAccelerator = (e: {
  code: string;
  ctrlKey: boolean;
  altKey: boolean;
  shiftKey: boolean;
  metaKey: boolean;
}): string | null => {
  const key = codeToKeyToken(e.code);
  if (!key) return null;

  const parts: string[] = [];
  if (e.ctrlKey) parts.push("Ctrl");
  if (e.altKey) parts.push("Alt");
  if (e.shiftKey) parts.push("Shift");
  if (e.metaKey) parts.push("Super");
  parts.push(key);
  return parts.join("+");
};

/** True when the accelerator has at least one modifier — recommended to avoid hijacking bare keys. */
export const hasModifier = (accelerator: string): boolean => {
  const parts = accelerator.split("+");
  return parts.length > 1;
};

/** Pretty-print an accelerator for the UI: "Ctrl+Alt+F9" -> "Ctrl + Alt + F9". */
export const formatHotkeyForDisplay = (accelerator: string): string =>
  accelerator
    .split("+")
    .map((p) => p.trim())
    .join(" + ");
