// SNES Inspector — core data: groups, hardware limits, UI strings.
// All human-readable text is bilingual: { en: "...", de: "..." }.
window.SNES = {
  meta: { id: "snes", name: "SNES", features: { layers: true, planner: true, memmap: true } },
  registers: [],   // filled by data-regs-*.js
  groups: [
    { id: "display",   name: { en: "Display Control",        de: "Display-Steuerung" } },
    { id: "bgmode",    name: { en: "BG Mode & Tilemaps",     de: "BG-Modus & Tilemaps" } },
    { id: "scroll",    name: { en: "Scrolling",              de: "Scrolling" } },
    { id: "vram",      name: { en: "VRAM Access",            de: "VRAM-Zugriff" } },
    { id: "mode7",     name: { en: "Mode 7",                 de: "Mode 7" } },
    { id: "oam",       name: { en: "Sprites / OAM",          de: "Sprites / OAM" } },
    { id: "cgram",     name: { en: "Colors / CGRAM",         de: "Farben / CGRAM" } },
    { id: "window",    name: { en: "Windows / Masking",      de: "Windows / Maskierung" } },
    { id: "screens",   name: { en: "Screen Designation",     de: "Screen-Zuordnung" } },
    { id: "colormath", name: { en: "Color Math",             de: "Color Math" } },
    { id: "status",    name: { en: "Status & Counters (read)", de: "Status & Zähler (lesen)" } },
    { id: "wram",      name: { en: "WRAM Port",               de: "WRAM-Port" } },
    { id: "dma",       name: { en: "DMA / HDMA",              de: "DMA / HDMA" } },
    { id: "apu",       name: { en: "APU Ports (Sound)",       de: "APU-Ports (Sound)" } },
    { id: "cpuio",     name: { en: "CPU I/O: IRQ, Timer, Math", de: "CPU-I/O: IRQ, Timer, Mathe" } },
    { id: "joy",       name: { en: "Joypads",                 de: "Joypads" } }
  ],

  // Common timing rules, referenced by registers via `timing` key.
  timings: {
    anytime: {
      icon: "🟢",
      en: "Safe to write at any time. For per-scanline (raster) effects, write during HBlank or via HDMA.",
      de: "Kann jederzeit beschrieben werden. Für Raster-Effekte (pro Scanline) während HBlank oder per HDMA schreiben."
    },
    vblank: {
      icon: "🔴",
      en: "Only writable during VBlank or forced blank (INIDISP bit 7 = 1). Writes during active display are IGNORED or corrupt data — this is the #1 source of garbled graphics.",
      de: "Nur während VBlank oder Forced Blank (INIDISP Bit 7 = 1) beschreibbar. Schreibzugriffe während des aktiven Bilds werden IGNORIERT oder korrumpieren Daten — die häufigste Ursache für Grafikmüll."
    },
    vblank_cgram: {
      icon: "🟡",
      en: "Intended for VBlank/forced blank, but CGRAM writes during HBlank mostly work too (classic raster gradient trick). Writing mid-scanline glitches the current pixel colors.",
      de: "Gedacht für VBlank/Forced Blank, aber CGRAM-Writes während HBlank funktionieren meist auch (klassischer Raster-Gradient-Trick). Schreiben mitten in der Scanline stört die aktuellen Pixelfarben."
    },
    read_vblank: {
      icon: "🔵",
      en: "Reading is only reliable during VBlank or forced blank; reads during active display return garbage.",
      de: "Lesen ist nur während VBlank oder Forced Blank zuverlässig; Lesen während des aktiven Bilds liefert Müll."
    },
    read_any: {
      icon: "🔵",
      en: "Readable at any time.",
      de: "Kann jederzeit gelesen werden."
    },
    dma_setup: {
      icon: "🟡",
      en: "Configure while the channel is idle. For general DMA that's any time before setting the MDMAEN bit; for HDMA, set everything up during VBlank before enabling HDMAEN — reconfiguring a live HDMA channel glitches the current frame.",
      de: "Konfigurieren, solange der Kanal inaktiv ist. Bei General-DMA: jederzeit vor dem Setzen des MDMAEN-Bits; bei HDMA alles während VBlank einrichten, bevor HDMAEN aktiviert wird — einen laufenden HDMA-Kanal umzukonfigurieren zerstört das aktuelle Frame."
    }
  },

  limits: [
    { cat: { en: "Memory", de: "Speicher" }, rows: [
      { name: { en: "VRAM (video memory)", de: "VRAM (Videospeicher)" }, val: "64 KB (32K words)",
        note: { en: "Holds all tiles + tilemaps. Word-addressed ($0000–$7FFF). Every BG char base / tilemap base register points in here.",
                de: "Enthält alle Tiles + Tilemaps. Wort-adressiert ($0000–$7FFF). Alle BG-Char-Base-/Tilemap-Base-Register zeigen hierauf." } },
      { name: { en: "CGRAM (palette)", de: "CGRAM (Palette)" }, val: "512 B = 256 × 15-bit",
        note: { en: "256 colors on screen at once, each 15-bit BGR (32768 possible).",
                de: "256 Farben gleichzeitig, je 15-Bit BGR (32768 möglich)." } },
      { name: { en: "OAM (sprite table)", de: "OAM (Sprite-Tabelle)" }, val: "544 B",
        note: { en: "128 sprites × 4 bytes + 32-byte high table (X bit 8 + size bit).",
                de: "128 Sprites × 4 Bytes + 32-Byte-High-Table (X-Bit 8 + Größen-Bit)." } },
      { name: { en: "WRAM (work RAM)", de: "WRAM (Arbeitsspeicher)" }, val: "128 KB",
        note: { en: "$7E0000–$7FFFFF; first 8 KB mirrored into every bank at $0000–$1FFF.",
                de: "$7E0000–$7FFFFF; die ersten 8 KB in jeder Bank bei $0000–$1FFF gespiegelt." } }
    ]},
    { cat: { en: "Sprites (OBJ)", de: "Sprites (OBJ)" }, rows: [
      { name: { en: "Total sprites", de: "Sprites gesamt" }, val: "128",
        note: { en: "Fixed OAM table. No more, ever.", de: "Feste OAM-Tabelle. Mehr geht nie." } },
      { name: { en: "Sprites per scanline", de: "Sprites pro Scanline" }, val: "32",
        note: { en: "The 33rd+ sprite on a line is dropped; sets STAT77 bit 6 (range over).",
                de: "Ab dem 33. Sprite pro Zeile wird verworfen; setzt STAT77 Bit 6 (Range Over)." } },
      { name: { en: "Sprite tiles per scanline", de: "Sprite-Tiles pro Scanline" }, val: "34 × 8px slivers",
        note: { en: "Max 34 8-pixel-wide tile slices per line (= 272 px). Further tiles are dropped (lowest-priority first) and STAT77 bit 7 is set (time over).",
                de: "Max. 34 je 8 Pixel breite Tile-Streifen pro Zeile (= 272 px). Überschreitung verwirft Tiles und setzt STAT77 Bit 7 (Time Over)." } },
      { name: { en: "Sprite sizes", de: "Sprite-Größen" }, val: "2 per frame",
        note: { en: "Only the two sizes chosen in OBSEL are available simultaneously (e.g. 8×8 + 16×16).",
                de: "Nur die zwei in OBSEL gewählten Größen sind gleichzeitig verfügbar (z. B. 8×8 + 16×16)." } },
      { name: { en: "Sprite colors", de: "Sprite-Farben" }, val: "15 + transparent",
        note: { en: "Always 4bpp, palettes 8–15 (CGRAM 128–255). Color math only affects sprites using palettes 12–15.",
                de: "Immer 4bpp, Paletten 8–15 (CGRAM 128–255). Color Math wirkt nur auf Sprites mit Paletten 12–15." } }
    ]},
    { cat: { en: "Backgrounds", de: "Hintergründe" }, rows: [
      { name: { en: "BG layers", de: "BG-Ebenen" }, val: "max 4",
        note: { en: "Only Mode 0 has 4 layers (2bpp each). Mode 1 (most games): two 4bpp + one 2bpp. Mode 7: one layer.",
                de: "Nur Mode 0 hat 4 Ebenen (je 2bpp). Mode 1 (meiste Spiele): zwei 4bpp + eine 2bpp. Mode 7: eine Ebene." } },
      { name: { en: "Tilemap size", de: "Tilemap-Größe" }, val: "max 64×64 tiles",
        note: { en: "32×32, 64×32, 32×64 or 64×64 tiles of 8×8 (or 16×16) px per BG.",
                de: "32×32, 64×32, 32×64 oder 64×64 Tiles à 8×8 (oder 16×16) px pro BG." } },
      { name: { en: "Mode 7 playfield", de: "Mode-7-Spielfeld" }, val: "128×128 tiles = 1024×1024 px",
        note: { en: "Single 8bpp layer, rotation/scaling via matrix M7A–M7D. Tilemap and tiles interleaved in VRAM low/high bytes.",
                de: "Eine 8bpp-Ebene, Rotation/Skalierung über Matrix M7A–M7D. Tilemap und Tiles in VRAM-Low-/High-Bytes verschränkt." } },
      { name: { en: "Resolution", de: "Auflösung" }, val: "256×224 (239)",
        note: { en: "256×224 NTSC standard, 239 lines with overscan (SETINI). 512-wide hires in Modes 5/6, 448 interlaced.",
                de: "256×224 NTSC-Standard, 239 Zeilen mit Overscan (SETINI). 512 Breite in Mode 5/6, 448 interlaced." } }
    ]},
    { cat: { en: "Bandwidth & timing", de: "Bandbreite & Timing" }, rows: [
      { name: { en: "DMA channels", de: "DMA-Kanäle" }, val: "8",
        note: { en: "General DMA and HDMA share the same 8 channels ($43x0–$43xA).",
                de: "General-DMA und HDMA teilen sich dieselben 8 Kanäle ($43x0–$43xA)." } },
      { name: { en: "DMA speed", de: "DMA-Geschwindigkeit" }, val: "1 byte / ~1.34 MHz cycle",
        note: { en: "≈ 2.68 MB/s. One NTSC VBlank (no overscan) fits roughly 4–6 KB of DMA — budget your VRAM updates!",
                de: "≈ 2,68 MB/s. In einen NTSC-VBlank (ohne Overscan) passen grob 4–6 KB DMA — VRAM-Updates budgetieren!" } },
      { name: { en: "CPU speed", de: "CPU-Takt" }, val: "3.58 / 2.68 MHz",
        note: { en: "65816 @ 3.58 MHz (FastROM) or 2.68 MHz (SlowROM area); 1.79 MHz for controller port access.",
                de: "65816 @ 3,58 MHz (FastROM) oder 2,68 MHz (SlowROM-Bereich); 1,79 MHz bei Controller-Port-Zugriff." } },
      { name: { en: "WRAM→WRAM DMA", de: "WRAM→WRAM-DMA" }, val: { en: "impossible", de: "unmöglich" },
        note: { en: "DMA cannot copy WRAM to WRAM (both sides would need the A-bus). Use the CPU or bounce via $2180.",
                de: "DMA kann nicht WRAM nach WRAM kopieren (beide Seiten bräuchten den A-Bus). CPU nutzen oder über $2180 gehen." } }
    ]},
    { cat: { en: "Classic pitfalls", de: "Klassische Fallstricke" }, rows: [
      { name: { en: "Write-twice registers", de: "Write-Twice-Register" }, val: "BGnHOFS/VOFS, M7x, CGDATA, OAMDATA",
        note: { en: "Two 8-bit writes = one value. An interrupt writing the same register between your two writes desyncs the latch — write these with interrupts in mind.",
                de: "Zwei 8-Bit-Writes = ein Wert. Ein Interrupt, der dasselbe Register zwischen deinen zwei Writes beschreibt, bringt das Latch aus dem Takt — beim Schreiben an Interrupts denken." } },
      { name: { en: "VRAM prefetch buffer", de: "VRAM-Prefetch-Puffer" }, val: "1 dummy read",
        note: { en: "After setting VMADD, the first read of RDVRAML/H returns stale buffered data. Do one dummy read first.",
                de: "Nach dem Setzen von VMADD liefert der erste Read von RDVRAML/H alte gepufferte Daten. Erst einen Dummy-Read machen." } },
      { name: { en: "Open bus", de: "Open Bus" }, val: "$21xx reads",
        note: { en: "Reading write-only PPU registers doesn't error — it returns leftover bus garbage that *sometimes* looks plausible. The hardware never reports errors; wrong writes just silently do nothing or trash data.",
                de: "Write-only-PPU-Register zu lesen gibt keinen Fehler — es kommt Bus-Müll zurück, der *manchmal* plausibel aussieht. Die Hardware meldet nie Fehler; falsche Writes tun einfach still nichts oder zerstören Daten." } },
      { name: { en: "OAM address reset", de: "OAM-Adress-Reset" }, val: { en: "every frame", de: "jedes Frame" },
        note: { en: "The OAM address is reloaded from OAMADD at the start of VBlank — mid-frame OAM writes land somewhere unexpected.",
                de: "Die OAM-Adresse wird zu VBlank-Beginn aus OAMADD neu geladen — OAM-Writes mitten im Frame landen woanders." } }
    ]}
  ],

  overview: {
    title: { en: "What can you even write to on a SNES?", de: "Wohin kann man auf dem SNES überhaupt schreiben?" },
    p1: { en: "The 65816 CPU talks to the rest of the console through memory-mapped registers: writing to special addresses IS the hardware API. Pick a register on the left, type the value you're about to send, and see exactly what it means, what the hardware will do with it, and which limits you're about to hit.",
          de: "Die 65816-CPU spricht mit dem Rest der Konsole über memory-mapped Register: das Schreiben an Spezialadressen IST die Hardware-API. Links ein Register wählen, den Wert eintippen, den man senden will, und genau sehen, was er bedeutet, was die Hardware damit macht und welche Limits man gleich reißt." },
    p2: { en: "Important mindset: the SNES never reports errors. A write at the wrong time is silently dropped; a read from a write-only port returns bus garbage. The yellow/red boxes on each register page tell you when that happens — they are the error messages the hardware never gives you.",
          de: "Wichtiges Mindset: das SNES meldet nie Fehler. Ein Write zum falschen Zeitpunkt wird still verworfen; ein Read von einem Write-only-Port liefert Bus-Müll. Die gelben/roten Boxen auf jeder Registerseite sagen dir, wann das passiert — sie sind die Fehlermeldungen, die die Hardware dir nie gibt." },
    cards: [
      { rng: "$2100–$213F", h: { en: "PPU — graphics", de: "PPU — Grafik" },
        p: { en: "Layers, sprites, scrolling, colors, windows, Mode 7. Fully covered here.", de: "Ebenen, Sprites, Scrolling, Farben, Windows, Mode 7. Hier vollständig abgedeckt." } },
      { rng: "$2140–$2143", h: { en: "APU ports — sound", de: "APU-Ports — Sound" },
        p: { en: "4 mailbox bytes to the SPC700 sound CPU, which runs its own program. Covered here.", de: "4 Mailbox-Bytes zur SPC700-Sound-CPU, die ihr eigenes Programm fährt. Hier abgedeckt." } },
      { rng: "$2180–$2183", h: { en: "WRAM port", de: "WRAM-Port" },
        p: { en: "Sequential access to the 128 KB work RAM, mainly as a DMA target. Covered here.", de: "Sequenzieller Zugriff aufs 128-KB-WRAM, v. a. als DMA-Ziel. Hier abgedeckt." } },
      { rng: "$4200–$421F", h: { en: "CPU I/O", de: "CPU-I/O" },
        p: { en: "NMI/IRQ enable, joypad auto-read, H/V timers, hardware mul/div. Covered here.", de: "NMI/IRQ-Enable, Joypad-Auto-Read, H/V-Timer, Hardware-Mul/Div. Hier abgedeckt." } },
      { rng: "$4300–$437F", h: { en: "DMA / HDMA", de: "DMA / HDMA" },
        p: { en: "8 channels that move data to the PPU fast — and per scanline (HDMA). Covered here.", de: "8 Kanäle, die Daten schnell zur PPU schieben — auch pro Scanline (HDMA). Hier abgedeckt." } },
      { rng: "$7E–$7F", h: { en: "WRAM banks", de: "WRAM-Bänke" },
        p: { en: "The 128 KB of work RAM, mapped as full banks $7E0000–$7FFFFF.", de: "Die 128 KB Arbeitsspeicher, gemappt als volle Bänke $7E0000–$7FFFFF." } }
    ],
    hint: { en: "Start with INIDISP → BGMODE → TM — that chain turns a screen on.",
            de: "Starte mit INIDISP → BGMODE → TM — diese Kette schaltet ein Bild an." }
  },

  ui: {
    tagline:      { en: "hardware register reference & simulator", de: "Hardware-Register-Referenz & Simulator" },
    nav_overview: { en: "Overview", de: "Übersicht" },
    nav_layers:   { en: "Layer view", de: "Layer-Ansicht" },
    nav_planner:  { en: "Setup planner", de: "Setup-Planer" },
    nav_memory:   { en: "Memory map", de: "Speicher-Karte" },
    nav_limits:   { en: "Hardware limits", de: "Hardware-Limits" },
    search_ph:    { en: "Search registers… (name, $addr, keyword)", de: "Register suchen… (Name, $Adresse, Stichwort)" },
    sim_title:    { en: "Value simulator — what am I sending?", de: "Wert-Simulator — was sende ich gerade?" },
    hex_label:    { en: "Value", de: "Wert" },
    decoded_lbl:  { en: "Decoded — this write means:", de: "Dekodiert — dieser Write bedeutet:" },
    fields_sec:   { en: "Bit fields", de: "Bit-Felder" },
    warnings_sec: { en: "Pitfalls & hardware behavior", de: "Fallstricke & Hardware-Verhalten" },
    timing_lbl:   { en: "Write timing", de: "Schreib-Timing" },
    access_W:     { en: "write-only", de: "nur schreiben" },
    access_R:     { en: "read-only", de: "nur lesen" },
    access_W2:    { en: "write twice (low, high)", de: "zweimal schreiben (Low, High)" },
    access_R2:    { en: "read twice (low, high)", de: "zweimal lesen (Low, High)" },
    prev_reg:     { en: "previous", de: "vorheriges" },
    next_reg:     { en: "next", de: "nächstes" },
    no_results:   { en: "No registers match.", de: "Keine Register gefunden." },
    bits_word:    { en: "bits", de: "Bits" },
    bit_word:     { en: "bit", de: "Bit" },
    raw_val:      { en: "raw value", de: "Rohwert" }
  }
};
