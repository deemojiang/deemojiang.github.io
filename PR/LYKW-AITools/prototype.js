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
    const isPlatform = typeof id === "string" && id.indexOf("p-") === 0;
    const mobileWrap = document.getElementById("preview-mobile-wrap");
    const platformWrap = document.getElementById("preview-platform-wrap");
    if (mobileWrap) mobileWrap.hidden = !!isPlatform;
    if (platformWrap) platformWrap.hidden = !isPlatform;
    const previewMain = document.querySelector("main.preview");
    if (previewMain) previewMain.classList.toggle("preview--platform", !!isPlatform);

    const titleEl = document.getElementById("preview-screen-title");
    const badgeEl = document.getElementById("preview-badge");
    const label = document.querySelector(`a.nav-link[href="#${id}"]`);
    if (titleEl && label) {
      titleEl.textContent = label.textContent.replace(/^\d+\.\s*/, "");
      const sec = label.closest(".sitemap-section");
      if (badgeEl && sec) {
        let badgeText = "商家端";
        let badgeCls = "merchant";
        if (sec.classList.contains("user")) {
          badgeText = "用户端";
          badgeCls = "user";
        } else if (sec.classList.contains("platform")) {
          badgeText = "平台端";
          badgeCls = "platform";
        }
        badgeEl.textContent = badgeText;
        badgeEl.className = "role-badge " + badgeCls;
      }
    }
  }

  function navigateTo(id) {
    showScreen(id);
    try {
      history.replaceState(null, "", "#" + id);
    } catch (e) {}
    syncMerchantPromoteModal(id);
    if (id === "c-checkin" && typeof window.kykwCheckinReset === "function") {
      try {
        if (sessionStorage.getItem("kykw_skip_checkin_reset_once") === "1") {
          sessionStorage.removeItem("kykw_skip_checkin_reset_once");
        } else {
          window.kykwCheckinReset();
        }
      } catch (e) {
        window.kykwCheckinReset();
      }
    }
    if (id === "c-video") {
      try {
        if (sessionStorage.getItem("kykw_c_video_restore_result") === "1") {
          sessionStorage.removeItem("kykw_c_video_restore_result");
          var vIdle = document.getElementById("c-video-idle");
          var vProg = document.getElementById("c-video-progress");
          var vRes = document.getElementById("c-video-result");
          if (vIdle) vIdle.style.display = "none";
          if (vProg) vProg.style.display = "none";
          if (vRes) vRes.style.display = "block";
        }
      } catch (e2) {}
    }
    if (id === "c-forward-proof" && typeof window.kykwForwardProofOnShow === "function") {
      window.kykwForwardProofOnShow();
    }
    if (id === "b-share-library" && typeof window.kykwShareLibraryOnEnter === "function") {
      window.kykwShareLibraryOnEnter();
    }
    if (id === "b-todo" && typeof window.kykwRenderMerchantTodo === "function") {
      window.kykwRenderMerchantTodo();
    }
    if (id === "b-todo-detail" && typeof window.kykwRenderShareDetailPage === "function") {
      window.kykwRenderShareDetailPage();
    }
    if (id === "b-rag-cs" && typeof window.kykwRagOnScreenShow === "function") {
      window.kykwRagOnScreenShow();
    }
    if (id === "c-promote" && typeof window.kykwPromoteEntryApply === "function") {
      window.kykwPromoteEntryApply();
    }
    if (id === "b-promote-entry-config" && typeof window.kykwPromoteEntryRenderForm === "function") {
      window.kykwPromoteEntryRenderForm();
    }
    if (id === "b-share-copy-hub" && typeof window.kykwCopyHubResetLanding === "function") {
      window.kykwCopyHubResetLanding();
    }
    if (id === "b-poster-gen" && typeof window.kykwPosterHubResetLanding === "function") {
      window.kykwPosterHubResetLanding();
    }
    if (id === "b-share-copy-work" && typeof window.kykwCopyWorkOnEnter === "function") {
      window.kykwCopyWorkOnEnter();
    }
    if (id === "b-poster-work" && typeof window.kykwPosterWorkOnEnter === "function") {
      window.kykwPosterWorkOnEnter();
    }
    if (
      (id === "b-materials-video" ||
        id === "b-materials-image" ||
        id === "b-materials-topic" ||
        id === "b-materials-text") &&
      typeof window.kykwMlibRenderScreen === "function"
    ) {
      window.kykwMlibRenderScreen(id);
    }
    if (window.kykwMlibAfterReturn && id === window.kykwMlibPickReturnTo) {
      window.kykwMlibAfterReturn = false;
      window.kykwMlibPickMode = false;
      if (window.kykwMlibPickSource === "video") {
        if (typeof window.mVgAfterReturnFromMlib === "function") window.mVgAfterReturnFromMlib();
      } else if (window.kykwMlibPickSource === "copy") {
        if (typeof window.kykwCopyAfterReturnFromMlib === "function") window.kykwCopyAfterReturnFromMlib();
      } else if (window.kykwMlibPickSource === "poster") {
        if (typeof window.kykwPosterAfterReturnFromMlib === "function") window.kykwPosterAfterReturnFromMlib();
      }
    }
    if (id === "b-video-gen" && !window.kykwMlibAfterReturn) {
      if (typeof window.mVgShowLanding === "function") {
        window.mVgShowLanding();
      }
    }

    document.querySelectorAll(".b-mlib-pick-banner").forEach(function (b) {
      var screen = b.closest(".screen");
      var show = !!(window.kykwMlibPickMode && screen && screen.classList.contains("active"));
      b.hidden = !show;
    });
    document.querySelectorAll(".b-mlib-pick-footer").forEach(function (f) {
      var screen = f.closest(".screen");
      var show = !!(window.kykwMlibPickMode && screen && screen.classList.contains("active"));
      f.hidden = !show;
    });
  }

  window.goScreen = navigateTo;

  window.kykwShareLibraryPendingTab = null;
  window.kykwShareLibraryGo = function (tab) {
    if (tab === "video" || tab === "copy" || tab === "poster") {
      window.kykwShareLibraryPendingTab = tab;
    } else {
      window.kykwShareLibraryPendingTab = null;
    }
    window.goScreen("b-share-library");
  };

  window.mVgPickedMlibItems = window.mVgPickedMlibItems || [];
  window.kykwCopyPickedMlibItems = window.kykwCopyPickedMlibItems || [];
  window.kykwPosterPickedMlibItems = window.kykwPosterPickedMlibItems || [];
  window.kykwMlibPickMode = false;
  window.kykwMlibAfterReturn = false;
  window.kykwMlibPickReturnTo = "b-video-gen";
  window.kykwMlibPickSource = "video";

  function clonePickItems(arr) {
    return (arr || []).map(function (x) {
      return { type: x.type, id: x.id, label: x.label || "" };
    });
  }

  function getToolPickStore(source) {
    if (source === "copy") return "kykwCopyPickedMlibItems";
    if (source === "poster") return "kykwPosterPickedMlibItems";
    return "mVgPickedMlibItems";
  }

  function syncGlobalPickFromSource(source) {
    var key = getToolPickStore(source);
    window.mVgPickedMlibItems = clonePickItems(window[key] || []);
  }

  function syncSourcePickFromGlobal(source) {
    var key = getToolPickStore(source);
    var raw = clonePickItems(window.mVgPickedMlibItems || []);
    if (source === "copy" || source === "poster") {
      raw = raw.filter(function (x) {
        return x.type === "image" || x.type === "text";
      });
    }
    window[key] = raw;
  }

  function enterMlibPick(source, returnToId, screenId) {
    window.kykwMlibPickSource = source || "video";
    window.kykwMlibPickReturnTo = returnToId || "b-video-gen";
    syncGlobalPickFromSource(window.kykwMlibPickSource);
    window.kykwMlibPickMode = true;
    window.goScreen(screenId || "b-materials");
    if (typeof window.kykwMlibRestorePanel === "function") {
      window.kykwMlibRestorePanel(screenId || "b-materials");
    }
  }

  function finishMlibPickAndReturn() {
    syncSourcePickFromGlobal(window.kykwMlibPickSource);
    window.kykwMlibAfterReturn = true;
    window.goScreen(window.kykwMlibPickReturnTo || "b-video-gen");
  }

  window.kykwEnterMlibPickFromVideoGen = function (screenId) {
    enterMlibPick("video", "b-video-gen", screenId);
  };
  window.kykwEnterMlibPickFromCopy = function (screenId) {
    enterMlibPick("copy", "b-share-copy-work", screenId);
  };
  window.kykwEnterMlibPickFromPoster = function (screenId) {
    enterMlibPick("poster", "b-poster-work", screenId);
  };

  window.kykwMlibGoSub = function (subId) {
    window.goScreen(subId);
    if (window.kykwMlibPickMode && typeof window.kykwMlibRestorePanel === "function") {
      window.kykwMlibRestorePanel(subId);
    }
  };

  window.kykwMlibHubBack = function () {
    if (window.kykwMlibPickMode) {
      finishMlibPickAndReturn();
    } else {
      window.goScreen("b-ai-home");
    }
  };

  window.kykwMlibSubBack = function () {
    var active = document.querySelector(".screen.active");
    var aid = active ? active.id : "";
    if (window.kykwMlibPickMode && typeof window.kykwMlibSnapshotPanel === "function") {
      window.kykwMlibSnapshotPanel(aid);
    }
    window.goScreen("b-materials");
  };

  window.kykwMlibConfirmPickAndReturn = function () {
    if (!window.kykwMlibPickMode) return;
    var active = document.querySelector(".screen.active");
    var aid = active ? active.id : "";
    if (typeof window.kykwMlibSnapshotPanel === "function") {
      window.kykwMlibSnapshotPanel(aid);
    }
    finishMlibPickAndReturn();
  };

  window.kykwMlibSnapshotPanel = function (aid) {
    if (!window.kykwMlibPickMode || !aid) return;
    var panel = document.getElementById(aid);
    if (!panel) return;
    var items = window.mVgPickedMlibItems;
    panel.querySelectorAll(".b-mlib-pickable").forEach(function (el) {
      var id = el.getAttribute("data-mlib-id");
      var ty = el.getAttribute("data-mlib-type");
      var label = el.getAttribute("data-mlib-label") || "";
      if (!id || !ty) return;
      var idx = items.findIndex(function (x) {
        return x.type === ty && x.id === id;
      });
      var sel = el.classList.contains("b-mlib-pickable--selected");
      if (sel && idx < 0) items.push({ type: ty, id: id, label: label });
      if (!sel && idx >= 0) items.splice(idx, 1);
    });
  };

  window.kykwMlibRestorePanel = function (aid) {
    if (!window.kykwMlibPickMode || !aid) return;
    var panel = document.getElementById(aid);
    if (!panel) return;
    var items = window.mVgPickedMlibItems;
    panel.querySelectorAll(".b-mlib-pickable").forEach(function (el) {
      var id = el.getAttribute("data-mlib-id");
      var ty = el.getAttribute("data-mlib-type");
      if (!id || !ty) return;
      var on = items.some(function (x) {
        return x.type === ty && x.id === id;
      });
      el.classList.toggle("b-mlib-pickable--selected", on);
    });
  };

  /** 素材库 · 四类素材增删改查（localStorage 演示） */
  (function kykwMlibCrudInit() {
    var KEY = "kykw_mlib_store_v1";

    function defaults() {
      return {
        video: [
          { id: "v-g1-01", label: "视频素材 01:29", dur: "01:29" },
          { id: "v-g1-02", label: "门店环境空镜 00:42", dur: "00:42" },
        ],
        image: [
          { id: "i-g1-01", label: "菜品特写图 A" },
          { id: "i-g1-02", label: "门头环境图 B" },
        ],
        topic: [
          {
            id: "topic-pack",
            label: "行业推荐话题包",
            lineText: "\u2728 \u884c\u4e1a\u63a8\u8350\u8bdd\u9898 \ud83d\udcac",
            emph: true,
            demo: "\u6f14\u793a\uff1a\u884c\u4e1a\u63a8\u8350\u8bdd\u9898\u5305",
          },
          {
            id: "topic-01",
            label: "# \u62db\u724c\u83dc\u6253\u5361 \xb7 \u6e56\u5dde\u672c\u5473",
            demo: "\u6f14\u793a\uff1a\u7f16\u8f91\u8bdd\u9898",
          },
          {
            id: "topic-02",
            label: "# \u63a2\u5e97\u65e5\u8bb0 \xb7 \u5bb6\u4eba\u5c0f\u805a\u9996\u9009",
            demo: "\u6f14\u793a\uff1a\u7f16\u8f91\u8bdd\u9898",
          },
        ],
        text: [
          {
            id: "text-01",
            label:
              "\u6e56\u6ee8\u5c0f\u9986\uff5c\u8fd9\u4e00\u53e3\u9189\u867e\uff0c\u9c9c\u5230\u7709\u6bdb\u6389\u4e0b\u6765\uff5e\u9002\u5408\u5e26\u7238\u5988\u6765\uff0c\u505c\u8f66\u65b9\u4fbf\u3002",
            demo: "\u6f14\u793a\uff1a\u7f16\u8f91\u957f\u6587\u6848",
          },
          {
            id: "text-02",
            label: "\u4eca\u65e5\u63a8\u8350\uff1a\u5bb6\u70e7\u9c7c + \u65f6\u852c\uff0c\u53cc\u4eba\u5957\u9910\u521a\u4e0a\u3002",
            demo: "\u6f14\u793a\uff1a\u7f16\u8f91\u77ed\u6587\u6848",
          },
        ],
      };
    }

    function read() {
      try {
        var raw = localStorage.getItem(KEY);
        var b = defaults();
        if (!raw) return b;
        var o = JSON.parse(raw);
        if (!Array.isArray(o.video)) o.video = b.video;
        if (!Array.isArray(o.image)) o.image = b.image;
        if (!Array.isArray(o.topic)) o.topic = b.topic;
        if (!Array.isArray(o.text)) o.text = b.text;
        return o;
      } catch (e) {
        return defaults();
      }
    }

    function write(data) {
      try {
        localStorage.setItem(KEY, JSON.stringify(data));
      } catch (e2) {}
    }

    function genId(p) {
      return p + "-" + Date.now().toString(36) + "-" + Math.floor(Math.random() * 900 + 100);
    }

    function removeFromPicks(ty, id) {
      window.mVgPickedMlibItems = (window.mVgPickedMlibItems || []).filter(function (x) {
        return !(x.type === ty && x.id === id);
      });
      if (typeof window.mVgRenderPickedMlib === "function") window.mVgRenderPickedMlib();
    }

    function miniTools(ty, id, onEdit, onDel) {
      var wrap = document.createElement("div");
      wrap.className = "b-mlib-crud-tools";
      var e = document.createElement("button");
      e.type = "button";
      e.className = "b-mlib-crud-mini";
      e.textContent = "\u6539";
      e.title = "\u7f16\u8f91";
      e.addEventListener("click", function (ev) {
        ev.preventDefault();
        ev.stopPropagation();
        onEdit();
      });
      var d = document.createElement("button");
      d.type = "button";
      d.className = "b-mlib-crud-mini b-mlib-crud-mini--danger";
      d.textContent = "\u5220";
      d.title = "\u5220\u9664";
      d.addEventListener("click", function (ev) {
        ev.preventDefault();
        ev.stopPropagation();
        onDel();
      });
      wrap.appendChild(e);
      wrap.appendChild(d);
      return wrap;
    }

    function renderVideo() {
      var mount = document.querySelector("#b-materials-video .b-mlib-media-grid");
      if (!mount) return;
      var data = read();
      mount.innerHTML = "";
      data.video.forEach(function (item) {
        var cell = document.createElement("div");
        cell.className = "b-mlib-thumb-wrap";
        var bt = document.createElement("button");
        bt.type = "button";
        bt.className = "b-mlib-thumb b-mlib-pickable";
        bt.setAttribute("data-mlib-type", "video");
        bt.setAttribute("data-mlib-id", item.id);
        bt.setAttribute("data-mlib-label", item.label);
        bt.setAttribute("aria-pressed", "false");
        bt.setAttribute("data-mlib-demo", "\u6f14\u793a\uff1a\u9884\u89c8\u89c6\u9891\u7d20\u6750");
        bt.innerHTML =
          '<div class="b-mlib-thumb__mock" aria-hidden="true">\u25b6</div><span class="b-mlib-thumb__dur">' +
          String(item.dur || "00:00").replace(/</g, "") +
          "</span>";
        cell.appendChild(bt);
        cell.appendChild(
          miniTools("video", item.id, function () {
            var d = read();
            var it = d.video.filter(function (x) {
              return x.id === item.id;
            })[0];
            if (!it) return;
            var nl = window.prompt("\u7f16\u8f91\u89c6\u9891\u7d20\u6750\u540d\u79f0", it.label);
            if (nl == null) return;
            nl = nl.trim();
            if (!nl) return;
            it.label = nl;
            var nd = window.prompt("\u5c55\u793a\u65f6\u957f\uff08\u5982 01:29\uff09", it.dur || "01:00");
            if (nd != null && nd.trim()) it.dur = nd.trim();
            write(d);
            removeFromPicks("video", item.id);
            renderVideo();
            if (window.kykwMlibPickMode) window.kykwMlibRestorePanel("b-materials-video");
          }, function () {
            if (!window.confirm("\u786e\u5b9a\u5220\u9664\u8be5\u6761\u89c6\u9891\u7d20\u6750\uff1f")) return;
            var d = read();
            d.video = d.video.filter(function (x) {
              return x.id !== item.id;
            });
            write(d);
            removeFromPicks("video", item.id);
            renderVideo();
            if (window.kykwMlibPickMode) window.kykwMlibRestorePanel("b-materials-video");
          })
        );
        mount.appendChild(cell);
      });
      var add = document.createElement("button");
      add.type = "button";
      add.className = "b-mlib-add-cell";
      add.innerHTML = '<span class="b-mlib-add-cell__plus">+</span><span>\u6dfb\u52a0\u7d20\u6750</span>';
      add.addEventListener("click", function () {
        window.kykwMlibAddItem("video");
      });
      mount.appendChild(add);
      var hint = document.querySelector("#b-materials-video .b-mlib-hint");
      if (hint) {
        hint.innerHTML =
          "\u539f\u578b\uff1a\u5217\u8868\u6570\u636e\u5b58 <code>localStorage</code>\uff08<code>" +
          KEY +
          "</code>\uff09\u3002<strong>\u67e5</strong>\u8fdb\u5165\u672c\u9875\u5373\u53ef\u89c1\uff1b<strong>\u589e</strong>\u70b9\u201c+\u201d\uff1b<strong>\u6539/\u5220</strong>\u7528\u5361\u7247\u53f3\u4e0a\u89d2\u6309\u94ae\uff1b\u521b\u4f5c\u591a\u9009\u65f6\u70b9\u5361\u7247\u4e3b\u4f53\u3002";
      }
      if (window.kykwMlibPickMode) window.kykwMlibRestorePanel("b-materials-video");
    }

    function renderImage() {
      var mount = document.querySelector("#b-materials-image .b-mlib-media-grid");
      if (!mount) return;
      var data = read();
      mount.innerHTML = "";
      data.image.forEach(function (item) {
        var cell = document.createElement("div");
        cell.className = "b-mlib-thumb-wrap";
        var bt = document.createElement("button");
        bt.type = "button";
        bt.className = "b-mlib-thumb b-mlib-thumb--img b-mlib-pickable";
        bt.setAttribute("data-mlib-type", "image");
        bt.setAttribute("data-mlib-id", item.id);
        bt.setAttribute("data-mlib-label", item.label);
        bt.setAttribute("aria-pressed", "false");
        bt.setAttribute("data-mlib-demo", "\u6f14\u793a\uff1a\u67e5\u770b\u56fe\u7247\u7d20\u6750");
        bt.innerHTML = '<div class="b-mlib-thumb__mock b-mlib-thumb__mock--img" aria-hidden="true">\ud83d\udcf7</div>';
        cell.appendChild(bt);
        cell.appendChild(
          miniTools("image", item.id, function () {
            var d = read();
            var it = d.image.filter(function (x) {
              return x.id === item.id;
            })[0];
            if (!it) return;
            var nl = window.prompt("\u7f16\u8f91\u56fe\u7247\u7d20\u6750\u540d\u79f0", it.label);
            if (nl == null) return;
            nl = nl.trim();
            if (!nl) return;
            it.label = nl;
            write(d);
            removeFromPicks("image", item.id);
            renderImage();
            if (window.kykwMlibPickMode) window.kykwMlibRestorePanel("b-materials-image");
          }, function () {
            if (!window.confirm("\u786e\u5b9a\u5220\u9664\u8be5\u6761\u56fe\u7247\u7d20\u6750\uff1f")) return;
            var d = read();
            d.image = d.image.filter(function (x) {
              return x.id !== item.id;
            });
            write(d);
            removeFromPicks("image", item.id);
            renderImage();
            if (window.kykwMlibPickMode) window.kykwMlibRestorePanel("b-materials-image");
          })
        );
        mount.appendChild(cell);
      });
      var add = document.createElement("button");
      add.type = "button";
      add.className = "b-mlib-add-cell";
      add.innerHTML = '<span class="b-mlib-add-cell__plus">+</span><span>\u6dfb\u52a0\u7d20\u6750</span>';
      add.addEventListener("click", function () {
        window.kykwMlibAddItem("image");
      });
      mount.appendChild(add);
      var hint = document.querySelector("#b-materials-image .b-mlib-hint");
      if (hint) {
        hint.innerHTML =
          "\u540c\u4e0a\uff1a<strong>\u67e5</strong>\u8fdb\u5165\u672c\u9875\uff1b<strong>\u589e</strong>\u201c+\u201d\uff1b<strong>\u6539/\u5220</strong>\u5361\u7247\u89d2\u6807\uff1b\u591a\u9009\u70b9\u7f29\u7565\u56fe\u4e3b\u4f53\u3002\u6570\u636e\u952e <code>" +
          KEY +
          "</code>\u3002";
      }
      if (window.kykwMlibPickMode) window.kykwMlibRestorePanel("b-materials-image");
    }

    function renderTopic() {
      var ul = document.querySelector("#b-materials-topic ul.b-mlib-copy-list");
      if (!ul) return;
      var data = read();
      ul.innerHTML = "";
      data.topic.forEach(function (item) {
        var li = document.createElement("li");
        li.className = "b-mlib-li-crud";
        var bt = document.createElement("button");
        bt.type = "button";
        bt.className = "b-mlib-copy-row b-mlib-pickable" + (item.emph ? " b-mlib-copy-row--emph" : "");
        bt.setAttribute("data-mlib-type", "topic");
        bt.setAttribute("data-mlib-id", item.id);
        bt.setAttribute("data-mlib-label", item.label);
        bt.setAttribute("data-mlib-demo", item.demo || "\u6f14\u793a\uff1a\u7f16\u8f91\u8bdd\u9898");
        var span = document.createElement("span");
        span.textContent = item.lineText != null ? item.lineText : item.label;
        var arr = document.createElement("span");
        arr.className = "b-mlib-copy-row__arr";
        arr.setAttribute("aria-hidden", "true");
        arr.textContent = "\u203a";
        bt.appendChild(span);
        bt.appendChild(arr);
        li.appendChild(bt);
        li.appendChild(
          miniTools("topic", item.id, function () {
            var d = read();
            var it = d.topic.filter(function (x) {
              return x.id === item.id;
            })[0];
            if (!it) return;
            var nl = window.prompt("\u7f16\u8f91\u8bdd\u9898\uff08\u5c55\u793a\u6587\u672c\uff09", it.lineText != null ? it.lineText : it.label);
            if (nl == null) return;
            nl = nl.trim();
            if (!nl) return;
            if (it.emph) {
              it.lineText = nl;
            } else {
              it.label = nl;
            }
            write(d);
            removeFromPicks("topic", item.id);
            renderTopic();
            if (window.kykwMlibPickMode) window.kykwMlibRestorePanel("b-materials-topic");
          }, function () {
            if (!window.confirm("\u786e\u5b9a\u5220\u9664\u8be5\u6761\u8bdd\u9898\uff1f")) return;
            var d = read();
            d.topic = d.topic.filter(function (x) {
              return x.id !== item.id;
            });
            write(d);
            removeFromPicks("topic", item.id);
            renderTopic();
            if (window.kykwMlibPickMode) window.kykwMlibRestorePanel("b-materials-topic");
          })
        );
        ul.appendChild(li);
      });
      var hint = document.querySelector("#b-materials-topic .b-mlib-hint");
      if (!hint) {
        hint = document.createElement("p");
        hint.className = "b-mlib-hint";
        var dashed = document.querySelector("#b-materials-topic .b-mlib-dashed-btn");
        if (dashed && dashed.parentNode) dashed.parentNode.insertBefore(hint, dashed);
      }
      hint.innerHTML =
        "\u8bdd\u9898\u5217\u8868\uff1a<strong>\u67e5</strong>\u672c\u9875\uff1b<strong>\u589e</strong>\u5e95\u90e8\u201c\u6dfb\u52a0\u8bdd\u9898\u201d\uff1b<strong>\u6539/\u5220</strong>\u884c\u53f3\u4fa7\uff1b\u591a\u9009\u70b9\u884c\u4e3b\u4f53\u3002";
      if (window.kykwMlibPickMode) window.kykwMlibRestorePanel("b-materials-topic");
    }

    function renderText() {
      var ul = document.querySelector("#b-materials-text ul.b-mlib-copy-list");
      if (!ul) return;
      var data = read();
      ul.innerHTML = "";
      data.text.forEach(function (item) {
        var li = document.createElement("li");
        li.className = "b-mlib-li-crud";
        var bt = document.createElement("button");
        bt.type = "button";
        bt.className = "b-mlib-copy-row b-mlib-pickable";
        bt.setAttribute("data-mlib-type", "text");
        bt.setAttribute("data-mlib-id", item.id);
        bt.setAttribute("data-mlib-label", item.label);
        bt.setAttribute("data-mlib-demo", item.demo || "\u6f14\u793a\uff1a\u7f16\u8f91\u6587\u6848");
        var span = document.createElement("span");
        span.className = "b-mlib-copy-row__multiline";
        span.textContent = item.label;
        var arr = document.createElement("span");
        arr.className = "b-mlib-copy-row__arr";
        arr.setAttribute("aria-hidden", "true");
        arr.textContent = "\u203a";
        bt.appendChild(span);
        bt.appendChild(arr);
        li.appendChild(bt);
        li.appendChild(
          miniTools("text", item.id, function () {
            var d = read();
            var it = d.text.filter(function (x) {
              return x.id === item.id;
            })[0];
            if (!it) return;
            var nl = window.prompt("\u7f16\u8f91\u6587\u672c\u7d20\u6750", it.label);
            if (nl == null) return;
            nl = nl.trim();
            if (!nl) return;
            it.label = nl;
            write(d);
            removeFromPicks("text", item.id);
            renderText();
            if (window.kykwMlibPickMode) window.kykwMlibRestorePanel("b-materials-text");
          }, function () {
            if (!window.confirm("\u786e\u5b9a\u5220\u9664\u8be5\u6761\u6587\u672c\u7d20\u6750\uff1f")) return;
            var d = read();
            d.text = d.text.filter(function (x) {
              return x.id !== item.id;
            });
            write(d);
            removeFromPicks("text", item.id);
            renderText();
            if (window.kykwMlibPickMode) window.kykwMlibRestorePanel("b-materials-text");
          })
        );
        ul.appendChild(li);
      });
      var hint = document.querySelector("#b-materials-text .b-mlib-hint");
      if (!hint) {
        hint = document.createElement("p");
        hint.className = "b-mlib-hint";
        var dashed = document.querySelector("#b-materials-text .b-mlib-dashed-btn");
        if (dashed && dashed.parentNode) dashed.parentNode.insertBefore(hint, dashed);
      }
      hint.innerHTML =
        "\u6587\u672c\u5217\u8868\uff1a<strong>\u67e5</strong>\u672c\u9875\uff1b<strong>\u589e</strong>\u5e95\u90e8\u201c\u6dfb\u52a0\u6587\u672c\u201d\uff1b<strong>\u6539/\u5220</strong>\u884c\u53f3\u4fa7\uff1b\u591a\u9009\u70b9\u6587\u6848\u4e3b\u4f53\u3002";
      if (window.kykwMlibPickMode) window.kykwMlibRestorePanel("b-materials-text");
    }

    window.kykwMlibRenderScreen = function (screenId) {
      if (screenId === "b-materials-video") renderVideo();
      else if (screenId === "b-materials-image") renderImage();
      else if (screenId === "b-materials-topic") renderTopic();
      else if (screenId === "b-materials-text") renderText();
    };

    window.kykwMlibAddItem = function (ty) {
      var d = read();
      if (ty === "video") {
        var lab = window.prompt("\u65b0\u589e\u89c6\u9891\u7d20\u6750\u540d\u79f0", "\u65b0\u89c6\u9891\u7247\u6bb5");
        if (lab == null) return;
        lab = lab.trim();
        if (!lab) return;
        var dur = window.prompt("\u5c55\u793a\u65f6\u957f", "01:00");
        d.video.push({ id: genId("v"), label: lab, dur: (dur && dur.trim()) || "01:00" });
      } else if (ty === "image") {
        var lab2 = window.prompt("\u65b0\u589e\u56fe\u7247\u7d20\u6750\u540d\u79f0", "\u65b0\u56fe\u7247\u7d20\u6750");
        if (lab2 == null) return;
        lab2 = lab2.trim();
        if (!lab2) return;
        d.image.push({ id: genId("i"), label: lab2 });
      } else if (ty === "topic") {
        var lab3 = window.prompt("\u65b0\u589e\u8bdd\u9898\uff08\u5efa\u8bae\u4ee5 # \u5f00\u5934\uff09", "# \u65b0\u8bdd\u9898");
        if (lab3 == null) return;
        lab3 = lab3.trim();
        if (!lab3) return;
        d.topic.push({ id: genId("topic"), label: lab3, demo: "\u6f14\u793a\uff1a\u7f16\u8f91\u8bdd\u9898" });
      } else if (ty === "text") {
        var lab4 = window.prompt("\u65b0\u589e\u6587\u672c\u7d20\u6750\u6b63\u6587", "");
        if (lab4 == null) return;
        lab4 = lab4.trim();
        if (!lab4) return;
        d.text.push({ id: genId("text"), label: lab4, demo: "\u6f14\u793a\uff1a\u7f16\u8f91\u6587\u6848" });
      }
      write(d);
      if (ty === "video") renderVideo();
      else if (ty === "image") renderImage();
      else if (ty === "topic") renderTopic();
      else if (ty === "text") renderText();
    };

    (function wireMlibToolbarAndAdd() {
      var addT = document.querySelector("#b-materials-topic .b-mlib-dashed-btn");
      if (addT && !addT.getAttribute("data-mlib-crud")) {
        addT.setAttribute("data-mlib-crud", "1");
        addT.onclick = function () {
          window.kykwMlibAddItem("topic");
        };
      }
      var addX = document.querySelector("#b-materials-text .b-mlib-dashed-btn");
      if (addX && !addX.getAttribute("data-mlib-crud")) {
        addX.setAttribute("data-mlib-crud", "1");
        addX.onclick = function () {
          window.kykwMlibAddItem("text");
        };
      }
    })();
  })();

  window.mVgSyncHiddenFromPicks = function () {
    var items = window.mVgPickedMlibItems || [];
    var texts = items.filter(function (x) {
      return x.type === "text";
    });
    var topics = items.filter(function (x) {
      return x.type === "topic";
    });
    var pn = document.getElementById("m-vg-product-name");
    var sn = document.getElementById("m-vg-store-name");
    var usp = document.getElementById("m-vg-product-usp");
    var addr = document.getElementById("m-vg-store-addr");
    var defName = "AI 视频成片";
    var title = "";
    if (texts[0]) title = texts[0].label.slice(0, 80);
    else if (topics[0]) title = topics[0].label.slice(0, 80);
    else if (items[0]) title = items[0].label.slice(0, 80);
    else title = defName;
    var lines = items
      .map(function (x) {
        return x.label;
      })
      .join("\n");
    if (pn) pn.value = title || defName;
    if (sn) sn.value = "本店";
    if (usp) usp.value = lines.slice(0, 800) || "（见已选素材）";
    if (addr) addr.value = "";
  };

  window.mVgRenderPickedMlib = function () {
    var ul = document.getElementById("m-vg-mlib-picked-list");
    var empty = document.getElementById("m-vg-mlib-picked-empty");
    var countEl = document.getElementById("m-vg-mlib-picked-count");
    var items = window.mVgPickedMlibItems || [];
    window.mVgSyncHiddenFromPicks();
    if (countEl) countEl.textContent = String(items.length);
    if (empty) empty.hidden = items.length > 0;
    if (!ul) return;
    ul.innerHTML = "";
    var typeLab = { video: "视频", image: "图片", topic: "话题", text: "文本" };
    items.forEach(function (it) {
      var li = document.createElement("li");
      li.className = "m-vg-mlib-picked-item";
      var ty = document.createElement("span");
      ty.className = "m-vg-mlib-picked-type";
      ty.textContent = typeLab[it.type] || it.type;
      var lab = document.createElement("span");
      lab.className = "m-vg-mlib-picked-label";
      lab.textContent = it.label;
      var rm = document.createElement("button");
      rm.type = "button";
      rm.className = "m-vg-mlib-picked-remove";
      rm.setAttribute("data-pick-type", it.type);
      rm.setAttribute("data-pick-id", it.id);
      rm.textContent = "移除";
      li.appendChild(ty);
      li.appendChild(lab);
      li.appendChild(rm);
      ul.appendChild(li);
    });
    if (!ul._kykwPickRmBound) {
      ul._kykwPickRmBound = true;
      ul.addEventListener("click", function (e) {
        var btn = e.target.closest(".m-vg-mlib-picked-remove");
        if (!btn) return;
        var ty = btn.getAttribute("data-pick-type");
        var pid = btn.getAttribute("data-pick-id");
        window.mVgPickedMlibItems = (window.mVgPickedMlibItems || []).filter(function (x) {
          return !(x.type === ty && x.id === pid);
        });
        window.mVgRenderPickedMlib();
      });
    }
  };

  document.addEventListener(
    "click",
    function (e) {
      var el = e.target.closest(".b-mlib-pickable");
      if (!el) return;
      if (window.kykwMlibPickMode) {
        e.preventDefault();
        e.stopPropagation();
        el.classList.toggle("b-mlib-pickable--selected");
        return;
      }
      var demo = el.getAttribute("data-mlib-demo");
      if (demo && typeof window.showPromoteToast === "function") {
        window.showPromoteToast(demo);
      }
    },
    true
  );

  function toolPickedItems(source) {
    if (source === "poster") return window.kykwPosterPickedMlibItems || [];
    if (source === "copy") return window.kykwCopyPickedMlibItems || [];
    return [];
  }

  function setToolPickedItems(source, arr) {
    if (source === "poster") window.kykwPosterPickedMlibItems = arr;
    if (source === "copy") window.kykwCopyPickedMlibItems = arr;
  }

  function renderToolPickedList(source, refs) {
    var arr = toolPickedItems(source).filter(function (x) {
      return x.type === "image" || x.type === "text";
    });
    var countEl = document.getElementById(refs.countId);
    var listEl = document.getElementById(refs.listId);
    var emptyEl = document.getElementById(refs.emptyId);
    if (!countEl || !listEl || !emptyEl) return;
    countEl.textContent = String(arr.length);
    listEl.innerHTML = "";
    if (!arr.length) {
      emptyEl.style.display = "block";
      return;
    }
    emptyEl.style.display = "none";
    arr.forEach(function (it) {
      var li = document.createElement("li");
      li.className = "m-vg-mlib-picked-item";
      var ty = document.createElement("span");
      ty.className = "m-vg-mlib-picked-type";
      ty.textContent = it.type === "image" ? "图" : "文";
      var lab = document.createElement("span");
      lab.className = "m-vg-mlib-picked-label";
      lab.textContent = it.label || "";
      var rm = document.createElement("button");
      rm.type = "button";
      rm.className = "m-vg-mlib-picked-remove";
      rm.setAttribute("data-tool-pick-source", source);
      rm.setAttribute("data-pick-type", it.type);
      rm.setAttribute("data-pick-id", it.id);
      rm.textContent = "移除";
      li.appendChild(ty);
      li.appendChild(lab);
      li.appendChild(rm);
      listEl.appendChild(li);
    });
  }

  window.kykwGetPickedMlibLabels = function (source, type) {
    return toolPickedItems(source)
      .filter(function (x) {
        return x.type === type;
      })
      .map(function (x) {
        return x.label || "";
      })
      .filter(function (x) {
        return !!x;
      });
  };

  window.kykwRenderCopyPickedMlib = function () {
    renderToolPickedList("copy", {
      countId: "b-copy-mlib-picked-count",
      listId: "b-copy-mlib-picked-list",
      emptyId: "b-copy-mlib-picked-empty",
    });
  };

  window.kykwRenderPosterPickedMlib = function () {
    renderToolPickedList("poster", {
      countId: "b-poster-mlib-picked-count",
      listId: "b-poster-mlib-picked-list",
      emptyId: "b-poster-mlib-picked-empty",
    });
  };

  window.kykwCopyAfterReturnFromMlib = function () {
    if (typeof window.kykwRenderCopyPickedMlib === "function") window.kykwRenderCopyPickedMlib();
  };

  window.kykwPosterAfterReturnFromMlib = function () {
    if (typeof window.kykwRenderPosterPickedMlib === "function") window.kykwRenderPosterPickedMlib();
  };

  document.addEventListener("click", function (e) {
    var btn = e.target.closest(".m-vg-mlib-picked-remove[data-tool-pick-source]");
    if (!btn) return;
    var source = btn.getAttribute("data-tool-pick-source") || "copy";
    var ty = btn.getAttribute("data-pick-type");
    var pid = btn.getAttribute("data-pick-id");
    var next = toolPickedItems(source).filter(function (x) {
      return !(x.type === ty && String(x.id) === String(pid));
    });
    setToolPickedItems(source, next);
    if (source === "copy") window.kykwRenderCopyPickedMlib();
    if (source === "poster") window.kykwRenderPosterPickedMlib();
  });

  /** 商家：用户分享提交列表（凭证 + 内容快照，用于发券核验） */
  (function kykwMerchantShareQueueInit() {
    var KEY = "kykw_merchant_share_submissions";
    var SHARE_DETAIL_ID_KEY = "kykw_share_detail_id";

    function read() {
      try {
        var raw = localStorage.getItem(KEY);
        var arr = raw ? JSON.parse(raw) : [];
        return Array.isArray(arr) ? arr : [];
      } catch (e) {
        return [];
      }
    }
    function write(arr) {
      try {
        localStorage.setItem(KEY, JSON.stringify(arr));
      } catch (e) {}
    }

    function statusLabel(st) {
      if (st === "voucher_sent") return { text: "已发券", cls: "success" };
      if (st === "rejected") return { text: "已驳回", cls: "" };
      return { text: "待处理", cls: "pending" };
    }

    function formatTime(ts) {
      var d = new Date(ts);
      return !isNaN(d.getTime()) ? d.toLocaleString() : "";
    }

    function escapeHtml(s) {
      var d = document.createElement("div");
      d.textContent = s == null ? "" : String(s);
      return d.innerHTML;
    }

    window.kykwPushShareSubmission = function (entry) {
      var arr = read();
      arr.unshift(entry);
      write(arr);
      if (typeof window.kykwRenderMerchantTodo === "function") {
        window.kykwRenderMerchantTodo();
      }
    };

    window.kykwRenderMerchantTodo = function () {
      var listEl = document.getElementById("b-todo-list");
      var emptyEl = document.getElementById("b-todo-empty");
      if (!listEl) return;
      var items = read().slice().sort(function (a, b) {
        return (b.createdAt || 0) - (a.createdAt || 0);
      });
      listEl.innerHTML = "";
      if (!items.length) {
        if (emptyEl) emptyEl.style.display = "block";
        return;
      }
      if (emptyEl) emptyEl.style.display = "none";
      items.forEach(function (item) {
        var li = document.createElement("li");
        li.className = "b-todo-item";
        li.setAttribute("data-sub-id", item.id);
        var st = statusLabel(item.status || "pending");
        li.innerHTML =
          '<div class="b-todo-item__row">' +
          '<div><strong class="b-todo-item__title"></strong><p class="b-todo-item__meta meta"></p></div>' +
          '<span class="pill ' +
          escapeHtml(st.cls) +
          '">' +
          escapeHtml(st.text) +
          "</span></div>" +
          '<p class="b-todo-item__hint">点击进入详情，核验凭证并确认是否发券</p>';
        li.querySelector(".b-todo-item__title").textContent =
          item.channelLabel || (item.type === "video" ? "发视频" : "点评打卡");
        li.querySelector(".b-todo-item__meta").textContent =
          (item.orderMask || "") +
          " · " +
          (item.userMask || "") +
          " · " +
          formatTime(item.createdAt);
        li.addEventListener("click", function () {
          window.kykwOpenShareDetail(item.id);
        });
        listEl.appendChild(li);
      });
    };

    window.kykwOpenShareDetail = function (id) {
      try {
        sessionStorage.setItem(SHARE_DETAIL_ID_KEY, id);
      } catch (e) {}
      window.goScreen("b-todo-detail");
    };

    window.kykwRenderShareDetailPage = function () {
      var id = null;
      try {
        id = sessionStorage.getItem(SHARE_DETAIL_ID_KEY);
      } catch (e) {}
      var items = read();
      var item = id
        ? items.filter(function (x) {
            return x.id === id;
          })[0]
        : null;
      var bodyEl = document.getElementById("b-todo-detail-body");
      var footEl = document.getElementById("b-todo-detail-foot");
      var navTitle = document.getElementById("b-todo-detail-nav-title");
      if (!bodyEl || !footEl) return;

      function finishAndBack(msg) {
        try {
          sessionStorage.removeItem(SHARE_DETAIL_ID_KEY);
        } catch (e2) {}
        window.kykwRenderMerchantTodo();
        window.goScreen("b-todo");
        if (msg && typeof window.showPromoteToast === "function") {
          window.showPromoteToast(msg);
        }
      }

      if (!item) {
        bodyEl.innerHTML =
          "<section class=\"b-share-detail__section\"><p class=\"b-share-detail__muted\">未找到该条记录，请返回列表重试。</p></section>";
        footEl.innerHTML =
          "<button type=\"button\" class=\"btn btn-secondary\" style=\"width:100%;margin-top:12px\" onclick=\"goScreen('b-todo')\">返回列表</button>";
        if (navTitle) navTitle.textContent = "分享详情";
        return;
      }

      if (navTitle) {
        navTitle.textContent =
          (item.channelLabel || "分享") + " · 凭证核验";
      }

      var blocks = [];
      if (item.type === "video" && item.videoPick) {
        blocks.push(
          "<section class=\"b-share-detail__section\"><h4>用户一键生成的视频（门店侧可见摘要）</h4>" +
            "<div class=\"video-mock video-mock--sm\">▶</div>" +
            "<p class=\"b-share-detail__text\"><strong>" +
            escapeHtml(item.videoPick.title || "") +
            "</strong></p>" +
            "<p class=\"b-share-detail__muted\">" +
            escapeHtml(item.videoPick.summary || "") +
            "</p></section>"
        );
      } else if (item.type === "checkin" && item.checkin) {
        var poster = "";
        if (item.checkin.posterDataUrl) {
          poster =
            '<div class="b-share-detail__poster"><img src="" alt="用户打卡配图缩略" /></div>';
        }
        blocks.push(
          "<section class=\"b-share-detail__section\"><h4>用户一键生成的打卡文案与配图</h4>" +
            poster +
            "<p class=\"b-share-detail__text\">" +
            escapeHtml(item.checkin.copy || "") +
            "</p>" +
            "<p class=\"b-share-detail__muted\">风格模板：" +
            escapeHtml(item.checkin.styleKey || "") +
            "</p></section>"
        );
      } else {
        blocks.push(
          "<section class=\"b-share-detail__section\"><p class=\"b-share-detail__muted\">（演示）未捕获到本地内容快照，仍可根据下方截图人工核验。</p></section>"
        );
      }
      blocks.push(
        "<section class=\"b-share-detail__section\"><h4>用户上传的分享截图（核验真实转发）</h4>" +
          '<div class="b-share-detail__proof"><img src="" alt="分享凭证截图" /></div></section>'
      );
      bodyEl.innerHTML = blocks.join("");
      var proofImg = bodyEl.querySelector(".b-share-detail__proof img");
      if (proofImg && item.proofImageDataUrl) proofImg.src = item.proofImageDataUrl;
      var posterImg = bodyEl.querySelector(".b-share-detail__poster img");
      if (posterImg && item.checkin && item.checkin.posterDataUrl) {
        posterImg.src = item.checkin.posterDataUrl;
      }

      footEl.innerHTML = "";
      if ((item.status || "pending") === "pending") {
        footEl.innerHTML =
          '<p class="b-todo-detail__lead">请确认用户已完成真实分享后，再发放抵扣券。</p>' +
          '<div class="btn-row">' +
          '<button type="button" class="btn btn-secondary" id="b-todo-detail-reject">驳回</button>' +
          '<button type="button" class="btn btn-primary-merchant" id="b-todo-detail-voucher">确认发放抵扣券</button>' +
          "</div>";
        var btnR = document.getElementById("b-todo-detail-reject");
        var btnV = document.getElementById("b-todo-detail-voucher");
        if (btnR) {
          btnR.addEventListener("click", function (e) {
            e.stopPropagation();
            item.status = "rejected";
            write(items);
            finishAndBack("已驳回该条分享申请（演示）");
          });
        }
        if (btnV) {
          btnV.addEventListener("click", function (e) {
            e.stopPropagation();
            item.status = "voucher_sent";
            write(items);
            finishAndBack("演示：抵扣券已发放至用户卡券");
          });
        }
      } else {
        footEl.innerHTML =
          '<p class="b-share-detail__foot-note">该条已处理，无需再次发券。</p>' +
          '<button type="button" class="btn btn-secondary" style="width:100%;margin-top:12px" onclick="goScreen(\'b-todo\')">返回列表</button>';
      }
    };

    var seedBtn = document.getElementById("b-todo-seed-demo");
    if (seedBtn) {
      seedBtn.addEventListener("click", function () {
        var pix =
          "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==";
        window.kykwPushShareSubmission({
          id: "sub-demo-" + Date.now(),
          type: "video",
          channelLabel: "发视频 · 待确认",
          orderMask: "订单 202603311200****001",
          userMask: "用户 138****8000",
          createdAt: Date.now(),
          status: "pending",
          videoPick: {
            title: "招牌醉虾 · 用户一键成片（演示）",
            summary: "温馨种草 · 1:1 · 竖屏 · 30 秒 · 字幕开启",
          },
          checkin: null,
          proofImageDataUrl: pix,
        });
      });
    }
  })();

  /** 已生成视频列表 + 用户分享随机池（localStorage 演示） */
  (function kykwVideoPoolInit() {
    var KEY = "kykw_merchant_video_pool";

    function normalizePoolItem(x) {
      if (!x.status) x.status = "completed";
      if (typeof x.deleted !== "boolean") x.deleted = false;
      if (!x.shareAudit) x.shareAudit = x.inSharePool ? "approved" : "none";
      if (typeof x.progressPct !== "number" && x.status === "generating") x.progressPct = 0;
      return x;
    }

    window.kykwVideoPoolRead = function () {
      try {
        var raw = localStorage.getItem(KEY);
        var arr = raw ? JSON.parse(raw) : [];
        var dirty = false;
        if (!Array.isArray(arr)) return [];
        arr.forEach(function (x) {
          var before = JSON.stringify(x);
          normalizePoolItem(x);
          if (JSON.stringify(x) !== before) dirty = true;
        });
        if (dirty) {
          try {
            localStorage.setItem(KEY, JSON.stringify(arr));
          } catch (e1) {}
        }
        return arr;
      } catch (e) {
        return [];
      }
    };
    window.kykwVideoPoolWrite = function (arr) {
      try {
        localStorage.setItem(KEY, JSON.stringify(arr));
      } catch (e) {}
    };
    window.kykwVideoPoolShareable = function () {
      return window.kykwVideoPoolRead().filter(function (x) {
        return (
          !x.deleted &&
          x.status === "completed" &&
          x.inSharePool &&
          x.shareAudit === "approved"
        );
      });
    };

    function vpoolActiveFilter() {
      var act = document.querySelector("#b-share-lib-detail-video .b-vpool-filter.active");
      return act && act.getAttribute("data-vpool-filter") ? act.getAttribute("data-vpool-filter") : "all";
    }

    function vpoolItemMatchesFilter(item, fk) {
      if (fk === "deleted") return !!item.deleted;
      if (item.deleted) return false;
      if (fk === "generating") return item.status === "generating";
      if (fk === "completed") return item.status === "completed";
      if (fk === "share_ok") {
        return (
          item.status === "completed" && item.inSharePool && item.shareAudit === "approved"
        );
      }
      if (fk === "audit_pending") {
        return item.inSharePool && item.shareAudit === "pending";
      }
      return true;
    }

    function escapeAttr(s) {
      return String(s).replace(/"/g, "&quot;");
    }

    window.kykwRenderVideoPoolList = function () {
      var listEl = document.getElementById("b-vpool-list");
      var emptyEl = document.getElementById("b-vpool-empty");
      if (!listEl) return;
      var items = window.kykwVideoPoolRead();
      var fk = vpoolActiveFilter();
      var filtered = items.filter(function (item) {
        return vpoolItemMatchesFilter(item, fk);
      });
      listEl.innerHTML = "";
      if (!filtered.length) {
        if (emptyEl) emptyEl.style.display = "block";
        return;
      }
      if (emptyEl) emptyEl.style.display = "none";
      if (!listEl._kykwVpoolDelegated) {
        listEl._kykwVpoolDelegated = true;
        listEl.addEventListener("change", function (e) {
          var t = e.target;
          if (!t.classList || !t.classList.contains("b-vpool-share-cb")) return;
          var vid = t.getAttribute("data-vid");
          var arr = window.kykwVideoPoolRead();
          var found = arr.filter(function (x) {
            return String(x.id) === String(vid);
          })[0];
          if (found && found.status === "completed" && !found.deleted) {
            found.inSharePool = !!t.checked;
            found.shareAudit = found.inSharePool ? "pending" : "none";
            window.kykwVideoPoolWrite(arr);
            window.kykwRenderVideoPoolList();
          }
        });
        listEl.addEventListener("click", function (e) {
          var delBtn = e.target.closest(".b-vpool-del");
          if (delBtn) {
            var vid = delBtn.getAttribute("data-vid");
            var arr = window.kykwVideoPoolRead();
            var found = arr.filter(function (x) {
              return String(x.id) === String(vid);
            })[0];
            if (found) {
              found.deleted = true;
              window.kykwVideoPoolWrite(arr);
              window.kykwRenderVideoPoolList();
            }
            return;
          }
          var restoreBtn = e.target.closest(".b-vpool-restore");
          if (restoreBtn) {
            var vid2 = restoreBtn.getAttribute("data-vid");
            var arr2 = window.kykwVideoPoolRead();
            var found2 = arr2.filter(function (x) {
              return String(x.id) === String(vid2);
            })[0];
            if (found2) {
              found2.deleted = false;
              window.kykwVideoPoolWrite(arr2);
              window.kykwRenderVideoPoolList();
            }
          }
        });
      }
      filtered.forEach(function (item) {
        var li = document.createElement("li");
        li.className = "b-vpool-item" + (item.deleted ? " b-vpool-item--deleted" : "");
        var d = new Date(item.createdAt);
        var ds = !isNaN(d.getTime()) ? d.toLocaleString() : "";

        var statusLab = "";
        if (item.deleted) statusLab = "已删除";
        else if (item.status === "generating") statusLab = "生成中";
        else statusLab = "已完成";

        var auditLab = "";
        if (item.inSharePool) {
          if (item.shareAudit === "approved") auditLab = "分享·已通过";
          else if (item.shareAudit === "pending") auditLab = "分享·审核中";
          else if (item.shareAudit === "rejected") auditLab = "分享·未通过";
          else auditLab = "分享";
        }

        li.innerHTML =
          '<div class="b-vpool-item__thumb" aria-hidden="true">▶</div>' +
          '<div class="b-vpool-item__body">' +
          '<p class="b-vpool-item__title"></p>' +
          '<div class="b-vpool-item__badges"></div>' +
          '<p class="b-vpool-item__meta"></p>' +
          '<div class="b-vpool-item__progress" style="display:none"></div>' +
          '<p class="b-vpool-item__time"></p></div>' +
          '<div class="b-vpool-item__side"></div>';

        li.querySelector(".b-vpool-item__title").textContent = item.title || "未命名成片";
        li.querySelector(".b-vpool-item__meta").textContent = item.summary || "";
        li.querySelector(".b-vpool-item__time").textContent = ds ? "保存于 " + ds : "";

        var badges = li.querySelector(".b-vpool-item__badges");
        function addBadge(text, mod) {
          var sp = document.createElement("span");
          sp.className = "b-vpool-item__badge" + (mod ? " " + mod : "");
          sp.textContent = text;
          badges.appendChild(sp);
        }
        addBadge(statusLab, item.status === "generating" ? "b-vpool-item__badge--generating" : "");
        if (auditLab) addBadge(auditLab, "");

        var progressHost = li.querySelector(".b-vpool-item__progress");
        if (item.status === "generating") {
          progressHost.style.display = "block";
          var pct = Math.min(100, Math.round(typeof item.progressPct === "number" ? item.progressPct : 0));
          progressHost.innerHTML =
            '<div class="progress-bar"><span style="width:' + pct + '%"></span></div>';
        }

        var side = li.querySelector(".b-vpool-item__side");
        if (item.deleted) {
          side.innerHTML =
            '<div class="b-vpool-item__actions">' +
            '<button type="button" class="btn btn-secondary b-vpool-restore" data-vid="' +
            escapeAttr(String(item.id)) +
            '">恢复</button></div>';
        } else {
          var shareHtml =
            '<label class="b-vpool-item__share"><input type="checkbox" class="b-vpool-share-cb" />分享菜单</label>';
          if (item.status !== "completed") {
            shareHtml =
              '<label class="b-vpool-item__share" style="opacity:.45" title="成片完成后可申请"><input type="checkbox" disabled />分享菜单</label>';
          }
          var delHtml =
            item.status === "generating"
              ? ""
              : '<button type="button" class="btn btn-secondary b-vpool-del" data-vid="' +
                escapeAttr(String(item.id)) +
                '">删除</button>';
          side.innerHTML =
            '<div class="b-vpool-item__actions">' + shareHtml + delHtml + "</div>";
          var cb = side.querySelector(".b-vpool-share-cb");
          if (cb && item.status === "completed") {
            cb.setAttribute("data-vid", String(item.id));
            cb.checked = !!item.inSharePool;
            cb.disabled = false;
          }
        }

        listEl.appendChild(li);
      });
    };

    document.querySelectorAll("#b-share-lib-detail-video .b-vpool-filter").forEach(function (btn) {
      btn.addEventListener("click", function () {
        if (!btn.getAttribute("data-vpool-filter")) return;
        document.querySelectorAll("#b-share-lib-detail-video .b-vpool-filter").forEach(function (b) {
          b.classList.remove("active");
        });
        btn.classList.add("active");
        window.kykwRenderVideoPoolList();
      });
    });

    var demoAp = document.getElementById("b-vpool-demo-approve");
    if (demoAp) {
      demoAp.addEventListener("click", function () {
        var arr = window.kykwVideoPoolRead();
        var n = 0;
        arr.forEach(function (x) {
          if (x.inSharePool && x.shareAudit === "pending" && !x.deleted) {
            x.shareAudit = "approved";
            n++;
          }
        });
        window.kykwVideoPoolWrite(arr);
        window.kykwRenderVideoPoolList();
        if (typeof window.showPromoteToast === "function") {
          window.showPromoteToast("演示：已通过 " + n + " 条待审成片");
        }
      });
    }

    var seedBtn = document.getElementById("b-vpool-seed-demo");
    if (seedBtn) {
      seedBtn.addEventListener("click", function () {
        var arr = window.kykwVideoPoolRead();
        var ts = Date.now();
        arr.unshift(
          {
            id: "demo-" + ts + "-1",
            title: "湖畔小厨·探店温馨版",
            summary: "温馨种草 · 1:1 · 竖屏 · 30秒 · 字幕开启",
            status: "completed",
            deleted: false,
            inSharePool: true,
            shareAudit: "approved",
            createdAt: ts - 86400000,
          },
          {
            id: "demo-" + ts + "-2",
            title: "招牌醉虾·快闪促销",
            summary: "促销快闪 · 16:9 · 横屏 · 15秒",
            status: "completed",
            deleted: false,
            inSharePool: true,
            shareAudit: "pending",
            createdAt: ts - 3600000,
          }
        );
        window.kykwVideoPoolWrite(arr);
        window.kykwRenderVideoPoolList();
      });
    }
  })();

  /** 分享文案库（localStorage 演示） */
  (function kykwCopyLibraryInit() {
    var KEY = "kykw_copy_library";
    var SCENE_LABEL = {
      moments: "朋友圈",
      xhs: "小红书",
      douyin: "抖音配文",
      review: "点评打卡",
    };
    var TONE_LABEL = {
      lively: "活泼种草",
      literary: "文艺治愈",
      pro: "专业干货",
      promo: "促销紧迫",
    };
    var LEN_LABEL = {
      short: "短篇",
      medium: "中等",
      long: "完整",
    };
    var lastShareImages = [];

    function copyLibSceneKey() {
      var act = document.querySelector(".b-copy-scene.active");
      return act && act.getAttribute("data-copy-scene")
        ? act.getAttribute("data-copy-scene")
        : "moments";
    }
    function copyLibToneKey() {
      var act = document.querySelector(".b-copy-tone.active");
      return act && act.getAttribute("data-copy-tone") ? act.getAttribute("data-copy-tone") : "lively";
    }
    function copyLibLenKey() {
      var act = document.querySelector(".b-copy-len.active");
      return act && act.getAttribute("data-copy-len") ? act.getAttribute("data-copy-len") : "medium";
    }

    function copyLibListScopeKey() {
      var act = document.querySelector("#b-share-lib-detail-copy .b-copy-lib-scope-filter.active");
      var v = act && act.getAttribute("data-copy-lib-scope");
      if (v === "audit_pending" || v === "share_approved") return v;
      return "all";
    }

    function buildCopyText(scene, topic, tone, len, picked) {
      picked = picked || {};
      var pickedTexts = Array.isArray(picked.texts) ? picked.texts : [];
      var pickedImages = Array.isArray(picked.images) ? picked.images : [];
      var t = topic || "本店招牌";
      var L = len || "medium";
      var body = "";
      switch (scene) {
        case "xhs": {
          var mid =
            "谁懂啊这家围绕「" +
            t +
            "」真的低调又好吃，氛围感拉满，随手拍都出片。\n" +
            "✔ 份量实在 ✔ 服务贴心 ✔ 回头客超多";
          var tail = "#湖州探店 #周末去哪儿 #氛围感餐厅 #吃货日记";
          if (L === "short") body = "在湖州挖到宝｜" + t + "值得二刷🥹 详情见定位～\n" + tail;
          else {
            body = "在湖州挖到宝了｜" + t + "必冲清单\n\n" + mid + "\n\n" + tail;
            if (L === "long") {
              body +=
                "\n\n【小贴士】建议工作日下午错峰到店；浅色系穿搭更出片；可问店员当日隐藏款。\n" +
                "#同城精选 #今天吃什么";
            }
          }
          break;
        }
        case "douyin": {
          var dMid = "路过别错过，同款机位与摆盘都帮你踩好点了～评论区扣 1 发定位！";
          var dTail = "#同城美食 #种草 #街头美味";
          if (L === "short") body = t + "｜一口入魂🔥 " + dTail;
          else {
            body = t + "｜一口入魂🔥\n" + dMid + "\n" + dTail;
            if (L === "long") body += "\n\n拍摄建议：自然侧逆光 + 慢动作夹菜；配乐可选轻快 BGM。";
          }
          break;
        }
        case "review":
          if (L === "short") body = "【打卡】" + t + "靠谱，环境与服务在线，推荐。";
          else {
            body =
              "【打卡】环境整洁、上菜快，「" +
              t +
              "」口味稳定在线，适合家人小聚。\n" +
              "服务热情有求必应，会再来～推荐晚市早些时候到店少排队。";
            if (L === "long")
              body += "\n\n排队：建议晚市 17:30 前到店；停车可问店员最近入口。";
          }
          break;
        default: {
          var m0 = "出片又治愈，一桌好味从「" + t + "」开始，朋友都在问地址✨";
          var mTail = "#探店 #本地生活 #聚餐";
          if (L === "short") body = "周末小聚？" + t + "值得再来～戳定位✨\n" + mTail;
          else {
            body = "周末小聚首选？「" + t + "」真的值得再来一趟～\n" + m0 + "\n\n" + mTail;
            if (L === "long") body += "\n\n「慢食笔记」适合带父母或闺蜜小坐；招牌可点半份先尝味。";
          }
        }
      }

      if (tone === "literary") {
        body = "「一席人间烟火」与「" + t + "」相遇，把寻常日子过暖一点。\n\n" + body;
      } else if (tone === "pro") {
        body =
          "【要点速览｜" +
          t +
          "】\n推荐理由：口味稳定、出餐可控、体验可预期。\n\n" +
          body;
      } else if (tone === "promo") {
        body =
          "【本期主推】" + t + "｜名额有限，建议尽早安排到店或线上下单。\n\n" + body;
      } else if (tone === "lively") {
        body = "冲就对了💨\n\n" + body;
      }
      if (pickedTexts.length) {
        body +=
          "\n\n【融合素材文案】\n" +
          pickedTexts
            .slice(0, 2)
            .map(function (x) {
              return "· " + x;
            })
            .join("\n");
      }
      if (pickedImages.length) {
        body +=
          "\n\n【画面素材参考】" +
          pickedImages
            .slice(0, 3)
            .map(function (x) {
              return "「" + x + "」";
            })
            .join("、") +
          "。";
      }
      return body.replace(/\n{3,}/g, "\n\n").trim();
    }

    function buildShareImageSpecs(topic, scene, tone, pickedImages, bodyHint) {
      var firstLine = "";
      if (bodyHint && String(bodyHint).trim()) {
        var lines = String(bodyHint)
          .split(/\r?\n/)
          .map(function (l) {
            return l.trim();
          })
          .filter(Boolean);
        firstLine = lines[0] || "";
        if (firstLine.length > 42) firstLine = firstLine.slice(0, 42) + "…";
      }
      var t = (firstLine || topic || "招牌推荐").trim();
      var imgs = Array.isArray(pickedImages) ? pickedImages : [];
      var imgFocus = imgs.length ? imgs[0] : "";
      if (!t && imgFocus) t = imgFocus;
      if (t.length > 14) t = t.slice(0, 14) + "…";
      var g1 =
        tone === "literary"
          ? "linear-gradient(155deg,#1e3a5f 0%,#7c6f64 45%,#c4b5a0 100%)"
          : tone === "pro"
            ? "linear-gradient(145deg,#0f172a,#334155 60%,#475569)"
            : tone === "promo"
              ? "linear-gradient(135deg,#dc2626,#f97316 50%,#fbbf24)"
              : "linear-gradient(145deg,#6366f1,#a855f7 55%,#ec4899)";
      var g2 =
        tone === "literary"
          ? "linear-gradient(165deg,#3d2c1e,#78350f 40%,#fcd34d)"
          : tone === "pro"
            ? "linear-gradient(160deg,#164e63,#0e7490 70%,#22d3ee)"
            : tone === "promo"
              ? "linear-gradient(140deg,#b91c1c,#ea580c)"
              : "linear-gradient(160deg,#f59e0b,#ec4899 65%,#8b5cf6)";
      var g3 =
        tone === "literary"
          ? "linear-gradient(180deg,#134e4a 0%,#0f766e 50%,#5eead4)"
          : tone === "pro"
            ? "linear-gradient(185deg,#312e81,#4338ca 55%,#818cf8)"
            : tone === "promo"
              ? "linear-gradient(180deg,#991b1b,#f43f5e)"
              : "linear-gradient(185deg,#0f766e,#06b6d4 55%,#67e8f9)";
      var sceneTag = SCENE_LABEL[scene] || "分享";
      return [
        { ratioLabel: "1:1 主图", caption: imgFocus || t, gradient: g1, layout: "sq" },
        { ratioLabel: "4:3 横图", caption: sceneTag + " · " + t, gradient: g2, layout: "wide" },
        {
          ratioLabel: "9:16 竖图",
          caption: "今日推荐",
          gradient: g3,
          layout: "story",
          subCaption: imgFocus || t,
        },
      ];
    }

    function createShareImageCard(s, opts) {
      opts = opts || {};
      var isThumb = !!opts.thumb;
      var card = document.createElement("div");
      card.className = "b-copy-gen-img b-copy-gen-img--" + (s.layout || "sq");
      if (isThumb) {
        card.classList.add("b-copy-gen-img--thumb");
        card.setAttribute("role", "button");
        card.setAttribute("tabindex", "0");
        card.setAttribute(
          "aria-label",
          "放大查看" + (s.ratioLabel ? "：" + s.ratioLabel : "")
        );
        card.dataset.spec = encodeURIComponent(
          JSON.stringify({
            ratioLabel: s.ratioLabel,
            caption: s.caption,
            subCaption: s.subCaption || "",
            gradient: s.gradient,
            layout: s.layout || "sq",
          })
        );
      }
      var cap2 = s.subCaption
        ? '<div class="b-copy-gen-img__cap">' + escapeHtml(s.caption) + "</div>" +
          '<div class="b-copy-gen-img__cap b-copy-gen-img__cap--sub">' +
          escapeHtml(s.subCaption) +
          "</div>"
        : '<div class="b-copy-gen-img__cap">' + escapeHtml(s.caption) + "</div>";
      card.innerHTML =
        '<div class="b-copy-gen-img__canvas" style="background:' +
        s.gradient +
        ';">' +
        '<div class="b-copy-gen-img__ratio">' +
        escapeHtml(s.ratioLabel) +
        "</div>" +
        cap2 +
        "</div>";
      return card;
    }

    function openCopyImageLightbox(spec) {
      var lb = document.getElementById("b-copy-img-lightbox");
      var inner = lb && lb.querySelector(".b-copy-lightbox__inner");
      if (!lb || !inner) return;
      inner.innerHTML = "";
      inner.appendChild(createShareImageCard(spec, { thumb: false }));
      lb.removeAttribute("hidden");
      lb.classList.add("is-open");
      lb.setAttribute("aria-hidden", "false");
      document.body.style.overflow = "hidden";
    }

    function closeCopyImageLightbox() {
      var lb = document.getElementById("b-copy-img-lightbox");
      if (!lb) return;
      lb.classList.remove("is-open");
      lb.setAttribute("aria-hidden", "true");
      lb.setAttribute("hidden", "");
      document.body.style.overflow = "";
    }

    function renderShareImages(specs) {
      var wrap = document.getElementById("b-copy-images-wrap");
      var host = document.getElementById("b-copy-images");
      if (!host) return;
      host.innerHTML = "";
      lastShareImages = specs.map(function (s) {
        return {
          ratioLabel: s.ratioLabel,
          caption: s.caption,
          subCaption: s.subCaption || "",
          gradient: s.gradient,
          layout: s.layout || "sq",
        };
      });
      specs.forEach(function (s) {
        host.appendChild(createShareImageCard(s, { thumb: true }));
      });
      if (wrap) wrap.style.display = "block";
    }

    function escapeHtml(s) {
      var d = document.createElement("div");
      d.textContent = s;
      return d.innerHTML;
    }
    function normalizeCopyItem(x) {
      if (typeof x.inSharePool !== "boolean") x.inSharePool = false;
      if (!x.shareAudit) x.shareAudit = x.inSharePool ? "approved" : "none";
      return x;
    }

    window.kykwCopyLibraryRead = function () {
      try {
        var raw = localStorage.getItem(KEY);
        var arr = raw ? JSON.parse(raw) : [];
        if (!Array.isArray(arr)) return [];
        var dirty = false;
        arr.forEach(function (x) {
          var before = JSON.stringify(x);
          normalizeCopyItem(x);
          if (JSON.stringify(x) !== before) dirty = true;
        });
        if (dirty) {
          try {
            localStorage.setItem(KEY, JSON.stringify(arr));
          } catch (e0) {}
        }
        return arr;
      } catch (e) {
        return [];
      }
    };
    window.kykwCopyLibraryWrite = function (arr) {
      try {
        localStorage.setItem(KEY, JSON.stringify(arr));
      } catch (e) {}
    };
    window.kykwCopyLibraryShareable = function () {
      return window.kykwCopyLibraryRead().filter(function (x) {
        return x.inSharePool && x.shareAudit === "approved";
      });
    };
    window.kykwRenderCopyLibrary = function () {
      var listEl = document.getElementById("b-copy-lib-list");
      var emptyEl = document.getElementById("b-copy-lib-empty");
      if (!listEl) return;
      var allItems = window.kykwCopyLibraryRead();
      var scope = copyLibListScopeKey();
      var items = allItems;
      if (scope === "audit_pending") {
        items = allItems.filter(function (x) {
          return x.inSharePool && x.shareAudit === "pending";
        });
      } else if (scope === "share_approved") {
        items = allItems.filter(function (x) {
          return x.inSharePool && x.shareAudit === "approved";
        });
      }
      listEl.innerHTML = "";
      if (!items.length) {
        if (emptyEl) {
          emptyEl.style.display = "block";
          if (scope === "audit_pending") {
            emptyEl.textContent =
              "暂无审核中文案。请勾选「加入分享菜单」并等待平台审核，或切换到「所有」查看。";
          } else if (scope === "share_approved") {
            emptyEl.textContent =
              "暂无分享已审文案。待平台审核通过后将显示于此，也可使用下方演示按钮通过待审项。";
          } else {
            emptyEl.textContent =
              "暂无文案。请先在「一键生成分享文案」中生成并保存，或点击下方插入演示数据。";
          }
        }
        return;
      }
      if (emptyEl) emptyEl.style.display = "none";
      if (!listEl._kykwCopyShareDeleg) {
        listEl._kykwCopyShareDeleg = true;
        listEl.addEventListener("change", function (e) {
          var t = e.target;
          if (!t.classList || !t.classList.contains("b-copy-share-cb")) return;
          var cid = t.getAttribute("data-copy-id");
          var arr = window.kykwCopyLibraryRead();
          var found = arr.filter(function (x) {
            return String(x.id) === String(cid);
          })[0];
          if (found) {
            found.inSharePool = !!t.checked;
            found.shareAudit = found.inSharePool ? "pending" : "none";
            window.kykwCopyLibraryWrite(arr);
            window.kykwRenderCopyLibrary();
          }
        });
      }
      items.forEach(function (item) {
        var li = document.createElement("li");
        li.className = "b-copy-feed-item";
        var d = new Date(item.createdAt);
        var ds = !isNaN(d.getTime()) ? d.toLocaleString() : "";
        var scene = item.scene || "moments";
        var toneK = item.tone || "";
        var lenK = item.len || "";
        var tagLabels = [SCENE_LABEL[scene] || scene];
        if (toneK && TONE_LABEL[toneK]) tagLabels.push(TONE_LABEL[toneK]);
        if (lenK && LEN_LABEL[lenK]) tagLabels.push(LEN_LABEL[lenK]);
        li.innerHTML =
          '<div class="b-copy-feed__header">' +
          '<div class="b-copy-feed__avatar" aria-hidden="true">文</div>' +
          '<div class="b-copy-feed__header-main">' +
          '<div class="b-copy-feed__title-row">' +
          '<span class="b-copy-feed__title"></span>' +
          "</div>" +
          '<div class="b-copy-feed__time"></div>' +
          "</div>" +
          '<button type="button" class="btn btn-secondary b-copy-lib-copy">复制正文</button>' +
          "</div>" +
          '<div class="b-copy-feed__tags"></div>' +
          '<div class="b-copy-feed__body"></div>' +
          '<div class="b-copy-feed__images"></div>' +
          '<div class="b-copy-feed__audit"></div>' +
          '<label class="b-copy-feed__share-row"><input type="checkbox" class="b-copy-share-cb" /><span></span></label>';

        li.querySelector(".b-copy-feed__title").textContent = item.title || "未命名文案";
        li.querySelector(".b-copy-feed__time").textContent = ds ? ds : "";
        var tagsEl = li.querySelector(".b-copy-feed__tags");
        tagLabels.forEach(function (lab) {
          var sp = document.createElement("span");
          sp.className = "b-copy-feed__tag";
          sp.textContent = lab;
          tagsEl.appendChild(sp);
        });
        li.querySelector(".b-copy-feed__body").textContent = item.body || "";

        var auditEl = li.querySelector(".b-copy-feed__audit");
        var shareAudit = item.shareAudit || "none";
        if (item.inSharePool) {
          if (shareAudit === "approved") {
            auditEl.textContent = "分享菜单：已通过平台内容审核，可供用户端合规选用。";
          } else if (shareAudit === "pending") {
            auditEl.textContent = "分享菜单：平台审核中（需确认无违规及风控风险）。";
          } else if (shareAudit === "rejected") {
            auditEl.textContent = "分享菜单：未通过审核，请修改后重新申请。";
          } else {
            auditEl.textContent = "分享菜单：已加入申请，待审核状态同步。";
          }
        } else {
          auditEl.textContent = "未申请加入分享菜单。";
        }

        var shareRow = li.querySelector(".b-copy-feed__share-row");
        var shareCb = li.querySelector(".b-copy-share-cb");
        var shareSpan = shareRow && shareRow.querySelector("span");
        if (shareCb) {
          shareCb.setAttribute("data-copy-id", String(item.id));
          shareCb.checked = !!item.inSharePool;
        }
        if (shareSpan) {
          shareSpan.textContent = "加入分享菜单（需平台管理员审核）";
        }

        var imgHost = li.querySelector(".b-copy-feed__images");
        var imgs = item.shareImages;
        if (imgHost && imgs && imgs.length) {
          imgs.forEach(function (im) {
            imgHost.appendChild(
              createShareImageCard(
                {
                  ratioLabel: im.ratioLabel || "",
                  caption: im.caption || "",
                  subCaption: im.subCaption || "",
                  gradient: im.gradient || "linear-gradient(145deg,#64748b,#94a3b8)",
                  layout: im.layout || "sq",
                },
                { thumb: true }
              )
            );
          });
        }

        var copyBtn = li.querySelector(".b-copy-lib-copy");
        if (copyBtn)
          copyBtn.addEventListener("click", function () {
            var full = item.body || "";
            if (navigator.clipboard && navigator.clipboard.writeText) {
              navigator.clipboard.writeText(full).catch(function () {});
            } else {
              var ta = document.createElement("textarea");
              ta.value = full;
              document.body.appendChild(ta);
              ta.select();
              try {
                document.execCommand("copy");
              } catch (e) {}
              document.body.removeChild(ta);
            }
          });
        listEl.appendChild(li);
      });
    };
    function bindChipGroup(selector, activeClass) {
      document.querySelectorAll(selector).forEach(function (btn) {
        btn.addEventListener("click", function () {
          document.querySelectorAll(selector).forEach(function (b) {
            b.classList.remove(activeClass);
          });
          btn.classList.add(activeClass);
        });
      });
    }
    bindChipGroup(".b-copy-scene", "active");
    bindChipGroup(".b-copy-tone", "active");
    bindChipGroup(".b-copy-len", "active");

    var genBtn = document.getElementById("b-copy-btn-gen");
    var imgGenBtn = document.getElementById("b-copy-btn-gen-img");
    var saveBtn = document.getElementById("b-copy-btn-save");
    var topicEl = document.getElementById("b-copy-topic");
    var resultEl = document.getElementById("b-copy-result");
    var saveHint = document.getElementById("b-copy-save-hint");
    if (genBtn && resultEl) {
      genBtn.addEventListener("click", function () {
        var topic = (topicEl && topicEl.value ? topicEl.value : "").trim();
        var pickedTexts = (window.kykwGetPickedMlibLabels && window.kykwGetPickedMlibLabels("copy", "text")) || [];
        var pickedImages = (window.kykwGetPickedMlibLabels && window.kykwGetPickedMlibLabels("copy", "image")) || [];
        if (!topic) {
          if (typeof window.showPromoteToast === "function") {
            window.showPromoteToast("\u8bf7\u5148\u586b\u5199\u4e3b\u9898\u63cf\u8ff0");
          } else {
            window.alert("\u8bf7\u5148\u586b\u5199\u4e3b\u9898\u63cf\u8ff0");
          }
          if (topicEl) topicEl.focus();
          return;
        }
        var scene = copyLibSceneKey();
        var tone = copyLibToneKey();
        var len = copyLibLenKey();
        resultEl.value = buildCopyText(scene, topic, tone, len, {
          texts: pickedTexts,
          images: pickedImages,
        });
        lastShareImages = [];
        var imgWrap = document.getElementById("b-copy-images-wrap");
        var imgHost = document.getElementById("b-copy-images");
        if (imgHost) imgHost.innerHTML = "";
        if (imgWrap) imgWrap.style.display = "none";
        if (saveHint) saveHint.style.display = "none";
      });
    }
    if (imgGenBtn && resultEl) {
      imgGenBtn.addEventListener("click", function () {
        var body = (resultEl.value || "").trim();
        if (!body) {
          if (typeof window.showPromoteToast === "function") {
            window.showPromoteToast("请先生成文库或填写正文，再生成配图");
          } else {
            window.alert("请先生成文库或填写正文，再生成配图");
          }
          resultEl.focus();
          return;
        }
        var topic = (topicEl && topicEl.value ? topicEl.value : "").trim();
        var pickedImages =
          (window.kykwGetPickedMlibLabels && window.kykwGetPickedMlibLabels("copy", "image")) || [];
        var scene = copyLibSceneKey();
        var tone = copyLibToneKey();
        renderShareImages(
          buildShareImageSpecs(topic, scene, tone, pickedImages, body)
        );
        if (saveHint) saveHint.style.display = "none";
      });
    }
    if (saveBtn) {
      saveBtn.addEventListener("click", function () {
        if (typeof window.kykwShareLibraryGo === "function") {
          window.kykwShareLibraryGo("copy");
        } else {
          window.goScreen("b-share-library");
        }
      });
    }
    (function initCopyImageLightbox() {
      var lb = document.getElementById("b-copy-img-lightbox");
      if (!lb) return;
      var bd = lb.querySelector(".b-copy-lightbox__backdrop");
      var cl = lb.querySelector(".b-copy-lightbox__close");
      if (bd) {
        bd.addEventListener("click", function () {
          closeCopyImageLightbox();
        });
      }
      if (cl) {
        cl.addEventListener("click", function () {
          closeCopyImageLightbox();
        });
      }
      document.addEventListener("click", function (e) {
        var card = e.target.closest(".b-copy-gen-img--thumb");
        if (!card || !card.dataset.spec) return;
        e.preventDefault();
        try {
          openCopyImageLightbox(JSON.parse(decodeURIComponent(card.dataset.spec)));
        } catch (err1) {}
      });
      document.addEventListener("keydown", function (e) {
        var open = lb.classList.contains("is-open");
        if (open && e.key === "Escape") {
          closeCopyImageLightbox();
          return;
        }
        if (e.key !== "Enter" && e.key !== " ") return;
        var card = e.target.closest(".b-copy-gen-img--thumb");
        if (!card || !card.dataset.spec) return;
        e.preventDefault();
        try {
          openCopyImageLightbox(JSON.parse(decodeURIComponent(card.dataset.spec)));
        } catch (err2) {}
      });
    })();

    var seedBtn = document.getElementById("b-copy-lib-seed");
    if (seedBtn) {
      seedBtn.addEventListener("click", function () {
        var ts = Date.now();
        var arr = window.kykwCopyLibraryRead();
        arr.unshift(
          {
            id: "demo-copy-" + ts + "-1",
            scene: "moments",
            tone: "lively",
            len: "medium",
            title: "湖畔小厨 · 周末聚餐种草",
            body:
              "周末和爸妈来这家，环境舒服不吵，招牌菜上桌热气腾腾～\n" +
              "朋友说下次生日也订这儿✨ #湖州美食 #家庭聚餐",
            shareImages: buildShareImageSpecs("湖畔小厨", "moments", "lively"),
            inSharePool: true,
            shareAudit: "approved",
            createdAt: ts - 7200000,
          },
          {
            id: "demo-copy-" + ts + "-2",
            scene: "xhs",
            tone: "literary",
            len: "long",
            title: "小红书 · 出片攻略",
            body:
              "二楼靠窗光线绝了，下午四点柔光超好拍。\n" +
              "穿搭建议浅色系，和木色桌椅很搭～ #氛围感餐厅 #拍照姿势",
            shareImages: buildShareImageSpecs("出片攻略", "xhs", "literary"),
            inSharePool: true,
            shareAudit: "pending",
            createdAt: ts - 3600000,
          }
        );
        window.kykwCopyLibraryWrite(arr);
        window.kykwRenderCopyLibrary();
      });
    }

    var copyDemoAp = document.getElementById("b-copy-lib-demo-approve");
    if (copyDemoAp) {
      copyDemoAp.addEventListener("click", function () {
        var arr = window.kykwCopyLibraryRead();
        var n = 0;
        arr.forEach(function (x) {
          if (x.inSharePool && x.shareAudit === "pending") {
            x.shareAudit = "approved";
            n++;
          }
        });
        window.kykwCopyLibraryWrite(arr);
        window.kykwRenderCopyLibrary();
        if (typeof window.showPromoteToast === "function") {
          window.showPromoteToast("演示：已通过 " + n + " 条待审文案");
        }
      });
    }
  })();

  /** 海报分享库 + 分享库（视频/文案/海报）Tab */
  (function kykwPosterLibraryShareLibInit() {
    var POSTER_KEY = "kykw_poster_library";

    function escapeAttr(s) {
      return String(s).replace(/"/g, "&quot;");
    }

    function normalizePosterItem(x) {
      if (typeof x.deleted !== "boolean") x.deleted = false;
      if (typeof x.inSharePool !== "boolean") x.inSharePool = false;
      if (!x.shareAudit) x.shareAudit = x.inSharePool ? "pending" : "none";
      return x;
    }

    window.kykwPosterLibraryRead = function () {
      try {
        var raw = localStorage.getItem(POSTER_KEY);
        var arr = raw ? JSON.parse(raw) : [];
        if (!Array.isArray(arr)) return [];
        arr.forEach(normalizePosterItem);
        return arr;
      } catch (e) {
        return [];
      }
    };

    window.kykwPosterLibraryWrite = function (arr) {
      try {
        localStorage.setItem(POSTER_KEY, JSON.stringify(arr));
      } catch (e) {}
    };

    window.kykwPosterLibraryShareable = function () {
      return window.kykwPosterLibraryRead().filter(function (x) {
        return !x.deleted && x.inSharePool && x.shareAudit === "approved";
      });
    };

    function posterLibListScopeKey() {
      var act = document.querySelector("#b-share-lib-detail-poster .b-poster-lib-scope-filter.active");
      var v = act && act.getAttribute("data-poster-lib-scope");
      if (v === "audit_pending" || v === "share_approved") return v;
      return "all";
    }

    window.kykwRenderPosterLibrary = function () {
      var listEl = document.getElementById("b-poster-lib-list");
      var emptyEl = document.getElementById("b-poster-lib-empty");
      if (!listEl) return;
      var scope = posterLibListScopeKey();
      var base = window.kykwPosterLibraryRead().filter(function (x) {
        return !x.deleted;
      });
      var items = base;
      if (scope === "audit_pending") {
        items = base.filter(function (x) {
          return x.inSharePool && x.shareAudit === "pending";
        });
      } else if (scope === "share_approved") {
        items = base.filter(function (x) {
          return x.inSharePool && x.shareAudit === "approved";
        });
      }
      listEl.innerHTML = "";
      if (!items.length) {
        if (emptyEl) {
          emptyEl.style.display = "block";
          if (scope === "audit_pending") {
            emptyEl.textContent =
              "暂无审核中海报。保存时勾选「申请加入分享菜单」后将进入审核，或切换到「所有」查看。";
          } else if (scope === "share_approved") {
            emptyEl.textContent =
              "暂无分享已审海报。待平台审核通过后将显示于此，也可使用下方演示按钮通过待审项。";
          } else {
            emptyEl.textContent =
              "暂无海报。请先在「一键生成推广海报」中生成并保存，或点击下方插入演示数据。";
          }
        }
        return;
      }
      if (emptyEl) emptyEl.style.display = "none";

      if (!listEl._kykwPosterDeleg) {
        listEl._kykwPosterDeleg = true;
        listEl.addEventListener("change", function (e) {
          var t = e.target;
          if (!t.classList || !t.classList.contains("b-poster-share-cb")) return;
          var pid = t.getAttribute("data-poster-id");
          var arr = window.kykwPosterLibraryRead();
          var found = arr.filter(function (x) {
            return String(x.id) === String(pid);
          })[0];
          if (found && !found.deleted) {
            found.inSharePool = !!t.checked;
            found.shareAudit = found.inSharePool ? "pending" : "none";
            window.kykwPosterLibraryWrite(arr);
            window.kykwRenderPosterLibrary();
          }
        });
        listEl.addEventListener("click", function (e) {
          var delBtn = e.target.closest(".b-poster-lib-del");
          if (!delBtn) return;
          var pid = delBtn.getAttribute("data-poster-id");
          var arr = window.kykwPosterLibraryRead();
          var found = arr.filter(function (x) {
            return String(x.id) === String(pid);
          })[0];
          if (found) {
            found.deleted = true;
            window.kykwPosterLibraryWrite(arr);
            window.kykwRenderPosterLibrary();
          }
        });
      }

      items.forEach(function (item) {
        var snap = item.snap || {};
        var li = document.createElement("li");
        li.className = "b-vpool-item b-poster-lib-item";
        var d = new Date(item.createdAt);
        var ds = !isNaN(d.getTime()) ? d.toLocaleString() : "";

        var auditLab = "";
        if (item.inSharePool) {
          if (item.shareAudit === "approved") auditLab = "分享·已通过";
          else if (item.shareAudit === "pending") auditLab = "分享·审核中";
          else if (item.shareAudit === "rejected") auditLab = "分享·未通过";
          else auditLab = "分享";
        }

        var ratioTxt = snap.ratioRaw ? String(snap.ratioRaw).replace(/-/g, ":") : "—";
        var meta =
          (snap.sceneLabel || "") +
          (snap.styleKey ? " · " + snap.styleKey : "") +
          " · " +
          ratioTxt;

        li.innerHTML =
          '<div class="b-vpool-item__thumb" aria-hidden="true">🖼</div>' +
          '<div class="b-vpool-item__body">' +
          '<p class="b-vpool-item__title"></p>' +
          '<div class="b-vpool-item__badges"></div>' +
          '<p class="b-vpool-item__meta"></p>' +
          '<p class="b-vpool-item__time"></p></div>' +
          '<div class="b-vpool-item__side"></div>';

        li.querySelector(".b-vpool-item__title").textContent = snap.title || "未命名海报";
        li.querySelector(".b-vpool-item__meta").textContent = meta;
        li.querySelector(".b-vpool-item__time").textContent = ds ? "保存于 " + ds : "";

        var badges = li.querySelector(".b-vpool-item__badges");
        if (auditLab) {
          var sp = document.createElement("span");
          sp.className = "b-vpool-item__badge";
          sp.textContent = auditLab;
          badges.appendChild(sp);
        }

        var side = li.querySelector(".b-vpool-item__side");
        var shareHtml =
          '<label class="b-vpool-item__share"><input type="checkbox" class="b-poster-share-cb" />分享菜单</label>';
        var delHtml =
          '<button type="button" class="btn btn-secondary b-poster-lib-del" data-poster-id="' +
          escapeAttr(String(item.id)) +
          '">删除</button>';
        side.innerHTML =
          '<div class="b-vpool-item__actions">' + shareHtml + delHtml + "</div>";
        var cb = side.querySelector(".b-poster-share-cb");
        if (cb) {
          cb.setAttribute("data-poster-id", String(item.id));
          cb.checked = !!item.inSharePool;
        }

        listEl.appendChild(li);
      });
    };

    var posterDemoAp = document.getElementById("b-poster-lib-demo-approve");
    if (posterDemoAp) {
      posterDemoAp.addEventListener("click", function () {
        var arr = window.kykwPosterLibraryRead();
        var n = 0;
        arr.forEach(function (x) {
          if (x.inSharePool && x.shareAudit === "pending" && !x.deleted) {
            x.shareAudit = "approved";
            n++;
          }
        });
        window.kykwPosterLibraryWrite(arr);
        window.kykwRenderPosterLibrary();
        if (typeof window.showPromoteToast === "function") {
          window.showPromoteToast("演示：已通过 " + n + " 条待审海报");
        }
      });
    }

    var posterSeed = document.getElementById("b-poster-lib-seed");
    if (posterSeed) {
      posterSeed.addEventListener("click", function () {
        var ts = Date.now();
        var arr = window.kykwPosterLibraryRead();
        arr.unshift(
          {
            id: "demo-poster-" + ts + "-1",
            createdAt: ts - 7200000,
            deleted: false,
            inSharePool: true,
            shareAudit: "approved",
            snap: {
              sceneKey: "moments",
              sceneLabel: "朋友圈 / 私域",
              title: "湖畔小厨 · 周末专享",
              sub: "招牌醉虾第二份半价",
              promo: "小程序下单立减",
              brand: "麟云开物演示",
              styleKey: "warm",
              ratioRaw: "3-4",
              ratioClass: "34",
            },
          },
          {
            id: "demo-poster-" + ts + "-2",
            createdAt: ts - 1800000,
            deleted: false,
            inSharePool: true,
            shareAudit: "pending",
            snap: {
              sceneKey: "store",
              sceneLabel: "门店电视 / 易拉宝",
              title: "新店开业迎宾",
              sub: "",
              promo: "到店报暗号有礼",
              brand: "",
              styleKey: "bold",
              ratioRaw: "16-9",
              ratioClass: "169",
            },
          }
        );
        window.kykwPosterLibraryWrite(arr);
        window.kykwRenderPosterLibrary();
      });
    }

    function shareLibSetNavTitle(text) {
      var el = document.getElementById("b-share-lib-nav-title");
      if (el) el.textContent = text || "分享库";
    }

    window.kykwShareLibraryShowHome = function () {
      var home = document.getElementById("b-share-lib-home");
      var dv = document.getElementById("b-share-lib-detail-video");
      var dc = document.getElementById("b-share-lib-detail-copy");
      var dp = document.getElementById("b-share-lib-detail-poster");
      if (home) home.hidden = false;
      if (dv) dv.hidden = true;
      if (dc) dc.hidden = true;
      if (dp) dp.hidden = true;
      shareLibSetNavTitle("分享库");
    };

    window.kykwShareLibraryOpenSection = function (name) {
      if (name !== "video" && name !== "copy" && name !== "poster") return;
      var home = document.getElementById("b-share-lib-home");
      var dv = document.getElementById("b-share-lib-detail-video");
      var dc = document.getElementById("b-share-lib-detail-copy");
      var dp = document.getElementById("b-share-lib-detail-poster");
      if (home) home.hidden = true;
      if (dv) dv.hidden = name !== "video";
      if (dc) dc.hidden = name !== "copy";
      if (dp) dp.hidden = name !== "poster";
      var titles = { video: "视频库", copy: "文案库", poster: "海报库" };
      shareLibSetNavTitle(titles[name] || "分享库");
      if (name === "video" && typeof window.kykwRenderVideoPoolList === "function") {
        window.kykwRenderVideoPoolList();
      }
      if (name === "copy" && typeof window.kykwRenderCopyLibrary === "function") {
        window.kykwRenderCopyLibrary();
      }
      if (name === "poster" && typeof window.kykwRenderPosterLibrary === "function") {
        window.kykwRenderPosterLibrary();
      }
    };

    window.kykwShareLibraryNavBack = function () {
      var home = document.getElementById("b-share-lib-home");
      if (home && !home.hidden) {
        window.goScreen("b-ai-home");
      } else {
        window.kykwShareLibraryShowHome();
      }
    };

    window.kykwShareLibraryOnEnter = function () {
      var tab = window.kykwShareLibraryPendingTab;
      window.kykwShareLibraryPendingTab = null;
      if (tab === "video" || tab === "copy" || tab === "poster") {
        window.kykwShareLibraryOpenSection(tab);
      } else {
        window.kykwShareLibraryShowHome();
      }
    };

    document.querySelectorAll("#b-share-lib-detail-copy .b-copy-lib-scope-filter").forEach(function (btn) {
      btn.addEventListener("click", function () {
        document.querySelectorAll("#b-share-lib-detail-copy .b-copy-lib-scope-filter").forEach(function (b) {
          b.classList.remove("active");
        });
        btn.classList.add("active");
        if (typeof window.kykwRenderCopyLibrary === "function") {
          window.kykwRenderCopyLibrary();
        }
      });
    });

    document.querySelectorAll("#b-share-lib-detail-poster .b-poster-lib-scope-filter").forEach(function (btn) {
      btn.addEventListener("click", function () {
        document.querySelectorAll("#b-share-lib-detail-poster .b-poster-lib-scope-filter").forEach(function (b) {
          b.classList.remove("active");
        });
        btn.classList.add("active");
        if (typeof window.kykwRenderPosterLibrary === "function") {
          window.kykwRenderPosterLibrary();
        }
      });
    });
  })();

  (function kykwCopyPosterPresetsInit() {
    var COPY_PRESETS = {
      "moments-lively-short": {
        preview: "场景：朋友圈；风格：活泼种草；篇幅：短篇。适合轻快一句种草与话题标签。",
        scene: "moments",
        tone: "lively",
        len: "short",
        topic: "周末聚餐 · 招牌菜闭眼入",
      },
      "xhs-literary-long": {
        preview: "场景：小红书；风格：文艺治愈；篇幅：完整。适合笔记体、氛围描写与话题组合。",
        scene: "xhs",
        tone: "literary",
        len: "long",
        topic: "湖州这家小馆的氛围感拍照点位",
      },
      "douyin-promo-short": {
        preview: "场景：抖音配文；风格：促销紧迫；篇幅：短篇。适合强口令与紧迫语气。",
        scene: "douyin",
        tone: "promo",
        len: "short",
        topic: "限时福利 · 今日下单立减",
      },
    };
    function activateCopyOption(selector, attr, value) {
      var el = document.querySelector(selector + "[" + attr + '="' + value + '"]');
      if (!el) return;
      document.querySelectorAll(selector).forEach(function (b) {
        b.classList.remove("active");
      });
      el.classList.add("active");
    }
    var hub = document.getElementById("b-share-copy-hub");
    if (hub) {
      hub.addEventListener("click", function (e) {
        var prev = e.target.closest(".b-copy-preset-preview");
        var use = e.target.closest(".b-copy-preset-use");
        var btn = prev || use;
        if (!btn) return;
        var id = btn.getAttribute("data-copy-preset");
        if (!id || !COPY_PRESETS[id]) return;
        if (prev) {
          if (typeof window.showPromoteToast === "function") {
            window.showPromoteToast(COPY_PRESETS[id].preview);
          }
          return;
        }
        var p = COPY_PRESETS[id];
        activateCopyOption(".b-copy-scene", "data-copy-scene", p.scene);
        activateCopyOption(".b-copy-tone", "data-copy-tone", p.tone);
        activateCopyOption(".b-copy-len", "data-copy-len", p.len);
        var topic = document.getElementById("b-copy-topic");
        if (topic) topic.value = p.topic;
        var tile = use.closest(".m-vg-ltile");
        if (tile && hub) {
          hub.querySelectorAll(".m-vg-ltile--picked").forEach(function (x) {
            x.classList.remove("m-vg-ltile--picked");
          });
          tile.classList.add("m-vg-ltile--picked");
        }
        if (typeof window.showPromoteToast === "function") {
          window.showPromoteToast("已选用模板，可点「开始创作」进入表单，再「AI 生成」产出正文");
        }
      });
    }

    var POSTER_PRESETS = {
      "tv-warm": {
        preview: "门店电视竖屏：温馨餐饮风，主标题突出单品，副文案强调本味与新鲜。",
        scene: "store",
        style: "warm",
        ratio: "3-4",
        title: "招牌醉虾 · 当日活虾限量",
        sub: "花雕入味 · 鲜甜暖胃",
        promo: "晚市 17:30 前到店优先安排座位",
      },
      "moments-bold": {
        preview: "朋友圈方图：撞色大促风，适合满减与活动引爆。",
        scene: "moments",
        style: "bold",
        ratio: "1-1",
        title: "第二份半价 · 周末开抢",
        sub: "湖畔小厨 · 江浙本味",
        promo: "戳小程序下单 · 名额有限",
      },
      "platform-lite": {
        preview: "平台活动横版头图：极简高级，适合品牌主场与站内资源位。",
        scene: "platform",
        style: "lite",
        ratio: "16-9",
        title: "春日限定 · 轻养一味",
        sub: "少油少盐不寡淡",
        promo: "活动规则以平台公示为准",
      },
    };
    function activatePosterStyle(val) {
      document.querySelectorAll(".b-poster-style").forEach(function (b) {
        b.classList.remove("active");
      });
      var el = document.querySelector('.b-poster-style[data-poster-style="' + val + '"]');
      if (el) el.classList.add("active");
    }
    function activatePosterRatio(val) {
      document.querySelectorAll(".b-poster-ratio").forEach(function (b) {
        b.classList.remove("active");
      });
      var el = document.querySelector('.b-poster-ratio[data-poster-ratio="' + val + '"]');
      if (el) el.classList.add("active");
    }
    var posterScreen = document.getElementById("b-poster-gen");
    if (posterScreen) {
      posterScreen.addEventListener("click", function (e) {
        var prev = e.target.closest(".b-poster-preset-preview");
        var use = e.target.closest(".b-poster-preset-use");
        var btn = prev || use;
        if (!btn) return;
        var id = btn.getAttribute("data-poster-preset");
        if (!id || !POSTER_PRESETS[id]) return;
        if (prev) {
          if (typeof window.showPromoteToast === "function") {
            window.showPromoteToast(POSTER_PRESETS[id].preview);
          }
          return;
        }
        var p = POSTER_PRESETS[id];
        var sc = document.getElementById("b-poster-scene");
        if (sc) sc.value = p.scene;
        activatePosterStyle(p.style);
        activatePosterRatio(p.ratio);
        var t = document.getElementById("b-poster-title");
        var su = document.getElementById("b-poster-sub");
        var pr = document.getElementById("b-poster-promo");
        if (t) t.value = p.title;
        if (su) su.value = p.sub;
        if (pr) pr.value = p.promo;
        var ptile = use.closest(".m-vg-ltile");
        if (ptile && posterScreen) {
          posterScreen.querySelectorAll(".m-vg-ltile--picked").forEach(function (x) {
            x.classList.remove("m-vg-ltile--picked");
          });
          ptile.classList.add("m-vg-ltile--picked");
        }
        if (typeof window.showPromoteToast === "function") {
          window.showPromoteToast("已选用模板，可点「开始创作」进入表单后，再「一键生成海报」预览");
        }
      });
    }

    window.kykwCopyResetToFirstOptions = function () {
      activateCopyOption(".b-copy-scene", "data-copy-scene", "moments");
      activateCopyOption(".b-copy-tone", "data-copy-tone", "lively");
      activateCopyOption(".b-copy-len", "data-copy-len", "short");
      var topic = document.getElementById("b-copy-topic");
      if (topic) topic.value = "";
    };
    window.kykwPosterResetToFirstOptions = function () {
      var sc = document.getElementById("b-poster-scene");
      if (sc) sc.selectedIndex = 0;
      activatePosterStyle("warm");
      activatePosterRatio("3-4");
      var t = document.getElementById("b-poster-title");
      var su = document.getElementById("b-poster-sub");
      var pr = document.getElementById("b-poster-promo");
      var br = document.getElementById("b-poster-brand");
      if (t) t.value = "";
      if (su) su.value = "";
      if (pr) pr.value = "";
      if (br) br.value = "";
    };
  })();

  (function kykwCopyPosterLandingNavInit() {
    window.kykwCopyHubResetLanding = function () {
      document.querySelectorAll("#b-copy-landing .m-vg-ltile--picked").forEach(function (el) {
        el.classList.remove("m-vg-ltile--picked");
      });
    };
    window.kykwCopyWorkOnEnter = function () {
      var picked = document.querySelector("#b-copy-landing .m-vg-ltile--picked");
      var line = document.getElementById("b-copy-summary-line");
      var sub = document.getElementById("b-copy-summary-sub");
      if (typeof window.kykwRenderCopyPickedMlib === "function") window.kykwRenderCopyPickedMlib();
      if (!picked && typeof window.kykwCopyResetToFirstOptions === "function") {
        window.kykwCopyResetToFirstOptions();
      }
      if (line) {
        if (picked) {
          var nm = picked.querySelector(".m-vg-ltile__name");
          line.textContent = "当前模板：" + (nm ? nm.textContent.trim() : "已选用");
        } else {
          line.textContent = "当前模板：未选用";
        }
      }
      if (sub) {
        sub.textContent = picked
          ? "模板选用见上方；请填写主题描述，再按需微调场景、风格与篇幅，点击「AI 生成」。"
          : "模板选用见上方（未选用时为默认）；请先填写主题描述；各组默认已选第一项（朋友圈 · 活泼种草 · 短篇），可再调整。";
      }
    };
    var bCopyStart = document.getElementById("b-copy-btn-start-create");
    if (bCopyStart && !bCopyStart.getAttribute("data-bound")) {
      bCopyStart.setAttribute("data-bound", "1");
      bCopyStart.addEventListener("click", function () {
        window.goScreen("b-share-copy-work");
      });
    }

    window.kykwPosterHubResetLanding = function () {
      document.querySelectorAll("#b-poster-landing .m-vg-ltile--picked").forEach(function (el) {
        el.classList.remove("m-vg-ltile--picked");
      });
    };
    window.kykwPosterWorkOnEnter = function () {
      var picked = document.querySelector("#b-poster-landing .m-vg-ltile--picked");
      var line = document.getElementById("b-poster-summary-line");
      var sub = document.getElementById("b-poster-summary-sub");
      if (typeof window.kykwRenderPosterPickedMlib === "function") window.kykwRenderPosterPickedMlib();
      if (!picked && typeof window.kykwPosterResetToFirstOptions === "function") {
        window.kykwPosterResetToFirstOptions();
      }
      if (line) {
        if (picked) {
          var nm = picked.querySelector(".m-vg-ltile__name");
          line.textContent = "当前模板：" + (nm ? nm.textContent.trim() : "已选用");
        } else {
          line.textContent = "当前模板：未选用";
        }
      }
      if (sub) {
        sub.textContent = picked
          ? "可在下方微调版式与文案后，点击「一键生成海报」。"
          : "已默认：第一项使用场景、温馨餐饮风、3:4 竖版；标题等请自行填写。";
      }
    };
    var bPosterStart = document.getElementById("b-poster-btn-start-create");
    if (bPosterStart && !bPosterStart.getAttribute("data-bound")) {
      bPosterStart.setAttribute("data-bound", "1");
      bPosterStart.addEventListener("click", function () {
        window.goScreen("b-poster-work");
      });
    }
  })();

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
      sessionStorage.removeItem("kykw_c_video_restore_result");
    } catch (e) {}
  };

  /** 发视频 / 点评打卡 → 上传转发凭证页 */
  window.goToForwardProof = function (source) {
    try {
      sessionStorage.setItem("kykw_forward_from", source);
      if (source === "video") sessionStorage.setItem("kykw_c_video_restore_result", "1");
    } catch (e) {}
    navigateTo("c-forward-proof");
  };

  window.forwardProofBack = function () {
    var from = "promote";
    try {
      from = sessionStorage.getItem("kykw_forward_from") || "promote";
      sessionStorage.removeItem("kykw_forward_from");
    } catch (e) {}
    if (from === "checkin") {
      try {
        sessionStorage.setItem("kykw_skip_checkin_reset_once", "1");
      } catch (e2) {}
      navigateTo("c-checkin");
    } else if (from === "video") {
      navigateTo("c-video");
    } else {
      navigateTo("c-promote");
    }
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

  /** 全局演示 Toast（素材库 / 推广中心等）；优先挂载在机框内，避免非当前屏内元素不可见 */
  var promoteToastEl = document.getElementById("promote-toast");
  var appDemoToastEl = document.getElementById("app-demo-toast");
  var promoteToastTimer = null;
  window.showPromoteToast = function (msg) {
    var el = appDemoToastEl || promoteToastEl;
    if (!el || !msg) return;
    el.textContent = msg;
    el.hidden = false;
    if (promoteToastTimer) clearTimeout(promoteToastTimer);
    promoteToastTimer = setTimeout(function () {
      el.hidden = true;
    }, 2600);
  };

  /* —— 用户推广中心 · 商家配置（localStorage）—— */
  var KYKW_PROMOTE_ENTRY_STORAGE = "kykw_promote_entry_config_v1";
  var KYKW_PROMOTE_SCHEMA = [
    {
      sectionId: "matrix",
      title: "宣传矩阵",
      items: [
        {
          key: "matrix-wechat",
          label: "加微信",
          defaultToast: "演示：弹出商家微信 / 企微二维码，支持长按识别",
        },
        {
          key: "matrix-moments",
          label: "发朋友圈",
          defaultToast: "演示：生成朋友圈文案+配图，跳转微信分享",
        },
        {
          key: "matrix-channels",
          label: "发视频号",
          defaultToast: "演示：打开发布页，上传本店视频素材至视频号",
        },
        { key: "matrix-douyin", label: "发抖音", defaultToast: "", action: "c-video" },
        { key: "matrix-xhs", label: "发小红书", defaultToast: "", action: "c-video" },
        { key: "matrix-kuaishou", label: "发快手", defaultToast: "", action: "c-video" },
      ],
    },
    {
      sectionId: "follow",
      title: "关注账号",
      items: [
        { key: "follow-douyin", label: "抖音", defaultToast: "演示：跳转抖音号主页关注" },
        { key: "follow-kuaishou", label: "快手", defaultToast: "演示：跳转快手号主页关注" },
        { key: "follow-xhs", label: "小红书", defaultToast: "演示：跳转小红书账号关注" },
        {
          key: "follow-dianping",
          label: "大众点评",
          defaultToast: "演示：打开大众点评门店主页关注 / 收藏",
        },
      ],
    },
    {
      sectionId: "wifi",
      title: "WiFi 连接",
      items: [
        {
          key: "wifi-main",
          label: "门店 WiFi 卡片",
          wifi: true,
          defaultToast: "演示：显示门店 WiFi 名称与密码，或一键连接（系统能力）",
          wifiDefaults: {
            wifiTitle: "连接门店 WiFi",
            wifiSub: "LYKW-Guest · 点击获取密码",
            wifiSsid: "LYKW-Guest",
            wifiPassword: "88888888",
          },
        },
      ],
    },
    {
      sectionId: "review",
      title: "点评打卡",
      items: [
        { key: "review-xhs", label: "小红书笔记", defaultToast: "", action: "c-checkin" },
        { key: "review-dianping", label: "大众点评", defaultToast: "", action: "c-checkin" },
        { key: "review-douyin", label: "抖音点评", defaultToast: "", action: "c-checkin" },
        { key: "review-gaode", label: "高德点评", defaultToast: "", action: "c-checkin" },
        { key: "review-meituan", label: "美团点评", defaultToast: "", action: "c-checkin" },
        { key: "review-ctrip", label: "携程点评", defaultToast: "", action: "c-checkin" },
        {
          key: "review-gzh",
          label: "发公众号",
          defaultToast: "演示：选用门店图文素材，跳转公众号后台或助手发表",
        },
      ],
    },
    {
      sectionId: "tuangou",
      title: "商家团购",
      items: [
        {
          key: "tg-meituan",
          label: "美团",
          defaultToast: "演示：打开美团团购页 / 复制套餐链接",
        },
        {
          key: "tg-dianping",
          label: "大众点评",
          defaultToast: "演示：打开大众点评门店团购",
        },
        {
          key: "tg-douyin",
          label: "抖音团购",
          defaultToast: "演示：打开抖音团购详情 / 核销入口",
        },
      ],
    },
  ];

  function kykwPromoteEntryReadRaw() {
    try {
      var t = localStorage.getItem(KYKW_PROMOTE_ENTRY_STORAGE);
      return t ? JSON.parse(t) : null;
    } catch (e) {
      return null;
    }
  }

  function kykwPromoteEntryMergeDefaults(raw) {
    raw = raw || {};
    var out = { sections: {}, items: {} };
    KYKW_PROMOTE_SCHEMA.forEach(function (sec) {
      var sv = raw.sections && raw.sections[sec.sectionId];
      out.sections[sec.sectionId] = sv !== false;
      sec.items.forEach(function (it) {
        var ri = raw.items && raw.items[it.key] ? raw.items[it.key] : {};
        var item = {
          show: ri.show !== false,
          url: String(ri.url || "").trim(),
          hint: String(ri.hint || "").trim(),
        };
        if (it.wifi) {
          var wd = it.wifiDefaults || {};
          item.wifiTitle = ri.wifiTitle != null && ri.wifiTitle !== "" ? String(ri.wifiTitle) : wd.wifiTitle || "";
          item.wifiSub = ri.wifiSub != null && ri.wifiSub !== "" ? String(ri.wifiSub) : wd.wifiSub || "";
          item.wifiSsid = ri.wifiSsid != null && ri.wifiSsid !== "" ? String(ri.wifiSsid) : wd.wifiSsid || "";
          item.wifiPassword =
            ri.wifiPassword != null && ri.wifiPassword !== ""
              ? String(ri.wifiPassword)
              : wd.wifiPassword || "";
        }
        out.items[it.key] = item;
      });
    });
    return out;
  }

  function kykwPromoteEntryGetMerged() {
    return kykwPromoteEntryMergeDefaults(kykwPromoteEntryReadRaw());
  }

  var PEC_TILE_UI = {
    "matrix-wechat": { kind: "video", brand: "wechat", glyph: "微" },
    "matrix-moments": { kind: "video", brand: "moments", glyph: "圈" },
    "matrix-channels": { kind: "video", brand: "channels", glyph: "▶" },
    "matrix-douyin": { kind: "video", brand: "douyin", glyph: "♪" },
    "matrix-xhs": { kind: "video", brand: "xhs", glyph: "红" },
    "matrix-kuaishou": { kind: "video", brand: "kuaishou", glyph: "快" },
    "follow-douyin": { kind: "video", brand: "douyin", glyph: "抖" },
    "follow-kuaishou": { kind: "video", brand: "kuaishou", glyph: "快" },
    "follow-xhs": { kind: "video", brand: "xhs", glyph: "红" },
    "follow-dianping": { kind: "video", brand: "dianping-lg", glyph: "点" },
    "wifi-main": { kind: "wifi" },
    "review-xhs": { kind: "review", sm: "xhs", glyph: "书" },
    "review-dianping": { kind: "review", sm: "dianping", glyph: "评" },
    "review-douyin": { kind: "review", sm: "douyin", glyph: "抖" },
    "review-gaode": { kind: "review", sm: "gaode", glyph: "德" },
    "review-meituan": { kind: "review", sm: "meituan", glyph: "美" },
    "review-ctrip": { kind: "review", sm: "ctrip", glyph: "程" },
    "review-gzh": { kind: "review", sm: "gzh", glyph: "公" },
    "tg-meituan": { kind: "video", brand: "meituan-lg", glyph: "美" },
    "tg-dianping": { kind: "video", brand: "dianping-lg", glyph: "点" },
    "tg-douyin": { kind: "video", brand: "douyin", glyph: "♪" },
  };

  var __pecModalKey = "";

  function pecEscape(s) {
    return String(s == null ? "" : s)
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;");
  }

  function pecFindSchemaItem(key) {
    for (var i = 0; i < KYKW_PROMOTE_SCHEMA.length; i++) {
      var sec = KYKW_PROMOTE_SCHEMA[i];
      for (var j = 0; j < sec.items.length; j++) {
        if (sec.items[j].key === key) return sec.items[j];
      }
    }
    return null;
  }

  function pecBrandSpanAttrs(key, brand) {
    if (key === "matrix-douyin" || key === "matrix-xhs") return ' aria-hidden="true"';
    return ' translate="no" aria-hidden="true"';
  }

  function pecBuildTileInner(it, ic) {
    var ui = PEC_TILE_UI[it.key];
    if (!ui) return "";
    if (ui.kind === "wifi") {
      var wd = it.wifiDefaults || {};
      var t = (ic && ic.wifiTitle) || wd.wifiTitle || "连接门店 WiFi";
      var s = (ic && ic.wifiSub) || wd.wifiSub || "";
      if (!s && ic) {
        s = ic.wifiSsid ? ic.wifiSsid + " · 点击获取密码" : "";
      }
      if (!s && wd.wifiSsid) s = wd.wifiSsid + " · 点击获取密码";
      return (
        "<span class=\"promote-wifi-ico\" aria-hidden=\"true\">\uD83D\uDCF6</span>" +
        '<span class="promote-wifi-text"><strong>' +
        pecEscape(t) +
        "</strong><small>" +
        pecEscape(s) +
        '</small></span><span class="promote-wifi-arr" aria-hidden="true">\u203A</span>'
      );
    }
    if (ui.kind === "review") {
      return (
        '<span class="promote-brand-sm promote-brand-sm--' +
        ui.sm +
        '">' +
        pecEscape(ui.glyph) +
        '</span><span class="promote-tile-label-sm">' +
        pecEscape(it.label) +
        "</span>"
      );
    }
    return (
      '<span class="promote-brand promote-brand--' +
      ui.brand +
      '"' +
      pecBrandSpanAttrs(it.key, ui.brand) +
      ">" +
      pecEscape(ui.glyph) +
      '</span><span class="promote-tile-label">' +
      pecEscape(it.label) +
      "</span>"
    );
  }

  function pecSectionGridClass(sectionId) {
    if (sectionId === "follow") return "promote-grid promote-grid--cols4";
    if (sectionId === "review") return "promote-grid promote-grid--cols3 promote-grid--review";
    return "promote-grid promote-grid--cols3";
  }

  function pecTileShellClass(it) {
    if (it.wifi) return "promote-tile promote-tile--wifi-row promote-tile--wifi-row--span3 b-pec-tile-main";
    var ui = PEC_TILE_UI[it.key];
    if (ui && ui.kind === "review") return "promote-tile promote-tile--review b-pec-tile-main";
    return "promote-tile promote-tile--video b-pec-tile-main";
  }

  window.kykwPromoteEntryApply = function () {
    var merged = kykwPromoteEntryGetMerged();
    KYKW_PROMOTE_SCHEMA.forEach(function (sec) {
      var secEl = document.getElementById("promote-sec-" + sec.sectionId);
      if (!secEl) return;
      var secOn = merged.sections[sec.sectionId];
      var anyItem = false;
      sec.items.forEach(function (it) {
        if (merged.items[it.key] && merged.items[it.key].show) anyItem = true;
      });
      secEl.hidden = !secOn || !anyItem;
      sec.items.forEach(function (it) {
        var btn = document.querySelector('[data-promote-key="' + it.key + '"]');
        if (!btn) return;
        var ic = merged.items[it.key];
        if (!ic) return;
        if (!secOn || !ic.show) {
          btn.hidden = true;
          return;
        }
        btn.hidden = false;
        var url = ic.url || "";
        if (url) {
          btn.setAttribute("data-promote-url", url);
        } else {
          btn.removeAttribute("data-promote-url");
        }
        if (it.action && !url && !ic.hint) {
          btn.setAttribute("data-promote-action", it.action);
        } else {
          btn.removeAttribute("data-promote-action");
        }
        var toastText = ic.hint || "";
        if (!toastText && (!it.action || url)) {
          toastText = it.defaultToast || "";
        }
        if (toastText) {
          btn.setAttribute("data-promote-toast", toastText);
        } else {
          btn.removeAttribute("data-promote-toast");
        }
        if (it.wifi) {
          btn.setAttribute("data-wifi-ssid", ic.wifiSsid || "");
          btn.setAttribute("data-wifi-password", ic.wifiPassword || "");
          var tEl = document.getElementById("promote-wifi-title-line");
          var sEl = document.getElementById("promote-wifi-sub-line");
          if (tEl) tEl.textContent = ic.wifiTitle || "连接门店 WiFi";
          if (sEl) {
            sEl.textContent =
              ic.wifiSub ||
              (ic.wifiSsid ? ic.wifiSsid + " · 点击获取密码" : ic.wifiSsid || "");
          }
        } else {
          btn.removeAttribute("data-wifi-ssid");
          btn.removeAttribute("data-wifi-password");
        }
      });
    });
  };

  window.kykwPromoteEntryRenderForm = function () {
    var root = document.getElementById("b-promote-entry-config-root");
    if (!root) return;
    root.innerHTML = "";
    var merged = kykwPromoteEntryGetMerged();
    KYKW_PROMOTE_SCHEMA.forEach(function (sec) {
      var secEl = document.createElement("section");
      var secClass = "promote-section";
      if (sec.sectionId === "review") secClass += " promote-section--review";
      if (sec.sectionId === "tuangou") secClass += " promote-section--last";
      secEl.className = secClass;
      secEl.setAttribute("aria-labelledby", "b-pec-h-" + sec.sectionId);

      var head = document.createElement("div");
      head.className = "b-pec-sec-head";
      var pill = document.createElement("h2");
      pill.className = "promote-pill";
      pill.id = "b-pec-h-" + sec.sectionId;
      pill.innerHTML =
        "<span>" +
        pecEscape(sec.title) +
        '</span><span class="promote-pill-arrow" aria-hidden="true">\u203A</span>';
      var lab = document.createElement("label");
      lab.className = "b-pec-sec-toggle";
      var cbSec = document.createElement("input");
      cbSec.type = "checkbox";
      cbSec.checked = !!merged.sections[sec.sectionId];
      cbSec.setAttribute("data-pec-sec", sec.sectionId);
      lab.appendChild(cbSec);
      lab.appendChild(document.createTextNode("显示本组"));
      head.appendChild(pill);
      head.appendChild(lab);
      secEl.appendChild(head);

      var grid = document.createElement("div");
      grid.className = pecSectionGridClass(sec.sectionId);

      sec.items.forEach(function (it) {
        var ic = merged.items[it.key];
        var showing = !!(ic && ic.show);
        var wrap = document.createElement("div");
        wrap.className =
          "b-pec-tile-wrap" +
          (showing ? "" : " b-pec-tile-wrap--off") +
          (it.wifi ? " b-pec-tile-wrap--wifi-full" : "");
        wrap.setAttribute("data-pec-key", it.key);

        var tools = document.createElement("div");
        tools.className = "b-pec-tile-tools";
        var eye = document.createElement("button");
        eye.type = "button";
        eye.className = "b-pec-tile-eye" + (showing ? "" : " b-pec-tile-eye--hide");
        eye.setAttribute("aria-label", showing ? "当前显示，点击改为隐藏" : "当前隐藏，点击改为显示");
        eye.setAttribute("title", showing ? "显示" : "隐藏");
        eye.textContent = "\uD83D\uDC41";
        var ed = document.createElement("button");
        ed.type = "button";
        ed.className = "b-pec-tile-edit";
        ed.setAttribute("aria-label", "编辑此项");
        ed.setAttribute("title", "编辑");
        ed.textContent = "\u270E";
        tools.appendChild(eye);
        tools.appendChild(ed);

        var main = document.createElement("button");
        main.type = "button";
        main.className = pecTileShellClass(it);
        main.setAttribute("aria-label", "配置「" + it.label + "」");
        main.innerHTML = pecBuildTileInner(it, ic);

        wrap.appendChild(tools);
        wrap.appendChild(main);
        grid.appendChild(wrap);
      });

      secEl.appendChild(grid);
      root.appendChild(secEl);
    });
  };

  window.kykwPromoteEntryModalClose = function () {
    __pecModalKey = "";
    var m = document.getElementById("b-pec-modal");
    if (m) {
      m.hidden = true;
      m.setAttribute("aria-hidden", "true");
    }
  };

  window.kykwPromoteEntryModalOpen = function (key) {
    var it = pecFindSchemaItem(key);
    if (!it) return;
    var merged = kykwPromoteEntryGetMerged();
    var ic = merged.items[key];
    if (!ic) return;
    __pecModalKey = key;
    var title = document.getElementById("b-pec-modal-title");
    if (title) title.textContent = "编辑：" + it.label;
    var sh = document.getElementById("b-pec-modal-show");
    if (sh) sh.checked = !!ic.show;
    var u = document.getElementById("b-pec-modal-url");
    if (u) u.value = ic.url || "";
    var h = document.getElementById("b-pec-modal-hint");
    if (h) h.value = ic.hint || "";
    var wz = document.getElementById("b-pec-modal-wifi");
    if (wz) {
      if (it.wifi) {
        wz.hidden = false;
        document.getElementById("b-pec-modal-wifi-title").value = ic.wifiTitle || "";
        document.getElementById("b-pec-modal-wifi-sub").value = ic.wifiSub || "";
        document.getElementById("b-pec-modal-wifi-ssid").value = ic.wifiSsid || "";
        document.getElementById("b-pec-modal-wifi-pwd").value = ic.wifiPassword || "";
      } else {
        wz.hidden = true;
      }
    }
    var m = document.getElementById("b-pec-modal");
    if (m) {
      m.hidden = false;
      m.setAttribute("aria-hidden", "false");
    }
  };

  function kykwPromoteEntryModalSave() {
    var key = __pecModalKey;
    if (!key) return;
    var it = pecFindSchemaItem(key);
    if (!it) return;
    var merged = kykwPromoteEntryGetMerged();
    var ic = merged.items[key];
    if (!ic) return;
    var sh = document.getElementById("b-pec-modal-show");
    ic.show = !!(sh && sh.checked);
    var u = document.getElementById("b-pec-modal-url");
    ic.url = u && u.value ? u.value.trim() : "";
    var h = document.getElementById("b-pec-modal-hint");
    ic.hint = h && h.value ? h.value.trim() : "";
    if (it.wifi) {
      ic.wifiTitle = (document.getElementById("b-pec-modal-wifi-title").value || "").trim();
      ic.wifiSub = (document.getElementById("b-pec-modal-wifi-sub").value || "").trim();
      ic.wifiSsid = (document.getElementById("b-pec-modal-wifi-ssid").value || "").trim();
      ic.wifiPassword = (document.getElementById("b-pec-modal-wifi-pwd").value || "").trim();
    }
    try {
      localStorage.setItem(KYKW_PROMOTE_ENTRY_STORAGE, JSON.stringify(merged));
    } catch (e) {}
    window.kykwPromoteEntryModalClose();
    window.kykwPromoteEntryRenderForm();
    window.kykwPromoteEntryApply();
  }

  (function kykwPromoteEntryBindConfigUi() {
    var pecBody = document.getElementById("b-promote-entry-config-body");
    if (pecBody && !pecBody.getAttribute("data-pec-delegation")) {
      pecBody.setAttribute("data-pec-delegation", "1");
      pecBody.addEventListener("click", function (e) {
        var eye = e.target.closest(".b-pec-tile-eye");
        var edit = e.target.closest(".b-pec-tile-edit");
        var main = e.target.closest(".b-pec-tile-main");
        var wrap = e.target.closest(".b-pec-tile-wrap");
        var key = wrap && wrap.getAttribute("data-pec-key");
        if (eye && key) {
          e.preventDefault();
          e.stopPropagation();
          var merged = kykwPromoteEntryGetMerged();
          if (merged.items[key]) {
            merged.items[key].show = !merged.items[key].show;
            try {
              localStorage.setItem(KYKW_PROMOTE_ENTRY_STORAGE, JSON.stringify(merged));
            } catch (e2) {}
            window.kykwPromoteEntryRenderForm();
            window.kykwPromoteEntryApply();
          }
          return;
        }
        if ((edit || main) && key) {
          e.preventDefault();
          window.kykwPromoteEntryModalOpen(key);
        }
      });
    }

    var modal = document.getElementById("b-pec-modal");
    if (modal && !modal.getAttribute("data-pec-modal-bound")) {
      modal.setAttribute("data-pec-modal-bound", "1");
      modal.addEventListener("click", function (e) {
        if (e.target === modal) window.kykwPromoteEntryModalClose();
      });
    }

    var saveBtn = document.getElementById("b-pec-btn-save");
    var prevBtn = document.getElementById("b-pec-btn-preview");
    var resetBtn = document.getElementById("b-pec-btn-reset");
    var cancelBtn = document.getElementById("b-pec-modal-cancel");
    var okBtn = document.getElementById("b-pec-modal-confirm");
    if (saveBtn && !saveBtn.getAttribute("data-bound")) {
      saveBtn.setAttribute("data-bound", "1");
      saveBtn.addEventListener("click", function () {
        var merged = kykwPromoteEntryGetMerged();
        document.querySelectorAll("#b-promote-entry-config-root [data-pec-sec]").forEach(function (cb) {
          var sid = cb.getAttribute("data-pec-sec");
          if (sid) merged.sections[sid] = !!cb.checked;
        });
        try {
          localStorage.setItem(KYKW_PROMOTE_ENTRY_STORAGE, JSON.stringify(merged));
        } catch (e) {}
        window.kykwPromoteEntryApply();
        var h = document.getElementById("b-pec-save-hint");
        if (h) {
          h.style.display = "block";
          h.textContent = "已保存分组开关，用户端推广中心已同步。";
        }
      });
    }
    if (prevBtn && !prevBtn.getAttribute("data-bound")) {
      prevBtn.setAttribute("data-bound", "1");
      prevBtn.addEventListener("click", function () {
        window.kykwPromoteEntryApply();
        window.goScreen("c-promote");
      });
    }
    if (resetBtn && !resetBtn.getAttribute("data-bound")) {
      resetBtn.setAttribute("data-bound", "1");
      resetBtn.addEventListener("click", function () {
        try {
          localStorage.removeItem(KYKW_PROMOTE_ENTRY_STORAGE);
        } catch (e2) {}
        window.kykwPromoteEntryRenderForm();
        window.kykwPromoteEntryApply();
        var h = document.getElementById("b-pec-save-hint");
        if (h) {
          h.style.display = "block";
          h.textContent = "已恢复默认，并已同步到推广中心。";
        }
      });
    }
    if (cancelBtn && !cancelBtn.getAttribute("data-bound")) {
      cancelBtn.setAttribute("data-bound", "1");
      cancelBtn.addEventListener("click", function () {
        window.kykwPromoteEntryModalClose();
      });
    }
    if (okBtn && !okBtn.getAttribute("data-bound")) {
      okBtn.setAttribute("data-bound", "1");
      okBtn.addEventListener("click", kykwPromoteEntryModalSave);
    }
  })();

  var promoteSheet = document.querySelector("#c-promote .promote-sheet");
  if (promoteSheet) {
    promoteSheet.addEventListener("click", function (e) {
      var btn = e.target.closest("[data-promote-key]");
      if (!btn || btn.disabled) return;
      var url = btn.getAttribute("data-promote-url");
      if (url && url.trim()) {
        e.preventDefault();
        try {
          window.open(url.trim(), "_blank", "noopener,noreferrer");
        } catch (eOpen) {}
        if (typeof window.showPromoteToast === "function") {
          window.showPromoteToast("已打开链接（演示）");
        }
        return;
      }
      if (btn.hasAttribute("data-wifi-ssid")) {
        var ssid = btn.getAttribute("data-wifi-ssid") || "";
        var pwd = btn.getAttribute("data-wifi-password") || "";
        if (typeof window.showPromoteToast === "function") {
          window.showPromoteToast("门店 WiFi（演示）· 名称：" + ssid + " · 密码：" + pwd);
        }
        return;
      }
      var act = btn.getAttribute("data-promote-action");
      if (act) {
        e.preventDefault();
        window.goScreen(act);
        return;
      }
      var msg = btn.getAttribute("data-promote-toast");
      if (msg && typeof window.showPromoteToast === "function") {
        window.showPromoteToast(msg);
      }
    });
  }

  if (typeof window.kykwPromoteEntryApply === "function") {
    window.kykwPromoteEntryApply();
  }

  (function kykwPlatformShareAuditInit() {
    var SENSITIVE = [
      "暴力",
      "色情",
      "赌博",
      "诈骗",
      "传销",
      "第一",
      "最牛逼",
      "国家级",
      "史上最低",
      "绝对有效",
      "后悔一整年",
      "跳楼价",
      "全国首发",
      "最好",
      "独家",
      "万能",
      "根治",
      "特效药",
    ];

    var demo = [
      {
        id: "a1",
        time: "2026-03-31 14:22",
        store: "湖畔小厨（龙溪北路店）",
        title: "春日上新 · 一口鲜",
        channel: "抖音",
        copy: "今天探店发现宝藏小店，好吃不贵！全城第一好吃，不买后悔一整年，限时福利别错过。",
        status: "待审",
      },
      {
        id: "a2",
        time: "2026-03-31 13:08",
        store: "鲜达超市（城西店）",
        title: "周末囤货清单",
        channel: "视频号",
        copy: "本店生鲜当日达，包装完好，欢迎到店选购。活动说明以店内公示为准。",
        status: "待审",
      },
      {
        id: "a3",
        time: "2026-03-30 18:40",
        store: "暖居布艺馆",
        title: "客厅改造前后",
        channel: "小红书",
        copy: "软装焕新实拍，图片均为本店案例，无绝对化承诺。",
        status: "待审",
      },
    ];

    function pecEsc(t) {
      return String(t == null ? "" : t)
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;");
    }

    function findHits(text) {
      if (!text) return [];
      var raw = [];
      SENSITIVE.forEach(function (w) {
        var i = 0;
        while ((i = text.indexOf(w, i)) !== -1) {
          raw.push({ start: i, end: i + w.length });
          i += w.length;
        }
      });
      raw.sort(function (a, b) {
        return a.start - b.start || b.end - a.end;
      });
      var merged = [];
      raw.forEach(function (h) {
        if (!merged.length || merged[merged.length - 1].end < h.start) merged.push({ start: h.start, end: h.end });
        else merged[merged.length - 1].end = Math.max(merged[merged.length - 1].end, h.end);
      });
      return merged;
    }

    function highlightCopy(text, hits) {
      if (!hits || !hits.length) return pecEsc(text);
      var s = "";
      var pos = 0;
      hits.forEach(function (h) {
        s += pecEsc(text.slice(pos, h.start));
        s += '<mark class="platform-sens">' + pecEsc(text.slice(h.start, h.end)) + "</mark>";
        pos = h.end;
      });
      s += pecEsc(text.slice(pos));
      return s;
    }

    var tbody = document.getElementById("p-audit-queue-body");
    var detailEmpty = document.getElementById("p-audit-detail-empty");
    var detailContent = document.getElementById("p-audit-detail-content");
    var copyEl = document.getElementById("p-audit-copy-text");
    var riskEl = document.getElementById("p-audit-risk");
    var scanStatus = document.getElementById("p-audit-scan-status");
    var btnScan = document.getElementById("p-audit-run-scan");
    var btnPass = document.getElementById("p-audit-btn-pass");
    var btnReject = document.getElementById("p-audit-btn-reject");
    if (!tbody || !detailEmpty || !detailContent || !copyEl || !riskEl || !scanStatus || !btnScan || !btnPass || !btnReject) return;

    var selectedId = null;

    function findRow(rid) {
      for (var i = 0; i < demo.length; i++) if (demo[i].id === rid) return demo[i];
      return null;
    }

    function machineLabel(copy) {
      var n = findHits(copy).length;
      return n
        ? { label: "疑似风险 · " + n + " 处", cls: "platform-tag platform-tag--risk" }
        : { label: "词库未命中", cls: "platform-tag platform-tag--ok" };
    }

    function renderTable() {
      tbody.innerHTML = "";
      demo.forEach(function (row) {
        var tr = document.createElement("tr");
        tr.setAttribute("data-audit-id", row.id);
        tr.setAttribute("role", "button");
        tr.tabIndex = 0;
        var st = machineLabel(row.copy);
        tr.innerHTML =
          "<td>" +
          pecEsc(row.time) +
          "</td><td>" +
          pecEsc(row.store) +
          "</td><td>" +
          pecEsc(row.title) +
          '</td><td><span class="' +
          st.cls +
          '">' +
          pecEsc(st.label) +
          "</span></td><td>" +
          pecEsc(row.status) +
          "</td>";
        tbody.appendChild(tr);
      });
    }

    function runScanForRow(row) {
      var hits = findHits(row.copy);
      copyEl.innerHTML = highlightCopy(row.copy, hits);
      if (hits.length) {
        var items = hits
          .map(function (h) {
            return "<li>「" + pecEsc(row.copy.slice(h.start, h.end)) + "」</li>";
          })
          .join("");
        riskEl.innerHTML =
          '<strong class="platform-risk__title">敏感词 / 高风险营销表述（演示）</strong><ul class="platform-risk__list">' +
          items +
          '</ul><p class="platform-risk__note">原型为本地词库匹配示意；实际上线需结合模型、黑名单与白名单策略。</p>';
        riskEl.className = "platform-risk platform-risk--bad";
      } else {
        riskEl.innerHTML =
          '<p class="platform-risk__ok">演示词库未命中明显违规词；人工仍需核对是否阴阳文案、截图与视频画面。</p>';
        riskEl.className = "platform-risk platform-risk--ok";
      }
      scanStatus.textContent =
        "最近检测：" + new Date().toLocaleTimeString("zh-CN", { hour: "2-digit", minute: "2-digit", second: "2-digit" });
    }

    function selectRow(rid) {
      selectedId = rid;
      var row = findRow(rid);
      if (!row) return;
      tbody.querySelectorAll("tr").forEach(function (tr) {
        tr.classList.toggle("platform-table__row--active", tr.getAttribute("data-audit-id") === rid);
      });
      detailEmpty.hidden = true;
      detailContent.hidden = false;
      document.getElementById("p-audit-meta-store").textContent = row.store;
      document.getElementById("p-audit-meta-title").textContent = row.title;
      document.getElementById("p-audit-meta-ch").textContent = row.channel;
      document.getElementById("p-audit-meta-time").textContent = row.time;
      runScanForRow(row);
    }

    tbody.addEventListener("click", function (e) {
      var tr = e.target.closest("tr[data-audit-id]");
      if (!tr) return;
      selectRow(tr.getAttribute("data-audit-id"));
    });
    tbody.addEventListener("keydown", function (e) {
      if (e.key !== "Enter" && e.key !== " ") return;
      var tr = e.target.closest("tr[data-audit-id]");
      if (!tr) return;
      e.preventDefault();
      selectRow(tr.getAttribute("data-audit-id"));
    });

    btnScan.addEventListener("click", function () {
      var row = selectedId ? findRow(selectedId) : null;
      if (row) runScanForRow(row);
      else scanStatus.textContent = "请先点击表格中的一条待审核记录";
    });

    btnPass.addEventListener("click", function () {
      window.alert(selectedId ? "演示：已标记为合规通过，将同步用户端与商家端。" : "请先在左侧选择一条记录。");
    });
    btnReject.addEventListener("click", function () {
      window.alert(selectedId ? "演示：已驳回并记录原因，用户将收到修改文案提示。" : "请先在左侧选择一条记录。");
    });

    renderTable();
    scanStatus.textContent = "选择一条记录后即自动模拟扫描；也可点此栏旁的按钮重新检测。";
  })();

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
  var cVideoSourceLine = document.getElementById("c-video-result-source");
  var cVideoMetaLine = document.getElementById("c-video-result-meta");
  if (btnGenVideo && cVideoProgress && cVideoResult) {
    btnGenVideo.addEventListener("click", () => {
      try {
        sessionStorage.removeItem("kykw_c_video_restore_result");
      } catch (e) {}
      var pool =
        typeof window.kykwVideoPoolShareable === "function" ? window.kykwVideoPoolShareable() : [];
      var picked = pool.length ? pool[Math.floor(Math.random() * pool.length)] : null;
      try {
        sessionStorage.setItem("kykw_c_video_pick", picked ? JSON.stringify(picked) : "");
      } catch (e) {}
      if (cVideoIdle) cVideoIdle.style.display = "none";
      cVideoProgress.style.display = "block";
      cVideoResult.style.display = "none";
      setTimeout(() => {
        cVideoProgress.style.display = "none";
        cVideoResult.style.display = "block";
        var raw = sessionStorage.getItem("kykw_c_video_pick");
        if (raw && cVideoSourceLine && cVideoMetaLine) {
          try {
            var p = JSON.parse(raw);
            cVideoSourceLine.style.display = "block";
            cVideoSourceLine.textContent = "已从门店分享菜单随机选用：" + (p.title || "成片");
            cVideoMetaLine.textContent = p.summary || "预览 · 门店精选成片";
          } catch (e2) {
            if (cVideoSourceLine) cVideoSourceLine.style.display = "none";
            cVideoMetaLine.textContent = "预览 · 9:16 · 约 30 秒 · AI 合成";
          }
        } else {
          if (cVideoSourceLine) {
            cVideoSourceLine.style.display = "none";
            cVideoSourceLine.textContent = "";
          }
          if (cVideoMetaLine) cVideoMetaLine.textContent = "预览 · 9:16 · 约 30 秒 · AI 合成";
        }
      }, 1800);
    });
  }

  /** 用户端 · 打卡：图片选填，无图也可用默认配图生成文案（演示） */
  (function kykwCheckinInit() {
    var filesInput = document.getElementById("c-checkin-files");
    var btnGen = document.getElementById("c-btn-generate-checkin");
    var stepUpload = document.getElementById("c-checkin-step-upload");
    var stepGen = document.getElementById("c-checkin-step-gen");
    var genTitleEl = document.getElementById("c-checkin-gen-title");
    var cPosterResult = document.getElementById("c-poster-result");
    var thumbRow = document.getElementById("c-checkin-thumb-row");
    var chipsWrap = document.getElementById("c-checkin-chips");
    var posterWrap = document.getElementById("c-checkin-poster-wrap");
    var posterImg = document.getElementById("c-checkin-poster-img");
    var posterTitleEl = document.getElementById("c-checkin-poster-title");
    var copyTextEl = document.getElementById("c-checkin-copy-text");
    if (
      !filesInput ||
      !btnGen ||
      !stepUpload ||
      !stepGen ||
      !cPosterResult ||
      !thumbRow ||
      !chipsWrap ||
      !posterWrap ||
      !posterImg ||
      !posterTitleEl ||
      !copyTextEl
    ) {
      return;
    }

    var revokeList = [];

    var COPY_BY_STYLE = {
      grass: {
        title: "湖畔小厨｜烟火气里的一口鲜",
        copy: "「刚打卡龙溪北路这家小馆，环境舒服菜品稳，招牌醉虾值得一试～ #湖州美食 #探店」",
      },
      sale: {
        title: "湖畔小厨｜限时好味别错过",
        copy: "「新店福利多，双人套餐分量足，周末约饭可以冲！详情以门店公示为准～」",
      },
      minimal: {
        title: "湖畔小厨",
        copy: "「简单一餐，干净有味。推荐给喜欢和食的人。」",
      },
    };

    function getStyleKey() {
      var a = chipsWrap.querySelector(".chip.active[data-checkin-style]");
      return a ? a.getAttribute("data-checkin-style") : "grass";
    }

    function revokeAllUrls() {
      revokeList.forEach(function (u) {
        try {
          URL.revokeObjectURL(u);
        } catch (e) {}
      });
      revokeList = [];
    }

    function resetState() {
      revokeAllUrls();
      filesInput.value = "";
      thumbRow.innerHTML = "";
      thumbRow.hidden = true;
      stepUpload.style.display = "block";
      stepGen.style.display = "none";
      cPosterResult.style.display = "none";
      posterImg.removeAttribute("src");
      posterWrap.classList.remove("poster-mock--checkin--nophoto");
    }

    window.kykwCheckinReset = resetState;

    chipsWrap.addEventListener("click", function (e) {
      var chip = e.target.closest(".chip[data-checkin-style]");
      if (!chip) return;
      chipsWrap.querySelectorAll(".chip").forEach(function (c) {
        c.classList.remove("active");
      });
      chip.classList.add("active");
    });

    filesInput.addEventListener("change", function () {
      revokeAllUrls();
      thumbRow.innerHTML = "";
      var files = Array.prototype.slice.call(filesInput.files || [], 0).filter(function (f) {
        return f.type.indexOf("image/") === 0;
      });
      if (!files.length) {
        thumbRow.hidden = true;
        return;
      }
      thumbRow.hidden = false;
      files.slice(0, 8).forEach(function (file) {
        var url = URL.createObjectURL(file);
        revokeList.push(url);
        var im = document.createElement("img");
        im.className = "c-checkin-thumb";
        im.src = url;
        im.alt = "";
        thumbRow.appendChild(im);
      });
    });

    function finishCheckinGen(dataUrl, pack) {
      posterWrap.classList.remove("poster-mock--checkin--nophoto");
      if (dataUrl) {
        posterImg.src = dataUrl;
      } else {
        posterImg.removeAttribute("src");
        posterWrap.classList.add("poster-mock--checkin--nophoto");
      }
      posterTitleEl.textContent = pack.title;
      copyTextEl.textContent = pack.copy;
      stepGen.style.display = "none";
      cPosterResult.style.display = "block";
      try {
        sessionStorage.setItem(
          "kykw_checkin_snapshot",
          JSON.stringify({
            title: pack.title,
            copy: pack.copy,
            styleKey: getStyleKey(),
            posterDataUrl: dataUrl || null,
          })
        );
      } catch (eSnap) {}
    }

    btnGen.addEventListener("click", function () {
      var files = Array.prototype.slice.call(filesInput.files || [], 0).filter(function (f) {
        return f.type.indexOf("image/") === 0;
      });
      var styleKey = getStyleKey();
      var pack = COPY_BY_STYLE[styleKey] || COPY_BY_STYLE.grass;
      if (genTitleEl) {
        genTitleEl.innerHTML =
          files.length > 0
            ? "<strong>正在识别图片并生成文案…</strong>"
            : "<strong>正在生成打卡文案与配图…</strong>";
      }
      stepUpload.style.display = "none";
      stepGen.style.display = "block";
      cPosterResult.style.display = "none";

      if (!files.length) {
        setTimeout(function () {
          finishCheckinGen(null, pack);
        }, 1600);
        return;
      }

      var first = files[0];
      var fr = new FileReader();
      fr.onload = function () {
        var dataUrl = fr.result;
        setTimeout(function () {
          finishCheckinGen(dataUrl, pack);
        }, 1600);
      };
      fr.onerror = function () {
        stepGen.style.display = "none";
        stepUpload.style.display = "block";
        alert("图片读取失败，请重试。");
      };
      fr.readAsDataURL(first);
    });
  })();

  /** 用户端 · 上传转发凭证截图 */
  (function kykwForwardProofInit() {
    var fileEl = document.getElementById("c-forward-proof-file");
    var prevWrap = document.getElementById("c-forward-proof-preview-wrap");
    var prevImg = document.getElementById("c-forward-proof-preview");
    var btnSubmit = document.getElementById("c-forward-proof-submit");
    if (!fileEl || !prevWrap || !prevImg || !btnSubmit) return;

    var proofUrl = null;

    function revokeProof() {
      if (proofUrl) {
        try {
          URL.revokeObjectURL(proofUrl);
        } catch (e) {}
        proofUrl = null;
      }
      prevImg.removeAttribute("src");
      prevWrap.hidden = true;
      fileEl.value = "";
      btnSubmit.disabled = true;
    }

    window.kykwForwardProofOnShow = function () {
      revokeProof();
    };

    fileEl.addEventListener("change", function () {
      if (proofUrl) {
        try {
          URL.revokeObjectURL(proofUrl);
        } catch (e) {}
        proofUrl = null;
      }
      prevImg.removeAttribute("src");
      prevWrap.hidden = true;
      btnSubmit.disabled = true;
      var f = fileEl.files && fileEl.files[0];
      if (!f || f.type.indexOf("image/") !== 0) return;
      proofUrl = URL.createObjectURL(f);
      prevImg.src = proofUrl;
      prevWrap.hidden = false;
      btnSubmit.disabled = false;
    });

    btnSubmit.addEventListener("click", function () {
      if (btnSubmit.disabled || !fileEl.files || !fileEl.files[0]) return;
      var f = fileEl.files[0];
      var from = "video";
      try {
        from = sessionStorage.getItem("kykw_forward_from") || "video";
      } catch (e0) {}
      var fr = new FileReader();
      fr.onload = function () {
        var proofDataUrl = fr.result;
        var videoPick = null;
        var checkin = null;
        try {
          if (from === "video") {
            var rawV = sessionStorage.getItem("kykw_c_video_pick");
            if (rawV) videoPick = JSON.parse(rawV);
          } else if (from === "checkin") {
            var rawC = sessionStorage.getItem("kykw_checkin_snapshot");
            if (rawC) checkin = JSON.parse(rawC);
          }
        } catch (e1) {}
        var masks = [
          "订单 20260331" + String(Math.floor(1000 + Math.random() * 9000)) + "****" + String(Math.floor(100 + Math.random() * 900)),
          "用户 1" +
            String(Math.floor(30 + Math.random() * 50)) +
            "****" +
            String(Math.floor(1000 + Math.random() * 9000)),
        ];
        if (typeof window.kykwPushShareSubmission === "function") {
          window.kykwPushShareSubmission({
            id: "sub-" + Date.now(),
            type: from === "checkin" ? "checkin" : "video",
            channelLabel: from === "checkin" ? "点评打卡 · 待确认" : "发视频 · 待确认",
            orderMask: masks[0],
            userMask: masks[1],
            createdAt: Date.now(),
            status: "pending",
            videoPick: videoPick,
            checkin: checkin,
            proofImageDataUrl: proofDataUrl,
          });
        }
        window.markUserPromotionSubmitted();
        try {
          sessionStorage.removeItem("kykw_forward_from");
          sessionStorage.removeItem("kykw_c_video_restore_result");
        } catch (e2) {}
        if (typeof window.showPromoteToast === "function") {
          window.showPromoteToast("凭证已提交，待商家确认");
        }
        navigateTo("c-promote");
      };
      fr.onerror = function () {
        alert("截图读取失败，请重试");
      };
      fr.readAsDataURL(f);
    });
  })();

  /** 商家：AI 视频 · 首屏模板 + 五步向导 */
  (function mVideoGenWizard() {
    var root = document.getElementById("b-video-gen");
    if (!root) return;

    var landingEl = document.getElementById("m-vg-landing");
    var wizardWrap = document.getElementById("m-vg-wizard-wrap");
    var draftBtn = document.getElementById("m-vg-draft-btn");
    var navTitle = document.getElementById("m-vg-nav-title");
    var tplPreviewLayer = document.getElementById("m-vg-tpl-preview-layer");
    var tplPreviewMock = document.getElementById("m-vg-tpl-preview-mock");
    var tplPreviewTag = document.getElementById("m-vg-tpl-preview-tag");
    var tplPreviewTitle = document.getElementById("m-vg-tpl-preview-title");
    var tplPreviewDesc = document.getElementById("m-vg-tpl-preview-desc");
    var tplPreviewStart = document.getElementById("m-vg-tpl-preview-start");
    var mVgSelectedTemplateKey = null;
    var mVgStep3Timer = null;
    var mVgStep3Ready = false;
    var mVgStep3CurrentScript = "";
    var mVgStep3PendingTimeouts = [];

    var STYLE_LABEL = { warm: "温馨种草", flash: "促销快闪", minimal: "极简高级感" };
    var RATIO_LABEL = { "1-1": "1:1", "4-3": "4:3", "16-9": "16:9" };
    var ORIENT_LABEL = { portrait: "竖屏", landscape: "横屏" };

    var mVgTimers = { tick: null, bg: null, sync: null, done: null };
    var VG_RENDER_TOTAL_MS = 14000;
    var VG_BG_ENQUEUE_MS = 4500;

    function mVgClearRenderTimers() {
      if (mVgTimers.tick) clearInterval(mVgTimers.tick);
      if (mVgTimers.sync) clearInterval(mVgTimers.sync);
      if (mVgTimers.bg) clearTimeout(mVgTimers.bg);
      if (mVgTimers.done) clearTimeout(mVgTimers.done);
      mVgTimers = { tick: null, bg: null, sync: null, done: null };
    }

    window.mVgWizardStep5Available = false;
    window.mVgActiveRenderJobId = null;

    function vgUpdateStepper(n) {
      root.querySelectorAll(".b-vg-stepper__item").forEach(function (el, i) {
        var step = i + 1;
        el.classList.remove("active", "done");
        if (step < n) el.classList.add("done");
        if (step === n) el.classList.add("active");
        if (el.tagName === "BUTTON") {
          if (step === 5) {
            el.disabled = !window.mVgWizardStep5Available;
            el.setAttribute("aria-disabled", el.disabled ? "true" : "false");
          } else {
            el.disabled = false;
            el.removeAttribute("aria-disabled");
          }
          if (step === n) el.setAttribute("aria-current", "step");
          else el.removeAttribute("aria-current");
        }
      });
    }

    var wmCb = document.getElementById("m-vg-watermark");
    var wmLayer = document.getElementById("m-vg-watermark-layer");
    function mVgSyncWatermark() {
      if (!wmLayer) return;
      wmLayer.hidden = !(wmCb && wmCb.checked);
    }
    if (wmCb) wmCb.addEventListener("change", mVgSyncWatermark);

    function mVgParamPreambleLines() {
      return (
        "【成片参数】" +
        vgSummaryLine() +
        " · 时长 " +
        vgGetActiveDurationLabel() +
        " · 字幕 " +
        vgGetActiveSubLabel()
      );
    }

    function mVgBuildScriptDraft() {
      var pn = document.getElementById("m-vg-product-name");
      var sn = document.getElementById("m-vg-store-name");
      var uspEl = document.getElementById("m-vg-product-usp");
      var name = pn ? pn.value.trim() : "本品";
      var store = sn ? sn.value.trim() : "本店";
      var usp = uspEl ? uspEl.value.trim() : "";
      var uspBlock = usp ? "\n【来自已选素材摘要】\n" + usp.slice(0, 400) + (usp.length > 400 ? "…" : "") : "";
      var body =
        "【0-3s】黑场渐入 × 门店门头，字幕：" +
        store +
        " · 主推 " +
        name +
        "\n【3-10s】中景展示招牌菜品，旁白：突出新鲜与本味，承接下方卖点。\n【10-18s】质感特写 + 配料/盛装，字幕关键词：现做、限量（可按活动替换）\n【18-25s】口播 CTA：到店/外卖与福利提示\n节奏：轻快；转场轻微推拉；配乐偏温暖电子。" +
        uspBlock +
        "\n【脚本骨架补充】\n【镜头1】开箱/装盘，字幕「现做·限售」\n【镜头2】ASMR/特写收声，旁白突出核心卖点\n【镜头3】店员或老板口播 CTA\n【尾板】LOGO + 地址条，时长约 28s，留 1s 落版。";
      return mVgParamPreambleLines() + "\n\n" + body;
    }

    function mVgStep3ClearTimers() {
      mVgStep3PendingTimeouts.forEach(function (tid) {
        clearTimeout(tid);
      });
      mVgStep3PendingTimeouts = [];
      if (mVgStep3Timer) {
        clearTimeout(mVgStep3Timer);
        mVgStep3Timer = null;
      }
    }

    function mVgStep3Schedule(fn, ms) {
      var id = setTimeout(function () {
        mVgStep3PendingTimeouts = mVgStep3PendingTimeouts.filter(function (x) {
          return x !== id;
        });
        fn();
      }, ms);
      mVgStep3PendingTimeouts.push(id);
      mVgStep3Timer = id;
      return id;
    }

    function mVgSyncScriptEditor() {
      var ta = document.getElementById("m-vg-script-editor");
      if (ta) ta.value = mVgStep3CurrentScript;
    }

    function mVgPullScriptFromEditor() {
      var ta = document.getElementById("m-vg-script-editor");
      if (ta) mVgStep3CurrentScript = ta.value;
    }

    function mVgStep4SetStatus(msg) {
      var el = document.getElementById("m-vg-step4-status");
      if (!el) return;
      if (msg) {
        el.textContent = msg;
        el.hidden = false;
      } else {
        el.textContent = "";
        el.hidden = true;
      }
    }

    function mVgStep3ReviseScriptFromFeedback(prev, feedback) {
      var hint = feedback.trim().slice(0, 200);
      return (
        prev.trim() +
        "\n\n————————————————\n【按您的说明修订｜摘要：「" +
        hint +
        (feedback.length > 200 ? "…" : "") +
        "」】\n· 旁白已收紧为短句，节奏更快；分镜 2–3 可做蒙太奇处理。\n· 字幕与口播突出到店/活动信息，便于转化（演示）。\n"
      );
    }

    function mVgStep3SendChat() {
      var inp = document.getElementById("m-vg-script-chat-input");
      if (!inp || !mVgStep3Ready) return;
      mVgPullScriptFromEditor();
      var msg = inp.value.trim();
      if (!msg) {
        if (typeof window.showPromoteToast === "function") {
          window.showPromoteToast("请输入修改意见或使用语音输入");
        }
        return;
      }
      inp.value = "";
      var nextBtn = document.getElementById("m-vg-step3-next");
      if (nextBtn) nextBtn.disabled = true;
      mVgStep3Ready = false;
      mVgStep4SetStatus("正在根据您的意见重新生成文案…");
      mVgStep3Schedule(function () {
        mVgPullScriptFromEditor();
        mVgStep3CurrentScript = mVgStep3ReviseScriptFromFeedback(mVgStep3CurrentScript || mVgBuildScriptDraft(), msg);
        mVgSyncScriptEditor();
        mVgStep4SetStatus("");
        mVgStep3Ready = true;
        if (nextBtn) nextBtn.disabled = false;
        if (typeof window.showPromoteToast === "function") {
          window.showPromoteToast("已按意见更新上方文案");
        }
      }, 1600);
    }

    function mVgStep3ShouldForceRegen(prevStep) {
      if (prevStep === 5) return false;
      var ta = document.getElementById("m-vg-script-editor");
      return !ta || !String(ta.value || "").trim();
    }

    function mVgStep3Enter(prevStep) {
      mVgStep3ClearTimers();
      var nextBtn = document.getElementById("m-vg-step3-next");
      var force = mVgStep3ShouldForceRegen(prevStep);
      if (!force && mVgStep3Ready) {
        if (nextBtn) nextBtn.disabled = false;
        mVgSyncScriptEditor();
        mVgStep4SetStatus("");
        return;
      }
      mVgStep3Ready = false;
      mVgStep3CurrentScript = "";
      if (nextBtn) nextBtn.disabled = true;
      mVgSyncScriptEditor();
      mVgStep4SetStatus("正在生成文案…");
      mVgStep3Schedule(function () {
        mVgStep3CurrentScript = mVgBuildScriptDraft();
        mVgSyncScriptEditor();
        mVgStep4SetStatus("");
      }, 2000);
      mVgStep3Schedule(function () {
        mVgStep3Ready = true;
        if (nextBtn) nextBtn.disabled = false;
        if (typeof window.showPromoteToast === "function") {
          window.showPromoteToast("文案已填入上方，可编辑或在下方提交修改意见");
        }
      }, 2800);
    }

    function vgShowStep(n) {
      var prevStep = mVgGetCurrentStep();
      if (n !== 4) {
        mVgStep3ClearTimers();
      }
      if (landingEl) landingEl.hidden = true;
      if (wizardWrap) wizardWrap.hidden = false;
      if (draftBtn) draftBtn.hidden = true;
      if (navTitle) navTitle.textContent = "开始创作";
      for (var i = 1; i <= 5; i++) {
        var p = document.getElementById("m-vg-step-" + i);
        if (p) p.style.display = i === n ? "block" : "none";
      }
      vgUpdateStepper(n);
      if (n === 5) mVgSyncWatermark();
      if (n === 1) {
        mVgRefreshStep1TemplateBanner();
        if (typeof window.mVgRenderPickedMlib === "function") window.mVgRenderPickedMlib();
      }
      if (n === 4) {
        mVgStep3Enter(prevStep);
      }
      try {
        var sb = root.querySelector(".b-vg-screen-body") || root.querySelector(".screen-body");
        if (sb) sb.scrollTop = 0;
      } catch (e) {}
    }

    function mVgGetCurrentStep() {
      var a = root.querySelector(".b-vg-stepper__item.active");
      if (!a) return 1;
      var s = parseInt(a.getAttribute("data-step-indicator"), 10);
      return isNaN(s) ? 1 : s;
    }

    function mVgCloseTplPreview() {
      if (tplPreviewLayer) {
        tplPreviewLayer.hidden = true;
        tplPreviewLayer.setAttribute("data-preview-key", "");
      }
      if (landingEl) landingEl.hidden = false;
      if (draftBtn) draftBtn.hidden = false;
      if (navTitle) navTitle.textContent = "AI 视频";
      try {
        var sb = root.querySelector(".b-vg-screen-body") || root.querySelector(".screen-body");
        if (sb) sb.scrollTop = 0;
      } catch (eC) {}
    }

    window.mVgShowLanding = function () {
      if (tplPreviewLayer) {
        tplPreviewLayer.hidden = true;
        tplPreviewLayer.setAttribute("data-preview-key", "");
      }
      if (landingEl) landingEl.hidden = false;
      if (wizardWrap) wizardWrap.hidden = true;
      if (draftBtn) draftBtn.hidden = false;
      if (navTitle) navTitle.textContent = "AI 视频";
    };

    window.mVgStartWizard = function (mode) {
      vgShowStep(1);
      if (mode === "quick" && typeof window.showPromoteToast === "function") {
        window.showPromoteToast("演示：一键成片将沿用已选模板；未选模板时步骤 3 默认促销快闪、16:9、竖屏、15 秒等参数。");
      }
    };

    window.mVgNavBack = function () {
      if (tplPreviewLayer && !tplPreviewLayer.hidden) {
        mVgCloseTplPreview();
        return;
      }
      if (!wizardWrap || wizardWrap.hidden) {
        window.goScreen("b-ai-video-hub");
        return;
      }
      var n = mVgGetCurrentStep();
      if (n <= 1) {
        window.mVgShowLanding();
        return;
      }
      vgShowStep(n - 1);
    };

    var stepperNav = document.getElementById("m-vg-stepper");
    if (stepperNav) {
      stepperNav.addEventListener("click", function (e) {
        var item = e.target.closest(".b-vg-stepper__item");
        if (!item || item.disabled) return;
        var step = parseInt(item.getAttribute("data-step-indicator"), 10);
        if (isNaN(step) || step < 1 || step > 5) return;
        if (step === 5 && !window.mVgWizardStep5Available) return;
        vgShowStep(step);
      });
    }

    function vgGetActiveStyleKey() {
      var a = root.querySelector(".b-vg-option[data-vg-style].active");
      return a ? a.getAttribute("data-vg-style") : "flash";
    }
    function vgGetActiveRatioKey() {
      var a = root.querySelector(".b-vg-option[data-vg-ratio].active");
      return a ? a.getAttribute("data-vg-ratio") : "16-9";
    }
    function vgGetActiveOrientKey() {
      var a = root.querySelector(".b-vg-option[data-vg-orient].active");
      return a ? a.getAttribute("data-vg-orient") : "portrait";
    }

    function vgSummaryLine() {
      return (
        STYLE_LABEL[vgGetActiveStyleKey()] +
        " · " +
        RATIO_LABEL[vgGetActiveRatioKey()] +
        " · " +
        ORIENT_LABEL[vgGetActiveOrientKey()]
      );
    }

    function vgGetActiveDurationLabel() {
      var a = root.querySelector(".b-vg-option[data-vg-duration].active");
      return a ? a.textContent.trim() : "15 秒";
    }

    function vgGetActiveSubLabel() {
      var a = root.querySelector(".b-vg-option[data-vg-sub].active");
      return a ? a.textContent.trim() : "白底黑字";
    }

    window.mVgResetWizard = function () {
      mVgClearRenderTimers();
      window.mVgActiveRenderJobId = null;
      window.mVgLastCompletedPoolEntryId = null;
      window.mVgWizardStep5Available = false;
      var w = document.getElementById("m-gen-wait");
      if (w) w.style.display = "none";
      var bar = document.getElementById("m-vg-progress-bar");
      if (bar) bar.style.width = "0%";
      var bh = document.getElementById("m-vg-wait-bg-hint");
      var gb = document.getElementById("m-vg-goto-vpool");
      if (bh) bh.style.display = "none";
      if (gb) gb.style.display = "none";
      var extraNote = document.getElementById("m-vg-extra-note");
      if (extraNote) extraNote.value = "";
      var fi = document.getElementById("m-vg-file-input");
      if (fi) fi.value = "";
      if (wmLayer) wmLayer.hidden = true;
      mVgSelectedTemplateKey = null;
      window.kykwMlibPickMode = false;
      window.mVgPickedMlibItems = [];
      if (typeof window.mVgRenderPickedMlib === "function") window.mVgRenderPickedMlib();
      if (tplPreviewLayer) {
        tplPreviewLayer.hidden = true;
        tplPreviewLayer.setAttribute("data-preview-key", "");
      }
      mVgRefreshFileList();
      mVgStep3Ready = false;
      mVgStep3CurrentScript = "";
      mVgStep3ClearTimers();
      var st3i = document.getElementById("m-vg-script-chat-input");
      if (st3i) st3i.value = "";
      var ta3 = document.getElementById("m-vg-script-editor");
      if (ta3) ta3.value = "";
      mVgStep4SetStatus("");
      var next3 = document.getElementById("m-vg-step3-next");
      if (next3) next3.disabled = true;
      var step5BodyR = document.getElementById("m-vg-step5-body");
      if (step5BodyR) step5BodyR.hidden = false;
      mVgPreviewResetPlayUi();
      window.mVgShowLanding();
    };

    function mVgRefreshFileList() {
      var input = document.getElementById("m-vg-file-input");
      var list = document.getElementById("m-vg-file-list");
      if (!input || !list) return;
      list.innerHTML = "";
      var files = input.files;
      if (!files || !files.length) return;
      for (var i = 0; i < files.length; i++) {
        var li = document.createElement("li");
        li.textContent = files[i].name + "（" + (files[i].size > 1024 ? Math.round(files[i].size / 1024) + " KB" : files[i].size + " B") + "）";
        list.appendChild(li);
      }
    }
    var uploadTrigger = document.getElementById("m-vg-upload-trigger");
    var fileInput = document.getElementById("m-vg-file-input");
    if (uploadTrigger && fileInput) {
      uploadTrigger.addEventListener("click", function () {
        fileInput.click();
      });
      fileInput.addEventListener("change", mVgRefreshFileList);
    }

    var VG_TPL = {
      warm: {
        title: "温馨种草模板",
        tag: "8 段 · 约 30s",
        desc:
          "节奏舒缓、暖色调为主，适合菜品特写与门店氛围交替出现；口播亲切，字幕强调「新鲜、本味」等关键词。适用于探店感一键成片，可与用户端分享菜单风格对齐。",
        mockClass: "b-template-tile__mock--warm",
      },
      flash: {
        title: "促销快闪模板",
        tag: "12 段 · 约 24s",
        desc:
          "强节拍剪辑，大字报卖点与限时信息轮播，适合活动引爆与秒杀氛围。选用后步骤 3 将切换为「促销快闪」参数，导出可带麟云开物角标。",
        mockClass: "b-template-tile__mock--flash",
      },
      minimal: {
        title: "极简高级模板",
        tag: "6 段 · 约 28s",
        desc:
          "留白多、字体克制，画面以单品与光影为主，适合轻奢与品牌向叙述。适于强调质感与口碑背书类内容。",
        mockClass: "b-template-tile__mock--minimal",
      },
    };

    function mVgRefreshStep1TemplateBanner() {
      var titleEl = document.getElementById("m-vg-tpl-choice-title");
      var subEl = document.getElementById("m-vg-tpl-choice-sub");
      var card = document.getElementById("m-vg-tpl-choice-card");
      var clearBtn = document.getElementById("m-vg-tpl-clear");
      if (!titleEl || !subEl || !card) return;
      var k = mVgSelectedTemplateKey;
      if (k && VG_TPL[k]) {
        var m = VG_TPL[k];
        card.classList.add("m-vg-tpl-choice-card--picked");
        titleEl.textContent = "已选用：" + (STYLE_LABEL[k] || m.title);
        subEl.textContent =
          m.title + (m.tag ? " · " + m.tag : "") + "。参数已同步至步骤 3，可继续微调画幅与字幕。";
        if (clearBtn) clearBtn.hidden = false;
      } else {
        card.classList.remove("m-vg-tpl-choice-card--picked");
        titleEl.textContent = "尚未选用模板";
        subEl.textContent = "可在首页「模板」中预览并选用，或直接填写下方信息与素材库引用。";
        if (clearBtn) clearBtn.hidden = true;
      }
    }

    function mVgOpenTplPreview(k) {
      var meta = VG_TPL[k];
      if (!tplPreviewLayer || !meta) return;
      tplPreviewLayer.setAttribute("data-preview-key", k);
      if (tplPreviewMock) {
        tplPreviewMock.className = "m-vg-tpl-preview-layer__mock " + meta.mockClass;
        tplPreviewMock.textContent = "▶";
      }
      if (tplPreviewTag) tplPreviewTag.textContent = meta.tag || "";
      if (tplPreviewTitle) tplPreviewTitle.textContent = meta.title;
      if (tplPreviewDesc) tplPreviewDesc.textContent = meta.desc;
      tplPreviewLayer.hidden = false;
      if (landingEl) landingEl.hidden = true;
      if (wizardWrap) wizardWrap.hidden = true;
      if (draftBtn) draftBtn.hidden = true;
      if (navTitle) navTitle.textContent = "模板预览";
      try {
        var sb = root.querySelector(".b-vg-screen-body") || root.querySelector(".screen-body");
        if (sb) sb.scrollTop = 0;
      } catch (ePv) {}
    }

    function mVgStartWizardFromPreview() {
      var k = tplPreviewLayer ? tplPreviewLayer.getAttribute("data-preview-key") : "";
      if (!k || !VG_TPL[k]) return;
      vgApplyTemplateStyle(k, { quiet: true });
      if (tplPreviewLayer) {
        tplPreviewLayer.hidden = true;
        tplPreviewLayer.setAttribute("data-preview-key", "");
      }
      vgShowStep(1);
      if (typeof window.showPromoteToast === "function") {
        window.showPromoteToast("已选用模板并进入第 1 步");
      }
    }

    function vgApplyTemplateStyle(key, opts) {
      opts = opts || {};
      if (key && VG_TPL[key]) mVgSelectedTemplateKey = key;
      var styleRow = root.querySelector('.b-vg-select-row[aria-label="视频风格"]');
      if (styleRow) {
        styleRow.querySelectorAll(".b-vg-option").forEach(function (b) {
          b.classList.remove("active");
        });
        var sel = styleRow.querySelector('[data-vg-style="' + key + '"]');
        if (sel) sel.classList.add("active");
      }
      var lab = STYLE_LABEL[key] || (VG_TPL[key] && VG_TPL[key].title) || key;
      if (!opts.quiet && typeof window.showPromoteToast === "function") {
        window.showPromoteToast("已选用模板参数：" + lab);
      }
      mVgRefreshStep1TemplateBanner();
    }
    window.kykwApplyMerchantVideoTemplate = vgApplyTemplateStyle;

    if (tplPreviewStart) {
      tplPreviewStart.addEventListener("click", mVgStartWizardFromPreview);
    }
    var tplChoiceHome = document.getElementById("m-vg-tpl-choice-home");
    if (tplChoiceHome) {
      tplChoiceHome.addEventListener("click", function () {
        window.mVgShowLanding();
      });
    }
    var tplClearBtn = document.getElementById("m-vg-tpl-clear");
    if (tplClearBtn) {
      tplClearBtn.addEventListener("click", function () {
        mVgSelectedTemplateKey = null;
        mVgRefreshStep1TemplateBanner();
        if (typeof window.showPromoteToast === "function") {
          window.showPromoteToast("已清除模板选用");
        }
      });
    }

    root.addEventListener("click", function (e) {
      var prevTpl = e.target.closest(".b-vg-tpl-preview");
      if (prevTpl) {
        var tk = prevTpl.getAttribute("data-vg-template");
        if (tk) mVgOpenTplPreview(tk);
        return;
      }
      var useTpl = e.target.closest(".b-vg-tpl-use");
      if (useTpl) {
        vgApplyTemplateStyle(useTpl.getAttribute("data-vg-template"));
        return;
      }

      var opt = e.target.closest(".b-vg-option");
      if (opt) {
        var row = opt.closest(".b-vg-select-row");
        if (row) {
          row.querySelectorAll(".b-vg-option").forEach(function (b) {
            b.classList.remove("active");
          });
          opt.classList.add("active");
        }
        return;
      }

      var next = e.target.closest(".b-vg-next");
      if (next) {
        vgShowStep(parseInt(next.getAttribute("data-next"), 10));
        return;
      }
      var prev = e.target.closest(".b-vg-prev");
      if (prev) {
        vgShowStep(parseInt(prev.getAttribute("data-prev"), 10));
      }
    });

    var btnScriptChatSend = document.getElementById("m-vg-script-chat-send");
    if (btnScriptChatSend) {
      btnScriptChatSend.addEventListener("click", mVgStep3SendChat);
    }
    var inpScriptChat = document.getElementById("m-vg-script-chat-input");
    if (inpScriptChat) {
      inpScriptChat.addEventListener("keydown", function (e) {
        if (e.key === "Enter" && !e.shiftKey) {
          e.preventDefault();
          mVgStep3SendChat();
        }
      });
    }
    var scriptEditor = document.getElementById("m-vg-script-editor");
    if (scriptEditor) {
      scriptEditor.addEventListener("input", function () {
        mVgStep3CurrentScript = scriptEditor.value;
      });
    }

    var genWait = document.getElementById("m-gen-wait");
    var waitSummary = document.getElementById("m-vg-wait-summary");
    var waitEta = document.getElementById("m-vg-wait-eta");
    var waitBgHint = document.getElementById("m-vg-wait-bg-hint");
    var gotoVpoolBtn = document.getElementById("m-vg-goto-vpool");
    var progBar = document.getElementById("m-vg-progress-bar");
    var resultMeta = document.getElementById("m-vg-result-meta");
    var btnStep4Confirm = document.getElementById("m-vg-step3-next");
    if (gotoVpoolBtn) {
      gotoVpoolBtn.addEventListener("click", function () {
        if (typeof window.kykwShareLibraryGo === "function") {
          window.kykwShareLibraryGo("video");
        } else {
          window.goScreen("b-share-library");
        }
      });
    }

    var MVG_PREVIEW_DEMO_MP4 =
      "https://interactive-examples.mdn.mozilla.net/media/cc0-videos/flower.mp4";

    function mVgPreviewResetPlayUi() {
      var vid = document.getElementById("m-vg-preview-video");
      var btn = document.getElementById("m-vg-preview-mock");
      if (vid) {
        vid.pause();
        vid.removeAttribute("src");
        vid.load();
        vid.hidden = true;
        vid.removeAttribute("controls");
      }
      if (btn) btn.hidden = false;
    }

    function mVgPreviewInitPlay() {
      var vid = document.getElementById("m-vg-preview-video");
      var btn = document.getElementById("m-vg-preview-mock");
      if (!vid || !btn || btn.getAttribute("data-mvg-play-bound")) return;
      btn.setAttribute("data-mvg-play-bound", "1");
      btn.addEventListener("click", function () {
        if (!vid.src) {
          vid.src = MVG_PREVIEW_DEMO_MP4;
        }
        vid.hidden = false;
        vid.setAttribute("controls", "controls");
        btn.hidden = true;
        var playPromise = vid.play();
        if (playPromise && typeof playPromise.catch === "function") {
          playPromise.catch(function () {
            mVgPreviewResetPlayUi();
            var msg = "无法播放示例视频，请联网后重试";
            if (typeof window.showPromoteToast === "function") {
              window.showPromoteToast(msg);
            } else {
              alert(msg);
            }
          });
        }
      });
      vid.addEventListener("ended", function () {
        mVgPreviewResetPlayUi();
      });
    }
    mVgPreviewInitPlay();

    function mVgRunRender() {
      if (!genWait) return;
      mVgClearRenderTimers();
      window.mVgWizardStep5Available = false;
      window.mVgLastCompletedPoolEntryId = null;
      if (btnStep4Confirm) btnStep4Confirm.disabled = false;

      var step5Body = document.getElementById("m-vg-step5-body");
      var step5Prev = document.querySelector("#m-vg-step-5 .b-vg-prev");
      if (step5Body) step5Body.hidden = true;
      if (step5Prev) step5Prev.disabled = true;

      vgShowStep(5);
      vgUpdateStepper(5);

      var titleEl = document.getElementById("m-vg-product-name");
      var jobTitle =
        titleEl && titleEl.value.trim() ? titleEl.value.trim() : "AI 视频成片";
      var jobId = "v-gen-" + Date.now();
      window.mVgActiveRenderJobId = jobId;
      var summaryBase = vgSummaryLine();

      if (waitSummary) waitSummary.textContent = summaryBase;
      if (waitBgHint) waitBgHint.style.display = "none";
      if (gotoVpoolBtn) gotoVpoolBtn.style.display = "none";
      genWait.style.display = "flex";
      if (progBar) progBar.style.width = "0%";

      var t0 = Date.now();
      function poolProgressFromElapsed(elapsed) {
        return Math.min(95, (elapsed / VG_RENDER_TOTAL_MS) * 95);
      }
      function refreshEta() {
        if (!waitEta) return;
        var left = Math.max(0, Math.ceil((VG_RENDER_TOTAL_MS - (Date.now() - t0)) / 1000));
        waitEta.textContent = left ? "预计剩余约 " + left + " 秒" : "即将完成…";
      }
      refreshEta();

      mVgTimers.tick = setInterval(function () {
        var elapsed = Date.now() - t0;
        var p = poolProgressFromElapsed(elapsed);
        if (progBar) progBar.style.width = p + "%";
        refreshEta();
      }, 80);

      mVgTimers.bg = setTimeout(function () {
        if (window.mVgActiveRenderJobId !== jobId) return;
        if (waitBgHint) waitBgHint.style.display = "block";
        if (gotoVpoolBtn) gotoVpoolBtn.style.display = "block";
        var arr = window.kykwVideoPoolRead();
        arr.unshift({
          id: jobId,
          title: jobTitle,
          summary: summaryBase + " · 渲染中（可稍后于视频库查看）",
          status: "generating",
          progressPct: poolProgressFromElapsed(Date.now() - t0),
          inSharePool: false,
          shareAudit: "none",
          deleted: false,
          createdAt: Date.now(),
        });
        window.kykwVideoPoolWrite(arr);
        if (typeof window.kykwRenderVideoPoolList === "function") {
          window.kykwRenderVideoPoolList();
        }
      }, VG_BG_ENQUEUE_MS);

      mVgTimers.sync = setInterval(function () {
        if (window.mVgActiveRenderJobId !== jobId) return;
        var arr = window.kykwVideoPoolRead();
        var found = arr.filter(function (x) {
          return x.id === jobId;
        })[0];
        if (found && found.status === "generating") {
          found.progressPct = poolProgressFromElapsed(Date.now() - t0);
          found.summary = summaryBase + " · 渲染中 " + Math.round(found.progressPct) + "%";
          window.kykwVideoPoolWrite(arr);
          var poolScreen = document.getElementById("b-share-library");
          var vidPane = document.getElementById("b-share-lib-detail-video");
          if (
            poolScreen &&
            poolScreen.classList.contains("active") &&
            vidPane &&
            !vidPane.hidden &&
            typeof window.kykwRenderVideoPoolList === "function"
          ) {
            window.kykwRenderVideoPoolList();
          }
        }
      }, 450);

      mVgTimers.done = setTimeout(function () {
        mVgClearRenderTimers();
        if (window.mVgActiveRenderJobId !== jobId) return;
        window.mVgActiveRenderJobId = null;
        var arr = window.kykwVideoPoolRead();
        var found = arr.filter(function (x) {
          return x.id === jobId;
        })[0];
        var metaLine =
          summaryBase + " · " + vgGetActiveDurationLabel() + " · " + vgGetActiveSubLabel();
        if (found) {
          found.status = "completed";
          found.progressPct = 100;
          found.summary = metaLine;
          var shareCbDone = document.getElementById("m-vg-share-pool-check");
          if (shareCbDone && shareCbDone.checked) {
            found.inSharePool = true;
            found.shareAudit = "pending";
          } else {
            found.inSharePool = false;
            found.shareAudit = "none";
          }
          window.kykwVideoPoolWrite(arr);
        }
        window.mVgLastCompletedPoolEntryId = jobId;
        if (typeof window.kykwRenderVideoPoolList === "function") {
          window.kykwRenderVideoPoolList();
        }
        if (progBar) progBar.style.width = "100%";
        genWait.style.display = "none";
        if (waitBgHint) waitBgHint.style.display = "none";
        if (gotoVpoolBtn) gotoVpoolBtn.style.display = "none";
        if (resultMeta) {
          var wmNote = wmCb && wmCb.checked ? " · 已启用麟云开物水印" : "";
          resultMeta.textContent = metaLine + wmNote;
        }
        mVgPreviewResetPlayUi();
        window.mVgWizardStep5Available = true;
        vgUpdateStepper(5);
        mVgSyncWatermark();
        var step5BodyDone = document.getElementById("m-vg-step5-body");
        var step5PrevDone = document.querySelector("#m-vg-step-5 .b-vg-prev");
        if (step5BodyDone) step5BodyDone.hidden = false;
        if (step5PrevDone) step5PrevDone.disabled = false;
        try {
          var sbDone = root.querySelector(".b-vg-screen-body") || root.querySelector(".screen-body");
          if (sbDone) sbDone.scrollTop = 0;
        } catch (eSb) {}
      }, VG_RENDER_TOTAL_MS);
    }

    if (btnStep4Confirm) {
      btnStep4Confirm.addEventListener("click", function () {
               if (btnStep4Confirm.disabled || !mVgStep3Ready) return;
        mVgPullScriptFromEditor();
        mVgRunRender();
      });
    }

    var sharePoolCb = document.getElementById("m-vg-share-pool-check");
    if (sharePoolCb) {
      sharePoolCb.addEventListener("change", function () {
        var pid = window.mVgLastCompletedPoolEntryId;
        if (!pid) return;
        var arr = window.kykwVideoPoolRead();
        var ent = arr.filter(function (x) {
          return x.id === pid;
        })[0];
        if (!ent || ent.status !== "completed") return;
        ent.inSharePool = !!sharePoolCb.checked;
        ent.shareAudit = sharePoolCb.checked ? "pending" : "none";
        window.kykwVideoPoolWrite(arr);
        if (typeof window.kykwRenderVideoPoolList === "function") {
          window.kykwRenderVideoPoolList();
        }
      });
    }

    var btnStep5Satisfied = document.getElementById("m-vg-step5-satisfied");
    if (btnStep5Satisfied) {
      btnStep5Satisfied.addEventListener("click", function () {
        if (typeof window.mVgResetWizard === "function") window.mVgResetWizard();
        if (typeof window.kykwShareLibraryGo === "function") {
          window.kykwShareLibraryGo("video");
        } else {
          window.goScreen("b-share-library");
        }
      });
    }

    window.mVgAfterReturnFromMlib = function () {
      vgShowStep(1);
    };

    vgShowStep(1);
  })();

  // 商家：商品讲解视频 · 步骤演示
  var peFetch = document.getElementById("b-pe-btn-fetch");
  var peCaptured = document.getElementById("b-pe-captured");
  var peRegen = document.getElementById("b-pe-btn-regen");
  var peConfirm = document.getElementById("b-pe-btn-confirm");
  var peConfirmHint = document.getElementById("b-pe-confirm-hint");
  var peVideoCard = document.getElementById("b-pe-video-card");
  var peVideoBtn = document.getElementById("b-pe-btn-video");
  var peVideoProg = document.getElementById("b-pe-video-progress");
  var peVideoDone = document.getElementById("b-pe-video-done");
  var peScript = document.getElementById("b-pe-script");
  if (peFetch && peCaptured) {
    peFetch.addEventListener("click", function () {
      peCaptured.style.display = "block";
    });
  }
  if (peRegen && peScript) {
    peRegen.addEventListener("click", function () {
      peScript.value =
        "「上新提醒！这一批海白虾凌晨到店，主厨现场开背腌制。花雕酒香裹着鲜甜，湖州老饕认证的醉虾，今日下单立减 10 元～」";
    });
  }
  if (peConfirm && peConfirmHint && peVideoCard && peVideoBtn) {
    peConfirm.addEventListener("click", function () {
      peConfirmHint.style.display = "inline-block";
      peVideoCard.style.opacity = "1";
      peVideoCard.style.pointerEvents = "auto";
      peVideoBtn.disabled = false;
    });
  }
  if (peVideoBtn && peVideoProg && peVideoDone) {
    peVideoBtn.addEventListener("click", function () {
      peVideoBtn.disabled = true;
      peVideoDone.style.display = "none";
      peVideoProg.style.display = "block";
      setTimeout(function () {
        peVideoProg.style.display = "none";
        peVideoDone.style.display = "block";
      }, 2200);
    });
  }

  (function kykwRagMerchantInit() {
    var KEY_QA = "kykw_rag_qa";
    var KEY_SRC = "kykw_rag_sources";
    var KEY_SET = "kykw_rag_settings";
    var RAG_SESSIONS = [
      { id: "u1", name: "王女士", tag: "高意向", last: "10:24" },
      { id: "u2", name: "李先生", tag: "售前", last: "昨天" },
      { id: "u3", name: "访客 8821", tag: "匿名", last: "09:10" },
    ];
    var RAG_THREAD_PRESETS = {
      u1: [
        { role: "user", text: "醉虾可以外带吗？大概能放多久？" },
        {
          role: "bot",
          text:
            "可以外带，建议使用保温袋；常温建议 2 小时内食用，冷藏不超过 12 小时。花雕味会加重属正常现象～需要帮您预留一份吗？",
        },
        { role: "user", text: "发什么快递？坏了包赔吗？" },
        {
          role: "bot",
          text:
            "生鲜默认顺丰冷链；签收 6 小时内拍照联客服可按比例赔付。详情页已写明「坏单包赔」细则，我可以发您下单链接。",
        },
      ],
      u2: [
        { role: "user", text: "你们堂食环境怎么样？要排队吗？" },
        {
          role: "bot",
          text: "（演示）已按「店铺信息」检索：大厅与包厢均可预约，晚市建议提前取号。需要帮您留位吗？",
        },
      ],
      u3: [{ role: "user", text: "退换货规则是怎样的？" }, { role: "bot", text: "（演示）正在为您匹配售后政策条目…" }],
    };
    var ragState = { activeId: "u1" };
    var ragExtra = { u1: [], u2: [], u3: [] };

    function ragReadJson(key, fallback) {
      try {
        var raw = localStorage.getItem(key);
        return raw ? JSON.parse(raw) : fallback;
      } catch (e) {
        return fallback;
      }
    }
    function ragWriteJson(key, val) {
      try {
        localStorage.setItem(key, JSON.stringify(val));
      } catch (e) {}
    }
    function ragEnsureDefaults() {
      if (!localStorage.getItem(KEY_QA)) {
        ragWriteJson(KEY_QA, [
          {
            id: "seed-qa-1",
            question: "外带 放多久",
            answer:
              "可以外带，建议保温袋；常温 2 小时内食用，冷藏不超过 12 小时。需要预留请说一声～",
            category: "商品",
            createdAt: Date.now(),
          },
          {
            id: "seed-qa-2",
            question: "坏了 包赔",
            answer: "签收 6 小时内拍照联系客服，坏单按比例赔付，细则见商品详情「坏单包赔」。",
            category: "售后",
            createdAt: Date.now(),
          },
        ]);
      }
      if (!localStorage.getItem(KEY_SRC)) {
        ragWriteJson(KEY_SRC, {
          store: "湖畔小厨 · 湖州直营门店；营业 10:00–21:30；支持电话预约留座。",
          products:
            "招牌花雕醉虾：冷链锁鲜装；钠含量约 580mg/100g；过敏原：甲壳类。储存：0–4℃冷藏。",
          logistics: "默认顺丰冷链；每日 10:00、15:00 两波出库；江浙沪次日达为主。",
          aftersale: "生鲜不适用 7 天无理由；坏单 6 小时内申诉；其他见详情公示。",
        });
      }
      if (!localStorage.getItem(KEY_SET)) {
        ragWriteJson(KEY_SET, {
          nick: "小湖 AI 助手",
          autoReply: true,
          topK: 4,
          threshold: "0.72",
          handoff: "投诉,退款,找店长,差评",
        });
      }
    }
    function ragSettings() {
      return ragReadJson(KEY_SET, {});
    }
    function ragSources() {
      return ragReadJson(KEY_SRC, {});
    }
    function ragKbList() {
      return ragReadJson(KEY_QA, []);
    }
    function ragGetCustomerLabel() {
      var s = RAG_SESSIONS.filter(function (x) {
        return x.id === ragState.activeId;
      })[0];
      return s ? "顾客 · " + s.name : "顾客";
    }
    function ragBotLabel() {
      var n = ragSettings().nick || "AI 助手";
      return n + " · RAG";
    }
    function ragDomAppendBot(text) {
      var thread = document.getElementById("b-rag-thread");
      if (!thread) return;
      var wrap = document.createElement("div");
      wrap.className = "b-rag-msg b-rag-msg--bot";
      wrap.innerHTML = "<span></span><p></p>";
      wrap.querySelector("span").textContent = ragBotLabel();
      wrap.querySelector("p").textContent = text;
      thread.appendChild(wrap);
      thread.scrollTop = thread.scrollHeight;
    }
    function ragDomAppendUser(text, who) {
      var thread = document.getElementById("b-rag-thread");
      if (!thread || !text.trim()) return;
      var wrap = document.createElement("div");
      wrap.className = "b-rag-msg b-rag-msg--user";
      wrap.innerHTML = "<span></span><p></p>";
      wrap.querySelector("span").textContent = who || "顾客";
      wrap.querySelector("p").textContent = text;
      thread.appendChild(wrap);
      thread.scrollTop = thread.scrollHeight;
    }
    function ragDomAppendStaff(text) {
      var thread = document.getElementById("b-rag-thread");
      if (!thread || !text.trim()) return;
      var wrap = document.createElement("div");
      wrap.className = "b-rag-msg b-rag-msg--staff";
      wrap.innerHTML = "<span>店员 · 人工</span><p></p>";
      wrap.querySelector("p").textContent = text;
      thread.appendChild(wrap);
      thread.scrollTop = thread.scrollHeight;
    }
    function ragGetMergedMessages() {
      var id = ragState.activeId;
      return (RAG_THREAD_PRESETS[id] || []).concat(ragExtra[id] || []);
    }
    function ragFullRedraw() {
      var thread = document.getElementById("b-rag-thread");
      if (!thread) return;
      thread.innerHTML = "";
      var who = ragGetCustomerLabel();
      ragGetMergedMessages().forEach(function (m) {
        if (m.role === "user") ragDomAppendUser(m.text, who);
        else if (m.role === "bot") ragDomAppendBot(m.text);
        else if (m.role === "staff") ragDomAppendStaff(m.text);
      });
    }
    function ragPush(role, text) {
      var id = ragState.activeId;
      if (!ragExtra[id]) ragExtra[id] = [];
      ragExtra[id].push({ role: role, text: text });
      if (role === "user") ragDomAppendUser(text, ragGetCustomerLabel());
      else if (role === "bot") ragDomAppendBot(text);
      else if (role === "staff") ragDomAppendStaff(text);
    }
    function ragHandoffHit(userText) {
      var st = ragSettings();
      var keys = (st.handoff || "")
        .split(/[,，;；]/)
        .map(function (x) {
          return x.trim();
        })
        .filter(Boolean);
      for (var i = 0; i < keys.length; i++) {
        if (keys[i] && userText.indexOf(keys[i]) >= 0) return true;
      }
      return false;
    }
    function ragMatchKb(userText) {
      var list = ragKbList();
      var t = userText.trim();
      for (var i = 0; i < list.length; i++) {
        var q = (list[i].question || "").trim();
        if (!q) continue;
        if (t.indexOf(q) >= 0 || q.indexOf(t) >= 0) return list[i].answer;
        if (t.length > 2 && q.length > 2) {
          var fq = q.slice(0, Math.min(6, q.length));
          if (t.indexOf(fq) >= 0) return list[i].answer;
        }
      }
      return null;
    }
    function ragMatchSources(userText) {
      var src = ragSources();
      var t = userText;
      if (/快递|物流|发货|包邮|顺丰/.test(t) && src.logistics) {
        return "（知识库 · 物流）" + src.logistics;
      }
      if (/退换|售后|赔|坏单|退款/.test(t) && src.aftersale) {
        return "（知识库 · 售后）" + src.aftersale;
      }
      if (/营业|地址|电话|预约|环境|排队|堂食/.test(t) && src.store) {
        return "（知识库 · 店铺）" + src.store;
      }
      if (/钠|过敏|规格|SKU|参数|储存|醉虾|商品/.test(t) && src.products) {
        return "（知识库 · 商品）" + src.products;
      }
      return null;
    }
    function ragAutoReplyFor(userText) {
      if (ragHandoffHit(userText)) {
        return "（系统）已识别转人工关键词，正在为您转接当班店员，请稍候；您也可直接说明诉求。";
      }
      var st = ragSettings();
      if (st.autoReply === false) {
        return null;
      }
      var kb = ragMatchKb(userText);
      if (kb) return kb;
      var sc = ragMatchSources(userText);
      if (sc) return sc;
      return (
        "（演示）未精确命中知识点，已按 Top-" +
        (st.topK || 4) +
        " 做向量检索摘要。您可将本条「识别问答」入库，下次类似提问将自动匹配。"
      );
    }
    function ragInitSessions() {
      var host = document.getElementById("b-rag-sessions");
      if (!host) return;
      host.innerHTML = "";
      RAG_SESSIONS.forEach(function (s) {
        var b = document.createElement("button");
        b.type = "button";
        b.className = "b-rag-session" + (s.id === ragState.activeId ? " active" : "");
        b.setAttribute("data-rag-session", s.id);
        b.innerHTML =
          "<strong>" +
          s.name +
          "</strong><small>" +
          s.tag +
          " · " +
          s.last +
          "</small>";
        host.appendChild(b);
      });
    }
    function ragActivateTab(name) {
      document.querySelectorAll(".b-rag-tab").forEach(function (btn) {
        var on = btn.getAttribute("data-rag-tab") === name;
        btn.classList.toggle("active", on);
        btn.setAttribute("aria-selected", on ? "true" : "false");
      });
      document.querySelectorAll("[data-rag-panel]").forEach(function (p) {
        var on = p.getAttribute("data-rag-panel") === name;
        p.classList.toggle("b-rag-panel--active", on);
        if (on) p.removeAttribute("hidden");
        else p.setAttribute("hidden", "");
      });
    }
    function ragKbRender() {
      var listEl = document.getElementById("b-rag-kb-list");
      var emptyEl = document.getElementById("b-rag-kb-empty");
      if (!listEl) return;
      var items = ragKbList();
      listEl.innerHTML = "";
      if (!items.length) {
        if (emptyEl) emptyEl.style.display = "block";
        return;
      }
      if (emptyEl) emptyEl.style.display = "none";
      items.forEach(function (it) {
        var li = document.createElement("li");
        li.className = "b-rag-kb-item";
        li.innerHTML =
          '<p class="b-rag-kb-item__q"></p>' +
          '<p class="b-rag-kb-item__a"></p>' +
          '<div class="b-rag-kb-item__meta">' +
          '<span class="b-rag-kb-item__cat"></span>' +
          '<button type="button" class="btn btn-secondary btn-small b-rag-kb-del">删除</button>' +
          "</div>";
        li.querySelector(".b-rag-kb-item__q").textContent = it.question || "";
        li.querySelector(".b-rag-kb-item__a").textContent = it.answer || "";
        li.querySelector(".b-rag-kb-item__cat").textContent = it.category || "通用";
        var del = li.querySelector(".b-rag-kb-del");
        del.setAttribute("data-rag-kb-id", it.id);
        listEl.appendChild(li);
      });
    }
    function ragLoadForms() {
      var src = ragSources();
      var st = ragSettings();
      var el;
      if ((el = document.getElementById("b-rag-src-store"))) el.value = src.store || "";
      if ((el = document.getElementById("b-rag-src-products"))) el.value = src.products || "";
      if ((el = document.getElementById("b-rag-src-logistics"))) el.value = src.logistics || "";
      if ((el = document.getElementById("b-rag-src-after"))) el.value = src.aftersale || "";
      if ((el = document.getElementById("b-rag-set-nick"))) el.value = st.nick || "";
      if ((el = document.getElementById("b-rag-set-auto"))) el.checked = st.autoReply !== false;
      if ((el = document.getElementById("b-rag-set-topk")))
        el.value = st.topK != null ? String(st.topK) : "4";
      if ((el = document.getElementById("b-rag-set-threshold"))) el.value = st.threshold || "0.72";
      if ((el = document.getElementById("b-rag-set-handoff"))) el.value = st.handoff || "";
    }
    function ragExtractLastQAPair() {
      var arr = ragGetMergedMessages();
      var ansIdx = -1;
      var i;
      for (i = arr.length - 1; i >= 0; i--) {
        if (arr[i].role === "bot" || arr[i].role === "staff") {
          ansIdx = i;
          break;
        }
      }
      if (ansIdx < 0) return null;
      var qIdx = -1;
      for (var j = ansIdx - 1; j >= 0; j--) {
        if (arr[j].role === "user") {
          qIdx = j;
          break;
        }
      }
      if (qIdx < 0) return null;
      return { q: arr[qIdx].text, a: arr[ansIdx].text };
    }

    window.kykwRagOnScreenShow = function () {
      ragEnsureDefaults();
      ragLoadForms();
      ragKbRender();
      ragInitSessions();
      ragFullRedraw();
      ragActivateTab("chat");
    };

    document.addEventListener("click", function (e) {
      var tab = e.target.closest(".b-rag-tab");
      if (tab) {
        var name = tab.getAttribute("data-rag-tab");
        if (name) ragActivateTab(name);
      }
      var ses = e.target.closest(".b-rag-session");
      if (ses && ses.getAttribute("data-rag-session")) {
        ragState.activeId = ses.getAttribute("data-rag-session");
        ragInitSessions();
        ragFullRedraw();
      }
      var del = e.target.closest(".b-rag-kb-del");
      if (del) {
        var kid = del.getAttribute("data-rag-kb-id");
        if (kid) {
          var next = ragKbList().filter(function (x) {
            return x.id !== kid;
          });
          ragWriteJson(KEY_QA, next);
          ragKbRender();
        }
      }
    });

    var ragSaveKb = document.getElementById("b-rag-kb-save");
    if (ragSaveKb) {
      ragSaveKb.addEventListener("click", function () {
        var qEl = document.getElementById("b-rag-kb-q");
        var aEl = document.getElementById("b-rag-kb-a");
        var cEl = document.getElementById("b-rag-kb-cat");
        var q = qEl && qEl.value.trim();
        var a = aEl && aEl.value.trim();
        if (!q || !a) return;
        var list = ragKbList();
        list.unshift({
          id: "qa-" + Date.now(),
          question: q,
          answer: a,
          category: (cEl && cEl.value) || "通用",
          createdAt: Date.now(),
        });
        ragWriteJson(KEY_QA, list);
        ragKbRender();
        if (qEl) qEl.value = "";
        if (aEl) aEl.value = "";
        var hint = document.getElementById("b-rag-kb-save-hint");
        if (hint) {
          hint.style.display = "block";
          hint.textContent = "已加入知识库，相似提问将优先自动回复。";
          setTimeout(function () {
            if (hint) hint.style.display = "none";
          }, 2800);
        }
      });
    }

    var ragSrcSave = document.getElementById("b-rag-src-save");
    if (ragSrcSave) {
      ragSrcSave.addEventListener("click", function () {
        ragWriteJson(KEY_SRC, {
          store: (document.getElementById("b-rag-src-store") || {}).value || "",
          products: (document.getElementById("b-rag-src-products") || {}).value || "",
          logistics: (document.getElementById("b-rag-src-logistics") || {}).value || "",
          aftersale: (document.getElementById("b-rag-src-after") || {}).value || "",
        });
        var h = document.getElementById("b-rag-src-hint");
        if (h) {
          h.style.display = "block";
          setTimeout(function () {
            if (h) h.style.display = "none";
          }, 2400);
        }
      });
    }

    var ragSetSave = document.getElementById("b-rag-set-save");
    if (ragSetSave) {
      ragSetSave.addEventListener("click", function () {
        var topk = parseInt((document.getElementById("b-rag-set-topk") || {}).value, 10) || 4;
        ragWriteJson(KEY_SET, {
          nick: (document.getElementById("b-rag-set-nick") || {}).value.trim() || "AI 助手",
          autoReply: !!(document.getElementById("b-rag-set-auto") || {}).checked,
          topK: topk,
          threshold: (document.getElementById("b-rag-set-threshold") || {}).value || "0.72",
          handoff: (document.getElementById("b-rag-set-handoff") || {}).value || "",
        });
        var h = document.getElementById("b-rag-set-hint");
        if (h) {
          h.style.display = "block";
          setTimeout(function () {
            if (h) h.style.display = "none";
      }, 2000);
        }
        ragFullRedraw();
      });
    }

    var ragExtract = document.getElementById("b-rag-extract-pair");
    if (ragExtract) {
      ragExtract.addEventListener("click", function () {
        var pair = ragExtractLastQAPair();
        if (!pair) {
          alert("当前会话缺少「顾客提问 + AI/店员回复」成对记录，请先多轮对话后再试。");
          return;
        }
        ragActivateTab("kb");
        var qEl = document.getElementById("b-rag-kb-q");
        var aEl = document.getElementById("b-rag-kb-a");
        if (qEl) qEl.value = pair.q;
        if (aEl) aEl.value = pair.a;
        var hint = document.getElementById("b-rag-kb-save-hint");
        if (hint) {
          hint.style.display = "block";
          hint.textContent = "已从会话识别问答草稿，核对后点「保存到知识库」即可生效。";
        }
      });
    }

    var ragSend = document.getElementById("b-rag-send");
    var ragInput = document.getElementById("b-rag-input");
    if (ragSend && ragInput) {
      ragSend.addEventListener("click", function () {
        var t = ragInput.value.trim();
        if (!t) return;
        ragPush("user", t);
        ragInput.value = "";
        setTimeout(function () {
          var reply = ragAutoReplyFor(t);
          if (reply) ragPush("bot", reply);
        }, 400);
      });
    }

    var ragSendMan = document.getElementById("b-rag-send-manual");
    var ragManIn = document.getElementById("b-rag-manual-input");
    if (ragSendMan && ragManIn) {
      ragSendMan.addEventListener("click", function () {
        var t = ragManIn.value.trim();
        if (!t) return;
        ragPush("staff", t);
        ragManIn.value = "";
      });
    }

    document.querySelectorAll(".b-rag-chip").forEach(function (btn) {
      btn.addEventListener("click", function () {
        var q = btn.getAttribute("data-rag-q");
        if (!q) return;
        ragPush("user", q);
        var replies = {
          参数: "钠含量约 580mg / 100g，过敏原含甲壳类，可与客服备注少辣。",
          售后: "签收后 6 小时内可申请坏损赔付；未拆封支持 7 天无理由（生鲜除外条款已例外说明）。",
          快递: "每日 10:00、15:00 两波出库；江浙沪通常次日达。",
          促单: "当前两件 95 折可与店铺券叠加，需要我帮您锁定库存并推送收款核销吗？",
        };
        var key = btn.textContent.trim();
        setTimeout(function () {
          var st = ragSettings();
          if (st.autoReply === false) return;
          ragPush("bot", replies[key] || ragAutoReplyFor(q) || "（演示）已检索政策说明。");
        }, 350);
      });
    });

    ragEnsureDefaults();
  })();

  (function kykwPosterGenInit() {
    function bindPosterChips(selector) {
      document.querySelectorAll(selector).forEach(function (btn) {
        btn.addEventListener("click", function () {
          document.querySelectorAll(selector).forEach(function (b) {
            b.classList.remove("active");
          });
          btn.classList.add("active");
        });
      });
    }
    bindPosterChips(".b-poster-style");
    bindPosterChips(".b-poster-ratio");
    var genBtn = document.getElementById("b-poster-btn-gen");
    var wrap = document.getElementById("b-poster-result-wrap");
    var box = document.getElementById("b-poster-result");
    var wmPosterCb = document.getElementById("b-poster-watermark");
    var wmPosterLay = document.getElementById("b-poster-watermark-layer");
    function syncPosterWatermark() {
      if (!wmPosterLay) return;
      wmPosterLay.hidden = !(wmPosterCb && wmPosterCb.checked);
    }
    if (wmPosterCb) wmPosterCb.addEventListener("change", syncPosterWatermark);
    if (!genBtn || !wrap || !box) return;
    var lastPosterSnap = null;
    var sceneLabels = {
      moments: "朋友圈 / 私域",
      store: "门店电视 / 易拉宝",
      platform: "平台活动头图",
      print: "打印传单",
    };
    genBtn.addEventListener("click", function () {
      var scEl = document.getElementById("b-poster-scene");
      var scKey = scEl && scEl.value ? scEl.value : "moments";
      var pickedTexts = (window.kykwGetPickedMlibLabels && window.kykwGetPickedMlibLabels("poster", "text")) || [];
      var pickedImages = (window.kykwGetPickedMlibLabels && window.kykwGetPickedMlibLabels("poster", "image")) || [];
      var title = ((document.getElementById("b-poster-title") || {}).value || "").trim();
      var sub = ((document.getElementById("b-poster-sub") || {}).value || "").trim();
      var promo = ((document.getElementById("b-poster-promo") || {}).value || "").trim();
      var brand = ((document.getElementById("b-poster-brand") || {}).value || "").trim();
      if (!title && pickedTexts.length) title = pickedTexts[0].slice(0, 20);
      if (!title && pickedImages.length) title = pickedImages[0].slice(0, 20);
      if (!sub && pickedTexts.length > 1) sub = pickedTexts[1].slice(0, 36);
      if (!promo && pickedTexts.length > 2) promo = pickedTexts[2].slice(0, 42);
      if (!promo) promo = "详情见小程序 · 欢迎到店";
      if (!brand && pickedImages.length) brand = "素材：" + pickedImages.slice(0, 2).join(" / ");
      if (!title) title = "店铺活动";
      var stEl = document.querySelector(".b-poster-style.active");
      var styleKey =
        stEl && stEl.getAttribute("data-poster-style") ? stEl.getAttribute("data-poster-style") : "warm";
      var rEl = document.querySelector(".b-poster-ratio.active");
      var ratioRaw =
        rEl && rEl.getAttribute("data-poster-ratio") ? rEl.getAttribute("data-poster-ratio") : "3-4";
      var ratioClass = ratioRaw.replace(/-/g, "");
      var outScene = document.getElementById("b-poster-out-scene");
      var outTitle = document.getElementById("b-poster-out-title");
      var outSub = document.getElementById("b-poster-out-sub");
      var outPromo = document.getElementById("b-poster-out-promo");
      var outBrand = document.getElementById("b-poster-out-brand");
      if (outScene) outScene.textContent = sceneLabels[scKey] || scKey;
      if (outTitle) outTitle.textContent = title;
      if (outSub) {
        outSub.textContent = sub;
        outSub.style.display = sub ? "block" : "none";
      }
      if (outPromo) outPromo.textContent = promo;
      if (outBrand) {
        outBrand.textContent = brand;
        outBrand.style.display = brand ? "block" : "none";
      }
      box.className =
        "b-poster-result b-poster-result--style-" +
        styleKey +
        " b-poster-result--ar-" +
        ratioClass;
      lastPosterSnap = {
        sceneKey: scKey,
        sceneLabel: sceneLabels[scKey] || scKey,
        title: title,
        sub: sub,
        promo: promo,
        brand: brand,
        styleKey: styleKey,
        ratioRaw: ratioRaw,
        ratioClass: ratioClass,
      };
      wrap.style.display = "block";
      syncPosterWatermark();
      var ph = document.getElementById("b-poster-save-hint");
      if (ph) ph.style.display = "none";
    });

    var posterSaveBtn = document.getElementById("b-poster-save");
    if (posterSaveBtn) {
      posterSaveBtn.addEventListener("click", function () {
        if (!lastPosterSnap) {
          alert("请先生成海报预览，再保存。");
          return;
        }
        if (typeof window.kykwPosterLibraryRead !== "function" || typeof window.kykwPosterLibraryWrite !== "function") {
          return;
        }
        var list = window.kykwPosterLibraryRead();
        var applyShare = document.getElementById("b-poster-apply-share");
        var wantShare = !!(applyShare && applyShare.checked);
        list.unshift({
          id: "poster-" + Date.now(),
          createdAt: Date.now(),
          deleted: false,
          snap: lastPosterSnap,
          inSharePool: wantShare,
          shareAudit: wantShare ? "pending" : "none",
        });
        window.kykwPosterLibraryWrite(list);
        var hint = document.getElementById("b-poster-save-hint");
        if (hint) {
          hint.style.display = "block";
          hint.textContent =
            "已保存到本地（演示数据在本机浏览器，海报类共 " + list.filter(function (x) { return !x.deleted; }).length + " 条，可在分享库查看）。";
          setTimeout(function () {
            if (hint) hint.style.display = "none";
          }, 3200);
        }
        if (typeof window.kykwRenderPosterLibrary === "function") {
          window.kykwRenderPosterLibrary();
        }
      });
    }
    var posterShareBtn = document.getElementById("b-poster-share");
    if (posterShareBtn) {
      posterShareBtn.addEventListener("click", function () {
        if (typeof window.kykwShareLibraryGo === "function") {
          window.kykwShareLibraryGo("poster");
        } else {
          window.goScreen("b-share-library");
        }
      });
    }
  })();

  (function kykwDhConfigInit() {
    var root = document.getElementById("b-digital-human");
    if (!root) return;
    var sumEl = document.getElementById("b-dh-summary");
    var L = {
      gender: { female: "女", male: "男" },
      age: { young: "少年 / 青年", middle: "中年", senior: "老年" },
      persona: { warm: "亲和温柔", pro: "专业严谨", fun: "活泼幽默", calm: "沉稳可信" },
      look: { A: "模板 A · 店小二", B: "模板 B · 主厨", up: "上传定制形象" },
      script: { "from-video": "引用讲解视频文案", live: "在线即兴输入" },
    };
    function pickActive(group) {
      var a = root.querySelector('.b-dh-opt[data-dh="' + group + '"].active');
      return a && a.getAttribute("data-dh-val") ? a.getAttribute("data-dh-val") : "";
    }
    function lab(table, key) {
      return (table && table[key]) || key || "—";
    }
    function updateDhSummary() {
      if (!sumEl) return;
      var g = pickActive("gender");
      var age = pickActive("age");
      var p = pickActive("persona");
      var lk = pickActive("look");
      var sc = pickActive("script");
      var voice = (document.getElementById("b-dh-voice") || {}).value || "";
      var speed = (document.getElementById("b-dh-speed") || {}).value || "";
      var scene = (document.getElementById("b-dh-scene") || {}).value || "";
      var skuEl = document.getElementById("b-dh-sku");
      var skuTxt = skuEl && skuEl.options[skuEl.selectedIndex] ? skuEl.options[skuEl.selectedIndex].text : "";
      var voiceTxt = "";
      if (voice === "soft") voiceTxt = "轻柔";
      else if (voice === "bright") voiceTxt = "明亮促单";
      else if (voice === "deep") voiceTxt = "低沉官宣";
      else if (voice === "clone") voiceTxt = "声音克隆";
      var speedTxt = speed === "slow" ? "偏慢" : speed === "fast" ? "偏快" : "标准";
      var sceneTxt = scene === "live" ? "直播间" : scene === "ad" ? "信息流广告" : "商品详情短片";
      sumEl.textContent =
        lab(L.gender, g) +
        " · " +
        lab(L.age, age) +
        " · " +
        lab(L.persona, p) +
        "；形象 " +
        lab(L.look, lk) +
        "；音色 " +
        voiceTxt +
        " · 语速 " +
        speedTxt +
        " · 场景 " +
        sceneTxt +
        "；橱窗 " +
        skuTxt +
        "；脚本 " +
        lab(L.script, sc) +
        "。";
    }
    root.querySelectorAll(".b-dh-opt").forEach(function (btn) {
      btn.addEventListener("click", function () {
        var g = btn.getAttribute("data-dh");
        if (!g) return;
        root.querySelectorAll('.b-dh-opt[data-dh="' + g + '"]').forEach(function (b) {
          b.classList.remove("active");
        });
        btn.classList.add("active");
        updateDhSummary();
      });
    });
    ["b-dh-voice", "b-dh-speed", "b-dh-scene", "b-dh-sku"].forEach(function (id) {
      var el = document.getElementById(id);
      if (el) el.addEventListener("change", updateDhSummary);
    });
    updateDhSummary();
  })();

  var dhRender = document.getElementById("b-dh-render");
  var dhStatus = document.getElementById("b-dh-status");
  if (dhRender && dhStatus) {
    dhRender.addEventListener("click", function () {
      dhStatus.style.display = "block";
      dhStatus.innerHTML = "<strong>渲染中…</strong> · 请勿关闭页面";
      setTimeout(function () {
        dhStatus.innerHTML =
          "<strong>预览就绪</strong> · 可下载 720P 样片或推送到直播间";
      }, 1600);
    });
  }

  /** 描述性文案输入 · 语音转文字（Chrome / Edge 等，需麦克风与 HTTPS 或 localhost） */
  (function kykwVoiceInputInit() {
    var btns = document.querySelectorAll(".kykw-voice-btn[data-kykw-voice-for]");
    if (!btns.length) return;

    var SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognition) {
      btns.forEach(function (b) {
        b.disabled = true;
        b.title = "当前浏览器不支持语音识别（请使用 Chrome / Edge）";
      });
      return;
    }

    var rec = new SpeechRecognition();
    rec.lang = "zh-CN";
    rec.continuous = true;
    rec.interimResults = false;

    var listening = false;
    var activeTargetId = null;
    var activeBtn = null;

    function appendToEl(el, text) {
      if (!el || !text) return;
      var t = String(text).trim();
      if (!t) return;
      var cur = el.value != null ? String(el.value) : "";
      if (cur && !/\s$/.test(cur)) cur += " ";
      el.value = cur + t;
      try {
        el.dispatchEvent(new Event("input", { bubbles: true }));
      } catch (e) {}
    }

    function clearRecordingUi() {
      listening = false;
      activeTargetId = null;
      activeBtn = null;
      document.querySelectorAll(".kykw-voice-btn.is-recording").forEach(function (b) {
        b.classList.remove("is-recording");
      });
    }

    rec.onresult = function (ev) {
      var el =
        activeTargetId && document.getElementById(activeTargetId)
          ? document.getElementById(activeTargetId)
          : null;
      for (var i = ev.resultIndex; i < ev.results.length; i++) {
        if (ev.results[i].isFinal) {
          appendToEl(el, ev.results[i][0].transcript);
        }
      }
    };

    rec.onerror = function (ev) {
      clearRecordingUi();
      if (ev.error === "not-allowed") {
        alert("麦克风权限被拒绝，请在浏览器设置中允许本站访问麦克风。");
      } else if (ev.error === "no-speech") {
        /* ignore */
      }
    };

    rec.onend = function () {
      clearRecordingUi();
    };

    btns.forEach(function (btn) {
      btn.addEventListener("click", function () {
        var tid = btn.getAttribute("data-kykw-voice-for");
        if (!tid) return;
        var el = document.getElementById(tid);
        if (!el || (el.tagName !== "TEXTAREA" && el.tagName !== "INPUT")) return;

        if (btn.classList.contains("is-recording")) {
          try {
            rec.stop();
          } catch (e1) {}
          return;
        }

        if (listening) {
          try {
            rec.stop();
          } catch (e2) {}
        }

        activeTargetId = tid;
        activeBtn = btn;
        try {
          rec.start();
          listening = true;
          document.querySelectorAll(".kykw-voice-btn.is-recording").forEach(function (b) {
            b.classList.remove("is-recording");
          });
          btn.classList.add("is-recording");
        } catch (e3) {
          clearRecordingUi();
          alert("无法启动语音识别，请检查麦克风或稍后重试。");
        }
      });
    });
  })();
})();
