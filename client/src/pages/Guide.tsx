import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
    Compass,
    Home,
    FileQuestion,
    Brain,
    GraduationCap,
    Layers,
    Sparkles,
    ChevronRight,
    HelpCircle,
    Activity
} from 'lucide-react';
import { cn } from '../lib/utils';

interface GuideSection {
    id: string;
    title: string;
    description: string;
    icon: React.ComponentType<any>;
    color: string;
    bgColor: string;
    gradient: string;
    steps: {
        title: string;
        details: string;
        highlight?: string;
    }[];
    tips: string[];
}

export default function Guide() {
    const [activeSection, setActiveSection] = useState<string>('tour');

    const sections: GuideSection[] = [
        {
            id: 'tour',
            title: 'Welcome Tour & General Setup',
            description: 'Learn how to navigate your study dashboard, find hidden features, and change the app colors to fit your style.',
            icon: Compass,
            color: 'text-violet-500 dark:text-violet-400',
            bgColor: 'bg-violet-500/10',
            gradient: 'from-violet-600/20 to-purple-500/20 border-violet-500/30',
            steps: [
                {
                    title: 'Your Study Homepage',
                    details: 'Welcome to your main control center! The dashboard keeps a live count of your total practice questions, mock tests attempted, study goals, and how many hours you have spent preparing.',
                    highlight: 'Tip: You can start dry practice runs instantly from the command box at the top.'
                },
                {
                    title: 'Pick Your Theme Color',
                    details: 'Studying late at night or in the afternoon? Tap your profile picture on the top right to open settings and select from 10 beautiful color schemes like "Tokyo Night", "Dracula", or a clean "Alabaster Light" to make reading easy on your eyes.',
                    highlight: 'Themes apply instantly across all pages and support system automatic settings.'
                },
                {
                    title: 'Finding Your Way Around',
                    details: 'Use the horizontal menu bar at the top to jump between pages. Clicking the "More" button reveals additional tools such as Official Exams, study keycards, and PDF question loaders.',
                    highlight: 'On phones, the navigation hides behind a standard three-line menu icon on the top right for a clutter-free display.'
                }
            ],
            tips: [
                'Set the theme to "System Default (OS)" if you want the app to automatically match your phone or computer preferences.',
                'Use the Sun/Moon button next to your avatar to quickly flip between light and dark modes.'
            ]
        },
        {
            id: 'dashboard',
            title: 'Setting Goals (Dream Corner)',
            description: 'Configure your target exam dates, list revision topics, and track daily milestones to stay on schedule.',
            icon: Home,
            color: 'text-blue-500 dark:text-blue-400',
            bgColor: 'bg-blue-500/10',
            gradient: 'from-blue-600/20 to-indigo-500/20 border-blue-500/30',
            steps: [
                {
                    title: 'Enter Your Target Exam Details',
                    details: 'Open your Profile menu from the top right and click "Your Dream Corner". Here you can set your target exam name, expected roll number, target score, and the official exam date.',
                    highlight: 'Features a live countdown timer showing exactly how many days you have left to prepare.'
                },
                {
                    title: 'Create Your Study Milestones',
                    details: 'Inside the Dream Corner page, list smaller, weekly tasks like "Practice 50 Math Questions" or "Revise Modern History". Check them off as you complete them.',
                    highlight: 'A visual progress bar increases as you check off items, keeping you motivated.'
                },
                {
                    title: 'Review Your Daily Progress Feed',
                    details: 'Scroll to the bottom of your dashboard to view your recent activity. It logs exactly when you added new study materials or submitted a test, so you can review your history.',
                    highlight: 'Helps you check if your daily practice has been consistent.'
                }
            ],
            tips: [
                'Break down large syllabus chapters into 3 smaller goals inside your milestones list.',
                'Use the target exam date as a helpful reminder whenever you feel unmotivated.'
            ]
        },
        {
            id: 'questions',
            title: 'Question Bank & Document Annotator',
            description: 'Manage practice sheets, paste notes to convert to quizzes, or open uploaded PDFs with the interactive Pen/Marker tool.',
            icon: FileQuestion,
            color: 'text-emerald-500 dark:text-emerald-400',
            bgColor: 'bg-emerald-500/10',
            gradient: 'from-emerald-600/20 to-teal-500/20 border-emerald-500/30',
            steps: [
                {
                    title: 'Search & Filter Practice Sheets',
                    details: 'Go to the "Question Bank" page to view all questions loaded on your device. Filter them by year, subject, difficulty, or solved status, and click on any question for detailed explanations.',
                    highlight: 'Delete outdated or incorrect questions using the trash icon.'
                },
                {
                    title: 'In-App PDF Viewer & Pen/Marker Tool',
                    details: 'Inside the Upload / Documents page, open any uploaded PDF or document. Use the integrated Pen / Marker tool to draw, tick, underline, and practice directly on the PDF pages in real time.',
                    highlight: 'Perfect for active practice and marking key points right on your PDF materials.'
                },
                {
                    title: 'Create Quizzes from Text Notes',
                    details: 'Paste any text, notes, or chapter paragraphs in the Upload section. The application automatically extracts and formats them into multiple-choice quizzes.',
                    highlight: 'Ideal for converting digital notes into custom practice questions.'
                },
                {
                    title: 'Option Elimination Technique',
                    details: 'Hover over options in questions and click the red "X" to strike out choices. This physically narrows down your options and tracks your elimination strategy.',
                    highlight: 'Striking choices improves educated guessing accuracy.'
                }
            ],
            tips: [
                'Use the Pen/Marker tool in the Document Viewer to tick correct options directly on past paper PDFs.',
                'Filter by "Unsolved" in the Question Bank to practice fresh questions.',
                'Write "Answer: A/B/C/D" clearly when pasting text to auto-generate answer keys accurately.'
            ]
        },
        {
            id: 'elimination',
            title: 'Option Elimination Strategy',
            description: 'Learn how to cross out wrong options systematically, select answers with better probability, and review guess choices metrics.',
            icon: Sparkles,
            color: 'text-amber-500 dark:text-amber-400',
            bgColor: 'bg-amber-500/10',
            gradient: 'from-amber-600/20 to-orange-500/20 border-amber-500/30',
            steps: [
                {
                    title: 'Hover and Cross Out Options',
                    details: 'When practicing questions in the Question Bank, hover over any option card. Click the red "X" icon that appears at the right corner of the option card to strike it through.',
                    highlight: 'Striking off options visually reduces noise and lets your brain focus heavily on remaining choices.'
                },
                {
                    title: 'Take Educated Guesses',
                    details: 'Eliminating 1 or 2 options increases your probability of guessing the correct answer from 25% to 50% or 100%. After crossing choices, click your chosen option and select "Check Answer".',
                    highlight: 'The system automatically links your answer submission with your crossed choices.'
                },
                {
                    title: 'Check Elimination Analytics',
                    details: 'Open the "AI Report" page and switch to the "Elimination Analytics" tab. The system updates live data showing your guestimate success rate, saved margin totals (by skipping after crossing), and correctness ratios.',
                    highlight: 'Refreshes automatically whenever you click on the tab, with no page reload required.'
                }
            ],
            tips: [
                'Try to cross off at least 2 options before guessing to push your probability to 50%.',
                'If you eliminate options but are unsure of the final two, you can leave it skipped. It will be recorded as "Avoided Penalty" in your reports.',
                'Use "Reset Choices" under any option box to clear the exclusions and start fresh.'
            ]
        },
        {
            id: 'testing',
            title: 'Mock Simulator & Past Papers',
            description: 'Set up timed tests for specific subject categories or take full-length real SSC papers.',
            icon: GraduationCap,
            color: 'text-amber-500 dark:text-amber-400',
            bgColor: 'bg-amber-500/10',
            gradient: 'from-amber-600/20 to-orange-500/20 border-amber-500/30',
            steps: [
                {
                    title: 'Generate Custom Practice Tests',
                    details: 'Want to focus only on specific weak topics? Go to "Smart Mock Tests", choose your subjects, select the number of questions, set a timer, and click start.',
                    highlight: 'The app selects fresh, random questions based on your requirements.'
                },
                {
                    title: 'Attempt Real Exam Papers',
                    details: 'Go to the "Official Exams" tab to practice actual past-year SSC CGL/CHSL papers. It loads a full exam simulator featuring a running clock, sectional navigation tabs, and answer checkers.',
                    highlight: 'Features a bookmark flag to save difficult questions to review at the end.'
                },
                {
                    title: 'Analyze Your Mistakes & Scores',
                    details: 'When you submit a test, you get a full score report showing your correct answers, speed, and accuracy. You can view step-by-step explanations for the questions you got wrong.',
                    highlight: 'Shows question-by-question explanations immediately.'
                }
            ],
            tips: [
                'Do not worry about completing; if the simulation timer runs out, your test submits automatically.',
                'Revise from the results panel to understand why an option was incorrect.'
            ]
        },
        {
            id: 'flashcards',
            title: 'Visual Infographics & Study Notes',
            description: 'Revise with interactive visual diagrams, zoom controls, and comprehensive Uttarakhand History & Geography notes.',
            icon: Layers,
            color: 'text-pink-500 dark:text-pink-400',
            bgColor: 'bg-pink-500/10',
            gradient: 'from-pink-605/20 to-rose-500/20 border-pink-500/30',
            steps: [
                {
                    title: 'Browse Visual Topic Cards',
                    details: 'Go to the "Flashcards" page, select a subject, and use the Topic Dropdown to load studying infographics (e.g. Rivers, Climate, Historical Eras).',
                    highlight: 'Subfolders added to assets/ reflect automatically in the dropdown.'
                },
                {
                    title: 'Zoom In on Maps & Diagrams',
                    details: 'Hover your mouse over any infographic card and scroll your wheel up/down to zoom in (up to 300%) or out for clear inspection of small text and keys.',
                    highlight: 'Helps read small legends and detailed maps effortlessly.'
                },
                {
                    title: 'Uttarakhand Study Notes Reader',
                    details: 'Switch to the "Notes" tab inside Flashcards for structured notes on Uttarakhand Geography and History. Experience custom themed dashboards (earthy-blue rivers for Geography, warm golden emblems for History).',
                    highlight: 'Features direct topic completion tracking, contextual emojis, and clean bulleted layouts.'
                },
                {
                    title: 'Track Completion',
                    details: 'Mark visual topic cards as Learned / Needs Revision, and check off completed Uttarakhand chapters in the Notes tab. Progress is tracked automatically at the header.',
                    highlight: 'Use Left/Right arrow keys for keyboard navigation across flashcard topics.'
                }
            ],
            tips: [
                'Use the Notes section to check off completed chapters before attempting mock tests.',
                'Zoom in on historical timeline cards to review dates clearly.'
            ]
        },
        {
            id: 'analytics',
            title: 'AI Diagnostic Reports & Interactive Voice',
            description: 'Check AI performance summaries, collapsible topic breakdowns, and interactive male voice feedback tooltips.',
            icon: Brain,
            color: 'text-cyan-500 dark:text-cyan-400',
            bgColor: 'bg-cyan-500/10',
            gradient: 'from-cyan-600/20 to-blue-500/20 border-cyan-500/30',
            steps: [
                {
                    title: 'Interactive Male Voice Feedback Tooltips',
                    details: 'Hover over practice statistics cards and action buttons in the AI Report to trigger playful, context-aware male voice prompts (e.g., Ashneer Grover meme voice "Padh le bhai!", "Keep going bhai!", and double-confirmation prompt "Pakka delete kar doon bhai?").',
                    highlight: 'Uses browser speech synthesis with deep male pitch tuning for an engaging study experience.'
                },
                {
                    title: 'Collapsible Topics Breakdown',
                    details: 'View subject-wise progress under the AI Report. Topic breakdowns are organized in expandable accordion sections showing topic count, accuracy percentages, and focus recommendations for your active subject.',
                    highlight: 'Click any subject to filter topics specifically for that domain.'
                },
                {
                    title: 'Elimination Strategy Analytics',
                    details: 'Switch to the "Elimination Analytics" tab inside the AI Report to evaluate your option cross-out performance, including guestimate accuracy, total attempted vs skipped questions, and score margin saved.',
                    highlight: 'Updates automatically without needing page reloads.'
                },

            ],
            tips: [
                'Hover over practice overview cards to listen to motivating voice tooltips.',
                'Use the collapsible History Topics Breakdown to focus on weak subject chapters first.'
            ]
        },
        {
            id: 'relax',
            title: 'Relax Mode (Mindfulness & Devotional Songs)',
            description: 'Unwind and recharge with authentic calming sounds, voice-guided meditations, and soothing devotional sitar and flute tracks.',
            icon: Sparkles,
            color: 'text-amber-500 dark:text-amber-400',
            bgColor: 'bg-amber-500/10',
            gradient: 'from-amber-600/20 to-orange-500/20 border-amber-500/30',
            steps: [
                {
                    title: 'Access Relax Mode via Chatbot',
                    details: 'Simply open the study chatbot ("Aur Bhai") and type requests like "relax", "meditate", "play music", or click chatbot Relax Mode links to instantly enter the Zen Zone.',
                    highlight: 'Perfect for quick, structured breaks to restore cognitive agility.'
                },
                {
                    title: 'Choose Soundscapes & Guided Meditation',
                    details: 'Listen to pure Zen Frequencies (528Hz Solfeggio, Alpha waves), Voice-Guided Meditations (authentic Yoga Nidra sessions and body scans), or Pt. Pannalal Ghosh\'s peaceful Bansuri flute recitals. The "Detached Forest Reflection" track automatically layers realistic synthesized background rain.',
                    highlight: 'Use the Offline Trigger Synth button on Zen Frequencies if you want key soundwaves offline.'
                },
                {
                    title: 'Listen to Devotional Songs & Meditative Ragas',
                    details: 'Open the "Devotional Songs" tab to stream peaceful traditional sitar recitals and flutes, including a dedicated 2:29 curated focus start of Shiv Kailash (Live Sitar for Mental Health) by Rishab Rikhiram Sharma.',
                    highlight: 'Listen inline directly using the premium embedded video layout.'
                }
            ],
            tips: [
                'Use the 528Hz focus frequency during breaks to soothe mental fatigue and reduce stress.',
                'The Offline Synth status is strictly exclusive to Zen Frequencies (soothing tones and beats) to avoid noisy overlap on voice-guided files.',
                'Total Relax Mode time spent is stored on your profile card, so you can track your mental recovery log.'
            ]
        }
    ];

    const currentSection = sections.find(s => s.id === activeSection) || sections[0];
    const IconComponent = currentSection.icon;

    return (
        <div className="space-y-8 max-w-6xl mx-auto px-1 sm:px-4 py-4">
            {/* Header Title */}
            <div className="text-center md:text-left space-y-2">
                <div className="flex items-center justify-center md:justify-start gap-3">
                    <div className="w-10 h-10 rounded-2xl bg-primary/10 border border-primary/20 flex items-center justify-center text-primary shadow-sm">
                        <HelpCircle className="w-5 h-5" />
                    </div>
                    <span className="text-[10px] font-black uppercase text-primary tracking-widest bg-primary/10 border border-primary/20 px-2.5 py-1 rounded-lg">Handbook</span>
                </div>
                <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-foreground mt-2">
                    User Guide & Getting Started
                </h1>
                <p className="text-sm sm:text-base text-muted-foreground max-w-2xl font-medium">
                    Welcome to your study manual. Here is a simple explanation of how to track targets, upload notes, customize theme colors, and check your mock test progress!
                </p>
            </div>

            {/* Layout Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 items-start">

                {/* Left Side Navigation (Desktop Navigation Panel) */}
                <div className="lg:col-span-1 space-y-2.5">
                    <p className="text-[10px] font-black uppercase text-muted-foreground tracking-[0.2em] ml-2 hidden lg:block">Handbook Chapters</p>

                    {/* Mobile Selector */}
                    <div className="lg:hidden relative">
                        <select
                            value={activeSection}
                            onChange={(e) => setActiveSection(e.target.value)}
                            className="w-full bg-card border border-border/80 text-foreground text-sm font-bold p-3.5 rounded-2xl appearance-none cursor-pointer focus:outline-none"
                        >
                            {sections.map((sect) => (
                                <option key={sect.id} value={sect.id}>
                                    {sect.title}
                                </option>
                            ))}
                        </select>
                    </div>

                    {/* Desktop Sidebar Buttons */}
                    <div className="hidden lg:flex flex-col gap-2">
                        {sections.map((sect) => {
                            const SectIcon = sect.icon;
                            const isActive = activeSection === sect.id;
                            return (
                                <button
                                    key={sect.id}
                                    onClick={() => setActiveSection(sect.id)}
                                    className={cn(
                                        "flex items-center gap-3.5 p-4 rounded-2xl border text-left transition-all active:scale-[0.98] duration-200",
                                        isActive
                                            ? "bg-primary/10 border-primary text-foreground shadow-sm ring-1 ring-primary/25"
                                            : "bg-card border-border/50 text-muted-foreground hover:bg-muted/30 hover:text-foreground"
                                    )}
                                >
                                    <div className={cn("w-8 h-8 rounded-xl flex items-center justify-center shrink-0", sect.bgColor, sect.color)}>
                                        <SectIcon className="w-4 h-4" />
                                    </div>
                                    <div className="min-w-0 flex-1">
                                        <p className="text-[13px] font-bold tracking-tight">{sect.title}</p>
                                    </div>
                                    <ChevronRight className={cn("w-3.5 h-3.5 transition-transform", isActive ? "text-primary translate-x-0.5" : "text-muted-foreground/50")} />
                                </button>
                            );
                        })}
                    </div>
                </div>

                {/* Right Side Content Area */}
                <div className="lg:col-span-3">
                    <AnimatePresence mode="wait">
                        <motion.div
                            key={activeSection}
                            initial={{ opacity: 0, y: 15 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -15 }}
                            transition={{ duration: 0.25 }}
                            className="space-y-6"
                        >
                            {/* Section Hero Banner */}
                            <div className={cn(
                                "p-6 sm:p-8 rounded-[2.5rem] border bg-gradient-to-br shadow-inner relative overflow-hidden",
                                currentSection.gradient
                            )}>
                                <div className="absolute top-0 right-0 p-6 opacity-[0.03] dark:opacity-[0.05] pointer-events-none scale-150">
                                    <IconComponent className="w-48 h-48" />
                                </div>

                                <div className="space-y-3 relative z-10">
                                    <div className={cn("w-12 h-12 rounded-2xl flex items-center justify-center", currentSection.bgColor, currentSection.color)}>
                                        <IconComponent className="w-6 h-6" />
                                    </div>
                                    <h2 className="text-2xl font-black tracking-tight text-foreground">{currentSection.title}</h2>
                                    <p className="text-sm font-semibold text-foreground/80 max-w-xl leading-relaxed">{currentSection.description}</p>
                                </div>
                            </div>

                            {/* Section Steps & Features */}
                            <div className="space-y-4">
                                <h3 className="text-xs font-black uppercase text-muted-foreground tracking-[0.2em] ml-2">How It Works</h3>
                                <div className="grid grid-cols-1 gap-4">
                                    {currentSection.steps.map((st, i) => (
                                        <div
                                            key={i}
                                            className="p-5 sm:p-6 bg-card border border-border/60 rounded-3xl space-y-3 group hover:border-primary/20 transition-all card-hover"
                                        >
                                            <div className="flex items-center gap-3">
                                                <div className="w-7 h-7 rounded-lg bg-primary/10 border border-primary/20 flex items-center justify-center text-xs font-black text-primary">
                                                    {i + 1}
                                                </div>
                                                <h4 className="text-base font-bold tracking-tight text-foreground group-hover:text-primary transition-colors">
                                                    {st.title}
                                                </h4>
                                            </div>
                                            <p className="text-sm font-medium text-muted-foreground leading-relaxed pl-10">
                                                {st.details}
                                            </p>
                                            {st.highlight && (
                                                <div className="flex items-start sm:items-center gap-2 bg-muted/30 border border-border/30 px-3.5 py-2.5 rounded-2xl text-xs font-semibold text-foreground ml-10">
                                                    <Sparkles className="w-4 h-4 text-amber-500 shrink-0 mt-0.5 sm:mt-0" />
                                                    <span>{st.highlight}</span>
                                                </div>
                                            )}
                                        </div>
                                    ))}
                                </div>
                            </div>

                            {/* Revision Tips Panel */}
                            <div className="p-6 bg-gradient-to-r from-violet-650/5 via-primary/5 to-transparent border border-primary/10 rounded-3xl space-y-3">
                                <h4 className="text-xs font-black uppercase text-primary tracking-[0.2em] flex items-center gap-2">
                                    <Activity className="w-3.5 h-3.5" /> Tips & Study Advice
                                </h4>
                                <ul className="space-y-2.5 pl-2">
                                    {currentSection.tips.map((tp, idx) => (
                                        <li key={idx} className="flex items-start gap-2.5 text-sm font-medium text-muted-foreground leading-relaxed">
                                            <span className="w-1.5 h-1.5 rounded-full bg-primary shrink-0 mt-2" />
                                            <span>{tp}</span>
                                        </li>
                                    ))}
                                </ul>
                            </div>
                        </motion.div>
                    </AnimatePresence>
                </div>

            </div>
        </div>
    );
}
