import { useEffect, useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import {
    ArrowLeftIcon,
    SaveIcon,
    Wrench,
    Sliders
} from "lucide-react"
import { toast } from "sonner"
import formService from "@/services/form.service"
import { useAuth } from "@/contexts/AuthContext"
import NoAccessPage from "../NoAccessPage"
import { useNavigate, useLocation } from "react-router-dom"

function ToggleSwitch({ checked, onCheckedChange }: { checked: boolean; onCheckedChange: (val: boolean) => void }) {
    return (
        <button
            type="button"
            role="switch"
            aria-checked={checked}
            onClick={() => onCheckedChange(!checked)}
            className={`relative inline-flex h-5 w-10 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                checked ? 'bg-emerald-500' : 'bg-muted-foreground/30 dark:bg-muted-foreground/40'
            }`}
        >
            <span
                className={`pointer-events-none inline-block h-4 w-4 transform rounded-full bg-white shadow-md ring-0 transition duration-200 ease-in-out ${
                    checked ? 'translate-x-5' : 'translate-x-0'
                }`}
            />
        </button>
    );
}

export function ToolViewConfigPage({ mode: propMode }: { mode?: 'quick' | 'details' }) {
    const { user } = useAuth()
    const navigate = useNavigate()
    const location = useLocation()

    // Determine mode from prop or URL
    const mode = propMode || (location.pathname.includes('quick') ? 'quick' : 'details')
    const formSlug = mode === 'quick' ? 'tool-quick-view' : 'tool-details-view'
    const pageTitle = mode === 'quick'
        ? 'Tool Quick View Module Access & Configuration'
        : 'Full Tool Details View Access & Configuration'
    const pageDescription = mode === 'quick'
        ? 'Customization settings for fields shown on the Quick Tool View Module (/vt).'
        : 'Customization settings for fields shown on the Full Tool Details Page (/tooldetails).'

    const [loading, setLoading] = useState(true)
    const [saving, setSaving] = useState(false)
    const [fields, setFields] = useState<any[]>([])
    const [activeTab, setActiveTab] = useState<string>("all")

    const isRestricted = Boolean(
        user &&
        user.role !== "Admin" &&
        (!user.allowedPages || !user.allowedPages.includes("/settings"))
    )

    const defaultFields = [
        { id: "description", name: "description", label: "Tool Name / Description", category: "specs", disabled: false, order: 0 },
        { id: "toolCode", name: "toolCode", label: "Tool Code Badge", category: "specs", disabled: false, order: 1 },
        { id: "toolVariant", name: "toolVariant", label: "Tool Variant", category: "specs", disabled: false, order: 2 },
        { id: "makeYear", name: "makeYear", label: "Make & Year", category: "specs", disabled: false, order: 3 },
        { id: "capacity", name: "capacity", label: "Load Capacity", category: "specs", disabled: false, order: 4 },
        { id: "safeWorkingLoad", name: "safeWorkingLoad", label: "Safe Working Load (SWL)", category: "specs", disabled: false, order: 5 },
        { id: "toolType", name: "toolType", label: "Tool Category", category: "specs", disabled: false, order: 6 },
        { id: "metalType", name: "metalType", label: "Material / Metal Type", category: "specs", disabled: false, order: 7 },
        
        { id: "purchaserName", name: "purchaserName", label: "Supplier / Purchaser Name", category: "vendor", disabled: false, order: 8 },
        { id: "supplierCode", name: "supplierCode", label: "Supplier Code", category: "vendor", disabled: false, order: 9 },
        { id: "purchaserContact", name: "purchaserContact", label: "Purchaser Contact", category: "vendor", disabled: false, order: 10 },
        { id: "dateOfSupply", name: "dateOfSupply", label: "Date of Supply / Receipt", category: "vendor", disabled: false, order: 11 },
        { id: "validityPeriod", name: "validityPeriod", label: "Validation", category: "vendor", disabled: false, order: 12 },

        { id: "jobCode", name: "jobCode", label: "Job Number / Code", category: "allocation", disabled: false, order: 13 },
        { id: "jobDescription", name: "jobDescription", label: "Job Description", category: "allocation", disabled: false, order: 14 },
        { id: "currentSite", name: "currentSite", label: "Assigned Store", category: "allocation", disabled: false, order: 15 },
        { id: "project", name: "project", label: "Assigned Project Site", category: "allocation", disabled: false, order: 16 },
        { id: "subcontractorName", name: "subcontractorName", label: "Subcontractor Details", category: "allocation", disabled: false, order: 17 },
    ]

    const fetchSchema = async () => {
        setLoading(true)
        try {
            const data = await formService.getFormBySlug(formSlug)
            if (data.success && data.data) {
                const fetchedFields = data.data.fields || []
                if (fetchedFields.length === 0) {
                    setFields(defaultFields)
                } else {
                    const merged = defaultFields.map(def => {
                        const existing = fetchedFields.find((f: any) => f.name === def.name || f.id === def.id)
                        if (existing) {
                            return { ...def, ...existing }
                        }
                        return def
                    })
                    setFields(merged)
                }
            } else {
                setFields(defaultFields)
            }
        } catch (err) {
            console.error(`Failed to load ${formSlug} schema`, err)
            setFields(defaultFields)
        } finally {
            setLoading(false)
        }
    }

    useEffect(() => {
        fetchSchema()
    }, [formSlug])

    if (isRestricted) {
        return <NoAccessPage />
    }

    const handleToggleField = (fieldName: string, visible: boolean) => {
        setFields(prev => prev.map(f => {
            if (f.name === fieldName || f.id === fieldName) {
                return { ...f, disabled: !visible }
            }
            return f
        }))
    }

    const allVisible = fields.every(f => !f.disabled)

    const handleToggleSelectAll = (selectAll: boolean) => {
        setFields(prev => prev.map(f => ({ ...f, disabled: !selectAll })))
    }

    const handleSave = async () => {
        setSaving(true)
        try {
            const sanitizedFields = fields.map((f, idx) => ({
                id: f.id || f.name,
                name: f.name,
                label: f.label || f.name,
                type: "text",
                order: idx,
                disabled: Boolean(f.disabled)
            }))

            const payload = {
                name: mode === 'quick' ? "Tool Quick View Module Layout" : "Tool Details Card Layout",
                slug: formSlug,
                description: pageDescription,
                fields: sanitizedFields
            }

            const res = await formService.saveForm(payload)
            if (res.success) {
                toast.success(`${mode === 'quick' ? 'Quick View' : 'Full Details'} layout settings saved successfully!`)
                fetchSchema()
            } else {
                toast.error(res.message || "Failed to save settings")
            }
        } catch (err: any) {
            console.error(err)
            toast.error(err?.response?.data?.message || "Error saving configuration")
        } finally {
            setSaving(false)
        }
    }

    const filteredFields = activeTab === "all" 
        ? fields 
        : fields.filter(f => f.category === activeTab)

    return (
        <div className="flex-1 min-h-0 overflow-y-auto flex flex-col w-full py-4 px-2 sm:px-6">
            <div className="w-full space-y-6 pb-12">
                
                {/* Header Title Section */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-border/60 pb-4">
                    <div className="flex items-center gap-3">
                        <h1 className="text-xl sm:text-2xl font-extrabold tracking-tight text-foreground flex items-center gap-2.5">
                            <span className="p-2 rounded-xl bg-primary/10 text-primary">
                                {mode === 'quick' ? <Sliders className="size-5" /> : <Wrench className="size-5" />}
                            </span>
                            {pageTitle}
                        </h1>
                    </div>

                    <Button
                        onClick={handleSave}
                        disabled={saving}
                        className="rounded-xl h-10 px-6 gap-2 font-bold shadow-md cursor-pointer bg-primary hover:bg-primary/90 text-primary-foreground"
                    >
                        <SaveIcon className="size-4" />
                        {saving ? "Saving..." : "Save Layout Settings"}
                    </Button>
                </div>

                {/* Category Navigation Tabs */}
                {/* <div className="bg-muted/40 p-1.5 rounded-2xl border border-border/50 flex flex-wrap items-center gap-1.5">
                    <button
                        onClick={() => setActiveTab("all")}
                        className={`px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                            activeTab === "all" 
                                ? "bg-primary text-primary-foreground shadow-xs" 
                                : "text-muted-foreground hover:text-foreground hover:bg-background/60"
                        }`}
                    >
                        All Fields ({fields.length})
                    </button>
                </div> */}

                {/* Main Card Container */}
                <Card className="border border-border/60 shadow-md bg-card rounded-3xl overflow-hidden">
                    <CardContent className="p-0">
                        
                        {/* "Select All" Top Banner Bar */}
                        <div className="bg-blue-50/80 dark:bg-blue-950/40 px-6 py-4 border-b border-blue-100 dark:border-blue-900 flex items-center justify-between">
                            <span className="text-sm font-extrabold text-foreground tracking-tight">
                                Select All Fields ({mode === 'quick' ? 'Quick View' : 'Full Details'})
                            </span>
                            <div className="flex items-center gap-2">
                                <span className="text-xs font-semibold text-muted-foreground">
                                    {allVisible ? "All Visible" : "Custom Selection"}
                                </span>
                                <ToggleSwitch 
                                    checked={allVisible} 
                                    onCheckedChange={handleToggleSelectAll} 
                                />
                            </div>
                        </div>

                        {/* 4-Column Grid of Fields */}
                        {loading ? (
                            <div className="flex flex-col items-center justify-center py-20 text-muted-foreground">
                                <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary/20 border-t-primary mb-3" />
                                <p className="text-xs font-medium">Loading field configuration...</p>
                            </div>
                        ) : (
                            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-y-5 gap-x-8 p-6">
                                {filteredFields.map((field) => {
                                    const isVisible = !field.disabled
                                    return (
                                        <div 
                                            key={field.id || field.name}
                                            className="flex items-center justify-between gap-3 p-1 hover:bg-muted/30 rounded-xl transition-colors"
                                        >
                                            <span className="text-xs font-bold text-foreground/90 leading-tight truncate">
                                                {field.label}
                                            </span>
                                            <ToggleSwitch 
                                                checked={isVisible}
                                                onCheckedChange={(val) => handleToggleField(field.name, val)}
                                            />
                                        </div>
                                    )
                                })}
                            </div>
                        )}
                    </CardContent>
                </Card>
            </div>
        </div>
    )
}
