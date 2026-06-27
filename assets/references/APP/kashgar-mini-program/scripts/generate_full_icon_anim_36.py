import argparse
import json
import math
import shutil
from pathlib import Path

import cv2
import numpy as np
from PIL import Image, ImageDraw, ImageFilter


FRAME_COUNT = 36
COLS = 6
ROWS = 6


def normalize_transparent_rgb(image: Image.Image) -> Image.Image:
    image = image.convert("RGBA")
    pixels = image.load()
    for y in range(image.height):
        for x in range(image.width):
            r, g, b, a = pixels[x, y]
            if a == 0:
                pixels[x, y] = (0, 0, 0, 0)
    return image


def default_eye_box(size: tuple[int, int]) -> tuple[int, int, int, int]:
    width, height = size
    return (
        round(width * 0.533),
        round(height * 0.408),
        round(width * 0.664),
        round(height * 0.535),
    )


def eye_openness(index: int) -> float:
    profile = [1.0, 0.86, 0.68, 0.46, 0.25, 0.10, 0.05, 0.10, 0.28, 0.52, 0.76, 0.92, 1.0]
    starts = (7, 24)
    openness = 1.0
    for start in starts:
        offset = index - start
        if 0 <= offset < len(profile):
            openness = min(openness, profile[offset])
    return openness


