# 21N2 Championship Pool Scoreboard

Dual-mode billiards scoreboard for cash ring games (zero-sum) and WPA tournament
frames (race-to-X + shot clock). Plain HTML/CSS/JS — no build step, no backend,
**fully offline-capable and installable**.

## Offline / installable app

The app works with the device in airplane mode after a single online visit.

| File | Purpose |
|---|---|
| `sw.js` | Service worker. Precaches the app shell + every font file referenced by the CSS, then serves `navigations` network-first, `fonts` cache-first, and other assets stale-while-revalidate. |
| `manifest.webmanifest` | Installs to the home screen as a standalone app, with two launch shortcuts (`?mode=cash`, `?mode=tournament`). |
| `fonts/` | Vendored Inter / JetBrains Mono / Newsreader (19 subsets) + Material Symbols (316 KB static instance). No CDN at runtime. |
| `icons/` | 192 / 512 / maskable-512 / apple-touch-180 PNGs generated from the 8-ball mark. |
| `tools/vendor-fonts.ps1` | Re-downloads the fonts and rewrites `css/*.css` to local paths. |
| `tools/make-icons.py` | Regenerates the PNG icon set (needs `pillow`). |

### Why the fonts are vendored

The entire UI is icon-font driven. When the icons came from `fonts.googleapis.com`
with `display=swap`, an offline reload rendered raw ligature words (`timer`,
`add`, `remove`) instead of icons — the "OFFLINE READY" badge was a lie. All
fonts now live in `fonts/`, and the badge only appears once a service worker is
actually controlling the page.

## Deploy

Pushing to `main` publishes the repo root to GitHub Pages
(`.github/workflows/jekyll-gh-pages.yml` uploads `path: '.'`). All paths are
relative, so it works from a subpath such as
`https://<user>.github.io/Pool-Score-Tracker/`.

Service workers require **http(s)** — they are skipped on `file://`, where the
app still runs fine but cannot be installed or used offline.

### Local check

```powershell
c:/python314/python.exe -m http.server 8177 --bind 127.0.0.1
# then open http://127.0.0.1:8177/
```

## Install on a device

- **Android / Chrome / Edge** — the browser shows an install prompt; it also
  appears as *INSTALL ON THIS DEVICE* inside the profile (person) → About modal.
- **iOS Safari** — Share → **Add to Home Screen** (iOS does not expose
  `beforeinstallprompt`, so no button is shown).

## Maintenance

**Changed CSS/JS/fonts?** Bump `VERSION` in `sw.js` so clients pick up the new
files — old caches are deleted on activate, and the page shows a "new version
ready" toast when an update installs.

**Regenerate fonts** (e.g. to change the icon axes):

```powershell
powershell -ExecutionPolicy Bypass -File tools/vendor-fonts.ps1
```

The service worker discovers font URLs from the CSS itself, so the precache list
never goes stale. If you replace the icon font, re-apply the trimmed instance
themes: Google serves the full variable font (~3.9 MB) at
`opsz,wght,FILL,GRAD@20..48,100..700,0..1,-50..200`, while the static instance
`opsz,wght,FILL,GRAD@24,400,0,0` is ~316 KB. The app never uses
`font-variation-settings`, so the static instance is strictly better.

**Regenerate icons:**

```powershell
c:/python314/python.exe tools/make-icons.py
```

## Offline footprint

~1.0 MB total precache: icons 316 KB + text fonts 630 KB + app shell ~90 KB.
Font files load lazily on first use as well, so a subset missing from the
precache still renders once it has been seen online.
