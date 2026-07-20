// SNES registers: WRAM port ($2180–$2183) and DMA/HDMA ($420B/$420C, $43x0–$43xA).
// The $43xx registers exist once per channel: x = channel 0–7 → $43x0.
window.SNES.registers.push(

{ addr: 0x2180, mnem: "WMDATA", group: "wram", access: "W", size: 8, timing: "anytime",
  title: { en: "WRAM data port (read/write)", de: "WRAM-Datenport (lesen/schreiben)" },
  desc: {
    en: "Sequential access to the 128 KB work RAM at the address in WMADD (auto-increments). Its real job: it sits on the B bus at $80, so DMA can fill or read WRAM. Remember: DMA cannot copy WRAM→WRAM — this port IS in WRAM, and the A bus side would be WRAM too.",
    de: "Sequenzieller Zugriff aufs 128-KB-WRAM an der Adresse in WMADD (zählt automatisch hoch). Sein echter Job: Er liegt auf dem B-Bus bei $80, damit DMA WRAM füllen oder auslesen kann. Merke: DMA kann nicht WRAM→WRAM kopieren — dieser Port liegt selbst im WRAM, und die A-Bus-Seite wäre auch WRAM."
  },
  fields: [ { bits: [7,0], name: { en: "Data byte", de: "Datenbyte" }, fmt: { type: "raw" } } ],
  warnings: [
    { level: "info", en: "Classic use: DMA with fixed A-bus address from a zero byte in ROM to WMDATA = fast memset of WRAM.",
      de: "Klassische Nutzung: DMA mit fixer A-Bus-Adresse von einem Null-Byte im ROM nach WMDATA = schnelles memset des WRAM." }
  ]
},

{ addr: 0x2181, mnem: "WMADDL", group: "wram", access: "W", size: 8, timing: "anytime",
  title: { en: "WRAM address (low)", de: "WRAM-Adresse (Low)" },
  desc: { en: "Bits 0–7 of the 17-bit WRAM address for WMDATA.", de: "Bits 0–7 der 17-Bit-WRAM-Adresse für WMDATA." },
  fields: [ { bits: [7,0], name: { en: "Address bits 0–7", de: "Adress-Bits 0–7" }, fmt: { type: "raw" } } ],
  warnings: []
},

{ addr: 0x2182, mnem: "WMADDM", group: "wram", access: "W", size: 8, timing: "anytime",
  title: { en: "WRAM address (middle)", de: "WRAM-Adresse (Mitte)" },
  desc: { en: "Bits 8–15 of the WRAM address.", de: "Bits 8–15 der WRAM-Adresse." },
  fields: [ { bits: [7,0], name: { en: "Address bits 8–15", de: "Adress-Bits 8–15" }, fmt: { type: "raw" } } ],
  warnings: []
},

{ addr: 0x2183, mnem: "WMADDH", group: "wram", access: "W", size: 8, timing: "anytime",
  title: { en: "WRAM address (bank bit)", de: "WRAM-Adresse (Bank-Bit)" },
  desc: { en: "Bit 16 of the WRAM address: 0 = bank $7E, 1 = bank $7F.", de: "Bit 16 der WRAM-Adresse: 0 = Bank $7E, 1 = Bank $7F." },
  fields: [
    { bits: [0,0], name: { en: "Bank select", de: "Bank-Wahl" },
      values: { 0: { en: "$7E0000–$7EFFFF", de: "$7E0000–$7EFFFF" }, 1: { en: "$7F0000–$7FFFFF", de: "$7F0000–$7FFFFF" } } }
  ],
  warnings: []
},

{ addr: 0x420B, mnem: "MDMAEN", group: "dma", access: "W", size: 8, timing: "anytime",
  title: { en: "Start general DMA (the GO button)", de: "General-DMA starten (der GO-Knopf)" },
  desc: {
    en: "Each bit fires the corresponding DMA channel IMMEDIATELY. The CPU is halted while the transfer runs (1 byte per ~1.34 MHz cycle). Multiple bits: channels execute one after another, 0 first. This is how every tileset, tilemap, palette and OAM buffer gets into the PPU.",
    de: "Jedes Bit startet den entsprechenden DMA-Kanal SOFORT. Die CPU steht, während der Transfer läuft (1 Byte pro ~1,34-MHz-Zyklus). Mehrere Bits: Kanäle laufen nacheinander, 0 zuerst. So kommt jedes Tileset, jede Tilemap, Palette und jeder OAM-Puffer in die PPU."
  },
  fields: [
    { bits: [7,7], name: { en: "Channel 7", de: "Kanal 7" }, values: { 0: { en: "—", de: "—" }, 1: { en: "start", de: "starten" } } },
    { bits: [6,6], name: { en: "Channel 6", de: "Kanal 6" }, values: { 0: { en: "—", de: "—" }, 1: { en: "start", de: "starten" } } },
    { bits: [5,5], name: { en: "Channel 5", de: "Kanal 5" }, values: { 0: { en: "—", de: "—" }, 1: { en: "start", de: "starten" } } },
    { bits: [4,4], name: { en: "Channel 4", de: "Kanal 4" }, values: { 0: { en: "—", de: "—" }, 1: { en: "start", de: "starten" } } },
    { bits: [3,3], name: { en: "Channel 3", de: "Kanal 3" }, values: { 0: { en: "—", de: "—" }, 1: { en: "start", de: "starten" } } },
    { bits: [2,2], name: { en: "Channel 2", de: "Kanal 2" }, values: { 0: { en: "—", de: "—" }, 1: { en: "start", de: "starten" } } },
    { bits: [1,1], name: { en: "Channel 1", de: "Kanal 1" }, values: { 0: { en: "—", de: "—" }, 1: { en: "start", de: "starten" } } },
    { bits: [0,0], name: { en: "Channel 0", de: "Kanal 0" }, values: { 0: { en: "—", de: "—" }, 1: { en: "start", de: "starten" } } }
  ],
  warnings: [
    { level: "warn", en: "The transfer target (VRAM/OAM/CGRAM) still obeys its timing rules! DMA to $2118 during active display is dropped just like a CPU write — run it during VBlank or forced blank.",
      de: "Das Transferziel (VRAM/OAM/CGRAM) gehorcht weiter seinen Timing-Regeln! DMA nach $2118 während des aktiven Bilds wird genauso verworfen wie ein CPU-Write — während VBlank oder Forced Blank starten." },
    { level: "warn", en: "If an HDMA transfer on the same channel triggers mid-DMA, the DMA is aborted (hardware quirk). Keep general DMA and HDMA on different channels.",
      de: "Feuert HDMA auf demselben Kanal mitten im DMA, wird der DMA abgebrochen (Hardware-Quirk). General-DMA und HDMA auf getrennte Kanäle legen." }
  ]
},

{ addr: 0x420C, mnem: "HDMAEN", group: "dma", access: "W", size: 8, timing: "anytime",
  title: { en: "Enable HDMA channels", de: "HDMA-Kanäle aktivieren" },
  desc: {
    en: "Each bit enables HDMA on that channel: the hardware then feeds values from a table in memory to a B-bus register during EVERY HBlank — one entry per scanline, zero CPU cost. This is the machine behind gradients, wavy effects, per-line scrolling and Mode 7 perspective.",
    de: "Jedes Bit aktiviert HDMA auf dem Kanal: Die Hardware schiebt dann in JEDEM HBlank Werte aus einer Tabelle im Speicher in ein B-Bus-Register — ein Eintrag pro Scanline, null CPU-Kosten. Das ist die Maschine hinter Gradienten, Wabbel-Effekten, Line-Scrolling und Mode-7-Perspektive."
  },
  fields: [
    { bits: [7,7], name: { en: "Channel 7", de: "Kanal 7" }, values: { 0: { en: "off", de: "aus" }, 1: { en: "HDMA on", de: "HDMA an" } } },
    { bits: [6,6], name: { en: "Channel 6", de: "Kanal 6" }, values: { 0: { en: "off", de: "aus" }, 1: { en: "HDMA on", de: "HDMA an" } } },
    { bits: [5,5], name: { en: "Channel 5", de: "Kanal 5" }, values: { 0: { en: "off", de: "aus" }, 1: { en: "HDMA on", de: "HDMA an" } } },
    { bits: [4,4], name: { en: "Channel 4", de: "Kanal 4" }, values: { 0: { en: "off", de: "aus" }, 1: { en: "HDMA on", de: "HDMA an" } } },
    { bits: [3,3], name: { en: "Channel 3", de: "Kanal 3" }, values: { 0: { en: "off", de: "aus" }, 1: { en: "HDMA on", de: "HDMA an" } } },
    { bits: [2,2], name: { en: "Channel 2", de: "Kanal 2" }, values: { 0: { en: "off", de: "aus" }, 1: { en: "HDMA on", de: "HDMA an" } } },
    { bits: [1,1], name: { en: "Channel 1", de: "Kanal 1" }, values: { 0: { en: "off", de: "aus" }, 1: { en: "HDMA on", de: "HDMA an" } } },
    { bits: [0,0], name: { en: "Channel 0", de: "Kanal 0" }, values: { 0: { en: "off", de: "aus" }, 1: { en: "HDMA on", de: "HDMA an" } } }
  ],
  warnings: [
    { level: "warn", en: "HDMA initializes its channels at the start of every frame — enable during VBlank, or the first frame runs with a half-initialized table.",
      de: "HDMA initialisiert seine Kanäle zu Frame-Beginn — während VBlank aktivieren, sonst läuft das erste Frame mit halb initialisierter Tabelle." },
    { level: "info", en: "Higher channel numbers win on B-bus conflicts; each active channel costs a few master cycles per scanline.",
      de: "Bei B-Bus-Konflikten gewinnt der höhere Kanal; jeder aktive Kanal kostet ein paar Master-Zyklen pro Scanline." }
  ]
},

{ addr: 0x4300, mnem: "DMAPx", group: "dma", access: "W", size: 8, timing: "dma_setup",
  title: { en: "DMA/HDMA parameters (channel x: $43x0)", de: "DMA/HDMA-Parameter (Kanal x: $43x0)" },
  desc: {
    en: "How the channel moves data: direction, A-bus address stepping, and the transfer unit — the pattern of B-bus registers written per unit. $01 is THE VRAM upload value (2 bytes to $2118/$2119). Exists once per channel: $4300, $4310 … $4370.",
    de: "Wie der Kanal Daten bewegt: Richtung, A-Bus-Adressschritt und die Transfer-Unit — das Muster der B-Bus-Register pro Einheit. $01 ist DER VRAM-Upload-Wert (2 Bytes nach $2118/$2119). Existiert einmal pro Kanal: $4300, $4310 … $4370."
  },
  fields: [
    { bits: [7,7], name: { en: "Direction", de: "Richtung" },
      values: { 0: { en: "A→B: memory → PPU (normal)", de: "A→B: Speicher → PPU (Normalfall)" },
                1: { en: "B→A: PPU → memory (reads)", de: "B→A: PPU → Speicher (Lesen)" } } },
    { bits: [6,6], name: { en: "HDMA addressing", de: "HDMA-Adressierung" },
      values: { 0: { en: "direct — values sit in the table itself", de: "direkt — Werte stehen in der Tabelle selbst" },
                1: { en: "indirect — table holds pointers to the data", de: "indirekt — Tabelle enthält Zeiger auf die Daten" } } },
    { bits: [4,3], name: { en: "A-bus address step (DMA)", de: "A-Bus-Adressschritt (DMA)" },
      values: { 0: { en: "+1 after each byte (normal)", de: "+1 nach jedem Byte (Normalfall)" },
                1: { en: "fixed — same source byte every time (memset!)", de: "fix — immer dasselbe Quellbyte (memset!)" },
                2: { en: "−1 after each byte", de: "−1 nach jedem Byte" },
                3: { en: "fixed", de: "fix" } } },
    { bits: [2,0], name: { en: "Transfer unit (B-bus pattern)", de: "Transfer-Unit (B-Bus-Muster)" },
      values: { 0: { en: "1 byte → 1 register (OAM, CGRAM, WRAM)", de: "1 Byte → 1 Register (OAM, CGRAM, WRAM)" },
                1: { en: "2 bytes → 2 registers L,H (VRAM via $2118/19!)", de: "2 Bytes → 2 Register L,H (VRAM über $2118/19!)" },
                2: { en: "2 bytes → same register twice (write-twice regs, HDMA scroll)", de: "2 Bytes → gleiches Register zweimal (Write-Twice-Register, HDMA-Scroll)" },
                3: { en: "4 bytes → 2 registers, twice each (LL,HH)", de: "4 Bytes → 2 Register, je zweimal (LL,HH)" },
                4: { en: "4 bytes → 4 consecutive registers", de: "4 Bytes → 4 aufeinanderfolgende Register" },
                5: { en: "4 bytes → 2 registers alternating (L,H,L,H)", de: "4 Bytes → 2 Register alternierend (L,H,L,H)" },
                6: { en: "same as 2", de: "wie 2" },
                7: { en: "same as 3", de: "wie 3" } } }
  ],
  warnings: [
    { level: "info", en: "Cookbook: VRAM = $01, OAM/CGRAM = $00, HDMA on one scroll register = $02, HDMA on M7A–D = $03/$04 patterns, memset = $09 (fixed source, unit 1) with a zero byte.",
      de: "Kochbuch: VRAM = $01, OAM/CGRAM = $00, HDMA auf ein Scroll-Register = $02, HDMA auf M7A–D = $03/$04-Muster, memset = $09 (fixe Quelle, Unit 1) mit einem Null-Byte." }
  ],
  lint: function (v) {
    var out = [];
    if ((v & 7) >= 6) out.push({ level: "info", en: "Units 6/7 are mirrors of 2/3.", de: "Units 6/7 sind Spiegel von 2/3." });
    if (v & 0x20) out.push({ level: "info", en: "Bit 5 is unused.", de: "Bit 5 ist ungenutzt." });
    if ((v & 0x80) && (v & 7) === 1) out.push({ level: "info", en: "B→A with unit 1: reading VRAM back via $2139/$213A — don't forget the dummy read setup.", de: "B→A mit Unit 1: VRAM zurücklesen über $2139/$213A — Dummy-Read-Setup nicht vergessen." });
    return out;
  }
},

{ addr: 0x4301, mnem: "BBADx", group: "dma", access: "W", size: 8, timing: "dma_setup",
  title: { en: "B-bus target register (channel x: $43x1)", de: "B-Bus-Zielregister (Kanal x: $43x1)" },
  desc: {
    en: "The low byte of the $21xx register the channel talks to. $18 → $2118 (VRAM), $04 → $2104 (OAM), $22 → $2122 (CGRAM), $80 → $2180 (WRAM). With multi-register transfer units, this is the FIRST register of the pattern.",
    de: "Das Low-Byte des $21xx-Registers, mit dem der Kanal spricht. $18 → $2118 (VRAM), $04 → $2104 (OAM), $22 → $2122 (CGRAM), $80 → $2180 (WRAM). Bei Mehr-Register-Transfer-Units ist das das ERSTE Register des Musters."
  },
  fields: [
    { bits: [7,0], name: { en: "B-bus address low byte", de: "B-Bus-Adresse Low-Byte" },
      fmt: { type: "raw", label: { en: "target = $2100 + value", de: "Ziel = $2100 + Wert" } } }
  ],
  warnings: [],
  lint: function (v) {
    var target = 0x2100 + v, reg = null;
    for (var i = 0; i < window.SNES.registers.length; i++)
      if (window.SNES.registers[i].addr === target) { reg = window.SNES.registers[i]; break; }
    if (reg) return [{ level: "info",
      en: "Targets $" + target.toString(16).toUpperCase() + " — " + reg.mnem + " (" + reg.title.en + ").",
      de: "Zielt auf $" + target.toString(16).toUpperCase() + " — " + reg.mnem + " (" + reg.title.de + ")." }];
    return [{ level: "warn",
      en: "No known register at $" + target.toString(16).toUpperCase() + " — the transfer would write into the void (open bus).",
      de: "Kein bekanntes Register bei $" + target.toString(16).toUpperCase() + " — der Transfer würde ins Leere schreiben (Open Bus)." }];
  }
},

{ addr: 0x4302, mnem: "A1TxL", group: "dma", access: "W", size: 8, timing: "dma_setup",
  title: { en: "A-bus address low (channel x: $43x2)", de: "A-Bus-Adresse Low (Kanal x: $43x2)" },
  desc: { en: "Bits 0–7 of the 24-bit source (or destination for B→A) address in CPU memory: your ROM data or WRAM buffer.", de: "Bits 0–7 der 24-Bit-Quelladresse (bzw. Ziel bei B→A) im CPU-Speicher: deine ROM-Daten oder dein WRAM-Puffer." },
  fields: [ { bits: [7,0], name: { en: "Address bits 0–7", de: "Adress-Bits 0–7" }, fmt: { type: "raw" } } ],
  warnings: [
    { level: "info", en: "After a DMA, this register pair holds the address AFTER the last byte — reusable for chained transfers.",
      de: "Nach einem DMA steht hier die Adresse HINTER dem letzten Byte — nutzbar für verkettete Transfers." }
  ]
},

{ addr: 0x4303, mnem: "A1TxH", group: "dma", access: "W", size: 8, timing: "dma_setup",
  title: { en: "A-bus address high (channel x: $43x3)", de: "A-Bus-Adresse High (Kanal x: $43x3)" },
  desc: { en: "Bits 8–15 of the A-bus address.", de: "Bits 8–15 der A-Bus-Adresse." },
  fields: [ { bits: [7,0], name: { en: "Address bits 8–15", de: "Adress-Bits 8–15" }, fmt: { type: "raw" } } ],
  warnings: []
},

{ addr: 0x4304, mnem: "A1Bx", group: "dma", access: "W", size: 8, timing: "dma_setup",
  title: { en: "A-bus bank (channel x: $43x4)", de: "A-Bus-Bank (Kanal x: $43x4)" },
  desc: {
    en: "Bank byte of the A-bus address ($7E = WRAM, your ROM banks, …). For HDMA: the bank of the TABLE. Note: the A-bus address does not wrap into the next bank — a DMA crossing $FFFF wraps within the same bank.",
    de: "Bank-Byte der A-Bus-Adresse ($7E = WRAM, deine ROM-Bänke, …). Bei HDMA: die Bank der TABELLE. Achtung: Die A-Bus-Adresse läuft nicht in die nächste Bank — ein DMA über $FFFF wickelt innerhalb derselben Bank um.",
  },
  fields: [ { bits: [7,0], name: { en: "Bank", de: "Bank" }, fmt: { type: "raw" } } ],
  warnings: [
    { level: "warn", en: "DMA cannot read the B bus side ($21xx), $43xx or $42xx via the A bus — those reads return open bus.",
      de: "DMA kann über den A-Bus nicht die B-Bus-Seite ($21xx), $43xx oder $42xx lesen — solche Reads liefern Open Bus." }
  ]
},

{ addr: 0x4305, mnem: "DASxL", group: "dma", access: "W", size: 8, timing: "dma_setup",
  title: { en: "Byte count low / HDMA indirect address (channel x: $43x5)", de: "Byte-Anzahl Low / HDMA-Indirektadresse (Kanal x: $43x5)" },
  desc: {
    en: "General DMA: bits 0–7 of the 16-bit byte count. HDMA indirect mode: the hardware writes the current data pointer here — you don't set it. A count of $0000 means 65536 bytes!",
    de: "General-DMA: Bits 0–7 der 16-Bit-Byte-Anzahl. HDMA-Indirekt-Modus: Die Hardware schreibt hier den aktuellen Datenzeiger hin — du setzt ihn nicht. Anzahl $0000 bedeutet 65536 Bytes!"
  },
  fields: [ { bits: [7,0], name: { en: "Count bits 0–7", de: "Anzahl-Bits 0–7" }, fmt: { type: "raw" } } ],
  warnings: [
    { level: "warn", en: "The count decrements during transfer — set it again before every DMA, it is NOT reloaded automatically.",
      de: "Die Anzahl zählt beim Transfer runter — vor jedem DMA neu setzen, sie wird NICHT automatisch neu geladen." }
  ]
},

{ addr: 0x4306, mnem: "DASxH", group: "dma", access: "W", size: 8, timing: "dma_setup",
  title: { en: "Byte count high (channel x: $43x6)", de: "Byte-Anzahl High (Kanal x: $43x6)" },
  desc: { en: "Bits 8–15 of the DMA byte count.", de: "Bits 8–15 der DMA-Byte-Anzahl." },
  fields: [ { bits: [7,0], name: { en: "Count bits 8–15", de: "Anzahl-Bits 8–15" }, fmt: { type: "raw" } } ],
  warnings: []
},

{ addr: 0x4307, mnem: "DASBx", group: "dma", access: "W", size: 8, timing: "dma_setup",
  title: { en: "HDMA indirect data bank (channel x: $43x7)", de: "HDMA-Indirekt-Datenbank (Kanal x: $43x7)" },
  desc: { en: "Only for indirect HDMA (DMAPx bit 6 = 1): the bank of the data the table pointers point to. All pointers of one channel share this bank.", de: "Nur für indirektes HDMA (DMAPx Bit 6 = 1): die Bank der Daten, auf die die Tabellen-Zeiger zeigen. Alle Zeiger eines Kanals teilen sich diese Bank." },
  fields: [ { bits: [7,0], name: { en: "Bank", de: "Bank" }, fmt: { type: "raw" } } ],
  warnings: []
},

{ addr: 0x4308, mnem: "A2AxL", group: "dma", access: "W", size: 8, timing: "dma_setup",
  title: { en: "HDMA table current address low (channel x: $43x8)", de: "HDMA-Tabellen-Laufadresse Low (Kanal x: $43x8)" },
  desc: { en: "The hardware's working pointer into the HDMA table. It's loaded from A1Tx at frame start — normally you never touch it (debug/status only).", de: "Der Arbeitszeiger der Hardware in die HDMA-Tabelle. Wird zu Frame-Beginn aus A1Tx geladen — normalerweise nie anfassen (nur Debug/Status)." },
  fields: [ { bits: [7,0], name: { en: "Address bits 0–7", de: "Adress-Bits 0–7" }, fmt: { type: "raw" } } ],
  warnings: []
},

{ addr: 0x4309, mnem: "A2AxH", group: "dma", access: "W", size: 8, timing: "dma_setup",
  title: { en: "HDMA table current address high (channel x: $43x9)", de: "HDMA-Tabellen-Laufadresse High (Kanal x: $43x9)" },
  desc: { en: "High byte of the HDMA working pointer.", de: "High-Byte des HDMA-Arbeitszeigers." },
  fields: [ { bits: [7,0], name: { en: "Address bits 8–15", de: "Adress-Bits 8–15" }, fmt: { type: "raw" } } ],
  warnings: []
},

{ addr: 0x430A, mnem: "NLTRx", group: "dma", access: "W", size: 8, timing: "dma_setup",
  title: { en: "HDMA line counter (channel x: $43xA)", de: "HDMA-Zeilenzähler (Kanal x: $43xA)" },
  desc: {
    en: "The hardware's per-channel line counter, loaded from the table entries. Table format: each entry starts with one of these bytes — repeat off: write once, then wait N lines; repeat on: write EVERY line for N lines. $00 in the table ends the channel for this frame.",
    de: "Der Zeilenzähler der Hardware pro Kanal, geladen aus den Tabelleneinträgen. Tabellenformat: Jeder Eintrag beginnt mit so einem Byte — Repeat aus: einmal schreiben, dann N Zeilen warten; Repeat an: JEDE Zeile schreiben, N Zeilen lang. $00 in der Tabelle beendet den Kanal für dieses Frame."
  },
  fields: [
    { bits: [7,7], name: { en: "Repeat", de: "Repeat" },
      values: { 0: { en: "write once, then wait", de: "einmal schreiben, dann warten" },
                1: { en: "write every scanline", de: "jede Scanline schreiben" } } },
    { bits: [6,0], name: { en: "Line count", de: "Zeilenanzahl" },
      fmt: { type: "raw", label: { en: "1–127 lines ($80 in a table = 128 lines repeat)", de: "1–127 Zeilen ($80 in einer Tabelle = 128 Zeilen Repeat)" } } }
  ],
  warnings: [
    { level: "info", en: "You normally write this VALUE into your HDMA table in ROM/WRAM, not into the register — the hardware loads it from there.",
      de: "Diesen WERT schreibt man normalerweise in seine HDMA-Tabelle im ROM/WRAM, nicht ins Register — die Hardware lädt ihn von dort." }
  ]
}

);
