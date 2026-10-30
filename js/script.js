/**
 * Championship Pool Scoreboard · Dual-Mode Protocol Engine v3.4.0
 * Features:
 * - Clean Icon-Driven UI (Unnecessary word content stripped & replaced with Google Material Symbols)
 * - 100% Isolated Dual-Mode Memory (Cash Ring Game vs WPA Tournament Frame)
 * - Upper Card Integrated Zero-Sum Balance Telemetry
 * - Full History Ledger (Monotonic ledger ids, increments, decrements, undo/redo)
 * - 0.7s Fast Direct Score Drag Gesture (Single Pointer Events stream, no double-count)
 * - Vietnamese (VI) & English (EN) Localization Switcher
 * - Screen Wake Lock, Fullscreen API, Web Audio Clicks, Native Haptics
 *
 * v3.4.0 hardening:
 * - One Pointer Events stream per score button (a tap used to score ±2 on touch)
 * - Attribute-safe escaping (player names can no longer inject markup)
 * - Modal edits are drafted and only committed by APPLY
 * - Global shortcuts/Escape respect open dialogs; redo shortcut added
 * - Shot-clock extensions enforced, reset per shot, and stored per mode
 * - In-place score refresh instead of a full card rebuild on every point
 *
 * v3.4.x offline: vendored fonts (no CDN), service worker precache, web manifest
 * + install prompt and home-screen shortcuts (?mode=cash / ?mode=tournament).
 * See README.md - bump VERSION in sw.js when css/js/fonts change.
 */

