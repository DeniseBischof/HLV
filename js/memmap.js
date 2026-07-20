/* SNES Inspector — memory map: a zoomable "island map" of every SNES memory,
   the bridges between them (CPU bus, B bus, DMA), clickable detail panels,
   and animated "journeys" that walk a datum across the map. */
(function () {
  "use strict";
  var timer = null, dotRaf = null;

  function lang() { return localStorage.getItem("snesLang") || "en"; }
  function L(t) { if (t == null) return ""; if (typeof t === "string") return t; return t[lang()] != null ? t[lang()] : t.en; }
  function esc(s) { return String(s).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;"); }

  var T = {
    title: { en: "Memory map — who lives where, and how data travels", de: "Speicher-Karte — wer wohnt wo, und wie reisen die Daten" },
    intro: { en: "The confusing truth: the SNES doesn't have ONE memory. The CPU sees ROM and WRAM; the PPU guards its own VRAM, CGRAM and OAM; the APU has a whole private computer. Data crosses between the islands only over the bridges shown here. Click any island for details, or start a journey below and watch a datum travel.",
             de: "Die verwirrende Wahrheit: Das SNES hat nicht EINEN Speicher. Die CPU sieht ROM und WRAM; die PPU bewacht ihr eigenes VRAM, CGRAM und OAM; die APU hat einen komplett privaten Computer. Daten wechseln nur über die eingezeichneten Brücken zwischen den Inseln. Klicke eine Insel für Details, oder starte unten eine Reise und sieh einem Datum beim Wandern zu." },
    journeys: { en: "Journeys — watch data travel", de: "Reisen — Daten beim Wandern zusehen" },
    stop: { en: "⏹ Stop", de: "⏹ Stopp" },
    idle: { en: "Pick a journey above and watch the data travel across the map, step by step.", de: "Wähle oben eine Reise und sieh den Daten beim Wandern über die Karte zu, Schritt für Schritt." },
    step: { en: "Step", de: "Schritt" },
    clickHint: { en: "Click an island or bridge label for details. Drag to pan, buttons to zoom.", de: "Insel anklicken für Details. Ziehen zum Verschieben, Buttons zum Zoomen." },
    yourSetup: { en: "your planner blocks", de: "deine Planer-Blöcke" }
  };

  // ---------- nodes ----------
  var NODES = {
    cpu:   { x: 15,  y: 50,  w: 220, h: 420, frame: true, title: { en: "CPU address space (65816)", de: "CPU-Adressraum (65816)" } },
    rom:   { x: 30,  y: 95,  w: 190, h: 130, color: "var(--f3)", title: "ROM", sub: { en: "your game, in banks", de: "dein Spiel, in Bänken" } },
    wram:  { x: 30,  y: 250, w: 190, h: 110, color: "var(--f2)", title: "WRAM · 128 KB", sub: { en: "variables & shadow buffers", de: "Variablen & Schattenpuffer" } },
    regwin:{ x: 30,  y: 380, w: 190, h: 70,  color: "var(--text-dim)", title: { en: "register window", de: "Register-Fenster" }, sub: "$2100–$43FF" },
    dma:   { x: 330, y: 250, w: 150, h: 120, color: "var(--f4)", title: "DMA / HDMA", sub: { en: "8 channels, ~2.7 MB/s", de: "8 Kanäle, ~2,7 MB/s" } },
    pcfg:  { x: 560, y: 20,  w: 150, h: 48,  color: "var(--f0)", title: "$2100–$2133", sub: { en: "PPU config: INIDISP, BGMODE, scroll…", de: "PPU-Config: INIDISP, BGMODE, Scroll…" } },
    p2118: { x: 560, y: 90,  w: 150, h: 44,  color: "var(--f1)", title: "$2118/19 VMDATA", sub: { en: "VRAM data port", de: "VRAM-Datenport" } },
    p2122: { x: 560, y: 150, w: 150, h: 44,  color: "var(--f5)", title: "$2122 CGDATA", sub: { en: "palette port", de: "Paletten-Port" } },
    p2104: { x: 560, y: 210, w: 150, h: 44,  color: "var(--f7)", title: "$2104 OAMDATA", sub: { en: "sprite table port", de: "Sprite-Tabellen-Port" } },
    p2180: { x: 560, y: 270, w: 150, h: 44,  color: "var(--f2)", title: "$2180 WMDATA", sub: { en: "WRAM port", de: "WRAM-Port" } },
    p2140: { x: 560, y: 350, w: 150, h: 44,  color: "var(--f6)", title: "$2140–43 APUIO", sub: { en: "sound mailbox", de: "Sound-Mailbox" } },
    vram:  { x: 800, y: 60,  w: 170, h: 120, color: "var(--f1)", title: "VRAM · 64 KB", sub: { en: "tiles + tilemaps — WORD addresses!", de: "Tiles + Tilemaps — WORT-Adressen!" } },
    cgram: { x: 800, y: 200, w: 170, h: 64,  color: "var(--f5)", title: "CGRAM · 512 B", sub: { en: "256 colors, 15-bit BGR", de: "256 Farben, 15-Bit BGR" } },
    oam:   { x: 800, y: 284, w: 170, h: 64,  color: "var(--f7)", title: "OAM · 544 B", sub: { en: "128 sprites", de: "128 Sprites" } },
    apu:   { x: 700, y: 430, w: 270, h: 100, color: "var(--f6)", title: "APU", sub: { en: "SPC700 + 64 KB ARAM + DSP — a private computer", de: "SPC700 + 64 KB ARAM + DSP — ein privater Computer" } },
    ppu:   { x: 1030, y: 100, w: 130, h: 180, color: "var(--accent)", title: "PPU", sub: { en: "renders per scanline", de: "rendert pro Scanline" } },
    screen:{ x: 1030, y: 320, w: 130, h: 70,  color: "var(--text)", title: "📺 256×224", sub: { en: "the picture", de: "das Bild" } }
  };

  // ---------- arrows: [id, from-side point, to point, label, curve] ----------
  function P(n, side, frac) {
    var d = NODES[n];
    frac = frac == null ? 0.5 : frac;
    if (side === "r") return [d.x + d.w, d.y + d.h * frac];
    if (side === "l") return [d.x, d.y + d.h * frac];
    if (side === "t") return [d.x + d.w * frac, d.y];
    return [d.x + d.w * frac, d.y + d.h];
  }
  function path(a, b, bend) {
    var mx = (a[0] + b[0]) / 2 + (bend || 0);
    return "M" + a[0] + "," + a[1] + " C" + mx + "," + a[1] + " " + mx + "," + b[1] + " " + b[0] + "," + b[1];
  }
  var ARROWS = [
    ["a_cpu_dma",   P("cpu", "r", 0.62), P("dma", "l"),        { en: "A bus", de: "A-Bus" }, 0],
    ["a_cpu_ports", P("cpu", "r", 0.1),  P("pcfg", "l"),       { en: "direct writes (LDA/STA)", de: "direkte Writes (LDA/STA)" }, -40],
    ["a_dma_ports", P("dma", "r"),       P("p2118", "l", 0.9), { en: "B bus", de: "B-Bus" }, 0],
    ["a_2118_vram", P("p2118", "r"),     P("vram", "l"),       "", 0],
    ["a_2122_cgram",P("p2122", "r"),     P("cgram", "l"),      "", 0],
    ["a_2104_oam",  P("p2104", "r"),     P("oam", "l"),        "", 0],
    ["a_2180_wram", P("p2180", "b", 0.2),P("wram", "b", 0.7),  { en: "back into WRAM!", de: "zurück ins WRAM!" }, -120],
    ["a_2140_apu",  P("p2140", "r"),     P("apu", "l", 0.3),   { en: "mailbox (4 bytes)", de: "Mailbox (4 Bytes)" }, 20],
    ["a_cfg_ppu",   P("pcfg", "r"),      P("ppu", "t", 0.3),   { en: "acts immediately", de: "wirkt sofort" }, 60],
    ["a_vram_ppu",  P("vram", "r", 0.5), P("ppu", "l", 0.25),  "", 0],
    ["a_cgram_ppu", P("cgram", "r"),     P("ppu", "l", 0.55),  "", 0],
    ["a_oam_ppu",   P("oam", "r"),       P("ppu", "l", 0.8),   "", 0],
    ["a_ppu_screen",P("ppu", "b"),       P("screen", "t"),     "", 0]
  ];

  // ---------- island details ----------
  var INFO = {
    cpu: { t: { en: "CPU address space", de: "CPU-Adressraum" },
      b: [{ en: "24-bit addresses: 256 banks × 64 KB. ROM, WRAM and the register window all live in here — everything else is invisible to the CPU.", de: "24-Bit-Adressen: 256 Bänke × 64 KB. ROM, WRAM und das Register-Fenster liegen hier drin — alles andere ist für die CPU unsichtbar." },
          { en: "Banks $80–$FF mirror $00–$7D; with MEMSEL they run at 3.58 MHz (FastROM).", de: "Bänke $80–$FF spiegeln $00–$7D; mit MEMSEL laufen sie mit 3,58 MHz (FastROM)." }],
      regs: [[0x420D, "MEMSEL"]] },
    rom: { t: { en: "ROM — LoROM or HiROM", de: "ROM — LoROM oder HiROM" }, b: [
      { en: "Your cartridge — where all graphics, code and music start their life. How it appears in the CPU address space is the cartridge's choice (wiring + header):", de: "Dein Modul — hier beginnen alle Grafiken, Code und Musik ihr Leben. WIE es im CPU-Adressraum auftaucht, entscheidet das Modul (Verdrahtung + Header):" },
      { en: "LoROM: 32 KB chunks in the upper half ($8000–$FFFF) of each bank — simpler to start with, the lower half stays free for WRAM mirror + registers.", de: "LoROM: 32-KB-Stücke in der oberen Hälfte ($8000–$FFFF) jeder Bank — einfacher für den Einstieg, die untere Hälfte bleibt frei für WRAM-Spiegel + Register." },
      { en: "HiROM: full 64 KB banks at $C0–$FF ($0000–$FFFF) — contiguous data, nicer for big assets, but banks $C0+ have no register window.", de: "HiROM: volle 64-KB-Bänke bei $C0–$FF ($0000–$FFFF) — zusammenhängende Daten, schöner für große Assets, aber Bänke $C0+ haben kein Register-Fenster." },
      { en: "The PPU can NEVER read ROM directly — everything must be copied into VRAM/CGRAM/OAM first.", de: "Die PPU kann ROM NIE direkt lesen — alles muss erst nach VRAM/CGRAM/OAM kopiert werden." }], regs: [[0x420D, "MEMSEL"]] },
    wram: { t: "WRAM · 128 KB", b: [
      { en: "$7E0000–$7FFFFF; the first 8 KB are mirrored into every bank at $0000–$1FFF.", de: "$7E0000–$7FFFFF; die ersten 8 KB sind in jeder Bank bei $0000–$1FFF gespiegelt." },
      { en: "Shadow buffers live here: build your OAM table / HDMA tables in WRAM, then DMA them out each VBlank.", de: "Hier wohnen die Schattenpuffer: OAM-Tabelle / HDMA-Tabellen im WRAM bauen, dann jedes VBlank per DMA rausschieben." },
      { en: "DMA can't copy WRAM→WRAM (both ends would need the A bus).", de: "DMA kann nicht WRAM→WRAM kopieren (beide Enden bräuchten den A-Bus)." }], regs: [[0x2180, "WMDATA"]] },
    regwin: { t: { en: "Register window", de: "Register-Fenster" }, b: [
      { en: "Not memory! These addresses ARE the hardware: $21xx = B-bus ports, $42xx = CPU I/O, $43xx = DMA setup.", de: "Kein Speicher! Diese Adressen SIND die Hardware: $21xx = B-Bus-Ports, $42xx = CPU-I/O, $43xx = DMA-Setup." }], regs: [[0x2100, "INIDISP"], [0x4200, "NMITIMEN"], [0x4300, "DMAPx"]] },
    dma: { t: "DMA / HDMA", b: [
      { en: "The freight ferry: 8 channels move 1 byte per ~1.34 MHz cycle from A bus to B bus (or back). One NTSC VBlank fits ~4–6 KB.", de: "Die Frachtfähre: 8 Kanäle bewegen 1 Byte pro ~1,34-MHz-Zyklus vom A-Bus zum B-Bus (oder zurück). In einen NTSC-VBlank passen ~4–6 KB." },
      { en: "HDMA is the same ferry on a timer: one table entry per scanline, straight into PPU registers.", de: "HDMA ist dieselbe Fähre mit Fahrplan: ein Tabelleneintrag pro Scanline, direkt in PPU-Register." }],
      regs: [[0x420B, "MDMAEN"], [0x420C, "HDMAEN"], [0x4300, "DMAPx"]] },
    pcfg: { t: { en: "PPU config ports", de: "PPU-Config-Ports" }, b: [
      { en: "Registers without memory behind them: INIDISP, BGMODE, scroll, windows, color math. Writes act immediately on the next pixel fetch.", de: "Register ohne Speicher dahinter: INIDISP, BGMODE, Scroll, Windows, Color Math. Writes wirken sofort auf den nächsten Pixel-Fetch." }], regs: [[0x2100, "INIDISP"], [0x2105, "BGMODE"], [0x210D, "BG1HOFS"]] },
    p2118: { t: "$2118/19 — VMDATA", b: [
      { en: "The ONLY door into VRAM. VMADD sets the word address, VMAIN the auto-increment. Locked during active display!", de: "Die EINZIGE Tür ins VRAM. VMADD setzt die Wortadresse, VMAIN das Auto-Inkrement. Während des aktiven Bilds gesperrt!" }], regs: [[0x2116, "VMADDL"], [0x2115, "VMAIN"], [0x2118, "VMDATAL"]] },
    p2122: { t: "$2122 — CGDATA", b: [
      { en: "Palette door: CGADD picks the color index, then two writes per 15-bit color (BGR!).", de: "Paletten-Tür: CGADD wählt den Farbindex, dann zwei Writes pro 15-Bit-Farbe (BGR!)." }], regs: [[0x2121, "CGADD"], [0x2122, "CGDATA"]] },
    p2104: { t: "$2104 — OAMDATA", b: [
      { en: "Sprite-table door. OAMADD resets at VBlank start — most games just DMA a 544-byte WRAM shadow every frame.", de: "Sprite-Tabellen-Tür. OAMADD resettet zu VBlank-Beginn — die meisten Spiele DMAen einfach jedes Frame einen 544-Byte-WRAM-Schatten." }], regs: [[0x2102, "OAMADDL"], [0x2104, "OAMDATA"]] },
    p2180: { t: "$2180 — WMDATA", b: [
      { en: "WRAM's own B-bus door — so DMA can fill WRAM from ROM (fast memcpy/memset).", de: "WRAMs eigene B-Bus-Tür — damit DMA WRAM aus dem ROM füllen kann (schnelles memcpy/memset)." }], regs: [[0x2180, "WMDATA"], [0x2181, "WMADDL"]] },
    p2140: { t: "$2140–43 — APUIO", b: [
      { en: "Four mailbox bytes — the ONLY connection to the sound computer. No shared memory, no interrupts: both sides poll a handshake.", de: "Vier Mailbox-Bytes — die EINZIGE Verbindung zum Sound-Computer. Kein gemeinsamer Speicher, keine Interrupts: beide Seiten pollen einen Handshake." }], regs: [[0x2140, "APUIO0"]] },
    vram: { t: { en: "VRAM · 64 KB — the #1 confusion source", de: "VRAM · 64 KB — Verwirrungsquelle Nr. 1" }, b: [
      { en: "WORD-addressed: $0000–$7FFF words = 64 KB bytes. Byte address ÷ 2 = word address. All base registers (BGnSC, NBA, OBSEL) count in words.", de: "WORT-adressiert: $0000–$7FFF Wörter = 64 KB Bytes. Byte-Adresse ÷ 2 = Wortadresse. Alle Basis-Register (BGnSC, NBA, OBSEL) zählen in Wörtern." },
      { en: "Holds tiles AND tilemaps — your layout here is what the setup planner manages.", de: "Enthält Tiles UND Tilemaps — genau dieses Layout verwaltet der Setup-Planer." },
      { en: "Writable only during VBlank/forced blank.", de: "Beschreibbar nur während VBlank/Forced Blank." }],
      regs: [[0x2116, "VMADDL"], [0x2107, "BG1SC"], [0x210B, "BG12NBA"]], planner: true },
    cgram: { t: "CGRAM · 512 B", b: [
      { en: "256 colors × 15 bit. BG palettes 0–127, sprite palettes 128–255. Color 0 = backdrop.", de: "256 Farben × 15 Bit. BG-Paletten 0–127, Sprite-Paletten 128–255. Farbe 0 = Backdrop." }], regs: [[0x2121, "CGADD"], [0x2132, "COLDATA"]] },
    oam: { t: "OAM · 544 B", b: [
      { en: "128 sprites × 4 bytes + 32-byte high table (X bit 8 + size). The high table is the classic 'sprite at wrong X' trap.", de: "128 Sprites × 4 Bytes + 32-Byte-High-Table (X-Bit 8 + Größe). Die High-Table ist die klassische 'Sprite an falschem X'-Falle." }], regs: [[0x2101, "OBSEL"], [0x2103, "OAMADDH"]] },
    apu: { t: { en: "APU — the private computer", de: "APU — der private Computer" }, b: [
      { en: "SPC700 CPU + 64 KB ARAM + DSP. You upload a sound driver + samples through the mailbox at boot; afterwards it plays music on its own.", de: "SPC700-CPU + 64 KB ARAM + DSP. Beim Boot lädst du Treiber + Samples durch die Mailbox hoch; danach spielt sie selbstständig Musik." },
      { en: "The main CPU can NEVER touch ARAM directly.", de: "Die Haupt-CPU kann ARAM NIE direkt anfassen." }], regs: [[0x2140, "APUIO0"]] },
    ppu: { t: { en: "PPU — the renderer", de: "PPU — der Renderer" }, b: [
      { en: "Reads VRAM/CGRAM/OAM live while drawing each scanline — that's WHY those memories are locked during active display.", de: "Liest VRAM/CGRAM/OAM live beim Zeichnen jeder Scanline — DESHALB sind diese Speicher während des aktiven Bilds gesperrt." }], regs: [[0x2105, "BGMODE"], [0x212C, "TM"]] },
    screen: { t: { en: "The picture", de: "Das Bild" }, b: [
      { en: "256×224 pixels, 60 times a second. Everything on this map exists to feed this box.", de: "256×224 Pixel, 60-mal pro Sekunde. Alles auf dieser Karte existiert, um diese Kiste zu füttern." }], regs: [] }
  };

  // ---------- journeys ----------
  var JOURNEYS = {
    tile: { label: { en: "🧱 Tile → screen", de: "🧱 Tile → Bild" }, steps: [
      { hl: ["rom"], arrows: [], text: { en: "Tile graphics sit in ROM as 4bpp planar data — useless to the PPU until copied.", de: "Tile-Grafiken liegen als 4bpp-Planar-Daten im ROM — nutzlos für die PPU, bis sie kopiert sind." }, regs: [] },
      { hl: ["rom", "dma"], arrows: ["a_cpu_dma"], text: { en: "Configure a DMA channel: source address, target port $18, byte count.", de: "DMA-Kanal konfigurieren: Quelladresse, Ziel-Port $18, Byte-Anzahl." }, regs: [[0x4300, "DMAPx=$01"], [0x4301, "BBADx=$18"], [0x4302, "A1TxL"], [0x4305, "DASxL"]] },
      { hl: ["dma", "p2118"], arrows: ["a_dma_ports"], text: { en: "MDMAEN fires: the CPU halts, bytes stream over the B bus.", de: "MDMAEN feuert: Die CPU steht, Bytes strömen über den B-Bus." }, regs: [[0x420B, "MDMAEN"]] },
      { hl: ["p2118", "vram"], arrows: ["a_2118_vram"], text: { en: "VMADD chose the WORD address, VMAIN auto-increments — VRAM fills up. Only during VBlank/forced blank!", de: "VMADD wählte die WORT-Adresse, VMAIN zählt automatisch weiter — das VRAM füllt sich. Nur während VBlank/Forced Blank!" }, regs: [[0x2116, "VMADDL"], [0x2115, "VMAIN=$80"]] },
      { hl: ["vram", "ppu", "screen"], arrows: ["a_vram_ppu", "a_ppu_screen"], text: { en: "The PPU fetches the tiles via BG12NBA while drawing each scanline.", de: "Die PPU holt die Tiles über BG12NBA beim Zeichnen jeder Scanline." }, regs: [[0x210B, "BG12NBA"]] }
    ]},
    pal: { label: { en: "🎨 Palette → CGRAM", de: "🎨 Palette → CGRAM" }, steps: [
      { hl: ["rom"], arrows: [], text: { en: "Colors sit in ROM: 15-bit BGR words, 2 bytes each.", de: "Farben liegen im ROM: 15-Bit-BGR-Wörter, je 2 Bytes." }, regs: [] },
      { hl: ["rom", "dma"], arrows: ["a_cpu_dma"], text: { en: "Set CGADD to the first color index, then configure DMA to port $22.", de: "CGADD auf den ersten Farbindex setzen, dann DMA auf Port $22 konfigurieren." }, regs: [[0x2121, "CGADD=0"], [0x4300, "DMAPx=$00"], [0x4301, "BBADx=$22"]] },
      { hl: ["dma", "p2122", "cgram"], arrows: ["a_dma_ports", "a_2122_cgram"], text: { en: "Each color = two writes (low, high byte); the address auto-increments through all 256 entries.", de: "Jede Farbe = zwei Writes (Low-, High-Byte); die Adresse zählt automatisch durch alle 256 Einträge." }, regs: [[0x420B, "MDMAEN"]] },
      { hl: ["cgram", "ppu", "screen"], arrows: ["a_cgram_ppu", "a_ppu_screen"], text: { en: "Every pixel the PPU draws is just an index into these 256 colors.", de: "Jeder Pixel, den die PPU malt, ist nur ein Index in diese 256 Farben." }, regs: [] }
    ]},
    spr: { label: { en: "👾 Sprites → OAM", de: "👾 Sprites → OAM" }, steps: [
      { hl: ["wram"], arrows: [], text: { en: "Your game builds a 544-byte shadow OAM in WRAM each frame — positions, tiles, attributes.", de: "Dein Spiel baut jedes Frame ein 544-Byte-Schatten-OAM im WRAM — Positionen, Tiles, Attribute." }, regs: [] },
      { hl: ["wram", "dma"], arrows: ["a_cpu_dma"], text: { en: "In VBlank: reset OAMADD to 0, point a DMA channel at port $04.", de: "Im VBlank: OAMADD auf 0 setzen, einen DMA-Kanal auf Port $04 richten." }, regs: [[0x2102, "OAMADDL=0"], [0x4301, "BBADx=$04"]] },
      { hl: ["dma", "p2104", "oam"], arrows: ["a_dma_ports", "a_2104_oam"], text: { en: "544 bytes stream into OAM — done in ~350 µs.", de: "544 Bytes strömen ins OAM — fertig in ~350 µs." }, regs: [[0x420B, "MDMAEN"]] },
      { hl: ["oam", "ppu", "screen"], arrows: ["a_oam_ppu", "a_ppu_screen"], text: { en: "The PPU evaluates up to 32 sprites per scanline from this table (34 tile slivers max!).", de: "Die PPU wertet pro Scanline bis zu 32 Sprites aus dieser Tabelle aus (max. 34 Tile-Streifen!)." }, regs: [[0x2101, "OBSEL"]] }
    ]},
    scrl: { label: { en: "🕹️ Scroll value", de: "🕹️ Scroll-Wert" }, steps: [
      { hl: ["cpu"], arrows: [], text: { en: "The CPU computes the camera position — a plain 16-bit variable in WRAM.", de: "Die CPU berechnet die Kameraposition — eine schlichte 16-Bit-Variable im WRAM." }, regs: [] },
      { hl: ["cpu", "pcfg"], arrows: ["a_cpu_ports"], text: { en: "No DMA needed: two direct writes (write-twice!) to BG1HOFS. Config registers have no memory behind them.", de: "Kein DMA nötig: zwei direkte Writes (Write-Twice!) auf BG1HOFS. Config-Register haben keinen Speicher dahinter." }, regs: [[0x210D, "BG1HOFS ×2"]] },
      { hl: ["pcfg", "ppu", "screen"], arrows: ["a_cfg_ppu", "a_ppu_screen"], text: { en: "The value acts on the very next scanline fetch. HDMA can replace this with a per-scanline table → parallax.", de: "Der Wert wirkt beim allernächsten Scanline-Fetch. HDMA kann das durch eine Pro-Scanline-Tabelle ersetzen → Parallax." }, regs: [[0x420C, "HDMAEN"]] }
    ]},
    snd: { label: { en: "🎵 Sound driver → APU", de: "🎵 Sound-Treiber → APU" }, steps: [
      { hl: ["rom", "cpu"], arrows: [], text: { en: "Driver + samples sit in ROM. After reset, the APU boot ROM waits and writes $AA/$BB to the mailbox.", de: "Treiber + Samples liegen im ROM. Nach dem Reset wartet das APU-Boot-ROM und schreibt $AA/$BB in die Mailbox." }, regs: [] },
      { hl: ["cpu", "p2140"], arrows: ["a_cpu_ports"], text: { en: "The CPU shovels bytes through the 4 mailbox ports, one handshake at a time — no DMA possible here!", de: "Die CPU schaufelt Bytes durch die 4 Mailbox-Ports, ein Handshake nach dem anderen — DMA geht hier nicht!" }, regs: [[0x2140, "APUIO0"], [0x2141, "APUIO1"]] },
      { hl: ["p2140", "apu"], arrows: ["a_2140_apu"], text: { en: "The SPC700 copies everything into its private 64 KB ARAM. From now on it runs the music entirely on its own.", de: "Der SPC700 kopiert alles in sein privates 64-KB-ARAM. Ab jetzt macht er die Musik komplett allein." }, regs: [] }
    ]}
  };

  // ---------- rendering ----------
  function nodeSvg(id) {
    var n = NODES[id];
    if (n.frame) {
      return '<g class="mm-frame" data-id="' + id + '"><rect x="' + n.x + '" y="' + n.y + '" width="' + n.w + '" height="' + n.h + '" rx="14"/>' +
        '<text x="' + (n.x + 12) + '" y="' + (n.y + 24) + '" class="mm-frame-t">' + esc(L(n.title)) + "</text></g>";
    }
    var sub = n.sub ? '<text x="' + (n.x + n.w / 2) + '" y="' + (n.y + (n.h > 60 ? 52 : 36)) + '" class="mm-sub">' + esc(L(n.sub)) + "</text>" : "";
    return '<g class="mm-node" data-id="' + id + '" style="--fc:' + (n.color || "var(--border)") + '">' +
      '<rect x="' + n.x + '" y="' + n.y + '" width="' + n.w + '" height="' + n.h + '" rx="10"/>' +
      '<text x="' + (n.x + n.w / 2) + '" y="' + (n.y + (n.h > 60 ? 30 : 20)) + '" class="mm-title">' + esc(L(n.title)) + "</text>" + sub +
      (id === "vram" ? '<g id="mm-planner"></g>' : "") + "</g>";
  }

  function render(host) {
    stopJourney();
    var nodesHtml = Object.keys(NODES).map(nodeSvg).join("");
    var arrowsHtml = ARROWS.map(function (a) {
      var d = path(a[1], a[2], a[4]);
      var lbl = a[3] ? '<text class="mm-alabel"><textPath href="#' + a[0] + '" startOffset="50%">' + esc(L(a[3])) + "</textPath></text>" : "";
      return '<g class="mm-arrow" data-id="' + a[0] + '"><path id="' + a[0] + '" d="' + d + '" marker-end="url(#mmarrow)"/>' + lbl + "</g>";
    }).join("");

    var jBtns = Object.keys(JOURNEYS).map(function (id) {
      return '<button class="modebtn src" data-journey="' + id + '">' + esc(L(JOURNEYS[id].label)) + "</button>";
    }).join("") + '<button class="modebtn src" id="mm-stop" style="display:none">' + esc(L(T.stop)) + "</button>";

    host.innerHTML =
      '<div class="hero"><h1>' + esc(L(T.title)) + "</h1><p>" + esc(L(T.intro)) + "</p></div>" +
      '<div class="lv-controls"><div class="lv-row"><span class="lv-lbl">' + esc(L(T.journeys)) + "</span>" + jBtns + "</div>" +
      '<div id="mm-journey" class="mm-journey"><span class="dim">' + esc(L(T.idle)) + "</span></div></div>" +
      '<div class="mm-wrap"><div class="mm-zoom"><button id="mm-zin">+</button><button id="mm-zout">−</button><button id="mm-zreset">⟲</button></div>' +
      '<div class="mm-pan" id="mm-pan"><svg id="mm-svg" viewBox="0 0 1180 560" xmlns="http://www.w3.org/2000/svg">' +
      '<defs><marker id="mmarrow" markerWidth="9" markerHeight="9" refX="7" refY="3.5" orient="auto"><path d="M0,0 L8,3.5 L0,7 z" class="mm-head"/></marker></defs>' +
      arrowsHtml + nodesHtml +
      '<circle id="mm-dot" r="7" style="display:none"/></svg></div></div>' +
      '<p class="dim">💡 ' + esc(L(T.clickHint)) + "</p>" +
      '<div id="mm-info" class="mm-info"></div>';

    // planner blocks inside the VRAM island
    drawPlannerBlocks(host);

    // node clicks -> info panel
    host.querySelectorAll(".mm-node, .mm-frame").forEach(function (g) {
      g.addEventListener("click", function () { showInfo(host, g.dataset.id); });
    });
    showInfo(host, "vram");

    // journeys
    host.querySelectorAll("[data-journey]").forEach(function (b) {
      b.onclick = function () { startJourney(host, b.dataset.journey); };
    });
    host.querySelector("#mm-stop").onclick = function () { stopJourney(); syncJourneyUi(host, null); };

    // zoom + pan
    var scale = 1, tx = 0, ty = 0;
    var pan = host.querySelector("#mm-pan"), svg = host.querySelector("#mm-svg");
    function apply() { svg.style.transform = "translate(" + tx + "px," + ty + "px) scale(" + scale + ")"; }
    host.querySelector("#mm-zin").onclick = function () { scale = Math.min(2.5, scale * 1.25); apply(); };
    host.querySelector("#mm-zout").onclick = function () { scale = Math.max(0.5, scale / 1.25); apply(); };
    host.querySelector("#mm-zreset").onclick = function () { scale = 1; tx = ty = 0; apply(); };
    pan.addEventListener("pointerdown", function (e) {
      if (e.target.closest(".mm-node") || e.target.closest(".mm-frame")) return;
      var sx = e.clientX - tx, sy = e.clientY - ty;
      function mv(ev) { tx = ev.clientX - sx; ty = ev.clientY - sy; apply(); }
      function up() { window.removeEventListener("pointermove", mv); window.removeEventListener("pointerup", up); }
      window.addEventListener("pointermove", mv);
      window.addEventListener("pointerup", up);
    });
  }

  function drawPlannerBlocks(host) {
    var g = host.querySelector("#mm-planner");
    if (!g || !window.SNESPlanner || !window.SNESPlanner.blocks) return;
    var blocks = window.SNESPlanner.blocks();
    if (!blocks.length) return;
    var n = NODES.vram, bx = n.x + 10, bw = n.w - 20, by = n.y + n.h - 26;
    var html = '<rect x="' + bx + '" y="' + by + '" width="' + bw + '" height="14" rx="3" class="mm-vbar"/>';
    var FAMC = { BG1: "#4fc3f7", BG2: "#66bb6a", BG3: "#ffb74d", BG4: "#ba68c8", OBJ: "#f06292", CST: "#8a94a6" };
    blocks.forEach(function (b) {
      var x = bx + (b.addr / 0x8000) * bw;
      var w = Math.max(2, (Math.min(b.words, 0x8000 - b.addr) / 0x8000) * bw);
      html += '<rect x="' + x + '" y="' + (by + 2) + '" width="' + w + '" height="10" rx="2" fill="' + (FAMC[b.fam] || "#888") + '"><title>' + esc(b.label) + "</title></rect>";
    });
    html += '<text x="' + bx + '" y="' + (by - 4) + '" class="mm-sub" style="text-anchor:start">▼ ' + esc(L(T.yourSetup)) + "</text>";
    g.innerHTML = html;
  }

  function showInfo(host, id) {
    var info = INFO[id];
    if (!info) return;
    host.querySelectorAll(".mm-node.sel, .mm-frame.sel").forEach(function (n) { n.classList.remove("sel"); });
    var g = host.querySelector('[data-id="' + id + '"]');
    if (g) g.classList.add("sel");
    var bullets = info.b.map(function (x) { return "<li>" + esc(L(x)) + "</li>"; }).join("");
    var regs = (info.regs || []).map(function (r) {
      return '<a href="#/reg/' + r[0].toString(16) + '" class="regchip">' + r[1] + "</a>";
    }).join(" ");
    host.querySelector("#mm-info").innerHTML =
      "<h2 class=\"sec\">" + esc(L(info.t)) + "</h2><ul class=\"mm-bullets\">" + bullets + "</ul>" +
      (regs ? '<div class="lv-regs" style="margin-left:0">' + regs + "</div>" : "");
  }

  // ---------- journey engine ----------
  function stopJourney() {
    if (timer) { clearTimeout(timer); timer = null; }
    if (dotRaf) { cancelAnimationFrame(dotRaf); dotRaf = null; }
    document.querySelectorAll(".mm-node.jhl, .mm-frame.jhl, .mm-arrow.jhl").forEach(function (n) { n.classList.remove("jhl"); });
    var dot = document.getElementById("mm-dot");
    if (dot) dot.style.display = "none";
  }
  function syncJourneyUi(host, active) {
    host.querySelectorAll("[data-journey]").forEach(function (b) {
      b.classList.toggle("active", b.dataset.journey === active);
    });
    host.querySelector("#mm-stop").style.display = active ? "" : "none";
    if (!active) host.querySelector("#mm-journey").innerHTML = '<span class="dim">' + esc(L(T.idle)) + "</span>";
  }
  function startJourney(host, id) {
    stopJourney();
    syncJourneyUi(host, id);
    var j = JOURNEYS[id], idx = 0;
    var panel = host.querySelector("#mm-journey");
    function runStep() {
      if (!document.getElementById("mm-svg")) { stopJourney(); return; }
      document.querySelectorAll(".jhl").forEach(function (n) { n.classList.remove("jhl"); });
      var s = j.steps[idx];
      s.hl.forEach(function (nid) {
        var g = host.querySelector('[data-id="' + nid + '"]');
        if (g) g.classList.add("jhl");
      });
      s.arrows.forEach(function (aid) {
        var g = host.querySelector('.mm-arrow[data-id="' + aid + '"]');
        if (g) g.classList.add("jhl");
      });
      var regs = s.regs.map(function (r) {
        return '<a href="#/reg/' + r[0].toString(16) + '" class="regchip">' + r[1] + "</a>";
      }).join(" ");
      panel.innerHTML = "<b>" + esc(L(T.step)) + " " + (idx + 1) + "/" + j.steps.length + ":</b> " + esc(L(s.text)) +
        (regs ? ' <span class="lv-regs" style="margin-left:8px">' + regs + "</span>" : "");
      animateDot(s.arrows);
      idx = (idx + 1) % j.steps.length;
      timer = setTimeout(runStep, 2600);
    }
    runStep();
  }
  function animateDot(arrowIds) {
    if (dotRaf) { cancelAnimationFrame(dotRaf); dotRaf = null; }
    var dot = document.getElementById("mm-dot");
    if (!dot) return;
    var paths = arrowIds.map(function (id) { return document.getElementById(id); }).filter(Boolean);
    if (!paths.length) { dot.style.display = "none"; return; }
    dot.style.display = "";
    var lens = paths.map(function (p) { return p.getTotalLength(); });
    var total = lens.reduce(function (a, b) { return a + b; }, 0);
    var t0 = performance.now(), dur = 2200;
    (function step(now) {
      var f = Math.min(1, (now - t0) / dur);
      var dist = f * total, pi = 0;
      while (pi < lens.length - 1 && dist > lens[pi]) { dist -= lens[pi]; pi++; }
      var pt = paths[pi].getPointAtLength(Math.min(dist, lens[pi]));
      dot.setAttribute("cx", pt.x); dot.setAttribute("cy", pt.y);
      if (f < 1 && document.getElementById("mm-dot")) dotRaf = requestAnimationFrame(step);
    })(t0);
  }

  window.SNESMemMap = { render: render };
})();
