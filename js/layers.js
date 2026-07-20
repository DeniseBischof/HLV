/* SNES Inspector — visual layer view: exploded 3D stack of PPU layers,
   priority ladder per BG mode, composited result with parallax demo.
   Two sources: the built-in demo scene, or the user's setup from the planner. */
(function () {
  "use strict";
  var W = 256, H = 224;
  var raf = null;

  function lang() { return localStorage.getItem("snesLang") || "en"; }
  function L(t) { if (t == null) return ""; if (typeof t === "string") return t; return t[lang()] != null ? t[lang()] : t.en; }
  function esc(s) { return String(s).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;"); }
  function hexw(n) { return "$" + n.toString(16).toUpperCase().padStart(4, "0"); }
  function hex2(n) { return "$" + n.toString(16).toUpperCase().padStart(2, "0"); }
  function P() { return window.SNESPlanner; }

  var T = {
    title:   { en: "Layer view — how the picture is built", de: "Layer-Ansicht — wie das Bild entsteht" },
    intro:   { en: "The PPU composes every pixel from up to 12 priority slots, front to back. Below: an example scene split into its real hardware layers. Change the BG mode and toggle layers — the register values that produce exactly this setup are shown live.",
               de: "Die PPU setzt jeden Pixel aus bis zu 12 Prioritäts-Slots zusammen, von vorne nach hinten. Unten: eine Beispielszene, zerlegt in ihre echten Hardware-Ebenen. Ändere den BG-Modus und schalte Ebenen an/aus — die Registerwerte, die genau dieses Setup erzeugen, werden live angezeigt." },
    introSetup: { en: "This is YOUR setup from the planner, shown as the real priority stack. Labels and VRAM addresses come from what you assigned; the graphics are placeholders — they live in your game.",
               de: "Das ist DEIN Setup aus dem Planer, dargestellt als echter Prioritäts-Stapel. Labels und VRAM-Adressen kommen aus deiner Belegung; die Grafiken sind Platzhalter — die echten stecken in deinem Spiel." },
    srcDemo: { en: "Demo scene", de: "Demo-Szene" },
    sceneLbl: { en: "Scenario", de: "Szenario" },
    srcSetup:{ en: "My setup", de: "Mein Setup" },
    mode:    { en: "BG mode", de: "BG-Modus" },
    bg3p:    { en: "BG3 priority (HUD in front)", de: "BG3-Priorität (HUD nach vorn)" },
    extbg:   { en: "EXTBG (Mode 7 BG2)", de: "EXTBG (Mode-7-BG2)" },
    anim:    { en: "Parallax scroll", de: "Parallax-Scrolling" },
    visible: { en: "Layers on main screen (TM)", de: "Ebenen auf dem Main-Screen (TM)" },
    stackT:  { en: "Exploded layer stack", de: "Aufgefächerter Layer-Stapel" },
    stackS:  { en: "(hover a plane or a ladder row)", de: "(Ebene oder Ladder-Zeile hovern)" },
    result:  { en: "Final image (what the TV gets)", de: "Fertiges Bild (was der Fernseher bekommt)" },
    ladder:  { en: "Priority ladder — front to back", de: "Prioritäts-Reihenfolge — vorne nach hinten" },
    empty:   { en: "exists in this mode, empty in the demo", de: "existiert in diesem Modus, im Demo leer" },
    off:     { en: "hidden via TM", de: "über TM ausgeblendet" },
    regs:    { en: "This setup as register writes:", de: "Dieses Setup als Register-Writes:" },
    front:   { en: "FRONT", de: "VORNE" },
    back:    { en: "BACK", de: "HINTEN" },
    fillSlot:{ en: "empty — assign it in the setup planner", de: "leer — im Setup-Planer belegen" },
    planEmpty: { en: "Nothing planned yet — open the setup planner and drop some blocks first.", de: "Noch nichts geplant — öffne den Setup-Planer und zieh erst ein paar Bausteine rein." },
    editPlan: { en: "edit in planner", de: "im Planer bearbeiten" },
    prioTag:  { en: "PRIO TILES", de: "PRIO-TILES" },
    objMerged:{ en: "Sprites (prio 0–3)", de: "Sprites (Prio 0–3)" },
    oamNote:  { en: "priority is chosen per sprite via its OAM attributes", de: "die Priorität wählt jedes Sprite über seine OAM-Attribute" },
    bdNote:   { en: "sky color — CGRAM entry 0", de: "Himmelsfarbe — CGRAM-Eintrag 0" }
  };

  var MODE_NOTES = {
    0: { en: "4 layers but only 4 colors per tile — used for busy UI-heavy games.", de: "4 Ebenen, aber nur 4 Farben pro Tile — für UI-lastige Spiele." },
    1: { en: "The standard: two 16-color layers + a 2bpp layer for HUD/text. ~90% of all games.", de: "Der Standard: zwei 16-Farben-Ebenen + eine 2bpp-Ebene für HUD/Text. ~90 % aller Spiele." },
    2: { en: "Two 16-color layers with offset-per-tile (column scrolling).", de: "Zwei 16-Farben-Ebenen mit Offset-per-Tile (Spalten-Scrolling)." },
    3: { en: "BG1 gets 256 colors — great for big detailed art.", de: "BG1 bekommt 256 Farben — super für große, detaillierte Grafik." },
    4: { en: "256-color BG1 + 2bpp BG2, with offset-per-tile.", de: "256-Farben-BG1 + 2bpp-BG2, mit Offset-per-Tile." },
    5: { en: "512px hires — crisp text (Seiken Densetsu 3 menus, RPM Racing).", de: "512px Hires — scharfer Text (Seiken-Densetsu-3-Menüs, RPM Racing)." },
    6: { en: "512px hires, single layer, offset-per-tile. Almost never used.", de: "512px Hires, eine Ebene, Offset-per-Tile. Fast nie genutzt." },
    7: { en: "One 256-color layer, rotated/scaled by the matrix. The horizon area shows the backdrop ('screen over').", de: "Eine 256-Farben-Ebene, rotiert/skaliert per Matrix. Am Horizont zeigt sich der Backdrop ('Screen Over')." }
  };
  var MODE_BPP = { 0: [2,2,2,2], 1: [4,4,2,null], 2: [4,4,null,null], 3: [8,4,null,null],
                   4: [8,2,null,null], 5: [4,2,null,null], 6: [4,null,null,null], 7: [8,null,null,null] };
  var MODE_PROCON = {
    0: { pro: { en: "4 independent layers — maximum parallax · lowest VRAM cost per tile", de: "4 unabhängige Ebenen — maximales Parallax · geringste VRAM-Kosten pro Tile" },
         con: { en: "only 4 colors per tile — flat, washed-out look", de: "nur 4 Farben pro Tile — flacher, blasser Look" } },
    1: { pro: { en: "the all-rounder: two 16-color layers + cheap HUD/text layer · BG3 priority trick", de: "der Allrounder: zwei 16-Farben-Ebenen + günstige HUD/Text-Ebene · BG3-Prioritäts-Trick" },
         con: { en: "BG3 only 4 colors — fine for text, weak for art", de: "BG3 nur 4 Farben — gut für Text, schwach für Grafik" } },
    2: { pro: { en: "offset-per-tile: single columns can scroll individually (wave & split effects)", de: "Offset-per-Tile: einzelne Spalten scrollen unabhängig (Wellen- & Split-Effekte)" },
         con: { en: "only 2 layers · fiddly to set up, rarely worth it", de: "nur 2 Ebenen · frickelig einzurichten, selten den Aufwand wert" } },
    3: { pro: { en: "256 colors on BG1 — rich title screens and detailed art", de: "256 Farben auf BG1 — satte Titelbilder und detaillierte Grafik" },
         con: { en: "8bpp tiles eat VRAM (16 words/tile ×2) · only 2 layers", de: "8bpp-Tiles fressen VRAM (doppelt so teuer wie 4bpp) · nur 2 Ebenen" } },
    4: { pro: { en: "256 colors AND offset-per-tile combined", de: "256 Farben UND Offset-per-Tile kombiniert" },
         con: { en: "BG2 drops to 4 colors · so rare that tooling/emulator edge cases lurk", de: "BG2 fällt auf 4 Farben · so selten, dass Tooling-/Emulator-Randfälle lauern" } },
    5: { pro: { en: "true 512px hires — razor-sharp text and menus", de: "echte 512px-Hires — messerscharfer Text und Menüs" },
         con: { en: "color depth halved · tight VRAM fetch timing · sprites stay 256px wide", de: "halbierte Farbtiefe · enges VRAM-Fetch-Timing · Sprites bleiben 256px breit" } },
    6: { pro: { en: "hires plus offset-per-tile", de: "Hires plus Offset-per-Tile" },
         con: { en: "single layer — practically no shipped game used it", de: "eine einzige Ebene — praktisch kein Spiel hat ihn je genutzt" } },
    7: { pro: { en: "rotation & scaling · perspective floors via HDMA on the matrix · 256 colors", de: "Rotation & Skalierung · Perspektiv-Böden per HDMA auf die Matrix · 256 Farben" },
         con: { en: "one layer · fixed 128×128-tile map · no tile flipping · second plane only via EXTBG", de: "eine Ebene · fixe 128×128-Tile-Map · kein Tile-Spiegeln · zweite Ebene nur über EXTBG" } }
  };
  var MODE_USES = {
    0: { en: "Typical: puzzle boards & UI-heavy screens — 4 layers of decoration around a static playfield.", de: "Typisch: Puzzle-Boards & UI-lastige Screens — 4 Deko-Ebenen um ein statisches Spielfeld." },
    1: { en: "Typical: Super Mario World, Zelda ALttP, Chrono Trigger — and the Final Fantasy BATTLES: backdrop art on BG1/BG2, the blue text box is BG3 (2bpp is plenty for text).", de: "Typisch: Super Mario World, Zelda ALttP, Chrono Trigger — und die Final-Fantasy-KÄMPFE: Hintergrund-Artwork auf BG1/BG2, die blaue Textbox ist BG3 (2bpp reicht für Text locker)." },
    2: { en: "Typical: special column-scrolling effects (offset-per-tile) — rare.", de: "Typisch: spezielle Spalten-Scroll-Effekte (Offset-per-Tile) — selten." },
    3: { en: "Typical: title screens, stills, detailed single images with 256 colors.", de: "Typisch: Titelbilder, Standbilder, detailreiche Einzel-Screens mit 256 Farben." },
    4: { en: "Typical: almost nothing — 256 colors + offset-per-tile never found its game.", de: "Typisch: fast nichts — 256 Farben + Offset-per-Tile hat sein Spiel nie gefunden." },
    5: { en: "Typical: razor-sharp text menus — Seiken Densetsu 3, RPM Racing.", de: "Typisch: messerscharfe Text-Menüs — Seiken Densetsu 3, RPM Racing." },
    6: { en: "Typical: practically unused.", de: "Typisch: praktisch ungenutzt." },
    7: { en: "Typical: F-Zero, Super Mario Kart, Pilotwings — and the Final Fantasy world map, airship & boss zooms.", de: "Typisch: F-Zero, Super Mario Kart, Pilotwings — und die Final-Fantasy-Weltkarte, Luftschiff & Boss-Zooms." }
  };
  var MAP_SIZES = ["32×32", "64×32", "32×64", "64×64"];

  var SLOTS = {
    BG1H: { fam: "BG1", pri: 1, label: { en: "BG1 · high-priority tiles", de: "BG1 · Tiles mit Priorität" },   content: { en: "foreground arch (hero walks behind it)", de: "Vordergrund-Bogen (Held läuft dahinter)" } },
    BG1L: { fam: "BG1", pri: 0, label: { en: "BG1 · low-priority tiles",  de: "BG1 · Tiles ohne Priorität" },  content: { en: "ground & platforms", de: "Boden & Plattformen" } },
    BG2H: { fam: "BG2", pri: 1, label: { en: "BG2 · high-priority tiles", de: "BG2 · Tiles mit Priorität" },   content: null },
    BG2L: { fam: "BG2", pri: 0, label: { en: "BG2 · low-priority tiles",  de: "BG2 · Tiles ohne Priorität" },  content: { en: "mountains & sun", de: "Berge & Sonne" } },
    BG3H: { fam: "BG3", pri: 1, label: { en: "BG3 · high-priority tiles", de: "BG3 · Tiles mit Priorität" },   content: { en: "HUD / status bar", de: "HUD / Statusleiste" } },
    BG3L: { fam: "BG3", pri: 0, label: { en: "BG3 · low-priority tiles",  de: "BG3 · Tiles ohne Priorität" },  content: { en: "distant clouds", de: "ferne Wolken" } },
    BG4H: { fam: "BG4", pri: 1, label: { en: "BG4 · high-priority tiles", de: "BG4 · Tiles mit Priorität" },   content: null },
    BG4L: { fam: "BG4", pri: 0, label: { en: "BG4 · low-priority tiles",  de: "BG4 · Tiles ohne Priorität" },  content: { en: "stars & moon", de: "Sterne & Mond" } },
    OBJ3: { fam: "OBJ", pri: 3, label: { en: "Sprites · priority 3",      de: "Sprites · Priorität 3" },       content: { en: "bird", de: "Vogel" } },
    OBJ2: { fam: "OBJ", pri: 2, label: { en: "Sprites · priority 2",      de: "Sprites · Priorität 2" },       content: { en: "hero", de: "Held" } },
    OBJ1: { fam: "OBJ", pri: 1, label: { en: "Sprites · priority 1",      de: "Sprites · Priorität 1" },       content: null },
    OBJ0: { fam: "OBJ", pri: 0, label: { en: "Sprites · priority 0",      de: "Sprites · Priorität 0" },       content: { en: "coin (in front of clouds, behind mountains!)", de: "Münze (vor den Wolken, hinter den Bergen!)" } },
    BD:   { fam: "BD",  pri: 0, label: { en: "Backdrop (CGRAM color 0)",  de: "Backdrop (CGRAM-Farbe 0)" },    content: { en: "sky color", de: "Himmelsfarbe" } }
  };
  var FAM_COLOR = { BG1: "var(--f1)", BG2: "var(--f2)", BG3: "var(--f3)", BG4: "var(--f5)", OBJ: "var(--f7)", BD: "var(--text-dim)" };
  var FAM_HEX = { BG1: "#4fc3f7", BG2: "#66bb6a", BG3: "#ffb74d", BG4: "#ba68c8", OBJ: "#f06292", BD: "#8a94a6" };
  var FAM_REGS = {
    BG1: [[0x2105,"BGMODE"],[0x2107,"BG1SC"],[0x210B,"BG12NBA"],[0x210D,"BG1HOFS"]],
    BG2: [[0x2108,"BG2SC"],[0x210B,"BG12NBA"],[0x210F,"BG2HOFS"]],
    BG3: [[0x2109,"BG3SC"],[0x210C,"BG34NBA"],[0x2105,"BGMODE"]],
    BG4: [[0x210A,"BG4SC"],[0x210C,"BG34NBA"]],
    OBJ: [[0x2101,"OBSEL"],[0x2104,"OAMDATA"],[0x2103,"OAMADDH"]],
    BD:  [[0x2121,"CGADD"],[0x2132,"COLDATA"]]
  };
  var SPEED = { BG4L: .15, BG3L: .3, BG2L: .5, BG2H: .5, BG1L: 1, BG1H: 1.4, BG3H: 0, BG4H: 0, OBJ0: 0, OBJ1: 0, OBJ2: 0, OBJ3: 0, BD: 0 };

  function ladderFor(mode, bg3prio, extbg) {
    switch (mode) {
      case 0: return ["OBJ3","BG1H","BG2H","OBJ2","BG1L","BG2L","OBJ1","BG3H","BG4H","OBJ0","BG3L","BG4L","BD"];
      case 1: return bg3prio
        ? ["BG3H","OBJ3","BG1H","BG2H","OBJ2","BG1L","BG2L","OBJ1","OBJ0","BG3L","BD"]
        : ["OBJ3","BG1H","BG2H","OBJ2","BG1L","BG2L","OBJ1","BG3H","OBJ0","BG3L","BD"];
      case 2: case 3: case 4: case 5:
        return ["OBJ3","BG1H","OBJ2","BG2H","OBJ1","BG1L","OBJ0","BG2L","BD"];
      case 6: return ["OBJ3","BG1H","OBJ2","OBJ1","BG1L","OBJ0","BD"];
      case 7: return extbg
        ? ["OBJ3","OBJ2","BG2H","OBJ1","BG1L","OBJ0","BG2L","BD"]
        : ["OBJ3","OBJ2","OBJ1","BG1L","OBJ0","BD"];
    }
  }

  // ---------- demo scene drawing (pixel-art via fillRect) ----------
  function mk() { var c = document.createElement("canvas"); c.width = W; c.height = H; return c; }
  function cx(c) { var x = c.getContext("2d"); x.imageSmoothingEnabled = false; return x; }
  function R(g, x, y, w, h, col) { g.fillStyle = col; g.fillRect(x, y, w, h); }

  function drawBD(g)  { R(g, 0, 0, W, H, "#20336e"); }
  function drawBG4L(g) {
    var pts = [[18,30],[52,14],[86,44],[120,22],[150,52],[186,12],[214,38],[238,20],[70,70],[200,66],[30,86],[160,90]];
    pts.forEach(function (p) { R(g, p[0], p[1], 2, 2, "#cdd7ff"); });
    R(g, 216, 26, 14, 14, "#f2eecb");
    g.clearRect(210, 20, 12, 12); // bite out of the corner -> crescent moon
  }
  function drawBG3L(g) {
    function cloud(x, y, w) { R(g, x+8, y, w-16, 8, "#8fa3cf"); R(g, x, y+8, w, 10, "#8fa3cf"); }
    cloud(24, 58, 56); cloud(120, 44, 48); cloud(190, 74, 56); cloud(76, 96, 44);
  }
  function drawBG3H(g) {
    R(g, 0, 0, W, 26, "#101425"); R(g, 0, 24, W, 2, "#3d4a78");
    R(g, 8, 8, 40, 10, "#e8ecf7");
    for (var i = 0; i < 3; i++) R(g, 60 + i*14, 8, 10, 10, "#e5484d");
    R(g, 208, 8, 10, 10, "#f5c542"); R(g, 224, 8, 24, 10, "#e8ecf7");
  }
  function drawBG2L(g) {
    R(g, 196, 34, 22, 22, "#f5c542"); // sun
    function tri(xc, half, top, col, maxY) {
      for (var y = top; y < (maxY || 176); y += 2) {
        var w2 = Math.min(half, (y - top + 2));
        R(g, xc - w2, y, w2 * 2, 2, col);
      }
    }
    tri(52, 60, 92, "#2f5e52"); tri(140, 76, 74, "#274d44"); tri(226, 58, 100, "#2f5e52");
    tri(52, 60, 92, "#e8ecf7", 106); tri(140, 76, 74, "#e8ecf7", 90); tri(226, 58, 100, "#e8ecf7", 114); // snow caps
    R(g, 0, 168, W, 8, "#274d44");
  }
  function drawBG1L(g) {
    R(g, 0, 176, W, 48, "#6b4a2b");
    for (var x = 0; x < W; x += 16) { R(g, x, 176, 16, 8, "#4f9e3f"); R(g, x+2, 186, 4, 4, "#5a3d22"); R(g, x+9, 196, 4, 4, "#5a3d22"); }
    R(g, 40, 138, 64, 10, "#8a5a33"); R(g, 40, 138, 64, 4, "#4f9e3f");
    R(g, 10, 160, 22, 16, "#3f7e33"); R(g, 224, 158, 26, 18, "#3f7e33");
  }
  function drawBG1H(g) {
    R(g, 168, 64, 12, 112, "#8f8ba8"); R(g, 220, 64, 12, 112, "#8f8ba8");
    R(g, 160, 52, 80, 14, "#a5a1bd"); R(g, 166, 60, 68, 6, "#7c7896");
    R(g, 168, 170, 12, 6, "#6f6b88"); R(g, 220, 170, 12, 6, "#6f6b88");
  }
  function drawM7(g, t) {
    var img = g.createImageData(W, H);
    var d = img.data, hor = 96;
    for (var y = hor + 2; y < H; y++) {
      var z = y - hor, u = 160 / z;
      for (var x = 0; x < W; x++) {
        var wx = (x - 128) * u + (t || 0) * .6, wz = u * 42 + (t || 0);
        var c = ((Math.floor(wx / 24) + Math.floor(wz / 24)) & 1) ? [188, 96, 96] : [232, 226, 214];
        var i = (y * W + x) * 4;
        d[i] = c[0]; d[i+1] = c[1]; d[i+2] = c[2]; d[i+3] = 255;
      }
    }
    g.putImageData(img, 0, 0);
  }
  function drawOBJ3(g, t) {
    g.clearRect(0, 0, W, H);
    var drift = ((t || 0) * 0.45) % (W + 40);
    var up = Math.floor((t || 0) / 14) % 2;      // wing flap
    function bird(x, y) {
      x = ((x - drift) % (W + 40) + (W + 40)) % (W + 40) - 20;
      R(g, x, y, 6, 4, "#1b2030");
      R(g, x - 6, y - (up ? 4 : 0), 6, 4, "#1b2030");
      R(g, x + 6, y - (up ? 4 : 0), 6, 4, "#1b2030");
    }
    bird(56, 46); bird(150, 62);
  }
  function drawOBJ2(g) {
    var x = 148, y = 144;
    R(g, x+6, y, 16, 12, "#f0c8a0");
    R(g, x+6, y-4, 16, 6, "#c23b3b");
    R(g, x+2, y+12, 24, 14, "#c23b3b");
    R(g, x+2, y+26, 8, 6, "#3b56c2"); R(g, x+18, y+26, 8, 6, "#3b56c2");
    R(g, x+10, y+4, 3, 3, "#1b2030");
  }
  function drawOBJ0(g, t) {
    g.clearRect(0, 0, W, H);
    var y = 50 + Math.round(Math.sin((t || 0) / 9) * 3);   // coin bobs
    R(g, 128, y, 12, 14, "#f5c542"); R(g, 132, y + 4, 4, 6, "#b98d1e");
  }

  // ---------- top-down RPG scene (Mode 1, ALttP-style) ----------
  function topBG2L(g) {
    R(g, 0, 0, W, H, "#4f9e3f");
    for (var y = 0; y < H; y += 32) for (var x = 0; x < W; x += 32)
      if (((x + y) / 32) % 2) R(g, x, y, 32, 32, "#58a848");
    R(g, 0, 128, W, 20, "#c9a86a"); R(g, 0, 127, W, 1, "#8a6a3a"); R(g, 0, 148, W, 1, "#8a6a3a"); // path E-W
    R(g, 118, 0, 20, H, "#c9a86a"); R(g, 117, 0, 1, H, "#8a6a3a"); R(g, 138, 0, 1, H, "#8a6a3a"); // path N-S
    R(g, 190, 172, 52, 38, "#3b56c2"); R(g, 196, 178, 40, 26, "#5a7ee0");                          // pond
    [[16, 40], [96, 172], [230, 60], [60, 96]].forEach(function (f) { R(g, f[0], f[1], 4, 4, "#e5484d"); R(g, f[0]+1, f[1]-3, 2, 3, "#3f7e33"); });
  }
  function topBG1L(g) {
    R(g, 24, 72, 56, 40, "#b98d5a"); R(g, 44, 92, 16, 20, "#5a3d22"); R(g, 30, 80, 12, 10, "#9ecbff"); // house
    R(g, 152, 76, 12, 20, "#6b4a2b"); R(g, 204, 116, 12, 20, "#6b4a2b");                              // trunks
    for (var x = 8; x < 104; x += 16) R(g, x, 196, 8, 14, "#8a5a33");                                 // fence
  }
  function topBG1H(g) {
    R(g, 20, 52, 64, 22, "#c23b3b"); R(g, 30, 40, 44, 14, "#c23b3b");                                 // roof
    function canopy(cx2, cy) {
      R(g, cx2 - 26, cy, 52, 22, "#2f7e33"); R(g, cx2 - 18, cy - 10, 36, 12, "#2f7e33");
      R(g, cx2 - 30, cy + 8, 60, 10, "#2f7e33"); R(g, cx2 - 12, cy - 4, 10, 6, "#4f9e3f");
    }
    canopy(158, 56); canopy(210, 96);
  }
  function topBG3H(g) {
    R(g, 0, 0, W, 24, "#101425"); R(g, 0, 22, W, 2, "#3d4a78");
    for (var i = 0; i < 3; i++) R(g, 8 + i*14, 7, 10, 10, "#e5484d");
    R(g, 200, 6, 10, 12, "#3fae5a"); R(g, 216, 8, 28, 8, "#e8ecf7");
  }
  function topOBJ2(g) { // hero — walks UNDER the tree canopy (BG1H)
    R(g, 148, 60, 12, 6, "#c9a86a"); R(g, 148, 64, 12, 10, "#f0c8a0");
    R(g, 146, 74, 16, 12, "#3fae5a"); R(g, 148, 86, 5, 6, "#8a5a33"); R(g, 155, 86, 5, 6, "#8a5a33");
  }
  function topOBJ1(g) { // enemy
    R(g, 58, 154, 18, 12, "#c23b3b"); R(g, 61, 157, 4, 4, "#e8ecf7"); R(g, 69, 157, 4, 4, "#e8ecf7");
    R(g, 58, 166, 5, 4, "#8f2b2b"); R(g, 71, 166, 5, 4, "#8f2b2b");
  }

  // ---------- Mode-7 racer scene ----------
  function raceOBJ2(g, t) { // player car, rear view; exhaust flames flicker
    g.clearRect(0, 0, W, H);
    R(g, 104, 152, 48, 22, "#3b56c2"); R(g, 112, 144, 32, 12, "#9ecbff");
    R(g, 98, 166, 12, 14, "#111522"); R(g, 146, 166, 12, 14, "#111522");
    R(g, 112, 174, 32, 6, "#26398f");
    var f = Math.floor((t || 0) / 6) % 2;
    R(g, 118, 180, 6, 5 + f * 3, f ? "#f5c542" : "#e5484d");
    R(g, 132, 180, 6, 5 + (1 - f) * 3, f ? "#e5484d" : "#f5c542");
  }
  function raceOBJ3(g) { // rival ahead — smaller sprite fakes the distance
    R(g, 148, 118, 26, 12, "#c23b3b"); R(g, 152, 112, 16, 8, "#f0b8b8");
    R(g, 144, 126, 7, 8, "#111522"); R(g, 170, 126, 7, 8, "#111522");
  }

  // ---------- Mode-3 title screen scene ----------
  function titleBG2L(g) {
    R(g, 0, 0, W, H, "#0d1030");
    var pts = [[12,20],[40,60],[70,14],[95,90],[130,30],[160,70],[190,18],[220,50],[240,100],[30,130],[80,160],[140,140],[200,170],[240,200],[20,190],[110,205],[170,196],[60,40],[210,120],[100,52]];
    pts.forEach(function (p, i) { R(g, p[0], p[1], 2, 2, i % 3 ? "#cdd7ff" : "#7b8fd0"); });
  }
  function titleBG1L(g) {
    var grad = ["#1c2c8f", "#2438a0", "#3040b4", "#3c48c8", "#5048c8", "#6448c0", "#7848b8", "#8c48b0"];
    for (var i = 0; i < 8; i++) R(g, 40, 48 + i * 8, 176, 8, grad[i]);
    R(g, 38, 46, 180, 2, "#cdd7ff"); R(g, 38, 112, 180, 2, "#cdd7ff");
    R(g, 38, 46, 2, 68, "#cdd7ff"); R(g, 216, 46, 2, 68, "#cdd7ff");
    g.fillStyle = "#0d1030"; g.font = "700 40px Consolas, monospace"; g.fillText("SNES", 68, 94);
    g.fillStyle = "#ffffff"; g.fillText("SNES", 66, 92);
    g.fillStyle = "#cdd7ff"; g.font = "700 11px Consolas, monospace";
    g.fillText("HARDWARE INSPECTOR", 66, 106);
  }
  function titleOBJ3(g, t) { // sparkles twinkle on the logo
    g.clearRect(0, 0, W, H);
    [[52, 56], [204, 66], [92, 118]].forEach(function (p, i) {
      var big = Math.floor(((t || 0) + i * 8) / 12) % 2;
      if (big) { R(g, p[0] - 4, p[1], 10, 2, "#ffffff"); R(g, p[0], p[1] - 4, 2, 10, "#ffffff"); }
      else R(g, p[0], p[1], 2, 2, "#cdd7ff");
    });
  }
  function titleOBJ0(g, t) { // blinking PRESS START
    g.clearRect(0, 0, W, H);
    if (Math.floor((t || 0) / 25) % 2) return;
    g.fillStyle = "#e8ecf7"; g.font = "700 14px Consolas, monospace";
    g.fillText("PRESS START", 82, 172);
  }

  // ---------- Mode-0 puzzle scene (4 layers at once) ----------
  function puzzBG1L(g) { // playfield well + settled pieces
    R(g, 40, 24, 96, 184, "#6f6b88"); R(g, 48, 24, 80, 176, "#171b26");
    var cols = ["#7b6cff", "#4fc3f7", "#66bb6a", "#ffb74d"];
    var stack = [[0,10,0],[1,10,1],[2,10,3],[4,10,2],[0,9,2],[1,9,2],[4,9,0],[2,8,1]];
    stack.forEach(function (s) {
      R(g, 48 + s[0]*16, 24 + s[1]*16, 16, 16, cols[s[2]]);
      R(g, 48 + s[0]*16 + 2, 24 + s[1]*16 + 2, 4, 4, "#ffffff");
    });
  }
  function puzzBG2L(g) { // NEXT + score panels
    R(g, 152, 24, 84, 96, "#6f6b88"); R(g, 158, 30, 72, 84, "#171b26");
    g.fillStyle = "#e8ecf7"; g.font = "700 12px Consolas, monospace"; g.fillText("NEXT", 178, 46);
    R(g, 178, 56, 16, 16, "#f06292"); R(g, 194, 56, 16, 16, "#f06292"); R(g, 178, 72, 16, 16, "#f06292");
    R(g, 152, 136, 84, 44, "#6f6b88"); R(g, 158, 142, 72, 32, "#171b26");
    g.fillText("SCORE", 172, 156); R(g, 166, 162, 56, 8, "#e8ecf7");
  }
  function puzzBG3L(g) { // mid deco: drifting bubbles
    g.strokeStyle = "#4fc3f7"; g.lineWidth = 2;
    [[20, 60, 8], [232, 90, 11], [14, 170, 6], [244, 190, 8], [26, 120, 5]].forEach(function (b) {
      g.beginPath(); g.arc(b[0], b[1], b[2], 0, 7); g.stroke();
    });
  }
  function puzzBG4L(g) { // far deco: dim checker
    for (var y = 0; y < H; y += 32) for (var x = 0; x < W; x += 32)
      if (((x + y) / 32) % 2) R(g, x, y, 32, 32, "#141928");
  }
  function puzzOBJ2(g, t) { // the falling piece
    g.clearRect(0, 0, W, H);
    var y = 28 + Math.floor(((t || 0) * 0.35) % 140 / 16) * 16;
    R(g, 64, y, 16, 16, "#f06292"); R(g, 80, y, 16, 16, "#f06292");
    R(g, 66, y + 2, 4, 4, "#ffffff"); R(g, 82, y + 2, 4, 4, "#ffffff");
  }

  // ---------- scenes: what the modes were actually used for ----------
  var SCENES = {
    plat: {
      label: { en: "Jump'n'Run", de: "Jump'n'Run" }, mode: 1, bg3prio: true, modes: [1, 2],
      draw: { BD: drawBD, BG3L: drawBG3L, BG3H: drawBG3H, BG2L: drawBG2L, BG1L: drawBG1L, BG1H: drawBG1H, OBJ3: drawOBJ3, OBJ2: drawOBJ2, OBJ0: drawOBJ0, BG4L: drawBG4L },
      anim: { OBJ3: drawOBJ3, OBJ0: drawOBJ0 },
      notes: {
        BG1H: { en: "foreground arch (hero walks behind it)", de: "Vordergrund-Bogen (Held läuft dahinter)" },
        BG1L: { en: "ground & platforms", de: "Boden & Plattformen" },
        BG2L: { en: "mountains & sun", de: "Berge & Sonne" },
        BG3H: { en: "HUD / status bar", de: "HUD / Statusleiste" },
        BG3L: { en: "distant clouds", de: "ferne Wolken" },
        BG4L: { en: "stars & moon (Mode 0 only)", de: "Sterne & Mond (nur Mode 0)" },
        OBJ3: { en: "birds", de: "Vögel" }, OBJ2: { en: "hero", de: "Held" },
        OBJ0: { en: "coin (in front of clouds, behind mountains!)", de: "Münze (vor den Wolken, hinter den Bergen!)" },
        BD: { en: "sky color", de: "Himmelsfarbe" }
      }
    },
    top: {
      label: { en: "Top-Down-RPG", de: "Top-Down-RPG" }, mode: 1, bg3prio: true, modes: [1],
      draw: { BD: drawBD, BG2L: topBG2L, BG1L: topBG1L, BG1H: topBG1H, BG3H: topBG3H, OBJ2: topOBJ2, OBJ1: topOBJ1 },
      speeds: { BG2L: 1, BG1L: 1, BG1H: 1 },
      notes: {
        BG2L: { en: "ground: grass, paths, pond (ALttP-style)", de: "Boden: Gras, Wege, Teich (ALttP-Stil)" },
        BG1L: { en: "objects: house, trunks, fence", de: "Objekte: Haus, Stämme, Zaun" },
        BG1H: { en: "tree canopies & roof — the hero walks UNDER them", de: "Baumkronen & Dach — der Held läuft DARUNTER durch" },
        BG3H: { en: "HUD: hearts & rupees", de: "HUD: Herzen & Rubine" },
        OBJ2: { en: "hero (half hidden by the canopy!)", de: "Held (halb von der Baumkrone verdeckt!)" },
        OBJ1: { en: "enemy", de: "Gegner" },
        BD: { en: "backdrop (invisible under the full ground layer)", de: "Backdrop (unter der vollflächigen Boden-Ebene unsichtbar)" }
      }
    },
    race: {
      label: { en: "Mode-7-Racer", de: "Mode-7-Racer" }, mode: 7, bg3prio: false, modes: [7],
      draw: { BD: drawBD, OBJ2: raceOBJ2, OBJ3: raceOBJ3 },
      anim: { OBJ2: raceOBJ2 },
      notes: {
        BG1L: { en: "the track: one Mode-7 layer, perspective via HDMA on M7A–D", de: "die Strecke: eine Mode-7-Ebene, Perspektive per HDMA auf M7A–D" },
        OBJ2: { en: "your racer (flames animated)", de: "dein Racer (Flammen animiert)" },
        OBJ3: { en: "rival 'ahead' — smaller sprite fakes the distance", de: "Rivale 'weiter vorn' — kleineres Sprite fakt die Entfernung" },
        BD: { en: "sky above the Mode-7 horizon ('screen over')", de: "Himmel über dem Mode-7-Horizont ('Screen Over')" }
      }
    },
    title: {
      label: { en: "Title (Mode 3)", de: "Titelbild (Mode 3)" }, mode: 3, bg3prio: false, modes: [3, 4],
      draw: { BD: drawBD, BG2L: titleBG2L, BG1L: titleBG1L, OBJ3: titleOBJ3, OBJ0: titleOBJ0 },
      anim: { OBJ3: titleOBJ3, OBJ0: titleOBJ0 },
      speeds: { BG1L: 0, BG2L: 0.15 },
      notes: {
        BG1L: { en: "the logo: 8bpp = 256 colors for smooth gradients", de: "das Logo: 8bpp = 256 Farben für weiche Verläufe" },
        BG2L: { en: "4bpp starfield drifting behind", de: "4bpp-Sternenhimmel driftet dahinter" },
        OBJ3: { en: "sparkles (twinkling)", de: "Funkel-Sprites (glitzern)" },
        OBJ0: { en: "blinking PRESS START", de: "blinkendes PRESS START" },
        BD: { en: "deep-space backdrop", de: "Weltraum-Backdrop" }
      }
    },
    puzz: {
      label: { en: "Puzzle (Mode 0)", de: "Puzzle (Mode 0)" }, mode: 0, bg3prio: false, modes: [0, 1],
      draw: { BD: drawBD, BG1L: puzzBG1L, BG2L: puzzBG2L, BG3L: puzzBG3L, BG4L: puzzBG4L, OBJ2: puzzOBJ2 },
      anim: { OBJ2: puzzOBJ2 },
      speeds: { BG1L: 0, BG2L: 0, BG3L: 0.35, BG4L: 0.12 },
      notes: {
        BG1L: { en: "playfield well + settled pieces", de: "Spielfeld-Schacht + abgelegte Steine" },
        BG2L: { en: "NEXT & score panels", de: "NEXT- & Score-Panels" },
        BG3L: { en: "deco bubbles, slow parallax", de: "Deko-Blasen, langsames Parallax" },
        BG4L: { en: "far deco checker — 4 layers at once is Mode 0's whole point", de: "fernes Deko-Karo — 4 Ebenen gleichzeitig ist der ganze Sinn von Mode 0" },
        OBJ2: { en: "the falling piece", de: "der fallende Stein" },
        BD: { en: "backdrop", de: "Backdrop" }
      }
    }
  };
  var SCENE_ORDER = ["plat", "top", "race", "title", "puzz"];

  // ---------- setup-mode placeholder textures ----------
  function truncate(g, s, maxW) {
    if (g.measureText(s).width <= maxW) return s;
    while (s.length > 1 && g.measureText(s + "…").width > maxW) s = s.slice(0, -1);
    return s + "…";
  }
  function setupTexture(fam, title, lines, badge) {
    var c = mk(), g = cx(c), col = FAM_HEX[fam];
    R(g, 0, 0, W, H, fam === "BD" ? "#20336e" : "#151a23");
    if (fam !== "BD") {
      g.strokeStyle = col + "26"; g.lineWidth = 9;
      for (var i = -H; i < W + H; i += 30) {
        g.beginPath(); g.moveTo(i, H); g.lineTo(i + H, 0); g.stroke();
      }
    }
    g.fillStyle = col;
    g.font = "700 21px Consolas, monospace";
    g.fillText(truncate(g, title, W - 30), 14, 44);
    g.font = "600 13px Consolas, monospace";
    g.fillStyle = "#d7dde8";
    lines.forEach(function (ln, j) { g.fillText(truncate(g, ln, W - 28), 14, 74 + j * 20); });
    if (badge) {
      g.font = "700 11px Consolas, monospace";
      var bw = g.measureText(badge).width + 12;
      g.fillStyle = col; g.fillRect(W - bw - 8, 10, bw, 18);
      g.fillStyle = "#0d0f14"; g.fillText(badge, W - bw - 2, 23);
    }
    if (fam === "OBJ") {
      [[26, 178, 20], [70, 186, 14], [110, 174, 26], [170, 184, 18], [214, 178, 22]].forEach(function (s2) {
        g.fillStyle = col + "55"; g.fillRect(s2[0], s2[1], s2[2], s2[2]);
        g.strokeStyle = col; g.lineWidth = 2; g.strokeRect(s2[0], s2[1], s2[2], s2[2]);
      });
    }
    return c;
  }

  // ---------- state ----------
  var st = { src: localStorage.getItem("snesLayersSource") || "demo",
             scene: SCENES[localStorage.getItem("snesLayersScene")] ? localStorage.getItem("snesLayersScene") : "plat",
             mode: 1, bg3prio: true, extbg: false,
             anim: localStorage.getItem("snesLayersAnim") !== "0",
             tm: { BG1: true, BG2: true, BG3: true, BG4: true, OBJ: true } };
  st.mode = SCENES[st.scene].mode;
  st.bg3prio = SCENES[st.scene].bg3prio;
  var canvases = {};

  // ---------- setup-source helpers ----------
  function pst() { return P() ? P().getState() : null; }
  function setupAssigned(fam) {
    var s = pst();
    if (!s) return false;
    if (fam === "BD") return true;
    if (fam === "OBJ") return s.slots.OBJ.tiles != null;
    if (s.mode === 7 && fam === "BG1") return s.slots.M7.enabled;
    var sl = s.slots[fam];
    return sl && (sl.mapAddr != null || sl.chrAddr != null);
  }
  function setupNote(fam) {
    var s = pst(), parts = [];
    if (fam === "BD") return L(T.bdNote);
    if (fam === "OBJ") {
      var o = s.slots.OBJ;
      if (o.label) parts.push(o.label);
      if (o.addr != null) parts.push("CHR @ " + hexw(o.addr) + " (" + o.tiles + "t)");
      parts.push(L(T.oamNote));
      return parts.join(" · ");
    }
    if (s.mode === 7 && fam === "BG1" && s.slots.M7.enabled) {
      var lb = s.slots.BG1.label;
      return (lb ? lb + " · " : "") + "Mode 7 MAP+CHR @ $0000–$3FFF";
    }
    var sl = s.slots[fam];
    if (sl.label) parts.push(sl.label);
    if (sl.mapAddr != null) parts.push("MAP @ " + hexw(sl.mapAddr) + " (" + MAP_SIZES[sl.mapSize] + ")");
    if (sl.chrAddr != null) parts.push("CHR @ " + hexw(sl.chrAddr) + " (" + sl.chrTiles + "t)");
    return parts.join(" · ");
  }
  function buildSetupCanvas(slot) {
    var meta = SLOTS[slot], fam = meta.fam, s = pst();
    if (fam === "BD") return setupTexture("BD", lang() === "de" ? "Backdrop" : "Backdrop", [L(T.bdNote)]);
    var title, lines = [], badge = null;
    if (fam === "OBJ") {
      var o = s.slots.OBJ;
      title = o.label || "Sprites";
      lines.push("OBJ CHR @ " + hexw(o.addr) + " · " + o.tiles + " tiles");
      lines.push(L(T.objMerged));
    } else if (s.mode === 7 && fam === "BG1") {
      title = s.slots.BG1.label || "Mode 7";
      lines.push("MAP+CHR @ $0000–$3FFF · 8bpp");
    } else {
      var sl = s.slots[fam];
      title = sl.label || fam;
      if (sl.mapAddr != null) lines.push("MAP @ " + hexw(sl.mapAddr) + " · " + MAP_SIZES[sl.mapSize]);
      if (sl.chrAddr != null) lines.push("CHR @ " + hexw(sl.chrAddr) + " · " + sl.chrTiles + " tiles · " + MODE_BPP[s.mode][+fam.charAt(2) - 1] + "bpp");
      if (slot.slice(-1) === "H") badge = L(T.prioTag);
    }
    return setupTexture(fam, title, lines, badge);
  }

  function buildCanvases() {
    canvases = {};
    if (st.src === "setup") {
      var ladder = ladderFor(st.mode, st.bg3prio, false);
      ladder.forEach(function (slot) {
        if (!planeVisibleSetup(slot)) return;
        canvases[slot] = buildSetupCanvas(slot);
      });
      return;
    }
    var scene = SCENES[st.scene];
    Object.keys(scene.draw).forEach(function (slot) {
      var c = mk();
      if (slot === "BG1L" && st.mode === 7) drawM7(cx(c), 0);
      else scene.draw[slot](cx(c), 0);
      canvases[slot] = c;
    });
    if (st.mode === 7 && !canvases.BG1L) {           // Mode 7 always has its floor
      var m7 = mk(); drawM7(cx(m7), 0); canvases.BG1L = m7;
    }
  }
  function planeVisibleSetup(slot) {
    var meta = SLOTS[slot];
    if (meta.fam === "BD") return true;
    if (meta.fam === "OBJ") return slot === "OBJ2" && setupAssigned("OBJ");
    return setupAssigned(meta.fam);
  }

  function famVisibleInMode(fam) {
    if (fam === "BD") return true;
    if (fam === "OBJ") return true;
    var n = +fam.charAt(2);
    if (st.mode === 7 && fam === "BG2") return st.extbg;
    return MODE_BPP[st.mode][n - 1] != null;
  }
  function slotState(slot) {
    var meta = SLOTS[slot], fam = meta.fam;
    if (st.src === "setup") return setupAssigned(fam) ? "on" : "empty";
    if (fam !== "BD" && !st.tm[fam]) return "off";
    if (!canvases[slot]) return "empty";
    return "on";
  }
  function sceneNote(slot) {
    var n = SCENES[st.scene].notes[slot];
    return n ? L(n) : "";
  }
  function sceneSpeed(slot) {
    var sp = SCENES[st.scene].speeds;
    if (sp && sp[slot] != null) return sp[slot];
    return SPEED[slot] || 0;
  }
  function tmValue() {
    var v = 0;
    if (st.tm.BG1 && famVisibleInMode("BG1")) v |= 1;
    if (st.tm.BG2 && famVisibleInMode("BG2")) v |= 2;
    if (st.tm.BG3 && famVisibleInMode("BG3")) v |= 4;
    if (st.tm.BG4 && famVisibleInMode("BG4")) v |= 8;
    if (st.tm.OBJ) v |= 16;
    return v;
  }
  function bgmodeValue() { return st.mode | (st.mode === 1 && st.bg3prio ? 8 : 0); }

  // ---------- rendering ----------
  function render(host) {
    if (raf) { cancelAnimationFrame(raf); raf = null; }
    var setup = st.src === "setup";
    if (setup && pst()) { st.mode = pst().mode; st.bg3prio = !!pst().bg3prio; st.extbg = false; }
    buildCanvases();

    var srcBtns =
      '<button class="modebtn src' + (setup ? "" : " active") + '" data-src="demo">' + esc(L(T.srcDemo)) + "</button>" +
      '<button class="modebtn src' + (setup ? " active" : "") + '" data-src="setup">' + esc(L(T.srcSetup)) + "</button>";

    // demo mode: only the modes that make sense for the chosen scenario (best practice);
    // setup mode: all 8, it's YOUR plan.
    var allowedModes = setup ? [0,1,2,3,4,5,6,7] : SCENES[st.scene].modes;
    var modeBtns = allowedModes.map(function (m) {
      return '<button class="modebtn' + (m === st.mode ? " active" : "") + '" data-mode="' + m + '">' + m + "</button>";
    }).join("");

    var sceneBtns = setup ? "" :
      '<div class="lv-row"><span class="lv-lbl">' + esc(L(T.sceneLbl)) + "</span>" +
      SCENE_ORDER.map(function (id) {
        return '<button class="modebtn src' + (id === st.scene ? " active" : "") + '" data-scene="' + id + '">' + esc(L(SCENES[id].label)) + "</button>";
      }).join("") + "</div>";

    var famChecks = setup ? "" : ["BG1","BG2","BG3","BG4","OBJ"].map(function (f) {
      var dis = !famVisibleInMode(f);
      return '<label class="famchk' + (dis ? " dis" : "") + '" style="--fc:' + FAM_COLOR[f] + '">' +
        '<input type="checkbox" data-fam="' + f + '"' + (st.tm[f] ? " checked" : "") + (dis ? " disabled" : "") + ">" +
        "<span>" + f + "</span></label>";
    }).join("");

    var anyAssigned = !setup || ["BG1","BG2","BG3","BG4","OBJ"].some(setupAssigned);

    host.innerHTML =
      '<div class="hero"><h1>' + esc(L(T.title)) + "</h1><p>" + esc(L(setup ? T.introSetup : T.intro)) + "</p></div>" +
      '<div class="lv-controls">' +
        sceneBtns +
        '<div class="lv-row">' + srcBtns + '<span style="flex:0 0 12px"></span><span class="lv-lbl">' + esc(L(T.mode)) + "</span>" + modeBtns +
          '<label class="lv-toggle" id="bg3p-wrap"><input type="checkbox" id="bg3p"' + (st.bg3prio ? " checked" : "") + ">" + esc(L(T.bg3p)) + "</label>" +
          (setup ? "" :
          '<label class="lv-toggle" id="extbg-wrap"><input type="checkbox" id="extbg"' + (st.extbg ? " checked" : "") + ">" + esc(L(T.extbg)) + "</label>" +
          '<label class="lv-toggle"><input type="checkbox" id="anim"' + (st.anim ? " checked" : "") + ">" + esc(L(T.anim)) + "</label>") +
        "</div>" +
        '<div class="lv-row">' + (setup ? "" : '<span class="lv-lbl">' + esc(L(T.visible)) + "</span>") + famChecks +
          '<span class="lv-regs" id="lv-regs"></span></div>' +
        '<p class="dim lv-modenote" id="modenote"></p>' +
        (setup && !anyAssigned ? '<div class="warn-item info" style="margin-top:8px"><span class="ico">💡</span><div>' + esc(L(T.planEmpty)) + ' <a href="#/planner">→ ' + esc(L(T.editPlan)) + "</a></div></div>" : "") +
      "</div>" +
      '<div class="lv-cols">' +
        '<div class="lv-stackcol"><h2 class="sec">' + esc(L(T.stackT)) + ' <span class="dim">' + esc(L(T.stackS)) + "</span></h2>" +
          '<div class="stack-frame"><div class="stack-tag front">' + esc(L(T.front)) + '</div><div class="stack" id="stack"></div><div class="stack-tag back">' + esc(L(T.back)) + "</div></div></div>" +
        '<div class="lv-rescol">' +
          (setup ? "" : '<h2 class="sec">' + esc(L(T.result)) + '</h2><canvas id="composite" width="' + W + '" height="' + H + '" class="composite"></canvas>') +
          '<h2 class="sec">' + esc(L(T.ladder)) + '</h2><div class="ladder" id="ladder"></div></div>' +
      "</div>";

    host.querySelectorAll(".modebtn.src[data-src]").forEach(function (b) {
      b.onclick = function () {
        st.src = b.dataset.src;
        localStorage.setItem("snesLayersSource", st.src);
        if (st.src === "demo" && SCENES[st.scene].modes.indexOf(st.mode) < 0) {
          st.mode = SCENES[st.scene].mode;
          st.bg3prio = SCENES[st.scene].bg3prio;
        }
        render(host);
      };
    });
    host.querySelectorAll(".modebtn.src[data-scene]").forEach(function (b) {
      b.onclick = function () {
        st.scene = b.dataset.scene;
        localStorage.setItem("snesLayersScene", st.scene);
        st.mode = SCENES[st.scene].mode;
        st.bg3prio = SCENES[st.scene].bg3prio;
        render(host);
      };
    });
    host.querySelectorAll(".modebtn:not(.src)").forEach(function (b) {
      b.onclick = function () {
        var m2 = +b.dataset.mode;
        if (setup && P()) P().update(function (s) { s.mode = m2; });
        st.mode = m2;
        render(host);
      };
    });
    var bg3p = host.querySelector("#bg3p");
    host.querySelector("#bg3p-wrap").style.display = st.mode === 1 ? "" : "none";
    bg3p.onchange = function () {
      st.bg3prio = bg3p.checked;
      if (setup && P()) P().update(function (s) { s.bg3prio = bg3p.checked; });
      render(host);
    };
    if (!setup) {
      var extbg = host.querySelector("#extbg"), anim = host.querySelector("#anim");
      host.querySelector("#extbg-wrap").style.display = st.mode === 7 ? "" : "none";
      extbg.onchange = function () { st.extbg = extbg.checked; render(host); };
      anim.onchange = function () {
        st.anim = anim.checked;
        localStorage.setItem("snesLayersAnim", st.anim ? "1" : "0");
        loop();
      };
      host.querySelectorAll(".famchk input").forEach(function (c) {
        c.onchange = function () { st.tm[c.dataset.fam] = c.checked; render(host); };
      });
    }
    var pc = MODE_PROCON[st.mode];
    host.querySelector("#modenote").innerHTML =
      "<b>Mode " + st.mode + "</b> — " + esc(L(MODE_NOTES[st.mode])) +
      '<span class="procon"><span class="pro">✓ ' + esc(L(pc.pro)) + '</span>' +
      '<span class="con">✗ ' + esc(L(pc.con)) + "</span></span>" +
      '<span class="mode-uses">🎮 ' + esc(L(MODE_USES[st.mode])) + "</span>";

    var regs;
    if (setup && P()) {
      var rw = P().regWrites();
      regs = "<b>" + esc(L(T.regs)) + "</b> " + rw.map(function (r) {
        return '<a href="#/reg/' + r.addr.toString(16) + '" class="regchip">' + r.name + " = " + hex2(r.val) + "</a>";
      }).join("") + ' <a href="#/planner" class="regchip">✎ ' + esc(L(T.editPlan)) + "</a>";
    } else {
      regs = "<b>" + esc(L(T.regs)) + "</b> " +
        '<a href="#/reg/2105" class="regchip">BGMODE = ' + hex2(bgmodeValue()) + "</a>" +
        '<a href="#/reg/212c" class="regchip">TM = ' + hex2(tmValue()) + "</a>" +
        (st.mode === 7 ? '<a href="#/reg/2133" class="regchip">SETINI = ' + hex2(st.extbg ? 0x40 : 0) + "</a>" : "");
    }
    host.querySelector("#lv-regs").innerHTML = regs;

    buildStackAndLadder(host);
    if (!setup) { composite(0); loop(); }
  }

  function buildStackAndLadder(host) {
    var setup = st.src === "setup";
    var ladder = ladderFor(st.mode, st.bg3prio, st.extbg);
    var stack = host.querySelector("#stack"), lad = host.querySelector("#ladder");
    var planes = "", rows = "";
    var visSlots = ladder.filter(function (s) {
      return setup ? planeVisibleSetup(s) : slotState(s) === "on";
    });
    var n = visSlots.length;

    ladder.forEach(function (slot, i) {
      var meta = SLOTS[slot], state = slotState(slot);
      var color = FAM_COLOR[meta.fam];
      var isPlane = setup ? planeVisibleSetup(slot) : state === "on";
      if (isPlane) {
        var zi = n - 1 - visSlots.indexOf(slot);
        var tag = (setup && slot === "OBJ2") ? L(T.objMerged) : L(meta.label);
        planes += '<div class="plane" data-slot="' + slot + '" style="--i:' + zi + ";--n:" + n + ";--fc:" + color + '">' +
                  '<span class="plane-tag">' + esc(tag) + "</span></div>";
      }
      var note;
      if (setup) {
        note = state === "on" ? "· " + esc(setupNote(meta.fam))
             : '<i>· <a href="#/planner">' + esc(L(T.fillSlot)) + "</a></i>";
      } else {
        var sn = sceneNote(slot);
        note = state === "off" ? "<i>· " + esc(L(T.off)) + "</i>"
             : state === "empty" ? "<i>· " + esc(L(T.empty)) + "</i>"
             : sn ? "· " + esc(sn) : "";
      }
      var bppTag = "";
      if (meta.fam.indexOf("BG") === 0) {
        var bpp = st.mode === 7 && meta.fam === "BG2" ? 7 : MODE_BPP[st.mode][+meta.fam.charAt(2) - 1];
        if (bpp) bppTag = '<span class="bpptag">' + (st.mode === 7 ? "8bpp" : bpp + "bpp · " + (1 << bpp) + (lang() === "de" ? " Farben" : " colors")) + "</span>";
      }
      var links = (FAM_REGS[meta.fam] || []).map(function (r) {
        return '<a href="#/reg/' + r[0].toString(16) + '">' + r[1] + "</a>";
      }).join(" ");
      rows += '<div class="ladrow ' + state + '" data-slot="' + slot + '" style="--fc:' + color + '">' +
              '<span class="ladidx">' + (i + 1) + "</span>" +
              '<span class="laddot"></span>' +
              '<span class="ladname">' + esc(L(meta.label)) + " " + bppTag + "</span>" +
              '<span class="ladnote">' + note + "</span>" +
              '<span class="ladlinks">' + links + "</span></div>";
    });
    stack.innerHTML = planes;
    lad.innerHTML = rows;

    stack.querySelectorAll(".plane").forEach(function (p) {
      var slot = p.dataset.slot, c = canvases[slot];
      if (!c) return;
      var cv = mk(), g = cx(cv);
      g.drawImage(c, 0, 0);
      p.style.backgroundImage = "url(" + cv.toDataURL() + ")";
      if (slot !== "BD") p.classList.add("transparent-grid");
    });

    function hl(slot, on) {
      var p = stack.querySelector('.plane[data-slot="' + slot + '"]');
      var r = lad.querySelector('.ladrow[data-slot="' + slot + '"]');
      if (p) p.classList.toggle("hl", on);
      if (r) r.classList.toggle("hl", on);
    }
    [].concat(Array.from(stack.querySelectorAll(".plane")), Array.from(lad.querySelectorAll(".ladrow"))).forEach(function (n2) {
      n2.addEventListener("mouseenter", function () { hl(n2.dataset.slot, true); });
      n2.addEventListener("mouseleave", function () { hl(n2.dataset.slot, false); });
    });
  }

  function composite(t) {
    var cvs = document.getElementById("composite");
    if (!cvs) return false;
    var g = cx(cvs);
    g.clearRect(0, 0, W, H);
    if (st.anim && st.src !== "setup") {            // living sprites, per scene
      var an = SCENES[st.scene].anim || {};
      Object.keys(an).forEach(function (slot) {
        if (canvases[slot]) an[slot](cx(canvases[slot]), t);
      });
    }
    var ladder = ladderFor(st.mode, st.bg3prio, st.extbg).slice().reverse();
    ladder.forEach(function (slot) {
      if (slotState(slot) !== "on") return;
      var c = canvases[slot];
      if (slot === "BG1L" && st.mode === 7) {
        if (st.anim) { drawM7(cx(c), t); }
        g.drawImage(c, 0, 0);
        return;
      }
      var off = st.anim ? Math.floor((t * sceneSpeed(slot)) % W) : 0;
      if (off === 0) { g.drawImage(c, 0, 0); }
      else { g.drawImage(c, -off, 0); g.drawImage(c, W - off, 0); }
    });
    return true;
  }

  function loop() {
    if (raf) { cancelAnimationFrame(raf); raf = null; }
    if (!st.anim) { composite(0); return; }
    var t0 = performance.now();
    (function step(now) {
      if (!composite((now - t0) / 16)) { raf = null; return; }
      raf = requestAnimationFrame(step);
    })(t0);
  }

  window.SNESLayers = { render: render };
})();
