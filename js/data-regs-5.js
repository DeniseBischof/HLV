// SNES registers: APU ports ($2140–$2143), CPU I/O ($4200–$4217), joypads ($4218+).
window.SNES.registers.push(

// ---------- APU ports ----------
{ addr: 0x2140, mnem: "APUIO0", group: "apu", access: "W", size: 8, timing: "anytime",
  title: { en: "APU mailbox port 0", de: "APU-Mailbox-Port 0" },
  desc: {
    en: "One of 4 mailbox bytes between the CPU and the SPC700 sound CPU — the ONLY connection between them. What you write appears on the SPC's side ($F4); what you read is what the SPC wrote. There are no interrupts: both sides poll and follow a handshake protocol you define (or the boot ROM defines).",
    de: "Eines von 4 Mailbox-Bytes zwischen CPU und SPC700-Sound-CPU — die EINZIGE Verbindung zwischen beiden. Was du schreibst, erscheint auf SPC-Seite ($F4); was du liest, hat der SPC geschrieben. Es gibt keine Interrupts: Beide Seiten pollen und folgen einem Handshake-Protokoll, das du (oder das Boot-ROM) definierst."
  },
  fields: [ { bits: [7,0], name: { en: "Mailbox byte", de: "Mailbox-Byte" }, fmt: { type: "raw" } } ],
  warnings: [
    { level: "info", en: "Boot handshake: after reset the SPC700 boot ROM writes $AA to port 0 and $BB to port 1 — wait for that before uploading your sound driver.",
      de: "Boot-Handshake: Nach Reset schreibt das SPC700-Boot-ROM $AA auf Port 0 und $BB auf Port 1 — darauf warten, bevor du deinen Sound-Treiber hochlädst." },
    { level: "warn", en: "Reading back what YOU wrote is impossible — read always returns the SPC side. Desynced handshakes hang both CPUs in polling loops; that's the classic 'game freezes at boot' bug.",
      de: "Zurücklesen, was DU geschrieben hast, geht nicht — Lesen liefert immer die SPC-Seite. Desynchrone Handshakes hängen beide CPUs in Poll-Schleifen; der Klassiker hinter 'Spiel friert beim Boot ein'." }
  ]
},
{ addr: 0x2141, mnem: "APUIO1", group: "apu", access: "W", size: 8, timing: "anytime",
  title: { en: "APU mailbox port 1", de: "APU-Mailbox-Port 1" },
  desc: { en: "Second mailbox byte (SPC side: $F5). Often used for command codes while port 0 carries the handshake counter.", de: "Zweites Mailbox-Byte (SPC-Seite: $F5). Oft für Kommando-Codes genutzt, während Port 0 den Handshake-Zähler trägt." },
  fields: [ { bits: [7,0], name: { en: "Mailbox byte", de: "Mailbox-Byte" }, fmt: { type: "raw" } } ],
  warnings: []
},
{ addr: 0x2142, mnem: "APUIO2", group: "apu", access: "W", size: 8, timing: "anytime",
  title: { en: "APU mailbox port 2", de: "APU-Mailbox-Port 2" },
  desc: { en: "Third mailbox byte (SPC side: $F6). In the boot-ROM upload protocol: low byte of the target address.", de: "Drittes Mailbox-Byte (SPC-Seite: $F6). Im Boot-ROM-Upload-Protokoll: Low-Byte der Zieladresse." },
  fields: [ { bits: [7,0], name: { en: "Mailbox byte", de: "Mailbox-Byte" }, fmt: { type: "raw" } } ],
  warnings: []
},
{ addr: 0x2143, mnem: "APUIO3", group: "apu", access: "W", size: 8, timing: "anytime",
  title: { en: "APU mailbox port 3", de: "APU-Mailbox-Port 3" },
  desc: { en: "Fourth mailbox byte (SPC side: $F7). In the boot-ROM upload protocol: high byte of the target address. The four ports are mirrored across $2140–$217F.", de: "Viertes Mailbox-Byte (SPC-Seite: $F7). Im Boot-ROM-Upload-Protokoll: High-Byte der Zieladresse. Die vier Ports spiegeln sich über $2140–$217F." },
  fields: [ { bits: [7,0], name: { en: "Mailbox byte", de: "Mailbox-Byte" }, fmt: { type: "raw" } } ],
  warnings: []
},

// ---------- CPU I/O: interrupts, timers, system ----------
{ addr: 0x4200, mnem: "NMITIMEN", group: "cpuio", access: "W", size: 8, timing: "anytime",
  title: { en: "Interrupt & auto-joypad enable", de: "Interrupt- & Auto-Joypad-Aktivierung" },
  desc: {
    en: "The interrupt master switch: NMI at VBlank start (your once-per-frame heartbeat), H/V-timer IRQs for raster effects, and the automatic joypad read.",
    de: "Der Interrupt-Hauptschalter: NMI zu VBlank-Beginn (dein Einmal-pro-Frame-Herzschlag), H/V-Timer-IRQs für Raster-Effekte und das automatische Joypad-Auslesen."
  },
  fields: [
    { bits: [7,7], name: { en: "NMI at VBlank", de: "NMI bei VBlank" }, values: { 0: { en: "off", de: "aus" }, 1: { en: "on — fires every frame", de: "an — feuert jedes Frame" } } },
    { bits: [5,5], name: { en: "V-count IRQ", de: "V-Count-IRQ" }, values: { 0: { en: "off", de: "aus" }, 1: { en: "IRQ when V = VTIME", de: "IRQ wenn V = VTIME" } } },
    { bits: [4,4], name: { en: "H-count IRQ", de: "H-Count-IRQ" }, values: { 0: { en: "off", de: "aus" }, 1: { en: "IRQ when H = HTIME", de: "IRQ wenn H = HTIME" } } },
    { bits: [0,0], name: { en: "Auto joypad read", de: "Auto-Joypad-Read" }, values: { 0: { en: "off — read $4016/17 manually", de: "aus — $4016/17 manuell lesen" }, 1: { en: "on — results land in JOY1–JOY4", de: "an — Ergebnisse landen in JOY1–JOY4" } } }
  ],
  warnings: [
    { level: "warn", en: "Enable NMI only after your init is done — an NMI mid-initialization with a half-built handler crashes.",
      de: "NMI erst aktivieren, wenn deine Initialisierung fertig ist — ein NMI mitten im Init mit halbfertigem Handler crasht." },
    { level: "warn", en: "Auto-read takes ~3 scanlines after VBlank starts. Reading JOY1 too early in the NMI returns garbage — check HVBJOY bit 0 first.",
      de: "Auto-Read braucht ~3 Scanlines nach VBlank-Beginn. JOY1 zu früh im NMI lesen liefert Müll — vorher HVBJOY Bit 0 prüfen." }
  ]
},
{ addr: 0x4201, mnem: "WRIO", group: "cpuio", access: "W", size: 8, timing: "anytime",
  title: { en: "Programmable I/O port (out)", de: "Programmierbarer I/O-Port (out)" },
  desc: { en: "General-purpose output latch on the controller ports. Bit 7 doubles as the H/V counter latch enable — it must stay 1 or SLHV/OPHCT/OPVCT stop working.", de: "Universeller Ausgangs-Latch an den Controller-Ports. Bit 7 ist zugleich das Latch-Enable der H/V-Zähler — es muss 1 bleiben, sonst funktionieren SLHV/OPHCT/OPVCT nicht." },
  fields: [
    { bits: [7,7], name: { en: "Port 2 IOBit / counter latch enable", de: "Port-2-IOBit / Zähler-Latch-Enable" }, values: { 0: { en: "low — counters can't latch!", de: "low — Zähler können nicht latchen!" }, 1: { en: "high (default)", de: "high (Standard)" } } },
    { bits: [6,6], name: { en: "Port 1 IOBit", de: "Port-1-IOBit" }, fmt: { type: "raw" } }
  ],
  warnings: []
},
{ addr: 0x4202, mnem: "WRMPYA", group: "cpuio", access: "W", size: 8, timing: "anytime",
  title: { en: "Multiplicand (unsigned 8-bit)", de: "Multiplikand (unsigned 8-Bit)" },
  desc: { en: "First operand of the CPU's unsigned 8×8 multiplier. Writing WRMPYB starts the multiply; result in RDMPY after 8 CPU cycles.", de: "Erster Operand des unsigned 8×8-Multiplizierers der CPU. Das Schreiben von WRMPYB startet die Multiplikation; Ergebnis nach 8 CPU-Zyklen in RDMPY." },
  fields: [ { bits: [7,0], name: { en: "Multiplicand", de: "Multiplikand" }, fmt: { type: "raw" } } ],
  warnings: [
    { level: "info", en: "For signed 16×8 math the PPU multiplier (M7A/M7B → MPY) is faster and free.", de: "Für signed 16×8 ist der PPU-Multiplizierer (M7A/M7B → MPY) schneller und gratis." }
  ]
},
{ addr: 0x4203, mnem: "WRMPYB", group: "cpuio", access: "W", size: 8, timing: "anytime",
  title: { en: "Multiplier — write starts the multiply", de: "Multiplikator — Schreiben startet die Multiplikation" },
  desc: { en: "Second operand. Don't read RDMPY within 8 cycles (in practice: one or two instructions in between).", de: "Zweiter Operand. RDMPY nicht innerhalb von 8 Zyklen lesen (praktisch: ein, zwei Befehle dazwischen)." },
  fields: [ { bits: [7,0], name: { en: "Multiplier", de: "Multiplikator" }, fmt: { type: "raw" } } ],
  warnings: []
},
{ addr: 0x4204, mnem: "WRDIVL", group: "cpuio", access: "W", size: 8, timing: "anytime",
  title: { en: "Dividend low (unsigned 16-bit)", de: "Dividend Low (unsigned 16-Bit)" },
  desc: { en: "Low byte of the 16-bit dividend for the hardware divider.", de: "Low-Byte des 16-Bit-Dividenden für den Hardware-Teiler." },
  fields: [ { bits: [7,0], name: { en: "Dividend bits 0–7", de: "Dividend-Bits 0–7" }, fmt: { type: "raw" } } ],
  warnings: []
},
{ addr: 0x4205, mnem: "WRDIVH", group: "cpuio", access: "W", size: 8, timing: "anytime",
  title: { en: "Dividend high", de: "Dividend High" },
  desc: { en: "High byte of the dividend.", de: "High-Byte des Dividenden." },
  fields: [ { bits: [7,0], name: { en: "Dividend bits 8–15", de: "Dividend-Bits 8–15" }, fmt: { type: "raw" } } ],
  warnings: []
},
{ addr: 0x4206, mnem: "WRDIVB", group: "cpuio", access: "W", size: 8, timing: "anytime",
  title: { en: "Divisor — write starts the division", de: "Divisor — Schreiben startet die Division" },
  desc: { en: "8-bit divisor. Quotient lands in RDDIV, remainder in RDMPY, after 16 CPU cycles. Division by 0 yields quotient $FFFF, remainder = dividend.", de: "8-Bit-Divisor. Quotient landet nach 16 CPU-Zyklen in RDDIV, Rest in RDMPY. Division durch 0 ergibt Quotient $FFFF, Rest = Dividend." },
  fields: [ { bits: [7,0], name: { en: "Divisor", de: "Divisor" }, fmt: { type: "raw" } } ],
  warnings: [
    { level: "warn", en: "16 cycles is longer than one instruction — insert filler ops or do other work before reading RDDIV.",
      de: "16 Zyklen sind länger als ein Befehl — Füll-Ops einbauen oder andere Arbeit erledigen, bevor du RDDIV liest." }
  ]
},
{ addr: 0x4207, mnem: "HTIMEL", group: "cpuio", access: "W", size: 8, timing: "anytime",
  title: { en: "H-IRQ target, low (0–339)", de: "H-IRQ-Ziel, Low (0–339)" },
  desc: { en: "Horizontal dot position for the H-count IRQ (with NMITIMEN bit 4). THE tool for mid-scanline effects.", de: "Horizontale Dot-Position für den H-Count-IRQ (mit NMITIMEN Bit 4). DAS Werkzeug für Effekte mitten in der Scanline." },
  fields: [ { bits: [7,0], name: { en: "H target bits 0–7", de: "H-Ziel-Bits 0–7" }, fmt: { type: "raw" } } ],
  warnings: []
},
{ addr: 0x4208, mnem: "HTIMEH", group: "cpuio", access: "W", size: 8, timing: "anytime",
  title: { en: "H-IRQ target, bit 8", de: "H-IRQ-Ziel, Bit 8" },
  desc: { en: "Bit 8 of the horizontal IRQ position.", de: "Bit 8 der horizontalen IRQ-Position." },
  fields: [ { bits: [0,0], name: { en: "H target bit 8", de: "H-Ziel-Bit 8" }, fmt: { type: "raw" } } ],
  warnings: []
},
{ addr: 0x4209, mnem: "VTIMEL", group: "cpuio", access: "W", size: 8, timing: "anytime",
  title: { en: "V-IRQ target, low (0–261)", de: "V-IRQ-Ziel, Low (0–261)" },
  desc: { en: "Scanline for the V-count IRQ — e.g. to split the screen at a specific line without HDMA.", de: "Scanline für den V-Count-IRQ — z. B. um den Screen ohne HDMA an einer bestimmten Zeile zu teilen." },
  fields: [ { bits: [7,0], name: { en: "V target bits 0–7", de: "V-Ziel-Bits 0–7" }, fmt: { type: "raw" } } ],
  warnings: []
},
{ addr: 0x420A, mnem: "VTIMEH", group: "cpuio", access: "W", size: 8, timing: "anytime",
  title: { en: "V-IRQ target, bit 8", de: "V-IRQ-Ziel, Bit 8" },
  desc: { en: "Bit 8 of the vertical IRQ position.", de: "Bit 8 der vertikalen IRQ-Position." },
  fields: [ { bits: [0,0], name: { en: "V target bit 8", de: "V-Ziel-Bit 8" }, fmt: { type: "raw" } } ],
  warnings: []
},
{ addr: 0x420D, mnem: "MEMSEL", group: "cpuio", access: "W", size: 8, timing: "anytime",
  title: { en: "FastROM enable", de: "FastROM-Aktivierung" },
  desc: { en: "Bit 0 = 1 switches ROM access in banks $80+ to 3.58 MHz instead of 2.68 MHz — if your cartridge is wired for it and your code runs from the fast mirrors.", de: "Bit 0 = 1 schaltet ROM-Zugriffe in den Bänken $80+ auf 3,58 MHz statt 2,68 MHz — sofern das Modul dafür verdrahtet ist und dein Code aus den schnellen Spiegeln läuft." },
  fields: [
    { bits: [0,0], name: { en: "ROM speed", de: "ROM-Geschwindigkeit" },
      values: { 0: { en: "SlowROM everywhere (2.68 MHz)", de: "überall SlowROM (2,68 MHz)" }, 1: { en: "FastROM in banks $80–$FF (3.58 MHz)", de: "FastROM in Bänken $80–$FF (3,58 MHz)" } } }
  ],
  warnings: [
    { level: "warn", en: "Setting the bit alone does nothing if you keep executing from banks $00–$7D — jump to the $80+ mirror of your code.",
      de: "Nur das Bit zu setzen bringt nichts, wenn du weiter aus Bänken $00–$7D ausführst — in den $80+-Spiegel deines Codes springen." }
  ]
},
{ addr: 0x4210, mnem: "RDNMI", group: "cpuio", access: "R", size: 8, timing: "read_any",
  title: { en: "NMI flag (read to acknowledge)", de: "NMI-Flag (Lesen quittiert)" },
  desc: { en: "Bit 7 is set at VBlank start and CLEARED BY READING. Your NMI handler must read this register, or on real hardware the next NMI may be swallowed.", de: "Bit 7 wird zu VBlank-Beginn gesetzt und DURCH LESEN GELÖSCHT. Dein NMI-Handler muss dieses Register lesen, sonst kann auf echter Hardware der nächste NMI verschluckt werden." },
  fields: [
    { bits: [7,7], name: { en: "NMI occurred", de: "NMI aufgetreten" }, values: { 0: { en: "no", de: "nein" }, 1: { en: "yes (cleared by this read)", de: "ja (durch diesen Read gelöscht)" } } },
    { bits: [3,0], name: { en: "CPU version", de: "CPU-Version" }, fmt: { type: "raw" } }
  ],
  warnings: []
},
{ addr: 0x4211, mnem: "TIMEUP", group: "cpuio", access: "R", size: 8, timing: "read_any",
  title: { en: "H/V-IRQ flag (read to acknowledge)", de: "H/V-IRQ-Flag (Lesen quittiert)" },
  desc: { en: "Bit 7 = timer IRQ fired; reading clears it. Your IRQ handler MUST read this or the IRQ line stays asserted and re-fires forever.", de: "Bit 7 = Timer-IRQ ausgelöst; Lesen löscht es. Dein IRQ-Handler MUSS das lesen, sonst bleibt die IRQ-Leitung aktiv und feuert endlos neu." },
  fields: [ { bits: [7,7], name: { en: "IRQ flag", de: "IRQ-Flag" }, values: { 0: { en: "—", de: "—" }, 1: { en: "timer IRQ pending", de: "Timer-IRQ anstehend" } } } ],
  warnings: []
},
{ addr: 0x4212, mnem: "HVBJOY", group: "cpuio", access: "R", size: 8, timing: "read_any",
  title: { en: "VBlank/HBlank/auto-read status", de: "VBlank-/HBlank-/Auto-Read-Status" },
  desc: { en: "Live status bits: are we in VBlank? In HBlank? Is the auto joypad read still running? Poll bit 0 before reading JOY1–4.", de: "Live-Statusbits: Sind wir im VBlank? Im HBlank? Läuft das Auto-Joypad-Read noch? Bit 0 pollen, bevor du JOY1–4 liest." },
  fields: [
    { bits: [7,7], name: { en: "VBlank", de: "VBlank" }, values: { 0: { en: "active display", de: "aktives Bild" }, 1: { en: "in VBlank", de: "im VBlank" } } },
    { bits: [6,6], name: { en: "HBlank", de: "HBlank" }, values: { 0: { en: "drawing pixels", de: "zeichnet Pixel" }, 1: { en: "in HBlank", de: "im HBlank" } } },
    { bits: [0,0], name: { en: "Auto joypad read busy", de: "Auto-Joypad-Read läuft" }, values: { 0: { en: "done — JOYx valid", de: "fertig — JOYx gültig" }, 1: { en: "busy — don't read JOYx yet", de: "läuft — JOYx noch nicht lesen" } } }
  ],
  warnings: []
},
{ addr: 0x4213, mnem: "RDIO", group: "cpuio", access: "R", size: 8, timing: "read_any",
  title: { en: "Programmable I/O port (in)", de: "Programmierbarer I/O-Port (in)" },
  desc: { en: "Input side of WRIO — reads the IOBit lines on the controller ports (Super Scope, special peripherals).", de: "Eingangsseite von WRIO — liest die IOBit-Leitungen der Controller-Ports (Super Scope, Spezial-Peripherie)." },
  fields: [ { bits: [7,0], name: { en: "Port bits", de: "Port-Bits" }, fmt: { type: "raw" } } ],
  warnings: []
},
{ addr: 0x4214, mnem: "RDDIVL", group: "cpuio", access: "R", size: 8, timing: "read_any",
  title: { en: "Division quotient, low", de: "Divisions-Quotient, Low" },
  desc: { en: "Low byte of the 16-bit quotient from WRDIV ÷ WRDIVB.", de: "Low-Byte des 16-Bit-Quotienten aus WRDIV ÷ WRDIVB." },
  fields: [ { bits: [7,0], name: { en: "Quotient bits 0–7", de: "Quotient-Bits 0–7" }, fmt: { type: "raw" } } ],
  warnings: []
},
{ addr: 0x4215, mnem: "RDDIVH", group: "cpuio", access: "R", size: 8, timing: "read_any",
  title: { en: "Division quotient, high", de: "Divisions-Quotient, High" },
  desc: { en: "High byte of the quotient.", de: "High-Byte des Quotienten." },
  fields: [ { bits: [7,0], name: { en: "Quotient bits 8–15", de: "Quotient-Bits 8–15" }, fmt: { type: "raw" } } ],
  warnings: []
},
{ addr: 0x4216, mnem: "RDMPYL", group: "cpuio", access: "R", size: 8, timing: "read_any",
  title: { en: "Multiply result / division remainder, low", de: "Multiplikations-Ergebnis / Divisions-Rest, Low" },
  desc: { en: "Low byte of WRMPYA × WRMPYB — or of the division remainder. Same register pair for both units!", de: "Low-Byte von WRMPYA × WRMPYB — oder des Divisionsrests. Dasselbe Registerpaar für beide Einheiten!" },
  fields: [ { bits: [7,0], name: { en: "Result bits 0–7", de: "Ergebnis-Bits 0–7" }, fmt: { type: "raw" } } ],
  warnings: [
    { level: "warn", en: "A division overwrites the multiply result (and vice versa) — read before starting the other operation.",
      de: "Eine Division überschreibt das Multiplikations-Ergebnis (und umgekehrt) — erst lesen, dann die andere Operation starten." }
  ]
},
{ addr: 0x4217, mnem: "RDMPYH", group: "cpuio", access: "R", size: 8, timing: "read_any",
  title: { en: "Multiply result / remainder, high", de: "Multiplikations-Ergebnis / Rest, High" },
  desc: { en: "High byte of the multiply result / division remainder.", de: "High-Byte von Multiplikations-Ergebnis / Divisionsrest." },
  fields: [ { bits: [7,0], name: { en: "Result bits 8–15", de: "Ergebnis-Bits 8–15" }, fmt: { type: "raw" } } ],
  warnings: []
}

);

