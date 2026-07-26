import { Router } from 'express';
import fs from 'fs';
import { documents, persistDocuments } from './upload.js';
import { authMiddleware } from '../middleware/auth.js';

const router = Router();

// Protect all document routes
router.use(authMiddleware);

// Get all documents for authenticated user
router.get('/', (req: any, res) => {
    const docs = Array.from(documents.values())
        .filter(doc => doc.userId === req.userId)
        .map(doc => ({
            id: doc.id,
            fileName: doc.fileName,
            fileType: doc.fileType,
            topicsCount: (doc.topics || []).length,
            definitionsCount: (doc.definitions || []).length,
            keyTermsCount: (doc.keyTerms || []).length,
            createdAt: doc.createdAt
        }));

    res.json(docs);
});

// Get single document
router.get('/:id', (req: any, res) => {
    const doc = documents.get(req.params.id);

    if (!doc || doc.userId !== req.userId) {
        return res.status(404).json({ error: 'Document not found' });
    }

    res.json(doc);
});

// Get document content organized by topics
router.get('/:id/topics', (req: any, res) => {
    const doc = documents.get(req.params.id);

    if (!doc || doc.userId !== req.userId) {
        return res.status(404).json({ error: 'Document not found' });
    }

    res.json({
        documentId: doc.id,
        fileName: doc.fileName,
        topics: doc.topics
    });
});

// Search within document
router.get('/:id/search', (req: any, res) => {
    const { query } = req.query;
    const doc = documents.get(req.params.id);

    if (!doc || doc.userId !== req.userId) {
        return res.status(404).json({ error: 'Document not found' });
    }

    if (!query || typeof query !== 'string') {
        return res.status(400).json({ error: 'Search query required' });
    }

    const searchTerm = query.toLowerCase();
    const results = {
        inTopics: (doc.topics || []).filter((t: any) =>
            t.title.toLowerCase().includes(searchTerm) ||
            t.content.toLowerCase().includes(searchTerm)
        ),
        inDefinitions: (doc.definitions || []).filter((d: any) =>
            d.term.toLowerCase().includes(searchTerm) ||
            d.definition.toLowerCase().includes(searchTerm)
        ),
        inKeyTerms: (doc.keyTerms || []).filter((k: string) =>
            k.toLowerCase().includes(searchTerm)
        )
    };

    res.json(results);
});

// Delete document
router.delete('/:id', (req: any, res) => {
    const doc = documents.get(req.params.id);
    if (!doc || doc.userId !== req.userId) {
        return res.status(404).json({ error: 'Document not found' });
    }

    const deleted = documents.delete(req.params.id);

    if (!deleted) {
        return res.status(404).json({ error: 'Document not found' });
    }

    // Also delete the physical file if it exists
    if (doc.filePath && fs.existsSync(doc.filePath)) {
        try { fs.unlinkSync(doc.filePath); } catch (_) {}
    }

    persistDocuments();
    res.json({ success: true, message: 'Document deleted' });
});

// Serve document file for viewing (streams the raw file)
router.get('/:id/file', (req: any, res) => {
    const doc = documents.get(req.params.id);

    if (!doc || doc.userId !== req.userId) {
        return res.status(404).json({ error: 'Document not found' });
    }

    if (!doc.filePath || !fs.existsSync(doc.filePath)) {
        return res.status(404).json({ error: 'File not found on disk' });
    }

    const mimeTypeMap: Record<string, string> = {
        'application/pdf': 'application/pdf',
        'application/vnd.openxmlformats-officedocument.wordprocessingml.document':
            'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
        'text/plain': 'text/plain; charset=utf-8',
        'image/png': 'image/png',
        'image/jpeg': 'image/jpeg',
        'image/jpg': 'image/jpeg',
        'image/webp': 'image/webp',
    };

    const contentType = mimeTypeMap[doc.fileType] || 'application/octet-stream';
    const stat = fs.statSync(doc.filePath);

    res.setHeader('Content-Type', contentType);
    res.setHeader('Content-Length', stat.size);
    res.setHeader('Cache-Control', 'private, max-age=3600');

    // Inline display for PDF and images and text
    const isInline = doc.fileType === 'application/pdf'
        || doc.fileType.startsWith('image/')
        || doc.fileType === 'text/plain';
    res.setHeader(
        'Content-Disposition',
        isInline
            ? `inline; filename="${encodeURIComponent(doc.fileName)}"`
            : `attachment; filename="${encodeURIComponent(doc.fileName)}"`
    );
    res.setHeader('Accept-Ranges', 'bytes');

    const stream = fs.createReadStream(doc.filePath);
    stream.pipe(res);
    stream.on('error', (err) => {
        console.error('File stream error:', err);
        if (!res.headersSent) res.status(500).json({ error: 'Error reading file' });
    });
});

// Get raw text content (for DOCX/TXT in-browser viewer)
router.get('/:id/raw-text', (req: any, res) => {
    const doc = documents.get(req.params.id);

    if (!doc || doc.userId !== req.userId) {
        return res.status(404).json({ error: 'Document not found' });
    }

    res.json({
        fileName: doc.fileName,
        fileType: doc.fileType,
        rawText: (doc as any).rawText || ''
    });
});

export { router as documentsRouter };
