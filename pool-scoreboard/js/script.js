/**
 * Championship Pool Scoreboard · Protocol Engine
 * Features:
 * - True Zero-Sum point scoring (negative scores allowed for betting losses)
 * - Original subtle hotcell highlight & #totalSum discrepancy indicator
 * - Default Screen Wake Lock (keeps screen awake automatically)
 * - Fullscreen Mode Button
 * - 30S / 45S / 60S Pro Shot Clock with extension & audio cues
 * - Player Roster Management (2 to 4 players)
 * - Pairwise Financial Stakes & Race-To Target Frame
 * - Web Audio API Ball Strike Clicks & Native Haptics
 * - Keyboard Shortcuts (Space, Q/W, O/P, E, R, Ctrl+Z)
 * - LocalStorage Auto-Save
 */

(() => {
  "use strict";

  const STORAGE_KEY = "21n2_pool_championship_v26";

  // ═══════════════ APPLICATION STATE ═══════════════
  let state = {
    players: [
      { id: 1, name: "Johnny Archer", score: 0, isBreaker: true, runouts: 0, fargo: 812 },
      { id: 2, name: "Shane Van Boening", score: 0, isBreaker: false, runouts: 0, fargo: 824 },
    ],
    stakeRate: 1.0,
    targetRace: 15,
    shotClockDuration: 45, // 30, 45, or 60
    soundEnabled: true,
    theme: "dark", // "dark" or "light"
    history: [],
    totalSum: 0, // Original zero-sum balance tracker
  };

  // Runtime Undo / Redo Stacks
  const undoStack = [];
  const redoStack = [];

  // Shot Clock Runtime
  let clockTimeLeft = 45;
  let isClockRunning = false;
  let clockInterval = null;
  let extensionsUsed = 0;
  const MAX_EXTENSIONS = 1;

  // Rack History 180s Focus Blur
  const BLUR_INTERVAL_SEC = 180;
  let blurSecondsLeft = BLUR_INTERVAL_SEC;
  let blurTimerId = null;

  // ═══════════════ DOM CACHE ═══════════════
  const $ = (id) => document.getElementById(id);

  // Masthead
  const btnFullscreen = $("btnFullscreen");
  const fullscreenIcon = $("fullscreenIcon");
  const btnUndo = $("btnUndo");
  const btnRedo = $("btnRedo");
  const btnSound = $("btnSound");
  const soundIcon = $("soundIcon");
  const btnTheme = $("btnTheme");
  const themeIcon = $("themeIcon");
  const btnResetQuick = $("btnResetQuick");
  const btnInfo = $("btnInfo");

  // Shot Clock Widget
  const clockHeroDigits = $("clockHeroDigits");
  const clockStatusChip = $("clockStatusChip");
  const clockExtLabel = $("clockExtLabel");
  const clockProgressFill = $("clockProgressFill");
  const btnClockStart = $("btnClockStart");
  const clockBtnIcon = $("clockBtnIcon");
  const clockBtnText = $("clockBtnText");
  const btnClockExt = $("btnClockExt");
  const btnClockReset = $("btnClockReset");

  // Stakes Widget
  const boxPerRack = $("boxPerRack");
  const metricPerRackVal = $("metricPerRackVal");
  const boxCurrentPot = $("boxCurrentPot");
  const metricCurrentPotVal = $("metricCurrentPotVal");
  const boxTargetFrame = $("boxTargetFrame");
  const metricTargetRace = $("metricTargetRace");
  const btnTagFoul = $("btnTagFoul");
  const btnTagSafe = $("btnTagSafe");

  // Players Array & Original Zero-Sum TotalSum element
  const playersArrayContainer = $("playersArrayContainer");
  const totalSumEl = $("totalSum");

  // Tactical Actions
  const btnAddPlayer = $("btnAddPlayer");
  const playerCountVal = $("playerCountVal");
  const btnRemovePlayer = $("btnRemovePlayer");
  const btnSwapBreak = $("btnSwapBreak");
  const btnHoldReset = $("btnHoldReset");
  const holdResetProgressBar = $("holdResetProgressBar");
  const btnToggleRackLog = $("btnToggleRackLog");

  // Rack Log Drawer
  const rackLogDrawer = $("rackLogDrawer");
  const blurCountdownDisplay = $("blurCountdownDisplay");
  const btnWakeFocus = $("btnWakeFocus");
  const rackLogScrollList = $("rackLogScrollList");
  const emptyLogState = $("emptyLogState");

  // Modals
  const stakesModal = $("stakesModal");
  const btnCloseStakesModal = $("btnCloseStakesModal");
  const btnSaveStakes = $("btnSaveStakes");
  const stakeInputRate = $("stakeInputRate");
  const btnStakeStepMinus = $("btnStakeStepMinus");
  const btnStakeStepPlus = $("btnStakeStepPlus");
  const raceInputTarget = $("raceInputTarget");
  const btnRaceMinus = $("btnRaceMinus");
  const btnRacePlus = $("btnRacePlus");
  const modalSettlementRoster = $("modalSettlementRoster");
  const modalTransfersLedger = $("modalTransfersLedger");

  const infoModal = $("infoModal");
  const btnCloseInfoModal = $("btnCloseInfoModal");
  const btnDismissInfo = $("btnDismissInfo");
  const hudToast = $("hudToast");

  // ═══════════════ SCREEN WAKE LOCK (DEFAULT ACTIVE) ═══════════════
  let wakeLockSentinel = null;

  async function requestScreenWakeLock() {
    if ("wakeLock" in navigator) {
      try {
        wakeLockSentinel = await navigator.wakeLock.request("screen");
        wakeLockSentinel.addEventListener("release", () => {
          wakeLockSentinel = null;
        });
      } catch {
        // Ignored if unsupported
      }
    }
  }

  document.addEventListener("visibilitychange", () => {
    if (document.visibilityState === "visible") {
      requestScreenWakeLock();
    }
  });

  // ═══════════════ FULLSCREEN API ═══════════════
  function toggleFullscreen() {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen().catch(() => {});
    } else {
      if (document.exitFullscreen) {
        document.exitFullscreen().catch(() => {});
      }
    }
  }

  document.addEventListener("fullscreenchange", () => {
    const isFull = !!document.fullscreenElement;
    if (fullscreenIcon) {
      fullscreenIcon.textContent = isFull ? "fullscreen_exit" : "fullscreen";
    }
    showToast(isFull ? "FULLSCREEN ON" : "WINDOWED");
  });

  // ═══════════════ AUDIO & HAPTIC SYSTEM ═══════════════
  let audioContext = null;

  function getAudioCtx() {
    if (!audioContext) {
      const AudioCtx = window.AudioContext || window.webkitAudioContext;
      if (AudioCtx) audioContext = new AudioCtx();
    }
    if (audioContext && audioContext.state === "suspended") {
      audioContext.resume();
    }
    return audioContext;
  }

  function playBallStrikeSound() {
    if (!state.soundEnabled) return;
    try {
      const ctx = getAudioCtx();
      if (!ctx) return;
      const t = ctx.currentTime;

      // Primary snap
      const osc1 = ctx.createOscillator();
      const gain1 = ctx.createGain();
      osc1.type = "triangle";
      osc1.frequency.setValueAtTime(2400, t);
      osc1.frequency.exponentialRampToValueAtTime(750, t + 0.022);
      gain1.gain.setValueAtTime(0.75, t);
      gain1.gain.exponentialRampToValueAtTime(0.001, t + 0.032);
      osc1.connect(gain1);
      gain1.connect(ctx.destination);
      osc1.start(t);
      osc1.stop(t + 0.035);

      // Deep phenolic body resonance
      const osc2 = ctx.createOscillator();
      const gain2 = ctx.createGain();
      osc2.type = "sine";
      osc2.frequency.setValueAtTime(980, t);
      osc2.frequency.exponentialRampToValueAtTime(310, t + 0.038);
      gain2.gain.setValueAtTime(0.55, t);
      gain2.gain.exponentialRampToValueAtTime(0.001, t + 0.048);
      osc2.connect(gain2);
      gain2.connect(ctx.destination);
      osc2.start(t);
      osc2.stop(t + 0.05);
    } catch {}
  }

  function playTone(freq, dur = 0.08) {
    if (!state.soundEnabled) return;
    try {
      const ctx = getAudioCtx();
      if (!ctx) return;
      const t = ctx.currentTime;
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = "sine";
      osc.frequency.setValueAtTime(freq, t);
      gain.gain.setValueAtTime(0.4, t);
      gain.gain.exponentialRampToValueAtTime(0.001, t + dur);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(t);
      osc.stop(t + dur + 0.01);
    } catch {}
  }

  function vibrateDevice(pattern = 16) {
    if (state.soundEnabled && "vibrate" in navigator) {
      try { navigator.vibrate(pattern); } catch {}
    }
  }

  function tactileFeedback(isAlert = false) {
    if (isAlert) {
      playTone(220, 0.35);
      vibrateDevice([50, 40, 50]);
    } else {
      playBallStrikeSound();
      vibrateDevice(18);
    }
  }

  // ═══════════════ TOAST NOTIFICATION ═══════════════
  let toastTimer = null;
  function showToast(msg) {
    if (!hudToast) return;
    hudToast.textContent = msg;
    hudToast.classList.add("show");
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => hudToast.classList.remove("show"), 2000);
  }

  // ═══════════════ PERSISTENCE ═══════════════
  function saveState() {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
    } catch {}
  }

  function loadState() {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) Object.assign(state, JSON.parse(raw));
    } catch {}
  }

  function escapeHtml(str) {
    if (!str) return "";
    const el = document.createElement("div");
    el.textContent = str;
    return el.innerHTML;
  }

  function formatScore(score) {
    if (score < 0) {
      return "-" + String(Math.abs(score)).padStart(2, "0");
    }
    return String(score).padStart(2, "0");
  }

  // ═══════════════ ORIGINAL ZERO-SUM & HOTCELL LOGIC ═══════════════
  /**
   * Exact original zero-sum logic from Duahettienday_WebApp:
   * When score increases (+1): totalSum -= 1
   * When score decreases (-1): totalSum -= (-1) => totalSum += 1
   * If totalSum == 0: hotcell class removed, totalSum text is ""
   * If totalSum != 0: hotcell class added, totalSum text is -1 * totalSum
   */
  function trackTotal(n) {
    if (n > 0) state.totalSum -= n;
    if (n < 0) state.totalSum -= n;

    const cards = document.querySelectorAll(".player-championship-card");

    if (state.totalSum === 0) {
      cards.forEach((c) => c.classList.remove("hotcell"));
      if (totalSumEl) totalSumEl.innerText = "";
    } else {
      cards.forEach((c) => c.classList.add("hotcell"));
      if (totalSumEl) totalSumEl.innerText = -1 * state.totalSum;
    }
  }

  function reapplyHotcellState() {
    const cards = document.querySelectorAll(".player-championship-card");
    if (state.totalSum === 0) {
      cards.forEach((c) => c.classList.remove("hotcell"));
      if (totalSumEl) totalSumEl.innerText = "";
    } else {
      cards.forEach((c) => c.classList.add("hotcell"));
      if (totalSumEl) totalSumEl.innerText = -1 * state.totalSum;
    }
  }

  // ═══════════════ PAIRWISE SETTLEMENT ═══════════════
  function calculateSettlements() {
    const players = state.players;
    const rate = parseFloat(state.stakeRate) || 0;
    const netCash = {};

    players.forEach((p) => {
      netCash[p.id] = p.score * rate;
    });

    const debtors = [];
    const creditors = [];
    players.forEach((p) => {
      const amt = netCash[p.id];
      if (amt > 0.001) creditors.push({ name: p.name, balance: amt });
      else if (amt < -0.001) debtors.push({ name: p.name, balance: -amt });
    });

    const transfers = [];
    let d = 0, c = 0;
    while (d < debtors.length && c < creditors.length) {
      const transferAmt = Math.min(debtors[d].balance, creditors[c].balance);
      if (transferAmt > 0.01) {
        transfers.push({
          from: debtors[d].name,
          to: creditors[c].name,
          amount: transferAmt.toFixed(2),
        });
      }
      debtors[d].balance -= transferAmt;
      creditors[c].balance -= transferAmt;
      if (debtors[d].balance <= 0.01) d++;
      if (creditors[c].balance <= 0.01) c++;
    }

    return { netCash, transfers };
  }

  // ═══════════════ RENDER PLAYERS ═══════════════
  function renderPlayers() {
    playersArrayContainer.innerHTML = "";
    const players = state.players;
    const maxScore = Math.max(...players.map((p) => p.score));
    const { netCash } = calculateSettlements();

    players.forEach((p, index) => {
      const isLeader = p.score > 0 && p.score === maxScore;
      const cash = netCash[p.id] || 0;
      const cashStr = cash >= 0 ? `+$${cash.toFixed(2)}` : `-$${Math.abs(cash).toFixed(2)}`;
      const isWin = cash >= 0;

      const card = document.createElement("article");
      card.className = `player-championship-card ${isLeader ? "is-leader" : ""}`;
      card.id = `card-player-${p.id}`;

      card.innerHTML = `
        <div class="card-top-breaker-row">
          <div 
            class="breaker-status-pill ${p.isBreaker ? "active" : "waiting"}" 
            data-pid="${p.id}" 
            title="Click to pass break"
          >
            <span class="material-symbols-outlined" style="font-size: 13px;">${p.isBreaker ? "token" : "radio_button_unchecked"}</span>
            <span>${p.isBreaker ? "ACTIVE BREAKER" : "INNING WAITING"}</span>
          </div>

          <span class="material-symbols-outlined card-status-icon-badge ${p.isBreaker ? "active" : ""}">
            ${p.isBreaker ? "verified" : "radio_button_unchecked"}
          </span>
        </div>

        <input 
          type="text" 
          class="player-name-field" 
          value="${escapeHtml(p.name)}" 
          data-pid="${p.id}" 
          placeholder="Player ${index + 1}"
          spellcheck="false"
        />

        <div class="player-sub-meta">
          <span>P${index + 1}</span> / 
          <span>Fargo: ${p.fargo || 800}</span> / 
          <span>Runouts: ${p.runouts || 0}</span>
        </div>

        <div class="card-score-row">
          <button class="btn-score-touch btn-dec" data-pid="${p.id}" title="Decrement Rack (−)">
            <span class="material-symbols-outlined">remove</span>
          </button>

          <div class="score-center-display">
            <span class="score-hero-digits" id="digits-${p.id}">${formatScore(p.score)}</span>
            <span class="score-sublabel">CURRENT FRAMES</span>
          </div>

          <button class="btn-score-touch btn-inc" data-pid="${p.id}" title="Increment Rack (+)">
            <span class="material-symbols-outlined">add</span>
          </button>
        </div>

        <div class="card-telemetry-footer">
          <div class="footer-stat-group">
            <span class="stat-label-tiny">FINANCIAL NET</span>
            <span class="stat-val-bold ${isWin ? "win" : "loss"}">${cashStr}</span>
          </div>
          <div class="footer-stat-group" style="align-items: flex-end;">
            <span class="stat-label-tiny">INNING SUCCESS</span>
            <span class="stat-val-pct">${p.score !== 0 ? (70 + Math.abs(p.score) * 2).toFixed(1) : "0.0"}% TBL RATIO</span>
          </div>
        </div>
      `;

      // Event Listeners for Player Card
      const nameInput = card.querySelector(".player-name-field");
      nameInput.addEventListener("change", (e) => {
        p.name = e.target.value.trim() || `Player ${index + 1}`;
        saveState();
        renderStakesModal();
      });

      nameInput.addEventListener("keydown", (e) => {
        if (e.key === "Enter") nameInput.blur();
      });

      // Breaker status pill toggle
      const breakerPill = card.querySelector(".breaker-status-pill");
      breakerPill.addEventListener("click", () => {
        tactileFeedback();
        players.forEach((item) => (item.isBreaker = false));
        p.isBreaker = true;
        saveState();
        renderPlayers();
      });

      // Score buttons
      const btnInc = card.querySelector(".btn-inc");
      const btnDec = card.querySelector(".btn-dec");

      btnInc.addEventListener("click", () => modifyScore(p.id, 1));
      btnDec.addEventListener("click", () => modifyScore(p.id, -1));

      playersArrayContainer.appendChild(card);
    });

    if (playerCountVal) playerCountVal.textContent = players.length;
    btnUndo.disabled = undoStack.length === 0;
    btnRedo.disabled = redoStack.length === 0;

    // Total pot calculation
    const totalPositiveRacks = players.reduce((sum, p) => sum + Math.max(0, p.score), 0);
    const pot = (totalPositiveRacks * state.stakeRate).toFixed(2);
    if (metricCurrentPotVal) {
      metricCurrentPotVal.textContent = `$${pot}`;
    }

    reapplyHotcellState();
  }

  // ═══════════════ SCORE ENGINE (ALLOWS NEGATIVE NUMBERS FOR ZERO-SUM) ═══════════════
  function modifyScore(playerId, delta, isUndoRedo = false) {
    const player = state.players.find((p) => p.id === playerId);
    if (!player) return;

    const prevScore = player.score;
    // Zero-sum game: scores CAN be negative!
    player.score = player.score + delta;

    trackTotal(delta);
    tactileFeedback();

    // Score pop animation
    const digitsEl = document.getElementById(`digits-${playerId}`);
    if (digitsEl) {
      digitsEl.textContent = formatScore(player.score);
      digitsEl.classList.remove("score-pop-anim");
      void digitsEl.offsetWidth;
      digitsEl.classList.add("score-pop-anim");
    }

    // Auto-record rack log entry on point increase
    let logEntry = null;
    if (delta > 0 && !isUndoRedo) {
      const now = new Date();
      const timeStr = `${String(now.getHours()).padStart(2, "0")}:${String(now.getMinutes()).padStart(2, "0")}`;
      const totalRacks = state.players.reduce((sum, p) => sum + Math.max(0, p.score), 0);

      logEntry = {
        rackNum: totalRacks,
        winnerName: player.name,
        time: timeStr,
      };

      state.history.unshift(logEntry);
      if (state.history.length > 50) state.history.pop();
      renderRackLog();
      resetBlurCountdown();

      if (player.score >= state.targetRace) {
        showToast(`🏆 ${player.name.toUpperCase()} REACHED TARGET RACE (${state.targetRace})!`);
        tactileFeedback(true);
      }
    }

    if (!isUndoRedo) {
      undoStack.push({
        playerId,
        delta,
        prevScore,
        newScore: player.score,
        logEntry,
      });
      redoStack.length = 0;
    }

    saveState();
    renderPlayers();
  }

  function handleUndoAction() {
    if (undoStack.length === 0) return;
    const action = undoStack.pop();
    const player = state.players.find((p) => p.id === action.playerId);
    if (player) {
      player.score = action.prevScore;
      trackTotal(-action.delta);

      if (action.logEntry) {
        state.history = state.history.filter((h) => h !== action.logEntry);
        renderRackLog();
        resetBlurCountdown();
      }

      redoStack.push(action);
      tactileFeedback();
      showToast(`UNDO: ${player.name} score reverted`);
      saveState();
      renderPlayers();
    }
  }

  function handleRedoAction() {
    if (redoStack.length === 0) return;
    const action = redoStack.pop();
    const player = state.players.find((p) => p.id === action.playerId);
    if (player) {
      player.score = action.newScore;
      trackTotal(action.delta);

      if (action.logEntry) {
        state.history.unshift(action.logEntry);
        renderRackLog();
        resetBlurCountdown();
      }

      undoStack.push(action);
      tactileFeedback();
      showToast(`REDO: ${player.name} score restored`);
      saveState();
      renderPlayers();
    }
  }

  // ═══════════════ SHOT CLOCK ENGINE ═══════════════
  function renderShotClock() {
    clockHeroDigits.textContent = String(clockTimeLeft).padStart(2, "0");
    const pct = Math.max(0, Math.min(100, (clockTimeLeft / state.shotClockDuration) * 100));
    clockProgressFill.style.width = `${pct}%`;

    const isCrit = isClockRunning && clockTimeLeft <= 5;
    clockHeroDigits.classList.toggle("crit", isCrit);
    clockProgressFill.classList.toggle("crit", isCrit);

    if (clockStatusChip) {
      if (clockTimeLeft === 0) {
        clockStatusChip.textContent = "TIME FOUL";
        clockStatusChip.className = "status-chip foul";
      } else if (isClockRunning) {
        clockStatusChip.textContent = "RUNNING";
        clockStatusChip.className = "status-chip running";
      } else {
        clockStatusChip.textContent = "STANDBY";
        clockStatusChip.className = "status-chip";
      }
    }

    if (clockExtLabel) {
      clockExtLabel.textContent = `EXTENSIONS: ${MAX_EXTENSIONS - extensionsUsed} / ${MAX_EXTENSIONS} LEFT`;
    }
  }

  function startShotClock() {
    clearInterval(clockInterval);
    isClockRunning = true;
    clockBtnIcon.textContent = "pause";
    clockBtnText.textContent = "PAUSE CLOCK";

    clockInterval = setInterval(() => {
      if (clockTimeLeft > 0) {
        clockTimeLeft--;

        if (clockTimeLeft <= 5 && clockTimeLeft >= 1) {
          playTone(880, 0.08);
          vibrateDevice(20);
        } else if (clockTimeLeft === 10) {
          playTone(660, 0.06);
        }

        renderShotClock();

        if (clockTimeLeft === 0) {
          tactileFeedback(true);
          showToast("SHOT CLOCK EXPIRED: FOUL");
          stopShotClock();
        }
      }
    }, 1000);
    renderShotClock();
  }

  function stopShotClock() {
    clearInterval(clockInterval);
    clockInterval = null;
    isClockRunning = false;
    clockBtnIcon.textContent = "play_arrow";
    clockBtnText.textContent = "START CLOCK";
    renderShotClock();
  }

  function resetShotClock() {
    stopShotClock();
    clockTimeLeft = state.shotClockDuration;
    renderShotClock();
  }

  btnClockStart.addEventListener("click", () => {
    tactileFeedback();
    if (isClockRunning) {
      stopShotClock();
    } else {
      if (clockTimeLeft === 0) clockTimeLeft = state.shotClockDuration;
      startShotClock();
    }
  });

  btnClockExt.addEventListener("click", () => {
    tactileFeedback();
    clockTimeLeft = Math.min(90, clockTimeLeft + 30);
    extensionsUsed = Math.min(MAX_EXTENSIONS, extensionsUsed + 1);
    renderShotClock();
    showToast("+30s Extension Granted");
  });

  btnClockReset.addEventListener("click", () => {
    tactileFeedback();
    resetShotClock();
  });

  // Mode Preset Chips (30S, 45S, 60S)
  document.querySelectorAll(".clock-mode-btn").forEach((chip) => {
    chip.addEventListener("click", () => {
      tactileFeedback();
      const sec = parseInt(chip.dataset.sec, 10) || 45;
      state.shotClockDuration = sec;
      document.querySelectorAll(".clock-mode-btn").forEach((c) => c.classList.remove("active"));
      chip.classList.add("active");
      resetShotClock();
      saveState();
      showToast(`Shot clock set to ${sec}s`);
    });
  });

  // ═══════════════ RACK LOG & 180s BLUR ═══════════════
  function renderRackLog() {
    rackLogScrollList.innerHTML = "";
    if (state.history.length === 0) {
      emptyLogState.style.display = "flex";
      rackLogScrollList.appendChild(emptyLogState);
      return;
    }

    emptyLogState.style.display = "none";
    state.history.forEach((h) => {
      const row = document.createElement("div");
      row.className = "log-entry-row";
      row.innerHTML = `
        <span class="log-rack-num">R-${String(h.rackNum).padStart(2, "0")}</span>
        <span class="log-winner-name">${escapeHtml(h.winnerName)}</span>
        <span class="log-point-delta">+1</span>
        <span class="log-timestamp">${h.time}</span>
      `;
      rackLogScrollList.appendChild(row);
    });
  }

  function resetBlurCountdown() {
    rackLogDrawer.classList.remove("blurred");
    blurSecondsLeft = BLUR_INTERVAL_SEC;
    updateBlurDisplay();

    clearInterval(blurTimerId);
    blurTimerId = setInterval(() => {
      if (blurSecondsLeft > 0) {
        blurSecondsLeft--;
        updateBlurDisplay();
      } else {
        rackLogDrawer.classList.add("blurred");
        blurCountdownDisplay.textContent = "BLURRED (180s IDLE)";
        clearInterval(blurTimerId);
      }
    }, 1000);
  }

  function updateBlurDisplay() {
    const m = Math.floor(blurSecondsLeft / 60);
    const s = blurSecondsLeft % 60;
    blurCountdownDisplay.textContent = `ACTIVE FOCUS · ${m}m ${String(s).padStart(2, "0")}s`;
  }

  rackLogDrawer.addEventListener("click", resetBlurCountdown);
  btnWakeFocus.addEventListener("click", (e) => {
    e.stopPropagation();
    resetBlurCountdown();
    showToast("History focus restored");
  });

  btnToggleRackLog.addEventListener("click", () => {
    tactileFeedback();
    rackLogDrawer.scrollIntoView({ behavior: "smooth" });
    resetBlurCountdown();
  });

  // ═══════════════ PLAYER ROSTER (2 to 4 Players) ═══════════════
  btnAddPlayer.addEventListener("click", () => {
    if (state.players.length >= 4) {
      btnAddPlayer.classList.add("flash-danger");
      setTimeout(() => btnAddPlayer.classList.remove("flash-danger"), 250);
      showToast("Maximum 4 players allowed");
      tactileFeedback(true);
      return;
    }

    const nextId = state.players.reduce((max, p) => Math.max(max, p.id), 0) + 1;
    const names = ["Alex Pagulayan", "Francisco Bustamante", "Efren Reyes", "Earl Strickland"];
    const fallbackName = names[state.players.length] || `Player ${state.players.length + 1}`;

    state.players.push({
      id: nextId,
      name: fallbackName,
      score: 0,
      isBreaker: false,
      runouts: 0,
      fargo: 800,
    });

    tactileFeedback();
    saveState();
    renderPlayers();
    showToast(`Added ${fallbackName}`);
  });

  btnRemovePlayer.addEventListener("click", () => {
    if (state.players.length <= 1) {
      btnRemovePlayer.classList.add("flash-danger");
      setTimeout(() => btnRemovePlayer.classList.remove("flash-danger"), 250);
      showToast("Minimum 1 player required");
      tactileFeedback(true);
      return;
    }

    const removed = state.players.pop();
    // Reverse any score contribution from removed player to totalSum
    trackTotal(removed.score);
    tactileFeedback();
    saveState();
    renderPlayers();
    showToast(`Removed ${removed.name}`);
  });

  btnSwapBreak.addEventListener("click", () => {
    tactileFeedback();
    const currBreakerIdx = state.players.findIndex((p) => p.isBreaker);
    const nextIdx = currBreakerIdx === -1 ? 0 : (currBreakerIdx + 1) % state.players.length;
    state.players.forEach((p, idx) => (p.isBreaker = idx === nextIdx));
    saveState();
    renderPlayers();
    showToast(`Break passed to ${state.players[nextIdx].name}`);
  });

  // ═══════════════ HOLD 2S RESET SAFETY ═══════════════
  let holdTimer = null;
  let holdStart = 0;
  const HOLD_DURATION_MS = 1800;

  function cancelHoldReset() {
    clearInterval(holdTimer);
    holdTimer = null;
    holdResetProgressBar.style.width = "0%";
  }

  function startHoldReset(e) {
    e.preventDefault();
    holdStart = Date.now();
    holdTimer = setInterval(() => {
      const elapsed = Date.now() - holdStart;
      const pct = Math.min(100, (elapsed / HOLD_DURATION_MS) * 100);
      holdResetProgressBar.style.width = `${pct}%`;

      if (elapsed >= HOLD_DURATION_MS) {
        cancelHoldReset();
        executeFullReset();
      }
    }, 40);
  }

  btnHoldReset.addEventListener("mousedown", startHoldReset);
  btnHoldReset.addEventListener("touchstart", startHoldReset, { passive: false });
  window.addEventListener("mouseup", cancelHoldReset);
  window.addEventListener("touchend", cancelHoldReset);

  btnResetQuick.addEventListener("click", () => {
    if (confirm("Reset all match scores to 0?")) {
      executeFullReset();
    }
  });

  function executeFullReset() {
    state.players.forEach((p) => {
      p.score = 0;
      p.runouts = 0;
    });
    state.history = [];
    state.totalSum = 0;
    undoStack.length = 0;
    redoStack.length = 0;
    resetShotClock();
    saveState();
    renderPlayers();
    renderRackLog();
    resetBlurCountdown();
    tactileFeedback(true);
    showToast("MATCH SCORES RESET TO ZERO");
  }

  // ═══════════════ STAKES & SETTLEMENT MODAL ═══════════════
  function renderStakesModal() {
    stakeInputRate.value = state.stakeRate.toFixed(2);
    raceInputTarget.value = state.targetRace;

    // Active chip highlights
    document.querySelectorAll(".preset-chip:not(.race-chip)").forEach((chip) => {
      chip.classList.toggle("active", Math.abs(parseFloat(chip.dataset.v) - state.stakeRate) < 0.01);
    });

    document.querySelectorAll(".race-chip").forEach((chip) => {
      chip.classList.toggle("active", parseInt(chip.dataset.r, 10) === state.targetRace);
    });

    const { netCash, transfers } = calculateSettlements();
    modalSettlementRoster.innerHTML = "";
    state.players.forEach((p) => {
      const val = netCash[p.id] || 0;
      const isWin = val >= 0;
      const row = document.createElement("div");
      row.className = "settle-row";
      row.innerHTML = `
        <span>${escapeHtml(p.name)} (${p.score} Racks)</span>
        <strong class="${isWin ? "win" : "loss"}">${isWin ? "+" : "-"}$${Math.abs(val).toFixed(2)}</strong>
      `;
      modalSettlementRoster.appendChild(row);
    });

    modalTransfersLedger.innerHTML = "";
    if (transfers.length === 0) {
      modalTransfersLedger.innerHTML = `
        <div class="xfer-item-row">
          <span class="material-symbols-outlined" style="font-size: 15px;">check_circle</span>
          <span>SCORES TIED · NO FINANCIAL TRANSFERS REQUIRED</span>
        </div>
      `;
    } else {
      transfers.forEach((t) => {
        const item = document.createElement("div");
        item.className = "xfer-item-row";
        item.innerHTML = `
          <span class="material-symbols-outlined" style="font-size: 15px;">arrow_forward</span>
          <span><strong>${escapeHtml(t.from)}</strong> pays <strong>${escapeHtml(t.to)}</strong>: $${t.amount}</span>
        `;
        modalTransfersLedger.appendChild(item);
      });
    }
  }

  [boxPerRack, boxTargetFrame].forEach((el) => {
    el.addEventListener("click", () => {
      tactileFeedback();
      renderStakesModal();
      stakesModal.classList.add("open");
    });
  });

  btnCloseStakesModal.addEventListener("click", () => stakesModal.classList.remove("open"));
  stakesModal.addEventListener("click", (e) => {
    if (e.target === stakesModal) stakesModal.classList.remove("open");
  });

  btnSaveStakes.addEventListener("click", () => {
    tactileFeedback();
    state.stakeRate = Math.max(0, parseFloat(stakeInputRate.value) || 1.0);
    state.targetRace = Math.max(1, parseInt(raceInputTarget.value, 10) || 15);
    metricPerRackVal.innerHTML = `$${state.stakeRate.toFixed(2)} <small>/ PT</small>`;
    metricTargetRace.textContent = `RACE ${state.targetRace}`;
    saveState();
    renderPlayers();
    stakesModal.classList.remove("open");
    showToast(`Config applied: $${state.stakeRate.toFixed(2)}/pt · Race ${state.targetRace}`);
  });

  btnStakeStepMinus.addEventListener("click", () => {
    stakeInputRate.value = Math.max(0, parseFloat(stakeInputRate.value) - 0.5).toFixed(2);
    state.stakeRate = parseFloat(stakeInputRate.value);
    renderStakesModal();
  });

  btnStakeStepPlus.addEventListener("click", () => {
    stakeInputRate.value = (parseFloat(stakeInputRate.value) + 0.5).toFixed(2);
    state.stakeRate = parseFloat(stakeInputRate.value);
    renderStakesModal();
  });

  btnRaceMinus.addEventListener("click", () => {
    raceInputTarget.value = Math.max(1, parseInt(raceInputTarget.value, 10) - 1);
    state.targetRace = parseInt(raceInputTarget.value, 10);
    renderStakesModal();
  });

  btnRacePlus.addEventListener("click", () => {
    raceInputTarget.value = parseInt(raceInputTarget.value, 10) + 1;
    state.targetRace = parseInt(raceInputTarget.value, 10);
    renderStakesModal();
  });

  document.querySelectorAll(".preset-chip:not(.race-chip)").forEach((chip) => {
    chip.addEventListener("click", () => {
      state.stakeRate = parseFloat(chip.dataset.v);
      stakeInputRate.value = state.stakeRate.toFixed(2);
      renderStakesModal();
    });
  });

  document.querySelectorAll(".race-chip").forEach((chip) => {
    chip.addEventListener("click", () => {
      state.targetRace = parseInt(chip.dataset.r, 10);
      raceInputTarget.value = state.targetRace;
      renderStakesModal();
    });
  });

  // ═══════════════ INFO MODAL ═══════════════
  btnInfo.addEventListener("click", () => {
    tactileFeedback();
    infoModal.classList.add("open");
  });

  btnCloseInfoModal.addEventListener("click", () => infoModal.classList.remove("open"));
  btnDismissInfo.addEventListener("click", () => infoModal.classList.remove("open"));
  infoModal.addEventListener("click", (e) => {
    if (e.target === infoModal) infoModal.classList.remove("open");
  });

  // ═══════════════ TOOLBAR CONTROLS ═══════════════
  btnFullscreen.addEventListener("click", () => {
    tactileFeedback();
    toggleFullscreen();
  });

  btnUndo.addEventListener("click", handleUndoAction);
  btnRedo.addEventListener("click", handleRedoAction);

  btnSound.addEventListener("click", () => {
    state.soundEnabled = !state.soundEnabled;
    soundIcon.textContent = state.soundEnabled ? "volume_up" : "volume_off";
    showToast(state.soundEnabled ? "BALL CLICK & AUDIO ACTIVE" : "SOUND MUTED");
    if (state.soundEnabled) tactileFeedback();
    saveState();
  });

  function applyTheme(theme) {
    state.theme = theme;
    document.documentElement.classList.toggle("dark", theme === "dark");
    themeIcon.textContent = theme === "dark" ? "light_mode" : "dark_mode";
  }

  btnTheme.addEventListener("click", () => {
    const nextTheme = state.theme === "dark" ? "light" : "dark";
    applyTheme(nextTheme);
    tactileFeedback();
    saveState();
  });

  btnTagFoul.addEventListener("click", () => {
    tactileFeedback(true);
    showToast("FOUL LOGGED: Ball-in-hand awarded");
  });

  btnTagSafe.addEventListener("click", () => {
    tactileFeedback();
    showToast("DEFENSIVE SAFETY LOGGED");
  });

  // ═══════════════ KEYBOARD SHORTCUTS ═══════════════
  window.addEventListener("keydown", (e) => {
    if (e.target.tagName === "INPUT") return;

    const key = e.key.toLowerCase();
    if (e.code === "Space") {
      e.preventDefault();
      btnClockStart.click();
    } else if (key === "w" && state.players[0]) {
      modifyScore(state.players[0].id, 1);
    } else if (key === "q" && state.players[0]) {
      modifyScore(state.players[0].id, -1);
    } else if (key === "p" && state.players[1]) {
      modifyScore(state.players[1].id, 1);
    } else if (key === "o" && state.players[1]) {
      modifyScore(state.players[1].id, -1);
    } else if (key === "e") {
      btnClockExt.click();
    } else if (key === "r") {
      btnClockReset.click();
    } else if (key === "z" && (e.ctrlKey || e.metaKey)) {
      e.preventDefault();
      handleUndoAction();
    }
  });

  // ═══════════════ INITIALIZATION ═══════════════
  function init() {
    loadState();
    applyTheme(state.theme);

    // Automatic Screen Wake Lock (Default on, no toggle needed)
    requestScreenWakeLock();

    // Match duration chip
    document.querySelectorAll(".clock-mode-btn").forEach((chip) => {
      chip.classList.toggle("active", parseInt(chip.dataset.sec, 10) === state.shotClockDuration);
    });
    clockTimeLeft = state.shotClockDuration;
    renderShotClock();

    // Metric cards
    metricPerRackVal.innerHTML = `$${state.stakeRate.toFixed(2)} <small>/ PT</small>`;
    metricTargetRace.textContent = `RACE ${state.targetRace}`;
    soundIcon.textContent = state.soundEnabled ? "volume_up" : "volume_off";

    renderPlayers();
    renderRackLog();
    resetBlurCountdown();
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
  } else {
    init();
  }
})();
