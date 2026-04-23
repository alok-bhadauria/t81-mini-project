import { createContext, useContext, useState, useEffect, useCallback } from "react";
import { api } from "../services/api";

const AuthContext = createContext({
    isLoggedIn: false,
    user: null,
    jwt: null,
    login: async () => {},
    register: async () => {},
    googleLogin: async () => {},
    logout: () => {},
    updateUserState: () => {},
});

export const useAuth = () => useContext(AuthContext);

export const AuthProvider = ({ children }) => {
    const [isLoggedIn, setIsLoggedIn] = useState(false);
    const [jwt, setJwt] = useState(null);
    const [user, setUser] = useState(null);

    const logout = useCallback(() => {
        localStorage.removeItem("sf_jwt");
        setJwt(null);
        setIsLoggedIn(false);
        setUser(null);
    }, []);

    const fetchUserProfile = useCallback(async () => {
        try {
            const userData = await api.get("/auth/me");
            setUser(userData);
        } catch (e) {
            if (e.message === "SESSION_EXPIRED") {
                logout();
            }
        }
    }, [logout]);

    useEffect(() => {
        const storedToken = localStorage.getItem("sf_jwt");
        if (storedToken) {
            setJwt(storedToken);
            setIsLoggedIn(true);
            setUser({ email: "Loading...", full_name: "Loading..." });
            fetchUserProfile();
        }
    }, [fetchUserProfile]);

    const _applyToken = (token) => {
        localStorage.setItem("sf_jwt", token);
        setJwt(token);
        setIsLoggedIn(true);
    };

    const login = async (email, password) => {
        const formBody = new URLSearchParams();
        formBody.append("username", email);
        formBody.append("password", password);

        const data = await api.postForm("/auth/login", formBody.toString());
        _applyToken(data.access_token);
        await fetchUserProfile();
        return true;
    };

    const register = async (name, email, password) => {
        await api.post("/auth/register", { full_name: name, email, password });
        await login(email, password);
        return { isNew: true };
    };

    const googleLogin = async (accessToken) => {
        const data = await api.post("/auth/google", { access_token: accessToken });
        _applyToken(data.access_token);
        await fetchUserProfile();
        return { isNew: data.is_new_user === true };
    };

    const updateUserState = (newData) => {
        setUser((prev) => ({ ...prev, ...newData }));
    };

    return (
        <AuthContext.Provider value={{ isLoggedIn, user, jwt, login, register, googleLogin, logout, updateUserState }}>
            {children}
        </AuthContext.Provider>
    );
};
