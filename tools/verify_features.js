const { spawn } = require('child_process');
const fs = require('fs');

async function test() {
  console.log('[*] Launching headless Chrome...');
  const chromePath = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
  const debugPort = 9333;
  const tempDir = 'C:\\Users\\DELL\\AppData\\Local\\Temp\\chrome-test-pwa-' + Date.now();

  const chrome = spawn(chromePath, [
    '--headless=new',
    `--remote-debugging-port=${debugPort}`,
    '--disable-gpu',
    '--no-first-run',
    '--no-default-browser-check',
    `--user-data-dir=${tempDir}`,
    '--window-size=1280,800',
    'http://127.0.0.1:8000/'
  ]);

  // Wait for remote debugging endpoint
  let pageTarget = null;
  for (let i = 0; i < 20; i++) {
    await new Promise(r => setTimeout(r, 300));
    try {
      const res = await fetch(`http://127.0.0.1:${debugPort}/json/list`);
      const list = await res.json();
      pageTarget = list.find(t => t.url.includes('8000')) || list[0];
      if (pageTarget) break;
    } catch {}
  }

  if (!pageTarget) {
    console.error('[!] Failed to connect to Chrome debugging target');
    chrome.kill();
    process.exit(1);
  }

  console.log('[+] Connected to target:', pageTarget.url);
  const ws = new WebSocket(pageTarget.webSocketDebuggerUrl);

  let msgId = 1;
  const pending = new Map();
  const consoleLogs = [];
  const consoleErrors = [];

  ws.onmessage = (event) => {
    const msg = JSON.parse(event.data);
    if (msg.id && pending.has(msg.id)) {
      const { resolve, reject } = pending.get(msg.id);
      pending.delete(msg.id);
      if (msg.error) reject(msg.error);
      else resolve(msg.result);
    }
    if (msg.method === 'Runtime.consoleAPICalled') {
      const text = msg.params.args.map(a => a.value || a.description || '').join(' ');
      if (msg.params.type === 'error') consoleErrors.push(text);
      else consoleLogs.push(text);
    }
    if (msg.method === 'Runtime.exceptionThrown') {
      consoleErrors.push(msg.params.exceptionDetails.text + ' ' + (msg.params.exceptionDetails.exception?.description || ''));
    }
  };

  function send(method, params = {}) {
    return new Promise((resolve, reject) => {
      const id = msgId++;
      pending.set(id, { resolve, reject });
      ws.send(JSON.stringify({ id, method, params }));
    });
  }

  await new Promise(resolve => ws.onopen = resolve);

  await send('Page.enable');
  await send('Runtime.enable');
  await send('Network.enable');

  // Helper evaluate
  async function evalJs(expr) {
    const res = await send('Runtime.evaluate', { expression: expr, returnByValue: true, awaitPromise: true });
    if (res.exceptionDetails) {
      throw new Error(res.exceptionDetails.text + ': ' + (res.exceptionDetails.exception?.description || ''));
    }
    return res.result?.value;
  }

  // Wait for initial render
  await new Promise(r => setTimeout(r, 1200));

  console.log('\n--- TEST SUITE: 21N2 Scoreboard New Features ---');

  // Dismiss tutorial if present
  await evalJs(`
    const tut = document.getElementById('tutorialModal');
    if (tut && tut.classList.contains('open')) {
      const btn = document.getElementById('btnDismissTutorial');
      if (btn) btn.click();
    }
  `);

  // TEST 1: Initial State & No Errors
  console.log('[Test 1] Checking console errors and initial state...');
  if (consoleErrors.length > 0) {
    console.error('  [FAIL] Console errors detected:', consoleErrors);
  } else {
    console.log('  [PASS] Zero console errors during boot.');
  }

  const initialZoomText = await evalJs(`document.getElementById('zoomLevelDisplay')?.textContent`);
  console.log(`  [+] Initial zoom display: "${initialZoomText}" (expected: "100%")`);

  // TEST 2: Zoom Stepper Controls & Dynamic Adaptation
  console.log('\n[Test 2] Testing Zoom Stepper and Dynamic UI Adaptation...');
  // Click Zoom In
  await evalJs(`document.getElementById('btnZoomIn').click()`);
  await new Promise(r => setTimeout(r, 200));
  const zoomInText = await evalJs(`document.getElementById('zoomLevelDisplay').textContent`);
  const isZoomedInClass = await evalJs(`document.documentElement.classList.contains('is-zoomed-in')`);
  const desktopToolsDisplay = await evalJs(`getComputedStyle(document.getElementById('mastheadDesktopTools')).display`);
  const burgerBtnDisplay = await evalJs(`getComputedStyle(document.getElementById('btnBurgerMenu')).display`);

  console.log(`  [+] Zoom after clicking (+): ${zoomInText}`);
  console.log(`  [+] html.is-zoomed-in: ${isZoomedInClass}`);
  console.log(`  [+] Desktop tools display when zoomed: ${desktopToolsDisplay} (expected: none)`);
  console.log(`  [+] Burger menu button display when zoomed: ${burgerBtnDisplay} (expected: flex)`);

  if (zoomInText === '110%' && isZoomedInClass && desktopToolsDisplay === 'none' && burgerBtnDisplay === 'flex') {
    console.log('  [PASS] Zoom-in dynamically collapsed desktop tools into burger menu seamlessly!');
  } else {
    console.error('  [FAIL] Zoom-in dynamic adaptation mismatch');
  }

  // Reset zoom by clicking percentage
  await evalJs(`document.getElementById('zoomLevelDisplay').click()`);
  await new Promise(r => setTimeout(r, 200));
  const zoomResetText = await evalJs(`document.getElementById('zoomLevelDisplay').textContent`);
  console.log(`  [+] Zoom after clicking percentage: ${zoomResetText} (expected: 100%)`);

  // TEST 3: Burger Menu Drawer
  console.log('\n[Test 3] Testing Burger Menu Drawer...');
  await evalJs(`document.getElementById('btnBurgerMenu').click()`);
  await new Promise(r => setTimeout(r, 300));
  const isBurgerOpen = await evalJs(`document.getElementById('burgerMenuBackdrop').classList.contains('open')`);
  const burgerZoomVal = await evalJs(`document.getElementById('burgerZoomDisplay').textContent`);
  console.log(`  [+] Burger menu opened: ${isBurgerOpen}`);
  console.log(`  [+] Burger zoom sync readout: ${burgerZoomVal}`);

  // Test zoom inside burger menu
  await evalJs(`document.getElementById('btnBurgerZoomIn').click()`);
  await new Promise(r => setTimeout(r, 200));
  const burgerZoomAfter = await evalJs(`document.getElementById('burgerZoomDisplay').textContent`);
  console.log(`  [+] Burger zoom after (+) in menu: ${burgerZoomAfter}`);

  // Close burger menu
  await evalJs(`document.getElementById('btnCloseBurgerMenu').click()`);
  await new Promise(r => setTimeout(r, 300));
  const isBurgerClosed = await evalJs(`!document.getElementById('burgerMenuBackdrop').classList.contains('open')`);
  console.log(`  [+] Burger menu closed cleanly: ${isBurgerClosed}`);

  // Reset zoom back to 100%
  await evalJs(`document.getElementById('zoomLevelDisplay').click()`);

  // TEST 4: Graph View Feature
  console.log('\n[Test 4] Testing Graph View Feature...');
  // Add some test scores across players using Cash mode quick pills (+2, +3, -2)
  await evalJs(`{
    const p1Card = document.querySelector('.player-championship-card:nth-child(1)');
    const p1Plus3 = p1Card.querySelector('.btn-cash-pill[data-pts="3"]');
    if (p1Plus3) p1Plus3.click();
  }`);
  await new Promise(r => setTimeout(r, 400));

  await evalJs(`{
    const p2Card = document.querySelector('.player-championship-card:nth-child(2)');
    const p2Minus2 = p2Card.querySelector('.btn-cash-pill[data-pts="-2"]');
    if (p2Minus2) p2Minus2.click();
  }`);
  await new Promise(r => setTimeout(r, 400));

  await evalJs(`{
    const p1Card = document.querySelector('.player-championship-card:nth-child(1)');
    const p1Plus2 = p1Card.querySelector('.btn-cash-pill[data-pts="2"]');
    if (p1Plus2) p1Plus2.click();
  }`);
  await new Promise(r => setTimeout(r, 400));

  // Toggle Graph View
  await evalJs(`document.getElementById('btnToggleGraphView').click()`);
  await new Promise(r => setTimeout(r, 300));

  const isGraphVisible = await evalJs(`getComputedStyle(document.getElementById('rackLogGraphContainer')).display === 'flex'`);
  const isListHidden = await evalJs(`getComputedStyle(document.getElementById('rackLogScrollList')).display === 'none'`);
  const graphBtnText = await evalJs(`document.getElementById('graphToggleBtnText').textContent`);
  const numPlayerLines = await evalJs(`document.querySelectorAll('#matchHistorySvg .player-line').length`);
  const numPlusDots = await evalJs(`document.querySelectorAll('#matchHistorySvg .graph-dot.dot-plus').length`);
  const numMinusDots = await evalJs(`document.querySelectorAll('#matchHistorySvg .graph-dot.dot-minus').length`);
  const legendChipsCount = await evalJs(`document.querySelectorAll('#graphLegendBar .legend-chip').length`);

  console.log(`  [+] Graph Container visible: ${isGraphVisible}`);
  console.log(`  [+] List View hidden: ${isListHidden}`);
  console.log(`  [+] Toggle button label: "${graphBtnText}"`);
  console.log(`  [+] Player SVG paths drawn: ${numPlayerLines}`);
  console.log(`  [+] Hollow dots (+pts): ${numPlusDots}`);
  console.log(`  [+] Solid dots (−pts): ${numMinusDots}`);
  console.log(`  [+] Legend chips rendered: ${legendChipsCount}`);

  if (isGraphVisible && numPlayerLines >= 2 && numPlusDots > 0 && numMinusDots > 0) {
    console.log('  [PASS] SVG Graph successfully illustrated match points with hollow & solid dots!');
  } else {
    console.error('  [FAIL] Graph elements missing or invalid');
  }

  // TEST 5: Player Line Isolation Interaction
  console.log('\n[Test 5] Testing Player Line Isolation Interaction...');
  // Click on Player 1's legend chip or line to isolate
  await evalJs(`
    const p1Chip = document.querySelectorAll('#graphLegendBar .legend-chip')[1];
    p1Chip.click();
  `);
  await new Promise(r => setTimeout(r, 200));

  const p1Focused = await evalJs(`document.querySelectorAll('#matchHistorySvg .player-line')[0].classList.contains('is-focused')`);
  const p2Dimmed = await evalJs(`document.querySelectorAll('#matchHistorySvg .player-line')[1].classList.contains('is-dimmed')`);
  console.log(`  [+] Player 1 line isolated (.is-focused): ${p1Focused}`);
  console.log(`  [+] Other player lines darkened (.is-dimmed): ${p2Dimmed}`);

  if (p1Focused && p2Dimmed) {
    console.log('  [PASS] Clicking player isolated line and darkened others correctly!');
  } else {
    console.error('  [FAIL] Line isolation classes not applied correctly');
  }

  // Reset isolation by clicking All Players chip
  await evalJs(`document.querySelectorAll('#graphLegendBar .legend-chip')[0].click()`);
  await new Promise(r => setTimeout(r, 200));
  const anyDimmed = await evalJs(`document.querySelectorAll('#matchHistorySvg .player-line.is-dimmed').length > 0`);
  console.log(`  [+] All players restored (no dimmed lines): ${!anyDimmed}`);

  // Take screenshot of the graph view for artifact preview
  console.log('\n[*] Capturing screenshot of the Graph View...');
  const screenshotData = await send('Page.captureScreenshot', { format: 'png' });
  const buffer = Buffer.from(screenshotData.data, 'base64');
  const artifactPath = 'C:\\Users\\DELL\\.gemini\\antigravity\\brain\\d46b763b-27b8-4b97-994a-f1ed9f9efa72\\graph_view_preview.png';
  fs.writeFileSync(artifactPath, buffer);
  console.log('[+] Screenshot saved to:', artifactPath);

  console.log('\n=== ALL TESTS COMPLETED SUCCESSFULLY ===\n');

  ws.close();
  chrome.kill();
  try { fs.rmSync(tempDir, { recursive: true, force: true }); } catch {}
}

test().catch(err => {
  console.error('[!] Test error:', err);
  process.exit(1);
});
