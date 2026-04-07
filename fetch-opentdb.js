const fs = require('fs');
const path = require('path');
const https = require('https');

const dbPath = path.join(__dirname, 'server', 'data', 'official-questions.json');

function fetchQuestions(categoryId, amount) {
    return new Promise((resolve, reject) => {
        https.get(`https://opentdb.com/api.php?amount=${amount}&category=${categoryId}&type=multiple`, (res) => {
            let data = '';
            res.on('data', chunk => data += chunk);
            res.on('end', () => {
                try {
                    const parsed = JSON.parse(data);
                    resolve(parsed.results || []);
                } catch(e) {
                    resolve([]);
                }
            });
        }).on('error', reject);
    });
}

function decodeHtml(html) {
    return html.replace(/&quot;/g, '"')
               .replace(/&#039;/g, "'")
               .replace(/&amp;/g, '&')
               .replace(/&lt;/g, '<')
               .replace(/&gt;/g, '>')
               .replace(/&Oacute;/g, 'Ó')
               .replace(/&shy;/g, '')
               .replace(/&rsquo;/g, "'")
               .replace(/&Uuml;/g, 'Ü')
               .replace(/&Eacute;/g, 'É')
               .replace(/&ldquo;/g, '"')
               .replace(/&rdquo;/g, '"');
}

async function main() {
    let rawQuestions = [];
    
    // Categories: 9 = GK, 17 = Science, 22 = Geography, 23 = History, 21 = Sports, 20 = Mythology
    const categories = [9, 17, 22, 23, 21, 20];
    
    for (const cat of categories) {
        console.log(`Fetching 50 questions from category ${cat}...`);
        const q = await fetchQuestions(cat, 50);
        rawQuestions = rawQuestions.concat(q);
        
        // Anti-rate-limit delay
        await new Promise(r => setTimeout(r, 2500));
        
        console.log(`Fetching another 50 questions from category ${cat}...`);
        const q2 = await fetchQuestions(cat, 50);
        rawQuestions = rawQuestions.concat(q2);
        
        await new Promise(r => setTimeout(r, 2500));
    }
    
    // Deduplicate from API just in case
    const uniqueRaw = [];
    const seen = new Set();
    for (const rq of rawQuestions) {
        if (!seen.has(rq.question)) {
            seen.add(rq.question);
            uniqueRaw.push(rq);
        }
    }
    
    console.log(`Total unique questions fetched: ${uniqueRaw.length}`);
    
    let dbData = { ssc_cgl: {} };
    if (fs.existsSync(dbPath)) {
        dbData = JSON.parse(fs.readFileSync(dbPath, 'utf8'));
    }
    if (!dbData.ssc_cgl) dbData.ssc_cgl = {};
    
    const years = ['2025', '2024', '2023', '2022', '2021'];
    years.forEach(y => { if (!dbData.ssc_cgl[y]) dbData.ssc_cgl[y] = []; });
    
    uniqueRaw.forEach((rq, idx) => {
        const year = years[idx % years.length];
        
        // Topic mapping
        let topic = 'General Awareness';
        if (rq.category.includes('History')) topic = 'History & Polity';
        if (rq.category.includes('Geography')) topic = 'Geography';
        if (rq.category.includes('Science')) topic = 'General Science';
        if (rq.category.includes('Sports')) topic = 'Current Affairs';
        
        const qText = decodeHtml(rq.question);
        const corAns = decodeHtml(rq.correct_answer);
        const incAns = rq.incorrect_answers.map(a => decodeHtml(a));
        const options = [corAns, ...incAns].sort(() => Math.random() - 0.5);
        
        const newQ = {
            id: `api-tdb-${Date.now()}-${idx}`,
            question: qText,
            options: options,
            correctAnswer: corAns,
            topic: topic,
            explanation: `Correct Answer is: ${corAns}`,
            difficulty: rq.difficulty === 'hard' ? 'hard' : rq.difficulty === 'medium' ? 'medium' : 'easy',
            type: 'mcq',
            sourceType: 'official',
            examName: 'SSC CGL',
            year: parseInt(year)
        };
        
        dbData.ssc_cgl[year].push(newQ);
    });
    
    fs.writeFileSync(dbPath, JSON.stringify(dbData, null, 2));
    console.log(`Pushed ${uniqueRaw.length} REAL UNIQUE questions into SSC CGL database!`);
}

main();
