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
    Building2,
    UserCheck,
    PhoneCall,
    Mail,
    MapPin,
    Loader2,
    ArrowRightIcon,
    KeyIcon,
    BadgeCheck
} from "lucide-react"
import vendorService, { type VendorRecord } from "@/services/vendor.service"
import { toast } from "sonner"

interface VendorFormModalProps {
    isOpen: boolean
    onClose: () => void
    editingVendor?: VendorRecord | null
    onSuccess: () => void
}

export function VendorFormModal({
    isOpen,
    onClose,
    editingVendor,
    onSuccess,
}: VendorFormModalProps) {
    const isEdit = Boolean(editingVendor)

    const [name, setName] = React.useState("")
    const [vendorCode, setVendorCode] = React.useState("")
    const [contactPerson, setContactPerson] = React.useState("")
    const [contactDesignation, setContactDesignation] = React.useState("")
    const [contactEmail, setContactEmail] = React.useState("")
    const [contactPhone, setContactPhone] = React.useState("")
    const [alternatePhone, setAlternatePhone] = React.useState("")
    const [address, setAddress] = React.useState("")
    const [gstNumber, setGstNumber] = React.useState("")
    const [status, setStatus] = React.useState<"Active" | "Inactive">("Active")
    const [password, setPassword] = React.useState("")
    const [saving, setSaving] = React.useState(false)

    React.useEffect(() => {
        if (!isOpen) return

        if (editingVendor) {
            setName(editingVendor.name || "")
            setVendorCode(editingVendor.vendorCode || "")
            setContactPerson(editingVendor.contactPerson || "")
            setContactDesignation(editingVendor.contactDesignation || "")
            setContactEmail(editingVendor.contactEmail || "")
            setContactPhone(editingVendor.contactPhone || "")
            setAlternatePhone(editingVendor.alternatePhone || "")
            setAddress(editingVendor.address || "")
            setGstNumber(editingVendor.gstNumber || "")
            setStatus(editingVendor.status || "Active")
            setPassword("")
        } else {
            setName("")
            setVendorCode("")
            setContactPerson("")
            setContactDesignation("")
            setContactEmail("")
            setContactPhone("")
            setAlternatePhone("")
            setAddress("")
            setGstNumber("")
            setStatus("Active")
            setPassword("")
        }
    }, [isOpen, editingVendor])

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()

        if (!name.trim()) {
            toast.error("Company Name is required.")
            return
        }

        if (!contactPhone.trim() && !contactEmail.trim()) {
            toast.error("Please provide at least a contact phone number or email address.")
            return
        }

        setSaving(true)
        try {
            const payload: Partial<VendorRecord> = {
                name: name.trim(),
                vendorCode: vendorCode.trim() ? vendorCode.trim().toUpperCase() : undefined,
                contactPerson: contactPerson.trim(),
                contactDesignation: contactDesignation.trim(),
                contactEmail: contactEmail.trim(),
                contactPhone: contactPhone.trim(),
                alternatePhone: alternatePhone.trim(),
                address: address.trim(),
                gstNumber: gstNumber.trim().toUpperCase(),
                status: status,
            }

            if (password.trim()) {
                payload.password = password.trim()
            }

            let res
            if (isEdit && editingVendor) {
                res = await vendorService.updateVendor(editingVendor._id, payload)
            } else {
                res = await vendorService.createVendor(payload)
            }

            if (res.success && res.data) {
                toast.success(
                    isEdit
                        ? `Vendor record '${res.data.name}' updated successfully!`
                        : `Vendor company '${res.data.name}' registered successfully!`
                )
                onSuccess()
                onClose()
            } else {
                toast.error("Failed to save vendor record.")
            }
        } catch (error: any) {
            const msg =
                error?.response?.data?.message ||
                error.message ||
                "An unexpected error occurred while saving vendor company."
            toast.error(msg)
        } finally {
            setSaving(false)
        }
    }

    return (
        <Dialog open={isOpen} onOpenChange={(val) => !val && onClose()}>
            <DialogContent className="max-w-3xl max-h-[90vh] flex flex-col p-0 overflow-hidden">
                {/* Header */}
                <DialogHeader className="px-6 py-5 border-b border-border/60 bg-muted/20 shrink-0">
                    <div className="flex items-center gap-3">
                        <div className="p-2.5 rounded-xl bg-amber-500/10 text-amber-600 dark:text-amber-400">
                            <Building2 className="size-6" />
                        </div>
                        <div>
                            <DialogTitle className="text-xl font-bold text-foreground">
                                {isEdit ? "Edit Vendor / Company Record" : "Create Vendor / Company Record"}
                            </DialogTitle>
                            <DialogDescription className="text-xs text-muted-foreground mt-0.5 leading-relaxed">
                                {isEdit
                                    ? "Update company information, contact person, designation, and tax identifier."
                                    : "Register new vendor/contractor company. Used for Delivery Challans, Return Challans, tool issues, and reports."}
                            </DialogDescription>
                        </div>
                    </div>
                </DialogHeader>

                {/* Form Body */}
                <form
                    onSubmit={handleSubmit}
                    className="flex-1 min-h-0 overflow-y-auto p-6 space-y-6"
                >
                    {/* Section 1: Company Profile & Tax Identifiers */}
                    <div className="bg-card border border-border/60 rounded-2xl p-5 shadow-xs space-y-4">
                        <h3 className="text-sm font-bold text-foreground flex items-center gap-2 pb-2 border-b border-border/40">
                            <Building2 className="size-4 text-primary" />
                            Company Profile & Business Details
                        </h3>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            {/* Company Name */}
                            <div className="md:col-span-2">
                                <label className="text-xs font-bold text-foreground block mb-1.5">
                                    Company / Vendor Name <span className="text-rose-500">*</span>
                                </label>
                                <Input
                                    value={name}
                                    onChange={(e) => setName(e.target.value)}
                                    placeholder="e.g. RADHE SWAMI CONSTRUCTION"
                                    className="h-10 rounded-xl bg-background border-border/70 text-sm font-semibold"
                                    required
                                />
                            </div>

                            {/* Vendor Code */}
                            <div>
                                <label className="text-xs font-bold text-foreground block mb-1.5">
                                    Vendor Code <span className="text-muted-foreground font-normal">(Auto-generated if blank)</span>
                                </label>
                                <Input
                                    value={vendorCode}
                                    onChange={(e) => setVendorCode(e.target.value)}
                                    placeholder="e.g. V-RSC01"
                                    className="h-10 rounded-xl bg-background border-border/70 text-sm font-mono uppercase font-medium"
                                />
                            </div>

                            {/* GST / Tax Number */}
                            <div>
                                <label className="text-xs font-bold text-foreground block mb-1.5">
                                    GST / Tax Number
                                </label>
                                <Input
                                    value={gstNumber}
                                    onChange={(e) => setGstNumber(e.target.value)}
                                    placeholder="e.g. 27AAACL0140P1Z0"
                                    className="h-10 rounded-xl bg-background border-border/70 text-sm font-mono uppercase font-medium"
                                />
                            </div>

                            {/* Active Status */}
                            <div>
                                <label className="text-xs font-bold text-foreground block mb-1.5">
                                    Vendor Status <span className="text-rose-500">*</span>
                                </label>
                                <Select value={status} onValueChange={(val: any) => setStatus(val)}>
                                    <SelectTrigger className="h-10 w-full rounded-xl bg-background border-border/70 text-sm font-semibold">
                                        <SelectValue placeholder="Select status" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="Active">Active — Available for Delivery Challans & Tool Issues</SelectItem>
                                        <SelectItem value="Inactive">Inactive — Suspended / Deactivated</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                        </div>
                    </div>

                    {/* Section 2: Contact & Key Personnel */}
                    <div className="bg-card border border-border/60 rounded-2xl p-5 shadow-xs space-y-4">
                        <h3 className="text-sm font-bold text-foreground flex items-center gap-2 pb-2 border-b border-border/40">
                            <UserCheck className="size-4 text-primary" />
                            Manager & Contact Information
                        </h3>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            {/* Manager / Contact Person */}
                            <div>
                                <label className="text-xs font-bold text-foreground block mb-1.5">
                                    Manager / Contact Person Name
                                </label>
                                <Input
                                    value={contactPerson}
                                    onChange={(e) => setContactPerson(e.target.value)}
                                    placeholder="e.g. Dinesh G"
                                    className="h-10 rounded-xl bg-background border-border/70 text-sm font-medium"
                                />
                            </div>

                            {/* Contact Person Designation */}
                            <div>
                                <label className="text-xs font-bold text-foreground block mb-1.5">
                                    Contact Designation
                                </label>
                                <Input
                                    value={contactDesignation}
                                    onChange={(e) => setContactDesignation(e.target.value)}
                                    placeholder="e.g. Site Manager / Authorized Representative"
                                    className="h-10 rounded-xl bg-background border-border/70 text-sm font-medium"
                                />
                            </div>

                            {/* Email Address */}
                            <div>
                                <label className="text-xs font-bold text-foreground block mb-1.5 flex items-center gap-1.5">
                                    <Mail className="size-3.5 text-primary" />
                                    Company / Contact Email Address
                                </label>
                                <Input
                                    type="email"
                                    value={contactEmail}
                                    onChange={(e) => setContactEmail(e.target.value)}
                                    placeholder="e.g. ybishnugarh@gmail.com"
                                    className="h-10 rounded-xl bg-background border-border/70 text-sm font-medium"
                                />
                            </div>

                            {/* Primary Phone */}
                            <div>
                                <label className="text-xs font-bold text-foreground block mb-1.5 flex items-center gap-1.5">
                                    <PhoneCall className="size-3.5 text-primary" />
                                    Primary Phone Number <span className="text-rose-500">*</span>
                                </label>
                                <Input
                                    value={contactPhone}
                                    onChange={(e) => setContactPhone(e.target.value)}
                                    placeholder="e.g. 9934110587"
                                    className="h-10 rounded-xl bg-background border-border/70 text-sm font-medium"
                                    required
                                />
                            </div>

                            {/* Alternate Phone */}
                            <div>
                                <label className="text-xs font-bold text-foreground block mb-1.5 flex items-center gap-1.5">
                                    <PhoneCall className="size-3.5 text-muted-foreground" />
                                    Alternate Phone Number
                                </label>
                                <Input
                                    value={alternatePhone}
                                    onChange={(e) => setAlternatePhone(e.target.value)}
                                    placeholder="e.g. 9876543210"
                                    className="h-10 rounded-xl bg-background border-border/70 text-sm font-medium"
                                />
                            </div>

                            {/* Portal Access Password */}
                            <div>
                                <label className="text-xs font-bold text-foreground block mb-1.5 flex items-center gap-1.5">
                                    <KeyIcon className="size-3.5 text-primary" />
                                    Portal Password <span className="text-muted-foreground font-normal">(Optional for vendor portal login)</span>
                                </label>
                                <Input
                                    type="password"
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    placeholder={isEdit ? "Leave blank to keep existing password" : "Enter vendor login password"}
                                    className="h-10 rounded-xl bg-background border-border/70 text-sm font-medium"
                                />
                            </div>

                            {/* Office / Site Address */}
                            <div className="md:col-span-2">
                                <label className="text-xs font-bold text-foreground block mb-1.5 flex items-center gap-1.5">
                                    <MapPin className="size-3.5 text-primary" />
                                    Registered Office / Site Address
                                </label>
                                <Textarea
                                    value={address}
                                    onChange={(e) => setAddress(e.target.value)}
                                    placeholder="Enter full office address, plot number, area, or site location"
                                    className="min-h-[70px] rounded-xl bg-background border-border/70 text-sm font-medium"
                                />
                            </div>
                        </div>
                    </div>

                    {/* Operational Scope Information */}
                    <div className="p-4 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-start gap-3">
                        <BadgeCheck className="size-5 text-amber-600 dark:text-amber-400 shrink-0 mt-0.5" />
                        <div className="text-xs text-muted-foreground leading-relaxed">
                            <span className="font-bold text-foreground">Operational Scope:</span> Vendor records operate as company entities across Delivery Challans, Return Challans, Tool Allocation, and Vendor Performance Reports.
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
                        className="h-10 rounded-xl px-6 font-semibold bg-amber-600 text-white hover:bg-amber-700 gap-2 cursor-pointer shadow-sm"
                        disabled={saving}
                    >
                        {saving && <Loader2 className="size-4 animate-spin" />}
                        <span>{isEdit ? "Update Vendor Details" : "Create Vendor Record"}</span>
                        <ArrowRightIcon className="size-4" />
                    </Button>
                </div>
            </DialogContent>
        </Dialog>
    )
}

export default VendorFormModal;
