// SNES PPU registers $2115–$212B: VRAM access, Mode 7, CGRAM, windows.
window.SNES.registers.push(

{ addr: 0x2115, mnem: "VMAIN", group: "vram", access: "W", size: 8, timing: "anytime",
  title: { en: "VRAM address increment mode", de: "VRAM-Adress-Inkrement-Modus" },
  desc: {
    en: "Controls how the VRAM address auto-increments after data port access, and an optional address remapping that rearranges bitplanes for you. $80 (increment by 1 after high byte) is the value you want 95% of the time.",
    de: "Steuert, wie die VRAM-Adresse nach Datenport-Zugriffen automatisch hochzählt, plus ein optionales Address-Remapping, das Bitplanes umsortiert. $80 (Inkrement um 1 nach High-Byte) ist in 95 % der Fälle der richtige Wert."
  },
  fields: [
    { bits: [7,7], name: { en: "Increment timing", de: "Inkrement-Zeitpunkt" },
      values: { 0: { en: "after writing $2118 / reading $2139 (low byte)", de: "nach Write auf $2118 / Read von $2139 (Low-Byte)" },
                1: { en: "after writing $2119 / reading $213A (high byte) — the normal choice", de: "nach Write auf $2119 / Read von $213A (High-Byte) — der Normalfall" } } },
    { bits: [3,2], name: { en: "Address remapping", de: "Address-Remapping" },
      values: { 0: { en: "none", de: "keins" },
                1: { en: "rotate for 2bpp (8-bit)", de: "Rotation für 2bpp (8 Bit)" },
                2: { en: "rotate for 4bpp (9-bit)", de: "Rotation für 4bpp (9 Bit)" },
                3: { en: "rotate for 8bpp (10-bit)", de: "Rotation für 8bpp (10 Bit)" } } },
    { bits: [1,0], name: { en: "Increment step", de: "Inkrement-Schritt" },
      values: { 0: { en: "+1 word", de: "+1 Wort" }, 1: { en: "+32 words", de: "+32 Wörter" },
                2: { en: "+128 words", de: "+128 Wörter" }, 3: { en: "+128 words", de: "+128 Wörter" } } }
  ],
  warnings: [
    { level: "warn", en: "Wrong bit 7 + DMA of both bytes = every value written twice to every other address. If your graphics look 'doubled', check VMAIN first.",
      de: "Falsches Bit 7 + DMA beider Bytes = jeder Wert doppelt an jede zweite Adresse geschrieben. Sehen die Grafiken 'verdoppelt' aus, zuerst VMAIN prüfen." },
    { level: "info", en: "+32 step is handy for writing tilemap columns vertically.",
      de: "Schritt +32 ist praktisch, um Tilemap-Spalten vertikal zu schreiben." }
  ]
},

{ addr: 0x2116, mnem: "VMADDL", group: "vram", access: "W", size: 8, timing: "anytime",
  title: { en: "VRAM word address (low)", de: "VRAM-Wortadresse (Low)" },
  desc: {
    en: "Low byte of the VRAM word address for the data port. Remember: VRAM is WORD addressed — byte address ÷ 2. Writing VMADD also triggers the read prefetch.",
    de: "Low-Byte der VRAM-Wortadresse für den Datenport. Merke: VRAM ist WORT-adressiert — Byte-Adresse ÷ 2. Das Schreiben von VMADD triggert auch den Lese-Prefetch."
  },
  fields: [
    { bits: [7,0], name: { en: "Address bits 0–7", de: "Adress-Bits 0–7" }, fmt: { type: "raw", label: { en: "word address low byte", de: "Wortadresse Low-Byte" } } }
  ],
  warnings: [
    { level: "warn", en: "The #1 beginner trap: using byte addresses. Tile at VRAM byte $2000 = word address $1000.",
      de: "Die Anfängerfalle Nr. 1: Byte-Adressen verwenden. Tile bei VRAM-Byte $2000 = Wortadresse $1000." }
  ]
},

{ addr: 0x2117, mnem: "VMADDH", group: "vram", access: "W", size: 8, timing: "anytime",
  title: { en: "VRAM word address (high)", de: "VRAM-Wortadresse (High)" },
  desc: { en: "High byte of the VRAM word address ($0000–$7FFF valid; bit 7 wraps).", de: "High-Byte der VRAM-Wortadresse ($0000–$7FFF gültig; Bit 7 wickelt um)." },
  fields: [
    { bits: [7,0], name: { en: "Address bits 8–15", de: "Adress-Bits 8–15" }, fmt: { type: "raw", label: { en: "word address high byte", de: "Wortadresse High-Byte" } } }
  ],
  warnings: []
},

{ addr: 0x2118, mnem: "VMDATAL", group: "vram", access: "W", size: 8, timing: "vblank",
  title: { en: "VRAM data write (low byte)", de: "VRAM-Daten schreiben (Low-Byte)" },
  desc: {
    en: "Writes the low byte of the current VRAM word. With VMAIN = $80 you write low then high and the address advances after the high byte. This pair is the DMA target (B-bus $18/$19) for all tile/tilemap uploads.",
    de: "Schreibt das Low-Byte des aktuellen VRAM-Worts. Mit VMAIN = $80 schreibt man Low, dann High, und die Adresse zählt nach dem High-Byte weiter. Dieses Paar ist das DMA-Ziel (B-Bus $18/$19) für alle Tile-/Tilemap-Uploads."
  },
  fields: [
    { bits: [7,0], name: { en: "Data (low byte of word)", de: "Daten (Low-Byte des Worts)" }, fmt: { type: "raw" } }
  ],
  warnings: [
    { level: "err", en: "Writes during active display are DROPPED (or land on wrong addresses on some revisions). Your write disappears without any error — the hardware stays silent. Only write during VBlank or forced blank.",
      de: "Writes während des aktiven Bilds werden VERWORFEN (oder landen auf manchen Revisionen an falschen Adressen). Der Write verschwindet ohne Fehlermeldung — die Hardware bleibt stumm. Nur während VBlank oder Forced Blank schreiben." }
  ]
},

{ addr: 0x2119, mnem: "VMDATAH", group: "vram", access: "W", size: 8, timing: "vblank",
  title: { en: "VRAM data write (high byte)", de: "VRAM-Daten schreiben (High-Byte)" },
  desc: { en: "Writes the high byte of the current VRAM word; with VMAIN=$80 this advances the address.", de: "Schreibt das High-Byte des aktuellen VRAM-Worts; mit VMAIN=$80 zählt danach die Adresse weiter." },
  fields: [
    { bits: [7,0], name: { en: "Data (high byte of word)", de: "Daten (High-Byte des Worts)" }, fmt: { type: "raw" } }
  ],
  warnings: [
    { level: "err", en: "Same as VMDATAL: silently dropped outside VBlank/forced blank.",
      de: "Wie VMDATAL: außerhalb von VBlank/Forced Blank stillschweigend verworfen." }
  ]
},

{ addr: 0x211A, mnem: "M7SEL", group: "mode7", access: "W", size: 8, timing: "anytime",
  title: { en: "Mode 7 settings", de: "Mode-7-Einstellungen" },
  desc: {
    en: "Flipping and out-of-bounds behavior for the Mode 7 playfield (the 1024×1024 px map).",
    de: "Spiegelung und Außenbereichs-Verhalten für das Mode-7-Spielfeld (die 1024×1024-px-Karte)."
  },
  fields: [
    { bits: [7,6], name: { en: "Screen over (outside map)", de: "Screen Over (außerhalb der Karte)" },
      values: { 0: { en: "wrap around", de: "wickelt um" },
                1: { en: "wrap around", de: "wickelt um" },
                2: { en: "transparent outside", de: "außerhalb transparent" },
                3: { en: "fill outside with tile $00", de: "außerhalb mit Tile $00 füllen" } } },
    { bits: [1,1], name: { en: "Vertical flip", de: "Vertikal spiegeln" }, values: { 0: { en: "off", de: "aus" }, 1: { en: "flip whole screen", de: "ganzen Screen spiegeln" } } },
    { bits: [0,0], name: { en: "Horizontal flip", de: "Horizontal spiegeln" }, values: { 0: { en: "off", de: "aus" }, 1: { en: "flip whole screen", de: "ganzen Screen spiegeln" } } }
  ],
  warnings: []
},

{ addr: 0x211B, mnem: "M7A", group: "mode7", access: "W2", size: 16, timing: "anytime",
  title: { en: "Mode 7 matrix A (cos·scale) / multiplicand", de: "Mode-7-Matrix A (cos·Skalierung) / Multiplikand" },
  desc: {
    en: "Matrix element A of the Mode 7 affine transform, 8.8 signed fixed point ($0100 = 1.0). Doubles as 16-bit multiplicand for the free hardware multiplier: result of M7A × M7B appears in MPYL/M/H immediately — usable even outside Mode 7!",
    de: "Matrix-Element A der Mode-7-Affintransformation, 8.8 signed Fixed-Point ($0100 = 1.0). Dient zugleich als 16-Bit-Multiplikand des Gratis-Hardware-Multiplizierers: das Ergebnis von M7A × M7B steht sofort in MPYL/M/H — auch außerhalb von Mode 7 nutzbar!"
  },
  fields: [
    { bits: [15,0], name: { en: "Value (8.8 fixed, signed)", de: "Wert (8.8 Fixed, signed)" }, fmt: { type: "fixed88" } }
  ],
  warnings: [
    { level: "warn", en: "Write-twice: low byte then high byte. The matrix registers latch per-scanline — HDMA on M7A–M7D gives you perspective floors (F-Zero, Mario Kart).",
      de: "Write-Twice: Low-Byte, dann High-Byte. Die Matrix-Register latchen pro Scanline — HDMA auf M7A–M7D ergibt Perspektiv-Böden (F-Zero, Mario Kart)." }
  ]
},

{ addr: 0x211C, mnem: "M7B", group: "mode7", access: "W2", size: 16, timing: "anytime",
  title: { en: "Mode 7 matrix B (sin·scale) / multiplier", de: "Mode-7-Matrix B (sin·Skalierung) / Multiplikator" },
  desc: {
    en: "Matrix element B, 8.8 signed fixed point. The most recent single byte written here is also the 8-bit signed multiplier for MPYL/M/H.",
    de: "Matrix-Element B, 8.8 signed Fixed-Point. Das zuletzt geschriebene einzelne Byte ist zugleich der 8-Bit-signed-Multiplikator für MPYL/M/H."
  },
  fields: [
    { bits: [15,0], name: { en: "Value (8.8 fixed, signed)", de: "Wert (8.8 Fixed, signed)" }, fmt: { type: "fixed88" } }
  ],
  warnings: []
},

{ addr: 0x211D, mnem: "M7C", group: "mode7", access: "W2", size: 16, timing: "anytime",
  title: { en: "Mode 7 matrix C (−sin·scale)", de: "Mode-7-Matrix C (−sin·Skalierung)" },
  desc: { en: "Matrix element C, 8.8 signed fixed point. Identity matrix: A=$0100, B=0, C=0, D=$0100.", de: "Matrix-Element C, 8.8 signed Fixed-Point. Einheitsmatrix: A=$0100, B=0, C=0, D=$0100." },
  fields: [
    { bits: [15,0], name: { en: "Value (8.8 fixed, signed)", de: "Wert (8.8 Fixed, signed)" }, fmt: { type: "fixed88" } }
  ],
  warnings: []
},

{ addr: 0x211E, mnem: "M7D", group: "mode7", access: "W2", size: 16, timing: "anytime",
  title: { en: "Mode 7 matrix D (cos·scale)", de: "Mode-7-Matrix D (cos·Skalierung)" },
  desc: { en: "Matrix element D, 8.8 signed fixed point.", de: "Matrix-Element D, 8.8 signed Fixed-Point." },
  fields: [
    { bits: [15,0], name: { en: "Value (8.8 fixed, signed)", de: "Wert (8.8 Fixed, signed)" }, fmt: { type: "fixed88" } }
  ],
  warnings: [
    { level: "err", en: "All-zero matrix (A=B=C=D=0) collapses the playfield to a single pixel smeared across the screen — if Mode 7 shows one giant color, your matrix never got written.",
      de: "Eine Null-Matrix (A=B=C=D=0) kollabiert das Spielfeld auf einen über den Screen geschmierten Pixel — zeigt Mode 7 nur eine Riesenfarbe, wurde die Matrix nie geschrieben." }
  ]
},

{ addr: 0x211F, mnem: "M7X", group: "mode7", access: "W2", size: 16, timing: "anytime",
  title: { en: "Mode 7 center X", de: "Mode-7-Zentrum X" },
  desc: { en: "X coordinate of the rotation/scaling center, 13-bit signed (−4096…4095).", de: "X-Koordinate des Rotations-/Skalierungszentrums, 13-Bit signed (−4096…4095)." },
  fields: [
    { bits: [12,0], name: { en: "Center X", de: "Zentrum X" }, fmt: { type: "signed", w: 13, label: { en: "pixels", de: "Pixel" } } }
  ],
  warnings: []
},

{ addr: 0x2120, mnem: "M7Y", group: "mode7", access: "W2", size: 16, timing: "anytime",
  title: { en: "Mode 7 center Y", de: "Mode-7-Zentrum Y" },
  desc: { en: "Y coordinate of the rotation/scaling center, 13-bit signed.", de: "Y-Koordinate des Rotations-/Skalierungszentrums, 13-Bit signed." },
  fields: [
    { bits: [12,0], name: { en: "Center Y", de: "Zentrum Y" }, fmt: { type: "signed", w: 13, label: { en: "pixels", de: "Pixel" } } }
  ],
  warnings: []
},

{ addr: 0x2121, mnem: "CGADD", group: "cgram", access: "W", size: 8, timing: "anytime",
  title: { en: "CGRAM (palette) address", de: "CGRAM-(Paletten-)Adresse" },
  desc: {
    en: "Selects which of the 256 palette entries the next CGDATA write pair hits. Also resets the CGDATA low/high flip-flop — write it before every palette upload.",
    de: "Wählt, welchen der 256 Paletteneinträge das nächste CGDATA-Write-Paar trifft. Setzt außerdem das CGDATA-Low/High-Flip-Flop zurück — vor jedem Paletten-Upload schreiben."
  },
  fields: [
    { bits: [7,0], name: { en: "Color index", de: "Farbindex" },
      fmt: { type: "raw", label: { en: "0–255; BG palettes 0–127, sprite palettes 128–255", de: "0–255; BG-Paletten 0–127, Sprite-Paletten 128–255" } } }
  ],
  warnings: [
    { level: "info", en: "Color 0 of every palette is transparent for tiles; CGRAM entry 0 is the backdrop color.",
      de: "Farbe 0 jeder Palette ist für Tiles transparent; CGRAM-Eintrag 0 ist die Backdrop-Farbe." }
  ]
},

{ addr: 0x2122, mnem: "CGDATA", group: "cgram", access: "W2", size: 16, timing: "vblank_cgram",
  title: { en: "CGRAM data write (15-bit BGR color)", de: "CGRAM-Daten schreiben (15-Bit-BGR-Farbe)" },
  desc: {
    en: "Write twice (low, then high byte) to set one color. Format: 0BBBBBGG GGGRRRRR — note the SNES is BGR, not RGB! After the pair, the CGRAM address auto-increments.",
    de: "Zweimal schreiben (Low-, dann High-Byte) für eine Farbe. Format: 0BBBBBGG GGGRRRRR — das SNES ist BGR, nicht RGB! Nach dem Paar zählt die CGRAM-Adresse automatisch hoch."
  },
  fields: [
    { bits: [14,10], name: { en: "Blue", de: "Blau" },  fmt: { type: "raw", label: { en: "0–31", de: "0–31" } } },
    { bits: [9,5],  name: { en: "Green", de: "Grün" }, fmt: { type: "raw", label: { en: "0–31", de: "0–31" } } },
    { bits: [4,0],  name: { en: "Red", de: "Rot" },    fmt: { type: "raw", label: { en: "0–31", de: "0–31" } } }
  ],
  warnings: [
    { level: "warn", en: "BGR order! $7C00 is pure blue, $001F is pure red. Swapped red/blue everywhere = you assumed RGB.",
      de: "BGR-Reihenfolge! $7C00 ist reines Blau, $001F reines Rot. Überall Rot/Blau vertauscht = du hast RGB angenommen." },
    { level: "warn", en: "Odd number of writes leaves the flip-flop desynced; every following color is byte-shifted. Re-write CGADD to resync.",
      de: "Ungerade Write-Anzahl lässt das Flip-Flop desynchron; alle folgenden Farben sind byte-verschoben. CGADD neu schreiben zum Resync." }
  ]
},

{ addr: 0x2123, mnem: "W12SEL", group: "window", access: "W", size: 8, timing: "anytime",
  title: { en: "Window mask settings BG1/BG2", de: "Window-Masken BG1/BG2" },
  desc: {
    en: "Enables window 1/2 masking per layer and whether the window area is inverted. Windows are two X ranges (WH0–WH3) that can hide layer regions or gate color math — the tool behind shaped shadows, spotlights and split-screen effects.",
    de: "Aktiviert Window-1/2-Maskierung pro Ebene und ob der Window-Bereich invertiert wird. Windows sind zwei X-Bereiche (WH0–WH3), die Ebenenbereiche verstecken oder Color Math begrenzen — das Werkzeug hinter Schatten, Spotlights und Splitscreen-Effekten."
  },
  fields: [
    { bits: [7,7], name: { en: "BG2 window 2 enable", de: "BG2 Window 2 aktiv" }, values: { 0: { en: "off", de: "aus" }, 1: { en: "on", de: "an" } } },
    { bits: [6,6], name: { en: "BG2 window 2 invert", de: "BG2 Window 2 invertiert" }, values: { 0: { en: "inside", de: "innen" }, 1: { en: "outside", de: "außen" } } },
    { bits: [5,5], name: { en: "BG2 window 1 enable", de: "BG2 Window 1 aktiv" }, values: { 0: { en: "off", de: "aus" }, 1: { en: "on", de: "an" } } },
    { bits: [4,4], name: { en: "BG2 window 1 invert", de: "BG2 Window 1 invertiert" }, values: { 0: { en: "inside", de: "innen" }, 1: { en: "outside", de: "außen" } } },
    { bits: [3,3], name: { en: "BG1 window 2 enable", de: "BG1 Window 2 aktiv" }, values: { 0: { en: "off", de: "aus" }, 1: { en: "on", de: "an" } } },
    { bits: [2,2], name: { en: "BG1 window 2 invert", de: "BG1 Window 2 invertiert" }, values: { 0: { en: "inside", de: "innen" }, 1: { en: "outside", de: "außen" } } },
    { bits: [1,1], name: { en: "BG1 window 1 enable", de: "BG1 Window 1 aktiv" }, values: { 0: { en: "off", de: "aus" }, 1: { en: "on", de: "an" } } },
    { bits: [0,0], name: { en: "BG1 window 1 invert", de: "BG1 Window 1 invertiert" }, values: { 0: { en: "inside", de: "innen" }, 1: { en: "outside", de: "außen" } } }
  ],
  warnings: [
    { level: "info", en: "Enabling a window here only marks the area — TMW/TSW decide whether masking actually applies on main/sub screen.",
      de: "Ein Window hier zu aktivieren markiert nur den Bereich — TMW/TSW entscheiden, ob die Maskierung auf Main-/Sub-Screen wirklich greift." }
  ]
},

{ addr: 0x2124, mnem: "W34SEL", group: "window", access: "W", size: 8, timing: "anytime",
  title: { en: "Window mask settings BG3/BG4", de: "Window-Masken BG3/BG4" },
  desc: { en: "Same layout as W12SEL, for BG3 (low nibble) and BG4 (high nibble).", de: "Gleicher Aufbau wie W12SEL, für BG3 (Low-Nibble) und BG4 (High-Nibble)." },
  fields: [
    { bits: [7,7], name: { en: "BG4 window 2 enable", de: "BG4 Window 2 aktiv" }, values: { 0: { en: "off", de: "aus" }, 1: { en: "on", de: "an" } } },
    { bits: [6,6], name: { en: "BG4 window 2 invert", de: "BG4 Window 2 invertiert" }, values: { 0: { en: "inside", de: "innen" }, 1: { en: "outside", de: "außen" } } },
    { bits: [5,5], name: { en: "BG4 window 1 enable", de: "BG4 Window 1 aktiv" }, values: { 0: { en: "off", de: "aus" }, 1: { en: "on", de: "an" } } },
    { bits: [4,4], name: { en: "BG4 window 1 invert", de: "BG4 Window 1 invertiert" }, values: { 0: { en: "inside", de: "innen" }, 1: { en: "outside", de: "außen" } } },
    { bits: [3,3], name: { en: "BG3 window 2 enable", de: "BG3 Window 2 aktiv" }, values: { 0: { en: "off", de: "aus" }, 1: { en: "on", de: "an" } } },
    { bits: [2,2], name: { en: "BG3 window 2 invert", de: "BG3 Window 2 invertiert" }, values: { 0: { en: "inside", de: "innen" }, 1: { en: "outside", de: "außen" } } },
    { bits: [1,1], name: { en: "BG3 window 1 enable", de: "BG3 Window 1 aktiv" }, values: { 0: { en: "off", de: "aus" }, 1: { en: "on", de: "an" } } },
    { bits: [0,0], name: { en: "BG3 window 1 invert", de: "BG3 Window 1 invertiert" }, values: { 0: { en: "inside", de: "innen" }, 1: { en: "outside", de: "außen" } } }
  ],
  warnings: []
},

{ addr: 0x2125, mnem: "WOBJSEL", group: "window", access: "W", size: 8, timing: "anytime",
  title: { en: "Window mask settings sprites & color window", de: "Window-Masken Sprites & Farb-Window" },
  desc: {
    en: "Window enables for sprites (low nibble) and for the COLOR window (high nibble). The color window gates where color math / fixed color applies — see CGWSEL.",
    de: "Window-Aktivierung für Sprites (Low-Nibble) und für das FARB-Window (High-Nibble). Das Farb-Window begrenzt, wo Color Math / Fixed Color wirkt — siehe CGWSEL."
  },
  fields: [
    { bits: [7,7], name: { en: "Color window 2 enable", de: "Farb-Window 2 aktiv" }, values: { 0: { en: "off", de: "aus" }, 1: { en: "on", de: "an" } } },
    { bits: [6,6], name: { en: "Color window 2 invert", de: "Farb-Window 2 invertiert" }, values: { 0: { en: "inside", de: "innen" }, 1: { en: "outside", de: "außen" } } },
    { bits: [5,5], name: { en: "Color window 1 enable", de: "Farb-Window 1 aktiv" }, values: { 0: { en: "off", de: "aus" }, 1: { en: "on", de: "an" } } },
    { bits: [4,4], name: { en: "Color window 1 invert", de: "Farb-Window 1 invertiert" }, values: { 0: { en: "inside", de: "innen" }, 1: { en: "outside", de: "außen" } } },
    { bits: [3,3], name: { en: "OBJ window 2 enable", de: "OBJ Window 2 aktiv" }, values: { 0: { en: "off", de: "aus" }, 1: { en: "on", de: "an" } } },
    { bits: [2,2], name: { en: "OBJ window 2 invert", de: "OBJ Window 2 invertiert" }, values: { 0: { en: "inside", de: "innen" }, 1: { en: "outside", de: "außen" } } },
    { bits: [1,1], name: { en: "OBJ window 1 enable", de: "OBJ Window 1 aktiv" }, values: { 0: { en: "off", de: "aus" }, 1: { en: "on", de: "an" } } },
    { bits: [0,0], name: { en: "OBJ window 1 invert", de: "OBJ Window 1 invertiert" }, values: { 0: { en: "inside", de: "innen" }, 1: { en: "outside", de: "außen" } } }
  ],
  warnings: []
},

{ addr: 0x2126, mnem: "WH0", group: "window", access: "W", size: 8, timing: "anytime",
  title: { en: "Window 1 left edge", de: "Window 1 linke Kante" },
  desc: { en: "Left X position of window 1 (0–255). HDMA on WH0/WH1 per scanline creates shaped masks: circles, wipes, flashlight cones.", de: "Linke X-Position von Window 1 (0–255). HDMA auf WH0/WH1 pro Scanline ergibt geformte Masken: Kreise, Wipes, Taschenlampen-Kegel." },
  fields: [ { bits: [7,0], name: { en: "X position", de: "X-Position" }, fmt: { type: "raw", label: { en: "pixels from left", de: "Pixel von links" } } } ],
  warnings: [
    { level: "info", en: "If left > right, the window is empty (nothing masked).", de: "Wenn links > rechts, ist das Window leer (nichts maskiert)." }
  ]
},

{ addr: 0x2127, mnem: "WH1", group: "window", access: "W", size: 8, timing: "anytime",
  title: { en: "Window 1 right edge", de: "Window 1 rechte Kante" },
  desc: { en: "Right X position of window 1 (inclusive).", de: "Rechte X-Position von Window 1 (inklusive)." },
  fields: [ { bits: [7,0], name: { en: "X position", de: "X-Position" }, fmt: { type: "raw", label: { en: "pixels from left", de: "Pixel von links" } } } ],
  warnings: []
},

{ addr: 0x2128, mnem: "WH2", group: "window", access: "W", size: 8, timing: "anytime",
  title: { en: "Window 2 left edge", de: "Window 2 linke Kante" },
  desc: { en: "Left X position of window 2.", de: "Linke X-Position von Window 2." },
  fields: [ { bits: [7,0], name: { en: "X position", de: "X-Position" }, fmt: { type: "raw", label: { en: "pixels from left", de: "Pixel von links" } } } ],
  warnings: []
},

{ addr: 0x2129, mnem: "WH3", group: "window", access: "W", size: 8, timing: "anytime",
  title: { en: "Window 2 right edge", de: "Window 2 rechte Kante" },
  desc: { en: "Right X position of window 2 (inclusive).", de: "Rechte X-Position von Window 2 (inklusive)." },
  fields: [ { bits: [7,0], name: { en: "X position", de: "X-Position" }, fmt: { type: "raw", label: { en: "pixels from left", de: "Pixel von links" } } } ],
  warnings: []
},

{ addr: 0x212A, mnem: "WBGLOG", group: "window", access: "W", size: 8, timing: "anytime",
  title: { en: "Window combine logic for BGs", de: "Window-Verknüpfungslogik für BGs" },
  desc: { en: "How window 1 and 2 combine when BOTH are enabled for a BG layer.", de: "Wie Window 1 und 2 verknüpft werden, wenn BEIDE für eine BG-Ebene aktiv sind." },
  fields: [
    { bits: [7,6], name: { en: "BG4 logic", de: "BG4-Logik" },
      values: { 0: { en: "OR", de: "OR" }, 1: { en: "AND", de: "AND" }, 2: { en: "XOR", de: "XOR" }, 3: { en: "XNOR", de: "XNOR" } } },
    { bits: [5,4], name: { en: "BG3 logic", de: "BG3-Logik" },
      values: { 0: { en: "OR", de: "OR" }, 1: { en: "AND", de: "AND" }, 2: { en: "XOR", de: "XOR" }, 3: { en: "XNOR", de: "XNOR" } } },
    { bits: [3,2], name: { en: "BG2 logic", de: "BG2-Logik" },
      values: { 0: { en: "OR", de: "OR" }, 1: { en: "AND", de: "AND" }, 2: { en: "XOR", de: "XOR" }, 3: { en: "XNOR", de: "XNOR" } } },
    { bits: [1,0], name: { en: "BG1 logic", de: "BG1-Logik" },
      values: { 0: { en: "OR", de: "OR" }, 1: { en: "AND", de: "AND" }, 2: { en: "XOR", de: "XOR" }, 3: { en: "XNOR", de: "XNOR" } } }
  ],
  warnings: []
},

{ addr: 0x212B, mnem: "WOBJLOG", group: "window", access: "W", size: 8, timing: "anytime",
  title: { en: "Window combine logic for sprites & color", de: "Window-Verknüpfungslogik für Sprites & Farbe" },
  desc: { en: "Same logic selection for the OBJ layer and the color window.", de: "Gleiche Logik-Auswahl für die OBJ-Ebene und das Farb-Window." },
  fields: [
    { bits: [3,2], name: { en: "Color window logic", de: "Farb-Window-Logik" },
      values: { 0: { en: "OR", de: "OR" }, 1: { en: "AND", de: "AND" }, 2: { en: "XOR", de: "XOR" }, 3: { en: "XNOR", de: "XNOR" } } },
    { bits: [1,0], name: { en: "OBJ logic", de: "OBJ-Logik" },
      values: { 0: { en: "OR", de: "OR" }, 1: { en: "AND", de: "AND" }, 2: { en: "XOR", de: "XOR" }, 3: { en: "XNOR", de: "XNOR" } } }
  ],
  warnings: []
}

);
