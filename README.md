# 21N2 · Billiards Related Tools and WebApps

[![GitHub Pages](https://img.shields.io/badge/GitHub%20Pages-Live%20Demo-black?style=flat-square&logo=github)](https://brdnwtocode.github.io/21N2-BILLIARDS-RELATED-TOOLS-AND-WEBAPPS/)
[![License: MIT](https://img.shields.io/badge/License-MIT-black?style=flat-square)](LICENSE)
[![Platform](https://img.shields.io/badge/Platform-Web%20%7C%20Mobile%20PWA-black?style=flat-square)](#)
[![Design](https://img.shields.io/badge/Design-Monochrome%20Editorial-black?style=flat-square)](#design-system--architecture)

> A precision, client-side billiards toolset and mobile-first scoreboard engineered for tournament match play and casual ring games. Built with a strict **Monochrome Editorial** design language—zero external runtime dependencies, 100% offline-ready, and optimized for touch devices.

---

## 🎱 Live Application

Experience the live web app on GitHub Pages:

### 👉 **[Launch Pool Scoreboard Live →](https://brdnwtocode.github.io/21N2-BILLIARDS-RELATED-TOOLS-AND-WEBAPPS/)**

*(Direct URL: `https://brdnwtocode.github.io/21N2-BILLIARDS-RELATED-TOOLS-AND-WEBAPPS/pool-scoreboard/`)*

---

## 📸 Key Features & Capabilities

### ⏱️ Pro Shot Clock & Timer
- **Dual Time Presets:** Instant toggle between standard **30-second** and **45-second** shot clocks.
- **`+30s EXT` Extension:** One-tap extension grant (capped at 90s) per tournament regulations.
- **Tournament Audio Cues:** 
  - Soft warning tick at **10s**.
  - Critical second-by-second countdown beeps from **5s down to 1s** (880Hz tone).
  - High-impact foul buzzer at **0s** with visual red alert and mobile haptic pulse.

### 💵 Money & Stakes Settlement Calculator
- **Configurable Rate:** Tap the `$1.00/PT` chip in the top utility palette to configure custom stakes (`$0.50`, `$1.00`, `$2.00`, `$5.00`, `$10.00` or custom numeric entry).
- **Pairwise Differential Engine:** Calculates multi-player pool ring game earnings based on head-to-head rack differentials.
- **Who Pays Whom Ledger:** Displays real-time net stakes directly on each player card (`+$6.00`, `-$4.00`) and generates an audited, minimum-transfer settlement breakdown (e.g. *“Player 2 pays Player 1: $6.00”*).

### ↺ Undo / Redo Action Stack
- Full in-memory history stack to roll back or re-apply accidental point increments or decrements.
- Synchronizes with the chronological rack audit ledger automatically.

### 🔊 Authentic Sound & Haptic Feedback
- **Synthesized Billiard Ball Strike:** Generates a crisp, resonant phenolic resin ball collision sound using the **Web Audio API** (no audio files, 0ms latency, zero bandwidth).
- **Haptic Vibration:** Built-in `navigator.vibrate` tactile feedback on touch devices for every point registered or shot clock expiration.
- **One-Tap Mute:** Quick toggle via the speaker icon in the utility palette.

### 📜 Chronological Rack History with 180s Gradual Blur
- Audits every winning rack with timestamps: `R-01 · Nam Hào · +1 · 19:48`.
- **180s Focus Mode:** To prevent table distractions during long matches, the ledger automatically fades and applies a subtle blur (`filter: blur(4px); opacity: 0.22`) after 180 seconds of idle time.
- **Tap to Wake:** Tapping anywhere on the ledger or registering a new rack immediately returns the ledger to razor-sharp focus.

### 💾 Zero-Latency Auto-Save (LocalStorage)
- Preserves all player rosters, custom names, current scores, breaker status, stake rates, history logs, shot clock settings, sound preferences, and theme choices.
- Refreshing the browser, locking your phone, or switching tabs will never wipe your match.

### ⚖️ Table Balance & Audit Telemetry
- Monitors zero-sum points and match dominance in real time.
- Indicates match leader, point spread, and rack milestones.

### 🛡️ Safety Hold-to-Reset
- Prevents accidental match resets: requires holding the reset button for **2 full seconds** with a live visual progress indicator before wiping the board.

---

## 🎨 Design System & Architecture

The application strictly implements the **Monochrome Editorial** design system documented in [`reference/DESIGN.md`](pool-scoreboard/reference/DESIGN.md):

| Dimension | Specification |
|:---|:---|
| **Geometry** | Strictly sharp corners (`border-radius: 0px` mandate across all buttons, inputs, tags, and cards). |
| **Typography** | • **Headlines & Scores:** *Newsreader* (archival serif)<br>• **Names & Body:** *Inter* (optical legibility)<br>• **Metrics & Tags:** *JetBrains Mono* (monospaced tabular alignment) |
| **Elevation** | Completely flat architecture. Zero drop shadows or artificial glows. Depth achieved via 1px hairline rules and contrast inversion. |
| **Themes** | High-contrast Monochrome Dark (charcoal ink `#0D0E0F`) and Monochrome Light (stark paper `#FFFFFF`). |
| **Mobile First** | Touch targets >= 44px, zero layout shift, adaptive fluid layout from mobile single-column to wide-screen bento grids. |

---

## ℹ️ Author, Portfolio & Contact

You can access developer and system information directly inside the web app by tapping the **`(i)` info icon** in the top utility palette.

### Lead Developer: **Phạm Nam Hào** (`@Brdnwtocode`)

- 🌐 **GitHub Profile:** [github.com/Brdnwtocode](https://github.com/Brdnwtocode)
- 📁 **Repository:** [21N2-BILLIARDS-RELATED-TOOLS-AND-WEBAPPS](https://github.com/Brdnwtocode/21N2-BILLIARDS-RELATED-TOOLS-AND-WEBAPPS)
- ✉️ **Direct Contact / Email:** [phmnamhao@gmail.com](mailto:phmnamhao@gmail.com)
- 💼 **Portfolio:** [Brdnwtocode's GitHub Projects](https://github.com/Brdnwtocode?tab=repositories)

---

## 🚀 Getting Started & Local Usage

This project is built with vanilla web standards and requires no build pipeline, bundler, or Node.js server.

### Option 1: Direct Browser Access
Simply clone or download the repository and open `pool-scoreboard/index.html` in any modern web browser:

```bash
git clone https://github.com/Brdnwtocode/21N2-BILLIARDS-RELATED-TOOLS-AND-WEBAPPS.git
cd 21N2-BILLIARDS-RELATED-TOOLS-AND-WEBAPPS
# Open pool-scoreboard/index.html in Chrome, Safari, Edge, or Firefox
```

### Option 2: Local HTTP Server (Optional)
To test audio APIs and Service Worker capabilities locally:

```bash
# Using Python 3
python -m http.server 8000

# Using Node.js npx
npx serve .
```
Navigate to `http://localhost:8000/`.

---

## 📄 License

This project is open-source under the [MIT License](LICENSE). Feel free to adapt and use it for your club or tournament matches.