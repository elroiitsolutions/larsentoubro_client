import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from "@/components/ui/card"

export function FormBuilderPage() {
    return (
        <div className="flex flex-col gap-6 h-full">
            <div className="flex items-center justify-between">
                <div>
                    <h2 className="text-2xl font-semibold tracking-tight">Form Builder</h2>
                    <p className="text-muted-foreground text-sm mt-1">
                        Create and manage dynamic forms.
                    </p>
                </div>
            </div>

            <Card className="flex-1 flex flex-col">
                <CardHeader>
                    <CardTitle>Form Builder</CardTitle>
                    <CardDescription>Drag and drop fields to build your form</CardDescription>
                </CardHeader>
                <CardContent className="flex-1 min-h-[400px]">
                    <div className="h-full w-full flex items-center justify-center border-2 border-dashed rounded-md text-muted-foreground">
                        Form Builder Workspace
                    </div>
                </CardContent>
            </Card>
        </div>
    )
}
