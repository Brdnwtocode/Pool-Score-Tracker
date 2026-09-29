# Pool Scoreboard — Functionality Specification

> **Source of Truth (v2.5.0 WPA Championship Edition)**
> This document defines every feature, behavior, and constraint of the Pool Scoreboard web application. All architectural design strictly adheres to the editorial telemetry HUD layout (`media_1790689465780.png`).

---

## 1. Ergonomics & Display Protocols

### 1.1 Keep Screen Awake (Screen Wake Lock)
- **Active by default (no toggle needed).**
- Automatically acquires `navigator.wakeLock.request('screen')` on page load.
- Re-acquires the lock automatically on `visibilitychange` when returning to the tab so the screen never dims or locks while resting on the pool table rail.

### 1.2 Fullscreen Mode
- Top masthead button with fullscreen icon (`fullscreen` / `fullscreen_exit`).
- Toggles between native fullscreen viewport and browser chrome on mobile and desktop devices.

---

## 2. Player Roster Management (2 to 4 Players)

### 2.1 Default State
- App launches with **2 players** (e.g. "Johnny Archer" as active breaker, "Shane Van Boening").
- Each player has: unique ID, editable name, score (CURRENT FRAMES), breaker flag, and telemetry stats.

### 2.2 Add Player
- Button: **ADD PLAYER (N/4)**.
- Adds a player to the match array.
- **Hard cap: 4 players maximum.** If the user tries to add a 5th, the button flashes red and displays a toast ("Maximum 4 players allowed").

### 2.3 Remove Player
- Button: **REMOVE**.
- Removes the **last** player from the array.
- **Hard floor: 1 player minimum.** If only 1 player remains, the button flashes red and displays a toast ("Minimum 1 player required").

### 2.4 Custom Name Editing
- Inline text field using large Newsreader serif typography.
- Click to edit directly. Pressing **Enter** commits the name and blurs the field.

### 2.5 Breaker Status & Swap
- Tapping the `❖ ACTIVE BREAKER` / `INNING WAITING` badge sets that player as the active breaker and demotes others.
- Dedicated tactical button **SWAP SEAT / BREAK** passes the break sequentially to the next player.

---

## 3. Scoring System

### 3.1 Increment / Decrement
- Giant square touch controls: **`−`** (left) and **`+`** (right) surrounding the massive score numeral.
- Scores cannot go below 0 (triggers an alert vibration and toast).
- Target race milestone alert triggers when a player reaches the configured target (e.g. Race to 15).

### 3.2 Visual Feedback & Pop Animation
- Massive Newsreader serif numerals readable from up to 40 feet.
- Scale-pop animation on tap (scales up to 1.12x in 140ms).

### 3.3 Match Leader Identification
- The match leader receives a distinctive bold outline (`is-leader` class).
- Inverted black HUD ticker displays the active lead: `LEAD: J. ARCHER (+4)`.

---

## 4. Zero-Sum / Balance Checker ("Hotcell" Indicator)

### 4.1 Original Zero-Sum Game Logic
- Built for pool betting matches where one player's win offsets another player's loss.
- Negative numbers are permitted (e.g. winning player is `+3`, losing player is `-3`).
- Tracks running total balance (`totalSum`).
- Points discrepancy is displayed in `#totalSum`:
  - When scores sum to zero, `#totalSum` is empty (`""`).
  - When scores do not sum to zero, `#totalSum` displays the outstanding discrepancy (`-1 * totalSum`).

### 4.2 Subtle Hotcell Highlight (No Red Alerts)
- When points do not add up to zero:
  - All player score cards activate the subtle `.hotcell` state with a highlighted border (`rgba(255, 255, 255, 0.4)`) and background shift (`rgb(48, 45, 45)` in dark mode, `#e2e2e4` in light mode).
  - Clean and non-intrusive: no screaming red alert banners.
- As soon as player scores balance back to zero, `.hotcell` turns off and the discrepancy number clears automatically.

---

## 5. Pro Shot Clock & Timer

### 5.1 Modes & Readout
- Modes: **30S**, **45S**, and **60S** switchable chips.
- Giant countdown display with `SEC REMAINING` and status tags (`STANDBY`, `RUNNING`, `TIME FOUL`).
- Smooth 1px progress line bar.

### 5.2 Controls
- **START CLOCK / PAUSE CLOCK**: High-contrast primary button with play/pause icons.
- **+30S EXT**: Grants a 30-second extension, tracking remaining extensions (`EXTENSIONS: 1 / 1 LEFT`).
- **Quick Reset (↻)**: Resets the shot clock immediately to current mode duration.

### 5.3 Tournament Audio & Haptics
- At **10 seconds**: Warning click tone (660 Hz).
- At **5s, 4s, 3s, 2s, 1s**: Critical countdown beeps (880 Hz) + mobile haptic vibration.
- At **0 seconds**: Loud foul alarm buzzer (220 Hz) + haptic burst + "TIME FOUL" banner.

---

## 6. Stakes Ledger, Pot & Target Frame

### 6.1 Triad Telemetry Cards
- **PER RACK VALUE**: Configurable rate per point/rack (e.g. `$1.00 / PT`). Tap to open config modal.
- **CURRENT POT / SPREAD**: Total pot accumulation based on total frames and rate.
- **TARGET FRAME**: Match goal (e.g. `RACE 15`). Tap to switch target race (Race 7, 9, 11, 15, 21).

### 6.2 Pairwise Financial Settlement
- Multi-player pool calculation: each player's net earnings is the sum of rack differences against every other player multiplied by the stake rate.
- Displays live net cash on each player card (`FINANCIAL NET: +$4.00` or `-$4.00`).
- Minimum transfer ledger in modal outputs exact directional payments (e.g., *Shane Van Boening pays Johnny Archer: $4.00*).

---

## 7. Keyboard Shortcuts

| Key | Action |
|:---|:---|
| `Space` | Start / Pause Shot Clock |
| `Q` / `W` | Player 1: Decrement / Increment |
| `O` / `P` | Player 2: Decrement / Increment |
| `E` | +30s Shot Clock Extension |
| `R` | Reset Shot Clock |
| `Ctrl+Z` / `Cmd+Z` | Undo Last Score |

---

## 8. Undo / Redo & Rack History (180s Focus Mode)

### 8.1 In-Memory Action Stack
- Full undo and redo capabilities for point corrections without manual math.
- Synchronized with rack history entries.

### 8.2 Chronological Rack Ledger
- Records every winning rack with timestamps: `R-21 · Johnny Archer · +1 · 19:48`.
- **180s Focus Blur**: After 180 seconds of inactivity, the ledger applies a subtle blur (`filter: blur(4px); opacity: 0.25`) to keep player focus on the table.
- Tapping anywhere or registering a new rack immediately wakes the ledger to razor-sharp clarity.

---

## 9. Safety Hold-to-Reset & Quick Reset

- **HOLD 2S RESET**: Requires a 2-second continuous hold with a red progress fill animation to prevent accidental match wipes.
- **QUICK RESET**: Masthead button with confirmation dialog for rapid table turnover.

---

## 10. Design Architecture & Typography

- **Reference Design Alignment:** Direct reproduction of `media_1790689465780.png`.
- **Monochrome Editorial Palette:** Strict contrast, flat elevation, razor-sharp 0px borders.
- **Typography:**
  - `Newsreader`: Editorial headlines, player names, and massive score digits.
  - `Inter`: UI labels, telemetry descriptions.
  - `JetBrains Mono`: Masthead badges, clock hero, and financial metrics.
