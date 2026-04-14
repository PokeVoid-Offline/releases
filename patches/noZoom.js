const fs = require('fs');

// Patch index.html - disable viewport scaling
const indexPath = 'pokevoid-src/index.html';
let index = fs.readFileSync(indexPath, 'utf8');

const target = 'width=device-width, initial-scale=1.0, viewport-fit=cover';
if (!index.includes(target)) {
  console.error('✗ Could not find viewport meta tag in index.html');
  process.exit(1);
}

index = index.replace(
  target,
  'width=device-width, initial-scale=1.0, viewport-fit=cover, maximum-scale=1.0, user-scalable=no'
);
fs.writeFileSync(indexPath, index);
console.log('✓ Patched index.html viewport meta');
