"""
从上级 PRD.md 生成内嵌块，并写回 prototype/index.html 中 id=prd-md-embed 的脚本内容。
用法：在 prototype 目录执行 python _gen_prd_snippet.py
"""
import re
from pathlib import Path

here = Path(__file__).resolve().parent
root = here.parent
md_path = here / "PRD.md"
if not md_path.is_file():
    md_path = root / "PRD.md"
md = md_path.read_text(encoding="utf-8")
block = '<script type="text/plain" id="prd-md-embed">\n' + md + "\n</script>"
(here / "_prd_snippet.html").write_text(block + "\n", encoding="utf-8")

idx = here / "index.html"
text = idx.read_text(encoding="utf-8")
pat = r'<script type="text/plain" id="prd-md-embed">[\s\S]*?</script>'
if not re.search(pat, text):
    raise SystemExit("index.html 中未找到 prd-md-embed，请手动检查")
text_new, n = re.subn(pat, block, text, count=1)
if n != 1:
    raise SystemExit("替换失败")
idx.write_text(text_new, encoding="utf-8")
print("已更新 index.html 内嵌 PRD，并写入 _prd_snippet.html 备份")