def clean_eye_socket(source: Image.Image, eye_box: tuple[int, int, int, int]) -> Image.Image:
    rgba = np.array(source.convert("RGBA"))
    bgr = cv2.cvtColor(rgba[:, :, :3], cv2.COLOR_RGB2BGR)
    x1, y1, x2, y2 = eye_box
    mask = np.zeros((source.height, source.width), dtype=np.uint8)
    cx = (x1 + x2) // 2
    cy = (y1 + y2) // 2
    rx = max(4, (x2 - x1) // 2 + 8)
    ry = max(4, (y2 - y1) // 2 + 8)
    cv2.ellipse(mask, (cx, cy), (rx, ry), 0, 0, 360, 255, -1)
    cleaned = cv2.inpaint(bgr, mask, 7, cv2.INPAINT_TELEA)
    rgba[:, :, :3] = cv2.cvtColor(cleaned, cv2.COLOR_BGR2RGB)
    return Image.fromarray(rgba, "RGBA")


def make_eye_mask(eye: Image.Image) -> Image.Image:
    width, height = eye.size
    ellipse = Image.new("L", eye.size, 0)
    draw = ImageDraw.Draw(ellipse)
    draw.ellipse((2, 2, width - 3, height - 3), fill=255)

    mask = Image.new("L", eye.size, 0)
    src = eye.load()
    out = mask.load()
    ellipse_px = ellipse.load()
    for y in range(height):
        for x in range(width):
            if ellipse_px[x, y] == 0:
                continue
            r, g, b, a = src[x, y]
            luma = 0.299 * r + 0.587 * g + 0.114 * b
            is_skin = r > g + 15 and r > b + 22 and luma > 125
            is_hair_or_bg = g > r + 12 and g > b + 8 and luma > 105
            if not is_skin and not is_hair_or_bg:
                out[x, y] = 255
    return mask.filter(ImageFilter.GaussianBlur(0.8))


def make_eye_layer(source: Image.Image, eye_box: tuple[int, int, int, int], openness: float) -> Image.Image:
    x1, y1, x2, y2 = eye_box
    eye = source.crop(eye_box).convert("RGBA")
    width, height = eye.size
    mask = make_eye_mask(eye)
    eye.putalpha(mask)

    compressed_h = max(5, round(height * (0.08 + 0.92 * openness)))
    compressed = eye.resize((width, compressed_h), Image.Resampling.LANCZOS)
    layer = Image.new("RGBA", source.size, (0, 0, 0, 0))
    layer.alpha_composite(compressed, (x1, y1 + (height - compressed_h) // 2))
    return layer


def shake_frame(image: Image.Image, index: int) -> Image.Image:
    phase = (index / FRAME_COUNT) * math.tau
    dx = round(math.sin(phase * 2) * image.width * 0.0035)
    dy = round(math.cos(phase) * image.height * 0.0025)
    angle = math.sin(phase) * 1.0
    rotated = image.rotate(angle, resample=Image.Resampling.BICUBIC, center=(image.width // 2, image.height // 2), fillcolor=(255, 255, 255, 255))
    frame = Image.new("RGBA", image.size, (255, 255, 255, 255))
    frame.alpha_composite(rotated, (dx, dy))
    return normalize_transparent_rgb(frame)


def make_frame(source: Image.Image, clean_source: Image.Image, eye_box: tuple[int, int, int, int], index: int) -> Image.Image:
    openness = eye_openness(index)
    if openness >= 0.995:
        base = source.copy()
    else:
        base = clean_source.copy()
        base.alpha_composite(make_eye_layer(source, eye_box, openness))
    return shake_frame(base, index)


def make_contact_sheet(frame_paths: list[Path], output: Path, size: tuple[int, int]) -> None:
    thumb_w = size[0] // 4
    thumb_h = size[1] // 4
    sheet = Image.new("RGB", (COLS * thumb_w, ROWS * (thumb_h + 18)), (255, 255, 255))
    draw = ImageDraw.Draw(sheet)
    for index, path in enumerate(frame_paths):
        frame = Image.open(path).convert("RGBA")
        frame.thumbnail((thumb_w, thumb_h), Image.Resampling.LANCZOS)
        col = index % COLS
        row = index // COLS
        x = col * thumb_w + (thumb_w - frame.width) // 2
        y = row * (thumb_h + 18)
        sheet.paste(frame.convert("RGB"), (x, y))
        draw.text((col * thumb_w + 4, y + thumb_h + 2), f"{index:02d}", fill=(32, 32, 32))
    sheet.save(output)


def generate(source_path: Path, output_dir: Path | None = None) -> dict:
    source_path = source_path.resolve()
    if output_dir is None:
        output_dir = source_path.with_name(f"{source_path.stem}_anim_36")
    if output_dir.exists():
        shutil.rmtree(output_dir)

    frames_dir = output_dir / "frames"
    frames_dir.mkdir(parents=True)

    source = normalize_transparent_rgb(Image.open(source_path).convert("RGBA"))
    eye_box = default_eye_box(source.size)
    clean_source = clean_eye_socket(source, eye_box)
    atlas = Image.new("RGBA", (source.width * COLS, source.height * ROWS), (255, 255, 255, 255))

    frame_paths = []
    gif_frames = []
    for index in range(FRAME_COUNT):
        frame = make_frame(source, clean_source, eye_box, index)
        frame_path = frames_dir / f"{source_path.stem}_anim_{index:02d}.png"
        frame.save(frame_path)
        frame_paths.append(frame_path)
        atlas.alpha_composite(frame, ((index % COLS) * source.width, (index // COLS) * source.height))
        gif_frames.append(frame.convert("P", palette=Image.Palette.ADAPTIVE))

    atlas_path = output_dir / f"{source_path.stem}_anim_36_atlas.png"
    atlas.save(atlas_path)
    preview_gif = output_dir / f"{source_path.stem}_anim_36_preview.gif"
    gif_frames[0].save(preview_gif, save_all=True, append_images=gif_frames[1:], duration=90, loop=0)
    contact_sheet = output_dir / f"{source_path.stem}_anim_36_contact_sheet.png"
    make_contact_sheet(frame_paths, contact_sheet, source.size)

    manifest = {
        "source": str(source_path),
        "frameCount": FRAME_COUNT,
        "frameSize": {"width": source.width, "height": source.height},
        "grid": {"columns": COLS, "rows": ROWS},
        "atlasSize": {"width": atlas.width, "height": atlas.height},
        "effects": ["shake", "right-eye-blink"],
        "rightEyeBox": list(eye_box),
        "atlas": str(atlas_path),
        "previewGif": str(preview_gif),
        "contactSheet": str(contact_sheet),
        "frames": [str(path) for path in frame_paths],
    }
    manifest_path = output_dir / "manifest.json"
    manifest_path.write_text(json.dumps(manifest, ensure_ascii=False, indent=2), encoding="utf-8")

    return {
        "output_dir": output_dir,
        "frames": len(frame_paths),
        "frame_size": source.size,
        "atlas": atlas_path,
        "atlas_size": atlas.size,
        "preview_gif": preview_gif,
        "contact_sheet": contact_sheet,
        "manifest": manifest_path,
        "eye_box": eye_box,
    }


def main() -> None:
    parser = argparse.ArgumentParser()
    parser.add_argument("--source", required=True)
    parser.add_argument("--output-dir")
    args = parser.parse_args()
    result = generate(Path(args.source), Path(args.output_dir) if args.output_dir else None)
    for key, value in result.items():
        print(f"{key}={value}")


if __name__ == "__main__":
    main()
