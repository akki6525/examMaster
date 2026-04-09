const input = `Q.1 Ans 1. 1320 2. 1310 3. 1330 4. 1300 Question ID : 630680533606 Option 1 ID : 6306802085899 Option 2 ID : 6306802085898 Option 3 ID : 6306802085900 Option 4 ID : 6306802085897 Status : Answered Chosen Option : 3 Q.2 A tank when full can be emptied by an outlet pipe A in 5.6 hours, while an inlet pipe B can fill the same empty tank in 7 hours. If pipes A and B are turned on alternatively for 1 hour each starting with pipe A when the tank is full, how long will it take to empty the tank? Ans 1.`;

let cleanText = input
    .replace(/\s{3,}/g, '\n')
    .replace(/\b(Q\.\d+|Q\d+)\b/gi, '\n$1')
    .replace(/(Options:)/gi, '\n$1\n')
    .replace(/(Correct Answer:)/gi, '\n$1\n')
    .replace(/(Chosen Option\s*:)/gi, '\n$1\n')
    .replace(/(Question ID\s*:)/gi, '\n$1\n')
    .replace(/(Option \d ID\s*:)/gi, '\n$1\n')
    .replace(/(\([a-dA-D0-9]+\))/g, '\n$1')
    .replace(/(\d)\.(?=\S)/g, '$1. ')
    .replace(/([^\n])([1-4]\.\s)/g, '$1\n$2')
    .replace(/(Ans[:\s]*[1-4]\.?)/gi, '\n$1\n')
    .replace(/1\.\s*(.+?)\s*2\.\s*(.+?)\s*3\.\s*(.+?)\s*4\.\s*(.+?)(?=(?:\s+Q\.|\s+Q\d+\b|\s+Question\b|\s+Question\s+ID|$))/gi, '1. $1\n2. $2\n3. $3\n4. $4')
    .replace(/\(1\)\s*(.+?)\s*\(2\)\s*(.+?)\s*\(3\)\s*(.+?)\s*\(4\)\s*(.+?)(?=(?:\s+Q\.|\s+Q\d+\b|\s+Question\b|\s+Question\s+ID|$))/gi, '1. $1\n2. $2\n3. $3\n4. $4')
    .replace(/\s+2\.\s+/g, '\n2. ')
    .replace(/\s+3\.\s+/g, '\n3. ')
    .replace(/\s+4\.\s+/g, '\n4. ')
    .replace(/Ans\s*(?:[:\-])?\s*(?:1\.|\(1\))\s*/gi, '\nAns ');

console.log('--- CLEANED TEXT ---');
console.log(cleanText);
console.log('--- LINES ---');
console.log(cleanText.split(/\\n/).map(l=>l.trim()).filter(Boolean));
console.log('--- REGEX CHECKS ---');
const test1 = /1\.\s*(.+?)\s*2\./i.exec(input);
console.log('regex 1..2.. match on original input:', !!test1, test1 && test1[0]);
const test2 = /1\.\s*(.+?)\s*2\.\s*(.+?)\s*3\./i.exec(input);
console.log('regex 1..2..3 match on original input:', !!test2);
console.log('contains " 2. ":', input.includes(' 2. '));
console.log('contains " 3. ":', input.includes(' 3. '));
console.log('contains " 4. ":', input.includes(' 4. '));
