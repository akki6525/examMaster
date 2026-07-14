import { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { 
    MessageSquare, 
    Send, 
    X, 
    Compass, 
    Trophy, 
    Target, 
    User, 
    Sparkles, 
    ArrowRight,
    Minus,
    HelpCircle
} from 'lucide-react';
import { useAuthStore } from '../../stores/authStore';
import axios from 'axios';

interface ChatMessage {
    sender: 'user' | 'bot';
    text: string;
    action?: { label: string; path: string };
    choices?: { label: string; path: string }[];
}

export default function AurBhaiChatbot() {
    const { user } = useAuthStore();
    const navigate = useNavigate();
    const [isOpen, setIsOpen] = useState(false);
    const [messages, setMessages] = useState<ChatMessage[]>([]);
    const [inputValue, setInputValue] = useState("");
    const messagesEndRef = useRef<HTMLDivElement>(null);

    // Live Metrics States
    const [practiceStats, setPracticeStats] = useState({ totalAttempted: 0, correct: 0, incorrect: 0 });
    const [recentResults, setRecentResults] = useState<any[]>([]);

    // Fetch live statistics from backend APIs when chatbot is opened
    useEffect(() => {
        if (isOpen) {
            axios.get(`http://localhost:3001/api/tests/results`)
                .then(res => setRecentResults(res.data || []))
                .catch(console.error);

            axios.get(`http://localhost:3001/api/practice-stats`)
                .then(res => {
                    if (res.data && res.data.totalAttempted !== undefined) {
                        setPracticeStats(res.data);
                    }
                })
                .catch(console.error);
        }
    }, [isOpen]);

    // Auto-scroll messages to bottom
    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    };

    useEffect(() => {
        if (messages.length > 0) {
            scrollToBottom();
        }
    }, [messages]);

    // Initial greeting
    useEffect(() => {
        if (isOpen && messages.length === 0) {
            const displayName = user 
                ? (user.username.includes('@') ? user.username.split('@')[0] : user.username)
                : 'Bhai';
            
            setMessages([
                {
                    sender: 'bot',
                    text: `Aur bhai ${displayName}! Sab parhai-likhai badhiya chal rahi hai? Main tumhara guide 'Aur bhai' hoon. Batao aaj kis exam ko fodna hai? 🚀\n\nNiche diye options par click karo ya mujhse direct baat karo!`
                }
            ]);
        }
    }, [isOpen, user]);

    const handleSendMessage = (text: string) => {
        if (!text.trim()) return;

        const newMsg: ChatMessage = { sender: 'user', text };
        setMessages(prev => [...prev, newMsg]);
        setInputValue("");

        // Generate bot Reply
        setTimeout(() => {
            const reply = getBotReply(text);
            setMessages(prev => [...prev, reply]);
        }, 555);
    };

    const getBotReply = (input: string): ChatMessage => {
        const query = input.toLowerCase();

        // 1. Navigation query
        if (query.includes("go to") || query.includes("navigate") || query.includes("open") || query.includes("option") || query.includes("rasta") || query.includes("show me") || query.includes("kahan")) {
            // Find keyword matches
            if (query.includes("upload") || query.includes("pdf") || query.includes("note")) {
                return {
                    sender: 'bot',
                    text: "Bhai, note ya PDF upload ke liye ye option sahi hai. Kya tum yahan jana chahte ho?",
                    choices: [{ label: "Upload Notes", path: "/upload" }]
                };
            }
            if (query.includes("question") || query.includes("bank") || query.includes("mcq")) {
                return {
                    sender: 'bot',
                    text: "Bhai, exam reference papers aur questions review karne ke liye 'Question Bank' option open karein. Kya vahan chalein?",
                    choices: [{ label: "Question Bank", path: "/question-bank" }]
                };
            }
            if (query.includes("flashcard") || query.includes("slide") || query.includes("revision")) {
                return {
                    sender: 'bot',
                    text: "Bhai, fast retention study cards ke liye 'Flashcards' target section select karein. Is section mein chalein?",
                    choices: [{ label: "Flashcards", path: "/flashcards" }]
                };
            }
            if (query.includes("exam") || query.includes("official") || query.includes("cgl") || query.includes("upsc")) {
                return {
                    sender: 'bot',
                    text: "Bhai, state level boards aur CGL/UPSC PYQs simulation ke liye 'Official Exams' section follow karein. Is section mein chalein?",
                    choices: [{ label: "Official Exams", path: "/official-exams" }]
                };
            }
            if (query.includes("student") || query.includes("goal") || query.includes("dream") || query.includes("corner")) {
                return {
                    sender: 'bot',
                    text: "Bhai, details map, schedule aur goal countdowns monitor karne ke liye 'Student Corner' page check karein. Is section mein chalein?",
                    choices: [{ label: "Student Corner", path: "/student-corner" }]
                };
            }
            if (query.includes("smart") || query.includes("mock") || query.includes("test")) {
                return {
                    sender: 'bot',
                    text: "Bhai, dynamic timer based mock tests setup ke liye 'Smart Mock Tests' check karein. Is section mein chalein?",
                    choices: [{ label: "Smart Mock Tests", path: "/smart-mock-tests" }]
                };
            }
            if (query.includes("report") || query.includes("ai") || query.includes("performance")) {
                return {
                    sender: 'bot',
                    text: "Bhai, test history marks aur performance ratios vectors analysis ke liye 'AI Report' option check karein. Kya vahan chalein?",
                    choices: [{ label: "AI Report", path: "/ai-report" }]
                };
            }
            if (query.includes("guide") || query.includes("how to") || query.includes("tutorial")) {
                return {
                    sender: 'bot',
                    text: "Bhai, standard software guides check karne ke liye 'User Guide' option open karein. Kya vahan chalein?",
                    choices: [{ label: "User Guide", path: "/guide" }]
                };
            }
            
            // Otherwise, show full choices for all app headings/options!
            return {
                sender: 'bot',
                text: "Bhai, aap is app ke kis section mein jaana chahte hain? Niche option choose kijiye aur main redirect kar dunga! 👇",
                choices: [
                    { label: "Dashboard", path: "/" },
                    { label: "Upload Notes", path: "/upload" },
                    { label: "Question Bank", path: "/question-bank" },
                    { label: "AI Report", path: "/ai-report" },
                    { label: "Official Exams", path: "/official-exams" },
                    { label: "Flashcards", path: "/flashcards" },
                    { label: "Import Questions", path: "/import" },
                    { label: "Import PDF", path: "/import-pdf" },
                    { label: "Student Corner", path: "/student-corner" },
                    { label: "Smart Mock Tests", path: "/smart-mock-tests" },
                    { label: "User Guide", path: "/guide" }
                ]
            };
        }

        // 2. Progress Summary query with all mock test counts, correct/incorrect questions solved, percentage accuracy & goals summary
        if (query.includes("progress") || query.includes("summary") || query.includes("status") || query.includes("report card") || query.includes("kitna")) {
            const userId = user?.username || "guest";
            const savedDreams = localStorage.getItem(`dreams_${userId}`);
            let totalDreams = 0;
            let achievedDreams = 0;
            let avgProgress = 0;

            if (savedDreams) {
                const dreams = JSON.parse(savedDreams);
                totalDreams = dreams.length;
                achievedDreams = dreams.filter((d: any) => d.isAchieved).length;
                avgProgress = totalDreams ? Math.round(dreams.reduce((acc: number, d: any) => acc + d.progress, 0) / totalDreams) : 0;
            }

            const accuracy = practiceStats.totalAttempted > 0
                ? Math.round((practiceStats.correct / practiceStats.totalAttempted) * 105 / 105 * 100) // Correct percentage tracker
                : 0;

            const totalMocks = recentResults.length;
            const highestPercent = recentResults.length > 0 
                ? Math.max(...recentResults.map((r: any) => r.percentage || 0)) 
                : 0;
            const avgMockPercent = recentResults.length > 0
                ? Math.round(recentResults.reduce((acc: number, r: any) => acc + (r.percentage || 0), 0) / recentResults.length)
                : 0;

            return {
                sender: 'bot',
                text: `Bhai, teri puri practice progress report card ye rahi:\n\n` + 
                      `📝 Mock Tests Taken: ${totalMocks} tests\n` +
                      `⚡ Questions Solved: ${practiceStats.totalAttempted} questions\n` +
                      `✅ Correct Answers: ${practiceStats.correct} (${accuracy}% Accuracy)\n` +
                      `❌ Incorrect Answers: ${practiceStats.incorrect}\n` +
                      `📈 Avg Mock Score: ${avgMockPercent}%\n` + 
                      `🏆 Highest Score: ${highestPercent}%\n\n` +
                      `🎯 Target Goals Created: ${totalDreams} goals\n` +
                      `🌟 Goals Achieved: ${achievedDreams} achieved\n` +
                      `📋 Syllabus Goal Progress: ${avgProgress}%\n\n` +
                      `Pura zor laga de bhai, is baar selection pakka hai! 🚀`
            };
        }

        // 3. Dreams & Goals query
        if (query.includes("dream") || query.includes("goal") || query.includes("ambition") || query.includes("target")) {
            const userId = user?.username || "guest";
            const savedDreams = localStorage.getItem(`dreams_${userId}`);
            
            if (!savedDreams || JSON.parse(savedDreams).length === 0) {
                return {
                    sender: 'bot',
                    text: "Bhai, abhi tumne Student Corner mein koi goal nahi set kiya hai! Abhi jao aur apna target exam lock karo taaki prep monitor sake.",
                    choices: [{ label: "Student Corner", path: "/student-corner" }]
                };
            }

            const dreams = JSON.parse(savedDreams);
            const activeLines = dreams.slice(0, 3).map((d: any) => {
                const cat = d.title;
                const progress = d.progress;
                let daysText = "";
                if (d.targetDate) {
                    const daysLeft = Math.ceil((new Date(d.targetDate).getTime() - new Date().setHours(0,0,0,0)) / (1000 * 60 * 60 * 24));
                    daysText = daysLeft > 0 ? ` (${daysLeft} days remaining)` : daysLeft === 0 ? " (Today is the target day! ⚡)" : ` (${Math.abs(daysLeft)} days overdue)`;
                }
                return `• ${cat}: ${progress}% complete${daysText}`;
            }).join("\n");

            return {
                sender: 'bot',
                text: `Bhai, tumhare active target goals ye rahe:\n\n${activeLines}\n\nLage rho bhai, target bilkul paas hai! 🔥`,
                choices: [{ label: "Student Corner", path: "/student-corner" }]
            };
        }

        // 4. Profile Details query
        if (query.includes("profile") || query.includes("account") || query.includes("user") || query.includes("details") || query.includes("email") || query.includes("phone")) {
            if (!user) {
                return {
                    sender: 'bot',
                    text: "Bhai, login data temporary session mein hai. Please register/login properly."
                };
            }

            return {
                sender: 'bot',
                text: `Bhai, tumhare account ke credentials ye rahe:\n\n👤 Name: ${user.name || "N/A"}\n📧 Email: ${user.email || "N/A"}\n📱 Phone: ${user.phone || "N/A"}\n🆔 Username: ${user.username}`,
            };
        }

        // 5. Help / Greeting / Fallback
        if (query.includes("hello") || query.includes("hi ") || query.includes("hey") || query.includes("salam") || query.includes("namaste") || query.includes("aur bhai")) {
            return {
                sender: 'bot',
                text: "Aur bhai! Bahut badiya laga aapse mil kar. Main bilkul fit, aap sunao! Parhai-likhai kaisi chal rhi hai? Kuch parhai ke queries hain toh poochiye."
            };
        }
        
        if (query.includes("study") || query.includes("tip") || query.includes("motivation") || query.includes("shayari")) {
            const shayanis = [
                "Tu shaheen hai parwaz hai kaam tera, tere samne aasman aur bhi hain. 🦅 Revise well, and stay consistent!",
                "Sabar rakh, mehnat jari rakh, safalta khud shor machayegi! Daily 50 MCQ target karo.",
                "Take a 5-minute breather, hydrate, and jump back into the mock test with fresh focus. You can do this!"
            ];
            return {
                sender: 'bot',
                text: shayanis[Math.floor(Math.random() * shayanis.length)]
            };
        }

        return {
            sender: 'bot',
            text: "Arey bhai, main is topic ko acche se samajh nahi paya. Prep metrics, progress tracker, dreams, profile, ya navigation pathways ke baare mein poocho toh jhat se bataoon! Ya niche shortcuts click karo 👇"
        };
    };

    return (
        <div className="fixed bottom-6 right-6 z-[999] font-sans">
            {/* Chat Bubble Toggle Button */}
            <AnimatePresence>
                {!isOpen && (
                    <motion.button
                        key="chat-toggle"
                        initial={{ scale: 0, opacity: 0 }}
                        animate={{ scale: 1, opacity: 1 }}
                        exit={{ scale: 0, opacity: 0 }}
                        onClick={() => setIsOpen(true)}
                        className="w-14 h-14 rounded-full gradient-primary text-white flex items-center justify-center shadow-[0_8px_30px_rgba(99,102,241,0.4)] border border-white/20 hover:scale-105 active:scale-95 transition-all duration-200"
                        whileHover={{ rotate: 10 }}
                    >
                        <MessageSquare className="w-6 h-6 text-white" />
                        <span className="absolute -top-2 -right-6 flex select-none">
                            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-500/25"></span>
                            <span className="relative bg-gradient-to-r from-amber-400 to-amber-500 text-[9px] font-black text-slate-950 px-2.5 py-0.5 rounded-full uppercase tracking-wider shadow-lg border border-slate-950/10 whitespace-nowrap">
                                Aur bhai
                            </span>
                        </span>
                    </motion.button>
                )}
            </AnimatePresence>

            {/* Chat Window */}
            <AnimatePresence>
                {isOpen && (
                    <motion.div
                        key="chat-window"
                        className="absolute bottom-0 right-0 w-[340px] md:w-[380px] h-[500px] bg-slate-950/95 dark:bg-black/95 backdrop-blur-2xl rounded-3xl border border-white/10 shadow-2xl flex flex-col overflow-hidden text-white font-medium origin-bottom-right"
                        initial={{ opacity: 0, scale: 0.8, y: 50 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.8, y: 50 }}
                        transition={{ type: "spring", damping: 22, stiffness: 280 }}
                    >
                        {/* Header */}
                        <div className="bg-gradient-to-r from-indigo-900 via-purple-900 to-indigo-950 px-5 py-4 flex items-center justify-between border-b border-white/5">
                            <div className="flex items-center gap-2.5">
                                <div className="w-9 h-9 rounded-xl bg-amber-500/20 border border-amber-500/40 flex items-center justify-center">
                                    <Sparkles className="w-4 h-4 text-amber-400 rotate-12" />
                                </div>
                                <div>
                                    <h3 className="font-black text-sm tracking-wide text-amber-400">Aur bhai 🤝</h3>
                                    <span className="text-[10px] font-bold text-white/50 uppercase tracking-widest flex items-center gap-1">
                                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span> Online Partner
                                    </span>
                                </div>
                            </div>
                            <div className="flex gap-2">
                                <button 
                                    onClick={() => setIsOpen(false)}
                                    className="p-1.5 hover:bg-white/10 rounded-lg transition-colors border border-transparent hover:border-white/5"
                                >
                                    <Minus className="w-4 h-4" />
                                </button>
                                <button 
                                    onClick={() => setIsOpen(false)}
                                    className="p-1.5 hover:bg-white/10 rounded-lg transition-colors border border-transparent hover:border-white/5 text-red-400"
                                >
                                    <X className="w-4 h-4" />
                                </button>
                            </div>
                        </div>

                        {/* Messages List Area */}
                        <div className="flex-1 overflow-y-auto p-4 space-y-4 no-scrollbar">
                            {messages.map((msg, idx) => (
                                <div 
                                    key={idx} 
                                    className={`flex flex-col ${msg.sender === 'user' ? 'items-end' : 'items-start'}`}
                                >
                                    <div className={`w-full max-w-[90%] rounded-[1.25rem] px-4 py-3 text-xs md:text-sm leading-relaxed border ${
                                        msg.sender === 'user' 
                                            ? 'bg-primary text-white border-primary/20 rounded-tr-none ml-auto w-fit' 
                                            : 'bg-white/5 text-slate-100 border-white/10 rounded-tl-none font-bold'
                                    }`}>
                                        <p className="whitespace-pre-line">{msg.text}</p>
                                        
                                        {/* Choices list displayed dynamically */}
                                        {msg.choices && (
                                            <div className="mt-3 grid grid-cols-1 gap-1.5 w-full">
                                                {msg.choices.map((choice) => (
                                                    <button
                                                        key={choice.path}
                                                        onClick={() => {
                                                            const userMsgText = `Yes, navigate me to ${choice.label}`;
                                                            setMessages(prev => [...prev, { sender: 'user', text: userMsgText }]);
                                                            
                                                            setTimeout(() => {
                                                                setMessages(prev => [...prev, { 
                                                                    sender: 'bot', 
                                                                    text: `Chalo bhai, safar shuru! Abhi le chalta hoon aapko '${choice.label}' page par... 🚀` 
                                                                }]);
                                                                
                                                                setTimeout(() => {
                                                                    navigate(choice.path);
                                                                    setIsOpen(false);
                                                                }, 1000);
                                                            }, 400);
                                                        }}
                                                        className="w-full text-left py-2.5 px-3 bg-white/10 hover:bg-primary/30 active:scale-[0.98] rounded-xl text-xs font-black transition-all border border-white/5 flex items-center justify-between group text-amber-400"
                                                    >
                                                        <span>Do you want to navigate to {choice.label}?</span>
                                                        <ArrowRight className="w-3.5 h-3.5 text-white/60 group-hover:text-white transition-colors" />
                                                    </button>
                                                ))}
                                            </div>
                                        )}
                                    </div>
                                    <span className="text-[9px] text-white/30 mt-1 uppercase tracking-wider font-bold">
                                        {msg.sender === 'user' ? 'You' : 'Aur Bhai'}
                                    </span>
                                </div>
                            ))}
                            <div ref={messagesEndRef} />
                        </div>

                        {/* Shortcuts / Fast Options Bar */}
                        <div className="px-4 py-2 bg-black/40 border-t border-white/5 flex gap-2 overflow-x-auto no-scrollbar whitespace-nowrap">
                            <button 
                                onClick={() => handleSendMessage("Show my profile details")}
                                className="px-3 py-1.5 bg-white/5 hover:bg-white/10 border border-white/15 rounded-xl text-[10px] font-black uppercase tracking-wider transition-colors flex items-center gap-1.5"
                            >
                                <User className="w-3 h-3 text-indigo-400" /> profile details
                            </button>
                            <button 
                                onClick={() => handleSendMessage("Give my progress summary")}
                                className="px-3 py-1.5 bg-white/5 hover:bg-white/10 border border-white/15 rounded-xl text-[10px] font-black uppercase tracking-wider transition-colors flex items-center gap-1.5"
                            >
                                <Trophy className="w-3 h-3 text-yellow-400" /> progress summary
                            </button>
                            <button 
                                onClick={() => handleSendMessage("What are my dreams and goals?")}
                                className="px-3 py-1.5 bg-white/5 hover:bg-white/10 border border-white/15 rounded-xl text-[10px] font-black uppercase tracking-wider transition-colors flex items-center gap-1.5"
                            >
                                <Target className="w-3 h-3 text-pink-400" /> dreams & goals
                            </button>
                            <button 
                                onClick={() => handleSendMessage("Navigate to options")}
                                className="px-3 py-1.5 bg-white/5 hover:bg-white/10 border border-white/15 rounded-xl text-[10px] font-black uppercase tracking-wider transition-colors flex items-center gap-1.5"
                            >
                                <Compass className="w-3 h-3 text-emerald-400" /> navigate options
                            </button>
                        </div>

                        {/* Input Footer */}
                        <form 
                            onSubmit={(e) => {
                                e.preventDefault();
                                handleSendMessage(inputValue);
                            }}
                            className="bg-black/60 p-3.5 border-t border-white/5 flex gap-2 items-center"
                        >
                            <input
                                type="text"
                                value={inputValue}
                                onChange={(e) => setInputValue(e.target.value)}
                                placeholder="Bhai se guftagu karein..."
                                className="flex-1 bg-white/5 focus:bg-white/10 text-xs md:text-sm font-bold border-none rounded-xl h-10 px-4 focus:ring-2 focus:ring-primary/20 text-white placeholder-slate-500"
                            />
                            <button
                                type="submit"
                                className="w-10 h-10 bg-primary/20 hover:bg-primary/30 active:scale-95 text-primary border border-primary/20 rounded-xl flex items-center justify-center transition-all"
                            >
                                <Send className="w-4 h-4" />
                            </button>
                        </form>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}
