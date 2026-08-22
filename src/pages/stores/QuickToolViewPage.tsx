import { useState, useEffect } from "react";
import { useParams, useNavigate, useLocation } from "react-router-dom";
import toolService from "@/services/tool.service";
import formService from "@/services/form.service";
import { StoreToolsPage } from "./StoreToolsPage";
import { toast } from "sonner";
import {
    Loader2,
    ExternalLink,
    X
} from "lucide-react";
import { Button } from "@/components/ui/button";

export function QuickToolViewPage() {
    const { toolId } = useParams();
    const navigate = useNavigate();
    const location = useLocation();

    const initialTool = (location.state as any)?.initialTool;
    const isModalOnly = Boolean((location.state as any)?.backgroundLocation);

    const [tool, setTool] = useState<any>(initialTool || null);
    const [loading, setLoading] = useState(!initialTool);
    const [viewSchema, setViewSchema] = useState<any>(null);

    const fromStoreId = (location.state as any)?.fromStoreId || tool?.currentSite?._id || (typeof tool?.currentSite === 'string' ? tool?.currentSite : undefined);

    const handleClose = () => {
        if (fromStoreId && typeof fromStoreId === 'string') {
            navigate(`/stores/${fromStoreId}/tools`);
        } else {
            navigate(-1);
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

    const handleGoToFullDetails = () => {
        if (tool?.toolId) {
            const storeIdVal = fromStoreId || tool.currentSite?._id || tool.currentSite;
            const projId = (location.state as any)?.projectId || (tool?.project?._id || tool?.project);
            const detailsBreadcrumbs = [
                { label: 'Projects', href: '/projects' },
                { label: 'Stores', href: projId ? `/projects/${projId}/stores` : '/projects' },
                { label: 'Tools', href: storeIdVal ? `/stores/${storeIdVal}/tools` : '/projects' },
                { label: `Tool Details (${tool.toolId})`, href: `/tooldetails/${encodeURIComponent(tool.toolId)}` }
            ];
            navigate(`/tooldetails/${encodeURIComponent(tool.toolId)}`, {
                state: {
                    fromStoreId: storeIdVal,
                    breadcrumbs: detailsBreadcrumbs
                }
            });
        }
    };

    const isAvailable = tool?.status === 'Available' || tool?.status === 'Usable';
    const isMoving = tool?.status === 'Moving' || tool?.status === 'In Use';

    // Helper to calculate expiration date dynamically
    const getValidUntilDate = (supplyDateStr: string, validityStr: string) => {
        if (!supplyDateStr || supplyDateStr === '-' || !validityStr || validityStr === '-') return '-';
        
        let date = new Date(supplyDateStr);
        if (isNaN(date.getTime()) && supplyDateStr.includes('/')) {
            const parts = supplyDateStr.split('/');
            if (parts.length === 3) {
                // Try DD/MM/YYYY
                date = new Date(`${parts[2]}-${parts[1]}-${parts[0]}`);
                if (isNaN(date.getTime())) {
                    // Try MM/DD/YYYY
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

    // Extracted Field Values
    const toolCodeVal = getFieldValue('toolCode', ['tool_code', 'Tool Code', 'tag', 'Tag']) || tool?.toolId || '-';
    const makeYearVal = getFieldValue('makeYear', ['make_year', 'Make Year', 'year']) || '-';
    const capacityVal = getFieldValue('capacity') || '-';
    const safeWorkingLoadVal = getFieldValue('safeWorkingLoad') || '-';
    
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

    const lastInspectionDateVal = tool?.lastInspectionDate
        ? new Date(tool.lastInspectionDate).toLocaleDateString()
        : '-';

    const modalContent = (
        <div 
            className="fixed inset-0 z-50 bg-black/40 backdrop-blur-md flex items-center justify-center p-4 animate-in fade-in-0 duration-200"
            onClick={handleClose}
        >
            {/* Modal Card Container */}
            <div 
                onClick={(e) => e.stopPropagation()}
                className="w-full max-w-md bg-background border border-border/80 shadow-2xl rounded-3xl p-6 relative animate-in zoom-in-95 duration-200 overflow-hidden text-left space-y-4"
            >
                {/* Close Button */}
                <button
                    type="button"
                    onClick={handleClose}
                    className="absolute right-4 top-4 rounded-full p-1.5 text-muted-foreground hover:text-foreground hover:bg-muted/60 transition-colors cursor-pointer z-10"
                >
                    <X className="size-4" />
                </button>

                {loading ? (
                    <div className="flex flex-col items-center justify-center py-12 gap-3">
                        <Loader2 className="size-8 animate-spin text-primary" />
                        <p className="text-xs text-muted-foreground font-semibold">Loading Quick Tool Module...</p>
                    </div>
                ) : !tool ? (
                    <div className="flex flex-col items-center justify-center py-8 gap-3">
                        <p className="text-muted-foreground text-sm font-semibold">Tool information not found</p>
                        <Button variant="outline" size="sm" onClick={handleClose} className="rounded-xl cursor-pointer">
                            Close
                        </Button>
                    </div>
                ) : (
                    <>
                        {/* Header: Title, Tag, Subtitle */}
                        <div className="flex items-start justify-between gap-3 pr-6">
                            <div className="space-y-1.5 min-w-0">
                                {isFieldVisible('description') && (
                                    <h2 className="text-lg font-black tracking-tight text-foreground leading-snug break-words">
                                        {tool.description}
                                    </h2>
                                )}

                                <div className="flex flex-wrap items-center gap-2">
                                    {isFieldVisible('toolCode') && (
                                        <span className="inline-flex items-center px-2 py-0.5 rounded-md bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400 font-mono text-[11px] font-bold border border-blue-200 dark:border-blue-800">
                                            {toolCodeVal}
                                        </span>
                                    )}
                                </div>

                                {/* Specs Subtitle Line */}
                                {(isFieldVisible('makeYear') || isFieldVisible('capacity') || isFieldVisible('safeWorkingLoad')) && (() => {
                                    const specs = [];
                                    if (isFieldVisible('makeYear') && makeYearVal && makeYearVal !== '-') {
                                        specs.push(`Make/Year: ${makeYearVal}`);
                                    }
                                    if (isFieldVisible('capacity') && capacityVal && capacityVal !== '-') {
                                        const capStr = String(capacityVal).toLowerCase().includes('capacity') || String(capacityVal).toLowerCase().includes('tonne')
                                            ? capacityVal
                                            : `Capacity: ${capacityVal}`;
                                        specs.push(capStr);
                                    }
                                    if (isFieldVisible('safeWorkingLoad') && safeWorkingLoadVal && safeWorkingLoadVal !== '-') {
                                        const swlStr = String(safeWorkingLoadVal).toLowerCase().includes('swl') || String(safeWorkingLoadVal).toLowerCase().includes('load')
                                            ? safeWorkingLoadVal
                                            : `SWL: ${safeWorkingLoadVal}`;
                                        specs.push(swlStr);
                                    }
                                    if (specs.length === 0) return null;
                                    return (
                                        <p className="text-xs text-muted-foreground font-medium">
                                            {specs.join(' • ')}
                                        </p>
                                    );
                                })()}
                            </div>
                        </div>

                        {/* Divider */}
                        <div className="border-t border-border/60" />

                        {/* Section 1: Supplier & Date of Receipt (2 Columns) */}
                        <div className="grid grid-cols-2 gap-4 text-xs">
                            {/* Supplier Box */}
                            {(isFieldVisible('purchaserName') || isFieldVisible('supplierCode') || isFieldVisible('purchaserContact')) && (
                                <div className="space-y-0.5">
                                    <span className="text-[11px] font-medium text-muted-foreground block">
                                        Supplier Details
                                    </span>
                                    {isFieldVisible('purchaserName') && purchaserNameVal !== '-' && (
                                        <span className="font-bold text-foreground block truncate">
                                            {purchaserNameVal}
                                        </span>
                                    )}
                                    {isFieldVisible('supplierCode') && supplierCodeVal !== '-' && (
                                        <span className="text-[11px] text-muted-foreground block">
                                            Code: {supplierCodeVal}
                                        </span>
                                    )}
                                    {isFieldVisible('purchaserContact') && purchaserContactVal !== '-' && (
                                        <span className="text-[11px] text-muted-foreground block">
                                            Contact: {purchaserContactVal}
                                        </span>
                                    )}
                                </div>
                            )}

                            {/* Date of Receipt Box */}
                            {(isFieldVisible('dateOfSupply') || isFieldVisible('validityPeriod')) && (
                                <div className="space-y-0.5">
                                    {isFieldVisible('dateOfSupply') && dateOfSupplyVal !== '-' && (
                                        <>
                                            <span className="text-[11px] font-medium text-muted-foreground block">
                                                Date of Receipt
                                            </span>
                                            <span className="font-bold text-foreground block">
                                                {dateOfSupplyVal}
                                            </span>
                                        </>
                                    )}
                                    {isFieldVisible('validityPeriod') && validityPeriodVal !== '-' && (
                                        <div className={isFieldVisible('dateOfSupply') && dateOfSupplyVal !== '-' ? "pt-1" : ""}>
                                            <span className="text-[11px] font-medium text-muted-foreground block">
                                                Validation
                                            </span>
                                            <span className="font-bold text-foreground block">
                                                {validityPeriodVal}
                                            </span>
                                        </div>
                                    )}
                                </div>
                            )}
                        </div>

                        {/* Section 2: Last Inspection & Valid Until (2 Columns) */}
                        <div className="grid grid-cols-2 gap-4 text-xs pt-1">
                            {/* Last Inspection / Status */}
                            <div className="space-y-1">
                                <span className="text-[11px] font-medium text-muted-foreground block">
                                    Last Inspection
                                </span>
                                <div className="flex items-center gap-1.5">
                                    <span className="font-semibold text-foreground text-xs">{lastInspectionDateVal}</span>
                                </div>
                                <span className={`inline-flex items-center text-[11px] font-extrabold ${
                                    isAvailable 
                                        ? 'text-emerald-600 dark:text-emerald-400' 
                                        : isMoving 
                                        ? 'text-amber-600 dark:text-amber-400'
                                        : 'text-rose-600 dark:text-rose-400'
                                }`}>
                                    {tool.status || 'Usable'}
                                </span>
                            </div>

                            {/* Valid Until */}
                            {isFieldVisible('validityPeriod') && (
                                <div className="space-y-0.5">
                                    <span className="text-[11px] font-medium text-muted-foreground block">
                                        Valid Until
                                    </span>
                                    <span className="font-bold text-foreground block">
                                        {validUntilVal}
                                    </span>
                                </div>
                            )}
                        </div>

                        {/* Divider */}
                        <div className="border-t border-border/60" />

                        {/* Section 3: Job Code & Description (2 Columns) */}
                        <div className="grid grid-cols-2 gap-4 text-xs">
                            {isFieldVisible('jobCode') && (
                                <div className="space-y-0.5">
                                    <span className="text-[11px] font-medium text-muted-foreground block">
                                        Job Code
                                    </span>
                                    <span className="font-bold text-foreground block truncate">
                                        {jobCodeVal}
                                    </span>
                                </div>
                            )}

                            {isFieldVisible('jobDescription') && (
                                <div className="space-y-0.5">
                                    <span className="text-[11px] font-medium text-muted-foreground block">
                                        Job Description
                                    </span>
                                    <span className="font-bold text-foreground block truncate" title={jobDescriptionVal}>
                                        {jobDescriptionVal}
                                    </span>
                                </div>
                            )}
                        </div>

                        {/* Section 4: Full Details Action Link / Button */}
                        <div className="pt-2">
                            <Button
                                onClick={handleGoToFullDetails}
                                className="w-full rounded-2xl h-11 font-bold gap-2 text-xs bg-primary hover:bg-primary/90 text-primary-foreground shadow-md cursor-pointer transition-all hover:scale-[1.01]"
                            >
                                <span>View Full Details & Inventory Profile</span>
                                <ExternalLink className="size-4" />
                            </Button>
                        </div>
                    </>
                )}
            </div>
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
