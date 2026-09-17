import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import toolService from "@/services/tool.service";
import formService from "@/services/form.service";
import { toast } from "sonner";
import {
    Wrench,
    CheckCircle2,
    XCircle,
    Building2,
    MapPin,
    Calendar,
    Hash,
    Truck,
    UserCircle2,
    QrCode,
    ShieldCheck,
    Loader2,
    Copy,
    Check,
    ExternalLink,
    FileCheck,
    Tag,
    Edit,
    ArrowLeft,
    Trash2,
} from "lucide-react";
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
} from "@/components/ui/alert-dialog";

import { ToolFormModal } from "./ToolFormModal";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export function ToolDetailsPage() {
    const { storeId: paramStoreId, toolId } = useParams();
    const navigate = useNavigate();

    const [tool, setTool] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [viewSchema, setViewSchema] = useState<any>(null);
    const [copiedId, setCopiedId] = useState(false);
    const [copiedQr, setCopiedQr] = useState(false);

    const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
    const [deleting, setDeleting] = useState(false);

    const confirmDelete = async () => {
        if (!tool?._id) return;
        setDeleting(true);
        try {
            const res = await toolService.deleteTool(tool._id);
            if (res.success) {
                toast.success(res.message || "Tool soft-deleted successfully");
                navigate(-1);
            }
        } catch (error: any) {
            console.error(error);
            toast.error(error?.response?.data?.message || "Failed to delete tool");
        } finally {
            setDeleting(false);
            setShowDeleteConfirm(false);
        }
    };

    useEffect(() => {
        const fetchToolData = async () => {
            try {
                const [toolRes, schemaRes] = await Promise.allSettled([
                    toolService.getToolById(toolId || ''),
                    formService.getFormBySlug('tool-details-view')
                ]);

                if (toolRes.status === 'fulfilled' && toolRes.value.success) {
                    setTool(toolRes.value.data);
                } else {
                    toast.error("Failed to fetch tool details");
                }

                if (schemaRes.status === 'fulfilled' && schemaRes.value.success && schemaRes.value.data) {
                    setViewSchema(schemaRes.value.data);
                }
            } catch (error: any) {
                console.error(error);
                toast.error("Error loading tool information");
            } finally {
                setLoading(false);
            }
        };

        if (toolId) {
            fetchToolData();
        }
    }, [toolId]);

    const handleCopyId = () => {
        const idToCopy = tool?.toolCode || tool?.toolId;
        if (idToCopy) {
            navigator.clipboard.writeText(idToCopy);
            setCopiedId(true);
            toast.success("Tool ID copied to clipboard!");
            setTimeout(() => setCopiedId(false), 2000);
        }
    };

    const handleCopyQr = () => {
        if (tool?.qrLink) {
            navigator.clipboard.writeText(tool.qrLink);
            setCopiedQr(true);
            toast.success("QR Link copied to clipboard!");
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
                <p className="text-muted-foreground text-lg font-medium">Tool not found</p>
                <Button variant="outline" onClick={() => navigate(-1)} className="rounded-xl">
                    <ArrowLeft className="size-4 mr-2" />
                    Go Back
                </Button>
            </div>
        );
    }

    // Helper to check if field is visible per Admin settings
    const isFieldVisible = (fieldName: string) => {
        if (!viewSchema?.fields || viewSchema.fields.length === 0) return true;
        const target = viewSchema.fields.find((f: any) => f.name === fieldName || f.id === fieldName);
        if (!target) return true;
        return !target.disabled;
    };

    const isAvailable = tool.status === 'Available';

    // Comprehensive field extraction looking at root properties, customFields Map/Object, and key aliases
    const getFieldValue = (key: string, aliases: string[] = []) => {
        const keysToTry = [key, ...aliases];
        
        // 1. Try on root tool object
        for (const k of keysToTry) {
            if (tool[k] !== undefined && tool[k] !== null && tool[k] !== '') {
                return tool[k];
            }
        }

        // 2. Try on customFields object or Map
        if (tool.customFields) {
            const cf = tool.customFields;
            if (typeof cf.get === 'function') {
                for (const k of keysToTry) {
                    const val = cf.get(k);
                    if (val !== undefined && val !== null && val !== '') return val;
                }
            } else if (typeof cf === 'object') {
                for (const k of keysToTry) {
                    if (cf[k] !== undefined && cf[k] !== null && cf[k] !== '') return cf[k];
                }
                // Case-insensitive lookup in customFields keys
                const cfKeys = Object.keys(cf);
                for (const k of keysToTry) {
                    const normK = k.toLowerCase().replace(/[^a-z0-9]/g, '');
                    const matchedKey = cfKeys.find(ck => ck.toLowerCase().replace(/[^a-z0-9]/g, '') === normK);
                    if (matchedKey && cf[matchedKey] !== undefined && cf[matchedKey] !== null && cf[matchedKey] !== '') {
                        return cf[matchedKey];
                    }
                }
            }
        }

        return undefined;
    };

    // Resolving values with intelligent fallbacks for Step 5
    const toolCodeVal = getFieldValue('toolCode', ['tool_code', 'Tool Code', 'tag', 'Tag']) || getFieldValue('toolId') || '-';
    
    let makeYearVal = getFieldValue('makeYear', ['make_year', 'Make Year', 'year', 'Year', 'make']);
    if (!makeYearVal && tool.dateOfSupply) {
        const dateParts = String(tool.dateOfSupply).split(/[\/\-]/);
        if (dateParts.length === 3) {
            if (dateParts[2].length === 4) makeYearVal = dateParts[2];
            else if (dateParts[0].length === 4) makeYearVal = dateParts[0];
        }
    }
    if (!makeYearVal && tool.createdAt) {
        makeYearVal = new Date(tool.createdAt).getFullYear().toString();
    }
    makeYearVal = makeYearVal || '-';

    const toolVariantVal = getFieldValue('toolVariant', [
        'tool_variant', 
        'Tool Variant', 
        'variant', 
        'Variant', 
        'operationType', 
        'Operation Type',
        'typeVariant'
    ]) || 'Standard';
    const capacityVal = getFieldValue('capacity') || '-';
    const safeWorkingLoadVal = getFieldValue('safeWorkingLoad') || '-';
    const toolTypeVal = getFieldValue('toolType') || '-';
    const metalTypeVal = getFieldValue('metalType') || '-';

    const purchaserNameVal = getFieldValue('purchaserName') || '-';
    const purchaserContactVal = getFieldValue('purchaserContact') || '-';
    const supplierCodeVal = getFieldValue('supplierCode') || '-';
    const dateOfSupplyVal = getFieldValue('dateOfSupply') || '-';
    const rawValidity = getFieldValue('validityPeriod');
    const resolvedValidity = (rawValidity && rawValidity !== 'N/A')
        ? rawValidity
        : (tool?.customFields?.validation || tool?.customFields?.validityPeriod || rawValidity);
    const validityPeriodVal = resolvedValidity ? (String(resolvedValidity).toLowerCase().includes('year') ? resolvedValidity : `${resolvedValidity} Years`) : 'Unlimited / N/A';

    const jobCodeVal = getFieldValue('jobCode') || '-';
    const jobDescriptionVal = getFieldValue('jobDescription') || '-';
    const subName = getFieldValue('subcontractorName');
    const subCode = getFieldValue('subcontractorCode') || getFieldValue('subcontractorMobile');

    return (
        <div className="flex flex-col gap-4 w-full animate-in fade-in duration-300 min-h-0 overflow-y-auto pb-10">
            {/* Top Navigation & Action Header */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 shrink-0 pt-1 border-b border-border/50 pb-4">
                <div className="flex flex-wrap items-center gap-3">
                    <h1 className="text-2xl font-extrabold tracking-tight text-foreground flex items-center gap-2">
                        {tool.description}
                    </h1>
                    <span className={`shrink-0 inline-flex items-center rounded-full border px-3 py-1 text-xs font-semibold transition-colors shadow-2xs ${isAvailable ? 'bg-emerald-500/15 text-emerald-700 dark:text-emerald-400 border-emerald-500/30' : 'bg-rose-500/15 text-rose-700 dark:text-rose-400 border-rose-500/30'}`}>
                        {isAvailable ? <CheckCircle2 className="size-3.5 mr-1.5" /> : <XCircle className="size-3.5 mr-1.5" />}
                        {tool.status}
                    </span>
                    <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-muted/60 border border-border/60 text-xs font-mono text-muted-foreground">
                        <Hash className="size-3 text-primary" />
                        <span>ID: {tool.toolId}</span>
                        <button
                            type="button"
                            onClick={handleCopyId}
                            className="ml-1 p-1 rounded hover:bg-background transition-colors text-foreground/70 hover:text-foreground cursor-pointer"
                            title="Copy Tool ID"
                        >
                            {copiedId ? <Check className="size-3 text-emerald-500" /> : <Copy className="size-3" />}
                        </button>
                    </div>
                    {toolCodeVal !== '-' && (
                        <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-primary/10 border border-primary/20 text-xs font-mono text-primary font-semibold">
                            <Tag className="size-3 text-primary" />
                            <span>Code: {toolCodeVal}</span>
                        </div>
                    )}
                </div>

                {/* Quick Action Buttons */}
                <div className="flex items-center gap-2">
                    <ToolFormModal
                        storeId={tool.currentSite?._id || (typeof tool.currentSite === 'string' ? tool.currentSite : '') || paramStoreId || ''}
                        tool={tool}
                        onSuccess={() => window.location.reload()}
                        triggerButton={
                            <Button
                                variant="outline"
                                size="sm"
                                className="h-8 rounded-xl text-xs gap-1.5 shadow-2xs hover:bg-primary/5 hover:border-primary/30 transition-all cursor-pointer font-medium"
                            >
                                <Edit className="size-3.5 text-primary" />
                                Edit Tool
                            </Button>
                        }
                    />
                    <Button
                        variant="outline"
                        size="sm"
                        className="h-8 rounded-xl text-xs gap-1.5 shadow-2xs text-rose-600 border-rose-200 hover:bg-rose-50 dark:hover:bg-rose-950/30 font-medium cursor-pointer"
                        onClick={() => setShowDeleteConfirm(true)}
                    >
                        <Trash2 className="size-3.5 text-rose-500" />
                        Delete Tool
                    </Button>
                    {tool.qrLink && (
                        <Button
                            variant="outline"
                            size="sm"
                            onClick={handleCopyQr}
                            className="h-8 rounded-xl text-xs gap-1.5 shadow-2xs hover:bg-primary/5 hover:border-primary/30 transition-all font-medium cursor-pointer"
                        >
                            {copiedQr ? <Check className="size-3.5 text-emerald-500" /> : <QrCode className="size-3.5 text-primary" />}
                            Copy QR Link
                        </Button>
                    )}
                    {tool.testCertificate && (
                        <a href={tool.testCertificate} target="_blank" rel="noopener noreferrer">
                            <Button
                                variant="outline"
                                size="sm"
                                className="h-8 rounded-xl text-xs gap-1.5 shadow-2xs hover:bg-primary/5 hover:border-primary/30 transition-all font-medium cursor-pointer"
                            >
                                <FileCheck className="size-3.5 text-emerald-500" />
                                Test Certificate
                                <ExternalLink className="size-3" />
                            </Button>
                        </a>
                    )}
                </div>
            </div>

            {/* Single Full View Card Container - Combining Specifications, Procurement & Store Assignment */}
            <Card className="border border-border/60 shadow-md bg-card rounded-2xl overflow-hidden w-full">
                <CardHeader className="py-4 px-6 border-b bg-muted/20 flex flex-row items-center justify-between">
                    <CardTitle className="text-base font-bold tracking-tight uppercase flex items-center gap-2.5 text-foreground">
                        <span className="p-2 rounded-xl bg-primary/10 text-primary">
                            <Wrench className="size-4" />
                        </span>
                        Tool Details & Inventory Profile
                    </CardTitle>
                </CardHeader>

                <CardContent className="p-6 space-y-6">
                    {/* Section 1: Specifications & Technical Attributes */}
                    <div className="space-y-3">
                        <h3 className="text-xs font-bold text-muted-foreground uppercase tracking-wider flex items-center gap-2">
                            <Wrench className="size-3.5 text-primary" />
                            Technical Specifications
                        </h3>
                        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3.5">
                            {isFieldVisible('toolCode') && (
                                <div className="bg-primary/5 border border-primary/20 rounded-xl p-3 flex flex-col justify-between">
                                    <span className="text-[10px] font-bold text-primary uppercase tracking-wider">Tool Code</span>
                                    <span className="text-sm font-extrabold text-primary truncate mt-1">{toolCodeVal}</span>
                                </div>
                            )}

                            {isFieldVisible('makeYear') && (
                                <div className="bg-muted/30 border border-border/40 rounded-xl p-3 flex flex-col justify-between">
                                    <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">Make / Year</span>
                                    <span className="text-sm font-bold text-foreground truncate mt-1">{makeYearVal}</span>
                                </div>
                            )}

                            {isFieldVisible('toolVariant') && (
                                <div className="bg-muted/30 border border-border/40 rounded-xl p-3 flex flex-col justify-between">
                                    <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">Tool Variant</span>
                                    <span className="text-sm font-bold text-foreground truncate mt-1">{toolVariantVal}</span>
                                </div>
                            )}

                            {isFieldVisible('capacity') && (
                                <div className="bg-muted/30 border border-border/40 rounded-xl p-3 flex flex-col justify-between">
                                    <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">Capacity</span>
                                    <span className="text-sm font-bold text-foreground truncate mt-1">{capacityVal}</span>
                                </div>
                            )}

                            {isFieldVisible('safeWorkingLoad') && (
                                <div className="bg-emerald-500/5 border border-emerald-500/20 rounded-xl p-3 flex flex-col justify-between">
                                    <span className="text-[10px] font-bold text-emerald-600 dark:text-emerald-400 uppercase tracking-wider">Safe Working Load</span>
                                    <span className="text-sm font-extrabold text-emerald-700 dark:text-emerald-400 truncate mt-1">{safeWorkingLoadVal}</span>
                                </div>
                            )}

                            <div className="bg-muted/30 border border-border/40 rounded-xl p-3 flex flex-col justify-between">
                                <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">Tool Type</span>
                                <span className="text-sm font-bold text-foreground truncate mt-1">{toolTypeVal}</span>
                            </div>

                            <div className="bg-muted/30 border border-border/40 rounded-xl p-3 flex flex-col justify-between">
                                <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">Metal Type</span>
                                <span className="text-sm font-bold text-foreground truncate mt-1">{metalTypeVal}</span>
                            </div>
                        </div>
                    </div>

                    <hr className="border-border/60" />

                    {/* Section 2: Procurement & Vendor Information */}
                    <div className="space-y-3">
                        <h3 className="text-xs font-bold text-muted-foreground uppercase tracking-wider flex items-center gap-2">
                            <Truck className="size-3.5 text-purple-600 dark:text-purple-400" />
                            Procurement & Vendor Details
                        </h3>
                        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3.5">
                            {isFieldVisible('purchaserName') && (
                                <div className="bg-muted/30 border border-border/40 rounded-xl p-3 flex flex-col justify-between">
                                    <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider flex items-center gap-1">
                                        <UserCircle2 className="size-3 text-primary" /> Purchaser Name
                                    </span>
                                    <span className="text-sm font-bold text-foreground truncate mt-1">{purchaserNameVal}</span>
                                </div>
                            )}

                            {isFieldVisible('supplierCode') && (
                                <div className="bg-muted/30 border border-border/40 rounded-xl p-3 flex flex-col justify-between">
                                    <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">Supplier Code</span>
                                    <span className="text-sm font-bold text-foreground truncate mt-1">{supplierCodeVal}</span>
                                </div>
                            )}

                            {isFieldVisible('purchaserContact') && (
                                <div className="bg-muted/30 border border-border/40 rounded-xl p-3 flex flex-col justify-between">
                                    <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">Purchaser Contact</span>
                                    <span className="text-sm font-bold text-foreground truncate mt-1">{purchaserContactVal}</span>
                                </div>
                            )}

                            {isFieldVisible('dateOfSupply') && (
                                <div className="bg-muted/30 border border-border/40 rounded-xl p-3 flex flex-col justify-between">
                                    <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider flex items-center gap-1">
                                        <Calendar className="size-3 text-primary" /> Date of Supply
                                    </span>
                                    <span className="text-sm font-bold text-foreground truncate mt-1">{dateOfSupplyVal}</span>
                                </div>
                            )}

                            {isFieldVisible('validityPeriod') && (
                                <div className="bg-purple-500/5 border border-purple-500/20 rounded-xl p-3 flex flex-col justify-between">
                                    <span className="text-[10px] font-bold text-purple-700 dark:text-purple-400 uppercase tracking-wider flex items-center gap-1">
                                        <ShieldCheck className="size-3 text-purple-600" /> Validation
                                    </span>
                                    <span className="text-sm font-extrabold text-purple-800 dark:text-purple-300 truncate mt-1">{validityPeriodVal}</span>
                                </div>
                            )}
                        </div>
                    </div>

                    <hr className="border-border/60" />

                    {/* Section 3: Project & Store Allocation */}
                    <div className="space-y-3">
                        <h3 className="text-xs font-bold text-muted-foreground uppercase tracking-wider flex items-center gap-2">
                            <Building2 className="size-3.5 text-amber-600 dark:text-amber-400" />
                            Project & Store Assignment
                        </h3>
                        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3.5">
                            <div className="bg-muted/30 border border-border/40 rounded-xl p-3 flex flex-col justify-between">
                                <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">Project</span>
                                <span className="text-sm font-bold text-foreground truncate mt-1">
                                    {tool.project?.name || '-'} {tool.project?.code ? `(${tool.project.code})` : ''}
                                </span>
                            </div>

                            <div className="bg-amber-500/5 border border-amber-500/20 rounded-xl p-3 flex flex-col justify-between">
                                <span className="text-[10px] font-bold text-amber-700 dark:text-amber-400 uppercase tracking-wider flex items-center gap-1">
                                    <MapPin className="size-3" /> Assigned Store
                                </span>
                                <span className="text-sm font-extrabold text-amber-800 dark:text-amber-300 truncate mt-1">
                                    {tool.currentSite?.name || '-'}
                                </span>
                            </div>

                            {isFieldVisible('jobCode') && (
                                <div className="bg-muted/30 border border-border/40 rounded-xl p-3 flex flex-col justify-between">
                                    <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">Job Code</span>
                                    <span className="text-sm font-bold text-foreground truncate mt-1">{jobCodeVal}</span>
                                </div>
                            )}

                            {isFieldVisible('jobDescription') && (
                                <div className="bg-muted/30 border border-border/40 rounded-xl p-3 flex flex-col justify-between">
                                    <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">Job Description</span>
                                    <span className="text-xs font-semibold text-foreground/90 truncate mt-1">{jobDescriptionVal}</span>
                                </div>
                            )}

                            {subName && (
                                <div className="col-span-2 bg-muted/40 border border-border/50 rounded-xl p-3 flex items-center justify-between">
                                    <span className="text-[10px] font-bold text-muted-foreground uppercase">Subcontractor:</span>
                                    <span className="text-xs font-semibold text-foreground">{subName} ({subCode || '-'})</span>
                                </div>
                            )}
                        </div>
                    </div>
                </CardContent>
            </Card>

            <AlertDialog open={showDeleteConfirm} onOpenChange={(open) => !deleting && setShowDeleteConfirm(open)}>
                <AlertDialogContent className="rounded-2xl max-w-md">
                    <AlertDialogHeader>
                        <AlertDialogTitle className="flex items-center gap-2 text-xl font-bold text-rose-600">
                            <Trash2 className="size-6 text-rose-500" />
                            <span>Confirm Tool Deletion</span>
                        </AlertDialogTitle>
                        <AlertDialogDescription className="text-sm text-muted-foreground pt-2">
                            Are you sure you want to delete tool <strong className="font-mono text-foreground">{tool.toolId}</strong> ({tool.description})? It will be moved to the Trash section and can be restored later.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter className="gap-2 sm:gap-0 pt-4 border-t mt-4">
                        <AlertDialogCancel disabled={deleting} className="rounded-xl">
                            Cancel
                        </AlertDialogCancel>
                        <AlertDialogAction
                            disabled={deleting}
                            onClick={confirmDelete}
                            className="rounded-xl bg-rose-600 hover:bg-rose-700 text-white"
                        >
                            {deleting ? (
                                <Loader2 className="size-4 animate-spin mr-1.5" />
                            ) : null}
                            Delete
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </div>
    );
}
