import { Github, Twitter, Linkedin } from "lucide-react";
import { Link, useNavigate } from "react-router-dom";

export function Footer() {
    const navigate = useNavigate();

    const handleNav = (e, path) => {
        e.preventDefault();
        navigate(path);
        window.scrollTo({ top: 0, behavior: 'smooth' });
    };

    return (
        <footer className="bg-[var(--bg-surface)] border-t border-[var(--border-color)] mt-auto">
            <div className="max-w-7xl mx-auto px-6 py-12">
                <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
                    <div className="md:col-span-1 space-y-4">
                        <Link to="/" onClick={() => window.scrollTo(0, 0)} className="flex items-center gap-2">
                            <div className="w-8 h-8 rounded-lg bg-[var(--primary)] text-white flex items-center justify-center font-bold text-lg shadow-md">
                                S
                            </div>
                            <span className="font-bold text-xl tracking-tight text-[var(--text-primary)]">
                                SignFusion
                            </span>
                        </Link>
                        <p className="text-sm text-[var(--text-secondary)] leading-relaxed">
                            Breaking communication barriers with AI-powered Sign Language translation.
                            Seamlessly convert Text, Speech, and Documents into accurate ASL animations.
                        </p>
                    </div>

                    <div className="space-y-4">
                        <h4 className="font-semibold text-[var(--text-primary)]">Product</h4>
                        <ul className="space-y-2 text-sm text-[var(--text-secondary)]">
                            <li><button onClick={(e) => handleNav(e, '/translate')} className="hover:text-[var(--primary)] transition-colors text-left w-full">Text to ASL</button></li>
                            <li><button onClick={(e) => handleNav(e, '/translate')} className="hover:text-[var(--primary)] transition-colors text-left w-full">Speech to ASL</button></li>
                            <li><button onClick={(e) => handleNav(e, '/translate')} className="hover:text-[var(--primary)] transition-colors text-left w-full">Document Parser</button></li>
                            <li><button onClick={(e) => handleNav(e, '/settings')} className="hover:text-[var(--primary)] transition-colors text-left w-full">Avatar Studio</button></li>
                        </ul>
                    </div>

                    <div className="space-y-4">
                        <h4 className="font-semibold text-[var(--text-primary)]">Resources</h4>
                        <ul className="space-y-2 text-sm text-[var(--text-secondary)]">
                            <li><a href="#" className="hover:text-[var(--primary)] transition-colors w-full">Documentation</a></li>
                            <li><a href="#" className="hover:text-[var(--primary)] transition-colors w-full">API Reference</a></li>
                            <li><button onClick={(e) => handleNav(e, '/uploads')} className="hover:text-[var(--primary)] transition-colors text-left w-full">Uploads</button></li>
                            <li><button onClick={(e) => handleNav(e, '/support')} className="hover:text-[var(--primary)] transition-colors text-left w-full">Help Center</button></li>
                        </ul>
                    </div>

                    <div className="space-y-4">
                        <h4 className="font-semibold text-[var(--text-primary)]">Legal</h4>
                        <ul className="space-y-2 text-sm text-[var(--text-secondary)]">
                            <li><a href="#" className="hover:text-[var(--primary)] transition-colors w-full">Privacy Policy</a></li>
                            <li><a href="#" className="hover:text-[var(--primary)] transition-colors w-full">Terms of Service</a></li>
                            <li><a href="#" className="hover:text-[var(--primary)] transition-colors w-full">Cookie Policy</a></li>
                            <li><a href="#" className="hover:text-[var(--primary)] transition-colors w-full">Accessibility</a></li>
                        </ul>
                    </div>
                </div>

                <div className="border-t border-[var(--border-color)] mt-12 pt-8 flex flex-col md:flex-row justify-between items-center gap-4">
                    <p className="text-xs text-[var(--text-secondary)]">
                        &copy; {new Date().getFullYear()} SignFusion Inc. All rights reserved. • Designed by Team 81
                    </p>

                    <div className="flex items-center gap-4">
                        <a href="#" className="text-[var(--text-secondary)] hover:text-[var(--primary)] transition-colors">
                            <Github size={20} />
                        </a>
                        <a href="#" className="text-[var(--text-secondary)] hover:text-[var(--primary)] transition-colors">
                            <Twitter size={20} />
                        </a>
                        <a href="#" className="text-[var(--text-secondary)] hover:text-[var(--primary)] transition-colors">
                            <Linkedin size={20} />
                        </a>
                    </div>
                </div>
            </div>
        </footer>
    );
}
