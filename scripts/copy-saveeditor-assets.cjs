/* Copy Save Editor graphics from the local (gitignored) nogit/графика dump into
   public/saveeditor-assets/ so Vite serves them in dev and bundles them into the
   MSI on build. The destination is gitignored too — these are extracted game
   sprites and must NOT be committed. Re-run after refreshing the graphics dump:
     node scripts/copy-saveeditor-assets.cjs
*/
const fs = require("fs");
const path = require("path");

const ROOT = path.resolve(__dirname, "..");
const SRC = path.join(ROOT, "nogit", "графика");
const DST = path.join(ROOT, "public", "saveeditor-assets");

if (!fs.existsSync(SRC)) {
  console.error(`Source graphics not found: ${SRC}`);
  process.exit(1);
}

// Item sprites: items/<topcat>/<subcat>/<name>.png  (skip .lowend variants)
function copyItems() {
  const srcItems = path.join(SRC, "items");
  const dstItems = path.join(DST, "items");
  let n = 0;
  const walk = (dir, rel) => {
    for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
      const p = path.join(dir, e.name);
      const r = rel ? `${rel}/${e.name}` : e.name;
      if (e.isDirectory()) walk(p, r);
      else if (e.name.endsWith(".png") && !e.name.endsWith(".lowend.png")) {
        const out = path.join(dstItems, r);
        fs.mkdirSync(path.dirname(out), { recursive: true });
        fs.copyFileSync(p, out);
        n++;
      }
    }
  };
  walk(srcItems, "");
  return n;
}

// Paperdoll empty-slot backgrounds: panel/inventory/inventory_paperdoll_*.png
function copyPaperdoll() {
  const src = path.join(SRC, "panel", "inventory");
  const dst = path.join(DST, "paperdoll");
  fs.mkdirSync(dst, { recursive: true });
  let n = 0;
  for (const e of fs.readdirSync(src)) {
    if (
      e.startsWith("inventory_paperdoll_") &&
      e.endsWith(".png") &&
      !e.includes(".lowend")
    ) {
      fs.copyFileSync(path.join(src, e), path.join(dst, e));
      n++;
    }
  }
  return n;
}

// Curated UI panel art (frames, buttons, arrows, tabs) → public/.../panel/<flat>
function copyPanels() {
  const map = [
    ["panel/inventory/background.png", "inventory_bg.png"],
    ["panel/character_sheet/character_background.png", "character_bg.png"],
    ["panel/inventory/button_01.png", "btn_normal.png"],
    ["panel/inventory/button_02.png", "btn_hover.png"],
    ["panel/inventory/button_03.png", "btn_pressed.png"],
    ["panel/inventory/button_04.png", "btn_disabled.png"],
    ["panel/stash/stashpanel_bg_expanded.png", "stash_bg.png"],
    ["panel/stash/stashpanel_bg_expanded_shared.png", "stash_bg_shared.png"],
    ["panel/stash/additionalstash/PANEL_Expanded_Materials.png", "stash_bg_materials.png"],
    ["panel/stash/stash_tabs_expanded.png", "stash_tabs.png"],
    ["panel/stash/stash_leftarrow_01.png", "arrow_left.png"],
    ["panel/stash/stash_leftarrow_02.png", "arrow_left_hover.png"],
    ["panel/stash/stash_leftarrow_03.png", "arrow_left_pressed.png"],
    ["panel/stash/stash_rightarrow_01.png", "arrow_right.png"],
    ["panel/stash/stash_rightarrow_02.png", "arrow_right_hover.png"],
    ["panel/stash/stash_rightarrow_03.png", "arrow_right_pressed.png"],
    ["panel/stash/additionalstash/additionalstash_tabs.png", "stash_tabs.png"],
    // Gold-edit button (4 states: normal / hover / pressed / disabled).
    ["panel/goldbutton_01.png", "goldbutton_01.png"],
    ["panel/goldbutton_02.png", "goldbutton_02.png"],
    ["panel/goldbutton_03.png", "goldbutton_03.png"],
    ["panel/goldbutton_04.png", "goldbutton_04.png"],
    // Real stash-tab art states (Personal/Shared/Materials switcher).
    ["panel/stash/stash_tabs_01.png", "stash_tab_01.png"],
    ["panel/stash/stash_tabs_02.png", "stash_tab_02.png"],
    ["panel/stash/stash_tabs_03.png", "stash_tab_03.png"],
    ["panel/stash/stash_tabs_04.png", "stash_tab_04.png"],
    // Resistance element icons (letter preserved: f/i/l/p — map to element at use-site).
    ["panel/character_sheet/f_elementicon.png", "elementicon_f.png"],
    ["panel/character_sheet/i_elementicon.png", "elementicon_i.png"],
    ["panel/character_sheet/l_elementicon.png", "elementicon_l.png"],
    ["panel/character_sheet/p_elementicon.png", "elementicon_p.png"],
    // Experience bar fill (character + merc panels).
    ["panel/character_sheet/expbarfill.png", "expbarfill.png"],
    // Mercenary panel background (paperdoll frame) + slot art.
    ["panel/hireling/hirelingpanel.png", "merc_bg.png"],
    ["panel/hireling/hireablepanel/hireables_paperdoll.png", "merc_paperdoll.png"],
    // Character class portrait icons (used as the first cell of each save-list row).
    ["hireables/amazonicon.png", "class_ama.png"],
    ["hireables/sorceressicon.png", "class_sor.png"],
    ["hireables/necromancericon.png", "class_nec.png"],
    ["hireables/paladinicon.png", "class_pal.png"],
    ["hireables/barbarianicon.png", "class_bar.png"],
    ["hireables/druidicon.png", "class_dru.png"],
    ["hireables/assassinicon.png", "class_ass.png"],
    ["hireables/warlockicon.png", "class_war.png"],
  ];
  const dst = path.join(DST, "panel");
  fs.mkdirSync(dst, { recursive: true });
  let n = 0;
  for (const [src, out] of map) {
    const sp = path.join(SRC, src);
    if (fs.existsSync(sp)) {
      fs.copyFileSync(sp, path.join(dst, out));
      n++;
    } else {
      console.warn("  missing:", src);
    }
  }
  return n;
}

fs.mkdirSync(DST, { recursive: true });
console.log("item sprites copied:", copyItems());
console.log("paperdoll slots copied:", copyPaperdoll());
console.log("panel art copied:", copyPanels());
console.log("destination:", DST);
