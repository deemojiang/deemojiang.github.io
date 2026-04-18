/**
 * 物业问题反馈原型 — 左栏导航切换 + 用户端表单校验
 */
(function () {
  var screens = document.querySelectorAll(".screen");
  var links = document.querySelectorAll(".sitemap a.nav-link");
  var phoneWrap = document.getElementById("preview-phone-wrap");
  var pcWrap = document.getElementById("preview-pc-wrap");
  var billboardWrap = document.getElementById("preview-billboard-wrap");
  var titleEl = document.getElementById("preview-screen-title");
  var badgeEl = document.getElementById("preview-badge");

  function setDevice(device) {
    if (!phoneWrap || !pcWrap) return;
    var isBillboard = device === "billboard";
    if (isBillboard) {
      phoneWrap.classList.add("is-hidden");
      pcWrap.classList.add("is-hidden");
      if (billboardWrap) billboardWrap.classList.remove("is-hidden");
      return;
    }
    if (billboardWrap) billboardWrap.classList.add("is-hidden");
    var isPc = device === "pc";
    phoneWrap.classList.toggle("is-hidden", isPc);
    pcWrap.classList.toggle("is-hidden", !isPc);
  }

  function showScreen(id) {
    screens.forEach(function (s) {
      s.classList.toggle("active", s.id === id);
    });
    links.forEach(function (a) {
      var href = a.getAttribute("href");
      var target = href && href.indexOf("#") === 0 ? href.slice(1) : "";
      a.classList.toggle("active", target === id);
    });

    var activeLink = document.querySelector('.sitemap a.nav-link[href="#' + id + '"]');
    if (activeLink) {
      var device = activeLink.getAttribute("data-device") || "phone";
      setDevice(device);
      if (titleEl) {
        titleEl.textContent = activeLink.textContent.replace(/^\d+\.\s*/, "");
      }
      if (badgeEl) {
        var sec = activeLink.closest(".sitemap-section");
        if (sec) {
          if (sec.classList.contains("user")) {
            badgeEl.textContent = "用户端";
            badgeEl.className = "role-badge user";
          } else if (sec.classList.contains("admin-m")) {
            badgeEl.textContent = "管理端 · 手机";
            badgeEl.className = "role-badge admin-m";
          } else if (sec.classList.contains("admin-pc")) {
            badgeEl.textContent = "管理端 · 电脑";
            badgeEl.className = "role-badge admin-pc";
          } else if (sec.classList.contains("promo")) {
            badgeEl.textContent = "宣传物料";
            badgeEl.className = "role-badge promo";
          }
        }
      }
    }
    try {
      history.replaceState(null, "", "#" + id);
    } catch (e) {}
  }

  function navigateTo(id) {
    if (!document.getElementById(id)) return;
    if (id === "pc-detail") {
      goPcDetail("shunt");
      return;
    }
    if (id === "m-detail-zjj") {
      goMDetailZjj("pending");
      return;
    }
    showScreen(id);
  }

  window.goScreen = navigateTo;

  window.goHandleBack = function () {
    var el = document.getElementById("m-handle-town");
    var t = el && el.getAttribute("data-back");
    navigateTo(t || "m-detail-town");
  };

  window.goPcDetail = function (mode) {
    var d = document.getElementById("pc-detail");
    if (!d) return;
    var m = mode || "shunt";
    d.classList.remove("pc-detail--shunt", "pc-detail--todo", "pc-detail--done");
    d.classList.add("pc-detail--" + m);

    var title = document.getElementById("pc-detail-title");
    var sub = document.getElementById("pc-detail-subtitle");
    var desc = document.getElementById("pc-detail-desc");
    var street = document.getElementById("pc-detail-street");
    var community = document.getElementById("pc-detail-community");
    var phone = document.getElementById("pc-detail-phone");
    var doneExtra = document.querySelector("#pc-detail .pc-detail-done-extra");

    var aShunt = d.querySelector(".pc-detail-actions--shunt");
    var aTodo = d.querySelector(".pc-detail-actions--todo");
    var statusDone = d.querySelector(".pc-detail-status--done");
    if (aShunt) aShunt.hidden = m !== "shunt";
    if (aTodo) aTodo.hidden = m !== "todo";
    if (statusDone) statusDone.hidden = m !== "done";

    var fShunt = d.querySelector(".pc-detail-flow--shunt");
    var fTodo = d.querySelector(".pc-detail-flow--todo");
    var fDone = d.querySelector(".pc-detail-flow--done");
    if (fShunt) fShunt.hidden = m !== "shunt";
    if (fTodo) fTodo.hidden = m !== "todo";
    if (fDone) fDone.hidden = m !== "done";

    d.querySelectorAll(".pc-detail-row--person").forEach(function (el) {
      el.hidden = m === "todo";
    });
    d.querySelectorAll(".pc-detail-row--imgs").forEach(function (el) {
      el.hidden = m === "todo";
    });
    if (doneExtra) doneExtra.hidden = m !== "done";

    if (title && sub && desc && street && community && phone) {
      if (m === "todo") {
        title.textContent = "工单详情 · W20260417088";
        sub.textContent = "当前状态：处理中";
        desc.textContent = "楼道堆物严重，多次向物业反映未清理，影响通行与消防。";
        street.textContent = "雉城街道";
        community.textContent = "阳光苑";
        phone.textContent = "159****0234";
      } else if (m === "done") {
        title.textContent = "工单详情 · W20260415002";
        sub.textContent = "当前状态：已办结（仅查看）";
        desc.textContent = "电梯运行时有异响，影响住户出行，已多次报修。";
        street.textContent = "其他";
        community.textContent = "某小区";
        phone.textContent = "136****8899";
      } else {
        title.textContent = "工单详情 · W20260418001";
        sub.textContent = "当前状态：待分派 · 可分派至街道或自办";
        desc.textContent = "地下车库照明多处损坏已久，物业未及时修复，夜间出行存在安全隐患。";
        street.textContent = "太湖街道";
        community.textContent = "某花园小区";
        phone.textContent = "138****5678";
      }
    }

    showScreen("pc-detail");
  };

  /**
   * 住建手机端详情：pending = 待分派可操作；done = 已办结仅查看（隐藏分派/自办）
   * @param {string} mode
   * @param {string} [ticketKey] done 时可选 w20260410021 | w20260415002
   */
  window.goMDetailZjj = function (mode, ticketKey) {
    var root = document.getElementById("m-detail-zjj");
    if (!root) return;
    var m = mode || "pending";
    root.classList.remove("m-detail-zjj--pending", "m-detail-zjj--done");
    root.classList.add("m-detail-zjj--" + m);

    var actions = document.getElementById("m-detail-zjj-actions");
    if (actions) actions.hidden = m === "done";

    var fp = root.querySelector(".m-detail-zjj-flow--pending");
    var fd = root.querySelector(".m-detail-zjj-flow--done");
    if (fp) fp.hidden = m !== "pending";
    if (fd) fd.hidden = m !== "done";

    var qp = root.querySelector(".m-detail-zjj-qa--pending");
    var qd = root.querySelector(".m-detail-zjj-qa--done");
    if (qp) qp.hidden = m !== "pending";
    if (qd) qd.hidden = m !== "done";

    if (m === "done" && qd) {
      var key = ticketKey || "w20260415002";
      var blockGreen = qd.querySelector('[data-mzjj-done="w20260410021"]');
      var blockElev = qd.querySelector('[data-mzjj-done="w20260415002"]');
      if (blockGreen) blockGreen.hidden = key !== "w20260410021";
      if (blockElev) blockElev.hidden = key !== "w20260415002";
    }

    showScreen("m-detail-zjj");
  };

  links.forEach(function (a) {
    a.addEventListener("click", function (e) {
      e.preventDefault();
      var id = a.getAttribute("href").slice(1);
      navigateTo(id);
    });
  });

  var hash = location.hash.slice(1);
  if (hash && document.getElementById(hash)) {
    navigateTo(hash);
  } else {
    navigateTo("u-form");
  }

  /* --- 窄屏：侧栏抽屉开关 --- */
  (function () {
    var mq = window.matchMedia("(max-width: 768px)");
    var body = document.body;
    var toggle = document.getElementById("mobile-nav-toggle");
    var closeBtn = document.getElementById("sitemap-close");
    var backdrop = document.getElementById("sitemap-backdrop");

    function closeSitemap() {
      body.classList.remove("sitemap-open");
      if (toggle) toggle.setAttribute("aria-expanded", "false");
    }

    function openSitemap() {
      if (!mq.matches) return;
      body.classList.add("sitemap-open");
      if (toggle) toggle.setAttribute("aria-expanded", "true");
    }

    function toggleSitemap() {
      if (body.classList.contains("sitemap-open")) closeSitemap();
      else openSitemap();
    }

    if (toggle) toggle.addEventListener("click", toggleSitemap);
    if (closeBtn) closeBtn.addEventListener("click", closeSitemap);
    if (backdrop) backdrop.addEventListener("click", closeSitemap);

    document.addEventListener("keydown", function (e) {
      if (e.key === "Escape") closeSitemap();
    });

    function onMqChange() {
      if (!mq.matches) closeSitemap();
    }
    if (mq.addEventListener) mq.addEventListener("change", onMqChange);
    else if (mq.addListener) mq.addListener(onMqChange);

    var panel = document.getElementById("sitemap-panel");
    if (panel) {
      panel.querySelectorAll("a.nav-link, .sitemap-doc-link").forEach(function (a) {
        a.addEventListener("click", function () {
          if (mq.matches) closeSitemap();
        });
      });
    }
  })();

  /* --- 移动端图片上传（方格 + 添加），可复用 --- */
  var MAX_IMAGES = 9;

  function createMobileUploader(opts) {
    var pickedImages = [];
    var pickedUrls = [];
    var grid = document.getElementById(opts.gridId);
    var fileInput = document.getElementById(opts.inputId);
    var extraAddClass = opts.addButtonExtraClass || "";

    function revokeAll() {
      pickedUrls.forEach(function (u) {
        try {
          URL.revokeObjectURL(u);
        } catch (e) {}
      });
      pickedUrls = [];
    }

    function render() {
      if (!grid || !fileInput) return;
      revokeAll();
      grid.innerHTML = "";

      pickedImages.forEach(function (file, idx) {
        var url = URL.createObjectURL(file);
        pickedUrls.push(url);
        var cell = document.createElement("div");
        cell.className = "upload-m-thumb";
        cell.innerHTML =
          '<img src="' +
          url +
          '" alt=""/>' +
          '<button type="button" class="upload-m-remove" data-idx="' +
          idx +
          '" aria-label="删除">×</button>';
        grid.appendChild(cell);
      });

      if (pickedImages.length < MAX_IMAGES) {
        var addBtn = document.createElement("button");
        addBtn.type = "button";
        addBtn.className = "upload-m-add" + (extraAddClass ? " " + extraAddClass : "");
        addBtn.setAttribute("aria-label", "添加图片");
        addBtn.innerHTML = '<span class="upload-m-add__plus">+</span><span class="upload-m-add__txt">添加</span>';
        addBtn.addEventListener("click", function () {
          fileInput.click();
        });
        grid.appendChild(addBtn);
      }

      grid.querySelectorAll(".upload-m-remove").forEach(function (btn) {
        btn.addEventListener("click", function () {
          var i = parseInt(btn.getAttribute("data-idx"), 10);
          if (!isNaN(i)) {
            pickedImages.splice(i, 1);
            render();
          }
        });
      });
    }

    if (fileInput) {
      fileInput.addEventListener("change", function () {
        var files = fileInput.files;
        for (var i = 0; i < files.length && pickedImages.length < MAX_IMAGES; i++) {
          var f = files[i];
          if (!f.type.match(/^image\//)) continue;
          pickedImages.push(f);
        }
        fileInput.value = "";
        render();
      });
    }

    return {
      render: render,
      clear: function () {
        pickedImages = [];
        revokeAll();
        render();
      },
    };
  }

  var uploaderUser = createMobileUploader({ gridId: "upload-m-grid", inputId: "images", addButtonExtraClass: "" });
  var uploaderHandle = createMobileUploader({
    gridId: "upload-m-grid-handle",
    inputId: "images-handle",
    addButtonExtraClass: "upload-m-add--admin",
  });

  var form = document.getElementById("feedback-form");
  if (form) {
    form.addEventListener("submit", function (e) {
      e.preventDefault();
      var streetEl = document.getElementById("street");
      var street = streetEl && streetEl.value;
      if (!street) {
        alert("请选择所在街道。");
        return;
      }
      var desc = document.getElementById("problem-desc");
      var community = document.getElementById("community");
      if (!desc || !String(desc.value || "").trim()) {
        alert("请填写问题描述。");
        return;
      }
      if (!community || !String(community.value || "").trim()) {
        alert("请填写小区名称。");
        return;
      }
      navigateTo("u-success");
    });
  }

  var btnAnother = document.getElementById("btn-another");
  if (btnAnother) {
    btnAnother.addEventListener("click", function () {
      var f = document.getElementById("feedback-form");
      if (f) f.reset();
      uploaderUser.clear();
      navigateTo("u-form");
    });
  }

  uploaderUser.render();
  uploaderHandle.render();

  /* 手机 / PC 列表：待办 | 已办 */
  document.querySelectorAll(".m-tabs").forEach(function (root) {
    root.querySelectorAll(".m-tab").forEach(function (tab) {
      tab.addEventListener("click", function () {
        var panelId = tab.getAttribute("data-panel");
        if (!panelId) return;
        var shell = tab.closest(".screen-body") || tab.closest(".pc-content");
        if (!shell) return;
        shell.querySelectorAll(".m-list-panel").forEach(function (p) {
          p.hidden = p.id !== panelId;
        });
        root.querySelectorAll(".m-tab").forEach(function (t) {
          t.classList.toggle("active", t === tab);
        });
      });
    });
  });

  /* 电脑端首页：按日 / 按月 */
  document.querySelectorAll(".dash-scope-tab").forEach(function (tab) {
    tab.addEventListener("click", function () {
      var pid = tab.getAttribute("data-dash-panel");
      if (!pid) return;
      document.querySelectorAll(".dash-scope-tab").forEach(function (t) {
        t.classList.toggle("active", t === tab);
      });
      document.querySelectorAll(".dash-scope-panel").forEach(function (p) {
        p.hidden = p.id !== pid;
      });
    });
  });

  function wireModal(openBtnId, modalId) {
    var openBtn = document.getElementById(openBtnId);
    var modal = document.getElementById(modalId);
    if (!openBtn || !modal) return;
    openBtn.addEventListener("click", function () {
      modal.classList.add("is-open");
    });
    modal.querySelectorAll("[data-close-modal]").forEach(function (el) {
      el.addEventListener("click", function () {
        modal.classList.remove("is-open");
      });
    });
    modal.addEventListener("click", function (e) {
      if (e.target === modal) modal.classList.remove("is-open");
    });
  }

  wireModal("open-assign-zjj", "modal-assign-m");
  wireModal("open-assign-pc", "modal-assign-pc");

  var confirmAssignZjj = document.getElementById("confirm-assign-zjj");
  var modalAssignM = document.getElementById("modal-assign-m");
  if (confirmAssignZjj && modalAssignM) {
    confirmAssignZjj.addEventListener("click", function () {
      modalAssignM.classList.remove("is-open");
      navigateTo("m-detail-town");
    });
  }

  var btnHandleDone = document.getElementById("btn-handle-done");
  if (btnHandleDone) {
    btnHandleDone.addEventListener("click", function () {
      navigateTo("m-list-zjj");
      requestAnimationFrame(function () {
        var tab = document.querySelector("#m-list-zjj .m-tab[data-panel='m-list-zjj-p-done']");
        if (tab) tab.click();
      });
    });
  }

  var btnPcHandle = document.getElementById("btn-pc-handle");
  if (btnPcHandle) {
    btnPcHandle.addEventListener("click", function () {
      alert("演示：办理流程与手机端一致，提交后节点进入「办结」。");
    });
  }

  function applyPcListFilters() {
    var root = document.getElementById("pc-list");
    if (!root) return;
    var panel = root.querySelector(".m-list-panel:not([hidden])");
    if (!panel) return;
    var kwEl = document.getElementById("pc-list-kw");
    var stEl = document.getElementById("pc-list-f-status");
    var srEl = document.getElementById("pc-list-f-street");
    var kw = kwEl ? String(kwEl.value || "").trim().toLowerCase() : "";
    var st = stEl ? stEl.value || "all" : "all";
    var street = srEl ? srEl.value || "all" : "all";
    panel.querySelectorAll("tbody tr[data-ticket]").forEach(function (tr) {
      var ok = true;
      var search = (tr.getAttribute("data-search") || "").toLowerCase();
      if (kw && search.indexOf(kw) === -1) ok = false;
      if (st !== "all" && tr.getAttribute("data-status") !== st) ok = false;
      if (street !== "all" && tr.getAttribute("data-street") !== street) ok = false;
      tr.hidden = !ok;
    });
  }

  function wireListFilters() {
    var pcKw = document.getElementById("pc-list-kw");
    var pcSt = document.getElementById("pc-list-f-status");
    var pcSr = document.getElementById("pc-list-f-street");
    var pcReset = document.getElementById("pc-list-filter-reset");
    if (pcKw) pcKw.addEventListener("input", applyPcListFilters);
    if (pcSt) pcSt.addEventListener("change", applyPcListFilters);
    if (pcSr) pcSr.addEventListener("change", applyPcListFilters);
    if (pcReset) {
      pcReset.addEventListener("click", function () {
        if (pcKw) pcKw.value = "";
        if (pcSt) pcSt.value = "all";
        if (pcSr) pcSr.value = "all";
        document.querySelectorAll("#pc-list tbody tr[data-ticket]").forEach(function (tr) {
          tr.hidden = false;
        });
        applyPcListFilters();
      });
    }

    document.querySelectorAll("#pc-list .m-tab").forEach(function (tab) {
      tab.addEventListener("click", function () {
        setTimeout(applyPcListFilters, 0);
      });
    });
  }

  wireListFilters();
})();
