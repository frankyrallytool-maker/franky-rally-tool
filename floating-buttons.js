(function () {
  "use strict";

  function injectStyles() {
    if (document.getElementById("frankyFabStyles")) return;

    var style = document.createElement("style");
    style.id = "frankyFabStyles";
    style.textContent =
      ".franky-fab-stack{" +
        "position:fixed;" +
        "right:12px;" +
        "bottom:calc(16px + env(safe-area-inset-bottom));" +
        "z-index:22000;" +
        "display:flex;" +
        "flex-direction:column;" +
        "gap:10px;" +
        "pointer-events:none;" +
      "}" +

      ".franky-fab{" +
        "display:none;" +
        "align-items:center;" +
        "justify-content:center;" +
        "min-width:56px;" +
        "height:56px;" +
        "padding:0 14px;" +
        "border-radius:999px;" +
        "border:1px solid #28455f;" +
        "background:linear-gradient(180deg,#1aa8ff,#0a6fd5);" +
        "box-shadow:0 12px 26px rgba(0,0,0,.35);" +
        "color:#fff;" +
        "font-weight:950;" +
        "font-size:12px;" +
        "letter-spacing:.04em;" +
        "pointer-events:auto;" +
        "-webkit-tap-highlight-color:transparent;" +
      "}" +

      ".franky-fab.visible{" +
        "display:flex;" +
      "}" +

      ".franky-fab.fab-image{" +
        "background:linear-gradient(180deg,#26384c,#162333);" +
        "border-color:#2f4e6a;" +
      "}" +

      ".franky-fab .fab-icon{" +
        "font-size:16px;" +
        "line-height:1;" +
        "margin-right:6px;" +
      "}" +

      ".franky-fab .fab-label{" +
        "line-height:1;" +
        "white-space:nowrap;" +
      "}" +

      "@media(min-width:900px){" +
        ".franky-fab-stack{" +
          "right:18px;" +
          "bottom:18px;" +
        "}" +
      "}";

    document.head.appendChild(style);
  }

  function findBuildButton() {
    return document.getElementById("calculateBtn");
  }

  function findImageButton() {
    return document.getElementById("generateImageBtn");
  }

  function isScreenActive(id) {
    var el = document.getElementById(id);
    return !!(el && el.classList.contains("active"));
  }

  function isElementVisible(el) {
    if (!el || !document.body.contains(el)) return false;

    var style = window.getComputedStyle(el);
    if (
      style.display === "none" ||
      style.visibility === "hidden" ||
      parseFloat(style.opacity || "1") === 0
    ) return false;

    var rect = el.getBoundingClientRect();
    var vh = window.innerHeight || document.documentElement.clientHeight;
    var vw = window.innerWidth || document.documentElement.clientWidth;

    return (
      rect.width > 0 &&
      rect.height > 0 &&
      rect.bottom > 0 &&
      rect.top < vh &&
      rect.right > 0 &&
      rect.left < vw
    );
  }

  function ensureFabStack() {
    if (document.getElementById("frankyFabStack")) return;

    var wrap = document.createElement("div");
    wrap.id = "frankyFabStack";
    wrap.className = "franky-fab-stack";

    wrap.innerHTML =
      '<button type="button" id="fabBuildPlan" class="franky-fab fab-build" aria-label="Build Rally Plan">' +
        '<span class="fab-icon">✓</span>' +
        '<span class="fab-label">PLAN</span>' +
      '</button>' +
      '<button type="button" id="fabGenerateImage" class="franky-fab fab-image" aria-label="Generate Image">' +
        '<span class="fab-icon">▣</span>' +
        '<span class="fab-label">IMAGE</span>' +
      '</button>';

    document.body.appendChild(wrap);

    var buildFab = document.getElementById("fabBuildPlan");
    var imageFab = document.getElementById("fabGenerateImage");

    buildFab.addEventListener("click", function () {
      var btn = findBuildButton();
      if (btn) btn.click();
    });

    imageFab.addEventListener("click", function () {
      var btn = findImageButton();
      if (btn) btn.click();
    });
  }

  function updateFabVisibility() {
    ensureFabStack();

    var buildFab = document.getElementById("fabBuildPlan");
    var imageFab = document.getElementById("fabGenerateImage");

    var buildBtn = findBuildButton();
    var imageBtn = findImageButton();

    var previewOpen = !!document.getElementById("frankyPosterPreview");

    var showBuild =
      !previewOpen &&
      isScreenActive("attendance") &&
      !!buildBtn &&
      !isElementVisible(buildBtn);

    var showImage =
      !previewOpen &&
      isScreenActive("results") &&
      !!imageBtn &&
      !isElementVisible(imageBtn);

    if (buildFab) buildFab.classList.toggle("visible", showBuild);
    if (imageFab) imageFab.classList.toggle("visible", showImage);
  }

  function initFloatingButtons() {
    injectStyles();
    ensureFabStack();
    updateFabVisibility();

    var main = document.querySelector(".desktop-main");
    if (main) {
      main.addEventListener("scroll", updateFabVisibility, { passive: true });
    }

    window.addEventListener("scroll", updateFabVisibility, { passive: true });
    window.addEventListener("resize", updateFabVisibility);

    document.addEventListener("click", function () {
      setTimeout(updateFabVisibility, 50);
    }, true);

    document.addEventListener("touchend", function () {
      setTimeout(updateFabVisibility, 50);
    }, { passive: true, capture: true });

    var observer = new MutationObserver(function () {
      updateFabVisibility();
    });

    observer.observe(document.body, {
      subtree: true,
      childList: true,
      attributes: true,
      attributeFilter: ["class", "style"]
    });

    setInterval(updateFabVisibility, 400);
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", initFloatingButtons);
  } else {
    initFloatingButtons();
  }
})();