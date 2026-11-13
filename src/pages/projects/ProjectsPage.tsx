import {
    Card,
    CardContent,
    CardHeader,
    CardTitle,
} from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { PlusIcon, FolderOpenIcon, SearchIcon, Loader2, EditIcon, TrashIcon, CalendarIcon, MapPinIcon } from "lucide-react"
import { Input } from "@/components/ui/input"
import { useState, useEffect } from "react"
import { useNavigate } from "react-router-dom"
import { DynamicFormSheet } from "@/components/DynamicFormSheet"
import projectService from "@/services/project.service"
import formService from "@/services/form.service"
import { useAuth } from "@/contexts/AuthContext"
import { toast } from "sonner"
import NoAccessPage from "../NoAccessPage"
import { ConfirmDialog } from "@/components/ConfirmDialog"

const statusColors: Record<string, string> = {
    Active: "bg-emerald-500/15 text-emerald-700 dark:text-emerald-400 border border-emerald-500/20",
    "On Hold": "bg-yellow-500/15 text-yellow-700 dark:text-yellow-400 border border-yellow-500/20",
    Completed: "bg-blue-500/15 text-blue-700 dark:text-blue-400 border border-blue-500/20",
    Planning: "bg-purple-500/15 text-purple-700 dark:text-purple-400 border border-purple-500/20",
}

const defaultProjectFields = [
    { id: "projectName", name: "projectName", label: "Project Name" },
    { id: "projectCode", name: "projectCode", label: "Project Code" },
]

