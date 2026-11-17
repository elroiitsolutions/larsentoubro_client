import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { SearchableSelect } from "@/components/ui/searchable-select";
import {
    FileText,
    Search,
    RotateCcw,
    Download,
    Eye,
    ArrowRight,
    ArrowRightLeft,
    Loader2,
    Calendar,
    Building2,
    RefreshCw
} from "lucide-react";
import challanService, { type ChallanRecord } from "@/services/challan.service";
import vendorService from "@/services/vendor.service";
import profileService from "@/services/profile.service";
import userService from "@/services/user.service";
import {
    getChallanStatusBadgeClass,
    getChallanTypeBadgeClass
} from "@/utils/challan/challanCalculations";
import { generateDeliveryChallanPDF, generateReturnChallanPDF, generateTransferChallanPDF } from "@/utils/pdf/challanPdfGenerator";
import { ChallanDetailModal } from "./ChallanDetailModal";
import { ReturnToolSelectModal } from "./ReturnToolSelectModal";
import { DatePickerField } from "@/components/DynamicForm/DynamicField";
import { toast } from "sonner";

export function ChallanHistoryPage() {
    const navigate = useNavigate();

    const [challans, setChallans] = useState<ChallanRecord[]>([]);
    const [vendors, setVendors] = useState<{ _id: string; name: string; vendorCode: string }[]>([]);
    const [loading, setLoading] = useState(true);

    // Filters
    const [search, setSearch] = useState("");
    const [debouncedSearch, setDebouncedSearch] = useState("");
    const [vendor, setVendor] = useState("All");
    const [status, setStatus] = useState("All");
    const [challanType, setChallanType] = useState("All");
    const [startDate, setStartDate] = useState("");
    const [endDate, setEndDate] = useState("");

    // Debounce search input by 350ms to prevent rapid server calls on every keystroke
    useEffect(() => {
        const timer = setTimeout(() => {
            setDebouncedSearch(search);
            setPage(1);
        }, 350);
        return () => clearTimeout(timer);
    }, [search]);

    // Pagination
    const [page, setPage] = useState(1);
    const [limit] = useState(15);
    const [total, setTotal] = useState(0);
    const [totalPages, setTotalPages] = useState(1);

    // Detail modal state
    const [selectedChallan, setSelectedChallan] = useState<ChallanRecord | null>(null);
    const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);

    // Return tool selection modal state
    const [returnSelectDc, setReturnSelectDc] = useState<ChallanRecord | null>(null);
    const [isReturnSelectModalOpen, setIsReturnSelectModalOpen] = useState(false);

    const fetchVendors = async () => {
        try {
            const [vendorRes, profileRes, userRes] = await Promise.all([
                vendorService.getVendors({ limit: 500 }).catch(() => ({ data: [] })),
                profileService.getProfiles({ limit: 1000 }).catch(() => ({ data: [] })),
                userService.getUsers().catch(() => ({ success: false, data: [] }))
            ]);

            const vendorMap = new Map<string, { _id: string; name: string; vendorCode: string }>();

            const addVendor = (id: any, name: any, code: any) => {
                if (!id || !name) return;
                const cleanId = String(id).trim();
                if (cleanId && !vendorMap.has(cleanId)) {
                    vendorMap.set(cleanId, {
                        _id: cleanId,
                        name: String(name).trim(),
                        vendorCode: String(code || name).trim()
                    });
                }
            };

            // 1. Extract from vendorService
            const vList = Array.isArray(vendorRes) ? vendorRes : (vendorRes?.data || []);
            vList.forEach((v: any) => {
                const id = v?._id || v?.id;
                addVendor(id, v?.name, v?.vendorCode || v?.user_id);
            });

            // 2. Extract from profileService (all profile types: Subcontractor, ScrapDealer, Supplier)
            const pList = Array.isArray(profileRes?.data) ? profileRes.data : [];
            pList.forEach((p: any) => {
                const id = p?._id || p?.id;
                addVendor(id, p?.name, p?.code || p?.vendorCode);
            });

            // 3. Extract from userService (role === 'Vendor')
            const uList = Array.isArray(userRes?.data) ? userRes.data : (Array.isArray(userRes) ? userRes : []);
            uList.filter((u: any) => u && (u.role === "Vendor" || u.role === "vendor")).forEach((u: any) => {
                const id = u?._id || u?.id;
                addVendor(id, u?.name, u?.user_id || u?.vendorCode);
            });

            setVendors(Array.from(vendorMap.values()));
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
                search: debouncedSearch,
                vendor,
                status,
                challanType,
                startDate,
                endDate
            });
            const challanList = res.data || [];
            setChallans(challanList);
            setTotal(res.total || 0);
            setTotalPages(res.totalPages || 1);

            // Dynamically enrich vendor filter list from fetched challans if not already present
            if (challanList.length > 0) {
                setVendors(prev => {
                    const map = new Map(prev.map(v => [v._id, v]));
                    let changed = false;
                    challanList.forEach((c: any) => {
                        if (c?.vendor) {
                            const id = String(c.vendor._id || c.vendor.id || c.vendor.name || '').trim();
                            if (id && !map.has(id)) {
                                map.set(id, {
                                    _id: id,
                                    name: String(c.vendor.name || id).trim(),
                                    vendorCode: String(c.vendor.vendorCode || c.vendor.name || '').trim()
                                });
                                changed = true;
                            }
                        }
                    });
                    return changed ? Array.from(map.values()) : prev;
                });
            }
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
    }, [page, debouncedSearch, vendor, status, challanType, startDate, endDate]);

    const resetFilters = () => {
        setSearch("");
        setDebouncedSearch("");
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
            if (challan.challanType === "Transfer" || challan.isStoreTransfer) {
                await generateTransferChallanPDF(challan, { download: true });
            } else if (challan.challanType === "Delivery" || challan.isScrapDC || challan.challanType === "Scrap") {
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

    const handleTransferChallan = (challan: ChallanRecord, e: React.MouseEvent) => {
        e.stopPropagation();
        navigate("/challans/delivery/preview", {
            state: {
                isTransfer: true,
                transferFromDcId: challan._id,
                transferFromDcNumber: challan.challanNumber,
                selectedTools: (challan.items || []).map((t: any, idx: number) => ({
                    _id: t.tool?._id || t.tool,
                    toolId: t.toolId || `TOOL-${idx}`,
                    toolCode: t.toolCode || "",
                    materialCode: t.toolCode || t.materialCode || `MAT-${1000 + idx}`,
                    description: t.description || "Tool Item",
                    quantity: Number(t.quantity || 1),
                    unit: t.unit || "NOS",
                    rate: Number(t.rate || 0),
                    remarks: t.remarks || "",
                    status: "Available"
                })),
                vendor: challan.vendor,
                storeId: challan.store?._id || challan.store,
                siteCode: "",
                previousSiteCode: challan.siteCode || "",
                subcontractorName: challan.subcontractorName || challan.vendor?.name,
                locationChainage: challan.locationChainage || "",
                workFrontLocation: challan.workFrontLocation || "",
                trnCode: challan.trnCode || "M 25",
                sendingCentreCode: challan.sendingCentreCode || "-",
                mrNo: challan.mrNo || "-",
                mrDate: challan.mrDate || "-",
                stockType: challan.stockType || "-",
                ewayBillNo: challan.ewayBillNo || "-",
                gatePassNo: challan.gatePassNo || "-",
                gatePassApprovedBy: challan.gatePassApprovedBy || "-",
                consignorTaxNo: challan.consignorTaxNo || challan.vendor?.gstNumber || "-",
                vehicleNo: challan.vehicleNo || "-",
                lrNo: challan.lrNo || "-",
                freightStatus: challan.freightStatus || "-",
                remarks: `Site Transfer from ${challan.challanNumber}`
            }
        });
    };

    const handleCreateReturnChallan = (challan: ChallanRecord, e: React.MouseEvent) => {
        e.stopPropagation();
        setReturnSelectDc(challan);
        setIsReturnSelectModalOpen(true);
    };

    const handleProceedToReturn = (challan: ChallanRecord, selectedToolIds: string[]) => {
        navigate(`/challans/return/preview/${challan._id}`, {
            state: {
                referenceDc: challan,
                selectedToolIds
            }
        });
    };

    // Calculate quick stats (commented out with stat cards)
    // const activeDcCount = challans.filter(c => c.challanType === "Delivery" && (c.status === "Active" || c.status === "Pending")).length;
    // const completedRcCount = challans.filter(c => c.challanType === "Return").length;

    const vendorOptions = vendors.map(v => ({
        label: `${v.name} (${v.vendorCode})`,
        value: v._id
    }));

    const typeOptions = [
        { label: "Delivery Challan (DC)", value: "Delivery" },
        { label: "Return Challan (RC)", value: "Return" },
        { label: "Store Transfer Challan (STC)", value: "Transfer" },
        { label: "Scrap Challan (SDC)", value: "Scrap" }
    ];

    const statusOptions = [
        { label: "All Statuses", value: "All" },
        { label: "Active", value: "Active" },
        { label: "Pending (Partial)", value: "Pending" },
        { label: "Transfer", value: "Transfer" },
        { label: "Completed", value: "Completed" }
    ];

    return (
        <div className="w-full flex flex-col space-y-3 pt-1 pb-4 animate-in fade-in duration-300">
            {/* Header Banner */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
                <div className="flex items-center gap-2.5">
                    <div className="p-1.5 rounded-lg bg-primary/10 text-primary">
                        <FileText className="size-4" />
                    </div>
                    <div>
                        <h1 className="text-base sm:text-lg font-bold tracking-tight text-foreground">
                            Challan History & Audit Logs
                        </h1>
                    </div>
                </div>
                <div className="flex items-center gap-2">
                    <Button
                        variant="outline"
                        size="sm"
                        onClick={fetchChallans}
                        className="h-7.5 px-2.5 text-[11px] font-semibold rounded-lg flex items-center gap-1.5 cursor-pointer shadow-2xs"
                    >
                        <RefreshCw className="size-3" />
                        <span>Refresh</span>
                    </Button>
                </div>
            </div>

            {/* Stat Cards */}
            {/* <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
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
            </div> */}

            {/* Filter Bar */}
            <Card className="p-3 space-y-2.5 rounded-xl border border-border/60 shadow-2xs">
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-5 gap-2.5">
                    <div className="col-span-1 sm:col-span-2">
                        <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider block mb-1">
                            Search Keywords
                        </label>
                        <div className="relative">
                            <Search className="size-3.5 absolute left-2.5 top-2 text-muted-foreground" />
                            <Input
                                placeholder="Search challan number, vendor, remarks..."
                                className="pl-8 h-7.5 text-xs rounded-lg border-border/60"
                                value={search}
                                onChange={e => {
                                    setSearch(e.target.value);
                                    setPage(1);
                                }}
                            />
                        </div>
                    </div>

                    <div>
                        <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider block mb-1">
                            Vendor
                        </label>
                        <SearchableSelect
                            options={vendorOptions}
                            value={vendor}
                            onValueChange={(val) => {
                                setVendor(val);
                                setPage(1);
                            }}
                            allLabel="All Vendors"
                            placeholder="Select vendor..."
                            className="h-7.5 text-xs rounded-lg"
                        />
                    </div>

                    <div>
                        <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider block mb-1">
                            Challan Type
                        </label>
                        <SearchableSelect
                            options={typeOptions}
                            value={challanType}
                            onValueChange={(val) => {
                                setChallanType(val);
                                setPage(1);
                            }}
                            allLabel="All Types"
                            placeholder="Challan type..."
                            className="h-7.5 text-xs rounded-lg"
                        />
                    </div>

                    <div>
                        <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider block mb-1">
                            Status
                        </label>
                        <SearchableSelect
                            options={statusOptions}
                            value={status}
                            onValueChange={(val) => {
                                setStatus(val);
                                setPage(1);
                            }}
                            allLabel="All Statuses"
                            placeholder="Status..."
                            className="h-7.5 text-xs rounded-lg"
                        />
                    </div>
                </div>

                {/* Date Range Row */}
                <div className="flex flex-wrap items-center justify-between gap-2.5 pt-2 border-t border-border/50 text-xs">
                    <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-semibold text-muted-foreground flex items-center gap-1 text-[11px]">
                            <Calendar className="size-3" /> Date Range:
                        </span>
                        <div className="w-32 sm:w-36">
                            <DatePickerField
                                value={startDate}
                                onChange={val => {
                                    setStartDate(val);
                                    setPage(1);
                                }}
                                placeholder="Start date"
                                className="h-7 text-xs rounded-lg px-2 bg-background border-border/80"
                                hideActionBadge={true}
                            />
                        </div>
                        <span className="text-muted-foreground font-medium text-[11px]">to</span>
                        <div className="w-32 sm:w-36">
                            <DatePickerField
                                value={endDate}
                                onChange={val => {
                                    setEndDate(val);
                                    setPage(1);
                                }}
                                placeholder="End date"
                                className="h-7 text-xs rounded-lg px-2 bg-background border-border/80"
                                hideActionBadge={true}
                            />
                        </div>
                    </div>

                    {(search || vendor !== "All" || status !== "All" || challanType !== "All" || startDate || endDate) && (
                        <Button
                            variant="ghost"
                            size="sm"
                            onClick={resetFilters}
                            className="h-6 px-2 text-[10px] font-medium text-muted-foreground hover:text-foreground cursor-pointer"
                        >
                            <RotateCcw className="size-2.5 mr-1" /> Reset filters
                        </Button>
                    )}
                </div>
            </Card>

            {/* Challans Table */}
            <Card className="rounded-xl border border-border/60 shadow-2xs overflow-hidden">
                <CardContent className="p-0 overflow-hidden">
                    <table className="w-full text-xs text-left">
                        <thead className="bg-muted/80 text-[10px] sm:text-[11px] uppercase text-muted-foreground font-semibold border-b">
                            <tr>
                                <th className="px-3 py-2 w-10 text-center">#</th>
                                <th className="px-3 py-2">Challan No.</th>
                                <th className="px-2.5 py-2 text-center">Type</th>
                                <th className="px-3 py-2">Vendor / Recipient</th>
                                <th className="px-3 py-2">Date</th>
                                <th className="px-2.5 py-2 text-center">Items</th>
                                <th className="px-3 py-2 text-center">Status</th>
                                <th className="px-3 py-2 text-right">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-border/50">
                            {loading ? (
                                <tr>
                                    <td colSpan={8} className="px-4 py-12 text-center text-muted-foreground">
                                        <Loader2 className="size-5 animate-spin mx-auto mb-2 text-primary" />
                                        <span>Loading challan records...</span>
                                    </td>
                                </tr>
                            ) : challans.length === 0 ? (
                                <tr>
                                    <td colSpan={8} className="px-4 py-16 text-center">
                                        <FileText className="size-8 text-muted-foreground/40 mx-auto mb-2" />
                                        <h3 className="font-semibold text-sm text-foreground">No challan records found</h3>
                                        <p className="text-[11px] text-muted-foreground mt-0.5">
                                            Try modifying your search or filter settings.
                                        </p>
                                    </td>
                                </tr>
                            ) : (
                                challans.map((challan, index) => {
                                    const isDcOpen = challan.challanType === "Delivery" && (challan.status === "Active" || challan.status === "Pending");
                                    const sNo = (page - 1) * limit + index + 1;
                                    return (
                                        <tr
                                            key={challan._id}
                                            onClick={() => handleOpenDetails(challan)}
                                            className="hover:bg-muted/30 cursor-pointer transition-colors"
                                        >
                                            <td className="px-3 py-2 text-center font-mono font-semibold text-[11px] text-muted-foreground">
                                                {sNo}
                                            </td>
                                            <td className="px-3 py-2">
                                                <div className="font-mono font-bold text-xs text-primary">
                                                    {challan.challanNumber}
                                                </div>
                                                {challan.challanType === "Return" && challan.referenceDcNumber && (
                                                    <div className="text-[10px] text-muted-foreground font-mono mt-0.5">
                                                        Ref: {challan.referenceDcNumber}
                                                    </div>
                                                )}
                                                {challan.challanType === "Delivery" && challan.transferFromDcNumber && (
                                                    <div className="text-[10px] text-blue-600 dark:text-blue-400 font-mono mt-0.5 font-medium flex items-center gap-1">
                                                        <span>Transfer: {challan.transferFromDcNumber}</span>
                                                    </div>
                                                )}
                                                {challan.transferredToDcNumber && (
                                                    <div className="text-[10px] text-amber-600 dark:text-amber-400 font-mono mt-0.5 font-medium flex items-center gap-1">
                                                        <span>Transferred to: {challan.transferredToDcNumber}</span>
                                                    </div>
                                                )}
                                            </td>
                                            <td className="px-2.5 py-2 text-center">
                                                {(() => {
                                                    const isScrap = challan.isScrapDC || challan.challanType === "Scrap" || (challan.challanNumber && challan.challanNumber.startsWith("SDC-"));
                                                    const displayType = isScrap ? "Scrap" : challan.challanType;
                                                    const badgeText = isScrap ? "Scrap DC" : challan.challanType;
                                                    return (
                                                        <span className={getChallanTypeBadgeClass(displayType)}>
                                                            {badgeText}
                                                        </span>
                                                    );
                                                })()}
                                            </td>
                                            <td className="px-3 py-2 max-w-[200px]">
                                                {challan.challanType === "Transfer" || challan.isStoreTransfer ? (
                                                    <div>
                                                        <div className="font-semibold text-foreground flex items-center gap-1.5 truncate text-xs" title={`${challan.sourceStore?.name || "Source"} -> ${challan.destinationStore?.name || "Destination"}`}>
                                                            <Building2 className="size-3 text-primary shrink-0" />
                                                            <span className="truncate">{challan.sourceStore?.name || "Source"} &rarr; {challan.destinationStore?.name || "Destination"}</span>
                                                        </div>
                                                        <div className="text-[10px] text-muted-foreground font-mono mt-0.5 truncate">
                                                            Project: {challan.project?.name || "Same Project"}
                                                        </div>
                                                    </div>
                                                ) : (
                                                    <div>
                                                        <div className="font-semibold text-foreground flex items-center gap-1.5 truncate text-xs">
                                                            <Building2 className="size-3 text-muted-foreground shrink-0" />
                                                            <span className="truncate">{challan.vendor?.name || "-"}</span>
                                                        </div>
                                                        <div className="text-[10px] text-muted-foreground font-mono mt-0.5">
                                                            {challan.vendor?.vendorCode || "-"}
                                                        </div>
                                                    </div>
                                                )}
                                            </td>
                                            <td className="px-3 py-2 font-medium text-foreground/80 whitespace-nowrap text-[11px]">
                                                {new Date(challan.challanDate).toLocaleDateString()}
                                            </td>
                                            <td className="px-2.5 py-2 text-center font-bold text-foreground text-xs">
                                                <div>{challan.toolCount || (challan.items || []).length}</div>
                                                {challan.challanType === "Delivery" && (() => {
                                                    const total = challan.toolCount || (challan.items || []).length;
                                                    const ret = challan.returnedCount || 0;
                                                    const miss = challan.missingCount || 0;
                                                    const pend = Math.max(0, total - (ret + miss));
                                                    const hasReturns = ret > 0 || miss > 0 || challan.status === "Pending";
                                                    if (!hasReturns) return null;
                                                    return (
                                                        <div className="text-[9px] font-normal flex items-center justify-center gap-1 mt-0.5 whitespace-nowrap">
                                                            {ret > 0 && <span className="text-emerald-600 dark:text-emerald-400 font-semibold">{ret} Ret</span>}
                                                            {pend > 0 && (
                                                                <>
                                                                    {ret > 0 && <span className="text-muted-foreground/60">&bull;</span>}
                                                                    <span className="text-amber-600 dark:text-amber-400 font-semibold">{pend} Pend</span>
                                                                </>
                                                            )}
                                                            {miss > 0 && (
                                                                <>
                                                                    {(ret > 0 || pend > 0) && <span className="text-muted-foreground/60">&bull;</span>}
                                                                    <span className="text-rose-600 dark:text-rose-400 font-semibold">{miss} Miss</span>
                                                                </>
                                                            )}
                                                        </div>
                                                    );
                                                })()}
                                            </td>
                                            <td className="px-3 py-2 text-center whitespace-nowrap">
                                                {(() => {
                                                    const displayStatus = challan.status === "Returned" ? "Completed" : challan.status;
                                                    return (
                                                        <span className={getChallanStatusBadgeClass(displayStatus)}>
                                                            {displayStatus}
                                                        </span>
                                                    );
                                                })()}
                                            </td>
                                            <td className="px-3 py-2 text-right">
                                                <div className="flex items-center justify-end gap-1 flex-wrap sm:flex-nowrap" onClick={e => e.stopPropagation()}>
                                                    <Button
                                                        size="sm"
                                                        variant="ghost"
                                                        className="h-7 px-2 text-xs font-semibold"
                                                        onClick={() => handleOpenDetails(challan)}
                                                    >
                                                        <Eye className="size-3.5 mr-1 text-muted-foreground" />
                                                        View
                                                    </Button>

                                                    <Button
                                                        size="sm"
                                                        variant="outline"
                                                        className="h-7 px-2 text-xs font-semibold"
                                                        onClick={e => handleDownloadPdf(challan, e)}
                                                        title="Download L&T Construction PDF"
                                                    >
                                                        <Download className="size-3.5 text-primary mr-1" />
                                                        PDF
                                                    </Button>

                                                    {isDcOpen && (
                                                        <>
                                                            <Button
                                                                size="sm"
                                                                variant="outline"
                                                                className="h-7 px-2 text-xs font-semibold text-blue-600 border-blue-300 hover:bg-blue-50 dark:border-blue-700 dark:text-blue-400 dark:hover:bg-blue-950/40 shadow-xs flex items-center gap-1"
                                                                onClick={e => handleTransferChallan(challan, e)}
                                                                title="Transfer tools to another site"
                                                            >
                                                                <ArrowRightLeft className="size-3" />
                                                                <span>Transfer</span>
                                                            </Button>

                                                            <Button
                                                                size="sm"
                                                                className={`h-7 px-2.5 text-xs font-semibold shadow-xs flex items-center gap-1 text-white ${
                                                                    challan.status === "Pending"
                                                                        ? "bg-amber-600 hover:bg-amber-700"
                                                                        : "bg-amber-500 hover:bg-amber-600"
                                                                }`}
                                                                onClick={e => handleCreateReturnChallan(challan, e)}
                                                                title={challan.status === "Pending" ? "Create subsequent Return Challan for remaining tools" : "Create Return Challan"}
                                                            >
                                                                <span>{challan.status === "Pending" ? "Return Remaining" : "Create RC"}</span>
                                                                <ArrowRight className="size-3" />
                                                            </Button>
                                                        </>
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

            {returnSelectDc && (
                <ReturnToolSelectModal
                    open={isReturnSelectModalOpen}
                    onOpenChange={setIsReturnSelectModalOpen}
                    challan={returnSelectDc}
                    onProceed={handleProceedToReturn}
                />
            )}
        </div>
    );
}

export default ChallanHistoryPage;
