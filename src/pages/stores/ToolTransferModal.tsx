import { useState, useEffect } from "react";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogDescription,
    DialogFooter
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { SearchableSelect } from "@/components/ui/searchable-select";
import toolService from "@/services/tool.service";
import type { ToolRecord } from "@/services/tool.service";
import storeService from "@/services/store.service";
import type { StoreRecord } from "@/services/store.service";
import { toast } from "sonner";
import { Loader2, ArrowRightLeft, Store, Building2, Wrench, AlertCircle, CheckCircle2 } from "lucide-react";

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
                onOpenChange(false);
                resetForm();
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

    const projectName = sourceStore?.project?.name || (sourceStore?.project?.projectCode ? `Project (${sourceStore.project.projectCode})` : "Current Project");
    const selectedDestStore = destinationStores.find(s => String(s._id) === String(destinationStoreId));

    return (
        <Dialog open={open} onOpenChange={(val) => {
            if (!loading) {
                onOpenChange(val);
            }
        }}>
            <DialogContent className="max-w-xl p-0 gap-0 overflow-hidden bg-card border-border shadow-2xl rounded-2xl">
                <DialogHeader className="p-6 pb-4 bg-muted/30 border-b border-border">
                    <div className="flex items-center gap-3">
                        <div className="size-10 rounded-xl bg-primary/15 text-primary flex items-center justify-center font-bold">
                            <ArrowRightLeft className="size-5" />
                        </div>
                        <div>
                            <DialogTitle className="text-xl font-bold tracking-tight text-foreground">
                                Transfer Tools
                            </DialogTitle>
                            <DialogDescription className="text-xs text-muted-foreground mt-0.5">
                                Move selected tools between stores within the same project.
                            </DialogDescription>
                        </div>
                    </div>
                </DialogHeader>

                <div className="p-6 space-y-5 max-h-[75vh] overflow-y-auto">
                    {/* Project & Source Context */}
                    <div className="grid grid-cols-2 gap-3 p-3.5 rounded-xl bg-muted/40 border border-border/80 text-sm">
                        <div className="flex items-start gap-2.5">
                            <Building2 className="size-4 text-primary mt-0.5 shrink-0" />
                            <div>
                                <p className="text-[11px] font-medium text-muted-foreground uppercase tracking-wider">Project</p>
                                <p className="font-semibold text-foreground truncate">{projectName}</p>
                            </div>
                        </div>
                        <div className="flex items-start gap-2.5 border-l border-border/60 pl-3">
                            <Store className="size-4 text-emerald-600 mt-0.5 shrink-0" />
                            <div>
                                <p className="text-[11px] font-medium text-muted-foreground uppercase tracking-wider">Source Store</p>
                                <p className="font-semibold text-foreground truncate">{sourceStore?.name || "Loading..."}</p>
                            </div>
                        </div>
                    </div>

                    {/* Tools Selected Summary */}
                    <div className="rounded-xl border border-primary/20 bg-primary/5 p-4 space-y-2">
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                                <Wrench className="size-4 text-primary" />
                                <span className="text-sm font-semibold text-foreground">
                                    {selectedToolIds.length} {selectedToolIds.length === 1 ? "Tool" : "Tools"} Selected for Transfer
                                </span>
                            </div>
                            {selectedTools.length > 0 && (
                                <Button
                                    variant="ghost"
                                    size="sm"
                                    className="h-7 text-xs text-primary hover:bg-primary/10 px-2 rounded-lg"
                                    onClick={() => setShowPreview(!showPreview)}
                                >
                                    {showPreview ? "Hide List" : "View List"}
                                </Button>
                            )}
                        </div>

                        {showPreview && selectedTools.length > 0 && (
                            <div className="max-h-40 overflow-y-auto mt-2 border rounded-lg bg-card/80 divide-y divide-border text-xs">
                                {selectedTools.map((tool) => (
                                    <div key={tool._id} className="p-2 flex items-center justify-between gap-2">
                                        <div className="font-medium text-foreground truncate">
                                            {tool.description || tool.name || tool.toolCode || tool.serialNumber || "Tool"}
                                        </div>
                                        <div className="text-muted-foreground text-[11px] shrink-0 font-mono">
                                            {tool.serialNumber || tool.toolCode || tool._id.slice(-6)}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>

                    {/* Destination Store Selector */}
                    <div className="space-y-2">
                        <Label className="text-sm font-semibold text-foreground flex items-center gap-1.5">
                            Destination Store <span className="text-rose-500">*</span>
                        </Label>
                        {fetchingStores ? (
                            <div className="flex items-center gap-2 p-3 text-xs text-muted-foreground bg-muted/20 rounded-xl border border-border">
                                <Loader2 className="size-4 animate-spin text-primary" />
                                Loading sibling stores for {projectName}...
                            </div>
                        ) : destinationStores.length === 0 ? (
                            <div className="flex items-center gap-2 p-3.5 text-xs text-amber-700 bg-amber-500/10 border border-amber-500/20 rounded-xl">
                                <AlertCircle className="size-4 shrink-0 text-amber-600" />
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
                            <p className="text-xs text-emerald-600 dark:text-emerald-400 flex items-center gap-1.5 mt-1 font-medium">
                                <CheckCircle2 className="size-3.5" />
                                Transferring to: {selectedDestStore.name} {selectedDestStore.location ? `(${selectedDestStore.location})` : ''}
                            </p>
                        )}
                    </div>

                    {/* Remarks Input */}
                    <div className="space-y-2">
                        <Label className="text-sm font-semibold text-foreground">
                            Transfer Remarks / Reason <span className="text-muted-foreground text-xs font-normal">(Optional)</span>
                        </Label>
                        <Textarea
                            placeholder="e.g. Relocating site tools for upcoming phase work..."
                            value={remarks}
                            onChange={(e) => setRemarks(e.target.value)}
                            rows={3}
                            className="rounded-xl border-border resize-none text-sm focus-visible:ring-primary"
                        />
                    </div>
                </div>

                <DialogFooter className="p-4 bg-muted/30 border-t border-border flex items-center justify-between">
                    <Button
                        type="button"
                        variant="outline"
                        onClick={() => onOpenChange(false)}
                        disabled={loading}
                        className="rounded-xl"
                    >
                        Cancel
                    </Button>
                    <Button
                        type="button"
                        onClick={handleTransfer}
                        disabled={loading || fetchingStores || !destinationStoreId || destinationStores.length === 0}
                        className="rounded-xl bg-primary text-primary-foreground hover:bg-primary/90 shadow-md gap-2"
                    >
                        {loading ? (
                            <>
                                <Loader2 className="size-4 animate-spin" />
                                Transferring...
                            </>
                        ) : (
                            <>
                                <ArrowRightLeft className="size-4" />
                                Transfer {selectedToolIds.length} {selectedToolIds.length === 1 ? "Tool" : "Tools"}
                            </>
                        )}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
