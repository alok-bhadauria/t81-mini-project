import { Card } from "../components/common/Card";
import { Palette, Volume2, User } from "lucide-react";
import { useTheme } from "../context/ThemeContext";
import { useSound } from "../context/SoundContext";
import { useToast } from "../context/ToastContext";
import { useDocumentTitle } from "../hooks/useDocumentTitle";

export function Settings() {
    useDocumentTitle("Settings");
    const { theme, toggleTheme } = useTheme();
    const { isSoundEnabled, toggleSound } = useSound();
    const { addToast } = useToast();

    const handleSoundToggle = () => {
        toggleSound();
        addToast({
            title: !isSoundEnabled ? "Sound Enabled" : "Sound Disabled",
            description: !isSoundEnabled ? "Audio feedback active." : "Audio feedback muted.",
            type: "success"
        });
    };

    const handleThemeToggle = () => {
        toggleTheme();
        addToast({ title: "Theme Updated", type: "info" });
    };

    return (
        <div className="max-w-4xl mx-auto space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
            <div className="space-y-2">
                <h2 className="text-3xl font-bold text-[var(--text-primary)]">Preferences</h2>
                <p className="text-[var(--text-secondary)]">Manage your app settings and appearance.</p>
            </div>

            <div className="grid gap-6 md:grid-cols-2">
                <Card className="p-6 hover:border-[var(--primary)]/50 transition-colors">
                    <div className="space-y-4">
                        <div className="flex items-center gap-3 mb-2">
                            <div className="p-2 rounded-lg bg-blue-100 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400">
                                <Palette size={24} />
                            </div>
                            <div>
                                <h3 className="font-semibold text-lg">Appearance</h3>
                                <p className="text-sm text-[var(--text-secondary)]">Customize the look and feel</p>
                            </div>
                        </div>
                        <div className="flex items-center justify-between p-3 rounded-lg bg-[var(--bg-background)]">
                            <span className="font-medium">Dark Mode</span>
                            <div
                                className={`w-12 h-6 rounded-full p-1 cursor-pointer transition-colors ${theme === 'dark' ? 'bg-[var(--primary)]' : 'bg-zinc-300'}`}
                                onClick={handleThemeToggle}
                            >
                                <div className={`w-4 h-4 rounded-full bg-white shadow-sm transform transition-transform ${theme === 'dark' ? 'translate-x-6' : 'translate-x-0'}`} />
                            </div>
                        </div>
                    </div>
                </Card>

                <Card className="p-6 hover:border-[var(--primary)]/50 transition-colors">
                    <div className="space-y-4">
                        <div className="flex items-center gap-3 mb-2">
                            <div className="p-2 rounded-lg bg-green-100 text-green-600 dark:bg-green-900/30 dark:text-green-400">
                                <Volume2 size={24} />
                            </div>
                            <div>
                                <h3 className="font-semibold text-lg">Sound</h3>
                                <p className="text-sm text-[var(--text-secondary)]">Audio feedback settings</p>
                            </div>
                        </div>
                        <div className="flex items-center justify-between p-3 rounded-lg bg-[var(--bg-background)]">
                            <span className="font-medium">Sound Effects</span>
                            <div
                                className={`w-12 h-6 rounded-full p-1 cursor-pointer transition-colors ${isSoundEnabled ? 'bg-[var(--primary)]' : 'bg-zinc-300'}`}
                                onClick={handleSoundToggle}
                            >
                                <div className={`w-4 h-4 rounded-full bg-white shadow-sm transform transition-transform ${isSoundEnabled ? 'translate-x-6' : 'translate-x-0'}`} />
                            </div>
                        </div>
                    </div>
                </Card>

                <Card className="p-6 hover:border-[var(--primary)]/50 transition-colors md:col-span-2">
                    <div className="space-y-4">
                        <div className="flex items-center gap-3 mb-2">
                            <div className="p-2 rounded-lg bg-purple-100 text-purple-600 dark:bg-purple-900/30 dark:text-purple-400">
                                <User size={24} />
                            </div>
                            <div>
                                <h3 className="font-semibold text-lg">Avatar Customization</h3>
                                <p className="text-sm text-[var(--text-secondary)]">Personalize your ASL interpreter</p>
                            </div>
                        </div>
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                            {[1, 2, 3, 4].map((i) => (
                                <div key={i} className="aspect-square rounded-xl bg-[var(--bg-background)] border-2 border-[var(--border-color)] hover:border-[var(--primary)] cursor-pointer flex items-center justify-center group overflow-hidden relative">
                                    <div className="absolute inset-x-0 bottom-0 top-1/2 bg-gradient-to-t from-black/50 to-transparent opacity-0 group-hover:opacity-100 transition-opacity flex items-end justify-center p-2">
                                        <span className="text-white text-xs font-bold">Select</span>
                                    </div>
                                    <User size={40} className="text-[var(--text-secondary)]" />
                                </div>
                            ))}
                        </div>
                    </div>
                </Card>
            </div>
        </div>
    );
}
