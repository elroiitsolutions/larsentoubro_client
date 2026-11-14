import { useEffect, useState, useRef } from "react"
import { useFormBuilderStore } from "@/store/useFormBuilderStore"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue} from "@/components/ui/select"
import { 
    ArrowLeftIcon, 
    ArrowUpIcon, 
    ArrowDownIcon, 
    TrashIcon, 
    PlusIcon, 
    SaveIcon, 
    Sliders, 
    CheckSquare, 
    Layers,  
    HelpCircle, 
    ShieldCheck, 
    ListFilter, 
    XIcon,
    InfoIcon,
    Lock
} from "lucide-react"
import { toast } from "sonner"
import { ConfirmDialog } from "@/components/ConfirmDialog"
import formService from "@/services/form.service"

export const isPermanentRequiredField = (field: any): boolean => {
    const name = String(field?.name || field?.id || '').toLowerCase().trim();
    const label = String(field?.label || '').toLowerCase().trim();

    const isName = (
        name === 'name' ||
        label === 'name' ||
        label.includes('vendor name') ||
        label.includes('firm name') ||
        label.includes('purchaser name') ||
        label.includes('subcontractor name') ||
        label.includes('company name') ||
        label.includes('full name') ||
        label.includes('supplier name') ||
        label === 'subcontractor / vendor name' ||
        label === 'scrap dealer / firm name' ||
        label === 'supplier / purchaser name'
    );

    const isPrimaryPhone = (
        name === 'contactphone' ||
        name === 'phone' ||
        name === 'phonenumber' ||
        name === 'mobile' ||
        name === 'mobilenumber' ||
        label.includes('primary phone') ||
        label.includes('mobile number') ||
        label === 'phone number' ||
        label.includes('primary phone number')
    ) && !name.includes('alternate') && !label.includes('alternate');

    return isName || isPrimaryPhone;
};

