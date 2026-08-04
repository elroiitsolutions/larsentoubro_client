import api from "@/lib/axios";
import type { ProjectRecord } from "./project.service";
import type { StoreRecord } from "./store.service";
import type { UserRecord } from "./user.service";

export interface DashboardMetricsData {
    projects: ProjectRecord[];
    stores: StoreRecord[];
    users: UserRecord[];
}

export const dashboardService = {
    /**
     * Retrieves aggregated data for projects, stores, and users in parallel.
     */
    getDashboardMetrics: async (): Promise<DashboardMetricsData> => {
        const [projectsRes, storesRes, usersRes] = await Promise.all([
            api.get("/api/projects").then((res) => res.data),
            api.get("/api/stores").then((res) => res.data),
            api.get("/api/users").then((res) => res.data),
        ]);

        return {
            projects: projectsRes.success ? projectsRes.data : [],
            stores: storesRes.success ? storesRes.data : [],
            users: usersRes.success ? usersRes.data : [],
        };
    },
};

export default dashboardService;
