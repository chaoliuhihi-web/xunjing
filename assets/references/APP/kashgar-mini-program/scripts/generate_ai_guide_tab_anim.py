import argparse
import json
import math
import shutil
from pathlib import Path

import cv2
import numpy as np
from PIL import Image, ImageDraw, ImageFilter


FRAME_COUNT = 240
OUTPUT_SIZE = (144, 158)
COLS = 6
ROWS = 6


def rgba_from_bgr(frame: np.ndarray) -> Image.Image:
    return Image.fromarray(cv2.cvtColor(frame, cv2.COLOR_BGR2RGBA), "RGBA")


def component_mask(image: Image.Image) -> Image.Image:
    rgb = np.array(image.convert("RGB"))
    hsv = cv2.cvtColor(rgb, cv2.COLOR_RGB2HSV)
    saturation = hsv[:, :, 1]
    value = hsv[:, :, 2]

    # The exported art has a printed checkerboard, not a real alpha channel.
    # Build the alpha from the saturated painted area, then fill holes so white
    # text and highlights inside the icon are retained.
    seed = ((saturation > 18) & (value > 35)).astype(np.uint8) * 255
    kernel = cv2.getStructuringElement(cv2.MORPH_ELLIPSE, (17, 17))
    seed = cv2.morphologyEx(seed, cv2.MORPH_CLOSE, kernel, iterations=2)

    count, labels, stats, centroids = cv2.connectedComponentsWithStats(seed, 8)
    if count <= 1:
        return Image.new("L", image.size, 255)

    center = np.array([image.width / 2, image.height / 2])
    best_label = 1
    best_score = -1.0
    for label in range(1, count):
        area = stats[label, cv2.CC_STAT_AREA]
        distance = np.linalg.norm(centroids[label] - center)
        score = area - distance * 8
        if score > best_score:
            best_label = label
            best_score = score

    mask = np.where(labels == best_label, 255, 0).astype(np.uint8)
    mask = cv2.morphologyEx(mask, cv2.MORPH_CLOSE, kernel, iterations=2)

    flood = mask.copy()
    cv2.floodFill(flood, np.zeros((image.height + 2, image.width + 2), np.uint8), (0, 0), 255)
    holes = cv2.bitwise_not(flood)
    mask = cv2.bitwise_or(mask, holes)
    mask = cv2.GaussianBlur(mask, (5, 5), 0)
    return Image.fromarray(mask, "L")


def foreground_mask(image: Image.Image) -> Image.Image:
    rgb = np.array(image.convert("RGB"))
    hsv = cv2.cvtColor(rgb, cv2.COLOR_RGB2HSV)
    saturation = hsv[:, :, 1]
    value = hsv[:, :, 2]
    channel_spread = rgb.max(axis=2) - rgb.min(axis=2)

    seed = (((saturation > 24) | (channel_spread > 24)) & (value > 28)).astype(np.uint8) * 255
    kernel = cv2.getStructuringElement(cv2.MORPH_ELLIPSE, (13, 13))
    seed = cv2.morphologyEx(seed, cv2.MORPH_CLOSE, kernel, iterations=2)
    seed = cv2.morphologyEx(seed, cv2.MORPH_OPEN, cv2.getStructuringElement(cv2.MORPH_ELLIPSE, (5, 5)), iterations=1)

    count, labels, stats, centroids = cv2.connectedComponentsWithStats(seed, 8)
    if count <= 1:
        return Image.new("L", image.size, 0)

    center = np.array([image.width / 2, image.height / 2])
    best_label = 1
    best_score = -1.0
    for label in range(1, count):
        area = stats[label, cv2.CC_STAT_AREA]
        x = stats[label, cv2.CC_STAT_LEFT]
        y = stats[label, cv2.CC_STAT_TOP]
        w = stats[label, cv2.CC_STAT_WIDTH]
        h = stats[label, cv2.CC_STAT_HEIGHT]
        distance = np.linalg.norm(centroids[label] - center)
        size_bonus = min(w, image.width * 0.75) + min(h, image.height * 0.85)
        score = area + size_bonus * 35 - distance * 160
        if score > best_score:
            best_label = label
            best_score = score

    mask = np.where(labels == best_label, 255, 0).astype(np.uint8)
    mask = cv2.morphologyEx(mask, cv2.MORPH_CLOSE, kernel, iterations=3)

    flood = mask.copy()
    cv2.floodFill(flood, np.zeros((image.height + 2, image.width + 2), np.uint8), (0, 0), 255)
    holes = cv2.bitwise_not(flood)
    mask = cv2.bitwise_or(mask, holes)
    mask = cv2.erode(mask, cv2.getStructuringElement(cv2.MORPH_ELLIPSE, (3, 3)), iterations=1)
    mask = cv2.GaussianBlur(mask, (5, 5), 0)
    return Image.fromarray(mask, "L")


