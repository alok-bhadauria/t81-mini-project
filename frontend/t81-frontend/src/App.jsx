import { ThemeProvider } from "./context/ThemeContext";
import { ToastProvider } from "./context/ToastContext";
import { SoundProvider } from "./context/SoundContext";
import { AuthProvider } from "./context/AuthContext";
import { AppRouter } from "./routes";
import { GoogleOAuthProvider } from "@react-oauth/google";

export default function App() {
  return (
    <GoogleOAuthProvider clientId="224125299681-oo0mc2c1fdvgl719e2t6t560sn7491pl.apps.googleusercontent.com">
      <ThemeProvider>
        <SoundProvider>
          <ToastProvider>
            <AuthProvider>
              <AppRouter />
            </AuthProvider>
          </ToastProvider>
        </SoundProvider>
      </ThemeProvider>
    </GoogleOAuthProvider>
  );
}
