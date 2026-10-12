import fs from 'fs';
import path from 'path';

function findFiles(dir, ext, results = []) {
  const entries = fs.readdirSync(dir, { withFileTypes: true });
  for (const entry of entries) {
    const fullPath = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      findFiles(fullPath, ext, results);
    } else if (entry.name.endsWith(ext)) {
      results.push(fullPath);
    }
  }
  return results;
}

const files = findFiles('src', '.tsx');
const report = [];

for (const file of files) {
  const content = fs.readFileSync(file, 'utf8');
  const relPath = path.relative('.', file);
  
  const matches = [...content.matchAll(/className=(?:\{`([^`]+)`\}|["']([^"']+)["'])/g)];
  for (const m of matches) {
    const cls = m[1] || m[2];
    if (!cls) continue;
    
    // Check if it's a card-like container (not inputs or buttons or modal overlays)
    if (
      (cls.includes('rounded-2xl') || cls.includes('rounded-xl') || cls.includes('rounded-3xl')) &&
      (cls.includes('border') || cls.includes('shadow')) &&
      (cls.includes('p-3') || cls.includes('p-4') || cls.includes('p-5') || cls.includes('p-6')) &&
      !cls.includes('focus:outline') && // not an input
      !cls.includes('glass-card') &&
      !cls.includes('glass-subcard') &&
      !cls.includes('glass-inner-tile') &&
      !cls.includes('hover-tile')
    ) {
      report.push({ file: relPath, cls: cls.trim().replace(/\s+/g, ' ') });
    }
  }
}

console.log(`Total non-shared card-like elements: ${report.length}`);
report.forEach((r, i) => {
  console.log(`[${i+1}] ${r.file}\n    ${r.cls}`);
});
