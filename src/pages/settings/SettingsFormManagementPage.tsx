import React, { useEffect, useState } from "react"
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Link } from "react-router-dom"
import { ArrowLeftIcon } from "lucide-react"
import { FormEditor } from "./FormEditor"

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
            } else {
                alert("Failed to save form");
            }
        } catch (err) {
            console.error(err);
            alert("An error occurred");
        }
    }

    if (selectedForm) {
        return <FormEditor form={selectedForm} onBack={() => setSelectedForm(null)} onSave={handleSaveForm} />
    }

    return (
        <div className="flex flex-col gap-6 max-w-4xl h-full">
            <div className="flex items-center gap-4">
                <Button variant="ghost" size="icon" asChild>
                    <Link to="/settings">
                        <ArrowLeftIcon className="size-4" />
                    </Link>
                </Button>
                <div>
                    <h2 className="text-2xl font-semibold tracking-tight">Form Management</h2>
                    <p className="text-muted-foreground text-sm mt-1">
                        Configure schemas for dynamic forms.
                    </p>
                </div>
            </div>

            <Card className="flex-1">
                <CardHeader>
                    <CardTitle>Available Forms</CardTitle>
                    <CardDescription>Select a form to manage its fields.</CardDescription>
                </CardHeader>
                <CardContent>
                    {loading ? (
                        <div className="flex items-center justify-center p-8">Loading...</div>
                    ) : (
                        <div className="space-y-4">
                            {forms.map((form) => (
                                <div key={form.slug} className="flex items-center justify-between p-4 border rounded-lg">
                                    <div>
                                        <p className="font-medium">{form.name}</p>
                                        <p className="text-xs text-muted-foreground">{form.description}</p>
                                    </div>
                                    <Button variant="secondary" size="sm" onClick={() => setSelectedForm(form)}>
                                        Edit Form
                                    </Button>
                                </div>
                            ))}
                            {forms.length === 0 && (
                                <p className="text-muted-foreground text-sm">No forms found.</p>
                            )}
                        </div>
                    )}
                </CardContent>
            </Card>
        </div>
    )
}
