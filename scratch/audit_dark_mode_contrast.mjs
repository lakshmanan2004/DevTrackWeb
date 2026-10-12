import { spawn } from 'node:child_process';
import { join } from 'node:path';
import fs from 'node:fs';

const ARTIFACTS_DIR = 'C:\\Users\\laksh\\.gemini\\antigravity-ide\\brain\\740f73f5-32d3-447e-8cfb-06f675947e36';
const CHROME_PATH = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
const USER_DATA = join(ARTIFACTS_DIR, 'scratch', 'chrome-profile-contrast-audit');

// Roles and their test routes
const TEST_ROLES = [
  {
    role: 'developer',
    email: 'lakshmanan@college.edu',
    password: 'devtrack@2026',
    routes: [
      '/developer',
      '/developer/projects',
      '/developer/pending',
      '/developer/logs',
      '/developer/commits',
      '/developer/eod',
      '/developer/alerts',
      '/developer/profile'
    ]
  },
  {
    role: 'leader',
    email: 'subash@college.edu',
    password: 'devtrack@2026',
    routes: [
      '/leader',
      '/leader/developers',
      '/leader/projects',
      '/leader/alerts',
      '/leader/reports',
      '/leader/commits',
      '/leader/approvals',
      '/leader/profile'
    ]
  },
  {
    role: 'manager',
    email: 'harish@college.edu',
    password: 'devtrack@2026',
    routes: [
      '/manager',
      '/manager/create',
      '/manager/teams',
      '/manager/overview',
      '/manager/alerts',
      '/manager/profile'
    ]
  },
  {
    role: 'admin',
    email: 'admin@college.edu',
    password: 'devtrack@2026',
    routes: [
      '/admin',
      '/admin/projects',
      '/admin/performance',
      '/admin/settings',
      '/admin/profile'
    ]
  }
];

