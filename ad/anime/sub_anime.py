import json
import base64
import io
import urllib.request
import os
import sys
from PIL import Image

key = os.environ["OPENROUTER_API_KEY"]
name, img, dur, prompt = sys.argv[1], sys.argv[2], int(sys.argv[3]), sys.argv[4]
im = Image.open(img).convert("RGB").resize((720, 1280), Image.LANCZOS)
b = io.BytesIO()
im.save(b, "JPEG", quality=93)
style = " High-end cel-shaded TV anime style, bold linework, cinematic lighting, warm amber and gold grade, deep brown shadows. No on-screen text, no captions, no watermark."
body = {
    "model": "bytedance/seedance-2.5",
    "prompt": prompt + style,
    "size": "720x1280",
    "aspect_ratio": "9:16",
    "resolution": "720p",
    "duration": dur,
    "generate_audio": False,
    "frame_images": [
        {
            "type": "image_url",
            "image_url": {
                "url": "data:image/jpeg;base64,"
                + base64.b64encode(b.getvalue()).decode()
            },
            "frame_type": "first_frame",
        }
    ],
}
r = urllib.request.Request(
    "https://openrouter.ai/api/v1/videos",
    json.dumps(body).encode(),
    {"Authorization": "Bearer " + key, "Content-Type": "application/json"},
)
try:
    d = json.load(urllib.request.urlopen(r, timeout=300))
except urllib.error.HTTPError as e:
    print(f"Video submission failed: HTTP {e.code}", file=sys.stderr)
    sys.exit(1)
print(name, d)
json.dump(d, open(f"job_{name}.json", "w"))
