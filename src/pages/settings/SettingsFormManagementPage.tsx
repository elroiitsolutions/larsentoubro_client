import { useEffect, useState } from "react"
import {
    Card,
    CardContent,
} from "@/components/ui/card"
import { 
    FileTextIcon, 
    Building2, 
    Home, 
    Contact, 
    RefreshCw, 
    Users, 
    ShoppingBag, 
    Settings, 
    ShieldCheck 
} from "lucide-react"
import { FormEditor } from "./FormEditor"
import { toast } from "sonner"
import formService from "@/services/form.service"
import { useAuth } from "@/contexts/AuthContext"
import NoAccessPage from "../NoAccessPage"

const getFormIcon = (slug: string) => {
    switch (slug) {
        case 'create-project':
            return <Building2 className="size-4" />;
        case 'create-store':
            return <Home className="size-4" />;
        case 'guest-user-form':
            return <Contact className="size-4" />;
        case 'scrap-dealer-form':
            return <RefreshCw className="size-4" />;
        case 'subcontractor-form':
            return <Users className="size-4" />;
        case 'supplier-form':
            return <ShoppingBag className="size-4" />;
        case 'tool-form':
            return <Settings className="size-4" />;
        case 'user-admin-form':
            return <ShieldCheck className="size-4" />;
        default:
            return <FileTextIcon className="size-4" />;
    }
};

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
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
                    {forms.map((form) => (
                        <Card 
                            key={form.slug} 
                            className="group cursor-pointer border border-border/60 bg-card hover:border-primary/50 hover:shadow-xs transition-all duration-200 rounded-xl overflow-hidden shadow-2xs"
                            onClick={() => handleEditForm(form)}
                        >
                            <CardContent className="p-3 sm:p-3.5">
                                <div className="flex items-center gap-2.5 mb-2 min-w-0">
                                    <div className="p-1.5 rounded-lg bg-blue-500/10 text-blue-600 dark:text-blue-400 shrink-0">
                                        {getFormIcon(form.slug)}
                                    </div>
                                    <h3 className="font-bold text-xs sm:text-sm text-foreground group-hover:text-primary transition-colors tracking-tight truncate min-w-0">
                                        {form.name}
                                    </h3>
                                </div>
                                <p className="text-[11px] text-muted-foreground leading-normal line-clamp-2">
                                    {form.description || "Configure custom fields and validation constraints for this schema."}
                                </p>
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
