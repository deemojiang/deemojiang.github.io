(function () {
  const toastEl = document.getElementById("toast");
  const helpDialog = document.getElementById("help");
  const helpBtn = document.getElementById("helpBtn");
  const toggleThemeBtn = document.getElementById("toggleThemeBtn");

  const state = {
    platform: "supplier",
    page: "sup-home",
    theme: "light",
  };

  const SUPPLIER_PAGES = [
    "sup-login", "sup-cert", "sup-home", "sup-products", "sup-publish",
    "sup-orders", "sup-order-detail", "sup-settlement", "sup-me"
  ];
  const RETAILER_PAGES = [
    "ret-login", "ret-cert", "ret-home", "ret-mall", "ret-store",
    "ret-product-detail", "ret-cart", "ret-checkout", "ret-orders", "ret-me"
  ];
  const SUPPLIER_TAB_PAGES = ["sup-home", "sup-products", "sup-orders", "sup-settlement", "sup-me"];
  const RETAILER_TAB_PAGES = ["ret-home", "ret-mall", "ret-cart", "ret-orders", "ret-me"];
  const TAB_FOR_PAGE = {
    "sup-order-detail": "sup-orders", "sup-publish": "sup-products", "sup-cert": "sup-me", "sup-login": "sup-home",
    "ret-store": "ret-mall", "ret-product-detail": "ret-home", "ret-checkout": "ret-cart",
    "ret-cert": "ret-me",
  };

  let toastTimer = null;

  function showToast(msg) {
    if (!toastEl) return;
    toastEl.textContent = msg;
    toastEl.hidden = false;
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => { toastEl.hidden = true; }, 1800);
  }

  function setTheme(next) {
    state.theme = next;
    document.body.dataset.theme = next === "dark" ? "dark" : "";
    if (toggleThemeBtn) {
      const t = toggleThemeBtn.querySelector(".btn__text");
      if (t) t.textContent = next === "dark" ? "深色" : "浅色";
    }
  }

  function setActiveTabbar(platform, page) {
    const activeTab = TAB_FOR_PAGE[page] || (SUPPLIER_TAB_PAGES.includes(page) ? page : null);
    const activeTabR = TAB_FOR_PAGE[page] || (RETAILER_TAB_PAGES.includes(page) ? page : null);

    document.querySelectorAll(".tabbar-supplier").forEach((bar) => {
      bar.querySelectorAll(".tabbar__item").forEach((btn) => {
        const nav = btn.getAttribute("data-nav");
        btn.classList.toggle("is-active", platform === "supplier" && nav === activeTab);
      });
    });
    document.querySelectorAll(".tabbar-retailer").forEach((bar) => {
      bar.querySelectorAll(".tabbar__item").forEach((btn) => {
        const nav = btn.getAttribute("data-nav");
        btn.classList.toggle("is-active", platform === "retailer" && nav === activeTabR);
      });
    });
  }

  function setSinglePageMode(platform, page) {
    const single = window.matchMedia("(max-width: 600px)").matches;
    const supplierPhones = document.querySelectorAll('.phone[data-platform="supplier"]');
    const retailerPhones = document.querySelectorAll('.phone[data-platform="retailer"]');

    if (!single) {
      supplierPhones.forEach((p) => p.classList.remove("is-hidden"));
      retailerPhones.forEach((p) => p.classList.remove("is-hidden"));
      return;
    }

    if (platform === "supplier") {
      supplierPhones.forEach((p) => {
        p.classList.toggle("is-hidden", p.dataset.page !== page);
      });
      retailerPhones.forEach((p) => p.classList.add("is-hidden"));
      const active = document.querySelector(`.phone[data-platform="supplier"][data-page="${page}"]`);
      if (active) active.scrollIntoView({ block: "start", behavior: "smooth" });
    } else if (platform === "retailer") {
      retailerPhones.forEach((p) => {
        p.classList.toggle("is-hidden", p.dataset.page !== page);
      });
      supplierPhones.forEach((p) => p.classList.add("is-hidden"));
      const active = document.querySelector(`.phone[data-platform="retailer"][data-page="${page}"]`);
      if (active) active.scrollIntoView({ block: "start", behavior: "smooth" });
    }
  }

  function setPage(platform, page) {
    state.platform = platform;
    state.page = page;
    setActiveTabbar(platform, page);
    if (platform === "supplier" || platform === "retailer") {
      setSinglePageMode(platform, page);
    }
    try { history.replaceState(null, "", "#" + platform + "-" + page.replace(/^(sup|ret)-/, "")); } catch (_) {}
  }

  function initNav() {
    document.addEventListener("click", (e) => {
      const el = e.target?.closest?.("[data-nav]");
      if (el) {
        const nav = el.getAttribute("data-nav");
        if (nav) {
          const platform = nav.startsWith("sup-") ? "supplier" : "retailer";
          setPage(platform, nav);
        }
        return;
      }
      const toastEl2 = e.target?.closest?.("[data-toast]");
      if (toastEl2) {
        showToast(toastEl2.getAttribute("data-toast") || "已点击（原型）");
      }
    });
  }

  function initHelp() {
    if (!helpDialog || !helpBtn) return;
    helpBtn.addEventListener("click", (e) => {
      e.preventDefault();
      helpDialog.showModal?.();
    });
  }

  function initScreenList() {
    const screenListDialog = document.getElementById("screenList");
    const screenListBtn = document.getElementById("screenListBtn");
    if (screenListDialog && screenListBtn) {
      screenListBtn.addEventListener("click", (e) => {
        e.preventDefault();
        screenListDialog.showModal?.();
      });
    }
  }

  function initTheme() {
    if (!toggleThemeBtn) return;
    toggleThemeBtn.addEventListener("click", () => {
      const next = state.theme === "light" ? "dark" : "light";
      setTheme(next);
      showToast("已切换为" + (next === "light" ? "浅色" : "深色") + "外观");
    });
  }

  function initPlatformTabs() {
    const tabs = document.querySelectorAll(".platform-tab");
    const contents = document.querySelectorAll(".platform-content");
    tabs.forEach((tab) => {
      tab.addEventListener("click", () => {
        const platform = tab.getAttribute("data-platform");
        syncPlatformTab(platform);
        state.platform = platform;
        if (platform === "supplier") setPage("supplier", "sup-home");
        else if (platform === "retailer") setPage("retailer", "ret-home");
        else if (platform === "admin") initAdminPages("dashboard");
        try { history.replaceState(null, "", "#" + platform); } catch (_) {}
      });
    });
    const hash = (location.hash || "").replace("#", "").trim();
    if (hash === "supplier") document.querySelector('.platform-tab[data-platform="supplier"]')?.click();
    else if (hash === "retailer") document.querySelector('.platform-tab[data-platform="retailer"]')?.click();
    else if (hash === "admin") document.querySelector('.platform-tab[data-platform="admin"]')?.click();
  }

  const ADMIN_PAGES = ["dashboard", "merchant", "merchant-detail", "product", "product-detail", "order", "order-detail", "service"];
  const ADMIN_PARENT = { "merchant-detail": "merchant", "product-detail": "product", "order-detail": "order" };

  function initAdminPages(activePage) {
    ADMIN_PAGES.forEach((p) => {
      const el = document.getElementById("pc-" + p);
      if (el) el.hidden = p !== activePage;
    });
    const menuPage = ADMIN_PARENT[activePage] || activePage;
    document.querySelectorAll(".pc-menu__item").forEach((item) => {
      const page = item.getAttribute("data-pc-page");
      item.classList.toggle("is-active", page === menuPage);
    });
  }

  function initAdminMenu() {
    document.querySelectorAll(".pc-menu__item[data-pc-page]").forEach((item) => {
      item.addEventListener("click", (e) => {
        e.preventDefault();
        const page = item.getAttribute("data-pc-page");
        initAdminPages(page);
      });
    });
    document.addEventListener("click", (e) => {
      const btn = e.target?.closest?.("[data-admin-page]");
      if (btn && document.getElementById("platform-admin") && !document.getElementById("platform-admin").hidden) {
        e.preventDefault?.();
        initAdminPages(btn.getAttribute("data-admin-page"));
        const toast = btn.getAttribute("data-toast");
        if (toast) showToast(toast);
      }
    });
  }

  const HASH_TO_SUP = { login: "sup-login", cert: "sup-cert", home: "sup-home", products: "sup-products", publish: "sup-publish", orders: "sup-orders", "order-detail": "sup-order-detail", settlement: "sup-settlement", me: "sup-me" };
  const HASH_TO_RET = { login: "ret-login", cert: "ret-cert", home: "ret-home", mall: "ret-mall", store: "ret-store", "product-detail": "ret-product-detail", cart: "ret-cart", checkout: "ret-checkout", orders: "ret-orders", me: "ret-me" };

  function syncPlatformTab(platform) {
    document.querySelectorAll(".platform-tab").forEach((t) => t.classList.toggle("is-active", t.getAttribute("data-platform") === platform));
    document.querySelectorAll(".platform-content").forEach((c) => { c.hidden = c.id !== "platform-" + platform; });
  }

  function initHash() {
    const hash = (location.hash || "").replace("#", "").trim();
    const m = hash.match(/^(supplier|retailer|admin)(?:-(.+))?$/);
    if (m) {
      const [, platform, sub] = m;
      syncPlatformTab(platform);
      if (platform === "supplier") {
        const page = (sub && HASH_TO_SUP[sub]) ? HASH_TO_SUP[sub] : "sup-home";
        setPage("supplier", page);
      } else if (platform === "retailer") {
        const page = (sub && HASH_TO_RET[sub]) ? HASH_TO_RET[sub] : "ret-home";
        setPage("retailer", page);
      } else if (platform === "admin") {
        const pages = ["dashboard", "merchant", "merchant-detail", "product", "product-detail", "order", "order-detail", "service"];
        initAdminPages(pages.includes(sub) ? sub : "dashboard");
      }
      return;
    }
    syncPlatformTab("supplier");
    setPage("supplier", "sup-home");
  }

  function initResize() {
    window.addEventListener("resize", () => {
      if (state.platform === "supplier" || state.platform === "retailer") {
        setSinglePageMode(state.platform, state.page);
      }
    });
  }

  setTheme("light");
  initNav();
  initHelp();
  initScreenList();
  initTheme();
  initPlatformTabs();
  initAdminMenu();
  initHash();
  initResize();

  if (window.matchMedia("(max-width: 600px)").matches) {
    showToast("单屏预览：用底部 Tab 切换页面");
  }
})();
