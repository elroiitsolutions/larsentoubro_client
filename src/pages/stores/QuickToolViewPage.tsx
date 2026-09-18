import { useState, useEffect } from "react";
import { useParams, useNavigate, useLocation } from "react-router-dom";
import toolService from "@/services/tool.service";
import formService from "@/services/form.service";
import { StoreToolsPage } from "./StoreToolsPage";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";
import {
    Loader2,
    X,
    Tag,
    Trash2
} from "lucide-react";
import { Button } from "@/components/ui/button";
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

export function QuickToolViewPage() {
    const { toolId } = useParams();
    const navigate = useNavigate();
    const location = useLocation();
    const { user } = useAuth();
    const isAdmin = user?.role === "Admin";

    const initialTool = (location.state as any)?.initialTool;
    const isModalOnly = Boolean((location.state as any)?.backgroundLocation);

    const [tool, setTool] = useState<any>(initialTool || null);
    const [loading, setLoading] = useState(!initialTool);
    const [viewSchema, setViewSchema] = useState<any>(null);
    const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
    const [deleting, setDeleting] = useState(false);

    const fromStoreId = (location.state as any)?.fromStoreId || tool?.currentSite?._id || (typeof tool?.currentSite === 'string' ? tool?.currentSite : undefined);

    const handleClose = () => {
        if (fromStoreId && typeof fromStoreId === 'string') {
            navigate(`/stores/${fromStoreId}/tools`);
        } else {
            navigate(-1);
        }
    };

    const confirmDelete = async () => {
        if (!tool?._id) return;
        setDeleting(true);
        try {
            const res = await toolService.deleteTool(tool._id);
            if (res.success) {
                toast.success(res.message || "Tool soft-deleted successfully");
                handleClose();
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
        const fetchQuickToolData = async () => {
            try {
                const [toolRes, schemaRes] = await Promise.allSettled([
                    toolService.getToolById(toolId || ''),
                    formService.getFormBySlug('tool-quick-view')
                ]);

                if (toolRes.status === 'fulfilled' && toolRes.value.success) {
                    setTool(toolRes.value.data);
                } else if (!initialTool) {
                    toast.error("Failed to fetch tool information");
                }

                if (schemaRes.status === 'fulfilled' && schemaRes.value.success && schemaRes.value.data) {
                    setViewSchema(schemaRes.value.data);
                }
            } catch (error: any) {
                console.error("Error loading quick tool module data:", error);
                if (!initialTool) toast.error("Error loading tool information");
            } finally {
                setLoading(false);
            }
        };

        if (toolId) {
            fetchQuickToolData();
        }
    }, [toolId]);

    // Helper to check if field is visible per Admin settings
    const isFieldVisible = (fieldName: string) => {
        if (!viewSchema?.fields || viewSchema.fields.length === 0) return true;
        const target = viewSchema.fields.find((f: any) => f.name === fieldName || f.id === fieldName);
        if (!target) return true;
        return !target.disabled;
    };

    // Helper to search values across root and customFields
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
            if (typeof cf.get === 'function') {
                for (const k of keysToTry) {
                    const val = cf.get(k);
                    if (val !== undefined && val !== null && val !== '') return val;
                }
            } else if (typeof cf === 'object') {
                for (const k of keysToTry) {
                    if (cf[k] !== undefined && cf[k] !== null && cf[k] !== '') return cf[k];
                }
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

    // const handleGoToFullDetails = () => {
    //     if (tool?.toolId) {
    //         const storeIdVal = fromStoreId || tool.currentSite?._id || tool.currentSite;
    //         const projId = (location.state as any)?.projectId || (tool?.project?._id || tool?.project);
    //         const detailsBreadcrumbs = [
    //             { label: 'Projects', href: '/projects' },
    //             { label: 'Stores', href: projId ? `/projects/${projId}/stores` : '/projects' },
    //             { label: 'Tools', href: storeIdVal ? `/stores/${storeIdVal}/tools` : '/projects' },
    //             { label: `Tool Details (${tool.toolId})`, href: `/tooldetails/${encodeURIComponent(tool.toolId)}` }
    //         ];
    //         navigate(`/tooldetails/${encodeURIComponent(tool.toolId)}`, {
    //             state: {
    //                 fromStoreId: storeIdVal,
    //                 breadcrumbs: detailsBreadcrumbs
    //             }
    //         });
    //     }
    // };

    const isAvailable = tool?.status === 'Available' || tool?.status === 'Usable';
    const isMoving = tool?.status === 'Moving' || tool?.status === 'In Use';

    // Helper to calculate expiration date dynamically
    const getValidUntilDate = (supplyDateStr: string, validityStr: string) => {
        if (!supplyDateStr || supplyDateStr === '-' || !validityStr || validityStr === '-') return '-';
        
        let date = new Date(supplyDateStr);
        if (isNaN(date.getTime()) && supplyDateStr.includes('/')) {
            const parts = supplyDateStr.split('/');
            if (parts.length === 3) {
                date = new Date(`${parts[2]}-${parts[1]}-${parts[0]}`);
                if (isNaN(date.getTime())) {
                    date = new Date(`${parts[2]}-${parts[0]}-${parts[1]}`);
                }
            }
        }
        
        if (isNaN(date.getTime())) return '-';
        
        const yearsMatch = validityStr.match(/(\d+)/);
        if (!yearsMatch) return '-';
        
        const years = parseInt(yearsMatch[1], 10);
        date.setFullYear(date.getFullYear() + years);
        return date.toLocaleDateString();
    };

    // Helper to format spec values cleanly
    const formatSpecValue = (val: any) => {
        if (!val || val === '-') return '-';
        let str = String(val).replace(/^(capacity|swl|safe working load):\s*/i, '').trim();
        if (/^(\d\s+)+\d$/.test(str)) {
            str = str.replace(/\s+/g, '');
        } else {
            str = str.replace(/\s+/g, ' ');
        }
        return str;
    };

    // Extracted Field Values
    const toolIdVal = tool?.toolId || getFieldValue('toolCode', ['tool_code', 'Tool Code', 'tag', 'Tag']) || '-';
    const makeYearVal = getFieldValue('makeYear', ['make_year', 'Make Year', 'year']) || '-';
    const capacityVal = getFieldValue('capacity') || '-';
    const safeWorkingLoadVal = getFieldValue('safeWorkingLoad') || '-';
    const toolVariantVal = getFieldValue('toolVariant', ['tool_variant', 'variant', 'Tool Variant']) || '-';
    const toolTypeVal = getFieldValue('toolType', ['tool_type', 'toolCategory', 'category', 'Tool Category']) || '-';
    const metalTypeVal = getFieldValue('metalType', ['metal_type', 'material', 'Material']) || '-';
    
    const purchaserNameVal = getFieldValue('purchaserName') || '-';
    const supplierCodeVal = getFieldValue('supplierCode') || '-';
    const purchaserContactVal = getFieldValue('purchaserContact') || '-';
    
    const dateOfSupplyVal = getFieldValue('dateOfSupply') || '-';
    const rawValidity = getFieldValue('validityPeriod');
    const resolvedValidity = (rawValidity && rawValidity !== 'N/A')
        ? rawValidity
        : (tool?.customFields?.validation || tool?.customFields?.validityPeriod || rawValidity);
    const validityPeriodVal = resolvedValidity ? (String(resolvedValidity).toLowerCase().includes('year') ? resolvedValidity : `${resolvedValidity} Years`) : '-';
    const validUntilVal = getValidUntilDate(dateOfSupplyVal, validityPeriodVal);

    const jobCodeVal = getFieldValue('jobCode') || '-';
    const jobDescriptionVal = getFieldValue('jobDescription', ['job_description']) || '-';

    const currentSiteVal = tool?.currentSite?.name || tool?.currentSite?.storeName || (typeof tool?.currentSite === 'string' ? tool?.currentSite : getFieldValue('currentSite', ['store', 'storeName']));
    const projectVal = tool?.project?.name || tool?.project?.projectName || (typeof tool?.project === 'string' ? tool?.project : getFieldValue('project', ['projectName', 'site']));
    const subcontractorVal = getFieldValue('subcontractorName', ['subcontractor_name', 'subcontractor', 'subContractor']);

    const lastInspectionDateVal = tool?.lastInspectionDate
        ? new Date(tool.lastInspectionDate).toLocaleDateString()
        : '-';

    const modalContent = (
        <div 
            className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-3 animate-in fade-in-0 duration-200"
            onClick={handleClose}
        >
            {/* Modal Card Container - Non-Scrollable */}
            <div 
                onClick={(e) => e.stopPropagation()}
                className="w-full max-w-md bg-background border border-border/80 shadow-2xl rounded-3xl p-5 relative animate-in zoom-in-95 duration-200 overflow-hidden text-left space-y-3"
            >
                {/* Close Button */}
                <button
                    type="button"
                    onClick={handleClose}
                    className="absolute right-4 top-4 rounded-full p-1.5 text-muted-foreground hover:text-foreground hover:bg-muted/80 transition-all cursor-pointer z-10"
                >
                    <X className="size-4" />
                </button>

                {loading ? (
                    <div className="flex flex-col items-center justify-center py-10 gap-2">
                        <Loader2 className="size-6 animate-spin text-primary" />
                        <p className="text-xs text-muted-foreground font-semibold">Loading Tool Information...</p>
                    </div>
                ) : !tool ? (
                    <div className="flex flex-col items-center justify-center py-8 gap-2">
                        <p className="text-muted-foreground text-sm font-semibold">Tool information not found</p>
                        <Button variant="outline" size="sm" onClick={handleClose} className="rounded-xl cursor-pointer">
                            Close
                        </Button>
                    </div>
                ) : (
                    <div className="space-y-3">
                        {/* Header: Title & Badges */}
                        <div className="space-y-1.5 pr-6">
                            {isFieldVisible('description') && (
                                <h2 className="text-base sm:text-lg font-black tracking-tight text-foreground leading-snug break-words">
                                    {tool.description}
                                </h2>
                            )}

                            <div className="flex flex-wrap items-center gap-1.5">
                                {/* Tool Code Badge */}
                                {isFieldVisible('toolCode') && toolIdVal !== '-' && (
                                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-lg bg-primary/10 text-primary border border-primary/20 font-mono text-[11px] font-bold">
                                        <Tag className="size-3" />
                                        <span>{toolIdVal}</span>
                                    </span>
                                )}

                                {/* Status Pill Badge */}
                                <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-lg text-[11px] font-bold border ${
                                    isAvailable 
                                        ? 'bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/60 dark:text-emerald-300 dark:border-emerald-800' 
                                        : isMoving 
                                        ? 'bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-950/60 dark:text-amber-300 dark:border-amber-800'
                                        : 'bg-rose-50 text-rose-700 border-rose-200 dark:bg-rose-950/60 dark:text-rose-300 dark:border-rose-800'
                                }`}>
                                    <span className={`size-1.5 rounded-full ${
                                        isAvailable ? 'bg-emerald-500 animate-pulse' : isMoving ? 'bg-amber-500' : 'bg-rose-500'
                                    }`} />
                                    <span>{tool.status || 'Usable'}</span>
                                </span>
                            </div>
                        </div>

                        {/* Specs Section: Compact 3-Column Grid */}
                        {(isFieldVisible('makeYear') || isFieldVisible('capacity') || isFieldVisible('safeWorkingLoad') || isFieldVisible('toolVariant') || isFieldVisible('toolType') || isFieldVisible('metalType')) && (
                            <div className="bg-muted/40 dark:bg-muted/20 border border-border/50 rounded-2xl p-2.5 grid grid-cols-3 gap-2 text-[11px]">
                                {isFieldVisible('makeYear') && makeYearVal !== '-' && (
                                    <div>
                                        <span className="text-[9px] font-bold uppercase tracking-wider text-muted-foreground block">Make / Year</span>
                                        <span className="font-bold text-foreground block truncate">{makeYearVal}</span>
                                    </div>
                                )}
                                {isFieldVisible('capacity') && capacityVal !== '-' && (
                                    <div>
                                        <span className="text-[9px] font-bold uppercase tracking-wider text-muted-foreground block">Capacity</span>
                                        <span className="font-bold text-foreground block truncate">{formatSpecValue(capacityVal)}</span>
                                    </div>
                                )}
                                {isFieldVisible('safeWorkingLoad') && safeWorkingLoadVal !== '-' && (
                                    <div>
                                        <span className="text-[9px] font-bold uppercase tracking-wider text-muted-foreground block">SWL</span>
                                        <span className="font-bold text-foreground block truncate">{formatSpecValue(safeWorkingLoadVal)}</span>
                                    </div>
                                )}
                                {isFieldVisible('toolVariant') && toolVariantVal !== '-' && (
                                    <div>
                                        <span className="text-[9px] font-bold uppercase tracking-wider text-muted-foreground block">Variant</span>
                                        <span className="font-bold text-foreground block truncate">{toolVariantVal}</span>
                                    </div>
                                )}
                                {isFieldVisible('toolType') && toolTypeVal !== '-' && (
                                    <div>
                                        <span className="text-[9px] font-bold uppercase tracking-wider text-muted-foreground block">Category</span>
                                        <span className="font-bold text-foreground block truncate">{toolTypeVal}</span>
                                    </div>
                                )}
                                {isFieldVisible('metalType') && metalTypeVal !== '-' && (
                                    <div>
                                        <span className="text-[9px] font-bold uppercase tracking-wider text-muted-foreground block">Material</span>
                                        <span className="font-bold text-foreground block truncate">{metalTypeVal}</span>
                                    </div>
                                )}
                            </div>
                        )}

                        {/* Supplier & Dates (Compact 2-Column) */}
                        {(isFieldVisible('purchaserName') || isFieldVisible('supplierCode') || isFieldVisible('purchaserContact') || isFieldVisible('dateOfSupply') || isFieldVisible('validityPeriod')) && (
                            <div className="grid grid-cols-2 gap-x-3 gap-y-2 text-[11px]">
                                {isFieldVisible('purchaserName') && purchaserNameVal !== '-' && (
                                    <div>
                                        <span className="text-[9px] font-bold uppercase tracking-wider text-muted-foreground block">Supplier Name</span>
                                        <span className="font-bold text-foreground block truncate">{purchaserNameVal}</span>
                                    </div>
                                )}
                                {isFieldVisible('dateOfSupply') && dateOfSupplyVal !== '-' && (
                                    <div>
                                        <span className="text-[9px] font-bold uppercase tracking-wider text-muted-foreground block">Date of Receipt</span>
                                        <span className="font-bold text-foreground block truncate">{dateOfSupplyVal}</span>
                                    </div>
                                )}
                                {isFieldVisible('supplierCode') && supplierCodeVal !== '-' && (
                                    <div>
                                        <span className="text-[9px] font-bold uppercase tracking-wider text-muted-foreground block">Supplier Code</span>
                                        <span className="font-bold text-foreground block truncate">{supplierCodeVal}</span>
                                    </div>
                                )}
                                {isFieldVisible('validityPeriod') && validityPeriodVal !== '-' && (
                                    <div>
                                        <span className="text-[9px] font-bold uppercase tracking-wider text-muted-foreground block">Validation Period</span>
                                        <span className="font-bold text-foreground block truncate">{validityPeriodVal}</span>
                                    </div>
                                )}
                                {isFieldVisible('purchaserContact') && purchaserContactVal !== '-' && (
                                    <div>
                                        <span className="text-[9px] font-bold uppercase tracking-wider text-muted-foreground block">Supplier Contact</span>
                                        <span className="font-bold text-foreground block truncate">{purchaserContactVal}</span>
                                    </div>
                                )}
                                {isFieldVisible('validityPeriod') && validUntilVal !== '-' && (
                                    <div>
                                        <span className="text-[9px] font-bold uppercase tracking-wider text-muted-foreground block">Valid Until</span>
                                        <span className="font-bold text-foreground block truncate">{validUntilVal}</span>
                                    </div>
                                )}
                                <div>
                                    <span className="text-[9px] font-bold uppercase tracking-wider text-muted-foreground block">Last Inspection</span>
                                    <span className="font-bold text-foreground block truncate">{lastInspectionDateVal}</span>
                                </div>
                            </div>
                        )}

                        {/* Divider */}
                        {(isFieldVisible('jobCode') || isFieldVisible('jobDescription') || isFieldVisible('currentSite') || isFieldVisible('project') || isFieldVisible('subcontractorName')) && (
                            <div className="border-t border-border/50" />
                        )}

                        {/* Job & Allocation Details (Compact 2-Column) */}
                        {(isFieldVisible('jobCode') || isFieldVisible('jobDescription') || isFieldVisible('currentSite') || isFieldVisible('project') || isFieldVisible('subcontractorName')) && (
                            <div className="grid grid-cols-2 gap-x-3 gap-y-2 text-[11px]">
                                {isFieldVisible('jobCode') && jobCodeVal !== '-' && (
                                    <div>
                                        <span className="text-[9px] font-bold uppercase tracking-wider text-muted-foreground block">Job Code</span>
                                        <span className="font-bold text-foreground block truncate">{jobCodeVal}</span>
                                    </div>
                                )}
                                {isFieldVisible('jobDescription') && jobDescriptionVal !== '-' && (
                                    <div>
                                        <span className="text-[9px] font-bold uppercase tracking-wider text-muted-foreground block">Job Description</span>
                                        <span className="font-bold text-foreground block truncate" title={jobDescriptionVal}>{jobDescriptionVal}</span>
                                    </div>
                                )}
                                {isFieldVisible('currentSite') && currentSiteVal && currentSiteVal !== '-' && (
                                    <div>
                                        <span className="text-[9px] font-bold uppercase tracking-wider text-muted-foreground block">Assigned Store</span>
                                        <span className="font-bold text-foreground block truncate">{currentSiteVal}</span>
                                    </div>
                                )}
                                {isFieldVisible('project') && projectVal && projectVal !== '-' && (
                                    <div>
                                        <span className="text-[9px] font-bold uppercase tracking-wider text-muted-foreground block">Assigned Project</span>
                                        <span className="font-bold text-foreground block truncate">{projectVal}</span>
                                    </div>
                                )}
                                {isFieldVisible('subcontractorName') && subcontractorVal && subcontractorVal !== '-' && (
                                    <div className="col-span-2">
                                        <span className="text-[9px] font-bold uppercase tracking-wider text-muted-foreground block">Subcontractor</span>
                                        <span className="font-bold text-foreground block truncate">{subcontractorVal}</span>
                                    </div>
                                )}
                            </div>
                        )}

                        {/* Action Buttons */}
                        {isAdmin && (
                            <div className="pt-2">
                                <Button
                                    variant="outline"
                                    size="sm"
                                    className="w-full rounded-xl h-9 font-bold gap-2 text-xs text-rose-600 hover:text-rose-700 hover:bg-rose-50 dark:hover:bg-rose-950/30 border-rose-200 cursor-pointer"
                                    onClick={() => setShowDeleteConfirm(true)}
                                >
                                    <Trash2 className="size-3.5" />
                                    <span>Delete Tool</span>
                                </Button>
                            </div>
                        )}
                    </div>
                )}
            </div>

            <AlertDialog open={showDeleteConfirm} onOpenChange={(open) => !deleting && setShowDeleteConfirm(open)}>
                <AlertDialogContent className="rounded-2xl max-w-md">
                    <AlertDialogHeader>
                        <AlertDialogTitle className="flex items-center gap-2 text-xl font-bold text-rose-600">
                            <Trash2 className="size-6 text-rose-500" />
                            <span>Confirm Tool Deletion</span>
                        </AlertDialogTitle>
                        <AlertDialogDescription className="text-sm text-muted-foreground pt-2">
                            Are you sure you want to delete tool <strong className="font-mono text-foreground">{toolIdVal}</strong>? It will be moved to the Trash section and can be restored later.
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

    // If modal rendered over existing mounted table (in-app click), render ONLY modalContent
    if (isModalOnly) {
        return modalContent;
    }

    // Direct URL visit: render background tools table AND foreground modal content
    return (
        <div className="relative w-full h-full">
            {fromStoreId && <StoreToolsPage overrideStoreId={fromStoreId} />}
            {modalContent}
        </div>
    );
}

