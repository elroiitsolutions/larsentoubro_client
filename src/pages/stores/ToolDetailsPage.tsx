import { useState, useEffect } from "react";
import { useParams, useNavigate, useLocation } from "react-router-dom";
import toolService from "@/services/tool.service";
import { toast } from "sonner";
import {
    Wrench,
    CheckCircle2,
    XCircle,
    Building2,
    HardHat,
    MapPin,
    Calendar,
    Hash,
    Truck,
    UserCircle2,
    FileText,
    QrCode,
    ShieldCheck,
    Loader2,
    Copy,
    Check,
    ExternalLink,
    FileCheck,
    Tag,
    Sparkles,
    Edit
} from "lucide-react";

import { ToolFormModal } from "./ToolFormModal";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export function ToolDetailsPage() {
    const { storeId, toolId } = useParams();
    const navigate = useNavigate();
    const location = useLocation();

    // Breadcrumbs logic
    const currentBreadcrumbs = (location.state as any)?.breadcrumbs || [];

    const [tool, setTool] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [copiedId, setCopiedId] = useState(false);
    const [copiedQr, setCopiedQr] = useState(false);

    useEffect(() => {
        const fetchTool = async () => {
            try {
                const data = await toolService.getToolById(toolId || '');

                if (data.success) {
                    setTool(data.data);
                } else {
                    toast.error(data.message || "Failed to fetch tool details");
                }
            } catch (error: any) {
                console.error(error);
                const message = error?.response?.data?.message || "Error fetching tool details";
                toast.error(message);
            } finally {
                setLoading(false);
            }
        };

        if (toolId) {
            fetchTool();
        }
    }, [toolId]);

    const handleCopyId = () => {
        if (tool?.toolId) {
            navigator.clipboard.writeText(tool.toolId);
            setCopiedId(true);
            toast.success("Tool ID copied to clipboard!");
            setTimeout(() => setCopiedId(false), 2000);
        }
    };

    const handleCopyQr = () => {
        if (tool?.qrLink) {
            navigator.clipboard.writeText(tool.qrLink);
            setCopiedQr(true);
            toast.success("QR Code link copied to clipboard!");
            setTimeout(() => setCopiedQr(false), 2000);
        }
    };

    if (loading) {
        return (
            <div className="flex h-full w-full items-center justify-center min-h-[60vh]">
                <Loader2 className="size-8 animate-spin text-primary" />
            </div>
        );
    }

    if (!tool) {
        return (
            <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4">
                <p className="text-muted-foreground text-lg">Tool not found</p>
                <Button variant="outline" onClick={() => navigate(-1)}>
                    Go Back
                </Button>
            </div>
        );
    }

    const isAvailable = tool.status === 'Available';

    return (
        <div className="flex flex-col gap-3.5 mx-auto w-full animate-in fade-in duration-500 h-[calc(100vh-4.5rem)] overflow-hidden pb-1">
            {/* User-Friendly Application Header */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 shrink-0 pt-1">
                <div className="flex flex-wrap items-center gap-3">
                    <h1 className="text-2xl font-extrabold tracking-tight bg-gradient-to-r from-foreground to-foreground/80 bg-clip-text">
                        {tool.description}
                    </h1>
                    <span className={`shrink-0 inline-flex items-center rounded-full border px-3 py-1 text-xs font-semibold transition-colors shadow-sm ${isAvailable ? 'bg-emerald-500/15 text-emerald-700 dark:text-emerald-400 border-emerald-500/30' : 'bg-rose-500/15 text-rose-700 dark:text-rose-400 border-rose-500/30'}`}>
                        {isAvailable ? <CheckCircle2 className="size-3.5 mr-1.5" /> : <XCircle className="size-3.5 mr-1.5" />}
                        {tool.status}
                    </span>
                    <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-muted/50 border border-border/60 text-xs font-mono text-muted-foreground">
                        <Hash className="size-3 text-primary" />
                        <span>ID: {tool.toolId}</span>
                        <button
                            type="button"
                            onClick={handleCopyId}
                            className="ml-1 p-1 rounded hover:bg-background transition-colors text-foreground/70 hover:text-foreground"
                            title="Copy Tool ID"
                        >
                            {copiedId ? <Check className="size-3 text-emerald-500" /> : <Copy className="size-3" />}
                        </button>
                    </div>
                    {tool.toolCode && (
                        <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-primary/10 border border-primary/20 text-xs font-mono text-primary font-semibold">
                            <Tag className="size-3 text-primary" />
                            <span>Code: {tool.toolCode}</span>
                        </div>
                    )}
                </div>

                {/* Quick Action Shortcuts */}
                <div className="flex items-center gap-2">
                    <ToolFormModal
                        storeId={tool.currentSite?._id || storeId || ''}
                        tool={tool}
                        onSuccess={() => window.location.reload()}
                        triggerButton={
                            <Button
                                variant="outline"
                                size="sm"
                                className="h-8 rounded-xl text-xs gap-1.5 shadow-sm hover:bg-primary/5 hover:border-primary/30 transition-all cursor-pointer"
                            >
                                <Edit className="size-3.5 text-primary" />
                                Edit Tool
                            </Button>
                        }
                    />
                    {tool.qrLink && (
                        <Button
                            variant="outline"
                            size="sm"
                            onClick={handleCopyQr}
                            className="h-8 rounded-xl text-xs gap-1.5 shadow-sm hover:bg-primary/5 hover:border-primary/30 transition-all"
                        >
                            {copiedQr ? <Check className="size-3.5 text-emerald-500" /> : <QrCode className="size-3.5 text-primary" />}
                            Copy QR Link
                        </Button>
                    )}
                    {tool.testCertificate && (
                        <Button
                            variant="outline"
                            size="sm"
                            render={
                                <a href={tool.testCertificate} target="_blank" rel="noopener noreferrer">
                                    <FileCheck className="size-3.5 text-emerald-500" />
                                    Test Certificate
                                    <ExternalLink className="size-3" />
                                </a>
                            }
                            className="h-8 rounded-xl text-xs gap-1.5 shadow-sm hover:bg-primary/5 hover:border-primary/30 transition-all"
                        />
                    )}
                </div>
            </div>

            {/* 2x2 Bento Grid - Guaranteed 100vh Fit */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5 flex-1 min-h-0 overflow-hidden">

                {/* Left Column - Core Specifications & Assignment */}
                <div className="flex flex-col gap-3.5 h-full overflow-hidden">
                    {/* Core Specifications */}
                    <Card className="border-border/60 shadow-sm bg-gradient-to-br from-card to-card/60 backdrop-blur flex flex-col flex-1 min-h-0 overflow-hidden rounded-2xl">
                        <CardHeader className="py-2 px-4 border-b bg-muted/15 shrink-0 flex flex-row items-center justify-between">
                            <CardTitle className="text-xs font-bold tracking-wider uppercase flex items-center gap-2 text-foreground/90">
                                <span className="p-1.5 rounded-lg bg-blue-500/10 text-blue-600 dark:text-blue-400">
                                    <Wrench className="size-3.5" />
                                </span>
                                Specifications
                            </CardTitle>
                            <span className="text-[11px] font-medium text-muted-foreground">Technical Info</span>
                        </CardHeader>
                        <CardContent className="p-3.5 flex-1 min-h-0 overflow-auto">
                            <div className="grid grid-cols-3 gap-2.5 h-full">
                                <div className="bg-primary/5 hover:bg-primary/10 border border-primary/20 hover:border-primary/30 transition-all rounded-xl p-2.5 flex flex-col justify-between">
                                    <span className="text-[10px] font-bold text-primary uppercase tracking-wider">Tool Code</span>
                                    <span className="text-sm font-extrabold text-primary truncate">{tool.toolCode || '-'}</span>
                                </div>
                                <div className="bg-muted/30 hover:bg-muted/50 border border-border/40 hover:border-border/80 transition-all rounded-xl p-2.5 flex flex-col justify-between">
                                    <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">Make / Year</span>
                                    <span className="text-sm font-bold text-foreground truncate">{tool.makeYear || '-'}</span>
                                </div>
                                <div className="bg-muted/30 hover:bg-muted/50 border border-border/40 hover:border-border/80 transition-all rounded-xl p-2.5 flex flex-col justify-between">
                                    <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">Capacity</span>
                                    <span className="text-sm font-bold text-foreground truncate">{tool.capacity || '-'}</span>
                                </div>
                                <div className="bg-emerald-500/5 hover:bg-emerald-500/10 border border-emerald-500/20 hover:border-emerald-500/30 transition-all rounded-xl p-2.5 flex flex-col justify-between">
                                    <span className="text-[10px] font-bold text-emerald-600 dark:text-emerald-400 uppercase tracking-wider">Safe Working Load</span>
                                    <span className="text-sm font-extrabold text-emerald-700 dark:text-emerald-400 truncate">{tool.safeWorkingLoad || '-'}</span>
                                </div>
                                <div className="bg-muted/30 hover:bg-muted/50 border border-border/40 hover:border-border/80 transition-all rounded-xl p-2.5 flex flex-col justify-between">
                                    <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">Tool Type</span>
                                    <span className="text-sm font-bold text-foreground truncate">{tool.toolType || '-'}</span>
                                </div>
                                <div className="bg-muted/30 hover:bg-muted/50 border border-border/40 hover:border-border/80 transition-all rounded-xl p-2.5 flex flex-col justify-between">
                                    <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">Metal Type</span>
                                    <span className="text-sm font-bold text-foreground truncate">{tool.metalType || '-'}</span>
                                </div>
                                <div className="bg-muted/30 hover:bg-muted/50 border border-border/40 hover:border-border/80 transition-all rounded-xl p-2.5 flex flex-col justify-between">
                                    <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">Tool Variant</span>
                                    <span className="text-sm font-bold text-foreground truncate">{tool.toolVariant || '-'}</span>
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    {/* Project & Store Assignment */}
                    <Card className="border-border/60 shadow-sm bg-gradient-to-br from-card to-card/60 backdrop-blur flex flex-col flex-1 min-h-0 overflow-hidden rounded-2xl">
                        <CardHeader className="py-2 px-4 border-b bg-muted/15 shrink-0 flex flex-row items-center justify-between">
                            <CardTitle className="text-xs font-bold tracking-wider uppercase flex items-center gap-2 text-foreground/90">
                                <span className="p-1.5 rounded-lg bg-amber-500/10 text-amber-600 dark:text-amber-400">
                                    <Building2 className="size-3.5" />
                                </span>
                                Project & Store Assignment
                            </CardTitle>
                            <span className="text-[11px] font-medium text-muted-foreground">Allocation</span>
                        </CardHeader>
                        <CardContent className="p-3.5 flex-1 min-h-0 overflow-auto">
                            <div className="grid grid-cols-2 gap-2.5 h-full">
                                <div className="bg-muted/30 hover:bg-muted/50 border border-border/40 hover:border-border/80 transition-all rounded-xl p-2.5 flex flex-col justify-between">
                                    <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">Project</span>
                                    <span className="text-sm font-bold text-foreground truncate">
                                        {tool.project?.name || '-'} {tool.project?.code ? `(${tool.project.code})` : ''}
                                    </span>
                                </div>
                                <div className="bg-amber-500/5 hover:bg-amber-500/10 border border-amber-500/20 hover:border-amber-500/30 transition-all rounded-xl p-2.5 flex flex-col justify-between">
                                    <span className="text-[10px] font-bold text-amber-700 dark:text-amber-400 uppercase tracking-wider flex items-center gap-1">
                                        <MapPin className="size-3" /> Assigned Store
                                    </span>
                                    <span className="text-sm font-extrabold text-amber-800 dark:text-amber-300 truncate">
                                        {tool.currentSite?.name || '-'}
                                    </span>
                                </div>
                                <div className="bg-muted/30 hover:bg-muted/50 border border-border/40 hover:border-border/80 transition-all rounded-xl p-2.5 flex flex-col justify-between">
                                    <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">Job Code</span>
                                    <span className="text-sm font-bold text-foreground truncate">{tool.jobCode || '-'}</span>
                                </div>
                                <div className="bg-muted/30 hover:bg-muted/50 border border-border/40 hover:border-border/80 transition-all rounded-xl p-2.5 flex flex-col justify-between">
                                    <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">Job Description</span>
                                    <span className="text-xs font-semibold text-foreground/90 truncate">{tool.jobDescription || '-'}</span>
                                </div>
                                {(tool.subcontractorName || tool.subcontractorCode || tool.subcontractorMobile) && (
                                    <div className="col-span-2 bg-muted/40 border border-border/50 rounded-xl p-2 flex items-center justify-between">
                                        <span className="text-[10px] font-bold text-muted-foreground uppercase">Subcontractor:</span>
                                        <span className="text-xs font-semibold">{tool.subcontractorName || '-'} ({tool.subcontractorCode || tool.subcontractorMobile || '-'})</span>
                                    </div>
                                )}
                            </div>
                        </CardContent>
                    </Card>
                </div>

                {/* Right Column - Procurement & Documentation */}
                <div className="flex flex-col gap-3.5 h-full overflow-hidden">
                    {/* Procurement Details */}
                    <Card className="border-border/60 shadow-sm bg-gradient-to-br from-card to-card/60 backdrop-blur flex flex-col flex-1 min-h-0 overflow-hidden rounded-2xl">
                        <CardHeader className="py-2 px-4 border-b bg-muted/15 shrink-0 flex flex-row items-center justify-between">
                            <CardTitle className="text-xs font-bold tracking-wider uppercase flex items-center gap-2 text-foreground/90">
                                <span className="p-1.5 rounded-lg bg-purple-500/10 text-purple-600 dark:text-purple-400">
                                    <Truck className="size-3.5" />
                                </span>
                                Procurement & Vendor
                            </CardTitle>
                            <span className="text-[11px] font-medium text-muted-foreground">Purchasing</span>
                        </CardHeader>
                        <CardContent className="p-3.5 flex-1 min-h-0 overflow-auto">
                            <div className="grid grid-cols-2 gap-2.5 h-full">
                                <div className="bg-muted/30 hover:bg-muted/50 border border-border/40 hover:border-border/80 transition-all rounded-xl p-2.5 flex flex-col justify-between">
                                    <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider flex items-center gap-1">
                                        <UserCircle2 className="size-3 text-primary" /> Purchaser Name
                                    </span>
                                    <span className="text-sm font-bold text-foreground truncate">{tool.purchaserName || '-'}</span>
                                </div>
                                <div className="bg-muted/30 hover:bg-muted/50 border border-border/40 hover:border-border/80 transition-all rounded-xl p-2.5 flex flex-col justify-between">
                                    <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">Purchaser Contact</span>
                                    <span className="text-sm font-bold text-foreground truncate">{tool.purchaserContact || '-'}</span>
                                </div>
                                <div className="bg-muted/30 hover:bg-muted/50 border border-border/40 hover:border-border/80 transition-all rounded-xl p-2.5 flex flex-col justify-between">
                                    <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">Supplier Code</span>
                                    <span className="text-sm font-bold text-foreground truncate">{tool.supplierCode || '-'}</span>
                                </div>
                                <div className="bg-muted/30 hover:bg-muted/50 border border-border/40 hover:border-border/80 transition-all rounded-xl p-2.5 flex flex-col justify-between">
                                    <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider flex items-center gap-1">
                                        <Calendar className="size-3 text-primary" /> Date of Supply
                                    </span>
                                    <span className="text-sm font-bold text-foreground truncate">{tool.dateOfSupply || '-'}</span>
                                </div>
                                <div className="col-span-2 bg-purple-500/5 hover:bg-purple-500/10 border border-purple-500/20 hover:border-purple-500/30 transition-all rounded-xl p-2.5 flex items-center justify-between">
                                    <span className="text-[10px] font-bold text-purple-700 dark:text-purple-400 uppercase tracking-wider flex items-center gap-1.5">
                                        <ShieldCheck className="size-3.5 text-purple-600" /> Validity Period
                                    </span>
                                    <span className="text-sm font-extrabold text-purple-800 dark:text-purple-300 truncate">{tool.validityPeriod || 'Unlimited / Not Specified'}</span>
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    {/* Documentation & Remarks */}
                    <Card className="border-border/60 shadow-sm bg-gradient-to-br from-card to-card/60 backdrop-blur flex flex-col flex-1 min-h-0 overflow-hidden rounded-2xl">
                        <CardHeader className="py-2 px-4 border-b bg-muted/15 shrink-0 flex flex-row items-center justify-between">
                            <CardTitle className="text-xs font-bold tracking-wider uppercase flex items-center gap-2 text-foreground/90">
                                <span className="p-1.5 rounded-lg bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
                                    <FileText className="size-3.5" />
                                </span>
                                Documentation & Remarks
                            </CardTitle>
                            <span className="text-[11px] font-medium text-muted-foreground">Resources</span>
                        </CardHeader>
                        <CardContent className="p-3.5 flex-1 min-h-0 overflow-auto flex flex-col gap-2.5 justify-between">
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                                {tool.qrLink ? (
                                    <a
                                        href={tool.qrLink}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="bg-muted/30 hover:bg-primary/10 border border-border/40 hover:border-primary/30 transition-all rounded-xl p-2.5 flex flex-col justify-between group"
                                    >
                                        <span className="text-[10px] font-bold text-muted-foreground group-hover:text-primary uppercase tracking-wider flex items-center justify-between">
                                            <span className="flex items-center gap-1">
                                                <QrCode className="size-3 text-primary" /> QR Code
                                            </span>
                                            <ExternalLink className="size-3 opacity-60 group-hover:opacity-100" />
                                        </span>
                                        <span className="text-xs font-mono text-primary truncate mt-1">Open QR Page</span>
                                    </a>
                                ) : (
                                    <div className="bg-muted/20 border border-dashed border-border/40 rounded-xl p-2.5 flex flex-col justify-center">
                                        <span className="text-[10px] font-bold text-muted-foreground uppercase">QR Code Link</span>
                                        <span className="text-xs text-muted-foreground italic mt-0.5">Not generated</span>
                                    </div>
                                )}

                                {tool.testCertificate ? (
                                    <a
                                        href={tool.testCertificate}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="bg-muted/30 hover:bg-emerald-500/10 border border-border/40 hover:border-emerald-500/30 transition-all rounded-xl p-2.5 flex flex-col justify-between group"
                                    >
                                        <span className="text-[10px] font-bold text-muted-foreground group-hover:text-emerald-600 uppercase tracking-wider flex items-center justify-between">
                                            <span className="flex items-center gap-1">
                                                <FileCheck className="size-3 text-emerald-500" /> Test Certificate
                                            </span>
                                            <ExternalLink className="size-3 opacity-60 group-hover:opacity-100" />
                                        </span>
                                        <span className="text-xs font-semibold text-emerald-600 dark:text-emerald-400 truncate mt-1">View Certificate</span>
                                    </a>
                                ) : (
                                    <div className="bg-muted/20 border border-dashed border-border/40 rounded-xl p-2.5 flex flex-col justify-center">
                                        <span className="text-[10px] font-bold text-muted-foreground uppercase">Test Certificate</span>
                                        <span className="text-xs text-muted-foreground italic mt-0.5">No certificate uploaded</span>
                                    </div>
                                )}
                            </div>

                            <div className="bg-muted/30 border border-border/50 rounded-xl p-2.5 flex-1 flex flex-col justify-center">
                                <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground mb-1 flex items-center gap-1">
                                    <Sparkles className="size-3 text-amber-500" /> Remarks / Notes
                                </span>
                                {tool.remarks ? (
                                    <p className="text-xs italic text-foreground/90 line-clamp-2">
                                        "{tool.remarks}"
                                    </p>
                                ) : (
                                    <p className="text-xs text-muted-foreground italic">No additional remarks recorded for this tool.</p>
                                )}
                            </div>
                        </CardContent>
                    </Card>
                </div>
            </div>
        </div>
    );
}
