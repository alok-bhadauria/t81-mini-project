import { useNavigate } from "react-router-dom";
import { AvatarRenderer } from "../components/common/AvatarRenderer";
import { useAuth } from "../context/AuthContext";
import { useDocumentTitle } from "../hooks/useDocumentTitle";
import { Button } from "../components/common/Button";
import {
    ArrowRight, Keyboard, Mic, FileText, BookOpen, UploadCloud,
    History, Zap, Shield, Globe, Star, Check, ChevronRight,
    Volume2, Users, Brain, Sparkles, PlayCircle, Crown
} from "lucide-react";

const FEATURES = [
    {
        icon: Keyboard,
        color: "orange",
        title: "Text to ASL",
        description: "Type any English sentence. Our spaCy NLP engine parses grammar, reorders tokens for natural ASL structure, and drives a 3D avatar animation in real-time.",
        path: "/translate",
        state: { activeTab: "text" }
    },
    {
        icon: Mic,
        color: "blue",
        title: "Speech to ASL",
        description: "Speak directly into your microphone. Our Web Speech API capture pipeline transcribes your voice and hands it off to the full translation engine instantly.",
        path: "/translate",
        state: { activeTab: "speech" }
    },
    {
        icon: FileText,
        color: "green",
        title: "Document Parser",
        description: "Upload PDF or TXT files. Our backend extracts clean readable text, runs it through the NLP pipeline, and renders the full document as a sign animation sequence.",
        path: "/translate",
        state: { activeTab: "document" }
    },
    {
        icon: BookOpen,
        color: "purple",
        title: "Learn Sign Language",
        description: "Structured, image-based courses for ASL, BANZSL, CSL, LSF and more. Progress is auto-tracked per item, module and language — your learning follows you across devices.",
        path: "/learn",
        state: null
    },
    {
        icon: UploadCloud,
        color: "pink",
        title: "Media Uploads",
        description: "Upload and manage your documents in the cloud via Cloudinary integration. Securely revisit past uploads and re-translate them without re-uploading.",
        path: "/uploads",
        state: null
    },
    {
        icon: History,
        color: "teal",
        title: "Translation History",
        description: "Every translation you perform is saved to your personal timeline. Jump back to any past result, replay the animation, or export the ASL token stream.",
        path: "/history",
        state: null
    }
];

const TECH_STACK = [
    { label: "React + Vite", sublabel: "Frontend Framework" },
    { label: "FastAPI", sublabel: "Python Backend" },
    { label: "MongoDB", sublabel: "Persistent Storage" },
    { label: "spaCy NLP", sublabel: "Language Processing" },
    { label: "Three.js / FBX", sublabel: "3D Avatar Engine" },
    { label: "Cloudinary", sublabel: "Media CDN" },
    { label: "JWT Auth", sublabel: "Secure Sessions" },
    { label: "SlowAPI", sublabel: "Rate Limiting" }
];

const STATS = [
    { value: "4+", label: "Sign Languages" },
    { value: "3", label: "Input Modes" },
    { value: "2", label: "3D Avatars" },
    { value: "100%", label: "Accessible" }
];

const PLAN_HIGHLIGHTS = [
    { name: "Free", price: "$0", features: ["5 uploads", "Basic translation", "Standard avatars"] },
    { name: "Premium", price: "$29/mo", features: ["500 uploads", "Real-time speech", "All avatars & voices"], popular: true },
    { name: "Enterprise", price: "Custom", features: ["Unlimited uploads", "API access", "White-label"] }
];

const COLOR_MAP = {
    orange: { bg: "bg-orange-500/10", text: "text-orange-500", border: "border-orange-500/20" },
    blue:   { bg: "bg-blue-500/10",   text: "text-blue-500",   border: "border-blue-500/20" },
    green:  { bg: "bg-green-500/10",  text: "text-green-500",  border: "border-green-500/20" },
    purple: { bg: "bg-purple-500/10", text: "text-purple-500", border: "border-purple-500/20" },
    pink:   { bg: "bg-pink-500/10",   text: "text-pink-500",   border: "border-pink-500/20" },
    teal:   { bg: "bg-teal-500/10",   text: "text-teal-500",   border: "border-teal-500/20" }
};

