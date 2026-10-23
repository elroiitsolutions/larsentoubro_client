import * as React from "react"
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogDescription,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import {
    UserPlusIcon,
    UserIcon,
    Loader2,
    ShieldCheckIcon,
    KeyIcon,
    ClipboardCheck,
    FolderOpenIcon,
    StoreIcon,
    LayoutDashboardIcon,
    CheckIcon,
    AlertCircle
} from "lucide-react"
import userService, { type UserRecord } from "@/services/user.service"
import projectService from "@/services/project.service"
import storeService from "@/services/store.service"
import { useAuth } from "@/contexts/AuthContext"
import { toast } from "sonner"

interface SubuserFormModalProps {
    isOpen: boolean
    onClose: () => void
    editingSubuser?: UserRecord | null
    onSuccess: () => void
}

const ALL_POSSIBLE_PAGES = [
    { title: "QR Scanner", url: "/qr-scanner", desc: "Scan tool QR codes" },
    { title: "Dashboard", url: "/dashboard", desc: "Analytics & KPIs" },
    { title: "Projects", url: "/projects", desc: "Project directory" },
    { title: "Stores", url: "/stores", desc: "Store inventory" },
    { title: "Tools", url: "/tools", desc: "Tool tracking" },
    { title: "Challan History", url: "/challans/history", desc: "Delivery challans" },
    { title: "Scrap", url: "/tools/scrap", desc: "Scrap handling" },
    { title: "Profile Management", url: "/profiles", desc: "Vendors & suppliers" },
]

