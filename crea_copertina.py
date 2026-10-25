# Crea images/copertina.jpg (1200x630): l'anteprima che appare quando si condivide il link (WhatsApp ecc.).
# L'orario disegnato a destra è ricavato dalle lezioni vere di index.html. Per rifarla: python crea_copertina.py
import re
from PIL import Image, ImageDraw, ImageFont

CART = r"C:\Users\Filippo\Desktop\CLAUDE\ORARIO LUTE"
F = r"C:\Windows\Fonts"
W, H = 1200, 630
NAVY, TEAL, AMBER, SAND = (13, 37, 56), (26, 95, 122), (242, 140, 56), (248, 246, 240)
AULE = {"S09": (2, 132, 199), "S08": (124, 58, 237), "S07": (5, 150, 105), "S06": (217, 119, 6),
        "S05": (219, 39, 119), "Palestra": (220, 38, 38), "Aula Magna": (67, 56, 202)}

# Lezioni dal file (giorno, aula, ora di inizio, ora di fine)
html = open(CART + r"\index.html", encoding="utf-8").read()
lez = re.findall(r"day: '([^']+)',[\s\S]*?startTime: '([^']+)',\s*endTime: '([^']+)',[\s\S]*?aula: '([^']+)'", html)
GIORNI = ["LUNEDÌ", "MARTEDÌ", "MERCOLEDÌ", "GIOVEDÌ", "VENERDÌ"]
SIGLE = ["LUN", "MAR", "MER", "GIO", "VEN"]

img = Image.new("RGB", (W, H), SAND)
d = ImageDraw.Draw(img)

# --- Pannello destro: orario della settimana ---
PX = 640
d.rectangle((PX, 0, W, H), fill=NAVY)
f_g = ImageFont.truetype(F + r"\segoeuib.ttf", 22)
f_o = ImageFont.truetype(F + r"\segoeui.ttf", 17)
gx0, gy0, colw, rowh = PX + 92, 92, 88, 108          # 4 fasce orarie da 15:30 a 19:30
for i, s in enumerate(SIGLE):
    cx = gx0 + i * colw + colw / 2
    d.text((cx, 58), s, font=f_g, fill=(240, 215, 156), anchor="mm")
for k, ora in enumerate(["15:30", "16:30", "17:30", "18:30", "19:30"]):
    y = gy0 + k * rowh
    d.text((PX + 78, y), ora, font=f_o, fill=(170, 190, 205), anchor="rm")
    d.line((gx0, y, gx0 + 5 * colw, y), fill=(40, 66, 88), width=1)
ore = lambda t: (int(t[:2]) + int(t[3:]) / 60) if ":" in t else 19.5
for i, g in enumerate(GIORNI):
    giorno = [l for l in lez if l[0] == g]
    giorno.sort(key=lambda l: ore(l[1]))
    # corsie: ogni lezione va nella prima corsia libera; tutte le corsie del giorno hanno la stessa larghezza
    fine_corsia, posti = [], []
    for (_, a, b, aula) in giorno:
        t0, t1 = ore(a), min(ore(b), 19.5)
        k = next((j for j, f in enumerate(fine_corsia) if f <= t0), None)
        if k is None:
            fine_corsia.append(t1); k = len(fine_corsia) - 1
        else:
            fine_corsia[k] = t1
        posti.append((k, t0, t1, aula))
    larg = (colw - 10) / max(len(fine_corsia), 1)
    for (k, t0, t1, aula) in posti:
        x0 = gx0 + i * colw + 5 + k * larg
        y0 = gy0 + (t0 - 15.5) * rowh + 3
        y1 = gy0 + (t1 - 15.5) * rowh - 3
        d.rounded_rectangle((x0 + 1.5, y0, x0 + larg - 1.5, y1), radius=5, fill=AULE.get(aula, TEAL))

# --- Pannello sinistro: logo e testi ---
logo = Image.open(r"C:\Users\Filippo\Desktop\CLAUDE\ISCRIZIONE LUTE\img\logo-lute.png").convert("RGBA")
logo.thumbnail((300, 150))
img.paste(logo, (64, 52), logo)
f_t = ImageFont.truetype(F + r"\georgiab.ttf", 54)
f_s = ImageFont.truetype(F + r"\segoeuisl.ttf", 27)
f_b = ImageFont.truetype(F + r"\segoeuib.ttf", 24)
f_p = ImageFont.truetype(F + r"\segoeui.ttf", 21)
d.text((64, 232), "Galleria Lezioni", font=f_t, fill=NAVY)
d.text((64, 294), "della Settimana", font=f_t, fill=NAVY)
d.rectangle((66, 376, 156, 380), fill=AMBER)
d.text((64, 398), "Orario dei corsi · 5–9 ottobre 2026", font=f_s, fill=(51, 65, 85))
# pastiglia "30 lezioni"
n = len(lez)
testo = f"{n} lezioni"
lw = d.textlength(testo, font=f_b)
d.rounded_rectangle((64, 456, 64 + lw + 40, 504), radius=24, fill=TEAL)
d.text((84, 480), testo, font=f_b, fill="white", anchor="lm")
d.text((64, 540), "Tocca per vedere giorno, aula, orario e docente", font=f_p, fill=(71, 85, 105))
d.text((64, 572), "LUTE · Libera Università delle Tre Età · Milazzo", font=f_p, fill=(100, 116, 139))

img.save(CART + r"\images\copertina.jpg", quality=88, optimize=True, progressive=True)
print("creata images/copertina.jpg con", n, "lezioni")
