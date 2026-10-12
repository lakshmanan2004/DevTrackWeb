import { spawn } from 'node:child_process';
import { join } from 'node:path';
import fs from 'node:fs';

const ARTIFACTS_DIR = 'C:\\Users\\laksh\\.gemini\\antigravity-ide\\brain\\740f73f5-32d3-447e-8cfb-06f675947e36';
const CHROME_PATH = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
const USER_DATA = join(ARTIFACTS_DIR, 'scratch', 'chrome-profile');

async function run() {
  const chrome = spawn(CHROME_PATH, [
    '--headless=new',
    '--remote-debugging-port=9228',
    `--user-data-dir=${USER_DATA}`,
    '--window-size=1400,900',
    'http://localhost:5173/'
  ]);

  await new Promise((r) => setTimeout(r, 2000));

  try {
    const lRes = await fetch('http://127.0.0.1:9228/json/list');
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
      body: JSON.stringify({ email: 'subash@college.edu', password: 'devtrack@2026' })
    });
    const auth = await loginRes.json();

    await send('Runtime.evaluate', {
      expression: `
        localStorage.setItem('devtrack_token', ${JSON.stringify(auth.token)});
        location.href = '/leader/live';
      `
    });
    await new Promise((r) => setTimeout(r, 2500));

    // Capture in light mode (with scenic wallpaper)
    const shotLight = await send('Page.captureScreenshot', { format: 'png' });
    const filenameLight = join(ARTIFACTS_DIR, 'live_pills_fixed_light.png');
    fs.writeFileSync(filenameLight, Buffer.from(shotLight.data, 'base64'));
    console.log(`Saved screenshot: ${filenameLight}`);

    // Switch to dark mode
    await send('Runtime.evaluate', {
      expression: `
        document.documentElement.classList.add('dark');
      `
    });
    await new Promise((r) => setTimeout(r, 400));

    const shotDark = await send('Page.captureScreenshot', { format: 'png' });
    const filenameDark = join(ARTIFACTS_DIR, 'live_pills_fixed_dark.png');
    fs.writeFileSync(filenameDark, Buffer.from(shotDark.data, 'base64'));
    console.log(`Saved screenshot: ${filenameDark}`);

  } finally {
    chrome.kill();
  }
}

run().catch((e) => {
  console.error(e);
  process.exit(1);
});
