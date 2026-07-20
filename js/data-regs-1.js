// SNES PPU registers $2100–$2114: display, OAM setup, BG mode/tilemaps, scrolling.
// Field bits: [hi, lo]. fmt types: raw | shl | plus1 | signed | fixed88.
window.SNES.registers.push(

{ addr: 0x2100, mnem: "INIDISP", group: "display", access: "W", size: 8, timing: "anytime",
  title: { en: "Display control: forced blank & brightness", de: "Display-Steuerung: Forced Blank & Helligkeit" },
  desc: {
    en: "The master switch of the PPU. Forced blank turns the screen output off completely and — crucially — unlocks VRAM/OAM/CGRAM for writing at any time. Brightness fades the whole picture in 16 steps (used for fade-in/fade-out everywhere).",
    de: "Der Hauptschalter der PPU. Forced Blank schaltet die Bildausgabe komplett ab und — entscheidend — gibt VRAM/OAM/CGRAM jederzeit zum Schreiben frei. Die Helligkeit blendet das ganze Bild in 16 Stufen (überall für Fade-in/Fade-out genutzt)."
  },
  fields: [
    { bits: [7,7], name: { en: "Forced blank", de: "Forced Blank" },
      values: { 0: { en: "Screen ON — normal rendering", de: "Bild AN — normales Rendering" },
                1: { en: "Screen OFF (black) — VRAM/OAM/CGRAM writable anytime", de: "Bild AUS (schwarz) — VRAM/OAM/CGRAM jederzeit beschreibbar" } } },
    { bits: [3,0], name: { en: "Brightness", de: "Helligkeit" },
      fmt: { type: "raw", label: { en: "0 = black … 15 = full brightness", de: "0 = schwarz … 15 = volle Helligkeit" } } }
  ],
  warnings: [
    { level: "warn", en: "Brightness 0 is NOT the same as forced blank: the PPU still renders and VRAM stays locked during active display.",
      de: "Helligkeit 0 ist NICHT dasselbe wie Forced Blank: die PPU rendert weiter und VRAM bleibt während des aktiven Bilds gesperrt." },
    { level: "info", en: "Write $8F at boot (blank + full brightness), load your graphics, then write $0F to turn the screen on.",
      de: "Beim Boot $8F schreiben (Blank + volle Helligkeit), Grafiken laden, dann $0F schreiben um das Bild einzuschalten." },
    { level: "warn", en: "Turning forced blank off mid-frame shows garbage for the rest of that frame; do it during VBlank.",
      de: "Forced Blank mitten im Frame auszuschalten zeigt für den Rest des Frames Müll; besser während VBlank." }
  ],
  lint: function (v) {
    var out = [];
    if ((v & 0x80) === 0 && (v & 0x0F) === 0)
      out.push({ level: "warn", en: "Screen is on but brightness 0 — looks black, yet VRAM is still locked. Did you mean $8x (forced blank)?",
                 de: "Bild ist an, aber Helligkeit 0 — sieht schwarz aus, VRAM bleibt trotzdem gesperrt. Meintest du $8x (Forced Blank)?" });
    if (v & 0x70)
      out.push({ level: "info", en: "Bits 4–6 are unused and ignored.", de: "Bits 4–6 sind ungenutzt und werden ignoriert." });
    return out;
  }
},

{ addr: 0x2101, mnem: "OBSEL", group: "oam", access: "W", size: 8, timing: "anytime",
  title: { en: "Sprite size & tile data location", de: "Sprite-Größe & Tile-Daten-Adresse" },
  desc: {
    en: "Chooses the two sprite sizes available this frame and where sprite tiles live in VRAM. Every sprite picks one of the two sizes via its size bit in the OAM high table.",
    de: "Wählt die zwei in diesem Frame verfügbaren Sprite-Größen und wo die Sprite-Tiles im VRAM liegen. Jedes Sprite wählt per Größen-Bit in der OAM-High-Table eine der beiden Größen."
  },
  fields: [
    { bits: [7,5], name: { en: "Size pair (small/large)", de: "Größenpaar (klein/groß)" },
      values: { 0: { en: "8×8 / 16×16", de: "8×8 / 16×16" },
                1: { en: "8×8 / 32×32", de: "8×8 / 32×32" },
                2: { en: "8×8 / 64×64", de: "8×8 / 64×64" },
                3: { en: "16×16 / 32×32", de: "16×16 / 32×32" },
                4: { en: "16×16 / 64×64", de: "16×16 / 64×64" },
                5: { en: "32×32 / 64×64", de: "32×32 / 64×64" },
                6: { en: "16×32 / 32×64 — undocumented!", de: "16×32 / 32×64 — undokumentiert!" },
                7: { en: "16×32 / 32×32 — undocumented!", de: "16×32 / 32×32 — undokumentiert!" } } },
    { bits: [4,3], name: { en: "Name select (2nd tile page gap)", de: "Name Select (Abstand 2. Tile-Seite)" },
      fmt: { type: "raw", label: { en: "tiles $100+ start (N+1)×$1000 words after the base", de: "Tiles ab $100 beginnen (N+1)×$1000 Wörter nach der Basis" } } },
    { bits: [2,0], name: { en: "Tile base address", de: "Tile-Basisadresse" },
      fmt: { type: "shl", n: 13, label: { en: "VRAM word address of sprite tiles", de: "VRAM-Wortadresse der Sprite-Tiles" } } }
  ],
  warnings: [
    { level: "warn", en: "Only these two sizes exist per frame — you cannot mix 8×8, 16×16 AND 32×32 sprites simultaneously.",
      de: "Nur diese zwei Größen existieren pro Frame — 8×8, 16×16 UND 32×32 gleichzeitig geht nicht." },
    { level: "info", en: "Sprite tiles are always 4bpp. A 16×16 sprite uses 4 tiles arranged from a 16×16 grid in VRAM (row stride 16 tiles).",
      de: "Sprite-Tiles sind immer 4bpp. Ein 16×16-Sprite nutzt 4 Tiles aus einem 16×16-Raster im VRAM (Zeilenabstand 16 Tiles)." }
  ],
  lint: function (v) {
    if ((v >> 5) >= 6)
      return [{ level: "warn", en: "Size pairs 6 and 7 are undocumented rectangular modes — they work on real hardware but some emulators get them wrong.",
                de: "Größenpaare 6 und 7 sind undokumentierte Rechteck-Modi — auf echter Hardware ok, aber manche Emulatoren machen es falsch." }];
    return [];
  }
},

{ addr: 0x2102, mnem: "OAMADDL", group: "oam", access: "W", size: 8, timing: "anytime",
  title: { en: "OAM address (low byte)", de: "OAM-Adresse (Low-Byte)" },
  desc: {
    en: "Sets the word address in OAM for subsequent OAMDATA writes/reads. Each sprite occupies 2 words in the low table, so sprite N starts at word address N×2.",
    de: "Setzt die Wortadresse im OAM für folgende OAMDATA-Writes/-Reads. Jedes Sprite belegt 2 Wörter in der Low-Table, Sprite N beginnt also bei Wortadresse N×2."
  },
  fields: [
    { bits: [7,0], name: { en: "OAM word address (bits 0–7)", de: "OAM-Wortadresse (Bits 0–7)" },
      fmt: { type: "raw", label: { en: "sprite index = value ÷ 2", de: "Sprite-Index = Wert ÷ 2" } } }
  ],
  warnings: [
    { level: "warn", en: "At the start of every VBlank the internal OAM address is reloaded from this register — set it right before writing, not once at boot.",
      de: "Zu Beginn jedes VBlank wird die interne OAM-Adresse aus diesem Register neu geladen — direkt vor dem Schreiben setzen, nicht einmalig beim Boot." }
  ]
},

{ addr: 0x2103, mnem: "OAMADDH", group: "oam", access: "W", size: 8, timing: "anytime",
  title: { en: "OAM address (high bit) & priority rotation", de: "OAM-Adresse (High-Bit) & Prioritätsrotation" },
  desc: {
    en: "Bit 0 selects the 32-byte high table (X position bit 8 + size bit for each sprite). Bit 7 enables priority rotation: sprite priority no longer starts at sprite 0 but at the sprite pointed to by the OAM address — used to cycle which sprites vanish when a scanline is overloaded.",
    de: "Bit 0 wählt die 32-Byte-High-Table (X-Positions-Bit 8 + Größen-Bit pro Sprite). Bit 7 aktiviert Prioritätsrotation: Die Sprite-Priorität beginnt nicht mehr bei Sprite 0, sondern beim per OAM-Adresse angewählten Sprite — so rotiert man, welche Sprites bei überladenen Scanlines verschwinden."
  },
  fields: [
    { bits: [7,7], name: { en: "Priority rotation", de: "Prioritätsrotation" },
      values: { 0: { en: "Off — sprite 0 always has highest priority", de: "Aus — Sprite 0 hat immer höchste Priorität" },
                1: { en: "On — highest priority = sprite at current OAM address", de: "An — höchste Priorität = Sprite an aktueller OAM-Adresse" } } },
    { bits: [0,0], name: { en: "OAM address bit 8 (table select)", de: "OAM-Adress-Bit 8 (Tabellenwahl)" },
      values: { 0: { en: "Low table (X, Y, tile, attributes)", de: "Low-Table (X, Y, Tile, Attribute)" },
                1: { en: "High table (X bit 8 + size, 2 bits per sprite)", de: "High-Table (X-Bit 8 + Größe, 2 Bits pro Sprite)" } } }
  ],
  warnings: [
    { level: "info", en: "Forgetting the high table is the classic 'sprite appears at x=256 / wrong size' bug — X bit 8 and the size bit live only here.",
      de: "Die High-Table zu vergessen ist der Klassiker hinter 'Sprite erscheint bei x=256 / falsche Größe' — X-Bit 8 und das Größen-Bit liegen nur hier." }
  ]
},

{ addr: 0x2104, mnem: "OAMDATA", group: "oam", access: "W2", size: 8, timing: "vblank",
  title: { en: "OAM data write", de: "OAM-Daten schreiben" },
  desc: {
    en: "Writes one byte to OAM at the current address, which then auto-increments. Low-table writes are latched in PAIRS: the first byte is buffered and both bytes are committed on the second write. High-table writes go through immediately. In practice almost everyone updates OAM via DMA from a WRAM shadow buffer instead of writing this by hand.",
    de: "Schreibt ein Byte ins OAM an der aktuellen Adresse, die danach automatisch hochzählt. Low-Table-Writes werden PAARWEISE gelatcht: das erste Byte wird gepuffert, beide erst beim zweiten Write übernommen. High-Table-Writes gehen sofort durch. Praktisch aktualisiert fast jeder OAM per DMA aus einem WRAM-Schattenpuffer statt hier von Hand zu schreiben."
  },
  fields: [
    { bits: [7,0], name: { en: "Data byte", de: "Datenbyte" },
      fmt: { type: "raw", label: { en: "meaning depends on OAM position (X, Y, tile#, attributes)", de: "Bedeutung hängt von der OAM-Position ab (X, Y, Tile-Nr., Attribute)" } } }
  ],
  warnings: [
    { level: "err", en: "Writes during active display corrupt whatever sprite the PPU is currently fetching. Only write during VBlank or forced blank.",
      de: "Writes während des aktiven Bilds korrumpieren das Sprite, das die PPU gerade holt. Nur während VBlank oder Forced Blank schreiben." },
    { level: "warn", en: "Odd number of low-table writes = last byte never committed (pair latch). Always write pairs.",
      de: "Ungerade Anzahl Low-Table-Writes = letztes Byte wird nie übernommen (Paar-Latch). Immer paarweise schreiben." },
    { level: "info", en: "Standard pattern: build sprites in a 544-byte WRAM buffer, then DMA it to OAMDATA every VBlank.",
      de: "Standardmuster: Sprites in einem 544-Byte-WRAM-Puffer aufbauen, dann jedes VBlank per DMA nach OAMDATA schieben." }
  ]
},

{ addr: 0x2105, mnem: "BGMODE", group: "bgmode", access: "W", size: 8, timing: "anytime",
  title: { en: "BG mode & tile sizes", de: "BG-Modus & Tile-Größen" },
  desc: {
    en: "THE central graphics decision: which background mode runs, how many layers you get and at what color depth. Mode 1 is what the vast majority of games use. Bits 4–7 switch each BG between 8×8 and 16×16 tiles.",
    de: "DIE zentrale Grafik-Entscheidung: welcher Background-Modus läuft, wie viele Ebenen es gibt und mit welcher Farbtiefe. Mode 1 nutzen die allermeisten Spiele. Bits 4–7 schalten jeden BG zwischen 8×8- und 16×16-Tiles um."
  },
  fields: [
    { bits: [7,7], name: { en: "BG4 tile size", de: "BG4-Tile-Größe" },
      values: { 0: { en: "8×8", de: "8×8" }, 1: { en: "16×16", de: "16×16" } } },
    { bits: [6,6], name: { en: "BG3 tile size", de: "BG3-Tile-Größe" },
      values: { 0: { en: "8×8", de: "8×8" }, 1: { en: "16×16", de: "16×16" } } },
    { bits: [5,5], name: { en: "BG2 tile size", de: "BG2-Tile-Größe" },
      values: { 0: { en: "8×8", de: "8×8" }, 1: { en: "16×16", de: "16×16" } } },
    { bits: [4,4], name: { en: "BG1 tile size", de: "BG1-Tile-Größe" },
      values: { 0: { en: "8×8", de: "8×8" }, 1: { en: "16×16", de: "16×16" } } },
    { bits: [3,3], name: { en: "BG3 priority (Mode 1)", de: "BG3-Priorität (Mode 1)" },
      values: { 0: { en: "BG3 behind BG1/BG2", de: "BG3 hinter BG1/BG2" },
                1: { en: "High-priority BG3 tiles in FRONT of everything (HUD trick)", de: "BG3-Tiles mit Priorität VOR allem (HUD-Trick)" } } },
    { bits: [2,0], name: { en: "BG mode", de: "BG-Modus" },
      values: {
        0: { en: "Mode 0 — 4 layers, 2bpp each (4 colors/tile), own palette block per BG", de: "Mode 0 — 4 Ebenen, je 2bpp (4 Farben/Tile), eigener Palettenblock pro BG" },
        1: { en: "Mode 1 — BG1+BG2 4bpp (16 col), BG3 2bpp — the standard mode", de: "Mode 1 — BG1+BG2 4bpp (16 Farben), BG3 2bpp — der Standardmodus" },
        2: { en: "Mode 2 — BG1+BG2 4bpp with offset-per-tile scrolling", de: "Mode 2 — BG1+BG2 4bpp mit Offset-per-Tile-Scrolling" },
        3: { en: "Mode 3 — BG1 8bpp (256 col), BG2 4bpp", de: "Mode 3 — BG1 8bpp (256 Farben), BG2 4bpp" },
        4: { en: "Mode 4 — BG1 8bpp, BG2 2bpp, offset-per-tile", de: "Mode 4 — BG1 8bpp, BG2 2bpp, Offset-per-Tile" },
        5: { en: "Mode 5 — BG1 4bpp, BG2 2bpp, 512px hires", de: "Mode 5 — BG1 4bpp, BG2 2bpp, 512px Hires" },
        6: { en: "Mode 6 — BG1 4bpp, 512px hires, offset-per-tile", de: "Mode 6 — BG1 4bpp, 512px Hires, Offset-per-Tile" },
        7: { en: "Mode 7 — one 8bpp layer with rotation/scaling", de: "Mode 7 — eine 8bpp-Ebene mit Rotation/Skalierung" } } }
  ],
  warnings: [
    { level: "info", en: "Mode 1 with bit 3 set ($09) is the most common value in commercial games: two 16-color layers + a 2bpp HUD layer on top.",
      de: "Mode 1 mit gesetztem Bit 3 ($09) ist der häufigste Wert in kommerziellen Spielen: zwei 16-Farben-Ebenen + eine 2bpp-HUD-Ebene obendrauf." },
    { level: "warn", en: "Switching modes mid-frame is possible (HDMA) but the PPU needs the scanline to settle — expect one glitched line.",
      de: "Modus-Wechsel mitten im Frame geht (HDMA), aber die PPU braucht die Scanline zum Einschwingen — eine Glitch-Zeile einplanen." }
  ],
  lint: function (v) {
    var m = v & 7, out = [];
    if (m === 7) out.push({ level: "info", en: "Mode 7: only BG1 exists (plus EXTBG via SETINI). Scroll registers switch to M7HOFS/M7VOFS behavior; tile size bits are ignored.",
                            de: "Mode 7: nur BG1 existiert (plus EXTBG über SETINI). Scroll-Register wechseln zu M7HOFS/M7VOFS-Verhalten; Tile-Größen-Bits werden ignoriert." });
    if (m === 5 || m === 6) out.push({ level: "info", en: "Hires modes force 16×8 tiles minimum and halve the effective sprite resolution — sprites stay 256-wide.",
                                       de: "Hires-Modi erzwingen mindestens 16×8-Tiles und halbieren die effektive Sprite-Auflösung — Sprites bleiben 256 breit." });
    if (m !== 1 && (v & 8)) out.push({ level: "info", en: "Bit 3 (BG3 priority) only matters in Mode 1.",
                                       de: "Bit 3 (BG3-Priorität) wirkt nur in Mode 1." });
    return out;
  }
},

{ addr: 0x2106, mnem: "MOSAIC", group: "bgmode", access: "W", size: 8, timing: "anytime",
  title: { en: "Mosaic pixelation", de: "Mosaik-Verpixelung" },
  desc: {
    en: "The famous 'pixelate' effect (boss defeated, screen transition). Each enabled BG is drawn in blocks of (size+1)×(size+1) pixels. Often animated via HDMA for the classic wipe.",
    de: "Der berühmte 'Verpixelungs'-Effekt (Boss besiegt, Bildübergang). Jeder aktivierte BG wird in Blöcken von (Größe+1)×(Größe+1) Pixeln gezeichnet. Für den klassischen Wipe oft per HDMA animiert."
  },
  fields: [
    { bits: [7,4], name: { en: "Block size", de: "Blockgröße" },
      fmt: { type: "plus1", label: { en: "pixel block edge (1–16 px)", de: "Pixelblock-Kante (1–16 px)" } } },
    { bits: [3,3], name: { en: "BG4 mosaic", de: "BG4-Mosaik" }, values: { 0: { en: "off", de: "aus" }, 1: { en: "on", de: "an" } } },
    { bits: [2,2], name: { en: "BG3 mosaic", de: "BG3-Mosaik" }, values: { 0: { en: "off", de: "aus" }, 1: { en: "on", de: "an" } } },
    { bits: [1,1], name: { en: "BG2 mosaic", de: "BG2-Mosaik" }, values: { 0: { en: "off", de: "aus" }, 1: { en: "on", de: "an" } } },
    { bits: [0,0], name: { en: "BG1 mosaic", de: "BG1-Mosaik" }, values: { 0: { en: "off", de: "aus" }, 1: { en: "on", de: "an" } } }
  ],
  warnings: [
    { level: "info", en: "Mosaic does not apply to sprites — only backgrounds.",
      de: "Mosaik wirkt nicht auf Sprites — nur auf Backgrounds." }
  ]
},

{ addr: 0x2107, mnem: "BG1SC", group: "bgmode", access: "W", size: 8, timing: "anytime",
  title: { en: "BG1 tilemap address & size", de: "BG1-Tilemap-Adresse & Größe" },
  desc: {
    en: "Where BG1's tilemap sits in VRAM and how big it is. The tilemap is the grid of tile numbers + attributes; each 32×32 screen costs $400 words of VRAM.",
    de: "Wo die BG1-Tilemap im VRAM liegt und wie groß sie ist. Die Tilemap ist das Raster aus Tile-Nummern + Attributen; jeder 32×32-Screen kostet $400 Wörter VRAM."
  },
  fields: [
    { bits: [7,2], name: { en: "Tilemap base", de: "Tilemap-Basis" },
      fmt: { type: "shl", n: 10, label: { en: "VRAM word address", de: "VRAM-Wortadresse" } } },
    { bits: [1,0], name: { en: "Tilemap size", de: "Tilemap-Größe" },
      values: { 0: { en: "32×32 tiles (1 screen)", de: "32×32 Tiles (1 Screen)" },
                1: { en: "64×32 (2 screens, horizontal)", de: "64×32 (2 Screens, horizontal)" },
                2: { en: "32×64 (2 screens, vertical)", de: "32×64 (2 Screens, vertikal)" },
                3: { en: "64×64 (4 screens)", de: "64×64 (4 Screens)" } } }
  ],
  warnings: [
    { level: "warn", en: "Overlapping tilemap and tile data in VRAM is legal and silent — and a classic cause of 'my map shows random tiles'.",
      de: "Tilemap und Tile-Daten dürfen sich im VRAM überlappen — die Hardware sagt nichts, aber es ist ein Klassiker hinter 'meine Map zeigt Zufalls-Tiles'." }
  ]
},

{ addr: 0x2108, mnem: "BG2SC", group: "bgmode", access: "W", size: 8, timing: "anytime",
  title: { en: "BG2 tilemap address & size", de: "BG2-Tilemap-Adresse & Größe" },
  desc: { en: "Same layout as BG1SC, for BG2.", de: "Gleicher Aufbau wie BG1SC, für BG2." },
  fields: [
    { bits: [7,2], name: { en: "Tilemap base", de: "Tilemap-Basis" },
      fmt: { type: "shl", n: 10, label: { en: "VRAM word address", de: "VRAM-Wortadresse" } } },
    { bits: [1,0], name: { en: "Tilemap size", de: "Tilemap-Größe" },
      values: { 0: { en: "32×32 tiles", de: "32×32 Tiles" }, 1: { en: "64×32", de: "64×32" },
                2: { en: "32×64", de: "32×64" }, 3: { en: "64×64", de: "64×64" } } }
  ],
  warnings: []
},

{ addr: 0x2109, mnem: "BG3SC", group: "bgmode", access: "W", size: 8, timing: "anytime",
  title: { en: "BG3 tilemap address & size", de: "BG3-Tilemap-Adresse & Größe" },
  desc: { en: "Same layout as BG1SC, for BG3 (the typical HUD layer in Mode 1).", de: "Gleicher Aufbau wie BG1SC, für BG3 (die typische HUD-Ebene in Mode 1)." },
  fields: [
    { bits: [7,2], name: { en: "Tilemap base", de: "Tilemap-Basis" },
      fmt: { type: "shl", n: 10, label: { en: "VRAM word address", de: "VRAM-Wortadresse" } } },
    { bits: [1,0], name: { en: "Tilemap size", de: "Tilemap-Größe" },
      values: { 0: { en: "32×32 tiles", de: "32×32 Tiles" }, 1: { en: "64×32", de: "64×32" },
                2: { en: "32×64", de: "32×64" }, 3: { en: "64×64", de: "64×64" } } }
  ],
  warnings: []
},

{ addr: 0x210A, mnem: "BG4SC", group: "bgmode", access: "W", size: 8, timing: "anytime",
  title: { en: "BG4 tilemap address & size", de: "BG4-Tilemap-Adresse & Größe" },
  desc: { en: "Same layout as BG1SC, for BG4 (only exists in Mode 0).", de: "Gleicher Aufbau wie BG1SC, für BG4 (existiert nur in Mode 0)." },
  fields: [
    { bits: [7,2], name: { en: "Tilemap base", de: "Tilemap-Basis" },
      fmt: { type: "shl", n: 10, label: { en: "VRAM word address", de: "VRAM-Wortadresse" } } },
    { bits: [1,0], name: { en: "Tilemap size", de: "Tilemap-Größe" },
      values: { 0: { en: "32×32 tiles", de: "32×32 Tiles" }, 1: { en: "64×32", de: "64×32" },
                2: { en: "32×64", de: "32×64" }, 3: { en: "64×64", de: "64×64" } } }
  ],
  warnings: []
},

{ addr: 0x210B, mnem: "BG12NBA", group: "bgmode", access: "W", size: 8, timing: "anytime",
  title: { en: "BG1/BG2 tile data base address", de: "BG1/BG2-Tile-Daten-Basisadresse" },
  desc: {
    en: "Where the actual tile graphics (character data) for BG1 and BG2 start in VRAM, in steps of $1000 words (8 KB).",
    de: "Wo die eigentlichen Tile-Grafiken (Character-Daten) für BG1 und BG2 im VRAM beginnen, in Schritten von $1000 Wörtern (8 KB)."
  },
  fields: [
    { bits: [7,4], name: { en: "BG2 tile base", de: "BG2-Tile-Basis" },
      fmt: { type: "shl", n: 12, label: { en: "VRAM word address", de: "VRAM-Wortadresse" } } },
    { bits: [3,0], name: { en: "BG1 tile base", de: "BG1-Tile-Basis" },
      fmt: { type: "shl", n: 12, label: { en: "VRAM word address", de: "VRAM-Wortadresse" } } }
  ],
  warnings: [
    { level: "info", en: "A 4bpp tile costs 16 words; from one base you can address 1024 tiles (4bpp). Tile numbers in the tilemap are relative to this base.",
      de: "Ein 4bpp-Tile kostet 16 Wörter; von einer Basis aus sind 1024 Tiles (4bpp) adressierbar. Tile-Nummern in der Tilemap sind relativ zu dieser Basis." }
  ]
},

{ addr: 0x210C, mnem: "BG34NBA", group: "bgmode", access: "W", size: 8, timing: "anytime",
  title: { en: "BG3/BG4 tile data base address", de: "BG3/BG4-Tile-Daten-Basisadresse" },
  desc: { en: "Same as BG12NBA, for BG3 (low nibble) and BG4 (high nibble).", de: "Wie BG12NBA, für BG3 (Low-Nibble) und BG4 (High-Nibble)." },
  fields: [
    { bits: [7,4], name: { en: "BG4 tile base", de: "BG4-Tile-Basis" },
      fmt: { type: "shl", n: 12, label: { en: "VRAM word address", de: "VRAM-Wortadresse" } } },
    { bits: [3,0], name: { en: "BG3 tile base", de: "BG3-Tile-Basis" },
      fmt: { type: "shl", n: 12, label: { en: "VRAM word address", de: "VRAM-Wortadresse" } } }
  ],
  warnings: []
}

);

