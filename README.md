# ExamMaster - Exam Preparation Application

A comprehensive, high-quality exam preparation application with intelligent document processing, smart mock test generation, and beautiful UI/UX.

## Features

- **Document Upload**: Upload PDFs, DOCX, TXT, and images
- **Intelligent Text Extraction**: OCR for images, text parsing for documents
- **NLP Processing**: Automatic topic identification, key term extraction
- **Smart Mock Test Generation**: Generate tests from your documents
- **Official Exam Questions**: Practice with real questions from UPSC, JEE, NEET, GRE, SAT
- **Performance Analytics**: Detailed score breakdown and insights
- **Flashcards**: Auto-generated flashcards for quick revision
- **Dark/Light Mode**: Beautiful UI with theme support

## Tech Stack

### Frontend
- React 18 + Vite + TypeScript
- Tailwind CSS + Radix UI
- Zustand (State Management)
- Recharts (Analytics)
- Framer Motion (Animations)

### Backend
- Node.js + Express.js
- Multer (File Upload)
- pdfjs-dist (PDF Processing)
- mammoth (DOCX Processing)
- Tesseract.js (OCR)
- compromise.js (NLP)

## Getting Started

### Prerequisites
- Node.js 18+
- npm or yarn

### Installation

1. Install all dependencies:
```bash
cd exammaster
npm run install:all
```

2. Start the development server:
```bash
npm run dev
```

3. Open http://localhost:3000 in your browser

### Individual Commands

```bash
# Install root dependencies
npm install

# Install client dependencies
cd client && npm install

# Install server dependencies
cd server && npm install

# Run client only
cd client && npm run dev

# Run server only
cd server && npm run dev
```

## Project Structure

```
exammaster/
├── client/                 # React Frontend
│   ├── src/
│   │   ├── components/    # Reusable components
│   │   ├── pages/         # Page components
│   │   ├── stores/        # Zustand stores
│   │   ├── lib/           # Utilities
│   │   └── App.tsx        # Main app
│   └── package.json
│
├── server/                 # Express Backend
│   ├── src/
│   │   ├── routes/        # API routes
│   │   ├── services/      # Business logic
│   │   └── types/         # TypeScript types
│   ├── uploads/           # Uploaded files
│   └── package.json
│
└── package.json           # Root package
```

## API Endpoints

### Upload
- `POST /api/upload/single` - Upload single file
- `POST /api/upload/multiple` - Upload multiple files

### Documents
- `GET /api/documents` - List all documents
- `GET /api/documents/:id` - Get document details
- `DELETE /api/documents/:id` - Delete document

### Tests
- `POST /api/tests/generate` - Generate mock test
- `GET /api/tests/:id` - Get test
- `POST /api/tests/:id/submit` - Submit test answers

### Official Questions
- `GET /api/official-questions/exams` - List exam types
- `GET /api/official-questions/by-exam/:type` - Get questions by exam

### Flashcards
- `POST /api/flashcards/generate/:docId` - Generate flashcards
- `GET /api/flashcards` - List flashcards

## License

MIT
