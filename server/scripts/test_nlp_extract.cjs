const fs = require('fs');
const path = require('path');

const inputPath = path.resolve(__dirname, '../tmp_pdf_extracted.txt');
if (!fs.existsSync(inputPath)) {
  console.error('extracted text not found - run inspect_pdf_server first');
  process.exit(1);
}
const text = fs.readFileSync(inputPath, 'utf8');

function normalize(text) {
  return text
    .replace(/\\s{3,}/g, '\n')
    .replace(/\b(Q\.\d+|Q\d+)\b/gi, '\n$1')
    .replace(/(Options:)/gi, '\n$1\n')
    .replace(/(Correct Answer:)/gi, '\n$1\n')
    .replace(/(Chosen Option\\s*:)/gi, '\n$1\n')
    .replace(/(Question ID\\s*:)/gi, '\n$1\n')
    .replace(/(Option \\d ID\\s*:)/gi, '\n$1\n')
    .replace(/(\\([a-dA-D0-9]+\\))/g, '\n$1')
    .replace(/(\\d)\\.(?=\\S)/g, '$1. ')
    .replace(/([^\\n])([1-4]\\.\\s)/g, '$1\\n$2')
    .replace(/(Ans[:\\s]*[1-4]\\.?)/gi, '\n$1\n')
    .replace(/1\\.\\s*(.+?)\\s*2\\.\\s*(.+?)\\s*3\\.\\s*(.+?)\\s*4\\.\\s*(.+?)(?=(?:\\s+Q\\.|\\s+Q\\d+\\b|\\s+Question\\b|\\s+Question\\s+ID|$))/gi, '1. $1\\n2. $2\\n3. $3\\n4. $4')
    .replace(/\\(1\\)\\s*(.+?)\\s*\\(2\\)\\s*(.+?)\\s*\\(3\\)\\s*(.+?)\\s*\\(4\\)\\s*(.+?)(?=(?:\\s+Q\\.|\\s+Q\\d+\\b|\\s+Question\\b|\\s+Question\\s+ID|$))/gi, '1. $1\\n2. $2\\n3. $3\\n4. $4')
    .replace(/\\s+2\\.\\s+/g, '\\n2. ')
    .replace(/\\s+3\\.\\s+/g, '\\n3. ')
    .replace(/\\s+4\\.\\s+/g, '\\n4. ')
    .replace(/Ans\\s*(?:[:\\-])?\\s*(?:1\\.|\\(1\\))\\s*/gi, '\\nAns ');
}

const normalized = normalize(text);
const blocks = normalized.split(/(?=Q\.?\d+[\s.:])/i).map(s=>s.trim()).filter(Boolean);
console.log('Normalized length:', normalized.length);
console.log('Blocks count:', blocks.length);
console.log('First 5 blocks samples:');
for (let i=0;i<Math.min(5,blocks.length);i++){
  console.log('--- block', i+1, '---');
  console.log(blocks[i].substring(0,400));
}

// Count how many blocks contain at least 2 options like '1.' or '(a)'
let valid=0;
for (const b of blocks) {
  const ocount = (b.match(/\b1\.\s+|\b1\)\s+|\(a\)|\ba\)/gi) || []).length;
  if (ocount >=1) valid++;
}
console.log('Blocks with option-like markers:', valid);

