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
    UsersIcon,
    SearchIcon,
    ShieldIcon,
    ShieldAlertIcon,
    EditIcon,
    TrashIcon,
    FolderOpenIcon,
    StoreIcon,
    LayoutDashboardIcon,
    Building2,
    ClipboardCheck,
    Check,
    X,
    Clock,
    UserPlus,
    UserCheck,
    Laptop,
    KeyRound
} from "lucide-react"
import { useAuth } from "@/contexts/AuthContext"
import { useNavigate } from "react-router-dom"
import { UserFormModal } from "./UserFormModal"
import { SubuserFormModal } from "./SubuserFormModal"
import userService, { type UserRecord, type PendingLoginRequestItem } from "@/services/user.service"
import { toast } from "sonner"
import NoAccessPage from "../NoAccessPage"
import { ConfirmDialog } from "@/components/ConfirmDialog"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog"

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

export function UsersPage() {
    const navigate = useNavigate()
    const { user: currentUser } = useAuth()

    const isAdmin = currentUser?.role === "Admin"
    const canManageSubusers = Boolean(isAdmin || currentUser?.canCreateUser)

    // Tab state: "internal" | "subusers" | "approvals"
    const [activeTab, setActiveTab] = React.useState<"internal" | "subusers" | "approvals">(
        isAdmin ? "internal" : "subusers"
    )

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

    // Login Requests State
    const [pendingRequests, setPendingRequests] = React.useState<PendingLoginRequestItem[]>([])
    const [loadingRequests, setLoadingRequests] = React.useState(false)
    const [actionId, setActionId] = React.useState<string | null>(null)

    // Deletion and Rejection dialogs
    const [deletingUser, setDeletingUser] = React.useState<{ id: string; name: string; isSubuser?: boolean } | null>(null)
    const [rejectDialog, setRejectDialog] = React.useState<{ id: string; name: string } | null>(null)
    const [rejectReason, setRejectReason] = React.useState("Access not authorized at this time")

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

    // Fetch Pending Login Requests
    const fetchPendingRequests = React.useCallback(async () => {
        if (!canManageSubusers) return
        try {
            const resData = await userService.getPendingLoginRequests()
            if (resData.success) {
                setPendingRequests(resData.data || [])
            }
        } catch (err) {
            console.error("Error fetching pending requests:", err)
        } finally {
            setLoadingRequests(false)
        }
    }, [canManageSubusers])

    // Initial Load & Realtime SSE
    React.useEffect(() => {
        if (isAdmin) fetchUsers()
        if (canManageSubusers) {
            fetchSubusers()
            fetchPendingRequests()
        }

        // Realtime EventSource listener
        const eventSource = new EventSource("/api/users/events")

        eventSource.onmessage = (event) => {
            try {
                const parsed = JSON.parse(event.data)
                if (parsed.event === "new_login_request") {
                    const reqParentId = parsed.data?.parent_id
                    const currentId = currentUser ? String(currentUser.id || currentUser._id || "") : ""
                    if (isAdmin || (reqParentId && reqParentId === currentId)) {
                        toast.info(`New login request from ${parsed.data?.user_name || "Subuser"}`)
                        fetchPendingRequests()
                    }
                } else if (
                    parsed.event === "login_approved" ||
                    parsed.event === "login_rejected" ||
                    parsed.event === "login_expired"
                ) {
                    fetchPendingRequests()
                }
            } catch (e) {
                console.error("SSE parse error", e)
            }
        }

        const pollTimer = setInterval(() => {
            if (canManageSubusers) fetchPendingRequests()
        }, 8000)

        return () => {
            eventSource.close()
            clearInterval(pollTimer)
        }
    }, [isAdmin, canManageSubusers, currentUser, fetchUsers, fetchSubusers, fetchPendingRequests])

    // Approval Handlers
    const handleApprove = async (id: string, name: string) => {
        setActionId(id)
        try {
            const res = await userService.approveLoginRequest(id)
            if (res.success) {
                toast.success(`Approved login request for ${name}`)
                setPendingRequests(prev => prev.filter(r => r.id !== id))
            } else {
                toast.error(res.message || "Failed to approve login request")
            }
        } catch (err: any) {
            toast.error(err?.response?.data?.message || "Error approving login request")
        } finally {
            setActionId(null)
        }
    }

    const handleRejectConfirm = async () => {
        if (!rejectDialog) return
        const { id, name } = rejectDialog
        setActionId(id)
        try {
            const res = await userService.rejectLoginRequest(id, rejectReason)
            if (res.success) {
                toast.success(`Rejected login request for ${name}`)
                setPendingRequests(prev => prev.filter(r => r.id !== id))
                setRejectDialog(null)
            } else {
                toast.error(res.message || "Failed to reject login request")
            }
        } catch (err: any) {
            toast.error(err?.response?.data?.message || "Error rejecting login request")
        } finally {
            setActionId(null)
        }
    }

    // Delete Handlers
    const handleDeleteConfirm = async () => {
        if (!deletingUser) return
        try {
            if (deletingUser.isSubuser) {
                const res = await userService.deleteSubuser(deletingUser.id)
                if (res.success) {
                    toast.success("Subuser deleted successfully.")
                    fetchSubusers()
                } else {
                    toast.error(res.message || "Failed to delete subuser.")
                }
            } else {
                const res = await userService.deleteUser(deletingUser.id)
                if (res.success) {
                    toast.success("User deleted successfully.")
                    fetchUsers()
                } else {
                    toast.error(res.message || "Failed to delete user.")
                }
            }
        } catch (err: any) {
            toast.error(err?.response?.data?.message || "Error deleting user.")
        } finally {
            setDeletingUser(null)
        }
    }

    // Toggle Inspection access for a user or subuser
    const handleToggleInspection = async (targetUser: UserRecord, isSubuser: boolean) => {
        if (targetUser.role === "Admin") return
        // If parent user, verify parent has inspection access before toggling
        if (!isAdmin && !currentUser?.hasInspectionAccess) {
            toast.error("You do not have inspection access and cannot grant it to subusers.")
            return
        }

        try {
            const nextVal = !targetUser.hasInspectionAccess
            const updateFn = isSubuser
                ? userService.updateSubuser(targetUser._id, { hasInspectionAccess: nextVal })
                : userService.updateUser(targetUser._id, { hasInspectionAccess: nextVal })
            
            const res = await updateFn
            if (res.success) {
                toast.success(`Inspection access ${nextVal ? "granted to" : "revoked from"} ${targetUser.name}`)
                if (isSubuser) fetchSubusers()
                else fetchUsers()
            }
        } catch (err: any) {
            toast.error("Failed to update inspection access")
        }
    }

    if (!canManageSubusers) {
        return <NoAccessPage />
    }

    const filteredUsers = users.filter((u) => {
        const term = userSearchTerm.toLowerCase()
        return (
            u.name.toLowerCase().includes(term) ||
            u.email.toLowerCase().includes(term) ||
            u.user_id.toLowerCase().includes(term) ||
            (u.phonenumber || "").toLowerCase().includes(term)
        )
    })

    const filteredSubusers = subusers.filter((u) => {
        const term = subuserSearchTerm.toLowerCase()
        const parentName = typeof u.parentUser === "object" ? (u.parentUser as any)?.name || "" : ""
        return (
            u.name.toLowerCase().includes(term) ||
            u.email.toLowerCase().includes(term) ||
            u.user_id.toLowerCase().includes(term) ||
            parentName.toLowerCase().includes(term) ||
            (u.phonenumber || "").toLowerCase().includes(term)
        )
    })

    const bentoCardClass = "rounded-[24px] border border-border/50 bg-card/40 backdrop-blur-md shadow-sm hover:shadow-lg transition-all duration-300 overflow-hidden"

    return (
        <div className="flex flex-col gap-6 w-full mx-auto p-2 pb-10">
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pt-2">
                <div>
                    <h1 className="text-3xl font-extrabold tracking-tight">
                        {isAdmin ? "User & Subuser Management" : "My Subusers"}
                    </h1>
                    <p className="text-muted-foreground mt-1 text-sm">
                        {isAdmin
                            ? "Manage internal team members, oversee created subusers, configure permissions, and approve logins."
                            : "Create and manage your delegated subusers, control their page-level permissions, and approve login requests."}
                    </p>
                </div>

                <div className="flex flex-wrap items-center gap-3">
                    {isAdmin && (
                        <Button
                            variant="outline"
                            className="gap-2 rounded-xl shadow-xs border-primary/30 hover:bg-primary/10 text-primary font-semibold cursor-pointer h-10 px-4"
                            onClick={() => navigate("/profiles")}
                        >
                            <Building2 className="size-4" />
                            Business Profiles
                        </Button>
                    )}

                    {canManageSubusers && (
                        <Button
                            variant="outline"
                            className="gap-2 rounded-xl shadow-xs border-emerald-500/30 text-emerald-600 dark:text-emerald-400 hover:bg-emerald-500/10 font-semibold cursor-pointer h-10 px-4"
                            onClick={() => {
                                setEditingSubuser(null)
                                setShowSubuserModal(true)
                            }}
                        >
                            <UserPlus className="size-4" />
                            Create Subuser
                        </Button>
                    )}

                    {isAdmin && (
                        <Button
                            className="gap-2 rounded-xl shadow-md bg-primary hover:bg-primary/90 text-primary-foreground font-semibold cursor-pointer h-10 px-5"
                            onClick={() => {
                                setEditingUser(null)
                                setShowUserModal(true)
                            }}
                        >
                            <PlusIcon className="size-4" />
                            Create User / Admin
                        </Button>
                    )}
                </div>
            </div>

            {/* Navigation Tabs */}
            <div className="flex items-center gap-2 border-b border-border/50 pb-3">
                {isAdmin && (
                    <button
                        type="button"
                        onClick={() => setActiveTab("internal")}
                        className={`inline-flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                            activeTab === "internal"
                                ? "bg-primary text-primary-foreground shadow-sm"
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
                    className={`inline-flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                        activeTab === "subusers"
                            ? "bg-primary text-primary-foreground shadow-sm"
                            : "text-muted-foreground hover:bg-muted hover:text-foreground"
                    }`}
                >
                    <UserCheck className="size-3.5" />
                    {isAdmin ? "All Subusers" : "My Subusers"} ({subusers.length})
                </button>

                <button
                    type="button"
                    onClick={() => setActiveTab("approvals")}
                    className={`inline-flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                        activeTab === "approvals"
                            ? "bg-primary text-primary-foreground shadow-sm"
                            : "text-muted-foreground hover:bg-muted hover:text-foreground"
                    }`}
                >
                    <KeyRound className="size-3.5" />
                    Pending Login Approvals
                    {pendingRequests.length > 0 && (
                        <span className="inline-flex items-center justify-center size-5 text-[10px] font-extrabold rounded-full bg-amber-500 text-white animate-pulse">
                            {pendingRequests.length}
                        </span>
                    )}
                </button>
            </div>

            {/* TAB 1: Internal Users (Admin only) */}
            {isAdmin && activeTab === "internal" && (
                <Card className={`${bentoCardClass} flex flex-col`}>
                    <CardHeader className="flex flex-row items-center gap-4 border-b border-border/50 bg-muted/20 px-6 py-5">
                        <div className="flex-1">
                            <CardTitle className="flex items-center gap-2 text-lg font-bold">
                                <UsersIcon className="size-5 text-primary" />
                                Internal Team Users ({users.length})
                            </CardTitle>
                            <CardDescription className="mt-1">
                                <span className="flex items-center gap-1.5 text-xs">
                                    <ShieldIcon className="size-3.5 text-primary/70" />
                                    Configure authentication credentials, subuser creation privileges, and RBAC permissions.
                                </span>
                            </CardDescription>
                        </div>
                        <div className="relative w-64">
                            <SearchIcon className="absolute left-3 top-2.5 size-4 text-muted-foreground" />
                            <Input
                                placeholder="Search users by name, email, ID..."
                                className="pl-9 h-9 rounded-xl border-border/50 bg-background/50 focus-visible:ring-primary/30"
                                value={userSearchTerm}
                                onChange={(e) => setUserSearchTerm(e.target.value)}
                            />
                        </div>
                    </CardHeader>
                    <CardContent className="p-0">
                        {error && (
                            <div className="mx-6 my-4 rounded-xl bg-destructive/10 border border-destructive/20 p-4 text-sm font-medium text-destructive flex items-center gap-2">
                                <ShieldAlertIcon className="size-4" />
                                {error}
                            </div>
                        )}

                        {loadingUsers ? (
                            <div className="flex items-center justify-center py-16">
                                <div className="flex flex-col items-center gap-4">
                                    <div className="size-8 animate-spin rounded-full border-[3px] border-primary border-t-transparent shadow-sm" />
                                    <p className="font-medium text-muted-foreground">Loading internal members...</p>
                                </div>
                            </div>
                        ) : filteredUsers.length === 0 ? (
                            <div className="py-16 text-center text-muted-foreground">
                                <div className="flex flex-col items-center justify-center opacity-50">
                                    <UsersIcon className="size-12 mb-4" />
                                    <p className="font-medium">No internal users found.</p>
                                </div>
                            </div>
                        ) : (
                            <div className="overflow-x-auto">
                                <table className="w-full text-sm">
                                    <thead>
                                        <tr className="border-b border-border/50 bg-muted/10">
                                            <th className="text-left px-6 py-4 font-semibold text-muted-foreground uppercase text-[11px] tracking-wider">User</th>
                                            <th className="text-left px-6 py-4 font-semibold text-muted-foreground uppercase text-[11px] tracking-wider">Email</th>
                                            <th className="text-left px-6 py-4 font-semibold text-muted-foreground uppercase text-[11px] tracking-wider">Privileges</th>
                                            <th className="text-left px-6 py-4 font-semibold text-muted-foreground uppercase text-[11px] tracking-wider">Page Permissions</th>
                                            <th className="text-left px-6 py-4 font-semibold text-muted-foreground uppercase text-[11px] tracking-wider">Assigned Scope</th>
                                            <th className="text-right px-6 py-4 font-semibold text-muted-foreground uppercase text-[11px] tracking-wider">Actions</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {filteredUsers.map((u, i) => {
                                            const initials = u.name.split(" ").map(n => n[0]).join("").substring(0, 2).toUpperCase()
                                            const projCount = (u.projects || []).length
                                            const storeCount = (u.stores || []).length
                                            const isUserAdmin = u.role === "Admin"
                                            const pageCount = (u.allowedPages || []).length

                                            return (
                                                <tr
                                                    key={u._id}
                                                    className="border-b border-border/40 last:border-0 hover:bg-muted/40 transition-colors group"
                                                >
                                                    <td className="px-6 py-4">
                                                        <div className="flex items-center gap-4">
                                                            <div
                                                                className={`flex size-10 shrink-0 items-center justify-center rounded-xl text-sm font-bold text-white shadow-sm ${avatarColors[i % avatarColors.length]}`}
                                                            >
                                                                {initials}
                                                            </div>
                                                            <div>
                                                                <p className="font-semibold leading-none text-foreground/90 group-hover:text-primary transition-colors">{u.name}</p>
                                                                <p className="text-xs font-mono text-muted-foreground mt-1.5">{u.user_id}</p>
                                                            </div>
                                                        </div>
                                                    </td>
                                                    <td className="px-6 py-4 font-medium text-muted-foreground">{u.email}</td>
                                                    <td className="px-6 py-4">
                                                        <div className="flex flex-col gap-1 items-start">
                                                            {isUserAdmin ? (
                                                                <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-rose-600 dark:text-rose-400 bg-rose-500/10 px-2.5 py-0.5 rounded-md border border-rose-500/20">
                                                                    Admin (Full Access)
                                                                </span>
                                                            ) : (
                                                                <span className="inline-flex items-center gap-1 text-[11px] font-medium text-foreground bg-muted/80 px-2.5 py-0.5 rounded-md">
                                                                    Standard User
                                                                </span>
                                                            )}
                                                            {u.canCreateUser && (
                                                                <span className="inline-flex items-center gap-1 text-[10px] font-bold text-indigo-600 dark:text-indigo-400 bg-indigo-500/10 px-2 py-0.5 rounded-md border border-indigo-500/20">
                                                                    Can Create Subusers
                                                                </span>
                                                            )}
                                                        </div>
                                                    </td>
                                                    <td className="px-6 py-4">
                                                        <div className="flex flex-col gap-1.5 items-start">
                                                            {isUserAdmin ? (
                                                                <span className="inline-flex items-center gap-1 text-xs font-semibold text-rose-600 dark:text-rose-400 bg-rose-500/10 px-2.5 py-1 rounded-lg border border-rose-500/20">
                                                                    <ShieldAlertIcon className="size-3.5" />
                                                                    All Pages (Admin)
                                                                </span>
                                                            ) : (
                                                                <span className="inline-flex items-center gap-1 text-xs font-medium bg-primary/10 text-primary px-2.5 py-1 rounded-lg">
                                                                    <LayoutDashboardIcon className="size-3" />
                                                                    {pageCount} {pageCount === 1 ? "Page" : "Pages"} Allowed
                                                                </span>
                                                            )}
                                                            <button
                                                                type="button"
                                                                disabled={isUserAdmin}
                                                                onClick={() => handleToggleInspection(u, false)}
                                                                title={isUserAdmin ? "Admins automatically have inspection access" : "Click to toggle inspection access"}
                                                                className={`inline-flex items-center gap-1 text-[11px] font-semibold px-2 py-0.5 rounded-md border transition-all ${
                                                                    isUserAdmin ? "cursor-default" : "cursor-pointer"
                                                                } ${
                                                                    isUserAdmin || u.hasInspectionAccess
                                                                        ? "text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 border-emerald-500/20 hover:bg-emerald-500/20"
                                                                        : "text-muted-foreground bg-muted/60 border-border/50 hover:bg-muted hover:text-foreground"
                                                                }`}
                                                            >
                                                                <ClipboardCheck className="size-3" />
                                                                {isUserAdmin ? "Inspection: Granted" : u.hasInspectionAccess ? "Inspection: Granted" : "No Inspection (Grant)"}
                                                            </button>
                                                        </div>
                                                    </td>
                                                    <td className="px-6 py-4">
                                                        {isUserAdmin ? (
                                                            <span className="inline-flex items-center gap-1 text-xs font-semibold text-rose-600 dark:text-rose-400 bg-rose-500/10 px-2.5 py-1 rounded-lg border border-rose-500/20">
                                                                <ShieldAlertIcon className="size-3.5" />
                                                                All Projects & Stores
                                                            </span>
                                                        ) : (
                                                            <div className="flex items-center gap-2">
                                                                <span className="inline-flex items-center gap-1 text-xs font-medium bg-primary/10 text-primary px-2 py-1 rounded-lg">
                                                                    <FolderOpenIcon className="size-3" />
                                                                    {projCount} {projCount === 1 ? "Project" : "Projects"}
                                                                </span>
                                                                <span className="inline-flex items-center gap-1 text-xs font-medium bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 px-2 py-1 rounded-lg">
                                                                    <StoreIcon className="size-3" />
                                                                    {storeCount} {storeCount === 1 ? "Store" : "Stores"}
                                                                </span>
                                                            </div>
                                                        )}
                                                    </td>
                                                    <td className="px-6 py-4 text-right">
                                                        <div className="flex items-center justify-end gap-1.5">
                                                            <Button
                                                                variant="ghost"
                                                                size="sm"
                                                                onClick={() => {
                                                                    setEditingUser(u)
                                                                    setShowUserModal(true)
                                                                }}
                                                                className="h-8 px-2 text-xs font-semibold hover:bg-muted"
                                                                title="Edit Profile"
                                                            >
                                                                <EditIcon className="size-3.5" />
                                                            </Button>
                                                            <Button
                                                                variant="ghost"
                                                                size="sm"
                                                                onClick={() => navigate(`/users/${u._id}/access`)}
                                                                className="h-8 px-2.5 text-xs font-semibold hover:bg-primary/10 hover:text-primary gap-1.5 cursor-pointer"
                                                                title="Manage Access & Permissions"
                                                            >
                                                                <ShieldIcon className="size-3.5 text-primary" />
                                                                <span>Manage Access</span>
                                                            </Button>
                                                            <Button
                                                                variant="ghost"
                                                                size="sm"
                                                                onClick={() => setDeletingUser({ id: u._id, name: u.name, isSubuser: false })}
                                                                className="h-8 w-8 p-0 text-muted-foreground hover:bg-destructive/10 hover:text-destructive cursor-pointer"
                                                                title="Delete User"
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
            )}

            {/* TAB 2: Subusers (Both Admin and Parent Users) */}
            {activeTab === "subusers" && (
                <Card className={`${bentoCardClass} flex flex-col`}>
                    <CardHeader className="flex flex-row items-center gap-4 border-b border-border/50 bg-muted/20 px-6 py-5">
                        <div className="flex-1">
                            <CardTitle className="flex items-center gap-2 text-lg font-bold">
                                <UserCheck className="size-5 text-emerald-600" />
                                {isAdmin ? "All Subusers & Delegated Accounts" : "My Subusers List"} ({subusers.length})
                            </CardTitle>
                            <CardDescription className="mt-1">
                                <span className="flex items-center gap-1.5 text-xs">
                                    <ShieldIcon className="size-3.5 text-primary/70" />
                                    Subuser permissions are strictly clamped to their parent user's authorized pages and scopes.
                                </span>
                            </CardDescription>
                        </div>
                        <div className="relative w-64">
                            <SearchIcon className="absolute left-3 top-2.5 size-4 text-muted-foreground" />
                            <Input
                                placeholder="Search subusers by name, ID..."
                                className="pl-9 h-9 rounded-xl border-border/50 bg-background/50 focus-visible:ring-primary/30"
                                value={subuserSearchTerm}
                                onChange={(e) => setSubuserSearchTerm(e.target.value)}
                            />
                        </div>
                    </CardHeader>
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
                                    <p className="font-medium">No subusers found.</p>
                                    <p className="text-xs mt-1">Click "Create Subuser" to create your first delegated account.</p>
                                </div>
                            </div>
                        ) : (
                            <div className="overflow-x-auto">
                                <table className="w-full text-sm">
                                    <thead>
                                        <tr className="border-b border-border/50 bg-muted/10">
                                            <th className="text-left px-6 py-4 font-semibold text-muted-foreground uppercase text-[11px] tracking-wider">Subuser</th>
                                            <th className="text-left px-6 py-4 font-semibold text-muted-foreground uppercase text-[11px] tracking-wider">Contact</th>
                                            {isAdmin && (
                                                <th className="text-left px-6 py-4 font-semibold text-muted-foreground uppercase text-[11px] tracking-wider">Parent Account</th>
                                            )}
                                            <th className="text-left px-6 py-4 font-semibold text-muted-foreground uppercase text-[11px] tracking-wider">Page Permissions</th>
                                            <th className="text-left px-6 py-4 font-semibold text-muted-foreground uppercase text-[11px] tracking-wider">Inspection Access</th>
                                            <th className="text-left px-6 py-4 font-semibold text-muted-foreground uppercase text-[11px] tracking-wider">Scope</th>
                                            <th className="text-right px-6 py-4 font-semibold text-muted-foreground uppercase text-[11px] tracking-wider">Actions</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {filteredSubusers.map((sub, i) => {
                                            const initials = sub.name.split(" ").map(n => n[0]).join("").substring(0, 2).toUpperCase()
                                            const projCount = (sub.projects || []).length
                                            const storeCount = (sub.stores || []).length
                                            const pageCount = (sub.allowedPages || []).length
                                            const parentObj = typeof sub.parentUser === "object" ? (sub.parentUser as any) : null

                                            return (
                                                <tr
                                                    key={sub._id}
                                                    className="border-b border-border/40 last:border-0 hover:bg-muted/40 transition-colors group"
                                                >
                                                    <td className="px-6 py-4">
                                                        <div className="flex items-center gap-4">
                                                            <div
                                                                className={`flex size-10 shrink-0 items-center justify-center rounded-xl text-sm font-bold text-white shadow-sm ${avatarColors[(i + 3) % avatarColors.length]}`}
                                                            >
                                                                {initials}
                                                            </div>
                                                            <div>
                                                                <p className="font-semibold leading-none text-foreground/90 group-hover:text-primary transition-colors">{sub.name}</p>
                                                                <div className="flex items-center gap-1.5 mt-1.5">
                                                                    <span className="text-xs font-mono text-muted-foreground">{sub.user_id}</span>
                                                                    <span className="text-[10px] font-bold px-1.5 py-0.2 rounded bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
                                                                        Subuser
                                                                    </span>
                                                                </div>
                                                            </div>
                                                        </div>
                                                    </td>
                                                    <td className="px-6 py-4">
                                                        <p className="font-medium text-foreground text-xs">{sub.email}</p>
                                                        <p className="text-muted-foreground text-xs mt-0.5">{sub.phonenumber || "—"}</p>
                                                    </td>
                                                    {isAdmin && (
                                                        <td className="px-6 py-4">
                                                            {parentObj ? (
                                                                <div>
                                                                    <p className="text-xs font-semibold text-foreground">{parentObj.name}</p>
                                                                    <p className="text-[11px] text-muted-foreground">{parentObj.email}</p>
                                                                </div>
                                                            ) : (
                                                                <span className="text-xs text-muted-foreground italic">Admin / Direct</span>
                                                            )}
                                                        </td>
                                                    )}
                                                    <td className="px-6 py-4">
                                                        <span className="inline-flex items-center gap-1 text-xs font-medium bg-primary/10 text-primary px-2.5 py-1 rounded-lg">
                                                            <LayoutDashboardIcon className="size-3" />
                                                            {pageCount} {pageCount === 1 ? "Page" : "Pages"} Allowed
                                                        </span>
                                                    </td>
                                                    <td className="px-6 py-4">
                                                        <button
                                                            type="button"
                                                            onClick={() => handleToggleInspection(sub, true)}
                                                            title="Click to toggle inspection access"
                                                            className={`inline-flex items-center gap-1 text-[11px] font-semibold px-2 py-0.5 rounded-md border transition-all cursor-pointer ${
                                                                sub.hasInspectionAccess
                                                                    ? "text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 border-emerald-500/20 hover:bg-emerald-500/20"
                                                                    : "text-muted-foreground bg-muted/60 border-border/50 hover:bg-muted hover:text-foreground"
                                                            }`}
                                                        >
                                                            <ClipboardCheck className="size-3" />
                                                            {sub.hasInspectionAccess ? "Inspection: Granted" : "Revoked (Click to Grant)"}
                                                        </button>
                                                    </td>
                                                    <td className="px-6 py-4">
                                                        <div className="flex items-center gap-2">
                                                            <span className="inline-flex items-center gap-1 text-xs font-medium bg-primary/10 text-primary px-2 py-1 rounded-lg">
                                                                <FolderOpenIcon className="size-3" />
                                                                {projCount} {projCount === 1 ? "Project" : "Projects"}
                                                            </span>
                                                            <span className="inline-flex items-center gap-1 text-xs font-medium bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 px-2 py-1 rounded-lg">
                                                                <StoreIcon className="size-3" />
                                                                {storeCount} {storeCount === 1 ? "Store" : "Stores"}
                                                            </span>
                                                        </div>
                                                    </td>
                                                    <td className="px-6 py-4 text-right">
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
            )}

            {/* TAB 3: Login Approvals */}
            {activeTab === "approvals" && (
                <Card className={`${bentoCardClass} flex flex-col`}>
                    <CardHeader className="flex flex-row items-center gap-4 border-b border-border/50 bg-muted/20 px-6 py-5">
                        <div className="flex-1">
                            <CardTitle className="flex items-center gap-2 text-lg font-bold">
                                <KeyRound className="size-5 text-amber-500" />
                                Pending Login Approvals ({pendingRequests.length})
                            </CardTitle>
                            <CardDescription className="mt-1">
                                <span className="flex items-center gap-1.5 text-xs">
                                    <Clock className="size-3.5 text-amber-500" />
                                    Subusers cannot access the application until approved by their parent user (or Admin). Requests expire in 10 minutes.
                                </span>
                            </CardDescription>
                        </div>
                        <Button
                            variant="outline"
                            size="sm"
                            onClick={fetchPendingRequests}
                            disabled={loadingRequests}
                            className="rounded-xl text-xs gap-1.5 cursor-pointer"
                        >
                            <Clock className={`size-3.5 ${loadingRequests ? "animate-spin" : ""}`} />
                            Refresh
                        </Button>
                    </CardHeader>
                    <CardContent className="p-0">
                        {loadingRequests ? (
                            <div className="flex items-center justify-center py-16">
                                <div className="flex flex-col items-center gap-4">
                                    <div className="size-8 animate-spin rounded-full border-[3px] border-amber-500 border-t-transparent shadow-sm" />
                                    <p className="font-medium text-muted-foreground">Checking pending login requests...</p>
                                </div>
                            </div>
                        ) : pendingRequests.length === 0 ? (
                            <div className="py-16 text-center text-muted-foreground">
                                <div className="flex flex-col items-center justify-center opacity-50">
                                    <KeyRound className="size-12 mb-4" />
                                    <p className="font-medium">No pending login requests.</p>
                                    <p className="text-xs mt-1">When a subuser enters their credentials, their authorization request will appear here.</p>
                                </div>
                            </div>
                        ) : (
                            <div className="overflow-x-auto">
                                <table className="w-full text-sm">
                                    <thead>
                                        <tr className="border-b border-border/50 bg-muted/10">
                                            <th className="text-left px-6 py-4 font-semibold text-muted-foreground uppercase text-[11px] tracking-wider">Subuser</th>
                                            <th className="text-left px-6 py-4 font-semibold text-muted-foreground uppercase text-[11px] tracking-wider">Email</th>
                                            {isAdmin && (
                                                <th className="text-left px-6 py-4 font-semibold text-muted-foreground uppercase text-[11px] tracking-wider">Parent Account</th>
                                            )}
                                            <th className="text-left px-6 py-4 font-semibold text-muted-foreground uppercase text-[11px] tracking-wider">Device & IP</th>
                                            <th className="text-left px-6 py-4 font-semibold text-muted-foreground uppercase text-[11px] tracking-wider">Requested At</th>
                                            <th className="text-right px-6 py-4 font-semibold text-muted-foreground uppercase text-[11px] tracking-wider">Authorization Actions</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {pendingRequests.map((req) => (
                                            <tr
                                                key={req.id}
                                                className="border-b border-border/40 last:border-0 hover:bg-muted/40 transition-colors"
                                            >
                                                <td className="px-6 py-4">
                                                    <p className="font-semibold text-foreground text-sm">{req.user_name}</p>
                                                    <span className="text-[10px] font-bold text-amber-600 dark:text-amber-400 bg-amber-500/10 px-2 py-0.5 rounded">
                                                        PENDING APPROVAL
                                                    </span>
                                                </td>
                                                <td className="px-6 py-4 text-xs font-medium text-muted-foreground">{req.user_email}</td>
                                                {isAdmin && (
                                                    <td className="px-6 py-4 text-xs font-medium text-foreground">
                                                        {req.parent_name || "Admin / Direct"}
                                                    </td>
                                                )}
                                                <td className="px-6 py-4 text-xs text-muted-foreground">
                                                    <div className="flex items-center gap-1.5">
                                                        <Laptop className="size-3.5 text-primary" />
                                                        <span>{req.ip_address || "Local Session"}</span>
                                                    </div>
                                                </td>
                                                <td className="px-6 py-4 text-xs font-mono text-muted-foreground">
                                                    {new Date(req.requested_at).toLocaleTimeString("en-IN", {
                                                        hour: "2-digit",
                                                        minute: "2-digit",
                                                        second: "2-digit"
                                                    })}
                                                </td>
                                                <td className="px-6 py-4 text-right">
                                                    <div className="flex items-center justify-end gap-2">
                                                        <Button
                                                            size="sm"
                                                            disabled={actionId === req.id}
                                                            onClick={() => handleApprove(req.id, req.user_name)}
                                                            className="h-8 px-3 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-xs gap-1.5 cursor-pointer shadow-xs"
                                                        >
                                                            <Check className="size-3.5" />
                                                            {actionId === req.id ? "Approving..." : "Approve Login"}
                                                        </Button>
                                                        <Button
                                                            size="sm"
                                                            variant="outline"
                                                            disabled={actionId === req.id}
                                                            onClick={() => setRejectDialog({ id: req.id, name: req.user_name })}
                                                            className="h-8 px-3 rounded-lg border-destructive/40 text-destructive hover:bg-destructive/10 font-semibold text-xs gap-1.5 cursor-pointer"
                                                        >
                                                            <X className="size-3.5" />
                                                            Reject
                                                        </Button>
                                                    </div>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        )}
                    </CardContent>
                </Card>
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

            {/* Rejection Reason Modal */}
            <Dialog open={!!rejectDialog} onOpenChange={(open) => !open && setRejectDialog(null)}>
                <DialogContent className="max-w-md rounded-2xl">
                    <DialogHeader>
                        <DialogTitle className="text-lg font-bold text-destructive flex items-center gap-2">
                            <X className="size-5" />
                            Reject Subuser Login Request
                        </DialogTitle>
                        <DialogDescription className="text-xs">
                            Specify the reason for denying login access to <strong>{rejectDialog?.name}</strong>.
                        </DialogDescription>
                    </DialogHeader>
                    <div className="py-2">
                        <label className="text-xs font-semibold text-muted-foreground mb-1.5 block">
                            Rejection Reason
                        </label>
                        <Input
                            value={rejectReason}
                            onChange={(e) => setRejectReason(e.target.value)}
                            placeholder="e.g., Unscheduled login, Suspicious IP address, Shift ended"
                            className="rounded-xl h-10 text-xs"
                        />
                    </div>
                    <DialogFooter className="gap-2 sm:gap-0">
                        <Button
                            variant="outline"
                            onClick={() => setRejectDialog(null)}
                            className="rounded-xl text-xs cursor-pointer"
                        >
                            Cancel
                        </Button>
                        <Button
                            variant="destructive"
                            onClick={handleRejectConfirm}
                            disabled={actionId === rejectDialog?.id}
                            className="rounded-xl text-xs font-semibold cursor-pointer gap-1.5"
                        >
                            <X className="size-3.5" />
                            Confirm Rejection
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    )
}

export default UsersPage
