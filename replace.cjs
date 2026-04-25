const fs = require('fs');
let content = fs.readFileSync('src/App.tsx', 'utf8');

// The user wants sections to be square (rounded-none instead of large radiuses)
// We'll replace rounded-3xl, rounded-2xl, rounded-xl, rounded-[2.5rem] with rounded-none
content = content.replace(/rounded-\[2\.5rem\]/g, 'rounded-sm');
content = content.replace(/rounded-3xl/g, 'rounded-sm');
content = content.replace(/rounded-2xl/g, 'rounded-sm');
content = content.replace(/rounded-xl/g, 'rounded-sm');

// Also for generic sections that might be rounded-lg
content = content.replace(/bg-white([^>]*?)rounded-lg/g, 'bg-white$1rounded-sm');
content = content.replace(/bg-slate-900([^>]*?)rounded-lg/g, 'bg-slate-900$1rounded-sm');

fs.writeFileSync('src/App.tsx', content);
console.log('Replacements complete');