def apply_alpha(image: Image.Image, mask: Image.Image) -> Image.Image:
    out = image.convert("RGBA")
    out.putalpha(mask)
    return out


def fit_background(background_path: Path) -> tuple[Image.Image, Image.Image]:
    source = Image.open(background_path).convert("RGBA")
    bg = apply_alpha(source, component_mask(source))
    bg.thumbnail((OUTPUT_SIZE[0], OUTPUT_SIZE[0]), Image.Resampling.LANCZOS)

    canvas = Image.new("RGBA", OUTPUT_SIZE, (0, 0, 0, 0))
    x = (OUTPUT_SIZE[0] - bg.width) // 2
    y = OUTPUT_SIZE[1] - bg.height
    canvas.alpha_composite(bg, (x, y))

    overlay = Image.new("RGBA", OUTPUT_SIZE, (0, 0, 0, 0))
    button_top = y + round(bg.height * 0.67)
    button = canvas.crop((0, button_top, OUTPUT_SIZE[0], OUTPUT_SIZE[1]))
    overlay.alpha_composite(button, (0, button_top))
    return canvas, overlay


def sample_video_frames(video_path: Path, count: int) -> list[Image.Image]:
    capture = cv2.VideoCapture(str(video_path))
    if not capture.isOpened():
        raise RuntimeError(f"Unable to open video: {video_path}")

    total = int(capture.get(cv2.CAP_PROP_FRAME_COUNT))
    if total <= 0:
        raise RuntimeError(f"Unable to read frame count: {video_path}")

    # Use the first natural loop from the generated video rather than all 10s.
    max_frame = min(total - 1, max(count + 1, round(total * 0.38)))
    indices = np.linspace(0, max_frame, count, dtype=int)
    frames = []
    for index in indices:
        capture.set(cv2.CAP_PROP_POS_FRAMES, int(index))
        ok, frame = capture.read()
        if not ok:
            continue
        frames.append(rgba_from_bgr(frame))
    capture.release()
    if len(frames) != count:
        raise RuntimeError(f"Expected {count} frames, extracted {len(frames)}")
    return frames


def prepare_character(frame: Image.Image) -> Image.Image:
    character = apply_alpha(frame, foreground_mask(frame))
    bbox = character.getbbox()
    if not bbox:
        return Image.new("RGBA", (1, 1), (0, 0, 0, 0))
    character = character.crop(bbox)

    target_height = round(OUTPUT_SIZE[1] * 0.844)
    scale = target_height / character.height
    target_width = round(character.width * scale)
    return character.resize((target_width, target_height), Image.Resampling.LANCZOS)


def compose_frame(background: Image.Image, button_overlay: Image.Image, video_frame: Image.Image, index: int) -> Image.Image:
    frame = background.copy()
    character = prepare_character(video_frame)

    phase = index / FRAME_COUNT * math.tau
    dx = round(math.sin(phase * 1.3) * 2)
    dy = round(math.cos(phase * 1.1) * 2)
    x = (OUTPUT_SIZE[0] - character.width) // 2 + dx
    y = -4 + dy
    frame.alpha_composite(character, (x, y))
    frame.alpha_composite(button_overlay)
    return frame


