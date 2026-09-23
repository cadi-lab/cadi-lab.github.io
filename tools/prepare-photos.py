#!/usr/bin/env python3
"""Build responsive member-photo assets without changing their originals."""

from __future__ import annotations

import argparse
import hashlib
import json
import math
from pathlib import Path
import shutil
import subprocess

import yaml


ROOT = Path(__file__).resolve().parents[1]
IMAGE_DIR = ROOT / "assets" / "img"
OUTPUT_DIR = IMAGE_DIR / "optimized"
MANIFEST = ROOT / "_data" / "photo_variants.json"
RECIPE_VERSION = 1


def sha256(path: Path) -> str:
    digest = hashlib.sha256()
    with path.open("rb") as source:
        for block in iter(lambda: source.read(1024 * 1024), b""):
            digest.update(block)
    return digest.hexdigest()


def run(*args: str) -> str:
    return subprocess.check_output(args, text=True).strip()


def dimensions(magick: str, path: Path, orient: bool = False) -> tuple[int, int]:
    args = [magick, str(path)]
    if orient:
        args.append("-auto-orient")
    args.extend(["-format", "%w %h", "info:"])
    width, height = run(*args).split()
    return int(width), int(height)


def target_size(width: int, height: int, edge: int, short: bool) -> tuple[int, int]:
    reference = min(width, height) if short else max(width, height)
    scale = min(1.0, edge / reference)
    return (
        max(1, math.floor(width * scale + 0.5)),
        max(1, math.floor(height * scale + 0.5)),
    )


def geometry(width: int, height: int, edge: int, short: bool) -> str:
    # Set only one dimension: ImageMagick computes the other without stretching.
    resize_width = (width <= height) if short else (width >= height)
    return f"{edge}x>" if resize_width else f"x{edge}>"


def main() -> None:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--magick", default=shutil.which("magick") or "/opt/homebrew/bin/magick")
    parser.add_argument("--quality", type=int, default=95)
    args = parser.parse_args()
    if not 92 <= args.quality <= 100:
        parser.error("--quality must be between 92 and 100")
    version = run(args.magick, "-version").splitlines()[0]
    recipe = {"version": RECIPE_VERSION, "quality": args.quality, "encoder": version}
    recipe_hash = hashlib.sha256(json.dumps(recipe, sort_keys=True).encode()).hexdigest()[:8]

    members = yaml.safe_load((ROOT / "_data" / "lab_members.yml").read_text())
    professor_photo = members["professor"].get("photo")
    people = [members["professor"]] + members.get("current_members", []) + members.get("alumni", [])
    photos = sorted({person["photo"] for person in people if person.get("photo")})
    sources = {photo: IMAGE_DIR / photo for photo in photos}
    for source in sources.values():
        if source.parent != IMAGE_DIR or not source.is_file():
            raise ValueError(f"Invalid or missing source image: {source}")
    before_hashes = {photo: sha256(source) for photo, source in sources.items()}
    manifest = {}
    OUTPUT_DIR.mkdir(parents=True, exist_ok=True)

    for photo, source in sources.items():
        width, height = dimensions(args.magick, source, orient=True)
        source_bytes = source.stat().st_size
        prefix = f"{source.stem}-{before_hashes[photo][:12]}-{recipe_hash}"
        variants = {}

        def make_variant(edge: int, short: bool) -> dict:
            edge = min(edge, min(width, height) if short else max(width, height))
            size = target_size(width, height, edge, short)
            if size in variants:
                return variants[size]
            target = OUTPUT_DIR / f"{prefix}-{size[0]}x{size[1]}.webp"
            original_copy = OUTPUT_DIR / f"{prefix}-original{source.suffix.lower()}"
            if size == (width, height) and original_copy.exists():
                if sha256(original_copy) != before_hashes[photo]:
                    raise RuntimeError(f"Cached original copy differs: {original_copy}")
                target = original_copy
            elif not target.exists():
                temporary = target.with_suffix(".tmp.webp")
                command = [
                    args.magick, str(source), "-auto-orient", "-filter", "Lanczos",
                    "-resize", geometry(width, height, edge, short),
                ]
                # Retain ICC color management; drop camera/editor metadata only.
                for profile in ("exif", "xmp", "iptc", "8bim", "mpf"):
                    command.extend(["+profile", profile])
                command.extend([
                    "+set", "date:create", "+set", "date:modify",
                    "-define", "webp:method=6", "-define", "webp:alpha-quality=100",
                    "-define", "webp:exact=true", "-quality", str(args.quality), str(temporary),
                ])
                subprocess.run(command, check=True)
                if dimensions(args.magick, temporary) != size:
                    raise RuntimeError(f"Unexpected output dimensions: {temporary}")
                # An original-sized variant may use a byte-identical cached copy.
                # Resized cards always remain resized, even if encoding is larger.
                if size == (width, height) and temporary.stat().st_size >= source_bytes:
                    shutil.copyfile(source, original_copy)
                    temporary.unlink()
                    target = original_copy
                else:
                    temporary.replace(target)
            measured = dimensions(args.magick, target, orient=True)
            if measured != size or measured[0] > width or measured[1] > height:
                raise RuntimeError(f"Invalid cached dimensions: {target}")
            variant = {
                "path": "/" + target.relative_to(ROOT).as_posix(),
                "width": size[0], "height": size[1], "bytes": target.stat().st_size,
            }
            variants[size] = variant
            return variant

        card_edges = [400, 640] if photo == professor_photo else [320, 480]
        full_edges = [1280, 2048, 3072, max(width, height)]

        def unique_sorted(items: list[dict]) -> list[dict]:
            return sorted({item["path"]: item for item in items}.values(), key=lambda item: (item["width"], item["height"]))

        full = unique_sorted([make_variant(edge, short=False) for edge in full_edges])
        # A larger candidate preserves fine detail on high-DPI displays after cropping.
        cards = unique_sorted([make_variant(edge, short=True) for edge in card_edges] + [full[0]])
        manifest[photo] = {
            "width": width, "height": height,
            "card": cards,
            "full": full,
        }
        print(f"Prepared {photo}: {width}×{height}", flush=True)

    after_hashes = {photo: sha256(source) for photo, source in sources.items()}
    if before_hashes != after_hashes:
        raise RuntimeError("An original image changed during generation; manifest was not replaced")
    serialized = json.dumps(manifest, ensure_ascii=False, indent=2) + "\n"
    if not MANIFEST.exists() or MANIFEST.read_text() != serialized:
        MANIFEST.write_text(serialized)
    report = {
        "photos": len(manifest), "encoder": version, "quality": args.quality,
        "original_bytes": sum(source.stat().st_size for source in sources.values()),
        "smallest_card_total_bytes": sum(entry["card"][0]["bytes"] for entry in manifest.values()),
        "largest_card_total_bytes": sum(entry["card"][-1]["bytes"] for entry in manifest.values()),
        "original_hashes_unchanged": before_hashes == after_hashes,
        "original_sha256": after_hashes,
    }
    print(json.dumps(report, indent=2))


if __name__ == "__main__":
    main()
