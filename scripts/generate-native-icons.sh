#!/usr/bin/env bash
set -euo pipefail

PROJECT_ROOT="$(cd "$(dirname "$0")/.." && pwd)"
ICON_SRC="$PROJECT_ROOT/public/accord-icon.png"
RES_DIR="$PROJECT_ROOT/android/app/src/main/res"

if [ ! -f "$ICON_SRC" ]; then
  echo "🚫 Icon not found at $ICON_SRC"
  exit 1
fi

# densities and target sizes (px)
declare -A sizes
sizes=(
  [mipmap-mdpi]=48
  [mipmap-hdpi]=72
  [mipmap-xhdpi]=96
  [mipmap-xxhdpi]=144
  [mipmap-xxxhdpi]=192
)

# Helper: resize using convert if available
function resize() {
  local src="$1"; local dest="$2"; local size="$3"
  if command -v convert >/dev/null 2>&1; then
    convert "$src" -resize "${size}x${size}" -background transparent -gravity center -extent "${size}x${size}" "$dest"
  else
    # fallback: copy (android will scale resize at runtime)
    cp "$src" "$dest"
  fi
}

# Create fallback directories if missing
for dir in "${!sizes[@]}"; do
  mkdir -p "$RES_DIR/$dir"
done

# Place icons
for dir in "${!sizes[@]}"; do
  size=${sizes[$dir]}
  echo "🔧 Generating icons into $dir (size ${size}x${size})"
  resize "$ICON_SRC" "$RES_DIR/$dir/ic_launcher.png" $size
  resize "$ICON_SRC" "$RES_DIR/$dir/ic_launcher_round.png" $size
  resize "$ICON_SRC" "$RES_DIR/$dir/ic_launcher_foreground.png" $size
  # Also copy xml if not present or keep existing
done

# Copy adaptive icon foreground to anydpi (if exists)
mkdir -p "$RES_DIR/mipmap-anydpi-v26"
if [ -f "$RES_DIR/mipmap-anydpi-v26/ic_launcher.xml" ]; then
  echo "🔁 Keeping existing adaptive icon xml"
else
  cat > "$RES_DIR/mipmap-anydpi-v26/ic_launcher.xml" <<EOF
<?xml version="1.0" encoding="utf-8"?>
<adaptive-icon xmlns:android="http://schemas.android.com/apk/res/android">
    <background android:drawable="@color/ic_launcher_background" />
    <foreground android:drawable="@mipmap/ic_launcher_foreground" />
</adaptive-icon>
EOF
  echo "✅ Created mipmap-anydpi-v26/ic_launcher.xml"
fi

# Update splash file if present to use new icon (optional)
if [ -f "$RES_DIR/drawable/splash.png" ]; then
  echo "🔁 Replacing splash with icon (optional)"
  resize "$ICON_SRC" "$RES_DIR/drawable/splash.png" 512
fi

# Update the AndroidManifest (icon and roundIcon) if necessary - keep existing settings if already using @mipmap/ic_launcher
MANIFEST="$PROJECT_ROOT/android/app/src/main/AndroidManifest.xml"
if [ -f "$MANIFEST" ]; then
  # This is a no-op if already set correctly
  echo "🔁 Ensuring manifest uses @mipmap/ic_launcher"
  # Replace icon references that are not using @mipmap/ic_launcher (simple replace)
  # Replace icon attributes safely (use '|' as delimiter to avoid '@' collision)
  sed -i 's|android:icon="[^"]*"|android:icon="@mipmap/ic_launcher"|g' "$MANIFEST" || true
  sed -i 's|android:roundIcon="[^"]*"|android:roundIcon="@mipmap/ic_launcher_round"|g' "$MANIFEST" || true
fi

echo "✅ Native Android icons updated"
exit 0
