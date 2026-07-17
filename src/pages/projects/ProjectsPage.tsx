import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { PlusIcon, FolderOpenIcon, SearchIcon, Loader2 } from "lucide-react"
import { Input } from "@/components/ui/input"
import { useState } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog"
import { DynamicForm } from "@/components/DynamicForm"

const statusColors: Record<string, string> = {
    Active: "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400",
    "On Hold": "bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400",
    Completed: "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400",
    Planning: "bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400",
}

const projects = [
    {
        id: "PRJ-001",
        name: "Smart City Infrastructure",
        department: "Civil Engineering",
        lead: "Arun Kumar",
        status: "Active",
        budget: "₹4.2 Cr",
        deadline: "Dec 2026",
    },
    {
        id: "PRJ-002",
        name: "Power Grid Upgrade",
        department: "Electrical",
        lead: "Meena Sharma",
        status: "Planning",
        budget: "₹7.8 Cr",
        deadline: "Mar 2027",
    },
    {
        id: "PRJ-003",
        name: "Highway Extension Phase 2",
        department: "Construction",
        lead: "Ravi Pillai",
        status: "Active",
        budget: "₹12.5 Cr",
        deadline: "Jun 2027",
    },
    {
        id: "PRJ-004",
        name: "Water Treatment Plant",
        department: "Environmental",
        lead: "Sita Nair",
        status: "On Hold",
        budget: "₹3.1 Cr",
        deadline: "Sep 2026",
    },
    {
        id: "PRJ-005",
        name: "Metro Rail Feasibility",
        department: "Transport",
        lead: "Vikram Rao",
        status: "Completed",
        budget: "₹1.5 Cr",
        deadline: "Jan 2026",
    },
    {
        id: "PRJ-006",
        name: "Industrial Park Setup",
        department: "Civil Engineering",
        lead: "Anjali Das",
        status: "Active",
        budget: "₹9.0 Cr",
        deadline: "Feb 2027",
    },
]

