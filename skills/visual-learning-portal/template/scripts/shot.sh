#!/bin/sh
# Screenshot of a page of the running dev server with headless Chrome (to check diagrams).
# Usage: scripts/shot.sh <route> <out.png> [width] [height]
#   scripts/shot.sh /topics/binary-search /tmp/topic.png 1200 4000
#   THEME=dark scripts/shot.sh /simulators/handshake /tmp/hs-dark.png
# Env: PORT (dev server port, default 3000), THEME=dark|light (forces prefers-color-scheme;
#      default: follow the OS),
#      CHROME (browser binary; default: Google Chrome on macOS, else google-chrome/chromium).
PORT="${PORT:-3000}"
URL="http://localhost:$PORT$1"
OUT="$2"
W="${3:-1200}"
H="${4:-4000}"
if [ -z "$CHROME" ]; then
  if [ -x "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome" ]; then
    CHROME="/Applications/Google Chrome.app/Contents/MacOS/Google Chrome"
  else
    CHROME="$(command -v google-chrome || command -v chromium || command -v chromium-browser)"
  fi
fi
# Without THEME the page follows the OS appearance.
DARK=""
[ "$THEME" = "dark" ] && DARK="--force-dark-mode --blink-settings=preferredColorScheme=0"
[ "$THEME" = "light" ] && DARK="--blink-settings=preferredColorScheme=1"
PROFILE="$(mktemp -d)"
rm -f "$OUT"
"$CHROME" --headless=new --disable-gpu --hide-scrollbars $DARK \
  --user-data-dir="$PROFILE" --window-size="$W,$H" --virtual-time-budget=5000 \
  --screenshot="$OUT" "$URL" >/dev/null 2>&1 &
PID=$!
# With the dev server (HMR) Chrome does not always exit by itself: wait for the file, then stop it.
i=0
while [ $i -lt 60 ] && [ ! -s "$OUT" ]; do sleep 1; i=$((i + 1)); done
sleep 1
kill $PID 2>/dev/null
wait $PID 2>/dev/null
rm -rf "$PROFILE"
ls -la "$OUT"
