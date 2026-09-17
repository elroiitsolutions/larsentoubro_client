import { useState } from "react";
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
import { SearchableSelect } from "@/components/ui/searchable-select";
import toolService from "@/services/tool.service";
import { toast } from "sonner";
import { Loader2, Edit3, AlertTriangle, CheckCircle2, ArrowLeft } from "lucide-react";

interface BulkEditToolsModalProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    storeId: string;
    selectedToolIds?: string[];
    filterCriteria?: Record<string, string>;
    totalCount: number;
    onSuccess: () => void;
}

const statusOptions = [
    "Available",
    "In Use",
    "Moving",
    "Maintenance",
    "Damaged",
    "Expired",
    "Missing"
];

export function BulkEditToolsModal({
    open,
    onOpenChange,
    storeId,
    selectedToolIds = [],
    totalCount,
    onSuccess
}: BulkEditToolsModalProps) {
    const [loading, setLoading] = useState(false);
    const [isConfirmStep, setIsConfirmStep] = useState(false);

    const [formValues, setFormValues] = useState<Record<string, string>>({
        validityPeriod: "",
        dateOfSupply: "",
        status: "",
        supplierCode: "",
        purchaserName: "",
        purchaserContact: "",
        makeYear: "",
        capacity: "",
        safeWorkingLoad: "",
        metalType: "",
        toolVariant: "",
        jobCode: "",
        remarks: ""
    });

    const handleChange = (field: string, value: string) => {
        setFormValues(prev => ({ ...prev, [field]: value }));
    };

    const activeUpdates = Object.fromEntries(
        Object.entries(formValues).filter(([_, val]) => val !== undefined && val !== null && val.trim() !== "")
    );
    const activeUpdateKeys = Object.keys(activeUpdates);

    const resetForm = () => {
        setFormValues({
            validityPeriod: "",
            dateOfSupply: "",
            status: "",
            supplierCode: "",
            purchaserName: "",
            purchaserContact: "",
            makeYear: "",
            capacity: "",
            safeWorkingLoad: "",
            metalType: "",
            toolVariant: "",
            jobCode: "",
            remarks: ""
        });
        setIsConfirmStep(false);
    };

    const handleProceedToReview = (e: React.FormEvent) => {
        e.preventDefault();
        if (activeUpdateKeys.length === 0) {
            toast.error("Please enter at least one field value to update");
            return;
        }
        setIsConfirmStep(true);
    };

    const handleConfirmUpdate = async () => {
        if (activeUpdateKeys.length === 0) return;
        if (!selectedToolIds || selectedToolIds.length === 0) {
            toast.error("No tools selected for bulk update");
            return;
        }
        setLoading(true);
        try {
            const payload = {
                updates: activeUpdates,
                toolIds: selectedToolIds
            };

            const res = await toolService.bulkEditTools(storeId, payload);
            if (res.success) {
                toast.success(res.message || `Successfully updated ${res.data?.count || totalCount} selected tools`);
                resetForm();
                onOpenChange(false);
                onSuccess();
            } else {
                toast.error(res.message || "Failed to perform bulk edit");
            }
        } catch (error: any) {
            console.error(error);
            toast.error(error?.response?.data?.message || "An error occurred while updating tools");
        } finally {
            setLoading(false);
        }
    };

    return (
        <Dialog open={open} onOpenChange={(val) => { if (!val) resetForm(); onOpenChange(val); }} className="max-w-2xl">
            <DialogContent className="p-0 overflow-hidden">
                <div className="p-6 border-b bg-muted/30">
                    <DialogHeader>
                        <DialogTitle className="text-xl font-bold flex items-center gap-2">
                            <Edit3 className="size-5 text-primary" />
                            Bulk Edit ({totalCount} selected tools)
                        </DialogTitle>
                        <DialogDescription className="text-sm text-muted-foreground">
                            Update common attributes across the {totalCount} selected tools. Blank fields will remain unchanged.
                        </DialogDescription>
                    </DialogHeader>
                </div>

                {!isConfirmStep ? (
                    <form onSubmit={handleProceedToReview} className="p-6 space-y-4 max-h-[60vh] overflow-y-auto">
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            <div>
                                <Label className="text-xs font-semibold text-muted-foreground mb-1 block">Validation</Label>
                                <Input
                                    type="text"
                                    placeholder="e.g. 31-12-2028 or 2 Years"
                                    value={formValues.validityPeriod}
                                    onChange={(e) => handleChange("validityPeriod", e.target.value)}
                                    className="rounded-xl"
                                />
                            </div>

                            <div>
                                <Label className="text-xs font-semibold text-muted-foreground mb-1 block">Date of Supply / Inspection</Label>
                                <Input
                                    type="date"
                                    value={formValues.dateOfSupply}
                                    onChange={(e) => handleChange("dateOfSupply", e.target.value)}
                                    className="rounded-xl"
                                />
                            </div>

                            <div>
                                <Label className="text-xs font-semibold text-muted-foreground mb-1 block">Status</Label>
                                <SearchableSelect
                                    value={formValues.status || "All"}
                                    onValueChange={(val) => handleChange("status", val === "All" ? "" : val)}
                                    options={statusOptions}
                                    placeholder="Select Status"
                                    searchPlaceholder="Search status..."
                                    allLabel="Do Not Change Status"
                                    allValue="All"
                                />
                            </div>

                            <div>
                                <Label className="text-xs font-semibold text-muted-foreground mb-1 block">Supplier Code / Supplier</Label>
                                <Input
                                    type="text"
                                    placeholder="e.g. SUPP-2026"
                                    value={formValues.supplierCode}
                                    onChange={(e) => handleChange("supplierCode", e.target.value)}
                                    className="rounded-xl"
                                />
                            </div>

                            <div>
                                <Label className="text-xs font-semibold text-muted-foreground mb-1 block">Purchaser Name</Label>
                                <Input
                                    type="text"
                                    placeholder="e.g. L&T Logistics"
                                    value={formValues.purchaserName}
                                    onChange={(e) => handleChange("purchaserName", e.target.value)}
                                    className="rounded-xl"
                                />
                            </div>

                            <div>
                                <Label className="text-xs font-semibold text-muted-foreground mb-1 block">Purchaser Contact</Label>
                                <Input
                                    type="text"
                                    placeholder="Contact info"
                                    value={formValues.purchaserContact}
                                    onChange={(e) => handleChange("purchaserContact", e.target.value)}
                                    className="rounded-xl"
                                />
                            </div>

                            <div>
                                <Label className="text-xs font-semibold text-muted-foreground mb-1 block">Tool Variant</Label>
                                <Input
                                    type="text"
                                    placeholder="e.g. Standard 5T"
                                    value={formValues.toolVariant}
                                    onChange={(e) => handleChange("toolVariant", e.target.value)}
                                    className="rounded-xl"
                                />
                            </div>

                            <div>
                                <Label className="text-xs font-semibold text-muted-foreground mb-1 block">Job Code</Label>
                                <Input
                                    type="text"
                                    placeholder="Job / Work code"
                                    value={formValues.jobCode}
                                    onChange={(e) => handleChange("jobCode", e.target.value)}
                                    className="rounded-xl"
                                />
                            </div>

                            <div>
                                <Label className="text-xs font-semibold text-muted-foreground mb-1 block">Make Year</Label>
                                <Input
                                    type="text"
                                    placeholder="e.g. 2025"
                                    value={formValues.makeYear}
                                    onChange={(e) => handleChange("makeYear", e.target.value)}
                                    className="rounded-xl"
                                />
                            </div>

                            <div>
                                <Label className="text-xs font-semibold text-muted-foreground mb-1 block">Capacity / SWL</Label>
                                <Input
                                    type="text"
                                    placeholder="Safe working load"
                                    value={formValues.safeWorkingLoad}
                                    onChange={(e) => handleChange("safeWorkingLoad", e.target.value)}
                                    className="rounded-xl"
                                />
                            </div>
                        </div>

                        <div>
                            <Label className="text-xs font-semibold text-muted-foreground mb-1 block">Remarks</Label>
                            <Input
                                type="text"
                                placeholder="Additional notes or bulk update remarks..."
                                value={formValues.remarks}
                                onChange={(e) => handleChange("remarks", e.target.value)}
                                className="rounded-xl"
                            />
                        </div>

                        <DialogFooter className="pt-4 border-t">
                            <Button
                                type="button"
                                variant="outline"
                                onClick={() => onOpenChange(false)}
                                className="rounded-xl"
                            >
                                Cancel
                            </Button>
                            <Button
                                type="submit"
                                disabled={activeUpdateKeys.length === 0}
                                className="rounded-xl font-semibold shadow-md"
                            >
                                Review Changes ({activeUpdateKeys.length} field{activeUpdateKeys.length === 1 ? '' : 's'})
                            </Button>
                        </DialogFooter>
                    </form>
                ) : (
                    <div className="p-6 space-y-6">
                        <div className="rounded-xl bg-amber-500/10 border border-amber-500/30 p-4 flex items-start gap-3 text-amber-800 dark:text-amber-300">
                            <AlertTriangle className="size-6 text-amber-600 shrink-0 mt-0.5" />
                            <div>
                                <h4 className="font-bold text-sm">Confirmation Required</h4>
                                <p className="text-xs mt-1 leading-relaxed">
                                    You are about to update <strong>{totalCount} selected tools</strong>. Are you sure you want to continue?
                                </p>
                            </div>
                        </div>

                        <div className="space-y-2">
                            <h5 className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                                Summary of Updates to Apply:
                            </h5>
                            <div className="border rounded-xl divide-y bg-muted/20 text-sm max-h-44 overflow-y-auto">
                                {Object.entries(activeUpdates).map(([key, val]) => (
                                    <div key={key} className="px-4 py-2.5 flex items-center justify-between">
                                        <span className="font-semibold text-xs text-muted-foreground capitalize">
                                            {key.replace(/([A-Z])/g, ' $1')}
                                        </span>
                                        <span className="font-mono text-xs font-semibold bg-background px-2.5 py-1 rounded-md border">
                                            {val}
                                        </span>
                                    </div>
                                ))}
                            </div>
                        </div>

                        <DialogFooter className="pt-4 border-t flex items-center justify-between w-full">
                            <Button
                                type="button"
                                variant="outline"
                                onClick={() => setIsConfirmStep(false)}
                                disabled={loading}
                                className="rounded-xl gap-1.5"
                            >
                                <ArrowLeft className="size-4" />
                                Back
                            </Button>

                            <Button
                                type="button"
                                onClick={handleConfirmUpdate}
                                disabled={loading}
                                className="rounded-xl font-bold px-6 shadow-lg bg-primary text-primary-foreground gap-2"
                            >
                                {loading ? (
                                    <>
                                        <Loader2 className="size-4 animate-spin" />
                                        Updating {totalCount} Tools...
                                    </>
                                ) : (
                                    <>
                                        <CheckCircle2 className="size-4" />
                                        Confirm & Apply to {totalCount} Tools
                                    </>
                                )}
                            </Button>
                        </DialogFooter>
                    </div>
                )}
            </DialogContent>
        </Dialog>
    );
}
