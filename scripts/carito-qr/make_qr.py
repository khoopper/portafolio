"""Carito Music QR: round dots in the icon's purple, the three finder eyes drawn as daisies, the app icon in the middle.

Writes, into the folder given as the first argument:
  carito-qr.svg          the code alone (for the web page; the icon embedded)
  carito-qr.png          the code alone, 1600 px, white background
  carito-qr-tarjeta.png  a card to share or print: icon, name, the code, the link
"""
import base64
import io
import math
import os
import sys

import segno
from PIL import Image, ImageDraw, ImageFilter, ImageFont

URL = "https://www.khoopper.com/carito"
ICON = sys.argv[2]
OUT = sys.argv[1]
os.makedirs(OUT, exist_ok=True)

qr = segno.make(URL, error="h", micro=False)
matrix = [list(row) for row in qr.matrix]
n = len(matrix)
QUIET = 2  # modules of white around the code (the card adds more white around it)

# The icon's colours: deep purple background, violet light, the daisy's gold centre.
DEEP = (0x2B, 0x0B, 0x57)
VIOLET = (0x6D, 0x28, 0xD9)
GOLD = (0xF2, 0xB1, 0x1B)


def finder(r, c):
    return (r < 7 and c < 7) or (r < 7 and c >= n - 7) or (r >= n - 7 and c < 7)


# Clear the middle for the icon: a circle of ~24 % of the code's width (error level H recovers 30 %).
logo_modules = round(n * 0.25) | 1
centre = (n - 1) / 2


DISC = logo_modules / 2 + 0.55  # the white disc behind the icon, in modules


def under_logo(r, c):
    return math.hypot(r - centre, c - centre) <= DISC + 0.45


def colour_at(r, c):
    """Diagonal blend from deep purple (top left) to violet (bottom right); never lighter than VIOLET, so it scans."""
    t = (r + c) / (2 * (n - 1))
    return tuple(round(a + (b - a) * t) for a, b in zip(DEEP, VIOLET))


def hexc(rgb):
    return "#%02x%02x%02x" % rgb


def icon_png(size):
    icon = Image.open(ICON).convert("RGBA")
    icon = icon.crop(icon.getchannel("A").point(lambda a: 255 if a > 8 else 0).getbbox())
    icon = icon.resize((size, size), Image.LANCZOS)
    # Round it like the launcher (squircle-ish corners), in case the source has square corners.
    mask = Image.new("L", (size * 4, size * 4), 0)
    ImageDraw.Draw(mask).rounded_rectangle((0, 0, size * 4 - 1, size * 4 - 1), radius=size * 4 * 0.23, fill=255)
    mask = mask.resize((size, size), Image.LANCZOS)
    alpha = Image.composite(icon.getchannel("A"), Image.new("L", (size, size), 0), mask)
    icon.putalpha(alpha)
    return icon


def daisy_petals(cx, cy, radius, petals=10):
    """Petal ellipses around (cx, cy): centre, rotation, half length, half width."""
    out = []
    for k in range(petals):
        a = 2 * math.pi * k / petals
        out.append((cx + math.cos(a) * radius * 0.52, cy + math.sin(a) * radius * 0.52, math.degrees(a), radius * 0.5, radius * 0.2))
    return out


