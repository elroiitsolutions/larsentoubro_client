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
import { Textarea } from "@/components/ui/textarea"
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
    ArrowRightIcon,
    ShieldCheckIcon
} from "lucide-react"
import { useNavigate } from "react-router-dom"
import userService from "@/services/user.service"
import type { UserRecord } from "@/services/user.service"
import formService from "@/services/form.service"
import { toast } from "sonner"
import { validateEmail, validateIndianMobile } from "@/utils/validation"
import { DatePickerField } from "@/components/DynamicForm/DynamicField"

interface UserFormModalProps {
    isOpen: boolean
    onClose: () => void
    editingUser?: UserRecord | null
    onSuccess: () => void
}

const DEFAULT_USER_FIELDS = [
    { id: 'name', name: 'name', label: 'Full Name', type: 'text', placeholder: 'e.g. Rajesh Kumar', validations: [{ type: 'required' }], order: 0 },
    { id: 'user_id', name: 'user_id', label: 'Employee / User ID', type: 'text', placeholder: 'e.g. EMP-10492', validations: [{ type: 'required' }], order: 1 },
    { id: 'email', name: 'email', label: 'Email Address', type: 'email', placeholder: 'e.g. rajesh.k@larsentoubro.com', validations: [{ type: 'required' }, { type: 'email' }], order: 2 },
    { id: 'phonenumber', name: 'phonenumber', label: 'Phone Number', type: 'text', placeholder: 'e.g. +91 98765 43210', validations: [{ type: 'required' }], order: 3 },
    { id: 'role', name: 'role', label: 'System Role (RBAC)', type: 'select', options: [{ label: 'User', value: 'User' }, { label: 'Admin', value: 'Admin' }], validations: [{ type: 'required' }], order: 4 },
    { id: 'status', name: 'status', label: 'Account Status', type: 'select', options: [{ label: 'Active', value: 'Active' }, { label: 'Inactive', value: 'Inactive' }], order: 5 }
]

