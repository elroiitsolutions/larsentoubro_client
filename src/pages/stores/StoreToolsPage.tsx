import {
    Card,
    CardContent,
} from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
    DropdownMenuSeparator,
    DropdownMenuLabel,
    DropdownMenuGroup
} from "@/components/ui/dropdown-menu"
import {
    Sheet,
    SheetContent,
    SheetDescription,
    SheetHeader,
    SheetTitle,
    SheetTrigger,
    SheetFooter
} from "@/components/ui/sheet"
import { SearchableSelect } from "@/components/ui/searchable-select"
import { SearchIcon, Loader2, ArrowUpIcon, ArrowDownIcon, DownloadIcon, FileUp, SlidersHorizontal, RotateCcw, X, CheckSquare, Square, Truck, Edit3 } from "lucide-react"
import { useState, useEffect, useCallback } from "react"
import { useParams, useNavigate, useLocation } from "react-router-dom"
import toolService from "@/services/tool.service"
import { toast } from "sonner"
import formService from "@/services/form.service"
import { ToolFormModal } from "./ToolFormModal"
import { VendorSelectionModal } from "./VendorSelectionModal"
import { BulkEditToolsModal } from "./BulkEditToolsModal"
import { useAuth } from "@/contexts/AuthContext"
import NoAccessPage from "../NoAccessPage"

const statusColors: Record<string, string> = {
    "Available": "bg-emerald-500/15 text-emerald-700 dark:bg-emerald-500/20 dark:text-emerald-400 ring-1 ring-emerald-500/30 shadow-sm",
    "In Use": "bg-blue-500/15 text-blue-700 dark:bg-blue-500/20 dark:text-blue-400 ring-1 ring-blue-500/30 shadow-sm",
    "Moving": "bg-indigo-500/15 text-indigo-700 dark:bg-indigo-500/20 dark:text-indigo-400 ring-1 ring-indigo-500/30 shadow-sm animate-pulse",
    "Missing": "bg-rose-500/15 text-rose-700 dark:bg-rose-500/20 dark:text-rose-400 ring-1 ring-rose-500/30 shadow-sm font-bold",
    "Maintenance": "bg-amber-500/15 text-amber-700 dark:bg-amber-500/20 dark:text-amber-400 ring-1 ring-amber-500/30 shadow-sm",
    "Damaged": "bg-rose-500/15 text-rose-700 dark:bg-rose-500/20 dark:text-rose-400 ring-1 ring-rose-500/30 shadow-sm",
    "Expired": "bg-slate-500/15 text-slate-700 dark:bg-slate-500/20 dark:text-slate-400 ring-1 ring-slate-500/30 shadow-sm",
}

const categories = ["All", "Erection Tools", "Stringing Tools"];
const statuses = ["All", "Available", "In Use", "Moving", "Missing", "Maintenance", "Damaged", "Expired"];


