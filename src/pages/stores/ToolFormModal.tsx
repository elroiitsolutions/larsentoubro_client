import { useState, useEffect } from "react";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger, SheetDescription } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
    SelectSeparator
} from "@/components/ui/select"
import projectService from "@/services/project.service";
import toolService from "@/services/tool.service";
import formService from "@/services/form.service";
import { toast } from "sonner";
import { 
    PlusIcon, 
    Loader2, 
    WrenchIcon, 
    Sparkles, 
    Layers,
    ChevronDown, 
    InfoIcon,
    ArrowRightIcon
} from "lucide-react";

interface ToolFormModalProps {
    storeId: string;
    onSuccess: () => void;
    tool?: any;
    triggerButton?: React.ReactElement;
}

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
    const [formSchema, setFormSchema] = useState<any>(null);

    useEffect(() => {
        if (open) {
            fetchProjects();
            fetchFormSchema();
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

    const fetchFormSchema = async () => {
        try {
            const res = await formService.getFormBySlug('tool-form');
            if (res.success && res.data) {
                setFormSchema(res.data);
            }
        } catch (error) {
            console.error("Failed to fetch tool-form schema", error);
        }
    };

    const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        setLoading(true);

        const formData = new FormData(e.currentTarget);
        const data = Object.fromEntries(formData.entries());
        data.currentSite = storeId; 

        // Split data into core and customFields based on the schema fields?
        // Actually, backend already does this! We just send all fields.
        try {
            const isEdit = Boolean(tool && (tool._id || tool.toolId));
            const toolIdToUpdate = isEdit ? (tool._id || tool.toolId) : null;
            
            const result = isEdit
                ? await toolService.updateTool(toolIdToUpdate, data)
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

    const renderField = (field: any) => {
        const isRequired = field.validations?.some((v: any) => v.type === 'required');
        
        // Use customFields fallback if it's a dynamic field not in root tool object
        let defaultValue = tool?.[field.name];
        if (defaultValue === undefined && tool?.customFields) {
            defaultValue = tool.customFields[field.name];
        }
        
        if (field.name === 'project') {
             // Special case for Project dropdown
             return (
                 <HorizontalField key={field.id} label={field.label} required={isRequired} hint={field.helperText}>
                    <div className="relative">
                        <Select name={field.name} defaultValue={defaultValue?._id || defaultValue || ""}>
                            <SelectTrigger className="flex h-9 w-full rounded-xl border border-input bg-background px-3 py-1.5 text-sm ring-offset-background placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary transition-colors cursor-pointer font-medium">
                                <SelectValue placeholder="Select Project Site..." />
                            </SelectTrigger>
                            <SelectContent>
                                {projects.map((p) => (
                                    <SelectItem key={p._id} value={p._id}>
                                        {p.name}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>
                 </HorizontalField>
             );
        }
        
        if (field.type === 'select') {
            return (
                 <HorizontalField key={field.id} label={field.label} required={isRequired} hint={field.helperText}>
                    <div className="relative">
                        <Select name={field.name} defaultValue={defaultValue || ""}>
                            <SelectTrigger className="flex h-9 w-full rounded-xl border border-input bg-background px-3 py-1.5 text-sm ring-offset-background placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary transition-colors cursor-pointer font-medium">
                                <SelectValue placeholder={`Select ${field.label}...`} />
                            </SelectTrigger>
                            <SelectContent>
                                {field.options?.map((opt: any) => (
                                    <SelectItem key={opt.value} value={opt.value}>
                                        {opt.label}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>
                 </HorizontalField>
             );
        }
        
        return (
            <HorizontalField key={field.id} label={field.label} required={isRequired} hint={field.helperText}>
                <Input 
                    id={field.name} 
                    name={field.name} 
                    type={field.type === 'date' ? 'date' : field.type === 'number' ? 'number' : 'text'}
                    defaultValue={defaultValue || ""} 
                    placeholder={field.placeholder || ""} 
                    required={isRequired} 
                    className="h-9 rounded-xl bg-background border-border/70"
                />
            </HorizontalField>
        );
    };

    const getFields = () => {
        if (!formSchema?.fields) return [];
        return [...formSchema.fields].sort((a, b) => a.order - b.order);
    };

    const allFields = getFields();

    return (
        <Sheet open={open} onOpenChange={setOpen}>
            <SheetTrigger render={
                triggerButton ? triggerButton : (
                    <Button className="gap-2 rounded-xl shadow-md cursor-pointer" size="lg">
                        <PlusIcon className="size-4" />
                        Add Tool
                    </Button>
                )
            } />
            <SheetContent 
                className="w-[98vw] sm:max-w-none p-0 flex flex-col gap-0 border-l border-border/50 shadow-2xl overflow-hidden bg-background" 
                style={{ maxWidth: '1050px' }}
                side="right"
            >
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
                                ? "Update tool information below."
                                : "Fill out the details below to add this tool to store inventory."
                            }
                        </SheetDescription>
                    </div>
                </SheetHeader>

                <div className="flex-1 min-h-0 overflow-y-auto px-6 py-6">
                    {!formSchema ? (
                        <div className="flex justify-center items-center h-full">
                            <Loader2 className="size-6 animate-spin text-primary" />
                        </div>
                    ) : (
                        <form onSubmit={handleSubmit} id="add-tool-form" className="space-y-6">
                            <div className="bg-card border border-border/60 rounded-2xl p-5 shadow-xs space-y-4">
                                <div className="flex items-center justify-between border-b border-border/40 pb-2.5">
                                    <div className="flex items-center gap-2">
                                        <div className="p-1.5 rounded-lg bg-primary/10 text-primary">
                                            <WrenchIcon className="size-4" />
                                        </div>
                                        <div>
                                            <h3 className="font-bold text-sm sm:text-base text-foreground">
                                                Tool Details
                                            </h3>
                                            <p className="text-xs text-muted-foreground">Fill out the tool details based on the form configuration</p>
                                        </div>
                                    </div>
                                </div>

                                <div className="grid grid-cols-1 lg:grid-cols-2 gap-x-8 gap-y-3.5">
                                    {allFields.map(field => renderField(field))}
                                </div>
                            </div>
                        </form>
                    )}
                </div>

                <div className="p-5 border-t border-border/60 bg-muted/30 backdrop-blur-md flex flex-wrap items-center justify-between gap-4 shrink-0 mt-auto">
                    <div className="flex items-center gap-2 text-xs text-muted-foreground">
                        <InfoIcon className="size-4 text-primary shrink-0" />
                        <span>Fields with <strong className="text-destructive">*</strong> are required based on form schema.</span>
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
                            disabled={loading || !formSchema} 
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