export function UserFormModal({
    isOpen,
    onClose,
    editingUser,
    onSuccess,
}: UserFormModalProps) {
    const isEdit = Boolean(editingUser)
    const navigate = useNavigate()

    const [formFields, setFormFields] = React.useState<any[]>([])
    const [loadingForm, setLoadingForm] = React.useState(false)
    const [saving, setSaving] = React.useState(false)

    const [formData, setFormData] = React.useState<Record<string, any>>({
        name: "",
        user_id: "",
        email: "",
        phonenumber: "",
        role: "User",
        status: "Active"
    })

    // Fetch dynamic form schema from Forms Management whenever modal opens
    React.useEffect(() => {
        if (!isOpen) return

        let isMounted = true
        const fetchFormSchema = async () => {
            setLoadingForm(true)
            try {
                const res = await formService.getFormBySlug("user-admin-form")
                if (isMounted && res.success && res.data && Array.isArray(res.data.fields)) {
                    // Filter out obsolete password field if still present in old schemas
                    const cleanFields = res.data.fields.filter(
                        (f: any) => f.name !== "password" && f.id !== "password"
                    )
                    setFormFields(cleanFields.sort((a: any, b: any) => (a.order ?? 0) - (b.order ?? 0)))
                }
            } catch (err) {
                console.error("Failed to load user-admin-form schema:", err)
            } finally {
                if (isMounted) setLoadingForm(false)
            }
        }

        fetchFormSchema()
        return () => {
            isMounted = false
        }
    }, [isOpen])

    // Load initial values on open or when editingUser changes
    React.useEffect(() => {
        if (!isOpen) return

        if (editingUser) {
            const raw = editingUser as any
            const initial: Record<string, any> = {
                ...raw,
                name: raw.name || "",
                user_id: raw.user_id || "",
                email: raw.email || "",
                phonenumber: raw.phonenumber || raw.phone || "",
                role: raw.role === "Admin" ? "Admin" : "User",
                status: raw.status === "Inactive" ? "Inactive" : "Active"
            }
            if (raw.customFields && typeof raw.customFields === "object") {
                Object.assign(initial, raw.customFields)
            }
            setFormData(initial)
        } else {
            setFormData({
                name: "",
                user_id: "",
                email: "",
                phonenumber: "",
                role: "User",
                status: "Active"
            })
        }
    }, [isOpen, editingUser])

    // Compute effective display fields: use formFields if loaded, else fallback to defaults
    const displayFields = React.useMemo(() => {
        if (formFields && formFields.length > 0) {
            return formFields
        }
        return DEFAULT_USER_FIELDS
    }, [formFields])

    const handleFieldChange = (key: string, value: any) => {
        let val = value
        if (key === 'phonenumber' || key === 'phone' || key.toLowerCase().includes('phone')) {
            val = typeof value === 'string' ? value.replace(/\D/g, '').slice(0, 10) : value
        }
        setFormData(prev => ({ ...prev, [key]: val }))
    }

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()

        // Validate each active display field according to required rules configured in Forms Management
        for (const field of displayFields) {
            const isFieldRequired = Boolean(field.required) || Boolean(field.validations?.some((v: any) => v.type === "required"))
            const val = formData[field.name]

            if (isFieldRequired) {
                if (val === undefined || val === null || (typeof val === "string" && val.trim() === "")) {
                    toast.error(`${field.label} is required.`)
                    return
                }
            }

            // Strict email validation
            if (field.name === "email" || field.type === "email") {
                const cleanEmail = String(val || "").trim().toLowerCase()
                if (cleanEmail || isFieldRequired) {
                    const emailCheck = validateEmail(cleanEmail)
                    if (!emailCheck.isValid) {
                        toast.error(emailCheck.error || "Email address must contain '@' and '.'.")
                        return
                    }
                }
            }
        }

        setSaving(true)
        try {
            const role = formData.role || "User"
            const cleanEmail = (formData.email || "").trim().toLowerCase()
            if (cleanEmail) {
                const emailCheck = validateEmail(cleanEmail)
                if (!emailCheck.isValid) {
                    toast.error(emailCheck.error || "Email address must contain '@' and '.'.")
                    return
                }
            }
            const cleanUserId = (formData.user_id || "").trim()
            const cleanName = (formData.name || "").trim()
            const cleanPhone = (formData.phonenumber || formData.phone || "").trim()
            if (cleanPhone) {
                const phoneCheck = validateIndianMobile(cleanPhone, "Phone Number")
                if (!phoneCheck.isValid) {
                    toast.error(phoneCheck.error || "Phone number must be a valid 10-digit Indian number.")
                    return
                }
            }

            const payload: Record<string, any> = {
                ...formData,
                name: cleanName,
                email: cleanEmail,
                user_id: cleanUserId,
                phonenumber: cleanPhone,
                role,
                status: formData.status || "Active",
                hasInspectionAccess: role === "Admin" ? true : Boolean(editingUser?.hasInspectionAccess),
                canCreateUser: role === "Admin" ? true : Boolean(editingUser?.canCreateUser),
            }

            // Attach dynamic custom fields both by field.name and slugified label for maximum reliability
            displayFields.forEach((field) => {
                const standardNames = ["name", "user_id", "email", "phonenumber", "phone", "role", "status", "password"]
                if (!standardNames.includes(field.name)) {
                    payload[field.name] = formData[field.name]
                    if (field.label) {
                        const slugKey = field.label.toLowerCase().replace(/[^a-z0-9_]/gi, "_")
                        payload[slugKey] = formData[field.name]
                    }
                }
            })

            if (!isEdit) {
                payload.allowedPages = role === "Admin"
                    ? ["/qr-scanner", "/dashboard", "/projects", "/stores", "/tools", "/users", "/settings"]
                    : ["/qr-scanner", "/dashboard", "/projects", "/stores"]
                payload.projects = []
                payload.stores = []
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

                        {loadingForm ? (
                            <div className="flex flex-col items-center justify-center py-12 text-muted-foreground">
                                <Loader2 className="size-6 animate-spin text-primary mb-2" />
                                <p className="text-xs font-medium">Loading form configuration...</p>
                            </div>
                        ) : (
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                {displayFields.map((field) => {
                                    const isRequired = Boolean(field.required) || Boolean(field.validations?.some((v: any) => v.type === "required"))
                                    const fieldKey = field.name || field.id
                                    const value = formData[fieldKey] ?? ""

                                    // 1. Role Selection Field
                                    if (field.name === "role" || field.id === "role") {
                                        return (
                                            <div key={field.id || field.name} className="md:col-span-2">
                                                <label className="text-xs font-bold text-foreground block mb-1.5">
                                                    {field.label} {isRequired && <span className="text-rose-500">*</span>}
                                                </label>
                                                <Select
                                                    value={formData.role || "User"}
                                                    onValueChange={(val: any) => handleFieldChange("role", val)}
                                                >
                                                    <SelectTrigger className="h-10 w-full rounded-xl bg-background border-border/70 text-sm font-semibold">
                                                        <SelectValue placeholder="Select a role" />
                                                    </SelectTrigger>
                                                    <SelectContent>
                                                        {(field.options && field.options.length > 0 ? field.options : [
                                                            { label: "User — Access controlled by Projects, Stores & Page Scope", value: "User" },
                                                            { label: "Admin — Full unrestricted platform & system management", value: "Admin" }
                                                        ]).map((opt: any) => {
                                                            const optVal = typeof opt === "string" ? opt : opt.value
                                                            const optLabel = typeof opt === "string" ? opt : opt.label
                                                            return (
                                                                <SelectItem key={optVal} value={optVal}>
                                                                    {optLabel}
                                                                </SelectItem>
                                                            )
                                                        })}
                                                    </SelectContent>
                                                </Select>
                                                <div className="mt-2 p-2.5 rounded-xl border bg-muted/20 text-xs">
                                                    {formData.role === "Admin" ? (
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
                                        )
                                    }

                                    // 2. Status Field
                                    if (field.name === "status" || field.id === "status") {
                                        return (
                                            <div key={field.id || field.name}>
                                                <label className="text-xs font-bold text-foreground block mb-1.5">
                                                    {field.label} {isRequired && <span className="text-rose-500">*</span>}
                                                </label>
                                                <Select
                                                    value={formData.status || "Active"}
                                                    onValueChange={(val: any) => handleFieldChange("status", val)}
                                                >
                                                    <SelectTrigger className="h-10 w-full rounded-xl bg-background border-border/70 text-sm font-semibold">
                                                        <SelectValue placeholder="Select status" />
                                                    </SelectTrigger>
                                                    <SelectContent>
                                                        {(field.options && field.options.length > 0 ? field.options : [
                                                            { label: "Active — Member can log in & perform actions", value: "Active" },
                                                            { label: "Inactive — Account disabled", value: "Inactive" }
                                                        ]).map((opt: any) => {
                                                            const optVal = typeof opt === "string" ? opt : opt.value
                                                            const optLabel = typeof opt === "string" ? opt : opt.label
                                                            return (
                                                                <SelectItem key={optVal} value={optVal}>
                                                                    {optLabel}
                                                                </SelectItem>
                                                            )
                                                        })}
                                                    </SelectContent>
                                                </Select>
                                            </div>
                                        )
                                    }

                                    // 3. User ID Field
                                    if (field.name === "user_id" || field.id === "user_id") {
                                        return (
                                            <div key={field.id || field.name}>
                                                <label className="text-xs font-bold text-foreground block mb-1.5">
                                                    {field.label} {isRequired && <span className="text-rose-500">*</span>}
                                                </label>
                                                <Input
                                                    value={formData.user_id || ""}
                                                    onChange={(e) => handleFieldChange("user_id", e.target.value)}
                                                    placeholder={field.placeholder?.trim() || "e.g. EMP-10492"}
                                                    className="h-10 rounded-xl bg-background border-border/70 text-sm font-mono font-medium"
                                                    disabled={isEdit}
                                                />
                                                {isEdit && (
                                                    <p className="text-[10px] text-muted-foreground mt-1">
                                                        User ID is locked after initial registration.
                                                    </p>
                                                )}
                                            </div>
                                        )
                                    }

                                    // 4. Dropdown Select Field
                                    if (field.type === "select") {
                                        return (
                                            <div key={field.id || field.name}>
                                                <label className="text-xs font-bold text-foreground block mb-1.5">
                                                    {field.label} {isRequired && <span className="text-rose-500">*</span>}
                                                </label>
                                                <Select
                                                    value={value || ""}
                                                    onValueChange={(val) => handleFieldChange(fieldKey, val)}
                                                >
                                                    <SelectTrigger className="h-10 w-full rounded-xl bg-background border-border/70 text-sm font-medium">
                                                        <SelectValue placeholder={field.placeholder?.trim() || undefined} />
                                                    </SelectTrigger>
                                                    <SelectContent>
                                                        {(field.options || []).map((opt: any) => {
                                                            const optVal = typeof opt === "string" ? opt : opt.value
                                                            const optLabel = typeof opt === "string" ? opt : opt.label
                                                            return (
                                                                <SelectItem key={optVal} value={optVal}>
                                                                    {optLabel}
                                                                </SelectItem>
                                                            )
                                                        })}
                                                    </SelectContent>
                                                </Select>
                                            </div>
                                        )
                                    }

                                    // 5. Textarea Field
                                    if (field.type === "textarea") {
                                        return (
                                            <div key={field.id || field.name} className="md:col-span-2">
                                                <label className="text-xs font-bold text-foreground block mb-1.5">
                                                    {field.label} {isRequired && <span className="text-rose-500">*</span>}
                                                </label>
                                                <Textarea
                                                    value={value || ""}
                                                    onChange={(e) => handleFieldChange(fieldKey, e.target.value)}
                                                    placeholder={field.placeholder?.trim() || undefined}
                                                    className="min-h-[80px] rounded-xl bg-background border-border/70 text-sm font-medium"
                                                />
                                            </div>
                                        )
                                    }

                                    // 6. Number Field
                                    if (field.type === "number") {
                                        return (
                                            <div key={field.id || field.name}>
                                                <label className="text-xs font-bold text-foreground block mb-1.5">
                                                    {field.label} {isRequired && <span className="text-rose-500">*</span>}
                                                </label>
                                                <Input
                                                    type="number"
                                                    value={value ?? ""}
                                                    onChange={(e) => handleFieldChange(fieldKey, e.target.value === "" ? "" : Number(e.target.value))}
                                                    placeholder={field.placeholder?.trim() || undefined}
                                                    className="h-10 rounded-xl bg-background border-border/70 text-sm font-medium"
                                                />
                                            </div>
                                        )
                                    }

                                    // 7. Date Field
                                    const fieldTypeLower = String(field.type || "").toLowerCase()
                                    if (fieldTypeLower === "date" || fieldTypeLower === "calendar" || fieldTypeLower === "calender") {
                                        return (
                                            <div key={field.id || field.name}>
                                                <label className="text-xs font-bold text-foreground block mb-1.5">
                                                    {field.label} {isRequired && <span className="text-rose-500">*</span>}
                                                </label>
                                                <DatePickerField
                                                    id={field.id || field.name}
                                                    value={value || ""}
                                                    onChange={(val) => handleFieldChange(fieldKey, val)}
                                                    placeholder={field.placeholder?.trim()}
                                                />
                                            </div>
                                        )
                                    }

                                    // 8. Default Text / Email / Phone Input
                                    const isFullWidth = field.name === "name" || field.id === "name"
                                    const isPhoneField = field.name === "phonenumber" || field.id === "phonenumber" || field.name?.toLowerCase().includes("phone")
                                    return (
                                        <div key={field.id || field.name} className={isFullWidth ? "md:col-span-2" : ""}>
                                            <label className="text-xs font-bold text-foreground block mb-1.5">
                                                {field.label} {isRequired && <span className="text-rose-500">*</span>}
                                            </label>
                                            <Input
                                                type={field.type === "email" ? "email" : "text"}
                                                value={value || ""}
                                                onChange={(e) => handleFieldChange(fieldKey, e.target.value)}
                                                maxLength={isPhoneField ? 10 : undefined}
                                                inputMode={isPhoneField ? "numeric" : undefined}
                                                placeholder={
                                                    field.placeholder?.trim() ||
                                                    (field.name === "name" || field.id === "name" ? "e.g. Rajesh Kumar" :
                                                     field.name === "email" || field.id === "email" ? "e.g. rajesh.k@larsentoubro.com" :
                                                     isPhoneField ? "e.g. 9876543210" : undefined)
                                                }
                                                className="h-10 rounded-xl bg-background border-border/70 text-sm font-medium"
                                            />
                                        </div>
                                    )
                                })}
                            </div>
                        )}
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

export default UserFormModal
