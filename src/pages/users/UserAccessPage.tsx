import * as React from "react"
import { useParams, useNavigate } from "react-router-dom"
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import {
    ShieldCheckIcon,
    FolderOpenIcon,
    StoreIcon,
    UserIcon,
    ShieldAlertIcon,
    Loader2,
    CheckIcon,
    LockIcon,
    LayoutDashboardIcon,
    UsersIcon,
    Settings2Icon,
    ArrowLeftIcon,
    SearchIcon,
    MailIcon,
    PhoneIcon,
    BadgeCheckIcon,
    FilterIcon,
    XIcon,
    KeyIcon
} from "lucide-react"
import projectService from "@/services/project.service"
import storeService from "@/services/store.service"
import userService from "@/services/user.service"
import type { UserRecord } from "@/services/user.service"
import { toast } from "sonner"

const AVAILABLE_PAGES = [
    { title: "Dashboard", url: "/dashboard", icon: LayoutDashboardIcon, desc: "Overview analytics & KPIs" },
    { title: "Projects", url: "/projects", icon: FolderOpenIcon, desc: "Project directory & status" },
    { title: "Stores", url: "/stores", icon: StoreIcon, desc: "Store inventory & management" },
    { title: "Tools", url: "/tools", icon: StoreIcon, desc: "Tool tracking & inventory" },
    { title: "Users Management", url: "/users", icon: UsersIcon, desc: "Team list & access control" },
    { title: "Settings & Forms", url: "/settings", icon: Settings2Icon, desc: "System config & form builder" },
]

const avatarColors = [
    "bg-gradient-to-br from-blue-500 to-blue-700",
    "bg-gradient-to-br from-emerald-500 to-emerald-700",
    "bg-gradient-to-br from-purple-500 to-purple-700",
    "bg-gradient-to-br from-orange-500 to-orange-700",
    "bg-gradient-to-br from-red-500 to-red-700",
    "bg-gradient-to-br from-teal-500 to-teal-700",
    "bg-gradient-to-br from-yellow-500 to-yellow-700",
    "bg-gradient-to-br from-pink-500 to-pink-700",
]

