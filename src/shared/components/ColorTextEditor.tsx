import React from "react";
import { Select } from "antd";
import { useTranslation } from "react-i18next";
import Icon from "@mdi/react";
import { mdiFormatColorMarkerCancel } from "@mdi/js";
import ColorPallet from "./ColorPallet.tsx";
import { colorCodes, colorCodeToHex, diabloSymbols } from "../constants";
import { parseRuns } from "../utils/modifierUtils";

interface ColorTextEditorProps {
  value: string; // raw ÿc-coded string
  onChange: (raw: string) => void;
  defaultHex: string; // color shown for uncolored text
  defaultCode: string; // ÿc code used to reset to default mid-line
  isDarkTheme: boolean;
  adornment?: React.ReactNode; // overlaid at the input's top-right (e.g. unsaved marker)
}

const DIABLO_FONT = "Diablo, monospace";
const esc = (s: string) =>
  s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");

const symbolOptions = [
  { value: "", label: "＋" },
  ...diabloSymbols.map((s) => ({
    value: s,
    label: <span style={{ fontFamily: DIABLO_FONT }}>{s}</span>,
  })),
];

// raw -> colored HTML (spans carry data-code so we can serialize back)
const runsToHtml = (raw: string, defaultHex: string) => {
  const runs = parseRuns(raw);
  if (!runs.length) return "";
  return runs
    .map((r) => {
      const hex = r.code ? colorCodeToHex[r.code] || defaultHex : defaultHex;
      const html = esc(r.text).replace(/\n/g, "<br>");
      return `<span data-code="${r.code}" style="color:${hex}">${html}</span>`;
    })
    .join("");
};

// DOM -> raw (DFS; nearest ancestor data-code wins; default runs reset via defaultCode)
const domToRaw = (root: HTMLElement, defaultCode: string) => {
  const runs: Array<{ text: string; code: string }> = [];
  const walk = (node: Node, code: string) => {
    node.childNodes.forEach((ch) => {
      if (ch.nodeType === Node.TEXT_NODE) {
        const txt = ch.textContent || "";
        if (txt) runs.push({ text: txt, code });
      } else if (ch.nodeType === Node.ELEMENT_NODE) {
        const el = ch as HTMLElement;
        if (el.tagName === "BR") {
          runs.push({ text: "\n", code });
          return;
        }
        const c =
          el.dataset && el.dataset.code !== undefined ? el.dataset.code : code;
        walk(el, c);
      }
    });
  };
  walk(root, "");
  let raw = "";
  let prev: string | null = null;
  for (const r of runs) {
    const ec = r.code || defaultCode;
    if (ec !== prev) {
      if (!(prev === null && ec === defaultCode)) raw += ec;
      prev = ec;
    }
    raw += r.text;
  }
  return raw;
};

const ColorTextEditor: React.FC<ColorTextEditorProps> = ({
  value,
  onChange,
  defaultHex,
  defaultCode,
  isDarkTheme,
  adornment,
}) => {
  const { t } = useTranslation();
  const ref = React.useRef<HTMLDivElement>(null);

  // sync external value -> DOM (skip while the user is typing in this editor).
  // Compare by serialized content (browser normalizes innerHTML) to avoid churn.
  React.useEffect(() => {
    const ed = ref.current;
    if (!ed) return;
    if (document.activeElement === ed) return;
    if (domToRaw(ed, defaultCode) !== value)
      ed.innerHTML = runsToHtml(value, defaultHex);
  }, [value, defaultHex, defaultCode]);

  const serialize = () => {
    const ed = ref.current;
    if (ed) onChange(domToRaw(ed, defaultCode));
  };

  const applyColor = (name: string) => {
    const ed = ref.current;
    if (!ed) return;
    const code = colorCodes[name as keyof typeof colorCodes];
    if (!code) return;
    const sel = window.getSelection();
    let range: Range;
    if (
      sel &&
      sel.rangeCount > 0 &&
      ed.contains(sel.getRangeAt(0).commonAncestorContainer) &&
      !sel.getRangeAt(0).collapsed
    ) {
      range = sel.getRangeAt(0);
    } else {
      // no selection -> color the whole line
      range = document.createRange();
      range.selectNodeContents(ed);
    }
    const span = document.createElement("span");
    span.dataset.code = code;
    span.style.color = colorCodeToHex[code] || defaultHex;
    try {
      span.appendChild(range.extractContents());
    } catch {
      return;
    }
    // the chosen color overrides any nested colors inside the selection
    span
      .querySelectorAll<HTMLElement>("[data-code]")
      .forEach((s) => {
        s.removeAttribute("data-code");
        s.style.color = "";
      });
    range.insertNode(span);
    // flatten + persist
    const raw = domToRaw(ed, defaultCode);
    onChange(raw);
    ed.innerHTML = runsToHtml(raw, defaultHex);
  };

  const insertSymbol = (sym: string) => {
    const ed = ref.current;
    if (!ed || !sym) return;
    ed.focus();
    const sel = window.getSelection();
    if (sel && sel.rangeCount > 0 && ed.contains(sel.getRangeAt(0).commonAncestorContainer)) {
      const range = sel.getRangeAt(0);
      range.deleteContents();
      const node = document.createTextNode(sym);
      range.insertNode(node);
      range.setStartAfter(node);
      range.collapse(true);
      sel.removeAllRanges();
      sel.addRange(range);
    } else {
      ed.appendChild(document.createTextNode(sym));
    }
    serialize();
  };

  // Strip every ÿc color code -> the whole line falls back to the default color.
  const resetColor = () => {
    const ed = ref.current;
    if (!ed) return;
    const plain = domToRaw(ed, defaultCode).replace(/ÿc./g, "");
    onChange(plain);
    ed.innerHTML = runsToHtml(plain, defaultHex);
  };

  return (
    <div className="flex items-start gap-2">
      <div className="relative flex-1">
        <div
          ref={ref}
          contentEditable
          suppressContentEditableWarning
          onInput={serialize}
          spellCheck={false}
          className={`w-full min-h-[38px] px-3 py-2 pr-7 text-sm rounded-lg border focus:ring-2 focus:ring-yellow-500 focus:outline-none ${
            isDarkTheme
              ? "bg-gray-700 border-gray-600"
              : "bg-white border-gray-300"
          }`}
          style={{ fontFamily: DIABLO_FONT, whiteSpace: "pre-wrap", wordBreak: "break-word" }}
        />
        {adornment && (
          <div
            className="absolute pointer-events-none"
            style={{ right: 8, top: "50%", transform: "translateY(-50%)" }}
          >
            {adornment}
          </div>
        )}
      </div>
      <div className="flex flex-col gap-1">
        <ColorPallet
          isDarkTheme={isDarkTheme}
          value="white"
          onChange={applyColor}
          size="sm"
        />
        <Select
          value=""
          onChange={(v) => insertSymbol(String(v))}
          options={symbolOptions}
          size="small"
          style={{ width: 56 }}
          popupMatchSelectWidth={false}
        />
        <button
          type="button"
          onClick={resetColor}
          title={t("editor.resetColor")}
          className={`flex items-center justify-center h-6 rounded border ${
            isDarkTheme
              ? "border-gray-600 bg-gray-700 hover:bg-gray-600 text-gray-200"
              : "border-gray-300 bg-white hover:bg-gray-100 text-gray-700"
          }`}
          style={{ width: 56 }}
        >
          <Icon path={mdiFormatColorMarkerCancel} size={0.7} />
        </button>
      </div>
    </div>
  );
};

export default ColorTextEditor;
