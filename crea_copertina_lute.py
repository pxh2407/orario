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
F = lambda s: ImageFont.truetype(r"C:\Windows\Fonts\georgiab.ttf", s)
FR = ImageFont.truetype(r"C:\Windows\Fonts\georgia.ttf", 26)
W, H = 1200, 630
im = Image.new("RGB", (W, H), CREMA); dr = ImageDraw.Draw(im)
dr.rectangle([22, 22, W - 23, H - 23], outline=ORO, width=4)
logo = Image.open("images/logo-lute.png").convert("RGBA")
h = int(logo.height * 260 / logo.width); l = logo.resize((260, h), Image.LANCZOS)
im.paste(l, ((W - 260) // 2, 50), l); y = 50 + h
dr.rectangle([W // 2 - 80, y + 22, W // 2 + 80, y + 26], fill=ORO)
def c(t, yy, f, col):
    dr.text(((W - dr.textlength(t, font=f)) / 2, yy), t, font=f, fill=col)
c("Orario delle lezioni", y + 45, F(62), VERDE); c("della settimana", y + 115, F(62), VERDE)
c(periodo, y + 200, F(44), ORO)
c(f"Tocca per vedere giorno, aula, orario e docente · {n} lezioni", H - 85, FR, VERDE)
out = f"images/copertina-{a}.jpg"; im.save(out, quality=88); print(out, periodo, n)
