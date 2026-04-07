import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const dataFile = path.join(__dirname, 'official-questions.json');
const data = JSON.parse(fs.readFileSync(dataFile, 'utf8'));

// Function to generate unique ID
const getUniqueId = (exam, year, i) => `${exam}-${year}-extra-${i}`;

const generateQuestions = (topicType, year, examName, count) => {
    const questions = [];
    for (let i = 1; i <= count; i++) {
        questions.push({
            id: getUniqueId(examName, year, i),
            type: "mcq",
            question: `Sample official question ${i} for ${examName} ${year} (${topicType})`,
            options: [
                "Option A",
                "Option B",
                "Option C",
                "Option D"
            ],
            correctAnswer: "Option C",
            explanation: "This is a placeholder explanation.",
            difficulty: "medium",
            topic: topicType,
            source: `${examName} ${year}`,
            examName: examName,
            year: parseInt(year)
        });
    }
    return questions;
};

const exams = Object.keys(data);
const years = ['2022', '2023', '2024', '2025', '2026'];

console.log('Adding questions for 2022 to 2026...');

for (const exam of exams) {
    if (!data[exam]) {
        data[exam] = {};
    }
    
    for (const year of years) {
        if (!data[exam][year]) {
            data[exam][year] = [];
        }
        
        // Add 5 questions per year if we don't have enough
        if (data[exam][year].length < 5) {
             const newQuestions = generateQuestions("General Studies", year, exam, 5 - data[exam][year].length);
             data[exam][year] = [...data[exam][year], ...newQuestions];
        }
    }
}

fs.writeFileSync(dataFile, JSON.stringify(data, null, 4));
console.log('Done! Updated official-questions.json');
