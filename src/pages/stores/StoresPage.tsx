import {
    Card,
    CardContent,
    CardHeader,
    CardTitle,
} from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { PlusIcon, StoreIcon, SearchIcon, MapPinIcon, EditIcon, TrashIcon, Loader2, ShieldAlertIcon } from "lucide-react"
import { useState, useEffect } from "react"
import { useParams, useNavigate, Navigate } from "react-router-dom"
import { DynamicFormSheet } from "@/components/DynamicFormSheet"
import storeService from "@/services/store.service"
import { useAuth } from "@/contexts/AuthContext"
import { toast } from "sonner"
import NoAccessPage from "../NoAccessPage"
import { ConfirmDialog } from "@/components/ConfirmDialog"

const storeStatusColors: Record<string, string> = {
    Operational: "bg-emerald-500/15 text-emerald-700 dark:text-emerald-400 border border-emerald-500/20",
    Closed: "bg-red-500/15 text-red-700 dark:text-red-400 border border-red-500/20",
    Renovation: "bg-orange-500/15 text-orange-700 dark:text-orange-400 border border-orange-500/20",
    "New Setup": "bg-purple-500/15 text-purple-700 dark:text-purple-400 border border-purple-500/20",
}

export function StoresPage() {
    const { projectId } = useParams();
    const navigate = useNavigate();

    // If accessed globally via /stores without a projectId, redirect to Projects
    if (!projectId) {
        return <Navigate to="/projects" replace />;
    }

    const { user } = useAuth();
    const [isFormOpen, setIsFormOpen] = useState(false);
    const [editingStore, setEditingStore] = useState<any>(null);
    const [deletingStore, setDeletingStore] = useState<{ id: string; name: string } | null>(null);
    const [stores, setStores] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState("");

    const filteredStores = stores.filter((s) => {
        if (!searchQuery.trim()) return true;
        const q = searchQuery.toLowerCase();
        return (
            (s.name && s.name.toLowerCase().includes(q)) ||
            (s.storeCode && s.storeCode.toLowerCase().includes(q)) ||
            (s.location && s.location.toLowerCase().includes(q)) ||
            (s.city && s.city.toLowerCase().includes(q)) ||
            (s.managerName && s.managerName.toLowerCase().includes(q)) ||
            (s._id && s._id.toLowerCase().includes(q))
        );
    });

    const assignedProjectIds = (user?.projects || []).map((p: any) => typeof p === 'object' ? p._id : p);
    const isProjectRestricted = Boolean(user && user.role !== "Admin" && user.role !== "Vendor" && projectId && !assignedProjectIds.includes(projectId));

    const fetchStores = async () => {
        if (isProjectRestricted) {
            setLoading(false);
            return;
        }
        setLoading(true);
        try {
            const data = await storeService.getStores(projectId);
            if (data.success) {
                setStores(data.data);
            }
        } catch (error: any) {
            console.error(error);
            const message = error?.response?.data?.message || "Failed to fetch stores";
            toast.error(message);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchStores();
    }, [projectId, user]);

    const handleDeleteStore = async (id: string) => {
        try {
            const data = await storeService.deleteStore(id);
            if (data.success) {
                toast.success("Store deleted");
                fetchStores();
            } else {
                toast.error(data.message || "Failed to delete store");
            }
        } catch (error: any) {
            console.error(error);
            const message = error?.response?.data?.message || "An error occurred";
            toast.error(message);
        }
    };

    const bentoCardClass = "rounded-[24px] border border-border/50 bg-card/40 backdrop-blur-md shadow-sm hover:shadow-lg transition-all duration-300 overflow-hidden";

    if (isProjectRestricted) {
        return (
            <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4 text-center p-6">
                <div className="p-4 rounded-2xl bg-destructive/10 text-destructive border border-destructive/20 shadow-xs">
                    <ShieldAlertIcon className="size-12" />
                </div>
                <h2 className="text-2xl font-extrabold tracking-tight">Access Restricted</h2>
                <p className="text-muted-foreground text-sm max-w-md">
                    You do not have permission to view Stores under this Project. Please contact your system Administrator if you require access.
                </p>
                <Button onClick={() => navigate("/projects")} className="mt-2 rounded-xl shadow-sm cursor-pointer">
                    Return to My Assigned Projects
                </Button>
            </div>
        );
    }

    const isPageRestricted = Boolean(
        user &&
        user.role !== "Admin" &&
        user.role !== "Vendor" &&
        (!user.allowedPages || !user.allowedPages.includes("/stores"))
    );

    if (isPageRestricted) {
        return <NoAccessPage />;
    }

    return (
        <div className="flex flex-col gap-6 w-full mx-auto p-2 pb-10">
            <div className="flex items-center justify-between pt-2">
                <div>
                    <h1 className="text-3xl font-extrabold tracking-tight">Stores {projectId ? `for ${projectId.substring(0, 6)}` : ""}</h1>
                    <p className="text-muted-foreground mt-1 text-sm">Inventory and location overview.</p>
                </div>
                {(!user || user.role === "Admin") && (
                    <Button className="gap-2 rounded-xl shadow-md cursor-pointer" size="lg" onClick={() => { setEditingStore(null); setIsFormOpen(true); }}>
                        <PlusIcon className="size-4" />
                        Add Store
                    </Button>
                )}
            </div>

            <DynamicFormSheet
                isOpen={isFormOpen}
                onClose={() => setIsFormOpen(false)}
                formSlug="create-store"
                submitEndpoint={editingStore ? `/stores/${editingStore._id}` : "/stores"}
                submitMethod={editingStore ? "PUT" : "POST"}
                onSubmitSuccess={() => {
                    toast.success(editingStore ? "Store updated successfully!" : "Store created successfully!");
                    fetchStores();
                }}
                additionalData={projectId ? { projectId } : undefined}
                defaultValues={editingStore ? { ...editingStore, storeName: editingStore.name } : undefined}
            />

            {/* Table card */}
            <Card className={`${bentoCardClass} flex flex-col mt-2`}>
                <CardHeader className="flex flex-row items-center gap-4 border-b border-border/50 bg-muted/20 px-6 py-5">
                    <div className="flex-1">
                        <CardTitle className="flex items-center gap-2 text-lg font-bold">
                            <StoreIcon className="size-5 text-primary" />
                            Store Locations
                        </CardTitle>
                    </div>
                    <div className="relative w-64">
                        <SearchIcon className="absolute left-3 top-2.5 size-4 text-muted-foreground" />
                        <Input
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            placeholder="Search stores..."
                            className="pl-9 h-9 rounded-xl border-border/50 bg-background/50 focus-visible:ring-primary/30"
                        />
                    </div>
                </CardHeader>
                <CardContent className="p-0">
                    {loading ? (
                        <div className="flex items-center justify-center py-12">
                            <Loader2 className="size-8 animate-spin text-primary" />
                        </div>
                    ) : filteredStores.length === 0 ? (
                        <div className="text-center py-12 text-muted-foreground">
                            <StoreIcon className="size-12 mx-auto mb-3 opacity-50" />
                            <p className="font-medium">No stores found.</p>
                        </div>
                    ) : (
                        <div className="overflow-x-auto">
                            <table className="w-full text-sm">
                                <thead>
                                    <tr className="border-b border-border/50 bg-muted/10">
                                        <th className="text-left px-6 py-4 font-semibold text-muted-foreground uppercase text-[11px] tracking-wider">Store ID</th>
                                        <th className="text-left px-6 py-4 font-semibold text-muted-foreground uppercase text-[11px] tracking-wider">Store Name</th>
                                        <th className="text-left px-6 py-4 font-semibold text-muted-foreground uppercase text-[11px] tracking-wider">Location</th>
                                        <th className="text-left px-6 py-4 font-semibold text-muted-foreground uppercase text-[11px] tracking-wider">Manager</th>
                                        <th className="text-left px-6 py-4 font-semibold text-muted-foreground uppercase text-[11px] tracking-wider">Status</th>
                                        <th className="text-right px-6 py-4 font-semibold text-muted-foreground uppercase text-[11px] tracking-wider">Actions</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {filteredStores.map((store) => (
                                        <tr
                                            key={store._id}
                                            className="border-b border-border/40 last:border-0 hover:bg-muted/60 transition-colors group cursor-pointer"
                                            onClick={() => {
                                                if (projectId) {
                                                    navigate(`/stores/${store._id}/tools`, {
                                                        state: {
                                                            breadcrumbs: [
                                                                { label: 'Projects', href: '/projects' },
                                                                { label: 'Stores', href: `/projects/${projectId}/stores` },
                                                                { label: 'Tools', href: `/stores/${store._id}/tools` }
                                                            ]
                                                        }
                                                    });
                                                } else {
                                                    navigate(`/stores/${store._id}/tools`);
                                                }
                                            }}
                                        >
                                            <td className="px-6 py-4 font-mono font-medium text-xs text-muted-foreground">{store.storeCode || store._id.substring(0, 8)}</td>
                                            <td className="px-6 py-4 font-bold text-foreground">
                                                {store.name}
                                                {store.type && <span className="ml-2 inline-flex items-center rounded-md bg-secondary px-2 py-0.5 text-[10px] font-medium text-secondary-foreground">{store.type}</span>}
                                            </td>
                                            <td className="px-6 py-4 text-muted-foreground">
                                                <div className="flex items-center gap-1.5">
                                                    <MapPinIcon className="size-3.5 text-muted-foreground/70" />
                                                    <span>{store.location || store.city || "N/A"}</span>
                                                </div>
                                            </td>
                                            <td className="px-6 py-4 font-medium">{store.managerName || "Unassigned"}</td>
                                            <td className="px-6 py-4">
                                                <span className={`inline-flex items-center rounded-md px-2.5 py-1 text-xs font-semibold shadow-sm ${storeStatusColors[store.status] || "bg-gray-100 text-gray-700"}`}>
                                                    {store.status || "Operational"}
                                                </span>
                                            </td>
                                            <td
                                                className="px-6 py-4 text-right"
                                                onClick={(e) => e.stopPropagation()}
                                            >
                                                <div className="flex items-center justify-end gap-2">
                                                    <Button
                                                        variant="ghost"
                                                        size="sm"
                                                        className="h-8 px-2.5 text-xs font-semibold hover:bg-primary/10 hover:text-primary cursor-pointer"
                                                        onClick={(e) => {
                                                            e.stopPropagation();
                                                            if (projectId) {
                                                                navigate(`/stores/${store._id}/tools`, {
                                                                    state: {
                                                                        breadcrumbs: [
                                                                            { label: 'Projects', href: '/projects' },
                                                                            { label: 'Stores', href: `/projects/${projectId}/stores` },
                                                                            { label: 'Tools', href: `/stores/${store._id}/tools` }
                                                                        ]
                                                                    }
                                                                });
                                                            } else {
                                                                navigate(`/stores/${store._id}/tools`);
                                                            }
                                                        }}
                                                    >
                                                        Tools ({store.toolsCount || 0})
                                                    </Button>
                                                    {(!user || user.role === "Admin") && (
                                                        <>
                                                            <Button
                                                                variant="ghost"
                                                                size="sm"
                                                                className="h-8 w-8 p-0 text-muted-foreground hover:bg-muted hover:text-foreground cursor-pointer"
                                                                onClick={(e) => {
                                                                    e.stopPropagation();
                                                                    setEditingStore(store);
                                                                    setIsFormOpen(true);
                                                                }}
                                                            >
                                                                <EditIcon className="size-4" />
                                                            </Button>
                                                            <Button
                                                                variant="ghost"
                                                                size="sm"
                                                                className="h-8 w-8 p-0 text-muted-foreground hover:bg-destructive/10 hover:text-destructive cursor-pointer"
                                                                onClick={(e) => {
                                                                    e.stopPropagation();
                                                                    setDeletingStore({ id: store._id, name: store.name || "this store" });
                                                                }}
                                                            >
                                                                <TrashIcon className="size-4" />
                                                            </Button>
                                                        </>
                                                    )}
                                                </div>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    )}
                </CardContent>
            </Card>

            <ConfirmDialog
                isOpen={!!deletingStore}
                onClose={() => setDeletingStore(null)}
                onConfirm={async () => {
                    if (deletingStore) await handleDeleteStore(deletingStore.id);
                }}
                title="Delete Store"
                description={`Are you sure you want to delete "${deletingStore?.name || "this store"}"? This action cannot be undone.`}
                confirmText="Delete Store"
            />
        </div>
    );
}
