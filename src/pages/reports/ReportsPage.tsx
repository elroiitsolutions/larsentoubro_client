import React, { useState, useEffect } from "react";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
    FileText,
    Download,
    Filter,
    RotateCcw,
    Calendar,
    Building2,
    Truck,
    AlertTriangle,
    BarChart3,
    Table as TableIcon,
    Loader2,
    RefreshCw,
    Clock,
    FileSpreadsheet,
    FileCode
} from "lucide-react";
import reportService from "@/services/report.service";
import vendorService, { type VendorRecord } from "@/services/vendor.service";
import { toast } from "sonner";

export function ReportsPage() {
    const [activeTab, setActiveTab] = useState<"challans" | "movement" | "vendor_holding" | "missing" | "store_summary">("challans");
    const [loading, setLoading] = useState(false);
    const [exporting, setExporting] = useState(false);

    // Data states
    const [data, setData] = useState<any[]>([]);
    const [vendors, setVendors] = useState<VendorRecord[]>([]);

    // Filter states
    const [startDate, setStartDate] = useState("");
    const [endDate, setEndDate] = useState("");
    const [search, setSearch] = useState("");

    useEffect(() => {
        const loadVendors = async () => {
            try {
                const res = await vendorService.getVendors({ limit: 100, status: "Active" });
                setVendors(res.data || []);
            } catch (err) {
                console.error("Error loading vendors:", err);
            }
        };
        loadVendors();
    }, []);

    const fetchReportData = async () => {
        try {
            setLoading(true);
            const params = { startDate, endDate, search };
            let res: any;
            if (activeTab === "challans") {
                res = await reportService.getChallansReport(params);
            } else if (activeTab === "movement") {
                res = await reportService.getMovementReport(params);
            } else if (activeTab === "vendor_holding") {
                res = await reportService.getVendorHoldingReport(params);
            } else if (activeTab === "missing") {
                res = await reportService.getMissingToolsReport(params);
            } else if (activeTab === "store_summary") {
                res = await reportService.getStoreSummaryReport(params);
            }
            setData(res?.data || []);
        } catch (err) {
            toast.error("Failed to load report data");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchReportData();
    }, [activeTab, startDate, endDate]);

    const handleExport = async (exportType: "excel" | "csv") => {
        try {
            setExporting(true);
            const blob = await reportService.exportReport(activeTab, {
                exportType,
                startDate,
                endDate,
                search
            });

            const url = window.URL.createObjectURL(blob);
            const a = document.createElement("a");
            a.href = url;
            a.download = `LNT_Report_${activeTab}_${new Date().toISOString().split("T")[0]}.${exportType === "excel" ? "xlsx" : "csv"}`;
            document.body.appendChild(a);
            a.click();
            window.URL.revokeObjectURL(url);
            document.body.removeChild(a);
            toast.success("Report export downloaded successfully!");
        } catch (err) {
            toast.error("Failed to export report");
        } finally {
            setExporting(false);
        }
    };

    const tabs = [
        { id: "challans", label: "Challan Register", icon: FileText, desc: "All DC & RC entries" },
        { id: "movement", label: "Tool Movement Audit", icon: Truck, desc: "Complete dispatch & return history" },
        { id: "vendor_holding", label: "Vendor Tool Holding & Aging", icon: Clock, desc: "Tools currently with vendors" },
        { id: "missing", label: "Missing Tools Register", icon: AlertTriangle, desc: "Tools lost or missing during returns" },
        { id: "store_summary", label: "Store Summary", icon: BarChart3, desc: "Store-wise tool movement stats" }
    ];

    return (
        <div className="p-6 max-w-7xl mx-auto space-y-6">
            {/* Page Header */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-bold tracking-tight text-foreground flex items-center gap-2.5">
                        <BarChart3 className="size-6 text-primary" />
                        Challan & Inventory Reports
                    </h1>
                    <p className="text-sm text-muted-foreground mt-0.5">
                        Generate comprehensive L&T audit reports, vendor aging analyses, and missing tool logs.
                    </p>
                </div>

                <div className="flex items-center gap-2">
                    <Button
                        variant="outline"
                        size="sm"
                        disabled={exporting || loading}
                        onClick={() => handleExport("excel")}
                        className="flex items-center gap-1.5 text-xs font-semibold bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 hover:bg-emerald-500/20 border-emerald-500/30"
                    >
                        <FileSpreadsheet className="size-4 text-emerald-600" />
                        <span>Export Excel (.xlsx)</span>
                    </Button>

                    <Button
                        variant="outline"
                        size="sm"
                        disabled={exporting || loading}
                        onClick={() => handleExport("csv")}
                        className="flex items-center gap-1.5 text-xs font-semibold"
                    >
                        <FileCode className="size-4 text-blue-600" />
                        <span>Export CSV (.csv)</span>
                    </Button>
                </div>
            </div>

            {/* Navigation Tabs */}
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-2.5">
                {tabs.map(t => {
                    const Icon = t.icon;
                    const isActive = activeTab === t.id;
                    return (
                        <button
                            key={t.id}
                            type="button"
                            onClick={() => setActiveTab(t.id as any)}
                            className={`p-3.5 rounded-xl border text-left transition-all flex flex-col justify-between h-24 ${
                                isActive
                                    ? "bg-primary/5 border-primary ring-2 ring-primary/20 shadow-sm"
                                    : "bg-card hover:bg-muted/50 border-border text-muted-foreground hover:text-foreground"
                            }`}
                        >
                            <div className="flex items-center justify-between">
                                <Icon className={`size-5 ${isActive ? "text-primary" : "text-muted-foreground"}`} />
                                {isActive && <div className="size-2 rounded-full bg-primary" />}
                            </div>
                            <div>
                                <h4 className="text-xs font-bold text-foreground line-clamp-1">{t.label}</h4>
                                <p className="text-[11px] text-muted-foreground line-clamp-1">{t.desc}</p>
                            </div>
                        </button>
                    );
                })}
            </div>

            {/* Filter Bar */}
            <Card>
                <CardHeader className="pb-3">
                    <CardTitle className="text-sm font-bold flex items-center justify-between">
                        <span className="flex items-center gap-1.5">
                            <Filter className="size-4 text-primary" /> Filter Report Data
                        </span>
                        <Button
                            variant="ghost"
                            size="sm"
                            onClick={fetchReportData}
                            className="h-7 text-xs flex items-center gap-1"
                        >
                            <RefreshCw className="size-3.5" /> Refresh
                        </Button>
                    </CardTitle>
                </CardHeader>
                <CardContent className="flex flex-wrap items-center gap-3">
                    <div className="flex items-center gap-2 text-xs">
                        <Calendar className="size-4 text-muted-foreground" />
                        <span className="font-semibold text-muted-foreground">From:</span>
                        <Input
                            type="date"
                            className="h-8 w-36 text-xs"
                            value={startDate}
                            onChange={e => setStartDate(e.target.value)}
                        />
                        <span className="font-semibold text-muted-foreground">To:</span>
                        <Input
                            type="date"
                            className="h-8 w-36 text-xs"
                            value={endDate}
                            onChange={e => setEndDate(e.target.value)}
                        />
                    </div>

                    {(startDate || endDate) && (
                        <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => { setStartDate(""); setEndDate(""); }}
                            className="h-8 text-xs text-muted-foreground"
                        >
                            <RotateCcw className="size-3.5 mr-1" /> Clear Dates
                        </Button>
                    )}
                </CardContent>
            </Card>

            {/* Report Display Card */}
            <Card>
                <CardHeader className="border-b bg-muted/20 pb-3">
                    <CardTitle className="text-base font-bold flex items-center gap-2">
                        <TableIcon className="size-4 text-primary" />
                        {tabs.find(t => t.id === activeTab)?.label}
                    </CardTitle>
                    <CardDescription className="text-xs">
                        Showing {data.length} audit record(s) matching your criteria.
                    </CardDescription>
                </CardHeader>
                <CardContent className="p-0 overflow-x-auto">
                    {loading ? (
                        <div className="p-20 text-center text-muted-foreground flex flex-col items-center justify-center">
                            <Loader2 className="size-8 animate-spin text-primary mb-3" />
                            <p className="text-sm font-medium animate-pulse">Generating L&T audit report...</p>
                        </div>
                    ) : data.length === 0 ? (
                        <div className="p-20 text-center text-muted-foreground">
                            <FileText className="size-10 text-muted-foreground/40 mx-auto mb-3" />
                            <h3 className="font-semibold text-base text-foreground">No records found for this report</h3>
                            <p className="text-xs mt-1">Try expanding your date filter or generating a different report.</p>
                        </div>
                    ) : (
                        <table className="min-w-full text-sm text-left whitespace-nowrap">
                            {activeTab === "challans" && (
                                <>
                                    <thead className="bg-muted text-xs uppercase text-muted-foreground font-semibold border-b">
                                        <tr>
                                            <th className="px-6 py-3.5">Challan No.</th>
                                            <th className="px-6 py-3.5">Type</th>
                                            <th className="px-6 py-3.5">Vendor</th>
                                            <th className="px-6 py-3.5">Date</th>
                                            <th className="px-6 py-3.5 text-center">Items Qty</th>
                                            <th className="px-6 py-3.5">Status</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-border/50">
                                        {data.map((item: any, idx: number) => (
                                            <tr key={item._id || idx} className="hover:bg-muted/30">
                                                <td className="px-6 py-3.5 font-mono font-bold text-primary">{item.challanNumber}</td>
                                                <td className="px-6 py-3.5 font-semibold">{item.challanType}</td>
                                                <td className="px-6 py-3.5">{item.vendor?.name || "L&T Vendor"}</td>
                                                <td className="px-6 py-3.5">{new Date(item.challanDate).toLocaleDateString()}</td>
                                                <td className="px-6 py-3.5 text-center font-bold">{item.toolCount || 0}</td>
                                                <td className="px-6 py-3.5">
                                                    <span className="px-2.5 py-1 rounded-full bg-muted font-semibold text-xs">{item.status}</span>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </>
                            )}

                            {activeTab === "movement" && (
                                <>
                                    <thead className="bg-muted text-xs uppercase text-muted-foreground font-semibold border-b">
                                        <tr>
                                            <th className="px-6 py-3.5">Tool ID</th>
                                            <th className="px-6 py-3.5">Description</th>
                                            <th className="px-6 py-3.5">Vendor</th>
                                            <th className="px-6 py-3.5">Dispatch DC</th>
                                            <th className="px-6 py-3.5">Return RC</th>
                                            <th className="px-6 py-3.5">Status</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-border/50">
                                        {data.map((item: any, idx: number) => (
                                            <tr key={item._id || idx} className="hover:bg-muted/30">
                                                <td className="px-6 py-3.5 font-mono font-bold text-primary">{item.toolId}</td>
                                                <td className="px-6 py-3.5">{item.toolDescription || "Tool Item"}</td>
                                                <td className="px-6 py-3.5">{item.vendorName || "-"}</td>
                                                <td className="px-6 py-3.5 font-mono text-xs">{item.dcNumber || "-"}</td>
                                                <td className="px-6 py-3.5 font-mono text-xs">{item.rcNumber || "Pending"}</td>
                                                <td className="px-6 py-3.5">
                                                    <span className="px-2.5 py-1 rounded-full bg-muted font-semibold text-xs">{item.status}</span>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </>
                            )}

                            {activeTab === "vendor_holding" && (
                                <>
                                    <thead className="bg-muted text-xs uppercase text-muted-foreground font-semibold border-b">
                                        <tr>
                                            <th className="px-6 py-3.5">Vendor Name</th>
                                            <th className="px-6 py-3.5">Vendor Code</th>
                                            <th className="px-6 py-3.5 text-center">Tools Held</th>
                                            <th className="px-6 py-3.5 text-center">Active DCs</th>
                                            <th className="px-6 py-3.5 text-center">Total Value (₹)</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-border/50">
                                        {data.map((item: any, idx: number) => (
                                            <tr key={item.vendorId || idx} className="hover:bg-muted/30">
                                                <td className="px-6 py-3.5 font-bold text-foreground">{item.name}</td>
                                                <td className="px-6 py-3.5 font-mono text-xs">{item.vendorCode || "-"}</td>
                                                <td className="px-6 py-3.5 text-center font-bold text-blue-600">{item.toolsHeld || 0}</td>
                                                <td className="px-6 py-3.5 text-center font-semibold">{item.activeDcCount || 0}</td>
                                                <td className="px-6 py-3.5 text-center font-mono font-bold">₹ {Number(item.totalValue || 0).toLocaleString()}</td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </>
                            )}

                            {activeTab === "missing" && (
                                <>
                                    <thead className="bg-muted text-xs uppercase text-muted-foreground font-semibold border-b">
                                        <tr>
                                            <th className="px-6 py-3.5">Tool ID</th>
                                            <th className="px-6 py-3.5">Description</th>
                                            <th className="px-6 py-3.5">Reported Vendor</th>
                                            <th className="px-6 py-3.5">Return Challan</th>
                                            <th className="px-6 py-3.5">Date Reported</th>
                                            <th className="px-6 py-3.5">Remarks</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-border/50">
                                        {data.map((item: any, idx: number) => (
                                            <tr key={item._id || idx} className="hover:bg-muted/30 bg-rose-500/[0.03]">
                                                <td className="px-6 py-3.5 font-mono font-bold text-rose-600">{item.toolId}</td>
                                                <td className="px-6 py-3.5 font-medium">{item.toolDescription || "Tool Item"}</td>
                                                <td className="px-6 py-3.5">{item.vendorName || "Vendor"}</td>
                                                <td className="px-6 py-3.5 font-mono text-xs font-bold">{item.rcNumber || "-"}</td>
                                                <td className="px-6 py-3.5">{new Date(item.reportedDate || Date.now()).toLocaleDateString()}</td>
                                                <td className="px-6 py-3.5 text-xs text-muted-foreground">{item.remarks || "Marked missing during return"}</td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </>
                            )}

                            {activeTab === "store_summary" && (
                                <>
                                    <thead className="bg-muted text-xs uppercase text-muted-foreground font-semibold border-b">
                                        <tr>
                                            <th className="px-6 py-3.5">Store Name</th>
                                            <th className="px-6 py-3.5 text-center">Total Tools</th>
                                            <th className="px-6 py-3.5 text-center">Available</th>
                                            <th className="px-6 py-3.5 text-center">In Use / Moving</th>
                                            <th className="px-6 py-3.5 text-center">Missing</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-border/50">
                                        {data.map((item: any, idx: number) => (
                                            <tr key={item.storeId || idx} className="hover:bg-muted/30">
                                                <td className="px-6 py-3.5 font-bold">{item.storeName}</td>
                                                <td className="px-6 py-3.5 text-center font-bold">{item.totalTools || 0}</td>
                                                <td className="px-6 py-3.5 text-center font-semibold text-emerald-600">{item.available || 0}</td>
                                                <td className="px-6 py-3.5 text-center font-semibold text-blue-600">{item.inUse || 0}</td>
                                                <td className="px-6 py-3.5 text-center font-semibold text-rose-600">{item.missing || 0}</td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </>
                            )}
                        </table>
                    )}
                </CardContent>
            </Card>
        </div>
    );
}

export default ReportsPage;
