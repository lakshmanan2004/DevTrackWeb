import { spawn } from 'node:child_process';
import { join } from 'node:path';

const ARTIFACTS_DIR = 'C:\\Users\\laksh\\.gemini\\antigravity-ide\\brain\\740f73f5-32d3-447e-8cfb-06f675947e36';
const CHROME_PATH = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
const USER_DATA = join(ARTIFACTS_DIR, 'scratch', 'chrome-profile');

async function run() {
  const chrome = spawn(CHROME_PATH, [
    '--headless=new',
    '--remote-debugging-port=9225',
    `--user-data-dir=${USER_DATA}`,
    '--window-size=1400,900',
    'http://localhost:5173/'
  ]);

  await new Promise((r) => setTimeout(r, 2000));

  try {
    const lRes = await fetch('http://127.0.0.1:9225/json/list');
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
    console.log('Logged in as:', auth.user?.email, 'Role:', auth.user?.role);

    await send('Runtime.evaluate', {
      expression: `
        localStorage.setItem('devtrack_token', ${JSON.stringify(auth.token)});
        location.href = '/developer/profile';
      `
    });

    await new Promise((r) => setTimeout(r, 2500));

    // Test in both Light Mode and Dark Mode
    for (const mode of ['light', 'dark']) {
      console.log(`\n========================================`);
      console.log(`VERIFYING STRICT HOVER SCOPE IN [${mode.toUpperCase()} MODE]`);
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

      // 1. Parent Layout Containers (must be transform: none, cursor: default)
      const parentResult = await send('Runtime.evaluate', {
        expression: `
          (() => {
            const containers = document.querySelectorAll('.glass-card:not(.independent-card):not(.hover-card):not(.glass-card-interactive):not(.hover-tile)');
            const results = [];
            for (const c of Array.from(containers).slice(0, 5)) {
              const rect = c.getBoundingClientRect();
              const style = window.getComputedStyle(c);
              results.push({
                tag: c.tagName,
                className: c.className.slice(0, 40),
                transform: style.transform,
                cursor: style.cursor,
                width: Math.round(rect.width),
                height: Math.round(rect.height)
              });
            }
            return results;
          })()
        `,
        returnByValue: true
      });
      console.log('\n[TEST 1] Parent Layout Containers:');
      console.table(parentResult.result.value);

      // 2. Nested Sub-Cards / Inner Tiles (.hover-tile)
      // We will simulate mouse hover on a tile and verify its computed styles
      const tileHoverResult = await send('Runtime.evaluate', {
        expression: `
          (() => {
            const tile = document.querySelector('.hover-tile');
            if (!tile) return { error: 'No .hover-tile found' };
            
            // Get non-hover styles
            const normalTransform = window.getComputedStyle(tile).transform;
            
            return {
              tag: tile.tagName,
              text: tile.innerText.slice(0, 30).replace(/\\n/g, ' '),
              className: tile.className.slice(0, 40),
              normalTransform
            };
          })()
        `,
        returnByValue: true
      });
      console.log('\n[TEST 2] Nested Tile normal state:', tileHoverResult.result.value);

      // Dispatch mouse hover over the tile
      const tileCoords = await send('Runtime.evaluate', {
        expression: `
          (() => {
            const tile = document.querySelector('.hover-tile');
            if (!tile) return null;
            const r = tile.getBoundingClientRect();
            return { x: r.left + r.width / 2, y: r.top + r.height / 2 };
          })()
        `,
        returnByValue: true
      });

      if (tileCoords.result.value) {
        const { x, y } = tileCoords.result.value;
        await send('Input.dispatchMouseEvent', {
          type: 'mouseMoved',
          x,
          y
        });
        await new Promise((r) => setTimeout(r, 350));

        const tileHoveredStyle = await send('Runtime.evaluate', {
          expression: `
            (() => {
              const tile = document.querySelector('.hover-tile');
              const s = window.getComputedStyle(tile);
              return {
                hoveredTransform: s.transform,
                boxShadow: s.boxShadow,
                borderColor: s.borderColor,
                hasBlueColor: s.boxShadow.includes('0, 113, 227') || s.boxShadow.includes('22, 131, 255')
              };
            })()
          `,
          returnByValue: true
        });
        console.log('[TEST 2] Nested Tile HOVER state:', tileHoveredStyle.result.value);
      }

      // 3. Dispatch mouse hover over the large parent container
      const parentCoords = await send('Runtime.evaluate', {
        expression: `
          (() => {
            const container = document.querySelector('.glass-card:not(.independent-card):not(.hover-card):not(.glass-card-interactive):not(.hover-tile)');
            if (!container) return null;
            const r = container.getBoundingClientRect();
            return { x: r.left + 20, y: r.top + 20 };
          })()
        `,
        returnByValue: true
      });

      if (parentCoords.result.value) {
        const { x, y } = parentCoords.result.value;
        await send('Input.dispatchMouseEvent', {
          type: 'mouseMoved',
          x,
          y
        });
        await new Promise((r) => setTimeout(r, 350));

        const parentHoveredStyle = await send('Runtime.evaluate', {
          expression: `
            (() => {
              const container = document.querySelector('.glass-card:not(.independent-card):not(.hover-card):not(.glass-card-interactive):not(.hover-tile)');
              const s = window.getComputedStyle(container);
              return {
                tag: container.tagName,
                hoveredTransform: s.transform,
                cursor: s.cursor
              };
            })()
          `,
          returnByValue: true
        });
        console.log('[TEST 3] Parent Container HOVER state (MUST be none):', parentHoveredStyle.result.value);
      }

      // 4. Test Settings list row (must NOT slide horizontally)
      const listRowCoords = await send('Runtime.evaluate', {
        expression: `
          (() => {
            const row = document.querySelector('.list-row');
            if (!row) return null;
            const r = row.getBoundingClientRect();
            return { x: r.left + r.width / 2, y: r.top + r.height / 2 };
          })()
        `,
        returnByValue: true
      });

      if (listRowCoords.result.value) {
        const { x, y } = listRowCoords.result.value;
        await send('Input.dispatchMouseEvent', {
          type: 'mouseMoved',
          x,
          y
        });
        await new Promise((r) => setTimeout(r, 350));

        const rowHoveredStyle = await send('Runtime.evaluate', {
          expression: `
            (() => {
              const row = document.querySelector('.list-row');
              const s = window.getComputedStyle(row);
              return {
                hoveredTransform: s.transform,
                cursor: s.cursor
              };
            })()
          `,
          returnByValue: true
        });
        console.log('[TEST 4] List Row HOVER state (MUST be none):', rowHoveredStyle.result.value);
      }

      // 5. Test Buttons (must NOT lift as cards)
      const buttonCoords = await send('Runtime.evaluate', {
        expression: `
          (() => {
            const btn = document.querySelector('button.btn-glass-primary, button.btn-glass-secondary');
            if (!btn) return null;
            const r = btn.getBoundingClientRect();
            return { x: r.left + r.width / 2, y: r.top + r.height / 2 };
          })()
        `,
        returnByValue: true
      });

      if (buttonCoords.result.value) {
        const { x, y } = buttonCoords.result.value;
        await send('Input.dispatchMouseEvent', {
          type: 'mouseMoved',
          x,
          y
        });
        await new Promise((r) => setTimeout(r, 350));

        const btnHoveredStyle = await send('Runtime.evaluate', {
          expression: `
            (() => {
              const btn = document.querySelector('button.btn-glass-primary, button.btn-glass-secondary');
              const s = window.getComputedStyle(btn);
              return {
                text: btn.innerText.slice(0, 20),
                hoveredTransform: s.transform,
                isNotCardLift: s.transform !== 'matrix(1, 0, 0, 1, 0, -2)' && s.transform !== 'matrix(1, 0, 0, 1, 0, -2.5)'
              };
            })()
          `,
          returnByValue: true
        });
        console.log('[TEST 5] Button HOVER state:', btnHoveredStyle.result.value);
      }
    }

    // Now test Route with Independent Cards: /developer/dashboard
    console.log(`\n========================================`);
    console.log(`TESTING INDEPENDENT CARDS ON /developer/dashboard`);
    console.log(`========================================`);

    await send('Runtime.evaluate', {
      expression: `
        location.href = '/developer/dashboard';
      `
    });

    await new Promise((r) => setTimeout(r, 2500));

    // Test StatCard / Independent Card
    const cardCoords = await send('Runtime.evaluate', {
      expression: `
        (() => {
          const card = document.querySelector('.independent-card, .glass-card-interactive');
          if (!card) return null;
          const r = card.getBoundingClientRect();
          return { x: r.left + r.width / 2, y: r.top + r.height / 2, text: card.innerText.slice(0, 30).replace(/\\n/g, ' ') };
        })()
      `,
      returnByValue: true
    });

    if (cardCoords.result.value) {
      console.log('Found Independent Card:', cardCoords.result.value.text);
      const { x, y } = cardCoords.result.value;
      await send('Input.dispatchMouseEvent', {
        type: 'mouseMoved',
        x,
        y
      });
      await new Promise((r) => setTimeout(r, 350));

      const cardHoveredStyle = await send('Runtime.evaluate', {
        expression: `
          (() => {
            const card = document.querySelector('.independent-card, .glass-card-interactive');
            const s = window.getComputedStyle(card);
            return {
              hoveredTransform: s.transform,
              boxShadow: s.boxShadow,
              borderColor: s.borderColor,
              hasBlueColor: s.boxShadow.includes('0, 113, 227') || s.boxShadow.includes('22, 131, 255')
            };
          })()
        `,
        returnByValue: true
      });
      console.log('Independent Card HOVER state:', cardHoveredStyle.result.value);
    }

  } finally {
    chrome.kill();
  }
}

run().catch((e) => {
  console.error(e);
  process.exit(1);
});
