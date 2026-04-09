import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { useEffect } from 'react';
import { useThemeStore } from './stores/themeStore';
import Layout from './components/layout/Layout';
import Dashboard from './pages/Dashboard';
import Upload from './pages/Upload';
import TestInterface from './pages/TestInterface';
import Results from './pages/Results';
import QuestionBank from './pages/QuestionBank';
import Flashcards from './pages/Flashcards';
import OfficialExams from './pages/OfficialExams';
import QuestionImport from './pages/QuestionImport';
import PDFImport from './pages/PDFImport';
import AIReport from './pages/AIReport';
import StudentCorner from './pages/StudentCorner';
import SmartMockTests from './pages/SmartMockTests';

import { useAuthStore } from './stores/authStore';
import Login from './components/auth/Login';

function App() {
  const { theme } = useThemeStore();
  const { isAuthenticated } = useAuthStore();

  useEffect(() => {
    const root = window.document.documentElement;
    root.classList.remove('light', 'dark');

    if (theme === 'system') {
      const systemTheme = window.matchMedia('(prefers-color-scheme: dark)').matches
        ? 'dark'
        : 'light';
      root.classList.add(systemTheme);
    } else {
      root.classList.add(theme);
    }
  }, [theme]);

  if (!isAuthenticated) {
    return <Login />;
  }

  return (
    <Router>
      <Layout>
        <Routes>
          <Route path="/" element={<Dashboard />} />
          <Route path="/upload" element={<Upload />} />
          <Route path="/test/:testId" element={<TestInterface />} />
          <Route path="/results/:resultId" element={<Results />} />
          <Route path="/question-bank" element={<QuestionBank />} />
          <Route path="/flashcards" element={<Flashcards />} />
          <Route path="/official-exams" element={<OfficialExams />} />
          <Route path="/import" element={<QuestionImport />} />
          <Route path="/import-pdf" element={<PDFImport />} />
          <Route path="/ai-report" element={<AIReport />} />
          <Route path="/student-corner" element={<StudentCorner />} />
          <Route path="/smart-mock-tests" element={<SmartMockTests />} />
        </Routes>
      </Layout>
    </Router>
  );
}

export default App;
