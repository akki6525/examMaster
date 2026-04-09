import { readFileSync, writeFileSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const dbPath = join(__dirname, 'official-questions.json');

const data = JSON.parse(readFileSync(dbPath, 'utf-8'));

function findDuplicates(examData) {
    const seen = new Map();
    const duplicates = [];

    Object.entries(examData).forEach(([year, questions]) => {
        questions.forEach((q, index) => {
            const key = q.question.trim();
            if (seen.has(key)) {
                duplicates.push({
                    original: seen.get(key),
                    duplicate: { year, index, ...q }
                });
            } else {
                seen.set(key, { year, index, ...q });
            }
        });
    });
    return duplicates;
}

const sscCglDuplicates = findDuplicates(data.ssc_cgl || {});

console.log(`Found ${sscCglDuplicates.length} duplicates in SSC CGL`);

if (sscCglDuplicates.length > 0) {
    console.log('Sample Duplicate:');
    const sample = sscCglDuplicates[0];
    console.log('Original:', JSON.stringify(sample.original, null, 2));
    console.log('Duplicate:', JSON.stringify(sample.duplicate, null, 2));
}

// deduplicate logic
function deduplicate(examData) {
    const result = {};
    const seen = new Set();
    let removedCount = 0;

    Object.entries(examData).forEach(([year, questions]) => {
        result[year] = questions.filter(q => {
            const key = q.question.trim();
            if (seen.has(key)) {
                removedCount++;
                return false;
            }
            seen.add(key);
            return true;
        });
    });
    return { result, removedCount };
}

if (process.argv.includes('--fix')) {
    const { result: sscCglDeduplicated, removedCount: sscRemoved } = deduplicate(data.ssc_cgl || {});
    data.ssc_cgl = sscCglDeduplicated;
    
    // Also deduplicate others if needed
    let totalRemoved = sscRemoved;
    ['upsc', 'ukpsc', 'uksssc', 'ukpsc-pcs', 'ukpsc-roaro', 'uksssc-vdo', 'uksssc-patwari', 'uksssc-forest'].forEach(type => {
        if (data[type]) {
            const { result, removedCount } = deduplicate(data[type]);
            data[type] = result;
            totalRemoved += removedCount;
        }
    });

    writeFileSync(dbPath, JSON.stringify(data, null, 2));
    console.log(`Successfully removed ${totalRemoved} duplicate questions and updated official-questions.json`);
}