def make_contact_sheet(frames: list[Image.Image], output: Path) -> None:
    thumb_w = OUTPUT_SIZE[0] // 3
    thumb_h = OUTPUT_SIZE[1] // 3
    sheet_rows = math.ceil(len(frames) / COLS)
    sheet = Image.new("RGB", (COLS * thumb_w, sheet_rows * (thumb_h + 18)), (255, 255, 255))
    draw = ImageDraw.Draw(sheet)
    for index, source_frame in enumerate(frames):
        frame = source_frame.copy()
        frame.thumbnail((thumb_w, thumb_h), Image.Resampling.LANCZOS)
        col = index % COLS
        row = index // COLS
        x = col * thumb_w + (thumb_w - frame.width) // 2
        y = row * (thumb_h + 18)
        checker = Image.new("RGB", frame.size, (238, 238, 238))
        checker.paste(frame, mask=frame.getchannel("A"))
        sheet.paste(checker, (x, y))
        draw.text((col * thumb_w + 4, y + thumb_h + 2), f"{index:02d}", fill=(32, 32, 32))
    sheet.save(output)


def generate(video_path: Path, background_path: Path, output_dir: Path, qa_dir: Path) -> dict:
    if output_dir.exists():
        shutil.rmtree(output_dir)
    output_dir.mkdir(parents=True)
    qa_dir.mkdir(parents=True, exist_ok=True)

    background, button_overlay = fit_background(background_path)
    video_frames = sample_video_frames(video_path, FRAME_COUNT)

    atlas_columns = 20
    atlas_rows = math.ceil(FRAME_COUNT / atlas_columns)
    atlas = Image.new("RGBA", (OUTPUT_SIZE[0] * atlas_columns, OUTPUT_SIZE[1] * atlas_rows), (0, 0, 0, 0))
    composed_frames = []
    gif_frames = []
    for index, video_frame in enumerate(video_frames):
        frame = compose_frame(background, button_overlay, video_frame, index)
        atlas.alpha_composite(frame, ((index % atlas_columns) * OUTPUT_SIZE[0], (index // atlas_columns) * OUTPUT_SIZE[1]))
        composed_frames.append(frame)
        gif_frames.append(frame.convert("P", palette=Image.Palette.ADAPTIVE))

    atlas_path = output_dir / "ai_guide_atlas.png"
    atlas.save(atlas_path, optimize=True)

    preview_gif = qa_dir / "ai_guide_preview.gif"
    gif_frames[0].save(preview_gif, save_all=True, append_images=gif_frames[1:], duration=90, loop=0)

    contact_sheet = qa_dir / "ai_guide_contact_sheet.png"
    make_contact_sheet(composed_frames, contact_sheet)

    manifest = {
        "sourceVideo": str(video_path.resolve()),
        "sourceBackground": str(background_path.resolve()),
        "frameCount": FRAME_COUNT,
        "frameSize": {"width": OUTPUT_SIZE[0], "height": OUTPUT_SIZE[1]},
        "atlas": str(atlas_path),
        "atlasGrid": {"columns": atlas_columns, "rows": atlas_rows},
        "atlasSize": {"width": atlas.width, "height": atlas.height},
        "fps": 11,
        "previewGif": str(preview_gif),
        "contactSheet": str(contact_sheet),
        "note": "Generated from xiakeAI.mp4 and tab_no_character.png for the custom mini-program tab bar.",
    }
    manifest_path = qa_dir / "manifest.json"
    manifest_path.write_text(json.dumps(manifest, ensure_ascii=False, indent=2), encoding="utf-8")

    return {
        "output_dir": str(output_dir),
        "frames": len(composed_frames),
        "atlas": str(atlas_path),
        "preview_gif": str(preview_gif),
        "contact_sheet": str(contact_sheet),
        "manifest": str(manifest_path),
    }


def main() -> None:
    parser = argparse.ArgumentParser()
    parser.add_argument("--video", required=True)
    parser.add_argument("--background", required=True)
    parser.add_argument("--output-dir", default="static/tabbar/ai_guide_anim")
    parser.add_argument("--qa-dir", default=".tmp/ai_guide_anim")
    args = parser.parse_args()

    result = generate(Path(args.video), Path(args.background), Path(args.output_dir), Path(args.qa_dir))
    for key, value in result.items():
        print(f"{key}={value}")


if __name__ == "__main__":
    main()
