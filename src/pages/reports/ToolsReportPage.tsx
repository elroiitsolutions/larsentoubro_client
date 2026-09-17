import { useState, useEffect, useCallback } from "react";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
    Wrench,
    FileSpreadsheet,
    FileCode,
    RotateCcw,
    Calendar,
    Search,
    Loader2,
    ArrowUpDown,
    ArrowUp,
    ArrowDown,
    ChevronLeft,
    ChevronRight,
    CheckCircle2,
    Truck,
    Package,
    MapPin
} from "lucide-react";
import reportService from "@/services/report.service";
import projectService, { type ProjectRecord } from "@/services/project.service";
import storeService, { type StoreRecord } from "@/services/store.service";
import vendorService, { type VendorRecord } from "@/services/vendor.service";
import { toast } from "sonner";

export function ToolsReportPage() {
    const [loading, setLoading] = useState(false);
    const [exporting, setExporting] = useState<"excel" | "csv" | null>(null);

    // Dropdown Data
    const [projects, setProjects] = useState<ProjectRecord[]>([]);
    const [stores, setStores] = useState<StoreRecord[]>([]);
    const [vendors, setVendors] = useState<VendorRecord[]>([]);

    // Table & Pagination
    const [data, setData] = useState<any[]>([]);
    const [total, setTotal] = useState(0);
    const [page, setPage] = useState(1);
    const [limit, setLimit] = useState(25);
    const [totalPages, setTotalPages] = useState(1);
    const [summary, setSummary] = useState<Record<string, any>>({});

    // Filters
    const [search, setSearch] = useState("");
    const [selectedProject, setSelectedProject] = useState("All");
    const [selectedStore, setSelectedStore] = useState("All");
    const [selectedVendor, setSelectedVendor] = useState("All");
    const [selectedStatus, setSelectedStatus] = useState("All");
    const [startDate, setStartDate] = useState("");
    const [endDate, setEndDate] = useState("");

    // Sorting
    const [sortBy, setSortBy] = useState("serialNumber");
    const [sortOrder, setSortOrder] = useState<"asc" | "desc">("asc");

    // Load master projects and vendors on mount
    useEffect(() => {
        const loadMasterData = async () => {
            try {
                const [projRes, vendorRes] = await Promise.all([
                    projectService.getProjects().catch(() => ({ data: [] })),
                    vendorService.getVendors({ limit: 200, status: "Active" }).catch(() => ({ data: [] }))
                ]);
                setProjects(projRes.data || []);
                setVendors(vendorRes.data || []);
            } catch (err) {
                console.error("Error loading report metadata:", err);
            }
        };
        loadMasterData();
    }, []);

    // Project -> Store Dependency logic
    useEffect(() => {
        if (selectedProject === "All") {
            setStores([]);
            setSelectedStore("All");
        } else {
            setSelectedStore("All");
            storeService.getStores(selectedProject)
                .then(res => setStores(res.data || []))
                .catch(() => setStores([]));
        }
    }, [selectedProject]);

    const fetchReportData = useCallback(async () => {
        try {
            setLoading(true);
            const params: Record<string, any> = {
                page,
                limit,
                search,
                project: selectedProject,
                store: selectedStore,
                vendor: selectedVendor,
                status: selectedStatus,
                startDate,
                endDate,
                sortBy,
                sortOrder
            };

            const res = await reportService.getToolsReport(params);
            setData(res?.data || []);
            setTotal(res?.total || 0);
            setTotalPages(res?.totalPages || 1);
            setSummary(res?.summary || {});
        } catch (err) {
            console.error("Error loading tools report:", err);
            toast.error("Failed to load tools report data");
        } finally {
            setLoading(false);
        }
    }, [page, limit, search, selectedProject, selectedStore, selectedVendor, selectedStatus, startDate, endDate, sortBy, sortOrder]);

    useEffect(() => {
        fetchReportData();
    }, [fetchReportData]);

    const handleSort = (field: string) => {
        if (sortBy === field) {
            setSortOrder(prev => (prev === "asc" ? "desc" : "asc"));
        } else {
            setSortBy(field);
            setSortOrder("asc");
        }
        setPage(1);
    };

    const handleExport = async (format: "excel" | "csv") => {
        try {
            setExporting(format);
            const params = {
                exportType: format,
                search,
                project: selectedProject,
                store: selectedStore,
                vendor: selectedVendor,
                status: selectedStatus,
                startDate,
                endDate,
                sortBy,
                sortOrder
            };
            await reportService.downloadReportExport("tools", format, params);
            toast.success(`Tools Report exported as ${format.toUpperCase()} successfully!`);
        } catch (err) {
            console.error("Export error:", err);
            toast.error("Failed to export Tools Report");
        } finally {
            setExporting(null);
        }
    };

    const clearFilters = () => {
        setSearch("");
        setSelectedProject("All");
        setSelectedStore("All");
        setSelectedVendor("All");
        setSelectedStatus("All");
        setStartDate("");
        setEndDate("");
        setStores([]);
        setPage(1);
    };

    const renderSortHeader = (label: string, field: string, className: string = "") => {
        const isCurrent = sortBy === field;
        return (
            <th
                onClick={() => handleSort(field)}
                className={`px-5 py-3.5 cursor-pointer select-none hover:bg-muted/70 transition-colors ${className}`}
            >
                <div className="flex items-center gap-1.5 font-semibold text-xs uppercase tracking-wider text-muted-foreground">
                    <span>{label}</span>
                    {isCurrent ? (
                        sortOrder === "asc" ? <ArrowUp className="size-3.5 text-primary" /> : <ArrowDown className="size-3.5 text-primary" />
                    ) : (
                        <ArrowUpDown className="size-3.5 text-muted-foreground/40" />
                    )}
                </div>
            </th>
        );
    };

    return (
        <div className="p-6 mx-auto space-y-6">
            {/* KPI Summary Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <Card className="bg-card/50">
                    <CardContent className="p-4 flex items-center justify-between">
                        <div>
                            <p className="text-xs font-medium text-muted-foreground">Total Tools</p>
                            <h3 className="text-2xl font-bold tracking-tight mt-1">{summary.totalTools || 0}</h3>
                        </div>
                        <div className="p-3 rounded-xl bg-blue-500/10 text-blue-600">
                            <Wrench className="size-5" />
                        </div>
                    </CardContent>
                </Card>
                <Card className="bg-card/50">
                    <CardContent className="p-4 flex items-center justify-between">
                        <div>
                            <p className="text-xs font-medium text-muted-foreground">Available in Store</p>
                            <h3 className="text-2xl font-bold tracking-tight text-emerald-600 mt-1">{summary.availableCount || 0}</h3>
                        </div>
                        <div className="p-3 rounded-xl bg-emerald-500/10 text-emerald-600">
                            <CheckCircle2 className="size-5" />
                        </div>
                    </CardContent>
                </Card>
                <Card className="bg-card/50">
                    <CardContent className="p-4 flex items-center justify-between">
                        <div>
                            <p className="text-xs font-medium text-muted-foreground">Issued / Out on DC</p>
                            <h3 className="text-2xl font-bold tracking-tight text-indigo-600 mt-1">{summary.issuedCount || 0}</h3>
                        </div>
                        <div className="p-3 rounded-xl bg-indigo-500/10 text-indigo-600">
                            <Truck className="size-5" />
                        </div>
                    </CardContent>
                </Card>
            </div>

            {/* Filter Bar with Title & Export */}
            <Card>
                <CardHeader className="pb-3">
                    <CardTitle className="text-xs uppercase font-bold text-muted-foreground tracking-wider flex flex-wrap items-center justify-between gap-2">
                        <div className="flex items-center gap-2">
                            <span className="flex items-center gap-1.5 font-bold text-foreground text-sm normal-case">
                                <Wrench className="size-4 text-primary" /> Tools Report Filters
                            </span>
                            {(search || selectedProject !== "All" || selectedStore !== "All" || selectedVendor !== "All" || selectedStatus !== "All" || startDate || endDate) && (
                                <Button variant="ghost" size="sm" onClick={clearFilters} className="h-6 text-[11px] text-muted-foreground hover:text-foreground">
                                    <RotateCcw className="size-3 mr-1" /> Reset
                                </Button>
                            )}
                        </div>

                        <div className="flex items-center gap-2">
                            <Button
                                variant="outline"
                                size="sm"
                                disabled={exporting !== null || loading}
                                onClick={() => handleExport("excel")}
                                className="flex items-center gap-1.5 text-xs font-semibold bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 hover:bg-emerald-500/20 border-emerald-500/30"
                            >
                                {exporting === "excel" ? <Loader2 className="size-4 animate-spin text-emerald-600" /> : <FileSpreadsheet className="size-4 text-emerald-600" />}
                                <span>Export Excel</span>
                            </Button>

                            <Button
                                variant="outline"
                                size="sm"
                                disabled={exporting !== null || loading}
                                onClick={() => handleExport("csv")}
                                className="flex items-center gap-1.5 text-xs font-semibold"
                            >
                                {exporting === "csv" ? <Loader2 className="size-4 animate-spin text-blue-600" /> : <FileCode className="size-4 text-blue-600" />}
                                <span>Export CSV</span>
                            </Button>
                        </div>
                    </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-5 gap-2.5">
                        <div className="relative">
                            <Search className="size-3.5 absolute left-3 top-3 text-muted-foreground" />
                            <Input
                                placeholder="Search Tools Report..."
                                value={search}
                                onChange={e => { setSearch(e.target.value); setPage(1); }}
                                className="pl-9 h-9 text-xs"
                            />
                        </div>

                        {/* Project Dropdown */}
                        <select
                            value={selectedProject}
                            onChange={e => { setSelectedProject(e.target.value); setPage(1); }}
                            className="h-9 px-3 rounded-md border border-input bg-background text-xs text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
                        >
                            <option value="All">All Projects</option>
                            {projects.map(p => (
                                <option key={p._id} value={p._id}>{p.name}</option>
                            ))}
                        </select>

                        {/* Store Dropdown - Dependent on Project Selection */}
                        <select
                            value={selectedStore}
                            disabled={selectedProject === "All"}
                            onChange={e => { setSelectedStore(e.target.value); setPage(1); }}
                            className="h-9 px-3 rounded-md border border-input bg-background text-xs text-foreground focus:outline-none focus:ring-1 focus:ring-primary disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            <option value="All">
                                {selectedProject === "All" ? "Select Project First" : "All Stores / HUBs"}
                            </option>
                            {stores.map(s => (
                                <option key={s._id} value={s._id}>{s.name}</option>
                            ))}
                        </select>

                        {/* Vendor Dropdown */}
                        <select
                            value={selectedVendor}
                            onChange={e => { setSelectedVendor(e.target.value); setPage(1); }}
                            className="h-9 px-3 rounded-md border border-input bg-background text-xs text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
                        >
                            <option value="All">All Vendors</option>
                            {vendors.map(v => (
                                <option key={v._id} value={v._id}>{v.name}</option>
                            ))}
                        </select>

                        {/* Status Dropdown - Only Missing, Moving, Available */}
                        <select
                            value={selectedStatus}
                            onChange={e => { setSelectedStatus(e.target.value); setPage(1); }}
                            className="h-9 px-3 rounded-md border border-input bg-background text-xs text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
                        >
                            <option value="All">All Statuses</option>
                            <option value="Missing">Missing</option>
                            <option value="Moving">Moving</option>
                            <option value="Available">Available</option>
                        </select>
                    </div>

                    <div className="flex flex-wrap items-center gap-2 pt-1 border-t text-xs">
                        <Calendar className="size-3.5 text-muted-foreground" />
                        <span className="font-semibold text-muted-foreground">Date Range:</span>
                        <Input
                            type="date"
                            className="h-8 w-36 text-xs"
                            value={startDate}
                            onChange={e => { setStartDate(e.target.value); setPage(1); }}
                        />
                        <span className="text-muted-foreground">to</span>
                        <Input
                            type="date"
                            className="h-8 w-36 text-xs"
                            value={endDate}
                            onChange={e => { setEndDate(e.target.value); setPage(1); }}
                        />
                    </div>
                </CardContent>
            </Card>

            {/* Data Table */}
            <Card>
                <CardHeader className="border-b bg-muted/20 pb-3">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                        <div>
                            <CardTitle className="text-base font-bold text-foreground">Tools Data Register</CardTitle>
                            <CardDescription className="text-xs">
                                Showing {data.length} of {total} record(s) matching current criteria.
                            </CardDescription>
                        </div>
                        <div className="flex items-center gap-2 text-xs">
                            <span className="text-muted-foreground font-medium">Rows per page:</span>
                            <select
                                value={limit}
                                onChange={e => { setLimit(Number(e.target.value)); setPage(1); }}
                                className="h-7 px-2 rounded border border-input bg-background text-xs font-semibold"
                            >
                                <option value={10}>10</option>
                                <option value={25}>25</option>
                                <option value={50}>50</option>
                                <option value={100}>100</option>
                            </select>
                        </div>
                    </div>
                </CardHeader>
                <CardContent className="p-0 overflow-x-auto">
                    {loading ? (
                        <div className="p-16 text-center text-muted-foreground flex flex-col items-center justify-center">
                            <Loader2 className="size-8 animate-spin text-primary mb-3" />
                            <p className="text-sm font-medium animate-pulse">Gathering real-time tools report data...</p>
                        </div>
                    ) : data.length === 0 ? (
                        <div className="p-16 text-center text-muted-foreground">
                            <Package className="size-10 text-muted-foreground/30 mx-auto mb-3" />
                            <h3 className="font-semibold text-base text-foreground">No matching records found</h3>
                            <p className="text-xs mt-1">Try adjusting your search queries or resetting active filters.</p>
                        </div>
                    ) : (
                        <table className="w-full text-sm text-left border-collapse">
                            <thead className="bg-muted/50 border-b">
                                <tr>
                                    {renderSortHeader("Tool ID", "toolId")}
                                    {renderSortHeader("Description", "description")}
                                    {renderSortHeader("Category", "toolType")}
                                    <th className="px-5 py-3.5 text-xs font-semibold uppercase text-muted-foreground">Project</th>
                                    <th className="px-5 py-3.5 text-xs font-semibold uppercase text-muted-foreground">Current Site</th>
                                    {renderSortHeader("Status", "status")}
                                    <th className="px-5 py-3.5 text-xs font-semibold uppercase text-muted-foreground">Subcontractor</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-border/50">
                                {data.map((item: any) => (
                                    <tr key={item._id} className="hover:bg-muted/30 transition-colors">
                                        <td className="px-5 py-3.5 font-mono font-bold text-primary text-xs">{item.toolId}</td>
                                        <td className="px-5 py-3.5 font-medium text-foreground">
                                            <div>{item.description}</div>
                                            {item.toolCode && <span className="text-[11px] text-muted-foreground font-mono">Code: {item.toolCode}</span>}
                                        </td>
                                        <td className="px-5 py-3.5 text-xs text-muted-foreground">{item.toolType || item.toolVariant || "General"}</td>
                                        <td className="px-5 py-3.5 text-xs font-medium">{item.project?.name || "Unassigned"}</td>
                                        <td className="px-5 py-3.5 text-xs text-muted-foreground flex items-center gap-1.5 mt-2">
                                            <MapPin className="size-3.5 text-muted-foreground" />
                                            <span>{item.currentSite?.name || "Central Store"}</span>
                                        </td>
                                        <td className="px-5 py-3.5">
                                            <span className={`px-2.5 py-1 rounded-full text-[11px] font-semibold ${
                                                item.status === "Available"
                                                    ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400"
                                                    : item.status === "Moving" || item.status === "In Transit" || item.status === "Issued"
                                                    ? "bg-indigo-500/10 text-indigo-600 dark:text-indigo-400"
                                                    : item.status === "Missing"
                                                    ? "bg-rose-500/10 text-rose-600 dark:text-rose-400"
                                                    : "bg-amber-500/10 text-amber-600 dark:text-amber-400"
                                            }`}>
                                                {item.status}
                                            </span>
                                        </td>
                                        <td className="px-5 py-3.5 text-xs text-muted-foreground">{item.subcontractorName || "-"}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    )}
                </CardContent>

                {/* Pagination */}
                {totalPages > 1 && (
                    <div className="p-4 border-t flex flex-col sm:flex-row items-center justify-between gap-3 text-xs">
                        <span className="text-muted-foreground">
                            Page <strong className="text-foreground">{page}</strong> of <strong className="text-foreground">{totalPages}</strong> ({total} total items)
                        </span>

                        <div className="flex items-center gap-1.5">
                            <Button variant="outline" size="sm" disabled={page <= 1 || loading} onClick={() => setPage(p => Math.max(p - 1, 1))} className="h-8 text-xs flex items-center gap-1">
                                <ChevronLeft className="size-3.5" /> Previous
                            </Button>
                            <Button variant="outline" size="sm" disabled={page >= totalPages || loading} onClick={() => setPage(p => Math.min(p + 1, totalPages))} className="h-8 text-xs flex items-center gap-1">
                                Next <ChevronRight className="size-3.5" />
                            </Button>
                        </div>
                    </div>
                )}
            </Card>
        </div>
    );
}

export default ToolsReportPage;
