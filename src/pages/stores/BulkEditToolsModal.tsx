 import { useState, useEffect } from "react";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogDescription
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { SearchableSelect } from "@/components/ui/searchable-select";
import toolService from "@/services/tool.service";
import profileService from "@/services/profile.service";
import { DatePickerField } from "@/components/DynamicForm/DynamicField";
import { toast } from "sonner";
import { Loader2, Edit3, AlertTriangle, CheckCircle2, ArrowLeft, X } from "lucide-react";

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
    "Moving",
    "Repair"
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
    const [supplierProfiles, setSupplierProfiles] = useState<any[]>([]);

    useEffect(() => {
        if (open) {
            profileService.getProfiles({ profileType: 'Supplier', limit: 1000 })
                .then(res => {
                    if (res.success && res.data) {
                        setSupplierProfiles(res.data);
                    }
                })
                .catch(err => console.error("Error fetching suppliers in bulk edit:", err));
        }
    }, [open]);

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
        <Dialog open={open} onOpenChange={(val) => { if (!val) resetForm(); onOpenChange(val); }}>
            <DialogContent hideClose={true} className="max-w-2xl rounded-xl p-0 overflow-hidden shadow-2xl flex flex-col">
                <DialogHeader className="px-5 py-3 border-b border-border/60 bg-muted/20 shrink-0">
                    <div className="flex items-center justify-between gap-3">
                        <div className="flex items-center gap-2.5">
                            <div className="p-2 rounded-lg bg-primary/10 text-primary shrink-0">
                                <Edit3 className="size-4.5" />
                            </div>
                            <div>
                                <DialogTitle className="text-sm sm:text-base font-bold text-foreground">
                                    Bulk Edit ({totalCount} selected tools)
                                </DialogTitle>
                                <DialogDescription className="text-[11px] text-muted-foreground mt-0.5">
                                    Update common attributes across the {totalCount} selected tools. Blank fields will remain unchanged.
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

                {!isConfirmStep ? (
                    <form onSubmit={handleProceedToReview} className="flex flex-col flex-1 min-h-0">
                        <div className="p-4 sm:p-5 space-y-3.5 max-h-[60vh] overflow-y-auto flex-1">
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                <div>
                                    <Label className="text-[11px] font-semibold text-foreground/90 mb-1 block">Validation</Label>
                                    <Input
                                        type="text"
                                        placeholder="e.g. 31-12-2028 or 2 Years"
                                        value={formValues.validityPeriod}
                                        onChange={(e) => handleChange("validityPeriod", e.target.value)}
                                        className="h-7.5 sm:h-8 rounded-lg text-xs px-2.5"
                                    />
                                </div>

                                <div>
                                    <Label className="text-[11px] font-semibold text-foreground/90 mb-1 block">Date of Supply / Inspection</Label>
                                    <DatePickerField
                                        value={formValues.dateOfSupply}
                                        onChange={(val) => handleChange("dateOfSupply", val)}
                                        placeholder="Pick date of supply"
                                        className="h-7.5 sm:h-8 rounded-lg text-xs px-2.5 font-mono"
                                        hideActionBadge={true}
                                    />
                                </div>

                                <div>
                                    <Label className="text-[11px] font-semibold text-foreground/90 mb-1 block">Status</Label>
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
                                    <Label className="text-[11px] font-semibold text-foreground/90 mb-1 block">Supplier Code / Supplier</Label>
                                    <Input
                                        type="text"
                                        placeholder="e.g. SUPP-2026"
                                        value={formValues.supplierCode}
                                        onChange={(e) => handleChange("supplierCode", e.target.value)}
                                        className="h-7.5 sm:h-8 rounded-lg text-xs px-2.5"
                                />
                            </div>

                            <div>
                                <Label className="text-[11px] font-semibold text-foreground/90 mb-1 block">Purchaser Name (Supplier)</Label>
                                {supplierProfiles.length > 0 ? (
                                    <SearchableSelect
                                        value={formValues.purchaserName || "All"}
                                        onValueChange={(val) => {
                                            const actualVal = val === "All" ? "" : val;
                                            handleChange("purchaserName", actualVal);
                                            const matched = supplierProfiles.find(s => s.name === actualVal);
                                            if (matched && matched.code) {
                                                handleChange("supplierCode", matched.code);
                                            }
                                        }}
                                        options={supplierProfiles.map(s => s.name)}
                                        placeholder="Select Purchaser / Supplier"
                                        searchPlaceholder="Search supplier..."
                                        allLabel="Do Not Change Purchaser"
                                        allValue="All"
                                    />
                                ) : (
                                    <Input
                                        type="text"
                                        placeholder="e.g. L&T Logistics"
                                        value={formValues.purchaserName}
                                        onChange={(e) => handleChange("purchaserName", e.target.value)}
                                        className="h-7.5 sm:h-8 rounded-lg text-xs px-2.5"
                                    />
                                )}
                            </div>

                            <div>
                                <Label className="text-[11px] font-semibold text-foreground/90 mb-1 block">Purchaser Contact</Label>
                                <Input
                                    type="text"
                                    placeholder="Contact info"
                                    value={formValues.purchaserContact}
                                    onChange={(e) => handleChange("purchaserContact", e.target.value)}
                                    className="h-7.5 sm:h-8 rounded-lg text-xs px-2.5"
                                />
                            </div>

                            <div>
                                <Label className="text-[11px] font-semibold text-foreground/90 mb-1 block">Tool Variant</Label>
                                <Input
                                    type="text"
                                    placeholder="e.g. Standard 5T"
                                    value={formValues.toolVariant}
                                    onChange={(e) => handleChange("toolVariant", e.target.value)}
                                    className="h-7.5 sm:h-8 rounded-lg text-xs px-2.5"
                                />
                            </div>

                            <div>
                                <Label className="text-[11px] font-semibold text-foreground/90 mb-1 block">Job Code</Label>
                                <Input
                                    type="text"
                                    placeholder="Job / Work code"
                                    value={formValues.jobCode}
                                    onChange={(e) => handleChange("jobCode", e.target.value)}
                                    className="h-7.5 sm:h-8 rounded-lg text-xs px-2.5"
                                />
                            </div>

                            <div>
                                <Label className="text-[11px] font-semibold text-foreground/90 mb-1 block">Make Year</Label>
                                <Input
                                    type="text"
                                    placeholder="e.g. 2025"
                                    value={formValues.makeYear}
                                    onChange={(e) => handleChange("makeYear", e.target.value)}
                                    className="h-7.5 sm:h-8 rounded-lg text-xs px-2.5"
                                />
                            </div>

                            <div>
                                <Label className="text-[11px] font-semibold text-foreground/90 mb-1 block">Capacity / SWL</Label>
                                <Input
                                    type="text"
                                    placeholder="Safe working load"
                                    value={formValues.safeWorkingLoad}
                                    onChange={(e) => handleChange("safeWorkingLoad", e.target.value)}
                                    className="h-7.5 sm:h-8 rounded-lg text-xs px-2.5"
                                />
                            </div>
                        </div>

                        <div>
                            <Label className="text-[11px] font-semibold text-foreground/90 mb-1 block">Remarks</Label>
                            <Input
                                type="text"
                                placeholder="Additional notes or bulk update remarks..."
                                value={formValues.remarks}
                                onChange={(e) => handleChange("remarks", e.target.value)}
                                className="h-7.5 sm:h-8 rounded-lg text-xs px-2.5"
                            />
                        </div>
                    </div>

                    <div className="px-5 py-3 border-t bg-muted/30 shrink-0 flex items-center justify-end gap-2.5">
                        <Button
                            type="button"
                            variant="outline"
                            onClick={() => onOpenChange(false)}
                            className="h-8 px-3 rounded-lg text-xs"
                        >
                            Cancel
                        </Button>
                        <Button
                            type="submit"
                            disabled={activeUpdateKeys.length === 0}
                            className="h-8 px-3.5 rounded-lg text-xs font-semibold shadow-sm"
                        >
                            Review Changes ({activeUpdateKeys.length} field{activeUpdateKeys.length === 1 ? '' : 's'})
                        </Button>
                    </div>
                </form>
            ) : (
                <div className="flex flex-col flex-1 min-h-0">
                    <div className="p-4 sm:p-5 space-y-4 max-h-[60vh] overflow-y-auto flex-1">
                        <div className="rounded-lg bg-amber-500/10 border border-amber-500/20 p-3 flex items-start gap-2.5 text-amber-800 dark:text-amber-300">
                            <AlertTriangle className="size-4 text-amber-600 shrink-0 mt-0.5" />
                            <div>
                                <h4 className="font-bold text-xs">Confirmation Required</h4>
                                <p className="text-[11px] mt-0.5 leading-relaxed">
                                    You are about to update <strong>{totalCount} selected tools</strong>. Are you sure you want to continue?
                                </p>
                            </div>
                        </div>

                        <div className="space-y-1.5">
                            <h5 className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground">
                                Summary of Updates to Apply:
                            </h5>
                            <div className="border rounded-lg divide-y bg-muted/20 text-xs max-h-40 overflow-y-auto">
                                {Object.entries(activeUpdates).map(([key, val]) => (
                                    <div key={key} className="px-3 py-1.5 flex items-center justify-between text-xs">
                                        <span className="font-semibold text-[11px] text-muted-foreground capitalize">
                                            {key.replace(/([A-Z])/g, ' $1')}
                                        </span>
                                        <span className="font-mono text-[11px] font-semibold bg-background px-2 py-0.5 rounded border">
                                            {val}
                                        </span>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>

                    <div className="px-5 py-3 border-t bg-muted/30 shrink-0 flex items-center justify-between w-full">
                        <Button
                            type="button"
                            variant="outline"
                            onClick={() => setIsConfirmStep(false)}
                            disabled={loading}
                            className="h-8 px-3 rounded-lg text-xs gap-1.5"
                        >
                            <ArrowLeft className="size-3.5" />
                            Back
                        </Button>

                        <Button
                            type="button"
                            onClick={handleConfirmUpdate}
                            disabled={loading}
                            className="h-8 px-3.5 rounded-lg text-xs font-semibold shadow-sm gap-1.5"
                        >
                            {loading ? (
                                <>
                                    <Loader2 className="size-3.5 animate-spin" />
                                    Updating {totalCount} Tools...
                                </>
                            ) : (
                                <>
                                    <CheckCircle2 className="size-3.5" />
                                    Confirm & Apply to {totalCount} Tools
                                </>
                            )}
                        </Button>
                    </div>
                </div>
            )}
            </DialogContent>
        </Dialog>
    );
}
