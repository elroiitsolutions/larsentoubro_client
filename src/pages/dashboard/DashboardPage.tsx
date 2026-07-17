import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from "@/components/ui/card"
import {
    LayoutDashboardIcon,
    UsersIcon,
    TrendingUpIcon,
    ActivityIcon,
} from "lucide-react"

const stats = [
    {
        title: "Total Projects",
        value: "128",
        change: "+12% from last month",
        icon: <LayoutDashboardIcon className="size-5 text-muted-foreground" />,
    },
    {
        title: "Active Users",
        value: "3,842",
        change: "+4.3% from last week",
        icon: <UsersIcon className="size-5 text-muted-foreground" />,
    },
    {
        title: "Revenue",
        value: "₹24.6L",
        change: "+18.2% from last quarter",
        icon: <TrendingUpIcon className="size-5 text-muted-foreground" />,
    },
    {
        title: "Uptime",
        value: "99.9%",
        change: "Last 30 days",
        icon: <ActivityIcon className="size-5 text-muted-foreground" />,
    },
]

export function DashboardPage() {
    return (
        <div className="flex flex-col gap-6">
            {/* Page header */}
            <div>
                <h2 className="text-2xl font-semibold tracking-tight">Welcome back 👋</h2>
                <p className="text-muted-foreground text-sm mt-1">
                    Here's what's happening across your enterprise today.
                </p>
            </div>

            {/* Stats grid */}
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                {stats.map((stat) => (
                    <Card key={stat.title}>
                        <CardHeader className="flex flex-row items-center justify-between pb-2">
                            <CardTitle className="text-sm font-medium text-muted-foreground">
                                {stat.title}
                            </CardTitle>
                            {stat.icon}
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold">{stat.value}</div>
                            <p className="text-xs text-muted-foreground mt-1">{stat.change}</p>
                        </CardContent>
                    </Card>
                ))}
            </div>

            {/* Recent activity placeholder */}
            <div className="grid gap-4 md:grid-cols-2">
                <Card className="col-span-2 md:col-span-1">
                    <CardHeader>
                        <CardTitle>Recent Activity</CardTitle>
                        <CardDescription>Latest updates from your projects</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <div className="space-y-4">
                            {[
                                { label: "Project Alpha deployed", sub: "2 minutes ago" },
                                { label: "New team member added", sub: "1 hour ago" },
                                { label: "Monthly report generated", sub: "3 hours ago" },
                                { label: "System maintenance completed", sub: "Yesterday" },
                            ].map((item) => (
                                <div key={item.label} className="flex items-start gap-3">
                                    <span className="mt-1.5 h-2 w-2 shrink-0 rounded-full bg-primary" />
                                    <div>
                                        <p className="text-sm font-medium leading-none">{item.label}</p>
                                        <p className="text-xs text-muted-foreground mt-0.5">{item.sub}</p>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </CardContent>
                </Card>

                <Card className="col-span-2 md:col-span-1">
                    <CardHeader>
                        <CardTitle>Quick Overview</CardTitle>
                        <CardDescription>Project status at a glance</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <div className="space-y-4">
                            {[
                                { name: "Infrastructure", progress: 85 },
                                { name: "Product Dev", progress: 62 },
                                { name: "HR Onboarding", progress: 91 },
                                { name: "Compliance", progress: 45 },
                            ].map((item) => (
                                <div key={item.name} className="space-y-1.5">
                                    <div className="flex justify-between text-sm">
                                        <span className="font-medium">{item.name}</span>
                                        <span className="text-muted-foreground">{item.progress}%</span>
                                    </div>
                                    <div className="h-2 w-full rounded-full bg-muted overflow-hidden">
                                        <div
                                            className="h-full rounded-full bg-primary transition-all"
                                            style={{ width: `${item.progress}%` }}
                                        />
                                    </div>
                                </div>
                            ))}
                        </div>
                    </CardContent>
                </Card>
            </div>
        </div>
    )
}
