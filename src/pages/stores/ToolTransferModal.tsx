import { useState, useEffect } from "react";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogDescription
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { SearchableSelect } from "@/components/ui/searchable-select";
import toolService from "@/services/tool.service";
import type { ToolRecord } from "@/services/tool.service";
import storeService from "@/services/store.service";
import type { StoreRecord } from "@/services/store.service";
import { generateTransferChallanPDF } from "@/utils/pdf/challanPdfGenerator";
import { toast } from "sonner";
import { Tooltip, TooltipTrigger, TooltipContent, TooltipProvider } from "@/components/ui/tooltip";
import { Loader2, ArrowRightLeft, Store, Building2, Wrench, AlertCircle, CheckCircle2, Download, X } from "lucide-react";

interface ToolTransferModalProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    sourceStoreId: string;
    selectedToolIds: string[];
    selectedTools?: ToolRecord[];
    onSuccess: () => void;
}

export function ToolTransferModal({
    open,
    onOpenChange,
    sourceStoreId,
    selectedToolIds = [],
    selectedTools = [],
    onSuccess
}: ToolTransferModalProps) {
    const [loading, setLoading] = useState(false);
    const [fetchingStores, setFetchingStores] = useState(false);
    const [sourceStore, setSourceStore] = useState<StoreRecord | null>(null);
    const [destinationStores, setDestinationStores] = useState<StoreRecord[]>([]);
    const [destinationStoreId, setDestinationStoreId] = useState<string>("");
    const [remarks, setRemarks] = useState<string>("");
    const [showPreview, setShowPreview] = useState<boolean>(false);
    const [completedChallan, setCompletedChallan] = useState<any | null>(null);

    useEffect(() => {
        if (open && sourceStoreId) {
            loadStoreDetailsAndSiblings();
        } else {
            resetForm();
        }
    }, [open, sourceStoreId]);

    const resetForm = () => {
        setDestinationStoreId("");
        setRemarks("");
        setShowPreview(false);
        setSourceStore(null);
        setDestinationStores([]);
        setCompletedChallan(null);
    };

    const loadStoreDetailsAndSiblings = async () => {
        try {
            setFetchingStores(true);
            const res = await storeService.getStoreById(sourceStoreId);
            if (res.success && res.data) {
                const storeData = res.data;
                setSourceStore(storeData);

                // Determine project ID
                const projId = storeData.projectId ||
                    (typeof storeData.project === 'object' ? storeData.project?._id : storeData.project);

                if (projId) {
                    const storesRes = await storeService.getStores(projId);
                    if (storesRes.success && Array.isArray(storesRes.data)) {
                        // Filter out source store to show only valid destination stores in the SAME project
                        const siblingStores = storesRes.data.filter((s: StoreRecord) => String(s._id) !== String(sourceStoreId));
                        setDestinationStores(siblingStores);
                    }
                }
            }
        } catch (error: any) {
            toast.error(error?.response?.data?.message || "Failed to load store information");
        } finally {
            setFetchingStores(false);
        }
    };

    const handleTransfer = async () => {
        if (!destinationStoreId) {
            toast.error("Please select a destination store.");
            return;
        }

        if (selectedToolIds.length === 0) {
            toast.error("No tools selected for transfer.");
            return;
        }

        if (selectedTools.some((t: any) => !t.isPrinted)) {
            return;
        }

        try {
            setLoading(true);
            const res = await toolService.transferTools({
                sourceStoreId,
                destinationStoreId,
                toolIds: selectedToolIds,
                remarks
            });

            if (res.success) {
                toast.success(res.message || `Successfully transferred ${selectedToolIds.length} tools.`);
                const challanDoc = (res as any).challan || res.data?.challan || (res.data?.transferRef ? {
                    challanNumber: res.data.transferRef,
                    challanType: 'Transfer',
                    status: 'Completed',
                    isStoreTransfer: true,
                    challanDate: new Date().toISOString(),
                    sourceStore: res.data.sourceStore || { name: sourceStore?.name || "Source Store" },
                    destinationStore: res.data.destinationStore || { name: selectedDestStore?.name || "Destination Store" },
                    project: { name: projectName },
                    toolCount: selectedToolIds.length,
                    items: selectedTools.map((t: any, idx: number) => ({
                        tool: t._id,
                        toolId: t.toolId || `TOOL-${idx + 1}`,
                        description: t.description || t.name || 'Tool Item',
                        toolCode: t.toolCode || '',
                        category: t.toolType || t.category || '',
                        capacity: t.capacity || '',
                        safeWorkingLoad: t.safeWorkingLoad || '',
                        serialNumber: t.serialNumber || '',
                        makeYear: t.makeYear || '',
                        quantity: 1,
                        unit: 'NOS',
                        remarks: ''
                    })),
                    createdBy: { name: 'L&T Store Admin' }
                } : null);

                if (challanDoc) {
                    setCompletedChallan(challanDoc);
                    try {
                        await generateTransferChallanPDF(challanDoc, { download: true });
                        toast.success(`Automatically downloaded Transfer Challan PDF (${challanDoc.challanNumber})`);
                    } catch (pdfErr) {
                        console.error("Automatic PDF download error:", pdfErr);
                        toast.error("Transfer completed, but automatic PDF download failed. Use the manual download button below.");
                    }
                } else {
                    onOpenChange(false);
                    resetForm();
                }
                onSuccess();
            } else {
                toast.error(res.message || "Failed to transfer tools.");
            }
        } catch (error: any) {
            toast.error(error?.response?.data?.message || "An error occurred while transferring tools.");
        } finally {
            setLoading(false);
        }
    };

    const handleDownloadPdf = async () => {
        if (!completedChallan) return;
        try {
            await generateTransferChallanPDF(completedChallan, { download: true });
            toast.success(`Downloaded Transfer Challan PDF (${completedChallan.challanNumber})`);
        } catch (err) {
            toast.error("Failed to download PDF");
        }
    };

    const projectName = sourceStore?.project?.name || (sourceStore?.project?.projectCode ? `Project (${sourceStore.project.projectCode})` : "Current Project");
    const selectedDestStore = destinationStores.find(s => String(s._id) === String(destinationStoreId));

    return (
        <Dialog open={open} onOpenChange={(val) => {
            if (!loading) {
                onOpenChange(val);
            }
        }}>
            <DialogContent className="max-w-md sm:max-w-xl p-0 gap-0 overflow-hidden bg-card border-border shadow-2xl rounded-xl" hideClose={true}>
                {completedChallan ? (
                    <>
                        <DialogHeader className="px-5 py-3 bg-emerald-500/10 border-b border-emerald-500/20">
                            <div className="flex items-center justify-between">
                                <div className="flex items-center gap-2.5">
                                    <div className="size-8 rounded-lg bg-emerald-500 text-white flex items-center justify-center font-bold shadow-xs">
                                        <CheckCircle2 className="size-4" />
                                    </div>
                                    <div>
                                        <DialogTitle className="text-sm sm:text-base font-bold tracking-tight text-foreground">
                                            Tool Transfer Completed!
                                        </DialogTitle>
                                        <DialogDescription className="text-[11px] text-muted-foreground mt-0.5">
                                            Transfer Challan generated automatically.
                                        </DialogDescription>
                                    </div>
                                </div>
                                <button
                                    type="button"
                                    onClick={() => {
                                        onOpenChange(false);
                                        resetForm();
                                    }}
                                    className="rounded-lg p-1.5 text-muted-foreground hover:text-foreground hover:bg-muted transition-colors shrink-0 cursor-pointer"
                                    aria-label="Close modal"
                                >
                                    <X className="size-4" />
                                </button>
                            </div>
                        </DialogHeader>

                        <div className="p-4 sm:p-5 space-y-3">
                            <div className="p-3 rounded-lg bg-card border border-border shadow-xs space-y-2.5">
                                <div className="flex items-center justify-between border-b pb-2">
                                    <div>
                                        <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">Challan Number</p>
                                        <p className="font-mono text-sm font-black text-primary mt-0.5">{completedChallan.challanNumber}</p>
                                    </div>
                                    <div className="text-right">
                                        <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">Transferred Tools</p>
                                        <p className="font-mono text-sm font-bold text-foreground mt-0.5">{completedChallan.toolCount || selectedToolIds.length} NOS</p>
                                    </div>
                                </div>

                                <div className="grid grid-cols-2 gap-2 text-xs">
                                    <div>
                                        <p className="text-[10px] font-medium text-muted-foreground">Source Store</p>
                                        <p className="font-semibold text-foreground truncate mt-0.5 text-xs">{completedChallan.sourceStore?.name || sourceStore?.name || "Source Store"}</p>
                                    </div>
                                    <div>
                                        <p className="text-[10px] font-medium text-muted-foreground">Destination Store</p>
                                        <p className="font-semibold text-foreground truncate mt-0.5 text-xs">{completedChallan.destinationStore?.name || selectedDestStore?.name || "Destination Store"}</p>
                                    </div>
                                </div>
                            </div>

                            <p className="text-[11px] text-muted-foreground text-center">
                                You can download the Transfer Challan PDF now or access it anytime in <strong>Challan History</strong>.
                            </p>
                        </div>

                        <div className="px-5 py-3 bg-muted/30 border-t border-border flex items-center justify-between shrink-0">
                            <Button
                                type="button"
                                variant="outline"
                                onClick={() => {
                                    onOpenChange(false);
                                    resetForm();
                                }}
                                className="h-8 px-3 rounded-lg text-xs"
                            >
                                Done
                            </Button>
                            <Button
                                type="button"
                                onClick={handleDownloadPdf}
                                className="h-8 px-3.5 rounded-lg text-xs font-semibold bg-primary text-primary-foreground hover:bg-primary/90 shadow-sm gap-1.5"
                            >
                                <Download className="size-3.5" />
                                Download Challan PDF
                            </Button>
                        </div>
                    </>
                ) : (
                    <>
                        <DialogHeader className="px-5 py-3 bg-muted/20 border-b border-border">
                            <div className="flex items-center justify-between">
                                <div className="flex items-center gap-2.5">
                                    <div className="size-8 rounded-lg bg-primary/10 text-primary flex items-center justify-center font-bold">
                                        <ArrowRightLeft className="size-4" />
                                    </div>
                                    <div>
                                        <DialogTitle className="text-sm sm:text-base font-bold tracking-tight text-foreground">
                                            Transfer Tools
                                        </DialogTitle>
                                        <DialogDescription className="text-[11px] text-muted-foreground mt-0.5">
                                            Move selected tools between stores within the same project.
                                        </DialogDescription>
                                    </div>
                                </div>
                                <button
                                    type="button"
                                    onClick={() => onOpenChange(false)}
                                    className="rounded-lg p-1.5 text-muted-foreground hover:text-foreground hover:bg-muted transition-colors shrink-0 cursor-pointer"
                                    aria-label="Close modal"
                                >
                                    <X className="size-4" />
                                </button>
                            </div>
                        </DialogHeader>

                        <div className="p-4 sm:p-5 space-y-3.5 max-h-[75vh] overflow-y-auto">
                            {/* Project & Source Context */}
                            <div className="grid grid-cols-2 gap-2.5 p-2.5 rounded-lg bg-muted/30 border border-border/80 text-xs">
                                <div className="flex items-start gap-2">
                                    <Building2 className="size-3.5 text-primary mt-0.5 shrink-0" />
                                    <div>
                                        <p className="text-[10px] font-medium text-muted-foreground uppercase tracking-wider">Project</p>
                                        <p className="font-semibold text-foreground truncate text-xs">{projectName}</p>
                                    </div>
                                </div>
                                <div className="flex items-start gap-2 border-l border-border/60 pl-2.5">
                                    <Store className="size-3.5 text-emerald-600 mt-0.5 shrink-0" />
                                    <div>
                                        <p className="text-[10px] font-medium text-muted-foreground uppercase tracking-wider">Source Store</p>
                                        <p className="font-semibold text-foreground truncate text-xs">{sourceStore?.name || "Loading..."}</p>
                                    </div>
                                </div>
                            </div>

                            {/* Tools Selected Summary */}
                            <div className="rounded-lg border border-primary/20 bg-primary/5 p-3 space-y-1.5">
                                <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-1.5">
                                        <Wrench className="size-3.5 text-primary" />
                                        <span className="text-xs font-semibold text-foreground">
                                            {selectedToolIds.length} {selectedToolIds.length === 1 ? "Tool" : "Tools"} Selected for Transfer
                                        </span>
                                    </div>
                                    {selectedTools.length > 0 && (
                                        <Button
                                            variant="ghost"
                                            size="sm"
                                            className="h-6 text-[11px] text-primary hover:bg-primary/10 px-2 rounded"
                                            onClick={() => setShowPreview(!showPreview)}
                                        >
                                            {showPreview ? "Hide List" : "View List"}
                                        </Button>
                                    )}
                                </div>

                                {showPreview && selectedTools.length > 0 && (
                                    <div className="max-h-36 overflow-y-auto mt-1.5 border rounded-lg bg-card/80 divide-y divide-border text-xs">
                                        {selectedTools.map((tool) => (
                                            <div key={tool._id} className="px-2.5 py-1.5 flex items-center justify-between gap-2">
                                                <div className="font-medium text-foreground truncate text-xs">
                                                    {tool.description || tool.name || tool.toolCode || tool.serialNumber || "Tool"}
                                                </div>
                                                <div className="text-muted-foreground text-[10px] shrink-0 font-mono">
                                                    {tool.serialNumber || tool.toolCode || tool._id.slice(-6)}
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>

                            {/* Destination Store Selector */}
                            <div className="space-y-1">
                                <Label className="text-[11px] font-semibold text-foreground/90 block mb-1">
                                    Destination Store <span className="text-rose-500">*</span>
                                </Label>
                                {fetchingStores ? (
                                    <div className="flex items-center gap-2 p-2.5 text-xs text-muted-foreground bg-muted/20 rounded-lg border border-border">
                                        <Loader2 className="size-3.5 animate-spin text-primary" />
                                        Loading sibling stores for {projectName}...
                                    </div>
                                ) : destinationStores.length === 0 ? (
                                    <div className="flex items-center gap-2 p-2.5 text-xs text-amber-700 bg-amber-500/10 border border-amber-500/20 rounded-lg">
                                        <AlertCircle className="size-3.5 shrink-0 text-amber-600" />
                                        <span>No other stores found in this project for transfer.</span>
                                    </div>
                                ) : (
                                    <SearchableSelect
                                        options={destinationStores.map(s => ({
                                            value: String(s._id),
                                            label: `${s.name} ${s.location ? `(${s.location})` : ''}`
                                        }))}
                                        value={destinationStoreId}
                                        onValueChange={(val) => setDestinationStoreId(val)}
                                        placeholder="Select destination store..."
                                    />
                                )}
                                {selectedDestStore && (
                                    <p className="text-[11px] text-emerald-600 dark:text-emerald-400 flex items-center gap-1 mt-1 font-medium">
                                        <CheckCircle2 className="size-3" />
                                        Transferring to: {selectedDestStore.name} {selectedDestStore.location ? `(${selectedDestStore.location})` : ''}
                                    </p>
                                )}
                            </div>

                            {/* Remarks Input */}
                            <div className="space-y-1">
                                <Label className="text-[11px] font-semibold text-foreground/90 block mb-1">
                                    Transfer Remarks / Reason <span className="text-muted-foreground font-normal">(Optional)</span>
                                </Label>
                                <Textarea
                                    placeholder="e.g. Relocating site tools for upcoming phase work..."
                                    value={remarks}
                                    onChange={(e) => setRemarks(e.target.value)}
                                    rows={2}
                                    className="min-h-[50px] rounded-lg border-border resize-none text-xs p-2 focus-visible:ring-primary"
                                />
                            </div>
                        </div>

                        <div className="px-5 py-3 bg-muted/30 border-t border-border flex items-center justify-between shrink-0">
                            <Button
                                type="button"
                                variant="outline"
                                onClick={() => onOpenChange(false)}
                                disabled={loading}
                                className="h-8 px-3 rounded-lg text-xs"
                            >
                                Cancel
                            </Button>
                            <TooltipProvider delay={100}>
                                <Tooltip>
                                    <TooltipTrigger>
                                        <span
                                            className="inline-block"
                                            title={
                                                !destinationStoreId
                                                    ? "Please select a destination store"
                                                    : selectedTools.some((t: any) => !t.isPrinted)
                                                        ? "Disabled: All selected tools must be marked as Printed before performing an inter-store Transfer"
                                                        : `Transfer ${selectedToolIds.length} tools`
                                            }
                                        >
                                            <Button
                                                type="button"
                                                onClick={handleTransfer}
                                                disabled={loading || fetchingStores || !destinationStoreId || destinationStores.length === 0 || selectedTools.some((t: any) => !t.isPrinted)}
                                                className="h-8 px-3.5 rounded-lg text-xs font-semibold bg-primary text-primary-foreground hover:bg-primary/90 shadow-sm gap-1.5"
                                            >
                                                {loading ? (
                                                    <>
                                                        <Loader2 className="size-3.5 animate-spin" />
                                                        Transferring...
                                                    </>
                                                ) : (
                                                    <>
                                                        <ArrowRightLeft className="size-3.5" />
                                                        Transfer {selectedToolIds.length} {selectedToolIds.length === 1 ? "Tool" : "Tools"}
                                                    </>
                                                )}
                                            </Button>
                                        </span>
                                    </TooltipTrigger>
                                    {(!destinationStoreId || selectedTools.some((t: any) => !t.isPrinted)) && (
                                        <TooltipContent side="top" className="bg-slate-900 text-white text-xs font-semibold px-3 py-1.5 rounded-xl shadow-xl max-w-xs text-center z-[100]">
                                            {!destinationStoreId
                                                ? "Please select a destination store"
                                                : "Disabled: All selected tools must be marked as Printed before performing an inter-store Transfer"}
                                        </TooltipContent>
                                    )}
                                </Tooltip>
                            </TooltipProvider>
                        </div>
                    </>
                )}
            </DialogContent>
        </Dialog>
    );
}
