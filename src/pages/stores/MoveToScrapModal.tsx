import React, { useState } from "react";
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
import { Archive, Loader2 } from "lucide-react";
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
            <DialogContent className="max-w-lg p-6 rounded-2xl">
                <DialogHeader>
                    <div className="flex items-center gap-3">
                        <div className="size-10 rounded-xl bg-amber-500/15 flex items-center justify-center text-amber-600 dark:text-amber-400 shrink-0">
                            <Archive className="size-5" />
                        </div>
                        <div>
                            <DialogTitle className="text-xl font-bold">
                                Move Selected Tools to Scrap
                            </DialogTitle>
                            <DialogDescription className="text-xs text-muted-foreground mt-0.5">
                                Mark tools as scrapped and transfer them to the Scrap section.
                            </DialogDescription>
                        </div>
                    </div>
                </DialogHeader>

                <form onSubmit={handleConfirmScrap} className="space-y-4 pt-2">
                    {/* Information Note */}
                    {/* <div className="flex items-start gap-2.5 p-3.5 rounded-xl bg-amber-500/10 border border-amber-500/20 text-xs text-amber-800 dark:text-amber-300">
                        <AlertCircle className="size-4 shrink-0 mt-0.5 text-amber-600 dark:text-amber-400" />
                        <div className="space-y-1">
                            <p className="font-semibold">Direct Scrap Movement (No Challan)</p>
                            <p className="text-amber-700/90 dark:text-amber-400/90 leading-relaxed">
                                The selected tools will be marked as <strong>Scrapped</strong> and moved directly to the Scrap page. 
                                Their project and store associations will remain intact. No Delivery Challan or Scrap Dealer is required at this stage.
                            </p>
                        </div>
                    </div> */}

                    {/* Tools Preview */}
                    <div className="p-3 bg-muted/40 rounded-xl border border-border/60 space-y-2">
                        <div className="flex items-center justify-between text-xs font-semibold">
                            <span className="text-muted-foreground">Selected Tools:</span>
                            <span className="font-bold text-foreground bg-primary/10 px-2 py-0.5 rounded-md text-primary">
                                {selectedTools.length} Tool(s)
                            </span>
                        </div>
                        <div className="max-h-28 overflow-y-auto flex flex-wrap gap-1.5 pt-1">
                            {selectedTools.map((t) => (
                                <span
                                    key={t._id}
                                    className="font-mono text-[11px] px-2 py-0.5 rounded bg-background border border-border/60 text-foreground font-medium"
                                >
                                    {t.toolId || t.toolCode || t._id}
                                </span>
                            ))}
                        </div>
                    </div>

                    {/* Reason / Remarks */}
                    <div className="space-y-1.5">
                        <Label htmlFor="scrap-reason" className="text-xs font-bold text-foreground">
                            Scrap Reason / Justification <span className="text-muted-foreground font-normal">(Optional)</span>
                        </Label>
                        <Textarea
                            id="scrap-reason"
                            placeholder="e.g. Beyond economical repair, mechanical failure, expired certificate..."
                            value={reason}
                            onChange={(e) => setReason(e.target.value)}
                            className="text-xs min-h-[70px] resize-none"
                            disabled={loading}
                        />
                    </div>

                    <DialogFooter className="gap-2 pt-2 border-t">
                        <Button
                            type="button"
                            variant="outline"
                            onClick={() => onOpenChange(false)}
                            disabled={loading}
                            className="rounded-xl h-9 text-xs"
                        >
                            Cancel
                        </Button>
                        <Button
                            type="submit"
                            disabled={loading || selectedTools.length === 0}
                            className="rounded-xl h-9 text-xs font-semibold bg-amber-600 hover:bg-amber-700 text-white gap-1.5 shadow-sm"
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
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    );
};

export default MoveToScrapModal;
