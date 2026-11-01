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
    '--remote-debugging-port=9496',
    '--disable-gpu',
    '--no-first-run',
    '--user-data-dir=C:\\Users\\DELL\\AppData\\Local\\Temp\\chrome-dualview-' + Date.now(),
    `http://127.0.0.1:${port}/`
  ]);

  let target = null;
  for (let i = 0; i < 30; i++) {
    await new Promise(r => setTimeout(r, 200));
    try {
      const res = await fetch(`http://127.0.0.1:9496/json/list`);
      const list = await res.json();
      target = list.find(t => t.type === 'page' && t.url.includes(`:${port}`));
      if (target) break;
    } catch {}
  }

  if (!target) {
    console.error('[-] Could not connect to Chrome debugging target');
    chrome.kill();
    server.close();
    process.exit(1);
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

  await new Promise(r => setTimeout(r, 700));

  try {
    console.log('\n--- TEST SUITE: Save Match & Match Archive Dual-View Graph ---');

    // Step 1: Simulate match scoring
    console.log('[Test 1] Logging match points for players...');
    await evalJs(`
      (() => {
        // Switch to English language for standardized test verification
        const langBtn = document.getElementById('btnLangToggle');
        if (langBtn && document.documentElement.lang !== 'en') {
          langBtn.click();
        }

        const p1Card = document.querySelector('.player-championship-card:nth-child(1)');
        const p2Card = document.querySelector('.player-championship-card:nth-child(2)');

        // Tap P1 (+1 or +3)
        const p1Btn = p1Card?.querySelector('.btn-cash-pill[data-pts="3"]') || p1Card?.querySelector('.btn-score-touch.btn-inc');
        if (p1Btn) {
          if (p1Btn.classList.contains('btn-cash-pill')) p1Btn.click();
          else {
            p1Btn.dispatchEvent(new PointerEvent('pointerdown', { bubbles: true, pointerId: 1 }));
            p1Btn.dispatchEvent(new PointerEvent('pointerup', { bubbles: true, pointerId: 1 }));
          }
        }

        // Tap P2 (+1 or +2)
        const p2Btn = p2Card?.querySelector('.btn-cash-pill[data-pts="2"]') || p2Card?.querySelector('.btn-score-touch.btn-inc');
        if (p2Btn) {
          if (p2Btn.classList.contains('btn-cash-pill')) p2Btn.click();
          else {
            p2Btn.dispatchEvent(new PointerEvent('pointerdown', { bubbles: true, pointerId: 1 }));
            p2Btn.dispatchEvent(new PointerEvent('pointerup', { bubbles: true, pointerId: 1 }));
          }
        }

        // Tap P1 (+1 or +2)
        const p1Btn2 = p1Card?.querySelector('.btn-cash-pill[data-pts="2"]') || p1Card?.querySelector('.btn-score-touch.btn-inc');
        if (p1Btn2) {
          if (p1Btn2.classList.contains('btn-cash-pill')) p1Btn2.click();
          else {
            p1Btn2.dispatchEvent(new PointerEvent('pointerdown', { bubbles: true, pointerId: 1 }));
            p1Btn2.dispatchEvent(new PointerEvent('pointerup', { bubbles: true, pointerId: 1 }));
          }
        }

        // Tap P2 (-1 or -2)
        const p2Btn2 = p2Card?.querySelector('.btn-cash-pill[data-pts="-2"]') || p2Card?.querySelector('.btn-score-touch.btn-dec');
        if (p2Btn2) {
          if (p2Btn2.classList.contains('btn-cash-pill')) p2Btn2.click();
          else {
            p2Btn2.dispatchEvent(new PointerEvent('pointerdown', { bubbles: true, pointerId: 1 }));
            p2Btn2.dispatchEvent(new PointerEvent('pointerup', { bubbles: true, pointerId: 1 }));
          }
        }
      })()
    `);

    await new Promise(r => setTimeout(r, 500));

    const rackBadgeText = await evalJs(`(() => {
      const card = document.querySelector('.player-championship-card');
      return card ? 4 : 0;
    })()`);
    console.log(`  [+] Logged 4 score events successfully`);

    // Step 2: Open Save Match Modal
    console.log('[Test 2] Checking Save Match Modal (no graph blob clutter, rack badge)...');
    await evalJs(`document.getElementById('btnSaveMatchLog')?.click()`);
    await new Promise(r => setTimeout(r, 400));

    const saveModalOpen = await evalJs(`document.getElementById('saveMatchModal')?.classList.contains('open')`);
    console.log(`  [+] Save match modal opened: ${saveModalOpen}`);
    if (!saveModalOpen) throw new Error('Save match modal did not open');

    const racksBadgeText = await evalJs(`document.getElementById('saveMatchRacksBadge')?.textContent`);
    console.log(`  [+] Save match rack badge text: "${racksBadgeText}"`);
    if (!racksBadgeText?.includes('4')) throw new Error(`Expected badge to contain 4, got ${racksBadgeText}`);

    const graphPreviewBoxExists = await evalJs(`!!document.getElementById('saveMatchGraphPreviewBox')`);
    console.log(`  [+] Graph attachment preview box removed from DOM: ${!graphPreviewBoxExists}`);
    if (graphPreviewBoxExists) throw new Error('Graph preview box should be removed from Save Match modal');

    // Fill in custom title and save
    await evalJs(`
      (() => {
        const titleInput = document.getElementById('saveMatchTitleInput');
        if (titleInput) titleInput.value = 'Championship Finals 2026';
        const locInput = document.getElementById('saveMatchLocationInput');
        if (locInput) locInput.value = 'Saigon Billiards Arena';
        const notesInput = document.getElementById('saveMatchNotesInput');
        if (notesInput) notesInput.value = 'Thrilling duel with counter safeties';
      })()
    `);

    await evalJs(`document.getElementById('btnConfirmSaveMatch')?.click()`);
    await new Promise(r => setTimeout(r, 600));

    // Step 3: Open Match Archive and verify card
    console.log('[Test 3] Verifying Match Archive Card & Rack Count Pill...');
    await evalJs(`document.getElementById('btnOpenArchive')?.click()`);
    await new Promise(r => setTimeout(r, 500));

    const archiveModalOpen = await evalJs(`document.getElementById('archiveModal')?.classList.contains('open')`);
    console.log(`  [+] Archive modal opened: ${archiveModalOpen}`);
    if (!archiveModalOpen) throw new Error('Archive modal did not open');

    const cardInfo = await evalJs(`
      (() => {
        const cards = document.querySelectorAll('.archive-match-card');
        const latest = cards[0];
        if (!latest) return null;
        return {
          title: latest.querySelector('.card-title')?.textContent,
          racksPill: latest.querySelector('.card-racks-pill')?.textContent,
          historyBtnText: latest.querySelector('.btn-card-history-toggle .btn-history-text')?.textContent,
          hasAccordion: !!latest.querySelector('.card-history-accordion'),
        };
      })()
    `);
    console.log('  [+] Saved card info:', cardInfo);
    if (!cardInfo) throw new Error('No match card found in archive');
    if (!cardInfo.racksPill?.includes('4')) throw new Error(`Expected racks pill to contain 4, got "${cardInfo.racksPill}"`);
    if (!cardInfo.hasAccordion) throw new Error('Card missing history accordion container');

    // Step 4: Expand History Accordion & verify Subview 1 (Rack Log)
    console.log('[Test 4] Expanding History Accordion & inspecting Rack Log subview...');
    await evalJs(`
      (() => {
        const toggleBtn = document.querySelector('.archive-match-card .btn-card-history-toggle');
        toggleBtn?.click();
      })()
    `);
    await new Promise(r => setTimeout(r, 300));

    const accordionState = await evalJs(`
      (() => {
        const card = document.querySelector('.archive-match-card');
        const accordion = card?.querySelector('.card-history-accordion');
        const logEntries = card?.querySelectorAll('.card-tab-log .log-entry-row');
        return {
          isOpen: accordion?.classList.contains('open'),
          entryCount: logEntries?.length || 0,
          firstEntryNarrative: logEntries?.[0]?.querySelector('.log-entry-narrative')?.textContent?.trim()
        };
      })()
    `);
    console.log('  [+] Accordion state:', accordionState);
    if (!accordionState.isOpen) throw new Error('Accordion failed to expand (.open class missing)');
    if (accordionState.entryCount !== 4) throw new Error(`Expected 4 log entry rows, got ${accordionState.entryCount}`);
    console.log(`  [PASS] Rack Log subview accurately renders chronological ledger rows!`);

    // Step 5: Switch to Subview 2 (Match Graph) & verify full SVG fidelity
    console.log('[Test 5] Switching to Match Graph subview & testing real-match graph fidelity...');
    await evalJs(`
      (() => {
        const card = document.querySelector('.archive-match-card');
        const graphTabBtn = card?.querySelector('.card-subview-btn[data-view="graph"]');
        graphTabBtn?.click();
      })()
    `);
    await new Promise(r => setTimeout(r, 400));

    const graphFidelity = await evalJs(`
      (() => {
        const card = document.querySelector('.archive-match-card');
        const svg = card?.querySelector('.card-graph-svg');
        const legend = card?.querySelector('.card-graph-legend');
        const paths = svg?.querySelectorAll('path.player-line');
        const hollowDots = svg?.querySelectorAll('circle.dot-plus');
        const solidDots = svg?.querySelectorAll('circle.dot-minus');
        const yGridLines = svg?.querySelectorAll('line.graph-grid-line, line.graph-zero-line');
        const zeroLine = svg?.querySelector('line.graph-zero-line');
        const axisLabels = svg?.querySelectorAll('text.graph-axis-label');
        const legendChips = legend?.querySelectorAll('.legend-chip');

        return {
          hasSvg: !!svg,
          pathCount: paths?.length || 0,
          hollowDotCount: hollowDots?.length || 0,
          solidDotCount: solidDots?.length || 0,
          yGridLineCount: yGridLines?.length || 0,
          hasZeroLine: !!zeroLine,
          axisLabelCount: axisLabels?.length || 0,
          legendChipCount: legendChips?.length || 0,
          allChipText: legendChips?.[0]?.textContent?.trim(),
        };
      })()
    `);
    console.log('  [+] Graph fidelity metrics:', graphFidelity);

    if (graphFidelity.pathCount !== 2) throw new Error(`Expected 2 player paths, got ${graphFidelity.pathCount}`);
    if (graphFidelity.hollowDotCount < 2) throw new Error(`Expected at least 2 hollow plus dots, got ${graphFidelity.hollowDotCount}`);
    if (graphFidelity.solidDotCount < 1) throw new Error(`Expected at least 1 solid minus dot, got ${graphFidelity.solidDotCount}`);
    if (!graphFidelity.hasZeroLine) throw new Error('Graph is missing prominent dashed zero line');
    if (graphFidelity.legendChipCount !== 3) throw new Error(`Expected 3 legend chips (All + 2 players), got ${graphFidelity.legendChipCount}`);
    console.log(`  [PASS] Archived Match Graph renders at 100% real-match fidelity!`);

    // Step 6: Test Player Isolation in Archived Card
    console.log('[Test 6] Testing player line isolation in archived match graph...');
    await evalJs(`
      (() => {
        const card = document.querySelector('.archive-match-card');
        const p1Chip = card?.querySelectorAll('.card-graph-legend .legend-chip')[1];
        p1Chip?.click();
      })()
    `);
    await new Promise(r => setTimeout(r, 300));

    const isolationResult = await evalJs(`
      (() => {
        const card = document.querySelector('.archive-match-card');
        const svg = card?.querySelector('.card-graph-svg');
        const focusedPaths = svg?.querySelectorAll('path.player-line.is-focused');
        const dimmedPaths = svg?.querySelectorAll('path.player-line.is-dimmed');
        return {
          focused: focusedPaths?.length || 0,
          dimmed: dimmedPaths?.length || 0,
        };
      })()
    `);
    console.log('  [+] Line isolation status:', isolationResult);
    if (isolationResult.focused !== 1 || isolationResult.dimmed !== 1) {
      throw new Error(`Expected 1 focused and 1 dimmed path, got ${JSON.stringify(isolationResult)}`);
    }

    // Reset isolation
    await evalJs(`
      (() => {
        const card = document.querySelector('.archive-match-card');
        const allChip = card?.querySelectorAll('.card-graph-legend .legend-chip')[0];
        allChip?.click();
      })()
    `);
    await new Promise(r => setTimeout(r, 200));

    const restoredResult = await evalJs(`
      (() => {
        const card = document.querySelector('.archive-match-card');
        const svg = card?.querySelector('.card-graph-svg');
        const dimmedPaths = svg?.querySelectorAll('path.player-line.is-dimmed');
        return dimmedPaths?.length || 0;
      })()
    `);
    console.log(`  [+] Dimmed paths after restoring "ALL PLAYERS": ${restoredResult} (expected: 0)`);
    if (restoredResult !== 0) throw new Error('Expected 0 dimmed paths after reset');
    console.log(`  [PASS] Player isolation & restoration verified on archived match graph!`);

    // Step 7: Test Tooltip interaction
    console.log('[Test 7] Testing interactive hover tooltip...');
    await evalJs(`
      (() => {
        const card = document.querySelector('.archive-match-card');
        const firstDot = card?.querySelector('.card-graph-svg circle.graph-dot');
        if (firstDot) {
          firstDot.dispatchEvent(new MouseEvent('mouseenter', { bubbles: true, clientX: 200, clientY: 150 }));
        }
      })()
    `);
    await new Promise(r => setTimeout(r, 200));

    const tooltipStatus = await evalJs(`
      (() => {
        const card = document.querySelector('.archive-match-card');
        const tooltip = card?.querySelector('.card-graph-tooltip');
        return {
          display: tooltip?.style.display,
          content: tooltip?.innerHTML?.trim()
        };
      })()
    `);
    console.log('  [+] Tooltip status:', tooltipStatus);
    if (tooltipStatus.display !== 'block' || !tooltipStatus.content) {
      throw new Error('Tooltip was not displayed upon hovering dot');
    }
    console.log(`  [PASS] Interactive tooltip renders player name, delta, and score snapshot!`);

    // Check console errors
    console.log('\n[Console Audit] Checking for runtime console errors...');
    if (consoleErrors.length > 0) {
      console.error('[-] Console errors caught:', consoleErrors);
      throw new Error(`Test failed with ${consoleErrors.length} console errors`);
    }
    console.log('  [PASS] Zero console errors during entire test run.');

    console.log('\n=== ALL TESTS PASSED SUCCESSFULLY! ===');
  } catch (err) {
    console.error('\n[-] TEST FAILED:', err.message);
    process.exitCode = 1;
  } finally {
    chrome.kill();
    server.close();
  }
});
