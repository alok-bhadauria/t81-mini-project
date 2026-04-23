import { useState, useRef } from "react";
import { Card } from "../components/common/Card";
import { Button } from "../components/common/Button";
import { Keyboard, Mic, FileText, Send, Loader2, Volume2, User, Play, Square, Settings, Upload, X, Check } from "lucide-react";
import { useAuth } from "../context/AuthContext";
import { useToast } from "../context/ToastContext";
import { useDocumentTitle } from "../hooks/useDocumentTitle";
import { api } from "../services/api";

export function Translate() {
    useDocumentTitle("App");
    const { isLoggedIn } = useAuth();
    const { addToast } = useToast();

    const [activeTab, setActiveTab] = useState("text");
    const [inputText, setInputText] = useState("");
    const [isTranslating, setIsTranslating] = useState(false);

    const [outputAsl, setOutputAsl] = useState("");
    const [isListening, setIsListening] = useState(false);
    const [selectedFile, setSelectedFile] = useState(null);
    const fileInputRef = useRef(null);

    const [showClearConfirm, setShowClearConfirm] = useState(false);

    const [animationSequence, setAnimationSequence] = useState([]);
    const [sentimentId, setSentimentId] = useState("");
    const [isPlaying, setIsPlaying] = useState(false);
    const [currentWordIndex, setCurrentWordIndex] = useState(-1);

    const toggleListening = () => {
        if (isListening) {
            window.speechRec?.stop();
            setIsListening(false);
            return;
        }

        if (!("webkitSpeechRecognition" in window)) {
            addToast({ title: "Speech Recognition Unavailable", description: "Your browser does not support Speech-to-Text.", type: "error" });
            return;
        }

        const recognition = new window.webkitSpeechRecognition();
        recognition.continuous = true;
        recognition.interimResults = true;
        recognition.lang = "en-US";

        recognition.onstart = () => setIsListening(true);
        recognition.onresult = (event) => {
            let transcriptText = "";
            for (let i = 0; i < event.results.length; i++) {
                transcriptText += event.results[i][0].transcript;
            }
            setInputText(transcriptText);
        };
        recognition.onerror = () => setIsListening(false);
        recognition.onend = () => setIsListening(false);

        recognition.start();
        window.speechRec = recognition;
    };

    const handleFileChange = (e) => {
        const file = e.target.files[0];
        if (!file) return;

        if (!file.name.endsWith(".txt")) {
            addToast({ title: "Unsupported File", description: "Only .txt files can be processed. PDF and DOCX support coming soon.", type: "error" });
            return;
        }

        setSelectedFile(file);
        const reader = new FileReader();
        reader.onload = (ev) => {
            const extracted = ev.target.result.slice(0, 2000);
            setInputText(extracted);
            addToast({ title: "File Loaded", description: "Text extracted from " + file.name, type: "success" });
            setActiveTab("text");
        };
        reader.readAsText(file);
    };

    const handleTextSubmit = async () => {
        if (!inputText.trim()) return;
        setIsTranslating(true);

        const payloadType = activeTab === "document" ? "DOCUMENT" : activeTab === "speech" ? "SPEECH" : "TEXT";
        const filename = selectedFile && activeTab === "document" ? selectedFile.name : null;

        try {
            const data = await api.post("/text", {
                text: inputText.trim(),
                type: payloadType,
                ...(filename && { filename }),
            });

            const newSequence = data.animation_sequence || [];
            setOutputAsl(data.asl_grammar_output || "");
            setAnimationSequence(newSequence);
            setSentimentId(data.sentiment_animation_id || "sa003");
            setCurrentWordIndex(-1);
            setIsPlaying(false);

            addToast({ title: "Translation successful", type: "success" });

            if (newSequence.length > 0) {
                setTimeout(() => {
                    setIsPlaying(true);
                    setCurrentWordIndex(0);
                    let idx = 0;
                    const step = () => {
                        setCurrentWordIndex(idx);
                        const item = newSequence[idx];
                        const gestureCount = (item.gesture_animation_ids || []).length;
                        const duration = Math.max(800, gestureCount * 1000);
                        idx += 1;
                        if (idx < newSequence.length) {
                            setTimeout(step, duration);
                        } else {
                            setTimeout(() => {
                                setCurrentWordIndex(-1);
                                setIsPlaying(false);
                            }, duration);
                        }
                    };
                    step();
                }, 300);
            }

        } catch (error) {
            const msg = error.message === "SESSION_EXPIRED"
                ? "Your session has expired. Please log in again."
                : error.message;
            addToast({ title: "Translation Error", description: msg, type: "error" });
        } finally {
            setIsTranslating(false);
        }
    };

    const playAnimationSync = async () => {
        if (animationSequence.length === 0 || isPlaying) return;
        setIsPlaying(true);
        setCurrentWordIndex(0);

        for (let i = 0; i < animationSequence.length; i++) {
            setCurrentWordIndex(i);
            const item = animationSequence[i];
            const gestureCount = (item.gesture_animation_ids || []).length;
            const playbackDuration = gestureCount * 1000;
            await new Promise((resolve) => setTimeout(resolve, Math.max(800, playbackDuration)));
        }

        setCurrentWordIndex(-1);
        setIsPlaying(false);
    };

    const TABS = [
        { id: "text", label: "Text Input", icon: Keyboard },
        { id: "speech", label: "Speech", icon: Mic },
        { id: "document", label: "Document", icon: FileText },
    ];

    if (!isLoggedIn) {
        return (
            <div className="flex flex-col items-center justify-center p-12 text-center">
                <h2 className="text-2xl font-bold mb-4 text-[var(--text-primary)]">Authentication Required</h2>
                <p className="text-[var(--text-secondary)] mb-6">Please log in to use the translation application.</p>
                <Button onClick={() => window.location.href = "/login"}>Go to Login</Button>
            </div>
        );
    }

    return (
        <div className="max-w-7xl mx-auto h-[calc(100vh-8rem)] flex flex-col md:flex-row gap-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
            <Card className="flex-1 shrink-0 flex flex-col shadow-xl overflow-hidden border-[var(--border-color)]">
                <div className="flex border-b border-[var(--border-color)] p-2 gap-2 bg-[var(--bg-surface)] overflow-x-auto">
                    {TABS.map((tab) => {
                        const Icon = tab.icon;
                        const isActive = activeTab === tab.id;
                        return (
                            <button
                                key={tab.id}
                                onClick={() => setActiveTab(tab.id)}
                                className={`flex items-center gap-2 px-4 py-2.5 rounded-lg text-sm font-medium transition-all whitespace-nowrap ${isActive
                                    ? "bg-[var(--primary)] text-white shadow-md"
                                    : "text-[var(--text-secondary)] hover:bg-[var(--bg-background)] hover:text-[var(--text-primary)]"
                                    }`}
                            >
                                <Icon size={16} />
                                {tab.label}
                            </button>
                        );
                    })}
                </div>

                <div className="flex-1 bg-[var(--bg-background)] relative overflow-hidden">
                    <div
                        className="absolute inset-0 flex transition-transform duration-500 ease-in-out"
                        style={{ transform: `translateX(-${["text", "speech", "document"].indexOf(activeTab) * 100}%)` }}
                    >
                        <div className="w-full h-full flex-shrink-0 flex flex-col p-4 md:p-6">
                            <div className="relative flex-1 w-full">
                                <textarea
                                    value={inputText}
                                    onChange={(e) => setInputText(e.target.value)}
                                    placeholder="Type English text to translate..."
                                    className="w-full h-full bg-transparent border-none resize-none focus:ring-0 text-xl font-medium text-[var(--text-primary)] placeholder-[var(--text-secondary)] leading-relaxed outline-none pr-10 hidden-scrollbar"
                                />
                                {inputText && !showClearConfirm && (
                                    <button
                                        onClick={() => setShowClearConfirm(true)}
                                        className="absolute top-2 right-2 p-1.5 text-[var(--text-secondary)] hover:text-red-500 hover:bg-red-500/10 rounded-full transition-colors"
                                        title="Clear input"
                                    >
                                        <X size={18} />
                                    </button>
                                )}
                                {showClearConfirm && (
                                    <div className="absolute top-2 right-2 flex items-center gap-2 bg-white dark:bg-zinc-800 shadow-lg border-2 border-[var(--border-color)] p-2 rounded-full animate-in fade-in zoom-in-95 duration-200">
                                        <span className="text-sm font-bold text-[var(--text-secondary)] px-3 uppercase tracking-wider">Clear Text?</span>
                                        <div className="flex gap-1">
                                            <button
                                                onClick={() => { setInputText(""); setShowClearConfirm(false); }}
                                                className="flex items-center gap-1 px-3 py-1.5 text-white bg-green-500 hover:bg-green-600 rounded-full transition-colors font-semibold"
                                                title="Yes, clear"
                                            >
                                                <Check size={18} /> Yes
                                            </button>
                                            <button
                                                onClick={() => setShowClearConfirm(false)}
                                                className="flex items-center gap-1 px-3 py-1.5 text-white bg-zinc-400 hover:bg-zinc-500 rounded-full transition-colors font-semibold"
                                                title="No, cancel"
                                            >
                                                <X size={18} /> No
                                            </button>
                                        </div>
                                    </div>
                                )}
                            </div>
                            <div className="flex items-center justify-between mt-4">
                                <span className="text-xs text-[var(--text-secondary)]">{inputText.length} / 2000 characters</span>
                                <Button
                                    onClick={handleTextSubmit}
                                    disabled={!inputText.trim() || isTranslating}
                                    className="rounded-full shadow-lg"
                                >
                                    {isTranslating ? <Loader2 size={18} className="animate-spin" /> : <><Send size={18} className="mr-2" /> Translate</>}
                                </Button>
                            </div>
                        </div>

                        <div className="w-full h-full flex-shrink-0 flex flex-col p-4 md:p-6 overflow-y-auto">
                            <div className="flex-1 flex flex-col items-center justify-center text-center space-y-6">
                                <div
                                    onClick={toggleListening}
                                    className={`w-24 h-24 rounded-full flex items-center justify-center relative cursor-pointer transition-colors shadow-lg ${isListening ? "bg-red-500/10 text-red-500 hover:bg-red-500/20" : "bg-[var(--primary)]/10 text-[var(--primary)] hover:bg-[var(--primary)]/20"}`}
                                >
                                    <Mic size={40} className={isListening ? "animate-pulse" : ""} />
                                    {isListening && <div className="absolute inset-0 rounded-full border border-red-500 animate-ping opacity-20"></div>}
                                </div>
                                <div>
                                    <h3 className="text-xl font-bold">{isListening ? "Listening..." : "Tap to Speak"}</h3>
                                    <p className="text-[var(--text-secondary)] mt-2 max-w-sm">Speak clearly into your microphone. The text will appear below.</p>
                                </div>
                                <textarea
                                    value={inputText}
                                    onChange={(e) => setInputText(e.target.value)}
                                    placeholder="Your speech will appear here..."
                                    className="w-full max-w-md bg-[var(--bg-surface)] border border-[var(--border-color)] rounded-xl p-4 text-center focus:ring-2 focus:ring-[var(--primary)] outline-none resize-none h-24 shadow-inner"
                                />
                                <div className="flex gap-4">
                                    <Button variant="outline" onClick={toggleListening} className="rounded-full px-6">{isListening ? "Stop" : "Start"} Recording</Button>
                                    <Button onClick={() => setActiveTab("text")} className="rounded-full px-6">Review & Translate</Button>
                                </div>
                            </div>
                        </div>

                        <div className="w-full h-full flex-shrink-0 flex flex-col p-4 md:p-6 items-center justify-center text-center">
                            <input
                                type="file"
                                ref={fileInputRef}
                                onChange={handleFileChange}
                                className="hidden"
                                accept=".txt"
                            />
                            <Card
                                onClick={() => fileInputRef.current?.click()}
                                className="w-full h-full max-h-64 border-2 border-dashed border-[var(--border-color)] bg-transparent hover:bg-[var(--bg-surface)] hover:border-[var(--primary)] transition-colors flex flex-col items-center justify-center p-8 cursor-pointer shadow-sm group"
                            >
                                <div className="w-16 h-16 rounded-full bg-zinc-100 dark:bg-zinc-800 text-[var(--text-secondary)] group-hover:text-[var(--primary)] flex items-center justify-center mb-4 transition-colors">
                                    <Upload size={28} />
                                </div>
                                <h3 className="text-lg font-bold">Upload a Document</h3>
                                <p className="text-sm text-[var(--text-secondary)] mt-1 mb-4">TXT files supported. Text is extracted client-side.</p>
                                <Button size="sm" type="button" onClick={(e) => { e.stopPropagation(); fileInputRef.current?.click(); }}>Select File</Button>
                                {selectedFile && (
                                    <div className="flex items-center gap-2 mt-4 bg-[var(--bg-surface)] px-4 py-2 border border-[var(--border-color)] rounded-lg shadow-sm">
                                        <p className="text-sm font-medium text-[var(--primary)] truncate max-w-[200px]">{selectedFile.name}</p>
                                        <button
                                            onClick={(e) => { e.stopPropagation(); setSelectedFile(null); setInputText(""); }}
                                            className="text-[var(--text-secondary)] hover:text-red-500 transition-colors p-1"
                                            title="Remove File"
                                        >
                                            <X size={14} />
                                        </button>
                                    </div>
                                )}
                            </Card>
                            {selectedFile && (
                                <Button onClick={handleTextSubmit} disabled={!inputText.trim() || isTranslating} className="mt-8 rounded-full px-8 shadow-lg w-full max-w-xs">
                                    {isTranslating ? <Loader2 size={18} className="animate-spin" /> : <><Send size={18} className="mr-2" /> Translate Document</>}
                                </Button>
                            )}
                        </div>
                    </div>
                </div>
            </Card>

            <Card className="flex-1 flex flex-col shadow-xl overflow-hidden border-[var(--border-color)] bg-[var(--bg-surface)]">
                <div className="flex-[2] bg-orange-50 dark:bg-zinc-900 relative group overflow-hidden flex items-center justify-center transition-colors">
                    <div className="text-zinc-500 dark:text-zinc-600 flex flex-col items-center">
                        <User size={64} className="mb-4" />
                        <p className="text-xl font-mono opacity-50">{isPlaying ? "Avatar Sync Active" : "3D Avatar Core Offline"}</p>

                        {isPlaying && currentWordIndex >= 0 && animationSequence[currentWordIndex] && (
                            <div className="mt-4 flex flex-col items-center animate-in fade-in zoom-in duration-300">
                                <span className="text-sm font-bold text-[var(--primary)]">Rendering 3D Gestures & Sentiments:</span>
                                <div className="flex gap-2 mt-2 flex-wrap justify-center max-w-[80%]">
                                    {sentimentId && (
                                        <span className="px-3 py-1.5 bg-blue-500/10 border border-blue-500/30 text-blue-600 dark:text-blue-400 font-mono rounded-md shadow-sm text-sm">
                                            {sentimentId}
                                        </span>
                                    )}
                                    {(animationSequence[currentWordIndex].gesture_animation_ids || []).map((gid, i) => (
                                        <span key={i} className="px-3 py-1.5 bg-[var(--primary)]/10 border border-[var(--primary)]/30 text-[var(--primary)] font-mono rounded-md shadow-sm text-sm">
                                            {gid}
                                        </span>
                                    ))}
                                </div>
                            </div>
                        )}
                    </div>

                    <div className="absolute top-4 right-4 flex gap-2">
                        <Button size="icon" variant="ghost" className="bg-black/10 dark:bg-black/40 text-[var(--text-primary)] dark:text-white hover:bg-black/20 dark:hover:bg-black/60 rounded-full h-10 w-10 backdrop-blur-sm">
                            <Volume2 size={18} />
                        </Button>
                        <Button size="icon" variant="ghost" className="bg-black/10 dark:bg-black/40 text-[var(--text-primary)] dark:text-white hover:bg-black/20 dark:hover:bg-black/60 rounded-full h-10 w-10 backdrop-blur-sm">
                            <Settings size={18} />
                        </Button>
                    </div>

                    <div className="absolute bottom-6 left-1/2 -translate-x-1/2 flex items-center gap-3 bg-black/50 backdrop-blur-md px-6 py-3 rounded-full border border-white/10 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button className="text-white hover:text-[var(--primary)] transition-colors" onClick={() => { setIsPlaying(false); setCurrentWordIndex(-1); }}><Square size={18} fill="currentColor" /></button>
                        <div className="w-px h-6 bg-white/20 mx-2"></div>
                        <button className="text-white hover:text-[var(--primary)] transition-colors scale-125" onClick={playAnimationSync}><Play size={24} fill="currentColor" /></button>
                        <div className="w-px h-6 bg-white/20 mx-2"></div>
                        <div className="w-32 h-1 bg-white/20 rounded-full cursor-pointer overflow-hidden">
                            <div
                                className="h-full bg-[var(--primary)] transition-all duration-300 relative"
                                style={{ width: `${animationSequence.length > 0 && currentWordIndex >= 0 ? ((currentWordIndex + 1) / animationSequence.length) * 100 : 0}%` }}
                            >
                            </div>
                        </div>
                    </div>
                </div>

                <div className="flex-1 p-6 border-t border-[var(--border-color)] bg-[var(--bg-surface)] flex flex-col overflow-hidden">
                    <div className="flex items-center justify-between mb-4 shrink-0">
                        <h3 className="font-bold text-lg text-[var(--text-primary)]">ASL Grammar Structure</h3>
                        <span className="text-xs px-2 py-1 rounded bg-[var(--primary)]/10 text-[var(--primary)] font-bold uppercase tracking-wider">
                            Synced Output
                        </span>
                    </div>

                    {animationSequence.length > 0 ? (
                        <div className="flex flex-col h-full space-y-4">
                            <div className="flex-1 p-4 rounded-xl bg-[var(--bg-background)] border border-[var(--border-color)] shadow-inner relative flex items-center justify-center overflow-x-hidden min-h-[140px]">
                                <div className="flex gap-6 items-center flex-nowrap w-full overflow-hidden justify-center relative px-8 mask-edges">
                                    {animationSequence.map((item, index) => {
                                        const isCurrent = currentWordIndex === index;
                                        const distance = Math.abs(currentWordIndex === -1 ? 0 : currentWordIndex - index);

                                        if (currentWordIndex !== -1 && distance > 5) return null;

                                        return (
                                            <span
                                                key={index}
                                                className={`font-mono transition-all duration-300 select-none ${isCurrent
                                                    ? "text-[var(--primary)] text-3xl font-black scale-110 drop-shadow-md z-10"
                                                    : currentWordIndex === -1
                                                        ? "text-[var(--text-secondary)] text-lg"
                                                        : `text-[var(--text-secondary)] font-medium ${distance > 2 ? "opacity-20 text-sm" : "opacity-60 text-lg"} blur-[0.5px]`
                                                    }`}
                                            >
                                                {item.word}
                                            </span>
                                        );
                                    })}
                                </div>
                            </div>

                            <div className="flex items-center justify-end shrink-0 w-full mt-4">
                                <Button size="sm" onClick={playAnimationSync} disabled={isPlaying} className="rounded-full shadow-lg shrink-0">
                                    {isPlaying ? <Square fill="currentColor" size={14} className="mr-2" /> : <Play fill="currentColor" size={14} className="mr-2" />}
                                    {isPlaying ? "Playing..." : "Play Sync"}
                                </Button>
                            </div>
                        </div>
                    ) : (
                        <div className="h-full flex flex-col items-center justify-center text-[var(--text-secondary)] opacity-50">
                            <kbd className="px-3 py-1.5 rounded-lg border border-[var(--border-color)] shadow-sm text-sm font-mono mt-2">No active translation</kbd>
                        </div>
                    )}
                </div>
            </Card>
        </div>
    );
}
