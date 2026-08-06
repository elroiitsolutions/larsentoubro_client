import React, { useEffect, useState } from "react"
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog"
import { DynamicForm } from "@/components/DynamicForm"
import formService from "@/services/form.service"

interface DynamicFormModalProps {
    isOpen: boolean
    onClose: () => void
    formSlug: string
    onSubmitSuccess: () => void
    submitEndpoint?: string
}

export function DynamicFormModal({ isOpen, onClose, formSlug, onSubmitSuccess, submitEndpoint }: DynamicFormModalProps) {
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
                    setLoading(false)
                })
        }
    }, [isOpen, formSlug])

    const handleSubmit = async (formData: any) => {
        try {
            const url = submitEndpoint || `/forms/${formSlug}/submit`;
            const data = await formService.submitForm(url, formData);
            if (data.success) {
                onSubmitSuccess();
                onClose();
            } else {
                toast.error("Failed to submit form: " + data.message);
            }
        } catch (err: any) {
            console.error(err);
            const message = err?.response?.data?.message || "An error occurred during submission";
            toast.error(message);
        }
    }

    return (
        <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
            <DialogContent className="sm:max-w-[550px] max-h-[90vh] flex flex-col overflow-hidden p-0 rounded-2xl bg-background shadow-2xl">
                <DialogHeader className="px-6 py-4 border-b border-border/60 shrink-0 bg-muted/20">
                    <DialogTitle className="text-lg font-bold text-foreground">
                        {formDefinition ? formDefinition.name : "Loading..."}
                    </DialogTitle>
                    <DialogDescription className="text-xs text-muted-foreground">
                        {formDefinition ? formDefinition.description : "Please wait"}
                    </DialogDescription>
                </DialogHeader>
                <div className="flex-1 min-h-0 overflow-y-auto px-6 py-5 space-y-4">
                    {loading ? (
                        <div className="flex flex-col items-center justify-center py-16 text-muted-foreground">
                            <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary/20 border-t-primary mb-3" />
                            <p className="text-sm font-medium">Loading form schema...</p>
                        </div>
                    ) : formDefinition ? (
                        <DynamicForm formDefinition={formDefinition} onSubmit={handleSubmit} />
                    ) : (
                        <div className="flex flex-col items-center justify-center py-16 text-destructive border-2 border-dashed border-destructive/20 rounded-2xl p-6 text-center">
                            <p className="text-sm font-bold">Failed to load form definition</p>
                            <p className="text-xs text-muted-foreground mt-1">Please try closing and reopening this dialog.</p>
                        </div>
                    )}
                </div>
            </DialogContent>
        </Dialog>
    )
}
