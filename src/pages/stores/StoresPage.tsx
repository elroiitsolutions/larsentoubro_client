import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { PlusIcon, StoreIcon, SearchIcon, MapPinIcon } from "lucide-react"

const storeStatusColors: Record<string, string> = {
    Operational: "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400",
    Closed: "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400",
    Renovation: "bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400",
    "New Setup": "bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400",
}

const stores = [
    {
        id: "STR-001",
        name: "Mumbai Central Depot",
        location: "Mumbai, Maharashtra",
        manager: "Dinesh Patil",
        status: "Operational",
        inventory: 2840,
        lastAudit: "10 Jul 2026",
    },
    {
        id: "STR-002",
        name: "Delhi North Warehouse",
        location: "New Delhi, Delhi",
        manager: "Priya Kapoor",
        status: "Operational",
        inventory: 5120,
        lastAudit: "5 Jul 2026",
    },
    {
        id: "STR-003",
        name: "Chennai Hub",
        location: "Chennai, Tamil Nadu",
        manager: "Karthik R.",
        status: "Renovation",
        inventory: 980,
        lastAudit: "28 Jun 2026",
    },
    {
        id: "STR-004",
        name: "Pune West Store",
        location: "Pune, Maharashtra",
        manager: "Sneha More",
        status: "Operational",
        inventory: 3200,
        lastAudit: "12 Jul 2026",
    },
    {
        id: "STR-005",
        name: "Hyderabad Depot",
        location: "Hyderabad, Telangana",
        manager: "Ramesh Naidu",
        status: "New Setup",
        inventory: 0,
        lastAudit: "—",
    },
    {
        id: "STR-006",
        name: "Ahmedabad Store",
        location: "Ahmedabad, Gujarat",
        manager: "Hitesh Shah",
        status: "Closed",
        inventory: 0,
        lastAudit: "1 Jun 2026",
    },
]

export function StoresPage() {
    return (
        <div className="flex flex-col gap-6">
            <div className="flex items-center justify-between">
                <div>
                    <h2 className="text-2xl font-semibold tracking-tight">Stores</h2>
                    <p className="text-muted-foreground text-sm mt-1">
                        View and manage all depot and warehouse locations.
                    </p>
                </div>
                <Button className="gap-2">
                    <PlusIcon className="size-4" />
                    Add Store
                </Button>
            </div>

            {/* Stats */}
            <div className="grid gap-4 sm:grid-cols-4">
                {[
                    { label: "Total Stores", value: "6", color: "text-foreground" },
                    { label: "Operational", value: "3", color: "text-green-600" },
                    { label: "Renovation", value: "1", color: "text-orange-600" },
                    { label: "Closed", value: "1", color: "text-red-600" },
                ].map((s) => (
                    <Card key={s.label} className="py-4">
                        <CardContent className="flex flex-col items-center text-center px-4">
                            <span className={`text-3xl font-bold ${s.color}`}>{s.value}</span>
                            <span className="text-xs text-muted-foreground mt-1">{s.label}</span>
                        </CardContent>
                    </Card>
                ))}
            </div>

            {/* Stores table */}
            <Card>
                <CardHeader className="flex flex-row items-center gap-4">
                    <div className="flex-1">
                        <CardTitle className="flex items-center gap-2 text-base">
                            <StoreIcon className="size-4 text-muted-foreground" />
                            All Stores
                        </CardTitle>
                        <CardDescription>Inventory and location overview</CardDescription>
                    </div>
                    <div className="relative w-56">
                        <SearchIcon className="absolute left-2.5 top-2.5 size-3.5 text-muted-foreground" />
                        <Input placeholder="Search stores..." className="pl-8 h-8 text-sm" />
                    </div>
                </CardHeader>
                <CardContent className="p-0">
                    <div className="overflow-x-auto">
                        <table className="w-full text-sm">
                            <thead>
                                <tr className="border-b bg-muted/40">
                                    <th className="text-left px-6 py-3 font-medium text-muted-foreground">ID</th>
                                    <th className="text-left px-6 py-3 font-medium text-muted-foreground">Store Name</th>
                                    <th className="text-left px-6 py-3 font-medium text-muted-foreground">Location</th>
                                    <th className="text-left px-6 py-3 font-medium text-muted-foreground">Manager</th>
                                    <th className="text-left px-6 py-3 font-medium text-muted-foreground">Status</th>
                                    <th className="text-left px-6 py-3 font-medium text-muted-foreground">Inventory</th>
                                    <th className="text-left px-6 py-3 font-medium text-muted-foreground">Last Audit</th>
                                </tr>
                            </thead>
                            <tbody>
                                {stores.map((s, i) => (
                                    <tr
                                        key={s.id}
                                        className={`border-b last:border-0 hover:bg-muted/30 cursor-pointer transition-colors ${i % 2 === 0 ? "" : "bg-muted/10"
                                            }`}
                                    >
                                        <td className="px-6 py-3 font-mono text-xs text-muted-foreground">{s.id}</td>
                                        <td className="px-6 py-3 font-medium">{s.name}</td>
                                        <td className="px-6 py-3">
                                            <span className="flex items-center gap-1 text-muted-foreground">
                                                <MapPinIcon className="size-3" />
                                                {s.location}
                                            </span>
                                        </td>
                                        <td className="px-6 py-3">{s.manager}</td>
                                        <td className="px-6 py-3">
                                            <span
                                                className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${storeStatusColors[s.status]}`}
                                            >
                                                {s.status}
                                            </span>
                                        </td>
                                        <td className="px-6 py-3 font-medium">
                                            {s.inventory > 0 ? s.inventory.toLocaleString() : "—"}
                                        </td>
                                        <td className="px-6 py-3 text-muted-foreground">{s.lastAudit}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </CardContent>
            </Card>
        </div>
    )
}
