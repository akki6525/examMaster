import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
    Sparkles, Compass, Play, Pause, Volume2, SkipForward,
    Image as ImageIcon, BookOpen, VolumeX, RefreshCw, ZoomIn, ZoomOut,
    ArrowLeft, ArrowRight, Info, Heart, X, RotateCcw, Maximize2
} from 'lucide-react';
import { useAuthStore } from '../stores/authStore';

// Define structures of sub-modes
type SubMode = 'zen' | 'meditation' | 'detachment' | 'comics';

interface AudioTrack {
    title: string;
    description: string;
    url: string;
    duration: string;
    synthType?: 'sine' | 'binaural' | 'rain';
    freq?: number;
}

const ZEN_TRACKS: AudioTrack[] = [
    { title: 'Solfeggio Frequency (528Hz)', description: 'Calming frequency for mental clarity and repair', url: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-2.mp3', duration: '7:05', synthType: 'sine', freq: 528 },
    { title: 'Deep Alpha Chillout', description: 'Tranquil ambient soundscape for study breaks', url: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-4.mp3', duration: '5:02', synthType: 'binaural', freq: 432 },
    { title: 'Binaural Focus', description: 'Zen brainwaves for supreme concentration', url: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-6.mp3', duration: '6:15', synthType: 'binaural', freq: 220 }
];

const MEDITATION_TRACKS: AudioTrack[] = [
    {
        title: 'Yoga Nidra Meditation',
        description: 'Guided somatic body scan & mountain visualization (Actual Voice)',
        url: 'https://archive.org/download/01ppp1yoganidrawithmountainvisualization/01%20%7BPPP1%7D%20Yoga%20Nidra%20with%20Mountain%20Visualization.mp3',
        duration: '11:27',
        synthType: 'rain'
    },
    {
        title: 'Mindfulness Body Scan',
        description: 'Guided Oxford University body scan to release tension & sleep (Actual Voice)',
        url: 'https://franticworld.com/wp-content/uploads/2015/10/02-Meditation-2-The-Body-Scan.mp3',
        duration: '20:15',
        synthType: 'sine',
        freq: 110
    }
];

const DETACHMENT_TRACKS: AudioTrack[] = [
    {
        title: 'Soothing Bansuri Flute',
        description: 'Tranquil flute recital in Raga Chandraumoli by Pt. Pannalal Ghosh',
        url: 'https://archive.org/download/raga-chandraumoli-drut/raga%20chandraumoli%20drut.mp3',
        duration: '2:48',
        synthType: 'sine',
        freq: 280
    },
    {
        title: 'Detached Forest Reflection',
        description: 'Slow meditative flute vilambat recital by Pt. Pannalal Ghosh',
        url: 'https://archive.org/download/raga-chandraumoli-drut/raga%2520chandraumoli%2520vilambat.mp3',
        duration: '2:48',
        synthType: 'rain'
    }
];

// Predefined detachment posters with motivating quotes
const DETACHMENT_POSTERS = [
    {
        title: "Moh Maya Se Door",
        quote: "चिंताएं उतनी ही करो कि काम हो जाए, इतनी नहीं कि जिंदगी तमाम हो जाए।",
        author: "Kabir Das",
        image: "/moh_maya_poster.png",
        bgGradient: "from-amber-950 via-slate-900 to-indigo-950"
    },
    {
        title: "The Ultimate Peace",
        quote: "Desire is the root cause of all suffering. When you master your desires, you master your destiny.",
        author: "Gautama Buddha",
        image: "https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?q=80&w=1000&auto=format&fit=crop",
        bgGradient: "from-emerald-950 via-slate-900 to-teal-950"
    },
    {
        title: "Divine Detachment",
        quote: "Perform your duty equipoised, O Arjuna, abandoning all attachment to success or failure.",
        author: "Bhagavad Gita",
        image: "https://images.unsplash.com/photo-1506126613408-eca07ce68773?q=80&w=1000&auto=format&fit=crop",
        bgGradient: "from-purple-950 via-slate-900 to-pink-950"
    }
];

// Superhero comics array
const HERO_COMICS = [
    {
        id: 1,
        title: "Nagraj & Dhruva: Forest Reflection",
        issue: "Raj Comics Special #1",
        description: "Classic vintage Indian superheroes find an ancient calming frequency deep inside the Forest of Detachment.",
        pages: [
            "/forest_reflection_comic.png",
            "https://images.unsplash.com/photo-1569003339405-ea396a5a8a90?q=80&w=1000&auto=format&fit=crop",
            "https://images.unsplash.com/photo-1534447677768-be436bb09401?q=80&w=1000&auto=format&fit=crop"
        ]
    },
    {
        id: 2,
        title: "Chacha Chaudhary: Brain Power",
        issue: "Diamond Comics Classic #150",
        description: "Chacha Chaudhary solves student exam stress using mental computation and option elimination.",
        pages: [
            "https://images.unsplash.com/photo-1612036782180-6f0b6cd846fe?q=80&w=1000&auto=format&fit=crop",
            "https://images.unsplash.com/photo-1569003339405-ea396a5a8a90?q=80&w=1000&auto=format&fit=crop",
            "https://images.unsplash.com/photo-1534447677768-be436bb09401?q=80&w=1000&auto=format&fit=crop"
        ]
    },
    {
        id: 3,
        title: "Devi: Guarding the Mind",
        issue: "Graphic India Edition #04",
        description: "The divine guardian warrior Devi enters the subconscious to eliminate exam anxiety.",
        pages: [
            "https://images.unsplash.com/photo-1534447677768-be436bb09401?q=80&w=1000&auto=format&fit=crop",
            "https://images.unsplash.com/photo-1569003339405-ea396a5a8a90?q=80&w=1000&auto=format&fit=crop",
            "/forest_reflection_comic.png"
        ]
    }
];

export default function RelaxMode() {
    const [activeTab, setActiveTab] = useState<SubMode>('zen');

    // Audio states
    const [currentTrack, setCurrentTrack] = useState<AudioTrack>(ZEN_TRACKS[0]);
    const [isPlaying, setIsPlaying] = useState(false);
    const [volume, setVolume] = useState(0.5);
    const [progress, setProgress] = useState(0);
    const [isMuted, setIsMuted] = useState(false);
    const [duration, setDuration] = useState('0:00');
    const [currentTimeText, setCurrentTimeText] = useState('0:00');

    // Synth / Frequency Audio state
    const [isSynthEnabled, setIsSynthEnabled] = useState(false);
    const synthAudioCtx = useRef<AudioContext | null>(null);
    const synthOscs = useRef<OscillatorNode[]>([]);
    const synthGain = useRef<GainNode | null>(null);

    // Background Rain Audio state for Forest Reflection
    const rainAudioCtx = useRef<AudioContext | null>(null);
    const rainSource = useRef<AudioBufferSourceNode | null>(null);
    const rainGain = useRef<GainNode | null>(null);
    const rainIntervalRef = useRef<any>(null);
    const rainLfoRef = useRef<OscillatorNode | null>(null);

    // Standard HTML Audio state
    const audioRef = useRef<HTMLAudioElement | null>(null);

    // Detachment state
    const [detachmentIndex, setDetachmentIndex] = useState(0);

    // Comic book gallery states (PDF style reader)
    const [comicIndex, setComicIndex] = useState(0);
    const [pageIndex, setPageIndex] = useState(0);
    const [zoomScale, setZoomScale] = useState(1.0);
    const [isComicZoomed, setIsComicZoomed] = useState(false);

    // Reset page index and zoom when comic changes
    useEffect(() => {
        setPageIndex(0);
        setZoomScale(1.0);
    }, [comicIndex]);

    // Track relax mode time spent dynamically in localStorage based on active username
    useEffect(() => {
        const user = useAuthStore.getState().user;
        const username = user?.username || 'guest';
        const key = `relax_time_${username}`;

        const timer = setInterval(() => {
            const current = parseInt(localStorage.getItem(key) || '0', 10);
            localStorage.setItem(key, String(current + 1));
        }, 1000);

        return () => clearInterval(timer);
    }, []);

    // Synchronize play/pause when tabs change
    useEffect(() => {
        if (activeTab === 'zen') {
            setCurrentTrack(ZEN_TRACKS[0]);
        } else if (activeTab === 'meditation') {
            setCurrentTrack(MEDITATION_TRACKS[0]);
        } else if (activeTab === 'detachment') {
            setCurrentTrack(DETACHMENT_TRACKS[0]);
        }

        // Stop audio when changing track type
        stopAllAudio();
    }, [activeTab]);

    // Handle standard audio callbacks
    useEffect(() => {
        const audio = audioRef.current;
        if (!audio) return;

        const updateProgress = () => {
            if (audio.duration) {
                const currentPct = (audio.currentTime / audio.duration) * 100;
                setProgress(currentPct);

                // Format time texts
                const mins = Math.floor(audio.currentTime / 60);
                const secs = Math.floor(audio.currentTime % 60);
                setCurrentTimeText(`${mins}:${secs.toString().padStart(2, '0')}`);
            }
        };

        const onLoaded = () => {
            const mins = Math.floor(audio.duration / 60);
            const secs = Math.floor(audio.duration % 60);
            setDuration(`${mins}:${secs.toString().padStart(2, '0')}`);
        };

        const onEnded = () => {
            setIsPlaying(false);
            setProgress(0);
            setCurrentTimeText('0:00');
        };

        audio.addEventListener('timeupdate', updateProgress);
        audio.addEventListener('loadedmetadata', onLoaded);
        audio.addEventListener('ended', onEnded);

        return () => {
            audio.removeEventListener('timeupdate', updateProgress);
            audio.removeEventListener('loadedmetadata', onLoaded);
            audio.removeEventListener('ended', onEnded);
        };
    }, []);

    // Set volume inside audio ref
    useEffect(() => {
        if (audioRef.current) {
            audioRef.current.volume = isMuted ? 0 : volume;
        }
        if (synthGain.current) {
            synthGain.current.gain.value = isMuted ? 0 : volume * 0.15; // Keep synth soft
        }
        if (rainGain.current) {
            rainGain.current.gain.setValueAtTime(isMuted ? 0 : volume * 0.25, rainAudioCtx.current ? rainAudioCtx.current.currentTime : 0);
        }
    }, [volume, isMuted]);

    const startBackgroundRain = () => {
        try {
            if (!rainAudioCtx.current) {
                rainAudioCtx.current = new (window.AudioContext || (window as any).webkitAudioContext)();
            }
            const ctx = rainAudioCtx.current;
            if (ctx.state === 'suspended') {
                ctx.resume();
            }

            // Clean up any existing rain nodes/intervals
            stopBackgroundRain();

            // 1. Generate Warm Brown Noise (simulates deep wind and steady heavy rainfall)
            const bufferSize = 4 * ctx.sampleRate; // 4 seconds loop
            const noiseBuffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
            const output = noiseBuffer.getChannelData(0);
            
            let lastOut = 0.0;
            for (let i = 0; i < bufferSize; i++) {
                const white = Math.random() * 2 - 1;
                // Brown noise filter formula
                output[i] = (lastOut + (0.02 * white)) / 1.02;
                lastOut = output[i];
                output[i] *= 3.5; // Gain compensation
            }

            const source = ctx.createBufferSource();
            source.buffer = noiseBuffer;
            source.loop = true;

            // 2. Lowpass Filter (gives the muffled "woodlands canopy" sound of water hitting leaves)
            const lowpass = ctx.createBiquadFilter();
            lowpass.type = 'lowpass';
            lowpass.frequency.setValueAtTime(320, ctx.currentTime);

            // 3. Bandpass Filter & LFO modulation (adds whooshing gusts of forest wind)
            const bandpass = ctx.createBiquadFilter();
            bandpass.type = 'bandpass';
            bandpass.Q.setValueAtTime(1.0, ctx.currentTime);

            const lfo = ctx.createOscillator();
            const lfoGain = ctx.createGain();
            lfo.type = 'sine';
            lfo.frequency.setValueAtTime(0.08, ctx.currentTime); // slow wind oscillations (12 seconds)
            lfoGain.gain.setValueAtTime(120, ctx.currentTime); // sweep filter frequency center

            lfo.connect(lfoGain);
            lfoGain.connect(bandpass.frequency);

            // Set default center frequency
            bandpass.frequency.setValueAtTime(450, ctx.currentTime);

            const gainNode = ctx.createGain();
            gainNode.gain.setValueAtTime(isMuted ? 0 : volume * 0.18, ctx.currentTime);

            // Connect nodes
            source.connect(lowpass);
            lowpass.connect(bandpass);
            bandpass.connect(gainNode);
            gainNode.connect(ctx.destination);

            source.start();
            lfo.start();

            rainSource.current = source;
            rainLfoRef.current = lfo;
            rainGain.current = gainNode;

            // 4. Droplets Engine (pitter-patter sound of raindrops plopping at random positions/frequencies)
            const scheduleNextDrop = () => {
                // If stopped in main state, exit loop
                if (!rainIntervalRef.current) return;
                
                try {
                    const dropCtx = rainAudioCtx.current;
                    if (dropCtx && dropCtx.state !== 'suspended') {
                        // Create transient droplet oscillator
                        const osc = dropCtx.createOscillator();
                        const shapeGain = dropCtx.createGain();
                        
                        osc.type = 'sine';
                        // Random high-pitched water plop sound
                        const baseFreq = 700 + Math.random() * 1100;
                        osc.frequency.setValueAtTime(baseFreq, dropCtx.currentTime);
                        osc.frequency.exponentialRampToValueAtTime(80, dropCtx.currentTime + 0.035);

                        shapeGain.gain.setValueAtTime(isMuted ? 0 : volume * (0.04 + Math.random() * 0.05), dropCtx.currentTime);
                        shapeGain.gain.exponentialRampToValueAtTime(0.001, dropCtx.currentTime + 0.04);

                        osc.connect(shapeGain);
                        shapeGain.connect(dropCtx.destination);

                        osc.start();
                        osc.stop(dropCtx.currentTime + 0.05);
                    }
                } catch (e) {}

                // Schedule next droplet at random interval (40ms - 150ms) to ensure it doesn't sound mechanical
                const nextDelay = 40 + Math.random() * 110;
                rainIntervalRef.current = setTimeout(scheduleNextDrop, nextDelay);
            };

            // Start the droplet loop
            rainIntervalRef.current = setTimeout(scheduleNextDrop, 50);

        } catch (err) {
            console.error("Failed to start background forest rain effect:", err);
        }
    };

    const stopBackgroundRain = () => {
        // Clear droplet scheduler loop
        if (rainIntervalRef.current) {
            clearTimeout(rainIntervalRef.current);
            rainIntervalRef.current = null;
        }

        // Stop wind LFO
        if (rainLfoRef.current) {
            try { rainLfoRef.current.stop(); } catch (e) {}
            rainLfoRef.current.disconnect();
            rainLfoRef.current = null;
        }

        // Stop brown noise source loop
        if (rainSource.current) {
            try { rainSource.current.stop(); } catch (e) {}
            rainSource.current.disconnect();
            rainSource.current = null;
        }

        // Disconnect gain
        if (rainGain.current) {
            rainGain.current.disconnect();
            rainGain.current = null;
        }
    };

    const stopAllAudio = () => {
        setIsPlaying(false);
        setProgress(0);
        setCurrentTimeText('0:00');

        // Stop standard HTML Audio
        if (audioRef.current) {
            audioRef.current.pause();
            audioRef.current.currentTime = 0;
        }

        // Stop Synthesizer
        stopSynth();
        // Stop background rain
        stopBackgroundRain();
    };

    const handleZoomIn = () => {
        setZoomScale(prev => Math.min(2.5, prev + 0.2));
    };

    const handleZoomOut = () => {
        setZoomScale(prev => Math.max(0.5, prev - 0.2));
    };

    const handleResetZoom = () => {
        setZoomScale(1.0);
    };

    const handleNextPage = () => {
        const currentComic = HERO_COMICS[comicIndex];
        if (pageIndex < currentComic.pages.length - 1) {
            setPageIndex(prev => prev + 1);
        } else {
            // Next comic
            setComicIndex(prev => (prev === HERO_COMICS.length - 1 ? 0 : prev + 1));
            setPageIndex(0);
        }
        setZoomScale(1.0);
    };

    const handlePrevPage = () => {
        if (pageIndex > 0) {
            setPageIndex(prev => prev - 1);
        } else {
            // Go to previous comic
            const prevComicIdx = comicIndex === 0 ? HERO_COMICS.length - 1 : comicIndex - 1;
            setComicIndex(prevComicIdx);
            setPageIndex(HERO_COMICS[prevComicIdx].pages.length - 1);
        }
        setZoomScale(1.0);
    };

    // Synthesizer focus frequencies generator using Web Audio API
    const startSynth = (track: AudioTrack) => {
        try {
            if (!synthAudioCtx.current) {
                synthAudioCtx.current = new (window.AudioContext || (window as any).webkitAudioContext)();
            }

            const ctx = synthAudioCtx.current;
            if (ctx.state === 'suspended') {
                ctx.resume();
            }

            // Clean previous nodes
            stopSynth();

            const gainNode = ctx.createGain();
            gainNode.connect(ctx.destination);
            gainNode.gain.setValueAtTime(isMuted ? 0 : volume * 0.15, ctx.currentTime); // Soft volume
            synthGain.current = gainNode;

            if (track.synthType === 'binaural') {
                // True separation binaural beat setup
                const carryFreq = track.freq || 220;
                // Focus: 6Hz diff (theta) or 10Hz diff (alpha)
                const beatFreq = carryFreq === 220 ? 6 : 10;

                const oscL = ctx.createOscillator();
                const oscR = ctx.createOscillator();

                // Soothing sine waves instead of triangle wave to keep tone pleasant
                oscL.type = 'sine';
                oscL.frequency.setValueAtTime(carryFreq, ctx.currentTime);

                oscR.type = 'sine';
                oscR.frequency.setValueAtTime(carryFreq + beatFreq, ctx.currentTime);

                // Setup stereo panning so actual Binaural beat occurs in brain
                const pannerL = ctx.createStereoPanner ? ctx.createStereoPanner() : null;
                const pannerR = ctx.createStereoPanner ? ctx.createStereoPanner() : null;

                if (pannerL && pannerR) {
                    pannerL.pan.setValueAtTime(-1, ctx.currentTime);
                    pannerR.pan.setValueAtTime(1, ctx.currentTime);

                    oscL.connect(pannerL);
                    pannerL.connect(gainNode);

                    oscR.connect(pannerR);
                    pannerR.connect(gainNode);
                } else {
                    // Fallback to mono merging when StereoPanner is not supported
                    oscL.connect(gainNode);
                    oscR.connect(gainNode);
                }

                oscL.start();
                oscR.start();
                synthOscs.current = [oscL, oscR];
            } else if (track.synthType === 'sine') {
                const osc = ctx.createOscillator();
                osc.type = 'sine';
                osc.frequency.setValueAtTime(track.freq || 432, ctx.currentTime);

                osc.connect(gainNode);
                osc.start();
                synthOscs.current = [osc];
            } else {
                // Rain simulator: noise generator
                const osc = ctx.createOscillator();
                osc.type = 'sawtooth';
                osc.frequency.setValueAtTime(60, ctx.currentTime); // low rumble frequency
                
                // Add a lowpass filter to make it sound like smooth rain
                const filter = ctx.createBiquadFilter();
                filter.type = 'lowpass';
                filter.frequency.setValueAtTime(300, ctx.currentTime);

                osc.connect(filter);
                filter.connect(gainNode);

                osc.start();
                synthOscs.current = [osc];
            }

            setIsSynthEnabled(true);
        } catch (error) {
            console.error("Failed to start synthesizer audio:", error);
        }
    };

    const stopSynth = () => {
        if (synthOscs.current && synthOscs.current.length > 0) {
            synthOscs.current.forEach(osc => {
                try {
                    osc.stop();
                } catch (e) { }
                osc.disconnect();
            });
            synthOscs.current = [];
        }
        if (synthGain.current) {
            synthGain.current.disconnect();
            synthGain.current = null;
        }
        setIsSynthEnabled(false);
    };

    const togglePlay = () => {
        if (isPlaying) {
            if (isSynthEnabled) {
                stopSynth();
            } else if (audioRef.current) {
                audioRef.current.pause();
            }
            stopBackgroundRain();
            setIsPlaying(false);
        } else {
            setIsPlaying(true);

            if (currentTrack.title === 'Detached Forest Reflection') {
                startBackgroundRain();
            }

            // Try playing standard audio element first
            if (audioRef.current) {
                audioRef.current.src = currentTrack.url;

                // Fallback: If network is offline, synthesize the backing sounds
                audioRef.current.play().catch(err => {
                    console.log("Audio URL load blocked or offline, starting synthesized frequency: ", err);
                    startSynth(currentTrack);
                });
            }
        }
    };

    const selectTrack = (track: AudioTrack) => {
        stopAllAudio();
        setCurrentTrack(track);

        // Auto play on select
        setIsPlaying(true);
        if (track.title === 'Detached Forest Reflection') {
            startBackgroundRain();
        }
        setTimeout(() => {
            if (audioRef.current) {
                audioRef.current.src = track.url;
                audioRef.current.play().catch(e => {
                    startSynth(track);
                });
            }
        }, 100);
    };

    const triggerManualSynth = () => {
        if (isSynthEnabled) {
            stopSynth();
            setIsPlaying(false);
        } else {
            stopAllAudio();
            setIsPlaying(true);
            startSynth(currentTrack);
        }
    };

    // Clean up synth audio context on unmount
    useEffect(() => {
        return () => {
            if (synthOscs.current && synthOscs.current.length > 0) {
                synthOscs.current.forEach(osc => {
                    try { osc.stop(); } catch (e) { }
                    osc.disconnect();
                });
                synthOscs.current = [];
            }
            if (synthGain.current) {
                synthGain.current.disconnect();
            }
            if (synthAudioCtx.current) {
                synthAudioCtx.current.close();
            }
            if (rainIntervalRef.current) {
                clearTimeout(rainIntervalRef.current);
            }
            if (rainLfoRef.current) {
                try { rainLfoRef.current.stop(); } catch (e) {}
                rainLfoRef.current.disconnect();
            }
            if (rainSource.current) {
                try { rainSource.current.stop(); } catch (e) { }
                rainSource.current.disconnect();
            }
            if (rainGain.current) {
                rainGain.current.disconnect();
            }
            if (rainAudioCtx.current) {
                rainAudioCtx.current.close();
            }
        };
    }, []);

    // Header theme colors computed for Relax Mode
    const headerBgColors = {
        zen: 'from-amber-600/10 via-zinc-900 to-zinc-950 border-amber-500/25',
        meditation: 'from-teal-605/10 via-slate-900 to-zinc-950 border-teal-500/25',
        detachment: 'from-indigo-600/10 via-slate-900 to-zinc-950 border-indigo-500/25',
        comics: 'from-pink-600/10 via-slate-900 to-zinc-950 border-pink-500/25'
    };

    const activeCoverGlow = {
        zen: 'shadow-amber-500/10 border-amber-500/20',
        meditation: 'shadow-teal-500/10 border-teal-500/20',
        detachment: 'shadow-indigo-500/10 border-indigo-500/20',
        comics: 'shadow-pink-500/10 border-pink-500/20'
    };

    return (
        <div className="max-w-5xl mx-auto space-y-6 pt-4 pb-16 px-2">
            {/* Audio Ref element */}
            <audio ref={audioRef} />

            {/* Mode Header */}
            <div className={`p-8 rounded-3xl bg-gradient-to-br ${headerBgColors[activeTab]} border shadow-xl transition-all duration-700 relative overflow-hidden group`}>
                <div className="absolute top-0 right-0 p-8 opacity-5 group-hover:scale-110 transition-transform duration-700">
                    <Sparkles className="w-40 h-40 text-primary" />
                </div>

                <h2 className="text-3xl font-black flex items-center gap-3 mb-2 tracking-tight">
                    <Sparkles className="w-8 h-8 text-primary animate-pulse" />
                    Relax Mode
                </h2>
                <p className="text-muted-foreground text-sm max-w-lg leading-relaxed">
                    Bhai, padhai ke beech me relax karna zaroori hai! Apni mental state reset karo aur fresh mind se dubara practice shuru kijiye.
                </p>

                {/* Sub-Option Selector Tabs */}
                <div className="flex flex-wrap gap-2.5 mt-8 border-t border-white/5 pt-6 relative z-10">
                    <button
                        onClick={() => setActiveTab('zen')}
                        className={`px-5 py-2.5 rounded-2xl text-xs font-black uppercase tracking-wider transition-all duration-300 flex items-center gap-2 border ${activeTab === 'zen'
                                ? 'bg-amber-500 border-amber-400 text-slate-950 shadow-md shadow-amber-500/20 scale-103'
                                : 'bg-card border-border hover:bg-muted text-muted-foreground hover:text-foreground'
                            }`}
                    >
                        <Volume2 className="w-4 h-4" /> Zen Frequencies
                    </button>
                    <button
                        onClick={() => setActiveTab('meditation')}
                        className={`px-5 py-2.5 rounded-2xl text-xs font-black uppercase tracking-wider transition-all duration-300 flex items-center gap-2 border ${activeTab === 'meditation'
                                ? 'bg-teal-500 border-teal-400 text-slate-950 shadow-md shadow-teal-500/20 scale-103'
                                : 'bg-card border-border hover:bg-muted text-muted-foreground hover:text-foreground'
                            }`}
                    >
                        <Compass className="w-4 h-4" /> Meditation Guides
                    </button>
                    <button
                        onClick={() => setActiveTab('detachment')}
                        className={`px-5 py-2.5 rounded-2xl text-xs font-black uppercase tracking-wider transition-all duration-300 flex items-center gap-2 border ${activeTab === 'detachment'
                                ? 'bg-indigo-600 border-indigo-500 text-white shadow-md shadow-indigo-500/20 scale-103'
                                : 'bg-card border-border hover:bg-muted text-muted-foreground hover:text-foreground'
                            }`}
                    >
                        <ImageIcon className="w-4 h-4" /> Moh Maya Se Door
                    </button>
                    <button
                        onClick={() => setActiveTab('comics')}
                        className={`px-5 py-2.5 rounded-2xl text-xs font-black uppercase tracking-wider transition-all duration-300 flex items-center gap-2 border ${activeTab === 'comics'
                                ? 'bg-pink-650 border-pink-550 text-white shadow-md shadow-pink-500/20 scale-103'
                                : 'bg-card border-border hover:bg-muted text-muted-foreground hover:text-foreground'
                            }`}
                    >
                        <BookOpen className="w-4 h-4" /> Comic Strip Slider
                    </button>
                </div>
            </div>

            {/* TAB INTERFACE RENDERING */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

                {/* Mode Layout Renderer */}
                <div className="lg:col-span-2 space-y-6">
                    <AnimatePresence mode="wait">

                        {/* ZEN MODE */}
                        {activeTab === 'zen' && (
                            <motion.div
                                key="zen"
                                initial={{ opacity: 0, y: 12 }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0 }}
                                className="p-6 rounded-3xl bg-card border border-border/80 shadow-md space-y-6"
                            >
                                <div className="flex justify-between items-center">
                                    <h3 className="text-xl font-bold flex items-center gap-2">
                                        <Volume2 className="text-amber-500 w-5 h-5" />
                                        Calming Frequencies (Zen Mode)
                                    </h3>
                                    <span className="px-3 py-1 rounded-xl bg-amber-500/10 text-amber-500 text-[10px] font-black uppercase tracking-wider">Ambient</span>
                                </div>
                                <p className="text-xs text-muted-foreground leading-relaxed">
                                    Listen to natural noise generation and ambient backing frequencies to relax your brain waves. Can be played concurrently while taking study notes.
                                </p>

                                {/* Track list */}
                                <div className="space-y-2">
                                    {ZEN_TRACKS.map((track) => (
                                        <button
                                            key={track.title}
                                            onClick={() => selectTrack(track)}
                                            className={`w-full flex items-center justify-between p-4 rounded-2xl border text-left transition-all ${currentTrack.title === track.title
                                                    ? 'bg-amber-500/10 border-amber-550/40 text-amber-400 font-bold'
                                                    : 'bg-muted/15 border-border/40 hover:bg-muted/30 text-foreground'
                                                }`}
                                        >
                                            <div className="flex items-center gap-4">
                                                <div className={`p-2.5 rounded-xl ${currentTrack.title === track.title ? 'bg-amber-500 text-slate-950' : 'bg-muted text-muted-foreground'}`}>
                                                    {currentTrack.title === track.title && isPlaying ? <Pause className="w-4 h-4 fill-current" /> : <Play className="w-4 h-4 fill-current" />}
                                                </div>
                                                <div>
                                                    <h4 className="text-sm font-semibold">{track.title}</h4>
                                                    <p className="text-xs text-muted-foreground font-medium mt-0.5">{track.description}</p>
                                                </div>
                                            </div>
                                            <span className="text-xs text-muted-foreground font-mono">{track.duration}</span>
                                        </button>
                                    ))}
                                </div>
                            </motion.div>
                        )}

                        {/* MEDITATION TAB */}
                        {activeTab === 'meditation' && (
                            <motion.div
                                key="meditation"
                                initial={{ opacity: 0, y: 12 }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0 }}
                                className="p-6 rounded-3xl bg-card border border-border/80 shadow-md space-y-6"
                            >
                                <div className="flex justify-between items-center">
                                    <h3 className="text-xl font-bold flex items-center gap-2">
                                        <Compass className="text-teal-500 w-5 h-5" />
                                        Guided Sleep & Meditation
                                    </h3>
                                    <span className="px-3 py-1 rounded-xl bg-teal-500/10 text-teal-400 text-[10px] font-black uppercase tracking-wider">Yoga Nidra</span>
                                </div>
                                <p className="text-xs text-muted-foreground leading-relaxed font-normal">
                                    Guided somatic scanning tracks and breathing frequency modulations to relax your nervous system. Perfect for power naps or pre-sleep resetting.
                                </p>

                                <div className="space-y-2">
                                    {MEDITATION_TRACKS.map((track) => (
                                        <button
                                            key={track.title}
                                            onClick={() => selectTrack(track)}
                                            className={`w-full flex items-center justify-between p-4 rounded-2xl border text-left transition-all ${currentTrack.title === track.title
                                                    ? 'bg-teal-500/10 border-teal-555/40 text-teal-400 font-bold'
                                                    : 'bg-muted/15 border-border/40 hover:bg-muted/30 text-foreground'
                                                }`}
                                        >
                                            <div className="flex items-center gap-4">
                                                <div className={`p-2.5 rounded-xl ${currentTrack.title === track.title ? 'bg-teal-500 text-slate-950' : 'bg-muted text-muted-foreground'}`}>
                                                    {currentTrack.title === track.title && isPlaying ? <Pause className="w-4 h-4 fill-current" /> : <Play className="w-4 h-4 fill-current" />}
                                                </div>
                                                <div>
                                                    <h4 className="text-sm font-semibold">{track.title}</h4>
                                                    <p className="text-xs text-muted-foreground font-medium mt-0.5">{track.description}</p>
                                                </div>
                                            </div>
                                            <span className="text-xs text-muted-foreground font-mono">{track.duration}</span>
                                        </button>
                                    ))}
                                </div>
                            </motion.div>
                        )}

                        {/* MOH MAYA SE DOOR */}
                        {activeTab === 'detachment' && (
                            <motion.div
                                key="detachment"
                                initial={{ opacity: 0, y: 12 }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0 }}
                                className="space-y-6"
                            >
                                {/* Active Quote Poster card */}
                                <div className={`p-6 rounded-3xl bg-gradient-to-br ${DETACHMENT_POSTERS[detachmentIndex].bgGradient} border border-white/5 shadow-2xl relative overflow-hidden transition-all duration-700 min-h-[300px] flex flex-col justify-between group/poster`}>
                                    <div className="absolute inset-0 bg-black/40" />
                                    {/* Image Overlay */}
                                    <div className="absolute inset-0 opacity-20 mix-blend-overlay group-hover/poster:scale-105 transition-transform duration-[4000ms] pointer-events-none">
                                        <img src={DETACHMENT_POSTERS[detachmentIndex].image} alt="poster" className="w-full h-full object-cover" />
                                    </div>

                                    <div className="relative z-10 flex justify-between items-start">
                                        <span className="px-3 py-1 bg-white/10 backdrop-blur-md rounded-xl text-[9px] font-black uppercase tracking-wider text-slate-205">Sutras of peace</span>
                                        <span className="text-xs font-mono text-white/50">{detachmentIndex + 1} / {DETACHMENT_POSTERS.length}</span>
                                    </div>

                                    {/* Quote Text */}
                                    <div className="relative z-10 text-center my-6 max-w-xl mx-auto space-y-4">
                                        <p className="text-lg md:text-xl font-bold leading-relaxed text-white drop-shadow-md">
                                            "{DETACHMENT_POSTERS[detachmentIndex].quote}"
                                        </p>
                                        <p className="text-xs font-bold text-amber-400 uppercase tracking-widest leading-none">
                                            — {DETACHMENT_POSTERS[detachmentIndex].author}
                                        </p>
                                    </div>

                                    {/* Footer / Controls */}
                                    <div className="relative z-10 flex justify-between items-center transition-all">
                                        <button
                                            onClick={() => setDetachmentIndex(prev => prev === 0 ? DETACHMENT_POSTERS.length - 1 : prev - 1)}
                                            className="p-2 rounded-xl bg-white/5 border border-white/10 hover:bg-white/10 text-white transition-colors"
                                        >
                                            <ArrowLeft className="w-4 h-4" />
                                        </button>
                                        <p className="text-[10px] text-white/40 uppercase font-black tracking-wider">Reflect on this truth</p>
                                        <button
                                            onClick={() => setDetachmentIndex(prev => prev === DETACHMENT_POSTERS.length - 1 ? 0 : prev + 1)}
                                            className="p-2 rounded-xl bg-white/5 border border-white/10 hover:bg-white/10 text-white transition-colors"
                                        >
                                            <ArrowRight className="w-4 h-4" />
                                        </button>
                                    </div>
                                </div>

                                {/* Woodwind Ambient track selector */}
                                <div className="p-6 rounded-3xl bg-card border border-border/80 shadow-md space-y-4">
                                    <h4 className="font-semibold text-sm flex items-center gap-2 text-indigo-400">
                                        <Volume2 className="w-4 h-4" /> Reflective Flutes & Bells (Background Sound)
                                    </h4>
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                        {DETACHMENT_TRACKS.map(track => (
                                            <button
                                                key={track.title}
                                                onClick={() => selectTrack(track)}
                                                className={`p-4 rounded-2xl border text-left transition-all flex items-center justify-between ${currentTrack.title === track.title
                                                        ? 'bg-indigo-500/10 border-indigo-500/35 text-indigo-400 font-bold'
                                                        : 'bg-muted/10 border-border/40 hover:bg-muted/20 text-foreground'
                                                    }`}
                                            >
                                                <div className="min-w-0 pr-2">
                                                    <p className="text-xs font-semibold truncate">{track.title}</p>
                                                    <p className="text-[9px] text-muted-foreground truncate mt-0.5">{track.description}</p>
                                                </div>
                                                <div className="flex-shrink-0 flex items-center gap-2">
                                                    <span className="text-[10px] text-muted-foreground font-mono">{track.duration}</span>
                                                    <div className={`p-1.5 rounded-lg ${currentTrack.title === track.title ? 'bg-indigo-600 text-white' : 'bg-muted'}`}>
                                                        {currentTrack.title === track.title && isPlaying ? <Pause className="w-3 h-3 fill-current" /> : <Play className="w-3 h-3 fill-current" />}
                                                    </div>
                                                </div>
                                            </button>
                                        ))}
                                    </div>
                                </div>
                            </motion.div>
                        )}

                        {/* COMICS CAROUSEL */}
                        {activeTab === 'comics' && (
                            <motion.div
                                key="comics"
                                initial={{ opacity: 0, y: 12 }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0 }}
                                className="space-y-6"
                            >
                                <div className="p-6 rounded-3xl bg-card border border-border/80 shadow-md space-y-6">
                                    <div className="flex justify-between items-center">
                                        <div>
                                            <h3 className="text-lg font-bold flex items-center gap-2">
                                                <BookOpen className="text-pink-500 w-5 h-5" />
                                                Comic PDF Reader
                                            </h3>
                                            <p className="text-xs text-muted-foreground mt-0.5">{HERO_COMICS[comicIndex].title} - {HERO_COMICS[comicIndex].issue}</p>
                                        </div>
                                    </div>

                                    {/* PDF Viewer toolbar */}
                                    <div className="flex flex-wrap gap-4 items-center justify-between bg-zinc-900/90 dark:bg-black/40 border border-slate-700/50 p-3 rounded-2xl">
                                        <div className="flex items-center gap-3">
                                            <span className="text-xs font-mono font-bold text-pink-400 bg-pink-400/10 px-3 py-1.5 rounded-lg border border-pink-400/20">
                                                PAGE {pageIndex + 1} OF {HERO_COMICS[comicIndex].pages.length}
                                            </span>
                                            <div className="h-6 w-[1px] bg-slate-700/50" />
                                            {/* Selector of comics dropdown */}
                                            <select
                                                value={comicIndex}
                                                onChange={(e) => setComicIndex(Number(e.target.value))}
                                                className="bg-transparent border border-slate-755 text-xs font-sans font-black uppercase text-foreground px-2 py-1 rounded-lg focus:outline-none focus:ring-1 focus:ring-pink-500"
                                            >
                                                {HERO_COMICS.map((c, i) => (
                                                    <option key={c.id} value={i} className="dark:bg-zinc-950 font-black">
                                                        {c.title}
                                                    </option>
                                                ))}
                                            </select>
                                        </div>

                                        {/* Zoom Controls */}
                                        <div className="flex items-center gap-2.5">
                                            <button
                                                onClick={handleZoomOut}
                                                className="p-2 bg-muted/65 hover:bg-muted text-foreground border border-border/80 rounded-xl transition-all active:scale-95"
                                                title="Zoom Out"
                                            >
                                                <ZoomOut className="w-4 h-4" />
                                            </button>
                                            <span className="text-xs font-mono font-bold w-12 text-center text-foreground">
                                                {Math.round(zoomScale * 100)}%
                                            </span>
                                            <button
                                                onClick={handleZoomIn}
                                                className="p-2 bg-muted/65 hover:bg-muted text-foreground border border-border/80 rounded-xl transition-all active:scale-95"
                                                title="Zoom In"
                                            >
                                                <ZoomIn className="w-4 h-4" />
                                            </button>
                                            <button
                                                onClick={handleResetZoom}
                                                className="p-2 bg-muted/65 hover:bg-muted text-foreground border border-border/80 rounded-xl transition-all active:scale-95"
                                                title="Reset Zoom"
                                            >
                                                <RotateCcw className="w-3.5 h-3.5" />
                                            </button>
                                        </div>

                                        {/* Navigation page controls */}
                                        <div className="flex items-center gap-2">
                                            <button
                                                onClick={handlePrevPage}
                                                className="px-3.5 py-2 bg-muted/65 hover:bg-muted border border-border/80 rounded-xl text-xs font-bold transition-all"
                                            >
                                                Prev Page
                                            </button>
                                            <button
                                                onClick={handleNextPage}
                                                className="px-3.5 py-2 bg-pink-650 hover:bg-pink-700 text-white rounded-xl text-xs font-bold transition-all shadow-md shadow-pink-500/10"
                                            >
                                                Next Page
                                            </button>
                                            <button
                                                onClick={() => setIsComicZoomed(true)}
                                                className="p-2 bg-orange-500/10 hover:bg-orange-500/20 text-orange-400 border border-orange-500/20 rounded-xl transition-all active:scale-95"
                                                title="Expand View"
                                            >
                                                <Maximize2 className="w-4 h-4" />
                                            </button>
                                        </div>
                                    </div>

                                    {/* Main PDF Content Board */}
                                    <div className="flex flex-col md:flex-row gap-4 min-h-[550px] border border-border/60 rounded-2xl overflow-hidden bg-zinc-950/20">
                                        {/* Thumbnails Sidebar */}
                                        <div className="w-full md:w-24 bg-zinc-900/50 p-3 flex md:flex-col gap-3 justify-center md:justify-start items-center border-b md:border-b-0 md:border-r border-border/60 overflow-y-auto">
                                            {HERO_COMICS[comicIndex].pages.map((page, idx) => (
                                                <button
                                                    key={idx}
                                                    onClick={() => { setPageIndex(idx); setZoomScale(1.0); }}
                                                    className={`w-16 h-20 rounded-lg overflow-hidden border-2 transition-all relative group flex-shrink-0 ${pageIndex === idx ? 'border-pink-500 shadow-md shadow-pink-500/10' : 'border-slate-800 hover:border-slate-600'}`}
                                                >
                                                    <img src={page} alt={`page-${idx+1}`} className="w-full h-full object-cover" />
                                                    <div className="absolute inset-0 bg-black/40 flex items-center justify-center">
                                                        <span className="text-[10px] font-mono font-black text-white">{idx + 1}</span>
                                                    </div>
                                                </button>
                                            ))}
                                        </div>

                                        {/* Scrollable Center Canvas Viewport */}
                                        <div className="flex-1 bg-zinc-900 border border-transparent rounded-r-2xl overflow-auto relative p-6 flex justify-center items-center min-h-[500px]">
                                            <div 
                                                className="transition-transform duration-200 ease-out origin-center"
                                                style={{ transform: `scale(${zoomScale})` }}
                                            >
                                                <div className="relative rounded-xl border-4 border-slate-950 bg-black shadow-2xl max-w-[380px] md:max-w-[420px] aspect-[3/4] overflow-hidden group">
                                                    <img 
                                                        src={HERO_COMICS[comicIndex].pages[pageIndex]} 
                                                        alt="running page" 
                                                        className="w-full h-full object-cover"
                                                    />
                                                    {/* Halftone print visual design */}
                                                    <div className="absolute inset-0 bg-repeat bg-center opacity-[0.03] pointer-events-none mix-blend-overlay" style={{ backgroundImage: 'radial-gradient(circle, #000 20%, transparent 20%)', backgroundSize: '6px 6px' }} />
                                                    
                                                    {/* Page Number corner index tag */}
                                                    <div className="absolute bottom-3 right-3 bg-yellow-100 border-2 border-black text-slate-950 font-mono text-[9px] font-black uppercase tracking-wider px-2 py-0.5 rounded shadow-[2px_2px_0px_rgba(0,0,0,1)]">
                                                        PG {pageIndex + 1}
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </motion.div>
                        )}
                    </AnimatePresence>
                </div>

                {/* SHARED RIGHT SIDE: ACTIVE AUDIO DECK & FREQUENCY MIXER */}
                <div className="lg:col-span-1 space-y-6">

                    {/* Audio controller deck */}
                    <div className={`p-6 rounded-3xl bg-card border ${isPlaying ? activeCoverGlow[activeTab] : 'border-border/80'} shadow-xl space-y-6 transition-all duration-500`}>
                        <div className="text-center font-black uppercase text-[10px] text-muted-foreground tracking-widest border-b border-border/40 pb-3">
                            Now Channeling
                        </div>

                        {/* Disc Spinning illustration */}
                        <div className="flex justify-center my-2">
                            <div className="relative">
                                <div className="absolute inset-0 bg-primary/20 rounded-full blur-2xl animate-pulse pointer-events-none" />
                                <div className={`w-28 h-28 rounded-full border-4 border-slate-800/80 bg-zinc-950 flex items-center justify-center shadow-2xl relative overflow-hidden group ${isPlaying ? 'animate-spin' : ''
                                    }`} style={{ animationDuration: '8s' }}>
                                    <div className="w-8 h-8 rounded-full bg-slate-900 border-2 border-slate-700 flex items-center justify-center z-10 shadow-inner">
                                        <div className="w-2.5 h-2.5 rounded-full bg-primary" />
                                    </div>
                                    <div className="absolute top-0 right-0 w-full h-full opacity-35 bg-gradient-to-tr from-primary via-transparent to-primary-foreground pointer-events-none" />
                                </div>
                            </div>
                        </div>

                        {/* Track specifications */}
                        <div className="text-center space-y-1.5">
                            <h4 className="font-bold text-base truncate px-2">{currentTrack.title}</h4>
                            <p className="text-xs text-muted-foreground px-2 line-clamp-2 min-h-[2rem] leading-normal">{currentTrack.description}</p>
                        </div>

                        {/* Custom Synth generator status option */}
                        {activeTab === 'zen' && currentTrack.synthType && (
                            <div className="bg-primary/5 rounded-2xl border border-primary/20 p-3.5 flex items-center justify-between">
                                <div className="flex items-center gap-2">
                                    <div className="w-2 h-2 rounded-full bg-gradient-to-r from-amber-400 to-primary animate-ping" />
                                    <span className="text-[10px] font-black text-primary uppercase tracking-wider">Offline Synth Ready</span>
                                </div>
                                <button
                                    onClick={triggerManualSynth}
                                    className={`px-3 py-1.5 rounded-xl border text-[9px] font-black uppercase tracking-wider transition-all active:scale-95 ${isSynthEnabled
                                            ? 'bg-amber-500 border-amber-400 text-slate-950'
                                            : 'bg-card border-border hover:bg-muted text-muted-foreground'
                                        }`}
                                >
                                    {isSynthEnabled ? 'Stop Synth' : 'Trigger Synth'}
                                </button>
                            </div>
                        )}

                        {/* Seek bar */}
                        <div className="space-y-1.5">
                            <div className="w-full h-1 bg-muted rounded-full overflow-hidden relative">
                                <div className="h-full bg-primary rounded-full transition-all duration-300" style={{ width: `${progress}%` }} />
                            </div>
                            <div className="flex justify-between items-center text-[10px] text-muted-foreground font-mono">
                                <span>{currentTimeText}</span>
                                <span>{isSynthEnabled ? '∞' : duration}</span>
                            </div>
                        </div>

                        {/* Controls bar */}
                        <div className="flex justify-center items-center gap-6">
                            <button
                                onClick={stopAllAudio}
                                className="p-3 rounded-full hover:bg-muted transition-colors text-muted-foreground hover:text-foreground border border-transparent hover:border-border"
                                title="Reset Track"
                            >
                                <RefreshCw className="w-4 h-4" />
                            </button>
                            <button
                                onClick={togglePlay}
                                className="w-14 h-14 rounded-full gradient-primary hover:shadow-lg hover:shadow-primary/20 flex items-center justify-center text-white transition-all active:scale-95 shadow-md"
                            >
                                {isPlaying ? <Pause className="w-6 h-6 fill-current" /> : <Play className="w-6 h-6 fill-current translate-x-0.5" />}
                            </button>
                            <button
                                onClick={() => setIsMuted(!isMuted)}
                                className="p-3 rounded-full hover:bg-muted transition-colors text-muted-foreground hover:text-foreground border border-transparent hover:border-border"
                            >
                                {isMuted ? <VolumeX className="w-4 h-4 text-red-500" /> : <Volume2 className="w-4 h-4" />}
                            </button>
                        </div>

                        {/* Volume bar */}
                        <div className="flex items-center gap-3 bg-muted/20 p-3 rounded-2xl border border-border/40">
                            <Volume2 className="w-4 h-4 text-muted-foreground flex-shrink-0" />
                            <input
                                type="range"
                                min="0"
                                max="1"
                                step="0.05"
                                value={volume}
                                onChange={(e) => setVolume(parseFloat(e.target.value))}
                                className="w-full h-1 bg-muted rounded-lg appearance-none cursor-pointer accent-primary"
                            />
                        </div>
                    </div>
                </div>

            </div>

            {/* COMIC ZOOM LIGHTBOX VIEW */}
            <AnimatePresence>
                {isComicZoomed && (
                    <div className="fixed inset-0 z-[2800] flex items-center justify-center p-4">
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            onClick={() => setIsComicZoomed(false)}
                            className="absolute inset-0 bg-black/95 backdrop-blur-md"
                        />

                        <button
                            onClick={() => setIsComicZoomed(false)}
                            className="absolute top-6 right-6 p-2.5 rounded-full bg-white/5 hover:bg-white/10 text-white transition-colors border border-white/10 z-[2850]"
                        >
                            <X className="w-5 h-5" />
                        </button>

                        <motion.div
                            initial={{ scale: 0.9, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            exit={{ scale: 0.9, opacity: 0 }}
                            transition={{ type: "spring", stiffness: 300, damping: 25 }}
                            className="relative w-[90vw] h-[85vh] bg-zinc-950 border border-white/10 rounded-[2.5rem] overflow-hidden flex flex-col justify-between"
                        >
                            {/* Toolbar */}
                            <div className="bg-black/60 border-b border-white/10 p-4 flex justify-between items-center backdrop-blur-md">
                                <span className="text-xs font-mono font-bold text-pink-400 bg-pink-400/10 px-3 py-1 rounded-lg border border-pink-400/20">
                                    PAGE {pageIndex + 1} OF {HERO_COMICS[comicIndex].pages.length}
                                </span>
                                
                                {/* Zoom Controls */}
                                <div className="flex items-center gap-2">
                                    <button
                                        onClick={handleZoomOut}
                                        className="p-1.5 bg-white/5 hover:bg-white/10 text-white rounded-lg transition-transform active:scale-95 animate-none"
                                        title="Zoom Out"
                                    >
                                        <ZoomOut className="w-4 h-4" />
                                    </button>
                                    <span className="text-xs font-mono text-white/80 w-12 text-center">
                                        {Math.round(zoomScale * 100)}%
                                    </span>
                                    <button
                                        onClick={handleZoomIn}
                                        className="p-1.5 bg-white/5 hover:bg-white/10 text-white rounded-lg transition-transform active:scale-95 animate-none"
                                        title="Zoom In"
                                    >
                                        <ZoomIn className="w-4 h-4" />
                                    </button>
                                    <button
                                        onClick={handleResetZoom}
                                        className="p-1.5 bg-white/5 hover:bg-white/10 text-white rounded-lg transition-transform active:scale-95 animate-none"
                                        title="Reset Zoom"
                                    >
                                        <RotateCcw className="w-3.5 h-3.5" />
                                    </button>
                                </div>

                                <div className="flex items-center gap-2">
                                    <button 
                                        onClick={handlePrevPage}
                                        className="px-3 py-1 bg-white/10 hover:bg-white/20 text-white text-xs rounded-lg transition-all"
                                    >
                                        Prev
                                    </button>
                                    <button 
                                        onClick={handleNextPage}
                                        className="px-3 py-1 bg-pink-650 hover:bg-pink-700 text-white text-xs rounded-lg transition-all"
                                    >
                                        Next
                                    </button>
                                </div>
                            </div>

                            {/* Canvas Viewport */}
                            <div className="flex-1 overflow-auto flex items-center justify-center p-6 bg-zinc-900/50">
                                <div 
                                    className="transition-transform duration-200 ease-out origin-center"
                                    style={{ transform: `scale(${zoomScale})` }}
                                >
                                    <img
                                        src={HERO_COMICS[comicIndex].pages[pageIndex]}
                                        alt="comic-full"
                                        className="max-h-[60vh] object-contain rounded-2xl shadow-[0_20px_50px_rgba(0,0,0,0.8)] border-4 border-black"
                                    />
                                </div>
                            </div>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>
        </div>
    );
}
