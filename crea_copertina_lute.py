# Copertina 1200x630 per l'anteprima WhatsApp, stile LUTE (stesso disegno di creaCopertina() in gestione/Gestione Orario.html)
import json, sys
from PIL import Image, ImageDraw, ImageFont
d = json.load(open("dati/settimana.json", encoding="utf-8"))
MESI = ["gennaio","febbraio","marzo","aprile","maggio","giugno","luglio","agosto","settembre","ottobre","novembre","dicembre"]
a, b = d["dal"], d["al"]
g1, g2 = int(a[8:]), int(b[8:])
m1, m2 = MESI[int(a[5:7]) - 1], MESI[int(b[5:7]) - 1]
periodo = f"dal {g1} al {g2} {m2} {b[:4]}" if m1 == m2 else f"dal {g1} {m1} al {g2} {m2} {b[:4]}"
n = len([l for l in d["lezioni"] if not l.get("sospesa")])
VERDE, ORO, CREMA = (20, 74, 61), (184, 134, 59), (251, 249, 244)
S = 2   # doppia risoluzione: 2400x1260 (stesso disegno, niente sgranatura)
F = lambda s: ImageFont.truetype(r"C:\Windows\Fonts\georgiab.ttf", s * S)
FR = ImageFont.truetype(r"C:\Windows\Fonts\georgia.ttf", 26)
W, H = 1200 * S, 630 * S
im = Image.new("RGB", (W, H), CREMA); dr = ImageDraw.Draw(im)
dr.rectangle([22 * S, 22 * S, W - 23 * S, H - 23 * S], outline=ORO, width=4 * S)
logo = Image.open("images/logo-lute.png").convert("RGBA")
h = int(logo.height * 420 * S / logo.width); l = logo.resize((420 * S, h), Image.LANCZOS)
im.paste(l, ((W - 420 * S) // 2, 48 * S), l); y = 48 * S + h
dr.rectangle([W // 2 - 90 * S, y + 14 * S, W // 2 + 90 * S, y + 19 * S], fill=ORO)
def c(t, yy, f, col):
    dr.text(((W - dr.textlength(t, font=f)) / 2, yy), t, font=f, fill=col)
c("Orario della settimana", y + 38 * S, F(78), VERDE)
c(periodo.replace(f" {b[:4]}", ""), y + 140 * S, F(70), ORO)
out = f"images/copertina-{a}.jpg"; im.save(out, quality=90); print(out, periodo, n)
