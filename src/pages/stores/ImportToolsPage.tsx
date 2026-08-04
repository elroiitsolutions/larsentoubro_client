import { useState, useRef } from "react";
import { useParams, useNavigate, useLocation } from "react-router-dom";
import toolService from "@/services/tool.service";
import type { BulkImportCommitData } from "@/services/tool.service";
import { toast } from "sonner";
import { 
    FileUp, 
    FileDown,
    Loader2, 
    UploadCloud, 
    AlertCircle, 
    CheckCircle2, 
    ArrowRight, 
    RefreshCw
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";

type ImportStep = 'upload' | 'review' | 'result';

export function ImportToolsPage() {
    const { storeId } = useParams();
    const navigate = useNavigate();
    const location = useLocation();
    
    // Breadcrumbs logic
    const currentBreadcrumbs = (location.state as any)?.breadcrumbs || [];
    const parentBreadcrumbs = currentBreadcrumbs.slice(0, -1);
    const fileInputRef = useRef<HTMLInputElement>(null);

    const [step, setStep] = useState<ImportStep>('upload');
    const [file, setFile] = useState<File | null>(null);
    const [loading, setLoading] = useState(false);
    const [isDragging, setIsDragging] = useState(false);
    const [downloadingSample, setDownloadingSample] = useState(false);
    
    // Preview State
    const [previewData, setPreviewData] = useState<any>(null);

    // Result State
    const [result, setResult] = useState<BulkImportCommitData | null>(null);

    const handleDownloadSample = async () => {
        setDownloadingSample(true);
        try {
            const blob = await toolService.downloadSampleBulkImport(storeId || '');
            const url = window.URL.createObjectURL(blob);
            const a = document.createElement("a");
            a.href = url;
            a.download = "tools_import_sample.xlsx";
            document.body.appendChild(a);
            a.click();
            window.URL.revokeObjectURL(url);
            document.body.removeChild(a);
            toast.success("Sample import template downloaded successfully");
        } catch (error: any) {
            console.error(error);
            const message = error?.response?.data?.message || "Failed to download sample file";
            toast.error(message);
        } finally {
            setDownloadingSample(false);
        }
    };

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files.length > 0) {
            setFile(e.target.files[0]);
        }
    };

    const handleDragOver = (e: React.DragEvent) => {
        e.preventDefault();
        setIsDragging(true);
    };

    const handleDragLeave = (e: React.DragEvent) => {
        e.preventDefault();
        setIsDragging(false);
    };

    const handleDrop = (e: React.DragEvent) => {
        e.preventDefault();
        setIsDragging(false);
        if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
            const droppedFile = e.dataTransfer.files[0];
            const validTypes = [
                "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet", 
                "application/vnd.ms-excel", 
                "text/csv"
            ];
            if (validTypes.includes(droppedFile.type) || droppedFile.name.match(/\.(xlsx|xls|csv)$/i)) {
                setFile(droppedFile);
            } else {
                toast.error("Please upload a valid Excel or CSV file.");
            }
        }
    };

    const handlePreview = async () => {
        if (!file) {
            toast.error("Please select a file to upload");
            return;
        }

        setLoading(true);
        const formData = new FormData();
        formData.append("file", file);

        try {
            const data = await toolService.previewBulkImport(storeId || '', formData);

            if (data.success) {
                setPreviewData(data.data);
                setStep('review');
            } else {
                toast.error(data.message || "Failed to parse file");
            }
        } catch (error: any) {
            console.error(error);
            const message = error?.response?.data?.message || "An error occurred during parsing";
            toast.error(message);
        } finally {
            setLoading(false);
        }
    };

    const handleCommit = async () => {
        if (!previewData?.records) return;

        setLoading(true);
        // Only send valid records
        const validRecords = previewData.records.filter((r: any) => r.isValid);

        try {
            const data = await toolService.commitBulkImport(storeId || '', validRecords);

            if (data.success) {
                const resultData: BulkImportCommitData = data.data || { successCount: 0, failedCount: 0, failedRows: [] };
                toast.success(`Successfully imported ${resultData.successCount} tools`);
                setResult(resultData);
                setStep('result');
            } else {
                toast.error(data.message || "Failed to commit tools");
            }
        } catch (error: any) {
            console.error(error);
            const message = error?.response?.data?.message || "An error occurred during upload";
            toast.error(message);
        } finally {
            setLoading(false);
        }
    };

    const reset = () => {
        setFile(null);
        setPreviewData(null);
        setResult(null);
        setStep('upload');
        if (fileInputRef.current) {
            fileInputRef.current.value = '';
        }
    };

    return (
        <div className="flex flex-col gap-8 max-w-[1600px] mx-auto w-full animate-in fade-in duration-500 h-[calc(100vh-4rem)]">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight bg-gradient-to-r from-foreground to-foreground/70 bg-clip-text text-transparent">
                        Import Tools
                    </h1>
                    <p className="text-muted-foreground mt-1 text-sm">
                        Upload bulk inventory data using an Excel template.
                    </p>
                </div>
                <Button 
                    variant="outline"
                    onClick={handleDownloadSample}
                    disabled={downloadingSample}
                    className="gap-2 shadow-sm shrink-0 border-primary/20 hover:bg-primary/5 hover:text-primary transition-colors"
                >
                    {downloadingSample ? (
                        <Loader2 className="size-4 animate-spin text-primary" />
                    ) : (
                        <FileDown className="size-4 text-primary" />
                    )}
                    Download Sample (.xlsx)
                </Button>
            </div>

            <Card className="border-border/50 shadow-lg shadow-black/5 rounded-2xl bg-gradient-to-b from-background to-background/50 backdrop-blur-xl flex flex-col overflow-hidden h-[800px] max-h-[80vh]">
                
                {step === 'upload' && (
                    <div className="flex flex-col h-full">
                        <CardHeader className="border-b bg-muted/20 flex flex-row items-center justify-between">
                            <div>
                                <CardTitle>Upload Data</CardTitle>
                                <CardDescription>Upload your .xlsx or .csv file to begin the import process.</CardDescription>
                            </div>
                            <Button 
                                variant="outline" 
                                size="sm" 
                                onClick={handleDownloadSample}
                                disabled={downloadingSample}
                                className="gap-2 shrink-0 shadow-sm hover:bg-primary/5 hover:text-primary hover:border-primary/30 transition-colors"
                            >
                                {downloadingSample ? (
                                    <Loader2 className="size-3.5 animate-spin" />
                                ) : (
                                    <FileDown className="size-3.5 text-primary" />
                                )}
                                Download Sample (.xlsx)
                            </Button>
                        </CardHeader>
                        <CardContent className="flex-1 p-8 flex flex-col justify-center max-w-3xl mx-auto w-full">
                            <div 
                                className={`border-2 border-dashed rounded-xl p-16 flex flex-col items-center justify-center text-center transition-all duration-300 ${
                                    isDragging ? 'border-primary bg-primary/5 scale-[1.02]' : 'border-border/60 hover:border-primary/50 hover:bg-muted/30'
                                }`}
                                onDragOver={handleDragOver}
                                onDragLeave={handleDragLeave}
                                onDrop={handleDrop}
                            >
                                <div className="size-16 rounded-full bg-primary/10 flex items-center justify-center mb-6 shadow-sm">
                                    <UploadCloud className="size-8 text-primary" />
                                </div>
                                <h3 className="text-xl font-semibold mb-2">Drag & Drop your file here</h3>
                                <p className="text-muted-foreground mb-8 text-balance max-w-sm">
                                    Supports Excel (.xlsx) and CSV files. Make sure your columns match the required template.
                                </p>
                                
                                <input
                                    type="file"
                                    ref={fileInputRef}
                                    id="file-upload"
                                    className="hidden"
                                    accept=".xlsx, .xls, .csv"
                                    onChange={handleFileChange}
                                />
                                <div className="flex flex-wrap items-center justify-center gap-4">
                                    <Button
                                        type="button"
                                        variant="secondary"
                                        className="shadow-sm hover:shadow transition-shadow cursor-pointer"
                                        onClick={() => fileInputRef.current?.click()}
                                    >
                                        Select File Manually
                                    </Button>
                                    <Button
                                        type="button"
                                        variant="outline"
                                        className="shadow-sm hover:shadow transition-shadow cursor-pointer gap-2"
                                        onClick={handleDownloadSample}
                                        disabled={downloadingSample}
                                    >
                                        {downloadingSample ? (
                                            <Loader2 className="size-4 animate-spin" />
                                        ) : (
                                            <FileDown className="size-4 text-primary" />
                                        )}
                                        Download Sample (.xlsx)
                                    </Button>
                                </div>
                                
                                {file && (
                                    <div className="mt-8 flex items-center gap-3 bg-background border px-4 py-3 rounded-lg shadow-sm animate-in zoom-in-95 duration-300">
                                        <FileUp className="size-5 text-primary" />
                                        <div className="text-sm text-left">
                                            <p className="font-semibold">{file.name}</p>
                                            <p className="text-xs text-muted-foreground">{(file.size / 1024).toFixed(1)} KB</p>
                                        </div>
                                    </div>
                                )}
                            </div>
                        </CardContent>
                        <div className="p-6 border-t bg-muted/20 flex justify-end gap-3 mt-auto shrink-0">
                            <Button type="button" variant="outline" onClick={() => navigate(`/stores/${storeId}/tools`, { state: { breadcrumbs: parentBreadcrumbs } })}>
                                Cancel
                            </Button>
                            <Button onClick={handlePreview} disabled={!file || loading} className="px-6 shadow-sm group">
                                {loading ? <Loader2 className="size-4 animate-spin mr-2" /> : null}
                                Validate Data 
                                {!loading && <ArrowRight className="size-4 ml-2 group-hover:translate-x-1 transition-transform" />}
                            </Button>
                        </div>
                    </div>
                )}

                {step === 'review' && previewData && (
                    <div className="flex flex-col h-full overflow-hidden">
                        <CardHeader className="border-b bg-muted/20 shrink-0">
                            <CardTitle>Review & Validate</CardTitle>
                            <CardDescription>Please review the parsed data before importing. Only valid records will be imported.</CardDescription>
                            
                            <div className="flex gap-4 mt-6">
                                <div className="bg-background border rounded-lg px-5 py-3 flex-1 flex flex-col shadow-sm">
                                    <span className="text-muted-foreground text-xs font-semibold uppercase tracking-wider mb-1">Total Rows</span>
                                    <span className="text-2xl font-bold">{previewData.totalRows}</span>
                                </div>
                                <div className="bg-emerald-500/10 border border-emerald-500/20 text-emerald-700 dark:text-emerald-400 rounded-lg px-5 py-3 flex-1 flex flex-col shadow-sm">
                                    <span className="text-emerald-600/70 dark:text-emerald-500/70 text-xs font-semibold uppercase tracking-wider mb-1">Ready to Import</span>
                                    <span className="text-2xl font-bold">{previewData.validCount}</span>
                                </div>
                                <div className="bg-rose-500/10 border border-rose-500/20 text-rose-700 dark:text-rose-400 rounded-lg px-5 py-3 flex-1 flex flex-col shadow-sm">
                                    <span className="text-rose-600/70 dark:text-rose-500/70 text-xs font-semibold uppercase tracking-wider mb-1">Contain Errors</span>
                                    <span className="text-2xl font-bold">{previewData.invalidCount}</span>
                                </div>
                            </div>
                        </CardHeader>
                        
                        <div className="flex-1 overflow-auto bg-background/50">
                            <table className="w-full text-sm text-left">
                                <thead className="sticky top-0 bg-muted/90 backdrop-blur z-10 text-xs uppercase tracking-wider text-muted-foreground font-semibold shadow-sm">
                                    <tr>
                                        <th className="px-6 py-4 whitespace-nowrap">Row</th>
                                        <th className="px-6 py-4 min-w-[200px]">Description</th>
                                        <th className="px-6 py-4 whitespace-nowrap">Tool Code</th>
                                        <th className="px-6 py-4 whitespace-nowrap">Make/Year</th>
                                        <th className="px-6 py-4 whitespace-nowrap">Capacity</th>
                                        <th className="px-6 py-4 whitespace-nowrap">SWL</th>
                                        <th className="px-6 py-4 whitespace-nowrap">Tool Type</th>
                                        <th className="px-6 py-4 whitespace-nowrap">Metal Type</th>
                                        <th className="px-6 py-4 whitespace-nowrap">Variant</th>
                                        <th className="px-6 py-4 whitespace-nowrap">Purchaser</th>
                                        <th className="px-6 py-4 whitespace-nowrap">Date of Supply</th>
                                        <th className="px-6 py-4 whitespace-nowrap">Status / Errors</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-border/40">
                                    {previewData.records.map((r: any, idx: number) => (
                                        <tr key={idx} className={`transition-colors hover:bg-muted/30 ${r.isValid ? "" : "bg-rose-500/5 hover:bg-rose-500/10"}`}>
                                            <td className="px-6 py-4 text-muted-foreground font-mono text-xs">{r.rowNumber}</td>
                                            <td className="px-6 py-4 font-medium text-foreground">{r.description || <span className="text-muted-foreground italic">Missing</span>}</td>
                                            <td className="px-6 py-4 font-mono text-xs text-primary font-semibold whitespace-nowrap">{r.toolCode || '-'}</td>
                                            <td className="px-6 py-4 text-muted-foreground whitespace-nowrap">{r.makeYear || '-'}</td>
                                            <td className="px-6 py-4 text-muted-foreground whitespace-nowrap">{r.capacity || '-'}</td>
                                            <td className="px-6 py-4 text-muted-foreground whitespace-nowrap">{r.safeWorkingLoad || '-'}</td>
                                            <td className="px-6 py-4 text-muted-foreground whitespace-nowrap">{r.toolType || '-'}</td>
                                            <td className="px-6 py-4 text-muted-foreground whitespace-nowrap">{r.metalType || '-'}</td>
                                            <td className="px-6 py-4 text-muted-foreground whitespace-nowrap">{r.toolVariant || '-'}</td>
                                            <td className="px-6 py-4 text-muted-foreground whitespace-nowrap">{r.purchaserName || '-'}</td>
                                            <td className="px-6 py-4 text-muted-foreground whitespace-nowrap">{r.dateOfSupply || '-'}</td>
                                            <td className="px-6 py-4 min-w-[250px]">
                                                {r.isValid ? (
                                                    <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald-500/10 text-emerald-600 text-xs font-semibold ring-1 ring-emerald-500/20">
                                                        <CheckCircle2 className="size-3.5" /> Valid
                                                    </span>
                                                ) : (
                                                    <div className="flex flex-col gap-2">
                                                        {r.errors.map((err: string, i: number) => (
                                                            <span key={i} className="inline-flex items-start gap-1.5 text-xs font-medium text-rose-600 dark:text-rose-400 bg-rose-500/10 px-2 py-1 rounded border border-rose-500/20 text-balance leading-tight">
                                                                <AlertCircle className="size-3.5 shrink-0 mt-0.5" /> {err}
                                                            </span>
                                                        ))}
                                                    </div>
                                                )}
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>

                        <div className="p-6 border-t bg-muted/20 backdrop-blur-sm flex justify-between shrink-0 mt-auto">
                            <Button type="button" variant="outline" onClick={() => setStep('upload')} className="shadow-sm">
                                <RefreshCw className="size-4 mr-2" />
                                Re-upload File
                            </Button>
                            <Button 
                                onClick={handleCommit} 
                                disabled={loading || previewData.validCount === 0}
                                className="bg-emerald-600 hover:bg-emerald-700 text-white shadow-sm px-6"
                            >
                                {loading && <Loader2 className="size-4 animate-spin mr-2" />}
                                Import {previewData.validCount} Valid Records
                            </Button>
                        </div>
                    </div>
                )}

                {step === 'result' && result && (
                    <div className="flex flex-col h-full overflow-hidden">
                        <CardHeader className="border-b bg-muted/20 shrink-0 text-center py-10">
                            <div className="size-20 rounded-full bg-emerald-500/10 flex items-center justify-center mx-auto mb-6 ring-8 ring-emerald-500/5">
                                <CheckCircle2 className="size-10 text-emerald-500" />
                            </div>
                            <CardTitle className="text-2xl mb-2">Import Completed Successfully</CardTitle>
                            <CardDescription className="text-base">Your inventory has been updated.</CardDescription>
                        </CardHeader>
                        
                        <div className="flex-1 overflow-auto p-8 max-w-4xl mx-auto w-full">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
                                <div className="bg-emerald-50 dark:bg-emerald-950/20 p-6 rounded-xl border border-emerald-200 dark:border-emerald-900 flex items-center gap-5 shadow-sm">
                                    <div className="p-3 bg-emerald-100 dark:bg-emerald-900/50 rounded-lg">
                                        <CheckCircle2 className="size-8 text-emerald-600 dark:text-emerald-500" />
                                    </div>
                                    <div>
                                        <p className="text-sm font-semibold text-emerald-800 dark:text-emerald-300 uppercase tracking-wider mb-1">Imported</p>
                                        <p className="text-4xl font-bold text-emerald-900 dark:text-emerald-400">{result.successCount}</p>
                                    </div>
                                </div>
                                <div className="bg-rose-50 dark:bg-rose-950/20 p-6 rounded-xl border border-rose-200 dark:border-rose-900 flex items-center gap-5 shadow-sm">
                                    <div className="p-3 bg-rose-100 dark:bg-rose-900/50 rounded-lg">
                                        <AlertCircle className="size-8 text-rose-600 dark:text-rose-500" />
                                    </div>
                                    <div>
                                        <p className="text-sm font-semibold text-rose-800 dark:text-rose-300 uppercase tracking-wider mb-1">Failed</p>
                                        <p className="text-4xl font-bold text-rose-900 dark:text-rose-400">{result.failedCount}</p>
                                    </div>
                                </div>
                            </div>

                            {result.failedCount > 0 && (
                                <div className="border border-rose-200 dark:border-rose-900/50 rounded-xl overflow-hidden shadow-sm">
                                    <div className="bg-rose-50 dark:bg-rose-950/30 px-6 py-4 font-semibold text-rose-800 dark:text-rose-400 border-b border-rose-200 dark:border-rose-900 flex items-center gap-2">
                                        <AlertCircle className="size-4" />
                                        Error Report ({result.failedCount} records)
                                    </div>
                                    <div className="max-h-[300px] overflow-y-auto p-2">
                                        {result.failedRows?.map((err, i) => (
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
                            <Button type="button" variant="outline" onClick={reset}>
                                Upload Another File
                            </Button>
                            <Button onClick={() => navigate(`/stores/${storeId}/tools`, { state: { breadcrumbs: parentBreadcrumbs } })} className="px-8">
                                Return to Inventory
                            </Button>
                        </div>
                    </div>
                )}
            </Card>
        </div>
    );
}
