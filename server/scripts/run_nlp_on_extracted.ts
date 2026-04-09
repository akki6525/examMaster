import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { processWithNLP } from '../src/services/nlp.js';

(async () => {
  const __filename = fileURLToPath(import.meta.url);
  const __dirname = path.dirname(__filename);
  const file = path.resolve(__dirname, '../tmp_pdf_extracted.txt');
  if (!fs.existsSync(file)) {
    console.error('extracted file not found, run inspect_pdf_server first');
    process.exit(1);
  }
  const text = fs.readFileSync(file, 'utf8');
  const result = await processWithNLP(text);
  console.log('NLP result counts:');
  console.log('extractedQuestions:', result.extractedQuestions.length);
  console.log(result.extractedQuestions.slice(0,5));
})();
