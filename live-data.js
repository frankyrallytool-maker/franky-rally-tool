(function () {
  const API_URL = "https://script.google.com/macros/s/AKfycbxuxysWcVsk_Y6eARCGne_iH-hGUOSkAa2bkTuDLGXU9jgJ1sJPgz58Q41Cf0UcVo8svA/exec";
  const APP_BUILD = "1.14.4";
  const CACHE_KEY = "franky_sheet_cache_v8";
  const CACHE_MAX_AGE = 7 * 24 * 60 * 60 * 1000;
  const SELECTION_KEY = "franky_selected_players_v1";
  const VEHICLE_SORT_KEY = "franky_vehicle_sort_v1";

  const LEGACY_RANGES = [
    { label: "< 200M", estimate: 150 },
    { label: "200–299M", estimate: 250 },
    { label: "300–399M", estimate: 350 },
    { label: "400–499M", estimate: 450 },
    { label: "500–599M", estimate: 550 },
    { label: "600–699M", estimate: 650 },
    { label: "700–799M", estimate: 750 },
    { label: "800–899M", estimate: 850 },
    { label: "900–999M", estimate: 950 },
    { label: "> 1G", estimate: 1100 }
  ];

  let syncState = "loading";
  let lastSync = null;
  let sourceSchema = "unknown";
  let playerFilterQuery = "";
  let troopTypeIndex = {};
  const TROOP_ICON_DATA = {
    fighter: "data:image/png;base64,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",
    shooter: "data:image/png;base64,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",
    rider: "data:image/png;base64,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"
  };
  let vehicleSortMode = (function(){
    try { return localStorage.getItem(VEHICLE_SORT_KEY) === "capacity" ? "capacity" : "power"; }
    catch (_) { return "power"; }
  })();

  function txt(fr, en, it, de) { if (lang === "fr") return fr; if (lang === "it") return it || en; if (lang === "de") return de || en; return en; }

  function loadStoredSelection() {
    try {
      const raw = localStorage.getItem(SELECTION_KEY);
      if (raw === null) return null;
      const names = JSON.parse(raw);
      if (!Array.isArray(names)) return null;
      const map = {};
      names.forEach(function(name) { map[String(name)] = true; });
      return map;
    } catch (_) {
      return null;
    }
  }

  function saveStoredSelection() {
    try {
      localStorage.setItem(SELECTION_KEY, JSON.stringify(
        players.filter(function(p){ return p.selected; }).map(function(p){ return p.name; })
      ));
    } catch (_) {}
  }

  function setupVehicleSort() {
    const select = document.getElementById("vehicleSort");
    if (!select || select.dataset.ready === "1") return;
    select.dataset.ready = "1";
    select.value = vehicleSortMode;
    select.addEventListener("change", function() {
      vehicleSortMode = select.value === "capacity" ? "capacity" : "power";
      try { localStorage.setItem(VEHICLE_SORT_KEY, vehicleSortMode); } catch (_) {}
      renderVehicles();
    });
  }

  function escapeHtml(value) {
    return String(value == null ? "" : value)
      .replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;")
      .replace(/"/g,"&quot;").replace(/'/g,"&#039;");
  }

  function addLiveStyles() {
    const style = document.createElement("style");
    style.textContent = [
      ".sync-strip{display:flex;align-items:center;gap:7px;padding:7px 10px;margin:0 0 9px;border-radius:9px;font-size:9px;font-weight:800;border:1px solid #1d3854;background:#0b1724;color:#8fa5bd}",
      ".sync-strip.ok{border-color:rgba(53,215,133,.28);color:#a9e7c8;background:rgba(36,151,91,.10)}",
      ".sync-strip.error{border-color:rgba(255,107,107,.25);color:#ffc0c0;background:rgba(157,45,45,.12)}",
      ".sync-dot{width:7px;height:7px;border-radius:50%;background:#f2b84b;box-shadow:0 0 9px rgba(242,184,75,.45);flex:none}",
      ".sync-strip.ok .sync-dot{background:#35d785;box-shadow:0 0 9px rgba(53,215,133,.5)}",
      ".sync-strip.error .sync-dot{background:#ff6b6b;box-shadow:0 0 9px rgba(255,107,107,.5)}",
      ".player-row.no-data{opacity:.58}",
      ".selection-actions{display:grid;grid-template-columns:1fr 1fr;gap:7px;margin:0 0 8px}",
      ".selection-action{min-height:38px;border-radius:9px;border:1px solid #285278;background:#0b1724;color:#cfeaff;font-size:10px;font-weight:950;letter-spacing:.04em;padding:8px 10px}",
      ".selection-action:hover{background:#10243a;border-color:#3474a9}",
      ".selection-action.clear{border-color:#493448;color:#e9b6cf;background:#17111b}",
      ".selection-action.clear:hover{border-color:#7c4565;background:#211522}",
      ".vehicle-sort-bar{display:flex;align-items:center;justify-content:space-between;gap:10px;margin:8px 0 10px;padding:8px 10px;border:1px solid #254664;border-radius:10px;background:#0b1724}",
      ".vehicle-sort-bar label{font-size:9px;color:#9cb2c9;font-weight:900;letter-spacing:.05em;text-transform:uppercase}",
      ".vehicle-sort-bar select{min-width:145px;padding:7px 9px;border-radius:8px;border:1px solid #3474a9;background:#0d2135;color:#eaf6ff;font-size:11px;font-weight:900}",
      ".vehicle-rally-size{margin-top:4px;font-size:9px;color:#9ab0c7;font-weight:900;letter-spacing:.03em}",
      ".vehicle-rally-size strong{color:#45de90;font-size:10px;margin-left:4px}",
      ".vehicle-apc-line{display:inline-flex;align-items:center;gap:5px;vertical-align:middle}",
      ".troop-icon{width:22px;height:22px;object-fit:contain;display:inline-block;vertical-align:middle;filter:drop-shadow(0 1px 3px rgba(0,0,0,.42))}",
      ".vehicle-name .troop-icon{width:24px;height:24px;margin-left:1px}",
      ".vehicle-sub.has-troop{display:flex;align-items:center;gap:5px}",
      ".vehicle-sub .troop-icon{width:20px;height:20px}",
      ".vehicle-range{font-size:10px;color:#9bdfff;font-weight:900;margin-top:3px}",
      ".empty-state{padding:18px 12px;text-align:center;border:1px dashed #27425f;border-radius:10px;color:#7890aa;font-size:10px}",
      ".pending-capacity{margin-top:8px;padding:8px 10px;border-radius:9px;background:rgba(233,178,71,.10);border:1px solid rgba(233,178,71,.25);font-size:9px;line-height:1.45;color:#e8c987}",
      ".apc-summary{display:flex;flex-wrap:wrap;gap:6px;margin:0 0 9px}",
      ".apc-chip{padding:6px 8px;border-radius:8px;border:1px solid #203b57;background:#0b1724;color:#91a7bf;font-size:9px;font-weight:800}",
      ".apc-chip strong{color:#d8ecff;font-size:10px}",
      ".rally-top{display:flex;align-items:center;justify-content:space-between;gap:12px;margin:0 0 9px;padding:9px 11px;border:1px solid #285278;border-radius:10px;background:linear-gradient(180deg,rgba(16,45,72,.78),rgba(9,27,44,.78))}",
      ".rally-top label{font-size:11px;color:#c5e8ff;font-weight:900}",
      ".rally-top select{min-width:82px;font-size:13px;font-weight:950;border-color:#3474a9;background:#0d2135}",
      ".player-filter{position:relative;margin:0 0 9px}",
      "#playerFilterInput{width:100%;height:42px;padding:8px 42px 8px 12px;border-radius:10px;border:1px solid #26445f;background:#091522;color:#eef7ff;outline:none;font-size:16px;font-weight:700}",
      "#playerFilterInput::placeholder{color:#688099;font-weight:700}",
      "#playerFilterInput:focus{border-color:#278ee6;box-shadow:0 0 0 2px rgba(39,142,230,.12)}",
      "#playerFilterClear{display:none;position:absolute;right:5px;top:21px;transform:translateY(-50%);width:30px;height:30px;border:0;border-radius:8px;background:#14273b;color:#b8cce0;font-size:20px;line-height:1;padding:0;z-index:10001}",
      "#playerFilterClear.visible{display:grid;place-items:center}",
      "#playerFilterClear:hover{background:#1a3855;color:#fff}",
      ".player-filter-results{display:none;position:absolute;left:0;right:0;top:calc(100% + 6px);z-index:9999;max-height:190px;overflow-y:auto;padding:6px;border:1px solid #2b5277;border-radius:12px;background:#08131f;box-shadow:0 14px 36px rgba(0,0,0,.55);-webkit-overflow-scrolling:touch}",
      ".player-filter-results.visible{display:grid;gap:5px}",
      ".player-filter-results .player-row{margin:0}",
      ".result-card{grid-template-columns:auto auto minmax(0,1fr) auto;align-items:center}",
      ".result-main{min-width:0}",
      ".result-rally-size{margin-top:4px;font-size:9px;color:#9ab0c7;font-weight:900;white-space:nowrap;letter-spacing:.03em}",
      ".result-rally-size strong{color:#64d0ff;font-size:10px;font-weight:950;margin-left:4px}",
      ".result-score{margin-top:3px;font-size:9px;color:#d9b96d;font-weight:900;white-space:nowrap;letter-spacing:.03em}",
      ".result-score strong{color:#ffd866;font-size:10px;font-weight:950;margin-left:4px}",
      ".result-name{white-space:nowrap;overflow:hidden;text-overflow:ellipsis}",
      ".result-right{text-align:right}",
      ".result-right span{font-weight:950;letter-spacing:.03em}"
    ].join("");
    document.head.appendChild(style);
  }

  function checkForAppUpdate() {
    try {
      fetch("./version.json?t=" + Date.now(), { cache: "no-store" })
        .then(function(r) { return r.ok ? r.json() : null; })
        .then(function(v) {
          if (!v || !v.build || v.build === APP_BUILD) return;
          const url = new URL(window.location.href);
          url.searchParams.set("appv", v.build);
          window.location.replace(url.toString());
        })
        .catch(function(){});
    } catch (_) {}
  }

  function ensureRallySelectorOnTop() {
    const select = document.getElementById("leaderCount");
    const playersList = document.getElementById("playersList");
    if (!select || !playersList) return;
    const current = select.closest ? select.closest(".rally-top") : null;
    if (current) return;

    const oldRow = select.closest ? select.closest(".control-row") : null;
    const label = oldRow ? oldRow.querySelector("label") : null;
    const top = document.createElement("div");
    top.className = "rally-top";
    if (label) top.appendChild(label);
    top.appendChild(select);
    playersList.parentNode.insertBefore(top, playersList);
    if (oldRow && oldRow.parentNode && oldRow.children.length === 0) oldRow.parentNode.removeChild(oldRow);
  }

  function addSyncStrip() {
    const panel = document.querySelector("#attendance .panel");
    if (!panel || document.getElementById("syncStrip")) return;

    const strip = document.createElement("div");
    strip.id = "syncStrip";
    strip.className = "sync-strip";
    strip.innerHTML = '<span class="sync-dot"></span><span id="syncText"></span>';
    const online = panel.querySelector(".online-box");
    panel.insertBefore(strip, online);

    const summary = document.createElement("div");
    summary.id = "apcSummary";
    summary.className = "apc-summary";
    online.insertAdjacentElement("afterend", summary);
  }

  function updateSyncStrip() {
    const strip = document.getElementById("syncStrip");
    const label = document.getElementById("syncText");
    if (!strip || !label) return;

    strip.className = "sync-strip " + (syncState === "ok" ? "ok" : syncState === "error" ? "error" : "");

    if (syncState === "loading") {
      label.textContent = txt("Chargement du Google Sheet…", "Loading Google Sheet…", "Caricamento del Google Sheet…", "Google Sheet wird geladen…");
    } else if (syncState === "cached") {
      label.textContent = txt("Données instantanées affichées · mise à jour en cours…", "Instant cached data shown · refreshing…", "Dati salvati mostrati · aggiornamento in corso…", "Gespeicherte Daten angezeigt · Aktualisierung läuft…");
    } else if (syncState === "error") {
      label.textContent = txt("Données enregistrées utilisées · mise à jour impossible.", "Using saved data · live refresh unavailable.", "Uso dei dati salvati · aggiornamento live non disponibile.", "Gespeicherte Daten werden verwendet · Live-Aktualisierung nicht verfügbar.");
    } else {
      const time = lastSync ? new Date(lastSync).toLocaleTimeString([], {hour:"2-digit", minute:"2-digit"}) : "";
      const source = sourceSchema === "apc" ? " · Feuille 3" : "";
      label.textContent = txt("Données Google Sheet à jour", "Google Sheet data up to date", "Dati Google Sheet aggiornati", "Google-Sheet-Daten aktuell") + source + (time ? " · " + time : "");
    }
  }

  function normalizePlayerText(value) {
    let s = String(value == null ? "" : value).toLowerCase();
    try {
      s = s.normalize("NFD").replace(/[\u0300-\u036f]/g, "");
    } catch (_) {}
    return s;
  }

  function updatePlayerFilterUI() {
    const input = document.getElementById("playerFilterInput");
    const clear = document.getElementById("playerFilterClear");
    const results = document.getElementById("playerFilterResults");
    if (!input || !clear) return;

    input.placeholder = txt("Rechercher un joueur…", "Search a player…", "Cerca un giocatore…", "Spieler suchen…");
    clear.setAttribute("aria-label", txt("Effacer la recherche", "Clear search", "Cancella ricerca", "Suche löschen"));
    clear.title = txt("Effacer la recherche", "Clear search", "Cancella ricerca", "Suche löschen");
    clear.classList.toggle("visible", !!playerFilterQuery);

    if (results) results.classList.toggle("visible", !!playerFilterQuery);
  }

  function playerRowHtml(p, i) {
    const hasData = p.vehicles && p.vehicles.length > 0;
    let meta;

    if (!hasData) {
      meta = txt("Aucune APC renseignée", "No APC data", "Nessun dato APC", "Keine APC-Daten");
    } else {
      const count = p.vehicles.length;
      const best = bestVehicle(p);
      meta = count + " " + txt(
        count > 1 ? "APC renseignées" : "APC renseignée",
        count > 1 ? "APCs listed" : "APC listed",
        count > 1 ? "APC inserite" : "APC inserita",
        count > 1 ? "APCs eingetragen" : "APC eingetragen"
      ) + " · " + txt("Meilleure : ", "Best: ", "Migliore: ", "Beste: ") + apcLabel(best) + " · " + vehicleDisplay(best);
    }

    return '<label class="player-row' + (p.selected ? ' selected' : '') + (!hasData ? ' no-data' : '') + '">' +
      '<input class="check" type="checkbox" ' + (p.selected ? 'checked' : '') + ' data-i="' + i + '">' +
      '<div class="avatar">' + silhouette() + '</div>' +
      '<div><div class="player-name">' + escapeHtml(p.name) + '</div><div class="player-meta">' + escapeHtml(meta) + '</div></div>' +
    '</label>';
  }

  function bindPlayerChecks(container) {
    if (!container) return;
    container.querySelectorAll(".check[data-i]").forEach(function(c) {
      c.onchange = function(e) {
        players[+e.target.dataset.i].selected = e.target.checked;
        saveStoredSelection();

        const fromFilter = container.id === "playerFilterResults";
        if (fromFilter && e.target.checked) {
          const input = document.getElementById("playerFilterInput");

          playerFilterQuery = "";
          if (input) input.value = "";

          renderAll();

          // Keep the keyboard ready so the next player can be searched immediately.
          if (input) {
            requestAnimationFrame(function() { input.focus(); });
          }
          return;
        }

        renderAll();
      };
    });
  }

  function renderFilterResults() {
    const results = document.getElementById("playerFilterResults");
    if (!results) return;

    const q = normalizePlayerText(playerFilterQuery.trim());

    if (!q) {
      results.innerHTML = "";
      results.classList.remove("visible");
      return;
    }

    const rows = [];
    players.forEach(function(p, i) {
      if (normalizePlayerText(p.name).indexOf(q) !== -1) {
        rows.push(playerRowHtml(p, i));
      }
    });

    results.innerHTML = rows.length
      ? rows.join("")
      : '<div class="empty-state">' + txt("Aucun joueur trouvé.", "No player found.", "Nessun giocatore trovato.", "Kein Spieler gefunden.") + '</div>';

    results.classList.add("visible");
    bindPlayerChecks(results);
  }

  function setupPlayerFilter() {
    const input = document.getElementById("playerFilterInput");
    const clear = document.getElementById("playerFilterClear");
    const wrapper = input ? input.parentNode : null;
    if (!input || !clear || !wrapper || input.dataset.ready === "1") return;

    let results = document.getElementById("playerFilterResults");
    if (!results) {
      results = document.createElement("div");
      results.id = "playerFilterResults";
      results.className = "player-filter-results";
      wrapper.appendChild(results);
    }

    input.dataset.ready = "1";
    input.value = playerFilterQuery;
    updatePlayerFilterUI();

    input.addEventListener("input", function() {
      playerFilterQuery = input.value || "";
      updatePlayerFilterUI();
      renderFilterResults();
    });

    clear.addEventListener("click", function() {
      playerFilterQuery = "";
      input.value = "";
      updatePlayerFilterUI();
      renderFilterResults();
      input.focus();
    });
  }

  function parseSimplePower(raw) {
    let s = String(raw == null ? "" : raw).trim();
    if (!s) return null;

    // Accept both decimal conventions used by alliance members:
    // 192,5 / 192.5 / 192,5 M / 192.5M.
    // Also tolerate normal, non-breaking and thin spaces from Google Sheets.
    s = s.replace(/[\s\u00A0\u202F]/g, "");

    const unitMatch = s.match(/([mMgG])$/);
    const unit = unitMatch ? unitMatch[1].toLowerCase() : "";
    if (unitMatch) s = s.slice(0, -1);

    const lastComma = s.lastIndexOf(",");
    const lastDot = s.lastIndexOf(".");

    if (lastComma !== -1 && lastDot !== -1) {
      // If both separators are present, the last one is treated as the decimal
      // separator and the other one as a thousands separator.
      if (lastComma > lastDot) {
        s = s.replace(/\./g, "").replace(/,/g, ".");
      } else {
        s = s.replace(/,/g, "");
      }
    } else if (lastComma !== -1) {
      s = s.replace(/,/g, ".");
    }

    const m = s.match(/^(?:\d+(?:\.\d+)?|\.\d+)$/);
    if (!m) return null;

    let n = parseFloat(s);
    if (!Number.isFinite(n) || n <= 0) return null;
    if (unit === "g") n *= 1000;
    return n;
  }

  function formatPowerM(powerM) {
    if (!Number.isFinite(powerM)) return "—";
    if (powerM >= 1000) {
      const g = Math.round((powerM / 1000) * 100) / 100;
      return String(g).replace(/\.0+$/,"") + " G";
    }
    const m = Math.round(powerM * 10) / 10;
    return String(m).replace(/\.0$/,"") + " M";
  }

  function vehicleDisplay(v) {
    if (v.exact) return formatPowerM(v.powerM);
    return v.rangeLabel || formatPowerM(v.powerM);
  }

  function parseRallySize(raw) {
    let s = String(raw == null ? "" : raw).trim();
    if (!s) return null;

    s = s.replace(/[\s\u00A0\u202F]/g, "").toLowerCase();

    const hasPlus = /\+$/.test(s);
    if (hasPlus) s = s.replace(/\++$/, "");

    let multiplier = 1;
    if (/k$/.test(s)) {
      multiplier = 1000;
      s = s.slice(0, -1);
    } else if (/m$/.test(s)) {
      multiplier = 1000000;
      s = s.slice(0, -1);
    }

    // For rally sizes, a single separator followed by exactly 3 digits is
    // normally a thousands separator (66,400 / 66.400).
    if (/^\d+[,.]\d{3}$/.test(s)) {
      s = s.replace(/[,.]/g, "");
    } else {
      const lastComma = s.lastIndexOf(",");
      const lastDot = s.lastIndexOf(".");

      if (lastComma !== -1 && lastDot !== -1) {
        if (lastComma > lastDot) {
          s = s.replace(/\./g, "").replace(/,/g, ".");
        } else {
          s = s.replace(/,/g, "");
        }
      } else if (lastComma !== -1) {
        s = s.replace(/,/g, ".");
      }
    }

    if (!/^(?:\d+(?:\.\d+)?|\.\d+)$/.test(s)) return null;

    const n = parseFloat(s) * multiplier;
    if (!Number.isFinite(n) || n <= 0) return null;
    return { value: n, plus: hasPlus };
  }

  function formatRallySize(value, plus) {
    if (!Number.isFinite(value) || value <= 0) return "—";
    if (value >= 1000000) {
      const m = Math.round((value / 1000000) * 10) / 10;
      return String(m).replace(/\.0$/, "") + "M" + (plus ? "+" : "");
    }
    if (value >= 1000) {
      const k = Math.round((value / 1000) * 10) / 10;
      return String(k).replace(/\.0$/, "") + "K" + (plus ? "+" : "");
    }
    const out = String(Math.round(value));
    return plus ? out + "+" : out;
  }


  function normalizeTroopType(raw) {
    let s = String(raw == null ? "" : raw).trim().toLowerCase();
    if (!s) return null;
    try {
      s = s.normalize("NFD").replace(/[\u0300-\u036f]/g, "");
    } catch (_) {}
    s = s.replace(/[_-]+/g, " ").replace(/\s+/g, " ").trim();

    if (s === "fighter" || s === "fighters") return "fighter";
    if (s === "shooter" || s === "shooters") return "shooter";
    if (s === "rider" || s === "riders") return "rider";
    if (s === "no restriction" || s === "none" || s === "unrestricted") return "none";
    return null;
  }

  function troopTypeFromBundle(raw, apcNo) {
    const parts = String(raw == null ? "" : raw).split("|");
    const index = Math.max(0, Number(apcNo || 1) - 1);
    return normalizeTroopType(parts[index] || "");
  }

  function troopIconHtml(type) {
    const normalized = normalizeTroopType(type);
    if (!normalized || normalized === "none") return "";
    const src = TROOP_ICON_DATA[normalized] || "";
    if (!src) return "";
    return '<img class="troop-icon" src="' + src + '" alt="" aria-hidden="true">';
  }

  function troopIndexKey(playerName, apcNo) {
    return String(playerName || "").trim() + "||" + String(apcNo || "");
  }

  function buildTroopTypeIndex(values) {
    const map = {};
    if (!Array.isArray(values)) {
      troopTypeIndex = map;
      return;
    }

    for (let rowIndex = 1; rowIndex < values.length; rowIndex++) {
      const row = Array.isArray(values[rowIndex]) ? values[rowIndex] : [];
      const name = String(row[0] || "").trim();
      if (!name) continue;

      const troopRow = getTroopRow(values, rowIndex);

      for (let col = 1; col <= 4; col++) {
        // Column G contains all four troop restrictions in one compact bundle:
        // APC1|APC2|APC3|APC4. This survives feeds limited to A:G.
        const bundled = troopTypeFromBundle(row[6], col);
        const below = troopRow ? normalizeTroopType(troopRow[col]) : null;
        const type = bundled || below;
        if (type) map[troopIndexKey(name, col)] = type;
      }
    }

    troopTypeIndex = map;
  }

  function resolveTroopType(playerName, vehicle) {
    if (!vehicle) return null;

    const direct = normalizeTroopType(vehicle.troopType);
    if (direct) return direct;

    return troopTypeIndex[troopIndexKey(playerName, vehicle.apcNo)] || null;
  }

  function getTroopRow(values, playerRowIndex) {
    const next = Array.isArray(values[playerRowIndex + 1]) ? values[playerRowIndex + 1] : null;
    if (!next) return null;
    if (String(next[0] == null ? "" : next[0]).trim()) return null;

    for (let col = 1; col <= 4; col++) {
      if (normalizeTroopType(next[col])) return next;
    }
    return null;
  }

  function isApcSheet(values) {
    if (!Array.isArray(values) || !values.length || !Array.isArray(values[0])) return false;
    const h = values[0].map(function(v){ return String(v || "").toLowerCase().trim(); });

    const playerHeader = h[0] === "player" || h[0].indexOf("giocatore") !== -1;
    const apc1Header = h[1] && (h[1].indexOf("apc 1") !== -1 || h[1].indexOf("macchina 1") !== -1);
    const apc2Header = h[2] && (h[2].indexOf("apc 2") !== -1 || h[2].indexOf("macchina 2") !== -1);

    return !!(playerHeader && apc1Header && apc2Header);
  }

  function parseApcSheet(values) {
    const result = [];

    for (let rowIndex = 1; rowIndex < values.length; rowIndex++) {
      const row = Array.isArray(values[rowIndex]) ? values[rowIndex] : [];
      const name = String(row[0] || "").trim();
      if (!name) continue;

      const troopRow = getTroopRow(values, rowIndex);
      const rallyInfo = parseRallySize(row[5]);
      const rallySize = rallyInfo ? rallyInfo.value : null;
      const rallySizePlus = rallyInfo ? rallyInfo.plus : false;
      const vehicles = [];

      for (let col = 1; col <= 4; col++) {
        const power = parseSimplePower(row[col]);
        if (power === null) continue;

        vehicles.push({
          apcNo: col,
          powerM: power,
          exact: true,
          capacity: rallySize,
          capacityPlus: rallySizePlus,
          troopType: troopTypeFromBundle(row[6], col) || (troopRow ? normalizeTroopType(troopRow[col]) : null)
        });
      }

      const bestPower = vehicles.reduce(function(max, v) {
        return Math.max(max, v.powerM);
      }, 0);

      result.push({
        name: name,
        selected: false,
        vehicles: vehicles,
        power: bestPower,
        capacity: rallySize,
        capacityPlus: rallySizePlus
      });
    }

    return result;
  }

  function parseLegacyExactValue(num, unit, rangeIndex) {
    let n = parseFloat(String(num).replace(",", "."));
    if (!Number.isFinite(n)) return null;
    const u = String(unit || "").toLowerCase();
    if (u === "g") return n * 1000;
    if (u === "m") return n;
    if (rangeIndex === 9 && n < 10) return n * 1000;
    return n;
  }

  function parseLegacyCell(raw, rangeIndex) {
    let s = String(raw || "").trim();
    if (!s) return [];
    const range = LEGACY_RANGES[rangeIndex];
    const cars = [];

    s = s.replace(/(\d+)\s*[x×]\s*(\d+(?:[.,]\d+)?)\s*([mMgG])?/g, function(_, count, value, unit) {
      const p = parseLegacyExactValue(value, unit, rangeIndex);
      const c = Math.min(8, Math.max(1, parseInt(count, 10) || 1));
      if (p !== null) {
        for (let i=0; i<c; i++) cars.push({powerM:p, exact:true, rangeLabel:range.label, apcNo:null, capacity:null});
      }
      return " ";
    });

    const numRe = /(\d+(?:[.,]\d+)?)\s*([mMgG])?/g;
    let match;
    while ((match = numRe.exec(s)) !== null) {
      const p = parseLegacyExactValue(match[1], match[2], rangeIndex);
      if (p !== null) cars.push({powerM:p, exact:true, rangeLabel:range.label, apcNo:null, capacity:null});
    }

    const xCount = (s.match(/\bX\b/gi) || []).length;
    for (let i=0; i<xCount; i++) {
      cars.push({powerM:range.estimate, exact:false, rangeLabel:range.label, apcNo:null, capacity:null});
    }
    return cars;
  }

  function parseLegacySheet(values) {
    const result = [];
    values.slice(1).forEach(function(row) {
      const name = String(row[0] || "").trim();
      if (!name) return;

      const vehicles = [];
      for (let i=0; i<LEGACY_RANGES.length; i++) {
        parseLegacyCell(row[i+1], i).forEach(function(v){ vehicles.push(v); });
      }
      vehicles.sort(function(a,b){ return b.powerM - a.powerM; });

      result.push({
        name:name,
        selected:false,
        vehicles:vehicles,
        power:vehicles.length ? vehicles[0].powerM : 0,
        capacity:null
      });
    });
    return result;
  }

  function parseSheet(values) {
    if (!Array.isArray(values) || values.length < 2) {
      sourceSchema = "unknown";
      return [];
    }

    if (isApcSheet(values)) {
      sourceSchema = "apc";
      return parseApcSheet(values);
    }

    sourceSchema = "legacy";
    return parseLegacySheet(values);
  }

  function bestVehicle(p) {
    if (!p.vehicles || !p.vehicles.length) return null;
    return p.vehicles.slice().sort(function(a,b){ return b.powerM - a.powerM; })[0];
  }

  function apcLabel(v) {
    return v && v.apcNo ? "APC " + v.apcNo : "APC";
  }

  score = function(p) { return Number(p.power) || 0; };

  renderPlayers = function() {
    const box = document.getElementById("playersList");

    box.innerHTML =
      '<div class="selection-actions">' +
        '<button type="button" id="selectAllPlayersBtn" class="selection-action">' +
          txt("COCHER TOUT", "CHECK ALL", "SELEZIONA TUTTI", "ALLE AUSWÄHLEN") +
        '</button>' +
        '<button type="button" id="clearAllPlayersBtn" class="selection-action clear">' +
          txt("VIDER TOUT", "CLEAR ALL", "SVUOTA TUTTO", "ALLES LEEREN") +
        '</button>' +
      '</div>' +
      players.map(function(p, i) {
        return playerRowHtml(p, i);
      }).join("");

    const allBtn = document.getElementById("selectAllPlayersBtn");
    if (allBtn) {
      allBtn.onclick = function() {
        players.forEach(function(p) { p.selected = true; });
        saveStoredSelection();
        renderAll();
      };
    }

    const clearBtn = document.getElementById("clearAllPlayersBtn");
    if (clearBtn) {
      clearBtn.onclick = function() {
        players.forEach(function(p) { p.selected = false; });
        saveStoredSelection();
        renderAll();
      };
    }

    bindPlayerChecks(box);
    updatePlayerFilterUI();
    renderFilterResults();
  };

  renderVehicles = function() {
    const all = [];
    sel().forEach(function(p) {
      const vehicles = p.vehicles || [];

      if (vehicleSortMode === "capacity") {
        const apc1 = vehicles.find(function(v) {
          return Number(v.apcNo) === 1;
        });
        if (apc1) all.push({player:p.name, vehicle:apc1});
        return;
      }

      vehicles.forEach(function(v) {
        all.push({player:p.name, vehicle:v});
      });
    });

    if (vehicleSortMode === "capacity") {
      all.sort(function(a,b) {
        const aCap = Number.isFinite(a.vehicle.capacity) ? a.vehicle.capacity : 0;
        const bCap = Number.isFinite(b.vehicle.capacity) ? b.vehicle.capacity : 0;
        if (bCap !== aCap) return bCap - aCap;
        if (!!b.vehicle.capacityPlus !== !!a.vehicle.capacityPlus) return b.vehicle.capacityPlus ? 1 : -1;
        return b.vehicle.powerM - a.vehicle.powerM;
      });
    } else {
      all.sort(function(a,b){ return b.vehicle.powerM - a.vehicle.powerM; });
    }

    const sortLabel = document.getElementById("vehicleSortLabel");
    const sortSelect = document.getElementById("vehicleSort");
    if (sortLabel) sortLabel.textContent = txt("Classer par", "Sort by", "Ordina per", "Sortieren nach");
    if (sortSelect) {
      sortSelect.value = vehicleSortMode;
      if (sortSelect.options[0]) sortSelect.options[0].textContent = txt("Puissance", "Power", "Potenza", "Stärke");
      if (sortSelect.options[1]) sortSelect.options[1].textContent = txt("Taille de rally", "Rally size", "Dimensione rally", "Rally-Größe");
    }

    const summary = document.getElementById("apcSummary");
    if (summary) {
      const selectedPlayers = sel().length;
      const playersWithData = sel().filter(function(p){ return p.vehicles && p.vehicles.length; }).length;
      summary.innerHTML =
        '<span class="apc-chip"><strong>' + all.length + '</strong> ' + txt("APC disponibles", "APCs available", "APC disponibili", "APCs verfügbar") + '</span>' +
        '<span class="apc-chip"><strong>' + selectedPlayers + '</strong> ' + txt("joueurs présents", "players online", "giocatori online", "Spieler online") + '</span>' +
        '<span class="apc-chip"><strong>' + playersWithData + '</strong> ' + txt("avec données APC", "with APC data", "con dati APC", "mit APC-Daten") + '</span>';
    }

    const el = document.getElementById("vehicleList");
    if (!all.length) {
      el.innerHTML = '<div class="empty-state">' + txt("Sélectionne d’abord les joueurs présents.", "Select the players who are online first.", "Seleziona prima i giocatori online.", "Wähle zuerst die Spieler aus, die online sind.") + '</div>';
      return;
    }

    const maxPower = Math.max.apply(null, all.map(function(x){ return x.vehicle.powerM; }).concat([1]));

    el.innerHTML = all.map(function(x, position) {
      const v = x.vehicle;
      const width = Math.max(5, Math.min(100, (v.powerM / maxPower) * 100));
      const troopType = resolveTroopType(x.player, v);
      const precision = v.exact ? txt("Valeur exacte", "Exact value", "Valore esatto", "Exakter Wert") : txt("Tranche estimée", "Estimated band", "Fascia stimata", "Geschätzter Bereich");
      const rallySize = formatRallySize(v.capacity, v.capacityPlus);

      return '<div class="vehicle-card">' +
        '<div class="avatar">' + silhouette() + '</div>' +
        '<div><div class="vehicle-name">#' + (position+1) + ' · ' + escapeHtml(x.player) + ' — <span class="vehicle-apc-line">' + escapeHtml(apcLabel(v)) + troopIconHtml(troopType) + '</span></div>' +
        '<div class="vehicle-range">' + escapeHtml(vehicleDisplay(v)) + '</div>' +
        '<div class="vehicle-rally-size">RALLY SIZE <strong>' + escapeHtml(rallySize) + '</strong></div>' +
        '<div class="metric-grid" style="grid-template-columns:1fr">' +
        '<div><div class="metric-label">' + escapeHtml(tr[lang].power) + '</div><div class="bar power"><i style="width:' + width + '%"></i></div></div>' +
        '</div></div>' +
        '<div class="vehicle-right"><strong>' + escapeHtml(vehicleDisplay(v)) + '</strong><span>' + escapeHtml(rallySize) + ' · ' + escapeHtml(precision) + '</span></div>' +
      '</div>';
    }).join("");
  };

  renderResults = function() {
    const apcs = [];

    sel().forEach(function(p) {
      const sharedCapacity = Number.isFinite(p.capacity) ? p.capacity : null;
      const sharedCapacityPlus = !!p.capacityPlus;

      (p.vehicles || []).forEach(function(v) {
        apcs.push({
          player:p.name,
          vehicle:v,
          capacity:sharedCapacity,
          capacityPlus:sharedCapacityPlus,
          frankyScore:0
        });
      });
    });

    const maxPower = Math.max.apply(null, apcs.map(function(x){
      return Number.isFinite(x.vehicle.powerM) ? x.vehicle.powerM : 0;
    }).concat([1]));

    const maxCapacity = Math.max.apply(null, apcs.map(function(x){
      return Number.isFinite(x.capacity) ? x.capacity : 0;
    }).concat([0]));

    apcs.forEach(function(x) {
      const powerNorm = Math.max(0, x.vehicle.powerM / maxPower);

      if (maxCapacity > 0 && Number.isFinite(x.capacity) && x.capacity > 0) {
        const capacityNorm = Math.max(0, x.capacity / maxCapacity);
        x.frankyScore = Math.pow(powerNorm, 0.60) * Math.pow(capacityNorm, 0.40) * 100;
      } else {
        // Legacy/no Rally Size: preserve the former power-based order.
        x.frankyScore = powerNorm * 100;
      }
    });

    apcs.sort(function(a,b) {
      if (Math.abs(b.frankyScore - a.frankyScore) > 0.0001) return b.frankyScore - a.frankyScore;
      if (b.capacityPlus !== a.capacityPlus) return b.capacityPlus ? 1 : -1;
      if ((b.capacity || 0) !== (a.capacity || 0)) return (b.capacity || 0) - (a.capacity || 0);
      return b.vehicle.powerM - a.vehicle.powerM;
    });

    const wanted = +document.getElementById("leaderCount").value || 0;
    const n = Math.min(wanted, apcs.length);
    const arr = apcs.slice(0,n);

    document.getElementById("resultCount").textContent = n;
    const list = document.getElementById("resultsList");

    if (!arr.length) {
      list.innerHTML = '<div class="empty-state">' + txt("Aucune APC disponible parmi les joueurs sélectionnés.", "No APC available among selected players.", "Nessuna APC disponibile tra i giocatori selezionati.", "Keine APC bei den ausgewählten Spielern verfügbar.") + '</div>';
    } else {
      list.innerHTML = arr.map(function(x,i) {
        const v = x.vehicle;
        const rallySize = formatRallySize(x.capacity, x.capacityPlus);
        const scoreText = x.frankyScore.toFixed(1);
        const troopType = resolveTroopType(x.player, v);

        return '<div class="result-card">' +
          '<div class="rank">' + (i+1) + '</div>' +
          '<div class="avatar">' + silhouette() + '</div>' +
          '<div class="result-main">' +
            '<div class="result-name">' + escapeHtml(x.player) + '</div>' +
            '<div class="vehicle-sub' + (troopIconHtml(troopType) ? ' has-troop' : '') + '">' + escapeHtml(apcLabel(v)) + troopIconHtml(troopType) + '</div>' +
            '<div class="result-rally-size">RALLY SIZE <strong>' + escapeHtml(rallySize) + '</strong></div>' +
            '<div class="result-score">FRANKY SCORE <strong>' + escapeHtml(scoreText) + '</strong></div>' +
          '</div>' +
          '<div class="result-right"><strong>' + escapeHtml(vehicleDisplay(v)) + '</strong><span>START RALLY</span></div>' +
        '</div>';
      }).join("");
    }

    let note = document.getElementById("capacityPending");
    if (!note) {
      const tip = document.querySelector("#results .tip");
      if (tip) {
        note = document.createElement("div");
        note.id = "capacityPending";
        note.className = "pending-capacity";
        tip.parentNode.insertBefore(note, tip);
      }
    }

    if (note) {
      note.textContent = sourceSchema === "apc"
        ? txt(
            "FRANKY SCORE : 60 % puissance de l’APC + 40 % Rally Size. La même Rally Size du joueur est appliquée à toutes ses APC.",
            "FRANKY SCORE: 60% APC power + 40% Rally Size. The player's same Rally Size is applied to all of their APCs.",
            "FRANKY SCORE: 60% potenza APC + 40% Rally Size. La stessa Rally Size del giocatore viene applicata a tutte le sue APC.",
            "FRANKY SCORE: 60 % APC-Stärke + 40 % Rally-Größe. Für alle APCs eines Spielers wird dieselbe Rally-Größe verwendet."
          )
        : txt(
            "Rally Size indisponible dans cette ancienne source : classement provisoire basé uniquement sur la puissance.",
            "Rally Size is unavailable in this legacy source: temporary ranking is based on power only.",
            "La Rally Size non è disponibile in questa fonte precedente: classifica provvisoria basata solo sulla potenza.",
            "Rally-Größe ist in dieser alten Quelle nicht verfügbar: vorläufige Rangliste nur nach Stärke."
          );
    }
  };

  renderAll = function() {
    applyLang();
    renderPlayers();
    renderVehicles();
    renderResults();
    document.getElementById("onlineCount").textContent = sel().length;
    updateSyncStrip();
  };

  function selectedNames() {
    const map = {};
    players.forEach(function(p) {
      if (p.selected) map[p.name] = true;
    });
    return map;
  }

  function applyValues(values, updatedAt, preserveCurrentSelection) {
    buildTroopTypeIndex(values);
    const current = preserveCurrentSelection ? selectedNames() : null;
    const stored = loadStoredSelection();
    const keep = current !== null ? current : (stored || {});
    const parsed = parseSheet(values);
    parsed.forEach(function(p) { p.selected = !!keep[p.name]; });

    players.splice(0, players.length);
    parsed.forEach(function(p) { players.push(p); });

    saveStoredSelection();
    lastSync = updatedAt || new Date().toISOString();
    renderAll();
  }

  function loadCachedData() {
    try {
      const raw = localStorage.getItem(CACHE_KEY);
      if (!raw) return false;

      const cached = JSON.parse(raw);
      if (!cached || !Array.isArray(cached.values) || !cached.savedAt) return false;
      if ((Date.now() - cached.savedAt) > CACHE_MAX_AGE) return false;

      applyValues(cached.values, cached.updatedAt || cached.savedAt, false);
      syncState = "cached";
      updateSyncStrip();
      return true;
    } catch (_) {
      return false;
    }
  }

  function saveCache(payload) {
    try {
      localStorage.setItem(CACHE_KEY, JSON.stringify({
        values: payload.values,
        updatedAt: payload.updatedAt || new Date().toISOString(),
        savedAt: Date.now()
      }));
    } catch (_) {}
  }

  function loadLiveData(hasCache) {
    syncState = hasCache ? "cached" : "loading";
    updateSyncStrip();

    const callbackName = "__frankySheetDataLoaded";
    const old = document.getElementById("frankyDataScript");
    if (old) old.remove();

    window[callbackName] = function(payload) {
      try {
        if (!payload || payload.ok !== true || !Array.isArray(payload.values)) {
          throw new Error("Bad payload");
        }

        saveCache(payload);
        applyValues(payload.values, payload.updatedAt, true);
        syncState = "ok";
        updateSyncStrip();
      } catch (err) {
        syncState = "error";
        updateSyncStrip();
      } finally {
        try { delete window[callbackName]; } catch (_) {}
      }
    };

    const script = document.createElement("script");
    script.id = "frankyDataScript";
    const bucket = Math.floor(Date.now() / 30000);
    script.src = API_URL + "?action=data&callback=" + encodeURIComponent(callbackName) + "&v=" + bucket + "&_=" + Date.now();
    script.onerror = function() {
      syncState = "error";
      updateSyncStrip();
    };
    document.head.appendChild(script);
  }

  const stalePoster = document.getElementById("frankyPosterPreview");
  if (stalePoster && stalePoster.parentNode) stalePoster.parentNode.removeChild(stalePoster);

  addLiveStyles();
  ensureRallySelectorOnTop();
  setupPlayerFilter();
  setupVehicleSort();
  addSyncStrip();
  checkForAppUpdate();

  players.splice(0, players.length);
  renderAll();

  const hasCache = loadCachedData();
  loadLiveData(hasCache);
})();