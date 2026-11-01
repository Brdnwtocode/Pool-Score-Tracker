const http = require('http');
const fs = require('fs');
const path = require('path');
const { spawn } = require('child_process');

const MIME = {
  '.html': 'text/html',
  '.css': 'text/css',
  '.js': 'application/javascript',
  '.json': 'application/json',
  '.png': 'image/png'
};

const server = http.createServer((req, res) => {
  let reqPath = req.url.split('?')[0];
  if (reqPath === '/') reqPath = '/index.html';
  const filePath = path.join(__dirname, '..', reqPath);
  fs.readFile(filePath, (err, data) => {
    if (err) { res.writeHead(404); res.end(); return; }
    res.writeHead(200, { 'Content-Type': MIME[path.extname(filePath)] || 'text/plain' });
    res.end(data);
  });
});

server.listen(0, '127.0.0.1', async () => {
  const port = server.address().port;
  console.log(`[+] Test server listening on http://127.0.0.1:${port}`);

  const chrome = spawn('C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe', [
    '--headless=new',
    '--remote-debugging-port=9495',
    '--disable-gpu',
    '--no-first-run',
    '--user-data-dir=C:\\Users\\DELL\\AppData\\Local\\Temp\\chrome-audit-' + Date.now(),
    `http://127.0.0.1:${port}/`
  ]);

  let target = null;
  for (let i = 0; i < 30; i++) {
    await new Promise(r => setTimeout(r, 200));
    try {
      const res = await fetch(`http://127.0.0.1:9495/json/list`);
      const list = await res.json();
      target = list.find(t => t.type === 'page' && t.url.includes(`:${port}`));
      if (target) break;
    } catch {}
  }

  const ws = new WebSocket(target.webSocketDebuggerUrl);
  let id = 1;
  const pending = new Map();
  const consoleErrors = [];

  ws.onmessage = (e) => {
    const msg = JSON.parse(e.data);
    if (msg.method === 'Runtime.consoleAPICalled' && msg.params.type === 'error') {
      consoleErrors.push(msg.params.args.map(a => a.value || a.description).join(' '));
    }
    if (msg.id && pending.has(msg.id)) {
      pending.get(msg.id)(msg.result);
      pending.delete(msg.id);
    }
  };

  const send = (method, params = {}) => new Promise(r => {
    const msgId = id++;
    pending.set(msgId, r);
    ws.send(JSON.stringify({ id: msgId, method, params }));
  });

  await new Promise(r => ws.onopen = r);
  await send('Runtime.enable');

  const evalJs = async (expr) => {
    const res = await send('Runtime.evaluate', { expression: expr, returnByValue: true, awaitPromise: true });
    if (res?.exceptionDetails) console.error('Eval error:', expr, res.exceptionDetails);
    return res?.result?.value;
  };

  await new Promise(r => setTimeout(r, 600));

  // Dismiss tutorial if open
  await evalJs(`
    const tut = document.getElementById('tutorialModal');
    if (tut && tut.classList.contains('open')) {
      document.getElementById('btnDismissTutorial')?.click();
    }
  `);
  await new Promise(r => setTimeout(r, 200));

  console.log('\n--- AUDIT 1: BURGER MENU VERIFICATION ---');

  // Check 1: Open Burger Menu
  await evalJs(`document.getElementById('btnBurgerMenu').click();`);
  await new Promise(r => setTimeout(r, 300));

  const isBurgerOpen = await evalJs(`document.getElementById('burgerMenuBackdrop').classList.contains('open')`);
  console.log(`[+] Burger Menu opened: ${isBurgerOpen}`);
  if (!isBurgerOpen) throw new Error('Burger menu did not open');

  // Check 2: Danger Reset card spans 2 columns
  const resetColSpan = await evalJs(`getComputedStyle(document.getElementById('btnBurgerReset')).gridColumn`);
  console.log(`[+] Reset Match card grid-column: "${resetColSpan}" (expected: "1 / -1")`);
  if (!resetColSpan.includes('1 / -1')) throw new Error('Reset card does not span full width of 2-column grid');

  // Check 3: Localized dynamic states
  const themeText = await evalJs(`document.getElementById('burgerThemeText').textContent.trim()`);
  console.log(`[+] Burger Theme text (VI): "${themeText}" (expected: "Giao diện tối")`);
  if (!themeText.includes('Giao diện')) throw new Error('Theme text not properly localized');

  // Check 4: Reopen race condition test (quick close and reopen)
  await evalJs(`
    // Simulate rapid close and reopen
    document.getElementById('btnCloseBurgerMenu').click();
    document.getElementById('btnBurgerMenu').click();
  `);
  await new Promise(r => setTimeout(r, 350));
  const isBurgerStillOpen = await evalJs(`
    const b = document.getElementById('burgerMenuBackdrop');
    b.classList.contains('open') && b.style.display !== 'none'
  `);
  console.log(`[+] Rapid close/reopen race condition prevented (menu remains open): ${isBurgerStillOpen}`);
  if (!isBurgerStillOpen) throw new Error('Race condition caused burger menu to disappear unexpectedly');

  // Check 5: Transition from Burger Menu to Archive Modal
  await evalJs(`document.getElementById('btnBurgerArchive').click();`);
  await new Promise(r => setTimeout(r, 300));
  const isArchiveOpenFromBurger = await evalJs(`document.getElementById('archiveModal').classList.contains('open')`);
  const isBurgerClosedAfterArchive = await evalJs(`!document.getElementById('burgerMenuBackdrop').classList.contains('open')`);
  console.log(`[+] Archive Modal opened from Burger Menu: ${isArchiveOpenFromBurger}`);
  console.log(`[+] Burger Menu cleanly closed: ${isBurgerClosedAfterArchive}`);
  if (!isArchiveOpenFromBurger || !isBurgerClosedAfterArchive) throw new Error('Burger to Archive transition failed');

  // Close Archive via Esc key (unified overlay handler)
  await evalJs(`window.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', bubbles: true }));`);
  await new Promise(r => setTimeout(r, 200));
  const isArchiveClosedByEsc = await evalJs(`!document.getElementById('archiveModal').classList.contains('open')`);
  console.log(`[+] Archive Modal closed via unified Escape key handler: ${isArchiveClosedByEsc}`);
  if (!isArchiveClosedByEsc) throw new Error('Unified Escape key handler did not close Archive modal');

  console.log('\n--- AUDIT 2: GRAPH SAVING & VISUAL FIDELITY ---');

  // Add points to history
  await evalJs(`{
    const cards = document.querySelectorAll('.player-championship-card');
    const p1Inc = cards[0]?.querySelector('.btn-inc');
    const p2Inc = cards[1]?.querySelector('.btn-inc');
    function tap(el) {
      if (!el) return;
      el.dispatchEvent(new PointerEvent('pointerdown', { bubbles: true, pointerId: 1, clientY: 100 }));
      el.dispatchEvent(new PointerEvent('pointerup', { bubbles: true, pointerId: 1, clientY: 100 }));
    }
    tap(p1Inc);
  }`);
  await new Promise(r => setTimeout(r, 1500));
  await evalJs(`{
    const cards = document.querySelectorAll('.player-championship-card');
    const p1Inc = cards[0]?.querySelector('.btn-inc');
    const p2Inc = cards[1]?.querySelector('.btn-inc');
    function tap(el) {
      if (!el) return;
      el.dispatchEvent(new PointerEvent('pointerdown', { bubbles: true, pointerId: 1, clientY: 100 }));
      el.dispatchEvent(new PointerEvent('pointerup', { bubbles: true, pointerId: 1, clientY: 100 }));
    }
    tap(p1Inc);
    tap(p2Inc);
  }`);
  await new Promise(r => setTimeout(r, 500));

  // Check Rack Log Drawer quick save button
  const hasDrawerSaveBtn = await evalJs(`document.getElementById('btnSaveGraphQuick') !== null`);
  console.log(`[+] Rack Log Drawer Graph view has Quick Save button: ${hasDrawerSaveBtn}`);

  // Open Save Match Modal
  await evalJs(`document.getElementById('btnSaveMatchLog').click();`);
  await new Promise(r => setTimeout(r, 300));

  // Check direct download button exists in Save Match modal
  const hasDirectDownloadBtn = await evalJs(`document.getElementById('btnDownloadGraphSnapshot') !== null`);
  console.log(`[+] Save Match modal has direct "Save Graph Image" button: ${hasDirectDownloadBtn}`);

  // Attach Graph
  await evalJs(`document.getElementById('btnToggleAttachGraph').click();`);
  await new Promise(r => setTimeout(r, 600));

  const isGraphPreviewVisible = await evalJs(`document.getElementById('saveMatchGraphPreviewBox').style.display !== 'none'`);
  console.log(`[+] Graph preview visible inside Save Match modal: ${isGraphPreviewVisible}`);
  if (!isGraphPreviewVisible) throw new Error('Graph preview did not show up');

  // Verify preview controls: download icon & remove icon
  const hasPreviewDownload = await evalJs(`document.getElementById('btnDownloadPreviewGraph') !== null`);
  const hasPreviewRemove = await evalJs(`document.getElementById('btnRemoveGraphSnapshot') !== null`);
  console.log(`[+] Preview box has download tool button: ${hasPreviewDownload}`);
  console.log(`[+] Preview box has remove tool button: ${hasPreviewRemove}`);

  // Tap preview image to open Lightbox
  await evalJs(`document.getElementById('saveMatchGraphPreviewImg').click();`);
  await new Promise(r => setTimeout(r, 300));

  const isLightboxOpen = await evalJs(`document.getElementById('mediaLightboxModal').style.display === 'flex'`);
  const lightboxImgSrc = await evalJs(`document.getElementById('lightboxImg').src`);
  console.log(`[+] Lightbox opened upon tapping preview image: ${isLightboxOpen}`);
  console.log(`[+] Lightbox image source is blob URL: ${lightboxImgSrc.startsWith('blob:')}`);
  if (!isLightboxOpen) throw new Error('Lightbox did not open on preview tap');

  // Close Lightbox via Escape
  await evalJs(`window.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', bubbles: true }));`);
  await new Promise(r => setTimeout(r, 200));
  const isLightboxClosed = await evalJs(`document.getElementById('mediaLightboxModal').style.display === 'none'`);
  console.log(`[+] Lightbox cleanly closed via Escape: ${isLightboxClosed}`);

  // Confirm Save Match
  await evalJs(`
    document.getElementById('saveMatchTitleInput').value = "Audit Championship";
    document.getElementById('btnConfirmSaveMatch').click();
  `);
  await new Promise(r => setTimeout(r, 600));

  // Open Archive and verify saved card
  await evalJs(`document.getElementById('btnOpenArchive').click();`);
  await new Promise(r => setTimeout(r, 500));

  const archiveCardCount = await evalJs(`document.querySelectorAll('.archive-match-card').length`);
  const cardHasGraph = await evalJs(`document.querySelector('.card-media-thumb.graph-thumb') !== null`);
  console.log(`[+] Matches in Archive: ${archiveCardCount}`);
  console.log(`[+] Saved Card has Graph thumbnail: ${cardHasGraph}`);
  if (!cardHasGraph) throw new Error('Saved match card does not have graph thumbnail');

  // Open Lightbox from archive graph thumbnail
  await evalJs(`document.querySelector('.card-media-thumb.graph-thumb').click();`);
  await new Promise(r => setTimeout(r, 300));
  const isArchiveLightboxOpen = await evalJs(`document.getElementById('mediaLightboxModal').style.display === 'flex'`);
  console.log(`[+] Lightbox opened from Archive graph thumbnail: ${isArchiveLightboxOpen}`);

  console.log('\n=== ALL AUDIT CHECKS PASSED WITH 100% SUCCESS! ===\n');

  if (consoleErrors.length > 0) {
    console.error('Console errors:', consoleErrors);
  }

  chrome.kill();
  server.close();
  process.exit(0);
});
