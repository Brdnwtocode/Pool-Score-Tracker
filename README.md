# 21N2 Billiards Related Tools and WebApps

A collection of billiards/pool related tools and web applications.

## 🎱 Pool Scoreboard

A precision, high-contrast monochrome editorial scoreboard engineered for mobile-first pool match and ring game scoring.

**[Live Demo on GitHub Pages →](https://brdnwtocode.github.io/21N2-BILLIARDS-RELATED-TOOLS-AND-WEBAPPS/pool-scoreboard/)**

### Features

- **Strict Mobile-First & Monochrome Editorial Design**: Inspired by Swiss print and architectural monographs (`DESIGN.md`). Flat 0px sharp geometry, Newsreader serif headers, and JetBrains Mono metrics.
- **Undo / Redo System**: Full action stack to instantly roll back or re-apply accidental score changes without manual math.
- **Money / Stakes Calculator**: Set custom rates per point/rack (e.g., `$1.00`, `$2.00`). Automatically computes pairwise differentials and shows exactly who pays whom at the end of the night.
- **Tournament Shot Clock**: Switchable 30s / 45s countdown timer with +30s extension button and tournament audio countdown beeps (warning at 10s, critical beeps 5-1s, foul buzzer).
- **Audio & Haptic Feedback**: Realistic synthesized billiard ball strike clicks (via Web Audio API, zero audio file downloads needed) and mobile haptic vibration on button taps.
- **Auto-Save (LocalStorage)**: Automatically preserves player rosters, scores, stakes rates, and history so refreshing the browser never loses your game.
- **Chronological Rack History with 180s Gradual Blur**: Live rack-by-rack audit log that stays active during play and slowly blurs out after 180 seconds to maintain table focus. Tapping the ledger immediately wakes it back into focus.
- **Zero-Sum / Balance Audit**: Real-time telemetry monitoring table balance and match leadership.
- **Safety Hold-to-Reset**: Tactile 2-second hold interaction to prevent accidental match wipes.
- **Light & Dark Mode**: High-contrast monochrome editorial themes.

### Usage

Open `pool-scoreboard/index.html` in any web browser or visit the GitHub Pages link.