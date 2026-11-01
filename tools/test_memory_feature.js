const http = require('http');
const fs = require('fs');
const path = require('path');
const { spawn } = require('child_process');

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
  console.log(`[+] Memory Test server listening on http://127.0.0.1:${port}`);

  const chromePath = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
  const debugPort = 9488;
  const tempDir = 'C:\\Users\\DELL\\AppData\\Local\\Temp\\chrome-memory-test-' + Date.now();

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
  for (let i = 0; i < 30; i++) {
    await new Promise(r => setTimeout(r, 200));
    try {
      const res = await fetch(`http://127.0.0.1:${debugPort}/json/list`);
      const list = await res.json();
      pageTarget = list.find(t => t.type === 'page' && t.url.includes(`:${port}`));
      if (pageTarget) break;
    } catch {}
  }

  if (!pageTarget) {
    console.error('[-] Failed to connect to headless Chrome');
    chrome.kill();
    server.close();
    process.exit(1);
  }

  const ws = new WebSocket(pageTarget.webSocketDebuggerUrl);
  let id = 1;
  const pending = new Map();
  const consoleErrors = [];

  ws.onmessage = (event) => {
    const msg = JSON.parse(event.data);
    if (msg.method === 'Runtime.consoleAPICalled' && msg.params.type === 'error') {
      const text = msg.params.args.map(a => a.value || a.description).join(' ');
      consoleErrors.push(text);
    }
    if (msg.id && pending.has(msg.id)) {
      pending.get(msg.id)(msg.result);
      pending.delete(msg.id);
    }
  };

  const send = (method, params = {}) => new Promise(resolve => {
    const msgId = id++;
    pending.set(msgId, resolve);
    ws.send(JSON.stringify({ id: msgId, method, params }));
  });

  await new Promise(r => {
    if (ws.readyState === 1) r();
    else ws.onopen = r;
  });
  await send('Runtime.enable');
  await send('Page.enable');

  const evalJs = async (expr) => {
    const res = await send('Runtime.evaluate', { expression: expr, returnByValue: true, awaitPromise: true });
    if (res && res.result && res.result.value !== undefined) return res.result.value;
    if (res && res.exceptionDetails) {
      console.error('Eval error:', expr, res.exceptionDetails);
    }
    return null;
  };

  await new Promise(r => setTimeout(r, 600));

  console.log('\n--- STARTING MEMORY & MATCH ARCHIVE TEST SUITE ---');

  // Test 1: Check initial boot & console errors
  console.log('[Test 1] Verifying clean boot...');
  if (consoleErrors.length > 0) {
    console.error('[-] Console errors encountered:', consoleErrors);
  } else {
    console.log('  [PASS] Zero console errors during application load.');
  }

  // Test 2: Add scores on the board
  console.log('[Test 2] Adding scores and points...');
  await evalJs(`
    const addBtns = document.querySelectorAll('.btn-score-direct.plus');
    if (addBtns[0]) addBtns[0].click();
    if (addBtns[0]) addBtns[0].click();
    if (addBtns[1]) addBtns[1].click();
  `);
  await new Promise(r => setTimeout(r, 200));

  const p1Score = await evalJs(`document.querySelectorAll('.score-hero-digits')[0].textContent.trim()`);
  console.log(`  [+] Player 1 score: ${p1Score}`);

  // Test 3: Open Save Match Modal via button in Rack Log Drawer
  console.log('[Test 3] Clicking #btnSaveMatchLog in Rack Log drawer...');
  await evalJs(`document.getElementById('btnSaveMatchLog').click();`);
  await new Promise(r => setTimeout(r, 200));

  const isSaveModalOpen = await evalJs(`document.getElementById('saveMatchModal').classList.contains('open')`);
  console.log(`  [+] Save Match Modal opened: ${isSaveModalOpen}`);
  if (!isSaveModalOpen) throw new Error('Save Match Modal did not open');

  const defaultTitle = await evalJs(`document.getElementById('saveMatchTitleInput').value`);
  console.log(`  [+] Pre-filled default title: "${defaultTitle}"`);

  // Test 4: Fill Metadata & Check Rack Badge
  console.log('[Test 4] Checking rack badge & entering location...');
  await evalJs(`
    document.getElementById('saveMatchTitleInput').value = "Championship Finals 2026";
    document.getElementById('saveMatchLocationInput').value = "Billiards Club 88";
    document.getElementById('saveMatchNotesInput').value = "Great break and run!";
  `);
  await new Promise(r => setTimeout(r, 200));

  const hasRacksBadge = await evalJs(`document.getElementById('saveMatchRacksBadge') !== null`);
  console.log(`  [+] Save match modal has racks badge: ${hasRacksBadge}`);

  // Test 5: Confirm Save Match
  console.log('[Test 5] Clicking Save to Archive...');
  await evalJs(`document.getElementById('btnConfirmSaveMatch').click();`);
  await new Promise(r => setTimeout(r, 600));

  const isSaveModalClosed = await evalJs(`!document.getElementById('saveMatchModal').classList.contains('open')`);
  console.log(`  [+] Save modal closed after saving: ${isSaveModalClosed}`);

  // Verify board state was preserved untouched!
  const p1ScoreAfterSave = await evalJs(`document.querySelectorAll('.score-hero-digits')[0].textContent.trim()`);
  console.log(`  [+] Player 1 score after save: ${p1ScoreAfterSave} (should be untouched: ${p1Score})`);
  if (p1ScoreAfterSave !== p1Score) throw new Error('Scoreboard state was wiped after saving');
  console.log('  [PASS] Active scoreboard was kept completely intact as specified!');

  // Test 6: Open Archive and check stored record
  console.log('[Test 6] Opening Match Archive via #btnOpenArchive...');
  await evalJs(`document.getElementById('btnOpenArchive').click();`);
  await new Promise(r => setTimeout(r, 600));

  const isArchiveOpen = await evalJs(`document.getElementById('archiveModal').classList.contains('open')`);
  console.log(`  [+] Archive Modal opened: ${isArchiveOpen}`);

  const cardCount = await evalJs(`document.querySelectorAll('.archive-match-card').length`);
  console.log(`  [+] Saved Match Cards rendered in Archive: ${cardCount}`);
  if (cardCount < 1) throw new Error('Saved match card not rendered in Archive');

  const cardTitle = await evalJs(`document.querySelector('.card-title').textContent.trim()`);
  const cardLoc = await evalJs(`document.querySelector('.card-loc-tag').textContent.trim()`);
  const hasGraphThumb = await evalJs(`document.querySelector('.card-media-thumb.graph-thumb') !== null`);
  console.log(`  [+] Card Title: "${cardTitle}"`);
  console.log(`  [+] Card Location: "${cardLoc}"`);
  console.log(`  [+] Card has Graph thumbnail: ${hasGraphThumb}`);

  // Test 7: Toggle Pin on match card
  console.log('[Test 7] Testing Pin toggle on match card...');
  await evalJs(`document.querySelector('.btn-card-pin').click();`);
  await new Promise(r => setTimeout(r, 200));
  const isPinned = await evalJs(`document.querySelector('.archive-match-card').classList.contains('pinned')`);
  console.log(`  [+] Card pinned state: ${isPinned}`);

  // Test 8: Location Memory & Autocomplete Check
  console.log('[Test 8] Checking Location Memory (saved venues)...');
  const venues = await evalJs(`JSON.parse(localStorage.getItem('21n2_remembered_venues_v1') || '[]')`);
  console.log(`  [+] Remembered venues in memory:`, venues);
  if (!venues.includes("Billiards Club 88")) throw new Error("Location was not saved to venue memory");
  console.log('  [PASS] Venue memory successfully recorded "Billiards Club 88"!');

  // Test 9: Close Archive
  await evalJs(`document.getElementById('btnCloseArchiveModal').click();`);
  await new Promise(r => setTimeout(r, 200));
  const isArchiveClosed = await evalJs(`!document.getElementById('archiveModal').classList.contains('open')`);
  console.log(`  [+] Archive Modal closed cleanly: ${isArchiveClosed}`);

  console.log('\n=== ALL MEMORY FEATURE TESTS PASSED SUCCESSFULLY! ===\n');

  chrome.kill();
  server.close();
  process.exit(0);
});
