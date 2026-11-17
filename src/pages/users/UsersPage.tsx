import * as React from "react"
import {
    Card,
    CardContent,
} from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import {
    PlusIcon,
    UsersIcon,
    SearchIcon,
    ShieldIcon,
    ShieldAlertIcon,
    EditIcon,
    TrashIcon,
    FolderOpenIcon,
    StoreIcon,
    LayoutDashboardIcon,
    Clock,
    UserPlus,
    UserCheck,
    PhoneIcon,
    BuildingIcon,
    CheckCircle2Icon,
    XCircleIcon,
    ClockIcon,
    CalendarIcon,
    InfoIcon,
    ClipboardCheck,
    Copy,
    FileText
} from "lucide-react"
import { useAuth } from "@/contexts/AuthContext"
import { useNavigate } from "react-router-dom"
import { UserFormModal } from "./UserFormModal"
import { SubuserFormModal } from "./SubuserFormModal"
import userService, { type UserRecord } from "@/services/user.service"
import guestUserService, {
    type GuestUserRecord,
    type ExtensionDuration,
    type CreateGuestUserDto,
    type UpdateGuestUserDto
} from "@/services/guestUser.service"
import formService from "@/services/form.service"
import { DynamicGuestFields, getGuestFieldCanonicalKey, DEFAULT_GUEST_FIELDS } from "@/components/DynamicGuestFields"
import { validateEmail } from "@/utils/validation"
import { toast } from "sonner"
import NoAccessPage from "../NoAccessPage"
import { ConfirmDialog } from "@/components/ConfirmDialog"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog"
import { Popover, PopoverTrigger, PopoverContent } from "@/components/ui/popover"
import { Calendar } from "@/components/ui/calendar"

const avatarColors = [
    "bg-gradient-to-br from-blue-400 to-blue-600",
    "bg-gradient-to-br from-emerald-400 to-emerald-600",
    "bg-gradient-to-br from-purple-400 to-purple-600",
    "bg-gradient-to-br from-orange-400 to-orange-600",
    "bg-gradient-to-br from-red-400 to-red-600",
    "bg-gradient-to-br from-teal-400 to-teal-600",
    "bg-gradient-to-br from-yellow-400 to-yellow-600",
    "bg-gradient-to-br from-pink-400 to-pink-600",
]

const EXTENSION_OPTIONS: { key: ExtensionDuration; label: string; days: number; description: string }[] = [
    { key: "15 days", label: "15 Days", days: 15, description: "Standard half-month extension" },
    { key: "45 days", label: "45 Days", days: 45, description: "Extended project support period" },
    { key: "1 month", label: "1 Month", days: 30, description: "Standard 30-day working month" },
    { key: "3 months", label: "3 Months", days: 90, description: "Quarterly contract duration" },
    { key: "6 months", label: "6 Months", days: 180, description: "Long-term contractor / inspector duration" },
]

