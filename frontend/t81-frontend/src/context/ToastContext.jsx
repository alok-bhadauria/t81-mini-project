import { createContext, useContext, useState, useCallback } from "react";
import { X, CheckCircle, AlertCircle, Info } from "lucide-react";
import { cn } from "../utils/cn";

const ToastContext = createContext({
    addToast: () => { },
});

export const useToast = () => useContext(ToastContext);

export const ToastProvider = ({ children }) => {
    const [toasts, setToasts] = useState([]);

    const addToast = useCallback((...args) => {
        let title, description, type = "info", duration = 3000;

        if (typeof args[0] === 'string') {
            title = args[0];
            type = args[1] || "info";
        } else if (args[0] && typeof args[0] === 'object') {
            ({ title, description, type = "info", duration = 3000 } = args[0]);
        }

        const id = Math.random().toString(36).substr(2, 9);
        setToasts((prev) => [...prev, { id, title, description, type }]);

        setTimeout(() => {
            removeToast(id);
        }, duration);
    }, []);

    const removeToast = useCallback((id) => {
        setToasts((prev) => prev.filter((toast) => toast.id !== id));
    }, []);

    return (
        <ToastContext.Provider value={{ addToast }}>
            {children}
            <div className="fixed bottom-4 right-4 z-50 flex flex-col gap-2 pointer-events-none">
                {toasts.map((toast) => (
                    <div
                        key={toast.id}
                        className={cn(
                            "pointer-events-auto min-w-[300px] max-w-[400px] p-4 rounded-lg border border-[var(--border-color)] bg-[var(--bg-surface)] text-[var(--text-primary)] flex items-start gap-3 transition-all animate-in slide-in-from-right-full backdrop-blur-sm",
                            toast.type === "success" && "border-l-4 border-l-green-500 shadow-[0_0_15px_-3px_rgba(34,197,94,0.4)]",
                            toast.type === "error" && "border-l-4 border-l-red-500 shadow-[0_0_15px_-3px_rgba(239,68,68,0.4)]",
                            toast.type === "info" && "border-l-4 border-l-blue-500 shadow-[0_0_15px_-3px_rgba(59,130,246,0.4)]",
                        )}
                    >
                        <div className="mt-0.5">
                            {toast.type === "success" && <CheckCircle className="text-green-500" size={18} />}
                            {toast.type === "error" && <AlertCircle className="text-red-500" size={18} />}
                            {toast.type === "info" && <Info className="text-blue-500" size={18} />}
                        </div>
                        <div className="flex-1">
                            {toast.title && <h4 className="font-semibold text-sm">{toast.title}</h4>}
                            {toast.description && <p className="text-sm text-[var(--text-secondary)]">{toast.description}</p>}
                        </div>
                        <button onClick={() => removeToast(toast.id)} className="text-[var(--text-secondary)] hover:text-[var(--text-primary)]">
                            <X size={16} />
                        </button>
                    </div>
                ))}
            </div>
        </ToastContext.Provider>
    );
};