// Joypad auto-read result registers.
(function () {
  var joyWarn = [
    { level: "warn", en: "Only valid when auto-read is on (NMITIMEN bit 0) AND finished (HVBJOY bit 0 = 0).",
      de: "Nur gültig, wenn Auto-Read an ist (NMITIMEN Bit 0) UND fertig (HVBJOY Bit 0 = 0)." }
  ];
  var lowFields = [
    { bits: [7,7], name: { en: "A", de: "A" }, fmt: { type: "raw" } },
    { bits: [6,6], name: { en: "X", de: "X" }, fmt: { type: "raw" } },
    { bits: [5,5], name: { en: "L", de: "L" }, fmt: { type: "raw" } },
    { bits: [4,4], name: { en: "R", de: "R" }, fmt: { type: "raw" } },
    { bits: [3,0], name: { en: "Controller ID", de: "Controller-ID" }, fmt: { type: "raw", label: { en: "0 = standard pad", de: "0 = Standard-Pad" } } }
  ];
  var highFields = [
    { bits: [7,7], name: { en: "B", de: "B" }, fmt: { type: "raw" } },
    { bits: [6,6], name: { en: "Y", de: "Y" }, fmt: { type: "raw" } },
    { bits: [5,5], name: { en: "Select", de: "Select" }, fmt: { type: "raw" } },
    { bits: [4,4], name: { en: "Start", de: "Start" }, fmt: { type: "raw" } },
    { bits: [3,3], name: { en: "Up", de: "Hoch" }, fmt: { type: "raw" } },
    { bits: [2,2], name: { en: "Down", de: "Runter" }, fmt: { type: "raw" } },
    { bits: [1,1], name: { en: "Left", de: "Links" }, fmt: { type: "raw" } },
    { bits: [0,0], name: { en: "Right", de: "Rechts" }, fmt: { type: "raw" } }
  ];
  [[0x4218, "JOY1L", 1, "L"], [0x4219, "JOY1H", 1, "H"], [0x421A, "JOY2L", 2, "L"], [0x421B, "JOY2H", 2, "H"],
   [0x421C, "JOY3L", 3, "L"], [0x421D, "JOY3H", 3, "H"], [0x421E, "JOY4L", 4, "L"], [0x421F, "JOY4H", 4, "H"]].forEach(function (d) {
    var hi = d[3] === "H";
    window.SNES.registers.push({
      addr: d[0], mnem: d[1], group: "joy", access: "R", size: 8, timing: "read_any",
      title: hi ? { en: "Joypad " + d[2] + " buttons (high: B/Y/Select/Start/D-pad)", de: "Joypad " + d[2] + " Tasten (High: B/Y/Select/Start/Steuerkreuz)" }
                : { en: "Joypad " + d[2] + " buttons (low: A/X/L/R + ID)", de: "Joypad " + d[2] + " Tasten (Low: A/X/L/R + ID)" },
      desc: d[2] > 2
        ? { en: "Controller " + d[2] + " — only exists with a Multitap.", de: "Controller " + d[2] + " — existiert nur mit Multitap." }
        : { en: "Auto-read result for controller " + d[2] + ". 1 = pressed. Read both bytes as a 16-bit word for easy edge detection (pressed = now & ~last).",
            de: "Auto-Read-Ergebnis für Controller " + d[2] + ". 1 = gedrückt. Beide Bytes als 16-Bit-Wort lesen für einfache Flankenerkennung (neu gedrückt = jetzt & ~vorher)." },
      fields: hi ? highFields : lowFields,
      warnings: joyWarn
    });
  });
})();
