import * as React from "react"
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
    PlusIcon,
    Building2,
    SearchIcon,
    EditIcon,
    TrashIcon,
    FileText,
    Hash,
    Phone,
    Mail,
    User,
    ShieldAlert,
    RefreshCcw,
    Layers,
    FileCheck
} from "lucide-react"
import { useAuth } from "@/contexts/AuthContext"
import profileService, { type ProfileRecord, type ProfileType } from "@/services/profile.service"
import { ProfileFormModal } from "./ProfileFormModal"
import { toast } from "sonner"
import NoAccessPage from "../NoAccessPage"
import { ConfirmDialog } from "@/components/ConfirmDialog"
import { useSearchParams } from "react-router-dom"

export function ProfileManagementPage() {
    const { user: currentUser } = useAuth()
    const [searchParams, setSearchParams] = useSearchParams()

    // Query param type or default to Subcontractor
    const initialType = (searchParams.get("type") as ProfileType) || "Subcontractor"
    const [activeTab, setActiveTab] = React.useState<ProfileType>(
        ["Subcontractor", "ScrapDealer", "Supplier"].includes(initialType) ? initialType : "Subcontractor"
    )

    const [profiles, setProfiles] = React.useState<ProfileRecord[]>([])
    const [searchTerm, setSearchTerm] = React.useState("")
    const [loading, setLoading] = React.useState(true)
    const [error, setError] = React.useState<string | null>(null)

    // Modal state
    const [showModal, setShowModal] = React.useState(false)
    const [editingProfile, setEditingProfile] = React.useState<ProfileRecord | null>(null)
    const [deletingProfile, setDeletingProfile] = React.useState<{ id: string; name: string } | null>(null)

    const isRestricted = Boolean(
        currentUser &&
        currentUser.role !== "Admin" &&
        (!currentUser.allowedPages || (!currentUser.allowedPages.includes("/users") && !currentUser.allowedPages.includes("/profiles") && !currentUser.allowedPages.includes("/stores")))
    )

    const handleTabChange = (type: ProfileType) => {
        setActiveTab(type)
        setSearchParams({ type })
    }

    const fetchProfiles = React.useCallback(async () => {
        if (isRestricted) {
            setLoading(false)
            return
        }
        setLoading(true)
        setError(null)
        try {
            const res = await profileService.getProfiles({
                profileType: activeTab,
                limit: 500
            })
            if (res.success) {
                setProfiles(res.data || [])
            }
        } catch (err: any) {
            console.error("Error fetching profiles:", err)
            setError(err?.response?.data?.message || err.message || "Failed to load profiles")
        } finally {
            setLoading(false)
        }
    }, [activeTab, isRestricted])

    React.useEffect(() => {
        fetchProfiles()
    }, [fetchProfiles])

    const handleDeleteProfile = async (id: string) => {
        try {
            const res = await profileService.deleteProfile(id)
            if (res.success) {
                toast.success("Profile deleted successfully.")
                fetchProfiles()
            } else {
                toast.error(res.message || "Failed to delete profile.")
            }
        } catch (err: any) {
            toast.error(err?.response?.data?.message || "Error deleting profile.")
        }
    }

    const filteredProfiles = profiles.filter((p) => {
        const term = searchTerm.toLowerCase()
        return (
            p.name.toLowerCase().includes(term) ||
            p.code.toLowerCase().includes(term) ||
            (p.contactPerson || "").toLowerCase().includes(term) ||
            (p.contactPhone || "").toLowerCase().includes(term) ||
            (p.contactEmail || "").toLowerCase().includes(term) ||
            (p.gstNumber || "").toLowerCase().includes(term) ||
            (p.panNumber || "").toLowerCase().includes(term) ||
            (p.licenseNumber || "").toLowerCase().includes(term)
        )
    })

    const taxRecordsCount = profiles.filter(p => p.gstNumber || p.panNumber || p.licenseNumber).length
    const totalDocsCount = profiles.reduce((sum, p) => sum + (p.documents?.length || 0), 0)

    const bentoCardClass = "rounded-[24px] border border-border/50 bg-card/40 backdrop-blur-md shadow-sm hover:shadow-lg transition-all duration-300 overflow-hidden"

    if (isRestricted) {
        return <NoAccessPage />
    }

    return (
        <div className="flex flex-col gap-5 sm:gap-6 w-full max-w-7xl mx-auto p-3 sm:p-4 md:p-6 pb-12 animate-in fade-in duration-300">
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pt-1">
                <div>
                    <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-foreground">Centralized Profile Management</h1>
                    <p className="text-muted-foreground mt-1 text-xs sm:text-sm">
                        Create, configure, and manage business records for Subcontractors, Scrap Dealers, and Suppliers with document attachments and dynamic forms.
                    </p>
                </div>
                <div className="flex items-center gap-3 w-full sm:w-auto">
                    <Button
                        className="gap-2 rounded-xl shadow-md bg-primary hover:bg-primary/90 text-primary-foreground font-semibold cursor-pointer h-10 px-5 w-full sm:w-auto justify-center"
                        onClick={() => {
                            setEditingProfile(null)
                            setShowModal(true)
                        }}
                    >
                        <PlusIcon className="size-4" />
                        Create {activeTab === "Subcontractor" ? "Subcontractor" : activeTab === "ScrapDealer" ? "Scrap Dealer" : "Supplier"} Profile
                    </Button>
                </div>
            </div>

            {/* Profile Type Navigation Tabs */}
            <div className="flex items-center gap-2 border-b border-border/60 pb-1 overflow-x-auto">
                <button
                    onClick={() => handleTabChange("Subcontractor")}
                    className={`flex items-center gap-2 px-4 py-2.5 rounded-xl font-bold text-sm transition-all cursor-pointer shrink-0 ${
                        activeTab === "Subcontractor"
                            ? "bg-blue-600 text-white shadow-sm"
                            : "text-muted-foreground hover:text-foreground hover:bg-muted/50"
                    }`}
                >
                    <Building2 className="size-4" />
                    <span>Subcontractors (Vendors)</span>
                    <span className={`ml-1 px-2 py-0.5 rounded-full text-xs font-semibold ${
                        activeTab === "Subcontractor" ? "bg-white/20 text-white" : "bg-muted text-muted-foreground"
                    }`}>
                        {activeTab === "Subcontractor" ? profiles.length : "Select"}
                    </span>
                </button>

                <button
                    onClick={() => handleTabChange("ScrapDealer")}
                    className={`flex items-center gap-2 px-4 py-2.5 rounded-xl font-bold text-sm transition-all cursor-pointer shrink-0 ${
                        activeTab === "ScrapDealer"
                            ? "bg-amber-600 text-white shadow-sm"
                            : "text-muted-foreground hover:text-foreground hover:bg-muted/50"
                    }`}
                >
                    <Building2 className="size-4" />
                    <span>Scrap Dealers</span>
                    <span className={`ml-1 px-2 py-0.5 rounded-full text-xs font-semibold ${
                        activeTab === "ScrapDealer" ? "bg-white/20 text-white" : "bg-muted text-muted-foreground"
                    }`}>
                        {activeTab === "ScrapDealer" ? profiles.length : "Select"}
                    </span>
                </button>

                <button
                    onClick={() => handleTabChange("Supplier")}
                    className={`flex items-center gap-2 px-4 py-2.5 rounded-xl font-bold text-sm transition-all cursor-pointer shrink-0 ${
                        activeTab === "Supplier"
                            ? "bg-emerald-600 text-white shadow-sm"
                            : "text-muted-foreground hover:text-foreground hover:bg-muted/50"
                    }`}
                >
                    <Building2 className="size-4" />
                    <span>Suppliers (Purchaser Name)</span>
                    <span className={`ml-1 px-2 py-0.5 rounded-full text-xs font-semibold ${
                        activeTab === "Supplier" ? "bg-white/20 text-white" : "bg-muted text-muted-foreground"
                    }`}>
                        {activeTab === "Supplier" ? profiles.length : "Select"}
                    </span>
                </button>
            </div>

            {/* Metrics Overview Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4">
                <Card className="rounded-2xl border border-border/60 bg-card p-3.5 sm:p-4 shadow-xs">
                    <div className="flex flex-row items-center gap-3.5">
                        <div className="p-2.5 sm:p-3 rounded-xl bg-primary/10 text-primary shrink-0">
                            <Layers className="size-5 sm:size-6" />
                        </div>
                        <div className="min-w-0">
                            <p className="text-[11px] sm:text-xs text-muted-foreground font-semibold uppercase tracking-wider truncate">Total Profiles</p>
                            <p className="text-xl sm:text-2xl font-black text-foreground">{profiles.length}</p>
                        </div>
                    </div>
                </Card>

                <Card className="rounded-2xl border border-border/60 bg-card p-3.5 sm:p-4 shadow-xs">
                    <div className="flex flex-row items-center gap-3.5">
                        <div className="p-2.5 sm:p-3 rounded-xl bg-amber-500/10 text-amber-600 dark:text-amber-400 shrink-0">
                            <Hash className="size-5 sm:size-6" />
                        </div>
                        <div className="min-w-0">
                            <p className="text-[11px] sm:text-xs text-muted-foreground font-semibold uppercase tracking-wider truncate">Tax & Licenses Listed</p>
                            <p className="text-xl sm:text-2xl font-black text-foreground">{taxRecordsCount}</p>
                        </div>
                    </div>
                </Card>

                <Card className="rounded-2xl border border-border/60 bg-card p-3.5 sm:p-4 shadow-xs">
                    <div className="flex flex-row items-center gap-3.5">
                        <div className="p-2.5 sm:p-3 rounded-xl bg-blue-500/10 text-blue-600 dark:text-blue-400 shrink-0">
                            <FileCheck className="size-5 sm:size-6" />
                        </div>
                        <div className="min-w-0">
                            <p className="text-[11px] sm:text-xs text-muted-foreground font-semibold uppercase tracking-wider truncate">Legal Documents Uploaded</p>
                            <p className="text-xl sm:text-2xl font-black text-foreground">{totalDocsCount}</p>
                        </div>
                    </div>
                </Card>
            </div>

            {/* Profile Table Card */}
            <Card className={`${bentoCardClass} flex flex-col mt-1`}>
                <CardHeader className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-border/50 bg-muted/20 px-4 py-4 sm:px-6 sm:py-5">
                    <div className="w-full sm:w-auto">
                        <CardTitle className="flex items-center gap-2 text-base sm:text-lg font-bold">
                            <Building2 className="size-5 text-primary shrink-0" />
                            <span>{activeTab === "Subcontractor" ? "Subcontractors & Vendor Companies" : activeTab === "ScrapDealer" ? "Scrap Dealers Directory" : "Suppliers & Procurement Sources"}</span>
                        </CardTitle>
                        <CardDescription className="mt-1 text-xs">
                            {activeTab === "Subcontractor"
                                ? "Used in Delivery Challans, Return Challans, tool issues, and project assignments."
                                : activeTab === "ScrapDealer"
                                ? "Used in Delivery Challans and tool scrap transactions."
                                : "Used in tool creation, Excel imports, and purchaser sourcing records."}
                        </CardDescription>
                    </div>

                    <div className="flex items-center gap-2.5 w-full sm:w-auto">
                        <div className="relative flex-1 sm:w-80">
                            <SearchIcon className="absolute left-3 top-2.5 size-4 text-muted-foreground" />
                            <Input
                                placeholder="Search by name, code, GST, phone..."
                                className="pl-9 h-9 rounded-xl border-border/50 bg-background/50 text-xs focus-visible:ring-primary/30 w-full"
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                            />
                        </div>

                        <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => fetchProfiles()}
                            className="h-9 w-9 p-0 rounded-xl border border-border/50 hover:bg-muted shrink-0"
                            title="Refresh profiles"
                        >
                            <RefreshCcw className="size-4" />
                        </Button>
                    </div>
                </CardHeader>

                <CardContent className="p-0">
                    {error && (
                        <div className="mx-6 my-4 rounded-xl bg-destructive/10 border border-destructive/20 p-4 text-sm font-medium text-destructive flex items-center gap-2">
                            <ShieldAlert className="size-4" />
                            {error}
                        </div>
                    )}

                    {loading ? (
                        <div className="flex items-center justify-center py-16">
                            <div className="flex flex-col items-center gap-4">
                                <div className="size-8 animate-spin rounded-full border-[3px] border-primary border-t-transparent shadow-sm" />
                                <p className="font-medium text-muted-foreground">Loading {activeTab} profiles...</p>
                            </div>
                        </div>
                    ) : filteredProfiles.length === 0 ? (
                        <div className="py-16 text-center text-muted-foreground">
                            <div className="flex flex-col items-center justify-center opacity-50">
                                <Building2 className="size-12 mb-4 text-primary" />
                                <p className="font-medium">No {activeTab} profiles found.</p>
                            </div>
                        </div>
                    ) : (
                        <div className="overflow-x-auto w-full">
                            <table className="w-full text-sm min-w-[700px]">
                                <thead>
                                    <tr className="border-b border-border/50 bg-muted/10">
                                        <th className="text-left px-6 py-4 font-semibold text-muted-foreground uppercase text-[11px] tracking-wider">Name & Code</th>
                                        <th className="text-left px-6 py-4 font-semibold text-muted-foreground uppercase text-[11px] tracking-wider">Contact Person</th>
                                        <th className="text-left px-6 py-4 font-semibold text-muted-foreground uppercase text-[11px] tracking-wider">Phone & Email</th>
                                        <th className="text-left px-6 py-4 font-semibold text-muted-foreground uppercase text-[11px] tracking-wider">Tax & Licenses</th>
                                        <th className="text-left px-6 py-4 font-semibold text-muted-foreground uppercase text-[11px] tracking-wider">Documents</th>
                                        <th className="text-right px-6 py-4 font-semibold text-muted-foreground uppercase text-[11px] tracking-wider">Actions</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {filteredProfiles.map((p) => {
                                        const docCount = p.documents?.length || 0

                                        return (
                                            <tr
                                                key={p._id}
                                                className="border-b border-border/40 last:border-0 hover:bg-muted/40 transition-colors group"
                                            >
                                                <td className="px-6 py-4">
                                                    <div className="flex items-center gap-3">
                                                        <div className="p-2.5 rounded-xl bg-primary/10 text-primary font-bold shrink-0">
                                                            <Building2 className="size-5" />
                                                        </div>
                                                        <div>
                                                            <p className="font-bold text-foreground group-hover:text-primary transition-colors">{p.name}</p>
                                                            <span className="inline-block mt-1 font-mono text-[11px] font-bold px-2 py-0.5 rounded bg-muted text-muted-foreground border border-border/40">
                                                                {p.code}
                                                            </span>
                                                        </div>
                                                    </div>
                                                </td>

                                                <td className="px-6 py-4">
                                                    <div>
                                                        <p className="font-medium text-foreground flex items-center gap-1.5">
                                                            <User className="size-3.5 text-muted-foreground" />
                                                            {p.contactPerson || "N/A"}
                                                        </p>
                                                        {p.contactDesignation && (
                                                            <p className="text-xs text-muted-foreground mt-0.5 pl-5">{p.contactDesignation}</p>
                                                        )}
                                                    </div>
                                                </td>

                                                <td className="px-6 py-4">
                                                    <div>
                                                        <p className="font-mono text-xs font-medium text-foreground flex items-center gap-1.5">
                                                            <Phone className="size-3.5 text-primary" />
                                                            {p.contactPhone || "N/A"}
                                                        </p>
                                                        {p.contactEmail && (
                                                            <p className="text-xs text-muted-foreground mt-0.5 flex items-center gap-1.5 truncate max-w-xs">
                                                                <Mail className="size-3.5 text-muted-foreground" />
                                                                {p.contactEmail}
                                                            </p>
                                                        )}
                                                    </div>
                                                </td>

                                                <td className="px-6 py-4">
                                                    <div className="flex flex-col gap-1 text-xs">
                                                        {p.gstNumber && (
                                                            <span className="font-mono font-semibold text-foreground flex items-center gap-1">
                                                                <Hash className="size-3 text-primary" /> GST: {p.gstNumber}
                                                            </span>
                                                        )}
                                                        {p.panNumber && (
                                                            <span className="font-mono text-muted-foreground">PAN: {p.panNumber}</span>
                                                        )}
                                                        {p.licenseNumber && (
                                                            <span className="font-mono text-muted-foreground">Lic: {p.licenseNumber}</span>
                                                        )}
                                                        {!p.gstNumber && !p.panNumber && !p.licenseNumber && (
                                                            <span className="text-muted-foreground italic">No IDs listed</span>
                                                        )}
                                                    </div>
                                                </td>

                                                <td className="px-6 py-4">
                                                    <button
                                                        onClick={() => {
                                                            setEditingProfile(p)
                                                            setShowModal(true)
                                                        }}
                                                        className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-primary/10 text-primary text-xs font-semibold hover:bg-primary/20 transition-colors cursor-pointer"
                                                    >
                                                        <FileText className="size-3.5" />
                                                        <span>{docCount} {docCount === 1 ? 'Doc' : 'Docs'}</span>
                                                    </button>
                                                </td>

                                                <td className="px-6 py-4 text-right">
                                                    <div className="flex items-center justify-end gap-1.5">
                                                        <Button
                                                            variant="ghost"
                                                            size="sm"
                                                            onClick={() => {
                                                                setEditingProfile(p)
                                                                setShowModal(true)
                                                            }}
                                                            className="h-8 px-2.5 text-xs font-semibold hover:bg-primary/10 hover:text-primary gap-1.5 cursor-pointer"
                                                        >
                                                            <EditIcon className="size-3.5" />
                                                            <span>Edit</span>
                                                        </Button>
                                                        <Button
                                                            variant="ghost"
                                                            size="sm"
                                                            onClick={() => setDeletingProfile({ id: p._id, name: p.name })}
                                                            className="h-8 w-8 p-0 text-muted-foreground hover:bg-destructive/10 hover:text-destructive cursor-pointer"
                                                            title="Delete Profile"
                                                        >
                                                            <TrashIcon className="size-4" />
                                                        </Button>
                                                    </div>
                                                </td>
                                            </tr>
                                        )
                                    })}
                                </tbody>
                            </table>
                        </div>
                    )}
                </CardContent>
            </Card>

            {/* Profile Creation / Editing Modal */}
            <ProfileFormModal
                isOpen={showModal}
                onClose={() => {
                    setShowModal(false)
                    setEditingProfile(null)
                }}
                profileType={activeTab}
                editingProfile={editingProfile}
                onSuccess={() => {
                    fetchProfiles()
                }}
            />

            {/* Confirm Delete Dialog */}
            <ConfirmDialog
                isOpen={!!deletingProfile}
                onClose={() => setDeletingProfile(null)}
                onConfirm={async () => {
                    if (deletingProfile) await handleDeleteProfile(deletingProfile.id)
                }}
                title={`Delete ${activeTab} Profile`}
                description={`Are you sure you want to delete profile "${deletingProfile?.name || "this profile"}"?`}
                confirmText="Delete Profile"
            />
        </div>
    )
}

export default ProfileManagementPage
