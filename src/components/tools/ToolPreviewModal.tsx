import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { QrCode, ExternalLink, AlertCircle } from "lucide-react";
import toolService from "@/services/tool.service";

interface ToolPreviewModalProps {
    toolId: string | null;
    isOpen: boolean;
    onClose: () => void;
    initialData?: any;
}

export function ToolPreviewModal({
    toolId,
    isOpen,
    onClose,
    initialData
}: ToolPreviewModalProps) {
    const navigate = useNavigate();

    const [tool, setTool] = useState<any>(initialData || null);
    const [loading, setLoading] = useState<boolean>(!initialData);
    const [error, setError] = useState<boolean>(false);

    useEffect(() => {
        if (!isOpen || !toolId) {
            setTool(null);
            setError(false);
            return;
        }

        // If we already have full matching initial data, use it directly
        if (initialData && (initialData.toolId === toolId || initialData._id === toolId || initialData.toolCode === toolId)) {
            setTool(initialData);
            setLoading(false);
            setError(false);
            return;
        }

        // Otherwise fetch fresh data by toolId
        let isMounted = true;
        setLoading(true);
        setError(false);

        toolService
            .getToolById(toolId)
            .then((res) => {
                if (isMounted) {
                    if (res && res.success && res.data) {
                        setTool(res.data);
                    } else {
                        setError(true);
                    }
                }
            })
            .catch((err: any) => {
                console.error("Failed to fetch tool preview:", err);
                if (isMounted) {
                    setError(true);
                }
            })
            .finally(() => {
                if (isMounted) {
                    setLoading(false);
                }
            });

        return () => {
            isMounted = false;
        };
    }, [toolId, isOpen, initialData]);

    const handleNavigateFullDetails = () => {
        const idToUse = tool?.toolId || tool?.toolCode || tool?._id || toolId;
        onClose();
        if (idToUse) {
            navigate(`/tooldetails/${encodeURIComponent(idToUse)}`);
        }
    };

    // Formatter helpers
    const getFieldValue = (key: string, aliases: string[] = []) => {
        if (!tool) return undefined;
        const keysToTry = [key, ...aliases];
        for (const k of keysToTry) {
            if (tool[k] !== undefined && tool[k] !== null && tool[k] !== '') {
                return tool[k];
            }
        }
        if (tool.customFields) {
            const cf = tool.customFields;
            for (const k of keysToTry) {
                if (cf[k] !== undefined && cf[k] !== null && cf[k] !== '') return cf[k];
            }
        }
        return undefined;
    };

    const toolName = tool?.description || tool?.name || "Tool Information";
    const toolCode = tool?.toolCode || getFieldValue('toolCode', ['tool_code', 'tag', 'Tag']) || tool?.toolId || toolId || "AR0226UWER";
    
    // Sub-header details line (e.g. 2025 • 2 Tonnes • SWL 3 Tonnes)
    const makeYear = getFieldValue('makeYear', ['make_year', 'Year', 'year']) || (tool?.createdAt ? new Date(tool.createdAt).getFullYear() : '2025');
    const capacity = getFieldValue('capacity') || '2 Tonnes';
    const safeWorkingLoad = getFieldValue('safeWorkingLoad') || 'SWL 3 Tonnes';
    const subSpecsLine = `${makeYear} • ${capacity} • ${safeWorkingLoad.includes('SWL') ? safeWorkingLoad : `SWL ${safeWorkingLoad}`}`;

    // Supplier & Procurement
    const supplierName = tool?.vendor?.supplierName || getFieldValue('purchaserName') || getFieldValue('supplierName') || 'UJ Enterprises';
    const supplierCode = tool?.vendor?.supplierCode || getFieldValue('supplierCode') || 'wer';
    const purchaserContact = tool?.vendor?.contactNumber || getFieldValue('purchaserContact') || '9445438046';

    const dateOfReceipt = tool?.dateOfSupply || getFieldValue('dateOfSupply') || '2/28/2026';
    const validityPeriod = tool?.validityPeriod || getFieldValue('validityPeriod') || '3 Years';
    
    const lastInspection = getFieldValue('lastInspection') || '-';
    const status = tool?.status || 'Usable';
    const validUntil = getFieldValue('validUntil') || '2/28/2029';

    const jobCode = tool?.jobCode || getFieldValue('jobCode') || 'job - 001';
    const jobDescription = tool?.jobDescription || getFieldValue('jobDescription') || 'test';

    const previousSite = tool?.siteHistory?.[0]?.siteName || getFieldValue('previousSite') || '-';
    const currentSite = tool?.currentSite?.name || getFieldValue('currentSite') || '-';
    const nextSite = tool?.siteHistory?.[1]?.siteName || getFieldValue('nextSite') || '-';

    return (
        <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
            <DialogContent className="max-w-[440px] p-0 border-none bg-transparent shadow-2xl overflow-hidden rounded-2xl">
                <div className="bg-background border border-border/80 rounded-2xl shadow-xl overflow-hidden flex flex-col transition-all">
                    
                    {/* Modal Content Header & Body */}
                    {loading ? (
                        <div className="p-6 space-y-4">
                            <div className="flex justify-between items-start">
                                <div className="space-y-2">
                                    <Skeleton className="h-6 w-48 rounded-md" />
                                    <Skeleton className="h-4 w-28 rounded-md" />
                                    <Skeleton className="h-3 w-40 rounded-md" />
                                </div>
                                <Skeleton className="h-16 w-16 rounded-xl" />
                            </div>
                            <div className="grid grid-cols-2 gap-4 pt-4 border-t">
                                <Skeleton className="h-12 w-full rounded-lg" />
                                <Skeleton className="h-12 w-full rounded-lg" />
                                <Skeleton className="h-12 w-full rounded-lg" />
                                <Skeleton className="h-12 w-full rounded-lg" />
                            </div>
                            <Skeleton className="h-16 w-full rounded-xl" />
                        </div>
                    ) : error ? (
                        <div className="p-8 flex flex-col items-center justify-center text-center space-y-3">
                            <AlertCircle className="size-10 text-destructive/80" />
                            <h3 className="text-base font-bold text-foreground">Tool Details Unavailable</h3>
                            <p className="text-xs text-muted-foreground">
                                Could not load tool summary for ID <span className="font-mono font-semibold">{toolId}</span>.
                            </p>
                            <Button size="sm" variant="outline" onClick={onClose} className="mt-2 rounded-xl text-xs">
                                Close Window
                            </Button>
                        </div>
                    ) : (
                        <div className="p-6 space-y-5 bg-card">
                            
                            {/* Header Section: Tool Title, Tag Code & QR Code */}
                            <div className="flex items-start justify-between gap-3">
                                <div className="space-y-1 pr-2">
                                    <div className="flex items-center gap-2 flex-wrap">
                                        <h2 className="text-xl font-bold tracking-tight text-primary leading-tight">
                                            {toolName}
                                        </h2>
                                        <span className="inline-flex items-center rounded-lg bg-blue-50 dark:bg-blue-950/60 px-2.5 py-0.5 text-xs font-mono font-semibold text-blue-700 dark:text-blue-300 border border-blue-200 dark:border-blue-800">
                                            {toolCode}
                                        </span>
                                    </div>
                                    <p className="text-xs font-medium text-muted-foreground/90">
                                        {subSpecsLine}
                                    </p>
                                </div>

                                {/* QR Code Graphic Box */}
                                <div className="shrink-0 size-16 rounded-xl border border-border/80 bg-background p-1.5 shadow-sm flex items-center justify-center flex-col text-center">
                                    {tool?.qrLink ? (
                                        <QrCode className="size-full text-foreground/90" />
                                    ) : (
                                        <div className="size-full bg-slate-100 dark:bg-slate-800 rounded-lg flex items-center justify-center">
                                            <QrCode className="size-10 text-slate-700 dark:text-slate-200" />
                                        </div>
                                    )}
                                </div>
                            </div>

                            <hr className="border-border/60" />

                            {/* 2-Column Key Metadata Details */}
                            <div className="grid grid-cols-2 gap-y-4 gap-x-6 text-xs">
                                
                                {/* Supplier */}
                                <div className="space-y-0.5">
                                    <span className="text-[11px] text-muted-foreground block">Supplier</span>
                                    <span className="font-bold text-foreground block">{supplierName}</span>
                                    <span className="text-[10px] text-muted-foreground/80 block font-mono">
                                        Code: {supplierCode}
                                    </span>
                                    <span className="text-[10px] text-muted-foreground/80 block font-mono">
                                        Contact: {purchaserContact}
                                    </span>
                                </div>

                                {/* Date of Receipt */}
                                <div className="space-y-0.5">
                                    <span className="text-[11px] text-muted-foreground block">Date of Receipt</span>
                                    <span className="font-bold text-foreground block">{dateOfReceipt}</span>
                                    <span className="text-[10px] text-muted-foreground/80 block">
                                        Validity: {validityPeriod}
                                    </span>
                                </div>

                                {/* Last Inspection & Status */}
                                <div className="space-y-1">
                                    <span className="text-[11px] text-muted-foreground block">Last Inspection</span>
                                    <span className="font-semibold text-foreground block mb-1">{lastInspection}</span>
                                    <span className="inline-flex items-center rounded-md bg-emerald-500/15 px-2 py-0.5 text-xs font-semibold text-emerald-700 dark:text-emerald-400 border border-emerald-500/30">
                                        {status}
                                    </span>
                                </div>

                                {/* Valid Until */}
                                <div className="space-y-0.5">
                                    <span className="text-[11px] text-muted-foreground block">Valid Until</span>
                                    <span className="font-bold text-foreground block">{validUntil}</span>
                                </div>

                                {/* Job Code */}
                                <div className="space-y-0.5">
                                    <span className="text-[11px] text-muted-foreground block">Job Code</span>
                                    <span className="font-bold text-foreground block font-mono">{jobCode}</span>
                                </div>

                                {/* Job Description */}
                                <div className="space-y-0.5">
                                    <span className="text-[11px] text-muted-foreground block">Job Description</span>
                                    <span className="font-semibold text-foreground block">{jobDescription}</span>
                                </div>
                            </div>

                            {/* Site Movement History Container */}
                            <div className="space-y-2 pt-1">
                                <span className="text-xs font-semibold text-muted-foreground block">
                                    Site Movement History
                                </span>
                                <div className="grid grid-cols-3 gap-2">
                                    
                                    {/* Previous */}
                                    <div className="bg-muted/40 border border-border/60 rounded-xl p-2 text-center">
                                        <span className="text-[10px] font-bold text-muted-foreground tracking-wider uppercase block">
                                            PREVIOUS
                                        </span>
                                        <span className="text-xs font-semibold text-foreground mt-0.5 block truncate">
                                            {previousSite}
                                        </span>
                                    </div>

                                    {/* Current */}
                                    <div className="bg-blue-50 dark:bg-blue-950/40 border border-blue-200 dark:border-blue-800 rounded-xl p-2 text-center">
                                        <span className="text-[10px] font-bold text-blue-600 dark:text-blue-400 tracking-wider uppercase block">
                                            CURRENT
                                        </span>
                                        <span className="text-xs font-bold text-blue-900 dark:text-blue-200 mt-0.5 block truncate">
                                            {currentSite}
                                        </span>
                                    </div>

                                    {/* Next */}
                                    <div className="bg-muted/40 border border-border/60 rounded-xl p-2 text-center">
                                        <span className="text-[10px] font-bold text-muted-foreground tracking-wider uppercase block">
                                            NEXT
                                        </span>
                                        <span className="text-xs font-semibold text-foreground mt-0.5 block truncate">
                                            {nextSite}
                                        </span>
                                    </div>

                                </div>
                            </div>

                        </div>
                    )}

                    {/* Modal Action Buttons Footer */}
                    <div className="p-4 bg-muted/20 border-t border-border/60 flex items-center justify-end gap-3">
                        <Button
                            type="button"
                            variant="outline"
                            onClick={onClose}
                            className="rounded-xl h-9 px-4 text-xs font-semibold"
                        >
                            Close
                        </Button>
                        <Button
                            type="button"
                            onClick={handleNavigateFullDetails}
                            disabled={loading || error}
                            className="rounded-xl h-9 px-4 text-xs font-semibold bg-primary text-primary-foreground hover:bg-primary/90 shadow-md gap-1.5"
                        >
                            <span>Full Details</span>
                            <ExternalLink className="size-3.5" />
                        </Button>
                    </div>

                </div>
            </DialogContent>
        </Dialog>
    );
}
