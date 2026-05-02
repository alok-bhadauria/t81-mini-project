import { Github, Linkedin, X } from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import { useState } from "react";

const MODAL_CONTENT = {
    "Documentation": "Our comprehensive documentation provides detailed guides and tutorials on integrating and utilizing SignFusion's core services. From setting up your first Text-to-ASL translation to advanced Avatar Studio configurations, our docs are constantly updated by our engineering team to ensure you have the most accurate information.",
    "API Reference": "The SignFusion REST API allows enterprise partners to embed real-time ASL translation directly into their own applications. Our endpoints are fully documented with request/response schemas, rate limit guidelines, and secure authentication methods using standard JWT practices.",
    "Community Forums": "Join thousands of developers, educators, and ASL learners in the SignFusion Community Forums. Share your custom avatar configurations, get help with tricky translations, and participate in our open-source initiatives to make digital spaces more accessible for everyone.",
    "Help Center": "Need assistance? Our Help Center is available 24/7. Whether you're experiencing billing issues, technical glitches, or just need advice on which Voice Model to select, our support team is ready to help you resolve your problems quickly and efficiently.",
    "Privacy Policy": "At SignFusion, your privacy is our priority. We do not sell your personal data. Any documents or speech processed through our translation engines are temporarily stored in secure, encrypted environments and are automatically purged after processing unless explicitly saved to your personal account.",
    "Terms of Service": "By using SignFusion, you agree to our Terms of Service. These terms govern your use of our platform, outlining acceptable use policies, intellectual property rights concerning custom avatars, and our commitment to providing a reliable, high-uptime service.",
    "Cookie Policy": "We use essential cookies to keep you logged in and remember your preferences (like Dark Mode and Sound Models). We also use anonymized analytics cookies to understand how our users interact with the platform, helping us improve the user experience over time.",
    "Accessibility": "SignFusion is built on the foundation of digital accessibility. We adhere to WCAG 2.1 Level AA standards to ensure our interface is usable by individuals with varying abilities. If you encounter any accessibility barriers on our site, please contact our support team immediately."
};

export function Footer() {
    const navigate = useNavigate();
    const [openModal, setOpenModal] = useState(null);

    const handleNav = (e, path, state = null) => {
        e.preventDefault();
        navigate(path, { state });
        window.scrollTo({ top: 0, behavior: 'smooth' });
    };

    const handleModal = (e, title) => {
        e.preventDefault();
        setOpenModal({ title, content: MODAL_CONTENT[title] });
    };

    return (
        <footer className="bg-[var(--bg-surface)] border-t border-[var(--border-color)] mt-auto relative">
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
                            <li><button onClick={(e) => handleNav(e, '/translate', { activeTab: 'text' })} className="hover:text-[var(--primary)] transition-colors text-left w-full">Text to ASL</button></li>
                            <li><button onClick={(e) => handleNav(e, '/translate', { activeTab: 'speech' })} className="hover:text-[var(--primary)] transition-colors text-left w-full">Speech to ASL</button></li>
                            <li><button onClick={(e) => handleNav(e, '/translate', { activeTab: 'document' })} className="hover:text-[var(--primary)] transition-colors text-left w-full">Document Parser</button></li>
                            <li><button onClick={(e) => handleNav(e, '/settings')} className="hover:text-[var(--primary)] transition-colors text-left w-full">Avatar Studio</button></li>
                        </ul>
                    </div>

                    <div className="space-y-4">
                        <h4 className="font-semibold text-[var(--text-primary)]">Resources</h4>
                        <ul className="space-y-2 text-sm text-[var(--text-secondary)]">
                            <li><button onClick={(e) => handleModal(e, 'Documentation')} className="hover:text-[var(--primary)] transition-colors text-left w-full">Documentation</button></li>
                            <li><button onClick={(e) => handleModal(e, 'API Reference')} className="hover:text-[var(--primary)] transition-colors text-left w-full">API Reference</button></li>
                            <li><button onClick={(e) => handleModal(e, 'Community Forums')} className="hover:text-[var(--primary)] transition-colors text-left w-full">Community Forums</button></li>
                            <li><button onClick={(e) => handleModal(e, 'Help Center')} className="hover:text-[var(--primary)] transition-colors text-left w-full">Help Center</button></li>
                        </ul>
                    </div>

                    <div className="space-y-4">
                        <h4 className="font-semibold text-[var(--text-primary)]">Legal</h4>
                        <ul className="space-y-2 text-sm text-[var(--text-secondary)]">
                            <li><button onClick={(e) => handleModal(e, 'Privacy Policy')} className="hover:text-[var(--primary)] transition-colors text-left w-full">Privacy Policy</button></li>
                            <li><button onClick={(e) => handleModal(e, 'Terms of Service')} className="hover:text-[var(--primary)] transition-colors text-left w-full">Terms of Service</button></li>
                            <li><button onClick={(e) => handleModal(e, 'Cookie Policy')} className="hover:text-[var(--primary)] transition-colors text-left w-full">Cookie Policy</button></li>
                            <li><button onClick={(e) => handleModal(e, 'Accessibility')} className="hover:text-[var(--primary)] transition-colors text-left w-full">Accessibility</button></li>
                        </ul>
                    </div>
                </div>

                <div className="border-t border-[var(--border-color)] mt-12 pt-8 flex flex-col md:flex-row justify-between items-center gap-4">
                    <p className="text-xs text-[var(--text-secondary)]">
                        &copy; {new Date().getFullYear()} SignFusion Inc. All rights reserved. • Designed by Team 81
                    </p>

                    <div className="flex items-center gap-4">
                        <a href="https://github.com/alok-bhadauria/t81-mini-project" target="_blank" rel="noopener noreferrer" className="text-[var(--text-secondary)] hover:text-[var(--primary)] transition-colors">
                            <Github size={20} />
                        </a>
                        <a href="https://www.linkedin.com/in/alok-bhadauria/" target="_blank" rel="noopener noreferrer" className="text-[var(--text-secondary)] hover:text-[var(--primary)] transition-colors">
                            <Linkedin size={20} />
                        </a>
                    </div>
                </div>
            </div>

            {openModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200" onClick={() => setOpenModal(null)}>
                    <div 
                        className="bg-[var(--bg-surface)] border border-[var(--border-color)] rounded-2xl p-8 max-w-lg w-full shadow-2xl relative animate-in zoom-in-95 duration-200"
                        onClick={(e) => e.stopPropagation()}
                    >
                        <button 
                            className="absolute top-4 right-4 p-2 text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-background)] rounded-full transition-colors"
                            onClick={() => setOpenModal(null)}
                        >
                            <X size={20} />
                        </button>
                        <h3 className="text-2xl font-bold text-[var(--text-primary)] mb-4 pr-8">{openModal.title}</h3>
                        <div className="text-[var(--text-secondary)] leading-relaxed space-y-4">
                            <p>{openModal.content}</p>
                            <p className="text-sm opacity-75 mt-6 border-t border-[var(--border-color)] pt-4">Last Updated: {new Date().toLocaleDateString()}</p>
                        </div>
                    </div>
                </div>
            )}
        </footer>
    );
}
