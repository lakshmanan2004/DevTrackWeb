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
const cardPatterns = [
  /className=["'`]([^"'`]*(?:glass-card|glass-subcard|glass-inner-tile|hover-tile|rounded-(?:xl|2xl|3xl)|p-[4568]|border\s+border-)[^"'`]*)["'`]/g
];

console.log(`Found ${files.length} tsx files.`);

const report = [];

for (const file of files) {
  const content = fs.readFileSync(file, 'utf8');
  const relPath = path.relative('.', file);
  
  // Find all className occurrences
  const matches = [...content.matchAll(/className=(?:\{`([^`]+)`\}|["']([^"']+)["'])/g)];
  for (const m of matches) {
    const cls = m[1] || m[2];
    if (!cls) continue;
    
    // Check if it's a card-like element
    const isCardLike = (
      (cls.includes('glass-card') || cls.includes('glass-subcard') || cls.includes('glass-inner-tile') || cls.includes('hover-tile')) ||
      ((cls.includes('rounded-2xl') || cls.includes('rounded-xl') || cls.includes('rounded-3xl')) && 
       (cls.includes('bg-') || cls.includes('backdrop-blur') || cls.includes('border') || cls.includes('shadow')) &&
       (cls.includes('p-4') || cls.includes('p-5') || cls.includes('p-6') || cls.includes('p-3'))
      )
    );
    
    if (isCardLike) {
      const hasGlassCard = cls.includes('glass-card');
      const hasGlassSubcard = cls.includes('glass-subcard');
      const hasGlassInnerTile = cls.includes('glass-inner-tile');
      const hasHoverTile = cls.includes('hover-tile');
      
      report.push({
        file: relPath,
        cls: cls.trim().replace(/\s+/g, ' '),
        hasSharedClass: hasGlassCard || hasGlassSubcard || hasGlassInnerTile || hasHoverTile
      });
    }
  }
}

console.log(`Total card-like elements detected: ${report.length}`);
const nonShared = report.filter(r => !r.hasSharedClass);
console.log(`Elements WITHOUT shared glass/hover classes: ${nonShared.length}`);
nonShared.slice(0, 30).forEach(r => {
  console.log(`File: ${r.file}\n  Classes: ${r.cls}\n`);
});
