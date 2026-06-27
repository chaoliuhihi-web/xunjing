import json
import math
import shutil
from pathlib import Path

import cv2
import numpy as np
from PIL import Image, ImageDraw, ImageFilter


ROOT = Path(__file__).resolve().parents[1]
TABBAR = ROOT / "static" / "tabbar"
SOURCE = TABBAR / "ai.png"
OUT = TABBAR / "ai_anim_36"
FRAMES = OUT / "frames"

FRAME_COUNT = 36
COLS = 6
ROWS = 6
EYE_BOX = (198, 151, 238, 195)


def normalize_transparent_rgb(image: Image.Image) -> Image.Image:
    image = image.convert("RGBA")
    pixels = image.load()
    for y in range(image.height):
        for x in range(image.width):
            r, g, b, a = pixels[x, y]
            if a == 0:
                pixels[x, y] = (0, 0, 0, 0)
    return image


def eye_openness(index: int) -> float:
    profile = [1.0, 0.82, 0.58, 0.34, 0.16, 0.06, 0.06, 0.18, 0.42, 0.68, 0.88, 1.0]
    starts = (7, 24)
    openness = 1.0
    for start in starts:
        offset = index - start
        if 0 <= offset < len(profile):
            openness = min(openness, profile[offset])
    return openness


def clean_eye_socket(base: Image.Image) -> Image.Image:
    rgba = np.array(base.convert("RGBA"))
    bgr = cv2.cvtColor(rgba[:, :, :3], cv2.COLOR_RGB2BGR)
    mask = np.zeros((base.height, base.width), dtype=np.uint8)
    cv2.ellipse(mask, (216, 173), (25, 29), 0, 0, 360, 255, -1)
    cv2.rectangle(mask, (195, 149), (238, 197), 255, -1)
    cleaned = cv2.inpaint(bgr, mask, 5, cv2.INPAINT_TELEA)
    rgba[:, :, :3] = cv2.cvtColor(cleaned, cv2.COLOR_BGR2RGB)
    return Image.fromarray(rgba, "RGBA")


def make_eye_layer(source: Image.Image, openness: float) -> Image.Image:
    x1, y1, x2, y2 = EYE_BOX
    eye = source.crop(EYE_BOX).convert("RGBA")

    width = x2 - x1
    height = y2 - y1
    ellipse = Image.new("L", (width, height), 0)
    draw = ImageDraw.Draw(ellipse)
    draw.ellipse((1, 1, width - 2, height - 2), fill=255)

    mask = Image.new("L", (width, height), 0)
    eye_pixels = eye.load()
    mask_pixels = mask.load()
    ellipse_pixels = ellipse.load()
    for y in range(height):
        for x in range(width):
            if ellipse_pixels[x, y] == 0:
                continue
            r, g, b, a = eye_pixels[x, y]
            luma = 0.299 * r + 0.587 * g + 0.114 * b
            looks_like_skin = r > g + 18 and r > b + 24 and luma > 120
            looks_like_green_bg = g > r + 24 and g > b + 12 and luma > 95
            if not looks_like_skin and not looks_like_green_bg:
                mask_pixels[x, y] = 255
    mask = mask.filter(ImageFilter.GaussianBlur(0.6))
    masked_eye = Image.new("RGBA", (width, height), (0, 0, 0, 0))
    masked_eye.alpha_composite(eye)
    masked_eye.putalpha(mask)

    compressed_h = max(4, round(height * (0.10 + 0.90 * openness)))
    eye = masked_eye.resize((width, compressed_h), Image.Resampling.LANCZOS)

    layer = Image.new("RGBA", source.size, (0, 0, 0, 0))
    y = y1 + (height - compressed_h) // 2
    layer.alpha_composite(eye, (x1, y))
    return layer


