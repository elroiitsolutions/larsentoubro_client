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
    Loader2,
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

    const bentoCardClass = "rounded-[24px] border border-border/50 bg-card/40 backdrop-blur-md shadow-sm hover:shadow-xl hover:-translate-y-1 hover:border-primary/20 transition-all duration-300 ease-out overflow-hidden relative";

    return (
        <div className="w-full mx-auto p-2 pb-10">
            {/* Bento Grid */}
            <div className="pt-2 grid gap-6 md:grid-cols-4 lg:grid-cols-8 auto-rows-[minmax(160px,auto)]">
                
                {/* 1. Hero Card (4x2) */}
                <Card className={`md:col-span-4 lg:col-span-4 md:row-span-2 bg-gradient-to-br from-primary/15 via-background to-background border-primary/20 ${bentoCardClass} flex flex-col justify-between`} style={{ animation: "fade-in 0.5s ease-out 0s both, slide-in-from-bottom-8 0.5s ease-out 0s both" }}>
                    {/* Decorative Blob */}
                    <div className="absolute top-0 right-0 w-64 h-64 bg-primary/10 rounded-full blur-3xl -mr-20 -mt-20 pointer-events-none" />
                    
                    <CardHeader className="pb-0 relative z-10">
                        <div className="size-14 rounded-2xl bg-primary/20 flex items-center justify-center mb-6 text-primary shadow-inner border border-primary/20">
                            <BuildingIcon className="size-7" />
                        </div>
                        <CardTitle className="text-3xl md:text-4xl font-extrabold tracking-tight text-foreground">Welcome to L&T Portal</CardTitle>
                        <CardDescription className="text-base mt-3 max-w-md text-muted-foreground/80 leading-relaxed">
                            Manage your enterprise projects, store inventories, and personnel all from one centralized command center.
                        </CardDescription>
                    </CardHeader>
                    <CardContent className="pt-8 pb-8 relative z-10">
                        <div className="flex items-center gap-4">
                            <div className="px-5 py-2.5 rounded-full bg-primary/10 text-primary text-sm font-semibold flex items-center gap-2.5 border border-primary/20 backdrop-blur-md">
                                <span className="relative flex h-3 w-3">
                                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary opacity-75"></span>
                                  <span className="relative inline-flex rounded-full h-3 w-3 bg-primary"></span>
                                </span>
                                System Online
                            </div>
                        </div>
                    </CardContent>
                </Card>

                {/* 2. Total Projects (2x1) */}
                <Card className={`md:col-span-2 lg:col-span-2 ${bentoCardClass} flex flex-col justify-between p-7 group`} style={{ animation: "fade-in 0.5s ease-out 0.1s both, slide-in-from-bottom-8 0.5s ease-out 0.1s both" }}>
                    <div className="flex items-start justify-between">
                        <div className="text-muted-foreground font-medium text-sm tracking-wide uppercase">Total Projects</div>
                        <div className="p-2.5 bg-blue-500/10 text-blue-500 rounded-xl group-hover:scale-110 transition-transform duration-300">
                            <FolderIcon className="size-5" />
                        </div>
                    </div>
                    <div className="mt-4">
                        <div className="text-5xl font-black tracking-tighter text-foreground/90">{projects.length}</div>
                        <div className="flex items-center gap-1.5 text-sm font-medium text-blue-500 mt-2 bg-blue-500/10 w-fit px-2.5 py-1 rounded-md">
                            <TrendingUpIcon className="size-3.5" />
                            {activeProjects} active
                        </div>
                    </div>
                </Card>

                {/* 3. Total Stores (2x1) */}
                <Card className={`md:col-span-2 lg:col-span-2 ${bentoCardClass} flex flex-col justify-between p-7 group`} style={{ animation: "fade-in 0.5s ease-out 0.15s both, slide-in-from-bottom-8 0.5s ease-out 0.15s both" }}>
                    <div className="flex items-start justify-between">
                        <div className="text-muted-foreground font-medium text-sm tracking-wide uppercase">Total Stores</div>
                        <div className="p-2.5 bg-orange-500/10 text-orange-500 rounded-xl group-hover:scale-110 transition-transform duration-300">
                            <StoreIcon className="size-5" />
                        </div>
                    </div>
                    <div className="mt-4">
                        <div className="text-5xl font-black tracking-tighter text-foreground/90">{stores.length}</div>
                        <div className="flex items-center gap-1.5 text-sm font-medium text-orange-500 mt-2 bg-orange-500/10 w-fit px-2.5 py-1 rounded-md">
                            <CheckCircle2Icon className="size-3.5" />
                            {operationalStores} operational
                        </div>
                    </div>
                </Card>

                {/* 4. Active Users (2x1) */}
                <Card className={`md:col-span-2 lg:col-span-2 ${bentoCardClass} flex flex-col justify-between p-7 group`} style={{ animation: "fade-in 0.5s ease-out 0.2s both, slide-in-from-bottom-8 0.5s ease-out 0.2s both" }}>
                    <div className="flex items-start justify-between">
                        <div className="text-muted-foreground font-medium text-sm tracking-wide uppercase">Active Users</div>
                        <div className="p-2.5 bg-purple-500/10 text-purple-500 rounded-xl group-hover:scale-110 transition-transform duration-300">
                            <UsersIcon className="size-5" />
                        </div>
                    </div>
                    <div className="mt-4">
                        <div className="text-5xl font-black tracking-tighter text-foreground/90">{users.length}</div>
                        <div className="text-sm font-medium text-muted-foreground mt-2 bg-muted/50 w-fit px-2.5 py-1 rounded-md">registered</div>
                    </div>
                </Card>

                {/* 5. Health (2x1) */}
                <Card className={`md:col-span-2 lg:col-span-2 ${bentoCardClass} flex flex-col justify-between p-7 group`} style={{ animation: "fade-in 0.5s ease-out 0.25s both, slide-in-from-bottom-8 0.5s ease-out 0.25s both" }}>
                    <div className="flex items-start justify-between">
                        <div className="text-muted-foreground font-medium text-sm tracking-wide uppercase">System Health</div>
                        <div className="p-2.5 bg-emerald-500/10 text-emerald-500 rounded-xl group-hover:scale-110 transition-transform duration-300">
                            <ActivityIcon className="size-5" />
                        </div>
                    </div>
                    <div className="mt-4">
                        <div className="text-5xl font-black tracking-tighter text-emerald-500 dark:text-emerald-400">{projects.length > 0 ? "99.9" : "100"}%</div>
                        <div className="text-sm font-medium text-emerald-600/70 dark:text-emerald-400/70 mt-2 bg-emerald-500/10 w-fit px-2.5 py-1 rounded-md">uptime</div>
                    </div>
                </Card>

                {/* 6. Overview (5x2) */}
                <Card className={`md:col-span-5 lg:col-span-5 md:row-span-2 ${bentoCardClass} p-8 flex flex-col`} style={{ animation: "fade-in 0.5s ease-out 0.3s both, slide-in-from-bottom-8 0.5s ease-out 0.3s both" }}>
                    <CardHeader className="p-0 mb-8">
                        <CardTitle className="text-2xl font-extrabold tracking-tight">Operational Capacity</CardTitle>
                        <CardDescription className="text-base mt-1">Real-time visual breakdown of active operations</CardDescription>
                    </CardHeader>
                    <CardContent className="p-0 flex-1 flex flex-col justify-center gap-12">
                        {/* Projects Progress */}
                        <div className="space-y-4">
                            <div className="flex justify-between items-end">
                                <div>
                                    <h4 className="font-bold text-lg text-foreground/90">Active Projects</h4>
                                    <p className="text-sm text-muted-foreground mt-0.5">{activeProjects} of {projects.length} total projects are currently active</p>
                                </div>
                                <span className="text-4xl font-black text-blue-500 tracking-tighter">{activePercent}%</span>
                            </div>
                            <div className="h-5 w-full rounded-full bg-muted/50 overflow-hidden shadow-inner">
                                <div
                                    className="h-full rounded-full bg-gradient-to-r from-blue-400 to-blue-600 shadow-md transition-all duration-1000 ease-out relative"
                                    style={{ width: `${activePercent}%` }}
                                >
                                    <div className="absolute inset-0 bg-white/20 w-full h-full" style={{ backgroundImage: 'linear-gradient(45deg,rgba(255,255,255,.15) 25%,transparent 25%,transparent 50%,rgba(255,255,255,.15) 50%,rgba(255,255,255,.15) 75%,transparent 75%,transparent)', backgroundSize: '1rem 1rem' }} />
                                </div>
                            </div>
                        </div>

                        {/* Stores Progress */}
                        <div className="space-y-4">
                            <div className="flex justify-between items-end">
                                <div>
                                    <h4 className="font-bold text-lg text-foreground/90">Operational Stores</h4>
                                    <p className="text-sm text-muted-foreground mt-0.5">{operationalStores} of {stores.length} total stores are fully operational</p>
                                </div>
                                <span className="text-4xl font-black text-orange-500 tracking-tighter">{opStorePercent}%</span>
                            </div>
                            <div className="h-5 w-full rounded-full bg-muted/50 overflow-hidden shadow-inner">
                                <div
                                    className="h-full rounded-full bg-gradient-to-r from-orange-400 to-orange-600 shadow-md transition-all duration-1000 delay-300 ease-out relative"
                                    style={{ width: `${opStorePercent}%` }}
                                >
                                    <div className="absolute inset-0 bg-white/20 w-full h-full" style={{ backgroundImage: 'linear-gradient(45deg,rgba(255,255,255,.15) 25%,transparent 25%,transparent 50%,rgba(255,255,255,.15) 50%,rgba(255,255,255,.15) 75%,transparent 75%,transparent)', backgroundSize: '1rem 1rem' }} />
                                </div>
                            </div>
                        </div>
                    </CardContent>
                </Card>

                {/* 7. Activity Feed (3x2) */}
                <Card className={`md:col-span-3 lg:col-span-3 md:row-span-2 ${bentoCardClass} flex flex-col`} style={{ animation: "fade-in 0.5s ease-out 0.35s both, slide-in-from-bottom-8 0.5s ease-out 0.35s both" }}>
                    <CardHeader className="pb-6 pt-8 px-8">
                        <CardTitle className="flex items-center gap-3 text-xl font-extrabold tracking-tight">
                            <ClockIcon className="size-6 text-primary" />
                            Recent Activity
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="flex-1 overflow-auto px-8 pb-8">
                        <div className="space-y-6">
                            {recentActivity.length > 0 ? recentActivity.map((item, index) => (
                                <div key={item.id} className="flex gap-5 group">
                                    <div className="relative mt-1 flex flex-col items-center">
                                        <div className={`size-3.5 rounded-full shrink-0 shadow-sm ring-4 ring-background z-10 ${
                                            item.type === 'project' ? 'bg-blue-500' : 
                                            item.type === 'store' ? 'bg-orange-500' : 'bg-purple-500'
                                        }`} />
                                        {index !== recentActivity.length - 1 && (
                                            <div className="w-0.5 h-[calc(100%+24px)] bg-border/60 absolute top-3.5" />
                                        )}
                                    </div>
                                    <div className="flex flex-col pb-2">
                                        <p className="text-sm font-semibold leading-none text-foreground/90">{item.label}</p>
                                        <time className="text-xs font-medium text-muted-foreground mt-2">{timeAgo(item.date)}</time>
                                    </div>
                                </div>
                            )) : (
                                <div className="flex flex-col items-center justify-center h-full text-muted-foreground opacity-50 py-10">
                                    <ClockIcon className="size-12 mb-3" />
                                    <span className="text-sm font-medium">No recent activity</span>
                                </div>
                            )}
                        </div>
                    </CardContent>
                </Card>
            </div>
        </div>
    )
}
