import {
    Card,
    CardContent,
    CardHeader,
    CardTitle,
} from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { PlusIcon, StoreIcon, SearchIcon, MapPinIcon, EditIcon, TrashIcon, Loader2, ShieldAlertIcon, CalendarIcon } from "lucide-react"
import { useState, useEffect } from "react"
import { useParams, useNavigate, Navigate } from "react-router-dom"
import { DynamicFormSheet } from "@/components/DynamicFormSheet"
import storeService from "@/services/store.service"
import formService from "@/services/form.service"
import { useAuth } from "@/contexts/AuthContext"
import { toast } from "sonner"
import NoAccessPage from "../NoAccessPage"
import { ConfirmDialog } from "@/components/ConfirmDialog"

const defaultStoreFields = [
    { id: "storeName", name: "storeName", label: "Store Name" },
    { id: "location", name: "location", label: "Location" },
    { id: "manager", name: "manager", label: "Manager Name" },
];

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
    const [formFields, setFormFields] = useState<any[]>([]);

    const activeFields = formFields.length > 0 ? formFields : defaultStoreFields;

    const getStoreFieldValue = (store: any, field: any): any => {
        if (!store) return "-";
        const name = field.name || "";
        const id = field.id || "";
        const label = (field.label || "").toLowerCase().trim();

        // Check store name aliases
        if (name === "storeName" || name === "name" || label.includes("store name")) {
            return store.name || store.storeName || store[name] || "-";
        }

        // Check manager aliases
        if (name === "manager" || name === "managerName" || label.includes("manager")) {
            return store.managerName || store.manager || store[name] || "Unassigned";
        }

        // Check location aliases
        if (name === "location" || name === "city" || label.includes("location") || label.includes("address")) {
            return store.location || store.city || store[name] || "-";
        }

        // Direct property lookup
        if (name && store[name] !== undefined && store[name] !== null && store[name] !== "") {
            return store[name];
        }
        if (id && store[id] !== undefined && store[id] !== null && store[id] !== "") {
            return store[id];
        }

        // Normalized match across all store keys
        const normalizedTarget = (name || id || label).toLowerCase().replace(/[^a-z0-9]/g, "");
        if (normalizedTarget) {
            for (const key of Object.keys(store)) {
                if (key.toLowerCase().replace(/[^a-z0-9]/g, "") === normalizedTarget) {
                    const val = store[key];
                    if (val !== undefined && val !== null && val !== "") return val;
                }
            }
        }

        return "-";
    };

    const renderCellContent = (store: any, field: any, index: number) => {
        const rawValue = getStoreFieldValue(store, field);
        const name = field.name || "";
        const label = (field.label || "").toLowerCase().trim();
        const isNameField = index === 0 || name === "storeName" || name === "name" || label.includes("store name");
        const isLocationField = name === "location" || label.includes("location") || label.includes("address");
        const isManagerField = name === "manager" || name === "managerName" || label.includes("manager");

        if (isNameField) {
            return (
                <td key={field.id || field.name || index} className="px-6 py-4 font-bold text-foreground">
                    {rawValue}
                    {store.type && (
                        <span className="ml-2 inline-flex items-center rounded-md bg-secondary px-2 py-0.5 text-[10px] font-medium text-secondary-foreground">
                            {store.type}
                        </span>
                    )}
                </td>
            );
        }

        if (isLocationField) {
            return (
                <td key={field.id || field.name || index} className="px-6 py-4 text-muted-foreground">
                    <div className="flex items-center gap-1.5">
                        <MapPinIcon className="size-3.5 text-muted-foreground/70 shrink-0" />
                        <span>{rawValue || "N/A"}</span>
                    </div>
                </td>
            );
        }

        if (isManagerField) {
            return (
                <td key={field.id || field.name || index} className="px-6 py-4 font-medium text-foreground">
                    {rawValue || "Unassigned"}
                </td>
            );
        }

        const type = (field.type || "").toLowerCase().trim();
        const isDateField = type === "date" || type === "calendar" || type === "calender" || label.includes("date") || (typeof rawValue === "string" && /^\d{4}-\d{2}-\d{2}/.test(rawValue));

        if (isDateField && rawValue && rawValue !== "-" && rawValue !== "Unassigned") {
            const formatDateDisplay = (dateStr: string) => {
                try {
                    const parts = dateStr.split("-");
                    if (parts.length === 3) {
                        const d = new Date(parseInt(parts[0], 10), parseInt(parts[1], 10) - 1, parseInt(parts[2], 10));
                        if (!isNaN(d.getTime())) {
                            return d.toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" });
                        }
                    }
                    const d = new Date(dateStr);
                    return isNaN(d.getTime()) ? dateStr : d.toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" });
                } catch {
                    return dateStr;
                }
            };

            return (
                <td key={field.id || field.name || index} className="px-6 py-4 font-medium text-foreground">
                    <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-muted/60 text-foreground font-mono text-xs border border-border/40">
                        <CalendarIcon className="size-3.5 text-primary shrink-0" />
                        <span>{formatDateDisplay(String(rawValue))}</span>
                    </div>
                </td>
            );
        }

        let displayValue = rawValue;
        if (typeof rawValue === "boolean") {
            displayValue = rawValue ? "Yes" : "No";
        } else if (Array.isArray(rawValue)) {
            displayValue = rawValue.join(", ");
        } else if (typeof rawValue === "object" && rawValue !== null) {
            displayValue = JSON.stringify(rawValue);
        }

        return (
            <td key={field.id || field.name || index} className="px-6 py-4 font-medium text-foreground">
                {displayValue || "-"}
            </td>
        );
    };

    const getEditingStoreDefaultValues = (store: any, fields: any[]) => {
        if (!store) return undefined;
        const defaults: Record<string, any> = { ...store };
        defaults.storeName = store.name || store.storeName || "";
        defaults.name = store.name || store.storeName || "";
        defaults.manager = store.manager || store.managerName || "";
        defaults.managerName = store.manager || store.managerName || "";
        defaults.location = store.location || "";

        fields.forEach((f) => {
            const val = getStoreFieldValue(store, f);
            if (val !== "-" && val !== "Unassigned") {
                if (f.name && defaults[f.name] === undefined) defaults[f.name] = val;
                if (f.id && defaults[f.id] === undefined) defaults[f.id] = val;
            }
        });

        return defaults;
    };

    const filteredStores = stores.filter((s) => {
        if (!searchQuery.trim()) return true;
        const q = searchQuery.toLowerCase();
        const basicMatch = (
            (s.name && String(s.name).toLowerCase().includes(q)) ||
            (s.storeName && String(s.storeName).toLowerCase().includes(q)) ||
            (s.storeCode && String(s.storeCode).toLowerCase().includes(q)) ||
            (s.location && String(s.location).toLowerCase().includes(q)) ||
            (s.city && String(s.city).toLowerCase().includes(q)) ||
            (s.manager && String(s.manager).toLowerCase().includes(q)) ||
            (s.managerName && String(s.managerName).toLowerCase().includes(q)) ||
            (s._id && String(s._id).toLowerCase().includes(q))
        );
        if (basicMatch) return true;

        return activeFields.some((field) => {
            const val = getStoreFieldValue(s, field);
            return val && val !== "-" && val !== "Unassigned" && String(val).toLowerCase().includes(q);
        });
    });

    const assignedProjectIds = (user?.projects || []).map((p: any) => typeof p === 'object' ? p._id : p);
    const isProjectRestricted = Boolean(user && user.role !== "Admin" && user.role !== "Vendor" && projectId && !assignedProjectIds.includes(projectId));

    const fetchFormSchema = async () => {
        try {
            const res = await formService.getFormBySlug("create-store");
            if (res.success && res.data && Array.isArray(res.data.fields) && res.data.fields.length > 0) {
                const sorted = [...res.data.fields].sort((a, b) => (a.order ?? 0) - (b.order ?? 0));
                setFormFields(sorted);
            }
        } catch (err) {
            console.error("Failed to fetch create-store form schema:", err);
        }
    };

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
        fetchFormSchema();
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
                    <h1 className="text-3xl font-extrabold tracking-tight">Stores</h1>
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
                    fetchFormSchema();
                }}
                additionalData={projectId ? { projectId } : undefined}
                defaultValues={editingStore ? getEditingStoreDefaultValues(editingStore, activeFields) : undefined}
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
                                        {activeFields.map((field, idx) => (
                                            <th
                                                key={field.id || field.name || idx}
                                                className="text-left px-6 py-4 font-semibold text-muted-foreground uppercase text-[11px] tracking-wider whitespace-nowrap"
                                            >
                                                {field.label || field.name}
                                            </th>
                                        ))}
                                        <th className="text-right px-6 py-4 font-semibold text-muted-foreground uppercase text-[11px] tracking-wider whitespace-nowrap">
                                            Actions
                                        </th>
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
                                            {activeFields.map((field, idx) => renderCellContent(store, field, idx))}
                                            <td
                                                className="px-6 py-4 text-right whitespace-nowrap"
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
