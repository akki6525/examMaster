(async () => {
  const fs = require('fs');
  const path = require('path');
  const pdfjsLib = require('pdfjs-dist');

  pdfjsLib.GlobalWorkerOptions.workerSrc = 'pdfjs-dist/build/pdf.worker.mjs';

  const pdfPath = path.resolve(__dirname, '../server/uploads/d77dc809-8d73-433e-b599-0d51c4a5bfa5-20-Jan-Paper-I- 2025.pdf');
  if (!fs.existsSync(pdfPath)) {
    console.error('PDF not found at', pdfPath);
    process.exit(1);
  }

  const data = new Uint8Array(fs.readFileSync(pdfPath));
  const pdf = await pdfjsLib.getDocument({ data }).promise;
  console.log('PDF pages:', pdf.numPages);

  let fullText = '';
  for (let i = 1; i <= pdf.numPages; i++) {
    const page = await pdf.getPage(i);
    const textContent = await page.getTextContent();
    const pageText = textContent.items.map(item => item.str).join(' ');
    fullText += pageText + '\n\n';
    if (i <= 3) {
      console.log('--- page', i, 'sample text ---');
      console.log(pageText.substring(0, 800));
    }
  }

  const t = fullText;
  console.log('\nFull text length:', t.length);
  const patterns = {
    qdot: /Q\.\d+/g,
    qnum: /Q\d+/g,
    questionWord: /Question\s*ID/gi,
    chosen: /Chosen Option/gi,
    ans: /Ans\b/gi,
    options: /\b1\.\s+\d+|\b1\.\s+[A-Za-z]/g
  };

  for (const [k, re] of Object.entries(patterns)) {
    const m = t.match(re);
    console.log(k, 'matches:', m ? m.length : 0);
  }

  // Print the first 2000 characters for inspection
  console.log('\n--- FIRST 2000 chars ---');
  console.log(t.substring(0, 2000));

  // Save to a temporary file for manual inspection if needed
  const outPath = path.resolve(__dirname, '../tmp_pdf_extracted.txt');
  fs.writeFileSync(outPath, fullText, 'utf8');
  console.log('Wrote full extracted text to', outPath);
})();
