# Pool Scoreboard — Functionality Specification

> **Source of Truth**
> This document defines every feature, behavior, and constraint of the Pool Scoreboard web application as it exists today. All future development should reference and update this file.

---

## 1. Player Roster Management

### 1.1 Default State
- App launches with **2 players**: "Player 1" (breaker) and "Player 2".
- Each player has: a unique ID, an editable name, a score (starts at 0), and a breaker flag.

### 1.2 Add Player
- Button: **ADD PLAYER**.
- Adds a new player to the end of the roster with score 0 and breaker off.
- **Hard cap: 4 players maximum.** If the user tries to add a 5th, the button flashes red and a toast reads "Max 4 players". No player is added.

### 1.3 Remove Player
- Button: **REMOVE**.
- Removes the **last** player from the roster.
- **Hard floor: 1 player minimum.** If only 1 player remains, the button flashes red and a toast reads "Min 1 player". No player is removed.

### 1.4 Player Name Editing
- Each player card has an inline text input pre-filled with the player's name.
- Name changes are committed on the `change` event (blur / tab away).
- Pressing **Enter** blurs the input (commits the name).
- If the input is left empty, it falls back to "Player N".

### 1.5 Breaker Toggle
- Each player card displays a badge: **BREAK** (active) or **WAIT** (inactive).
- Tapping any player's badge sets that player as the sole breaker and clears all others.
- Only one player can hold the break at a time.

---

## 2. Scoring System

### 2.1 Increment / Decrement
- Each player card has a **`+`** (increment) and **`−`** (decrement) button.
- Incrementing adds 1 to the player's score.
- Decrementing subtracts 1 from the player's score.
- **Score cannot go below 0.** If a decrement would result in a negative score, the action is rejected with a short haptic vibration.

### 2.2 Score Display
- Scores are displayed in 2-digit zero-padded format (e.g., `00`, `01`, `09`, `12`).
- On every score change, the number plays a **scale pop animation** (scales up to 1.15x and back in 140ms).

### 2.3 Leader Highlighting
- The player card with the highest score (and score > 0) receives a highlighted border (`lead` class) to visually distinguish the match leader.
- If scores are tied, no card is highlighted as leader.

### 2.4 Net Stake Display
- Each player card displays a **NET STAKE** value at the bottom (e.g., `+$3.00` or `-$2.00`).
- This value is derived from the pairwise settlement engine (see Section 6) and updates in real time.

---

## 3. Undo / Redo

### 3.1 Undo Stack
- Every score change (increment or decrement) pushes an entry onto the **undo stack**.
- Each entry records: player ID, delta (+1 or -1), previous score, new score, and any associated rack history log entry.
- Pressing **Undo** restores the player's score to its previous value and removes the associated rack log entry (if any).
- A toast confirms the action: "UNDO: {PlayerName}".

### 3.2 Redo Stack
- Undone actions are pushed onto the **redo stack**.
- Pressing **Redo** reapplies the undone action and re-inserts its rack log entry (if any).
- A toast confirms: "REDO: {PlayerName}".

### 3.3 Stack Clearing
- Any **new** score change (not triggered by undo/redo) clears the entire redo stack.
- A full match reset clears both stacks.

### 3.4 Button State
- The Undo button is **disabled** when the undo stack is empty.
- The Redo button is **disabled** when the redo stack is empty.

---

## 4. Shot Clock / Timer

### 4.1 Dual Mode
- Two selectable presets: **30 seconds** and **45 seconds**.
- Mode chips at the top of the clock card: `30s` and `45s`. The active one is visually inverted (filled).
- Switching modes **resets and stops** the clock to the new duration.

### 4.2 Controls
- **START / PAUSE**: Toggles the clock between running and paused. Label changes to reflect state.
- **+30s EXT**: Adds 30 seconds to the remaining time, capped at a maximum of 90 seconds. Shows a toast: "+30s Extension".
- **Reset (icon)**: Stops and resets the clock to the full duration of the current mode.

### 4.3 Countdown Behavior
- Clock counts down 1 second at a time.
- A horizontal progress bar tracks the remaining time visually.

### 4.4 Critical State (≤ 5 seconds)
- When ≤ 5 seconds remain and the clock is running:
  - The digits turn red.
  - The progress bar turns red.
  - The digits pulse/scale with a 0.5s infinite animation.

### 4.5 Audio Cues (when sound enabled)
- At **10 seconds**: A single warning beep (660 Hz, 60ms).
- At **5, 4, 3, 2, 1 seconds**: A countdown beep each second (880 Hz, 80ms) with a 15ms haptic vibration.
- At **0 seconds (expiry)**: A loud foul buzzer (220 Hz, 350ms) with a strong haptic burst pattern [50ms, 40ms pause, 50ms]. A toast reads "SHOT CLOCK: FOUL".

