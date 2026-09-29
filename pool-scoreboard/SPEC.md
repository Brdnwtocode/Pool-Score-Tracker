# Pool Scoreboard — Functionality Specification

> **Source of Truth (v3.2.0 Precision Dual-Memory Edition)**
> This document defines every feature, behavior, and constraint of the Pool Scoreboard web application.
> Key Features in v3.2.0:
> 1. **100% Isolated Dual-Mode Memory:** Independent players, scores, histories, stakes, and undo/redo stacks for Cash Ring Game and Tournament modes.
> 2. **Upper Card Integrated Balance Bar:** Zero-sum balance status integrated directly inside the top cash telemetry card.
> 3. **Full History Logging:** Records all score actions (both increments `+` and decrements `−`, multi-point adjustments, undo/redo).
> 4. **0.7s Fast Direct Score Drag:** Reduced to 700ms, zero modal overlay, updating digits directly in-place on player cards with live haptic feedback.
> 5. **Bilingual VI / EN Localization:** Instant switch between Vietnamese and English across all UI labels, controls, modals, and toasts.

---

## 1. Dual-Mode Architecture with 100% Isolated Memory

### 1.1 Complete Memory Isolation
- The application stores two completely independent state stores in memory and `localStorage`:
  - `state.cash`: Players, scores (supports zero-sum negative points), stake rate, shot clock duration, history ledger, and undo/redo stacks.
  - `state.tournament`: Players, scores (strictly non-negative frames), stake rate, target race, shot clock duration, history ledger, and undo/redo stacks.
- Toggling between `💰 CASH RING` and `🏆 TOURNAMENT` displays two separate trackers. Scoring actions, added players, or resets in Cash mode never leak into or alter Tournament mode, and vice versa.

### 1.2 The Mode Switcher
- Located directly in the top masthead next to the table identifier.
- Two interactive pill toggles:
  - `💰 CASH RING` (Zero-sum betting)
  - `🏆 TOURNAMENT` (Official WPA race-to-X)

---

## 2. Ultra-Clean Player Cards & 0.7s Fast Direct Score Drag

### 2.1 Card Layout
- Cards contain solely:
  1. **Player Name:** Large serif input field (editable; pressing **Enter** commits).
  2. **Score Control Row:** Tactile `−` button, massive digits, tactile `+` button.
- All extraneous breaker pills, seat tags, and card footers are omitted for an ultra-clean, high-visibility aesthetic.

### 2.2 0.7-Second Hold & Direct Drag Gesture (1 to 12 Points)
- **Normal Tap (< 700ms):**
  - Increments or decrements score by `1` point.
- **Hold for 0.7s (≥ 700ms):**
  - Unlocks fast in-place scrubbing directly on the card digits (no modal popups).
  - Digits element enters `.scrubbing-live` state (amber highlight and gentle scale).
  - Emits unlock tone and haptic pulse.
- **Vertical Drag:**
  - Dragging up or down dynamically scales adjustment between `1` and `12` points (clamped).
  - Directly updates the card digits in real time with audio and haptic feedback per point step.
- **Release (Pointer Up):**
  - Commits the exact points selected in one atomic score action.
  - Pushes to undo stack and logs the action into history immediately.

---

## 3. Mode 1: Cash Ring Game ("Dưa Hết Tiền Đây")

### 3.1 Zero-Sum Scoring Engine
- Negative scores are fully supported (e.g. `+20`, `-11`, `-12`).
- Score formatting: Negative scores display cleanly as `-1`, `-3`, `-11` without zero-padding; positive scores display as `00`, `08`, `20`.

### 3.2 Integrated Upper Card Zero-Sum Balance Readout
- Evaluates the true mathematical sum across all players:
  $$\text{Discrepancy} = \sum_{i=1}^{N} \text{Score}_i$$
- Embedded directly inside the upper `.cash-telemetry-bar` alongside stake and settlements buttons:
  - **Balanced State ($\text{Discrepancy} = 0$):**
    - Dot: Solid green (`#22c55e`).
    - Text: `ZERO-SUM BALANCED (0)` / `CÂN BẰNG TỔNG 0 (0)`
    - Number: `BALANCED` / `CÂN BẰNG`
    - Hotcell: **OFF**
  - **Unbalanced State ($\text{Discrepancy} \neq 0$):**
    - Dot: Pulsing amber alert (`#f59e0b`).
    - Text: `TABLE UNBALANCED (+X)` / `BÀN CHƯA CÂN BẰNG (LỆCH +X)`
    - Number: `+X` or `-X`
    - Hotcell: **ON** (all player cards illuminate with subtle contrast border).

### 3.3 Pairwise Settlement & Cash Transfers
- Each player's net earnings = $\text{Score} \times \text{Stake Rate}$.
- "WHO PAYS WHOM" / "AI TRẢ TIỀN AI" button opens direct debtor-to-creditor transfers minimizing transactions.

### 3.4 Compact Shot Clock
- Sleek 1-row horizontal pill in the cash bar (`45s [START] [+30s] [↻]`).

---

## 4. Mode 2: Tournament Frame (WPA Championship)

### 4.1 Race-to-X Rules
- Scores represent frames won and are strictly non-negative ($0$ to $\text{Race Target}$). Decrementing below 0 is rejected.
- Selectable targets: Race to 7, 9, 11, 15, 21.
- Milestone Alert: Reaching target race triggers championship toast and halts shot clock.

### 4.2 Precision Shot Clock Hero
- Full-sized tournament countdown card:
  - Modes: 30S, 45S, 60S chips.
  - Large Newsreader serif digits with live status chips (`STANDBY`, `RUNNING`, `TIME FOUL`).
  - Smooth 1px progress line bar.
  - `+30S EXT` extension button (tracks 1/1 extensions).
  - Audio beeps at 10s and 5s–1s, foul buzzer at 0s.

### 4.3 Inverted Black Telemetry Strip
- Broadcast TV HUD band displaying table ID, frame status, active lead (`LEAD: J. ARCHER (+4)`), and delta.

---

## 5. Universal Chronological Rack History with Full Logging

- Available in both Cash and Tournament modes.
- **Full Logging:** Records all actions (both increments `+` and decrements `−`).
- Positive deltas styled in green/neutral; negative deltas styled in accent red.
- 180s focus-blur protection with `WAKE` button.
- **`MORE INFO` / `LESS INFO` Toggle Button:**
  - **Compact View:** Action #, Player Name, Delta (`+X` / `−X`), Time.
  - **Extended View:** Full table score snapshot at that frame (e.g. `Johnny: 12 · Shane: 8`) and balance/lead status at the time of scoring.

---

## 6. Bilingual VI / EN Localization Engine

- Masthead toggle button: `#btnLang` (`VI` / `EN`).
- 100% dictionary translations for English and Vietnamese.
- Fully localized:
  - Table badges and mode titles.
  - Shot clock readouts, buttons, and foul alerts.
  - Stakes, pots, and settlement transfer instructions.
  - Player card labels and placeholders.
  - Action buttons (`ADD PLAYER`, `REMOVE`, `HOLD 2S RESET`).
  - History drawer and empty states.
  - Modals (Stakes & Settlements, System Specifications).
  - System toasts and notifications.

---

## 7. Universal Ergonomics & Device Support

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
