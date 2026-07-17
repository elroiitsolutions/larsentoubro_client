import React, { useEffect } from "react"
import { useFormBuilderStore, FormField } from "@/store/useFormBuilderStore"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Separator } from "@/components/ui/separator"
import { ArrowLeftIcon, ArrowUpIcon, ArrowDownIcon, TrashIcon, PlusIcon, SaveIcon } from "lucide-react"

export function FormEditor({ form, onBack, onSave }: { form: any; onBack: () => void; onSave: (updatedForm: any) => void }) {
    const { fields, loadForm, addField, updateField, removeField, reorderFields } = useFormBuilderStore()

    useEffect(() => {
        loadForm(form)
    }, [form, loadForm])

    const handleSave = () => {
        onSave({ ...form, fields })
    }

    const handleAddField = () => {
        addField({
            id: `f_${Date.now()}`,
            name: `field_${fields.length}`,
            label: `New Field ${fields.length + 1}`,
            type: "text",
            order: fields.length
        })
    }

    return (
        <div className="flex flex-col gap-6 w-full">
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                    <Button variant="ghost" size="icon" onClick={onBack}>
                        <ArrowLeftIcon className="size-4" />
                    </Button>
                    <div>
                        <h2 className="text-xl font-semibold tracking-tight">Editing: {form.name}</h2>
                    </div>
                </div>
                <Button onClick={handleSave} className="gap-2">
                    <SaveIcon className="size-4" /> Save Form
                </Button>
            </div>

            <div className="grid grid-cols-3 gap-6 items-start">
                <div className="col-span-2 flex flex-col gap-4">
                    {fields.sort((a, b) => a.order - b.order).map((field, index) => (
                        <Card key={field.id} className="relative group">
                            <CardContent className="p-4 flex gap-4 items-start">
                                <div className="flex flex-col gap-1 mt-1">
                                    <Button variant="ghost" size="icon" className="h-6 w-6" disabled={index === 0} onClick={() => reorderFields(index, index - 1)}>
                                        <ArrowUpIcon className="size-3" />
                                    </Button>
                                    <Button variant="ghost" size="icon" className="h-6 w-6" disabled={index === fields.length - 1} onClick={() => reorderFields(index, index + 1)}>
                                        <ArrowDownIcon className="size-3" />
                                    </Button>
                                </div>
                                <div className="flex-1 grid grid-cols-2 gap-4">
                                    <div className="flex flex-col gap-2">
                                        <label className="text-xs font-medium">Label</label>
                                        <Input 
                                            value={field.label} 
                                            onChange={(e) => updateField(field.id, { label: e.target.value })} 
                                        />
                                    </div>
                                    <div className="flex flex-col gap-2">
                                        <label className="text-xs font-medium">Name (Field Key)</label>
                                        <Input 
                                            value={field.name} 
                                            onChange={(e) => updateField(field.id, { name: e.target.value })} 
                                        />
                                    </div>
                                    <div className="flex flex-col gap-2">
                                        <label className="text-xs font-medium">Type</label>
                                        <select 
                                            className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                                            value={field.type} 
                                            onChange={(e) => updateField(field.id, { type: e.target.value as any })}
                                        >
                                            <option value="text">Text</option>
                                            <option value="number">Number</option>
                                            <option value="email">Email</option>
                                            <option value="checkbox">Checkbox</option>
                                            <option value="select">Select</option>
                                        </select>
                                    </div>
                                    <div className="flex flex-col gap-2">
                                        <label className="text-xs font-medium">Required</label>
                                        <div className="flex items-center h-10">
                                            <input 
                                                type="checkbox" 
                                                className="w-4 h-4"
                                                checked={field.validations?.some(v => v.type === 'required') || false}
                                                onChange={(e) => {
                                                    const isReq = e.target.checked;
                                                    let vals = field.validations ? [...field.validations] : [];
                                                    if (isReq) {
                                                        if (!vals.some(v => v.type === 'required')) vals.push({ type: 'required', message: 'This field is required' });
                                                    } else {
                                                        vals = vals.filter(v => v.type !== 'required');
                                                    }
                                                    updateField(field.id, { validations: vals });
                                                }}
                                            />
                                        </div>
                                    </div>
                                </div>
                                <Button variant="ghost" size="icon" className="text-destructive hover:text-destructive/90" onClick={() => removeField(field.id)}>
                                    <TrashIcon className="size-4" />
                                </Button>
                            </CardContent>
                        </Card>
                    ))}

                    <Button variant="outline" className="w-full gap-2 border-dashed" onClick={handleAddField}>
                        <PlusIcon className="size-4" /> Add Field
                    </Button>
                </div>
                
                <div className="col-span-1">
                    <Card>
                        <CardHeader>
                            <CardTitle>Form Settings</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div className="flex flex-col gap-2">
                                <label className="text-sm font-medium">Form Name</label>
                                <Input value={form.name} readOnly disabled />
                            </div>
                            <div className="flex flex-col gap-2">
                                <label className="text-sm font-medium">Form Slug</label>
                                <Input value={form.slug} readOnly disabled />
                            </div>
                            <p className="text-xs text-muted-foreground mt-4">
                                Note: Name and Slug cannot be changed for system forms.
                            </p>
                        </CardContent>
                    </Card>
                </div>
            </div>
        </div>
    )
}
