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
    if (id === "b-video-share-pool" && typeof window.kykwRenderVideoPoolList === "function") {
      window.kykwRenderVideoPoolList();
    }
    if (id === "b-copy-library" && typeof window.kykwRenderCopyLibrary === "function") {
      window.kykwRenderCopyLibrary();
    }
    if (id === "b-rag-cs" && typeof window.kykwRagOnScreenShow === "function") {
      window.kykwRagOnScreenShow();
    }
  }

  window.goScreen = navigateTo;

  /** 已生成视频列表 + 用户分享随机池（localStorage 演示） */
  (function kykwVideoPoolInit() {
    var KEY = "kykw_merchant_video_pool";
    window.kykwVideoPoolRead = function () {
      try {
        var raw = localStorage.getItem(KEY);
        return raw ? JSON.parse(raw) : [];
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
        return x.inSharePool;
      });
    };
    window.kykwRenderVideoPoolList = function () {
      var listEl = document.getElementById("b-vpool-list");
      var emptyEl = document.getElementById("b-vpool-empty");
      if (!listEl) return;
      var items = window.kykwVideoPoolRead();
      listEl.innerHTML = "";
      if (!items.length) {
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
            return x.id === vid;
          })[0];
          if (found) {
            found.inSharePool = !!t.checked;
            window.kykwVideoPoolWrite(arr);
          }
        });
      }
      items.forEach(function (item) {
        var li = document.createElement("li");
        li.className = "b-vpool-item";
        var d = new Date(item.createdAt);
        var ds = !isNaN(d.getTime()) ? d.toLocaleString() : "";
        li.innerHTML =
          '<div class="b-vpool-item__thumb" aria-hidden="true">▶</div>' +
          '<div class="b-vpool-item__body">' +
          '<p class="b-vpool-item__title"></p>' +
          '<p class="b-vpool-item__meta"></p>' +
          '<p class="b-vpool-item__time"></p></div>' +
          '<label class="b-vpool-item__share"><input type="checkbox" class="b-vpool-share-cb" />分享菜单</label>';
        var cb = li.querySelector(".b-vpool-share-cb");
        if (cb) {
          cb.setAttribute("data-vid", String(item.id));
          cb.checked = !!item.inSharePool;
        }
        li.querySelector(".b-vpool-item__title").textContent = item.title || "未命名成片";
        li.querySelector(".b-vpool-item__meta").textContent = item.summary || "";
        li.querySelector(".b-vpool-item__time").textContent = ds ? "保存于 " + ds : "";
        listEl.appendChild(li);
      });
    };
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
            inSharePool: true,
            createdAt: ts - 86400000,
          },
          {
            id: "demo-" + ts + "-2",
            title: "招牌醉虾·快闪促销",
            summary: "促销快闪 · 16:9 · 横屏 · 15秒",
            inSharePool: true,
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

    function buildCopyText(scene, topic, tone, len) {
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
      return body.replace(/\n{3,}/g, "\n\n").trim();
    }

    function buildShareImageSpecs(topic, scene, tone) {
      var t = (topic || "招牌推荐").trim();
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
        { ratioLabel: "1:1 主图", caption: t, gradient: g1, layout: "sq" },
        { ratioLabel: "4:3 横图", caption: sceneTag + " · " + t, gradient: g2, layout: "wide" },
        { ratioLabel: "9:16 竖图", caption: "今日推荐", gradient: g3, layout: "story", subCaption: t },
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
    window.kykwCopyLibraryRead = function () {
      try {
        var raw = localStorage.getItem(KEY);
        return raw ? JSON.parse(raw) : [];
      } catch (e) {
        return [];
      }
    };
    window.kykwCopyLibraryWrite = function (arr) {
      try {
        localStorage.setItem(KEY, JSON.stringify(arr));
      } catch (e) {}
    };
    window.kykwRenderCopyLibrary = function () {
      var listEl = document.getElementById("b-copy-lib-list");
      var emptyEl = document.getElementById("b-copy-lib-empty");
      if (!listEl) return;
      var items = window.kykwCopyLibraryRead();
      listEl.innerHTML = "";
      if (!items.length) {
        if (emptyEl) emptyEl.style.display = "block";
        return;
      }
      if (emptyEl) emptyEl.style.display = "none";
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
          '<div class="b-copy-feed__images"></div>';

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
    var saveBtn = document.getElementById("b-copy-btn-save");
    var topicEl = document.getElementById("b-copy-topic");
    var resultEl = document.getElementById("b-copy-result");
    var saveHint = document.getElementById("b-copy-save-hint");
    if (genBtn && resultEl) {
      genBtn.addEventListener("click", function () {
        var topic = (topicEl && topicEl.value ? topicEl.value : "").trim();
        var scene = copyLibSceneKey();
        var tone = copyLibToneKey();
        var len = copyLibLenKey();
        resultEl.value = buildCopyText(scene, topic, tone, len);
        renderShareImages(buildShareImageSpecs(topic, scene, tone));
        if (saveHint) saveHint.style.display = "none";
      });
    }
    if (saveBtn && resultEl) {
      saveBtn.addEventListener("click", function () {
        var body = (resultEl.value || "").trim();
        if (!body) return;
        var topic = (topicEl && topicEl.value ? topicEl.value : "").trim();
        var scene = copyLibSceneKey();
        var tone = copyLibToneKey();
        var len = copyLibLenKey();
        var titleLine = body.split(/\r?\n/)[0].replace(/^【.+?】\s*/, "").trim();
        var title = topic || (titleLine.length > 36 ? titleLine.slice(0, 36) + "…" : titleLine) || "分享文案";
        var arr = window.kykwCopyLibraryRead();
        var imgs = lastShareImages.length ? lastShareImages : buildShareImageSpecs(topic, scene, tone);
        arr.unshift({
          id: "copy-" + Date.now(),
          scene: scene,
          tone: tone,
          len: len,
          title: title,
          body: body,
          shareImages: imgs,
          createdAt: Date.now(),
        });
        window.kykwCopyLibraryWrite(arr);
        if (saveHint) {
          saveHint.style.display = "block";
          setTimeout(function () {
            if (saveHint) saveHint.style.display = "none";
          }, 3500);
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
            createdAt: ts - 3600000,
          }
        );
        window.kykwCopyLibraryWrite(arr);
        window.kykwRenderCopyLibrary();
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

  /** 推广中心：带 data-promote-toast 的入口点击演示提示 */
  var promoteToastEl = document.getElementById("promote-toast");
  var promoteToastTimer = null;
  window.showPromoteToast = function (msg) {
    if (!promoteToastEl || !msg) return;
    promoteToastEl.textContent = msg;
    promoteToastEl.hidden = false;
    if (promoteToastTimer) clearTimeout(promoteToastTimer);
    promoteToastTimer = setTimeout(function () {
      promoteToastEl.hidden = true;
    }, 2600);
  };
  var promoteSheet = document.querySelector(".promote-sheet");
  if (promoteSheet) {
    promoteSheet.addEventListener("click", function (e) {
      var btn = e.target.closest("[data-promote-toast]");
      if (!btn) return;
      var msg = btn.getAttribute("data-promote-toast");
      if (msg) window.showPromoteToast(msg);
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
  var cVideoSourceLine = document.getElementById("c-video-result-source");
  var cVideoMetaLine = document.getElementById("c-video-result-meta");
  if (btnGenVideo && cVideoProgress && cVideoResult) {
    btnGenVideo.addEventListener("click", () => {
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

  const btnGenPoster = document.getElementById("c-btn-generate-poster");
  const cPosterPlaceholder = document.getElementById("c-poster-placeholder");
  const cPosterResult = document.getElementById("c-poster-result");
  if (btnGenPoster && cPosterPlaceholder && cPosterResult) {
    btnGenPoster.addEventListener("click", () => {
      cPosterPlaceholder.style.display = "none";
      cPosterResult.style.display = "block";
    });
  }

  /** 商家：AI 宣传视频 · 五步向导 */
  (function mVideoGenWizard() {
    var root = document.getElementById("b-video-gen");
    if (!root) return;

    var STYLE_LABEL = { warm: "温馨种草", flash: "促销快闪", minimal: "极简高级感" };
    var RATIO_LABEL = { "1-1": "1:1", "4-3": "4:3", "16-9": "16:9" };
    var ORIENT_LABEL = { portrait: "竖屏", landscape: "横屏" };

    function vgUpdateStepper(n) {
      root.querySelectorAll(".b-vg-stepper__item").forEach(function (el, i) {
        var step = i + 1;
        el.classList.remove("active", "done");
        if (step < n) el.classList.add("done");
        if (step === n) el.classList.add("active");
      });
    }

    function vgShowStep(n) {
      for (var i = 1; i <= 5; i++) {
        var p = document.getElementById("m-vg-step-" + i);
        if (p) p.style.display = i === n ? "block" : "none";
      }
      vgUpdateStepper(n);
      try {
        root.querySelector(".screen-body").scrollTop = 0;
      } catch (e) {}
    }

    function vgGetActiveStyleKey() {
      var a = root.querySelector(".b-vg-option[data-vg-style].active");
      return a ? a.getAttribute("data-vg-style") : "warm";
    }
    function vgGetActiveRatioKey() {
      var a = root.querySelector(".b-vg-option[data-vg-ratio].active");
      return a ? a.getAttribute("data-vg-ratio") : "1-1";
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

    window.mVgResetWizard = function () {
      var w = document.getElementById("m-gen-wait");
      var rw = document.getElementById("m-vg-revise-wait");
      if (w) w.style.display = "none";
      if (rw) rw.style.display = "none";
      var bar = document.getElementById("m-vg-progress-bar");
      if (bar) bar.style.width = "0%";
      var note = document.getElementById("m-vg-revise-note");
      if (note) note.value = "";
      var saveHint = document.getElementById("m-vg-save-pool-hint");
      if (saveHint) saveHint.style.display = "none";
      var extraNote = document.getElementById("m-vg-extra-note");
      if (extraNote) extraNote.value = "";
      var fi = document.getElementById("m-vg-file-input");
      if (fi) fi.value = "";
      mVgRefreshFileList();
      vgShowStep(1);
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

    root.addEventListener("click", function (e) {
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

    var btnScript = document.getElementById("m-vg-gen-script");
    var taScript = document.getElementById("m-vg-script-body");
    if (btnScript && taScript) {
      btnScript.addEventListener("click", function () {
        var pn = document.getElementById("m-vg-product-name");
        var sn = document.getElementById("m-vg-store-name");
        var name = pn ? pn.value.trim() : "本品";
        var store = sn ? sn.value.trim() : "本店";
        taScript.value =
          "【开场】品牌卡：" +
          store +
          "｜主推 " +
          name +
          "\n【镜头1】开箱/装盘，字幕「现做·限售」\n【镜头2】质感特写 + ASMR 收声，旁白突出「鲜甜、花雕香」\n【镜头3】店员口播 CTA：到店/外卖双渠道，限时福利见小黄字\n【尾板】LOGO + 地址条，时长约 28s，留 1s 落版。";
      });
    }

    var btnRender = document.getElementById("m-vg-run-render");
    var genWait = document.getElementById("m-gen-wait");
    var waitSummary = document.getElementById("m-vg-wait-summary");
    var progBar = document.getElementById("m-vg-progress-bar");
    var resultMeta = document.getElementById("m-vg-result-meta");
    if (btnRender && genWait) {
      btnRender.addEventListener("click", function () {
        if (waitSummary) waitSummary.textContent = vgSummaryLine();
        genWait.style.display = "flex";
        if (progBar) progBar.style.width = "0%";
        var t0 = Date.now();
        var tick = setInterval(function () {
          var p = Math.min(92, ((Date.now() - t0) / 2200) * 92);
          if (progBar) progBar.style.width = p + "%";
        }, 80);
        setTimeout(function () {
          clearInterval(tick);
          if (progBar) progBar.style.width = "100%";
          genWait.style.display = "none";
          if (resultMeta) {
            var dur = document.getElementById("m-vg-duration");
            var sub = document.getElementById("m-vg-sub");
            resultMeta.textContent =
              vgSummaryLine() +
              " · " +
              (dur && dur.selectedOptions[0] ? dur.selectedOptions[0].textContent : "30 秒") +
              " · " +
              (sub && sub.selectedOptions[0] ? sub.selectedOptions[0].textContent : "字幕");
          }
          vgShowStep(5);
        }, 2200);
      });
    }

    var btnRev = document.getElementById("m-vg-revise-regen");
    var revWait = document.getElementById("m-vg-revise-wait");
    if (btnRev && revWait) {
      btnRev.addEventListener("click", function () {
        revWait.style.display = "flex";
        setTimeout(function () {
          revWait.style.display = "none";
          if (resultMeta) {
            resultMeta.textContent =
              vgSummaryLine() + " · 已按修改说明重渲染（演示）· " + new Date().toLocaleTimeString();
          }
        }, 1800);
      });
    }

    var savePoolBtn = document.getElementById("m-vg-save-to-pool-btn");
    if (savePoolBtn) {
      savePoolBtn.addEventListener("click", function () {
        var titleEl = document.getElementById("m-vg-product-name");
        var title =
          titleEl && titleEl.value.trim()
            ? titleEl.value.trim()
            : "AI 宣传成片";
        var metaEl = document.getElementById("m-vg-result-meta");
        var shareCb = document.getElementById("m-vg-share-pool-check");
        var arr = window.kykwVideoPoolRead();
        arr.unshift({
          id: "v-" + Date.now(),
          title: title,
          summary: metaEl ? metaEl.textContent.trim() : "",
          inSharePool: !!(shareCb && shareCb.checked),
          createdAt: Date.now(),
        });
        window.kykwVideoPoolWrite(arr);
        var hint = document.getElementById("m-vg-save-pool-hint");
        if (hint) hint.style.display = "block";
        if (typeof window.kykwRenderVideoPoolList === "function") {
          window.kykwRenderVideoPoolList();
        }
      });
    }

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
      var title = ((document.getElementById("b-poster-title") || {}).value || "").trim() || "店铺活动";
      var sub = ((document.getElementById("b-poster-sub") || {}).value || "").trim();
      var promo = ((document.getElementById("b-poster-promo") || {}).value || "").trim() || "详情见小程序 · 欢迎到店";
      var brand = ((document.getElementById("b-poster-brand") || {}).value || "").trim();
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
        var KEY = "kykw_poster_library";
        var list = [];
        try {
          list = JSON.parse(localStorage.getItem(KEY) || "[]");
        } catch (e1) {
          list = [];
        }
        list.unshift({
          id: "poster-" + Date.now(),
          createdAt: Date.now(),
          snap: lastPosterSnap,
        });
        try {
          localStorage.setItem(KEY, JSON.stringify(list));
        } catch (e2) {}
        var hint = document.getElementById("b-poster-save-hint");
        if (hint) {
          hint.style.display = "block";
          hint.textContent = "已保存至「我的海报」（演示数据在本机浏览器，共 " + list.length + " 条）。";
          setTimeout(function () {
            if (hint) hint.style.display = "none";
          }, 3200);
        }
      });
    }
    var posterShareBtn = document.getElementById("b-poster-share");
    if (posterShareBtn) {
      posterShareBtn.addEventListener("click", function () {
        if (!lastPosterSnap) {
          alert("请先生成海报，再分享。");
          return;
        }
        if (typeof window.showPromoteToast === "function") {
          window.showPromoteToast("演示：分享 · 可生成小程序海报图 / 系统分享面板（正式版对接微信）");
        } else {
          alert("演示：正式版将支持保存相册、微信好友/朋友圈分享。");
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
})();
