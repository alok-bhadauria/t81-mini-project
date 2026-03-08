import { useState, useEffect } from "react";
import { X, Eye, EyeOff, Home, ChevronRight, ChevronLeft } from "lucide-react";
import { useAuth } from "../context/AuthContext";
import { useToast } from "../context/ToastContext";
import { useNavigate, useLocation } from "react-router-dom";
import { useDocumentTitle } from "../hooks/useDocumentTitle";
import { useGoogleLogin } from '@react-oauth/google';
import "./Login.css";

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

const calculateStrength = (pass) => {
    let score = 0;
    if (!pass) return 0;
    if (pass.length >= 8) score += 1;
    if (/[A-Z]/.test(pass)) score += 1;
    if (/[a-z]/.test(pass)) score += 1;
    if (/[0-9]/.test(pass)) score += 1;
    if (/[^A-Za-z0-9]/.test(pass)) score += 1;
    return score;
};

const PasswordStrengthBar = ({ password }) => {
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

const RegisterForm = ({ activeView, onSubmit, onGoogle, isSubmitting }) => {
    const [formData, setFormData] = useState({
        fullName: "",
        email: "",
        password: "",
        confirmPassword: ""
    });
    const [showPassword, setShowPassword] = useState(false);
    const [showConfirmPassword, setShowConfirmPassword] = useState(false);
    const { addToast } = useToast();

    const handleSubmit = (e) => {
        e.preventDefault();

        const strength = calculateStrength(formData.password);
        if (strength < 5) {
            addToast({ title: "Weak Password", description: "Password must contain at least 8 characters, an uppercase letter, lowercase letter, number, and special character.", type: "error" });
            return;
        }

        if (formData.password !== formData.confirmPassword) {
            addToast({ title: "Error", description: "Passwords do not match!", type: "error" });
            return;
        }
        onSubmit(formData.fullName, formData.email, formData.password, 'register');
    };

    const handleChange = (e) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    }

    return (
        <div className={`form register ${activeView === "register" ? "active" : ""}`}>
            <h2>Sign Up</h2>
            <button type="button" className="google-btn" onClick={onGoogle}>
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

                <button
                    className="submit-btn"
                    type="submit"
                    disabled={isSubmitting}
                >
                    {isSubmitting ? "SIGNING UP..." : "SIGN UP"}
                </button>
            </form>
        </div>
    );
};

