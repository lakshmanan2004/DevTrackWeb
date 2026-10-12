import fs from 'node:fs';
import { spawn } from 'node:child_process';
import { join } from 'node:path';

const CHROME_PATH = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
const USER_DATA = 'C:\\Users\\laksh\\.gemini\\antigravity-ide\\brain\\740f73f5-32d3-447e-8cfb-06f675947e36\\scratch\\chrome-profile-pixel-inspect';

async function run() {
  const chrome = spawn(CHROME_PATH, [
    '--headless=new',
    '--remote-debugging-port=9238',
    `--user-data-dir=${USER_DATA}`,
    '--window-size=1400,900',
    'about:blank'
  ]);

  await new Promise((r) => setTimeout(r, 2000));

  try {
    const lRes = await fetch('http://127.0.0.1:9238/json/list');
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

    const b64 = fs.readFileSync('C:/Users/laksh/.gemini/antigravity-ide/brain/740f73f5-32d3-447e-8cfb-06f675947e36/.user_uploaded/media_1791817513180.png').toString('base64');

    const pixelData = await evalCode(`
      (async () => {
        const img = new Image();
        img.src = 'data:image/png;base64,${b64}';
        await new Promise(r => img.onload = r);
        const canvas = document.createElement('canvas');
        canvas.width = img.width;
        canvas.height = img.height;
        const ctx = canvas.getContext('2d');
        ctx.drawImage(img, 0, 0);

        // Sample vertical line at x = 500 from y = 70 to 106
        const column = [];
        for (let y = 70; y < img.height; y++) {
          const p = ctx.getImageData(500, y, 1, 1).data;
          column.push({ y, r: p[0], g: p[1], b: p[2], a: p[3] });
        }
        return column;
      })()
    `);
    console.log('Vertical column at x=500:', pixelData);

    ws.close();
  } finally {
    chrome.kill();
  }
}

run().catch(console.error);
