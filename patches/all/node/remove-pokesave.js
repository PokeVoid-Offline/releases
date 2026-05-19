const fs = require('fs');

const filePath = 'pokevoid-src/package.json';
let content = fs.readFileSync(filePath, 'utf8').replace(/\r\n/g, '\n');

// Remove the "npm run remove-pokesave" call from the build scripts so that
// passing --mode app doesn't cause the extra args to leak into the shell command.
// The pokesave directory simply won't exist in our builds anyway.
const replacements = [
  ['&& npm run remove-pokesave', ''],
];

let changed = false;
for (const [from, to] of replacements) {
  if (content.includes(from)) {
    content = content.split(from).join(to);
    changed = true;
  }
}

if (!changed) {
  console.warn('remove-pokesave: nothing to patch — skipping');
  process.exit(0);
}

fs.writeFileSync(filePath, content);
console.log('Removed npm run remove-pokesave from build scripts.');
