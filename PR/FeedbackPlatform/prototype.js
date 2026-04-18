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
    showScreen(id);
  }

  window.goScreen = navigateTo;

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
})();
