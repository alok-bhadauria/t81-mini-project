import { Card } from "../components/common/Card";
import { Palette, Volume2, User, Mic, PlayCircle, Users, Loader2, Check } from "lucide-react";
import { useState, useEffect } from "react";
import { api } from "../services/api";
import { useAuth } from "../context/AuthContext";
import { useTheme } from "../context/ThemeContext";
import { useSound } from "../context/SoundContext";
import { useToast } from "../context/ToastContext";
import { useDocumentTitle } from "../hooks/useDocumentTitle";
import { AvatarRenderer } from "../components/common/AvatarRenderer";

export function Settings() {
    useDocumentTitle("Settings");
    const { theme, toggleTheme } = useTheme();
    const { isSoundEnabled, toggleSound, soundModel, setSoundModel, availableVoices, speak } = useSound();
    const { addToast } = useToast();
    const { user, updateUserState, isLoggedIn } = useAuth();
    
    const [avatars, setAvatars] = useState([]);
    const [isLoadingAvatars, setIsLoadingAvatars] = useState(true);

    useEffect(() => {
        api.get("/avatars")
            .then(data => {
                setAvatars(data.characters || []);
                setIsLoadingAvatars(false);
            })
            .catch(err => {
                console.error("Failed to load avatars:", err);
                setIsLoadingAvatars(false);
            });
    }, []);

    const handleAvatarSelect = async (avatarName) => {
        if (!isLoggedIn) {
            addToast({ title: "Login Required", description: "You must be logged in to save preferences.", type: "error" });
            return;
        }
        if (user?.avatar === avatarName) return;

        try {
            await api.put("/auth/me", { avatar: avatarName });
            updateUserState({ avatar: avatarName });
            addToast({ title: "Avatar Updated", description: `Your default character is now ${avatarName}.`, type: "success" });
        } catch (error) {
            addToast({ title: "Update Failed", description: error.message || "Failed to save avatar preference.", type: "error" });
        }
    };

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
                        <div className="flex items-center gap-3 mb-4">
                            <div className="p-2 rounded-lg bg-orange-100 text-orange-600 dark:bg-orange-900/30 dark:text-orange-400">
                                <Mic size={24} />
                            </div>
                            <div>
                                <h3 className="font-semibold text-lg">Voice Model</h3>
                                <p className="text-sm text-[var(--text-secondary)]">Select the voice used for pronunciation</p>
                            </div>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            {availableVoices.length === 0 ? (
                                <p className="text-sm text-[var(--text-secondary)]">No voice models available on this device.</p>
                            ) : (
                                availableVoices.map((voice, idx) => (
                                    <div 
                                        key={voice.uri} 
                                        onClick={() => setSoundModel(voice.uri)}
                                        className={`flex items-center justify-between p-4 rounded-xl border-2 cursor-pointer transition-all ${
                                            soundModel === voice.uri 
                                                ? 'border-[var(--primary)] bg-[var(--primary)]/5' 
                                                : 'border-[var(--border-color)] bg-[var(--bg-background)] hover:border-[var(--primary)]/50'
                                        }`}
                                    >
                                        <div className="flex items-center gap-3">
                                            <div className={`w-4 h-4 rounded-full border-2 flex items-center justify-center ${
                                                soundModel === voice.uri ? 'border-[var(--primary)]' : 'border-zinc-400'
                                            }`}>
                                                {soundModel === voice.uri && <div className="w-2 h-2 rounded-full bg-[var(--primary)]" />}
                                            </div>
                                            <div>
                                                <p className="font-semibold text-[var(--text-primary)]">Voice {idx + 1}</p>
                                                <p className="text-xs text-[var(--text-secondary)] break-words max-w-[200px]">{voice.name}</p>
                                            </div>
                                        </div>
                                        <button 
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                const originalModel = soundModel;
                                                setSoundModel(voice.uri);
                                                speak("Hello, this is a test of the voice model.", voice.uri);
                                            }}
                                            className="p-2 text-[var(--text-secondary)] hover:text-[var(--primary)] transition-colors"
                                            title="Preview Voice"
                                        >
                                            <PlayCircle size={20} />
                                        </button>
                                    </div>
                                ))
                            )}
                        </div>
                    </div>
                </Card>

                <Card className="p-6 hover:border-[var(--primary)]/50 transition-colors md:col-span-2">
                    <div className="space-y-4">
                        <div className="flex items-center gap-3 mb-4">
                            <div className="p-2 rounded-lg bg-indigo-100 text-indigo-600 dark:bg-indigo-900/30 dark:text-indigo-400">
                                <Users size={24} />
                            </div>
                            <div>
                                <h3 className="font-semibold text-lg">Avatar Preference</h3>
                                <p className="text-sm text-[var(--text-secondary)]">Select your default 3D character for ASL translations.</p>
                            </div>
                        </div>
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                            {isLoadingAvatars ? (
                                <div className="col-span-full flex justify-center py-4">
                                    <Loader2 size={24} className="animate-spin text-[var(--primary)] opacity-50" />
                                </div>
                            ) : avatars.length === 0 ? (
                                <p className="text-sm text-[var(--text-secondary)] col-span-full">No avatars found.</p>
                            ) : (
                                avatars.map((avatar) => {
                                    const isSelected = (user?.avatar || "AJ") === avatar;
                                    return (
                                        <div 
                                            key={avatar} 
                                            onClick={() => handleAvatarSelect(avatar)}
                                            className={`relative aspect-square rounded-xl bg-[var(--bg-background)] border-2 cursor-pointer flex flex-col items-center justify-center transition-all hover:-translate-y-1 overflow-hidden group ${
                                                isSelected 
                                                    ? 'border-[var(--primary)] shadow-lg shadow-orange-500/20' 
                                                    : 'border-[var(--border-color)] hover:border-[var(--primary)]/50'
                                            }`}
                                        >
                                            <div className="absolute inset-0 z-0 bg-zinc-100 dark:bg-zinc-800 pointer-events-none">
                                                <AvatarRenderer playing={false} avatarName={avatar} />
                                            </div>
                                            
                                            <div className="absolute inset-x-0 bottom-0 z-10 bg-gradient-to-t from-black/80 via-black/40 to-transparent p-3 flex justify-center pointer-events-none">
                                                <span className={`text-sm font-bold tracking-wide ${isSelected ? 'text-[var(--primary)]' : 'text-white/90 group-hover:text-white'}`}>{avatar}</span>
                                            </div>
                                            
                                            {isSelected && (
                                                <div className="absolute top-2 right-2 z-10 bg-[var(--primary)] text-white w-6 h-6 rounded-full flex items-center justify-center shadow-md">
                                                    <Check size={14} strokeWidth={3} />
                                                </div>
                                            )}
                                        </div>
                                    );
                                })
                            )}
                        </div>
                    </div>
                </Card>
            </div>
        </div>
    );
}
