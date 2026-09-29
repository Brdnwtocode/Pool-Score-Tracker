(() => {
  "use strict";

  const KEY = "21n2_pool_v2";

  // ── State ──
  let S = {
    players: [
      { id: 1, name: "Player 1", score: 0, brk: true },
      { id: 2, name: "Player 2", score: 0, brk: false },
    ],
    rate: 1.0,
    clockMode: 30,
    sound: true,
    theme: "dark",
    history: [],
  };

  const undo = [], redo = [];

  // ── Clock runtime ──
  let clockLeft, clockRunning = false, clockTimer = null;
  const BLUR_MS = 180;
  let blurLeft = BLUR_MS, blurTimer = null;

  // ── DOM ──
  const $ = id => document.getElementById(id);
  const playerBox     = $("players");
  const addBtn        = $("addBtn");
  const removeBtn     = $("removeBtn");
  const holdResetBtn  = $("holdResetBtn");
  const holdFill      = $("holdFill");
  const holdLabel     = $("holdLabel");
  const clockNum      = $("clockNum");
  const progressFill  = $("progressFill");
  const clockToggle   = $("clockToggle");
  const clockExt      = $("clockExt");
  const clockReset    = $("clockReset");
  const mode30        = $("mode30");
  const mode45        = $("mode45");
  const undoBtn       = $("undoBtn");
  const redoBtn       = $("redoBtn");
  const soundBtn      = $("soundBtn");
  const soundIcon     = $("soundIcon");
  const themeBtn      = $("themeBtn");
  const themeIcon     = $("themeIcon");
  const infoBtn       = $("infoBtn");
  const balanceBar    = $("balanceBar");
  const balanceText   = $("balanceText");
  const balanceTagEl  = $("balanceTagEl");
  const historyBox    = $("historyBox");
  const histList      = $("histList");
  const histEmpty     = $("histEmpty");
  const blurText      = $("blurText");
  const wakeBtn       = $("wakeBtn");
  const stakesBtn     = $("stakesBtn");
  const stakeLabel    = $("stakeLabel");
  const stakesModal   = $("stakesModal");
  const closeStakes   = $("closeStakes");
  const applyStakes   = $("applyStakes");
  const rateInput     = $("rateInput");
  const rateMinus     = $("rateMinus");
  const ratePlus      = $("ratePlus");
  const payoutRows    = $("payoutRows");
  const transferRows  = $("transferRows");
  const infoModal     = $("infoModal");
  const closeInfo     = $("closeInfo");
  const dismissInfo   = $("dismissInfo");
  const toast         = $("toast");

  // ═══════════════ AUDIO ═══════════════
  let actx = null;
  function ctx() {
    if (!actx) { const C = window.AudioContext || window.webkitAudioContext; if (C) actx = new C(); }
    if (actx && actx.state === "suspended") actx.resume();
    return actx;
  }

  function clickSound() {
    if (!S.sound) return;
    try {
      const c = ctx(); if (!c) return;
      const t = c.currentTime;
      const o1 = c.createOscillator(), g1 = c.createGain();
      o1.type = "triangle"; o1.frequency.setValueAtTime(2200, t); o1.frequency.exponentialRampToValueAtTime(800, t + .025);
      g1.gain.setValueAtTime(.7, t); g1.gain.exponentialRampToValueAtTime(.001, t + .035);
      o1.connect(g1); g1.connect(c.destination); o1.start(t); o1.stop(t + .04);
      const o2 = c.createOscillator(), g2 = c.createGain();
      o2.type = "sine"; o2.frequency.setValueAtTime(950, t); o2.frequency.exponentialRampToValueAtTime(320, t + .04);
      g2.gain.setValueAtTime(.5, t); g2.gain.exponentialRampToValueAtTime(.001, t + .05);
      o2.connect(g2); g2.connect(c.destination); o2.start(t); o2.stop(t + .055);
    } catch {}
  }

  function beep(freq = 880, dur = .09) {
    if (!S.sound) return;
    try {
      const c = ctx(); if (!c) return;
      const t = c.currentTime, o = c.createOscillator(), g = c.createGain();
      o.type = "sine"; o.frequency.setValueAtTime(freq, t);
      g.gain.setValueAtTime(.4, t); g.gain.exponentialRampToValueAtTime(.001, t + dur);
      o.connect(g); g.connect(c.destination); o.start(t); o.stop(t + dur + .01);
    } catch {}
  }

  function vib(ms = 15) { if (S.sound && navigator.vibrate) try { navigator.vibrate(ms); } catch {} }

  function tap(foul) {
    if (foul) { beep(220, .35); vib([50, 40, 50]); }
    else { clickSound(); vib(18); }
  }

  // ═══════════════ TOAST ═══════════════
  let tt = null;
  function showToast(msg) { toast.textContent = msg; toast.classList.add("show"); clearTimeout(tt); tt = setTimeout(() => toast.classList.remove("show"), 2000); }

  // ═══════════════ PERSIST ═══════════════
  function save() { try { localStorage.setItem(KEY, JSON.stringify(S)); } catch {} }
  function load() { try { const s = localStorage.getItem(KEY); if (s) Object.assign(S, JSON.parse(s)); } catch {} }

  // ═══════════════ ESCAPE ═══════════════
  function esc(s) { if (!s) return ""; const d = document.createElement("div"); d.textContent = s; return d.innerHTML; }

  // ═══════════════ SETTLEMENTS ═══════════════
  function settle() {
    const ps = S.players, r = parseFloat(S.rate) || 0, n = ps.length;
    const net = {}; ps.forEach(p => net[p.id] = 0);
    for (let i = 0; i < n; i++) for (let j = i + 1; j < n; j++) {
      const d = ps[i].score - ps[j].score; net[ps[i].id] += d; net[ps[j].id] -= d;
    }
    const cash = {}; ps.forEach(p => cash[p.id] = net[p.id] * r);

    const debtors = [], creditors = [];
    ps.forEach(p => { const c = cash[p.id]; if (c > .001) creditors.push({ name: p.name, bal: c }); else if (c < -.001) debtors.push({ name: p.name, bal: -c }); });
    const xfers = []; let di = 0, ci = 0;
    while (di < debtors.length && ci < creditors.length) {
      const a = Math.min(debtors[di].bal, creditors[ci].bal);
      if (a > .01) xfers.push({ from: debtors[di].name, to: creditors[ci].name, amt: a.toFixed(2) });
      debtors[di].bal -= a; creditors[ci].bal -= a;
      if (debtors[di].bal <= .01) di++; if (creditors[ci].bal <= .01) ci++;
    }
    return { cash, xfers };
  }

  function renderStakes() {
    const r = parseFloat(S.rate) || 1; rateInput.value = r.toFixed(2); stakeLabel.textContent = "$" + r.toFixed(2) + "/PT";
    document.querySelectorAll(".preset").forEach(c => c.classList.toggle("active", Math.abs(parseFloat(c.dataset.r) - r) < .01));
    const { cash, xfers } = settle();
    payoutRows.innerHTML = ""; transferRows.innerHTML = "";
    S.players.forEach(p => {
      const c = cash[p.id] || 0, w = c >= 0;
      payoutRows.innerHTML += `<div class="pay-row"><span class="pay-name">${esc(p.name)} (${p.score})</span><span class="pay-amt ${w ? "win" : "loss"}">${w ? "+" : "-"}$${Math.abs(c).toFixed(2)}</span></div>`;
    });
    if (!xfers.length) transferRows.innerHTML = `<div class="xfer-row"><span class="material-symbols-outlined" style="font-size:16px">check</span> NO PAYOUTS REQUIRED</div>`;
    else xfers.forEach(t => transferRows.innerHTML += `<div class="xfer-row"><span class="material-symbols-outlined" style="font-size:16px">arrow_forward</span> <strong>${esc(t.from)}</strong> pays <strong>${esc(t.to)}</strong>: $${t.amt}</div>`);
  }

  // ═══════════════ RENDER PLAYERS ═══════════════
  function render() {
    playerBox.innerHTML = "";
    const mx = Math.max(...S.players.map(p => p.score), 0);
    const { cash } = settle();

    S.players.forEach((p, i) => {
      const lead = p.score > 0 && p.score === mx;
      const c = cash[p.id] || 0;
      const ct = c >= 0 ? `+$${c.toFixed(2)}` : `-$${Math.abs(c).toFixed(2)}`;

      const card = document.createElement("div");
      card.className = "p-card" + (lead ? " lead" : "");
      card.innerHTML = `
        <div class="p-top">
          <span class="p-id">0${i + 1}</span>
          <button class="break-badge ${p.brk ? "" : "off"}" data-pid="${p.id}">${p.brk ? "BREAK" : "WAIT"}</button>
        </div>
        <input type="text" class="p-name" value="${esc(p.name)}" data-pid="${p.id}" spellcheck="false" placeholder="Player ${i + 1}">
        <div class="p-divider"></div>
        <div class="score-row">
          <button class="s-btn dec" data-pid="${p.id}"><span class="material-symbols-outlined">remove</span></button>
          <div class="score-mid">
            <span class="score-val" id="sv-${p.id}">${String(p.score).padStart(2, "0")}</span>
            <span class="score-lbl">RACKS WON</span>
          </div>
          <button class="s-btn inc" data-pid="${p.id}"><span class="material-symbols-outlined">add</span></button>
        </div>
        <div class="p-foot"><span>NET STAKE</span><span class="net ${c >= 0 ? "pos" : "neg"}">${ct}</span></div>`;

      // Name change
      card.querySelector(".p-name").addEventListener("change", e => { p.name = e.target.value.trim() || `Player ${i + 1}`; save(); renderStakes(); });
      card.querySelector(".p-name").addEventListener("keydown", e => { if (e.key === "Enter") e.target.blur(); });

      // Break toggle
      card.querySelector(".break-badge").addEventListener("click", () => { tap(); S.players.forEach(x => x.brk = false); p.brk = true; save(); render(); });

      // Score buttons
      card.querySelector(".inc").addEventListener("click", () => modScore(p.id, 1));
      card.querySelector(".dec").addEventListener("click", () => modScore(p.id, -1));

      playerBox.appendChild(card);
    });

    updateBalance();
    undoBtn.disabled = !undo.length;
    redoBtn.disabled = !redo.length;
    renderStakes();
  }

  // ═══════════════ SCORE ENGINE ═══════════════
  function modScore(pid, d, isUR = false) {
    const p = S.players.find(x => x.id === pid); if (!p) return;
    if (p.score + d < 0) { vib([30, 20]); return; }
    const prev = p.score; p.score = Math.max(0, p.score + d);
    tap();

    const el = document.getElementById("sv-" + pid);
    if (el) { el.textContent = String(p.score).padStart(2, "0"); el.classList.remove("pop"); void el.offsetWidth; el.classList.add("pop"); }

    let log = null;
    if (d > 0 && !isUR) {
      const now = new Date();
      const ts = String(now.getHours()).padStart(2, "0") + ":" + String(now.getMinutes()).padStart(2, "0");
      const rn = S.players.reduce((s, x) => s + x.score, 0);
      log = { rn, name: p.name, ts }; S.history.unshift(log);
      if (S.history.length > 50) S.history.pop();
      renderHist(); resetBlur();
    }
    if (!isUR) { undo.push({ pid, d, prev, cur: p.score, log }); redo.length = 0; }
    save(); render();
  }

  function doUndo() {
    if (!undo.length) return;
    const a = undo.pop(), p = S.players.find(x => x.id === a.pid); if (!p) return;
    p.score = a.prev;
    if (a.log) { S.history = S.history.filter(h => h !== a.log); renderHist(); resetBlur(); }
    redo.push(a); tap(); showToast("UNDO: " + p.name); save(); render();
  }

  function doRedo() {
    if (!redo.length) return;
    const a = redo.pop(), p = S.players.find(x => x.id === a.pid); if (!p) return;
    p.score = a.cur;
    if (a.log) { S.history.unshift(a.log); renderHist(); resetBlur(); }
    undo.push(a); tap(); showToast("REDO: " + p.name); save(); render();
  }

  // ═══════════════ BALANCE ═══════════════
  function updateBalance() {
    const tot = S.players.reduce((s, p) => s + p.score, 0);
    const eq = S.players.every(p => p.score === S.players[0].score);
    if (tot === 0) { balanceBar.classList.remove("hot"); balanceText.textContent = "MATCH READY"; balanceTagEl.textContent = "READY"; }
    else if (eq) { balanceBar.classList.remove("hot"); balanceText.textContent = "TIED · " + tot + " RACKS"; balanceTagEl.textContent = "TIED"; }
    else { balanceBar.classList.add("hot"); const l = [...S.players].sort((a, b) => b.score - a.score)[0]; balanceText.textContent = "LEAD: " + l.name.toUpperCase() + " (+" + l.score + ") · " + tot + " RACKS"; balanceTagEl.textContent = "ACTIVE"; }
  }

  // ═══════════════ HISTORY + 180s BLUR ═══════════════
  function renderHist() {
    histList.innerHTML = "";
    if (!S.history.length) { histEmpty.style.display = "flex"; histList.appendChild(histEmpty); return; }
    histEmpty.style.display = "none";
    S.history.forEach(h => {
      const r = document.createElement("div"); r.className = "log-row";
      r.innerHTML = `<span class="log-id">R-${String(h.rn).padStart(2, "0")}</span><span class="log-name">${esc(h.name)}</span><span class="log-delta">+1</span><span class="log-time">${h.ts}</span>`;
      histList.appendChild(r);
    });
  }

  function resetBlur() {
    historyBox.classList.remove("blurred"); blurLeft = BLUR_MS; updateBlurText();
    clearInterval(blurTimer);
    blurTimer = setInterval(() => { if (blurLeft > 0) { blurLeft--; updateBlurText(); } else { historyBox.classList.add("blurred"); blurText.textContent = "BLURRED"; clearInterval(blurTimer); } }, 1000);
  }
  function updateBlurText() { const m = Math.floor(blurLeft / 60), s = blurLeft % 60; blurText.textContent = "FOCUS · " + m + "m " + String(s).padStart(2, "0") + "s"; }

  historyBox.addEventListener("click", resetBlur);
  wakeBtn.addEventListener("click", e => { e.stopPropagation(); resetBlur(); showToast("History focused"); });

  // ═══════════════ SHOT CLOCK ═══════════════
  function renderClock() {
    clockNum.textContent = String(clockLeft).padStart(2, "0");
    const pct = Math.max(0, Math.min(100, (clockLeft / S.clockMode) * 100));
    progressFill.style.width = pct + "%";
    const crit = clockRunning && clockLeft <= 5;
    clockNum.classList.toggle("crit", crit);
    progressFill.classList.toggle("crit", crit);
  }

  function startClock() {
    clearInterval(clockTimer); clockRunning = true; clockToggle.textContent = "PAUSE";
    clockTimer = setInterval(() => {
      if (clockLeft > 0) {
        clockLeft--;
        if (clockLeft <= 5 && clockLeft >= 1) { beep(880, .08); vib(15); }
        else if (clockLeft === 10) beep(660, .06);
        renderClock();
        if (clockLeft === 0) { tap(true); showToast("SHOT CLOCK: FOUL"); stopClock(); }
      }
    }, 1000);
    renderClock();
  }

  function stopClock() { clearInterval(clockTimer); clockTimer = null; clockRunning = false; clockToggle.textContent = "START"; renderClock(); }
  function resetClockFn() { stopClock(); clockLeft = S.clockMode; renderClock(); }

  clockToggle.addEventListener("click", () => { tap(); if (clockRunning) stopClock(); else { if (clockLeft === 0) clockLeft = S.clockMode; startClock(); } });
  clockExt.addEventListener("click", () => { tap(); clockLeft = Math.min(90, clockLeft + 30); renderClock(); showToast("+30s Extension"); });
  clockReset.addEventListener("click", () => { tap(); resetClockFn(); });

  mode30.addEventListener("click", () => { tap(); S.clockMode = 30; mode30.classList.add("active"); mode45.classList.remove("active"); resetClockFn(); save(); });
  mode45.addEventListener("click", () => { tap(); S.clockMode = 45; mode45.classList.add("active"); mode30.classList.remove("active"); resetClockFn(); save(); });

  // ═══════════════ ADD / REMOVE / RESET ═══════════════
  addBtn.addEventListener("click", () => {
    if (S.players.length >= 4) { addBtn.classList.add("flash"); setTimeout(() => addBtn.classList.remove("flash"), 250); showToast("Max 4 players"); vib([30, 20]); return; }
    const nid = S.players.reduce((m, p) => Math.max(m, p.id), 0) + 1;
    S.players.push({ id: nid, name: "Player " + (S.players.length + 1), score: 0, brk: false });
    tap(); save(); render(); showToast("Added Player " + S.players.length);
  });

  removeBtn.addEventListener("click", () => {
    if (S.players.length <= 1) { removeBtn.classList.add("flash"); setTimeout(() => removeBtn.classList.remove("flash"), 250); showToast("Min 1 player"); vib([30, 20]); return; }
    const rm = S.players.pop(); tap(); save(); render(); showToast("Removed " + rm.name);
  });

  // Hold-to-reset
  let ht = null, hs = 0; const HOLD = 1800;
  function cancelHold() { clearInterval(ht); ht = null; holdFill.style.width = "0"; holdLabel.textContent = "HOLD 2S RESET"; }
  function startHold(e) {
    e.preventDefault(); hs = Date.now();
    ht = setInterval(() => {
      const el = Date.now() - hs, pct = Math.min(100, (el / HOLD) * 100);
      holdFill.style.width = pct + "%";
      if (el >= HOLD) { cancelHold(); S.players.forEach(p => p.score = 0); S.history = []; undo.length = 0; redo.length = 0; resetClockFn(); save(); render(); renderHist(); resetBlur(); tap(true); showToast("MATCH RESET"); }
    }, 40);
  }
  holdResetBtn.addEventListener("mousedown", startHold);
  holdResetBtn.addEventListener("touchstart", startHold, { passive: false });
  window.addEventListener("mouseup", cancelHold);
  window.addEventListener("touchend", cancelHold);

  // ═══════════════ UNDO / REDO ═══════════════
  undoBtn.addEventListener("click", doUndo);
  redoBtn.addEventListener("click", doRedo);

  // ═══════════════ SOUND / THEME ═══════════════
  soundBtn.addEventListener("click", () => { S.sound = !S.sound; soundIcon.textContent = S.sound ? "volume_up" : "volume_off"; showToast(S.sound ? "Sound On" : "Sound Off"); if (S.sound) tap(); save(); });

  function applyTheme(t) {
    S.theme = t;
    document.documentElement.classList.toggle("light", t === "light");
    themeIcon.textContent = t === "light" ? "dark_mode" : "light_mode";
  }
  themeBtn.addEventListener("click", () => { applyTheme(S.theme === "dark" ? "light" : "dark"); tap(); save(); });

  // ═══════════════ STAKES MODAL ═══════════════
  stakesBtn.addEventListener("click", () => { tap(); renderStakes(); stakesModal.classList.add("open"); });
  closeStakes.addEventListener("click", () => stakesModal.classList.remove("open"));
  stakesModal.addEventListener("click", e => { if (e.target === stakesModal) stakesModal.classList.remove("open"); });
  applyStakes.addEventListener("click", () => { tap(); S.rate = Math.max(0, parseFloat(rateInput.value) || 1); save(); render(); stakesModal.classList.remove("open"); showToast("Stakes: $" + S.rate.toFixed(2) + "/pt"); });
  rateMinus.addEventListener("click", () => { let v = parseFloat(rateInput.value) || 0; v = Math.max(0, v - .5); rateInput.value = v.toFixed(2); S.rate = v; renderStakes(); });
  ratePlus.addEventListener("click", () => { let v = parseFloat(rateInput.value) || 0; v += .5; rateInput.value = v.toFixed(2); S.rate = v; renderStakes(); });
  rateInput.addEventListener("input", () => { S.rate = Math.max(0, parseFloat(rateInput.value) || 0); renderStakes(); });
  document.querySelectorAll(".preset").forEach(c => c.addEventListener("click", () => { const r = parseFloat(c.dataset.r); S.rate = r; rateInput.value = r.toFixed(2); renderStakes(); }));

  // ═══════════════ INFO MODAL ═══════════════
  infoBtn.addEventListener("click", () => { tap(); infoModal.classList.add("open"); });
  closeInfo.addEventListener("click", () => infoModal.classList.remove("open"));
  dismissInfo.addEventListener("click", () => infoModal.classList.remove("open"));
  infoModal.addEventListener("click", e => { if (e.target === infoModal) infoModal.classList.remove("open"); });

  // ═══════════════ INIT ═══════════════
  function init() {
    load();
    applyTheme(S.theme);
    if (S.clockMode === 45) { mode45.classList.add("active"); mode30.classList.remove("active"); } else { S.clockMode = 30; }
    clockLeft = S.clockMode; renderClock();
    soundIcon.textContent = S.sound ? "volume_up" : "volume_off";
    render(); renderHist(); resetBlur();
  }

  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", init);
  else init();
})();
