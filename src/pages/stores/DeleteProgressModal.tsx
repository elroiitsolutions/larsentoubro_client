import React, { useEffect, useState, useRef } from "react";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Loader2, CheckCircle2, AlertTriangle, Trash2, RefreshCw, Layers, Info } from "lucide-react";
import toolService from "@/services/tool.service";

interface DeleteProgressModalProps {
    open: boolean;
    jobId: string | null;
    totalCount: number;
    onComplete: () => void;
    onClose: () => void;
}

interface DeleteJobState {
    id: string;
    status: 'processing' | 'completed' | 'failed';
    stage: string;
    message: string;
    percentage: number;
    deletedCount: number;
    totalToDelete: number;
    resequencedCount: number;
    totalToResequence: number;
    error: string | null;
}

export const DeleteProgressModal: React.FC<DeleteProgressModalProps> = ({
    open,
    jobId,
    totalCount,
    onComplete,
    onClose,
}) => {
    const [job, setJob] = useState<DeleteJobState>({
        id: jobId || '',
        status: 'processing',
        stage: 'validating',
        message: 'Starting batch deletion...',
        percentage: 5,
        deletedCount: 0,
        totalToDelete: totalCount,
        resequencedCount: 0,
        totalToResequence: 0,
        error: null,
    });

    const eventSourceRef = useRef<EventSource | null>(null);
    const pollIntervalRef = useRef<NodeJS.Timeout | null>(null);

    useEffect(() => {
        if (!open || !jobId) {
            if (eventSourceRef.current) {
                eventSourceRef.current.close();
                eventSourceRef.current = null;
            }
            if (pollIntervalRef.current) {
                clearInterval(pollIntervalRef.current);
                pollIntervalRef.current = null;
            }
            return;
        }

        // Initialize state
        setJob({
            id: jobId,
            status: 'processing',
            stage: 'validating',
            message: 'Starting batch deletion & ID re-sequencing...',
            percentage: 5,
            deletedCount: 0,
            totalToDelete: totalCount,
            resequencedCount: 0,
            totalToResequence: 0,
            error: null,
        });

        const baseUrl = import.meta.env.VITE_API_BASE_URL || '';
        const token = localStorage.getItem('token') || '';
        const sseUrl = `${baseUrl}/api/tools/delete-jobs/${encodeURIComponent(jobId)}/stream?token=${encodeURIComponent(token)}`;

        let es: EventSource | null = null;
        try {
            es = new EventSource(sseUrl);
            eventSourceRef.current = es;

            es.onmessage = (event) => {
                try {
                    const data: DeleteJobState = JSON.parse(event.data);
                    setJob(data);

                    if (data.status === 'completed' || data.status === 'failed') {
                        if (es) {
                            es.close();
                            eventSourceRef.current = null;
                        }
                    }
                } catch (e) {
                    // Ignore parse error
                }
            };

            es.onerror = () => {
                // If SSE fails (e.g. proxy buffering), fallback to polling
                if (es) {
                    es.close();
                    eventSourceRef.current = null;
                }
                startPolling(jobId);
            };
        } catch {
            startPolling(jobId);
        }

        function startPolling(id: string) {
            if (pollIntervalRef.current) return;
            pollIntervalRef.current = setInterval(async () => {
                try {
                    const res = await toolService.getDeleteJobStatus(id);
                    if (res?.success && res.data) {
                        setJob(res.data);
                        if (res.data.status === 'completed' || res.data.status === 'failed') {
                            if (pollIntervalRef.current) {
                                clearInterval(pollIntervalRef.current);
                                pollIntervalRef.current = null;
                            }
                        }
                    }
                } catch {
                    // Ignore transient polling errors
                }
            }, 1000);
        }

        return () => {
            if (eventSourceRef.current) {
                eventSourceRef.current.close();
                eventSourceRef.current = null;
            }
            if (pollIntervalRef.current) {
                clearInterval(pollIntervalRef.current);
                pollIntervalRef.current = null;
            }
        };
    }, [open, jobId, totalCount]);

    const isFinished = job.status === 'completed';
    const isFailed = job.status === 'failed';
    const isProcessing = job.status === 'processing';

    const handlePrimaryAction = () => {
        if (isFinished) {
            onComplete();
        } else if (isFailed) {
            onClose();
        }
    };

    return (
        <Dialog open={open} onOpenChange={(val) => {
            if (!val && !isProcessing) {
                handlePrimaryAction();
            }
        }}>
            <DialogContent
                className="max-w-md sm:max-w-lg rounded-2xl p-6 shadow-2xl border bg-card"
                hideClose={isProcessing}
            >
                <DialogHeader className="space-y-2">
                    <div className="flex items-center gap-3">
                        {isProcessing && (
                            <div className="size-10 rounded-xl bg-rose-500/15 text-rose-600 flex items-center justify-center shrink-0 animate-pulse">
                                <Loader2 className="size-5 animate-spin" />
                            </div>
                        )}
                        {isFinished && (
                            <div className="size-10 rounded-xl bg-emerald-500/15 text-emerald-600 flex items-center justify-center shrink-0">
                                <CheckCircle2 className="size-6 text-emerald-600" />
                            </div>
                        )}
                        {isFailed && (
                            <div className="size-10 rounded-xl bg-rose-500/15 text-rose-600 flex items-center justify-center shrink-0">
                                <AlertTriangle className="size-6 text-rose-600" />
                            </div>
                        )}
                        <div>
                            <DialogTitle className="text-lg font-bold text-foreground">
                                {isProcessing && "Deleting Tools & Re-sequencing IDs"}
                                {isFinished && "Deletion & Re-sequencing Completed"}
                                {isFailed && "Deletion Failed"}
                            </DialogTitle>
                            <DialogDescription className="text-xs text-muted-foreground">
                                {isProcessing && "Batch processing and auto-resequencing remaining tools"}
                                {isFinished && "All selected tools moved to Trash and IDs re-sequenced"}
                                {isFailed && "An error occurred during deletion"}
                            </DialogDescription>
                        </div>
                    </div>
                </DialogHeader>

                <div className="space-y-5 pt-3">
                    {/* Live Progress Bar Container */}
                    <div className="space-y-2 bg-muted/40 p-4 rounded-xl border border-border/50">
                        <div className="flex items-center justify-between text-xs font-semibold">
                            <span className="text-muted-foreground flex items-center gap-1.5">
                                {isProcessing && <RefreshCw className="size-3 animate-spin text-primary" />}
                                {job.stage === 'deleting' && "Moving to Trash..."}
                                {job.stage === 'preparing_ids' && "Batch Step 1: Assigning temporary IDs..."}
                                {job.stage === 'updating_ids' && "Batch Step 2: Finalizing serials & IDs..."}
                                {job.stage === 'resequencing' && "Re-sequencing active tool IDs..."}
                                {job.stage === 'completed' && "Completed"}
                                {job.stage === 'validating' && "Validating..."}
                            </span>
                            <span className="font-mono text-primary font-bold text-sm">
                                {job.percentage}%
                            </span>
                        </div>

                        {/* Progress Bar with smooth transition */}
                        <div className="h-3 w-full bg-muted rounded-full overflow-hidden shadow-inner">
                            <div
                                className={`h-full rounded-full transition-all duration-500 ease-out ${
                                    isFailed
                                        ? "bg-rose-500"
                                        : isFinished
                                        ? "bg-gradient-to-r from-emerald-500 to-emerald-400"
                                        : "bg-gradient-to-r from-rose-500 via-amber-500 to-emerald-500 animate-pulse"
                                }`}
                                style={{ width: `${Math.max(5, Math.min(100, job.percentage))}%` }}
                            />
                        </div>

                        <p className="text-xs text-muted-foreground leading-relaxed pt-1 font-medium truncate">
                            {job.message}
                        </p>
                    </div>

                    {/* Stats Counters */}
                    <div className="grid grid-cols-2 gap-3 text-xs">
                        <div className="p-3 rounded-xl bg-card border flex items-center gap-2.5 shadow-sm">
                            <div className="size-8 rounded-lg bg-rose-500/10 text-rose-600 flex items-center justify-center shrink-0">
                                <Trash2 className="size-4" />
                            </div>
                            <div>
                                <span className="text-muted-foreground block text-[11px]">Deleted to Trash</span>
                                <span className="font-bold text-foreground text-sm font-mono">
                                    {job.deletedCount} <span className="text-muted-foreground text-xs font-normal">/ {job.totalToDelete}</span>
                                </span>
                            </div>
                        </div>

                        <div className="p-3 rounded-xl bg-card border flex items-center gap-2.5 shadow-sm">
                            <div className="size-8 rounded-lg bg-primary/10 text-primary flex items-center justify-center shrink-0">
                                <Layers className="size-4" />
                            </div>
                            <div>
                                <span className="text-muted-foreground block text-[11px]">Tools Re-sequenced</span>
                                <span className="font-bold text-foreground text-sm font-mono">
                                    {job.resequencedCount > 0 ? (
                                        <>
                                            {job.resequencedCount} <span className="text-muted-foreground text-xs font-normal">/ {job.totalToResequence}</span>
                                        </>
                                    ) : (
                                        <span className="text-muted-foreground text-xs italic font-normal">Auto-synced</span>
                                    )}
                                </span>
                            </div>
                        </div>
                    </div>

                    {/* Explicit Notification Notice Box */}
                    {isFinished ? (
                        <div className="p-3.5 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-800 dark:text-emerald-300 text-xs flex items-start gap-2.5">
                            <CheckCircle2 className="size-4 text-emerald-600 shrink-0 mt-0.5" />
                            <div className="space-y-1">
                                <p className="font-semibold text-emerald-900 dark:text-emerald-200">
                                    All remaining tool IDs have been updated!
                                </p>
                                <p className="text-emerald-700 dark:text-emerald-300/90 text-[11px] leading-relaxed">
                                    To eliminate sequence gaps, all remaining active tools in this project were re-sequenced in batches. Their Serial Numbers and System IDs are now synchronized.
                                </p>
                            </div>
                        </div>
                    ) : isFailed ? (
                        <div className="p-3.5 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-800 dark:text-rose-300 text-xs flex items-start gap-2.5">
                            <AlertTriangle className="size-4 text-rose-600 shrink-0 mt-0.5" />
                            <div className="space-y-1">
                                <p className="font-semibold text-rose-900 dark:text-rose-200">
                                    Operation halted
                                </p>
                                <p className="text-rose-700 dark:text-rose-300/90 text-[11px] leading-relaxed">
                                    {job.error || "Failed to complete tool deletion. Please check the error and try again."}
                                </p>
                            </div>
                        </div>
                    ) : (
                        <div className="p-3 rounded-xl bg-primary/5 border border-primary/20 text-xs text-muted-foreground flex items-start gap-2.5">
                            <Info className="size-4 text-primary shrink-0 mt-0.5" />
                            <p className="text-[11px] leading-relaxed">
                                <strong>Batch Re-sequencing:</strong> When tools are deleted, active tool IDs in this project are automatically updated in batches of 500 to keep the serial sequence continuous without database locks.
                            </p>
                        </div>
                    )}

                    {/* Footer Actions */}
                    <div className="pt-2 flex justify-end gap-2">
                        {isProcessing && (
                            <Button
                                disabled
                                className="w-full h-10 rounded-xl bg-primary/80 text-white cursor-not-allowed"
                            >
                                <Loader2 className="size-4 animate-spin mr-2" />
                                Processing in batches...
                            </Button>
                        )}
                        {isFinished && (
                            <Button
                                onClick={handlePrimaryAction}
                                className="w-full h-10 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-semibold transition-all shadow-md shadow-emerald-600/20"
                            >
                                <CheckCircle2 className="size-4 mr-2" />
                                Done & Refresh Tools
                            </Button>
                        )}
                        {isFailed && (
                            <Button
                                variant="destructive"
                                onClick={handlePrimaryAction}
                                className="w-full h-10 rounded-xl"
                            >
                                Close
                            </Button>
                        )}
                    </div>
                </div>
            </DialogContent>
        </Dialog>
    );
};

export default DeleteProgressModal;
