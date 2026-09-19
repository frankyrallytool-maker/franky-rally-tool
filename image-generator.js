(function () {
  "use strict";

  function escapeText(value) {
    return String(value == null ? "" : value);
  }

  function roundedRect(ctx, x, y, w, h, r) {
    const rr = Math.min(r, w / 2, h / 2);
    ctx.beginPath();
    ctx.moveTo(x + rr, y);
    ctx.lineTo(x + w - rr, y);
    ctx.quadraticCurveTo(x + w, y, x + w, y + rr);
    ctx.lineTo(x + w, y + h - rr);
    ctx.quadraticCurveTo(x + w, y + h, x + w - rr, y + h);
    ctx.lineTo(x + rr, y + h);
    ctx.quadraticCurveTo(x, y + h, x, y + h - rr);
    ctx.lineTo(x, y + rr);
    ctx.quadraticCurveTo(x, y, x + rr, y);
    ctx.closePath();
  }

  function fitText(ctx, text, maxWidth, maxSize, minSize, weight) {
    let size = maxSize;
    while (size > minSize) {
      ctx.font = (weight || "900") + " " + size + "px Arial, Helvetica, sans-serif";
      if (ctx.measureText(text).width <= maxWidth) return size;
      size--;
    }
    ctx.font = (weight || "900") + " " + minSize + "px Arial, Helvetica, sans-serif";
    return minSize;
  }

  function getGroups() {
    const cards = document.querySelectorAll("#resultsList .result-card");
    const groups = [];
    const byName = {};

    Array.prototype.forEach.call(cards, function (card) {
      const nameEl = card.querySelector(".result-name");
      const apcEl = card.querySelector(".vehicle-sub");
      if (!nameEl || !apcEl) return;

      const name = nameEl.textContent.trim();
      const apc = apcEl.textContent.trim();
      if (!name || !apc) return;

      if (!byName[name]) {
        byName[name] = { name: name, apcs: [] };
        groups.push(byName[name]);
      }
      if (byName[name].apcs.indexOf(apc) === -1) {
        byName[name].apcs.push(apc);
      }
    });

    return groups;
  }

  function getRallyCount() {
    const count = document.getElementById("resultCount");
    return count ? (parseInt(count.textContent, 10) || 0) : 0;
  }

  function getBannerSource() {
    const banner = document.querySelector(".banner");
    if (!banner) return "";
    const style = banner.style.backgroundImage || window.getComputedStyle(banner).backgroundImage || "";
    const m = style.match(/^url\((['"]?)(.*)\1\)$/);
    return m ? m[2] : "";
  }

  function loadBanner(callback) {
    const src = getBannerSource();
    if (!src) {
      callback(null);
      return;
    }
    const img = new Image();
    img.onload = function () { callback(img); };
    img.onerror = function () { callback(null); };
    img.src = src;
  }

  function drawCover(ctx, img, x, y, w, h) {
    const scale = Math.max(w / img.width, h / img.height);
    const sw = w / scale;
    const sh = h / scale;
    const sx = (img.width - sw) / 2;
    const sy = (img.height - sh) / 2;
    ctx.drawImage(img, sx, sy, sw, sh, x, y, w, h);
  }

  function drawRow(ctx, x, y, w, h, item) {
    roundedRect(ctx, x, y, w, h, 12);
    ctx.fillStyle = "rgba(8,29,45,.96)";
    ctx.fill();
    ctx.lineWidth = 1.5;
    ctx.strokeStyle = "rgba(67,188,247,.75)";
    ctx.stroke();

    const divider = x + Math.round(w * 0.58);
    const apcText = item.apcs.join(" / ");

    ctx.textAlign = "left";
    ctx.textBaseline = "middle";
    ctx.fillStyle = "#f4f8ff";
    fitText(ctx, item.name, divider - x - 30, 22, 14, "900");
    ctx.fillText(item.name, x + 14, y + h / 2);

    ctx.strokeStyle = "rgba(83,173,221,.45)";
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(divider, y + 9);
    ctx.lineTo(divider, y + h - 9);
    ctx.stroke();

    ctx.textAlign = "right";
    ctx.fillStyle = "#59d8ff";
    fitText(ctx, apcText, x + w - divider - 24, 20, 13, "900");
    ctx.fillText(apcText, x + w - 14, y + h / 2);
  }

  function showPreview(blob, count, launcherCount) {
    const url = URL.createObjectURL(blob);

    let overlay = document.getElementById("frankyPosterPreview");
    if (overlay) overlay.remove();

    overlay = document.createElement("div");
    overlay.id = "frankyPosterPreview";
    overlay.style.cssText =
      "position:fixed;inset:0;z-index:30000;background:rgba(2,8,14,.94);" +
      "padding:calc(14px + env(safe-area-inset-top)) 14px calc(14px + env(safe-area-inset-bottom));" +
      "overflow:auto;display:flex;align-items:flex-start;justify-content:center";

    const box = document.createElement("div");
    box.style.cssText =
      "width:min(430px,100%);margin:auto;background:#08131f;border:1px solid #244b6d;" +
      "border-radius:16px;padding:10px;box-shadow:0 18px 55px rgba(0,0,0,.55)";

    const img = document.createElement("img");
    img.src = url;
    img.alt = "ABYX rally launchers";
    img.style.cssText = "display:block;width:100%;height:auto;border-radius:10px;background:#06111b";

    const meta = document.createElement("div");
    meta.textContent = count + " rallies · " + launcherCount + " launchers · " + Math.max(1, Math.round(blob.size / 1024)) + " KB";
    meta.style.cssText = "text-align:center;color:#7f96ad;font-size:10px;font-weight:800;margin:8px 0";

    const actions = document.createElement("div");
    actions.style.cssText = "display:grid;grid-template-columns:1fr 1fr;gap:7px";

    const share = document.createElement("button");
    share.type = "button";
    share.textContent = "SHARE";
    share.style.cssText = "min-height:44px;border:0;border-radius:9px;background:linear-gradient(180deg,#2ba9ff,#0874df);color:white;font-weight:950";

    const save = document.createElement("button");
    save.type = "button";
    save.textContent = "SAVE";
    save.style.cssText = "min-height:44px;border:1px solid #2b5277;border-radius:9px;background:#0d2135;color:white;font-weight:950";

    const close = document.createElement("button");
    close.type = "button";
    close.textContent = "CLOSE";
    close.style.cssText = "width:100%;min-height:42px;margin-top:7px;border:1px solid #233f59;border-radius:9px;background:#0b1724;color:#a7bbcf;font-weight:900";

    function saveFile() {
      const a = document.createElement("a");
      a.href = url;
      a.download = "ABYX_FRANKY_" + count + "_RALLIES.jpg";
      document.body.appendChild(a);
      a.click();
      a.remove();
    }

    save.addEventListener("click", saveFile);

    share.addEventListener("click", function () {
      try {
        const file = new File([blob], "ABYX_FRANKY_" + count + "_RALLIES.jpg", { type: "image/jpeg" });
        if (navigator.share && (!navigator.canShare || navigator.canShare({ files: [file] }))) {
          navigator.share({
            title: "ABYX — FRANKY RALLIES",
            text: count + " rallies to be sent!",
            files: [file]
          }).catch(function () {});
        } else {
          saveFile();
        }
      } catch (e) {
        saveFile();
      }
    });

    close.addEventListener("click", function () {
      URL.revokeObjectURL(url);
      overlay.remove();
    });

    overlay.addEventListener("click", function (e) {
      if (e.target === overlay) close.click();
    });

    actions.appendChild(share);
    actions.appendChild(save);
    box.appendChild(img);
    box.appendChild(meta);
    box.appendChild(actions);
    box.appendChild(close);
    overlay.appendChild(box);
    document.body.appendChild(overlay);
  }

  function generate() {
    const groups = getGroups();
    const count = getRallyCount();

    if (!groups.length || !count) {
      window.alert("Build a rally plan first.");
      return;
    }

    const button = document.getElementById("generateImageBtn");
    if (button) {
      button.disabled = true;
      button.textContent = "GENERATING…";
    }

    loadBanner(function (bannerImg) {
      const canvas = document.createElement("canvas");
      canvas.width = 900;
      canvas.height = 1200;

      const ctx = canvas.getContext("2d");
      if (!ctx) {
        if (button) button.disabled = false;
        return;
      }

      const W = 900;

      const bg = ctx.createLinearGradient(0, 0, 0, 1200);
      bg.addColorStop(0, "#081a2a");
      bg.addColorStop(0.55, "#07121d");
      bg.addColorStop(1, "#02070c");
      ctx.fillStyle = bg;
      ctx.fillRect(0, 0, 900, 1200);

      if (bannerImg) {
        drawCover(ctx, bannerImg, 0, 0, 900, 390);
      } else {
        const art = ctx.createRadialGradient(620, 80, 20, 620, 100, 500);
        art.addColorStop(0, "#17669a");
        art.addColorStop(0.55, "#0b2a42");
        art.addColorStop(1, "#06121d");
        ctx.fillStyle = art;
        ctx.fillRect(0, 0, 900, 390);
      }

      const shade = ctx.createLinearGradient(0, 0, 0, 420);
      shade.addColorStop(0, "rgba(2,10,17,.18)");
      shade.addColorStop(0.58, "rgba(2,10,17,.35)");
      shade.addColorStop(1, "rgba(2,10,17,.99)");
      ctx.fillStyle = shade;
      ctx.fillRect(0, 0, 900, 430);

      ctx.textAlign = "left";
      ctx.fillStyle = "#55d8ff";
      ctx.font = "italic 900 60px Arial, Helvetica, sans-serif";
      ctx.fillText("ABYX", 48, 88);

      ctx.fillStyle = "#bfe8ff";
      ctx.font = "800 14px Arial, Helvetica, sans-serif";
      ctx.fillText("STRONGER  TOGETHER", 51, 116);

      ctx.textAlign = "center";
      ctx.fillStyle = "#f4f8fb";
      ctx.font = "900 66px Arial, Helvetica, sans-serif";
      ctx.fillText("RALLIES", W / 2, 286);

      ctx.fillStyle = "#47d9ff";
      ctx.font = "italic 900 70px Arial, Helvetica, sans-serif";
      ctx.fillText("LAUNCHERS!", W / 2, 352);

      const panelX = 36;
      const panelY = 405;
      const panelW = 828;
      const panelH = 590;

      roundedRect(ctx, panelX, panelY, panelW, panelH, 22);
      ctx.fillStyle = "rgba(4,18,29,.97)";
      ctx.fill();
      ctx.strokeStyle = "rgba(50,187,245,.72)";
      ctx.lineWidth = 2;
      ctx.stroke();

      const twoCols = groups.length > 10;
      const colCount = twoCols ? 2 : 1;
      const rowsPerCol = Math.ceil(groups.length / colCount);
      const gapX = 12;
      const gapY = rowsPerCol > 9 ? 3 : 6;
      const innerX = panelX + 20;
      const innerW = panelW - 40;
      const colW = (innerW - gapX * (colCount - 1)) / colCount;
      const listTop = panelY + 44;
      const listHeight = 500;
      const rowH = Math.max(31, Math.min(54, Math.floor((listHeight - gapY * Math.max(0, rowsPerCol - 1)) / Math.max(1, rowsPerCol))));

      ctx.fillStyle = "#8fb5ce";
      ctx.font = "800 13px Arial, Helvetica, sans-serif";
      ctx.textAlign = "left";
      ctx.fillText("LAUNCHER", innerX + 12, panelY + 28);

      groups.forEach(function (item, index) {
        const col = Math.floor(index / rowsPerCol);
        const row = index % rowsPerCol;
        const x = innerX + col * (colW + gapX);
        const y = listTop + row * (rowH + gapY);
        drawRow(ctx, x, y, colW, rowH, item);
      });

      roundedRect(ctx, 98, 1015, 704, 58, 18);
      ctx.fillStyle = "rgba(10,39,59,.97)";
      ctx.fill();
      ctx.strokeStyle = "rgba(64,203,255,.55)";
      ctx.stroke();

      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.fillStyle = "#f2f8ff";
      ctx.font = "900 28px Arial, Helvetica, sans-serif";
      ctx.fillText("All the other plz join !", 450, 1044);

      ctx.fillStyle = "#4adfff";
      ctx.fillRect(40, 1092, 820, 76);

      ctx.fillStyle = "#031018";
      fitText(ctx, count + " RALLIES TO BE SENT !!", 760, 42, 28, "900");
      ctx.fillText(count + " RALLIES TO BE SENT !!", 450, 1130);

      ctx.fillStyle = "#6489a3";
      ctx.font = "800 12px Arial, Helvetica, sans-serif";
      ctx.fillText("ABYX  ·  FRANKY EVENT", 450, 1190);

      canvas.toBlob(function (blob) {
        if (button) {
          button.disabled = false;
          button.textContent = "GENERATE IMAGE";
        }
        if (!blob) return;
        showPreview(blob, count, groups.length);
      }, "image/jpeg", 0.78);
    });
  }

  const button = document.getElementById("generateImageBtn");
  if (button) button.addEventListener("click", generate);
})();