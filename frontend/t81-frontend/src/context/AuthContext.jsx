import { createContext, useContext, useState, useEffect } from "react";

const AuthContext = createContext({
    isLoggedIn: false,
    user: null,
    jwt: null,
    login: async (email, password) => { },
    register: async (name, email, password) => { },
    googleLogin: async (accessToken) => { },
    logout: () => { },
});

export const useAuth = () => useContext(AuthContext);

export const AuthProvider = ({ children }) => {
    const [isLoggedIn, setIsLoggedIn] = useState(false);
    const [jwt, setJwt] = useState(null);
    const [user, setUser] = useState(null);
    const API_URL = `${import.meta.env.VITE_API_URL}`;

    const fetchUserProfile = async (token) => {
        try {
            const response = await fetch(`${API_URL}/auth/me`, {
                headers: {
                    "Authorization": `Bearer ${token}`
                }
            });
            if (response.ok) {
                const userData = await response.json();
                setUser(userData);
            } else {

                logout();
            }
        } catch (e) {
            console.error("Failed to fetch user profile:", e);
        }
    };

    useEffect(() => {
        const storedToken = localStorage.getItem("sf_jwt");
        if (storedToken) {
            setJwt(storedToken);
            setIsLoggedIn(true);
            setUser({ email: "Loading Profile...", full_name: "Loading..." });
            fetchUserProfile(storedToken);
        }
    }, []);

    const login = async (email, password) => {
        const formData = new URLSearchParams();
        formData.append("username", email);
        formData.append("password", password);

        const response = await fetch(`${API_URL}/auth/login`, {
            method: "POST",
            headers: {
                "Content-Type": "application/x-www-form-urlencoded",
            },
            body: formData.toString()
        });

        if (!response.ok) {
            try {
                const err = await response.json();
                let errorMessage = "Login failed";
                if (Array.isArray(err.detail)) errorMessage = err.detail[0].msg;
                else if (typeof err.detail === 'string') errorMessage = err.detail;
                throw new Error(errorMessage);
            } catch (e) {
                throw new Error(e.message || "Failed to parse error from server");
            }
        }

        const data = await response.json();
        const token = data.access_token;

        localStorage.setItem("sf_jwt", token);
        setJwt(token);
        setIsLoggedIn(true);
        fetchUserProfile(token);
        return true;
    };

    const register = async (name, email, password) => {
        const response = await fetch(`${API_URL}/auth/register`, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
            },
            body: JSON.stringify({
                full_name: name,
                email: email,
                password: password
            })
        });

        if (!response.ok) {
            try {
                const err = await response.json();
                let errorMessage = "Registration failed";
                if (Array.isArray(err.detail)) errorMessage = err.detail[0].msg;
                else if (typeof err.detail === 'string') errorMessage = err.detail;
                throw new Error(errorMessage);
            } catch (e) {
                throw new Error(e.message || "Failed to parse error from server");
            }
        }

        await login(email, password);
        return { isNew: true };
    };

    const googleLogin = async (accessToken) => {
        const response = await fetch(`${API_URL}/auth/google`, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
            },
            body: JSON.stringify({ access_token: accessToken })
        });

        if (!response.ok) {
            try {
                const err = await response.json();
                let errorMessage = "Google Login failed";
                if (Array.isArray(err.detail)) errorMessage = err.detail[0].msg;
                else if (typeof err.detail === 'string') errorMessage = err.detail;
                throw new Error(errorMessage);
            } catch (e) {
                throw new Error(e.message || "Failed to parse error from server");
            }
        }

        const data = await response.json();
        const token = data.access_token;

        localStorage.setItem("sf_jwt", token);
        setJwt(token);
        setIsLoggedIn(true);
        fetchUserProfile(token);
        return { isNew: data.is_new_user === true };
    };

    const logout = () => {
        localStorage.removeItem("sf_jwt");
        setJwt(null);
        setIsLoggedIn(false);
        setUser(null);
    };

    const updateUserState = (newData) => {
        setUser(prev => ({ ...prev, ...newData }));
    };

    return (
        <AuthContext.Provider value={{ isLoggedIn, user, jwt, login, register, googleLogin, logout, updateUserState }}>
            {children}
        </AuthContext.Provider>
    );
};