// BG scroll registers — all share the same write-twice mechanics.
(function () {
  var scrollWarnings = [
    { level: "warn", en: "Write-twice register: two consecutive 8-bit writes form the value (low byte first). It shares an internal latch with the other BGnHOFS/VOFS registers — an NMI/IRQ writing any scroll register between your two writes desyncs everything.",
      de: "Write-Twice-Register: zwei aufeinanderfolgende 8-Bit-Writes ergeben den Wert (Low-Byte zuerst). Es teilt sich ein internes Latch mit den anderen BGnHOFS/VOFS-Registern — ein NMI/IRQ, der zwischen deinen zwei Writes irgendein Scroll-Register beschreibt, bringt alles durcheinander." },
    { level: "info", en: "Only 10 bits are used (0–1023). Values wrap around the tilemap.",
      de: "Nur 10 Bits werden genutzt (0–1023). Werte wickeln über die Tilemap herum." }
  ];
  var defs = [
    [0x210D, "BG1HOFS", { en: "BG1 horizontal scroll", de: "BG1 horizontales Scrolling" },
      { en: "Horizontal scroll offset of BG1 in pixels. In Mode 7 this register doubles as M7HOFS (13-bit signed).",
        de: "Horizontaler Scroll-Offset von BG1 in Pixeln. In Mode 7 fungiert dieses Register zugleich als M7HOFS (13-Bit signed)." }],
    [0x210E, "BG1VOFS", { en: "BG1 vertical scroll", de: "BG1 vertikales Scrolling" },
      { en: "Vertical scroll offset of BG1. Note: the visible first line is VOFS+1 — many engines write desired_y-1. In Mode 7 doubles as M7VOFS.",
        de: "Vertikaler Scroll-Offset von BG1. Achtung: sichtbar ist ab VOFS+1 — viele Engines schreiben gewünschtes_y-1. In Mode 7 zugleich M7VOFS." }],
    [0x210F, "BG2HOFS", { en: "BG2 horizontal scroll", de: "BG2 horizontales Scrolling" }, null],
    [0x2110, "BG2VOFS", { en: "BG2 vertical scroll", de: "BG2 vertikales Scrolling" }, null],
    [0x2111, "BG3HOFS", { en: "BG3 horizontal scroll", de: "BG3 horizontales Scrolling" }, null],
    [0x2112, "BG3VOFS", { en: "BG3 vertical scroll", de: "BG3 vertikales Scrolling" }, null],
    [0x2113, "BG4HOFS", { en: "BG4 horizontal scroll", de: "BG4 horizontales Scrolling" }, null],
    [0x2114, "BG4VOFS", { en: "BG4 vertical scroll", de: "BG4 vertikales Scrolling" }, null]
  ];
  defs.forEach(function (d) {
    window.SNES.registers.push({
      addr: d[0], mnem: d[1], group: "scroll", access: "W2", size: 16, timing: "anytime",
      title: d[2],
      desc: d[3] || { en: "Scroll offset in pixels for this layer. Write-twice: low byte, then high byte. HDMA on scroll registers is the standard way to do parallax, wavy screens and line-scroll effects.",
                      de: "Scroll-Offset in Pixeln für diese Ebene. Write-Twice: Low-Byte, dann High-Byte. HDMA auf Scroll-Register ist der Standardweg für Parallax, Wabbel-Effekte und Line-Scrolling." },
      fields: [
        { bits: [9,0], name: { en: "Scroll offset (px)", de: "Scroll-Offset (px)" },
          fmt: { type: "raw", label: { en: "pixels; wraps at tilemap edge", de: "Pixel; wickelt an der Tilemap-Kante" } } }
      ],
      warnings: scrollWarnings
    });
  });
})();
