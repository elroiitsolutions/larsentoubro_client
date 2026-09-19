import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import {
    Building2,
    Calendar,
    Download,
    Package,
    CheckCircle2,
    AlertTriangle
} from "lucide-react";
import type { ChallanRecord } from "@/services/challan.service";
import {
    getChallanStatusBadgeClass,
    getChallanTypeBadgeClass
} from "@/utils/challan/challanCalculations";
import { generateDeliveryChallanPDF, generateReturnChallanPDF } from "@/utils/pdf/challanPdfGenerator";
import challanService from "@/services/challan.service";
import { toast } from "sonner";
import logoUrl from "@/assets/logo.png";

interface ChallanDetailModalProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    challan: ChallanRecord | null;
}

export function ChallanDetailModal({ open, onOpenChange, challan }: ChallanDetailModalProps) {
    if (!challan) return null;

    const handleDownloadPdf = async () => {
        try {
            if (challan.challanType === "Delivery") {
                await generateDeliveryChallanPDF(challan, { download: true });
            } else {
                await generateReturnChallanPDF(challan, { download: true });
            }
            await challanService.logPdfDownload(challan.challanNumber, `Downloaded PDF from details modal`);
            toast.success(`Downloaded PDF for ${challan.challanNumber}`);
        } catch (err: any) {
            toast.error("Failed to download PDF");
        }
    };

    const isReturn = challan.challanType === "Return";

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="w-full max-w-3xl lg:max-w-4xl max-h-[90vh] overflow-y-auto p-4 sm:p-6 space-y-5">
                <DialogHeader className="pr-10 sm:pr-12 border-b border-border/50 pb-4">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 sm:gap-4">
                        <div className="flex items-start sm:items-center gap-3 min-w-0">
                            <div className="size-11 sm:size-12 rounded-xl bg-background border border-border/80 flex items-center justify-center p-1.5 shadow-xs shrink-0 mt-0.5 sm:mt-0">
                                <img src={logoUrl} alt="L&T Logo" className="size-full object-contain" />
                            </div>
                            <div className="min-w-0 flex-1">
                                <div className="flex flex-wrap items-center gap-2">
                                    <DialogTitle className="text-xl sm:text-2xl font-black font-mono tracking-tight text-foreground whitespace-nowrap">
                                        {challan.challanNumber}
                                    </DialogTitle>
                                    <span className={`${getChallanTypeBadgeClass(challan.challanType)} shrink-0`}>
                                        {challan.challanType} Challan
                                    </span>
                                    <span className={`${getChallanStatusBadgeClass(challan.status)} shrink-0`}>
                                        {challan.status}
                                    </span>
                                </div>
                                <DialogDescription className="text-xs text-muted-foreground mt-1 truncate">
                                    Created on {new Date(challan.challanDate).toLocaleDateString()} by {challan.createdBy?.name || "L&T Admin"}
                                </DialogDescription>
                            </div>
                        </div>

                        <div className="flex items-center gap-2 self-start sm:self-center shrink-0">
                            <Button
                                size="sm"
                                variant="outline"
                                onClick={handleDownloadPdf}
                                className="h-8 sm:h-9 px-3 text-xs font-semibold flex items-center gap-1.5 shadow-xs rounded-xl hover:bg-muted"
                            >
                                <Download className="size-3.5 text-primary" />
                                <span>Download PDF</span>
                            </Button>
                        </div>
                    </div>
                </DialogHeader>

                {/* Metadata Grid */}
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3 sm:gap-4 bg-muted/30 p-3 sm:p-4 rounded-xl border border-border/60">
                    <div>
                        <p className="text-xs font-semibold text-muted-foreground uppercase flex items-center gap-1">
                            <Building2 className="size-3.5 text-primary shrink-0" /> Consignee Vendor
                        </p>
                        <p className="font-bold text-sm text-foreground mt-1 truncate">{challan.vendor?.name}</p>
                        <p className="font-mono text-xs text-muted-foreground">{challan.vendor?.vendorCode || "-"}</p>
                    </div>

                    <div>
                        <p className="text-xs font-semibold text-muted-foreground uppercase flex items-center gap-1">
                            <Calendar className="size-3.5 text-primary shrink-0" /> Dates & Reference
                        </p>
                        <p className="text-xs text-foreground mt-1">
                            <strong>Challan Date:</strong> {new Date(challan.challanDate).toLocaleDateString()}
                        </p>
                        {isReturn && challan.referenceDcNumber && (
                            <p className="text-xs text-foreground mt-0.5 truncate">
                                <strong>Reference DC:</strong> <span className="font-mono text-primary font-bold">{challan.referenceDcNumber}</span>
                            </p>
                        )}
                    </div>

                    <div className="sm:col-span-2 md:col-span-1">
                        <p className="text-xs font-semibold text-muted-foreground uppercase flex items-center gap-1">
                            <Package className="size-3.5 text-primary shrink-0" /> Inventory Summary
                        </p>
                        <p className="text-xs text-foreground mt-1">
                            <strong>Total Items:</strong> {challan.toolCount || (challan.items || []).length}
                        </p>
                        {isReturn && (
                            <div className="flex items-center gap-3 mt-1 text-xs font-semibold">
                                <span className="text-emerald-600">Returned: {challan.returnedCount || 0}</span>
                                <span className="text-rose-600">Missing: {challan.missingCount || 0}</span>
                            </div>
                        )}
                    </div>
                </div>

                {/* Remarks & Notes */}
                {(challan.remarks || challan.notes) && (
                    <div className="text-xs space-y-1 bg-card p-3 rounded-lg border">
                        {challan.remarks && (
                            <p><strong>Remarks:</strong> <span className="text-muted-foreground">{challan.remarks}</span></p>
                        )}
                        {challan.notes && (
                            <p><strong>Internal Notes:</strong> <span className="text-muted-foreground">{challan.notes}</span></p>
                        )}
                    </div>
                )}

                {/* Items Table */}
                <div className="border rounded-xl overflow-hidden">
                    <div className="bg-muted px-4 py-2.5 border-b font-semibold text-xs uppercase text-muted-foreground">
                        Challan Tool Items ({challan.items?.length || 0})
                    </div>
                    <div className="max-h-64 overflow-y-auto">
                        <table className="min-w-full text-sm text-left whitespace-nowrap">
                            <thead className="bg-card sticky top-0 border-b text-xs text-muted-foreground font-semibold">
                                <tr>
                                    <th className="px-4 py-2.5">#</th>
                                    <th className="px-4 py-2.5">Tool ID</th>
                                    <th className="px-4 py-2.5">Description</th>
                                    <th className="px-4 py-2.5">Tool Code</th>
                                    <th className="px-4 py-2.5 text-center">Qty</th>
                                    <th className="px-4 py-2.5 text-center">Status</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-border/40">
                                {(challan.items || []).map((item, idx) => (
                                    <tr key={item.tool || idx} className="hover:bg-muted/20">
                                        <td className="px-4 py-2.5 font-semibold text-muted-foreground">{idx + 1}</td>
                                        <td className="px-4 py-2.5 font-mono text-xs font-bold text-primary">{item.toolId}</td>
                                        <td className="px-4 py-2.5 font-medium text-foreground">{item.description || "-"}</td>
                                        <td className="px-4 py-2.5 font-mono text-xs">{item.toolCode || "-"}</td>
                                        <td className="px-4 py-2.5 text-center font-semibold">{item.quantity || 1} {item.unit || "NOS"}</td>
                                        <td className="px-4 py-2.5 text-center">
                                            {item.returnStatus === "Returned" ? (
                                                <span className="inline-flex items-center gap-1 bg-emerald-500/15 text-emerald-700 dark:text-emerald-400 px-2 py-0.5 rounded-full text-xs font-semibold">
                                                    <CheckCircle2 className="size-3" /> Returned
                                                </span>
                                            ) : item.returnStatus === "Missing" ? (
                                                <span className="inline-flex items-center gap-1 bg-rose-500/15 text-rose-700 dark:text-rose-400 px-2 py-0.5 rounded-full text-xs font-semibold">
                                                    <AlertTriangle className="size-3" /> Missing
                                                </span>
                                            ) : (
                                                <span className="inline-flex items-center gap-1 bg-blue-500/15 text-blue-700 dark:text-blue-400 px-2 py-0.5 rounded-full text-xs font-semibold">
                                                    Sent (In Use)
                                                </span>
                                            )}
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>

                <DialogFooter>
                    <Button onClick={() => onOpenChange(false)} variant="outline" className="w-24">
                        Close
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}

export default ChallanDetailModal;

// ChallanDetailModal component
