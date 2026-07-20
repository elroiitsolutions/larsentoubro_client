import React, { useEffect, useState } from "react"
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { ArrowLeftIcon, FileTextIcon } from "lucide-react"
import { FormEditor } from "./FormEditor"
import { toast } from "sonner"

export function SettingsFormManagementPage() {
    const [forms, setForms] = useState<any[]>([])
    const [loading, setLoading] = useState(true)
    const [selectedForm, setSelectedForm] = useState<any | null>(null)

    const fetchForms = () => {
        setLoading(true)
        fetch("http://localhost:3000/api/forms")
            .then((res) => res.json())
            .then((data) => {
                if (data.success) setForms(data.data)
                setLoading(false)
            })
            .catch((err) => {
                console.error(err)
                setLoading(false)
            })
    }

    useEffect(() => {
        fetchForms()
    }, [])

    const handleSaveForm = async (updatedForm: any) => {
        try {
            const res = await fetch("http://localhost:3000/api/forms", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(updatedForm)
            });
            const data = await res.json();
            if (data.success) {
                setSelectedForm(null);
                fetchForms();
                toast.success("Form saved successfully!");
            } else {
                toast.error("Failed to save form");
            }
        } catch (err) {
            console.error(err);
            toast.error("An error occurred");
        }
    }

    const handleEditForm = async (form: any) => {
        setLoading(true)
        try {
            const res = await fetch(`http://localhost:3000/api/forms/${form.slug}`)
            const data = await res.json()
            if (data.success) {
                setSelectedForm(data.data)
            } else {
                toast.error("Failed to load form details")
            }
        } catch (err) {
            console.error(err)
            toast.error("Error loading form")
        } finally {
            setLoading(false)
        }
    }

    if (selectedForm) {
        return <FormEditor form={selectedForm} onBack={() => setSelectedForm(null)} onSave={handleSaveForm} />
    }

    return (
        <div className="flex flex-col gap-6 max-w-4xl h-full">


            <Card className="flex-1 border-0 shadow-none bg-transparent">
                <CardHeader className="px-0 pt-0">
                    <CardTitle className="text-2xl">Available Forms</CardTitle>
                    <CardDescription>Select a dynamic form schema to customize its fields and validation rules.</CardDescription>
                </CardHeader>
                <CardContent className="px-0">
                    {loading ? (
                        <div className="flex flex-col items-center justify-center p-12 text-muted-foreground">
                            <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary/20 border-t-primary mb-4" />
                            <p>Loading your forms...</p>
                        </div>
                    ) : (
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                            {forms.map((form) => (
                                <Card 
                                    key={form.slug} 
                                    className="group cursor-pointer border-2 border-transparent bg-card hover:border-primary/40 hover:shadow-lg hover:-translate-y-1 transition-all duration-300 ease-in-out relative overflow-hidden"
                                    onClick={() => handleEditForm(form)}
                                >
                                    <CardContent className="p-6">
                                        <div className="flex items-start justify-between">
                                            <div className="flex flex-col gap-1">
                                                <div className="p-2.5 w-fit rounded-lg bg-blue-50 text-blue-600 dark:bg-blue-900/20 dark:text-blue-400 mb-2">
                                                    <FileTextIcon className="size-5" />
                                                </div>
                                                <h3 className="font-semibold text-lg">{form.name}</h3>
                                                <p className="text-sm text-muted-foreground leading-relaxed">
                                                    {form.description}
                                                </p>
                                            </div>
                                        </div>
                                        
                                        <div className="mt-6 flex items-center justify-between">
                                            <span className="text-xs font-medium px-2.5 py-1 bg-secondary text-secondary-foreground rounded-full">
                                                Active Schema
                                            </span>
                                            <Button 
                                                variant="ghost" 
                                                size="sm" 
                                                className="group-hover:bg-primary group-hover:text-primary-foreground transition-colors"
                                            >
                                                Edit Form
                                            </Button>
                                        </div>
                                    </CardContent>
                                </Card>
                            ))}
                            {forms.length === 0 && (
                                <div className="col-span-full flex flex-col items-center justify-center p-12 border-2 border-dashed rounded-xl text-muted-foreground">
                                    <FileTextIcon className="size-8 mb-3 opacity-20" />
                                    <p>No forms found.</p>
                                </div>
                            )}
                        </div>
                    )}
                </CardContent>
            </Card>
        </div>
    )
}
