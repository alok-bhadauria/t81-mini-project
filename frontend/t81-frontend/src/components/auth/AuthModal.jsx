import { useState, useEffect } from "react";
import { X, Eye, EyeOff } from "lucide-react";
import { useAuth } from "../../context/AuthContext";
import "./AuthModal.css";

const CardBackground = ({ activeView }) => {
    return <div className={`card-bg ${activeView === "login" ? "login" : ""}`} />;
};

const HeroPanel = ({ type, activeView, title, text, buttonText, onToggle }) => {
    return (
        <div className={`hero ${type} ${activeView === type ? "active" : ""}`}>
            <h2>{title}</h2>
            <p>{text}</p>
            <button type="button" onClick={onToggle}>
                {buttonText}
            </button>
        </div>
    );
};

const PasswordStrengthBar = ({ password }) => {
    const calculateStrength = (pass) => {
        let score = 0;
        if (!pass) return 0;
        if (pass.length > 6) score += 1;
        if (pass.length > 10) score += 1;
        if (/[A-Z]/.test(pass)) score += 1;
        if (/[0-9]/.test(pass)) score += 1;
        if (/[^A-Za-z0-9]/.test(pass)) score += 1;
        return score;
    };

    const strength = calculateStrength(password);

    const getColor = (s) => {
        if (s === 0) return "bg-gray-200";
        if (s <= 2) return "bg-red-500";
        if (s <= 3) return "bg-yellow-500";
        return "bg-green-500";
    };

    const getWidth = (s) => {
        if (s === 0) return "0%";
        return `${(s / 5) * 100}%`;
    };

    const getLabel = (s) => {
        if (s === 0) return "";
        if (s <= 2) return "Weak";
        if (s <= 3) return "Fair";
        if (s <= 4) return "Strong";
        return "Very Strong";
    };

    return (
        <div className="w-full mt-3">
            <div className="flex justify-between items-center mb-1">
                <p className="text-xs text-[var(--text-secondary)] font-medium">Password Strength:</p>
                <p className={`text-xs font-bold ${strength <= 2 ? 'text-red-500' : strength <= 3 ? 'text-yellow-500' : 'text-green-500'}`}>
                    {getLabel(strength)}
                </p>
            </div>
            <div className="w-full h-1 bg-gray-200 rounded-full overflow-hidden">
                <div
                    className={`h-full transition-all duration-300 ${getColor(strength)}`}
                    style={{ width: getWidth(strength) }}
                />
            </div>
        </div>
    );
};

const RegisterForm = ({ activeView, onLogin }) => {
    const [formData, setFormData] = useState({
        fullName: "",
        email: "",
        password: "",
        confirmPassword: ""
    });
    const [showPassword, setShowPassword] = useState(false);
    const [showConfirmPassword, setShowConfirmPassword] = useState(false);

    const handleSubmit = (e) => {
        e.preventDefault();
        if (formData.password !== formData.confirmPassword) {
            alert("Passwords do not match!");
            return;
        }

        onLogin();
    };

    const handleChange = (e) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    }

    return (
        <div
            className={`form register ${activeView === "register" ? "active" : ""}`}
        >
            <h2>Sign Up</h2>
            <button type="button" className="google-btn" onClick={onLogin}>
                <img src="https://www.gstatic.com/firebasejs/ui/2.0.0/images/auth/google.svg" alt="Google" width="18" height="18" />
                Continue with Google
            </button>
            <p>Or use your email address</p>

            <form onSubmit={handleSubmit}>
                <input
                    type="text"
                    name="fullName"
                    placeholder="Full name"
                    required
                    value={formData.fullName}
                    onChange={handleChange}
                />
                <input
                    type="email"
                    name="email"
                    placeholder="Email address"
                    required
                    value={formData.email}
                    onChange={handleChange}
                />

                {}
                <div className="input-group">
                    <input
                        type={showPassword ? "text" : "password"}
                        name="password"
                        placeholder="Password"
                        required
                        value={formData.password}
                        onChange={handleChange}
                    />
                    <button
                        type="button"
                        className="eye-btn"
                        onClick={() => setShowPassword(!showPassword)}
                    >
                        {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                    </button>
                </div>

                {}
                <div className="input-group">
                    <input
                        type={showConfirmPassword ? "text" : "password"}
                        name="confirmPassword"
                        placeholder="Confirm Password"
                        required
                        value={formData.confirmPassword}
                        onChange={handleChange}
                    />
                    <button
                        type="button"
                        className="eye-btn"
                        onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    >
                        {showConfirmPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                    </button>
                </div>

                <PasswordStrengthBar password={formData.password} />

                <button className="submit-btn" type="submit">SIGN UP</button>
            </form>
        </div>
    );
};

const LoginForm = ({ activeView, onLogin }) => {
    const handleSubmit = (e) => {
        e.preventDefault();
        onLogin();
    };

    return (
        <div className={`form login ${activeView === "login" ? "active" : ""}`}>
            <h2>Login</h2>
            <button type="button" className="google-btn" onClick={onLogin}>
                <img src="https://www.gstatic.com/firebasejs/ui/2.0.0/images/auth/google.svg" alt="Google" width="18" height="18" />
                Continue with Google
            </button>
            <p>Or use your email address</p>

            <form onSubmit={handleSubmit}>
                <input type="email" placeholder="Email" required defaultValue="user@example.com" />
                <input type="password" placeholder="Password" required defaultValue="password" />
                <a href="#">Forgot password?</a>
                <button className="submit-btn" type="submit">LOGIN</button>
            </form>
        </div>
    );
};

export const AuthModal = ({ isOpen, onClose }) => {
    const [activeView, setActiveView] = useState("login");
    const { login } = useAuth();

    useEffect(() => {
        if (isOpen) {

            document.body.style.overflow = 'hidden';
        } else {
            document.body.style.overflow = 'unset';
        }
        return () => { document.body.style.overflow = 'unset'; };
    }, [isOpen]);

    if (!isOpen) return null;

    const toggleView = () => {
        setActiveView(activeView === "login" ? "register" : "login");
    };

    const handleLogin = () => {
        login();
        onClose();
    };

    return (
        <div className="auth-modal-overlay" onClick={onClose}>
            <div className="auth-card" onClick={(e) => e.stopPropagation()}>
                <button className="auth-close-btn" onClick={onClose}>
                    <X size={20} />
                </button>

                <CardBackground activeView={activeView} />

                <HeroPanel
                    type="register"
                    activeView={activeView}
                    title="Welcome back"
                    text="Access your uploads and saved translations."
                    buttonText="LOGIN"
                    onToggle={toggleView}
                />

                <RegisterForm activeView={activeView} onLogin={handleLogin} />

                <HeroPanel
                    type="login"
                    activeView={activeView}
                    title="Hello there"
                    text="Join SignFusion to start translating seamlessly."
                    buttonText="SIGN UP"
                    onToggle={toggleView}
                />

                <LoginForm activeView={activeView} onLogin={handleLogin} />

                {}
                <div className="md:hidden w-full text-center mt-4">
                    {activeView === 'login' ? (
                        <p className="text-sm text-[var(--text-secondary)]">Don't have an account? <button className="mobile-toggle text-[var(--primary)]" onClick={toggleView}>Sign Up</button></p>
                    ) : (
                        <p className="text-sm text-[var(--text-secondary)]">Already have an account? <button className="mobile-toggle text-[var(--primary)]" onClick={toggleView}>Login</button></p>
                    )}
                </div>
            </div>
        </div>
    );
};
