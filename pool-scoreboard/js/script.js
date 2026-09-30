/**
 * Championship Pool Scoreboard · Dual-Mode Protocol Engine v3.3.0
 * Features:
 * - Clean Icon-Driven UI (Unnecessary word content stripped & replaced with Google Material Symbols)
 * - 100% Isolated Dual-Mode Memory (Cash Ring Game vs WPA Tournament Frame)
 * - Upper Card Integrated Zero-Sum Balance Telemetry
 * - Full History Ledger (Logs increments, decrements, adjustments, undo/redo)
 * - 0.7s Fast Direct Score Drag Gesture (Zero modal, direct card digits update)
 * - Vietnamese (VI) & English (EN) Localization Switcher
 * - Screen Wake Lock, Fullscreen API, Web Audio Clicks, Native Haptics
 */

(() => {
  "use strict";

  const STORAGE_KEY = "21n2_pool_dual_engine_v32";

  // ═══════════════ LOCALIZATION DICTIONARY (VI / EN) ═══════════════
  const I18N = {
    en: {
      cash_mode: "CASH",
      tourney_mode: "TOURNEY",
      reset: "RESET",
      hold_reset: "HOLD 2S",
      reset_confirm: "Reset all match scores to 0?",
      reset_done: "SCORES RESET TO ZERO",
      shot_clock_title: "SHOT CLOCK",
      sec_remaining: "SEC",
      standby: "STANDBY",
      running: "RUNNING",
      time_foul: "TIME FOUL",
      extensions_left: "{0}/{1} EXT",
      start_clock: "START",
      pause_clock: "PAUSE",
      ext_btn: "+30S",
      ext_granted: "+30s Extension Granted",
      clock_expired: "SHOT CLOCK EXPIRED: FOUL",
      clock_set: "Shot clock set to {0}s",
      stakes_protocol_title: "STAKES & RACE",
      per_rack_val: "PER RACK",
      current_pot: "POT",
      target_frame: "RACE",
      shortcuts: "SHORTCUTS:",
      shortcut_hint: "Tap to edit",
      who_pays_whom: "SETTLEMENTS",
      balanced_zero: "ZERO-SUM (0)",
      table_unbalanced: "UNBALANCED ({0})",
      tourney_array_title: "FRAME SCORE",
      target_race_badge: "RACE {0}",
      net_points: "PTS",
      frames: "FRAMES",
      player_placeholder: "Player {0}",
      add_player: "PLAYER ({0}/4)",
      remove_player: "Remove Player",
      max_players: "Maximum 4 players allowed",
      min_players: "Minimum 1 player required",
      player_added: "Added {0}",
      player_removed: "Removed {0}",
      rack_log: "LOG",
      chron_drawer_title: "RACK LOG",
      more_info: "DETAILS",
      less_info: "COMPACT",
      wake: "WAKE",
      blurred: "BLURRED",
      empty_log: "NO RACKS RECORDED · TAP + TO LOG",
      focus_restored: "History focus restored",
      extended_info_on: "Extended Details Visible",
      extended_info_off: "Compact View",
      modal_title_cash: "STAKES & SETTLEMENTS",
      modal_title_tourney: "MATCH PROTOCOL",
      rate_per_point: "RATE PER POINT",
      target_race_label: "TARGET RACE",
      who_pays_whom_header: "DIRECT TRANSFERS",
      no_transfers: "SCORES BALANCED · NO CASH TRANSFERS",
      transfer_item: "<strong>{0}</strong> pays <strong>{1}</strong>: ${2}",
      apply_save: "APPLY",
      close: "CLOSE",
      info_modal_title: "ABOUT & SYSTEM",
      architect_tag: "ARCHITECT & LEAD DEVELOPER",
      dual_mode_tag: "DUAL-MODE ARCHITECTURE",
      tourney_negative_err: "Tournament frames cannot be negative",
      match_win_alert: "🏆 {0} WINS MATCH (RACE {1})!",
      undo_toast: "UNDO: {0} reverted",
      redo_toast: "REDO: {0} restored",
      pts_adjusted: "pts adjusted",
      sound_active: "AUDIO ACTIVE",
      sound_muted: "MUTED",
      lang_switched: "Language: English",
      snapshot: "Table",
      lead: "Lead",
    },
    vi: {
      cash_mode: "ĐÁNH ĐIỂM",
      tourney_mode: "THI ĐẤU",
      reset: "ĐẶT LẠI",
      hold_reset: "GIỮ 2S",
      reset_confirm: "Đặt lại toàn bộ điểm số trận đấu về 0?",
      reset_done: "ĐÃ ĐẶT LẠI ĐIỂM VỀ 0",
      shot_clock_title: "SHOT CLOCK",
      sec_remaining: "GIÂY",
      standby: "CHỜ",
      running: "CHẠY",
      time_foul: "HẾT GIỜ",
      extensions_left: "{0}/{1} GIA HẠN",
      start_clock: "BẮT ĐẦU",
      pause_clock: "TẠM DỪNG",
      ext_btn: "+30S",
      ext_granted: "Đã cộng thêm 30s gia hạn",
      clock_expired: "HẾT GIỜ ĐÁNH: PHẠM QUY",
      clock_set: "Đồng hồ đặt {0}s",
      stakes_protocol_title: "MỨC CƯỢC & THỂ THỨC",
      per_rack_val: "MỖI VÁN",
      current_pot: "TỔNG QUỸ",
      target_frame: "CHẠM",
      shortcuts: "PHÍM TẮT:",
      shortcut_hint: "Chạm để chỉnh",
      who_pays_whom: "THANH TOÁN",
      balanced_zero: "CÂN BẰNG (0)",
      table_unbalanced: "LỆCH ({0})",
      tourney_array_title: "ĐIỂM TRẬN ĐẤU",
      target_race_badge: "CHẠM {0}",
      net_points: "ĐIỂM",
      frames: "VÁN",
      player_placeholder: "Cơ thủ {0}",
      add_player: "CƠ THỦ ({0}/4)",
      remove_player: "Xóa cơ thủ",
      max_players: "Tối đa 4 cơ thủ",
      min_players: "Tối thiểu 1 cơ thủ",
      player_added: "Đã thêm {0}",
      player_removed: "Đã xóa {0}",
      rack_log: "LỊCH SỬ",
      chron_drawer_title: "NHẬT KÝ VÁN",
      more_info: "CHI TIẾT",
      less_info: "GỌN",
      wake: "MỞ KHÓA",
      blurred: "ĐÃ MỜ",
      empty_log: "CHƯA CÓ VÁN ĐẤU · BẤM + ĐỂ GHI NHẬN",
      focus_restored: "Đã mở khóa hiển thị lịch sử",
      extended_info_on: "Hiển thị chi tiết lịch sử",
      extended_info_off: "Xem gọn",
      modal_title_cash: "MỨC CƯỢC & THANH TOÁN",
      modal_title_tourney: "THỂ THỨC & THƯỞNG",
      rate_per_point: "MỖI ĐIỂM",
      target_race_label: "CHẠM MỤC TIÊU",
      who_pays_whom_header: "CHUYỂN TIỀN TRỰC TIẾP",
      no_transfers: "ĐIỂM CÂN BẰNG · KHÔNG CẦN CHUYỂN TIỀN",
      transfer_item: "<strong>{0}</strong> trả cho <strong>{1}</strong>: ${2}",
      apply_save: "ÁP DỤNG",
      close: "ĐÓNG",
      info_modal_title: "THÔNG TIN HỆ THỐNG",
      architect_tag: "KIẾN TRÚC SƯ & PHÁT TRIỂN CHÍNH",
      dual_mode_tag: "KIẾN TRÚC 2 CHẾ ĐỘ",
      tourney_negative_err: "Điểm thi đấu không thể âm",
      match_win_alert: "🏆 {0} CHIẾN THẮNG TRẬN ĐẤU (CHẠM {1})!",
      undo_toast: "HOÀN TÁC: Đã phục hồi {0}",
      redo_toast: "LÀM LẠI: Đã phục hồi {0}",
      pts_adjusted: "điểm điều chỉnh",
      sound_active: "ÂM THANH ĐÃ BẬT",
      sound_muted: "ĐÃ TẮT TIẾNG",
      lang_switched: "Ngôn ngữ: Tiếng Việt",
      snapshot: "Bàn đấu",
      lead: "Dẫn đầu",
    }
  };

  function t(key, ...args) {
    const lang = state.lang || "vi";
    let str = (I18N[lang] && I18N[lang][key]) || (I18N.en && I18N.en[key]) || key;
    args.forEach((val, idx) => {
      str = str.replace(new RegExp(`\\{${idx}\\}`, "g"), val);
    });
    return str;
  }

  // ═══════════════ APPLICATION STATE (ISOLATED DUAL-MODE MEMORY) ═══════════════
  let state = {
    activeMode: "cash", // "cash" or "tournament"
    lang: "vi",         // "vi" or "en"
    soundEnabled: true,
    theme: "dark",      // "dark" or "light"
    showExtendedHistory: false,

    // CASH MODE STATE (Zero-sum betting, negative scores permitted)
    cash: {
      players: [
        { id: 1, name: "Johnny Archer", score: 0 },
        { id: 2, name: "Shane Van Boening", score: 0 },
      ],
      stakeRate: 1.0,
      shotClockDuration: 45,
      history: [],
      undoStack: [],
      redoStack: [],
    },

    // TOURNAMENT MODE STATE (Race-to-X official frames, non-negative)
    tournament: {
      players: [
        { id: 101, name: "Efren Reyes", score: 0 },
        { id: 102, name: "Earl Strickland", score: 0 },
      ],
      stakeRate: 1.0,
      targetRace: 15,
      shotClockDuration: 45,
      history: [],
      undoStack: [],
      redoStack: [],
    }
  };

  // Helper to obtain the active mode's dedicated state
  function getModeState() {
    return state.activeMode === "tournament" ? state.tournament : state.cash;
  }

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

  // Masthead & Mode Switchers
  const btnModeCash = $("btnModeCash");
  const btnModeTournament = $("btnModeTournament");
  const btnLang = $("btnLang");
  const langDisplayText = $("langDisplayText");
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

  // Masthead localized spans
  const lblModeCash = $("lblModeCash");
  const lblModeTourney = $("lblModeTourney");

  // Tournament HUD Strip
  const hudLeadStat = $("hudLeadStat");
  const hudDeltaStat = $("hudDeltaStat");

  // Tournament Shot Clock Widget
  const lblShotClockTitle = $("lblShotClockTitle");
  const clockHeroDigits = $("clockHeroDigits");
  const lblClockSecRem = $("lblClockSecRem");
  const clockStatusChip = $("clockStatusChip");
  const clockExtLabel = $("clockExtLabel");
  const clockProgressFill = $("clockProgressFill");
  const btnClockStart = $("btnClockStart");
  const clockBtnIcon = $("clockBtnIcon");
  const clockBtnText = $("clockBtnText");
  const btnClockExt = $("btnClockExt");
  const lblClockExtBtn = $("lblClockExtBtn");
  const btnClockReset = $("btnClockReset");

  // Tournament Stakes Widget
  const lblStakesProtocolTitle = $("lblStakesProtocolTitle");
  const boxPerRack = $("boxPerRack");
  const lblPerRackVal = $("lblPerRackVal");
  const metricPerRackVal = $("metricPerRackVal");
  const boxCurrentPot = $("boxCurrentPot");
  const lblCurrentPot = $("lblCurrentPot");
  const metricCurrentPotVal = $("metricCurrentPotVal");
  const boxTargetFrame = $("boxTargetFrame");
  const lblTargetFrame = $("lblTargetFrame");
  const metricTargetRace = $("metricTargetRace");
  const racePillTag = $("racePillTag");
  const tourneyRaceBadge = $("tourneyRaceBadge");
  const lblShortcuts = $("lblShortcuts");
  const lblShortcutHint = $("lblShortcutHint");

  // Cash Mode Telemetry Bar
  const btnCashRateChip = $("btnCashRateChip");
  const cashStakeLabel = $("cashStakeLabel");
  const btnOpenSettlements = $("btnOpenSettlements");
  const lblWhoPaysWhom = $("lblWhoPaysWhom");
  const compactClockDigits = $("compactClockDigits");
  const btnCompactClockToggle = $("btnCompactClockToggle");
  const btnCompactClockExt = $("btnCompactClockExt");
  const btnCompactClockReset = $("btnCompactClockReset");

  // Cash Mode Integrated Zero-Sum Balance Bar
  const balanceStatusBar = $("balanceStatusBar");
  const balanceDot = $("balanceDot");
  const balanceStatusText = $("balanceStatusText");
  const totalSumEl = $("totalSum");

  // Tournament Header
  const lblTourneyArrayTitle = $("lblTourneyArrayTitle");

  // Players Array Container
  const playersArrayContainer = $("playersArrayContainer");

  // Tactical Actions
  const btnAddPlayer = $("btnAddPlayer");
  const lblAddPlayerBtn = $("lblAddPlayerBtn");
  const playerCountVal = $("playerCountVal");
  const btnRemovePlayer = $("btnRemovePlayer");
  const btnHoldReset = $("btnHoldReset");
  const holdResetLabel = $("holdResetLabel");
  const holdResetProgressBar = $("holdResetProgressBar");
  const btnToggleRackLog = $("btnToggleRackLog");
  const lblRackLogBtn = $("lblRackLogBtn");

  // Universal Rack Log Drawer & Extended Info Toggle
  const rackLogDrawer = $("rackLogDrawer");
  const lblChronDrawerTitle = $("lblChronDrawerTitle");
  const btnToggleExtendedHistory = $("btnToggleExtendedHistory");
  const moreInfoBtnText = $("moreInfoBtnText");
  const blurCountdownDisplay = $("blurCountdownDisplay");
  const btnWakeFocus = $("btnWakeFocus");
  const rackLogScrollList = $("rackLogScrollList");
  const emptyLogState = $("emptyLogState");
  const lblEmptyLog = $("lblEmptyLog");

  // Modals
  const stakesModal = $("stakesModal");
  const modalTitleText = $("modalTitleText");
  const lblRatePerPoint = $("lblRatePerPoint");
  const lblTargetMatchRace = $("lblTargetMatchRace");
  const lblBreakdownHeader = $("lblBreakdownHeader");
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
  const lblInfoModalTitle = $("lblInfoModalTitle");
  const lblArchitectTag = $("lblArchitectTag");
  const lblSpecsSummaryTag = $("lblSpecsSummaryTag");
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
      } catch {}
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
      if (fullscreenIcon) fullscreenIcon.textContent = "fullscreen_exit";
    } else {
      if (document.exitFullscreen) document.exitFullscreen().catch(() => {});
      if (fullscreenIcon) fullscreenIcon.textContent = "fullscreen";
    }
  }

  document.addEventListener("fullscreenchange", () => {
    if (fullscreenIcon) {
      fullscreenIcon.textContent = document.fullscreenElement ? "fullscreen_exit" : "fullscreen";
    }
  });

  // ═══════════════ AUDIO & TACTILE SYNTHESIZER ═══════════════
  let audioCtx = null;
  function getAudioContext() {
    if (!audioCtx) {
      const AudioCtx = window.AudioContext || window.webkitAudioContext;
      if (AudioCtx) audioCtx = new AudioCtx();
    }
    if (audioCtx && audioCtx.state === "suspended") {
      audioCtx.resume();
    }
    return audioCtx;
  }

  function playTone(freq = 440, dur = 0.05, type = "sine") {
    if (!state.soundEnabled) return;
    try {
      const ctx = getAudioContext();
      if (!ctx) return;
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      const t = ctx.currentTime;
      osc.type = type;
      osc.frequency.setValueAtTime(freq, t);
      gain.gain.setValueAtTime(0.12, t);
      gain.gain.exponentialRampToValueAtTime(0.001, t + dur);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(t);
      osc.stop(t + dur + 0.01);
    } catch {}
  }

  function playBallStrikeSound() {
    if (!state.soundEnabled) return;
    try {
      const ctx = getAudioContext();
      if (!ctx) return;
      const t = ctx.currentTime;
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = "triangle";
      osc.frequency.setValueAtTime(780, t);
      osc.frequency.exponentialRampToValueAtTime(140, t + 0.045);
      gain.gain.setValueAtTime(0.24, t);
      gain.gain.exponentialRampToValueAtTime(0.001, t + 0.045);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(t);
      osc.stop(t + 0.05);
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
    toastTimer = setTimeout(() => hudToast.classList.remove("show"), 2200);
  }

  // ═══════════════ PERSISTENCE & MIGRATION ═══════════════
  function saveState() {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
    } catch {}
  }

  function loadState() {
    try {
      const raw = localStorage.getItem(STORAGE_KEY) || localStorage.getItem("21n2_pool_dual_engine_v31");
      if (raw) {
        const parsed = JSON.parse(raw);
        if (parsed.cash && parsed.tournament) {
          Object.assign(state, parsed);
        } else {
          // Automatic migration from v3.1 single-state format
          if (parsed.gameMode) state.activeMode = parsed.gameMode;
          if (parsed.soundEnabled !== undefined) state.soundEnabled = parsed.soundEnabled;
          if (parsed.theme) state.theme = parsed.theme;
          if (parsed.showExtendedHistory !== undefined) state.showExtendedHistory = parsed.showExtendedHistory;
          if (parsed.players && parsed.players.length > 0) {
            state.cash.players = JSON.parse(JSON.stringify(parsed.players));
          }
          if (parsed.stakeRate) {
            state.cash.stakeRate = parsed.stakeRate;
            state.tournament.stakeRate = parsed.stakeRate;
          }
          if (parsed.history) {
            state.cash.history = JSON.parse(JSON.stringify(parsed.history));
          }
          if (parsed.targetRace) {
            state.tournament.targetRace = parsed.targetRace;
          }
        }
      }
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
      return `-${Math.abs(score)}`; // Clean: -1, -3
    }
    return score < 10 ? `0${score}` : `${score}`; // 00, 08, 12
  }

  // ═══════════════ LOCALIZATION CONTROLLER ═══════════════
  function setLanguage(lang) {
    state.lang = lang;
    document.documentElement.lang = lang;

    if (langDisplayText) {
      langDisplayText.textContent = lang.toUpperCase();
    }

    // Static text updates
    if (lblModeCash) lblModeCash.textContent = t("cash_mode");
    if (lblModeTourney) lblModeTourney.textContent = t("tourney_mode");
    if (lblShotClockTitle) lblShotClockTitle.textContent = t("shot_clock_title");
    if (lblClockSecRem) lblClockSecRem.textContent = t("sec_remaining");
    if (lblClockExtBtn) lblClockExtBtn.textContent = t("ext_btn");
    if (lblStakesProtocolTitle) lblStakesProtocolTitle.textContent = t("stakes_protocol_title");
    if (lblPerRackVal) lblPerRackVal.innerHTML = `<span class="material-symbols-outlined" style="font-size: 11px; vertical-align: middle;">sell</span> ${t("per_rack_val")}`;
    if (lblCurrentPot) lblCurrentPot.innerHTML = `<span class="material-symbols-outlined" style="font-size: 11px; vertical-align: middle;">savings</span> ${t("current_pot")}`;
    if (lblTargetFrame) lblTargetFrame.innerHTML = `<span class="material-symbols-outlined" style="font-size: 11px; vertical-align: middle;">flag</span> ${t("target_frame")}`;
    if (lblShortcuts) lblShortcuts.textContent = t("shortcuts");
    if (lblShortcutHint) lblShortcutHint.innerHTML = `<span class="material-symbols-outlined" style="font-size: 12px; vertical-align: middle;">touch_app</span> ${t("shortcut_hint")}`;
    if (lblWhoPaysWhom) lblWhoPaysWhom.textContent = t("who_pays_whom");
    if (lblTourneyArrayTitle) lblTourneyArrayTitle.textContent = t("tourney_array_title");
    if (btnRemovePlayer) btnRemovePlayer.title = t("remove_player");
    if (holdResetLabel) holdResetLabel.textContent = t("hold_reset");
    if (lblRackLogBtn) lblRackLogBtn.textContent = t("rack_log");
    if (lblChronDrawerTitle) lblChronDrawerTitle.textContent = t("chron_drawer_title");
    if (lblEmptyLog) lblEmptyLog.textContent = t("empty_log");
    if (lblRatePerPoint) lblRatePerPoint.innerHTML = `<span class="material-symbols-outlined" style="font-size: 13px; vertical-align: middle;">payments</span> ${t("rate_per_point")}`;
    if (lblTargetMatchRace) lblTargetMatchRace.innerHTML = `<span class="material-symbols-outlined" style="font-size: 13px; vertical-align: middle;">flag</span> ${t("target_race_label")}`;
    if (lblBreakdownHeader) lblBreakdownHeader.innerHTML = `<span class="material-symbols-outlined" style="font-size: 14px; vertical-align: middle;">sync_alt</span> <span>${t("who_pays_whom_header")}</span>`;
    
    const lblSaveBtnText = $("lblSaveBtnText");
    if (lblSaveBtnText) lblSaveBtnText.textContent = t("apply_save");
    if (lblInfoModalTitle) lblInfoModalTitle.textContent = t("info_modal_title");
    if (lblArchitectTag) lblArchitectTag.textContent = t("architect_tag");
    if (lblSpecsSummaryTag) lblSpecsSummaryTag.textContent = t("dual_mode_tag");
    
    const lblDismissBtnText = $("lblDismissBtnText");
    if (lblDismissBtnText) lblDismissBtnText.textContent = t("close");

    if (moreInfoBtnText) {
      moreInfoBtnText.textContent = state.showExtendedHistory ? t("less_info") : t("more_info");
    }

    renderShotClock();
    renderPlayers();
    renderRackLog();
    if (state.activeMode === "cash") {
      updateZeroSumAudit();
    } else {
      updateTournamentHUD();
    }
  }

  if (btnLang) {
    btnLang.addEventListener("click", () => {
      tactileFeedback();
      const nextLang = state.lang === "vi" ? "en" : "vi";
      setLanguage(nextLang);
      saveState();
      showToast(t("lang_switched"));
    });
  }

  // ═══════════════ DUAL-MODE ENGINE (COMPLETELY SEPARATE MEMORY) ═══════════════
  function setGameMode(mode) {
    if (state.activeMode !== mode) {
      stopShotClock();
    }
    state.activeMode = mode;
    document.documentElement.classList.remove("mode-cash", "mode-tournament");
    document.documentElement.classList.add(mode === "tournament" ? "mode-tournament" : "mode-cash");

    btnModeCash.classList.toggle("active", mode === "cash");
    btnModeTournament.classList.toggle("active", mode === "tournament");

    const mState = getModeState();
    clockTimeLeft = mState.shotClockDuration;
    renderShotClock();

    if (metricPerRackVal) metricPerRackVal.innerHTML = `$${mState.stakeRate.toFixed(2)} <small>/ PT</small>`;
    if (cashStakeLabel) cashStakeLabel.textContent = `$${mState.stakeRate.toFixed(2)} / PT`;

    if (mode === "tournament") {
      if (metricTargetRace) metricTargetRace.textContent = `RACE ${mState.targetRace}`;
      if (racePillTag) racePillTag.textContent = `RACE ${mState.targetRace}`;
      if (tourneyRaceBadge) tourneyRaceBadge.innerHTML = `<span class="material-symbols-outlined" style="font-size: 13px; vertical-align: middle;">flag</span> ${t("target_race_badge", mState.targetRace)}`;
    }

    // Update active clock chip for current mode
    document.querySelectorAll(".clock-mode-btn").forEach((chip) => {
      chip.classList.toggle("active", parseInt(chip.dataset.sec, 10) === mState.shotClockDuration);
    });

    if (modalTitleText) {
      modalTitleText.textContent = mode === "tournament" ? t("modal_title_tourney") : t("modal_title_cash");
    }

    tactileFeedback();
    saveState();
    renderPlayers();
    renderRackLog();
    updateUndoRedoUI();
    showToast(mode === "tournament" ? "🏆 " + t("tourney_mode") : "💰 " + t("cash_mode"));
  }

  btnModeCash.addEventListener("click", () => setGameMode("cash"));
  btnModeTournament.addEventListener("click", () => setGameMode("tournament"));

  // ═══════════════ ZERO-SUM AUDIT (INTEGRATED UPPER CARD) ═══════════════
  function updateZeroSumAudit() {
    if (state.activeMode !== "cash") return;

    const mState = state.cash;
    const currentSum = mState.players.reduce((sum, p) => sum + p.score, 0);
    const isBalanced = currentSum === 0;

    const cards = document.querySelectorAll(".player-championship-card");
    cards.forEach((c) => c.classList.toggle("hotcell", !isBalanced));

    if (balanceStatusBar) {
      balanceStatusBar.classList.toggle("unbalanced", !isBalanced);
    }
    if (balanceDot) {
      balanceDot.classList.toggle("alert", !isBalanced);
    }
    if (balanceStatusText) {
      balanceStatusText.textContent = isBalanced
        ? t("balanced_zero")
        : t("table_unbalanced", `${currentSum > 0 ? "+" : ""}${currentSum}`);
    }
    if (totalSumEl) {
      totalSumEl.textContent = `${currentSum > 0 ? "+" : ""}${currentSum}`;
    }
  }

  // ═══════════════ PAIRWISE SETTLEMENT & CASH TRANSFERS ═══════════════
  function calculateSettlements() {
    const mState = getModeState();
    const players = mState.players;
    const rate = parseFloat(mState.stakeRate) || 0;
    const netCash = {};

    if (state.activeMode === "cash") {
      players.forEach((p) => {
        netCash[p.id] = p.score * rate;
      });
    } else {
      const n = players.length;
      const netPoints = {};
      players.forEach((p) => (netPoints[p.id] = 0));

      for (let i = 0; i < n; i++) {
        for (let j = i + 1; j < n; j++) {
          const diff = players[i].score - players[j].score;
          netPoints[players[i].id] += diff;
          netPoints[players[j].id] -= diff;
        }
      }
      players.forEach((p) => {
        netCash[p.id] = netPoints[p.id] * rate;
      });
    }

    const debtors = [];
    const creditors = [];
    players.forEach((p) => {
      const amt = netCash[p.id] || 0;
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

  // ═══════════════ ULTRA-CLEAN PLAYER CARD RENDERING ═══════════════
  function renderPlayers() {
    playersArrayContainer.innerHTML = "";
    const mState = getModeState();
    const players = mState.players;
    const isCashMode = state.activeMode === "cash";
    const maxScore = Math.max(...players.map((p) => p.score));

    players.forEach((p, index) => {
      const isLeader = p.score > 0 && p.score === maxScore;

      const card = document.createElement("article");
      card.className = `player-championship-card ${isLeader ? "is-leader" : ""}`;
      card.id = `card-player-${p.id}`;

      card.innerHTML = `
        <input 
          type="text" 
          class="player-name-field" 
          value="${escapeHtml(p.name)}" 
          data-pid="${p.id}" 
          placeholder="${t("player_placeholder", index + 1)}"
          spellcheck="false"
        />

        <div class="card-score-row">
          <button class="btn-score-touch btn-dec" data-pid="${p.id}" title="Tap -1 · Hold 0.7s to drag">
            <span class="material-symbols-outlined">remove</span>
          </button>

          <div class="score-center-display">
            <span class="score-hero-digits" id="digits-${p.id}">${formatScore(p.score)}</span>
            <span class="score-sublabel">${isCashMode ? '<span class="material-symbols-outlined" style="font-size: 11px; vertical-align: middle;">monetization_on</span> ' + t("net_points") : '<span class="material-symbols-outlined" style="font-size: 11px; vertical-align: middle;">emoji_events</span> ' + t("frames")}</span>
          </div>

          <button class="btn-score-touch btn-inc" data-pid="${p.id}" title="Tap +1 · Hold 0.7s to drag">
            <span class="material-symbols-outlined">add</span>
          </button>
        </div>
      `;

      // Name change listener
      const nameInput = card.querySelector(".player-name-field");
      nameInput.addEventListener("change", (e) => {
        p.name = e.target.value.trim() || t("player_placeholder", index + 1);
        saveState();
        renderStakesModal();
      });

      nameInput.addEventListener("keydown", (e) => {
        if (e.key === "Enter") nameInput.blur();
      });

      // Attach 0.7s Hold & Direct Drag Gesture to + and - buttons
      const btnInc = card.querySelector(".btn-inc");
      const btnDec = card.querySelector(".btn-dec");

      attachScrubberGesture(btnInc, p.id, 1);
      attachScrubberGesture(btnDec, p.id, -1);

      playersArrayContainer.appendChild(card);
    });

    if (lblAddPlayerBtn) lblAddPlayerBtn.textContent = t("add_player", players.length);
    if (playerCountVal) playerCountVal.textContent = players.length;

    updateUndoRedoUI();

    // Telemetry Sync
    if (isCashMode) {
      if (cashStakeLabel) cashStakeLabel.textContent = `$${mState.stakeRate.toFixed(2)} / PT`;
      updateZeroSumAudit();
    } else {
      updateTournamentHUD();
    }
  }

  function getTournamentLeadSummary() {
    const players = state.tournament.players;
    const sorted = [...players].sort((a, b) => b.score - a.score);
    const leader = sorted[0];
    const runnerUp = sorted[1] || { score: 0 };
    const leadDiff = leader.score - runnerUp.score;

    if (leader.score === 0) return "EVEN (0-0)";
    if (leadDiff === 0) return `TIED (${leader.score})`;
    return `${leader.name.toUpperCase()} (+${leadDiff})`;
  }

  function updateTournamentHUD() {
    const mState = state.tournament;
    const players = mState.players;
    const sorted = [...players].sort((a, b) => b.score - a.score);
    const leader = sorted[0];
    const runnerUp = sorted[1] || { score: 0 };
    const leadDiff = leader.score - runnerUp.score;
    const { netCash } = calculateSettlements();

    if (hudLeadStat) {
      if (leader.score === 0) {
        hudLeadStat.innerHTML = `<span class="material-symbols-outlined" style="font-size: 13px; vertical-align: middle;">leaderboard</span> <strong>EVEN</strong>`;
      } else if (leadDiff === 0) {
        hudLeadStat.innerHTML = `<span class="material-symbols-outlined" style="font-size: 13px; vertical-align: middle;">leaderboard</span> <strong>TIED (${leader.score})</strong>`;
      } else {
        hudLeadStat.innerHTML = `<span class="material-symbols-outlined" style="font-size: 13px; vertical-align: middle;">leaderboard</span> <strong>${leader.name.toUpperCase()} (+${leadDiff})</strong>`;
      }
    }

    if (hudDeltaStat) {
      const cashDelta = (netCash[leader.id] || 0).toFixed(2);
      hudDeltaStat.innerHTML = `<span class="material-symbols-outlined" style="font-size: 13px; vertical-align: middle;">monetization_on</span> <strong>+$${cashDelta}</strong>`;
    }

    const totalPositive = players.reduce((sum, p) => sum + Math.max(0, p.score), 0);
    const pot = (totalPositive * mState.stakeRate).toFixed(2);
    if (metricCurrentPotVal) {
      metricCurrentPotVal.textContent = `$${pot}`;
    }
    if (tourneyRaceBadge) {
      tourneyRaceBadge.innerHTML = `<span class="material-symbols-outlined" style="font-size: 13px; vertical-align: middle;">flag</span> ${t("target_race_badge", mState.targetRace)}`;
    }
  }

  // ═══════════════ 0.7S HOLD & DIRECT SCORE DRAG (NO MODAL) ═══════════════
  /**
   * Normal tap (< 0.7s): Commits standard +/- 1 point.
   * Hold for 0.7s (700ms): Enters direct scrubbing mode.
   * Drag up/down: Directly changes digits on player card in real time (clamped 1 to 12).
   * Release: Commits the exact points selected in one action with immediate logging.
   */
  function attachScrubberGesture(btn, playerId, baseDirection) {
    let holdTimer = null;
    let isScrubbing = false;
    let startY = 0;
    let currentDelta = baseDirection;
    const HOLD_THRESHOLD_MS = 700;
    const PIXELS_PER_POINT = 14;

    function getDigitsEl() {
      return document.getElementById(`digits-${playerId}`);
    }

    function onPointerDown(e) {
      const pointer = e.touches ? e.touches[0] : e;
      startY = pointer.clientY;
      isScrubbing = false;
      currentDelta = baseDirection;

      const mState = getModeState();
      const player = mState.players.find((p) => p.id === playerId);
      const initialScore = player ? player.score : 0;
      const digitsEl = getDigitsEl();

      holdTimer = setTimeout(() => {
        // 0.7s reached: activate direct in-place scrubbing
        isScrubbing = true;
        btn.classList.add("scrubbing");
        if (digitsEl) digitsEl.classList.add("scrubbing-live");

        // Immediately preview the score directly on the card
        const previewScore = initialScore + currentDelta;
        if (digitsEl) digitsEl.textContent = formatScore(previewScore);

        playTone(baseDirection > 0 ? 560 : 330, 0.1);
        vibrateDevice([25, 20]);
      }, HOLD_THRESHOLD_MS);

      function onPointerMove(eMove) {
        if (!isScrubbing) return;
        if (eMove.cancelable) eMove.preventDefault();

        const pMove = eMove.touches ? eMove.touches[0] : eMove;
        const diffY = startY - pMove.clientY;

        let magnitude;
        if (baseDirection > 0) {
          magnitude = 1 + Math.floor(diffY / PIXELS_PER_POINT);
        } else {
          magnitude = 1 + Math.floor(-diffY / PIXELS_PER_POINT);
        }

        magnitude = Math.max(1, Math.min(12, magnitude));
        const nextDelta = magnitude * baseDirection;

        // In tournament mode, score cannot drop below 0
        if (state.activeMode === "tournament" && initialScore + nextDelta < 0) {
          return;
        }

        if (nextDelta !== currentDelta) {
          currentDelta = nextDelta;
          if (digitsEl) digitsEl.textContent = formatScore(initialScore + currentDelta);
          playTone(430 + magnitude * 32, 0.025);
          vibrateDevice(10);
        }
      }

      function onPointerUp() {
        clearTimeout(holdTimer);
        window.removeEventListener("mousemove", onPointerMove);
        window.removeEventListener("touchmove", onPointerMove);
        window.removeEventListener("mouseup", onPointerUp);
        window.removeEventListener("touchend", onPointerUp);

        btn.classList.remove("scrubbing");
        if (digitsEl) digitsEl.classList.remove("scrubbing-live");

        if (isScrubbing) {
          isScrubbing = false;
          modifyScore(playerId, currentDelta);
          showToast(`${currentDelta > 0 ? "+" : ""}${currentDelta} ${t("pts_adjusted")}`);
        } else {
          // Quick tap under 0.7s: standard +/- 1
          modifyScore(playerId, baseDirection);
        }
      }

      window.addEventListener("mousemove", onPointerMove, { passive: false });
      window.addEventListener("touchmove", onPointerMove, { passive: false });
      window.addEventListener("mouseup", onPointerUp, { once: true });
      window.addEventListener("touchend", onPointerUp, { once: true });
    }

    btn.addEventListener("mousedown", onPointerDown);
    btn.addEventListener("touchstart", onPointerDown, { passive: false });
  }

  // ═══════════════ SCORE ENGINE & FULL HISTORY LOGGING ═══════════════
  function modifyScore(playerId, delta, isUndoRedo = false) {
    const mState = getModeState();
    const player = mState.players.find((p) => p.id === playerId);
    if (!player) return;

    // IN TOURNAMENT MODE: frames cannot be negative
    if (state.activeMode === "tournament" && player.score + delta < 0) {
      tactileFeedback(true);
      showToast(t("tourney_negative_err"));
      return;
    }

    const prevScore = player.score;
    player.score = player.score + delta;

    tactileFeedback();

    const digitsEl = document.getElementById(`digits-${playerId}`);
    if (digitsEl) {
      digitsEl.textContent = formatScore(player.score);
      digitsEl.classList.remove("score-pop-anim");
      void digitsEl.offsetWidth;
      digitsEl.classList.add("score-pop-anim");
    }

    // Auto-record history log entry on ALL score changes (increments AND decrements)
    let logEntry = null;
    if (delta !== 0 && !isUndoRedo) {
      const now = new Date();
      const timeStr = `${String(now.getHours()).padStart(2, "0")}:${String(now.getMinutes()).padStart(2, "0")}`;
      const totalRacks = mState.players.reduce((sum, p) => sum + Math.max(0, p.score), 0);
      const snapshot = mState.players.map((p) => `${p.name}: ${p.score}`).join(" · ");
      const curSum = mState.players.reduce((sum, p) => sum + p.score, 0);

      logEntry = {
        rackNum: totalRacks,
        winnerName: player.name,
        delta: delta,
        time: timeStr,
        snapshot: snapshot,
        balanceAtTime: state.activeMode === "cash"
          ? (curSum === 0 ? t("balanced_zero") : t("table_unbalanced", `${curSum > 0 ? "+" : ""}${curSum}`))
          : `${t("lead")}: ${getTournamentLeadSummary()}`,
      };

      mState.history.unshift(logEntry);
      if (mState.history.length > 60) mState.history.pop();
      renderRackLog();
      resetBlurCountdown();

      // Tournament Mode Race Milestone Alert
      if (state.activeMode === "tournament" && player.score >= mState.targetRace) {
        showToast(t("match_win_alert", player.name.toUpperCase(), mState.targetRace));
        tactileFeedback(true);
        stopShotClock();
      }
    }

    if (!isUndoRedo) {
      mState.undoStack.push({
        playerId,
        delta,
        prevScore,
        newScore: player.score,
        logEntry,
      });
      mState.redoStack.length = 0;
    }

    saveState();
    renderPlayers();
    updateUndoRedoUI();
  }

  function updateUndoRedoUI() {
    const mState = getModeState();
    btnUndo.disabled = mState.undoStack.length === 0;
    btnRedo.disabled = mState.redoStack.length === 0;
  }

  function handleUndoAction() {
    const mState = getModeState();
    if (mState.undoStack.length === 0) return;
    const action = mState.undoStack.pop();
    const player = mState.players.find((p) => p.id === action.playerId);
    if (player) {
      player.score = action.prevScore;

      if (action.logEntry) {
        mState.history = mState.history.filter((h) => h !== action.logEntry);
        renderRackLog();
        resetBlurCountdown();
      }

      mState.redoStack.push(action);
      tactileFeedback();
      showToast(t("undo_toast", player.name));
      saveState();
      renderPlayers();
      updateUndoRedoUI();
    }
  }

  function handleRedoAction() {
    const mState = getModeState();
    if (mState.redoStack.length === 0) return;
    const action = mState.redoStack.pop();
    const player = mState.players.find((p) => p.id === action.playerId);
    if (player) {
      player.score = action.newScore;

      if (action.logEntry) {
        mState.history.unshift(action.logEntry);
        renderRackLog();
        resetBlurCountdown();
      }

      mState.undoStack.push(action);
      tactileFeedback();
      showToast(t("redo_toast", player.name));
      saveState();
      renderPlayers();
      updateUndoRedoUI();
    }
  }

  // ═══════════════ SHOT CLOCK ENGINE ═══════════════
  function renderShotClock() {
    const formatted = String(clockTimeLeft).padStart(2, "0");
    if (clockHeroDigits) clockHeroDigits.textContent = formatted;
    if (compactClockDigits) compactClockDigits.textContent = `${clockTimeLeft}s`;

    const mState = getModeState();
    const pct = Math.max(0, Math.min(100, (clockTimeLeft / mState.shotClockDuration) * 100));
    if (clockProgressFill) clockProgressFill.style.width = `${pct}%`;

    const isCrit = isClockRunning && clockTimeLeft <= 5;
    if (clockHeroDigits) clockHeroDigits.classList.toggle("crit", isCrit);
    if (clockProgressFill) clockProgressFill.classList.toggle("crit", isCrit);

    if (clockStatusChip) {
      if (clockTimeLeft === 0) {
        clockStatusChip.textContent = t("time_foul");
        clockStatusChip.className = "status-chip foul";
      } else if (isClockRunning) {
        clockStatusChip.textContent = t("running");
        clockStatusChip.className = "status-chip running";
      } else {
        clockStatusChip.textContent = t("standby");
        clockStatusChip.className = "status-chip";
      }
    }

    const clockExtText = $("clockExtText");
    if (clockExtText) {
      clockExtText.textContent = t("extensions_left", MAX_EXTENSIONS - extensionsUsed, MAX_EXTENSIONS);
    } else if (clockExtLabel) {
      clockExtLabel.innerHTML = `<span class="material-symbols-outlined" style="font-size: 12px; vertical-align: middle;">history</span> ${t("extensions_left", MAX_EXTENSIONS - extensionsUsed, MAX_EXTENSIONS)}`;
    }

    if (clockBtnText) {
      clockBtnText.textContent = isClockRunning ? t("pause_clock") : t("start_clock");
    }

    const compactClockIcon = $("compactClockIcon");
    if (compactClockIcon) {
      compactClockIcon.textContent = isClockRunning ? "pause" : "play_arrow";
    }
  }

  function startShotClock() {
    clearInterval(clockInterval);
    isClockRunning = true;
    if (clockBtnIcon) clockBtnIcon.textContent = "pause";
    if (clockBtnText) clockBtnText.textContent = t("pause_clock");
    const compactClockIcon = $("compactClockIcon");
    if (compactClockIcon) compactClockIcon.textContent = "pause";

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
          showToast(t("clock_expired"));
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
    if (clockBtnIcon) clockBtnIcon.textContent = "play_arrow";
    if (clockBtnText) clockBtnText.textContent = t("start_clock");
    const compactClockIcon = $("compactClockIcon");
    if (compactClockIcon) compactClockIcon.textContent = "play_arrow";
    renderShotClock();
  }

  function resetShotClock() {
    stopShotClock();
    const mState = getModeState();
    clockTimeLeft = mState.shotClockDuration;
    renderShotClock();
  }

  // Large Tournament Clock Handlers
  if (btnClockStart) {
    btnClockStart.addEventListener("click", () => {
      tactileFeedback();
      if (isClockRunning) stopShotClock();
      else {
        const mState = getModeState();
        if (clockTimeLeft === 0) clockTimeLeft = mState.shotClockDuration;
        startShotClock();
      }
    });
  }

  if (btnClockExt) {
    btnClockExt.addEventListener("click", () => {
      tactileFeedback();
      clockTimeLeft = Math.min(90, clockTimeLeft + 30);
      extensionsUsed = Math.min(MAX_EXTENSIONS, extensionsUsed + 1);
      renderShotClock();
      showToast(t("ext_granted"));
    });
  }

  if (btnClockReset) {
    btnClockReset.addEventListener("click", () => {
      tactileFeedback();
      resetShotClock();
    });
  }

  // Compact Cash Clock Handlers
  if (btnCompactClockToggle) {
    btnCompactClockToggle.addEventListener("click", () => {
      tactileFeedback();
      if (isClockRunning) stopShotClock();
      else {
        const mState = getModeState();
        if (clockTimeLeft === 0) clockTimeLeft = mState.shotClockDuration;
        startShotClock();
      }
    });
  }

  if (btnCompactClockExt) {
    btnCompactClockExt.addEventListener("click", () => {
      tactileFeedback();
      clockTimeLeft = Math.min(90, clockTimeLeft + 30);
      renderShotClock();
      showToast(t("ext_granted"));
    });
  }

  if (btnCompactClockReset) {
    btnCompactClockReset.addEventListener("click", () => {
      tactileFeedback();
      resetShotClock();
    });
  }

  // Mode Preset Chips (30S, 45S, 60S)
  document.querySelectorAll(".clock-mode-btn").forEach((chip) => {
    chip.addEventListener("click", () => {
      tactileFeedback();
      const sec = parseInt(chip.dataset.sec, 10) || 45;
      const mState = getModeState();
      mState.shotClockDuration = sec;
      document.querySelectorAll(".clock-mode-btn").forEach((c) => c.classList.remove("active"));
      chip.classList.add("active");
      resetShotClock();
      saveState();
      showToast(t("clock_set", sec));
    });
  });

  // ═══════════════ RACK LOG & EXTENDED INFO (FULL LOGGING) ═══════════════
  function renderRackLog() {
    if (!rackLogScrollList) return;
    rackLogScrollList.innerHTML = "";
    const mState = getModeState();

    if (mState.history.length === 0) {
      if (emptyLogState) {
        emptyLogState.style.display = "flex";
        rackLogScrollList.appendChild(emptyLogState);
      }
      return;
    }

    if (emptyLogState) emptyLogState.style.display = "none";
    mState.history.forEach((h) => {
      const row = document.createElement("div");
      row.className = "log-entry-row";
      const isPositive = (h.delta || 0) > 0;
      const deltaSign = isPositive ? "+" : "";
      const deltaClass = isPositive ? "inc" : "dec";
      const rackDisplay = h.rackNum > 0 ? `R-${String(h.rackNum).padStart(2, "0")}` : "ACT";

      row.innerHTML = `
        <div class="log-entry-main">
          <span class="log-rack-num">${rackDisplay}</span>
          <span class="log-winner-name">${escapeHtml(h.winnerName)}</span>
          <span class="log-point-delta ${deltaClass}">${deltaSign}${h.delta}</span>
          <span class="log-timestamp">${h.time}</span>
        </div>
        <div class="log-extended-info">
          <span>${t("snapshot")}: ${escapeHtml(h.snapshot || "")}</span>
          <span>${escapeHtml(h.balanceAtTime || "")}</span>
        </div>
      `;
      rackLogScrollList.appendChild(row);
    });
  }

  if (btnToggleExtendedHistory) {
    btnToggleExtendedHistory.addEventListener("click", () => {
      tactileFeedback();
      state.showExtendedHistory = !state.showExtendedHistory;
      rackLogDrawer.classList.toggle("show-extended", state.showExtendedHistory);
      btnToggleExtendedHistory.classList.toggle("active", state.showExtendedHistory);
      
      const moreInfoIcon = $("moreInfoIcon");
      if (moreInfoIcon) {
        moreInfoIcon.textContent = state.showExtendedHistory ? "unfold_less" : "unfold_more";
      }
      if (moreInfoBtnText) {
        moreInfoBtnText.textContent = state.showExtendedHistory ? t("less_info") : t("more_info");
      }
      saveState();
      showToast(state.showExtendedHistory ? t("extended_info_on") : t("extended_info_off"));
    });
  }

  function resetBlurCountdown() {
    if (!rackLogDrawer) return;
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
        if (blurCountdownDisplay) blurCountdownDisplay.textContent = t("blurred");
        clearInterval(blurTimerId);
      }
    }, 1000);
  }

  function updateBlurDisplay() {
    if (!blurCountdownDisplay) return;
    const m = Math.floor(blurSecondsLeft / 60);
    const s = blurSecondsLeft % 60;
    blurCountdownDisplay.textContent = `${m}m ${String(s).padStart(2, "0")}s`;
  }

  if (rackLogDrawer) rackLogDrawer.addEventListener("click", resetBlurCountdown);
  if (btnWakeFocus) {
    btnWakeFocus.addEventListener("click", (e) => {
      e.stopPropagation();
      resetBlurCountdown();
      showToast(t("focus_restored"));
    });
  }

  if (btnToggleRackLog) {
    btnToggleRackLog.addEventListener("click", () => {
      tactileFeedback();
      rackLogDrawer.scrollIntoView({ behavior: "smooth" });
      resetBlurCountdown();
    });
  }

  // ═══════════════ PLAYER ROSTER (2 to 4 Players) ═══════════════
  btnAddPlayer.addEventListener("click", () => {
    const mState = getModeState();
    if (mState.players.length >= 4) {
      btnAddPlayer.classList.add("flash-danger");
      setTimeout(() => btnAddPlayer.classList.remove("flash-danger"), 250);
      showToast(t("max_players"));
      tactileFeedback(true);
      return;
    }

    const nextId = mState.players.reduce((max, p) => Math.max(max, p.id), 0) + 1;
    const defaultNames = state.activeMode === "tournament"
      ? ["Efren Reyes", "Earl Strickland", "Thorsten Hohmann", "Niels Feijen"]
      : ["Johnny Archer", "Shane Van Boening", "Alex Pagulayan", "Francisco Bustamante"];

    const fallbackName = defaultNames[mState.players.length] || t("player_placeholder", mState.players.length + 1);

    mState.players.push({
      id: nextId,
      name: fallbackName,
      score: 0,
    });

    tactileFeedback();
    saveState();
    renderPlayers();
    showToast(t("player_added", fallbackName));
  });

  btnRemovePlayer.addEventListener("click", () => {
    const mState = getModeState();
    if (mState.players.length <= 1) {
      btnRemovePlayer.classList.add("flash-danger");
      setTimeout(() => btnRemovePlayer.classList.remove("flash-danger"), 250);
      showToast(t("min_players"));
      tactileFeedback(true);
      return;
    }

    const removed = mState.players.pop();
    tactileFeedback();
    saveState();
    renderPlayers();
    showToast(t("player_removed", removed.name));
  });

  // ═══════════════ HOLD 2S RESET SAFETY ═══════════════
  let holdResetTimer = null;
  let holdResetStart = 0;
  const HOLD_DURATION_MS = 1800;

  function cancelHoldReset() {
    clearInterval(holdResetTimer);
    holdResetTimer = null;
    holdResetProgressBar.style.width = "0%";
  }

  function startHoldReset(e) {
    e.preventDefault();
    holdResetStart = Date.now();
    holdResetTimer = setInterval(() => {
      const elapsed = Date.now() - holdResetStart;
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
    if (confirm(t("reset_confirm"))) {
      executeFullReset();
    }
  });

  function executeFullReset() {
    const mState = getModeState();
    mState.players.forEach((p) => {
      p.score = 0;
    });
    mState.history = [];
    mState.undoStack.length = 0;
    mState.redoStack.length = 0;
    resetShotClock();
    saveState();
    renderPlayers();
    renderRackLog();
    resetBlurCountdown();
    tactileFeedback(true);
    showToast(t("reset_done"));
  }

  // ═══════════════ STAKES & SETTLEMENT MODAL ═══════════════
  function renderStakesModal() {
    const mState = getModeState();
    stakeInputRate.value = mState.stakeRate.toFixed(2);
    if (raceInputTarget && state.activeMode === "tournament") {
      raceInputTarget.value = mState.targetRace;
    }

    document.querySelectorAll(".preset-chip:not(.race-chip)").forEach((chip) => {
      chip.classList.toggle("active", Math.abs(parseFloat(chip.dataset.v) - mState.stakeRate) < 0.01);
    });

    if (state.activeMode === "tournament") {
      document.querySelectorAll(".race-chip").forEach((chip) => {
        chip.classList.toggle("active", parseInt(chip.dataset.r, 10) === mState.targetRace);
      });
    }

    const { netCash, transfers } = calculateSettlements();
    modalSettlementRoster.innerHTML = "";
    mState.players.forEach((p) => {
      const val = netCash[p.id] || 0;
      const isWin = val >= 0;
      const row = document.createElement("div");
      row.className = "settle-row";
      row.innerHTML = `
        <span>${escapeHtml(p.name)} (${p.score} pts)</span>
        <strong class="${isWin ? "win" : "loss"}">${isWin ? "+" : "-"}$${Math.abs(val).toFixed(2)}</strong>
      `;
      modalSettlementRoster.appendChild(row);
    });

    modalTransfersLedger.innerHTML = "";
    if (transfers.length === 0) {
      modalTransfersLedger.innerHTML = `
        <div class="xfer-item-row">
          <span class="material-symbols-outlined" style="font-size: 15px;">check_circle</span>
          <span>${t("no_transfers")}</span>
        </div>
      `;
    } else {
      transfers.forEach((tr) => {
        const item = document.createElement("div");
        item.className = "xfer-item-row";
        item.innerHTML = `
          <span class="material-symbols-outlined" style="font-size: 15px;">arrow_forward</span>
          <span>${t("transfer_item", escapeHtml(tr.from), escapeHtml(tr.to), tr.amount)}</span>
        `;
        modalTransfersLedger.appendChild(item);
      });
    }
  }

  function openStakesModal() {
    tactileFeedback();
    renderStakesModal();
    stakesModal.classList.add("open");
  }

  if (btnOpenSettlements) btnOpenSettlements.addEventListener("click", openStakesModal);
  if (btnCashRateChip) btnCashRateChip.addEventListener("click", openStakesModal);
  if (boxPerRack) boxPerRack.addEventListener("click", openStakesModal);
  if (boxTargetFrame) boxTargetFrame.addEventListener("click", openStakesModal);

  btnCloseStakesModal.addEventListener("click", () => stakesModal.classList.remove("open"));
  stakesModal.addEventListener("click", (e) => {
    if (e.target === stakesModal) stakesModal.classList.remove("open");
  });

  btnSaveStakes.addEventListener("click", () => {
    tactileFeedback();
    const mState = getModeState();
    mState.stakeRate = Math.max(0, parseFloat(stakeInputRate.value) || 1.0);
    if (raceInputTarget && state.activeMode === "tournament") {
      mState.targetRace = Math.max(1, parseInt(raceInputTarget.value, 10) || 15);
    }
    if (metricPerRackVal) metricPerRackVal.innerHTML = `$${mState.stakeRate.toFixed(2)} <small>/ PT</small>`;
    if (metricTargetRace) metricTargetRace.textContent = `RACE ${mState.targetRace}`;
    if (racePillTag) racePillTag.textContent = `RACE ${mState.targetRace}`;
    if (tourneyRaceBadge) tourneyRaceBadge.innerHTML = `<span class="material-symbols-outlined" style="font-size: 13px; vertical-align: middle;">flag</span> ${t("target_race_badge", mState.targetRace)}`;
    if (cashStakeLabel) cashStakeLabel.textContent = `$${mState.stakeRate.toFixed(2)} / PT`;
    saveState();
    renderPlayers();
    stakesModal.classList.remove("open");
    showToast(`Saved: $${mState.stakeRate.toFixed(2)}/pt`);
  });

  btnStakeStepMinus.addEventListener("click", () => {
    const mState = getModeState();
    stakeInputRate.value = Math.max(0, parseFloat(stakeInputRate.value) - 0.5).toFixed(2);
    mState.stakeRate = parseFloat(stakeInputRate.value);
    renderStakesModal();
  });

  btnStakeStepPlus.addEventListener("click", () => {
    const mState = getModeState();
    stakeInputRate.value = (parseFloat(stakeInputRate.value) + 0.5).toFixed(2);
    mState.stakeRate = parseFloat(stakeInputRate.value);
    renderStakesModal();
  });

  if (btnRaceMinus) {
    btnRaceMinus.addEventListener("click", () => {
      if (state.activeMode !== "tournament") return;
      raceInputTarget.value = Math.max(1, parseInt(raceInputTarget.value, 10) - 1);
      state.tournament.targetRace = parseInt(raceInputTarget.value, 10);
      renderStakesModal();
    });
  }

  if (btnRacePlus) {
    btnRacePlus.addEventListener("click", () => {
      if (state.activeMode !== "tournament") return;
      raceInputTarget.value = parseInt(raceInputTarget.value, 10) + 1;
      state.tournament.targetRace = parseInt(raceInputTarget.value, 10);
      renderStakesModal();
    });
  }

  document.querySelectorAll(".preset-chip:not(.race-chip)").forEach((chip) => {
    chip.addEventListener("click", () => {
      const mState = getModeState();
      mState.stakeRate = parseFloat(chip.dataset.v);
      stakeInputRate.value = mState.stakeRate.toFixed(2);
      renderStakesModal();
    });
  });

  document.querySelectorAll(".race-chip").forEach((chip) => {
    chip.addEventListener("click", () => {
      if (state.activeMode !== "tournament") return;
      state.tournament.targetRace = parseInt(chip.dataset.r, 10);
      if (raceInputTarget) raceInputTarget.value = state.tournament.targetRace;
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
    showToast(state.soundEnabled ? t("sound_active") : t("sound_muted"));
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

  // ═══════════════ KEYBOARD SHORTCUTS ═══════════════
  window.addEventListener("keydown", (e) => {
    if (e.target.tagName === "INPUT") return;

    const mState = getModeState();
    const key = e.key.toLowerCase();
    if (e.code === "Space") {
      e.preventDefault();
      if (state.activeMode === "tournament" && btnClockStart) btnClockStart.click();
      else if (btnCompactClockToggle) btnCompactClockToggle.click();
    } else if (key === "w" && mState.players[0]) {
      modifyScore(mState.players[0].id, 1);
    } else if (key === "q" && mState.players[0]) {
      modifyScore(mState.players[0].id, -1);
    } else if (key === "p" && mState.players[1]) {
      modifyScore(mState.players[1].id, 1);
    } else if (key === "o" && mState.players[1]) {
      modifyScore(mState.players[1].id, -1);
    } else if (key === "e") {
      if (btnClockExt) btnClockExt.click();
      else if (btnCompactClockExt) btnCompactClockExt.click();
    } else if (key === "r") {
      if (btnClockReset) btnClockReset.click();
      else if (btnCompactClockReset) btnCompactClockReset.click();
    } else if (key === "z" && (e.ctrlKey || e.metaKey)) {
      e.preventDefault();
      handleUndoAction();
    }
  });

  // ═══════════════ INITIALIZATION ═══════════════
  function init() {
    loadState();
    applyTheme(state.theme);

    // Apply language
    setLanguage(state.lang || "vi");

    // Apply active mode
    setGameMode(state.activeMode || "cash");

    // Request screen wake lock
    requestScreenWakeLock();

    soundIcon.textContent = state.soundEnabled ? "volume_up" : "volume_off";

    // Restore extended history preference
    if (rackLogDrawer) {
      rackLogDrawer.classList.toggle("show-extended", !!state.showExtendedHistory);
    }
    if (btnToggleExtendedHistory) {
      btnToggleExtendedHistory.classList.toggle("active", !!state.showExtendedHistory);
    }

    resetBlurCountdown();
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
  } else {
    init();
  }
})();
