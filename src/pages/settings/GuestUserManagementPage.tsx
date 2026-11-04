import * as React from "react"
import { useNavigate } from "react-router-dom"
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog"
import {
    UsersIcon,
    ArrowLeftIcon,
    PlusIcon,
    SearchIcon,
    ClockIcon,
    AlertTriangleIcon,
    CheckCircle2Icon,
    XCircleIcon,
    EditIcon,
    CalendarIcon,
    PhoneIcon,
    BuildingIcon,
    UserCheckIcon,
    RefreshCwIcon,
    ShieldAlertIcon,
    ShieldCheckIcon,
    InfoIcon
} from "lucide-react"
import { useAuth } from "@/contexts/AuthContext"
import { toast } from "sonner"
import guestUserService, {
    type GuestUserRecord,
    type ExtensionDuration,
    type CreateGuestUserDto,
    type UpdateGuestUserDto
} from "@/services/guestUser.service"
import NoAccessPage from "../NoAccessPage"

const EXTENSION_OPTIONS: { key: ExtensionDuration; label: string; days: number; description: string }[] = [
    { key: "15 days", label: "15 Days", days: 15, description: "Standard half-month extension" },
    { key: "45 days", label: "45 Days", days: 45, description: "Extended project support period" },
    { key: "1 month", label: "1 Month", days: 30, description: "Standard 30-day working month" },
    { key: "3 months", label: "3 Months", days: 90, description: "Quarterly contract duration" },
    { key: "6 months", label: "6 Months", days: 180, description: "Long-term contractor / inspector duration" },
];

