(function(){

  /** 长兴天能舆情表（xlsx）主体企业，与 filterByRole 企业视角一致 */
  const YUQING_FOCUS_ENT = "长兴天能";
  const enterprises = ["长兴天能", "天能能源", "超威集团", "县投发展", "绿色动力"];
  const homeCharts = [];
  let cpBarMode = "triple";

  function destroyHomeCharts() {
    homeCharts.forEach((c) => {
      try {
        c.destroy();
      } catch (e) {}
    });
    homeCharts.length = 0;
  }

  function pushChart(cfg) {
    const el = document.getElementById(cfg.id);
    if (!el || typeof Chart === "undefined") return;
    const ctx = el.getContext("2d");
    homeCharts.push(new Chart(ctx, cfg.config));
  }

  const subCharts = [];
  function destroySubCharts() {
    subCharts.forEach((c) => {
      try {
        c.destroy();
      } catch (e) {}
    });
    subCharts.length = 0;
  }
  function pushSubChart(cfg) {
    const el = document.getElementById(cfg.id);
    if (!el || typeof Chart === "undefined") return;
    subCharts.push(new Chart(el.getContext("2d"), cfg.config));
  }

  function getFilteredYuqing() {
    let rows = filterByRole(mockYuqing, "ent", YUQING_FOCUS_ENT);
    const entF = document.getElementById("flt-yuqing-ent")?.value;
    if (entF) rows = rows.filter((r) => r.ent === entF);
    const srcF = document.getElementById("flt-yuqing-src")?.value;
    if (srcF) rows = rows.filter((r) => r.src === srcF);
    return rows;
  }

  function getFilteredQinquan() {
    let rows = filterByRole(mockQinquan, "ent");
    const entF = document.getElementById("flt-qq-ent")?.value;
    if (entF) rows = rows.filter((r) => r.ent === entF);
    const st = document.getElementById("flt-qq-status")?.value;
    if (st) rows = rows.filter((r) => r.status === st);
    return rows;
  }

  function getFilteredAnquan() {
    let rows = filterByRole(mockAnquan, "ent");
    const entF = document.getElementById("flt-aq-ent")?.value;
    if (entF) rows = rows.filter((r) => r.ent === entF);
    const tab = document.getElementById("flt-aq-tab")?.value;
    if (tab && tab !== "all") rows = rows.filter((r) => r.level === tab);
    return rows;
  }

  function monthLabels12() {
    return monthAxis12().labels;
  }

  /** 近 12 个月时间轴：keys 为 YYYY-MM，与表发布时间对齐 */
  function monthAxis12() {
    const keys = [];
    const labels = [];
    for (let i = 11; i >= 0; i--) {
      const d = new Date();
      d.setMonth(d.getMonth() - i);
      keys.push(d.getFullYear() + "-" + String(d.getMonth() + 1).padStart(2, "0"));
      labels.push(d.getMonth() + 1 + "月");
    }
    return { keys, labels };
  }

  /** 自当年 1 月起至本月的月度轴（用于首页声浪：固定从 2026-01 起） */
  function monthAxis2026Ytd() {
    const keys = [];
    const labels = [];
    const now = new Date();
    const startYear = 2026;
    let y = startYear;
    let m = 1;
    const endY = now.getFullYear();
    const endM = now.getMonth() + 1;
    while (y < endY || (y === endY && m <= endM)) {
      keys.push(y + "-" + String(m).padStart(2, "0"));
      labels.push(y + "年" + m + "月");
      m += 1;
      if (m > 12) {
        m = 1;
        y += 1;
      }
    }
    if (!keys.length) {
      keys.push("2026-01");
      labels.push("2026年1月");
    }
    return { keys, labels };
  }

  function parseYuqingTime(r) {
    if (!r || !r.time) return null;
    const d = new Date(String(r.time).trim().replace(/-/g, "/"));
    return isNaN(d.getTime()) ? null : d;
  }

  function parseFans(r) {
    const n = parseInt(String(r.fans != null ? r.fans : "0").replace(/[^\d]/g, ""), 10);
    return isNaN(n) ? 0 : n;
  }

  /** 单条声浪得分：基础 1 + 粉丝量对数加权，负面略放大 */
  function rowVoicePoints(r) {
    const f = parseFans(r);
    let p = 1 + Math.log1p(f) * 0.15;
    if (r.sentiment === "负面") p *= 1.4;
    return p;
  }

  function aggregateVoiceByMonthKeys(rows, keys) {
    const voice = Object.fromEntries(keys.map((k) => [k, 0]));
    const count = Object.fromEntries(keys.map((k) => [k, 0]));
    const negVoice = Object.fromEntries(keys.map((k) => [k, 0]));
    const highN = Object.fromEntries(keys.map((k) => [k, 0]));
    rows.forEach((r) => {
      const d = parseYuqingTime(r);
      if (!d) return;
      const k = d.getFullYear() + "-" + String(d.getMonth() + 1).padStart(2, "0");
      if (!Object.prototype.hasOwnProperty.call(voice, k)) return;
      const pts = rowVoicePoints(r);
      voice[k] += pts;
      count[k] += 1;
      if (r.sentiment === "负面") negVoice[k] += pts;
      if (r.level === "高") highN[k] += 1;
    });
    return {
      voice: keys.map((k) => Math.round(voice[k] * 10) / 10),
      count: keys.map((k) => count[k]),
      negVoice: keys.map((k) => Math.round(negVoice[k] * 10) / 10),
      high: keys.map((k) => highN[k]),
    };
  }

  function countByField(rows, getter) {
    const m = {};
    rows.forEach((r) => {
      const k = getter(r) || "未标注";
      m[k] = (m[k] || 0) + 1;
    });
    return m;
  }

  function topNMap(map, n, otherLabel) {
    const ent = Object.entries(map).sort((a, b) => b[1] - a[1]);
    if (ent.length <= n) {
      return { labels: ent.map((x) => x[0]), data: ent.map((x) => x[1]) };
    }
    const top = ent.slice(0, n);
    const rest = ent.slice(n).reduce((s, x) => s + x[1], 0);
    return { labels: [...top.map((x) => x[0]), otherLabel], data: [...top.map((x) => x[1]), rest] };
  }

  function normPubRegion(r) {
    const s = (r.region || "").trim();
    if (!s) return "未标注";
    const first = s.split(/[-\/·]/)[0].trim();
    return first || s;
  }

  function synthSeries12(seed) {
    const s = Math.max(3, seed);
    return Array.from({ length: 12 }, (_, i) =>
      Math.max(0, Math.round(s * (0.55 + 0.035 * i + 0.12 * Math.sin(i * 0.5))))
    );
  }

  function applyChartTheme() {
    if (typeof Chart === "undefined") return;
    Chart.defaults.color = "#94a3b8";
    Chart.defaults.borderColor = "rgba(56, 189, 248, 0.12)";
    Chart.defaults.font.family = "'Segoe UI', 'PingFang SC', 'Microsoft YaHei', system-ui, sans-serif";
  }

  function renderHomeCharts() {
    destroyHomeCharts();
    if (typeof Chart === "undefined") return;
    applyChartTheme();

    const yq = filterByRole(mockYuqing, "ent", YUQING_FOCUS_ENT);
    const qq = filterByRole(mockQinquan, "ent");
    const aq = filterByRole(mockAnquan, "ent");
    const yqAll = isPlatform() ? mockYuqing : yq;
    const qqAll = isPlatform() ? mockQinquan : qq;
    const aqAll = isPlatform() ? mockAnquan : aq;

    const yqAxis = monthAxis2026Ytd();
    const m12 = monthLabels12();
    const yqVoiceM = aggregateVoiceByMonthKeys(yq, yqAxis.keys);
    /** 首页侵权/安全：筛选结果为空时用内置假数据，避免图表空白 */
    const qqEff = qq.length ? qq : mockQinquan;
    const aqEff = aq.length ? aq : mockAnquan;
    const qqAllEff = qqAll.length ? qqAll : mockQinquan;
    const aqAllEff = aqAll.length ? aqAll : mockAnquan;
    const lineOpts = {
      responsive: true,
      maintainAspectRatio: false,
      interaction: { mode: "index", intersect: false },
      plugins: { legend: { position: "bottom", labels: { boxWidth: 10, font: { size: 9 } } } },
      scales: {
        x: { grid: { color: "rgba(56,189,248,0.08)" }, ticks: { maxRotation: 0, font: { size: 9 } } },
        y: { beginAtZero: true, grid: { color: "rgba(56,189,248,0.08)" }, ticks: { font: { size: 9 } } },
      },
    };

    pushChart({
      id: "chart-cp-yq-month",
      config: {
        type: "line",
        data: {
          labels: yqAxis.labels,
          datasets: [
            {
              label: "声浪指数（条数+粉丝加权）",
              data: yqVoiceM.voice,
              borderColor: "#38bdf8",
              backgroundColor: "rgba(56,189,248,0.12)",
              fill: true,
              tension: 0.35,
              yAxisID: "y",
            },
            {
              label: "负面声浪（同口径）",
              data: yqVoiceM.negVoice,
              borderColor: "#f472b6",
              backgroundColor: "rgba(244,114,182,0.08)",
              fill: true,
              tension: 0.35,
              yAxisID: "y",
            },
            {
              label: "监测条数",
              data: yqVoiceM.count,
              borderColor: "#94a3b8",
              borderDash: [4, 3],
              fill: false,
              tension: 0.25,
              yAxisID: "y1",
            },
          ],
        },
        options: {
          ...lineOpts,
          scales: {
            x: lineOpts.scales.x,
            y: lineOpts.scales.y,
            y1: {
              position: "right",
              beginAtZero: true,
              grid: { drawOnChartArea: false },
              ticks: { stepSize: 1, font: { size: 8 } },
            },
          },
        },
      },
    });

    pushChart({
      id: "chart-cp-qq-month",
      config: {
        type: "line",
        data: {
          labels: m12,
          datasets: [
            { label: "新增线索（示意）", data: synthSeries12(qqEff.length + 6), borderColor: "#a78bfa", backgroundColor: "rgba(167,139,250,0.15)", fill: true, tension: 0.35 },
          ],
        },
        options: lineOpts,
      },
    });

    const srcHome = countByField(yq, (r) => (r.src || "").trim() || "未标注");
    const srcHomeTop = topNMap(srcHome, 12, "其他");
    pushChart({
      id: "chart-cp-yq-channel",
      config: {
        type: "bar",
        data: {
          labels: srcHomeTop.labels.length ? srcHomeTop.labels : ["—"],
          datasets: [{ label: "条", data: srcHomeTop.data.length ? srcHomeTop.data : [0], backgroundColor: "rgba(56,189,248,0.65)", borderRadius: 4 }],
        },
        options: {
          indexAxis: "y",
          responsive: true,
          maintainAspectRatio: false,
          plugins: { legend: { display: false } },
          scales: {
            x: { beginAtZero: true, grid: { color: "rgba(56,189,248,0.08)" }, ticks: { stepSize: 1, font: { size: 9 } } },
            y: { grid: { display: false }, ticks: { font: { size: 8 } } },
          },
        },
      },
    });

    const entLabs = isPlatform() ? enterprises.slice(0, 5) : [YUQING_FOCUS_ENT];
    const entYq = entLabs.map((e) => yqAll.filter((r) => r.ent === e).length);
    const entQq = entLabs.map((e) => qqAll.filter((r) => r.ent === e).length);
    const entAq = entLabs.map((e) => aqAll.filter((r) => r.ent === e).length);

    if (cpBarMode === "triple") {
      pushChart({
        id: "chart-cp-ent-compare",
        config: {
          type: "bar",
          data: {
            labels: entLabs,
            datasets: [
              { label: "舆情", data: entYq, backgroundColor: "rgba(56,189,248,0.75)" },
              { label: "侵权", data: entQq, backgroundColor: "rgba(167,139,250,0.75)" },
              { label: "安全", data: entAq, backgroundColor: "rgba(244,114,182,0.75)" },
            ],
          },
          options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: { legend: { position: "top", labels: { boxWidth: 10, font: { size: 9 } } } },
            scales: {
              x: { grid: { display: false }, ticks: { font: { size: 9 } } },
              y: { beginAtZero: true, grid: { color: "rgba(56,189,248,0.08)" }, ticks: { stepSize: 1, font: { size: 9 } } },
            },
          },
        },
      });
    } else {
      const lvlH = entLabs.map((e) => yqAll.filter((r) => r.ent === e && r.level === "高").length);
      const lvlM = entLabs.map((e) => yqAll.filter((r) => r.ent === e && r.level === "中").length);
      const lvlL = entLabs.map((e) => yqAll.filter((r) => r.ent === e && r.level === "低").length);
      pushChart({
        id: "chart-cp-ent-compare",
        config: {
          type: "bar",
          data: {
            labels: entLabs,
            datasets: [
              { label: "高", data: lvlH, backgroundColor: "rgba(248,113,113,0.8)", stack: "s" },
              { label: "中", data: lvlM, backgroundColor: "rgba(251,191,36,0.8)", stack: "s" },
              { label: "低", data: lvlL, backgroundColor: "rgba(74,222,128,0.65)", stack: "s" },
            ],
          },
          options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: { legend: { position: "top", labels: { boxWidth: 10, font: { size: 9 } } } },
            scales: {
              x: { grid: { display: false }, stacked: true, ticks: { font: { size: 9 } } },
              y: { stacked: true, beginAtZero: true, grid: { color: "rgba(56,189,248,0.08)" }, ticks: { font: { size: 9 } } },
            },
          },
        },
      });
    }

    const funnelLabs = ["发现线索", "证据核验", "行政/司法", "办结归档"];
    const funnelVal = [
      qqEff.length + 18,
      qqEff.length + 9,
      qqEff.filter((x) => x.status === "在办").length + 4,
      qqEff.filter((x) => x.status === "已办结").length,
    ];
    pushChart({
      id: "chart-cp-qq-funnel",
      config: {
        type: "bar",
        data: {
          labels: funnelLabs,
          datasets: [{
            label: "件",
            data: funnelVal,
            backgroundColor: ["rgba(167,139,250,0.85)", "rgba(129,140,248,0.85)", "rgba(56,189,248,0.85)", "rgba(74,222,128,0.75)"],
            borderRadius: 6,
          }],
        },
        options: {
          indexAxis: "y",
          responsive: true,
          maintainAspectRatio: false,
          plugins: { legend: { display: false } },
          scales: {
            x: { beginAtZero: true, grid: { color: "rgba(56,189,248,0.08)" }, ticks: { font: { size: 9 } } },
            y: { grid: { display: false }, ticks: { font: { size: 9 } } },
          },
        },
      },
    });

    const platCount = {};
    qqEff.forEach((r) => {
      const p = r.platform || "其他";
      platCount[p] = (platCount[p] || 0) + 1;
    });
    const platLabs = Object.keys(platCount);
    pushChart({
      id: "chart-cp-platform-bar",
      config: {
        type: "bar",
        data: {
          labels: platLabs.length ? platLabs : ["—"],
          datasets: [{ data: platLabs.length ? platLabs.map((k) => platCount[k]) : [0], backgroundColor: "rgba(244,114,182,0.65)", borderRadius: 4 }],
        },
        options: {
          indexAxis: "y",
          responsive: true,
          maintainAspectRatio: false,
          plugins: { legend: { display: false } },
          scales: {
            x: { beginAtZero: true, grid: { color: "rgba(56,189,248,0.08)" }, ticks: { stepSize: 1, font: { size: 9 } } },
            y: { grid: { display: false }, ticks: { font: { size: 9 } } },
          },
        },
      },
    });

    const rankQq = Object.entries(
      qqAllEff.reduce((acc, r) => {
        acc[r.ent] = (acc[r.ent] || 0) + 1;
        return acc;
      }, {})
    );
    rankQq.sort((a, b) => b[1] - a[1]);
    const rankQqTop = rankQq.length ? rankQq.slice(0, 6) : [["—", 0]];
    pushChart({
      id: "chart-cp-rank-qq-bar",
      config: {
        type: "bar",
        data: {
          labels: rankQqTop.map((x) => x[0]),
          datasets: [{ label: "线索数", data: rankQqTop.map((x) => x[1]), backgroundColor: "rgba(167,139,250,0.75)", borderRadius: 4 }],
        },
        options: {
          indexAxis: "y",
          responsive: true,
          maintainAspectRatio: false,
          plugins: { legend: { display: false } },
          scales: {
            x: { beginAtZero: true, grid: { color: "rgba(56,189,248,0.08)" }, ticks: { stepSize: 1, font: { size: 9 } } },
            y: { grid: { display: false }, ticks: { font: { size: 8 } } },
          },
        },
      },
    });

    const rEnt = isPlatform() ? "全县平均" : YUQING_FOCUS_ENT;
    const radarLabs = ["规则覆盖", "会话可见", "流量解析", "漏洞治理", "响应时效"];
    const nAq = aqEff.length;
    const rv = [
      Math.min(100, 56 + nAq * 3),
      Math.min(100, 52 + Math.round(AQ_ONLINE_SESSIONS / 800)),
      Math.min(100, 70 + Math.round(AQ_APP_TRAFFIC_MB[0] / 800)),
      Math.min(100, 48 + nAq * 4),
      Math.min(100, 62 + Math.round(yq.length * 1.2)),
    ];
    pushChart({
      id: "chart-cp-aq-radar",
      config: {
        type: "radar",
        data: {
          labels: radarLabs,
          datasets: [
            {
              label: rEnt,
              data: rv,
              borderColor: "#38bdf8",
              backgroundColor: "rgba(56,189,248,0.22)",
              pointBackgroundColor: "#7dd3fc",
            },
          ],
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          plugins: { legend: { display: false } },
          scales: {
            r: {
              min: 0,
              max: 100,
              ticks: { stepSize: 25, backdropColor: "transparent", font: { size: 8 } },
              grid: { color: "rgba(56,189,248,0.12)" },
              pointLabels: { font: { size: 9 } },
            },
          },
        },
      },
    });

    const yqDone = yq.filter((x) => x.status === "已归档" || x.status === "已核实" || x.status === "已监测").length;
    const yqIng = Math.max(0, yq.length - yqDone);
    const qqIng = qqEff.filter((x) => x.status === "在办").length;
    const qqDone = Math.max(0, qqEff.length - qqIng);
    const aqHigh = aqEff.filter((x) => x.level === "高危" || x.level === "严重").length;
    const aqRest = Math.max(0, aqEff.length - aqHigh);
    pushChart({
      id: "chart-cp-status-donut",
      config: {
        type: "doughnut",
        data: {
          labels: ["舆情在办", "舆情闭环", "侵权在办", "侵权办结", "安全事项"],
          datasets: [
            {
              data: [
                Math.max(1, yqIng),
                Math.max(0, yqDone) || 1,
                Math.max(1, qqIng),
                Math.max(0, qqDone) || 1,
                Math.max(1, aqEff.length),
              ],
              backgroundColor: [
                "rgba(251,191,36,0.85)",
                "rgba(74,222,128,0.75)",
                "rgba(167,139,250,0.8)",
                "rgba(56,189,248,0.75)",
                "rgba(248,113,113,0.7)",
              ],
              borderWidth: 0,
            },
          ],
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          plugins: { legend: { position: "right", labels: { boxWidth: 8, font: { size: 8 } } } },
        },
      },
    });

    pushChart({
      id: "chart-cp-aq-src-donut",
      config: {
        type: "doughnut",
        data: {
          labels: AQ_APP_TRAFFIC_LABELS,
          datasets: [
            {
              data: AQ_APP_TRAFFIC_MB,
              backgroundColor: ["rgba(56,189,248,0.88)", "rgba(74,222,128,0.85)", "rgba(251,191,36,0.85)", "rgba(248,113,113,0.75)"],
            },
          ],
        },
        options: { responsive: true, maintainAspectRatio: false, plugins: { legend: { position: "bottom", labels: { font: { size: 8 } } } } },
      },
    });

    const rtLabs = ["16:57", "16:58", "16:59", "17:00", "17:01"];
    pushChart({
      id: "chart-cp-aq-high-line",
      config: {
        type: "line",
        data: {
          labels: rtLabs,
          datasets: [
            {
              label: "接收 Mb/s",
              data: [12.5, 22.4, 28.1, 35.2, AQ_RT_MBPS.recv],
              borderColor: "#38bdf8",
              backgroundColor: "rgba(56,189,248,0.1)",
              fill: true,
              tension: 0.35,
            },
            {
              label: "发送 Mb/s",
              data: [18.2, 32.6, 41.0, 52.3, AQ_RT_MBPS.send],
              borderColor: "#4ade80",
              tension: 0.35,
            },
          ],
        },
        options: lineOpts,
      },
    });
  }
  const roleSelect = document.getElementById("roleSelect");
  const topBar = document.getElementById("topBar");
  const roleSwitchWrap = document.getElementById("roleSwitchWrap");

  const mockYuqing = (function () {
    try {
      var el = document.getElementById("embed-mock-yuqing");
      if (el && el.textContent.trim()) return JSON.parse(el.textContent);
    } catch (err) {
      console.warn("embed-mock-yuqing", err);
    }
    return [];
  })();

  const mockQinquan = [
    { id: "QQ-2026-0152", type: "商标侵权", ent: "长兴天能", summary: "短视频账号昵称/头像近似品牌（示意）", src: "阿里线索平台", status: "在办", platform: "抖音" },
    { id: "QQ-2026-0151", type: "假冒伪劣", ent: "长兴天能", summary: "县域经销点疑似仿冒包装（示意）", src: "企业自有", status: "在办", platform: "线下渠道" },
    { id: "QQ-2026-0150", type: "专利", ent: "长兴天能", summary: "竞品参数宣传涉嫌误导（示意）", src: "阿里线索平台", status: "已办结", platform: "京东" },
    { id: "QQ-2026-0142", type: "商标侵权", ent: "天能能源", summary: "电商平台疑似假冒电池包装", src: "阿里线索平台", status: "在办", platform: "淘宝" },
    { id: "QQ-2026-0141", type: "商标侵权", ent: "天能能源", summary: "直播带货侵权链接", src: "阿里线索平台", status: "在办", platform: "抖音" },
    { id: "QQ-2026-0138", type: "专利", ent: "超威集团", summary: "竞品宣传用语涉嫌专利误导", src: "阿里线索平台", status: "在办", platform: "京东" },
    { id: "QQ-2026-0135", type: "假冒伪劣", ent: "超威集团", summary: "县域小店仿冒包装", src: "阿里线索平台", status: "在办", platform: "拼多多" },
    { id: "QQ-2026-0130", type: "商标侵权", ent: "绿色动力", summary: "公众号头像近似", src: "企业自有", status: "在办", platform: "微信生态" },
    { id: "QQ-2026-0125", type: "专利", ent: "县投发展", summary: "招标技术参数争议", src: "企业自有", status: "已办结", platform: "线下渠道" },
    { id: "QQ-2026-0120", type: "假冒伪劣", ent: "天能能源", summary: "线下门店举报线索", src: "企业自有", status: "已办结", platform: "线下渠道" },
    { id: "QQ-2026-0115", type: "商标侵权", ent: "天能能源", summary: "跨境代购链接", src: "阿里线索平台", status: "已办结", platform: "淘宝" },
    { id: "QQ-2026-0110", type: "专利", ent: "绿色动力", summary: "展会物料涉嫌抄袭", src: "阿里线索平台", status: "在办", platform: "线下渠道" },
    { id: "QQ-2026-0105", type: "假冒伪劣", ent: "县投发展", summary: "工程材料以次充好线索", src: "企业自有", status: "在办", platform: "其他平台" },
    { id: "QQ-2026-0101", type: "假冒伪劣", ent: "天能能源", summary: "二手平台翻新电池", src: "阿里线索平台", status: "已办结", platform: "闲鱼" },
    { id: "QQ-2026-0098", type: "商标侵权", ent: "超威集团", summary: "短视频矩阵账号", src: "阿里线索平台", status: "已办结", platform: "抖音" },
  ];

  /** 与边界防火墙监测界面一致的量纲与数值（入侵防御 / 漏洞类日志） */
  /** 漏洞威胁统计（示意，与边界监测「威胁分级」口径一致） */
  const mockAnquan = [
  {
    "ent": "德玛克（长兴）注塑系统有限公司",
    "time": "2025-04-10 16:58:15",
    "level": "中危",
    "srcIp": "123.153.2.143",
    "srcPort": "89",
    "dstIp": "123.153.2.143",
    "dstPort": "89",
    "proto": "TCP",
    "policyId": "—",
    "ruleName": "768德玛克（长兴）注塑系统有限公司网络安全隐患通报 - 泛微E-Mobile - SSRF",
    "ruleType": "其他",
    "atkCount": "1",
    "hitCfg": "—",
    "alarmIv": "7天",
    "action": "已归档",
    "src": "自主录入",
    "_raw": {
      "事件编号": "202504100009",
      "发生时间": "2025-04-10 17:00:28",
      "事件状态": "已归档",
      "事件状态(小)": "已归档",
      "事件标题": "768德玛克（长兴）注塑系统有限公司网络安全隐患通报 - 泛微E-Mobile - SSRF",
      "事件来源": "自主录入",
      "分数": "",
      "创建时间": "2025-04-10 17:00:28",
      "研制厂商": "",
      "联系人": "",
      "联系方式": "",
      "通报基本情况": "768德玛克（长兴）注塑系统有限公司网络安全隐患通报 - 泛微E-Mobile - SSRF",
      "隐患描述": "768德玛克（长兴）注塑系统有限公司网络安全隐患通报 - 泛微E-Mobile - SSRF",
      "网站域名": "http://123.153.2.143:89",
      "影响评估": "",
      "紧急程度": "中危",
      "隐患发现时间": "2025-04-10 16:58:15",
      "国民经济行业分类": "科学研究和技术服务业",
      "区域划分": "长兴县",
      "发现厂商设备": "",
      "发现厂商名称": "浙江海瑞网络科技有限公司",
      "涉及信息数量": "",
      "信息类型": "",
      "ip": "",
      "通报等级": "",
      "通报反馈天数": "7",
      "漏洞编号": "",
      "相关路径": "",
      "端口": "",
      "位置层级": "",
      "参考链接": "",
      "备注": "",
      "整改要求": "",
      "网站名称": "泛微E-Mobile",
      "整改建议": "",
      "单位名称": "德玛克（长兴）注塑系统有限公司",
      "隐患域名url": "http://123.153.2.143:89",
      "隐患等级": "中危",
      "出现数量": "1",
      "隐患类型": "其他",
      "处置流程": "2025-04-10 17:01:59 开始\n\t处理人: 湖州关基操作员\n\t处置意见: 建议立即处理\n\n2025-04-14 17:35:33 简易处置\n\t处理人: 长兴网信\n\t处置意见: 整改复测完成\n\t接收人员: 长兴网信\n\n2025-04-14 17:35:33 结束",
      "被提示区县/部门": "长兴县",
      "被提示人员": "长兴网信",
      "处置反馈时间": "2025-04-14 17:35:33",
      "处置耗时": "耗时:4天33分34秒"
    }
  },
  {
    "ent": "长兴华友计算机科技有限公司",
    "time": "2025-04-10 16:41:47",
    "level": "高危",
    "srcIp": "ycw.huayo.cn",
    "srcPort": "8891",
    "dstIp": "ycw.huayo.cn",
    "dstPort": "8891",
    "proto": "TCP",
    "policyId": "—",
    "ruleName": "765长兴华友计算机科技有限公司网络安全隐患通报 - 用友畅捷通T+ - 管理员密码重置漏洞",
    "ruleType": "其他",
    "atkCount": "1",
    "hitCfg": "—",
    "alarmIv": "7天",
    "action": "已归档",
    "src": "自主录入",
    "_raw": {
      "事件编号": "202504100006",
      "发生时间": "2025-04-10 16:44:28",
      "事件状态": "已归档",
      "事件状态(小)": "已归档",
      "事件标题": "765长兴华友计算机科技有限公司网络安全隐患通报 - 用友畅捷通T+ - 管理员密码重置漏洞",
      "事件来源": "自主录入",
      "分数": "",
      "创建时间": "2025-04-10 16:44:28",
      "研制厂商": "",
      "联系人": "",
      "联系方式": "",
      "通报基本情况": "765长兴华友计算机科技有限公司网络安全隐患通报 - 用友畅捷通T+ - 管理员密码重置漏洞",
      "隐患描述": "765长兴华友计算机科技有限公司网络安全隐患通报 - 用友畅捷通T+ - 管理员密码重置漏洞",
      "网站域名": "http://ycw.huayo.cn:8891",
      "影响评估": "",
      "紧急程度": "高危",
      "隐患发现时间": "2025-04-10 16:41:47",
      "国民经济行业分类": "信息传输、软件和信息技术服务业",
      "区域划分": "长兴县",
      "发现厂商设备": "",
      "发现厂商名称": "长兴县网信办",
      "涉及信息数量": "",
      "信息类型": "",
      "ip": "",
      "通报等级": "",
      "通报反馈天数": "7",
      "漏洞编号": "",
      "相关路径": "",
      "端口": "",
      "位置层级": "",
      "参考链接": "",
      "备注": "",
      "整改要求": "",
      "网站名称": "用友畅捷通T+",
      "整改建议": "",
      "单位名称": "长兴华友计算机科技有限公司",
      "隐患域名url": "http://ycw.huayo.cn:8891",
      "隐患等级": "高危",
      "出现数量": "1",
      "隐患类型": "其他",
      "处置流程": "2025-04-10 17:01:19 开始\n\t处理人: 湖州关基操作员\n\t处置意见: 建议立即处理\n\n2025-04-14 17:36:41 简易处置\n\t处理人: 长兴网信\n\t处置意见: 整改复测完毕\n\t接收人员: 长兴网信\n\n2025-04-14 17:36:41 结束",
      "被提示区县/部门": "长兴县",
      "被提示人员": "长兴网信",
      "处置反馈时间": "2025-04-14 17:36:41",
      "处置耗时": "耗时:4天35分22秒"
    }
  },
  {
    "ent": "湖州雄讯网络科技有限公司",
    "time": "2025-04-10 16:39:30",
    "level": "中危",
    "srcIp": "v.qupig.com",
    "srcPort": "6379",
    "dstIp": "v.qupig.com",
    "dstPort": "6379",
    "proto": "TCP",
    "policyId": "—",
    "ruleName": "764湖州雄讯网络科技有限公司网络安全隐患通报 - Redis - 未授权访问",
    "ruleType": "敏感信息披露",
    "atkCount": "1",
    "hitCfg": "—",
    "alarmIv": "7天",
    "action": "已归档",
    "src": "自主录入",
    "_raw": {
      "事件编号": "202504100005",
      "发生时间": "2025-04-10 16:40:32",
      "事件状态": "已归档",
      "事件状态(小)": "已归档",
      "事件标题": "764湖州雄讯网络科技有限公司网络安全隐患通报 - Redis - 未授权访问",
      "事件来源": "自主录入",
      "分数": "",
      "创建时间": "2025-04-10 16:40:32",
      "研制厂商": "",
      "联系人": "",
      "联系方式": "",
      "通报基本情况": "764湖州雄讯网络科技有限公司网络安全隐患通报 - Redis - 未授权访问",
      "隐患描述": "764湖州雄讯网络科技有限公司网络安全隐患通报 - Redis - 未授权访问",
      "网站域名": "v.qupig.com:6379",
      "影响评估": "",
      "紧急程度": "中危",
      "隐患发现时间": "2025-04-10 16:39:30",
      "国民经济行业分类": "信息传输、软件和信息技术服务业",
      "区域划分": "长兴县",
      "发现厂商设备": "",
      "发现厂商名称": "长兴县网信办",
      "涉及信息数量": "",
      "信息类型": "",
      "ip": "",
      "通报等级": "",
      "通报反馈天数": "7",
      "漏洞编号": "",
      "相关路径": "",
      "端口": "",
      "位置层级": "",
      "参考链接": "",
      "备注": "",
      "整改要求": "",
      "网站名称": "redis",
      "整改建议": "",
      "单位名称": "湖州雄讯网络科技有限公司",
      "隐患域名url": "v.qupig.com:6379",
      "隐患等级": "中危",
      "出现数量": "1",
      "隐患类型": "敏感信息披露",
      "处置流程": "2025-04-10 17:00:47 开始\n\t处理人: 湖州关基操作员\n\t处置意见: 建议立即处理\n\n2025-04-17 17:08:22 简易处置\n\t处理人: 长兴网信\n\t处置意见: 整改复测完成\n\t接收人员: 长兴网信\n\n2025-04-17 17:08:22 结束",
      "被提示区县/部门": "长兴县",
      "被提示人员": "长兴网信",
      "处置反馈时间": "2025-04-17 17:08:22",
      "处置耗时": "耗时:7天7分34秒"
    }
  },
  {
    "ent": "湖州雄讯网络科技有限公司",
    "time": "2025-04-10 16:31:27",
    "level": "高危",
    "srcIp": "v.qupig.com",
    "srcPort": "22",
    "dstIp": "v.qupig.com",
    "dstPort": "22",
    "proto": "TCP",
    "policyId": "—",
    "ruleName": "763湖州雄讯网络科技有限公司网络安全隐患通报 - SSH - 弱口令",
    "ruleType": "应用系统弱口令",
    "atkCount": "1",
    "hitCfg": "—",
    "alarmIv": "7天",
    "action": "已归档",
    "src": "自主录入",
    "_raw": {
      "事件编号": "202504100004",
      "发生时间": "2025-04-10 16:39:01",
      "事件状态": "已归档",
      "事件状态(小)": "已归档",
      "事件标题": "763湖州雄讯网络科技有限公司网络安全隐患通报 - SSH - 弱口令",
      "事件来源": "自主录入",
      "分数": "",
      "创建时间": "2025-04-10 16:39:01",
      "研制厂商": "",
      "联系人": "",
      "联系方式": "",
      "通报基本情况": "763湖州雄讯网络科技有限公司网络安全隐患通报 - SSH - 弱口令",
      "隐患描述": "763湖州雄讯网络科技有限公司网络安全隐患通报 - SSH - 弱口令",
      "网站域名": "v.qupig.com:22",
      "影响评估": "",
      "紧急程度": "高危",
      "隐患发现时间": "2025-04-10 16:31:27",
      "国民经济行业分类": "信息传输、软件和信息技术服务业",
      "区域划分": "长兴县",
      "发现厂商设备": "",
      "发现厂商名称": "长兴县网信办",
      "涉及信息数量": "",
      "信息类型": "",
      "ip": "",
      "通报等级": "",
      "通报反馈天数": "7",
      "漏洞编号": "",
      "相关路径": "",
      "端口": "",
      "位置层级": "",
      "参考链接": "",
      "备注": "",
      "整改要求": "",
      "网站名称": "SSH",
      "整改建议": "",
      "单位名称": "湖州雄讯网络科技有限公司",
      "隐患域名url": "v.qupig.com:22",
      "隐患等级": "高危",
      "出现数量": "1",
      "隐患类型": "应用系统弱口令",
      "处置流程": "2025-04-10 17:00:38 开始\n\t处理人: 湖州关基操作员\n\t处置意见: 建议立即处理\n\n2025-04-17 17:10:30 简易处置\n\t处理人: 长兴网信\n\t处置意见: 整改复测完成\n\t接收人员: 长兴网信\n\n2025-04-17 17:10:30 结束",
      "被提示区县/部门": "长兴县",
      "被提示人员": "长兴网信",
      "处置反馈时间": "2025-04-17 17:10:30",
      "处置耗时": "耗时:7天9分51秒"
    }
  },
  {
    "ent": "长兴县应急管理局",
    "time": "2025-04-10 10:16:21",
    "level": "中危",
    "srcIp": "10.21.196.233",
    "srcPort": "—",
    "dstIp": "10.21.196.233",
    "dstPort": "—",
    "proto": "—",
    "policyId": "—",
    "ruleName": "Apache Tomcat 安全漏洞",
    "ruleType": "扫描探测",
    "atkCount": "1",
    "hitCfg": "—",
    "alarmIv": "5天",
    "action": "已归档",
    "src": "自主录入",
    "_raw": {
      "事件编号": "202504100003",
      "发生时间": "2025-04-10 10:17:34",
      "事件状态": "已归档",
      "事件状态(小)": "已归档",
      "事件标题": "20250122长兴县应急管理局Apache Tomcat 安全漏洞预警通报",
      "事件来源": "自主录入",
      "分数": "",
      "创建时间": "2025-04-10 10:17:34",
      "研制厂商": "",
      "联系人": "",
      "联系方式": "",
      "通报基本情况": "Apache Tomcat 安全漏洞",
      "隐患描述": "Apache Tomcat 安全漏洞",
      "网站域名": "10.21.196.233",
      "影响评估": "",
      "紧急程度": "低危",
      "隐患发现时间": "2025-04-10 10:16:21",
      "国民经济行业分类": "其它",
      "区域划分": "长兴县",
      "发现厂商设备": "",
      "发现厂商名称": "长兴县网信办",
      "涉及信息数量": "",
      "信息类型": "",
      "ip": "",
      "通报等级": "",
      "通报反馈天数": "5",
      "漏洞编号": "",
      "相关路径": "",
      "端口": "",
      "位置层级": "",
      "参考链接": "",
      "备注": "",
      "整改要求": "",
      "网站名称": "10.21.196.233",
      "整改建议": "",
      "单位名称": "长兴县应急管理局",
      "隐患域名url": "10.21.196.233",
      "隐患等级": "中危",
      "出现数量": "1",
      "隐患类型": "扫描探测",
      "处置流程": "2025-04-10 10:19:28 开始\n\t处理人: 长兴网信\n\t处置意见: 整改反馈\n\n2025-04-10 10:20:29 简易处置\n\t处理人: 长兴网信\n\t处置意见: 整改完成\n\t接收人员: 长兴网信\n\n2025-04-10 10:20:29 结束",
      "被提示区县/部门": "长兴县",
      "被提示人员": "长兴网信",
      "处置反馈时间": "2025-04-10 10:20:29",
      "处置耗时": "耗时:1分1秒"
    }
  },
  {
    "ent": "长兴县应急管理局",
    "time": "2025-04-10 10:14:44",
    "level": "中危",
    "srcIp": "10.21.196.233",
    "srcPort": "—",
    "dstIp": "10.21.196.233",
    "dstPort": "—",
    "proto": "—",
    "policyId": "—",
    "ruleName": "RabbitMQ输入验证错误漏洞",
    "ruleType": "扫描探测",
    "atkCount": "1",
    "hitCfg": "—",
    "alarmIv": "5天",
    "action": "已归档",
    "src": "自主录入",
    "_raw": {
      "事件编号": "202504100002",
      "发生时间": "2025-04-10 10:15:51",
      "事件状态": "已归档",
      "事件状态(小)": "已归档",
      "事件标题": "20250123长兴县应急管理局RabbitMQ输入验证错误漏洞网络安全预警通报",
      "事件来源": "自主录入",
      "分数": "",
      "创建时间": "2025-04-10 10:15:51",
      "研制厂商": "",
      "联系人": "",
      "联系方式": "",
      "通报基本情况": "RabbitMQ输入验证错误漏洞",
      "隐患描述": "RabbitMQ输入验证错误漏洞",
      "网站域名": "10.21.196.233",
      "影响评估": "",
      "紧急程度": "低危",
      "隐患发现时间": "2025-04-10 10:14:44",
      "国民经济行业分类": "其它",
      "区域划分": "长兴县",
      "发现厂商设备": "",
      "发现厂商名称": "长兴县网信办",
      "涉及信息数量": "",
      "信息类型": "",
      "ip": "",
      "通报等级": "",
      "通报反馈天数": "5",
      "漏洞编号": "",
      "相关路径": "",
      "端口": "",
      "位置层级": "",
      "参考链接": "",
      "备注": "",
      "整改要求": "",
      "网站名称": "10.21.196.233",
      "整改建议": "",
      "单位名称": "长兴县应急管理局",
      "隐患域名url": "10.21.196.233",
      "隐患等级": "中危",
      "出现数量": "1",
      "隐患类型": "扫描探测",
      "处置流程": "2025-04-10 10:19:39 开始\n\t处理人: 长兴网信\n\t处置意见: 整改反馈\n\n2025-04-10 10:20:42 简易处置\n\t处理人: 长兴网信\n\t处置意见: 整改完成\n\t接收人员: 长兴网信\n\n2025-04-10 10:20:42 结束",
      "被提示区县/部门": "长兴县",
      "被提示人员": "长兴网信",
      "处置反馈时间": "2025-04-10 10:20:42",
      "处置耗时": "耗时:1分2秒"
    }
  },
  {
    "ent": "长兴县消防救援大队",
    "time": "2025-04-10 10:06:49",
    "level": "中危",
    "srcIp": "10.38.217.114",
    "srcPort": "—",
    "dstIp": "10.38.217.114",
    "dstPort": "—",
    "proto": "—",
    "policyId": "—",
    "ruleName": "Apache HTTP Server网络安全隐患",
    "ruleType": "扫描探测",
    "atkCount": "1",
    "hitCfg": "—",
    "alarmIv": "5天",
    "action": "已归档",
    "src": "自主录入",
    "_raw": {
      "事件编号": "202504100001",
      "发生时间": "2025-04-10 10:07:54",
      "事件状态": "已归档",
      "事件状态(小)": "已归档",
      "事件标题": "20250121长兴县消防救援大队Apache HTTP Server网络安全隐患预警通报",
      "事件来源": "自主录入",
      "分数": "",
      "创建时间": "2025-04-10 10:07:54",
      "研制厂商": "",
      "联系人": "",
      "联系方式": "",
      "通报基本情况": "Apache HTTP Server网络安全隐患",
      "隐患描述": "Apache HTTP Server网络安全隐患",
      "网站域名": "10.38.217.114",
      "影响评估": "",
      "紧急程度": "低危",
      "隐患发现时间": "2025-04-10 10:06:49",
      "国民经济行业分类": "其它",
      "区域划分": "长兴县",
      "发现厂商设备": "",
      "发现厂商名称": "长兴县网信办",
      "涉及信息数量": "",
      "信息类型": "",
      "ip": "",
      "通报等级": "",
      "通报反馈天数": "5",
      "漏洞编号": "",
      "相关路径": "",
      "端口": "",
      "位置层级": "",
      "参考链接": "",
      "备注": "",
      "整改要求": "",
      "网站名称": "10.38.217.114",
      "整改建议": "",
      "单位名称": "长兴县消防救援大队",
      "隐患域名url": "10.38.217.114",
      "隐患等级": "中危",
      "出现数量": "1",
      "隐患类型": "扫描探测",
      "处置流程": "2025-04-10 10:19:47 开始\n\t处理人: 长兴网信\n\t处置意见: 整改反馈\n\n2025-04-10 10:20:55 简易处置\n\t处理人: 长兴网信\n\t处置意见: 整改完成\n\t接收人员: 长兴网信\n\n2025-04-10 10:20:55 结束",
      "被提示区县/部门": "长兴县",
      "被提示人员": "长兴网信",
      "处置反馈时间": "2025-04-10 10:20:55",
      "处置耗时": "耗时:1分8秒"
    }
  },
  {
    "ent": "长兴县水利局",
    "time": "2025-04-09 16:48:48",
    "level": "中危",
    "srcIp": "10.21.197.171",
    "srcPort": "—",
    "dstIp": "10.21.197.171",
    "dstPort": "—",
    "proto": "—",
    "policyId": "—",
    "ruleName": "长兴县水利局Oracle MySQL 安全漏洞网络安全预警通报",
    "ruleType": "扫描探测",
    "atkCount": "1",
    "hitCfg": "—",
    "alarmIv": "5天",
    "action": "已归档",
    "src": "自主录入",
    "_raw": {
      "事件编号": "202504090014",
      "发生时间": "2025-04-09 16:50:41",
      "事件状态": "已归档",
      "事件状态(小)": "已归档",
      "事件标题": "20250120长兴县水利局Oracle MySQL 安全漏洞网络安全预警通报",
      "事件来源": "自主录入",
      "分数": "",
      "创建时间": "2025-04-09 16:50:41",
      "研制厂商": "",
      "联系人": "",
      "联系方式": "",
      "通报基本情况": "长兴县水利局Oracle MySQL 安全漏洞网络安全预警通报",
      "隐患描述": "长兴县水利局Oracle MySQL 安全漏洞网络安全预警通报",
      "网站域名": "10.21.197.171",
      "影响评估": "",
      "紧急程度": "低危",
      "隐患发现时间": "2025-04-09 16:48:48",
      "国民经济行业分类": "其它",
      "区域划分": "长兴县",
      "发现厂商设备": "",
      "发现厂商名称": "长兴县网信办",
      "涉及信息数量": "",
      "信息类型": "",
      "ip": "",
      "通报等级": "",
      "通报反馈天数": "5",
      "漏洞编号": "",
      "相关路径": "",
      "端口": "",
      "位置层级": "",
      "参考链接": "",
      "备注": "",
      "整改要求": "",
      "网站名称": "10.21.197.171",
      "整改建议": "",
      "单位名称": "长兴县水利局",
      "隐患域名url": "10.21.197.171",
      "隐患等级": "中危",
      "出现数量": "1",
      "隐患类型": "扫描探测",
      "处置流程": "2025-04-10 10:19:56 开始\n\t处理人: 长兴网信\n\t处置意见: 整改反馈\n\n2025-04-10 10:21:18 简易处置\n\t处理人: 长兴网信\n\t处置意见: 整改完成\n\t接收人员: 长兴网信\n\n2025-04-10 10:21:18 结束",
      "被提示区县/部门": "长兴县",
      "被提示人员": "长兴网信",
      "处置反馈时间": "2025-04-10 10:21:18",
      "处置耗时": "耗时:1分21秒"
    }
  },
  {
    "ent": "浙江云天集联智能科技有限公司",
    "time": "2025-04-09 16:15:27",
    "level": "中危",
    "srcIp": "backstage.yuntianlot.com",
    "srcPort": "8081",
    "dstIp": "backstage.yuntianlot.com",
    "dstPort": "8081",
    "proto": "TCP",
    "policyId": "—",
    "ruleName": "756浙江云天集联智能科技有限公司网络安全隐患通报 - Swagger - 未授权访问",
    "ruleType": "未受有效保护的API",
    "atkCount": "1",
    "hitCfg": "—",
    "alarmIv": "7天",
    "action": "已归档",
    "src": "自主录入",
    "_raw": {
      "事件编号": "202504090011",
      "发生时间": "2025-04-09 16:16:57",
      "事件状态": "已归档",
      "事件状态(小)": "已归档",
      "事件标题": "756浙江云天集联智能科技有限公司网络安全隐患通报 - Swagger - 未授权访问",
      "事件来源": "自主录入",
      "分数": "",
      "创建时间": "2025-04-09 16:16:57",
      "研制厂商": "",
      "联系人": "",
      "联系方式": "",
      "通报基本情况": "756浙江云天集联智能科技有限公司网络安全隐患通报 - Swagger - 未授权访问",
      "隐患描述": "756浙江云天集联智能科技有限公司网络安全隐患通报 - Swagger - 未授权访问",
      "网站域名": "http://backstage.yuntianlot.com:8081",
      "影响评估": "",
      "紧急程度": "中危",
      "隐患发现时间": "2025-04-09 16:15:27",
      "国民经济行业分类": "信息传输、软件和信息技术服务业",
      "区域划分": "长兴县",
      "发现厂商设备": "",
      "发现厂商名称": "浙江海瑞网络科技有限公司",
      "涉及信息数量": "",
      "信息类型": "",
      "ip": "",
      "通报等级": "",
      "通报反馈天数": "7",
      "漏洞编号": "",
      "相关路径": "",
      "端口": "",
      "位置层级": "",
      "参考链接": "",
      "备注": "",
      "整改要求": "",
      "网站名称": "swagger",
      "整改建议": "",
      "单位名称": "浙江云天集联智能科技有限公司",
      "隐患域名url": "http://backstage.yuntianlot.com:8081",
      "隐患等级": "中危",
      "出现数量": "1",
      "隐患类型": "未受有效保护的API",
      "处置流程": "2025-04-09 16:31:55 开始\n\t处理人: 湖州关基操作员\n\t处置意见: 建议立即处理\n\n2025-04-10 16:34:15 简易处置\n\t处理人: 长兴网信\n\t处置意见: 整改复测完成\n\t接收人员: 长兴网信\n\n2025-04-10 16:34:15 结束",
      "被提示区县/部门": "长兴县",
      "被提示人员": "长兴网信",
      "处置反馈时间": "2025-04-10 16:34:15",
      "处置耗时": "耗时:1天2分20秒"
    }
  },
  {
    "ent": "浙江万里物流有限公司",
    "time": "2025-04-09 16:13:55",
    "level": "中危",
    "srcIp": "zjwlwl.com",
    "srcPort": "—",
    "dstIp": "zjwlwl.com",
    "dstPort": "—",
    "proto": "—",
    "policyId": "—",
    "ruleName": "755浙江万里物流有限公司网络安全隐患通报 - Swagger - 未授权访问",
    "ruleType": "未受有效保护的API",
    "atkCount": "1",
    "hitCfg": "—",
    "alarmIv": "7天",
    "action": "已归档",
    "src": "自主录入",
    "_raw": {
      "事件编号": "202504090010",
      "发生时间": "2025-04-09 16:15:21",
      "事件状态": "已归档",
      "事件状态(小)": "已归档",
      "事件标题": "755浙江万里物流有限公司网络安全隐患通报 - Swagger - 未授权访问",
      "事件来源": "自主录入",
      "分数": "",
      "创建时间": "2025-04-09 16:15:21",
      "研制厂商": "",
      "联系人": "",
      "联系方式": "",
      "通报基本情况": "755浙江万里物流有限公司网络安全隐患通报 - Swagger - 未授权访问",
      "隐患描述": "755浙江万里物流有限公司网络安全隐患通报 - Swagger - 未授权访问",
      "网站域名": "https://zjwlwl.com/prod-api/v3/api-docs",
      "影响评估": "",
      "紧急程度": "中危",
      "隐患发现时间": "2025-04-09 16:13:55",
      "国民经济行业分类": "交通运输、仓储和邮政业",
      "区域划分": "长兴县",
      "发现厂商设备": "",
      "发现厂商名称": "浙江海瑞网络科技有限公司",
      "涉及信息数量": "",
      "信息类型": "",
      "ip": "",
      "通报等级": "",
      "通报反馈天数": "7",
      "漏洞编号": "",
      "相关路径": "",
      "端口": "",
      "位置层级": "",
      "参考链接": "",
      "备注": "",
      "整改要求": "",
      "网站名称": "swagger",
      "整改建议": "",
      "单位名称": "浙江万里物流有限公司",
      "隐患域名url": "https://zjwlwl.com/prod-api/v3/api-docs",
      "隐患等级": "中危",
      "出现数量": "1",
      "隐患类型": "未受有效保护的API",
      "处置流程": "2025-04-09 16:31:46 开始\n\t处理人: 湖州关基操作员\n\t处置意见: 建议立即处理\n\n2025-04-17 14:44:03 简易处置\n\t处理人: 长兴网信\n\t处置意见: 整改复测完成\n\t接收人员: 长兴网信\n\n2025-04-17 14:44:03 结束",
      "被提示区县/部门": "长兴县",
      "被提示人员": "长兴网信",
      "处置反馈时间": "2025-04-17 14:44:03",
      "处置耗时": "耗时:7天22小时12分16秒"
    }
  },
  {
    "ent": "浙江万里物流有限公司",
    "time": "2025-04-09 16:10:05",
    "level": "高危",
    "srcIp": "zjwlwl.com",
    "srcPort": "9100",
    "dstIp": "zjwlwl.com",
    "dstPort": "9100",
    "proto": "TCP",
    "policyId": "—",
    "ruleName": "754浙江万里物流有限公司网络安全隐患通报 - 任务调度中心 - 弱口令",
    "ruleType": "应用系统弱口令",
    "atkCount": "1",
    "hitCfg": "—",
    "alarmIv": "7天",
    "action": "已归档",
    "src": "自主录入",
    "_raw": {
      "事件编号": "202504090008",
      "发生时间": "2025-04-09 16:11:28",
      "事件状态": "已归档",
      "事件状态(小)": "已归档",
      "事件标题": "754浙江万里物流有限公司网络安全隐患通报 - 任务调度中心 - 弱口令",
      "事件来源": "自主录入",
      "分数": "",
      "创建时间": "2025-04-09 16:11:28",
      "研制厂商": "",
      "联系人": "",
      "联系方式": "",
      "通报基本情况": "754浙江万里物流有限公司网络安全隐患通报 - 任务调度中心 - 弱口令",
      "隐患描述": "754浙江万里物流有限公司网络安全隐患通报 - 任务调度中心 - 弱口令",
      "网站域名": "http://zjwlwl.com:9100/xxl-job-admin/toLogin",
      "影响评估": "",
      "紧急程度": "高危",
      "隐患发现时间": "2025-04-09 16:10:05",
      "国民经济行业分类": "交通运输、仓储和邮政业",
      "区域划分": "长兴县",
      "发现厂商设备": "",
      "发现厂商名称": "浙江海瑞网络科技有限公司",
      "涉及信息数量": "",
      "信息类型": "",
      "ip": "",
      "通报等级": "",
      "通报反馈天数": "7",
      "漏洞编号": "",
      "相关路径": "",
      "端口": "",
      "位置层级": "",
      "参考链接": "",
      "备注": "",
      "整改要求": "",
      "网站名称": "任务调度中心",
      "整改建议": "",
      "单位名称": "浙江万里物流有限公司",
      "隐患域名url": "http://zjwlwl.com:9100/xxl-job-admin/toLogin",
      "隐患等级": "高危",
      "出现数量": "1",
      "隐患类型": "应用系统弱口令",
      "处置流程": "2025-04-09 16:31:37 开始\n\t处理人: 湖州关基操作员\n\t处置意见: 建议立即处理\n\n2025-04-17 14:44:25 简易处置\n\t处理人: 长兴网信\n\t处置意见: 整改复测完成\n\t接收人员: 长兴网信\n\n2025-04-17 14:44:25 结束",
      "被提示区县/部门": "长兴县",
      "被提示人员": "长兴网信",
      "处置反馈时间": "2025-04-17 14:44:25",
      "处置耗时": "耗时:7天22小时12分48秒"
    }
  },
  {
    "ent": "任务调度中心",
    "time": "2025-04-09 16:06:13",
    "level": "高危",
    "srcIp": "tms.chilwee.com",
    "srcPort": "—",
    "dstIp": "tms.chilwee.com",
    "dstPort": "—",
    "proto": "—",
    "policyId": "—",
    "ruleName": "753超威电源集团有限公司网络安全隐患通报 - 任务调度中心 - 弱口令",
    "ruleType": "应用系统弱口令",
    "atkCount": "1",
    "hitCfg": "—",
    "alarmIv": "7天",
    "action": "已归档",
    "src": "自主录入",
    "_raw": {
      "事件编号": "202504090006",
      "发生时间": "2025-04-09 16:07:23",
      "事件状态": "已归档",
      "事件状态(小)": "已归档",
      "事件标题": "753超威电源集团有限公司网络安全隐患通报 - 任务调度中心 - 弱口令",
      "事件来源": "自主录入",
      "分数": "",
      "创建时间": "2025-04-09 16:07:23",
      "研制厂商": "",
      "联系人": "",
      "联系方式": "",
      "通报基本情况": "753超威电源集团有限公司网络安全隐患通报 - 任务调度中心 - 弱口令",
      "隐患描述": "753超威电源集团有限公司网络安全隐患通报 - 任务调度中心 - 弱口令",
      "网站域名": "https://tms.chilwee.com/xxl-job-admin/toLogin",
      "影响评估": "",
      "紧急程度": "高危",
      "隐患发现时间": "2025-04-09 16:06:13",
      "国民经济行业分类": "信息传输、软件和信息技术服务业",
      "区域划分": "长兴县",
      "发现厂商设备": "",
      "发现厂商名称": "浙江海瑞网络科技有限公司",
      "涉及信息数量": "",
      "信息类型": "",
      "ip": "",
      "通报等级": "",
      "通报反馈天数": "7",
      "漏洞编号": "",
      "相关路径": "",
      "端口": "",
      "位置层级": "",
      "参考链接": "",
      "备注": "",
      "整改要求": "",
      "网站名称": "任务调度中心",
      "整改建议": "",
      "单位名称": "任务调度中心",
      "隐患域名url": "https://tms.chilwee.com/xxl-job-admin/toLogin",
      "隐患等级": "高危",
      "出现数量": "1",
      "隐患类型": "应用系统弱口令",
      "处置流程": "2025-04-09 16:31:27 开始\n\t处理人: 湖州关基操作员\n\t处置意见: 建议立即处理\n\n2025-04-10 16:32:43 简易处置\n\t处理人: 长兴网信\n\t处置意见: 整改复测完毕\n\t接收人员: 长兴网信\n\n2025-04-10 16:32:43 结束",
      "被提示区县/部门": "长兴县",
      "被提示人员": "长兴网信",
      "处置反馈时间": "2025-04-10 16:32:43",
      "处置耗时": "耗时:1天1分15秒"
    }
  },
  {
    "ent": "浙江超威城矿信息技术有限公司",
    "time": "2025-04-09 16:04:30",
    "level": "中危",
    "srcIp": "test.html.rgscenter.com",
    "srcPort": "8001",
    "dstIp": "test.html.rgscenter.com",
    "dstPort": "8001",
    "proto": "TCP",
    "policyId": "—",
    "ruleName": "752浙江超威城矿信息技术有限公司网络安全隐患通报 - Swagger - 未授权访问",
    "ruleType": "未受有效保护的API",
    "atkCount": "1",
    "hitCfg": "—",
    "alarmIv": "7天",
    "action": "已归档",
    "src": "自主录入",
    "_raw": {
      "事件编号": "202504090005",
      "发生时间": "2025-04-09 16:06:05",
      "事件状态": "已归档",
      "事件状态(小)": "已归档",
      "事件标题": "752浙江超威城矿信息技术有限公司网络安全隐患通报 - Swagger - 未授权访问",
      "事件来源": "自主录入",
      "分数": "",
      "创建时间": "2025-04-09 16:06:05",
      "研制厂商": "",
      "联系人": "",
      "联系方式": "",
      "通报基本情况": "752浙江超威城矿信息技术有限公司网络安全隐患通报 - Swagger - 未授权访问",
      "隐患描述": "752浙江超威城矿信息技术有限公司网络安全隐患通报 - Swagger - 未授权访问",
      "网站域名": "http://test.html.rgscenter.com:8001/swagger/index.html",
      "影响评估": "",
      "紧急程度": "中危",
      "隐患发现时间": "2025-04-09 16:04:30",
      "国民经济行业分类": "信息传输、软件和信息技术服务业",
      "区域划分": "长兴县",
      "发现厂商设备": "",
      "发现厂商名称": "浙江海瑞网络科技有限公司",
      "涉及信息数量": "",
      "信息类型": "",
      "ip": "",
      "通报等级": "",
      "通报反馈天数": "7",
      "漏洞编号": "",
      "相关路径": "",
      "端口": "",
      "位置层级": "",
      "参考链接": "",
      "备注": "",
      "整改要求": "",
      "网站名称": "swagger",
      "整改建议": "",
      "单位名称": "浙江超威城矿信息技术有限公司",
      "隐患域名url": "http://test.html.rgscenter.com:8001/swagger/index.html",
      "隐患等级": "中危",
      "出现数量": "1",
      "隐患类型": "未受有效保护的API",
      "处置流程": "2025-04-09 16:31:17 开始\n\t处理人: 湖州关基操作员\n\t处置意见: 建议立即处理\n\n2025-04-16 09:19:30 简易处置\n\t处理人: 长兴网信\n\t处置意见: 整改复测完毕\n\t接收人员: 长兴网信\n\n2025-04-16 09:19:30 结束",
      "被提示区县/部门": "长兴县",
      "被提示人员": "长兴网信",
      "处置反馈时间": "2025-04-16 09:19:30",
      "处置耗时": "耗时:6天16小时48分13秒"
    }
  },
  {
    "ent": "长兴县水利局",
    "time": "2025-04-09 14:32:00",
    "level": "中危",
    "srcIp": "10.21.196.33",
    "srcPort": "—",
    "dstIp": "10.21.196.33",
    "dstPort": "—",
    "proto": "—",
    "policyId": "—",
    "ruleName": "允许Traceroute探测",
    "ruleType": "扫描探测",
    "atkCount": "1",
    "hitCfg": "—",
    "alarmIv": "5天",
    "action": "已归档",
    "src": "自主录入",
    "_raw": {
      "事件编号": "202504090004",
      "发生时间": "2025-04-09 14:34:23",
      "事件状态": "已归档",
      "事件状态(小)": "已归档",
      "事件标题": "20250119长兴县水利局允许Traceroute探测网络安全预警通报",
      "事件来源": "自主录入",
      "分数": "",
      "创建时间": "2025-04-09 14:34:23",
      "研制厂商": "",
      "联系人": "",
      "联系方式": "",
      "通报基本情况": "允许Traceroute探测",
      "隐患描述": "允许Traceroute探测",
      "网站域名": "10.21.196.33",
      "影响评估": "",
      "紧急程度": "低危",
      "隐患发现时间": "2025-04-09 14:32:00",
      "国民经济行业分类": "农、林、牧、渔业",
      "区域划分": "长兴县",
      "发现厂商设备": "",
      "发现厂商名称": "长兴县网信办",
      "涉及信息数量": "",
      "信息类型": "",
      "ip": "",
      "通报等级": "",
      "通报反馈天数": "5",
      "漏洞编号": "",
      "相关路径": "",
      "端口": "",
      "位置层级": "",
      "参考链接": "",
      "备注": "",
      "整改要求": "",
      "网站名称": "10.21.196.33",
      "整改建议": "",
      "单位名称": "长兴县水利局",
      "隐患域名url": "10.21.196.33",
      "隐患等级": "中危",
      "出现数量": "1",
      "隐患类型": "扫描探测",
      "处置流程": "2025-04-10 10:20:06 开始\n\t处理人: 长兴网信\n\t处置意见: 整改反馈\n\n2025-04-10 10:21:30 简易处置\n\t处理人: 长兴网信\n\t处置意见: 整改完成\n\t接收人员: 长兴网信\n\n2025-04-10 10:21:30 结束",
      "被提示区县/部门": "长兴县",
      "被提示人员": "长兴网信",
      "处置反馈时间": "2025-04-10 10:21:30",
      "处置耗时": "耗时:1分24秒"
    }
  },
  {
    "ent": "长兴创睿科技有限公司",
    "time": "2025-04-08 16:18:24",
    "level": "高危",
    "srcIp": "pro.cxcrkj.com",
    "srcPort": "—",
    "dstIp": "pro.cxcrkj.com",
    "dstPort": "—",
    "proto": "—",
    "policyId": "—",
    "ruleName": "748长兴创睿科技有限公司网络安全隐患通报 - 后台管理系统 - 弱口令",
    "ruleType": "应用系统弱口令",
    "atkCount": "1",
    "hitCfg": "—",
    "alarmIv": "7天",
    "action": "已归档",
    "src": "自主录入",
    "_raw": {
      "事件编号": "202504080003",
      "发生时间": "2025-04-08 16:20:22",
      "事件状态": "已归档",
      "事件状态(小)": "已归档",
      "事件标题": "748长兴创睿科技有限公司网络安全隐患通报 - 后台管理系统 - 弱口令",
      "事件来源": "自主录入",
      "分数": "",
      "创建时间": "2025-04-08 16:20:22",
      "研制厂商": "",
      "联系人": "",
      "联系方式": "",
      "通报基本情况": "748长兴创睿科技有限公司网络安全隐患通报 - 后台管理系统 - 弱口令",
      "隐患描述": "748长兴创睿科技有限公司网络安全隐患通报 - 后台管理系统 - 弱口令",
      "网站域名": "https://pro.cxcrkj.com/admin/login/index.html",
      "影响评估": "",
      "紧急程度": "高危",
      "隐患发现时间": "2025-04-08 16:18:24",
      "国民经济行业分类": "信息传输、软件和信息技术服务业",
      "区域划分": "长兴县",
      "发现厂商设备": "",
      "发现厂商名称": "浙江海瑞网络科技有限公司",
      "涉及信息数量": "",
      "信息类型": "",
      "ip": "",
      "通报等级": "",
      "通报反馈天数": "7",
      "漏洞编号": "",
      "相关路径": "",
      "端口": "",
      "位置层级": "",
      "参考链接": "",
      "备注": "",
      "整改要求": "",
      "网站名称": "后台管理系统",
      "整改建议": "",
      "单位名称": "长兴创睿科技有限公司",
      "隐患域名url": "https://pro.cxcrkj.com/admin/login/index.html",
      "隐患等级": "高危",
      "出现数量": "1",
      "隐患类型": "应用系统弱口令",
      "处置流程": "2025-04-08 16:28:57 开始\n\t处理人: 湖州关基操作员\n\t处置意见: 建议立即处理\n\n2025-04-24 09:59:12 简易处置\n\t处理人: 长兴网信\n\t处置意见: 整改复测完毕\n\t接收人员: 长兴网信\n\n2025-04-24 09:59:12 结束",
      "被提示区县/部门": "长兴县",
      "被提示人员": "长兴网信",
      "处置反馈时间": "2025-04-24 09:59:12",
      "处置耗时": "耗时:15天17小时30分15秒"
    }
  },
  {
    "ent": "长兴县人力资源和社会保障局",
    "time": "2025-04-04 20:10:52",
    "level": "中危",
    "srcIp": "10.38.206.247",
    "srcPort": "—",
    "dstIp": "10.38.206.247",
    "dstPort": "—",
    "proto": "—",
    "policyId": "—",
    "ruleName": "F5 Nginx 、Apache Tomcat 安全漏洞",
    "ruleType": "扫描探测",
    "atkCount": "1",
    "hitCfg": "—",
    "alarmIv": "5天",
    "action": "已归档",
    "src": "自主录入",
    "_raw": {
      "事件编号": "202504040014",
      "发生时间": "2025-04-04 20:12:15",
      "事件状态": "已归档",
      "事件状态(小)": "已归档",
      "事件标题": "20250118长兴县人力资源和社会保障局F5 Nginx 、Apache Tomcat 安全漏洞预警通报",
      "事件来源": "自主录入",
      "分数": "",
      "创建时间": "2025-04-04 20:12:15",
      "研制厂商": "",
      "联系人": "",
      "联系方式": "",
      "通报基本情况": "F5 Nginx 、Apache Tomcat 安全漏洞",
      "隐患描述": "F5 Nginx 、Apache Tomcat 安全漏洞",
      "网站域名": "10.38.206.247",
      "影响评估": "",
      "紧急程度": "低危",
      "隐患发现时间": "2025-04-04 20:10:52",
      "国民经济行业分类": "公共管理、社会保障和社会组织",
      "区域划分": "长兴县",
      "发现厂商设备": "",
      "发现厂商名称": "长兴县网信办",
      "涉及信息数量": "",
      "信息类型": "",
      "ip": "",
      "通报等级": "",
      "通报反馈天数": "5",
      "漏洞编号": "",
      "相关路径": "",
      "端口": "",
      "位置层级": "",
      "参考链接": "",
      "备注": "",
      "整改要求": "",
      "网站名称": "10.38.206.247",
      "整改建议": "",
      "单位名称": "长兴县人力资源和社会保障局",
      "隐患域名url": "10.38.206.247",
      "隐患等级": "中危",
      "出现数量": "1",
      "隐患类型": "扫描探测",
      "处置流程": "2025-04-04 20:12:28 开始\n\t处理人: 长兴网信\n\t处置意见: 限期整改\n\n2025-04-04 20:12:56 简易处置\n\t处理人: 长兴网信\n\t处置意见: 整改完成\n\t接收人员: 长兴网信\n\n2025-04-04 20:12:56 结束",
      "被提示区县/部门": "长兴县",
      "被提示人员": "长兴网信",
      "处置反馈时间": "2025-04-04 20:12:56",
      "处置耗时": "耗时:28秒"
    }
  },
  {
    "ent": "长兴县人力资源和社会保障局",
    "time": "2025-04-04 20:08:00",
    "level": "中危",
    "srcIp": "10.21.195.35",
    "srcPort": "—",
    "dstIp": "10.21.195.35",
    "dstPort": "—",
    "proto": "—",
    "policyId": "—",
    "ruleName": "HTTP(S)获取远端WWW服务信息、Apache Tomcat 安全漏洞",
    "ruleType": "扫描探测",
    "atkCount": "1",
    "hitCfg": "—",
    "alarmIv": "5天",
    "action": "已归档",
    "src": "自主录入",
    "_raw": {
      "事件编号": "202504040013",
      "发生时间": "2025-04-04 20:09:26",
      "事件状态": "已归档",
      "事件状态(小)": "已归档",
      "事件标题": "20250117长兴县人力资源和社会保障局HTTP(S)获取远端WWW服务信息、Apache Tomcat 安全漏洞预警通报",
      "事件来源": "自主录入",
      "分数": "",
      "创建时间": "2025-04-04 20:09:26",
      "研制厂商": "",
      "联系人": "",
      "联系方式": "",
      "通报基本情况": "HTTP(S)获取远端WWW服务信息、Apache Tomcat 安全漏洞",
      "隐患描述": "HTTP(S)获取远端WWW服务信息、Apache Tomcat 安全漏洞",
      "网站域名": "10.21.195.35",
      "影响评估": "",
      "紧急程度": "低危",
      "隐患发现时间": "2025-04-04 20:08:00",
      "国民经济行业分类": "公共管理、社会保障和社会组织",
      "区域划分": "长兴县",
      "发现厂商设备": "",
      "发现厂商名称": "长兴县网信办",
      "涉及信息数量": "",
      "信息类型": "",
      "ip": "",
      "通报等级": "",
      "通报反馈天数": "5",
      "漏洞编号": "",
      "相关路径": "",
      "端口": "",
      "位置层级": "",
      "参考链接": "",
      "备注": "",
      "整改要求": "",
      "网站名称": "10.21.195.35",
      "整改建议": "",
      "单位名称": "长兴县人力资源和社会保障局",
      "隐患域名url": "10.21.195.35",
      "隐患等级": "中危",
      "出现数量": "1",
      "隐患类型": "扫描探测",
      "处置流程": "2025-04-04 20:10:24 开始\n\t处理人: 长兴网信\n\t处置意见: 限期整改\n\n2025-04-04 20:10:46 简易处置\n\t处理人: 长兴网信\n\t处置意见: 整改完成\n\t接收人员: 长兴网信\n\n2025-04-04 20:10:46 结束",
      "被提示区县/部门": "长兴县",
      "被提示人员": "长兴网信",
      "处置反馈时间": "2025-04-04 20:10:46",
      "处置耗时": "耗时:21秒"
    }
  },
  {
    "ent": "长兴县农业农村局",
    "time": "2025-04-04 19:27:52",
    "level": "中危",
    "srcIp": "10.21.196.151",
    "srcPort": "—",
    "dstIp": "10.21.196.151",
    "dstPort": "—",
    "proto": "—",
    "policyId": "—",
    "ruleName": "Oracle MySQL Kerberos 安全漏洞",
    "ruleType": "扫描探测",
    "atkCount": "1",
    "hitCfg": "—",
    "alarmIv": "5天",
    "action": "已归档",
    "src": "自主录入",
    "_raw": {
      "事件编号": "202504040012",
      "发生时间": "2025-04-04 19:28:43",
      "事件状态": "已归档",
      "事件状态(小)": "已归档",
      "事件标题": "20250116长兴县农业农村局Oracle MySQL Kerberos 安全漏洞预警通报",
      "事件来源": "自主录入",
      "分数": "",
      "创建时间": "2025-04-04 19:28:43",
      "研制厂商": "",
      "联系人": "",
      "联系方式": "",
      "通报基本情况": "Oracle MySQL Kerberos 安全漏洞",
      "隐患描述": "Oracle MySQL Kerberos 安全漏洞",
      "网站域名": "10.21.196.151",
      "影响评估": "",
      "紧急程度": "低危",
      "隐患发现时间": "2025-04-04 19:27:52",
      "国民经济行业分类": "农、林、牧、渔业",
      "区域划分": "长兴县",
      "发现厂商设备": "",
      "发现厂商名称": "长兴县网信办",
      "涉及信息数量": "",
      "信息类型": "",
      "ip": "",
      "通报等级": "",
      "通报反馈天数": "5",
      "漏洞编号": "",
      "相关路径": "",
      "端口": "",
      "位置层级": "",
      "参考链接": "",
      "备注": "",
      "整改要求": "",
      "网站名称": "10.21.196.151",
      "整改建议": "",
      "单位名称": "长兴县农业农村局",
      "隐患域名url": "10.21.196.151",
      "隐患等级": "中危",
      "出现数量": "1",
      "隐患类型": "扫描探测",
      "处置流程": "2025-04-04 19:52:27 开始\n\t处理人: 长兴网信\n\t处置意见: 限期整改\n\n2025-04-04 19:56:20 简易处置\n\t处理人: 长兴网信\n\t处置意见: 整改完毕\n\t接收人员: 长兴网信\n\n2025-04-04 19:56:20 结束",
      "被提示区县/部门": "长兴县",
      "被提示人员": "长兴网信",
      "处置反馈时间": "2025-04-04 19:56:20",
      "处置耗时": "耗时:3分53秒"
    }
  },
  {
    "ent": "长兴县农业农村局",
    "time": "2025-04-04 19:26:26",
    "level": "中危",
    "srcIp": "10.21.196.219",
    "srcPort": "—",
    "dstIp": "10.21.196.219",
    "dstPort": "—",
    "proto": "—",
    "policyId": "—",
    "ruleName": "10.21.196.219",
    "ruleType": "扫描探测",
    "atkCount": "1",
    "hitCfg": "—",
    "alarmIv": "5天",
    "action": "已归档",
    "src": "自主录入",
    "_raw": {
      "事件编号": "202504040011",
      "发生时间": "2025-04-04 19:27:37",
      "事件状态": "已归档",
      "事件状态(小)": "已归档",
      "事件标题": "20250115长兴县农业农村局Apache Tomcat 安全漏洞预警通报",
      "事件来源": "自主录入",
      "分数": "",
      "创建时间": "2025-04-04 19:27:37",
      "研制厂商": "",
      "联系人": "",
      "联系方式": "",
      "通报基本情况": "Apache Tomcat 安全漏洞",
      "隐患描述": "10.21.196.219",
      "网站域名": "10.21.196.219",
      "影响评估": "",
      "紧急程度": "低危",
      "隐患发现时间": "2025-04-04 19:26:26",
      "国民经济行业分类": "农、林、牧、渔业",
      "区域划分": "长兴县",
      "发现厂商设备": "",
      "发现厂商名称": "长兴县网信办",
      "涉及信息数量": "",
      "信息类型": "",
      "ip": "",
      "通报等级": "",
      "通报反馈天数": "5",
      "漏洞编号": "",
      "相关路径": "",
      "端口": "",
      "位置层级": "",
      "参考链接": "",
      "备注": "",
      "整改要求": "",
      "网站名称": "10.21.196.219",
      "整改建议": "",
      "单位名称": "长兴县农业农村局",
      "隐患域名url": "10.21.196.219",
      "隐患等级": "中危",
      "出现数量": "1",
      "隐患类型": "扫描探测",
      "处置流程": "2025-04-04 19:52:37 开始\n\t处理人: 长兴网信\n\t处置意见: 限期整改\n\n2025-04-04 19:58:25 简易处置\n\t处理人: 长兴网信\n\t处置意见: 整改完毕\n\t接收人员: 长兴网信\n\n2025-04-04 19:58:25 结束",
      "被提示区县/部门": "长兴县",
      "被提示人员": "长兴网信",
      "处置反馈时间": "2025-04-04 19:58:25",
      "处置耗时": "耗时:5分48秒"
    }
  },
  {
    "ent": "长兴县农业农村局",
    "time": "2025-04-04 19:24:02",
    "level": "中危",
    "srcIp": "10.21.195.29",
    "srcPort": "—",
    "dstIp": "10.21.195.29",
    "dstPort": "—",
    "proto": "—",
    "policyId": "—",
    "ruleName": "Oracle MySQL Kerberos 安全漏洞",
    "ruleType": "扫描探测",
    "atkCount": "1",
    "hitCfg": "—",
    "alarmIv": "5天",
    "action": "已归档",
    "src": "自主录入",
    "_raw": {
      "事件编号": "202504040010",
      "发生时间": "2025-04-04 19:26:12",
      "事件状态": "已归档",
      "事件状态(小)": "已归档",
      "事件标题": "20250114长兴县农业农村局Oracle MySQL Kerberos 安全漏洞预警通报",
      "事件来源": "自主录入",
      "分数": "",
      "创建时间": "2025-04-04 19:26:12",
      "研制厂商": "",
      "联系人": "",
      "联系方式": "",
      "通报基本情况": "Oracle MySQL Kerberos 安全漏洞",
      "隐患描述": "Oracle MySQL Kerberos 安全漏洞",
      "网站域名": "10.21.195.29",
      "影响评估": "",
      "紧急程度": "低危",
      "隐患发现时间": "2025-04-04 19:24:02",
      "国民经济行业分类": "农、林、牧、渔业",
      "区域划分": "长兴县",
      "发现厂商设备": "",
      "发现厂商名称": "长兴县网信办",
      "涉及信息数量": "",
      "信息类型": "",
      "ip": "",
      "通报等级": "",
      "通报反馈天数": "5",
      "漏洞编号": "",
      "相关路径": "",
      "端口": "",
      "位置层级": "",
      "参考链接": "",
      "备注": "",
      "整改要求": "",
      "网站名称": "10.21.195.29",
      "整改建议": "",
      "单位名称": "长兴县农业农村局",
      "隐患域名url": "10.21.195.29",
      "隐患等级": "中危",
      "出现数量": "1",
      "隐患类型": "扫描探测",
      "处置流程": "2025-04-04 19:52:46 开始\n\t处理人: 长兴网信\n\t处置意见: 限期整改\n\n2025-04-04 19:59:36 简易处置\n\t处理人: 长兴网信\n\t处置意见: 整改完成\n\t接收人员: 长兴网信\n\n2025-04-04 19:59:36 结束",
      "被提示区县/部门": "长兴县",
      "被提示人员": "长兴网信",
      "处置反馈时间": "2025-04-04 19:59:36",
      "处置耗时": "耗时:6分50秒"
    }
  },
  {
    "ent": "长兴县吕山乡人民政府",
    "time": "2025-04-04 15:01:14",
    "level": "中危",
    "srcIp": "10.38.207.43",
    "srcPort": "—",
    "dstIp": "10.38.207.43",
    "dstPort": "—",
    "proto": "—",
    "policyId": "—",
    "ruleName": "F5 Nginx 安全漏洞",
    "ruleType": "扫描探测",
    "atkCount": "1",
    "hitCfg": "—",
    "alarmIv": "5天",
    "action": "已归档",
    "src": "自主录入",
    "_raw": {
      "事件编号": "202504040008",
      "发生时间": "2025-04-04 15:05:36",
      "事件状态": "已归档",
      "事件状态(小)": "已归档",
      "事件标题": "20250113长兴县吕山乡人民政府F5 Nginx 安全漏洞预警通报",
      "事件来源": "自主录入",
      "分数": "",
      "创建时间": "2025-04-04 15:05:36",
      "研制厂商": "",
      "联系人": "",
      "联系方式": "",
      "通报基本情况": "F5 Nginx 安全漏洞",
      "隐患描述": "F5 Nginx 安全漏洞",
      "网站域名": "10.38.207.43",
      "影响评估": "",
      "紧急程度": "低危",
      "隐患发现时间": "2025-04-04 15:01:14",
      "国民经济行业分类": "其它",
      "区域划分": "长兴县",
      "发现厂商设备": "",
      "发现厂商名称": "长兴县网信办",
      "涉及信息数量": "",
      "信息类型": "",
      "ip": "",
      "通报等级": "",
      "通报反馈天数": "5",
      "漏洞编号": "",
      "相关路径": "",
      "端口": "",
      "位置层级": "",
      "参考链接": "",
      "备注": "",
      "整改要求": "",
      "网站名称": "10.38.207.43",
      "整改建议": "",
      "单位名称": "长兴县吕山乡人民政府",
      "隐患域名url": "10.38.207.43",
      "隐患等级": "中危",
      "出现数量": "1",
      "隐患类型": "扫描探测",
      "处置流程": "2025-04-04 19:52:59 开始\n\t处理人: 长兴网信\n\t处置意见: 限期整改\n\n2025-04-04 20:01:00 简易处置\n\t处理人: 长兴网信\n\t处置意见: 整改完毕\n\t接收人员: 长兴网信\n\n2025-04-04 20:01:00 结束",
      "被提示区县/部门": "长兴县",
      "被提示人员": "长兴网信",
      "处置反馈时间": "2025-04-04 20:01:00",
      "处置耗时": "耗时:8分1秒"
    }
  },
  {
    "ent": "长兴县吕山乡人民政府",
    "time": "2025-04-04 14:58:32",
    "level": "中危",
    "srcIp": "10.38.207.44",
    "srcPort": "—",
    "dstIp": "10.38.207.44",
    "dstPort": "—",
    "proto": "—",
    "policyId": "—",
    "ruleName": "Oracle MySQL 安全漏洞",
    "ruleType": "扫描探测",
    "atkCount": "1",
    "hitCfg": "—",
    "alarmIv": "5天",
    "action": "已归档",
    "src": "自主录入",
    "_raw": {
      "事件编号": "202504040007",
      "发生时间": "2025-04-04 15:00:54",
      "事件状态": "已归档",
      "事件状态(小)": "已归档",
      "事件标题": "20250112长兴县吕山乡人民政府Oracle MySQL 安全漏洞预警通报",
      "事件来源": "自主录入",
      "分数": "",
      "创建时间": "2025-04-04 15:00:54",
      "研制厂商": "",
      "联系人": "",
      "联系方式": "",
      "通报基本情况": "Oracle MySQL 安全漏洞",
      "隐患描述": "Oracle MySQL 安全漏洞",
      "网站域名": "10.38.207.44",
      "影响评估": "",
      "紧急程度": "低危",
      "隐患发现时间": "2025-04-04 14:58:32",
      "国民经济行业分类": "其它",
      "区域划分": "长兴县",
      "发现厂商设备": "",
      "发现厂商名称": "长兴县网信办",
      "涉及信息数量": "",
      "信息类型": "",
      "ip": "",
      "通报等级": "",
      "通报反馈天数": "5",
      "漏洞编号": "",
      "相关路径": "",
      "端口": "",
      "位置层级": "",
      "参考链接": "",
      "备注": "",
      "整改要求": "",
      "网站名称": "10.38.207.44",
      "整改建议": "",
      "单位名称": "长兴县吕山乡人民政府",
      "隐患域名url": "10.38.207.44",
      "隐患等级": "中危",
      "出现数量": "1",
      "隐患类型": "扫描探测",
      "处置流程": "2025-04-04 19:53:10 开始\n\t处理人: 长兴网信\n\t处置意见: 限期整改\n\n2025-04-04 20:01:39 简易处置\n\t处理人: 长兴网信\n\t处置意见: 整改完成\n\t接收人员: 长兴网信\n\n2025-04-04 20:01:39 结束",
      "被提示区县/部门": "长兴县",
      "被提示人员": "长兴网信",
      "处置反馈时间": "2025-04-04 20:01:39",
      "处置耗时": "耗时:8分29秒"
    }
  },
  {
    "ent": "长兴县吕山乡人民政府",
    "time": "2025-04-04 14:51:09",
    "level": "中危",
    "srcIp": "10.21.215.203",
    "srcPort": "—",
    "dstIp": "10.21.215.203",
    "dstPort": "—",
    "proto": "—",
    "policyId": "—",
    "ruleName": "Oracle MySQLMariaDB Server 输入验证错误漏洞",
    "ruleType": "扫描探测",
    "atkCount": "1",
    "hitCfg": "—",
    "alarmIv": "5天",
    "action": "已归档",
    "src": "自主录入",
    "_raw": {
      "事件编号": "202504040006",
      "发生时间": "2025-04-04 14:52:59",
      "事件状态": "已归档",
      "事件状态(小)": "已归档",
      "事件标题": "20250111长兴县吕山乡人民政府Oracle MySQLMariaDB Server 输入验证错误漏洞预警通报",
      "事件来源": "自主录入",
      "分数": "",
      "创建时间": "2025-04-04 14:52:59",
      "研制厂商": "",
      "联系人": "",
      "联系方式": "",
      "通报基本情况": "Oracle MySQLMariaDB Server 输入验证错误漏洞",
      "隐患描述": "Oracle MySQLMariaDB Server 输入验证错误漏洞",
      "网站域名": "10.21.215.203",
      "影响评估": "",
      "紧急程度": "低危",
      "隐患发现时间": "2025-04-04 14:51:09",
      "国民经济行业分类": "其它",
      "区域划分": "长兴县",
      "发现厂商设备": "",
      "发现厂商名称": "长兴县网信办",
      "涉及信息数量": "",
      "信息类型": "",
      "ip": "",
      "通报等级": "",
      "通报反馈天数": "5",
      "漏洞编号": "",
      "相关路径": "",
      "端口": "",
      "位置层级": "",
      "参考链接": "",
      "备注": "",
      "整改要求": "",
      "网站名称": "10.21.215.203",
      "整改建议": "",
      "单位名称": "长兴县吕山乡人民政府",
      "隐患域名url": "10.21.215.203",
      "隐患等级": "中危",
      "出现数量": "1",
      "隐患类型": "扫描探测",
      "处置流程": "2025-04-04 19:53:19 开始\n\t处理人: 长兴网信\n\t处置意见: 限期整改\n\n2025-04-04 20:02:03 简易处置\n\t处理人: 长兴网信\n\t处置意见: 整改完成\n\t接收人员: 长兴网信\n\n2025-04-04 20:02:03 结束",
      "被提示区县/部门": "长兴县",
      "被提示人员": "长兴网信",
      "处置反馈时间": "2025-04-04 20:02:03",
      "处置耗时": "耗时:8分43秒"
    }
  },
  {
    "ent": "长兴县林城镇人民政府",
    "time": "2025-04-04 14:39:44",
    "level": "中危",
    "srcIp": "10.38.197.20",
    "srcPort": "—",
    "dstIp": "10.38.197.20",
    "dstPort": "—",
    "proto": "—",
    "policyId": "—",
    "ruleName": "网络终端Oracle MySQL Server 安全漏洞",
    "ruleType": "扫描探测",
    "atkCount": "1",
    "hitCfg": "—",
    "alarmIv": "5天",
    "action": "已归档",
    "src": "自主录入",
    "_raw": {
      "事件编号": "202504040005",
      "发生时间": "2025-04-04 14:41:24",
      "事件状态": "已归档",
      "事件状态(小)": "已归档",
      "事件标题": "20250110长兴县林城镇人民政府网络终端Oracle MySQL Server 安全漏洞预警通报",
      "事件来源": "自主录入",
      "分数": "",
      "创建时间": "2025-04-04 14:41:24",
      "研制厂商": "",
      "联系人": "",
      "联系方式": "",
      "通报基本情况": "网络终端Oracle MySQL Server 安全漏洞",
      "隐患描述": "网络终端Oracle MySQL Server 安全漏洞",
      "网站域名": "10.38.197.20",
      "影响评估": "",
      "紧急程度": "低危",
      "隐患发现时间": "2025-04-04 14:39:44",
      "国民经济行业分类": "其它",
      "区域划分": "长兴县",
      "发现厂商设备": "",
      "发现厂商名称": "长兴县网信办",
      "涉及信息数量": "",
      "信息类型": "",
      "ip": "",
      "通报等级": "",
      "通报反馈天数": "5",
      "漏洞编号": "",
      "相关路径": "",
      "端口": "",
      "位置层级": "",
      "参考链接": "",
      "备注": "",
      "整改要求": "",
      "网站名称": "10.38.197.20",
      "整改建议": "",
      "单位名称": "长兴县林城镇人民政府",
      "隐患域名url": "10.38.197.20",
      "隐患等级": "中危",
      "出现数量": "1",
      "隐患类型": "扫描探测",
      "处置流程": "2025-04-04 19:53:30 开始\n\t处理人: 长兴网信\n\t处置意见: 限期整改\n\n2025-04-04 20:05:21 简易处置\n\t处理人: 长兴网信\n\t处置意见: 整改完成\n\t接收人员: 长兴网信\n\n2025-04-04 20:05:21 结束",
      "被提示区县/部门": "长兴县",
      "被提示人员": "长兴网信",
      "处置反馈时间": "2025-04-04 20:05:21",
      "处置耗时": "耗时:11分50秒"
    }
  },
  {
    "ent": "长兴县交通运输局",
    "time": "2025-04-04 14:32:34",
    "level": "中危",
    "srcIp": "10.21.196.197",
    "srcPort": "—",
    "dstIp": "10.21.196.197",
    "dstPort": "—",
    "proto": "—",
    "policyId": "—",
    "ruleName": "网络终端F5 Nginx 安全漏洞",
    "ruleType": "扫描探测",
    "atkCount": "1",
    "hitCfg": "—",
    "alarmIv": "5天",
    "action": "已归档",
    "src": "自主录入",
    "_raw": {
      "事件编号": "202504040004",
      "发生时间": "2025-04-04 14:35:00",
      "事件状态": "已归档",
      "事件状态(小)": "已归档",
      "事件标题": "20250109长兴县交通运输局网络终端F5 Nginx 安全漏洞预警通报",
      "事件来源": "自主录入",
      "分数": "",
      "创建时间": "2025-04-04 14:35:00",
      "研制厂商": "",
      "联系人": "",
      "联系方式": "",
      "通报基本情况": "网络终端F5 Nginx 安全漏洞",
      "隐患描述": "网络终端F5 Nginx 安全漏洞",
      "网站域名": "10.21.196.197",
      "影响评估": "",
      "紧急程度": "低危",
      "隐患发现时间": "2025-04-04 14:32:34",
      "国民经济行业分类": "交通运输、仓储和邮政业",
      "区域划分": "长兴县",
      "发现厂商设备": "",
      "发现厂商名称": "长兴县网信办",
      "涉及信息数量": "",
      "信息类型": "",
      "ip": "",
      "通报等级": "",
      "通报反馈天数": "5",
      "漏洞编号": "",
      "相关路径": "",
      "端口": "",
      "位置层级": "",
      "参考链接": "",
      "备注": "",
      "整改要求": "",
      "网站名称": "10.21.196.197",
      "整改建议": "",
      "单位名称": "长兴县交通运输局",
      "隐患域名url": "10.21.196.197",
      "隐患等级": "中危",
      "出现数量": "1",
      "隐患类型": "扫描探测",
      "处置流程": "2025-04-04 19:53:40 开始\n\t处理人: 长兴网信\n\t处置意见: 限期整改\n\n2025-04-04 20:04:46 简易处置\n\t处理人: 长兴网信\n\t处置意见: 整改完成\n\t接收人员: 长兴网信\n\n2025-04-04 20:04:46 结束",
      "被提示区县/部门": "长兴县",
      "被提示人员": "长兴网信",
      "处置反馈时间": "2025-04-04 20:04:46",
      "处置耗时": "耗时:11分6秒"
    }
  },
  {
    "ent": "长兴县虹星桥镇人民政府",
    "time": "2025-04-04 14:28:09",
    "level": "中危",
    "srcIp": "10.21.221.148",
    "srcPort": "—",
    "dstIp": "10.21.221.148",
    "dstPort": "—",
    "proto": "—",
    "policyId": "—",
    "ruleName": "网络终端远程FTP服务器根目录匿名可写",
    "ruleType": "扫描探测",
    "atkCount": "1",
    "hitCfg": "—",
    "alarmIv": "5天",
    "action": "已归档",
    "src": "自主录入",
    "_raw": {
      "事件编号": "202504040003",
      "发生时间": "2025-04-04 14:30:10",
      "事件状态": "已归档",
      "事件状态(小)": "已归档",
      "事件标题": "20250108长兴县虹星桥镇人民政府网络终端远程FTP服务器根目录匿名可写预警通报",
      "事件来源": "自主录入",
      "分数": "",
      "创建时间": "2025-04-04 14:30:10",
      "研制厂商": "",
      "联系人": "",
      "联系方式": "",
      "通报基本情况": "网络终端远程FTP服务器根目录匿名可写",
      "隐患描述": "网络终端远程FTP服务器根目录匿名可写",
      "网站域名": "10.21.221.148",
      "影响评估": "",
      "紧急程度": "低危",
      "隐患发现时间": "2025-04-04 14:28:09",
      "国民经济行业分类": "其它",
      "区域划分": "长兴县",
      "发现厂商设备": "",
      "发现厂商名称": "长兴县网信办",
      "涉及信息数量": "",
      "信息类型": "",
      "ip": "",
      "通报等级": "",
      "通报反馈天数": "5",
      "漏洞编号": "",
      "相关路径": "",
      "端口": "",
      "位置层级": "",
      "参考链接": "",
      "备注": "",
      "整改要求": "",
      "网站名称": "10.21.221.148",
      "整改建议": "",
      "单位名称": "长兴县虹星桥镇人民政府",
      "隐患域名url": "10.21.221.148",
      "隐患等级": "中危",
      "出现数量": "1",
      "隐患类型": "扫描探测",
      "处置流程": "2025-04-04 19:53:50 开始\n\t处理人: 长兴网信\n\t处置意见: 限期整改\n\n2025-04-04 20:04:11 简易处置\n\t处理人: 长兴网信\n\t处置意见: 整改完成\n\t接收人员: 长兴网信\n\n2025-04-04 20:04:11 结束",
      "被提示区县/部门": "长兴县",
      "被提示人员": "长兴网信",
      "处置反馈时间": "2025-04-04 20:04:11",
      "处置耗时": "耗时:10分20秒"
    }
  },
  {
    "ent": "长兴县大科园",
    "time": "2025-04-04 14:00:05",
    "level": "中危",
    "srcIp": "172.21.223.73",
    "srcPort": "—",
    "dstIp": "172.21.223.73",
    "dstPort": "—",
    "proto": "—",
    "policyId": "—",
    "ruleName": "Microsoft SQL Server sqldmo.dll ActiveX控件缓冲区溢出漏洞(CVE-2007-4814)",
    "ruleType": "扫描探测",
    "atkCount": "1",
    "hitCfg": "—",
    "alarmIv": "5天",
    "action": "已归档",
    "src": "自主录入",
    "_raw": {
      "事件编号": "202504040002",
      "发生时间": "2025-04-04 14:04:30",
      "事件状态": "已归档",
      "事件状态(小)": "已归档",
      "事件标题": "20250107长兴县大科园网络终端SQL溢出漏洞预警通报",
      "事件来源": "自主录入",
      "分数": "",
      "创建时间": "2025-04-04 14:04:30",
      "研制厂商": "",
      "联系人": "",
      "联系方式": "",
      "通报基本情况": "Microsoft SQL Server sqldmo.dll ActiveX控件缓冲区溢出漏洞(CVE-2007-4814)",
      "隐患描述": "Microsoft SQL Server sqldmo.dll ActiveX控件缓冲区溢出漏洞(CVE-2007-4814)",
      "网站域名": "172.21.223.73",
      "影响评估": "",
      "紧急程度": "低危",
      "隐患发现时间": "2025-04-04 14:00:05",
      "国民经济行业分类": "科学研究和技术服务业",
      "区域划分": "长兴县",
      "发现厂商设备": "",
      "发现厂商名称": "长兴县网信办",
      "涉及信息数量": "",
      "信息类型": "",
      "ip": "",
      "通报等级": "",
      "通报反馈天数": "5",
      "漏洞编号": "",
      "相关路径": "",
      "端口": "",
      "位置层级": "",
      "参考链接": "",
      "备注": "",
      "整改要求": "",
      "网站名称": "172.21.223.73",
      "整改建议": "",
      "单位名称": "长兴县大科园",
      "隐患域名url": "172.21.223.73",
      "隐患等级": "中危",
      "出现数量": "1",
      "隐患类型": "扫描探测",
      "处置流程": "2025-04-04 19:54:02 开始\n\t处理人: 长兴网信\n\t处置意见: 限期整改\n\n2025-04-04 20:03:26 简易处置\n\t处理人: 长兴网信\n\t处置意见: 整改完成\n\t接收人员: 长兴网信\n\n2025-04-04 20:03:26 结束",
      "被提示区县/部门": "长兴县",
      "被提示人员": "长兴网信",
      "处置反馈时间": "2025-04-04 20:03:26",
      "处置耗时": "耗时:9分24秒"
    }
  },
  {
    "ent": "长兴县财政局",
    "time": "2025-04-04 13:51:42",
    "level": "中危",
    "srcIp": "172.21.205.243",
    "srcPort": "—",
    "dstIp": "172.21.205.243",
    "dstPort": "—",
    "proto": "—",
    "policyId": "—",
    "ruleName": "长兴县财政局网络终端F5 Nginx 安全漏洞",
    "ruleType": "扫描探测",
    "atkCount": "1",
    "hitCfg": "—",
    "alarmIv": "5天",
    "action": "已归档",
    "src": "自主录入",
    "_raw": {
      "事件编号": "202504040001",
      "发生时间": "2025-04-04 13:54:10",
      "事件状态": "已归档",
      "事件状态(小)": "已归档",
      "事件标题": "20250106长兴县财政局网络终端F5 Nginx 安全漏洞预警通报",
      "事件来源": "自主录入",
      "分数": "",
      "创建时间": "2025-04-04 13:54:10",
      "研制厂商": "",
      "联系人": "",
      "联系方式": "",
      "通报基本情况": "长兴县财政局网络终端F5 Nginx 安全漏洞",
      "隐患描述": "长兴县财政局网络终端F5 Nginx 安全漏洞",
      "网站域名": "172.21.205.243",
      "影响评估": "",
      "紧急程度": "低危",
      "隐患发现时间": "2025-04-04 13:51:42",
      "国民经济行业分类": "金融业",
      "区域划分": "长兴县",
      "发现厂商设备": "",
      "发现厂商名称": "长兴县网信办",
      "涉及信息数量": "",
      "信息类型": "",
      "ip": "",
      "通报等级": "",
      "通报反馈天数": "5",
      "漏洞编号": "",
      "相关路径": "",
      "端口": "",
      "位置层级": "",
      "参考链接": "",
      "备注": "",
      "整改要求": "",
      "网站名称": "172.21.205.243",
      "整改建议": "",
      "单位名称": "长兴县财政局",
      "隐患域名url": "172.21.205.243",
      "隐患等级": "中危",
      "出现数量": "1",
      "隐患类型": "扫描探测",
      "处置流程": "2025-04-04 19:52:02 开始\n\t处理人: 长兴网信\n\t处置意见: 限期整改\n\n2025-04-04 20:06:02 简易处置\n\t处理人: 长兴网信\n\t处置意见: 整改完成\n\t接收人员: 长兴网信\n\n2025-04-04 20:06:02 结束",
      "被提示区县/部门": "长兴县",
      "被提示人员": "长兴网信",
      "处置反馈时间": "2025-04-04 20:06:02",
      "处置耗时": "耗时:14分0秒"
    }
  },
  {
    "ent": "长兴昇阳科技有限公司",
    "time": "2025-04-02 15:36:10",
    "level": "中危",
    "srcIp": "hnpm.sumyoungtech.com",
    "srcPort": "8112",
    "dstIp": "hnpm.sumyoungtech.com",
    "dstPort": "8112",
    "proto": "TCP",
    "policyId": "—",
    "ruleName": "698长兴昇阳科技有限公司网络安全隐患通报 - Swagger - 未授权访问",
    "ruleType": "未受有效保护的API",
    "atkCount": "1",
    "hitCfg": "—",
    "alarmIv": "7天",
    "action": "已归档",
    "src": "自主录入",
    "_raw": {
      "事件编号": "202504020007",
      "发生时间": "2025-04-02 15:38:03",
      "事件状态": "已归档",
      "事件状态(小)": "已归档",
      "事件标题": "698长兴昇阳科技有限公司网络安全隐患通报 - Swagger - 未授权访问",
      "事件来源": "自主录入",
      "分数": "",
      "创建时间": "2025-04-02 15:38:03",
      "研制厂商": "",
      "联系人": "",
      "联系方式": "",
      "通报基本情况": "698长兴昇阳科技有限公司网络安全隐患通报 - Swagger - 未授权访问",
      "隐患描述": "698长兴昇阳科技有限公司网络安全隐患通报 - Swagger - 未授权访问",
      "网站域名": "http://hnpm.sumyoungtech.com:8112/docs",
      "影响评估": "",
      "紧急程度": "中危",
      "隐患发现时间": "2025-04-02 15:36:10",
      "国民经济行业分类": "制造业",
      "区域划分": "长兴县",
      "发现厂商设备": "",
      "发现厂商名称": "浙江海瑞网络科技有限公司",
      "涉及信息数量": "",
      "信息类型": "",
      "ip": "",
      "通报等级": "",
      "通报反馈天数": "7",
      "漏洞编号": "",
      "相关路径": "",
      "端口": "",
      "位置层级": "",
      "参考链接": "",
      "备注": "",
      "整改要求": "",
      "网站名称": "swagger",
      "整改建议": "",
      "单位名称": "长兴昇阳科技有限公司",
      "隐患域名url": "http://hnpm.sumyoungtech.com:8112/docs",
      "隐患等级": "中危",
      "出现数量": "1",
      "隐患类型": "未受有效保护的API",
      "处置流程": "2025-04-02 16:39:52 开始\n\t处理人: 湖州关基操作员\n\t处置意见: 建议立即处理\n\n2025-04-10 11:31:02 简易处置\n\t处理人: 长兴网信\n\t处置意见: 整改复测完成\n\t接收人员: 长兴网信\n\n2025-04-10 11:31:02 结束",
      "被提示区县/部门": "长兴县",
      "被提示人员": "长兴网信",
      "处置反馈时间": "2025-04-10 11:31:02",
      "处置耗时": "耗时:7天18小时51分10秒"
    }
  },
  {
    "ent": "长兴昇阳科技有限公司",
    "time": "2025-04-01 15:22:56",
    "level": "中危",
    "srcIp": "hnpm.sumyoungtech.com",
    "srcPort": "8118",
    "dstIp": "hnpm.sumyoungtech.com",
    "dstPort": "8118",
    "proto": "TCP",
    "policyId": "—",
    "ruleName": "689长兴昇阳科技有限公司网络安全隐患通报 - Swagger - 未授权访问",
    "ruleType": "未受有效保护的API",
    "atkCount": "1",
    "hitCfg": "—",
    "alarmIv": "7天",
    "action": "已归档",
    "src": "自主录入",
    "_raw": {
      "事件编号": "202504010005",
      "发生时间": "2025-04-01 15:24:17",
      "事件状态": "已归档",
      "事件状态(小)": "已归档",
      "事件标题": "689长兴昇阳科技有限公司网络安全隐患通报 - Swagger - 未授权访问",
      "事件来源": "自主录入",
      "分数": "",
      "创建时间": "2025-04-01 15:24:17",
      "研制厂商": "",
      "联系人": "",
      "联系方式": "",
      "通报基本情况": "689长兴昇阳科技有限公司网络安全隐患通报 - Swagger - 未授权访问",
      "隐患描述": "689长兴昇阳科技有限公司网络安全隐患通报 - Swagger - 未授权访问",
      "网站域名": "http://hnpm.sumyoungtech.com:8118",
      "影响评估": "",
      "紧急程度": "中危",
      "隐患发现时间": "2025-04-01 15:22:56",
      "国民经济行业分类": "制造业",
      "区域划分": "长兴县",
      "发现厂商设备": "",
      "发现厂商名称": "浙江海瑞网络科技有限公司",
      "涉及信息数量": "",
      "信息类型": "",
      "ip": "",
      "通报等级": "",
      "通报反馈天数": "7",
      "漏洞编号": "",
      "相关路径": "",
      "端口": "",
      "位置层级": "",
      "参考链接": "",
      "备注": "",
      "整改要求": "",
      "网站名称": "Swagger",
      "整改建议": "",
      "单位名称": "长兴昇阳科技有限公司",
      "隐患域名url": "http://hnpm.sumyoungtech.com:8118",
      "隐患等级": "中危",
      "出现数量": "1",
      "隐患类型": "未受有效保护的API",
      "处置流程": "2025-04-01 15:37:10 开始\n\t处理人: 湖州关基操作员\n\t处置意见: 建议立即处理\n\n2025-04-10 11:31:41 简易处置\n\t处理人: 长兴网信\n\t处置意见: 整改复测完成\n\t接收人员: 长兴网信\n\n2025-04-10 11:31:41 结束",
      "被提示区县/部门": "长兴县",
      "被提示人员": "长兴网信",
      "处置反馈时间": "2025-04-10 11:31:41",
      "处置耗时": "耗时:8天19小时54分31秒"
    }
  },
  {
    "ent": "长兴昇阳科技有限公司",
    "time": "2025-04-01 15:14:20",
    "level": "中危",
    "srcIp": "cloud.sumyoungtech.com",
    "srcPort": "1883",
    "dstIp": "cloud.sumyoungtech.com",
    "dstPort": "1883",
    "proto": "TCP",
    "policyId": "—",
    "ruleName": "688长兴昇阳科技有限公司网络安全隐患通报 - MQTT - 未授权访问",
    "ruleType": "其他",
    "atkCount": "1",
    "hitCfg": "—",
    "alarmIv": "7天",
    "action": "已归档",
    "src": "自主录入",
    "_raw": {
      "事件编号": "202504010004",
      "发生时间": "2025-04-01 15:15:56",
      "事件状态": "已归档",
      "事件状态(小)": "已归档",
      "事件标题": "688长兴昇阳科技有限公司网络安全隐患通报 - MQTT - 未授权访问",
      "事件来源": "自主录入",
      "分数": "",
      "创建时间": "2025-04-01 15:15:56",
      "研制厂商": "",
      "联系人": "",
      "联系方式": "",
      "通报基本情况": "688长兴昇阳科技有限公司网络安全隐患通报 - MQTT - 未授权访问",
      "隐患描述": "688长兴昇阳科技有限公司网络安全隐患通报 - MQTT - 未授权访问",
      "网站域名": "cloud.sumyoungtech.com:1883",
      "影响评估": "",
      "紧急程度": "中危",
      "隐患发现时间": "2025-04-01 15:14:20",
      "国民经济行业分类": "制造业",
      "区域划分": "长兴县",
      "发现厂商设备": "",
      "发现厂商名称": "浙江海瑞网络科技有限公司",
      "涉及信息数量": "",
      "信息类型": "",
      "ip": "",
      "通报等级": "",
      "通报反馈天数": "7",
      "漏洞编号": "",
      "相关路径": "",
      "端口": "",
      "位置层级": "",
      "参考链接": "",
      "备注": "",
      "整改要求": "",
      "网站名称": "MQTT",
      "整改建议": "",
      "单位名称": "长兴昇阳科技有限公司",
      "隐患域名url": "cloud.sumyoungtech.com:1883",
      "隐患等级": "中危",
      "出现数量": "1",
      "隐患类型": "其他",
      "处置流程": "2025-04-01 15:36:44 开始\n\t处理人: 湖州关基操作员\n\t处置意见: 建议立即处理\n\n2025-04-11 16:49:27 简易处置\n\t处理人: 长兴网信\n\t处置意见: 整改复测完毕\n\t接收人员: 长兴网信\n\n2025-04-11 16:49:27 结束",
      "被提示区县/部门": "长兴县",
      "被提示人员": "长兴网信",
      "处置反馈时间": "2025-04-11 16:49:27",
      "处置耗时": "耗时:10天1小时12分43秒"
    }
  },
  {
    "ent": "长兴交通投资集团汽车运输有限公司",
    "time": "2025-04-01 15:11:32",
    "level": "中危",
    "srcIp": "zjcxbus.com",
    "srcPort": "—",
    "dstIp": "zjcxbus.com",
    "dstPort": "—",
    "proto": "—",
    "policyId": "—",
    "ruleName": "687长兴交通投资集团汽车运输有限公司网络安全隐患通报 - 我的网站 - 未授权访问",
    "ruleType": "未受有效保护的API",
    "atkCount": "1",
    "hitCfg": "—",
    "alarmIv": "7天",
    "action": "已归档",
    "src": "自主录入",
    "_raw": {
      "事件编号": "202504010003",
      "发生时间": "2025-04-01 15:12:46",
      "事件状态": "已归档",
      "事件状态(小)": "已归档",
      "事件标题": "687长兴交通投资集团汽车运输有限公司网络安全隐患通报 - 我的网站 - 未授权访问",
      "事件来源": "自主录入",
      "分数": "",
      "创建时间": "2025-04-01 15:12:46",
      "研制厂商": "",
      "联系人": "",
      "联系方式": "",
      "通报基本情况": "687长兴交通投资集团汽车运输有限公司网络安全隐患通报 - 我的网站 - 未授权访问",
      "隐患描述": "687长兴交通投资集团汽车运输有限公司网络安全隐患通报 - 我的网站 - 未授权访问",
      "网站域名": "http://zjcxbus.com/api.html",
      "影响评估": "",
      "紧急程度": "低危",
      "隐患发现时间": "2025-04-01 15:11:32",
      "国民经济行业分类": "交通运输、仓储和邮政业",
      "区域划分": "长兴县",
      "发现厂商设备": "",
      "发现厂商名称": "浙江海瑞网络科技有限公司",
      "涉及信息数量": "",
      "信息类型": "",
      "ip": "",
      "通报等级": "",
      "通报反馈天数": "7",
      "漏洞编号": "",
      "相关路径": "",
      "端口": "",
      "位置层级": "",
      "参考链接": "",
      "备注": "",
      "整改要求": "",
      "网站名称": "我的网站",
      "整改建议": "",
      "单位名称": "长兴交通投资集团汽车运输有限公司",
      "隐患域名url": "http://zjcxbus.com/api.html",
      "隐患等级": "中危",
      "出现数量": "1",
      "隐患类型": "未受有效保护的API",
      "处置流程": "2025-04-01 15:36:32 开始\n\t处理人: 湖州关基操作员\n\t处置意见: 建议立即处理\n\n2025-04-07 16:33:07 简易处置\n\t处理人: 长兴网信\n\t处置意见: 已整改复测完成\n\t接收人员: 长兴网信\n\n2025-04-07 16:33:07 结束",
      "被提示区县/部门": "长兴县",
      "被提示人员": "长兴网信",
      "处置反馈时间": "2025-04-07 16:33:07",
      "处置耗时": "耗时:6天56分34秒"
    }
  },
  {
    "ent": "浙江嗨便利网络科技有限公司",
    "time": "2025-03-28 16:20:42",
    "level": "高危",
    "srcIp": "erp.hibianli.com",
    "srcPort": "9080",
    "dstIp": "erp.hibianli.com",
    "dstPort": "9080",
    "proto": "TCP",
    "policyId": "—",
    "ruleName": "649浙江嗨便利网络科技有限公司网络安全隐患通报 - 金蝶云星空 - 反序列化",
    "ruleType": "反序列化漏洞",
    "atkCount": "1",
    "hitCfg": "—",
    "alarmIv": "7天",
    "action": "已归档",
    "src": "自主录入",
    "_raw": {
      "事件编号": "202503280029",
      "发生时间": "2025-03-28 16:22:16",
      "事件状态": "已归档",
      "事件状态(小)": "已归档",
      "事件标题": "649浙江嗨便利网络科技有限公司网络安全隐患通报 - 金蝶云星空 - 反序列化",
      "事件来源": "自主录入",
      "分数": "",
      "创建时间": "2025-03-28 16:22:16",
      "研制厂商": "",
      "联系人": "",
      "联系方式": "",
      "通报基本情况": "649浙江嗨便利网络科技有限公司网络安全隐患通报 - 金蝶云星空 - 反序列化",
      "隐患描述": "649浙江嗨便利网络科技有限公司网络安全隐患通报 - 金蝶云星空 - 反序列化",
      "网站域名": "http://erp.hibianli.com:9080/k3cloud",
      "影响评估": "",
      "紧急程度": "高危",
      "隐患发现时间": "2025-03-28 16:20:42",
      "国民经济行业分类": "信息传输、软件和信息技术服务业",
      "区域划分": "长兴县",
      "发现厂商设备": "",
      "发现厂商名称": "浙江海瑞网络科技有限公司",
      "涉及信息数量": "",
      "信息类型": "",
      "ip": "",
      "通报等级": "",
      "通报反馈天数": "7",
      "漏洞编号": "",
      "相关路径": "",
      "端口": "",
      "位置层级": "",
      "参考链接": "",
      "备注": "",
      "整改要求": "",
      "网站名称": "金蝶云星空",
      "整改建议": "",
      "单位名称": "浙江嗨便利网络科技有限公司",
      "隐患域名url": "http://erp.hibianli.com:9080/k3cloud",
      "隐患等级": "高危",
      "出现数量": "1",
      "隐患类型": "反序列化漏洞",
      "处置流程": "2025-03-28 16:25:44 开始\n\t处理人: 湖州关基操作员\n\t处置意见: 建议立即处理\n\n2025-04-10 16:33:37 简易处置\n\t处理人: 长兴网信\n\t处置意见: 整改复测完毕\n\t接收人员: 长兴网信\n\n2025-04-10 16:33:37 结束",
      "被提示区县/部门": "长兴县",
      "被提示人员": "长兴网信",
      "处置反馈时间": "2025-04-10 16:33:37",
      "处置耗时": "耗时:13天7分52秒"
    }
  },
  {
    "ent": "长兴县数据局",
    "time": "2025-03-21 17:19:38",
    "level": "中危",
    "srcIp": "MQTT",
    "srcPort": "—",
    "dstIp": "MQTT",
    "dstPort": "—",
    "proto": "—",
    "policyId": "—",
    "ruleName": "611长兴县数据局网络安全隐患通报 - MQTT - 未授权访问",
    "ruleType": "其他",
    "atkCount": "1",
    "hitCfg": "—",
    "alarmIv": "7天",
    "action": "已归档",
    "src": "自主录入",
    "_raw": {
      "事件编号": "202503210036",
      "发生时间": "2025-03-21 17:20:57",
      "事件状态": "已归档",
      "事件状态(小)": "已归档",
      "事件标题": "611长兴县数据局网络安全隐患通报 - MQTT - 未授权访问",
      "事件来源": "自主录入",
      "分数": "",
      "创建时间": "2025-03-21 17:20:57",
      "研制厂商": "",
      "联系人": "",
      "联系方式": "",
      "通报基本情况": "611长兴县数据局网络安全隐患通报 - MQTT - 未授权访问",
      "隐患描述": "611长兴县数据局网络安全隐患通报 - MQTT - 未授权访问",
      "网站域名": "MQTT://lsx.zjcx.gov.cn:1883",
      "影响评估": "",
      "紧急程度": "低危",
      "隐患发现时间": "2025-03-21 17:19:38",
      "国民经济行业分类": "其它",
      "区域划分": "长兴县",
      "发现厂商设备": "",
      "发现厂商名称": "浙江海瑞网络科技有限公司",
      "涉及信息数量": "",
      "信息类型": "",
      "ip": "",
      "通报等级": "",
      "通报反馈天数": "7",
      "漏洞编号": "",
      "相关路径": "",
      "端口": "",
      "位置层级": "",
      "参考链接": "",
      "备注": "",
      "整改要求": "",
      "网站名称": "mqtt",
      "整改建议": "",
      "单位名称": "长兴县数据局",
      "隐患域名url": "MQTT://lsx.zjcx.gov.cn:1883",
      "隐患等级": "中危",
      "出现数量": "1",
      "隐患类型": "其他",
      "处置流程": "2025-03-21 17:21:24 开始\n\t处理人: 湖州关基操作员\n\t处置意见: 建议立即处理\n\n2025-03-25 17:26:39 简易处置\n\t处理人: 长兴网信\n\t处置意见: 整改复测完毕\n\t接收人员: 长兴网信\n\n2025-03-25 17:26:39 结束",
      "被提示区县/部门": "长兴县",
      "被提示人员": "长兴网信",
      "处置反馈时间": "2025-03-25 17:26:39",
      "处置耗时": "耗时:4天5分15秒"
    }
  },
  {
    "ent": "湖州独木舟信息科技有限公司",
    "time": "2025-03-21 17:10:25",
    "level": "中危",
    "srcIp": "movie.canotek.cn",
    "srcPort": "8096",
    "dstIp": "movie.canotek.cn",
    "dstPort": "8096",
    "proto": "TCP",
    "policyId": "—",
    "ruleName": "606湖州独木舟信息科技有限公司网络安全隐患通报 - Swagger - 未授权访问",
    "ruleType": "未受有效保护的API",
    "atkCount": "1",
    "hitCfg": "—",
    "alarmIv": "7天",
    "action": "已归档",
    "src": "自主录入",
    "_raw": {
      "事件编号": "202503210031",
      "发生时间": "2025-03-21 17:12:47",
      "事件状态": "已归档",
      "事件状态(小)": "已归档",
      "事件标题": "606湖州独木舟信息科技有限公司网络安全隐患通报 - Swagger - 未授权访问",
      "事件来源": "自主录入",
      "分数": "",
      "创建时间": "2025-03-21 17:12:47",
      "研制厂商": "",
      "联系人": "",
      "联系方式": "",
      "通报基本情况": "606湖州独木舟信息科技有限公司网络安全隐患通报 - Swagger - 未授权访问",
      "隐患描述": "606湖州独木舟信息科技有限公司网络安全隐患通报 - Swagger - 未授权访问",
      "网站域名": "http://movie.canotek.cn:8096/swagger/",
      "影响评估": "",
      "紧急程度": "中危",
      "隐患发现时间": "2025-03-21 17:10:25",
      "国民经济行业分类": "信息传输、软件和信息技术服务业",
      "区域划分": "长兴县",
      "发现厂商设备": "",
      "发现厂商名称": "浙江海瑞网络科技有限公司",
      "涉及信息数量": "",
      "信息类型": "",
      "ip": "",
      "通报等级": "",
      "通报反馈天数": "7",
      "漏洞编号": "",
      "相关路径": "",
      "端口": "",
      "位置层级": "",
      "参考链接": "",
      "备注": "",
      "整改要求": "",
      "网站名称": "swagger",
      "整改建议": "",
      "单位名称": "湖州独木舟信息科技有限公司",
      "隐患域名url": "http://movie.canotek.cn:8096/swagger/",
      "隐患等级": "中危",
      "出现数量": "1",
      "隐患类型": "未受有效保护的API",
      "处置流程": "2025-03-21 17:22:14 开始\n\t处理人: 湖州关基操作员\n\t处置意见: 建议立即处理\n\n2025-03-25 17:29:00 简易处置\n\t处理人: 长兴网信\n\t处置意见: 整改复测完毕\n\t接收人员: 长兴网信\n\n2025-03-25 17:29:00 结束",
      "被提示区县/部门": "长兴县",
      "被提示人员": "长兴网信",
      "处置反馈时间": "2025-03-25 17:29:00",
      "处置耗时": "耗时:4天6分45秒"
    }
  },
  {
    "ent": "湖州壹芯信息科技有限公司",
    "time": "2025-03-19 14:56:14",
    "level": "高危",
    "srcIp": "ndgn.jukebang.top",
    "srcPort": "—",
    "dstIp": "ndgn.jukebang.top",
    "dstPort": "—",
    "proto": "—",
    "policyId": "—",
    "ruleName": "560湖州壹芯信息科技有限公司网络安全隐患通报 - 后台管理系统 - 弱口令",
    "ruleType": "应用系统弱口令",
    "atkCount": "1",
    "hitCfg": "—",
    "alarmIv": "7天",
    "action": "已归档",
    "src": "自主录入",
    "_raw": {
      "事件编号": "202503190001",
      "发生时间": "2025-03-19 14:59:18",
      "事件状态": "已归档",
      "事件状态(小)": "已归档",
      "事件标题": "560湖州壹芯信息科技有限公司网络安全隐患通报 - 后台管理系统 - 弱口令",
      "事件来源": "自主录入",
      "分数": "",
      "创建时间": "2025-03-19 14:59:18",
      "研制厂商": "",
      "联系人": "",
      "联系方式": "",
      "通报基本情况": "560湖州壹芯信息科技有限公司网络安全隐患通报 - 后台管理系统 - 弱口令",
      "隐患描述": "560湖州壹芯信息科技有限公司网络安全隐患通报 - 后台管理系统 - 弱口令",
      "网站域名": "https://ndgn.jukebang.top/admin/login",
      "影响评估": "",
      "紧急程度": "高危",
      "隐患发现时间": "2025-03-19 14:56:14",
      "国民经济行业分类": "信息传输、软件和信息技术服务业",
      "区域划分": "长兴县",
      "发现厂商设备": "",
      "发现厂商名称": "浙江海瑞网络科技有限公司",
      "涉及信息数量": "",
      "信息类型": "",
      "ip": "",
      "通报等级": "",
      "通报反馈天数": "7",
      "漏洞编号": "",
      "相关路径": "",
      "端口": "",
      "位置层级": "",
      "参考链接": "",
      "备注": "",
      "整改要求": "",
      "网站名称": "后台管理系统",
      "整改建议": "",
      "单位名称": "湖州壹芯信息科技有限公司",
      "隐患域名url": "https://ndgn.jukebang.top/admin/login",
      "隐患等级": "高危",
      "出现数量": "1",
      "隐患类型": "应用系统弱口令",
      "处置流程": "2025-03-19 15:25:57 开始\n\t处理人: 湖州关基操作员\n\t处置意见: 建议立即处理\n\n2025-03-20 15:11:37 简易处置\n\t处理人: 长兴网信\n\t处置意见: 整改复测完毕\n\t接收人员: 长兴网信\n\n2025-03-20 15:11:37 结束",
      "被提示区县/部门": "长兴县",
      "被提示人员": "长兴网信",
      "处置反馈时间": "2025-03-20 15:11:37",
      "处置耗时": "耗时:23小时45分40秒"
    }
  },
  {
    "ent": "生态环境局长兴分局",
    "time": "2025-03-18 17:25:11",
    "level": "中危",
    "srcIp": "10.21.211.7",
    "srcPort": "—",
    "dstIp": "10.21.211.7",
    "dstPort": "—",
    "proto": "—",
    "policyId": "—",
    "ruleName": "生态环境局长兴分局政务信息系统终端网络安全问题",
    "ruleType": "应用系统弱口令",
    "atkCount": "1",
    "hitCfg": "—",
    "alarmIv": "7天",
    "action": "已归档",
    "src": "自主录入",
    "_raw": {
      "事件编号": "202503180012",
      "发生时间": "2025-03-18 17:28:35",
      "事件状态": "已归档",
      "事件状态(小)": "已归档",
      "事件标题": "20250105生态环境局长兴分局政务信息系统终端网络安全问题隐患通报",
      "事件来源": "自主录入",
      "分数": "",
      "创建时间": "2025-03-18 17:28:35",
      "研制厂商": "",
      "联系人": "",
      "联系方式": "",
      "通报基本情况": "生态环境局长兴分局政务信息系统终端网络安全问题",
      "隐患描述": "生态环境局长兴分局政务信息系统终端网络安全问题",
      "网站域名": "10.21.211.7",
      "影响评估": "",
      "紧急程度": "低危",
      "隐患发现时间": "2025-03-18 17:25:11",
      "国民经济行业分类": "其它",
      "区域划分": "长兴县",
      "发现厂商设备": "",
      "发现厂商名称": "长兴县网信办",
      "涉及信息数量": "",
      "信息类型": "",
      "ip": "",
      "通报等级": "",
      "通报反馈天数": "7",
      "漏洞编号": "",
      "相关路径": "",
      "端口": "",
      "位置层级": "",
      "参考链接": "",
      "备注": "",
      "整改要求": "",
      "网站名称": "10.21.211.7",
      "整改建议": "",
      "单位名称": "生态环境局长兴分局",
      "隐患域名url": "10.21.211.7",
      "隐患等级": "中危",
      "出现数量": "1",
      "隐患类型": "应用系统弱口令",
      "处置流程": "2025-03-18 17:28:56 开始\n\t处理人: 长兴网信\n\t处置意见: 建议立即整改\n\n2025-03-18 17:29:13 简易处置\n\t处理人: 长兴网信\n\t处置意见: 已落实整改\n\t接收人员: 长兴网信\n\n2025-03-18 17:29:13 结束",
      "被提示区县/部门": "长兴县",
      "被提示人员": "长兴网信",
      "处置反馈时间": "2025-03-18 17:29:13",
      "处置耗时": "耗时:17秒"
    }
  },
  {
    "ent": "长兴县技师学校",
    "time": "2025-03-18 17:19:06",
    "level": "中危",
    "srcIp": "115.231.242.130",
    "srcPort": "—",
    "dstIp": "115.231.242.130",
    "dstPort": "—",
    "proto": "—",
    "policyId": "—",
    "ruleName": "长兴县技工学校遭受僵尸网络后门木马wannaary攻击成功事件",
    "ruleType": "其他",
    "atkCount": "1",
    "hitCfg": "—",
    "alarmIv": "7天",
    "action": "已归档",
    "src": "自主录入",
    "_raw": {
      "事件编号": "202503180011",
      "发生时间": "2025-03-18 17:20:48",
      "事件状态": "已归档",
      "事件状态(小)": "已归档",
      "事件标题": "20250104长兴县技师学校遭受僵尸网络后门木马wannaary攻击成功事件",
      "事件来源": "自主录入",
      "分数": "",
      "创建时间": "2025-03-18 17:20:48",
      "研制厂商": "",
      "联系人": "",
      "联系方式": "",
      "通报基本情况": "长兴县技工学校遭受僵尸网络后门木马wannaary攻击成功事件",
      "隐患描述": "长兴县技工学校遭受僵尸网络后门木马wannaary攻击成功事件",
      "网站域名": "115.231.242.130",
      "影响评估": "",
      "紧急程度": "低危",
      "隐患发现时间": "2025-03-18 17:19:06",
      "国民经济行业分类": "教育",
      "区域划分": "长兴县",
      "发现厂商设备": "",
      "发现厂商名称": "长兴县网信办",
      "涉及信息数量": "",
      "信息类型": "",
      "ip": "",
      "通报等级": "",
      "通报反馈天数": "7",
      "漏洞编号": "",
      "相关路径": "",
      "端口": "",
      "位置层级": "",
      "参考链接": "",
      "备注": "",
      "整改要求": "",
      "网站名称": "115.231.242.130",
      "整改建议": "",
      "单位名称": "长兴县技师学校",
      "隐患域名url": "115.231.242.130",
      "隐患等级": "中危",
      "出现数量": "1",
      "隐患类型": "其他",
      "处置流程": "2025-03-18 17:21:05 开始\n\t处理人: 长兴网信\n\t处置意见: 建议立即整改\n\n2025-03-18 17:21:28 简易处置\n\t处理人: 长兴网信\n\t处置意见: 已落实整改\n\t接收人员: 长兴网信\n\n2025-03-18 17:21:28 结束",
      "被提示区县/部门": "长兴县",
      "被提示人员": "长兴网信",
      "处置反馈时间": "2025-03-18 17:21:28",
      "处置耗时": "耗时:23秒"
    }
  },
  {
    "ent": "长兴县小浦小学",
    "time": "2025-03-18 17:16:00",
    "level": "中危",
    "srcIp": "115.238.224.110",
    "srcPort": "—",
    "dstIp": "115.238.224.110",
    "dstPort": "—",
    "proto": "—",
    "policyId": "—",
    "ruleName": "长兴县教育局校校通工程-僵尸网络后门木马wannaary攻击成功事件",
    "ruleType": "其他",
    "atkCount": "1",
    "hitCfg": "—",
    "alarmIv": "7天",
    "action": "已归档",
    "src": "自主录入",
    "_raw": {
      "事件编号": "202503180010",
      "发生时间": "2025-03-18 17:17:27",
      "事件状态": "已归档",
      "事件状态(小)": "已归档",
      "事件标题": "20250103长兴县教育局校校通工程-僵尸网络后门木马wannaary攻击成功事件",
      "事件来源": "自主录入",
      "分数": "",
      "创建时间": "2025-03-18 17:17:27",
      "研制厂商": "",
      "联系人": "",
      "联系方式": "",
      "通报基本情况": "长兴县教育局校校通工程-僵尸网络后门木马wannaary攻击成功事件",
      "隐患描述": "长兴县教育局校校通工程-僵尸网络后门木马wannaary攻击成功事件",
      "网站域名": "115.238.224.110",
      "影响评估": "",
      "紧急程度": "低危",
      "隐患发现时间": "2025-03-18 17:16:00",
      "国民经济行业分类": "教育",
      "区域划分": "长兴县",
      "发现厂商设备": "",
      "发现厂商名称": "长兴县网信办",
      "涉及信息数量": "",
      "信息类型": "",
      "ip": "",
      "通报等级": "",
      "通报反馈天数": "7",
      "漏洞编号": "",
      "相关路径": "",
      "端口": "",
      "位置层级": "",
      "参考链接": "",
      "备注": "",
      "整改要求": "",
      "网站名称": "115.238.224.110",
      "整改建议": "",
      "单位名称": "长兴县小浦小学",
      "隐患域名url": "115.238.224.110",
      "隐患等级": "中危",
      "出现数量": "1",
      "隐患类型": "其他",
      "处置流程": "2025-03-18 17:17:44 开始\n\t处理人: 长兴网信\n\t处置意见: 建议立即整改\n\n2025-03-18 17:18:47 简易处置\n\t处理人: 长兴网信\n\t处置意见: 已经落实整改\n\t接收人员: 长兴网信\n\n2025-03-18 17:18:47 结束",
      "被提示区县/部门": "长兴县",
      "被提示人员": "长兴网信",
      "处置反馈时间": "2025-03-18 17:18:47",
      "处置耗时": "耗时:1分2秒"
    }
  },
  {
    "ent": "长兴县太湖高级中学",
    "time": "2025-03-18 17:06:23",
    "level": "中危",
    "srcIp": "61.175.123.82",
    "srcPort": "23",
    "dstIp": "61.175.123.82",
    "dstPort": "23",
    "proto": "TCP",
    "policyId": "—",
    "ruleName": "长兴县太湖高级中学所属Telnet端口存在弱口令漏洞的事件",
    "ruleType": "应用系统弱口令",
    "atkCount": "1",
    "hitCfg": "—",
    "alarmIv": "7天",
    "action": "已归档",
    "src": "自主录入",
    "_raw": {
      "事件编号": "202503180009",
      "发生时间": "2025-03-18 17:11:33",
      "事件状态": "已归档",
      "事件状态(小)": "已归档",
      "事件标题": "20250102长兴县太湖高级中学所属Telnet端口存在弱口令漏洞的事件",
      "事件来源": "自主录入",
      "分数": "",
      "创建时间": "2025-03-18 17:11:33",
      "研制厂商": "",
      "联系人": "",
      "联系方式": "",
      "通报基本情况": "长兴县太湖高级中学所属Telnet端口存在弱口令漏洞的事件",
      "隐患描述": "长兴县太湖高级中学所属Telnet端口存在弱口令漏洞的事件",
      "网站域名": "http://61.175.123.82:23",
      "影响评估": "",
      "紧急程度": "低危",
      "隐患发现时间": "2025-03-18 17:06:23",
      "国民经济行业分类": "教育",
      "区域划分": "长兴县",
      "发现厂商设备": "",
      "发现厂商名称": "长兴县网信办",
      "涉及信息数量": "",
      "信息类型": "",
      "ip": "",
      "通报等级": "",
      "通报反馈天数": "7",
      "漏洞编号": "",
      "相关路径": "",
      "端口": "",
      "位置层级": "",
      "参考链接": "",
      "备注": "",
      "整改要求": "",
      "网站名称": "http://61.175.123.82:23",
      "整改建议": "",
      "单位名称": "长兴县太湖高级中学",
      "隐患域名url": "61.175.123.82",
      "隐患等级": "中危",
      "出现数量": "1",
      "隐患类型": "应用系统弱口令",
      "处置流程": "2025-03-18 17:11:53 开始\n\t处理人: 长兴网信\n\t处置意见: 建议立即整改\n\n2025-03-18 17:12:18 简易处置\n\t处理人: 长兴网信\n\t处置意见: 已经整改完毕\n\t接收人员: 长兴网信\n\n2025-03-18 17:12:18 结束",
      "被提示区县/部门": "长兴县",
      "被提示人员": "长兴网信",
      "处置反馈时间": "2025-03-18 17:12:18",
      "处置耗时": "耗时:24秒"
    }
  },
  {
    "ent": "长兴县信息中心",
    "time": "2025-03-18 16:21:31",
    "level": "中危",
    "srcIp": "218.75.54.156",
    "srcPort": "—",
    "dstIp": "218.75.54.156",
    "dstPort": "—",
    "proto": "—",
    "policyId": "—",
    "ruleName": "疑似长兴县信息中心-僵尸网络后门木马wannaary攻击成功事件",
    "ruleType": "其他",
    "atkCount": "1",
    "hitCfg": "—",
    "alarmIv": "7天",
    "action": "已归档",
    "src": "自主录入",
    "_raw": {
      "事件编号": "202503180008",
      "发生时间": "2025-03-18 16:45:08",
      "事件状态": "已归档",
      "事件状态(小)": "已归档",
      "事件标题": "20250101长兴县信息中心网络安全通报-木马wannaary攻击",
      "事件来源": "自主录入",
      "分数": "",
      "创建时间": "2025-03-18 16:45:08",
      "研制厂商": "",
      "联系人": "",
      "联系方式": "",
      "通报基本情况": "疑似长兴县信息中心-僵尸网络后门木马wannaary攻击成功事件",
      "隐患描述": "疑似长兴县信息中心-僵尸网络后门木马wannaary攻击成功事件",
      "网站域名": "218.75.54.156",
      "影响评估": "",
      "紧急程度": "中危",
      "隐患发现时间": "2025-03-18 16:21:31",
      "国民经济行业分类": "其它",
      "区域划分": "长兴县",
      "发现厂商设备": "",
      "发现厂商名称": "长兴县网信办",
      "涉及信息数量": "",
      "信息类型": "",
      "ip": "",
      "通报等级": "",
      "通报反馈天数": "7",
      "漏洞编号": "",
      "相关路径": "",
      "端口": "",
      "位置层级": "",
      "参考链接": "",
      "备注": "",
      "整改要求": "",
      "网站名称": "218.75.54.156",
      "整改建议": "",
      "单位名称": "长兴县信息中心",
      "隐患域名url": "218.75.54.156",
      "隐患等级": "中危",
      "出现数量": "1",
      "隐患类型": "其他",
      "处置流程": "2025-03-18 17:01:10 开始\n\t处理人: 长兴网信\n\t处置意见: 建议立即整改\n\n2025-03-18 17:01:41 简易上报\n\t处理人: 长兴网信\n\t处置意见: 已经整改完毕\n\t接收人员: 长兴网信\n\n2025-03-18 17:01:41 结束",
      "被提示区县/部门": "长兴县",
      "被提示人员": "长兴网信",
      "处置反馈时间": "2025-03-18 17:01:41",
      "处置耗时": "耗时:30秒"
    }
  },
  {
    "ent": "长兴县金陵高级中学",
    "time": "2025-03-14 15:15:16",
    "level": "高危",
    "srcIp": "111.3.180.50",
    "srcPort": "22",
    "dstIp": "111.3.180.50",
    "dstPort": "22",
    "proto": "TCP",
    "policyId": "—",
    "ruleName": "526长兴县金陵高级中学网络安全隐患通报 - H3C防火墙 - 弱口令",
    "ruleType": "应用系统弱口令",
    "atkCount": "1",
    "hitCfg": "—",
    "alarmIv": "7天",
    "action": "已归档",
    "src": "自主录入",
    "_raw": {
      "事件编号": "202503140009",
      "发生时间": "2025-03-14 15:16:31",
      "事件状态": "已归档",
      "事件状态(小)": "已归档",
      "事件标题": "526长兴县金陵高级中学网络安全隐患通报 - H3C防火墙 - 弱口令",
      "事件来源": "自主录入",
      "分数": "",
      "创建时间": "2025-03-14 15:16:31",
      "研制厂商": "",
      "联系人": "",
      "联系方式": "",
      "通报基本情况": "526长兴县金陵高级中学网络安全隐患通报 - H3C防火墙 - 弱口令",
      "隐患描述": "526长兴县金陵高级中学网络安全隐患通报 - H3C防火墙 - 弱口令",
      "网站域名": "111.3.180.50:22",
      "影响评估": "",
      "紧急程度": "高危",
      "隐患发现时间": "2025-03-14 15:15:16",
      "国民经济行业分类": "教育",
      "区域划分": "长兴县",
      "发现厂商设备": "",
      "发现厂商名称": "浙江海瑞网络科技有限公司",
      "涉及信息数量": "",
      "信息类型": "",
      "ip": "",
      "通报等级": "",
      "通报反馈天数": "7",
      "漏洞编号": "",
      "相关路径": "",
      "端口": "",
      "位置层级": "",
      "参考链接": "",
      "备注": "",
      "整改要求": "",
      "网站名称": "H3C防火墙",
      "整改建议": "",
      "单位名称": "长兴县金陵高级中学",
      "隐患域名url": "111.3.180.50:22",
      "隐患等级": "高危",
      "出现数量": "1",
      "隐患类型": "应用系统弱口令",
      "处置流程": "2025-03-14 15:35:04 开始\n\t处理人: 湖州关基操作员\n\t处置意见: 建议立即处理\n\n2025-03-19 14:42:24 简易处置\n\t处理人: 长兴网信\n\t处置意见: 已整改复测完成\n\t接收人员: 长兴网信\n\n2025-03-19 14:42:24 结束",
      "被提示区县/部门": "长兴县",
      "被提示人员": "长兴网信",
      "处置反馈时间": "2025-03-19 14:42:24",
      "处置耗时": "耗时:4天23小时7分19秒"
    }
  },
  {
    "ent": "丘沃智能科技（湖州）有限公司",
    "time": "2025-03-13 16:34:26",
    "level": "中危",
    "srcIp": "MQTT",
    "srcPort": "—",
    "dstIp": "MQTT",
    "dstPort": "—",
    "proto": "—",
    "policyId": "—",
    "ruleName": "518丘沃智能科技（湖州）有限公司网络安全隐患通报 - MQTT - 未授权访问",
    "ruleType": "敏感信息泄露",
    "atkCount": "1",
    "hitCfg": "—",
    "alarmIv": "7天",
    "action": "已归档",
    "src": "自主录入",
    "_raw": {
      "事件编号": "202503130011",
      "发生时间": "2025-03-13 16:36:13",
      "事件状态": "已归档",
      "事件状态(小)": "已归档",
      "事件标题": "518丘沃智能科技（湖州）有限公司网络安全隐患通报 - MQTT - 未授权访问",
      "事件来源": "自主录入",
      "分数": "",
      "创建时间": "2025-03-13 16:36:13",
      "研制厂商": "",
      "联系人": "",
      "联系方式": "",
      "通报基本情况": "518丘沃智能科技（湖州）有限公司网络安全隐患通报 - MQTT - 未授权访问",
      "隐患描述": "518丘沃智能科技（湖州）有限公司网络安全隐患通报 - MQTT - 未授权访问",
      "网站域名": "MQTT://old.agrox.cloud:1883",
      "影响评估": "",
      "紧急程度": "中危",
      "隐患发现时间": "2025-03-13 16:34:26",
      "国民经济行业分类": "其它",
      "区域划分": "长兴县",
      "发现厂商设备": "",
      "发现厂商名称": "浙江海瑞网络科技有限公司",
      "涉及信息数量": "",
      "信息类型": "",
      "ip": "",
      "通报等级": "",
      "通报反馈天数": "7",
      "漏洞编号": "",
      "相关路径": "",
      "端口": "",
      "位置层级": "",
      "参考链接": "",
      "备注": "",
      "整改要求": "",
      "网站名称": "MQTT",
      "整改建议": "",
      "单位名称": "丘沃智能科技（湖州）有限公司",
      "隐患域名url": "MQTT://old.agrox.cloud:1883",
      "隐患等级": "中危",
      "出现数量": "1",
      "隐患类型": "敏感信息泄露",
      "处置流程": "2025-03-13 16:40:14 开始\n\t处理人: 湖州关基操作员\n\t处置意见: 建议立即处置\n\n2025-03-18 15:18:50 简易处置\n\t处理人: 长兴网信\n\t处置意见: 整改复测完毕\n\t接收人员: 长兴网信\n\n2025-03-18 15:18:50 结束",
      "被提示区县/部门": "长兴县",
      "被提示人员": "长兴网信",
      "处置反馈时间": "2025-03-18 15:18:50",
      "处置耗时": "耗时:4天22小时38分35秒"
    }
  },
  {
    "ent": "天能电池集团股份有限公司",
    "time": "2025-03-12 16:01:09",
    "level": "中危",
    "srcIp": "MQTT",
    "srcPort": "—",
    "dstIp": "MQTT",
    "dstPort": "—",
    "proto": "—",
    "policyId": "—",
    "ruleName": "508天能电池集团股份有限公司网络安全隐患通报 - MQTT - 未授权访问",
    "ruleType": "敏感信息泄露",
    "atkCount": "1",
    "hitCfg": "—",
    "alarmIv": "7天",
    "action": "已归档",
    "src": "自主录入",
    "_raw": {
      "事件编号": "202503120009",
      "发生时间": "2025-03-12 16:01:15",
      "事件状态": "已归档",
      "事件状态(小)": "已归档",
      "事件标题": "508天能电池集团股份有限公司网络安全隐患通报 - MQTT - 未授权访问",
      "事件来源": "自主录入",
      "分数": "",
      "创建时间": "2025-03-12 16:01:15",
      "研制厂商": "",
      "联系人": "",
      "联系方式": "",
      "通报基本情况": "508天能电池集团股份有限公司网络安全隐患通报 - MQTT - 未授权访问",
      "隐患描述": "508天能电池集团股份有限公司网络安全隐患通报 - MQTT - 未授权访问",
      "网站域名": "MQTT://baogongapp.etianneng.cn:1883",
      "影响评估": "",
      "紧急程度": "中危",
      "隐患发现时间": "2025-03-12 16:01:09",
      "国民经济行业分类": "其它",
      "区域划分": "长兴县",
      "发现厂商设备": "",
      "发现厂商名称": "浙江海瑞网络科技有限公司",
      "涉及信息数量": "",
      "信息类型": "",
      "ip": "",
      "通报等级": "",
      "通报反馈天数": "7",
      "漏洞编号": "",
      "相关路径": "",
      "端口": "",
      "位置层级": "",
      "参考链接": "",
      "备注": "",
      "整改要求": "",
      "网站名称": "MQTT",
      "整改建议": "",
      "单位名称": "天能电池集团股份有限公司",
      "隐患域名url": "122.225.116.118",
      "隐患等级": "中危",
      "出现数量": "1",
      "隐患类型": "敏感信息泄露",
      "处置流程": "2025-03-12 16:01:16 开始\n\t处理人: 湖州关基操作员\n\t处置意见: 建议立即处理\n\n2025-03-14 17:32:45 简易处置\n\t处理人: 长兴网信\n\t处置意见: 整改复测完成\n\t接收人员: 长兴网信\n\n2025-03-14 17:32:45 结束",
      "被提示区县/部门": "长兴县",
      "被提示人员": "长兴网信",
      "处置反馈时间": "2025-03-14 17:32:45",
      "处置耗时": "耗时:2天1小时31分29秒"
    }
  },
  {
    "ent": "诺力智能装备股份有限公司",
    "time": "2025-03-12 16:01:09",
    "level": "高危",
    "srcIp": "oa.noblelift.cn",
    "srcPort": "8098",
    "dstIp": "oa.noblelift.cn",
    "dstPort": "8098",
    "proto": "TCP",
    "policyId": "—",
    "ruleName": "507诺力智能装备股份有限公司网络安全隐患通报 - 万傲瑞达6000 - 弱口令",
    "ruleType": "应用系统弱口令",
    "atkCount": "1",
    "hitCfg": "—",
    "alarmIv": "7天",
    "action": "已归档",
    "src": "自主录入",
    "_raw": {
      "事件编号": "202503120008",
      "发生时间": "2025-03-12 16:01:14",
      "事件状态": "已归档",
      "事件状态(小)": "已归档",
      "事件标题": "507诺力智能装备股份有限公司网络安全隐患通报 - 万傲瑞达6000 - 弱口令",
      "事件来源": "自主录入",
      "分数": "",
      "创建时间": "2025-03-12 16:01:14",
      "研制厂商": "",
      "联系人": "",
      "联系方式": "",
      "通报基本情况": "507诺力智能装备股份有限公司网络安全隐患通报 - 万傲瑞达6000 - 弱口令",
      "隐患描述": "507诺力智能装备股份有限公司网络安全隐患通报 - 万傲瑞达6000 - 弱口令",
      "网站域名": "http://oa.noblelift.cn:8098/main.do?home",
      "影响评估": "",
      "紧急程度": "高危",
      "隐患发现时间": "2025-03-12 16:01:09",
      "国民经济行业分类": "其它",
      "区域划分": "长兴县",
      "发现厂商设备": "",
      "发现厂商名称": "浙江海瑞网络科技有限公司",
      "涉及信息数量": "",
      "信息类型": "",
      "ip": "",
      "通报等级": "",
      "通报反馈天数": "7",
      "漏洞编号": "",
      "相关路径": "",
      "端口": "",
      "位置层级": "",
      "参考链接": "",
      "备注": "",
      "整改要求": "",
      "网站名称": "万傲瑞达6000",
      "整改建议": "",
      "单位名称": "诺力智能装备股份有限公司",
      "隐患域名url": "122.225.127.21",
      "隐患等级": "高危",
      "出现数量": "1",
      "隐患类型": "应用系统弱口令",
      "处置流程": "2025-03-12 16:01:15 开始\n\t处理人: 湖州关基操作员\n\t处置意见: 建议立即处理\n\n2025-03-13 17:08:51 简易处置\n\t处理人: 长兴网信\n\t处置意见: 整改复测完毕\n\t接收人员: 长兴网信\n\n2025-03-13 17:08:51 结束",
      "被提示区县/部门": "长兴县",
      "被提示人员": "长兴网信",
      "处置反馈时间": "2025-03-13 17:08:51",
      "处置耗时": "耗时:1天1小时7分36秒"
    }
  },
  {
    "ent": "湖州市长兴县太湖高级中学",
    "time": "2025-03-04 11:26:22",
    "level": "高危",
    "srcIp": "61.175.123.82",
    "srcPort": "23",
    "dstIp": "61.175.123.82",
    "dstPort": "23",
    "proto": "TCP",
    "policyId": "—",
    "ruleName": "470湖州市长兴县太湖高级中学所属Telnet端口存在弱口令漏洞",
    "ruleType": "操作系统弱口令",
    "atkCount": "1",
    "hitCfg": "—",
    "alarmIv": "7天",
    "action": "已归档",
    "src": "自主录入",
    "_raw": {
      "事件编号": "202503040016",
      "发生时间": "2025-03-04 11:28:03",
      "事件状态": "已归档",
      "事件状态(小)": "已归档",
      "事件标题": "470湖州市长兴县太湖高级中学所属Telnet端口存在弱口令漏洞",
      "事件来源": "自主录入",
      "分数": "",
      "创建时间": "2025-03-04 11:28:03",
      "研制厂商": "",
      "联系人": "",
      "联系方式": "",
      "通报基本情况": "470湖州市长兴县太湖高级中学所属Telnet端口存在弱口令漏洞",
      "隐患描述": "470湖州市长兴县太湖高级中学所属Telnet端口存在弱口令漏洞",
      "网站域名": "http://61.175.123.82:23",
      "影响评估": "",
      "紧急程度": "高危",
      "隐患发现时间": "2025-03-04 11:26:22",
      "国民经济行业分类": "教育",
      "区域划分": "长兴县",
      "发现厂商设备": "",
      "发现厂商名称": "长兴县委网信办",
      "涉及信息数量": "",
      "信息类型": "",
      "ip": "",
      "通报等级": "",
      "通报反馈天数": "7",
      "漏洞编号": "",
      "相关路径": "",
      "端口": "",
      "位置层级": "",
      "参考链接": "",
      "备注": "",
      "整改要求": "",
      "网站名称": "Telnet",
      "整改建议": "",
      "单位名称": "湖州市长兴县太湖高级中学",
      "隐患域名url": "http://61.175.123.82:23",
      "隐患等级": "高危",
      "出现数量": "1",
      "隐患类型": "操作系统弱口令",
      "处置流程": "2025-03-04 11:28:12 开始\n\t处理人: 湖州关基操作员\n\t处置意见: 建议立即处理\n\n2025-03-04 11:28:51 简易处置\n\t处理人: 湖州关基操作员\n\t处置意见: 已完成整改\n\t接收人员: 湖州关基操作员\n\n2025-03-04 11:28:51 结束",
      "被提示区县/部门": "湖州市",
      "被提示人员": "湖州关基操作员",
      "处置反馈时间": "2025-03-04 11:28:51",
      "处置耗时": "耗时:39秒"
    }
  },
  {
    "ent": "生态环境局长兴分局",
    "time": "2025-03-04 11:18:13",
    "level": "高危",
    "srcIp": "10.21.211.7",
    "srcPort": "—",
    "dstIp": "10.21.211.7",
    "dstPort": "—",
    "proto": "—",
    "policyId": "—",
    "ruleName": "469_037数据库弱口令-生态环境局长兴分局-长兴县网络安全事件隐患通报",
    "ruleType": "应用系统弱口令",
    "atkCount": "1",
    "hitCfg": "—",
    "alarmIv": "7天",
    "action": "已归档",
    "src": "自主录入",
    "_raw": {
      "事件编号": "202503040013",
      "发生时间": "2025-03-04 11:19:34",
      "事件状态": "已归档",
      "事件状态(小)": "已归档",
      "事件标题": "469_037数据库弱口令-生态环境局长兴分局-长兴县网络安全事件隐患通报",
      "事件来源": "自主录入",
      "分数": "",
      "创建时间": "2025-03-04 11:19:34",
      "研制厂商": "",
      "联系人": "",
      "联系方式": "",
      "通报基本情况": "469_037数据库弱口令-生态环境局长兴分局-长兴县网络安全事件隐患通报",
      "隐患描述": "469_037数据库弱口令-生态环境局长兴分局-长兴县网络安全事件隐患通报",
      "网站域名": "10.21.211.7",
      "影响评估": "",
      "紧急程度": "高危",
      "隐患发现时间": "2025-03-04 11:18:13",
      "国民经济行业分类": "其它",
      "区域划分": "长兴县",
      "发现厂商设备": "",
      "发现厂商名称": "长兴县委网信办",
      "涉及信息数量": "",
      "信息类型": "",
      "ip": "",
      "通报等级": "",
      "通报反馈天数": "7",
      "漏洞编号": "",
      "相关路径": "",
      "端口": "",
      "位置层级": "",
      "参考链接": "",
      "备注": "",
      "整改要求": "",
      "网站名称": "数据库",
      "整改建议": "",
      "单位名称": "生态环境局长兴分局",
      "隐患域名url": "10.21.211.7",
      "隐患等级": "高危",
      "出现数量": "1",
      "隐患类型": "应用系统弱口令",
      "处置流程": "2025-03-04 11:19:47 开始\n\t处理人: 湖州关基操作员\n\t处置意见: 建议立即处理\n\n2025-03-04 11:19:58 简易处置\n\t处理人: 湖州关基操作员\n\t处置意见: 已完成整改\n\t接收人员: 湖州关基操作员\n\n2025-03-04 11:19:58 结束",
      "被提示区县/部门": "湖州市",
      "被提示人员": "湖州关基操作员",
      "处置反馈时间": "2025-03-04 11:19:58",
      "处置耗时": "耗时:10秒"
    }
  },
  {
    "ent": "长兴县交通运输局",
    "time": "2025-03-04 11:14:03",
    "level": "中危",
    "srcIp": "web.zxhkuav.cn",
    "srcPort": "—",
    "dstIp": "web.zxhkuav.cn",
    "dstPort": "—",
    "proto": "—",
    "policyId": "—",
    "ruleName": "468_025未授权-交通局-长兴县网络安全事件隐患通报",
    "ruleType": "敏感信息泄露",
    "atkCount": "1",
    "hitCfg": "—",
    "alarmIv": "7天",
    "action": "已归档",
    "src": "自主录入",
    "_raw": {
      "事件编号": "202503040012",
      "发生时间": "2025-03-04 11:16:00",
      "事件状态": "已归档",
      "事件状态(小)": "已归档",
      "事件标题": "468_025未授权-交通局-长兴县网络安全事件隐患通报",
      "事件来源": "自主录入",
      "分数": "",
      "创建时间": "2025-03-04 11:16:00",
      "研制厂商": "",
      "联系人": "",
      "联系方式": "",
      "通报基本情况": "468_025未授权-交通局-长兴县网络安全事件隐患通报",
      "隐患描述": "468_025未授权-交通局-长兴县网络安全事件隐患通报",
      "网站域名": "http://web.zxhkuav.cn/console",
      "影响评估": "",
      "紧急程度": "中危",
      "隐患发现时间": "2025-03-04 11:14:03",
      "国民经济行业分类": "其它",
      "区域划分": "长兴县",
      "发现厂商设备": "",
      "发现厂商名称": "长兴县委网信办",
      "涉及信息数量": "",
      "信息类型": "",
      "ip": "",
      "通报等级": "",
      "通报反馈天数": "7",
      "漏洞编号": "",
      "相关路径": "",
      "端口": "",
      "位置层级": "",
      "参考链接": "",
      "备注": "",
      "整改要求": "",
      "网站名称": "SRS",
      "整改建议": "",
      "单位名称": "长兴县交通运输局",
      "隐患域名url": "http://web.zxhkuav.cn/console",
      "隐患等级": "中危",
      "出现数量": "1",
      "隐患类型": "敏感信息泄露",
      "处置流程": "2025-03-04 11:16:10 开始\n\t处理人: 湖州关基操作员\n\t处置意见: 建议立即处理\n\n2025-03-04 11:16:25 简易处置\n\t处理人: 湖州关基操作员\n\t处置意见: 已完成整改\n\t接收人员: 湖州关基操作员\n\n2025-03-04 11:16:25 结束",
      "被提示区县/部门": "湖州市",
      "被提示人员": "湖州关基操作员",
      "处置反馈时间": "2025-03-04 11:16:25",
      "处置耗时": "耗时:15秒"
    }
  },
  {
    "ent": "浙江惠龙医疗科技股份有限公司",
    "time": "2025-02-24 15:28:59",
    "level": "高危",
    "srcIp": "www.wellongoa.com",
    "srcPort": "22",
    "dstIp": "www.wellongoa.com",
    "dstPort": "22",
    "proto": "TCP",
    "policyId": "—",
    "ruleName": "385浙江惠龙医疗科技股份有限公司网络安全隐患通报 - SSH - 弱口令",
    "ruleType": "应用系统弱口令",
    "atkCount": "1",
    "hitCfg": "—",
    "alarmIv": "7天",
    "action": "已归档",
    "src": "自主录入",
    "_raw": {
      "事件编号": "202502240012",
      "发生时间": "2025-02-24 15:30:28",
      "事件状态": "已归档",
      "事件状态(小)": "已归档",
      "事件标题": "385浙江惠龙医疗科技股份有限公司网络安全隐患通报 - SSH - 弱口令",
      "事件来源": "自主录入",
      "分数": "",
      "创建时间": "2025-02-24 15:30:28",
      "研制厂商": "",
      "联系人": "",
      "联系方式": "",
      "通报基本情况": "385浙江惠龙医疗科技股份有限公司网络安全隐患通报 - SSH - 弱口令",
      "隐患描述": "385浙江惠龙医疗科技股份有限公司网络安全隐患通报 - SSH - 弱口令",
      "网站域名": "www.wellongoa.com:22",
      "影响评估": "",
      "紧急程度": "高危",
      "隐患发现时间": "2025-02-24 15:28:59",
      "国民经济行业分类": "其它",
      "区域划分": "长兴县",
      "发现厂商设备": "",
      "发现厂商名称": "浙江海瑞网络科技有限公司",
      "涉及信息数量": "",
      "信息类型": "",
      "ip": "",
      "通报等级": "",
      "通报反馈天数": "7",
      "漏洞编号": "",
      "相关路径": "",
      "端口": "",
      "位置层级": "",
      "参考链接": "",
      "备注": "",
      "整改要求": "",
      "网站名称": "ssh",
      "整改建议": "",
      "单位名称": "浙江惠龙医疗科技股份有限公司",
      "隐患域名url": "www.wellongoa.com:22",
      "隐患等级": "高危",
      "出现数量": "1",
      "隐患类型": "应用系统弱口令",
      "处置流程": "2025-02-24 15:37:08 开始\n\t处理人: 湖州关基操作员\n\t处置意见: 建议立即处理\n\n2025-02-28 11:29:13 简易处置\n\t处理人: 长兴网信\n\t处置意见: 整改复测完毕\n\t接收人员: 长兴网信\n\n2025-02-28 11:29:13 结束",
      "被提示区县/部门": "长兴县",
      "被提示人员": "长兴网信",
      "处置反馈时间": "2025-02-28 11:29:13",
      "处置耗时": "耗时:3天19小时52分4秒"
    }
  },
  {
    "ent": "浙江省湖州市长兴县太湖街道太湖大道1218号",
    "time": "2025-02-19 17:03:04",
    "level": "中危",
    "srcIp": "charging-pile-dev.cn-envirotech.com",
    "srcPort": "—",
    "dstIp": "charging-pile-dev.cn-envirotech.com",
    "dstPort": "—",
    "proto": "—",
    "policyId": "—",
    "ruleName": "365长兴博泰电子科技有限公司网络安全隐患通报 - 充电桩系统文档 - 未授权访问",
    "ruleType": "未受有效保护的API",
    "atkCount": "1",
    "hitCfg": "—",
    "alarmIv": "7天",
    "action": "已归档",
    "src": "自主录入",
    "_raw": {
      "事件编号": "202502190038",
      "发生时间": "2025-02-19 17:05:06",
      "事件状态": "已归档",
      "事件状态(小)": "已归档",
      "事件标题": "365长兴博泰电子科技有限公司网络安全隐患通报 - 充电桩系统文档 - 未授权访问",
      "事件来源": "自主录入",
      "分数": "",
      "创建时间": "2025-02-19 17:05:06",
      "研制厂商": "",
      "联系人": "",
      "联系方式": "",
      "通报基本情况": "365长兴博泰电子科技有限公司网络安全隐患通报 - 充电桩系统文档 - 未授权访问",
      "隐患描述": "365长兴博泰电子科技有限公司网络安全隐患通报 - 充电桩系统文档 - 未授权访问",
      "网站域名": "https://charging-pile-dev.cn-envirotech.com/swagger-ui/index.html",
      "影响评估": "",
      "紧急程度": "中危",
      "隐患发现时间": "2025-02-19 17:03:04",
      "国民经济行业分类": "科学研究和技术服务业",
      "区域划分": "长兴县",
      "发现厂商设备": "",
      "发现厂商名称": "浙江海瑞网络科技有限公司",
      "涉及信息数量": "",
      "信息类型": "",
      "ip": "",
      "通报等级": "",
      "通报反馈天数": "7",
      "漏洞编号": "",
      "相关路径": "",
      "端口": "",
      "位置层级": "",
      "参考链接": "",
      "备注": "",
      "整改要求": "",
      "网站名称": "充电桩系统文档",
      "整改建议": "",
      "单位名称": "浙江省湖州市长兴县太湖街道太湖大道1218号",
      "隐患域名url": "https://charging-pile-dev.cn-envirotech.com/swagger-ui/index.html",
      "隐患等级": "中危",
      "出现数量": "1",
      "隐患类型": "未受有效保护的API",
      "处置流程": "2025-02-20 08:37:21 开始\n\t处理人: 湖州关基操作员\n\t处置意见: 建议立即处理\n\n2025-02-25 16:10:11 简易处置\n\t处理人: 长兴网信\n\t处置意见: 复测整改完毕\n\t接收人员: 长兴网信\n\n2025-02-25 16:10:11 结束",
      "被提示区县/部门": "长兴县",
      "被提示人员": "长兴网信",
      "处置反馈时间": "2025-02-25 16:10:11",
      "处置耗时": "耗时:5天7小时32分49秒"
    }
  },
  {
    "ent": "长兴县数据局",
    "time": "2025-02-18 16:31:10",
    "level": "中危",
    "srcIp": "szty.zjcx.gov.cn",
    "srcPort": "6005",
    "dstIp": "szty.zjcx.gov.cn",
    "dstPort": "6005",
    "proto": "TCP",
    "policyId": "—",
    "ruleName": "334长兴县数据局网络安全隐患通报 - 湖州化工产业园 - 未授权访问",
    "ruleType": "其他",
    "atkCount": "1",
    "hitCfg": "—",
    "alarmIv": "7天",
    "action": "已归档",
    "src": "自主录入",
    "_raw": {
      "事件编号": "202502180008",
      "发生时间": "2025-02-18 16:32:30",
      "事件状态": "已归档",
      "事件状态(小)": "已归档",
      "事件标题": "334长兴县数据局网络安全隐患通报 - 湖州化工产业园 - 未授权访问",
      "事件来源": "自主录入",
      "分数": "",
      "创建时间": "2025-02-18 16:32:30",
      "研制厂商": "",
      "联系人": "",
      "联系方式": "",
      "通报基本情况": "334长兴县数据局网络安全隐患通报 - 湖州化工产业园 - 未授权访问",
      "隐患描述": "334长兴县数据局网络安全隐患通报 - 湖州化工产业园 - 未授权访问",
      "网站域名": "https://szty.zjcx.gov.cn:6005",
      "影响评估": "",
      "紧急程度": "中危",
      "隐患发现时间": "2025-02-18 16:31:10",
      "国民经济行业分类": "其它",
      "区域划分": "长兴县",
      "发现厂商设备": "",
      "发现厂商名称": "浙江海瑞网络科技有限公司",
      "涉及信息数量": "",
      "信息类型": "",
      "ip": "",
      "通报等级": "",
      "通报反馈天数": "7",
      "漏洞编号": "",
      "相关路径": "",
      "端口": "",
      "位置层级": "",
      "参考链接": "",
      "备注": "",
      "整改要求": "",
      "网站名称": "湖州化工产业园",
      "整改建议": "",
      "单位名称": "长兴县数据局",
      "隐患域名url": "https://szty.zjcx.gov.cn:6005",
      "隐患等级": "中危",
      "出现数量": "1",
      "隐患类型": "其他",
      "处置流程": "2025-02-18 16:38:32 开始\n\t处理人: 湖州关基操作员\n\t处置意见: 建议立即处理\n\n2025-02-25 16:09:21 简易处置\n\t处理人: 长兴网信\n\t处置意见: 复测整改完毕\n\t接收人员: 长兴网信\n\n2025-02-25 16:09:21 结束",
      "被提示区县/部门": "长兴县",
      "被提示人员": "长兴网信",
      "处置反馈时间": "2025-02-25 16:09:21",
      "处置耗时": "耗时:6天23小时30分49秒"
    }
  },
  {
    "ent": "长兴昇阳科技有限公司",
    "time": "2025-02-14 14:58:50",
    "level": "高危",
    "srcIp": "hnpm.sumyoungtech.com",
    "srcPort": "18083",
    "dstIp": "hnpm.sumyoungtech.com",
    "dstPort": "18083",
    "proto": "TCP",
    "policyId": "—",
    "ruleName": "305长兴昇阳科技有限公司网络安全隐患通报 - EMQX - 弱口令",
    "ruleType": "应用系统弱口令",
    "atkCount": "1",
    "hitCfg": "—",
    "alarmIv": "7天",
    "action": "已归档",
    "src": "自主录入",
    "_raw": {
      "事件编号": "202502140004",
      "发生时间": "2025-02-14 15:10:03",
      "事件状态": "已归档",
      "事件状态(小)": "已归档",
      "事件标题": "305长兴昇阳科技有限公司网络安全隐患通报 - EMQX - 弱口令",
      "事件来源": "自主录入",
      "分数": "",
      "创建时间": "2025-02-14 15:10:03",
      "研制厂商": "",
      "联系人": "",
      "联系方式": "",
      "通报基本情况": "305长兴昇阳科技有限公司网络安全隐患通报 - EMQX - 弱口令",
      "隐患描述": "305长兴昇阳科技有限公司网络安全隐患通报 - EMQX - 弱口令",
      "网站域名": "http://hnpm.sumyoungtech.com:18083/#/",
      "影响评估": "",
      "紧急程度": "高危",
      "隐患发现时间": "2025-02-14 14:58:50",
      "国民经济行业分类": "制造业",
      "区域划分": "长兴县",
      "发现厂商设备": "",
      "发现厂商名称": "浙江海瑞网络科技有限公司",
      "涉及信息数量": "",
      "信息类型": "",
      "ip": "",
      "通报等级": "",
      "通报反馈天数": "7",
      "漏洞编号": "",
      "相关路径": "",
      "端口": "",
      "位置层级": "",
      "参考链接": "",
      "备注": "",
      "整改要求": "",
      "网站名称": "EMQX",
      "整改建议": "",
      "单位名称": "长兴昇阳科技有限公司",
      "隐患域名url": "http://hnpm.sumyoungtech.com:18083/#/",
      "隐患等级": "高危",
      "出现数量": "1",
      "隐患类型": "应用系统弱口令",
      "处置流程": "2025-02-14 16:03:43 开始\n\t处理人: 湖州关基操作员\n\t处置意见: 建议立即处理\n\n2025-02-19 16:48:44 简易处置\n\t处理人: 长兴网信\n\t处置意见: 整改复测完成\n\t接收人员: 长兴网信\n\n2025-02-19 16:48:44 结束",
      "被提示区县/部门": "长兴县",
      "被提示人员": "长兴网信",
      "处置反馈时间": "2025-02-19 16:48:44",
      "处置耗时": "耗时:5天45分0秒"
    }
  },
  {
    "ent": "家哇云（湖州）供应链管理有限公司",
    "time": "2025-02-14 14:35:34",
    "level": "中危",
    "srcIp": "algo-01.jiawayun.cn",
    "srcPort": "8084",
    "dstIp": "algo-01.jiawayun.cn",
    "dstPort": "8084",
    "proto": "TCP",
    "policyId": "—",
    "ruleName": "303家哇云（湖州）供应链管理有限公司网络安全隐患通报 - druid - 未授权访问",
    "ruleType": "敏感信息泄露",
    "atkCount": "1",
    "hitCfg": "—",
    "alarmIv": "7天",
    "action": "已归档",
    "src": "自主录入",
    "_raw": {
      "事件编号": "202502140002",
      "发生时间": "2025-02-14 14:55:40",
      "事件状态": "已归档",
      "事件状态(小)": "已归档",
      "事件标题": "303家哇云（湖州）供应链管理有限公司网络安全隐患通报 - druid - 未授权访问",
      "事件来源": "自主录入",
      "分数": "",
      "创建时间": "2025-02-14 14:55:40",
      "研制厂商": "",
      "联系人": "",
      "联系方式": "",
      "通报基本情况": "303家哇云（湖州）供应链管理有限公司网络安全隐患通报 - druid - 未授权访问",
      "隐患描述": "303家哇云（湖州）供应链管理有限公司网络安全隐患通报 - druid - 未授权访问",
      "网站域名": "http://algo-01.jiawayun.cn:8084/druid/index.html",
      "影响评估": "",
      "紧急程度": "中危",
      "隐患发现时间": "2025-02-14 14:35:34",
      "国民经济行业分类": "租赁和商务服务业",
      "区域划分": "长兴县",
      "发现厂商设备": "",
      "发现厂商名称": "浙江海瑞网络科技有限公司",
      "涉及信息数量": "",
      "信息类型": "",
      "ip": "",
      "通报等级": "",
      "通报反馈天数": "7",
      "漏洞编号": "",
      "相关路径": "",
      "端口": "",
      "位置层级": "",
      "参考链接": "",
      "备注": "",
      "整改要求": "",
      "网站名称": "druid",
      "整改建议": "",
      "单位名称": "家哇云（湖州）供应链管理有限公司",
      "隐患域名url": "http://algo-01.jiawayun.cn:8084/druid/index.html",
      "隐患等级": "中危",
      "出现数量": "1",
      "隐患类型": "敏感信息泄露",
      "处置流程": "2025-02-14 16:04:08 开始\n\t处理人: 湖州关基操作员\n\t处置意见: 建议立即处理\n\n2025-02-19 14:58:28 简易处置\n\t处理人: 长兴网信\n\t处置意见: 整改复测完毕\n\t接收人员: 长兴网信\n\n2025-02-19 14:58:28 结束",
      "被提示区县/部门": "长兴县",
      "被提示人员": "长兴网信",
      "处置反馈时间": "2025-02-19 14:58:28",
      "处置耗时": "耗时:4天22小时54分19秒"
    }
  },
  {
    "ent": "湖州快驴科技有限公司",
    "time": "2025-02-14 14:27:56",
    "level": "中危",
    "srcIp": "shouhou.kljcw.cn",
    "srcPort": "8087",
    "dstIp": "shouhou.kljcw.cn",
    "dstPort": "8087",
    "proto": "TCP",
    "policyId": "—",
    "ruleName": "302湖州快驴科技有限公司网络安全隐患通报 - Swagger - 未授权访问",
    "ruleType": "未受有效保护的API",
    "atkCount": "1",
    "hitCfg": "—",
    "alarmIv": "7天",
    "action": "已归档",
    "src": "自主录入",
    "_raw": {
      "事件编号": "202502140001",
      "发生时间": "2025-02-14 14:35:17",
      "事件状态": "已归档",
      "事件状态(小)": "已归档",
      "事件标题": "302湖州快驴科技有限公司网络安全隐患通报 - Swagger - 未授权访问",
      "事件来源": "自主录入",
      "分数": "",
      "创建时间": "2025-02-14 14:35:17",
      "研制厂商": "",
      "联系人": "",
      "联系方式": "",
      "通报基本情况": "302湖州快驴科技有限公司网络安全隐患通报 - Swagger - 未授权访问",
      "隐患描述": "302湖州快驴科技有限公司网络安全隐患通报 - Swagger - 未授权访问",
      "网站域名": "http://shouhou.kljcw.cn:8087",
      "影响评估": "",
      "紧急程度": "中危",
      "隐患发现时间": "2025-02-14 14:27:56",
      "国民经济行业分类": "信息传输、软件和信息技术服务业",
      "区域划分": "长兴县",
      "发现厂商设备": "",
      "发现厂商名称": "浙江海瑞网络科技有限公司",
      "涉及信息数量": "",
      "信息类型": "",
      "ip": "",
      "通报等级": "",
      "通报反馈天数": "7",
      "漏洞编号": "",
      "相关路径": "",
      "端口": "",
      "位置层级": "",
      "参考链接": "",
      "备注": "",
      "整改要求": "",
      "网站名称": "Swagger",
      "整改建议": "",
      "单位名称": "湖州快驴科技有限公司",
      "隐患域名url": "http://shouhou.kljcw.cn:8087",
      "隐患等级": "中危",
      "出现数量": "1",
      "隐患类型": "未受有效保护的API",
      "处置流程": "2025-02-14 16:05:03 开始\n\t处理人: 湖州关基操作员\n\t处置意见: 建议立即处理\n\n2025-02-19 14:58:01 简易处置\n\t处理人: 长兴网信\n\t处置意见: 整改复测完毕\n\t接收人员: 长兴网信\n\n2025-02-19 14:58:01 结束",
      "被提示区县/部门": "长兴县",
      "被提示人员": "长兴网信",
      "处置反馈时间": "2025-02-19 14:58:01",
      "处置耗时": "耗时:4天22小时52分57秒"
    }
  },
  {
    "ent": "湖州雄讯网络科技有限公司",
    "time": "2025-02-05 15:07:32",
    "level": "中危",
    "srcIp": "qiye.xiongxun.vip",
    "srcPort": "7001",
    "dstIp": "qiye.xiongxun.vip",
    "dstPort": "7001",
    "proto": "TCP",
    "policyId": "—",
    "ruleName": "224湖州雄讯网络科技有限公司网络安全隐患通报 - Swagger - 未授权访问",
    "ruleType": "未受有效保护的API",
    "atkCount": "1",
    "hitCfg": "—",
    "alarmIv": "7天",
    "action": "已归档",
    "src": "自主录入",
    "_raw": {
      "事件编号": "202502050002",
      "发生时间": "2025-02-05 15:09:46",
      "事件状态": "已归档",
      "事件状态(小)": "已归档",
      "事件标题": "224湖州雄讯网络科技有限公司网络安全隐患通报 - Swagger - 未授权访问",
      "事件来源": "自主录入",
      "分数": "",
      "创建时间": "2025-02-05 15:09:46",
      "研制厂商": "",
      "联系人": "",
      "联系方式": "",
      "通报基本情况": "224湖州雄讯网络科技有限公司网络安全隐患通报 - Swagger - 未授权访问",
      "隐患描述": "224湖州雄讯网络科技有限公司网络安全隐患通报 - Swagger - 未授权访问",
      "网站域名": "http://qiye.xiongxun.vip:7001",
      "影响评估": "",
      "紧急程度": "中危",
      "隐患发现时间": "2025-02-05 15:07:32",
      "国民经济行业分类": "信息传输、软件和信息技术服务业",
      "区域划分": "长兴县",
      "发现厂商设备": "",
      "发现厂商名称": "浙江海瑞网络科技有限公司",
      "涉及信息数量": "",
      "信息类型": "",
      "ip": "",
      "通报等级": "",
      "通报反馈天数": "7",
      "漏洞编号": "",
      "相关路径": "",
      "端口": "",
      "位置层级": "",
      "参考链接": "",
      "备注": "",
      "整改要求": "",
      "网站名称": "swagger",
      "整改建议": "",
      "单位名称": "湖州雄讯网络科技有限公司",
      "隐患域名url": "http://qiye.xiongxun.vip:7001",
      "隐患等级": "中危",
      "出现数量": "1",
      "隐患类型": "未受有效保护的API",
      "处置流程": "2025-02-05 15:25:21 开始\n\t处理人: 湖州关基操作员\n\t处置意见: 建议立即处理\n\n2025-02-07 17:08:10 简易处置\n\t处理人: 长兴网信\n\t处置意见: 整改复测完毕\n\t接收人员: 长兴网信\n\n2025-02-07 17:08:10 结束",
      "被提示区县/部门": "长兴县",
      "被提示人员": "长兴网信",
      "处置反馈时间": "2025-02-07 17:08:10",
      "处置耗时": "耗时:2天1小时42分49秒"
    }
  },
  {
    "ent": "丘沃智能科技（湖州）有限公司",
    "time": "2025-01-24 16:09:06",
    "level": "高危",
    "srcIp": "platform.agrox.cloud",
    "srcPort": "—",
    "dstIp": "platform.agrox.cloud",
    "dstPort": "—",
    "proto": "—",
    "policyId": "—",
    "ruleName": "220丘沃智能科技（湖州）有限公司网络安全隐患通报 - Redis - 弱口令",
    "ruleType": "应用系统弱口令",
    "atkCount": "1",
    "hitCfg": "—",
    "alarmIv": "7天",
    "action": "已归档",
    "src": "自主录入",
    "_raw": {
      "事件编号": "202501240001",
      "发生时间": "2025-01-24 16:11:39",
      "事件状态": "已归档",
      "事件状态(小)": "已归档",
      "事件标题": "220丘沃智能科技（湖州）有限公司网络安全隐患通报 - Redis - 弱口令",
      "事件来源": "自主录入",
      "分数": "",
      "创建时间": "2025-01-24 16:11:39",
      "研制厂商": "",
      "联系人": "",
      "联系方式": "",
      "通报基本情况": "220丘沃智能科技（湖州）有限公司网络安全隐患通报 - Redis - 弱口令",
      "隐患描述": "220丘沃智能科技（湖州）有限公司网络安全隐患通报 - Redis - 弱口令",
      "网站域名": "platform.agrox.cloud",
      "影响评估": "",
      "紧急程度": "高危",
      "隐患发现时间": "2025-01-24 16:09:06",
      "国民经济行业分类": "科学研究和技术服务业",
      "区域划分": "长兴县",
      "发现厂商设备": "",
      "发现厂商名称": "浙江海瑞网络科技有限公司",
      "涉及信息数量": "",
      "信息类型": "",
      "ip": "",
      "通报等级": "",
      "通报反馈天数": "7",
      "漏洞编号": "",
      "相关路径": "",
      "端口": "",
      "位置层级": "",
      "参考链接": "",
      "备注": "",
      "整改要求": "",
      "网站名称": "Redis",
      "整改建议": "",
      "单位名称": "丘沃智能科技（湖州）有限公司",
      "隐患域名url": "platform.agrox.cloud",
      "隐患等级": "高危",
      "出现数量": "1",
      "隐患类型": "应用系统弱口令",
      "处置流程": "2025-01-24 16:15:07 开始\n\t处理人: 湖州关基操作员\n\t处置意见: 建议立即处理\n\n2025-02-19 16:49:39 简易处置\n\t处理人: 长兴网信\n\t处置意见: 整改复测完成\n\t接收人员: 长兴网信\n\n2025-02-19 16:49:39 结束",
      "被提示区县/部门": "长兴县",
      "被提示人员": "长兴网信",
      "处置反馈时间": "2025-02-19 16:49:39",
      "处置耗时": "耗时:26天34分31秒"
    }
  },
  {
    "ent": "科佳（长兴）模架制造有限公司",
    "time": "2025-01-10 17:49:54",
    "level": "中危",
    "srcIp": "kejia.hopto.org",
    "srcPort": "20600",
    "dstIp": "kejia.hopto.org",
    "dstPort": "20600",
    "proto": "TCP",
    "policyId": "—",
    "ruleName": "129科佳（长兴）模架制造有限公司网络安全隐患通报 - OA系统  - url重定向漏洞 文件存储服务器未授权访问",
    "ruleType": "敏感信息泄露",
    "atkCount": "1",
    "hitCfg": "—",
    "alarmIv": "7天",
    "action": "已归档",
    "src": "自主录入",
    "_raw": {
      "事件编号": "202501100031",
      "发生时间": "2025-01-10 17:51:14",
      "事件状态": "已归档",
      "事件状态(小)": "已归档",
      "事件标题": "129科佳（长兴）模架制造有限公司网络安全隐患通报 - OA系统  - url重定向漏洞 文件存储服务器未授权访问",
      "事件来源": "自主录入",
      "分数": "",
      "创建时间": "2025-01-10 17:51:14",
      "研制厂商": "",
      "联系人": "",
      "联系方式": "",
      "通报基本情况": "129科佳（长兴）模架制造有限公司网络安全隐患通报 - OA系统  - url重定向漏洞 文件存储服务器未授权访问",
      "隐患描述": "129科佳（长兴）模架制造有限公司网络安全隐患通报 - OA系统  - url重定向漏洞 文件存储服务器未授权访问",
      "网站域名": "http://kejia.hopto.org:20600/",
      "影响评估": "",
      "紧急程度": "中危",
      "隐患发现时间": "2025-01-10 17:49:54",
      "国民经济行业分类": "制造业",
      "区域划分": "长兴县",
      "发现厂商设备": "",
      "发现厂商名称": "浙江海瑞网络科技有限公司",
      "涉及信息数量": "",
      "信息类型": "",
      "ip": "",
      "通报等级": "",
      "通报反馈天数": "7",
      "漏洞编号": "",
      "相关路径": "",
      "端口": "",
      "位置层级": "",
      "参考链接": "",
      "备注": "",
      "整改要求": "",
      "网站名称": "OA系统",
      "整改建议": "",
      "单位名称": "科佳（长兴）模架制造有限公司",
      "隐患域名url": "http://kejia.hopto.org:20600/",
      "隐患等级": "中危",
      "出现数量": "1",
      "隐患类型": "敏感信息泄露",
      "处置流程": "2025-01-10 17:51:25 开始\n\t处理人: 湖州关基操作员\n\t处置意见: 建议立即处理\n\n2025-01-15 10:56:01 简易处置\n\t处理人: 长兴网信\n\t处置意见: 整改复测完成\n\t接收人员: 长兴网信\n\n2025-01-15 10:56:01 结束",
      "被提示区县/部门": "长兴县",
      "被提示人员": "长兴网信",
      "处置反馈时间": "2025-01-15 10:56:01",
      "处置耗时": "耗时:4天17小时4分35秒"
    }
  },
  {
    "ent": "长兴城市建设投资集团有限公司",
    "time": "2025-01-10 17:22:31",
    "level": "中危",
    "srcIp": "183.248.48.89",
    "srcPort": "20600",
    "dstIp": "183.248.48.89",
    "dstPort": "20600",
    "proto": "TCP",
    "policyId": "—",
    "ruleName": "116长兴城市建设投资集团有限公司网络安全隐患通报 - 长兴城市建设投资集团有限公司OA办公系统  - url重定向",
    "ruleType": "其他",
    "atkCount": "1",
    "hitCfg": "—",
    "alarmIv": "7天",
    "action": "已归档",
    "src": "自主录入",
    "_raw": {
      "事件编号": "202501100017",
      "发生时间": "2025-01-10 17:23:26",
      "事件状态": "已归档",
      "事件状态(小)": "已归档",
      "事件标题": "116长兴城市建设投资集团有限公司网络安全隐患通报 - 长兴城市建设投资集团有限公司OA办公系统  - url重定向",
      "事件来源": "自主录入",
      "分数": "",
      "创建时间": "2025-01-10 17:23:26",
      "研制厂商": "",
      "联系人": "",
      "联系方式": "",
      "通报基本情况": "116长兴城市建设投资集团有限公司网络安全隐患通报 - 长兴城市建设投资集团有限公司OA办公系统  - url重定向",
      "隐患描述": "116长兴城市建设投资集团有限公司网络安全隐患通报 - 长兴城市建设投资集团有限公司OA办公系统  - url重定向",
      "网站域名": "183.248.48.89:20600",
      "影响评估": "",
      "紧急程度": "中危",
      "隐患发现时间": "2025-01-10 17:22:31",
      "国民经济行业分类": "其它",
      "区域划分": "长兴县",
      "发现厂商设备": "",
      "发现厂商名称": "浙江海瑞网络科技有限公司",
      "涉及信息数量": "",
      "信息类型": "",
      "ip": "",
      "通报等级": "",
      "通报反馈天数": "7",
      "漏洞编号": "",
      "相关路径": "",
      "端口": "",
      "位置层级": "",
      "参考链接": "",
      "备注": "",
      "整改要求": "",
      "网站名称": "长兴城市建设投资集团有限公司OA办公系统",
      "整改建议": "",
      "单位名称": "长兴城市建设投资集团有限公司",
      "隐患域名url": "183.248.48.89:20600",
      "隐患等级": "中危",
      "出现数量": "1",
      "隐患类型": "其他",
      "处置流程": "2025-01-10 17:23:36 开始\n\t处理人: 湖州关基操作员\n\t处置意见: 建议立即处理\n\n2025-01-17 16:23:55 简易处置\n\t处理人: 长兴网信\n\t处置意见: 整改复测完毕\n\t接收人员: 长兴网信\n\n2025-01-17 16:23:55 结束",
      "被提示区县/部门": "长兴县",
      "被提示人员": "长兴网信",
      "处置反馈时间": "2025-01-17 16:23:55",
      "处置耗时": "耗时:6天23小时18秒"
    }
  },
  {
    "ent": "长兴数智新能源有限公司",
    "time": "2025-01-09 15:52:22",
    "level": "中危",
    "srcIp": "repo.zjrygd.com",
    "srcPort": "—",
    "dstIp": "repo.zjrygd.com",
    "dstPort": "—",
    "proto": "—",
    "policyId": "—",
    "ruleName": "97长兴数智新能源有限公司网络安全隐患通报 - 数智新能源管理系统 - 未授权访问",
    "ruleType": "未受有效保护的API",
    "atkCount": "1",
    "hitCfg": "—",
    "alarmIv": "7天",
    "action": "已归档",
    "src": "自主录入",
    "_raw": {
      "事件编号": "202501090002",
      "发生时间": "2025-01-09 15:55:04",
      "事件状态": "已归档",
      "事件状态(小)": "已归档",
      "事件标题": "97长兴数智新能源有限公司网络安全隐患通报 - 数智新能源管理系统 - 未授权访问",
      "事件来源": "自主录入",
      "分数": "",
      "创建时间": "2025-01-09 15:55:04",
      "研制厂商": "",
      "联系人": "",
      "联系方式": "",
      "通报基本情况": "97长兴数智新能源有限公司网络安全隐患通报 - 数智新能源管理系统 - 未授权访问",
      "隐患描述": "97长兴数智新能源有限公司网络安全隐患通报 - 数智新能源管理系统 - 未授权访问",
      "网站域名": "https://repo.zjrygd.com/prod-api/v3/api-docs",
      "影响评估": "",
      "紧急程度": "中危",
      "隐患发现时间": "2025-01-09 15:52:22",
      "国民经济行业分类": "制造业",
      "区域划分": "长兴县",
      "发现厂商设备": "",
      "发现厂商名称": "浙江海瑞网络科技有限公司",
      "涉及信息数量": "",
      "信息类型": "",
      "ip": "",
      "通报等级": "",
      "通报反馈天数": "7",
      "漏洞编号": "",
      "相关路径": "",
      "端口": "",
      "位置层级": "",
      "参考链接": "",
      "备注": "",
      "整改要求": "",
      "网站名称": "数智新能源管理系统",
      "整改建议": "",
      "单位名称": "长兴数智新能源有限公司",
      "隐患域名url": "https://repo.zjrygd.com/prod-api/v3/api-docs",
      "隐患等级": "中危",
      "出现数量": "1",
      "隐患类型": "未受有效保护的API",
      "处置流程": "2025-01-09 15:56:57 开始\n\t处理人: 湖州关基操作员\n\t处置意见: 建议立即处理\n\n2025-01-15 10:56:23 简易处置\n\t处理人: 长兴网信\n\t处置意见: 整改复测完成\n\t接收人员: 长兴网信\n\n2025-01-15 10:56:23 结束",
      "被提示区县/部门": "长兴县",
      "被提示人员": "长兴网信",
      "处置反馈时间": "2025-01-15 10:56:23",
      "处置耗时": "耗时:5天18小时59分25秒"
    }
  },
  {
    "ent": "湖州快驴科技有限公司",
    "time": "2025-01-06 13:28:32",
    "level": "高危",
    "srcIp": "year.kljcw.cn",
    "srcPort": "—",
    "dstIp": "year.kljcw.cn",
    "dstPort": "—",
    "proto": "—",
    "policyId": "—",
    "ruleName": "75湖州快驴科技有限公司网络安全隐患通报 - 快驴科技产品售后系统 - 弱口令",
    "ruleType": "应用系统弱口令",
    "atkCount": "1",
    "hitCfg": "—",
    "alarmIv": "7天",
    "action": "已归档",
    "src": "自主录入",
    "_raw": {
      "事件编号": "202501060002",
      "发生时间": "2025-01-06 13:29:35",
      "事件状态": "已归档",
      "事件状态(小)": "已归档",
      "事件标题": "75湖州快驴科技有限公司网络安全隐患通报 - 快驴科技产品售后系统 - 弱口令",
      "事件来源": "自主录入",
      "分数": "",
      "创建时间": "2025-01-06 13:29:35",
      "研制厂商": "",
      "联系人": "",
      "联系方式": "",
      "通报基本情况": "75湖州快驴科技有限公司网络安全隐患通报 - 快驴科技产品售后系统 - 弱口令",
      "隐患描述": "75湖州快驴科技有限公司网络安全隐患通报 - 快驴科技产品售后系统 - 弱口令",
      "网站域名": "http://year.kljcw.cn/#/login",
      "影响评估": "",
      "紧急程度": "高危",
      "隐患发现时间": "2025-01-06 13:28:32",
      "国民经济行业分类": "信息传输、软件和信息技术服务业",
      "区域划分": "长兴县",
      "发现厂商设备": "",
      "发现厂商名称": "浙江海瑞网络科技有限公司",
      "涉及信息数量": "",
      "信息类型": "",
      "ip": "",
      "通报等级": "",
      "通报反馈天数": "7",
      "漏洞编号": "",
      "相关路径": "",
      "端口": "",
      "位置层级": "",
      "参考链接": "",
      "备注": "",
      "整改要求": "",
      "网站名称": "快驴科技产品售后系统",
      "整改建议": "",
      "单位名称": "湖州快驴科技有限公司",
      "隐患域名url": "http://year.kljcw.cn/#/login",
      "隐患等级": "高危",
      "出现数量": "1",
      "隐患类型": "应用系统弱口令",
      "处置流程": "2025-01-06 14:17:21 开始\n\t处理人: 湖州关基操作员\n\t处置意见: 建议立即处理\n\n2025-01-14 08:57:00 简易处置\n\t处理人: 长兴网信\n\t处置意见: 整改复测完毕\n\t接收人员: 长兴网信\n\n2025-01-14 08:57:00 结束",
      "被提示区县/部门": "长兴县",
      "被提示人员": "长兴网信",
      "处置反馈时间": "2025-01-14 08:57:00",
      "处置耗时": "耗时:7天18小时39分38秒"
    }
  },
  {
    "ent": "浙江优全护理用品科技股份有限公司",
    "time": "2025-01-02 18:23:56",
    "level": "高危",
    "srcIp": "a.kingsafe.cn",
    "srcPort": "1400",
    "dstIp": "a.kingsafe.cn",
    "dstPort": "1400",
    "proto": "TCP",
    "policyId": "—",
    "ruleName": "70浙江优全护理用品科技股份有限公司网络安全隐患通报 - 帆软 - 反序列化",
    "ruleType": "反序列化漏洞",
    "atkCount": "1",
    "hitCfg": "—",
    "alarmIv": "7天",
    "action": "已归档",
    "src": "自主录入",
    "_raw": {
      "事件编号": "202501020078",
      "发生时间": "2025-01-02 18:30:25",
      "事件状态": "已归档",
      "事件状态(小)": "已归档",
      "事件标题": "70浙江优全护理用品科技股份有限公司网络安全隐患通报 - 帆软 - 反序列化",
      "事件来源": "自主录入",
      "分数": "",
      "创建时间": "2025-01-02 18:30:25",
      "研制厂商": "",
      "联系人": "",
      "联系方式": "",
      "通报基本情况": "70浙江优全护理用品科技股份有限公司网络安全隐患通报 - 帆软 - 反序列化",
      "隐患描述": "70浙江优全护理用品科技股份有限公司网络安全隐患通报 - 帆软 - 反序列化",
      "网站域名": "http://a.kingsafe.cn:1400",
      "影响评估": "",
      "紧急程度": "高危",
      "隐患发现时间": "2025-01-02 18:23:56",
      "国民经济行业分类": "制造业",
      "区域划分": "长兴县",
      "发现厂商设备": "",
      "发现厂商名称": "浙江海瑞网络科技有限公司",
      "涉及信息数量": "",
      "信息类型": "",
      "ip": "",
      "通报等级": "",
      "通报反馈天数": "7",
      "漏洞编号": "",
      "相关路径": "",
      "端口": "",
      "位置层级": "",
      "参考链接": "",
      "备注": "",
      "整改要求": "",
      "网站名称": "帆软",
      "整改建议": "",
      "单位名称": "浙江优全护理用品科技股份有限公司",
      "隐患域名url": "http://a.kingsafe.cn:1400",
      "隐患等级": "高危",
      "出现数量": "1",
      "隐患类型": "反序列化漏洞",
      "处置流程": "2025-01-03 08:57:32 开始\n\t处理人: 湖州关基操作员\n\t处置意见: 建议立即处理\n\n2025-01-16 17:07:31 简易处置\n\t处理人: 湖州关基操作员\n\t处置意见: 已完成整改\n\t接收人员: 长兴网信 湖州关基操作员\n\n2025-01-16 17:07:31 结束",
      "被提示区县/部门": "长兴县, 湖州市",
      "被提示人员": "长兴网信, 湖州关基操作员",
      "处置反馈时间": "2025-01-16 17:07:31",
      "处置耗时": "耗时:13天8小时9分59秒"
    }
  },
  {
    "ent": "长兴太湖能谷科技有限公司",
    "time": "2025-01-02 18:19:57",
    "level": "中危",
    "srcIp": "www.taihuelectric.com",
    "srcPort": "—",
    "dstIp": "www.taihuelectric.com",
    "dstPort": "—",
    "proto": "—",
    "policyId": "—",
    "ruleName": "69长兴太湖能谷科技有限公司网络安全隐患通报 - 官网 - 敏感信息泄露",
    "ruleType": "敏感信息泄露",
    "atkCount": "1",
    "hitCfg": "—",
    "alarmIv": "7天",
    "action": "已归档",
    "src": "自主录入",
    "_raw": {
      "事件编号": "202501020077",
      "发生时间": "2025-01-02 18:22:36",
      "事件状态": "已归档",
      "事件状态(小)": "已归档",
      "事件标题": "69长兴太湖能谷科技有限公司网络安全隐患通报 - 官网 - 敏感信息泄露",
      "事件来源": "自主录入",
      "分数": "",
      "创建时间": "2025-01-02 18:22:36",
      "研制厂商": "",
      "联系人": "",
      "联系方式": "",
      "通报基本情况": "69长兴太湖能谷科技有限公司网络安全隐患通报 - 官网 - 敏感信息泄露",
      "隐患描述": "69长兴太湖能谷科技有限公司网络安全隐患通报 - 官网 - 敏感信息泄露",
      "网站域名": "https://www.taihuelectric.com",
      "影响评估": "",
      "紧急程度": "高危",
      "隐患发现时间": "2025-01-02 18:19:57",
      "国民经济行业分类": "科学研究和技术服务业",
      "区域划分": "长兴县",
      "发现厂商设备": "",
      "发现厂商名称": "浙江海瑞网络科技有限公司",
      "涉及信息数量": "",
      "信息类型": "",
      "ip": "",
      "通报等级": "",
      "通报反馈天数": "7",
      "漏洞编号": "",
      "相关路径": "",
      "端口": "",
      "位置层级": "",
      "参考链接": "",
      "备注": "",
      "整改要求": "",
      "网站名称": "官网",
      "整改建议": "",
      "单位名称": "长兴太湖能谷科技有限公司",
      "隐患域名url": "https://www.taihuelectric.com",
      "隐患等级": "中危",
      "出现数量": "1",
      "隐患类型": "敏感信息泄露",
      "处置流程": "2025-01-03 08:57:50 开始\n\t处理人: 湖州关基操作员\n\t处置意见: 建议立即处理\n\n2025-01-14 09:14:22 简易处置\n\t处理人: 长兴网信\n\t处置意见: 整改复测完毕\n\t接收人员: 长兴网信 湖州关基操作员\n\n2025-01-14 09:14:22 结束",
      "被提示区县/部门": "长兴县, 湖州市",
      "被提示人员": "长兴网信, 湖州关基操作员",
      "处置反馈时间": "2025-01-14 09:14:22",
      "处置耗时": "耗时:11天16分32秒"
    }
  },
  {
    "ent": "天能电池集团股份有限公司",
    "time": "2025-01-02 18:16:03",
    "level": "高危",
    "srcIp": "tabcx.tntab.cn",
    "srcPort": "8848",
    "dstIp": "tabcx.tntab.cn",
    "dstPort": "8848",
    "proto": "TCP",
    "policyId": "—",
    "ruleName": "68天能电池集团股份有限公司网络安全隐患通报 - Nacos - 弱口令",
    "ruleType": "应用系统弱口令",
    "atkCount": "1",
    "hitCfg": "—",
    "alarmIv": "7天",
    "action": "已归档",
    "src": "自主录入",
    "_raw": {
      "事件编号": "202501020076",
      "发生时间": "2025-01-02 18:17:26",
      "事件状态": "已归档",
      "事件状态(小)": "已归档",
      "事件标题": "68天能电池集团股份有限公司网络安全隐患通报 - Nacos - 弱口令",
      "事件来源": "自主录入",
      "分数": "",
      "创建时间": "2025-01-02 18:17:26",
      "研制厂商": "",
      "联系人": "",
      "联系方式": "",
      "通报基本情况": "68天能电池集团股份有限公司网络安全隐患通报 - Nacos - 弱口令",
      "隐患描述": "68天能电池集团股份有限公司网络安全隐患通报 - Nacos - 弱口令",
      "网站域名": "http://tabcx.tntab.cn:8848",
      "影响评估": "",
      "紧急程度": "高危",
      "隐患发现时间": "2025-01-02 18:16:03",
      "国民经济行业分类": "制造业",
      "区域划分": "长兴县",
      "发现厂商设备": "",
      "发现厂商名称": "浙江海瑞网络科技有限公司",
      "涉及信息数量": "",
      "信息类型": "",
      "ip": "",
      "通报等级": "",
      "通报反馈天数": "7",
      "漏洞编号": "",
      "相关路径": "",
      "端口": "",
      "位置层级": "",
      "参考链接": "",
      "备注": "",
      "整改要求": "",
      "网站名称": "nacos",
      "整改建议": "",
      "单位名称": "天能电池集团股份有限公司",
      "隐患域名url": "http://tabcx.tntab.cn:8848",
      "隐患等级": "高危",
      "出现数量": "1",
      "隐患类型": "应用系统弱口令",
      "处置流程": "2025-01-03 08:58:03 开始\n\t处理人: 湖州关基操作员\n\t处置意见: 建议立即处理\n\n2025-01-06 16:21:50 简易处置\n\t处理人: 长兴网信\n\t处置意见: 整改复测完毕\n\t接收人员: 长兴网信 湖州关基操作员\n\n2025-01-06 16:21:50 结束",
      "被提示区县/部门": "长兴县, 湖州市",
      "被提示人员": "长兴网信, 湖州关基操作员",
      "处置反馈时间": "2025-01-06 16:21:50",
      "处置耗时": "耗时:3天7小时23分46秒"
    }
  },
  {
    "ent": "天能电池集团股份有限公司",
    "time": "2025-01-02 18:14:10",
    "level": "高危",
    "srcIp": "qiche.etianneng.cn",
    "srcPort": "—",
    "dstIp": "qiche.etianneng.cn",
    "dstPort": "—",
    "proto": "—",
    "policyId": "—",
    "ruleName": "67天能电池集团股份有限公司网络安全隐患通报 - 天能车用管理系统 - 弱口令",
    "ruleType": "应用系统弱口令",
    "atkCount": "1",
    "hitCfg": "—",
    "alarmIv": "7天",
    "action": "已归档",
    "src": "自主录入",
    "_raw": {
      "事件编号": "202501020075",
      "发生时间": "2025-01-02 18:15:45",
      "事件状态": "已归档",
      "事件状态(小)": "已归档",
      "事件标题": "67天能电池集团股份有限公司网络安全隐患通报 - 天能车用管理系统 - 弱口令",
      "事件来源": "自主录入",
      "分数": "",
      "创建时间": "2025-01-02 18:15:45",
      "研制厂商": "",
      "联系人": "",
      "联系方式": "",
      "通报基本情况": "67天能电池集团股份有限公司网络安全隐患通报 - 天能车用管理系统 - 弱口令",
      "隐患描述": "67天能电池集团股份有限公司网络安全隐患通报 - 天能车用管理系统 - 弱口令",
      "网站域名": "https://qiche.etianneng.cn",
      "影响评估": "",
      "紧急程度": "高危",
      "隐患发现时间": "2025-01-02 18:14:10",
      "国民经济行业分类": "制造业",
      "区域划分": "长兴县",
      "发现厂商设备": "",
      "发现厂商名称": "浙江海瑞网络科技有限公司",
      "涉及信息数量": "",
      "信息类型": "",
      "ip": "",
      "通报等级": "",
      "通报反馈天数": "7",
      "漏洞编号": "",
      "相关路径": "",
      "端口": "",
      "位置层级": "",
      "参考链接": "",
      "备注": "",
      "整改要求": "",
      "网站名称": "天能车用管理系统",
      "整改建议": "",
      "单位名称": "天能电池集团股份有限公司",
      "隐患域名url": "https://qiche.etianneng.cn",
      "隐患等级": "高危",
      "出现数量": "1",
      "隐患类型": "应用系统弱口令",
      "处置流程": "2025-01-03 08:58:27 开始\n\t处理人: 湖州关基操作员\n\t处置意见: 建议立即处理\n\n2025-01-06 16:21:28 简易处置\n\t处理人: 长兴网信\n\t处置意见: 整改复测完毕\n\t接收人员: 长兴网信 湖州关基操作员\n\n2025-01-06 16:21:28 结束",
      "被提示区县/部门": "长兴县, 湖州市",
      "被提示人员": "长兴网信, 湖州关基操作员",
      "处置反馈时间": "2025-01-06 16:21:28",
      "处置耗时": "耗时:3天7小时23分0秒"
    }
  },
  {
    "ent": "长兴交通投资集团有限公司",
    "time": "2025-01-02 14:54:11",
    "level": "中危",
    "srcIp": "dingtalk.zjcxjtjt.com",
    "srcPort": "9099",
    "dstIp": "dingtalk.zjcxjtjt.com",
    "dstPort": "9099",
    "proto": "TCP",
    "policyId": "—",
    "ruleName": "37长兴交通投资集团有限公司网络安全隐患通报 - 数字社会综合应用 - 未授权访问",
    "ruleType": "敏感信息泄露",
    "atkCount": "1",
    "hitCfg": "—",
    "alarmIv": "7天",
    "action": "已归档",
    "src": "自主录入",
    "_raw": {
      "事件编号": "202501020042",
      "发生时间": "2025-01-02 14:55:09",
      "事件状态": "已归档",
      "事件状态(小)": "已归档",
      "事件标题": "37长兴交通投资集团有限公司网络安全隐患通报 - 数字社会综合应用 - 未授权访问",
      "事件来源": "自主录入",
      "分数": "",
      "创建时间": "2025-01-02 14:55:09",
      "研制厂商": "",
      "联系人": "",
      "联系方式": "",
      "通报基本情况": "37长兴交通投资集团有限公司网络安全隐患通报 - 数字社会综合应用 - 未授权访问",
      "隐患描述": "37长兴交通投资集团有限公司网络安全隐患通报 - 数字社会综合应用 - 未授权访问",
      "网站域名": "https://dingtalk.zjcxjtjt.com:9099",
      "影响评估": "",
      "紧急程度": "高危",
      "隐患发现时间": "2025-01-02 14:54:11",
      "国民经济行业分类": "交通运输、仓储和邮政业",
      "区域划分": "长兴县",
      "发现厂商设备": "",
      "发现厂商名称": "浙江海瑞网络科技有限公司",
      "涉及信息数量": "",
      "信息类型": "",
      "ip": "",
      "通报等级": "",
      "通报反馈天数": "7",
      "漏洞编号": "",
      "相关路径": "",
      "端口": "",
      "位置层级": "",
      "参考链接": "",
      "备注": "",
      "整改要求": "",
      "网站名称": "数字社会综合应用",
      "整改建议": "",
      "单位名称": "长兴交通投资集团有限公司",
      "隐患域名url": "https://dingtalk.zjcxjtjt.com:9099",
      "隐患等级": "中危",
      "出现数量": "1",
      "隐患类型": "敏感信息泄露",
      "处置流程": "2025-01-03 09:41:57 开始\n\t处理人: 湖州关基操作员\n\t处置意见: 建议立即处理\n\n2025-01-16 17:07:11 简易处置\n\t处理人: 湖州关基操作员\n\t处置意见: 已完成整改\n\t接收人员: 长兴网信 湖州关基操作员\n\n2025-01-16 17:07:11 结束",
      "被提示区县/部门": "长兴县, 湖州市",
      "被提示人员": "长兴网信, 湖州关基操作员",
      "处置反馈时间": "2025-01-16 17:07:11",
      "处置耗时": "耗时:13天7小时25分13秒"
    }
  },
  {
    "ent": "建设局",
    "time": "2024-12-31 15:54:42",
    "level": "高危",
    "srcIp": "172.21.201.116",
    "srcPort": "—",
    "dstIp": "172.21.201.116",
    "dstPort": "—",
    "proto": "—",
    "policyId": "—",
    "ruleName": "3279建设局 172.21.201.116",
    "ruleType": "其他",
    "atkCount": "1",
    "hitCfg": "—",
    "alarmIv": "7天",
    "action": "已归档",
    "src": "自主录入",
    "_raw": {
      "事件编号": "202412310020",
      "发生时间": "2024-12-31 15:56:15",
      "事件状态": "已归档",
      "事件状态(小)": "已归档",
      "事件标题": "3279建设局 172.21.201.116",
      "事件来源": "自主录入",
      "分数": "",
      "创建时间": "2024-12-31 15:56:15",
      "研制厂商": "",
      "联系人": "",
      "联系方式": "",
      "通报基本情况": "3279建设局 172.21.201.116",
      "隐患描述": "3279建设局 172.21.201.116",
      "网站域名": "172.21.201.116",
      "影响评估": "",
      "紧急程度": "低危",
      "隐患发现时间": "2024-12-31 15:54:42",
      "国民经济行业分类": "其它",
      "区域划分": "长兴县",
      "发现厂商设备": "",
      "发现厂商名称": "浙江海瑞网络科技有限公司",
      "涉及信息数量": "",
      "信息类型": "",
      "ip": "",
      "通报等级": "",
      "通报反馈天数": "7",
      "漏洞编号": "",
      "相关路径": "",
      "端口": "",
      "位置层级": "",
      "参考链接": "",
      "备注": "",
      "整改要求": "",
      "网站名称": "所属信息系统",
      "整改建议": "",
      "单位名称": "建设局",
      "隐患域名url": "172.21.201.116",
      "隐患等级": "高危",
      "出现数量": "1",
      "隐患类型": "其他",
      "处置流程": "2024-12-31 15:56:41 开始\n\t处理人: 湖州关基操作员\n\t处置意见: 建议立即处理\n\n2024-12-31 15:58:08 简易处置\n\t处理人: 湖州关基操作员\n\t处置意见: 已完成整改\n\t接收人员: 湖州关基操作员\n\n2024-12-31 15:58:08 结束",
      "被提示区县/部门": "湖州市",
      "被提示人员": "湖州关基操作员",
      "处置反馈时间": "2024-12-31 15:58:08",
      "处置耗时": "耗时:1分27秒"
    }
  },
  {
    "ent": "建设局",
    "time": "2024-12-31 15:51:07",
    "level": "高危",
    "srcIp": "10.21.197.157",
    "srcPort": "—",
    "dstIp": "10.21.197.157",
    "dstPort": "—",
    "proto": "—",
    "policyId": "—",
    "ruleName": "3278建设局10.21.197.157",
    "ruleType": "其他",
    "atkCount": "1",
    "hitCfg": "—",
    "alarmIv": "7天",
    "action": "已归档",
    "src": "自主录入",
    "_raw": {
      "事件编号": "202412310019",
      "发生时间": "2024-12-31 15:54:13",
      "事件状态": "已归档",
      "事件状态(小)": "已归档",
      "事件标题": "3278建设局10.21.197.157",
      "事件来源": "自主录入",
      "分数": "",
      "创建时间": "2024-12-31 15:54:13",
      "研制厂商": "",
      "联系人": "",
      "联系方式": "",
      "通报基本情况": "3278建设局10.21.197.157",
      "隐患描述": "3278建设局10.21.197.157",
      "网站域名": "10.21.197.157",
      "影响评估": "",
      "紧急程度": "低危",
      "隐患发现时间": "2024-12-31 15:51:07",
      "国民经济行业分类": "其它",
      "区域划分": "长兴县",
      "发现厂商设备": "",
      "发现厂商名称": "浙江海瑞网络科技有限公司",
      "涉及信息数量": "",
      "信息类型": "",
      "ip": "",
      "通报等级": "",
      "通报反馈天数": "7",
      "漏洞编号": "",
      "相关路径": "",
      "端口": "",
      "位置层级": "",
      "参考链接": "",
      "备注": "",
      "整改要求": "",
      "网站名称": "所属信息系统",
      "整改建议": "",
      "单位名称": "建设局",
      "隐患域名url": "10.21.197.157",
      "隐患等级": "高危",
      "出现数量": "1",
      "隐患类型": "其他",
      "处置流程": "2024-12-31 15:54:23 开始\n\t处理人: 湖州关基操作员\n\t处置意见: 建议立即处理\n\n2024-12-31 15:57:45 简易处置\n\t处理人: 湖州关基操作员\n\t处置意见: 已完成整改\n\t接收人员: 湖州关基操作员\n\n2024-12-31 15:57:45 结束",
      "被提示区县/部门": "湖州市",
      "被提示人员": "湖州关基操作员",
      "处置反馈时间": "2024-12-31 15:57:45",
      "处置耗时": "耗时:3分21秒"
    }
  },
  {
    "ent": "政法委",
    "time": "2024-12-31 15:29:01",
    "level": "高危",
    "srcIp": "172.21.197.49",
    "srcPort": "—",
    "dstIp": "172.21.197.49",
    "dstPort": "—",
    "proto": "—",
    "policyId": "—",
    "ruleName": "3277政法委172.21.197.49",
    "ruleType": "其他",
    "atkCount": "1",
    "hitCfg": "—",
    "alarmIv": "7天",
    "action": "已归档",
    "src": "自主录入",
    "_raw": {
      "事件编号": "202412310018",
      "发生时间": "2024-12-31 15:30:04",
      "事件状态": "已归档",
      "事件状态(小)": "已归档",
      "事件标题": "3277政法委172.21.197.49",
      "事件来源": "自主录入",
      "分数": "",
      "创建时间": "2024-12-31 15:30:04",
      "研制厂商": "",
      "联系人": "",
      "联系方式": "",
      "通报基本情况": "3277政法委172.21.197.49",
      "隐患描述": "3277政法委172.21.197.49",
      "网站域名": "172.21.197.49",
      "影响评估": "",
      "紧急程度": "低危",
      "隐患发现时间": "2024-12-31 15:29:01",
      "国民经济行业分类": "其它",
      "区域划分": "长兴县",
      "发现厂商设备": "",
      "发现厂商名称": "浙江海瑞网络科技有限公司",
      "涉及信息数量": "",
      "信息类型": "",
      "ip": "",
      "通报等级": "",
      "通报反馈天数": "7",
      "漏洞编号": "",
      "相关路径": "",
      "端口": "",
      "位置层级": "",
      "参考链接": "",
      "备注": "",
      "整改要求": "",
      "网站名称": "所属信息系统",
      "整改建议": "",
      "单位名称": "政法委",
      "隐患域名url": "172.21.197.49",
      "隐患等级": "高危",
      "出现数量": "1",
      "隐患类型": "其他",
      "处置流程": "2024-12-31 15:32:10 开始\n\t处理人: 湖州关基操作员\n\t处置意见: 建议立即处理\n\n2024-12-31 15:32:30 简易处置\n\t处理人: 湖州关基操作员\n\t处置意见: 已完成整改\n\t接收人员: 湖州关基操作员\n\n2024-12-31 15:32:30 结束",
      "被提示区县/部门": "湖州市",
      "被提示人员": "湖州关基操作员",
      "处置反馈时间": "2024-12-31 15:32:30",
      "处置耗时": "耗时:19秒"
    }
  },
  {
    "ent": "县委办",
    "time": "2024-12-31 15:18:52",
    "level": "高危",
    "srcIp": "172.21.196.201",
    "srcPort": "—",
    "dstIp": "172.21.196.201",
    "dstPort": "—",
    "proto": "—",
    "policyId": "—",
    "ruleName": "3276县委办172.21.196.201",
    "ruleType": "其他",
    "atkCount": "1",
    "hitCfg": "—",
    "alarmIv": "7天",
    "action": "已归档",
    "src": "自主录入",
    "_raw": {
      "事件编号": "202412310017",
      "发生时间": "2024-12-31 15:20:50",
      "事件状态": "已归档",
      "事件状态(小)": "已归档",
      "事件标题": "3276县委办172.21.196.201",
      "事件来源": "自主录入",
      "分数": "",
      "创建时间": "2024-12-31 15:20:50",
      "研制厂商": "",
      "联系人": "",
      "联系方式": "",
      "通报基本情况": "3276县委办172.21.196.201",
      "隐患描述": "3276县委办172.21.196.201",
      "网站域名": "172.21.196.201",
      "影响评估": "",
      "紧急程度": "低危",
      "隐患发现时间": "2024-12-31 15:18:52",
      "国民经济行业分类": "其它",
      "区域划分": "长兴县",
      "发现厂商设备": "",
      "发现厂商名称": "浙江海瑞网络科技有限公司",
      "涉及信息数量": "",
      "信息类型": "",
      "ip": "",
      "通报等级": "",
      "通报反馈天数": "7",
      "漏洞编号": "",
      "相关路径": "",
      "端口": "",
      "位置层级": "",
      "参考链接": "",
      "备注": "",
      "整改要求": "",
      "网站名称": "所属信息系统",
      "整改建议": "",
      "单位名称": "县委办",
      "隐患域名url": "172.21.196.201",
      "隐患等级": "高危",
      "出现数量": "1",
      "隐患类型": "其他",
      "处置流程": "2024-12-31 15:21:20 开始\n\t处理人: 湖州关基操作员\n\t处置意见: 建议立即处理\n\n2024-12-31 15:22:10 简易处置\n\t处理人: 湖州关基操作员\n\t处置意见: 已完成整改\n\t接收人员: 湖州关基操作员\n\n2024-12-31 15:22:10 结束",
      "被提示区县/部门": "湖州市",
      "被提示人员": "湖州关基操作员",
      "处置反馈时间": "2024-12-31 15:22:10",
      "处置耗时": "耗时:49秒"
    }
  },
  {
    "ent": "吕山乡",
    "time": "2024-12-31 15:14:25",
    "level": "高危",
    "srcIp": "10.21.215.243",
    "srcPort": "—",
    "dstIp": "10.21.215.243",
    "dstPort": "—",
    "proto": "—",
    "policyId": "—",
    "ruleName": "3275吕山乡10.21.215.243",
    "ruleType": "其他",
    "atkCount": "1",
    "hitCfg": "—",
    "alarmIv": "7天",
    "action": "已归档",
    "src": "自主录入",
    "_raw": {
      "事件编号": "202412310016",
      "发生时间": "2024-12-31 15:15:10",
      "事件状态": "已归档",
      "事件状态(小)": "已归档",
      "事件标题": "3275吕山乡10.21.215.243",
      "事件来源": "自主录入",
      "分数": "",
      "创建时间": "2024-12-31 15:15:10",
      "研制厂商": "",
      "联系人": "",
      "联系方式": "",
      "通报基本情况": "3275吕山乡10.21.215.243",
      "隐患描述": "3275吕山乡10.21.215.243",
      "网站域名": "10.21.215.243",
      "影响评估": "",
      "紧急程度": "低危",
      "隐患发现时间": "2024-12-31 15:14:25",
      "国民经济行业分类": "其它",
      "区域划分": "长兴县",
      "发现厂商设备": "",
      "发现厂商名称": "浙江海瑞网络科技有限公司",
      "涉及信息数量": "",
      "信息类型": "",
      "ip": "",
      "通报等级": "",
      "通报反馈天数": "7",
      "漏洞编号": "",
      "相关路径": "",
      "端口": "",
      "位置层级": "",
      "参考链接": "",
      "备注": "",
      "整改要求": "",
      "网站名称": "所属信息系统",
      "整改建议": "",
      "单位名称": "吕山乡",
      "隐患域名url": "10.21.215.243",
      "隐患等级": "高危",
      "出现数量": "1",
      "隐患类型": "其他",
      "处置流程": "2024-12-31 15:15:25 开始\n\t处理人: 湖州关基操作员\n\t处置意见: 建议立即处理\n\n2024-12-31 15:16:18 简易处置\n\t处理人: 湖州关基操作员\n\t处置意见: 已完成整改\n\t接收人员: 湖州关基操作员\n\n2024-12-31 15:16:18 结束",
      "被提示区县/部门": "湖州市",
      "被提示人员": "湖州关基操作员",
      "处置反馈时间": "2024-12-31 15:16:18",
      "处置耗时": "耗时:52秒"
    }
  },
  {
    "ent": "吕山乡",
    "time": "2024-12-31 15:13:24",
    "level": "高危",
    "srcIp": "10.21.215.241",
    "srcPort": "—",
    "dstIp": "10.21.215.241",
    "dstPort": "—",
    "proto": "—",
    "policyId": "—",
    "ruleName": "3274吕山乡10.21.215.241",
    "ruleType": "其他",
    "atkCount": "1",
    "hitCfg": "—",
    "alarmIv": "7天",
    "action": "已归档",
    "src": "自主录入",
    "_raw": {
      "事件编号": "202412310015",
      "发生时间": "2024-12-31 15:14:07",
      "事件状态": "已归档",
      "事件状态(小)": "已归档",
      "事件标题": "3274吕山乡10.21.215.241",
      "事件来源": "自主录入",
      "分数": "",
      "创建时间": "2024-12-31 15:14:07",
      "研制厂商": "",
      "联系人": "",
      "联系方式": "",
      "通报基本情况": "3274吕山乡10.21.215.241",
      "隐患描述": "3274吕山乡10.21.215.241",
      "网站域名": "10.21.215.241",
      "影响评估": "",
      "紧急程度": "低危",
      "隐患发现时间": "2024-12-31 15:13:24",
      "国民经济行业分类": "其它",
      "区域划分": "长兴县",
      "发现厂商设备": "",
      "发现厂商名称": "浙江海瑞网络科技有限公司",
      "涉及信息数量": "",
      "信息类型": "",
      "ip": "",
      "通报等级": "",
      "通报反馈天数": "7",
      "漏洞编号": "",
      "相关路径": "",
      "端口": "",
      "位置层级": "",
      "参考链接": "",
      "备注": "",
      "整改要求": "",
      "网站名称": "所属信息系统",
      "整改建议": "",
      "单位名称": "吕山乡",
      "隐患域名url": "10.21.215.241",
      "隐患等级": "高危",
      "出现数量": "1",
      "隐患类型": "其他",
      "处置流程": "2024-12-31 15:15:34 开始\n\t处理人: 湖州关基操作员\n\t处置意见: 建议立即处理\n\n2024-12-31 15:16:07 简易处置\n\t处理人: 湖州关基操作员\n\t处置意见: 已完成整改\n\t接收人员: 湖州关基操作员\n\n2024-12-31 15:16:07 结束",
      "被提示区县/部门": "湖州市",
      "被提示人员": "湖州关基操作员",
      "处置反馈时间": "2024-12-31 15:16:07",
      "处置耗时": "耗时:32秒"
    }
  },
  {
    "ent": "吕山乡",
    "time": "2024-12-31 15:06:03",
    "level": "高危",
    "srcIp": "10.21.215.139",
    "srcPort": "—",
    "dstIp": "10.21.215.139",
    "dstPort": "—",
    "proto": "—",
    "policyId": "—",
    "ruleName": "3273吕山乡10.21.215.139",
    "ruleType": "其他",
    "atkCount": "1",
    "hitCfg": "—",
    "alarmIv": "7天",
    "action": "已归档",
    "src": "自主录入",
    "_raw": {
      "事件编号": "202412310014",
      "发生时间": "2024-12-31 15:12:16",
      "事件状态": "已归档",
      "事件状态(小)": "已归档",
      "事件标题": "3273吕山乡10.21.215.139",
      "事件来源": "自主录入",
      "分数": "",
      "创建时间": "2024-12-31 15:12:16",
      "研制厂商": "",
      "联系人": "",
      "联系方式": "",
      "通报基本情况": "3273吕山乡10.21.215.139",
      "隐患描述": "3273吕山乡10.21.215.139",
      "网站域名": "10.21.215.139",
      "影响评估": "",
      "紧急程度": "低危",
      "隐患发现时间": "2024-12-31 15:06:03",
      "国民经济行业分类": "其它",
      "区域划分": "长兴县",
      "发现厂商设备": "",
      "发现厂商名称": "浙江海瑞网络科技有限公司",
      "涉及信息数量": "",
      "信息类型": "",
      "ip": "",
      "通报等级": "",
      "通报反馈天数": "7",
      "漏洞编号": "",
      "相关路径": "",
      "端口": "",
      "位置层级": "",
      "参考链接": "",
      "备注": "",
      "整改要求": "",
      "网站名称": "所属信息系统",
      "整改建议": "",
      "单位名称": "吕山乡",
      "隐患域名url": "10.21.215.139",
      "隐患等级": "高危",
      "出现数量": "1",
      "隐患类型": "其他",
      "处置流程": "2024-12-31 15:12:28 开始\n\t处理人: 湖州关基操作员\n\t处置意见: 建议立即处理\n\n2024-12-31 15:15:51 简易处置\n\t处理人: 湖州关基操作员\n\t处置意见: 已完成整改\n\t接收人员: 湖州关基操作员\n\n2024-12-31 15:15:51 结束",
      "被提示区县/部门": "湖州市",
      "被提示人员": "湖州关基操作员",
      "处置反馈时间": "2024-12-31 15:15:51",
      "处置耗时": "耗时:3分23秒"
    }
  },
  {
    "ent": "龙山街道",
    "time": "2024-12-31 14:51:34",
    "level": "高危",
    "srcIp": "10.38.197.204",
    "srcPort": "—",
    "dstIp": "10.38.197.204",
    "dstPort": "—",
    "proto": "—",
    "policyId": "—",
    "ruleName": "3272龙山街道10.38.197.204",
    "ruleType": "其他",
    "atkCount": "1",
    "hitCfg": "—",
    "alarmIv": "7天",
    "action": "已归档",
    "src": "自主录入",
    "_raw": {
      "事件编号": "202412310013",
      "发生时间": "2024-12-31 14:54:31",
      "事件状态": "已归档",
      "事件状态(小)": "已归档",
      "事件标题": "3272龙山街道10.38.197.204",
      "事件来源": "自主录入",
      "分数": "",
      "创建时间": "2024-12-31 14:54:31",
      "研制厂商": "",
      "联系人": "",
      "联系方式": "",
      "通报基本情况": "3272龙山街道10.38.197.204",
      "隐患描述": "3272龙山街道10.38.197.204",
      "网站域名": "10.38.197.204",
      "影响评估": "",
      "紧急程度": "低危",
      "隐患发现时间": "2024-12-31 14:51:34",
      "国民经济行业分类": "其它",
      "区域划分": "长兴县",
      "发现厂商设备": "",
      "发现厂商名称": "浙江海瑞网络科技有限公司",
      "涉及信息数量": "",
      "信息类型": "",
      "ip": "",
      "通报等级": "",
      "通报反馈天数": "7",
      "漏洞编号": "",
      "相关路径": "",
      "端口": "",
      "位置层级": "",
      "参考链接": "",
      "备注": "",
      "整改要求": "",
      "网站名称": "所属信息系统",
      "整改建议": "",
      "单位名称": "龙山街道",
      "隐患域名url": "10.38.197.204",
      "隐患等级": "高危",
      "出现数量": "1",
      "隐患类型": "其他",
      "处置流程": "2024-12-31 14:54:43 开始\n\t处理人: 湖州关基操作员\n\t处置意见: 建议立即处理\n\n2024-12-31 14:55:36 简易处置\n\t处理人: 湖州关基操作员\n\t处置意见: 已完成整改\n\t接收人员: 湖州关基操作员\n\n2024-12-31 14:55:36 结束",
      "被提示区县/部门": "湖州市",
      "被提示人员": "湖州关基操作员",
      "处置反馈时间": "2024-12-31 14:55:36",
      "处置耗时": "耗时:53秒"
    }
  },
  {
    "ent": "开发区",
    "time": "2024-12-31 14:23:03",
    "level": "高危",
    "srcIp": "10.21.211.209",
    "srcPort": "—",
    "dstIp": "10.21.211.209",
    "dstPort": "—",
    "proto": "—",
    "policyId": "—",
    "ruleName": "3271开发区10.21.211.209",
    "ruleType": "其他",
    "atkCount": "1",
    "hitCfg": "—",
    "alarmIv": "7天",
    "action": "已归档",
    "src": "自主录入",
    "_raw": {
      "事件编号": "202412310012",
      "发生时间": "2024-12-31 14:26:22",
      "事件状态": "已归档",
      "事件状态(小)": "已归档",
      "事件标题": "3271开发区10.21.211.209",
      "事件来源": "自主录入",
      "分数": "",
      "创建时间": "2024-12-31 14:26:22",
      "研制厂商": "",
      "联系人": "",
      "联系方式": "",
      "通报基本情况": "3271开发区10.21.211.209",
      "隐患描述": "3271开发区10.21.211.209",
      "网站域名": "10.21.211.209",
      "影响评估": "",
      "紧急程度": "低危",
      "隐患发现时间": "2024-12-31 14:23:03",
      "国民经济行业分类": "其它",
      "区域划分": "长兴县",
      "发现厂商设备": "",
      "发现厂商名称": "浙江海瑞网络科技有限公司",
      "涉及信息数量": "",
      "信息类型": "",
      "ip": "",
      "通报等级": "",
      "通报反馈天数": "7",
      "漏洞编号": "",
      "相关路径": "",
      "端口": "",
      "位置层级": "",
      "参考链接": "",
      "备注": "",
      "整改要求": "",
      "网站名称": "所属信息系统",
      "整改建议": "",
      "单位名称": "开发区",
      "隐患域名url": "10.21.211.209",
      "隐患等级": "高危",
      "出现数量": "1",
      "隐患类型": "其他",
      "处置流程": "2024-12-31 14:27:53 开始\n\t处理人: 湖州关基操作员\n\t处置意见: 建议立即处理\n\n2024-12-31 14:28:10 简易处置\n\t处理人: 湖州关基操作员\n\t处置意见: 已完成整改\n\t接收人员: 湖州关基操作员\n\n2024-12-31 14:28:10 结束",
      "被提示区县/部门": "湖州市",
      "被提示人员": "湖州关基操作员",
      "处置反馈时间": "2024-12-31 14:28:10",
      "处置耗时": "耗时:16秒"
    }
  },
  {
    "ent": "经信局",
    "time": "2024-12-31 14:01:11",
    "level": "高危",
    "srcIp": "172.21.198.189",
    "srcPort": "—",
    "dstIp": "172.21.198.189",
    "dstPort": "—",
    "proto": "—",
    "policyId": "—",
    "ruleName": "3270经信局172.21.198.189",
    "ruleType": "其他",
    "atkCount": "1",
    "hitCfg": "—",
    "alarmIv": "7天",
    "action": "已归档",
    "src": "自主录入",
    "_raw": {
      "事件编号": "202412310011",
      "发生时间": "2024-12-31 14:02:29",
      "事件状态": "已归档",
      "事件状态(小)": "已归档",
      "事件标题": "3270经信局172.21.198.189",
      "事件来源": "自主录入",
      "分数": "",
      "创建时间": "2024-12-31 14:02:29",
      "研制厂商": "",
      "联系人": "",
      "联系方式": "",
      "通报基本情况": "3270经信局172.21.198.189",
      "隐患描述": "3270经信局172.21.198.189",
      "网站域名": "172.21.198.189",
      "影响评估": "",
      "紧急程度": "低危",
      "隐患发现时间": "2024-12-31 14:01:11",
      "国民经济行业分类": "其它",
      "区域划分": "长兴县",
      "发现厂商设备": "",
      "发现厂商名称": "浙江海瑞网络科技有限公司",
      "涉及信息数量": "",
      "信息类型": "",
      "ip": "",
      "通报等级": "",
      "通报反馈天数": "7",
      "漏洞编号": "",
      "相关路径": "",
      "端口": "",
      "位置层级": "",
      "参考链接": "",
      "备注": "",
      "整改要求": "",
      "网站名称": "所属信息系统",
      "整改建议": "",
      "单位名称": "经信局",
      "隐患域名url": "172.21.198.189",
      "隐患等级": "高危",
      "出现数量": "1",
      "隐患类型": "其他",
      "处置流程": "2024-12-31 14:03:06 开始\n\t处理人: 湖州关基操作员\n\t处置意见: 建议立即处理\n\n2024-12-31 14:03:49 简易处置\n\t处理人: 湖州关基操作员\n\t处置意见: 已完成整改\n\t接收人员: 湖州关基操作员\n\n2024-12-31 14:03:49 结束",
      "被提示区县/部门": "湖州市",
      "被提示人员": "湖州关基操作员",
      "处置反馈时间": "2024-12-31 14:03:49",
      "处置耗时": "耗时:42秒"
    }
  },
  {
    "ent": "长兴县经信局",
    "time": "2024-12-31 13:57:51",
    "level": "高危",
    "srcIp": "172.21.198.182",
    "srcPort": "—",
    "dstIp": "172.21.198.182",
    "dstPort": "—",
    "proto": "—",
    "policyId": "—",
    "ruleName": "3269经信局172.21.198.182",
    "ruleType": "其他",
    "atkCount": "1",
    "hitCfg": "—",
    "alarmIv": "7天",
    "action": "已归档",
    "src": "自主录入",
    "_raw": {
      "事件编号": "202412310010",
      "发生时间": "2024-12-31 14:00:53",
      "事件状态": "已归档",
      "事件状态(小)": "已归档",
      "事件标题": "3269经信局172.21.198.182",
      "事件来源": "自主录入",
      "分数": "",
      "创建时间": "2024-12-31 14:00:53",
      "研制厂商": "",
      "联系人": "",
      "联系方式": "",
      "通报基本情况": "3269经信局172.21.198.182",
      "隐患描述": "3269经信局172.21.198.182",
      "网站域名": "172.21.198.182",
      "影响评估": "",
      "紧急程度": "低危",
      "隐患发现时间": "2024-12-31 13:57:51",
      "国民经济行业分类": "其它",
      "区域划分": "长兴县",
      "发现厂商设备": "",
      "发现厂商名称": "浙江海瑞网络科技有限公司",
      "涉及信息数量": "",
      "信息类型": "",
      "ip": "",
      "通报等级": "",
      "通报反馈天数": "7",
      "漏洞编号": "",
      "相关路径": "",
      "端口": "",
      "位置层级": "",
      "参考链接": "",
      "备注": "",
      "整改要求": "",
      "网站名称": "所属信息系统",
      "整改建议": "",
      "单位名称": "长兴县经信局",
      "隐患域名url": "172.21.198.182",
      "隐患等级": "高危",
      "出现数量": "1",
      "隐患类型": "其他",
      "处置流程": "2024-12-31 14:03:21 开始\n\t处理人: 湖州关基操作员\n\t处置意见: 建议立即处理\n\n2024-12-31 14:06:23 简易处置\n\t处理人: 湖州关基操作员\n\t处置意见: 已完成整改\n\t接收人员: 湖州关基操作员\n\n2024-12-31 14:06:23 结束",
      "被提示区县/部门": "湖州市",
      "被提示人员": "湖州关基操作员",
      "处置反馈时间": "2024-12-31 14:06:23",
      "处置耗时": "耗时:3分2秒"
    }
  },
  {
    "ent": "长兴县交通运输局",
    "time": "2024-12-31 13:52:25",
    "level": "高危",
    "srcIp": "10.21.196.195",
    "srcPort": "—",
    "dstIp": "10.21.196.195",
    "dstPort": "—",
    "proto": "—",
    "policyId": "—",
    "ruleName": "3268长兴县交通运输局10.21.196.195",
    "ruleType": "其他",
    "atkCount": "1",
    "hitCfg": "—",
    "alarmIv": "7天",
    "action": "已归档",
    "src": "自主录入",
    "_raw": {
      "事件编号": "202412310009",
      "发生时间": "2024-12-31 13:53:15",
      "事件状态": "已归档",
      "事件状态(小)": "已归档",
      "事件标题": "3268长兴县交通运输局10.21.196.195",
      "事件来源": "自主录入",
      "分数": "",
      "创建时间": "2024-12-31 13:53:15",
      "研制厂商": "",
      "联系人": "",
      "联系方式": "",
      "通报基本情况": "3268长兴县交通运输局10.21.196.195",
      "隐患描述": "3268长兴县交通运输局10.21.196.195",
      "网站域名": "10.21.196.195",
      "影响评估": "",
      "紧急程度": "低危",
      "隐患发现时间": "2024-12-31 13:52:25",
      "国民经济行业分类": "其它",
      "区域划分": "长兴县",
      "发现厂商设备": "",
      "发现厂商名称": "浙江海瑞网络科技有限公司",
      "涉及信息数量": "",
      "信息类型": "",
      "ip": "",
      "通报等级": "",
      "通报反馈天数": "7",
      "漏洞编号": "",
      "相关路径": "",
      "端口": "",
      "位置层级": "",
      "参考链接": "",
      "备注": "",
      "整改要求": "",
      "网站名称": "所属信息系统",
      "整改建议": "",
      "单位名称": "长兴县交通运输局",
      "隐患域名url": "10.21.196.195",
      "隐患等级": "高危",
      "出现数量": "1",
      "隐患类型": "其他",
      "处置流程": "2024-12-31 13:53:29 开始\n\t处理人: 湖州关基操作员\n\t处置意见: 建议立即处理\n\n2024-12-31 13:53:49 简易处置\n\t处理人: 湖州关基操作员\n\t处置意见: 已完成整改\n\t接收人员: 湖州关基操作员\n\n2024-12-31 13:53:49 结束",
      "被提示区县/部门": "湖州市",
      "被提示人员": "湖州关基操作员",
      "处置反馈时间": "2024-12-31 13:53:49",
      "处置耗时": "耗时:20秒"
    }
  },
  {
    "ent": "国家大学科技园",
    "time": "2024-12-31 13:33:56",
    "level": "高危",
    "srcIp": "172.21.223.82",
    "srcPort": "—",
    "dstIp": "172.21.223.82",
    "dstPort": "—",
    "proto": "—",
    "policyId": "—",
    "ruleName": "3267国家大学科技园172.21.223.82",
    "ruleType": "其他",
    "atkCount": "1",
    "hitCfg": "—",
    "alarmIv": "7天",
    "action": "已归档",
    "src": "自主录入",
    "_raw": {
      "事件编号": "202412310008",
      "发生时间": "2024-12-31 13:45:16",
      "事件状态": "已归档",
      "事件状态(小)": "已归档",
      "事件标题": "3267国家大学科技园172.21.223.82",
      "事件来源": "自主录入",
      "分数": "",
      "创建时间": "2024-12-31 13:45:16",
      "研制厂商": "",
      "联系人": "",
      "联系方式": "",
      "通报基本情况": "3267国家大学科技园172.21.223.82",
      "隐患描述": "3267国家大学科技园172.21.223.82",
      "网站域名": "172.21.223.82",
      "影响评估": "",
      "紧急程度": "低危",
      "隐患发现时间": "2024-12-31 13:33:56",
      "国民经济行业分类": "其它",
      "区域划分": "长兴县",
      "发现厂商设备": "",
      "发现厂商名称": "浙江海瑞网络科技有限公司",
      "涉及信息数量": "",
      "信息类型": "",
      "ip": "",
      "通报等级": "",
      "通报反馈天数": "7",
      "漏洞编号": "",
      "相关路径": "",
      "端口": "",
      "位置层级": "",
      "参考链接": "",
      "备注": "",
      "整改要求": "",
      "网站名称": "所属信息系统",
      "整改建议": "",
      "单位名称": "国家大学科技园",
      "隐患域名url": "172.21.223.82",
      "隐患等级": "高危",
      "出现数量": "1",
      "隐患类型": "其他",
      "处置流程": "2024-12-31 13:48:50 开始\n\t处理人: 湖州关基操作员\n\t处置意见: 建议立即处理\n\n2024-12-31 13:49:37 简易处置\n\t处理人: 湖州关基操作员\n\t处置意见: 已完成整改\n\t接收人员: 湖州关基操作员\n\n2024-12-31 13:49:37 结束",
      "被提示区县/部门": "湖州市",
      "被提示人员": "湖州关基操作员",
      "处置反馈时间": "2024-12-31 13:49:37",
      "处置耗时": "耗时:47秒"
    }
  },
  {
    "ent": "长兴妇联",
    "time": "2024-12-31 13:24:53",
    "level": "高危",
    "srcIp": "172.21.198.22",
    "srcPort": "—",
    "dstIp": "172.21.198.22",
    "dstPort": "—",
    "proto": "—",
    "policyId": "—",
    "ruleName": "3266长兴妇联172.21.198.22网络安全隐患通报",
    "ruleType": "其他",
    "atkCount": "1",
    "hitCfg": "—",
    "alarmIv": "7天",
    "action": "已归档",
    "src": "自主录入",
    "_raw": {
      "事件编号": "202412310007",
      "发生时间": "2024-12-31 13:31:06",
      "事件状态": "已归档",
      "事件状态(小)": "已归档",
      "事件标题": "3266长兴妇联172.21.198.22网络安全隐患通报",
      "事件来源": "自主录入",
      "分数": "",
      "创建时间": "2024-12-31 13:31:06",
      "研制厂商": "",
      "联系人": "",
      "联系方式": "",
      "通报基本情况": "3266长兴妇联172.21.198.22网络安全隐患通报",
      "隐患描述": "3266长兴妇联172.21.198.22网络安全隐患通报",
      "网站域名": "172.21.198.22",
      "影响评估": "",
      "紧急程度": "低危",
      "隐患发现时间": "2024-12-31 13:24:53",
      "国民经济行业分类": "其它",
      "区域划分": "长兴县",
      "发现厂商设备": "",
      "发现厂商名称": "浙江海瑞网络科技有限公司",
      "涉及信息数量": "",
      "信息类型": "",
      "ip": "",
      "通报等级": "",
      "通报反馈天数": "7",
      "漏洞编号": "",
      "相关路径": "",
      "端口": "",
      "位置层级": "",
      "参考链接": "",
      "备注": "",
      "整改要求": "",
      "网站名称": "所属信息系统",
      "整改建议": "",
      "单位名称": "长兴妇联",
      "隐患域名url": "172.21.198.22",
      "隐患等级": "高危",
      "出现数量": "1",
      "隐患类型": "其他",
      "处置流程": "2024-12-31 13:31:23 开始\n\t处理人: 湖州关基操作员\n\t处置意见: 建议立即处理\n\n2024-12-31 13:31:41 简易处置\n\t处理人: 湖州关基操作员\n\t处置意见: 已完成整改\n\t接收人员: 湖州关基操作员\n\n2024-12-31 13:31:41 结束",
      "被提示区县/部门": "湖州市",
      "被提示人员": "湖州关基操作员",
      "处置反馈时间": "2024-12-31 13:31:41",
      "处置耗时": "耗时:18秒"
    }
  },
  {
    "ent": "妇联",
    "time": "2024-12-31 13:15:48",
    "level": "高危",
    "srcIp": "172.21.198.11",
    "srcPort": "—",
    "dstIp": "172.21.198.11",
    "dstPort": "—",
    "proto": "—",
    "policyId": "—",
    "ruleName": "3265妇联172.21.198.11网络安全隐患通报",
    "ruleType": "其他",
    "atkCount": "1",
    "hitCfg": "—",
    "alarmIv": "7天",
    "action": "已归档",
    "src": "自主录入",
    "_raw": {
      "事件编号": "202412310006",
      "发生时间": "2024-12-31 13:22:36",
      "事件状态": "已归档",
      "事件状态(小)": "已归档",
      "事件标题": "3265妇联172.21.198.11网络安全隐患通报",
      "事件来源": "自主录入",
      "分数": "",
      "创建时间": "2024-12-31 13:22:36",
      "研制厂商": "",
      "联系人": "",
      "联系方式": "",
      "通报基本情况": "3265妇联172.21.198.11网络安全隐患通报",
      "隐患描述": "3265妇联172.21.198.11网络安全隐患通报",
      "网站域名": "172.21.198.11",
      "影响评估": "",
      "紧急程度": "低危",
      "隐患发现时间": "2024-12-31 13:15:48",
      "国民经济行业分类": "其它",
      "区域划分": "长兴县",
      "发现厂商设备": "",
      "发现厂商名称": "浙江海瑞网络科技有限公司",
      "涉及信息数量": "",
      "信息类型": "",
      "ip": "",
      "通报等级": "",
      "通报反馈天数": "7",
      "漏洞编号": "",
      "相关路径": "",
      "端口": "",
      "位置层级": "",
      "参考链接": "",
      "备注": "",
      "整改要求": "",
      "网站名称": "所属信息系统",
      "整改建议": "",
      "单位名称": "妇联",
      "隐患域名url": "172.21.198.11",
      "隐患等级": "高危",
      "出现数量": "1",
      "隐患类型": "其他",
      "处置流程": "2024-12-31 13:22:46 开始\n\t处理人: 湖州关基操作员\n\t处置意见: 建议立即处理\n\n2024-12-31 13:23:01 简易处置\n\t处理人: 湖州关基操作员\n\t处置意见: 已完成整改\n\t接收人员: 湖州关基操作员\n\n2024-12-31 13:23:01 结束",
      "被提示区县/部门": "湖州市",
      "被提示人员": "湖州关基操作员",
      "处置反馈时间": "2024-12-31 13:23:01",
      "处置耗时": "耗时:15秒"
    }
  }
];

  function countBy(rows, fn) {
    const m = {};
    (rows || []).forEach((r) => {
      const k = fn(r) || "—";
      m[k] = (m[k] || 0) + 1;
    });
    return m;
  }

  const AQ_LEVEL_MAP = { 严重: "严重", 高危: "高危", 中危: "中危", 低危: "低危" };
  const AQ_LEVEL_COUNTER = countBy(mockAnquan, (r) => AQ_LEVEL_MAP[r.level] || r.level);
  const AQ_THREAT_STATS = {
    严重: Number(AQ_LEVEL_COUNTER["严重"] || 0),
    高危: Number(AQ_LEVEL_COUNTER["高危"] || 0),
    中危: Number(AQ_LEVEL_COUNTER["中危"] || 0),
    低危: Number(AQ_LEVEL_COUNTER["低危"] || 0),
  };
  const AQ_LOG_TOTAL = mockAnquan.length;
  const AQ_ONLINE_SESSIONS = mockAnquan.length;

  const AQ_TYPE_COUNTER = countBy(mockAnquan, (r) => (r.ruleType || "其他").trim());
  const AQ_TYPE_TOP = Object.entries(AQ_TYPE_COUNTER)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 6);
  const AQ_APP_TRAFFIC_LABELS = AQ_TYPE_TOP.length ? AQ_TYPE_TOP.map(([k, v]) => k + "（" + v + "）") : ["—"];
  const AQ_APP_TRAFFIC_MB = AQ_TYPE_TOP.length ? AQ_TYPE_TOP.map((x) => x[1]) : [1];

  const AQ_HOST_COUNTER = countBy(mockAnquan, (r) => (r.dstIp || r.srcIp || "—").trim());
  const AQ_TRAFFIC_TOP10 = Object.entries(AQ_HOST_COUNTER)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 10)
    .map(([ip, n], i) => ({ rank: i + 1, ip, up: "—", down: "—", total: String(n), sess: n }));
  const AQ_TRAFFIC_TOP10_MB = AQ_TRAFFIC_TOP10.map((r) => r.sess);

  const AQ_RT_MBPS = {
    recv: Number((AQ_LOG_TOTAL / 4).toFixed(2)),
    send: Number((AQ_LOG_TOTAL / 3).toFixed(2)),
  };

  function isPlatform() {
    return roleSelect.value === "platform";
  }

  function filterByRole(rows, entField, entName) {
    if (isPlatform()) return rows;
    const target = entName !== undefined && entName !== null ? entName : YUQING_FOCUS_ENT;
    return rows.filter((r) => r[entField] === target);
  }

  function escapeHtml(s) {
    return String(s ?? "")
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;");
  }

  function fillYuqingSrcFilter() {
    const sel = document.getElementById("flt-yuqing-src");
    if (!sel) return;
    const cur = sel.value;
    const set = new Set();
    mockYuqing.forEach((r) => {
      if (r.src) set.add(r.src);
    });
    const opts = Array.from(set).sort((a, b) => a.localeCompare(b, "zh"));
    sel.innerHTML = '<option value="">全部来源网站</option>' + opts.map((o) => `<option value="${escapeHtml(o)}">${escapeHtml(o)}</option>`).join("");
    if (opts.includes(cur)) sel.value = cur;
  }

  function fillEnterpriseSelects() {
    const sels = ["flt-yuqing-ent", "flt-qq-ent", "flt-aq-ent"];
    sels.forEach((id) => {
      const el = document.getElementById(id);
      if (!el) return;
      const cur = el.value;
      el.innerHTML = '<option value="">全部入盟企业</option>';
      enterprises.forEach((e) => {
        const o = document.createElement("option");
        o.value = e;
        o.textContent = e;
        el.appendChild(o);
      });
      if (enterprises.includes(cur)) el.value = cur;
    });
  }

  function renderHomeKpis() {
    const yq = filterByRole(mockYuqing, "ent", YUQING_FOCUS_ENT);
    const qq = filterByRole(mockQinquan, "ent");
    const aq = filterByRole(mockAnquan, "ent");
    const yqAll = isPlatform() ? mockYuqing : yq;
    const qqAll = isPlatform() ? mockQinquan : qq;
    const aqAll = isPlatform() ? mockAnquan : aq;

    const ovTitle = document.getElementById("homeOverviewTitle");
    if (ovTitle) ovTitle.textContent = isPlatform() ? "全县态势总览" : "本企业态势总览（长兴天能 · 表格数据）";

    const near = yq.filter((x) => x.status === "待研判").length;
    const over = yq.filter((x) => x.status === "监测中").length;
    const severe = yq.filter((x) => x.level === "高").length;
    const elN = document.getElementById("cp-al-near");
    const elO = document.getElementById("cp-al-over");
    const elS = document.getElementById("cp-al-severe");
    if (elN) elN.textContent = String(near);
    if (elO) elO.textContent = String(over);
    if (elS) elS.textContent = String(severe);

    const highAqCount = aq.filter((x) => x.level === "高危" || x.level === "严重").length;
    const riskIdx = Math.min(
      100,
      Math.round(
        yq.filter((x) => x.level === "高").length * 6 +
          qq.filter((x) => x.status === "在办").length * 3 +
          highAqCount * 5 +
          28
      )
    );

    const mEnt = document.getElementById("cp-mega-ent");
    const mYq = document.getElementById("cp-mega-yq");
    const mR = document.getElementById("cp-mega-risk");
    if (mEnt) mEnt.textContent = String(isPlatform() ? enterprises.length : 1);
    if (mYq) mYq.textContent = String(yq.length);
    if (mR) mR.textContent = String(riskIdx);

    const podium = document.getElementById("cp-podium-wrap");
    if (podium) {
      const qqDone = qq.filter((x) => x.status === "已办结").length;
      const rate = qq.length ? Math.round((100 * qqDone) / qq.length) : 0;
      const items = [
        [yq.filter((x) => x.status === "待研判").length, "舆情待研判"],
        [yq.filter((x) => x.sentiment === "正面").length, "舆情正面"],
        [qq.filter((x) => x.status === "在办").length, "线索在办"],
        [rate + "%", "线索办结率"],
        [AQ_LOG_TOTAL.toLocaleString(), "漏洞隐患累计"],
        [aq.filter((x) => x.level === "中危").length, "中危规则命中"],
        [AQ_ONLINE_SESSIONS.toLocaleString(), "样本总量"],
        [highAqCount, "高危及以上"],
      ];
      podium.innerHTML = items
        .map(
          ([v, l]) =>
            `<div class="cp-podium"><span class="pv">${v}</span><span class="pl">${l}</span></div>`
        )
        .join("");
    }

    const rankBody = document.getElementById("cp-rank-yuqing-body");
    if (rankBody) {
      const agg = {};
      yqAll.forEach((r) => {
        if (!agg[r.ent]) agg[r.ent] = { n: 0, hi: 0 };
        agg[r.ent].n++;
        if (r.level === "高") agg[r.ent].hi++;
      });
      const rows = Object.entries(agg)
        .map(([ent, v]) => ({
          ent,
          score: v.n * 8 + v.hi * 22,
          hiPct: v.n ? Math.round((100 * v.hi) / v.n) : 0,
        }))
        .sort((a, b) => b.score - a.score);
      let list = !isPlatform() ? rows.filter((x) => x.ent === YUQING_FOCUS_ENT) : rows.slice(0, 8);
      if (!list.length && rows.length) list = [rows[0]];
      if (!list.length) list = [{ ent: "—", score: 0, hiPct: 0 }];
      rankBody.innerHTML = list
        .map(
          (r, i) =>
            `<tr><td>${i + 1}</td><td>${r.ent}</td><td>${r.score}</td><td>${r.hiPct}%</td></tr>`
        )
        .join("");
    }

    const aqRankBody = document.getElementById("cp-rank-aq-body");
    if (aqRankBody) {
      const aqRankSrc = aqAll.length ? aqAll : mockAnquan;
      const ag = {};
      aqRankSrc.forEach((r) => {
        if (!ag[r.ent]) ag[r.ent] = { n: 0, hi: 0 };
        ag[r.ent].n++;
        if (r.level === "高危" || r.level === "严重") ag[r.ent].hi++;
      });
      const ar = Object.entries(ag)
        .map(([ent, v]) => ({ ent, n: v.n, hi: v.hi }))
        .sort((a, b) => b.n - a.n);
      let list = !isPlatform() ? ar.filter((x) => x.ent === YUQING_FOCUS_ENT) : ar.slice(0, 8);
      if (!list.length && ar.length) list = [ar[0]];
      if (!list.length)
        list = [
          {
            ent: "（示意）" + YUQING_FOCUS_ENT,
            n: mockAnquan.filter((x) => x.ent === YUQING_FOCUS_ENT).length,
            hi: mockAnquan.filter((x) => x.ent === YUQING_FOCUS_ENT && (x.level === "高危" || x.level === "严重")).length,
          },
        ];
      aqRankBody.innerHTML = list
        .map(
          (r, i) =>
            `<tr><td>${i + 1}</td><td>${r.ent}</td><td>${r.n}</td><td>${r.hi}</td></tr>`
        )
        .join("");
    }

    const wc = document.getElementById("cp-wordcloud");
    if (wc) {
      const words = [
        "品牌", "售后", "直播", "专利", "假冒", "环保", "补贴", "年报", "短视频", "出口", "舆情", "维权",
        "漏洞", "边界", "防火墙", "等保", "零信任", "探针", "加固", "会话", "处置",
      ];
      wc.innerHTML = words
        .map((w, i) => `<span class="w${(i % 3) + 1}">${w}</span>`)
        .join("");
    }

    const capP = document.getElementById("cp-aq-cap-pills");
    if (capP) {
      const aqP = aqAll.length ? aqAll : mockAnquan;
      const nDrop = aqP.filter((x) => x.action === "丢弃").length;
      const nMid = aqP.filter((x) => x.level === "中危").length;
      capP.innerHTML = `
        <span class="pill-aq"><strong>类型TOP1</strong> ${AQ_APP_TRAFFIC_LABELS[0] || "—"}</span>
        <span class="pill-aq"><strong>类型TOP2</strong> ${AQ_APP_TRAFFIC_LABELS[1] || "—"}</span>
        <span class="pill-aq"><strong>隐患累计</strong> ${AQ_LOG_TOTAL.toLocaleString()} 条</span>
        <span class="pill-aq"><strong>强度指数A</strong> ${AQ_RT_MBPS.recv}</span>
        <span class="pill-aq"><strong>强度指数B</strong> ${AQ_RT_MBPS.send}</span>
        <span class="pill-aq"><strong>当前样本</strong>丢弃 ${nDrop} · 中危 ${nMid}</span>`;
    }

    const hm = document.getElementById("cp-heatmap");
    if (hm) {
      const regs = ["浙", "苏", "皖", "沪", "闽", "赣"];
      const heat = [0.9, 0.75, 0.5, 0.85, 0.45, 0.55];
      hm.innerHTML = regs
        .map(
          (r, i) =>
            `<div class="cell" style="background:rgba(56,189,248,${heat[i]})">${r}</div>`
        )
        .join("");
    }

    const st = document.getElementById("cp-status-icons");
    if (st) {
      const qqSt = qq.length ? qq : mockQinquan;
      const yqAct = yq.filter((x) => x.status === "待研判" || x.status === "处置中" || x.status === "监测中").length;
      const yqDone = yq.filter((x) => x.status === "已归档" || x.status === "已核实" || x.status === "已监测").length;
      st.innerHTML = `
        <div class="cp-sico"><span class="sn">${yq.length || 0}</span><span class="st">监测</span></div>
        <div class="cp-sico"><span class="sn">${yqAct + qqSt.filter((x) => x.status === "在办").length}</span><span class="st">在办</span></div>
        <div class="cp-sico"><span class="sn">${yqDone + qqSt.filter((x) => x.status === "已办结").length}</span><span class="st">办结</span></div>`;
    }

    const log = document.getElementById("cp-scroll-log");
    if (log) {
      const lines = [
        `[${new Date().toTimeString().slice(0, 8)}] 边界防火墙 · 入侵防御特征库已最新`,
        `[${new Date().toTimeString().slice(0, 8)}] 流量监测 · 源地址会话 TOP10 刷新`,
        `[${new Date().toTimeString().slice(0, 8)}] 阿里线索平台 · 新增 2 条同步`,
        `[${new Date().toTimeString().slice(0, 8)}] 安全日志 · 累计 ${AQ_LOG_TOTAL.toLocaleString()} 条`,
      ];
      log.innerHTML = lines.map((l) => `<div class="log-line">${l}</div>`).join("");
    }

    requestAnimationFrame(() => renderHomeCharts());
  }

  function tagSrc(label) {
    if (label === "网信办") return '<span class="tag tag-src-wxb">网信办</span>';
    if (label === "企业补充" || label.includes("企业")) return '<span class="tag tag-src-ent">企业</span>';
    if (label.includes("阿里")) return '<span class="tag tag-src-ali">阿里线索</span>';
    if (label === "边界防火墙") return '<span class="tag tag-src-wxb">边界防火墙</span>';
    return '<span class="tag tag-src-wxb">' + label + "</span>";
  }

  function renderYuqingTable() {
    const tb = document.querySelector("#table-yuqing tbody");
    const rows = getFilteredYuqing();
    tb.innerHTML = rows
      .map((r) => {
        const titleShort = (r.title || "").length > 36 ? (r.title || "").slice(0, 36) + "…" : r.title || "—";
        const sumShort = (r.summary || "").length > 48 ? (r.summary || "").slice(0, 48) + "…" : r.summary || "—";
        const sentCls = r.sentiment === "负面" ? "tag-lvl-high" : r.sentiment === "正面" ? "" : "";
        return `<tr data-module="yuqing" data-id="${r.id}">
        <td>${escapeHtml(r.time)}</td><td>${escapeHtml(r.ent)}</td><td title="${escapeHtml(r.title || "")}"><strong>${escapeHtml(titleShort)}</strong><br /><span style="color:var(--text-muted);font-size:0.78rem">${escapeHtml(sumShort)}</span></td>
        <td class="${sentCls}">${escapeHtml(r.sentiment || "—")}</td>
        <td>${escapeHtml(r.channel || "—")}</td>
        <td>${escapeHtml(r.src || "—")}</td>
        <td class="${r.level === "高" ? "tag-lvl-high" : ""}">${escapeHtml(r.level)}</td>
        <td>${escapeHtml(r.status)}</td></tr>`;
      })
      .join("");
    tb.querySelectorAll("tr").forEach((tr) => tr.addEventListener("click", () => openDrawerYuqing(tr.dataset.id)));
  }

  function renderQinquanTable() {
    const tb = document.querySelector("#table-qinquan tbody");
    const rows = getFilteredQinquan();
    tb.innerHTML = rows
      .map(
        (r) => `<tr data-module="qinquan" data-id="${r.id}">
        <td>${r.id}</td><td>${r.type}</td><td>${r.ent}</td><td>${r.summary}</td>
        <td>${tagSrc(r.src)}</td><td>${r.status}</td></tr>`
      )
      .join("");
    tb.querySelectorAll("tr").forEach((tr) => tr.addEventListener("click", () => openDrawerQinquan(tr.dataset.id)));
  }

  function aqLevelClass(lv) {
    return lv === "严重" || lv === "高危" ? "tag-lvl-high" : lv === "中危" ? "" : "";
  }

  function aqField(r, key, fallback = "—") {
    const raw = r && r._raw ? r._raw : null;
    const v = raw && Object.prototype.hasOwnProperty.call(raw, key) ? raw[key] : "";
    return v != null && String(v).trim() !== "" ? String(v) : fallback;
  }

  function renderAnquanTable() {
    const tb = document.querySelector("#table-anquan tbody");
    const hint = document.getElementById("aq-log-total-hint");
    if (hint) hint.textContent = String(AQ_LOG_TOTAL);
    const rows = getFilteredAnquan();
    const latest = rows.length ? rows : mockAnquan;
    const disp = AQ_LEGACY_ENABLED ? latest : latest;
    tb.innerHTML = disp
      .map(
        (r, i) => `<tr data-module="anquan" data-i="${i}">
        <td>${escapeHtml(aqField(r, "事件编号"))}</td>
        <td>${escapeHtml(aqField(r, "隐患发现时间", aqField(r, "发生时间")))}</td>
        <td>${escapeHtml(aqField(r, "单位名称", r.ent || "—"))}</td>
        <td class="${aqLevelClass(aqField(r, "隐患等级", r.level || "—"))}">${escapeHtml(aqField(r, "隐患等级", r.level || "—"))}</td>
        <td>${escapeHtml(aqField(r, "隐患类型", r.ruleType || "—"))}</td>
        <td title="${escapeHtml(aqField(r, "隐患描述", r.ruleName || "—"))}">${escapeHtml((aqField(r, "隐患描述", r.ruleName || "—")).length > 42 ? aqField(r, "隐患描述", r.ruleName || "—").slice(0, 42) + "…" : aqField(r, "隐患描述", r.ruleName || "—"))}</td>
        <td>${escapeHtml(aqField(r, "网站域名", aqField(r, "隐患域名url", r.dstIp || "—")))}</td>
        <td>${escapeHtml(aqField(r, "ip", r.srcIp || "—"))}</td>
        <td>${escapeHtml(aqField(r, "端口", r.srcPort || "—"))}</td>
        <td>${escapeHtml(aqField(r, "事件状态", r.action || "—"))}</td>
        <td>${escapeHtml(aqField(r, "事件来源", r.src || "—"))}</td>
        <td>${escapeHtml(aqField(r, "处置反馈时间"))}</td></tr>`
      )
      .join("");
    tb.querySelectorAll("tr").forEach((tr) => {
      tr.addEventListener("click", () => openDrawerAnquan(disp[parseInt(tr.dataset.i, 10)]));
    });
  }

  function renderYuqingSub() {
    destroySubCharts();
    if (typeof Chart === "undefined") return;
    applyChartTheme();
    const yq = getFilteredYuqing();

    const kWrap = document.getElementById("yq-sub-kpis");
    if (kWrap) {
      const nNeg = yq.filter((x) => x.sentiment === "负面").length;
      const nNeu = yq.filter((x) => x.sentiment === "中性").length;
      const nPos = yq.filter((x) => x.sentiment === "正面").length;
      kWrap.innerHTML = `
        <div class="sub-kpi"><div class="sv">${yq.length}</div><div class="sl">监测条数（表）</div></div>
        <div class="sub-kpi"><div class="sv">${nNeg}</div><div class="sl">负面</div></div>
        <div class="sub-kpi"><div class="sv">${nNeu}</div><div class="sl">中性</div></div>
        <div class="sub-kpi"><div class="sv">${nPos}</div><div class="sl">正面</div></div>`;
    }

    const yqYtd = monthAxis2026Ytd();
    const dYtd = aggregateVoiceByMonthKeys(yq, yqYtd.keys);
    const zPad = yqYtd.keys.map(() => 0);
    pushSubChart({
      id: "chart-yq-trend",
      config: {
        type: "line",
        data: {
          labels: yqYtd.labels,
          datasets: [
            {
              label: "声浪指数（粉丝加权）",
              data: dYtd.voice.length ? dYtd.voice : zPad,
              borderColor: "#38bdf8",
              backgroundColor: "rgba(56,189,248,0.12)",
              fill: true,
              tension: 0.35,
              yAxisID: "y",
            },
            {
              label: "映射高危条数",
              data: dYtd.high.length ? dYtd.high : zPad,
              borderColor: "#f87171",
              tension: 0.35,
              yAxisID: "y1",
            },
          ],
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          interaction: { mode: "index", intersect: false },
          plugins: { legend: { position: "bottom", labels: { boxWidth: 10, font: { size: 9 } } } },
          scales: {
            x: { grid: { color: "rgba(56,189,248,0.08)" }, ticks: { maxRotation: 0, font: { size: 9 } } },
            y: { beginAtZero: true, grid: { color: "rgba(56,189,248,0.08)" }, ticks: { font: { size: 9 } } },
            y1: { position: "right", beginAtZero: true, grid: { drawOnChartArea: false }, ticks: { stepSize: 1, font: { size: 8 } } },
          },
        },
      },
    });

    const srcSub = countByField(yq, (r) => (r.src || "").trim() || "未标注");
    const srcSubTop = topNMap(srcSub, 8, "其他");
    const donutPal = ["rgba(56,189,248,0.88)", "rgba(167,139,250,0.88)", "rgba(244,114,182,0.85)", "rgba(74,222,128,0.82)", "rgba(251,191,36,0.85)", "rgba(129,140,248,0.85)", "rgba(45,212,191,0.82)", "rgba(248,113,113,0.82)", "rgba(148,163,184,0.8)"];
    const nSrc = srcSubTop.labels.length;
    pushSubChart({
      id: "chart-yq-channel",
      config: {
        type: "doughnut",
        data: {
          labels: nSrc ? srcSubTop.labels : ["—"],
          datasets: [
            {
              data: nSrc ? srcSubTop.data : [1],
              backgroundColor: nSrc ? srcSubTop.labels.map((_, i) => donutPal[i % donutPal.length]) : [donutPal[0]],
            },
          ],
        },
        options: { responsive: true, maintainAspectRatio: false, plugins: { legend: { position: "right", labels: { font: { size: 8 } } } } },
      },
    });

    const lvH = yq.filter((x) => x.level === "高").length;
    const lvM = yq.filter((x) => x.level === "中").length;
    const lvL = yq.filter((x) => x.level === "低").length;
    pushSubChart({
      id: "chart-yq-level",
      config: {
        type: "bar",
        data: {
          labels: ["高", "中", "低"],
          datasets: [{ label: "件数", data: [lvH, lvM, lvL], backgroundColor: ["rgba(248,113,113,0.85)", "rgba(251,191,36,0.85)", "rgba(74,222,128,0.75)"], borderRadius: 6 }],
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          plugins: { legend: { display: false } },
          scales: {
            x: { grid: { display: false }, ticks: { font: { size: 10 } } },
            y: { beginAtZero: true, grid: { color: "rgba(56,189,248,0.08)" }, ticks: { stepSize: 1, font: { size: 9 } } },
          },
        },
      },
    });

    const stCount = {};
    yq.forEach((r) => {
      stCount[r.status] = (stCount[r.status] || 0) + 1;
    });
    const stLabs = Object.keys(stCount);
    pushSubChart({
      id: "chart-yq-status",
      config: {
        type: "bar",
        data: {
          labels: stLabs.length ? stLabs : ["—"],
          datasets: [{ data: stLabs.length ? stLabs.map((k) => stCount[k]) : [0], backgroundColor: "rgba(56,189,248,0.7)", borderRadius: 4 }],
        },
        options: {
          indexAxis: "y",
          responsive: true,
          maintainAspectRatio: false,
          plugins: { legend: { display: false } },
          scales: {
            x: { beginAtZero: true, grid: { color: "rgba(56,189,248,0.08)" }, ticks: { stepSize: 1, font: { size: 9 } } },
            y: { grid: { display: false }, ticks: { font: { size: 9 } } },
          },
        },
      },
    });

    const mediaMap = countByField(yq, (r) => (r.channel || "").trim() || "未标注");
    const mediaTop = topNMap(mediaMap, 12, "其他");
    pushSubChart({
      id: "chart-yq-media",
      config: {
        type: "bar",
        data: {
          labels: mediaTop.labels.length ? mediaTop.labels : ["—"],
          datasets: [{ label: "条数", data: mediaTop.data.length ? mediaTop.data : [0], backgroundColor: "rgba(167,139,250,0.72)", borderRadius: 4 }],
        },
        options: {
          indexAxis: "y",
          responsive: true,
          maintainAspectRatio: false,
          plugins: { legend: { display: false } },
          scales: {
            x: { beginAtZero: true, grid: { color: "rgba(56,189,248,0.08)" }, ticks: { stepSize: 1, font: { size: 9 } } },
            y: { grid: { display: false }, ticks: { font: { size: 8 } } },
          },
        },
      },
    });

    const cNeg = yq.filter((x) => x.sentiment === "负面").length;
    const cNeu = yq.filter((x) => x.sentiment === "中性").length;
    const cPos = yq.filter((x) => x.sentiment === "正面").length;
    pushSubChart({
      id: "chart-yq-sentiment",
      config: {
        type: "pie",
        data: {
          labels: ["负面", "中性", "正面"],
          datasets: [{ data: [cNeg || 0, cNeu || 0, cPos || 0], backgroundColor: ["rgba(248,113,113,0.85)", "rgba(251,191,36,0.8)", "rgba(74,222,128,0.75)"] }],
        },
        options: { responsive: true, maintainAspectRatio: false, plugins: { legend: { position: "bottom", labels: { font: { size: 9 } } } } },
      },
    });

    const pubMap = countByField(yq, (r) => (r.publisherType || "").trim() || "未标注");
    const pubTop = topNMap(pubMap, 12, "其他");
    pushSubChart({
      id: "chart-yq-publisher",
      config: {
        type: "bar",
        data: {
          labels: pubTop.labels.length ? pubTop.labels : ["—"],
          datasets: [{ label: "条数", data: pubTop.data.length ? pubTop.data : [0], backgroundColor: "rgba(56,189,248,0.7)", borderRadius: 4 }],
        },
        options: {
          indexAxis: "y",
          responsive: true,
          maintainAspectRatio: false,
          plugins: { legend: { display: false } },
          scales: {
            x: { beginAtZero: true, grid: { color: "rgba(56,189,248,0.08)" }, ticks: { stepSize: 1, font: { size: 9 } } },
            y: { grid: { display: false }, ticks: { font: { size: 8 } } },
          },
        },
      },
    });

    const regMap = countByField(yq, normPubRegion);
    const regTop = topNMap(regMap, 14, "其他");
    pushSubChart({
      id: "chart-yq-region",
      config: {
        type: "bar",
        data: {
          labels: regTop.labels.length ? regTop.labels : ["—"],
          datasets: [{ label: "条数", data: regTop.data.length ? regTop.data : [0], backgroundColor: "rgba(244,114,182,0.72)", borderRadius: 4 }],
        },
        options: {
          indexAxis: "y",
          responsive: true,
          maintainAspectRatio: false,
          plugins: { legend: { display: false } },
          scales: {
            x: { beginAtZero: true, grid: { color: "rgba(56,189,248,0.08)" }, ticks: { stepSize: 1, font: { size: 9 } } },
            y: { grid: { display: false }, ticks: { font: { size: 8 } } },
          },
        },
      },
    });

    const topicCount = {};
    const topicStop = new Set(["舆情", "企业", "信息", "用户", "平台", "关联", "转载"]);
    yq.forEach((r) => {
      const segs = (r.summary || "")
        .split(/[\s·、，。]+/)
        .map((s) => s.trim())
        .filter((s) => s.length >= 2);
      segs.forEach((w) => {
        if (!topicStop.has(w)) topicCount[w] = (topicCount[w] || 0) + 1;
      });
    });
    const topicTop = Object.entries(topicCount)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 8);
    pushSubChart({
      id: "chart-yq-topics",
      config: {
        type: "bar",
        data: {
          labels: topicTop.length ? topicTop.map((x) => x[0]) : ["—"],
          datasets: [{ label: "出现次数", data: topicTop.length ? topicTop.map((x) => x[1]) : [0], backgroundColor: "rgba(56,189,248,0.72)", borderRadius: 4 }],
        },
        options: {
          indexAxis: "y",
          responsive: true,
          maintainAspectRatio: false,
          plugins: { legend: { display: false } },
          scales: {
            x: { beginAtZero: true, grid: { color: "rgba(56,189,248,0.08)" }, ticks: { stepSize: 1, font: { size: 9 } } },
            y: { grid: { display: false }, ticks: { font: { size: 9 } } },
          },
        },
      },
    });
  }

  function renderQinquanSub() {
    destroySubCharts();
    if (typeof Chart === "undefined") return;
    applyChartTheme();
    const qq = getFilteredQinquan();

    const kWrap = document.getElementById("qq-sub-kpis");
    if (kWrap) {
      const nDo = qq.filter((x) => x.status === "在办").length;
      const nDone = qq.filter((x) => x.status === "已办结").length;
      const nAli = qq.filter((x) => (x.src || "").includes("阿里")).length;
      kWrap.innerHTML = `
        <div class="sub-kpi"><div class="sv">${qq.length}</div><div class="sl">线索合计</div></div>
        <div class="sub-kpi"><div class="sv">${nDo}</div><div class="sl">在办</div></div>
        <div class="sub-kpi"><div class="sv">${nDone}</div><div class="sl">已办结</div></div>
        <div class="sub-kpi"><div class="sv">${nAli}</div><div class="sl">平台同步</div></div>`;
    }

    let nAli = 0;
    let nEnt = 0;
    qq.forEach((r) => {
      if ((r.src || "").includes("阿里")) nAli++;
      else nEnt++;
    });
    pushSubChart({
      id: "chart-qq-source",
      config: {
        type: "pie",
        data: {
          labels: ["阿里线索平台", "企业自有/其他"],
          datasets: [{ data: [Math.max(nAli, 0.01), Math.max(nEnt, 0.01)], backgroundColor: ["rgba(56,189,248,0.85)", "rgba(167,139,250,0.85)"] }],
        },
        options: { responsive: true, maintainAspectRatio: false, plugins: { legend: { position: "bottom", labels: { font: { size: 9 } } } } },
      },
    });

    const typCount = {};
    qq.forEach((r) => {
      typCount[r.type] = (typCount[r.type] || 0) + 1;
    });
    const typLabs = Object.keys(typCount);
    pushSubChart({
      id: "chart-qq-type",
      config: {
        type: "bar",
        data: {
          labels: typLabs.length ? typLabs : ["—"],
          datasets: [{ data: typLabs.length ? typLabs.map((k) => typCount[k]) : [0], backgroundColor: "rgba(244,114,182,0.75)", borderRadius: 4 }],
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          plugins: { legend: { display: false } },
          scales: {
            x: { grid: { display: false }, ticks: { font: { size: 9 } } },
            y: { beginAtZero: true, grid: { color: "rgba(56,189,248,0.08)" }, ticks: { stepSize: 1, font: { size: 9 } } },
          },
        },
      },
    });

    const funnelLabs = ["发现登记", "证据固定", "协查处置", "办结闭环"];
    const funnelVal = [
      qq.length + 6,
      Math.max(qq.length, 1) + 3,
      qq.filter((x) => x.status === "在办").length + 2,
      qq.filter((x) => x.status === "已办结").length,
    ];
    pushSubChart({
      id: "chart-qq-funnel",
      config: {
        type: "bar",
        data: {
          labels: funnelLabs,
          datasets: [
            {
              label: "件",
              data: funnelVal,
              backgroundColor: ["rgba(167,139,250,0.9)", "rgba(129,140,248,0.85)", "rgba(56,189,248,0.85)", "rgba(74,222,128,0.8)"],
              borderRadius: 6,
            },
          ],
        },
        options: {
          indexAxis: "y",
          responsive: true,
          maintainAspectRatio: false,
          plugins: { legend: { display: false } },
          scales: {
            x: { beginAtZero: true, grid: { color: "rgba(56,189,248,0.08)" }, ticks: { font: { size: 9 } } },
            y: { grid: { display: false }, ticks: { font: { size: 9 } } },
          },
        },
      },
    });

    const platCount = {};
    qq.forEach((r) => {
      const p = r.platform || "其他";
      platCount[p] = (platCount[p] || 0) + 1;
    });
    const platLabs = Object.keys(platCount);
    pushSubChart({
      id: "chart-qq-platform",
      config: {
        type: "bar",
        data: {
          labels: platLabs.length ? platLabs : ["—"],
          datasets: [{ data: platLabs.length ? platLabs.map((k) => platCount[k]) : [0], backgroundColor: "rgba(129,140,248,0.7)", borderRadius: 4 }],
        },
        options: {
          indexAxis: "y",
          responsive: true,
          maintainAspectRatio: false,
          plugins: { legend: { display: false } },
          scales: {
            x: { beginAtZero: true, grid: { color: "rgba(56,189,248,0.08)" }, ticks: { stepSize: 1, font: { size: 9 } } },
            y: { grid: { display: false }, ticks: { font: { size: 8 } } },
          },
        },
      },
    });

    const m12q = monthLabels12();
    pushSubChart({
      id: "chart-qq-m12",
      config: {
        type: "line",
        data: {
          labels: m12q,
          datasets: [
            { label: "新增线索", data: synthSeries12(qq.length + 6), borderColor: "#a78bfa", backgroundColor: "rgba(167,139,250,0.12)", fill: true, tension: 0.35 },
            { label: "在办存量", data: synthSeries12(qq.filter((x) => x.status === "在办").length + 5), borderColor: "#38bdf8", tension: 0.35 },
          ],
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          interaction: { mode: "index", intersect: false },
          plugins: { legend: { position: "bottom", labels: { boxWidth: 10, font: { size: 9 } } } },
          scales: {
            x: { grid: { color: "rgba(56,189,248,0.08)" }, ticks: { font: { size: 9 } } },
            y: { beginAtZero: true, grid: { color: "rgba(56,189,248,0.08)" }, ticks: { font: { size: 9 } } },
          },
        },
      },
    });

    const qDo = qq.filter((x) => x.status === "在办").length;
    const qDn = qq.filter((x) => x.status === "已办结").length;
    pushSubChart({
      id: "chart-qq-status-donut",
      config: {
        type: "doughnut",
        data: {
          labels: ["在办", "已办结"],
          datasets: [{ data: [Math.max(qDo, 0.01), Math.max(qDn, 0.01)], backgroundColor: ["rgba(251,191,36,0.85)", "rgba(74,222,128,0.8)"] }],
        },
        options: { responsive: true, maintainAspectRatio: false, plugins: { legend: { position: "bottom", labels: { font: { size: 9 } } } } },
      },
    });

    const entQ = {};
    qq.forEach((r) => {
      entQ[r.ent] = (entQ[r.ent] || 0) + 1;
    });
    const entQtop = Object.entries(entQ)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 8);
    pushSubChart({
      id: "chart-qq-ent-bar",
      config: {
        type: "bar",
        data: {
          labels: entQtop.length ? entQtop.map((x) => x[0]) : ["—"],
          datasets: [{ data: entQtop.length ? entQtop.map((x) => x[1]) : [0], backgroundColor: "rgba(244,114,182,0.7)", borderRadius: 4 }],
        },
        options: {
          indexAxis: "y",
          responsive: true,
          maintainAspectRatio: false,
          plugins: { legend: { display: false } },
          scales: {
            x: { beginAtZero: true, grid: { color: "rgba(56,189,248,0.08)" }, ticks: { stepSize: 1, font: { size: 9 } } },
            y: { grid: { display: false }, ticks: { font: { size: 9 } } },
          },
        },
      },
    });

    const typesU = [...new Set(qq.map((r) => r.type))];
    const dIng = typesU.map((t) => qq.filter((r) => r.type === t && r.status === "在办").length);
    const dDone = typesU.map((t) => qq.filter((r) => r.type === t && r.status === "已办结").length);
    pushSubChart({
      id: "chart-qq-matrix",
      config: {
        type: "bar",
        data: {
          labels: typesU.length ? typesU : ["—"],
          datasets: [
            { label: "在办", data: typesU.length ? dIng : [0], backgroundColor: "rgba(251,191,36,0.85)", stack: "s" },
            { label: "已办结", data: typesU.length ? dDone : [0], backgroundColor: "rgba(74,222,128,0.8)", stack: "s" },
          ],
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          plugins: { legend: { position: "top", labels: { boxWidth: 10, font: { size: 9 } } } },
          scales: {
            x: { stacked: true, grid: { display: false }, ticks: { font: { size: 9 } } },
            y: { stacked: true, beginAtZero: true, grid: { color: "rgba(56,189,248,0.08)" }, ticks: { stepSize: 1, font: { size: 9 } } },
          },
        },
      },
    });

    const isOnlineCh = (p) => {
      const s = (p || "").trim();
      if (!s) return true;
      return !/线下|门店|展会|实地|仓储/i.test(s);
    };
    let nOnl = 0;
    let nOff = 0;
    qq.forEach((r) => {
      if (isOnlineCh(r.platform)) nOnl++;
      else nOff++;
    });
    pushSubChart({
      id: "chart-qq-ch-online",
      config: {
        type: "doughnut",
        data: {
          labels: ["线上渠道", "线下/实地"],
          datasets: [{ data: [Math.max(nOnl, 0.01), Math.max(nOff, 0.01)], backgroundColor: ["rgba(56,189,248,0.85)", "rgba(251,191,36,0.82)"] }],
        },
        options: { responsive: true, maintainAspectRatio: false, plugins: { legend: { position: "bottom", labels: { font: { size: 9 } } } } },
      },
    });
  }

  function renderAnquanSub() {
    const secAq = document.getElementById("bs-anquan");
    if (!secAq || secAq.classList.contains("hidden")) return;
    destroySubCharts();
    if (typeof Chart === "undefined") return;
    applyChartTheme();
    const aq = getFilteredAnquan();
    const aqChart = aq.length ? aq : mockAnquan;

    const k2 = document.getElementById("aq-sub-kpis");
    if (k2) {
      k2.innerHTML = `
        <div class="sub-kpi"><div class="sv">${aq.length}</div><div class="sl">当前列表隐患</div></div>
        <div class="sub-kpi"><div class="sv">${aq.filter((x) => x.level === "中危").length}</div><div class="sl">中危</div></div>
        <div class="sub-kpi"><div class="sv">${aq.filter((x) => x.action === "丢弃").length}</div><div class="sl">丢弃</div></div>
        <div class="sub-kpi"><div class="sv">${AQ_ONLINE_SESSIONS.toLocaleString()}</div><div class="sl">隐患总数（样本）</div></div>`;
    }

    const thLabs = ["严重", "高危", "中危", "低危"];
    const thData = thLabs.map((k) => Number(AQ_THREAT_STATS[k]) || 0);
    const miniThreat = document.getElementById("aq-threat-mini");
    if (miniThreat) {
      miniThreat.innerHTML = thLabs.map((k, i) => `<span>${k}<strong>${thData[i]}</strong></span>`).join("");
    }
    pushSubChart({
      id: "chart-aq-level",
      config: {
        type: "bar",
        data: {
          labels: thLabs,
          datasets: [
            {
              label: "威胁计数",
              data: thData,
              backgroundColor: ["rgba(127,29,29,0.82)", "rgba(248,113,113,0.88)", "rgba(251,191,36,0.88)", "rgba(74,222,128,0.82)"],
              borderColor: ["rgba(127,29,29,0.95)", "rgba(248,113,113,1)", "rgba(251,191,36,1)", "rgba(74,222,128,0.95)"],
              borderWidth: 1,
              borderRadius: 4,
              borderSkipped: false,
            },
          ],
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          layout: { padding: { top: 4, bottom: 0, left: 0, right: 4 } },
          plugins: {
            legend: { display: false },
            tooltip: { enabled: true },
          },
          scales: {
            x: {
              type: "category",
              grid: { display: false },
              ticks: { font: { size: 10 }, maxRotation: 0 },
            },
            y: {
              type: "linear",
              beginAtZero: true,
              grid: { color: "rgba(56,189,248,0.08)" },
              ticks: { stepSize: 1, font: { size: 9 } },
            },
          },
        },
      },
    });

    pushSubChart({
      id: "chart-aq-cat",
      config: {
        type: "doughnut",
        data: {
          labels: AQ_APP_TRAFFIC_LABELS,
          datasets: [{ data: AQ_APP_TRAFFIC_MB, backgroundColor: ["rgba(56,189,248,0.88)", "rgba(74,222,128,0.85)", "rgba(251,191,36,0.85)", "rgba(248,113,113,0.75)"] }],
        },
        options: { responsive: true, maintainAspectRatio: false, plugins: { legend: { position: "bottom", labels: { font: { size: 8 } } } } },
      },
    });

    const sessIps = AQ_TRAFFIC_TOP10.map((r) => r.ip.replace(/(\d+\.\d+\.\d+)\.(\d+)/, "$1.*"));
    const sessVals = AQ_TRAFFIC_TOP10.map((r) => r.sess);
    pushSubChart({
      id: "chart-aq-kind",
      config: {
        type: "bar",
        data: {
          labels: sessIps,
          datasets: [{ label: "条数", data: sessVals, backgroundColor: "rgba(56,189,248,0.75)", borderRadius: 2 }],
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          plugins: { legend: { display: false } },
          scales: {
            x: { grid: { display: false }, ticks: { maxRotation: 50, minRotation: 40, font: { size: 7 } } },
            y: { beginAtZero: true, grid: { color: "rgba(56,189,248,0.08)" }, ticks: { font: { size: 9 } } },
          },
        },
      },
    });

    const rankTitle = document.getElementById("chart-aq-rank-title");
    if (rankTitle) rankTitle.textContent = "隐患目标 TOP10（出现条数 · 与表一致）";
    pushSubChart({
      id: "chart-aq-rank",
      config: {
        type: "bar",
        data: {
          labels: AQ_TRAFFIC_TOP10.map((r) => r.ip),
          datasets: [{ label: "条数", data: AQ_TRAFFIC_TOP10_MB, backgroundColor: "rgba(167,139,250,0.8)", borderRadius: 4 }],
        },
        options: {
          indexAxis: "y",
          responsive: true,
          maintainAspectRatio: false,
          plugins: { legend: { display: false } },
          scales: {
            x: { beginAtZero: true, grid: { color: "rgba(56,189,248,0.08)" }, ticks: { font: { size: 9 } } },
            y: { grid: { display: false }, ticks: { font: { size: 8 } } },
          },
        },
      },
    });

    const rtLabs2 = ["16:57", "16:58", "16:59", "17:00", "17:01"];
    pushSubChart({
      id: "chart-aq-trend",
      config: {
        type: "line",
        data: {
          labels: rtLabs2,
          datasets: [
            {
              label: "隐患条数（归一）",
              data: [12.5, 22.4, 28.1, 35.2, AQ_RT_MBPS.recv],
              borderColor: "#38bdf8",
              backgroundColor: "rgba(56,189,248,0.1)",
              fill: true,
              tension: 0.35,
            },
            { label: "高危强度（归一）", data: [18.2, 32.6, 41.0, 52.3, AQ_RT_MBPS.send], borderColor: "#4ade80", tension: 0.35 },
          ],
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          interaction: { mode: "index", intersect: false },
          plugins: { legend: { position: "bottom", labels: { boxWidth: 10, font: { size: 9 } } } },
          scales: {
            x: { grid: { color: "rgba(56,189,248,0.08)" }, ticks: { font: { size: 9 } } },
            y: { beginAtZero: true, grid: { color: "rgba(56,189,248,0.08)" }, ticks: { font: { size: 9 } } },
          },
        },
      },
    });

    const yqRef = filterByRole(mockYuqing, "ent", YUQING_FOCUS_ENT);
    const aqRef = filterByRole(mockAnquan, "ent");
    const rLab = ["规则覆盖", "会话可见", "流量解析", "漏洞治理", "响应时效"];
    const nAr = aqRef.length;
    const rvSub = [
      Math.min(100, 56 + nAr * 3),
      Math.min(100, 52 + Math.round(AQ_ONLINE_SESSIONS / 800)),
      Math.min(100, 70 + Math.round(AQ_APP_TRAFFIC_MB[0] / 800)),
      Math.min(100, 48 + nAr * 4),
      Math.min(100, 62 + Math.round(yqRef.length * 1.2)),
    ];
    pushSubChart({
      id: "chart-aq-sub-radar",
      config: {
        type: "radar",
        data: {
          labels: rLab,
          datasets: [
            {
              label: isPlatform() ? "全县综合" : "本企业",
              data: rvSub,
              borderColor: "#38bdf8",
              backgroundColor: "rgba(56,189,248,0.2)",
              pointBackgroundColor: "#7dd3fc",
            },
          ],
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          plugins: { legend: { display: false } },
          scales: {
            r: {
              min: 0,
              max: 100,
              ticks: { stepSize: 25, backdropColor: "transparent", font: { size: 8 } },
              grid: { color: "rgba(56,189,248,0.12)" },
              pointLabels: { font: { size: 9 } },
            },
          },
        },
      },
    });

    const entList = [...new Set(aqChart.map((r) => r.ent))];
    const c1 = entList.map((e) => aqChart.filter((r) => r.ent === e && r.level === "严重").length);
    const c2 = entList.map((e) => aqChart.filter((r) => r.ent === e && r.level === "高危").length);
    const c3 = entList.map((e) => aqChart.filter((r) => r.ent === e && r.level === "中危").length);
    const c4 = entList.map((e) => aqChart.filter((r) => r.ent === e && r.level === "低危").length);
    pushSubChart({
      id: "chart-aq-ent-stack",
      config: {
        type: "bar",
        data: {
          labels: entList.length ? entList : ["—"],
          datasets: [
            { label: "严重", data: entList.length ? c1 : [0], backgroundColor: "rgba(127,29,29,0.88)", stack: "z" },
            { label: "高危", data: entList.length ? c2 : [0], backgroundColor: "rgba(248,113,113,0.85)", stack: "z" },
            { label: "中危", data: entList.length ? c3 : [0], backgroundColor: "rgba(251,191,36,0.85)", stack: "z" },
            { label: "低危", data: entList.length ? c4 : [0], backgroundColor: "rgba(74,222,128,0.75)", stack: "z" },
          ],
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          plugins: { legend: { position: "top", labels: { boxWidth: 10, font: { size: 9 } } } },
          scales: {
            x: { stacked: true, grid: { display: false }, ticks: { font: { size: 9 } } },
            y: { stacked: true, beginAtZero: true, grid: { color: "rgba(56,189,248,0.08)" }, ticks: { stepSize: 1, font: { size: 9 } } },
          },
        },
      },
    });

    const ruleTypeCount = {};
    aqChart.forEach((r) => {
      const t = r.ruleType || "—";
      ruleTypeCount[t] = (ruleTypeCount[t] || 0) + 1;
    });
    const rtKeys = Object.keys(ruleTypeCount);
    pushSubChart({
      id: "chart-aq-kind-src",
      config: {
        type: "bar",
        data: {
          labels: rtKeys.length ? rtKeys : ["—"],
          datasets: [{ data: rtKeys.length ? rtKeys.map((k) => ruleTypeCount[k]) : [0], backgroundColor: "rgba(56,189,248,0.78)", borderRadius: 4 }],
        },
        options: {
          indexAxis: "y",
          responsive: true,
          maintainAspectRatio: false,
          plugins: { legend: { display: false } },
          scales: {
            x: { beginAtZero: true, grid: { color: "rgba(56,189,248,0.08)" }, ticks: { stepSize: 1, font: { size: 9 } } },
            y: { grid: { display: false }, ticks: { font: { size: 9 } } },
          },
        },
      },
    });

    const actCount = {};
    aqChart.forEach((r) => {
      const a = r.action || "—";
      actCount[a] = (actCount[a] || 0) + 1;
    });
    const aKeys = Object.keys(actCount);
    const actColors = ["rgba(248,113,113,0.82)", "rgba(251,191,36,0.82)", "rgba(74,222,128,0.78)"];
    pushSubChart({
      id: "chart-aq-sla-bar",
      config: {
        type: "bar",
        data: {
          labels: aKeys.length ? aKeys : ["—"],
          datasets: [
            {
              label: "条数",
              data: aKeys.length ? aKeys.map((k) => actCount[k]) : [0],
              backgroundColor: aKeys.map((_, i) => actColors[i % actColors.length]),
              borderRadius: 4,
            },
          ],
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          plugins: { legend: { display: false } },
          scales: {
            x: { grid: { display: false }, ticks: { font: { size: 9 } } },
            y: { beginAtZero: true, grid: { color: "rgba(56,189,248,0.08)" }, ticks: { stepSize: 1, font: { size: 9 } } },
          },
        },
      },
    });
  }

  function renderAnquanKpis() {
    const el = document.getElementById("anquan-kpi-bar");
    if (!el) return;
    el.style.display = "grid";
    el.innerHTML = `
      <div class="kpi"><div class="val">${AQ_THREAT_STATS.严重}</div><div class="lbl">威胁·严重</div></div>
      <div class="kpi"><div class="val">${AQ_THREAT_STATS.高危}</div><div class="lbl">威胁·高危</div></div>
      <div class="kpi"><div class="val">${AQ_THREAT_STATS.中危}</div><div class="lbl">威胁·中危</div></div>
      <div class="kpi"><div class="val">${AQ_THREAT_STATS.低危}</div><div class="lbl">威胁·低危</div></div>
      <div class="kpi"><div class="val">${AQ_LOG_TOTAL.toLocaleString()}</div><div class="lbl">隐患累计</div></div>
      <div class="kpi"><div class="val">${AQ_ONLINE_SESSIONS.toLocaleString()}</div><div class="lbl">样本总量</div></div>`;
  }

  function openDrawerYuqing(id) {
    const r = mockYuqing.find((x) => String(x.id) === String(id));
    if (!r) return;
    document.getElementById("drawerTitle").textContent = "舆情详情 · 三级穿透（表格原始字段）";
    const url = r.url ? `<a href="${escapeHtml(r.url)}" target="_blank" rel="noopener noreferrer">${escapeHtml(r.url)}</a>` : "—";
    document.getElementById("drawerBody").innerHTML = `
      <div class="detail-field"><div class="k">标题</div><div class="v">${escapeHtml(r.title)}</div></div>
      <div class="detail-field"><div class="k">摘要</div><div class="v">${escapeHtml(r.summary)}</div></div>
      <div class="detail-field"><div class="k">发布时间</div><div class="v">${escapeHtml(r.time)}</div></div>
      <div class="detail-field"><div class="k">主体 / 关键词</div><div class="v">${escapeHtml(r.ent)} · ${escapeHtml(r.keywords || "")}</div></div>
      <div class="detail-field"><div class="k">倾向性（表）</div><div class="v">${escapeHtml(r.sentiment || "—")}</div></div>
      <div class="detail-field"><div class="k">大屏映射级别 / 研判状态</div><div class="v">${escapeHtml(r.level)} · ${escapeHtml(r.status)}</div></div>
      <div class="detail-field"><div class="k">媒体类型</div><div class="v">${escapeHtml(r.channel || "—")}</div></div>
      <div class="detail-field"><div class="k">来源网站</div><div class="v">${escapeHtml(r.src || "—")}</div></div>
      <div class="detail-field"><div class="k">作者 / 地域 / 发布者性质</div><div class="v">${escapeHtml(r.author || "—")} · ${escapeHtml(r.region || "—")} · ${escapeHtml(r.publisherType || "—")}</div></div>
      <div class="detail-field"><div class="k">阅读 / 评论 / 转发 / 点赞 / 粉丝</div><div class="v">${escapeHtml(r.reads)} / ${escapeHtml(r.comments)} / ${escapeHtml(r.reposts)} / ${escapeHtml(r.likes)} / ${escapeHtml(r.fans)}</div></div>
      <div class="detail-field"><div class="k">文章类型</div><div class="v">${escapeHtml(r.articleType || "—")}</div></div>
      <div class="detail-field"><div class="k">原文 URL</div><div class="v">${url}</div></div>
      <div class="detail-field"><div class="k">时间线</div><div class="v timeline">
        <div class="timeline-item"><div class="t">${escapeHtml(r.time)}</div><div class="c">监测入库（与表发布时间一致）</div></div>
        <div class="timeline-item"><div class="t">—</div><div class="c">后续研判处置（业务流转 · 示意）</div></div>
      </div></div>`;
    document.getElementById("drawerOverlay").classList.add("open");
  }

  function openDrawerQinquan(id) {
    const r = mockQinquan.find((x) => x.id === id);
    if (!r) return;
    document.getElementById("drawerTitle").textContent = "侵权线索详情 · 三级穿透";
    document.getElementById("drawerBody").innerHTML = `
      <div class="detail-field"><div class="k">编号</div><div class="v">${r.id}</div></div>
      <div class="detail-field"><div class="k">类型 / 权利企业</div><div class="v">${r.type} · ${r.ent}</div></div>
      <div class="detail-field"><div class="k">事实摘要</div><div class="v">${r.summary}</div></div>
      <div class="detail-field"><div class="k">来源</div><div class="v">${tagSrc(r.src)}</div></div>
      <div class="detail-field"><div class="k">办理节点</div><div class="v timeline">
        <div class="timeline-item"><div class="t">登记</div><div class="c">线索进入平台</div></div>
        <div class="timeline-item"><div class="t">在办</div><div class="c">调查取证（示意）</div></div>
      </div></div>`;
    document.getElementById("drawerOverlay").classList.add("open");
  }

  function openDrawerAnquan(r) {
    document.getElementById("drawerTitle").textContent = "漏洞隐患详情 · 全字段";
    const raw = r && r._raw ? r._raw : {};
    const keys = Object.keys(raw);
    const rows = keys.length
      ? keys
          .map(
            (k) =>
              `<div class="detail-field"><div class="k">${escapeHtml(k)}</div><div class="v">${escapeHtml(
                raw[k] == null || String(raw[k]).trim() === "" ? "—" : String(raw[k])
              )}</div></div>`
          )
          .join("")
      : `<div class="detail-field"><div class="k">提示</div><div class="v">该记录缺少原始字段，请检查数据源。</div></div>`;
    document.getElementById("drawerBody").innerHTML =
      rows +
      `<div class="detail-field"><div class="k">数据口径</div><div class="v">当前列表及详情均来自长兴隐患数据汇总表（最新导入）</div></div>`;
    document.getElementById("drawerOverlay").classList.add("open");
  }

  function showBigscreenPage(page) {
    destroySubCharts();
    ["bs-home", "bs-yuqing", "bs-qinquan", "bs-anquan"].forEach((id) => {
      document.getElementById(id).classList.toggle("hidden", id !== "bs-" + page);
    });
    document.querySelectorAll("#cockpitDock button").forEach((b) => {
      const home = b.getAttribute("data-nav") === "home";
      b.classList.toggle("dock-active", (page === "home" && home) || (!home && b.getAttribute("data-go") === page));
    });
    document.querySelectorAll("#cockpitSubnav button").forEach((b) => {
      const ov = b.getAttribute("data-cockpit-tab") === "overview";
      b.classList.toggle("active", (page === "home" && ov) || b.getAttribute("data-go") === page);
    });
    if (page === "home") renderHomeKpis();
    if (page === "yuqing") {
      renderYuqingTable();
      renderYuqingSub();
    }
    if (page === "qinquan") {
      renderQinquanTable();
      renderQinquanSub();
    }
    if (page === "anquan") {
      renderAnquanKpis();
      renderAnquanTable();
      /** 二级页刚 display:block 时若同步 new Chart，画布常为 0 高导致「空白」；延后到布局后再绘 */
      requestAnimationFrame(() => {
        requestAnimationFrame(() => renderAnquanSub());
      });
    }
  }

  document.querySelectorAll("#cockpitSubnav [data-go], #cockpitDock [data-go]").forEach((el) => {
    el.addEventListener("click", () => showBigscreenPage(el.getAttribute("data-go")));
  });
  document.querySelectorAll('#cockpitSubnav button[data-cockpit-tab="overview"], #cockpitDock button[data-nav="home"]').forEach((el) => {
    el.addEventListener("click", () => showBigscreenPage("home"));
  });
  document.querySelectorAll("#cp-bar-tabs button").forEach((btn) => {
    btn.addEventListener("click", () => {
      document.querySelectorAll("#cp-bar-tabs button").forEach((b) => b.classList.remove("on"));
      btn.classList.add("on");
      cpBarMode = btn.getAttribute("data-cpbar") || "triple";
      renderHomeCharts();
    });
  });

  document.querySelectorAll("[data-nav='home']").forEach((a) => {
    a.addEventListener("click", () => showBigscreenPage("home"));
  });

  document.querySelectorAll(".breadcrumb a[data-nav='home']").forEach((a) => {
    a.addEventListener("click", (e) => {
      e.preventDefault();
      showBigscreenPage("home");
    });
  });

  let prdMarkdownRendered = false;
  function ensurePrdMarkdownRendered() {
    const article = document.getElementById("prd-article");
    const rawEl = document.getElementById("prd-md-embed");
    if (!article || !rawEl) return;
    if (prdMarkdownRendered) return;
    if (typeof marked === "undefined" || typeof marked.parse !== "function") {
      article.innerHTML = "<p>无法加载 Markdown 渲染库，请检查网络后刷新。</p>";
      return;
    }
    marked.setOptions({ breaks: true, gfm: true });
    article.innerHTML = marked.parse(rawEl.textContent.trim());
    prdMarkdownRendered = true;
  }

  document.querySelectorAll(".top-bar .nav-tabs button").forEach((btn) => {
    btn.addEventListener("click", () => {
      const mode = btn.dataset.switch;
      document.querySelectorAll(".top-bar .nav-tabs button").forEach((b) => b.classList.remove("active"));
      btn.classList.add("active");
      const bs = document.getElementById("view-bigscreen");
      const adm = document.getElementById("view-admin");
      const prd = document.getElementById("view-prd");
      if (mode === "bigscreen") {
        bs.classList.add("visible");
        adm.classList.remove("visible");
        prd.classList.remove("visible");
        topBar.classList.remove("admin-mode");
        roleSwitchWrap.style.visibility = "visible";
      } else if (mode === "admin") {
        bs.classList.remove("visible");
        adm.classList.add("visible");
        prd.classList.remove("visible");
        topBar.classList.add("admin-mode");
        roleSwitchWrap.style.visibility = "hidden";
      } else if (mode === "prd") {
        bs.classList.remove("visible");
        adm.classList.remove("visible");
        prd.classList.add("visible");
        topBar.classList.remove("admin-mode");
        roleSwitchWrap.style.visibility = "visible";
        ensurePrdMarkdownRendered();
      }
    });
  });

  roleSelect.addEventListener("change", () => {
    toggleEnterpriseFilters();
    fillEnterpriseSelects();
    fillYuqingSrcFilter();
    renderHomeKpis();
    if (!document.getElementById("bs-home").classList.contains("hidden")) return;
    if (!document.getElementById("bs-yuqing").classList.contains("hidden")) {
      renderYuqingTable();
      renderYuqingSub();
    }
    if (!document.getElementById("bs-qinquan").classList.contains("hidden")) {
      renderQinquanTable();
      renderQinquanSub();
    }
    if (!document.getElementById("bs-anquan").classList.contains("hidden")) {
      renderAnquanKpis();
      renderAnquanTable();
      renderAnquanSub();
    }
 });

  ["flt-yuqing-ent", "flt-yuqing-src", "flt-yuqing-time", "flt-qq-ent", "flt-qq-status", "flt-aq-ent", "flt-aq-tab"].forEach((id) => {
    const el = document.getElementById(id);
    if (!el) return;
    el.addEventListener("change", () => {
      if (id.startsWith("flt-yuqing")) {
        renderYuqingTable();
        renderYuqingSub();
      }
      if (id.startsWith("flt-qq")) {
        renderQinquanTable();
        renderQinquanSub();
      }
      if (id.startsWith("flt-aq")) {
        renderAnquanKpis();
        renderAnquanTable();
        renderAnquanSub();
      }
    });
  });

  document.getElementById("drawerClose").addEventListener("click", () => {
    document.getElementById("drawerOverlay").classList.remove("open");
  });
  document.getElementById("drawerOverlay").addEventListener("click", (e) => {
    if (e.target.id === "drawerOverlay") document.getElementById("drawerOverlay").classList.remove("open");
  });
  document.getElementById("drawerPanel").addEventListener("click", (e) => e.stopPropagation());

  function toggleEnterpriseFilters() {
    const show = isPlatform();
    document.querySelectorAll(".col-ent").forEach((th) => {
      th.style.display = show ? "" : "none";
    });
    document.querySelectorAll("#flt-yuqing-ent-wrap, #flt-qq-ent-wrap, #flt-aq-ent-wrap").forEach((w) => {
      w.style.display = show ? "" : "none";
    });
  }

  function initAdmin() {
    document.getElementById("adm-onboarding-body").innerHTML = `
      <tr><td>2026-04-10</td><td>某新能源材料有限公司</td><td>9133**********12</td><td>王某</td><td><span class="pill pill-pending">待审</span></td><td class="admin-actions"><button class="primary">通过</button><button>驳回</button></td></tr>
      <tr><td>2026-04-08</td><td>绿色动力</td><td>9133**********88</td><td>李某</td><td><span class="pill pill-ok">已通过</span></td><td class="admin-actions"><button>查看</button></td></tr>`;
    document.getElementById("adm-ent-body").innerHTML = enterprises
      .map(
        (e) =>
          `<tr><td>${e}</td><td>9133**********</td><td>备案域名 + IP段（示意）</td><td>正常</td><td class="admin-actions"><button>编辑</button></td></tr>`
      )
      .join("");
    document.getElementById("adm-acc-body").innerHTML = `
      <tr><td>admin</td><td>平台管理员</td><td>—</td><td>正常</td></tr>
      <tr><td>tn_energy</td><td>企业账号</td><td>天能能源</td><td>正常</td></tr>
      <tr><td>cw_group</td><td>企业账号</td><td>超威集团</td><td>正常</td></tr>`;
    document.getElementById("adm-audit-body").innerHTML = `
      <tr><td>2026-04-10 14:02</td><td>admin</td><td>审核通过入驻</td><td>绿色动力</td></tr>
      <tr><td>2026-04-10 09:11</td><td>admin</td><td>导出报表</td><td>侵权线索</td></tr>`;

    document.querySelectorAll(".admin-sidebar button").forEach((btn) => {
      btn.addEventListener("click", () => {
        document.querySelectorAll(".admin-sidebar button").forEach((b) => b.classList.remove("active"));
        btn.classList.add("active");
        const key = btn.dataset.admin;
        ["onboarding", "enterprises", "accounts", "audit"].forEach((k) => {
          document.getElementById("adm-" + k).classList.toggle("hidden", k !== key);
        });
      });
    });
  }

  fillEnterpriseSelects();
  fillYuqingSrcFilter();
  renderHomeKpis();
  toggleEnterpriseFilters();
  initAdmin();

})();
