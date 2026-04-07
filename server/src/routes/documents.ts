import { Router } from 'express';
import path from 'path';
import fs from 'fs';
import { documents } from './upload.js';

const router = Router();

// Get all documents
router.get('/', (req, res) => {
    const docs = Array.from(documents.values()).map(doc => ({
        id: doc.id,
        fileName: doc.fileName,
        fileType: doc.fileType,
        topicsCount: doc.topics.length,
        definitionsCount: doc.definitions.length,
        keyTermsCount: doc.keyTerms.length,
        createdAt: doc.createdAt
    }));

    res.json(docs);
});

// Get single document
router.get('/:id', (req, res) => {
    const doc = documents.get(req.params.id);

    if (!doc) {
        return res.status(404).json({ error: 'Document not found' });
    }

    res.json(doc);
});

// Get document content organized by topics
router.get('/:id/topics', (req, res) => {
    const doc = documents.get(req.params.id);

    if (!doc) {
        return res.status(404).json({ error: 'Document not found' });
    }

    res.json({
        documentId: doc.id,
        fileName: doc.fileName,
        topics: doc.topics
    });
});

// Search within document
router.get('/:id/search', (req, res) => {
    const { query } = req.query;
    const doc = documents.get(req.params.id);

    if (!doc) {
        return res.status(404).json({ error: 'Document not found' });
    }

    if (!query || typeof query !== 'string') {
        return res.status(400).json({ error: 'Search query required' });
    }

    const searchTerm = query.toLowerCase();
    const results = {
        inTopics: doc.topics.filter(t =>
            t.title.toLowerCase().includes(searchTerm) ||
            t.content.toLowerCase().includes(searchTerm)
        ),
        inDefinitions: doc.definitions.filter(d =>
            d.term.toLowerCase().includes(searchTerm) ||
            d.definition.toLowerCase().includes(searchTerm)
        ),
        inKeyTerms: doc.keyTerms.filter(k =>
            k.toLowerCase().includes(searchTerm)
        )
    };

    res.json(results);
});

// Delete document
router.delete('/:id', (req, res) => {
    const deleted = documents.delete(req.params.id);

    if (!deleted) {
        return res.status(404).json({ error: 'Document not found' });
    }

    res.json({ success: true, message: 'Document deleted' });
});

// Serve document file for viewing
router.get('/:id/file', (req, res) => {
    const doc = documents.get(req.params.id);

    if (!doc) {
        return res.status(404).json({ error: 'Document not found' });
    }

    if (!doc.filePath || !fs.existsSync(doc.filePath)) {
        return res.status(404).json({ error: 'File not found on disk' });
    }

    // Set content type based on file type
    if (doc.fileType === 'application/pdf') {
        res.setHeader('Content-Type', 'application/pdf');
    } else if (doc.fileType === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document') {
        res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document');
    }

    res.sendFile(doc.filePath);
});

export { router as documentsRouter };
