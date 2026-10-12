import { spawn } from 'node:child_process';
import { join } from 'node:path';
import fs from 'node:fs';

const ARTIFACTS_DIR = 'C:\\Users\\laksh\\.gemini\\antigravity-ide\\brain\\740f73f5-32d3-447e-8cfb-06f675947e36';
const CHROME_PATH = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
const USER_DATA = join(ARTIFACTS_DIR, 'scratch', 'chrome-profile');

async function run() {
  const chrome = spawn(CHROME_PATH, [
    '--headless=new',
    '--remote-debugging-port=9224',
    `--user-data-dir=${USER_DATA}`,
    '--window-size=1400,900',
    'http://localhost:5173/'
  ]);

  await new Promise((r) => setTimeout(r, 2000));

  try {
    const lRes = await fetch('http://127.0.0.1:9224/json/list');
    const targets = await lRes.json();
    const pageTarget = targets.find((t) => t.type === 'page');
    const ws = new WebSocket(pageTarget.webSocketDebuggerUrl);
    await new Promise((r) => (ws.onopen = r));

    let msgId = 1;
    function send(method, params = {}) {
      return new Promise((resolve, reject) => {
        const id = msgId++;
        const handler = (evt) => {
          const res = JSON.parse(evt.data);
          if (res.id === id) {
            ws.removeEventListener('message', handler);
            if (res.error) reject(res.error);
            else resolve(res.result);
          }
        };
        ws.addEventListener('message', handler);
        ws.send(JSON.stringify({ id, method, params }));
      });
    }

    await send('Page.enable');
    await send('Runtime.enable');

    const loginViaApi = async (email, password) => {
      const res = await fetch('http://localhost:5000/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password })
      });
      return await res.json();
    };

    const routes = [
      { name: 'Developer Profile', email: 'lakshmanan@college.edu', role: 'developer', path: '/developer/profile' },
      { name: 'Leader Live Dashboard', email: 'suresh@college.edu', role: 'leader', path: '/leader/live' },
      { name: 'Admin Projects Overview', email: 'admin@college.edu', role: 'admin', path: '/admin/projects' },
      { name: 'Admin Performance', email: 'admin@college.edu', role: 'admin', path: '/admin/performance' }
    ];

    for (const r of routes) {
      console.log(`\nTesting Route: ${r.name} (${r.path})`);
      const auth = await loginViaApi(r.email, 'devtrack@2026');
      if (!auth.token) {
        console.log(`Could not log in as ${r.email}, skipping.`);
        continue;
      }

      await send('Runtime.evaluate', {
        expression: `
          localStorage.setItem('devtrack_token', ${JSON.stringify(auth.token)});
          location.href = '${r.path}';
        `
      });
      await new Promise((res) => setTimeout(res, 2000));

      const stats = await send('Runtime.evaluate', {
        expression: `
          (() => {
            const cards = document.querySelectorAll('.glass-card');
            const hoverTiles = document.querySelectorAll('.hover-tile');
            const subcards = document.querySelectorAll('.glass-subcard');
            const buttons = document.querySelectorAll('.btn-glass-secondary, button.glass-surface');

            return {
              url: location.pathname,
              cardsCount: cards.length,
              hoverTilesCount: hoverTiles.length,
              subcardsCount: subcards.length,
              buttonsCount: buttons.length
            };
          })()
        `,
        returnByValue: true
      });
      console.log('DOM elements found:', stats.result.value);

      // Screenshot
      const ss = await send('Page.captureScreenshot', { format: 'png' });
      const filename = `verified_${r.role}_route.png`;
      fs.writeFileSync(join(ARTIFACTS_DIR, filename), Buffer.from(ss.data, 'base64'));
      console.log(`Saved screenshot: ${filename}`);
    }

    ws.close();
  } finally {
    chrome.kill();
  }
}

run().catch((e) => {
  console.error('Fatal error:', e);
  process.exit(1);
});
