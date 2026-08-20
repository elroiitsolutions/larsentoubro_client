import { useState, useEffect, useCallback } from "react";
import { useAuth } from "@/contexts/AuthContext";
import NoAccessPage from "../NoAccessPage";
import { Skeleton } from "@/components/ui/skeleton";
import { toast } from "sonner";
import {
    Building2,
    RefreshCw,
    SlidersHorizontal,
    FileText
} from "lucide-react";
import { Button } from "@/components/ui/button";

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
    const { user } = useAuth();
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);

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
            setRefreshing(false);
        }
    }, []);

    useEffect(() => {
        loadStats(filters);
    }, [filters, loadStats]);

    const handleFilterChange = (key: keyof DashboardFilterParams, value: string) => {
        setFilters((prev) => ({ ...prev, [key]: value }));
    };

    const handleResetFilters = () => {
        setFilters({
            division: "All",
            project: "All",
            store: "All",
            hub: "All",
            category: "All",
            status: "All",
            startDate: "",
            endDate: ""
        });
    };

    const handleAlertClick = (alert: AlertItem) => {
        if (alert.type.includes("Inspection") || alert.type.includes("Expired")) {
            setSelectedToolForExtension({
                id: alert.toolId || "T-TOOL",
                dbId: alert.toolDbId
            });
            setExtensionModalOpen(true);
        } else {
            toast.info(`${alert.title}: ${alert.message}`);
        }
    };

    const handleExportPDF = () => {
        toast.info("Preparing PDF Print View for Executive Dashboard...");
        window.print();
    };

    if (isRestricted) {
        return <NoAccessPage />;
    }

    if (loading || !dashboardData) {
        return (
            <div className="w-full mx-auto p-4 space-y-6">
                <Skeleton className="h-16 w-full rounded-2xl" />
                <Skeleton className="h-28 w-full rounded-2xl" />
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                    {Array.from({ length: 4 }).map((_, i) => (
                        <Skeleton key={i} className="h-32 rounded-2xl" />
                    ))}
                </div>
            </div>
        );
    }

    const allProjectsList = dashboardData?.hierarchyTree?.flatMap((d) => d.projects) || [];
    const activeProj = allProjectsList.find((p) => p.id === filters.project);
    const activeProjectName = activeProj ? activeProj.name : filters.project;

    const allStoresList = allProjectsList.flatMap((p) => p.stores);
    const activeSt = allStoresList.find((s) => s.id === filters.store);
    const activeStoreName = activeSt ? activeSt.name : filters.store;

    return (
        <div className="w-full mx-auto p-3 sm:p-5 space-y-6 pb-16 print:p-0">

            {/* Active Filter Indicator Tag */}
            {(filters.division !== "All" || filters.project !== "All" || filters.store !== "All" || filters.hub !== "All" || filters.status !== "All" || filters.category !== "All") && (
                <div className="flex items-center justify-between p-3 rounded-xl bg-primary/10 border border-primary/20 text-xs text-primary font-semibold print:hidden">
                    <div className="flex items-center gap-2">
                        <SlidersHorizontal className="size-4" />
                        <span>Active View Filters:</span>
                        <div className="flex flex-wrap items-center gap-1.5 font-sans">
                            {filters.division !== "All" && <span className="bg-background px-2 py-0.5 rounded border border-primary/30">Div: {filters.division}</span>}
                            {filters.project !== "All" && <span className="bg-background px-2 py-0.5 rounded border border-primary/30">Project: {activeProjectName}</span>}
                            {filters.store !== "All" && <span className="bg-background px-2 py-0.5 rounded border border-primary/30">Store: {activeStoreName}</span>}
                            {filters.hub !== "All" && <span className="bg-background px-2 py-0.5 rounded border border-primary/30">HUB Filter Active</span>}
                            {filters.status !== "All" && <span className="bg-background px-2 py-0.5 rounded border border-primary/30">Status: {filters.status}</span>}
                            {filters.category !== "All" && <span className="bg-background px-2 py-0.5 rounded border border-primary/30">Category: {filters.category}</span>}
                        </div>
                    </div>

                    <Button
                        size="sm"
                        variant="ghost"
                        onClick={handleResetFilters}
                        className="h-6 text-[11px] px-2 text-primary hover:bg-primary/20"
                    >
                        Clear Filters
                    </Button>
                </div>
            )}

            {/* 1. Main Summary Cards Grid */}
            <SummaryCardsGrid
                data={dashboardData.summaryCards}
                onCardClick={(statusVal) => handleFilterChange("status", statusVal)}
                activeStatus={filters.status}
                hierarchyData={dashboardData.hierarchyTree}
                filters={filters}
                onChangeFilter={handleFilterChange}
            />

            {/* 2. Critical Operational Alerts & Recent Activity Feed */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
                {/* Critical Operational Alerts */}
                <div className="lg:col-span-6">
                    <AlertsActionRequired
                        alerts={dashboardData.alerts}
                        onAlertClick={handleAlertClick}
                    />
                </div>

                {/* Recent Activity Audit Feed */}
                <div className="lg:col-span-6">
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
