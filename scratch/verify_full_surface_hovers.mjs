import puppeteer from 'puppeteer';
import fs from 'fs';
import path from 'path';

// Helper to generate auth token if needed
function makeToken(user) {
  const header = Buffer.from(JSON.stringify({ alg: 'HS256', typ: 'JWT' })).toString('base64url');
  const payload = Buffer.from(JSON.stringify({
    id: user.id,
    email: user.email,
    role: user.role,
    name: user.name,
    teamId: user.teamId || 'team-1',
    teamName: user.teamName || 'Frontend Team',
    exp: Math.floor(Date.now() / 1000) + 86400 * 7
  })).toString('base64url');
  return `${header}.${payload}.signature`;
}

const users = {
  developer: { id: 'dev-1', email: 'developer@devtrack.com', role: 'developer', name: 'Alex Rivera', teamId: 'team-1', teamName: 'Core Platform' },
  leader: { id: 'lead-1', email: 'leader@devtrack.com', role: 'leader', name: 'Sarah Chen', teamId: 'team-1', teamName: 'Core Platform' },
  admin: { id: 'admin-1', email: 'admin@devtrack.com', role: 'admin', name: 'System Admin' },
  manager: { id: 'mgr-1', email: 'manager@devtrack.com', role: 'manager', name: 'David Kim' }
};

async function main() {
  const browser = await puppeteer.launch({
    headless: 'new',
    defaultViewport: { width: 1440, height: 900 }
  });

  const page = await browser.newPage();
  const results = [];

  async function checkRoute(role, route, cardSelectors, theme = 'light') {
    const user = users[role];
    const token = makeToken(user);

    await page.goto('http://localhost:5173/login', { waitUntil: 'domcontentloaded' });
    await page.evaluate((tok, u, th) => {
      localStorage.setItem('devtrack_token', tok);
      localStorage.setItem('devtrack_user', JSON.stringify(u));
      localStorage.setItem('devtrack_theme', th);
      if (th === 'dark') {
        document.documentElement.classList.add('dark');
      } else {
        document.documentElement.classList.remove('dark');
      }
    }, token, user, theme);

    await page.goto(`http://localhost:5173${route}`, { waitUntil: 'networkidle2', timeout: 15000 }).catch(() => {});
    await new Promise(r => setTimeout(r, 1000));

    for (const selector of cardSelectors) {
      const elInfo = await page.evaluate((sel) => {
        const el = document.querySelector(sel);
        if (!el) return null;
        
        const rect = el.getBoundingClientRect();
        return {
          found: true,
          tagName: el.tagName,
          className: el.className,
          rect: { x: rect.x + rect.width / 2, y: rect.y + rect.height / 2, width: rect.width, height: rect.height }
        };
      }, selector);

      if (!elInfo) {
        results.push({ route, role, theme, selector, status: 'NOT_FOUND' });
        continue;
      }

      // Hover over the element
      await page.mouse.move(elInfo.rect.x, elInfo.rect.y);
      await new Promise(r => setTimeout(r, 300)); // wait for transition

      const hoverStyles = await page.evaluate((sel) => {
        const el = document.querySelector(sel);
        if (!el) return null;
        const cs = window.getComputedStyle(el);
        return {
          transform: cs.transform,
          boxShadow: cs.boxShadow,
          borderColor: cs.borderColor,
          backgroundColor: cs.backgroundColor,
          cursor: cs.cursor
        };
      }, selector);

      // Check if blue glow is present in border or box-shadow
      const hasBlueGlow = (
        (hoverStyles.borderColor && (hoverStyles.borderColor.includes('0, 113, 227') || hoverStyles.borderColor.includes('22, 131, 255') || hoverStyles.borderColor.includes('rgb(0, 113, 227)'))) ||
        (hoverStyles.boxShadow && (hoverStyles.boxShadow.includes('0, 113, 227') || hoverStyles.boxShadow.includes('22, 131, 255') || hoverStyles.boxShadow.includes('rgb(22, 131, 255)')))
      );

      // Check if full surface inset lighting is present
      const hasFullSurfaceLighting = hoverStyles.boxShadow && hoverStyles.boxShadow.includes('inset');

      results.push({
        route,
        role,
        theme,
        selector,
        status: 'OK',
        transform: hoverStyles.transform,
        boxShadowSnippet: hoverStyles.boxShadow ? hoverStyles.boxShadow.slice(0, 80) + '...' : 'none',
        hasBlueGlow,
        hasFullSurfaceLighting,
        cursor: hoverStyles.cursor
      });
    }

    // Take screenshot of key routes
    if (route === '/developer/dashboard' || route === '/common/profile' || route === '/leader/live') {
      const artifactDir = 'C:\\Users\\laksh\\.gemini\\antigravity-ide\\brain\\740f73f5-32d3-447e-8cfb-06f675947e36';
      const screenshotPath = path.join(artifactDir, `full_surface_${role}_${theme}.png`);
      await page.screenshot({ path: screenshotPath });
      console.log(`Saved screenshot: ${screenshotPath}`);
    }
  }

  console.log('Testing Developer Dashboard (Light & Dark)...');
  await checkRoute('developer', '/developer/dashboard', ['.glass-card', '.glass-card-interactive', '.hover-tile'], 'light');
  await checkRoute('developer', '/developer/dashboard', ['.glass-card', '.glass-card-interactive', '.hover-tile'], 'dark');

  console.log('Testing UserProfile (Light & Dark)...');
  await checkRoute('developer', '/common/profile', ['.glass-card', '.hover-tile', '.btn-glass-secondary'], 'light');
  await checkRoute('developer', '/common/profile', ['.glass-card', '.hover-tile', '.btn-glass-secondary'], 'dark');

  console.log('Testing Leader Live Dashboard (Light & Dark)...');
  await checkRoute('leader', '/leader/live', ['.glass-card', '.glass-subcard', '.hover-tile'], 'light');
  await checkRoute('leader', '/leader/live', ['.glass-card', '.glass-subcard', '.hover-tile'], 'dark');

  console.log('Testing Admin Projects & Performance...');
  await checkRoute('admin', '/admin/projects', ['.glass-card', '.hover-tile'], 'light');
  await checkRoute('admin', '/admin/performance', ['.glass-card', '.glass-subcard'], 'light');

  await browser.close();

  console.log('\n================ VERIFICATION SUMMARY ================');
  console.table(results);
  
  const allNoBlue = results.every(r => r.status === 'OK' ? !r.hasBlueGlow : true);
  const allFullSurface = results.every(r => r.status === 'OK' ? r.hasFullSurfaceLighting : true);
  console.log(`No blue glow on hover: ${allNoBlue ? 'PASSED ✅' : 'FAILED ❌'}`);
  console.log(`Full surface inset lighting present: ${allFullSurface ? 'PASSED ✅' : 'FAILED ❌'}`);
}

main().catch(err => {
  console.error('Error running test:', err);
  process.exit(1);
});
