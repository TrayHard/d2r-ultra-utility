// Local types for the Save Editor feature (UI/state side).
import type { D2SReadResult, D2IReadResult } from "d2r-saver";

/** A loaded character save (.d2s) with its raw bytes and parsed result. */
export interface LoadedCharacter {
  path: string;
  fileName: string;
  bytes: Uint8Array;
  result: D2SReadResult;
}

/** A loaded shared stash (.d2i) with its raw bytes and parsed result. */
export interface LoadedStash {
  path: string;
  fileName: string;
  bytes: Uint8Array;
  result: D2IReadResult;
}

/** Item-bearing containers inside a character save. */
export type CharContainer = "inventory" | "stash" | "cube" | "belt";

/** A reference to one item somewhere in the loaded save data. */
export type ItemRef =
  | { kind: "char"; container: CharContainer; slot: number; itemId: number }
  | { kind: "charBody"; slot: string; itemId: number }
  | { kind: "stash"; pageIndex: number; slot: number; itemId: number };