export function StoreToolsPage() {
    const { storeId } = useParams();
    const navigate = useNavigate();
    const location = useLocation();

    // Pass along dynamic breadcrumbs if they exist
    const currentBreadcrumbs = (location.state as any)?.breadcrumbs || [];

    const [tools, setTools] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [exporting, setExporting] = useState(false);

    // Multi-Select Challan Workflow States
    const [selectedToolIds, setSelectedToolIds] = useState<Set<string>>(new Set());
    const [selectedToolsMap, setSelectedToolsMap] = useState<Record<string, any>>({});
    const [isVendorModalOpen, setIsVendorModalOpen] = useState(false);
    const [isBulkEditModalOpen, setIsBulkEditModalOpen] = useState(false);
    const [isSelectingAll, setIsSelectingAll] = useState(false);

    // Pagination and Filter States
    const [page, setPage] = useState(1);
    const [limit] = useState(10);
    const [total, setTotal] = useState(0);
    const [totalPages, setTotalPages] = useState(1);

    const [search, setSearch] = useState("");
    const [category, setCategory] = useState("All");
    const [status, setStatus] = useState("All");

    const [isFilterSheetOpen, setIsFilterSheetOpen] = useState(false);
    const [advancedFilters, setAdvancedFilters] = useState<Record<string, string>>({
        description: "",
        toolId: "",
        toolCode: "",
        makeYear: "",
        capacity: "",
        safeWorkingLoad: "",
        metalType: "",
        toolVariant: "",
        purchaserName: "",
        purchaserContact: "",
        supplierCode: "",
        dateOfSupply: "",
        validityPeriod: "",
        jobCode: "",
        remarks: ""
    });

    const [draftAdvancedFilters, setDraftAdvancedFilters] = useState<Record<string, string>>({
        description: "",
        toolId: "",
        toolCode: "",
        makeYear: "",
        capacity: "",
        safeWorkingLoad: "",
        metalType: "",
        toolVariant: "",
        purchaserName: "",
        purchaserContact: "",
        supplierCode: "",
        dateOfSupply: "",
        validityPeriod: "",
        jobCode: "",
        remarks: ""
    });
    const [draftCategory, setDraftCategory] = useState("All");
    const [draftStatus, setDraftStatus] = useState("All");

    useEffect(() => {
        if (isFilterSheetOpen) {
            setDraftAdvancedFilters(advancedFilters);
            setDraftCategory(category);
            setDraftStatus(status);
        }
    }, [isFilterSheetOpen, advancedFilters, category, status]);

    const activeFilterCount =
        Object.values(advancedFilters).filter(val => val.trim() !== "").length +
        (category !== "All" ? 1 : 0) +
        (status !== "All" ? 1 : 0) +
        (search.trim() !== "" ? 1 : 0);

    const resetAllFilters = () => {
        const emptyFilters = {
            description: "",
            toolId: "",
            toolCode: "",
            makeYear: "",
            capacity: "",
            safeWorkingLoad: "",
            metalType: "",
            toolVariant: "",
            purchaserName: "",
            purchaserContact: "",
            supplierCode: "",
            dateOfSupply: "",
            validityPeriod: "",
            jobCode: "",
            remarks: ""
        };
        setSearch("");
        setCategory("All");
        setStatus("All");
        setAdvancedFilters(emptyFilters);
        setDraftCategory("All");
        setDraftStatus("All");
        setDraftAdvancedFilters(emptyFilters);
        setPage(1);
        toast.success("Filters reset");
    };

    const handleDraftAdvancedFilterChange = (field: string, value: string) => {
        setDraftAdvancedFilters(prev => ({
            ...prev,
            [field]: value
        }));
    };

    const applyAdvancedFilters = () => {
        setAdvancedFilters(draftAdvancedFilters);
        setCategory(draftCategory);
        setStatus(draftStatus);
        setPage(1);
        setIsFilterSheetOpen(false);
        toast.success("Filters applied");
    };

    const [filterOptions, setFilterOptions] = useState<Record<string, string[]>>({});
    const [formSchema, setFormSchema] = useState<any>(null);

    useEffect(() => {
        if (!storeId) return;
        toolService.getToolFilterOptions(storeId)
            .then(options => setFilterOptions(options))
            .catch(err => console.error("Failed to fetch tool filter options", err));
            
        formService.getFormBySlug('tool-form')
            .then(res => {
                if (res.success && res.data) {
                    setFormSchema(res.data);
                }
            })
            .catch(err => console.error("Failed to fetch tool form schema", err));
    }, [storeId]);

    const getOptionsForField = useCallback((field: string, defaultOptions?: string[]): string[] => {
        const backendOpts = filterOptions[field] || [];
        const stateOpts = Array.from(
            new Set(
                tools
                    .map((t: any) => t[field] ?? t.customFields?.[field])
                    .filter((v: any) => v !== null && v !== undefined && String(v).trim() !== "")
                    .map((v: any) => String(v))
            )
        );
        const combined = Array.from(new Set([...(defaultOptions || []), ...backendOpts, ...stateOpts])).sort((a, b) =>
            a.localeCompare(b, undefined, { numeric: true, sensitivity: "base" })
        );
        return combined;
    }, [filterOptions, tools]);

    const renderFilterSelect = (label: string, field: string, placeholder: string) => {
        const options = getOptionsForField(field);
        const currentValue = draftAdvancedFilters[field] ? draftAdvancedFilters[field] : "All";
        return (
            <div>
                <label className="text-xs font-medium text-muted-foreground mb-1.5 block">{label}</label>
                <SearchableSelect
                    value={currentValue}
                    onValueChange={(val) => handleDraftAdvancedFilterChange(field, val === "All" ? "" : val)}
                    options={options}
                    placeholder={placeholder}
                    searchPlaceholder={`Search ${label.toLowerCase()}...`}
                    allLabel="All"
                    allValue="All"
                />
            </div>
        );
    };

    const [sortBy, setSortBy] = useState("createdAt");
    const [sortOrder, setSortOrder] = useState<"asc" | "desc">("desc");

    const fetchTools = useCallback(async () => {
        if (!storeId) return;
        setLoading(true);
        try {
            const data = await toolService.getToolsByStore(storeId, {
                page: page.toString(),
                limit: limit.toString(),
                search,
                category,
                status,
                sortBy,
                sortOrder,
                ...advancedFilters
            });
            if (data?.success) {
                setTools(data.data || []);
                setTotal(data.total || 0);
                setTotalPages(data.totalPages || 1);
                
                // If we don't have breadcrumbs in state (e.g. on hard refresh),
                // infer the projectId from the tools and reconstruct the breadcrumbs!
                if (!(location.state as any)?.breadcrumbs && data.data && data.data.length > 0) {
                    const project = data.data[0].project;
                    const projId = typeof project === 'object' ? project._id : project;
                    if (projId) {
                        navigate(".", { 
                            replace: true, 
                            state: { 
                                ...location.state, 
                                breadcrumbs: [
                                    { label: 'Projects', href: '/projects' },
                                    { label: 'Stores', href: `/projects/${projId}/stores` },
                                    { label: 'Tools', href: `/stores/${storeId}/tools` }
                                ] 
                            } 
                        });
                    }
                }
            }
        } catch (error: any) {
            console.error(error);
            const message = error?.response?.data?.message || "Failed to fetch tools";
            toast.error(message);
        } finally {
            setLoading(false);
        }
    }, [storeId, page, limit, search, category, status, sortBy, sortOrder, advancedFilters]);

    useEffect(() => {
        const timeout = setTimeout(() => {
            fetchTools();
        }, 300);
        return () => clearTimeout(timeout);
    }, [fetchTools]);

    const handleSort = (field: string) => {
        if (sortBy === field) {
            setSortOrder(sortOrder === "asc" ? "desc" : "asc");
        } else {
            setSortBy(field);
            setSortOrder("asc");
        }
    };

    const renderSortIcon = (field: string) => {
        if (sortBy !== field) return <span className="w-4 h-4 ml-1 opacity-0 group-hover:opacity-30 transition-opacity" />;
        return sortOrder === "asc"
            ? <ArrowUpIcon className="size-3.5 ml-1 text-primary animate-in slide-in-from-bottom-1" />
            : <ArrowDownIcon className="size-3.5 ml-1 text-primary animate-in slide-in-from-top-1" />;
    };

    const isAllFilteredSelected = total > 0 && selectedToolIds.size >= total;

    const handleToggleTool = (tool: any, e: React.MouseEvent) => {
        e.stopPropagation();
        const nextIds = new Set(selectedToolIds);
        const nextMap = { ...selectedToolsMap };
        if (nextIds.has(tool._id)) {
            nextIds.delete(tool._id);
            delete nextMap[tool._id];
        } else {
            nextIds.add(tool._id);
            nextMap[tool._id] = tool;
        }
        setSelectedToolIds(nextIds);
        setSelectedToolsMap(nextMap);
    };

    const handleSelectAllFiltered = async () => {
        if (!storeId) return;
        if (isAllFilteredSelected) {
            setSelectedToolIds(new Set());
            setSelectedToolsMap({});
            return;
        }
        try {
            setIsSelectingAll(true);
            const res = await toolService.getToolsByStore(storeId, {
                search,
                category,
                status,
                ...advancedFilters,
                page: "1",
                limit: "10000"
            });
            const filteredTools = res.data || [];
            const nextIds = new Set<string>();
            const nextMap: Record<string, any> = {};
            filteredTools.forEach((t: any) => {
                nextIds.add(t._id);
                nextMap[t._id] = t;
            });
            setSelectedToolIds(nextIds);
            setSelectedToolsMap(nextMap);
            toast.success(`Selected all ${filteredTools.length} filtered tools`);
        } catch (error: any) {
            toast.error("Failed to select all filtered tools");
        } finally {
            setIsSelectingAll(false);
        }
    };

    const handleClearSelection = () => {
        setSelectedToolIds(new Set());
        setSelectedToolsMap({});
    };

    const handleOpenBulkEdit = () => {
        if (selectedToolIds.size === 0) {
            toast.info("Please select tools first using checkboxes or click 'Select All Filtered'", {
                action: {
                    label: "Select All Filtered",
                    onClick: async () => {
                        await handleSelectAllFiltered();
                        setIsBulkEditModalOpen(true);
                    }
                }
            });
            return;
        }
        setIsBulkEditModalOpen(true);
    };

    const handleExport = async (exportScope: 'all' | 'filtered', exportType: 'excel' | 'csv') => {
        if (!storeId) return;
        setExporting(true);
        try {
            const blob = await toolService.exportTools(storeId, {
                search,
                category,
                status,
                sortBy,
                sortOrder,
                exportScope,
                exportType,
                ...advancedFilters
            });
            const url = window.URL.createObjectURL(blob);
            const a = document.createElement("a");
            a.href = url;
            a.download = `tools_export.${exportType === 'excel' ? 'xlsx' : 'csv'}`;
            document.body.appendChild(a);
            a.click();
            window.URL.revokeObjectURL(url);
            document.body.removeChild(a);
            toast.success("Export successful");
        } catch (error: any) {
            console.error(error);
            const message = error?.response?.data?.message || "Failed to export tools";
            toast.error(message);
        } finally {
            setExporting(false);
        }
    };

    const { user } = useAuth();
    const isPageRestricted = Boolean(
        user &&
        user.role !== "Admin" &&
        user.role !== "Vendor" &&
        (!user.allowedPages || (!user.allowedPages.includes("/stores") && !user.allowedPages.includes("/tools")))
    );

    const assignedStoreIds = (user?.stores || []).map((s: any) =>
        typeof s === "object" && s?._id ? String(s._id) : String(s)
    );
    const isStoreRestricted = Boolean(
        user &&
        user.role !== "Admin" &&
        storeId &&
        user.stores &&
        user.stores.length > 0 &&
        !assignedStoreIds.includes(String(storeId))
    );

    if (isPageRestricted || isStoreRestricted) {
        return <NoAccessPage />;
    }

    return (
        <div className="h-full flex flex-col overflow-hidden gap-4 mx-auto w-full animate-in fade-in duration-500">
            {/* Standard Application Layout Header */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pt-2 shrink-0">
                <div>
                    <h1 className="text-3xl font-extrabold tracking-tight">Tools</h1>
                    <p className="text-muted-foreground mt-1 text-sm">
                        Manage, track, and export tools for this location. ({total} total tools)
                    </p>
                </div>

                <div className="flex flex-wrap items-center gap-3">
                    <DropdownMenu>
                        <DropdownMenuTrigger
                            render={
                                <Button
                                    variant="outline"
                                    size="lg"
                                    className="rounded-xl shadow-sm border-border/80 hover:bg-muted/50 transition-all group"
                                    disabled={exporting}
                                />
                            }
                        >
                            {exporting ? (
                                <Loader2 className="size-4 mr-2 animate-spin text-primary" />
                            ) : (
                                <DownloadIcon className="size-4 mr-2 text-primary" />
                            )}
                            Export Data
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="w-56 p-2 rounded-xl">
                            <DropdownMenuGroup>
                                <DropdownMenuLabel className="text-xs uppercase tracking-wider text-muted-foreground">Filtered Results</DropdownMenuLabel>
                                <DropdownMenuItem onClick={() => handleExport('filtered', 'excel')} className="rounded-lg cursor-pointer my-0.5">
                                    Export to Excel
                                </DropdownMenuItem>
                                <DropdownMenuItem onClick={() => handleExport('filtered', 'csv')} className="rounded-lg cursor-pointer my-0.5">
                                    Export to CSV
                                </DropdownMenuItem>
                            </DropdownMenuGroup>
                            <DropdownMenuSeparator className="my-1.5" />
                            <DropdownMenuGroup>
                                <DropdownMenuLabel className="text-xs uppercase tracking-wider text-muted-foreground">All Records</DropdownMenuLabel>
                                <DropdownMenuItem onClick={() => handleExport('all', 'excel')} className="rounded-lg cursor-pointer my-0.5">
                                    Export All to Excel
                                </DropdownMenuItem>
                                <DropdownMenuItem onClick={() => handleExport('all', 'csv')} className="rounded-lg cursor-pointer my-0.5">
                                    Export All to CSV
                                </DropdownMenuItem>
                            </DropdownMenuGroup>
                        </DropdownMenuContent>
                    </DropdownMenu>

                    <Button
                        variant="outline"
                        size="lg"
                        className="gap-2 rounded-xl shadow-sm border-border/80 hover:bg-muted/50 transition-all"
                        onClick={() => {
                            const newBreadcrumbs = [...currentBreadcrumbs, { label: 'Import Tools', href: `/stores/${storeId}/tools/import` }];
                            navigate(`/stores/${storeId}/tools/import`, { state: { breadcrumbs: newBreadcrumbs } });
                        }}
                    >
                        <FileUp className="size-4 text-primary" />
                        Bulk Import
                    </Button>

                    <Button
                        variant={selectedToolIds.size > 0 ? "default" : "outline"}
                        size="lg"
                        className="gap-2 rounded-xl shadow-sm border-border/80 transition-all"
                        onClick={handleOpenBulkEdit}
                    >
                        <Edit3 className="size-4" />
                        Bulk Edit {selectedToolIds.size > 0 ? `(${selectedToolIds.size})` : ""}
                    </Button>

                    <ToolFormModal storeId={storeId!} onSuccess={fetchTools} />
                </div>
            </div>

            <Card className="flex-1 min-h-0 flex flex-col border-border/50 shadow-lg shadow-black/5 overflow-hidden rounded-2xl bg-gradient-to-b from-background to-background/50 backdrop-blur-xl">
                {/* Floating Glassmorphic Filter Bar */}
                <div className="p-4 border-b bg-muted/20 backdrop-blur-md shrink-0">
                    <div className="flex flex-col md:flex-row items-center gap-3">
                        <div className="relative group flex-1 w-full">
                            <SearchIcon className="absolute left-3 top-2.5 size-4.5 text-muted-foreground group-focus-within:text-primary transition-colors" />
                            <Input
                                placeholder="Search tool ID, code, or description..."
                                className="pl-10 h-10 bg-background/50 border-border/60 hover:bg-background focus:bg-background transition-all shadow-sm rounded-xl"
                                value={search}
                                onChange={(e) => { setSearch(e.target.value); setPage(1); }}
                            />
                        </div>
                        <div className="flex flex-wrap sm:flex-nowrap items-center gap-2.5 w-full md:w-auto">
                            <div className="w-full sm:w-44">
                                <SearchableSelect
                                    value={category}
                                    onValueChange={(val) => { setCategory(val); setPage(1); }}
                                    options={categories.filter(c => c !== 'All')}
                                    placeholder="All Types"
                                    searchPlaceholder="Search tool type..."
                                    allLabel="All Types"
                                    allValue="All"
                                    className="h-10 text-sm rounded-xl bg-background/50 border-border/60"
                                />
                            </div>
                            <div className="w-full sm:w-44">
                                <SearchableSelect
                                    value={status}
                                    onValueChange={(val) => { setStatus(val); setPage(1); }}
                                    options={statuses.filter(s => s !== 'All')}
                                    placeholder="All Statuses"
                                    searchPlaceholder="Search status..."
                                    allLabel="All Statuses"
                                    allValue="All"
                                    className="h-10 text-sm rounded-xl bg-background/50 border-border/60"
                                />
                            </div>

                            <Sheet open={isFilterSheetOpen} onOpenChange={setIsFilterSheetOpen}>
                                <SheetTrigger render={
                                    <Button
                                        variant="outline"
                                        className="h-10 gap-2 rounded-xl border-border/80 hover:bg-muted/50 transition-all font-semibold whitespace-nowrap shrink-0 shadow-sm"
                                    >
                                        <SlidersHorizontal className="size-4 text-primary" />
                                        <span>Advanced Filter</span>
                                        {activeFilterCount > 0 && (
                                            <span className="ml-1 px-2 py-0.5 text-xs font-bold rounded-full bg-primary text-primary-foreground">
                                                {activeFilterCount}
                                            </span>
                                        )}
                                    </Button>
                                } />
                                <SheetContent className="w-full !max-w-full sm:!max-w-[750px] lg:!max-w-[860px] overflow-y-auto flex flex-col justify-between p-6 sm:p-8 bg-background/95 backdrop-blur-xl">
                                    <div className="space-y-6">
                                        <SheetHeader className="pb-4 border-b border-border/60">
                                            <SheetTitle className="text-xl font-bold flex items-center gap-2.5">
                                                <SlidersHorizontal className="size-5 text-primary" />
                                                Advanced Dataset Filters
                                            </SheetTitle>
                                            <SheetDescription className="text-sm text-muted-foreground">
                                                Filter tool records across all fields in the dataset using dropdown selections.
                                            </SheetDescription>
                                        </SheetHeader>

                                        {/* General & Identification */}
                                        <div className="space-y-3">
                                            <h4 className="text-xs font-bold uppercase tracking-wider text-primary/80">General</h4>
                                            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                                                {renderFilterSelect("Tool ID", "toolId", "All Tool IDs")}
                                                <div>
                                                    <label className="text-xs font-medium text-muted-foreground mb-1.5 block">Status</label>
                                                    <SearchableSelect
                                                        value={draftStatus}
                                                        onValueChange={(val) => setDraftStatus(val)}
                                                        options={statuses.filter(s => s !== 'All')}
                                                        placeholder="All Statuses"
                                                        searchPlaceholder="Search status..."
                                                        allLabel="All Statuses"
                                                        allValue="All"
                                                    />
                                                </div>
                                            </div>
                                        </div>

                                        {/* Dynamic Fields from Schema */}
                                        {formSchema && (
                                            <div className="space-y-3 pt-4 border-t border-border/60">
                                                <h4 className="text-xs font-bold uppercase tracking-wider text-primary/80">Tool Details</h4>
                                                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                                                    {formSchema.fields
                                                        .filter((f: any) => !f.disabled && f.type !== 'file' && f.type !== 'checkbox')
                                                        .sort((a: any, b: any) => a.order - b.order)
                                                        .map((field: any) => (
                                                            <div key={field.id}>
                                                                {renderFilterSelect(field.label, field.name, `All ${field.label}`)}
                                                            </div>
                                                        ))}
                                                </div>
                                            </div>
                                        )}
                                    </div>

                                    <SheetFooter className="pt-6 border-t border-border/60 flex flex-row items-center justify-between gap-3 sm:justify-between mt-6">
                                        <Button
                                            variant="outline"
                                            onClick={resetAllFilters}
                                            className="h-10 rounded-xl gap-2 font-semibold px-5 border-border/80 hover:bg-muted/50"
                                        >
                                            <RotateCcw className="size-4" />
                                            Reset All
                                        </Button>
                                        <Button
                                            className="h-10 rounded-xl px-7 font-semibold shadow-md"
                                            onClick={applyAdvancedFilters}
                                        >
                                            Apply Filters
                                        </Button>
                                    </SheetFooter>
                                </SheetContent>
                            </Sheet>

                            {activeFilterCount > 0 && (
                                <Button
                                    variant="ghost"
                                    size="icon"
                                    onClick={resetAllFilters}
                                    className="h-10 w-10 rounded-xl text-muted-foreground hover:text-foreground shrink-0"
                                    title="Reset all filters"
                                >
                                    <RotateCcw className="size-4" />
                                </Button>
                            )}
                        </div>
                    </div>
                </div>

                <CardContent className="p-0 flex-1 min-h-0 flex flex-col overflow-hidden">
                    <div className="flex-1 min-h-0 overflow-hidden">
                        <div className="h-full overflow-auto">
                            <table className="h-full min-w-full text-sm text-left whitespace-nowrap">
                                <thead className="sticky top-0 z-10 bg-card shadow-xs">
                                    <tr className="border-b bg-muted text-xs uppercase tracking-wider text-muted-foreground font-semibold">
                                        <th className="w-12 px-4 py-4 select-none text-center">
                                            <button
                                                type="button"
                                                onClick={handleSelectAllFiltered}
                                                disabled={isSelectingAll || total === 0}
                                                className="flex items-center justify-center text-muted-foreground hover:text-primary transition-colors disabled:opacity-50"
                                                title="Select all filtered tools"
                                            >
                                                {isSelectingAll ? (
                                                    <Loader2 className="size-4 animate-spin text-primary" />
                                                ) : isAllFilteredSelected && total > 0 ? (
                                                    <CheckSquare className="size-4 text-primary" />
                                                ) : (
                                                    <Square className="size-4" />
                                                )}
                                            </button>
                                        </th>
                                        <th className="px-6 py-4 cursor-pointer select-none group hover:bg-muted/60 transition-colors" onClick={() => handleSort('toolId')}>
                                            <div className="flex items-center">System ID {renderSortIcon('toolId')}</div>
                                        </th>
                                        <th className="px-6 py-4 cursor-pointer select-none group hover:bg-muted/60 transition-colors" onClick={() => handleSort('status')}>
                                            <div className="flex items-center">Status {renderSortIcon('status')}</div>
                                        </th>
                                        {formSchema?.fields?.filter((f: any) => !f.disabled).sort((a: any, b: any) => a.order - b.order).map((field: any) => (
                                            <th key={field.id} className="px-6 py-4 cursor-pointer select-none group hover:bg-muted/60 transition-colors" onClick={() => handleSort(field.name)}>
                                                <div className="flex items-center">{field.label} {renderSortIcon(field.name)}</div>
                                            </th>
                                        ))}
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-border/40">
                                    {loading ? (
                                        <tr>
                                            <td colSpan={18} className="px-6 py-20 text-center">
                                                <div className="flex flex-col items-center justify-center text-muted-foreground">
                                                    <Loader2 className="size-8 animate-spin text-primary/50 mb-4" />
                                                    <p className="text-sm font-medium animate-pulse">Loading inventory...</p>
                                                </div>
                                            </td>
                                        </tr>
                                    ) : tools.length === 0 ? (
                                        <tr>
                                            <td colSpan={18} className="px-6 py-24 text-center">
                                                <div className="flex flex-col items-center justify-center max-w-sm mx-auto">
                                                    <div className="size-16 rounded-full bg-muted/50 flex items-center justify-center mb-4">
                                                        <SearchIcon className="size-8 text-muted-foreground/50" />
                                                    </div>
                                                    <h3 className="text-lg font-semibold text-foreground mb-1">No tools found</h3>
                                                    <p className="text-sm text-muted-foreground text-balance">
                                                        We couldn't find any tools matching your current filters. Try adjusting your search criteria.
                                                    </p>
                                                    <Button
                                                        variant="ghost"
                                                        className="mt-6 text-primary hover:text-primary/80"
                                                        onClick={() => { setSearch(""); setCategory("All"); setStatus("All"); }}
                                                    >
                                                        Clear all filters
                                                    </Button>
                                                </div>
                                            </td>
                                        </tr>
                                    ) : tools.map((t) => (
                                        <tr
                                            key={t._id}
                                            className={`group hover:bg-primary/[0.03] transition-colors duration-200 cursor-pointer whitespace-nowrap ${
                                                selectedToolIds.has(t._id) ? "bg-primary/[0.05]" : ""
                                            }`}
                                            onClick={() => {
                                                const toolId = t.toolId || t._id;
                                                const existingBreadcrumbs = (location.state as any)?.breadcrumbs || [
                                                    { label: 'Projects', href: '/projects' },
                                                    { label: 'Stores', href: '/stores' },
                                                    { label: 'Tools', href: `/stores/${storeId}/tools` }
                                                ];
                                                const newBreadcrumbs = [
                                                    ...existingBreadcrumbs,
                                                    { label: toolId, href: `/vt/${encodeURIComponent(toolId)}` }
                                                ];
                                                navigate(`/vt/${encodeURIComponent(toolId)}`, { state: { breadcrumbs: newBreadcrumbs } });
                                            }}
                                        >
                                            <td className="px-4 py-4 text-center" onClick={(e) => handleToggleTool(t, e)}>
                                                <button
                                                    type="button"
                                                    className="flex items-center justify-center text-muted-foreground hover:text-primary transition-colors"
                                                >
                                                    {selectedToolIds.has(t._id) ? (
                                                        <CheckSquare className="size-4 text-primary" />
                                                    ) : (
                                                        <Square className="size-4" />
                                                    )}
                                                </button>
                                            </td>
                                            <td className="px-6 py-4">
                                                <div className="font-mono text-xs font-semibold text-primary/80 bg-primary/10 inline-flex px-2 py-1 rounded-md border border-primary/20">
                                                    {t.toolId}
                                                </div>
                                            </td>
                                            <td className="px-6 py-4">
                                                <span className={`inline-flex items-center rounded-full px-2.5 py-1 text-xs font-semibold tracking-wide ${statusColors[t.status] || 'bg-slate-100 text-slate-700 ring-1 ring-slate-200'}`}>
                                                    {t.status === "Available" && <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 mr-1.5 animate-pulse" />}
                                                    {t.status}
                                                </span>
                                            </td>
                                            {formSchema?.fields?.filter((f: any) => !f.disabled).sort((a: any, b: any) => a.order - b.order).map((field: any) => {
                                                let val = t[field.name];
                                                if (val === undefined && t.customFields) {
                                                    val = t.customFields[field.name];
                                                }
                                                if (typeof val === 'object' && val !== null) {
                                                    val = val.name || val.location || val.projectCode || JSON.stringify(val);
                                                } else if (field.type === 'date' && val) {
                                                    let parsedDate = new Date(val);
                                                    if (isNaN(parsedDate.getTime()) && typeof val === 'string' && val.includes('/')) {
                                                        const parts = val.split('/');
                                                        if (parts.length === 3) {
                                                            // Assume DD/MM/YYYY or MM/DD/YYYY, try DD/MM/YYYY first for Indian format
                                                            parsedDate = new Date(`${parts[2]}-${parts[1]}-${parts[0]}`);
                                                        }
                                                    }
                                                    val = isNaN(parsedDate.getTime()) ? val : parsedDate.toLocaleDateString();
                                                }
                                                return (
                                                    <td key={field.id} className="px-6 py-4 text-foreground/80">
                                                        {val || "-"}
                                                    </td>
                                                );
                                            })}
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>

                    {/* Premium Pagination Bar */}
                    <div className="flex flex-col sm:flex-row items-center justify-between px-6 py-4 border-t bg-muted/10 backdrop-blur-sm gap-4 shrink-0">
                        <div className="text-sm font-medium text-muted-foreground">
                            Showing <span className="text-foreground">{total === 0 ? 0 : ((page - 1) * limit) + 1}</span> to <span className="text-foreground">{Math.min(page * limit, total)}</span> of <span className="text-foreground">{total}</span> items
                        </div>
                        <div className="flex items-center gap-2">
                            <Button
                                variant="outline"
                                size="sm"
                                className="rounded-full shadow-sm hover:shadow active:scale-95 transition-all px-4"
                                disabled={page === 1 || loading}
                                onClick={() => setPage(p => Math.max(1, p - 1))}
                            >
                                Previous
                            </Button>

                            <div className="flex items-center justify-center min-w-[5rem] px-2 py-1 rounded-full bg-background border shadow-inner text-sm font-semibold">
                                {page} <span className="text-muted-foreground mx-1">/</span> {totalPages}
                            </div>

                            <Button
                                variant="outline"
                                size="sm"
                                className="rounded-full shadow-sm hover:shadow active:scale-95 transition-all px-4"
                                disabled={page >= totalPages || loading}
                                onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                            >
                                Next
                            </Button>
                        </div>
                    </div>
                </CardContent>
            </Card>

            {/* Floating Bulk Selection Banner */}
            {selectedToolIds.size > 0 && (
                <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 animate-in slide-in-from-bottom-5 duration-300">
                    <div className="flex items-center gap-4 bg-card/95 backdrop-blur-md px-5 py-3 rounded-2xl border border-border shadow-2xl ring-1 ring-primary/20">
                        <div className="flex items-center gap-2.5">
                            <div className="size-8 rounded-xl bg-primary/15 text-primary flex items-center justify-center font-bold text-sm">
                                {selectedToolIds.size}
                            </div>
                            <div>
                                <h4 className="text-sm font-semibold text-foreground">
                                    Selected Tools: {selectedToolIds.size}
                                </h4>
                                <p className="text-xs text-muted-foreground">
                                    {isAllFilteredSelected ? "All filtered tools selected" : "Custom inventory selection"}
                                </p>
                            </div>
                        </div>

                        <div className="h-6 w-px bg-border/60" />

                        <div className="flex items-center gap-2">
                            <Button
                                variant="outline"
                                size="sm"
                                className="h-9 text-xs rounded-xl"
                                onClick={() => setIsBulkEditModalOpen(true)}
                            >
                                <Edit3 className="size-3.5 mr-1 text-primary" />
                                Bulk Edit ({selectedToolIds.size})
                            </Button>

                            <Button
                                variant="outline"
                                size="sm"
                                className="h-9 text-xs rounded-xl"
                                onClick={handleClearSelection}
                            >
                                <X className="size-3.5 mr-1" />
                                Clear
                            </Button>

                            {Object.values(selectedToolsMap).some(t => t.status === "Moving") ? (
                                <Button
                                    size="sm"
                                    disabled
                                    className="h-9 text-xs rounded-xl bg-muted text-muted-foreground shadow-none flex items-center gap-1.5 cursor-not-allowed opacity-80"
                                >
                                    <Truck className="size-3.5 opacity-50" />
                                    <span>Already Moving</span>
                                </Button>
                            ) : (
                                <Button
                                    size="sm"
                                    className="h-9 text-xs rounded-xl bg-primary text-primary-foreground hover:bg-primary/90 shadow-md flex items-center gap-1.5"
                                    onClick={() => setIsVendorModalOpen(true)}
                                >
                                    <Truck className="size-3.5" />
                                    <span>Create Delivery Challan</span>
                                </Button>
                            )}
                        </div>
                    </div>
                </div>
            )}

            <VendorSelectionModal
                open={isVendorModalOpen}
                onOpenChange={setIsVendorModalOpen}
                selectedTools={Object.values(selectedToolsMap)}
                storeId={storeId}
            />

            <BulkEditToolsModal
                open={isBulkEditModalOpen}
                onOpenChange={setIsBulkEditModalOpen}
                storeId={storeId!}
                selectedToolIds={Array.from(selectedToolIds)}
                totalCount={selectedToolIds.size}
                onSuccess={() => {
                    handleClearSelection();
                    fetchTools();
                }}
            />
        </div>
    )
}

// StoreToolsPage with dynamic vendor database dropdown modal