def shake_frame(image: Image.Image, index: int) -> Image.Image:
    phase = (index / FRAME_COUNT) * math.tau
    dx = round(math.sin(phase * 2) * 2)
    dy = round(math.cos(phase) * 2)
    angle = math.sin(phase) * 1.2

    rotated = image.rotate(angle, resample=Image.Resampling.BICUBIC, center=(image.width // 2, image.height // 2))
    frame = Image.new("RGBA", image.size, (0, 0, 0, 0))
    frame.alpha_composite(rotated, (dx, dy))
    return normalize_transparent_rgb(frame)


def make_blink_frame(source: Image.Image, clean_source: Image.Image, index: int) -> Image.Image:
    openness = eye_openness(index)
    if openness >= 0.995:
        frame = source.copy()
    else:
        frame = clean_source.copy()
        frame.alpha_composite(make_eye_layer(source, openness))
    return shake_frame(frame, index)


def make_contact_sheet(frame_paths: list[Path], output: Path, cell_size: tuple[int, int]) -> None:
    thumb_w = cell_size[0] // 2
    thumb_h = cell_size[1] // 2
    sheet = Image.new("RGBA", (COLS * thumb_w, ROWS * (thumb_h + 18)), (255, 255, 255, 255))
    draw = ImageDraw.Draw(sheet)
    for index, path in enumerate(frame_paths):
        image = Image.open(path).convert("RGBA")
        image.thumbnail((thumb_w, thumb_h), Image.Resampling.LANCZOS)
        col = index % COLS
        row = index // COLS
        x = col * thumb_w + (thumb_w - image.width) // 2
        y = row * (thumb_h + 18)
        sheet.alpha_composite(image, (x, y))
        draw.text((col * thumb_w + 4, y + thumb_h + 2), f"{index:02d}", fill=(32, 32, 32, 255))
    sheet.convert("RGB").save(output)


def generate() -> dict:
    if OUT.exists():
        shutil.rmtree(OUT)
    FRAMES.mkdir(parents=True)

    source = normalize_transparent_rgb(Image.open(SOURCE).convert("RGBA"))
    clean_source = clean_eye_socket(source)
    frame_w, frame_h = source.size

    atlas = Image.new("RGBA", (frame_w * COLS, frame_h * ROWS), (0, 0, 0, 0))
    frame_paths = []
    gif_frames = []
    for index in range(FRAME_COUNT):
        frame = make_blink_frame(source, clean_source, index)
        path = FRAMES / f"ai_anim_{index:02d}.png"
        frame.save(path)
        frame_paths.append(path)
        atlas.alpha_composite(frame, ((index % COLS) * frame_w, (index // COLS) * frame_h))
        gif_frames.append(frame.convert("P", palette=Image.Palette.ADAPTIVE))

    atlas = normalize_transparent_rgb(atlas)
    atlas_path = OUT / "ai_anim_36_atlas.png"
    atlas.save(atlas_path)

    preview_gif = OUT / "ai_anim_36_preview.gif"
    gif_frames[0].save(preview_gif, save_all=True, append_images=gif_frames[1:], duration=90, loop=0)

    contact_sheet = OUT / "ai_anim_36_contact_sheet.png"
    make_contact_sheet(frame_paths, contact_sheet, source.size)

    manifest = {
        "source": str(SOURCE),
        "frameCount": FRAME_COUNT,
        "frameSize": {"width": frame_w, "height": frame_h},
        "grid": {"columns": COLS, "rows": ROWS},
        "atlasSize": {"width": frame_w * COLS, "height": frame_h * ROWS},
        "effects": ["shake", "right-eye-blink"],
        "atlas": str(atlas_path),
        "previewGif": str(preview_gif),
        "frames": [str(path) for path in frame_paths],
        "note": "Keeps the full ai.png artwork, including bottom text badge and circular scenery background.",
    }
    manifest_path = OUT / "manifest.json"
    manifest_path.write_text(json.dumps(manifest, ensure_ascii=False, indent=2), encoding="utf-8")

    return {
        "out": OUT,
        "frames": len(frame_paths),
        "frame_size": source.size,
        "atlas": atlas_path,
        "atlas_size": atlas.size,
        "preview_gif": preview_gif,
        "contact_sheet": contact_sheet,
        "manifest": manifest_path,
    }


if __name__ == "__main__":
    for key, value in generate().items():
        print(f"{key}={value}")
