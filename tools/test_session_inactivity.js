const http = require('http');
const fs = require('fs');
const path = require('path');
const { spawn } = require('child_process');

// 1. Simple HTTP server serving the repo
const MIME = {
  '.html': 'text/html',
  '.css': 'text/css',
  '.js': 'application/javascript',
  '.json': 'application/json',
  '.webmanifest': 'application/manifest+json',
  '.png': 'image/png',
  '.woff2': 'font/woff2',
};

const server = http.createServer((req, res) => {
  let reqPath = req.url.split('?')[0];
  if (reqPath === '/') reqPath = '/index.html';
  const filePath = path.join(__dirname, '..', reqPath);

  fs.readFile(filePath, (err, data) => {
    if (err) {
      res.writeHead(404);
      res.end('Not found');
      return;
    }
    const ext = path.extname(filePath).toLowerCase();
    res.writeHead(200, {
      'Content-Type': MIME[ext] || 'application/octet-stream',
      'Cache-Control': 'no-store, no-cache',
    });
    res.end(data);
  });
});

server.listen(0, '127.0.0.1', async () => {
  const port = server.address().port;
  console.log(`[+] Test server listening on http://127.0.0.1:${port}`);

  const chromePath = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
  const debugPort = 9444;
  const tempDir = 'C:\\Users\\DELL\\AppData\\Local\\Temp\\chrome-session-test-' + Date.now();

  const chrome = spawn(chromePath, [
    '--headless=new',
    `--remote-debugging-port=${debugPort}`,
    '--disable-gpu',
    '--no-first-run',
    '--no-default-browser-check',
    `--user-data-dir=${tempDir}`,
    '--window-size=1280,800',
    `http://127.0.0.1:${port}/`
  ]);

  let pageTarget = null;
  for (let i = 0; i < 25; i++) {
    await new Promise(r => setTimeout(r, 250));
    try {
      const res = await fetch(`http://127.0.0.1:${debugPort}/json/list`);
      const list = await res.json();
      pageTarget = list.find(t => t.url.includes(String(port))) || list[0];
      if (pageTarget) break;
    } catch {}
  }

  if (!pageTarget) {
    console.error('[!] Could not connect to Chrome target');
    chrome.kill();
    server.close();
    process.exit(1);
  }

  const ws = new WebSocket(pageTarget.webSocketDebuggerUrl);
  let msgId = 1;
  const pending = new Map();

  ws.onmessage = (event) => {
    const msg = JSON.parse(event.data);
    if (msg.id && pending.has(msg.id)) {
      const { resolve, reject } = pending.get(msg.id);
      pending.delete(msg.id);
      if (msg.error) reject(msg.error);
      else resolve(msg.result);
    }
  };

  const send = (method, params = {}) => new Promise((resolve, reject) => {
    const id = msgId++;
    pending.set(id, { resolve, reject });
    ws.send(JSON.stringify({ id, method, params }));
  });

  const evalJs = async (expr) => {
    const res = await send('Runtime.evaluate', {
      expression: expr,
      returnByValue: true,
      awaitPromise: true
    });
    if (res.exceptionDetails) {
      throw new Error(res.exceptionDetails.exception.description || 'Eval error');
    }
    return res.result ? res.result.value : undefined;
  };

  await new Promise(r => ws.onopen = r);
  await send('Page.enable');
  await send('Runtime.enable');

  try {
    console.log('[*] Suite 1: Initial Session Clock Running State');
    const initBadge = await evalJs(`(() => {
      const badge = document.getElementById('sessionTimerBadge');
      const digits = document.getElementById('sessionTimerDigits');
      const icon = document.getElementById('sessionClockIcon');
      const tag = document.getElementById('sessionEndedTag');
      return {
        hasBadge: !!badge,
        digits: digits ? digits.textContent : null,
        icon: icon ? icon.textContent : null,
        isEndedClass: badge ? badge.classList.contains('is-ended') : false,
        tagDisplay: tag ? window.getComputedStyle(tag).display : null
      };
    })()`);
    console.log('    Initial state:', JSON.stringify(initBadge));
    if (!initBadge.hasBadge || initBadge.isEndedClass || initBadge.tagDisplay !== 'none') {
      throw new Error('Initial session state invalid');
    }
    console.log('    [PASS] Session clock initialized active');

    console.log('[*] Suite 2: Simulating Score Adjustment at 4:49 and 20+ Minute Inactivity Auto-End');
    const simulationResult = await evalJs(`(() => {
      // Set session start time to 4:00 (49 minutes prior to score change)
      const now = Date.now();
      const scoreTime = now - (21 * 60 * 1000); // 21 minutes ago (e.g. 4:49)
      const sessionStartTime = scoreTime - (49 * 60 * 1000); // 49 mins before that (e.g. 4:00)

      // Reset state to simulated timeline
      const raw = localStorage.getItem('21n2_pool_dual_engine_v32');
      const stateObj = raw ? JSON.parse(raw) : {
        activeMode: 'cash',
        cash: { players: [{ id: 1, name: 'Johnny Archer', score: 0 }, { id: 2, name: 'Shane Van Boening', score: 0 }], history: [] },
        tournament: { players: [{ id: 101, name: 'Efren Reyes', score: 0 }, { id: 102, name: 'Earl Strickland', score: 0 }], history: [] }
      };
      stateObj.sessionStartTime = sessionStartTime;
      stateObj.sessionElapsedMs = 0;
      stateObj.lastActivityTime = scoreTime; // point adjusted 21m ago at 4:49
      stateObj.lastActivityElapsedMs = 49 * 60 * 1000; // 49m elapsed at that moment
      stateObj.isSessionEnded = false;
      stateObj.sessionEndedAt = null;
      localStorage.setItem('21n2_pool_dual_engine_v32', JSON.stringify(stateObj));

      // Reload app state to simulate what happens when user leaves app open or reloads
      location.reload();
      return true;
    })()`);

    // Wait for page to reload
    await new Promise(r => setTimeout(r, 1200));

    const endedCheck = await evalJs(`(() => {
      const badge = document.getElementById('sessionTimerBadge');
      const digits = document.getElementById('sessionTimerDigits');
      const icon = document.getElementById('sessionClockIcon');
      const tag = document.getElementById('sessionEndedTag');
      const raw = localStorage.getItem('21n2_pool_dual_engine_v32');
      const stateObj = JSON.parse(raw);

      return {
        isSessionEnded: stateObj.isSessionEnded,
        sessionEndedAt: stateObj.sessionEndedAt,
        sessionElapsedMs: stateObj.sessionElapsedMs,
        digitsText: digits ? digits.textContent : null,
        badgeEndedClass: badge ? badge.classList.contains('is-ended') : false,
        iconText: icon ? icon.textContent : null,
        tagDisplay: tag ? window.getComputedStyle(tag).display : null,
        tagText: tag ? tag.textContent.trim() : null,
        badgeTitle: badge ? badge.title : null
      };
    })()`);

    console.log('    After 21m inactivity check:', JSON.stringify(endedCheck));
    if (!endedCheck.isSessionEnded) throw new Error('Session did not auto-end after 21m');
    if (!endedCheck.badgeEndedClass) throw new Error('Badge missing is-ended class');
    if (endedCheck.digitsText !== '00:49:00') {
      throw new Error(`Expected frozen digits 00:49:00, got ${endedCheck.digitsText}`);
    }
    if (endedCheck.iconText !== 'flag') throw new Error(`Expected icon flag, got ${endedCheck.iconText}`);
    if (endedCheck.tagDisplay === 'none') throw new Error('Ended tag is not visible');
    console.log('    [PASS] Match recognized as ended at 4:49 with frozen 00:49:00 duration');

    console.log('[*] Suite 3: App Boot / Restart After Inactivity (Preserving Frozen End Time)');
    // Reload again to simulate closing and reopening the app
    await evalJs(`location.reload()`);
    await new Promise(r => setTimeout(r, 1000));

    const rebootCheck = await evalJs(`(() => {
      const badge = document.getElementById('sessionTimerBadge');
      const digits = document.getElementById('sessionTimerDigits');
      return {
        badgeEndedClass: badge ? badge.classList.contains('is-ended') : false,
        digitsText: digits ? digits.textContent : null
      };
    })()`);
    console.log('    On app reboot:', JSON.stringify(rebootCheck));
    if (!rebootCheck.badgeEndedClass || rebootCheck.digitsText !== '00:49:00') {
      throw new Error('State not persisted across app reboot');
    }
    console.log('    [PASS] Frozen duration and ended status survive app restarts');

    console.log('[*] Suite 4: Score Adjustment Resumes Fresh Session');
    const scoreResumeCheck = await evalJs(`(() => {
      // Find player 1 cash plus pill or button
      const p1Plus = document.querySelector('#card-player-1 .btn-cash-pill[data-pts="2"]')
        || document.querySelector('.btn-cash-pill.inc');
      if (p1Plus) p1Plus.click();

      const badge = document.getElementById('sessionTimerBadge');
      const raw = localStorage.getItem('21n2_pool_dual_engine_v32');
      const stateObj = JSON.parse(raw);

      return {
        isSessionEnded: stateObj.isSessionEnded,
        sessionElapsedMs: stateObj.sessionElapsedMs,
        badgeEndedClass: badge.classList.contains('is-ended'),
        sessionStartTime: stateObj.sessionStartTime,
        scoreP1: stateObj.cash.players[0].score
      };
    })()`);
    console.log('    After scoring point:', JSON.stringify(scoreResumeCheck));
    if (scoreResumeCheck.isSessionEnded) throw new Error('Session did not start fresh on score adjustment');
    if (scoreResumeCheck.badgeEndedClass) throw new Error('Badge still has is-ended class');
    console.log('    [PASS] Scoring started fresh match session');

    console.log('[*] Suite 5: Manual Tap on Ended Badge Resets to Fresh Session');
    // Force end again, then tap badge
    const tapResetCheck = await evalJs(`(() => {
      const raw = localStorage.getItem('21n2_pool_dual_engine_v32');
      const stateObj = JSON.parse(raw);
      stateObj.lastActivityTime = Date.now() - (25 * 60 * 1000);
      stateObj.lastActivityElapsedMs = 35 * 60 * 1000;
      stateObj.isSessionEnded = false;
      stateObj.tutorialSeen = true;
      localStorage.setItem('21n2_pool_dual_engine_v32', JSON.stringify(stateObj));
      location.reload();
      return true;
    })()`);
    await new Promise(r => setTimeout(r, 1000));

    // Confirm it is ended
    const isEndedBeforeTap = await evalJs(`document.getElementById('sessionTimerBadge').classList.contains('is-ended')`);
    if (!isEndedBeforeTap) throw new Error('Failed to set ended state for tap test');

    const screenshotData = await send('Page.captureScreenshot', { format: 'png' });
    const buffer = Buffer.from(screenshotData.data, 'base64');
    const artifactPath = 'C:\\\\Users\\\\DELL\\\\.gemini\\\\antigravity\\\\brain\\\\d46b763b-27b8-4b97-994a-f1ed9f9efa72\\\\session_ended_preview.png';
    fs.writeFileSync(artifactPath, buffer);
    console.log('    [+] Screenshot of ended session badge saved to:', artifactPath);

    // Tap the badge
    const afterTap = await evalJs(`(() => {
      const badge = document.getElementById('sessionTimerBadge');
      // Trigger pointerdown then pointerup quickly (<600ms)
      badge.dispatchEvent(new PointerEvent('pointerdown', { bubbles: true }));
      badge.dispatchEvent(new PointerEvent('pointerup', { bubbles: true }));

      const raw = localStorage.getItem('21n2_pool_dual_engine_v32');
      const stateObj = JSON.parse(raw);
      const digits = document.getElementById('sessionTimerDigits');

      return {
        isSessionEnded: stateObj.isSessionEnded,
        badgeEndedClass: badge.classList.contains('is-ended'),
        digitsText: digits ? digits.textContent : null
      };
    })()`);
    console.log('    After tapping ended badge:', JSON.stringify(afterTap));
    if (afterTap.isSessionEnded || afterTap.badgeEndedClass || afterTap.digitsText !== '00:00:00') {
      throw new Error('Tap did not reset ended session to 00:00:00');
    }
    console.log('    [PASS] Tapping ended badge resets clock to 00:00:00 and starts fresh session');

    console.log('\n[🎉] ALL 5 SESSION AUTO-END SUITES PASSED PERFECTLY!');
  } catch (err) {
    console.error('\n[❌] Verification failed:', err);
    process.exitCode = 1;
  } finally {
    ws.close();
    chrome.kill();
    server.close();
  }
});