async function runAudit() {
  const chrome = spawn(CHROME_PATH, [
    '--headless=new',
    '--remote-debugging-port=9240',
    `--user-data-dir=${USER_DATA}`,
    '--window-size=1440,960',
    'http://localhost:5173/'
  ]);

  await new Promise((r) => setTimeout(r, 2000));

  try {
    const lRes = await fetch('http://127.0.0.1:9240/json/list');
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

    // Test Login Page first in dark mode
    console.log('Auditing Login Page in Dark Mode...');
    await evalCode(`
      localStorage.setItem('devtrack-theme', 'dark');
      location.href = '/login';
    `);
    await new Promise((r) => setTimeout(r, 2000));
    await evalCode(`document.documentElement.classList.add('dark');`);
    await new Promise((r) => setTimeout(r, 500));

    // Audit function to evaluate in browser context
    const auditScript = `
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
            const afterStyle = window.getComputedStyle(curr, '::after');
            
            // Check after background (for glass cards)
            if (curr.classList.contains('glass-card') || curr.classList.contains('glass-elevated')) {
              // Dark glass card after background is approx rgba(16, 22, 34, 0.55) over body #090d16
              bgColors.push({ r: 16, g: 22, b: 34, a: 0.65 });
            }
            if (curr.classList.contains('glass-subcard') || curr.classList.contains('glass-inner-tile')) {
              bgColors.push({ r: 25, g: 32, b: 48, a: 0.75 });
            }
            if (curr.classList.contains('glass-pill-active')) {
              bgColors.push({ r: 11, g: 99, b: 197, a: 1.0 });
            }

            const bg = parseRgb(style.backgroundColor);
            if (bg && bg.a > 0.05) {
              bgColors.push(bg);
              if (bg.a >= 0.95) break;
            }
            curr = curr.parentElement;
          }
          // Default dark theme base is #090d16
          let base = { r: 9, g: 13, b: 22, a: 1 };
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
        const issues = [];

        for (const el of elements) {
          // Check if element is visible
          const rect = el.getBoundingClientRect();
          if (rect.width === 0 || rect.height === 0 || window.getComputedStyle(el).display === 'none' || window.getComputedStyle(el).visibility === 'hidden') {
            continue;
          }

          const style = window.getComputedStyle(el);
          const text = (el.innerText || el.placeholder || el.value || '').trim();
          if (!text && el.tagName !== 'INPUT' && el.tagName !== 'TEXTAREA') continue;

          const textColor = parseRgb(style.color);
          if (!textColor) continue;

          const bgColor = getEffectiveBackgroundColor(el);
          const ratio = getContrastRatio(textColor, bgColor);

          const fontSize = parseFloat(style.fontSize);
          const fontWeight = parseInt(style.fontWeight) || 400;
          const isLargeText = fontSize >= 18 || (fontSize >= 14 && fontWeight >= 700);
          const minRatio = isLargeText ? 3.0 : 4.5;

          if (ratio < minRatio) {
            // Find key classes or identifiers
            issues.push({
              tag: el.tagName.toLowerCase(),
              className: el.className,
              text: text.slice(0, 40),
              textColor: style.color,
              bgColor: 'rgb(' + bgColor.r + ', ' + bgColor.g + ', ' + bgColor.b + ')',
              ratio: Math.round(ratio * 100) / 100,
              minRequired: minRatio,
              fontSize: style.fontSize,
              fontWeight: style.fontWeight
            });
          }
        }

        // Check input placeholders
        const inputs = Array.from(document.querySelectorAll('input, textarea'));
        for (const input of inputs) {
          if (input.placeholder) {
            // Check placeholder computed style
            // We can approximate placeholder color from the pseudo or rule
            const s = window.getComputedStyle(input);
            const bg = getEffectiveBackgroundColor(input);
            // Check placeholder color
            issues.push({
              type: 'placeholder_check',
              placeholder: input.placeholder,
              inputClass: input.className
            });
          }
        }

        return {
          totalChecked: elements.length,
          issuesCount: issues.length,
          issues: issues.slice(0, 30) // sample top issues
        };
      })()
    `;

    const loginResults = await evalCode(auditScript);
    console.log('Login Page audit results:', JSON.stringify(loginResults, null, 2));

    const allAuditResults = [];

    // Audit each role and route
    for (const testRole of TEST_ROLES) {
      console.log(`\n========================================`);
      console.log(`AUDITING ROLE: ${testRole.role.toUpperCase()}`);
      console.log(`========================================`);

      const loginRes = await fetch('http://localhost:5000/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: testRole.email, password: testRole.password })
      });
      const auth = await loginRes.json();

      for (const route of testRole.routes) {
        console.log(`Auditing route: ${route}...`);
        await evalCode(`
          localStorage.setItem('devtrack_token', ${JSON.stringify(auth.token)});
          localStorage.setItem('devtrack-theme', 'dark');
          location.href = '${route}';
        `);
        await new Promise((r) => setTimeout(r, 2200));

        // Ensure dark class is present
        await evalCode(`document.documentElement.classList.add('dark');`);
        await new Promise((r) => setTimeout(r, 300));

        const pageAudit = await evalCode(auditScript);
        console.log(`[${route}] Checked: ${pageAudit.totalChecked}, Issues found: ${pageAudit.issuesCount}`);

        if (pageAudit.issuesCount > 0) {
          allAuditResults.push({
            role: testRole.role,
            route,
            issuesCount: pageAudit.issuesCount,
            sampleIssues: pageAudit.issues.filter(i => !i.type).slice(0, 10)
          });
        }
      }
    }

    console.log('\n========================================');
    console.log('SUMMARY OF CONTRAST ISSUES ACROSS APP');
    console.log('========================================');
    console.log(JSON.stringify(allAuditResults, null, 2));

    fs.writeFileSync(
      join(ARTIFACTS_DIR, 'dark_mode_contrast_audit.json'),
      JSON.stringify(allAuditResults, null, 2)
    );

    ws.close();
  } finally {
    chrome.kill();
  }
}

runAudit().catch(console.error);
