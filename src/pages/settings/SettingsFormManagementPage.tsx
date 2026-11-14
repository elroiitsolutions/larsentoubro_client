import { useEffect, useState } from "react"
import {
    Card,
    CardContent,
} from "@/components/ui/card"
import { FileTextIcon, CheckCircle2 } from "lucide-react"
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
                    (f: any) =>
                        f.slug !== 'create-user' &&
                        f.slug !== 'user-form' &&
                        f.slug !== 'vendor-form' &&
                        f.slug !== 'tool-quick-view' &&
                        f.slug !== 'tool-details-view'
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
        <div className="w-full flex flex-col space-y-3 pt-1 pb-4 animate-in fade-in duration-300">
            {/* Header Section */}
            <div className="flex items-center gap-2.5 min-w-0">
                <div className="p-1.5 rounded-lg bg-gradient-to-tr from-blue-600 to-indigo-600 text-white shadow-sm shadow-blue-500/20 shrink-0">
                    <FileTextIcon className="size-4" />
                </div>
                <div className="min-w-0">
                    <h1 className="text-base sm:text-lg font-bold tracking-tight text-foreground truncate">
                        Forms Management
                    </h1>
                </div>
            </div>

            {/* Forms Grid */}
            {loading ? (
                <div className="flex flex-col items-center justify-center py-16 text-muted-foreground bg-card/40 border border-border/40 rounded-xl">
                    <div className="size-7 animate-spin rounded-full border-3 border-primary/20 border-t-primary mb-3" />
                    <p className="text-xs font-medium">Loading form schemas...</p>
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3">
                    {forms.map((form) => (
                        <Card 
                            key={form.slug} 
                            className="group cursor-pointer border border-border/60 bg-card hover:border-primary/50 hover:shadow-xs transition-all duration-200 rounded-xl flex flex-col justify-between overflow-hidden shadow-2xs"
                            onClick={() => handleEditForm(form)}
                        >
                            <CardContent className="p-3.5 sm:p-4 space-y-2.5">
                                <div className="flex items-start justify-between gap-2">
                                    <div className="p-1.5 rounded-lg bg-primary/10 text-primary dark:bg-primary/20">
                                        <FileTextIcon className="size-4" />
                                    </div>
                                    <span className="inline-flex items-center gap-1 px-1.5 py-0.2 rounded-full text-[9px] font-semibold bg-emerald-500/15 text-emerald-700 dark:text-emerald-400 border border-emerald-500/30">
                                        <CheckCircle2 className="size-2.5" />
                                        Active
                                    </span>
                                </div>
                                <div className="space-y-1">
                                    <h3 className="font-bold text-xs sm:text-sm text-foreground group-hover:text-primary transition-colors">
                                        {form.name}
                                    </h3>
                                    <p className="text-[11px] text-muted-foreground leading-normal line-clamp-2">
                                        {form.description || "Configure custom fields and validation constraints for this schema."}
                                    </p>
                                </div>
                            </CardContent>
                        </Card>
                    ))}
                    {forms.length === 0 && (
                        <div className="col-span-full flex flex-col items-center justify-center py-12 px-4 border-2 border-dashed border-border/60 rounded-xl text-muted-foreground text-center">
                            <FileTextIcon className="size-8 mb-2 opacity-30 text-primary" />
                            <h3 className="text-sm font-semibold text-foreground">No forms found</h3>
                            <p className="text-xs text-muted-foreground max-w-sm mt-0.5">
                                There are currently no active form schemas available to customize.
                            </p>
                        </div>
                    )}
                </div>
            )}
        </div>
    )
}
