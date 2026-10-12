import { spawn } from 'node:child_process';
import { join } from 'node:path';

const ARTIFACTS_DIR = 'C:\\Users\\laksh\\.gemini\\antigravity-ide\\brain\\740f73f5-32d3-447e-8cfb-06f675947e36';
const CHROME_PATH = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
const USER_DATA = join(ARTIFACTS_DIR, 'scratch', 'chrome-profile-contrast-audit');

const TEST_ROUTES = [
  { role: 'developer', email: 'lakshmanan@college.edu', route: '/developer' },
  { role: 'developer', email: 'lakshmanan@college.edu', route: '/developer/pending' },
  { role: 'leader', email: 'subash@college.edu', route: '/leader' },
  { role: 'leader', email: 'subash@college.edu', route: '/leader/approvals' },
  { role: 'manager', email: 'harish@college.edu', route: '/manager/overview' },
  { role: 'admin', email: 'admin@college.edu', route: '/admin/settings' }
];

async function runLightAudit() {
  const chrome = spawn(CHROME_PATH, [
    '--headless=new',
    '--remote-debugging-port=9242',
    `--user-data-dir=${USER_DATA}`,
    '--window-size=1440,960',
    'http://localhost:5173/'
  ]);

  await new Promise((r) => setTimeout(r, 2000));

  try {
    const lRes = await fetch('http://127.0.0.1:9242/json/list');
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

    async function evalCode(expr) {
      const res = await send('Runtime.evaluate', {
        expression: expr,
        returnByValue: true,
        awaitPromise: true
      });
      return res.result.value;
    }

    await send('Page.enable');
    await send('Runtime.enable');

    for (const test of TEST_ROUTES) {
      console.log(`Auditing Light Mode route: ${test.route}...`);
      await evalCode(`
        localStorage.setItem('devtrack-theme', 'light');
        localStorage.setItem('devtrack_user', JSON.stringify({
          id: 'usr',
          name: 'Test User',
          email: '${test.email}',
          role: '${test.role}',
          team: 'Team Alpha',
          initials: 'TU'
        }));
        location.href = '${test.route}';
      `);
      await new Promise((r) => setTimeout(r, 1500));
      await evalCode(`document.documentElement.classList.remove('dark');`);
      await new Promise((r) => setTimeout(r, 500));

      const res = await evalCode(`
        (() => {
          function parseRgb(colorStr) {
            if (!colorStr) return null;
            const match = colorStr.match(/rgba?\\((\\d+),\\s*(\\d+),\\s*(\\d+)(?:,\\s*([\\d.]+))?\\)/);
            if (match) {
              return {
                r: parseInt(match[1]),
                g: parseInt(match[2]),
                b: parseInt(match[3]),
                a: match[4] !== undefined ? parseFloat(match[4]) : 1
              };
            }
            return null;
          }

          function getLuminance(rgb) {
            const a = [rgb.r, rgb.g, rgb.b].map(v => {
              v /= 255;
              return v <= 0.03928 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4);
            });
            return a[0] * 0.2126 + a[1] * 0.7152 + a[2] * 0.0722;
          }

          function getContrastRatio(rgb1, rgb2) {
            const l1 = getLuminance(rgb1);
            const l2 = getLuminance(rgb2);
            const lighter = Math.max(l1, l2);
            const darker = Math.min(l1, l2);
            return (lighter + 0.05) / (darker + 0.05);
          }

          function getEffectiveBackgroundColor(el) {
            let curr = el;
            const bgColors = [];
            while (curr && curr !== document) {
              const style = window.getComputedStyle(curr);
              if (curr.classList.contains('glass-card') || curr.classList.contains('glass-elevated')) {
                bgColors.push({ r: 255, g: 255, b: 255, a: 0.75 });
              }
              const bg = parseRgb(style.backgroundColor);
              if (bg && bg.a > 0.05) {
                bgColors.push(bg);
                if (bg.a >= 0.95) break;
              }
              curr = curr.parentElement;
            }
            let base = { r: 245, g: 248, b: 255, a: 1 };
            for (let i = bgColors.length - 1; i >= 0; i--) {
              const overlay = bgColors[i];
              base = {
                r: Math.round(overlay.r * overlay.a + base.r * (1 - overlay.a)),
                g: Math.round(overlay.g * overlay.a + base.g * (1 - overlay.a)),
                b: Math.round(overlay.b * overlay.a + base.b * (1 - overlay.a)),
                a: 1
              };
            }
            return base;
          }

          const elements = Array.from(document.querySelectorAll('p, span, h1, h2, h3, h4, h5, h6, th, td, button, input, textarea, select, label, dt, dd, a'));
          let issues = 0;
          for (const el of elements) {
            const rect = el.getBoundingClientRect();
            if (rect.width === 0 || rect.height === 0 || window.getComputedStyle(el).display === 'none' || window.getComputedStyle(el).visibility === 'hidden') continue;
            const style = window.getComputedStyle(el);
            const text = (el.innerText || el.placeholder || el.value || '').trim();
            if (!text && el.tagName !== 'INPUT') continue;
            const textColor = parseRgb(style.color);
            if (!textColor) continue;
            const bgColor = getEffectiveBackgroundColor(el);
            const ratio = getContrastRatio(textColor, bgColor);
            const fontSize = parseFloat(style.fontSize);
            const fontWeight = parseInt(style.fontWeight) || 400;
            const isLargeText = fontSize >= 18 || (fontSize >= 14 && fontWeight >= 700);
            const minRequired = isLargeText ? 3.0 : 4.5;
            if (ratio < minRequired) issues++;
          }
          return { checked: elements.length, issues };
        })()
      `);
      console.log(`[${test.route}] Checked: ${res.checked}, Issues: ${res.issues}`);
    }
    ws.close();
  } finally {
    chrome.kill();
  }
}

runLightAudit();
