import { useState, useEffect, useMemo } from "react";
import { useParams, useNavigate, useLocation, useSearchParams } from "react-router-dom";
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
    ClipboardCheck,
} from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
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
import { ToolInspectionModal } from "./ToolInspectionModal";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export function ToolDetailsPage() {
    const { storeId: paramStoreId, toolId } = useParams();
    const navigate = useNavigate();
    const location = useLocation();
    const [searchParams] = useSearchParams();
    const { user } = useAuth();
    const isAdmin = user?.role === "Admin";
    const canInspect = Boolean(user && (user.role === 'Admin' || user.hasInspectionAccess));

    const [isInspectionModalOpen, setIsInspectionModalOpen] = useState(false);

    const queryStoreId = searchParams.get('storeId');
    const queryProjectId = searchParams.get('projectId');

    const effectiveStoreId = paramStoreId || queryStoreId || (location.state as any)?.fromStoreId || (location.state as any)?.storeId;
    const effectiveProjectId = queryProjectId || (location.state as any)?.projectId || (location.state as any)?.fromProjectId;

    const [tool, setTool] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [viewSchema, setViewSchema] = useState<any>(null);
    const [copiedId, setCopiedId] = useState(false);
    const [copiedQr, setCopiedQr] = useState(false);

    const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
    const [deleting, setDeleting] = useState(false);

    const isToolDeletable = useMemo(() => {
        const s = (tool?.status || "").trim().toLowerCase();
        return s === "available" || s === "missing";
    }, [tool?.status]);

    const isMoving = useMemo(() => {
        return (tool?.status || "").trim().toLowerCase() === "moving";
    }, [tool?.status]);

    const isMissing = useMemo(() => {
        return (tool?.status || "").trim().toLowerCase() === "missing";
    }, [tool?.status]);

    const confirmDelete = async () => {
        if (!tool?._id) return;
        if (tool.isPrinted) {
            toast.error("Printed tools cannot be deleted. Only unprinted tools can be moved to Trash.");
            return;
        }
        setDeleting(true);
        try {
            const res = await toolService.deleteTool(tool._id);
            if (res.success) {
                toast.success(res.message || "Tool soft-deleted to Trash successfully");
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
                    toolService.getToolById(toolId || '', effectiveStoreId, effectiveProjectId),
                    formService.getFormBySlug('tool-details-view')
                ]);

                if (toolRes.status === 'fulfilled' && toolRes.value.success && toolRes.value.data) {
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
    }, [toolId, effectiveStoreId, effectiveProjectId]);

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
                    <span className={`shrink-0 inline-flex items-center rounded-full border px-3 py-1 text-xs font-semibold transition-colors shadow-2xs ${tool.status === 'Available' ? 'bg-emerald-500/15 text-emerald-700 dark:text-emerald-400 border-emerald-500/30' :
                            tool.status === 'Repair' ? 'bg-orange-500/15 text-orange-700 dark:text-orange-400 border-orange-500/30 font-bold' :
                                tool.status === 'Moving' ? 'bg-indigo-500/15 text-indigo-700 dark:text-indigo-400 border-indigo-500/30 animate-pulse' :
                                    tool.status === 'In Use' ? 'bg-blue-500/15 text-blue-700 dark:text-blue-400 border-blue-500/30' :
                                        'bg-rose-500/15 text-rose-700 dark:text-rose-400 border-rose-500/30'
                        }`}>
                        {tool.status === 'Available' ? <CheckCircle2 className="size-3.5 mr-1.5" /> :
                            tool.status === 'Repair' ? <Wrench className="size-3.5 mr-1.5" /> :
                                <XCircle className="size-3.5 mr-1.5" />}
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
                    {/* Quality Inspection: Hidden if Moving or Missing */}
                    {!isMoving && !isMissing && canInspect && (
                        <Button
                            variant="outline"
                            size="sm"
                            disabled={tool.status === 'Repair' || tool.status === 'Moving' || tool.status === 'Scrapped'}
                            className="h-8 rounded-xl text-xs gap-1.5 shadow-2xs text-emerald-700 border-emerald-300 dark:border-emerald-800 hover:bg-emerald-50 dark:hover:bg-emerald-950/30 transition-all font-semibold cursor-pointer"
                            onClick={() => setIsInspectionModalOpen(true)}
                            title={
                                tool.status === 'Repair'
                                    ? "Inspection blocked: Tool is currently under Repair"
                                    : tool.status === 'Moving'
                                        ? "Inspection blocked: Tool is currently Moving"
                                        : tool.status === 'Scrapped'
                                            ? "Inspection blocked: Tool is already Scrapped"
                                            : "Inspect Tool (Pass / Fail)"
                            }
                        >
                            <ClipboardCheck className="size-3.5 text-emerald-600" />
                            Inspect Tool
                        </Button>
                    )}
                    {/* Edit Tool: Hidden if Moving or Missing */}
                    {isAdmin && !isMoving && !isMissing && (
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
                    )}
                    {/* Delete Tool: Hidden if Moving; If Missing, ONLY Delete option is shown */}
                    {isAdmin && !isMoving && (isMissing || isToolDeletable) && (
                        <Button
                            variant="outline"
                            size="sm"
                            disabled={!isToolDeletable}
                            className={`h-8 rounded-xl text-xs gap-1.5 shadow-2xs font-medium ${isToolDeletable
                                    ? "text-rose-600 border-rose-200 hover:bg-rose-50 dark:hover:bg-rose-950/30 cursor-pointer"
                                    : "text-slate-400 border-border bg-muted/40 cursor-not-allowed opacity-50"
                                }`}
                            onClick={() => {
                                if (!isToolDeletable) {
                                    toast.error(`Cannot delete tool with status "${tool.status}". Only Available and Missing tools can be deleted.`);
                                    return;
                                }
                                setShowDeleteConfirm(true);
                            }}
                            title={isToolDeletable ? "Delete Tool" : `Cannot delete tool with status "${tool?.status}". Only Available and Missing tools can be deleted.`}
                        >
                            <Trash2 className="size-3.5 text-rose-500" />
                            Delete Tool
                        </Button>
                    )}
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

                    {/* Section 4: Quality Inspection & Audit Records */}
                    {(tool.inspectionResult || (tool.inspectionHistory && tool.inspectionHistory.length > 0)) && (
                        <div className="space-y-3 pt-4 border-t border-border/50">
                            <h3 className="text-xs font-bold text-muted-foreground uppercase tracking-wider flex items-center gap-2">
                                <ClipboardCheck className="size-3.5 text-primary" />
                                Quality Inspection & Audit Records
                            </h3>
                            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
                                <div className="bg-muted/30 border border-border/40 rounded-xl p-3 flex flex-col justify-between">
                                    <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">Latest Inspection</span>
                                    <span className="text-sm font-bold mt-1">
                                        <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold ${tool.inspectionResult === 'Pass'
                                                ? 'bg-emerald-500/15 text-emerald-700 dark:text-emerald-400'
                                                : 'bg-rose-500/15 text-rose-700 dark:text-rose-400'
                                            }`}>
                                            {tool.inspectionResult}
                                        </span>
                                    </span>
                                </div>
                                <div className="bg-muted/30 border border-border/40 rounded-xl p-3 flex flex-col justify-between">
                                    <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">Action Taken</span>
                                    <span className="text-xs font-bold text-foreground mt-1">
                                        {tool.inspectionAction || (tool.status === 'Repair' ? 'Repair' : tool.status === 'Scrapped' ? 'Scrap' : 'Validated')}
                                    </span>
                                </div>
                                <div className="bg-muted/30 border border-border/40 rounded-xl p-3 flex flex-col justify-between">
                                    <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">Inspected Date</span>
                                    <span className="text-xs font-semibold text-foreground/90 mt-1">
                                        {tool.inspectedAt ? new Date(tool.inspectedAt).toLocaleDateString() : (tool.lastInspectionDate ? new Date(tool.lastInspectionDate).toLocaleDateString() : '-')}
                                    </span>
                                </div>
                                <div className="bg-muted/30 border border-border/40 rounded-xl p-3 flex flex-col justify-between">
                                    <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">Inspected By</span>
                                    <span className="text-xs font-semibold text-foreground/90 truncate mt-1">
                                        {typeof tool.inspectedBy === 'object' ? (tool.inspectedBy?.username || tool.inspectedBy?.name) : (tool.inspectedBy || '-')}
                                    </span>
                                </div>
                            </div>

                            {/* Inspection Audit Trail Table */}
                            {tool.inspectionHistory && tool.inspectionHistory.length > 0 && (
                                <div className="mt-3 overflow-x-auto rounded-xl border border-border/40">
                                    <table className="min-w-full text-xs text-left">
                                        <thead className="bg-muted/50 font-semibold text-muted-foreground border-b border-border/40">
                                            <tr>
                                                <th className="px-3 py-2">Date</th>
                                                <th className="px-3 py-2">Result</th>
                                                <th className="px-3 py-2">Action</th>
                                                <th className="px-3 py-2">Validation</th>
                                                <th className="px-3 py-2">Inspector</th>
                                                <th className="px-3 py-2">Remarks</th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-border/30">
                                            {tool.inspectionHistory.map((item: any, idx: number) => (
                                                <tr key={idx} className="hover:bg-muted/20">
                                                    <td className="px-3 py-2 whitespace-nowrap">
                                                        {item.inspectedAt ? new Date(item.inspectedAt).toLocaleDateString() : '-'}
                                                    </td>
                                                    <td className="px-3 py-2">
                                                        <span className={`inline-flex px-2 py-0.5 rounded text-[11px] font-semibold ${item.result === 'Pass' ? 'bg-emerald-500/10 text-emerald-600' : 'bg-rose-500/10 text-rose-600'
                                                            }`}>
                                                            {item.result}
                                                        </span>
                                                    </td>
                                                    <td className="px-3 py-2">{item.action || '-'}</td>
                                                    <td className="px-3 py-2">{item.validation || '-'}</td>
                                                    <td className="px-3 py-2">{item.inspectedByName || (typeof item.inspectedBy === 'object' ? item.inspectedBy?.username : item.inspectedBy) || '-'}</td>
                                                    <td className="px-3 py-2 text-muted-foreground">{item.remarks || '-'}</td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            )}
                        </div>
                    )}
                </CardContent>
            </Card>

            <ToolInspectionModal
                open={isInspectionModalOpen}
                onOpenChange={setIsInspectionModalOpen}
                selectedTools={tool ? [tool] : []}
                onSuccess={() => {
                    window.location.reload();
                }}
            />

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