### 4.6 Auto-Stop on Expiry
- When the clock reaches 0, it automatically stops (no looping, no negative values).

---

## 5. Sound & Haptic Feedback

### 5.1 Billiard Ball Click Sound
- Generated via the **Web Audio API** (no external audio files).
- Synthesis: A two-oscillator model simulating a phenolic resin ball collision:
  - Oscillator 1: Triangle wave, 2200 Hz → 800 Hz exponential ramp over 25ms, 35ms gain decay.
  - Oscillator 2: Sine wave, 950 Hz → 320 Hz exponential ramp over 40ms, 50ms gain decay.
- Triggered on every button tap (score changes, breaker toggle, clock controls, roster changes).

### 5.2 Haptic Vibration
- Uses `navigator.vibrate()` on supported mobile devices.
- Normal tap: 18ms single vibration.
- Error/foul: [50ms on, 40ms off, 50ms on] burst pattern.
- Rejection (score below 0, max players): [30ms, 20ms] pattern.

### 5.3 Sound Toggle
- A speaker icon button in the utility toolbar toggles all sound and haptics on/off.
- Icon changes: `volume_up` (on) / `volume_off` (off).
- State persists via LocalStorage.

---

## 6. Money / Stakes Calculator

### 6.1 Stake Rate
- Default rate: **$1.00 per point/rack**.
- Displayed in the utility toolbar as a chip (e.g., `$1.00/PT`).
- Tapping the chip opens the **Stakes & Settlement Modal**.

### 6.2 Stakes Modal Interface
- **Stepper controls**: `−$0.50` and `+$0.50` buttons to decrement/increment the rate in $0.50 steps.
- **Direct input**: A numeric input field for custom values (step: $0.25, min: $0.00).
- **Preset chips**: Quick-select buttons for $0.50, $1.00, $2.00, $5.00, $10.00. The active rate chip is visually inverted.
- **Apply & Close**: Saves the rate and closes the modal.

### 6.3 Settlement Engine (Pairwise Differential)
- For each pair of players (i, j), the net point differential is calculated: `score[i] - score[j]`.
- Each player's total net points = sum of all pairwise differentials.
- Each player's net cash = net points × stake rate.

### 6.4 Settlement Display
- **Net Balance Roster**: Lists each player with their score and net cash amount (`+$X.XX` or `-$X.XX`).
- **Who Pays Whom**: A minimized transfer ledger showing directional payments (e.g., "Player 2 pays Player 1: $6.00"). Uses a greedy debtor-creditor matching algorithm to minimize the number of transfers.
- If all scores are equal: "NO PAYOUTS REQUIRED".

### 6.5 Real-Time Updates
- Net stake values on each player card update immediately on any score change.
- The modal recomputes settlements live when the rate input changes.

---

## 7. Auto-Save (LocalStorage)

### 7.1 Persisted State
The following properties are saved to `localStorage` under the key `21n2_pool_v2`:
- Player roster (IDs, names, scores, breaker flags)
- Stake rate
- Shot clock mode (30 or 45)
- Sound on/off
- Theme (dark/light)
- Rack history log

### 7.2 Save Trigger
- State is saved after every: score change, name edit, player add/remove, breaker toggle, stake rate change, sound toggle, theme toggle, and match reset.

### 7.3 Load on Init
- On page load, the saved state (if any) is loaded and merged with defaults. The UI is fully restored: scores, names, theme, sound preference, clock mode, and history.

### 7.4 Undo/Redo Stacks
- Undo and redo stacks are **in-memory only** and are NOT persisted to LocalStorage. They reset on page refresh.

---

## 8. Rack History / Match Log

