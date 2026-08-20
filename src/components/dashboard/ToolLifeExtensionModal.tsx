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
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { ShieldCheck, Calendar, Clock, AlertTriangle } from "lucide-react";
import { toast } from "sonner";
import dashboardService from "@/services/dashboard.service";

interface Props {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    toolId?: string;
    toolDbId?: string;
    toolCode?: string;
    onSuccess?: () => void;
}

export const ToolLifeExtensionModal: React.FC<Props> = ({
    open,
    onOpenChange,
    toolId = "T-001",
    toolDbId,
    toolCode,
    onSuccess
}) => {
    const [extensionYears, setExtensionYears] = useState<number>(1);
    const [inspectorName, setInspectorName] = useState<string>("QA/QC Inspector");
    const [remarks, setRemarks] = useState<string>("Tool passed manual load and visual safety inspection. Approved for life extension.");
    const [loading, setLoading] = useState<boolean>(false);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        try {
            const idToUse = toolDbId || toolId;
            await dashboardService.extendToolLife(idToUse, {
                extensionYears,
                inspectorName,
                remarks
            });
            toast.success(`Tool ${toolId} validity successfully extended by ${extensionYears} year(s)!`);
            onOpenChange(false);
            if (onSuccess) onSuccess();
        } catch (err: any) {
            console.error("Failed to extend tool life:", err);
            toast.error(err?.response?.data?.message || "Failed to extend tool life");
        } finally {
            setLoading(false);
        }
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-[500px] rounded-2xl border-border/60 bg-card/95 backdrop-blur-xl">
                <DialogHeader>
                    <DialogTitle className="text-xl font-bold flex items-center gap-2 text-foreground">
                        <ShieldCheck className="size-5 text-emerald-500" />
                        <span>Tool Life Extension Approval</span>
                    </DialogTitle>
                    <DialogDescription className="text-xs text-muted-foreground mt-1">
                        Tools exceeding standard 3-year life require manual inspection approval to extend validity.
                    </DialogDescription>
                </DialogHeader>

                <form onSubmit={handleSubmit} className="space-y-4 py-2">
                    {/* Tool Summary Card */}
                    <div className="p-3.5 rounded-xl bg-muted/30 border border-border/50 flex items-center justify-between">
                        <div>
                            <span className="text-[10px] uppercase font-bold text-muted-foreground tracking-wider">Target Tool</span>
                            <div className="text-sm font-extrabold text-foreground">{toolId} {toolCode ? `(${toolCode})` : ""}</div>
                        </div>
                        <div className="flex items-center gap-1.5 text-xs text-amber-600 font-semibold bg-amber-500/10 px-2.5 py-1 rounded-lg border border-amber-500/20">
                            <Clock className="size-3.5" />
                            <span>3+ Yrs Manual Review</span>
                        </div>
                    </div>

                    {/* Extension Duration Selector */}
                    <div className="space-y-2">
                        <Label className="text-xs font-bold text-foreground">Select Validity Extension Duration</Label>
                        <div className="grid grid-cols-2 gap-3">
                            <button
                                type="button"
                                onClick={() => setExtensionYears(1)}
                                className={`p-3.5 rounded-xl border text-left transition-all flex flex-col justify-between ${
                                    extensionYears === 1
                                        ? "border-emerald-500 bg-emerald-500/10 ring-2 ring-emerald-500/30"
                                        : "border-border/60 bg-background hover:bg-muted/30"
                                }`}
                            >
                                <div className="flex items-center justify-between">
                                    <span className="font-bold text-sm text-foreground">+1 Year Extension</span>
                                    <Calendar className="size-4 text-emerald-500" />
                                </div>
                                <span className="text-[11px] text-muted-foreground mt-1">Extends validity for 12 months</span>
                            </button>

                            <button
                                type="button"
                                onClick={() => setExtensionYears(2)}
                                className={`p-3.5 rounded-xl border text-left transition-all flex flex-col justify-between ${
                                    extensionYears === 2
                                        ? "border-emerald-500 bg-emerald-500/10 ring-2 ring-emerald-500/30"
                                        : "border-border/60 bg-background hover:bg-muted/30"
                                }`}
                            >
                                <div className="flex items-center justify-between">
                                    <span className="font-bold text-sm text-foreground">+2 Years Extension</span>
                                    <Calendar className="size-4 text-emerald-500" />
                                </div>
                                <span className="text-[11px] text-muted-foreground mt-1">Extends validity for 24 months</span>
                            </button>
                        </div>
                    </div>

                    {/* Inspector Name */}
                    <div className="space-y-1.5">
                        <Label htmlFor="inspectorName" className="text-xs font-semibold text-foreground">Authorized QA/QC Inspector Name</Label>
                        <Input
                            id="inspectorName"
                            value={inspectorName}
                            onChange={(e) => setInspectorName(e.target.value)}
                            placeholder="e.g. R. K. Sharma (Lead Inspection Engineer)"
                            required
                            className="text-xs rounded-xl"
                        />
                    </div>

                    {/* Inspection Remarks */}
                    <div className="space-y-1.5">
                        <Label htmlFor="remarks" className="text-xs font-semibold text-foreground">Inspection Certificate & Remarks</Label>
                        <Textarea
                            id="remarks"
                            value={remarks}
                            onChange={(e) => setRemarks(e.target.value)}
                            placeholder="Enter load test certificate reference, structural condition, or safety approval remarks..."
                            rows={3}
                            className="text-xs rounded-xl"
                        />
                    </div>

                    <DialogFooter className="pt-2">
                        <Button type="button" variant="outline" onClick={() => onOpenChange(false)} className="rounded-xl text-xs">
                            Cancel
                        </Button>
                        <Button type="submit" disabled={loading} className="rounded-xl text-xs bg-emerald-600 hover:bg-emerald-700 text-white font-bold">
                            {loading ? "Processing..." : `Approve +${extensionYears} Yr Extension`}
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    );
};

export default ToolLifeExtensionModal;
