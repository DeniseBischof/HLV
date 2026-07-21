# Hardware Inspector

https://denisebischof.github.io/HLV/

Interactive retro-hardware register reference & value simulator. Static site — no build step, no dependencies. Ships with two systems, switchable via tabs: **SNES** (complete: PPU, WRAM port, DMA/HDMA, APU ports, CPU I/O, joypads) and **Game Boy** (LCD, scrolling/window, palettes, OAM DMA, timer, interrupts, joypad).

**Open it:** double-click `index.html`, or serve the folder (`python -m http.server`).

## What it does

- **All PPU registers ($2100–$213F)**, grouped by function: display, BG modes/tilemaps, scrolling, VRAM, Mode 7, sprites/OAM, colors/CGRAM, windows, screen designation, color math, status ports. Plus the **WRAM port ($2180–$2183)** and **DMA/HDMA ($420B/$420C, $43x0–$43xA)** — the BBADx page even tells you live which $21xx register your value targets.
- **Value simulator** per register: type the hex value you're about to send (or click bits / pick from dropdowns) and see it decoded into plain language — "Mode 1, BG3 priority high, BG1 tiles 16×16".
- **Pitfall warnings**: the "error messages" the hardware never gives you — silently dropped VRAM writes, write-twice latch desyncs, BGR vs RGB, open bus reads, dummy-read quirks.
- **Live lints**: suspicious values get flagged (e.g. INIDISP `$00` = "screen looks black but VRAM is still locked").
- **Hardware limits page**: 128 sprites, 32/scanline, 34 tile slivers, 64 KB VRAM, DMA budget per VBlank, …
- **Layer view**: an example scene exploded into the real PPU priority slots as a 3D stack, with the composited result, the exact priority ladder per BG mode, parallax demo, and the live BGMODE/TM/SETINI values.
- **Setup planner**: drag & drop tilemaps/tilesets/sprite tiles onto layer slots; auto-placement in a visual 64 KB VRAM bar (blocks draggable, collision warnings), live register writes incl. copy-as-assembly, saved in localStorage with JSON export/import.
- **Bilingual**: English default, German toggle (top right), persisted in localStorage.

## Structure

```
index.html          page shell
css/style.css       dark console theme
js/data-core.js     groups, timing rules, hardware limits, UI strings
js/data-regs-*.js   register database (bit fields, warnings, lints) — bilingual
js/layers.js        layer view (3D stack, priority ladders, composite)
js/planner.js       setup planner (drag & drop, VRAM layout, register output)
js/app.js           routing, sidebar/search, bit-level simulator
```

## Adding registers or whole systems

Registers: push an object into the system's `registers` array (see `js/data-regs-1.js` for the schema): address, mnemonic, group, access type (`W`, `R`, `W2` write-twice, `R2`), bit fields with enum values or numeric formatters, warnings, and an optional `lint(value)` function for dynamic checks.

Systems: one data file defining `{ meta: {id, name, features}, groups, timings, registers, limits, overview }` (see `js/data-gb.js` for a complete example), registered in the `SYSTEMS` list at the top of `js/app.js` plus a script tag in `index.html`. The sidebar, simulator, warnings, limits and overview pages all render from that data. `features: {layers, planner}` gates the SNES-specific visual pages.
