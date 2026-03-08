import { ThemeProvider } from "./context/ThemeContext";
import { ToastProvider } from "./context/ToastContext";
import { SoundProvider } from "./context/SoundContext";
import { AuthProvider } from "./context/AuthContext";
import { AppRouter } from "./routes";
import { GoogleOAuthProvider } from "@react-oauth/google";

export default function App() {
  return (
    <GoogleOAuthProvider clientId="224125299681-9s3nh7vrdfu27t4vh00t26gn3vq0gg75.apps.googleusercontent.com">
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
