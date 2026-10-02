import sys
import json
import base64
import os
import urllib.request

# usage: img.py model out.png "prompt" [ref1.png ref2.png ...]
model, out, prompt, *refs = sys.argv[1:]
key = os.environ["OPENROUTER_API_KEY"]
content = [{"type": "text", "text": prompt}]
for r in refs:
    content.append(
        {
            "type": "image_url",
            "image_url": {
                "url": "data:image/png;base64,"
                + base64.b64encode(open(r, "rb").read()).decode()
            },
        }
    )
body = {
    "model": model,
    "messages": [{"role": "user", "content": content}],
    "modalities": ["image", "text"],
    "image_config": {"aspect_ratio": "9:16"},
}
req = urllib.request.Request(
    "https://openrouter.ai/api/v1/chat/completions",
    json.dumps(body).encode(),
    {"Authorization": "Bearer " + key, "Content-Type": "application/json"},
)
d = json.load(urllib.request.urlopen(req, timeout=300))
m = d["choices"][0]["message"]
imgs = m.get("images") or []
if not imgs:
    print(json.dumps(d)[:1500])
    sys.exit(1)
open(out, "wb").write(base64.b64decode(imgs[0]["image_url"]["url"].split(",", 1)[1]))
print("ok", out, d.get("usage", {}).get("cost"))
