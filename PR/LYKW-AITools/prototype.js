/**
 * 麟云开物 AI 助手原型 - 屏切换与简单交互
 */
(function () {
  const screens = document.querySelectorAll(".screen");
  const links = document.querySelectorAll(".sitemap a.nav-link");

  function showScreen(id) {
    screens.forEach((s) => s.classList.toggle("active", s.id === id));
    links.forEach((a) => {
      const href = a.getAttribute("href");
      const target = href && href.startsWith("#") ? href.slice(1) : "";
      a.classList.toggle("active", target === id);
    });
    const titleEl = document.getElementById("preview-screen-title");
    const badgeEl = document.getElementById("preview-badge");
    const label = document.querySelector(`a.nav-link[href="#${id}"]`);
    if (titleEl && label) {
      titleEl.textContent = label.textContent.replace(/^\d+\.\s*/, "");
      const sec = label.closest(".sitemap-section");
      if (badgeEl && sec) {
        badgeEl.textContent = sec.classList.contains("user") ? "用户端" : "商家端";
        badgeEl.className =
          "role-badge " + (sec.classList.contains("user") ? "user" : "merchant");
      }
    }
  }

  function navigateTo(id) {
    showScreen(id);
    try {
      history.replaceState(null, "", "#" + id);
    } catch (e) {}
    syncMerchantPromoteModal(id);
  }

  window.goScreen = navigateTo;

  function setMerchantPromoteModalVisible(visible) {
    var el = document.getElementById("merchant-promote-alert");
    if (!el) return;
    el.style.display = visible ? "flex" : "none";
    el.setAttribute("aria-hidden", visible ? "false" : "true");
  }

  function syncMerchantPromoteModal(activeScreenId) {
    var el = document.getElementById("merchant-promote-alert");
    if (!el) return;
    if (activeScreenId !== "b-ai-home") {
      setMerchantPromoteModalVisible(false);
      return;
    }
    var pending = false;
    try {
      pending = sessionStorage.getItem("kykw_promote_pending") === "1";
    } catch (e) {}
    setMerchantPromoteModalVisible(pending);
  }

  /** 用户端提交推广审核后调用：商家进入 AI 助手首页将弹出提醒（演示用 sessionStorage） */
  window.markUserPromotionSubmitted = function () {
    try {
      sessionStorage.setItem("kykw_promote_pending", "1");
    } catch (e) {}
  };

  var btnPromoteView = document.getElementById("merchant-promote-view");
  var btnPromoteLater = document.getElementById("merchant-promote-later");
  if (btnPromoteView) {
    btnPromoteView.addEventListener("click", function () {
      try {
        sessionStorage.removeItem("kykw_promote_pending");
      } catch (e) {}
      setMerchantPromoteModalVisible(false);
      navigateTo("b-todo");
    });
  }
  if (btnPromoteLater) {
    btnPromoteLater.addEventListener("click", function () {
      setMerchantPromoteModalVisible(false);
    });
  }

  links.forEach((a) => {
    a.addEventListener("click", (e) => {
      e.preventDefault();
      navigateTo(a.getAttribute("href").slice(1));
    });
  });

  const hash = location.hash.slice(1);
  if (hash && document.getElementById(hash)) {
    navigateTo(hash);
  } else {
    navigateTo("c-pay-success");
  }

  // 用户端：视频生成演示
  const btnGenVideo = document.getElementById("c-btn-generate-video");
  const cVideoIdle = document.getElementById("c-video-idle");
  const cVideoProgress = document.getElementById("c-video-progress");
  const cVideoResult = document.getElementById("c-video-result");
  if (btnGenVideo && cVideoProgress && cVideoResult) {
    btnGenVideo.addEventListener("click", () => {
      if (cVideoIdle) cVideoIdle.style.display = "none";
      cVideoProgress.style.display = "block";
      cVideoResult.style.display = "none";
      setTimeout(() => {
        cVideoProgress.style.display = "none";
        cVideoResult.style.display = "block";
      }, 1800);
    });
  }

  const btnGenPoster = document.getElementById("c-btn-generate-poster");
  const cPosterPlaceholder = document.getElementById("c-poster-placeholder");
  const cPosterResult = document.getElementById("c-poster-result");
  if (btnGenPoster && cPosterPlaceholder && cPosterResult) {
    btnGenPoster.addEventListener("click", () => {
      cPosterPlaceholder.style.display = "none";
      cPosterResult.style.display = "block";
    });
  }

  // 商家端：视频生成演示
  const mBtnGen = document.getElementById("m-btn-start-gen");
  const mGenWait = document.getElementById("m-gen-wait");
  const mGenResult = document.getElementById("m-gen-result");
  if (mBtnGen && mGenWait && mGenResult) {
    mBtnGen.addEventListener("click", () => {
      mGenWait.style.display = "flex";
      mGenResult.style.display = "none";
      setTimeout(() => {
        mGenWait.style.display = "none";
        mGenResult.style.display = "block";
      }, 2000);
    });
  }
})();
