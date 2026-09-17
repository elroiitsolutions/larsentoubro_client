import { useEffect, useState } from "react"
import {
    Sheet,
    SheetContent,
    SheetDescription,
    SheetHeader,
    SheetTitle,
} from "@/components/ui/sheet"
import { DynamicForm } from "@/components/DynamicForm"
import formService from "@/services/form.service"
import { toast } from "sonner"

interface DynamicFormSheetProps {
    isOpen: boolean
    onClose: () => void
    formSlug: string
    onSubmitSuccess: () => void
    submitEndpoint?: string
    submitMethod?: "POST" | "PUT" | "PATCH"
    additionalData?: Record<string, any>
    defaultValues?: any
}

export function DynamicFormSheet({ isOpen, onClose, formSlug, onSubmitSuccess, submitEndpoint, submitMethod, additionalData, defaultValues }: DynamicFormSheetProps) {
    const [formDefinition, setFormDefinition] = useState<any | null>(null)
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        if (isOpen && formSlug) {
            setLoading(true)
            formService.getFormBySlug(formSlug)
                .then((data) => {
                    if (data.success) {
                        setFormDefinition(data.data)
                    }
                    setLoading(false)
                })
                .catch((err) => {
                    console.error(err)
                    toast.error("Failed to fetch form definition")
                    setLoading(false)
                })
        }
    }, [isOpen, formSlug])

    const handleSubmit = async (formData: any) => {
        try {
            const url = submitEndpoint || `/forms/${formSlug}/submit`;
            const data = await formService.submitForm(url, { ...formData, ...additionalData }, submitMethod);
            if (data.success) {
                onSubmitSuccess();
                onClose();
            } else {
                toast.error(data.message || "Failed to submit form");
            }
        } catch (err: any) {
            console.error(err);
            const message = err?.response?.data?.message || "An error occurred";
            toast.error(message);
        }
    }

    return (
        <Sheet open={isOpen} onOpenChange={(open) => !open && onClose()}>
            <SheetContent className="w-full !max-w-[95vw] sm:!max-w-[500px] md:!max-w-[540px] flex flex-col h-full max-h-screen overflow-hidden p-0 bg-background shadow-2xl">
                <SheetHeader className="px-6 py-4 border-b border-border/60 shrink-0 bg-muted/20">
                    <SheetTitle className="text-lg font-bold text-foreground">
                        {formDefinition ? formDefinition.name : "Loading..."}
                    </SheetTitle>
                    <SheetDescription className="text-xs text-muted-foreground">
                        {formDefinition ? formDefinition.description : "Please wait"}
                    </SheetDescription>
                </SheetHeader>
                <div className="flex-1 min-h-0 overflow-y-auto px-6 py-5 space-y-4">
                    {loading ? (
                        <div className="flex flex-col items-center justify-center py-16 text-muted-foreground">
                            <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary/20 border-t-primary mb-3" />
                            <p className="text-sm font-medium">Loading form schema...</p>
                        </div>
                    ) : formDefinition ? (
                        <DynamicForm formDefinition={formDefinition} onSubmit={handleSubmit} defaultValues={defaultValues} />
                    ) : (
                        <div className="flex flex-col items-center justify-center py-16 text-destructive border-2 border-dashed border-destructive/20 rounded-2xl p-6 text-center">
                            <p className="text-sm font-bold">Failed to load form definition</p>
                            <p className="text-xs text-muted-foreground mt-1">Please try closing and reopening this sheet.</p>
                        </div>
                    )}
                </div>
            </SheetContent>
        </Sheet>
    )
}
