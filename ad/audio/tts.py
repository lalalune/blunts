import sys
import json
import os
import urllib.request

out = sys.argv[1]
body = json.loads(sys.argv[2])
body.setdefault("response_format", "mp3")
r = urllib.request.Request(
    "https://openrouter.ai/api/v1/audio/speech",
    json.dumps(body).encode(),
    {
        "Authorization": "Bearer " + os.environ["OPENROUTER_API_KEY"],
        "Content-Type": "application/json",
    },
)
try:
    d = urllib.request.urlopen(r, timeout=300).read()
    open(out, "wb").write(d)
    print("ok", out, len(d))
except urllib.error.HTTPError as e:
    print(f"Speech generation failed: HTTP {e.code}", file=sys.stderr)
    sys.exit(1)