### 8.1 Automatic Logging
- A rack log entry is created automatically every time a player's score is **incremented** (not decremented).
- Each entry records: rack number (cumulative total of all players' scores at that moment), winning player's name, and timestamp (HH:MM format).
- Entries are displayed in reverse chronological order (newest first).
- Maximum 50 entries are retained; oldest are dropped.

### 8.2 Log Display Format
- Each row shows: `R-{NN}` (rack number) | Winner Name | `+1` | `HH:MM`.
- When no racks exist, an empty state message is shown: "NO RACKS RECORDED YET".

### 8.3 Undo/Redo Synchronization
- Undoing a score increment removes its corresponding log entry.
- Redoing restores the log entry.

### 8.4 180-Second Gradual Blur-Out
- After any activity (score change, page load, or manual wake), a **180-second countdown timer** starts.
- During the countdown, the header shows: "FOCUS · Xm XXs".
- When the timer expires, the entire history section transitions to a blurred state:
  - `filter: blur(4px)`
  - `opacity: 0.22`
  - Transition duration: 1.5 seconds.
- Purpose: Reduce visual clutter during active table play.

### 8.5 Wake on Interaction
- Tapping anywhere on the history section instantly removes the blur and restarts the 180-second timer.
- A dedicated "TAP TO FOCUS" button also wakes the history and shows a toast: "History focused".

---

## 9. Match Balance / Audit Telemetry Bar

### 9.1 States
- **MATCH READY** (tag: `READY`): All scores are 0. No visual alert.
- **TIED** (tag: `TIED`): Total racks > 0 but all players have equal scores. No visual alert.
- **ACTIVE** (tag: `ACTIVE`): Scores are unequal. Bar turns red-highlighted (`hot` class). Displays the leader's name and score: "LEAD: PLAYERNAME (+X) · N RACKS".

---

## 10. Hold-to-Reset Safety

### 10.1 Behavior
- The reset button must be **held down for 2 full seconds** (1800ms) to trigger a match reset.
- A red progress fill bar animates from 0% to 100% width behind the button text as the user holds.
- If the user releases before 2 seconds, the fill resets to 0% and no reset occurs.

### 10.2 Reset Action
On successful 2-second hold:
- All player scores set to 0.
- Rack history cleared.
- Undo and redo stacks cleared.
- Shot clock stopped and reset to current mode duration.
- A foul-style haptic/sound burst fires.
- Toast reads: "MATCH RESET".

### 10.3 Touch Support
- Listens to both `mousedown`/`mouseup` (desktop) and `touchstart`/`touchend` (mobile).

---

## 11. Theme Toggle (Dark / Light)

### 11.1 Dark Theme (Default)
- Background: `#0d0e0f` (near-black).
- Foreground: `#f2f2f5` (near-white).
- Full monochrome dark palette.

### 11.2 Light Theme
- Background: `#f9f9fb` (stark white).
- Foreground: `#111` (ink black).
- Full monochrome light palette.

### 11.3 Toggle
- A contrast icon button in the toolbar switches between themes.
- Icon: `light_mode` (when dark) / `dark_mode` (when light).
- Theme preference persists via LocalStorage.

---

## 12. Info Modal

### 12.1 Trigger
- An **(i) info icon button** in the utility toolbar opens the modal.

### 12.2 Content
- **Author Card**: Avatar icon, "LEAD DEVELOPER" label, name "Phạm Nam Hào", handle "@Brdnwtocode".
- **Links**:
  - GitHub Profile → `github.com/Brdnwtocode`
  - This Repository → `21N2-BILLIARDS-RELATED-TOOLS-AND-WEBAPPS`
  - Contact Email → `phmnamhao@gmail.com`
- **About blurb**: Brief description of the design language and technology stack.

### 12.3 Close
- Close via the `×` button, the "CLOSE" footer button, or tapping the backdrop.

---

## 13. Toast Notifications

- A small floating notification bar at the bottom center of the screen.
- Appears for 2 seconds with a slide-up animation, then fades out.
- Used for: undo/redo confirmations, player add/remove, stakes applied, shot clock events, sound toggle, match reset, and history focus.

---

## 14. Design Constraints

| Constraint | Value |
|:---|:---|
| Border Radius | `0px` on every element (strict zero-radius mandate) |
| Elevation | Completely flat: no drop shadows, no box-shadow, no glow |
| Depth | 1px hairline borders + surface color shifts only |
| Typography | Newsreader (scores/headlines), Inter (names/body), JetBrains Mono (tags/metrics/buttons) |
| Layout Priority | **Mobile-first**. Single column on phone, 2-column grid at 480px, auto-fit at 800px |
| Max Width | 960px centered container |
| Icons | Google Material Symbols Outlined |
| External Dependencies | Google Fonts CDN only. Zero npm/node/build dependencies. |

---

## 15. Technical Architecture

| Aspect | Detail |
|:---|:---|
| Runtime | 100% client-side vanilla HTML + CSS + JavaScript |
| Server | None required. Static file hosting only. |
| Deployment | GitHub Actions → GitHub Pages (static upload, no Jekyll) |
| Audio | Web Audio API oscillator synthesis (no audio files) |
| Haptics | `navigator.vibrate()` API |
| Persistence | `localStorage` (key: `21n2_pool_v2`) |
| Browser Support | All modern browsers (Chrome, Safari, Firefox, Edge) |
| Offline | Fully functional offline after first load (no server calls) |

---

## 16. File Structure

```
pool-scoreboard/
├── index.html          # App shell, player grid, modals, toolbar
├── css/
│   └── style.css       # All styles (dark/light themes, responsive, animations)
├── js/
│   └── script.js       # All logic (scoring, clock, audio, persistence, settlements)
└── reference/
    ├── DESIGN.md        # Monochrome Editorial design system specification
    ├── code.html        # Reference implementation mockup
    └── screen.png       # Visual reference screenshot
```