export function SubuserFormModal({
    isOpen,
    onClose,
    editingSubuser,
    onSuccess,
}: SubuserFormModalProps) {
    const isEdit = Boolean(editingSubuser)
    const { user: currentUser } = useAuth()

    const [name, setName] = React.useState("")
    const [email, setEmail] = React.useState("")
    const [userId, setUserId] = React.useState("")
    const [phone, setPhone] = React.useState("")
    const [password, setPassword] = React.useState("")
    const [allowedPages, setAllowedPages] = React.useState<string[]>([])
    const [hasInspectionAccess, setHasInspectionAccess] = React.useState(false)
    const [selectedProjects, setSelectedProjects] = React.useState<string[]>([])
    const [selectedStores, setSelectedStores] = React.useState<string[]>([])

    const [allProjects, setAllProjects] = React.useState<any[]>([])
    const [allStores, setAllStores] = React.useState<any[]>([])
    const [loadingData, setLoadingData] = React.useState(false)
    const [saving, setSaving] = React.useState(false)

    // Load available projects and stores
    React.useEffect(() => {
        if (!isOpen) return
        const loadScopes = async () => {
            setLoadingData(true)
            try {
                const [projRes, storeRes] = await Promise.all([
                    projectService.getProjects(),
                    storeService.getStores(),
                ])
                if (projRes.success) setAllProjects(projRes.data || [])
                if (storeRes.success) setAllStores(storeRes.data || [])
            } catch (err) {
                console.error("Failed to load project/store scope", err)
            } finally {
                setLoadingData(false)
            }
        }
        loadScopes()
    }, [isOpen])

    // Compute parent's allowed pages and actions
    const parentAllowedPages = React.useMemo(() => {
        if (currentUser?.role === "Admin") {
            return ALL_POSSIBLE_PAGES
        }
        const userPages = currentUser?.allowedPages || []
        return ALL_POSSIBLE_PAGES.filter(p => userPages.includes(p.url))
    }, [currentUser])

    const parentHasInspection = Boolean(currentUser?.role === "Admin" || currentUser?.hasInspectionAccess)

    // Compute parent's allowed projects
    const parentAllowedProjects = React.useMemo(() => {
        if (currentUser?.role === "Admin") return allProjects
        const myProjIds = (currentUser?.projects || []).map((p: any) =>
            typeof p === "object" ? p._id : p
        )
        return allProjects.filter(p => myProjIds.includes(p._id))
    }, [allProjects, currentUser])

    // Compute stores belonging to allowed projects
    const parentAllowedStores = React.useMemo(() => {
        const allowedProjIds = parentAllowedProjects.map(p => p._id)
        let stores = allStores.filter(s => {
            const pId = s.projectId || (s.project && typeof s.project === "object" ? s.project._id : s.project)
            return allowedProjIds.includes(String(pId))
        })
        if (currentUser?.role !== "Admin") {
            const myStoreIds = (currentUser?.stores || []).map((s: any) =>
                typeof s === "object" ? s._id : s
            )
            stores = stores.filter(s => myStoreIds.includes(String(s._id)))
        }
        return stores
    }, [allStores, parentAllowedProjects, currentUser])

    // Initialize state on open/edit
    React.useEffect(() => {
        if (!isOpen) return
        if (editingSubuser) {
            setName(editingSubuser.name || "")
            setEmail(editingSubuser.email || "")
            setUserId(editingSubuser.user_id || "")
            setPhone(editingSubuser.phonenumber || "")
            setPassword("")
            setAllowedPages(editingSubuser.allowedPages || ["/dashboard"])
            setHasInspectionAccess(Boolean(editingSubuser.hasInspectionAccess))

            const pIds = (editingSubuser.projects || []).map((p: any) =>
                typeof p === "object" ? p._id : p
            )
            setSelectedProjects(pIds)

            const sIds = (editingSubuser.stores || []).map((s: any) =>
                typeof s === "object" ? s._id : s
            )
            setSelectedStores(sIds)
        } else {
            setName("")
            setEmail("")
            // Auto generate friendly subuser ID
            const randomCode = Math.floor(1000 + Math.random() * 9000)
            setUserId(`SUB-${randomCode}`)
            setPhone("")
            setPassword("")
            // Default to subset of parent's pages
            const defaultPages = parentAllowedPages.slice(0, 3).map(p => p.url)
            setAllowedPages(defaultPages)
            setHasInspectionAccess(false)
            setSelectedProjects([])
            setSelectedStores([])
        }
    }, [isOpen, editingSubuser, parentAllowedPages])

    const togglePage = (url: string) => {
        setAllowedPages(prev =>
            prev.includes(url) ? prev.filter(p => p !== url) : [...prev, url]
        )
    }

    const toggleProject = (projId: string) => {
        setSelectedProjects(prev =>
            prev.includes(projId) ? prev.filter(id => id !== projId) : [...prev, projId]
        )
    }

    const toggleStore = (storeId: string) => {
        setSelectedStores(prev =>
            prev.includes(storeId) ? prev.filter(id => id !== storeId) : [...prev, storeId]
        )
    }

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()

        if (!name.trim() || !email.trim() || !userId.trim() || !phone.trim()) {
            toast.error("Please fill in all required fields.")
            return
        }

        if (!isEdit && (!password || password.trim().length < 6)) {
            toast.error("Password must be at least 6 characters for new subuser.")
            return
        }

        setSaving(true)
        try {
            // Strict client-side validation to match backend hierarchy
            const parentPageUrls = parentAllowedPages.map(p => p.url)
            const clampedPages = allowedPages.filter(p => parentPageUrls.includes(p))

            const payload: Record<string, unknown> = {
                name: name.trim(),
                email: email.trim(),
                user_id: userId.trim(),
                phonenumber: phone.trim(),
                allowedPages: clampedPages,
                hasInspectionAccess: parentHasInspection ? hasInspectionAccess : false,
                projects: selectedProjects,
                stores: selectedStores,
                role: "Subuser",
                canCreateUser: false
            }

            if (password.trim()) {
                payload.password = password.trim()
            }

            let res
            if (isEdit && editingSubuser) {
                res = await userService.updateSubuser(editingSubuser._id, payload)
            } else {
                res = await userService.createSubuser(payload)
            }

            if (res.success) {
                toast.success(isEdit ? "Subuser updated successfully!" : "Subuser created successfully!")
                onSuccess()
                onClose()
            } else {
                toast.error(res.message || "Failed to save subuser.")
            }
        } catch (error: any) {
            const msg = error?.response?.data?.message || error.message || "Failed to save subuser."
            toast.error(msg)
        } finally {
            setSaving(false)
        }
    }

    return (
        <Dialog open={isOpen} onOpenChange={(val) => !val && onClose()}>
            <DialogContent className="max-w-3xl max-h-[92vh] flex flex-col p-0 overflow-hidden">
                <DialogHeader className="px-6 py-4 border-b border-border/60 bg-muted/20 shrink-0">
                    <div className="flex items-center gap-3">
                        <div className="p-2.5 rounded-xl bg-purple-500/10 text-purple-600 dark:text-purple-400">
                            <UserPlusIcon className="size-6" />
                        </div>
                        <div>
                            <DialogTitle className="text-xl font-bold text-foreground">
                                {isEdit ? "Edit Subuser" : "Create New Subuser"}
                            </DialogTitle>
                            <DialogDescription className="text-xs text-muted-foreground mt-0.5 leading-relaxed">
                                Subusers operate strictly within your account scope. All logins require parent approval.
                            </DialogDescription>
                        </div>
                    </div>
                </DialogHeader>

                <form onSubmit={handleSubmit} className="flex-1 min-h-0 overflow-y-auto p-6 space-y-6">
                    {/* Account Details */}
                    <div className="bg-card border border-border/60 rounded-2xl p-5 shadow-xs space-y-4">
                        <h3 className="text-sm font-bold text-foreground flex items-center gap-2 pb-2 border-b border-border/40">
                            <UserIcon className="size-4 text-primary" />
                            Subuser Credentials & Profile
                        </h3>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                                <label className="text-xs font-bold text-foreground block mb-1.5">
                                    Full Name <span className="text-rose-500">*</span>
                                </label>
                                <Input
                                    value={name}
                                    onChange={(e) => setName(e.target.value)}
                                    placeholder="e.g. Suresh Patel"
                                    className="h-9 rounded-xl text-xs font-medium"
                                    required
                                />
                            </div>

                            <div>
                                <label className="text-xs font-bold text-foreground block mb-1.5">
                                    Subuser ID / Code <span className="text-rose-500">*</span>
                                </label>
                                <Input
                                    value={userId}
                                    onChange={(e) => setUserId(e.target.value)}
                                    placeholder="e.g. SUB-1042"
                                    className="h-9 rounded-xl font-mono text-xs font-medium"
                                    required
                                    disabled={isEdit}
                                />
                            </div>

                            <div>
                                <label className="text-xs font-bold text-foreground block mb-1.5">
                                    Email Address (Login Username) <span className="text-rose-500">*</span>
                                </label>
                                <Input
                                    type="email"
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    placeholder="e.g. suresh.sub@larsentoubro.com"
                                    className="h-9 rounded-xl text-xs font-medium"
                                    required
                                />
                            </div>

                            <div>
                                <label className="text-xs font-bold text-foreground block mb-1.5">
                                    Phone Number <span className="text-rose-500">*</span>
                                </label>
                                <Input
                                    value={phone}
                                    onChange={(e) => setPhone(e.target.value)}
                                    placeholder="e.g. +91 98765 43210"
                                    className="h-9 rounded-xl text-xs font-medium"
                                    required
                                />
                            </div>

                            <div className="md:col-span-2">
                                <label className="text-xs font-bold text-foreground flex items-center gap-1.5 mb-1.5">
                                    <KeyIcon className="size-3.5 text-primary" />
                                    <span>{isEdit ? "Reset Password (Leave blank to keep current)" : "Subuser Password"}</span>
                                    {!isEdit && <span className="text-rose-500">*</span>}
                                </label>
                                <Input
                                    type="password"
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    placeholder={isEdit ? "Leave blank to keep current password" : "At least 6 characters"}
                                    className="h-9 rounded-xl text-xs font-medium"
                                    required={!isEdit}
                                />
                            </div>
                        </div>
                    </div>

                    {/* Page Permissions Hierarchy */}
                    <div className="bg-card border border-border/60 rounded-2xl p-5 shadow-xs space-y-4">
                        <div className="flex items-center justify-between pb-2 border-b border-border/40">
                            <div>
                                <h3 className="text-sm font-bold text-foreground flex items-center gap-2">
                                    <LayoutDashboardIcon className="size-4 text-primary" />
                                    Allowed Pages ({allowedPages.length} of {parentAllowedPages.length} Granted)
                                </h3>
                                <p className="text-xs text-muted-foreground mt-0.5">
                                    Only pages authorized for your account are displayed. Select which pages this subuser can access.
                                </p>
                            </div>
                            <Button
                                type="button"
                                variant="outline"
                                size="sm"
                                onClick={() => {
                                    if (allowedPages.length === parentAllowedPages.length) {
                                        setAllowedPages([])
                                    } else {
                                        setAllowedPages(parentAllowedPages.map(p => p.url))
                                    }
                                }}
                                className="h-7 text-xs font-semibold rounded-lg"
                            >
                                {allowedPages.length === parentAllowedPages.length ? "Revoke All" : "Grant All Available"}
                            </Button>
                        </div>

                        {parentAllowedPages.length === 0 ? (
                            <div className="p-4 bg-muted/30 rounded-xl text-xs text-muted-foreground text-center">
                                No authorized pages found on parent account.
                            </div>
                        ) : (
                            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2.5">
                                {parentAllowedPages.map((page) => {
                                    const isChecked = allowedPages.includes(page.url)
                                    return (
                                        <div
                                            key={page.url}
                                            onClick={() => togglePage(page.url)}
                                            className={`flex items-center gap-2.5 p-2.5 rounded-xl border cursor-pointer transition-all ${
                                                isChecked
                                                    ? "bg-primary/10 border-primary text-foreground shadow-xs"
                                                    : "bg-background border-border text-muted-foreground hover:border-border hover:text-foreground"
                                            }`}
                                        >
                                            <div className={`size-4 rounded-md flex items-center justify-center border shrink-0 ${
                                                isChecked ? "bg-primary border-primary text-white" : "border-border bg-background"
                                            }`}>
                                                {isChecked && <CheckIcon className="size-3" />}
                                            </div>
                                            <div className="min-w-0 flex-1">
                                                <p className="text-xs font-bold truncate text-foreground">{page.title}</p>
                                                <p className="text-[10px] text-muted-foreground truncate">{page.desc}</p>
                                            </div>
                                        </div>
                                    )
                                })}
                            </div>
                        )}
                    </div>

                    {/* Operational Permissions: Inspection Access */}
                    <div className="bg-card border border-border/60 rounded-2xl p-5 shadow-xs space-y-3">
                        <h3 className="text-sm font-bold text-foreground flex items-center gap-2 pb-2 border-b border-border/40">
                            <ClipboardCheck className="size-4 text-emerald-600" />
                            Inspection Operational Access
                        </h3>

                        <div
                            onClick={() => {
                                if (parentHasInspection) setHasInspectionAccess(prev => !prev)
                            }}
                            className={`flex items-center justify-between gap-4 p-3.5 rounded-xl border transition-all ${
                                !parentHasInspection ? "cursor-not-allowed opacity-60 bg-muted/20" : "cursor-pointer hover:border-border"
                            } ${
                                hasInspectionAccess && parentHasInspection
                                    ? "bg-emerald-500/10 border-emerald-500/40"
                                    : "bg-background border-border"
                            }`}
                        >
                            <div className="flex items-start gap-3">
                                <div className={`size-8 rounded-lg flex items-center justify-center shrink-0 border ${
                                    hasInspectionAccess && parentHasInspection
                                        ? "bg-emerald-500/20 text-emerald-600 border-emerald-500/40"
                                        : "bg-muted text-muted-foreground border-border"
                                }`}>
                                    <ClipboardCheck className="size-4" />
                                </div>
                                <div>
                                    <h4 className="text-xs font-bold text-foreground flex items-center gap-2">
                                        Grant Tool Inspection Access
                                        {hasInspectionAccess && parentHasInspection && (
                                            <span className="text-[10px] font-bold px-1.5 py-0.2 rounded bg-emerald-500/20 text-emerald-600">
                                                Enabled
                                            </span>
                                        )}
                                    </h4>
                                    <p className="text-xs text-muted-foreground mt-0.5">
                                        Allows subuser to execute tool inspections (Pass/Fail) and route items to Repair or Scrap.
                                    </p>
                                    {!parentHasInspection && (
                                        <p className="text-[11px] text-rose-500 font-medium mt-1 flex items-center gap-1">
                                            <AlertCircle className="size-3" />
                                            You do not have Inspection access, so you cannot grant it to subusers.
                                        </p>
                                    )}
                                </div>
                            </div>
                            <input
                                type="checkbox"
                                checked={hasInspectionAccess && parentHasInspection}
                                disabled={!parentHasInspection}
                                onChange={(e) => setHasInspectionAccess(e.target.checked)}
                                className="size-4 rounded text-emerald-600 focus:ring-emerald-500 cursor-pointer disabled:cursor-not-allowed"
                            />
                        </div>
                    </div>

                    {/* Scope Assignment: Projects & Stores */}
                    <div className="bg-card border border-border/60 rounded-2xl p-5 shadow-xs space-y-4">
                        <h3 className="text-sm font-bold text-foreground flex items-center justify-between pb-2 border-b border-border/40">
                            <span className="flex items-center gap-2">
                                <FolderOpenIcon className="size-4 text-primary" />
                                Inventory Scope (Projects & Stores)
                            </span>
                            {loadingData && <Loader2 className="size-3.5 animate-spin text-muted-foreground" />}
                        </h3>

                        {/* Projects selection */}
                        <div className="space-y-2">
                            <label className="text-xs font-bold text-foreground block">
                                Assigned Projects ({selectedProjects.length} of {parentAllowedProjects.length} Selected)
                            </label>
                            <div className="flex flex-wrap gap-2 max-h-36 overflow-y-auto p-1">
                                {parentAllowedProjects.map((p) => {
                                    const isSel = selectedProjects.includes(p._id)
                                    return (
                                        <button
                                            type="button"
                                            key={p._id}
                                            onClick={() => toggleProject(p._id)}
                                            className={`text-xs px-3 py-1.5 rounded-xl border font-semibold flex items-center gap-1.5 transition-all ${
                                                isSel
                                                    ? "bg-primary text-primary-foreground border-primary shadow-xs"
                                                    : "bg-background text-muted-foreground border-border hover:border-primary/50"
                                            }`}
                                        >
                                            <FolderOpenIcon className="size-3" />
                                            {p.name}
                                        </button>
                                    )
                                })}
                                {parentAllowedProjects.length === 0 && (
                                    <p className="text-xs text-muted-foreground italic">No projects available under your account.</p>
                                )}
                            </div>
                        </div>

                        {/* Stores selection */}
                        <div className="space-y-2 pt-2 border-t border-border/40">
                            <label className="text-xs font-bold text-foreground block">
                                Assigned Stores ({selectedStores.length} of {parentAllowedStores.length} Selected)
                            </label>
                            <div className="flex flex-wrap gap-2 max-h-36 overflow-y-auto p-1">
                                {parentAllowedStores.map((s) => {
                                    const isSel = selectedStores.includes(s._id)
                                    return (
                                        <button
                                            type="button"
                                            key={s._id}
                                            onClick={() => toggleStore(s._id)}
                                            className={`text-xs px-3 py-1.5 rounded-xl border font-semibold flex items-center gap-1.5 transition-all ${
                                                isSel
                                                    ? "bg-emerald-600 text-white border-emerald-600 shadow-xs"
                                                    : "bg-background text-muted-foreground border-border hover:border-emerald-500/50"
                                            }`}
                                        >
                                            <StoreIcon className="size-3" />
                                            {s.name}
                                        </button>
                                    )
                                })}
                                {parentAllowedStores.length === 0 && (
                                    <p className="text-xs text-muted-foreground italic">No stores available under assigned projects.</p>
                                )}
                            </div>
                        </div>
                    </div>

                    <div className="p-3.5 bg-blue-500/10 border border-blue-500/20 rounded-xl text-xs text-blue-600 dark:text-blue-400 flex items-center gap-2.5">
                        <ShieldCheckIcon className="size-4 shrink-0" />
                        <span>Subuser login requests will be sent directly to your account for review and approval.</span>
                    </div>
                </form>

                <div className="p-4 border-t border-border/60 bg-muted/20 flex items-center justify-end gap-3 shrink-0">
                    <Button
                        type="button"
                        variant="outline"
                        onClick={onClose}
                        disabled={saving}
                        className="rounded-xl text-xs font-semibold h-9 px-4 cursor-pointer"
                    >
                        Cancel
                    </Button>
                    <Button
                        type="button"
                        onClick={handleSubmit}
                        disabled={saving}
                        className="rounded-xl text-xs font-bold h-9 px-5 bg-primary text-primary-foreground hover:bg-primary/90 gap-1.5 cursor-pointer shadow-xs"
                    >
                        {saving && <Loader2 className="size-3.5 animate-spin" />}
                        <span>{isEdit ? "Update Subuser" : "Create Subuser"}</span>
                    </Button>
                </div>
            </DialogContent>
        </Dialog>
    )
}
export default SubuserFormModal
