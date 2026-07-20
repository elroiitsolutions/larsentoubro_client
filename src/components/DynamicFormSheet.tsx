import React, { useEffect, useState } from "react"
import {
    Sheet,
    SheetContent,
    SheetDescription,
    SheetHeader,
    SheetTitle,
} from "@/components/ui/sheet"
import { DynamicForm } from "@/components/DynamicForm"
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
            fetch(`http://localhost:3000/api/forms/${formSlug}`)
                .then((res) => res.json())
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
            const url = submitEndpoint || `http://localhost:3000/api/forms/${formSlug}/submit`;
            const res = await fetch(url, {
                method: submitMethod || "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ ...formData, ...additionalData })
            });
            const data = await res.json();
            if (data.success) {
                onSubmitSuccess();
                onClose();
            } else {
                toast.error(data.message || "Failed to submit form");
            }
        } catch (err) {
            console.error(err);
            toast.error("An error occurred during submission");
        }
    }

    return (
        <Sheet open={isOpen} onOpenChange={(open) => !open && onClose()}>
            <SheetContent className="w-full !max-w-[95vw] sm:!max-w-[450px] md:!max-w-[500px] overflow-y-auto">
                <SheetHeader>
                    <SheetTitle>{formDefinition ? formDefinition.name : "Loading..."}</SheetTitle>
                    <SheetDescription>
                        {formDefinition ? formDefinition.description : "Please wait"}
                    </SheetDescription>
                </SheetHeader>
                <div className="py-6 p-3">
                    {loading ? (
                        <div className="flex justify-center p-4">Loading form...</div>
                    ) : formDefinition ? (
                        <DynamicForm formDefinition={formDefinition} onSubmit={handleSubmit} defaultValues={defaultValues} />
                    ) : (
                        <div className="text-destructive">Failed to load form definition.</div>
                    )}
                </div>
            </SheetContent>
        </Sheet>
    )
}
