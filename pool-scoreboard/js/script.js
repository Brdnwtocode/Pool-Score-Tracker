/**
 * Pool Scoreboard - 21N2 Billiards
 * Monochrome Editorial Architecture (DESIGN.md compliant)
 * Features:
 * - Undo / Redo point history stack
 * - Money / Stakes Calculator (pairwise settlement for pool ring & match games)
 * - 30s / 45s Shot Clock with extension (+30s) and pro audio beeps
 * - Synthesized Billiard Ball click sound & Haptic vibration feedback
 * - Auto-Save (LocalStorage persistence)
 * - Chronological Rack History with 180s gradual blur-out
 * - Zero-radius, mobile-first tactile UI
 */

(() => {
  "use strict";

  // ===== LocalStorage Key =====
  const STORAGE_KEY = "21n2_pool_scoreboard_state";

  // ===== Default State =====
  let state = {
    players: [
      { id: 1, name: "Player 1", score: 0, isBreaker: true },
      { id: 2, name: "Player 2", score: 0, isBreaker: false },
    ],
    stakeRate: 1.0,
    shotClockMode: 30, // 30 or 45
    soundEnabled: true,
    theme: "dark", // "dark" or "light"
    history: [],
  };

  // Undo / Redo Stacks (runtime in-memory)
  const undoStack = [];
  const redoStack = [];

  // Shot Clock Runtime
  let clockTimeLeft = 30;
  let isClockRunning = false;
  let clockInterval = null;

  // History 180s Blur-Out Timer
  const BLUR_TIMEOUT_SECONDS = 180;
  let blurSecondsRemaining = BLUR_TIMEOUT_SECONDS;
  let blurTimerInterval = null;

  // ===== DOM References =====
  const playerContainer = document.getElementById("playerContainer");
  const addPlayerBtn = document.getElementById("addPlayerBtn");
  const removePlayerBtn = document.getElementById("removePlayerBtn");
  const holdResetBtn = document.getElementById("holdResetBtn");
  const holdResetProgress = document.getElementById("holdResetProgress");
  const resetHoldLabel = document.getElementById("resetHoldLabel");

  const clockDigits = document.getElementById("clockDigits");
  const clockProgressBar = document.getElementById("clockProgressBar");
  const clockToggleBtn = document.getElementById("clockToggleBtn");
  const clockExtBtn = document.getElementById("clockExtBtn");
  const clockResetBtn = document.getElementById("clockResetBtn");
  const clockMode30 = document.getElementById("clockMode30");
  const clockMode45 = document.getElementById("clockMode45");

  const undoBtn = document.getElementById("undoBtn");
  const redoBtn = document.getElementById("redoBtn");
  const soundToggleBtn = document.getElementById("soundToggleBtn");
  const soundIcon = document.getElementById("soundIcon");
  const themeToggleBtn = document.getElementById("themeToggleBtn");
  const themeIcon = document.getElementById("themeIcon");

  const balanceBar = document.getElementById("balanceBar");
  const balanceStatusText = document.getElementById("balanceStatusText");
  const balanceTag = document.getElementById("balanceTag");

  const historySection = document.getElementById("historySection");
  const historyLedgerList = document.getElementById("historyLedgerList");
  const historyEmptyState = document.getElementById("historyEmptyState");
  const blurCountdownText = document.getElementById("blurCountdownText");
  const wakeHistoryBtn = document.getElementById("wakeHistoryBtn");

  const stakesModalBtn = document.getElementById("stakesModalBtn");
  const stakesSummaryText = document.getElementById("stakesSummaryText");
  const stakesModal = document.getElementById("stakesModal");
  const closeStakesModalBtn = document.getElementById("closeStakesModalBtn");
  const saveStakesBtn = document.getElementById("saveStakesBtn");
  const stakeRateInput = document.getElementById("stakeRateInput");
  const stakeMinusBtn = document.getElementById("stakeMinusBtn");
  const stakePlusBtn = document.getElementById("stakePlusBtn");
  const payoutList = document.getElementById("payoutList");
  const transferLedger = document.getElementById("transferLedger");
  const toastIndicator = document.getElementById("toastIndicator");

  // ===== Audio Synthesis (Web Audio API) =====
  let audioCtx = null;

  function getAudioContext() {
    if (!audioCtx) {
      const AudioContextClass = window.AudioContext || window.webkitAudioContext;
      if (AudioContextClass) {
        audioCtx = new AudioContextClass();
      }
    }
    if (audioCtx && audioCtx.state === "suspended") {
      audioCtx.resume();
    }
    return audioCtx;
  }

  /**
   * Synthesize an authentic, tactile billiard ball collision "click/clack"
   */
  function playBallClickSound() {
    if (!state.soundEnabled) return;
    try {
      const ctx = getAudioContext();
      if (!ctx) return;

      const now = ctx.currentTime;

      // Resonant strike oscillator 1 (high impact snap)
      const osc1 = ctx.createOscillator();
      const gain1 = ctx.createGain();
      osc1.type = "triangle";
      osc1.frequency.setValueAtTime(2200, now);
      osc1.frequency.exponentialRampToValueAtTime(800, now + 0.025);

      gain1.gain.setValueAtTime(0.7, now);
      gain1.gain.exponentialRampToValueAtTime(0.001, now + 0.035);

      osc1.connect(gain1);
      gain1.connect(ctx.destination);

      osc1.start(now);
      osc1.stop(now + 0.04);

      // Resonant body oscillator 2 (dense phenolic resin body)
      const osc2 = ctx.createOscillator();
      const gain2 = ctx.createGain();
      osc2.type = "sine";
      osc2.frequency.setValueAtTime(950, now);
      osc2.frequency.exponentialRampToValueAtTime(320, now + 0.04);

      gain2.gain.setValueAtTime(0.5, now);
      gain2.gain.exponentialRampToValueAtTime(0.001, now + 0.05);

      osc2.connect(gain2);
      gain2.connect(ctx.destination);

      osc2.start(now);
      osc2.stop(now + 0.055);
    } catch {
      // Audio not supported or blocked
    }
  }

  /**
   * Shot clock countdown beep (880Hz or low 220Hz buzzer)
   */
  function playTimerBeep(freq = 880, duration = 0.09) {
    if (!state.soundEnabled) return;
    try {
      const ctx = getAudioContext();
      if (!ctx) return;

      const now = ctx.currentTime;
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = "sine";
      osc.frequency.setValueAtTime(freq, now);

      gain.gain.setValueAtTime(0.4, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + duration);

      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.start(now);
      osc.stop(now + duration + 0.01);
    } catch {
      // Ignored
    }
  }

  /**
   * Tactile Haptic Vibration
   */
  function triggerHaptic(pattern = 15) {
    if (!state.soundEnabled) return;
    if ("vibrate" in navigator) {
      try {
        navigator.vibrate(pattern);
      } catch {
        // Ignored
      }
    }
  }

  function triggerTactileFeedback(isFoul = false) {
    if (isFoul) {
      playTimerBeep(220, 0.35);
      triggerHaptic([50, 40, 50]);
    } else {
      playBallClickSound();
      triggerHaptic(18);
    }
  }

  // ===== Toast Notification =====
  let toastTimer = null;
  function showToast(msg) {
    if (!toastIndicator) return;
    toastIndicator.textContent = msg;
    toastIndicator.classList.add("show");
    if (toastTimer) clearTimeout(toastTimer);
    toastTimer = setTimeout(() => {
      toastIndicator.classList.remove("show");
    }, 2000);
  }

  // ===== State Persistence (LocalStorage) =====
  function saveState() {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
    } catch (e) {
      console.warn("LocalStorage save error", e);
    }
  }

  function loadState() {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        state = Object.assign(state, parsed);
      }
    } catch (e) {
      console.warn("LocalStorage load error", e);
    }
  }

  // ===== Stakes & Settlement Calculator Engine =====
  /**
   * Pairwise pool calculation:
   * Each player's net earnings is sum of differences between their score and every other player's score.
   */
  function calculateSettlements() {
    const players = state.players;
    const rate = parseFloat(state.stakeRate) || 0;
    const n = players.length;

    const netPoints = {};
    const netCash = {};

    players.forEach((p) => {
      netPoints[p.id] = 0;
    });

    for (let i = 0; i < n; i++) {
      for (let j = i + 1; j < n; j++) {
        const p1 = players[i];
        const p2 = players[j];
        const diff = p1.score - p2.score;
        netPoints[p1.id] += diff;
        netPoints[p2.id] -= diff;
      }
    }

    players.forEach((p) => {
      netCash[p.id] = netPoints[p.id] * rate;
    });

    // Calculate minimum cash transfers (debtor -> creditor matching)
    const debtors = [];
    const creditors = [];

    players.forEach((p) => {
      const cash = netCash[p.id];
      if (cash > 0.001) {
        creditors.push({ id: p.id, name: p.name, balance: cash });
      } else if (cash < -0.001) {
        debtors.push({ id: p.id, name: p.name, balance: -cash });
      }
    });

    const transfers = [];
    let dIdx = 0;
    let cIdx = 0;

    while (dIdx < debtors.length && cIdx < creditors.length) {
      const deb = debtors[dIdx];
      const cred = creditors[cIdx];
      const amt = Math.min(deb.balance, cred.balance);

      if (amt > 0.01) {
        transfers.push({
          from: deb.name,
          to: cred.name,
          amount: amt.toFixed(2),
        });
      }

      deb.balance -= amt;
      cred.balance -= amt;

      if (deb.balance <= 0.01) dIdx++;
      if (cred.balance <= 0.01) cIdx++;
    }

    return { netPoints, netCash, transfers };
  }

  function renderStakesModal() {
    const rate = parseFloat(state.stakeRate) || 1.0;
    stakeRateInput.value = rate.toFixed(2);
    stakesSummaryText.textContent = `$${rate.toFixed(2)}/PT`;

    // Highlight active preset chip
    document.querySelectorAll(".chip-rate").forEach((chip) => {
      const chipRate = parseFloat(chip.dataset.rate);
      chip.classList.toggle("active", Math.abs(chipRate - rate) < 0.01);
    });

    const { netCash, transfers } = calculateSettlements();

    // Render roster list
    payoutList.innerHTML = "";
    state.players.forEach((p) => {
      const cash = netCash[p.id] || 0;
      const isWin = cash >= 0;
      const row = document.createElement("div");
      row.className = "payout-row";
      row.innerHTML = `
        <span class="payout-name">${escapeHtml(p.name)} (${p.score} Racks)</span>
        <span class="payout-amt ${isWin ? "win" : "loss"}">
          ${isWin ? "+" : "-"}$${Math.abs(cash).toFixed(2)}
        </span>
      `;
      payoutList.appendChild(row);
    });

    // Render transfer directions
    transferLedger.innerHTML = "";
    if (transfers.length === 0) {
      transferLedger.innerHTML = `
        <div class="transfer-item">
          <span class="material-symbols-outlined icon-sm">check</span>
          <span>SCORES TIED · NO PAYOUTS REQUIRED</span>
        </div>
      `;
    } else {
      transfers.forEach((t) => {
        const item = document.createElement("div");
        item.className = "transfer-item";
        item.innerHTML = `
          <span class="material-symbols-outlined icon-sm">arrow_forward</span>
          <span><strong>${escapeHtml(t.from)}</strong> pays <strong>${escapeHtml(t.to)}</strong>: $${t.amount}</span>
        `;
        transferLedger.appendChild(item);
      });
    }
  }

  // ===== Player Roster Rendering =====
  function renderPlayers() {
    playerContainer.innerHTML = "";

    const maxScore = Math.max(...state.players.map((p) => p.score), 0);
    const { netCash } = calculateSettlements();

    state.players.forEach((player, index) => {
      const card = document.createElement("article");
      const isLeader = player.score > 0 && player.score === maxScore;
      card.className = `player-card ${isLeader ? "leader" : ""}`;
      card.id = `player-card-${player.id}`;

      const cash = netCash[player.id] || 0;
      const cashText =
        cash >= 0 ? `+$${cash.toFixed(2)}` : `-$${Math.abs(cash).toFixed(2)}`;

      card.innerHTML = `
        <div class="card-top-row">
          <span class="player-id-tag">0${index + 1}</span>
          <div class="player-status-chips">
            <button 
              type="button" 
              class="breaker-badge ${player.isBreaker ? "" : "inactive"}" 
              data-player-id="${player.id}"
              title="Click to pass break"
            >
              ${player.isBreaker ? "BREAK" : "WAIT"}
            </button>
          </div>
        </div>

        <input 
          type="text" 
          class="player-name-input" 
          value="${escapeHtml(player.name)}" 
          data-player-id="${player.id}"
          placeholder="Player ${index + 1}"
          spellcheck="false"
        />

        <div class="card-divider"></div>

        <div class="score-row">
          <button 
            type="button" 
            class="btn-score btn-score-dec" 
            data-player-id="${player.id}"
            title="Subtract point (-1)"
          >
            <span class="material-symbols-outlined">remove</span>
          </button>

          <div class="score-center">
            <span class="score-num" id="score-display-${player.id}">
              ${player.score.toString().padStart(2, "0")}
            </span>
            <span class="score-label">RACKS WON</span>
          </div>

          <button 
            type="button" 
            class="btn-score btn-score-inc" 
            data-player-id="${player.id}"
            title="Add point (+1)"
          >
            <span class="material-symbols-outlined">add</span>
          </button>
        </div>

        <div class="card-bottom-row">
          <span>NET STAKE</span>
          <span class="net-stake-val ${cash >= 0 ? "pos" : "neg"}">${cashText}</span>
        </div>
      `;

      // Event Listeners for Player Card
      const nameInput = card.querySelector(".player-name-input");
      nameInput.addEventListener("change", (e) => {
        player.name = e.target.value.trim() || `Player ${index + 1}`;
        saveState();
        renderStakesModal();
      });

      nameInput.addEventListener("keydown", (e) => {
        if (e.key === "Enter") {
          nameInput.blur();
        }
      });

      // Breaker button toggle
      const breakerBtn = card.querySelector(".breaker-badge");
      breakerBtn.addEventListener("click", () => {
        triggerTactileFeedback();
        state.players.forEach((p) => (p.isBreaker = false));
        player.isBreaker = true;
        saveState();
        renderPlayers();
      });

      // Score buttons
      const incBtn = card.querySelector(".btn-score-inc");
      const decBtn = card.querySelector(".btn-score-dec");

      incBtn.addEventListener("click", () => {
        modifyScore(player.id, 1);
      });

      decBtn.addEventListener("click", () => {
        modifyScore(player.id, -1);
      });

      playerContainer.appendChild(card);
    });

    updateBalanceStatus();
    updateUndoRedoButtons();
    renderStakesModal();
  }

  // ===== Score Engine (with Undo / Redo & Log Sync) =====
  function modifyScore(playerId, delta, isUndoRedoAction = false) {
    const player = state.players.find((p) => p.id === playerId);
    if (!player) return;

    if (player.score + delta < 0) {
      triggerHaptic([30, 20]);
      return;
    }

    const prevScore = player.score;
    player.score = Math.max(0, player.score + delta);

    triggerTactileFeedback();

    // Score pop animation
    const scoreDisplay = document.getElementById(`score-display-${playerId}`);
    if (scoreDisplay) {
      scoreDisplay.textContent = player.score.toString().padStart(2, "0");
      scoreDisplay.classList.remove("score-pop");
      void scoreDisplay.offsetWidth;
      scoreDisplay.classList.add("score-pop");
    }

    // Auto-record rack history on point increment
    let logEntry = null;
    if (delta > 0 && !isUndoRedoAction) {
      const now = new Date();
      const timeStr = `${now.getHours().toString().padStart(2, "0")}:${now
        .getMinutes()
        .toString()
        .padStart(2, "0")}`;

      const rackNum =
        state.players.reduce((sum, p) => sum + p.score, 0);

      logEntry = {
        rackNum,
        playerId: player.id,
        winnerName: player.name,
        time: timeStr,
      };

      state.history.unshift(logEntry);
      // Keep max 50 entries
      if (state.history.length > 50) state.history.pop();
      renderHistory();
      resetHistoryBlurTimer();
    }

    // Push to undo stack if normal user interaction
    if (!isUndoRedoAction) {
      undoStack.push({
        playerId,
        delta,
        prevScore,
        newScore: player.score,
        logEntry,
      });
      // Clear redo stack on fresh action
      redoStack.length = 0;
    }

    saveState();
    renderPlayers();
  }

  function handleUndo() {
    if (undoStack.length === 0) return;
    const action = undoStack.pop();

    const player = state.players.find((p) => p.id === action.playerId);
    if (player) {
      player.score = action.prevScore;

      // If this action created a log entry, remove it
      if (action.logEntry) {
        state.history = state.history.filter((h) => h !== action.logEntry);
        renderHistory();
        resetHistoryBlurTimer();
      }

      redoStack.push(action);
      triggerTactileFeedback();
      showToast(`UNDO: ${player.name} score reverted`);
      saveState();
      renderPlayers();
    }
  }

  function handleRedo() {
    if (redoStack.length === 0) return;
    const action = redoStack.pop();

    const player = state.players.find((p) => p.id === action.playerId);
    if (player) {
      player.score = action.newScore;

      if (action.logEntry) {
        state.history.unshift(action.logEntry);
        renderHistory();
        resetHistoryBlurTimer();
      }

      undoStack.push(action);
      triggerTactileFeedback();
      showToast(`REDO: ${player.name} score restored`);
      saveState();
      renderPlayers();
    }
  }

  function updateUndoRedoButtons() {
    undoBtn.disabled = undoStack.length === 0;
    redoBtn.disabled = redoStack.length === 0;
  }

  // ===== Balance / Zero-Sum Bar Status =====
  function updateBalanceStatus() {
    const total = state.players.reduce((sum, p) => sum + p.score, 0);
    const scores = state.players.map((p) => p.score);
    const allEqual = scores.every((s) => s === scores[0]);

    if (total === 0) {
      balanceBar.classList.remove("hot");
      balanceStatusText.textContent = "MATCH READY · 0 RACKS PLAYED";
      balanceTag.textContent = "READY";
    } else if (allEqual) {
      balanceBar.classList.remove("hot");
      balanceStatusText.textContent = `SCORES TIED · ${total} TOTAL RACKS`;
      balanceTag.textContent = "TIED";
    } else {
      balanceBar.classList.add("hot");
      const leader = [...state.players].sort((a, b) => b.score - a.score)[0];
      balanceStatusText.textContent = `LEAD: ${leader.name.toUpperCase()} (+${
        leader.score
      }) · ${total} TOTAL RACKS`;
      balanceTag.textContent = "ACTIVE";
    }
  }

  // ===== Rack History & 180-Second Gradual Blur =====
  function renderHistory() {
    historyLedgerList.innerHTML = "";

    if (state.history.length === 0) {
      historyEmptyState.style.display = "flex";
      historyLedgerList.appendChild(historyEmptyState);
      return;
    }

    historyEmptyState.style.display = "none";

    state.history.forEach((h) => {
      const item = document.createElement("div");
      item.className = "ledger-item";
      item.innerHTML = `
        <span class="ledger-rack-id">R-${h.rackNum.toString().padStart(2, "0")}</span>
        <span class="ledger-winner">${escapeHtml(h.winnerName)}</span>
        <span class="ledger-delta">+1</span>
        <span class="ledger-time">${h.time}</span>
      `;
      historyLedgerList.appendChild(item);
    });
  }

  function resetHistoryBlurTimer() {
    // Bring history into crisp razor-sharp focus
    historySection.classList.remove("blurred");
    blurSecondsRemaining = BLUR_TIMEOUT_SECONDS;
    updateBlurCountdownDisplay();

    if (blurTimerInterval) clearInterval(blurTimerInterval);

    blurTimerInterval = setInterval(() => {
      if (blurSecondsRemaining > 0) {
        blurSecondsRemaining--;
        updateBlurCountdownDisplay();
      } else {
        // 180s expired -> apply gradual blur out
        historySection.classList.add("blurred");
        blurCountdownText.textContent = "BLURRED (180s)";
        clearInterval(blurTimerInterval);
      }
    }, 1000);
  }

  function updateBlurCountdownDisplay() {
    if (blurSecondsRemaining > 0) {
      const mins = Math.floor(blurSecondsRemaining / 60);
      const secs = blurSecondsRemaining % 60;
      blurCountdownText.textContent = `FOCUS · ${mins}m ${secs
        .toString()
        .padStart(2, "0")}s`;
    }
  }

  // Wake history from blur on click
  historySection.addEventListener("click", () => {
    resetHistoryBlurTimer();
  });

  wakeHistoryBtn.addEventListener("click", (e) => {
    e.stopPropagation();
    resetHistoryBlurTimer();
    showToast("History focused");
  });

  // ===== Shot Clock Engine =====
  function updateClockDisplay() {
    clockDigits.textContent = clockTimeLeft.toString().padStart(2, "0");

    const maxTime = state.shotClockMode;
    const pct = Math.min(100, Math.max(0, (clockTimeLeft / maxTime) * 100));
    clockProgressBar.style.width = `${pct}%`;

    const isCritical = clockTimeLeft <= 5 && isClockRunning;
    clockDigits.classList.toggle("critical", isCritical);
    clockProgressBar.classList.toggle("critical", isCritical);
  }

  function startClock() {
    if (clockInterval) clearInterval(clockInterval);
    isClockRunning = true;
    clockToggleBtn.textContent = "PAUSE";
    clockToggleBtn.classList.add("btn-secondary");

    clockInterval = setInterval(() => {
      if (clockTimeLeft > 0) {
        clockTimeLeft--;

        // Pro beeps at critical seconds
        if (clockTimeLeft <= 5 && clockTimeLeft >= 1) {
          playTimerBeep(880, 0.08);
          triggerHaptic(15);
        } else if (clockTimeLeft === 10) {
          playTimerBeep(660, 0.06);
        }

        updateClockDisplay();

        if (clockTimeLeft === 0) {
          // Time expired foul
          triggerTactileFeedback(true);
          showToast("SHOT CLOCK EXPIRED: FOUL");
          pauseClock();
        }
      }
    }, 1000);
    updateClockDisplay();
  }

  function pauseClock() {
    if (clockInterval) {
      clearInterval(clockInterval);
      clockInterval = null;
    }
    isClockRunning = false;
    clockToggleBtn.textContent = "START";
    clockToggleBtn.classList.remove("btn-secondary");
    updateClockDisplay();
  }

  function resetClock() {
    pauseClock();
    clockTimeLeft = state.shotClockMode;
    updateClockDisplay();
  }

  clockToggleBtn.addEventListener("click", () => {
    triggerTactileFeedback();
    if (isClockRunning) {
      pauseClock();
    } else {
      if (clockTimeLeft === 0) clockTimeLeft = state.shotClockMode;
      startClock();
    }
  });

  clockExtBtn.addEventListener("click", () => {
    triggerTactileFeedback();
    clockTimeLeft = Math.min(90, clockTimeLeft + 30);
    updateClockDisplay();
    showToast("+30s Extension Granted");
  });

  clockResetBtn.addEventListener("click", () => {
    triggerTactileFeedback();
    resetClock();
  });

  clockMode30.addEventListener("click", () => {
    triggerTactileFeedback();
    state.shotClockMode = 30;
    clockMode30.classList.add("active");
    clockMode45.classList.remove("active");
    resetClock();
    saveState();
  });

  clockMode45.addEventListener("click", () => {
    triggerTactileFeedback();
    state.shotClockMode = 45;
    clockMode45.classList.add("active");
    clockMode30.classList.remove("active");
    resetClock();
    saveState();
  });

  // ===== Player Roster Add / Remove / Reset =====
  addPlayerBtn.addEventListener("click", () => {
    if (state.players.length >= 4) {
      addPlayerBtn.classList.add("flash-danger");
      setTimeout(() => addPlayerBtn.classList.remove("flash-danger"), 250);
      showToast("Maximum 4 players allowed");
      triggerHaptic([30, 20]);
      return;
    }

    const nextId =
      state.players.reduce((max, p) => Math.max(max, p.id), 0) + 1;
    state.players.push({
      id: nextId,
      name: `Player ${state.players.length + 1}`,
      score: 0,
      isBreaker: false,
    });

    triggerTactileFeedback();
    saveState();
    renderPlayers();
    showToast(`Added Player ${state.players.length}`);
  });

  removePlayerBtn.addEventListener("click", () => {
    if (state.players.length <= 1) {
      removePlayerBtn.classList.add("flash-danger");
      setTimeout(() => removePlayerBtn.classList.remove("flash-danger"), 250);
      showToast("Minimum 1 player required");
      triggerHaptic([30, 20]);
      return;
    }

    const removed = state.players.pop();
    triggerTactileFeedback();
    saveState();
    renderPlayers();
    showToast(`Removed ${removed.name}`);
  });

  // Tactile Hold-2s-to-Reset Interaction
  let holdTimer = null;
  let holdStart = 0;
  const REQUIRED_HOLD_MS = 1800;

  function cancelHold() {
    if (holdTimer) {
      clearInterval(holdTimer);
      holdTimer = null;
    }
    if (holdResetProgress) holdResetProgress.style.width = "0%";
    if (resetHoldLabel) resetHoldLabel.textContent = "HOLD 2S RESET";
  }

  function triggerHoldStart(e) {
    e.preventDefault();
    holdStart = Date.now();
    holdTimer = setInterval(() => {
      const elapsed = Date.now() - holdStart;
      const progress = Math.min(100, (elapsed / REQUIRED_HOLD_MS) * 100);
      holdResetProgress.style.width = `${progress}%`;

      if (elapsed >= REQUIRED_HOLD_MS) {
        cancelHold();
        // Reset match
        state.players.forEach((p) => (p.score = 0));
        state.history = [];
        undoStack.length = 0;
        redoStack.length = 0;
        resetClock();
        saveState();
        renderPlayers();
        renderHistory();
        resetHistoryBlurTimer();
        triggerTactileFeedback(true);
        showToast("MATCH SCORES RESET TO ZERO");
      }
    }, 40);
  }

  holdResetBtn.addEventListener("mousedown", triggerHoldStart);
  holdResetBtn.addEventListener("touchstart", triggerHoldStart, {
    passive: false,
  });
  window.addEventListener("mouseup", cancelHold);
  window.addEventListener("touchend", cancelHold);

  // ===== Undo / Redo Click Handlers =====
  undoBtn.addEventListener("click", () => {
    handleUndo();
  });

  redoBtn.addEventListener("click", () => {
    handleRedo();
  });

  // ===== Sound & Theme Toggles =====
  soundToggleBtn.addEventListener("click", () => {
    state.soundEnabled = !state.soundEnabled;
    soundIcon.textContent = state.soundEnabled ? "volume_up" : "volume_off";
    showToast(
      state.soundEnabled
        ? "Ball Click & Sound Enabled"
        : "Sound Muted"
    );
    if (state.soundEnabled) triggerTactileFeedback();
    saveState();
  });

  function applyTheme(theme) {
    state.theme = theme;
    if (theme === "light") {
      document.documentElement.classList.remove("dark");
      document.documentElement.classList.add("light");
      themeIcon.textContent = "dark_mode";
    } else {
      document.documentElement.classList.remove("light");
      document.documentElement.classList.add("dark");
      themeIcon.textContent = "light_mode";
    }
  }

  themeToggleBtn.addEventListener("click", () => {
    const nextTheme = state.theme === "dark" ? "light" : "dark";
    applyTheme(nextTheme);
    triggerTactileFeedback();
    saveState();
  });

  // ===== Stakes Modal Events =====
  stakesModalBtn.addEventListener("click", () => {
    triggerTactileFeedback();
    renderStakesModal();
    stakesModal.classList.add("open");
  });

  closeStakesModalBtn.addEventListener("click", () => {
    stakesModal.classList.remove("open");
  });

  stakesModal.addEventListener("click", (e) => {
    if (e.target === stakesModal) {
      stakesModal.classList.remove("open");
    }
  });

  saveStakesBtn.addEventListener("click", () => {
    triggerTactileFeedback();
    const val = Math.max(0, parseFloat(stakeRateInput.value) || 1.0);
    state.stakeRate = val;
    saveState();
    renderPlayers();
    stakesModal.classList.remove("open");
    showToast(`Stakes set to $${val.toFixed(2)}/pt`);
  });

  stakeMinusBtn.addEventListener("click", () => {
    let cur = parseFloat(stakeRateInput.value) || 0;
    cur = Math.max(0, cur - 0.5);
    stakeRateInput.value = cur.toFixed(2);
    state.stakeRate = cur;
    renderStakesModal();
  });

  stakePlusBtn.addEventListener("click", () => {
    let cur = parseFloat(stakeRateInput.value) || 0;
    cur += 0.5;
    stakeRateInput.value = cur.toFixed(2);
    state.stakeRate = cur;
    renderStakesModal();
  });

  stakeRateInput.addEventListener("input", () => {
    state.stakeRate = Math.max(0, parseFloat(stakeRateInput.value) || 0);
    renderStakesModal();
  });

  document.querySelectorAll(".chip-rate").forEach((chip) => {
    chip.addEventListener("click", () => {
      const rate = parseFloat(chip.dataset.rate);
      state.stakeRate = rate;
      stakeRateInput.value = rate.toFixed(2);
      renderStakesModal();
    });
  });

  // ===== Utility Helpers =====
  function escapeHtml(str) {
    if (!str) return "";
    return str
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#039;");
  }

  // ===== App Initialization =====
  function init() {
    loadState();
    applyTheme(state.theme);

    // Apply loaded shot clock mode
    if (state.shotClockMode === 45) {
      clockMode45.classList.add("active");
      clockMode30.classList.remove("active");
    } else {
      state.shotClockMode = 30;
      clockMode30.classList.add("active");
      clockMode45.classList.remove("active");
    }
    clockTimeLeft = state.shotClockMode;
    updateClockDisplay();

    // Sound toggle state
    soundIcon.textContent = state.soundEnabled ? "volume_up" : "volume_off";

    renderPlayers();
    renderHistory();
    resetHistoryBlurTimer();
  }

  document.addEventListener("DOMContentLoaded", init);
})();