# ---------- SVG ----------
def svg():
    size = n + 2 * QUIET
    parts = [
        f'<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 {size} {size}" width="1000" height="1000" role="img" aria-label="Código QR de Carito Music: {URL}">',
        f'<rect width="{size}" height="{size}" rx="{size * 0.06:.2f}" fill="#ffffff"/>',
        "<defs><linearGradient id=\"g\" x1=\"0\" y1=\"0\" x2=\"1\" y2=\"1\">"
        f'<stop offset="0" stop-color="{hexc(DEEP)}"/><stop offset="1" stop-color="{hexc(VIOLET)}"/></linearGradient></defs>',
        '<g fill="url(#g)">',
    ]
    for r in range(n):
        for c in range(n):
            if matrix[r][c] and not finder(r, c) and not under_logo(r, c):
                parts.append(f'<circle cx="{c + QUIET + 0.5}" cy="{r + QUIET + 0.5}" r="0.43"/>')
    parts.append("</g>")
    for (r0, c0) in [(0, 0), (0, n - 7), (n - 7, 0)]:
        x, y = c0 + QUIET, r0 + QUIET
        # Ring: a rounded square 7x7 with a 1-module wall.
        parts.append(
            f'<path fill-rule="evenodd" fill="{hexc(DEEP)}" d="M{x + 2},{y} h3 a2,2 0 0 1 2,2 v3 a2,2 0 0 1 -2,2 h-3 a2,2 0 0 1 -2,-2 v-3 a2,2 0 0 1 2,-2 z '
            f'M{x + 2},{y + 1} a1,1 0 0 0 -1,1 v3 a1,1 0 0 0 1,1 h3 a1,1 0 0 0 1,-1 v-3 a1,1 0 0 0 -1,-1 z"/>'
        )
        cx, cy = x + 3.5, y + 3.5
        # The pupil: a daisy all in purple (a gold heart, being light, breaks the dark-light-dark pattern scanners look for).
        parts.append(f'<circle cx="{cx}" cy="{cy}" r="1.5" fill="{hexc(DEEP)}"/>')
        for (px, py, rot, a, b) in daisy_petals(cx, cy, 1.62):
            parts.append(f'<ellipse cx="{px:.3f}" cy="{py:.3f}" rx="{a:.3f}" ry="{b:.3f}" transform="rotate({rot:.1f} {px:.3f} {py:.3f})" fill="{hexc(VIOLET)}"/>')
    # The icon in the middle, on a white disc.
    logo = logo_modules
    lx = QUIET + centre + 0.5 - logo / 2
    buf = io.BytesIO()
    icon_png(320).save(buf, "PNG", optimize=True)
    data = base64.b64encode(buf.getvalue()).decode()
    parts.append(f'<circle cx="{QUIET + centre + 0.5}" cy="{QUIET + centre + 0.5}" r="{DISC:.2f}" fill="#ffffff"/>')
    parts.append(f'<image x="{lx + 0.35:.3f}" y="{lx + 0.35:.3f}" width="{logo - 0.7:.3f}" height="{logo - 0.7:.3f}" href="data:image/png;base64,{data}"/>')
    parts.append("</svg>")
    return "\n".join(parts)


# ---------- PNG (drawn directly, 4x supersampled) ----------
def png(px):
    s = 4
    size = n + 2 * QUIET
    m = px * s / size
    img = Image.new("RGB", (px * s, px * s), "white")
    d = ImageDraw.Draw(img)
    for r in range(n):
        for c in range(n):
            if matrix[r][c] and not finder(r, c) and not under_logo(r, c):
                cx, cy = (c + QUIET + 0.5) * m, (r + QUIET + 0.5) * m
                rad = 0.43 * m
                d.ellipse((cx - rad, cy - rad, cx + rad, cy + rad), fill=colour_at(r, c))
    for (r0, c0) in [(0, 0), (0, n - 7), (n - 7, 0)]:
        x, y = (c0 + QUIET) * m, (r0 + QUIET) * m
        d.rounded_rectangle((x, y, x + 7 * m, y + 7 * m), radius=2 * m, fill=DEEP)
        d.rounded_rectangle((x + m, y + m, x + 6 * m, y + 6 * m), radius=1 * m, fill="white")
        cx, cy = x + 3.5 * m, y + 3.5 * m
        d.ellipse((cx - 1.5 * m, cy - 1.5 * m, cx + 1.5 * m, cy + 1.5 * m), fill=DEEP)
        for (pxx, pyy, rot, a, b) in daisy_petals(cx / m, cy / m, 1.62):
            petal = Image.new("L", (int(2 * a * m) + 4, int(2 * a * m) + 4), 0)
            pw, ph = petal.size
            ImageDraw.Draw(petal).ellipse((pw / 2 - a * m, ph / 2 - b * m, pw / 2 + a * m, ph / 2 + b * m), fill=255)
            petal = petal.rotate(-rot, resample=Image.BICUBIC)
            img.paste(Image.new("RGB", petal.size, VIOLET), (int(pxx * m - pw / 2), int(pyy * m - ph / 2)), petal)
    c0 = (QUIET + centre + 0.5) * m
    rad = DISC * m
    d.ellipse((c0 - rad, c0 - rad, c0 + rad, c0 + rad), fill="white")
    isz = int((logo_modules - 0.7) * m)
    icon = icon_png(isz)
    img.paste(icon, (int(c0 - isz / 2), int(c0 - isz / 2)), icon)
    return img.resize((px, px), Image.LANCZOS)


