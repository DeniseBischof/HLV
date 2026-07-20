/* SNES Inspector — setup planner: drag & drop content onto layer slots,
   auto-layout in a visual 64 KB VRAM bar, live register writes, warnings.
   Persisted in localStorage, exportable as JSON. */
(function () {
  "use strict";
  var VRAM_WORDS = 0x8000;
  var LS_KEY = "snesPlanner";

  function lang() { return localStorage.getItem("snesLang") || "en"; }
  function L(t) { if (t == null) return ""; if (typeof t === "string") return t; return t[lang()] != null ? t[lang()] : t.en; }
  function esc(s) { return String(s).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;"); }
  function hexw(n) { return "$" + n.toString(16).toUpperCase().padStart(4, "0"); }
  function hex2(n) { return "$" + n.toString(16).toUpperCase().padStart(2, "0"); }
  function kb(words) { var b = words * 2; return b >= 1024 ? (b / 1024) + " KB" : b + " B"; }

  var T = {
    title: { en: "Setup planner — what runs where?", de: "Setup-Planer — was läuft wo?" },
    intro: { en: "Drag building blocks onto the layer slots (or use the + buttons). The tool places them in VRAM automatically, computes the exact register writes, and warns about collisions and limits. Everything is saved in your browser.",
             de: "Zieh Bausteine auf die Layer-Slots (oder nutze die +-Buttons). Das Tool platziert sie automatisch im VRAM, berechnet die exakten Register-Writes und warnt bei Kollisionen und Limits. Alles wird im Browser gespeichert." },
    palette: { en: "Building blocks", de: "Bausteine" },
    slots: { en: "Layer slots", de: "Layer-Slots" },
    vram: { en: "VRAM layout (64 KB — drag blocks to move them)", de: "VRAM-Belegung (64 KB — Blöcke zum Verschieben ziehen)" },
    regs: { en: "Register writes for this setup", de: "Register-Writes für dieses Setup" },
    warnings: { en: "Checks", de: "Prüfungen" },
    mode: { en: "BG mode", de: "BG-Modus" },
    labelPh: { en: "what runs here? (e.g. level, HUD…)", de: "was läuft hier? (z. B. Level, HUD…)" },
    map: { en: "Tilemap", de: "Tilemap" },
    chr: { en: "Tileset (tiles)", de: "Tileset (Tiles)" },
    objTiles: { en: "Sprite tiles", de: "Sprite-Tiles" },
    m7block: { en: "Mode 7 map + tiles (interleaved, fixed at $0000)", de: "Mode-7-Map + Tiles (verschränkt, fix bei $0000)" },
    custom: { en: "Reserved block", de: "Reservierter Block" },
    customPh: { en: "name", de: "Name" },
    dragMap: { en: "Tilemap — the grid of tile numbers", de: "Tilemap — das Raster aus Tile-Nummern" },
    dragChr: { en: "BG tileset — the pixel data", de: "BG-Tileset — die Pixeldaten" },
    dragObj: { en: "Sprite tiles — always 4bpp", de: "Sprite-Tiles — immer 4bpp" },
    dragM7: { en: "Mode 7 map+tiles — 32 KB at $0000", de: "Mode-7-Map+Tiles — 32 KB bei $0000" },
    dragCustom: { en: "Reserve space (buffers, effects…)", de: "Platz reservieren (Puffer, Effekte…)" },
    notInMode: { en: "not available in this mode", de: "in diesem Modus nicht verfügbar" },
    empty: { en: "empty — drop a tilemap / tileset here", de: "leer — Tilemap / Tileset hierher ziehen" },
    emptyObj: { en: "empty — drop sprite tiles here", de: "leer — Sprite-Tiles hierher ziehen" },
    sizePair: { en: "Sprite sizes (OBSEL)", de: "Sprite-Größen (OBSEL)" },
    export: { en: "Export JSON", de: "JSON exportieren" },
    import: { en: "Import JSON", de: "JSON importieren" },
    reset: { en: "Reset", de: "Zurücksetzen" },
    resetConfirm: { en: "Delete the whole setup?", de: "Das ganze Setup löschen?" },
    usage: { en: "VRAM used", de: "VRAM belegt" },
    ok: { en: "No conflicts — setup is valid.", de: "Keine Konflikte — Setup ist gültig." },
    overlap: { en: "OVERLAP", de: "ÜBERLAPPUNG" },
    copy: { en: "Copy as assembly", de: "Als Assembly kopieren" },
    copied: { en: "Copied!", de: "Kopiert!" },
    mapNoChr: { en: "has a tilemap but no tileset — the layer would show garbage tiles", de: "hat eine Tilemap, aber kein Tileset — die Ebene würde Müll-Tiles zeigen" },
    chrNoMap: { en: "has a tileset but no tilemap — nothing tells the PPU which tiles to show", de: "hat ein Tileset, aber keine Tilemap — nichts sagt der PPU, welche Tiles sie zeigen soll" },
    m7note: { en: "Mode 7: map (low bytes) and tiles (high bytes) share words $0000–$3FFF. No other block may live there.", de: "Mode 7: Map (Low-Bytes) und Tiles (High-Bytes) teilen sich die Wörter $0000–$3FFF. Kein anderer Block darf dorthin." },
    objNote512: { en: "512 sprite tiles = both tile pages back to back (OBSEL name select 0).", de: "512 Sprite-Tiles = beide Tile-Seiten direkt hintereinander (OBSEL Name Select 0)." }
  };

  var MODE_BPP = { 0: [2,2,2,2], 1: [4,4,2,null], 2: [4,4,null,null], 3: [8,4,null,null],
                   4: [8,2,null,null], 5: [4,2,null,null], 6: [4,null,null,null], 7: [8,null,null,null] };
  var FAM_COLOR = { BG1: "var(--f1)", BG2: "var(--f2)", BG3: "var(--f3)", BG4: "var(--f5)", OBJ: "var(--f7)", CST: "var(--text-dim)" };
  var MAP_SIZES = ["32×32", "64×32", "32×64", "64×64"];
  var MAP_WORDS = [0x400, 0x800, 0x800, 0x1000];
  var OBJ_PAIRS = ["8×8/16×16","8×8/32×32","8×8/64×64","16×16/32×32","16×16/64×64","32×32/64×64","16×32/32×64 (!)","16×32/32×32 (!)"];
  var CHR_TILE_CHOICES = [128, 256, 512, 1024];

  // ---------- state ----------
  function blankState() {
    return { mode: 1, bg3prio: false,
      slots: {
        BG1: { label: "", mapSize: null, mapAddr: null, chrTiles: null, chrAddr: null },
        BG2: { label: "", mapSize: null, mapAddr: null, chrTiles: null, chrAddr: null },
        BG3: { label: "", mapSize: null, mapAddr: null, chrTiles: null, chrAddr: null },
        BG4: { label: "", mapSize: null, mapAddr: null, chrTiles: null, chrAddr: null },
        OBJ: { label: "", tiles: null, addr: null, sizePair: 3 },
        M7:  { enabled: false }
      },
      customs: [] };
  }
  var st = load();
  function load() {
    try {
      var raw = localStorage.getItem(LS_KEY);
      if (raw) { var s = JSON.parse(raw); if (s && s.slots) return s; }
    } catch (e) {}
    return blankState();
  }
  function save() { localStorage.setItem(LS_KEY, JSON.stringify(st)); }

  // ---------- derived data ----------
  function bgActive(bg) {
    var n = +bg.charAt(2);
    if (st.mode === 7) return false;
    return MODE_BPP[st.mode][n - 1] != null;
  }
  function chrWordsPerTile(bpp) { return bpp * 4; } // 2bpp:8, 4bpp:16, 8bpp:32 words
  function bgBpp(bg) { return MODE_BPP[st.mode][+bg.charAt(2) - 1]; }

  // Every placed thing as a block {id, fam, kind, addr, words, align, label}
  function blocks() {
    var out = [];
    ["BG1","BG2","BG3","BG4"].forEach(function (bg) {
      if (!bgActive(bg)) return;
      var s = st.slots[bg];
      if (s.mapSize != null && s.mapAddr != null)
        out.push({ id: bg + ".map", fam: bg, kind: "map", addr: s.mapAddr, words: MAP_WORDS[s.mapSize], align: 0x400,
                   label: bg + " MAP " + MAP_SIZES[s.mapSize] });
      if (s.chrTiles != null && s.chrAddr != null)
        out.push({ id: bg + ".chr", fam: bg, kind: "chr", addr: s.chrAddr, words: s.chrTiles * chrWordsPerTile(bgBpp(bg)), align: 0x1000,
                   label: bg + " CHR " + s.chrTiles + "t·" + bgBpp(bg) + "bpp" });
    });
    var o = st.slots.OBJ;
    if (o.tiles != null && o.addr != null)
      out.push({ id: "OBJ.chr", fam: "OBJ", kind: "obj", addr: o.addr, words: o.tiles * 16, align: 0x2000,
                 label: "OBJ CHR " + o.tiles + "t" });
    if (st.mode === 7 && st.slots.M7.enabled)
      out.push({ id: "M7", fam: "BG1", kind: "m7", addr: 0, words: 0x4000, align: 0x4000, fixed: true,
                 label: "M7 MAP+CHR" });
    st.customs.forEach(function (c, i) {
      out.push({ id: "C" + i, fam: "CST", kind: "custom", addr: c.addr, words: c.words, align: 0x100,
                 label: c.name || L(T.custom) });
    });
    return out;
  }

  function autoPlace(words, align, excludeId) {
    var bs = blocks().filter(function (b) { return b.id !== excludeId; });
    for (var a = 0; a + words <= VRAM_WORDS; a += align) {
      var ok = bs.every(function (b) { return a + words <= b.addr || a >= b.addr + b.words; });
      if (ok) return a;
    }
    return 0; // no free spot: place at 0, overlap warning will fire
  }

  // ---------- register computation ----------
  function regWrites() {
    var w = [];
    var bgmode = st.mode | (st.mode === 1 && st.bg3prio ? 8 : 0);
    ["BG1","BG2","BG3","BG4"].forEach(function (bg) {
      var n = +bg.charAt(2), s = st.slots[bg];
      if (!bgActive(bg)) return;
      if (s.mapSize != null && s.mapAddr != null)
        w.push({ addr: 0x2107 + (n - 1), name: "BG" + n + "SC", val: ((s.mapAddr >> 10) << 2) | s.mapSize,
                 why: bg + " map @ " + hexw(s.mapAddr) + " · " + MAP_SIZES[s.mapSize] });
    });
    // NBA registers (nibbles of two BGs each)
    function nba(lo, hi) {
      var a = st.slots[lo], b = st.slots[hi], v = 0, parts = [];
      var has = false;
      if (bgActive(lo) && a.chrAddr != null) { v |= (a.chrAddr >> 12); parts.push(lo + " chr @ " + hexw(a.chrAddr)); has = true; }
      if (bgActive(hi) && b.chrAddr != null) { v |= (b.chrAddr >> 12) << 4; parts.push(hi + " chr @ " + hexw(b.chrAddr)); has = true; }
      return has ? { v: v, why: parts.join(" · ") } : null;
    }
    var n12 = nba("BG1", "BG2"), n34 = nba("BG3", "BG4");
    var o = st.slots.OBJ;
    var out = [{ addr: 0x2105, name: "BGMODE", val: bgmode, why: "Mode " + st.mode + (st.bg3prio && st.mode === 1 ? " + BG3 prio" : "") }];
    out = out.concat(w);
    if (n12) out.push({ addr: 0x210B, name: "BG12NBA", val: n12.v, why: n12.why });
    if (n34) out.push({ addr: 0x210C, name: "BG34NBA", val: n34.v, why: n34.why });
    if (o.tiles != null && o.addr != null)
      out.push({ addr: 0x2101, name: "OBSEL", val: (o.addr >> 13) | (o.sizePair << 5),
                 why: "OBJ chr @ " + hexw(o.addr) + " · " + OBJ_PAIRS[o.sizePair] });
    // TM: everything that has content
    var tm = 0;
    ["BG1","BG2","BG3","BG4"].forEach(function (bg, i) {
      var s = st.slots[bg];
      if (bgActive(bg) && (s.mapAddr != null || (st.mode === 7 && bg === "BG1" && st.slots.M7.enabled))) tm |= (1 << i);
    });
    if (st.mode === 7 && st.slots.M7.enabled) tm |= 1;
    if (o.tiles != null) tm |= 16;
    if (tm) out.push({ addr: 0x212C, name: "TM", val: tm, why: lang() === "de" ? "sichtbare Ebenen" : "visible layers" });
    return out;
  }

  function checks() {
    var out = [], bs = blocks();
    // overlaps
    for (var i = 0; i < bs.length; i++) for (var j = i + 1; j < bs.length; j++) {
      var a = bs[i], b = bs[j];
      if (a.addr < b.addr + b.words && b.addr < a.addr + a.words)
        out.push({ level: "err", text: L(T.overlap) + ": " + a.label + " (" + hexw(a.addr) + "–" + hexw(a.addr + a.words - 1) + ") ↔ " + b.label + " (" + hexw(b.addr) + "–" + hexw(b.addr + b.words - 1) + ")" });
    }
    bs.forEach(function (b) {
      if (b.addr + b.words > VRAM_WORDS)
        out.push({ level: "err", text: b.label + (lang() === "de" ? " ragt über das VRAM-Ende hinaus" : " extends past the end of VRAM") });
    });
    ["BG1","BG2","BG3","BG4"].forEach(function (bg) {
      if (!bgActive(bg)) return;
      var s = st.slots[bg];
      if (s.mapAddr != null && s.chrAddr == null) out.push({ level: "warn", text: bg + " " + L(T.mapNoChr) });
      if (s.chrAddr != null && s.mapAddr == null) out.push({ level: "warn", text: bg + " " + L(T.chrNoMap) });
    });
    if (st.mode === 7 && st.slots.M7.enabled) out.push({ level: "info", text: L(T.m7note) });
    if (st.slots.OBJ.tiles === 512) out.push({ level: "info", text: L(T.objNote512) });
    var used = bs.reduce(function (s2, b) { return s2 + Math.min(b.words, Math.max(0, VRAM_WORDS - b.addr)); }, 0);
    out.push({ level: "info", text: L(T.usage) + ": " + kb(used) + " / 64 KB (" + Math.round(used / VRAM_WORDS * 100) + "%)" });
    if (!out.some(function (c) { return c.level === "err"; })) out.unshift({ level: "ok", text: L(T.ok) });
    return out;
  }

  // ---------- actions ----------
  function assign(kind, slot) {
    var s;
    if (kind === "map" && slot.indexOf("BG") === 0 && bgActive(slot)) {
      s = st.slots[slot];
      if (s.mapSize == null) s.mapSize = 0;
      s.mapAddr = autoPlace(MAP_WORDS[s.mapSize], 0x400, slot + ".map");
    } else if (kind === "chr" && slot.indexOf("BG") === 0 && bgActive(slot)) {
      s = st.slots[slot];
      if (s.chrTiles == null) s.chrTiles = 256;
      s.chrAddr = autoPlace(s.chrTiles * chrWordsPerTile(bgBpp(slot)), 0x1000, slot + ".chr");
    } else if (kind === "obj" && slot === "OBJ") {
      s = st.slots.OBJ;
      if (s.tiles == null) s.tiles = 256;
      s.addr = autoPlace(s.tiles * 16, 0x2000, "OBJ.chr");
    } else if (kind === "m7" && slot === "BG1" && st.mode === 7) {
      st.slots.M7.enabled = true;
    } else if (kind === "custom") {
      st.customs.push({ name: "", words: 0x800, addr: autoPlace(0x800, 0x100, null) });
    } else return false;
    save(); return true;
  }

  // ---------- rendering ----------
  var host = null;
  function render(h) {
    host = h;
    var modeBtns = "";
    for (var m = 0; m <= 7; m++)
      modeBtns += '<button class="modebtn' + (m === st.mode ? " active" : "") + '" data-mode="' + m + '">' + m + "</button>";

    var palette = [
      { kind: "map", label: T.map, hint: T.dragMap, fam: "CST" },
      { kind: "chr", label: T.chr, hint: T.dragChr, fam: "CST" },
      { kind: "obj", label: T.objTiles, hint: T.dragObj, fam: "OBJ" },
      { kind: "m7", label: { en: "Mode 7 block", de: "Mode-7-Block" }, hint: T.dragM7, fam: "BG1" },
      { kind: "custom", label: T.custom, hint: T.dragCustom, fam: "CST" }
    ].map(function (p) {
      return '<div class="pl-chip" draggable="true" data-kind="' + p.kind + '">' +
             "<b>" + esc(L(p.label)) + "</b><span>" + esc(L(p.hint)) + "</span></div>";
    }).join("");

    h.innerHTML =
      '<div class="hero"><h1>' + esc(L(T.title)) + "</h1><p>" + esc(L(T.intro)) + "</p></div>" +
      '<div class="lv-controls"><div class="lv-row"><span class="lv-lbl">' + esc(L(T.mode)) + "</span>" + modeBtns +
        '<span class="lv-regs">' +
        '<button class="pl-btn" id="pl-export">' + esc(L(T.export)) + "</button>" +
        '<button class="pl-btn" id="pl-import">' + esc(L(T.import)) + "</button>" +
        '<input type="file" id="pl-file" accept=".json" style="display:none">' +
        '<button class="pl-btn danger" id="pl-reset">' + esc(L(T.reset)) + "</button></span></div></div>" +
      '<div class="pl-cols">' +
        '<div class="pl-palette"><h2 class="sec">' + esc(L(T.palette)) + "</h2>" + palette + "</div>" +
        '<div class="pl-slots"><h2 class="sec">' + esc(L(T.slots)) + '</h2><div id="pl-slotcards"></div></div>' +
      "</div>" +
      '<h2 class="sec">' + esc(L(T.vram)) + '</h2>' +
      '<div class="vrambar-wrap"><div class="vrambar" id="vrambar"></div><div class="vramticks" id="vramticks"></div></div>' +
      '<div class="pl-bottom"><div class="pl-checks"><h2 class="sec">' + esc(L(T.warnings)) + '</h2><div id="pl-checks"></div></div>' +
      '<div class="pl-regs"><h2 class="sec">' + esc(L(T.regs)) + '</h2><div id="pl-regs"></div>' +
      '<button class="pl-btn" id="pl-copy">' + esc(L(T.copy)) + "</button></div></div>";

    h.querySelectorAll(".modebtn").forEach(function (b) {
      b.onclick = function () { st.mode = +b.dataset.mode; save(); render(h); };
    });
    h.querySelectorAll(".pl-chip").forEach(function (c) {
      c.addEventListener("dragstart", function (e) { e.dataTransfer.setData("text/plain", c.dataset.kind); });
    });
    h.querySelector("#pl-export").onclick = exportJson;
    h.querySelector("#pl-import").onclick = function () { h.querySelector("#pl-file").click(); };
    h.querySelector("#pl-file").addEventListener("change", importJson);
    h.querySelector("#pl-reset").onclick = function () {
      if (confirm(L(T.resetConfirm))) { st = blankState(); save(); render(h); }
    };
    h.querySelector("#pl-copy").onclick = copyAsm;

    renderSlots();
    renderBar();
    renderChecksRegs();
  }

  function slotCard(name) {
    var active = name === "OBJ" || bgActive(name) || (name === "BG1" && st.mode === 7);
    var color = FAM_COLOR[name] || "var(--text-dim)";
    var s = st.slots[name];
    var inner = "";
    if (!active) {
      inner = '<div class="dim pl-na">' + esc(L(T.notInMode)) + "</div>";
    } else if (name === "BG1" && st.mode === 7) {
      inner = st.slots.M7.enabled
        ? '<div class="pl-item"><span>' + esc(L(T.m7block)) + ' · <b class="mono">$0000–$3FFF</b></span><button class="pl-x" data-act="rm-m7">✕</button></div>'
        : '<div class="pl-empty">' + esc(L(T.empty)) + "</div>";
    } else if (name === "OBJ") {
      if (s.tiles != null) {
        var tsel = [256, 512].map(function (t) { return '<option value="' + t + '"' + (s.tiles === t ? " selected" : "") + ">" + t + " tiles (" + kb(t * 16) + ")</option>"; }).join("");
        var psel = OBJ_PAIRS.map(function (p, i) { return '<option value="' + i + '"' + (s.sizePair === i ? " selected" : "") + ">" + p + "</option>"; }).join("");
        inner = '<div class="pl-item"><span>' + esc(L(T.objTiles)) + ' <select data-act="obj-tiles">' + tsel + "</select> @ <b class=\"mono\">" + hexw(s.addr) + '</b></span><button class="pl-x" data-act="rm-obj">✕</button></div>' +
                '<div class="pl-item"><span>' + esc(L(T.sizePair)) + ' <select data-act="obj-pair">' + psel + "</select></span></div>";
      } else inner = '<div class="pl-empty">' + esc(L(T.emptyObj)) + "</div>";
    } else {
      var rows = "";
      if (s.mapSize != null && s.mapAddr != null) {
        var msel = MAP_SIZES.map(function (ms, i) { return '<option value="' + i + '"' + (s.mapSize === i ? " selected" : "") + ">" + ms + " (" + kb(MAP_WORDS[i]) + ")</option>"; }).join("");
        rows += '<div class="pl-item"><span>' + esc(L(T.map)) + ' <select data-act="map-size">' + msel + "</select> @ <b class=\"mono\">" + hexw(s.mapAddr) + '</b></span><button class="pl-x" data-act="rm-map">✕</button></div>';
      }
      if (s.chrTiles != null && s.chrAddr != null) {
        var csel = CHR_TILE_CHOICES.map(function (t) { return '<option value="' + t + '"' + (s.chrTiles === t ? " selected" : "") + ">" + t + " tiles (" + kb(t * chrWordsPerTile(bgBpp(name))) + ")</option>"; }).join("");
        rows += '<div class="pl-item"><span>' + esc(L(T.chr)) + ' <select data-act="chr-tiles">' + csel + "</select> @ <b class=\"mono\">" + hexw(s.chrAddr) + '</b></span><button class="pl-x" data-act="rm-chr">✕</button></div>';
      }
      if (!rows) rows = '<div class="pl-empty">' + esc(L(T.empty)) + "</div>";
      else if (s.mapAddr == null && s.chrAddr == null) rows = '<div class="pl-empty">' + esc(L(T.empty)) + "</div>";
      inner = rows;
      if (rows.indexOf("pl-empty") < 0 || true) {
        var addBtns = '<div class="pl-adds">' +
          (s.mapAddr == null ? '<button class="pl-add" data-act="add-map">+ ' + esc(L(T.map)) + "</button>" : "") +
          (s.chrAddr == null ? '<button class="pl-add" data-act="add-chr">+ ' + esc(L(T.chr)) + "</button>" : "") + "</div>";
        inner += addBtns;
      }
    }
    if (name === "OBJ" && s.tiles == null) inner += '<div class="pl-adds"><button class="pl-add" data-act="add-obj">+ ' + esc(L(T.objTiles)) + "</button></div>";
    if (name === "BG1" && st.mode === 7 && !st.slots.M7.enabled) inner += '<div class="pl-adds"><button class="pl-add" data-act="add-m7">+ Mode 7</button></div>';

    var bppTag = "";
    if (name.indexOf("BG") === 0 && active && st.mode !== 7) bppTag = '<span class="bpptag">' + bgBpp(name) + "bpp</span>";
    if (name === "BG1" && st.mode === 7) bppTag = '<span class="bpptag">8bpp</span>';
    var labelIn = (name !== "OBJ" || true)
      ? '<input class="pl-label" data-slot="' + name + '" placeholder="' + esc(L(T.labelPh)) + '" value="' + esc((s && s.label) || "") + '">' : "";

    return '<div class="pl-slot' + (active ? "" : " inactive") + '" data-slot="' + name + '" style="--fc:' + color + '">' +
      '<div class="pl-slot-head"><b>' + name + "</b>" + bppTag + labelIn + "</div>" + inner + "</div>";
  }

  function renderSlots() {
    var el = host.querySelector("#pl-slotcards");
    el.innerHTML = ["BG1","BG2","BG3","BG4","OBJ"].map(slotCard).join("");

    el.querySelectorAll(".pl-slot").forEach(function (card) {
      var slot = card.dataset.slot;
      card.addEventListener("dragover", function (e) { e.preventDefault(); card.classList.add("dragover"); });
      card.addEventListener("dragleave", function () { card.classList.remove("dragover"); });
      card.addEventListener("drop", function (e) {
        e.preventDefault(); card.classList.remove("dragover");
        var kind = e.dataTransfer.getData("text/plain");
        if (kind === "custom") { assign("custom"); rerender(); return; }
        if (assign(kind, slot)) rerender();
      });
    });
    el.querySelectorAll(".pl-label").forEach(function (inp) {
      inp.addEventListener("input", function () { st.slots[inp.dataset.slot].label = inp.value; save(); });
    });
    el.querySelectorAll("[data-act]").forEach(function (c) {
      var slot = c.closest(".pl-slot").dataset.slot, s = st.slots[slot], act = c.dataset.act;
      var h2 = function () {
        if (act === "add-map") assign("map", slot);
        else if (act === "add-chr") assign("chr", slot);
        else if (act === "add-obj") assign("obj", "OBJ");
        else if (act === "add-m7") assign("m7", "BG1");
        else if (act === "rm-map") { s.mapAddr = null; s.mapSize = null; }
        else if (act === "rm-chr") { s.chrAddr = null; s.chrTiles = null; }
        else if (act === "rm-obj") { s.tiles = null; s.addr = null; }
        else if (act === "rm-m7") { st.slots.M7.enabled = false; }
        else if (act === "map-size") { s.mapSize = +c.value; s.mapAddr = autoPlace(MAP_WORDS[s.mapSize], 0x400, slot + ".map"); }
        else if (act === "chr-tiles") { s.chrTiles = +c.value; s.chrAddr = autoPlace(s.chrTiles * chrWordsPerTile(bgBpp(slot)), 0x1000, slot + ".chr"); }
        else if (act === "obj-tiles") { s.tiles = +c.value; s.addr = autoPlace(s.tiles * 16, 0x2000, "OBJ.chr"); }
        else if (act === "obj-pair") { s.sizePair = +c.value; }
        save(); rerender();
      };
      if (c.tagName === "SELECT") c.addEventListener("change", h2); else c.addEventListener("click", h2);
    });

    // palette drop on the whole page for custom blocks handled per slot; also allow drop on bar (below)
  }

  function renderBar() {
    var bar = host.querySelector("#vrambar"), ticks = host.querySelector("#vramticks");
    var bs = blocks();
    bar.innerHTML = "";
    bs.forEach(function (b) {
      var d = document.createElement("div");
      d.className = "vblock" + (b.kind === "map" ? " striped" : "") + (b.fixed ? " fixed" : "");
      d.style.setProperty("--fc", FAM_COLOR[b.fam]);
      d.style.left = (b.addr / VRAM_WORDS * 100) + "%";
      d.style.width = (Math.min(b.words, VRAM_WORDS - b.addr) / VRAM_WORDS * 100) + "%";
      d.title = b.label + " @ " + hexw(b.addr) + " (" + kb(b.words) + ")";
      d.innerHTML = "<span>" + esc(b.label) + "</span>";
      // custom blocks: name + size editable via prompt-free inline UI would be heavy; use title edit below bar
      if (!b.fixed) enableDragMove(d, b);
      bar.appendChild(d);
    });
    // overlap highlight
    for (var i = 0; i < bs.length; i++) for (var j = i + 1; j < bs.length; j++) {
      var a = bs[i], b2 = bs[j];
      if (a.addr < b2.addr + b2.words && b2.addr < a.addr + a.words) {
        bar.children[i].classList.add("clash"); bar.children[j].classList.add("clash");
      }
    }
    var tks = "";
    for (var t = 0; t <= 0x8000; t += 0x1000)
      tks += '<span style="left:' + (t / VRAM_WORDS * 100) + '%">' + hexw(t) + "</span>";
    ticks.innerHTML = tks;

    // bar accepts custom-block drops
    bar.addEventListener("dragover", function (e) { e.preventDefault(); });
    bar.addEventListener("drop", function (e) {
      e.preventDefault();
      if (e.dataTransfer.getData("text/plain") === "custom") { assign("custom"); rerender(); }
    });

    // custom block editor rows
    var edits = st.customs.map(function (c, i) {
      var sizes = [0x200, 0x400, 0x800, 0x1000, 0x2000, 0x4000].map(function (w) {
        return '<option value="' + w + '"' + (c.words === w ? " selected" : "") + ">" + kb(w) + "</option>";
      }).join("");
      return '<div class="pl-item custom-row"><span class="laddot" style="background:var(--text-dim)"></span>' +
        '<input class="pl-label" data-ci="' + i + '" data-cf="name" placeholder="' + esc(L(T.customPh)) + '" value="' + esc(c.name) + '">' +
        '<select data-ci="' + i + '" data-cf="words">' + sizes + "</select>" +
        '<b class="mono">@ ' + hexw(c.addr) + '</b><button class="pl-x" data-ci="' + i + '" data-cf="rm">✕</button></div>';
    }).join("");
    var wrap = host.querySelector("#pl-customs");
    if (!wrap) {
      wrap = document.createElement("div"); wrap.id = "pl-customs";
      host.querySelector(".vrambar-wrap").after(wrap);
    }
    wrap.innerHTML = edits;
    wrap.querySelectorAll("[data-ci]").forEach(function (c) {
      var i = +c.dataset.ci, f = c.dataset.cf;
      var fn = function () {
        if (f === "rm") st.customs.splice(i, 1);
        else if (f === "name") st.customs[i].name = c.value;
        else if (f === "words") { st.customs[i].words = +c.value; st.customs[i].addr = autoPlace(+c.value, 0x100, "C" + i); }
        save(); if (f !== "name") rerender();
      };
      if (c.tagName === "SELECT") c.addEventListener("change", fn);
      else if (c.tagName === "INPUT") c.addEventListener("input", fn);
      else c.addEventListener("click", fn);
    });
  }

  function enableDragMove(el2, b) {
    el2.addEventListener("pointerdown", function (e) {
      e.preventDefault();
      try { el2.setPointerCapture(e.pointerId); } catch (err) {}
      var bar = el2.parentElement, rect = bar.getBoundingClientRect();
      var startX = e.clientX, addr0 = b.addr;
      function mv(ev) {
        var dw = Math.round((ev.clientX - startX) / rect.width * VRAM_WORDS);
        var a = addr0 + dw;
        a = Math.round(a / b.align) * b.align;
        var maxA = Math.max(0, Math.floor((VRAM_WORDS - b.words) / b.align) * b.align);
        a = Math.max(0, Math.min(maxA, a));
        b.addr = a;
        el2.style.left = (a / VRAM_WORDS * 100) + "%";
      }
      function up() {
        window.removeEventListener("pointermove", mv);
        window.removeEventListener("pointerup", up);
        applyBlockAddr(b);
        save(); rerender();
      }
      window.addEventListener("pointermove", mv);
      window.addEventListener("pointerup", up);
    });
  }
  function applyBlockAddr(b) {
    if (b.kind === "map") st.slots[b.fam].mapAddr = b.addr;
    else if (b.kind === "chr") st.slots[b.fam].chrAddr = b.addr;
    else if (b.kind === "obj") st.slots.OBJ.addr = b.addr;
    else if (b.kind === "custom") st.customs[+b.id.slice(1)].addr = b.addr;
  }

  function renderChecksRegs() {
    var icons = { err: "⛔", warn: "⚠️", info: "💡", ok: "✅" };
    host.querySelector("#pl-checks").innerHTML = checks().map(function (c) {
      return '<div class="warn-item ' + (c.level === "ok" ? "info" : c.level) + '"><span class="ico">' + icons[c.level] + "</span><div>" + esc(c.text) + "</div></div>";
    }).join("");
    var rows = regWrites().map(function (r) {
      return '<div class="ladrow"><span class="laddot" style="background:var(--accent)"></span>' +
        '<a class="ladname mono" href="#/reg/' + r.addr.toString(16) + '">' + r.name + "</a>" +
        '<b class="mono">' + hex2(r.val) + "</b>" +
        '<span class="ladnote">' + esc(r.why) + "</span></div>";
    }).join("");
    host.querySelector("#pl-regs").innerHTML = rows || '<div class="dim">—</div>';
  }

  function rerender() { render(host); }

  function copyAsm() {
    var lines = regWrites().map(function (r) {
      return "    lda #" + hex2(r.val) + "\n    sta $" + r.addr.toString(16).toUpperCase() + "   ; " + r.name + " — " + r.why;
    });
    var txt = "; SNES Inspector setup\n" + lines.join("\n") + "\n";
    navigator.clipboard.writeText(txt).then(function () {
      var b = host.querySelector("#pl-copy"), old = b.textContent;
      b.textContent = L(T.copied);
      setTimeout(function () { b.textContent = old; }, 1200);
    }).catch(function () { window.prompt("Copy:", txt); });
  }
  function exportJson() {
    var blob = new Blob([JSON.stringify(st, null, 2)], { type: "application/json" });
    var a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = "snes-setup.json";
    a.click();
    URL.revokeObjectURL(a.href);
  }
  function importJson(e) {
    var f = e.target.files[0];
    if (!f) return;
    var rd = new FileReader();
    rd.onload = function () {
      try {
        var s = JSON.parse(rd.result);
        if (s && s.slots) { st = s; save(); render(host); }
        else alert("Invalid setup file");
      } catch (err) { alert("Invalid JSON: " + err.message); }
    };
    rd.readAsText(f);
  }

  window.SNESPlanner = {
    render: render,
    getState: function () { return st; },
    update: function (fn) { fn(st); save(); },
    regWrites: regWrites
  };
})();
