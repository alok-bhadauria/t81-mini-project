import { Button } from "../components/common/Button";
import { useNavigate } from "react-router-dom";
import { Keyboard, Mic, FileText, ArrowRight, Zap, Shield, Globe } from "lucide-react";
import { useAuth } from "../context/AuthContext";
import { useDocumentTitle } from "../hooks/useDocumentTitle";

export function Landing() {
    useDocumentTitle("Home");
    const navigate = useNavigate();
    const { isLoggedIn } = useAuth();

    const handleCTA = () => {
        if (isLoggedIn) {
            navigate('/translate');
        } else {
            navigate('/login');
        }
    };

    return (
        <div className="flex flex-col min-h-[calc(100vh-8rem)]">
            <section className="flex-1 flex flex-col items-center justify-center text-center px-4 py-20 animate-in fade-in slide-in-from-bottom-8 duration-700">
                <div className="inline-block p-1 px-3 rounded-full bg-orange-500/10 text-orange-600 dark:text-orange-400 font-semibold mb-8 border border-orange-500/20 backdrop-blur-md">
                    Welcome to SignFusion v2.0
                </div>
                <h1 className="text-5xl md:text-7xl font-extrabold tracking-tight text-[var(--text-primary)] mb-6 max-w-4xl leading-tight">
                    Bridge the Gap with <span className="text-transparent bg-clip-text bg-gradient-to-r from-[var(--primary)] to-[var(--accent)] drop-shadow-sm">Sign Language</span>
                </h1>
                <p className="text-xl text-[var(--text-secondary)] mb-10 max-w-2xl mx-auto leading-relaxed">
                    Instantly transform English text, speech, and documents into fluid American Sign Language animations. Break down communication barriers effortlessly.
                </p>
                <div className="flex flex-col sm:flex-row gap-4 items-center mb-24">
                    <Button size="lg" className="h-14 px-8 text-lg rounded-full shadow-xl shadow-orange-500/20 group hover:scale-105 transition-all" onClick={handleCTA}>
                        {isLoggedIn ? "Open Application" : "Start Translating Now"}
                        <ArrowRight className="ml-2 group-hover:translate-x-1 transition-transform" />
                    </Button>
                    <Button variant="outline" size="lg" className="h-14 px-8 text-lg rounded-full hover:bg-[var(--bg-surface)]">
                        Read Documentation
                    </Button>
                </div>

                <div className="grid md:grid-cols-3 gap-8 w-full max-w-5xl text-left border-t border-[var(--border-color)] pt-16 mt-auto">
                    <div className="space-y-4 hover:-translate-y-2 transition-transform duration-300">
                        <div className="w-12 h-12 rounded-xl bg-orange-500/10 text-orange-600 flex items-center justify-center">
                            <Keyboard size={24} />
                        </div>
                        <h3 className="text-xl font-bold">Text to ASL</h3>
                        <p className="text-[var(--text-secondary)] leading-relaxed">Type any English sentence and our NLP engine instantly analyzes grammar to output natural ASL structure.</p>
                    </div>
                    <div className="space-y-4 hover:-translate-y-2 transition-transform duration-300">
                        <div className="w-12 h-12 rounded-xl bg-blue-500/10 text-blue-600 flex items-center justify-center">
                            <Mic size={24} />
                        </div>
                        <h3 className="text-xl font-bold">Real-time Speech</h3>
                        <p className="text-[var(--text-secondary)] leading-relaxed">Speak directly into your microphone. Our STT engine translates your voice to sign language on the fly.</p>
                    </div>
                    <div className="space-y-4 hover:-translate-y-2 transition-transform duration-300">
                        <div className="w-12 h-12 rounded-xl bg-green-500/10 text-green-600 flex items-center justify-center">
                            <FileText size={24} />
                        </div>
                        <h3 className="text-xl font-bold">Document Parsing</h3>
                        <p className="text-[var(--text-secondary)] leading-relaxed">Upload PDFs or Word documents. We extract the readable content and process the entire file to ASL.</p>
                    </div>
                </div>
            </section>
        </div>
    );
}
