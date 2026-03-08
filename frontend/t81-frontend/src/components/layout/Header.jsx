import { Menu, LogIn, LogOut, Home } from "lucide-react";
import { Button } from "../common/Button";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import { useToast } from "../../context/ToastContext";

export function Header({ isMobile, setIsOpen }) {
    const { isLoggedIn, logout } = useAuth();
    const { addToast } = useToast();
    const navigate = useNavigate();

    const handleLogout = () => {
        logout();
        addToast({ title: "Logged Out", type: "info" });
        navigate('/');
    }

    return (
        <header className="h-16 flex items-center justify-between px-6 bg-[var(--bg-background)]/80 backdrop-blur-md sticky top-0 z-20 transition-colors duration-300">
            <div className="flex items-center gap-3">
                {isMobile && (
                    <Button variant="ghost" size="icon" onClick={() => setIsOpen(true)}>
                        <Menu size={20} />
                    </Button>
                )}
                <Link to="/" className="flex items-center gap-2 group">
                    <div className="w-8 h-8 rounded-lg bg-[var(--primary)] text-white flex items-center justify-center font-bold text-xl shadow-md group-hover:scale-105 transition-transform">
                        S
                    </div>
                    <span className="font-bold text-xl tracking-tight text-[var(--text-primary)]">
                        SignFusion
                    </span>
                </Link>
            </div>

            <div className="flex items-center gap-4">
                {!isLoggedIn ? (
                    <Button onClick={() => navigate('/login')} className="shadow-lg shadow-orange-500/20 px-6">
                        <LogIn size={18} className="mr-2" /> Login
                    </Button>
                ) : (
                    <div className="flex items-center gap-2">
                        <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => navigate('/translate')}
                        >
                            <Home size={16} className="mr-2" /> App
                        </Button>
                        <Button
                            variant="ghost"
                            size="sm"
                            onClick={handleLogout}
                            className="text-red-500 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20"
                        >
                            <LogOut size={16} className="mr-2" /> Log Out
                        </Button>
                    </div>
                )}
            </div>
        </header>
    );
}
