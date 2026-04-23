import json
import re
from collections import Counter
from pathlib import Path

t = Path(__file__).with_name("index.html").read_text(encoding="utf-8")
m = re.search(r'id="embed-mock-yuqing">(.+?)</script>', t, re.DOTALL)
assert m, "embed not found"
arr = json.loads(m.group(1))
c = Counter(x.get("sentiment") for x in arr)
print("rows", len(arr), "sentiment", dict(c))
