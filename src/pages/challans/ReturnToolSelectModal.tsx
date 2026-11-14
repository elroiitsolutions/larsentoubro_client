import { useState, useMemo, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
    Search,
    RotateCcw,
    CheckSquare,
    Square,
    Filter,
    Building2,
    Package,
    CheckCircle2,
    AlertTriangle,
    Clock,
    ArrowRight,
    X
} from "lucide-react";
import type { ChallanRecord } from "@/services/challan.service";

interface ReturnToolSelectModalProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    challan: ChallanRecord | null;
    onProceed: (challan: ChallanRecord, selectedToolIds: string[]) => void;
}

export function ReturnToolSelectModal({
    open,
    onOpenChange,
    challan,
    onProceed
}: ReturnToolSelectModalProps) {
    const [searchQuery, setSearchQuery] = useState("");
    const [statusFilter, setStatusFilter] = useState<"all" | "available" | "selected" | "closed">("available");
    const [selectedToolIds, setSelectedToolIds] = useState<Set<string>>(new Set());

    // When modal opens with a new challan, initialize selection with all available (pending) tools
    useEffect(() => {
        if (!challan || !open) return;
        const availableIds = (challan.items || [])
            .filter((i: any) => i.returnStatus !== "Returned" && i.returnStatus !== "Missing")
            .map((i: any) => String(i.tool?._id || i.tool || i._id || i.toolId));
        
        setSelectedToolIds(new Set(availableIds));
        setSearchQuery("");
        setStatusFilter("available");
    }, [challan, open]);

    const allItems = challan?.items || [];

    const isItemRepair = (i: any) => i.status === "Repair" || i.tool?.status === "Repair";

    // Categorize items
    const closedItems = allItems.filter(
        (i: any) => i.returnStatus === "Returned" || i.returnStatus === "Missing" || isItemRepair(i)
    );
    const availableItems = allItems.filter(
        (i: any) => i.returnStatus !== "Returned" && i.returnStatus !== "Missing" && !isItemRepair(i)
    );

    const getItemId = (item: any) => String(item.tool?._id || item.tool || item._id || item.toolId);

    // Filter tools based on search and statusFilter
    const filteredItems = useMemo(() => {
        if (!challan) return [];
        return allItems.filter((item: any) => {
            const id = getItemId(item);
            const isClosed = item.returnStatus === "Returned" || item.returnStatus === "Missing" || isItemRepair(item);
            const isSelected = selectedToolIds.has(id);

            // Tab filter
            if (statusFilter === "available" && isClosed) return false;
            if (statusFilter === "closed" && !isClosed) return false;
            if (statusFilter === "selected" && (isClosed || !isSelected)) return false;

            // Search query filter
            if (searchQuery.trim()) {
                const q = searchQuery.toLowerCase().trim();
                const matchId = (item.toolId || "").toLowerCase().includes(q);
                const matchDesc = (item.description || "").toLowerCase().includes(q);
                const matchCode = (item.toolCode || "").toLowerCase().includes(q);
                const matchCategory = (item.category || "").toLowerCase().includes(q);
                if (!matchId && !matchDesc && !matchCode && !matchCategory) return false;
            }

            return true;
        });
    }, [allItems, statusFilter, searchQuery, selectedToolIds]);

    // Available items currently visible
    const visibleAvailableItems = filteredItems.filter(
        (i: any) => i.returnStatus !== "Returned" && i.returnStatus !== "Missing" && !isItemRepair(i)
    );

    const isAllVisibleSelected =
        visibleAvailableItems.length > 0 &&
        visibleAvailableItems.every((i: any) => selectedToolIds.has(getItemId(i)));

    const handleToggleSelect = (itemId: string, isClosed: boolean) => {
        if (isClosed) return;
        const next = new Set(selectedToolIds);
        if (next.has(itemId)) {
            next.delete(itemId);
        } else {
            next.add(itemId);
        }
        setSelectedToolIds(next);
    };

    const handleSelectAllVisible = (select: boolean) => {
        const next = new Set(selectedToolIds);
        visibleAvailableItems.forEach((i: any) => {
            const id = getItemId(i);
            if (select) {
                next.add(id);
            } else {
                next.delete(id);
            }
        });
        setSelectedToolIds(next);
    };

    const handleSelectAllAvailable = () => {
        const next = new Set<string>();
        availableItems.forEach((i: any) => next.add(getItemId(i)));
        setSelectedToolIds(next);
    };

    const handleDeselectAll = () => {
        setSelectedToolIds(new Set());
    };

    const selectedCount = selectedToolIds.size;
    const remainingCount = availableItems.length - selectedCount;
    const isPartial = remainingCount > 0;

    const handleProceed = () => {
        if (!challan || selectedCount === 0) return;
        onOpenChange(false);
        onProceed(challan, Array.from(selectedToolIds));
    };

    if (!challan) return null;

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="w-full max-w-3xl lg:max-w-4xl max-h-[90vh] flex flex-col p-0 overflow-hidden rounded-xl border-border bg-card shadow-2xl" hideClose={true}>
                {/* Header */}
                <DialogHeader className="px-5 py-3 border-b border-border/60 bg-muted/20 shrink-0">
                    <div className="flex items-center justify-between gap-3">
                        <div className="flex items-center gap-2.5 min-w-0">
                            <div className="size-8 rounded-lg bg-primary/10 flex items-center justify-center text-primary shrink-0">
                                <RotateCcw className="size-4" />
                            </div>
                            <div className="min-w-0 flex-1">
                                <div className="flex flex-wrap items-center gap-1.5">
                                    <DialogTitle className="text-sm sm:text-base font-bold text-foreground">
                                        Select Tools for Return Challan
                                    </DialogTitle>
                                    <span className="font-mono text-[10px] px-2 py-0.5 rounded-full bg-primary/10 text-primary font-bold">
                                        {challan.challanNumber}
                                    </span>
                                </div>
                                <DialogDescription className="text-[11px] text-muted-foreground mt-0.5 flex flex-wrap items-center gap-x-2.5 gap-y-0.5">
                                    <span className="flex items-center gap-1 font-medium text-foreground">
                                        <Building2 className="size-3 text-muted-foreground" />
                                        {challan.vendor?.name || "Selected Vendor"}
                                    </span>
                                    <span>&bull;</span>
                                    <span>Date: {new Date(challan.challanDate).toLocaleDateString()}</span>
                                    <span>&bull;</span>
                                    <span>Total DC Tools: {allItems.length}</span>
                                </DialogDescription>
                            </div>
                        </div>

                        {/* Top quick stats badge & close */}
                        <div className="flex items-center gap-3 shrink-0">
                            <div className="text-right">
                                <span className="text-[10px] font-semibold text-muted-foreground uppercase block">Selected</span>
                                <span className="text-sm font-bold text-primary font-mono">{selectedCount} / {availableItems.length}</span>
                            </div>
                            <button
                                type="button"
                                onClick={() => onOpenChange(false)}
                                className="rounded-lg p-1.5 text-muted-foreground hover:text-foreground hover:bg-muted transition-colors cursor-pointer"
                                aria-label="Close modal"
                            >
                                <X className="size-4" />
                            </button>
                        </div>
                    </div>
                </DialogHeader>

                {/* Filter and Search Bar */}
                <div className="px-4 py-2.5 border-b border-border/50 bg-card space-y-2 shrink-0">
                    <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-2">
                        {/* Search Input */}
                        <div className="relative flex-1">
                            <Search className="size-3.5 absolute left-2.5 top-2.5 text-muted-foreground" />
                            <Input
                                placeholder="Search Tool ID, Description, Tool Code..."
                                className="pl-8 h-8 text-xs rounded-lg"
                                value={searchQuery}
                                onChange={e => setSearchQuery(e.target.value)}
                            />
                            {searchQuery && (
                                <button
                                    type="button"
                                    onClick={() => setSearchQuery("")}
                                    className="absolute right-2 top-2 text-muted-foreground hover:text-foreground"
                                >
                                    <X className="size-3.5" />
                                </button>
                            )}
                        </div>

                        {/* Quick Selection Buttons */}
                        <div className="flex items-center gap-1.5 shrink-0">
                            <Button
                                type="button"
                                size="sm"
                                variant="outline"
                                className="h-8 text-xs font-medium px-2.5 rounded-lg"
                                onClick={handleSelectAllAvailable}
                                title="Select all tools available for return"
                            >
                                <CheckSquare className="size-3 mr-1 text-primary" />
                                <span>Select All ({availableItems.length})</span>
                            </Button>
                            <Button
                                type="button"
                                size="sm"
                                variant="outline"
                                className="h-8 text-xs font-medium px-2.5 rounded-lg"
                                onClick={handleDeselectAll}
                                title="Clear selection"
                            >
                                <Square className="size-3 mr-1" />
                                <span>Clear Selection</span>
                            </Button>
                        </div>
                    </div>

                    {/* Filter Tabs */}
                    <div className="flex flex-wrap items-center justify-between gap-2 pt-1 border-t border-border/40 text-[11px]">
                        <div className="flex items-center gap-1.5 flex-wrap">
                            <span className="text-[10px] font-bold text-muted-foreground uppercase flex items-center gap-1 mr-1">
                                <Filter className="size-3 text-primary" /> Filter:
                            </span>
                            <button
                                type="button"
                                onClick={() => setStatusFilter("available")}
                                className={`px-2 py-0.5 rounded-md font-semibold transition-all cursor-pointer text-[11px] ${
                                    statusFilter === "available"
                                        ? "bg-primary text-primary-foreground shadow-xs"
                                        : "bg-muted/60 text-muted-foreground hover:text-foreground hover:bg-muted"
                                }`}
                            >
                                Available for Return ({availableItems.length})
                            </button>
                            <button
                                type="button"
                                onClick={() => setStatusFilter("selected")}
                                className={`px-2 py-0.5 rounded-md font-semibold transition-all cursor-pointer text-[11px] ${
                                    statusFilter === "selected"
                                        ? "bg-primary text-primary-foreground shadow-xs"
                                        : "bg-muted/60 text-muted-foreground hover:text-foreground hover:bg-muted"
                                }`}
                            >
                                Selected ({selectedCount})
                            </button>
                            <button
                                type="button"
                                onClick={() => setStatusFilter("all")}
                                className={`px-2 py-0.5 rounded-md font-semibold transition-all cursor-pointer text-[11px] ${
                                    statusFilter === "all"
                                        ? "bg-primary text-primary-foreground shadow-xs"
                                        : "bg-muted/60 text-muted-foreground hover:text-foreground hover:bg-muted"
                                }`}
                            >
                                All DC Tools ({allItems.length})
                            </button>
                            {closedItems.length > 0 && (
                                <button
                                    type="button"
                                    onClick={() => setStatusFilter("closed")}
                                    className={`px-2 py-0.5 rounded-md font-semibold transition-all cursor-pointer text-[11px] ${
                                        statusFilter === "closed"
                                            ? "bg-primary text-primary-foreground shadow-xs"
                                            : "bg-muted/60 text-muted-foreground hover:text-foreground hover:bg-muted"
                                    }`}
                                >
                                    Already Returned / Missing ({closedItems.length})
                                </button>
                            )}
                        </div>

                        <span className="text-muted-foreground text-[10px]">
                            Showing <strong>{filteredItems.length}</strong> of {allItems.length} tool(s)
                        </span>
                    </div>
                </div>

                {/* Tools Table */}
                <div className="flex-1 overflow-y-auto min-h-[220px] max-h-[380px]">
                    <table className="min-w-full text-xs text-left whitespace-nowrap">
                        <thead className="bg-muted/80 sticky top-0 z-10 text-[10px] uppercase text-muted-foreground font-semibold border-b">
                            <tr>
                                <th className="px-3 py-1.5 w-10 text-center">
                                    <input
                                        type="checkbox"
                                        checked={isAllVisibleSelected}
                                        onChange={e => handleSelectAllVisible(e.target.checked)}
                                        disabled={visibleAvailableItems.length === 0}
                                        className="rounded border-border text-primary focus:ring-primary size-3.5 cursor-pointer"
                                        title={isAllVisibleSelected ? "Deselect visible" : "Select all visible"}
                                    />
                                </th>
                                <th className="px-2.5 py-1.5 w-10 text-center">#</th>
                                <th className="px-3 py-1.5">Tool ID</th>
                                <th className="px-3 py-1.5">Description</th>
                                <th className="px-3 py-1.5">Tool Code</th>
                                <th className="px-3 py-1.5 text-center">Qty</th>
                                <th className="px-3 py-1.5 text-center">Return Status</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-border/40">
                            {filteredItems.length === 0 ? (
                                <tr>
                                    <td colSpan={7} className="px-4 py-8 text-center text-muted-foreground">
                                        <Package className="size-6 mx-auto mb-1.5 opacity-40 text-muted-foreground" />
                                        <p className="font-semibold text-xs">No tools match the selected filter</p>
                                        <p className="text-[11px] text-muted-foreground mt-0.5">
                                            {searchQuery ? `Try clearing your search "${searchQuery}"` : "Try selecting a different filter tab"}
                                        </p>
                                    </td>
                                </tr>
                            ) : (
                                filteredItems.map((item: any, idx: number) => {
                                    const id = getItemId(item);
                                    const isClosed = item.returnStatus === "Returned" || item.returnStatus === "Missing";
                                    const isSelected = selectedToolIds.has(id);

                                    return (
                                        <tr
                                            key={id || idx}
                                            onClick={() => handleToggleSelect(id, isClosed)}
                                            className={`transition-colors ${
                                                isClosed
                                                    ? "bg-muted/20 opacity-60 cursor-not-allowed"
                                                    : isSelected
                                                    ? "bg-primary/5 hover:bg-primary/10 cursor-pointer"
                                                    : "hover:bg-muted/30 cursor-pointer"
                                            }`}
                                        >
                                            <td className="px-3 py-1.5 text-center" onClick={e => e.stopPropagation()}>
                                                <input
                                                    type="checkbox"
                                                    checked={isSelected}
                                                    disabled={isClosed}
                                                    onChange={() => handleToggleSelect(id, isClosed)}
                                                    className="rounded border-border text-primary focus:ring-primary size-3.5 cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed"
                                                />
                                            </td>
                                            <td className="px-2.5 py-1.5 text-center font-semibold text-muted-foreground text-[11px]">
                                                {idx + 1}
                                            </td>
                                            <td className="px-3 py-1.5 font-mono text-[11px] font-bold text-primary">
                                                {item.toolId}
                                            </td>
                                            <td className="px-3 py-1.5 font-medium text-foreground text-xs">
                                                {item.description || "-"}
                                            </td>
                                            <td className="px-3 py-1.5 font-mono text-[11px] text-muted-foreground">
                                                {item.toolCode || "-"}
                                            </td>
                                            <td className="px-3 py-1.5 text-center font-semibold text-xs">
                                                {item.quantity || 1} {item.unit || "NOS"}
                                            </td>
                                            <td className="px-3 py-1.5 text-center whitespace-nowrap">
                                                {item.returnStatus === "Returned" ? (
                                                    <span className="inline-flex items-center gap-1 bg-emerald-500/15 text-emerald-700 dark:text-emerald-400 px-2 py-0.5 rounded-full text-[10px] font-semibold">
                                                        <CheckCircle2 className="size-2.5" /> Returned {item.returnChallanNumber ? `(${item.returnChallanNumber})` : ""}
                                                    </span>
                                                ) : item.returnStatus === "Missing" ? (
                                                    <span className="inline-flex items-center gap-1 bg-rose-500/15 text-rose-700 dark:text-rose-400 px-2 py-0.5 rounded-full text-[10px] font-semibold">
                                                        <AlertTriangle className="size-2.5" /> Missing {item.returnChallanNumber ? `(${item.returnChallanNumber})` : ""}
                                                    </span>
                                                ) : isItemRepair(item) ? (
                                                    <span className="inline-flex items-center gap-1 bg-orange-500/15 text-orange-700 dark:text-orange-400 px-2 py-0.5 rounded-full text-[10px] font-semibold" title="Tool is under repair and cannot be returned">
                                                        <AlertTriangle className="size-2.5" /> Under Repair
                                                    </span>
                                                ) : isSelected ? (
                                                    <span className="inline-flex items-center gap-1 bg-emerald-500/15 text-emerald-700 dark:text-emerald-400 px-2 py-0.5 rounded-full text-[10px] font-semibold">
                                                        <CheckCircle2 className="size-2.5" /> Selected For Return
                                                    </span>
                                                ) : (
                                                    <span className="inline-flex items-center gap-1 bg-amber-500/15 text-amber-700 dark:text-amber-400 px-2 py-0.5 rounded-full text-[10px] font-semibold">
                                                        <Clock className="size-2.5" /> Stays Pending On Site
                                                    </span>
                                                )}
                                            </td>
                                        </tr>
                                    );
                                })
                            )}
                        </tbody>
                    </table>
                </div>

                {/* Footer with summary & actions */}
                <div className="px-5 py-3 border-t border-border/60 bg-muted/30 flex flex-col sm:flex-row items-center justify-between gap-2.5 shrink-0">
                    <div className="text-[11px] text-muted-foreground flex items-center gap-2">
                        {selectedCount === 0 ? (
                            <span className="text-rose-600 font-semibold flex items-center gap-1">
                                <AlertTriangle className="size-3" /> Please select at least 1 tool to create a Return Challan.
                            </span>
                        ) : isPartial ? (
                            <span className="text-amber-700 dark:text-amber-400 font-semibold flex items-center gap-1">
                                <Clock className="size-3" /> Partial Return: {selectedCount} tools will be returned, {remainingCount} tools remain Pending on {challan.challanNumber}.
                            </span>
                        ) : (
                            <span className="text-emerald-700 dark:text-emerald-400 font-semibold flex items-center gap-1">
                                <CheckCircle2 className="size-3" /> Full Return: All {selectedCount} available tools selected. DC {challan.challanNumber} will be Completed.
                            </span>
                        )}
                    </div>

                    <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
                        <Button
                            variant="outline"
                            size="sm"
                            onClick={() => onOpenChange(false)}
                            className="h-8 px-3 text-xs rounded-lg"
                        >
                            Cancel
                        </Button>
                        <Button
                            size="sm"
                            disabled={selectedCount === 0}
                            onClick={handleProceed}
                            className="h-8 px-3.5 text-xs font-semibold rounded-lg bg-primary hover:bg-primary/90 text-primary-foreground flex items-center gap-1.5 shadow-xs"
                        >
                            <span>Proceed to Return Challan ({selectedCount} Tool{selectedCount > 1 ? "s" : ""})</span>
                            <ArrowRight className="size-3.5" />
                        </Button>
                    </div>
                </div>
            </DialogContent>
        </Dialog>
    );
}

export default ReturnToolSelectModal;