(() => {
  "use strict";

  const STORAGE_KEY = "21n2_pool_dual_engine_v32";
  const OFFLINE_FLAG_KEY = "21n2_offline_announced";

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
      restart_clock: "RESTART",
      pause_clock: "PAUSE",
      ext_btn: "+30S",
      ext_granted: "+30s Extension Granted",
      ext_exhausted: "Extension already used for this shot",
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
      modal_title_cash: "STAKES CONFIG",
      modal_title_tourney: "STAKES CONFIG",
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
      session_clock: "SESSION",
      session_paused: "Session Paused",
      session_resumed: "Session Resumed",
      session_reset_toast: "Session Clock Reset",
      shot_restarted: "Shot Clock Restarted",
      format_us_toast: "🎱 Format: American Pool (±1)",
      format_cn_toast: "🎱 Format: Chinese Pool (+4, +7, +10)",
      sound_active: "AUDIO ACTIVE",
      sound_muted: "MUTED",
      lang_switched: "Language: English",
      snapshot: "Table",
      lead: "Lead",
      hud_even: "EVEN",
      hud_tied: "TIED ({0})",
      hud_lead: "{0} (+{1})",
      lead_even: "EVEN (0-0)",
      lead_tied: "TIED ({0})",
      lead_named: "{0} (+{1})",
      stake_saved: "Applied: ${0} / PT",
      pts_suffix: "{0} PTS",
      aria_inc: "Add 1 point for {0}",
      aria_dec: "Remove 1 point for {0}",
      offline_cached: "Saved for offline use · works without internet",
      offline_ready: "OFFLINE READY",
      offline_pending: "GO ONLINE ONCE TO ENABLE OFFLINE MODE",
      update_ready: "New version ready · reopen the app to update",
      install_app: "INSTALL ON THIS DEVICE",
      install_done: "App installed · launch it from your home screen",
      // Tutorial / Quick Reference Guide
      guide_title: "QUICK REFERENCE GUIDE",
      guide_open: "HOW TO USE THIS APP",
      guide_got_it: "GOT IT · START PLAYING",
      guide_modes_header: "CHOOSE YOUR GAME MODE",
      guide_cash_title: "CASH RING",
      guide_cash_tag: "Points & Stakes",
      guide_cash_b1: "Negative scores allowed (-3)",
      guide_cash_b2: "Configurable stake rate ($/PT)",
      guide_cash_b3: "Built-in compact shot clock",
      guide_tourney_title: "TOURNAMENT",
      guide_tourney_tag: "Match Frames & Clock",
      guide_tourney_b1: "Negative and positive frame scores",
      guide_tourney_b2: "30s / 45s / 60s shot clock",
      guide_tourney_b3: "Quick reset & undo anytime",
      guide_modes_note: "100% separate memory: switching modes never wipes your scores or history.",
      guide_controls_header: "CONTROLS CHEAT SHEET",
      guide_key_tap: "TAP + / −",
      guide_action_tap_title: "±1 Point",
      guide_action_tap_desc: "Quick single-point tap",
      guide_key_drag: "HOLD 0.7S",
      guide_action_drag_title: "Slide 1–20 Pts",
      guide_action_drag_desc: "Drag up/down · Hold to auto-increment to 20",
      guide_key_undo: "CTRL + Z",
      guide_action_undo_title: "Undo / Redo",
      guide_action_undo_desc: "Revert scoring mistakes anytime",
      guide_key_settle: "SETTLE",
      guide_action_settle_title: "Who Pays Whom",
      guide_action_settle_desc: "Exact pairwise cash payouts",
      guide_key_clock: "SPACE",
      guide_action_clock_title: "Shot Clock",
      guide_action_clock_desc: "Start/Restart shot · Pause button · +30s",
      guide_key_log: "LOG",
      guide_action_log_title: "Rack Ledger",
      guide_action_log_desc: "Full history & score snapshots",
      guide_badge_wake: "SCREEN AWAKE",
      guide_badge_offline: "OFFLINE READY",
      guide_badge_lang: "EN / VI TOGGLE",
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
      restart_clock: "ĐẶT LẠI",
      pause_clock: "TẠM DỪNG",
      ext_btn: "+30S",
      ext_granted: "Đã cộng thêm 30s gia hạn",
      ext_exhausted: "Đã dùng hết lượt gia hạn cho lượt đánh này",
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
      modal_title_cash: "CẤU HÌNH TIỀN ĐIỂM",
      modal_title_tourney: "CẤU HÌNH TIỀN ĐIỂM",
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
      session_clock: "TRẬN ĐẤU",
      session_paused: "Đã tạm dừng thời gian trận",
      session_resumed: "Tiếp tục tính giờ trận",
      session_reset_toast: "Đã đặt lại thời gian trận về 00:00:00",
      shot_restarted: "Đã bắt đầu lại lượt đánh mới",
      format_us_toast: "🎱 Thể thức: Bida Mỹ (±1)",
      format_cn_toast: "🎱 Thể thức: Bida Lỗ Tàu (+4, +7, +10)",
      sound_active: "ÂM THANH ĐÃ BẬT",
      sound_muted: "ĐÃ TẮT TIẾNG",
      lang_switched: "Ngôn ngữ: Tiếng Việt",
      snapshot: "Bàn đấu",
      lead: "Dẫn đầu",
      hud_even: "CĂN BẰNG",
      hud_tied: "HÒA ({0})",
      hud_lead: "{0} (+{1})",
      lead_even: "CĂN BẰNG (0-0)",
      lead_tied: "HÒA ({0})",
      lead_named: "{0} (+{1})",
      stake_saved: "Đã áp dụng: ${0}/điểm",
      pts_suffix: "{0} ĐIỂM",
      aria_inc: "Cộng 1 điểm cho {0}",
      aria_dec: "Trừ 1 điểm cho {0}",
      offline_cached: "Đã lưu để dùng ngoại tuyến · không cần mạng",
      offline_ready: "SẴN SÀNG NGOẠI TUYẾN",
      offline_pending: "CẦN MẠNG 1 LẦN ĐỂ BẬT CHẾ ĐỘ NGOẠI TUYẾN",
      update_ready: "Có bản mới · mở lại ứng dụng để cập nhật",
      install_app: "CÀI ĐẶT LÊN THIẾT BỊ NÀY",
      install_done: "Đã cài ứng dụng · mở từ màn hình chính",
      // Tutorial / Quick Reference Guide
      guide_title: "HƯỚNG DẪN NHANH",
      guide_open: "HƯỚNG DẪN SỬ DỤNG",
      guide_got_it: "ĐÃ HIỂU · BẮT ĐẦU",
      guide_modes_header: "CHỌN CHẾ ĐỘ CHƠI",
      guide_cash_title: "ĐÁNH ĐIỂM",
      guide_cash_tag: "Đánh điểm & Mức cược",
      guide_cash_b1: "Cho phép điểm âm (-3)",
      guide_cash_b2: "Cài đặt mức tiền mỗi điểm ($/điểm)",
      guide_cash_b3: "Tích hợp đồng hồ shot gọn gàng",
      guide_tourney_title: "THI ĐẤU",
      guide_tourney_tag: "Điểm ván đấu & Đồng hồ",
      guide_tourney_b1: "Hỗ trợ cả điểm âm và dương",
      guide_tourney_b2: "Đồng hồ shot 30s / 45s / 60s",
      guide_tourney_b3: "Đặt lại & hoàn tác bất cứ lúc nào",
      guide_modes_note: "Lưu bộ nhớ riêng 100%: chuyển chế độ không bao giờ mất điểm hay lịch sử.",
      guide_controls_header: "BẢNG THAO TÁC NHANH",
      guide_key_tap: "BẤM + / −",
      guide_action_tap_title: "±1 Điểm",
      guide_action_tap_desc: "Chạm nút để chỉnh 1 điểm",
      guide_key_drag: "GIỮ 0.7S",
      guide_action_drag_title: "Trượt 1–20 Điểm",
      guide_action_drag_desc: "Kéo lên/xuống · Giữ nguyên để tự tăng đến 20",
      guide_key_undo: "CTRL + Z",
      guide_action_undo_title: "Hoàn tác / Làm lại",
      guide_action_undo_desc: "Khắc phục sai sót điểm tức thì",
      guide_key_settle: "QUỸ TIỀN",
      guide_action_settle_title: "Ai Trả Tiền Ai",
      guide_action_settle_desc: "Danh sách chuyển tiền tối ưu",
      guide_key_clock: "PHÍM CÁCH",
      guide_action_clock_title: "Đồng Hồ Shot",
      guide_action_clock_desc: "Bắt đầu/Bắt đầu lại · Nút tạm dừng · +30s",
      guide_key_log: "LỊCH SỬ",
      guide_action_log_title: "Nhật Ký Ván",
      guide_action_log_desc: "Lịch sử kèm mốc giờ & trạng thái bàn",
      guide_badge_wake: "MÀN HÌNH LUÔN SÁNG",
      guide_badge_offline: "LƯU NGOẠI TUYẾN",
      guide_badge_lang: "CHUYỂN ĐỔI EN / VI",
    }
  };

  function t(key, ...args) {
    const lang = state.lang || "vi";
    let str = (I18N[lang] && I18N[lang][key]) || (I18N.en && I18N.en[key]) || key;
    args.forEach((val, idx) => {
      // "$" must be doubled, otherwise a value like "$1.00" is treated as a
      // $1 / $& replacement pattern and silently corrupts the output.
      const safeVal = String(val).replace(/\$/g, "$$$$");
      str = str.replace(new RegExp(`\\{${idx}\\}`, "g"), safeVal);
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
    tutorialSeen: false,
    sessionStartTime: Date.now(),
    sessionElapsedMs: 0,
    isSessionPaused: false,

    // CASH MODE STATE (Zero-sum betting, negative scores permitted)
    cash: {
      players: [
        { id: 1, name: "Johnny Archer", score: 0 },
        { id: 2, name: "Shane Van Boening", score: 0 },
      ],
      stakeRate: 1.0,
      shotClockDuration: 45,
      extensionsUsed: 0,
      rackSeq: 0,
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
      format: "american", // "american" (±1) or "chinese" (+4, +7, +10)
      stakeRate: 1.0,
      targetRace: 15,
      shotClockDuration: 45,
      extensionsUsed: 0,
      rackSeq: 0,
      history: [],
      undoStack: [],
      redoStack: [],
    }
  };

  // Helper to obtain the active mode's dedicated state
  function getModeState() {
    return state.activeMode === "tournament" ? state.tournament : state.cash;
  }

  // Shot Clock Runtime (extension usage is stored per mode for true isolation)
  let clockTimeLeft = 45;
  let isClockRunning = false;
  let clockInterval = null;
  const MAX_EXTENSIONS = 1;

  function getExtensionsUsed() {
    const used = Number(getModeState().extensionsUsed);
    return Number.isFinite(used) ? used : 0;
  }

  function setExtensionsUsed(value) {
    getModeState().extensionsUsed = value;
  }

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
  const btnPoolFormat = $("btnPoolFormat");
  const poolFormatIcon = $("poolFormatIcon");

  // Masthead localized spans
  const lblModeCash = $("lblModeCash");
  const lblModeTourney = $("lblModeTourney");

  // Tournament HUD Strip
  const hudLeadStat = $("hudLeadStat");
  const hudDeltaStat = $("hudDeltaStat");

  // Tournament Shot Clock Widget
  const clockReadoutCard = $("clockReadoutCard");
  const clockDigitsColumn = $("clockDigitsColumn");
  const clockHeroDigits = $("clockHeroDigits");
  const clockExtLabel = $("clockExtLabel");
  const clockProgressFill = $("clockProgressFill");
  const sessionTimerBadge = $("sessionTimerBadge");
  const sessionTimerDigits = $("sessionTimerDigits");
  const sessionClockIcon = $("sessionClockIcon");
  const sessionHoldBar = $("sessionHoldBar");
  const btnClockStart = $("btnClockStart");
  const clockBtnIcon = $("clockBtnIcon");
  const clockBtnText = $("clockBtnText");
  const btnClockExt = $("btnClockExt");
  const lblClockExtBtn = $("lblClockExtBtn");
  const btnClockPause = $("btnClockPause");
  const clockPauseIcon = $("clockPauseIcon");

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

  // Tutorial / Guide Modal
  const tutorialModal = $("tutorialModal");
  const btnCloseTutorial = $("btnCloseTutorial");
  const btnDismissTutorial = $("btnDismissTutorial");
  const btnOpenGuideFromInfo = $("btnOpenGuideFromInfo");

  // ═══════════════ SCREEN WAKE LOCK & BATTERY OPTIMIZER ═══════════════
  let wakeLockSentinel = null;
  let isPageHidden = false;
  let clockHiddenTimestamp = null;

  async function requestScreenWakeLock() {
    if ("wakeLock" in navigator && !isPageHidden) {
      try {
        if (!wakeLockSentinel) {
          wakeLockSentinel = await navigator.wakeLock.request("screen");
          wakeLockSentinel.addEventListener("release", () => {
            wakeLockSentinel = null;
          });
        }
      } catch {}
    }
  }

  document.addEventListener("visibilitychange", () => {
    if (document.visibilityState === "hidden") {
      isPageHidden = true;
      if (isClockRunning) {
        clockHiddenTimestamp = Date.now();
      }
      if (wakeLockSentinel) {
        try { wakeLockSentinel.release(); } catch {}
        wakeLockSentinel = null;
      }
    } else if (document.visibilityState === "visible") {
      isPageHidden = false;
      requestScreenWakeLock();

      if (isClockRunning && clockHiddenTimestamp) {
        const elapsed = Math.floor((Date.now() - clockHiddenTimestamp) / 1000);
        clockHiddenTimestamp = null;
        if (elapsed > 0) {
          clockTimeLeft = Math.max(0, clockTimeLeft - elapsed);
          renderShotClock();
          if (clockTimeLeft === 0) {
            stopShotClock();
            tactileFeedback(true);
            showToast(t("clock_expired"));
          }
        }
      }
      renderSessionClock();
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

  // Escapes for BOTH text and attribute contexts.
  // NOTE: element.innerHTML serialization escapes &, < and > only - it does NOT
  // escape quotes, so a name containing '"' used to break out of value="...".
  const ESCAPE_MAP = {
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    '"': "&quot;",
    "'": "&#39;",
  };

  function escapeHtml(str) {
    if (str === null || str === undefined) return "";
    return String(str).replace(/[&<>"']/g, (ch) => ESCAPE_MAP[ch]);
  }

  /**
   * Hydration guard. loadState() used to Object.assign() any payload straight
   * into state, so an empty/corrupt players array crashed the first render.
   */
  function normalizeState() {
    const DEFAULTS = {
      cash: ["Johnny Archer", "Shane Van Boening", "Alex Pagulayan", "Francisco Bustamante"],
      tournament: ["Efren Reyes", "Earl Strickland", "Thorsten Hohmann", "Niels Feijen"],
    };

    ["cash", "tournament"].forEach((modeKey) => {
      const m = state[modeKey];
      if (!m || typeof m !== "object") return;

      if (!Array.isArray(m.players) || m.players.length === 0) {
        m.players = DEFAULTS[modeKey].slice(0, 2).map((name, i) => ({ id: i + 1, name, score: 0 }));
      }

      m.players = m.players.map((p, i) => {
        const safe = p && typeof p === "object" ? p : {};
        return {
          id: Number.isFinite(safe.id) ? safe.id : i + 1,
          name: typeof safe.name === "string" && safe.name.trim()
            ? safe.name
            : (DEFAULTS[modeKey][i] || `Player ${i + 1}`),
          score: Number.isFinite(safe.score) ? safe.score : 0,
        };
      });

      if (!Array.isArray(m.history)) m.history = [];
      if (!Array.isArray(m.undoStack)) m.undoStack = [];
      if (!Array.isArray(m.redoStack)) m.redoStack = [];
      if (!Number.isFinite(m.stakeRate) || m.stakeRate < 0) m.stakeRate = 1;
      if (!Number.isFinite(m.shotClockDuration) || m.shotClockDuration <= 0) m.shotClockDuration = 45;
      if (!Number.isFinite(m.extensionsUsed) || m.extensionsUsed < 0) m.extensionsUsed = 0;
      if (!Number.isFinite(m.rackSeq) || m.rackSeq < m.history.length) m.rackSeq = m.history.length;

      // Backfill ledger ids on entries saved before rackSeq existed.
      m.history.forEach((h, idx) => {
        if (h && !Number.isFinite(h.seq)) h.seq = Math.max(1, m.rackSeq - idx);
      });
    });

    if (!Number.isFinite(state.tournament.targetRace) || state.tournament.targetRace < 1) {
      state.tournament.targetRace = 15;
    }
    if (state.tournament.format !== "american" && state.tournament.format !== "chinese") {
      state.tournament.format = "american";
    }
    if (!Number.isFinite(state.sessionStartTime) || state.sessionStartTime <= 0) {
      state.sessionStartTime = Number.isFinite(state.tournament?.sessionStartTime) ? state.tournament.sessionStartTime : Date.now();
    }
    if (!Number.isFinite(state.sessionElapsedMs) || state.sessionElapsedMs < 0) {
      state.sessionElapsedMs = Number.isFinite(state.tournament?.sessionElapsedMs) ? state.tournament.sessionElapsedMs : 0;
    }
    state.isSessionPaused = state.isSessionPaused !== undefined ? !!state.isSessionPaused : !!state.tournament?.isSessionPaused;
    if (state.lang !== "vi" && state.lang !== "en") state.lang = "vi";
    if (state.activeMode !== "cash" && state.activeMode !== "tournament") state.activeMode = "cash";
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
    if (lblClockExtBtn) lblClockExtBtn.textContent = t("ext_btn");
    if (lblStakesProtocolTitle) lblStakesProtocolTitle.textContent = t("stakes_protocol_title");
    if (lblPerRackVal) lblPerRackVal.innerHTML = `<span class="material-symbols-outlined" style="font-size: 11px; vertical-align: middle;">sell</span> ${t("per_rack_val")}`;
    if (lblCurrentPot) lblCurrentPot.innerHTML = `<span class="material-symbols-outlined" style="font-size: 11px; vertical-align: middle;">savings</span> ${t("current_pot")}`;
    if (lblTargetFrame) lblTargetFrame.innerHTML = `<span class="material-symbols-outlined" style="font-size: 11px; vertical-align: middle;">flag</span> ${t("target_frame")}`;
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

    const lblInstallApp = $("lblInstallApp");
    if (lblInstallApp) lblInstallApp.textContent = t("install_app");

    if (moreInfoBtnText) {
      moreInfoBtnText.textContent = state.showExtendedHistory ? t("less_info") : t("more_info");
    }

    // Tutorial / Guide localization
    updateTutorialText();

    updatePoolFormatUI();
    renderShotClock();
    renderSessionClock();
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

  // ═══════════════ TOURNAMENT POOL FORMAT & SESSION CLOCK ENGINE ═══════════════
  function updatePoolFormatUI() {
    if (!btnPoolFormat || !poolFormatIcon) return;
    const isChinese = state.tournament.format === "chinese";
    poolFormatIcon.textContent = isChinese ? "CN" : "US";
    poolFormatIcon.classList.toggle("chinese", isChinese);
    btnPoolFormat.title = isChinese
      ? "Chinese Pool Format (+4, +7, +10) · Tap for American"
      : "American Pool Format (±1) · Tap for Chinese Pool";
  }

  if (btnPoolFormat) {
    btnPoolFormat.addEventListener("click", () => {
      tactileFeedback();
      state.tournament.format = state.tournament.format === "chinese" ? "american" : "chinese";
      updatePoolFormatUI();
      saveState();
      renderPlayers();
      showToast(state.tournament.format === "chinese" ? t("format_cn_toast") : t("format_us_toast"));
    });
  }

  function formatSessionDuration(ms) {
    const totalSec = Math.floor(Math.max(0, ms) / 1000);
    const hrs = Math.floor(totalSec / 3600);
    const mins = Math.floor((totalSec % 3600) / 60);
    const secs = totalSec % 60;
    return `${String(hrs).padStart(2, "0")}:${String(mins).padStart(2, "0")}:${String(secs).padStart(2, "0")}`;
  }

  function getSessionElapsedMs() {
    if (!state.sessionStartTime) state.sessionStartTime = Date.now();
    let total = state.sessionElapsedMs || 0;
    if (!state.isSessionPaused) {
      total += Math.max(0, Date.now() - state.sessionStartTime);
    }
    return total;
  }

  function renderSessionClock() {
    if (!sessionTimerDigits) return;
    const elapsed = getSessionElapsedMs();
    sessionTimerDigits.textContent = formatSessionDuration(elapsed);
    if (sessionTimerBadge) {
      sessionTimerBadge.classList.toggle("is-paused", !!state.isSessionPaused);
    }
  }

  function toggleSessionPause() {
    tactileFeedback();
    if (state.isSessionPaused) {
      state.isSessionPaused = false;
      state.sessionStartTime = Date.now();
      showToast("▶️ " + t("session_resumed"));
    } else {
      state.sessionElapsedMs = getSessionElapsedMs();
      state.isSessionPaused = true;
      showToast("⏸️ " + t("session_paused"));
    }
    saveState();
    renderSessionClock();
  }

  function resetSessionClock() {
    tactileFeedback(true);
    playTone(520, 0.15, "triangle");
    state.sessionStartTime = Date.now();
    state.sessionElapsedMs = 0;
    state.isSessionPaused = false;
    if (sessionHoldBar) sessionHoldBar.style.width = "0%";
    saveState();
    renderSessionClock();
    showToast("⏱️ " + t("session_reset_toast"));
  }

  setInterval(() => {
    if (!isPageHidden && !state.isSessionPaused) {
      renderSessionClock();
    }
  }, 1000);

  // Session Clock Interaction: Tap to Pause/Resume, Hold 2s to Reset
  if (sessionTimerBadge) {
    let sessionHoldTimer = null;
    let sessionHoldAnimFrame = null;
    let sessionHoldStart = 0;
    let sessionHoldTriggered = false;
    const SESSION_HOLD_DURATION = 2000;

    function cancelSessionHold() {
      if (sessionHoldTimer) {
        clearTimeout(sessionHoldTimer);
        sessionHoldTimer = null;
      }
      if (sessionHoldAnimFrame) {
        cancelAnimationFrame(sessionHoldAnimFrame);
        sessionHoldAnimFrame = null;
      }
      if (sessionHoldBar) {
        sessionHoldBar.style.width = "0%";
      }
    }

    sessionTimerBadge.addEventListener("pointerdown", (e) => {
      sessionHoldTriggered = false;
      sessionHoldStart = Date.now();
      cancelSessionHold();

      function updateHoldProgress() {
        const elapsed = Date.now() - sessionHoldStart;
        const pct = Math.min(100, (elapsed / SESSION_HOLD_DURATION) * 100);
        if (sessionHoldBar) sessionHoldBar.style.width = `${pct}%`;
        if (elapsed < SESSION_HOLD_DURATION) {
          sessionHoldAnimFrame = requestAnimationFrame(updateHoldProgress);
        }
      }
      sessionHoldAnimFrame = requestAnimationFrame(updateHoldProgress);

      sessionHoldTimer = setTimeout(() => {
        sessionHoldTriggered = true;
        cancelSessionHold();
        resetSessionClock();
      }, SESSION_HOLD_DURATION);
    });

    sessionTimerBadge.addEventListener("pointerup", (e) => {
      const pressDuration = Date.now() - sessionHoldStart;
      const wasTriggered = sessionHoldTriggered;
      cancelSessionHold();
      sessionHoldTriggered = false;

      // Tap (< 600ms) without triggering 2s hold toggles pause/resume
      if (!wasTriggered && pressDuration < 600) {
        toggleSessionPause();
      }
    });

    sessionTimerBadge.addEventListener("pointercancel", cancelSessionHold);
    sessionTimerBadge.addEventListener("pointerleave", cancelSessionHold);
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
    renderSessionClock();
    updatePoolFormatUI();

    refreshStakeDisplays();

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
    if (mode === "cash") {
      updateZeroSumAudit();
    } else {
      updateTournamentHUD();
    }
    showToast(mode === "tournament" ? "🏆 " + t("tourney_mode") : "💰 " + t("cash_mode"));
  }

  btnModeCash.addEventListener("click", () => setGameMode("cash"));
  btnModeTournament.addEventListener("click", () => setGameMode("tournament"));

  // ═══════════════ ZERO-SUM AUDIT ═══════════════
  function updateZeroSumAudit() {
    if (state.activeMode !== "cash") {
      document.querySelectorAll(".player-championship-card.hotcell").forEach((c) => c.classList.remove("hotcell"));
      return;
    }

    const mState = state.cash;
    const currentSum = mState.players.reduce((sum, p) => sum + (p.score || 0), 0);
    const isBalanced = currentSum === 0;

    const cards = document.querySelectorAll(".player-championship-card");
    cards.forEach((c) => c.classList.toggle("hotcell", !isBalanced));
  }

  // ═══════════════ SETTLEMENTS ═══════════════
  function calculateSettlements() {
    return { netCash: {}, transfers: [] };
  }

  // ═══════════════ ULTRA-CLEAN PLAYER CARD RENDERING ═══════════════
  function renderPlayers() {
    playersArrayContainer.innerHTML = "";
    const mState = getModeState();
    const players = mState.players;
    const isCashMode = state.activeMode === "cash";
    const isTourneyChinese = !isCashMode && state.tournament.format === "chinese";
    const maxScore = Math.max(...players.map((p) => p.score));
    const hasLead = players.some((p) => p.score !== maxScore);

    // Set count for dynamic responsive grid sizing (1, 2, 3, 4 players)
    playersArrayContainer.dataset.count = players.length;

    players.forEach((p, index) => {
      const card = document.createElement("article");
      card.className = "player-championship-card";
      card.id = `card-player-${p.id}`;

      const chineseButtonsHtml = isTourneyChinese ? `
        <div class="chinese-pts-bar">
          <button class="btn-chinese-pts" data-pid="${p.id}" data-pts="4" type="button" title="Standard Win (+4 pts)">+4</button>
          <button class="btn-chinese-pts" data-pid="${p.id}" data-pts="7" type="button" title="Table Run (+7 pts)">+7</button>
          <button class="btn-chinese-pts" data-pid="${p.id}" data-pts="10" type="button" title="Break & Run (+10 pts)">+10</button>
        </div>
      ` : "";

      const cashButtonsHtml = isCashMode ? `
        <div class="cash-quick-deck">
          <div class="cash-deck-bank dec-bank">
            <button class="btn-cash-pill dec" data-pid="${p.id}" data-pts="-5" type="button" title="-5 pts">-5</button>
            <button class="btn-cash-pill dec" data-pid="${p.id}" data-pts="-4" type="button" title="-4 pts">-4</button>
            <button class="btn-cash-pill dec" data-pid="${p.id}" data-pts="-3" type="button" title="-3 pts">-3</button>
            <button class="btn-cash-pill dec" data-pid="${p.id}" data-pts="-2" type="button" title="-2 pts">-2</button>
          </div>
          <div class="cash-deck-divider" aria-hidden="true"></div>
          <div class="cash-deck-bank inc-bank">
            <button class="btn-cash-pill inc" data-pid="${p.id}" data-pts="2" type="button" title="+2 pts">+2</button>
            <button class="btn-cash-pill inc" data-pid="${p.id}" data-pts="3" type="button" title="+3 pts">+3</button>
            <button class="btn-cash-pill inc" data-pid="${p.id}" data-pts="4" type="button" title="+4 pts">+4</button>
            <button class="btn-cash-pill inc" data-pid="${p.id}" data-pts="5" type="button" title="+5 pts">+5</button>
          </div>
        </div>
      ` : "";

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
          <button class="btn-score-touch btn-dec" data-pid="${p.id}" aria-label="${escapeHtml(t("aria_dec", p.name))}" title="Tap -1 · Hold 0.7s to drag">
            <span class="material-symbols-outlined" aria-hidden="true">remove</span>
          </button>

          <div class="score-center-display">
            <span class="score-hero-digits" id="digits-${p.id}">${formatScore(p.score)}</span>
          </div>

          <button class="btn-score-touch btn-inc" data-pid="${p.id}" aria-label="${escapeHtml(t("aria_inc", p.name))}" title="Tap +1 · Hold 0.7s to drag">
            <span class="material-symbols-outlined" aria-hidden="true">add</span>
          </button>
        </div>

        ${chineseButtonsHtml}
        ${cashButtonsHtml}
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

      // Attach click listeners for Chinese Pool quick points (+4, +7, +10)
      if (isTourneyChinese) {
        card.querySelectorAll(".btn-chinese-pts").forEach((btn) => {
          btn.addEventListener("click", () => {
            const pts = parseInt(btn.dataset.pts, 10);
            modifyScore(p.id, pts);
          });
        });
      }

      // Attach click listeners for Cash Mode quick points (-2..-5, +2..+5)
      if (isCashMode) {
        card.querySelectorAll(".btn-cash-pill").forEach((btn) => {
          btn.addEventListener("click", () => {
            const pts = parseInt(btn.dataset.pts, 10);
            modifyScore(p.id, pts);
          });
        });
      }

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

  /**
   * In-place refresh of the existing player cards (scores, leader outline,
   * telemetry, undo/redo). Used for score deltas so the card DOM is not rebuilt
   * mid-interaction: rebuilding used to kill the pop animation, drop focus and
   * re-create every gesture listener on each point.
   */
  function syncPlayersUI() {
    const mState = getModeState();
    const players = mState.players;

    players.forEach((p) => {
      const digitsEl = document.getElementById(`digits-${p.id}`);
      const nextScore = formatScore(p.score);
      if (digitsEl && digitsEl.textContent !== nextScore) {
        digitsEl.textContent = nextScore;
      }
    });

    if (lblAddPlayerBtn) lblAddPlayerBtn.textContent = t("add_player", players.length);
    if (playerCountVal) playerCountVal.textContent = players.length;

    if (state.activeMode === "cash") {
      if (cashStakeLabel) cashStakeLabel.textContent = `$${mState.stakeRate.toFixed(2)} / PT`;
      updateZeroSumAudit();
    } else {
      updateTournamentHUD();
    }

    updateUndoRedoUI();
  }

  function getTournamentLeadSummary() {
    const players = state.tournament.players;
    const sorted = [...players].sort((a, b) => b.score - a.score);
    const leader = sorted[0];
    const runnerUp = sorted[1] || leader;
    const leadDiff = leader.score - runnerUp.score;

    if (leadDiff === 0) {
      return leader.score === 0 ? t("lead_even") : t("lead_tied", leader.score);
    }
    return t("lead_named", leader.name.toUpperCase(), leadDiff);
  }

  function updateTournamentHUD() {
    // Tournament HUD strip and race header removed
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
    let currentMagnitude = 1;
    let currentDelta = baseDirection;
    let initialScore = 0;
    let activePointerId = null;
    let autoTickTimeout = null;
    let autoTickInterval = null;

    const HOLD_THRESHOLD_MS = 700;
    const MAX_POINTS = 20;

    function getDigitsEl() {
      return document.getElementById(`digits-${playerId}`);
    }

    function calcMagnitude(d) {
      if (d <= 0) return 1;
      if (d <= 144) {
        return Math.min(10, 1 + Math.floor(d / 16));
      }
      return Math.min(MAX_POINTS, 10 + Math.floor((d - 144) / 8));
    }

    function setPreview(nextDelta) {
      currentDelta = nextDelta;
      const digitsEl = getDigitsEl();
      const isMax = Math.abs(currentDelta) >= MAX_POINTS;
      if (digitsEl) {
        digitsEl.textContent = formatScore(initialScore + currentDelta);
        digitsEl.classList.toggle("maxed", isMax);
      }
      btn.classList.toggle("maxed", isMax);
    }

    function stopAutoTick() {
      if (autoTickTimeout) {
        clearTimeout(autoTickTimeout);
        autoTickTimeout = null;
      }
      if (autoTickInterval) {
        clearInterval(autoTickInterval);
        autoTickInterval = null;
      }
    }

    function scheduleAutoTick() {
      stopAutoTick();
      if (currentMagnitude >= MAX_POINTS) return;
      autoTickTimeout = setTimeout(() => {
        autoTickInterval = setInterval(() => {
          if (currentMagnitude < MAX_POINTS) {
            currentMagnitude++;
            const nextDelta = currentMagnitude * baseDirection;
            setPreview(nextDelta);
            playTone(430 + currentMagnitude * 28, 0.025);
            vibrateDevice(12);

            if (currentMagnitude >= MAX_POINTS) {
              playTone(880, 0.12, "triangle");
              vibrateDevice([35, 25, 35]);
              stopAutoTick();
            }
          } else {
            stopAutoTick();
          }
        }, 130);
      }, 200);
    }

    function clearListeners() {
      btn.removeEventListener("pointermove", onPointerMove);
      btn.removeEventListener("pointerup", onPointerUp);
      btn.removeEventListener("pointercancel", onPointerUp);
    }

    function onPointerDown(e) {
      if (activePointerId !== null) return;
      activePointerId = e.pointerId;

      startY = e.clientY;
      isScrubbing = false;
      currentMagnitude = 1;
      currentDelta = baseDirection;
      stopAutoTick();

      const mState = getModeState();
      const player = mState.players.find((p) => p.id === playerId);
      initialScore = player ? player.score : 0;

      try { btn.setPointerCapture(e.pointerId); } catch {}

      holdTimer = setTimeout(() => {
        isScrubbing = true;
        btn.classList.add("scrubbing");
        const digitsEl = getDigitsEl();
        if (digitsEl) digitsEl.classList.add("scrubbing-live");

        setPreview(baseDirection);
        playTone(baseDirection > 0 ? 560 : 330, 0.1);
        vibrateDevice([25, 20]);
      }, HOLD_THRESHOLD_MS);

      btn.addEventListener("pointermove", onPointerMove, { passive: false });
      btn.addEventListener("pointerup", onPointerUp);
      btn.addEventListener("pointercancel", onPointerUp);
    }

    function onPointerMove(eMove) {
      if (!isScrubbing || eMove.pointerId !== activePointerId) return;
      if (eMove.cancelable) eMove.preventDefault();

      const diffY = baseDirection > 0 ? (startY - eMove.clientY) : (eMove.clientY - startY);
      const d = Math.max(0, diffY);
      const computed = calcMagnitude(d);

      if (computed !== currentMagnitude) {
        currentMagnitude = computed;
        const nextDelta = currentMagnitude * baseDirection;
        setPreview(nextDelta);
        playTone(430 + currentMagnitude * 28, 0.025);
        vibrateDevice(10);
        if (currentMagnitude >= MAX_POINTS) {
          playTone(880, 0.12, "triangle");
          vibrateDevice([35, 25, 35]);
        }
      }

      if (d >= 30 && currentMagnitude < MAX_POINTS) {
        scheduleAutoTick();
      } else {
        stopAutoTick();
      }
    }

    function onPointerUp(e) {
      if (activePointerId === null) return;
      if (e && e.pointerId !== undefined && e.pointerId !== activePointerId) return;

      try { btn.releasePointerCapture(activePointerId); } catch {}
      activePointerId = null;

      clearTimeout(holdTimer);
      holdTimer = null;
      stopAutoTick();
      clearListeners();

      btn.classList.remove("scrubbing", "maxed");
      const digitsEl = getDigitsEl();
      if (digitsEl) digitsEl.classList.remove("scrubbing-live", "maxed");

      if (isScrubbing) {
        isScrubbing = false;
        modifyScore(playerId, currentDelta);
        showToast(`${currentDelta > 0 ? "+" : ""}${currentDelta} ${t("pts_adjusted")}`);
      } else {
        // Quick tap under 0.7s: standard +/- 1
        modifyScore(playerId, baseDirection);
      }
    }

    btn.addEventListener("pointerdown", onPointerDown);

    if (!window.PointerEvent) {
      btn.addEventListener("click", () => modifyScore(playerId, baseDirection));
    }
  }

  // ═══════════════ SCORE ENGINE & FULL HISTORY LOGGING ═══════════════
  function modifyScore(playerId, delta, isUndoRedo = false) {
    const mState = getModeState();
    const player = mState.players.find((p) => p.id === playerId);
    if (!player) return;

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
    let isCoalesced = false;
    if (delta !== 0 && !isUndoRedo) {
      const now = new Date();
      const nowMs = now.getTime();
      const timeStr = `${String(now.getHours()).padStart(2, "0")}:${String(now.getMinutes()).padStart(2, "0")}`;
      const snapshot = mState.players.map((p) => `${p.name}: ${p.score}`).join(" · ");
      const totalSum = mState.players.reduce((sum, p) => sum + p.score, 0);
      const balanceSummary = state.activeMode === "tournament"
        ? `${t("lead")}: ${getTournamentLeadSummary()}`
        : (totalSum === 0 ? t("balanced_zero") : t("table_unbalanced", `${totalSum > 0 ? "+" : ""}${totalSum}`));

      const lastLog = mState.history.length > 0 ? mState.history[0] : null;
      const STREAK_WINDOW_MS = 1400;

      // Coalesce rapid consecutive single/small taps on the same player in the same direction
      if (
        lastLog &&
        lastLog.playerId === playerId &&
        lastLog.timestampMs &&
        nowMs - lastLog.timestampMs < STREAK_WINDOW_MS &&
        ((lastLog.delta > 0 && delta > 0) || (lastLog.delta < 0 && delta < 0))
      ) {
        isCoalesced = true;
        logEntry = lastLog;
        lastLog.delta += delta;
        lastLog.newScore = player.score;
        lastLog.time = timeStr;
        lastLog.timestampMs = nowMs;
        lastLog.snapshot = snapshot;
        lastLog.balanceAtTime = balanceSummary;
      } else {
        mState.rackSeq = (Number(mState.rackSeq) || 0) + 1;
        logEntry = {
          seq: mState.rackSeq,
          playerId: playerId,
          winnerName: player.name,
          delta: delta,
          prevScore: prevScore,
          newScore: player.score,
          time: timeStr,
          timestampMs: nowMs,
          snapshot: snapshot,
          balanceAtTime: balanceSummary,
        };
        mState.history.unshift(logEntry);
        if (mState.history.length > 60) mState.history.pop();
      }

      renderRackLog();
      resetBlurCountdown();
    }

    if (!isUndoRedo) {
      mState.undoStack.push({
        playerId,
        delta,
        prevScore,
        newScore: player.score,
        logEntry,
        isCoalesced,
      });
      // Bounded history: the stack used to grow forever inside localStorage.
      if (mState.undoStack.length > 100) mState.undoStack.shift();
      mState.redoStack.length = 0;
    }

    saveState();
    syncPlayersUI();
  }

  function updateUndoRedoUI() {
    const mState = getModeState();
    if (btnUndo) btnUndo.disabled = mState.undoStack.length === 0;
    if (btnRedo) btnRedo.disabled = mState.redoStack.length === 0;
  }

  function handleUndoAction() {
    const mState = getModeState();
    if (mState.undoStack.length === 0) return;
    const action = mState.undoStack.pop();
    const player = mState.players.find((p) => p.id === action.playerId);
    if (player) {
      player.score = action.prevScore;

      if (action.logEntry) {
        if (action.isCoalesced) {
          action.logEntry.delta -= action.delta;
          action.logEntry.newScore = action.prevScore;
          if (action.logEntry.delta === 0) {
            mState.history = mState.history.filter((h) => h !== action.logEntry);
          } else {
            action.logEntry.snapshot = mState.players.map((p) => `${p.name}: ${p.score}`).join(" · ");
          }
        } else {
          mState.history = mState.history.filter((h) => h !== action.logEntry);
        }
        renderRackLog();
        resetBlurCountdown();
      }

      mState.redoStack.push(action);
      tactileFeedback();
      showToast(t("undo_toast", player.name));
      saveState();
      syncPlayersUI();
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
        if (action.isCoalesced) {
          action.logEntry.delta += action.delta;
          action.logEntry.newScore = action.newScore;
          action.logEntry.snapshot = mState.players.map((p) => `${p.name}: ${p.score}`).join(" · ");
          if (!mState.history.includes(action.logEntry)) {
            mState.history.unshift(action.logEntry);
          }
        } else {
          if (!mState.history.includes(action.logEntry)) {
            mState.history.unshift(action.logEntry);
          }
        }
        renderRackLog();
        resetBlurCountdown();
      }

      mState.undoStack.push(action);
      tactileFeedback();
      showToast(t("redo_toast", player.name));
      saveState();
      syncPlayersUI();
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

    const isCrit = isClockRunning && clockTimeLeft <= 5 && clockTimeLeft > 0;
    if (clockReadoutCard) clockReadoutCard.classList.toggle("crit", isCrit);
    if (clockDigitsColumn) clockDigitsColumn.classList.toggle("crit", isCrit);
    if (clockHeroDigits) clockHeroDigits.classList.toggle("crit", isCrit);
    if (clockProgressFill) clockProgressFill.classList.toggle("crit", isCrit);

    const extLeft = Math.max(0, MAX_EXTENSIONS - getExtensionsUsed());
    const clockExtText = $("clockExtText");
    if (clockExtText) {
      clockExtText.textContent = t("extensions_left", extLeft, MAX_EXTENSIONS);
    } else if (clockExtLabel) {
      clockExtLabel.innerHTML = `<span class="material-symbols-outlined" aria-hidden="true" style="font-size: 12px; vertical-align: middle;">history</span> ${t("extensions_left", extLeft, MAX_EXTENSIONS)}`;
    }

    // The allowance is a hard rule, not just a label: previous builds kept
    // granting +30s forever while the chip read "0/1 EXT".
    const extensionsExhausted = extLeft <= 0;
    if (btnClockExt) btnClockExt.disabled = extensionsExhausted;
    if (btnCompactClockExt) btnCompactClockExt.disabled = extensionsExhausted;

    if (clockBtnText && clockBtnIcon) {
      if (isClockRunning) {
        clockBtnIcon.textContent = "refresh";
        clockBtnText.textContent = t("restart_clock");
      } else {
        clockBtnIcon.textContent = "play_arrow";
        clockBtnText.textContent = t("start_clock");
      }
    }

    if (clockPauseIcon) {
      clockPauseIcon.textContent = isClockRunning ? "pause" : "play_arrow";
    }

    const compactClockIcon = $("compactClockIcon");
    if (compactClockIcon) {
      compactClockIcon.textContent = isClockRunning ? "pause" : "play_arrow";
    }
  }

  function startShotClock() {
    clearInterval(clockInterval);
    isClockRunning = true;
    renderShotClock();

    clockInterval = setInterval(() => {
      if (clockTimeLeft > 0) {
        clockTimeLeft--;

        if (clockTimeLeft <= 5 && clockTimeLeft >= 1) {
          playTone(850 + (6 - clockTimeLeft) * 70, 0.12, "triangle");
          vibrateDevice([40, 25]);
        } else if (clockTimeLeft === 10) {
          playTone(660, 0.08);
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
    if (clockReadoutCard) clockReadoutCard.classList.remove("crit");
    if (clockDigitsColumn) clockDigitsColumn.classList.remove("crit");
    renderShotClock();
  }

  function resetShotClock() {
    stopShotClock();
    const mState = getModeState();
    clockTimeLeft = mState.shotClockDuration;
    // A fresh shot restores the extension allowance for this mode.
    setExtensionsUsed(0);
    renderShotClock();
  }

  /**
   * Grants the single allowed +30s extension for the current shot.
   * @returns {boolean} true when the extension was applied
   */
  function grantExtension() {
    if (getExtensionsUsed() >= MAX_EXTENSIONS) {
      tactileFeedback(true);
      showToast(t("ext_exhausted"));
      renderShotClock();
      return false;
    }

    const mState = getModeState();
    setExtensionsUsed(getExtensionsUsed() + 1);
    clockTimeLeft = Math.min(mState.shotClockDuration + 30, clockTimeLeft + 30);
    renderShotClock();
    saveState();
    showToast(t("ext_granted"));
    return true;
  }

  // Large Tournament Clock Handlers
  if (btnClockStart) {
    btnClockStart.addEventListener("click", () => {
      tactileFeedback();
      const mState = getModeState();
      if (isClockRunning) {
        // Tapping while running immediately restarts 45s for the next shot!
        clockTimeLeft = mState.shotClockDuration;
        setExtensionsUsed(0);
        startShotClock();
        playTone(640, 0.06);
        showToast(t("shot_restarted"));
      } else {
        if (clockTimeLeft === 0) {
          clockTimeLeft = mState.shotClockDuration;
          setExtensionsUsed(0);
        }
        startShotClock();
      }
    });
  }

  if (btnClockExt) {
    btnClockExt.addEventListener("click", () => {
      tactileFeedback();
      grantExtension();
    });
  }

  if (btnClockPause) {
    btnClockPause.addEventListener("click", () => {
      tactileFeedback();
      if (isClockRunning) {
        stopShotClock();
        showToast(t("pause_clock"));
      } else {
        const mState = getModeState();
        if (clockTimeLeft === 0) {
          clockTimeLeft = mState.shotClockDuration;
          setExtensionsUsed(0);
        }
        startShotClock();
        showToast(t("start_clock"));
      }
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
      grantExtension();
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
      // Ledger id (monotonic). Legacy entries without one fall back to rackNum.
      const seq = Number(h.seq) || Number(h.rackNum) || 0;
      const rackDisplay = seq > 0 ? `R-${String(seq).padStart(2, "0")}` : "ACT";

      const prev = Number.isFinite(h.prevScore)
        ? h.prevScore
        : (Number.isFinite(h.newScore) ? h.newScore - h.delta : null);
      const transitionText = prev !== null && Number.isFinite(h.newScore)
        ? `(${prev} → ${h.newScore})`
        : "";

      row.innerHTML = `
        <div class="log-entry-main">
          <div class="log-entry-narrative">
            <span class="log-winner-name">${escapeHtml(h.winnerName)}</span>
            <span class="log-point-delta ${deltaClass}">${deltaSign}${h.delta}</span>
            ${transitionText ? `<span class="log-score-transition">${transitionText}</span>` : ""}
          </div>
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
    state.sessionStartTime = Date.now();
    state.sessionElapsedMs = 0;
    state.isSessionPaused = false;
    renderSessionClock();
    resetShotClock();
    saveState();
    renderPlayers();
    renderRackLog();
    resetBlurCountdown();
    tactileFeedback(true);
    showToast(t("reset_done"));
  }

  // ═══════════════ STAKES & SETTLEMENT MODAL ═══════════════
  // Edits are held as drafts and only committed by APPLY, so closing with the X
  // can no longer leave the board showing one rate while the state holds another.
  let draftStakeRate = null;
  let draftTargetRace = null;

  function clearStakesDraft() {
    draftStakeRate = null;
    draftTargetRace = null;
  }

  function currentDraftRate() {
    return draftStakeRate !== null ? draftStakeRate : getModeState().stakeRate;
  }

  function currentDraftRace() {
    return draftTargetRace !== null ? draftTargetRace : getModeState().targetRace;
  }

  /** Single source of truth for stake rate readout on the board. */
  function refreshStakeDisplays() {
    const mState = getModeState();
    if (cashStakeLabel) cashStakeLabel.textContent = `$${mState.stakeRate.toFixed(2)} / PT`;
  }

  function renderStakesModal() {
    const rate = currentDraftRate();

    // Never rewrite the field the user is currently typing in (caret jump).
    if (document.activeElement !== stakeInputRate) {
      stakeInputRate.value = rate.toFixed(2);
    }

    document.querySelectorAll(".preset-chip:not(.race-chip)").forEach((chip) => {
      chip.classList.toggle("active", Math.abs(parseFloat(chip.dataset.v) - rate) < 0.01);
    });
  }

  function openStakesModal() {
    tactileFeedback();
    clearStakesDraft();
    renderStakesModal();
    stakesModal.classList.add("open");
  }

  function closeStakesModal() {
    stakesModal.classList.remove("open");
    clearStakesDraft();
  }

  if (btnCashRateChip) btnCashRateChip.addEventListener("click", openStakesModal);

  btnCloseStakesModal.addEventListener("click", closeStakesModal);
  stakesModal.addEventListener("click", (e) => {
    if (e.target === stakesModal) closeStakesModal();
  });

  btnSaveStakes.addEventListener("click", () => {
    tactileFeedback();
    const mState = getModeState();

    // Commit whatever is in the fields (typed or draft-driven).
    const typedRate = parseFloat(stakeInputRate.value);
    if (Number.isFinite(typedRate)) mState.stakeRate = Math.max(0, typedRate);
    else if (draftStakeRate !== null) mState.stakeRate = draftStakeRate;

    clearStakesDraft();
    refreshStakeDisplays();
    saveState();
    renderPlayers();
    stakesModal.classList.remove("open");
    showToast(t("stake_saved", mState.stakeRate.toFixed(2)));
  });

  btnStakeStepMinus.addEventListener("click", () => {
    const typed = parseFloat(stakeInputRate.value);
    const base = Number.isFinite(typed) ? typed : currentDraftRate();
    draftStakeRate = Math.max(0, Math.round((base - 0.5) * 100) / 100);
    renderStakesModal();
  });

  btnStakeStepPlus.addEventListener("click", () => {
    const typed = parseFloat(stakeInputRate.value);
    const base = Number.isFinite(typed) ? typed : currentDraftRate();
    draftStakeRate = Math.max(0, Math.round((base + 0.5) * 100) / 100);
    renderStakesModal();
  });

  // Live preview while typing a custom rate.
  if (stakeInputRate) {
    stakeInputRate.addEventListener("input", () => {
      const typed = parseFloat(stakeInputRate.value);
      if (Number.isFinite(typed)) {
        draftStakeRate = Math.max(0, typed);
        renderStakesModal();
      }
    });
  }

  document.querySelectorAll(".preset-chip:not(.race-chip)").forEach((chip) => {
    chip.addEventListener("click", () => {
      draftStakeRate = parseFloat(chip.dataset.v);
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

  // ═══════════════ TUTORIAL / ONBOARDING GUIDE ═══════════════
  function updateTutorialText() {
    const el = (id) => document.getElementById(id);
    const s = (id, key) => { const e = el(id); if (e) e.textContent = t(key); };

    s("lblTutorialTitle", "guide_title");
    s("lblOpenGuide", "guide_open");
    s("lblGotIt", "guide_got_it");

    // Modes comparison
    s("lblGuideModesHeader", "guide_modes_header");
    s("lblGuideCashTitle", "guide_cash_title");
    s("lblGuideCashTag", "guide_cash_tag");
    s("lblGuideCashB1", "guide_cash_b1");
    s("lblGuideCashB2", "guide_cash_b2");
    s("lblGuideCashB3", "guide_cash_b3");

    s("lblGuideTourneyTitle", "guide_tourney_title");
    s("lblGuideTourneyTag", "guide_tourney_tag");
    s("lblGuideTourneyB1", "guide_tourney_b1");
    s("lblGuideTourneyB2", "guide_tourney_b2");
    s("lblGuideTourneyB3", "guide_tourney_b3");
    s("lblGuideModesNote", "guide_modes_note");

    // Controls Cheat Sheet
    s("lblGuideControlsHeader", "guide_controls_header");

    s("lblGuideKeyTap", "guide_key_tap");
    s("lblGuideActionTapTitle", "guide_action_tap_title");
    s("lblGuideActionTapDesc", "guide_action_tap_desc");

    s("lblGuideKeyDrag", "guide_key_drag");
    s("lblGuideActionDragTitle", "guide_action_drag_title");
    s("lblGuideActionDragDesc", "guide_action_drag_desc");

    s("lblGuideKeyUndo", "guide_key_undo");
    s("lblGuideActionUndoTitle", "guide_action_undo_title");
    s("lblGuideActionUndoDesc", "guide_action_undo_desc");

    s("lblGuideKeySettle", "guide_key_settle");
    s("lblGuideActionSettleTitle", "guide_action_settle_title");
    s("lblGuideActionSettleDesc", "guide_action_settle_desc");

    s("lblGuideKeyClock", "guide_key_clock");
    s("lblGuideActionClockTitle", "guide_action_clock_title");
    s("lblGuideActionClockDesc", "guide_action_clock_desc");

    s("lblGuideKeyLog", "guide_key_log");
    s("lblGuideActionLogTitle", "guide_action_log_title");
    s("lblGuideActionLogDesc", "guide_action_log_desc");

    // System badges
    s("lblGuideBadgeWake", "guide_badge_wake");
    s("lblGuideBadgeOffline", "guide_badge_offline");
    s("lblGuideBadgeLang", "guide_badge_lang");
  }

  function openTutorial() {
    if (tutorialModal) {
      updateTutorialText();
      tutorialModal.classList.add("open");
    }
  }

  function closeTutorial() {
    if (tutorialModal) {
      tutorialModal.classList.remove("open");
      if (!state.tutorialSeen) {
        state.tutorialSeen = true;
        saveState();
      }
    }
  }

  if (btnCloseTutorial) btnCloseTutorial.addEventListener("click", closeTutorial);
  if (btnDismissTutorial) btnDismissTutorial.addEventListener("click", closeTutorial);
  if (tutorialModal) {
    tutorialModal.addEventListener("click", (e) => {
      if (e.target === tutorialModal) closeTutorial();
    });
  }

  // "How to Use" button inside info modal → close info, open tutorial
  if (btnOpenGuideFromInfo) {
    btnOpenGuideFromInfo.addEventListener("click", () => {
      tactileFeedback();
      infoModal.classList.remove("open");
      openTutorial();
    });
  }

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
  function anyModalOpen() {
    return [stakesModal, infoModal, tutorialModal].some((m) => m && m.classList.contains("open"));
  }

  /** Closes the topmost overlay. @returns {boolean} true when something closed */
  function closeTopModal() {
    if (tutorialModal && tutorialModal.classList.contains("open")) {
      closeTutorial();
      return true;
    }
    if (stakesModal && stakesModal.classList.contains("open")) {
      closeStakesModal();
      return true;
    }
    if (infoModal && infoModal.classList.contains("open")) {
      infoModal.classList.remove("open");
      return true;
    }
    return false;
  }

  window.addEventListener("keydown", (e) => {
    const tag = e.target && e.target.tagName;
    if (tag === "INPUT" || tag === "TEXTAREA" || (e.target && e.target.isContentEditable)) return;

    // Escape always dismisses the topmost overlay (previously only the tutorial).
    if (e.key === "Escape") {
      if (closeTopModal()) e.preventDefault();
      return;
    }

    // Global score/clock shortcuts must never fire behind an open dialog:
    // pressing "w" while Settlements was open used to silently score a point.
    if (anyModalOpen()) return;

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
      if (btnClockPause) btnClockPause.click();
      else if (btnCompactClockReset) btnCompactClockReset.click();
    } else if ((e.ctrlKey || e.metaKey) && (key === "y" || (key === "z" && e.shiftKey))) {
      e.preventDefault();
      handleRedoAction();
    } else if (key === "z" && (e.ctrlKey || e.metaKey)) {
      e.preventDefault();
      handleUndoAction();
    }
  });

  // ═══════════════ OFFLINE / INSTALLABLE APP (PWA) ═══════════════
  /**
   * Registers the service worker so the scoreboard boots, scores a full match
   * and settles debts with no network at all.
   *
   * The UI never claims "offline ready" until a worker is genuinely
   * controlling the page - the previous build showed that badge permanently
   * while every icon was still fetched from a CDN.
   */
  function registerServiceWorker() {
    const setBadge = (key) => {
      const badge = $("lblGuideBadgeOffline");
      if (badge) badge.textContent = t(key);
    };

    if (!("serviceWorker" in navigator) || location.protocol === "file:") {
      setBadge("offline_pending");
      return;
    }

    const markReady = () => {
      setBadge("offline_ready");
      document.documentElement.classList.add("offline-ready");
    };

    if (navigator.serviceWorker.controller) markReady();

    navigator.serviceWorker.addEventListener("controllerchange", () => {
      let announced = false;
      try { announced = localStorage.getItem(OFFLINE_FLAG_KEY) === "1"; } catch {}
      markReady();
      if (!announced) {
        try { localStorage.setItem(OFFLINE_FLAG_KEY, "1"); } catch {}
        showToast(t("offline_cached"));
      }
    });

    window.addEventListener("load", async () => {
      try {
        const reg = await navigator.serviceWorker.register("sw.js");
        reg.addEventListener("updatefound", () => {
          const installing = reg.installing;
          if (!installing) return;
          installing.addEventListener("statechange", () => {
            if (installing.state === "installed" && navigator.serviceWorker.controller) {
              showToast(t("update_ready"));
            }
          });
        });
      } catch {
        setBadge("offline_pending");
      }
    });
  }

  /**
   * Home-screen / manifest shortcuts launch with ?mode=cash or ?mode=tournament.
   * @returns {string|null} requested mode
   */
  function modeFromQuery() {
    try {
      const mode = new URLSearchParams(location.search).get("mode");
      if (mode === "cash" || mode === "tournament") return mode;
    } catch {}
    return null;
  }

  /* ── Install prompt (Chrome / Edge / Android; iOS uses Share > Add to Home Screen) ── */
  let deferredInstallPrompt = null;

  window.addEventListener("beforeinstallprompt", (event) => {
    event.preventDefault();
    deferredInstallPrompt = event;
    const btn = $("btnInstallApp");
    if (btn) btn.hidden = false;
  });

  window.addEventListener("appinstalled", () => {
    deferredInstallPrompt = null;
    const btn = $("btnInstallApp");
    if (btn) btn.hidden = true;
    showToast(t("install_done"));
  });

  const btnInstallApp = $("btnInstallApp");
  if (btnInstallApp) {
    btnInstallApp.addEventListener("click", async () => {
      tactileFeedback();
      if (!deferredInstallPrompt) return;
      deferredInstallPrompt.prompt();
      try {
        await deferredInstallPrompt.userChoice;
      } catch {}
      deferredInstallPrompt = null;
      btnInstallApp.hidden = true;
    });
  }

  // ═══════════════ INITIALIZATION ═══════════════
  function init() {
    loadState();
    normalizeState();
    applyTheme(state.theme);

    // Apply language
    setLanguage(state.lang || "vi");

    // Apply active mode (a launch shortcut may request one explicitly)
    setGameMode(modeFromQuery() || state.activeMode || "cash");

    // Request screen wake lock
    requestScreenWakeLock();

    // Request persistent storage protection against browser eviction
    if (navigator.storage && navigator.storage.persist) {
      navigator.storage.persist().catch(() => {});
    }

    soundIcon.textContent = state.soundEnabled ? "volume_up" : "volume_off";

    // Restore extended history preference
    if (rackLogDrawer) {
      rackLogDrawer.classList.toggle("show-extended", !!state.showExtendedHistory);
    }
    if (btnToggleExtendedHistory) {
      btnToggleExtendedHistory.classList.toggle("active", !!state.showExtendedHistory);
    }

    resetBlurCountdown();

    // Go offline-capable (no-op on file://, where service workers are blocked)
    registerServiceWorker();

    // Auto-show tutorial on first visit
    if (!state.tutorialSeen) {
      openTutorial();
    }
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
  } else {
    init();
  }
})();
