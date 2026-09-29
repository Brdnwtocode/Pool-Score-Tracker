# Pool Scoreboard — Functionality Specification

> **Source of Truth (v3.0.0 Dual-Mode Edition)**
> This document defines every feature, behavior, and constraint of the Pool Scoreboard web application.
> It introduces a dual-mode engine allowing players to toggle instantly between:
> 1. **Cash Ring Game Mode** (Original "Dưa Hết Tiền Đây" zero-sum betting).
> 2. **Tournament Frame Mode** (WPA Championship race-to-X rules with precision shot clock).

---

## 1. Dual-Mode Architecture

### 1.1 The Mode Switcher
- Located directly in the top masthead next to the table identifier.
- Two interactive pill toggles:
  - `💰 CASH RING` (Default)
  - `🏆 TOURNAMENT`
- Toggling modes dynamically swaps the viewports, rule engines, and telemetry displays while preserving player names and core preferences.

---

## 2. Mode 1: Cash Ring Game ("Dưa Hết Tiền Đây")

### 2.1 Zero-Sum Scoring Engine
- Designed for cash betting and ring games where every point won offsets a point lost.
- Negative scores are fully supported (e.g. `Johnny Archer: +20`, `Francisco Bustamante: -11`, `Efren Reyes: +13`, `Earl Strickland: -12`).
- Score formatting: Negative scores display naturally as `-1`, `-3`, `-11` without zero-padding; positive scores display as `00`, `08`, `20`.

### 2.2 Mathematically Bulletproof Zero-Sum Balance Bar
- Evaluates the true mathematical sum across all players:
  $$\text{Discrepancy} = \sum_{i=1}^{N} \text{Score}_i$$
- **Balanced State ($\text{Discrepancy} = 0$):**
  - Dot: Solid green (`#22c55e`).
  - Text: `ZERO-SUM BALANCED (0)`
  - Number: `BALANCED`
  - Hotcell: **OFF** (cards remain in crisp surface dark theme).
- **Unbalanced State ($\text{Discrepancy} \neq 0$):**
  - Dot: Pulsing amber alert (`#f59e0b`).
  - Text: `TABLE UNBALANCED (+10 DISCREPANCY)`
  - Number: `+10` (or negative offset).
  - Hotcell: **ON** (all player cards illuminate with a subtle `rgba(255, 255, 255, 0.45)` border and `#1a1b1f` elevation).

### 2.3 Pairwise Settlement & Cash Transfers
- Each player's net earnings = $\text{Score} \times \text{Stake Rate}$.
- "WHO PAYS WHOM" button in the cash bar opens a direct debtor-to-creditor transfer ledger minimizing cash transactions (e.g. *Francisco pays Johnny $11.00*).

### 2.4 Compact Shot Clock
- Sleek 1-row horizontal pill in the cash bar (`45s [START] [+30s] [↻]`). Provides shot clock capability without consuming 50% of the screen.

---

## 3. Mode 2: Tournament Frame (WPA Championship)

### 3.1 Race-to-X Rules
- Scores represent frames won and are strictly non-negative ($0$ to $\text{Race Target}$). Decrementing below 0 is rejected.
- Selectable targets: Race to 7, 9, 11, 15, 21.
- Milestone Alert: Reaching the target race triggers a championship toast and halts the shot clock.

### 3.2 Precision Shot Clock Hero
- Full-sized tournament countdown card:
  - Modes: 30S, 45S, 60S chips.
  - Large Newsreader serif digits with `SEC REMAINING` and live status chips (`STANDBY`, `RUNNING`, `TIME FOUL`).
  - Smooth 1px progress line bar.
  - `+30S EXT` extension button (tracks $1/1$ extensions).
  - Tournament audio beeps at 10s and 5s–1s, foul buzzer at 0s.

### 3.3 Inverted Black Telemetry Strip
- Broadcast TV HUD band displaying table ID, frame status, active lead (`LEAD: J. ARCHER (+4)`), and delta.

### 3.4 Chronological Rack Ledger
- Expandable audit drawer logging rack winners with timestamps and 180s focus-blur protection.

---

## 4. Player Roster Management (2 to 4 Players)

- Starts with 2 players by default.
- `+ ADD PLAYER (N/4)` adds up to 4 players (flashes red at cap).
- `− REMOVE` removes down to 1 player (flashes red at floor).
- Names are editable inline; pressing **Enter** commits.
- Breaker toggle allows one active breaker at a time; `SWAP SEAT / BREAK` advances the break sequentially.

---

## 5. Universal Ergonomics & Device Support

- **Screen Wake Lock:** Active by default on all modern devices via `navigator.wakeLock`. Automatically re-acquired on tab focus.
- **Fullscreen API:** One-tap toggle in the masthead.
- **Web Audio API:** Synthetic resin ball strike clicks on every score change.
- **Keyboard Shortcuts:**
  - `Space`: Start / Pause Shot Clock
  - `Q` / `W`: Player 1 Decrement / Increment
  - `O` / `P`: Player 2 Decrement / Increment
  - `E`: Claim +30s Extension
  - `R`: Reset Shot Clock
  - `Ctrl+Z`: Undo Last Action
- **Offline Progressive:** Zero build tools, 100% client-side HTML/CSS/JS deployed directly to GitHub Pages.
