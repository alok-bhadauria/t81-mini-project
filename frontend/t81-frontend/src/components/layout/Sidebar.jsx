import { useLocation, useNavigate, Link } from "react-router-dom";
import { cn } from "../../utils/cn";
import {
    LayoutDashboard,
    Mic,
    FileText,
    UploadCloud,
    Library,
    LifeBuoy,
    LogOut,
    User,
    Volume2,
    VolumeX,
    Sun,
    Moon,
    UserCog,
    MessageSquare,
    PanelLeftOpen,
    PanelLeftClose,
    Keyboard,
    Clock
} from "lucide-react";
import { useTheme } from "../../context/ThemeContext";
import { useSound } from "../../context/SoundContext";
import { useToast } from "../../context/ToastContext";
import { useAuth } from "../../context/AuthContext";

export function Sidebar({ collapsed, setCollapsed, isMobile, isOpen, setIsOpen }) {
    const location = useLocation();
    const navigate = useNavigate();
    const { theme, toggleTheme } = useTheme();
    const { isSoundEnabled, toggleSound: contextToggleSound } = useSound();
    const { addToast } = useToast();
    const { isLoggedIn, user, logout } = useAuth();

    const toggleSound = () => {
        contextToggleSound();
        addToast({
            title: !isSoundEnabled ? "Sound Enabled" : "Sound Disabled",
            type: "success"
        });
    };

    const handleNavigation = (item) => {
        if (isMobile && !item.isToggle) setIsOpen(false);

        if (item.action) {
            item.action();
        } else if (item.path) {
            navigate(item.path);
        }
    };

    const NavItem = ({ item }) => {
        const isActive = location.pathname.startsWith(item.path) && item.path !== "/"
            || (item.path === "/" && location.pathname === "/");

        const Icon = item.icon;

        const getStatusStyles = () => {
            if (item.label === "Sound") {
                if (item.value === 'On') return "border-green-500/50 text-green-600 bg-green-500/10 dark:text-green-400";
                if (item.value === 'Off') return "border-red-500/50 text-red-600 bg-red-500/10 dark:text-red-400";
            }
            return "opacity-70 border-current";
        };

        return (
            <button
                onClick={() => handleNavigation(item)}
                className={cn(
                    "w-full flex items-center gap-3 px-3 py-2.5 rounded-md transition-all group relative font-medium text-sm",
                    isActive
                        ? "bg-[var(--primary)] text-white shadow-md shadow-orange-500/20"
                        : "text-[var(--text-secondary)] hover:bg-[var(--bg-background)] hover:text-[var(--text-primary)]",
                    collapsed && !isMobile && "justify-center px-0"
                )}
                title={collapsed ? item.label : ""}
            >
                <Icon size={20} className={cn("min-w-[20px] transition-colors", isActive ? "text-white" : "text-current group-hover:text-[var(--primary)]")} />

                {(!collapsed || isMobile) && (
                    <span className="truncate flex-1 text-left animate-in fade-in slide-in-from-left-2 duration-200">{item.label}</span>
                )}

                {(!collapsed || isMobile) && item.isToggle && (
                    <span className={cn(
                        "text-xs px-1.5 rounded-md border animate-in fade-in duration-200",
                        getStatusStyles()
                    )}>
                        {item.value}
                    </span>
                )}

                {isActive && !item.isToggle && (!collapsed || isMobile) && (
                    <div className="ml-auto w-1 h-1 rounded-full bg-white/50" />
                )}
            </button>
        );
    };

    const MAIN_MENU = [
        { label: "SignFusion App", icon: Keyboard, path: "/translate" },
        { label: "History", icon: Clock, path: "/history" },
        { label: "Uploads", icon: UploadCloud, path: "/uploads" },
    ];

    const PREFERENCES = [
        {
            label: "Theme",
            icon: theme === 'dark' ? Moon : Sun,
            action: toggleTheme,
            isToggle: true,
            value: theme === 'dark' ? 'Dark' : 'Light'
        },
        {
            label: "Sound",
            icon: isSoundEnabled ? Volume2 : VolumeX,
            action: toggleSound,
            isToggle: true,
            value: isSoundEnabled ? 'On' : 'Off'
        },
        { label: "Settings", icon: UserCog, path: "/settings" },
    ];

    const SUPPORT = [
        { label: "Feedback & Help", icon: MessageSquare, path: "/support" },
    ];

    const sidebarClass = cn(
        "fixed left-0 top-0 h-full border-r border-[var(--border-color)] bg-[var(--bg-surface)] transition-all duration-300 z-40 flex flex-col shadow-xl overflow-x-hidden",
        isMobile ? (isOpen ? "translate-x-0 w-64" : "-translate-x-full w-64") : (collapsed ? "w-20" : "w-64")
    );

    return (
        <>
            {isMobile && isOpen && (
                <div
                    className="fixed inset-0 bg-black/40 z-30 backdrop-blur-sm transition-opacity"
                    onClick={() => setIsOpen(false)}
                />
            )}

            <aside
                className={sidebarClass}
                onMouseEnter={() => !isMobile && setCollapsed(false)}
                onMouseLeave={() => !isMobile && setCollapsed(true)}
            >
                <div className="h-16 flex items-center px-4 border-b border-[var(--border-color)] relative gap-3 overflow-hidden whitespace-nowrap cursor-pointer" onClick={() => navigate("/")}>
                    {collapsed && !isMobile ? (
                        <div className="w-full flex justify-center">
                            <div className="w-10 h-10 rounded-lg flex items-center justify-center text-[var(--text-secondary)] hover:text-[var(--primary)] hover:bg-[var(--bg-background)] transition-all">
                                <PanelLeftOpen size={24} />
                            </div>
                        </div>
                    ) : (
                        <>
                            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[var(--primary)] to-[var(--accent)] text-white flex items-center justify-center font-bold text-2xl shadow-lg transition-all duration-300 flex-shrink-0 z-10">
                                S
                            </div>
                            <div className="flex-1 transition-all duration-300 animate-in fade-in slide-in-from-left-2">
                                <span className="font-bold text-xl tracking-tight text-[var(--text-primary)]">
                                    SignFusion
                                </span>
                            </div>
                            {!isMobile && (
                                <button className="text-[var(--text-secondary)] hover:text-[var(--primary)] opacity-0 group-hover:opacity-100 transition-opacity">
                                    <PanelLeftClose size={20} />
                                </button>
                            )}
                        </>
                    )}
                </div>

                <div className="flex-1 overflow-y-auto overflow-x-hidden py-6 px-3 flex flex-col gap-8">
                    <div className="space-y-1">
                        <div className="px-3 mb-2 h-4 flex items-center overflow-hidden transition-all duration-300">
                            <p className={cn(
                                "text-xs font-bold text-[var(--text-secondary)] uppercase tracking-wider whitespace-nowrap transition-opacity duration-300",
                                collapsed && !isMobile ? "opacity-0" : "opacity-100"
                            )}>
                                Main Menu
                            </p>
                        </div>
                        {MAIN_MENU.map((item) => <NavItem key={item.label} item={item} />)}
                    </div>

                    <div className="space-y-1">
                        <div className="px-3 mb-2 h-4 flex items-center overflow-hidden transition-all duration-300">
                            <p className={cn(
                                "text-xs font-bold text-[var(--text-secondary)] uppercase tracking-wider whitespace-nowrap transition-opacity duration-300",
                                collapsed && !isMobile ? "opacity-0" : "opacity-100"
                            )}>
                                Preferences
                            </p>
                        </div>
                        {PREFERENCES.map((item) => <NavItem key={item.label} item={item} />)}
                    </div>

                    <div className="space-y-1">
                        <div className="px-3 mb-2 h-4 flex items-center overflow-hidden transition-all duration-300">
                            <p className={cn(
                                "text-xs font-bold text-[var(--text-secondary)] uppercase tracking-wider whitespace-nowrap transition-opacity duration-300",
                                collapsed && !isMobile ? "opacity-0" : "opacity-100"
                            )}>
                                Support
                            </p>
                        </div>
                        {SUPPORT.map((item) => <NavItem key={item.label} item={item} />)}
                    </div>
                </div>

                <div className="p-4 border-t border-[var(--border-color)] bg-[var(--bg-surface)] overflow-hidden">
                    <button
                        onClick={() => {
                            if (isMobile) setIsOpen(false);
                            if (isLoggedIn && user) {
                                navigate(`/${user.id || user._id || 'profile'}`);
                            } else {
                                navigate('/login');
                            }
                        }}
                        className={cn(
                            "flex items-center gap-3 w-full p-2 rounded-lg hover:bg-[var(--bg-background)] transition-all text-left group",
                            collapsed && !isMobile && "justify-center"
                        )}>
                        <div className="relative flex-shrink-0">
                            <div className="w-10 h-10 rounded-full bg-zinc-200 dark:bg-zinc-700 flex items-center justify-center text-[var(--text-secondary)] group-hover:text-[var(--primary)] ring-2 ring-transparent group-hover:ring-[var(--primary)] transition-all uppercase font-bold text-white bg-[var(--primary)]">
                                {isLoggedIn && user ? (user.full_name ? user.full_name.charAt(0) : user.email?.charAt(0) || <User size={20} />) : <User size={20} />}
                            </div>
                            <div className={cn("absolute bottom-0 right-0 w-3 h-3 rounded-full border-2 border-[var(--bg-surface)]", isLoggedIn ? "bg-green-500" : "bg-neutral-500")}></div>
                        </div>

                        {(!collapsed || isMobile) && (
                            <div className="flex-1 min-w-0 animate-in fade-in slide-in-from-left-2 duration-200">
                                <p className="text-sm font-semibold text-[var(--text-primary)] truncate">{isLoggedIn && user ? (user.full_name || user.email) : "Guest User"}</p>
                                <p className="text-xs text-[var(--text-secondary)] truncate">{isLoggedIn ? "View Profile" : "Login to save"}</p>
                            </div>
                        )}

                        {(!collapsed || isMobile) && isLoggedIn && (
                            <LogOut size={16} className="text-[var(--text-secondary)] group-hover:text-red-500 animate-in fade-in duration-200" onClick={(e) => { e.stopPropagation(); logout(); navigate("/"); }} />
                        )}
                    </button>
                </div>
            </aside>
        </>
    );
}
