import { useState, useEffect } from "react";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger, SheetDescription } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import projectService from "@/services/project.service";
import toolService from "@/services/tool.service";
import { toast } from "sonner";
import { 
    PlusIcon, 
    Loader2, 
    WrenchIcon, 
    Building2Icon, 
    HardHatIcon, 
    ShieldCheckIcon, 
    Sparkles, 
    TagIcon, 
    ChevronDown, 
    ChevronUp,
    UserCheck,
    LinkIcon,
    InfoIcon,
    Layers,
    ArrowRightIcon
} from "lucide-react";

interface ToolFormModalProps {
    storeId: string;
    onSuccess: () => void;
    tool?: any;
    triggerButton?: React.ReactNode;
}

/**
 * Clean Horizontal Field Component
 * Places a user-friendly Label on the left and Input control on the right.
 */
function HorizontalField({
    label,
    required,
    children,
    labelWidth = "w-36 sm:w-44",
    hint
}: {
    label: React.ReactNode;
    required?: boolean;
    children: React.ReactNode;
    labelWidth?: string;
    hint?: string;
}) {
    return (
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1.5 sm:gap-4 w-full">
            <Label className={`${labelWidth} shrink-0 text-xs sm:text-sm font-medium text-foreground flex items-center justify-between`}>
                <span className="flex flex-col">
                    <span className="flex items-center gap-1">
                        <span>{label}</span>
                        {required && <span className="text-destructive font-bold">*</span>}
                    </span>
                    {hint && <span className="text-[10px] text-muted-foreground font-normal">{hint}</span>}
                </span>
            </Label>
            <div className="flex-1 min-w-0 w-full">
                {children}
            </div>
        </div>
    );
}

