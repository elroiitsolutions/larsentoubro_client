import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from "@/components/ui/card"
import {
    UsersIcon,
    ActivityIcon,
    StoreIcon,
    FolderIcon,
    ClockIcon,
    CheckCircle2Icon,
    BuildingIcon,
    TrendingUpIcon
} from "lucide-react"
import { useState, useEffect } from "react"
import dashboardService from "@/services/dashboard.service"
import { Skeleton } from "@/components/ui/skeleton"
import { useAuth } from "@/contexts/AuthContext"
import NoAccessPage from "../NoAccessPage"

export function DashboardPage() {
    const { user } = useAuth()
    const [loading, setLoading] = useState(true);
    const [projects, setProjects] = useState<any[]>([]);
    const [stores, setStores] = useState<any[]>([]);
    const [users, setUsers] = useState<any[]>([]);

    const isRestricted = Boolean(
        user &&
        user.role !== "Admin" &&
        (!user.allowedPages || !user.allowedPages.includes("/dashboard"))
    );

    if (isRestricted) {
        return <NoAccessPage />;
    }

    useEffect(() => {
        const fetchData = async () => {
            try {
                const metrics = await dashboardService.getDashboardMetrics();
                setProjects(metrics.projects);
                setStores(metrics.stores);
                setUsers(metrics.users);
            } catch (error) {
                console.error("Failed to fetch dashboard data", error);
            } finally {
                setTimeout(() => setLoading(false), 200);
            }
        };

        fetchData();
    }, []);

    // Derived Metrics
    const activeProjects = projects.filter(p => p.status === 'Active').length;
    const operationalStores = stores.filter(s => s.status === 'Operational').length;

    // Generate Activity Feed
    const getActivities = () => {
        const activities: any[] = [];

        projects.forEach(p => {
            if (p.createdAt) {
                activities.push({
                    id: `p-c-${p._id}`,
                    label: `Project "${p.name}" created`,
                    type: 'project',
                    date: new Date(p.createdAt)
                });
            }
        });

        stores.forEach(s => {
            if (s.createdAt) {
                activities.push({
                    id: `s-c-${s._id}`,
                    label: `Store "${s.name}" added`,
                    type: 'store',
                    date: new Date(s.createdAt)
                });
            }
        });

        users.forEach(u => {
            if (u.createdAt) {
                activities.push({
                    id: `u-c-${u._id}`,
                    label: `${u.name} joined`,
                    type: 'user',
                    date: new Date(u.createdAt)
                });
            }
        });

        return activities.sort((a, b) => b.date.getTime() - a.date.getTime()).slice(0, 5);
    };

    const recentActivity = getActivities();

    const timeAgo = (date: Date) => {
        const seconds = Math.floor((new Date().getTime() - date.getTime()) / 1000);
        let interval = seconds / 31536000;
        if (interval > 1) return Math.floor(interval) + "y ago";
        interval = seconds / 2592000;
        if (interval > 1) return Math.floor(interval) + "mo ago";
        interval = seconds / 86400;
        if (interval > 1) return Math.floor(interval) + "d ago";
        interval = seconds / 3600;
        if (interval > 1) return Math.floor(interval) + "h ago";
        interval = seconds / 60;
        if (interval > 1) return Math.floor(interval) + "m ago";
        return Math.floor(seconds) + "s ago";
    };

    if (loading) {
        return (
            <div className="flex flex-col gap-6 w-full max-w-7xl mx-auto p-2">
                <div className="grid gap-6 md:grid-cols-4 lg:grid-cols-8 auto-rows-[minmax(140px,auto)]">
                    <Skeleton className="md:col-span-4 lg:col-span-4 md:row-span-2 rounded-[24px]" />
                    <Skeleton className="md:col-span-2 lg:col-span-2 rounded-[24px]" />
                    <Skeleton className="md:col-span-2 lg:col-span-2 rounded-[24px]" />
                    <Skeleton className="md:col-span-2 lg:col-span-2 rounded-[24px]" />
                    <Skeleton className="md:col-span-2 lg:col-span-2 rounded-[24px]" />
                    <Skeleton className="md:col-span-5 lg:col-span-5 md:row-span-2 rounded-[24px] min-h-[300px]" />
                    <Skeleton className="md:col-span-3 lg:col-span-3 md:row-span-2 rounded-[24px] min-h-[300px]" />
                </div>
            </div>
        )
    }

    const activePercent = projects.length > 0 ? Math.round((activeProjects / projects.length) * 100) : 0;
    const opStorePercent = stores.length > 0 ? Math.round((operationalStores / stores.length) * 100) : 0;

    const cardClass = "rounded-xl border border-border/60 bg-card shadow-xs hover:shadow-md transition-all duration-200 overflow-hidden relative";

    return (
        <div className="w-full mx-auto p-4 space-y-4">
            {/* Top Welcome Strip */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-4 rounded-xl border border-primary/20 bg-gradient-to-r from-primary/10 via-background to-background">
                <div className="flex items-center gap-3">
                    <div className="size-10 rounded-lg bg-primary/15 flex items-center justify-center text-primary shrink-0">
                        <BuildingIcon className="size-5" />
                    </div>
                    <div>
                        <h1 className="text-lg font-bold text-foreground tracking-tight">Welcome to L&T Portal</h1>
                        <p className="text-xs text-muted-foreground">Centralized command center for projects, store inventory & operations.</p>
                    </div>
                </div>
                <div className="flex items-center gap-2 self-start sm:self-auto">
                    <div className="px-3 py-1 rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 text-xs font-semibold flex items-center gap-2 border border-emerald-500/20">
                        <span className="relative flex h-2 w-2">
                            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-500 opacity-75"></span>
                            <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
                        </span>
                        System Operational
                    </div>
                </div>
            </div>

            {/* Growvix CRM Style 4-Column Summary Cards */}
            <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-4">

                {/* 1. Total Projects */}
                <Card className={`${cardClass} p-4 flex flex-col justify-between`}>
                    <div className="flex items-start justify-between">
                        <div className="flex items-center gap-2.5">
                            <div className="p-2.5 bg-blue-500/10 text-blue-500 rounded-lg shrink-0">
                                <FolderIcon className="size-5" />
                            </div>
                            <div>
                                <div className="text-sm font-bold text-foreground tracking-tight">Total Projects</div>
                                <div className="text-xs text-muted-foreground">All assigned enterprise projects</div>
                            </div>
                        </div>
                    </div>
                    <div className="mt-3 flex items-baseline justify-between">
                        <div className="text-3xl font-extrabold text-foreground">{projects.length}</div>
                        <div className="flex items-center gap-1 text-xs font-semibold text-blue-600 dark:text-blue-400 bg-blue-500/10 px-2.5 py-1 rounded-md">
                            <TrendingUpIcon className="size-3.5" />
                            {activeProjects} active
                        </div>
                    </div>
                </Card>

                {/* 2. Total Stores */}
                <Card className={`${cardClass} p-4 flex flex-col justify-between`}>
                    <div className="flex items-start justify-between">
                        <div className="flex items-center gap-2.5">
                            <div className="p-2.5 bg-orange-500/10 text-orange-500 rounded-lg shrink-0">
                                <StoreIcon className="size-5" />
                            </div>
                            <div>
                                <div className="text-sm font-bold text-foreground tracking-tight">Total Stores</div>
                                <div className="text-xs text-muted-foreground">Operational inventory sites</div>
                            </div>
                        </div>
                    </div>
                    <div className="mt-3 flex items-baseline justify-between">
                        <div className="text-3xl font-extrabold text-foreground">{stores.length}</div>
                        <div className="flex items-center gap-1 text-xs font-semibold text-orange-600 dark:text-orange-400 bg-orange-500/10 px-2.5 py-1 rounded-md">
                            <CheckCircle2Icon className="size-3.5" />
                            {operationalStores} operational
                        </div>
                    </div>
                </Card>

                {/* 3. Active Users */}
                <Card className={`${cardClass} p-4 flex flex-col justify-between`}>
                    <div className="flex items-start justify-between">
                        <div className="flex items-center gap-2.5">
                            <div className="p-2.5 bg-purple-500/10 text-purple-500 rounded-lg shrink-0">
                                <UsersIcon className="size-5" />
                            </div>
                            <div>
                                <div className="text-sm font-bold text-foreground tracking-tight">Registered Users</div>
                                <div className="text-xs text-muted-foreground">Portal access & personnel</div>
                            </div>
                        </div>
                    </div>
                    <div className="mt-3 flex items-baseline justify-between">
                        <div className="text-3xl font-extrabold text-foreground">{users.length}</div>
                        <span className="text-xs font-semibold text-muted-foreground bg-muted/60 px-2.5 py-1 rounded-md">
                            {users.length} active
                        </span>
                    </div>
                </Card>

                {/* 4. System Health */}
                <Card className={`${cardClass} p-4 flex flex-col justify-between`}>
                    <div className="flex items-start justify-between">
                        <div className="flex items-center gap-2.5">
                            <div className="p-2.5 bg-emerald-500/10 text-emerald-500 rounded-lg shrink-0">
                                <ActivityIcon className="size-5" />
                            </div>
                            <div>
                                <div className="text-sm font-bold text-foreground tracking-tight">System Health</div>
                                <div className="text-xs text-muted-foreground">Services uptime indicator</div>
                            </div>
                        </div>
                    </div>
                    <div className="mt-3 flex items-baseline justify-between">
                        <div className="text-3xl font-extrabold text-emerald-600 dark:text-emerald-400">{projects.length > 0 ? "99.9" : "100"}%</div>
                        <span className="text-xs font-semibold text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 px-2.5 py-1 rounded-md">
                            Uptime 100%
                        </span>
                    </div>
                </Card>

            </div>

            {/* Main Content Split: Overview Chart & Recent Activity */}
            <div className="grid gap-4 grid-cols-1 lg:grid-cols-12">

                {/* Operational Capacity (8 cols) */}
                <Card className={`${cardClass} lg:col-span-7 p-5 flex flex-col`}>
                    <CardHeader className="p-0 mb-4">
                        <CardTitle className="text-base font-bold text-foreground">Operational Capacity</CardTitle>
                        <CardDescription className="text-xs">Real-time status breakdown of active projects and store facilities</CardDescription>
                    </CardHeader>
                    <CardContent className="p-0 flex-1 flex flex-col justify-center gap-6 py-2">
                        {/* Projects Progress */}
                        <div className="space-y-2">
                            <div className="flex justify-between items-center text-xs">
                                <div>
                                    <span className="font-semibold text-foreground">Active Projects</span>
                                    <span className="text-muted-foreground ml-2">({activeProjects} of {projects.length} total)</span>
                                </div>
                                <span className="font-bold text-blue-600 dark:text-blue-400">{activePercent}%</span>
                            </div>
                            <div className="h-3 w-full rounded-full bg-muted/50 overflow-hidden">
                                <div
                                    className="h-full rounded-full bg-blue-500 transition-all duration-700 ease-out"
                                    style={{ width: `${activePercent}%` }}
                                />
                            </div>
                        </div>

                        {/* Stores Progress */}
                        <div className="space-y-2">
                            <div className="flex justify-between items-center text-xs">
                                <div>
                                    <span className="font-semibold text-foreground">Operational Stores</span>
                                    <span className="text-muted-foreground ml-2">({operationalStores} of {stores.length} total)</span>
                                </div>
                                <span className="font-bold text-orange-600 dark:text-orange-400">{opStorePercent}%</span>
                            </div>
                            <div className="h-3 w-full rounded-full bg-muted/50 overflow-hidden">
                                <div
                                    className="h-full rounded-full bg-orange-500 transition-all duration-700 delay-150 ease-out"
                                    style={{ width: `${opStorePercent}%` }}
                                />
                            </div>
                        </div>
                    </CardContent>
                </Card>

                {/* Recent Activity (5 cols) */}
                <Card className={`${cardClass} lg:col-span-5 p-5 flex flex-col`}>
                    <CardHeader className="p-0 mb-4">
                        <CardTitle className="flex items-center gap-2 text-base font-bold text-foreground">
                            <ClockIcon className="size-4 text-primary" />
                            Recent Activity
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="flex-1 p-0">
                        <div className="space-y-4">
                            {recentActivity.length > 0 ? recentActivity.map((item, index) => (
                                <div key={item.id} className="flex items-center gap-3">
                                    <div className={`size-2.5 rounded-full shrink-0 ${item.type === 'project' ? 'bg-blue-500' :
                                        item.type === 'store' ? 'bg-orange-500' : 'bg-purple-500'
                                        }`} />
                                    <div className="flex-1 min-w-0 flex items-center justify-between gap-2">
                                        <p className="text-xs font-medium text-foreground truncate">{item.label}</p>
                                        <time className="text-[11px] text-muted-foreground shrink-0">{timeAgo(item.date)}</time>
                                    </div>
                                </div>
                            )) : (
                                <div className="flex flex-col items-center justify-center py-6 text-muted-foreground/60">
                                    <ClockIcon className="size-8 mb-2 stroke-1" />
                                    <span className="text-xs font-medium">No recent activity</span>
                                </div>
                            )}
                        </div>
                    </CardContent>
                </Card>

            </div>
        </div>
    )
}
