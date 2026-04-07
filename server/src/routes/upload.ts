import { Router } from 'express';
import multer from 'multer';
import path from 'path';
import { v4 as uuidv4 } from 'uuid';
import { extractText, ExtractionOptions } from '../services/extraction.js';
import { processWithNLP } from '../services/nlp.js';
import { ExtractedContent } from '../types/index.js';

const router = Router();

// In-memory storage for documents (in production, use a database)
export const documents: Map<string, ExtractedContent> = new Map();

// Configure multer for file uploads
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, path.join(process.cwd(), 'uploads'));
    },
    filename: (req, file, cb) => {
        const uniqueName = `${uuidv4()}-${file.originalname}`;
        cb(null, uniqueName);
    }
});

const fileFilter = (req: Express.Request, file: Express.Multer.File, cb: multer.FileFilterCallback) => {
    const allowedTypes = [
        'application/pdf',
        'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
        'text/plain',
        'image/png',
        'image/jpeg',
        'image/jpg',
        'image/webp'
    ];

    if (allowedTypes.includes(file.mimetype)) {
        cb(null, true);
    } else {
        cb(new Error(`File type ${file.mimetype} not supported`));
    }
};

const upload = multer({
    storage,
    fileFilter,
    limits: { fileSize: 500 * 1024 * 1024 } // 500MB limit
});

// Upload single file
router.post('/single', upload.single('file'), async (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({ error: 'No file uploaded' });
        }

        const filePath = req.file.path;
        const fileType = req.file.mimetype;
        const fileName = req.file.originalname;

        // Extract text from file with Hindi support and auto-translation
        const extractionOptions: ExtractionOptions = {
            language: 'eng+hin',
            translateToEnglish: true
        };
        const rawText = await extractText(filePath, fileType, extractionOptions);

        // Process with NLP
        const nlpResult = await processWithNLP(rawText);

        const docId = uuidv4();
        const extractedContent: ExtractedContent = {
            id: docId,
            fileName,
            fileType,
            filePath,
            rawText,
            topics: nlpResult.topics,
            definitions: nlpResult.definitions,
            keyTerms: nlpResult.keyTerms,
            formulas: nlpResult.formulas,
            questionableContent: nlpResult.questionableContent,
            extractedQuestions: nlpResult.extractedQuestions,
            createdAt: new Date()
        };

        documents.set(docId, extractedContent);

        // Debug logging
        console.log(`Document "${fileName}" processed:`);
        console.log(`  - Extracted questions: ${nlpResult.extractedQuestions.length}`);
        console.log(`  - Definitions: ${nlpResult.definitions.length}`);
        console.log(`  - Topics: ${nlpResult.topics.length}`);
        if (nlpResult.extractedQuestions.length > 0) {
            console.log('  - Sample question:', nlpResult.extractedQuestions[0]?.question?.substring(0, 80));
        }

        res.json({
            success: true,
            documentId: docId,
            fileName,
            preview: {
                topics: nlpResult.topics.length,
                definitions: nlpResult.definitions.length,
                keyTerms: nlpResult.keyTerms.length,
                extractedQuestions: nlpResult.extractedQuestions.length,
                textLength: rawText.length
            }
        });
    } catch (error) {
        console.error('Upload error:', error);
        res.status(500).json({ error: (error as Error).message });
    }
});

// Upload multiple files
router.post('/multiple', upload.array('files', 10), async (req, res) => {
    try {
        const files = req.files as Express.Multer.File[];
        if (!files || files.length === 0) {
            return res.status(400).json({ error: 'No files uploaded' });
        }

        const results = await Promise.all(
            files.map(async (file) => {
                try {
                    const extractionOptions: ExtractionOptions = {
                        language: 'eng+hin',
                        translateToEnglish: true
                    };
                    const rawText = await extractText(file.path, file.mimetype, extractionOptions);
                    const nlpResult = await processWithNLP(rawText);

                    const docId = uuidv4();
                    const extractedContent: ExtractedContent = {
                        id: docId,
                        fileName: file.originalname,
                        fileType: file.mimetype,
                        filePath: file.path,
                        rawText,
                        topics: nlpResult.topics,
                        definitions: nlpResult.definitions,
                        keyTerms: nlpResult.keyTerms,
                        formulas: nlpResult.formulas,
                        questionableContent: nlpResult.questionableContent,
                        extractedQuestions: nlpResult.extractedQuestions,
                        createdAt: new Date()
                    };

                    documents.set(docId, extractedContent);

                    return {
                        success: true,
                        documentId: docId,
                        fileName: file.originalname,
                        topics: nlpResult.topics.length,
                        definitions: nlpResult.definitions.length
                    };
                } catch (err) {
                    return {
                        success: false,
                        fileName: file.originalname,
                        error: (err as Error).message
                    };
                }
            })
        );

        res.json({ results });
    } catch (error) {
        res.status(500).json({ error: (error as Error).message });
    }
});

export { router as uploadRouter };
