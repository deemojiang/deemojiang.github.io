"""Inject yuqing_from_xlsx.json into index.html as embed-mock-yuqing + loader."""
from __future__ import annotations

import json
from pathlib import Path

ROOT = Path(__file__).resolve().parent
html_path = ROOT / "index.html"
json_path = ROOT / "yuqing_from_xlsx.json"

def main() -> None:
    arr = json.loads(json_path.read_text(encoding="utf-8"))["mockYuqing"]
    payload = json.dumps(arr, ensure_ascii=False)
    embed = f'  <script type="application/json" id="embed-mock-yuqing">{payload}</script>\n'
    text = html_path.read_text(encoding="utf-8")
    needle = '  <script>\n(function () {'
    if needle not in text:
        raise SystemExit("needle not found")
    if "embed-mock-yuqing" not in text:
        text = text.replace(needle, embed + needle, 1)

    old = """  const mockYuqing = [
    { id: 1, time: "2026-04-10 09:12", ent: "天能能源", summary: "涉品牌表述争议 · 社交媒体", level: "高", src: "网信办", status: "处置中", channel: "短视频" },
    { id: 2, time: "2026-04-09 16:40", ent: "超威集团", summary: "行业报道引用数据存疑", level: "中", src: "网信办", status: "已核实", channel: "新闻" },
    { id: 3, time: "2026-04-09 11:05", ent: "天能能源", summary: "用户投诉售后服务 · 论坛", level: "中", src: "企业补充", status: "跟进中", channel: "论坛" },
    { id: 4, time: "2026-04-08 08:20", ent: "县投发展", summary: "项目环评信息转载", level: "低", src: "网信办", status: "已归档", channel: "新闻" },
    { id: 5, time: "2026-04-07 14:22", ent: "绿色动力", summary: "短视频平台误读政策", level: "中", src: "网信办", status: "处置中", channel: "短视频" },
    { id: 6, time: "2026-04-07 10:01", ent: "天能能源", summary: "微博话题关联竞品", level: "高", src: "网信办", status: "处置中", channel: "微博" },
    { id: 7, time: "2026-04-06 19:30", ent: "超威集团", summary: "社群传播不实参数", level: "中", src: "企业补充", status: "跟进中", channel: "社群" },
    { id: 8, time: "2026-04-06 09:15", ent: "县投发展", summary: "地方论坛质疑补贴", level: "低", src: "网信办", status: "已核实", channel: "论坛" },
    { id: 9, time: "2026-04-05 16:50", ent: "天能能源", summary: "头部账号转载旧闻", level: "高", src: "网信办", status: "跟进中", channel: "新闻" },
    { id: 10, time: "2026-04-05 11:20", ent: "绿色动力", summary: "直播带货口播争议", level: "中", src: "企业补充", status: "处置中", channel: "短视频" },
    { id: 11, time: "2026-04-04 08:40", ent: "超威集团", summary: "搜索引擎联想词异常", level: "低", src: "网信办", status: "已归档", channel: "其他" },
    { id: 12, time: "2026-04-03 21:10", ent: "天能能源", summary: "境外镜像转载", level: "中", src: "网信办", status: "已归档", channel: "新闻" },
    { id: 13, time: "2026-04-03 15:00", ent: "县投发展", summary: "招投标舆情波动", level: "低", src: "企业补充", status: "已核实", channel: "论坛" },
    { id: 14, time: "2026-04-02 13:25", ent: "绿色动力", summary: "环保组织公开信", level: "高", src: "网信办", status: "处置中", channel: "新闻" },
    { id: 15, time: "2026-04-01 09:00", ent: "超威集团", summary: "年报解读误读", level: "中", src: "网信办", status: "已归档", channel: "短视频" },
  ];
"""
    new = """  const mockYuqing = (function () {
    try {
      var el = document.getElementById("embed-mock-yuqing");
      if (el && el.textContent.trim()) return JSON.parse(el.textContent);
    } catch (err) {
      console.warn("embed-mock-yuqing", err);
    }
    return [];
  })();
"""
    if old not in text:
        raise SystemExit("mockYuqing block not found")
    text = text.replace(old, new, 1)
    html_path.write_text(text, encoding="utf-8")
    print("patched", html_path, "embed chars", len(payload))


if __name__ == "__main__":
    main()