def font(size, bold=False):
    for name in (["seguisb.ttf", "segoeuib.ttf"] if bold else ["segoeui.ttf"]):
        path = os.path.join(os.environ.get("WINDIR", "C:/Windows"), "Fonts", name)
        if os.path.exists(path):
            return ImageFont.truetype(path, size)
    return ImageFont.load_default()


def card(code):
    W, H = 1200, 1600
    img = Image.new("RGB", (W, H), DEEP)
    # Background: the icon's deep purple with a soft violet glow at the top.
    glow = Image.new("RGB", (W, H), DEEP)
    gd = ImageDraw.Draw(glow)
    gd.ellipse((-300, -700, W + 300, 700), fill=(0x5B, 0x21, 0xB6))
    glow = glow.filter(ImageFilter.GaussianBlur(220))
    img = Image.blend(img, glow, 0.9)
    d = ImageDraw.Draw(img)
    icon = icon_png(200)
    img.paste(icon, ((W - 200) // 2, 90), icon)
    title = "Carito Music"
    f1 = font(84, bold=True)
    d.text(((W - d.textlength(title, font=f1)) / 2, 318), title, font=f1, fill="white")
    sub = "Escanéalo para descargarla en Android o en tu PC"
    f2 = font(38)
    d.text(((W - d.textlength(sub, font=f2)) / 2, 432), sub, font=f2, fill=(0xE9, 0xDD, 0xFF))
    # The code on a white rounded tile.
    tile = 860
    tx, ty = (W - tile) // 2, 530
    shadow = Image.new("L", (W, H), 0)
    ImageDraw.Draw(shadow).rounded_rectangle((tx, ty + 18, tx + tile, ty + tile + 18), radius=64, fill=150)
    shadow = shadow.filter(ImageFilter.GaussianBlur(30))
    img.paste(Image.new("RGB", (W, H), (0x12, 0x03, 0x26)), (0, 0), shadow)
    d = ImageDraw.Draw(img)
    d.rounded_rectangle((tx, ty, tx + tile, ty + tile), radius=64, fill="white")
    inner = code.resize((tile - 60, tile - 60), Image.LANCZOS)
    img.paste(inner, (tx + 30, ty + 30))
    link = "khoopper.com/carito"
    f3 = font(52, bold=True)
    d.text(((W - d.textlength(link, font=f3)) / 2, ty + tile + 36), link, font=f3, fill="white")
    by = "Hecha por KHOOPPER"
    f4 = font(32)
    d.text(((W - d.textlength(by, font=f4)) / 2, H - 76), by, font=f4, fill=(0xB9, 0xA6, 0xE0))
    return img


with open(os.path.join(OUT, "carito-qr.svg"), "w", encoding="utf-8") as fh:
    fh.write(svg())
code = png(1600)
code.save(os.path.join(OUT, "carito-qr.png"), optimize=True)
card(code).save(os.path.join(OUT, "carito-qr-tarjeta.png"), optimize=True)
print("version", qr.version, "modules", n, "logo modules", logo_modules)
