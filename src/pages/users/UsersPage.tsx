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
    Building2
} from "lucide-react"
import { useAuth } from "@/contexts/AuthContext"
import { useNavigate } from "react-router-dom"
import { UserFormModal } from "./UserFormModal"
import userService, { type UserRecord } from "@/services/user.service"
import { toast } from "sonner"
import NoAccessPage from "../NoAccessPage"
import { ConfirmDialog } from "@/components/ConfirmDialog"

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
    
    // Internal Users State
    const [users, setUsers] = React.useState<UserRecord[]>([])
    const [userSearchTerm, setUserSearchTerm] = React.useState("")
    const [showUserModal, setShowUserModal] = React.useState(false)
    const [editingUser, setEditingUser] = React.useState<UserRecord | null>(null)
    const [deletingUser, setDeletingUser] = React.useState<{ id: string; name: string } | null>(null)

    const [loading, setLoading] = React.useState(true)
    const [error, setError] = React.useState<string | null>(null)

    const isRestricted = Boolean(
        currentUser &&
        currentUser.role !== "Admin" &&
        (!currentUser.allowedPages || !currentUser.allowedPages.includes("/users"))
    )

    const fetchUsers = React.useCallback(async () => {
        if (isRestricted) {
            setLoading(false)
            return
        }
        setLoading(true)
        setError(null)
        try {
            const resData = await userService.getUsers()
            if (resData.success) {
                // Filter out any leftover role: Vendor items if present so users list remains strictly internal members
                const internalOnly = (resData.data || []).filter((u: any) => u.role !== 'Vendor')
                setUsers(internalOnly)
            }
        } catch (err: any) {
            console.error("Error fetching users:", err)
            const message = err?.response?.data?.message || err.message || "Something went wrong loading internal users"
            setError(message)
        } finally {
            setLoading(false)
        }
    }, [isRestricted])

    React.useEffect(() => {
        fetchUsers()
    }, [fetchUsers])

    const handleDeleteUser = async (id: string) => {
        try {
            const res = await userService.deleteUser(id)
            if (res.success) {
                toast.success("User deleted successfully.")
                fetchUsers()
            } else {
                toast.error(res.message || "Failed to delete user.")
            }
        } catch (err: any) {
            toast.error(err?.response?.data?.message || "Error deleting user.")
        }
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

    const bentoCardClass = "rounded-[24px] border border-border/50 bg-card/40 backdrop-blur-md shadow-sm hover:shadow-lg transition-all duration-300 overflow-hidden"

    if (isRestricted) {
        return <NoAccessPage />
    }

    return (
        <div className="flex flex-col gap-6 w-full mx-auto p-2 pb-10">
            {/* Header with System User Creation & Link to Business Profiles */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pt-2">
                <div>
                    <h1 className="text-3xl font-extrabold tracking-tight">Internal System Users</h1>
                    <p className="text-muted-foreground mt-1 text-sm">
                        Manage internal team members with platform authentication access (Admin & User RBAC permissions).
                    </p>
                </div>
                <div className="flex items-center gap-3">
                    <Button
                        variant="outline"
                        className="gap-2 rounded-xl shadow-xs border-primary/30 hover:bg-primary/10 text-primary font-semibold cursor-pointer h-10 px-4"
                        onClick={() => navigate("/profiles")}
                    >
                        <Building2 className="size-4" />
                        Manage Business Profiles (Vendors/Scrap/Suppliers)
                    </Button>
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
                </div>
            </div>

            {/* Internal Users Table */}
            <Card className={`${bentoCardClass} flex flex-col mt-2`}>
                <CardHeader className="flex flex-row items-center gap-4 border-b border-border/50 bg-muted/20 px-6 py-5">
                    <div className="flex-1">
                        <CardTitle className="flex items-center gap-2 text-lg font-bold">
                            <UsersIcon className="size-5 text-primary" />
                            Internal Application Users & RBAC Roles ({users.length})
                        </CardTitle>
                        <CardDescription className="mt-1">
                            <span className="flex items-center gap-1.5 text-xs">
                                <ShieldIcon className="size-3.5 text-primary/70" />
                                Configure authentication credentials, page permissions, and assigned Project & Store scope.
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
                    {error && !showUserModal && (
                        <div className="mx-6 my-4 rounded-xl bg-destructive/10 border border-destructive/20 p-4 text-sm font-medium text-destructive flex items-center gap-2">
                            <ShieldAlertIcon className="size-4" />
                            {error}
                        </div>
                    )}

                    {loading ? (
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
                                        <th className="text-left px-6 py-4 font-semibold text-muted-foreground uppercase text-[11px] tracking-wider">Phone Number</th>
                                        <th className="text-left px-6 py-4 font-semibold text-muted-foreground uppercase text-[11px] tracking-wider">Page Permissions</th>
                                        <th className="text-left px-6 py-4 font-semibold text-muted-foreground uppercase text-[11px] tracking-wider">Assigned Scope</th>
                                        <th className="text-left px-6 py-4 font-semibold text-muted-foreground uppercase text-[11px] tracking-wider">Created At</th>
                                        <th className="text-right px-6 py-4 font-semibold text-muted-foreground uppercase text-[11px] tracking-wider">Actions</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {filteredUsers.map((u, i) => {
                                        const initials = u.name.split(" ").map(n => n[0]).join("").substring(0, 2).toUpperCase()
                                        const projCount = (u.projects || []).length
                                        const storeCount = (u.stores || []).length
                                        const isAdmin = u.role === "Admin"
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
                                                <td className="px-6 py-4 font-medium text-muted-foreground">{u.phonenumber}</td>
                                                <td className="px-6 py-4">
                                                    {isAdmin ? (
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
                                                </td>
                                                <td className="px-6 py-4">
                                                    {isAdmin ? (
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
                                                <td className="px-6 py-4 text-muted-foreground text-xs font-medium">
                                                    {u.createdAt ? new Date(u.createdAt).toLocaleDateString("en-IN", {
                                                        day: "2-digit",
                                                        month: "short",
                                                        year: "numeric",
                                                    }) : "N/A"}
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
                                                            onClick={() => setDeletingUser({ id: u._id, name: u.name })}
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

            <ConfirmDialog
                isOpen={!!deletingUser}
                onClose={() => setDeletingUser(null)}
                onConfirm={async () => {
                    if (deletingUser) await handleDeleteUser(deletingUser.id)
                }}
                title="Delete Internal User"
                description={`Are you sure you want to delete user "${deletingUser?.name || "this user"}"? This will revoke their platform access.`}
                confirmText="Delete User"
            />
        </div>
    )
}

export default UsersPage
