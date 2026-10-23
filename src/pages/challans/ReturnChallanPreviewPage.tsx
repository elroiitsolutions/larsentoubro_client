import { useState, useEffect, useMemo } from "react";
import { useParams, useLocation, useNavigate } from "react-router-dom";
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
    ArrowLeft,
    CheckCircle2,
    Loader2,
    Building2,
    AlertTriangle,
    RotateCcw,
    ShieldAlert,
    Clock,
    CheckSquare,
    Square,
    Package,
    ChevronDown,
    ChevronUp,
    Search,
    Filter,
    X
} from "lucide-react";
import challanService, { type ChallanRecord } from "@/services/challan.service";
import { generateReturnChallanPDF } from "@/utils/pdf/challanPdfGenerator";
import { toast } from "sonner";
import logoUrl from "@/assets/logo.png";

interface ReturnCandidateItem {
    tool: string;
    toolId: string;
    description: string;
    toolCode: string;
    quantity: number;
    unit: string;
    rate: number;
    selected: boolean;
    returnStatus: "Returned" | "Missing";
    remarks: string;
}

export function ReturnChallanPreviewPage() {
    const { dcId } = useParams<{ dcId: string }>();
    const location = useLocation();
    const navigate = useNavigate();
    const state = location.state as any;

    const [dc, setDc] = useState<ChallanRecord | null>(state?.referenceDc || null);
    const [loading, setLoading] = useState(!dc);

    const [challanDate, setChallanDate] = useState<string>(new Date().toISOString().split("T")[0]);
    const [remarks, setRemarks] = useState("");
    const [notes, setNotes] = useState("");

    // Pending tools list available for return
    const [items, setItems] = useState<ReturnCandidateItem[]>([]);
    // Tools that were already returned in previous RCs
    const [alreadyReturnedList, setAlreadyReturnedList] = useState<any[]>([]);
    const [showAlreadyReturned, setShowAlreadyReturned] = useState(false);
    const [creating, setCreating] = useState(false);

    // Search and filter state
    const [searchQuery, setSearchQuery] = useState("");
    const [filterTab, setFilterTab] = useState<"all" | "selected" | "unselected">("all");

    useEffect(() => {
        const loadDc = async () => {
            try {
                setLoading(true);
                let currentDc = dc;
                if (!currentDc && dcId) {
                    const res = await challanService.getChallanById(dcId);
                    currentDc = res.data;
                    setDc(currentDc);
                }

                if (currentDc) {
                    const allDcItems = currentDc.items || [];
                    const alreadyClosed: any[] = [];
                    const pendingCandidates: ReturnCandidateItem[] = [];

                    const initialSelectedSet = Array.isArray(state?.selectedToolIds) && state.selectedToolIds.length > 0
                        ? new Set(state.selectedToolIds.map((id: any) => String(id)))
                        : null;

                    allDcItems.forEach((t: any) => {
                        const isClosed = t.returnStatus === "Returned" || t.returnStatus === "Missing";
                        if (isClosed) {
                            alreadyClosed.push(t);
                        } else {
                            const rawTool = t.tool?._id || t.tool || t._id;
                            const toolKey = String(rawTool || "");
                            const toolIdStr = String(t.toolId || "");
                            const isSelected = initialSelectedSet
                                ? (initialSelectedSet.has(toolKey) || initialSelectedSet.has(toolIdStr))
                                : true; // Default selected

                            pendingCandidates.push({
                                tool: rawTool,
                                toolId: t.toolId || "UNKNOWN",
                                description: t.description || "Tool Item",
                                toolCode: t.toolCode || "",
                                quantity: Number(t.quantity || 1),
                                unit: t.unit || "NOS",
                                rate: Number(t.rate || 0),
                                selected: isSelected,
                                returnStatus: "Returned",
                                remarks: ""
                            });
                        }
                    });

                    setAlreadyReturnedList(alreadyClosed);
                    setItems(pendingCandidates);
                }
            } catch (err) {
                toast.error("Failed to load reference Delivery Challan");
            } finally {
                setLoading(false);
            }
        };

        loadDc();
    }, [dcId]);

    if (loading) {
        return (
            <div className="p-16 text-center text-muted-foreground flex flex-col items-center justify-center">
                <Loader2 className="size-8 animate-spin text-primary mb-3" />
                <p className="text-sm font-semibold animate-pulse">Loading Delivery Challan details...</p>
            </div>
        );
    }

    if (!dc) {
        return (
            <div className="p-8 max-w-4xl mx-auto text-center">
                <Card className="p-12 border-dashed">
                    <AlertTriangle className="size-12 text-rose-500 mx-auto mb-4" />
                    <h3 className="text-lg font-semibold text-foreground">Delivery Challan Not Found</h3>
                    <p className="text-sm text-muted-foreground mt-1 mb-6">
                        We could not find a valid Delivery Challan with ID #{dcId}.
                    </p>
                    <Button onClick={() => navigate("/challans/history")} variant="outline">
                        <ArrowLeft className="size-4 mr-2" /> Back to History
                    </Button>
                </Card>
            </div>
        );
    }

    // All tools already returned state
    if (items.length === 0 && alreadyReturnedList.length > 0) {
        return (
            <div className="p-8 max-w-3xl mx-auto text-center">
                <Card className="p-12 border-emerald-500/30 bg-emerald-500/[0.03] shadow-sm">
                    <CheckCircle2 className="size-14 text-emerald-500 mx-auto mb-4" />
                    <h3 className="text-xl font-bold text-foreground">All Tools Already Returned</h3>
                    <p className="text-sm text-muted-foreground mt-2 mb-6 max-w-md mx-auto">
                        All {alreadyReturnedList.length} tool(s) under Delivery Challan <span className="font-mono font-bold text-primary">{dc.challanNumber}</span> have already been returned or accounted for.
                    </p>
                    <div className="flex items-center justify-center gap-3">
                        <Button onClick={() => navigate("/challans/history")} className="bg-primary">
                            <ArrowLeft className="size-4 mr-2" /> Back to Challan History
                        </Button>
                    </div>
                </Card>
            </div>
        );
    }

    const selectedItems = items.filter(i => i.selected);
    const returnedItems = selectedItems.filter(i => i.returnStatus === "Returned");
    const missingItems = selectedItems.filter(i => i.returnStatus === "Missing");
    const remainingPendingCount = items.length - selectedItems.length;
    const isPartialReturn = remainingPendingCount > 0;

    const filteredItems = useMemo(() => {
        return items.filter(item => {
            if (filterTab === "selected" && !item.selected) return false;
            if (filterTab === "unselected" && item.selected) return false;

            if (searchQuery.trim()) {
                const q = searchQuery.toLowerCase().trim();
                const matchId = (item.toolId || "").toLowerCase().includes(q);
                const matchDesc = (item.description || "").toLowerCase().includes(q);
                const matchCode = (item.toolCode || "").toLowerCase().includes(q);
                if (!matchId && !matchDesc && !matchCode) return false;
            }

            return true;
        });
    }, [items, filterTab, searchQuery]);

    const isAllFilteredSelected =
        filteredItems.length > 0 && filteredItems.every(i => i.selected);

    const handleToggleSelectByToolId = (toolId: string) => {
        setItems(prev => prev.map(item => item.toolId === toolId ? { ...item, selected: !item.selected } : item));
    };

    const handleSelectAllFiltered = (select: boolean) => {
        const visibleIds = new Set(filteredItems.map(i => i.toolId));
        setItems(prev => prev.map(item => visibleIds.has(item.toolId) ? { ...item, selected: select } : item));
    };

    const handleMarkAllSelected = (status: "Returned" | "Missing") => {
        setItems(prev => prev.map(item => item.selected ? {
            ...item,
            returnStatus: status,
            remarks: status === "Missing" ? "Reported missing during return inspection" : ""
        } : item));
    };

    const handleStatusToggleByToolId = (toolId: string, status: "Returned" | "Missing") => {
        setItems(prev => prev.map(item => item.toolId === toolId ? {
            ...item,
            returnStatus: status,
            remarks: status === "Missing" ? "Reported missing during return inspection" : ""
        } : item));
    };

    const handleItemChangeByToolId = (toolId: string, field: keyof ReturnCandidateItem, val: any) => {
        setItems(prev => prev.map(item => item.toolId === toolId ? { ...item, [field]: val } : item));
    };

    const handleConfirmCreateReturn = async () => {
        if (selectedItems.length === 0) {
            toast.error("Please select at least one tool to return");
            return;
        }

        try {
            setCreating(true);
            const payloadItems = selectedItems.map(i => ({
                tool: i.tool,
                toolId: i.toolId,
                description: i.description,
                toolCode: i.toolCode,
                quantity: i.quantity,
                unit: i.unit,
                rate: i.rate,
                returnStatus: i.returnStatus,
                remarks: i.remarks
            }));

            const res = await challanService.createReturnChallan({
                referenceDcId: dc._id,
                vendorId: dc.vendor?._id || dc.vendor,
                storeId: dc.store?._id || dc.store,
                challanDate,
                remarks,
                notes,
                items: payloadItems
            });

            if (res.success && res.data) {
                if (isPartialReturn) {
                    toast.success(`Partial Return Challan ${res.data.challanNumber} created! ${remainingPendingCount} tool(s) remain Pending on ${dc.challanNumber}.`);
                } else {
                    toast.success(`Return Challan ${res.data.challanNumber} created! Delivery Challan ${dc.challanNumber} is now Completed.`);
                }

                if (missingItems.length > 0) {
                    toast.warning(`${missingItems.length} tool(s) recorded as Missing in incident audit logs.`);
                }

                // Auto generate and download L&T RC PDF
                try {
                    await generateReturnChallanPDF(res.data, { download: true });
                } catch (pdfErr) {
                    console.error("RC PDF error:", pdfErr);
                    toast.error("Return Challan created, but automatic PDF download failed.");
                }

                setTimeout(() => {
                    navigate("/challans/history");
                }, 1500);
            }
        } catch (err: any) {
            toast.error(err.message || "Failed to create Return Challan");
            setCreating(false);
        }
    };

    return (
        <div className="p-6 max-w-6xl mx-auto space-y-6">
            {/* Top Navigation & Title */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                    <Button variant="ghost" size="icon" onClick={() => navigate(-1)}>
                        <ArrowLeft className="size-5" />
                    </Button>
                    <div>
                        <div className="flex flex-wrap items-center gap-2.5">
                            <img src={logoUrl} alt="L&T Logo" className="size-8 object-contain shrink-0" />
                            <h1 className="text-2xl font-bold tracking-tight text-foreground flex items-center gap-2">
                                <RotateCcw className="size-5 text-primary" />
                                Return Challan (RC) Creation
                            </h1>
                            <span className="font-mono text-xs px-2.5 py-0.5 rounded-full bg-primary/10 text-primary font-bold">
                                Ref DC: {dc.challanNumber}
                            </span>
                            <span className={`text-xs px-2.5 py-0.5 rounded-full font-semibold ${
                                dc.status === 'Pending'
                                    ? 'bg-amber-500/15 text-amber-700 dark:text-amber-400'
                                    : 'bg-blue-500/15 text-blue-700 dark:text-blue-400'
                            }`}>
                                DC Status: {dc.status}
                            </span>
                        </div>
                        <p className="text-sm text-muted-foreground mt-0.5">
                            Select tools to return from this Delivery Challan. Partial returns will keep unreturned tools pending.
                        </p>
                    </div>
                </div>

                <div className="flex items-center gap-2 self-start md:self-center">
                    <Button
                        variant="outline"
                        onClick={() => navigate(-1)}
                        disabled={creating}
                    >
                        Cancel
                    </Button>
                    <Button
                        onClick={handleConfirmCreateReturn}
                        disabled={creating || selectedItems.length === 0}
                        className="bg-primary text-primary-foreground hover:bg-primary/90 shadow-md flex items-center gap-2 px-5"
                    >
                        {creating ? (
                            <>
                                <Loader2 className="size-4 animate-spin" />
                                <span>Creating RC...</span>
                            </>
                        ) : (
                            <>
                                <CheckCircle2 className="size-4" />
                                <span>Confirm Return ({selectedItems.length} Tool{selectedItems.length > 1 ? "s" : ""})</span>
                            </>
                        )}
                    </Button>
                </div>
            </div>

            {/* Transfer Notification Banner */}
            {dc.transferFromDcNumber && (
                <div className="bg-blue-500/10 border border-blue-500/30 rounded-xl p-3 flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 text-xs text-blue-800 dark:text-blue-300">
                    <div className="flex items-center gap-2">
                        <RotateCcw className="size-4 text-blue-600 dark:text-blue-400 shrink-0" />
                        <span>
                            This Delivery Challan was transferred from <strong className="font-mono font-bold">{dc.transferFromDcNumber}</strong>. Tool returns will be logged against this transfer chain.
                        </span>
                    </div>
                    <span className="font-mono bg-blue-500/20 px-2.5 py-0.5 rounded font-bold shrink-0 self-start sm:self-center">
                        Transfer Chain
                    </span>
                </div>
            )}

            {/* Partial vs Full Return Notice */}
            {isPartialReturn ? (
                <div className="bg-amber-500/10 border border-amber-500/30 rounded-xl p-3.5 flex items-start gap-3 text-xs text-amber-900 dark:text-amber-200">
                    <Clock className="size-5 text-amber-600 dark:text-amber-400 shrink-0 mt-0.5" />
                    <div className="space-y-0.5">
                        <h4 className="font-bold text-sm">Partial Return Mode</h4>
                        <p>
                            You have selected <strong>{selectedItems.length}</strong> of <strong>{items.length}</strong> pending tool(s) for return.
                            The remaining <strong>{remainingPendingCount} tool(s)</strong> will stay active and in use on site.
                            Delivery Challan <span className="font-mono font-bold">{dc.challanNumber}</span> will be marked as <span className="font-bold underline">Pending</span> until all remaining tools are returned.
                        </p>
                    </div>
                </div>
            ) : (
                <div className="bg-emerald-500/10 border border-emerald-500/30 rounded-xl p-3.5 flex items-start gap-3 text-xs text-emerald-900 dark:text-emerald-200">
                    <CheckCircle2 className="size-5 text-emerald-600 dark:text-emerald-400 shrink-0 mt-0.5" />
                    <div className="space-y-0.5">
                        <h4 className="font-bold text-sm">Full Return Mode</h4>
                        <p>
                            All remaining <strong>{selectedItems.length}</strong> tool(s) are selected for return. Creating this Return Challan will successfully close Delivery Challan <span className="font-mono font-bold">{dc.challanNumber}</span> and mark its status as <span className="font-bold underline">Completed</span>.
                        </p>
                    </div>
                </div>
            )}

            {/* Summary Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                <Card className="p-4 bg-card/60 backdrop-blur-sm border-border shadow-xs">
                    <p className="text-xs font-semibold text-muted-foreground uppercase">Consignee Vendor</p>
                    <div className="flex items-center gap-2 mt-1">
                        <Building2 className="size-4 text-primary shrink-0" />
                        <span className="font-bold text-foreground truncate">{dc.vendor?.name || "Selected Vendor"}</span>
                    </div>
                    <span className="text-xs text-muted-foreground font-mono">{dc.vendor?.vendorCode || "-"}</span>
                </Card>

                <Card className="p-4 bg-card/60 backdrop-blur-sm border-border shadow-xs">
                    <p className="text-xs font-semibold text-muted-foreground uppercase">Total DC Tools</p>
                    <div className="flex items-center gap-2 mt-1">
                        <Package className="size-4 text-primary shrink-0" />
                        <span className="text-xl font-bold text-foreground">{(dc.items || []).length}</span>
                    </div>
                    <span className="text-xs text-muted-foreground">
                        {alreadyReturnedList.length} returned in past RCs &bull; {items.length} pending
                    </span>
                </Card>

                <Card className="p-4 bg-card/60 backdrop-blur-sm border-border shadow-xs">
                    <p className="text-xs font-semibold text-muted-foreground uppercase">Selected For This RC</p>
                    <div className="flex items-center gap-2 mt-1">
                        <CheckCircle2 className="size-4 text-emerald-600 shrink-0" />
                        <span className="text-xl font-bold text-emerald-600">{selectedItems.length}</span>
                    </div>
                    <span className="text-xs text-muted-foreground">
                        {returnedItems.length} Returned &bull; {missingItems.length} Missing
                    </span>
                </Card>

                <Card className="p-4 bg-card/60 backdrop-blur-sm border-border shadow-xs">
                    <p className="text-xs font-semibold text-muted-foreground uppercase">Remaining on DC</p>
                    <div className="flex items-center gap-2 mt-1">
                        <Clock className="size-4 text-amber-600 shrink-0" />
                        <span className="text-xl font-bold text-amber-600">{remainingPendingCount}</span>
                    </div>
                    <span className="text-xs text-muted-foreground">
                        {remainingPendingCount > 0 ? "Kept in use (DC Pending)" : "All tools returned (DC Completed)"}
                    </span>
                </Card>
            </div>

            {missingItems.length > 0 && (
                <div className="bg-rose-500/10 border border-rose-500/30 rounded-xl p-4 flex items-start gap-3 text-sm text-rose-800 dark:text-rose-300">
                    <ShieldAlert className="size-5 text-rose-500 shrink-0 mt-0.5" />
                    <div>
                        <h4 className="font-bold">Missing Tool Incident Notice</h4>
                        <p className="text-xs mt-0.5">
                            You have marked <strong>{missingItems.length} tool(s)</strong> as Missing. Creating this Return Challan will update their inventory status to <span className="font-mono font-bold">Missing</span> and record a formal incident in the audit logs.
                        </p>
                    </div>
                </div>
            )}

            {/* Challan Metadata Form */}
            <Card>
                <CardHeader className="pb-3">
                    <CardTitle className="text-base font-bold">Return Challan Header</CardTitle>
                    <CardDescription className="text-xs">
                        Specify return inspection date and notes for this Return Challan.
                    </CardDescription>
                </CardHeader>
                <CardContent className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div>
                        <Label className="text-xs">Return Date *</Label>
                        <Input
                            type="date"
                            className="h-9 mt-1 text-sm"
                            value={challanDate}
                            onChange={e => setChallanDate(e.target.value)}
                        />
                    </div>
                    <div>
                        <Label className="text-xs">Reference DC Number</Label>
                        <Input
                            disabled
                            className="h-9 mt-1 text-sm bg-muted font-mono font-bold text-primary"
                            value={dc.challanNumber}
                        />
                    </div>
                    <div>
                        <Label className="text-xs">Original DC Date</Label>
                        <Input
                            disabled
                            className="h-9 mt-1 text-sm bg-muted font-mono"
                            value={new Date(dc.challanDate).toLocaleDateString()}
                        />
                    </div>
                    <div className="col-span-1 md:col-span-2">
                        <Label className="text-xs">Return Remarks / Inspection Summary</Label>
                        <Input
                            placeholder="e.g. Returned after completing stringing at Section-B"
                            className="h-9 mt-1 text-sm"
                            value={remarks}
                            onChange={e => setRemarks(e.target.value)}
                        />
                    </div>
                    <div>
                        <Label className="text-xs">Internal Notes</Label>
                        <Input
                            placeholder="Internal reference notes..."
                            className="h-9 mt-1 text-sm"
                            value={notes}
                            onChange={e => setNotes(e.target.value)}
                        />
                    </div>
                </CardContent>
            </Card>

            {/* Pending Tools Checklist Table */}
            <Card className="border-border shadow-xs">
                <CardHeader className="pb-3 border-b border-border/50 bg-muted/20 space-y-3">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                        <div>
                            <CardTitle className="text-base font-bold flex items-center gap-2">
                                <span>Available Pending Tools ({items.length})</span>
                                <span className="text-xs font-semibold px-2.5 py-0.5 rounded-full bg-primary/10 text-primary">
                                    {selectedItems.length} Selected
                                </span>
                            </CardTitle>
                            <CardDescription className="text-xs">
                                Select the specific tools to return in this RC. Toggle return status or use filter options to find items.
                            </CardDescription>
                        </div>

                        {/* Bulk Status Toggles */}
                        <div className="flex items-center gap-2 flex-wrap">
                            <Button
                                type="button"
                                size="sm"
                                variant="outline"
                                className="h-8 text-xs font-semibold text-emerald-700 dark:text-emerald-400 border-emerald-300 dark:border-emerald-800 hover:bg-emerald-50 dark:hover:bg-emerald-950/40"
                                onClick={() => handleMarkAllSelected("Returned")}
                                disabled={selectedItems.length === 0}
                                title="Mark all currently selected items as Returned"
                            >
                                <CheckCircle2 className="size-3.5 mr-1 text-emerald-600" />
                                <span>Mark Selected Returned</span>
                            </Button>
                            <Button
                                type="button"
                                size="sm"
                                variant="outline"
                                className="h-8 text-xs font-semibold text-rose-700 dark:text-rose-400 border-rose-300 dark:border-rose-800 hover:bg-rose-50 dark:hover:bg-rose-950/40"
                                onClick={() => handleMarkAllSelected("Missing")}
                                disabled={selectedItems.length === 0}
                                title="Mark all currently selected items as Missing"
                            >
                                <AlertTriangle className="size-3.5 mr-1 text-rose-600" />
                                <span>Mark Selected Missing</span>
                            </Button>
                        </div>
                    </div>

                    {/* Filter and Search Toolbar */}
                    <div className="pt-2 border-t border-border/40 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
                        {/* Search Input */}
                        <div className="relative flex-1">
                            <Search className="size-4 absolute left-3 top-2.5 text-muted-foreground" />
                            <Input
                                placeholder="Filter by Tool ID, Description, Tool Code..."
                                className="pl-9 h-9 text-xs sm:text-sm bg-background"
                                value={searchQuery}
                                onChange={e => setSearchQuery(e.target.value)}
                            />
                            {searchQuery && (
                                <button
                                    type="button"
                                    onClick={() => setSearchQuery("")}
                                    className="absolute right-2.5 top-2.5 text-muted-foreground hover:text-foreground"
                                >
                                    <X className="size-4" />
                                </button>
                            )}
                        </div>

                        {/* Filter Tabs & Selection Actions */}
                        <div className="flex items-center gap-1.5 flex-wrap shrink-0">
                            <span className="text-[11px] font-bold text-muted-foreground uppercase flex items-center gap-1 mr-1">
                                <Filter className="size-3 text-primary" /> View:
                            </span>
                            <button
                                type="button"
                                onClick={() => setFilterTab("all")}
                                className={`px-2.5 py-1 rounded-md text-xs font-semibold transition-all cursor-pointer ${
                                    filterTab === "all"
                                        ? "bg-primary text-primary-foreground shadow-xs"
                                        : "bg-muted text-muted-foreground hover:text-foreground hover:bg-muted/80"
                                }`}
                            >
                                All ({items.length})
                            </button>
                            <button
                                type="button"
                                onClick={() => setFilterTab("selected")}
                                className={`px-2.5 py-1 rounded-md text-xs font-semibold transition-all cursor-pointer ${
                                    filterTab === "selected"
                                        ? "bg-primary text-primary-foreground shadow-xs"
                                        : "bg-muted text-muted-foreground hover:text-foreground hover:bg-muted/80"
                                }`}
                            >
                                Selected ({selectedItems.length})
                            </button>
                            <button
                                type="button"
                                onClick={() => setFilterTab("unselected")}
                                className={`px-2.5 py-1 rounded-md text-xs font-semibold transition-all cursor-pointer ${
                                    filterTab === "unselected"
                                        ? "bg-primary text-primary-foreground shadow-xs"
                                        : "bg-muted text-muted-foreground hover:text-foreground hover:bg-muted/80"
                                }`}
                            >
                                Unselected ({remainingPendingCount})
                            </button>

                            <div className="h-4 w-px bg-border/60 mx-1" />

                            <Button
                                type="button"
                                size="sm"
                                variant="outline"
                                className="h-7 text-xs font-semibold px-2"
                                onClick={() => handleSelectAllFiltered(true)}
                                title="Select all tools currently shown"
                            >
                                <CheckSquare className="size-3 mr-1 text-primary" />
                                <span>Select All</span>
                            </Button>
                            <Button
                                type="button"
                                size="sm"
                                variant="outline"
                                className="h-7 text-xs font-semibold px-2"
                                onClick={() => handleSelectAllFiltered(false)}
                                title="Deselect all tools currently shown"
                            >
                                <Square className="size-3 mr-1" />
                                <span>Clear</span>
                            </Button>
                        </div>
                    </div>
                </CardHeader>
                <CardContent className="p-0 overflow-x-auto">
                    <table className="min-w-full text-sm text-left whitespace-nowrap">
                        <thead className="bg-muted text-xs uppercase text-muted-foreground font-semibold border-y">
                            <tr>
                                <th className="px-4 py-3 w-10 text-center">
                                    <input
                                        type="checkbox"
                                        checked={isAllFilteredSelected}
                                        onChange={e => handleSelectAllFiltered(e.target.checked)}
                                        disabled={filteredItems.length === 0}
                                        className="rounded border-border text-primary focus:ring-primary size-4 cursor-pointer"
                                        title={isAllFilteredSelected ? "Deselect All Filtered" : "Select All Filtered"}
                                    />
                                </th>
                                <th className="px-3 py-3 w-12 text-center">#</th>
                                <th className="px-4 py-3">Tool ID</th>
                                <th className="px-4 py-3">Description</th>
                                <th className="px-4 py-3">Tool Code</th>
                                <th className="px-4 py-3 text-center">Qty</th>
                                <th className="px-4 py-3 text-center">Return Status</th>
                                <th className="px-4 py-3">Remarks / Reason</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-border/50">
                            {filteredItems.length === 0 ? (
                                <tr>
                                    <td colSpan={8} className="px-4 py-12 text-center text-muted-foreground">
                                        <Package className="size-8 mx-auto mb-2 opacity-40 text-muted-foreground" />
                                        <p className="font-semibold text-sm">No tools match the selected filter</p>
                                        <p className="text-xs text-muted-foreground mt-0.5">
                                            {searchQuery ? `Try clearing your search "${searchQuery}"` : "Try switching filter tabs"}
                                        </p>
                                    </td>
                                </tr>
                            ) : (
                                filteredItems.map((item, idx) => {
                                    const isSelected = item.selected;
                                    const isReturned = item.returnStatus === "Returned";

                                    return (
                                        <tr
                                            key={item.tool || item.toolId || idx}
                                            onClick={() => handleToggleSelectByToolId(item.toolId)}
                                            className={`transition-colors cursor-pointer ${
                                                !isSelected
                                                    ? "bg-muted/20 opacity-60 hover:opacity-90"
                                                    : !isReturned
                                                    ? "bg-rose-500/[0.04] hover:bg-rose-500/[0.08]"
                                                    : "bg-primary/[0.03] hover:bg-primary/[0.07]"
                                            }`}
                                        >
                                            <td className="px-4 py-3 text-center" onClick={e => e.stopPropagation()}>
                                                <input
                                                    type="checkbox"
                                                    checked={isSelected}
                                                    onChange={() => handleToggleSelectByToolId(item.toolId)}
                                                    className="rounded border-border text-primary focus:ring-primary size-4 cursor-pointer"
                                                />
                                            </td>
                                            <td className="px-3 py-3 text-center font-semibold text-muted-foreground">{idx + 1}</td>
                                            <td className="px-4 py-3 font-mono text-xs font-bold text-primary">{item.toolId}</td>
                                            <td className="px-4 py-3 font-medium text-foreground">{item.description}</td>
                                            <td className="px-4 py-3 font-mono text-xs text-muted-foreground">{item.toolCode || "-"}</td>
                                            <td className="px-4 py-3 text-center font-semibold">{item.quantity} {item.unit}</td>
                                            <td className="px-4 py-3 text-center" onClick={e => e.stopPropagation()}>
                                                {isSelected ? (
                                                    <div className="inline-flex items-center rounded-lg border p-0.5 bg-muted">
                                                        <button
                                                            type="button"
                                                            onClick={() => handleStatusToggleByToolId(item.toolId, "Returned")}
                                                            className={`px-3 py-1 rounded-md text-xs font-semibold flex items-center gap-1 transition-all ${
                                                                isReturned
                                                                    ? "bg-emerald-600 text-white shadow-xs"
                                                                    : "text-muted-foreground hover:text-foreground"
                                                            }`}
                                                        >
                                                            <CheckCircle2 className="size-3.5" /> Returned
                                                        </button>
                                                        <button
                                                            type="button"
                                                            onClick={() => handleStatusToggleByToolId(item.toolId, "Missing")}
                                                            className={`px-3 py-1 rounded-md text-xs font-semibold flex items-center gap-1 transition-all ${
                                                                !isReturned
                                                                    ? "bg-rose-600 text-white shadow-xs"
                                                                    : "text-muted-foreground hover:text-foreground"
                                                            }`}
                                                        >
                                                            <AlertTriangle className="size-3.5" /> Missing
                                                        </button>
                                                    </div>
                                                ) : (
                                                    <span className="text-xs px-2.5 py-1 rounded-md bg-muted text-muted-foreground font-semibold inline-flex items-center gap-1">
                                                        <Clock className="size-3" /> Stays Pending (In Use)
                                                    </span>
                                                )}
                                            </td>
                                            <td className="px-4 py-3" onClick={e => e.stopPropagation()}>
                                                <Input
                                                    disabled={!isSelected}
                                                    placeholder={
                                                        !isSelected
                                                            ? "Item not selected for this return"
                                                            : !isReturned
                                                            ? "Reason for missing item required..."
                                                            : "Optional remarks"
                                                    }
                                                    className={`h-8 text-xs ${
                                                        isSelected && !isReturned ? "border-rose-300 dark:border-rose-800" : ""
                                                    }`}
                                                    value={item.remarks}
                                                    onChange={e => handleItemChangeByToolId(item.toolId, "remarks", e.target.value)}
                                                />
                                            </td>
                                        </tr>
                                    );
                                })
                            )}
                        </tbody>
                    </table>
                </CardContent>
                <CardFooter className="bg-muted/30 px-6 py-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-sm font-semibold border-t">
                    <span className="text-muted-foreground">
                        {selectedItems.length} of {items.length} Pending Item(s) Selected for Return
                    </span>
                    <div className="flex items-center gap-6">
                        <span className="text-emerald-600">Selected Returned: <strong>{returnedItems.length}</strong></span>
                        <span className="text-rose-600">Selected Missing: <strong>{missingItems.length}</strong></span>
                        <span className="text-amber-600">Kept on DC: <strong>{remainingPendingCount}</strong></span>
                    </div>
                </CardFooter>
            </Card>

            {/* Previously Returned Tools Collapsible Section */}
            {alreadyReturnedList.length > 0 && (
                <Card className="border-border/60">
                    <CardHeader
                        className="py-3 px-5 cursor-pointer hover:bg-muted/20 transition-colors flex flex-row items-center justify-between"
                        onClick={() => setShowAlreadyReturned(!showAlreadyReturned)}
                    >
                        <div className="flex items-center gap-2">
                            <CheckCircle2 className="size-4 text-emerald-600 shrink-0" />
                            <CardTitle className="text-sm font-bold">
                                Previously Returned Tools ({alreadyReturnedList.length})
                            </CardTitle>
                            <span className="text-xs text-muted-foreground ml-2">
                                (Processed via earlier Return Challans against {dc.challanNumber})
                            </span>
                        </div>
                        <Button variant="ghost" size="sm" className="h-7 w-7 p-0">
                            {showAlreadyReturned ? <ChevronUp className="size-4" /> : <ChevronDown className="size-4" />}
                        </Button>
                    </CardHeader>

                    {showAlreadyReturned && (
                        <CardContent className="p-0 border-t">
                            <table className="min-w-full text-xs text-left whitespace-nowrap">
                                <thead className="bg-muted text-[11px] uppercase text-muted-foreground font-semibold">
                                    <tr>
                                        <th className="px-4 py-2.5">#</th>
                                        <th className="px-4 py-2.5">Tool ID</th>
                                        <th className="px-4 py-2.5">Description</th>
                                        <th className="px-4 py-2.5">Tool Code</th>
                                        <th className="px-4 py-2.5 text-center">Status</th>
                                        <th className="px-4 py-2.5">RC Reference</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-border/40">
                                    {alreadyReturnedList.map((t: any, idx: number) => (
                                        <tr key={t.tool || idx} className="hover:bg-muted/10 opacity-75">
                                            <td className="px-4 py-2.5 font-semibold text-muted-foreground">{idx + 1}</td>
                                            <td className="px-4 py-2.5 font-mono font-bold text-primary">{t.toolId}</td>
                                            <td className="px-4 py-2.5 font-medium">{t.description || "-"}</td>
                                            <td className="px-4 py-2.5 font-mono">{t.toolCode || "-"}</td>
                                            <td className="px-4 py-2.5 text-center">
                                                {t.returnStatus === "Returned" ? (
                                                    <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-500/15 text-emerald-700 dark:text-emerald-400">
                                                        Returned
                                                    </span>
                                                ) : (
                                                    <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-rose-500/15 text-rose-700 dark:text-rose-400">
                                                        Missing
                                                    </span>
                                                )}
                                            </td>
                                            <td className="px-4 py-2.5 font-mono text-xs font-semibold text-muted-foreground">
                                                {t.returnChallanNumber || "Previous RC"}
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </CardContent>
                    )}
                </Card>
            )}
        </div>
    );
}

export default ReturnChallanPreviewPage;
