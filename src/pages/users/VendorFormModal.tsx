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
import { validateEmail, validateIndianMobile } from "@/utils/validation"

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

        if (contactPhone.trim()) {
            const phoneCheck = validateIndianMobile(contactPhone.trim(), "Primary Phone Number")
            if (!phoneCheck.isValid) {
                toast.error(phoneCheck.error || "Primary Phone Number must be a valid 10-digit Indian number starting with 6, 7, 8, or 9.")
                return
            }
        }

        if (alternatePhone.trim()) {
            const altCheck = validateIndianMobile(alternatePhone.trim(), "Alternate Phone Number")
            if (!altCheck.isValid) {
                toast.error(altCheck.error || "Alternate Phone Number must be a valid 10-digit Indian number starting with 6, 7, 8, or 9.")
                return
            }
        }

        if (contactEmail.trim()) {
            const emailCheck = validateEmail(contactEmail.trim())
            if (!emailCheck.isValid) {
                toast.error(emailCheck.error || "Please enter a valid email address.")
                return
            }
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
            <DialogContent className="max-w-3xl max-h-[90vh] flex flex-col p-0 overflow-hidden rounded-xl">
                {/* Header */}
                <DialogHeader className="px-5 py-3 border-b border-border/60 bg-muted/20 shrink-0">
                    <div className="flex items-center gap-2.5">
                        <div className="p-2 rounded-lg bg-amber-500/10 text-amber-600 dark:text-amber-400">
                            <Building2 className="size-4.5" />
                        </div>
                        <div>
                            <DialogTitle className="text-sm sm:text-base font-bold text-foreground">
                                {isEdit ? "Edit Vendor / Company Record" : "Create Vendor / Company Record"}
                            </DialogTitle>
                            <DialogDescription className="text-[11px] text-muted-foreground mt-0.5 leading-relaxed">
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
                    className="flex-1 min-h-0 overflow-y-auto p-3.5 sm:p-5 space-y-3.5 sm:space-y-4"
                >
                    {/* Section 1: Company Profile & Tax Identifiers */}
                    <div className="bg-card border border-border/60 rounded-xl p-3 sm:p-4 shadow-2xs space-y-2.5 sm:space-y-3">
                        <h3 className="text-xs font-bold text-foreground flex items-center gap-1.5 pb-1.5 border-b border-border/40">
                            <Building2 className="size-3.5 text-primary" />
                            <span>Company Profile & Business Details</span>
                        </h3>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 sm:gap-3.5">
                            {/* Company Name */}
                            <div className="md:col-span-2">
                                <label className="text-[11px] font-semibold text-foreground/90 block mb-1">
                                    Company / Vendor Name <span className="text-rose-500">*</span>
                                </label>
                                <Input
                                    value={name}
                                    onChange={(e) => setName(e.target.value)}
                                    placeholder="e.g. RADHE SWAMI CONSTRUCTION"
                                    className="h-7.5 sm:h-8 rounded-lg bg-background border-border/70 text-xs font-semibold px-2.5"
                                    required
                                />
                            </div>

                            {/* Vendor Code */}
                            <div>
                                <label className="text-[11px] font-semibold text-foreground/90 block mb-1">
                                    Vendor Code <span className="text-muted-foreground font-normal">(Auto-generated if blank)</span>
                                </label>
                                <Input
                                    value={vendorCode}
                                    onChange={(e) => setVendorCode(e.target.value)}
                                    placeholder="e.g. V-RSC01"
                                    className="h-7.5 sm:h-8 rounded-lg bg-background border-border/70 text-xs font-mono uppercase font-medium px-2.5"
                                />
                            </div>

                            {/* GST / Tax Number */}
                            <div>
                                <label className="text-[11px] font-semibold text-foreground/90 block mb-1">
                                    GST / Tax Number
                                </label>
                                <Input
                                    value={gstNumber}
                                    onChange={(e) => setGstNumber(e.target.value)}
                                    placeholder="e.g. 27AAACL0140P1Z0"
                                    className="h-7.5 sm:h-8 rounded-lg bg-background border-border/70 text-xs font-mono uppercase font-medium px-2.5"
                                />
                            </div>

                            {/* Active Status */}
                            <div>
                                <label className="text-[11px] font-semibold text-foreground/90 block mb-1">
                                    Vendor Status <span className="text-rose-500">*</span>
                                </label>
                                <Select value={status} onValueChange={(val: any) => setStatus(val)}>
                                    <SelectTrigger className="h-7.5 sm:h-8 w-full rounded-lg bg-background border-border/70 text-xs font-semibold px-2.5">
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
                    <div className="bg-card border border-border/60 rounded-xl p-3 sm:p-4 shadow-2xs space-y-2.5 sm:space-y-3">
                        <h3 className="text-xs font-bold text-foreground flex items-center gap-1.5 pb-1.5 border-b border-border/40">
                            <UserCheck className="size-3.5 text-primary" />
                            <span>Manager & Contact Information</span>
                        </h3>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 sm:gap-3.5">
                            {/* Manager / Contact Person */}
                            <div>
                                <label className="text-[11px] font-semibold text-foreground/90 block mb-1">
                                    Manager / Contact Person Name
                                </label>
                                <Input
                                    value={contactPerson}
                                    onChange={(e) => setContactPerson(e.target.value)}
                                    placeholder="e.g. Dinesh G"
                                    className="h-7.5 sm:h-8 rounded-lg bg-background border-border/70 text-xs font-medium px-2.5"
                                />
                            </div>

                            {/* Contact Person Designation */}
                            <div>
                                <label className="text-[11px] font-semibold text-foreground/90 block mb-1">
                                    Contact Designation
                                </label>
                                <Input
                                    value={contactDesignation}
                                    onChange={(e) => setContactDesignation(e.target.value)}
                                    placeholder="e.g. Site Manager / Authorized Representative"
                                    className="h-7.5 sm:h-8 rounded-lg bg-background border-border/70 text-xs font-medium px-2.5"
                                />
                            </div>

                            {/* Email Address */}
                            <div>
                                <label className="text-[11px] font-semibold text-foreground/90 block mb-1 flex items-center gap-1">
                                    <Mail className="size-3 text-primary" />
                                    <span>Company / Contact Email Address</span>
                                </label>
                                <Input
                                    type="email"
                                    value={contactEmail}
                                    onChange={(e) => setContactEmail(e.target.value)}
                                    placeholder="e.g. ybishnugarh@gmail.com"
                                    className="h-7.5 sm:h-8 rounded-lg bg-background border-border/70 text-xs font-medium px-2.5"
                                />
                            </div>

                            {/* Primary Phone */}
                            <div>
                                <label className="text-[11px] font-semibold text-foreground/90 block mb-1 flex items-center gap-1">
                                    <PhoneCall className="size-3 text-primary" />
                                    <span>Primary Phone Number</span> <span className="text-rose-500">*</span>
                                </label>
                                <Input
                                    value={contactPhone}
                                    onChange={(e) => setContactPhone(e.target.value.replace(/\D/g, '').slice(0, 10))}
                                    placeholder="e.g. 9934110587"
                                    maxLength={10}
                                    inputMode="numeric"
                                    className="h-7.5 sm:h-8 rounded-lg bg-background border-border/70 text-xs font-medium px-2.5"
                                    required
                                />
                                <p className="text-[9.5px] text-muted-foreground mt-0.5">
                                    10-digit Indian number starting with 6-9 (no country code)
                                </p>
                            </div>

                            {/* Alternate Phone */}
                            <div>
                                <label className="text-[11px] font-semibold text-foreground/90 block mb-1 flex items-center gap-1">
                                    <PhoneCall className="size-3 text-muted-foreground" />
                                    <span>Alternate Phone Number</span>
                                </label>
                                <Input
                                    value={alternatePhone}
                                    onChange={(e) => setAlternatePhone(e.target.value.replace(/\D/g, '').slice(0, 10))}
                                    placeholder="e.g. 9876543210"
                                    maxLength={10}
                                    inputMode="numeric"
                                    className="h-7.5 sm:h-8 rounded-lg bg-background border-border/70 text-xs font-medium px-2.5"
                                />
                                <p className="text-[9.5px] text-muted-foreground mt-0.5">
                                    Optional 10-digit Indian number starting with 6-9
                                </p>
                            </div>

                            {/* Portal Access Password */}
                            <div>
                                <label className="text-[11px] font-semibold text-foreground/90 block mb-1 flex items-center gap-1">
                                    <KeyIcon className="size-3 text-primary" />
                                    <span>Portal Password</span> <span className="text-muted-foreground font-normal">(Optional)</span>
                                </label>
                                <Input
                                    type="password"
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    placeholder={isEdit ? "Leave blank to keep existing password" : "Enter vendor login password"}
                                    className="h-7.5 sm:h-8 rounded-lg bg-background border-border/70 text-xs font-medium px-2.5"
                                />
                            </div>

                            {/* Office / Site Address */}
                            <div className="md:col-span-2">
                                <label className="text-[11px] font-semibold text-foreground/90 block mb-1 flex items-center gap-1">
                                    <MapPin className="size-3 text-primary" />
                                    <span>Registered Office / Site Address</span>
                                </label>
                                <Textarea
                                    value={address}
                                    onChange={(e) => setAddress(e.target.value)}
                                    placeholder="Enter full office address, plot number, area, or site location"
                                    className="min-h-[60px] rounded-lg bg-background border-border/70 text-xs font-medium p-2"
                                />
                            </div>
                        </div>
                    </div>

                    {/* Operational Scope Information */}
                    <div className="p-2.5 sm:p-3 rounded-lg bg-amber-500/10 border border-amber-500/20 flex items-start gap-2.5">
                        <BadgeCheck className="size-4 text-amber-600 dark:text-amber-400 shrink-0 mt-0.5" />
                        <div className="text-[11px] text-muted-foreground leading-relaxed">
                            <span className="font-bold text-foreground">Operational Scope:</span> Vendor records operate as company entities across Delivery Challans, Return Challans, Tool Allocation, and Vendor Performance Reports.
                        </div>
                    </div>
                </form>

                {/* Footer Action Bar */}
                <div className="p-2.5 sm:px-5 sm:py-3 border-t border-border/60 bg-muted/30 flex items-center justify-end gap-2 sm:gap-2.5 shrink-0">
                    <Button
                        type="button"
                        variant="outline"
                        onClick={onClose}
                        className="h-8 rounded-lg px-4 font-semibold text-xs cursor-pointer"
                        disabled={saving}
                    >
                        Cancel
                    </Button>
                    <Button
                        type="button"
                        onClick={handleSubmit}
                        className="h-8 rounded-lg px-4.5 font-semibold text-xs bg-amber-600 text-white hover:bg-amber-700 gap-1.5 cursor-pointer shadow-2xs"
                        disabled={saving}
                    >
                        {saving && <Loader2 className="size-3.5 animate-spin" />}
                        <span>{isEdit ? "Update Vendor Details" : "Create Vendor Record"}</span>
                        <ArrowRightIcon className="size-3.5" />
                    </Button>
                </div>
            </DialogContent>
        </Dialog>
    )
}

export default VendorFormModal;
