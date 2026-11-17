import { useState, useEffect, useCallback } from "react";
import { Navigate, useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import NoAccessPage from "../NoAccessPage";
import { getDefaultAllowedPath } from "@/utils/navigation";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import {
    LayoutDashboard,
    Wrench,
    Layers,
    ArrowUpRight
} from "lucide-react";

import dashboardService from "@/services/dashboard.service";
import type {
    ExecutiveDashboardData,
    DashboardFilterParams,
    AlertItem
} from "@/services/dashboard.service";

import SummaryCardsGrid from "@/components/dashboard/SummaryCardsGrid";
import AlertsActionRequired from "@/components/dashboard/AlertsActionRequired";
import RecentActivityFeed from "@/components/dashboard/RecentActivityFeed";
import ToolLifeExtensionModal from "@/components/dashboard/ToolLifeExtensionModal";

export function DashboardPage() {
    const navigate = useNavigate();
    const { user } = useAuth();
    const [loading, setLoading] = useState(true);

    // Executive Dashboard State
    const [dashboardData, setDashboardData] = useState<ExecutiveDashboardData | null>(null);

    // Global Central Filters
    const [filters, setFilters] = useState<DashboardFilterParams>({
        division: "All",
        project: "All",
        store: "All",
        hub: "All",
        category: "All",
        status: "All",
        startDate: "",
        endDate: ""
    });

    // Alert / Life Extension Modal State
    const [extensionModalOpen, setExtensionModalOpen] = useState(false);
    const [selectedToolForExtension, setSelectedToolForExtension] = useState<{ id: string; dbId?: string; code?: string }>({
        id: "T-001"
    });

    const isRestricted = Boolean(
        user &&
        user.role !== "Admin" &&
        (!user.allowedPages || !user.allowedPages.includes("/dashboard"))
    );

    const loadStats = useCallback(async (currentFilters: DashboardFilterParams) => {
        try {
            const data = await dashboardService.getDashboardStats(currentFilters);
            setDashboardData(data);
        } catch (error) {
            console.error("Failed to load dashboard metrics", error);
            toast.error("Could not load dashboard metrics");
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        loadStats(filters);
    }, [filters, loadStats]);

    // If non-admin user has access to only 1 store or project, pre-select it
    useEffect(() => {
        if (user && user.role !== "Admin") {
            const userStore = user.stores && user.stores.length === 1 ? user.stores[0] : null;
            const storeIdStr = userStore ? String(typeof userStore === 'object' ? userStore._id : userStore) : null;

            const userProject = user.projects && user.projects.length === 1 ? user.projects[0] : null;
            const projIdStr = userProject ? String(typeof userProject === 'object' ? userProject._id : userProject) : null;

            if (storeIdStr || projIdStr) {
                setFilters(prev => ({
                    ...prev,
                    ...(storeIdStr && prev.store === "All" ? { store: storeIdStr } : {}),
                    ...(projIdStr && prev.project === "All" ? { project: projIdStr } : {})
                }));
            }
        }
    }, [user]);

    const handleAlertClick = (alert: AlertItem) => {
        if ((alert.type || "").toLowerCase().includes("expired")) {
            return;
        }
        if (alert.type.includes("Inspection")) {
            setSelectedToolForExtension({
                id: alert.toolId || "T-TOOL",
                dbId: alert.toolDbId
            });
            setExtensionModalOpen(true);
        } else if (alert.toolDbId) {
            const params = new URLSearchParams();
            const projId = alert.project?._id || alert.project;
            const storeId = alert.store?._id || alert.store;
            if (projId) params.set('projectId', String(projId));
            if (storeId) params.set('storeId', String(storeId));
            const queryStr = params.toString() ? `?${params.toString()}` : '';
            navigate(`/vt/${encodeURIComponent(alert.toolId || alert.toolDbId)}${queryStr}`);
        } else {
            toast.info(`${alert.title}: ${alert.message}`);
        }
    };

    if (isRestricted) {
        const targetPath = getDefaultAllowedPath(user);
        if (targetPath && targetPath !== "/dashboard" && targetPath !== "/no-access") {
            return <Navigate to={targetPath} replace />;
        }
        return <NoAccessPage />;
    }

    if (loading || !dashboardData) {
        return (
            <div className="w-full space-y-3.5 pt-1 animate-pulse">
                <div className="flex items-center justify-between">
                    <Skeleton className="h-10 w-64 rounded-xl" />
                    <Skeleton className="h-9 w-44 rounded-xl" />
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3 sm:gap-3.5">
                    {Array.from({ length: 6 }).map((_, i) => (
                        <Skeleton key={i} className="h-32 rounded-2xl" />
                    ))}
                </div>
                <Skeleton className="h-14 w-full rounded-2xl" />
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
                    <Skeleton className="lg:col-span-6 h-96 rounded-2xl" />
                    <Skeleton className="lg:col-span-6 h-96 rounded-2xl" />
                </div>
            </div>
        );
    }

    return (
        <div className="w-full h-full flex-1 flex flex-col space-y-2 pt-0.5 pb-0 print:p-0 animate-in fade-in duration-300 min-h-0">
            {/* Executive Command Center Hero Header */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1.5 pb-1.5 border-b border-border/40 shrink-0">
                <div className="flex items-center gap-2 min-w-0">
                    <div className="p-1.5 rounded-lg bg-gradient-to-tr from-blue-600 via-indigo-600 to-violet-600 text-white shadow-md shadow-indigo-500/20 ring-2 ring-indigo-500/10 shrink-0">
                        <LayoutDashboard className="size-4" />
                    </div>
                    <div className="min-w-0">
                        <div className="flex items-center gap-1.5 flex-wrap">
                            <h1 className="text-sm sm:text-base font-bold tracking-tight text-foreground truncate">
                                Equipment Management Center
                            </h1>
                            <span className="text-[9px] font-extrabold px-1.5 py-0.2 rounded-full bg-primary/10 text-primary border border-primary/20 uppercase tracking-wider shrink-0">
                                L&T Command
                            </span>
                        </div>
                    </div>
                </div>

                {/* Header Actions */}
                <div className="flex items-center gap-2 shrink-0 self-start sm:self-center">
                    {/* Quick Link to Tools Inventory */}
                    <Button
                        variant="outline"
                        size="sm"
                        onClick={() => navigate("/stores")}
                        className="rounded-lg h-7 px-2 gap-1.5 text-[11px] font-semibold bg-primary/5 hover:bg-primary/10 text-primary border-primary/25 cursor-pointer shadow-2xs"
                    >
                        <Wrench className="size-3" />
                        <span>View Inventory</span>
                        <ArrowUpRight className="size-2.5" />
                    </Button>

                    {/* Quick Link to Reports Hub */}
                    <Button
                        variant="outline"
                        size="sm"
                        onClick={() => navigate("/settings/reports")}
                        className="rounded-lg h-7 px-2 gap-1.5 text-[11px] font-semibold hover:bg-muted cursor-pointer shadow-2xs"
                    >
                        <Layers className="size-3 text-muted-foreground" />
                        <span>Reports</span>
                    </Button>
                </div>
            </div>

            {/* 1. Enhanced Summary Cards Grid with Fleet Allocation Bar */}
            <div className="shrink-0">
                <SummaryCardsGrid data={dashboardData.summaryCards} />
            </div>

            {/* 2. Critical Operational Alerts & Recent Activity Feed */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-3 items-stretch flex-1 min-h-[300px] lg:min-h-0">
                {/* Critical Operational Alerts */}
                <div className="lg:col-span-6 flex flex-col min-h-0 h-full">
                    <AlertsActionRequired
                        alerts={dashboardData.alerts}
                        onAlertClick={handleAlertClick}
                    />
                </div>

                {/* Recent Activity Audit Feed */}
                <div className="lg:col-span-6 flex flex-col min-h-0 h-full">
                    <RecentActivityFeed
                        activities={dashboardData.recentActivity}
                    />
                </div>
            </div>

            {/* Life Extension Modal */}
            <ToolLifeExtensionModal
                open={extensionModalOpen}
                onOpenChange={setExtensionModalOpen}
                toolId={selectedToolForExtension.id}
                toolDbId={selectedToolForExtension.dbId}
                toolCode={selectedToolForExtension.code}
                onSuccess={() => loadStats(filters)}
            />
        </div>
    );
}

export default DashboardPage;
