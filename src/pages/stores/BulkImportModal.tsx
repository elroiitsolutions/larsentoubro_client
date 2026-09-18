import { useState, useRef } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import toolService from "@/services/tool.service";
import type { BulkImportCommitData } from "@/services/tool.service";
import { FileUp, FileDown, Loader2, UploadCloud, AlertCircle, CheckCircle2, ArrowRight } from "lucide-react";

interface BulkImportModalProps {
    onSuccess: () => void;
}

type ImportStep = 'upload' | 'review' | 'result';

import { useParams } from "react-router-dom";

export function BulkImportModal({ onSuccess }: BulkImportModalProps) {
    const { storeId } = useParams();
    const fileInputRef = useRef<HTMLInputElement>(null);
    const [open, setOpen] = useState(false);
    const [step, setStep] = useState<ImportStep>('upload');
    const [file, setFile] = useState<File | null>(null);
    const [loading, setLoading] = useState(false);
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
        const jobId = previewData?.jobId;
        if (!jobId) return;

        setLoading(true);

        try {
            const data = await toolService.commitBulkImport(storeId || '', jobId);

            if (data.success && data.data) {
                const commitInfo = data.data;
                const resultData: BulkImportCommitData = {
                    successCount: commitInfo.totalToProcess || previewData.validCount || 0,
                    failedCount: previewData.invalidCount || 0,
                    failedRows: []
                };
                toast.success(`Successfully started import for ${resultData.successCount} tools`);
                setResult(resultData);
                setStep('result');
                if (resultData.successCount > 0) {
                    onSuccess();
                }
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
    };

    return (
        <>
            <Button variant="outline" className="gap-2" onClick={() => setOpen(true)}>
                <FileUp className="size-4" />
                Bulk Import
            </Button>

            <Dialog open={open} onOpenChange={(val) => {
                setOpen(val);
                if (!val) reset();
            }}>
                <DialogContent className="max-w-5xl max-h-[90vh] flex flex-col">
                    <DialogHeader className="flex flex-row items-center justify-between pr-8">
                        <DialogTitle>
                            {step === 'upload' && "Upload Bulk Import"}
                            {step === 'review' && "Review Records"}
                            {step === 'result' && "Import Summary"}
                        </DialogTitle>
                        {step === 'upload' && (
                            <Button
                                type="button"
                                variant="outline"
                                size="sm"
                                onClick={handleDownloadSample}
                                disabled={downloadingSample}
                                className="gap-2 shrink-0 shadow-sm"
                            >
                                {downloadingSample ? (
                                    <Loader2 className="size-3.5 animate-spin text-primary" />
                                ) : (
                                    <FileDown className="size-3.5 text-primary" />
                                )}
                                Download Sample (.xlsx)
                            </Button>
                        )}
                    </DialogHeader>

                    {step === 'upload' && (
                        <div className="py-6 flex-1">
                            <div className="border-2 border-dashed border-muted-foreground/25 rounded-lg p-12 text-center hover:bg-muted/50 transition-colors">
                                <UploadCloud className="size-10 text-muted-foreground mx-auto mb-4" />
                                <h3 className="text-lg font-semibold">Upload Excel or CSV File</h3>
                                <p className="text-sm text-muted-foreground mt-2 mb-6">
                                    Ensure your columns match the required template exactly.
                                </p>
                                
                                <input
                                    type="file"
                                    ref={fileInputRef}
                                    id="file-upload"
                                    className="hidden"
                                    accept=".xlsx, .xls, .csv"
                                    onChange={handleFileChange}
                                />
                                <div className="flex flex-wrap items-center justify-center gap-3">
                                    <Button
                                        type="button"
                                        variant={file ? "secondary" : "default"}
                                        className="cursor-pointer"
                                        onClick={() => fileInputRef.current?.click()}
                                    >
                                        {file ? file.name : "Select File"}
                                    </Button>
                                    <Button
                                        type="button"
                                        variant="outline"
                                        className="cursor-pointer gap-2"
                                        onClick={handleDownloadSample}
                                        disabled={downloadingSample}
                                    >
                                        {downloadingSample ? (
                                            <Loader2 className="size-4 animate-spin text-primary" />
                                        ) : (
                                            <FileDown className="size-4 text-primary" />
                                        )}
                                        Download Sample (.xlsx)
                                    </Button>
                                </div>
                            </div>

                            <div className="mt-6 flex justify-end gap-2">
                                <Button type="button" variant="outline" onClick={() => setOpen(false)}>
                                    Cancel
                                </Button>
                                <Button onClick={handlePreview} disabled={!file || loading}>
                                    {loading && <Loader2 className="size-4 animate-spin mr-2" />}
                                    Preview Data <ArrowRight className="size-4 ml-2" />
                                </Button>
                            </div>
                        </div>
                    )}

                    {step === 'review' && previewData && (
                        <div className="flex flex-col flex-1 overflow-hidden py-4">
                            <div className="flex gap-4 mb-4 shrink-0">
                                <div className="bg-muted px-4 py-2 rounded flex-1 text-sm">
                                    <span className="font-semibold">{previewData.totalRows}</span> Total Rows Found
                                </div>
                                <div className="bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400 px-4 py-2 rounded flex-1 text-sm">
                                    <span className="font-semibold">{previewData.validCount}</span> Ready to Import
                                </div>
                                <div className="bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400 px-4 py-2 rounded flex-1 text-sm">
                                    <span className="font-semibold">{previewData.invalidCount}</span> Contain Errors
                                </div>
                            </div>
                            
                            <div className="flex-1 overflow-auto border rounded-md relative min-h-[300px]">
                                <table className="w-full text-sm text-left">
                                    <thead className="sticky top-0 bg-muted/80 backdrop-blur z-10 text-muted-foreground">
                                        <tr>
                                            <th className="px-4 py-2 font-medium">Row</th>
                                            <th className="px-4 py-2 font-medium">Description</th>
                                            <th className="px-4 py-2 font-medium">Tool Code</th>
                                            <th className="px-4 py-2 font-medium">Project</th>
                                            <th className="px-4 py-2 font-medium">Store</th>
                                            <th className="px-4 py-2 font-medium">Errors</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y">
                                        {previewData.records.map((r: any, idx: number) => (
                                            <tr key={idx} className={r.isValid ? "" : "bg-red-50/50 dark:bg-red-950/10"}>
                                                <td className="px-4 py-2 text-muted-foreground font-mono">{r.rowNumber}</td>
                                                <td className="px-4 py-2 font-medium truncate max-w-[200px]">{r.description || '-'}</td>
                                                <td className="px-4 py-2 font-mono text-xs">{r.toolCode || '-'}</td>
                                                <td className="px-4 py-2">{r.projectName || '-'}</td>
                                                <td className="px-4 py-2">{r.storeName || '-'}</td>
                                                <td className="px-4 py-2">
                                                    {r.isValid ? (
                                                        <span className="text-xs font-medium text-green-600 dark:text-green-500 flex items-center gap-1">
                                                            <CheckCircle2 className="size-3" /> Valid
                                                        </span>
                                                    ) : (
                                                        <div className="flex flex-col gap-1">
                                                            {r.errors.map((err: string, i: number) => (
                                                                <span key={i} className="text-xs font-medium text-red-600 dark:text-red-400 flex items-start gap-1">
                                                                    <AlertCircle className="size-3 shrink-0 mt-0.5" /> {err}
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

                            <div className="mt-4 pt-4 border-t flex justify-between shrink-0">
                                <Button type="button" variant="outline" onClick={() => setStep('upload')}>
                                    Back
                                </Button>
                                <Button 
                                    onClick={handleCommit} 
                                    disabled={loading || previewData.validCount === 0}
                                    className="bg-green-600 hover:bg-green-700 text-white"
                                >
                                    {loading && <Loader2 className="size-4 animate-spin mr-2" />}
                                    Import {previewData.validCount} Valid Records
                                </Button>
                            </div>
                        </div>
                    )}

                    {step === 'result' && result && (
                        <div className="py-6 flex-1">
                            <div className="flex gap-4 mb-6">
                                <div className="flex-1 bg-green-50 dark:bg-green-950/20 p-4 rounded-lg border border-green-200 dark:border-green-900 flex items-center gap-3">
                                    <CheckCircle2 className="size-8 text-green-600 dark:text-green-500" />
                                    <div>
                                        <p className="text-sm font-medium text-green-800 dark:text-green-300">Successfully Imported</p>
                                        <p className="text-2xl font-bold text-green-900 dark:text-green-400">{result.successCount}</p>
                                    </div>
                                </div>
                                <div className="flex-1 bg-red-50 dark:bg-red-950/20 p-4 rounded-lg border border-red-200 dark:border-red-900 flex items-center gap-3">
                                    <AlertCircle className="size-8 text-red-600 dark:text-red-500" />
                                    <div>
                                        <p className="text-sm font-medium text-red-800 dark:text-red-300">Failed Records</p>
                                        <p className="text-2xl font-bold text-red-900 dark:text-red-400">{result.failedCount}</p>
                                    </div>
                                </div>
                            </div>

                            {result.failedCount > 0 && (
                                <div className="border rounded-md">
                                    <div className="bg-muted px-4 py-2 font-medium text-sm border-b">
                                        Import Error Report
                                    </div>
                                    <div className="max-h-[300px] overflow-y-auto p-4 space-y-2">
                                        {result.failedRows?.map((err, i) => (
                                            <div key={i} className="flex gap-3 text-sm text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-950/30 p-2 rounded">
                                                <span className="font-bold shrink-0">Row {err.row}:</span>
                                                <span>{err.reason}</span>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}

                            <div className="mt-6 flex justify-end gap-2">
                                <Button type="button" variant="outline" onClick={reset}>
                                    Upload Another
                                </Button>
                                <Button onClick={() => setOpen(false)}>
                                    Done
                                </Button>
                            </div>
                        </div>
                    )}
                </DialogContent>
            </Dialog>
        </>
    );
}