export function UserAccessPage() {
    const { id } = useParams<{ id: string }>()
    const navigate = useNavigate()

    const [userRecord, setUserRecord] = React.useState<UserRecord | null>(null)
    const [loading, setLoading] = React.useState(true)
    const [saving, setSaving] = React.useState(false)

    // Edit profile state (optional collapsible)
    const [isEditingProfile, setIsEditingProfile] = React.useState(false)
    const [name, setName] = React.useState("")
    const [email, setEmail] = React.useState("")
    const [phone, setPhone] = React.useState("")
    const [password, setPassword] = React.useState("")

    // Permissions and scopes state
    const [allowedPages, setAllowedPages] = React.useState<string[]>([])
    const [allProjects, setAllProjects] = React.useState<any[]>([])
    const [allStores, setAllStores] = React.useState<any[]>([])
    const [selectedProjects, setSelectedProjects] = React.useState<string[]>([])
    const [selectedStores, setSelectedStores] = React.useState<string[]>([])

    // Search and filter states
    const [projectSearch, setProjectSearch] = React.useState("")
    const [projectFilter, setProjectFilter] = React.useState<"all" | "selected" | "unselected">("all")
    const [storeSearch, setStoreSearch] = React.useState("")
    const [storeFilter, setStoreFilter] = React.useState<"all" | "assigned" | "unassigned">("all")

    // Fetch initial user data, projects, and stores
    const loadAllData = React.useCallback(async () => {
        if (!id) return
        setLoading(true)
        try {
            const [userRes, projRes, storeRes] = await Promise.all([
                userService.getUserById(id),
                projectService.getProjects(),
                storeService.getStores(),
            ])

            if (userRes.success && userRes.data) {
                const u = userRes.data
                setUserRecord(u)
                setName(u.name || "")
                setEmail(u.email || "")
                setPhone(u.phonenumber || "")
                setAllowedPages(u.allowedPages || ["/dashboard", "/projects", "/stores"])

                const pIds = (u.projects || []).map((p: any) =>
                    typeof p === "object" ? p._id : p
                )
                setSelectedProjects(pIds)

                const sIds = (u.stores || []).map((s: any) =>
                    typeof s === "object" ? s._id : s
                )
                setSelectedStores(sIds)
            } else {
                toast.error("User not found.")
                navigate("/users")
                return
            }

            if (projRes.success) {
                setAllProjects(projRes.data || [])
            }
            if (storeRes.success) {
                setAllStores(storeRes.data || [])
            }
        } catch (error: any) {
            console.error("Failed to load user permissions data:", error)
            toast.error("Could not load user permissions data.")
            navigate("/users")
        } finally {
            setLoading(false)
        }
    }, [id, navigate])

    React.useEffect(() => {
        loadAllData()
    }, [loadAllData])

    // Compute stores belonging ONLY to selected projects
    const availableStoresForProjects = React.useMemo(() => {
        if (selectedProjects.length === 0) return []
        return allStores.filter((s) => {
            const storeProjId =
                s.projectId ||
                (s.project && typeof s.project === "object"
                    ? s.project._id
                    : s.project)
            return selectedProjects.includes(String(storeProjId))
        })
    }, [allStores, selectedProjects])

    // Automatically remove stores that don't belong to selected projects
    React.useEffect(() => {
        const availableStoreIds = availableStoresForProjects.map((s) => String(s._id))
        setSelectedStores((prev) =>
            prev.filter((storeId) => availableStoreIds.includes(String(storeId)))
        )
    }, [availableStoresForProjects])

    // Filtered Projects for display
    const filteredProjects = React.useMemo(() => {
        const term = projectSearch.toLowerCase().trim()
        return allProjects.filter((p) => {
            const matchesSearch =
                p.name?.toLowerCase().includes(term) ||
                p.code?.toLowerCase().includes(term) ||
                p.location?.toLowerCase().includes(term)

            const isSelected = selectedProjects.includes(p._id)
            if (projectFilter === "selected" && !isSelected) return false
            if (projectFilter === "unselected" && isSelected) return false

            return matchesSearch
        })
    }, [allProjects, projectSearch, projectFilter, selectedProjects])

    // Filtered Stores for display
    const filteredStores = React.useMemo(() => {
        const term = storeSearch.toLowerCase().trim()
        return availableStoresForProjects.filter((s) => {
            const projectName =
                s.projectName ||
                (s.project && typeof s.project === "object"
                    ? s.project.name
                    : "Project")
            const matchesSearch =
                s.name?.toLowerCase().includes(term) ||
                s.storeName?.toLowerCase().includes(term) ||
                s.code?.toLowerCase().includes(term) ||
                projectName?.toLowerCase().includes(term)

            const isAssigned = selectedStores.includes(s._id)
            if (storeFilter === "assigned" && !isAssigned) return false
            if (storeFilter === "unassigned" && isAssigned) return false

            return matchesSearch
        })
    }, [availableStoresForProjects, storeSearch, storeFilter, selectedStores])

    // Group Stores by Project Name
    const storesGroupedByProject = React.useMemo(() => {
        const groups: Record<string, any[]> = {}
        filteredStores.forEach((s) => {
            const projectName =
                s.projectName ||
                (s.project && typeof s.project === "object"
                    ? s.project.name
                    : "Assigned Project")
            if (!groups[projectName]) {
                groups[projectName] = []
            }
            groups[projectName].push(s)
        })
        return groups
    }, [filteredStores])

    // Automatically enable Projects Page permission if any Project is assigned
    React.useEffect(() => {
        if (selectedProjects.length > 0) {
            setAllowedPages((prev) =>
                prev.includes("/projects") ? prev : [...prev, "/projects"]
            )
        }
    }, [selectedProjects])

    // Automatically enable Stores & Tools Page permission if any Store is assigned
    React.useEffect(() => {
        if (selectedStores.length > 0) {
            setAllowedPages((prev) => {
                const next = [...prev]
                if (!next.includes("/stores")) next.push("/stores")
                if (!next.includes("/tools")) next.push("/tools")
                return next
            })
        }
    }, [selectedStores])

    const togglePage = (url: string) => {
        if (userRecord?.role === "Admin" || userRecord?.role === "Vendor") return;
        setAllowedPages((prev) =>
            prev.includes(url)
                ? prev.filter((p) => p !== url)
                : [...prev, url]
        )
    }

    const toggleProject = (projId: string) => {
        setSelectedProjects((prev) =>
            prev.includes(projId)
                ? prev.filter((id) => id !== projId)
                : [...prev, projId]
        )
    }

    const toggleStore = (storeId: string) => {
        setSelectedStores((prev) =>
            prev.includes(storeId)
                ? prev.filter((id) => id !== storeId)
                : [...prev, storeId]
        )
    }

    const handleSelectAllPages = () => {
        if (userRecord?.role === "Admin" || userRecord?.role === "Vendor") return;
        if (allowedPages.length === AVAILABLE_PAGES.length) {
            setAllowedPages([])
        } else {
            setAllowedPages(AVAILABLE_PAGES.map((p) => p.url))
        }
    }

    const handleSelectAllFilteredProjects = () => {
        const filteredIds = filteredProjects.map((p) => p._id)
        const allFilteredSelected = filteredIds.every((id) =>
            selectedProjects.includes(id)
        )
        if (allFilteredSelected) {
            setSelectedProjects((prev) =>
                prev.filter((id) => !filteredIds.includes(id))
            )
        } else {
            setSelectedProjects((prev) =>
                Array.from(new Set([...prev, ...filteredIds]))
            )
        }
    }

    const handleSelectAllFilteredStores = () => {
        const filteredIds = filteredStores.map((s) => s._id)
        const allFilteredSelected = filteredIds.every((id) =>
            selectedStores.includes(id)
        )
        if (allFilteredSelected) {
            setSelectedStores((prev) =>
                prev.filter((id) => !filteredIds.includes(id))
            )
        } else {
            setSelectedStores((prev) =>
                Array.from(new Set([...prev, ...filteredIds]))
            )
        }
    }

    const handleSave = async () => {
        if (!userRecord) return

        setSaving(true)
        try {
            let finalAllowedPages = [...allowedPages]
            if (userRecord.role === "Admin") {
                finalAllowedPages = AVAILABLE_PAGES.map((p) => p.url)
            } else if (userRecord.role === "Vendor") {
                finalAllowedPages = ["/stores", "/tools"]
            } else {
                if (selectedProjects.length > 0 && !finalAllowedPages.includes("/projects")) {
                    finalAllowedPages.push("/projects")
                }
                if (selectedStores.length > 0) {
                    if (!finalAllowedPages.includes("/stores")) finalAllowedPages.push("/stores")
                    if (!finalAllowedPages.includes("/tools")) finalAllowedPages.push("/tools")
                }
            }

            const payload: Record<string, unknown> = {
                name: name.trim(),
                email: email.trim(),
                phonenumber: phone.trim(),
                allowedPages: finalAllowedPages,
                projects: selectedProjects,
                stores: selectedStores,
            }

            if (password && password.trim()) {
                payload.password = password.trim()
            }

            const res = await userService.updateUser(userRecord._id, payload)
            if (res.success && res.data) {
                toast.success("User permissions and access updated successfully!")
                navigate("/users")
            } else {
                toast.error(res.message || "Failed to update user access.")
            }
        } catch (error: any) {
            const msg =
                error?.response?.data?.message ||
                error.message ||
                "Failed to save permissions."
            toast.error(msg)
        } finally {
            setSaving(false)
        }
    }

    if (loading) {
        return (
            <div className="flex flex-col items-center justify-center min-h-[70vh] gap-4">
                <div className="size-10 animate-spin rounded-full border-[3px] border-primary border-t-transparent shadow-sm" />
                <p className="font-semibold text-muted-foreground">Loading user access configuration...</p>
            </div>
        )
    }

    if (!userRecord) {
        return null
    }

    const initials = userRecord.name
        .split(" ")
        .map((n) => n[0])
        .join("")
        .substring(0, 2)
        .toUpperCase()
    const isAdmin = userRecord.role === "Admin"

    return (
        /* CRITICAL: flex-1 min-h-0 overflow-y-auto ensures the page is fully scrollable inside SidebarLayout */
        <div className="flex-1 min-h-0 overflow-y-auto flex flex-col w-full max-w-7xl mx-auto p-3 sm:p-4 gap-5 animate-in fade-in duration-200">
            {/* Header with Essential User Info and Actions */}
            <div className="bg-card/80 backdrop-blur-md rounded-2xl border border-border/70 p-4 shadow-xs shrink-0">
                <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                    {/* Left: Back Button + User Essential Profile */}
                    <div className="flex items-center gap-3.5 min-w-0">
                        <Button
                            variant="outline"
                            size="icon"
                            onClick={() => navigate("/users")}
                            className="h-10 w-10 rounded-xl border-border/80 hover:bg-muted shrink-0 cursor-pointer"
                            title="Back to Users List"
                        >
                            <ArrowLeftIcon className="size-5" />
                        </Button>

                        <div
                            className={`flex size-11 shrink-0 items-center justify-center rounded-xl text-base font-bold text-white shadow-sm ${
                                avatarColors[userRecord.name.length % avatarColors.length]
                            }`}
                        >
                            {initials}
                        </div>

                        <div className="min-w-0">
                            <div className="flex items-center gap-2 flex-wrap">
                                <h1 className="text-lg sm:text-xl font-extrabold text-foreground truncate">
                                    {userRecord.name}
                                </h1>
                                <span className="text-xs bg-primary/10 text-primary px-2 py-0.5 rounded-full font-mono font-bold shrink-0">
                                    {userRecord.user_id}
                                </span>
                                {isAdmin ? (
                                    <span className="inline-flex items-center gap-1 text-[11px] font-bold text-rose-600 dark:text-rose-400 bg-rose-500/10 px-2 py-0.5 rounded-md border border-rose-500/20">
                                        <ShieldAlertIcon className="size-3" />
                                        Admin (Unrestricted)
                                    </span>
                                ) : (
                                    <span className="inline-flex items-center gap-1 text-[11px] font-semibold bg-primary/10 text-primary px-2 py-0.5 rounded-md">
                                        <BadgeCheckIcon className="size-3" />
                                        Authorized Member
                                    </span>
                                )}
                            </div>
                            <div className="flex flex-wrap items-center gap-3 text-xs text-muted-foreground mt-0.5">
                                <span className="flex items-center gap-1 truncate">
                                    <MailIcon className="size-3 text-primary/70 shrink-0" />
                                    {userRecord.email}
                                </span>
                                {userRecord.phonenumber && (
                                    <span className="flex items-center gap-1 truncate">
                                        <PhoneIcon className="size-3 text-primary/70 shrink-0" />
                                        {userRecord.phonenumber}
                                    </span>
                                )}
                            </div>
                        </div>
                    </div>

                    {/* Right: Actions */}
                    <div className="flex items-center gap-2.5 shrink-0 self-end lg:self-center">
                        <Button
                            variant="outline"
                            size="sm"
                            onClick={() => setIsEditingProfile(!isEditingProfile)}
                            className="h-9 rounded-xl text-xs font-semibold px-3.5 gap-1.5 cursor-pointer"
                        >
                            <UserIcon className="size-3.5 text-primary" />
                            <span>{isEditingProfile ? "Hide Profile Editor" : "Edit Profile / Password"}</span>
                        </Button>
                        <Button
                            variant="outline"
                            size="sm"
                            onClick={() => navigate("/users")}
                            className="h-9 rounded-xl px-4 text-xs font-semibold cursor-pointer"
                            disabled={saving}
                        >
                            Cancel
                        </Button>
                        <Button
                            size="sm"
                            onClick={handleSave}
                            className="h-9 rounded-xl px-5 text-xs font-bold bg-primary text-primary-foreground hover:bg-primary/90 gap-1.5 cursor-pointer shadow-xs"
                            disabled={saving}
                        >
                            {saving && <Loader2 className="size-3.5 animate-spin" />}
                            <span>Save Permissions & Access</span>
                        </Button>
                    </div>
                </div>

                {/* Optional Collapsible Profile & Password Editor */}
                {isEditingProfile && (
                    <div className="mt-4 pt-4 border-t border-border/60 grid grid-cols-1 sm:grid-cols-4 gap-3 animate-in fade-in duration-200">
                        <div>
                            <label className="text-xs font-bold text-foreground block mb-1">
                                Full Name
                            </label>
                            <Input
                                value={name}
                                onChange={(e) => setName(e.target.value)}
                                placeholder="Full Name"
                                className="h-9 rounded-xl text-xs"
                            />
                        </div>
                        <div>
                            <label className="text-xs font-bold text-foreground block mb-1">
                                Email Address
                            </label>
                            <Input
                                type="email"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                placeholder="Email Address"
                                className="h-9 rounded-xl text-xs"
                            />
                        </div>
                        <div>
                            <label className="text-xs font-bold text-foreground block mb-1">
                                Phone Number
                            </label>
                            <Input
                                value={phone}
                                onChange={(e) => setPhone(e.target.value)}
                                placeholder="Phone Number"
                                className="h-9 rounded-xl text-xs"
                            />
                        </div>
                        <div>
                            <label className="text-xs font-bold text-foreground flex items-center gap-1 mb-1">
                                <KeyIcon className="size-3 text-primary" />
                                Admin Reset Password
                            </label>
                            <Input
                                type="password"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                placeholder="New password (blank to keep)"
                                className="h-9 rounded-xl text-xs"
                            />
                        </div>
                    </div>
                )}
            </div>

            {/* SECTION 1: COMPACT PAGE PERMISSIONS */}
            <Card className="rounded-2xl border border-border/60 bg-card/40 backdrop-blur-md shadow-xs overflow-hidden shrink-0">
                <CardHeader className="flex flex-row items-center justify-between gap-3 border-b border-border/50 bg-muted/15 px-5 py-3">
                    <div className="flex items-center gap-2">
                        <LayoutDashboardIcon className="size-4 text-primary" />
                        <CardTitle className="text-sm font-extrabold text-foreground">
                            1. Page-Level Permissions
                        </CardTitle>
                    </div>
                    <div className="flex items-center gap-2.5">
                        <span className="text-[11px] font-bold font-mono px-2.5 py-0.5 rounded-full bg-primary/10 text-primary">
                            {allowedPages.length} of {AVAILABLE_PAGES.length} Allowed
                        </span>
                        <Button
                            variant="outline"
                            size="sm"
                            onClick={handleSelectAllPages}
                            className="h-7 rounded-lg text-[11px] font-semibold px-3 cursor-pointer"
                        >
                            {allowedPages.length === AVAILABLE_PAGES.length
                                ? "Revoke All"
                                : "Grant All"}
                        </Button>
                    </div>
                </CardHeader>
                <CardContent className="p-3.5 space-y-3">
                    {userRecord?.role === "Admin" ? (
                        <div className="p-3.5 bg-blue-500/10 border border-blue-500/30 rounded-xl flex items-center gap-3 text-xs text-blue-600 dark:text-blue-400">
                            <ShieldCheckIcon className="size-5 shrink-0 text-blue-500" />
                            <div>
                                <p className="font-bold text-sm">Admin Role Active — Unrestricted Access</p>
                                <p className="opacity-90">Admins automatically have full access to all application pages, modules, and settings. Page permissions do not need to be manually assigned.</p>
                            </div>
                        </div>
                    ) : userRecord?.role === "Vendor" ? (
                        <div className="p-3.5 bg-amber-500/10 border border-amber-500/30 rounded-xl flex items-center gap-3 text-xs text-amber-700 dark:text-amber-400">
                            <ShieldCheckIcon className="size-5 shrink-0 text-amber-500" />
                            <div>
                                <p className="font-bold text-sm">Vendor Role Active — Simplified Workflow</p>
                                <p className="opacity-90">Vendors are restricted to tool issue and return operations (/stores & /tools). Administrative modules are automatically disabled.</p>
                            </div>
                        </div>
                    ) : null}
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-2.5">
                        {AVAILABLE_PAGES.map((page) => {
                            const isChecked = userRecord?.role === "Admin"
                                ? true
                                : userRecord?.role === "Vendor"
                                    ? (page.url === "/stores" || page.url === "/tools")
                                    : allowedPages.includes(page.url)
                            const isLocked = userRecord?.role === "Admin" || userRecord?.role === "Vendor"
                            const IconComponent = page.icon
                            return (
                                <div
                                    key={page.url}
                                    onClick={() => !isLocked && togglePage(page.url)}
                                    className={`flex items-center gap-3 p-3 rounded-xl border transition-all ${
                                        isLocked ? "cursor-default opacity-95" : "cursor-pointer"
                                    } ${
                                        isChecked
                                            ? "bg-primary/10 border-primary text-foreground shadow-xs"
                                            : "bg-background/60 border-border/70 text-muted-foreground hover:border-border hover:text-foreground"
                                    }`}
                                >
                                    <div
                                        className={`size-4 rounded-md flex items-center justify-center border shrink-0 transition-colors ${
                                            isChecked
                                                ? "bg-primary border-primary text-primary-foreground"
                                                : "border-border/80 bg-background"
                                        }`}
                                    >
                                        {isChecked && <CheckIcon className="size-3" />}
                                    </div>
                                    <div className="min-w-0 flex-1">
                                        <p className="text-xs font-bold flex items-center gap-1.5 text-foreground truncate">
                                            <IconComponent className="size-3.5 shrink-0 text-primary" />
                                            {page.title}
                                        </p>
                                        <p className="text-[11px] text-muted-foreground truncate">
                                            {page.desc}
                                        </p>
                                    </div>
                                </div>
                            )
                        })}
                    </div>
                </CardContent>
            </Card>

            {/* SECTION 2: PROJECT ACCESS (Immediately visible without excessive scrolling!) */}
            <Card className="rounded-2xl border border-border/60 bg-card/40 backdrop-blur-md shadow-xs overflow-hidden shrink-0">
                <CardHeader className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-border/50 bg-muted/15 px-5 py-3.5">
                    <div>
                        <CardTitle className="flex items-center gap-2 text-sm font-extrabold text-foreground">
                            <FolderOpenIcon className="size-4 text-primary" />
                            2. Project Access ({selectedProjects.length} of {allProjects.length} Selected)
                        </CardTitle>
                        <CardDescription className="text-xs text-muted-foreground mt-0.5">
                            Select authorized Projects. Only selected Projects will reveal their child Stores in Step 3 below.
                        </CardDescription>
                    </div>
                    <div className="flex items-center gap-2.5 shrink-0">
                        <Button
                            variant="outline"
                            size="sm"
                            onClick={handleSelectAllFilteredProjects}
                            className="h-8 rounded-xl text-xs font-semibold px-3.5 cursor-pointer"
                        >
                            {filteredProjects.length > 0 &&
                            filteredProjects.every((p) => selectedProjects.includes(p._id))
                                ? "Deselect All Filtered"
                                : "Select All Filtered"}
                        </Button>
                    </div>
                </CardHeader>
                <CardContent className="p-4 space-y-4">
                    {/* Search and Filters Bar */}
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                        <div className="relative flex-1 max-w-sm">
                            <SearchIcon className="absolute left-3 top-2.5 size-4 text-muted-foreground" />
                            <Input
                                placeholder="Search projects by name, code, location..."
                                value={projectSearch}
                                onChange={(e) => setProjectSearch(e.target.value)}
                                className="pl-9 h-9 rounded-xl bg-background border-border/70 text-xs"
                            />
                            {projectSearch && (
                                <button
                                    type="button"
                                    onClick={() => setProjectSearch("")}
                                    className="absolute right-3 top-2.5 text-muted-foreground hover:text-foreground"
                                >
                                    <XIcon className="size-4" />
                                </button>
                            )}
                        </div>

                        <div className="flex items-center gap-1 bg-muted/40 p-1 rounded-xl border border-border/50 self-start sm:self-auto">
                            {(["all", "selected", "unselected"] as const).map((mode) => (
                                <button
                                    key={mode}
                                    type="button"
                                    onClick={() => setProjectFilter(mode)}
                                    className={`px-3 py-1 rounded-lg text-xs font-semibold capitalize transition-all cursor-pointer ${
                                        projectFilter === mode
                                            ? "bg-background text-foreground shadow-xs font-bold"
                                            : "text-muted-foreground hover:text-foreground"
                                    }`}
                                >
                                    {mode === "all" ? "All Projects" : `${mode} Only`}
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Projects Grid */}
                    {allProjects.length === 0 ? (
                        <div className="py-8 text-center text-muted-foreground italic text-xs">
                            No projects found in the database.
                        </div>
                    ) : filteredProjects.length === 0 ? (
                        <div className="py-8 text-center text-muted-foreground text-xs">
                            No projects match your search or filter.
                        </div>
                    ) : (
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2.5">
                            {filteredProjects.map((p) => {
                                const isChecked = selectedProjects.includes(p._id)
                                return (
                                    <div
                                        key={p._id}
                                        onClick={() => toggleProject(p._id)}
                                        className={`flex items-start justify-between p-3.5 rounded-xl border cursor-pointer transition-all ${
                                            isChecked
                                                ? "bg-primary/10 border-primary text-foreground shadow-xs font-semibold"
                                                : "bg-background/60 border-border/70 text-muted-foreground hover:border-border hover:text-foreground"
                                        }`}
                                    >
                                        <div className="flex items-start gap-3 min-w-0">
                                            <div
                                                className={`size-4 rounded-md flex items-center justify-center border mt-0.5 shrink-0 transition-colors ${
                                                    isChecked
                                                        ? "bg-primary border-primary text-primary-foreground"
                                                        : "border-border/80 bg-background"
                                                }`}
                                            >
                                                {isChecked && <CheckIcon className="size-3" />}
                                            </div>
                                            <div className="min-w-0">
                                                <p className="text-xs font-bold truncate text-foreground">
                                                    {p.name}
                                                </p>
                                                <div className="flex items-center gap-1.5 mt-1 text-[11px] text-muted-foreground font-normal">
                                                    {p.code && (
                                                        <span className="font-mono bg-muted px-1.5 py-0.5 rounded">
                                                            {p.code}
                                                        </span>
                                                    )}
                                                    {p.location && (
                                                        <span className="truncate">📍 {p.location}</span>
                                                    )}
                                                </div>
                                            </div>
                                        </div>
                                        {isChecked && (
                                            <span className="text-[10px] bg-primary/20 text-primary px-2 py-0.5 rounded-full font-mono uppercase font-bold shrink-0 ml-2">
                                                Selected
                                            </span>
                                        )}
                                    </div>
                                )
                            })}
                        </div>
                    )}
                </CardContent>
            </Card>

            {/* SECTION 3: STORE ACCESS (Project -> Store Dependency) */}
            <Card className="rounded-2xl border border-border/60 bg-card/40 backdrop-blur-md shadow-xs overflow-hidden shrink-0 mb-6">
                <CardHeader className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-border/50 bg-muted/15 px-5 py-3.5">
                    <div>
                        <CardTitle className="flex items-center gap-2 text-sm font-extrabold text-foreground">
                            <StoreIcon className="size-4 text-primary" />
                            3. Store Access ({selectedStores.length} of {availableStoresForProjects.length} Assigned)
                        </CardTitle>
                        <CardDescription className="text-xs text-muted-foreground mt-0.5">
                            Displays ONLY Stores belonging to selected Project(s) above. Stores from unselected projects are restricted.
                        </CardDescription>
                    </div>
                    {selectedProjects.length > 0 && availableStoresForProjects.length > 0 && (
                        <div className="flex items-center gap-2.5 shrink-0">
                            <Button
                                variant="outline"
                                size="sm"
                                onClick={handleSelectAllFilteredStores}
                                className="h-8 rounded-xl text-xs font-semibold px-3.5 cursor-pointer"
                            >
                                {filteredStores.length > 0 &&
                                filteredStores.every((s) => selectedStores.includes(s._id))
                                    ? "Deselect All Filtered"
                                    : "Assign All Filtered"}
                            </Button>
                        </div>
                    )}
                </CardHeader>
                <CardContent className="p-4 space-y-4">
                    {selectedProjects.length === 0 ? (
                        <div className="py-10 px-6 rounded-xl border border-dashed border-border/80 bg-muted/20 text-center space-y-2 max-w-lg mx-auto">
                            <div className="size-12 rounded-xl bg-muted/60 flex items-center justify-center mx-auto text-muted-foreground">
                                <LockIcon className="size-6 opacity-70" />
                            </div>
                            <h3 className="text-sm font-bold text-foreground">
                                Select a Project First
                            </h3>
                            <p className="text-xs text-muted-foreground leading-relaxed">
                                Store assignment is locked until you select one or more Projects in Step 2 above. Once selected, only Stores belonging to those specific Projects will appear here.
                            </p>
                        </div>
                    ) : (
                        <>
                            {/* Search and Filters Bar */}
                            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                                <div className="relative flex-1 max-w-sm">
                                    <SearchIcon className="absolute left-3 top-2.5 size-4 text-muted-foreground" />
                                    <Input
                                        placeholder="Search stores by code, name, project..."
                                        value={storeSearch}
                                        onChange={(e) => setStoreSearch(e.target.value)}
                                        className="pl-9 h-9 rounded-xl bg-background border-border/70 text-xs"
                                    />
                                    {storeSearch && (
                                        <button
                                            type="button"
                                            onClick={() => setStoreSearch("")}
                                            className="absolute right-3 top-2.5 text-muted-foreground hover:text-foreground"
                                        >
                                            <XIcon className="size-4" />
                                        </button>
                                    )}
                                </div>

                                <div className="flex items-center gap-1 bg-muted/40 p-1 rounded-xl border border-border/50 self-start sm:self-auto">
                                    {(["all", "assigned", "unassigned"] as const).map((mode) => (
                                        <button
                                            key={mode}
                                            type="button"
                                            onClick={() => setStoreFilter(mode)}
                                            className={`px-3 py-1 rounded-lg text-xs font-semibold capitalize transition-all cursor-pointer ${
                                                storeFilter === mode
                                                    ? "bg-background text-foreground shadow-xs font-bold"
                                                    : "text-muted-foreground hover:text-foreground"
                                            }`}
                                        >
                                            {mode === "all" ? "All Available" : `${mode} Only`}
                                        </button>
                                    ))}
                                </div>
                            </div>

                            {/* Grouped Stores by Project */}
                            {availableStoresForProjects.length === 0 ? (
                                <div className="py-8 text-center text-muted-foreground italic text-xs">
                                    No stores found under the selected Project(s).
                                </div>
                            ) : filteredStores.length === 0 ? (
                                <div className="py-8 text-center text-muted-foreground text-xs">
                                    No stores match your search or filter.
                                </div>
                            ) : (
                                <div className="space-y-5">
                                    {Object.entries(storesGroupedByProject).map(
                                        ([projectName, projectStores]) => (
                                            <div key={projectName} className="space-y-2.5">
                                                <div className="flex items-center gap-2 px-1">
                                                    <FolderOpenIcon className="size-3.5 text-primary" />
                                                    <h4 className="text-xs font-extrabold uppercase tracking-wider text-muted-foreground">
                                                        {projectName} ({projectStores.length})
                                                    </h4>
                                                </div>
                                                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2.5">
                                                    {projectStores.map((s) => {
                                                        const isChecked = selectedStores.includes(s._id)
                                                        return (
                                                            <div
                                                                key={s._id}
                                                                onClick={() => toggleStore(s._id)}
                                                                className={`flex items-start justify-between p-3.5 rounded-xl border cursor-pointer transition-all ${
                                                                    isChecked
                                                                        ? "bg-primary/10 border-primary text-foreground shadow-xs font-semibold"
                                                                        : "bg-background/60 border-border/70 text-muted-foreground hover:border-border hover:text-foreground"
                                                                }`}
                                                            >
                                                                <div className="flex items-start gap-3 min-w-0">
                                                                    <div
                                                                        className={`size-4 rounded-md flex items-center justify-center border mt-0.5 shrink-0 transition-colors ${
                                                                            isChecked
                                                                                ? "bg-primary border-primary text-primary-foreground"
                                                                                : "border-border/80 bg-background"
                                                                        }`}
                                                                    >
                                                                        {isChecked && (
                                                                            <CheckIcon className="size-3" />
                                                                        )}
                                                                    </div>
                                                                    <div className="min-w-0">
                                                                        <p className="text-xs font-bold truncate text-foreground">
                                                                            {s.name || s.storeName}
                                                                        </p>
                                                                        <div className="flex items-center gap-1.5 mt-1 text-[11px] text-muted-foreground font-normal">
                                                                            {s.code && (
                                                                                <span className="font-mono bg-muted px-1.5 py-0.5 rounded">
                                                                                    {s.code}
                                                                                </span>
                                                                            )}
                                                                            {s.siteName && (
                                                                                <span className="truncate">
                                                                                    🏢 {s.siteName}
                                                                                </span>
                                                                            )}
                                                                        </div>
                                                                    </div>
                                                                </div>
                                                                {isChecked && (
                                                                    <span className="text-[10px] bg-primary/20 text-primary px-2 py-0.5 rounded-full font-mono uppercase font-bold shrink-0 ml-2">
                                                                        Assigned
                                                                    </span>
                                                                )}
                                                            </div>
                                                        )
                                                    })}
                                                </div>
                                            </div>
                                        )
                                    )}
                                </div>
                            )}
                        </>
                    )}
                </CardContent>
            </Card>
        </div>
    )
}

export default UserAccessPage;
