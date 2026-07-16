#!/usr/bin/env python3
from pathlib import Path
import shutil, sys

patch_root = Path(__file__).resolve().parent
site_root = Path(sys.argv[1]).resolve() if len(sys.argv) > 1 else None
if site_root is None:
    raise SystemExit("Usage: python apply_update.py /path/to/LockwoodSTEM-site-root")

for top in ("courses", "downloads", "assets"):
    source = patch_root / top
    if source.exists():
        shutil.copytree(source, site_root / top, dirs_exist_ok=True)

for rel in (
    "downloads/presentations/AED_Unit0_Student_Deck.pptx",
    "downloads/presentations/AED_Unit0_Student_Deck.pdf",
):
    target = site_root / rel
    if target.exists():
        target.unlink()
        print(f"Removed {rel}")

print("LockwoodSTEM Lesson 0.1 website update applied.")
