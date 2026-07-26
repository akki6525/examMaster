import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
    Sparkles, Compass, Play, Pause, Volume2, SkipForward, SkipBack,
    Image as ImageIcon, BookOpen, VolumeX, RefreshCw, ZoomIn, ZoomOut,
    ArrowLeft, ArrowRight, Info, Heart, X, RotateCcw, Maximize2, Minimize2
} from 'lucide-react';
import { useAuthStore } from '../stores/authStore';
import { WISDOM_QUOTES } from '../data/wisdomQuotes';

// Define structures of sub-modes
type SubMode = 'zen' | 'meditation' | 'detachment' | 'songs';

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

// Predefined detachment posters are now loaded from the wisdomQuotes.ts database module

// Devotional songs playlist array
const DEVOTIONAL_TRACKS = [
    {
        id: 1,
        title: "Shiv Kailash Live (Sitar for Mental Health)",
        artist: "Rishab Rikhiram Sharma",
        videoId: "Onb6_bRJ0Bw",
        start: 149,
        thumbnail: "https://images.unsplash.com/photo-1620121692029-d088224ddc74?q=80&w=400&auto=format&fit=crop",
        tags: ["Shiv", "Sitar", "Calm Focus"]
    },
    {
        id: 2,
        title: "Shiv Tandav Stotram (Divine Meditative Sitar & Drums)",
        artist: "Traditional Spiritual Vibrations",
        videoId: "Y2F89jASt6U",
        start: 0,
        thumbnail: "https://images.unsplash.com/photo-1506126613408-eca07ce68773?q=80&w=400&auto=format&fit=crop",
        tags: ["Shiv", "Sitar", "Energy"]
    },
    {
        id: 3,
        title: "Maha Mrityunjaya Mantra (108 Times Peace Chant)",
        artist: "Shankar Sahney",
        videoId: "73_1biulkYk",
        start: 0,
        thumbnail: "https://images.unsplash.com/photo-1545205597-3d9d02c29597?q=80&w=400&auto=format&fit=crop",
        tags: ["Shiv", "Chant", "Inner Peace"]
    },
    {
        id: 4,
        title: "Shri Ram Siya Ram Instrumental (Flute & Sitar Meditation)",
        artist: "Traditional Healing Sounds",
        videoId: "p_5x6b4gX1E",
        start: 0,
        thumbnail: "https://images.unsplash.com/photo-1518241353330-0f7941c2d9b5?q=80&w=400&auto=format&fit=crop",
        tags: ["Ram", "Flute", "Divine"]
    },
    {
        id: 5,
        title: "Ram Aayenge Instrumental (Peaceful Meditative Flute)",
        artist: "Divine Sacred Flute",
        videoId: "bNfWJjQ_zN8",
        start: 0,
        thumbnail: "https://images.unsplash.com/photo-1507525428034-b723cf961d3e?q=80&w=400&auto=format&fit=crop",
        tags: ["Ram", "Flute", "Calm"]
    },
    {
        id: 6,
        title: "Hanuman Chalisa Instrumental (Peaceful Flute & Veena)",
        artist: "Traditional Sacred Recitals",
        videoId: "AETFvQonfzc",
        start: 0,
        thumbnail: "https://images.unsplash.com/photo-1519817650390-64a93db51149?q=80&w=400&auto=format&fit=crop",
        tags: ["Hanuman", "Flute", "Protection"]
    },
    {
        id: 7,
        title: "Achyutam Keshavam Instrumental (Peaceful Flute)",
        artist: "Traditional Healing Sounds",
        videoId: "6OUwJZ0CMwk",
        start: 11,
        thumbnail: "https://images.unsplash.com/photo-1544790181-36ba9657ddd0?q=80&w=400&auto=format&fit=crop",
        tags: ["Krishna", "Flute", "Inner Peace"]
    },
    {
        id: 8,
        title: "Shree Krishna Govind Hare Murari (Relaxing Flute)",
        artist: "Sacred Flute Ensemble",
        videoId: "g8u4q8WvO1w",
        start: 0,
        thumbnail: "https://images.unsplash.com/photo-1470071459604-3b5ec3a7fe05?q=80&w=400&auto=format&fit=crop",
        tags: ["Krishna", "Flute", "Meditation"]
    },
    {
        id: 9,
        title: "Radhe Radhe Barsane Wali Radhe (Soothing Flute)",
        artist: "Divine Soundscape",
        videoId: "S8z1M53o8B0",
        start: 0,
        thumbnail: "https://images.unsplash.com/photo-1518837695005-2083093ee35b?q=80&w=400&auto=format&fit=crop",
        tags: ["Krishna", "Flute", "Bhakti"]
    },
    {
        id: 10,
        title: "Ganga Ke Kinare (Divine Soothing Raga)",
        artist: "Ganga Recital",
        videoId: "ocRzt5NvI7A",
        start: 0,
        thumbnail: "https://images.unsplash.com/photo-1608976328267-e673d3ec06ce?q=80&w=400&auto=format&fit=crop",
        tags: ["Ganga", "Sitar", "Divine Calm"]
    },
    {
        id: 11,
        title: "Raga Yaman - Evening Mindful Meditation (Sitar)",
        artist: "Pt. Ravi Shankar",
        videoId: "42-Xy6gH_Bw",
        start: 0,
        thumbnail: "https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?q=80&w=400&auto=format&fit=crop",
        tags: ["Sitar", "Raga", "Focus"]
    },
    {
        id: 12,
        title: "Gayatri Mantra 108 Times (Calming Mind Chants)",
        artist: "Sacred Chants",
        videoId: "gPqW65R38X0",
        start: 0,
        thumbnail: "https://images.unsplash.com/photo-1506126613408-eca07ce68773?q=80&w=400&auto=format&fit=crop",
        tags: ["Chant", "Peace", "Mindfulness"]
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
    const [zenTime, setZenTime] = useState(0);

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
    const [selectedAuthorFilter, setSelectedAuthorFilter] = useState<'Bhagavad Gita' | 'Kabir Das' | 'Gautama Buddha'>('Bhagavad Gita');
    const [selectedLanguage, setSelectedLanguage] = useState<'hindi' | 'english' | 'hinglish'>('hindi');
    const [posterSize, setPosterSize] = useState<'small' | 'large'>('large');
    const [enable3D, setEnable3D] = useState(true);

    const [rotateX, setRotateX] = useState(0);
    const [rotateY, setRotateY] = useState(0);

    const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
        if (!enable3D) return;
        const rect = e.currentTarget.getBoundingClientRect();
        const width = rect.width;
        const height = rect.height;
        const x = e.clientX - rect.left - width / 2;
        const y = e.clientY - rect.top - height / 2;
        setRotateX(-(y / height) * 24);
        setRotateY((x / width) * 24);
    };

    const handleMouseLeave = () => {
        setRotateX(0);
        setRotateY(0);
    };

    // Reset index when author filter changes
    useEffect(() => {
        setDetachmentIndex(0);
    }, [selectedAuthorFilter]);

    // Devotional song playlist active index state
    const [activeSongIndex, setActiveSongIndex] = useState(0);
    const [songFilterTag, setSongFilterTag] = useState<string>('All');
    const [isYtPlaying, setIsYtPlaying] = useState(false);
    const [ytCurrentTime, setYtCurrentTime] = useState(0);
    const [ytDuration, setYtDuration] = useState(0);
    const [isYtFullscreen, setIsYtFullscreen] = useState(false);
    const [controlsVisible, setControlsVisible] = useState(true);
    const [ytVolume, setYtVolume] = useState(70);
    const [isYtMuted, setIsYtMuted] = useState(false);

    const filteredDevotionalTracks = songFilterTag === 'All'
        ? DEVOTIONAL_TRACKS
        : DEVOTIONAL_TRACKS.filter(song => song.tags.some(t => t.toLowerCase() === songFilterTag.toLowerCase() || t.toLowerCase().includes(songFilterTag.toLowerCase())));

    const playerRef = useRef<any>(null);
    const ytContainerRef = useRef<HTMLDivElement>(null);
    const controlsTimeoutRef = useRef<NodeJS.Timeout | null>(null);

    // Sync YT Volume
    useEffect(() => {
        if (playerRef.current && typeof playerRef.current.setVolume === 'function') {
            if (isYtMuted) {
                playerRef.current.mute();
            } else {
                playerRef.current.unMute();
                playerRef.current.setVolume(ytVolume);
            }
        }
    }, [ytVolume, isYtMuted]);

    // Injection of YouTube Iframe Player API script
    useEffect(() => {
        if (!(window as any).YT) {
            const tag = document.createElement('script');
            tag.src = "https://www.youtube.com/iframe_api";
            const firstScriptTag = document.getElementsByTagName('script')[0];
            firstScriptTag.parentNode?.insertBefore(tag, firstScriptTag);
        }
    }, []);

    // Helper to format track seconds into MM:SS
    const formatTimeSeconds = (secs: number) => {
        if (isNaN(secs)) return "0:00";
        const minutes = Math.floor(secs / 60);
        const remainingSeconds = Math.floor(secs % 60);
        return `${minutes}:${remainingSeconds < 10 ? '0' : ''}${remainingSeconds}`;
    };

    // Auto-hide controls when playing and mouse is idle
    const resetControlsTimeout = () => {
        setControlsVisible(true);
        if (controlsTimeoutRef.current) {
            clearTimeout(controlsTimeoutRef.current);
        }
        if (isYtPlaying) {
            controlsTimeoutRef.current = setTimeout(() => {
                setControlsVisible(false);
            }, 3000);
        }
    };

    useEffect(() => {
        resetControlsTimeout();
        return () => {
            if (controlsTimeoutRef.current) {
                clearTimeout(controlsTimeoutRef.current);
            }
        };
    }, [isYtPlaying]);

    // Handle play/pause toggling
    const handleTogglePlay = () => {
        if (playerRef.current) {
            if (isYtPlaying) {
                playerRef.current.pauseVideo();
            } else {
                playerRef.current.playVideo();
            }
        }
    };

    // Handle progress bar drag/change
    const handleSeekChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const val = parseFloat(e.target.value);
        if (playerRef.current) {
            playerRef.current.seekTo(val, true);
            setYtCurrentTime(val);
        }
    };

    // Toggle container custom fullscreen
    const toggleYtFullscreen = () => {
        const el = ytContainerRef.current;
        if (!el) return;

        if (!document.fullscreenElement) {
            el.requestFullscreen().then(() => {
                setIsYtFullscreen(true);
            }).catch((err) => {
                console.error("Fullscreen request failed:", err);
            });
        } else {
            document.exitFullscreen().then(() => {
                setIsYtFullscreen(false);
            }).catch((err) => {
                console.error("Exit fullscreen failed:", err);
            });
        }
    };

    // Track fullscreen status changes via listener
    useEffect(() => {
        const onFullscreenChange = () => {
            setIsYtFullscreen(document.fullscreenElement === ytContainerRef.current);
        };
        document.addEventListener('fullscreenchange', onFullscreenChange);
        document.addEventListener('webkitfullscreenchange', onFullscreenChange);
        return () => {
            document.removeEventListener('fullscreenchange', onFullscreenChange);
            document.removeEventListener('webkitfullscreenchange', onFullscreenChange);
        };
    }, []);

    // Create / Rebuild YouTube player instance
    useEffect(() => {
        if (activeTab !== 'songs') {
            if (playerRef.current) {
                try {
                    playerRef.current.destroy();
                } catch (e) { }
                playerRef.current = null;
                setIsYtPlaying(false);
            }
            return;
        }

        let playerInstance: any = null;
        let isMounted = true;

        const loadPlayer = () => {
            if (!(window as any).YT || !(window as any).YT.Player) {
                setTimeout(loadPlayer, 100);
                return;
            }

            // Cleanup previous instantiations if any
            if (playerRef.current) {
                try {
                    playerRef.current.destroy();
                } catch (e) { }
                playerRef.current = null;
            }

            const activeTrack = DEVOTIONAL_TRACKS[activeSongIndex];
            playerInstance = new (window as any).YT.Player("devotional-yt-iframe", {
                videoId: activeTrack.videoId,
                playerVars: {
                    autoplay: 0,
                    controls: 0,
                    disablekb: 1,
                    fs: 0,
                    rel: 0,
                    modestbranding: 1,
                    start: activeTrack.start || 0,
                    origin: window.location.origin
                },
                events: {
                    onReady: (event: any) => {
                        if (!isMounted) return;
                        playerRef.current = event.target;
                        setYtDuration(event.target.getDuration() || 0);
                        if (typeof event.target.setVolume === 'function') {
                            if (isYtMuted) {
                                event.target.mute();
                            } else {
                                event.target.unMute();
                                event.target.setVolume(ytVolume);
                            }
                        }
                    },
                    onStateChange: (event: any) => {
                        if (!isMounted) return;
                        const state = event.data;
                        if (state === 1) { // playing
                            setIsYtPlaying(true);
                            // Auto stop other ambient audios in RelaxMode
                            setIsPlaying(false);
                            stopSynth();
                            stopBackgroundRain();
                        } else if (state === 2 || state === 0) { // paused or ended
                            setIsYtPlaying(false);
                        }
                    }
                }
            });
        };

        loadPlayer();

        // Progress polling loop
        const progressTimer = setInterval(() => {
            if (playerRef.current && typeof playerRef.current.getCurrentTime === 'function') {
                const currentSecs = playerRef.current.getCurrentTime() || 0;
                setYtCurrentTime(currentSecs);
                const totalDur = playerRef.current.getDuration() || 0;
                if (totalDur && totalDur !== ytDuration) {
                    setYtDuration(totalDur);
                }
            }
        }, 333);

        return () => {
            isMounted = false;
            clearInterval(progressTimer);
            if (playerInstance) {
                try {
                    playerInstance.destroy();
                } catch (e) { }
            }
            playerRef.current = null;
            setIsYtPlaying(false);
        };
    }, [activeTab, activeSongIndex]);

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

    // Simulated progress for silent Zen Frequencies
    useEffect(() => {
        if (activeTab !== 'zen' || !isPlaying) return;

        const totalSecs = (() => {
            const parts = currentTrack.duration.split(':');
            if (parts.length === 2) {
                return parseInt(parts[0], 10) * 60 + parseInt(parts[1], 10);
            }
            return 300;
        })();

        // Set duration initially
        setDuration(currentTrack.duration);

        const interval = setInterval(() => {
            setZenTime(prev => {
                const nextSecs = prev + 1;
                if (nextSecs >= totalSecs) {
                    setIsPlaying(false);
                    setProgress(0);
                    setCurrentTimeText('0:00');
                    return 0;
                }
                const pct = (nextSecs / totalSecs) * 100;
                setProgress(pct);
                const mins = Math.floor(nextSecs / 60);
                const secs = nextSecs % 60;
                setCurrentTimeText(`${mins}:${secs.toString().padStart(2, '0')}`);
                return nextSecs;
            });
        }, 1000);

        return () => clearInterval(interval);
    }, [isPlaying, activeTab, currentTrack]);

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
                } catch (e) { }

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
            try { rainLfoRef.current.stop(); } catch (e) { }
            rainLfoRef.current.disconnect();
            rainLfoRef.current = null;
        }

        // Stop brown noise source loop
        if (rainSource.current) {
            try { rainSource.current.stop(); } catch (e) { }
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
        setZenTime(0);

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
            if (activeTab !== 'zen') {
                gainNode.connect(ctx.destination);
            }
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

            if (activeTab !== 'zen') {
                // Try playing standard audio element first
                if (audioRef.current) {
                    audioRef.current.src = currentTrack.url;

                    // Fallback: If network is offline, synthesize the backing sounds
                    audioRef.current.play().catch(err => {
                        console.log("Audio URL load blocked or offline, starting synthesized frequency: ", err);
                        startSynth(currentTrack);
                    });
                }
            } else {
                setIsSynthEnabled(true);
            }
        }
    };

    const selectTrack = (track: AudioTrack) => {
        stopAllAudio();
        setZenTime(0);
        setCurrentTrack(track);

        // Auto play on select
        setIsPlaying(true);
        if (track.title === 'Detached Forest Reflection') {
            startBackgroundRain();
        }

        if (activeTab !== 'zen') {
            setTimeout(() => {
                if (audioRef.current) {
                    audioRef.current.src = track.url;
                    audioRef.current.play().catch(e => {
                        startSynth(track);
                    });
                }
            }, 100);
        } else {
            setIsSynthEnabled(true);
        }
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
                try { rainLfoRef.current.stop(); } catch (e) { }
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
        songs: 'from-amber-600/10 via-slate-900 to-zinc-950 border-amber-500/25'
    };

    const activeCoverGlow = {
        zen: 'shadow-amber-500/10 border-amber-500/20',
        meditation: 'shadow-teal-500/10 border-teal-500/20',
        detachment: 'shadow-indigo-500/10 border-indigo-500/20',
        songs: 'shadow-amber-500/10 border-amber-500/20'
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
                        <ImageIcon className="w-4 h-4" />Bhagvad Gita/Kabir/Buddha
                    </button>
                    <button
                        onClick={() => setActiveTab('songs')}
                        className={`px-5 py-2.5 rounded-2xl text-xs font-black uppercase tracking-wider transition-all duration-300 flex items-center gap-2 border ${activeTab === 'songs'
                            ? 'bg-amber-600 border-amber-500 text-white shadow-md shadow-amber-500/25 scale-103'
                            : 'bg-card border-border hover:bg-muted text-muted-foreground hover:text-foreground'
                            }`}
                    >
                        <Volume2 className="w-4 h-4" /> Devotional Songs
                    </button>
                </div>
            </div>

            {/* TAB INTERFACE RENDERING */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

                {/* Mode Layout Renderer */}
                <div className={`${activeTab === 'songs' ? 'lg:col-span-3' : 'lg:col-span-2'} space-y-6`}>
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
                                {/* Category Selectors for Gita, Kabir, Buddha */}
                                <div className="flex justify-center items-center gap-2 mb-4 bg-muted/20 p-1.5 rounded-2xl border border-border/40 w-fit mx-auto shadow-sm">
                                    <button
                                        onClick={() => setSelectedAuthorFilter('Bhagavad Gita')}
                                        className={`px-4 py-1.5 rounded-xl text-xs font-bold transition-all ${selectedAuthorFilter === 'Bhagavad Gita' ? 'bg-amber-500 text-slate-950 font-black shadow-md' : 'text-muted-foreground hover:text-foreground'}`}
                                    >
                                        Bhagavad Gita 🕉️
                                    </button>
                                    <button
                                        onClick={() => setSelectedAuthorFilter('Kabir Das')}
                                        className={`px-4 py-1.5 rounded-xl text-xs font-bold transition-all ${selectedAuthorFilter === 'Kabir Das' ? 'bg-amber-500 text-slate-950 font-black shadow-md' : 'text-muted-foreground hover:text-foreground'}`}
                                    >
                                        Kabir Das ✍️
                                    </button>
                                    <button
                                        onClick={() => setSelectedAuthorFilter('Gautama Buddha')}
                                        className={`px-4 py-1.5 rounded-xl text-xs font-bold transition-all ${selectedAuthorFilter === 'Gautama Buddha' ? 'bg-amber-500 text-slate-950 font-black shadow-md' : 'text-muted-foreground hover:text-foreground'}`}
                                    >
                                        Gautama Buddha ☸️
                                    </button>
                                </div>

                                {/* Active Quote Poster card */}
                                {(() => {
                                    const filteredQuotes = WISDOM_QUOTES.filter(q => q.author === selectedAuthorFilter);
                                    if (filteredQuotes.length === 0) return null;
                                    const activeQuote = filteredQuotes[detachmentIndex] || filteredQuotes[0];

                                    let quoteText = activeQuote.hindi;
                                    if (selectedLanguage === 'english') quoteText = activeQuote.english;
                                    else if (selectedLanguage === 'hinglish') quoteText = activeQuote.hinglish;

                                    return (
                                        <div
                                            onMouseMove={handleMouseMove}
                                            onMouseLeave={handleMouseLeave}
                                            style={enable3D ? {
                                                transform: `perspective(1000px) rotateX(${rotateX}deg) rotateY(${rotateY}deg) scale(1.025)`,
                                                boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.5)',
                                                transition: 'transform 0.15s ease-out, box-shadow 0.15s ease-out'
                                            } : {
                                                transition: 'all 0.5s ease-in-out'
                                            }}
                                            className={`p-6 rounded-3xl bg-gradient-to-br ${activeQuote.bg} border border-white/5 relative overflow-hidden flex flex-col justify-between group/poster mx-auto ${posterSize === 'small'
                                                ? 'min-h-[220px] max-w-md py-4 px-5'
                                                : 'min-h-[360px] max-w-2xl'
                                                }`}
                                        >
                                            {/* Background Image Overlay */}
                                            <div className="absolute inset-0 opacity-75 group-hover/poster:scale-105 transition-transform duration-[4000ms] pointer-events-none">
                                                <img src={activeQuote.img} alt="poster" className="w-full h-full object-cover" />
                                            </div>

                                            {/* Premium Gradient Overlay to ensure readability & depth */}
                                            <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/40 to-black/30" />

                                            {/* Top Control Bar inside poster */}
                                            <div className="relative z-10 flex justify-between items-center gap-2">
                                                <span className="px-2.5 py-0.5 bg-amber-500/10 border border-amber-500/20 text-amber-200 text-[9px] font-black uppercase tracking-wider rounded-lg">Sutras of peace</span>

                                                <div className="flex items-center gap-2">
                                                    {/* Language Switcher */}
                                                    <select
                                                        value={selectedLanguage}
                                                        onChange={(e) => setSelectedLanguage(e.target.value as any)}
                                                        className="bg-white/10 hover:bg-white/20 backdrop-blur-md border border-white/20 rounded-lg text-[9px] font-bold text-white px-2 py-0.5 focus:outline-none cursor-pointer transition-colors"
                                                    >
                                                        <option value="hindi" className="bg-slate-900 text-white font-semibold">Hindi</option>
                                                        <option value="hinglish" className="bg-slate-900 text-white font-semibold">Hinglish</option>
                                                        <option value="english" className="bg-slate-900 text-white font-semibold">English</option>
                                                    </select>

                                                    {/* Size Toggler */}
                                                    <button
                                                        onClick={(e) => {
                                                            e.stopPropagation();
                                                            setPosterSize(prev => prev === 'large' ? 'small' : 'large');
                                                        }}
                                                        className="p-1 px-2 bg-white/10 hover:bg-white/20 backdrop-blur-md border border-white/20 rounded-lg text-[8px] font-black uppercase text-white transition-all"
                                                    >
                                                        {posterSize === 'large' ? 'Compact' : 'Expand'}
                                                    </button>

                                                    {/* 3D Toggler */}
                                                    <button
                                                        onClick={(e) => {
                                                            e.stopPropagation();
                                                            setEnable3D(prev => !prev);
                                                        }}
                                                        className={`p-1 px-2 ${enable3D ? 'bg-amber-500/20 border-amber-500/40 text-amber-300 font-extrabold' : 'bg-white/10 border-white/20 text-white'} hover:bg-white/20 backdrop-blur-md border rounded-lg text-[8px] uppercase transition-all`}
                                                    >
                                                        {enable3D ? '3D' : '2D'}
                                                    </button>
                                                </div>

                                                <span className="text-[10px] font-mono text-white/50">{detachmentIndex + 1} / {filteredQuotes.length}</span>
                                            </div>

                                            {/* Quote Text */}
                                            <div className="relative z-10 text-center my-6 max-w-xl mx-auto space-y-4">
                                                <p className={`font-extrabold leading-relaxed text-white drop-shadow-[0_4px_6px_rgba(0,0,0,0.8)] filter transition-all tracking-wide ${posterSize === 'small' ? 'text-xs md:text-sm' : 'text-base md:text-lg lg:text-xl'
                                                    }`}>
                                                    "{quoteText}"
                                                </p>
                                                <p className="text-[10px] md:text-[11px] font-black text-amber-400 uppercase tracking-widest leading-none drop-shadow-[0_2px_4px_rgba(0,0,0,0.6)]">
                                                    — {activeQuote.author.toUpperCase()} {activeQuote.ref && `(${activeQuote.ref.toUpperCase()})`}
                                                </p>
                                            </div>

                                            {/* Footer / Controls */}
                                            <div className="relative mt-auto pt-6 flex justify-center items-center min-h-[50px] z-30">
                                                {/* Navigation Arrows - Left (Circular Floating) - z-30 */}
                                                <button
                                                    onClick={() => setDetachmentIndex(prev => prev === 0 ? filteredQuotes.length - 1 : prev - 1)}
                                                    className="absolute bottom-2 left-2 z-30 w-10 h-10 rounded-full flex items-center justify-center bg-white/10 hover:bg-white/20 border border-white/20 text-white transition-all shadow-xl backdrop-blur-md active:scale-95"
                                                >
                                                    <ArrowLeft className="w-5 h-5" />
                                                </button>

                                                {/* Central Text */}
                                                <span className="text-[10px] font-black uppercase tracking-widest text-white/40 animate-pulse mb-2">
                                                    Reflect on this truth
                                                </span>

                                                {/* Navigation Arrows - Right (Circular Floating) - z-30 */}
                                                <button
                                                    onClick={() => setDetachmentIndex(prev => (prev === filteredQuotes.length - 1 ? 0 : prev + 1))}
                                                    className="absolute bottom-2 right-2 z-30 w-10 h-10 rounded-full flex items-center justify-center bg-white/10 hover:bg-white/20 border border-white/20 text-white transition-all shadow-xl backdrop-blur-md active:scale-95"
                                                >
                                                    <ArrowRight className="w-5 h-5" />
                                                </button>
                                            </div>
                                        </div>
                                    );
                                })()}

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

                        {/* DEVOTIONAL SONGS BOARD */}
                        {activeTab === 'songs' && (
                            <motion.div
                                key="songs"
                                initial={{ opacity: 0, y: 12 }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0 }}
                                className="space-y-6"
                            >
                                <div className="p-4 md:p-6 rounded-3xl bg-card border border-border/80 shadow-md space-y-6">
                                    <div className="flex justify-between items-center">
                                        <div>
                                            <h3 className="text-lg font-bold flex items-center gap-2">
                                                <Volume2 className="text-amber-500 w-5 h-5 animate-pulse" />
                                                Devotional Songs & Ragas
                                            </h3>
                                            <p className="text-xs text-muted-foreground mt-0.5">Soothing traditional musical recitals curated for mental clarity and peaceful study breaks</p>
                                        </div>
                                    </div>

                                    {/* Custom YouTube Player Wrapper */}
                                    <div className="flex flex-col gap-6">
                                        <div
                                            ref={ytContainerRef}
                                            className={`bg-zinc-950 border border-border shadow-lg shadow-amber-500/5 transition-all duration-300 relative ${isYtFullscreen
                                                ? 'fixed inset-0 z-[2800] w-screen h-screen flex flex-col items-center justify-center bg-black border-none'
                                                : 'w-full aspect-video rounded-3xl overflow-hidden'
                                                }`}
                                            onMouseMove={resetControlsTimeout}
                                            onTouchStart={resetControlsTimeout}
                                        >
                                            {/* YouTube player element inside iframe */}
                                            <div className={`pointer-events-none select-none ${isYtFullscreen ? 'w-full h-full max-w-5xl aspect-video relative' : 'absolute inset-0 w-full h-full'}`}>
                                                <div id="devotional-yt-iframe" className="w-full h-full" />
                                            </div>

                                            {/* Video click-to-pause/play overlay */}
                                            <div
                                                className="absolute inset-0 z-10 cursor-pointer"
                                                onClick={handleTogglePlay}
                                            />

                                            {/* Floating Play Indicator overlay (when paused) */}
                                            <div className={`absolute z-20 pointer-events-none transition-all duration-300 p-4 rounded-full bg-black/60 border border-white/20 text-white ${isYtPlaying ? 'scale-75 opacity-0 bg-transparent' : 'scale-100 opacity-100'}`}>
                                                <Play className="w-8 h-8 text-amber-500 fill-current ml-1" />
                                            </div>

                                            {/* Custom Controls HUD overlay */}
                                            <div
                                                className={`absolute bottom-0 inset-x-0 z-30 p-4 bg-gradient-to-t from-black/95 via-black/60 to-transparent transition-opacity duration-300 flex flex-col gap-3 ${controlsVisible || !isYtPlaying ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}
                                            >
                                                {/* Progress Seeker Bar */}
                                                <div className="flex items-center gap-3">
                                                    <span className="text-[10px] font-mono text-white/90 select-none">
                                                        {formatTimeSeconds(ytCurrentTime)}
                                                    </span>
                                                    <input
                                                        type="range"
                                                        min="0"
                                                        max={ytDuration || 100}
                                                        step="1"
                                                        value={ytCurrentTime}
                                                        onChange={handleSeekChange}
                                                        className="flex-1 h-1.5 rounded-lg appearance-none cursor-pointer bg-white/25 accent-amber-500 hover:h-2 transition-all relative z-40"
                                                        onClick={(e) => e.stopPropagation()} // Prevent triggering play/pause
                                                    />
                                                    <span className="text-[10px] font-mono text-white/90 select-none">
                                                        {formatTimeSeconds(ytDuration)}
                                                    </span>
                                                </div>

                                                {/* Action icons bar */}
                                                <div className="flex items-center justify-between">
                                                    <div className="flex items-center gap-3 relative z-45">
                                                        <button
                                                            onClick={(e) => {
                                                                e.stopPropagation();
                                                                setActiveSongIndex((prev) => (prev > 0 ? prev - 1 : DEVOTIONAL_TRACKS.length - 1));
                                                            }}
                                                            className="p-1.5 hover:bg-white/10 rounded-lg text-white/80 hover:text-white transition-colors"
                                                            type="button"
                                                            title="Previous Track"
                                                        >
                                                            <SkipBack className="w-4 h-4" />
                                                        </button>

                                                        <button
                                                            onClick={(e) => {
                                                                e.stopPropagation();
                                                                handleTogglePlay();
                                                            }}
                                                            className="p-1.5 hover:bg-white/10 rounded-lg text-white transition-colors"
                                                            type="button"
                                                        >
                                                            {isYtPlaying ? <Pause className="w-5 h-5 text-amber-400 fill-current" /> : <Play className="w-5 h-5 text-amber-400 fill-current" />}
                                                        </button>

                                                        <button
                                                            onClick={(e) => {
                                                                e.stopPropagation();
                                                                setActiveSongIndex((prev) => (prev + 1) % DEVOTIONAL_TRACKS.length);
                                                            }}
                                                            className="p-1.5 hover:bg-white/10 rounded-lg text-white/80 hover:text-white transition-colors"
                                                            type="button"
                                                            title="Next Track"
                                                        >
                                                            <SkipForward className="w-4 h-4" />
                                                        </button>

                                                        {/* Subtitle / text info */}
                                                        <div className="pr-4 select-none ml-1">
                                                            <p className="text-xs font-black text-white truncate max-w-[160px] md:max-w-xs">{DEVOTIONAL_TRACKS[activeSongIndex].title}</p>
                                                            <p className="text-[9px] text-white/60 truncate">{DEVOTIONAL_TRACKS[activeSongIndex].artist}</p>
                                                        </div>
                                                    </div>

                                                    <div className="flex items-center gap-3 relative z-45">
                                                        {/* Volume controls inside YT Player */}
                                                        <div className="flex items-center gap-2 mr-2">
                                                            <button
                                                                onClick={(e) => {
                                                                    e.stopPropagation();
                                                                    setIsYtMuted(prev => !prev);
                                                                }}
                                                                className="p-1.5 hover:bg-white/10 rounded-lg text-white transition-colors"
                                                                type="button"
                                                                title={isYtMuted ? "Unmute" : "Mute"}
                                                            >
                                                                {isYtMuted || ytVolume === 0 ? (
                                                                    <VolumeX className="w-4 h-4 text-rose-455 fill-none" />
                                                                ) : (
                                                                    <Volume2 className="w-4 h-4 text-amber-500 fill-none" />
                                                                )}
                                                            </button>
                                                            <input
                                                                type="range"
                                                                min="0"
                                                                max="100"
                                                                value={isYtMuted ? 0 : ytVolume}
                                                                onChange={(e) => {
                                                                    const val = parseInt(e.target.value);
                                                                    setYtVolume(val);
                                                                    if (val > 0) setIsYtMuted(false);
                                                                }}
                                                                className="w-16 md:w-20 h-1 bg-white/20 accent-amber-550 rounded-lg appearance-none cursor-pointer hover:h-1.5 transition-all text-amber-500"
                                                                onClick={(e) => e.stopPropagation()}
                                                            />
                                                        </div>

                                                        {/* Fullscreen control */}
                                                        <button
                                                            onClick={(e) => {
                                                                e.stopPropagation();
                                                                toggleYtFullscreen();
                                                            }}
                                                            className="p-1.5 hover:bg-white/10 rounded-lg text-white transition-colors"
                                                            type="button"
                                                        >
                                                            {isYtFullscreen ? <Minimize2 className="w-4 h-4 text-emerald-400" /> : <Maximize2 className="w-4 h-4 text-amber-400" />}
                                                        </button>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>

                                        {/* Category Filter Pills (Shiv, Ram, Krishna, Hanuman, Sitar, Flute, Chant, etc.) */}
                                        <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none">
                                            {['All', 'Shiv', 'Ram', 'Krishna', 'Hanuman', 'Sitar', 'Flute', 'Raga', 'Chant'].map((tag) => (
                                                <button
                                                    key={tag}
                                                    onClick={() => setSongFilterTag(tag)}
                                                    className={`px-3.5 py-1.5 rounded-full text-xs font-semibold whitespace-nowrap transition-all duration-200 ${
                                                        songFilterTag === tag
                                                            ? 'bg-amber-500 text-zinc-950 shadow-md shadow-amber-500/20 scale-105 font-bold'
                                                            : 'bg-zinc-900/80 text-muted-foreground hover:bg-zinc-800 hover:text-foreground border border-border/40'
                                                    }`}
                                                >
                                                    #{tag}
                                                </button>
                                            ))}
                                        </div>

                                        {/* Songs Playlist Grid */}
                                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3.5">
                                            {filteredDevotionalTracks.map((song) => {
                                                const originalIndex = DEVOTIONAL_TRACKS.findIndex(s => s.id === song.id);
                                                const isActive = activeSongIndex === originalIndex;

                                                return (
                                                    <button
                                                        key={song.id}
                                                        onClick={() => setActiveSongIndex(originalIndex)}
                                                        className={`p-3.5 text-left rounded-2xl border transition-all duration-300 flex gap-3.5 relative overflow-hidden group ${
                                                            isActive
                                                                ? 'bg-amber-500/10 border-amber-500/60 shadow-md shadow-amber-500/5 ring-1 ring-amber-500/30'
                                                                : 'bg-muted/10 border-border/60 hover:bg-muted/30 hover:border-amber-500/30'
                                                        }`}
                                                    >
                                                        <div className="w-14 h-14 rounded-xl overflow-hidden relative flex-shrink-0 bg-zinc-900 border border-border/50">
                                                            <img src={song.thumbnail} alt={song.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" />
                                                            <div className={`absolute inset-0 flex items-center justify-center transition-opacity ${
                                                                isActive ? 'bg-black/50 opacity-100' : 'bg-black/30 opacity-60 group-hover:opacity-100'
                                                            }`}>
                                                                <Play className={`w-5 h-5 text-white transition-all ${
                                                                    isActive ? 'text-amber-400 fill-amber-400 scale-110 animate-pulse' : 'group-hover:scale-110'
                                                                }`} />
                                                            </div>
                                                        </div>
                                                        <div className="flex-1 min-w-0 flex flex-col justify-between py-0.5">
                                                            <div>
                                                                <h4 className={`text-xs font-bold truncate transition-colors ${
                                                                    isActive ? 'text-amber-400' : 'text-foreground group-hover:text-amber-400'
                                                                }`}>
                                                                    {song.title}
                                                                </h4>
                                                                <p className="text-[11px] text-muted-foreground truncate">{song.artist}</p>
                                                            </div>
                                                            <div className="flex gap-1 mt-1.5 flex-wrap">
                                                                {song.tags.map((tag, tIdx) => (
                                                                    <span key={tIdx} className="text-[9px] font-medium px-2 py-0.5 rounded-md bg-foreground/5 text-muted-foreground border border-border/40">
                                                                        #{tag}
                                                                    </span>
                                                                ))}
                                                            </div>
                                                        </div>
                                                    </button>
                                                );
                                            })}
                                            {filteredDevotionalTracks.length === 0 && (
                                                <div className="col-span-full py-8 text-center text-xs text-muted-foreground">
                                                    No songs found for #{songFilterTag}. Select another category above.
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            </motion.div>
                        )}
                    </AnimatePresence>
                </div>

                {/* SHARED RIGHT SIDE: ACTIVE AUDIO DECK & FREQUENCY MIXER */}
                {activeTab !== 'songs' && (
                    <div className="lg:col-span-1 space-y-6">

                        {/* Audio controller deck */}
                        <div className={`p-6 rounded-3xl bg-card border ${isPlaying ? activeCoverGlow[activeTab] : 'border-border/80'} shadow-xl space-y-6 transition-all duration-500`}>
                            <div className="text-center font-black uppercase text-[10px] text-muted-foreground tracking-widest border-b border-border/40 pb-3">
                                Now Channeling
                            </div>

                            {/* Catchy animated audio waves replacing the spinning disc */}
                            <div className="flex items-end justify-center gap-1.5 h-28 w-28 mx-auto relative select-none my-2">
                                {/* Glow backdrops */}
                                <div className="absolute inset-0 bg-primary/10 rounded-full blur-2xl animate-pulse pointer-events-none" />

                                {/* Active visualizer bars */}
                                {[...Array(9)].map((_, i) => {
                                    const heights = [
                                        [20, 60, 30, 90, 45, 20],
                                        [30, 90, 40, 70, 50, 30],
                                        [15, 45, 25, 80, 35, 15],
                                        [40, 80, 50, 95, 60, 40],
                                        [25, 70, 35, 85, 45, 25],
                                        [35, 90, 40, 75, 45, 35],
                                        [20, 50, 30, 80, 40, 20],
                                        [45, 95, 55, 85, 60, 45],
                                        [15, 60, 25, 75, 35, 15]
                                    ][i % 9];

                                    const delay = i * 0.08;
                                    const colorClass = i % 2 === 0 ? "from-amber-400 to-amber-500" : "from-amber-500 to-amber-600";

                                    return (
                                        <motion.div
                                            key={i}
                                            className={`w-2 rounded-full bg-gradient-to-t ${colorClass} shadow-[0_0_10px_rgba(245,158,11,0.2)]`}
                                            animate={{
                                                height: (isPlaying || isYtPlaying) ? heights : 8
                                            }}
                                            transition={{
                                                duration: 1.0,
                                                repeat: Infinity,
                                                repeatType: "reverse",
                                                ease: "easeInOut",
                                                delay: delay
                                            }}
                                        />
                                    );
                                })}
                            </div>

                            {/* Track specifications */}
                            <div className="text-center space-y-1.5">
                                <h4 className="font-bold text-base truncate px-2">{currentTrack.title}</h4>
                                <p className="text-xs text-muted-foreground px-2 line-clamp-2 min-h-[2rem] leading-normal">{currentTrack.description}</p>
                            </div>

                            {/* Seek bar */}
                            <div className="space-y-1.5">
                                <div className="w-full h-1 bg-muted rounded-full overflow-hidden relative">
                                    <div className="h-full bg-primary rounded-full transition-all duration-300" style={{ width: `${progress}%` }} />
                                </div>
                                <div className="flex justify-between items-center text-[10px] text-muted-foreground font-mono">
                                    <span>{currentTimeText}</span>
                                    <span>{(isSynthEnabled && activeTab !== 'zen') ? '∞' : duration}</span>
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
                )}

            </div>


        </div>
    );
}
