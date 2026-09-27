(function () {
  "use strict";

  function roundedRect(ctx, x, y, w, h, r) {
    var rr = Math.max(0, Math.min(r, Math.min(w, h) / 2));
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

  function fitText(ctx, text, maxWidth, startSize, minSize, weight, family) {
    var size = startSize;
    var ff = family || "Arial, Helvetica, sans-serif";
    while (size > minSize) {
      ctx.font = (weight || "900") + " " + size + "px " + ff;
      if (ctx.measureText(text).width <= maxWidth) return size;
      size -= 1;
    }
    ctx.font = (weight || "900") + " " + minSize + "px " + ff;
    return minSize;
  }


  function seededRandom(seed) {
    var s = (seed >>> 0) || 1;
    return function () {
      s ^= s << 13;
      s ^= s >>> 17;
      s ^= s << 5;
      return ((s >>> 0) % 100000) / 100000;
    };
  }

  function drawGrungeTexture(ctx, w, h, seed) {
    var rnd = seededRandom(seed || 434);

    ctx.save();

    // Dust / chipped paint.
    for (var i = 0; i < 360; i++) {
      var x = Math.floor(rnd() * w);
      var y = Math.floor(rnd() * h);
      var rw = 1 + Math.floor(rnd() * 9);
      var rh = 1 + Math.floor(rnd() * 3);
      ctx.fillStyle = rnd() > .55 ? "rgba(255,255,255,.045)" : "rgba(0,0,0,.10)";
      ctx.fillRect(x, y, rw, rh);
    }

    // Scratches.
    ctx.lineCap = "round";
    for (var j = 0; j < 58; j++) {
      var sx = rnd() * w;
      var sy = rnd() * h;
      var len = 16 + rnd() * 90;
      var ang = (-.22 + rnd() * .44);
      ctx.beginPath();
      ctx.moveTo(sx, sy);
      ctx.lineTo(sx + Math.cos(ang) * len, sy + Math.sin(ang) * len);
      ctx.strokeStyle = rnd() > .45 ? "rgba(232,244,252,.055)" : "rgba(255,91,168,.045)";
      ctx.lineWidth = .6 + rnd() * 1.5;
      ctx.stroke();
    }

    ctx.restore();
  }

  function drawDistressedFrame(ctx, w, h, seed) {
    var rnd = seededRandom(seed || 9152);
    ctx.save();

    // Burned / distressed edges.
    var edge = ctx.createLinearGradient(0, 0, 0, h);
    edge.addColorStop(0, "rgba(0,0,0,.44)");
    edge.addColorStop(.035, "rgba(0,0,0,0)");
    edge.addColorStop(.965, "rgba(0,0,0,0)");
    edge.addColorStop(1, "rgba(0,0,0,.55)");
    ctx.fillStyle = edge;
    ctx.fillRect(0, 0, w, h);

    var side = ctx.createLinearGradient(0, 0, w, 0);
    side.addColorStop(0, "rgba(0,0,0,.48)");
    side.addColorStop(.03, "rgba(0,0,0,0)");
    side.addColorStop(.97, "rgba(0,0,0,0)");
    side.addColorStop(1, "rgba(0,0,0,.48)");
    ctx.fillStyle = side;
    ctx.fillRect(0, 0, w, h);

    // Irregular light chips near the border.
    ctx.fillStyle = "rgba(223,236,244,.10)";
    for (var i = 0; i < 95; i++) {
      var top = rnd() > .5;
      var vertical = rnd() > .52;
      var x = vertical ? (rnd() > .5 ? rnd() * 16 : w - rnd() * 16) : rnd() * w;
      var y = top ? rnd() * 16 : h - rnd() * 16;
      if (vertical) y = rnd() * h;
      ctx.fillRect(x, y, 1 + rnd() * 8, 1 + rnd() * 2.2);
    }

    ctx.restore();
  }

  function drawHandTitle(ctx, text, x, y, maxWidth) {
    ctx.save();
    ctx.translate(x, y);
    ctx.rotate(-0.035);
    ctx.textAlign = "center";
    ctx.textBaseline = "alphabetic";

    var families = '"Brush Script MT","Segoe Print","Segoe Script","Comic Sans MS",cursive';
    var size = fitText(ctx, text, maxWidth, 94, 58, "900", families);

    // Rough dark shadow.
    ctx.font = "900 " + size + "px " + families;
    ctx.lineJoin = "round";
    ctx.strokeStyle = "rgba(0,0,0,.55)";
    ctx.lineWidth = 8;
    ctx.strokeText(text, 4, 6);

    // Dry-brush outer edge.
    ctx.strokeStyle = "#ff64b7";
    ctx.lineWidth = 3.5;
    ctx.strokeText(text, 0, 0);

    // Chalky hand-written fill.
    ctx.fillStyle = "#f4f1e9";
    ctx.fillText(text, 0, 0);

    // Imperfect pink highlight.
    ctx.globalAlpha = .72;
    ctx.fillStyle = "#ff73bd";
    ctx.fillText("TIME !", size * 1.08, 3);
    ctx.globalAlpha = 1;

    // Hand-painted underline.
    ctx.strokeStyle = "#ff64b7";
    ctx.lineCap = "round";
    ctx.lineWidth = 5;
    ctx.beginPath();
    ctx.moveTo(-maxWidth * .29, 18);
    ctx.quadraticCurveTo(0, 29, maxWidth * .31, 14);
    ctx.stroke();

    ctx.globalAlpha = .45;
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(-maxWidth * .22, 27);
    ctx.lineTo(maxWidth * .24, 22);
    ctx.stroke();

    ctx.restore();
  }

  function drawRowDistress(ctx, x, y, w, h, index) {
    var rnd = seededRandom(8000 + index * 97);
    ctx.save();
    ctx.strokeStyle = "rgba(212,232,245,.05)";
    ctx.lineWidth = 1;

    for (var i = 0; i < 5; i++) {
      var sx = x + 8 + rnd() * (w - 16);
      var sy = y + 4 + rnd() * (h - 8);
      ctx.beginPath();
      ctx.moveTo(sx, sy);
      ctx.lineTo(sx + 8 + rnd() * 28, sy + (rnd() - .5) * 4);
      ctx.stroke();
    }

    // Tiny paint slash.
    ctx.fillStyle = index % 3 === 0 ? "rgba(255,100,183,.22)" : "rgba(94,215,255,.14)";
    ctx.fillRect(x + 3, y + 7, 3, Math.max(10, h - 14));
    ctx.restore();
  }

  function drawCover(ctx, img, x, y, w, h, focusY) {
    var scale = Math.max(w / img.width, h / img.height);
    var sw = w / scale;
    var sh = h / scale;
    var sx = (img.width - sw) / 2;
    var fy = typeof focusY === "number" ? Math.max(0, Math.min(1, focusY)) : 0.5;
    var sy = (img.height - sh) * fy;
    ctx.drawImage(img, sx, sy, sw, sh, x, y, w, h);
  }

  function getBannerSource() {
    var banner = document.querySelector(".banner");
    if (!banner) return "";
    var bg = banner.style.backgroundImage || window.getComputedStyle(banner).backgroundImage || "";
    var match = bg.match(/^url\((['"]?)(.*)\1\)$/);
    return match ? match[2] : "";
  }

  function loadBanner(callback) {
    var src = getBannerSource();
    if (!src) {
      callback(null);
      return;
    }
    var img = new Image();
    img.onload = function () { callback(img); };
    img.onerror = function () { callback(null); };
    img.src = src;
  }

  function getRallyCount() {
    var el = document.getElementById("resultCount");
    return el ? (parseInt(el.textContent, 10) || 0) : 0;
  }

  function getLaunchers() {
    var cards = document.querySelectorAll("#resultsList .result-card");
    var groups = [];
    var byName = {};

    Array.prototype.forEach.call(cards, function (card) {
      var nameEl = card.querySelector(".result-name");
      var apcEl = card.querySelector(".vehicle-sub");
      var sizeEl = card.querySelector(".result-rally-size strong");
      var scoreEl = card.querySelector(".result-score strong");

      if (!nameEl || !apcEl) return;

      var name = String(nameEl.textContent || "").trim();
      var apc = String(apcEl.textContent || "").trim();
      var rallySize = sizeEl ? String(sizeEl.textContent || "").trim() : "";
      var frankyScore = scoreEl ? String(scoreEl.textContent || "").trim() : "";

      if (!name || !apc) return;

      if (!byName[name]) {
        byName[name] = { name: name, apcs: [], rallySize: rallySize, frankyScore: frankyScore };
        groups.push(byName[name]);
      }

      if (byName[name].apcs.indexOf(apc) === -1) byName[name].apcs.push(apc);
      if (!byName[name].rallySize && rallySize) byName[name].rallySize = rallySize;
      if (!byName[name].frankyScore && frankyScore) byName[name].frankyScore = frankyScore;
    });

    return groups;
  }

  function drawAvatar(ctx, x, y, size, index) {
    roundedRect(ctx, x, y, size, size, 9);
    ctx.fillStyle = index % 3 === 0 ? "#10283b" : index % 3 === 1 ? "#132132" : "#0d1b28";
    ctx.fill();
    ctx.strokeStyle = "rgba(180,215,240,.32)";
    ctx.lineWidth = 1;
    ctx.stroke();

    ctx.fillStyle = index % 2 === 0 ? "#7fc9ef" : "#b8d9ed";
    ctx.beginPath();
    ctx.arc(x + size / 2, y + size * .34, size * .16, 0, Math.PI * 2);
    ctx.fill();

    ctx.beginPath();
    ctx.arc(x + size / 2, y + size * .76, size * .27, Math.PI, 0);
    ctx.fill();
  }

  function drawLauncherRow(ctx, x, y, w, h, item, index) {
    roundedRect(ctx, x, y, w, h, 11);
    ctx.fillStyle = "rgba(5,18,29,.96)";
    ctx.fill();
    ctx.lineWidth = 1.3;
    ctx.strokeStyle = "rgba(101,165,208,.55)";
    ctx.stroke();
    drawRowDistress(ctx, x, y, w, h, index);

    var avatarSize = Math.max(30, Math.min(46, h - 8));
    drawAvatar(ctx, x + 7, y + (h - avatarSize) / 2, avatarSize, index);

    var left = x + avatarSize + 18;
    var right = x + w - 18;
    var apcX = x + Math.round(w * .50);

    ctx.textAlign = "left";
    ctx.textBaseline = "alphabetic";
    ctx.fillStyle = "#f5f9ff";
    fitText(ctx, item.name, Math.max(110, apcX - left - 15), h >= 48 ? 20 : 16, 12, "900");
    ctx.fillText(item.name, left, y + Math.round(h * .44));

    var apcText = item.apcs.join(" / ");
    ctx.fillStyle = "#bfe8ff";
    fitText(ctx, apcText, Math.max(110, right - apcX - 14), h >= 48 ? 18 : 14, 11, "900");
    ctx.fillText(apcText, apcX, y + Math.round(h * .44));

    ctx.fillStyle = "#9ab7ce";
    ctx.font = (h >= 48 ? "700 13px" : "700 11px") + " Arial, Helvetica, sans-serif";
    ctx.fillText("Rally size " + (item.rallySize || "—") + "  ·  Franky " + (item.frankyScore || "—"), apcX, y + Math.round(h * .76));

    ctx.fillStyle = "rgba(182,214,236,.55)";
    ctx.font = "900 " + (h >= 48 ? 20 : 16) + "px Arial, Helvetica, sans-serif";
    ctx.fillText("›", right - 2, y + Math.round(h * .58));
  }

  function showPreview(blob, count, launcherCount) {
    var url = URL.createObjectURL(blob);
    var overlay = document.getElementById("frankyPosterPreview");
    if (overlay) overlay.remove();

    overlay = document.createElement("div");
    overlay.id = "frankyPosterPreview";
    overlay.style.cssText =
      "position:fixed;inset:0;z-index:30000;background:rgba(2,8,14,.95);" +
      "padding:calc(14px + env(safe-area-inset-top)) 14px calc(14px + env(safe-area-inset-bottom));" +
      "overflow:auto;display:flex;align-items:flex-start;justify-content:center";

    var box = document.createElement("div");
    box.style.cssText =
      "width:min(430px,100%);margin:auto;background:#08131f;border:1px solid #244b6d;" +
      "border-radius:16px;padding:10px;box-shadow:0 18px 55px rgba(0,0,0,.55)";

    var img = document.createElement("img");
    img.src = url;
    img.alt = "ABYX FRANKY TIME";
    img.style.cssText = "display:block;width:100%;height:auto;border-radius:10px;background:#06111b";

    var meta = document.createElement("div");
    meta.textContent = count + " rallies · " + launcherCount + " launchers · " + Math.max(1, Math.round(blob.size / 1024)) + " KB";
    meta.style.cssText = "text-align:center;color:#7f96ad;font-size:10px;font-weight:800;margin:8px 0";

    var actions = document.createElement("div");
    actions.style.cssText = "display:grid;grid-template-columns:1fr 1fr;gap:7px";

    var share = document.createElement("button");
    share.type = "button";
    share.textContent = "SHARE";
    share.style.cssText = "min-height:44px;border:0;border-radius:9px;background:linear-gradient(180deg,#2ba9ff,#0874df);color:#fff;font-weight:950";

    var save = document.createElement("button");
    save.type = "button";
    save.textContent = "SAVE";
    save.style.cssText = "min-height:44px;border:1px solid #2b5277;border-radius:9px;background:#0d2135;color:#fff;font-weight:950";

    var close = document.createElement("button");
    close.type = "button";
    close.textContent = "CLOSE";
    close.style.cssText = "width:100%;min-height:42px;margin-top:7px;border:1px solid #233f59;border-radius:9px;background:#0b1724;color:#a7bbcf;font-weight:900";

    function saveFile() {
      var a = document.createElement("a");
      a.href = url;
      a.download = "ABYX_FRANKY_TIME_" + count + "_RALLIES.jpg";
      document.body.appendChild(a);
      a.click();
      a.remove();
    }

    save.addEventListener("click", saveFile);

    share.addEventListener("click", function () {
      try {
        var file = new File([blob], "ABYX_FRANKY_TIME_" + count + "_RALLIES.jpg", { type: "image/jpeg" });
        if (navigator.share && (!navigator.canShare || navigator.canShare({ files: [file] }))) {
          navigator.share({
            title: "ABYX FRANKY TIME!",
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
    var groups = getLaunchers();
    var rallyCount = getRallyCount();

    if (!groups.length || !rallyCount) {
      window.alert("Build a rally plan first.");
      return;
    }

    var button = document.getElementById("generateImageBtn");
    var originalText = button ? button.textContent : "GENERATE IMAGE";
    if (button) {
      button.disabled = true;
      button.textContent = "GENERATING…";
    }

    loadBanner(function (bannerImg) {
      var canvas = document.createElement("canvas");
      canvas.width = 900;
      canvas.height = 1600;
      var ctx = canvas.getContext("2d");

      if (!ctx) {
        if (button) {
          button.disabled = false;
          button.textContent = originalText;
        }
        return;
      }

      var W = 900;
      var H = 1600;

      var bg = ctx.createLinearGradient(0, 0, 0, H);
      bg.addColorStop(0, "#06131f");
      bg.addColorStop(.56, "#07131e");
      bg.addColorStop(1, "#03080d");
      ctx.fillStyle = bg;
      ctx.fillRect(0, 0, W, H);
      drawGrungeTexture(ctx, W, H, 434);

      // Cinematic top art inspired by the validated Dark War mockup.
      if (bannerImg) {
        drawCover(ctx, bannerImg, 0, 0, W, 470, .22);
      } else {
        var art = ctx.createRadialGradient(590, 90, 20, 590, 120, 560);
        art.addColorStop(0, "#1d6e93");
        art.addColorStop(.45, "#12374d");
        art.addColorStop(1, "#07121d");
        ctx.fillStyle = art;
        ctx.fillRect(0, 0, W, 470);
      }

      var shade = ctx.createLinearGradient(0, 0, 0, 500);
      shade.addColorStop(0, "rgba(1,8,14,.10)");
      shade.addColorStop(.58, "rgba(1,8,14,.28)");
      shade.addColorStop(1, "rgba(1,8,14,.98)");
      ctx.fillStyle = shade;
      ctx.fillRect(0, 0, W, 510);

      // Header copy.
      ctx.textAlign = "left";
      ctx.fillStyle = "#e9f4fb";
      ctx.font = "900 42px Arial, Helvetica, sans-serif";
      ctx.fillText("ABYX", 38, 66);

      ctx.fillStyle = "#b7d3e6";
      ctx.font = "800 13px Arial, Helvetica, sans-serif";
      ctx.fillText("SURVIVE", 40, 103);
      ctx.fillText("BUILD", 40, 121);
      ctx.fillText("FIGHT", 40, 139);
      ctx.fillText("TOGETHER", 40, 157);

      ctx.fillStyle = "#ff67b7";
      ctx.font = "900 italic 20px Arial, Helvetica, sans-serif";
      ctx.fillText("SAME ALLIANCE", 34, 218);
      ctx.fillText("BIGGER TOMORROW", 34, 244);

      ctx.textAlign = "right";
      ctx.fillStyle = "#d7eaf7";
      ctx.font = "900 15px Arial, Helvetica, sans-serif";
      ctx.fillText("HUMANITY", 858, 96);
      ctx.fillText("STILL FIGHTS", 858, 116);

      // Validated title.
      ctx.textAlign = "center";
      ctx.fillStyle = "#f3f8fb";
      fitText(ctx, "ABYX", 540, 78, 58, "900");
      ctx.fillText("ABYX", W / 2, 250);

      drawHandTitle(ctx, "FRANKY TIME !", W / 2, 337, 760);

      ctx.fillStyle = "#c6e7f8";
      ctx.font = "900 italic 28px Arial, Helvetica, sans-serif";
      ctx.fillText("STRONGER TOGETHER", W / 2, 392);

      // Single launcher panel, matching the approved format.
      var panelX = 126;
      var panelY = 430;
      var panelW = 648;
      var panelH = 800;

      roundedRect(ctx, panelX, panelY, panelW, panelH, 18);
      var panelGrad = ctx.createLinearGradient(panelX, panelY, panelX + panelW, panelY + panelH);
      panelGrad.addColorStop(0, "rgba(5,16,26,.97)");
      panelGrad.addColorStop(.55, "rgba(7,20,31,.94)");
      panelGrad.addColorStop(1, "rgba(3,11,18,.98)");
      ctx.fillStyle = panelGrad;
      ctx.fill();
      ctx.strokeStyle = "rgba(155,195,222,.34)";
      ctx.lineWidth = 2;
      ctx.stroke();

      roundedRect(ctx, panelX - 6, panelY - 14, panelW + 12, 64, 10);
      ctx.fillStyle = "rgba(12,30,45,.98)";
      ctx.fill();
      ctx.strokeStyle = "rgba(153,193,220,.35)";
      ctx.stroke();

      ctx.textAlign = "left";
      ctx.fillStyle = "#9ed5f8";
      ctx.font = "900 27px Arial, Helvetica, sans-serif";
      ctx.fillText("RALLIES LAUNCHERS !", panelX + 38, panelY + 28);
      ctx.strokeStyle = "rgba(255,100,183,.72)";
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.moveTo(panelX + 32, panelY + 41);
      ctx.lineTo(panelX + 292, panelY + 37);
      ctx.stroke();

      ctx.textAlign = "right";
      ctx.fillStyle = "#ff7bc2";
      ctx.font = "900 italic 16px Arial, Helvetica, sans-serif";
      ctx.fillText("MORE RALLIES", panelX + panelW - 20, panelY + 16);
      ctx.fillText("A SAFER TOMORROW", panelX + panelW - 20, panelY + 36);

      var maxRows = Math.min(groups.length, 18);
      var shown = groups.slice(0, maxRows);
      var listTop = panelY + 60;
      var listBottom = panelY + panelH - 18;
      var availableH = listBottom - listTop;
      var gap = maxRows >= 15 ? 4 : 6;
      var rowH = Math.floor((availableH - gap * Math.max(0, maxRows - 1)) / Math.max(1, maxRows));
      rowH = Math.max(35, Math.min(58, rowH));

      shown.forEach(function (item, index) {
        drawLauncherRow(ctx, panelX + 12, listTop + index * (rowH + gap), panelW - 24, rowH, item, index);
      });

      // Lower cinematic strip.
      if (bannerImg) {
        drawCover(ctx, bannerImg, 0, 1215, W, 235, .78);
      } else {
        var lower = ctx.createLinearGradient(0, 1215, 0, 1450);
        lower.addColorStop(0, "#142c3d");
        lower.addColorStop(1, "#071018");
        ctx.fillStyle = lower;
        ctx.fillRect(0, 1215, W, 235);
      }

      var lowerShade = ctx.createLinearGradient(0, 1210, 0, 1465);
      lowerShade.addColorStop(0, "rgba(2,8,13,.22)");
      lowerShade.addColorStop(.55, "rgba(2,8,13,.38)");
      lowerShade.addColorStop(1, "rgba(2,8,13,.88)");
      ctx.fillStyle = lowerShade;
      ctx.fillRect(0, 1210, W, 260);

      // Lower slogans.
      ctx.textAlign = "left";
      ctx.fillStyle = "#d3e7f5";
      ctx.font = "900 italic 20px Arial, Helvetica, sans-serif";
      ctx.fillText("GOOD PEOPLE", 36, 1284);
      ctx.fillText("STILL EXIST", 36, 1310);

      ctx.textAlign = "right";
      ctx.fillStyle = "#ff77bf";
      ctx.fillText("UNITED", 864, 1374);
      ctx.fillText("WE SURVIVE", 864, 1400);

      // Join strip.
      roundedRect(ctx, 245, 1372, 410, 50, 12);
      ctx.fillStyle = "#ff64b7";
      ctx.fill();
      ctx.textAlign = "center";
      ctx.fillStyle = "#101720";
      ctx.font = "900 italic 24px Arial, Helvetica, sans-serif";
      ctx.fillText("All the other plz join !", W / 2, 1405);

      // Rally count.
      roundedRect(ctx, 82, 1435, 736, 96, 14);
      ctx.fillStyle = "rgba(10,18,27,.96)";
      ctx.fill();
      ctx.strokeStyle = "rgba(210,228,241,.30)";
      ctx.lineWidth = 3;
      ctx.stroke();

      ctx.fillStyle = "#eaf6ff";
      fitText(ctx, rallyCount + " RALLIES TO BE SENT !!", 680, 55, 34, "900");
      ctx.fillText(rallyCount + " RALLIES TO BE SENT !!", W / 2, 1496);

      ctx.strokeStyle = "#ff64b7";
      ctx.lineWidth = 4;
      ctx.beginPath();
      ctx.moveTo(280, 1517);
      ctx.lineTo(620, 1517);
      ctx.stroke();

      ctx.fillStyle = "#a9c7db";
      ctx.font = "800 13px Arial, Helvetica, sans-serif";
      ctx.fillText("ABYX · FRANKY EVENT", W / 2, 1572);

      // Final grunge pass: scratches + worn poster edges.
      drawGrungeTexture(ctx, W, H, 20260927);
      drawDistressedFrame(ctx, W, H, 2026);

      canvas.toBlob(function (blob) {
        if (button) {
          button.disabled = false;
          button.textContent = originalText;
        }
        if (!blob) return;
        showPreview(blob, rallyCount, groups.length);
      }, "image/jpeg", 0.78);
    });
  }

  var button = document.getElementById("generateImageBtn");
  if (button) button.addEventListener("click", generate);
})();