export function ProjectsPage() {
    const { user } = useAuth();
    const [isFormOpen, setIsFormOpen] = useState(false);
    const [projects, setProjects] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState("");
    const [formFields, setFormFields] = useState<any[]>([]);
    const navigate = useNavigate();

    const [editingProject, setEditingProject] = useState<any>(null);
    const [deletingProject, setDeletingProject] = useState<{ id: string; name: string } | null>(null);

    const activeFields = formFields.length > 0 ? formFields : defaultProjectFields;

    const getProjectFieldValue = (project: any, field: any): any => {
        if (!project) return "-";
        const name = field.name || "";
        const id = field.id || "";
        const label = (field.label || "").toLowerCase().trim();

        // 1. Check project name aliases
        if (name === "projectName" || name === "name" || label.includes("project name")) {
            return project.name || project.projectName || project[name] || "-";
        }

        // 2. Check project code aliases
        if (name === "projectCode" || name === "code" || label.includes("project code") || label.includes("code")) {
            return project.projectCode || project.code || project[name] || "-";
        }

        // 3. Direct property lookup
        if (name && project[name] !== undefined && project[name] !== null && project[name] !== "") {
            return project[name];
        }
        if (id && project[id] !== undefined && project[id] !== null && project[id] !== "") {
            return project[id];
        }

        // 4. Check customFields if present
        if (project.customFields && typeof project.customFields === "object") {
            if (name && project.customFields[name] !== undefined && project.customFields[name] !== null && project.customFields[name] !== "") {
                return project.customFields[name];
            }
            if (id && project.customFields[id] !== undefined && project.customFields[id] !== null && project.customFields[id] !== "") {
                return project.customFields[id];
            }
        }

        // 5. Normalized match across all project keys
        const normalizedTarget = (name || id || label).toLowerCase().replace(/[^a-z0-9]/g, "");
        if (normalizedTarget) {
            for (const key of Object.keys(project)) {
                if (key.toLowerCase().replace(/[^a-z0-9]/g, "") === normalizedTarget) {
                    const val = project[key];
                    if (val !== undefined && val !== null && val !== "") return val;
                }
            }
            if (project.customFields && typeof project.customFields === "object") {
                for (const key of Object.keys(project.customFields)) {
                    if (key.toLowerCase().replace(/[^a-z0-9]/g, "") === normalizedTarget) {
                        const val = project.customFields[key];
                        if (val !== undefined && val !== null && val !== "") return val;
                    }
                }
            }
        }

        return "-";
    };

    const renderCellContent = (project: any, field: any, index: number) => {
        const rawValue = getProjectFieldValue(project, field);
        const name = field.name || "";
        const label = (field.label || "").toLowerCase().trim();
        const isNameField = index === 0 || name === "projectName" || name === "name" || label.includes("project name");
        const isCodeField = name === "projectCode" || name === "code" || label.includes("project code");
        const isLocationField = name === "location" || label.includes("location") || label.includes("address");
        const isStatusField = name === "status" || label.includes("status");

        if (isNameField) {
            return (
                <td key={field.id || field.name || index} className="px-6 py-4 font-bold text-foreground group-hover:text-primary transition-colors whitespace-nowrap">
                    {rawValue}
                </td>
            );
        }

        if (isCodeField) {
            const codeVal = rawValue && rawValue !== "-" ? rawValue : (project.projectCode || project.code || (project._id ? project._id.substring(project._id.length - 6).toUpperCase() : "-"));
            return (
                <td key={field.id || field.name || index} className="px-6 py-4 font-mono text-xs text-muted-foreground whitespace-nowrap">
                    <span className="inline-flex items-center px-2.5 py-1 rounded-md bg-muted font-medium text-foreground border border-border/40">
                        {codeVal}
                    </span>
                </td>
            );
        }

        if (isLocationField) {
            return (
                <td key={field.id || field.name || index} className="px-6 py-4 text-muted-foreground whitespace-nowrap">
                    <div className="flex items-center gap-1.5">
                        <MapPinIcon className="size-3.5 text-muted-foreground/70 shrink-0" />
                        <span>{rawValue || "N/A"}</span>
                    </div>
                </td>
            );
        }

        if (isStatusField) {
            const statusKey = String(rawValue);
            const badgeClass = statusColors[statusKey] || "bg-purple-500/15 text-purple-700 dark:text-purple-400 border border-purple-500/20";
            return (
                <td key={field.id || field.name || index} className="px-6 py-4 whitespace-nowrap">
                    <span className={`inline-flex items-center rounded-md px-2.5 py-1 text-xs font-semibold ${badgeClass}`}>
                        {rawValue && rawValue !== "-" ? rawValue : "Active"}
                    </span>
                </td>
            );
        }

        const type = (field.type || "").toLowerCase().trim();
        const isDateField = type === "date" || type === "calendar" || type === "calender" || label.includes("date") || (typeof rawValue === "string" && /^\d{4}-\d{2}-\d{2}/.test(rawValue));

        if (isDateField && rawValue && rawValue !== "-") {
            const formatDateDisplay = (dateStr: string) => {
                try {
                    const parts = dateStr.split("-");
                    if (parts.length === 3) {
                        const d = new Date(parseInt(parts[0], 10), parseInt(parts[1], 10) - 1, parseInt(parts[2], 10));
                        if (!isNaN(d.getTime())) {
                            return d.toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" });
                        }
                    }
                    const d = new Date(dateStr);
                    return isNaN(d.getTime()) ? dateStr : d.toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" });
                } catch {
                    return dateStr;
                }
            };

            return (
                <td key={field.id || field.name || index} className="px-6 py-4 font-medium text-foreground whitespace-nowrap">
                    <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-muted/60 text-foreground font-mono text-xs border border-border/40">
                        <CalendarIcon className="size-3.5 text-primary shrink-0" />
                        <span>{formatDateDisplay(String(rawValue))}</span>
                    </div>
                </td>
            );
        }

        let displayValue = rawValue;
        if (typeof rawValue === "boolean") {
            displayValue = rawValue ? "Yes" : "No";
        } else if (Array.isArray(rawValue)) {
            displayValue = rawValue.join(", ");
        } else if (typeof rawValue === "object" && rawValue !== null) {
            displayValue = JSON.stringify(rawValue);
        }

        return (
            <td key={field.id || field.name || index} className="px-6 py-4 font-medium text-muted-foreground whitespace-nowrap">
                {displayValue || "-"}
            </td>
        );
    };

    const getEditingProjectDefaultValues = (proj: any, fields: any[]) => {
        if (!proj) return undefined;
        const defaults: Record<string, any> = { ...proj };
        defaults.projectName = proj.name || proj.projectName || "";
        defaults.name = proj.name || proj.projectName || "";
        defaults.projectCode = proj.projectCode || proj.code || "";
        defaults.code = proj.projectCode || proj.code || "";

        if (proj.customFields && typeof proj.customFields === "object") {
            Object.assign(defaults, proj.customFields);
        }

        fields.forEach((f) => {
            const val = getProjectFieldValue(proj, f);
            if (val !== "-" && val !== undefined) {
                if (f.name && defaults[f.name] === undefined) defaults[f.name] = val;
                if (f.id && defaults[f.id] === undefined) defaults[f.id] = val;
            }
        });

        return defaults;
    };

    const fetchFormSchema = async () => {
        try {
            const res = await formService.getFormBySlug("create-project");
            if (res.success && res.data && Array.isArray(res.data.fields) && res.data.fields.length > 0) {
                const sorted = [...res.data.fields].sort((a, b) => (a.order ?? 0) - (b.order ?? 0));
                setFormFields(sorted);
            }
        } catch (err) {
            console.error("Failed to fetch create-project form schema:", err);
        }
    };

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

    const handleDeleteProject = async (id: string) => {
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
        fetchFormSchema();
    }, [user]);

    useEffect(() => {
        const handleFocus = () => {
            fetchFormSchema();
            fetchProjects();
        };
        window.addEventListener("focus", handleFocus);
        return () => window.removeEventListener("focus", handleFocus);
    }, []);

    const filteredProjects = projects.filter((p) => {
        if (!searchQuery.trim()) return true;
        const q = searchQuery.toLowerCase();
        const basicMatch = (
            (p.name && String(p.name).toLowerCase().includes(q)) ||
            (p.projectName && String(p.projectName).toLowerCase().includes(q)) ||
            (p.projectCode && String(p.projectCode).toLowerCase().includes(q)) ||
            (p._id && String(p._id).toLowerCase().includes(q))
        );
        if (basicMatch) return true;

        return activeFields.some((field) => {
            const val = getProjectFieldValue(p, field);
            return val && val !== "-" && String(val).toLowerCase().includes(q);
        });
    });

    const isRestricted = Boolean(
        user &&
        user.role !== "Admin" &&
        user.role !== "Vendor" &&
        (!user.allowedPages || !user.allowedPages.includes("/projects"))
    );

    if (isRestricted) {
        return <NoAccessPage />;
    }

    const cardClass = "rounded-xl border border-border/60 bg-card shadow-xs transition-all duration-200 overflow-hidden";

    return (
        <div className="flex flex-col gap-4 w-full mx-auto p-4">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-xl font-bold tracking-tight text-foreground">Projects</h1>
                    <p className="text-muted-foreground text-xs">Manage enterprise projects and assignments.</p>
                </div>
                {(!user || user.role === "Admin") && (
                    <Button className="gap-1.5 rounded-lg cursor-pointer" size="sm" onClick={() => { setEditingProject(null); setIsFormOpen(true); }}>
                        <PlusIcon className="size-3.5" />
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
                    fetchFormSchema();
                }}
                defaultValues={editingProject ? getEditingProjectDefaultValues(editingProject, activeFields) : undefined}
            />

            {/* Table card */}
            <Card className={`${cardClass} flex flex-col`}>
                <CardHeader className="flex flex-row items-center gap-3 border-b border-border/50 bg-muted/20 px-6 py-4">
                    <div className="flex-1">
                        <CardTitle className="flex items-center gap-2 text-sm font-semibold">
                            <FolderOpenIcon className="size-4 text-primary" />
                            Project Directory
                        </CardTitle>
                    </div>
                    <div className="relative w-56">
                        <SearchIcon className="absolute left-2.5 top-2.5 size-3.5 text-muted-foreground" />
                        <Input
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            placeholder="Search projects..."
                            className="pl-8 h-8 text-xs rounded-lg border-border/50 bg-background/50 focus-visible:ring-primary/30"
                        />
                    </div>
                </CardHeader>
                <CardContent className="p-0">
                    <div className="overflow-x-auto">
                        <table className="w-full text-sm">
                            <thead>
                                <tr className="border-b border-border/50 bg-muted/10">
                                    {activeFields.map((field, idx) => (
                                        <th
                                            key={field.id || field.name || idx}
                                            className="text-left px-6 py-4 font-semibold text-muted-foreground uppercase text-[11px] tracking-wider whitespace-nowrap"
                                        >
                                            {field.label || field.name}
                                        </th>
                                    ))}
                                    {(!user || user.role === "Admin") && (
                                        <th className="text-right px-6 py-4 font-semibold text-muted-foreground uppercase text-[11px] tracking-wider whitespace-nowrap">
                                            Actions
                                        </th>
                                    )}
                                </tr>
                            </thead>
                            <tbody>
                                {loading ? (
                                    <tr>
                                        <td colSpan={activeFields.length + ((!user || user.role === "Admin") ? 1 : 0)} className="py-8 text-center">
                                            <div className="flex flex-col items-center gap-2">
                                                <Loader2 className="size-5 animate-spin text-primary" />
                                                <span className="text-xs text-muted-foreground">Loading projects...</span>
                                            </div>
                                        </td>
                                    </tr>
                                ) : filteredProjects.length === 0 ? (
                                    <tr>
                                        <td colSpan={activeFields.length + ((!user || user.role === "Admin") ? 1 : 0)} className="py-8 text-center text-muted-foreground">
                                            {searchQuery ? "No matching projects found." : "No projects found."}
                                        </td>
                                    </tr>
                                ) : (
                                    filteredProjects.map((p) => (
                                        <tr
                                            key={p._id}
                                            onClick={() => navigate(`/projects/${p._id}/stores`)}
                                            className="border-b border-border/40 last:border-0 hover:bg-muted/40 cursor-pointer transition-colors group"
                                        >
                                            {activeFields.map((field, idx) => renderCellContent(p, field, idx))}
                                            {(!user || user.role === "Admin") && (
                                                <td className="px-6 py-4 text-right whitespace-nowrap" onClick={(e) => e.stopPropagation()}>
                                                    <div className="flex items-center justify-end gap-1">
                                                        <Button
                                                            variant="ghost"
                                                            size="icon-xs"
                                                            className="rounded-md hover:bg-background shadow-xs cursor-pointer"
                                                            onClick={(e) => {
                                                                e.stopPropagation();
                                                                setEditingProject(p);
                                                                setIsFormOpen(true);
                                                            }}
                                                        >
                                                            <EditIcon className="size-3.5 text-muted-foreground" />
                                                        </Button>
                                                        <Button
                                                            variant="ghost"
                                                            size="icon-xs"
                                                            className="rounded-md hover:bg-red-500/10 hover:text-red-600 shadow-xs cursor-pointer"
                                                            onClick={(e) => {
                                                                e.stopPropagation();
                                                                setDeletingProject({ id: p._id, name: p.name || p.projectName || p.title || "this project" });
                                                            }}
                                                        >
                                                            <TrashIcon className="size-3.5 text-muted-foreground" />
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

            <ConfirmDialog
                isOpen={!!deletingProject}
                onClose={() => setDeletingProject(null)}
                onConfirm={async () => {
                    if (deletingProject) {
                        await handleDeleteProject(deletingProject.id);
                    }
                }}
                title="Delete Project"
                description={`Are you sure you want to delete "${deletingProject?.name || "this project"}"? This action cannot be undone.`}
                confirmText="Delete Project"
            />
        </div>
    );
}