export function Landing() {
    useDocumentTitle("Home");
    const navigate = useNavigate();
    const { isLoggedIn } = useAuth();

    const handleCTA = () => navigate(isLoggedIn ? "/translate" : "/login");
    const handleNav = (path, state) => {
        navigate(path, state ? { state } : undefined);
        window.scrollTo({ top: 0, behavior: "smooth" });
    };

    return (
        <div className="flex flex-col">

            {/* Hero Section */}
            <section className="relative flex flex-col items-center justify-center text-center px-4 pt-16 pb-24 animate-in fade-in slide-in-from-bottom-8 duration-700 overflow-hidden">
                <div className="absolute inset-0 pointer-events-none">
                    <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-[var(--primary)]/5 rounded-full blur-3xl" />
                    <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-[var(--accent)]/10 rounded-full blur-3xl" />
                </div>

                <div className="relative z-10 flex flex-col items-center">
                    <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-[var(--primary)]/10 text-[var(--primary)] font-semibold text-sm mb-8 border border-[var(--primary)]/20">
                        <Sparkles size={14} />
                        SignFusion v2.0 — Now with Avatar Studio & Course Learning
                    </div>

                    <h1 className="text-5xl md:text-7xl font-extrabold tracking-tight text-[var(--text-primary)] mb-6 max-w-4xl leading-tight">
                        Bridge the Gap with{" "}
                        <span className="text-transparent bg-clip-text bg-gradient-to-r from-[var(--primary)] to-[var(--accent)]">
                            Sign Language
                        </span>
                    </h1>

                    <p className="text-xl text-[var(--text-secondary)] mb-10 max-w-2xl mx-auto leading-relaxed">
                        Transform English text, live speech, and documents into fluid ASL animations using AI-powered NLP and real-time 3D avatars. Learn, translate, and break communication barriers.
                    </p>

                    <div className="flex flex-col sm:flex-row gap-4 items-center mb-16">
                        <Button
                            size="lg"
                            className="h-14 px-8 text-lg rounded-full shadow-xl shadow-orange-500/20 group hover:scale-105 transition-all"
                            onClick={handleCTA}
                        >
                            {isLoggedIn ? "Open Application" : "Start Translating Free"}
                            <ArrowRight className="ml-2 group-hover:translate-x-1 transition-transform" size={20} />
                        </Button>
                        <Button
                            variant="outline"
                            size="lg"
                            className="h-14 px-8 text-lg rounded-full hover:bg-[var(--bg-surface)]"
                            onClick={() => handleNav("/learn", null)}
                        >
                            <BookOpen className="mr-2" size={18} />
                            Explore Courses
                        </Button>
                    </div>

                    {/* Stats Row */}
                    <div className="flex flex-wrap justify-center gap-8 md:gap-16">
                        {STATS.map((stat) => (
                            <div key={stat.label} className="text-center">
                                <div className="text-3xl font-extrabold text-[var(--primary)]">{stat.value}</div>
                                <div className="text-sm text-[var(--text-secondary)] mt-1">{stat.label}</div>
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            {/* Feature Cards Grid */}
            <section className="px-4 pb-24 max-w-7xl mx-auto w-full">
                <div className="text-center mb-12">
                    <h2 className="text-3xl md:text-4xl font-extrabold text-[var(--text-primary)] mb-3">Everything You Need</h2>
                    <p className="text-[var(--text-secondary)] max-w-xl mx-auto">Six powerful modules built into a single, seamless platform.</p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {FEATURES.map((feat) => {
                        const Icon = feat.icon;
                        const c = COLOR_MAP[feat.color];
                        return (
                            <div
                                key={feat.title}
                                onClick={() => handleNav(feat.path, feat.state)}
                                className={`group p-6 rounded-2xl border border-[var(--border-color)] bg-[var(--bg-surface)] cursor-pointer transition-all duration-300 hover:-translate-y-2 hover:shadow-xl hover:border-[var(--primary)]/30 flex flex-col gap-4`}
                            >
                                <div className={`w-12 h-12 rounded-xl ${c.bg} ${c.text} flex items-center justify-center flex-shrink-0`}>
                                    <Icon size={24} />
                                </div>
                                <div className="flex-1">
                                    <h3 className="text-lg font-bold text-[var(--text-primary)] mb-2">{feat.title}</h3>
                                    <p className="text-sm text-[var(--text-secondary)] leading-relaxed">{feat.description}</p>
                                </div>
                                <div className={`flex items-center gap-1 text-sm font-semibold ${c.text} group-hover:gap-2 transition-all`}>
                                    Open <ChevronRight size={16} />
                                </div>
                            </div>
                        );
                    })}
                </div>
            </section>

            {/* How It Works */}
            <section className="px-4 pb-24 max-w-5xl mx-auto w-full">
                <div className="text-center mb-12">
                    <h2 className="text-3xl md:text-4xl font-extrabold text-[var(--text-primary)] mb-3">How It Works</h2>
                    <p className="text-[var(--text-secondary)] max-w-xl mx-auto">From raw input to animated sign language in three steps.</p>
                </div>

                <div className="grid md:grid-cols-3 gap-4 relative">
                    <div className="hidden md:block absolute top-8 left-1/3 right-1/3 h-0.5 bg-gradient-to-r from-[var(--border-color)] via-[var(--primary)]/50 to-[var(--border-color)]" />

                    {[
                        { step: "01", icon: Brain, title: "Input Your Content", desc: "Type text, speak into your mic, or upload a PDF. SignFusion accepts all three natively." },
                        { step: "02", icon: Zap, title: "NLP Processing", desc: "spaCy tokenizes and parses your English, reordering it into proper ASL grammar structure with sentiment analysis." },
                        { step: "03", icon: PlayCircle, title: "3D Avatar Renders", desc: "Your chosen avatar — AJ or Amy — performs each sign in sequence, fully synchronized with your content." }
                    ].map((step) => {
                        const Icon = step.icon;
                        return (
                            <div key={step.step} className="relative flex flex-col items-center text-center p-6 rounded-2xl bg-[var(--bg-surface)] border border-[var(--border-color)]">
                                <div className="w-16 h-16 rounded-full bg-[var(--primary)]/10 text-[var(--primary)] flex items-center justify-center mb-4 text-xl font-black">
                                    {step.step}
                                </div>
                                <Icon size={24} className="text-[var(--primary)] mb-3" />
                                <h3 className="font-bold text-[var(--text-primary)] mb-2">{step.title}</h3>
                                <p className="text-sm text-[var(--text-secondary)] leading-relaxed">{step.desc}</p>
                            </div>
                        );
                    })}
                </div>
            </section>

            {/* Avatar Studio Callout */}
            <section className="px-4 pb-24 max-w-7xl mx-auto w-full">
                <div className="rounded-3xl border border-[var(--primary)]/20 bg-gradient-to-br from-[var(--primary)]/5 via-[var(--bg-surface)] to-[var(--accent)]/5 p-10 md:p-16 flex flex-col md:flex-row items-center gap-10">
                    <div className="flex-1">
                        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[var(--primary)]/10 text-[var(--primary)] text-xs font-bold mb-4">
                            <Star size={12} /> New in v2.0
                        </div>
                        <h2 className="text-3xl md:text-4xl font-extrabold text-[var(--text-primary)] mb-4">
                            Choose Your Avatar
                        </h2>
                        <p className="text-[var(--text-secondary)] leading-relaxed mb-6 max-w-lg">
                            Select from multiple 3D characters — AJ and Amy — directly in your settings. Your avatar preference is saved to your profile and applied instantly across all translation sessions. New characters are discovered automatically as they are added.
                        </p>
                        <div className="flex flex-wrap gap-3">
                            <Button onClick={() => handleNav("/settings", null)} className="rounded-full">
                                <Users className="mr-2" size={16} />
                                Open Avatar Studio
                            </Button>
                            <Button variant="outline" onClick={() => handleNav("/translate", null)} className="rounded-full">
                                <PlayCircle className="mr-2" size={16} />
                                See it in Action
                            </Button>
                        </div>
                    </div>
                    <div className="flex gap-4 shrink-0">
                        {["AJ", "Amy"].map((name) => (
                            <div key={name} className="relative w-32 h-44 rounded-2xl border-2 border-[var(--primary)]/30 bg-zinc-100 dark:bg-zinc-800 shadow-lg overflow-hidden">
                                <div className="absolute inset-0">
                                    <AvatarRenderer playing={false} avatarName={name} />
                                </div>
                                <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/70 via-black/30 to-transparent p-2 flex justify-center">
                                    <span className="text-xs font-bold text-white">{name}</span>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            {/* Tech Stack */}
            <section className="px-4 pb-24 max-w-7xl mx-auto w-full">
                <div className="text-center mb-12">
                    <h2 className="text-3xl md:text-4xl font-extrabold text-[var(--text-primary)] mb-3">Built With Modern Technology</h2>
                    <p className="text-[var(--text-secondary)] max-w-xl mx-auto">A production-grade full-stack architecture powering every translation.</p>
                </div>

                <div className="flex flex-wrap justify-center gap-3">
                    {TECH_STACK.map((tech) => (
                        <div
                            key={tech.label}
                            className="flex flex-col items-center px-6 py-4 rounded-2xl bg-[var(--bg-surface)] border border-[var(--border-color)] hover:border-[var(--primary)]/40 hover:shadow-md transition-all hover:-translate-y-1 min-w-[8rem] text-center"
                        >
                            <span className="font-bold text-[var(--text-primary)] text-sm">{tech.label}</span>
                            <span className="text-xs text-[var(--text-secondary)] mt-1">{tech.sublabel}</span>
                        </div>
                    ))}
                </div>
            </section>

            {/* Pricing Teaser */}
            <section className="px-4 pb-24 max-w-5xl mx-auto w-full">
                <div className="text-center mb-12">
                    <h2 className="text-3xl md:text-4xl font-extrabold text-[var(--text-primary)] mb-3">Simple, Transparent Pricing</h2>
                    <p className="text-[var(--text-secondary)] max-w-xl mx-auto">Start free. Scale as you grow. Cancel anytime.</p>
                </div>

                <div className="grid md:grid-cols-3 gap-6">
                    {PLAN_HIGHLIGHTS.map((plan) => (
                        <div
                            key={plan.name}
                            className={`relative p-8 rounded-2xl border flex flex-col gap-4 transition-all duration-300 hover:shadow-xl hover:-translate-y-1 ${
                                plan.popular
                                    ? "border-[var(--primary)] bg-[var(--primary)]/5 shadow-lg shadow-orange-500/10"
                                    : "border-[var(--border-color)] bg-[var(--bg-surface)]"
                            }`}
                        >
                            {plan.popular && (
                                <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-[var(--primary)] text-white px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider">
                                    Most Popular
                                </div>
                            )}
                            <div>
                                <p className="text-sm font-semibold text-[var(--text-secondary)] uppercase tracking-wider mb-1">{plan.name}</p>
                                <p className="text-4xl font-extrabold text-[var(--text-primary)]">{plan.price}</p>
                            </div>
                            <ul className="space-y-2 flex-1">
                                {plan.features.map((f) => (
                                    <li key={f} className="flex items-center gap-2 text-sm text-[var(--text-secondary)]">
                                        <Check size={14} className="text-green-500 shrink-0" />
                                        {f}
                                    </li>
                                ))}
                            </ul>
                            <Button
                                variant={plan.popular ? "default" : "outline"}
                                className="w-full rounded-xl"
                                onClick={() => handleNav("/plans", null)}
                            >
                                {plan.name === "Enterprise" ? "Contact Sales" : `Get ${plan.name}`}
                            </Button>
                        </div>
                    ))}
                </div>

                <div className="text-center mt-8">
                    <button
                        onClick={() => handleNav("/plans", null)}
                        className="text-[var(--primary)] font-semibold hover:underline text-sm flex items-center gap-1 mx-auto"
                    >
                        View full pricing details <ChevronRight size={16} />
                    </button>
                </div>
            </section>

            {/* Final CTA Banner */}
            <section className="px-4 pb-24 max-w-7xl mx-auto w-full">
                <div className="rounded-3xl bg-gradient-to-r from-[var(--primary)] to-orange-400 p-12 md:p-16 text-white text-center flex flex-col items-center gap-6">
                    <Crown size={48} className="opacity-90" />
                    <h2 className="text-3xl md:text-5xl font-extrabold max-w-2xl leading-tight">
                        Ready to break communication barriers?
                    </h2>
                    <p className="text-white/80 max-w-lg text-lg">
                        Join thousands of users making the world more accessible, one sign at a time.
                    </p>
                    <Button
                        size="lg"
                        className="h-14 px-10 text-lg rounded-full bg-white text-orange-600 hover:bg-orange-50 font-bold shadow-2xl group hover:scale-105 transition-all"
                        onClick={handleCTA}
                    >
                        {isLoggedIn ? "Go to App" : "Create Free Account"}
                        <ArrowRight className="ml-2 group-hover:translate-x-1 transition-transform" size={20} />
                    </Button>
                </div>
            </section>

        </div>
    );
}
