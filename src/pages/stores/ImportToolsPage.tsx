import { useState, useRef, useEffect, useCallback } from "react";
import { useParams, useNavigate, useLocation } from "react-router-dom";
import toolService from "@/services/tool.service";
import { toast } from "sonner";
import { 
    FileUp, FileDown, Loader2, UploadCloud, AlertCircle, 
    CheckCircle2, ArrowRight, RefreshCw, ChevronLeft, ChevronRight
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";

type ImportStep = 'upload' | 'review' | 'processing' | 'result';

export function ImportToolsPage() {
    const { storeId } = useParams();
    const navigate = useNavigate();
    const location = useLocation();
    const currentBreadcrumbs = (location.state as any)?.breadcrumbs || [];
    const parentBreadcrumbs = currentBreadcrumbs.slice(0, -1);
    const fileInputRef = useRef<HTMLInputElement>(null);

    const [step, setStep] = useState<ImportStep>('upload');
    const [file, setFile] = useState<File | null>(null);
    const [loading, setLoading] = useState(false);
    const [isDragging, setIsDragging] = useState(false);
    const [downloadingSample, setDownloadingSample] = useState(false);

    // Job-based state
    const [jobId, setJobId] = useState<string | null>(null);
    const [previewMeta, setPreviewMeta] = useState<any>(null);
    const [columns, setColumns] = useState<any[]>([]);
    const [currentRecords, setCurrentRecords] = useState<any[]>([]);
    const [reviewPage, setReviewPage] = useState(1);
    const [pageSize, setPageSize] = useState(25);
    const [totalPages, setTotalPages] = useState(1);
    const [loadingPage, setLoadingPage] = useState(false);

    // Progress state
    const [progress, setProgress] = useState({ percentage: 0, processedCount: 0, successCount: 0, failedCount: 0, totalToProcess: 0, failedRows: [] as any[] });
    const [result, setResult] = useState<any>(null);

    // Fetch page from server
    const fetchPage = useCallback(async (page: number, size: number, jId?: string) => {
        const id = jId || jobId;
        if (!id || !storeId) return;
        setLoadingPage(true);
        try {
            const res = await toolService.getImportJobRecords(storeId, id, page, size);
            if (res.success) {
                setCurrentRecords(res.data.records);
                setTotalPages(res.data.pagination.totalPages);
                setReviewPage(page);
            }
        } catch (e: any) {
            toast.error("Failed to load page");
        } finally {
            setLoadingPage(false);
        }
    }, [jobId, storeId]);

    useEffect(() => {
        if (step === 'review' && jobId) fetchPage(reviewPage, pageSize);
    }, [reviewPage, pageSize]);

    const handleDownloadSample = async () => {
        setDownloadingSample(true);
        try {
            const blob = await toolService.downloadSampleBulkImport(storeId || '');
            const url = window.URL.createObjectURL(blob);
            const a = document.createElement("a");
            a.href = url; a.download = "tools_import_sample.xlsx";
            document.body.appendChild(a); a.click();
            window.URL.revokeObjectURL(url); document.body.removeChild(a);
            toast.success("Sample template downloaded");
        } catch { toast.error("Failed to download sample"); }
        finally { setDownloadingSample(false); }
    };

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files?.[0]) setFile(e.target.files[0]);
    };
    const handleDragOver = (e: React.DragEvent) => { e.preventDefault(); setIsDragging(true); };
    const handleDragLeave = (e: React.DragEvent) => { e.preventDefault(); setIsDragging(false); };
    const handleDrop = (e: React.DragEvent) => {
        e.preventDefault(); setIsDragging(false);
        const f = e.dataTransfer.files?.[0];
        if (f && (f.name.match(/\.(xlsx|xls|csv)$/i) || ["application/vnd.openxmlformats-officedocument.spreadsheetml.sheet","application/vnd.ms-excel","text/csv"].includes(f.type))) {
            setFile(f);
        } else { toast.error("Please upload a valid Excel or CSV file."); }
    };

    const handlePreview = async () => {
        if (!file) { toast.error("Please select a file before validating."); return; }
        setLoading(true);
        const formData = new FormData();
        formData.append("file", file);
        try {
            const data = await toolService.previewBulkImport(storeId || '', formData);
            if (data.success) {
                setJobId(data.data.jobId);
                setPreviewMeta({ totalRows: data.data.totalRows, validCount: data.data.validCount, invalidCount: data.data.invalidCount });
                setColumns(data.data.columns || []);
                setCurrentRecords(data.data.records);
                setTotalPages(data.data.pagination.totalPages);
                setReviewPage(1);
                setStep('review');
            } else { toast.error(data.message || "Failed to parse file"); }
        } catch (e: any) { toast.error(e?.response?.data?.message || "Validation error"); }
        finally { setLoading(false); }
    };

    const handleCommit = async () => {
        if (!jobId || !storeId) return;
        setLoading(true);
        try {
            const data = await toolService.commitBulkImport(storeId, jobId);
            if (data.success) {
                setProgress({ percentage: 0, processedCount: 0, successCount: 0, failedCount: 0, totalToProcess: data.data.totalToProcess, failedRows: [] });
                setStep('processing');
                // Connect SSE
                const baseUrl = import.meta.env.VITE_API_BASE_URL || '';
                const token = localStorage.getItem('token') || '';
                const es = new EventSource(`${baseUrl}/api/stores/${storeId}/tools/bulk-import/jobs/${jobId}/progress?token=${token}`);
                es.onmessage = (event) => {
                    try {
                        const msg = JSON.parse(event.data);
                        if (msg.progress) setProgress(p => ({ ...p, ...msg.progress }));
                        if (msg.status === 'completed') {
                            es.close();
                            setResult({ successCount: msg.progress?.successCount || 0, failedCount: msg.progress?.failedCount || 0, failedRows: msg.progress?.failedRows || [] });
                            setStep('result');
                            toast.success(`Imported ${msg.progress?.successCount || 0} tools`);
                        }
                        if (msg.status === 'failed') {
                            es.close();
                            toast.error("Import failed: " + (msg.error || "Unknown error"));
                            setResult({ successCount: msg.progress?.successCount || 0, failedCount: msg.progress?.failedCount || 0, failedRows: msg.progress?.failedRows || [] });
                            setStep('result');
                        }
                    } catch {}
                };
                es.onerror = () => { es.close(); };
            } else { toast.error(data.message || "Failed to start import"); }
        } catch (e: any) { toast.error(e?.response?.data?.message || "Commit error"); }
        finally { setLoading(false); }
    };

    const reset = () => {
        setFile(null); setPreviewMeta(null); setJobId(null); setColumns([]);
        setCurrentRecords([]); setResult(null); setProgress({ percentage: 0, processedCount: 0, successCount: 0, failedCount: 0, totalToProcess: 0, failedRows: [] });
        setStep('upload');
        if (fileInputRef.current) fileInputRef.current.value = '';
    };

    return (
        <div className="flex flex-col gap-6 max-w-[1600px] mx-auto w-full animate-in fade-in duration-500 pb-12">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight bg-gradient-to-r from-foreground to-foreground/70 bg-clip-text text-transparent">Import Tools</h1>
                    <p className="text-muted-foreground mt-1 text-sm">Upload bulk inventory data using an Excel template.</p>
                </div>
                <Button variant="outline" onClick={handleDownloadSample} disabled={downloadingSample} className="gap-2 shadow-sm shrink-0 border-primary/20 hover:bg-primary/5 hover:text-primary transition-colors">
                    {downloadingSample ? <Loader2 className="size-4 animate-spin text-primary" /> : <FileDown className="size-4 text-primary" />}
                    Download Sample (.xlsx)
                </Button>
            </div>

            <Card className="border-border/50 shadow-lg shadow-black/5 rounded-2xl bg-gradient-to-b from-background to-background/50 backdrop-blur-xl flex flex-col min-h-[550px]">
                {step === 'upload' && (
                    <div className="flex flex-col h-full">
                        <CardHeader className="border-b bg-muted/20"><CardTitle>Upload Data</CardTitle><CardDescription>Upload your .xlsx or .csv file to begin the import process.</CardDescription></CardHeader>
                        <CardContent className="flex-1 p-8 flex flex-col justify-center max-w-3xl mx-auto w-full">
                            <div className={`border-2 border-dashed rounded-xl p-12 flex flex-col items-center justify-center text-center transition-all duration-300 ${isDragging ? 'border-primary bg-primary/5 scale-[1.02]' : 'border-border/60 hover:border-primary/50 hover:bg-muted/30'}`} onDragOver={handleDragOver} onDragLeave={handleDragLeave} onDrop={handleDrop}>
                                <div className="size-16 rounded-full bg-primary/10 flex items-center justify-center mb-6 shadow-sm"><UploadCloud className="size-8 text-primary" /></div>
                                <h3 className="text-xl font-semibold mb-2">Drag & Drop your file here</h3>
                                <p className="text-muted-foreground mb-8 text-balance max-w-sm">Supports Excel (.xlsx) and CSV files. Make sure your columns match the required template.</p>
                                <input type="file" ref={fileInputRef} id="file-upload" className="hidden" accept=".xlsx, .xls, .csv" onChange={handleFileChange} />
                                <div className="flex flex-wrap items-center justify-center gap-4">
                                    <Button type="button" variant="secondary" className="shadow-sm hover:shadow transition-shadow cursor-pointer" onClick={() => fileInputRef.current?.click()}>Select File Manually</Button>
                                </div>
                                {file && (
                                    <div className="mt-8 flex items-center gap-3 bg-background border px-4 py-3 rounded-lg shadow-sm animate-in zoom-in-95 duration-300">
                                        <FileUp className="size-5 text-primary" />
                                        <div className="text-sm text-left"><p className="font-semibold">{file.name}</p><p className="text-xs text-muted-foreground">{(file.size / 1024).toFixed(1)} KB</p></div>
                                    </div>
                                )}
                            </div>
                        </CardContent>
                        <div className="p-6 border-t bg-muted/20 flex justify-end gap-3 mt-auto shrink-0">
                            <Button type="button" variant="outline" onClick={() => navigate(`/stores/${storeId}/tools`, { state: { breadcrumbs: parentBreadcrumbs } })}>Cancel</Button>
                            <Button onClick={handlePreview} disabled={!file || loading} className="px-6 shadow-sm group">
                                {loading ? <Loader2 className="size-4 animate-spin mr-2" /> : null}
                                Validate Data {!loading && <ArrowRight className="size-4 ml-2 group-hover:translate-x-1 transition-transform" />}
                            </Button>
                        </div>
                    </div>
                )}

                {step === 'review' && previewMeta && (
                    <div className="flex flex-col h-full overflow-hidden">
                        <CardHeader className="border-b bg-muted/20 shrink-0">
                            <CardTitle>Review & Validate</CardTitle>
                            <CardDescription>Please review the parsed data before importing. Only valid records will be imported.</CardDescription>
                            <div className="flex gap-4 mt-6">
                                <div className="bg-background border rounded-lg px-5 py-3 flex-1 flex flex-col shadow-sm"><span className="text-muted-foreground text-xs font-semibold uppercase tracking-wider mb-1">Total Rows</span><span className="text-2xl font-bold">{previewMeta.totalRows}</span></div>
                                <div className="bg-emerald-500/10 border border-emerald-500/20 text-emerald-700 dark:text-emerald-400 rounded-lg px-5 py-3 flex-1 flex flex-col shadow-sm"><span className="text-emerald-600/70 dark:text-emerald-500/70 text-xs font-semibold uppercase tracking-wider mb-1">Ready to Import</span><span className="text-2xl font-bold">{previewMeta.validCount}</span></div>
                                <div className="bg-rose-500/10 border border-rose-500/20 text-rose-700 dark:text-rose-400 rounded-lg px-5 py-3 flex-1 flex flex-col shadow-sm"><span className="text-rose-600/70 dark:text-rose-500/70 text-xs font-semibold uppercase tracking-wider mb-1">Contain Errors</span><span className="text-2xl font-bold">{previewMeta.invalidCount}</span></div>
                            </div>
                        </CardHeader>
                        <div className="flex-1 overflow-auto bg-background/50 relative">
                            {loadingPage && <div className="absolute inset-0 bg-background/60 z-20 flex items-center justify-center"><Loader2 className="size-6 animate-spin text-primary" /></div>}
                            <table className="w-full text-sm text-left">
                                <thead className="sticky top-0 bg-muted/90 backdrop-blur z-10 text-xs uppercase tracking-wider text-muted-foreground font-semibold shadow-sm">
                                    <tr>
                                        <th className="px-6 py-4 whitespace-nowrap">Row</th>
                                        {columns.map((col: any) => <th key={col.name} className="px-6 py-4 whitespace-nowrap">{col.header}</th>)}
                                        <th className="px-6 py-4 whitespace-nowrap">Status / Errors</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-border/40">
                                    {currentRecords.map((r: any, idx: number) => (
                                        <tr key={idx} className={`transition-colors hover:bg-muted/30 ${r.isValid ? "" : "bg-rose-500/5 hover:bg-rose-500/10"}`}>
                                            <td className="px-6 py-4 text-muted-foreground font-mono text-xs">{r.rowNumber}</td>
                                            {columns.map((col: any) => {
                                                const val = r[col.name] !== undefined ? r[col.name] : r.customFields?.[col.name];
                                                if (col.name === 'description') return <td key={col.name} className="px-6 py-4 font-medium text-foreground min-w-[200px]">{val || <span className="text-muted-foreground italic">Missing</span>}</td>;
                                                if (col.name === 'toolCode') return <td key={col.name} className="px-6 py-4 font-mono text-xs text-primary font-semibold whitespace-nowrap">{val || '-'}</td>;
                                                return <td key={col.name} className="px-6 py-4 text-muted-foreground whitespace-nowrap">{val || '-'}</td>;
                                            })}
                                            <td className="px-6 py-4 min-w-[250px]">
                                                {r.isValid ? <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald-500/10 text-emerald-600 text-xs font-semibold ring-1 ring-emerald-500/20"><CheckCircle2 className="size-3.5" /> Valid</span> : (
                                                    <div className="flex flex-col gap-2">{r.errors.map((err: string, i: number) => <span key={i} className="inline-flex items-start gap-1.5 text-xs font-medium text-rose-600 dark:text-rose-400 bg-rose-500/10 px-2 py-1 rounded border border-rose-500/20 text-balance leading-tight"><AlertCircle className="size-3.5 shrink-0 mt-0.5" /> {err}</span>)}</div>
                                                )}
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                        <div className="flex flex-wrap items-center justify-between gap-4 px-6 py-3.5 bg-muted/30 border-t border-border/50 text-xs">
                            <div className="flex items-center gap-3 text-muted-foreground">
                                <span>Page <strong className="text-foreground">{reviewPage}</strong> of <strong className="text-foreground">{totalPages}</strong> ({previewMeta.totalRows} rows)</span>
                                <span className="text-border">|</span>
                                <div className="flex items-center gap-1.5"><span>Per page:</span>
                                    <select value={pageSize} onChange={(e) => { setPageSize(Number(e.target.value)); setReviewPage(1); fetchPage(1, Number(e.target.value)); }} className="h-7 px-2 rounded-lg border border-border/60 bg-background text-foreground text-xs focus:outline-none cursor-pointer font-medium">
                                        <option value={15}>15</option><option value={25}>25</option><option value={50}>50</option><option value={100}>100</option>
                                    </select>
                                </div>
                            </div>
                            <div className="flex items-center gap-2">
                                <Button type="button" variant="outline" size="sm" onClick={() => fetchPage(reviewPage - 1, pageSize)} disabled={reviewPage === 1 || loadingPage} className="h-8 text-xs px-3 gap-1 cursor-pointer font-medium"><ChevronLeft className="size-3.5" /> Previous</Button>
                                <span className="font-semibold text-foreground px-2">Page {reviewPage} of {totalPages}</span>
                                <Button type="button" variant="outline" size="sm" onClick={() => fetchPage(reviewPage + 1, pageSize)} disabled={reviewPage >= totalPages || loadingPage} className="h-8 text-xs px-3 gap-1 cursor-pointer font-medium">Next <ChevronRight className="size-3.5" /></Button>
                            </div>
                        </div>
                        <div className="p-6 border-t bg-muted/20 backdrop-blur-sm flex justify-between shrink-0 mt-auto">
                            <Button type="button" variant="outline" onClick={reset} className="shadow-sm"><RefreshCw className="size-4 mr-2" />Re-upload File</Button>
                            <Button onClick={handleCommit} disabled={loading || previewMeta.validCount === 0} className="bg-emerald-600 hover:bg-emerald-700 text-white shadow-sm px-6">
                                {loading && <Loader2 className="size-4 animate-spin mr-2" />}
                                Import {previewMeta.validCount} Valid Records
                            </Button>
                        </div>
                    </div>
                )}

                {step === 'processing' && (
                    <div className="flex flex-col h-full items-center justify-center p-12 gap-8">
                        <div className="size-20 rounded-full bg-primary/10 flex items-center justify-center ring-8 ring-primary/5 animate-pulse"><Loader2 className="size-10 text-primary animate-spin" /></div>
                        <div className="text-center"><h2 className="text-2xl font-bold mb-2">Importing Records...</h2><p className="text-muted-foreground">Processing {progress.totalToProcess.toLocaleString()} records in batches. Do not close this page.</p></div>
                        <div className="w-full max-w-md">
                            <div className="flex justify-between text-sm mb-2"><span className="font-medium">{progress.percentage}%</span><span className="text-muted-foreground">{progress.processedCount.toLocaleString()} / {progress.totalToProcess.toLocaleString()}</span></div>
                            <div className="h-4 bg-muted rounded-full overflow-hidden shadow-inner"><div className="h-full bg-gradient-to-r from-emerald-500 to-emerald-400 rounded-full transition-all duration-500 ease-out" style={{ width: `${progress.percentage}%` }} /></div>
                            <div className="flex gap-6 mt-4 text-sm justify-center">
                                <span className="text-emerald-600 font-medium">✓ {progress.successCount.toLocaleString()} imported</span>
                                {progress.failedCount > 0 && <span className="text-rose-600 font-medium">✕ {progress.failedCount.toLocaleString()} failed</span>}
                            </div>
                        </div>
                    </div>
                )}

                {step === 'result' && result && (
                    <div className="flex flex-col h-full overflow-hidden">
                        <CardHeader className="border-b bg-muted/20 shrink-0 text-center py-10">
                            <div className="size-20 rounded-full bg-emerald-500/10 flex items-center justify-center mx-auto mb-6 ring-8 ring-emerald-500/5"><CheckCircle2 className="size-10 text-emerald-500" /></div>
                            <CardTitle className="text-2xl mb-2">Import Completed Successfully</CardTitle>
                            <CardDescription className="text-base">Your inventory has been updated.</CardDescription>
                        </CardHeader>
                        <div className="flex-1 overflow-auto p-8 max-w-4xl mx-auto w-full">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
                                <div className="bg-emerald-50 dark:bg-emerald-950/20 p-6 rounded-xl border border-emerald-200 dark:border-emerald-900 flex items-center gap-5 shadow-sm">
                                    <div className="p-3 bg-emerald-100 dark:bg-emerald-900/50 rounded-lg"><CheckCircle2 className="size-8 text-emerald-600 dark:text-emerald-500" /></div>
                                    <div><p className="text-sm font-semibold text-emerald-800 dark:text-emerald-300 uppercase tracking-wider mb-1">Imported</p><p className="text-4xl font-bold text-emerald-900 dark:text-emerald-400">{result.successCount}</p></div>
                                </div>
                                <div className="bg-rose-50 dark:bg-rose-950/20 p-6 rounded-xl border border-rose-200 dark:border-rose-900 flex items-center gap-5 shadow-sm">
                                    <div className="p-3 bg-rose-100 dark:bg-rose-900/50 rounded-lg"><AlertCircle className="size-8 text-rose-600 dark:text-rose-500" /></div>
                                    <div><p className="text-sm font-semibold text-rose-800 dark:text-rose-300 uppercase tracking-wider mb-1">Failed</p><p className="text-4xl font-bold text-rose-900 dark:text-rose-400">{result.failedCount}</p></div>
                                </div>
                            </div>
                            {result.failedCount > 0 && (
                                <div className="border border-rose-200 dark:border-rose-900/50 rounded-xl overflow-hidden shadow-sm">
                                    <div className="bg-rose-50 dark:bg-rose-950/30 px-6 py-4 font-semibold text-rose-800 dark:text-rose-400 border-b border-rose-200 dark:border-rose-900 flex items-center gap-2"><AlertCircle className="size-4" />Error Report ({result.failedCount} records)</div>
                                    <div className="max-h-[300px] overflow-y-auto p-2">
                                        {result.failedRows?.map((err: any, i: number) => (
                                            <div key={i} className="flex gap-4 text-sm text-rose-700 dark:text-rose-300 hover:bg-rose-50/50 dark:hover:bg-rose-950/30 p-3 rounded-lg transition-colors">
                                                <span className="font-bold shrink-0 bg-rose-100 dark:bg-rose-900/50 px-2 py-0.5 rounded text-xs mt-0.5 h-fit">Row {err.row}</span>
                                                <span className="leading-relaxed">{err.reason}</span>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}
                        </div>
                        <div className="p-6 border-t bg-muted/20 flex justify-end gap-3 shrink-0 mt-auto">
                            <Button type="button" variant="outline" onClick={reset}>Upload Another File</Button>
                            <Button onClick={() => navigate(`/stores/${storeId}/tools`, { state: { breadcrumbs: parentBreadcrumbs } })} className="px-8">Return to Inventory</Button>
                        </div>
                    </div>
                )}
            </Card>
        </div>
    );
}
