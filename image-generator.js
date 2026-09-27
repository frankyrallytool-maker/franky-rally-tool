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
    ctx.rotate(-0.012);
    ctx.textAlign = "center";
    ctx.textBaseline = "alphabetic";

    var family = '"Arial Black", Impact, "Segoe UI Black", Arial, sans-serif';
    var size = fitText(ctx, text, maxWidth, 88, 56, "900", family);
    ctx.font = "900 " + size + "px " + family;
    ctx.lineJoin = "round";

    // Deep shadow for separation from the artwork.
    ctx.strokeStyle = "rgba(0,0,0,.66)";
    ctx.lineWidth = 10;
    ctx.strokeText(text, 4, 7);

    // Thin electric-pink keyline, then an ivory fill.
    ctx.strokeStyle = "rgba(255,100,183,.92)";
    ctx.lineWidth = 4;
    ctx.strokeText(text, 0, 0);

    ctx.fillStyle = "#f7f2e8";
    ctx.fillText(text, 0, 0);

    // Two rough hand-painted accents keep a little personality without hurting legibility.
    ctx.strokeStyle = "#ff64b7";
    ctx.lineCap = "round";
    ctx.lineWidth = 5;
    ctx.beginPath();
    ctx.moveTo(-maxWidth * .30, 20);
    ctx.quadraticCurveTo(0, 31, maxWidth * .31, 17);
    ctx.stroke();

    ctx.globalAlpha = .46;
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(-maxWidth * .18, 29);
    ctx.lineTo(maxWidth * .24, 24);
    ctx.stroke();
    ctx.globalAlpha = 1;

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

  function drawFeather(ctx, x, y, len, width, side, fillColor, strokeColor) {
    var dir = side >= 0 ? 1 : -1;
    ctx.save();
    ctx.translate(x, y);
    ctx.scale(dir, 1);

    ctx.beginPath();
    ctx.moveTo(0, 0);
    ctx.bezierCurveTo(len * .18, -width * .95, len * .78, -width * .72, len, 0);
    ctx.bezierCurveTo(len * .78, width * .72, len * .18, width * .95, 0, 0);
    ctx.closePath();
    ctx.fillStyle = fillColor;
    ctx.fill();
    ctx.strokeStyle = strokeColor;
    ctx.lineWidth = 1.2;
    ctx.stroke();

    ctx.beginPath();
    ctx.moveTo(0, 0);
    ctx.lineTo(len * .92, 0);
    ctx.strokeStyle = "rgba(255,239,216,.62)";
    ctx.lineWidth = 1.2;
    ctx.stroke();

    for (var i = 1; i <= 5; i++) {
      var px = len * (.12 + i * .13);
      ctx.beginPath();
      ctx.moveTo(px, 0);
      ctx.lineTo(px - len * .08, -width * (.16 + i * .10));
      ctx.strokeStyle = "rgba(255,239,216,.38)";
      ctx.lineWidth = 1;
      ctx.stroke();

      ctx.beginPath();
      ctx.moveTo(px, 0);
      ctx.lineTo(px - len * .08, width * (.16 + i * .10));
      ctx.strokeStyle = "rgba(255,239,216,.22)";
      ctx.stroke();
    }
    ctx.restore();
  }

  function drawFeatherCluster(ctx, centerX, y) {
    var left = centerX - 165;
    var right = centerX + 165;

    drawFeather(ctx, left, y, 72, 17, -1, "#b98c42", "rgba(255,224,156,.52)");
    drawFeather(ctx, left - 30, y + 8, 60, 14, -1, "#d3a04d", "rgba(255,224,156,.42)");
    drawFeather(ctx, left - 55, y + 17, 50, 12, -1, "#74bada", "rgba(196,233,250,.34)");

    drawFeather(ctx, right, y, 72, 17, 1, "#b98c42", "rgba(255,224,156,.52)");
    drawFeather(ctx, right + 30, y + 8, 60, 14, 1, "#d3a04d", "rgba(255,224,156,.42)");
    drawFeather(ctx, right + 55, y + 17, 50, 12, 1, "#74bada", "rgba(196,233,250,.34)");
  }

  function drawMiddlePattern(ctx, x, y, w, h) {
    if (h <= 0) return;
    ctx.save();

    var glow = ctx.createRadialGradient(x + w / 2, y + h * .48, 20, x + w / 2, y + h * .48, Math.max(w, h) * .62);
    glow.addColorStop(0, "rgba(104,203,255,.105)");
    glow.addColorStop(.46, "rgba(224,174,85,.055)");
    glow.addColorStop(1, "rgba(0,0,0,0)");
    ctx.fillStyle = glow;
    ctx.fillRect(x, y, w, h);

    ctx.lineWidth = 1;
    for (var i = 0; i < 7; i++) {
      ctx.beginPath();
      ctx.arc(x + w / 2, y + h * .48, 95 + i * 30, -.25, Math.PI * 1.12);
      ctx.strokeStyle = i % 2 ? "rgba(241,193,106,.045)" : "rgba(111,209,255,.045)";
      ctx.stroke();
    }

    ctx.strokeStyle = "rgba(193,221,239,.045)";
    for (var j = 0; j < 8; j++) {
      var yy = y + 30 + j * Math.max(48, h / 9);
      ctx.beginPath();
      ctx.moveTo(x + 30, yy);
      ctx.lineTo(x + w - 30, yy - 28);
      ctx.stroke();
    }

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

  function loadPosterHeader(callback) {
    var img = new Image();
    img.onload = function () { callback(img); };
    img.onerror = function () {
      // Safe fallback to the app banner if the dedicated poster artwork is unavailable.
      loadBanner(callback);
    };
    img.src = "./assets/franky-anime-header-master.webp?v=1";
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
      "width:920px;max-width:calc(100vw - 32px)!important;margin:auto;background:#08131f;border:1px solid #244b6d;" +
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
      a.download = "ABYX_FRANKY_TIME_" + count + "_RALLIES.png";
      document.body.appendChild(a);
      a.click();
      a.remove();
    }

    save.addEventListener("click", saveFile);

    share.addEventListener("click", function () {
      try {
        var file = new File([blob], "ABYX_FRANKY_TIME_" + count + "_RALLIES.png", { type: "image/png" });
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

  function drawNeonCity(ctx, W, H) {
    ctx.save();
    var sky = ctx.createLinearGradient(0, 0, 0, H);
    sky.addColorStop(0, "#071329");
    sky.addColorStop(.52, "#0a1f38");
    sky.addColorStop(1, "#07111d");
    ctx.fillStyle = sky;
    ctx.fillRect(0, 0, W, H);

    var glow = ctx.createRadialGradient(W * .68, H * .24, 20, W * .68, H * .24, W * .62);
    glow.addColorStop(0, "rgba(44,169,255,.22)");
    glow.addColorStop(.52, "rgba(17,75,135,.10)");
    glow.addColorStop(1, "rgba(0,0,0,0)");
    ctx.fillStyle = glow;
    ctx.fillRect(0, 0, W, H);

    var buildings = [
      [18,118,78,250],[86,78,64,290],[143,145,74,220],[210,96,58,275],
      [270,128,80,240],[346,62,62,305],[414,115,80,252],[500,74,72,292],
      [578,126,70,244],[646,88,62,282],[710,138,78,230],[792,70,70,300],[850,120,54,250]
    ];
    for (var i=0;i<buildings.length;i++) {
      var b=buildings[i];
      var bg=ctx.createLinearGradient(b[0],b[1],b[0],b[1]+b[3]);
      bg.addColorStop(0, i%3===0 ? "#102b46" : "#0c2137");
      bg.addColorStop(1, "#07101b");
      ctx.fillStyle=bg;
      ctx.fillRect(b[0],b[1],b[2],b[3]);
      for(var yy=b[1]+18; yy<b[1]+b[3]-12; yy+=24){
        for(var xx=b[0]+10; xx<b[0]+b[2]-8; xx+=18){
          var hot=((xx+yy+i*13)%5===0);
          ctx.fillStyle=hot ? "rgba(255,156,55,.72)" : "rgba(72,203,255,.42)";
          ctx.fillRect(xx,yy,5,9);
        }
      }
    }

    ctx.fillStyle="#08111b";
    ctx.fillRect(W*.66,112,13,210);
    ctx.fillRect(W*.81,112,13,210);
    ctx.fillRect(W*.625,105,W*.225,14);
    ctx.fillRect(W*.645,126,W*.185,9);
    ctx.fillStyle="rgba(255,139,38,.68)";
    ctx.fillRect(W*.625,103,W*.225,3);

    function sign(x,y,w,h,text,color){
      ctx.save();
      ctx.shadowBlur=16; ctx.shadowColor=color;
      ctx.strokeStyle=color; ctx.lineWidth=2;
      ctx.strokeRect(x,y,w,h);
      ctx.fillStyle="rgba(4,12,22,.72)";
      ctx.fillRect(x,y,w,h);
      ctx.fillStyle=color;
      ctx.font="900 14px Arial, Helvetica, sans-serif";
      ctx.textAlign="center";
      ctx.fillText(text,x+w/2,y+h/2+5);
      ctx.restore();
    }
    sign(45,52,84,36,"ABYX","#59d6ff");
    sign(745,44,108,36,"RALLY","#ff9d2e");
    sign(684,176,72,32,"勝利","#59d6ff");

    ctx.strokeStyle="rgba(5,9,15,.86)";
    ctx.lineWidth=4;
    for(var w=0;w<5;w++){
      ctx.beginPath();
      ctx.moveTo(-20,44+w*23);
      ctx.quadraticCurveTo(W*.52,80+w*18,W+30,22+w*28);
      ctx.stroke();
    }
    ctx.restore();
  }

  function drawCrown(ctx, x, y, size, color) {
    ctx.save();
    ctx.translate(x,y);
    ctx.fillStyle=color;
    ctx.beginPath();
    ctx.moveTo(-size*.5,size*.28);
    ctx.lineTo(-size*.38,-size*.26);
    ctx.lineTo(-size*.10,size*.02);
    ctx.lineTo(0,-size*.42);
    ctx.lineTo(size*.14,size*.02);
    ctx.lineTo(size*.42,-size*.28);
    ctx.lineTo(size*.5,size*.28);
    ctx.closePath();
    ctx.fill();
    ctx.fillRect(-size*.48,size*.31,size*.96,size*.12);
    ctx.restore();
  }

  function drawBrushWord(ctx, text, x, y, maxWidth, fill, shadow) {
    ctx.save();
    ctx.translate(x,y);
    ctx.transform(1,-.06,-.10,1,0,0);
    ctx.textAlign="center";
    ctx.textBaseline="alphabetic";
    var family='"Arial Black",Impact,Arial,sans-serif';
    var size=fitText(ctx,text,maxWidth,82,42,"900",family);
    ctx.font="900 "+size+"px "+family;
    ctx.lineJoin="round";
    ctx.strokeStyle=shadow || "rgba(0,0,0,.72)";
    ctx.lineWidth=10;
    ctx.strokeText(text,4,7);
    ctx.strokeStyle="rgba(255,255,255,.13)";
    ctx.lineWidth=2;
    ctx.strokeText(text,0,0);
    ctx.fillStyle=fill;
    ctx.fillText(text,0,0);
    ctx.restore();
  }

  function drawHeroSilhouette(ctx) {
    ctx.save();
    ctx.translate(96,118);

    ctx.fillStyle="#07101a";
    ctx.beginPath();
    ctx.ellipse(118,105,92,102,-.12,0,Math.PI*2);
    ctx.fill();
    ctx.beginPath();
    ctx.moveTo(62,118); ctx.quadraticCurveTo(5,192,28,292);
    ctx.quadraticCurveTo(80,250,103,170); ctx.closePath(); ctx.fill();

    ctx.fillStyle="#e8c1ad";
    ctx.beginPath();
    ctx.ellipse(120,108,55,67,-.10,0,Math.PI*2);
    ctx.fill();

    ctx.fillStyle="#0a1019";
    ctx.beginPath();
    ctx.moveTo(73,74); ctx.quadraticCurveTo(118,24,171,63);
    ctx.lineTo(154,99); ctx.quadraticCurveTo(126,70,96,108);
    ctx.lineTo(79,122); ctx.closePath(); ctx.fill();

    ctx.strokeStyle="#14233a"; ctx.lineWidth=4;
    ctx.beginPath(); ctx.moveTo(91,111); ctx.lineTo(108,108); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(135,107); ctx.lineTo(153,109); ctx.stroke();
    ctx.fillStyle="#56d8ff";
    ctx.beginPath(); ctx.arc(102,110,3.5,0,Math.PI*2); ctx.fill();
    ctx.fillStyle="#ff9c2d";
    ctx.beginPath(); ctx.arc(143,109,3.5,0,Math.PI*2); ctx.fill();

    ctx.fillStyle="#d8ad9c";
    ctx.fillRect(105,165,32,36);
    ctx.fillStyle="#f4f5f6";
    ctx.beginPath();
    ctx.moveTo(75,194); ctx.lineTo(161,194); ctx.lineTo(182,300); ctx.lineTo(56,300); ctx.closePath(); ctx.fill();

    ctx.fillStyle="#0a1420";
    ctx.font="900 24px Arial, Helvetica, sans-serif";
    ctx.textAlign="center";
    ctx.fillText("ABYX",119,252);
    drawCrown(ctx,119,217,26,"#0a1420");

    ctx.strokeStyle="#0a1019"; ctx.lineWidth=28; ctx.lineCap="round";
    ctx.beginPath(); ctx.moveTo(70,205); ctx.lineTo(26,284); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(166,205); ctx.lineTo(205,282); ctx.stroke();
    ctx.strokeStyle="#278fd2"; ctx.lineWidth=4;
    ctx.beginPath(); ctx.moveTo(61,210); ctx.lineTo(25,279); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(175,210); ctx.lineTo(205,278); ctx.stroke();

    ctx.strokeStyle="#ff9d2e"; ctx.lineWidth=6;
    ctx.beginPath(); ctx.arc(91,55,18,0,Math.PI*2); ctx.stroke();
    ctx.beginPath(); ctx.arc(132,51,18,0,Math.PI*2); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(109,53); ctx.lineTo(114,52); ctx.stroke();

    ctx.restore();
  }

  function getRole(index) {
    if(index<3) return {label:"CORE", fill:"#f3bd52", text:"#101820", border:"#ffd97b"};
    if(index<6) return {label:"HOT", fill:"#f36c21", text:"#111820", border:"#ff9b4a"};
    return {label:"BACKUP", fill:"#28b8ee", text:"#07131e", border:"#74dcff"};
  }

  function cleanApcText(value) {
    return String(value || "—")
      .replace(/APC\\s*\\d*\\s*[:·-]?\\s*/ig,"")
      .replace(/\\s+/g," ")
      .trim() || "—";
  }

  function drawRoleBadge(ctx,x,y,w,h,role){
    ctx.save();
    roundedRect(ctx,x,y,w,h,8);
    var g=ctx.createLinearGradient(x,y,x,y+h);
    g.addColorStop(0,role.border);
    g.addColorStop(1,role.fill);
    ctx.fillStyle=g; ctx.fill();
    ctx.strokeStyle="rgba(255,255,255,.28)"; ctx.lineWidth=1; ctx.stroke();
    ctx.fillStyle=role.text;
    ctx.font="900 14px Arial, Helvetica, sans-serif";
    ctx.textAlign="center"; ctx.textBaseline="middle";
    ctx.fillText(role.label,x+w/2,y+h/2+1);
    ctx.restore();
  }

  function drawRankMedal(ctx,x,y,w,h,rank){
    ctx.save();
    roundedRect(ctx,x,y,w,h,7);
    var g=ctx.createLinearGradient(x,y,x+w,y+h);
    if(rank===1){g.addColorStop(0,"#ffe188");g.addColorStop(1,"#c47b0f");}
    else if(rank===2){g.addColorStop(0,"#f1f5f8");g.addColorStop(1,"#75899d");}
    else if(rank===3){g.addColorStop(0,"#e59b65");g.addColorStop(1,"#9a4e29");}
    else {g.addColorStop(0,"#177ab7");g.addColorStop(1,"#0d3e68");}
    ctx.fillStyle=g; ctx.fill();
    ctx.strokeStyle=rank<=3?"rgba(255,224,146,.7)":"rgba(82,211,255,.55)";
    ctx.lineWidth=1.2; ctx.stroke();
    ctx.fillStyle=rank<=3?"#111820":"#c9f1ff";
    ctx.font="900 "+(rank<10?25:20)+"px Arial, Helvetica, sans-serif";
    ctx.textAlign="center"; ctx.textBaseline="middle";
    ctx.fillText(String(rank),x+w/2,y+h/2+1);
    ctx.restore();
  }

  function drawAnimeRow(ctx,x,y,w,h,item,index){
    var rank=index+1;
    var role=getRole(index);
    ctx.save();
    roundedRect(ctx,x,y,w,h,6);
    var row=ctx.createLinearGradient(x,y,x+w,y);
    row.addColorStop(0,index<3?"rgba(18,35,51,.98)":"rgba(8,22,35,.98)");
    row.addColorStop(1,"rgba(5,15,26,.98)");
    ctx.fillStyle=row; ctx.fill();
    ctx.strokeStyle=index<3?"rgba(243,189,82,.28)":"rgba(62,181,235,.20)";
    ctx.lineWidth=1; ctx.stroke();

    drawRankMedal(ctx,x+8,y+7,52,h-14,rank);

    var nameX=x+72;
    var roleW=92, scoreW=88, rallyW=116, apcW=122;
    var roleX=x+w-roleW-10;
    var scoreX=roleX-scoreW-8;
    var rallyX=scoreX-rallyW-8;
    var apcX=rallyX-apcW-8;
    var nameW=apcX-nameX-12;

    ctx.textAlign="left"; ctx.textBaseline="alphabetic";
    ctx.fillStyle="#f5f8fb";
    fitText(ctx,item.name,nameW,h>=56?20:17,11,"900","Arial, Helvetica, sans-serif");
    ctx.fillText(item.name,nameX,y+h*.46);

    ctx.fillStyle="#77d7ff";
    ctx.font="800 "+(h>=56?12:10)+"px Arial, Helvetica, sans-serif";
    ctx.fillText("RALLY LAUNCHER",nameX,y+h*.74);

    function cell(cx,cw,label,value,color){
      ctx.fillStyle="rgba(255,255,255,.035)";
      roundedRect(ctx,cx,y+7,cw,h-14,6); ctx.fill();
      ctx.fillStyle="#7f9bb3";
      ctx.font="800 9px Arial, Helvetica, sans-serif";
      ctx.textAlign="center";
      ctx.fillText(label,cx+cw/2,y+18);
      ctx.fillStyle=color||"#edf7ff";
      ctx.font="900 "+(h>=56?15:13)+"px Arial, Helvetica, sans-serif";
      fitText(ctx,String(value||"—"),cw-8,h>=56?15:13,10,"900","Arial, Helvetica, sans-serif");
      ctx.fillText(String(value||"—"),cx+cw/2,y+h-13);
    }

    cell(apcX,apcW,"APC",cleanApcText(item.apcs.join(" / ")),"#edf7ff");
    cell(rallyX,rallyW,"RALLY SIZE",item.rallySize||"—","#edf7ff");
    cell(scoreX,scoreW,"FRANKY",item.frankyScore||"—",index<3?"#f4c35d":"#63d9ff");
    drawRoleBadge(ctx,roleX,y+10,roleW,h-20,role);
    ctx.restore();
  }

  function drawStrategyZone(ctx,W,y,rallyCount){
    var h=220;
    ctx.save();
    var bg=ctx.createLinearGradient(0,y,0,y+h);
    bg.addColorStop(0,"#0a1725");
    bg.addColorStop(1,"#07101a");
    ctx.fillStyle=bg; ctx.fillRect(0,y,W,h);

    ctx.strokeStyle="rgba(71,196,255,.10)";
    ctx.lineWidth=1;
    for(var gx=0;gx<W;gx+=45){ctx.beginPath();ctx.moveTo(gx,y);ctx.lineTo(gx,y+h);ctx.stroke();}
    for(var gy=y;gy<y+h;gy+=38){ctx.beginPath();ctx.moveTo(0,gy);ctx.lineTo(W,gy);ctx.stroke();}

    ctx.textAlign="left";
    ctx.fillStyle="#ff9d2e";
    ctx.font="900 98px Impact, Arial Black, sans-serif";
    ctx.fillText(String(rallyCount),48,y+124);
    ctx.fillStyle="#f5f7f8";
    ctx.font="900 30px Arial Black, Arial, sans-serif";
    ctx.fillText("RALLIES",184,y+79);
    ctx.fillText("TO BE SENT",184,y+115);

    var cx=575, cy=y+108;
    ctx.strokeStyle="#52d5ff"; ctx.lineWidth=3;
    ctx.beginPath();ctx.arc(cx,cy,50,0,Math.PI*2);ctx.stroke();
    ctx.beginPath();ctx.arc(cx,cy,33,0,Math.PI*2);ctx.stroke();
    ctx.beginPath();ctx.moveTo(cx-68,cy);ctx.lineTo(cx+68,cy);ctx.stroke();
    ctx.beginPath();ctx.moveTo(cx,cy-68);ctx.lineTo(cx,cy+68);ctx.stroke();
    drawCrown(ctx,cx,cy-4,38,"#ff9d2e");

    ctx.strokeStyle="#ff9d2e";ctx.lineWidth=5;ctx.lineCap="round";
    ctx.beginPath();ctx.moveTo(720,y+145);ctx.quadraticCurveTo(676,y+152,636,y+130);ctx.stroke();
    ctx.beginPath();ctx.moveTo(637,y+130);ctx.lineTo(655,y+128);ctx.lineTo(646,y+145);ctx.stroke();

    ctx.textAlign="right";
    ctx.fillStyle="#f5f7f8";
    ctx.font="900 17px Arial, Helvetica, sans-serif";
    ctx.fillText("ALL THE OTHERS",W-42,y+65);
    ctx.fillText("JOIN THE OPEN RALLIES",W-42,y+88);
    ctx.restore();
  }

  function drawPosterFooter(ctx,W,y){
    var h=72;
    ctx.save();
    ctx.fillStyle="#050b12";ctx.fillRect(0,y,W,h);
    ctx.strokeStyle="rgba(78,200,255,.22)";ctx.beginPath();ctx.moveTo(0,y);ctx.lineTo(W,y);ctx.stroke();
    var items=[
      {x:115,icon:"⚔",text:"RALLY SMARTER"},
      {x:350,icon:"◎",text:"HIT HARDER"},
      {x:585,icon:"●",text:"GROW TOGETHER"},
      {x:815,icon:"♛",text:"ABYX"}
    ];
    ctx.textBaseline="middle";
    items.forEach(function(it){
      ctx.fillStyle=it.x>760?"#ffb13d":"#eaf7ff";
      ctx.font="900 26px Arial, Helvetica, sans-serif";
      ctx.textAlign="center";ctx.fillText(it.icon,it.x-58,y+36);
      ctx.fillStyle="#eaf7ff";ctx.font="800 13px Arial, Helvetica, sans-serif";
      ctx.fillText(it.text,it.x+20,y+36);
    });
    ctx.restore();
  }

  function generate() {
    var groups=getLaunchers();
    var rallyCount=getRallyCount();
    if(!groups.length || !rallyCount){
      window.alert("Build a rally plan first.");
      return;
    }

    var button=document.getElementById("generateImageBtn");
    var originalText=button?button.textContent:"GENERATE IMAGE";
    if(button){button.disabled=true;button.textContent="GENERATING…";}

    loadPosterHeader(function(headerImg){
      var maxRows=Math.min(groups.length,18);
      var shown=groups.slice(0,maxRows);
      var rowH=maxRows<=7?62:maxRows<=11?58:maxRows<=15?54:50;
      var gap=5;
      var panelHeaderH=58;
      var panelPad=14;
      var panelY=585;
      var panelH=panelHeaderH + panelPad + maxRows*rowH + Math.max(0,maxRows-1)*gap + panelPad;
      var strategyY=panelY+panelH+20;
      var footerY=strategyY+220;
      var H=footerY+72;
      var W=900;

      var canvas=document.createElement("canvas");
      canvas.width=W;canvas.height=H;
      var ctx=canvas.getContext("2d");
      if(!ctx){
        if(button){button.disabled=false;button.textContent=originalText;}
        return;
      }
      ctx.imageSmoothingEnabled=true;
      ctx.imageSmoothingQuality="high";

      // VALIDATED ARTWORK: use the actual ABYX / FRANKY TIME anime header.
      // Do not redraw the girl, dog, logo or title in canvas.
      ctx.fillStyle="#07111d";
      ctx.fillRect(0,0,W,H);

      if(headerImg){
        // Native 900×574 artwork: 1:1 draw, no enlargement, no crop = maximum sharpness.
        ctx.drawImage(headerImg,0,0,900,585);
      }else{
        // Last-resort fallback only.
        drawNeonCity(ctx,W,585);
      }

      // Very light transition only at the bottom edge; do not soften the artwork.
      var heroFade=ctx.createLinearGradient(0,547,0,585);
      heroFade.addColorStop(0,"rgba(4,12,22,0)");
      heroFade.addColorStop(1,"rgba(4,12,22,.22)");
      ctx.fillStyle=heroFade;
      ctx.fillRect(0,547,W,38);

      // Fine neon separator between artwork and live data.
      var heroLine=ctx.createLinearGradient(40,0,W-40,0);
      heroLine.addColorStop(0,"rgba(72,211,255,0)");
      heroLine.addColorStop(.22,"rgba(72,211,255,.82)");
      heroLine.addColorStop(.72,"rgba(255,157,46,.82)");
      heroLine.addColorStop(1,"rgba(255,157,46,0)");
      ctx.fillStyle=heroLine;
      ctx.fillRect(40,583,W-80,2);

      var panelX=34,panelW=W-68;
      roundedRect(ctx,panelX,panelY,panelW,panelH,14);
      var pg=ctx.createLinearGradient(panelX,panelY,panelX,panelY+panelH);
      pg.addColorStop(0,"rgba(7,21,34,.985)");
      pg.addColorStop(1,"rgba(4,13,23,.995)");
      ctx.fillStyle=pg;ctx.fill();
      ctx.strokeStyle="rgba(73,205,255,.72)";ctx.lineWidth=2;ctx.stroke();

      ctx.fillStyle="rgba(15,42,63,.98)";
      roundedRect(ctx,panelX+2,panelY+2,panelW-4,panelHeaderH-4,12);ctx.fill();
      ctx.strokeStyle="rgba(255,157,46,.38)";
      ctx.beginPath();ctx.moveTo(panelX+12,panelY+panelHeaderH);ctx.lineTo(panelX+panelW-12,panelY+panelHeaderH);ctx.stroke();

      ctx.fillStyle="#58d7ff";ctx.font="900 24px Arial Black, Arial, sans-serif";ctx.textAlign="left";
      ctx.fillText("#",panelX+22,panelY+38);
      ctx.fillStyle="#f5f8fb";ctx.font="900 18px Arial, Helvetica, sans-serif";
      ctx.fillText("PLAYER",panelX+96,panelY+37);
      ctx.textAlign="right";ctx.fillStyle="#ffbd58";ctx.font="800 13px Arial, Helvetica, sans-serif";
      ctx.fillText("APC  ·  RALLY SIZE  ·  FRANKY SCORE  ·  ROLE",panelX+panelW-18,panelY+36);

      var listTop=panelY+panelHeaderH+panelPad;
      shown.forEach(function(item,index){
        drawAnimeRow(ctx,panelX+12,listTop+index*(rowH+gap),panelW-24,rowH,item,index);
      });

      drawStrategyZone(ctx,W,strategyY,rallyCount);
      drawPosterFooter(ctx,W,footerY);

      ctx.fillStyle="rgba(127,166,191,.55)";
      ctx.font="800 9px Arial, Helvetica, sans-serif";
      ctx.textAlign="right";
      ctx.fillText("POSTER V1.16.4",W-10,H-7);

      canvas.toBlob(function(blob){
        if(button){button.disabled=false;button.textContent=originalText;}
        if(!blob)return;
        showPreview(blob,rallyCount,groups.length);
      },"image/png");
    });
  }

  var button = document.getElementById("generateImageBtn");
  if (button) button.addEventListener("click", generate);
})();