export function UsersPage() {
    const navigate = useNavigate()
    const { user: currentUser } = useAuth()

    const isAdmin = currentUser?.role === "Admin"
    const canManageSubusers = Boolean(isAdmin || currentUser?.canCreateUser)

    // Helper to format Date for <input type="date" />
    const toInputDateFormat = (date: Date | string) => {
        const d = new Date(date)
        if (isNaN(d.getTime())) return ""
        const year = d.getFullYear()
        const month = String(d.getMonth() + 1).padStart(2, "0")
        const day = String(d.getDate()).padStart(2, "0")
        return `${year}-${month}-${day}`
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

    // Tab state: "internal" | "subusers" | "guests"
    const [activeTab, setActiveTab] = React.useState<"internal" | "subusers" | "guests">(() => {
        const saved = typeof window !== "undefined" ? localStorage.getItem("users_active_tab") : null
        if (saved === "internal" || saved === "subusers" || saved === "guests") {
            return saved as any
        }
        return isAdmin ? "internal" : "subusers"
    })

    React.useEffect(() => {
        localStorage.setItem("users_active_tab", activeTab)
    }, [activeTab])

    // Internal Users State (Admin only)
    const [users, setUsers] = React.useState<UserRecord[]>([])
    const [userSearchTerm, setUserSearchTerm] = React.useState("")
    const [loadingUsers, setLoadingUsers] = React.useState(true)
    const [showUserModal, setShowUserModal] = React.useState(false)
    const [editingUser, setEditingUser] = React.useState<UserRecord | null>(null)

    // Subusers State
    const [subusers, setSubusers] = React.useState<UserRecord[]>([])
    const [subuserSearchTerm, setSubuserSearchTerm] = React.useState("")
    const [loadingSubusers, setLoadingSubusers] = React.useState(true)
    const [showSubuserModal, setShowSubuserModal] = React.useState(false)
    const [editingSubuser, setEditingSubuser] = React.useState<UserRecord | null>(null)

    // Guest Users State
    const [guestUsers, setGuestUsers] = React.useState<GuestUserRecord[]>([])
    const [loadingGuests, setLoadingGuests] = React.useState(true)
    const [guestSearchTerm, setGuestSearchTerm] = React.useState("")
    const [guestStatusFilter, setGuestStatusFilter] = React.useState<string>("All")

    // Guest Modals State
    const [createGuestModalOpen, setCreateGuestModalOpen] = React.useState(false)
    const [editGuestModalOpen, setEditGuestModalOpen] = React.useState(false)
    const [extendGuestModalOpen, setExtendGuestModalOpen] = React.useState(false)
    const [rejectGuestModalOpen, setRejectGuestModalOpen] = React.useState(false)
    const [historyGuestModalOpen, setHistoryGuestModalOpen] = React.useState(false)
    const [deletingGuest, setDeletingGuest] = React.useState<GuestUserRecord | null>(null)

    const [selectedGuest, setSelectedGuest] = React.useState<GuestUserRecord | null>(null)
    const [selectedDuration, setSelectedDuration] = React.useState<ExtensionDuration | string>("15 days")
    const [customExtendExpiryDate, setCustomExtendExpiryDate] = React.useState<string>("")
    const [calendarOpen, setCalendarOpen] = React.useState<boolean>(false)
    const [editCalendarOpen, setEditCalendarOpen] = React.useState<boolean>(false)
    const [rejectReason, setRejectReason] = React.useState("")
    const [actionSubmitting, setActionSubmitting] = React.useState(false)

    // Dynamic Guest User Form Schema from Forms Management
    const [guestFormFields, setGuestFormFields] = React.useState<any[]>([])

    const fetchGuestSchema = React.useCallback(async () => {
        try {
            const res = await formService.getFormBySlug("guest-user-form")
            if (res.success && res.data && Array.isArray(res.data.fields)) {
                setGuestFormFields(res.data.fields.sort((a: any, b: any) => (a.order ?? 0) - (b.order ?? 0)))
            }
        } catch (err) {
            console.error("Failed to load guest-user-form schema:", err)
        }
    }, [])

    React.useEffect(() => {
        fetchGuestSchema()
    }, [fetchGuestSchema])

    // Refetch schema whenever create or edit guest modal is opened so changes from Forms Management reflect immediately
    React.useEffect(() => {
        if (createGuestModalOpen || editGuestModalOpen) {
            fetchGuestSchema()
        }
    }, [createGuestModalOpen, editGuestModalOpen, fetchGuestSchema])

    // Memoized effective display fields: use guestFormFields from Forms Management if loaded, otherwise fallback
    const displayGuestFields = React.useMemo(() => {
        if (Array.isArray(guestFormFields) && guestFormFields.length > 0) {
            return [...guestFormFields].sort((a: any, b: any) => (a.order ?? 0) - (b.order ?? 0))
        }
        return DEFAULT_GUEST_FIELDS
    }, [guestFormFields])

    // Form states
    const [createGuestForm, setCreateGuestForm] = React.useState<CreateGuestUserDto & Record<string, any>>({
        name: "",
        phone: "",
        email: "",
        organization: "",
        purpose: "",
        customFields: {}
    })
    const [createGuestErrors, setCreateGuestErrors] = React.useState<Record<string, string | undefined>>({})

    const [editGuestForm, setEditGuestForm] = React.useState<UpdateGuestUserDto & Record<string, any>>({
        name: "",
        phone: "",
        email: "",
        organization: "",
        purpose: "",
        status: "Active",
        customFields: {}
    })
    const [editGuestErrors, setEditGuestErrors] = React.useState<Record<string, string | undefined>>({})

    // Deletion dialogs
    const [deletingUser, setDeletingUser] = React.useState<{ id: string; name: string; isSubuser?: boolean } | null>(null)
    const [error, setError] = React.useState<string | null>(null)

    // Fetch Internal Users (Admin only)
    const fetchUsers = React.useCallback(async () => {
        if (!isAdmin) return
        setLoadingUsers(true)
        try {
            const resData = await userService.getUsers()
            if (resData.success) {
                // Filter out external vendors and subusers
                const internalOnly = (resData.data || []).filter(
                    (u: any) => u.role !== "Vendor" && u.role !== "Subuser"
                )
                setUsers(internalOnly)
            }
        } catch (err: any) {
            console.error("Error fetching internal users:", err)
            setError(err?.response?.data?.message || "Failed to load internal users")
        } finally {
            setLoadingUsers(false)
        }
    }, [isAdmin])

    // Fetch Subusers (Admin gets all, Parent user gets their own)
    const fetchSubusers = React.useCallback(async () => {
        if (!canManageSubusers) return
        setLoadingSubusers(true)
        try {
            const resData = await userService.getSubusers()
            if (resData.success) {
                setSubusers(resData.data || [])
            }
        } catch (err: any) {
            console.error("Error fetching subusers:", err)
            toast.error("Failed to load subusers")
        } finally {
            setLoadingSubusers(false)
        }
    }, [canManageSubusers])

    // Fetch Guest Users
    const fetchGuestUsers = React.useCallback(async () => {
        if (!canManageSubusers) return
        setLoadingGuests(true)
        try {
            const resData = await guestUserService.getGuestUsers()
            if (resData.success) {
                setGuestUsers(resData.data || [])
            }
        } catch (err: any) {
            console.error("Error fetching guest users:", err)
        } finally {
            setLoadingGuests(false)
        }
    }, [canManageSubusers])

    // Initial Load
    React.useEffect(() => {
        if (isAdmin) fetchUsers()
        if (canManageSubusers) {
            fetchSubusers()
            fetchGuestUsers()
        }
    }, [isAdmin, canManageSubusers, fetchUsers, fetchSubusers, fetchGuestUsers])

    // Delete Handlers for Internal User / Subuser
    const handleDeleteConfirm = async () => {
        if (!deletingUser) return
        const { id, isSubuser } = deletingUser
        try {
            const res = isSubuser
                ? await userService.deleteSubuser(id)
                : await userService.deleteUser(id)
            if (res.success) {
                toast.success("User deleted successfully")
                if (isSubuser) {
                    setSubusers(prev => prev.filter(u => u._id !== id))
                } else {
                    setUsers(prev => prev.filter(u => u._id !== id))
                }
            }
        } catch (err: any) {
            toast.error(err?.response?.data?.message || "Failed to delete user")
        } finally {
            setDeletingUser(null)
        }
    }

    // Guest User Action Handlers
    const handleCreateGuestSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        const errors: Record<string, string> = {}

        // Validate each field dynamically based on Forms Management schema
        for (const field of displayGuestFields) {
            const canonicalKey = getGuestFieldCanonicalKey(field)
            const rawKey = field.name || field.id || field.label
            const isReq = Boolean(field.required) || Boolean(field.validations?.some((v: any) => v.type === "required"))

            const rawVal =
                (createGuestForm as any)[canonicalKey] ??
                (createGuestForm as any)[rawKey] ??
                (createGuestForm as any)[field.label] ??
                createGuestForm.customFields?.[canonicalKey] ??
                createGuestForm.customFields?.[rawKey]
            const val = rawVal !== undefined && rawVal !== null ? String(rawVal).trim() : ""

            if (isReq && !val) {
                errors[canonicalKey] = `${field.label || canonicalKey} is mandatory.`
                continue
            }

            if (canonicalKey === "phone" && val) {
                const clean = val.replace(/\D/g, "")
                if (clean.length < 10) {
                    errors.phone = "Valid 10-digit mobile number is mandatory."
                }
            }

            if ((canonicalKey === "email" || field.type === "email") && val) {
                const emailCheck = validateEmail(val)
                if (!emailCheck.isValid) {
                    errors[canonicalKey] = emailCheck.error || "Please enter a valid email address."
                }
            }
        }

        if (Object.keys(errors).length > 0) {
            setCreateGuestErrors(errors)
            return
        }

        // Collect custom & standard fields
        const cleanDigits = (createGuestForm.phone || "").replace(/\D/g, "")
        const customFields: Record<string, any> = { ...((createGuestForm as any).customFields || {}) }

        for (const field of displayGuestFields) {
            const canonicalKey = getGuestFieldCanonicalKey(field)
            const rawKey = field.name || field.id || field.label
            const val =
                (createGuestForm as any)[canonicalKey] ??
                (createGuestForm as any)[rawKey] ??
                (createGuestForm as any)[field.label]

            if (val !== undefined) {
                const std = ["name", "phone", "email", "organization", "purpose"]
                if (!std.includes(canonicalKey)) {
                    customFields[canonicalKey] = val
                    if (rawKey && rawKey !== canonicalKey) {
                        customFields[rawKey] = val
                    }
                }
            }
        }

        setActionSubmitting(true)
        try {
            const payload: any = {
                ...createGuestForm,
                name: (createGuestForm.name || "").trim(),
                phone: cleanDigits.length > 10 ? cleanDigits.slice(-10) : cleanDigits,
                email: (createGuestForm.email || "").trim() || undefined,
                organization: (createGuestForm.organization || "").trim() || undefined,
                purpose: (createGuestForm.purpose || "").trim() || undefined,
                customFields,
                ...customFields
            }
            const res = await guestUserService.createGuestUser(payload)
            if (res.success) {
                toast.success(`Guest account for "${res.data.name}" created with 15-day access!`)
                setCreateGuestModalOpen(false)
                setCreateGuestForm({ name: "", phone: "", email: "", organization: "", purpose: "", customFields: {} })
                setCreateGuestErrors({})
                fetchGuestUsers()
            }
        } catch (err: any) {
            toast.error(err?.response?.data?.message || "Failed to create guest user.")
        } finally {
            setActionSubmitting(false)
        }
    }

    const handleOpenEditGuest = (guest: GuestUserRecord) => {
        setSelectedGuest(guest)
        const raw = guest as any
        const initialCustom: Record<string, any> = {}
        if (raw.customFields && typeof raw.customFields === "object") {
            Object.assign(initialCustom, raw.customFields)
        }

        for (const [k, v] of Object.entries(raw)) {
            const std = ["name", "phone", "phonenumber", "email", "organization", "purpose", "status", "expiresat", "_id", "id", "createdat", "updatedat", "customfields"]
            if (!std.includes(k.toLowerCase()) && v !== undefined) {
                initialCustom[k] = v
            }
        }

        setEditGuestForm({
            name: guest.name || "",
            phone: guest.phone || "",
            email: guest.email || "",
            organization: guest.organization || "",
            purpose: guest.purpose || "",
            status: guest.status || "Active",
            expiresAt: guest.expiresAt ? toInputDateFormat(guest.expiresAt) : "",
            customFields: initialCustom,
            ...initialCustom
        })
        setEditGuestErrors({})
        setEditCalendarOpen(false)
        setEditGuestModalOpen(true)
    }

    const handleEditGuestSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        if (!selectedGuest) return

        const errors: Record<string, string> = {}

        // Validate each field dynamically based on Forms Management schema
        for (const field of displayGuestFields) {
            const canonicalKey = getGuestFieldCanonicalKey(field)
            const rawKey = field.name || field.id || field.label
            const isReq = Boolean(field.required) || Boolean(field.validations?.some((v: any) => v.type === "required"))

            const rawVal =
                (editGuestForm as any)[canonicalKey] ??
                (editGuestForm as any)[rawKey] ??
                (editGuestForm as any)[field.label] ??
                editGuestForm.customFields?.[canonicalKey] ??
                editGuestForm.customFields?.[rawKey]
            const val = rawVal !== undefined && rawVal !== null ? String(rawVal).trim() : ""

            if (isReq && !val) {
                errors[canonicalKey] = `${field.label || canonicalKey} is mandatory.`
                continue
            }

            if (canonicalKey === "phone" && val) {
                const clean = val.replace(/\D/g, "")
                if (clean.length < 10) {
                    errors.phone = "Valid 10-digit mobile number is mandatory."
                }
            }

            if ((canonicalKey === "email" || field.type === "email") && val) {
                const emailCheck = validateEmail(val)
                if (!emailCheck.isValid) {
                    errors[canonicalKey] = emailCheck.error || "Please enter a valid email address."
                }
            }
        }

        if (Object.keys(errors).length > 0) {
            setEditGuestErrors(errors)
            return
        }

        // Collect custom & standard fields
        const cleanDigits = (editGuestForm.phone || "").replace(/\D/g, "")
        const customFields: Record<string, any> = { ...((editGuestForm as any).customFields || {}) }

        for (const field of displayGuestFields) {
            const canonicalKey = getGuestFieldCanonicalKey(field)
            const rawKey = field.name || field.id || field.label
            const val =
                (editGuestForm as any)[canonicalKey] ??
                (editGuestForm as any)[rawKey] ??
                (editGuestForm as any)[field.label]

            if (val !== undefined) {
                const std = ["name", "phone", "email", "organization", "purpose"]
                if (!std.includes(canonicalKey)) {
                    customFields[canonicalKey] = val
                    if (rawKey && rawKey !== canonicalKey) {
                        customFields[rawKey] = val
                    }
                }
            }
        }

        setActionSubmitting(true)
        try {
            const payload: any = {
                ...editGuestForm,
                name: (editGuestForm.name || "").trim(),
                phone: cleanDigits.length > 10 ? cleanDigits.slice(-10) : cleanDigits,
                email: (editGuestForm.email || "").trim() || undefined,
                organization: (editGuestForm.organization || "").trim() || undefined,
                purpose: (editGuestForm.purpose || "").trim() || undefined,
                customFields,
                ...customFields
            }
            const res = await guestUserService.updateGuestUser(selectedGuest._id, payload)
            if (res.success) {
                toast.success(`Guest account "${res.data.name}" updated successfully.`)
                setEditGuestModalOpen(false)
                setSelectedGuest(null)
                fetchGuestUsers()
            }
        } catch (err: any) {
            toast.error(err?.response?.data?.message || "Failed to update guest user.")
        } finally {
            setActionSubmitting(false)
        }
    }

    const handleOpenExtendGuest = (guest: GuestUserRecord) => {
        setSelectedGuest(guest)
        setSelectedDuration("15 days")
        const base = guest.expiresAt && new Date(guest.expiresAt) > new Date()
            ? new Date(guest.expiresAt).getTime()
            : Date.now()
        const defaultDate = new Date(base + 15 * 24 * 60 * 60 * 1000)
        setCustomExtendExpiryDate(toInputDateFormat(defaultDate))
        setCalendarOpen(false)
        setExtendGuestModalOpen(true)
    }

    const handleSelectPill = (key: ExtensionDuration | string, days: number) => {
        setSelectedDuration(key)
        if (!selectedGuest) return
        const base = selectedGuest.expiresAt && new Date(selectedGuest.expiresAt) > new Date()
            ? new Date(selectedGuest.expiresAt).getTime()
            : Date.now()
        const newDate = new Date(base + days * 24 * 60 * 60 * 1000)
        setCustomExtendExpiryDate(toInputDateFormat(newDate))
    }

    const handleExtendGuestSubmit = async () => {
        if (!selectedGuest || !customExtendExpiryDate) return
        setActionSubmitting(true)
        try {
            const res = await guestUserService.extendGuestUser(
                selectedGuest._id,
                selectedDuration,
                customExtendExpiryDate
            )
            if (res.success) {
                toast.success(`Access extended successfully until ${formatDate(res.data.expiresAt)}.`)
                setExtendGuestModalOpen(false)
                setSelectedGuest(null)
                fetchGuestUsers()
            }
        } catch (err: any) {
            toast.error(err?.response?.data?.message || "Failed to extend access.")
        } finally {
            setActionSubmitting(false)
        }
    }

    const handleOpenRejectGuest = (guest: GuestUserRecord) => {
        setSelectedGuest(guest)
        setRejectReason("Extension rejected by administrator/creator")
        setRejectGuestModalOpen(true)
    }

    const handleRejectGuestSubmit = async () => {
        if (!selectedGuest) return
        setActionSubmitting(true)
        try {
            const res = await guestUserService.rejectGuestUser(selectedGuest._id, rejectReason)
            if (res.success) {
                toast.success(`Access revoked and expired for "${res.data.name}".`)
                setRejectGuestModalOpen(false)
                setSelectedGuest(null)
                fetchGuestUsers()
            }
        } catch (err: any) {
            toast.error(err?.response?.data?.message || "Failed to expire guest access.")
        } finally {
            setActionSubmitting(false)
        }
    }

    const handleDeleteGuestConfirm = async () => {
        if (!deletingGuest) return
        try {
            const res = await guestUserService.deleteGuestUser(deletingGuest._id)
            if (res.success) {
                toast.success(`Guest account "${deletingGuest.name}" deleted successfully.`)
                setGuestUsers(prev => prev.filter(g => g._id !== deletingGuest._id))
            } else {
                toast.error(res.message || "Failed to delete guest user")
            }
        } catch (err: any) {
            toast.error(err?.response?.data?.message || "Failed to delete guest user")
        } finally {
            setDeletingGuest(null)
        }
    }

    // Filter calculations
    const filteredUsers = React.useMemo(() => {
        return users.filter((u) => {
            const term = userSearchTerm.toLowerCase()
            return (
                u.name?.toLowerCase().includes(term) ||
                u.email?.toLowerCase().includes(term) ||
                u.user_id?.toLowerCase().includes(term)
            )
        })
    }, [users, userSearchTerm])

    const filteredSubusers = React.useMemo(() => {
        return subusers.filter((u) => {
            const term = subuserSearchTerm.toLowerCase()
            return (
                u.name?.toLowerCase().includes(term) ||
                u.email?.toLowerCase().includes(term) ||
                u.user_id?.toLowerCase().includes(term) ||
                (u.parent_id && typeof u.parent_id === 'object' && u.parent_id.name?.toLowerCase().includes(term))
            )
        })
    }, [subusers, subuserSearchTerm])

    const filteredGuests = React.useMemo(() => {
        return guestUsers.filter((g) => {
            // 1. Status Filter
            if (guestStatusFilter === "Active") {
                if (g.status !== "Active" || g.isExpired) return false
            } else if (guestStatusFilter === "Expiring Soon") {
                const isExpSoon = g.isExpiringSoon || (g.status === "Active" && g.daysRemaining !== undefined && g.daysRemaining <= 2 && g.daysRemaining > 0)
                if (!isExpSoon) return false
            } else if (guestStatusFilter === "Expired") {
                const isExp = g.status === "Expired" || g.isExpired
                if (!isExp) return false
            } else if (guestStatusFilter === "Disabled") {
                if (g.status !== "Disabled") return false
            }

            // 2. Search Query
            if (!guestSearchTerm.trim()) return true
            const q = guestSearchTerm.toLowerCase().trim()
            return (
                (g.name && g.name.toLowerCase().includes(q)) ||
                (g.phone && g.phone.includes(q)) ||
                (g.email && g.email.toLowerCase().includes(q)) ||
                (g.organization && g.organization.toLowerCase().includes(q)) ||
                (g.purpose && g.purpose.toLowerCase().includes(q)) ||
                (g.createdBy?.name && g.createdBy.name.toLowerCase().includes(q))
            )
        })
    }, [guestUsers, guestStatusFilter, guestSearchTerm])

    const expiringSoonCount = React.useMemo(() => {
        return guestUsers.filter(g =>
            g.status === "Active" && (g.isExpiringSoon || (g.daysRemaining !== undefined && g.daysRemaining <= 2 && g.daysRemaining > 0))
        ).length
    }, [guestUsers])

    const bentoCardClass = "rounded-2xl border border-border/60 bg-card shadow-xs transition-all overflow-hidden"

    if (!canManageSubusers && !isAdmin) {
        return <NoAccessPage />
    }

    return (
        <div className="w-full flex flex-col space-y-3 pt-1 pb-4 animate-in fade-in duration-300">
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div className="flex items-center gap-2.5 min-w-0">
                    <div className="p-1.5 rounded-lg bg-gradient-to-tr from-blue-600 to-indigo-600 text-white shadow-sm shadow-blue-500/20 shrink-0">
                        <UsersIcon className="size-4" />
                    </div>
                    <div className="min-w-0">
                        <h1 className="text-base sm:text-lg font-bold tracking-tight text-foreground truncate">
                            Users, Subusers & Guest Management
                        </h1>
                    </div>
                </div>

                <div className="flex flex-wrap items-center gap-2">
                    {/* 1. Internal Users Active -> Show Create User / Admin only */}
                    {isAdmin && activeTab === "internal" && (
                        <Button
                            className="gap-1.5 rounded-lg shadow-xs bg-primary hover:bg-primary/90 text-primary-foreground font-semibold cursor-pointer h-7.5 px-3 text-[11px]"
                            onClick={() => {
                                setEditingUser(null)
                                setShowUserModal(true)
                            }}
                        >
                            <PlusIcon className="size-3.5" />
                            Create User / Admin
                        </Button>
                    )}

                    {/* 2. All Subusers Active -> Show Create Subuser only */}
                    {canManageSubusers && activeTab === "subusers" && (
                        <Button
                            className="gap-1.5 rounded-lg shadow-xs bg-primary hover:bg-primary/90 text-primary-foreground font-semibold cursor-pointer h-7.5 px-3 text-[11px]"
                            onClick={() => {
                                setEditingSubuser(null)
                                setShowSubuserModal(true)
                            }}
                        >
                            <UserPlus className="size-3.5" />
                            Create Subuser
                        </Button>
                    )}

                    {/* 3. Guest Users Active -> Show Create Guest User only */}
                    {canManageSubusers && activeTab === "guests" && (
                        <Button
                            className="gap-1.5 rounded-lg shadow-xs bg-indigo-600 hover:bg-indigo-700 text-white font-semibold cursor-pointer h-7.5 px-3 text-[11px]"
                            onClick={() => {
                                setCreateGuestForm({ name: "", phone: "", email: "", organization: "", purpose: "", customFields: {} })
                                setCreateGuestErrors({})
                                setCreateGuestModalOpen(true)
                            }}
                        >
                            <UserCheck className="size-3.5" />
                            Create Guest User
                        </Button>
                    )}
                </div>
            </div>

            {/* Navigation Tabs */}
            <div className="flex items-center gap-1.5 border-b border-border/50 pb-2">
                {isAdmin && (
                    <button
                        type="button"
                        onClick={() => setActiveTab("internal")}
                        className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                            activeTab === "internal"
                                ? "bg-primary text-primary-foreground shadow-xs"
                                : "text-muted-foreground hover:bg-muted hover:text-foreground"
                        }`}
                    >
                        <UsersIcon className="size-3.5" />
                        Internal Users ({users.length})
                    </button>
                )}

                <button
                    type="button"
                    onClick={() => setActiveTab("subusers")}
                    className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                        activeTab === "subusers"
                            ? "bg-primary text-primary-foreground shadow-xs"
                            : "text-muted-foreground hover:bg-muted hover:text-foreground"
                    }`}
                >
                    <UserCheck className="size-3.5" />
                    {isAdmin ? "All Subusers" : "My Subusers"} ({subusers.length})
                </button>

                <button
                    type="button"
                    onClick={() => setActiveTab("guests")}
                    className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                        activeTab === "guests"
                            ? "bg-primary text-primary-foreground shadow-xs"
                            : "text-muted-foreground hover:bg-muted hover:text-foreground"
                    }`}
                >
                    <ClockIcon className="size-3.5" />
                    Guest Users ({guestUsers.length})
                    {expiringSoonCount > 0 && (
                        <span className="inline-flex items-center justify-center size-4 text-[9px] font-extrabold rounded-full bg-amber-500 text-white animate-pulse">
                            {expiringSoonCount}
                        </span>
                    )}
                </button>
            </div>

            {/* TAB 1: Internal Users (Admin only) */}
            {isAdmin && activeTab === "internal" && (
                <div className="flex flex-col gap-3">
                    {/* Search bar before user details card */}
                    <div className="flex items-center justify-between gap-3">
                        <div className="relative w-full max-w-sm">
                            <SearchIcon className="absolute left-3 top-2.5 size-4 text-muted-foreground" />
                            <Input
                                placeholder="Search users by name, email, ID..."
                                className="pl-9 h-7.5 rounded-lg border-border/50 bg-background/50 focus-visible:ring-primary/30 text-xs"
                                value={userSearchTerm}
                                onChange={(e) => setUserSearchTerm(e.target.value)}
                            />
                        </div>
                    </div>

                    <Card className={`${bentoCardClass} flex flex-col`}>
                        <CardContent className="p-0">
                        {error && (
                            <div className="mx-6 my-4 rounded-xl bg-destructive/10 border border-destructive/20 p-4 text-sm font-medium text-destructive flex items-center gap-2">
                                <ShieldAlertIcon className="size-4 shrink-0" />
                                <span>{error}</span>
                            </div>
                        )}

                        {loadingUsers ? (
                            <div className="flex items-center justify-center py-16">
                                <div className="flex flex-col items-center gap-4">
                                    <div className="size-8 animate-spin rounded-full border-[3px] border-primary border-t-transparent shadow-sm" />
                                    <p className="font-medium text-muted-foreground">Loading internal team members...</p>
                                </div>
                            </div>
                        ) : filteredUsers.length === 0 ? (
                            <div className="py-16 text-center text-muted-foreground">
                                <div className="flex flex-col items-center justify-center opacity-50">
                                    <UsersIcon className="size-12 mb-4" />
                                    <p className="font-medium">No internal users found.</p>
                                    <p className="text-xs mt-1">Try adjusting your search criteria or register a new team member.</p>
                                </div>
                            </div>
                        ) : (
                            <div className="overflow-x-auto">
                                <table className="w-full text-sm">
                                    <thead>
                                        <tr className="border-b border-border/50 bg-muted/10">
                                            <th className="text-left px-3.5 py-2 font-semibold text-muted-foreground uppercase text-[10px] sm:text-[11px] tracking-wider">User</th>
                                            <th className="text-left px-3.5 py-2 font-semibold text-muted-foreground uppercase text-[10px] sm:text-[11px] tracking-wider">Email</th>
                                            <th className="text-left px-3.5 py-2 font-semibold text-muted-foreground uppercase text-[10px] sm:text-[11px] tracking-wider">Privileges</th>
                                            <th className="text-left px-3.5 py-2 font-semibold text-muted-foreground uppercase text-[10px] sm:text-[11px] tracking-wider">Page Permissions</th>
                                            <th className="text-left px-3.5 py-2 font-semibold text-muted-foreground uppercase text-[10px] sm:text-[11px] tracking-wider">Assigned Scope</th>
                                            <th className="text-right px-3.5 py-2 font-semibold text-muted-foreground uppercase text-[10px] sm:text-[11px] tracking-wider">Actions</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-border/40">
                                        {filteredUsers.map((u, idx) => {
                                            const color = avatarColors[idx % avatarColors.length]
                                            const initials = u.name
                                                ? u.name.split(" ").map(n => n[0]).join("").toUpperCase().slice(0, 2)
                                                : "U"
                                            const isCurrentUser = currentUser?.id === u._id

                                            return (
                                                <tr key={u._id} className="hover:bg-muted/30 transition-colors">
                                                    <td className="px-3.5 py-2">
                                                        <div className="flex items-center gap-3">
                                                            <div className={`size-7.5 rounded-full flex items-center justify-center text-white font-bold text-xs uppercase shadow-xs shrink-0 ${color}`}>
                                                                {initials}
                                                            </div>
                                                            <div>
                                                                <p className="font-semibold text-foreground text-sm flex items-center gap-2">
                                                                    {u.name}
                                                                    {isCurrentUser && (
                                                                        <span className="text-[10px] font-bold text-primary bg-primary/10 px-1.5 py-0.2 rounded">YOU</span>
                                                                    )}
                                                                </p>
                                                                <p className="text-xs font-mono text-muted-foreground uppercase">{u.user_id}</p>
                                                            </div>
                                                        </div>
                                                    </td>
                                                    <td className="px-3.5 py-2 text-xs font-medium text-muted-foreground">{u.email}</td>
                                                    <td className="px-3.5 py-2">
                                                        <div className="flex flex-col gap-1 items-start">
                                                            <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                                                                u.role === "Admin"
                                                                    ? "bg-rose-500/10 text-rose-600 dark:text-rose-400"
                                                                    : "bg-blue-500/10 text-blue-600 dark:text-blue-400"
                                                            }`}>
                                                                {u.role === "Admin" ? "Admin (Full Access)" : "Standard User"}
                                                            </span>
                                                            {u.canCreateUser && (
                                                                <span className="text-[10px] font-semibold text-purple-600 dark:text-purple-400 bg-purple-500/10 px-2 py-0.5 rounded-full">
                                                                    Can Create Subusers
                                                                </span>
                                                            )}
                                                        </div>
                                                    </td>
                                                    <td className="px-3.5 py-2">
                                                        {u.role === "Admin" ? (
                                                            <span className="text-xs font-semibold text-rose-500 bg-rose-500/10 px-2.5 py-1 rounded-lg inline-flex items-center gap-1.5">
                                                                <ShieldIcon className="size-3.5" />
                                                                All Pages (Admin)
                                                            </span>
                                                        ) : (
                                                            <div className="space-y-1">
                                                                <span className="text-xs font-semibold text-indigo-500 bg-indigo-500/10 px-2.5 py-1 rounded-lg inline-flex items-center gap-1.5">
                                                                    <LayoutDashboardIcon className="size-3.5" />
                                                                    {(u.allowedPages || u.pagePermissions || []).length} Pages Allowed
                                                                </span>
                                                                {(u.hasInspectionAccess || u.canInspect) && (
                                                                    <p className="text-[10px] text-emerald-600 dark:text-emerald-400 font-medium flex items-center gap-1">
                                                                        <ClipboardCheck className="size-3" />
                                                                        Inspection: Granted
                                                                    </p>
                                                                )}
                                                            </div>
                                                        )}
                                                    </td>
                                                    <td className="px-3.5 py-2">
                                                        {u.role === "Admin" ? (
                                                            <span className="text-xs font-semibold text-rose-500 bg-rose-500/10 px-2.5 py-1 rounded-lg inline-flex items-center gap-1.5">
                                                                <ShieldAlertIcon className="size-3.5" />
                                                                All Projects & Stores
                                                            </span>
                                                        ) : (
                                                            <div className="flex items-center gap-2">
                                                                <span className="text-xs font-semibold text-blue-600 dark:text-blue-400 bg-blue-500/10 px-2.5 py-1 rounded-lg inline-flex items-center gap-1.5">
                                                                    <FolderOpenIcon className="size-3.5" />
                                                                    {(u.projects || u.assignedProjects || []).length} Project{(u.projects || u.assignedProjects || []).length === 1 ? "" : "s"}
                                                                </span>
                                                                <span className="text-xs font-semibold text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 px-2.5 py-1 rounded-lg inline-flex items-center gap-1.5">
                                                                    <StoreIcon className="size-3.5" />
                                                                    {(u.stores || u.assignedStores || []).length} Store{(u.stores || u.assignedStores || []).length === 1 ? "" : "s"}
                                                                </span>
                                                            </div>
                                                        )}
                                                    </td>
                                                    <td className="px-3.5 py-2 text-right">
                                                        <div className="flex items-center justify-end gap-1.5">
                                                            <Button
                                                                variant="ghost"
                                                                size="sm"
                                                                onClick={() => {
                                                                    setEditingUser(u)
                                                                    setShowUserModal(true)
                                                                }}
                                                                className="h-8 px-2 text-xs font-semibold hover:bg-muted"
                                                                title="Edit Profile & Role"
                                                            >
                                                                <EditIcon className="size-3.5" />
                                                            </Button>
                                                            <Button
                                                                variant="ghost"
                                                                size="sm"
                                                                onClick={() => navigate(`/users/${u._id}/access`)}
                                                                className="h-8 px-2.5 text-xs font-semibold hover:bg-primary/10 hover:text-primary gap-1.5 cursor-pointer"
                                                                title="Manage Permissions & Scope"
                                                            >
                                                                <ShieldIcon className="size-3.5 text-primary" />
                                                                <span>Manage Access</span>
                                                            </Button>
                                                            {!isCurrentUser && (
                                                                <Button
                                                                    variant="ghost"
                                                                    size="sm"
                                                                    onClick={() => setDeletingUser({ id: u._id, name: u.name, isSubuser: false })}
                                                                    className="h-8 w-8 p-0 text-muted-foreground hover:bg-destructive/10 hover:text-destructive cursor-pointer"
                                                                    title="Delete User"
                                                                >
                                                                    <TrashIcon className="size-4" />
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
            </div>
            )}

            {/* TAB 2: Subusers */}
            {activeTab === "subusers" && (
                <div className="flex flex-col gap-3">
                    {/* Search bar before user details card */}
                    <div className="flex items-center justify-between gap-3">
                        <div className="relative w-full max-w-sm">
                            <SearchIcon className="absolute left-3 top-2.5 size-4 text-muted-foreground" />
                            <Input
                                placeholder="Search subusers by name, ID, email..."
                                className="pl-9 h-7.5 rounded-lg border-border/50 bg-background/50 focus-visible:ring-primary/30 text-xs"
                                value={subuserSearchTerm}
                                onChange={(e) => setSubuserSearchTerm(e.target.value)}
                            />
                        </div>
                    </div>

                    <Card className={`${bentoCardClass} flex flex-col`}>
                        <CardContent className="p-0">
                        {loadingSubusers ? (
                            <div className="flex items-center justify-center py-16">
                                <div className="flex flex-col items-center gap-4">
                                    <div className="size-8 animate-spin rounded-full border-[3px] border-emerald-500 border-t-transparent shadow-sm" />
                                    <p className="font-medium text-muted-foreground">Loading subusers...</p>
                                </div>
                            </div>
                        ) : filteredSubusers.length === 0 ? (
                            <div className="py-16 text-center text-muted-foreground">
                                <div className="flex flex-col items-center justify-center opacity-50">
                                    <UserCheck className="size-12 mb-4" />
                                    <p className="font-medium">No subusers registered.</p>
                                    <p className="text-xs mt-1">Click "Create Subuser" above to provision a scoped subuser account.</p>
                                </div>
                            </div>
                        ) : (
                            <div className="overflow-x-auto">
                                <table className="w-full text-sm">
                                    <thead>
                                        <tr className="border-b border-border/50 bg-muted/10">
                                            <th className="text-left px-3.5 py-2 font-semibold text-muted-foreground uppercase text-[10px] sm:text-[11px] tracking-wider">Subuser</th>
                                            <th className="text-left px-3.5 py-2 font-semibold text-muted-foreground uppercase text-[10px] sm:text-[11px] tracking-wider">Contact</th>
                                            {isAdmin && (
                                                <th className="text-left px-3.5 py-2 font-semibold text-muted-foreground uppercase text-[10px] sm:text-[11px] tracking-wider">Parent Account</th>
                                            )}
                                            <th className="text-left px-3.5 py-2 font-semibold text-muted-foreground uppercase text-[10px] sm:text-[11px] tracking-wider">Status & Expiry</th>
                                            <th className="text-left px-3.5 py-2 font-semibold text-muted-foreground uppercase text-[10px] sm:text-[11px] tracking-wider">Page Permissions</th>
                                            <th className="text-left px-3.5 py-2 font-semibold text-muted-foreground uppercase text-[10px] sm:text-[11px] tracking-wider">Assigned Scope</th>
                                            <th className="text-right px-3.5 py-2 font-semibold text-muted-foreground uppercase text-[10px] sm:text-[11px] tracking-wider">Actions</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-border/40">
                                        {filteredSubusers.map((sub, idx) => {
                                            const color = avatarColors[idx % avatarColors.length]
                                            const initials = sub.name
                                                ? sub.name.split(" ").map(n => n[0]).join("").toUpperCase().slice(0, 2)
                                                : "S"
                                            const parentName = sub.parent_id && typeof sub.parent_id === 'object'
                                                ? (sub.parent_id as any).name
                                                : "Admin / Direct"

                                            return (
                                                <tr key={sub._id} className="hover:bg-muted/30 transition-colors">
                                                    <td className="px-3.5 py-2">
                                                        <div className="flex items-center gap-3">
                                                            <div className={`size-7.5 rounded-full flex items-center justify-center text-white font-bold text-xs uppercase shadow-xs shrink-0 ${color}`}>
                                                                {initials}
                                                            </div>
                                                            <div>
                                                                <p className="font-semibold text-foreground text-sm">{sub.name}</p>
                                                                <p className="text-xs font-mono text-muted-foreground uppercase">{sub.user_id}</p>
                                                            </div>
                                                        </div>
                                                    </td>
                                                    <td className="px-3.5 py-2">
                                                        <p className="text-xs font-medium text-foreground">{sub.email}</p>
                                                        {sub.phone && <p className="text-xs text-muted-foreground mt-0.5">{sub.phone}</p>}
                                                    </td>
                                                    {isAdmin && (
                                                        <td className="px-3.5 py-2">
                                                            <span className="text-xs font-semibold text-purple-600 dark:text-purple-400 bg-purple-500/10 px-2 py-0.5 rounded-full inline-flex items-center gap-1">
                                                                {parentName}
                                                            </span>
                                                        </td>
                                                    )}
                                                    <td className="px-3.5 py-2">
                                                        <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                                                            sub.status === "Active"
                                                                ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400"
                                                                : "bg-rose-500/10 text-rose-600 dark:text-rose-400"
                                                        }`}>
                                                            {sub.status || "Active"}
                                                        </span>
                                                        {sub.expires_at && (
                                                            <p className="text-[10px] text-muted-foreground mt-0.5 flex items-center gap-1">
                                                                <Clock className="size-2.5" />
                                                                Exp: {new Date(sub.expires_at).toLocaleDateString()}
                                                            </p>
                                                        )}
                                                    </td>
                                                    <td className="px-3.5 py-2">
                                                        <div className="space-y-1">
                                                            <span className="text-xs font-semibold text-indigo-500 bg-indigo-500/10 px-2.5 py-1 rounded-lg inline-flex items-center gap-1.5">
                                                                <LayoutDashboardIcon className="size-3.5" />
                                                                {(sub.allowedPages || sub.pagePermissions || []).length} Pages Allowed
                                                            </span>
                                                            {(sub.hasInspectionAccess || sub.canInspect) && (
                                                                <p className="text-[10px] text-emerald-600 dark:text-emerald-400 font-medium flex items-center gap-1">
                                                                    <ClipboardCheck className="size-3" />
                                                                    Inspection: Granted
                                                                </p>
                                                            )}
                                                        </div>
                                                    </td>
                                                    <td className="px-3.5 py-2">
                                                        <div className="flex items-center gap-2">
                                                            <span className="text-xs font-semibold text-blue-600 dark:text-blue-400 bg-blue-500/10 px-2 py-0.5 rounded-lg inline-flex items-center gap-1">
                                                                <FolderOpenIcon className="size-3" />
                                                                {(sub.projects || sub.assignedProjects || []).length} Project{(sub.projects || sub.assignedProjects || []).length === 1 ? "" : "s"}
                                                            </span>
                                                            <span className="text-xs font-semibold text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-lg inline-flex items-center gap-1">
                                                                <StoreIcon className="size-3" />
                                                                {(sub.stores || sub.assignedStores || []).length} Store{(sub.stores || sub.assignedStores || []).length === 1 ? "" : "s"}
                                                            </span>
                                                            {sub.documents && sub.documents.length > 0 && (
                                                                <span className="text-xs font-semibold text-purple-600 dark:text-purple-400 bg-purple-500/10 px-2 py-0.5 rounded-lg inline-flex items-center gap-1" title={`${sub.documents.length} Document(s) attached`}>
                                                                    <FileText className="size-3" />
                                                                    {sub.documents.length} Doc{sub.documents.length === 1 ? "" : "s"}
                                                                </span>
                                                            )}
                                                        </div>
                                                    </td>
                                                    <td className="px-3.5 py-2 text-right">
                                                        <div className="flex items-center justify-end gap-1.5">
                                                            <Button
                                                                variant="ghost"
                                                                size="sm"
                                                                onClick={() => {
                                                                    setEditingSubuser(sub)
                                                                    setShowSubuserModal(true)
                                                                }}
                                                                className="h-8 px-2 text-xs font-semibold hover:bg-muted"
                                                                title="Edit Subuser Profile"
                                                            >
                                                                <EditIcon className="size-3.5" />
                                                            </Button>
                                                            <Button
                                                                variant="ghost"
                                                                size="sm"
                                                                onClick={() => navigate(`/users/${sub._id}/access`)}
                                                                className="h-8 px-2.5 text-xs font-semibold hover:bg-primary/10 hover:text-primary gap-1.5 cursor-pointer"
                                                                title="Manage Permissions & Access"
                                                            >
                                                                <ShieldIcon className="size-3.5 text-primary" />
                                                                <span>Manage Access</span>
                                                            </Button>
                                                            <Button
                                                                variant="ghost"
                                                                size="sm"
                                                                onClick={() => setDeletingUser({ id: sub._id, name: sub.name, isSubuser: true })}
                                                                className="h-8 w-8 p-0 text-muted-foreground hover:bg-destructive/10 hover:text-destructive cursor-pointer"
                                                                title="Delete Subuser"
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
            </div>
            )}

            {/* TAB 3: Guest Users */}
            {activeTab === "guests" && (
                <div className="flex flex-col gap-3">
                    {/* Controls & Search bar before user details card */}
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                        <div className="relative w-full max-w-sm">
                            <SearchIcon className="absolute left-3 top-2.5 size-4 text-muted-foreground" />
                            <Input
                                placeholder="Search guest users by name, phone, email..."
                                className="pl-9 h-7.5 rounded-lg border-border/50 bg-background/50 focus-visible:ring-primary/30 text-xs"
                                value={guestSearchTerm}
                                onChange={(e) => setGuestSearchTerm(e.target.value)}
                            />
                        </div>

                        <div className="flex flex-wrap items-center gap-2.5">
                            {/* Status Filter Pills */}
                            <div className="inline-flex rounded-xl border border-border/50 bg-background/50 p-1 text-xs">
                                {["All", "Active", "Expiring Soon", "Expired", "Disabled"].map((st) => (
                                    <button
                                        key={st}
                                        type="button"
                                        onClick={() => setGuestStatusFilter(st)}
                                        className={`px-3 py-1 rounded-lg font-semibold transition-all cursor-pointer ${
                                            guestStatusFilter === st
                                                ? "bg-primary text-primary-foreground shadow-xs"
                                                : "text-muted-foreground hover:text-foreground"
                                        }`}
                                    >
                                        {st}
                                    </button>
                                ))}
                            </div>
                        </div>
                    </div>

                    <Card className={`${bentoCardClass} flex flex-col`}>
                        <CardContent className="p-0">
                        {loadingGuests ? (
                            <div className="flex items-center justify-center py-16">
                                <div className="flex flex-col items-center gap-4">
                                    <div className="size-8 animate-spin rounded-full border-[3px] border-indigo-500 border-t-transparent shadow-sm" />
                                    <p className="font-medium text-muted-foreground">Loading guest users...</p>
                                </div>
                            </div>
                        ) : filteredGuests.length === 0 ? (
                            <div className="py-16 text-center text-muted-foreground">
                                <div className="flex flex-col items-center justify-center opacity-50">
                                    <ClockIcon className="size-12 mb-4 text-indigo-500" />
                                    <p className="font-medium">No guest users found.</p>
                                    <p className="text-xs mt-1">
                                        {guestSearchTerm || guestStatusFilter !== "All"
                                            ? "Try adjusting your search criteria or status filter."
                                            : "Click 'Create Guest User' to provision a 15-day guest inspection account."}
                                    </p>
                                </div>
                            </div>
                        ) : (
                            <div className="overflow-x-auto">
                                <table className="w-full text-sm">
                                    <thead>
                                        <tr className="border-b border-border/50 bg-muted/10">
                                            <th className="text-left px-3.5 py-2 font-semibold text-muted-foreground uppercase text-[10px] sm:text-[11px] tracking-wider">Guest User</th>
                                            <th className="text-left px-3.5 py-2 font-semibold text-muted-foreground uppercase text-[10px] sm:text-[11px] tracking-wider">Contact</th>
                                            <th className="text-left px-3.5 py-2 font-semibold text-muted-foreground uppercase text-[10px] sm:text-[11px] tracking-wider">Organization & Purpose</th>
                                            <th className="text-left px-3.5 py-2 font-semibold text-muted-foreground uppercase text-[10px] sm:text-[11px] tracking-wider">Created By</th>
                                            <th className="text-left px-3.5 py-2 font-semibold text-muted-foreground uppercase text-[10px] sm:text-[11px] tracking-wider">Access Validity</th>
                                            <th className="text-right px-3.5 py-2 font-semibold text-muted-foreground uppercase text-[10px] sm:text-[11px] tracking-wider">Actions</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-border/40">
                                        {filteredGuests.map((guest, idx) => {
                                            const isExpSoon = guest.isExpiringSoon || (guest.status === "Active" && guest.daysRemaining !== undefined && guest.daysRemaining <= 2 && guest.daysRemaining > 0)
                                            const isExp = guest.status === "Expired" || guest.isExpired
                                            const color = avatarColors[idx % avatarColors.length]
                                            const initial = guest.name ? guest.name.charAt(0).toUpperCase() : "G"

                                            return (
                                                <tr key={guest._id} className="hover:bg-muted/30 transition-colors">
                                                    {/* User column */}
                                                    <td className="px-3.5 py-2">
                                                        <div className="flex items-center gap-3">
                                                            <div className={`size-7.5 rounded-full flex items-center justify-center text-white font-bold text-xs uppercase shadow-xs shrink-0 ${color}`}>
                                                                {initial}
                                                            </div>
                                                            <div>
                                                                <p className="font-semibold text-foreground text-sm flex items-center gap-2">
                                                                    {guest.name}
                                                                    {isExpSoon && (
                                                                        <span className="size-2 rounded-full bg-amber-500 animate-ping inline-block" />
                                                                    )}
                                                                </p>
                                                                <span className="inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full mt-0.5 bg-indigo-500/10 text-indigo-600 dark:text-indigo-400">
                                                                    <Clock className="size-2.5" />
                                                                    GUEST ACCESS
                                                                </span>
                                                            </div>
                                                        </div>
                                                    </td>

                                                    {/* Contact */}
                                                    <td className="px-3.5 py-2">
                                                        <div className="space-y-0.5">
                                                            <div className="flex items-center gap-1.5 group/phone">
                                                                <p className="text-xs font-mono font-medium text-foreground flex items-center gap-1.5">
                                                                    <PhoneIcon className="size-3 text-muted-foreground" />
                                                                    +91 {guest.phone}
                                                                </p>
                                                                <button
                                                                    type="button"
                                                                    title="Copy 10-digit mobile number"
                                                                    onClick={() => {
                                                                        navigator.clipboard.writeText(guest.phone);
                                                                        toast.success(`Copied mobile number: ${guest.phone}`);
                                                                    }}
                                                                    className="opacity-0 group-hover/phone:opacity-100 p-1 hover:bg-muted rounded text-muted-foreground hover:text-foreground transition-all cursor-pointer"
                                                                >
                                                                    <Copy className="size-3" />
                                                                </button>
                                                            </div>
                                                            {guest.email && (
                                                                <p className="text-[11px] text-muted-foreground truncate max-w-[180px]">
                                                                    {guest.email}
                                                                </p>
                                                            )}
                                                        </div>
                                                    </td>

                                                    {/* Organization & Purpose */}
                                                    <td className="px-3.5 py-2">
                                                        <div className="space-y-0.5">
                                                            <p className="text-xs font-medium text-foreground flex items-center gap-1.5">
                                                                <BuildingIcon className="size-3 text-muted-foreground" />
                                                                {guest.organization || "Independent Inspector"}
                                                            </p>
                                                            <p className="text-[11px] text-muted-foreground truncate max-w-[200px]">
                                                                {guest.purpose || "QR inspection & tool tracking"}
                                                            </p>
                                                        </div>
                                                    </td>

                                                    {/* Created By */}
                                                    <td className="px-3.5 py-2">
                                                        <div className="space-y-0.5">
                                                            <p className="text-xs font-medium text-foreground">
                                                                {guest.createdBy?.name || "Administrator"}
                                                            </p>
                                                            <div className="flex items-center gap-1.5">
                                                                <span className="text-[10px] uppercase font-bold px-1.5 py-0.2 rounded bg-muted text-muted-foreground">
                                                                    {guest.createdBy?.role || "Admin"}
                                                                </span>
                                                                <span className="text-[11px] text-muted-foreground">
                                                                    {new Date(guest.createdAt).toLocaleDateString("en-IN", { day: '2-digit', month: 'short' })}
                                                                </span>
                                                            </div>
                                                        </div>
                                                    </td>

                                                    {/* Access Validity */}
                                                    <td className="px-3.5 py-2">
                                                        {isExp ? (
                                                            <div className="space-y-0.5">
                                                                <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-rose-500/10 text-rose-600 dark:text-rose-400">
                                                                    <XCircleIcon className="size-3" />
                                                                    Expired
                                                                </span>
                                                                <p className="text-[10px] text-muted-foreground font-mono pt-0.5">
                                                                    Exp: {formatDate(guest.expiresAt)}
                                                                </p>
                                                            </div>
                                                        ) : isExpSoon ? (
                                                            <div className="space-y-0.5">
                                                                <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-amber-500/10 text-amber-600 dark:text-amber-400 animate-pulse">
                                                                    <ClockIcon className="size-3" />
                                                                    Expiring Soon
                                                                </span>
                                                                <p className="text-[10px] font-semibold text-amber-600 dark:text-amber-400">
                                                                    {guest.daysRemaining === 0 ? `Expires in ${guest.hoursRemaining || 1} hrs` : `${guest.daysRemaining} day(s) left`}
                                                                </p>
                                                                <p className="text-[10px] text-muted-foreground font-mono pt-0.5">
                                                                    Exp: {formatDate(guest.expiresAt)}
                                                                </p>
                                                            </div>
                                                        ) : guest.status === "Disabled" ? (
                                                            <div className="space-y-0.5">
                                                                <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-slate-500/10 text-slate-600 dark:text-slate-400">
                                                                    Disabled
                                                                </span>
                                                                <p className="text-[10px] text-muted-foreground font-mono pt-0.5">
                                                                    Exp: {formatDate(guest.expiresAt)}
                                                                </p>
                                                            </div>
                                                        ) : (
                                                            <div className="space-y-0.5">
                                                                <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
                                                                    <CheckCircle2Icon className="size-3" />
                                                                    Active
                                                                </span>
                                                                <p className="text-[10px] text-muted-foreground">
                                                                    {guest.daysRemaining || 15} days remaining
                                                                </p>
                                                                <p className="text-[10px] text-muted-foreground font-mono pt-0.5">
                                                                    Exp: {formatDate(guest.expiresAt)}
                                                                </p>
                                                            </div>
                                                        )}
                                                    </td>

                                                    {/* Actions */}
                                                    <td className="px-3.5 py-2 text-right">
                                                        <div className="flex items-center justify-end gap-1.5">
                                                            {/* Extend access button */}
                                                            <Button
                                                                variant="outline"
                                                                size="sm"
                                                                onClick={() => handleOpenExtendGuest(guest)}
                                                                className="h-8 px-2.5 text-xs font-semibold border-indigo-500/30 text-indigo-600 dark:text-indigo-400 hover:bg-indigo-500/10 gap-1.5 cursor-pointer shadow-xs"
                                                                title="Extend Guest Access Window"
                                                            >
                                                                <ClockIcon className="size-3.5" />
                                                                <span>Extend</span>
                                                            </Button>

                                                            {/* Edit button */}
                                                            <Button
                                                                variant="ghost"
                                                                size="sm"
                                                                onClick={() => handleOpenEditGuest(guest)}
                                                                className="h-8 px-2 text-xs font-semibold hover:bg-muted cursor-pointer"
                                                                title="Edit Guest Details"
                                                            >
                                                                <EditIcon className="size-3.5 text-muted-foreground" />
                                                            </Button>

                                                            {/* Reject / Expire button if Active */}
                                                            {guest.status === "Active" && (
                                                                <Button
                                                                    variant="ghost"
                                                                    size="sm"
                                                                    onClick={() => handleOpenRejectGuest(guest)}
                                                                    className="h-8 w-8 p-0 text-amber-600 hover:bg-amber-500/10 cursor-pointer"
                                                                    title="Expire / Revoke Access Now"
                                                                >
                                                                    <XCircleIcon className="size-4" />
                                                                </Button>
                                                            )}

                                                            {/* History button if extended before */}
                                                            {guest.extensionHistory && guest.extensionHistory.length > 0 && (
                                                                <Button
                                                                    variant="ghost"
                                                                    size="sm"
                                                                    onClick={() => {
                                                                        setSelectedGuest(guest)
                                                                        setHistoryGuestModalOpen(true)
                                                                    }}
                                                                    className="h-8 w-8 p-0 text-muted-foreground hover:bg-muted cursor-pointer"
                                                                    title="View Extension History"
                                                                >
                                                                    <Clock className="size-3.5" />
                                                                </Button>
                                                            )}

                                                            {/* Delete button */}
                                                            <Button
                                                                variant="ghost"
                                                                size="sm"
                                                                onClick={() => setDeletingGuest(guest)}
                                                                className="h-8 w-8 p-0 text-muted-foreground hover:bg-destructive/10 hover:text-destructive cursor-pointer"
                                                                title="Delete Guest Account"
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
            </div>
            )}

            {/* Modals */}
            <UserFormModal
                isOpen={showUserModal}
                onClose={() => {
                    setShowUserModal(false)
                    setEditingUser(null)
                }}
                editingUser={editingUser}
                onSuccess={() => {
                    fetchUsers()
                }}
            />

            <SubuserFormModal
                isOpen={showSubuserModal}
                onClose={() => {
                    setShowSubuserModal(false)
                    setEditingSubuser(null)
                }}
                editingSubuser={editingSubuser}
                onSuccess={() => {
                    fetchSubusers()
                }}
            />

            <ConfirmDialog
                isOpen={!!deletingUser}
                onClose={() => setDeletingUser(null)}
                onConfirm={handleDeleteConfirm}
                title={deletingUser?.isSubuser ? "Delete Subuser Account" : "Delete Internal User"}
                description={`Are you sure you want to delete "${deletingUser?.name || "this user"}"? This will revoke their platform access.`}
                confirmText="Delete Account"
            />

            {/* 1. CREATE GUEST USER DIALOG */}
            <Dialog open={createGuestModalOpen} onOpenChange={setCreateGuestModalOpen}>
                <DialogContent className="max-w-md max-h-[90vh] flex flex-col p-0 rounded-xl overflow-hidden">
                    <DialogHeader className="px-5 py-3 border-b border-border/60 bg-muted/20 shrink-0">
                        <div className="flex items-center gap-2.5">
                            <div className="p-2 rounded-lg bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 shrink-0">
                                <Clock className="size-4.5" />
                            </div>
                            <div>
                                <DialogTitle className="text-sm sm:text-base font-bold text-foreground">
                                    Create Guest User
                                </DialogTitle>
                                <DialogDescription className="text-[11px] text-muted-foreground mt-0.5 leading-relaxed">
                                    Register an external guest with automatic 15-day lookup access.
                                </DialogDescription>
                            </div>
                        </div>
                    </DialogHeader>

                    <form onSubmit={handleCreateGuestSubmit} className="flex-1 flex flex-col min-h-0 overflow-hidden">
                        <div className="flex-1 overflow-y-auto p-4 sm:p-5 space-y-3.5">
                            {/* Dynamic Guest Fields (Standard + Custom, fully synced with Forms Management) */}
                            <DynamicGuestFields
                                fields={displayGuestFields}
                                values={createGuestForm as any}
                                onChange={(fieldKey, value) => {
                                    setCreateGuestForm(prev => ({
                                        ...prev,
                                        [fieldKey]: value,
                                        customFields: {
                                            ...prev.customFields,
                                            [fieldKey]: value
                                        }
                                    }))
                                    if (createGuestErrors[fieldKey]) {
                                        setCreateGuestErrors(prev => ({ ...prev, [fieldKey]: undefined }))
                                    }
                                }}
                                errors={createGuestErrors}
                            />

                            {/* 15-day notice */}
                            <div className="p-2.5 sm:p-3 bg-indigo-50/60 dark:bg-indigo-950/20 border border-indigo-200/60 dark:border-indigo-800/40 rounded-lg flex items-start gap-2">
                                <InfoIcon className="size-3.5 text-indigo-600 dark:text-indigo-400 shrink-0 mt-0.5" />
                                <div className="text-[11px] text-indigo-950 dark:text-indigo-200 leading-relaxed">
                                    <span className="font-bold">15-Day Access:</span> Account expires automatically in 15 days. On the 14th day, creators will receive an alert to extend or expire access.
                                </div>
                            </div>
                        </div>

                        <div className="px-5 py-3 border-t border-border/60 bg-muted/30 shrink-0 flex items-center justify-end gap-2.5">
                            <Button
                                type="button"
                                variant="outline"
                                onClick={() => setCreateGuestModalOpen(false)}
                                className="h-8 rounded-lg px-4 text-xs font-semibold cursor-pointer"
                            >
                                Cancel
                            </Button>
                            <Button
                                type="submit"
                                disabled={actionSubmitting}
                                className="h-8 rounded-lg px-4.5 text-xs font-semibold bg-indigo-600 hover:bg-indigo-700 text-white gap-1.5 cursor-pointer shadow-2xs"
                            >
                                {actionSubmitting ? (
                                    <>
                                        <Clock className="size-3.5 animate-spin" />
                                        <span>Creating...</span>
                                    </>
                                ) : (
                                    <>
                                        <PlusIcon className="size-3.5" />
                                        <span>Create Guest User</span>
                                    </>
                                )}
                            </Button>
                        </div>
                    </form>
                </DialogContent>
            </Dialog>

            {/* 2. EDIT GUEST USER DIALOG */}
            <Dialog open={editGuestModalOpen} onOpenChange={setEditGuestModalOpen}>
                <DialogContent className="max-w-md max-h-[90vh] flex flex-col p-0 rounded-xl overflow-hidden shadow-2xl">
                    <DialogHeader className="px-5 py-3 border-b border-border/60 bg-muted/20 shrink-0">
                        <div className="flex items-center gap-2.5">
                            <div className="p-2 rounded-lg bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 shrink-0">
                                <EditIcon className="size-4.5" />
                            </div>
                            <div>
                                <DialogTitle className="text-sm sm:text-base font-bold text-foreground">
                                    Edit Guest User Details
                                </DialogTitle>
                                <DialogDescription className="text-[11px] text-muted-foreground mt-0.5">
                                    Update contact details, organization, or status for this guest account.
                                </DialogDescription>
                            </div>
                        </div>
                    </DialogHeader>

                    <form onSubmit={handleEditGuestSubmit} className="flex-1 flex flex-col min-h-0 overflow-hidden">
                        <div className="flex-1 overflow-y-auto p-4 sm:p-5 space-y-3.5">
                            {/* Dynamic Guest Fields (Standard + Custom, fully synced with Forms Management) */}
                            <DynamicGuestFields
                                fields={displayGuestFields}
                                values={editGuestForm as any}
                                onChange={(fieldKey, value) => {
                                    setEditGuestForm(prev => ({
                                        ...prev,
                                        [fieldKey]: value,
                                        customFields: {
                                            ...prev.customFields,
                                            [fieldKey]: value
                                        }
                                    }))
                                    if (editGuestErrors[fieldKey]) {
                                        setEditGuestErrors(prev => ({ ...prev, [fieldKey]: undefined }))
                                    }
                                }}
                                errors={editGuestErrors}
                            />

                            {/* Expiry Date */}
                            <div className="space-y-1">
                                <div className="flex items-center justify-between mb-1">
                                    <label className="text-[11px] font-semibold text-foreground/90 block">
                                        Access Expiry Date
                                    </label>
                                    {selectedGuest?.expiresAt && (
                                        <span className="text-[10px] text-muted-foreground font-mono">
                                            Current: {formatDate(selectedGuest.expiresAt)}
                                        </span>
                                    )}
                                </div>
                                <Popover open={editCalendarOpen} onOpenChange={setEditCalendarOpen}>
                                    <PopoverTrigger asChild>
                                        <button
                                            type="button"
                                            onClick={() => setEditCalendarOpen((prev) => !prev)}
                                            className="w-full flex items-center justify-between rounded-lg h-7.5 sm:h-8 px-2.5 text-xs bg-background border border-input font-medium hover:bg-muted/30 focus:ring-2 focus:ring-indigo-500/30 shadow-2xs outline-none transition-all cursor-pointer text-left font-mono"
                                        >
                                            <div className="flex items-center gap-2">
                                                <CalendarIcon className="size-3.5 text-indigo-600 dark:text-indigo-400 shrink-0" />
                                                <span>
                                                    {editGuestForm.expiresAt ? formatDate(editGuestForm.expiresAt) : "Pick date"}
                                                </span>
                                            </div>
                                            <span className="text-[10px] text-muted-foreground font-sans">Change</span>
                                        </button>
                                    </PopoverTrigger>
                                    <PopoverContent className="w-auto p-0 border border-border/80 shadow-2xl rounded-xl overflow-hidden bg-background" align="start">
                                        <Calendar
                                            selected={editGuestForm.expiresAt}
                                            minDate={toInputDateFormat(new Date())}
                                            onSelect={(_d, dateStr) => {
                                                setEditGuestForm(prev => ({ ...prev, expiresAt: dateStr }))
                                                setEditCalendarOpen(false)
                                            }}
                                        />
                                    </PopoverContent>
                                </Popover>
                            </div>

                            {/* Status */}
                            <div className="space-y-1">
                                <label className="text-[11px] font-semibold text-foreground/90 block mb-1">
                                    Account Status
                                </label>
                                <select
                                    value={editGuestForm.status || "Active"}
                                    onChange={(e) => setEditGuestForm(prev => ({ ...prev, status: e.target.value as any }))}
                                    className="w-full h-7.5 sm:h-8 px-2.5 rounded-lg border border-input bg-background text-xs font-medium focus:ring-2 focus:ring-indigo-500/30 outline-none transition-all"
                                >
                                    <option value="Active">Active (Permit Access)</option>
                                    <option value="Expired">Expired (Access Blocked)</option>
                                    <option value="Disabled">Disabled (Suspended)</option>
                                </select>
                            </div>
                        </div>

                        <div className="px-5 py-3 border-t border-border/60 bg-muted/30 shrink-0 flex items-center justify-end gap-2.5">
                            <Button
                                type="button"
                                variant="outline"
                                onClick={() => setEditGuestModalOpen(false)}
                                className="h-8 rounded-lg px-4 text-xs font-semibold hover:bg-muted/60 cursor-pointer"
                            >
                                Cancel
                            </Button>
                            <Button
                                type="submit"
                                disabled={actionSubmitting}
                                className="h-8 rounded-lg px-4.5 text-xs font-semibold bg-indigo-600 hover:bg-indigo-700 text-white gap-1.5 cursor-pointer shadow-2xs"
                            >
                                {actionSubmitting ? (
                                    <>
                                        <Clock className="size-3.5 animate-spin" />
                                        <span>Saving...</span>
                                    </>
                                ) : (
                                    <span>Save Changes</span>
                                )}
                            </Button>
                        </div>
                    </form>
                </DialogContent>
            </Dialog>

            {/* 3. EXTEND GUEST ACCESS DIALOG */}
            <Dialog open={extendGuestModalOpen} onOpenChange={setExtendGuestModalOpen}>
                <DialogContent className="max-w-md max-h-[90vh] flex flex-col p-0 rounded-xl overflow-hidden shadow-2xl">
                    <DialogHeader className="px-5 py-3 border-b border-border/60 bg-muted/20 shrink-0">
                        <div className="flex items-center gap-2.5">
                            <div className="p-2 rounded-lg bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 shrink-0">
                                <ClockIcon className="size-4.5" />
                            </div>
                            <div>
                                <DialogTitle className="text-sm sm:text-base font-bold text-foreground">
                                    Confirm Access Extension
                                </DialogTitle>
                                <DialogDescription className="text-[11px] text-muted-foreground mt-0.5">
                                    Select or enter the new expiry date for <strong>{selectedGuest?.name}</strong> (+91 {selectedGuest?.phone}). Current expiry: {formatDate(selectedGuest?.expiresAt)}.
                                </DialogDescription>
                            </div>
                        </div>
                    </DialogHeader>

                    <div className="flex-1 overflow-y-auto p-4 sm:p-5 space-y-3.5">
                        {/* Shadcn Date Picker (Popover + Calendar) */}
                        <div className="space-y-1.5">
                            <div className="flex items-center gap-1.5 text-[11px] font-semibold text-foreground/90">
                                <CalendarIcon className="size-3.5 text-emerald-600 dark:text-emerald-400" />
                                <span>Extension Expiry Date *</span>
                            </div>

                            <Popover open={calendarOpen} onOpenChange={setCalendarOpen}>
                                <PopoverTrigger asChild>
                                    <button
                                        type="button"
                                        onClick={() => setCalendarOpen((prev) => !prev)}
                                        className="w-full flex items-center justify-between rounded-lg h-7.5 sm:h-8 px-2.5 text-xs bg-background border border-input font-medium hover:bg-muted/30 focus:ring-2 focus:ring-emerald-500/30 shadow-2xs outline-none transition-all cursor-pointer text-left"
                                    >
                                        <div className="flex items-center gap-2">
                                            <CalendarIcon className="size-3.5 text-emerald-600 dark:text-emerald-400 shrink-0" />
                                            <span className="font-mono text-xs">
                                                {customExtendExpiryDate ? formatDate(customExtendExpiryDate) : "Pick an expiry date"}
                                            </span>
                                        </div>
                                        <span className="text-[10px] font-semibold text-emerald-700 dark:text-emerald-400 px-1.5 py-0.5 rounded-md bg-emerald-500/10">
                                            {calendarOpen ? "Close" : "Pick Date"}
                                        </span>
                                    </button>
                                </PopoverTrigger>
                                <PopoverContent className="w-auto p-0 border border-border/80 shadow-2xl rounded-xl overflow-hidden bg-background" align="start">
                                    <Calendar
                                        selected={customExtendExpiryDate}
                                        minDate={toInputDateFormat(new Date())}
                                        onSelect={(_d, dateStr) => {
                                            setCustomExtendExpiryDate(dateStr)
                                            if (selectedGuest) {
                                                const base = selectedGuest.expiresAt && new Date(selectedGuest.expiresAt) > new Date()
                                                    ? new Date(selectedGuest.expiresAt).getTime()
                                                    : Date.now()
                                                const match = EXTENSION_OPTIONS.find(opt => {
                                                    const target = new Date(base + opt.days * 24 * 60 * 60 * 1000)
                                                    return toInputDateFormat(target) === dateStr
                                                })
                                                setSelectedDuration(match ? match.key : "custom")
                                            } else {
                                                setSelectedDuration("custom")
                                            }
                                            setCalendarOpen(false)
                                        }}
                                    />
                                </PopoverContent>
                            </Popover>

                            {/* Quick selector pills (all 5 buttons in one row with compact size) */}
                            <div className="grid grid-cols-5 gap-1.5 pt-1">
                                {EXTENSION_OPTIONS.map((opt) => {
                                    const isSelected = selectedDuration === opt.key || (
                                        selectedGuest && customExtendExpiryDate ? (() => {
                                            const base = selectedGuest.expiresAt && new Date(selectedGuest.expiresAt) > new Date()
                                                ? new Date(selectedGuest.expiresAt).getTime()
                                                : Date.now()
                                            const target = new Date(base + opt.days * 24 * 60 * 60 * 1000)
                                            return toInputDateFormat(target) === customExtendExpiryDate
                                        })() : false
                                    )
                                    return (
                                        <button
                                            key={opt.key}
                                            type="button"
                                            onClick={() => handleSelectPill(opt.key, opt.days)}
                                            className={`py-1 px-1 text-[11px] rounded-lg border transition-all cursor-pointer font-medium text-center whitespace-nowrap ${
                                                isSelected
                                                    ? "bg-emerald-600 text-white border-emerald-600 shadow-2xs font-semibold ring-2 ring-emerald-500/30"
                                                    : "bg-muted/40 hover:bg-muted text-muted-foreground border-border hover:text-foreground"
                                            }`}
                                        >
                                            {opt.label}
                                        </button>
                                    )
                                })}
                            </div>
                        </div>

                        {/* Starting Date & Expiry Date preview box */}
                        {selectedGuest && (
                            <div className="p-2.5 rounded-lg bg-muted/30 border border-border/60 text-[11px] space-y-1.5">
                                <div className="flex justify-between">
                                    <span className="text-muted-foreground">Starting Date:</span>
                                    <span className="font-mono font-medium">
                                        {formatDate((selectedGuest as any).startDate || selectedGuest.createdAt)}
                                    </span>
                                </div>
                                <div className="flex justify-between text-emerald-700 dark:text-emerald-400 font-semibold">
                                    <span>Expiry Date:</span>
                                    <span className="font-mono">
                                        {customExtendExpiryDate ? formatDate(customExtendExpiryDate) : formatDate(selectedGuest.expiresAt)}
                                    </span>
                                </div>
                            </div>
                        )}
                    </div>

                    <div className="px-5 py-3 border-t border-border/60 bg-muted/30 shrink-0 flex items-center justify-end gap-2.5">
                        <Button
                            type="button"
                            variant="outline"
                            onClick={() => setExtendGuestModalOpen(false)}
                            disabled={actionSubmitting}
                            className="h-8 rounded-lg px-4 text-xs font-semibold hover:bg-muted/60 cursor-pointer"
                        >
                            Cancel
                        </Button>
                        <Button
                            type="button"
                            onClick={handleExtendGuestSubmit}
                            disabled={actionSubmitting || !customExtendExpiryDate}
                            className="h-8 rounded-lg px-4.5 text-xs font-semibold bg-emerald-600 hover:bg-emerald-700 text-white gap-1.5 cursor-pointer shadow-2xs"
                        >
                            {actionSubmitting ? (
                                <>
                                    <Clock className="size-3.5 animate-spin" />
                                    <span>Updating Expiry...</span>
                                </>
                            ) : (
                                <>
                                    <CheckCircle2Icon className="size-3.5" />
                                    <span>Confirm Extension</span>
                                </>
                            )}
                        </Button>
                    </div>
                </DialogContent>
            </Dialog>

            {/* 4. REJECT / EXPIRE GUEST DIALOG */}
            <Dialog open={rejectGuestModalOpen} onOpenChange={setRejectGuestModalOpen}>
                <DialogContent className="max-w-md p-0 rounded-xl overflow-hidden shadow-2xl">
                    <DialogHeader className="px-5 py-3 border-b border-border/60 bg-rose-500/10 shrink-0">
                        <div className="flex items-center gap-2.5">
                            <div className="p-2 rounded-lg bg-rose-500/15 text-rose-600 dark:text-rose-400 shrink-0">
                                <XCircleIcon className="size-4.5" />
                            </div>
                            <div>
                                <DialogTitle className="text-sm sm:text-base font-bold text-rose-700 dark:text-rose-400">
                                    Expire Guest Access Immediately
                                </DialogTitle>
                                <DialogDescription className="text-[11px] text-muted-foreground mt-0.5">
                                    Revoke access for <strong>{selectedGuest?.name}</strong>. Their session will immediately be invalidated.
                                </DialogDescription>
                            </div>
                        </div>
                    </DialogHeader>

                    <div className="p-4 sm:p-5 space-y-3.5">
                        <div className="space-y-1">
                            <label className="text-[11px] font-semibold text-foreground/90 block mb-1">
                                Reason for Revocation / Rejection
                            </label>
                            <Input
                                value={rejectReason}
                                onChange={(e) => setRejectReason(e.target.value)}
                                placeholder="e.g. Audit completed, Contractor inspection concluded"
                                className="rounded-lg h-7.5 sm:h-8 text-xs px-2.5"
                            />
                        </div>
                    </div>

                    <div className="px-5 py-3 border-t border-border/60 bg-muted/30 shrink-0 flex items-center justify-end gap-2.5">
                        <Button
                            type="button"
                            variant="outline"
                            onClick={() => setRejectGuestModalOpen(false)}
                            className="h-8 rounded-lg px-4 text-xs font-semibold hover:bg-muted/60 cursor-pointer"
                        >
                            Cancel
                        </Button>
                        <Button
                            variant="destructive"
                            onClick={handleRejectGuestSubmit}
                            disabled={actionSubmitting}
                            className="h-8 rounded-lg px-4.5 text-xs font-semibold bg-rose-600 hover:bg-rose-700 text-white gap-1.5 cursor-pointer shadow-2xs"
                        >
                            {actionSubmitting ? "Revoking..." : "Revoke Access Now"}
                        </Button>
                    </div>
                </DialogContent>
            </Dialog>

            {/* 5. EXTENSION HISTORY DIALOG */}
            <Dialog open={historyGuestModalOpen} onOpenChange={setHistoryGuestModalOpen}>
                <DialogContent className="max-w-lg p-0 rounded-xl overflow-hidden shadow-2xl">
                    <DialogHeader className="px-5 py-3 border-b border-border/60 bg-muted/20 shrink-0">
                        <div className="flex items-center gap-2.5">
                            <div className="p-2 rounded-lg bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 shrink-0">
                                <Clock className="size-4.5" />
                            </div>
                            <div>
                                <DialogTitle className="text-sm sm:text-base font-bold text-foreground">
                                    Extension History — {selectedGuest?.name}
                                </DialogTitle>
                                <DialogDescription className="text-[11px] text-muted-foreground mt-0.5">
                                    Log of previous access extensions granted to this guest user.
                                </DialogDescription>
                            </div>
                        </div>
                    </DialogHeader>

                    <div className="p-4 sm:p-5 max-h-[350px] overflow-y-auto space-y-2">
                        {selectedGuest?.extensionHistory && selectedGuest.extensionHistory.length > 0 ? (
                            selectedGuest.extensionHistory.map((item, idx) => (
                                <div key={idx} className="p-2.5 rounded-lg border border-border/60 bg-muted/20 text-xs space-y-1">
                                    <div className="flex items-center justify-between font-bold text-foreground">
                                        <span className="flex items-center gap-1.5 text-indigo-600 dark:text-indigo-400 text-xs">
                                            <CheckCircle2Icon className="size-3.5" />
                                            +{item.durationLabel || `${item.durationDays} days`}
                                        </span>
                                        <span className="text-muted-foreground font-normal text-[10px]">
                                            {new Date(item.extendedAt).toLocaleString("en-IN", {
                                                day: "2-digit",
                                                month: "short",
                                                year: "numeric",
                                                hour: "2-digit",
                                                minute: "2-digit"
                                            })}
                                        </span>
                                    </div>
                                    <div className="text-[11px] text-muted-foreground flex items-center justify-between">
                                        <span>Granted by: <strong className="text-foreground">{item.extendedBy?.name || "Administrator"}</strong></span>
                                        <span className="font-mono">New Expiry: {new Date(item.newExpiresAt).toLocaleDateString("en-IN")}</span>
                                    </div>
                                </div>
                            ))
                        ) : (
                            <p className="text-center py-6 text-xs text-muted-foreground">
                                No previous extensions recorded.
                            </p>
                        )}
                    </div>

                    <div className="px-5 py-3 border-t border-border/60 bg-muted/30 shrink-0 flex items-center justify-end">
                        <Button
                            variant="outline"
                            onClick={() => setHistoryGuestModalOpen(false)}
                            className="h-8 rounded-lg px-4 text-xs font-semibold hover:bg-muted/60 cursor-pointer"
                        >
                            Close
                        </Button>
                    </div>
                </DialogContent>
            </Dialog>

            {/* 6. CONFIRM DELETE GUEST DIALOG */}
            <ConfirmDialog
                isOpen={!!deletingGuest}
                onClose={() => setDeletingGuest(null)}
                onConfirm={handleDeleteGuestConfirm}
                title="Delete Guest User Account"
                description={`Are you sure you want to permanently delete guest account "${deletingGuest?.name}"? Their access will immediately cease.`}
                confirmText="Delete Guest Account"
            />
        </div>
    )
}

export default UsersPage