export function GuestUserManagementPage() {
    const { user } = useAuth()
    const navigate = useNavigate()

    // Access control: Admins and users with canCreateUser
    const canAccess = Boolean(user && (user.role === "Admin" || user.canCreateUser));

    const [guestUsers, setGuestUsers] = React.useState<GuestUserRecord[]>([])
    const [loading, setLoading] = React.useState(true)
    const [searchQuery, setSearchQuery] = React.useState("")
    const [statusFilter, setStatusFilter] = React.useState<string>("All")

    // Modals state
    const [createModalOpen, setCreateModalOpen] = React.useState(false)
    const [editModalOpen, setEditModalOpen] = React.useState(false)
    const [extendModalOpen, setExtendModalOpen] = React.useState(false)
    const [rejectModalOpen, setRejectModalOpen] = React.useState(false)
    const [historyModalOpen, setHistoryModalOpen] = React.useState(false)

    const [selectedGuest, setSelectedGuest] = React.useState<GuestUserRecord | null>(null)
    const [selectedDuration, setSelectedDuration] = React.useState<ExtensionDuration>("15 days")
    const [rejectReason, setRejectReason] = React.useState("")
    const [actionSubmitting, setActionSubmitting] = React.useState(false)

    // Form states
    const [createForm, setCreateForm] = React.useState<CreateGuestUserDto>({
        name: "",
        phone: "",
        email: "",
        organization: "",
        purpose: ""
    })
    const [createErrors, setCreateErrors] = React.useState<{ name?: string; phone?: string }>({})

    const [editForm, setEditForm] = React.useState<UpdateGuestUserDto>({
        name: "",
        phone: "",
        email: "",
        organization: "",
        purpose: "",
        status: "Active"
    })
    const [editErrors, setEditErrors] = React.useState<{ name?: string; phone?: string }>({})

    // Fetch guest users
    const loadGuestUsers = React.useCallback(async () => {
        setLoading(true)
        try {
            const res = await guestUserService.getGuestUsers({
                search: searchQuery,
                status: statusFilter
            })
            if (res.success) {
                setGuestUsers(res.data || [])
            }
        } catch (err: any) {
            console.error("Error loading guest users:", err)
            toast.error(err?.response?.data?.message || "Failed to load guest users.")
        } finally {
            setLoading(false)
        }
    }, [searchQuery, statusFilter])

    React.useEffect(() => {
        if (canAccess) {
            loadGuestUsers()
        }
    }, [canAccess, loadGuestUsers])

    if (!canAccess) {
        return <NoAccessPage />
    }

    // Pending 14th-day notifications: accounts expiring in <= 48h or marked Pending
    const expiringSoonAccounts = guestUsers.filter(g =>
        g.status === "Active" && (g.isExpiringSoon || (g.daysRemaining !== undefined && g.daysRemaining <= 2))
    )

    // Summary counts
    const activeCount = guestUsers.filter(g => g.status === "Active" && !g.isExpiringSoon).length
    const expiringCount = expiringSoonAccounts.length
    const expiredCount = guestUsers.filter(g => g.status === "Expired" || g.isExpired).length

    // Handle Create Submit
    const handleCreateSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        const errors: { name?: string; phone?: string } = {}
        if (!createForm.name.trim()) errors.name = "Guest name is mandatory."
        const cleanDigits = createForm.phone.replace(/\D/g, "")
        if (cleanDigits.length < 10) errors.phone = "Valid 10-digit mobile number is mandatory."

        if (Object.keys(errors).length > 0) {
            setCreateErrors(errors)
            return
        }

        setActionSubmitting(true)
        try {
            const res = await guestUserService.createGuestUser(createForm)
            if (res.success) {
                toast.success(`Guest account for "${res.data.name}" created with 15-day access!`)
                setCreateModalOpen(false)
                setCreateForm({ name: "", phone: "", email: "", organization: "", purpose: "" })
                setCreateErrors({})
                loadGuestUsers()
            }
        } catch (err: any) {
            toast.error(err?.response?.data?.message || "Failed to create guest user.")
        } finally {
            setActionSubmitting(false)
        }
    }

    // Open Edit Dialog
    const handleOpenEdit = (guest: GuestUserRecord) => {
        setSelectedGuest(guest)
        setEditForm({
            name: guest.name,
            phone: guest.phone,
            email: guest.email || "",
            organization: guest.organization || "",
            purpose: guest.purpose || "",
            status: guest.status
        })
        setEditErrors({})
        setEditModalOpen(true)
    }

    // Handle Edit Submit
    const handleEditSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        if (!selectedGuest) return

        const errors: { name?: string; phone?: string } = {}
        if (!editForm.name?.trim()) errors.name = "Guest name is mandatory."
        const cleanDigits = (editForm.phone || "").replace(/\D/g, "")
        if (cleanDigits.length < 10) errors.phone = "Valid 10-digit mobile number is mandatory."

        if (Object.keys(errors).length > 0) {
            setEditErrors(errors)
            return
        }

        setActionSubmitting(true)
        try {
            const res = await guestUserService.updateGuestUser(selectedGuest._id, editForm)
            if (res.success) {
                toast.success(`Guest account "${res.data.name}" updated successfully.`)
                setEditModalOpen(false)
                setSelectedGuest(null)
                loadGuestUsers()
            }
        } catch (err: any) {
            toast.error(err?.response?.data?.message || "Failed to update guest user.")
        } finally {
            setActionSubmitting(false)
        }
    }

    // Open Extend Dialog
    const handleOpenExtend = (guest: GuestUserRecord) => {
        setSelectedGuest(guest)
        setSelectedDuration("15 days")
        setExtendModalOpen(true)
    }

    // Handle Confirm Extension Submit
    const handleExtendSubmit = async () => {
        if (!selectedGuest) return
        setActionSubmitting(true)
        try {
            const res = await guestUserService.extendGuestUser(selectedGuest._id, selectedDuration)
            if (res.success) {
                toast.success(`Access extended by ${selectedDuration} for "${res.data.name}". Expiry updated.`)
                setExtendModalOpen(false)
                setSelectedGuest(null)
                loadGuestUsers()
            }
        } catch (err: any) {
            toast.error(err?.response?.data?.message || "Failed to extend guest user access.")
        } finally {
            setActionSubmitting(false)
        }
    }

    // Open Reject Dialog
    const handleOpenReject = (guest: GuestUserRecord) => {
        setSelectedGuest(guest)
        setRejectReason("Extension rejected by administrator/creator")
        setRejectModalOpen(true)
    }

    // Handle Reject Extension Submit
    const handleRejectSubmit = async () => {
        if (!selectedGuest) return
        setActionSubmitting(true)
        try {
            const res = await guestUserService.rejectGuestUser(selectedGuest._id, rejectReason)
            if (res.success) {
                toast.success(`Extension rejected. Guest account "${res.data.name}" is now expired.`)
                setRejectModalOpen(false)
                setSelectedGuest(null)
                loadGuestUsers()
            }
        } catch (err: any) {
            toast.error(err?.response?.data?.message || "Failed to reject extension.")
        } finally {
            setActionSubmitting(false)
        }
    }

    // Format Date helper
    const formatDate = (dateStr?: string) => {
        if (!dateStr) return "—"
        try {
            const d = new Date(dateStr)
            return d.toLocaleDateString("en-IN", {
                day: "2-digit",
                month: "short",
                year: "numeric"
            })
        } catch {
            return dateStr
        }
    }

    const formatDateTime = (dateStr?: string) => {
        if (!dateStr) return "—"
        try {
            const d = new Date(dateStr)
            return d.toLocaleString("en-IN", {
                day: "2-digit",
                month: "short",
                year: "numeric",
                hour: "2-digit",
                minute: "2-digit"
            })
        } catch {
            return dateStr
        }
    }

    return (
        <div className="flex-1 min-h-0 overflow-y-auto flex flex-col w-full p-4 md:p-6 space-y-6 pb-16">
            {/* Header with Navigation */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b">
                <div className="flex items-center gap-3">
                    <Button
                        variant="outline"
                        size="icon"
                        className="h-9 w-9 rounded-lg"
                        onClick={() => navigate("/settings")}
                        title="Back to Settings"
                    >
                        <ArrowLeftIcon className="size-4" />
                    </Button>
                    <div>
                        <div className="flex items-center gap-2">
                            <h1 className="text-xl md:text-2xl font-bold tracking-tight text-foreground">
                                Guest User Management
                            </h1>
                            <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-semibold bg-primary/10 text-primary">
                                Settings
                            </span>
                        </div>
                        <p className="text-xs md:text-sm text-muted-foreground mt-0.5">
                            Create and manage temporary 15-day guest accounts, view creator audit history, and process 14th-day extension requests.
                        </p>
                    </div>
                </div>

                <div className="flex items-center gap-2">
                    <Button
                        variant="outline"
                        size="sm"
                        onClick={loadGuestUsers}
                        disabled={loading}
                        className="gap-1.5"
                    >
                        <RefreshCwIcon className={`size-3.5 ${loading ? "animate-spin" : ""}`} />
                        Refresh
                    </Button>
                    <Button
                        size="sm"
                        className="gap-1.5 bg-primary text-primary-foreground shadow-sm hover:bg-primary/90"
                        onClick={() => {
                            setCreateForm({ name: "", phone: "", email: "", organization: "", purpose: "" })
                            setCreateErrors({})
                            setCreateModalOpen(true)
                        }}
                    >
                        <PlusIcon className="size-4" />
                        Create Guest User
                    </Button>
                </div>
            </div>

            {/* 14th-Day Expiry Notification Action Banner */}
            {expiringSoonAccounts.length > 0 && (
                <div className="rounded-xl border border-amber-300 dark:border-amber-600/50 bg-gradient-to-r from-amber-50 to-orange-50 dark:from-amber-950/30 dark:to-orange-950/20 p-4 shadow-sm">
                    <div className="flex items-start gap-3">
                        <div className="p-2 rounded-lg bg-amber-500/10 text-amber-600 dark:text-amber-400 shrink-0 mt-0.5">
                            <AlertTriangleIcon className="size-5" />
                        </div>
                        <div className="flex-1 min-w-0">
                            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1">
                                <h3 className="font-semibold text-amber-900 dark:text-amber-200 text-sm md:text-base flex items-center gap-2">
                                    Pending 14th-Day Expiry Reviews
                                    <span className="px-2 py-0.5 text-xs font-bold rounded-full bg-amber-200 dark:bg-amber-800 text-amber-900 dark:text-amber-100">
                                        {expiringSoonAccounts.length} Action{expiringSoonAccounts.length > 1 ? "s" : ""} Required
                                    </span>
                                </h3>
                                <span className="text-xs text-amber-700 dark:text-amber-400">
                                    Accounts without an extension decision will automatically expire after the 15th day.
                                </span>
                            </div>

                            <div className="mt-3 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                                {expiringSoonAccounts.map((account) => (
                                    <div
                                        key={account._id}
                                        className="bg-card/90 dark:bg-card/70 border border-amber-200 dark:border-amber-800/60 rounded-lg p-3 space-y-2 shadow-xs"
                                    >
                                        <div className="flex items-start justify-between gap-2">
                                            <div>
                                                <div className="font-semibold text-sm text-foreground flex items-center gap-1.5">
                                                    <UserCheckIcon className="size-3.5 text-primary" />
                                                    {account.name}
                                                </div>
                                                <div className="text-xs text-muted-foreground font-mono">
                                                    +91 {account.phone}
                                                </div>
                                            </div>
                                            <div className="text-right">
                                                <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-bold bg-amber-100 text-amber-800 dark:bg-amber-900/50 dark:text-amber-300">
                                                    {account.daysRemaining === 0
                                                        ? `Expires in ${account.hoursRemaining || 1}h`
                                                        : `Expires in ${account.daysRemaining}d`}
                                                </span>
                                            </div>
                                        </div>

                                        <div className="text-xs text-muted-foreground flex items-center justify-between pt-1 border-t border-border/50">
                                            <span>Created by: <strong className="text-foreground">{account.createdBy?.name || "Admin"}</strong></span>
                                            <span className="font-mono text-[11px]">{formatDate(account.expiresAt)}</span>
                                        </div>

                                        <div className="flex items-center gap-2 pt-1">
                                            <Button
                                                size="sm"
                                                variant="default"
                                                className="flex-1 h-8 text-xs bg-emerald-600 hover:bg-emerald-700 text-white gap-1"
                                                onClick={() => handleOpenExtend(account)}
                                            >
                                                <CheckCircle2Icon className="size-3.5" />
                                                Confirm Extension
                                            </Button>
                                            <Button
                                                size="sm"
                                                variant="outline"
                                                className="flex-1 h-8 text-xs text-destructive hover:bg-destructive/10 border-destructive/30 gap-1"
                                                onClick={() => handleOpenReject(account)}
                                            >
                                                <XCircleIcon className="size-3.5" />
                                                Reject Extension
                                            </Button>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* KPI Cards */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 md:gap-4">
                <Card className="bg-card shadow-xs">
                    <CardContent className="p-4 flex items-center justify-between">
                        <div>
                            <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Total Guests</p>
                            <h3 className="text-2xl font-bold mt-1 text-foreground">{guestUsers.length}</h3>
                        </div>
                        <div className="p-2.5 rounded-lg bg-blue-50 dark:bg-blue-950/40 text-blue-600 dark:text-blue-400">
                            <UsersIcon className="size-5" />
                        </div>
                    </CardContent>
                </Card>

                <Card className="bg-card shadow-xs">
                    <CardContent className="p-4 flex items-center justify-between">
                        <div>
                            <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Active</p>
                            <h3 className="text-2xl font-bold mt-1 text-emerald-600 dark:text-emerald-400">{activeCount}</h3>
                        </div>
                        <div className="p-2.5 rounded-lg bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400">
                            <CheckCircle2Icon className="size-5" />
                        </div>
                    </CardContent>
                </Card>

                <Card className="bg-card shadow-xs">
                    <CardContent className="p-4 flex items-center justify-between">
                        <div>
                            <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Expiring Soon</p>
                            <h3 className="text-2xl font-bold mt-1 text-amber-600 dark:text-amber-400">{expiringCount}</h3>
                        </div>
                        <div className="p-2.5 rounded-lg bg-amber-50 dark:bg-amber-950/40 text-amber-600 dark:text-amber-400">
                            <ClockIcon className="size-5" />
                        </div>
                    </CardContent>
                </Card>

                <Card className="bg-card shadow-xs">
                    <CardContent className="p-4 flex items-center justify-between">
                        <div>
                            <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Expired</p>
                            <h3 className="text-2xl font-bold mt-1 text-rose-600 dark:text-rose-400">{expiredCount}</h3>
                        </div>
                        <div className="p-2.5 rounded-lg bg-rose-50 dark:bg-rose-950/40 text-rose-600 dark:text-rose-400">
                            <XCircleIcon className="size-5" />
                        </div>
                    </CardContent>
                </Card>
            </div>

            {/* Filter and Search Bar */}
            <Card className="bg-card shadow-xs">
                <CardContent className="p-4">
                    <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
                        <div className="relative flex-1 max-w-md">
                            <SearchIcon className="absolute left-3 top-2.5 size-4 text-muted-foreground" />
                            <Input
                                placeholder="Search by name, mobile, organization..."
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                className="pl-9 h-9"
                            />
                        </div>

                        <div className="flex items-center gap-2">
                            <span className="text-xs text-muted-foreground font-medium hidden sm:inline">Status:</span>
                            <div className="inline-flex rounded-lg border bg-muted/30 p-1 text-xs">
                                {["All", "Active", "Expiring Soon", "Expired", "Disabled"].map((st) => (
                                    <button
                                        key={st}
                                        type="button"
                                        onClick={() => setStatusFilter(st)}
                                        className={`px-2.5 py-1 rounded-md font-medium transition-colors ${
                                            statusFilter === st
                                                ? "bg-background text-foreground shadow-xs font-semibold"
                                                : "text-muted-foreground hover:text-foreground"
                                        }`}
                                    >
                                        {st}
                                    </button>
                                ))}
                            </div>
                        </div>
                    </div>
                </CardContent>
            </Card>

            {/* Guest Users List Table */}
            <Card className="bg-card shadow-xs overflow-hidden">
                <CardHeader className="p-4 md:p-5 border-b bg-muted/10">
                    <div className="flex items-center justify-between">
                        <div>
                            <CardTitle className="text-base font-semibold">Registered Guest Users</CardTitle>
                            <CardDescription className="text-xs mt-0.5">
                                Guest accounts have restricted access to QR inspection tool lookup only.
                            </CardDescription>
                        </div>
                        <div className="text-xs text-muted-foreground font-medium">
                            Showing {guestUsers.length} account{guestUsers.length === 1 ? "" : "s"}
                        </div>
                    </div>
                </CardHeader>
                <CardContent className="p-0">
                    {loading ? (
                        <div className="py-12 flex flex-col items-center justify-center text-muted-foreground gap-3">
                            <div className="h-6 w-6 animate-spin rounded-full border-2 border-primary border-t-transparent" />
                            <p className="text-xs">Loading guest user accounts...</p>
                        </div>
                    ) : guestUsers.length === 0 ? (
                        <div className="py-16 text-center space-y-3">
                            <div className="mx-auto size-12 rounded-full bg-muted/40 flex items-center justify-center text-muted-foreground">
                                <UsersIcon className="size-6" />
                            </div>
                            <h4 className="font-semibold text-sm text-foreground">No guest accounts found</h4>
                            <p className="text-xs text-muted-foreground max-w-sm mx-auto">
                                {searchQuery || statusFilter !== "All"
                                    ? "No accounts match your current search or filter criteria."
                                    : "Get started by registering a new guest user with a 15-day initial access window."}
                            </p>
                            {!searchQuery && statusFilter === "All" && (
                                <Button
                                    size="sm"
                                    className="gap-1.5 mt-2"
                                    onClick={() => setCreateModalOpen(true)}
                                >
                                    <PlusIcon className="size-4" />
                                    Create First Guest User
                                </Button>
                            )}
                        </div>
                    ) : (
                        <div className="overflow-x-auto">
                            <table className="w-full text-left text-xs md:text-sm">
                                <thead className="bg-muted/40 text-muted-foreground border-b text-[11px] uppercase tracking-wider font-semibold">
                                    <tr>
                                        <th className="py-3 px-4">Guest User</th>
                                        <th className="py-3 px-4">Organization / Purpose</th>
                                        <th className="py-3 px-4">Created By</th>
                                        <th className="py-3 px-4">Expires At</th>
                                        <th className="py-3 px-4">Status & Validity</th>
                                        <th className="py-3 px-4 text-right">Actions</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-border/60">
                                    {guestUsers.map((guest) => {
                                        const isExpSoon = guest.isExpiringSoon || (guest.status === "Active" && guest.daysRemaining !== undefined && guest.daysRemaining <= 2 && guest.daysRemaining > 0)
                                        const isExp = guest.status === "Expired" || guest.isExpired

                                        return (
                                            <tr
                                                key={guest._id}
                                                className={`hover:bg-muted/20 transition-colors ${
                                                    isExpSoon ? "bg-amber-50/40 dark:bg-amber-950/10" : ""
                                                }`}
                                            >
                                                {/* Guest User column */}
                                                <td className="py-3.5 px-4">
                                                    <div className="flex items-center gap-2.5">
                                                        <div className="size-8 rounded-full bg-primary/10 text-primary flex items-center justify-center font-bold text-xs uppercase shrink-0">
                                                            {guest.name.charAt(0) || "G"}
                                                        </div>
                                                        <div>
                                                            <div className="font-semibold text-foreground flex items-center gap-1.5">
                                                                {guest.name}
                                                            </div>
                                                            <div className="flex items-center gap-2 text-xs text-muted-foreground mt-0.5">
                                                                <span className="font-mono text-foreground/80 flex items-center gap-1">
                                                                    <PhoneIcon className="size-3 text-muted-foreground" />
                                                                    +91 {guest.phone}
                                                                </span>
                                                                {guest.email && (
                                                                    <>
                                                                        <span>•</span>
                                                                        <span className="truncate max-w-[150px]">{guest.email}</span>
                                                                    </>
                                                                )}
                                                            </div>
                                                        </div>
                                                    </div>
                                                </td>

                                                {/* Organization / Purpose */}
                                                <td className="py-3.5 px-4 text-xs">
                                                    <div className="font-medium text-foreground flex items-center gap-1.5">
                                                        <BuildingIcon className="size-3.5 text-muted-foreground" />
                                                        {guest.organization || "Independent / Guest"}
                                                    </div>
                                                    <div className="text-muted-foreground text-[11px] mt-0.5 truncate max-w-[200px]">
                                                        {guest.purpose || "QR inspection & tool tracking"}
                                                    </div>
                                                </td>

                                                {/* Created By */}
                                                <td className="py-3.5 px-4 text-xs">
                                                    <div className="font-medium text-foreground">
                                                        {guest.createdBy?.name || "System"}
                                                    </div>
                                                    <div className="text-muted-foreground text-[11px] flex items-center gap-1.5">
                                                        <span className="inline-block px-1.5 py-0.2 rounded bg-muted text-[10px] uppercase font-semibold">
                                                            {guest.createdBy?.role || "Admin"}
                                                        </span>
                                                        <span className="truncate max-w-[120px]">{guest.createdBy?.email}</span>
                                                    </div>
                                                </td>

                                                {/* Expiry Date */}
                                                <td className="py-3.5 px-4 text-xs">
                                                    <div className="font-mono font-medium text-foreground flex items-center gap-1">
                                                        <CalendarIcon className="size-3 text-muted-foreground" />
                                                        {formatDate(guest.expiresAt)}
                                                    </div>
                                                    <div className="text-muted-foreground text-[11px] mt-0.5">
                                                        Total duration: {guest.totalDurationDays || 15} days
                                                    </div>
                                                </td>

                                                {/* Status & Validity */}
                                                <td className="py-3.5 px-4 text-xs">
                                                    {isExp ? (
                                                        <div className="space-y-1">
                                                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-semibold bg-rose-100 text-rose-800 dark:bg-rose-950/60 dark:text-rose-300">
                                                                <XCircleIcon className="size-3" />
                                                                Expired
                                                            </span>
                                                            <div className="text-[11px] text-muted-foreground">
                                                                Login restricted
                                                            </div>
                                                        </div>
                                                    ) : isExpSoon ? (
                                                        <div className="space-y-1">
                                                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-semibold bg-amber-100 text-amber-900 dark:bg-amber-900/60 dark:text-amber-200">
                                                                <ClockIcon className="size-3" />
                                                                Expiring Soon
                                                            </span>
                                                            <div className="text-[11px] font-semibold text-amber-700 dark:text-amber-400">
                                                                {guest.daysRemaining === 0
                                                                    ? `Expires in ${guest.hoursRemaining || 1} hrs`
                                                                    : `${guest.daysRemaining} day(s) left`}
                                                            </div>
                                                        </div>
                                                    ) : guest.status === "Disabled" ? (
                                                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-semibold bg-slate-100 text-slate-800 dark:bg-slate-800 dark:text-slate-300">
                                                            Disabled
                                                        </span>
                                                    ) : (
                                                        <div className="space-y-1">
                                                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-semibold bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300">
                                                                <CheckCircle2Icon className="size-3" />
                                                                Active
                                                            </span>
                                                            <div className="text-[11px] text-muted-foreground">
                                                                {guest.daysRemaining || 15} days remaining
                                                            </div>
                                                        </div>
                                                    )}
                                                </td>

                                                {/* Actions */}
                                                <td className="py-3.5 px-4 text-right">
                                                    <div className="inline-flex items-center justify-end gap-1.5">
                                                        <Button
                                                            size="sm"
                                                            variant="outline"
                                                            className="h-8 text-xs gap-1 border-primary/30 text-primary hover:bg-primary/10"
                                                            onClick={() => handleOpenExtend(guest)}
                                                            title="Extend access duration"
                                                        >
                                                            <ClockIcon className="size-3.5" />
                                                            Extend
                                                        </Button>

                                                        <Button
                                                            size="sm"
                                                            variant="ghost"
                                                            className="h-8 w-8 p-0"
                                                            onClick={() => handleOpenEdit(guest)}
                                                            title="Edit Guest Details"
                                                        >
                                                            <EditIcon className="size-3.5 text-muted-foreground" />
                                                        </Button>

                                                        {guest.status === "Active" && (
                                                            <Button
                                                                size="sm"
                                                                variant="ghost"
                                                                className="h-8 w-8 p-0 text-destructive hover:bg-destructive/10"
                                                                onClick={() => handleOpenReject(guest)}
                                                                title="Reject / Expire access immediately"
                                                            >
                                                                <XCircleIcon className="size-3.5" />
                                                            </Button>
                                                        )}

                                                        {guest.extensionHistory && guest.extensionHistory.length > 0 && (
                                                            <Button
                                                                size="sm"
                                                                variant="ghost"
                                                                className="h-8 w-8 p-0 text-muted-foreground"
                                                                onClick={() => {
                                                                    setSelectedGuest(guest)
                                                                    setHistoryModalOpen(true)
                                                                }}
                                                                title="View Extension History"
                                                            >
                                                                <InfoIcon className="size-3.5" />
                                                            </Button>
                                                        )}
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

            {/* Create Guest User Modal */}
            <Dialog open={createModalOpen} onOpenChange={setCreateModalOpen}>
                <DialogContent className="max-w-md p-6 space-y-4">
                    <DialogHeader>
                        <DialogTitle className="flex items-center gap-2 text-lg">
                            <UserCheckIcon className="size-5 text-primary" />
                            Create Guest User
                        </DialogTitle>
                        <DialogDescription className="text-xs">
                            Guest accounts automatically expire after 15 days. On the 14th day, admins and creators will receive an extension notification.
                        </DialogDescription>
                    </DialogHeader>

                    <form onSubmit={handleCreateSubmit} className="space-y-4 pt-1">
                        <div className="space-y-1.5">
                            <Label htmlFor="guest-name" className="text-xs font-semibold">
                                Guest Name <span className="text-destructive">*</span>
                            </Label>
                            <Input
                                id="guest-name"
                                placeholder="e.g. Ramesh Kumar"
                                value={createForm.name}
                                onChange={(e) => {
                                    setCreateForm({ ...createForm, name: e.target.value })
                                    if (createErrors.name) setCreateErrors({ ...createErrors, name: undefined })
                                }}
                                className={createErrors.name ? "border-destructive" : ""}
                            />
                            {createErrors.name && (
                                <p className="text-[11px] text-destructive font-medium">{createErrors.name}</p>
                            )}
                        </div>

                        <div className="space-y-1.5">
                            <Label htmlFor="guest-phone" className="text-xs font-semibold">
                                Phone Number (10 Digits) <span className="text-destructive">*</span>
                            </Label>
                            <div className="flex items-center">
                                <span className="inline-flex items-center px-3 h-9 rounded-l-md border border-r-0 bg-muted text-xs font-mono text-muted-foreground">
                                    +91
                                </span>
                                <Input
                                    id="guest-phone"
                                    type="tel"
                                    maxLength={10}
                                    placeholder="9876543210"
                                    value={createForm.phone}
                                    onChange={(e) => {
                                        const clean = e.target.value.replace(/\D/g, "").slice(0, 10)
                                        setCreateForm({ ...createForm, phone: clean })
                                        if (createErrors.phone) setCreateErrors({ ...createErrors, phone: undefined })
                                    }}
                                    className={`rounded-l-none font-mono ${createErrors.phone ? "border-destructive" : ""}`}
                                />
                            </div>
                            {createErrors.phone && (
                                <p className="text-[11px] text-destructive font-medium">{createErrors.phone}</p>
                            )}
                            <p className="text-[11px] text-muted-foreground">
                                Used for SMS OTP login verification.
                            </p>
                        </div>

                        <div className="space-y-1.5">
                            <Label htmlFor="guest-email" className="text-xs font-semibold">
                                Email Address <span className="text-muted-foreground font-normal">(Optional)</span>
                            </Label>
                            <Input
                                id="guest-email"
                                type="email"
                                placeholder="guest@subcontractor.com"
                                value={createForm.email}
                                onChange={(e) => setCreateForm({ ...createForm, email: e.target.value })}
                            />
                        </div>

                        <div className="grid grid-cols-2 gap-3">
                            <div className="space-y-1.5">
                                <Label htmlFor="guest-org" className="text-xs font-semibold">
                                    Organization / Firm
                                </Label>
                                <Input
                                    id="guest-org"
                                    placeholder="e.g. Apex Subcontractor"
                                    value={createForm.organization}
                                    onChange={(e) => setCreateForm({ ...createForm, organization: e.target.value })}
                                />
                            </div>

                            <div className="space-y-1.5">
                                <Label htmlFor="guest-purpose" className="text-xs font-semibold">
                                    Purpose
                                </Label>
                                <Input
                                    id="guest-purpose"
                                    placeholder="e.g. Site QA inspection"
                                    value={createForm.purpose}
                                    onChange={(e) => setCreateForm({ ...createForm, purpose: e.target.value })}
                                />
                            </div>
                        </div>

                        <div className="p-3 rounded-lg bg-blue-50 dark:bg-blue-950/30 border border-blue-200 dark:border-blue-900/50 text-xs text-blue-900 dark:text-blue-200 flex items-start gap-2">
                            <InfoIcon className="size-4 shrink-0 mt-0.5 text-blue-600 dark:text-blue-400" />
                            <div>
                                <span className="font-semibold">Automatic 15-Day Expiry:</span> This guest account will remain valid for exactly 15 days from today. You will receive an expiry notification on day 14 to confirm or reject extension.
                            </div>
                        </div>

                        <DialogFooter className="pt-2">
                            <Button
                                type="button"
                                variant="outline"
                                onClick={() => setCreateModalOpen(false)}
                                disabled={actionSubmitting}
                            >
                                Cancel
                            </Button>
                            <Button
                                type="submit"
                                disabled={actionSubmitting}
                                className="gap-1.5"
                            >
                                {actionSubmitting ? (
                                    <>
                                        <div className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-background border-t-transparent" />
                                        Creating...
                                    </>
                                ) : (
                                    "Create 15-Day Guest"
                                )}
                            </Button>
                        </DialogFooter>
                    </form>
                </DialogContent>
            </Dialog>

            {/* Edit Guest User Modal */}
            <Dialog open={editModalOpen} onOpenChange={setEditModalOpen}>
                <DialogContent className="max-w-md p-6 space-y-4">
                    <DialogHeader>
                        <DialogTitle className="flex items-center gap-2 text-lg">
                            <EditIcon className="size-5 text-primary" />
                            Edit Guest User Details
                        </DialogTitle>
                        <DialogDescription className="text-xs">
                            Modify guest contact details or toggle account access status.
                        </DialogDescription>
                    </DialogHeader>

                    <form onSubmit={handleEditSubmit} className="space-y-4 pt-1">
                        <div className="space-y-1.5">
                            <Label htmlFor="edit-guest-name" className="text-xs font-semibold">
                                Guest Name <span className="text-destructive">*</span>
                            </Label>
                            <Input
                                id="edit-guest-name"
                                value={editForm.name}
                                onChange={(e) => {
                                    setEditForm({ ...editForm, name: e.target.value })
                                    if (editErrors.name) setEditErrors({ ...editErrors, name: undefined })
                                }}
                                className={editErrors.name ? "border-destructive" : ""}
                            />
                            {editErrors.name && (
                                <p className="text-[11px] text-destructive font-medium">{editErrors.name}</p>
                            )}
                        </div>

                        <div className="space-y-1.5">
                            <Label htmlFor="edit-guest-phone" className="text-xs font-semibold">
                                Phone Number (10 Digits) <span className="text-destructive">*</span>
                            </Label>
                            <div className="flex items-center">
                                <span className="inline-flex items-center px-3 h-9 rounded-l-md border border-r-0 bg-muted text-xs font-mono text-muted-foreground">
                                    +91
                                </span>
                                <Input
                                    id="edit-guest-phone"
                                    type="tel"
                                    maxLength={10}
                                    value={editForm.phone}
                                    onChange={(e) => {
                                        const clean = e.target.value.replace(/\D/g, "").slice(0, 10)
                                        setEditForm({ ...editForm, phone: clean })
                                        if (editErrors.phone) setEditErrors({ ...editErrors, phone: undefined })
                                    }}
                                    className={`rounded-l-none font-mono ${editErrors.phone ? "border-destructive" : ""}`}
                                />
                            </div>
                            {editErrors.phone && (
                                <p className="text-[11px] text-destructive font-medium">{editErrors.phone}</p>
                            )}
                        </div>

                        <div className="space-y-1.5">
                            <Label htmlFor="edit-guest-email" className="text-xs font-semibold">
                                Email Address
                            </Label>
                            <Input
                                id="edit-guest-email"
                                type="email"
                                value={editForm.email}
                                onChange={(e) => setEditForm({ ...editForm, email: e.target.value })}
                            />
                        </div>

                        <div className="grid grid-cols-2 gap-3">
                            <div className="space-y-1.5">
                                <Label htmlFor="edit-guest-org" className="text-xs font-semibold">
                                    Organization / Firm
                                </Label>
                                <Input
                                    id="edit-guest-org"
                                    value={editForm.organization}
                                    onChange={(e) => setEditForm({ ...editForm, organization: e.target.value })}
                                />
                            </div>

                            <div className="space-y-1.5">
                                <Label htmlFor="edit-guest-status" className="text-xs font-semibold">
                                    Account Status
                                </Label>
                                <select
                                    id="edit-guest-status"
                                    value={editForm.status}
                                    onChange={(e) => setEditForm({ ...editForm, status: e.target.value as any })}
                                    className="w-full h-9 rounded-md border border-input bg-background px-3 py-1 text-xs shadow-xs focus-visible:outline-hidden focus-visible:ring-1 focus-visible:ring-ring"
                                >
                                    <option value="Active">Active</option>
                                    <option value="Expired">Expired</option>
                                    <option value="Disabled">Disabled</option>
                                </select>
                            </div>
                        </div>

                        <div className="space-y-1.5">
                            <Label htmlFor="edit-guest-purpose" className="text-xs font-semibold">
                                Purpose
                            </Label>
                            <Input
                                id="edit-guest-purpose"
                                value={editForm.purpose}
                                onChange={(e) => setEditForm({ ...editForm, purpose: e.target.value })}
                            />
                        </div>

                        <DialogFooter className="pt-2">
                            <Button
                                type="button"
                                variant="outline"
                                onClick={() => setEditModalOpen(false)}
                                disabled={actionSubmitting}
                            >
                                Cancel
                            </Button>
                            <Button
                                type="submit"
                                disabled={actionSubmitting}
                            >
                                {actionSubmitting ? "Saving..." : "Save Changes"}
                            </Button>
                        </DialogFooter>
                    </form>
                </DialogContent>
            </Dialog>

            {/* Confirm Extension Modal (Durations: 15 days, 45 days, 1 month, 3 months, 6 months) */}
            <Dialog open={extendModalOpen} onOpenChange={setExtendModalOpen}>
                <DialogContent className="max-w-md p-6 space-y-4">
                    <DialogHeader>
                        <DialogTitle className="flex items-center gap-2 text-lg text-emerald-700 dark:text-emerald-400">
                            <ClockIcon className="size-5" />
                            Confirm Access Extension
                        </DialogTitle>
                        <DialogDescription className="text-xs">
                            Select the extension duration for <strong>{selectedGuest?.name}</strong> (+91 {selectedGuest?.phone}). Current expiry: {formatDate(selectedGuest?.expiresAt)}.
                        </DialogDescription>
                    </DialogHeader>

                    <div className="space-y-3 pt-1">
                        <Label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                            Choose Extension Duration:
                        </Label>

                        <div className="space-y-2">
                            {EXTENSION_OPTIONS.map((opt) => (
                                <label
                                    key={opt.key}
                                    onClick={() => setSelectedDuration(opt.key)}
                                    className={`flex items-center justify-between p-3 rounded-lg border cursor-pointer transition-all ${
                                        selectedDuration === opt.key
                                            ? "border-emerald-600 bg-emerald-50/70 dark:bg-emerald-950/30 text-emerald-950 dark:text-emerald-200 ring-1 ring-emerald-500"
                                            : "border-border hover:bg-muted/40"
                                    }`}
                                >
                                    <div className="flex items-center gap-3">
                                        <input
                                            type="radio"
                                            name="extension-duration"
                                            checked={selectedDuration === opt.key}
                                            onChange={() => setSelectedDuration(opt.key)}
                                            className="text-emerald-600 focus:ring-emerald-500"
                                        />
                                        <div>
                                            <div className="font-semibold text-sm">{opt.label}</div>
                                            <div className="text-xs text-muted-foreground">{opt.description}</div>
                                        </div>
                                    </div>
                                    <span className="text-xs font-mono font-medium text-emerald-700 dark:text-emerald-400">
                                        +{opt.days} days
                                    </span>
                                </label>
                            ))}
                        </div>

                        {selectedGuest && (
                            <div className="p-3 rounded-lg bg-muted/40 border text-xs space-y-1">
                                <div className="flex justify-between">
                                    <span className="text-muted-foreground">Current Expiry:</span>
                                    <span className="font-mono font-medium">{formatDate(selectedGuest.expiresAt)}</span>
                                </div>
                                <div className="flex justify-between text-emerald-700 dark:text-emerald-400 font-semibold">
                                    <span>New Expiry After Extension:</span>
                                    <span className="font-mono">
                                        {(() => {
                                            const days = EXTENSION_OPTIONS.find(o => o.key === selectedDuration)?.days || 15
                                            const base = new Date(selectedGuest.expiresAt) > new Date()
                                                ? new Date(selectedGuest.expiresAt).getTime()
                                                : Date.now()
                                            return formatDate(new Date(base + days * 24 * 60 * 60 * 1000).toISOString())
                                        })()}
                                    </span>
                                </div>
                            </div>
                        )}
                    </div>

                    <DialogFooter className="pt-2">
                        <Button
                            type="button"
                            variant="outline"
                            onClick={() => setExtendModalOpen(false)}
                            disabled={actionSubmitting}
                        >
                            Cancel
                        </Button>
                        <Button
                            type="button"
                            onClick={handleExtendSubmit}
                            disabled={actionSubmitting}
                            className="bg-emerald-600 hover:bg-emerald-700 text-white gap-1.5"
                        >
                            {actionSubmitting ? (
                                <>
                                    <div className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-background border-t-transparent" />
                                    Updating Expiry...
                                </>
                            ) : (
                                <>
                                    <CheckCircle2Icon className="size-4" />
                                    Confirm Extension
                                </>
                            )}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* Reject Extension Dialog */}
            <Dialog open={rejectModalOpen} onOpenChange={setRejectModalOpen}>
                <DialogContent className="max-w-md p-6 space-y-4">
                    <DialogHeader>
                        <DialogTitle className="flex items-center gap-2 text-lg text-rose-600 dark:text-rose-400">
                            <XCircleIcon className="size-5" />
                            Reject Extension Request
                        </DialogTitle>
                        <DialogDescription className="text-xs">
                            Rejecting extension will immediately mark the guest account as <strong>Expired</strong>. The user will be blocked from logging in or requesting OTPs.
                        </DialogDescription>
                    </DialogHeader>

                    <div className="space-y-3 pt-1">
                        <div className="space-y-1.5">
                            <Label htmlFor="reject-reason" className="text-xs font-semibold">
                                Rejection Reason / Admin Note
                            </Label>
                            <Input
                                id="reject-reason"
                                placeholder="e.g. Project tenure completed; access no longer required"
                                value={rejectReason}
                                onChange={(e) => setRejectReason(e.target.value)}
                            />
                        </div>

                        <div className="p-3 rounded-lg bg-rose-50 dark:bg-rose-950/30 border border-rose-200 dark:border-rose-900/50 text-xs text-rose-900 dark:text-rose-200">
                            <strong>Note:</strong> When an expired guest attempts to request an OTP, the system will block them with message:
                            <div className="mt-1 font-mono text-[11px] p-1.5 rounded bg-background/80 border">
                                "Your guest account has expired. Please contact your administrator to extend your access."
                            </div>
                        </div>
                    </div>

                    <DialogFooter className="pt-2">
                        <Button
                            type="button"
                            variant="outline"
                            onClick={() => setRejectModalOpen(false)}
                            disabled={actionSubmitting}
                        >
                            Cancel
                        </Button>
                        <Button
                            type="button"
                            variant="destructive"
                            onClick={handleRejectSubmit}
                            disabled={actionSubmitting}
                            className="gap-1.5"
                        >
                            {actionSubmitting ? "Rejecting..." : "Reject Extension & Expire Account"}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* Extension History Modal */}
            <Dialog open={historyModalOpen} onOpenChange={setHistoryModalOpen}>
                <DialogContent className="max-w-md p-6 space-y-4">
                    <DialogHeader>
                        <DialogTitle className="flex items-center gap-2 text-base">
                            <CalendarIcon className="size-4 text-primary" />
                            Extension History: {selectedGuest?.name}
                        </DialogTitle>
                        <DialogDescription className="text-xs">
                            Audit trail of all confirmed extensions for this guest account.
                        </DialogDescription>
                    </DialogHeader>

                    <div className="space-y-2 max-h-[300px] overflow-y-auto">
                        {selectedGuest?.extensionHistory && selectedGuest.extensionHistory.length > 0 ? (
                            selectedGuest.extensionHistory.map((item, idx) => (
                                <div key={idx} className="p-2.5 rounded-lg border bg-muted/20 text-xs space-y-1">
                                    <div className="flex justify-between items-center">
                                        <span className="font-semibold text-emerald-700 dark:text-emerald-400">
                                            +{item.durationLabel}
                                        </span>
                                        <span className="text-[11px] text-muted-foreground">
                                            {formatDateTime(item.extendedAt)}
                                        </span>
                                    </div>
                                    <div className="text-muted-foreground flex justify-between">
                                        <span>Extended by: <strong>{item.extendedBy?.name || "Admin"}</strong></span>
                                        <span className="font-mono text-[11px]">{formatDate(item.newExpiresAt)}</span>
                                    </div>
                                </div>
                            ))
                        ) : (
                            <p className="text-xs text-muted-foreground text-center py-4">No extension records.</p>
                        )}
                    </div>

                    <DialogFooter>
                        <Button variant="outline" size="sm" onClick={() => setHistoryModalOpen(false)}>
                            Close
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    )
}

export default GuestUserManagementPage

