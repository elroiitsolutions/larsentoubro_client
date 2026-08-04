import React, { useEffect, useState } from "react"
import { useFormBuilderStore } from "@/store/useFormBuilderStore"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { 
    ArrowLeftIcon, 
    ArrowUpIcon, 
    ArrowDownIcon, 
    TrashIcon, 
    PlusIcon, 
    SaveIcon, 
    Tag, 
    Sliders, 
    CheckSquare, 
    Layers, 
    Sparkles, 
    HelpCircle, 
    ShieldCheck, 
    ListFilter, 
    XIcon,
    InfoIcon
} from "lucide-react"
import { toast } from "sonner"

export function FormEditor({ form, onBack, onSave }: { form: any; onBack: () => void; onSave: (updatedForm: any) => void }) {
    const { fields, loadForm, addField, updateField, removeField, reorderFields } = useFormBuilderStore()
    const [expandedSettingsId, setExpandedSettingsId] = useState<string | null>(null)
    const [expandedOptionsId, setExpandedOptionsId] = useState<string | null>(null)

    useEffect(() => {
        loadForm(form)
    }, [form, loadForm])

    const handleSave = () => {
        const invalidFields = fields.filter(f => !f.label || !f.label.trim())
        if (invalidFields.length > 0) {
            toast.error("Please provide a name for all fields before saving")
            return
        }
        onSave({ ...form, fields })
    }

    const handleAddField = () => {
        const nextOrder = fields.length
        addField({
            id: `f_${Date.now()}`,
            name: `field_${nextOrder}`,
            label: `New Field ${nextOrder + 1}`,
            type: "text",
            order: nextOrder
        })
        toast.success("New field added")
    }

    const handleRemoveField = (id: string, label: string) => {
        removeField(id)
        if (expandedSettingsId === id) setExpandedSettingsId(null)
        if (expandedOptionsId === id) setExpandedOptionsId(null)
        toast.success(`Removed "${label || 'Field'}"`)
    }

    // Helper to add dropdown option
    const addOption = (fieldId: string, currentOptions: any[] = []) => {
        const optNum = currentOptions.length + 1
        const newOpt = { label: `Option ${optNum}`, value: `option_${optNum}` }
        updateField(fieldId, { options: [...currentOptions, newOpt] })
    }

    const removeOption = (fieldId: string, currentOptions: any[], idx: number) => {
        const next = [...currentOptions]
        next.splice(idx, 1)
        updateField(fieldId, { options: next })
    }

    const updateOptionLabel = (fieldId: string, currentOptions: any[], idx: number, newLabel: string) => {
        const next = [...currentOptions]
        next[idx] = { ...next[idx], label: newLabel, value: newLabel.toLowerCase().replace(/\s+/g, '_') }
        updateField(fieldId, { options: next })
    }

    return (
        <div className="flex-1 min-h-0 overflow-y-auto flex flex-col w-full pr-1">
            {/* Sticky Top Action Bar */}
            <div className="sticky top-0 z-30 bg-background/95 backdrop-blur-md border-b border-border/60 -mx-1 px-4 sm:px-6 py-3.5 mb-6 shadow-xs flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                    <Button 
                        variant="outline" 
                        size="sm" 
                        onClick={onBack} 
                        className="rounded-xl h-9 gap-2 font-medium cursor-pointer shadow-xs hover:bg-muted"
                    >
                        <ArrowLeftIcon className="size-4" />
                        <span>Back to Forms</span>
                    </Button>
                    <div className="h-5 w-px bg-border/60 hidden sm:block" />
                    <div className="flex flex-wrap items-center gap-2">
                        <h2 className="text-lg sm:text-xl font-bold tracking-tight text-foreground flex items-center gap-2">
                            {form.name}
                        </h2>
                        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-md bg-primary/10 text-primary text-xs font-mono font-semibold">
                            <Tag className="size-3" />
                            {form.slug}
                        </span>
                        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-muted border border-border/60 text-muted-foreground text-xs font-semibold">
                            <Layers className="size-3" />
                            {fields.length} {fields.length === 1 ? 'Field' : 'Fields'}
                        </span>
                    </div>
                </div>

                <div className="flex items-center gap-2.5 w-full sm:w-auto justify-end">
                    <Button 
                        variant="outline" 
                        size="sm" 
                        onClick={handleAddField} 
                        className="rounded-xl h-9 gap-1.5 font-semibold cursor-pointer shadow-xs"
                    >
                        <PlusIcon className="size-4 text-primary" />
                        <span>Add Field</span>
                    </Button>
                    <Button 
                        size="sm" 
                        onClick={handleSave} 
                        className="rounded-xl h-9 gap-1.5 font-semibold shadow-sm bg-primary text-primary-foreground hover:bg-primary/90 cursor-pointer"
                    >
                        <SaveIcon className="size-4" />
                        <span>Save Form Schema</span>
                    </Button>
                </div>
            </div>

            {/* Main Form Fields Editor (Max-width expanded to 6xl = 1152px for plenty of horizontal room) */}
            <div className="max-w-6xl mx-auto w-full space-y-4 pb-20">
                {/* Minimal Header Guidance */}
                <div className="bg-muted/30 border border-border/50 rounded-xl px-5 py-3.5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                    <div className="flex items-center gap-2 text-xs text-muted-foreground">
                        <Sparkles className="size-4 text-primary shrink-0" />
                        <span>
                            All fields are displayed as clean <strong>horizontal rows</strong>. Click <strong>Settings</strong> to customize placeholders or rules.
                        </span>
                    </div>
                    <Button 
                        variant="secondary" 
                        size="sm" 
                        onClick={handleAddField}
                        className="rounded-xl text-xs font-semibold h-8 gap-1.5 shrink-0 cursor-pointer"
                    >
                        <PlusIcon className="size-3.5" />
                        Add Field Row
                    </Button>
                </div>

                {/* Empty State */}
                {fields.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-16 px-6 border-2 border-dashed border-border/60 rounded-2xl bg-card/40 text-center">
                        <CheckSquare className="size-12 mb-3 text-primary/40" />
                        <h3 className="text-base font-bold text-foreground">No fields in this form schema</h3>
                        <p className="text-xs text-muted-foreground max-w-md mt-1 mb-5">
                            Start building your form by adding simple horizontal field rows below.
                        </p>
                        <Button onClick={handleAddField} className="rounded-xl gap-2 cursor-pointer">
                            <PlusIcon className="size-4" />
                            Add Your First Field
                        </Button>
                    </div>
                ) : (
                    <div className="space-y-3">
                        {/* Table Header Bar - Perfectly proportioned 12-column grid */}
                        <div className="hidden sm:grid grid-cols-12 items-center gap-4 px-5 py-2.5 text-xs font-bold text-muted-foreground uppercase tracking-wider bg-muted/40 rounded-xl border border-border/50">
                            <div className="col-span-2">Order</div>
                            <div className="col-span-3">Field Name</div>
                            <div className="col-span-2">Input Type</div>
                            <div className="col-span-5 text-right pr-2">Settings & Actions</div>
                        </div>

                        {/* Horizontal Field Rows */}
                        {fields.sort((a, b) => a.order - b.order).map((field, index) => {
                            const isRequired = field.validations?.some(v => v.type === 'required') || false
                            const isOptionsOpen = expandedOptionsId === field.id
                            const isSettingsOpen = expandedSettingsId === field.id
                            const isChoiceField = field.type === 'select' || field.type === 'radio' || field.type === 'checkbox'

                            return (
                                <div 
                                    key={field.id}
                                    className={`bg-card border transition-all rounded-xl shadow-xs overflow-hidden ${
                                        isSettingsOpen || isOptionsOpen 
                                            ? 'border-primary/50 ring-1 ring-primary/20' 
                                            : 'border-border/60 hover:border-border'
                                    }`}
                                >
                                    {/* HORIZONTAL FIELD ROW - 12-column grid matching table header */}
                                    <div className="p-3.5 sm:px-5 flex flex-col sm:grid sm:grid-cols-12 items-start sm:items-center gap-4">
                                        
                                        {/* Col 1-2: Reorder arrows & Field # (16.6% width) */}
                                        <div className="sm:col-span-2 flex items-center gap-2.5 shrink-0">
                                            <div className="flex items-center gap-0.5 bg-muted/60 rounded-lg p-0.5 border border-border/40">
                                                <Button 
                                                    type="button"
                                                    variant="ghost" 
                                                    size="icon" 
                                                    className="h-6 w-6 rounded hover:bg-muted text-muted-foreground hover:text-foreground cursor-pointer" 
                                                    disabled={index === 0} 
                                                    onClick={() => reorderFields(index, index - 1)}
                                                    title="Move Up"
                                                >
                                                    <ArrowUpIcon className="size-3.5" />
                                                </Button>
                                                <Button 
                                                    type="button"
                                                    variant="ghost" 
                                                    size="icon" 
                                                    className="h-6 w-6 rounded hover:bg-muted text-muted-foreground hover:text-foreground cursor-pointer" 
                                                    disabled={index === fields.length - 1} 
                                                    onClick={() => reorderFields(index, index + 1)}
                                                    title="Move Down"
                                                >
                                                    <ArrowDownIcon className="size-3.5" />
                                                </Button>
                                            </div>
                                            <span className="inline-flex items-center justify-center size-6 rounded-full bg-primary/10 text-primary text-xs font-bold font-mono">
                                                #{index + 1}
                                            </span>
                                        </div>

                                        {/* Col 3-5: Field Name (25% width) */}
                                        <div className="sm:col-span-3 w-full">
                                            <Input 
                                                value={field.label} 
                                                onChange={(e) => updateField(field.id, { label: e.target.value })} 
                                                placeholder="e.g. Employee Name, Email, Department"
                                                className="h-9 rounded-xl bg-background border-border/70 font-semibold text-sm"
                                            />
                                        </div>

                                        {/* Col 6-7: Input Type Selector (16.6% width) */}
                                        <div className="sm:col-span-2 w-full">
                                            <select 
                                                className="flex h-9 w-full rounded-xl border border-border/70 bg-background px-3 py-1.5 text-sm font-medium focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 cursor-pointer"
                                                value={field.type} 
                                                onChange={(e) => updateField(field.id, { type: e.target.value as any })}
                                            >
                                                <option value="text">Text Input</option>
                                                <option value="number">Number</option>
                                                <option value="email">Email Address</option>
                                                <option value="select">Dropdown Select</option>
                                                <option value="checkbox">Checkbox</option>
                                                <option value="radio">Radio Buttons</option>
                                                <option value="textarea">Long Text</option>
                                                <option value="switch">Yes/No Switch</option>
                                            </select>
                                        </div>

                                        {/* Col 8-12: Required Toggle, Options Button, Settings Button, Delete (41.6% width - generous room!) */}
                                        <div className="sm:col-span-5 flex items-center justify-end gap-2.5 w-full">
                                            <label 
                                                title="Toggle whether this field is mandatory"
                                                className={`inline-flex items-center gap-1.5 cursor-pointer select-none px-3 py-1.5 rounded-xl border text-xs font-semibold transition-all shrink-0 ${
                                                    isRequired 
                                                        ? 'bg-primary/15 border-primary/40 text-primary shadow-xs' 
                                                        : 'bg-background border-border/60 text-muted-foreground hover:text-foreground hover:border-border'
                                                }`}
                                            >
                                                <input 
                                                    type="checkbox" 
                                                    className="size-3.5 rounded border-border text-primary focus:ring-primary cursor-pointer"
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
                                                        updateField(field.id, { validations: vals })
                                                    }}
                                                />
                                                <span>Required</span>
                                            </label>

                                            {isChoiceField && (
                                                <Button
                                                    type="button"
                                                    variant={isOptionsOpen ? "default" : "outline"}
                                                    size="sm"
                                                    onClick={() => {
                                                        setExpandedOptionsId(isOptionsOpen ? null : field.id)
                                                        setExpandedSettingsId(null)
                                                    }}
                                                    className="h-9 rounded-xl text-xs font-semibold gap-1.5 px-3 shrink-0 cursor-pointer shadow-xs"
                                                >
                                                    <ListFilter className="size-3.5 text-blue-500" />
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
                                                className="h-9 rounded-xl text-xs font-semibold gap-1.5 px-3 shrink-0 cursor-pointer shadow-xs"
                                                title="Help Text, Placeholders & Validation"
                                            >
                                                <Sliders className="size-3.5" />
                                                <span>Settings</span>
                                            </Button>

                                            <Button 
                                                type="button"
                                                variant="ghost" 
                                                size="icon" 
                                                className="h-9 w-9 text-destructive hover:text-destructive hover:bg-destructive/10 rounded-xl shrink-0 cursor-pointer" 
                                                onClick={() => handleRemoveField(field.id, field.label)}
                                                title="Delete Field"
                                            >
                                                <TrashIcon className="size-4" />
                                            </Button>
                                        </div>
                                    </div>

                                    {/* COLLAPSIBLE OPTIONS DRAWER (for select / radio / checkbox) */}
                                    {isOptionsOpen && (
                                        <div className="bg-muted/20 border-t border-border/40 p-5 space-y-4">
                                            <div className="flex items-center justify-between">
                                                <h4 className="text-xs font-bold text-foreground flex items-center gap-2">
                                                    <ListFilter className="size-4 text-primary" />
                                                    Selectable Options for "{field.label}"
                                                </h4>
                                                <Button
                                                    type="button"
                                                    size="sm"
                                                    variant="secondary"
                                                    onClick={() => addOption(field.id, field.options)}
                                                    className="h-8 rounded-xl text-xs font-semibold gap-1.5 cursor-pointer shadow-xs"
                                                >
                                                    <PlusIcon className="size-3.5" />
                                                    Add Option
                                                </Button>
                                            </div>

                                            {(!field.options || field.options.length === 0) ? (
                                                <p className="text-xs text-muted-foreground italic">
                                                    No options added yet. Click "Add Option" above.
                                                </p>
                                            ) : (
                                                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                                                    {field.options.map((opt: any, optIdx: number) => (
                                                        <div key={optIdx} className="flex items-center gap-2 bg-background p-2 rounded-xl border border-border/60 shadow-xs">
                                                            <span className="text-xs font-mono text-muted-foreground w-6 text-center">
                                                                {optIdx + 1}.
                                                            </span>
                                                            <Input 
                                                                value={opt.label}
                                                                onChange={(e) => updateOptionLabel(field.id, field.options || [], optIdx, e.target.value)}
                                                                className="h-8 text-xs rounded-lg flex-1 border-border/60"
                                                                placeholder="Option label..."
                                                            />
                                                            <Button
                                                                type="button"
                                                                variant="ghost"
                                                                size="icon"
                                                                onClick={() => removeOption(field.id, field.options || [], optIdx)}
                                                                className="h-7 w-7 text-destructive hover:bg-destructive/10 rounded-lg shrink-0 cursor-pointer"
                                                            >
                                                                <XIcon className="size-3.5" />
                                                            </Button>
                                                        </div>
                                                    ))}
                                                </div>
                                            )}
                                        </div>
                                    )}

                                    {/* COLLAPSIBLE SETTINGS DRAWER (Placeholder, Helper Text & Rules) */}
                                    {isSettingsOpen && (
                                        <div className="bg-muted/20 border-t border-border/40 p-5 space-y-4">
                                            <div className="flex items-center justify-between">
                                                <h4 className="text-xs font-bold text-foreground flex items-center gap-2">
                                                    <Sliders className="size-4 text-primary" />
                                                    Help Text & Advanced Rules for "{field.label}"
                                                </h4>
                                                <Button
                                                    type="button"
                                                    variant="ghost"
                                                    size="sm"
                                                    onClick={() => setExpandedSettingsId(null)}
                                                    className="h-7 text-xs text-muted-foreground hover:text-foreground cursor-pointer"
                                                >
                                                    Close
                                                </Button>
                                            </div>

                                            {/* 2-Column Horizontal Settings Grid */}
                                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                                                <div className="space-y-1.5">
                                                    <label className="text-xs font-semibold text-foreground">
                                                        Placeholder Text
                                                    </label>
                                                    <Input 
                                                        value={field.placeholder || ''} 
                                                        onChange={(e) => updateField(field.id, { placeholder: e.target.value })} 
                                                        placeholder="e.g. Enter value here..."
                                                        className="h-9 rounded-xl bg-background text-xs border-border/60"
                                                    />
                                                    <p className="text-[10px] text-muted-foreground">Example text shown inside the input before typing.</p>
                                                </div>

                                                <div className="space-y-1.5">
                                                    <label className="text-xs font-semibold text-foreground">
                                                        Helper Note / Subtitle
                                                    </label>
                                                    <Input 
                                                        value={field.helperText || ''} 
                                                        onChange={(e) => updateField(field.id, { helperText: e.target.value })} 
                                                        placeholder="e.g. Used for official communications..."
                                                        className="h-9 rounded-xl bg-background text-xs border-border/60"
                                                    />
                                                    <p className="text-[10px] text-muted-foreground">Small guidance text displayed below the field.</p>
                                                </div>
                                            </div>

                                            {/* Quick Validation Switches */}
                                            <div className="flex flex-wrap items-center gap-5 pt-2 border-t border-border/40">
                                                <span className="text-xs font-semibold text-muted-foreground">Quick Rules:</span>

                                                <label className="inline-flex items-center gap-2 cursor-pointer select-none text-xs text-foreground font-medium">
                                                    <input 
                                                        type="checkbox" 
                                                        className="size-4 rounded border-border text-primary focus:ring-primary cursor-pointer"
                                                        checked={field.validations?.some(v => v.type === 'alphanumeric') || false}
                                                        onChange={(e) => {
                                                            let vals = field.validations ? [...field.validations] : []
                                                            if (e.target.checked) {
                                                                if (!vals.some(v => v.type === 'alphanumeric')) {
                                                                    vals.push({ type: 'alphanumeric', message: 'Letters and numbers only' })
                                                                }
                                                            } else {
                                                                vals = vals.filter(v => v.type !== 'alphanumeric')
                                                            }
                                                            updateField(field.id, { validations: vals })
                                                        }}
                                                    />
                                                    <span>Letters & Numbers Only</span>
                                                </label>

                                                {field.type === 'text' && (
                                                    <label className="inline-flex items-center gap-2 cursor-pointer select-none text-xs text-foreground font-medium">
                                                        <input 
                                                            type="checkbox" 
                                                            className="size-4 rounded border-border text-primary focus:ring-primary cursor-pointer"
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
            </div>
        </div>
    )
}
