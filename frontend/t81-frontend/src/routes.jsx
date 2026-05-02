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
import { Plans } from "./pages/Plans";
import { Learn } from "./pages/Learn";
import { ProtectedRoute } from "./components/common/ProtectedRoute";

const router = createBrowserRouter([
    {
        path: "/",
        element: <MainLayout />,
        children: [
            { index: true, element: <Landing /> },
            {
                path: "translate",
                element: <ProtectedRoute><Translate /></ProtectedRoute>,
            },
            {
                path: "learn",
                element: <ProtectedRoute><Learn /></ProtectedRoute>,
            },
            {
                path: "settings",
                element: <ProtectedRoute><Settings /></ProtectedRoute>,
            },
            {
                path: "plans",
                element: <ProtectedRoute><Plans /></ProtectedRoute>,
            },
            {
                path: "uploads",
                element: <ProtectedRoute><Uploads /></ProtectedRoute>,
            },
            {
                path: "history",
                element: <ProtectedRoute><History /></ProtectedRoute>,
            },
            { path: "support", element: <Support /> },
            {
                path: ":userId",
                element: <ProtectedRoute><Profile /></ProtectedRoute>,
            },
        ],
    },
    {
        path: "/login",
        element: <Login />,
    },
    {
        path: "*",
        element: <Navigate to="/" replace />,
    },
]);

export function AppRouter() {
    return <RouterProvider router={router} />;
}
