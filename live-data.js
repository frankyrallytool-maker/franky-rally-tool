(function () {
  const API_URL = "https://script.google.com/macros/s/AKfycbxuxysWcVsk_Y6eARCGne_iH-hGUOSkAa2bkTuDLGXU9jgJ1sJPgz58Q41Cf0UcVo8svA/exec";
  const APP_BUILD = "1.10.14";
  const CACHE_KEY = "franky_sheet_cache_v2";
  const CACHE_MAX_AGE = 7 * 24 * 60 * 60 * 1000;

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

  function txt(fr, en, it, de) { if (lang === "fr") return fr; if (lang === "it") return it || en; if (lang === "de") return de || en; return en; }

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
      ".select-all-row{display:flex;align-items:center;gap:9px;margin:0 0 7px;padding:8px 10px;border:1px solid #285278;border-radius:10px;background:#0b1724;color:#cfeaff;font-size:10px;font-weight:950;letter-spacing:.05em}",
      ".select-all-row .check{flex:none}",
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
    container.querySelectorAll(".check").forEach(function(c) {
      c.onchange = function(e) {
        players[+e.target.dataset.i].selected = e.target.checked;

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
    values.slice(1).forEach(function(row) {
      const name = String(row[0] || "").trim();
      if (!name) return;

      const vehicles = [];
      for (let col = 1; col <= 4; col++) {
        const power = parseSimplePower(row[col]);
        if (power === null) continue;
        vehicles.push({
          apcNo: col,
          powerM: power,
          exact: true,
          capacity: null
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
        capacity: null
      });
    });
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
    const allSelected = players.length > 0 && players.every(function(p) { return p.selected; });
    const someSelected = players.some(function(p) { return p.selected; });

    box.innerHTML =
      '<label class="select-all-row">' +
        '<input id="selectAllPlayers" class="check" type="checkbox" ' + (allSelected ? 'checked' : '') + '>' +
        '<span>ALL</span>' +
      '</label>' +
      players.map(function(p, i) {
        return playerRowHtml(p, i);
      }).join("");

    const allBox = document.getElementById("selectAllPlayers");
    if (allBox) {
      allBox.indeterminate = someSelected && !allSelected;
      allBox.onchange = function(e) {
        const checked = e.target.checked;
        players.forEach(function(p) { p.selected = checked; });
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
      (p.vehicles || []).forEach(function(v) {
        all.push({player:p.name, vehicle:v});
      });
    });
    all.sort(function(a,b){ return b.vehicle.powerM - a.vehicle.powerM; });

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
      const precision = v.exact ? txt("Valeur exacte", "Exact value", "Valore esatto", "Exakter Wert") : txt("Tranche estimée", "Estimated band", "Fascia stimata", "Geschätzter Bereich");

      return '<div class="vehicle-card">' +
        '<div class="avatar">' + silhouette() + '</div>' +
        '<div><div class="vehicle-name">#' + (position+1) + ' · ' + escapeHtml(x.player) + ' — ' + escapeHtml(apcLabel(v)) + '</div>' +
        '<div class="vehicle-range">' + escapeHtml(vehicleDisplay(v)) + '</div>' +
        '<div class="metric-grid" style="grid-template-columns:1fr">' +
        '<div><div class="metric-label">' + escapeHtml(tr[lang].power) + '</div><div class="bar power"><i style="width:' + width + '%"></i></div></div>' +
        '</div></div>' +
        '<div class="vehicle-right"><strong>' + escapeHtml(vehicleDisplay(v)) + '</strong><span>' + escapeHtml(precision) + '</span></div>' +
      '</div>';
    }).join("");
  };

  renderResults = function() {
    const apcs = [];
    sel().forEach(function(p) {
      (p.vehicles || []).forEach(function(v) {
        apcs.push({player:p.name, vehicle:v});
      });
    });
    apcs.sort(function(a,b){ return b.vehicle.powerM - a.vehicle.powerM; });

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
        return '<div class="result-card">' +
          '<div class="rank">' + (i+1) + '</div>' +
          '<div class="avatar">' + silhouette() + '</div>' +
          '<div class="result-main"><div class="result-name">' + escapeHtml(x.player) + '</div><div class="vehicle-sub">' + escapeHtml(apcLabel(v)) + '</div></div>' +
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
            "Les APC 1, 2, 3 et 4 viennent directement de Feuille 3. Le classement est basé sur leur puissance exacte. La taille des rallys sera ajoutée plus tard.",
            "APC 1, 2, 3 and 4 come directly from Sheet 3. Ranking uses their exact power. Rally size will be added later.",
            "Le APC 1, 2, 3 e 4 provengono direttamente dal foglio dati. La classifica usa la loro potenza esatta. La dimensione dei rally sarà aggiunta in seguito.",
            "APC 1, 2, 3 und 4 stammen direkt aus dem Datenblatt. Die Rangliste verwendet ihre exakte Stärke. Die Rally-Größe wird später ergänzt."
          )
        : txt(
            "Source provisoire : l’ancien format du Sheet est encore utilisé. Passe l’Apps Script sur Feuille 3 pour afficher les numéros APC exacts.",
            "Temporary source: the old Sheet format is still in use. Switch Apps Script to Sheet 3 to display exact APC numbers.",
            "Fonte temporanea: è ancora in uso il vecchio formato del foglio. Passa Apps Script al foglio dati per mostrare i numeri APC esatti.",
            "Temporäre Quelle: Das alte Tabellenformat wird noch verwendet. Stelle Apps Script auf das Datenblatt um, um die exakten APC-Nummern anzuzeigen."
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
    const keep = preserveCurrentSelection ? selectedNames() : {};
    const parsed = parseSheet(values);
    parsed.forEach(function(p) { p.selected = !!keep[p.name]; });

    players.splice(0, players.length);
    parsed.forEach(function(p) { players.push(p); });

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
    script.src = API_URL + "?action=data&callback=" + encodeURIComponent(callbackName) + "&v=" + bucket;
    script.onerror = function() {
      syncState = "error";
      updateSyncStrip();
    };
    document.head.appendChild(script);
  }

  addLiveStyles();
  ensureRallySelectorOnTop();
  setupPlayerFilter();
  addSyncStrip();
  checkForAppUpdate();

  players.splice(0, players.length);
  renderAll();

  const hasCache = loadCachedData();
  loadLiveData(hasCache);
})();