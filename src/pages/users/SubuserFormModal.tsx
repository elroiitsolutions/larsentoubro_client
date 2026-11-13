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
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select"
import {
    UserPlusIcon,
    UserIcon,
    Loader2,
    ShieldCheckIcon,
    ClipboardCheck,
    FolderOpenIcon,
    StoreIcon,
    LayoutDashboardIcon,
    CheckIcon,
    AlertCircle,
    FileText,
    UploadCloud,
    Eye,
    Download,
    Trash2,
    ArrowRight,
    X
} from "lucide-react"
import userService, { type UserRecord } from "@/services/user.service"
import projectService from "@/services/project.service"
import storeService from "@/services/store.service"
import { useAuth } from "@/contexts/AuthContext"
import { toast } from "sonner"
import { validateEmail } from "@/utils/validation"

interface SubuserFormModalProps {
    isOpen: boolean
    onClose: () => void
    editingSubuser?: UserRecord | null
    onSuccess: () => void
}

const DOCUMENT_CATEGORIES = [
    "Aadhaar Card",
    "PAN Card",
    "Voter ID",
    "Driving License",
    "Passport",
    "Employment Contract",
    "Police Verification",
    "Trade License",
    "Other"
]

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

    const [activeTab, setActiveTab] = React.useState<"details" | "documents">("details")
    const [name, setName] = React.useState("")
    const [email, setEmail] = React.useState("")
    const [userId, setUserId] = React.useState("")
    const [phone, setPhone] = React.useState("")
    const [allowedPages, setAllowedPages] = React.useState<string[]>([])
    const [hasInspectionAccess, setHasInspectionAccess] = React.useState(false)
    const [selectedProjects, setSelectedProjects] = React.useState<string[]>([])
    const [selectedStores, setSelectedStores] = React.useState<string[]>([])

    // Documents State
    const [documents, setDocuments] = React.useState<any[]>([])
    const [uploadingDoc, setUploadingDoc] = React.useState(false)
    const [docTitle, setDocTitle] = React.useState("")
    const [docCategory, setDocCategory] = React.useState("Aadhaar Card")
    const [selectedFile, setSelectedFile] = React.useState<File | null>(null)

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
        setActiveTab("details")
        setSelectedFile(null)
        setDocTitle("")
        setDocCategory("Aadhaar Card")

        if (editingSubuser) {
            setName(editingSubuser.name || "")
            setEmail(editingSubuser.email || "")
            setUserId(editingSubuser.user_id || "")
            setPhone(editingSubuser.phonenumber || "")
            setAllowedPages(editingSubuser.allowedPages || ["/dashboard"])
            setHasInspectionAccess(Boolean(editingSubuser.hasInspectionAccess))
            setDocuments(editingSubuser.documents || [])

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
            // Default to subset of parent's pages
            const defaultPages = parentAllowedPages.slice(0, 3).map(p => p.url)
            setAllowedPages(defaultPages)
            setHasInspectionAccess(false)
            setSelectedProjects([])
            setSelectedStores([])
            setDocuments([])
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

    // Direct Upload Handler when editing
    const handleUploadDocumentNow = async () => {
        if (!selectedFile) {
            toast.error("Please select a file to upload.")
            return
        }

        if (!editingSubuser?._id) {
            toast.info("Document will be saved when you submit the subuser.")
            return
        }

        setUploadingDoc(true)
        try {
            const formData = new FormData()
            formData.append("file", selectedFile)
            formData.append("title", docTitle.trim() || selectedFile.name)
            formData.append("documentType", docCategory)

            const res = await userService.uploadDocument(editingSubuser._id, formData)
            if (res.success && res.data) {
                toast.success("Document uploaded successfully!")
                setDocuments(res.data.documents || [])
                setSelectedFile(null)
                setDocTitle("")
            } else {
                toast.error("Failed to upload document.")
            }
        } catch (err: any) {
            toast.error(err?.response?.data?.message || "Error uploading document.")
        } finally {
            setUploadingDoc(false)
        }
    }

    // Direct Delete Handler
    const handleDeleteDocNow = async (docId: string, isPending?: boolean) => {
        if (isPending) {
            setSelectedFile(null)
            return
        }

        if (!editingSubuser?._id) {
            setDocuments(prev => prev.filter(d => d._id !== docId))
            return
        }

        try {
            const res = await userService.deleteDocument(editingSubuser._id, docId)
            if (res.success && res.data) {
                toast.success("Document removed successfully.")
                setDocuments(res.data.documents || [])
            } else {
                toast.error("Failed to delete document.")
            }
        } catch (err: any) {
            toast.error(err?.response?.data?.message || "Error deleting document.")
        }
    }

    // Subuser Form Submit
    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()

        const cleanEmail = email.trim().toLowerCase()
        if (!name.trim()) {
            toast.error("Please enter subuser name.")
            return
        }

        const emailCheck = validateEmail(cleanEmail)
        if (!emailCheck.isValid) {
            toast.error(emailCheck.error || "Email address must contain '@' and '.'.")
            return
        }

        if (!userId.trim()) {
            toast.error("Subuser ID / code is required.")
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

            let res
            if (isEdit && editingSubuser) {
                res = await userService.updateSubuser(editingSubuser._id, payload)
            } else {
                res = await userService.createSubuser(payload)
            }

            if (res.success && res.data) {
                const savedUserId = res.data._id || (editingSubuser ? editingSubuser._id : null)

                // If file is selected and not uploaded yet, upload now
                if (selectedFile && savedUserId) {
                    try {
                        const formData = new FormData()
                        formData.append("file", selectedFile)
                        formData.append("title", docTitle.trim() || selectedFile.name)
                        formData.append("documentType", docCategory)
                        await userService.uploadDocument(savedUserId, formData)
                    } catch (uploadErr) {
                        console.error("Document upload failed after saving subuser", uploadErr)
                        toast.error("Subuser was saved, but document upload failed.")
                    }
                }

                toast.success(isEdit ? "Subuser updated successfully!" : "Subuser created successfully!")
                onSuccess()
                onClose()
            } else {
                toast.error(res?.message || "Failed to save subuser.")
            }
        } catch (error: any) {
            const msg = error?.response?.data?.message || error.message || "Failed to save subuser."
            toast.error(msg)
        } finally {
            setSaving(false)
        }
    }

    // Display documents in Associated Documents card
    const displayDocuments = React.useMemo(() => {
        if (isEdit) {
            return documents
        }
        if (selectedFile) {
            return [{
                _id: "pending-file",
                title: docTitle.trim() || selectedFile.name,
                originalName: selectedFile.name,
                documentType: docCategory,
                fileSize: selectedFile.size,
                isPending: true
            }]
        }
        return []
    }, [isEdit, documents, selectedFile, docTitle, docCategory])

    const totalDocsCount = isEdit ? documents.length : (selectedFile ? 1 : 0)

    return (
        <Dialog open={isOpen} onOpenChange={(val) => !val && onClose()}>
            <DialogContent hideClose={true} className="w-[calc(100%-1rem)] sm:w-full max-w-4xl max-h-[92vh] flex flex-col p-0 overflow-hidden rounded-2xl">
                {/* Header */}
                <DialogHeader className="p-3.5 sm:px-6 sm:py-4 border-b border-border/60 bg-muted/20 shrink-0">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                        {/* Title & Icon (with mobile-only close button) */}
                        <div className="flex items-center justify-between sm:justify-start gap-2.5 sm:gap-3 min-w-0">
                            <div className="flex items-center gap-2.5 sm:gap-3 min-w-0">
                                <div className="p-2 sm:p-2.5 rounded-xl bg-purple-500/10 text-purple-600 dark:text-purple-400 shrink-0">
                                    <UserPlusIcon className="size-5 sm:size-6" />
                                </div>
                                <div className="min-w-0">
                                    <DialogTitle className="text-base sm:text-xl font-bold text-foreground truncate">
                                        {isEdit ? "Edit Subuser" : "Create New Subuser"}
                                    </DialogTitle>
                                    <DialogDescription className="text-xs text-muted-foreground mt-0.5 leading-relaxed truncate">
                                        Subusers operate strictly within your account scope. All logins require parent approval.
                                    </DialogDescription>
                                </div>
                            </div>

                            {/* Mobile-only Close / Cancel (✕) button */}
                            <button
                                type="button"
                                onClick={onClose}
                                className="sm:hidden rounded-lg p-1.5 text-muted-foreground hover:text-foreground hover:bg-muted/80 transition-colors shrink-0 cursor-pointer"
                                aria-label="Close modal"
                            >
                                <X className="size-5" />
                            </button>
                        </div>

                        {/* Navigation Tabs & Desktop Close / Cancel (✕) button */}
                        <div className="flex items-center gap-2 sm:gap-3 w-full sm:w-auto shrink-0 justify-between sm:justify-end">
                            {/* Navigation Tabs */}
                            <div className="flex items-center gap-1 bg-muted/80 p-1 rounded-xl w-full sm:w-auto shrink-0 border border-border/50">
                                <button
                                    type="button"
                                    onClick={() => setActiveTab("details")}
                                    className={`flex-1 sm:flex-initial px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all text-center cursor-pointer ${
                                        activeTab === "details"
                                            ? "bg-background text-foreground shadow-xs"
                                            : "text-muted-foreground hover:text-foreground"
                                    }`}
                                >
                                    Subuser Details
                                </button>
                                <button
                                    type="button"
                                    onClick={() => setActiveTab("documents")}
                                    className={`flex-1 sm:flex-initial px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
                                        activeTab === "documents"
                                            ? "bg-background text-foreground shadow-xs"
                                            : "text-muted-foreground hover:text-foreground"
                                    }`}
                                >
                                    <FileText className="size-3.5" />
                                    <span>Documents</span>
                                    {totalDocsCount > 0 && (
                                        <span className="px-1.5 py-0.2 rounded-full bg-primary/20 text-primary text-[10px] font-extrabold">
                                            {totalDocsCount}
                                        </span>
                                    )}
                                </button>
                            </div>

                            {/* Desktop Close / Cancel (✕) button: Vertically centered with tabs */}
                            <div className="hidden sm:flex items-center pl-1 border-l border-border/60">
                                <button
                                    type="button"
                                    onClick={onClose}
                                    className="rounded-xl p-2 text-muted-foreground hover:text-foreground hover:bg-muted transition-colors cursor-pointer"
                                    aria-label="Close modal"
                                    title="Close"
                                >
                                    <X className="size-4" />
                                </button>
                            </div>
                        </div>
                    </div>
                </DialogHeader>

                <form onSubmit={handleSubmit} className="flex-1 min-h-0 overflow-y-auto p-3.5 sm:p-6 space-y-4 sm:space-y-6">
                    {activeTab === "details" && (
                        <div className="space-y-6">
                            {/* Account Details */}
                            <div className="bg-card border border-border/60 rounded-2xl p-4 sm:p-5 shadow-xs space-y-4">
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
                                            className="h-10 rounded-xl text-xs font-medium"
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
                                            className="h-10 rounded-xl font-mono text-xs font-medium"
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
                                            className="h-10 rounded-xl text-xs font-medium"
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
                                            className="h-10 rounded-xl text-xs font-medium"
                                            required
                                        />
                                    </div>
                                </div>
                            </div>

                            {/* Page Permissions Hierarchy */}
                            <div className="bg-card border border-border/60 rounded-2xl p-4 sm:p-5 shadow-xs space-y-4">
                                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-2 border-b border-border/40">
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
                                        className="h-7 text-xs font-semibold rounded-lg cursor-pointer self-start sm:self-auto"
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
                            <div className="bg-card border border-border/60 rounded-2xl p-4 sm:p-5 shadow-xs space-y-3">
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
                            <div className="bg-card border border-border/60 rounded-2xl p-4 sm:p-5 shadow-xs space-y-4">
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
                                                    className={`text-xs px-3 py-1.5 rounded-xl border font-semibold flex items-center gap-1.5 transition-all cursor-pointer ${
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
                                                    className={`text-xs px-3 py-1.5 rounded-xl border font-semibold flex items-center gap-1.5 transition-all cursor-pointer ${
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
                        </div>
                    )}

                    {activeTab === "documents" && (
                        <div className="space-y-6">
                            {/* Card 1: Upload New Document */}
                            <div className="bg-card border border-border/60 rounded-2xl p-3.5 sm:p-5 shadow-xs space-y-4">
                                <h3 className="text-sm font-bold text-foreground flex items-center gap-2 pb-2 border-b border-border/40">
                                    <UploadCloud className="size-4 text-primary" />
                                    Upload New Document (Aadhaar, PAN, GST, Agreement, License)
                                </h3>

                                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                    <div>
                                        <label className="text-xs font-bold text-foreground block mb-1.5">
                                            Document Category <span className="text-rose-500">*</span>
                                        </label>
                                        <Select value={docCategory} onValueChange={(val) => val && setDocCategory(val)}>
                                            <SelectTrigger className="h-10 w-full rounded-xl bg-background border-border/70 text-sm font-medium">
                                                <SelectValue placeholder="Select Category" />
                                            </SelectTrigger>
                                            <SelectContent>
                                                {DOCUMENT_CATEGORIES.map(cat => (
                                                    <SelectItem key={cat} value={cat}>{cat}</SelectItem>
                                                ))}
                                            </SelectContent>
                                        </Select>
                                    </div>

                                    <div className="md:col-span-2">
                                        <label className="text-xs font-bold text-foreground block mb-1.5">
                                            Document Title / Reference Name
                                        </label>
                                        <Input
                                            value={docTitle}
                                            onChange={(e) => setDocTitle(e.target.value)}
                                            placeholder="e.g. Aadhaar Card copy or Verification Document"
                                            className="h-10 rounded-xl bg-background border-border/70 text-sm font-medium"
                                        />
                                    </div>

                                    <div className="md:col-span-3">
                                        <label className="text-xs font-bold text-foreground block mb-1.5">
                                            Select Document File <span className="text-rose-500">*</span>
                                        </label>
                                        <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-3">
                                            <Input
                                                type="file"
                                                accept=".pdf,.png,.jpg,.jpeg,.doc,.docx,.xls,.xlsx"
                                                onChange={(e) => setSelectedFile(e.target.files?.[0] || null)}
                                                className="h-10 rounded-xl bg-background border-border/70 text-sm font-medium flex-1 file:mr-4 file:py-1 file:px-3 file:rounded-lg file:border-0 file:text-xs file:font-semibold file:bg-primary/10 file:text-primary hover:file:bg-primary/20"
                                            />
                                            {isEdit && (
                                                <Button
                                                    type="button"
                                                    onClick={handleUploadDocumentNow}
                                                    disabled={uploadingDoc || !selectedFile}
                                                    className="w-full sm:w-auto h-10 rounded-xl px-4 font-semibold text-xs bg-primary text-primary-foreground hover:bg-primary/90 gap-1.5 shadow-xs cursor-pointer flex items-center justify-center"
                                                >
                                                    {uploadingDoc ? <Loader2 className="size-4 animate-spin" /> : <UploadCloud className="size-4" />}
                                                    Upload Document
                                                </Button>
                                            )}
                                        </div>
                                        {!isEdit && selectedFile && (
                                            <p className="text-xs text-primary font-medium mt-1.5 flex items-center gap-1.5">
                                                <CheckIcon className="size-3.5" />
                                                File &ldquo;{selectedFile.name}&rdquo; selected. It will be uploaded automatically when you create the subuser.
                                            </p>
                                        )}
                                    </div>
                                </div>
                            </div>

                            {/* Card 2: Associated Documents */}
                            <div className="bg-card border border-border/60 rounded-2xl p-3.5 sm:p-5 shadow-xs space-y-3 sm:space-y-4">
                                <h3 className="text-sm font-bold text-foreground flex items-center gap-2 pb-2 border-b border-border/40 justify-between">
                                    <span className="flex items-center gap-2">
                                        <FileText className="size-4 text-primary" />
                                        Associated Documents ({displayDocuments.length})
                                    </span>
                                </h3>

                                {displayDocuments.length === 0 ? (
                                    <div className="py-12 text-center text-muted-foreground border-2 border-dashed border-border/50 rounded-xl">
                                        <UploadCloud className="size-10 mx-auto mb-2 opacity-30 text-primary" />
                                        <p className="font-semibold text-sm">No documents attached yet.</p>
                                        <p className="text-xs text-muted-foreground mt-0.5">
                                            Upload Aadhaar, PAN, GST certificate, agreements, or trade licenses above.
                                        </p>
                                    </div>
                                ) : (
                                    <div className="divide-y divide-border/40">
                                        {displayDocuments.map((doc: any, i: number) => {
                                            const fileUrl = doc.fileName ? userService.getDocumentDownloadUrl(doc.fileName) : doc.fileUrl
                                            const isPending = Boolean(doc.isPending)

                                            return (
                                                <div key={doc._id || i} className="py-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-3 sm:gap-4 first:pt-0 last:pb-0">
                                                    <div className="flex items-center gap-3 min-w-0">
                                                        <div className="p-2.5 rounded-xl bg-primary/10 text-primary shrink-0">
                                                            <FileText className="size-5" />
                                                        </div>
                                                        <div className="min-w-0">
                                                            <div className="flex items-center gap-2">
                                                                <p className="font-bold text-sm text-foreground truncate">{doc.title || doc.originalName}</p>
                                                                <span className="px-2 py-0.5 rounded-md bg-muted font-bold text-[10px] text-muted-foreground shrink-0 border border-border/50">
                                                                    {doc.documentType || "Document"}
                                                                </span>
                                                                {isPending && (
                                                                    <span className="px-2 py-0.5 rounded-md bg-amber-500/10 text-amber-600 dark:text-amber-400 font-bold text-[10px] border border-amber-500/20">
                                                                        Ready to Upload
                                                                    </span>
                                                                )}
                                                            </div>
                                                            <p className="text-xs text-muted-foreground mt-0.5 truncate">
                                                                {doc.originalName} • {doc.fileSize ? `${(doc.fileSize / 1024).toFixed(1)} KB` : "File"} • {isPending ? "Will be uploaded on create" : `Uploaded ${doc.uploadedAt ? new Date(doc.uploadedAt).toLocaleDateString() : "recently"}`}
                                                            </p>
                                                        </div>
                                                    </div>

                                                    <div className="flex items-center gap-1.5 shrink-0 self-end sm:self-auto">
                                                        {!isPending && fileUrl && (
                                                            <>
                                                                <a
                                                                    href={fileUrl}
                                                                    target="_blank"
                                                                    rel="noreferrer"
                                                                    className="h-8 px-2.5 rounded-lg border border-border/60 hover:bg-muted text-xs font-semibold flex items-center gap-1 transition-colors"
                                                                    title="View Document"
                                                                >
                                                                    <Eye className="size-3.5 text-primary" />
                                                                    View
                                                                </a>
                                                                <a
                                                                    href={fileUrl}
                                                                    download={doc.originalName || doc.title}
                                                                    className="h-8 px-2.5 rounded-lg border border-border/60 hover:bg-muted text-xs font-semibold flex items-center gap-1 transition-colors"
                                                                    title="Download Document"
                                                                >
                                                                    <Download className="size-3.5 text-primary" />
                                                                    Download
                                                                </a>
                              </>
                                                        )}
                                                        <Button
                                                            type="button"
                                                            variant="ghost"
                                                            size="sm"
                                                            onClick={() => handleDeleteDocNow(doc._id, isPending)}
                                                            className="h-8 w-8 p-0 text-muted-foreground hover:bg-destructive/10 hover:text-destructive cursor-pointer"
                                                            title="Delete Document"
                                                        >
                                                            <Trash2 className="size-4" />
                                                        </Button>
                                                    </div>
                                                </div>
                                            )
                                        })}
                                    </div>
                                )}
                            </div>
                        </div>
                    )}
                </form>

                <div className="p-4 border-t border-border/60 bg-muted/20 flex items-center justify-end gap-3 shrink-0">
                    <Button
                        type="button"
                        variant="outline"
                        onClick={onClose}
                        disabled={saving}
                        className="rounded-xl text-xs font-semibold h-10 px-4 cursor-pointer"
                    >
                        Cancel
                    </Button>
                    <Button
                        type="button"
                        onClick={handleSubmit}
                        disabled={saving}
                        className="rounded-xl text-xs font-bold h-10 px-5 bg-primary text-primary-foreground hover:bg-primary/90 gap-1.5 cursor-pointer shadow-xs flex items-center"
                    >
                        {saving ? (
                            <Loader2 className="size-3.5 animate-spin" />
                        ) : (
                            <ArrowRight className="size-3.5" />
                        )}
                        <span>{isEdit ? "Update Subuser" : "Create Subuser"}</span>
                    </Button>
                </div>
            </DialogContent>
        </Dialog>
    )
}

export default SubuserFormModal
