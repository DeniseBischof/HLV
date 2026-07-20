// Game Boy (DMG) system data — same schema as the SNES database.
// I/O registers live at $FF00–$FF4B (+ IE at $FFFF).
window.GB = {
  meta: { id: "gb", name: "Game Boy", features: { layers: true } },

  groups: [
    { id: "lcd",    name: { en: "LCD Control & Status",  de: "LCD-Steuerung & Status" } },
    { id: "scroll", name: { en: "Scrolling & Window",    de: "Scrolling & Window" } },
    { id: "pal",    name: { en: "Palettes",              de: "Paletten" } },
    { id: "dmagrp", name: { en: "OAM DMA",               de: "OAM-DMA" } },
    { id: "timer",  name: { en: "Timer & Divider",       de: "Timer & Divider" } },
    { id: "int",    name: { en: "Interrupts",            de: "Interrupts" } },
    { id: "joy",    name: { en: "Joypad",                de: "Joypad" } }
  ],

  timings: {
    anytime: {
      icon: "🟢",
      en: "Safe to write at any time.",
      de: "Kann jederzeit beschrieben werden."
    },
    gb_vram: {
      icon: "🔴",
      en: "VRAM ($8000–$9FFF) is only accessible while the LCD is off or the PPU is in modes 0–2 (not mode 3, 'drawing'). Writes during mode 3 are ignored, reads return $FF. Check STAT or use VBlank.",
      de: "VRAM ($8000–$9FFF) ist nur zugreifbar, wenn das LCD aus ist oder die PPU in Mode 0–2 steckt (nicht Mode 3, 'Drawing'). Writes in Mode 3 werden ignoriert, Reads liefern $FF. STAT prüfen oder VBlank nutzen."
    },
    gb_lcd_off: {
      icon: "🟡",
      en: "Changing this mid-frame takes effect immediately and can glitch the current scanline — cleanest during VBlank. Turning the LCD off is ONLY allowed during VBlank (outside it you can damage real DMG hardware!).",
      de: "Änderungen mitten im Frame wirken sofort und können die aktuelle Scanline glitchen — am saubersten im VBlank. Das LCD ausschalten ist NUR im VBlank erlaubt (außerhalb kann echte DMG-Hardware Schaden nehmen!)."
    },
    read_any: {
      icon: "🔵",
      en: "Readable at any time.",
      de: "Kann jederzeit gelesen werden."
    }
  },

  registers: [

  { addr: 0xFF40, mnem: "LCDC", group: "lcd", access: "W", size: 8, timing: "gb_lcd_off",
    title: { en: "LCD control — the master register", de: "LCD-Steuerung — das Hauptregister" },
    desc: {
      en: "Turns the LCD on/off and wires up the whole picture: which tilemaps BG and window use, where the tile data lives, sprite size, and what is enabled at all. The Game Boy equivalent of INIDISP + BGMODE + TM in one byte.",
      de: "Schaltet das LCD an/aus und verdrahtet das ganze Bild: welche Tilemaps BG und Window nutzen, wo die Tile-Daten liegen, Sprite-Größe, und was überhaupt aktiv ist. Das Game-Boy-Äquivalent von INIDISP + BGMODE + TM in einem Byte."
    },
    fields: [
      { bits: [7,7], name: { en: "LCD enable", de: "LCD an" },
        values: { 0: { en: "off — screen blank, VRAM freely accessible", de: "aus — Bild leer, VRAM frei zugreifbar" }, 1: { en: "on", de: "an" } } },
      { bits: [6,6], name: { en: "Window tilemap", de: "Window-Tilemap" },
        values: { 0: { en: "$9800", de: "$9800" }, 1: { en: "$9C00", de: "$9C00" } } },
      { bits: [5,5], name: { en: "Window enable", de: "Window aktiv" },
        values: { 0: { en: "off", de: "aus" }, 1: { en: "on", de: "an" } } },
      { bits: [4,4], name: { en: "BG/Window tile data", de: "BG/Window-Tile-Daten" },
        values: { 0: { en: "$8800 area, SIGNED tile numbers ($9000 base)", de: "$8800-Bereich, SIGNED Tile-Nummern (Basis $9000)" },
                  1: { en: "$8000 area, unsigned tile numbers", de: "$8000-Bereich, unsigned Tile-Nummern" } } },
      { bits: [3,3], name: { en: "BG tilemap", de: "BG-Tilemap" },
        values: { 0: { en: "$9800", de: "$9800" }, 1: { en: "$9C00", de: "$9C00" } } },
      { bits: [2,2], name: { en: "Sprite size", de: "Sprite-Größe" },
        values: { 0: { en: "8×8", de: "8×8" }, 1: { en: "8×16 (tile number's bit 0 ignored)", de: "8×16 (Bit 0 der Tile-Nummer wird ignoriert)" } } },
      { bits: [1,1], name: { en: "Sprites enable", de: "Sprites aktiv" },
        values: { 0: { en: "hidden", de: "versteckt" }, 1: { en: "visible", de: "sichtbar" } } },
      { bits: [0,0], name: { en: "BG/Window enable", de: "BG/Window aktiv" },
        values: { 0: { en: "BG & window blank (white) — DMG", de: "BG & Window leer (weiß) — DMG" }, 1: { en: "on", de: "an" } } }
    ],
    warnings: [
      { level: "err", en: "Never turn the LCD off (bit 7 → 0) outside VBlank — real DMG hardware can be physically damaged.",
        de: "Das LCD nie außerhalb von VBlank ausschalten (Bit 7 → 0) — echte DMG-Hardware kann physisch Schaden nehmen." },
      { level: "warn", en: "The signed/unsigned tile addressing (bit 4) is THE classic GB confusion: with bit 4 = 0, tile 0 sits at $9000 and tiles 128–255 are −128…−1.",
        de: "Die signed/unsigned-Tile-Adressierung (Bit 4) ist DIE klassische GB-Verwirrung: Mit Bit 4 = 0 liegt Tile 0 bei $9000 und Tiles 128–255 sind −128…−1." }
    ],
    lint: function (v) {
      var out = [];
      if (!(v & 0x80)) out.push({ level: "info", en: "LCD off: perfect moment to copy tiles/maps — but remember to re-enable during VBlank timing.",
                                  de: "LCD aus: perfekter Moment, um Tiles/Maps zu kopieren — aber ans Wieder-Einschalten denken." });
      if ((v & 0x20) && !(v & 0x01)) out.push({ level: "warn", en: "Window enabled but bit 0 = 0: on DMG the window is blanked too — nothing will show.",
                                                de: "Window aktiv, aber Bit 0 = 0: Auf dem DMG ist damit auch das Window leer — es wird nichts angezeigt." });
      return out;
    }
  },

  { addr: 0xFF41, mnem: "STAT", group: "lcd", access: "W", size: 8, timing: "anytime",
    title: { en: "LCD status & STAT interrupt sources", de: "LCD-Status & STAT-Interrupt-Quellen" },
    desc: {
      en: "Lower bits (read-only) tell you what the PPU is doing right now — mode 3 means VRAM is locked. Upper bits choose which conditions fire the STAT interrupt (LYC match, HBlank, VBlank, OAM scan). The raster-effect workhorse.",
      de: "Die unteren Bits (nur lesbar) sagen, was die PPU gerade tut — Mode 3 heißt VRAM gesperrt. Die oberen Bits wählen, welche Bedingungen den STAT-Interrupt feuern (LYC-Match, HBlank, VBlank, OAM-Scan). Das Arbeitstier für Raster-Effekte."
    },
    fields: [
      { bits: [6,6], name: { en: "Interrupt on LYC == LY", de: "Interrupt bei LYC == LY" }, values: { 0: { en: "off", de: "aus" }, 1: { en: "on", de: "an" } } },
      { bits: [5,5], name: { en: "Interrupt on mode 2 (OAM scan)", de: "Interrupt bei Mode 2 (OAM-Scan)" }, values: { 0: { en: "off", de: "aus" }, 1: { en: "on", de: "an" } } },
      { bits: [4,4], name: { en: "Interrupt on mode 1 (VBlank)", de: "Interrupt bei Mode 1 (VBlank)" }, values: { 0: { en: "off", de: "aus" }, 1: { en: "on", de: "an" } } },
      { bits: [3,3], name: { en: "Interrupt on mode 0 (HBlank)", de: "Interrupt bei Mode 0 (HBlank)" }, values: { 0: { en: "off", de: "aus" }, 1: { en: "on", de: "an" } } },
      { bits: [2,2], name: { en: "LYC == LY flag (read-only)", de: "LYC == LY-Flag (nur lesen)" }, values: { 0: { en: "no", de: "nein" }, 1: { en: "match", de: "Treffer" } } },
      { bits: [1,0], name: { en: "PPU mode (read-only)", de: "PPU-Modus (nur lesen)" },
        values: { 0: { en: "0 — HBlank (VRAM+OAM free)", de: "0 — HBlank (VRAM+OAM frei)" },
                  1: { en: "1 — VBlank (everything free)", de: "1 — VBlank (alles frei)" },
                  2: { en: "2 — OAM scan (OAM locked)", de: "2 — OAM-Scan (OAM gesperrt)" },
                  3: { en: "3 — drawing (VRAM+OAM locked)", de: "3 — Drawing (VRAM+OAM gesperrt)" } } }
    ],
    warnings: [
      { level: "warn", en: "DMG hardware bug: writing STAT while the PPU is in mode 0/1 (or on LYC match) can trigger a spurious STAT interrupt — some games rely on it, most just get bitten.",
        de: "DMG-Hardware-Bug: STAT schreiben, während die PPU in Mode 0/1 ist (oder bei LYC-Match), kann einen falschen STAT-Interrupt auslösen — manche Spiele nutzen das, die meisten stolpern nur darüber." }
    ]
  },

  { addr: 0xFF44, mnem: "LY", group: "lcd", access: "R", size: 8, timing: "read_any",
    title: { en: "Current scanline (0–153)", de: "Aktuelle Scanline (0–153)" },
    desc: { en: "Which line the PPU is on. 0–143 = visible, 144–153 = VBlank. The classic busy-wait: loop until LY = 144.", de: "Auf welcher Zeile die PPU gerade ist. 0–143 = sichtbar, 144–153 = VBlank. Das klassische Busy-Wait: warten bis LY = 144." },
    fields: [ { bits: [7,0], name: { en: "Line", de: "Zeile" }, fmt: { type: "raw", label: { en: "144–153 = VBlank", de: "144–153 = VBlank" } } } ],
    warnings: []
  },

  { addr: 0xFF45, mnem: "LYC", group: "lcd", access: "W", size: 8, timing: "anytime",
    title: { en: "Scanline compare for STAT interrupt", de: "Scanline-Vergleich für STAT-Interrupt" },
    desc: { en: "When LY reaches this value and STAT bit 6 is set, the STAT interrupt fires — the Game Boy's way to split the screen at an exact line (status bars!).", de: "Erreicht LY diesen Wert und STAT Bit 6 ist gesetzt, feuert der STAT-Interrupt — der Game-Boy-Weg, das Bild an einer exakten Zeile zu teilen (Statusleisten!)." },
    fields: [ { bits: [7,0], name: { en: "Compare line", de: "Vergleichszeile" }, fmt: { type: "raw" } } ],
    warnings: []
  },

  { addr: 0xFF42, mnem: "SCY", group: "scroll", access: "W", size: 8, timing: "anytime",
    title: { en: "BG scroll Y", de: "BG-Scroll Y" },
    desc: { en: "Vertical scroll of the 256×256 BG map behind the 160×144 viewport. Wraps around. Change per scanline (STAT/HBlank interrupt) for wavy effects.", de: "Vertikales Scrolling der 256×256-BG-Map hinter dem 160×144-Sichtfenster. Wickelt um. Pro Scanline ändern (STAT-/HBlank-Interrupt) für Wabbel-Effekte." },
    fields: [ { bits: [7,0], name: { en: "Y offset (px)", de: "Y-Offset (px)" }, fmt: { type: "raw" } } ],
    warnings: []
  },

  { addr: 0xFF43, mnem: "SCX", group: "scroll", access: "W", size: 8, timing: "anytime",
    title: { en: "BG scroll X", de: "BG-Scroll X" },
    desc: { en: "Horizontal scroll of the BG map. The lower 3 bits shift pixels within a tile and cost mode-3 time.", de: "Horizontales Scrolling der BG-Map. Die unteren 3 Bits verschieben pixelweise innerhalb eines Tiles und kosten Mode-3-Zeit." },
    fields: [ { bits: [7,0], name: { en: "X offset (px)", de: "X-Offset (px)" }, fmt: { type: "raw" } } ],
    warnings: []
  },

  { addr: 0xFF4A, mnem: "WY", group: "scroll", access: "W", size: 8, timing: "anytime",
    title: { en: "Window Y position", de: "Window-Y-Position" },
    desc: { en: "Screen line where the window (a second, non-scrolling BG layer — perfect for HUDs) starts.", de: "Bildzeile, ab der das Window (eine zweite, nicht scrollende BG-Ebene — perfekt für HUDs) beginnt." },
    fields: [ { bits: [7,0], name: { en: "Start line", de: "Startzeile" }, fmt: { type: "raw" } } ],
    warnings: []
  },

  { addr: 0xFF4B, mnem: "WX", group: "scroll", access: "W", size: 8, timing: "anytime",
    title: { en: "Window X position (+7!)", de: "Window-X-Position (+7!)" },
    desc: { en: "Horizontal window start MINUS SEVEN: WX = 7 is the left screen edge. The +7 offset is the most famous Game Boy pitfall.", de: "Horizontaler Window-Start MINUS SIEBEN: WX = 7 ist der linke Bildrand. Der +7-Offset ist der berühmteste Game-Boy-Fallstrick." },
    fields: [ { bits: [7,0], name: { en: "X position + 7", de: "X-Position + 7" }, fmt: { type: "raw", label: { en: "7 = left edge, 166 = off-screen", de: "7 = linker Rand, 166 = außerhalb" } } } ],
    warnings: [
      { level: "warn", en: "WX values 1–6 glitch on DMG hardware (pixel shifts, dropped window). Use 7+ or hide the window via LCDC bit 5.",
        de: "WX-Werte 1–6 glitchen auf DMG-Hardware (Pixelverschiebungen, Window fällt aus). 7+ nutzen oder das Window über LCDC Bit 5 verstecken." }
    ],
    lint: function (v) {
      if (v > 0 && v < 7) return [{ level: "warn", en: "0 < WX < 7 = hardware glitch zone.", de: "0 < WX < 7 = Hardware-Glitch-Zone." }];
      return [];
    }
  },

  { addr: 0xFF47, mnem: "BGP", group: "pal", access: "W", size: 8, timing: "anytime",
    title: { en: "BG palette (shade mapping)", de: "BG-Palette (Grauton-Zuordnung)" },
    desc: {
      en: "Maps the 4 tile color numbers to the 4 LCD shades, 2 bits each: bits 0–1 = color 0 … bits 6–7 = color 3 (0 = white … 3 = black). $E4 = identity. Rewrite it for instant fade effects — no palette RAM involved.",
      de: "Ordnet die 4 Tile-Farbnummern den 4 LCD-Graustufen zu, je 2 Bits: Bits 0–1 = Farbe 0 … Bits 6–7 = Farbe 3 (0 = weiß … 3 = schwarz). $E4 = Identität. Umschreiben ergibt sofortige Fade-Effekte — ganz ohne Paletten-RAM."
    },
    fields: [
      { bits: [7,6], name: { en: "Shade for color 3", de: "Grauton für Farbe 3" }, values: { 0: { en: "white", de: "weiß" }, 1: { en: "light gray", de: "hellgrau" }, 2: { en: "dark gray", de: "dunkelgrau" }, 3: { en: "black", de: "schwarz" } } },
      { bits: [5,4], name: { en: "Shade for color 2", de: "Grauton für Farbe 2" }, values: { 0: { en: "white", de: "weiß" }, 1: { en: "light gray", de: "hellgrau" }, 2: { en: "dark gray", de: "dunkelgrau" }, 3: { en: "black", de: "schwarz" } } },
      { bits: [3,2], name: { en: "Shade for color 1", de: "Grauton für Farbe 1" }, values: { 0: { en: "white", de: "weiß" }, 1: { en: "light gray", de: "hellgrau" }, 2: { en: "dark gray", de: "dunkelgrau" }, 3: { en: "black", de: "schwarz" } } },
      { bits: [1,0], name: { en: "Shade for color 0", de: "Grauton für Farbe 0" }, values: { 0: { en: "white", de: "weiß" }, 1: { en: "light gray", de: "hellgrau" }, 2: { en: "dark gray", de: "dunkelgrau" }, 3: { en: "black", de: "schwarz" } } }
    ],
    warnings: []
  },

  { addr: 0xFF48, mnem: "OBP0", group: "pal", access: "W", size: 8, timing: "anytime",
    title: { en: "Sprite palette 0", de: "Sprite-Palette 0" },
    desc: { en: "Like BGP, but for sprites using palette 0. Color 0 is ALWAYS transparent for sprites — only 3 usable shades.", de: "Wie BGP, aber für Sprites mit Palette 0. Farbe 0 ist bei Sprites IMMER transparent — nur 3 nutzbare Töne." },
    fields: [
      { bits: [7,6], name: { en: "Shade for color 3", de: "Grauton für Farbe 3" }, fmt: { type: "raw", label: { en: "0–3", de: "0–3" } } },
      { bits: [5,4], name: { en: "Shade for color 2", de: "Grauton für Farbe 2" }, fmt: { type: "raw", label: { en: "0–3", de: "0–3" } } },
      { bits: [3,2], name: { en: "Shade for color 1", de: "Grauton für Farbe 1" }, fmt: { type: "raw", label: { en: "0–3", de: "0–3" } } },
      { bits: [1,0], name: { en: "(color 0 = transparent)", de: "(Farbe 0 = transparent)" }, fmt: { type: "raw" } }
    ],
    warnings: []
  },

  { addr: 0xFF49, mnem: "OBP1", group: "pal", access: "W", size: 8, timing: "anytime",
    title: { en: "Sprite palette 1", de: "Sprite-Palette 1" },
    desc: { en: "Second sprite palette; each sprite picks OBP0 or OBP1 via OAM attribute bit 4.", de: "Zweite Sprite-Palette; jedes Sprite wählt OBP0 oder OBP1 über OAM-Attribut-Bit 4." },
    fields: [
      { bits: [7,6], name: { en: "Shade for color 3", de: "Grauton für Farbe 3" }, fmt: { type: "raw", label: { en: "0–3", de: "0–3" } } },
      { bits: [5,4], name: { en: "Shade for color 2", de: "Grauton für Farbe 2" }, fmt: { type: "raw", label: { en: "0–3", de: "0–3" } } },
      { bits: [3,2], name: { en: "Shade for color 1", de: "Grauton für Farbe 1" }, fmt: { type: "raw", label: { en: "0–3", de: "0–3" } } },
      { bits: [1,0], name: { en: "(color 0 = transparent)", de: "(Farbe 0 = transparent)" }, fmt: { type: "raw" } }
    ],
    warnings: []
  },

  { addr: 0xFF46, mnem: "DMA", group: "dmagrp", access: "W", size: 8, timing: "anytime",
    title: { en: "OAM DMA — sprite table upload", de: "OAM-DMA — Sprite-Tabellen-Upload" },
    desc: {
      en: "Writing $XX copies 160 bytes from $XX00–$XX9F into OAM ($FE00). Takes ~160 µs, during which the CPU can ONLY access HRAM ($FF80+) — that's why every game copies a tiny wait-loop routine into HRAM and calls it there.",
      de: "Das Schreiben von $XX kopiert 160 Bytes von $XX00–$XX9F ins OAM ($FE00). Dauert ~160 µs, währenddessen kann die CPU NUR auf HRAM ($FF80+) zugreifen — deshalb kopiert jedes Spiel eine Mini-Warteschleifen-Routine ins HRAM und ruft sie dort auf."
    },
    fields: [ { bits: [7,0], name: { en: "Source page", de: "Quell-Seite" }, fmt: { type: "raw", label: { en: "source = value × $100 (e.g. $C0 → $C000)", de: "Quelle = Wert × $100 (z. B. $C0 → $C000)" } } } ],
    warnings: [
      { level: "err", en: "Calling this from ROM/WRAM without the HRAM routine crashes or corrupts — the bus is taken over during the copy.",
        de: "Aufruf aus ROM/WRAM ohne die HRAM-Routine crasht oder korrumpiert — der Bus ist während des Kopierens belegt." },
      { level: "info", en: "Standard pattern: shadow OAM buffer at $C000, DMA it every VBlank.",
        de: "Standardmuster: Schatten-OAM-Puffer bei $C000, jedes VBlank per DMA rüberschieben." }
    ]
  },

  { addr: 0xFF04, mnem: "DIV", group: "timer", access: "W", size: 8, timing: "anytime",
    title: { en: "Divider — free-running counter", de: "Divider — freilaufender Zähler" },
    desc: { en: "Increments at 16384 Hz, always. ANY write resets it to 0. Cheap entropy source for random numbers.", de: "Zählt immer mit 16384 Hz hoch. JEDER Write setzt ihn auf 0. Billige Zufallsquelle." },
    fields: [ { bits: [7,0], name: { en: "Counter", de: "Zähler" }, fmt: { type: "raw" } } ],
    warnings: [
      { level: "warn", en: "Resetting DIV can also tick TIMA once (falling-edge quirk in the timer circuit).",
        de: "DIV zurückzusetzen kann TIMA einmal mitticken lassen (Falling-Edge-Quirk in der Timer-Schaltung)." }
    ]
  },

  { addr: 0xFF05, mnem: "TIMA", group: "timer", access: "W", size: 8, timing: "anytime",
    title: { en: "Timer counter", de: "Timer-Zähler" },
    desc: { en: "Counts up at the TAC frequency. On overflow it reloads from TMA and requests the timer interrupt (IF bit 2).", de: "Zählt mit der TAC-Frequenz hoch. Beim Überlauf lädt er TMA nach und fordert den Timer-Interrupt an (IF Bit 2)." },
    fields: [ { bits: [7,0], name: { en: "Counter", de: "Zähler" }, fmt: { type: "raw" } } ],
    warnings: []
  },

  { addr: 0xFF06, mnem: "TMA", group: "timer", access: "W", size: 8, timing: "anytime",
    title: { en: "Timer reload value", de: "Timer-Nachladewert" },
    desc: { en: "Value TIMA restarts from after overflowing. Interrupt rate = TAC frequency ÷ (256 − TMA).", de: "Wert, ab dem TIMA nach dem Überlauf weiterzählt. Interrupt-Rate = TAC-Frequenz ÷ (256 − TMA)." },
    fields: [ { bits: [7,0], name: { en: "Reload value", de: "Nachladewert" }, fmt: { type: "raw" } } ],
    warnings: []
  },

  { addr: 0xFF07, mnem: "TAC", group: "timer", access: "W", size: 8, timing: "anytime",
    title: { en: "Timer control", de: "Timer-Steuerung" },
    desc: { en: "Enables the timer and picks the TIMA frequency.", de: "Aktiviert den Timer und wählt die TIMA-Frequenz." },
    fields: [
      { bits: [2,2], name: { en: "Timer enable", de: "Timer an" }, values: { 0: { en: "stopped", de: "gestoppt" }, 1: { en: "running", de: "läuft" } } },
      { bits: [1,0], name: { en: "Frequency", de: "Frequenz" },
        values: { 0: { en: "4096 Hz", de: "4096 Hz" }, 1: { en: "262144 Hz", de: "262144 Hz" },
                  2: { en: "65536 Hz", de: "65536 Hz" }, 3: { en: "16384 Hz", de: "16384 Hz" } } }
    ],
    warnings: []
  },

  { addr: 0xFF0F, mnem: "IF", group: "int", access: "W", size: 8, timing: "anytime",
    title: { en: "Interrupt request flags", de: "Interrupt-Anforderungs-Flags" },
    desc: { en: "Which interrupts are currently requested. The CPU services the lowest set bit that is also enabled in IE (and IME is on), then clears it. You can write it to fake or cancel requests.", de: "Welche Interrupts gerade angefordert sind. Die CPU bedient das niedrigste gesetzte Bit, das auch in IE aktiviert ist (und IME an), und löscht es dann. Schreiben kann Anforderungen faken oder verwerfen." },
    fields: [
      { bits: [4,4], name: { en: "Joypad", de: "Joypad" }, values: { 0: { en: "—", de: "—" }, 1: { en: "requested", de: "angefordert" } } },
      { bits: [3,3], name: { en: "Serial", de: "Seriell" }, values: { 0: { en: "—", de: "—" }, 1: { en: "requested", de: "angefordert" } } },
      { bits: [2,2], name: { en: "Timer", de: "Timer" }, values: { 0: { en: "—", de: "—" }, 1: { en: "requested", de: "angefordert" } } },
      { bits: [1,1], name: { en: "LCD STAT", de: "LCD STAT" }, values: { 0: { en: "—", de: "—" }, 1: { en: "requested", de: "angefordert" } } },
      { bits: [0,0], name: { en: "VBlank", de: "VBlank" }, values: { 0: { en: "—", de: "—" }, 1: { en: "requested", de: "angefordert" } } }
    ],
    warnings: []
  },

  { addr: 0xFFFF, mnem: "IE", group: "int", access: "W", size: 8, timing: "anytime",
    title: { en: "Interrupt enable", de: "Interrupt-Freigabe" },
    desc: { en: "Which interrupt sources are allowed at all (same bit layout as IF). Plus the global IME flag via EI/DI instructions.", de: "Welche Interrupt-Quellen überhaupt erlaubt sind (gleiches Bit-Layout wie IF). Dazu kommt das globale IME-Flag über die Befehle EI/DI." },
    fields: [
      { bits: [4,4], name: { en: "Joypad", de: "Joypad" }, values: { 0: { en: "off", de: "aus" }, 1: { en: "on", de: "an" } } },
      { bits: [3,3], name: { en: "Serial", de: "Seriell" }, values: { 0: { en: "off", de: "aus" }, 1: { en: "on", de: "an" } } },
      { bits: [2,2], name: { en: "Timer", de: "Timer" }, values: { 0: { en: "off", de: "aus" }, 1: { en: "on", de: "an" } } },
      { bits: [1,1], name: { en: "LCD STAT", de: "LCD STAT" }, values: { 0: { en: "off", de: "aus" }, 1: { en: "on", de: "an" } } },
      { bits: [0,0], name: { en: "VBlank", de: "VBlank" }, values: { 0: { en: "off", de: "aus" }, 1: { en: "on", de: "an" } } }
    ],
    warnings: []
  },

  { addr: 0xFF00, mnem: "P1", group: "joy", access: "W", size: 8, timing: "anytime",
    title: { en: "Joypad matrix (JOYP)", de: "Joypad-Matrix (JOYP)" },
    desc: {
      en: "The buttons sit in a 2×4 matrix: write bit 4 or 5 LOW to select a row, then read bits 0–3 — pressed buttons read as 0! Standard routine reads both rows and combines them into one byte.",
      de: "Die Tasten hängen in einer 2×4-Matrix: Bit 4 oder 5 auf LOW schreiben wählt eine Zeile, dann Bits 0–3 lesen — gedrückte Tasten lesen sich als 0! Die Standardroutine liest beide Zeilen und kombiniert sie zu einem Byte."
    },
    fields: [
      { bits: [5,5], name: { en: "Select action buttons (0 = selected!)", de: "Action-Tasten wählen (0 = gewählt!)" },
        values: { 0: { en: "row active: A/B/Select/Start on bits 0–3", de: "Zeile aktiv: A/B/Select/Start auf Bits 0–3" }, 1: { en: "row off", de: "Zeile aus" } } },
      { bits: [4,4], name: { en: "Select D-pad (0 = selected!)", de: "Steuerkreuz wählen (0 = gewählt!)" },
        values: { 0: { en: "row active: Right/Left/Up/Down on bits 0–3", de: "Zeile aktiv: Rechts/Links/Hoch/Runter auf Bits 0–3" }, 1: { en: "row off", de: "Zeile aus" } } },
      { bits: [3,0], name: { en: "Inputs (read; 0 = pressed)", de: "Eingaben (lesen; 0 = gedrückt)" }, fmt: { type: "raw" } }
    ],
    warnings: [
      { level: "warn", en: "Everything is inverted: 0 selects the row, 0 means pressed. Double-negation bugs are the norm here.",
        de: "Alles ist invertiert: 0 wählt die Zeile, 0 heißt gedrückt. Doppelte-Verneinungs-Bugs sind hier der Normalfall." }
    ]
  }

  ],

  limits: [
    { cat: { en: "Memory & video", de: "Speicher & Video" }, rows: [
      { name: { en: "Screen", de: "Bildschirm" }, val: "160×144",
        note: { en: "4 shades. The BG map is 256×256 with a scrolling viewport.", de: "4 Graustufen. Die BG-Map ist 256×256 mit scrollendem Sichtfenster." } },
      { name: { en: "VRAM", de: "VRAM" }, val: "8 KB",
        note: { en: "$8000–$9FFF: 384 tiles (DMG) + two 32×32 tilemaps. Locked during PPU mode 3.", de: "$8000–$9FFF: 384 Tiles (DMG) + zwei 32×32-Tilemaps. Während PPU-Mode 3 gesperrt." } },
      { name: { en: "WRAM / HRAM", de: "WRAM / HRAM" }, val: "8 KB / 127 B",
        note: { en: "HRAM ($FF80+) is the only memory usable during OAM DMA.", de: "HRAM ($FF80+) ist der einzige während OAM-DMA nutzbare Speicher." } },
      { name: { en: "Tiles", de: "Tiles" }, val: "8×8, 2bpp",
        note: { en: "16 bytes per tile, 4 colors. No per-tile flipping for DMG backgrounds (CGB adds it).", de: "16 Bytes pro Tile, 4 Farben. Kein Tile-Spiegeln im DMG-Background (CGB kann es)." } }
    ]},
    { cat: { en: "Sprites", de: "Sprites" }, rows: [
      { name: { en: "Total sprites", de: "Sprites gesamt" }, val: "40",
        note: { en: "OAM $FE00–$FE9F, 4 bytes each: Y+16, X+8, tile, attributes.", de: "OAM $FE00–$FE9F, je 4 Bytes: Y+16, X+8, Tile, Attribute." } },
      { name: { en: "Sprites per scanline", de: "Sprites pro Scanline" }, val: "10",
        note: { en: "The 11th+ on a line is dropped — the source of all Game Boy flicker.", de: "Ab dem 11. pro Zeile wird verworfen — die Quelle allen Game-Boy-Flackerns." } },
      { name: { en: "Sprite sizes", de: "Sprite-Größen" }, val: "8×8 or 8×16",
        note: { en: "One global choice (LCDC bit 2), not per sprite!", de: "Eine globale Wahl (LCDC Bit 2), nicht pro Sprite!" } },
      { name: { en: "Sprite colors", de: "Sprite-Farben" }, val: "3 + transparent",
        note: { en: "Two palettes (OBP0/1). Send-to-back via OAM attribute bit 7.", de: "Zwei Paletten (OBP0/1). Hinter den BG geht über OAM-Attribut-Bit 7." } }
    ]},
    { cat: { en: "Classic pitfalls", de: "Klassische Fallstricke" }, rows: [
      { name: { en: "WX offset", de: "WX-Offset" }, val: "+7",
        note: { en: "Window X = position + 7; values 1–6 glitch on hardware.", de: "Window-X = Position + 7; Werte 1–6 glitchen auf Hardware." } },
      { name: { en: "OAM DMA", de: "OAM-DMA" }, val: { en: "HRAM only", de: "nur HRAM" },
        note: { en: "During the 160 µs copy the CPU may only execute from HRAM.", de: "Während der 160-µs-Kopie darf die CPU nur aus HRAM laufen." } },
      { name: { en: "Signed tiles", de: "Signed-Tiles" }, val: "LCDC bit 4",
        note: { en: "With bit 4 = 0, tile numbers are signed around base $9000.", de: "Mit Bit 4 = 0 sind Tile-Nummern signed um Basis $9000." } },
      { name: { en: "LCD off", de: "LCD aus" }, val: { en: "VBlank only", de: "nur im VBlank" },
        note: { en: "Turning the LCD off outside VBlank can damage DMG hardware.", de: "LCD außerhalb von VBlank auszuschalten kann DMG-Hardware beschädigen." } }
    ]}
  ],

  overview: {
    title: { en: "What can you even write to on a Game Boy?", de: "Wohin kann man auf dem Game Boy überhaupt schreiben?" },
    p1: { en: "The Game Boy's LR35902 CPU controls everything through I/O registers at $FF00–$FF4B (plus IE at $FFFF) and the memory-mapped video RAM. Far fewer registers than the SNES — but every single bit counts twice.",
          de: "Die LR35902-CPU des Game Boy steuert alles über I/O-Register bei $FF00–$FF4B (plus IE bei $FFFF) und das memory-mapped Video-RAM. Deutlich weniger Register als beim SNES — dafür zählt jedes einzelne Bit doppelt." },
    p2: { en: "Same rule as on the SNES: no error messages, ever. VRAM writes during mode 3 vanish, OAM DMA from the wrong place crashes, WX 1–6 glitches. The warning boxes on each register page are your substitute for the error channel the hardware doesn't have.",
          de: "Gleiche Regel wie beim SNES: niemals Fehlermeldungen. VRAM-Writes in Mode 3 verschwinden, OAM-DMA vom falschen Ort crasht, WX 1–6 glitcht. Die Warnboxen auf jeder Registerseite ersetzen den Fehlerkanal, den die Hardware nicht hat." },
    cards: [
      { rng: "$8000–$9FFF", h: { en: "VRAM", de: "VRAM" },
        p: { en: "384 tiles + two 32×32 tilemaps. Locked while the PPU draws (mode 3).", de: "384 Tiles + zwei 32×32-Tilemaps. Gesperrt, während die PPU zeichnet (Mode 3)." } },
      { rng: "$FE00–$FE9F", h: { en: "OAM", de: "OAM" },
        p: { en: "40 sprites × 4 bytes. Best filled via OAM DMA ($FF46) every VBlank.", de: "40 Sprites × 4 Bytes. Am besten per OAM-DMA ($FF46) jedes VBlank befüllen." } },
      { rng: "$FF40–$FF4B", h: { en: "LCD & scrolling", de: "LCD & Scrolling" },
        p: { en: "LCDC, STAT, scroll, window, palettes — fully covered here.", de: "LCDC, STAT, Scroll, Window, Paletten — hier vollständig abgedeckt." } },
      { rng: "$FF04–$FF07", h: { en: "Timer", de: "Timer" },
        p: { en: "DIV, TIMA, TMA, TAC — covered here.", de: "DIV, TIMA, TMA, TAC — hier abgedeckt." } },
      { rng: "$FF10–$FF3F", h: { en: "Sound (APU)", de: "Sound (APU)" },
        p: { en: "4 channels: 2 pulse, wave, noise. (Planned)", de: "4 Kanäle: 2 Pulse, Wave, Noise. (Geplant)" } },
      { rng: "$FF0F / $FFFF", h: { en: "Interrupts", de: "Interrupts" },
        p: { en: "IF and IE — covered here.", de: "IF und IE — hier abgedeckt." } }
    ],
    hint: { en: "Start with LCDC → BGP → SCX/SCY — that chain shows a picture.",
            de: "Starte mit LCDC → BGP → SCX/SCY — diese Kette zeigt ein Bild." }
  }
};
