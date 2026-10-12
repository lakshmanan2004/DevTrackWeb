import { spawn } from 'node:child_process';
import { join } from 'node:path';
import fs from 'node:fs';

const ARTIFACTS_DIR = 'C:\\Users\\laksh\\.gemini\\antigravity-ide\\brain\\740f73f5-32d3-447e-8cfb-06f675947e36';
const CHROME_PATH = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
const USER_DATA = join(ARTIFACTS_DIR, 'scratch', 'chrome-profile');

async function run() {
  const chrome = spawn(CHROME_PATH, [
    '--headless=new',
    '--remote-debugging-port=9226',
    `--user-data-dir=${USER_DATA}`,
    '--window-size=1400,900',
    'http://localhost:5173/'
  ]);

  await new Promise((r) => setTimeout(r, 2000));

  try {
    const lRes = await fetch('http://127.0.0.1:9226/json/list');
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

    const loginRes = await fetch('http://localhost:5000/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: 'lakshmanan@college.edu', password: 'devtrack@2026' })
    });
    const auth = await loginRes.json();

    await send('Runtime.evaluate', {
      expression: `
        localStorage.setItem('devtrack_token', ${JSON.stringify(auth.token)});
        location.href = '/developer/profile';
      `
    });

    await new Promise((r) => setTimeout(r, 2500));

    for (const mode of ['light', 'dark']) {
      console.log(`\n========================================`);
      console.log(`TESTING FROSTED HEADER IN [${mode.toUpperCase()} MODE]`);
      console.log(`========================================`);

      await send('Runtime.evaluate', {
        expression: `
          if ('${mode}' === 'dark') {
            document.documentElement.classList.add('dark');
          } else {
            document.documentElement.classList.remove('dark');
          }
        `
      });

      // 1. Inspect computed styles of .glass-header
      const headerStyles = await send('Runtime.evaluate', {
        expression: `
          (() => {
            const h = document.querySelector('.glass-header');
            if (!h) return { error: 'No .glass-header found' };
            const s = window.getComputedStyle(h);
            return {
              background: s.background,
              backdropFilter: s.backdropFilter || s.webkitBackdropFilter,
              borderBottom: s.borderBottom,
              boxShadow: s.boxShadow,
              position: s.position,
              zIndex: s.zIndex
            };
          })()
        `,
        returnByValue: true
      });
      console.log('Computed Header Styles:', headerStyles.result.value);

      // 2. Scroll the page so cards pass under the sticky header
      await send('Runtime.evaluate', {
        expression: `
          (() => {
            // Main scroll container
            const main = document.querySelector('main') || window;
            if (main.scrollTo) {
              main.scrollTo({ top: 350, behavior: 'instant' });
            } else {
              window.scrollTo(0, 350);
            }
          })()
        `,
        returnByValue: true
      });

      await new Promise((r) => setTimeout(r, 600));

      // 3. Inspect cards passing under header
      const scrollInfo = await send('Runtime.evaluate', {
        expression: `
          (() => {
            const main = document.querySelector('main');
            const h = document.querySelector('.glass-header');
            const hRect = h.getBoundingClientRect();
            const cards = Array.from(document.querySelectorAll('.glass-card'));
            const cardsUnderHeader = cards.filter(c => {
              const r = c.getBoundingClientRect();
              return r.top < hRect.bottom && r.bottom > hRect.top;
            });
            return {
              scrollTop: main ? main.scrollTop : window.scrollY,
              headerHeight: hRect.height,
              cardsPassingUnderHeader: cardsUnderHeader.length
            };
          })()
        `,
        returnByValue: true
      });
      console.log('Scroll Info:', scrollInfo.result.value);

      // 4. Capture screenshot
      const shot = await send('Page.captureScreenshot', { format: 'png' });
      const filename = join(ARTIFACTS_DIR, `header_scrolled_${mode}.png`);
      fs.writeFileSync(filename, Buffer.from(shot.data, 'base64'));
      console.log(`Saved screenshot to: ${filename}`);

      // 5. Check text readability and contrast for title and subtitle
      const textInfo = await send('Runtime.evaluate', {
        expression: `
          (() => {
            const title = document.querySelector('.glass-header h1, .glass-header h2, .glass-header span.font-bold, .glass-header [class*="font-semibold"]');
            const h = document.querySelector('.glass-header');
            return {
              headerFound: !!h,
              titleText: title ? title.innerText : (h ? h.innerText.slice(0, 40) : 'none'),
              titleColor: title ? window.getComputedStyle(title).color : 'none'
            };
          })()
        `,
        returnByValue: true
      });
      console.log('Header Text Info:', textInfo.result.value);
    }

  } finally {
    chrome.kill();
  }
}

run().catch((e) => {
  console.error(e);
  process.exit(1);
});
