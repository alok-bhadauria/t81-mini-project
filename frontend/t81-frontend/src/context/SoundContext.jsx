import { createContext, useContext, useState, useEffect } from "react";

const SoundContext = createContext({
    isSoundEnabled: true,
    toggleSound: () => { },
    soundModel: null,
    setSoundModel: () => { },
    availableVoices: [],
    speak: () => { }
});

export const useSound = () => {
    const context = useContext(SoundContext);
    if (!context) {
        throw new Error("useSound must be used within a SoundProvider");
    }
    return context;
};

export const SoundProvider = ({ children }) => {
    const [availableVoices, setAvailableVoices] = useState([]);
    const [soundModel, setSoundModel] = useState(() => {
        try {
            return localStorage.getItem("sf_soundModel") || null;
        } catch {
            return null;
        }
    });

    const [isSoundEnabled, setIsSoundEnabled] = useState(() => {
        try {
            const saved = localStorage.getItem("sf_isSoundEnabled");
            return saved !== null ? JSON.parse(saved) : true;
        } catch (e) {
            return true;
        }
    });

    useEffect(() => {
        const loadVoices = () => {
            let voices = window.speechSynthesis.getVoices();
            if (voices.length > 0) {
                // Filter English voices
                voices = voices.filter(v => v.lang.startsWith("en"));
                // Deduplicate and limit to 4 distinct voices
                const distinctVoices = [];
                const seenNames = new Set();
                for (const v of voices) {
                    if (!seenNames.has(v.name)) {
                        seenNames.add(v.name);
                        distinctVoices.push({ uri: v.voiceURI, name: v.name, lang: v.lang, voice: v });
                        if (distinctVoices.length >= 4) break;
                    }
                }
                setAvailableVoices(distinctVoices);
                if (!localStorage.getItem("sf_soundModel") && distinctVoices.length > 0) {
                    setSoundModel(distinctVoices[0].uri);
                }
            }
        };

        loadVoices();
        if (window.speechSynthesis.onvoiceschanged !== undefined) {
            window.speechSynthesis.onvoiceschanged = loadVoices;
        }
    }, []);

    useEffect(() => {
        localStorage.setItem("sf_isSoundEnabled", JSON.stringify(isSoundEnabled));
    }, [isSoundEnabled]);

    useEffect(() => {
        if (soundModel) {
            localStorage.setItem("sf_soundModel", soundModel);
        }
    }, [soundModel]);

    const toggleSound = () => {
        setIsSoundEnabled(prev => !prev);
    };

    const speak = (text, overrideVoiceUri = null) => {
        if (!isSoundEnabled || !text) return;
        window.speechSynthesis.cancel(); // Stop current speech
        const utterance = new SpeechSynthesisUtterance(text);
        
        const targetModel = overrideVoiceUri || soundModel;
        if (targetModel && availableVoices.length > 0) {
            const voice = availableVoices.find(v => v.uri === targetModel);
            if (voice) {
                utterance.voice = voice.voice;
            }
        }
        window.speechSynthesis.speak(utterance);
    };

    return (
        <SoundContext.Provider value={{ isSoundEnabled, toggleSound, soundModel, setSoundModel, availableVoices, speak }}>
            {children}
        </SoundContext.Provider>
    );
};
