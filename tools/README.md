# Member photo assets

Run from the repository root:

```sh
python3 tools/prepare-photos.py
```

Requires Python 3, PyYAML, and ImageMagick 7 with WebP support. Use
`--magick /path/to/magick` if ImageMagick is not on `PATH`.

The script reads the photo names in `_data/lab_members.yml` and writes only
`assets/img/optimized/` and `_data/photo_variants.json`. It never edits or
removes the originals. It verifies their SHA-256 hashes before and after
generation and prints the hashes and card-download totals.

- Cards: short edge 320/480 px; professor 400/640 px, plus the first expanded
  variant (up to long edge 1280 px) for high-DPI displays. Templates request
  additional sampling resolution to retain fine detail after browser scaling.
- Expanded photos: long edge 1280/2048/3072 px and the original resolution.
- No upscaling or cropping; EXIF orientation is applied before resizing.
- WebP quality 95, Lanczos resizing, lossless alpha, retained ICC profiles.
  Camera/editor metadata is omitted from derivatives.
- If an original-resolution WebP would be larger, the optimized directory
  receives a byte-identical copy of the original instead. Resized cards never
  fall back to a larger-resolution original.
- Duplicate resolutions share one file. Source-content and recipe hashes in
  filenames make browser caching safe. A repeat run reuses the same assets.
- Existing CSS crop, object position, and scale remain the template's job.

The manifest maps each original filename to its oriented `width`/`height` and
ascending `card`/`full` arrays of `{path, width, height, bytes}`. Paths start
with `/assets/img/optimized/`. Old derivatives are not automatically deleted.
When changing the encoder commands, increment `RECIPE_VERSION` in the script;
changing `--quality` or the ImageMagick version already changes the recipe hash.
