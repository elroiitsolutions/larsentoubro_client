import { useEffect, useState } from "react"
import {
    Card,
    CardContent,
} from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { FileTextIcon, Sparkles, ArrowRight, CheckCircle2, Sliders, Layers } from "lucide-react"
import { FormEditor } from "./FormEditor"
import { toast } from "sonner"
import formService from "@/services/form.service"
import { useAuth } from "@/contexts/AuthContext"
import NoAccessPage from "../NoAccessPage"

export function SettingsFormManagementPage() {
    const { user } = useAuth()
    const [forms, setForms] = useState<any[]>([])
    const [loading, setLoading] = useState(true)
    const [selectedForm, setSelectedForm] = useState<any | null>(null)

    const isRestricted = Boolean(
        user &&
        user.role !== "Admin" &&
        (!user.allowedPages || !user.allowedPages.includes("/settings"))
    )

    if (isRestricted) {
        return <NoAccessPage />
    }

    const fetchForms = async () => {
        setLoading(true)
        try {
            const data = await formService.getForms()
            if (data.success) {
                const filtered = (data.data || []).filter(
                    (f: any) => f.slug !== 'tool-quick-view' && f.slug !== 'tool-details-view'
                );
                setForms(filtered);
            }
        } catch (err) {
            console.error(err)
            toast.error("Failed to load forms")
        } finally {
            setLoading(false)
        }
    }

    useEffect(() => {
        fetchForms()
    }, [])

    const handleSaveForm = async (updatedForm: any) => {
        try {
            const data = await formService.saveForm(updatedForm);
            if (data.success) {
                setSelectedForm(null);
                fetchForms();
                toast.success("Form saved successfully!");
            } else {
                toast.error("Failed to save form");
            }
        } catch (err: any) {
            console.error(err);
            const message = err?.response?.data?.message || "An error occurred";
            toast.error(message);
        }
    }

    const handleEditForm = async (form: any) => {
        setLoading(true)
        try {
            const data = await formService.getFormBySlug(form.slug)
            if (data.success) {
                setSelectedForm(data.data)
            } else {
                toast.error("Failed to load form details")
            }
        } catch (err: any) {
            console.error(err)
            const message = err?.response?.data?.message || "Error loading form"
            toast.error(message)
        } finally {
            setLoading(false)
        }
    }

    if (selectedForm) {
        return (
            <div className="flex-1 min-h-0 overflow-y-auto flex flex-col w-full">
                <FormEditor 
                    form={selectedForm} 
                    onBack={() => setSelectedForm(null)} 
                    onSave={handleSaveForm} 
                />
            </div>
        )
    }

    return (
        <div className="flex-1 min-h-0 overflow-y-auto flex flex-col w-full pr-1">
            <div className="w-full space-y-6 pb-12">
                {/* Header Section */}
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-gradient-to-r from-card to-card/60 border border-border/60 rounded-2xl p-6 shadow-sm">
                    <div className="space-y-1.5">
                        <div className="inline-flex items-center gap-2 px-2.5 py-1 rounded-full bg-primary/10 text-primary text-xs font-semibold mb-1">
                            <Sparkles className="size-3.5" />
                            <span>Dynamic Schemas</span>
                        </div>
                        <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-foreground">
                            Forms Management
                        </h1>
                        <p className="text-sm text-muted-foreground max-w-2xl">
                            Select a dynamic form schema to configure input fields, validation rules, required toggles, and dropdown options across the enterprise portal.
                        </p>
                    </div>
                    <div className="flex items-center gap-2">
                        <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-muted/60 border border-border/40 text-xs font-medium text-muted-foreground">
                            <Layers className="size-4 text-primary" />
                            <span>{forms.length} {forms.length === 1 ? 'Form' : 'Forms'} Available</span>
                        </div>
                    </div>
                </div>

                {/* Forms Grid */}
                {loading ? (
                    <div className="flex flex-col items-center justify-center py-20 text-muted-foreground bg-card/40 border border-border/40 rounded-2xl">
                        <div className="h-9 w-9 animate-spin rounded-full border-4 border-primary/20 border-t-primary mb-4" />
                        <p className="font-medium">Loading form schemas...</p>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {forms.map((form) => (
                            <Card 
                                key={form.slug} 
                                className="group cursor-pointer border border-border/60 bg-card hover:border-primary/50 hover:shadow-lg hover:-translate-y-1 transition-all duration-300 rounded-2xl flex flex-col justify-between overflow-hidden relative"
                                onClick={() => handleEditForm(form)}
                            >
                                <div className="absolute top-0 right-0 w-24 h-24 bg-primary/5 rounded-bl-full pointer-events-none transition-all group-hover:bg-primary/10" />
                                <CardContent className="p-6 space-y-4">
                                    <div className="flex items-start justify-between gap-3">
                                        <div className="p-3 rounded-xl bg-primary/10 text-primary dark:bg-primary/20">
                                            <FileTextIcon className="size-6" />
                                        </div>
                                        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-500/15 text-emerald-700 dark:text-emerald-400 border border-emerald-500/30">
                                            <CheckCircle2 className="size-3" />
                                            Active
                                        </span>
                                    </div>
                                    <div className="space-y-1.5">
                                        <div className="flex items-center gap-2">
                                            <h3 className="font-bold text-lg text-foreground group-hover:text-primary transition-colors">
                                                {form.name}
                                            </h3>
                                        </div>
                                        <div className="inline-block px-2 py-0.5 rounded-md bg-muted text-xs font-mono text-muted-foreground">
                                            Slug: {form.slug}
                                        </div>
                                        <p className="text-sm text-muted-foreground leading-relaxed line-clamp-3 pt-1">
                                            {form.description || "Configure custom fields and validation constraints for this schema."}
                                        </p>
                                    </div>
                                </CardContent>
                                
                                <div className="px-6 py-4 bg-muted/30 border-t border-border/40 flex items-center justify-between mt-2">
                                    <span className="text-xs font-medium text-muted-foreground flex items-center gap-1.5">
                                        <Sliders className="size-3.5" />
                                        Customizable Schema
                                    </span>
                                    <Button 
                                        variant="ghost" 
                                        size="sm" 
                                        className="h-8 px-3 rounded-lg font-semibold text-xs text-primary group-hover:bg-primary group-hover:text-primary-foreground transition-all gap-1 cursor-pointer"
                                    >
                                        Edit Form
                                        <ArrowRight className="size-3.5 transition-transform group-hover:translate-x-0.5" />
                                    </Button>
                                </div>
                            </Card>
                        ))}
                        {forms.length === 0 && (
                            <div className="col-span-full flex flex-col items-center justify-center py-16 px-6 border-2 border-dashed border-border/60 rounded-2xl text-muted-foreground text-center">
                                <FileTextIcon className="size-10 mb-3 opacity-30 text-primary" />
                                <h3 className="text-base font-semibold text-foreground">No forms found</h3>
                                <p className="text-sm text-muted-foreground max-w-sm mt-1">
                                    There are currently no active form schemas available to customize.
                                </p>
                            </div>
                        )}
                    </div>
                )}
            </div>
        </div>
    )
}
