import React, { useState } from "react";
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
import { Archive, Loader2, X } from "lucide-react";
import toolService, { type ToolRecord } from "@/services/tool.service";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";

interface MoveToScrapModalProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    selectedTools: ToolRecord[] | any[];
    onSuccess?: () => void;
}

export const MoveToScrapModal: React.FC<MoveToScrapModalProps> = ({
    open,
    onOpenChange,
    selectedTools,
    onSuccess
}) => {
    const navigate = useNavigate();
    const [reason, setReason] = useState("");
    const [loading, setLoading] = useState(false);

    const handleConfirmScrap = async (e: React.FormEvent) => {
        e.preventDefault();
        if (selectedTools.length === 0) {
            toast.error("Please select at least one tool to scrap");
            return;
        }

        const unprinted = selectedTools.filter(t => !t.isPrinted);
        if (unprinted.length > 0) {
            toast.error("All selected tools must be printed before moving to Scrap");
            return;
        }

        try {
            setLoading(true);
            const toolIds = selectedTools.map(t => t._id);
            const res = await toolService.bulkScrapTools(toolIds, reason.trim());

            if (res.success) {
                const count = res.count ?? selectedTools.length;
                toast.success(`${count} tool(s) moved to Scrap successfully!`, {
                    action: {
                        label: "View Scrap",
                        onClick: () => navigate("/tools/scrap")
                    }
                });
                setReason("");
                onOpenChange(false);
                onSuccess?.();
            }
        } catch (error: any) {
            console.error("Failed to move tools to scrap:", error);
            toast.error(error?.response?.data?.message || error.message || "Failed to move tools to Scrap");
        } finally {
            setLoading(false);
        }
    };

    return (
        <Dialog open={open} onOpenChange={(o) => { if (!loading) onOpenChange(o); }}>
            <DialogContent hideClose={true} className="max-w-lg p-0 rounded-xl overflow-hidden shadow-2xl">
                <DialogHeader className="px-5 py-3 border-b border-border/60 bg-muted/20 shrink-0">
                    <div className="flex items-center justify-between gap-3">
                        <div className="flex items-center gap-2.5">
                            <div className="p-2 rounded-lg bg-amber-500/10 flex items-center justify-center text-amber-600 dark:text-amber-400 shrink-0">
                                <Archive className="size-4.5" />
                            </div>
                            <div>
                                <DialogTitle className="text-sm sm:text-base font-bold text-foreground">
                                    Move Selected Tools to Scrap
                                </DialogTitle>
                                <DialogDescription className="text-[11px] text-muted-foreground mt-0.5">
                                    Mark tools as scrapped and transfer them to the Scrap section.
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

                <form onSubmit={handleConfirmScrap} className="flex flex-col flex-1 min-h-0">
                    <div className="p-4 sm:p-5 space-y-3.5 flex-1 overflow-y-auto">
                        {/* Tools Preview */}
                        <div className="p-2.5 bg-muted/30 rounded-lg border border-border/60 space-y-1.5">
                            <div className="flex items-center justify-between text-[11px] font-semibold">
                                <span className="text-muted-foreground">Selected Tools:</span>
                                <span className="font-bold text-foreground bg-primary/10 px-2 py-0.5 rounded-md text-primary text-[10px]">
                                    {selectedTools.length} Tool(s)
                                </span>
                            </div>
                            <div className="max-h-24 overflow-y-auto flex flex-wrap gap-1 pt-0.5">
                                {selectedTools.map((t) => (
                                    <span
                                        key={t._id}
                                        className="font-mono text-[10px] px-1.5 py-0.5 rounded bg-background border border-border/60 text-foreground font-medium"
                                    >
                                        {t.toolId || t.toolCode || t._id}
                                    </span>
                                ))}
                            </div>
                        </div>

                        {/* Reason / Remarks */}
                        <div className="space-y-1">
                            <Label htmlFor="scrap-reason" className="text-[11px] font-semibold text-foreground/90 block mb-1">
                                Scrap Reason / Justification <span className="text-muted-foreground font-normal">(Optional)</span>
                            </Label>
                            <Textarea
                                id="scrap-reason"
                                placeholder="e.g. Beyond economical repair, mechanical failure, expired certificate..."
                                value={reason}
                                onChange={(e) => setReason(e.target.value)}
                                className="text-xs min-h-[50px] rounded-lg p-2 resize-none"
                                disabled={loading}
                            />
                        </div>
                    </div>

                    <div className="px-5 py-3 border-t border-border/60 bg-muted/30 shrink-0 flex items-center justify-end gap-2.5">
                        <Button
                            type="button"
                            variant="outline"
                            onClick={() => onOpenChange(false)}
                            disabled={loading}
                            className="h-8 rounded-lg px-4 text-xs font-semibold hover:bg-muted/60 cursor-pointer"
                        >
                            Cancel
                        </Button>
                        <Button
                            type="submit"
                            disabled={loading || selectedTools.length === 0}
                            className="h-8 rounded-lg px-4.5 text-xs font-semibold bg-amber-600 hover:bg-amber-700 text-white gap-1.5 cursor-pointer shadow-2xs"
                        >
                            {loading ? (
                                <>
                                    <Loader2 className="size-3.5 animate-spin" />
                                    Moving to Scrap...
                                </>
                            ) : (
                                <>
                                    <Archive className="size-3.5" />
                                    Move to Scrap ({selectedTools.length})
                                </>
                            )}
                        </Button>
                    </div>
                </form>
            </DialogContent>
        </Dialog>
    );
};

export default MoveToScrapModal;
