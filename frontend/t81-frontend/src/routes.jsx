import { createBrowserRouter, RouterProvider, Navigate } from "react-router-dom";
import { MainLayout } from "./components/layout/MainLayout";
import { Landing } from "./pages/Landing";
import { Translate } from "./pages/Translate";
import { Settings } from "./pages/Settings";
import { Uploads } from "./pages/Uploads";
import { History } from "./pages/History";
import { Support } from "./pages/Support";
import { Profile } from "./pages/Profile";
import { Login } from "./pages/Login";

const router = createBrowserRouter([
    {
        path: "/",
        element: <MainLayout />,
        children: [
            { index: true, element: <Landing /> },
            { path: "translate", element: <Translate /> },
            { path: "settings", element: <Settings /> },
            { path: "uploads", element: <Uploads /> },
            { path: "history", element: <History /> },
            { path: "support", element: <Support /> },
            { path: ":userId", element: <Profile /> },
        ],
    },
    {
        path: "/login",
        element: <Login />,
    },
    {
        path: "*",
        element: <Navigate to="/" replace />,
    }
]);

export function AppRouter() {
    return <RouterProvider router={router} />;
}
