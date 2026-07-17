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
import { PlusIcon, UsersIcon, SearchIcon, ShieldIcon, XIcon } from "lucide-react"
import { useAuth } from "@/contexts/AuthContext"

const roleColors: Record<string, string> = {
    Admin: "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400",
    Manager: "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400",
    Engineer: "bg-indigo-100 text-indigo-700 dark:bg-indigo-900/30 dark:text-indigo-400",
    Analyst: "bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400",
    Viewer: "bg-gray-100 text-gray-700 dark:bg-gray-900/30 dark:text-gray-400",
}

const avatarColors = [
    "bg-blue-500",
    "bg-green-500",
    "bg-purple-500",
    "bg-orange-500",
    "bg-red-500",
    "bg-teal-500",
    "bg-yellow-500",
    "bg-pink-500",
]

interface UserAPI {
    _id: string
    name: string
    phonenumber: string
    email: string
    role: "Admin" | "Manager" | "Engineer" | "Analyst" | "Viewer"
    user_id: string
    createdAt: string
}

export function UsersPage() {
    const { token } = useAuth()
    const [users, setUsers] = React.useState<UserAPI[]>([])
    const [searchTerm, setSearchTerm] = React.useState("")
    const [showModal, setShowModal] = React.useState(false)
    const [loading, setLoading] = React.useState(true)
    const [submitting, setSubmitting] = React.useState(false)
    const [error, setError] = React.useState<string | null>(null)

    // Form states
    const [name, setName] = React.useState("")
    const [email, setEmail] = React.useState("")
    const [phonenumber, setPhonenumber] = React.useState("")
    const [password, setPassword] = React.useState("")
    const [role, setRole] = React.useState<"Admin" | "Manager" | "Engineer" | "Analyst" | "Viewer">("Viewer")
    const [userId, setUserId] = React.useState("")

    const fetchUsers = React.useCallback(async () => {
        setLoading(true)
        setError(null)
        try {
            const headers: HeadersInit = {}
            if (token) {
                headers["Authorization"] = `Bearer ${token}`
            }
            const response = await fetch("http://localhost:3000/api/users", {
                headers,
            })
            const resData = await response.json()
            if (!response.ok || !resData.success) {
                throw new Error(resData.message || "Failed to fetch users")
            }
            setUsers(resData.data)
        } catch (err: any) {
            setError(err.message || "Something went wrong fetching users")
        } finally {
            setLoading(false)
        }
    }, [token])

    React.useEffect(() => {
        fetchUsers()
    }, [fetchUsers])

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        setSubmitting(true)
        setError(null)

        try {
            const response = await fetch("http://localhost:3000/api/users", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    ...(token ? { Authorization: `Bearer ${token}` } : {}),
                },
                body: JSON.stringify({
                    name,
                    email,
                    phonenumber,
                    password,
                    role,
                    user_id: userId,
                }),
            })

            const resData = await response.json()

            if (!response.ok || !resData.success) {
                throw new Error(resData.message || "Failed to create user")
            }

            // Close modal & reset form
            setShowModal(false)
            setName("")
            setEmail("")
            setPhonenumber("")
            setPassword("")
            setRole("Viewer")
            setUserId("")

            // Refresh list
            fetchUsers()
        } catch (err: any) {
            setError(err.message || "Failed to create user. Please check all fields.")
        } finally {
            setSubmitting(false)
        }
    }

    const filteredUsers = users.filter((u) => {
        const term = searchTerm.toLowerCase()
        return (
            u.name.toLowerCase().includes(term) ||
            u.email.toLowerCase().includes(term) ||
            u.user_id.toLowerCase().includes(term) ||
            u.phonenumber.toLowerCase().includes(term) ||
            u.role.toLowerCase().includes(term)
        )
    })

    return (
        <div className="flex flex-col gap-6 relative">
            <div className="flex items-center justify-between">
                <div>
                    <h2 className="text-2xl font-semibold tracking-tight">Users</h2>
                    <p className="text-muted-foreground text-sm mt-1">
                        Manage team members, roles, and access levels.
                    </p>
                </div>
                <Button className="gap-2" onClick={() => setShowModal(true)}>
                    <PlusIcon className="size-4" />
                    Create User
                </Button>
            </div>

            {/* Basic stats */}
            <div className="grid gap-4 sm:grid-cols-3">
                {[
                    { label: "Total Users", value: users.length.toString(), color: "text-foreground" },
                    { label: "Admins", value: users.filter(u => u.role === "Admin").length.toString(), color: "text-red-600" },
                    { label: "Managers", value: users.filter(u => u.role === "Manager").length.toString(), color: "text-blue-600" },
                ].map((s) => (
                    <Card key={s.label} className="py-4">
                        <CardContent className="flex flex-col items-center text-center px-4">
                            <span className={`text-3xl font-bold ${s.color}`}>{s.value}</span>
                            <span className="text-xs text-muted-foreground mt-1">{s.label}</span>
                        </CardContent>
                    </Card>
                ))}
            </div>

            {/* Users table */}
            <Card>
                <CardHeader className="flex flex-row items-center gap-4">
                    <div className="flex-1">
                        <CardTitle className="flex items-center gap-2 text-base">
                            <UsersIcon className="size-4 text-muted-foreground" />
                            All Members
                        </CardTitle>
                        <CardDescription>
                            <span className="flex items-center gap-1">
                                <ShieldIcon className="size-3" />
                                Roles control access level across the platform
                            </span>
                        </CardDescription>
                    </div>
                    <div className="relative w-56">
                        <SearchIcon className="absolute left-2.5 top-2.5 size-3.5 text-muted-foreground" />
                        <Input
                            placeholder="Search users..."
                            className="pl-8 h-8 text-sm"
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                        />
                    </div>
                </CardHeader>
                <CardContent className="p-0">
                    {error && !showModal && (
                        <div className="mx-6 my-4 rounded-lg bg-destructive/15 p-3 text-xs font-semibold text-destructive">
                            {error}
                        </div>
                    )}

                    {loading ? (
                        <div className="flex items-center justify-center p-8">
                            <div className="h-6 w-6 animate-spin rounded-full border-2 border-primary border-t-transparent" />
                        </div>
                    ) : filteredUsers.length === 0 ? (
                        <div className="p-8 text-center text-muted-foreground text-sm">
                            No users found.
                        </div>
                    ) : (
                        <div className="overflow-x-auto">
                            <table className="w-full text-sm">
                                <thead>
                                    <tr className="border-b bg-muted/40">
                                        <th className="text-left px-6 py-3 font-medium text-muted-foreground">User</th>
                                        <th className="text-left px-6 py-3 font-medium text-muted-foreground">Email</th>
                                        <th className="text-left px-6 py-3 font-medium text-muted-foreground">Phone Number</th>
                                        <th className="text-left px-6 py-3 font-medium text-muted-foreground">Role</th>
                                        <th className="text-left px-6 py-3 font-medium text-muted-foreground">Created At</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {filteredUsers.map((u, i) => {
                                        const initials = u.name.split(" ").map(n => n[0]).join("").substring(0, 2).toUpperCase()
                                        return (
                                            <tr
                                                key={u._id}
                                                className={`border-b last:border-0 hover:bg-muted/30 transition-colors ${i % 2 === 0 ? "" : "bg-muted/10"
                                                    }`}
                                            >
                                                <td className="px-6 py-3">
                                                    <div className="flex items-center gap-3">
                                                        <div
                                                            className={`flex size-8 shrink-0 items-center justify-center rounded-full text-xs font-bold text-white ${avatarColors[i % avatarColors.length]
                                                                }`}
                                                        >
                                                            {initials}
                                                        </div>
                                                        <div>
                                                            <p className="font-medium leading-none">{u.name}</p>
                                                            <p className="text-xs text-muted-foreground mt-0.5">{u.user_id}</p>
                                                        </div>
                                                    </div>
                                                </td>
                                                <td className="px-6 py-3 text-muted-foreground">{u.email}</td>
                                                <td className="px-6 py-3 text-muted-foreground">{u.phonenumber}</td>
                                                <td className="px-6 py-3">
                                                    <span
                                                        className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${roleColors[u.role] || "bg-gray-100 text-gray-700"
                                                            }`}
                                                    >
                                                        {u.role}
                                                    </span>
                                                </td>
                                                <td className="px-6 py-3 text-muted-foreground">
                                                    {new Date(u.createdAt).toLocaleDateString("en-IN", {
                                                        day: "2-digit",
                                                        month: "short",
                                                        year: "numeric",
                                                    })}
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

            {/* User Creation Modal */}
            {showModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/80 backdrop-blur-xs p-4">
                    <Card className="w-full max-w-lg shadow-xl relative animate-in fade-in zoom-in-95 duration-100">
                        <button
                            onClick={() => setShowModal(false)}
                            className="absolute right-4 top-4 rounded-xs p-1 text-muted-foreground hover:bg-muted hover:text-foreground"
                        >
                            <XIcon className="size-4" />
                        </button>
                        <CardHeader>
                            <CardTitle>Create New User</CardTitle>
                            <CardDescription>Enter details to add a member to the database.</CardDescription>
                        </CardHeader>
                        <CardContent>
                            <form onSubmit={handleSubmit} className="space-y-4">
                                {error && (
                                    <div className="rounded-lg bg-destructive/15 p-3 text-xs font-semibold text-destructive">
                                        {error}
                                    </div>
                                )}

                                <div className="grid grid-cols-2 gap-4">
                                    <div className="flex flex-col gap-1.5">
                                        <label className="text-xs font-medium" htmlFor="name">Name</label>
                                        <Input
                                            id="name"
                                            required
                                            value={name}
                                            onChange={(e) => setName(e.target.value)}
                                            placeholder="e.g. John Doe"
                                        />
                                    </div>

                                    <div className="flex flex-col gap-1.5">
                                        <label className="text-xs font-medium" htmlFor="userId">User ID</label>
                                        <Input
                                            id="userId"
                                            required
                                            value={userId}
                                            onChange={(e) => setUserId(e.target.value)}
                                            placeholder="e.g. USR-009"
                                        />
                                    </div>
                                </div>

                                <div className="grid grid-cols-2 gap-4">
                                    <div className="flex flex-col gap-1.5">
                                        <label className="text-xs font-medium" htmlFor="email">Email</label>
                                        <Input
                                            id="email"
                                            type="email"
                                            required
                                            value={email}
                                            onChange={(e) => setEmail(e.target.value)}
                                            placeholder="john.doe@landt.com"
                                        />
                                    </div>

                                    <div className="flex flex-col gap-1.5">
                                        <label className="text-xs font-medium" htmlFor="phonenumber">Phone Number</label>
                                        <Input
                                            id="phonenumber"
                                            required
                                            value={phonenumber}
                                            onChange={(e) => setPhonenumber(e.target.value)}
                                            placeholder="e.g. 9876543210"
                                        />
                                    </div>
                                </div>

                                <div className="grid grid-cols-2 gap-4">
                                    <div className="flex flex-col gap-1.5">
                                        <label className="text-xs font-medium" htmlFor="password">Password</label>
                                        <Input
                                            id="password"
                                            type="password"
                                            required
                                            value={password}
                                            onChange={(e) => setPassword(e.target.value)}
                                            placeholder="Minimum 6 characters"
                                        />
                                    </div>

                                    <div className="flex flex-col gap-1.5">
                                        <label className="text-xs font-medium" htmlFor="role">Role</label>
                                        <select
                                            id="role"
                                            value={role}
                                            onChange={(e) => setRole(e.target.value as any)}
                                            className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-xs transition-colors focus-visible:outline-hidden focus-visible:ring-1 focus-visible:ring-ring"
                                        >
                                            <option value="Admin">Admin</option>
                                            <option value="Manager">Manager</option>
                                            <option value="Engineer">Engineer</option>
                                            <option value="Analyst">Analyst</option>
                                            <option value="Viewer">Viewer</option>
                                        </select>
                                    </div>
                                </div>

                                <div className="flex justify-end gap-3 pt-4 border-t">
                                    <Button variant="outline" type="button" onClick={() => setShowModal(false)} disabled={submitting}>
                                        Cancel
                                    </Button>
                                    <Button type="submit" disabled={submitting}>
                                        {submitting ? "Creating..." : "Create"}
                                    </Button>
                                </div>
                            </form>
                        </CardContent>
                    </Card>
                </div>
            )}
        </div>
    )
}
