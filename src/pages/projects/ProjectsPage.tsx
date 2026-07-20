import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { PlusIcon, FolderOpenIcon, SearchIcon, Loader2, EditIcon, TrashIcon } from "lucide-react"
import { Input } from "@/components/ui/input"
import { useState, useEffect } from "react"
import { useNavigate } from "react-router-dom"
import { DynamicFormSheet } from "@/components/DynamicFormSheet"
import { toast } from "sonner"

const statusColors: Record<string, string> = {
    Active: "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400",
    "On Hold": "bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400",
    Completed: "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400",
    Planning: "bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400",
}



export function ProjectsPage() {
    const [isFormOpen, setIsFormOpen] = useState(false);
    const [projects, setProjects] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const navigate = useNavigate();

    const [editingProject, setEditingProject] = useState<any>(null);

    const fetchProjects = async () => {
        setLoading(true);
        try {
            const res = await fetch("http://localhost:3000/api/projects");
            const data = await res.json();
            if (data.success) {
                setProjects(data.data);
            }
        } catch (error) {
            console.error(error);
            toast.error("Failed to fetch projects");
        } finally {
            setLoading(false);
        }
    };

    const handleDelete = async (id: string) => {
        if (!confirm("Are you sure you want to delete this project?")) return;
        try {
            const res = await fetch(`http://localhost:3000/api/projects/${id}`, { method: 'DELETE' });
            const data = await res.json();
            if (data.success) {
                toast.success("Project deleted");
                fetchProjects();
            } else {
                toast.error("Failed to delete project");
            }
        } catch (error) {
            toast.error("An error occurred");
        }
    };

    useEffect(() => {
        fetchProjects();
    }, []);

    return (
        <div className="flex flex-col gap-6">
            <div className="flex items-center justify-end pt-3">
                <Button className="gap-2" onClick={() => { setEditingProject(null); setIsFormOpen(true); }}>
                    <PlusIcon className="size-4" />
                    New Project
                </Button>
            </div>

            <DynamicFormSheet 
                isOpen={isFormOpen} 
                onClose={() => setIsFormOpen(false)} 
                formSlug="create-project" 
                submitEndpoint={editingProject ? `http://localhost:3000/api/projects/${editingProject._id}` : "http://localhost:3000/api/projects"}
                submitMethod={editingProject ? "PUT" : "POST"}
                onSubmitSuccess={() => {
                    toast.success(editingProject ? "Project updated successfully!" : "Project created successfully!");
                    fetchProjects();
                }} 
                defaultValues={editingProject ? { ...editingProject, projectName: editingProject.name } : undefined}
            />

            {/* Stats row */}
            <div className="grid gap-4 sm:grid-cols-4">
                {[
                    { label: "Total", value: projects.length.toString(), color: "text-foreground" },
                    { label: "Active", value: projects.filter(p => p.status === 'Active').length.toString(), color: "text-green-600" },
                    { label: "On Hold", value: projects.filter(p => p.status === 'On Hold').length.toString(), color: "text-yellow-600" },
                    { label: "Completed", value: projects.filter(p => p.status === 'Completed').length.toString(), color: "text-blue-600" },
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
                                    <th className="text-right px-6 py-3 font-medium text-muted-foreground w-24">Actions</th>
                                </tr>
                            </thead>
                            <tbody>
                                {loading ? (
                                    <tr>
                                        <td colSpan={8} className="px-6 py-8 text-center text-muted-foreground">
                                            <Loader2 className="size-6 animate-spin mx-auto mb-2" />
                                            Loading projects...
                                        </td>
                                    </tr>
                                ) : projects.length === 0 ? (
                                    <tr>
                                        <td colSpan={8} className="px-6 py-8 text-center text-muted-foreground">
                                            No projects found.
                                        </td>
                                    </tr>
                                ) : projects.map((p, i) => (
                                    <tr
                                        key={p._id}
                                        onClick={() => navigate(`/projects/${p._id}/stores`)}
                                        className={`border-b last:border-0 hover:bg-muted/30 cursor-pointer transition-colors ${i % 2 === 0 ? "" : "bg-muted/10"
                                            }`}
                                    >
                                        <td className="px-6 py-3 font-mono text-xs text-muted-foreground">{p._id.substring(p._id.length - 6)}</td>
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
                                        <td className="px-6 py-3 text-right">
                                            <div className="flex items-center justify-end gap-2">
                                                <Button variant="ghost" size="icon" className="size-8" onClick={(e) => { e.stopPropagation(); setEditingProject(p); setIsFormOpen(true); }}>
                                                    <EditIcon className="size-4 text-muted-foreground" />
                                                </Button>
                                                <Button variant="ghost" size="icon" className="size-8 hover:text-red-600" onClick={(e) => { e.stopPropagation(); handleDelete(p._id); }}>
                                                    <TrashIcon className="size-4 text-muted-foreground" />
                                                </Button>
                                            </div>
                                        </td>
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
