#!/usr/bin/env python3
"""Extract original image bytes from a Safari WebArchive of the requested source.
Creates an inventory only; never guesses which image belongs to a boss or Class.
"""
import hashlib
import json
import plistlib
import sys
from pathlib import Path

SOURCE = "https://sites.google.com/view/vncollector/adventure-quest-worlds/ultra-boss-guide"
if len(sys.argv) != 2:
    raise SystemExit("Usage: python3 scripts/extract-vncollector-webarchive.py path/to/page.webarchive")
archive = plistlib.loads(Path(sys.argv[1]).read_bytes())
main = archive.get("WebMainResource", {})
page_url = main.get("WebResourceURL", "").split("?")[0].rstrip("/")
if page_url != SOURCE and not page_url.startswith(SOURCE + "/"):
    raise SystemExit("Archive is not the requested Ultra Boss page or one of its child pages.")
output = Path("content-assets/vncollector/extracted")
output.mkdir(parents=True, exist_ok=True)
rows = []
formats = {"image/png": ".png", "image/jpeg": ".jpg", "image/webp": ".webp", "image/gif": ".gif"}

def walk(node):
    for resource in node.get("WebSubresources", []):
        mime = resource.get("WebResourceMIMEType", "")
        data = resource.get("WebResourceData", b"")
        if mime not in formats or not data:
            continue
        if len(data) > 20 * 1024 * 1024:
            continue
        digest = hashlib.sha256(data).hexdigest()
        target = output / (digest[:24] + formats[mime])
        target.write_bytes(data)
        rows.append({"sourcePage": page_url, "resourceUrl": resource.get("WebResourceURL"),
                     "mime": mime, "sha256": digest, "localPath": str(target),
                     "entity": None, "status": "needs-visual-identification"})
    for frame in node.get("WebSubframeArchives", []):
        walk(frame)

walk(archive)
name = hashlib.sha256(page_url.encode()).hexdigest()[:12]
(output / (name + "-inventory.json")).write_text(json.dumps(rows, ensure_ascii=False, indent=2) + "\n")
print(json.dumps({"page": page_url, "images": len(rows), "output": str(output)}, ensure_ascii=False))
