import { BrowserRouter, Routes, Route, Navigate, Outlet } from "react-router-dom"
import { useAuth } from "@/contexts/AuthContext"

import { SidebarLayout } from "@/layouts/SidebarLayout"
import { LoginPage } from "@/pages/auth/LoginPage"
import { DashboardPage } from "@/pages/dashboard/DashboardPage"
import { ProjectsPage } from "@/pages/projects/ProjectsPage"
import { StoresPage } from "@/pages/stores/StoresPage"
import { UsersPage } from "@/pages/users/UsersPage"
import { ToolsPage } from "@/pages/tools/ToolsPage"
import { StoreToolsPage } from "@/pages/stores/StoreToolsPage"
import { SettingsPage } from "@/pages/settings/SettingsPage"
import { SettingsFormManagementPage } from "@/pages/settings/SettingsFormManagementPage"
import { NotFoundPage } from "@/pages/NotFoundPage"

function ProtectedRoute() {
    const { user, loading } = useAuth()

    if (loading) {
        return (
            <div className="flex h-screen w-screen items-center justify-center bg-background">
                <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
            </div>
        )
    }

    if (!user) {
        return <Navigate to="/login" replace />
    }

    return <Outlet />
}

function PublicRoute() {
    const { user, loading } = useAuth()

    if (loading) {
        return (
            <div className="flex h-screen w-screen items-center justify-center bg-background">
                <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
            </div>
        )
    }

    if (user) {
        return <Navigate to="/dashboard" replace />
    }

    return <Outlet />
}

export function AppRouter() {
    return (
        <BrowserRouter>
            <Routes>
                {/* Public routes - only allowed if not logged in */}
                <Route element={<PublicRoute />}>
                    <Route path="/login" element={<LoginPage />} />
                </Route>

                {/* Protected routes - only allowed if logged in */}
                <Route element={<ProtectedRoute />}>
                    <Route element={<SidebarLayout />}>
                        <Route index element={<Navigate to="/dashboard" replace />} />
                        <Route path="/dashboard" element={<DashboardPage />} />
                        <Route path="/projects" element={<ProjectsPage />} />
                        <Route path="/projects/:projectId/stores" element={<StoresPage />} />
                        <Route path="/stores" element={<StoresPage />} />
                        <Route path="/stores/:storeId/tools" element={<StoreToolsPage />} />
                        <Route path="/users" element={<UsersPage />} />
                        {/* <Route path="/tools" element={<ToolsPage />} /> */}
                        <Route path="/settings" element={<SettingsPage />} />
                        <Route path="/settings/forms" element={<SettingsFormManagementPage />} />
                    </Route>
                </Route>

                {/* Fallback */}
                <Route path="*" element={<NotFoundPage />} />
            </Routes>
        </BrowserRouter>
    )
}