export function ProjectsPage() {
    const [isFormOpen, setIsFormOpen] = useState(false);
    const [formConfig, setFormConfig] = useState<any>(null);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState('');

    const handleOpenForm = async () => {
        setIsFormOpen(true);
        if (formConfig) return; // Already loaded

        setIsLoading(true);
        setError('');
        try {
            const res = await fetch(`${import.meta.env.VITE_API_URL}/api/forms/project-creation`);
            const data = await res.json();
            if (data.success && data.data && data.data.fields && data.data.fields.length > 0) {
                setFormConfig(data.data);
            } else {
                setError('The Project Creation form has not been configured by the admin yet.');
            }
        } catch (err) {
            setError('Failed to load form configuration. Make sure backend is running.');
        } finally {
            setIsLoading(false);
        }
    };

    const handleFormSubmit = async (data: any) => {
        try {
            const res = await fetch(`${import.meta.env.VITE_API_URL}/api/forms/project-creation/submit`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(data)
            });
            const result = await res.json();
            if (result.success) {
                alert("Project Created Successfully!");
                setIsFormOpen(false);
            } else {
                alert("Submission failed: " + JSON.stringify(result.errors));
            }
        } catch (err) {
            alert("Error submitting form.");
        }
    };

    return (
        <div className="flex flex-col gap-6">
            <div className="flex items-center justify-between">
                <div>
                    <h2 className="text-2xl font-semibold tracking-tight">Projects</h2>
                    <p className="text-muted-foreground text-sm mt-1">
                        Manage and track all your enterprise projects.
                    </p>
                </div>
                <Button className="gap-2" onClick={handleOpenForm}>
                    <PlusIcon className="size-4" />
                    New Project
                </Button>
            </div>

            <Dialog open={isFormOpen} onOpenChange={setIsFormOpen}>
                <DialogContent className="max-h-[85vh] overflow-y-auto">
                    <DialogHeader>
                        <DialogTitle>New Project</DialogTitle>
                        <DialogDescription>
                            Create a new project using the dynamically configured form.
                        </DialogDescription>
                    </DialogHeader>
                    
                    <div className="py-4">
                        {isLoading ? (
                            <div className="flex justify-center p-8"><Loader2 className="animate-spin text-muted-foreground size-8" /></div>
                        ) : error ? (
                            <div className="p-4 bg-muted text-muted-foreground rounded-md text-sm border">
                                {error}
                            </div>
                        ) : formConfig ? (
                            <DynamicForm formDefinition={formConfig} onSubmit={handleFormSubmit} />
                        ) : null}
                    </div>
                </DialogContent>
            </Dialog>

            {/* Stats row */}
            <div className="grid gap-4 sm:grid-cols-4">
                {[
                    { label: "Total", value: "6", color: "text-foreground" },
                    { label: "Active", value: "3", color: "text-green-600" },
                    { label: "On Hold", value: "1", color: "text-yellow-600" },
                    { label: "Completed", value: "1", color: "text-blue-600" },
                ].map((s) => (
                    <Card key={s.label} className="py-4">
                        <CardContent className="flex flex-col items-center text-center px-4">
                            <span className={`text-3xl font-bold ${s.color}`}>{s.value}</span>
                            <span className="text-xs text-muted-foreground mt-1">{s.label}</span>
                        </CardContent>
                    </Card>
                ))}
            </div>

            {/* Table card */}
            <Card>
                <CardHeader className="flex flex-row items-center gap-4">
                    <div className="flex-1">
                        <CardTitle className="flex items-center gap-2 text-base">
                            <FolderOpenIcon className="size-4 text-muted-foreground" />
                            All Projects
                        </CardTitle>
                        <CardDescription>Click a row to view project details</CardDescription>
                    </div>
                    <div className="relative w-56">
                        <SearchIcon className="absolute left-2.5 top-2.5 size-3.5 text-muted-foreground" />
                        <Input placeholder="Search projects..." className="pl-8 h-8 text-sm" />
                    </div>
                </CardHeader>
                <CardContent className="p-0">
                    <div className="overflow-x-auto">
                        <table className="w-full text-sm">
                            <thead>
                                <tr className="border-b bg-muted/40">
                                    <th className="text-left px-6 py-3 font-medium text-muted-foreground">ID</th>
                                    <th className="text-left px-6 py-3 font-medium text-muted-foreground">Project Name</th>
                                    <th className="text-left px-6 py-3 font-medium text-muted-foreground">Department</th>
                                    <th className="text-left px-6 py-3 font-medium text-muted-foreground">Lead</th>
                                    <th className="text-left px-6 py-3 font-medium text-muted-foreground">Status</th>
                                    <th className="text-left px-6 py-3 font-medium text-muted-foreground">Budget</th>
                                    <th className="text-left px-6 py-3 font-medium text-muted-foreground">Deadline</th>
                                </tr>
                            </thead>
                            <tbody>
                                {projects.map((p, i) => (
                                    <tr
                                        key={p.id}
                                        className={`border-b last:border-0 hover:bg-muted/30 cursor-pointer transition-colors ${i % 2 === 0 ? "" : "bg-muted/10"
                                            }`}
                                    >
                                        <td className="px-6 py-3 font-mono text-xs text-muted-foreground">{p.id}</td>
                                        <td className="px-6 py-3 font-medium">{p.name}</td>
                                        <td className="px-6 py-3 text-muted-foreground">{p.department}</td>
                                        <td className="px-6 py-3">{p.lead}</td>
                                        <td className="px-6 py-3">
                                            <span
                                                className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${statusColors[p.status]}`}
                                            >
                                                {p.status}
                                            </span>
                                        </td>
                                        <td className="px-6 py-3 font-medium">{p.budget}</td>
                                        <td className="px-6 py-3 text-muted-foreground">{p.deadline}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </CardContent>
            </Card>
        </div>
    )
}
