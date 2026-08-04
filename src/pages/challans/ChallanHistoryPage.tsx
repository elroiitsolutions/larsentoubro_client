import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { SearchableSelect } from "@/components/ui/searchable-select";
import {
    FileText,
    Search,
    Filter,
    RotateCcw,
    Download,
    Eye,
    Printer,
    ArrowRight,
    Truck,
    CheckCircle2,
    Clock,
    XCircle,
    Loader2,
    Calendar,
    Building2,
    RefreshCw
} from "lucide-react";
import challanService, { type ChallanRecord } from "@/services/challan.service";
import vendorService, { type VendorRecord } from "@/services/vendor.service";
import {
    getChallanStatusBadgeClass,
    getChallanTypeBadgeClass
} from "@/utils/challan/challanCalculations";
import { generateDeliveryChallanPDF, generateReturnChallanPDF } from "@/utils/pdf/challanPdfGenerator";
import { ChallanDetailModal } from "./ChallanDetailModal";
import { toast } from "sonner";

const challanTypes = ["All", "Delivery", "Return"];
const challanStatuses = ["All", "Active", "Completed", "Cancelled"];

export function ChallanHistoryPage() {
    const navigate = useNavigate();

    const [challans, setChallans] = useState<ChallanRecord[]>([]);
    const [vendors, setVendors] = useState<VendorRecord[]>([]);
    const [loading, setLoading] = useState(true);

    // Filters
    const [search, setSearch] = useState("");
    const [vendor, setVendor] = useState("All");
    const [status, setStatus] = useState("All");
    const [challanType, setChallanType] = useState("All");
    const [startDate, setStartDate] = useState("");
    const [endDate, setEndDate] = useState("");

    // Pagination
    const [page, setPage] = useState(1);
    const [limit] = useState(15);
    const [total, setTotal] = useState(0);
    const [totalPages, setTotalPages] = useState(1);

    // Detail modal state
    const [selectedChallan, setSelectedChallan] = useState<ChallanRecord | null>(null);
    const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);

    const fetchVendors = async () => {
        try {
            const res = await vendorService.getVendors({ limit: 200, status: "Active" });
            setVendors(res.data || []);
        } catch (err) {
            console.error("Error fetching vendors:", err);
        }
    };

    const fetchChallans = async () => {
        try {
            setLoading(true);
            const res = await challanService.getChallans({
                page,
                limit,
                search,
                vendor,
                status,
                challanType,
                startDate,
                endDate
            });
            setChallans(res.data || []);
            setTotal(res.total || 0);
            setTotalPages(res.totalPages || 1);
        } catch (err) {
            toast.error("Failed to fetch challan history");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchVendors();
    }, []);

    useEffect(() => {
        fetchChallans();
    }, [page, search, vendor, status, challanType, startDate, endDate]);

    const resetFilters = () => {
        setSearch("");
        setVendor("All");
        setStatus("All");
        setChallanType("All");
        setStartDate("");
        setEndDate("");
        setPage(1);
    };

    const handleDownloadPdf = async (challan: ChallanRecord, e: React.MouseEvent) => {
        e.stopPropagation();
        try {
            if (challan.challanType === "Delivery") {
                await generateDeliveryChallanPDF(challan, { download: true });
            } else {
                await generateReturnChallanPDF(challan, { download: true });
            }
            await challanService.logPdfDownload(challan.challanNumber, "Downloaded from History table");
            toast.success(`Downloaded PDF for ${challan.challanNumber}`);
        } catch (err) {
            toast.error("PDF generation failed");
        }
    };

    const handleOpenDetails = (challan: ChallanRecord, e?: React.MouseEvent) => {
        if (e) e.stopPropagation();
        setSelectedChallan(challan);
        setIsDetailModalOpen(true);
    };

    const handleCreateReturnChallan = (challan: ChallanRecord, e: React.MouseEvent) => {
        e.stopPropagation();
        navigate(`/challans/return/preview/${challan._id}`, {
            state: { referenceDc: challan }
        });
    };

    // Calculate quick stats
    const activeDcCount = challans.filter(c => c.challanType === "Delivery" && c.status === "Active").length;
    const completedRcCount = challans.filter(c => c.challanType === "Return").length;

    const vendorOptions = [
        { label: "All Vendors", value: "All" },
        ...vendors.map(v => ({ label: `${v.name} (${v.vendorCode})`, value: v._id }))
    ];

    return (
        <div className="p-6 max-w-7xl mx-auto space-y-6">
            {/* Header Banner */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-bold tracking-tight text-foreground flex items-center gap-2.5">
                        <FileText className="size-6 text-primary" />
                        Challan History & Audit Logs
                    </h1>
                    <p className="text-sm text-muted-foreground mt-0.5">
                        Complete traceability for all Delivery Challans (DC) and Return Challans (RC) issued to vendors.
                    </p>
                </div>
                <div className="flex items-center gap-2">
                    <Button
                        variant="outline"
                        size="sm"
                        onClick={fetchChallans}
                        className="flex items-center gap-1.5"
                    >
                        <RefreshCw className="size-3.5" />
                        <span>Refresh</span>
                    </Button>
                </div>
            </div>

            {/* Stat Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <Card className="p-4 bg-card/60 backdrop-blur-sm border-border shadow-sm flex items-center justify-between">
                    <div>
                        <p className="text-xs font-semibold text-muted-foreground uppercase">Total Challans</p>
                        <p className="text-2xl font-bold text-foreground mt-1">{total}</p>
                        <p className="text-xs text-muted-foreground mt-0.5">DC & RC entries</p>
                    </div>
                    <div className="size-12 rounded-2xl bg-primary/10 flex items-center justify-center text-primary">
                        <FileText className="size-6" />
                    </div>
                </Card>

                <Card className="p-4 bg-card/60 backdrop-blur-sm border-border shadow-sm flex items-center justify-between">
                    <div>
                        <p className="text-xs font-semibold text-muted-foreground uppercase">Active DCs (Pending Return)</p>
                        <p className="text-2xl font-bold text-blue-600 mt-1">{activeDcCount}</p>
                        <p className="text-xs text-muted-foreground mt-0.5">Awaiting return challan</p>
                    </div>
                    <div className="size-12 rounded-2xl bg-blue-500/10 flex items-center justify-center text-blue-600">
                        <Clock className="size-6" />
                    </div>
                </Card>

                <Card className="p-4 bg-card/60 backdrop-blur-sm border-border shadow-sm flex items-center justify-between">
                    <div>
                        <p className="text-xs font-semibold text-muted-foreground uppercase">Completed RCs</p>
                        <p className="text-2xl font-bold text-emerald-600 mt-1">{completedRcCount}</p>
                        <p className="text-xs text-muted-foreground mt-0.5">Successfully returned</p>
                    </div>
                    <div className="size-12 rounded-2xl bg-emerald-500/10 flex items-center justify-center text-emerald-600">
                        <CheckCircle2 className="size-6" />
                    </div>
                </Card>
            </div>

            {/* Filter Bar */}
            <Card>
                <CardHeader className="pb-3">
                    <CardTitle className="text-base font-bold flex items-center gap-2">
                        <Filter className="size-4 text-primary" /> Filter Challans
                    </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-5 gap-3">
                        <div className="relative col-span-1 sm:col-span-2">
                            <Search className="size-4 absolute left-3 top-3 text-muted-foreground" />
                            <Input
                                placeholder="Search challan number, vendor, remarks..."
                                className="pl-9 h-10 text-sm"
                                value={search}
                                onChange={e => setSearch(e.target.value)}
                            />
                        </div>

                        <SearchableSelect
                            options={vendorOptions}
                            value={vendor}
                            onValueChange={setVendor}
                            placeholder="Select vendor..."
                            className="h-10"
                        />

                        <SearchableSelect
                            options={challanTypes.map(t => ({ label: `Type: ${t}`, value: t }))}
                            value={challanType}
                            onValueChange={setChallanType}
                            placeholder="Challan type..."
                            className="h-10"
                        />

                        <SearchableSelect
                            options={challanStatuses.map(s => ({ label: `Status: ${s}`, value: s }))}
                            value={status}
                            onValueChange={setStatus}
                            placeholder="Status..."
                            className="h-10"
                        />
                    </div>

                    {/* Date Range & Reset */}
                    <div className="flex flex-wrap items-center justify-between gap-3 pt-2 border-t text-xs">
                        <div className="flex items-center gap-2">
                            <span className="font-semibold text-muted-foreground flex items-center gap-1">
                                <Calendar className="size-3.5" /> Date Range:
                            </span>
                            <Input
                                type="date"
                                className="h-8 w-36 text-xs"
                                value={startDate}
                                onChange={e => setStartDate(e.target.value)}
                            />
                            <span className="text-muted-foreground">to</span>
                            <Input
                                type="date"
                                className="h-8 w-36 text-xs"
                                value={endDate}
                                onChange={e => setEndDate(e.target.value)}
                            />
                        </div>

                        {(search || vendor !== "All" || status !== "All" || challanType !== "All" || startDate || endDate) && (
                            <Button
                                variant="ghost"
                                size="sm"
                                onClick={resetFilters}
                                className="h-8 text-xs text-muted-foreground hover:text-foreground"
                            >
                                <RotateCcw className="size-3.5 mr-1" /> Reset all filters
                            </Button>
                        )}
                    </div>
                </CardContent>
            </Card>

            {/* Challans Table */}
            <Card>
                <CardContent className="p-0 overflow-x-auto">
                    <table className="min-w-full text-sm text-left whitespace-nowrap">
                        <thead className="bg-muted text-xs uppercase text-muted-foreground font-semibold border-b">
                            <tr>
                                <th className="px-6 py-3.5">Challan No.</th>
                                <th className="px-6 py-3.5">Type</th>
                                <th className="px-6 py-3.5">Vendor</th>
                                <th className="px-6 py-3.5">Issue Date</th>
                                <th className="px-6 py-3.5 text-center">Items</th>
                                <th className="px-6 py-3.5">Status</th>
                                <th className="px-6 py-3.5 text-right">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-border/50">
                            {loading ? (
                                <tr>
                                    <td colSpan={7} className="px-6 py-16 text-center text-muted-foreground">
                                        <Loader2 className="size-6 animate-spin mx-auto mb-2 text-primary" />
                                        <span>Loading challan records...</span>
                                    </td>
                                </tr>
                            ) : challans.length === 0 ? (
                                <tr>
                                    <td colSpan={7} className="px-6 py-20 text-center">
                                        <FileText className="size-10 text-muted-foreground/40 mx-auto mb-3" />
                                        <h3 className="font-semibold text-base text-foreground">No challan records found</h3>
                                        <p className="text-xs text-muted-foreground mt-1">
                                            Try modifying your search or filter settings.
                                        </p>
                                    </td>
                                </tr>
                            ) : (
                                challans.map(challan => {
                                    const isDcActive = challan.challanType === "Delivery" && challan.status === "Active";
                                    return (
                                        <tr
                                            key={challan._id}
                                            onClick={() => handleOpenDetails(challan)}
                                            className="hover:bg-muted/30 cursor-pointer transition-colors"
                                        >
                                            <td className="px-6 py-4">
                                                <div className="font-mono font-bold text-sm text-primary">
                                                    {challan.challanNumber}
                                                </div>
                                                {challan.referenceDcNumber && (
                                                    <div className="text-xs text-muted-foreground font-mono mt-0.5">
                                                        Ref: {challan.referenceDcNumber}
                                                    </div>
                                                )}
                                            </td>
                                            <td className="px-6 py-4">
                                                <span className={getChallanTypeBadgeClass(challan.challanType)}>
                                                    {challan.challanType}
                                                </span>
                                            </td>
                                            <td className="px-6 py-4">
                                                <div className="font-semibold text-foreground flex items-center gap-1.5">
                                                    <Building2 className="size-3.5 text-muted-foreground" />
                                                    {challan.vendor?.name}
                                                </div>
                                                <div className="text-xs text-muted-foreground font-mono mt-0.5">
                                                    {challan.vendor?.vendorCode || "-"}
                                                </div>
                                            </td>
                                            <td className="px-6 py-4 font-medium text-foreground/80">
                                                {new Date(challan.challanDate).toLocaleDateString()}
                                            </td>
                                            <td className="px-6 py-4 text-center font-bold text-foreground">
                                                {challan.toolCount || (challan.items || []).length}
                                            </td>
                                            <td className="px-6 py-4">
                                                <span className={getChallanStatusBadgeClass(challan.status)}>
                                                    {challan.status}
                                                </span>
                                            </td>
                                            <td className="px-6 py-4 text-right">
                                                <div className="flex items-center justify-end gap-1.5" onClick={e => e.stopPropagation()}>
                                                    <Button
                                                        size="sm"
                                                        variant="ghost"
                                                        className="h-8 px-2.5 text-xs font-semibold"
                                                        onClick={() => handleOpenDetails(challan)}
                                                    >
                                                        <Eye className="size-3.5 mr-1 text-muted-foreground" />
                                                        View
                                                    </Button>

                                                    <Button
                                                        size="sm"
                                                        variant="outline"
                                                        className="h-8 px-2.5 text-xs font-semibold"
                                                        onClick={e => handleDownloadPdf(challan, e)}
                                                        title="Download L&T Construction PDF"
                                                    >
                                                        <Download className="size-3.5 text-primary mr-1" />
                                                        PDF
                                                    </Button>

                                                    {isDcActive && (
                                                        <Button
                                                            size="sm"
                                                            className="h-8 px-3 text-xs font-semibold bg-amber-500 hover:bg-amber-600 text-white shadow-sm flex items-center gap-1"
                                                            onClick={e => handleCreateReturnChallan(challan, e)}
                                                        >
                                                            <span>Create RC</span>
                                                            <ArrowRight className="size-3.5" />
                                                        </Button>
                                                    )}
                                                </div>
                                            </td>
                                        </tr>
                                    );
                                })
                            )}
                        </tbody>
                    </table>
                </CardContent>
            </Card>

            {/* Pagination Footer */}
            <div className="flex items-center justify-between text-xs text-muted-foreground">
                <span>
                    Showing {(page - 1) * limit + 1} to {Math.min(page * limit, total)} of {total} records
                </span>
                <div className="flex items-center gap-2">
                    <Button
                        variant="outline"
                        size="sm"
                        disabled={page === 1 || loading}
                        onClick={() => setPage(p => Math.max(1, p - 1))}
                    >
                        Previous
                    </Button>
                    <span className="font-semibold text-foreground px-2">Page {page} / {totalPages}</span>
                    <Button
                        variant="outline"
                        size="sm"
                        disabled={page >= totalPages || loading}
                        onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                    >
                        Next
                    </Button>
                </div>
            </div>

            <ChallanDetailModal
                open={isDetailModalOpen}
                onOpenChange={setIsDetailModalOpen}
                challan={selectedChallan}
            />
        </div>
    );
}

export default ChallanHistoryPage;
