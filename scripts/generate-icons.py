# Genera los iconos PWA de ForjaFit (PNG) con Pillow.
# Diseño: mancuerna naranja brasa sobre gris hierro, esquinas redondeadas.
# Uso: py scripts/generate-icons.py
from PIL import Image, ImageDraw

BG = (20, 22, 26, 255)        # --bg gris hierro
EMBER = (249, 115, 22, 255)   # --accent brasa
EMBER_LIGHT = (251, 146, 60, 255)


def rounded_rect(draw, box, radius, fill):
    draw.rounded_rectangle(box, radius=radius, fill=fill)


def draw_icon(size: int, maskable: bool) -> Image.Image:
    img = Image.new('RGBA', (size, size), (0, 0, 0, 0))
    draw = ImageDraw.Draw(img)
    s = size / 512  # escala respecto al lienzo de diseño

    # Fondo: a sangre si es maskable (la máscara la pone el SO),
    # con esquinas redondeadas si es icono normal.
    if maskable:
        draw.rectangle([0, 0, size, size], fill=BG)
    else:
        rounded_rect(draw, [0, 0, size, size], radius=int(96 * s), fill=BG)

    # Zona segura maskable: el 80% central. La mancuerna ocupa ~60%.
    cx, cy = size / 2, size / 2
    bar_half = 150 * s     # media barra
    bar_h = 22 * s
    plate_w = 42 * s
    plate_h = 150 * s
    plate2_w = 30 * s
    plate2_h = 100 * s
    gap = 10 * s

    # Barra
    rounded_rect(
        draw,
        [cx - bar_half, cy - bar_h, cx + bar_half, cy + bar_h],
        radius=int(bar_h),
        fill=EMBER_LIGHT,
    )
    # Discos interiores (más altos)
    for sign in (-1, 1):
        x = cx + sign * (bar_half - plate_w)
        rounded_rect(
            draw,
            [x - plate_w / 2, cy - plate_h / 2, x + plate_w / 2, cy + plate_h / 2],
            radius=int(14 * s),
            fill=EMBER,
        )
        # Discos exteriores (más bajos)
        x2 = cx + sign * (bar_half + gap)
        rounded_rect(
            draw,
            [x2 - plate2_w / 2, cy - plate2_h / 2, x2 + plate2_w / 2, cy + plate2_h / 2],
            radius=int(12 * s),
            fill=EMBER,
        )

    # Chispa de la forja (estrella de 4 puntas) arriba a la derecha
    spark_cx, spark_cy, r = cx + 120 * s, cy - 120 * s, 36 * s
    draw.polygon(
        [
            (spark_cx, spark_cy - r),
            (spark_cx + r * 0.28, spark_cy - r * 0.28),
            (spark_cx + r, spark_cy),
            (spark_cx + r * 0.28, spark_cy + r * 0.28),
            (spark_cx, spark_cy + r),
            (spark_cx - r * 0.28, spark_cy + r * 0.28),
            (spark_cx - r, spark_cy),
            (spark_cx - r * 0.28, spark_cy - r * 0.28),
        ],
        fill=(251, 191, 36, 255),
    )
    return img


if __name__ == '__main__':
    import os

    out = os.path.join(os.path.dirname(__file__), '..', 'public')
    os.makedirs(out, exist_ok=True)
    draw_icon(192, False).save(os.path.join(out, 'pwa-192.png'))
    draw_icon(512, False).save(os.path.join(out, 'pwa-512.png'))
    draw_icon(512, True).save(os.path.join(out, 'pwa-maskable-512.png'))
    draw_icon(180, False).save(os.path.join(out, 'apple-touch-icon.png'))
    # Favicon multi-tamaño
    icon32 = draw_icon(64, False).resize((32, 32), Image.LANCZOS)
    icon32.save(os.path.join(out, 'favicon.ico'), sizes=[(32, 32), (16, 16)])
    print('Iconos generados en /public')
