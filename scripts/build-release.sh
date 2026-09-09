#!/usr/bin/env bash
#
# Packages the extension into releases/mouse-odometer-v<version>.zip, ready to
# upload to the Chrome Web Store.
#
# Only what the extension actually loads goes in: the manifest, options.html and
# public/. README.md, screenshots/ and the git metadata are repo furniture and
# the store rejects nothing for their absence -- they just bloat the upload.
# macOS resource forks (.DS_Store, __MACOSX/) are excluded too; Finder's
# "Compress" put them in the old zips and the store flags them.

set -euo pipefail

cd "$(dirname "$0")/.."

VERSION=$(node -p "require('./manifest.json').version")
OUT_DIR="releases"
OUT="$OUT_DIR/mouse-odometer-v$VERSION.zip"

# Every path the manifest or options.html references, plus their dependencies.
CONTENTS=(manifest.json options.html public)

for path in "${CONTENTS[@]}"; do
  if [ ! -e "$path" ]; then
    echo "error: missing $path" >&2
    exit 1
  fi
done

mkdir -p "$OUT_DIR"
rm -f "$OUT" # zip appends to an existing archive rather than replacing it

zip -r -q -X "$OUT" "${CONTENTS[@]}" \
  -x "*.DS_Store" "__MACOSX/*" "*/.*"

echo "Built $OUT ($(du -h "$OUT" | awk '{print $1}'))"
unzip -Z1 "$OUT" | sed 's/^/  /'
