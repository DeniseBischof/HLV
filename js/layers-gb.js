/* SNES Inspector — Game Boy layer view: the fixed DMG layer stack
   (sprites → window → BG → backdrop) shown per game-style scenario,
   each with an animated demo scene, per-layer LCDC toggles and the
   GBDK code that makes it work. */
(function () {
  "use strict";
  var W = 160, H = 144;
  var raf = null;

  function lang() { return localStorage.getItem("snesLang") || "en"; }
  function L(t) { if (t == null) return ""; if (typeof t === "string") return t; return t[lang()] != null ? t[lang()] : t.en; }
  function esc(s) { return String(s).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;"); }
  function hex2(n) { return "$" + n.toString(16).toUpperCase().padStart(2, "0"); }

  // classic DMG green shades, index 0 (lightest) .. 3 (darkest)
  var SH = ["#e0f8d0", "#88c070", "#346856", "#081820"];

  var T = {
    title: { en: "Game Boy layer view — how classic games are built", de: "Game-Boy-Layer-Ansicht — wie klassische Spiele gebaut sind" },
    intro: { en: "The Game Boy has no modes — every game uses the same fixed stack: sprites in front, then the window (an overlay that ALWAYS extends to the bottom of the screen), then the background, then shade 0 as backdrop. What changes per genre is the trickery. Pick a scenario, watch it move, and toggle layers — the LCDC value updates live, exactly like the real bits.",
             de: "Der Game Boy hat keine Modi — jedes Spiel nutzt denselben festen Stapel: Sprites vorn, dann das Window (ein Overlay, das IMMER bis zum unteren Bildrand reicht), dann der Background, dann Grauton 0 als Backdrop. Was sich pro Genre ändert, sind die Tricks. Wähle ein Szenario, sieh es in Bewegung und schalte Ebenen um — der LCDC-Wert rechnet live mit, genau wie die echten Bits." },
    scenario: { en: "Scenario", de: "Szenario" },
    layersLbl: { en: "Layers (LCDC bits)", de: "Ebenen (LCDC-Bits)" },
    anim:   { en: "Animation", de: "Animation" },
    stackT: { en: "Layer stack", de: "Layer-Stapel" },
    stackS: { en: "(hover a plane or a ladder row)", de: "(Ebene oder Zeile hovern)" },
    result: { en: "Final image (160×144)", de: "Fertiges Bild (160×144)" },
    ladder: { en: "Priority — front to back", de: "Priorität — vorne nach hinten" },
    how:    { en: "How it's done", de: "So wird's gemacht" },
    code:   { en: "The code (GBDK C)", de: "Der Code (GBDK C)" },
    regs:   { en: "Key register writes:", de: "Zentrale Register-Writes:" },
    front:  { en: "FRONT", de: "VORNE" },
    back:   { en: "BACK", de: "HINTEN" },
    off:    { en: "not used in this scenario", de: "in diesem Szenario ungenutzt" },
    lcdcOff:{ en: "switched off via LCDC", de: "über LCDC abgeschaltet" },
    objBehind: { en: "sprites with OAM attribute bit 7 — behind BG shades 1–3, in front of shade 0 (walk-behind-bushes trick)", de: "Sprites mit OAM-Attribut-Bit 7 — hinter BG-Tönen 1–3, vor Ton 0 (Hinter-Büschen-lauf-Trick)" }
  };

  var SLOTS = {
    OBJ:  { color: "var(--f7)", lcdcBit: 1, label: { en: "Sprites (OAM)", de: "Sprites (OAM)" }, regs: [[0xFF46,"DMA"],[0xFF48,"OBP0"],[0xFF40,"LCDC"]] },
    WIN:  { color: "var(--f3)", lcdcBit: 5, label: { en: "Window (overlay)", de: "Window (Overlay)" }, regs: [[0xFF4A,"WY"],[0xFF4B,"WX"],[0xFF40,"LCDC"]] },
    BG:   { color: "var(--f2)", lcdcBit: 0, label: { en: "Background (shades 1–3)", de: "Background (Töne 1–3)" }, regs: [[0xFF42,"SCY"],[0xFF43,"SCX"],[0xFF47,"BGP"]] },
    OBJB: { color: "var(--f5)", lcdcBit: null, label: { en: "Sprites behind BG (attr bit 7)", de: "Sprites hinter BG (Attr-Bit 7)" }, regs: [[0xFF46,"DMA"]] },
    BD:   { color: "var(--text-dim)", lcdcBit: null, label: { en: "BG shade 0 (backdrop)", de: "BG-Ton 0 (Backdrop)" }, regs: [[0xFF47,"BGP"]] }
  };
  var LADDER = ["OBJ", "WIN", "BG", "OBJB", "BD"];

  // ---------- drawing ----------
  function mk() { var c = document.createElement("canvas"); c.width = W; c.height = H; return c; }
  function cx(c) { var g = c.getContext("2d"); g.imageSmoothingEnabled = false; return g; }
  function R(g, x, y, w, h, s) { g.fillStyle = SH[s]; g.fillRect(x, y, w, h); }
  function wrapX(g, c, off) {
    off = ((Math.floor(off) % W) + W) % W;
    g.drawImage(c, -off, 0); g.drawImage(c, W - off, 0);
  }
  function wrapXY(g, c, ox, oy) {
    ox = ((Math.floor(ox) % W) + W) % W; oy = ((Math.floor(oy) % H) + H) % H;
    g.drawImage(c, -ox, -oy); g.drawImage(c, W - ox, -oy);
    g.drawImage(c, -ox, H - oy); g.drawImage(c, W - ox, H - oy);
  }

  function drawBD(g) { R(g, 0, 0, W, H, 0); }

  // --- platformer ---
  function bgPlat(g) {
    [[10,14],[60,10],[118,16]].forEach(function (c) { R(g, c[0], c[1], 26, 6, 1); R(g, c[0]+6, c[1]-4, 14, 4, 1); });
    R(g, 0, 96, 44, 16, 1); R(g, 96, 100, 50, 12, 1);          // hills
    for (var x = 0; x < W; x += 8) { R(g, x, 112, 8, 8, 2); R(g, x, 120, 8, 24, 3); } // ground
    [[48,72],[56,72],[64,72]].forEach(function (b) { R(g, b[0], b[1], 8, 8, 3); R(g, b[0]+2, b[1]+2, 4, 4, 2); }); // blocks
    R(g, 124, 88, 20, 24, 2); R(g, 122, 84, 24, 8, 3);          // pipe
  }
  function winPlat(g) {
    R(g, 0, 128, W, 16, 3);
    R(g, 4, 132, 30, 8, 0);                                      // SCORE block
    for (var i = 0; i < 3; i++) R(g, 44 + i*11, 132, 8, 8, 0);   // hearts
    R(g, 128, 132, 8, 8, 0); R(g, 140, 132, 16, 8, 0);           // coin count
  }
  function objPlat(g) {
    R(g, 40, 96, 12, 16, 3); R(g, 42, 98, 8, 5, 0);              // hero
    R(g, 100, 100, 14, 12, 3); R(g, 102, 104, 3, 3, 0); R(g, 109, 104, 3, 3, 0); // enemy
  }

  // --- top-down: seamless tiling overworld (the camera wraps, so no room walls!) ---
  function bgTop(g) {
    R(g, 0, 0, W, H, 0);                                          // grass base
    for (var y = 0; y < H; y += 16)                                // grass tufts, 16px grid = tiles seamlessly
      for (var x = 0; x < W; x += 16)
        if (((x + y) / 16) % 3 === 0) R(g, x + 6, y + 6, 3, 3, 1);
    R(g, 0, 64, W, 14, 1); R(g, 0, 63, W, 1, 2); R(g, 0, 78, W, 1, 2);   // dirt path E-W (full width -> seamless)
    R(g, 72, 0, 14, H, 1); R(g, 71, 0, 1, H, 2); R(g, 86, 0, 1, H, 2);   // dirt path N-S
    R(g, 100, 92, 36, 24, 2); R(g, 104, 96, 28, 16, 1);           // pond
    function tree(x, y) { R(g, x, y, 14, 10, 2); R(g, x + 2, y + 2, 6, 4, 1); R(g, x + 5, y + 10, 4, 4, 3); }
    tree(20, 16); tree(120, 24); tree(28, 104); tree(136, 124);
    R(g, 40, 40, 10, 10, 1); R(g, 110, 44, 10, 10, 1);            // bushes
    R(g, 52, 120, 4, 4, 2); R(g, 24, 52, 4, 4, 2);                // flowers
  }
  function objTop(g) {
    R(g, 72, 64, 12, 14, 3); R(g, 74, 66, 8, 4, 0);              // player
    R(g, 32, 40, 12, 12, 2); R(g, 34, 43, 3, 3, 3); R(g, 39, 43, 3, 3, 3); // enemy
  }

  // --- parallax shooter: 4 bands as separate wrap-scrollable canvases ---
  function bandClouds(g) {
    [[16,8],[70,14],[120,6]].forEach(function (c) { R(g, c[0], c[1], 22, 5, 1); });
  }
  function bandFar(g) {
    for (var x = -8; x < W; x += 32)
      for (var i = 0; i < 12; i += 2) R(g, x + i, 40 + i, 32 - 2*i, 2, 1);
    R(g, 0, 52, W, 18, 1);
  }
  function bandMid(g) {
    for (var x = -16; x < W; x += 40)
      for (var j = 0; j < 16; j += 2) R(g, x + j, 70 + j, 40 - 2*j, 2, 2);
    R(g, 0, 86, W, 14, 2);
  }
  function bandNear(g) {
    R(g, 0, 100, W, 44, 3);
    for (var x = 4; x < W; x += 24) R(g, x, 104, 10, 3, 2);
  }
  var PAR_BANDS = [
    { draw: bandClouds, speed: 0.12 },
    { draw: bandFar,   speed: 0.3 },
    { draw: bandMid,   speed: 0.6 },
    { draw: bandNear,  speed: 1.2 }
  ];
  function objPar(g) {
    R(g, 20, 58, 18, 8, 3); R(g, 34, 60, 8, 4, 3); R(g, 16, 60, 4, 4, 0); // ship
    R(g, 120, 30, 10, 6, 3); R(g, 118, 32, 4, 2, 0);              // enemy drone
  }

  // --- faceball pseudo-3d: a tiny real raycaster on a ring-corridor map.
  // The camera walks the square loop and TURNS THE CORNERS, Faceball-style.
  var RCMAP = [
    "########",
    "#......#",
    "#.####.#",
    "#.####.#",
    "#.####.#",
    "#.####.#",
    "#......#",
    "########"
  ].map(function (r) { return r.split("").map(function (c) { return c === "#" ? 1 : 0; }); });
  var RC_WP = [[1.5, 1.5], [6.5, 1.5], [6.5, 6.5], [1.5, 6.5]];   // clockwise ring
  var rc = { x: 1.5, y: 1.5, ang: 0, seg: 0, turn: 0 };
  function rcAdvance() {
    if (rc.turn > 0) {                                             // corner: 6 chunky 15° steps
      rc.ang += (Math.PI / 2) / 6;
      rc.turn--;
      if (rc.turn === 0) rc.ang = (rc.seg * Math.PI / 2) % (Math.PI * 2);
      return;
    }
    var tgt = RC_WP[(rc.seg + 1) % 4];
    var dx = tgt[0] - rc.x, dy = tgt[1] - rc.y;
    var d = Math.abs(dx) + Math.abs(dy);
    if (d < 0.22) {
      rc.x = tgt[0]; rc.y = tgt[1];
      rc.seg = (rc.seg + 1) % 4;
      rc.turn = 6;
    } else {
      rc.x += Math.cos(rc.ang) * 0.22;
      rc.y += Math.sin(rc.ang) * 0.22;
    }
  }
  function bgFace(g) {
    R(g, 0, 0, W, 120, 0);
    R(g, 10, 60, 140, 54, 1);                                      // floor
    var FOV = Math.PI / 3;
    for (var i = 0; i < 35; i++) {
      var ra = rc.ang - FOV / 2 + (i + 0.5) * (FOV / 35);
      var rxd = Math.cos(ra), ryd = Math.sin(ra);
      var mx = Math.floor(rc.x), my = Math.floor(rc.y);
      var ddx = Math.abs(1 / (rxd || 1e-9)), ddy = Math.abs(1 / (ryd || 1e-9));
      var stx = rxd < 0 ? -1 : 1, sty = ryd < 0 ? -1 : 1;
      var sdx = (rxd < 0 ? rc.x - mx : mx + 1 - rc.x) * ddx;
      var sdy = (ryd < 0 ? rc.y - my : my + 1 - rc.y) * ddy;
      var side = 0, guard = 0;
      while (guard++ < 24) {
        if (sdx < sdy) { sdx += ddx; mx += stx; side = 0; }
        else { sdy += ddy; my += sty; side = 1; }
        if (RCMAP[my] && RCMAP[my][mx]) break;
      }
      var dist = (side ? sdy - ddy : sdx - ddx) * Math.cos(ra - rc.ang);
      if (dist < 0.08) dist = 0.08;
      var h = Math.min(108, 76 / dist);
      var x = 10 + i * 4, y0 = Math.round(60 - h / 2);
      h = Math.round(h);
      R(g, x, y0, 4, h, side ? 2 : 1);                             // wall: shade by orientation
      R(g, x, y0, 4, 2, 3); R(g, x, y0 + h - 2, 4, 2, 3);          // Faceball wireframe edges
    }
    g.strokeStyle = SH[3]; g.lineWidth = 2;
    g.strokeRect(10, 6, 140, 108);                                 // viewport frame
  }
  function winFace(g) {
    R(g, 0, 120, W, 24, 3);
    R(g, 6, 124, 16, 16, 0); R(g, 10, 128, 3, 3, 3); R(g, 15, 128, 3, 3, 3); R(g, 10, 134, 8, 2, 3); // status face
    R(g, 116, 124, 38, 16, 0); R(g, 132, 130, 4, 4, 3);           // radar
    R(g, 40, 128, 60, 8, 0);                                      // ammo/score
  }
  function objFace(g, bob) {
    R(g, 76, 68, 8, 2, 3); R(g, 79, 65, 2, 8, 3);                 // crosshair
    var y = 50 + (bob || 0);
    R(g, 68, y, 22, 22, 0); g.strokeStyle = SH[3]; g.lineWidth = 2; g.strokeRect(68, y, 22, 22);
    R(g, 73, y+6, 4, 4, 3); R(g, 83, y+6, 4, 4, 3); R(g, 74, y+15, 12, 3, 3); // smiley enemy
  }

  // ---------- scenarios ----------
  var SCEN = {
    plat: {
      name: { en: "Jump'n'Run", de: "Jump'n'Run" },
      how: {
        en: "The level lives in the BG and scrolls horizontally via SCX. The HUD is the window: since the window ALWAYS extends to the bottom edge, HUDs sit at the bottom (WY=128) — a top HUD needs an LYC interrupt that switches the window off mid-frame. Hero and enemies are sprites (8×16 mode fits 16px-tall characters with half the OAM entries).",
        de: "Das Level liegt im BG und scrollt horizontal über SCX. Das HUD ist das Window: Da das Window IMMER bis zur Unterkante reicht, sitzen HUDs unten (WY=128) — ein HUD oben braucht einen LYC-Interrupt, der das Window mitten im Frame abschaltet. Held und Gegner sind Sprites (8×16-Modus schafft 16px hohe Figuren mit halb so vielen OAM-Einträgen)."
      },
      draw: { BG: bgPlat, WIN: winPlat, OBJ: objPlat },
      lcdcBase: 0xE7, hasWin: true,
      notes: { OBJ: { en: "hero + enemy", de: "Held + Gegner" }, WIN: { en: "HUD, bottom 2 tile rows — does NOT scroll", de: "HUD, untere 2 Tile-Zeilen — scrollt NICHT mit" }, BG: { en: "level, scrolls with SCX", de: "Level, scrollt mit SCX" } },
      chips: [["WY", 128, 0xFF4A], ["WX", 7, 0xFF4B]],
      code: [
        "// GBDK — classic platformer frame update",
        "SCX_REG = camera_x;              // scroll the level",
        "WY_REG  = 128;  WX_REG = 7;      // window = HUD, bottom 16 px",
        "LCDC_REG = LCDCF_ON | LCDCF_BGON | LCDCF_OBJON | LCDCF_OBJ16",
        "         | LCDCF_WINON | LCDCF_WIN9C00;  // HUD on 2nd tilemap",
        "// window quirk: it always reaches the BOTTOM of the screen —",
        "// that's why GB HUDs live at the bottom (or need an LYC trick)."
      ].join("\n")
    },
    top: {
      name: { en: "Top-Down (Zelda-like)", de: "Top-Down (Zelda-like)" },
      how: {
        en: "The camera scrolls BOTH axes (SCX + SCY) over the 256×256 BG map — but the map is only 32×32 tiles, so big worlds are streamed: as the camera moves, the row/column that just scrolled off-screen is rewritten with new map data. VRAM is locked during mode 3, so those writes go into VBlank. The 'walk behind bushes' effect uses OAM attribute bit 7 (sprite behind BG shades 1–3).",
        de: "Die Kamera scrollt BEIDE Achsen (SCX + SCY) über die 256×256-BG-Map — aber die Map ist nur 32×32 Tiles groß, also streamt man große Welten: Während die Kamera fährt, wird die gerade aus dem Bild gescrollte Zeile/Spalte mit neuen Map-Daten überschrieben. VRAM ist in Mode 3 gesperrt, also passieren diese Writes im VBlank. Der 'hinter Büschen laufen'-Effekt nutzt OAM-Attribut-Bit 7 (Sprite hinter BG-Tönen 1–3)."
      },
      draw: { BG: bgTop, WIN: null, OBJ: objTop },
      lcdcBase: 0x83, hasWin: false,
      notes: { OBJ: { en: "player + enemy", de: "Spieler + Gegner" }, BG: { en: "room, scrolls with SCX+SCY, map streamed at the edges", de: "Raum, scrollt mit SCX+SCY, Map wird am Rand nachgeladen" } },
      chips: [["SCX", 0, 0xFF43], ["SCY", 0, 0xFF42]],
      code: [
        "// GBDK — top-down camera + map streaming",
        "SCX_REG = cam_x;  SCY_REG = cam_y;",
        "// the BG map wraps at 256 px — stream the edge that just",
        "// became invisible. VRAM only unlocks outside mode 3,",
        "// so do this right after vsync():",
        "vsync();",
        "set_bkg_submap(map_col, 0, 1, 18, level_map, LEVEL_WIDTH);"
      ].join("\n")
    },
    par: {
      name: { en: "Parallax / raster FX", de: "Parallax / Raster-FX" },
      how: {
        en: "The GB has only ONE background — parallax is faked with the STAT/LYC interrupt: at chosen scanlines the CPU swaps SCX, so each horizontal band scrolls at its own speed (sky slow, ground fast — watch the animation!). The same per-scanline trick bends the screen (wavy heat), splits it, or wobbles logos. This is the GB's little brother of SNES HDMA — except the CPU does it by hand.",
        de: "Der GB hat nur EINEN Background — Parallax wird mit dem STAT/LYC-Interrupt gefakt: An gewählten Scanlines tauscht die CPU SCX aus, sodass jedes horizontale Band mit eigener Geschwindigkeit scrollt (Himmel langsam, Boden schnell — schau dir die Animation an!). Derselbe Pro-Scanline-Trick verbiegt das Bild (Hitze-Flimmern), teilt es oder wackelt Logos. Das ist der kleine Bruder des SNES-HDMA — nur macht die CPU es von Hand."
      },
      draw: { BG: null, WIN: null, OBJ: objPar },
      lcdcBase: 0x83, hasWin: false, parallax: true,
      notes: { OBJ: { en: "ship + drone", de: "Schiff + Drohne" }, BG: { en: "4 bands, each gets its own SCX via LYC interrupt", de: "4 Bänder, jedes bekommt per LYC-Interrupt sein eigenes SCX" } },
      chips: [["STAT", 0x40, 0xFF41], ["LYC", 39, 0xFF45]],
      code: [
        "// GBDK — parallax: new SCX per screen band via LYC interrupt",
        "void lyc_isr(void) {",
        "  switch (LY_REG) {",
        "    case 39: SCX_REG = cam_x >> 2; LYC_REG = 85;  break; // far",
        "    case 85: SCX_REG = cam_x >> 1; LYC_REG = 99;  break; // mid",
        "    case 99: SCX_REG = cam_x;      LYC_REG = 39;  break; // near",
        "  }",
        "}",
        "CRITICAL { add_LCD(lyc_isr); }",
        "STAT_REG |= STATF_LYC;   // fire STAT irq on LY == LYC",
        "set_interrupts(VBL_IFLAG | LCD_IFLAG);"
      ].join("\n")
    },
    face: {
      name: { en: "Pseudo-3D (Faceball)", de: "Pseudo-3D (Faceball)" },
      how: {
        en: "The GB has no bitmap mode — every pixel belongs to a tile. Faceball 2000 fakes one: the middle of the screen is a grid of UNIQUE tiles used as a software framebuffer. Each frame the CPU raycasts the corridor into a WRAM buffer, then copies the changed tiles into VRAM during VBlank. Only a few tiles fit per VBlank, which is why it runs at a heroic ~5–10 fps — the demo here is rendered by an actual tiny raycaster, walks a square corridor loop, TURNS THE CORNERS, and is deliberately just as choppy. HUD = window, enemies (the smileys) = sprites over the 'framebuffer'.",
        de: "Der GB hat keinen Bitmap-Modus — jeder Pixel gehört zu einem Tile. Faceball 2000 fakt einen: Die Bildmitte ist ein Raster aus EINZIGARTIGEN Tiles, genutzt als Software-Framebuffer. Jedes Frame raycastet die CPU den Korridor in einen WRAM-Puffer und kopiert die geänderten Tiles im VBlank ins VRAM. Pro VBlank passen nur wenige Tiles, deshalb läuft es mit heroischen ~5–10 fps — die Demo hier rendert ein echter Mini-Raycaster, sie läuft eine quadratische Korridor-Runde, BIEGT UM DIE ECKEN und ruckelt absichtlich genauso. HUD = Window, Gegner (die Smileys) = Sprites über dem 'Framebuffer'."
      },
      draw: { BG: bgFace, WIN: winFace, OBJ: objFace },
      lcdcBase: 0xE3, hasWin: true, faceball: true,
      notes: { OBJ: { en: "crosshair + smiley enemy", de: "Fadenkreuz + Smiley-Gegner" }, WIN: { en: "HUD: status face, ammo, radar", de: "HUD: Status-Gesicht, Munition, Radar" }, BG: { en: "unique-tile grid = software framebuffer, raycast per frame", de: "Unique-Tile-Raster = Software-Framebuffer, Raycasting pro Frame" } },
      chips: [["WY", 120, 0xFF4A], ["DMA", 0xC0, 0xFF46]],
      code: [
        "// The Faceball trick: a software framebuffer out of tiles.",
        "// Middle of the screen = 16x9 UNIQUE tiles (144 tiles),",
        "// their tilemap never changes - only the tile DATA does:",
        "raycast_corridor(framebuf);       // render into WRAM (2bpp)",
        "vsync();",
        "// copy as many dirty tiles as VBlank allows (~8-10):",
        "set_bkg_data(FB_FIRST_TILE + dirty_start,",
        "             dirty_count, framebuf + dirty_start * 16);",
        "// full redraw needs several frames -> ~5-10 fps, but real 3D."
      ].join("\n")
    }
  };
  var SCEN_ORDER = ["plat", "top", "par", "face"];

  // ---------- state ----------
  var st = {
    scen: localStorage.getItem("gbLayersScen") || "plat",
    anim: localStorage.getItem("gbLayersAnim") !== "0",
    layers: { OBJ: true, WIN: true, BG: true }
  };
  try { var lj = JSON.parse(localStorage.getItem("gbLayersL")); if (lj) st.layers = lj; } catch (e) {}
  function persist() {
    localStorage.setItem("gbLayersScen", st.scen);
    localStorage.setItem("gbLayersAnim", st.anim ? "1" : "0");
    localStorage.setItem("gbLayersL", JSON.stringify(st.layers));
  }

  function lcdcValue(sc) {
    var v = sc.lcdcBase;
    if (!st.layers.BG) v &= ~0x01;
    if (!st.layers.OBJ) v &= ~0x02;
    if (sc.hasWin && !st.layers.WIN) v &= ~0x20;
    return v;
  }

  // ---------- rendering ----------
  function render(host) {
    if (raf) { cancelAnimationFrame(raf); raf = null; }
    var sc = SCEN[st.scen];

    // build canvases
    var canvases = { BD: mk(), OBJ: mk() };
    drawBD(cx(canvases.BD));
    sc.draw.OBJ(cx(canvases.OBJ), 0);
    var parCanvases = null;
    if (sc.parallax) {
      parCanvases = PAR_BANDS.map(function (b) { var c = mk(); b.draw(cx(c)); return c; });
      canvases.BG = mk();
      parCanvases.forEach(function (c) { cx(canvases.BG).drawImage(c, 0, 0); });
    } else {
      canvases.BG = mk();
      sc.draw.BG(cx(canvases.BG), 0);
    }
    if (sc.draw.WIN) { canvases.WIN = mk(); sc.draw.WIN(cx(canvases.WIN)); }

    function slotShown(slot) {
      if (slot === "BD") return true;
      if (slot === "OBJB") return false;
      if (slot === "WIN" && !sc.hasWin) return false;
      return st.layers[slot];
    }

    var scBtns = SCEN_ORDER.map(function (id) {
      return '<button class="modebtn src' + (id === st.scen ? " active" : "") + '" data-scen="' + id + '">' + esc(L(SCEN[id].name)) + "</button>";
    }).join("");

    var layerChecks = ["OBJ", "WIN", "BG"].map(function (f) {
      var dis = f === "WIN" && !sc.hasWin;
      return '<label class="famchk' + (dis ? " dis" : "") + '" style="--fc:' + SLOTS[f].color + '">' +
        '<input type="checkbox" data-layer="' + f + '"' + (st.layers[f] && !dis ? " checked" : "") + (dis ? " disabled" : "") + ">" +
        "<span>" + f + "</span></label>";
    }).join("");

    var chips = [['LCDC', lcdcValue(sc), 0xFF40]].concat(sc.chips).map(function (c) {
      return '<a href="#/reg/' + c[2].toString(16) + '" class="regchip">' + c[0] + " = " + hex2(c[1]) + "</a>";
    }).join("");

    var visSlots = LADDER.filter(slotShown);
    var n = visSlots.length;

    var planes = "", rows = "";
    LADDER.forEach(function (slot, i) {
      var meta = SLOTS[slot];
      var shown = slotShown(slot);
      if (shown) {
        var zi = n - 1 - visSlots.indexOf(slot);
        planes += '<div class="plane gb" data-slot="' + slot + '" style="--i:' + zi + ";--n:" + n + ";--fc:" + meta.color + '">' +
                  '<span class="plane-tag">' + esc(L(meta.label)) + "</span></div>";
      }
      var state = shown || slot === "OBJB" || slot === "BD" ? "on" : "off";
      var note;
      if (slot === "OBJB") note = "<i>· " + esc(L(T.objBehind)) + "</i>";
      else if (slot === "WIN" && !sc.hasWin) { note = "<i>· " + esc(L(T.off)) + "</i>"; state = "empty"; }
      else if (!shown) { note = "<i>· " + esc(L(T.lcdcOff)) + " (bit " + meta.lcdcBit + ")</i>"; state = "off"; }
      else if (sc.notes[slot]) note = "· " + esc(L(sc.notes[slot]));
      else if (slot === "BD") note = "· " + esc(L({ en: "whatever BGP maps shade 0 to", de: "was BGP dem Ton 0 zuordnet" }));
      else note = "";
      var links = meta.regs.map(function (r) {
        return '<a href="#/reg/' + r[0].toString(16) + '">' + r[1] + "</a>";
      }).join(" ");
      rows += '<div class="ladrow ' + state + '" data-slot="' + slot + '" style="--fc:' + meta.color + '">' +
              '<span class="ladidx">' + (i + 1) + '</span><span class="laddot"></span>' +
              '<span class="ladname">' + esc(L(meta.label)) + "</span>" +
              '<span class="ladnote">' + note + "</span>" +
              '<span class="ladlinks">' + links + "</span></div>";
    });

    host.innerHTML =
      '<div class="hero"><h1>' + esc(L(T.title)) + "</h1><p>" + esc(L(T.intro)) + "</p></div>" +
      '<div class="lv-controls">' +
        '<div class="lv-row"><span class="lv-lbl">' + esc(L(T.scenario)) + "</span>" + scBtns +
          '<label class="lv-toggle"><input type="checkbox" id="gbanim"' + (st.anim ? " checked" : "") + ">" + esc(L(T.anim)) + "</label></div>" +
        '<div class="lv-row"><span class="lv-lbl">' + esc(L(T.layersLbl)) + "</span>" + layerChecks +
          '<span class="lv-regs"><b>' + esc(L(T.regs)) + "</b>" + chips + "</span></div>" +
        '<p class="dim lv-modenote">' + esc(L(sc.how)) + "</p></div>" +
      '<div class="lv-cols">' +
        '<div class="lv-stackcol"><h2 class="sec">' + esc(L(T.stackT)) + ' <span class="dim">' + esc(L(T.stackS)) + "</span></h2>" +
          '<div class="stack-frame"><div class="stack-tag front">' + esc(L(T.front)) + '</div><div class="stack" id="gbstack">' + planes + '</div><div class="stack-tag back">' + esc(L(T.back)) + "</div></div></div>" +
        '<div class="lv-rescol"><h2 class="sec">' + esc(L(T.result)) + "</h2>" +
          '<canvas id="gbcomposite" width="' + W + '" height="' + H + '" class="composite gb"></canvas>' +
          '<h2 class="sec">' + esc(L(T.ladder)) + '</h2><div class="ladder" id="gbladder">' + rows + "</div></div>" +
      "</div>" +
      '<h2 class="sec">' + esc(L(T.code)) + "</h2>" +
      '<pre class="codeblock">' + esc(sc.code) + "</pre>";

    host.querySelectorAll(".modebtn[data-scen]").forEach(function (b) {
      b.onclick = function () { st.scen = b.dataset.scen; persist(); render(host); };
    });
    host.querySelector("#gbanim").onchange = function (e) { st.anim = e.target.checked; persist(); startLoop(sc, canvases, parCanvases, slotShown); };
    host.querySelectorAll(".famchk input").forEach(function (c) {
      c.onchange = function () { st.layers[c.dataset.layer] = c.checked; persist(); render(host); };
    });

    // paint plane textures
    var stack = host.querySelector("#gbstack");
    stack.querySelectorAll(".plane").forEach(function (p) {
      var c = canvases[p.dataset.slot];
      if (!c) return;
      p.style.backgroundImage = "url(" + c.toDataURL() + ")";
      if (p.dataset.slot !== "BD") p.classList.add("transparent-grid");
    });

    // hover sync
    var lad = host.querySelector("#gbladder");
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

    startLoop(sc, canvases, parCanvases, slotShown);
  }

  // ---------- composite + animation ----------
  function compose(sc, canvases, parCanvases, slotShown, t) {
    var cvs = document.getElementById("gbcomposite");
    if (!cvs) return false;
    var g = cx(cvs);
    g.clearRect(0, 0, W, H);
    g.drawImage(canvases.BD, 0, 0);
    if (slotShown("BG")) {
      if (sc.parallax) {
        parCanvases.forEach(function (c, i) { wrapX(g, c, t * PAR_BANDS[i].speed); });
      } else if (sc.faceball) {
        g.drawImage(canvases.BG, 0, 0);
      } else if (st.scen === "top") {
        wrapXY(g, canvases.BG, t * 0.5, t * 0.35);
      } else {
        wrapX(g, canvases.BG, t * 0.9);
      }
    }
    if (slotShown("WIN") && canvases.WIN) g.drawImage(canvases.WIN, 0, 0);
    if (slotShown("OBJ")) g.drawImage(canvases.OBJ, 0, 0);
    return true;
  }

  function startLoop(sc, canvases, parCanvases, slotShown) {
    if (raf) { cancelAnimationFrame(raf); raf = null; }
    if (!st.anim) { compose(sc, canvases, parCanvases, slotShown, 0); return; }
    var t0 = performance.now(), lastFace = -1;
    (function step(now) {
      var t = (now - t0) / 16;
      if (sc.faceball) {
        // deliberately choppy ~8 fps tunnel, like the real thing
        var tick = Math.floor((now - t0) / 125);
        if (tick !== lastFace) {
          lastFace = tick;
          rcAdvance();                             // walk the ring, turn the corners
          bgFace(cx(canvases.BG));
          var og = cx(canvases.OBJ);
          og.clearRect(0, 0, W, H);
          sc.draw.OBJ(og, tick % 6 < 3 ? 0 : 2);   // smiley bobs slowly
          if (!compose(sc, canvases, parCanvases, slotShown, t)) { raf = null; return; }
        }
      } else {
        if (!compose(sc, canvases, parCanvases, slotShown, t)) { raf = null; return; }
      }
      raf = requestAnimationFrame(step);
    })(t0);
  }

  window.GBLayers = { render: render };
})();
