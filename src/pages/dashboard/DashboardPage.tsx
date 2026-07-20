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
} from "lucide-react"
import { useState, useEffect } from "react"
import { Skeleton } from "@/components/ui/skeleton"

export function DashboardPage() {
    const [loading, setLoading] = useState(true);
    const [projects, setProjects] = useState<any[]>([]);
    const [stores, setStores] = useState<any[]>([]);
    const [users, setUsers] = useState<any[]>([]);
    
    useEffect(() => {
        const fetchData = async () => {
            try {
                const [projectsRes, storesRes, usersRes] = await Promise.all([
                    fetch("http://localhost:3000/api/projects").then(res => res.json()),
                    fetch("http://localhost:3000/api/stores").then(res => res.json()),
                    fetch("http://localhost:3000/api/users").then(res => res.json())
                ]);

                if (projectsRes.success) setProjects(projectsRes.data);
                if (storesRes.success) setStores(storesRes.data);
                if (usersRes.success) setUsers(usersRes.data);
            } catch (error) {
                console.error("Failed to fetch dashboard data", error);
            } finally {
                // Slight delay for dramatic staggered entrance effect
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
            <div className="flex flex-col gap-6 w-full max-w-7xl mx-auto">
                <div className="grid gap-4 md:grid-cols-4 lg:grid-cols-8 auto-rows-[minmax(140px,auto)]">
                    <Skeleton className="md:col-span-4 lg:col-span-4 md:row-span-2 rounded-2xl" />
                    <Skeleton className="md:col-span-2 lg:col-span-2 rounded-2xl" />
                    <Skeleton className="md:col-span-2 lg:col-span-2 rounded-2xl" />
                    <Skeleton className="md:col-span-2 lg:col-span-2 rounded-2xl" />
                    <Skeleton className="md:col-span-2 lg:col-span-2 rounded-2xl" />
                    <Skeleton className="md:col-span-5 lg:col-span-5 md:row-span-2 rounded-2xl min-h-[300px]" />
                    <Skeleton className="md:col-span-3 lg:col-span-3 md:row-span-2 rounded-2xl min-h-[300px]" />
                </div>
            </div>
        )
    }

    const activePercent = projects.length > 0 ? Math.round((activeProjects / projects.length) * 100) : 0;
    const opStorePercent = stores.length > 0 ? Math.round((operationalStores / stores.length) * 100) : 0;

    const bentoCardClass = "rounded-2xl border border-border/40 bg-card/60 backdrop-blur-sm shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all duration-300 ease-out overflow-hidden";

    return (
        <div>
            {/* Bento Grid */}
            <div className="pt-5 grid gap-4 md:grid-cols-4 lg:grid-cols-8 auto-rows-[minmax(160px,auto)]">
                
                {/* 1. Hero Card (4x2) */}
                <Card className={`md:col-span-4 lg:col-span-4 md:row-span-2 bg-gradient-to-br from-primary/10 via-background to-primary/5 border-primary/20 ${bentoCardClass} flex flex-col justify-between`} style={{ animation: "fade-in 0.5s ease-out 0s both, slide-in-from-bottom-8 0.5s ease-out 0s both" }}>
                    <CardHeader className="pb-0">
                        <div className="size-12 rounded-xl bg-primary/20 flex items-center justify-center mb-4 text-primary">
                            <BuildingIcon className="size-6" />
                        </div>
                        <CardTitle className="text-3xl font-bold tracking-tight text-foreground">Welcome to L&T Portal</CardTitle>
                        <CardDescription className="text-base mt-2 max-w-sm">
                            Manage your enterprise projects, store inventories, and personnel all from one centralized command center.
                        </CardDescription>
                    </CardHeader>
                    <CardContent className="pt-6 pb-6">
                        <div className="flex items-center gap-4">
                            <div className="px-4 py-2 rounded-full bg-primary/10 text-primary text-sm font-semibold flex items-center gap-2 border border-primary/20">
                                <CheckCircle2Icon className="size-4" /> System Online
                            </div>
                        </div>
                    </CardContent>
                </Card>

                {/* 2. Total Projects (2x1) */}
                <Card className={`md:col-span-2 lg:col-span-2 ${bentoCardClass} flex flex-col justify-between p-6`} style={{ animation: "fade-in 0.5s ease-out 0.1s both, slide-in-from-bottom-8 0.5s ease-out 0.1s both" }}>
                    <div className="flex items-start justify-between">
                        <div className="text-muted-foreground font-medium text-sm">Total Projects</div>
                        <div className="p-2 bg-blue-50 dark:bg-blue-900/20 text-blue-500 rounded-lg">
                            <FolderIcon className="size-4" />
                        </div>
                    </div>
                    <div>
                        <div className="text-4xl font-extrabold tracking-tighter mt-4">{projects.length}</div>
                        <div className="text-xs font-medium text-blue-500 mt-2">{activeProjects} active</div>
                    </div>
                </Card>

                {/* 3. Total Stores (2x1) */}
                <Card className={`md:col-span-2 lg:col-span-2 ${bentoCardClass} flex flex-col justify-between p-6`} style={{ animation: "fade-in 0.5s ease-out 0.15s both, slide-in-from-bottom-8 0.5s ease-out 0.15s both" }}>
                    <div className="flex items-start justify-between">
                        <div className="text-muted-foreground font-medium text-sm">Total Stores</div>
                        <div className="p-2 bg-orange-50 dark:bg-orange-900/20 text-orange-500 rounded-lg">
                            <StoreIcon className="size-4" />
                        </div>
                    </div>
                    <div>
                        <div className="text-4xl font-extrabold tracking-tighter mt-4">{stores.length}</div>
                        <div className="text-xs font-medium text-orange-500 mt-2">{operationalStores} operational</div>
                    </div>
                </Card>

                {/* 4. Active Users (2x1) */}
                <Card className={`md:col-span-2 lg:col-span-2 ${bentoCardClass} flex flex-col justify-between p-6`} style={{ animation: "fade-in 0.5s ease-out 0.2s both, slide-in-from-bottom-8 0.5s ease-out 0.2s both" }}>
                    <div className="flex items-start justify-between">
                        <div className="text-muted-foreground font-medium text-sm">Active Users</div>
                        <div className="p-2 bg-purple-50 dark:bg-purple-900/20 text-purple-500 rounded-lg">
                            <UsersIcon className="size-4" />
                        </div>
                    </div>
                    <div>
                        <div className="text-4xl font-extrabold tracking-tighter mt-4">{users.length}</div>
                        <div className="text-xs font-medium text-muted-foreground mt-2">registered</div>
                    </div>
                </Card>

                {/* 5. Health (2x1) */}
                <Card className={`md:col-span-2 lg:col-span-2 ${bentoCardClass} flex flex-col justify-between p-6`} style={{ animation: "fade-in 0.5s ease-out 0.25s both, slide-in-from-bottom-8 0.5s ease-out 0.25s both" }}>
                    <div className="flex items-start justify-between">
                        <div className="text-muted-foreground font-medium text-sm">System Health</div>
                        <div className="p-2 bg-green-50 dark:bg-green-900/20 text-green-500 rounded-lg">
                            <ActivityIcon className="size-4" />
                        </div>
                    </div>
                    <div>
                        <div className="text-4xl font-extrabold tracking-tighter text-green-500 dark:text-green-400 mt-4">99.9%</div>
                        <div className="text-xs font-medium text-muted-foreground mt-2">uptime</div>
                    </div>
                </Card>

                {/* 6. Overview (5x2) */}
                <Card className={`md:col-span-5 lg:col-span-5 md:row-span-2 ${bentoCardClass} p-6 flex flex-col`} style={{ animation: "fade-in 0.5s ease-out 0.3s both, slide-in-from-bottom-8 0.5s ease-out 0.3s both" }}>
                    <CardHeader className="p-0 mb-6">
                        <CardTitle className="text-xl font-bold">Operational Capacity</CardTitle>
                        <CardDescription>Real-time visual breakdown of active operations</CardDescription>
                    </CardHeader>
                    <CardContent className="p-0 flex-1 flex flex-col justify-center gap-10">
                        {/* Projects Progress */}
                        <div className="space-y-3">
                            <div className="flex justify-between items-end">
                                <div>
                                    <h4 className="font-semibold text-lg">Active Projects</h4>
                                    <p className="text-xs text-muted-foreground">{activeProjects} of {projects.length} total projects are currently active</p>
                                </div>
                                <span className="text-3xl font-bold text-blue-500">{activePercent}%</span>
                            </div>
                            <div className="h-4 w-full rounded-full bg-muted overflow-hidden">
                                <div
                                    className="h-full rounded-full bg-gradient-to-r from-blue-400 to-blue-600 transition-all duration-1000 ease-out"
                                    style={{ width: `${activePercent}%` }}
                                />
                            </div>
                        </div>

                        {/* Stores Progress */}
                        <div className="space-y-3">
                            <div className="flex justify-between items-end">
                                <div>
                                    <h4 className="font-semibold text-lg">Operational Stores</h4>
                                    <p className="text-xs text-muted-foreground">{operationalStores} of {stores.length} total stores are fully operational</p>
                                </div>
                                <span className="text-3xl font-bold text-orange-500">{opStorePercent}%</span>
                            </div>
                            <div className="h-4 w-full rounded-full bg-muted overflow-hidden">
                                <div
                                    className="h-full rounded-full bg-gradient-to-r from-orange-400 to-orange-600 transition-all duration-1000 delay-300 ease-out"
                                    style={{ width: `${opStorePercent}%` }}
                                />
                            </div>
                        </div>
                    </CardContent>
                </Card>

                {/* 7. Activity Feed (3x2) */}
                <Card className={`md:col-span-3 lg:col-span-3 md:row-span-2 ${bentoCardClass} flex flex-col`} style={{ animation: "fade-in 0.5s ease-out 0.35s both, slide-in-from-bottom-8 0.5s ease-out 0.35s both" }}>
                    <CardHeader className="pb-4">
                        <CardTitle className="flex items-center gap-2 text-lg font-bold">
                            <ClockIcon className="size-5 text-muted-foreground" />
                            Recent Activity
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="flex-1 overflow-auto">
                        <div className="space-y-5">
                            {recentActivity.length > 0 ? recentActivity.map((item, index) => (
                                <div key={item.id} className="flex gap-4 group">
                                    <div className="relative mt-1 flex flex-col items-center">
                                        <div className={`size-3 rounded-full shrink-0 shadow-sm ${
                                            item.type === 'project' ? 'bg-blue-500' : 
                                            item.type === 'store' ? 'bg-orange-500' : 'bg-purple-500'
                                        }`} />
                                        {index !== recentActivity.length - 1 && (
                                            <div className="w-px h-full bg-border/60 absolute top-4" />
                                        )}
                                    </div>
                                    <div className="flex flex-col pb-1">
                                        <p className="text-sm font-medium leading-none text-foreground">{item.label}</p>
                                        <time className="text-xs text-muted-foreground mt-1.5">{timeAgo(item.date)}</time>
                                    </div>
                                </div>
                            )) : (
                                <div className="text-center py-8 text-muted-foreground text-sm">
                                    No recent activity found.
                                </div>
                            )}
                        </div>
                    </CardContent>
                </Card>
            </div>
        </div>
    )
}
