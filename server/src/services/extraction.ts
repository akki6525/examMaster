import fs from 'fs/promises';
import path from 'path';
import * as pdfjsLib from 'pdfjs-dist';
import mammoth from 'mammoth';
import Tesseract from 'tesseract.js';

// Initialize PDF.js worker
pdfjsLib.GlobalWorkerOptions.workerSrc = 'pdfjs-dist/build/pdf.worker.mjs';

// Language configuration
export interface ExtractionOptions {
    language?: 'eng' | 'hin' | 'eng+hin';
    translateToEnglish?: boolean;
}

export async function extractText(
    filePath: string,
    mimeType: string,
    options: ExtractionOptions = { language: 'eng+hin', translateToEnglish: true }
): Promise<string> {
    try {
        let text = '';

        if (mimeType === 'application/pdf') {
            text = await extractFromPDF(filePath, options);
        } else if (mimeType === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document') {
            text = await extractFromDOCX(filePath);
        } else if (mimeType === 'text/plain') {
            text = await extractFromTXT(filePath);
        } else if (mimeType.startsWith('image/')) {
            text = await extractFromImage(filePath, options);
        } else {
            throw new Error(`Unsupported file type: ${mimeType}`);
        }

        // Translate Hindi to English if detected
        if (options.translateToEnglish && containsHindi(text)) {
            console.log('Hindi text detected, translating to English...');
            text = await translateHindiToEnglish(text);
        }

        return text;
    } catch (error) {
        console.error('Extraction error:', error);
        throw error;
    }
}

async function extractFromPDF(filePath: string, options: ExtractionOptions): Promise<string> {
    try {
        const data = new Uint8Array(await fs.readFile(filePath));
        const pdf = await pdfjsLib.getDocument({ data }).promise;

        let fullText = '';

        for (let i = 1; i <= pdf.numPages; i++) {
            const page = await pdf.getPage(i);
            const textContent = await page.getTextContent();
            const pageText = textContent.items
                .map((item: any) => item.str)
                .join(' ');
            fullText += pageText + '\n\n';
        }

        // Check if text is garbled (non-standard font encoding)
        if (isTextGarbled(fullText)) {
            console.log('PDF has garbled text due to non-standard font encoding.');
            console.log('Attempting to clean and transliterate the text...');

            // Try to clean and make sense of the garbled text
            fullText = cleanGarbledText(fullText);

            // If still mostly garbled, provide a meaningful error
            if (isTextGarbled(fullText)) {
                throw new Error(
                    'This PDF uses a non-standard font encoding that cannot be read properly. ' +
                    'Please try one of the following:\n' +
                    '1. Convert the PDF to images (PNG/JPG) and upload those instead\n' +
                    '2. Use a PDF with standard fonts\n' +
                    '3. Copy-paste the text content into a .txt file and upload that'
                );
            }
        }

        // If PDF has very little text, it might be scanned
        if (fullText.trim().length < 100) {
            throw new Error(
                'This PDF appears to be scanned or has very little text. ' +
                'Please convert it to images (PNG/JPG) and upload those instead for OCR processing.'
            );
        }

        return fullText.trim();
    } catch (error) {
        throw error;
    }
}