const LoginForm = ({ activeView, onSubmit, onGoogle, isSubmitting }) => {
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [showPassword, setShowPassword] = useState(false);

    const handleSubmit = (e) => {
        e.preventDefault();
        onSubmit(null, email, password, 'login');
    };

    return (
        <div className={`form login ${activeView === "login" ? "active" : ""}`}>
            <h2>Login</h2>
            <button type="button" className="google-btn" onClick={onGoogle}>
                <img src="https://www.gstatic.com/firebasejs/ui/2.0.0/images/auth/google.svg" alt="Google" width="18" height="18" />
                Continue with Google
            </button>
            <p>Or use your email address</p>

            <form onSubmit={handleSubmit}>
                <input
                    type="text"
                    placeholder="Email Address or Username"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                />
                <div className="input-group">
                    <input
                        type={showPassword ? "text" : "password"}
                        placeholder="Password"
                        required
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                    />
                    <button
                        type="button"
                        className="eye-btn"
                        onClick={() => setShowPassword(!showPassword)}
                    >
                        {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                    </button>
                </div>
                <a href="#">Forgot password?</a>
                <button
                    className="submit-btn"
                    type="submit"
                    disabled={isSubmitting}
                >
                    {isSubmitting ? "LOGGING IN..." : "LOGIN"}
                </button>
            </form>
        </div>
    );
};

export function Login() {
    useDocumentTitle("Login");
    const [activeView, setActiveView] = useState("login");
    const [isSubmitting, setIsSubmitting] = useState(false);
    const { login, register, googleLogin } = useAuth();
    const { addToast } = useToast();
    const navigate = useNavigate();
    const location = useLocation();

    useEffect(() => {

        if (location.state?.view === 'register') {
            setActiveView('register');
        }
    }, [location]);

    const toggleView = () => {
        if (isSubmitting) return;
        setActiveView(activeView === "login" ? "register" : "login");
    };

    const handleAuthSubmit = async (name, email, password, mode) => {
        setIsSubmitting(true);
        try {
            if (mode === 'login') {
                await login(email, password);
                addToast({ title: "Welcome back!", type: "success" });
                navigate("/translate");
            } else {
                const res = await register(name, email, password);
                addToast({ title: "Account created successfully.", type: "success" });
                if (res?.isNew) {
                    navigate("/profile?editing=true");
                } else {
                    navigate("/translate");
                }
            }
        } catch (error) {

            let errDesc = error.message;
            if (errDesc && errDesc.includes("429")) {
                errDesc = "Too many attempts. Please wait a minute and try again.";
            }

            addToast({
                title: mode === 'login' ? "Login Failed" : "Signup Failed",
                description: errDesc,
                type: "error"
            });
        } finally {
            setIsSubmitting(false);
        }
    };

    const triggerGoogleLogin = useGoogleLogin({
        onSuccess: async (tokenResponse) => {
            setIsSubmitting(true);
            try {
                const res = await googleLogin(tokenResponse.access_token);
                addToast({ title: "Google Auth Success", type: "success" });
                if (res?.isNew) {
                    navigate("/profile?editing=true");
                } else {
                    navigate("/translate");
                }
            } catch (error) {
                let errDesc = error.message;
                if (errDesc && errDesc.includes("429")) {
                    errDesc = "Too many attempts. Please wait a minute and try again.";
                }
                addToast({
                    title: "Google Auth Failed",
                    description: errDesc,
                    type: "error"
                });
            } finally {
                setIsSubmitting(false);
            }
        },
        onError: () => {
            addToast({ title: "Google Auth Failed", description: "Connection popup closed or failed.", type: "error" });
        }
    });

    const handleGoogleAuth = () => {
        if (isSubmitting) return;
        triggerGoogleLogin();
    };

    return (
        <div className="min-h-screen flex items-center justify-center p-4 bg-[var(--bg-background)] relative overflow-hidden animate-in fade-in duration-500">
            {}
            <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] rounded-full bg-[var(--primary)] opacity-20 blur-[100px]"></div>
            <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] rounded-full bg-[var(--accent)] opacity-20 blur-[100px]"></div>

            <div className="auth-card relative z-10 shadow-2xl border-[var(--border-color)]">
                {}
                <button
                    className="absolute top-4 right-4 z-[9999] p-2 rounded-full text-[var(--text-secondary)] hover:text-[var(--primary)] hover:bg-[var(--bg-background)] transition-colors flex items-center justify-center bg-[var(--bg-surface)] border border-transparent hover:border-[var(--border-color)] shadow-sm"
                    onClick={() => navigate("/")}
                    title="Return to Home"
                >
                    <Home size={20} />
                </button>

                <CardBackground activeView={activeView} />

                <HeroPanel
                    type="register"
                    activeView={activeView}
                    title="Welcome back"
                    text="Access your library and saved translations."
                    buttonText={
                        <span className="flex items-center justify-center gap-2">
                            <ChevronLeft size={18} /> LOGIN
                        </span>
                    }
                    onToggle={toggleView}
                />

                <RegisterForm
                    activeView={activeView}
                    onSubmit={handleAuthSubmit}
                    onGoogle={handleGoogleAuth}
                    isSubmitting={isSubmitting}
                />

                <HeroPanel
                    type="login"
                    activeView={activeView}
                    title="Hello there"
                    text="Join SignFusion to start translating seamlessly."
                    buttonText={
                        <span className="flex items-center justify-center gap-2">
                            SIGN UP <ChevronRight size={18} />
                        </span>
                    }
                    onToggle={toggleView}
                />

                <LoginForm
                    activeView={activeView}
                    onSubmit={handleAuthSubmit}
                    onGoogle={handleGoogleAuth}
                    isSubmitting={isSubmitting}
                />

                {}
                <div className="md:hidden w-full text-center mt-4 pb-6 absolute bottom-0 z-50">
                    {activeView === 'login' ? (
                        <p className="text-sm text-[var(--text-secondary)]">Don't have an account? <button className="mobile-toggle text-[var(--primary)] font-bold" onClick={toggleView}>Sign Up</button></p>
                    ) : (
                        <p className="text-sm text-[var(--text-secondary)]">Already have an account? <button className="mobile-toggle text-[var(--primary)] font-bold" onClick={toggleView}>Login</button></p>
                    )}
                </div>
            </div>
        </div>
    );
}
