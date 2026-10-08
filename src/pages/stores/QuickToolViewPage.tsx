import { useState, useEffect } from "react";
import { useParams, useNavigate, useLocation } from "react-router-dom";
import QRCode from "qrcode";
import toolService from "@/services/tool.service";
import formService from "@/services/form.service";
import { StoreToolsPage } from "./StoreToolsPage";
import { toast } from "sonner";
import {
    Loader2,
    X,
    Tag,
    CheckCircle2,
    XCircle,
    AlertTriangle,
    QrCode
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
    const [qrCodeDataUrl, setQrCodeDataUrl] = useState<string>('');

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

    useEffect(() => {
        if (tool) {
            const targetId = tool.toolId || tool.toolCode || toolId || '';
            const link = tool.qrLink || `https://lntqr.com/vt/${targetId}`;
            QRCode.toDataURL(link, { 
                margin: 1, 
                width: 200, 
                errorCorrectionLevel: 'H',
                color: { light: '#00000000' } // Transparent background
            })
                .then(url => setQrCodeDataUrl(url))
                .catch(err => console.error("QR Code generation error:", err));
        }
    }, [tool, toolId]);

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

    const parseDateHelper = (dateStr: any): Date | null => {
        if (!dateStr || dateStr === '-' || dateStr === 'N/A') return null;

        let str = String(dateStr).trim();

        // Handle raw Excel serial numbers like "46165"
        if (!isNaN(Number(str)) && Number(str) > 30000 && Number(str) < 100000 && !str.includes('/') && !str.includes('-')) {
            const excelEpoch = new Date(Date.UTC(1899, 11, 30));
            const dateObj = new Date(excelEpoch.getTime() + Number(str) * 86400000);
            if (!isNaN(dateObj.getTime())) return dateObj;
        }

        // Standard ISO format (YYYY-MM-DD)
        if (/^\d{4}-\d{2}-\d{2}/.test(str)) {
            const parsed = new Date(str);
            if (!isNaN(parsed.getTime())) return parsed;
        }

        if (str.includes('/')) {
            const parts = str.split('/');
            if (parts.length === 3) {
                const p0 = parseInt(parts[0], 10);
                const p1 = parseInt(parts[1], 10);
                const p2 = parseInt(parts[2], 10);

                if (!isNaN(p0) && !isNaN(p1) && !isNaN(p2)) {
                    if (p2 >= 1970 && p2 <= 2100) {
                        if (p1 > 12) {
                            // MM/DD/YYYY (p1 is day, p0 is month)
                            const d = new Date(p2, p0 - 1, p1);
                            if (!isNaN(d.getTime())) return d;
                        }
                        if (p0 > 12) {
                            // DD/MM/YYYY (p0 is day, p1 is month)
                            const d = new Date(p2, p1 - 1, p0);
                            if (!isNaN(d.getTime())) return d;
                        }
                        // Default MM/DD/YYYY
                        const d = new Date(p2, p0 - 1, p1);
                        if (!isNaN(d.getTime())) return d;
                    }
                }
            }
        }

        const fallback = new Date(str);
        if (!isNaN(fallback.getTime())) {
            return fallback;
        }

        return null;
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

    // 1. Resolve raw validity period & purchaser fallback
    const rawValidity = getFieldValue('validityPeriod', ['validation', 'validity', 'validity_period']) || tool?.validation || tool?.validityPeriod;
    const purchaserStr = String(purchaserNameVal || tool?.purchaserName || '').trim();
    const isThirdParty = purchaserStr.toLowerCase().includes('third party inspection');

    let resolvedYears = 3;
    let validityPeriodVal = '3 Years';

    if (rawValidity && rawValidity !== 'N/A' && rawValidity !== '-' && String(rawValidity).trim() !== '') {
        const yearsMatch = String(rawValidity).match(/(\d+)/);
        if (yearsMatch) {
            resolvedYears = parseInt(yearsMatch[1], 10);
            validityPeriodVal = String(rawValidity).toLowerCase().includes('year') ? String(rawValidity) : `${rawValidity} Years`;
        } else if (isThirdParty) {
            resolvedYears = 1;
            validityPeriodVal = '1 Year';
        }
    } else {
        if (isThirdParty) {
            resolvedYears = 1;
            validityPeriodVal = '1 Year';
        } else {
            resolvedYears = 3;
            validityPeriodVal = '3 Years';
        }
    }

    // 2. Resolve start date & valid until date
    const startDateObj = parseDateHelper(tool?.validationStartDate || tool?.customFields?.validationStartDate || dateOfSupplyVal || tool?.createdAt);

    let validUntilDate: Date | null = parseDateHelper(tool?.nextInspectionDueDate || tool?.customFields?.nextInspectionDueDate);
    if (!validUntilDate && startDateObj) {
        validUntilDate = new Date(startDateObj);
        validUntilDate.setFullYear(validUntilDate.getFullYear() + resolvedYears);
    }

    const validUntilVal = validUntilDate ? validUntilDate.toLocaleDateString() : '-';

    const jobCodeVal = getFieldValue('jobCode') || '-';
    const jobDescriptionVal = getFieldValue('jobDescription', ['job_description']) || '-';

    const currentSiteVal = tool?.currentSite?.name || tool?.currentSite?.storeName || (typeof tool?.currentSite === 'string' ? tool?.currentSite : getFieldValue('currentSite', ['store', 'storeName']));
    const projectVal = tool?.project?.name || tool?.project?.projectName || (typeof tool?.project === 'string' ? tool?.project : getFieldValue('project', ['projectName', 'site']));
    const subcontractorVal = getFieldValue('subcontractorName', ['subcontractor_name', 'subcontractor', 'subContractor']);

    const lastInspectionDateVal = tool?.lastInspectionDate
        ? new Date(tool.lastInspectionDate).toLocaleDateString()
        : '-';

    const validityStatusInfo = (() => {
        if (!validUntilDate || isNaN(validUntilDate.getTime())) {
            return {
                status: 'INVALID_EXPIRY',
                label: 'NO EXPIRY DATE',
                badgeText: 'Unspecified',
                color: 'amber',
                desc: 'Expiry date is missing or not configured for this tool.'
            };
        }

        const today = new Date();
        today.setHours(0, 0, 0, 0);

        const checkDate = new Date(validUntilDate);
        checkDate.setHours(0, 0, 0, 0);

        if (checkDate >= today) {
            return {
                status: 'VALID',
                label: 'VALID',
                badgeText: 'Tool Approved',
                color: 'emerald',
                desc: 'Tool is within valid operational inspection period.'
            };
        }

        return {
            status: 'EXPIRED',
            label: 'EXPIRED',
            badgeText: 'Action Required',
            color: 'rose',
            desc: 'Tool expiry date has passed. Re-inspection required.'
        };
    })();

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
                        {/* Header: Title, Badges & Top-Right QR Code */}
                        <div className="flex items-start justify-between gap-3 pr-7">
                            <div className="space-y-1.5 min-w-0 flex-1">
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

                            {/* Top-Right QR Code Graphic Box */}
                            <div className="shrink-0">
                                <div className="size-16 rounded-xl border border-border/60 bg-transparent p-0 flex items-center justify-center">
                                    {qrCodeDataUrl ? (
                                        <img src={qrCodeDataUrl} alt={toolIdVal} className="size-full object-contain" />
                                    ) : (
                                        <QrCode className="size-7 text-muted-foreground" />
                                    )}
                                </div>
                            </div>
                        </div>

                        {/* Validity Status Banner */}
                        {validityStatusInfo && (
                            <div className={`rounded-2xl p-2.5 flex items-center gap-2.5 border text-xs ${
                                validityStatusInfo.status === 'VALID'
                                    ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-700 dark:text-emerald-300'
                                    : validityStatusInfo.status === 'EXPIRED'
                                    ? 'bg-rose-500/10 border-rose-500/30 text-rose-700 dark:text-rose-300'
                                    : 'bg-amber-500/10 border-amber-500/30 text-amber-700 dark:text-amber-300'
                            }`}>
                                <div className={`size-7 rounded-full flex items-center justify-center shrink-0 ${
                                    validityStatusInfo.status === 'VALID'
                                        ? 'bg-emerald-500/20 text-emerald-600 dark:text-emerald-400'
                                        : validityStatusInfo.status === 'EXPIRED'
                                        ? 'bg-rose-500/20 text-rose-600 dark:text-rose-400'
                                        : 'bg-amber-500/20 text-amber-600 dark:text-amber-400'
                                }`}>
                                    {validityStatusInfo.status === 'VALID' ? (
                                        <CheckCircle2 className="size-4" />
                                    ) : validityStatusInfo.status === 'EXPIRED' ? (
                                        <XCircle className="size-4" />
                                    ) : (
                                        <AlertTriangle className="size-4" />
                                    )}
                                </div>
                                <div className="flex-1 min-w-0">
                                    <div className="flex items-center gap-1.5">
                                        <span className="font-extrabold tracking-wide uppercase text-[11px]">{validityStatusInfo.label}</span>
                                        <span className="px-1.5 py-0.2 rounded-md text-[9px] font-bold bg-background/60 border border-border/50">
                                            {validityStatusInfo.badgeText}
                                        </span>
                                    </div>
                                    <p className="text-[10px] font-medium opacity-90 truncate">
                                        {validityStatusInfo.desc}
                                    </p>
                                </div>
                            </div>
                        )}

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

                    </div>
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

