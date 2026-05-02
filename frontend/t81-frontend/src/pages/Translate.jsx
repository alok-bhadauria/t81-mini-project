import { useState, useRef, useCallback, useEffect } from "react";
import { Card } from "../components/common/Card";
import { Button } from "../components/common/Button";
import { Keyboard, Mic, FileText, Send, Loader2, Volume2, VolumeX, Play, Square, Settings, Upload, X, Check } from "lucide-react";
import { useAuth } from "../context/AuthContext";
import { useToast } from "../context/ToastContext";
import { useSound } from "../context/SoundContext";
import { useDocumentTitle } from "../hooks/useDocumentTitle";
import { useAnimationRegistry, resolveTokenToFile } from "../hooks/useAnimationRegistry";
import { AvatarRenderer } from "../components/common/AvatarRenderer";
import { api } from "../services/api";
import { useLocation } from "react-router-dom";

const ANIMATION_DURATION_MS = 2500;

export function Translate() {
    useDocumentTitle("App");
    const { isLoggedIn, user } = useAuth();
    const { addToast } = useToast();
    const { isSoundEnabled, toggleSound, speak } = useSound();
    const { registry } = useAnimationRegistry();
    const location = useLocation();

    const [activeTab, setActiveTab] = useState("text");
    const [inputText, setInputText] = useState("");
    const [isTranslating, setIsTranslating] = useState(false);
    const [outputAsl, setOutputAsl] = useState("");
    const [isListening, setIsListening] = useState(false);
    const [selectedFile, setSelectedFile] = useState(null);
    const fileInputRef = useRef(null);
    const [showClearConfirm, setShowClearConfirm] = useState(false);

    const [animationStream, setAnimationStream] = useState([]);
    const [currentIndex, setCurrentIndex] = useState(-1);
    const [isPlaying, setIsPlaying] = useState(false);
    const [currentAnimUrl, setCurrentAnimUrl] = useState(null);

    const playSequenceRef = useRef(false);

    const resolveUrl = useCallback(
        (token) => resolveTokenToFile(registry, token, user?.avatar || "AJ"),
        [registry, user?.avatar]
    );

    const playStream = useCallback(
        async (stream) => {
            if (!stream || stream.length === 0) return;
            playSequenceRef.current = true;
            setIsPlaying(true);

            for (let i = 0; i < stream.length; i++) {
                if (!playSequenceRef.current) break;
                const item = stream[i];
                const url = resolveUrl(item.token);
                setCurrentIndex(i);
                setCurrentAnimUrl(url);
                speak(item.token);
                await new Promise((r) => setTimeout(r, ANIMATION_DURATION_MS));
            }

            setCurrentIndex(-1);
            setCurrentAnimUrl(null);
            setIsPlaying(false);
            playSequenceRef.current = false;
        },
        [resolveUrl, speak]
    );

    const stopPlayback = () => {
        playSequenceRef.current = false;
        setIsPlaying(false);
        setCurrentIndex(-1);
        setCurrentAnimUrl(null);
        window.speechSynthesis.cancel();
    };

    useEffect(() => {
        if (location.state?.text && location.state?.stream) {
            setInputText(location.state.text);
            setOutputAsl(location.state.asl || "");
            setAnimationStream(location.state.stream);
            setActiveTab("text");
            
            // Auto-play the animation after a short delay
            setTimeout(() => playStream(location.state.stream), 500);
            
            // Clear the location state so it doesn't replay on refresh
            window.history.replaceState({}, document.title);
        } else if (location.state?.activeTab) {
            setActiveTab(location.state.activeTab);
            window.history.replaceState({}, document.title);
        }
    }, [location, playStream]);

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
            let text = "";
            for (let i = 0; i < event.results.length; i++) {
                text += event.results[i][0].transcript;
            }
            setInputText(text);
        };
        recognition.onerror = () => setIsListening(false);
        recognition.onend = () => setIsListening(false);
        recognition.start();
        window.speechRec = recognition;
    };

    const handleFileChange = (e) => {
        const file = e.target.files?.[0];
        if (!file) return;
        const lowerName = file.name.toLowerCase();
        if (!lowerName.endsWith(".txt") && !lowerName.endsWith(".pdf")) {
            addToast({ title: "Unsupported File", description: "Only .txt and .pdf files are supported.", type: "error" });
            return;
        }
        setSelectedFile(file);
        addToast({ title: "File Loaded", description: "Ready to translate " + file.name, type: "success" });
    };

    const handleTextSubmit = async () => {
        if (activeTab !== "document" && !inputText.trim()) return;
        if (activeTab === "document" && !selectedFile) return;

        stopPlayback();
        setIsTranslating(true);

        const payloadType = activeTab === "document" ? "DOCUMENT" : activeTab === "speech" ? "SPEECH" : "TEXT";
        const filename = selectedFile && activeTab === "document" ? selectedFile.name : null;

        try {
            let data;
            if (activeTab === "document" && selectedFile) {
                const formData = new FormData();
                formData.append("file", selectedFile);
                data = await api.postMultipart("/uploads", formData);
                
                if (data.extracted_text) {
                    setInputText(data.extracted_text);
                }
            } else {
                data = await api.post("/text", {
                    text: inputText.trim(),
                    type: payloadType,
                    ...(filename && { filename }),
                });
            }

            const stream = data.animation_stream || [];
            setOutputAsl(data.asl_grammar_output || "");
            setAnimationStream(stream);

            addToast({ title: "Translation successful", type: "success" });

            if (stream.length > 0) {
                setTimeout(() => playStream(stream), 300);
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
                                            >
                                                <Check size={18} /> Yes
                                            </button>
                                            <button
                                                onClick={() => setShowClearConfirm(false)}
                                                className="flex items-center gap-1 px-3 py-1.5 text-white bg-zinc-400 hover:bg-zinc-500 rounded-full transition-colors font-semibold"
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
                                    <p className="text-[var(--text-secondary)] mt-2 max-w-sm">Speak clearly into your microphone.</p>
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
                                accept=".txt,.pdf"
                            />
                            <Card
                                onClick={() => fileInputRef.current?.click()}
                                className="w-full h-full max-h-64 border-2 border-dashed border-[var(--border-color)] bg-transparent hover:bg-[var(--bg-surface)] hover:border-[var(--primary)] transition-colors flex flex-col items-center justify-center p-8 cursor-pointer shadow-sm group"
                            >
                                <div className="w-16 h-16 rounded-full bg-zinc-100 dark:bg-zinc-800 text-[var(--text-secondary)] group-hover:text-[var(--primary)] flex items-center justify-center mb-4 transition-colors">
                                    <Upload size={28} />
                                </div>
                                <h3 className="text-lg font-bold">Upload a Document</h3>
                                <p className="text-sm text-[var(--text-secondary)] mt-1 mb-4">TXT and PDF files supported. Text is extracted securely.</p>
                                <Button size="sm" type="button" onClick={(e) => { e.stopPropagation(); fileInputRef.current?.click(); }}>Select File</Button>
                                {selectedFile && (
                                    <div className="flex items-center gap-2 mt-4 bg-[var(--bg-surface)] px-4 py-2 border border-[var(--border-color)] rounded-lg shadow-sm">
                                        <p className="text-sm font-medium text-[var(--primary)] truncate max-w-[200px]">{selectedFile.name}</p>
                                        <button
                                            onClick={(e) => { e.stopPropagation(); setSelectedFile(null); setInputText(""); }}
                                            className="text-[var(--text-secondary)] hover:text-red-500 transition-colors p-1"
                                        >
                                            <X size={14} />
                                        </button>
                                    </div>
                                )}
                            </Card>
                            {selectedFile && (
                                <Button onClick={handleTextSubmit} disabled={isTranslating} className="mt-8 rounded-full px-8 shadow-lg w-full max-w-xs">
                                    {isTranslating ? <Loader2 size={18} className="animate-spin" /> : <><Send size={18} className="mr-2" /> Translate Document</>}
                                </Button>
                            )}
                        </div>
                    </div>
                </div>
            </Card>

            <Card className="flex-1 flex flex-col shadow-xl overflow-hidden border-[var(--border-color)] bg-[var(--bg-surface)]">
                <div className="flex-[2] bg-[var(--bg-background)] relative group overflow-hidden">
                    <AvatarRenderer animationUrl={currentAnimUrl || `/animations/sentiments/${user?.avatar || "AJ"}/${user?.avatar || "AJ"}_sa001_happy.fbx`} playing={isPlaying || !currentAnimUrl} avatarName={user?.avatar || "AJ"} />

                    {isPlaying && currentIndex >= 0 && animationStream[currentIndex] && (
                        <div className="absolute top-4 left-1/2 -translate-x-1/2 flex flex-col items-center animate-in fade-in zoom-in duration-300 pointer-events-none">
                            <span className={`px-4 py-2 rounded-lg font-mono font-black text-lg shadow-lg ${
                                animationStream[currentIndex].type === "sentiment"
                                    ? "bg-blue-500/80 text-white"
                                    : "bg-[var(--primary)]/80 text-white"
                            }`}>
                                {animationStream[currentIndex].token}
                            </span>
                            <span className="text-xs text-white/60 mt-1 uppercase tracking-widest">
                                {animationStream[currentIndex].type}
                            </span>
                        </div>
                    )}

                    {!isPlaying && !currentAnimUrl && (
                        <div className="absolute inset-0 flex flex-col items-center justify-center text-zinc-600 pointer-events-none">
                            <p className="text-sm font-mono opacity-40">3D Avatar Ready</p>
                        </div>
                    )}

                    <div className="absolute top-4 right-4 flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                        <Button 
                            size="icon" 
                            variant="ghost" 
                            className="bg-black/40 text-white hover:bg-black/60 rounded-full h-10 w-10 backdrop-blur-sm"
                            onClick={(e) => {
                                e.stopPropagation();
                                toggleSound();
                                addToast({
                                    title: !isSoundEnabled ? "Sound Enabled" : "Sound Disabled",
                                    type: "success"
                                });
                            }}
                            title={isSoundEnabled ? "Disable Sound" : "Enable Sound"}
                        >
                            {isSoundEnabled ? <Volume2 size={18} /> : <VolumeX size={18} />}
                        </Button>
                        <Button size="icon" variant="ghost" className="bg-black/40 text-white hover:bg-black/60 rounded-full h-10 w-10 backdrop-blur-sm" onClick={() => window.location.href = "/settings"}>
                            <Settings size={18} />
                        </Button>
                    </div>

                    <div className="absolute bottom-6 left-1/2 -translate-x-1/2 flex items-center gap-3 bg-black/50 backdrop-blur-md px-6 py-3 rounded-full border border-white/10 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button className="text-white hover:text-[var(--primary)] transition-colors" onClick={stopPlayback}>
                            <Square size={18} fill="currentColor" />
                        </button>
                        <div className="w-px h-6 bg-white/20 mx-2"></div>
                        <button className="text-white hover:text-[var(--primary)] transition-colors scale-125" onClick={() => playStream(animationStream)} disabled={isPlaying}>
                            <Play size={24} fill="currentColor" />
                        </button>
                        <div className="w-px h-6 bg-white/20 mx-2"></div>
                        <div className="w-32 h-1 bg-white/20 rounded-full overflow-hidden">
                            <div
                                className="h-full bg-[var(--primary)] transition-all duration-300"
                                style={{ width: `${animationStream.length > 0 && currentIndex >= 0 ? ((currentIndex + 1) / animationStream.length) * 100 : 0}%` }}
                            />
                        </div>
                    </div>
                </div>

                <div className="flex-1 p-6 border-t border-[var(--border-color)] bg-[var(--bg-surface)] flex flex-col overflow-hidden">
                    <div className="flex items-center justify-between mb-4 shrink-0">
                        <h3 className="font-bold text-lg text-[var(--text-primary)]">ASL Grammar Structure</h3>
                        <span className="text-xs px-2 py-1 rounded bg-[var(--primary)]/10 text-[var(--primary)] font-bold uppercase tracking-wider">
                            Token Stream
                        </span>
                    </div>

                    {animationStream.length > 0 ? (
                        <div className="flex flex-col h-full space-y-4">
                            <div className="flex-1 p-4 rounded-xl bg-[var(--bg-background)] border border-[var(--border-color)] shadow-inner flex items-center justify-center overflow-x-hidden min-h-[140px]">
                                <div className="flex gap-4 items-center flex-wrap justify-center px-4">
                                    {animationStream.map((item, index) => {
                                        const isCurrent = currentIndex === index;
                                        return (
                                            <span
                                                key={index}
                                                className={`font-mono transition-all duration-300 select-none rounded px-2 py-1 ${
                                                    isCurrent
                                                        ? item.type === "sentiment"
                                                            ? "text-blue-500 text-2xl font-black scale-110 bg-blue-500/10"
                                                            : "text-[var(--primary)] text-2xl font-black scale-110 bg-[var(--primary)]/10"
                                                        : "text-[var(--text-secondary)] text-base opacity-60"
                                                }`}
                                            >
                                                {item.token}
                                            </span>
                                        );
                                    })}
                                </div>
                            </div>

                            <div className="flex items-center justify-end shrink-0 w-full mt-4">
                                <Button
                                    size="sm"
                                    onClick={() => isPlaying ? stopPlayback() : playStream(animationStream)}
                                    className="rounded-full shadow-lg shrink-0"
                                >
                                    {isPlaying ? <><Square fill="currentColor" size={14} className="mr-2" /> Stop</> : <><Play fill="currentColor" size={14} className="mr-2" /> Play Sync</>}
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
