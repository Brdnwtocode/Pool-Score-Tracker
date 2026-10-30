---
title: 21N2 Championship Pool Scoreboard
type: note
tags: [billiards, pwa, offline, scoreboard, vanilla-js]
project: Projects
updated: 2026-10-14
summary: >
  Dual-mode billiards scoreboard for cash ring games and WPA tournament frames — plain HTML/CSS/JS, fully offline-capable and installable.
---

# 21N2 Championship Pool Scoreboard

Dual-mode billiards scoreboard for cash ring games (zero-sum) and WPA tournament
frames (race-to-X + shot clock, Chinese pool +4/+7/+10 support). Plain HTML/CSS/JS — no build step, no backend,
**fully offline-capable, battery-optimized, and installable**.

## Key Features

- **Dual Mode (Cash vs. Tournament)**: Isolated state and memories.
- **Cash Mode Cockpit**: Quick step buttons (`-2, +2, -3, +3, -4, +4, -5, +5`), zero-sum audit highlighting (`.hotcell`) whenever the table is unbalanced ($\ne 0$), and natural free-scrolling layout without intrusive snap.
- **Tournament Pool Formats**: Toggle between American (±1) and Chinese Pool (Heyball: +4 standard rack win, +7 table run, +10 break & run).
- **Smart History Narrative**: Action logs coalesce rapid single-tap streaks and explicitly display score transitions (e.g. `Player A +3 (12 → 15)`) rather than spamming individual `+1` / `-1` rows.
- **Redesigned Shot Clock**: 1/3 horizontal width allocated to massive high-contrast digits, 2/3 for controls, session elapsed timer, and intense 5-second critical warnings with escalating audio feedback.
- **Clean Viewport Snapping**: In tournament mode, player cards snap cleanly to fill the screen on scroll and unsnap when scrolling past with optimized scroll margins on desktop to prevent premature snapping.
- **Battery Life Preservation**: CSS rendering containment (`contain: layout style paint`), deep OLED-friendly dark theme, passive gesture listeners, and tab visibility change handlers that release wake locks and freeze background timer churn.


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
