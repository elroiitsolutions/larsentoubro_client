import { useState, useEffect, useCallback } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
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
    MapPin,
    AlertTriangle,
    ClipboardCheck,
    Archive,
    Building2,
    ShieldCheck,
    FileText,
    RefreshCw,
    Clock,
    ExternalLink,
    Filter,
    Layers,
    QrCode
} from "lucide-react";
import reportService from "@/services/report.service";
import projectService, { type ProjectRecord } from "@/services/project.service";
import storeService, { type StoreRecord } from "@/services/store.service";
import vendorService, { type VendorRecord } from "@/services/vendor.service";
import profileService, { type ProfileRecord } from "@/services/profile.service";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";

export type ReportTab =
    | "tools"
    | "challans"
    | "missing"
    | "inspections"
    | "scrap"
    | "subcontractors"
    | "logins";

interface ReportsPageProps {
    defaultTab?: ReportTab;
}

export function ReportsPage({ defaultTab }: ReportsPageProps) {
    const { user } = useAuth();
    const isAdmin = user?.role === "Admin";
    const navigate = useNavigate();
    const [searchParams, setSearchParams] = useSearchParams();

    // Tab Selection
    const queryTab = (searchParams.get("tab") as ReportTab) || defaultTab || "tools";
    const [activeTab, setActiveTab] = useState<ReportTab>(queryTab);

    // Sync tab with URL
    const handleTabChange = (tab: ReportTab) => {
        setActiveTab(tab);
        setSearchParams({ tab });
        setPage(1);
        setSearch("");
    };

    // Global loading & export states
    const [loading, setLoading] = useState(false);
    const [exporting, setExporting] = useState<"excel" | "csv" | null>(null);

    // Master Dropdown Data
    const [projects, setProjects] = useState<ProjectRecord[]>([]);
    const [stores, setStores] = useState<StoreRecord[]>([]);
    const [vendors, setVendors] = useState<VendorRecord[]>([]);
    const [scrapDealers, setScrapDealers] = useState<ProfileRecord[]>([]);

    // Shared Filters
    const [search, setSearch] = useState("");
    const [selectedProject, setSelectedProject] = useState("All");
    const [selectedStore, setSelectedStore] = useState("All");
    const [selectedVendor, setSelectedVendor] = useState("All");
    const [startDate, setStartDate] = useState("");
    const [endDate, setEndDate] = useState("");

    // Tab-Specific Filters
    const [toolStatus, setToolStatus] = useState("All");
    const [toolType, setToolType] = useState("All");
    const [toolPrinted, setToolPrinted] = useState("All");

    const [challanType, setChallanType] = useState("All");
    const [challanStatus, setChallanStatus] = useState("All");
    const [outstandingOnly, setOutstandingOnly] = useState(false);

    const [missingStatus, setMissingStatus] = useState("All");

    const [inspectionCompliance, setInspectionCompliance] = useState("All");
    const [inspectionResult, setInspectionResult] = useState("All");
    const [lifeExtension, setLifeExtension] = useState("All");

    const [scrapDisposalStatus, setScrapDisposalStatus] = useState("All");
    const [scrapDealerFilter, setScrapDealerFilter] = useState("All");

    const [complianceTier, setComplianceTier] = useState("All");

    const [loginRole, setLoginRole] = useState("All");
    const [loginStatus, setLoginStatus] = useState("All");

    // Table & Pagination
    const [data, setData] = useState<any[]>([]);
    const [total, setTotal] = useState(0);
    const [page, setPage] = useState(1);
    const [limit, setLimit] = useState(25);
    const [totalPages, setTotalPages] = useState(1);
    const [summary, setSummary] = useState<Record<string, any>>({});

    // Sorting
    const [sortBy, setSortBy] = useState("createdAt");
    const [sortOrder, setSortOrder] = useState<"asc" | "desc">("desc");

    // Load Master Metadata once
    useEffect(() => {
        const loadMaster = async () => {
            try {
                const [projRes, vendorRes, dealersRes] = await Promise.all([
                    projectService.getProjects().catch(() => ({ data: [] })),
                    vendorService.getVendors({ limit: 300, status: "Active" }).catch(() => ({ data: [] })),
                    profileService.getProfiles({ limit: 100, profileType: "ScrapDealer" }).catch(() => ({ data: [] }))
                ]);
                setProjects(projRes.data || []);
                setVendors(vendorRes.data || []);
                setScrapDealers(dealersRes.data || []);
            } catch (err) {
                console.error("Error loading master filters:", err);
            }
        };
        loadMaster();
    }, []);

    // Project -> Store Dependency
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

    // Fetch report data according to active tab
    const fetchActiveReport = useCallback(async () => {
        setLoading(true);
        try {
            const baseParams: Record<string, any> = {
                page,
                limit,
                search: search.trim(),
                project: selectedProject,
                store: selectedStore,
                startDate,
                endDate,
                sortBy,
                sortOrder
            };

            let res: any = null;

            switch (activeTab) {
                case "tools":
                    res = await reportService.getToolsReport({
                        ...baseParams,
                        vendor: selectedVendor,
                        status: toolStatus,
                        toolType,
                        isPrinted: toolPrinted === "All" ? undefined : toolPrinted === "Yes"
                    });
                    break;
                case "challans":
                    res = await reportService.getChallansReport({
                        ...baseParams,
                        challanType,
                        status: challanStatus,
                        vendor: selectedVendor,
                        isOutstandingOnly: outstandingOnly ? "true" : "false"
                    });
                    break;
                case "missing":
                    res = await reportService.getMissingToolsReport({
                        ...baseParams,
                        vendor: selectedVendor,
                        status: missingStatus
                    });
                    break;
                case "inspections":
                    res = await reportService.getInspectionsReport({
                        ...baseParams,
                        complianceStatus: inspectionCompliance,
                        inspectionResult,
                        lifeExtension
                    });
                    break;
                case "scrap":
                    res = await reportService.getScrapReport({
                        ...baseParams,
                        disposalStatus: scrapDisposalStatus,
                        scrapDealer: scrapDealerFilter
                    });
                    break;
                case "subcontractors":
                    res = await reportService.getSubcontractorsReport({
                        ...baseParams,
                        complianceFilter: complianceTier
                    });
                    break;
                case "logins":
                    res = await reportService.getLoginReport({
                        ...baseParams,
                        role: loginRole,
                        status: loginStatus,
                        sortBy: sortBy === "createdAt" ? "loginAt" : sortBy
                    });
                    break;
            }

            if (res) {
                setData(res.data || []);
                setTotal(res.total || res.pagination?.total || 0);
                setTotalPages(res.totalPages || res.pagination?.pages || 1);
                setSummary(res.summary || res.stats || {});
            }
        } catch (err: any) {
            console.error("Failed to load report data:", err);
            toast.error(err?.response?.data?.message || "Failed to load report data");
        } finally {
            setLoading(false);
        }
    }, [
        activeTab,
        page,
        limit,
        search,
        selectedProject,
        selectedStore,
        selectedVendor,
        startDate,
        endDate,
        sortBy,
        sortOrder,
        toolStatus,
        toolType,
        toolPrinted,
        challanType,
        challanStatus,
        outstandingOnly,
        missingStatus,
        inspectionCompliance,
        inspectionResult,
        lifeExtension,
        scrapDisposalStatus,
        scrapDealerFilter,
        complianceTier,
        loginRole,
        loginStatus
    ]);

    useEffect(() => {
        fetchActiveReport();
    }, [fetchActiveReport]);

    // Sorting Handler
    const handleSort = (field: string) => {
        if (sortBy === field) {
            setSortOrder(prev => (prev === "asc" ? "desc" : "asc"));
        } else {
            setSortBy(field);
            setSortOrder("asc");
        }
        setPage(1);
    };

    // Universal Export Handler
    const handleExport = async (format: "excel" | "csv") => {
        setExporting(format);
        try {
            const baseParams: Record<string, any> = {
                search: search.trim(),
                project: selectedProject,
                store: selectedStore,
                startDate,
                endDate,
                sortBy,
                sortOrder
            };

            if (activeTab === "logins") {
                await reportService.downloadLoginReportExport(format, {
                    ...baseParams,
                    role: loginRole,
                    status: loginStatus
                });
            } else {
                let tabParams: Record<string, any> = {};
                if (activeTab === "tools") {
                    tabParams = { vendor: selectedVendor, status: toolStatus, toolType, isPrinted: toolPrinted === "All" ? undefined : toolPrinted === "Yes" };
                } else if (activeTab === "challans") {
                    tabParams = { challanType, status: challanStatus, vendor: selectedVendor, isOutstandingOnly: outstandingOnly ? "true" : "false" };
                } else if (activeTab === "missing") {
                    tabParams = { vendor: selectedVendor, status: missingStatus };
                } else if (activeTab === "inspections") {
                    tabParams = { complianceStatus: inspectionCompliance, inspectionResult, lifeExtension };
                } else if (activeTab === "scrap") {
                    tabParams = { disposalStatus: scrapDisposalStatus, scrapDealer: scrapDealerFilter };
                } else if (activeTab === "subcontractors") {
                    tabParams = { complianceFilter: complianceTier };
                }

                await reportService.downloadReportExport(activeTab, format, { ...baseParams, ...tabParams });
            }
            toast.success(`Exported ${activeTab.toUpperCase()} report as ${format.toUpperCase()} successfully!`);
        } catch (err: any) {
            console.error("Export failed:", err);
            toast.error("Failed to generate export file");
        } finally {
            setExporting(null);
        }
    };

    // Reset Filters
    const clearFilters = () => {
        setSearch("");
        setSelectedProject("All");
        setSelectedStore("All");
        setSelectedVendor("All");
        setStartDate("");
        setEndDate("");
        setToolStatus("All");
        setToolType("All");
        setToolPrinted("All");
        setChallanType("All");
        setChallanStatus("All");
        setOutstandingOnly(false);
        setMissingStatus("All");
        setInspectionCompliance("All");
        setInspectionResult("All");
        setLifeExtension("All");
        setScrapDisposalStatus("All");
        setScrapDealerFilter("All");
        setComplianceTier("All");
        setLoginRole("All");
        setLoginStatus("All");
        setStores([]);
        setPage(1);
    };

    const hasActiveFilters = Boolean(
        search ||
        selectedProject !== "All" ||
        selectedStore !== "All" ||
        selectedVendor !== "All" ||
        startDate ||
        endDate ||
        toolStatus !== "All" ||
        toolType !== "All" ||
        toolPrinted !== "All" ||
        challanType !== "All" ||
        challanStatus !== "All" ||
        outstandingOnly ||
        missingStatus !== "All" ||
        inspectionCompliance !== "All" ||
        inspectionResult !== "All" ||
        lifeExtension !== "All" ||
        scrapDisposalStatus !== "All" ||
        scrapDealerFilter !== "All" ||
        complianceTier !== "All" ||
        loginRole !== "All" ||
        loginStatus !== "All"
    );

    // Sort header renderer
    const renderSortHeader = (label: string, field: string, className: string = "") => {
        const isCurrent = sortBy === field;
        return (
            <th
                onClick={() => handleSort(field)}
                className={`px-4 py-3 cursor-pointer select-none hover:bg-muted/70 transition-colors ${className}`}
            >
                <div className="flex items-center gap-1.5 font-semibold text-[11px] uppercase tracking-wider text-muted-foreground">
                    <span>{label}</span>
                    {isCurrent ? (
                        sortOrder === "asc" ? <ArrowUp className="size-3 text-primary" /> : <ArrowDown className="size-3 text-primary" />
                    ) : (
                        <ArrowUpDown className="size-3 text-muted-foreground/30" />
                    )}
                </div>
            </th>
        );
    };

    // Quick Date Preset helper
    const handleDatePreset = (preset: "today" | "month" | "30days") => {
        const today = new Date();
        const toStr = today.toISOString().split("T")[0];
        let fromDate = new Date();

        if (preset === "today") {
            // today only
        } else if (preset === "month") {
            fromDate = new Date(today.getFullYear(), today.getMonth(), 1);
        } else if (preset === "30days") {
            fromDate.setDate(today.getDate() - 30);
        }

        const fromStr = fromDate.toISOString().split("T")[0];
        setStartDate(fromStr);
        setEndDate(toStr);
        setPage(1);
    };

    return (
        <div className="flex flex-col gap-6 w-full mx-auto p-4 pb-14 animate-in fade-in duration-300">
            {/* Header & Title Section */}
            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 pt-1">
                <div>
                   
                    <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-foreground mt-1.5 flex items-center gap-2.5">
                        <Layers className="size-8 text-primary" />
                        Reports & Audit Hub
                    </h1>
                    <p className="text-muted-foreground text-xs sm:text-sm mt-1 max-w-3xl">
                        Comprehensive registers across tool inventory, gate pass delivery challans, loss & missing reconciliations, statutory inspection compliance, scrap disposal manifests, and security audits.
                    </p>
                </div>

                {/* Global Actions */}
                <div className="flex items-center gap-2 flex-wrap">
                    <Button
                        variant="outline"
                        size="sm"
                        onClick={fetchActiveReport}
                        disabled={loading}
                        className="rounded-xl h-9 gap-1.5 text-xs font-semibold"
                    >
                        <RefreshCw className={`size-3.5 ${loading ? "animate-spin" : ""}`} />
                        Refresh
                    </Button>

                    <Button
                        variant="outline"
                        size="sm"
                        disabled={exporting !== null || loading}
                        onClick={() => handleExport("excel")}
                        className="rounded-xl h-9 gap-1.5 text-xs font-semibold bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 hover:bg-emerald-500/20 border-emerald-500/30"
                    >
                        {exporting === "excel" ? <Loader2 className="size-3.5 animate-spin" /> : <FileSpreadsheet className="size-3.5 text-emerald-600" />}
                        Export Excel (.xlsx)
                    </Button>

                    <Button
                        variant="outline"
                        size="sm"
                        disabled={exporting !== null || loading}
                        onClick={() => handleExport("csv")}
                        className="rounded-xl h-9 gap-1.5 text-xs font-semibold"
                    >
                        {exporting === "csv" ? <Loader2 className="size-3.5 animate-spin text-blue-600" /> : <FileCode className="size-3.5 text-blue-600" />}
                        Export CSV
                    </Button>
                </div>
            </div>

            {/* Navigation Tabs Bar */}
            <div className="border-b border-border/60 pb-px">
                <div className="flex items-center gap-1.5 overflow-x-auto scrollbar-none py-1">
                    <button
                        onClick={() => handleTabChange("tools")}
                        className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-bold transition-all whitespace-nowrap cursor-pointer ${
                            activeTab === "tools"
                                ? "bg-primary text-primary-foreground shadow-sm shadow-primary/20"
                                : "text-muted-foreground hover:bg-muted/70 hover:text-foreground"
                        }`}
                    >
                        <Wrench className="size-4" />
                        <span>Tools Inventory</span>
                    </button>

                    <button
                        onClick={() => handleTabChange("challans")}
                        className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-bold transition-all whitespace-nowrap cursor-pointer ${
                            activeTab === "challans"
                                ? "bg-primary text-primary-foreground shadow-sm shadow-primary/20"
                                : "text-muted-foreground hover:bg-muted/70 hover:text-foreground"
                        }`}
                    >
                        <FileText className="size-4" />
                        <span>Challans & Gate Pass</span>
                    </button>

                    <button
                        onClick={() => handleTabChange("missing")}
                        className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-bold transition-all whitespace-nowrap cursor-pointer ${
                            activeTab === "missing"
                                ? "bg-rose-600 text-white shadow-sm shadow-rose-600/20"
                                : "text-muted-foreground hover:bg-muted/70 hover:text-foreground"
                        }`}
                    >
                        <AlertTriangle className="size-4 text-rose-500" />
                        <span>Loss & Missing Audit</span>
                    </button>

                    <button
                        onClick={() => handleTabChange("inspections")}
                        className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-bold transition-all whitespace-nowrap cursor-pointer ${
                            activeTab === "inspections"
                                ? "bg-primary text-primary-foreground shadow-sm shadow-primary/20"
                                : "text-muted-foreground hover:bg-muted/70 hover:text-foreground"
                        }`}
                    >
                        <ClipboardCheck className="size-4" />
                        <span>Inspection Compliance</span>
                    </button>

                    <button
                        onClick={() => handleTabChange("scrap")}
                        className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-bold transition-all whitespace-nowrap cursor-pointer ${
                            activeTab === "scrap"
                                ? "bg-amber-600 text-white shadow-sm shadow-amber-600/20"
                                : "text-muted-foreground hover:bg-muted/70 hover:text-foreground"
                        }`}
                    >
                        <Archive className="size-4 text-amber-500" />
                        <span>Scrap & Disposal</span>
                    </button>

                    <button
                        onClick={() => handleTabChange("subcontractors")}
                        className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-bold transition-all whitespace-nowrap cursor-pointer ${
                            activeTab === "subcontractors"
                                ? "bg-primary text-primary-foreground shadow-sm shadow-primary/20"
                                : "text-muted-foreground hover:bg-muted/70 hover:text-foreground"
                        }`}
                    >
                        <Building2 className="size-4" />
                        <span>Subcontractor Custody</span>
                    </button>

                    {isAdmin && (
                        <button
                            onClick={() => handleTabChange("logins")}
                            className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-bold transition-all whitespace-nowrap cursor-pointer ${
                                activeTab === "logins"
                                    ? "bg-primary text-primary-foreground shadow-sm shadow-primary/20"
                                    : "text-muted-foreground hover:bg-muted/70 hover:text-foreground"
                            }`}
                        >
                            <ShieldCheck className="size-4" />
                            <span>Security & Logins</span>
                        </button>
                    )}
                </div>
            </div>

            {/* Dynamic Bento KPI Cards per Tab */}
            {activeTab === "tools" && (
                <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-7 gap-3">
                    <Card className="rounded-2xl border border-border/60 bg-card/60 backdrop-blur-md p-4">
                        <div className="flex items-center justify-between">
                            <span className="text-[11px] font-bold text-muted-foreground uppercase tracking-wider">Total Tools</span>
                            <div className="p-2 rounded-xl bg-blue-500/10 text-blue-600"><Wrench className="size-4" /></div>
                        </div>
                        <h3 className="text-2xl font-black mt-2">{summary.totalTools || total || 0}</h3>
                        <p className="text-[11px] text-muted-foreground mt-0.5">Tracked assets</p>
                    </Card>

                    <Card className="rounded-2xl border border-border/60 bg-card/60 backdrop-blur-md p-4">
                        <div className="flex items-center justify-between">
                            <span className="text-[11px] font-bold text-muted-foreground uppercase tracking-wider">Available</span>
                            <div className="p-2 rounded-xl bg-emerald-500/10 text-emerald-600"><CheckCircle2 className="size-4" /></div>
                        </div>
                        <h3 className="text-2xl font-black text-emerald-600 mt-2">{summary.availableCount || 0}</h3>
                        <p className="text-[11px] text-muted-foreground mt-0.5">Ready in stores</p>
                    </Card>

                    <Card className="rounded-2xl border border-border/60 bg-card/60 backdrop-blur-md p-4">
                        <div className="flex items-center justify-between">
                            <span className="text-[11px] font-bold text-muted-foreground uppercase tracking-wider">Issued / DC</span>
                            <div className="p-2 rounded-xl bg-indigo-500/10 text-indigo-600"><Truck className="size-4" /></div>
                        </div>
                        <h3 className="text-2xl font-black text-indigo-600 mt-2">{summary.issuedCount || 0}</h3>
                        <p className="text-[11px] text-muted-foreground mt-0.5">Out at workfronts</p>
                    </Card>

                    <Card className="rounded-2xl border border-border/60 bg-card/60 backdrop-blur-md p-4">
                        <div className="flex items-center justify-between">
                            <span className="text-[11px] font-bold text-muted-foreground uppercase tracking-wider">Under Repair</span>
                            <div className="p-2 rounded-xl bg-orange-500/10 text-orange-600"><Wrench className="size-4" /></div>
                        </div>
                        <h3 className="text-2xl font-black text-orange-600 mt-2">{summary.repairCount || 0}</h3>
                        <p className="text-[11px] text-muted-foreground mt-0.5">In maintenance</p>
                    </Card>

                    <Card className="rounded-2xl border border-border/60 bg-card/60 backdrop-blur-md p-4">
                        <div className="flex items-center justify-between">
                            <span className="text-[11px] font-bold text-muted-foreground uppercase tracking-wider">Inspection Due</span>
                            <div className="p-2 rounded-xl bg-amber-500/10 text-amber-600"><Clock className="size-4" /></div>
                        </div>
                        <h3 className="text-2xl font-black text-amber-600 mt-2">{summary.overdueCount || 0}</h3>
                        <p className="text-[11px] text-muted-foreground mt-0.5">Requires engineer audit</p>
                    </Card>

                    <Card className="rounded-2xl border border-border/60 bg-card/60 backdrop-blur-md p-4">
                        <div className="flex items-center justify-between">
                            <span className="text-[11px] font-bold text-muted-foreground uppercase tracking-wider">Missing</span>
                            <div className="p-2 rounded-xl bg-rose-500/10 text-rose-600"><AlertTriangle className="size-4" /></div>
                        </div>
                        <h3 className="text-2xl font-black text-rose-600 mt-2">{summary.missingCount || 0}</h3>
                        <p className="text-[11px] text-muted-foreground mt-0.5">Unreconciled loss</p>
                    </Card>

                    <Card className="rounded-2xl border border-border/60 bg-card/60 backdrop-blur-md p-4">
                        <div className="flex items-center justify-between">
                            <span className="text-[11px] font-bold text-muted-foreground uppercase tracking-wider">Scrapped</span>
                            <div className="p-2 rounded-xl bg-gray-500/10 text-gray-600"><Archive className="size-4" /></div>
                        </div>
                        <h3 className="text-2xl font-black text-muted-foreground mt-2">{summary.scrappedCount || 0}</h3>
                        <p className="text-[11px] text-muted-foreground mt-0.5">Decommissioned</p>
                    </Card>
                </div>
            )}

            {activeTab === "challans" && (
                <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
                    <Card className="rounded-2xl border border-border/60 bg-card/60 backdrop-blur-md p-4">
                        <span className="text-[11px] font-bold text-muted-foreground uppercase tracking-wider">Total Challans</span>
                        <h3 className="text-2xl font-black mt-2">{summary.totalChallans || total || 0}</h3>
                        <p className="text-[11px] text-muted-foreground mt-0.5">All movements</p>
                    </Card>

                    <Card className="rounded-2xl border border-border/60 bg-card/60 backdrop-blur-md p-4">
                        <span className="text-[11px] font-bold text-muted-foreground uppercase tracking-wider">Delivery (DC)</span>
                        <h3 className="text-2xl font-black text-blue-600 mt-2">{summary.deliveryCount || 0}</h3>
                        <p className="text-[11px] text-muted-foreground mt-0.5">{summary.activeCount || 0} active</p>
                    </Card>

                    <Card className="rounded-2xl border border-border/60 bg-card/60 backdrop-blur-md p-4">
                        <span className="text-[11px] font-bold text-muted-foreground uppercase tracking-wider">Return (RC)</span>
                        <h3 className="text-2xl font-black text-emerald-600 mt-2">{summary.returnCount || 0}</h3>
                        <p className="text-[11px] text-muted-foreground mt-0.5">Processed returns</p>
                    </Card>

                    <Card className="rounded-2xl border border-border/60 bg-card/60 backdrop-blur-md p-4">
                        <span className="text-[11px] font-bold text-muted-foreground uppercase tracking-wider">Dispatched Tools</span>
                        <h3 className="text-2xl font-black text-indigo-600 mt-2">{summary.totalToolsDispatched || 0}</h3>
                        <p className="text-[11px] text-muted-foreground mt-0.5">Sent on DCs</p>
                    </Card>

                    <Card className="rounded-2xl border border-border/60 bg-card/60 backdrop-blur-md p-4">
                        <span className="text-[11px] font-bold text-muted-foreground uppercase tracking-wider">Returned Tools</span>
                        <h3 className="text-2xl font-black text-teal-600 mt-2">{summary.totalToolsReturned || 0}</h3>
                        <p className="text-[11px] text-muted-foreground mt-0.5">Safely received</p>
                    </Card>

                    <Card className="rounded-2xl border border-border/60 bg-card/60 backdrop-blur-md p-4">
                        <span className="text-[11px] font-bold text-muted-foreground uppercase tracking-wider">Outstanding</span>
                        <h3 className="text-2xl font-black text-amber-600 mt-2">{summary.totalOutstandingTools || 0}</h3>
                        <p className="text-[11px] text-muted-foreground mt-0.5">Pending return in field</p>
                    </Card>
                </div>
            )}

            {activeTab === "missing" && (
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5">
                    <Card className="rounded-2xl border border-rose-500/20 bg-rose-500/5 backdrop-blur-md p-4">
                        <div className="flex items-center justify-between">
                            <span className="text-xs font-bold text-rose-600 uppercase tracking-wider">Total Missing Tools</span>
                            <AlertTriangle className="size-5 text-rose-600" />
                        </div>
                        <h3 className="text-3xl font-black text-rose-600 mt-2">{summary.totalMissing || total || 0}</h3>
                        <p className="text-xs text-muted-foreground mt-1">Tools flagged unreturned or lost at workfronts</p>
                    </Card>

                    <Card className="rounded-2xl border border-border/60 bg-card/60 backdrop-blur-md p-4">
                        <div className="flex items-center justify-between">
                            <span className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Responsible Vendors</span>
                            <Building2 className="size-5 text-indigo-600" />
                        </div>
                        <h3 className="text-3xl font-black text-foreground mt-2">{summary.uniqueVendorsCount || 0}</h3>
                        <p className="text-xs text-muted-foreground mt-1">Subcontractors with outstanding missing items</p>
                    </Card>

                    <Card className="rounded-2xl border border-border/60 bg-card/60 backdrop-blur-md p-4">
                        <div className="flex items-center justify-between">
                            <span className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Impacted Projects</span>
                            <MapPin className="size-5 text-emerald-600" />
                        </div>
                        <h3 className="text-3xl font-black text-foreground mt-2">{summary.uniqueProjectsCount || 0}</h3>
                        <p className="text-xs text-muted-foreground mt-1">Project sites where losses occurred</p>
                    </Card>
                </div>
            )}

            {activeTab === "inspections" && (
                <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
                    <Card className="rounded-2xl border border-border/60 bg-card/60 backdrop-blur-md p-4">
                        <span className="text-[11px] font-bold text-muted-foreground uppercase tracking-wider">Active Fleet</span>
                        <h3 className="text-2xl font-black mt-2">{summary.totalTools || total || 0}</h3>
                        <p className="text-[11px] text-muted-foreground mt-0.5">Tracked assets</p>
                    </Card>

                    <Card className="rounded-2xl border border-rose-500/20 bg-rose-500/5 p-4">
                        <span className="text-[11px] font-bold text-rose-600 uppercase tracking-wider">Overdue</span>
                        <h3 className="text-2xl font-black text-rose-600 mt-2">{summary.overdueCount || 0}</h3>
                        <p className="text-[11px] text-rose-600/80 mt-0.5">Requires immediate halt</p>
                    </Card>

                    <Card className="rounded-2xl border border-amber-500/20 bg-amber-500/5 p-4">
                        <span className="text-[11px] font-bold text-amber-600 uppercase tracking-wider">Due Soon (30d)</span>
                        <h3 className="text-2xl font-black text-amber-600 mt-2">{summary.dueSoonCount || 0}</h3>
                        <p className="text-[11px] text-amber-600/80 mt-0.5">Schedule inspection</p>
                    </Card>

                    <Card className="rounded-2xl border border-emerald-500/20 bg-emerald-500/5 p-4">
                        <span className="text-[11px] font-bold text-emerald-600 uppercase tracking-wider">Passed</span>
                        <h3 className="text-2xl font-black text-emerald-600 mt-2">{summary.passedCount || 0}</h3>
                        <p className="text-[11px] text-emerald-600/80 mt-0.5">Certified fit for use</p>
                    </Card>

                    <Card className="rounded-2xl border border-border/60 bg-card/60 backdrop-blur-md p-4">
                        <span className="text-[11px] font-bold text-muted-foreground uppercase tracking-wider">Failed / Repair</span>
                        <h3 className="text-2xl font-black text-red-600 mt-2">{summary.failedCount || 0}</h3>
                        <p className="text-[11px] text-muted-foreground mt-0.5">Quarantined / repair</p>
                    </Card>

                    <Card className="rounded-2xl border border-purple-500/20 bg-purple-500/5 p-4">
                        <span className="text-[11px] font-bold text-purple-600 uppercase tracking-wider">Life Extended</span>
                        <h3 className="text-2xl font-black text-purple-600 mt-2">{summary.lifeExtendedCount || 0}</h3>
                        <p className="text-[11px] text-purple-600/80 mt-0.5">+1 or +2 yrs granted</p>
                    </Card>
                </div>
            )}

            {activeTab === "scrap" && (
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5">
                    <Card className="rounded-2xl border border-border/60 bg-card/60 backdrop-blur-md p-4">
                        <div className="flex items-center justify-between">
                            <span className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Total Scrapped</span>
                            <Archive className="size-5 text-muted-foreground" />
                        </div>
                        <h3 className="text-3xl font-black text-foreground mt-2">{summary.totalScrapped || total || 0}</h3>
                        <p className="text-xs text-muted-foreground mt-1">End-of-life or unserviceable tools</p>
                    </Card>

                    <Card className="rounded-2xl border border-amber-500/20 bg-amber-500/5 backdrop-blur-md p-4">
                        <div className="flex items-center justify-between">
                            <span className="text-xs font-bold text-amber-600 uppercase tracking-wider">Pending Disposal</span>
                            <Clock className="size-5 text-amber-600" />
                        </div>
                        <h3 className="text-3xl font-black text-amber-600 mt-2">{summary.pendingCount || 0}</h3>
                        <p className="text-xs text-muted-foreground mt-1">In store scrap yards awaiting SDC</p>
                    </Card>

                    <Card className="rounded-2xl border border-emerald-500/20 bg-emerald-500/5 backdrop-blur-md p-4">
                        <div className="flex items-center justify-between">
                            <span className="text-xs font-bold text-emerald-600 uppercase tracking-wider">Disposed via SDC</span>
                            <CheckCircle2 className="size-5 text-emerald-600" />
                        </div>
                        <h3 className="text-3xl font-black text-emerald-600 mt-2">{summary.disposedCount || 0}</h3>
                        <p className="text-xs text-muted-foreground mt-1">Handed over to licensed scrap dealers</p>
                    </Card>
                </div>
            )}

            {activeTab === "subcontractors" && (
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3.5">
                    <Card className="rounded-2xl border border-border/60 bg-card/60 backdrop-blur-md p-4">
                        <span className="text-[11px] font-bold text-muted-foreground uppercase tracking-wider">Active Subcontractors</span>
                        <h3 className="text-2xl font-black mt-2">{summary.totalSubcontractors || total || 0}</h3>
                        <p className="text-[11px] text-muted-foreground mt-0.5">Engaged with tooling</p>
                    </Card>

                    <Card className="rounded-2xl border border-border/60 bg-card/60 backdrop-blur-md p-4">
                        <span className="text-[11px] font-bold text-muted-foreground uppercase tracking-wider">Equipment in Field</span>
                        <h3 className="text-2xl font-black text-indigo-600 mt-2">{summary.totalToolsInField || 0}</h3>
                        <p className="text-[11px] text-muted-foreground mt-0.5">Current contractor holding</p>
                    </Card>

                    <Card className="rounded-2xl border border-border/60 bg-card/60 backdrop-blur-md p-4">
                        <span className="text-[11px] font-bold text-muted-foreground uppercase tracking-wider">Total Missing Tools</span>
                        <h3 className="text-2xl font-black text-rose-600 mt-2">{summary.totalMissingTools || 0}</h3>
                        <p className="text-[11px] text-muted-foreground mt-0.5">Lost under vendor custody</p>
                    </Card>

                    <Card className="rounded-2xl border border-border/60 bg-card/60 backdrop-blur-md p-4">
                        <span className="text-[11px] font-bold text-muted-foreground uppercase tracking-wider">Avg Return Compliance</span>
                        <h3 className="text-2xl font-black text-emerald-600 mt-2">{summary.averageComplianceRate || 100}%</h3>
                        <p className="text-[11px] text-muted-foreground mt-0.5">Fleet turnaround index</p>
                    </Card>
                </div>
            )}

            {activeTab === "logins" && (
                <div className="grid grid-cols-2 sm:grid-cols-5 gap-3.5">
                    <Card className="rounded-2xl border border-border/60 bg-card/60 backdrop-blur-md p-4">
                        <span className="text-[11px] font-bold text-muted-foreground uppercase tracking-wider">Total Attempts</span>
                        <h3 className="text-2xl font-black mt-2">{summary.total || total || 0}</h3>
                        <p className="text-[11px] text-muted-foreground mt-0.5">Logged authentications</p>
                    </Card>

                    <Card className="rounded-2xl border border-border/60 bg-card/60 backdrop-blur-md p-4">
                        <span className="text-[11px] font-bold text-muted-foreground uppercase tracking-wider">Direct Success</span>
                        <h3 className="text-2xl font-black text-emerald-600 mt-2">{summary.success || 0}</h3>
                        <p className="text-[11px] text-muted-foreground mt-0.5">Authorized logins</p>
                    </Card>

                    <Card className="rounded-2xl border border-border/60 bg-card/60 backdrop-blur-md p-4">
                        <span className="text-[11px] font-bold text-muted-foreground uppercase tracking-wider">Pending Approval</span>
                        <h3 className="text-2xl font-black text-amber-600 mt-2">{summary.pending || 0}</h3>
                        <p className="text-[11px] text-muted-foreground mt-0.5">Subuser approvals</p>
                    </Card>

                    <Card className="rounded-2xl border border-border/60 bg-card/60 backdrop-blur-md p-4">
                        <span className="text-[11px] font-bold text-muted-foreground uppercase tracking-wider">Failed</span>
                        <h3 className="text-2xl font-black text-rose-600 mt-2">{summary.failed || 0}</h3>
                        <p className="text-[11px] text-muted-foreground mt-0.5">Bad credentials</p>
                    </Card>

                    <Card className="rounded-2xl border border-border/60 bg-card/60 backdrop-blur-md p-4">
                        <span className="text-[11px] font-bold text-muted-foreground uppercase tracking-wider">Rejected</span>
                        <h3 className="text-2xl font-black text-red-600 mt-2">{summary.rejected || 0}</h3>
                        <p className="text-[11px] text-muted-foreground mt-0.5">Admin rejected</p>
                    </Card>
                </div>
            )}

            {/* Filter Bar */}
            <Card className="rounded-2xl border border-border/60 bg-card/50 backdrop-blur-md p-4 space-y-3">
                <div className="flex items-center justify-between flex-wrap gap-2">
                    <span className="text-xs font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
                        <Filter className="size-3.5 text-primary" /> Filter Register
                    </span>
                    {hasActiveFilters && (
                        <Button
                            variant="ghost"
                            size="sm"
                            onClick={clearFilters}
                            className="h-7 text-xs text-muted-foreground hover:text-foreground"
                        >
                            <RotateCcw className="size-3 mr-1" /> Reset Filters
                        </Button>
                    )}
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-2.5">
                    {/* Universal Search */}
                    <div className="relative lg:col-span-2">
                        <Search className="size-3.5 absolute left-3 top-3 text-muted-foreground" />
                        <Input
                            placeholder="Quick search by ID, Code, Description, Subcontractor..."
                            value={search}
                            onChange={e => { setSearch(e.target.value); setPage(1); }}
                            className="pl-9 h-9 text-xs rounded-xl"
                        />
                    </div>

                    {/* Project Filter */}
                    {activeTab !== "logins" && (
                        <select
                            value={selectedProject}
                            onChange={e => { setSelectedProject(e.target.value); setPage(1); }}
                            className="h-9 px-3 rounded-xl border border-input bg-background text-xs text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
                        >
                            <option value="All">All Projects</option>
                            {projects.map(p => (
                                <option key={p._id} value={p._id}>{p.name}</option>
                            ))}
                        </select>
                    )}

                    {/* Store Filter */}
                    {activeTab !== "logins" && activeTab !== "subcontractors" && (
                        <select
                            value={selectedStore}
                            disabled={selectedProject === "All"}
                            onChange={e => { setSelectedStore(e.target.value); setPage(1); }}
                            className="h-9 px-3 rounded-xl border border-input bg-background text-xs text-foreground focus:outline-none focus:ring-1 focus:ring-primary disabled:opacity-50"
                        >
                            <option value="All">
                                {selectedProject === "All" ? "Select Project First" : "All Stores / HUBs"}
                            </option>
                            {stores.map(s => (
                                <option key={s._id} value={s._id}>{s.name}</option>
                            ))}
                        </select>
                    )}

                    {/* Vendor / Subcontractor Filter */}
                    {(activeTab === "tools" || activeTab === "challans" || activeTab === "missing") && (
                        <select
                            value={selectedVendor}
                            onChange={e => { setSelectedVendor(e.target.value); setPage(1); }}
                            className="h-9 px-3 rounded-xl border border-input bg-background text-xs text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
                        >
                            <option value="All">All Vendors / Subcontractors</option>
                            {vendors.map(v => (
                                <option key={v._id} value={v._id}>{v.name}</option>
                            ))}
                        </select>
                    )}

                    {/* Tab Specific Filters */}
                    {activeTab === "tools" && (
                        <>
                            <select
                                value={toolStatus}
                                onChange={e => { setToolStatus(e.target.value); setPage(1); }}
                                className="h-9 px-3 rounded-xl border border-input bg-background text-xs text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
                            >
                                <option value="All">All Tool Statuses</option>
                                <option value="Available">Available</option>
                                <option value="Moving">Moving / Transit</option>
                                <option value="Issued">Issued</option>
                                <option value="Repair">Under Repair</option>
                                <option value="Missing">Missing</option>
                                <option value="Scrapped">Scrapped</option>
                            </select>

                            <select
                                value={toolPrinted}
                                onChange={e => { setToolPrinted(e.target.value); setPage(1); }}
                                className="h-9 px-3 rounded-xl border border-input bg-background text-xs text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
                            >
                                <option value="All">All QR Status</option>
                                <option value="Yes">QR Printed</option>
                                <option value="No">Not Printed</option>
                            </select>
                        </>
                    )}

                    {activeTab === "challans" && (
                        <>
                            <select
                                value={challanType}
                                onChange={e => { setChallanType(e.target.value); setPage(1); }}
                                className="h-9 px-3 rounded-xl border border-input bg-background text-xs text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
                            >
                                <option value="All">All Challan Types</option>
                                <option value="Delivery">Delivery (DC)</option>
                                <option value="Return">Return (RC)</option>
                                <option value="Transfer">Store Transfer (STC)</option>
                                <option value="Scrap">Scrap (SDC)</option>
                            </select>

                            <select
                                value={challanStatus}
                                onChange={e => { setChallanStatus(e.target.value); setPage(1); }}
                                className="h-9 px-3 rounded-xl border border-input bg-background text-xs text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
                            >
                                <option value="All">All Challan Statuses</option>
                                <option value="Active">Active (In Circulation)</option>
                                <option value="Completed">Completed / Returned</option>
                                <option value="Cancelled">Cancelled</option>
                            </select>
                        </>
                    )}

                    {activeTab === "inspections" && (
                        <>
                            <select
                                value={inspectionCompliance}
                                onChange={e => { setInspectionCompliance(e.target.value); setPage(1); }}
                                className="h-9 px-3 rounded-xl border border-input bg-background text-xs text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
                            >
                                <option value="All">All Compliance States</option>
                                <option value="Overdue">Overdue Only</option>
                                <option value="DueSoon">Due in 30 Days</option>
                                <option value="Valid">Valid & Certified</option>
                                <option value="LifeExtended">Life Extended</option>
                            </select>

                            <select
                                value={lifeExtension}
                                onChange={e => { setLifeExtension(e.target.value); setPage(1); }}
                                className="h-9 px-3 rounded-xl border border-input bg-background text-xs text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
                            >
                                <option value="All">All Life Extensions</option>
                                <option value="1">+1 Year Extension</option>
                                <option value="2">+2 Years Extension</option>
                                <option value="None">No Extension</option>
                            </select>
                        </>
                    )}

                    {activeTab === "scrap" && (
                        <>
                            <select
                                value={scrapDisposalStatus}
                                onChange={e => { setScrapDisposalStatus(e.target.value); setPage(1); }}
                                className="h-9 px-3 rounded-xl border border-input bg-background text-xs text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
                            >
                                <option value="All">All Disposal States</option>
                                <option value="Pending">Pending Disposal</option>
                                <option value="Disposed">Disposed via SDC</option>
                            </select>

                            <select
                                value={scrapDealerFilter}
                                onChange={e => { setScrapDealerFilter(e.target.value); setPage(1); }}
                                className="h-9 px-3 rounded-xl border border-input bg-background text-xs text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
                            >
                                <option value="All">All Scrap Dealers</option>
                                {scrapDealers.map(d => (
                                    <option key={d._id} value={d._id}>{d.name}</option>
                                ))}
                            </select>
                        </>
                    )}

                    {activeTab === "subcontractors" && (
                        <select
                            value={complianceTier}
                            onChange={e => { setComplianceTier(e.target.value); setPage(1); }}
                            className="h-9 px-3 rounded-xl border border-input bg-background text-xs text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
                        >
                            <option value="All">All Compliance Ratings</option>
                            <option value="High">High Return Rate (&ge; 90%)</option>
                            <option value="Medium">Medium Return Rate (60-90%)</option>
                            <option value="Low">Low / Defaulter (&lt; 60%)</option>
                        </select>
                    )}

                    {activeTab === "logins" && (
                        <>
                            <select
                                value={loginRole}
                                onChange={e => { setLoginRole(e.target.value); setPage(1); }}
                                className="h-9 px-3 rounded-xl border border-input bg-background text-xs text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
                            >
                                <option value="All">All User Roles</option>
                                <option value="Admin">Admin</option>
                                <option value="User">Standard User</option>
                                <option value="Subuser">Subuser</option>
                                <option value="Vendor">Vendor</option>
                                <option value="Guest">Guest</option>
                            </select>

                            <select
                                value={loginStatus}
                                onChange={e => { setLoginStatus(e.target.value); setPage(1); }}
                                className="h-9 px-3 rounded-xl border border-input bg-background text-xs text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
                            >
                                <option value="All">All Login Statuses</option>
                                <option value="Success">Success (Direct)</option>
                                <option value="Pending Approval">Pending Approval</option>
                                <option value="Approved">Approved</option>
                                <option value="Rejected">Rejected</option>
                                <option value="Failed">Failed (Invalid)</option>
                            </select>
                        </>
                    )}
                </div>

                {/* Date Presets and Range */}
                <div className="flex flex-wrap items-center justify-between gap-3 pt-2 border-t border-border/50 text-xs">
                    <div className="flex items-center gap-2 flex-wrap">
                        <Calendar className="size-3.5 text-muted-foreground" />
                        <span className="font-semibold text-muted-foreground">Date Range:</span>
                        <Input
                            type="date"
                            className="h-8 w-36 text-xs rounded-lg"
                            value={startDate}
                            onChange={e => { setStartDate(e.target.value); setPage(1); }}
                        />
                        <span className="text-muted-foreground">to</span>
                        <Input
                            type="date"
                            className="h-8 w-36 text-xs rounded-lg"
                            value={endDate}
                            onChange={e => { setEndDate(e.target.value); setPage(1); }}
                        />

                        <div className="flex items-center gap-1 ml-2">
                            <Button variant="ghost" size="sm" onClick={() => handleDatePreset("today")} className="h-7 text-[11px] px-2">
                                Today
                            </Button>
                            <Button variant="ghost" size="sm" onClick={() => handleDatePreset("month")} className="h-7 text-[11px] px-2">
                                This Month
                            </Button>
                            <Button variant="ghost" size="sm" onClick={() => handleDatePreset("30days")} className="h-7 text-[11px] px-2">
                                Last 30 Days
                            </Button>
                        </div>
                    </div>

                    {activeTab === "challans" && (
                        <label className="flex items-center gap-2 cursor-pointer select-none text-xs font-semibold text-foreground/80">
                            <input
                                type="checkbox"
                                checked={outstandingOnly}
                                onChange={e => { setOutstandingOnly(e.target.checked); setPage(1); }}
                                className="rounded text-primary focus:ring-primary size-3.5"
                            />
                            <span>Show Outstanding DCs Only</span>
                        </label>
                    )}
                </div>
            </Card>

            {/* Data Table Register */}
            <Card className="rounded-[22px] border border-border/60 bg-card/40 backdrop-blur-md shadow-xs overflow-hidden">
                <CardHeader className="border-b border-border/50 bg-muted/20 px-6 py-3.5">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                        <div>
                            <CardTitle className="text-sm sm:text-base font-bold text-foreground flex items-center gap-2">
                                <span className="capitalize">{activeTab}</span> Register
                                <span className="text-xs font-normal text-muted-foreground">
                                    ({total} records found)
                                </span>
                            </CardTitle>
                            <CardDescription className="text-xs">
                                Showing {data.length} records matching current criteria.
                            </CardDescription>
                        </div>
                        <div className="flex items-center gap-2 text-xs">
                            <span className="text-muted-foreground font-medium">Rows per page:</span>
                            <select
                                value={limit}
                                onChange={e => { setLimit(Number(e.target.value)); setPage(1); }}
                                className="h-8 px-2.5 rounded-lg border border-input bg-background text-xs font-semibold"
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
                        <div className="py-20 text-center text-muted-foreground flex flex-col items-center justify-center">
                            <Loader2 className="size-8 animate-spin text-primary mb-3" />
                            <p className="text-xs font-semibold animate-pulse">Querying real-time enterprise registers...</p>
                        </div>
                    ) : data.length === 0 ? (
                        <div className="py-20 text-center text-muted-foreground">
                            <Package className="size-10 text-muted-foreground/30 mx-auto mb-3" />
                            <h3 className="font-semibold text-sm text-foreground">No matching records found</h3>
                            <p className="text-xs mt-1">Adjust your search terms or reset applied filters.</p>
                        </div>
                    ) : (
                        <table className="w-full text-xs text-left border-collapse">
                            {/* Tools Table Head */}
                            {activeTab === "tools" && (
                                <thead className="bg-muted/40 border-b border-border/60">
                                    <tr>
                                        {renderSortHeader("Tool ID", "toolId")}
                                        {renderSortHeader("Description", "description")}
                                        <th className="px-4 py-3 text-[11px] font-semibold uppercase text-muted-foreground">Category</th>
                                        <th className="px-4 py-3 text-[11px] font-semibold uppercase text-muted-foreground">Project & Store</th>
                                        {renderSortHeader("Status", "status")}
                                        <th className="px-4 py-3 text-[11px] font-semibold uppercase text-muted-foreground">Subcontractor</th>
                                        <th className="px-4 py-3 text-[11px] font-semibold uppercase text-muted-foreground">SWL / Cap</th>
                                        {renderSortHeader("Inspection Due", "nextInspectionDueDate")}
                                        <th className="px-4 py-3 text-[11px] font-semibold uppercase text-muted-foreground text-center">QR Print</th>
                                    </tr>
                                </thead>
                            )}

                            {/* Challans Table Head */}
                            {activeTab === "challans" && (
                                <thead className="bg-muted/40 border-b border-border/60">
                                    <tr>
                                        {renderSortHeader("Challan No", "challanNumber")}
                                        <th className="px-4 py-3 text-[11px] font-semibold uppercase text-muted-foreground">Type</th>
                                        {renderSortHeader("Status", "status")}
                                        {renderSortHeader("Date", "challanDate")}
                                        <th className="px-4 py-3 text-[11px] font-semibold uppercase text-muted-foreground">Project</th>
                                        <th className="px-4 py-3 text-[11px] font-semibold uppercase text-muted-foreground">Source Store</th>
                                        <th className="px-4 py-3 text-[11px] font-semibold uppercase text-muted-foreground">Subcontractor / Destination</th>
                                        <th className="px-4 py-3 text-[11px] font-semibold uppercase text-muted-foreground text-center">Dispatched</th>
                                        <th className="px-4 py-3 text-[11px] font-semibold uppercase text-muted-foreground text-center">Returned</th>
                                        <th className="px-4 py-3 text-[11px] font-semibold uppercase text-muted-foreground text-center">Outstanding</th>
                                    </tr>
                                </thead>
                            )}

                            {/* Missing Table Head */}
                            {activeTab === "missing" && (
                                <thead className="bg-muted/40 border-b border-border/60">
                                    <tr>
                                        {renderSortHeader("Tool ID", "toolIdStr")}
                                        {renderSortHeader("Description", "description")}
                                        <th className="px-4 py-3 text-[11px] font-semibold uppercase text-muted-foreground">Project & Store</th>
                                        {renderSortHeader("Subcontractor", "vendorName")}
                                        <th className="px-4 py-3 text-[11px] font-semibold uppercase text-muted-foreground">DC Number</th>
                                        <th className="px-4 py-3 text-[11px] font-semibold uppercase text-muted-foreground">RC Number</th>
                                        {renderSortHeader("Missing Since", "missingDate")}
                                        <th className="px-4 py-3 text-[11px] font-semibold uppercase text-muted-foreground">Reported By</th>
                                        <th className="px-4 py-3 text-[11px] font-semibold uppercase text-muted-foreground">Remarks</th>
                                    </tr>
                                </thead>
                            )}

                            {/* Inspections Table Head */}
                            {activeTab === "inspections" && (
                                <thead className="bg-muted/40 border-b border-border/60">
                                    <tr>
                                        {renderSortHeader("Tool ID", "toolId")}
                                        {renderSortHeader("Description", "description")}
                                        <th className="px-4 py-3 text-[11px] font-semibold uppercase text-muted-foreground">Project & Store</th>
                                        <th className="px-4 py-3 text-[11px] font-semibold uppercase text-muted-foreground text-center">Tool Age</th>
                                        {renderSortHeader("Next Due Date", "nextInspectionDueDate")}
                                        <th className="px-4 py-3 text-[11px] font-semibold uppercase text-muted-foreground">Compliance</th>
                                        <th className="px-4 py-3 text-[11px] font-semibold uppercase text-muted-foreground text-center">Result</th>
                                        <th className="px-4 py-3 text-[11px] font-semibold uppercase text-muted-foreground">Inspected By</th>
                                        <th className="px-4 py-3 text-[11px] font-semibold uppercase text-muted-foreground text-center">Life Extension</th>
                                    </tr>
                                </thead>
                            )}

                            {/* Scrap Table Head */}
                            {activeTab === "scrap" && (
                                <thead className="bg-muted/40 border-b border-border/60">
                                    <tr>
                                        {renderSortHeader("Tool ID", "toolId")}
                                        {renderSortHeader("Description", "description")}
                                        <th className="px-4 py-3 text-[11px] font-semibold uppercase text-muted-foreground">Project & Store</th>
                                        {renderSortHeader("Scrapped Date", "scrappedAt")}
                                        <th className="px-4 py-3 text-[11px] font-semibold uppercase text-muted-foreground">Scrapped By</th>
                                        <th className="px-4 py-3 text-[11px] font-semibold uppercase text-muted-foreground">Scrap Reason</th>
                                        <th className="px-4 py-3 text-[11px] font-semibold uppercase text-muted-foreground">Disposal Status</th>
                                        <th className="px-4 py-3 text-[11px] font-semibold uppercase text-muted-foreground">Scrap Dealer</th>
                                        <th className="px-4 py-3 text-[11px] font-semibold uppercase text-muted-foreground">Disposal Challan</th>
                                    </tr>
                                </thead>
                            )}

                            {/* Subcontractor Table Head */}
                            {activeTab === "subcontractors" && (
                                <thead className="bg-muted/40 border-b border-border/60">
                                    <tr>
                                        {renderSortHeader("Subcontractor Name", "name")}
                                        {renderSortHeader("Code", "code")}
                                        <th className="px-4 py-3 text-[11px] font-semibold uppercase text-muted-foreground">Contact</th>
                                        <th className="px-4 py-3 text-[11px] font-semibold uppercase text-muted-foreground text-center">DCs</th>
                                        <th className="px-4 py-3 text-[11px] font-semibold uppercase text-muted-foreground text-center">RCs</th>
                                        {renderSortHeader("Dispatched", "totalDispatched", "text-center")}
                                        {renderSortHeader("Returned", "totalReturned", "text-center")}
                                        {renderSortHeader("Missing", "totalMissing", "text-center")}
                                        {renderSortHeader("In Field (Holding)", "holdingCount", "text-center")}
                                        {renderSortHeader("Return Compliance", "returnComplianceRate", "text-center")}
                                    </tr>
                                </thead>
                            )}

                            {/* Logins Table Head */}
                            {activeTab === "logins" && (
                                <thead className="bg-muted/40 border-b border-border/60">
                                    <tr>
                                        <th className="px-4 py-3 text-[11px] font-semibold uppercase text-muted-foreground">User</th>
                                        <th className="px-4 py-3 text-[11px] font-semibold uppercase text-muted-foreground">Role</th>
                                        <th className="px-4 py-3 text-[11px] font-semibold uppercase text-muted-foreground">Parent User</th>
                                        {renderSortHeader("Login Time", "loginAt")}
                                        {renderSortHeader("Status", "status")}
                                        <th className="px-4 py-3 text-[11px] font-semibold uppercase text-muted-foreground">Approval Decision</th>
                                        <th className="px-4 py-3 text-[11px] font-semibold uppercase text-muted-foreground">Device / IP</th>
                                    </tr>
                                </thead>
                            )}

                            {/* Table Body */}
                            <tbody className="divide-y divide-border/40">
                                {data.map((item: any, idx: number) => {
                                    // 1. Tools Row
                                    if (activeTab === "tools") {
                                        return (
                                            <tr key={item._id || idx} className="hover:bg-muted/30 transition-colors">
                                                <td className="px-4 py-3 font-mono font-bold text-primary text-xs">
                                                    <button
                                                        onClick={() => navigate(`/vt/${encodeURIComponent(item.toolId || item._id)}`)}
                                                        className="hover:underline flex items-center gap-1 cursor-pointer"
                                                        title="View tool details"
                                                    >
                                                        {item.toolId}
                                                        <ExternalLink className="size-2.5 opacity-60" />
                                                    </button>
                                                </td>
                                                <td className="px-4 py-3 font-medium text-foreground">
                                                    <div>{item.description}</div>
                                                    {item.toolCode && <span className="text-[10px] text-muted-foreground font-mono">Code: {item.toolCode}</span>}
                                                </td>
                                                <td className="px-4 py-3 text-muted-foreground">{item.toolType || item.toolVariant || "General"}</td>
                                                <td className="px-4 py-3">
                                                    <p className="font-semibold text-foreground">{item.project?.name || "Unassigned"}</p>
                                                    <p className="text-[10px] text-muted-foreground flex items-center gap-1 mt-0.5">
                                                        <MapPin className="size-2.5" /> {item.currentSite?.name || "Central Store"}
                                                    </p>
                                                </td>
                                                <td className="px-4 py-3">
                                                    <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                                                        item.status === "Available"
                                                            ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20"
                                                            : item.status === "Moving" || item.status === "Issued"
                                                            ? "bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 border border-indigo-500/20"
                                                            : item.status === "Missing"
                                                            ? "bg-rose-500/10 text-rose-600 dark:text-rose-400 border border-rose-500/20"
                                                            : (typeof item.status === "string" && item.status.toLowerCase().includes("repair"))
                                                            ? "bg-orange-500/10 text-orange-600 dark:text-orange-400 border border-orange-500/20 font-semibold"
                                                            : item.status === "Scrapped" || item.isScrapped
                                                            ? "bg-gray-500/10 text-gray-600 dark:text-gray-400 border border-gray-500/20"
                                                            : "bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20"
                                                    }`}>
                                                        {item.isScrapped && item.status !== "Scrapped" ? "Scrapped" : (typeof item.status === "string" && item.status.toLowerCase().includes("repair") ? "Under Repair" : item.status)}
                                                    </span>
                                                </td>
                                                <td className="px-4 py-3 text-muted-foreground">{item.subcontractorName || "-"}</td>
                                                <td className="px-4 py-3 font-mono text-[11px] text-muted-foreground">
                                                    {item.safeWorkingLoad || item.capacity || "-"}
                                                </td>
                                                <td className="px-4 py-3 font-mono text-[11px]">
                                                    {item.nextInspectionDueDate ? new Date(item.nextInspectionDueDate).toLocaleDateString("en-IN") : "-"}
                                                </td>
                                                <td className="px-4 py-3 text-center">
                                                    {item.isPrinted ? (
                                                        <span className="inline-flex items-center gap-1 text-[10px] font-bold text-emerald-600 bg-emerald-500/10 px-2 py-0.5 rounded-md border border-emerald-500/20">
                                                            <QrCode className="size-3" /> Printed
                                                        </span>
                                                    ) : (
                                                        <span className="text-[10px] text-muted-foreground font-medium">Unprinted</span>
                                                    )}
                                                </td>
                                            </tr>
                                        );
                                    }

                                    // 2. Challans Row
                                    if (activeTab === "challans") {
                                        return (
                                            <tr key={item._id || idx} className="hover:bg-muted/30 transition-colors">
                                                <td className="px-4 py-3 font-mono font-bold text-primary text-xs">
                                                    <button
                                                        onClick={() => navigate(`/challans/history`)}
                                                        className="hover:underline flex items-center gap-1 cursor-pointer"
                                                    >
                                                        {item.challanNumber}
                                                        <ExternalLink className="size-2.5 opacity-60" />
                                                    </button>
                                                </td>
                                                <td className="px-4 py-3">
                                                    <span className={`px-2 py-0.5 rounded-md text-[10px] font-bold ${
                                                        item.isScrapDC || item.challanType === "Scrap"
                                                            ? "bg-amber-500/10 text-amber-600 border border-amber-500/20"
                                                            : item.challanType === "Delivery"
                                                            ? "bg-blue-500/10 text-blue-600 border border-blue-500/20"
                                                            : item.challanType === "Return"
                                                            ? "bg-emerald-500/10 text-emerald-600 border border-emerald-500/20"
                                                            : "bg-purple-500/10 text-purple-600 border border-purple-500/20"
                                                    }`}>
                                                        {item.isScrapDC ? "Scrap DC" : item.challanType}
                                                    </span>
                                                </td>
                                                <td className="px-4 py-3">
                                                    <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                                                        item.status === "Active"
                                                            ? "bg-indigo-500/10 text-indigo-600 border border-indigo-500/20"
                                                            : item.status === "Completed"
                                                            ? "bg-emerald-500/10 text-emerald-600 border border-emerald-500/20"
                                                            : "bg-gray-500/10 text-gray-600 border border-gray-500/20"
                                                    }`}>
                                                        {item.status}
                                                    </span>
                                                </td>
                                                <td className="px-4 py-3 font-mono text-[11px] text-muted-foreground">
                                                    {item.challanDate ? new Date(item.challanDate).toLocaleDateString("en-IN") : "-"}
                                                </td>
                                                <td className="px-4 py-3 font-medium text-foreground">{item.project?.name || "-"}</td>
                                                <td className="px-4 py-3 text-muted-foreground">{item.sourceStore?.name || "-"}</td>
                                                <td className="px-4 py-3 text-foreground font-semibold">
                                                    {item.vendor?.name || item.subcontractorName || item.destinationStore?.name || "-"}
                                                </td>
                                                <td className="px-4 py-3 text-center font-mono font-bold text-blue-600">{item.toolCount || 0}</td>
                                                <td className="px-4 py-3 text-center font-mono font-bold text-emerald-600">{item.returnedCount || 0}</td>
                                                <td className="px-4 py-3 text-center font-mono font-bold text-amber-600">
                                                    {item.outstandingTools || 0}
                                                </td>
                                            </tr>
                                        );
                                    }

                                    // 3. Missing Tools Row
                                    if (activeTab === "missing") {
                                        return (
                                            <tr key={item._id || idx} className="hover:bg-muted/30 transition-colors">
                                                <td className="px-4 py-3 font-mono font-bold text-rose-600 text-xs">
                                                    {item.toolIdStr}
                                                </td>
                                                <td className="px-4 py-3 font-medium text-foreground">
                                                    <div>{item.description}</div>
                                                    {item.toolCode && <span className="text-[10px] text-muted-foreground font-mono">Code: {item.toolCode}</span>}
                                                </td>
                                                <td className="px-4 py-3">
                                                    <p className="font-semibold text-foreground">{item.project?.name || "-"}</p>
                                                    <p className="text-[10px] text-muted-foreground">{item.store?.name || "-"}</p>
                                                </td>
                                                <td className="px-4 py-3 font-semibold text-foreground">{item.vendorName || "-"}</td>
                                                <td className="px-4 py-3 font-mono text-[11px] text-primary">{item.dcNumber || "-"}</td>
                                                <td className="px-4 py-3 font-mono text-[11px] text-emerald-600">{item.rcNumber || "-"}</td>
                                                <td className="px-4 py-3 font-mono text-[11px]">
                                                    {item.missingDate ? new Date(item.missingDate).toLocaleDateString("en-IN") : "-"}
                                                </td>
                                                <td className="px-4 py-3 text-muted-foreground">{item.reportedBy || "System"}</td>
                                                <td className="px-4 py-3 text-muted-foreground text-[11px] max-w-[200px] truncate" title={item.remarks}>
                                                    {item.remarks || "-"}
                                                </td>
                                            </tr>
                                        );
                                    }

                                    // 4. Inspections Row
                                    if (activeTab === "inspections") {
                                        const isOverdue = item.isOverdue;
                                        const isDueSoon = item.isDueSoon;

                                        return (
                                            <tr key={item._id || idx} className="hover:bg-muted/30 transition-colors">
                                                <td className="px-4 py-3 font-mono font-bold text-primary text-xs">
                                                    <button
                                                        onClick={() => navigate(`/vt/${encodeURIComponent(item.toolId || item._id)}`)}
                                                        className="hover:underline flex items-center gap-1 cursor-pointer"
                                                        title="View tool details"
                                                    >
                                                        {item.toolId}
                                                    </button>
                                                </td>
                                                <td className="px-4 py-3 font-medium text-foreground">{item.description}</td>
                                                <td className="px-4 py-3">
                                                    <p className="font-semibold">{item.project?.name || "-"}</p>
                                                    <p className="text-[10px] text-muted-foreground">{item.currentSite?.name || "-"}</p>
                                                </td>
                                                <td className="px-4 py-3 text-center font-mono font-semibold">
                                                    {item.toolAgeYears ? `${item.toolAgeYears} Yrs` : "< 1 Yr"}
                                                </td>
                                                <td className="px-4 py-3 font-mono text-[11px]">
                                                    {item.nextInspectionDueDate ? new Date(item.nextInspectionDueDate).toLocaleDateString("en-IN") : "-"}
                                                </td>
                                                <td className="px-4 py-3">
                                                    <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                                                        isOverdue
                                                            ? "bg-rose-500/10 text-rose-600 border border-rose-500/30 animate-pulse"
                                                            : isDueSoon
                                                            ? "bg-amber-500/15 text-amber-600 border border-amber-500/30"
                                                            : "bg-emerald-500/10 text-emerald-600 border border-emerald-500/20"
                                                    }`}>
                                                        {item.complianceBadge}
                                                    </span>
                                                </td>
                                                <td className="px-4 py-3 text-center">
                                                    <span className={`px-2 py-0.5 rounded-md text-[10px] font-bold ${
                                                        item.inspectionResult === "Pass"
                                                            ? "text-emerald-600 bg-emerald-500/10"
                                                            : item.inspectionResult === "Fail"
                                                            ? "text-rose-600 bg-rose-500/10"
                                                            : "text-muted-foreground bg-muted"
                                                    }`}>
                                                        {item.inspectionResult || "Pending"}
                                                    </span>
                                                </td>
                                                <td className="px-4 py-3 text-muted-foreground">{item.inspectedBy?.name || "-"}</td>
                                                <td className="px-4 py-3 text-center">
                                                    {item.lifeExtensionYears ? (
                                                        <span className="text-[10px] font-bold text-purple-600 bg-purple-500/10 px-2 py-0.5 rounded-md border border-purple-500/20">
                                                            +{item.lifeExtensionYears} Year(s)
                                                        </span>
                                                    ) : (
                                                        <span className="text-muted-foreground text-[11px]">-</span>
                                                    )}
                                                </td>
                                            </tr>
                                        );
                                    }

                                    // 5. Scrap Row
                                    if (activeTab === "scrap") {
                                        return (
                                            <tr key={item._id || idx} className="hover:bg-muted/30 transition-colors">
                                                <td className="px-4 py-3 font-mono font-bold text-amber-600 text-xs">
                                                    {item.toolId}
                                                </td>
                                                <td className="px-4 py-3 font-medium text-foreground">{item.description}</td>
                                                <td className="px-4 py-3">
                                                    <p className="font-semibold">{item.project?.name || "-"}</p>
                                                    <p className="text-[10px] text-muted-foreground">{item.currentSite?.name || "-"}</p>
                                                </td>
                                                <td className="px-4 py-3 font-mono text-[11px]">
                                                    {item.scrappedAt ? new Date(item.scrappedAt).toLocaleDateString("en-IN") : "-"}
                                                </td>
                                                <td className="px-4 py-3 text-muted-foreground">{item.scrappedBy?.name || "-"}</td>
                                                <td className="px-4 py-3 text-muted-foreground max-w-[200px] truncate" title={item.scrapReason}>
                                                    {item.scrapReason || "Damaged/Unusable"}
                                                </td>
                                                <td className="px-4 py-3">
                                                    <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                                                        item.isDisposed
                                                            ? "bg-emerald-500/10 text-emerald-600 border border-emerald-500/20"
                                                            : "bg-amber-500/15 text-amber-600 border border-amber-500/30"
                                                    }`}>
                                                        {item.isDisposed ? "Disposed" : "Pending Disposal"}
                                                    </span>
                                                </td>
                                                <td className="px-4 py-3 font-semibold text-foreground">{item.scrapDealer?.name || "-"}</td>
                                                <td className="px-4 py-3 font-mono text-[11px] text-primary">
                                                    {item.disposalChallanNumber || "-"}
                                                </td>
                                            </tr>
                                        );
                                    }

                                    // 6. Subcontractors Row
                                    if (activeTab === "subcontractors") {
                                        const comp = item.returnComplianceRate;
                                        return (
                                            <tr key={item._id || idx} className="hover:bg-muted/30 transition-colors">
                                                <td className="px-4 py-3 font-bold text-foreground">
                                                    {item.name}
                                                </td>
                                                <td className="px-4 py-3 font-mono text-xs text-primary">{item.code}</td>
                                                <td className="px-4 py-3 text-muted-foreground">
                                                    <p className="font-medium text-foreground">{item.contactPerson}</p>
                                                    <p className="text-[10px]">{item.contactPhone}</p>
                                                </td>
                                                <td className="px-4 py-3 text-center font-mono font-bold text-blue-600">{item.dcCount}</td>
                                                <td className="px-4 py-3 text-center font-mono font-bold text-emerald-600">{item.rcCount}</td>
                                                <td className="px-4 py-3 text-center font-mono">{item.totalDispatched}</td>
                                                <td className="px-4 py-3 text-center font-mono text-emerald-600">{item.totalReturned}</td>
                                                <td className="px-4 py-3 text-center font-mono text-rose-600 font-bold">{item.totalMissing}</td>
                                                <td className="px-4 py-3 text-center font-mono font-black text-indigo-600 bg-indigo-500/5">
                                                    {item.holdingCount}
                                                </td>
                                                <td className="px-4 py-3 text-center">
                                                    <div className="flex items-center justify-center gap-1.5">
                                                        <div className="w-16 h-2 rounded-full bg-muted overflow-hidden">
                                                            <div
                                                                className={`h-full ${comp >= 90 ? "bg-emerald-500" : comp >= 60 ? "bg-amber-500" : "bg-rose-500"}`}
                                                                style={{ width: `${Math.min(100, Math.max(0, comp))}%` }}
                                                            />
                                                        </div>
                                                        <span className="font-bold font-mono text-[11px]">{comp}%</span>
                                                    </div>
                                                </td>
                                            </tr>
                                        );
                                    }

                                    // 7. Logins Row
                                    if (activeTab === "logins") {
                                        const isSuccess = item.status === "Success" || item.status === "Approved";
                                        const isPending = item.status === "Pending Approval";

                                        return (
                                            <tr key={item._id || idx} className="hover:bg-muted/30 transition-colors">
                                                <td className="px-4 py-3">
                                                    <p className="font-bold text-foreground">{item.userName || item.userEmail}</p>
                                                    <p className="text-[10px] text-muted-foreground font-mono">{item.userEmail}</p>
                                                </td>
                                                <td className="px-4 py-3">
                                                    <span className="px-2 py-0.5 rounded-md text-[10px] font-bold uppercase tracking-wider bg-primary/10 text-primary">
                                                        {item.role}
                                                    </span>
                                                </td>
                                                <td className="px-4 py-3 text-muted-foreground">{item.parentUserName || "-"}</td>
                                                <td className="px-4 py-3 font-mono text-[11px]">
                                                    {item.loginAt ? new Date(item.loginAt).toLocaleString("en-IN") : "-"}
                                                </td>
                                                <td className="px-4 py-3">
                                                    <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                                                        isSuccess
                                                            ? "bg-emerald-500/10 text-emerald-600 border border-emerald-500/20"
                                                            : isPending
                                                            ? "bg-amber-500/15 text-amber-600 border border-amber-500/30"
                                                            : "bg-rose-500/10 text-rose-600 border border-rose-500/20"
                                                    }`}>
                                                        {item.status}
                                                    </span>
                                                </td>
                                                <td className="px-4 py-3">
                                                    {item.approverName || item.approvedBy?.name ? (
                                                        <span className="text-[11px] font-semibold text-emerald-600">
                                                            Approved by {item.approverName || item.approvedBy?.name}
                                                        </span>
                                                    ) : item.rejectionReason ? (
                                                        <span className="text-[11px] text-red-600">{item.rejectionReason}</span>
                                                    ) : (
                                                        <span className="text-muted-foreground">-</span>
                                                    )}
                                                </td>
                                                <td className="px-4 py-3 text-muted-foreground text-[11px]">
                                                    <p className="truncate max-w-[140px]">{item.deviceInfo || "Browser"}</p>
                                                    <p className="font-mono text-[10px]">{item.ipAddress || "-"}</p>
                                                </td>
                                            </tr>
                                        );
                                    }

                                    return null;
                                })}
                            </tbody>
                        </table>
                    )}
                </CardContent>

                {/* Pagination Controls */}
                {totalPages > 1 && (
                    <div className="p-4 border-t border-border/50 bg-muted/10 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs">
                        <span className="text-muted-foreground">
                            Page <strong className="text-foreground">{page}</strong> of <strong className="text-foreground">{totalPages}</strong> ({total} total records)
                        </span>

                        <div className="flex items-center gap-1.5">
                            <Button
                                variant="outline"
                                size="sm"
                                disabled={page <= 1 || loading}
                                onClick={() => setPage(p => Math.max(p - 1, 1))}
                                className="h-8 text-xs flex items-center gap-1 rounded-xl"
                            >
                                <ChevronLeft className="size-3.5" /> Previous
                            </Button>
                            <Button
                                variant="outline"
                                size="sm"
                                disabled={page >= totalPages || loading}
                                onClick={() => setPage(p => Math.min(p + 1, totalPages))}
                                className="h-8 text-xs flex items-center gap-1 rounded-xl"
                            >
                                Next <ChevronRight className="size-3.5" />
                            </Button>
                        </div>
                    </div>
                )}
            </Card>
        </div>
    );
}

export default ReportsPage;
