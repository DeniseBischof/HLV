/* SNES Inspector — app logic: system registry, routing, sidebar, value simulator.
   Each system (SNES, Game Boy, …) is a data object: { meta, groups, timings,
   registers, limits, overview }. Adding a system = adding one data file. */
(function () {
  "use strict";
  var SYSTEMS = [window.SNES, window.GB].filter(Boolean);
  SYSTEMS.forEach(function (sys) { sys.registers.sort(function (a, b) { return a.addr - b.addr; }); });

  var sysId = localStorage.getItem("snesSystem") || "snes";
  var S = SYSTEMS.filter(function (s) { return s.meta.id === sysId; })[0] || SYSTEMS[0];
  var lang = localStorage.getItem("snesLang") || "en";
  var values = {};            // "sysid:addr" -> current simulator value
  var FIELD_COLORS = ["--f0","--f1","--f2","--f3","--f4","--f5","--f6","--f7"];

  // ---------- helpers ----------
  function L(t) {
    if (t == null) return "";
    if (typeof t === "string") return t;
    return t[lang] != null ? t[lang] : t.en;
  }
  function UI(key) { return L(window.SNES.ui[key]); }
  function hex(n, digits) { return "$" + n.toString(16).toUpperCase().padStart(digits || 2, "0"); }
  function esc(s) { return String(s).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;"); }
  function el(id) { return document.getElementById(id); }
  function vkey(addr) { return S.meta.id + ":" + addr; }
  function regByAddr(a) {
    for (var i = 0; i < S.registers.length; i++) if (S.registers[i].addr === a) return S.registers[i];
    return null;
  }
  function fieldMask(f) {
    var w = f.bits[0] - f.bits[1] + 1;
    return ((w >= 32 ? -1 : (1 << w) - 1) >>> 0) << f.bits[1];
  }
  function getField(reg, f) { return (values[vkey(reg.addr)] >> f.bits[1]) & ((1 << (f.bits[0] - f.bits[1] + 1)) - 1); }
  function setField(reg, f, v) {
    var m = fieldMask(f), k = vkey(reg.addr);
    values[k] = ((values[k] & ~m) | ((v << f.bits[1]) & m)) >>> 0;
  }
  function signExtend(v, w) { var s = 1 << (w - 1); return (v & s) ? v - (1 << w) : v; }

  function fmtFieldValue(f, v) {
    var fmt = f.fmt || {};
    var label = fmt.label ? " — " + L(fmt.label) : "";
    switch (fmt.type) {
      case "shl":     return "<b>" + hex(v << fmt.n, 4) + "</b> (" + v + " × $" + (1 << fmt.n).toString(16).toUpperCase() + ")" + label;
      case "plus1":   return "<b>" + (v + 1) + "</b>" + label;
      case "signed":  return "<b>" + signExtend(v, fmt.w) + "</b>" + label;
      case "fixed88": var sv = signExtend(v, 16); return "<b>" + (sv / 256).toFixed(4) + "</b> (" + hex(v, 4) + " · 8.8 fixed)" + label;
      default:        return "<b>" + v + "</b> (" + hex(v, f.bits[0] > 7 ? 4 : 2) + ")" + label;
    }
  }
  function fieldMeaning(f, v) {
    if (f.values) {
      var m = f.values[v];
      return m ? esc(L(m)) : "<i>" + UI("raw_val") + ": " + v + "</i>";
    }
    return fmtFieldValue(f, v);
  }

  // ---------- system switching ----------
  function renderSysTabs() {
    var host = el("sys-tabs");
    if (!host) return;
    host.innerHTML = SYSTEMS.map(function (sys) {
      return '<button class="sys-tab' + (sys.meta.id === S.meta.id ? " active" : "") + '" data-sys="' + sys.meta.id + '">' + esc(sys.meta.name) + "</button>";
    }).join("");
    host.querySelectorAll(".sys-tab").forEach(function (b) {
      b.onclick = function () { setSystem(b.dataset.sys); };
    });
  }
  function applyFeatureNav() {
    var la = document.querySelector('.topnav a[href="#/layers"]');
    var pl = document.querySelector('.topnav a[href="#/planner"]');
    if (la) la.style.display = S.meta.features.layers ? "" : "none";
    if (pl) pl.style.display = S.meta.features.planner ? "" : "none";
  }
  function setSystem(id) {
    var next = SYSTEMS.filter(function (s) { return s.meta.id === id; })[0];
    if (!next) return;
    S = next;
    localStorage.setItem("snesSystem", id);
    renderSysTabs();
    applyFeatureNav();
    // leave routes that don't exist in this system
    var h = location.hash;
    if ((h.indexOf("#/layers") === 0 && !S.meta.features.layers) ||
        (h.indexOf("#/planner") === 0 && !S.meta.features.planner) ||
        (h.indexOf("#/reg/") === 0 && !regByAddr(currentAddr()))) {
      location.hash = "#/";
    }
    renderSidebar();
    route();
  }

  // ---------- language ----------
  function setLang(l) {
    lang = l;
    localStorage.setItem("snesLang", l);
    el("lang-en").classList.toggle("active", l === "en");
    el("lang-de").classList.toggle("active", l === "de");
    document.documentElement.lang = l;
    document.querySelectorAll("[data-ui]").forEach(function (n) { n.textContent = UI(n.dataset.ui); });
    el("search").placeholder = UI("search_ph");
    renderSidebar();
    route();
  }
  el("lang-en").onclick = function () { setLang("en"); };
  el("lang-de").onclick = function () { setLang("de"); };

  // ---------- sidebar ----------
  function renderSidebar() {
    var q = el("search").value.trim().toLowerCase();
    var host = el("reglist");
    var html = "";
    var current = currentAddr();
    var any = false;
    S.groups.forEach(function (g) {
      var regs = S.registers.filter(function (r) { return r.group === g.id; });
      if (q) {
        regs = regs.filter(function (r) {
          return r.mnem.toLowerCase().indexOf(q) >= 0 ||
                 hex(r.addr, 4).toLowerCase().indexOf(q) >= 0 ||
                 r.addr.toString(16).indexOf(q.replace("$", "")) >= 0 ||
                 L(r.title).toLowerCase().indexOf(q) >= 0;
        });
      }
      if (!regs.length) return;
      any = true;
      html += '<div class="group-title">' + esc(L(g.name)) + "</div>";
      regs.forEach(function (r) {
        html += '<a class="reg-link' + (r.addr === current ? " active" : "") + '" href="#/reg/' + r.addr.toString(16) + '">' +
                '<span class="reg-addr">' + hex(r.addr, 4) + "</span>" +
                '<span class="reg-mnem">' + esc(r.mnem) + "</span>" +
                '<span class="reg-desc-short">' + esc(L(r.title)) + "</span></a>";
      });
    });
    host.innerHTML = any ? html : '<div class="group-title">' + UI("no_results") + "</div>";
  }
  el("search").addEventListener("input", renderSidebar);

  // ---------- routing ----------
  function currentAddr() {
    var m = location.hash.match(/^#\/reg\/([0-9a-fA-F]+)/);
    return m ? parseInt(m[1], 16) : null;
  }
  function route() {
    var h = location.hash || "#/";
    if (h.indexOf("#/reg/") === 0) {
      var r = regByAddr(currentAddr());
      if (r) { renderRegister(r); renderSidebar(); return; }
    }
    if (h === "#/layers" && S.meta.features.layers) {
      (S.meta.id === "gb" ? window.GBLayers : window.SNESLayers).render(el("main"));
      renderSidebar(); return;
    }
    if (h === "#/planner" && S.meta.features.planner) { window.SNESPlanner.render(el("main")); renderSidebar(); return; }
    if (h === "#/limits") { renderLimits(); renderSidebar(); return; }
    renderOverview(); renderSidebar();
  }
  window.addEventListener("hashchange", function () { route(); el("main").scrollIntoView(); });

  // ---------- overview page (data-driven, per system) ----------
  function renderOverview() {
    var t = S.overview;
    var cards = t.cards.map(function (c) {
      return '<div class="buscard"><h3>' + esc(L(c.h)) + '</h3><span class="rng">' + c.rng + "</span><p>" + esc(L(c.p)) + "</p></div>";
    }).join("");
    var links = "";
    if (S.meta.features.layers) links += ' &nbsp;·&nbsp; <a href="#/layers">' + UI("nav_layers") + " →</a>";
    if (S.meta.features.planner) links += ' &nbsp;·&nbsp; <a href="#/planner">' + UI("nav_planner") + " →</a>";
    links += ' &nbsp;·&nbsp; <a href="#/limits">' + UI("nav_limits") + " →</a>";
    el("main").innerHTML =
      '<div class="hero"><h1>' + esc(L(t.title)) + "</h1>" +
      "<p>" + esc(L(t.p1)) + "</p><p>" + esc(L(t.p2)) + "</p></div>" +
      '<div class="buscards">' + cards + "</div>" +
      '<p class="dim">💡 ' + esc(L(t.hint)) + links + "</p>";
  }

  // ---------- limits page ----------
  function renderLimits() {
    var title = { en: "Hard hardware limits", de: "Harte Hardware-Limits" };
    var intro = { en: "The numbers you cannot argue with. Design around them from day one.",
                  de: "Die Zahlen, mit denen man nicht diskutieren kann. Von Tag eins drumherum designen." };
    var html = '<div class="hero"><h1>' + esc(L(title)) + "</h1><p class=\"dim\">" + esc(L(intro)) + "</p></div>";
    S.limits.forEach(function (cat) {
      html += '<h2 class="sec">' + esc(L(cat.cat)) + '</h2><table class="limit-table"><tbody>';
      cat.rows.forEach(function (r) {
        html += "<tr><td>" + esc(L(r.name)) + '</td><td class="val">' + esc(L(r.val)) + '</td><td class="note">' + esc(L(r.note)) + "</td></tr>";
      });
      html += "</tbody></table>";
    });
    el("main").innerHTML = html;
  }

  // ---------- register detail ----------
  function fieldForBit(reg, bit) {
    for (var i = 0; i < reg.fields.length; i++) {
      var f = reg.fields[i];
      if (bit <= f.bits[0] && bit >= f.bits[1]) return i;
    }
    return -1;
  }

  function renderRegister(reg) {
    var k = vkey(reg.addr);
    if (values[k] == null) values[k] = 0;
    var idx = S.registers.indexOf(reg);
    var prev = S.registers[idx - 1], next = S.registers[idx + 1];
    var timing = S.timings[reg.timing];
    var warnIcons = { err: "⛔", warn: "⚠️", info: "💡" };

    var html =
      '<div class="reg-header"><h1><span class="addr">' + hex(reg.addr, 4) + "</span> " + esc(reg.mnem) + "</h1>" +
      '<span class="badge ' + reg.access.toLowerCase() + '">' + UI("access_" + reg.access) + "</span>" +
      (reg.size === 16 ? '<span class="badge">16 bit</span>' : "") +
      "</div>" +
      '<div class="reg-title">' + esc(L(reg.title)) + "</div>" +
      '<p class="reg-desc">' + esc(L(reg.desc)) + "</p>" +
      '<div class="timing-note"><span class="ico">' + timing.icon + '</span><div><b>' + UI("timing_lbl") + ":</b> " + esc(L(timing)) + "</div></div>" +
      '<div class="sim"><div class="sim-head"><h2>' + UI("sim_title") + "</h2>" +
      '<div class="hexin"><label>' + UI("hex_label") + ' $</label><input id="hexval" maxlength="' + (reg.size / 4) + '" value="0"></div></div>' +
      '<div class="bitrow" id="bitrow"></div>' +
      '<div class="fieldlist" id="fieldlist"></div>' +
      '<div class="decoded"><span class="lbl">' + UI("decoded_lbl") + '</span><div id="decoded"></div></div>' +
      '<div id="lintbox"></div></div>';

    if (reg.warnings && reg.warnings.length) {
      html += '<h2 class="sec">' + UI("warnings_sec") + '</h2><div class="warnbox">';
      reg.warnings.forEach(function (w) {
        html += '<div class="warn-item ' + w.level + '"><span class="ico">' + warnIcons[w.level] + "</span><div>" + esc(L(w)) + "</div></div>";
      });
      html += "</div>";
    }

    html += '<div class="pager">' +
      (prev ? '<a href="#/reg/' + prev.addr.toString(16) + '">← ' + hex(prev.addr, 4) + " " + esc(prev.mnem) + "</a>" : "<span></span>") +
      (next ? '<a href="#/reg/' + next.addr.toString(16) + '">' + hex(next.addr, 4) + " " + esc(next.mnem) + " →</a>" : "<span></span>") +
      "</div>";

    el("main").innerHTML = html;

    var hexIn = el("hexval");
    hexIn.value = values[k].toString(16).toUpperCase().padStart(reg.size / 4, "0");
    hexIn.addEventListener("input", function () {
      var v = parseInt(hexIn.value, 16);
      if (isNaN(v)) v = 0;
      values[k] = v & ((reg.size === 16) ? 0xFFFF : 0xFF);
      update(reg, "hex");
    });
    hexIn.addEventListener("blur", function () { update(reg); });

    buildBits(reg);
    buildFields(reg);
    update(reg);
  }

  function buildBits(reg) {
    var host = el("bitrow");
    var html = "";
    for (var b = reg.size - 1; b >= 0; b--) {
      var fi = fieldForBit(reg, b);
      var color = fi >= 0 ? "var(" + FIELD_COLORS[fi % FIELD_COLORS.length] + ")" : "var(--border)";
      html += '<div class="bitcell" data-bit="' + b + '" style="--fc:' + color + '">' +
              '<div class="bitno">' + b + '</div><div class="bitval">0</div></div>';
    }
    host.innerHTML = html;
    host.querySelectorAll(".bitcell").forEach(function (c) {
      c.onclick = function () {
        values[vkey(reg.addr)] ^= (1 << +c.dataset.bit);
        update(reg);
      };
    });
  }

  function buildFields(reg) {
    var host = el("fieldlist");
    var html = "";
    reg.fields.forEach(function (f, i) {
      var color = "var(" + FIELD_COLORS[i % FIELD_COLORS.length] + ")";
      var bitsLbl = f.bits[0] === f.bits[1]
        ? UI("bit_word") + " " + f.bits[0]
        : UI("bits_word") + " " + f.bits[0] + "–" + f.bits[1];
      var ctl;
      if (f.values) {
        ctl = '<select data-fi="' + i + '">';
        var max = (1 << (f.bits[0] - f.bits[1] + 1)) - 1;
        for (var v = 0; v <= max; v++) {
          var m = f.values[v];
          ctl += '<option value="' + v + '">' + v + (m ? " — " + esc(L(m)) : "") + "</option>";
        }
        ctl += "</select>";
      } else {
        var maxN = (1 << (f.bits[0] - f.bits[1] + 1)) - 1;
        ctl = '<input type="number" data-fi="' + i + '" min="0" max="' + maxN + '" value="0">';
      }
      html += '<div class="fieldrow" style="--fc:' + color + '">' +
              '<div class="field-dot"></div>' +
              '<div><div class="field-name">' + esc(L(f.name)) + '</div><div class="field-bits">' + bitsLbl + "</div></div>" +
              '<div class="field-ctl">' + ctl + '<div class="field-meaning" data-fm="' + i + '"></div></div></div>';
    });
    host.innerHTML = html;
    host.querySelectorAll("select,input").forEach(function (c) {
      c.addEventListener("change", function () {
        var f = reg.fields[+c.dataset.fi];
        var v = parseInt(c.value, 10);
        if (isNaN(v)) v = 0;
        setField(reg, f, v);
        update(reg);
      });
    });
  }

  function update(reg, source) {
    var v = values[vkey(reg.addr)];
    if (source !== "hex") {
      el("hexval").value = v.toString(16).toUpperCase().padStart(reg.size / 4, "0");
    }
    document.querySelectorAll("#bitrow .bitcell").forEach(function (c) {
      var on = (v >> +c.dataset.bit) & 1;
      c.classList.toggle("on", !!on);
      c.querySelector(".bitval").textContent = on;
    });
    var summary = [];
    reg.fields.forEach(function (f, i) {
      var fv = getField(reg, f);
      var ctl = document.querySelector('[data-fi="' + i + '"]');
      if (ctl && document.activeElement !== ctl) ctl.value = fv;
      var fm = document.querySelector('[data-fm="' + i + '"]');
      if (fm) fm.innerHTML = fieldMeaning(f, fv);
      summary.push("<b>" + esc(L(f.name)) + ":</b> " + fieldMeaning(f, fv));
    });
    el("decoded").innerHTML = summary.join("<br>");

    var lint = reg.lint ? reg.lint(v) : [];
    var icons = { err: "⛔", warn: "⚠️", info: "💡" };
    el("lintbox").innerHTML = lint.map(function (w) {
      return '<div class="warn-item ' + w.level + '" style="margin-top:10px"><span class="ico">' + icons[w.level] + "</span><div>" + esc(L(w)) + "</div></div>";
    }).join("");
  }

  // ---------- boot ----------
  renderSysTabs();
  applyFeatureNav();
  setLang(lang);
})();
