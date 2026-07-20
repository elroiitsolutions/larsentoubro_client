import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import {
    WrenchIcon,
    CalculatorIcon,
    FileTextIcon,
    BarChart2Icon,
    DatabaseIcon,
    ShieldCheckIcon,
    ClipboardListIcon,
    ArrowRightIcon,
    MapPinIcon,
    ScanLineIcon,
} from "lucide-react"

const toolCategories = [
    {
        category: "Engineering",
        tools: [
            {
                name: "Load Calculator",
                description: "Calculate structural load bearing capacity for civil projects.",
                icon: <CalculatorIcon className="size-5" />,
                tag: "Civil",
                tagColor: "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400",
                status: "Available",
            },
            {
                name: "Material Estimator",
                description: "Estimate raw material quantities and cost for construction projects.",
                icon: <ClipboardListIcon className="size-5" />,
                tag: "Construction",
                tagColor: "bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400",
                status: "Available",
            },
            {
                name: "Site Survey Tool",
                description: "Log and manage site survey data with geo-tagging support.",
                icon: <MapPinIcon className="size-5" />,
                tag: "Surveying",
                tagColor: "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400",
                status: "Beta",
            },
        ],
    },
    {
        category: "Reports & Analytics",
        tools: [
            {
                name: "Report Generator",
                description: "Generate PDF and Excel reports from project data in one click.",
                icon: <FileTextIcon className="size-5" />,
                tag: "Reports",
                tagColor: "bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400",
                status: "Available",
            },
            {
                name: "Analytics Dashboard",
                description: "Visualize KPIs, trends, and cross-project performance metrics.",
                icon: <BarChart2Icon className="size-5" />,
                tag: "Analytics",
                tagColor: "bg-indigo-100 text-indigo-700 dark:bg-indigo-900/30 dark:text-indigo-400",
                status: "Available",
            },
            {
                name: "Inventory Scanner",
                description: "Scan and update store inventory levels using barcode integration.",
                icon: <ScanLineIcon className="size-5" />,
                tag: "Inventory",
                tagColor: "bg-teal-100 text-teal-700 dark:bg-teal-900/30 dark:text-teal-400",
                status: "Coming Soon",
            },
        ],
    },
    {
        category: "Administration",
        tools: [
            {
                name: "Database Backup",
                description: "Schedule and download database snapshots for disaster recovery.",
                icon: <DatabaseIcon className="size-5" />,
                tag: "Admin",
                tagColor: "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400",
                status: "Available",
            },
            {
                name: "Compliance Checker",
                description: "Verify project compliance against L&T internal and regulatory standards.",
                icon: <ShieldCheckIcon className="size-5" />,
                tag: "Compliance",
                tagColor: "bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400",
                status: "Beta",
            },
            {
                name: "Maintenance Scheduler",
                description: "Plan and track preventive maintenance for equipment and assets.",
                icon: <WrenchIcon className="size-5" />,
                tag: "Operations",
                tagColor: "bg-gray-100 text-gray-700 dark:bg-gray-900/30 dark:text-gray-400",
                status: "Coming Soon",
            },
        ],
    },
]

const statusStyles: Record<string, string> = {
    Available: "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400",
    Beta: "bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400",
    "Coming Soon": "bg-muted text-muted-foreground",
}

export function ToolsPage() {
    return (
        <div className="flex flex-col gap-8">
            {/* Header */}
            <div>
                {/* Header removed */}
            </div>

            {/* Summary strip */}
            <div className="grid gap-4 sm:grid-cols-3">
                {[
                    { label: "Total Tools", value: "9", color: "text-foreground" },
                    { label: "Available", value: "4", color: "text-green-600" },
                    { label: "Beta / Coming Soon", value: "5", color: "text-yellow-600" },
                ].map((s) => (
                    <Card key={s.label} className="py-4">
                        <CardContent className="flex flex-col items-center text-center px-4">
                            <span className={`text-3xl font-bold ${s.color}`}>{s.value}</span>
                            <span className="text-xs text-muted-foreground mt-1">{s.label}</span>
                        </CardContent>
                    </Card>
                ))}
            </div>

            {/* Tool categories */}
            {toolCategories.map((cat) => (
                <div key={cat.category} className="flex flex-col gap-4">
                    <h3 className="text-sm font-semibold uppercase tracking-widest text-muted-foreground">
                        {cat.category}
                    </h3>
                    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                        {cat.tools.map((tool) => {
                            const isDisabled = tool.status === "Coming Soon"
                            return (
                                <Card
                                    key={tool.name}
                                    className={`flex flex-col transition-shadow hover:shadow-md ${isDisabled ? "opacity-60" : ""}`}
                                >
                                    <CardHeader className="pb-3">
                                        <div className="flex items-start justify-between gap-2">
                                            <div className="flex items-center gap-3">
                                                <div className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-muted text-muted-foreground">
                                                    {tool.icon}
                                                </div>
                                                <div>
                                                    <CardTitle className="text-sm leading-tight">{tool.name}</CardTitle>
                                                    <span
                                                        className={`mt-1 inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${tool.tagColor}`}
                                                    >
                                                        {tool.tag}
                                                    </span>
                                                </div>
                                            </div>
                                            <span
                                                className={`shrink-0 inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${statusStyles[tool.status]}`}
                                            >
                                                {tool.status}
                                            </span>
                                        </div>
                                    </CardHeader>
                                    <CardContent className="flex flex-1 flex-col justify-between gap-4">
                                        <CardDescription className="text-xs leading-relaxed">
                                            {tool.description}
                                        </CardDescription>
                                        <Button
                                            size="sm"
                                            variant={isDisabled ? "outline" : "default"}
                                            disabled={isDisabled}
                                            className="w-full gap-2"
                                        >
                                            {isDisabled ? "Notify Me" : "Launch Tool"}
                                            {!isDisabled && <ArrowRightIcon className="size-3.5" />}
                                        </Button>
                                    </CardContent>
                                </Card>
                            )
                        })}
                    </div>
                </div>
            ))}
        </div>
    )
}
