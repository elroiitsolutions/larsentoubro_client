import api from "@/lib/axios";

export interface SummaryCardsData {
    totalTools: number;
    available: number;
    issued: number;
    underInspection: number;
    inspectionDue: number;
    expired: number;
    damagedRepair: number;
    scrap: number;
    usable: number;
    unusable: number;
    missing: number;
    inTransit: number;
}

export interface StoreNode {
    id: string;
    name: string;
    type: 'Store' | 'HUB';
    location: string;
    totalTools: number;
    available: number;
    issued: number;
    alertsCount: number;
}

export interface ProjectNode {
    id: string;
    name: string;
    projectCode: string;
    type: 'Project';
    totalTools: number;
    available: number;
    issued: number;
    alertsCount: number;
    stores: StoreNode[];
}

export interface DivisionNode {
    id: string;
    name: string;
    type: 'Division';
    totalTools: number;
    available: number;
    issued: number;
    alertsCount: number;
    projects: ProjectNode[];
}

export interface StatusDistributionItem {
    status: string;
    count: number;
    color: string;
}

export interface ToolLifeAgeData {
    under1Year: number;
    yr1To2: number;
    yr2To3: number;
    over3YrPendingInspection: number;
    extended1Yr: number;
    extended2Yr: number;
    totalExceeding3Yrs: number;
}

export interface ToolMovementData {
    movementsIn: number;
    movementsOut: number;
    transfers: number;
    pendingInward: number;
    currentlyInTransit: number;
}

export interface AlertItem {
    id: string;
    type: string;
    severity: 'warning' | 'danger' | 'info';
    title: string;
    message: string;
    toolId?: string;
    toolDbId?: string;
    date: string | Date;
}

export interface ActivityItem {
    id: string;
    action: string;
    toolId: string;
    user: string;
    details: string;
    date: string | Date;
    type: string;
}

export interface ExecutiveDashboardData {
    summaryCards: SummaryCardsData;
    hierarchyTree: DivisionNode[];
    statusDistribution: StatusDistributionItem[];
    toolLifeAge: ToolLifeAgeData;
    toolMovement: ToolMovementData;
    alerts: AlertItem[];
    recentActivity: ActivityItem[];
}

export interface DashboardFilterParams {
    division?: string;
    project?: string;
    store?: string;
    hub?: string;
    category?: string;
    status?: string;
    startDate?: string;
    endDate?: string;
}

export const dashboardService = {
    /**
     * Retrieves consolidated or filtered executive dashboard statistics.
     */
    getDashboardStats: async (params: DashboardFilterParams = {}): Promise<ExecutiveDashboardData> => {
        const response = await api.get("/api/dashboard/stats", { params });
        if (response.data && response.data.success) {
            return response.data.data;
        }
        throw new Error("Failed to load dashboard metrics");
    },

    /**
     * Approves manual inspection and extends tool validity by 1 or 2 years.
     */
    extendToolLife: async (toolId: string, payload: { extensionYears: number; inspectorName: string; remarks?: string }) => {
        const response = await api.post(`/api/dashboard/tools/${encodeURIComponent(toolId)}/extend-life`, payload);
        return response.data;
    }
};

export default dashboardService;