export function ToolFormModal({ storeId, onSuccess, tool, triggerButton }: ToolFormModalProps) {
    const [open, setOpen] = useState(false);
    const [loading, setLoading] = useState(false);
    const [projects, setProjects] = useState<any[]>([]);
    
    // Minimalist Guided Tabs: 'essential' (11 required fields) | 'advanced' (10 optional fields) | 'all'
    const [activeTab, setActiveTab] = useState<'essential' | 'advanced' | 'all'>('essential');
    
    // Collapsible sections inside Advanced Details
    const [showVendor, setShowVendor] = useState(true);
    const [showJobCert, setShowJobCert] = useState(true);
    const [showSubcontractor, setShowSubcontractor] = useState(
        Boolean(tool?.subcontractorName || tool?.subcontractorCode || tool?.subcontractorMobile)
    );

    useEffect(() => {
        if (open) {
            fetchProjects();
        }
    }, [open]);

    const fetchProjects = async () => {
        try {
            const data = await projectService.getProjects();
            if (data.success) {
                setProjects(data.data);
            }
        } catch (error) {
            console.error(error);
        }
    };

    const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        setLoading(true);

        const formData = new FormData(e.currentTarget);
        const data = Object.fromEntries(formData.entries());
        data.currentSite = storeId; // Assign to the current store

        try {
            const isEdit = Boolean(tool && (tool._id || tool.toolId));
            const result = isEdit
                ? await toolService.updateTool(tool._id || tool.toolId, data)
                : await toolService.createTool(storeId, data);

            if (result.success) {
                toast.success(isEdit ? "Tool updated successfully" : "Tool created successfully");
                setOpen(false);
                onSuccess();
            } else {
                toast.error(result.message || (isEdit ? "Failed to update tool" : "Failed to create tool"));
            }
        } catch (error: any) {
            console.error(error);
            const message = error?.response?.data?.message || "An error occurred";
            toast.error(message);
        } finally {
            setLoading(false);
        }
    };

    return (
        <Sheet open={open} onOpenChange={setOpen}>
            <SheetTrigger asChild>
                {triggerButton ? triggerButton : (
                    <Button className="gap-2 rounded-xl shadow-md cursor-pointer" size="lg">
                        <PlusIcon className="size-4" />
                        Add Tool
                    </Button>
                )}
            </SheetTrigger>
            <SheetContent 
                className="w-[98vw] sm:max-w-none p-0 flex flex-col gap-0 border-l border-border/50 shadow-2xl overflow-hidden bg-background" 
                style={{ maxWidth: '1050px' }}
                side="right"
            >
                {/* Clean, Minimal Header with User-Friendly Tabs */}
                <SheetHeader className="px-6 py-4 border-b border-border/60 bg-muted/20 backdrop-blur-sm shrink-0 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div className="space-y-1">
                        <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-primary/10 text-primary text-xs font-semibold">
                            <WrenchIcon className="size-3.5" />
                            <span>Tool Inventory</span>
                        </div>
                        <SheetTitle className="text-xl font-bold tracking-tight text-foreground">
                            {tool ? "Edit Tool Information" : "Register New Tool"}
                        </SheetTitle>
                        <SheetDescription className="text-xs text-muted-foreground">
                            {tool 
                                ? "Update tool identification, capacity, or site assignment below."
                                : "Fill out the essential details below to add this tool to store inventory."
                            }
                        </SheetDescription>
                    </div>

                    {/* Minimalist Guided Tabs */}
                    <div className="flex items-center gap-1 bg-muted/70 p-1 rounded-xl border border-border/40 shrink-0">
                        <button
                            type="button"
                            onClick={() => setActiveTab('essential')}
                            className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all flex items-center gap-1.5 cursor-pointer ${
                                activeTab === 'essential' 
                                    ? 'bg-background text-foreground shadow-xs' 
                                    : 'text-muted-foreground hover:text-foreground'
                            }`}
                        >
                            <Sparkles className="size-3.5 text-primary" />
                            <span>Essential Info</span>
                            <span className="px-1.5 py-0.5 rounded-full bg-primary/10 text-primary text-[10px] font-bold">11</span>
                        </button>

                        <button
                            type="button"
                            onClick={() => setActiveTab('advanced')}
                            className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all flex items-center gap-1.5 cursor-pointer ${
                                activeTab === 'advanced' 
                                    ? 'bg-background text-foreground shadow-xs' 
                                    : 'text-muted-foreground hover:text-foreground'
                            }`}
                        >
                            <Layers className="size-3.5 text-blue-500" />
                            <span>Advanced Details</span>
                            <span className="px-1.5 py-0.5 rounded-full bg-muted text-muted-foreground text-[10px] font-bold">Optional</span>
                        </button>

                        <button
                            type="button"
                            onClick={() => setActiveTab('all')}
                            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                                activeTab === 'all' 
                                    ? 'bg-background text-foreground shadow-xs' 
                                    : 'text-muted-foreground hover:text-foreground'
                            }`}
                        >
                            <span>View All</span>
                        </button>
                    </div>
                </SheetHeader>

                {/* Main Scrollable Form Content */}
                <div className="flex-1 min-h-0 overflow-y-auto px-6 py-6">
                    <form onSubmit={handleSubmit} id="add-tool-form" className="space-y-6">
                        
                        {/* =========================================================================
                            TAB 1: ESSENTIAL INFO (11 Required / Essential Fields)
                            Minimal, clean, human-friendly labels, zero scrolling needed on desktop!
                        ========================================================================= */}
                        <div className={activeTab === 'essential' || activeTab === 'all' ? 'space-y-6' : 'hidden'}>
                            
                            {/* Card 1: Tool Identification (6 fields) */}
                            <div className="bg-card border border-border/60 rounded-2xl p-5 shadow-xs space-y-4">
                                <div className="flex items-center justify-between border-b border-border/40 pb-2.5">
                                    <div className="flex items-center gap-2">
                                        <div className="p-1.5 rounded-lg bg-primary/10 text-primary">
                                            <WrenchIcon className="size-4" />
                                        </div>
                                        <div>
                                            <h3 className="font-bold text-sm sm:text-base text-foreground">
                                                1. Tool Identification
                                            </h3>
                                            <p className="text-xs text-muted-foreground">Name, tag ID, category, and brand information</p>
                                        </div>
                                    </div>
                                    <span className="text-xs font-semibold text-primary bg-primary/10 px-2.5 py-1 rounded-full">
                                        Core Info
                                    </span>
                                </div>

                                {/* Horizontal 2-Column Grid */}
                                <div className="grid grid-cols-1 lg:grid-cols-2 gap-x-8 gap-y-3.5">
                                    <HorizontalField label="Tool Name" required hint="e.g. Heavy Duty Winch">
                                        <Input 
                                            id="description" 
                                            name="description" 
                                            defaultValue={tool?.description || ""} 
                                            placeholder="Enter tool name..." 
                                            required 
                                            className="h-9 rounded-xl bg-background border-border/70 font-medium"
                                        />
                                    </HorizontalField>

                                    <HorizontalField label="Tool ID / Tag" hint="e.g. TC-1001">
                                        <Input 
                                            id="toolCode" 
                                            name="toolCode" 
                                            defaultValue={tool?.toolCode || ""} 
                                            placeholder="Enter ID or tag number..." 
                                            className="h-9 rounded-xl bg-background border-border/70 font-mono"
                                        />
                                    </HorizontalField>

                                    <HorizontalField label="Category" required hint="Erection or Stringing">
                                        <div className="relative">
                                            <select
                                                id="toolType"
                                                name="toolType"
                                                defaultValue={tool?.toolType || ""}
                                                required
                                                className="appearance-none flex h-9 w-full rounded-xl border border-input bg-background px-3 py-1.5 text-sm ring-offset-background placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary transition-colors cursor-pointer font-medium"
                                            >
                                                <option value="" disabled hidden>Select Category...</option>
                                                <option value="Erection Tools">Erection Tools</option>
                                                <option value="Stringing Tools">Stringing Tools</option>
                                            </select>
                                            <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none text-muted-foreground">
                                                <ChevronDown className="size-4" />
                                            </div>
                                        </div>
                                    </HorizontalField>

                                    <HorizontalField label="Operation Type" required hint="Hydraulic or Manual">
                                        <Input 
                                            id="toolVariant" 
                                            name="toolVariant" 
                                            defaultValue={tool?.toolVariant || ""} 
                                            placeholder="e.g. Hydraulic / Manual" 
                                            required 
                                            className="h-9 rounded-xl bg-background border-border/70"
                                        />
                                    </HorizontalField>

                                    <HorizontalField label="Brand & Year" required hint="Manufacturer & Year">
                                        <Input 
                                            id="makeYear" 
                                            name="makeYear" 
                                            defaultValue={tool?.makeYear || ""} 
                                            placeholder="e.g. Tata / 2024" 
                                            required 
                                            className="h-9 rounded-xl bg-background border-border/70"
                                        />
                                    </HorizontalField>

                                    <HorizontalField label="Material" required hint="Metal or Alloy type">
                                        <Input 
                                            id="metalType" 
                                            name="metalType" 
                                            defaultValue={tool?.metalType || ""} 
                                            placeholder="e.g. Alloy Steel / Aluminum" 
                                            required 
                                            className="h-9 rounded-xl bg-background border-border/70"
                                        />
                                    </HorizontalField>
                                </div>
                            </div>

                            {/* Card 2: Capacity & Site Assignment (5 fields) */}
                            <div className="bg-card border border-border/60 rounded-2xl p-5 shadow-xs space-y-4">
                                <div className="flex items-center justify-between border-b border-border/40 pb-2.5">
                                    <div className="flex items-center gap-2">
                                        <div className="p-1.5 rounded-lg bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
                                            <HardHatIcon className="size-4" />
                                        </div>
                                        <div>
                                            <h3 className="font-bold text-sm sm:text-base text-foreground">
                                                2. Capacity & Site Assignment
                                            </h3>
                                            <p className="text-xs text-muted-foreground">Load limits, assigned project site, and validity</p>
                                        </div>
                                    </div>
                                    <span className="text-xs font-semibold text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 px-2.5 py-1 rounded-full">
                                        Assignment
                                    </span>
                                </div>

                                {/* Horizontal 2-Column Grid */}
                                <div className="grid grid-cols-1 lg:grid-cols-2 gap-x-8 gap-y-3.5">
                                    <HorizontalField label="Load Capacity" required hint="Max rated capacity">
                                        <Input 
                                            id="capacity" 
                                            name="capacity" 
                                            defaultValue={tool?.capacity || ""} 
                                            placeholder="e.g. 10 Ton / 500 kN" 
                                            required 
                                            className="h-9 rounded-xl bg-background border-border/70"
                                        />
                                    </HorizontalField>

                                    <HorizontalField label="Max Safe Weight" required hint="Safe working limit">
                                        <Input 
                                            id="safeWorkingLoad" 
                                            name="safeWorkingLoad" 
                                            defaultValue={tool?.safeWorkingLoad || ""} 
                                            placeholder="e.g. 8.5 Ton" 
                                            required 
                                            className="h-9 rounded-xl bg-background border-border/70"
                                        />
                                    </HorizontalField>

                                    <HorizontalField label="Assigned Project" required hint="Site location">
                                        <div className="relative">
                                            <select
                                                id="project"
                                                name="project"
                                                defaultValue={tool?.project?._id || tool?.project || ""}
                                                required
                                                className="appearance-none flex h-9 w-full rounded-xl border border-input bg-background px-3 py-1.5 text-sm ring-offset-background placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary transition-colors cursor-pointer font-medium"
                                            >
                                                <option value="" disabled hidden>Select Project Site...</option>
                                                {projects.map((p) => (
                                                    <option key={p._id} value={p._id}>
                                                        {p.name}
                                                    </option>
                                                ))}
                                            </select>
                                            <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none text-muted-foreground">
                                                <ChevronDown className="size-4" />
                                            </div>
                                        </div>
                                    </HorizontalField>

                                    <HorizontalField label="Date Received" required hint="Supply arrival date">
                                        <Input 
                                            id="dateOfSupply" 
                                            name="dateOfSupply" 
                                            type="date" 
                                            defaultValue={tool?.dateOfSupply || ""} 
                                            required 
                                            className="h-9 rounded-xl bg-background border-border/70"
                                        />
                                    </HorizontalField>

                                    <HorizontalField label="Safety Validity" required hint="Years before re-test">
                                        <Input 
                                            id="validityPeriod" 
                                            name="validityPeriod" 
                                            type="number" 
                                            defaultValue={tool?.validityPeriod || ""} 
                                            placeholder="e.g. 3" 
                                            required 
                                            className="h-9 rounded-xl bg-background border-border/70 font-semibold"
                                        />
                                    </HorizontalField>

                                    <HorizontalField label="Purchased By" required hint="Department / Buyer">
                                        <Input 
                                            id="purchaserName" 
                                            name="purchaserName" 
                                            defaultValue={tool?.purchaserName || ""} 
                                            placeholder="e.g. L&T Procurement Div" 
                                            required 
                                            className="h-9 rounded-xl bg-background border-border/70"
                                        />
                                    </HorizontalField>
                                </div>
                            </div>

                            {/* Minimalist Switcher to Optional Advanced Details */}
                            {activeTab === 'essential' && (
                                <div className="bg-muted/30 border border-border/50 rounded-2xl p-4 flex flex-col sm:flex-row items-center justify-between gap-3 text-center sm:text-left">
                                    <div className="space-y-0.5">
                                        <p className="text-xs font-bold text-foreground">
                                            Need to add supplier codes, certificate links, or subcontractor details?
                                        </p>
                                        <p className="text-xs text-muted-foreground">
                                            All 10 optional fields are available in the Advanced Details tab.
                                        </p>
                                    </div>
                                    <Button
                                        type="button"
                                        variant="outline"
                                        size="sm"
                                        onClick={() => setActiveTab('advanced')}
                                        className="h-8 rounded-xl text-xs font-semibold gap-1.5 shrink-0 cursor-pointer border-primary/20 text-primary hover:bg-primary/5"
                                    >
                                        <span>Show Advanced Details</span>
                                        <ArrowRightIcon className="size-3.5" />
                                    </Button>
                                </div>
                            )}
                        </div>

                        {/* =========================================================================
                            TAB 2: ADVANCED & OPTIONAL DETAILS (10 Optional Fields)
                            Collapsible, organized, non-technical terms
                        ========================================================================= */}
                        <div className={activeTab === 'advanced' || activeTab === 'all' ? 'space-y-4' : 'hidden'}>
                            
                            {/* Accordion 1: Vendor & Procurement Info (3 optional fields) */}
                            <div className="bg-card border border-border/60 rounded-2xl overflow-hidden shadow-xs">
                                <button
                                    type="button"
                                    onClick={() => setShowVendor(!showVendor)}
                                    className="w-full px-5 py-3.5 bg-muted/20 hover:bg-muted/40 flex items-center justify-between transition-colors cursor-pointer text-left"
                                >
                                    <div className="flex items-center gap-2.5">
                                        <div className="p-1.5 rounded-lg bg-amber-500/10 text-amber-600 dark:text-amber-400">
                                            <Building2Icon className="size-4" />
                                        </div>
                                        <div>
                                            <h3 className="font-bold text-sm text-foreground">
                                                Vendor & Procurement Details (Optional)
                                            </h3>
                                            <p className="text-xs text-muted-foreground">Buyer phone, email, and supplier ID numbers</p>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <span className="text-xs font-medium text-muted-foreground bg-background px-2.5 py-0.5 rounded-lg border border-border/60">
                                            {showVendor ? "Expanded" : "Collapsed"}
                                        </span>
                                        {showVendor ? <ChevronUp className="size-4" /> : <ChevronDown className="size-4" />}
                                    </div>
                                </button>

                                {showVendor && (
                                    <div className="p-5 border-t border-border/40 grid grid-cols-1 lg:grid-cols-2 gap-x-8 gap-y-3.5">
                                        <HorizontalField label="Buyer Phone / Email" hint="Purchaser contact info">
                                            <Input 
                                                id="purchaserContact" 
                                                name="purchaserContact" 
                                                defaultValue={tool?.purchaserContact || ""} 
                                                placeholder="e.g. +91 9876543210 / email..." 
                                                className="h-9 rounded-xl bg-background"
                                            />
                                        </HorizontalField>

                                        <HorizontalField label="Supplier ID" hint="Vendor catalog code">
                                            <Input 
                                                id="supplierCode" 
                                                name="supplierCode" 
                                                defaultValue={tool?.supplierCode || ""} 
                                                placeholder="e.g. SUP-8902" 
                                                className="h-9 rounded-xl bg-background font-mono"
                                            />
                                        </HorizontalField>
                                    </div>
                                )}
                            </div>

                            {/* Accordion 2: Job Scope, Certificate Link & Notes (4 optional fields) */}
                            <div className="bg-card border border-border/60 rounded-2xl overflow-hidden shadow-xs">
                                <button
                                    type="button"
                                    onClick={() => setShowJobCert(!showJobCert)}
                                    className="w-full px-5 py-3.5 bg-muted/20 hover:bg-muted/40 flex items-center justify-between transition-colors cursor-pointer text-left"
                                >
                                    <div className="flex items-center gap-2.5">
                                        <div className="p-1.5 rounded-lg bg-blue-500/10 text-blue-600 dark:text-blue-400">
                                            <ShieldCheckIcon className="size-4" />
                                        </div>
                                        <div>
                                            <h3 className="font-bold text-sm text-foreground">
                                                Job Scope & Test Certificate (Optional)
                                            </h3>
                                            <p className="text-xs text-muted-foreground">Job numbers, certificate links, and general notes</p>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <span className="text-xs font-medium text-muted-foreground bg-background px-2.5 py-0.5 rounded-lg border border-border/60">
                                            {showJobCert ? "Expanded" : "Collapsed"}
                                        </span>
                                        {showJobCert ? <ChevronUp className="size-4" /> : <ChevronDown className="size-4" />}
                                    </div>
                                </button>

                                {showJobCert && (
                                    <div className="p-5 border-t border-border/40 grid grid-cols-1 lg:grid-cols-2 gap-x-8 gap-y-3.5">
                                        <HorizontalField label="Job Number" hint="Internal project job code">
                                            <Input 
                                                id="jobCode" 
                                                name="jobCode" 
                                                defaultValue={tool?.jobCode || ""} 
                                                placeholder="e.g. JC-4055" 
                                                className="h-9 rounded-xl bg-background font-mono"
                                            />
                                        </HorizontalField>

                                        <HorizontalField label="Task / Purpose" hint="Specific job description">
                                            <Input 
                                                id="jobDescription" 
                                                name="jobDescription" 
                                                defaultValue={tool?.jobDescription || ""} 
                                                placeholder="e.g. Tower Erection Site A..." 
                                                className="h-9 rounded-xl bg-background"
                                            />
                                        </HorizontalField>

                                        <HorizontalField label="Certificate Link" hint="Test report document URL">
                                            <Input 
                                                id="testCertificate" 
                                                name="testCertificate" 
                                                defaultValue={tool?.testCertificate || ""} 
                                                placeholder="e.g. https://portal.larsen.com/cert.pdf" 
                                                className="h-9 rounded-xl bg-background"
                                            />
                                        </HorizontalField>

                                        <HorizontalField label="General Notes" hint="Condition / maintenance">
                                            <Input 
                                                id="remarks" 
                                                name="remarks" 
                                                defaultValue={tool?.remarks || ""} 
                                                placeholder="e.g. Condition good, stored in rack A-12..." 
                                                className="h-9 rounded-xl bg-background"
                                            />
                                        </HorizontalField>
                                    </div>
                                )}
                            </div>

                            {/* Accordion 3: Subcontractor Assignment (3 optional fields) */}
                            <div className="bg-card border border-border/60 rounded-2xl overflow-hidden shadow-xs">
                                <button
                                    type="button"
                                    onClick={() => setShowSubcontractor(!showSubcontractor)}
                                    className="w-full px-5 py-3.5 bg-muted/20 hover:bg-muted/40 flex items-center justify-between transition-colors cursor-pointer text-left"
                                >
                                    <div className="flex items-center gap-2.5">
                                        <div className="p-1.5 rounded-lg bg-secondary/80 text-secondary-foreground">
                                            <UserCheck className="size-4" />
                                        </div>
                                        <div>
                                            <h3 className="font-bold text-sm text-foreground">
                                                Subcontractor Assignment (Optional)
                                            </h3>
                                            <p className="text-xs text-muted-foreground">Assign tool to an external subcontractor</p>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <span className="text-xs font-medium text-muted-foreground bg-background px-2.5 py-0.5 rounded-lg border border-border/60">
                                            {showSubcontractor ? "Expanded" : "Collapsed"}
                                        </span>
                                        {showSubcontractor ? <ChevronUp className="size-4" /> : <ChevronDown className="size-4" />}
                                    </div>
                                </button>

                                {showSubcontractor && (
                                    <div className="p-5 border-t border-border/40 grid grid-cols-1 lg:grid-cols-2 gap-x-8 gap-y-3.5">
                                        <HorizontalField label="Subcontractor Name" hint="Company name">
                                            <Input 
                                                id="subcontractorName" 
                                                name="subcontractorName" 
                                                defaultValue={tool?.subcontractorName || ""} 
                                                placeholder="e.g. Apex Line Pvt Ltd" 
                                                className="h-9 rounded-xl bg-background"
                                            />
                                        </HorizontalField>

                                        <HorizontalField label="Subcontractor ID" hint="Vendor / SUB code">
                                            <Input 
                                                id="subcontractorCode" 
                                                name="subcontractorCode" 
                                                defaultValue={tool?.subcontractorCode || ""} 
                                                placeholder="e.g. SUB-091" 
                                                className="h-9 rounded-xl bg-background font-mono"
                                            />
                                        </HorizontalField>

                                        <HorizontalField label="Subcontractor Phone" hint="Site contact number">
                                            <Input 
                                                id="subcontractorMobile" 
                                                name="subcontractorMobile" 
                                                defaultValue={tool?.subcontractorMobile || ""} 
                                                placeholder="e.g. +91 9988776655" 
                                                className="h-9 rounded-xl bg-background"
                                            />
                                        </HorizontalField>
                                    </div>
                                )}
                            </div>

                            {activeTab === 'advanced' && (
                                <div className="bg-muted/30 border border-border/50 rounded-2xl p-4 flex flex-col sm:flex-row items-center justify-between gap-3 text-center sm:text-left">
                                    <p className="text-xs text-muted-foreground">
                                        Finished configuring optional details? You can save right now or return to Essential Info.
                                    </p>
                                    <Button
                                        type="button"
                                        variant="outline"
                                        size="sm"
                                        onClick={() => setActiveTab('essential')}
                                        className="h-8 rounded-xl text-xs font-semibold shrink-0 cursor-pointer"
                                    >
                                        <span>← Back to Essential Info</span>
                                    </Button>
                                </div>
                            )}
                        </div>
                    </form>
                </div>

                {/* Clean, Minimal Footer Action Bar */}
                <div className="p-5 border-t border-border/60 bg-muted/30 backdrop-blur-md flex flex-wrap items-center justify-between gap-4 shrink-0 mt-auto">
                    <div className="flex items-center gap-2 text-xs text-muted-foreground">
                        <InfoIcon className="size-4 text-primary shrink-0" />
                        <span>Fields with <strong className="text-destructive">*</strong> are required. All fields from every tab are saved when you submit.</span>
                    </div>

                    <div className="flex items-center gap-3">
                        <Button 
                            type="button" 
                            variant="outline" 
                            onClick={() => setOpen(false)}
                            className="h-10 px-5 rounded-xl font-medium cursor-pointer"
                        >
                            Cancel
                        </Button>
                        <Button 
                            type="submit" 
                            form="add-tool-form" 
                            disabled={loading} 
                            className="h-10 px-7 rounded-xl font-bold bg-primary text-primary-foreground hover:bg-primary/90 shadow-sm cursor-pointer"
                        >
                            {loading ? <Loader2 className="size-4 animate-spin mr-2" /> : null}
                            {tool ? "Save Changes" : "Save Tool"}
                        </Button>
                    </div>
                </div>
            </SheetContent>
        </Sheet>
    );
}
