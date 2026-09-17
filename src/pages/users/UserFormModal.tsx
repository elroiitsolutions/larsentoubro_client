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
    SelectSeparator
} from "@/components/ui/select"
import {
    UserPlusIcon,
    UserIcon,
    Loader2,
    ArrowRightIcon,
    ShieldCheckIcon,
    KeyIcon
} from "lucide-react"
import { useNavigate } from "react-router-dom"
import userService from "@/services/user.service"
import type { UserRecord } from "@/services/user.service"
import { toast } from "sonner"

interface UserFormModalProps {
    isOpen: boolean
    onClose: () => void
    editingUser?: UserRecord | null
    onSuccess: () => void
}

export function UserFormModal({
    isOpen,
    onClose,
    editingUser,
    onSuccess,
}: UserFormModalProps) {
    const isEdit = Boolean(editingUser)
    const navigate = useNavigate()

    const [name, setName] = React.useState("")
    const [email, setEmail] = React.useState("")
    const [userId, setUserId] = React.useState("")
    const [phone, setPhone] = React.useState("")
    const [password, setPassword] = React.useState("")
    const [role, setRole] = React.useState<"Admin" | "User">("User")
    const [status, setStatus] = React.useState<"Active" | "Inactive">("Active")
    const [saving, setSaving] = React.useState(false)

    React.useEffect(() => {
        if (!isOpen) return

        if (editingUser) {
            setName(editingUser.name || "")
            setEmail(editingUser.email || "")
            setUserId(editingUser.user_id || "")
            setPhone(editingUser.phonenumber || "")
            setPassword("")
            setRole(editingUser.role === "Admin" ? "Admin" : "User")
            setStatus("Active")
        } else {
            setName("")
            setEmail("")
            setUserId("")
            setPhone("")
            setPassword("")
            setRole("User")
            setStatus("Active")
        }
    }, [isOpen, editingUser])

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()

        if (!name.trim() || !email.trim() || !userId.trim() || !phone.trim()) {
            toast.error("Please fill in all required user profile fields.")
            return
        }

        if (!isEdit && (!password || password.trim().length < 6)) {
            toast.error("Password must be at least 6 characters for new users.")
            return
        }

        setSaving(true)
        try {
            const payload: Record<string, unknown> = {
                name: name.trim(),
                email: email.trim(),
                user_id: userId.trim(),
                phonenumber: phone.trim(),
                role: role,
                status: status,
            }

            if (!isEdit) {
                payload.allowedPages = role === "Admin"
                    ? ["/dashboard", "/projects", "/stores", "/tools", "/users", "/settings"]
                    : ["/dashboard", "/projects", "/stores"]
                payload.projects = []
                payload.stores = []
            }

            if (password.trim()) {
                payload.password = password.trim()
            }

            let res
            if (isEdit && editingUser) {
                res = await userService.updateUser(editingUser._id, payload)
            } else {
                res = await userService.createUser(payload)
            }

            if (res.success && res.data) {
                const targetId = isEdit && editingUser ? editingUser._id : res.data._id
                toast.success(
                    isEdit
                        ? "User details updated successfully!"
                        : "User created! Redirecting to Manage Access & Permissions page..."
                )
                onSuccess()
                onClose()
                navigate(`/users/${targetId}/access`)
            } else {
                toast.error(res.message || "Failed to save user account.")
            }
        } catch (error: any) {
            const msg =
                error?.response?.data?.message ||
                error.message ||
                "An unexpected error occurred while saving user."
            toast.error(msg)
        } finally {
            setSaving(false)
        }
    }

    return (
        <Dialog open={isOpen} onOpenChange={(val) => !val && onClose()}>
            <DialogContent className="max-w-2xl max-h-[90vh] flex flex-col p-0 overflow-hidden">
                {/* Header */}
                <DialogHeader className="px-6 py-5 border-b border-border/60 bg-muted/20 shrink-0">
                    <div className="flex items-center gap-3">
                        <div className="p-2.5 rounded-xl bg-primary/10 text-primary">
                            <UserPlusIcon className="size-6" />
                        </div>
                        <div>
                            <DialogTitle className="text-xl font-bold text-foreground">
                                {isEdit ? "Edit Internal User / Admin" : "Create Internal User / Admin"}
                            </DialogTitle>
                            <DialogDescription className="text-xs text-muted-foreground mt-0.5 leading-relaxed">
                                {isEdit
                                    ? "Update member profile details. For permissions, use the Manage Access page."
                                    : "Register internal application user. Upon saving, you can configure Page, Project & Store permissions."}
                            </DialogDescription>
                        </div>
                    </div>
                </DialogHeader>

                {/* Form Body */}
                <form
                    onSubmit={handleSubmit}
                    className="flex-1 min-h-0 overflow-y-auto p-6 space-y-6"
                >
                    <div className="bg-card border border-border/60 rounded-2xl p-5 shadow-xs space-y-4">
                        <h3 className="text-sm font-bold text-foreground flex items-center gap-2 pb-2 border-b border-border/40">
                            <UserIcon className="size-4 text-primary" />
                            Internal Member Identity & Profile
                        </h3>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            {/* Full Name */}
                            <div className="md:col-span-2">
                                <label className="text-xs font-bold text-foreground block mb-1.5">
                                    Full Name <span className="text-rose-500">*</span>
                                </label>
                                <Input
                                    value={name}
                                    onChange={(e) => setName(e.target.value)}
                                    placeholder="e.g. Rajesh Kumar"
                                    className="h-10 rounded-xl bg-background border-border/70 text-sm font-medium"
                                    required
                                />
                            </div>

                            {/* Employee / User ID */}
                            <div>
                                <label className="text-xs font-bold text-foreground block mb-1.5">
                                    Employee / User ID <span className="text-rose-500">*</span>
                                </label>
                                <Input
                                    value={userId}
                                    onChange={(e) => setUserId(e.target.value)}
                                    placeholder="e.g. EMP-10492"
                                    className="h-10 rounded-xl bg-background border-border/70 text-sm font-mono font-medium"
                                    required
                                    disabled={isEdit}
                                />
                                {isEdit && (
                                    <p className="text-[10px] text-muted-foreground mt-1">
                                        User ID is locked after initial registration.
                                    </p>
                                )}
                            </div>

                            {/* Email Address */}
                            <div>
                                <label className="text-xs font-bold text-foreground block mb-1.5">
                                    Email Address <span className="text-rose-500">*</span>
                                </label>
                                <Input
                                    type="email"
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    placeholder="e.g. rajesh.k@larsentoubro.com"
                                    className="h-10 rounded-xl bg-background border-border/70 text-sm font-medium"
                                    required
                                />
                            </div>

                            {/* Phone Number */}
                            <div>
                                <label className="text-xs font-bold text-foreground block mb-1.5">
                                    Phone Number <span className="text-rose-500">*</span>
                                </label>
                                <Input
                                    value={phone}
                                    onChange={(e) => setPhone(e.target.value)}
                                    placeholder="e.g. +91 98765 43210"
                                    className="h-10 rounded-xl bg-background border-border/70 text-sm font-medium"
                                    required
                                />
                            </div>

                            {/* Active Status */}
                            <div>
                                <label className="text-xs font-bold text-foreground block mb-1.5">
                                    Account Status <span className="text-rose-500">*</span>
                                </label>
                                <Select value={status} onValueChange={(val: any) => setStatus(val)}>
                                    <SelectTrigger className="h-10 w-full rounded-xl bg-background border-border/70 text-sm font-semibold">
                                        <SelectValue placeholder="Select status" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="Active">Active — Member can log in & perform actions</SelectItem>
                                        <SelectItem value="Inactive">Inactive — Account disabled</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>

                            {/* Role Selection */}
                            <div className="md:col-span-2">
                                <label className="text-xs font-bold text-foreground block mb-1.5">
                                    System Role (RBAC) <span className="text-rose-500">*</span>
                                </label>
                                <Select value={role} onValueChange={(val: any) => setRole(val)}>
                                    <SelectTrigger className="h-10 w-full rounded-xl bg-background border-border/70 text-sm font-semibold">
                                        <SelectValue placeholder="Select a role" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="User">User — Access controlled by Projects, Stores & Page Scope</SelectItem>
                                        <SelectSeparator />
                                        <SelectItem value="Admin">Admin — Full unrestricted platform & system management</SelectItem>
                                    </SelectContent>
                                </Select>
                                <div className="mt-2 p-2.5 rounded-xl border bg-muted/20 text-xs">
                                    {role === "Admin" ? (
                                        <p className="text-blue-600 dark:text-blue-400 font-medium">
                                            <span className="font-bold">Admin:</span> Unrestricted access across all Projects, Stores, Tools, Reports, and System Settings.
                                        </p>
                                    ) : (
                                        <p className="text-muted-foreground font-medium">
                                            <span className="font-bold">User:</span> Standard access scope governed by assigned Projects, Stores, and Page Permissions.
                                        </p>
                                    )}
                                </div>
                            </div>

                            {/* Password */}
                            <div className="md:col-span-2">
                                <label className="text-xs font-bold text-foreground flex items-center gap-1.5 mb-1.5">
                                    <KeyIcon className="size-3.5 text-primary" />
                                    <span>{isEdit ? "Admin Reset Password" : "Account Password"}</span>
                                    {!isEdit && <span className="text-rose-500">*</span>}
                                </label>
                                <Input
                                    type="password"
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    placeholder={
                                        isEdit
                                            ? "Leave blank to keep current password"
                                            : "Enter at least 6 characters"
                                    }
                                    className="h-10 rounded-xl bg-background border-border/70 text-sm font-medium"
                                    required={!isEdit}
                                />
                                <p className="text-[11px] text-muted-foreground mt-1">
                                    {isEdit
                                        ? "Only Admins can reset user passwords."
                                        : "Member will use this password for login access."}
                                </p>
                            </div>
                        </div>
                    </div>

                    <div className="p-4 rounded-xl bg-primary/5 border border-primary/20 flex items-start gap-3">
                        <ShieldCheckIcon className="size-5 text-primary shrink-0 mt-0.5" />
                        <div className="text-xs text-muted-foreground leading-relaxed">
                            <span className="font-bold text-foreground">Next Step:</span> Upon saving, you will be directed to <span className="font-semibold text-primary">Manage Access & Permissions</span> to configure Project assignments, Store access, and Page permissions.
                        </div>
                    </div>
                </form>

                {/* Footer Action Bar */}
                <div className="p-4 border-t border-border/60 bg-muted/30 flex items-center justify-end gap-3 shrink-0">
                    <Button
                        type="button"
                        variant="outline"
                        onClick={onClose}
                        className="h-10 rounded-xl px-5 font-semibold cursor-pointer"
                        disabled={saving}
                    >
                        Cancel
                    </Button>
                    <Button
                        type="button"
                        onClick={handleSubmit}
                        className="h-10 rounded-xl px-6 font-semibold bg-primary text-primary-foreground hover:bg-primary/90 gap-2 cursor-pointer shadow-sm"
                        disabled={saving}
                    >
                        {saving && <Loader2 className="size-4 animate-spin" />}
                        <span>{isEdit ? "Update Member Profile" : "Create & Configure Access"}</span>
                        <ArrowRightIcon className="size-4" />
                    </Button>
                </div>
            </DialogContent>
        </Dialog>
    )
}

export default UserFormModal;
