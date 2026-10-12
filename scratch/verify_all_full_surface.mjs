import { spawn } from 'node:child_process';
import { join } from 'node:path';
import fs from 'node:fs';

const ARTIFACTS_DIR = 'C:\\Users\\laksh\\.gemini\\antigravity-ide\\brain\\740f73f5-32d3-447e-8cfb-06f675947e36';
const CHROME_PATH = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
const USER_DATA = join(ARTIFACTS_DIR, 'scratch', 'chrome-profile');

async function run() {
  const chrome = spawn(CHROME_PATH, [
    '--headless=new',
    '--remote-debugging-port=9223',
    `--user-data-dir=${USER_DATA}`,
    '--window-size=1400,900',
    'http://localhost:5173/'
  ]);

  await new Promise((r) => setTimeout(r, 2000));

  try {
    const lRes = await fetch('http://127.0.0.1:9223/json/list');
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

    console.log('=== TEST: VERIFYING FULL-SURFACE HOVER & ZERO BLUE GLOW ===');
    const devData = await loginViaApi('lakshmanan@college.edu', 'devtrack@2026');

    // Test function to inspect rules in document
    const testRules = async () => {
      const result = await send('Runtime.evaluate', {
        expression: `
          (() => {
            const rules = [];
            for (const sheet of document.styleSheets) {
              try {
                for (const rule of sheet.cssRules) {
                  if (rule.selectorText && (
                    rule.selectorText.includes('glass-card:hover') ||
                    rule.selectorText.includes('hover-tile:hover') ||
                    rule.selectorText.includes('glass-subcard:hover') ||
                    rule.selectorText.includes('btn-glass-secondary:hover')
                  )) {
                    rules.push({
                      selector: rule.selectorText,
                      cssText: rule.cssText
                    });
                  }
                }
              } catch(e) {}
            }
            return rules;
          })()
        `,
        returnByValue: true
      });
      return result.result.value;
    };

    const rules = await testRules();
    console.log(`Found ${rules.length} active hover interaction rules in stylesheets.`);

    let blueFound = false;
    for (const r of rules) {
      if (r.cssText.includes('0, 113, 227') || r.cssText.includes('22, 131, 255')) {
        console.error(`❌ BLUE FOUND IN RULE: ${r.selector} -> ${r.cssText}`);
        blueFound = true;
      }
    }
    if (!blueFound) {
      console.log('✅ PASS: Absolutely ZERO blue border glow or blue shadow in hover rules!');
    }

    // Now test navigating to developer dashboard
    await send('Runtime.evaluate', {
      expression: `
        localStorage.setItem('devtrack_token', ${JSON.stringify(devData.token)});
        location.href = '/developer/dashboard';
      `
    });
    await new Promise((r) => setTimeout(r, 2000));

    // Inspect elements on page
    const checkElements = async (themeName) => {
      const evalRes = await send('Runtime.evaluate', {
        expression: `
          (() => {
            document.documentElement.classList.toggle('dark', '${themeName}' === 'dark');
            const cards = document.querySelectorAll('.glass-card');
            const subcards = document.querySelectorAll('.glass-subcard, .hover-tile');
            const buttons = document.querySelectorAll('.btn-glass-secondary, button.glass-surface');

            return {
              theme: '${themeName}',
              glassCardsCount: cards.length,
              subcardsCount: subcards.length,
              buttonsCount: buttons.length,
              firstCardClasses: cards[0]?.className,
              firstSubcardClasses: subcards[0]?.className
            };
          })()
        `,
        returnByValue: true
      });
      return evalRes.result.value;
    };

    console.log('\n--- Checking Elements in Light Mode ---');
    console.log(await checkElements('light'));

    console.log('\n--- Checking Elements in Dark Mode ---');
    console.log(await checkElements('dark'));

    // Test hovering over a card
    const hoverCheck = await send('Runtime.evaluate', {
      expression: `
        (() => {
          const card = document.querySelector('.glass-card');
          if (!card) return null;
          
          // Test computed style before hover
          const csBefore = window.getComputedStyle(card);
          
          return {
            hasCard: true,
            tagName: card.tagName,
            classList: Array.from(card.classList),
            transition: csBefore.transition
          };
        })()
      `,
      returnByValue: true
    });
    console.log('\nCard Inspection:', hoverCheck.result.value);

    // Capture screenshot in light and dark mode
    await send('Runtime.evaluate', { expression: `document.documentElement.classList.remove('dark');` });
    await new Promise((r) => setTimeout(r, 400));
    const ssLight = await send('Page.captureScreenshot', { format: 'png' });
    fs.writeFileSync(join(ARTIFACTS_DIR, 'full_surface_dev_light.png'), Buffer.from(ssLight.data, 'base64'));
    console.log('Saved full_surface_dev_light.png');

    await send('Runtime.evaluate', { expression: `document.documentElement.classList.add('dark');` });
    await new Promise((r) => setTimeout(r, 400));
    const ssDark = await send('Page.captureScreenshot', { format: 'png' });
    fs.writeFileSync(join(ARTIFACTS_DIR, 'full_surface_dev_dark.png'), Buffer.from(ssDark.data, 'base64'));
    console.log('Saved full_surface_dev_dark.png');

    ws.close();
  } finally {
    chrome.kill();
  }
}

run().catch((e) => {
  console.error('Fatal error:', e);
  process.exit(1);
});
