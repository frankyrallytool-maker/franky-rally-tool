(function () {
  const API_URL = "https://script.google.com/macros/s/AKfycbxuxysWcVsk_Y6eARCGne_iH-hGUOSkAa2bkTuDLGXU9jgJ1sJPgz58Q41Cf0UcVo8svA/exec";

  const POWER_RANGES = [
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

  function txt(fr, en) { return lang === "fr" ? fr : en; }

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
      ".player-row.no-data{opacity:.52}",
      ".player-row.no-data .check{cursor:not-allowed}",
      ".vehicle-range{font-size:10px;color:#9bdfff;font-weight:900;margin-top:3px}",
      ".empty-state{padding:18px 12px;text-align:center;border:1px dashed #27425f;border-radius:10px;color:#7890aa;font-size:10px}",
      ".pending-capacity{margin-top:8px;padding:8px 10px;border-radius:9px;background:rgba(233,178,71,.10);border:1px solid rgba(233,178,71,.25);font-size:9px;line-height:1.45;color:#e8c987}"
    ].join("");
    document.head.appendChild(style);
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
  }

  function updateSyncStrip() {
    const strip = document.getElementById("syncStrip");
    const label = document.getElementById("syncText");
    if (!strip || !label) return;
    strip.className = "sync-strip " + (syncState === "ok" ? "ok" : syncState === "error" ? "error" : "");
    if (syncState === "loading") {
      label.textContent = txt("Chargement du Google Sheet…", "Loading Google Sheet…");
    } else if (syncState === "error") {
      label.textContent = txt("Impossible de charger les données en direct.", "Unable to load live data.");
    } else {
      const time = lastSync ? new Date(lastSync).toLocaleTimeString([], {hour:"2-digit", minute:"2-digit"}) : "";
      label.textContent = txt("Données Google Sheet chargées", "Google Sheet data loaded") + (time ? " · " + time : "");
    }
  }

  function parseExactValue(num, unit, rangeIndex) {
    let n = parseFloat(String(num).replace(",", "."));
    if (!Number.isFinite(n)) return null;
    const u = String(unit || "").toLowerCase();
    if (u === "g") return n * 1000;
    if (u === "m") return n;
    if (rangeIndex === 9 && n < 10) return n * 1000;
    return n;
  }

  function parsePowerCell(raw, rangeIndex) {
    let s = String(raw || "").trim();
    if (!s) return [];
    const range = POWER_RANGES[rangeIndex];
    const cars = [];

    s = s.replace(/(\d+)\s*[x×]\s*(\d+(?:[.,]\d+)?)\s*([mMgG])?/g, function(_, count, value, unit) {
      const p = parseExactValue(value, unit, rangeIndex);
      const c = Math.min(8, Math.max(1, parseInt(count, 10) || 1));
      if (p !== null) for (let i=0; i<c; i++) cars.push({powerM:p, exact:true, rangeLabel:range.label});
      return " ";
    });

    const numRe = /(\d+(?:[.,]\d+)?)\s*([mMgG])?/g;
    let match;
    while ((match = numRe.exec(s)) !== null) {
      const p = parseExactValue(match[1], match[2], rangeIndex);
      if (p !== null) cars.push({powerM:p, exact:true, rangeLabel:range.label});
    }

    const xCount = (s.match(/\bX\b/gi) || []).length;
    for (let i=0; i<xCount; i++) cars.push({powerM:range.estimate, exact:false, rangeLabel:range.label});
    return cars;
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

  function vehicleDisplay(v) { return v.exact ? formatPowerM(v.powerM) : v.rangeLabel; }

  function parseSheet(values) {
    if (!Array.isArray(values) || values.length < 2) return [];
    const result = [];
    values.slice(1).forEach(function(row) {
      const name = String(row[0] || "").trim();
      if (!name) return;
      const vehicles = [];
      for (let i=0; i<POWER_RANGES.length; i++) {
        parsePowerCell(row[i+1], i).forEach(v => vehicles.push(v));
      }
      vehicles.sort((a,b) => b.powerM - a.powerM);
      vehicles.forEach((v,i) => { v.index=i+1; v.capacity=null; });
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

  score = function(p) { return Number(p.power) || 0; };

  renderPlayers = function() {
    const box = document.getElementById("playersList");
    box.innerHTML = "";
    players.forEach(function(p,i) {
      const hasData = p.vehicles && p.vehicles.length > 0;
      const row = document.createElement("label");
      row.className = "player-row" + (p.selected ? " selected" : "") + (!hasData ? " no-data" : "");
      let meta;
      if (!hasData) {
        meta = txt("Aucune puissance renseignée", "No vehicle power data");
      } else {
        const count = p.vehicles.length;
        meta = count + " " + txt(count > 1 ? "voitures" : "voiture", count > 1 ? "cars" : "car") +
          " · " + txt("Meilleure ", "Best ") + vehicleDisplay(p.vehicles[0]);
      }
      row.innerHTML =
        '<input class="check" type="checkbox" ' + (p.selected ? "checked" : "") + ' ' + (!hasData ? "disabled" : "") + ' data-i="' + i + '">' +
        '<div class="avatar">' + silhouette() + '</div>' +
        '<div><div class="player-name">' + escapeHtml(p.name) + '</div><div class="player-meta">' + escapeHtml(meta) + '</div></div>';
      box.appendChild(row);
    });
    box.querySelectorAll(".check").forEach(function(c) {
      c.onchange = function(e) { players[+e.target.dataset.i].selected=e.target.checked; renderAll(); };
    });
  };

  renderVehicles = function() {
    const all = [];
    sel().forEach(function(p) {
      (p.vehicles || []).forEach(function(v,i) { all.push({player:p.name, vehicle:v, carNo:i+1}); });
    });
    all.sort((a,b) => b.vehicle.powerM - a.vehicle.powerM);
    const el = document.getElementById("vehicleList");
    if (!all.length) {
      el.innerHTML = '<div class="empty-state">' + txt("Sélectionne d’abord les joueurs présents.", "Select the players who are online first.") + '</div>';
      return;
    }
    const maxPower = Math.max.apply(null, all.map(x => x.vehicle.powerM).concat([1]));
    el.innerHTML = all.map(function(x) {
      const v=x.vehicle;
      const width=Math.max(5,Math.min(100,(v.powerM/maxPower)*100));
      return '<div class="vehicle-card">' +
        '<div class="avatar">' + silhouette() + '</div>' +
        '<div><div class="vehicle-name">' + escapeHtml(x.player) + ' — Car ' + x.carNo + '</div>' +
        '<div class="vehicle-range">' + escapeHtml(vehicleDisplay(v)) + '</div>' +
        '<div class="metric-grid">' +
        '<div><div class="metric-label">' + escapeHtml(tr[lang].power) + '</div><div class="bar power"><i style="width:' + width + '%"></i></div></div>' +
        '<div><div class="metric-label">' + escapeHtml(tr[lang].capacity) + '</div><div class="bar cap"><i style="width:0%"></i></div></div>' +
        '</div></div>' +
        '<div class="vehicle-right"><strong>' + escapeHtml(vehicleDisplay(v)) + '</strong><span>—</span></div>' +
      '</div>';
    }).join("");
  };

  renderResults = function() {
    const selected = sel().filter(p => p.vehicles && p.vehicles.length);
    const n = Math.min(+document.getElementById("leaderCount").value, selected.length);
    const arr = selected.slice().sort((a,b) => score(b)-score(a)).slice(0,n);
    document.getElementById("resultCount").textContent=n;
    const list=document.getElementById("resultsList");
    if (!arr.length) {
      list.innerHTML='<div class="empty-state">' + txt("Aucun joueur sélectionné.", "No players selected.") + '</div>';
    } else {
      list.innerHTML=arr.map(function(p,i) {
        const best=p.vehicles[0];
        return '<div class="result-card">' +
          '<div class="rank">' + (i+1) + '</div>' +
          '<div class="avatar">' + silhouette() + '</div>' +
          '<div><div class="result-name">' + escapeHtml(p.name) + '</div><div class="vehicle-sub">' + txt("Meilleure voiture", "Best car") + ' · ' + escapeHtml(vehicleDisplay(best)) + '</div></div>' +
          '<div class="result-right"><strong>' + escapeHtml(vehicleDisplay(best)) + '</strong><span>' + txt("puissance uniquement", "power only") + '</span></div>' +
        '</div>';
      }).join("");
    }

    let note=document.getElementById("capacityPending");
    if (!note) {
      const tip=document.querySelector("#results .tip");
      if (tip) {
        note=document.createElement("div");
        note.id="capacityPending";
        note.className="pending-capacity";
        tip.parentNode.insertBefore(note,tip);
      }
    }
    if (note) note.textContent=txt(
      "Classement provisoire : la capacité des rallys n’est pas encore renseignée dans le Sheet.",
      "Temporary ranking: rally capacity is not in the Sheet yet."
    );
  };

  renderAll = function() {
    applyLang();
    renderPlayers();
    renderVehicles();
    renderResults();
    document.getElementById("onlineCount").textContent=sel().length;
    updateSyncStrip();
  };

  function loadLiveData() {
    syncState="loading";
    updateSyncStrip();
    const callbackName="__frankySheetDataLoaded";
    const old=document.getElementById("frankyDataScript");
    if (old) old.remove();

    window[callbackName]=function(payload) {
      try {
        if (!payload || payload.ok !== true || !Array.isArray(payload.values)) throw new Error("Bad payload");
        const parsed=parseSheet(payload.values);
        players.splice(0,players.length);
        parsed.forEach(p => players.push(p));
        lastSync=payload.updatedAt || new Date().toISOString();
        syncState="ok";
        renderAll();
      } catch (err) {
        syncState="error";
        updateSyncStrip();
      } finally {
        try { delete window[callbackName]; } catch (_) {}
      }
    };

    const script=document.createElement("script");
    script.id="frankyDataScript";
    script.src=API_URL + "?action=data&callback=" + encodeURIComponent(callbackName) + "&ts=" + Date.now();
    script.onerror=function(){ syncState="error"; updateSyncStrip(); };
    document.head.appendChild(script);
  }

  addLiveStyles();
  addSyncStrip();
  players.splice(0,players.length);
  renderAll();
  loadLiveData();
})();