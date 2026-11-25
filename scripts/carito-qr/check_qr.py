"""Reads the QR images back like a phone camera would: several sizes, a blur, a slant. Every one must give the exact link."""
import sys

import zxingcpp
from PIL import Image, ImageFilter

URL = "https://www.khoopper.com/carito"
ok = True
for path in sys.argv[1:]:
    base = Image.open(path).convert("RGB")
    trials = []
    for width in (1600, 800, 400, 260, 180):
        im = base.resize((width, round(base.height * width / base.width)), Image.LANCZOS)
        trials.append((f"{width}px", im))
    trials.append(("blur", base.resize((500, round(base.height * 500 / base.width))).filter(ImageFilter.GaussianBlur(1.6))))
    trials.append(("slant", base.resize((600, round(base.height * 600 / base.width))).rotate(9, expand=True, fillcolor="white")))
    for name, im in trials:
        found = [r.text for r in zxingcpp.read_barcodes(im)]
        good = URL in found
        ok &= good
        print(f"{path.split('/')[-1].split(chr(92))[-1]:28} {name:6} {'OK' if good else 'FAIL'} {found}")
sys.exit(0 if ok else 1)
