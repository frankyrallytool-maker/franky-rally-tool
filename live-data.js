(function () {
  const API_URL = "https://script.google.com/macros/s/AKfycbxuxysWcVsk_Y6eARCGne_iH-hGUOSkAa2bkTuDLGXU9jgJ1sJPgz58Q41Cf0UcVo8svA/exec";
  const APP_BUILD = "1.16.3";
  const CACHE_KEY = "franky_sheet_cache_v16";
  const CACHE_MAX_AGE = 7 * 24 * 60 * 60 * 1000;
  const SELECTION_KEY = "franky_selected_players_v1";
  const VEHICLE_SORT_KEY = "franky_vehicle_sort_v1";
  const VEHICLE_TROOP_FILTER_KEY = "franky_vehicle_troop_filter_v1";
  const RESULT_TROOP_FILTER_KEY = "franky_result_troop_filter_v1";

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
  let directTroopTypeIndex = {};
  const STATIC_TROOP_TYPE_INDEX = {
    "Riley Sky ツ||1": "fighter",
    "Riley Sky ツ||2": "shooter",
    "Riley Sky ツ||3": "none",
    "Riley Sky ツ||4": "none"
  };
  let vehicleSortMode = (function(){
    try { return localStorage.getItem(VEHICLE_SORT_KEY) === "capacity" ? "capacity" : "power"; }
    catch (_) { return "power"; }
  })();

  function normalizeTroopFilter(value) {
    const s = String(value || "").toLowerCase();
    return (s === "fighter" || s === "shooter" || s === "rider" || s === "none") ? s : "all";
  }

  let vehicleTroopFilter = (function(){
    try { return normalizeTroopFilter(localStorage.getItem(VEHICLE_TROOP_FILTER_KEY)); }
    catch (_) { return "all"; }
  })();

  let resultTroopFilter = (function(){
    try { return normalizeTroopFilter(localStorage.getItem(RESULT_TROOP_FILTER_KEY)); }
    catch (_) { return "all"; }
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

  function troopFilterOptionsHtml(selected) {
    const options = [
      ["all", txt("Tous les types", "All types", "Tutti i tipi", "Alle Typen")],
      ["fighter", "Fighter"],
      ["shooter", "Shooter"],
      ["rider", "Rider"],
      ["none", txt("Sans restriction", "No Restriction", "Nessuna restrizione", "Keine Einschränkung")]
    ];

    return options.map(function(item) {
      return '<option value="' + item[0] + '"' + (selected === item[0] ? ' selected' : '') + '>' + escapeHtml(item[1]) + '</option>';
    }).join("");
  }

  function setupTroopFilters() {
    const vehiclePanel = document.querySelector("#vehicles .panel");
    const vehicleSortBar = vehiclePanel ? vehiclePanel.querySelector(".vehicle-sort-bar") : null;

    if (vehiclePanel && vehicleSortBar && !document.getElementById("vehicleTroopFilter")) {
      const bar = document.createElement("div");
      bar.className = "troop-filter-bar";
      bar.innerHTML =
        '<label for="vehicleTroopFilter"></label>' +
        '<select id="vehicleTroopFilter" aria-label="Troop type filter">' + troopFilterOptionsHtml(vehicleTroopFilter) + '</select>';
      vehicleSortBar.insertAdjacentElement("afterend", bar);
    }

    const resultPanel = document.querySelector("#results .panel");
    const resultSub = resultPanel ? resultPanel.querySelector(".panel-sub") : null;

    if (resultPanel && resultSub && !document.getElementById("resultTroopFilter")) {
      const bar = document.createElement("div");
      bar.className = "troop-filter-bar";
      bar.innerHTML =
        '<label for="resultTroopFilter"></label>' +
        '<select id="resultTroopFilter" aria-label="Troop type filter">' + troopFilterOptionsHtml(resultTroopFilter) + '</select>';
      resultSub.insertAdjacentElement("afterend", bar);
    }

    const vehicleSelect = document.getElementById("vehicleTroopFilter");
    if (vehicleSelect && vehicleSelect.dataset.ready !== "1") {
      vehicleSelect.dataset.ready = "1";
      vehicleSelect.value = vehicleTroopFilter;
      vehicleSelect.addEventListener("change", function() {
        vehicleTroopFilter = normalizeTroopFilter(vehicleSelect.value);
        try { localStorage.setItem(VEHICLE_TROOP_FILTER_KEY, vehicleTroopFilter); } catch (_) {}
        renderVehicles();
      });
    }

    const resultSelect = document.getElementById("resultTroopFilter");
    if (resultSelect && resultSelect.dataset.ready !== "1") {
      resultSelect.dataset.ready = "1";
      resultSelect.value = resultTroopFilter;
      resultSelect.addEventListener("change", function() {
        resultTroopFilter = normalizeTroopFilter(resultSelect.value);
        try { localStorage.setItem(RESULT_TROOP_FILTER_KEY, resultTroopFilter); } catch (_) {}
        renderResults();
      });
    }

    updateTroopFilterUI();
  }

  function updateTroopFilterUI() {
    [
      ["vehicleTroopFilter", vehicleTroopFilter],
      ["resultTroopFilter", resultTroopFilter]
    ].forEach(function(pair) {
      const select = document.getElementById(pair[0]);
      if (!select) return;
      const label = select.parentNode ? select.parentNode.querySelector("label") : null;
      if (label) label.textContent = txt("Type de troupe", "Troop type", "Tipo di truppa", "Truppentyp");
      select.innerHTML = troopFilterOptionsHtml(pair[1]);
      select.value = pair[1];
    });
  }

  function matchesTroopFilter(playerName, vehicle, filterValue) {
    const filter = normalizeTroopFilter(filterValue);
    if (filter === "all") return true;
    const type = normalizeTroopType(resolveTroopType(playerName, vehicle));
    return type === filter;
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
      ".troop-filter-bar{display:flex;align-items:center;justify-content:space-between;gap:10px;margin:0 0 10px;padding:8px 10px;border:1px solid #254664;border-radius:10px;background:#0b1724}",
      ".troop-filter-bar label{font-size:9px;color:#9cb2c9;font-weight:900;letter-spacing:.05em;text-transform:uppercase}",
      ".troop-filter-bar select{min-width:145px;padding:7px 9px;border-radius:8px;border:1px solid #3474a9;background:#0d2135;color:#eaf6ff;font-size:11px;font-weight:900}",
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

          // Anti-loop guard: if this exact target version is already in the URL,
          // do not reload again even if GitHub/CDN serves files out of sync briefly.
          const url = new URL(window.location.href);
          if (url.searchParams.get("appv") === String(v.build)) return;

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

    const iconMap = {
      fighter: "./assets/troops/fighter.png?v=3",
      shooter: "./assets/troops/shooter.png?v=3",
      rider: "./assets/troops/rider.png?v=3"
    };

    const src = iconMap[normalized];
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

    const key = troopIndexKey(playerName, vehicle.apcNo);
    if (directTroopTypeIndex[key]) return directTroopTypeIndex[key];
    if (STATIC_TROOP_TYPE_INDEX[key]) return STATIC_TROOP_TYPE_INDEX[key];

    const direct = normalizeTroopType(vehicle.troopType);
    if (direct) return direct;

    return troopTypeIndex[key] || null;
  }

  function loadDirectTroopTypes() {
    // V1.15.1: troop types are carried directly by the canonical synced APC data.
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

    const filtered = all.filter(function(x) {
      return matchesTroopFilter(x.player, x.vehicle, vehicleTroopFilter);
    });

    all.splice(0, all.length);
    filtered.forEach(function(x) { all.push(x); });

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

    updateTroopFilterUI();

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
      el.innerHTML = '<div class="empty-state">' +
        (vehicleTroopFilter === "all"
          ? txt("Sélectionne d’abord les joueurs présents.", "Select the players who are online first.", "Seleziona prima i giocatori online.", "Wähle zuerst die Spieler aus, die online sind.")
          : txt("Aucune APC ne correspond à ce type de troupe.", "No APC matches this troop type.", "Nessuna APC corrisponde a questo tipo di truppa.", "Keine APC entspricht diesem Truppentyp.")) +
        '</div>';
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

    const filteredApcs = apcs.filter(function(x) {
      return matchesTroopFilter(x.player, x.vehicle, resultTroopFilter);
    });

    apcs.splice(0, apcs.length);
    filteredApcs.forEach(function(x) { apcs.push(x); });

    updateTroopFilterUI();

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
      list.innerHTML = '<div class="empty-state">' +
        (resultTroopFilter === "all"
          ? txt("Aucune APC disponible parmi les joueurs sélectionnés.", "No APC available among selected players.", "Nessuna APC disponibile tra i giocatori selezionati.", "Keine APC bei den ausgewählten Spielern verfügbar.")
          : txt("Aucune APC ne correspond à ce type de troupe.", "No APC matches this troop type.", "Nessuna APC corrisponde a questo tipo di truppa.", "Keine APC entspricht diesem Truppentyp.")) +
        '</div>';
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
    updateTroopFilterUI();
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

  function applySyncedPlayerData(payload, preserveCurrentSelection) {
    if (!payload || !Array.isArray(payload.players)) throw new Error("Bad synced payload");

    const current = preserveCurrentSelection ? selectedNames() : null;
    const stored = loadStoredSelection();
    const keep = current !== null ? current : (stored || {});
    const parsed = [];
    const troopMap = {};

    payload.players.forEach(function(raw) {
      if (!raw) return;
      const name = String(raw.name || "").trim();
      if (!name) return;

      const rallySize = Number.isFinite(Number(raw.rallySize)) ? Number(raw.rallySize) : null;
      const rallySizePlus = !!raw.rallySizePlus;
      const vehicles = [];

      (Array.isArray(raw.apcs) ? raw.apcs : []).forEach(function(apc) {
        const apcNo = Number(apc && apc.apcNo);
        const powerM = Number(apc && apc.powerM);

        // Hard safety rule: Franky only supports APC 1 to APC 4.
        if (!Number.isInteger(apcNo) || apcNo < 1 || apcNo > 4) return;
        if (!Number.isFinite(powerM)) return;

        const troopType = normalizeTroopType(apc.troopType);

        vehicles.push({
          apcNo: apcNo,
          powerM: powerM,
          exact: true,
          capacity: rallySize,
          capacityPlus: rallySizePlus,
          troopType: troopType
        });

        if (troopType) troopMap[troopIndexKey(name, apcNo)] = troopType;
      });

      vehicles.sort(function(a,b){ return a.apcNo - b.apcNo; });

      const bestPower = vehicles.reduce(function(max, v) {
        return Math.max(max, v.powerM);
      }, 0);

      parsed.push({
        name: name,
        selected: !!keep[name],
        vehicles: vehicles,
        power: bestPower,
        capacity: rallySize,
        capacityPlus: rallySizePlus
      });
    });

    directTroopTypeIndex = troopMap;
    sourceSchema = "apc";

    players.splice(0, players.length);
    parsed.forEach(function(p) { players.push(p); });

    saveStoredSelection();
    lastSync = new Date().toISOString();
    renderAll();
  }

  function loadCachedData() {
    try {
      const raw = localStorage.getItem(CACHE_KEY);
      if (!raw) return false;

      const cached = JSON.parse(raw);
      if (!cached || !cached.payload || !Array.isArray(cached.payload.players) || !cached.savedAt) return false;
      if ((Date.now() - cached.savedAt) > CACHE_MAX_AGE) return false;

      applySyncedPlayerData(cached.payload, false);
      lastSync = cached.savedAt;
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
        payload: payload,
        savedAt: Date.now()
      }));
    } catch (_) {}
  }

  function loadLiveData(hasCache) {
    syncState = hasCache ? "cached" : "loading";
    updateSyncStrip();

    const old = document.getElementById("frankyCanonicalDataScript");
    if (old && old.parentNode) old.parentNode.removeChild(old);

    try { delete window.FRANKY_SYNC_DATA; } catch (_) { window.FRANKY_SYNC_DATA = undefined; }

    const script = document.createElement("script");
    script.id = "frankyCanonicalDataScript";
    script.src = "./franky-data.js?_=" + Date.now();

    script.onload = function() {
      try {
        const payload = window.FRANKY_SYNC_DATA;
        if (!payload || !Array.isArray(payload.players)) throw new Error("Bad synced payload");

        saveCache(payload);
        applySyncedPlayerData(payload, true);
        syncState = "ok";
        updateSyncStrip();
      } catch (_) {
        syncState = "error";
        updateSyncStrip();
      }
    };

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
  setupTroopFilters();
  addSyncStrip();
  checkForAppUpdate();

  players.splice(0, players.length);
  renderAll();

  const hasCache = loadCachedData();
  loadLiveData(hasCache);
})();