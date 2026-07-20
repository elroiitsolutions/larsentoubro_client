import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { PlusIcon, StoreIcon, SearchIcon, MapPinIcon, EditIcon, TrashIcon, ArrowLeftIcon, Loader2 } from "lucide-react"
import { useState, useEffect } from "react"
import { useParams, useNavigate } from "react-router-dom"
import { DynamicFormSheet } from "@/components/DynamicFormSheet"
import { toast } from "sonner"

const storeStatusColors: Record<string, string> = {
    Operational: "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400",
    Closed: "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400",
    Renovation: "bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400",
    "New Setup": "bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400",
}



export function StoresPage() {
    const { projectId } = useParams();
    const navigate = useNavigate();
    const [isFormOpen, setIsFormOpen] = useState(false);
    const [editingStore, setEditingStore] = useState<any>(null);
    const [stores, setStores] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    const fetchStores = async () => {
        setLoading(true);
        try {
            const url = projectId ? `http://localhost:3000/api/stores?projectId=${projectId}` : "http://localhost:3000/api/stores";
            const res = await fetch(url);
            const data = await res.json();
            if (data.success) {
                setStores(data.data);
            }
        } catch (error) {
            console.error(error);
            toast.error("Failed to fetch stores");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchStores();
    }, [projectId]);

    const handleDelete = async (id: string) => {
        if (!confirm("Are you sure you want to delete this store?")) return;
        try {
            const res = await fetch(`http://localhost:3000/api/stores/${id}`, { method: 'DELETE' });
            const data = await res.json();
            if (data.success) {
                toast.success("Store deleted");
                fetchStores();
            } else {
                toast.error("Failed to delete store");
            }
        } catch (error) {
            toast.error("An error occurred");
        }
    };

    return (
        <div className="flex flex-col gap-6">
            <div className="flex items-center justify-end pt-3">
                {/* <div className="flex items-center gap-4">
                    {projectId && (
                        <Button variant="outline" size="icon" onClick={() => navigate("/projects")}>
                            <ArrowLeftIcon className="size-4" />
                        </Button>
                    )}
                    <div>
                        <h1 className="text-2xl font-bold tracking-tight">Stores {projectId ? `for ${projectId}` : ""}</h1>
                    </div>
                </div> */}
                <Button className="gap-2" onClick={() => { setEditingStore(null); setIsFormOpen(true); }}>
                    <PlusIcon className="size-4" />
                    Add Store
                </Button>
            </div>

            <DynamicFormSheet 
                isOpen={isFormOpen} 
                onClose={() => setIsFormOpen(false)} 
                formSlug="create-store"
                submitEndpoint={editingStore ? `http://localhost:3000/api/stores/${editingStore._id}` : "http://localhost:3000/api/stores"}
                submitMethod={editingStore ? "PUT" : "POST"}
                onSubmitSuccess={() => {
                    toast.success(editingStore ? "Store updated successfully!" : "Store created successfully!");
                    fetchStores();
                }} 
                additionalData={projectId ? { projectId } : undefined}
                defaultValues={editingStore ? { ...editingStore, storeName: editingStore.name } : undefined}
            />

            {/* Stats */}
            <div className="grid gap-4 sm:grid-cols-4">
                {[
                    { label: "Total Stores", value: stores.length.toString(), color: "text-foreground" },
                    { label: "Operational", value: stores.filter(s => s.status === 'Operational').length.toString(), color: "text-green-600" },
                    { label: "Renovation", value: stores.filter(s => s.status === 'Renovation').length.toString(), color: "text-orange-600" },
                    { label: "Closed", value: stores.filter(s => s.status === 'Closed').length.toString(), color: "text-red-600" },
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
                                    <th className="text-left px-6 py-3 font-medium text-muted-foreground">Project Name</th>
                                    <th className="text-left px-6 py-3 font-medium text-muted-foreground">Location</th>
                                    <th className="text-left px-6 py-3 font-medium text-muted-foreground">Manager</th>
                                    <th className="text-left px-6 py-3 font-medium text-muted-foreground">Status</th>
                                    <th className="text-left px-6 py-3 font-medium text-muted-foreground">Inventory</th>
                                    <th className="text-left px-6 py-3 font-medium text-muted-foreground">Last Audit</th>
                                    <th className="text-right px-6 py-3 font-medium text-muted-foreground w-24">Actions</th>
                                </tr>
                            </thead>
                            <tbody>
                                {loading ? (
                                    <tr>
                                        <td colSpan={9} className="px-6 py-8 text-center text-muted-foreground">
                                            <Loader2 className="size-6 animate-spin mx-auto mb-2" />
                                            Loading stores...
                                        </td>
                                    </tr>
                                ) : stores.length === 0 ? (
                                    <tr>
                                        <td colSpan={9} className="px-6 py-8 text-center text-muted-foreground">
                                            No stores found.
                                        </td>
                                    </tr>
                                ) : stores.map((s, i) => (
                                    <tr
                                        key={s._id}
                                        onClick={() => navigate(`/stores/${s._id}/tools`)}
                                        className={`border-b last:border-0 hover:bg-muted/30 cursor-pointer transition-colors ${i % 2 === 0 ? "" : "bg-muted/10"
                                            }`}
                                    >
                                        <td className="px-6 py-3 font-mono text-xs text-muted-foreground">{s._id.substring(s._id.length - 6)}</td>
                                        <td className="px-6 py-3 font-medium">{s.name}</td>
                                        <td className="px-6 py-3 text-muted-foreground">{s.projectName}</td>
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
                                        <td className="px-6 py-3 text-right">
                                            <div className="flex items-center justify-end gap-2">
                                                <Button variant="ghost" size="icon" className="size-8" onClick={(e) => { e.stopPropagation(); setEditingStore(s); setIsFormOpen(true); }}>
                                                    <EditIcon className="size-4 text-muted-foreground" />
                                                </Button>
                                                <Button variant="ghost" size="icon" className="size-8 hover:text-red-600" onClick={(e) => { e.stopPropagation(); handleDelete(s._id); }}>
                                                    <TrashIcon className="size-4 text-muted-foreground" />
                                                </Button>
                                            </div>
                                        </td>
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
