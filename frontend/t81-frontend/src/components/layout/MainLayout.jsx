import { useState, useEffect } from "react";
import { Outlet } from "react-router-dom";
import { Sidebar } from "./Sidebar";
import { Header } from "./Header";
import { Footer } from "./Footer";
import { cn } from "../../utils/cn";

export function MainLayout() {
    const [collapsed, setCollapsed] = useState(true);
    const [isMobile, setIsMobile] = useState(false);
    const [isSidebarOpen, setIsSidebarOpen] = useState(false);

    useEffect(() => {
        const checkMobile = () => {
            setIsMobile(window.innerWidth < 1024);
            if (window.innerWidth < 1024) {
                setCollapsed(true);
            } else {
                setCollapsed(true);
            }
        };

        checkMobile();
        window.addEventListener('resize', checkMobile);
        return () => window.removeEventListener('resize', checkMobile);
    }, []);

    return (
        <div className="min-h-screen bg-[var(--bg-background)] flex text-[var(--text-primary)] font-sans selection:bg-[var(--primary)] selection:text-white overflow-hidden">
            <Sidebar
                collapsed={collapsed}
                setCollapsed={setCollapsed}
                isMobile={isMobile}
                isOpen={isSidebarOpen}
                setIsOpen={setIsSidebarOpen}
            />

            <div className={cn(
                "flex-1 flex flex-col min-w-0 transition-all duration-300 h-screen",
                !isMobile ? (collapsed ? "ml-20" : "ml-64") : "ml-0"
            )}>
                <Header isMobile={isMobile} setIsOpen={setIsSidebarOpen} />

                <main className="flex-1 overflow-y-auto overflow-x-hidden scrollbar-thin scrollbar-thumb-[var(--border-color)] scrollbar-track-transparent flex flex-col">
                    <div className="flex-1 p-4 md:p-6">
                        <Outlet />
                    </div>
                    <Footer />
                </main>
            </div>
        </div>
    );
}
