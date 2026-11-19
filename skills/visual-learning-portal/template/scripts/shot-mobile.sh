#!/bin/sh
# Screenshot of a page at 390 px wide (a phone), inside an iframe: headless Chrome does
# not shrink its window below ~500 px, so scripts/shot.sh cannot go that narrow.
# Usage: scripts/shot-mobile.sh <route> <out.png> [height]
# Env: PORT (default 3000), THEME=dark|light, CHROME (see scripts/shot.sh).
PORT="${PORT:-3000}"
R="$1"; OUT="$2"; H="${3:-1600}"
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
D="$(mktemp -d)"
cat > "$D/f.html" <<HTML
<!doctype html><html><body style="margin:0;background:#888"><iframe src="http://localhost:$PORT$R" style="width:390px;height:${H}px;border:0;display:block"></iframe></body></html>
HTML
"$CHROME" --headless=new --disable-gpu --hide-scrollbars $DARK \
  --user-data-dir="$D/p" --window-size=600,$H --virtual-time-budget=6000 --screenshot="$OUT" "file://$D/f.html" >/dev/null 2>&1
rm -rf "$D"
ls -la "$OUT"
