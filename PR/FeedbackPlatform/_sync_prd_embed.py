"""将 README.md 写入 prd.html 内嵌块，便于 file:// 双击打开仍能显示需求文档。"""
import re
from pathlib import Path

here = Path(__file__).resolve().parent
readme = (here / "README.md").read_text(encoding="utf-8")
# 避免 </script> 截断 HTML（若正文将来出现该字样）
readme_safe = readme.replace("</script", r"<\/script")

block = (
    "<!-- PRD_EMBED_START -->\n"
    '<script type="text/plain" id="prd-md-embed">\n'
    + readme_safe.rstrip()
    + "\n</script>\n"
    "<!-- PRD_EMBED_END -->"
)

prd_path = here / "prd.html"
text = prd_path.read_text(encoding="utf-8")
pat = r"<!-- PRD_EMBED_START -->.*?<!-- PRD_EMBED_END -->"
if not re.search(pat, text, flags=re.DOTALL):
    raise SystemExit("prd.html 中未找到 PRD_EMBED 标记")
text_new, n = re.subn(pat, block, text, count=1, flags=re.DOTALL)
if n != 1:
    raise SystemExit("替换内嵌块失败")
prd_path.write_text(text_new, encoding="utf-8")
print("已内嵌 README.md → prd.html（", len(readme), "字符）")