// Clean common garbled patterns from PDFs
function cleanGarbledText(text: string): string {
    // Common substitution patterns for Hindi PDFs with encoding issues
    const replacements: [RegExp, string][] = [
        [/fofHkUu/g, 'विभिन्न'],
        [/izdkj/g, 'प्रकार'],
        [/mYys[k]/g, 'उल्लेख'],
        [/egk"e/g, 'महाश्म'],
        [/laLd`fr/g, 'संस्कृति'],
        [/iqjkfonksa/g, 'पुरातत्वों'],
        [/}kjkgkV/g, 'द्वाराहाट'],
        [/\s+A\s+/g, '। '],
        [/\s+\\s+/g, ' '],
        [/¼/g, '('],
        [/½/g, ')'],
    ];

    let cleaned = text;
    for (const [pattern, replacement] of replacements) {
        cleaned = cleaned.replace(pattern, replacement);
    }

    return cleaned;
}

// Detect garbled text from PDFs with non-standard font encoding
function isTextGarbled(text: string): boolean {
    if (text.length < 50) return false;

    // Common patterns in garbled text from PDFs with encoding issues
    const garbledPatterns = [
        /[¼½¾]/,
        /[dk;]{4,}/i,
        /fofHkUu/,
        /izdkj/,
        /Hk[kqu]/i,
        /[vV][kK][dD]/i,
        /[lL][dD][Hh]/i,
        /egk"e/,
        /laLd`fr/,
    ];

    let matchCount = 0;
    for (const pattern of garbledPatterns) {
        if (pattern.test(text)) {
            matchCount++;
        }
    }

    return matchCount >= 2;
}

async function extractFromDOCX(filePath: string): Promise<string> {
    const buffer = await fs.readFile(filePath);

    // Use convertToHtml to preserve document structure (headings, etc.)
    const result = await mammoth.convertToHtml({ buffer });
    let html = result.value;

    // Convert HTML to text with structure preserved
    // Convert headings to ### format for easier parsing
    html = html.replace(/<h1[^>]*>(.*?)<\/h1>/gi, '\n### $1\n');
    html = html.replace(/<h2[^>]*>(.*?)<\/h2>/gi, '\n### $1\n');
    html = html.replace(/<h3[^>]*>(.*?)<\/h3>/gi, '\n### $1\n');
    html = html.replace(/<h4[^>]*>(.*?)<\/h4>/gi, '\n### $1\n');
    html = html.replace(/<p[^>]*>(.*?)<\/p>/gi, '$1\n');
    html = html.replace(/<br\s*\/?>/gi, '\n');
    html = html.replace(/<li[^>]*>(.*?)<\/li>/gi, '$1\n');
    html = html.replace(/<[^>]+>/g, ''); // Remove remaining HTML tags
    html = html.replace(/&nbsp;/g, ' ');
    html = html.replace(/&amp;/g, '&');
    html = html.replace(/&lt;/g, '<');
    html = html.replace(/&gt;/g, '>');
    html = html.replace(/\n{3,}/g, '\n\n'); // Clean up excess newlines

    console.log('[DOCX] First 500 chars of extracted text:', html.substring(0, 500));
    return html.trim();
}

async function extractFromTXT(filePath: string): Promise<string> {
    return await fs.readFile(filePath, 'utf-8');
}

async function extractFromImage(filePath: string, options: ExtractionOptions): Promise<string> {
    const lang = options.language || 'eng+hin';
    console.log(`Running OCR with language: ${lang}`);

    const { data: { text } } = await Tesseract.recognize(filePath, lang, {
        logger: (m) => {
            if (m.status === 'recognizing text') {
                console.log(`OCR Progress: ${Math.round(m.progress * 100)}%`);
            }
        }
    });

    return text;
}

// Check if text contains Hindi characters
function containsHindi(text: string): boolean {
    const hindiPattern = /[\u0900-\u097F]/;
    return hindiPattern.test(text);
}

// Translate Hindi to English
async function translateHindiToEnglish(text: string): Promise<string> {
    const translations: Record<string, string> = {
        // State and Geography
        'उत्तराखंड': 'Uttarakhand',
        'उत्तराखण्ड': 'Uttarakhand',
        'देहरादून': 'Dehradun',
        'नैनीताल': 'Nainital',
        'हरिद्वार': 'Haridwar',
        'ऋषिकेश': 'Rishikesh',
        'मसूरी': 'Mussoorie',
        'चमोली': 'Chamoli',
        'पिथौरागढ़': 'Pithoragarh',
        'अल्मोड़ा': 'Almora',
        'बद्रीनाथ': 'Badrinath',
        'केदारनाथ': 'Kedarnath',
        'गंगोत्री': 'Gangotri',
        'यमुनोत्री': 'Yamunotri',
        'गढ़वाल': 'Garhwal',
        'कुमाऊं': 'Kumaon',
        'कुमाऊँ': 'Kumaon',
        'नंदा देवी': 'Nanda Devi',
        'हिमालय': 'Himalaya',
        'गंगा': 'Ganga',
        'यमुना': 'Yamuna',
        'जिला': 'District',
        'राज्य': 'State',
        'राजधानी': 'Capital',

        // Government Terms
        'मुख्यमंत्री': 'Chief Minister',
        'राज्यपाल': 'Governor',
        'विधानसभा': 'Legislative Assembly',
        'लोकसभा': 'Lok Sabha',
        'राज्यसभा': 'Rajya Sabha',
        'संविधान': 'Constitution',
        'सरकार': 'Government',
        'प्रशासन': 'Administration',

        // Common Words
        'प्रश्न': 'Question',
        'उत्तर': 'Answer',
        'सही': 'Correct',
        'गलत': 'Wrong',
        'और': 'and',
        'या': 'or',
        'में': 'in',
        'पर': 'on',
        'से': 'from',
        'के': 'of',
        'की': 'of',
        'को': 'to',

        // Exam Terms
        'परीक्षा': 'Examination',
        'पाठ्यक्रम': 'Syllabus',
        'विषय': 'Subject',
        'इतिहास': 'History',
        'भूगोल': 'Geography',
        'सामान्य ज्ञान': 'General Knowledge',

        // Culture
        'संस्कृति': 'Culture',
        'परंपरा': 'Tradition',
        'त्योहार': 'Festival',
        'मंदिर': 'Temple',

        // Nature
        'पर्वत': 'Mountain',
        'नदी': 'River',
        'झील': 'Lake',
        'वन': 'Forest',
        'अभयारण्य': 'Sanctuary',

        // Historical
        'आंदोलन': 'Movement',
        'चिपको आंदोलन': 'Chipko Movement',
    };

    let translatedText = text;

    for (const [hindi, english] of Object.entries(translations)) {
        translatedText = translatedText.replace(new RegExp(hindi, 'g'), english);
    }

    // Transliterate remaining Hindi
    if (containsHindi(translatedText)) {
        translatedText = transliterateHindi(translatedText);
    }

    return translatedText;
}

function transliterateHindi(text: string): string {
    const translitMap: Record<string, string> = {
        'अ': 'a', 'आ': 'aa', 'इ': 'i', 'ई': 'ee', 'उ': 'u', 'ऊ': 'oo',
        'ए': 'e', 'ऐ': 'ai', 'ओ': 'o', 'औ': 'au', 'ऋ': 'ri',
        'क': 'k', 'ख': 'kh', 'ग': 'g', 'घ': 'gh', 'ङ': 'ng',
        'च': 'ch', 'छ': 'chh', 'ज': 'j', 'झ': 'jh', 'ञ': 'n',
        'ट': 't', 'ठ': 'th', 'ड': 'd', 'ढ': 'dh', 'ण': 'n',
        'त': 't', 'थ': 'th', 'द': 'd', 'ध': 'dh', 'न': 'n',
        'प': 'p', 'फ': 'ph', 'ब': 'b', 'भ': 'bh', 'म': 'm',
        'य': 'y', 'र': 'r', 'ल': 'l', 'व': 'v', 'श': 'sh',
        'ष': 'sh', 'स': 's', 'ह': 'h',
        'ा': 'a', 'ि': 'i', 'ी': 'ee', 'ु': 'u', 'ू': 'oo',
        'े': 'e', 'ै': 'ai', 'ो': 'o', 'ौ': 'au',
        '्': '', 'ं': 'n', 'ः': 'h', 'ँ': 'n',
        '०': '0', '१': '1', '२': '2', '३': '3', '४': '4',
        '५': '5', '६': '6', '७': '7', '८': '8', '९': '9',
        '।': '.', '॥': '.'
    };

    let result = '';
    for (const char of text) {
        result += translitMap[char] || char;
    }
    return result;
}

export async function extractMetadata(filePath: string, mimeType: string): Promise<any> {
    const stats = await fs.stat(filePath);

    return {
        size: stats.size,
        created: stats.birthtime,
        modified: stats.mtime,
        type: mimeType
    };
}
