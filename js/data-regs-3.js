// SNES PPU registers $212C–$213F: screen designation, color math, status/read ports.
window.SNES.registers.push(

{ addr: 0x212C, mnem: "TM", group: "screens", access: "W", size: 8, timing: "anytime",
  title: { en: "Main screen designation", de: "Main-Screen-Zuordnung" },
  desc: {
    en: "Which layers are visible on the MAIN screen. If a layer is enabled nowhere (neither TM nor TS), it simply doesn't render — the #1 'my background is invisible' cause.",
    de: "Welche Ebenen auf dem MAIN-Screen sichtbar sind. Ist eine Ebene nirgends aktiviert (weder TM noch TS), wird sie schlicht nicht gerendert — Ursache Nr. 1 für 'mein Background ist unsichtbar'."
  },
  fields: [
    { bits: [4,4], name: { en: "OBJ (sprites)", de: "OBJ (Sprites)" }, values: { 0: { en: "hidden", de: "versteckt" }, 1: { en: "visible", de: "sichtbar" } } },
    { bits: [3,3], name: { en: "BG4", de: "BG4" }, values: { 0: { en: "hidden", de: "versteckt" }, 1: { en: "visible", de: "sichtbar" } } },
    { bits: [2,2], name: { en: "BG3", de: "BG3" }, values: { 0: { en: "hidden", de: "versteckt" }, 1: { en: "visible", de: "sichtbar" } } },
    { bits: [1,1], name: { en: "BG2", de: "BG2" }, values: { 0: { en: "hidden", de: "versteckt" }, 1: { en: "visible", de: "sichtbar" } } },
    { bits: [0,0], name: { en: "BG1", de: "BG1" }, values: { 0: { en: "hidden", de: "versteckt" }, 1: { en: "visible", de: "sichtbar" } } }
  ],
  warnings: [
    { level: "info", en: "Main screen = what you normally see. The sub screen (TS) only matters for color math and hires modes.",
      de: "Main-Screen = was man normal sieht. Der Sub-Screen (TS) spielt nur für Color Math und Hires-Modi eine Rolle." }
  ],
  lint: function (v) {
    if ((v & 0x1F) === 0) return [{ level: "warn", en: "Value 0 = nothing on the main screen: you'll see only the backdrop color.",
                                    de: "Wert 0 = nichts auf dem Main-Screen: man sieht nur die Backdrop-Farbe." }];
    return [];
  }
},

{ addr: 0x212D, mnem: "TS", group: "screens", access: "W", size: 8, timing: "anytime",
  title: { en: "Sub screen designation", de: "Sub-Screen-Zuordnung" },
  desc: {
    en: "Which layers render on the SUB screen — the hidden second image that color math blends with the main screen (transparency!) and that provides the extra columns in hires modes.",
    de: "Welche Ebenen auf dem SUB-Screen landen — das versteckte zweite Bild, das Color Math mit dem Main-Screen verrechnet (Transparenz!) und das in Hires-Modi die Zusatzspalten liefert."
  },
  fields: [
    { bits: [4,4], name: { en: "OBJ (sprites)", de: "OBJ (Sprites)" }, values: { 0: { en: "off", de: "aus" }, 1: { en: "on sub screen", de: "auf Sub-Screen" } } },
    { bits: [3,3], name: { en: "BG4", de: "BG4" }, values: { 0: { en: "off", de: "aus" }, 1: { en: "on sub screen", de: "auf Sub-Screen" } } },
    { bits: [2,2], name: { en: "BG3", de: "BG3" }, values: { 0: { en: "off", de: "aus" }, 1: { en: "on sub screen", de: "auf Sub-Screen" } } },
    { bits: [1,1], name: { en: "BG2", de: "BG2" }, values: { 0: { en: "off", de: "aus" }, 1: { en: "on sub screen", de: "auf Sub-Screen" } } },
    { bits: [0,0], name: { en: "BG1", de: "BG1" }, values: { 0: { en: "off", de: "aus" }, 1: { en: "on sub screen", de: "auf Sub-Screen" } } }
  ],
  warnings: [
    { level: "info", en: "Classic transparency recipe: fog layer on TS, everything else on TM, CGWSEL bit 1 = 1, CGADSUB = add-half + target layers.",
      de: "Klassisches Transparenz-Rezept: Nebel-Ebene auf TS, Rest auf TM, CGWSEL Bit 1 = 1, CGADSUB = Add-Half + Ziel-Ebenen." }
  ]
},

{ addr: 0x212E, mnem: "TMW", group: "screens", access: "W", size: 8, timing: "anytime",
  title: { en: "Window masking on main screen", de: "Window-Maskierung auf Main-Screen" },
  desc: {
    en: "Per layer: does the window mask (defined in W12SEL/W34SEL/WOBJSEL) actually hide this layer on the main screen?",
    de: "Pro Ebene: verdeckt die Window-Maske (definiert in W12SEL/W34SEL/WOBJSEL) diese Ebene tatsächlich auf dem Main-Screen?"
  },
  fields: [
    { bits: [4,4], name: { en: "OBJ masked", de: "OBJ maskiert" }, values: { 0: { en: "no", de: "nein" }, 1: { en: "yes", de: "ja" } } },
    { bits: [3,3], name: { en: "BG4 masked", de: "BG4 maskiert" }, values: { 0: { en: "no", de: "nein" }, 1: { en: "yes", de: "ja" } } },
    { bits: [2,2], name: { en: "BG3 masked", de: "BG3 maskiert" }, values: { 0: { en: "no", de: "nein" }, 1: { en: "yes", de: "ja" } } },
    { bits: [1,1], name: { en: "BG2 masked", de: "BG2 maskiert" }, values: { 0: { en: "no", de: "nein" }, 1: { en: "yes", de: "ja" } } },
    { bits: [0,0], name: { en: "BG1 masked", de: "BG1 maskiert" }, values: { 0: { en: "no", de: "nein" }, 1: { en: "yes", de: "ja" } } }
  ],
  warnings: []
},

{ addr: 0x212F, mnem: "TSW", group: "screens", access: "W", size: 8, timing: "anytime",
  title: { en: "Window masking on sub screen", de: "Window-Maskierung auf Sub-Screen" },
  desc: { en: "Same as TMW, but for the sub screen.", de: "Wie TMW, aber für den Sub-Screen." },
  fields: [
    { bits: [4,4], name: { en: "OBJ masked", de: "OBJ maskiert" }, values: { 0: { en: "no", de: "nein" }, 1: { en: "yes", de: "ja" } } },
    { bits: [3,3], name: { en: "BG4 masked", de: "BG4 maskiert" }, values: { 0: { en: "no", de: "nein" }, 1: { en: "yes", de: "ja" } } },
    { bits: [2,2], name: { en: "BG3 masked", de: "BG3 maskiert" }, values: { 0: { en: "no", de: "nein" }, 1: { en: "yes", de: "ja" } } },
    { bits: [1,1], name: { en: "BG2 masked", de: "BG2 maskiert" }, values: { 0: { en: "no", de: "nein" }, 1: { en: "yes", de: "ja" } } },
    { bits: [0,0], name: { en: "BG1 masked", de: "BG1 maskiert" }, values: { 0: { en: "no", de: "nein" }, 1: { en: "yes", de: "ja" } } }
  ],
  warnings: []
},

{ addr: 0x2130, mnem: "CGWSEL", group: "colormath", access: "W", size: 8, timing: "anytime",
  title: { en: "Color math control A", de: "Color-Math-Steuerung A" },
  desc: {
    en: "Gates WHERE color math happens (via the color window) and what the second operand is: the sub screen image or the fixed color from COLDATA.",
    de: "Steuert, WO Color Math stattfindet (über das Farb-Window) und was der zweite Operand ist: das Sub-Screen-Bild oder die Fixed Color aus COLDATA."
  },
  fields: [
    { bits: [7,6], name: { en: "Force main screen black", de: "Main-Screen schwarz erzwingen" },
      values: { 0: { en: "never", de: "nie" }, 1: { en: "outside color window", de: "außerhalb des Farb-Windows" },
                2: { en: "inside color window", de: "innerhalb des Farb-Windows" }, 3: { en: "always", de: "immer" } } },
    { bits: [5,4], name: { en: "Disable color math", de: "Color Math deaktivieren" },
      values: { 0: { en: "nowhere (math everywhere)", de: "nirgends (Math überall)" }, 1: { en: "outside color window", de: "außerhalb des Farb-Windows" },
                2: { en: "inside color window", de: "innerhalb des Farb-Windows" }, 3: { en: "everywhere (math off)", de: "überall (Math aus)" } } },
    { bits: [1,1], name: { en: "Second operand", de: "Zweiter Operand" },
      values: { 0: { en: "fixed color (COLDATA)", de: "Fixed Color (COLDATA)" }, 1: { en: "sub screen pixels", de: "Sub-Screen-Pixel" } } },
    { bits: [0,0], name: { en: "Direct color mode", de: "Direct-Color-Modus" },
      values: { 0: { en: "off — use CGRAM palette", de: "aus — CGRAM-Palette nutzen" },
                1: { en: "on — 8bpp pixel value IS the color (BBGGGRRR)", de: "an — der 8bpp-Pixelwert IST die Farbe (BBGGGRRR)" } } }
  ],
  warnings: [
    { level: "info", en: "Direct color only affects 256-color BGs (Modes 3/4/7).", de: "Direct Color wirkt nur auf 256-Farben-BGs (Mode 3/4/7)." }
  ]
},

{ addr: 0x2131, mnem: "CGADSUB", group: "colormath", access: "W", size: 8, timing: "anytime",
  title: { en: "Color math control B (add/subtract)", de: "Color-Math-Steuerung B (Add/Subtract)" },
  desc: {
    en: "THE transparency register: which layers get color math applied, whether colors are added or subtracted, and whether the result is halved (true 50% transparency).",
    de: "DAS Transparenz-Register: welche Ebenen Color Math bekommen, ob Farben addiert oder subtrahiert werden, und ob das Ergebnis halbiert wird (echte 50%-Transparenz)."
  },
  fields: [
    { bits: [7,7], name: { en: "Operation", de: "Operation" },
      values: { 0: { en: "add (glow, light)", de: "Addieren (Glühen, Licht)" }, 1: { en: "subtract (shadow, darkness)", de: "Subtrahieren (Schatten, Dunkelheit)" } } },
    { bits: [6,6], name: { en: "Half result", de: "Ergebnis halbieren" },
      values: { 0: { en: "full add/sub (clamps at 31/0)", de: "voll addieren/subtrahieren (klemmt bei 31/0)" }, 1: { en: "÷2 — the classic 50% blend", de: "÷2 — der klassische 50%-Blend" } } },
    { bits: [5,5], name: { en: "Backdrop math", de: "Backdrop-Math" }, values: { 0: { en: "off", de: "aus" }, 1: { en: "on", de: "an" } } },
    { bits: [4,4], name: { en: "OBJ math (palettes 12–15 only!)", de: "OBJ-Math (nur Paletten 12–15!)" }, values: { 0: { en: "off", de: "aus" }, 1: { en: "on", de: "an" } } },
    { bits: [3,3], name: { en: "BG4 math", de: "BG4-Math" }, values: { 0: { en: "off", de: "aus" }, 1: { en: "on", de: "an" } } },
    { bits: [2,2], name: { en: "BG3 math", de: "BG3-Math" }, values: { 0: { en: "off", de: "aus" }, 1: { en: "on", de: "an" } } },
    { bits: [1,1], name: { en: "BG2 math", de: "BG2-Math" }, values: { 0: { en: "off", de: "aus" }, 1: { en: "on", de: "an" } } },
    { bits: [0,0], name: { en: "BG1 math", de: "BG1-Math" }, values: { 0: { en: "off", de: "aus" }, 1: { en: "on", de: "an" } } }
  ],
  warnings: [
    { level: "warn", en: "Hardware limit: sprites using palettes 8–11 NEVER participate in color math, no matter what you set here. Plan your palette layout accordingly.",
      de: "Hardware-Limit: Sprites mit Paletten 8–11 nehmen NIE an Color Math teil, egal was hier steht. Palettenlayout entsprechend planen." },
    { level: "info", en: "'Half' only applies where both operands are visible; against the backdrop the full operation is used (with sub screen operand).",
      de: "'Halbieren' gilt nur, wo beide Operanden sichtbar sind; gegen den Backdrop wird (mit Sub-Screen-Operand) voll gerechnet." }
  ]
},

{ addr: 0x2132, mnem: "COLDATA", group: "colormath", access: "W", size: 8, timing: "anytime",
  title: { en: "Fixed color data", de: "Fixed-Color-Daten" },
  desc: {
    en: "Sets the fixed color used by color math when CGWSEL bit 1 = 0. Bits 5–7 select which channel(s) the 5-bit intensity is written to — you can set several channels at once, but need up to 3 writes for a full RGB color.",
    de: "Setzt die Fixed Color für Color Math, wenn CGWSEL Bit 1 = 0. Bits 5–7 wählen, in welche Kanäle die 5-Bit-Intensität geschrieben wird — mehrere Kanäle gleichzeitig gehen, aber für eine volle RGB-Farbe braucht es bis zu 3 Writes."
  },
  fields: [
    { bits: [7,7], name: { en: "Write blue", de: "Blau schreiben" }, values: { 0: { en: "no", de: "nein" }, 1: { en: "yes", de: "ja" } } },
    { bits: [6,6], name: { en: "Write green", de: "Grün schreiben" }, values: { 0: { en: "no", de: "nein" }, 1: { en: "yes", de: "ja" } } },
    { bits: [5,5], name: { en: "Write red", de: "Rot schreiben" }, values: { 0: { en: "no", de: "nein" }, 1: { en: "yes", de: "ja" } } },
    { bits: [4,0], name: { en: "Intensity", de: "Intensität" }, fmt: { type: "raw", label: { en: "0–31", de: "0–31" } } }
  ],
  warnings: [
    { level: "info", en: "HDMA on COLDATA = the famous sky gradients (subtractive fixed color per scanline).",
      de: "HDMA auf COLDATA = die berühmten Himmels-Gradienten (subtraktive Fixed Color pro Scanline)." }
  ],
  lint: function (v) {
    if ((v & 0xE0) === 0 && (v & 0x1F) !== 0)
      return [{ level: "warn", en: "Intensity set but no channel selected (bits 5–7 all 0) — this write changes nothing.",
                de: "Intensität gesetzt, aber kein Kanal gewählt (Bits 5–7 alle 0) — dieser Write ändert nichts." }];
    return [];
  }
},

{ addr: 0x2133, mnem: "SETINI", group: "display", access: "W", size: 8, timing: "anytime",
  title: { en: "Display extras: interlace, overscan, hires, EXTBG", de: "Display-Extras: Interlace, Overscan, Hires, EXTBG" },
  desc: {
    en: "Grab bag of display options: interlacing (448 lines), overscan (239 lines), pseudo-hires (512px) and EXTBG, which unlocks a second Mode 7 layer that reads the priority bit per pixel.",
    de: "Sammelbecken für Display-Optionen: Interlacing (448 Zeilen), Overscan (239 Zeilen), Pseudo-Hires (512px) und EXTBG, das eine zweite Mode-7-Ebene freischaltet, die das Prioritäts-Bit pro Pixel auswertet."
  },
  fields: [
    { bits: [7,7], name: { en: "External sync", de: "Externe Synchronisation" }, values: { 0: { en: "off (normal)", de: "aus (normal)" }, 1: { en: "on (super-imposing hardware)", de: "an (Überblend-Hardware)" } } },
    { bits: [6,6], name: { en: "EXTBG (Mode 7 BG2)", de: "EXTBG (Mode-7-BG2)" },
      values: { 0: { en: "off", de: "aus" }, 1: { en: "on — Mode 7 gets a BG2 with per-pixel priority", de: "an — Mode 7 bekommt ein BG2 mit Pro-Pixel-Priorität" } } },
    { bits: [3,3], name: { en: "Pseudo-hires", de: "Pseudo-Hires" }, values: { 0: { en: "off", de: "aus" }, 1: { en: "512px by interleaving main/sub screen", de: "512px durch Verschränken von Main-/Sub-Screen" } } },
    { bits: [2,2], name: { en: "Overscan", de: "Overscan" }, values: { 0: { en: "224 lines", de: "224 Zeilen" }, 1: { en: "239 lines (PAL-friendly)", de: "239 Zeilen (PAL-freundlich)" } } },
    { bits: [1,1], name: { en: "OBJ interlace", de: "OBJ-Interlace" }, values: { 0: { en: "off", de: "aus" }, 1: { en: "sprites half-height in interlace", de: "Sprites halbe Höhe im Interlace" } } },
    { bits: [0,0], name: { en: "Screen interlace", de: "Screen-Interlace" }, values: { 0: { en: "off (262 lines progressive)", de: "aus (262 Zeilen progressiv)" }, 1: { en: "on (448/478 lines interlaced)", de: "an (448/478 Zeilen interlaced)" } } }
  ],
  warnings: [
    { level: "warn", en: "Overscan ON shortens VBlank by 15 lines — your DMA budget per frame shrinks noticeably.",
      de: "Overscan AN verkürzt VBlank um 15 Zeilen — das DMA-Budget pro Frame schrumpft spürbar." }
  ]
},

{ addr: 0x2134, mnem: "MPYL", group: "status", access: "R", size: 8, timing: "read_any",
  title: { en: "Multiplication result (low)", de: "Multiplikationsergebnis (Low)" },
  desc: {
    en: "Bits 0–7 of the signed 24-bit product M7A (16-bit) × M7B (last written byte, 8-bit). This hardware multiplier is FREE and instant — many games use it for general math outside Mode 7 rendering.",
    de: "Bits 0–7 des signed 24-Bit-Produkts M7A (16 Bit) × M7B (zuletzt geschriebenes Byte, 8 Bit). Dieser Hardware-Multiplizierer ist GRATIS und sofort fertig — viele Spiele nutzen ihn für allgemeine Mathematik außerhalb des Mode-7-Renderings."
  },
  fields: [ { bits: [7,0], name: { en: "Product bits 0–7", de: "Produkt-Bits 0–7" }, fmt: { type: "raw" } } ],
  warnings: [
    { level: "warn", en: "Don't read while the PPU is actively rendering Mode 7 — the matrix registers are in use and results are garbage.",
      de: "Nicht lesen, während die PPU aktiv Mode 7 rendert — die Matrix-Register sind dann in Benutzung, Ergebnisse sind Müll." }
  ]
},

{ addr: 0x2135, mnem: "MPYM", group: "status", access: "R", size: 8, timing: "read_any",
  title: { en: "Multiplication result (middle)", de: "Multiplikationsergebnis (Mitte)" },
  desc: { en: "Bits 8–15 of the M7A × M7B product.", de: "Bits 8–15 des Produkts M7A × M7B." },
  fields: [ { bits: [7,0], name: { en: "Product bits 8–15", de: "Produkt-Bits 8–15" }, fmt: { type: "raw" } } ],
  warnings: []
},

{ addr: 0x2136, mnem: "MPYH", group: "status", access: "R", size: 8, timing: "read_any",
  title: { en: "Multiplication result (high)", de: "Multiplikationsergebnis (High)" },
  desc: { en: "Bits 16–23 of the M7A × M7B product (sign-extended).", de: "Bits 16–23 des Produkts M7A × M7B (vorzeichenerweitert)." },
  fields: [ { bits: [7,0], name: { en: "Product bits 16–23", de: "Produkt-Bits 16–23" }, fmt: { type: "raw" } } ],
  warnings: []
},

{ addr: 0x2137, mnem: "SLHV", group: "status", access: "R", size: 8, timing: "read_any",
  title: { en: "Latch H/V counters", de: "H/V-Zähler latchen" },
  desc: {
    en: "Reading this register (the value itself is open-bus junk) freezes the current beam position into OPHCT/OPVCT. Used for light guns (Super Scope) and precise raster timing.",
    de: "Das Lesen dieses Registers (der Wert selbst ist Open-Bus-Müll) friert die aktuelle Strahlposition in OPHCT/OPVCT ein. Genutzt für Lightguns (Super Scope) und präzises Raster-Timing."
  },
  fields: [ { bits: [7,0], name: { en: "(open bus — value meaningless)", de: "(Open Bus — Wert bedeutungslos)" }, fmt: { type: "raw" } } ],
  warnings: [
    { level: "info", en: "Latching only works while bit 7 of $4201 (WRIO) is set.", de: "Latchen funktioniert nur, solange Bit 7 von $4201 (WRIO) gesetzt ist." }
  ]
},

{ addr: 0x2138, mnem: "RDOAM", group: "status", access: "R", size: 8, timing: "read_vblank",
  title: { en: "OAM data read", de: "OAM-Daten lesen" },
  desc: { en: "Reads one byte from OAM at the current address (auto-increments). Rarely used — most games keep a WRAM shadow copy instead.", de: "Liest ein Byte aus dem OAM an der aktuellen Adresse (zählt automatisch hoch). Selten genutzt — die meisten Spiele halten stattdessen eine WRAM-Schattenkopie." },
  fields: [ { bits: [7,0], name: { en: "OAM byte", de: "OAM-Byte" }, fmt: { type: "raw" } } ],
  warnings: []
},

{ addr: 0x2139, mnem: "RDVRAML", group: "status", access: "R", size: 8, timing: "read_vblank",
  title: { en: "VRAM data read (low)", de: "VRAM-Daten lesen (Low)" },
  desc: {
    en: "Reads the low byte of the prefetch buffer, then (depending on VMAIN bit 7) fetches the next word. THE quirk: after setting VMADD, the buffer still holds the OLD word — do one dummy read first.",
    de: "Liest das Low-Byte des Prefetch-Puffers, danach (je nach VMAIN Bit 7) wird das nächste Wort geholt. DER Quirk: nach dem Setzen von VMADD enthält der Puffer noch das ALTE Wort — erst einen Dummy-Read machen."
  },
  fields: [ { bits: [7,0], name: { en: "VRAM byte (buffered)", de: "VRAM-Byte (gepuffert)" }, fmt: { type: "raw" } } ],
  warnings: [
    { level: "warn", en: "Forgetting the dummy read shifts ALL read data by one word — a classic head-scratcher.",
      de: "Den Dummy-Read zu vergessen verschiebt ALLE gelesenen Daten um ein Wort — ein klassischer Kopfkratzer." }
  ]
},

{ addr: 0x213A, mnem: "RDVRAMH", group: "status", access: "R", size: 8, timing: "read_vblank",
  title: { en: "VRAM data read (high)", de: "VRAM-Daten lesen (High)" },
  desc: { en: "High byte of the VRAM prefetch buffer. Same dummy-read rule as RDVRAML.", de: "High-Byte des VRAM-Prefetch-Puffers. Gleiche Dummy-Read-Regel wie RDVRAML." },
  fields: [ { bits: [7,0], name: { en: "VRAM byte (buffered)", de: "VRAM-Byte (gepuffert)" }, fmt: { type: "raw" } } ],
  warnings: []
},

{ addr: 0x213B, mnem: "RDCGRAM", group: "status", access: "R2", size: 8, timing: "read_vblank",
  title: { en: "CGRAM data read", de: "CGRAM-Daten lesen" },
  desc: { en: "Read twice per color (low, then high byte). Bit 7 of the second read is open bus.", de: "Zweimal lesen pro Farbe (Low-, dann High-Byte). Bit 7 des zweiten Reads ist Open Bus." },
  fields: [ { bits: [7,0], name: { en: "CGRAM byte", de: "CGRAM-Byte" }, fmt: { type: "raw" } } ],
  warnings: []
},

{ addr: 0x213C, mnem: "OPHCT", group: "status", access: "R2", size: 8, timing: "read_any",
  title: { en: "Horizontal beam position (latched)", de: "Horizontale Strahlposition (gelatcht)" },
  desc: {
    en: "9-bit horizontal counter frozen by reading SLHV. Read twice: first low 8 bits, then bit 8 (upper 7 bits of the 2nd read are open bus — mask with AND #$01!). Range 0–339.",
    de: "9-Bit-Horizontalzähler, eingefroren durch Lesen von SLHV. Zweimal lesen: erst die unteren 8 Bits, dann Bit 8 (obere 7 Bits des 2. Reads sind Open Bus — mit AND #$01 maskieren!). Bereich 0–339."
  },
  fields: [ { bits: [8,0], name: { en: "H counter", de: "H-Zähler" }, fmt: { type: "raw", label: { en: "0–339 dots", de: "0–339 Dots" } } } ],
  warnings: [
    { level: "warn", en: "Reading STAT78 resets the low/high read flip-flop — do that first if you're unsure of its state.",
      de: "Das Lesen von STAT78 setzt das Low/High-Lese-Flip-Flop zurück — zuerst machen, wenn der Zustand unklar ist." }
  ]
},

{ addr: 0x213D, mnem: "OPVCT", group: "status", access: "R2", size: 8, timing: "read_any",
  title: { en: "Vertical beam position (latched)", de: "Vertikale Strahlposition (gelatcht)" },
  desc: { en: "9-bit vertical counter (scanline), latched by SLHV. Read twice like OPHCT. Range 0–261 NTSC / 0–311 PAL.", de: "9-Bit-Vertikalzähler (Scanline), gelatcht per SLHV. Zweimal lesen wie OPHCT. Bereich 0–261 NTSC / 0–311 PAL." },
  fields: [ { bits: [8,0], name: { en: "V counter", de: "V-Zähler" }, fmt: { type: "raw", label: { en: "scanline", de: "Scanline" } } } ],
  warnings: []
},

{ addr: 0x213E, mnem: "STAT77", group: "status", access: "R", size: 8, timing: "read_any",
  title: { en: "PPU1 status: sprite overflow flags", de: "PPU1-Status: Sprite-Überlauf-Flags" },
  desc: {
    en: "The closest thing the PPU has to an 'error report': tells you if the sprite-per-scanline limits were exceeded this frame. Poll it during VBlank to detect sprite flicker conditions.",
    de: "Das Nächste an einem 'Fehlerbericht', das die PPU hat: meldet, ob die Sprite-Limits pro Scanline in diesem Frame überschritten wurden. Während VBlank abfragen, um Sprite-Flacker-Situationen zu erkennen."
  },
  fields: [
    { bits: [7,7], name: { en: "Time over", de: "Time Over" },
      values: { 0: { en: "OK", de: "OK" }, 1: { en: "more than 34 sprite tiles on one scanline — tiles were dropped", de: "mehr als 34 Sprite-Tiles auf einer Scanline — Tiles wurden verworfen" } } },
    { bits: [6,6], name: { en: "Range over", de: "Range Over" },
      values: { 0: { en: "OK", de: "OK" }, 1: { en: "more than 32 sprites on one scanline — sprites were dropped", de: "mehr als 32 Sprites auf einer Scanline — Sprites wurden verworfen" } } },
    { bits: [5,5], name: { en: "Master/slave (unused)", de: "Master/Slave (ungenutzt)" }, fmt: { type: "raw" } },
    { bits: [3,0], name: { en: "PPU1 chip version", de: "PPU1-Chip-Version" }, fmt: { type: "raw", label: { en: "usually 1", de: "meist 1" } } }
  ],
  warnings: [
    { level: "info", en: "Flags are cleared at the end of VBlank, not by reading.", de: "Die Flags werden am Ende von VBlank gelöscht, nicht durch das Lesen." }
  ]
},

{ addr: 0x213F, mnem: "STAT78", group: "status", access: "R", size: 8, timing: "read_any",
  title: { en: "PPU2 status: field, latch, NTSC/PAL", de: "PPU2-Status: Field, Latch, NTSC/PAL" },
  desc: {
    en: "Interlace field, counter-latch flag and the console region. Reading it also resets the OPHCT/OPVCT read flip-flops and clears the latch flag.",
    de: "Interlace-Field, Zähler-Latch-Flag und die Konsolenregion. Das Lesen setzt zudem die OPHCT/OPVCT-Lese-Flip-Flops zurück und löscht das Latch-Flag."
  },
  fields: [
    { bits: [7,7], name: { en: "Interlace field", de: "Interlace-Field" }, values: { 0: { en: "even frame", de: "gerades Frame" }, 1: { en: "odd frame", de: "ungerades Frame" } } },
    { bits: [6,6], name: { en: "Counter latch flag", de: "Zähler-Latch-Flag" }, values: { 0: { en: "not latched", de: "nicht gelatcht" }, 1: { en: "H/V counters were latched", de: "H/V-Zähler wurden gelatcht" } } },
    { bits: [4,4], name: { en: "Region", de: "Region" }, values: { 0: { en: "NTSC (60 Hz)", de: "NTSC (60 Hz)" }, 1: { en: "PAL (50 Hz)", de: "PAL (50 Hz)" } } },
    { bits: [3,0], name: { en: "PPU2 chip version", de: "PPU2-Chip-Version" }, fmt: { type: "raw", label: { en: "1–3", de: "1–3" } } }
  ],
  warnings: []
}

);
