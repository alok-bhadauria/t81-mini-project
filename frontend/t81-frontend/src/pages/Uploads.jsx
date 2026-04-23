import { useState, useEffect, useRef } from "react";
import { Card } from "../components/common/Card";
import { Button } from "../components/common/Button";
import { UploadCloud, FileText, Eye, Play, Trash2 } from "lucide-react";
import { useAuth } from "../context/AuthContext";
import { useToast } from "../context/ToastContext";
import { useNavigate } from "react-router-dom";
import { useDocumentTitle } from "../hooks/useDocumentTitle";
import { api } from "../services/api";

export function Uploads() {
    useDocumentTitle("Uploads");
    const { isLoggedIn } = useAuth();
    const { addToast } = useToast();
    const navigate = useNavigate();

    const [viewFileModal, setViewFileModal] = useState(null);
    const [uploadList, setUploadList] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const toastRef = useRef(addToast);

    useEffect(() => {
        if (!isLoggedIn) return;
        const fetchUploads = async () => {
            try {
                const data = await api.get("/uploads");
                const formattedData = data.map((item) => ({
                    ...item,
                    date: item.date
                        ? new Date(item.date).toLocaleString([], { dateStyle: "medium", timeStyle: "short" })
                        : "Unknown Date",
                }));
                setUploadList(formattedData);
            } catch (error) {
                toastRef.current({ title: "Failed to load uploads", description: error.message, type: "error" });
            } finally {
                setIsLoading(false);
            }
        };
        fetchUploads();
    }, [isLoggedIn]);

    const handleDelete = async (e, id) => {
        e.stopPropagation();
        try {
            await api.delete(`/uploads/${id}`);
            setUploadList((prev) => prev.filter((item) => item.id !== id));
            addToast({ title: "Upload deleted", type: "success" });
        } catch (error) {
            addToast({ title: "Failed to delete upload", description: error.message, type: "error" });
        }
    };

    return (
        <div className="max-w-4xl mx-auto space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
            <div className="flex items-center justify-between pb-4 border-b border-[var(--border-color)]">
                <div className="space-y-2">
                    <h2 className="text-3xl font-bold text-[var(--text-primary)]">Uploads</h2>
                    <p className="text-[var(--text-secondary)]">Manage your saved documents.</p>
                </div>
                {isLoggedIn && !isLoading && (
                    <div className="text-right">
                        <div className="text-sm font-semibold text-[var(--text-primary)]">Storage Usage</div>
                        <div className="text-xs text-[var(--text-secondary)]">
                            {uploadList.length} / 5 Free Uploads
                        </div>
                        <div className="w-32 h-2 bg-zinc-200 dark:bg-zinc-800 rounded-full mt-1 overflow-hidden">
                            <div
                                className={`h-full rounded-full transition-all duration-500 ${uploadList.length >= 5 ? "bg-red-500" : "bg-[var(--primary)]"}`}
                                style={{ width: `${Math.min((uploadList.length / 5) * 100, 100)}%` }}
                            ></div>
                        </div>
                    </div>
                )}
            </div>

            {!isLoggedIn ? (
                <Card className="p-12 text-center space-y-6">
                    <div className="w-20 h-20 bg-orange-100 dark:bg-orange-500/10 text-orange-600 dark:text-orange-500 rounded-full flex items-center justify-center mx-auto">
                        <UploadCloud size={40} />
                    </div>
                    <h3 className="text-2xl font-bold">Login to access your uploads</h3>
                    <p className="text-[var(--text-secondary)] max-w-md mx-auto">Upload documents, manage your 5 free files, and translate them to ASL seamlessly across devices.</p>
                    <div className="flex justify-center gap-4">
                        <Button onClick={() => navigate("/login")}>Log In / Sign Up</Button>
                    </div>
                </Card>
            ) : (
                <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                    {isLoading ? (
                        <p className="col-span-3 text-center text-[var(--text-secondary)] py-8">Loading...</p>
                    ) : uploadList.length === 0 ? (
                        <p className="col-span-3 text-center text-[var(--text-secondary)] py-8">No uploads yet.</p>
                    ) : (
                        uploadList.map((item) => (
                            <Card key={item.id} className="flex flex-col overflow-hidden hover:border-[var(--primary)] transition-colors group">
                                <div className="flex-1 p-5 space-y-3 cursor-pointer">
                                    <div className="flex items-start justify-between">
                                        <div className="p-2.5 bg-zinc-100 dark:bg-zinc-800 rounded-lg text-zinc-600 dark:text-zinc-300 group-hover:bg-orange-500/10 group-hover:text-[var(--primary)] transition-colors">
                                            <FileText size={24} />
                                        </div>
                                        <span className="text-xs font-medium text-[var(--text-secondary)]">{item.date}</span>
                                    </div>
                                    <div className="pt-2">
                                        <h4 className="font-semibold text-lg text-[var(--text-primary)] group-hover:text-[var(--primary)] transition-colors">{item.name}</h4>
                                        <p className="text-sm text-[var(--text-secondary)] line-clamp-2 mt-1">{item.description}</p>
                                    </div>
                                </div>

                                <div className="grid grid-cols-3 border-t border-[var(--border-color)] bg-[var(--bg-background)]/50 divide-x divide-[var(--border-color)]">
                                    <button onClick={() => setViewFileModal({ id: item.id, name: item.name, content: item.description })} className="flex flex-col items-center justify-center py-3 gap-1 hover:bg-[var(--bg-surface)] hover:text-[#3b82f6] text-[var(--text-secondary)] transition-colors" title="View File">
                                        <Eye size={16} />
                                        <span className="text-[10px] uppercase font-bold tracking-wider">View</span>
                                    </button>
                                    <button onClick={() => navigate("/translate")} className="flex flex-col items-center justify-center py-3 gap-1 hover:bg-[var(--bg-surface)] hover:text-[#10b981] text-[var(--text-secondary)] transition-colors" title="Animate File">
                                        <Play size={16} />
                                        <span className="text-[10px] uppercase font-bold tracking-wider">Animate</span>
                                    </button>
                                    <button onClick={(e) => handleDelete(e, item.id)} className="flex flex-col items-center justify-center py-3 gap-1 hover:bg-[var(--bg-surface)] hover:text-red-500 text-[var(--text-secondary)] transition-colors" title="Delete File">
                                        <Trash2 size={16} />
                                        <span className="text-[10px] uppercase font-bold tracking-wider">Delete</span>
                                    </button>
                                </div>
                            </Card>
                        ))
                    )}
                </div>
            )}

            {viewFileModal && (
                <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-in fade-in duration-200">
                    <Card className="w-full max-w-2xl max-h-[80vh] flex flex-col shadow-2xl overflow-hidden animate-in zoom-in-95 duration-300">
                        <div className="flex items-center justify-between p-4 border-b border-[var(--border-color)] bg-[var(--bg-surface)]">
                            <div className="flex items-center gap-2 text-[var(--primary)]">
                                <FileText size={20} />
                                <h3 className="font-bold">{viewFileModal.name}</h3>
                            </div>
                            <button onClick={() => setViewFileModal(null)} className="p-2 text-[var(--text-secondary)] hover:text-red-500 rounded-lg hover:bg-red-500/10 transition-colors">
                                <span>×</span>
                            </button>
                        </div>
                        <div className="p-6 overflow-y-auto bg-[var(--bg-background)] flex-1 text-[var(--text-primary)] font-mono text-sm leading-relaxed whitespace-pre-wrap">
                            {viewFileModal.content}
                        </div>
                        <div className="p-4 border-t border-[var(--border-color)] bg-[var(--bg-surface)] flex justify-end">
                            <Button onClick={() => setViewFileModal(null)} variant="outline">Close Output</Button>
                        </div>
                    </Card>
                </div>
            )}
        </div>
    );
}
