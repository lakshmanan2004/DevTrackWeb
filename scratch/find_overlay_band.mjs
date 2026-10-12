import fs from 'node:fs';

// Simple PNG chunk reader to extract pixel data or load via browser / CDP
// Or even simpler: open Chrome and draw the image onto a canvas to inspect pixel RGBA!
import { spawn } from 'node:child_process';
import { join } from 'node:path';

const ARTIFACTS_DIR = 'C:\\Users\\laksh\\.gemini\\antigravity-ide\\brain\\740f73f5-32d3-447e-8cfb-06f675947e36';
const CHROME_PATH = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
const USER_DATA = join(ARTIFACTS_DIR, 'scratch', 'chrome-profile-find-band');

async function run() {
  const chrome = spawn(CHROME_PATH, [
    '--headless=new',
    '--remote-debugging-port=9237',
    `--user-data-dir=${USER_DATA}`,
    '--window-size=1400,900',
    'http://localhost:5173/'
  ]);

  await new Promise((r) => setTimeout(r, 2000));

  try {
    const lRes = await fetch('http://127.0.0.1:9237/json/list');
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

    const mgrLoginRes = await fetch('http://localhost:5000/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: 'harish@college.edu', password: 'devtrack@2026' })
    });
    const mgrAuth = await mgrLoginRes.json();

    await evalCode(`
      localStorage.setItem('devtrack_token', ${JSON.stringify(mgrAuth.token)});
      localStorage.setItem('devtrack-theme', 'light');
      localStorage.setItem('devtrack-wallpaper', '/DarkForest.jpg');
      location.href = '/manager/profile';
    `);
    await new Promise((r) => setTimeout(r, 2500));
    await evalCode(`document.documentElement.classList.remove('dark');`);
    await new Promise((r) => setTimeout(r, 500));

    // Inspect elements at various points across the screen!
    // Specifically on the left card (x=450, y from 100 to 700)
    // and on the manager card (x=800, y from 430 to 720)
    const pointInspection = await evalCode(`
      (() => {
        const results = [];
        // Test points down the left card (x = 450)
        for (let y = 110; y <= 730; y += 20) {
          const els = document.elementsFromPoint(450, y);
          results.push({
            x: 450,
            y,
            elements: els.map(e => e.tagName + (e.className ? '.' + e.className.split(' ')[0] : ''))
          });
        }
        return results;
      })()
    `);
    console.log('Sample of elementsFromPoint on left card:', pointInspection.slice(0, 10));

    // Also check if any element has a bounding rect crossing y coords
    const allBoxCheck = await evalCode(`
      (() => {
        const all = Array.from(document.querySelectorAll('*'));
        return all
          .map(el => {
            const r = el.getBoundingClientRect();
            const s = window.getComputedStyle(el);
            return {
              tag: el.tagName,
              className: el.className,
              rect: { top: Math.round(r.top), bottom: Math.round(r.bottom), left: Math.round(r.left), right: Math.round(r.right), width: Math.round(r.width), height: Math.round(r.height) },
              background: s.background,
              backdropFilter: s.backdropFilter || s.webkitBackdropFilter,
              opacity: s.opacity,
              boxShadow: s.boxShadow
            };
          })
          .filter(item => {
            // Check elements that intersect the card area (left between 280 and 1350, top between 100 and 800)
            return item.rect.width > 200 && item.rect.height > 10;
          });
      })()
    `);
    console.log('Large elements overlapping card area:', allBoxCheck.length);
    for (const el of allBoxCheck) {
      if (el.className.includes('ambient') || el.className.includes('overlay') || el.backdropFilter !== 'none' || el.background.includes('gradient')) {
        console.log(`- ${el.tag}.${el.className} [top:${el.rect.top}, left:${el.rect.left}, w:${el.rect.width}, h:${el.rect.height}] bg:${el.background.slice(0, 50)} bf:${el.backdropFilter}`);
      }
    }

    ws.close();
  } finally {
    chrome.kill();
  }
}

run().catch(console.error);