export function FormEditor({ form, onBack, onSave }: { form: any; onBack: () => void; onSave: (updatedForm: any) => void }) {
    const { fields, loadForm, addField, updateField, removeField, reorderFields } = useFormBuilderStore()
    const [expandedSettingsId, setExpandedSettingsId] = useState<string | null>(null)
    const [expandedOptionsId, setExpandedOptionsId] = useState<string | null>(null)
    const [fieldToDelete, setFieldToDelete] = useState<{ id: string; label: string } | null>(null)

    const [saving, setSaving] = useState(false)
    const [newlyAddedId, setNewlyAddedId] = useState<string | null>(null)
    const containerRef = useRef<HTMLDivElement>(null)
    const bottomRef = useRef<HTMLDivElement>(null)

    useEffect(() => {
        if (form && Array.isArray(form.fields)) {
            const patched = form.fields.map((f: any) => {
                let vals = f.validations ? [...f.validations] : [];
                const fieldTypeLower = String(f.type || '').toLowerCase();
                const isDateField = fieldTypeLower === 'date' || fieldTypeLower === 'calendar' || fieldTypeLower === 'calender';
                if (isDateField) {
                    vals = vals.filter((v: any) => v.type !== 'alphanumeric');
                }
                if (isPermanentRequiredField(f)) {
                    if (!vals.some((v: any) => v.type === 'required')) {
                        vals.push({ type: 'required', message: `${(f.label || f.name).trim()} is required` });
                    }
                    return { ...f, required: true, validations: vals };
                }
                return { ...f, validations: vals };
            });
            loadForm({ ...form, fields: patched });
        } else {
            loadForm(form);
        }
    }, [form, loadForm])

    const handleSave = async () => {
        const invalidFields = fields.filter(f => !f.label || !f.label.trim())
        if (invalidFields.length > 0) {
            toast.error("Please provide a name for all fields before saving")
            return
        }

        const sanitizedFields = fields.map((f, idx) => {
            const isPermanent = isPermanentRequiredField(f);
            const isReq = isPermanent || Boolean(f.required || (Array.isArray(f.validations) && f.validations.some(v => v.type === 'required')));
            let vals = f.validations ? [...f.validations] : [];
            if (isReq) {
                if (!vals.some((v: any) => v.type === 'required')) {
                    vals.push({ type: 'required', message: `${f.label.trim()} is required` });
                }
            } else {
                vals = vals.filter((v: any) => v.type !== 'required');
            }
            const fieldTypeLower = String(f.type || '').toLowerCase();
            const isDateField = fieldTypeLower === 'date' || fieldTypeLower === 'calendar' || fieldTypeLower === 'calender';
            if (isDateField) {
                vals = vals.filter((v: any) => v.type !== 'alphanumeric');
            }
            const rawName = f.name && f.name.trim();
            const isAutoGenerated = !rawName || rawName.startsWith('field_');
            const derivedName = f.label ? f.label.trim().toLowerCase().replace(/[^a-z0-9_]+/g, '_').replace(/^_+|_+$/g, '') : '';
            const fieldName = (!isAutoGenerated && rawName) || derivedName || rawName || `field_${idx}`;

            return {
                ...f,
                order: idx,
                name: fieldName,
                label: f.label.trim(),
                placeholder: typeof f.placeholder === 'string' ? f.placeholder.trim() : '',
                helperText: typeof f.helperText === 'string' ? f.helperText.trim() : '',
                required: isReq,
                validations: vals
            };
        })

        try {
            setSaving(true)
            await onSave({ ...form, fields: sanitizedFields })
        } catch (err) {
            console.error(err)
        } finally {
            setSaving(false)
        }
    }

    const handleAddField = () => {
        const nextOrder = fields.length
        const newFieldId = `f_${Date.now()}`
        addField({
            id: newFieldId,
            name: `field_${nextOrder}`,
            label: `New Field ${nextOrder + 1}`,
            type: "text",
            order: nextOrder
        })
        setNewlyAddedId(newFieldId)
        toast.success("New field added")

        // Smoothly scroll down to the newly created field
        setTimeout(() => {
            const el = document.getElementById(`field-row-${newFieldId}`)
            if (el) {
                el.scrollIntoView({ behavior: 'smooth', block: 'center' })
                const input = el.querySelector('input')
                if (input) {
                    input.focus()
                    input.select()
                }
            } else if (bottomRef.current) {
                bottomRef.current.scrollIntoView({ behavior: 'smooth', block: 'end' })
            } else if (containerRef.current) {
                containerRef.current.scrollTo({
                    top: containerRef.current.scrollHeight,
                    behavior: 'smooth'
                })
            }
        }, 100)

        // Clear highlight ring after animation
        setTimeout(() => {
            setNewlyAddedId((prev) => (prev === newFieldId ? null : prev))
        }, 2500)
    }

    const handleRemoveField = async (id: string, label: string) => {
        const field = fields.find(f => f.id === id);
        if (field && isPermanentRequiredField(field)) {
            toast.error(`"${label}" is a core required field and cannot be deleted.`);
            return;
        }

        removeField(id)
        if (expandedSettingsId === id) setExpandedSettingsId(null)
        if (expandedOptionsId === id) setExpandedOptionsId(null)

        const remainingFields = useFormBuilderStore.getState().fields.map((f, idx) => ({
            ...f,
            order: idx,
            name: (f.name && f.name.trim()) || (f.label && f.label.toLowerCase().replace(/[^a-z0-9_]/gi, '_')) || `field_${idx}`,
            label: f.label.trim()
        }))

        try {
            await formService.saveForm({ ...form, fields: remainingFields })
            toast.success(`Permanently deleted "${label || 'Field'}"`)
        } catch (err: any) {
            console.error(err)
            toast.error("Failed to save deletion to database")
        }
    }

    // Helper to add dropdown option
    const addOption = (fieldId: string, currentOptions: any[] = []) => {
        const opts = currentOptions || []
        const optNum = opts.length + 1
        const newOpt = { label: `Option ${optNum}`, value: `option_${optNum}` }
        updateField(fieldId, { options: [...opts, newOpt] })
    }

    const removeOption = (fieldId: string, currentOptions: any[] = [], idx: number) => {
        const next = [...(currentOptions || [])]
        next.splice(idx, 1)
        updateField(fieldId, { options: next })
    }

    const updateOptionLabel = (fieldId: string, currentOptions: any[] = [], idx: number, newLabel: string) => {
        const opts = currentOptions || []
        const next = opts.map((opt, i) => {
            if (i !== idx) return opt
            const optObj = typeof opt === 'string' ? { label: opt, value: opt.toLowerCase().replace(/\s+/g, '_') } : { ...opt }
            return {
                ...optObj,
                label: newLabel,
                value: newLabel.trim() ? newLabel.toLowerCase().replace(/[^a-z0-9_]/gi, '_') : `option_${idx + 1}`
            }
        })
        updateField(fieldId, { options: next })
    }

    return (
        <div ref={containerRef} className="flex-1 min-h-0 flex flex-col w-full scroll-smooth">
            {/* Sticky Top Action Bar */}
            <div className="sticky top-0 z-30 bg-background/95 backdrop-blur-md border-b border-border/50 py-2 sm:py-2.5 px-0 mb-3 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2.5">
                <div className="flex items-center gap-2.5">
                    <Button 
                        variant="outline" 
                        size="sm" 
                        onClick={onBack} 
                        className="rounded-lg h-7.5 px-2.5 text-xs font-medium cursor-pointer shadow-2xs hover:bg-muted gap-1.5"
                    >
                        <ArrowLeftIcon className="size-3.5" />
                        <span>Back to Forms</span>
                    </Button>
                    <div className="h-4 w-px bg-border/60 hidden sm:block" />
                    <div className="flex flex-wrap items-center gap-2">
                        <h2 className="text-sm sm:text-base font-bold tracking-tight text-foreground flex items-center gap-2">
                            {form.name}
                        </h2>
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-muted/80 border border-border/60 text-muted-foreground text-[11px] font-semibold">
                            <Layers className="size-3 text-muted-foreground" />
                            {fields.length} {fields.length === 1 ? 'Field' : 'Fields'}
                        </span>
                    </div>
                </div>

                <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
                    <Button 
                        variant="outline" 
                        size="sm" 
                        onClick={handleAddField} 
                        className="rounded-lg h-7.5 px-3 text-xs font-semibold cursor-pointer shadow-2xs hover:bg-muted gap-1.5"
                    >
                        <PlusIcon className="size-3.5 text-primary" />
                        <span>Add Field</span>
                    </Button>
                </div>
            </div>

            {/* Main Form Fields Editor - Full width matching other pages */}
            <div className="w-full space-y-2.5 pb-4">

                {/* Empty State */}
                {fields.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-12 px-4 border-2 border-dashed border-border/60 rounded-xl bg-card/40 text-center">
                        <CheckSquare className="size-8 mb-2 text-primary/40" />
                        <h3 className="text-sm font-bold text-foreground">No fields in this form schema</h3>
                        <p className="text-xs text-muted-foreground max-w-md mt-0.5 mb-4">
                            Start building your form by adding simple horizontal field rows below.
                        </p>
                        <Button onClick={handleAddField} size="sm" className="rounded-lg h-7.5 px-3 text-xs gap-1.5 cursor-pointer">
                            <PlusIcon className="size-3.5" />
                            Add Your First Field
                        </Button>
                    </div>
                ) : (
                    <div className="space-y-2">
                        {/* Table Header Bar - Proportioned 12-column grid */}
                        <div className="hidden sm:grid grid-cols-12 items-center gap-3 px-3.5 py-1.5 text-[10px] sm:text-[11px] font-semibold text-muted-foreground uppercase tracking-wider bg-muted/25 rounded-lg border border-border/50">
                            <div className="col-span-2">Order</div>
                            <div className="col-span-3">Field Name</div>
                            <div className="col-span-2">Input Type</div>
                            <div className="col-span-5 text-right pr-2">Settings & Actions</div>
                        </div>

                        {/* Horizontal Field Rows */}
                        {fields.sort((a, b) => a.order - b.order).map((field, index) => {
                            const isPermanent = isPermanentRequiredField(field)
                            const isRequired = isPermanent || Boolean(field.required || (field.validations && field.validations.some(v => v.type === 'required')))
                            const isOptionsOpen = expandedOptionsId === field.id
                            const isSettingsOpen = expandedSettingsId === field.id
                            const isChoiceField = field.type === 'select' || field.type === 'radio' || field.type === 'checkbox'

                            return (
                                <div 
                                    key={field.id}
                                    id={`field-row-${field.id}`}
                                    className={`bg-card border transition-all duration-200 rounded-lg shadow-2xs overflow-hidden ${
                                        newlyAddedId === field.id
                                            ? 'border-primary ring-2 ring-primary/40 shadow-xs'
                                            : isSettingsOpen || isOptionsOpen 
                                                ? 'border-primary/50 ring-1 ring-primary/20' 
                                                : 'border-border/60 hover:border-border'
                                    }`}
                                >
                                    {/* HORIZONTAL FIELD ROW - 12-column grid matching table header */}
                                    <div className="p-2 sm:px-3 sm:py-1.5 flex flex-col sm:grid sm:grid-cols-12 items-start sm:items-center gap-2.5 sm:gap-3">
                                        
                                        {/* Col 1-2: Reorder arrows & Field # */}
                                        <div className="sm:col-span-2 flex items-center gap-2 shrink-0">
                                            <div className="flex items-center gap-0.5 bg-muted/50 rounded-md p-0.5 border border-border/40">
                                                <Button 
                                                    type="button"
                                                    variant="ghost" 
                                                    size="icon" 
                                                    className="h-5 w-5 rounded hover:bg-muted text-muted-foreground hover:text-foreground cursor-pointer" 
                                                    disabled={index === 0} 
                                                    onClick={() => reorderFields(index, index - 1)}
                                                    title="Move Up"
                                                >
                                                    <ArrowUpIcon className="size-3" />
                                                </Button>
                                                <Button 
                                                    type="button"
                                                    variant="ghost" 
                                                    size="icon" 
                                                    className="h-5 w-5 rounded hover:bg-muted text-muted-foreground hover:text-foreground cursor-pointer" 
                                                    disabled={index === fields.length - 1} 
                                                    onClick={() => reorderFields(index, index + 1)}
                                                    title="Move Down"
                                                >
                                                    <ArrowDownIcon className="size-3" />
                                                </Button>
                                            </div>
                                            <span className="inline-flex items-center justify-center size-5 rounded-full bg-primary/10 text-primary text-[10px] font-bold font-mono">
                                                #{index + 1}
                                            </span>
                                        </div>

                                        {/* Col 3-5: Field Name */}
                                        <div className="sm:col-span-3 w-full">
                                            <Input 
                                                value={field.label} 
                                                onChange={(e) => {
                                                    const newLabel = e.target.value;
                                                    const shouldAutoUpdateName = !field.name || field.name.startsWith('field_');
                                                    const autoName = shouldAutoUpdateName 
                                                        ? newLabel.trim().toLowerCase().replace(/[^a-z0-9_]+/g, '_').replace(/^_+|_+$/g, '') 
                                                        : field.name;
                                                    updateField(field.id, { 
                                                        label: newLabel,
                                                        ...(shouldAutoUpdateName && autoName ? { name: autoName } : {})
                                                    });
                                                }} 
                                                placeholder="e.g. Employee Name, Email, Department"
                                                className="h-7.5 rounded-lg bg-background border-border/70 font-medium text-xs px-2.5"
                                            />
                                        </div>

                                        {/* Col 6-7: Input Type Selector */}
                                        <div className="sm:col-span-2 w-full">
                                            <Select 
                                                value={field.type} 
                                                onValueChange={(val: any) => {
                                                    const isText = val === 'text' || val === 'textarea' || val === 'password';
                                                    let vals = field.validations ? [...field.validations] : [];
                                                    if (!isText) {
                                                        vals = vals.filter((v: any) => v.type !== 'alphanumeric');
                                                    }
                                                    updateField(field.id, { type: val, validations: vals });
                                                }}
                                            >
                                                <SelectTrigger className="flex h-7.5 w-full rounded-lg border border-border/70 bg-background px-2.5 py-1 text-xs font-medium focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-primary cursor-pointer">
                                                    <SelectValue placeholder="Select type" />
                                                </SelectTrigger>
                                                <SelectContent className="rounded-lg text-xs">
                                                    <SelectItem value="text" className="text-xs py-1.5">Text Input</SelectItem>
                                                    <SelectItem value="number" className="text-xs py-1.5">Number</SelectItem>
                                                    <SelectItem value="email" className="text-xs py-1.5">Email Address</SelectItem>
                                                    <SelectItem value="date" className="text-xs py-1.5">Date / Calendar</SelectItem>
                                                    <SelectItem value="select" className="text-xs py-1.5">Dropdown Select</SelectItem>
                                                    <SelectItem value="checkbox" className="text-xs py-1.5">Checkbox</SelectItem>
                                                    <SelectItem value="radio" className="text-xs py-1.5">Radio Buttons</SelectItem>
                                                    <SelectItem value="textarea" className="text-xs py-1.5">Long Text</SelectItem>
                                                    <SelectItem value="switch" className="text-xs py-1.5">Yes/No Switch</SelectItem>
                                                </SelectContent>
                                            </Select>
                                        </div>

                                        {/* Col 8-12: Required Toggle, Options Button, Settings Button, Delete */}
                                        <div className="sm:col-span-5 flex items-center justify-end gap-1.5 sm:gap-2 w-full">
                                            {isPermanent ? (
                                                <div 
                                                    title="System Core Field: Name and Mobile Number are always required and cannot be changed"
                                                    className="inline-flex items-center gap-1.5 cursor-not-allowed select-none px-2 py-1 rounded-md border text-[11px] font-medium shrink-0 bg-primary/15 border-primary/40 text-primary shadow-2xs opacity-95"
                                                >
                                                    <Lock className="size-3 text-primary shrink-0" />
                                                    <input 
                                                        type="checkbox" 
                                                        className="size-3 rounded border-border text-primary cursor-not-allowed"
                                                        checked={true}
                                                        disabled={true}
                                                        readOnly
                                                    />
                                                    <span>Required (Always)</span>
                                                </div>
                                            ) : (
                                                <label 
                                                    title="Toggle whether this field is mandatory"
                                                    className={`inline-flex items-center gap-1.5 cursor-pointer select-none px-2 py-1 rounded-md border text-[11px] font-medium transition-all shrink-0 ${
                                                        isRequired 
                                                            ? 'bg-primary/15 border-primary/40 text-primary shadow-2xs' 
                                                            : 'bg-background border-border/60 text-muted-foreground hover:text-foreground hover:border-border'
                                                    }`}
                                                >
                                                    <input 
                                                        type="checkbox" 
                                                        className="size-3 rounded border-border text-primary focus:ring-primary cursor-pointer"
                                                        checked={isRequired}
                                                        onChange={(e) => {
                                                            const isReq = e.target.checked
                                                            let vals = field.validations ? [...field.validations] : []
                                                            if (isReq) {
                                                                if (!vals.some(v => v.type === 'required')) {
                                                                    vals.push({ type: 'required', message: 'This field is required' })
                                                                }
                                                            } else {
                                                                vals = vals.filter(v => v.type !== 'required')
                                                            }
                                                            updateField(field.id, { validations: vals, required: isReq })
                                                        }}
                                                    />
                                                    <span>Required</span>
                                                </label>
                                            )}

                                            {isChoiceField && (
                                                <Button
                                                    type="button"
                                                    variant={isOptionsOpen ? "default" : "outline"}
                                                    size="sm"
                                                    onClick={() => {
                                                        setExpandedOptionsId(isOptionsOpen ? null : field.id)
                                                        setExpandedSettingsId(null)
                                                    }}
                                                    className="h-7 rounded-md text-[11px] font-medium gap-1 px-2 shrink-0 cursor-pointer shadow-2xs"
                                                >
                                                    <ListFilter className="size-3 text-blue-500" />
                                                    <span>{field.options?.length || 0} Options</span>
                                                </Button>
                                            )}

                                            <Button
                                                type="button"
                                                variant={isSettingsOpen ? "default" : "outline"}
                                                size="sm"
                                                onClick={() => {
                                                    setExpandedSettingsId(isSettingsOpen ? null : field.id)
                                                    setExpandedOptionsId(null)
                                                }}
                                                className="h-7 rounded-md text-[11px] font-medium gap-1 px-2 shrink-0 cursor-pointer shadow-2xs"
                                                title="Help Text, Placeholders & Validation"
                                            >
                                                <Sliders className="size-3" />
                                                <span>Settings</span>
                                            </Button>

                                            {isPermanent ? (
                                                <Button 
                                                    type="button"
                                                    variant="ghost" 
                                                    size="icon" 
                                                    disabled
                                                    className="h-7 w-7 text-muted-foreground/30 cursor-not-allowed rounded-md shrink-0" 
                                                    title="Core required field cannot be deleted"
                                                >
                                                    <Lock className="size-3 text-muted-foreground/40" />
                                                </Button>
                                            ) : (
                                                <Button 
                                                    type="button"
                                                    variant="ghost" 
                                                    size="icon" 
                                                    className="h-7 w-7 text-destructive hover:text-destructive hover:bg-destructive/10 rounded-md shrink-0 cursor-pointer" 
                                                    onClick={() => setFieldToDelete({ id: field.id, label: field.label })}
                                                    title="Delete Field"
                                                >
                                                    <TrashIcon className="size-3.5" />
                                                </Button>
                                            )}
                                        </div>
                                    </div>

                                    {/* COLLAPSIBLE OPTIONS DRAWER (for select / radio / checkbox) */}
                                    {isOptionsOpen && (
                                        <div className="bg-muted/15 border-t border-border/40 p-3 sm:p-3.5 space-y-2.5">
                                            <div className="flex items-center justify-between">
                                                <h4 className="text-xs font-bold text-foreground flex items-center gap-1.5">
                                                    <ListFilter className="size-3.5 text-primary" />
                                                    Selectable Options for "{field.label}"
                                                </h4>
                                                <Button
                                                    type="button"
                                                    size="sm"
                                                    variant="secondary"
                                                    onClick={() => addOption(field.id, field.options)}
                                                    className="h-6.5 px-2.5 rounded-md text-[11px] font-medium gap-1 cursor-pointer shadow-2xs"
                                                >
                                                    <PlusIcon className="size-3 text-primary" />
                                                    Add Option
                                                </Button>
                                            </div>

                                            {(!field.options || field.options.length === 0) ? (
                                                <p className="text-[11px] text-muted-foreground italic">
                                                    No options added yet. Click "Add Option" to create dropdown choices.
                                                </p>
                                            ) : (
                                                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2">
                                                    {field.options.map((opt: any, idx: number) => {
                                                        const labelVal = typeof opt === 'string' ? opt : (opt?.label ?? '')
                                                        return (
                                                            <div key={idx} className="flex items-center gap-1.5 bg-background border border-border/60 rounded-md p-1 px-2.5">
                                                                <span className="text-[10px] font-mono font-bold text-muted-foreground">#{idx + 1}</span>
                                                                <Input 
                                                                    value={labelVal} 
                                                                    onChange={(e) => updateOptionLabel(field.id, field.options || [], idx, e.target.value)} 
                                                                    className="h-6 text-xs border-0 shadow-none focus-visible:ring-0 px-1 font-medium"
                                                                    placeholder="Option Label"
                                                                />
                                                                <Button 
                                                                    type="button"
                                                                    variant="ghost" 
                                                                    size="icon" 
                                                                    className="h-5 w-5 text-muted-foreground hover:text-destructive rounded cursor-pointer shrink-0" 
                                                                    onClick={() => removeOption(field.id, field.options || [], idx)}
                                                                >
                                                                    <XIcon className="size-3" />
                                                                </Button>
                                                            </div>
                                                        )
                                                    })}
                                                </div>
                                            )}
                                        </div>
                                    )}

                                    {/* COLLAPSIBLE SETTINGS DRAWER (Placeholder, Helper Text & Rules) */}
                                    {isSettingsOpen && (
                                        <div className="bg-muted/15 border-t border-border/40 p-3 sm:p-3.5 space-y-2.5">
                                            <h4 className="text-xs font-bold text-foreground flex items-center gap-1.5">
                                                <Sliders className="size-3.5 text-primary" />
                                                Field Configuration & Validation Settings
                                            </h4>

                                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                                <div className="space-y-1">
                                                    <label className="text-[11px] font-semibold text-muted-foreground flex items-center gap-1">
                                                        <span>Placeholder Text</span>
                                                        <InfoIcon className="size-3 text-muted-foreground/60" />
                                                    </label>
                                                    <Input 
                                                        value={field.placeholder || ''} 
                                                        onChange={(e) => updateField(field.id, { placeholder: e.target.value })} 
                                                        placeholder="e.g. Enter full name..."
                                                        className="h-7.5 rounded-lg bg-background border-border/60 text-xs px-2.5"
                                                    />
                                                </div>

                                                <div className="space-y-1">
                                                    <label className="text-[11px] font-semibold text-muted-foreground flex items-center gap-1">
                                                        <span>Helper Description Text</span>
                                                        <HelpCircle className="size-3 text-muted-foreground/60" />
                                                    </label>
                                                    <Input 
                                                        value={field.helperText || ''} 
                                                        onChange={(e) => updateField(field.id, { helperText: e.target.value })} 
                                                        placeholder="e.g. As shown on official identification document"
                                                        className="h-7.5 rounded-lg bg-background border-border/60 text-xs px-2.5"
                                                    />
                                                </div>
                                            </div>

                                            {/* Validation Rules */}
                                            <div className="pt-2 border-t border-border/40 space-y-1.5">
                                                <span className="text-[11px] font-semibold text-muted-foreground flex items-center gap-1.5">
                                                    <ShieldCheck className="size-3.5 text-emerald-500" />
                                                    Special Constraints:
                                                </span>

                                                {field.type === 'text' && (
                                                    <label className="inline-flex items-center gap-2 text-[11px] font-medium text-foreground cursor-pointer select-none">
                                                        <input 
                                                            type="checkbox"
                                                            className="size-3.5 rounded border-border text-primary focus:ring-primary cursor-pointer"
                                                            checked={field.validations?.some(v => v.type === 'alphanumeric') || false}
                                                            onChange={(e) => {
                                                                let vals = field.validations ? [...field.validations] : []
                                                                if (e.target.checked) {
                                                                    if (!vals.some(v => v.type === 'alphanumeric')) {
                                                                        vals.push({ type: 'alphanumeric', message: 'Must be alphanumeric' })
                                                                    }
                                                                } else {
                                                                    vals = vals.filter(v => v.type !== 'alphanumeric')
                                                                }
                                                                updateField(field.id, { validations: vals })
                                                            }}
                                                        />
                                                        <span>Enforce Alphanumeric Characters Only</span>
                                                    </label>
                                                )}

                                                {field.type === 'email' && (
                                                    <label className="inline-flex items-center gap-2 text-[11px] font-medium text-foreground cursor-pointer select-none">
                                                        <input 
                                                            type="checkbox"
                                                            className="size-3.5 rounded border-border text-primary focus:ring-primary cursor-pointer"
                                                            checked={field.validations?.some(v => v.type === 'email') || false}
                                                            onChange={(e) => {
                                                                let vals = field.validations ? [...field.validations] : []
                                                                if (e.target.checked) {
                                                                    if (!vals.some(v => v.type === 'email')) {
                                                                        vals.push({ type: 'email', message: 'Must be a valid email' })
                                                                    }
                                                                } else {
                                                                    vals = vals.filter(v => v.type !== 'email')
                                                                }
                                                                updateField(field.id, { validations: vals })
                                                            }}
                                                        />
                                                        <span>Must be valid email format</span>
                                                    </label>
                                                )}
                                            </div>
                                        </div>
                                    )}
                                </div>
                            )
                        })}
                    </div>
                )}

                {/* Anchor for smooth scroll down */}
                <div ref={bottomRef} className="h-0 w-full" />

                {/* Bottom Actions Card - Compact, sleek & aligned */}
                <div className="sticky bottom-1 z-20 bg-card/95 backdrop-blur-md border border-border/60 rounded-xl px-3.5 py-2 shadow-xs flex flex-col sm:flex-row items-center justify-between gap-2.5 mt-3 shrink-0">
                    <div className="flex flex-wrap items-center gap-2.5">
                        <Button 
                            type="button"
                            variant="outline" 
                            size="sm" 
                            onClick={handleAddField} 
                            className="rounded-lg h-7.5 px-3 text-xs font-medium cursor-pointer shadow-2xs hover:bg-muted gap-1.5"
                        >
                            <PlusIcon className="size-3.5 text-primary" />
                            <span>Add Field Row</span>
                        </Button>
                        <span className="text-[11px] text-muted-foreground font-medium hidden sm:inline-block">
                            {fields.length} {fields.length === 1 ? 'field' : 'fields'} configured in this form schema
                        </span>
                    </div>

                    <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
                        <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            onClick={onBack}
                            className="rounded-lg h-7.5 px-3 text-xs font-medium cursor-pointer shadow-2xs hover:bg-muted gap-1.5"
                        >
                            <ArrowLeftIcon className="size-3.5" />
                            <span>Back to Forms</span>
                        </Button>
                        <Button 
                            type="button"
                            size="sm" 
                            onClick={handleSave} 
                            disabled={saving}
                            className="rounded-lg h-7.5 px-3.5 text-xs font-semibold gap-1.5 shadow-xs bg-primary text-primary-foreground hover:bg-primary/90 cursor-pointer"
                        >
                            {saving ? (
                                <>
                                    <div className="size-3.5 border-2 border-primary-foreground/30 border-t-primary-foreground rounded-full animate-spin" />
                                    <span>Saving Schema...</span>
                                </>
                            ) : (
                                <>
                                    <SaveIcon className="size-3.5" />
                                    <span>Save Form Schema</span>
                                </>
                            )}
                        </Button>
                    </div>
                </div>
            </div>

            {/* Confirmation Dialog for Field Deletion */}
            <ConfirmDialog
                isOpen={Boolean(fieldToDelete)}
                onClose={() => setFieldToDelete(null)}
                onConfirm={() => {
                    if (fieldToDelete) {
                        handleRemoveField(fieldToDelete.id, fieldToDelete.label)
                        setFieldToDelete(null)
                    }
                }}
                title="Delete Form Field"
                description={`Are you sure you want to delete the field "${fieldToDelete?.label || 'Field'}"? You must click "Save Form Schema" afterward to apply changes.`}
                confirmText="Delete Field"
                variant="destructive"
            />
        </div>
    )
}
