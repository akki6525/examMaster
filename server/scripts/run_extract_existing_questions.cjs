const fs = require('fs');
const path = require('path');

const file = path.resolve(__dirname, '../tmp_pdf_extracted.txt');
if (!fs.existsSync(file)) { console.error('tmp_pdf_extracted.txt not found'); process.exit(1); }
const text = fs.readFileSync(file, 'utf8');

function extractExistingQuestions(text) {
    const questions = [];
    let cleanText = text
        .replace(/\\+\(/g, '(')
        .replace(/\\+\)/g, ')')
        .replace(/\\+\./g, '.')
        .replace(/\\+-/g, '-');

    cleanText = cleanText
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

    // Now attempt to split by Q#. Use same pattern the nlp.ts used
    let stats = { total: 0, linesOne: 0, inlineMultiMatches: 0, pushed: 0 };
    if (/Q\.?\d+[\s.:]/i.test(cleanText)) {
        const sections = cleanText.split(/(?=Q\.?\d+[\s.:])/i);
        for (const section of sections) {
            if (!/Q\.?\d+[\s.:]/i.test(section)) continue;
            stats.total++;
            const lines = section.split('\n').map(l=>l.trim()).filter(Boolean);
            if (lines.length < 2) stats.linesOne++;

            const inlineMultiCheck = section.match(/(?:Ans\s*)?1\.\s*(.+?)\s*2\.\s*(.+?)\s*3\.\s*(.+?)\s*4\.\s*(.+?)(?=(?:\s+Q\.|\s+Q\d+\b|\s+Question\b|$))/i);
            if (inlineMultiCheck) stats.inlineMultiMatches++;

            let questionText = '';
            let options = [];
            let correctAnswer = '';
            let optionIndex = -1;
            let foundMetadata = false;

            for (let i=0;i<lines.length;i++){
                const line = lines[i];
                if (line.match(/^(?:Ans\s+)?(?:1\.\s+|\(1\)\s+|[a-d]\)\s+|\([a-d]\)\s+)/i)) { optionIndex = i; break; }
                if (line.match(/1\.\s+.+?2\.\s+.+?3\.\s+.+?4\.\s+.+/i)) { optionIndex = i; break; }
                let cleanLine = line.replace(/^Q\.?\d+[\s.:]*/i, '').trim();
                if (cleanLine.toLowerCase() === 'ans' || cleanLine === '.' || cleanLine === ':') continue;
                if (cleanLine.length > 0) questionText += (questionText ? ' ' : '') + cleanLine;
            }

            if (inlineMultiCheck) {
                // Inline multi-option sequence found on same section line
                options = [inlineMultiCheck[1].trim(), inlineMultiCheck[2].trim(), inlineMultiCheck[3].trim(), inlineMultiCheck[4].trim()].map(o=>o.replace(/Question\s*ID.*$/i,'').trim());
                // question is the part before the inline match
                const qBefore = section.substring(0, inlineMultiCheck.index || 0).replace(/^Q\.?\d+[\s.:]*/i, '').trim();
                questionText = qBefore;
                // find chosen/official answer
                const chosenMatchInline = section.match(/(?:Chosen Option|Correct Option|Correct Answer)\s*[:\s]*(\d+)/i);
                if (chosenMatchInline) {
                    const idx = parseInt(chosenMatchInline[1]) - 1;
                    correctAnswer = options[idx] || '';
                } else {
                    const officialAnswerMatch = section.match(/\bAnswer\s*[:\s]*(\d+|[a-d])\b/i);
                    if (officialAnswerMatch) {
                        const val = officialAnswerMatch[1];
                        if (val.match(/^[1-4]$/)) correctAnswer = options[parseInt(val) - 1] || '';
                        else if (val.match(/^[a-d]$/i)) correctAnswer = options[val.toLowerCase().charCodeAt(0) - 97] || '';
                    }
                }
                // push if valid
                if (options.length >= 2 && (questionText && questionText.length > 3)) {
                    questions.push({ question: questionText, options: options.slice(0,4), correctAnswer: correctAnswer || options[0] });
                    stats.pushed++;
                    continue;
                }
            }

            if (optionIndex !== -1) {
                for (let i = optionIndex; i < lines.length; i++) {
                    const line = lines[i];
                    if (line.match(/Question ID|Option \d ID|Status|Chosen Option/i)) { foundMetadata = true; }
                    const multiOptionMatch = line.match(/(?:Ans\s+)?1\.\s+(.+?)\s+2\.\s+(.+?)\s+3\.\s+(.+?)\s+4\.\s+(.+)$/i);
                    if (multiOptionMatch) { options = [multiOptionMatch[1], multiOptionMatch[2], multiOptionMatch[3], multiOptionMatch[4]]; continue; }
                    const optionMatch = line.match(/^(?:Ans\s+)?(?:\(?([1-4]|[a-d])\)?[\.\)]\s+)(.+)$/i);
                    if (optionMatch) { const optText = optionMatch[2].trim(); if (optText.length>0) options.push(optText); }
                    else if (options.length > 0 && options.length < 4 && !foundMetadata) { options[options.length-1] += ' ' + line; }
                    const chosenMatch = line.match(/(?:Chosen Option|Correct Option|Correct Answer)\s*[:\s]*(\d+)/i);
                    if (chosenMatch) { const idx = parseInt(chosenMatch[1])-1; if (options[idx]) correctAnswer = options[idx]; else if (chosenMatch[1].match(/^[1-4]$/)) correctAnswer = `OPTION_INDEX_${chosenMatch[1]}`; }
                    const officialAnswerMatch = line.match(/^Answer\s*[:\s]*(\d+|[a-d])/i);
                    if (officialAnswerMatch && !correctAnswer) { const val = officialAnswerMatch[1]; if (val.match(/^[1-4]$/)) correctAnswer = `OPTION_INDEX_${val}`; else if (val.match(/^[a-d]$/i)) { const idx = val.toLowerCase().charCodeAt(0)-97; correctAnswer = `OPTION_INDEX_${idx+1}`; } }
                }
            }

            if (correctAnswer && correctAnswer.startsWith('OPTION_INDEX_')) {
                const idx = parseInt(correctAnswer.replace('OPTION_INDEX_', '')) - 1;
                correctAnswer = options[idx] || '';
            }

            if (options.length >= 2 && questionText.length > 5) {
                questions.push({ question: questionText, options: options.slice(0,4), correctAnswer: correctAnswer || options[0] });
                stats.pushed++;
            }
            // Aggressive fallback: if options still not found, try extracting between 'Ans' and metadata markers
            if ((options.length < 2) && /\bAns\b/i.test(section)) {
                try {
                    const ansIdx = section.search(/\bAns\b/i);
                    if (ansIdx >= 0) {
                        // find end marker (Question ID, Status, or Chosen Option) after ansIdx
                        const endMarkers = ['Question ID', 'Status', 'Chosen Option', 'Option 1 ID'];
                        let endPos = -1;
                        for (const m of endMarkers) {
                            const i = section.indexOf(m, ansIdx);
                            if (i >= 0 && (endPos === -1 || i < endPos)) endPos = i;
                        }
                        const optsPart = endPos >= 0 ? section.substring(ansIdx, endPos) : section.substring(ansIdx);
                        // remove leading 'Ans' token
                        let cleanedOpts = optsPart.replace(/^\s*Ans\b[:\s]*/i, '');
                        // normalize whitespace
                        cleanedOpts = cleanedOpts.replace(/\s+/g, ' ').trim();
                        // split on '1.' '2.' etc (keep variants with spaces)
                        const parts = cleanedOpts.split(/(?=\b[1-4]\.\s+)/g).map(p => p.replace(/^\d+\.\s*/,'').trim()).filter(Boolean);
                        if (parts.length < 2) {
                            // sometimes numbering has no dot or weird spaces, split on ' 2 ' etc
                            const parts2 = cleanedOpts.split(/\s+(?=[1-4]\s+)/g).map(p=>p.replace(/^[1-4]\s+/,'').trim()).filter(Boolean);
                            if (parts2.length >= 2) parts.push(...parts2);
                        }
                        // limit to first 4
                        const uniqParts = parts.slice(0,4).map(p => p.replace(/Question\s*ID.*$/i,'').trim()).filter(Boolean);
                        if (uniqParts.length >= 2) {
                            options = uniqParts;
                            // question is text before Ans
                            const qTextCandidate = section.substring(0, ansIdx).replace(/^Q\.?\d+[\s.:]*/i,'').trim();
                            if (!questionText || questionText.length < 5) questionText = qTextCandidate;
                            // chosen answer
                            const chosenMatch = section.match(/Chosen Option\s*[:\s]*(\d+)/i) || section.match(/Answer\s*[:\s]*(\d+)/i);
                            if (chosenMatch) {
                                const idx = parseInt(chosenMatch[1]) - 1;
                                correctAnswer = options[idx] || correctAnswer;
                            }
                            if (options.length >= 2 && questionText && questionText.length > 3) {
                                questions.push({ question: questionText, options: options.slice(0,4), correctAnswer: correctAnswer || options[0] });
                                stats.pushed++;
                            }
                        }
                    }
                } catch (e) {
                    // ignore
                }
            }
        }
    }

    if (questions.length === 0) {
        // fallback: count blocks starting with Q.
        const blocks = cleanText.split(/(?=Q\.?\d+[\s.:])/i).map(s=>s.trim()).filter(Boolean);
        for (const b of blocks) {
            // naive parsing
            const optmatch = b.match(/1\.\s+.+/i);
            if (optmatch) {
                questions.push({ question: b.substring(0,200), options: ['opt1','opt2','opt3','opt4'] });
            }
        }
    }

    console.log('Extractor stats:', stats);
    return questions;
}

const qs = extractExistingQuestions(text);
console.log('Extracted questions count:', qs.length);
console.log('Sample:', qs.slice(0,3));
// Print diagnostics
try { const temp = (function(){
    const cleaned = text.replace(/\\+\(/g, '(').replace(/\\+\)/g, ')').replace(/\\+\./g, '.').replace(/\\+-/g, '-').replace(/\s{3,}/g,'\n');
    const sections = cleaned.split(/(?=Q\.?\d+[\s.:])/i);
    let total=0, linesOne=0, inlineMulti=0;
    for (const s of sections){ if (!/Q\.?\d+[\s.:]/i.test(s)) continue; total++; const l=s.split('\n').map(x=>x.trim()).filter(Boolean); if (l.length<2) linesOne++; if (s.match(/(?:Ans\s*)?1\.\s*(.+?)\s*2\.\s*(.+?)\s*3\.\s*(.+?)\s*4\./i)) inlineMulti++; }
    return {total,linesOne,inlineMulti}; })(); console.log('Section diagnostics:', temp);
} catch(e){}
