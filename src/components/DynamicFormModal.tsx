import React, { useEffect, useState } from "react"
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog"
import { DynamicForm } from "@/components/DynamicForm"

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
                    setLoading(false)
                })
        }
    }, [isOpen, formSlug])

    const handleSubmit = async (formData: any) => {
        try {
            const url = submitEndpoint || `http://localhost:3000/api/forms/${formSlug}/submit`;
            const res = await fetch(url, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(formData)
            });
            const data = await res.json();
            if (data.success) {
                onSubmitSuccess();
                onClose();
            } else {
                alert("Failed to submit form: " + data.message);
            }
        } catch (err) {
            console.error(err);
            alert("An error occurred during submission");
        }
    }

    return (
        <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
            <DialogContent className="sm:max-w-[500px]">
                <DialogHeader>
                    <DialogTitle>{formDefinition ? formDefinition.name : "Loading..."}</DialogTitle>
                    <DialogDescription>
                        {formDefinition ? formDefinition.description : "Please wait"}
                    </DialogDescription>
                </DialogHeader>
                <div className="py-4">
                    {loading ? (
                        <div className="flex justify-center p-4">Loading form...</div>
                    ) : formDefinition ? (
                        <DynamicForm formDefinition={formDefinition} onSubmit={handleSubmit} />
                    ) : (
                        <div className="text-destructive">Failed to load form definition.</div>
                    )}
                </div>
            </DialogContent>
        </Dialog>
    )
}
