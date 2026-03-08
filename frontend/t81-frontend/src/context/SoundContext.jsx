import { createContext, useContext, useState, useEffect } from "react";

const SoundContext = createContext({
    isSoundEnabled: true,
    toggleSound: () => { },
});

export const useSound = () => {
    const context = useContext(SoundContext);
    if (!context) {
        throw new Error("useSound must be used within a SoundProvider");
    }
    return context;
};

export const SoundProvider = ({ children }) => {
    const [isSoundEnabled, setIsSoundEnabled] = useState(() => {
        try {
            const saved = localStorage.getItem("sf_isSoundEnabled");
            return saved !== null ? JSON.parse(saved) : true;
        } catch (e) {
            return true;
        }
    });

    useEffect(() => {
        localStorage.setItem("sf_isSoundEnabled", JSON.stringify(isSoundEnabled));
    }, [isSoundEnabled]);

    const toggleSound = () => {
        setIsSoundEnabled(prev => !prev);
    };

    return (
        <SoundContext.Provider value={{ isSoundEnabled, toggleSound }}>
            {children}
        </SoundContext.Provider>
    );
};
