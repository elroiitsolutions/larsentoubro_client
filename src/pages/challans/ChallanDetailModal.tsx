import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import {
    Building2,
    Calendar,
    Download,
    Package,
    CheckCircle2,
    AlertTriangle,
    ArrowRightLeft,
    RotateCcw,
    Loader2,
    X
} from "lucide-react";
import type { ChallanRecord } from "@/services/challan.service";
import {
    getChallanStatusBadgeClass,
    getChallanTypeBadgeClass
} from "@/utils/challan/challanCalculations";
import { generateDeliveryChallanPDF, generateReturnChallanPDF, generateTransferChallanPDF } from "@/utils/pdf/challanPdfGenerator";
import challanService from "@/services/challan.service";
import { ReturnToolSelectModal } from "./ReturnToolSelectModal";
import { toast } from "sonner";
import logoUrl from "@/assets/logo.png";

interface ChallanDetailModalProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    challan: ChallanRecord | null;
}

export function ChallanDetailModal({ open, onOpenChange, challan: initialChallan }: ChallanDetailModalProps) {
    const navigate = useNavigate();
    const [isReturnSelectModalOpen, setIsReturnSelectModalOpen] = useState(false);
    const [challan, setChallan] = useState<ChallanRecord | null>(initialChallan);
    const [loadingDetails, setLoadingDetails] = useState(false);

    // Keep state in sync and fetch authoritative fresh details on open
    useEffect(() => {
        setChallan(initialChallan);
        if (open && initialChallan?._id) {
            setLoadingDetails(true);
            challanService.getChallanById(initialChallan._id)
                .then(res => {
                    if (res?.data) {
                        setChallan(res.data);
                    }
                })
                .catch(err => {
                    console.error("Error refreshing challan details:", err);
                })
                .finally(() => setLoadingDetails(false));
        }
    }, [initialChallan?._id, open]);

    if (!challan) return null;

    const isScrap = challan.isScrapDC || challan.challanType === "Scrap" || (challan.challanNumber && challan.challanNumber.startsWith("SDC-"));

    const handleDownloadPdf = async () => {
        try {
            if (challan.challanType === "Transfer" || challan.isStoreTransfer) {
                await generateTransferChallanPDF(challan, { download: true });
            } else if (challan.challanType === "Delivery" || isScrap) {
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
    const isTransfer = challan.challanType === "Transfer" || challan.isStoreTransfer;

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="w-full max-w-2xl lg:max-w-3xl max-h-[90vh] flex flex-col p-0 gap-0 overflow-hidden bg-card border-border shadow-2xl rounded-xl" hideClose={true}>
                <DialogHeader className="px-5 py-3 border-b bg-muted/20 shrink-0">
                    <div className="flex items-center justify-between gap-3">
                        <div className="flex items-center gap-2.5 min-w-0">
                            <div className="size-9 rounded-lg bg-background border border-border/80 flex items-center justify-center p-1 shadow-xs shrink-0">
                                <img src={logoUrl} alt="L&T Logo" className="size-full object-contain" />
                            </div>
                            <div className="min-w-0 flex-1">
                                <div className="flex flex-wrap items-center gap-1.5">
                                    <DialogTitle className="text-base sm:text-lg font-bold font-mono tracking-tight text-foreground whitespace-nowrap">
                                        {challan.challanNumber}
                                    </DialogTitle>
                                    <span className={`${getChallanTypeBadgeClass(isScrap ? "Scrap" : challan.challanType)} text-[10px] shrink-0`}>
                                        {isScrap ? "Scrap" : isTransfer ? "Store Transfer" : challan.challanType} Challan
                                    </span>
                                    {(() => {
                                        const displayStatus = challan.status === "Returned" ? "Completed" : challan.status;
                                        return (
                                            <span className={`${getChallanStatusBadgeClass(displayStatus)} text-[10px] shrink-0`}>
                                                {displayStatus}
                                            </span>
                                        );
                                    })()}
                                </div>
                                <DialogDescription className="text-[11px] text-muted-foreground mt-0.5 truncate">
                                    Created on {new Date(challan.challanDate).toLocaleDateString()} by {challan.createdBy?.name || "L&T Admin"}
                                </DialogDescription>
                            </div>
                        </div>

                        <div className="flex items-center gap-2 shrink-0">
                            <Button
                                size="sm"
                                variant="outline"
                                onClick={handleDownloadPdf}
                                className="h-7.5 sm:h-8 px-2.5 text-xs font-semibold flex items-center gap-1.5 shadow-xs rounded-lg hover:bg-muted"
                            >
                                <Download className="size-3.5 text-primary" />
                                <span>Download PDF</span>
                            </Button>
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

                <div className="p-4 sm:p-5 space-y-3.5 overflow-y-auto flex-1">
                    {/* Metadata Grid */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2.5 bg-muted/20 p-3 rounded-lg border border-border/60">
                        {isTransfer ? (
                            <>
                                <div>
                                    <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider flex items-center gap-1">
                                        <Building2 className="size-3 text-primary shrink-0" /> Source Store
                                    </p>
                                    <p className="font-bold text-xs sm:text-sm text-foreground mt-0.5 truncate">{challan.sourceStore?.name || "Source Store"}</p>
                                    <p className="font-mono text-[11px] text-muted-foreground">{challan.sourceStore?.location ? `Loc: ${challan.sourceStore.location}` : challan.sourceStore?.storeCode || "-"}</p>
                                </div>

                                <div>
                                    <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider flex items-center gap-1">
                                        <Building2 className="size-3 text-emerald-600 shrink-0" /> Destination Store
                                    </p>
                                    <p className="font-bold text-xs sm:text-sm text-foreground mt-0.5 truncate">{challan.destinationStore?.name || "Destination Store"}</p>
                                    <p className="font-mono text-[11px] text-muted-foreground">{challan.destinationStore?.location ? `Loc: ${challan.destinationStore.location}` : challan.destinationStore?.storeCode || "-"}</p>
                                </div>

                                <div>
                                    <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider flex items-center gap-1">
                                        <Calendar className="size-3 text-primary shrink-0" /> Project Details
                                    </p>
                                    <p className="font-bold text-xs sm:text-sm text-foreground mt-0.5 truncate">{challan.project?.name || "Project Store Transfer"}</p>
                                    <p className="text-[11px] text-muted-foreground mt-0.5">Date: {new Date(challan.challanDate).toLocaleDateString()}</p>
                                </div>
                            </>
                        ) : (
                            <>
                                <div>
                                    <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider flex items-center gap-1">
                                        <Building2 className="size-3 text-primary shrink-0" /> Consignee Vendor
                                    </p>
                                    <p className="font-bold text-xs sm:text-sm text-foreground mt-0.5 truncate">{challan.vendor?.name || "-"}</p>
                                    <p className="font-mono text-[11px] text-muted-foreground">{challan.vendor?.vendorCode || "-"}</p>
                                </div>

                                <div>
                                    <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider flex items-center gap-1">
                                        <Calendar className="size-3 text-primary shrink-0" /> Dates & Reference
                                    </p>
                                    <p className="text-[11px] text-foreground mt-0.5">
                                        <strong>Challan Date:</strong> {new Date(challan.challanDate).toLocaleDateString()}
                                    </p>
                                    {isReturn && challan.referenceDcNumber && (
                                        <p className="text-[11px] text-foreground mt-0.5 truncate">
                                            <strong>Reference DC:</strong> <span className="font-mono text-primary font-bold">{challan.referenceDcNumber}</span>
                                        </p>
                                    )}
                                    {!isReturn && challan.transferFromDcNumber && (
                                        <p className="text-[11px] text-foreground mt-0.5 truncate">
                                            <strong>Transfer from DC:</strong> <span className="font-mono text-blue-600 dark:text-blue-400 font-bold">{challan.transferFromDcNumber}</span>
                                        </p>
                                    )}
                                    {challan.transferredToDcNumber && (
                                        <p className="text-[11px] text-foreground mt-0.5 truncate">
                                            <strong>Transferred to DC:</strong> <span className="font-mono text-amber-600 dark:text-amber-400 font-bold">{challan.transferredToDcNumber}</span>
                                        </p>
                                    )}
                                </div>

                                <div className="sm:col-span-2 md:col-span-1">
                                    <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider flex items-center gap-1">
                                        <Package className="size-3 text-primary shrink-0" /> Inventory Summary
                                    </p>
                                    <p className="text-[11px] text-foreground mt-0.5">
                                        <strong>Total Items:</strong> {challan.toolCount || (challan.items || []).length}
                                    </p>
                                    {isReturn ? (
                                        <div className="flex items-center gap-2.5 mt-0.5 text-[11px] font-semibold">
                                            <span className="text-emerald-600">Returned: {challan.returnedCount || 0}</span>
                                            <span className="text-rose-600">Missing: {challan.missingCount || 0}</span>
                                        </div>
                                    ) : challan.challanType === 'Delivery' ? (
                                        <div className="flex flex-wrap items-center gap-2 mt-0.5 text-[11px] font-semibold">
                                            <span className="text-emerald-600">Returned: {challan.returnedCount || 0}</span>
                                            <span className="text-amber-600">
                                                Pending: {Math.max(0, (challan.toolCount || (challan.items || []).length) - ((challan.returnedCount || 0) + (challan.missingCount || 0)))}
                                            </span>
                                            {(challan.missingCount || 0) > 0 && (
                                                <span className="text-rose-600">Missing: {challan.missingCount || 0}</span>
                                            )}
                                        </div>
                                    ) : null}
                                </div>
                            </>
                        )}
                    </div>

                    {/* Remarks & Notes */}
                    {(challan.remarks || challan.notes) && (
                        <div className="text-[11px] space-y-1 bg-muted/20 p-2.5 rounded-lg border">
                            {challan.remarks && (
                                <p><strong>Remarks:</strong> <span className="text-muted-foreground">{challan.remarks}</span></p>
                            )}
                            {challan.notes && (
                                <p><strong>Internal Notes:</strong> <span className="text-muted-foreground">{challan.notes}</span></p>
                            )}
                        </div>
                    )}

                    {/* Items Table */}
                    <div className="border border-border/70 rounded-lg overflow-hidden bg-card shadow-xs">
                        <div className="bg-muted/40 px-3 py-2 border-b font-semibold text-[11px] uppercase text-muted-foreground flex items-center justify-between">
                            <span className="flex items-center gap-1.5">
                                <Package className="size-3 text-primary" />
                                Challan Tool Items ({challan.items?.length || challan.toolCount || 0})
                            </span>
                            {loadingDetails && (
                                <span className="flex items-center gap-1.5 text-[10px] font-normal text-muted-foreground normal-case">
                                    <Loader2 className="size-3 animate-spin text-primary" /> Syncing tools...
                                </span>
                            )}
                        </div>
                        <div className="max-h-[350px] overflow-y-auto overflow-x-auto overscroll-contain">
                            <table className="min-w-full text-xs text-left whitespace-nowrap">
                                <thead className="bg-muted/30 sticky top-0 border-b text-[11px] text-muted-foreground font-semibold backdrop-blur-xs z-10">
                                    <tr>
                                        <th className="px-3 py-1.5">#</th>
                                        <th className="px-3 py-1.5">Tool ID</th>
                                        <th className="px-3 py-1.5">Description</th>
                                        <th className="px-3 py-1.5">Tool Code</th>
                                        <th className="px-3 py-1.5 text-center">Qty</th>
                                        <th className="px-3 py-1.5 text-center">Status</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-border/40">
                                    {(challan.items || []).length === 0 ? (
                                        <tr>
                                            <td colSpan={6} className="px-3 py-6 text-center text-muted-foreground text-[11px]">
                                                No tool items recorded in this challan.
                                            </td>
                                        </tr>
                                    ) : (
                                        <>
                                            {(challan.items || []).map((item: any, idx: number) => {
                                                const uniqueKey = `${item.toolId || (typeof item.tool === 'string' ? item.tool : item.tool?._id) || 'tool'}-${idx}`;
                                                return (
                                                    <tr key={uniqueKey} className="hover:bg-muted/20 transition-colors">
                                                        <td className="px-3 py-2 font-semibold text-muted-foreground text-[11px]">{idx + 1}</td>
                                                        <td className="px-3 py-2 font-mono text-[11px] font-bold text-primary">{item.toolId || "-"}</td>
                                                        <td className="px-3 py-2 font-medium text-foreground text-xs">{item.description || "-"}</td>
                                                        <td className="px-3 py-2 font-mono text-[11px] text-muted-foreground">{item.toolCode || item.materialCode || "-"}</td>
                                                        <td className="px-3 py-2 text-center font-semibold text-xs">{item.quantity || 1} {item.unit || "NOS"}</td>
                                                        <td className="px-3 py-2 text-center">
                                                            {item.returnStatus === "Returned" ? (
                                                                <span className="inline-flex items-center gap-1 bg-emerald-500/15 text-emerald-700 dark:text-emerald-400 px-2 py-0.5 rounded-full text-[10px] font-semibold">
                                                                    <CheckCircle2 className="size-2.5" /> Returned {item.returnChallanNumber ? `(${item.returnChallanNumber})` : ""}
                                                                </span>
                                                            ) : item.returnStatus === "Missing" ? (
                                                                <span className="inline-flex items-center gap-1 bg-rose-500/15 text-rose-700 dark:text-rose-400 px-2 py-0.5 rounded-full text-[10px] font-semibold">
                                                                    <AlertTriangle className="size-2.5" /> Missing {item.returnChallanNumber ? `(${item.returnChallanNumber})` : ""}
                                                                </span>
                                                            ) : (
                                                                <span className="inline-flex items-center gap-1 bg-blue-500/15 text-blue-700 dark:text-blue-400 px-2 py-0.5 rounded-full text-[10px] font-semibold">
                                                                    Sent (In Use)
                                                                </span>
                                                            )}
                                                        </td>
                                                    </tr>
                                                );
                                            })}
                                            <tr className="bg-muted/10 border-t border-border/40 select-none">
                                                <td colSpan={6} className="px-3 py-1.5 text-center text-[11px] text-muted-foreground font-medium">
                                                    Showing all {challan.items?.length || 0} items
                                                </td>
                                            </tr>
                                        </>
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>

                <div className="px-5 py-3 border-t bg-muted/30 shrink-0 flex items-center justify-between gap-2">
                    <Button onClick={() => onOpenChange(false)} variant="outline" className="h-8 px-3 rounded-lg text-xs">
                        Close
                    </Button>
                    {challan.challanType === "Delivery" && (challan.status === "Active" || challan.status === "Pending") && (
                        <div className="flex flex-wrap items-center gap-2">
                            <Button
                                size="sm"
                                className="h-8 px-3 rounded-lg text-xs font-semibold bg-amber-500 hover:bg-amber-600 text-white shadow-xs flex items-center gap-1.5"
                                onClick={() => {
                                    setIsReturnSelectModalOpen(true);
                                }}
                            >
                                <RotateCcw className="size-3" />
                                <span>{challan.status === "Pending" ? "Return Remaining Tools" : "Create Return Challan"}</span>
                            </Button>

                            <Button
                                size="sm"
                                className="h-8 px-3 rounded-lg text-xs font-semibold bg-blue-600 hover:bg-blue-700 text-white shadow-xs flex items-center gap-1.5"
                                onClick={() => {
                                    onOpenChange(false);
                                    navigate("/challans/delivery/preview", {
                                        state: {
                                            isTransfer: true,
                                            transferFromDcId: challan._id,
                                            transferFromDcNumber: challan.challanNumber,
                                            selectedTools: (challan.items || [])
                                                .filter((t: any) => t.returnStatus !== "Returned" && t.returnStatus !== "Missing")
                                                .map((t: any, idx: number) => ({
                                                    _id: t.tool?._id || t.tool,
                                                    toolId: t.toolId || `TOOL-${idx}`,
                                                    toolCode: t.toolCode || "",
                                                    materialCode: t.toolCode || t.materialCode || `MAT-${1000 + idx}`,
                                                    description: t.description || "Tool Item",
                                                    quantity: Number(t.quantity || 1),
                                                    unit: t.unit || "NOS",
                                                    rate: Number(t.rate || 0),
                                                    remarks: t.remarks || "",
                                                    status: "Moving"
                                                })),
                                            vendor: challan.vendor,
                                            storeId: challan.store?._id || challan.store,
                                            siteCode: "",
                                            previousSiteCode: challan.siteCode || "",
                                            subcontractorName: challan.subcontractorName || challan.vendor?.name,
                                            locationChainage: challan.locationChainage || "",
                                            workFrontLocation: challan.workFrontLocation || "",
                                            trnCode: challan.trnCode || "M 25",
                                            sendingCentreCode: challan.sendingCentreCode || "-",
                                            mrNo: challan.mrNo || "-",
                                            mrDate: challan.mrDate || "-",
                                            stockType: challan.stockType || "-",
                                            ewayBillNo: challan.ewayBillNo || "-",
                                            gatePassNo: challan.gatePassNo || "-",
                                            gatePassApprovedBy: challan.gatePassApprovedBy || "-",
                                            consignorTaxNo: challan.consignorTaxNo || challan.vendor?.gstNumber || "-",
                                            vehicleNo: challan.vehicleNo || "-",
                                            lrNo: challan.lrNo || "-",
                                            freightStatus: challan.freightStatus || "-",
                                            remarks: `Site Transfer from ${challan.challanNumber}`
                                        }
                                    });
                                }}
                            >
                                <ArrowRightLeft className="size-3" />
                                <span>Transfer to Another Site</span>
                            </Button>
                        </div>
                    )}
                </div>
            </DialogContent>

            {challan && isReturnSelectModalOpen && (
                <ReturnToolSelectModal
                    open={isReturnSelectModalOpen}
                    onOpenChange={setIsReturnSelectModalOpen}
                    challan={challan}
                    onProceed={(dc, selectedToolIds) => {
                        setIsReturnSelectModalOpen(false);
                        onOpenChange(false);
                        navigate(`/challans/return/preview/${dc._id}`, {
                            state: {
                                referenceDc: dc,
                                selectedToolIds
                            }
                        });
                    }}
                />
            )}
        </Dialog>
    );
}

export default ChallanDetailModal;

// ChallanDetailModal component
