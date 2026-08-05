import {
    Card,
    CardContent,
    CardHeader,
    CardTitle,
} from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { PlusIcon, FolderOpenIcon, SearchIcon, Loader2, EditIcon, TrashIcon, TrendingUpIcon } from "lucide-react"
import { Input } from "@/components/ui/input"
import { useState, useEffect } from "react"
import { useNavigate } from "react-router-dom"
import { DynamicFormSheet } from "@/components/DynamicFormSheet"
import projectService from "@/services/project.service"
import { useAuth } from "@/contexts/AuthContext"
import { toast } from "sonner"
import NoAccessPage from "../NoAccessPage"

const statusColors: Record<string, string> = {
    Active: "bg-emerald-500/15 text-emerald-700 dark:text-emerald-400 border border-emerald-500/20",
    "On Hold": "bg-yellow-500/15 text-yellow-700 dark:text-yellow-400 border border-yellow-500/20",
    Completed: "bg-blue-500/15 text-blue-700 dark:text-blue-400 border border-blue-500/20",
    Planning: "bg-purple-500/15 text-purple-700 dark:text-purple-400 border border-purple-500/20",
}

export function ProjectsPage() {
    const { user } = useAuth();
    const [isFormOpen, setIsFormOpen] = useState(false);
    const [projects, setProjects] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const navigate = useNavigate();

    const [editingProject, setEditingProject] = useState<any>(null);

    const fetchProjects = async () => {
        setLoading(true);
        try {
            const data = await projectService.getProjects();
            if (data.success) {
                setProjects(data.data);
            }
        } catch (error: any) {
            console.error(error);
            const message = error?.response?.data?.message || "Failed to fetch projects";
            toast.error(message);
        } finally {
            setLoading(false);
        }
    };

    const handleDelete = async (id: string) => {
        if (!confirm("Are you sure you want to delete this project?")) return;
        try {
            const data = await projectService.deleteProject(id);
            if (data.success) {
                toast.success("Project deleted");
                fetchProjects();
            } else {
                toast.error(data.message || "Failed to delete project");
            }
        } catch (error: any) {
            console.error(error);
            const message = error?.response?.data?.message || "An error occurred";
            toast.error(message);
        }
    };

    useEffect(() => {
        fetchProjects();
    }, [user]);

    const isRestricted = Boolean(
        user &&
        user.role !== "Admin" &&
        (!user.allowedPages || !user.allowedPages.includes("/projects"))
    );

    if (isRestricted) {
        return <NoAccessPage />;
    }

    const bentoCardClass = "rounded-[24px] border border-border/50 bg-card/40 backdrop-blur-md shadow-sm hover:shadow-lg transition-all duration-300 overflow-hidden";

    return (
        <div className="flex flex-col gap-6 w-full mx-auto p-2 pb-10">
            <div className="flex items-center justify-between pt-2">
                <div>
                    <h1 className="text-3xl font-extrabold tracking-tight">Projects</h1>
                    <p className="text-muted-foreground mt-1 text-sm">Manage enterprise projects and assignments.</p>
                </div>
                {(!user || user.role === "Admin") && (
                    <Button className="gap-2 rounded-xl shadow-md cursor-pointer" size="lg" onClick={() => { setEditingProject(null); setIsFormOpen(true); }}>
                        <PlusIcon className="size-4" />
                        New Project
                    </Button>
                )}
            </div>

            <DynamicFormSheet 
                isOpen={isFormOpen} 
                onClose={() => setIsFormOpen(false)} 
                formSlug="create-project" 
                submitEndpoint={editingProject ? `/projects/${editingProject._id}` : "/projects"}
                submitMethod={editingProject ? "PUT" : "POST"}
                onSubmitSuccess={() => {
                    toast.success(editingProject ? "Project updated successfully!" : "Project created successfully!");
                    fetchProjects();
                }} 
                defaultValues={editingProject ? { ...editingProject, projectName: editingProject.name } : undefined}
            />

            {/* Stats row */}
            <div className="grid gap-6 sm:grid-cols-4">
                {[
                    { label: "Total Projects", value: projects.length.toString(), color: "text-foreground", bg: "bg-primary/10", icon: FolderOpenIcon, iconColor: "text-primary" },
                    { label: "Active", value: projects.filter(p => p.status === 'Active').length.toString(), color: "text-emerald-500", bg: "bg-emerald-500/10", icon: TrendingUpIcon, iconColor: "text-emerald-500" },
                    { label: "On Hold", value: projects.filter(p => p.status === 'On Hold').length.toString(), color: "text-yellow-500", bg: "bg-yellow-500/10", iconColor: "text-yellow-500" },
                    { label: "Completed", value: projects.filter(p => p.status === 'Completed').length.toString(), color: "text-blue-500", bg: "bg-blue-500/10", iconColor: "text-blue-500" },
                ].map((s) => (
                    <Card key={s.label} className={`${bentoCardClass} p-6 flex flex-col justify-between hover:-translate-y-1`}>
                        <div className="flex items-start justify-between">
                            <span className="text-xs font-semibold tracking-wide uppercase text-muted-foreground">{s.label}</span>
                            {s.icon && (
                                <div className={`p-2 rounded-lg ${s.bg} ${s.iconColor}`}>
                                    <s.icon className="size-4" />
                                </div>
                            )}
                        </div>
                        <div className="mt-4">
                            <span className={`text-4xl font-black tracking-tighter ${s.color}`}>{s.value}</span>
                        </div>
                    </Card>
                ))}
            </div>

            {/* Table card */}
            <Card className={`${bentoCardClass} flex flex-col mt-2`}>
                <CardHeader className="flex flex-row items-center gap-4 border-b border-border/50 bg-muted/20 px-6 py-5">
                    <div className="flex-1">
                        <CardTitle className="flex items-center gap-2 text-lg font-bold">
                            <FolderOpenIcon className="size-5 text-primary" />
                            Project Directory
                        </CardTitle>
                    </div>
                    <div className="relative w-64">
                        <SearchIcon className="absolute left-3 top-2.5 size-4 text-muted-foreground" />
                        <Input placeholder="Search projects..." className="pl-9 h-9 rounded-xl border-border/50 bg-background/50 focus-visible:ring-primary/30" />
                    </div>
                </CardHeader>
                <CardContent className="p-0">
                    <div className="overflow-x-auto">
                        <table className="w-full text-sm">
                            <thead>
                                <tr className="border-b border-border/50 bg-muted/10">
                                    <th className="text-left px-6 py-4 font-semibold text-muted-foreground uppercase text-[11px] tracking-wider">ID</th>
                                    <th className="text-left px-6 py-4 font-semibold text-muted-foreground uppercase text-[11px] tracking-wider">Project Name</th>
                                    <th className="text-left px-6 py-4 font-semibold text-muted-foreground uppercase text-[11px] tracking-wider">Department</th>
                                    <th className="text-left px-6 py-4 font-semibold text-muted-foreground uppercase text-[11px] tracking-wider">Lead</th>
                                    <th className="text-left px-6 py-4 font-semibold text-muted-foreground uppercase text-[11px] tracking-wider">Status</th>
                                    <th className="text-left px-6 py-4 font-semibold text-muted-foreground uppercase text-[11px] tracking-wider">Budget</th>
                                    <th className="text-left px-6 py-4 font-semibold text-muted-foreground uppercase text-[11px] tracking-wider">Deadline</th>
                                    {(!user || user.role === "Admin") && (
                                        <th className="text-right px-6 py-4 font-semibold text-muted-foreground uppercase text-[11px] tracking-wider">Actions</th>
                                    )}
                                </tr>
                            </thead>
                            <tbody>
                                {loading ? (
                                    <tr>
                                        <td colSpan={8} className="py-12 text-center">
                                            <div className="flex flex-col items-center gap-3">
                                                <Loader2 className="size-6 animate-spin text-primary" />
                                                <span className="text-xs text-muted-foreground">Loading projects...</span>
                                            </div>
                                        </td>
                                    </tr>
                                ) : projects.length === 0 ? (
                                    <tr>
                                        <td colSpan={8} className="py-12 text-center text-muted-foreground">
                                            No projects found.
                                        </td>
                                    </tr>
                                ) : (
                                    projects.map((p) => (
                                        <tr
                                            key={p._id}
                                            onClick={() => navigate(`/projects/${p._id}/stores`)}
                                            className="border-b border-border/40 last:border-0 hover:bg-muted/40 cursor-pointer transition-colors group"
                                        >
                                            <td className="px-6 py-4 font-mono text-xs text-muted-foreground/70">{p._id.substring(p._id.length - 6)}</td>
                                            <td className="px-6 py-4 font-semibold text-foreground/90 group-hover:text-primary transition-colors">{p.name}</td>
                                            <td className="px-6 py-4 text-muted-foreground">{p.department}</td>
                                            <td className="px-6 py-4 font-medium">{p.lead}</td>
                                            <td className="px-6 py-4">
                                                <span
                                                    className={`inline-flex items-center rounded-md px-2.5 py-1 text-xs font-semibold ${statusColors[p.status]}`}
                                                >
                                                    {p.status}
                                                </span>
                                            </td>
                                            <td className="px-6 py-4 font-medium">{p.budget}</td>
                                            <td className="px-6 py-4 text-muted-foreground text-xs">{p.deadline}</td>
                                            {(!user || user.role === "Admin") && (
                                                <td className="px-6 py-4 text-right">
                                                    <div className="flex items-center justify-end gap-1 transition-opacity">
                                                        <Button variant="ghost" size="icon" className="size-8 rounded-lg hover:bg-background shadow-sm cursor-pointer" onClick={(e) => { e.stopPropagation(); setEditingProject(p); setIsFormOpen(true); }}>
                                                            <EditIcon className="size-4 text-muted-foreground" />
                                                        </Button>
                                                        <Button variant="ghost" size="icon" className="size-8 rounded-lg hover:bg-red-500/10 hover:text-red-600 shadow-sm cursor-pointer" onClick={(e) => { e.stopPropagation(); handleDelete(p._id); }}>
                                                            <TrashIcon className="size-4 text-muted-foreground" />
                                                        </Button>
                                                    </div>
                                                </td>
                                            )}
                                        </tr>
                                    ))
                                )}
                            </tbody>
                        </table>
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}
