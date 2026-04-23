import { Card } from "../components/common/Card";
import { Button } from "../components/common/Button";
import { Clock, MessageSquare, Play, Trash2 } from "lucide-react";
import { useAuth } from "../context/AuthContext";
import { useNavigate } from "react-router-dom";
import { useDocumentTitle } from "../hooks/useDocumentTitle";
import { useToast } from "../context/ToastContext";
import { useState, useEffect, useRef } from "react";
import { api } from "../services/api";

export function History() {
    useDocumentTitle("History");
    const { isLoggedIn } = useAuth();
    const { addToast } = useToast();
    const navigate = useNavigate();

    const [historyList, setHistoryList] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const toastRef = useRef(addToast);

    useEffect(() => {
        if (!isLoggedIn) return;
        const fetchHistory = async () => {
            try {
                const data = await api.get("/history");
                const formattedData = data.map((item) => ({
                    ...item,
                    date: item.date
                        ? new Date(item.date).toLocaleString([], { dateStyle: "medium", timeStyle: "short" })
                        : "Unknown Date",
                }));
                setHistoryList(formattedData);
            } catch (error) {
                toastRef.current({ title: "Failed to load history", description: error.message, type: "error" });
            } finally {
                setIsLoading(false);
            }
        };
        fetchHistory();
    }, [isLoggedIn]);

    const handleDelete = async (e, id) => {
        e.stopPropagation();
        try {
            await api.delete(`/history/${id}`);
            setHistoryList((prev) => prev.filter((item) => item.id !== id));
            addToast({ title: "History item deleted", type: "success" });
        } catch (error) {
            addToast({ title: "Failed to delete history item", description: error.message, type: "error" });
        }
    };

    return (
        <div className="max-w-5xl mx-auto space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
            <div className="space-y-2 pb-4 border-b border-[var(--border-color)]">
                <h2 className="text-3xl font-bold text-[var(--text-primary)]">Translation History</h2>
                <p className="text-[var(--text-secondary)]">View your past translations and replay animations.</p>
            </div>

            {!isLoggedIn ? (
                <Card className="p-12 text-center space-y-6">
                    <div className="w-20 h-20 bg-blue-100 dark:bg-blue-500/10 text-blue-600 dark:text-blue-500 rounded-full flex items-center justify-center mx-auto">
                        <Clock size={40} />
                    </div>
                    <h3 className="text-2xl font-bold">Login to view history</h3>
                    <p className="text-[var(--text-secondary)] max-w-md mx-auto">Securely access all your past grammar translations and replay 3D animations anytime.</p>
                    <div className="flex justify-center gap-4">
                        <Button onClick={() => navigate("/login")}>Log In / Sign Up</Button>
                    </div>
                </Card>
            ) : (
                <Card className="overflow-hidden">
                    <div className="overflow-x-auto">
                        <table className="w-full text-left border-collapse">
                            <thead>
                                <tr className="border-b border-[var(--border-color)] bg-[var(--bg-background)] text-[var(--text-secondary)] text-sm uppercase tracking-wider">
                                    <th className="p-4 font-semibold w-1/3">Original Text</th>
                                    <th className="p-4 font-semibold w-1/3">ASL Grammar</th>
                                    <th className="p-4 font-semibold w-1/6">Date</th>
                                    <th className="p-4 font-semibold w-1/6 text-right">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-[var(--border-color)]">
                                {isLoading ? (
                                    <tr>
                                        <td colSpan={4} className="p-8 text-center text-[var(--text-secondary)]">Loading...</td>
                                    </tr>
                                ) : historyList.length === 0 ? (
                                    <tr>
                                        <td colSpan={4} className="p-8 text-center text-[var(--text-secondary)]">No translation history yet.</td>
                                    </tr>
                                ) : (
                                    historyList.map((item) => (
                                        <tr key={item.id} className="hover:bg-[var(--bg-background)]/50 transition-colors group">
                                            <td className="p-4">
                                                <div className="flex items-start gap-3">
                                                    <MessageSquare size={16} className="mt-1 text-[var(--text-secondary)] opacity-50 flex-shrink-0" />
                                                    <p className="text-[var(--text-primary)] font-medium line-clamp-2">{item.text}</p>
                                                </div>
                                            </td>
                                            <td className="p-4">
                                                <code className="text-[var(--primary)] bg-[var(--primary)]/10 px-2 py-1 rounded text-sm font-bold tracking-wide">{item.asl}</code>
                                            </td>
                                            <td className="p-4 text-[var(--text-secondary)] text-sm whitespace-nowrap">{item.date}</td>
                                            <td className="p-4 text-right">
                                                <div className="flex items-center justify-end gap-2">
                                                    <Button
                                                        variant="outline"
                                                        size="sm"
                                                        onClick={() => navigate("/translate")}
                                                        className="group-hover:border-[var(--primary)] group-hover:text-[var(--primary)] transition-colors"
                                                    >
                                                        <Play size={14} className="mr-2" />
                                                        See Animation
                                                    </Button>
                                                    <Button
                                                        variant="ghost"
                                                        size="sm"
                                                        onClick={(e) => handleDelete(e, item.id)}
                                                        className="text-[var(--text-secondary)] hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-950/30 transition-colors px-2"
                                                        title="Delete History"
                                                    >
                                                        <Trash2 size={16} />
                                                    </Button>
                                                </div>
                                            </td>
                                        </tr>
                                    ))
                                )}
                            </tbody>
                        </table>
                    </div>
                </Card>
            )}
        </div>
    );
}
