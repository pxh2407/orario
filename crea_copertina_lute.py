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
# Tutto nel quadrato centrale (630x630): WhatsApp Web nella casella di scrittura mostra solo quello
logo = Image.open("images/logo-lute.png").convert("RGBA")
LW = 330; h = int(logo.height * LW / logo.width); l = logo.resize((LW, h), Image.LANCZOS)
im.paste(l, ((W - LW) // 2, 44), l); y = 44 + h
dr.rectangle([W // 2 - 70, y + 12, W // 2 + 70, y + 16], fill=ORO)
def c(t, yy, f, col):
    dr.text(((W - dr.textlength(t, font=f)) / 2, yy), t, font=f, fill=col)
c("Orario", y + 30, F(92), VERDE)
c("della settimana", y + 132, F(58), VERDE)
c(periodo.replace(f" {b[:4]}", "").replace("dal ", "").replace(" al ", "–"), y + 208, F(66), ORO)
out = f"images/copertina-{a}.jpg"; im.save(out, quality=88); print(out, periodo, n)
