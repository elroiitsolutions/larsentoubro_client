import { useState, useEffect, useRef, useCallback } from "react";
import QRCode from "qrcode";
import { 
    Printer, CheckCircle2, Copy, Check, 
    QrCode, Loader2, ChevronLeft, ChevronRight,
    Search, Layers, RefreshCw
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { toast } from "sonner";
import toolService from "@/services/tool.service";

interface BulkQrCodeGridProps {
    storeId: string;
    jobId: string;
    onStatusChange?: () => void;
    isLiveProcessing?: boolean;
    liveSuccessCount?: number;
}

export function BulkQrCodeGrid({ 
    storeId, 
    jobId, 
    onStatusChange,
    isLiveProcessing = false,
    liveSuccessCount = 0
}: BulkQrCodeGridProps) {
    const [tools, setTools] = useState<any[]>([]);
    const [loading, setLoading] = useState<boolean>(true);
    const [copiedId, setCopiedId] = useState<string | null>(null);
    const [markingPrinted, setMarkingPrinted] = useState<boolean>(false);

    // Pagination & Filter State
    const [page, setPage] = useState<number>(1);
    const [pageSize, setPageSize] = useState<number>(24);
    const [filter, setFilter] = useState<'all' | 'unprinted' | 'printed'>('all');
    const [search, setSearch] = useState<string>('');
    const [debouncedSearch, setDebouncedSearch] = useState<string>('');

    const [pagination, setPagination] = useState({
        page: 1,
        pageSize: 24,
        total: 0,
        totalPages: 1
    });

    const [stats, setStats] = useState({
        total: 0,
        printedCount: 0,
        unprintedCount: 0
    });

    // In-memory cache for client-generated QR Data URLs (ToolID -> Base64 Data URL)
    const qrCache = useRef<Record<string, string>>({});
    const [qrMap, setQrMap] = useState<Record<string, string>>({});

    // Batch Print Modal State
    const [batchModalOpen, setBatchModalOpen] = useState(false);
    const [batchOffset, setBatchOffset] = useState<number>(1);
    const [batchCount, setBatchCount] = useState<number>(50);
    const [isPrintingBatch, setIsPrintingBatch] = useState<boolean>(false);

    // Debounce search
    useEffect(() => {
        const timer = setTimeout(() => {
            setDebouncedSearch(search);
            setPage(1);
        }, 300);
        return () => clearTimeout(timer);
    }, [search]);

    // Fetch tools from paginated metadata endpoint
    const fetchTools = useCallback(async (currentPage: number, currentSize: number, currentFilter: string, currentSearch: string) => {
        if (!storeId || !jobId) return;
        setLoading(true);

        try {
            const res = await toolService.getImportedJobTools(storeId, jobId, {
                page: currentPage,
                pageSize: currentSize,
                filter: currentFilter as any,
                search: currentSearch
            });

            if (res.success && res.data) {
                const incomingTools = res.data.tools || [];
                setTools(incomingTools);
                setPagination(res.data.pagination || { page: currentPage, pageSize: currentSize, total: incomingTools.length, totalPages: 1 });
                if (res.data.stats) {
                    setStats(res.data.stats);
                }

                // Browser-side on-demand QR code generation for ONLY current page tools
                const toolsNeedingQr = incomingTools.filter(
                    (t: any) => !qrCache.current[t.toolId || t._id]
                );

                if (toolsNeedingQr.length > 0) {
                    Promise.all(toolsNeedingQr.map(async (tool: any) => {
                        const link = tool.qrLink || `https://lntqr.com/vt/${tool.toolId}`;
                        try {
                            const url = await QRCode.toDataURL(link, {
                                margin: 1,
                                width: 220,
                                errorCorrectionLevel: 'M',
                                color: { dark: '#000000', light: '#ffffff' }
                            });
                            qrCache.current[tool.toolId || tool._id] = url;
                        } catch (err) {
                            console.error(`QR Code render failed for ${tool.toolId}:`, err);
                        }
                    })).then(() => {
                        setQrMap({ ...qrCache.current });
                    });
                } else {
                    setQrMap({ ...qrCache.current });
                }
            }
        } catch (err) {
            console.error("Failed to load imported tools:", err);
            toast.error("Failed to load imported tools.");
        } finally {
            setLoading(false);
        }
    }, [storeId, jobId]);

    // Re-fetch on filter, page, size, or debounced search changes
    useEffect(() => {
        fetchTools(page, pageSize, filter, debouncedSearch);
    }, [page, pageSize, filter, debouncedSearch, fetchTools]);

    // Auto-update stats and tools if live processing updates
    useEffect(() => {
        if (isLiveProcessing && liveSuccessCount > 0) {
            // Periodically refresh current page view to show newly arrived tools
            fetchTools(page, pageSize, filter, debouncedSearch);
        }
    }, [liveSuccessCount, isLiveProcessing]);

    const handleCopy = (id: string, text: string) => {
        navigator.clipboard.writeText(text);
        setCopiedId(id);
        toast.success("QR link copied to clipboard");
        setTimeout(() => setCopiedId(null), 2000);
    };

    // Mark specific tools as printed
    const handleMarkToolsPrinted = async (ids: string[]) => {
        if (ids.length === 0) return;
        setMarkingPrinted(true);
        try {
            const res = await toolService.markToolsAsPrinted(ids);
            if (res.success) {
                toast.success(`Marked ${ids.length} tools as Printed`);
                // Update local state
                setTools(prev => prev.map(t => ids.includes(t.toolId || t._id) ? { ...t, isPrinted: true } : t));
                setStats(prev => ({
                    ...prev,
                    printedCount: prev.printedCount + ids.length,
                    unprintedCount: Math.max(0, prev.unprintedCount - ids.length)
                }));
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

    // Mark current page tools as printed
    const handleMarkCurrentPagePrinted = () => {
        const unprintedIds = tools.filter(t => !t.isPrinted).map(t => t.toolId || t._id).filter(Boolean);
        if (unprintedIds.length === 0) {
            toast.info("All tools on this page are already marked as Printed");
            return;
        }
        handleMarkToolsPrinted(unprintedIds);
    };

    // Print helper that opens clean A4 printable sheets
    const renderPrintWindow = (toolsToPrint: any[], batchTitle: string) => {
        const printWindow = window.open('', '_blank', 'width=1000,height=800');
        if (!printWindow) {
            toast.error("Please allow popups to print QR Code stickers");
            return;
        }

        const cardsHtml = toolsToPrint.map((t) => {
            const code = t.toolId || t.toolCode || 'ID';
            const qrImg = qrCache.current[code] || qrCache.current[t._id] || '';
            const desc = t.description || 'Tool Item';
            const validity = t.validityPeriod || 'N/A';
            const date = t.dateOfSupply || '-';
            const serial = t.serialNumber || '-';

            return `
                <div class="qr-card">
                    <div class="card-header">
                        <div class="lnt-logo">L&T CONSTRUCTION</div>
                        <div class="tool-id">${code}</div>
                    </div>
                    <div class="card-body">
                        <div class="qr-box">
                            <img src="${qrImg}" alt="${code}" />
                        </div>
                        <div class="tool-info">
                            <div class="desc">${desc}</div>
                            <div class="meta"><strong>Date:</strong> ${date}</div>
                            <div class="meta"><strong>Validity:</strong> ${validity}</div>
                            <div class="meta"><strong>Serial:</strong> ${serial}</div>
                        </div>
                    </div>
                </div>
            `;
        }).join('');

        printWindow.document.write(`
            <!DOCTYPE html>
            <html>
            <head>
                <title>L&T Tool QR Code Labels - ${batchTitle}</title>
                <style>
                    @page { size: A4; margin: 8mm; }
                    body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif; margin: 0; padding: 10px; background: #fff; color: #000; }
                    .header-banner { text-align: center; font-size: 14px; margin-bottom: 12px; border-bottom: 2px solid #002b66; padding-bottom: 6px; color: #002b66; font-weight: bold; }
                    .grid { display: grid; grid-template-columns: repeat(2, 1fr); gap: 10px; }
                    .qr-card { border: 1.5px solid #0f172a; border-radius: 6px; padding: 8px 10px; page-break-inside: avoid; background: #fff; }
                    .card-header { display: flex; justify-content: space-between; align-items: center; border-bottom: 1px solid #0f172a; padding-bottom: 4px; margin-bottom: 6px; }
                    .lnt-logo { font-weight: 800; font-size: 11px; letter-spacing: 0.5px; color: #002b66; text-transform: uppercase; }
                    .tool-id { font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace; font-weight: 800; font-size: 12px; background: #f1f5f9; padding: 2px 6px; border-radius: 4px; border: 1px solid #cbd5e1; }
                    .card-body { display: flex; gap: 10px; align-items: center; }
                    .qr-box { width: 90px; height: 90px; flex-shrink: 0; }
                    .qr-box img { width: 100%; height: 100%; object-fit: contain; }
                    .tool-info { flex: 1; min-width: 0; }
                    .desc { font-weight: 700; font-size: 12px; margin-bottom: 4px; line-height: 1.2; overflow: hidden; text-overflow: ellipsis; display: -webkit-box; -webkit-line-clamp: 2; -webkit-box-orient: vertical; }
                    .meta { font-size: 10px; color: #334155; margin-bottom: 2px; }
                </style>
            </head>
            <body>
                <div class="header-banner">
                    LARSEN & TOUBRO - BULK IMPORT QR LABELS (${batchTitle} - ${toolsToPrint.length} ITEMS)
                </div>
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

        // Prompt to mark printed
        const printedIds = toolsToPrint.map(t => t.toolId || t._id).filter(Boolean);
        toast.success(`Prepared print sheet for ${toolsToPrint.length} tools`, {
            action: {
                label: "Mark as Printed",
                onClick: () => handleMarkToolsPrinted(printedIds)
            }
        });
    };

    // Print current page
    const handlePrintCurrentPage = () => {
        if (tools.length === 0) {
            toast.error("No tools on the current page to print");
            return;
        }
        renderPrintWindow(tools, `Page ${pagination.page}`);
    };

    // Print custom batch (fetches dedicated slice from API)
    const handlePrintBatch = async (offsetIndex: number, countToFetch: number) => {
        setIsPrintingBatch(true);
        const effectiveOffset = Math.max(0, offsetIndex - 1);
        try {
            const res = await toolService.getImportedJobTools(storeId, jobId, {
                offset: effectiveOffset,
                limit: countToFetch,
                filter
            });

            if (res.success && res.data?.tools?.length > 0) {
                const batchTools = res.data.tools;

                // Generate QR codes for any items not yet in cache
                await Promise.all(batchTools.map(async (tool: any) => {
                    const id = tool.toolId || tool._id;
                    if (!qrCache.current[id]) {
                        const link = tool.qrLink || `https://lntqr.com/vt/${tool.toolId}`;
                        try {
                            const url = await QRCode.toDataURL(link, {
                                margin: 1,
                                width: 220,
                                errorCorrectionLevel: 'M',
                                color: { dark: '#000000', light: '#ffffff' }
                            });
                            qrCache.current[id] = url;
                        } catch (err) {}
                    }
                }));

                setBatchModalOpen(false);
                renderPrintWindow(batchTools, `Items ${offsetIndex} to ${offsetIndex + batchTools.length - 1}`);
            } else {
                toast.error("No tools found for the selected range");
            }
        } catch (e) {
            toast.error("Failed to load batch tools for printing");
        } finally {
            setIsPrintingBatch(false);
        }
    };

    const allPagePrinted = tools.length > 0 && tools.every(t => t.isPrinted);

    return (
        <div className="space-y-6 animate-in fade-in duration-300">
            {/* Header / Summary & Actions Card */}
            <div className="bg-card border border-border/70 p-5 rounded-2xl shadow-sm space-y-4">
                <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                    <div className="flex items-center gap-3">
                        <div className="size-11 rounded-xl bg-primary/10 text-primary flex items-center justify-center shrink-0 shadow-inner">
                            <QrCode className="size-6" />
                        </div>
                        <div>
                            <div className="flex items-center gap-2">
                                <h3 className="text-lg font-bold tracking-tight">Generated QR Code Labels</h3>
                                <span className="bg-primary/15 text-primary font-bold text-xs px-2.5 py-0.5 rounded-full font-mono">
                                    {stats.total.toLocaleString()} Tools
                                </span>
                                {isLiveProcessing && (
                                    <span className="flex items-center gap-1.5 text-xs font-semibold px-2 py-0.5 rounded-full bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20 animate-pulse">
                                        <Loader2 className="size-3 animate-spin" /> Live Import In Progress
                                    </span>
                                )}
                            </div>
                            <p className="text-xs text-muted-foreground mt-0.5">
                                Scannable verification QR codes rendered instantly in your browser with batch label printing.
                            </p>
                        </div>
                    </div>

                    <div className="flex flex-wrap items-center gap-2.5">
                        {/* Refresh Button */}
                        <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            onClick={() => fetchTools(page, pageSize, filter, debouncedSearch)}
                            className="h-9 px-3 text-xs rounded-xl gap-1.5 text-muted-foreground hover:text-foreground"
                            title="Refresh tools"
                        >
                            <RefreshCw className={`size-3.5 ${loading ? 'animate-spin text-primary' : ''}`} />
                            <span className="hidden sm:inline">Refresh</span>
                        </Button>

                        {/* Mark Page as Printed */}
                        <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            onClick={handleMarkCurrentPagePrinted}
                            disabled={markingPrinted || allPagePrinted || tools.length === 0}
                            className={`h-9 text-xs rounded-xl gap-1.5 font-semibold transition-all ${
                                allPagePrinted 
                                    ? "bg-emerald-500/10 text-emerald-600 border-emerald-500/20" 
                                    : "hover:bg-emerald-50 dark:hover:bg-emerald-950/30 text-emerald-700 dark:text-emerald-400 border-emerald-300 dark:border-emerald-800"
                            }`}
                        >
                            {markingPrinted ? <Loader2 className="size-3.5 animate-spin" /> : <CheckCircle2 className="size-3.5" />}
                            <span>{allPagePrinted ? "Page Printed" : "Mark Page as Printed"}</span>
                        </Button>

                        {/* Batch Print Dropdown */}
                        <DropdownMenu>
                            <DropdownMenuTrigger
                                render={
                                    <Button
                                        type="button"
                                        className="h-9 text-xs rounded-xl bg-primary text-primary-foreground hover:bg-primary/90 gap-1.5 font-semibold shadow-sm cursor-pointer"
                                    />
                                }
                            >
                                <Printer className="size-3.5" />
                                <span>Print QR Labels</span>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end" className="w-56 p-1.5 rounded-xl shadow-lg">
                                <DropdownMenuLabel className="text-xs text-muted-foreground font-semibold px-2 py-1.5">
                                    Print Layout Options
                                </DropdownMenuLabel>
                                <DropdownMenuItem 
                                    onClick={handlePrintCurrentPage}
                                    className="text-xs font-medium cursor-pointer rounded-lg px-2 py-2 flex items-center justify-between"
                                >
                                    <span>Print Current Page</span>
                                    <span className="text-[10px] font-mono text-muted-foreground">({tools.length} labels)</span>
                                </DropdownMenuItem>
                                <DropdownMenuSeparator />
                                <DropdownMenuLabel className="text-xs text-muted-foreground font-semibold px-2 py-1.5">
                                    Batch Print (Pre-Packaged)
                                </DropdownMenuLabel>
                                <DropdownMenuItem 
                                    onClick={() => handlePrintBatch(1, 50)}
                                    className="text-xs font-medium cursor-pointer rounded-lg px-2 py-2 flex items-center justify-between"
                                >
                                    <span>First 50 Tools (1 - 50)</span>
                                    <Layers className="size-3.5 text-muted-foreground" />
                                </DropdownMenuItem>
                                <DropdownMenuItem 
                                    onClick={() => handlePrintBatch(1, 100)}
                                    className="text-xs font-medium cursor-pointer rounded-lg px-2 py-2 flex items-center justify-between"
                                >
                                    <span>First 100 Tools (1 - 100)</span>
                                    <Layers className="size-3.5 text-muted-foreground" />
                                </DropdownMenuItem>
                                <DropdownMenuSeparator />
                                <DropdownMenuItem 
                                    onClick={() => setBatchModalOpen(true)}
                                    className="text-xs font-medium cursor-pointer rounded-lg px-2 py-2 text-primary font-semibold"
                                >
                                    <span>Custom Range / Batch...</span>
                                </DropdownMenuItem>
                            </DropdownMenuContent>
                        </DropdownMenu>
                    </div>
                </div>

                {/* Search Bar & Filter Segmented Control */}
                <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 pt-3 border-t border-border/50">
                    <div className="relative flex-1 max-w-md">
                        <Search className="size-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
                        <Input
                            placeholder="Search by Tool ID, Description, or Item Code..."
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            className="h-9 pl-9 text-xs rounded-xl bg-background border-border/70"
                        />
                    </div>

                    <div className="flex items-center gap-1.5 p-1 bg-muted/40 rounded-xl border border-border/60 text-xs">
                        <button
                            type="button"
                            onClick={() => { setFilter('all'); setPage(1); }}
                            className={`px-3 py-1.5 rounded-lg font-semibold transition-all ${
                                filter === 'all' 
                                    ? 'bg-background text-foreground shadow-sm' 
                                    : 'text-muted-foreground hover:text-foreground'
                            }`}
                        >
                            All ({stats.total.toLocaleString()})
                        </button>
                        <button
                            type="button"
                            onClick={() => { setFilter('unprinted'); setPage(1); }}
                            className={`px-3 py-1.5 rounded-lg font-semibold transition-all ${
                                filter === 'unprinted' 
                                    ? 'bg-background text-amber-600 dark:text-amber-400 shadow-sm' 
                                    : 'text-muted-foreground hover:text-foreground'
                            }`}
                        >
                            Unprinted ({stats.unprintedCount.toLocaleString()})
                        </button>
                        <button
                            type="button"
                            onClick={() => { setFilter('printed'); setPage(1); }}
                            className={`px-3 py-1.5 rounded-lg font-semibold transition-all ${
                                filter === 'printed' 
                                    ? 'bg-background text-emerald-600 dark:text-emerald-400 shadow-sm' 
                                    : 'text-muted-foreground hover:text-foreground'
                            }`}
                        >
                            Printed ({stats.printedCount.toLocaleString()})
                        </button>
                    </div>
                </div>
            </div>

            {/* Grid of Generated QR Codes */}
            {loading ? (
                <div className="flex flex-col items-center justify-center p-16 space-y-3 bg-card rounded-2xl border border-border/60">
                    <Loader2 className="size-8 animate-spin text-primary" />
                    <p className="text-sm text-muted-foreground font-medium">Loading QR label metadata...</p>
                </div>
            ) : tools.length === 0 ? (
                <div className="flex flex-col items-center justify-center p-12 text-center bg-card rounded-2xl border border-dashed border-border/60">
                    <QrCode className="size-10 text-muted-foreground/40 mb-3" />
                    <h4 className="text-sm font-semibold text-foreground">No Tools Found</h4>
                    <p className="text-xs text-muted-foreground mt-1 max-w-sm">
                        {debouncedSearch 
                            ? `No tools matched your search query "${debouncedSearch}".` 
                            : isLiveProcessing 
                                ? "Waiting for the first batch of tools to be created..."
                                : "No tools found in this filter category."}
                    </p>
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {tools.map((tool) => {
                        const toolIdCode = tool.toolId || tool.toolCode || String(tool._id);
                        const qrDataUrl = qrMap[toolIdCode] || qrMap[tool._id];
                        const isPrinted = tool.isPrinted;

                        return (
                            <div 
                                key={tool._id || toolIdCode} 
                                className="bg-card border border-border/70 rounded-2xl p-4 shadow-sm hover:shadow-md transition-all flex flex-col justify-between space-y-4 group relative overflow-hidden"
                            >
                                {/* Card Header */}
                                <div className="flex items-start justify-between gap-2">
                                    <div className="space-y-0.5 min-w-0">
                                        <h4 className="font-bold text-sm text-foreground truncate" title={tool.description}>
                                            {tool.description || 'Tool Item'}
                                        </h4>
                                        <span className="font-mono text-xs font-semibold text-primary bg-primary/10 px-2 py-0.5 rounded-md inline-block">
                                            {toolIdCode}
                                        </span>
                                    </div>
                                    <button
                                        type="button"
                                        onClick={() => handleMarkToolsPrinted([toolIdCode])}
                                        title={isPrinted ? "Marked as Printed" : "Click to mark as Printed"}
                                        className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full shrink-0 transition-colors cursor-pointer ${
                                            isPrinted 
                                                ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20 hover:bg-emerald-500/20" 
                                                : "bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20 hover:bg-amber-500/20"
                                        }`}
                                    >
                                        {isPrinted ? "Printed ✓" : "Not Printed"}
                                    </button>
                                </div>

                                {/* Center: Scannable QR Code + Tool Details */}
                                <div className="bg-muted/30 border border-border/60 rounded-xl p-3 flex items-center gap-4">
                                    <div className="size-24 bg-white p-1 rounded-lg border border-border/80 shrink-0 flex items-center justify-center shadow-sm">
                                        {qrDataUrl ? (
                                            <img src={qrDataUrl} alt={toolIdCode} className="size-full object-contain" />
                                        ) : (
                                            <Loader2 className="size-5 animate-spin text-muted-foreground" />
                                        )}
                                    </div>
                                    <div className="space-y-1.5 text-xs min-w-0 flex-1">
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
            )}

            {/* Pagination Controls Bar */}
            <div className="flex flex-wrap items-center justify-between gap-4 px-5 py-3.5 bg-card border border-border/70 rounded-2xl text-xs">
                <div className="flex items-center gap-3 text-muted-foreground">
                    <span>
                        Page <strong className="text-foreground">{pagination.page}</strong> of <strong className="text-foreground">{pagination.totalPages}</strong> ({pagination.total.toLocaleString()} tools)
                    </span>
                    <span className="text-border">|</span>
                    <div className="flex items-center gap-1.5">
                        <span>Per page:</span>
                        <select 
                            value={pageSize} 
                            onChange={(e) => { 
                                setPageSize(Number(e.target.value)); 
                                setPage(1); 
                            }} 
                            className="h-7 px-2 rounded-lg border border-border/60 bg-background text-foreground text-xs focus:outline-none cursor-pointer font-medium"
                        >
                            <option value={12}>12</option>
                            <option value={24}>24</option>
                            <option value={48}>48</option>
                            <option value={96}>96</option>
                        </select>
                    </div>
                </div>

                <div className="flex items-center gap-2">
                    <Button 
                        type="button" 
                        variant="outline" 
                        size="sm" 
                        onClick={() => setPage(p => Math.max(1, p - 1))} 
                        disabled={pagination.page <= 1 || loading} 
                        className="h-8 text-xs px-3 gap-1 cursor-pointer font-medium"
                    >
                        <ChevronLeft className="size-3.5" /> Previous
                    </Button>
                    <span className="font-semibold text-foreground px-2">
                        {pagination.page} / {pagination.totalPages}
                    </span>
                    <Button 
                        type="button" 
                        variant="outline" 
                        size="sm" 
                        onClick={() => setPage(p => Math.min(pagination.totalPages, p + 1))} 
                        disabled={pagination.page >= pagination.totalPages || loading} 
                        className="h-8 text-xs px-3 gap-1 cursor-pointer font-medium"
                    >
                        Next <ChevronRight className="size-3.5" />
                    </Button>
                </div>
            </div>

            {/* Custom Batch Print Dialog */}
            <Dialog open={batchModalOpen} onOpenChange={setBatchModalOpen}>
                <DialogContent className="sm:max-w-[425px]">
                    <DialogHeader>
                        <DialogTitle className="flex items-center gap-2">
                            <Printer className="size-5 text-primary" />
                            Print Custom Batch Labels
                        </DialogTitle>
                        <DialogDescription>
                            Generate and print a specific range of QR sticker labels for A4 sheets. Maximum 100 per print batch.
                        </DialogDescription>
                    </DialogHeader>

                    <div className="grid gap-4 py-4">
                        <div className="space-y-1.5">
                            <label className="text-xs font-semibold text-foreground">Starting Item Number (1-based)</label>
                            <Input
                                type="number"
                                min={1}
                                max={stats.total || 10000}
                                value={batchOffset}
                                onChange={(e) => setBatchOffset(Math.max(1, parseInt(e.target.value) || 1))}
                                className="h-9 text-xs"
                            />
                        </div>

                        <div className="space-y-1.5">
                            <label className="text-xs font-semibold text-foreground">Number of Labels to Print (Max 100)</label>
                            <Input
                                type="number"
                                min={1}
                                max={100}
                                value={batchCount}
                                onChange={(e) => setBatchCount(Math.min(100, Math.max(1, parseInt(e.target.value) || 1)))}
                                className="h-9 text-xs"
                            />
                        </div>

                        <div className="bg-muted/40 p-3 rounded-xl text-xs space-y-1 border border-border/60">
                            <p className="text-muted-foreground">
                                Will print tools from <strong>#{batchOffset}</strong> to <strong>#{batchOffset + batchCount - 1}</strong>.
                            </p>
                            <p className="text-[11px] text-muted-foreground/80">
                                Total tools available in current filter: <strong>{pagination.total.toLocaleString()}</strong>
                            </p>
                        </div>
                    </div>

                    <DialogFooter>
                        <Button 
                            type="button" 
                            variant="outline" 
                            onClick={() => setBatchModalOpen(false)}
                            disabled={isPrintingBatch}
                        >
                            Cancel
                        </Button>
                        <Button
                            type="button"
                            onClick={() => handlePrintBatch(batchOffset, batchCount)}
                            disabled={isPrintingBatch}
                            className="gap-2"
                        >
                            {isPrintingBatch ? <Loader2 className="size-4 animate-spin" /> : <Printer className="size-4" />}
                            Generate & Print
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    );
}
