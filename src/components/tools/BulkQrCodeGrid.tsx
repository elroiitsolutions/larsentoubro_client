import { useState, useEffect } from "react";
import QRCode from "qrcode";
import { 
    Printer, CheckCircle2, Copy, Check, 
    QrCode, Loader2
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import toolService from "@/services/tool.service";

interface BulkQrCodeGridProps {
    storeId: string;
    jobId: string;
    onStatusChange?: () => void;
}

export function BulkQrCodeGrid({ storeId, jobId, onStatusChange }: BulkQrCodeGridProps) {
    const [tools, setTools] = useState<any[]>([]);
    const [loading, setLoading] = useState<boolean>(true);
    const [qrMap, setQrMap] = useState<Record<string, string>>({});
    const [copiedId, setCopiedId] = useState<string | null>(null);
    const [markingPrinted, setMarkingPrinted] = useState<boolean>(false);

    useEffect(() => {
        let isMounted = true;
        setLoading(true);

        toolService.getImportedJobTools(storeId, jobId)
            .then(async (res) => {
                if (!isMounted) return;
                if (res.success && Array.isArray(res.data)) {
                    setTools(res.data);
                    
                    // Generate client-side canvas QR codes as fallback/enhancement
                    const newQrMap: Record<string, string> = {};
                    for (const tool of res.data) {
                        const link = tool.qrLink || `https://lntqr.com/vt/${tool.toolId}`;
                        if (tool.qrCodeDataUrl) {
                            newQrMap[tool.toolId || tool._id] = tool.qrCodeDataUrl;
                            try {
                                const url = await QRCode.toDataURL(link, { 
                                    margin: 1, 
                                    width: 240, 
                                    errorCorrectionLevel: 'H',
                                    color: { light: '#00000000' }
                                });
                                newQrMap[tool.toolId || tool._id] = url;
                            } catch (e) {
                                console.error("QR Code rendering failed:", e);
                            }
                        }
                    }
                    if (isMounted) setQrMap(newQrMap);
                }
            })
            .catch((err) => {
                console.error("Failed to load imported tools for QR generation:", err);
                toast.error("Failed to load QR code details for imported tools.");
            })
            .finally(() => {
                if (isMounted) setLoading(false);
            });

        return () => { isMounted = false; };
    }, [storeId, jobId]);

    const handleCopy = (id: string, text: string) => {
        navigator.clipboard.writeText(text);
        setCopiedId(id);
        toast.success("Copied to clipboard");
        setTimeout(() => setCopiedId(null), 2000);
    };

    const handleMarkAllPrinted = async () => {
        const toolIds = tools.map(t => t._id || t.toolId).filter(Boolean);
        if (toolIds.length === 0) return;

        setMarkingPrinted(true);
        try {
            const res = await toolService.markToolsAsPrinted(toolIds);
            if (res.success) {
                toast.success(`Marked ${toolIds.length} tools as Printed`);
                setTools(prev => prev.map(t => ({ ...t, isPrinted: true })));
                if (onStatusChange) onStatusChange();
            } else {
                toast.error(res.message || "Failed to mark tools as printed");
            }
        } catch (e: any) {
            toast.error(e?.response?.data?.message || "Failed to mark tools as printed");
        } finally {
            setMarkingPrinted(false);
        }
    };

    const handlePrintSheet = () => {
        const printWindow = window.open('', '_blank', 'width=1000,height=800');
        if (!printWindow) {
            toast.error("Please allow popups to print QR Code stickers");
            return;
        }

        const cardsHtml = tools.map((t) => {
            const qrImg = qrMap[t.toolId || t._id] || t.qrCodeDataUrl || '';
            const desc = t.description || 'Tool';
            const code = t.toolId || t.toolCode || 'ID';
            const validity = t.validityPeriod || 'N/A';
            const date = t.dateOfSupply || '-';
            return `
                <div class="qr-card">
                    <div class="card-header">
                        <div class="lnt-logo">L&T CONSTRUCTION</div>
                        <div class="tool-id">${code}</div>
                    </div>
                    <div class="card-body">
                        <div class="qr-box">
                            <img src="${qrImg}" alt="QR" />
                        </div>
                        <div class="tool-info">
                            <div class="desc">${desc}</div>
                            <div class="meta"><strong>Date:</strong> ${date}</div>
                            <div class="meta"><strong>Validity:</strong> ${validity}</div>
                            <div class="meta"><strong>Serial:</strong> ${t.serialNumber || '-'}</div>
                        </div>
                    </div>
                </div>
            `;
        }).join('');

        printWindow.document.write(`
            <!DOCTYPE html>
            <html>
            <head>
                <title>L&T Tool QR Code Labels</title>
                <style>
                    @page { size: A4; margin: 10mm; }
                    body { font-family: system-ui, -apple-system, sans-serif; margin: 0; padding: 10px; background: #fff; color: #000; }
                    .grid { display: grid; grid-template-columns: repeat(2, 1fr); gap: 12px; }
                    .qr-card { border: 2px solid #000; border-radius: 8px; padding: 10px; page-break-inside: avoid; background: #fff; }
                    .card-header { display: flex; justify-content: space-between; align-items: center; border-bottom: 1.5px solid #000; padding-bottom: 6px; margin-bottom: 8px; }
                    .lnt-logo { font-weight: 800; font-size: 11px; tracking: 0.5px; color: #002b66; text-transform: uppercase; }
                    .tool-id { font-family: monospace; font-weight: 800; font-size: 13px; background: #f0f4f8; padding: 2px 6px; border-radius: 4px; border: 1px solid #cbd5e1; }
                    .card-body { display: flex; gap: 12px; align-items: center; }
                    .qr-box { width: 100px; height: 100px; shrink: 0; }
                    .qr-box img { width: 100%; height: 100%; object-fit: contain; }
                    .tool-info { flex: 1; min-width: 0; }
                    .desc { font-weight: 700; font-size: 13px; margin-bottom: 4px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
                    .meta { font-size: 10px; color: #334155; margin-bottom: 2px; }
                </style>
            </head>
            <body>
                <h2 style="text-align: center; font-size: 16px; margin-bottom: 15px; border-bottom: 2px solid #002b66; padding-bottom: 6px; color: #002b66;">
                    LARSEN & TOUBRO - BULK IMPORT QR LABELS (${tools.length} TOOLS)
                </h2>
                <div class="grid">${cardsHtml}</div>
                <script>
                    window.onload = function() {
                        setTimeout(function() {
                            window.print();
                        }, 500);
                    };
                </script>
            </body>
            </html>
        `);
        printWindow.document.close();
    };

    if (loading) {
        return (
            <div className="flex flex-col items-center justify-center p-12 space-y-3 bg-muted/10 rounded-2xl border border-dashed border-border/60">
                <Loader2 className="size-8 animate-spin text-primary" />
                <p className="text-sm text-muted-foreground font-medium">Generating QR Codes for imported tools...</p>
            </div>
        );
    }

    if (tools.length === 0) {
        return null;
    }

    const allPrinted = tools.every(t => t.isPrinted);

    return (
        <div className="space-y-6 animate-in fade-in duration-300">
            {/* Action Bar Header */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-card border border-border/70 p-5 rounded-2xl shadow-sm">
                <div className="flex items-center gap-3">
                    <div className="size-11 rounded-xl bg-primary/10 text-primary flex items-center justify-center shrink-0 shadow-inner">
                        <QrCode className="size-6" />
                    </div>
                    <div>
                        <div className="flex items-center gap-2">
                            <h3 className="text-lg font-bold tracking-tight">Generated QR Codes</h3>
                            <span className="bg-primary/15 text-primary font-bold text-xs px-2.5 py-0.5 rounded-full font-mono">
                                {tools.length} Tools
                            </span>
                        </div>
                        <p className="text-xs text-muted-foreground mt-0.5">
                            Unique scannable QR labels generated automatically during upload.
                        </p>
                    </div>
                </div>

                <div className="flex flex-wrap items-center gap-2.5">
                    <Button
                        type="button"
                        variant="outline"
                        onClick={handleMarkAllPrinted}
                        disabled={markingPrinted || allPrinted}
                        className={`h-9 text-xs rounded-xl gap-1.5 font-semibold transition-all ${
                            allPrinted 
                                ? "bg-emerald-500/10 text-emerald-600 border-emerald-500/20" 
                                : "hover:bg-emerald-50 dark:hover:bg-emerald-950/30 text-emerald-700 dark:text-emerald-400 border-emerald-300 dark:border-emerald-800"
                        }`}
                    >
                        {markingPrinted ? <Loader2 className="size-3.5 animate-spin" /> : <CheckCircle2 className="size-3.5" />}
                        <span>{allPrinted ? "All Marked as Printed" : "Mark All as Printed"}</span>
                    </Button>

                    <Button
                        type="button"
                        onClick={handlePrintSheet}
                        className="h-9 text-xs rounded-xl bg-primary text-primary-foreground hover:bg-primary/90 gap-1.5 font-semibold shadow-sm cursor-pointer"
                    >
                        <Printer className="size-3.5" />
                        <span>Print QR Labels Sheet</span>
                    </Button>
                </div>
            </div>

            {/* Grid of Generated QR Codes */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {tools.map((tool) => {
                    const toolIdCode = tool.toolId || tool.toolCode || String(tool._id);
                    const qrDataUrl = qrMap[toolIdCode] || tool.qrCodeDataUrl || '';
                    const isPrinted = tool.isPrinted;

                    return (
                        <div 
                            key={tool._id || toolIdCode} 
                            className="bg-card border border-border/70 rounded-2xl p-4 shadow-sm hover:shadow-md transition-all flex flex-col justify-between space-y-4 group relative overflow-hidden"
                        >
                            {/* Status Banner Tag */}
                            <div className="flex items-start justify-between gap-2">
                                <div className="space-y-0.5 min-w-0">
                                    <h4 className="font-bold text-sm text-foreground truncate" title={tool.description}>
                                        {tool.description || 'Tool Item'}
                                    </h4>
                                    <span className="font-mono text-xs font-semibold text-primary bg-primary/10 px-2 py-0.5 rounded-md inline-block">
                                        {toolIdCode}
                                    </span>
                                </div>
                                <span className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full shrink-0 ${
                                    isPrinted 
                                        ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20" 
                                        : "bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20"
                                }`}>
                                    {isPrinted ? "Printed" : "Not Printed"}
                                </span>
                            </div>

                            {/* Center Section: Large Scannable QR Code */}
                            <div className="bg-background border border-border/80 rounded-xl p-3 flex items-center gap-4 shadow-inner">
                                <div className="size-24 bg-transparent p-0 rounded-lg border border-border/60 shrink-0 flex items-center justify-center">
                                    {qrDataUrl ? (
                                        <img src={qrDataUrl} alt={toolIdCode} className="size-full object-contain" />
                                    ) : (
                                        <Loader2 className="size-6 animate-spin text-muted-foreground" />
                                    )}
                                </div>
                                <div className="space-y-1 text-xs min-w-0 flex-1">
                                    <div>
                                        <span className="text-muted-foreground block text-[10px] uppercase font-semibold">Date of Supply</span>
                                        <span className="font-semibold text-foreground truncate block">{tool.dateOfSupply || '-'}</span>
                                    </div>
                                    <div>
                                        <span className="text-muted-foreground block text-[10px] uppercase font-semibold">Validity Period</span>
                                        <span className="font-semibold text-foreground truncate block">{tool.validityPeriod || 'N/A'}</span>
                                    </div>
                                    <div>
                                        <span className="text-muted-foreground block text-[10px] uppercase font-semibold">Serial No.</span>
                                        <span className="font-mono text-foreground font-semibold block">{tool.serialNumber || '-'}</span>
                                    </div>
                                </div>
                            </div>

                            {/* Card Footer Actions */}
                            <div className="flex items-center justify-between pt-1 border-t border-border/50 text-xs">
                                <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => handleCopy(toolIdCode, tool.qrLink || `https://lntqr.com/vt/${toolIdCode}`)}
                                    className="h-7 text-[11px] px-2 text-muted-foreground hover:text-foreground gap-1"
                                >
                                    {copiedId === toolIdCode ? <Check className="size-3 text-emerald-500" /> : <Copy className="size-3" />}
                                    <span>{copiedId === toolIdCode ? "Copied Link" : "Copy Link"}</span>
                                </Button>

                                <span className="text-[10px] font-mono text-muted-foreground truncate max-w-[140px]">
                                    /vt/{toolIdCode}
                                </span>
                            </div>
                        </div>
                    );
                })}
            </div>
        </div>
    );
}
