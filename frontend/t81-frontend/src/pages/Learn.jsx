import { useState, useEffect, useRef } from "react";
import { Card } from "../components/common/Card";
import { Button } from "../components/common/Button";
import { ChevronRight, ChevronLeft, ArrowLeft, CheckCircle2, Circle, BookOpen, Loader2, Image as ImageIcon, RotateCcw, AlertTriangle, Trash2, X } from "lucide-react";
import { useAuth } from "../context/AuthContext";
import { useToast } from "../context/ToastContext";
import { api } from "../services/api";
import { useDocumentTitle } from "../hooks/useDocumentTitle";

export function Learn() {
    useDocumentTitle("Learn Sign Language");
    const { user, updateUserState, isLoggedIn } = useAuth();
    const { addToast } = useToast();

    const [courses, setCourses] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [selectedLanguage, setSelectedLanguage] = useState(null);
    const [selectedModule, setSelectedModule] = useState(null);
    const [selectedItem, setSelectedItem] = useState(null);
    const [isResetModalOpen, setIsResetModalOpen] = useState(false);

    const courseProgress = user?.course_progress || {};
    const itemRefs = useRef({});

    useEffect(() => {
        api.get("/courses")
            .then(data => {
                setCourses(data.courses || []);
                setIsLoading(false);
            })
            .catch(err => {
                console.error("Failed to load courses:", err);
                setIsLoading(false);
            });
    }, []);

    useEffect(() => {
        if (selectedItem && itemRefs.current[selectedItem.name]) {
            itemRefs.current[selectedItem.name].scrollIntoView({ behavior: "smooth", block: "center" });
        }
    }, [selectedItem]);

    const getModuleProgress = (language, moduleName, totalItems) => {
        const completed = courseProgress[language]?.[moduleName]?.length || 0;
        return { completed, total: totalItems, percentage: totalItems === 0 ? 0 : Math.round((completed / totalItems) * 100) };
    };

    const getLanguageProgress = (languageObj) => {
        let totalItems = 0;
        let completedItems = 0;
        languageObj.modules.forEach(mod => {
            totalItems += mod.items.length;
            completedItems += courseProgress[languageObj.language]?.[mod.name]?.length || 0;
        });
        return { completed: completedItems, total: totalItems, percentage: totalItems === 0 ? 0 : Math.round((completedItems / totalItems) * 100) };
    };

    const isItemCompleted = (language, moduleName, itemName) => {
        return courseProgress[language]?.[moduleName]?.includes(itemName) || false;
    };

    const markAsComplete = async (itemToMark) => {
        if (!isLoggedIn || !selectedLanguage || !selectedModule || !itemToMark) return;
        if (isItemCompleted(selectedLanguage, selectedModule.name, itemToMark.name)) return;

        const updatedProgress = JSON.parse(JSON.stringify(courseProgress));
        if (!updatedProgress[selectedLanguage]) updatedProgress[selectedLanguage] = {};
        if (!updatedProgress[selectedLanguage][selectedModule.name]) updatedProgress[selectedLanguage][selectedModule.name] = [];
        updatedProgress[selectedLanguage][selectedModule.name].push(itemToMark.name);

        try {
            await api.put("/auth/me", { course_progress: updatedProgress });
            updateUserState({ course_progress: updatedProgress });
        } catch (error) {
            console.error("Failed to save progress.", error);
        }
    };

    useEffect(() => {
        if (selectedItem) {
            markAsComplete(selectedItem);
        }
    }, [selectedItem]);

    const handleNextItem = () => {
        if (!selectedModule) return;
        const idx = selectedModule.items.findIndex(i => i.name === selectedItem?.name);
        if (idx >= 0 && idx < selectedModule.items.length - 1) {
            setSelectedItem(selectedModule.items[idx + 1]);
        }
    };

    const handlePrevItem = () => {
        if (!selectedModule) return;
        const idx = selectedModule.items.findIndex(i => i.name === selectedItem?.name);
        if (idx > 0) {
            setSelectedItem(selectedModule.items[idx - 1]);
        }
    };

    const executeReset = async (scope) => {
        const updatedProgress = JSON.parse(JSON.stringify(courseProgress));

        if (scope === "image" && selectedLanguage && selectedModule && selectedItem) {
            if (updatedProgress[selectedLanguage]?.[selectedModule.name]) {
                updatedProgress[selectedLanguage][selectedModule.name] = updatedProgress[selectedLanguage][selectedModule.name].filter(i => i !== selectedItem.name);
            }
        } else if (scope === "module" && selectedLanguage && selectedModule) {
            if (updatedProgress[selectedLanguage]) {
                updatedProgress[selectedLanguage][selectedModule.name] = [];
            }
        } else if (scope === "language" && selectedLanguage) {
            updatedProgress[selectedLanguage] = {};
        }

        try {
            await api.put("/auth/me", { course_progress: updatedProgress });
            updateUserState({ course_progress: updatedProgress });
            addToast({ title: "Progress Reset", description: "Successfully cleared progress.", type: "success" });
            setIsResetModalOpen(false);
        } catch (error) {
            addToast({ title: "Failed to reset progress", type: "error" });
        }
    };

    const activeLangObj = courses.find(c => c.language === selectedLanguage);
    const currentItemIndex = selectedModule && selectedItem ? selectedModule.items.findIndex(i => i.name === selectedItem.name) : -1;
    const hasPrevious = currentItemIndex > 0;
    const hasNext = selectedModule && currentItemIndex >= 0 && currentItemIndex < selectedModule.items.length - 1;

    return (
        <div className="max-w-7xl mx-auto h-[calc(100vh-8rem)] flex flex-col md:flex-row gap-6 animate-in fade-in slide-in-from-bottom-4 duration-500">

            <Card className="flex-1 shrink-0 flex flex-col shadow-xl overflow-hidden border-[var(--border-color)]">
                <div className="p-4 border-b border-[var(--border-color)] bg-[var(--bg-surface)] flex items-center gap-3">
                    <div className="p-2 rounded-lg bg-[var(--primary)]/10 text-[var(--primary)]">
                        <BookOpen size={20} />
                    </div>
                    <h2 className="font-bold text-lg text-[var(--text-primary)]">Course Selection</h2>
                </div>

                <div className="flex-1 overflow-y-auto p-4 space-y-3">
                    {isLoading ? (
                        <div className="h-full flex flex-col items-center justify-center text-[var(--text-secondary)] space-y-4">
                            <Loader2 size={32} className="animate-spin text-[var(--primary)]" />
                            <p>Loading course modules...</p>
                        </div>
                    ) : !selectedLanguage ? (
                        <>
                            <p className="text-sm text-[var(--text-secondary)] mb-4 font-medium">Select a Sign Language to start learning</p>
                            {courses.length === 0 ? (
                                <p className="text-sm text-[var(--text-secondary)] text-center py-8">No courses available.</p>
                            ) : (
                                courses.map((course) => {
                                    const progress = getLanguageProgress(course);
                                    return (
                                        <div
                                            key={course.language}
                                            onClick={() => setSelectedLanguage(course.language)}
                                            className="p-4 rounded-xl border-2 border-[var(--border-color)] hover:border-[var(--primary)]/50 bg-[var(--bg-background)] cursor-pointer transition-all hover:-translate-y-1 group flex items-center justify-between"
                                        >
                                            <div className="flex-1">
                                                <h3 className="font-bold text-lg text-[var(--text-primary)] mb-2">{course.language}</h3>
                                                <div className="flex items-center gap-3">
                                                    <div className="flex-1 h-2 rounded-full bg-[var(--border-color)] overflow-hidden">
                                                        <div className="h-full bg-[var(--primary)] transition-all duration-500" style={{ width: `${progress.percentage}%` }} />
                                                    </div>
                                                    <span className="text-xs font-bold text-[var(--text-secondary)] min-w-[3rem] text-right">{progress.percentage}%</span>
                                                </div>
                                            </div>
                                            <ChevronRight className="ml-4 text-[var(--text-secondary)] group-hover:text-[var(--primary)] transition-colors" />
                                        </div>
                                    );
                                })
                            )}
                        </>
                    ) : !selectedModule ? (
                        <>
                            <div className="flex items-center mb-4">
                                <Button variant="ghost" className="p-2 -ml-2 text-[var(--text-secondary)] hover:text-[var(--primary)]" onClick={() => setSelectedLanguage(null)}>
                                    <ArrowLeft size={20} />
                                </Button>
                                <h3 className="font-bold text-[var(--text-primary)] ml-2">{selectedLanguage} Modules</h3>
                            </div>
                            {activeLangObj?.modules.map((mod) => {
                                const progress = getModuleProgress(selectedLanguage, mod.name, mod.items.length);
                                return (
                                    <div
                                        key={mod.name}
                                        onClick={() => setSelectedModule(mod)}
                                        className="p-4 rounded-xl border border-[var(--border-color)] hover:border-[var(--primary)]/50 bg-[var(--bg-background)] cursor-pointer transition-all hover:-translate-x-1 group flex items-center justify-between"
                                    >
                                        <div className="flex-1">
                                            <h4 className="font-semibold text-md text-[var(--text-primary)] capitalize mb-2">{mod.name.replace(/_/g, " ")}</h4>
                                            <div className="flex items-center gap-3">
                                                <div className="flex-1 h-1.5 rounded-full bg-[var(--border-color)] overflow-hidden">
                                                    <div className="h-full bg-[var(--primary)] transition-all duration-500" style={{ width: `${progress.percentage}%` }} />
                                                </div>
                                                <span className="text-xs text-[var(--text-secondary)]">{progress.completed} / {progress.total}</span>
                                            </div>
                                        </div>
                                        <ChevronRight className="ml-4 text-[var(--text-secondary)] group-hover:text-[var(--primary)] transition-colors" />
                                    </div>
                                );
                            })}
                        </>
                    ) : (
                        <>
                            <div className="flex items-center mb-4">
                                <Button variant="ghost" className="p-2 -ml-2 text-[var(--text-secondary)] hover:text-[var(--primary)]" onClick={() => { setSelectedModule(null); setSelectedItem(null); }}>
                                    <ArrowLeft size={20} />
                                </Button>
                                <h3 className="font-bold text-[var(--text-primary)] ml-2 capitalize truncate">{selectedModule.name.replace(/_/g, " ")}</h3>
                            </div>
                            <div className="grid grid-cols-2 gap-2">
                                {selectedModule.items.map((item) => {
                                    const completed = isItemCompleted(selectedLanguage, selectedModule.name, item.name);
                                    const isActive = selectedItem?.name === item.name;
                                    return (
                                        <div
                                            key={item.name}
                                            ref={(el) => (itemRefs.current[item.name] = el)}
                                            onClick={() => setSelectedItem(item)}
                                            className={`p-3 rounded-lg border-2 cursor-pointer transition-all flex items-center justify-between ${
                                                isActive
                                                    ? "border-[var(--primary)] bg-[var(--primary)]/10 shadow-sm shadow-[var(--primary)]/20"
                                                    : "border-[var(--border-color)] bg-[var(--bg-background)] hover:border-[var(--primary)]/50"
                                            }`}
                                        >
                                            <span className={`font-semibold truncate ${isActive ? "text-[var(--primary)]" : "text-[var(--text-primary)]"}`}>
                                                {item.name.replace(/_/g, " ")}
                                            </span>
                                            {completed ? (
                                                <CheckCircle2 size={16} className="text-green-500 shrink-0" />
                                            ) : (
                                                <Circle size={16} className="text-[var(--text-secondary)] opacity-30 shrink-0" />
                                            )}
                                        </div>
                                    );
                                })}
                            </div>
                        </>
                    )}
                </div>
            </Card>

            <Card className="flex-1 shrink-0 flex flex-col shadow-xl overflow-hidden border-[var(--border-color)]">
                <div className="p-4 border-b border-[var(--border-color)] bg-[var(--bg-surface)] flex items-center justify-between h-16">
                    <h2 className="font-bold text-lg text-[var(--text-primary)] capitalize">
                        {selectedItem ? `${selectedLanguage} — ${selectedItem.name.replace(/_/g, " ")}` : "Select a topic"}
                    </h2>
                    {selectedItem && (
                        <span className="text-xs font-bold px-2 py-1 rounded bg-[var(--primary)]/10 text-[var(--primary)] uppercase tracking-wider">
                            {currentItemIndex + 1} / {selectedModule?.items.length}
                        </span>
                    )}
                </div>

                <div className="flex-1 bg-[var(--bg-background)] flex flex-col overflow-hidden">
                    {!selectedItem ? (
                        <div className="flex-1 flex flex-col items-center justify-center text-[var(--text-secondary)] opacity-50 p-8 text-center">
                            <ImageIcon size={64} className="mb-4" />
                            <p className="text-lg font-medium">Select a module and topic from the left panel to begin.</p>
                        </div>
                    ) : (
                        <div className="flex-1 flex flex-col items-center justify-center p-6 gap-5 overflow-y-auto">
                            <div className="w-full max-w-xs aspect-square rounded-2xl border-4 border-[var(--border-color)] bg-[var(--bg-surface)] shadow-2xl overflow-hidden flex items-center justify-center">
                                <img
                                    src={selectedItem.file}
                                    alt={selectedItem.name}
                                    className="w-full h-full object-contain p-4 hover:scale-105 transition-transform duration-500"
                                />
                            </div>

                            <div className="w-full max-w-xs flex gap-3">
                                <Button
                                    className="flex-1 py-3 font-bold"
                                    variant="outline"
                                    onClick={handlePrevItem}
                                    disabled={!hasPrevious}
                                >
                                    <ChevronLeft className="mr-1" size={18} />
                                    Previous
                                </Button>
                                <Button
                                    className="flex-1 py-3 font-bold"
                                    variant="outline"
                                    onClick={handleNextItem}
                                    disabled={!hasNext}
                                >
                                    Next
                                    <ChevronRight className="ml-1" size={18} />
                                </Button>
                            </div>

                            <div className="w-full max-w-xs border-t border-[var(--border-color)] pt-4">
                                <Button
                                    variant="ghost"
                                    className="w-full text-red-500 hover:text-red-600 hover:bg-red-500/10"
                                    onClick={() => setIsResetModalOpen(true)}
                                >
                                    <RotateCcw size={16} className="mr-2" />
                                    Reset Progress
                                </Button>
                            </div>
                        </div>
                    )}
                </div>
            </Card>

            {isResetModalOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
                    <Card className="w-full max-w-md p-6 shadow-2xl bg-[var(--bg-surface)] border border-red-500/20">
                        <div className="flex justify-between items-start mb-6">
                            <div className="flex items-center gap-3 text-red-500">
                                <div className="p-2 bg-red-500/10 rounded-full">
                                    <AlertTriangle size={28} />
                                </div>
                                <h2 className="text-xl font-bold">Reset Progress</h2>
                            </div>
                            <button onClick={() => setIsResetModalOpen(false)} className="text-[var(--text-secondary)] hover:text-[var(--text-primary)]">
                                <X size={24} />
                            </button>
                        </div>

                        <p className="text-[var(--text-secondary)] mb-6">
                            This action cannot be undone. Select the scope of the reset:
                        </p>

                        <div className="space-y-3">
                            <Button
                                className="w-full justify-start py-4 border-red-500/30 hover:border-red-500 hover:bg-red-500/5 text-red-500"
                                variant="outline"
                                onClick={() => executeReset("image")}
                            >
                                <Trash2 size={18} className="mr-3" />
                                Reset this image only — {selectedItem?.name}
                            </Button>
                            <Button
                                className="w-full justify-start py-4 border-red-500/30 hover:border-red-500 hover:bg-red-500/5 text-red-500"
                                variant="outline"
                                onClick={() => executeReset("module")}
                            >
                                <Trash2 size={18} className="mr-3" />
                                Reset entire module — {selectedModule?.name.replace(/_/g, " ")}
                            </Button>
                            <Button
                                className="w-full justify-start py-4 bg-red-500 hover:bg-red-600 text-white border-transparent"
                                variant="primary"
                                onClick={() => executeReset("language")}
                            >
                                <AlertTriangle size={18} className="mr-3" />
                                Reset entire language — {selectedLanguage}
                            </Button>
                        </div>
                    </Card>
                </div>
            )}
        </div>
    );
}
