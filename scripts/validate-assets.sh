#!/usr/bin/env bash
# Validate and convert raster assets to sRGB (lossless profile strip + 24-bit)
# Requires ImageMagick (magick/convert + identify) or GraphicsMagick.
# Usage: ./scripts/validate-assets.sh <assets-dir>

ASSETS_DIR=${1:-public/assets}

if ! command -v magick >/dev/null 2>&1 && ! command -v identify >/dev/null 2>&1; then
  echo "ImageMagick not found. Install it to use this script (brew/apt)."
  exit 1
fi

echo "Scanning ${ASSETS_DIR} for embedded color profiles and wide-gamut images..."

find "$ASSETS_DIR" -type f \( -iname "*.png" -o -iname "*.jpg" -o -iname "*.jpeg" -o -iname "*.webp" \) | while read -r file; do
  echo "\nFILE: $file"
  # Print embedded profile info
  if command -v magick >/dev/null 2>&1; then
    magick identify -verbose "$file" | grep -E "Profiles|Profile-icc|Color space|colorspace" || true
  else
    identify -verbose "$file" | grep -E "Profiles|Profile-icc|Color space|colorspace" || true
  fi
  # Check bit depth
  if command -v magick >/dev/null 2>&1; then
    magick identify -format "BitDepth: %z\n" "$file" || true
  else
    identify -format "BitDepth: %z\n" "$file" || true
  fi
done

cat <<'EOF'

Recommendations (manual steps):
- Re-export original source assets from Figma/Photoshop with profile: sRGB IEC61966-2.1
- For PNG/JPEG/WebP: embed sRGB profile, 8-bit per channel (24-bit RGB), and strip other profiles
- Prefer SVG for icons/logos; ensure `fill`/`stop-color` values are hex sRGB

Quick convert (destructive) example using ImageMagick to convert and strip profiles:
magick mogrify -path out/ -format png -strip -colorspace sRGB -quality 100 -define png:bit-depth=8 -alpha remove -depth 8 "${ASSETS_DIR}/*"

EOF
