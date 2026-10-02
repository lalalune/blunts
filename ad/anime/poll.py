import json
import os
import sys
import time
import urllib.request
import urllib.parse

key = os.environ["OPENROUTER_API_KEY"]
H = {"Authorization": "Bearer " + key}
pending = set(sys.argv[1:])
deadline = time.monotonic() + 1800
failed = False
while pending:
    if time.monotonic() > deadline:
        raise TimeoutError("Video polling timed out; rerun with the existing job files")
    for n in list(pending):
        url = json.load(open(f"job_{n}.json"))["polling_url"]
        parsed = urllib.parse.urlparse(url)
        if parsed.scheme != "https" or parsed.netloc != "openrouter.ai":
            raise ValueError("Refusing to send credentials to an untrusted polling URL")
        d = json.load(
            urllib.request.urlopen(urllib.request.Request(url, headers=H), timeout=60)
        )
        s = d.get("status")
        if s == "completed":
            u = d["unsigned_urls"][0]
            if urllib.parse.urlparse(u).scheme != "https":
                raise ValueError("Expected an HTTPS download URL")
            open(f"clip_{n}.mp4", "wb").write(
                urllib.request.urlopen(u, timeout=300).read()
            )
            json.dump(d, open(f"done_{n}.json", "w"))
            print(n, "done", d.get("usage"))
            pending.discard(n)
        elif s in ("failed", "error", "cancelled"):
            failed = True
            print(n, "FAILED", json.dumps(d)[:600])
            pending.discard(n)
    sys.stdout.flush()
    if pending:
        time.sleep(15)

if failed:
    sys.exit(1)
