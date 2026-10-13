#!/bin/bash
# Builds TVRemote.app (ad-hoc signed) next to this script. Run on your Mac.
set -euo pipefail
cd "$(dirname "$0")"
swift build -c release
APP=TVRemote.app
rm -rf "$APP"
mkdir -p "$APP/Contents/MacOS"
cp .build/release/TVRemote "$APP/Contents/MacOS/"
cp Info.plist "$APP/Contents/"
codesign --force --sign - "$APP"
echo "Built $APP — run: open $APP"
